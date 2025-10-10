"use strict";
// Authentication middleware for Express API
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireActiveUser = exports.requireAdmin = exports.authenticateCompanyAccessCode = exports.authenticateFirebaseUser = exports.authenticateToken = void 0;
const jwt = __importStar(require("jsonwebtoken"));
const firebase_1 = require("../config/firebase");
const User_1 = require("../models/User");
/**
 * Middleware to authenticate users using either Firebase ID token or JWT access token
 * Expects Authorization header with Bearer token format: "Bearer <TOKEN>"
 * Automatically detects token type and validates accordingly
 */
const authenticateToken = async (req, res, next) => {
    try {
        // Extract Authorization header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({
                success: false,
                error: 'UNAUTHORIZED',
                message: 'Authorization header with Bearer token is required'
            });
            return;
        }
        // Extract the token
        const token = authHeader.split('Bearer ')[1];
        if (!token) {
            res.status(401).json({
                success: false,
                error: 'INVALID_TOKEN',
                message: 'Token is required in Authorization header'
            });
            return;
        }
        try {
            // Try to decode as JWT access token first
            const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-change-in-production';
            const decoded = jwt.verify(token, JWT_SECRET);
            // Verify it's an access token
            if (decoded.type === 'access_token') {
                // Find user in MongoDB
                const mongoUser = await User_1.User.findOne({ uid: decoded.uid, isActive: true });
                if (!mongoUser) {
                    res.status(401).json({
                        success: false,
                        error: 'USER_NOT_FOUND',
                        message: 'User not found or inactive'
                    });
                    return;
                }
                // Create a mock Firebase token object for compatibility
                const mockFirebaseToken = {
                    uid: decoded.uid,
                    email: decoded.email,
                    name: mongoUser.displayName,
                    picture: mongoUser.photoURL,
                    aud: '',
                    auth_time: 0,
                    exp: decoded.exp,
                    firebase: {
                        identities: {},
                        sign_in_provider: 'custom'
                    },
                    iat: decoded.iat,
                    iss: '',
                    sub: decoded.uid
                };
                // Attach both Firebase-like and MongoDB user info to the request object
                req.user = mockFirebaseToken;
                req.mongoUser = mongoUser;
                next();
                return;
            }
        }
        catch (jwtError) {
            // If JWT verification fails, try Firebase ID token verification
            try {
                // Verify the ID token with Firebase Admin SDK
                const decodedToken = await firebase_1.auth.verifyIdToken(token);
                // Find or create user in MongoDB
                let mongoUser = await User_1.User.findOne({ uid: decodedToken.uid, isActive: true });
                if (!mongoUser) {
                    // Create new user in MongoDB
                    mongoUser = new User_1.User({
                        uid: decodedToken.uid,
                        email: decodedToken.email,
                        displayName: decodedToken.name,
                        photoURL: decodedToken.picture,
                        role: User_1.UserRole.USER,
                        isActive: true,
                        lastLoginAt: new Date(),
                    });
                    await mongoUser.save();
                }
                else {
                    // Update last login for existing user
                    await mongoUser.updateLastLogin();
                }
                // Attach both Firebase and MongoDB user info to the request object
                req.user = decodedToken;
                req.mongoUser = mongoUser;
                next();
                return;
            }
            catch (firebaseError) {
                // Both token types failed
                res.status(401).json({
                    success: false,
                    error: 'INVALID_TOKEN',
                    message: 'Invalid or expired token'
                });
                return;
            }
        }
    }
    catch (error) {
        console.error('Authentication error:', error);
        res.status(401).json({
            success: false,
            error: 'AUTHENTICATION_FAILED',
            message: 'Failed to authenticate user'
        });
    }
};
exports.authenticateToken = authenticateToken;
/**
 * Legacy middleware to authenticate Firebase users using ID token only
 * Expects Authorization header with Bearer token format: "Bearer <ID_TOKEN>"
 * @deprecated Use authenticateToken instead for access token support
 */
