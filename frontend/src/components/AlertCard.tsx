import { AlertTriangle, AlertCircle, AlertOctagon } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { Alert } from "../aqi";

interface AlertCardProps {
  alert: Alert;
}

export function AlertCard({ alert }: AlertCardProps) {
  const severityConfig = {
    warning: {
      icon: AlertTriangle,
      bg: "bg-yellow-50",
      border: "border-yellow-200",
      iconColor: "text-yellow-600",
      textColor: "text-yellow-900",
    },
    danger: {
      icon: AlertCircle,
      bg: "bg-orange-50",
      border: "border-orange-200",
      iconColor: "text-orange-600",
      textColor: "text-orange-900",
    },
    critical: {
      icon: AlertOctagon,
      bg: "bg-red-50",
      border: "border-red-200",
      iconColor: "text-red-600",
      textColor: "text-red-900",
    },
  };

  const config = severityConfig[alert.severity];
  const Icon = config.icon;

  return (
    <div className={`rounded-lg border p-4 ${config.bg} ${config.border}`}>
      <div className="flex items-start gap-3">
        <Icon className={`h-5 w-5 mt-0.5 hrink-0 ${config.iconColor}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4 mb-1">
            <h4
              className={`text-sm ${config.textColor}`}
              style={{ fontWeight: 600 }}
            >
              {alert.city}, {alert.region}
            </h4>
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {formatDistanceToNow(new Date(alert.timestamp), {
                addSuffix: true,
              })}
            </span>
          </div>
          <p className={`text-sm ${config.textColor} opacity-90`}>
            {alert.message}
          </p>
          <div className="mt-2">
            <span
              className={`text-xs px-2 py-0.5 rounded ${config.iconColor} bg-white/50`}
            >
              AQI: {alert.aqi}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
