import { Router } from "express";
import { AirQualityController } from "../controllers/airQuality.controller";
import { asyncHandler } from "../middleware/errorHandler";
import { validateRequest } from "../middleware/validator";
import { strictLimiter } from "../middleware/rateLimiter";
import { z } from "zod";

const router = Router();

// Validation schemas
const measurementsQuerySchema = {
  query: z.object({
    station_id: z.string().regex(/^\d+$/).optional(),
    region_id: z.string().regex(/^\d+$/).optional(),
    parameter: z.enum(["pm25", "pm10", "no2", "co", "o3", "so2"]).optional(),
    start_date: z.string().datetime().optional(),
    end_date: z.string().datetime().optional(),
    limit: z.string().regex(/^\d+$/).optional(),
    offset: z.string().regex(/^\d+$/).optional(),
  }),
};

// const stationIdParamSchema = {
//   params: z.object({
//     stationId: z.string().regex(/^\d+$/).transform(Number),
//   }),
// };

// const regionIdParamSchema = {
//   params: z.object({
//     regionId: z.string().regex(/^\d+$/).transform(Number),
//   }),
// };

// const latestQuerySchema = {
//   query: z.object({
//     parameter: z.enum(["pm25", "pm10", "no2", "co", "o3", "so2"]).optional(),
//   }),
// };

const averagesQuerySchema = {
  query: z.object({
    station_id: z.string().regex(/^\d+$/).optional(),
    region_id: z.string().regex(/^\d+$/).optional(),
    parameter: z.enum(["pm25", "pm10", "no2", "co", "o3", "so2"]).optional(),
    start_date: z.string().datetime(),
    end_date: z.string().datetime(),
    group_by: z.enum(["hour", "day", "week", "month"]).optional(),
  }),
};

const bulkCreateSchema = {
  body: z.object({
    measurements: z.array(
      z.object({
        station_id: z.number().int().positive(),
        measured_at: z
          .string()
          .or(z.date())
          .transform((val) => new Date(val)),
        parameter: z.enum(["pm25", "pm10", "no2", "co", "o3", "so2"]),
        value: z.number(),
        unit: z.string(),
        aqi: z.number().int().min(0).max(500).optional(),
        source: z.string(),
      })
    ),
  }),
};

// Routes
router.get(
  "/",
  validateRequest(measurementsQuerySchema),
  asyncHandler(AirQualityController.getMeasurements)
);

router.get("/summary", asyncHandler(AirQualityController.getSummary));

router.get(
  "/averages",
  validateRequest(averagesQuerySchema),
  asyncHandler(AirQualityController.getAverages)
);

router.post(
  "/bulk",
  strictLimiter, // Strict rate limiting for bulk operations
  validateRequest(bulkCreateSchema),
  asyncHandler(AirQualityController.createBulk)
);

export default router;
