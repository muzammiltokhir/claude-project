// Firebase Cloud Functions API with Express.js
// This API provides public and private endpoints with authentication

import * as functions from 'firebase-functions';
import express from 'express';
import cors from 'cors';
import { 
  authenticateFirebaseUser, 
  authenticateCompanyAccessCode 
} from './middleware/auth';
import { 
  AuthenticatedRequest, 
  CompanyAuthenticatedRequest, 
  ApiResponse 
} from './types';
import { specs, swaggerUi, swaggerUiOptions } from './config/swagger';

// Initialize Express app
const app = express();

// Enable CORS for all routes
// In production, configure this with specific origins for security
app.use(cors({
  origin: true, // Allow all origins in development
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-access-code'],
  credentials: true
}));

// Parse JSON bodies
app.use(express.json());

// Swagger documentation route
app.use('/docs', swaggerUi.serve, swaggerUi.setup(specs, swaggerUiOptions));

/**
 * @swagger
 * /:
 *   get:
 *     summary: Health check endpoint
 *     description: Returns API status and current timestamp
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: API is running successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         timestamp:
 *                           type: string
 *                           format: date-time
 *             example:
 *               success: true
 *               message: "Firebase Functions API is running!"
 *               timestamp: "2024-01-01T00:00:00.000Z"
 */
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Firebase Functions API is running!',
    timestamp: new Date().toISOString(),
    documentation: '/docs'
  });
});

/**
 * @swagger
 * /api/public:
 *   get:
 *     summary: Get public data with company access code
 *     description: Accessible with valid company access code stored in Firestore
 *     tags: [Public Endpoints]
 *     security:
 *       - CompanyAccessCode: []
 *     responses:
 *       200:
 *         description: Public data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         endpoint:
 *                           type: string
 *                           example: "public"
 *                         accessedBy:
 *                           $ref: '#/components/schemas/Company'
 *                         timestamp:
 *                           type: string
 *                           format: date-time
 *                         description:
 *                           type: string
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
app.get('/api/public', authenticateCompanyAccessCode, (req, res) => {
  const { company } = req as CompanyAuthenticatedRequest;
  
  const response: ApiResponse = {
    success: true,
    message: 'Public endpoint accessed successfully',
    data: {
      endpoint: 'public',
      accessedBy: {
        companyId: company.id,
        companyName: company.name
      },
      timestamp: new Date().toISOString(),
      description: 'This endpoint is accessible with a valid company access code'
    }
  };
  
  res.json(response);
});

/**
 * @swagger
 * /api/private:
 *   get:
 *     summary: Get private data for authenticated users
 *     description: Accessible only to authenticated Firebase users with valid ID token
 *     tags: [Private Endpoints]
 *     security:
 *       - FirebaseAuth: []
 *     responses:
 *       200:
 *         description: Private data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         endpoint:
 *                           type: string
 *                           example: "private"
 *                         user:
 *                           type: object
 *                           properties:
 *                             uid:
 *                               type: string
 *                             email:
 *                               type: string
 *                             emailVerified:
 *                               type: boolean
 *                             authTime:
 *                               type: string
 *                               format: date-time
 *                             issuer:
 *                               type: string
 *                             audience:
 *                               type: string
 *                         timestamp:
 *                           type: string
 *                           format: date-time
 *                         description:
 *                           type: string
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
app.get('/api/private', authenticateFirebaseUser, (req, res) => {
  const { user } = req as AuthenticatedRequest;
  
  const response: ApiResponse = {
    success: true,
    message: 'Private endpoint accessed successfully',
    data: {
      endpoint: 'private',
      user: {
        uid: user.uid,
        email: user.email,
        emailVerified: user.email_verified,
        // Include other relevant user info as needed
        authTime: new Date(user.auth_time * 1000).toISOString(),
        issuer: user.iss,
        audience: user.aud
      },
      timestamp: new Date().toISOString(),
      description: 'This endpoint is accessible only to authenticated Firebase users'
    }
  };
  
  res.json(response);
});

/**
 * @swagger
 * /api/public/data:
 *   post:
 *     summary: Submit data via public endpoint
 *     description: Post data to public endpoint with company access code authentication
 *     tags: [Public Endpoints]
 *     security:
 *       - CompanyAccessCode: []
 *     requestBody:
 *       description: Data to submit
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *                 example: "Hello from company"
 *               data:
 *                 type: object
 *                 additionalProperties: true
 *           example:
 *             message: "Hello from company"
 *             data: { "key": "value" }
 *     responses:
 *       200:
 *         description: Data received successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         endpoint:
 *                           type: string
 *                           example: "public/data"
 *                         receivedData:
 *                           type: object
 *                         processedBy:
 *                           $ref: '#/components/schemas/Company'
 *                         timestamp:
 *                           type: string
 *                           format: date-time
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
app.post('/api/public/data', authenticateCompanyAccessCode, (req, res) => {
  const { company } = req as CompanyAuthenticatedRequest;
  const requestData = req.body;
  
  const response: ApiResponse = {
    success: true,
    message: 'Data received successfully',
    data: {
      endpoint: 'public/data',
      receivedData: requestData,
      processedBy: {
        companyId: company.id,
        companyName: company.name
      },
      timestamp: new Date().toISOString()
    }
  };
  
  res.json(response);
});

/**
 * @swagger
 * /api/private/profile:
 *   get:
 *     summary: Get user profile information
 *     description: Retrieve authenticated user's profile data from Firebase token
 *     tags: [Private Endpoints]
 *     security:
 *       - FirebaseAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         endpoint:
 *                           type: string
 *                           example: "private/profile"
 *                         profile:
 *                           $ref: '#/components/schemas/UserProfile'
 *                         timestamp:
 *                           type: string
 *                           format: date-time
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
app.get('/api/private/profile', authenticateFirebaseUser, (req, res) => {
  const { user } = req as AuthenticatedRequest;
  
  const response: ApiResponse = {
    success: true,
    message: 'User profile data retrieved',
    data: {
      endpoint: 'private/profile',
      profile: {
        userId: user.uid,
        email: user.email,
        displayName: user.name || null,
        photoURL: user.picture || null,
        emailVerified: user.email_verified,
        phoneNumber: user.phone_number || null,
        provider: user.firebase.sign_in_provider,
        creationTime: user.firebase.identities ? 'Available in Firebase Console' : null
      },
      timestamp: new Date().toISOString()
    }
  };
  
  res.json(response);
});

// 404 handler for unmatched routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'NOT_FOUND',
    message: `Route ${req.method} ${req.originalUrl} not found`
  });
});

// Global error handler
app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    success: false,
    error: 'INTERNAL_SERVER_ERROR',
    message: 'An unexpected error occurred'
  });
});

// Export the Express app as a Firebase Cloud Function
export const api = functions.https.onRequest(app);