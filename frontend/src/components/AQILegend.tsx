import { useTranslation } from "react-i18next";
import { AQI_LEVELS } from "../aqi";

export function AQILegend() {
  const { t } = useTranslation();

  return (
    <div className="bg-card rounded-lg border border-border p-4">
      <h3 className="text-sm mb-3" style={{ fontWeight: 600 }}>
        {t("aqi_legend.title")}
      </h3>
      <div className="space-y-2">
        {AQI_LEVELS.map((level) => (
          <div key={level.label} className="flex items-center gap-2">
            <div className="w-6 h-6 rounded shrink-0" style={{ backgroundColor: level.color }} />
            <div className="flex-1 min-w-0">
              <div className="text-sm">{t(`aqi_labels.${level.label}`, level.label)}</div>
              <div className="text-xs text-muted-foreground">
                {level.min}–{level.max}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
