import express from "express";
import env from "./config/env.js";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import logger from "./config/logger.js";

/**
 * Configure and return the Express application.
 * This function centralizes all middleware configuration.
 *
 * @param {Router} routes - The routes to mount.
 * @returns {express.Application} Configured Express application.
 */
function configureApp(routes) {
  const app = express();

  // Trust the reverse proxy (Nginx) so req.ip / req.protocol are correct
  // and secure cookies work when COOKIE_SECURE=true.
  app.set("trust proxy", env.isBehindProxy ? 1 : false);

  // ============================================
  // Security Middleware
  // ============================================

  // Helmet — sets various HTTP headers for security
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
      crossOriginEmbedderPolicy: false, // Required for some frontend apps
    })
  );

  // CORS — Cross-Origin Resource Sharing
  const corsOptions = {
    origin: env.corsOrigin,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    maxAge: 86400, // 24 hours
  };

  app.use(cors(corsOptions));

  // Handle preflight requests
  app.options("*", cors(corsOptions));

  // ============================================
  // Body Parsing Middleware
  // ============================================

  // JSON body parser with size limits
  app.use(express.json({ limit: "10kb" }));

  // URL-encoded body parser
  app.use(express.urlencoded({ extended: true, limit: "10kb" }));

  // ============================================
  // Cookie Parser
  // ============================================
  app.use(cookieParser(env.cookieSecret));

  // ============================================
  // Compression
  // ============================================
  app.use(compression());

  // ============================================
  // Rate Limiting
  // ============================================
  const limiter = rateLimit({
    windowMs: env.rateLimitWindowMs,
    max: env.rateLimitMax,
    message: {
      success: false,
      message: "Too many requests. Please try again later.",
    },
    standardHeaders: true,
    legacyHeaders: false,
  });

  app.use(limiter);

  // ============================================
  // Logging
  // ============================================
  if (env.isDevelopment) {
    app.use(
      morgan("dev", {
        stream: {
          write: (message) => logger.info(message.trim()),
        },
      })
    );
  } else {
    app.use(
      morgan("combined", {
        stream: {
          write: (message) => logger.info(message.trim()),
        },
      })
    );
  }

  // ============================================
  // Routes
  // ============================================
  app.use(env.apiPrefix, routes);

  // ============================================
  // Health check at root level
  // ============================================
  app.get("/health", (req, res) => {
    res.status(200).json({
      success: true,
      message: "Server is healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  return app;
}

export default configureApp;