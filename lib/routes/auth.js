"use strict";
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
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const auth_1 = require("firebase/auth");
const jwt = __importStar(require("jsonwebtoken"));
const firebase_1 = require("../config/firebase");
const firebaseClient_1 = require("../config/firebaseClient");
const User_1 = require("../models/User");
const router = (0, express_1.Router)();
/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register new user with email and password
 *     description: Create a new Firebase user account and return ID token
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User email address
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 description: User password (minimum 6 characters)
 *               displayName:
 *                 type: string
 *                 description: Optional display name
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     idToken:
 *                       type: string
 *                       description: Firebase ID token
 *                     refreshToken:
 *                       type: string
 *                       description: Firebase refresh token
 *                     user:
 *                       type: object
 *                       properties:
 *                         uid:
 *                           type: string
 *                         email:
 *                           type: string
 *                         displayName:
 *                           type: string
 *                 message:
 *                   type: string
 *       400:
 *         description: Invalid request data
 *       409:
 *         description: User already exists
 */
router.post('/register', [
    (0, express_validator_1.body)('email')
        .isEmail()
        .withMessage('Valid email is required')
        .normalizeEmail(),
    (0, express_validator_1.body)('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long'),
    (0, express_validator_1.body)('displayName')
        .optional()
        .isString()
        .withMessage('Display name must be a string')
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage('Display name must be between 1 and 100 characters'),
], async (req, res) => {
    try {
        // Check for validation errors
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            res.status(400).json({
                success: false,
                error: 'VALIDATION_ERROR',
                message: 'Invalid request data: ' + errors.array().map(err => err.msg).join(', ')
            });
            return;
        }
        const { email, password, displayName } = req.body;
        // Create user with Firebase Auth
        const userCredential = await (0, auth_1.createUserWithEmailAndPassword)(firebaseClient_1.clientAuth, email, password);
        const user = userCredential.user;
        // Get ID token
        const idToken = await user.getIdToken();
        const refreshToken = user.refreshToken;
        // Update display name if provided
        if (displayName) {
            const { updateProfile } = await Promise.resolve().then(() => __importStar(require('firebase/auth')));
            await updateProfile(user, { displayName });
        }
        res.status(201).json({
            success: true,
            data: {
                idToken,
                refreshToken,
                user: {
                    uid: user.uid,
                    email: user.email,
                    displayName: displayName || user.displayName || undefined
                }
            },
            message: 'User registered successfully'
        });
    }
    catch (error) {
        console.error('Registration error:', error);
        if (error.code === 'auth/email-already-in-use') {
            res.status(409).json({
                success: false,
                error: 'EMAIL_ALREADY_EXISTS',
                message: 'An account with this email already exists'
            });
            return;
        }
        if (error.code === 'auth/weak-password') {
            res.status(400).json({
                success: false,
                error: 'WEAK_PASSWORD',
                message: 'Password is too weak'
            });
            return;
        }
        if (error.code === 'auth/invalid-email') {
            res.status(400).json({
                success: false,
                error: 'INVALID_EMAIL',
                message: 'Invalid email address'
            });
            return;
        }
        res.status(500).json({
            success: false,
            error: 'REGISTRATION_FAILED',
            message: 'Failed to register user'
        });
    }
});
/**
 * @swagger
 * /auth/signin:
 *   post:
 *     summary: Sign in with email and password
 *     description: Authenticate user with email/password and return ID token
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User email address
 *               password:
 *                 type: string
 *                 description: User password
 *     responses:
 *       200:
 *         description: Sign in successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     idToken:
 *                       type: string
 *                       description: Firebase ID token for API calls
 *                     refreshToken:
 *                       type: string
 *                       description: Firebase refresh token
 *                     user:
 *                       type: object
 *                       properties:
 *                         uid:
 *                           type: string
 *                         email:
 *                           type: string
 *                         displayName:
 *                           type: string
 *                 message:
 *                   type: string
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Invalid credentials
 */
router.post('/signin', [
    (0, express_validator_1.body)('email')
        .isEmail()
        .withMessage('Valid email is required')
        .normalizeEmail(),
    (0, express_validator_1.body)('password')
        .notEmpty()
        .withMessage('Password is required'),
], async (req, res) => {
    try {
        // Check for validation errors
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            res.status(400).json({
                success: false,
                error: 'VALIDATION_ERROR',
                message: 'Invalid request data: ' + errors.array().map(err => err.msg).join(', ')
            });
            return;
        }
        const { email, password } = req.body;
        // Sign in with Firebase Auth
        const userCredential = await (0, auth_1.signInWithEmailAndPassword)(firebaseClient_1.clientAuth, email, password);
        const user = userCredential.user;
        // Get ID token
        const idToken = await user.getIdToken();
        const refreshToken = user.refreshToken;
        res.status(200).json({
            success: true,
            data: {
                idToken,
                refreshToken,
                user: {
                    uid: user.uid,
                    email: user.email,
                    displayName: user.displayName || undefined
                }
            },
            message: 'Sign in successful'
        });
    }
    catch (error) {
        console.error('Sign in error:', error);
        if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
            res.status(401).json({
                success: false,
                error: 'INVALID_CREDENTIALS',
                message: 'Invalid email or password'
            });
            return;
        }
        if (error.code === 'auth/user-disabled') {
            res.status(401).json({
                success: false,
                error: 'USER_DISABLED',
                message: 'User account has been disabled'
            });
            return;
        }
        if (error.code === 'auth/too-many-requests') {
            res.status(429).json({
                success: false,
                error: 'TOO_MANY_REQUESTS',
                message: 'Too many failed attempts. Please try again later'
            });
            return;
        }
        res.status(500).json({
            success: false,
            error: 'SIGNIN_FAILED',
            message: 'Failed to sign in'
        });
    }
});
/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login with Firebase ID token
 *     description: Authenticate user with Firebase ID token and sync with MongoDB
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - idToken
 *             properties:
 *               idToken:
 *                 type: string
 *                 description: Firebase ID token
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                     isNewUser:
 *                       type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         description: Invalid request body
 *       401:
 *         description: Invalid or expired ID token
 */
