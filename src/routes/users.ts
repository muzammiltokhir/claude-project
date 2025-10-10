import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { authenticateToken, requireActiveUser } from '../middleware/auth';
import { AuthenticatedRequest, UpdateProfileRequest, UserResponse, ErrorResponse } from '../types';

const router = Router();

// Apply authentication middleware to all user routes
router.use(authenticateToken);
router.use(requireActiveUser);

/**
 * @swagger
 * /users/me:
 *   get:
 *     summary: Get current user profile
 *     description: Retrieve the authenticated user's profile information
 *     tags:
 *       - Users
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
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
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Account disabled
 */
router.get(
  '/me',
  async (req: Request, res: Response<UserResponse | ErrorResponse>) => {
    try {
      const authReq = req as AuthenticatedRequest;
      
      res.status(200).json({
        success: true,
        data: {
          user: authReq.mongoUser
        }
      });
    } catch (error) {
      console.error('Get user profile error:', error);
      res.status(500).json({
        success: false,
        error: 'PROFILE_FETCH_FAILED',
        message: 'Failed to retrieve user profile'
      });
    }
  }
);

/**
 * @swagger
 * /users/update:
 *   patch:
 *     summary: Update user profile
 *     description: Update the authenticated user's profile information
 *     tags:
 *       - Users
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               displayName:
 *                 type: string
 *                 description: User's display name
 *               profile:
 *                 type: object
 *                 properties:
 *                   firstName:
 *                     type: string
 *                   lastName:
 *                     type: string
 *                   phone:
 *                     type: string
 *                   address:
 *                     type: string
 *                   dateOfBirth:
 *                     type: string
 *                     format: date
 *     responses:
 *       200:
 *         description: Profile updated successfully
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
 *                 message:
 *                   type: string
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Account disabled
 */
router.patch(
  '/update',
  [
    body('displayName')
      .optional()
      .isString()
      .withMessage('Display name must be a string')
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Display name must be between 1 and 100 characters'),
    body('profile.firstName')
      .optional()
      .isString()
      .withMessage('First name must be a string')
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage('First name must be between 1 and 50 characters'),
    body('profile.lastName')
      .optional()
      .isString()
      .withMessage('Last name must be a string')
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage('Last name must be between 1 and 50 characters'),
    body('profile.phone')
      .optional()
      .isString()
      .withMessage('Phone must be a string')
      .trim()
      .matches(/^[\+]?[\d\s\-\(\)]{10,20}$/)
      .withMessage('Phone number format is invalid'),
    body('profile.address')
      .optional()
      .isString()
      .withMessage('Address must be a string')
      .trim()
      .isLength({ min: 1, max: 200 })
      .withMessage('Address must be between 1 and 200 characters'),
    body('profile.dateOfBirth')
      .optional()
      .isISO8601()
      .withMessage('Date of birth must be a valid date (YYYY-MM-DD)')
      .custom((value) => {
        const birthDate = new Date(value);
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();
        if (age < 13 || age > 120) {
          throw new Error('Age must be between 13 and 120 years');
        }
        return true;
      }),
  ],
  async (req: Request, res: Response<UserResponse | ErrorResponse>) => {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'Invalid request data: ' + errors.array().map(err => err.msg).join(', ')
        });
        return;
      }

      const authReq = req as AuthenticatedRequest;
      const updateData: UpdateProfileRequest = req.body;

      // Update user data
      if (updateData.displayName !== undefined) {
        authReq.mongoUser.displayName = updateData.displayName;
      }

      if (updateData.profile) {
        if (updateData.profile.firstName !== undefined) {
          authReq.mongoUser.profile.firstName = updateData.profile.firstName;
        }
        if (updateData.profile.lastName !== undefined) {
          authReq.mongoUser.profile.lastName = updateData.profile.lastName;
        }
        if (updateData.profile.phone !== undefined) {
          authReq.mongoUser.profile.phone = updateData.profile.phone;
        }
        if (updateData.profile.address !== undefined) {
          authReq.mongoUser.profile.address = updateData.profile.address;
        }
        if (updateData.profile.dateOfBirth !== undefined) {
          authReq.mongoUser.profile.dateOfBirth = new Date(updateData.profile.dateOfBirth);
        }
      }

      // Save updated user
      await authReq.mongoUser.save();

      res.status(200).json({
        success: true,
        data: {
          user: authReq.mongoUser
        }
      });

    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({
        success: false,
        error: 'PROFILE_UPDATE_FAILED',
        message: 'Failed to update user profile'
      });
    }
  }
);

export default router;