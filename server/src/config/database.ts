import { Pool, PoolConfig } from "pg";
import { env } from "./env";
import { logger } from "../utils/logger";

const poolConfig: PoolConfig = {
  host: env.DATABASE_HOST,
  port: env.DATABASE_PORT,
  database: env.DATABASE_NAME,
  user: env.DATABASE_USER,
  password: env.DATABASE_PASSWORD,
  min: env.DATABASE_POOL_MIN,
  max: env.DATABASE_POOL_MAX,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

// Use DATABASE_URL if provided (for production environments like Railway, Render)
if (env.DATABASE_URL) {
  poolConfig.connectionString = env.DATABASE_URL;
  // For some cloud providers, SSL is required
  if (env.NODE_ENV === "production") {
    poolConfig.ssl = {
      rejectUnauthorized: false,
    };
  }
}

export const pool = new Pool(poolConfig);

// Handle pool errors
pool.on("error", (err) => {
  logger.error("Unexpected database pool error:", err);
});

pool.on("connect", () => {
  logger.debug("New database connection established");
});

// Test database connection
export async function testDatabaseConnection(): Promise<boolean> {
  try {
    const client = await pool.connect();
    const result = await client.query("SELECT NOW()");
    client.release();
    logger.info("✅ Database connection successful:", result.rows[0].now);
    return true;
  } catch (error) {
    logger.error("❌ Database connection failed:", error);
    return false;
  }
}

// Query helper with error handling
export async function query(text: string, params?: any[]) {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    logger.debug("Executed query", { text, duration, rows: result.rowCount });
    return result;
  } catch (error) {
    logger.error("Database query error:", { text, error });
    throw error;
  }
}

// Transaction helper
export async function transaction<T>(
  callback: (client: any) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

// Graceful shutdown
export async function closeDatabaseConnection(): Promise<void> {
  await pool.end();
  logger.info("Database pool closed");
}
