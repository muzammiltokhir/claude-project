# 🚀 Deployment Guide - Firebase Cloud Functions API

## 📋 Pre-Deployment Checklist

✅ **Project Configuration**
- Firebase project ID: `public-api-37564`
- `.firebaserc` file configured
- `firebase.json` configured with functions and hosting

✅ **Code Quality**
- TypeScript compilation successful
- All dependencies installed
- Swagger documentation implemented
- CORS configured
- Authentication middleware implemented

✅ **File Structure**
```
public-api/
├── src/
│   ├── config/
│   │   ├── firebase.ts        # Firebase Admin SDK
│   │   └── swagger.ts         # Swagger configuration
│   ├── middleware/
│   │   └── auth.ts           # Authentication middleware
│   ├── types.ts              # TypeScript interfaces
│   └── index.ts              # Main Express app
├── lib/                      # Compiled JavaScript (generated)
├── public/
│   └── index.html           # Landing page
├── .firebaserc              # Project configuration
├── firebase.json            # Firebase services configuration
├── package.json             # Dependencies
├── tsconfig.json            # TypeScript configuration
├── CLAUDE.md               # Claude Code instructions
└── DEPLOYMENT.md           # This file
```

## 🔧 Environment Setup Required

### 1. Firebase Authentication
For production deployment, you need to set up Firebase service account:

```bash
# Download service account key from Firebase Console
# Project Settings > Service Accounts > Generate Private Key

# Set environment variable for local testing
export GOOGLE_APPLICATION_CREDENTIALS="path/to/serviceAccountKey.json"
```

### 2. Firestore Database
Create a `companies` collection with test data:

```javascript
// Sample company document
{
  "name": "Test Company",
  "accessCode": "test-secure-access-2024",
  "isActive": true,
  "createdAt": firestore.Timestamp.now(),
  "updatedAt": firestore.Timestamp.now()
}
```

## 🚀 Deployment Commands

### Option 1: Deploy Functions Only
```bash
# Build the project
npm run build

# Deploy functions
firebase deploy --only functions

# Expected output:
# ✔ Deploy complete!
# Function URL: https://us-central1-public-api-37564.cloudfunctions.net/api
```

### Option 2: Deploy Everything (Functions + Hosting)
```bash
# Build the project
npm run build

# Deploy all services
firebase deploy

# Expected output:
# ✔ Deploy complete!
# Hosting URL: https://public-api-37564.web.app
# Function URL: https://us-central1-public-api-37564.cloudfunctions.net/api
```

### Option 3: Deploy with Custom Domain (Production)
```bash
# Deploy first
firebase deploy

# Then in Firebase Console:
# 1. Go to Hosting
# 2. Add custom domain (e.g., api.yourcompany.com)
# 3. Follow DNS verification steps
```

## 📊 Post-Deployment URLs

### Production URLs
- **API Base**: `https://us-central1-public-api-37564.cloudfunctions.net/api`
- **Health Check**: `https://us-central1-public-api-37564.cloudfunctions.net/api/`
- **Swagger Docs**: `https://us-central1-public-api-37564.cloudfunctions.net/api/docs`
- **Hosting**: `https://public-api-37564.web.app`

### Custom Domain (After Setup)
- **API**: `https://api.yourcompany.com/api`
- **Docs**: `https://api.yourcompany.com/api/docs`

## 🧪 Testing Deployed API

### Health Check
```bash
curl https://us-central1-public-api-37564.cloudfunctions.net/api/
```

### Public Endpoint (Company Access Code)
```bash
curl -X GET https://us-central1-public-api-37564.cloudfunctions.net/api/api/public \\
  -H "x-access-code: test-secure-access-2024"
```

### Private Endpoint (Firebase Auth)
```bash
curl -X GET https://us-central1-public-api-37564.cloudfunctions.net/api/api/private \\
  -H "Authorization: Bearer YOUR_FIREBASE_ID_TOKEN"
```

### Swagger Documentation
Visit: `https://us-central1-public-api-37564.cloudfunctions.net/api/docs`

## 🔍 Deployment Verification

### 1. Check Function Status
```bash
firebase functions:list
```

### 2. View Function Logs
```bash
firebase functions:log --only api
```

### 3. Monitor Performance
- Firebase Console > Functions > api
- Check invocations, errors, and performance metrics

## 🛠️ Troubleshooting

### Common Deployment Issues

#### 1. Build Errors
```bash
# Clear and reinstall dependencies
rm -rf node_modules package-lock.json
npm install
npm run build
```

#### 2. Authentication Issues
- Ensure service account key is properly configured
- Check Firebase project permissions
- Verify Firestore rules allow read/write

#### 3. Function Not Found
- Check that export name matches: `export const api = functions.https.onRequest(app)`
- Verify `firebase.json` function rewrites are correct

#### 4. CORS Issues
- Check CORS configuration in `src/index.ts`
- Verify allowed origins for production

### Environment Variables
```bash
# For local development
export GOOGLE_APPLICATION_CREDENTIALS="path/to/serviceAccountKey.json"

# For CI/CD (use Firebase CLI)
firebase functions:config:set service.key="$(cat serviceAccountKey.json)"
```

## 📈 Scaling Considerations

### Performance Optimization
- Consider using Firebase Functions v2 for better performance
- Implement caching for frequently accessed data
- Monitor cold start times

### Security
- Implement rate limiting
- Use Firebase Security Rules for Firestore
- Regularly rotate access codes
- Monitor for unauthorized access attempts

### Cost Management
- Monitor function invocations
- Set up billing alerts
- Consider using Firebase Functions pricing calculator

## 🔄 CI/CD Integration

### GitHub Actions Example
```yaml
name: Deploy to Firebase
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm run build
      - uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
          projectId: public-api-37564
```

## 📚 Additional Resources

- [Firebase Functions Documentation](https://firebase.google.com/docs/functions)
- [Firebase Hosting Custom Domains](https://firebase.google.com/docs/hosting/custom-domain)
- [Express.js Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [Swagger/OpenAPI Documentation](https://swagger.io/docs/)

## 🎯 Next Steps After Deployment

1. **Set up monitoring**: Configure alerts for errors and performance
2. **Implement analytics**: Track API usage and performance metrics
3. **Add more endpoints**: Extend the API based on business requirements
4. **Set up staging environment**: Create separate Firebase project for testing
5. **Documentation**: Keep Swagger docs updated with new features
6. **Security audit**: Regular security reviews and updates