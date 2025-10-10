# CLAUDE.md - Claude Code Instructions

This file contains instructions for Claude Code to properly build, test, and deploy the Express.js API project with Firebase Authentication and MongoDB.

## 🏗️ Project Overview

- **Project Type**: Express.js REST API with TypeScript
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: Firebase Admin SDK (ID Token verification)
- **Language**: TypeScript
- **Framework**: Express.js with comprehensive middleware stack
- **Documentation**: Swagger/OpenAPI integration

## 📋 Build Commands

### Install Dependencies
```bash
npm install
```

### Build TypeScript
```bash
npm run build
```

### Start Development Server
```bash
npm run dev
```

### Start Production Server
```bash
npm start
```

## 🧪 Testing Commands

### Local Development URLs
- **API Server**: `http://localhost:3000`
- **Health Check**: `http://localhost:3000/`
- **Swagger Docs**: `http://localhost:3000/docs`
- **Auth Endpoint**: `http://localhost:3000/auth/login`
- **User Endpoint**: `http://localhost:3000/users/me`
- **Admin Endpoint**: `http://localhost:3000/admin/users`

### Environment Configuration
Ensure `.env` file is configured:
```env
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/express-firebase-api
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
API_BASE_URL=http://localhost:3000
```

## 🔧 Development Workflow

### 1. Environment Setup
```bash
# Set up Firebase service account for authentication
export GOOGLE_APPLICATION_CREDENTIALS="path/to/serviceAccountKey.json"

# Or use Firebase login (if in Firebase project directory)
firebase login

# Ensure MongoDB is running
# Local: mongod
# Cloud: Ensure MONGODB_URI points to your cluster
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Start Development Server
```bash
npm run dev
```

### 4. Test Endpoints
```bash
# Health check
curl http://localhost:3000/

# Step 1: Register a new user (or sign in existing user)
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password123", "displayName": "Test User"}'

# Alternative: Sign in existing user
curl -X POST http://localhost:3000/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password123"}'

# Step 2: Use the returned idToken from step 1 for authenticated requests
export ID_TOKEN="<idToken_from_step_1>"

# Step 3: Sync user with MongoDB (first time)
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"idToken": "'$ID_TOKEN'"}'

# Step 4: Access protected endpoints
curl -X GET http://localhost:3000/users/me \
  -H "Authorization: Bearer $ID_TOKEN"

# Step 5: Admin endpoints (if user has admin role)
curl -X GET http://localhost:3000/admin/users \
  -H "Authorization: Bearer $ID_TOKEN"
```

## 🚀 Deployment Process

### Pre-deployment Checklist
1. ✅ Build successful: `npm run build`
2. ✅ TypeScript compilation: Check `lib/` directory exists
3. ✅ Environment variables configured for production
4. ✅ MongoDB connection string updated for production
5. ✅ Firebase service account credentials available

### Production Environment Variables
```env
NODE_ENV=production
PORT=3000
MONGODB_URI=your-production-mongodb-uri
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
ALLOWED_ORIGINS=https://yourdomain.com
API_BASE_URL=https://api.yourdomain.com
```

### Deploy Commands
```bash
# Build for production
npm run build

# Start production server
npm start
```

## 📊 API Documentation

### Swagger/OpenAPI
- **Local**: `http://localhost:3000/docs`
- **Production**: `https://your-domain.com/docs`

### Available Endpoints

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| GET | `/` | None | Health check |
| GET | `/docs` | None | Swagger documentation |
| POST | `/auth/register` | Email/Password (Body) | Register new user & get ID token |
| POST | `/auth/signin` | Email/Password (Body) | Sign in & get ID token |
| POST | `/auth/login` | Firebase ID Token (Body) | User login and sync with MongoDB |
| GET | `/users/me` | Firebase Auth | Get current user profile |
| PATCH | `/users/update` | Firebase Auth | Update user profile |
| GET | `/admin/users` | Firebase Auth (Admin) | Get all users (paginated) |
| PATCH | `/admin/users/:id/toggle-status` | Firebase Auth (Admin) | Enable/disable user |

## 🔑 Authentication Setup

### Complete Authentication Flow

#### Option 1: Register New User
1. **POST /auth/register** with email/password
2. Receive Firebase ID token in response
3. Use ID token for subsequent API calls

#### Option 2: Sign In Existing User  
1. **POST /auth/signin** with email/password
2. Receive Firebase ID token in response
3. Use ID token for subsequent API calls

#### Option 3: Direct ID Token (if you already have one)
1. **POST /auth/login** with Firebase ID token
2. User synced with MongoDB
3. Continue with API calls

#### API Authentication Process
1. Client calls `/auth/register` or `/auth/signin` with email/password
2. Server authenticates with Firebase and returns ID token
3. Client uses ID token in Authorization header for protected routes
4. Server verifies token and syncs/loads user from MongoDB
5. Role-based access control applied based on user role

### User Roles
- **user**: Default role for new users
- **admin**: Can access admin endpoints

### MongoDB User Data
Users are automatically synced from Firebase to MongoDB with this structure:
```typescript
{
  uid: string;              // Firebase UID
  email: string;            // User email
  displayName?: string;     // Display name
  photoURL?: string;        // Profile photo
  role: 'user' | 'admin';   // User role
  isActive: boolean;        // Account status
  profile: {                // Extended profile
    firstName?: string;
    lastName?: string;
    phone?: string;
    address?: string;
    dateOfBirth?: Date;
  };
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
}
```

