import app, { initializeApp } from './app';

const PORT = process.env.PORT || 3000;

// Start the server
const startServer = async (): Promise<void> => {
  try {
    // Initialize the application (database connection, etc.)
    await initializeApp();

    // Start the Express server
    const server = app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`📚 API Documentation: http://localhost:${PORT}/docs`);
      console.log(`🔍 Health Check: http://localhost:${PORT}/`);
      console.log(`🔐 Auth Endpoint: http://localhost:${PORT}/auth/login`);
      console.log(`👤 User Endpoint: http://localhost:${PORT}/users/me`);
      console.log(`👑 Admin Endpoint: http://localhost:${PORT}/admin/users`);
    });

    // Graceful shutdown handling
    const gracefulShutdown = (signal: string) => {
      console.log(`\n${signal} received. Starting graceful shutdown...`);
      
      server.close(async (err) => {
        if (err) {
          console.error('❌ Error during server shutdown:', err);
          process.exit(1);
        }
        
        console.log('✅ Server closed successfully');
        
        // Close database connection
        try {
          const mongoose = await import('mongoose');
          await mongoose.disconnect();
          console.log('✅ Database connection closed');
        } catch (error) {
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

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  console.error('UNHANDLED PROMISE REJECTION! 💥');
  console.error('Reason:', reason);
  console.error('Promise:', promise);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  console.error('UNCAUGHT EXCEPTION! 💥');
  console.error('Error:', error.name, error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
});

// Start the server
startServer();