import { createClient } from "redis";
import { env } from "./env";
import { logger } from "../utils/logger";

type RedisClient = ReturnType<typeof createClient>;

const redisConfig = {
  url: env.REDIS_URL || `redis://${env.REDIS_HOST}:${env.REDIS_PORT}`,
  password: env.REDIS_PASSWORD,
  database: env.REDIS_DB,
  socket: {
    reconnectStrategy: (retries: number) => {
      if (retries > 10) {
        logger.error("Redis max reconnection attempts reached");
        return new Error("Redis reconnection failed");
      }
      return Math.min(retries * 50, 500);
    },
  },
};

export const redisClient: RedisClient = createClient(redisConfig);

// Error handling
redisClient.on("error", (err) => {
  logger.error("Redis Client Error:", err);
});

redisClient.on("connect", () => {
  logger.info("✅ Redis connected");
});

redisClient.on("ready", () => {
  logger.info("Redis client ready");
});

redisClient.on("reconnecting", () => {
  logger.warn("Redis client reconnecting...");
});

// Connect to Redis
export async function connectRedis(): Promise<void> {
  try {
    await redisClient.connect();
    logger.info("Redis connection established");
  } catch (error) {
    logger.error("Failed to connect to Redis:", error);
    // Continue without Redis - app will work without caching
    logger.warn("⚠️  Application will continue without Redis caching");
  }
}

// Cache helpers
export const cache = {
  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      if (!redisClient.isOpen) return null;
      const value = await redisClient.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error("Cache get error:", error);
      return null;
    }
  },

  /**
   * Set value in cache with TTL
   */
  async set(
    key: string,
    value: any,
    ttl: number = env.REDIS_TTL
  ): Promise<void> {
    try {
      if (!redisClient.isOpen) return;
      await redisClient.setEx(key, ttl, JSON.stringify(value));
    } catch (error) {
      logger.error("Cache set error:", error);
    }
  },

  /**
   * Delete key from cache
   */
  async delete(key: string): Promise<void> {
    try {
      if (!redisClient.isOpen) return;
      await redisClient.del(key);
    } catch (error) {
      logger.error("Cache delete error:", error);
    }
  },

  /**
   * Delete multiple keys matching pattern
   */
  async deletePattern(pattern: string): Promise<void> {
    try {
      if (!redisClient.isOpen) return;
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        await redisClient.del(keys);
      }
    } catch (error) {
      logger.error("Cache delete pattern error:", error);
    }
  },

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    try {
      if (!redisClient.isOpen) return false;
      const exists = await redisClient.exists(key);
      return exists === 1;
    } catch (error) {
      logger.error("Cache exists error:", error);
      return false;
    }
  },

  /**
   * Get or set pattern: if key exists, return value; otherwise, execute callback and cache result
   */
  async getOrSet<T>(
    key: string,
    callback: () => Promise<T>,
    ttl: number = env.REDIS_TTL
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const result = await callback();
    await this.set(key, result, ttl);
    return result;
  },
};

// Graceful shutdown
export async function closeRedisConnection(): Promise<void> {
  if (redisClient.isOpen) {
    await redisClient.quit();
    logger.info("Redis connection closed");
  }
}
