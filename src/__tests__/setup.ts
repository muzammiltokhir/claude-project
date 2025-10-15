// Test setup file
// This file runs before all tests

// Mock environment variables for testing
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key-for-testing';
process.env.MONGODB_URI = 'mongodb://localhost:27017/test-db';

// Increase timeout for async operations
jest.setTimeout(10000);

// Global test cleanup
afterAll(async () => {
  // Add any cleanup logic here if needed
});
