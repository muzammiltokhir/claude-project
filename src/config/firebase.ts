// Firebase Admin SDK configuration and initialization

import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK
// In production, use service account key or Application Default Credentials
// For local development with emulators, we can use mock credentials
if (!admin.apps.length) {
  try {
    // Try to use application default credentials first
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      projectId: 'public-api-37564',
    });
  } catch (error) {
    // If running in emulator or without credentials, use mock credentials
    console.log('Using Firebase Admin SDK with emulator/demo credentials');
    admin.initializeApp({
      projectId: 'public-api-37564',
    });
  }
}

// Export initialized services
export const auth = admin.auth();
export const firestore = admin.firestore();

// Set Firestore settings for better performance
firestore.settings({
  ignoreUndefinedProperties: true,
});

export default admin;