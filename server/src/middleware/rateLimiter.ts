import rateLimit from "express-rate-limit";
import { env } from "../config/env";

// General API rate limiter
export const apiLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX_REQUESTS,
  message: {
    success: false,
    error: "Too many requests, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health check
    return req.path === "/health";
  },
});

// Strict rate limiter for resource-intensive endpoints
export const strictLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  message: {
    success: false,
    error: "Too many requests to this endpoint, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
