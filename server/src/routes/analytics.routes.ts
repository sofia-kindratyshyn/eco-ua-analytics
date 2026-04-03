import { Router } from "express";
import { asyncHandler } from "../middleware/errorHandler";
import { AnalyticsController } from "../controllers/analytic.controller";

const analyticsRoutes = Router();

analyticsRoutes.get("/history", asyncHandler(AnalyticsController.getHistory));

analyticsRoutes.get("/compare", asyncHandler(AnalyticsController.compareRegions));

analyticsRoutes.get("/recommendations", asyncHandler(AnalyticsController.getRecommendations));

analyticsRoutes.get("/stats", asyncHandler(AnalyticsController.getOverallStats));

analyticsRoutes.get("/top-polluted", asyncHandler(AnalyticsController.getTopPolluted));

export default analyticsRoutes;