import { Router } from "express";
import { asyncHandler } from "../middleware/errorHandler";
import { AlertsController } from "../controllers/alerts.controllers";

const router = Router();

router.get("/", asyncHandler(AlertsController.getActive));

//GET /api/v1/alerts/stats

router.get("/stats", asyncHandler(AlertsController.getStats));

//POST/api/v1/alerts/check
router.post("/check", asyncHandler(AlertsController.checkAlerts));

export default router;
