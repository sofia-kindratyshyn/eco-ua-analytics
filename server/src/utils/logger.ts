import winston from "winston";
import { env, isDevelopment } from "../config/env";
import path from "path";
import fs from "fs";

// Ensure logs directory exists
const logsDir = path.dirname(env.LOG_FILE);
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Custom format for console output
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(meta).length > 0) {
      msg += ` ${JSON.stringify(meta)}`;
    }
    return msg;
  })
);

// JSON format for file output
const fileFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Create transports
const transports: winston.transport[] = [
  // Console transport
  new winston.transports.Console({
    format: consoleFormat,
    level: isDevelopment ? "debug" : env.LOG_LEVEL,
  }),
];

// File transports (only in production)
if (!isDevelopment) {
  transports.push(
    new winston.transports.File({
      filename: env.LOG_FILE,
      format: fileFormat,
      level: env.LOG_LEVEL,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: path.join(logsDir, "error.log"),
      format: fileFormat,
      level: "error",
      maxsize: 5242880,
      maxFiles: 5,
    })
  );
}

// Create logger instance
export const logger = winston.createLogger({
  level: env.LOG_LEVEL,
  format: winston.format.json(),
  transports,
  exitOnError: false,
});

// Stream for Morgan (HTTP request logging)
export const morganStream = {
  write: (message: string) => {
    logger.http(message.trim());
  },
};
