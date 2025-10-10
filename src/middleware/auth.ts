// Authentication middleware for Firebase Functions API

import { Request, Response, NextFunction } from 'express';
import { auth, firestore } from '../config/firebase';
import { 
  AuthenticatedRequest, 
  CompanyAuthenticatedRequest, 
  ErrorResponse,
  Company,
  CompanyDocument 
} from '../types';

/**
 * Middleware to authenticate Firebase users using ID token
 * Expects Authorization header with Bearer token format: "Bearer <ID_TOKEN>"
 */
export const authenticateFirebaseUser = async (
  req: Request,
  res: Response<ErrorResponse>,
  next: NextFunction
): Promise<void> => {
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
    const decodedToken = await auth.verifyIdToken(idToken);
    
    // Attach the decoded user info to the request object
    (req as AuthenticatedRequest).user = decodedToken;
    
    next();
  } catch (error) {
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

/**
 * Middleware to authenticate company access using access code
 * Expects x-access-code header with company access code
 */
export const authenticateCompanyAccessCode = async (
  req: Request,
  res: Response<ErrorResponse>,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract x-access-code header
    const accessCode = req.headers['x-access-code'] as string;
    
    if (!accessCode) {
      res.status(401).json({
        success: false,
        error: 'MISSING_ACCESS_CODE',
        message: 'x-access-code header is required'
      });
      return;
    }

    // Query Firestore for company with matching access code
    const companiesQuery = await firestore
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
    const companyData = companyDoc.data() as CompanyDocument;
    
    // Transform Firestore document to Company interface
    const company: Company = {
      id: companyDoc.id,
      name: companyData.name,
      accessCode: companyData.accessCode,
      createdAt: companyData.createdAt.toDate(),
      updatedAt: companyData.updatedAt.toDate(),
      isActive: companyData.isActive
    };

    // Attach company info to the request object
    (req as CompanyAuthenticatedRequest).company = company;
    
    next();
  } catch (error) {
    console.error('Company authentication error:', error);
    res.status(500).json({
      success: false,
      error: 'AUTHENTICATION_ERROR',
      message: 'Failed to authenticate company access code'
    });
  }
};