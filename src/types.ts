// TypeScript interfaces and types for the Firebase Functions API

import { Request } from 'express';
import { DecodedIdToken } from 'firebase-admin/auth';

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