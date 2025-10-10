# Express.js Firebase MongoDB API

A REST API built with Express.js, Firebase Authentication, and MongoDB for user management with role-based access control.

## 🚀 Features

- **Firebase Authentication**: ID token verification and user sync
- **MongoDB Integration**: User data storage with Mongoose ODM
- **Role-Based Access**: Admin and user roles with middleware protection
- **Rate Limiting**: Protection against API abuse
- **Input Validation**: Request validation with express-validator
- **Error Handling**: Comprehensive error handling and logging
- **API Documentation**: Swagger/OpenAPI documentation
- **Security**: Helmet, CORS, and security best practices

## 📋 API Endpoints

### Authentication
- `POST /auth/register` - Register new user with email/password (returns ID token)
- `POST /auth/signin` - Sign in with email/password (returns ID token) 
- `POST /auth/login` - Login/sync user with Firebase ID token

### User Routes (Authenticated)
- `GET /users/me` - Get current user profile
- `PATCH /users/update` - Update user profile

### Admin Routes (Admin only)
- `GET /admin/users` - Get all users with pagination and filtering
- `PATCH /admin/users/:userId/toggle-status` - Enable/disable user account

### Documentation
- `GET /docs` - Swagger API documentation
- `GET /` - Health check endpoint

## 🛠️ Setup & Installation

### Prerequisites
- Node.js 18+ 
- MongoDB running locally or cloud instance
- Firebase project with Admin SDK setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Configuration
Create/update `.env` file:
```env
# Server Configuration
PORT=3000
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/express-firebase-api

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001

# API Configuration
API_BASE_URL=http://localhost:3000

# Firebase Configuration
# GOOGLE_APPLICATION_CREDENTIALS=/path/to/firebase-service-account.json
```

### 3. Firebase Setup
Either:
- Set `GOOGLE_APPLICATION_CREDENTIALS` environment variable to your service account JSON file
- Or use `firebase login` and ensure you're in a Firebase project directory

### 4. Build and Start
```bash
# Build TypeScript
npm run build

# Start server
npm run dev
# or
npm start
```

## 🔧 Development Commands

```bash
# Build TypeScript
npm run build

# Start development server
npm run dev

# Start production server
npm start
```

## 📊 Project Structure

```
src/
├── config/
│   ├── database.ts         # MongoDB connection
│   ├── firebase.ts         # Firebase Admin SDK
│   └── swagger.ts          # API documentation config
├── middleware/
│   ├── auth.ts            # Authentication & authorization
│   ├── errorHandler.ts    # Global error handling
│   └── rateLimiter.ts     # Rate limiting
├── models/
│   └── User.ts            # User MongoDB schema
├── routes/
│   ├── auth.ts           # Authentication routes
│   ├── users.ts          # User management routes
│   └── admin.ts          # Admin routes
├── types.ts              # TypeScript interfaces
├── app.ts               # Express app configuration
└── server.ts            # Server startup
```

## 🔐 Authentication Flow

### User Login Process
1. Client sends Firebase ID token to `POST /auth/login`
2. Server verifies token with Firebase Admin SDK
3. Server finds or creates user record in MongoDB
4. Server returns user data and sync status

### Subsequent API Calls
1. Client includes Firebase ID token in Authorization header: `Bearer <token>`
2. Middleware verifies token and loads MongoDB user
3. Role-based access control applied based on user role

## 📝 API Usage Examples

### Complete Authentication Flow

#### Step 1: Register New User
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "displayName": "Test User"
  }'
```

#### Step 2: Sign In Existing User  
```bash
curl -X POST http://localhost:3000/auth/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com", 
    "password": "password123"
  }'
```

#### Step 3: Use ID Token for API Calls
```bash
# Extract idToken from previous response and use it
export ID_TOKEN="your_id_token_from_step_1_or_2"

# Sync user with MongoDB (first time)
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"idToken": "'$ID_TOKEN'"}'
```

### Get User Profile
```bash
curl -X GET http://localhost:3000/users/me \
  -H "Authorization: Bearer $ID_TOKEN"
```

### Update Profile
```bash
curl -X PATCH http://localhost:3000/users/update \
  -H "Authorization: Bearer $ID_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "displayName": "John Doe",
    "profile": {
      "firstName": "John",
      "lastName": "Doe",
      "phone": "+1234567890"
    }
  }'
```

### Admin: Get All Users
```bash
curl -X GET "http://localhost:3000/admin/users?page=1&limit=20&role=user" \
  -H "Authorization: Bearer $ID_TOKEN"
```

## 🔒 Security Features

- **Rate Limiting**: 100 requests per 15 minutes for general API, 5 for auth
- **Input Validation**: All inputs validated with express-validator
- **CORS Protection**: Configurable allowed origins
- **Helmet Security**: Security headers and protection
- **Firebase Authentication**: Secure token-based authentication
- **Role-Based Access**: Middleware-protected admin routes

## 🚀 Production Deployment

### Environment Variables
Set these in production:
- `NODE_ENV=production`
- `MONGODB_URI=your-production-mongodb-uri`
- `GOOGLE_APPLICATION_CREDENTIALS=path-to-service-account`
- `ALLOWED_ORIGINS=your-frontend-domains`

### Build for Production
```bash
npm run build
npm start
```

## 📚 API Documentation

Once the server is running, visit `http://localhost:3000/docs` for interactive Swagger documentation.

## 🔍 Health Check

Visit `http://localhost:3000/` to verify the API is running.

## 🛡️ Error Handling

The API includes comprehensive error handling:
- Validation errors (400)
- Authentication errors (401)
- Authorization errors (403)
- Not found errors (404)
- Rate limit errors (429)
- Server errors (500)

All errors return a consistent format:
```json
{
  "success": false,
  "error": "ERROR_CODE",
  "message": "Human readable error message"
}
```