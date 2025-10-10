"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clientAuth = void 0;
const app_1 = require("firebase/app");
const auth_1 = require("firebase/auth");
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
const app = (0, app_1.initializeApp)(firebaseConfig);
// Initialize Firebase Authentication and get a reference to the service
exports.clientAuth = (0, auth_1.getAuth)(app);
exports.default = app;
//# sourceMappingURL=firebaseClient.js.map