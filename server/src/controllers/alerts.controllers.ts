import { AlertsService } from "../services/alerts.servise";
import { Request, Response } from "express";

export class AlertsController {
  static async getActive(_req: Request, res: Response): Promise<void> {
    const alerts = await AlertsService.getActiveAlerts();

    res.json({
      success: true,
      data: alerts,
      meta: {
        count: alerts.length,
      },
    });
  }

  static async getStats(_req: Request, res: Response): Promise<void> {
    const stats = await AlertsService.getAlertStats();

    res.json({
      success: true,
      data: stats,
    });
  }

  static async checkAlerts(_req: Request, res: Response): Promise<void> {
    const alerts = await AlertsService.checkAlerts();

    res.json({
      success: true,
      data: alerts,
      meta: {
        new_alerts: alerts.length,
      },
    });
  }
}
