import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  // Server
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.string().transform(Number).default(3000),
  API_VERSION: z.string().default("v1"),

  // Database
  DATABASE_URL: z.string().optional(),
  DATABASE_HOST: z.string().default("localhost"),
  DATABASE_PORT: z.string().transform(Number).default(543),
  DATABASE_NAME: z.string().default("eco_ua_db"),
  DATABASE_USER: z.string().default("postgres"),
  DATABASE_PASSWORD: z.string().default(""),
  DATABASE_POOL_MIN: z.string().transform(Number).default(2),
  DATABASE_POOL_MAX: z.string().transform(Number).default(10),

  // Redis
  REDIS_URL: z.string().optional(),
  REDIS_HOST: z.string().default("localhost"),
  REDIS_PORT: z.string().transform(Number).default(6379),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_TTL: z.string().transform(Number).default(900),
  REDIS_DB: z.string().transform(Number).default(0),

  // External APIs
  SAVEECOBOT_API_KEY: z.string().optional(),
  SAVEECOBOT_API_URL: z.string().default("https://www.saveecobot.com/api"),
  OPENAQ_API_KEY: z.string().optional(),
  OPENAQ_API_URL: z.string().default("https://api.openaq.org/v3"),
  WAQI_API_KEY: z.string().optional(),
  WAQI_API_URL: z.string().default("https://api.waqi.info"),

  // CORS
  ALLOWED_ORIGINS: z.string().default("http://localhost:5173"),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default(900000),
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).default(100),

  // Logging
  LOG_LEVEL: z.enum(["error", "warn", "info", "debug"]).default("info"),
  LOG_FILE: z.string().default("logs/app.log"),

  // Jobs
  SYNC_SAVEECOBOT_INTERVAL: z.string().default("*/15 * * * *"),
  SYNC_OPENAQ_INTERVAL: z.string().default("*/30 * * * *"),
  CALCULATE_AGGREGATES_INTERVAL: z.string().default("0 * * * *"),

  // API Settings
  API_TIMEOUT: z.string().transform(Number).default(30000),
  MAX_RETRY_ATTEMPTS: z.string().transform(Number).default(3),
  RETRY_DELAY: z.string().transform(Number).default(1000),
});

type EnvConfig = z.infer<typeof envSchema>;

let config: EnvConfig;

try {
  config = envSchema.parse(process.env);
} catch (error) {
  console.error("❌ Invalid environment variables:", error);
  process.exit(1);
}

export const env = config;

export const isDevelopment = env.NODE_ENV === "development";
export const isProduction = env.NODE_ENV === "production";
export const isTest = env.NODE_ENV === "test";
