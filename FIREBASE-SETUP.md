# Firebase Setup Instructions

To use the email/password authentication endpoints, you need to configure Firebase properly.

## 🔧 Firebase Project Setup

### 1. Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or use existing project
3. Enable Firebase Authentication

### 2. Enable Email/Password Authentication
1. In Firebase Console, go to **Authentication > Sign-in method**
2. Click on **Email/Password** provider
3. Enable **Email/Password** and click **Save**

### 3. Get Firebase Configuration
1. In Firebase Console, go to **Project Settings** (gear icon)
2. Scroll down to **Your apps** section
3. Click **Add app** and select **Web app** (</>) 
4. Register your app with a name
5. Copy the Firebase configuration object

### 4. Update Environment Variables
Update your `.env` file with the real Firebase configuration:

```env
# Replace these with your actual Firebase config values
FIREBASE_API_KEY=your-actual-api-key
FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_STORAGE_BUCKET=your-project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your-sender-id
FIREBASE_APP_ID=your-app-id
```

### 5. Set Up Service Account (for Admin SDK)
1. In Firebase Console, go to **Project Settings > Service accounts**
2. Click **Generate new private key**
3. Download the JSON file
4. Set the path in your environment:
   ```bash
   export GOOGLE_APPLICATION_CREDENTIALS="/path/to/your/service-account-key.json"
   ```

## 🧪 Testing the Authentication Flow

Once Firebase is properly configured, you can test the complete flow:

### 1. Register a New User
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testpassword123",
    "displayName": "Test User"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "idToken": "eyJhbGciOiJSUzI1NiIs...",
    "refreshToken": "AMf-vBwGzU9...",
    "user": {
      "uid": "firebase-user-id",
      "email": "test@example.com",
      "displayName": "Test User"
    }
  },
  "message": "User registered successfully"
}
```

### 2. Sign In Existing User
```bash
curl -X POST http://localhost:3000/auth/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testpassword123"
  }'
```

### 3. Use ID Token for Protected Routes
```bash
# Export the ID token from previous step
export ID_TOKEN="eyJhbGciOiJSUzI1NiIs..."

# Sync user with MongoDB
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"idToken": "'$ID_TOKEN'"}'

# Access user profile
curl -X GET http://localhost:3000/users/me \
  -H "Authorization: Bearer $ID_TOKEN"
```

## 🔍 Troubleshooting

### Common Issues

#### 1. "auth/api-key-not-valid" Error
- **Cause**: Using demo Firebase credentials
- **Solution**: Replace environment variables with real Firebase config values

#### 2. "auth/project-not-found" Error  
- **Cause**: Incorrect project ID
- **Solution**: Verify `FIREBASE_PROJECT_ID` matches your Firebase project

#### 3. "auth/operation-not-allowed" Error
- **Cause**: Email/password authentication not enabled
- **Solution**: Enable Email/Password provider in Firebase Console

#### 4. Service Account Issues
- **Cause**: Missing or incorrect service account configuration
- **Solution**: Download service account key and set `GOOGLE_APPLICATION_CREDENTIALS`

### Testing Without Real Firebase
If you want to test the API structure without setting up Firebase:

1. Check endpoint validation:
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "invalid-email"}'
```

2. Expected validation error:
```json
{
  "success": false,
  "error": "VALIDATION_ERROR",
  "message": "Invalid request data: Valid email is required, Password is required"
}
```

## 📝 Notes

- The demo Firebase credentials will cause authentication to fail
- You need a real Firebase project for email/password authentication to work
- The API structure and validation will work even without real Firebase credentials
- Once configured, users can register/sign in and receive real Firebase ID tokens
- ID tokens are then used for all subsequent API calls to protected endpoints