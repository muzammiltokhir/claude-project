# Firebase Cloud Functions API with Express.js

A production-ready TypeScript Firebase Cloud Functions API using Express.js with two authentication methods:
- **Public endpoints**: Accessible with company access codes (stored in Firestore)
- **Private endpoints**: Accessible only to authenticated Firebase users

## 🚀 Features

- ✅ TypeScript support with strict typing
- ✅ Firebase Admin SDK integration
- ✅ Express.js with CORS enabled
- ✅ Two authentication middleware systems
- ✅ Production-grade error handling
- ✅ Firebase Hosting integration
- ✅ Custom domain support
- ✅ Comprehensive API documentation

## 📁 Project Structure

```
public-api/
├── src/
│   ├── config/
│   │   └── firebase.ts          # Firebase Admin SDK initialization
│   ├── middleware/
│   │   └── auth.ts              # Authentication middleware
│   ├── types.ts                 # TypeScript interfaces
│   └── index.ts                 # Main Express app and Firebase Function
├── firebase.json                # Firebase configuration
├── package.json                 # Dependencies and scripts
├── tsconfig.json               # TypeScript configuration
└── README.md                   # This file
```

## 🛠 Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Firebase Project Setup

```bash
# Install Firebase CLI globally
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase project (if not already done)
firebase init

# Select:
# - Functions: Configure and deploy Cloud Functions
# - Hosting: Configure and deploy Firebase Hosting
```

### 3. Environment Setup

For local development, set up Firebase service account:

```bash
# Download service account key from Firebase Console
# Go to Project Settings > Service Accounts > Generate Private Key

# Set environment variable
export GOOGLE_APPLICATION_CREDENTIALS="path/to/serviceAccountKey.json"
```

### 4. Firestore Setup

Create a `companies` collection in Firestore with documents like:

```javascript
// Example company document in Firestore
{
  "name": "Acme Corporation",
  "accessCode": "acme-secure-2024",
  "isActive": true,
  "createdAt": firestore.Timestamp.now(),
  "updatedAt": firestore.Timestamp.now()
}
```

## 🚀 Deployment

### Build and Deploy

```bash
# Build TypeScript
npm run build

# Deploy to Firebase
npm run deploy

# Or deploy functions only
firebase deploy --only functions

# Deploy hosting only
firebase deploy --only hosting
```

### Local Development

```bash
# Start Firebase emulators
npm run serve

# Functions will be available at:
# http://localhost:5001/YOUR-PROJECT-ID/us-central1/api
```

## 🔧 Custom Domain Setup (api.mycompany.com)

### Step 1: Configure Firebase Hosting Domain

1. Go to Firebase Console > Hosting
2. Click "Add custom domain"
3. Enter your domain: `api.mycompany.com`
4. Follow the verification steps

### Step 2: DNS Configuration

Add these DNS records to your domain provider:

```
Type: A
Name: api (or @ for root domain)
Value: (IP addresses provided by Firebase)

Type: TXT (for verification)
Name: (as provided by Firebase)
Value: (verification string from Firebase)
```

### Step 3: SSL Certificate

Firebase automatically provisions SSL certificates for custom domains.

### Step 4: Update Firebase Configuration

The `firebase.json` already includes the rewrites needed:

```json
{
  "hosting": {
    "rewrites": [
      {
        "source": "/api/**",
        "function": "api"
      }
    ]
  }
}
```

## 📡 API Endpoints

### Health Check
```bash
GET /
# Returns API status
```

### Public Endpoints (Company Access Code Required)

#### Get Public Data
```bash
curl -X GET https://api.mycompany.com/api/public \\
  -H "x-access-code: YOUR_COMPANY_ACCESS_CODE"
```

#### Post Public Data
```bash
curl -X POST https://api.mycompany.com/api/public/data \\
  -H "x-access-code: YOUR_COMPANY_ACCESS_CODE" \\
  -H "Content-Type: application/json" \\
  -d '{"message": "Hello from company"}'
```

### Private Endpoints (Firebase Authentication Required)

#### Get Private Data
```bash
curl -X GET https://api.mycompany.com/api/private \\
  -H "Authorization: Bearer YOUR_FIREBASE_ID_TOKEN"
```

#### Get User Profile
```bash
curl -X GET https://api.mycompany.com/api/private/profile \\
  -H "Authorization: Bearer YOUR_FIREBASE_ID_TOKEN"
```

## 🔐 Authentication Details

### Company Access Code Authentication

- **Header**: `x-access-code`
- **Validation**: Checks against Firestore `companies` collection
- **Requirements**: 
  - Valid access code
  - Company must be active (`isActive: true`)

### Firebase User Authentication

- **Header**: `Authorization: Bearer <ID_TOKEN>`
- **Validation**: Firebase Admin SDK verifies ID token
- **Token Source**: Firebase Authentication client SDK

### Getting Firebase ID Token (Frontend)

```javascript
// In your frontend application
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

const auth = getAuth();
const userCredential = await signInWithEmailAndPassword(auth, email, password);
const idToken = await userCredential.user.getIdToken();

// Use idToken in API calls
fetch('https://api.mycompany.com/api/private', {
  headers: {
    'Authorization': `Bearer ${idToken}`
  }
});
```

## 📊 Response Format

All endpoints return consistent JSON responses:

```typescript
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}
```

### Success Response Example
```json
{
  "success": true,
  "message": "Data retrieved successfully",
  "data": {
    "endpoint": "private",
    "user": { "uid": "...", "email": "..." },
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

### Error Response Example
```json
{
  "success": false,
  "error": "UNAUTHORIZED",
  "message": "Invalid ID token provided"
}
```

## 🔍 Error Codes

| Code | Description |
|------|-------------|
| `UNAUTHORIZED` | Missing or invalid authentication |
| `MISSING_ACCESS_CODE` | x-access-code header required |
| `INVALID_ACCESS_CODE` | Company access code not found or inactive |
| `INVALID_TOKEN` | Firebase ID token invalid |
| `TOKEN_EXPIRED` | Firebase ID token expired |
| `AUTHENTICATION_FAILED` | General authentication error |
| `NOT_FOUND` | Endpoint not found |
| `INTERNAL_SERVER_ERROR` | Unexpected server error |

## 🛡 Security Best Practices

1. **CORS Configuration**: Update CORS settings for production
2. **Access Codes**: Use secure, random access codes
3. **Token Validation**: Firebase handles token validation
4. **HTTPS Only**: Firebase Functions automatically use HTTPS
5. **Rate Limiting**: Consider implementing rate limiting for production

## 📝 Development Scripts

```bash
npm run build        # Compile TypeScript
npm run serve        # Start Firebase emulators
npm run deploy       # Deploy to Firebase
npm run logs         # View function logs
```

## 🧪 Testing

Test your endpoints using curl, Postman, or any HTTP client:

```bash
# Test health endpoint
curl https://your-region-your-project.cloudfunctions.net/api/

# Test with company access code
curl -H "x-access-code: test-code-123" \\
     https://your-region-your-project.cloudfunctions.net/api/api/public

# Test with Firebase token
curl -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..." \\
     https://your-region-your-project.cloudfunctions.net/api/api/private
```

## 📚 Additional Resources

- [Firebase Functions Documentation](https://firebase.google.com/docs/functions)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)
- [Express.js Documentation](https://expressjs.com/)
- [Firebase Hosting Custom Domains](https://firebase.google.com/docs/hosting/custom-domain)