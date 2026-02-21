import { Router } from "express";
import { HealthController } from "../controllers/health.controller";
import { asyncHandler } from "../middleware/errorHandler";

const router = Router();

// Routes
router.get("/", asyncHandler(HealthController.healthCheck));
router.get("/detailed", asyncHandler(HealthController.detailedHealthCheck));
router.get("/ready", asyncHandler(HealthController.readinessCheck));
router.get("/live", asyncHandler(HealthController.livenessCheck));

export default router;
