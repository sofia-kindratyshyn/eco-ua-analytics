import { AlertTriangle, AlertCircle, AlertOctagon } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useDateLocale } from "../hooks/useDateLocale";
import type { UIAlert as Alert } from "../types/ui";

interface AlertCardProps {
  alert: Alert;
}

export function AlertCard({ alert }: AlertCardProps) {
  const locale = useDateLocale();

  const severityConfig = {
    warning: {
      icon: AlertTriangle,
      bg: "bg-yellow-50 dark:bg-yellow-900/20",
      border: "border-yellow-200 dark:border-yellow-700",
      iconColor: "text-yellow-600 dark:text-yellow-400",
      textColor: "text-yellow-900 dark:text-yellow-100",
    },
    danger: {
      icon: AlertCircle,
      bg: "bg-orange-50 dark:bg-orange-900/20",
      border: "border-orange-200 dark:border-orange-700",
      iconColor: "text-orange-600 dark:text-orange-400",
      textColor: "text-orange-900 dark:text-orange-100",
    },
    critical: {
      icon: AlertOctagon,
      bg: "bg-red-50 dark:bg-red-900/20",
      border: "border-red-200 dark:border-red-700",
      iconColor: "text-red-600 dark:text-red-400",
      textColor: "text-red-900 dark:text-red-100",
    },
  };

  const config = severityConfig[alert.severity];
  const Icon = config.icon;

  return (
    <div className={`rounded-lg border p-4 ${config.bg} ${config.border}`}>
      <div className="flex items-start gap-3">
        <Icon className={`h-5 w-5 mt-0.5 shrink-0 ${config.iconColor}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4 mb-1">
            <h4 className={`text-sm ${config.textColor}`} style={{ fontWeight: 600 }}>
              {alert.city}, {alert.region}
            </h4>
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {formatDistanceToNow(new Date(alert.timestamp), { addSuffix: true, locale })}
            </span>
          </div>
          <p className={`text-sm ${config.textColor} opacity-90`}>{alert.message}</p>
          <div className="mt-2">
            <span className={`text-xs px-2 py-0.5 rounded ${config.iconColor} bg-black/5 dark:bg-white/10`}>
              AQI: {alert.aqi}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
