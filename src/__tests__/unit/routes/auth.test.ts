import request from 'supertest';
import express, { Application } from 'express';
import authRouter from '../../../routes/auth';
import { auth } from '../../../config/firebase';
import { User, UserRole } from '../../../models/User';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  UserCredential
} from 'firebase/auth';

// Mock dependencies
jest.mock('../../../config/firebase');
jest.mock('../../../config/firebaseClient');
jest.mock('../../../models/User');
jest.mock('firebase/auth');

describe('Auth Routes', () => {
  let app: Application;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/auth', authRouter);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /auth/register', () => {
    it('should register a new user successfully', async () => {
      const mockUser = {
        uid: 'newuser123',
        email: 'newuser@example.com',
        displayName: null,
        refreshToken: 'mock-refresh-token',
        getIdToken: jest.fn().mockResolvedValue('mock-id-token')
      };

      const mockUserCredential: Partial<UserCredential> = {
        user: mockUser as any
      };

      (createUserWithEmailAndPassword as jest.Mock).mockResolvedValue(mockUserCredential);

      const response = await request(app)
        .post('/auth/register')
        .send({
          email: 'newuser@example.com',
          password: 'password123',
          displayName: 'New User'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.idToken).toBe('mock-id-token');
      expect(response.body.data.user.uid).toBe('newuser123');
      expect(response.body.message).toBe('User registered successfully');
    });

    it('should validate email format', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({
          email: 'invalid-email',
          password: 'password123'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('VALIDATION_ERROR');
    });

    it('should validate password length', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({
          email: 'test@example.com',
          password: '12345' // Less than 6 characters
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('VALIDATION_ERROR');
    });

    it('should handle email already in use error', async () => {
      const error: any = new Error('Email already in use');
      error.code = 'auth/email-already-in-use';

      (createUserWithEmailAndPassword as jest.Mock).mockRejectedValue(error);

      const response = await request(app)
        .post('/auth/register')
        .send({
          email: 'existing@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('EMAIL_ALREADY_EXISTS');
    });

    it('should handle weak password error', async () => {
      const error: any = new Error('Password is too weak');
      error.code = 'auth/weak-password';

      (createUserWithEmailAndPassword as jest.Mock).mockRejectedValue(error);

      const response = await request(app)
        .post('/auth/register')
        .send({
          email: 'test@example.com',
          password: 'weak'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('WEAK_PASSWORD');
    });

    it('should handle invalid email error', async () => {
      const error: any = new Error('Invalid email');
      error.code = 'auth/invalid-email';

      (createUserWithEmailAndPassword as jest.Mock).mockRejectedValue(error);

      const response = await request(app)
        .post('/auth/register')
        .send({
          email: 'invalid',
          password: 'password123'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('INVALID_EMAIL');
    });
  });

  describe('POST /auth/signin', () => {
    it('should sign in user successfully', async () => {
      const mockUser = {
        uid: 'user123',
        email: 'user@example.com',
        displayName: 'Test User',
        refreshToken: 'mock-refresh-token',
        getIdToken: jest.fn().mockResolvedValue('mock-id-token')
      };

      const mockUserCredential: Partial<UserCredential> = {
        user: mockUser as any
      };

      (signInWithEmailAndPassword as jest.Mock).mockResolvedValue(mockUserCredential);

      const response = await request(app)
        .post('/auth/signin')
        .send({
          email: 'user@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.idToken).toBe('mock-id-token');
      expect(response.body.message).toBe('Sign in successful');
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/auth/signin')
        .send({
          email: 'test@example.com'
          // Missing password
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('VALIDATION_ERROR');
    });

    it('should handle invalid credentials error', async () => {
      const error: any = new Error('Invalid credentials');
      error.code = 'auth/invalid-credential';

      (signInWithEmailAndPassword as jest.Mock).mockRejectedValue(error);

      const response = await request(app)
        .post('/auth/signin')
        .send({
          email: 'user@example.com',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('INVALID_CREDENTIALS');
    });

    it('should handle user disabled error', async () => {
      const error: any = new Error('User account disabled');
      error.code = 'auth/user-disabled';

      (signInWithEmailAndPassword as jest.Mock).mockRejectedValue(error);

      const response = await request(app)
        .post('/auth/signin')
        .send({
          email: 'disabled@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('USER_DISABLED');
    });

    it('should handle too many requests error', async () => {
      const error: any = new Error('Too many failed attempts');
      error.code = 'auth/too-many-requests';

      (signInWithEmailAndPassword as jest.Mock).mockRejectedValue(error);

      const response = await request(app)
        .post('/auth/signin')
        .send({
          email: 'user@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(429);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('TOO_MANY_REQUESTS');
    });
  });

  describe('POST /auth/login', () => {
    it('should login and create new user in MongoDB', async () => {
      const mockDecodedToken = {
        uid: 'newuser123',
        email: 'newuser@example.com',
        name: 'New User',
        picture: 'https://example.com/photo.jpg'
      };

      const mockUser = {
        uid: 'newuser123',
        email: 'newuser@example.com',
        displayName: 'New User',
        photoURL: 'https://example.com/photo.jpg',
        role: UserRole.USER,
        isActive: true,
        save: jest.fn().mockResolvedValue(undefined)
      };

      (auth.verifyIdToken as jest.Mock).mockResolvedValue(mockDecodedToken);
      (User.findOne as jest.Mock).mockResolvedValue(null);
      (User as any).mockImplementation(() => mockUser);

      const response = await request(app)
        .post('/auth/login')
        .send({
          idToken: 'valid-firebase-token'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.isNewUser).toBe(true);
      expect(response.body.message).toBe('User created and logged in successfully');
      expect(mockUser.save).toHaveBeenCalled();
    });

    it('should login existing user and update last login', async () => {
      const mockDecodedToken = {
        uid: 'user123',
        email: 'user@example.com',
        name: 'Test User'
      };

      const mockUser = {
        uid: 'user123',
        email: 'user@example.com',
        displayName: 'Test User',
        role: UserRole.USER,
        isActive: true,
        lastLoginAt: new Date(),
        save: jest.fn().mockResolvedValue(undefined)
      };

      (auth.verifyIdToken as jest.Mock).mockResolvedValue(mockDecodedToken);
      (User.findOne as jest.Mock).mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/auth/login')
        .send({
          idToken: 'valid-firebase-token'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.isNewUser).toBe(false);
      expect(response.body.message).toBe('User logged in successfully');
      expect(mockUser.save).toHaveBeenCalled();
    });

    it('should validate idToken is required', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('VALIDATION_ERROR');
    });

    it('should handle expired token error', async () => {
      const error = new Error('Token has expired');
      (auth.verifyIdToken as jest.Mock).mockRejectedValue(error);

      const response = await request(app)
        .post('/auth/login')
        .send({
          idToken: 'expired-token'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('TOKEN_EXPIRED');
    });

    it('should handle invalid token error', async () => {
      const error = new Error('Invalid token provided');
      (auth.verifyIdToken as jest.Mock).mockRejectedValue(error);

      const response = await request(app)
        .post('/auth/login')
        .send({
          idToken: 'invalid-token'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('INVALID_TOKEN');
    });
  });

  describe('POST /auth/token', () => {
    it('should exchange Firebase token for JWT access token', async () => {
      const mockDecodedToken = {
        uid: 'user123',
        email: 'user@example.com',
        name: 'Test User'
      };

      const mockMongoUser = {
        uid: 'user123',
        email: 'user@example.com',
        role: UserRole.USER,
        isActive: true,
        updateLastLogin: jest.fn().mockResolvedValue(undefined)
      };

      (auth.verifyIdToken as jest.Mock).mockResolvedValue(mockDecodedToken);
      (User.findOne as jest.Mock).mockResolvedValue(mockMongoUser);

      const response = await request(app)
        .post('/auth/token')
        .send({
          idToken: 'valid-firebase-token'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.tokenType).toBe('Bearer');
      expect(response.body.data.expiresIn).toBe(24 * 60 * 60); // 24 hours
      expect(mockMongoUser.updateLastLogin).toHaveBeenCalled();
    });

    it('should create new user if not exists during token exchange', async () => {
      const mockDecodedToken = {
        uid: 'newuser123',
        email: 'newuser@example.com',
        name: 'New User',
        picture: 'https://example.com/photo.jpg'
      };

      const mockNewUser = {
        uid: 'newuser123',
        email: 'newuser@example.com',
        role: UserRole.USER,
        isActive: true,
        save: jest.fn().mockResolvedValue(undefined)
      };

      (auth.verifyIdToken as jest.Mock).mockResolvedValue(mockDecodedToken);
      (User.findOne as jest.Mock).mockResolvedValue(null);
      (User as any).mockImplementation(() => mockNewUser);

      const response = await request(app)
        .post('/auth/token')
        .send({
          idToken: 'valid-firebase-token'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.accessToken).toBeDefined();
      expect(mockNewUser.save).toHaveBeenCalled();
    });

    it('should reject disabled user account', async () => {
      const mockDecodedToken = {
        uid: 'user123',
        email: 'user@example.com'
      };

      const mockMongoUser = {
        uid: 'user123',
        email: 'user@example.com',
        role: UserRole.USER,
        isActive: false
      };

      (auth.verifyIdToken as jest.Mock).mockResolvedValue(mockDecodedToken);
      (User.findOne as jest.Mock).mockResolvedValue(mockMongoUser);

      const response = await request(app)
        .post('/auth/token')
        .send({
          idToken: 'valid-firebase-token'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('ACCOUNT_DISABLED');
    });

    it('should validate idToken is required', async () => {
      const response = await request(app)
        .post('/auth/token')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('VALIDATION_ERROR');
    });

    it('should handle expired Firebase token', async () => {
      const error = new Error('Token has expired');
      (auth.verifyIdToken as jest.Mock).mockRejectedValue(error);

      const response = await request(app)
        .post('/auth/token')
        .send({
          idToken: 'expired-token'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('TOKEN_EXPIRED');
    });

    it('should handle invalid Firebase token', async () => {
      const error = new Error('Invalid token provided');
      (auth.verifyIdToken as jest.Mock).mockRejectedValue(error);

      const response = await request(app)
        .post('/auth/token')
        .send({
          idToken: 'invalid-token'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('INVALID_TOKEN');
    });
  });
});
