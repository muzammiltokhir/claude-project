// TypeScript interfaces and types for the API

import { Request } from 'express';
import { DecodedIdToken } from 'firebase-admin/auth';
import { IUser } from './models/User';

// Company interface for Firestore documents
export interface Company {
  id: string;
  name: string;
  accessCode: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

// Extended Request interfaces for authenticated requests
export interface AuthenticatedRequest extends Request {
  user: DecodedIdToken;
  mongoUser: IUser;
}

export interface CompanyAuthenticatedRequest extends Request {
  company: Company;
}

// Response interfaces
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Firestore company document structure (for documentation)
export interface CompanyDocument {
  name: string;
  accessCode: string;
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
  isActive: boolean;
}

// Error response interface
export interface ErrorResponse {
  success: false;
  error: string;
  message: string;
}

// Auth request bodies
export interface LoginRequest {
  idToken: string;
}

export interface EmailPasswordLoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  displayName?: string;
}

export interface UpdateProfileRequest {
  displayName?: string;
  profile?: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    address?: string;
    dateOfBirth?: string;
  };
}

// Auth responses
export interface LoginResponse {
  success: true;
  data: {
    user: IUser;
    isNewUser: boolean;
  };
  message: string;
}

export interface AuthTokenResponse {
  success: true;
  data: {
    idToken: string;
    refreshToken: string;
    user: {
      uid: string;
      email: string;
      displayName?: string;
    };
  };
  message: string;
}

export interface UserResponse {
  success: true;
  data: {
    user: IUser;
  };
}

// Access token interfaces
export interface AccessTokenPayload {
  uid: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
  type: 'access_token';
}

export interface TokenExchangeRequest {
  idToken: string;
}

export interface TokenExchangeResponse {
  success: true;
  data: {
    accessToken: string;
    expiresIn: number;
    tokenType: 'Bearer';
  };
  message: string;
}