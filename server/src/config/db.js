import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import env from "./env.js";
import logger from "./logger.js";

/**
 * Prisma 7 driver adapter for PostgreSQL.
 *
 * Prisma 7 removed the built-in query-engine binary for SQL providers:
 * a driver adapter is now required (see .agents/skills/prisma-upgrade-v7).
 * The connection string comes from env.databaseUrl (DATABASE_URL).
 * Construction is lazy — it does not open a connection until first query.
 */
const adapter = new PrismaPg({ connectionString: env.databaseUrl });

/**
 * Prisma client singleton.
 * Ensures a single database connection pool is shared across the application.
 * In production, this prevents connection exhaustion from multiple instances.
 */
let prisma;

if (env.isProduction) {
  prisma = new PrismaClient({
    log: ["error", "warn"],
    adapter,
  });
} else {
  // In development, use a global variable to prevent hot-reload from creating
  // multiple Prisma client instances (a common source of connection leaks).
  if (!global.__prisma) {
    global.__prisma = new PrismaClient({
      log: ["query", "error", "warn"],
      adapter,
    });
  }
  prisma = global.__prisma;
}

/**
 * Gracefully disconnect from the database.
 * Called on process termination to ensure clean shutdown.
 */
function disconnectDB() {
  prisma.$disconnect();
  logger.info("Database connection closed");
}

/**
 * Test the database connection.
 * @returns {Promise<boolean>} True if the connection is successful.
 */
async function testConnection() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    logger.info("Database connection established successfully");
    return true;
  } catch (error) {
    logger.error("Database connection failed", { error: error.message });
    return false;
  }
}

export { prisma, disconnectDB, testConnection };
export default prisma;
