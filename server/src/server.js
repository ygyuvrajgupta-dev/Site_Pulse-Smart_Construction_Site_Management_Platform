import env from "./config/env.js";
import configureApp from "./app.js";
import routes from "./routes/index.js";
import { errorHandler, AppError } from "./middleware/errorHandler.js";
import notFound from "./middleware/notFound.js";
import { prisma, testConnection, disconnectDB } from "./config/db.js";
import logger from "./config/logger.js";
import { initializeSocket } from "./socket/index.js";

/**
 * Create and configure the Express application.
 */
const app = configureApp(routes);

// ============================================
// 404 Handler — must be after all routes
// ============================================
app.use(notFound);

// ============================================
// Global Error Handler — must be last
// ============================================
app.use(errorHandler);

// ============================================
// Start Server
// ============================================
async function startServer() {
  try {
    // Test database connection
    const dbConnected = await testConnection();
    if (!dbConnected) {
      logger.error("Failed to connect to database. Exiting...");
      process.exit(1);
    }

    // Start listening
    const server = app.listen(env.port, () => {
      logger.info(`🚀 Server running in ${env.nodeEnv} mode on port ${env.port}`);
      logger.info(`📡 API available at http://localhost:${env.port}${env.apiPrefix}`);
      logger.info(`🟢 Health check at http://localhost:${env.port}/health`);
    });

    // Initialize Socket.io
    initializeSocket(server);
    logger.info('🔌 Socket.io initialized for real-time notifications');

    // Graceful shutdown handlers
    const gracefulShutdown = (signal) => {
      logger.info(`${signal} received. Closing server gracefully...`);

      server.close(async () => {
        logger.info("HTTP server closed");

        try {
          await disconnectDB();
          logger.info("Server shutdown complete");
          process.exit(0);
        } catch (error) {
          logger.error("Error during shutdown", { error: error.message });
          process.exit(1);
        }
      });
    };

    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));

    // Handle unhandled promise rejections
    process.on("unhandledRejection", (error) => {
      logger.error("Unhandled Promise Rejection", {
        error: error.message,
        stack: error.stack,
      });

      // Close server and exit
      server.close(async () => {
        await disconnectDB();
        process.exit(1);
      });
    });

    // Handle uncaught exceptions
    process.on("uncaughtException", (error) => {
      logger.error("Uncaught Exception", {
        error: error.message,
        stack: error.stack,
      });

      // Close server and exit
      server.close(async () => {
        await disconnectDB();
        process.exit(1);
      });
    });
  } catch (error) {
    logger.error("Failed to start server", {
      error: error.message,
      stack: error.stack,
    });
    process.exit(1);
  }
}

// Start the server
startServer();