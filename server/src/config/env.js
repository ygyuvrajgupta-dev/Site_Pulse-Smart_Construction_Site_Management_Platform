import dotenv from "dotenv";

dotenv.config();

/**
 * Required environment variables that must be set.
 * If any are missing, the application will exit with an error.
 */
const requiredEnv = ["DATABASE_URL", "JWT_SECRET"];

/**
 * Validate that all required environment variables are present.
 * Exits the process with an error message if any are missing.
 */
function validateEnv() {
  const missing = requiredEnv.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.error(
      `❌ Missing required environment variables: ${missing.join(", ")}`
    );
    console.error("Please check your .env file or environment configuration.");
    process.exit(1);
  }
}

validateEnv();

/**
 * Centralized environment configuration object.
 * All environment variables are accessed through this object,
 * providing a single source of truth and type safety.
 */
const env = {
  // Server
  port: parseInt(process.env.PORT || "5000", 10),
  nodeEnv: process.env.NODE_ENV || "development",
  isProduction: process.env.NODE_ENV === "production",
  isDevelopment: process.env.NODE_ENV === "development",
  isTest: process.env.NODE_ENV === "test",

  // Database
  databaseUrl: process.env.DATABASE_URL,

  // JWT
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "1d",
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",

  // CORS
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:5173",

  // Rate Limiting
  rateLimitWindowMs: parseInt(
    process.env.RATE_LIMIT_WINDOW_MS || "900000",
    10
  ),
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || "100", 10),

      // Cookie / Proxy
  cookieSecret: process.env.COOKIE_SECRET || process.env.JWT_SECRET,
  cookieSecure: process.env.COOKIE_SECURE === "true",
  isBehindProxy: process.env.TRUST_PROXY === "true",


  // Logging
  logLevel: process.env.LOG_LEVEL || "debug",

  // API
  apiPrefix: process.env.API_PREFIX || "/api",
  apiVersion: process.env.API_VERSION || "v1",

  // Email
  emailHost: process.env.EMAIL_HOST || "smtp.gmail.com",
  emailPort: parseInt(process.env.EMAIL_PORT || "587", 10),
  emailSecure: process.env.EMAIL_SECURE === "true",
  emailUser: process.env.EMAIL_USER,
  emailPass: process.env.EMAIL_PASS,
  emailFrom: process.env.EMAIL_FROM || "noreply@sitepulse.com",

  // Frontend
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",

  // AI Configuration
  ai: {
    defaultProvider: process.env.AI_DEFAULT_PROVIDER || "openai",
    openaiApiKey: process.env.OPENAI_API_KEY,
    openaiModel: process.env.OPENAI_MODEL || "gpt-4o",
    anthropicApiKey: process.env.ANTHROPIC_API_KEY,
    anthropicModel: process.env.ANTHROPIC_MODEL || "claude-3-5-sonnet-20241022",
    googleApiKey: process.env.GOOGLE_API_KEY,
    googleModel: process.env.GOOGLE_MODEL || "gemini-1.5-pro",
    mistralApiKey: process.env.MISTRAL_API_KEY,
    mistralModel: process.env.MISTRAL_MODEL || "mistral-large-latest",
    maxTokens: parseInt(process.env.AI_MAX_TOKENS || "4096", 10),
    temperature: parseFloat(process.env.AI_TEMPERATURE || "0.7"),
    timeoutMs: parseInt(process.env.AI_TIMEOUT_MS || "30000", 10),
    enableUsageTracking: process.env.AI_ENABLE_USAGE_TRACKING !== "false",
  },

  // Billing & Payments
  billing: {
    provider: process.env.PAYMENT_PROVIDER || "both",
    razorpayKeyId: process.env.RAZORPAY_KEY_ID,
    razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET,
    razorpayWebhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET,
    razorpayCurrency: process.env.RAZORPAY_CURRENCY || "INR",
    stripeSecretKey: process.env.STRIPE_SECRET_KEY,
    stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
    stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    stripeCurrency: process.env.STRIPE_CURRENCY || "USD",
    defaultTaxRate: parseFloat(process.env.BILLING_DEFAULT_TAX_RATE || "18"),
    defaultCurrency: process.env.BILLING_DEFAULT_CURRENCY || "USD",
    autoRenewEnabled: process.env.BILLING_AUTO_RENEW_ENABLED !== "false",
    gracePeriodDays: parseInt(process.env.BILLING_GRACE_PERIOD_DAYS || "7", 10),
  },
};

export default env;