## 🛠️ Troubleshooting

### Common Issues & Solutions

#### Build Errors
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

#### TypeScript Errors
```bash
# Check TypeScript configuration
npx tsc --noEmit

# Build and check for errors
npm run build
```

#### MongoDB Connection Issues
```bash
# Check MongoDB is running locally
mongosh --eval "db.adminCommand('ping')"

# Test connection string
node -e "const mongoose = require('mongoose'); mongoose.connect('YOUR_MONGODB_URI').then(() => console.log('Connected')).catch(e => console.error(e))"
```

#### Firebase Authentication Issues
```bash
# Check Firebase project
firebase projects:list

# Verify service account
node -e "const admin = require('firebase-admin'); admin.initializeApp({credential: admin.credential.applicationDefault()}); console.log('Firebase initialized')"
```

### Environment Variables
- `GOOGLE_APPLICATION_CREDENTIALS`: Path to Firebase service account key
- `MONGODB_URI`: MongoDB connection string
- `PORT`: Server port (default: 3000)
- `NODE_ENV`: Environment (development/production)
- `ALLOWED_ORIGINS`: CORS allowed origins

#### Firebase Client Configuration
For email/password authentication, configure these Firebase client settings:
- `FIREBASE_API_KEY`: Firebase project API key
- `FIREBASE_AUTH_DOMAIN`: Firebase auth domain (project-id.firebaseapp.com)
- `FIREBASE_PROJECT_ID`: Firebase project ID
- `FIREBASE_STORAGE_BUCKET`: Firebase storage bucket
- `FIREBASE_MESSAGING_SENDER_ID`: Firebase messaging sender ID
- `FIREBASE_APP_ID`: Firebase app ID

### File Structure
```
├── src/
│   ├── config/
│   │   ├── database.ts         # MongoDB connection
│   │   ├── firebase.ts         # Firebase Admin SDK
│   │   └── swagger.ts          # API documentation
│   ├── middleware/
│   │   ├── auth.ts            # Authentication & authorization
│   │   ├── errorHandler.ts    # Global error handling
│   │   └── rateLimiter.ts     # Rate limiting
│   ├── models/
│   │   └── User.ts            # User MongoDB schema
│   ├── routes/
│   │   ├── auth.ts           # Authentication routes
│   │   ├── users.ts          # User management routes
│   │   └── admin.ts          # Admin routes
│   ├── types.ts              # TypeScript interfaces
│   ├── app.ts               # Express app configuration
│   └── server.ts            # Server startup
├── lib/                     # Generated by TypeScript build
├── .env                     # Environment configuration
├── package.json
└── tsconfig.json
```

## 📝 Code Quality

### TypeScript Compilation
```bash
# Check for TypeScript errors
npx tsc --noEmit

# Build and check output
npm run build
ls -la lib/
```

### Code Style
- Follow existing TypeScript conventions
- Use async/await for asynchronous operations
- Implement proper error handling with try-catch
- Add JSDoc comments for Swagger documentation
- Use middleware for cross-cutting concerns

## 🛡️ Security Features

- **Rate Limiting**: Multiple levels (general, auth, admin)
- **Input Validation**: express-validator on all inputs
- **CORS Protection**: Configurable allowed origins
- **Helmet Security**: Security headers and protection
- **Firebase Authentication**: Secure token-based auth
- **Role-Based Access**: Middleware-protected routes
- **Error Handling**: Comprehensive error responses

## 🚨 Important Notes

1. **Always build before deploying**: `npm run build`
2. **Test locally first**: Use development server
3. **Monitor MongoDB usage**: User data stored in MongoDB
4. **Check logs for errors**: Server logs show detailed information
5. **Swagger docs are available**: Use `/docs` endpoint for API documentation
6. **Authentication is required**: Set up proper Firebase Auth
7. **Role-based access**: Admin endpoints require admin role

## 🔄 Quick Testing Script

```bash
#!/bin/bash
# Quick test script

echo "Building project..."
npm run build

echo "Starting server..."
npm run dev &
SERVER_PID=$!

# Wait for server to start
sleep 5

echo "Testing health endpoint..."
curl -s http://localhost:3000/ | jq .

echo "Testing Swagger docs..."
curl -s http://localhost:3000/docs | head -10

echo "Testing auth endpoint structure..."
curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{}' | jq .

# Stop server
kill $SERVER_PID

echo "Tests completed!"
```

## 📚 Additional Resources

- [Express.js Documentation](https://expressjs.com/)
- [MongoDB/Mongoose Documentation](https://mongoosejs.com/)
- [Firebase Admin SDK Documentation](https://firebase.google.com/docs/admin/setup)
- [TypeScript Documentation](https://www.typescriptlang.org/)
- [Swagger/OpenAPI Specification](https://swagger.io/specification/)

## 🔍 Migration Notes

This project was migrated from Firebase Cloud Functions to standalone Express.js for:
- Better development experience
- More flexibility in deployment options
- Simplified local development
- Enhanced middleware capabilities
- Direct MongoDB integration

See `CHANGES.md` for detailed migration information.