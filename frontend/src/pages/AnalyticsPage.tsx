import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Download } from "lucide-react";
import { getAQIColor, getAQILabel } from "../aqi";

function downloadCSV(filename: string, content: string) {
  const blob = new Blob(["\uFEFF" + content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
import { CityCard } from "../components/CityCard";
import { SEOMeta } from "../components/SEOMeta";
import { useStations } from "../hooks/useApiData";

export function AnalyticsPage() {
  const { stations, loading, error } = useStations();

  const sortedStations = [...stations].sort((a, b) => b.aqi - a.aqi);

  function handleDownload() {
    const headers = ["City", "Region", "AQI", "Status", "PM2.5 (µg/m³)", "PM10 (µg/m³)", "NO2 (µg/m³)", "O3 (µg/m³)", "SO2 (µg/m³)", "CO (ppm)"];
    const rows = sortedStations.map((s) => [
      `"${s.city}"`,
      `"${s.region}"`,
      s.aqi,
      `"${getAQILabel(s.aqi)}"`,
      s.pm25,
      s.pm10,
      s.no2,
      s.o3,
      s.so2,
      s.co,
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const date = new Date().toISOString().split("T")[0];
    downloadCSV(`air-quality-report-${date}.csv`, csv);
  }

  const chartData = sortedStations.map((station) => ({
    name: station.city,
    aqi: station.aqi,
    pm25: station.pm25,
  }));

  const regionalStats = stations.reduce(
    (acc, station) => {
      if (!acc[station.region]) {
        acc[station.region] = { count: 0, totalAqi: 0 };
      }
      acc[station.region].count++;
      acc[station.region].totalAqi += station.aqi;
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

  return (
    <div className="min-h-screen bg-muted/30">
      <SEOMeta
        title="Air Quality Analytics"
        description="Comprehensive air quality analysis and city comparisons across Ukraine. Explore AQI trends, PM2.5 concentrations and regional statistics for all Ukrainian oblasts."
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
              <h1 className="text-3xl mb-2">Air Quality Analytics</h1>
              <p className="text-muted-foreground">
                Comprehensive analysis and comparison of air quality across
                Ukrainian cities
              </p>
            </div>
            <button
              onClick={handleDownload}
              disabled={loading || stations.length === 0}
              className="px-4 py-2 text-sm border border-border rounded-md hover:bg-muted transition-colors flex items-center gap-2 w-fit disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="h-4 w-4" />
              Download Report
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6 text-sm text-red-800 dark:text-red-300">
            Failed to load data: {error}
          </div>
        )}

        {loading ? (
          <div className="text-muted-foreground text-sm py-12 text-center">
            Loading analytics…
          </div>
        ) : (
          <>
            <div className="bg-card rounded-lg border border-border p-6 mb-6">
              <h2 className="text-xl mb-4">City Comparison — Current AQI</h2>
              {chartData.length === 0 ? (
                <p className="text-muted-foreground text-sm">No data available</p>
              ) : (
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 12 }}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis
                        tick={{ fontSize: 12 }}
                        label={{ value: "AQI", angle: -90, position: "insideLeft" }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "var(--card)",
                          border: "1px solid var(--border)",
                          borderRadius: "8px",
                          color: "var(--card-foreground)",
                        }}
                      />
                      <Bar dataKey="aqi" name="Air Quality Index">
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={getAQIColor(entry.aqi)} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            <div className="bg-card rounded-lg border border-border p-6 mb-6">
              <h2 className="text-xl mb-4">Regional Overview</h2>
              {regionalData.length === 0 ? (
                <p className="text-muted-foreground text-sm">No data available</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 text-sm" style={{ fontWeight: 600 }}>
                          Region
                        </th>
                        <th className="text-left py-3 px-4 text-sm" style={{ fontWeight: 600 }}>
                          Stations
                        </th>
                        <th className="text-left py-3 px-4 text-sm" style={{ fontWeight: 600 }}>
                          Average AQI
                        </th>
                        <th className="text-left py-3 px-4 text-sm" style={{ fontWeight: 600 }}>
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {regionalData.map((region) => (
                        <tr
                          key={region.region}
                          className="border-b border-border hover:bg-muted/50"
                        >
                          <td className="py-3 px-4 text-sm">{region.region}</td>
                          <td className="py-3 px-4 text-sm">{region.stations}</td>
                          <td className="py-3 px-4">
                            <span
                              className="inline-block px-2 py-1 rounded text-xs"
                              style={{
                                backgroundColor: getAQIColor(region.averageAqi),
                                color:
                                  region.averageAqi >= 51 && region.averageAqi <= 100
                                    ? "#000"
                                    : "#fff",
                                fontWeight: 600,
                              }}
                            >
                              {region.averageAqi}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-sm">
                            {region.averageAqi <= 50 ? (
                              <span className="text-green-600">Good</span>
                            ) : region.averageAqi <= 100 ? (
                              <span className="text-yellow-600">Moderate</span>
                            ) : (
                              <span className="text-red-600">Unhealthy</span>
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
              <h2 className="text-xl mb-4">PM2.5 Levels by City</h2>
              {chartData.length === 0 ? (
                <p className="text-muted-foreground text-sm">No data available</p>
              ) : (
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 12 }}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis
                        tick={{ fontSize: 12 }}
                        label={{
                          value: "PM2.5 (µg/m³)",
                          angle: -90,
                          position: "insideLeft",
                        }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "var(--card)",
                          border: "1px solid var(--border)",
                          borderRadius: "8px",
                          color: "var(--card-foreground)",
                        }}
                      />
                      <Bar dataKey="pm25" fill="#34A853" name="PM2.5" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            <div>
              <h2 className="text-xl mb-4">All Monitoring Stations</h2>
              {sortedStations.length === 0 ? (
                <p className="text-muted-foreground text-sm">No stations available</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {sortedStations.map((station) => (
                    <CityCard key={station.id} station={station} />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
