import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import { Download } from "lucide-react";
import { useTranslation } from "react-i18next";
import { getAQIColor, getAQILabel } from "../aqi";
import { CityCard } from "../components/CityCard";
import { SEOMeta } from "../components/SEOMeta";
import { useStations } from "../hooks/useApiData";

function downloadCSV(filename: string, content: string) {
  const blob = new Blob(["﻿" + content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function AnalyticsPage() {
  const { t } = useTranslation();
  const { stations, loading, error } = useStations();

  const sortedStations = [...stations].sort((a, b) => b.aqi - a.aqi);

  function handleDownload() {
    const headers = ["City", "Region", "AQI", "Status", "PM2.5 (µg/m³)", "PM10 (µg/m³)", "NO2 (µg/m³)", "O3 (µg/m³)", "SO2 (µg/m³)", "CO (ppm)"];
    const rows = sortedStations.map((s) => [
      `"${s.city}"`, `"${s.region}"`, s.aqi, `"${getAQILabel(s.aqi)}"`,
      s.pm25, s.pm10, s.no2, s.o3, s.so2, s.co,
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    downloadCSV(`air-quality-report-${new Date().toISOString().split("T")[0]}.csv`, csv);
  }

  const chartData = sortedStations.map((s) => ({ name: s.city, aqi: s.aqi, pm25: s.pm25 }));

  const regionalStats = stations.reduce(
    (acc, s) => {
      if (!acc[s.region]) acc[s.region] = { count: 0, totalAqi: 0 };
      acc[s.region].count++;
      acc[s.region].totalAqi += s.aqi;
      return acc;
    },
    {} as Record<string, { count: number; totalAqi: number }>
  );

  const regionalData = Object.entries(regionalStats)
    .map(([region, stats]) => ({
      region: region.replace(" Oblast", "").replace(" область", ""),
      averageAqi: Math.round(stats.totalAqi / stats.count),
      stations: stats.count,
    }))
    .sort((a, b) => b.averageAqi - a.averageAqi);

  const tooltipStyle = {
    backgroundColor: "var(--card)",
    border: "1px solid var(--border)",
    borderRadius: "8px",
    color: "var(--card-foreground)",
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <SEOMeta
        title={t("seo.analytics.title")}
        description={t("seo.analytics.description")}
        path="/analytics"
        schema={{
          "@type": "DataCatalog",
          "name": "Ukraine Air Quality Analytics",
          "description": "Aggregated air quality measurements from monitoring stations across Ukraine",
          "url": "https://airquality.ua/analytics",
        }}
      />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
            <div>
              <h1 className="text-3xl mb-2">{t("analytics.title")}</h1>
              <p className="text-muted-foreground">{t("analytics.subtitle")}</p>
            </div>
            <button
              onClick={handleDownload}
              disabled={loading || stations.length === 0}
              className="px-4 py-2 text-sm border border-border rounded-md hover:bg-muted transition-colors flex items-center gap-2 w-fit disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="h-4 w-4" />
              {t("analytics.download_report")}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6 text-sm text-red-800 dark:text-red-300">
            {t("analytics.error_prefix")}{error}
          </div>
        )}

        {loading ? (
          <div className="text-muted-foreground text-sm py-12 text-center">{t("analytics.loading")}</div>
        ) : (
          <>
            <div className="bg-card rounded-lg border border-border p-6 mb-6">
              <h2 className="text-xl mb-4">{t("analytics.city_comparison")}</h2>
              {chartData.length === 0 ? (
                <p className="text-muted-foreground text-sm">{t("analytics.no_data")}</p>
              ) : (
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} angle={-45} textAnchor="end" height={80} />
                      <YAxis tick={{ fontSize: 12 }} label={{ value: "AQI", angle: -90, position: "insideLeft" }} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Bar dataKey="aqi" name="AQI">
                        {chartData.map((entry, i) => (
                          <Cell key={`cell-${i}`} fill={getAQIColor(entry.aqi)} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            <div className="bg-card rounded-lg border border-border p-6 mb-6">
              <h2 className="text-xl mb-4">{t("analytics.regional_overview")}</h2>
              {regionalData.length === 0 ? (
                <p className="text-muted-foreground text-sm">{t("analytics.no_data")}</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        {(["region","stations","avg_aqi","status"] as const).map((k) => (
                          <th key={k} className="text-left py-3 px-4 text-sm" style={{ fontWeight: 600 }}>
                            {t(`analytics.table.${k}`)}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {regionalData.map((r) => (
                        <tr key={r.region} className="border-b border-border hover:bg-muted/50">
                          <td className="py-3 px-4 text-sm">{r.region}</td>
                          <td className="py-3 px-4 text-sm">{r.stations}</td>
                          <td className="py-3 px-4">
                            <span
                              className="inline-block px-2 py-1 rounded text-xs"
                              style={{
                                backgroundColor: getAQIColor(r.averageAqi),
                                color: r.averageAqi >= 51 && r.averageAqi <= 100 ? "#000" : "#fff",
                                fontWeight: 600,
                              }}
                            >
                              {r.averageAqi}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-sm">
                            {r.averageAqi <= 50 ? (
                              <span className="text-green-600">{t("analytics.table.good")}</span>
                            ) : r.averageAqi <= 100 ? (
                              <span className="text-yellow-600">{t("analytics.table.moderate")}</span>
                            ) : (
                              <span className="text-red-600">{t("analytics.table.unhealthy")}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="bg-card rounded-lg border border-border p-6 mb-6">
              <h2 className="text-xl mb-4">{t("analytics.pm25_levels")}</h2>
              {chartData.length === 0 ? (
                <p className="text-muted-foreground text-sm">{t("analytics.no_data")}</p>
              ) : (
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} angle={-45} textAnchor="end" height={80} />
                      <YAxis tick={{ fontSize: 12 }} label={{ value: "PM2.5 (µg/m³)", angle: -90, position: "insideLeft" }} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Bar dataKey="pm25" fill="#34A853" name="PM2.5" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            <div>
              <h2 className="text-xl mb-4">{t("analytics.all_stations")}</h2>
              {sortedStations.length === 0 ? (
                <p className="text-muted-foreground text-sm">{t("analytics.no_stations")}</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {sortedStations.map((s) => <CityCard key={s.id} station={s} />)}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
