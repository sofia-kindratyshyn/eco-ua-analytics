import { useTranslation } from "react-i18next";
import { getAQIColor, getAQILabel } from "../aqi";

interface AQIBadgeProps {
  aqi: number;
  size?: "sm" | "md" | "lg" | "xl";
  showLabel?: boolean;
}

export function AQIBadge({ aqi, size = "md", showLabel = true }: AQIBadgeProps) {
  const { t } = useTranslation();
  const color = getAQIColor(aqi);
  const label = getAQILabel(aqi);

  const sizeClasses = {
    sm: "text-xs px-2 py-1",
    md: "text-sm px-3 py-1.5",
    lg: "text-base px-4 py-2",
    xl: "text-lg px-5 py-3",
  };

  const textColor = aqi >= 51 && aqi <= 100 ? "#000" : "#fff";

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-md ${sizeClasses[size]}`}
      style={{ backgroundColor: color, color: textColor, fontWeight: 600 }}
    >
      <span>{aqi}</span>
      {showLabel && (
        <span className="opacity-90">
          {t(`aqi_labels.${label}`, label)}
        </span>
      )}
    </div>
  );
}
