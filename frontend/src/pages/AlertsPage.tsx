import { useState } from "react";
import { Bell, Filter } from "lucide-react";
import { MOCK_ALERTS } from "../aqi";
import { AlertCard } from "../components/AlertCard";

export function AlertsPage() {
  const [filterSeverity, setFilterSeverity] = useState<string>("all");

  const filteredAlerts =
    filterSeverity === "all"
      ? MOCK_ALERTS
      : MOCK_ALERTS.filter((alert) => alert.severity === filterSeverity);

  const activeAlerts = MOCK_ALERTS.length;

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl mb-2">Air Quality Alerts</h1>
          <p className="text-muted-foreground">
            Stay informed about air quality warnings and health advisories
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-card rounded-lg border border-border p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-red-100 rounded-lg">
                <Bell className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">
                  Active Alerts
                </div>
                <div className="text-2xl" style={{ fontWeight: 600 }}>
                  {activeAlerts}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-lg border border-border p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Bell className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Warnings</div>
                <div className="text-2xl" style={{ fontWeight: 600 }}>
                  {MOCK_ALERTS.filter((a) => a.severity === "warning").length}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-lg border border-border p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Bell className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Critical</div>
                <div className="text-2xl" style={{ fontWeight: 600 }}>
                  {MOCK_ALERTS.filter((a) => a.severity === "critical").length}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <aside className="lg:col-span-1">
            <div className="bg-card rounded-lg border border-border p-4 sticky top-24">
              <div className="flex items-center gap-2 mb-4">
                <Filter className="h-4 w-4" />
                <h3 className="text-sm" style={{ fontWeight: 600 }}>
                  Filter Alerts
                </h3>
              </div>

              <div>
                <label className="text-sm text-muted-foreground mb-2 block">
                  Severity
                </label>
                <select
                  value={filterSeverity}
                  onChange={(e) => setFilterSeverity(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm"
                >
                  <option value="all">All Severities</option>
                  <option value="warning">Warning</option>
                  <option value="danger">Danger</option>
                  <option value="critical">Critical</option>
                </select>
              </div>

              <div className="mt-4 pt-4 border-t border-border">
                <div className="text-sm text-muted-foreground">
                  Showing {filteredAlerts.length} alert
                  {filteredAlerts.length !== 1 ? "s" : ""}
                </div>
              </div>

              <div className="mt-6">
                <h4 className="text-sm mb-3" style={{ fontWeight: 600 }}>
                  Alert Levels
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                    <span className="text-xs">Warning</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-orange-500 rounded"></div>
                    <span className="text-xs">Danger</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded"></div>
                    <span className="text-xs">Critical</span>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          <div className="lg:col-span-3">
            {filteredAlerts.length === 0 ? (
              <div className="bg-card rounded-lg border border-border p-12 text-center">
                <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg mb-2">No alerts found</h3>
                <p className="text-sm text-muted-foreground">
                  There are currently no alerts matching your filters
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredAlerts.map((alert) => (
                  <AlertCard key={alert.id} alert={alert} />
                ))}
              </div>
            )}

            <div className="mt-6 bg-blue-50 rounded-lg border border-blue-200 p-6">
              <h3 className="text-lg text-blue-900 mb-3">Health Guidelines</h3>
              <div className="space-y-3 text-sm text-blue-800">
                <div>
                  <span style={{ fontWeight: 600 }}>For Sensitive Groups:</span>
                  <p>
                    People with respiratory conditions, children, and elderly
                    should limit outdoor activities when air quality is moderate
                    or worse.
                  </p>
                </div>
                <div>
                  <span style={{ fontWeight: 600 }}>General Public:</span>
                  <p>
                    When AQI exceeds 150, everyone should reduce prolonged
                    outdoor exertion and monitor symptoms.
                  </p>
                </div>
                <div>
                  <span style={{ fontWeight: 600 }}>Protection:</span>
                  <p>
                    Consider wearing N95 masks outdoors during high pollution
                    days and use air purifiers indoors.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
