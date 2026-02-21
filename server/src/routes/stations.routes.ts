import { Router } from "express";
import { StationsController } from "../controllers/stations.controller";
import { asyncHandler } from "../middleware/errorHandler";
import { validateRequest } from "../middleware/validator";
import { z } from "zod";

const router = Router();

// Validation schemas
const createStationSchema = {
  body: z.object({
    external_id: z.string().optional(),
    name: z.string().min(1).max(200),
    region_id: z.number().int().positive(),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    source: z.enum(["saveecobot", "openaq", "waqi"]),
    is_active: z.boolean().optional(),
    metadata: z.record(z.string(), z.any()).optional(),
  }),
};

const updateStationSchema = {
  body: z.object({
    name: z.string().min(1).max(200).optional(),
    region_id: z.number().int().positive().optional(),
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
    is_active: z.boolean().optional(),
    metadata: z.record(z.string(), z.any()).optional(),
  }),
};

const idParamSchema = {
  params: z.object({
    id: z.string().regex(/^\d+$/).transform(Number),
  }),
};

export const regionIdParamSchema = {
  params: z.object({
    regionId: z.string().regex(/^\d+$/).transform(Number),
  }),
};

const queryFiltersSchema = {
  query: z.object({
    region_id: z.string().regex(/^\d+$/).optional(),
    is_active: z.enum(["true", "false"]).optional(),
    source: z.enum(["saveecobot", "openaq", "waqi"]).optional(),
  }),
};

// Routes
router.get(
  "/",
  validateRequest(queryFiltersSchema),
  asyncHandler(StationsController.getAll)
);

router.get(
  "/:id",
  validateRequest(idParamSchema),
  asyncHandler(StationsController.getById)
);

router.get(
  "/:id/latest",
  validateRequest(idParamSchema),
  asyncHandler(StationsController.getWithLatestMeasurements)
);

router.post(
  "/",
  validateRequest(createStationSchema),
  asyncHandler(StationsController.create)
);

router.put(
  "/:id",
  validateRequest({ ...idParamSchema, ...updateStationSchema }),
  asyncHandler(StationsController.update)
);

router.delete(
  "/:id",
  validateRequest(idParamSchema),
  asyncHandler(StationsController.delete)
);

export default router;
