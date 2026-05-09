import { useState } from "react";
import { Bell, Filter } from "lucide-react";
import { useTranslation } from "react-i18next";
import { AlertCard } from "../components/AlertCard";
import { SEOMeta } from "../components/SEOMeta";
import { useAlerts } from "../hooks/useApiData";

export function AlertsPage() {
  const { t } = useTranslation();
  const { alerts, loading, error } = useAlerts();
  const [filterSeverity, setFilterSeverity] = useState<string>("all");

  const filteredAlerts =
    filterSeverity === "all"
      ? alerts
      : alerts.filter((alert) => alert.severity === filterSeverity);

  const activeAlerts = alerts.length;
  const count = filteredAlerts.length;
  const showingLabel = count === 1
    ? t("alerts.showing_one", { count })
    : t("alerts.showing_other", { count });

  return (
    <div className="min-h-screen bg-muted/30">
      <SEOMeta
        title={t("seo.alerts.title")}
        description={t("seo.alerts.description")}
        path="/alerts"
      />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl mb-2">{t("alerts.title")}</h1>
          <p className="text-muted-foreground">{t("alerts.subtitle")}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-card rounded-lg border border-border p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <Bell className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">{t("alerts.active")}</div>
                <div className="text-2xl" style={{ fontWeight: 600 }}>
                  {loading ? "…" : activeAlerts}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-lg border border-border p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                <Bell className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">{t("alerts.warnings")}</div>
                <div className="text-2xl" style={{ fontWeight: 600 }}>
                  {loading ? "…" : alerts.filter((a) => a.severity === "warning").length}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-lg border border-border p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <Bell className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">{t("alerts.critical")}</div>
                <div className="text-2xl" style={{ fontWeight: 600 }}>
                  {loading ? "…" : alerts.filter((a) => a.severity === "critical").length}
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
                <h3 className="text-sm" style={{ fontWeight: 600 }}>{t("alerts.filter.title")}</h3>
              </div>

              <div>
                <label className="text-sm text-muted-foreground mb-2 block">{t("alerts.filter.severity")}</label>
                <select
                  value={filterSeverity}
                  onChange={(e) => setFilterSeverity(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm"
                >
                  <option value="all">{t("alerts.filter.all")}</option>
                  <option value="warning">{t("alerts.filter.warning")}</option>
                  <option value="danger">{t("alerts.filter.danger")}</option>
                  <option value="critical">{t("alerts.filter.critical")}</option>
                </select>
              </div>

              <div className="mt-4 pt-4 border-t border-border">
                <div className="text-sm text-muted-foreground">{showingLabel}</div>
              </div>

              <div className="mt-6">
                <h4 className="text-sm mb-3" style={{ fontWeight: 600 }}>{t("alerts.levels_title")}</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                    <span className="text-xs">{t("alerts.filter.warning")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-orange-500 rounded"></div>
                    <span className="text-xs">{t("alerts.filter.danger")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded"></div>
                    <span className="text-xs">{t("alerts.filter.critical")}</span>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          <div className="lg:col-span-3">
            {error && (
              <div className="bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4 text-sm text-red-800 dark:text-red-300">
                {t("alerts.error_prefix")}{error}
              </div>
            )}

            {loading ? (
              <div className="text-muted-foreground text-sm">{t("alerts.loading")}</div>
            ) : filteredAlerts.length === 0 ? (
              <div className="bg-card rounded-lg border border-border p-12 text-center">
                <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg mb-2">{t("alerts.no_alerts")}</h3>
                <p className="text-sm text-muted-foreground">{t("alerts.no_alerts_desc")}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredAlerts.map((alert) => (
                  <AlertCard key={alert.id} alert={alert} />
                ))}
              </div>
            )}

            <div className="mt-6 bg-blue-50 dark:bg-blue-950/40 rounded-lg border border-blue-200 dark:border-blue-800 p-6">
              <h3 className="text-lg text-blue-900 dark:text-blue-200 mb-3">{t("alerts.health.title")}</h3>
              <div className="space-y-3 text-sm text-blue-800 dark:text-blue-300">
                <div>
                  <span style={{ fontWeight: 600 }}>{t("alerts.health.sensitive_label")}</span>
                  <p>{t("alerts.health.sensitive_text")}</p>
                </div>
                <div>
                  <span style={{ fontWeight: 600 }}>{t("alerts.health.public_label")}</span>
                  <p>{t("alerts.health.public_text")}</p>
                </div>
                <div>
                  <span style={{ fontWeight: 600 }}>{t("alerts.health.protection_label")}</span>
                  <p>{t("alerts.health.protection_text")}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
