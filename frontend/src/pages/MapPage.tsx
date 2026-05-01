import { useState } from "react";
import { AQILegend } from "../components/AQILegend.tsx";
import { Filter } from "lucide-react";
import { AirQualityMap } from "../components/AirQualityApp.tsx";
import { useStations } from "../hooks/useApiData";

export function MapPage() {
  const { stations, loading } = useStations();
  const [selectedRegion, setSelectedRegion] = useState<string>("all");

  const regions = ["all", ...Array.from(new Set(stations.map((s) => s.region)))];

  const filteredStations =
    selectedRegion === "all"
      ? stations
      : stations.filter((s) => s.region === selectedRegion);

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl mb-2">Interactive Air Quality Map</h1>
          <p className="text-muted-foreground">
            Click on any marker to view detailed information about the
            monitoring station
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <aside className="lg:col-span-1 space-y-4">
            <div className="bg-card rounded-lg border border-border p-4">
              <div className="flex items-center gap-2 mb-3">
                <Filter className="h-4 w-4" />
                <h3 className="text-sm" style={{ fontWeight: 600 }}>
                  Filters
                </h3>
              </div>

              <div>
                <label className="text-sm text-muted-foreground mb-2 block">
                  Region
                </label>
                <select
                  value={selectedRegion}
                  onChange={(e) => setSelectedRegion(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm"
                >
                  {regions.map((region) => (
                    <option key={region} value={region}>
                      {region === "all" ? "All Regions" : region}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mt-4 pt-4 border-t border-border">
                <div className="text-sm text-muted-foreground">
                  {loading
                    ? "Loading…"
                    : `Showing ${filteredStations.length} station${filteredStations.length !== 1 ? "s" : ""}`}
                </div>
              </div>
            </div>

            <AQILegend />

            <div className="bg-blue-50 dark:bg-blue-950/40 rounded-lg border border-blue-200 dark:border-blue-800 p-4">
              <h3
                className="text-sm text-blue-900 dark:text-blue-200 mb-2"
                style={{ fontWeight: 600 }}
              >
                About the Data
              </h3>
              <p className="text-xs text-blue-800 dark:text-blue-300">
                Air quality data is updated every 30 minutes from monitoring
                stations across Ukraine. Click on any marker for detailed
                pollutant measurements.
              </p>
            </div>
          </aside>

          <div className="lg:col-span-3">
            <div className="bg-card rounded-lg border border-border overflow-hidden shadow-sm">
              <AirQualityMap
                stations={filteredStations}
                height="calc(100vh - 240px)"
                zoom={6}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
