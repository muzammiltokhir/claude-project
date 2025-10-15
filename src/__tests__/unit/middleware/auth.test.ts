import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import {
  authenticateToken,
  authenticateFirebaseUser,
  requireAdmin,
  requireActiveUser
} from '../../../middleware/auth';
import { User, UserRole } from '../../../models/User';
import { auth } from '../../../config/firebase';
import { AuthenticatedRequest } from '../../../types';

// Mock dependencies
jest.mock('../../../config/firebase');
jest.mock('../../../models/User');
jest.mock('jsonwebtoken');

describe('Auth Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    mockRequest = {
      headers: {},
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    nextFunction = jest.fn();
    jest.clearAllMocks();
  });

  describe('authenticateToken', () => {
    it('should reject request without Authorization header', async () => {
      await authenticateToken(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'UNAUTHORIZED',
        message: 'Authorization header with Bearer token is required'
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should reject request with invalid Authorization header format', async () => {
      mockRequest.headers = { authorization: 'InvalidFormat token123' };

      await authenticateToken(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'UNAUTHORIZED',
        message: 'Authorization header with Bearer token is required'
      });
    });

    it('should reject request with empty token', async () => {
      mockRequest.headers = { authorization: 'Bearer ' };

      await authenticateToken(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'INVALID_TOKEN',
        message: 'Token is required in Authorization header'
      });
    });

    it('should authenticate with valid JWT access token', async () => {
      const mockToken = 'valid-jwt-token';
      const mockDecodedToken = {
        uid: 'user123',
        email: 'test@example.com',
        role: 'user',
        type: 'access_token',
        exp: Math.floor(Date.now() / 1000) + 3600,
        iat: Math.floor(Date.now() / 1000)
      };

      const mockMongoUser = {
        uid: 'user123',
        email: 'test@example.com',
        displayName: 'Test User',
        photoURL: 'https://example.com/photo.jpg',
        role: UserRole.USER,
        isActive: true
      };

      mockRequest.headers = { authorization: `Bearer ${mockToken}` };

      (jwt.verify as jest.Mock).mockReturnValue(mockDecodedToken);
      (User.findOne as jest.Mock).mockResolvedValue(mockMongoUser);

      await authenticateToken(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(jwt.verify).toHaveBeenCalledWith(mockToken, expect.any(String));
      expect(User.findOne).toHaveBeenCalledWith({ uid: 'user123', isActive: true });
      expect(nextFunction).toHaveBeenCalled();
      expect((mockRequest as AuthenticatedRequest).mongoUser).toEqual(mockMongoUser);
    });

    it('should reject JWT token if user not found in MongoDB', async () => {
      const mockToken = 'valid-jwt-token';
      const mockDecodedToken = {
        uid: 'user123',
        email: 'test@example.com',
        role: 'user',
        type: 'access_token',
        exp: Math.floor(Date.now() / 1000) + 3600,
        iat: Math.floor(Date.now() / 1000)
      };

      mockRequest.headers = { authorization: `Bearer ${mockToken}` };

      (jwt.verify as jest.Mock).mockReturnValue(mockDecodedToken);
      (User.findOne as jest.Mock).mockResolvedValue(null);

      await authenticateToken(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'USER_NOT_FOUND',
        message: 'User not found or inactive'
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should authenticate with valid Firebase ID token as fallback', async () => {
      const mockToken = 'valid-firebase-token';
      const mockDecodedFirebaseToken = {
        uid: 'firebase123',
        email: 'firebase@example.com',
        name: 'Firebase User',
        picture: 'https://example.com/pic.jpg'
      };

      const mockMongoUser = {
        uid: 'firebase123',
        email: 'firebase@example.com',
        displayName: 'Firebase User',
        role: UserRole.USER,
        isActive: true,
        updateLastLogin: jest.fn().mockResolvedValue(undefined)
      };

      mockRequest.headers = { authorization: `Bearer ${mockToken}` };

      // JWT verify fails (not a JWT token)
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('JWT verification failed');
      });

      // Firebase token verification succeeds
      (auth.verifyIdToken as jest.Mock).mockResolvedValue(mockDecodedFirebaseToken);
      (User.findOne as jest.Mock).mockResolvedValue(mockMongoUser);

      await authenticateToken(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(auth.verifyIdToken).toHaveBeenCalledWith(mockToken);
      expect(mockMongoUser.updateLastLogin).toHaveBeenCalled();
      expect(nextFunction).toHaveBeenCalled();
    });

    it('should create new user in MongoDB if Firebase token is valid but user does not exist', async () => {
      const mockToken = 'valid-firebase-token';
      const mockDecodedFirebaseToken = {
        uid: 'newuser123',
        email: 'newuser@example.com',
        name: 'New User',
        picture: 'https://example.com/new.jpg'
      };

      const mockNewUser = {
        uid: 'newuser123',
        email: 'newuser@example.com',
        displayName: 'New User',
        role: UserRole.USER,
        isActive: true,
        save: jest.fn().mockResolvedValue(undefined)
      };

      mockRequest.headers = { authorization: `Bearer ${mockToken}` };

      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('JWT verification failed');
      });

      (auth.verifyIdToken as jest.Mock).mockResolvedValue(mockDecodedFirebaseToken);
      (User.findOne as jest.Mock).mockResolvedValue(null);
      (User as any).mockImplementation(() => mockNewUser);

      await authenticateToken(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockNewUser.save).toHaveBeenCalled();
      expect(nextFunction).toHaveBeenCalled();
    });

    it('should reject if both JWT and Firebase token verification fail', async () => {
      const mockToken = 'invalid-token';

      mockRequest.headers = { authorization: `Bearer ${mockToken}` };

      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('JWT verification failed');
      });

      (auth.verifyIdToken as jest.Mock).mockRejectedValue(new Error('Firebase verification failed'));

      await authenticateToken(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'INVALID_TOKEN',
        message: 'Invalid or expired token'
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });
  });

  describe('authenticateFirebaseUser', () => {
    it('should reject request without Authorization header', async () => {
      await authenticateFirebaseUser(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'UNAUTHORIZED',
        message: 'Authorization header with Bearer token is required'
      });
    });

    it('should authenticate with valid Firebase ID token', async () => {
      const mockToken = 'valid-firebase-token';
      const mockDecodedToken = {
        uid: 'user123',
        email: 'test@example.com',
        name: 'Test User'
      };

      const mockMongoUser = {
        uid: 'user123',
        email: 'test@example.com',
        displayName: 'Test User',
        role: UserRole.USER,
        isActive: true,
        updateLastLogin: jest.fn().mockResolvedValue(undefined)
      };

      mockRequest.headers = { authorization: `Bearer ${mockToken}` };

      (auth.verifyIdToken as jest.Mock).mockResolvedValue(mockDecodedToken);
      (User.findOne as jest.Mock).mockResolvedValue(mockMongoUser);

      await authenticateFirebaseUser(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(auth.verifyIdToken).toHaveBeenCalledWith(mockToken);
      expect(nextFunction).toHaveBeenCalled();
    });

    it('should handle expired token error', async () => {
      const mockToken = 'expired-token';
      mockRequest.headers = { authorization: `Bearer ${mockToken}` };

      const error = new Error('Token has expired');
      (auth.verifyIdToken as jest.Mock).mockRejectedValue(error);

      await authenticateFirebaseUser(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'TOKEN_EXPIRED',
        message: 'ID token has expired'
      });
    });

    it('should handle invalid token error', async () => {
      const mockToken = 'invalid-token';
      mockRequest.headers = { authorization: `Bearer ${mockToken}` };

      const error = new Error('Invalid token provided');
      (auth.verifyIdToken as jest.Mock).mockRejectedValue(error);

      await authenticateFirebaseUser(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'INVALID_TOKEN',
        message: 'Invalid ID token provided'
      });
    });
  });

  describe('requireAdmin', () => {
    it('should reject if user is not authenticated', async () => {
      await requireAdmin(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'UNAUTHORIZED',
        message: 'User authentication required'
      });
    });

    it('should reject if user is not admin', async () => {
      const mockMongoUser = {
        uid: 'user123',
        role: UserRole.USER,
        isAdmin: jest.fn().mockReturnValue(false)
      };

      (mockRequest as AuthenticatedRequest).mongoUser = mockMongoUser as any;

      await requireAdmin(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'FORBIDDEN',
        message: 'Admin access required'
      });
    });

    it('should allow access if user is admin', async () => {
      const mockMongoUser = {
        uid: 'admin123',
        role: UserRole.ADMIN,
        isAdmin: jest.fn().mockReturnValue(true)
      };

      (mockRequest as AuthenticatedRequest).mongoUser = mockMongoUser as any;

      await requireAdmin(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });
  });

  describe('requireActiveUser', () => {
    it('should reject if user is not authenticated', async () => {
      await requireActiveUser(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'UNAUTHORIZED',
        message: 'User authentication required'
      });
    });

    it('should reject if user account is disabled', async () => {
      const mockMongoUser = {
        uid: 'user123',
        isActive: false
      };

      (mockRequest as AuthenticatedRequest).mongoUser = mockMongoUser as any;

      await requireActiveUser(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'ACCOUNT_DISABLED',
        message: 'User account is disabled'
      });
    });

    it('should allow access if user is active', async () => {
      const mockMongoUser = {
        uid: 'user123',
        isActive: true
      };

      (mockRequest as AuthenticatedRequest).mongoUser = mockMongoUser as any;

      await requireActiveUser(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });
  });
});
