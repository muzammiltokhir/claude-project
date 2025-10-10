import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || "demo-api-key",
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || "public-api-37564.firebaseapp.com",
  projectId: process.env.FIREBASE_PROJECT_ID || "public-api-37564",
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "public-api-37564.appspot.com",
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: process.env.FIREBASE_APP_ID || "1:123456789:web:abcdef"
};

// Initialize Firebase client app
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const clientAuth = getAuth(app);

export default app;