const authenticateFirebaseUser = async (req, res, next) => {
    try {
        // Extract Authorization header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({
                success: false,
                error: 'UNAUTHORIZED',
                message: 'Authorization header with Bearer token is required'
            });
            return;
        }
        // Extract the ID token
        const idToken = authHeader.split('Bearer ')[1];
        if (!idToken) {
            res.status(401).json({
                success: false,
                error: 'INVALID_TOKEN',
                message: 'ID token is required in Authorization header'
            });
            return;
        }
        // Verify the ID token with Firebase Admin SDK
        const decodedToken = await firebase_1.auth.verifyIdToken(idToken);
        // Find or create user in MongoDB
        let mongoUser = await User_1.User.findOne({ uid: decodedToken.uid, isActive: true });
        if (!mongoUser) {
            // Create new user in MongoDB
            mongoUser = new User_1.User({
                uid: decodedToken.uid,
                email: decodedToken.email,
                displayName: decodedToken.name,
                photoURL: decodedToken.picture,
                role: User_1.UserRole.USER,
                isActive: true,
                lastLoginAt: new Date(),
            });
            await mongoUser.save();
        }
        else {
            // Update last login for existing user
            await mongoUser.updateLastLogin();
        }
        // Attach both Firebase and MongoDB user info to the request object
        req.user = decodedToken;
        req.mongoUser = mongoUser;
        next();
    }
    catch (error) {
        // Handle different types of authentication errors
        if (error instanceof Error) {
            const errorMessage = error.message.toLowerCase();
            if (errorMessage.includes('expired')) {
                res.status(401).json({
                    success: false,
                    error: 'TOKEN_EXPIRED',
                    message: 'ID token has expired'
                });
                return;
            }
            if (errorMessage.includes('invalid')) {
                res.status(401).json({
                    success: false,
                    error: 'INVALID_TOKEN',
                    message: 'Invalid ID token provided'
                });
                return;
            }
        }
        console.error('Firebase authentication error:', error);
        res.status(401).json({
            success: false,
            error: 'AUTHENTICATION_FAILED',
            message: 'Failed to authenticate user'
        });
    }
};
exports.authenticateFirebaseUser = authenticateFirebaseUser;
/**
 * Middleware to authenticate company access using access code
 * Expects x-access-code header with company access code
 */
const authenticateCompanyAccessCode = async (req, res, next) => {
    try {
        // Extract x-access-code header
        const accessCode = req.headers['x-access-code'];
        if (!accessCode) {
            res.status(401).json({
                success: false,
                error: 'MISSING_ACCESS_CODE',
                message: 'x-access-code header is required'
            });
            return;
        }
        // Query Firestore for company with matching access code
        const companiesQuery = await firebase_1.firestore
            .collection('companies')
            .where('accessCode', '==', accessCode)
            .where('isActive', '==', true)
            .limit(1)
            .get();
        // Check if company exists and is active
        if (companiesQuery.empty) {
            res.status(401).json({
                success: false,
                error: 'INVALID_ACCESS_CODE',
                message: 'Invalid or inactive access code'
            });
            return;
        }
        // Get the company document
        const companyDoc = companiesQuery.docs[0];
        const companyData = companyDoc.data();
        // Transform Firestore document to Company interface
        const company = {
            id: companyDoc.id,
            name: companyData.name,
            accessCode: companyData.accessCode,
            createdAt: companyData.createdAt.toDate(),
            updatedAt: companyData.updatedAt.toDate(),
            isActive: companyData.isActive
        };
        // Attach company info to the request object
        req.company = company;
        next();
    }
    catch (error) {
        console.error('Company authentication error:', error);
        res.status(500).json({
            success: false,
            error: 'AUTHENTICATION_ERROR',
            message: 'Failed to authenticate company access code'
        });
    }
};
exports.authenticateCompanyAccessCode = authenticateCompanyAccessCode;
/**
 * Middleware to check if authenticated user has admin role
 */
const requireAdmin = async (req, res, next) => {
    try {
        const authReq = req;
        if (!authReq.mongoUser) {
            res.status(401).json({
                success: false,
                error: 'UNAUTHORIZED',
                message: 'User authentication required'
            });
            return;
        }
        if (!authReq.mongoUser.isAdmin()) {
            res.status(403).json({
                success: false,
                error: 'FORBIDDEN',
                message: 'Admin access required'
            });
            return;
        }
        next();
    }
    catch (error) {
        console.error('Authorization error:', error);
        res.status(500).json({
            success: false,
            error: 'AUTHORIZATION_ERROR',
            message: 'Failed to check user permissions'
        });
    }
};
exports.requireAdmin = requireAdmin;
/**
 * Middleware to check if user account is active
 */
const requireActiveUser = async (req, res, next) => {
    try {
        const authReq = req;
        if (!authReq.mongoUser) {
            res.status(401).json({
                success: false,
                error: 'UNAUTHORIZED',
                message: 'User authentication required'
            });
            return;
        }
        if (!authReq.mongoUser.isActive) {
            res.status(403).json({
                success: false,
                error: 'ACCOUNT_DISABLED',
                message: 'User account is disabled'
            });
            return;
        }
        next();
    }
    catch (error) {
        console.error('User status check error:', error);
        res.status(500).json({
            success: false,
            error: 'AUTHORIZATION_ERROR',
            message: 'Failed to check user status'
        });
    }
};
exports.requireActiveUser = requireActiveUser;
//# sourceMappingURL=auth.js.map