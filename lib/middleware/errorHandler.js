"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.asyncHandler = exports.notFoundHandler = exports.uncaughtExceptionHandler = exports.unhandledRejectionHandler = exports.errorHandler = exports.CustomError = void 0;
class CustomError extends Error {
    constructor(message, statusCode = 500) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.CustomError = CustomError;
// Global error handler middleware
const errorHandler = (err, req, res, next) => {
    let error = Object.assign({}, err);
    error.message = err.message;
    // Log error
    console.error('Error:', {
        message: error.message,
        stack: error.stack,
        url: req.url,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent')
    });
    // Mongoose bad ObjectId
    if (err.name === 'CastError') {
        const message = 'Resource not found';
        error = new CustomError(message, 404);
    }
    // Mongoose duplicate key
    if (err.name === 'MongoServerError' && err.code === 11000) {
        const message = 'Duplicate field value entered';
        error = new CustomError(message, 400);
    }
    // Mongoose validation error
    if (err.name === 'ValidationError') {
        const message = Object.values(err.errors).map((val) => val.message).join(', ');
        error = new CustomError(message, 400);
    }
    // Firebase Auth errors
    if (err.message.includes('Firebase')) {
        error = new CustomError('Authentication failed', 401);
    }
    // JSON parsing errors
    if (err.name === 'SyntaxError' && err.message.includes('JSON')) {
        error = new CustomError('Invalid JSON format', 400);
    }
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Internal Server Error';
    res.status(statusCode).json({
        success: false,
        error: statusCode === 500 ? 'INTERNAL_SERVER_ERROR' : 'REQUEST_ERROR',
        message: process.env.NODE_ENV === 'production' && statusCode === 500
            ? 'Something went wrong'
            : message
    });
};
exports.errorHandler = errorHandler;
// Catch unhandled promise rejections
const unhandledRejectionHandler = (err) => {
    console.error('UNHANDLED PROMISE REJECTION! 💥 Shutting down...');
    console.error(err.name, err.message);
    process.exit(1);
};
exports.unhandledRejectionHandler = unhandledRejectionHandler;
// Catch uncaught exceptions
const uncaughtExceptionHandler = (err) => {
    console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
    console.error(err.name, err.message);
    process.exit(1);
};
exports.uncaughtExceptionHandler = uncaughtExceptionHandler;
// Not found middleware
const notFoundHandler = (req, res) => {
    res.status(404).json({
        success: false,
        error: 'NOT_FOUND',
        message: `Route ${req.originalUrl} not found`
    });
};
exports.notFoundHandler = notFoundHandler;
// Async error wrapper
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};
exports.asyncHandler = asyncHandler;
//# sourceMappingURL=errorHandler.js.map