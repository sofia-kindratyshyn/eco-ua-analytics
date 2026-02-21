import { Router } from "express";
import { RegionsController } from "../controllers/regions.controller";
import { asyncHandler } from "../middleware/errorHandler";
import { validateRequest } from "../middleware/validator";
import { z } from "zod";

const router = Router();

// Validation schemas
const createRegionSchema = {
  body: z.object({
    name: z.string().min(1).max(100),
    name_ua: z.string().min(1).max(100),
    code: z.string().min(1).max(10),
    geometry: z.any().optional(),
    population: z.number().int().positive().optional(),
  }),
};

const updateRegionSchema = {
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    name_ua: z.string().min(1).max(100).optional(),
    code: z.string().min(1).max(10).optional(),
    geometry: z.any().optional(),
    population: z.number().int().positive().optional(),
  }),
};

const idParamSchema = {
  params: z.object({
    id: z.string().regex(/^\d+$/).transform(Number),
  }),
};

const codeParamSchema = {
  params: z.object({
    code: z.string().min(1).max(10),
  }),
};

// Routes
router.get("/", asyncHandler(RegionsController.getAll));

router.get(
  "/code/:code",
  validateRequest(codeParamSchema),
  asyncHandler(RegionsController.getByCode)
);

router.get(
  "/:id",
  validateRequest(idParamSchema),
  asyncHandler(RegionsController.getById)
);

router.get(
  "/:id/stats",
  validateRequest(idParamSchema),
  asyncHandler(RegionsController.getStats)
);

router.post(
  "/",
  validateRequest(createRegionSchema),
  asyncHandler(RegionsController.create)
);

router.put(
  "/:id",
  validateRequest({ ...idParamSchema, ...updateRegionSchema }),
  asyncHandler(RegionsController.update)
);

router.delete(
  "/:id",
  validateRequest(idParamSchema),
  asyncHandler(RegionsController.delete)
);

export default router;
