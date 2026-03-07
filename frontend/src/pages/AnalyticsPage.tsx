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
import { getAQIColor, MOCK_STATIONS } from "../aqi";
import { CityCard } from "../components/CityCard";

export function AnalyticsPage() {
  // Sort stations by AQI
  const sortedStations = [...MOCK_STATIONS].sort((a, b) => b.aqi - a.aqi);

  // Prepare chart data
  const chartData = sortedStations.map((station) => ({
    name: station.city,
    aqi: station.aqi,
    pm25: station.pm25,
    pm10: station.pm10,
  }));

  // Regional statistics
  const regionalStats = MOCK_STATIONS.reduce((acc, station) => {
    if (!acc[station.region]) {
      acc[station.region] = { count: 0, totalAqi: 0 };
    }
    acc[station.region].count++;
    acc[station.region].totalAqi += station.aqi;
    return acc;
  }, {} as Record<string, { count: number; totalAqi: number }>);

  const regionalData = Object.entries(regionalStats)
    .map(([region, stats]) => ({
      region: region.replace(" Oblast", ""),
      averageAqi: Math.round(stats.totalAqi / stats.count),
      stations: stats.count,
    }))
    .sort((a, b) => b.averageAqi - a.averageAqi);

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
            <div>
              <h1 className="text-3xl mb-2">Air Quality Analytics</h1>
              <p className="text-muted-foreground">
                Comprehensive analysis and comparison of air quality across
                Ukrainian cities
              </p>
            </div>
            <button className="px-4 py-2 text-sm border border-border rounded-md hover:bg-muted transition-colors flex items-center gap-2 w-fit">
              <Download className="h-4 w-4" />
              Download Report
            </button>
          </div>
        </div>

        {/* City Comparison Chart */}
        <div className="bg-card rounded-lg border border-border p-6 mb-6">
          <h2 className="text-xl mb-4">City Comparison - Current AQI</h2>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
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
                    backgroundColor: "white",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
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
        </div>

        {/* Regional Comparison */}
        <div className="bg-card rounded-lg border border-border p-6 mb-6">
          <h2 className="text-xl mb-4">Regional Overview</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th
                    className="text-left py-3 px-4 text-sm"
                    style={{ fontWeight: 600 }}
                  >
                    Region
                  </th>
                  <th
                    className="text-left py-3 px-4 text-sm"
                    style={{ fontWeight: 600 }}
                  >
                    Stations
                  </th>
                  <th
                    className="text-left py-3 px-4 text-sm"
                    style={{ fontWeight: 600 }}
                  >
                    Average AQI
                  </th>
                  <th
                    className="text-left py-3 px-4 text-sm"
                    style={{ fontWeight: 600 }}
                  >
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
        </div>

        {/* PM2.5 Comparison */}
        <div className="bg-card rounded-lg border border-border p-6 mb-6">
          <h2 className="text-xl mb-4">PM2.5 Levels by City</h2>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
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
                    backgroundColor: "white",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="pm25" fill="#34A853" name="PM2.5" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* All Cities Grid */}
        <div>
          <h2 className="text-xl mb-4">All Monitoring Stations</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {sortedStations.map((station) => (
              <CityCard key={station.id} station={station} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
