import { Router } from "express";
import { StationsController } from "../controllers/stations.controller";
import { AirQualityController } from "../controllers/airQuality.controller";
import { asyncHandler } from "../middleware/errorHandler";
import { validateRequest } from "../middleware/validator";
import { z } from "zod";

import regionsRoutes from "./regions.routes";
import stationsRoutes from "./stations.routes";
import airQualityRoutes from "./airQuality.routes";
import healthRoutes from "./health.routes";

const router = Router();

router.get("/", (_req, res) => {
  res.json({
    success: true,
    message: "UA Environment Dashboard API",
    version: "v1",
    endpoints: {
      health: "/health",
      regions: "/api/v1/regions",
      stations: "/api/v1/stations",
      airQuality: "/api/v1/air-quality",
    },
    documentation: "https://github.com/sofia-kindratyshyn/eco-ua-analytics",
  });
});

router.use("/health", healthRoutes);

const v1Router = Router();

v1Router.use("/regions", regionsRoutes);
v1Router.use("/stations", stationsRoutes);
v1Router.use("/air-quality", airQualityRoutes);

const regionIdParamSchema = {
  params: z.object({
    regionId: z.string().regex(/^\d+$/).transform(Number),
  }),
};

const stationIdParamSchema = {
  params: z.object({
    stationId: z.string().regex(/^\d+$/).transform(Number),
  }),
};

const latestQuerySchema = {
  query: z.object({
    parameter: z.enum(["pm25", "pm10", "no2", "co", "o3", "so2"]).optional(),
  }),
};

v1Router.get(
  "/regions/:regionId/stations",
  validateRequest(regionIdParamSchema),
  asyncHandler(StationsController.getByRegion)
);

v1Router.get(
  "/regions/:regionId/air-quality/latest",
  validateRequest({ ...regionIdParamSchema, ...latestQuerySchema }),
  asyncHandler(AirQualityController.getLatestByRegion)
);

v1Router.get(
  "/stations/:stationId/air-quality/latest",
  validateRequest({ ...stationIdParamSchema, ...latestQuerySchema }),
  asyncHandler(AirQualityController.getLatestByStation)
);

router.use("/api/v1", v1Router);

export default router;
