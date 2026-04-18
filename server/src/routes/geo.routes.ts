import { Router } from "express";
import { GeoController } from "../controllers/geo.controller";
import { asyncHandler } from "../middleware/errorHandler";
import { validateRequest } from "../middleware/validator";
import { z } from "zod";

const router = Router();

const nearbySchema = {
  query: z.object({
    lat: z.string().regex(/^-?\d+\.?\d*$/),
    lng: z.string().regex(/^-?\d+\.?\d*$/),
    radius: z
      .string()
      .regex(/^\d+\.?\d*$/)
      .optional()
      .default("50"),
  }),
};

const boundsSchema = {
  query: z.object({
    north: z.string().regex(/^-?\d+\.?\d*$/),
    south: z.string().regex(/^-?\d+\.?\d*$/),
    east: z.string().regex(/^-?\d+\.?\d*$/),
    west: z.string().regex(/^-?\d+\.?\d*$/),
  }),
};

//GET /api/v1/geo/nearby
router.get(
  "/nearby",
  validateRequest(nearbySchema),
  asyncHandler(GeoController.findNearby)
);

//GET /api/v1/geo/bounds

router.get(
  "/bounds",
  validateRequest(boundsSchema),
  asyncHandler(GeoController.findInBounds)
);

//GET /api/v1/geo/overview

router.get("/overview", asyncHandler(GeoController.getOverview));

export default router;
