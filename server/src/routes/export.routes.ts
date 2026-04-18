import { Router } from "express";
import { ExportController } from "../controllers/export.controller";
import { asyncHandler } from "../middleware/errorHandler";
import { validateRequest } from "../middleware/validator";
import { z } from "zod";

const router = Router();

const csvSchema = {
  query: z.object({
    station_id: z.string().regex(/^\d+$/).transform(Number),
    parameter: z
      .enum(["pm25", "pm10", "pm1", "no2", "co", "o3", "so2"])
      .optional(),
    days: z.string().regex(/^\d+$/).transform(Number).optional().default(7),
  }),
};

const reportSchema = {
  params: z.object({
    id: z.string().regex(/^\d+$/),
  }),
  query: z.object({
    days: z.string().regex(/^\d+$/).transform(Number).optional().default(30),
  }),
};

const comparisonSchema = {
  query: z.object({
    parameter: z
      .enum(["pm25", "pm10", "pm1", "no2", "co", "o3", "so2"])
      .optional(),
    days: z.string().regex(/^\d+$/).transform(Number).optional().default(7),
  }),
};

//GET /api/v1/export/measurements/csv
router.get(
  "/measurements/csv",
  validateRequest(csvSchema),
  asyncHandler(ExportController.exportCSV)
);

//GET /api/v1/export/station-report/:id

router.get(
  "/station-report/:id",
  validateRequest(reportSchema),
  asyncHandler(ExportController.exportStationReport)
);

//GET /api/v1/export/regional-comparison

router.get(
  "/regional-comparison",
  validateRequest(comparisonSchema),
  asyncHandler(ExportController.exportRegionalComparison)
);

export default router;