router.post('/login', [
    (0, express_validator_1.body)('idToken')
        .notEmpty()
        .withMessage('ID token is required')
        .isString()
        .withMessage('ID token must be a string'),
], async (req, res) => {
    try {
        // Check for validation errors
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            res.status(400).json({
                success: false,
                error: 'VALIDATION_ERROR',
                message: 'Invalid request data: ' + errors.array().map(err => err.msg).join(', ')
            });
            return;
        }
        const { idToken } = req.body;
        // Verify Firebase ID token
        const decodedToken = await firebase_1.auth.verifyIdToken(idToken);
        // Check if user already exists in MongoDB
        let user = await User_1.User.findOne({ uid: decodedToken.uid });
        let isNewUser = false;
        if (!user) {
            // Create new user in MongoDB
            user = new User_1.User({
                uid: decodedToken.uid,
                email: decodedToken.email,
                displayName: decodedToken.name,
                photoURL: decodedToken.picture,
                role: User_1.UserRole.USER,
                isActive: true,
                lastLoginAt: new Date(),
            });
            await user.save();
            isNewUser = true;
        }
        else {
            // Update existing user's last login and sync Firebase data
            user.lastLoginAt = new Date();
            user.email = decodedToken.email || user.email;
            user.displayName = decodedToken.name || user.displayName;
            user.photoURL = decodedToken.picture || user.photoURL;
            await user.save();
        }
        res.status(200).json({
            success: true,
            data: {
                user,
                isNewUser
            },
            message: isNewUser ? 'User created and logged in successfully' : 'User logged in successfully'
        });
    }
    catch (error) {
        console.error('Login error:', error);
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
        res.status(500).json({
            success: false,
            error: 'LOGIN_FAILED',
            message: 'Failed to process login request'
        });
    }
});
/**
 * @swagger
 * /auth/token:
 *   post:
 *     summary: Exchange ID token for access token
 *     description: Convert Firebase ID token to a long-lived access token for API calls
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - idToken
 *             properties:
 *               idToken:
 *                 type: string
 *                 description: Firebase ID token to exchange
 *     responses:
 *       200:
 *         description: Token exchange successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     accessToken:
 *                       type: string
 *                       description: JWT access token for API calls
 *                     expiresIn:
 *                       type: number
 *                       description: Token expiration time in seconds
 *                     tokenType:
 *                       type: string
 *                       example: Bearer
 *                 message:
 *                   type: string
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Invalid or expired ID token
 *       500:
 *         description: Token generation failed
 */
router.post('/token', [
    (0, express_validator_1.body)('idToken')
        .notEmpty()
        .withMessage('ID token is required')
        .isString()
        .withMessage('ID token must be a string'),
], async (req, res) => {
    try {
        // Check for validation errors
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            res.status(400).json({
                success: false,
                error: 'VALIDATION_ERROR',
                message: 'Invalid request data: ' + errors.array().map(err => err.msg).join(', ')
            });
            return;
        }
        const { idToken } = req.body;
        // Verify Firebase ID token
        const decodedToken = await firebase_1.auth.verifyIdToken(idToken);
        // Find or create user in MongoDB to get role information
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
        // Check if user account is active
        if (!mongoUser.isActive) {
            res.status(401).json({
                success: false,
                error: 'ACCOUNT_DISABLED',
                message: 'User account is disabled'
            });
            return;
        }
        // Generate JWT access token
        const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-change-in-production';
        const expiresIn = 24 * 60 * 60; // 24 hours in seconds
        const payload = {
            uid: decodedToken.uid,
            email: decodedToken.email || '',
            role: mongoUser.role,
            type: 'access_token'
        };
        const accessToken = jwt.sign(payload, JWT_SECRET, {
            expiresIn,
            algorithm: 'HS256'
        });
        res.status(200).json({
            success: true,
            data: {
                accessToken,
                expiresIn,
                tokenType: 'Bearer'
            },
            message: 'Access token generated successfully'
        });
    }
    catch (error) {
        console.error('Token exchange error:', error);
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
        res.status(500).json({
            success: false,
            error: 'TOKEN_EXCHANGE_FAILED',
            message: 'Failed to generate access token'
        });
    }
});
exports.default = router;
//# sourceMappingURL=auth.js.map