"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importStar(require("./app"));
const PORT = process.env.PORT || 3000;
// Start the server
const startServer = async () => {
    try {
        // Initialize the application (database connection, etc.)
        await (0, app_1.initializeApp)();
        // Start the Express server
        const server = app_1.default.listen(PORT, () => {
            console.log(`🚀 Server is running on port ${PORT}`);
            console.log(`📚 API Documentation: http://localhost:${PORT}/docs`);
            console.log(`🔍 Health Check: http://localhost:${PORT}/`);
            console.log(`🔐 Auth Endpoint: http://localhost:${PORT}/auth/login`);
            console.log(`👤 User Endpoint: http://localhost:${PORT}/users/me`);
            console.log(`👑 Admin Endpoint: http://localhost:${PORT}/admin/users`);
        });
        // Graceful shutdown handling
        const gracefulShutdown = (signal) => {
            console.log(`\n${signal} received. Starting graceful shutdown...`);
            server.close(async (err) => {
                if (err) {
                    console.error('❌ Error during server shutdown:', err);
                    process.exit(1);
                }
                console.log('✅ Server closed successfully');
                // Close database connection
                try {
                    const mongoose = await Promise.resolve().then(() => __importStar(require('mongoose')));
                    await mongoose.disconnect();
                    console.log('✅ Database connection closed');
                }
                catch (error) {
                    console.error('❌ Error closing database connection:', error);
                }
                console.log('👋 Graceful shutdown completed');
                process.exit(0);
            });
            // Force close after 10 seconds
            setTimeout(() => {
                console.error('⚠️  Forced shutdown after 10 seconds');
                process.exit(1);
            }, 10000);
        };
        // Listen for termination signals
        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    }
    catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};
// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('UNHANDLED PROMISE REJECTION! 💥');
    console.error('Reason:', reason);
    console.error('Promise:', promise);
    process.exit(1);
});
// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('UNCAUGHT EXCEPTION! 💥');
    console.error('Error:', error.name, error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
});
// Start the server
startServer();
//# sourceMappingURL=server.js.map