import { Link } from "react-router";
import { MapPin, Activity, TrendingDown, TrendingUp } from "lucide-react";
import { MOCK_ALERTS, MOCK_STATIONS } from "../aqi";
import { StatsCard } from "../components/StatsCard";
import { AirQualityMap } from "../components/AirQualityApp";
import { CityCard } from "../components/CityCard";
import { AlertCard } from "../components/AlertCard";

export function HomePage() {
  // Calculate stats
  const totalStations = MOCK_STATIONS.length;
  const averageAQI = Math.round(
    MOCK_STATIONS.reduce((sum, s) => sum + s.aqi, 0) / MOCK_STATIONS.length
  );
  const bestCity = [...MOCK_STATIONS].sort((a, b) => a.aqi - b.aqi)[0];
  const worstCity = [...MOCK_STATIONS].sort((a, b) => b.aqi - a.aqi)[0];

  const featuredStations = MOCK_STATIONS.slice(0, 4);

  return (
    <div className="min-h-screen bg-muted/30">
      <section className="bg-linear-to-br from-primary/5 via-secondary/5 to-primary/5 py-12 md:py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-8">
            <h1
              className="text-4xl md:text-5xl mb-4"
              style={{ fontWeight: 700 }}
            >
              Real-Time Air Quality Monitoring
            </h1>
            <p className="text-lg text-muted-foreground mb-6">
              Track air pollution levels across Ukraine with live data from
              monitoring stations nationwide
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link
                to="/map"
                className="px-6 py-3 rounded-md text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: "var(--primary)", fontWeight: 500 }}
              >
                Explore Map
              </Link>
              <Link
                to="/alerts"
                className="px-6 py-3 rounded-md border border-border bg-white transition-shadow hover:shadow-md"
                style={{ fontWeight: 500 }}
              >
                View Alerts
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
            <StatsCard
              title="Active Stations"
              value={totalStations}
              subtitle="Monitoring locations"
              icon={<MapPin className="h-4 w-4" />}
            />
            <StatsCard
              title="Average AQI"
              value={averageAQI}
              subtitle="Nationwide"
              icon={<Activity className="h-4 w-4" />}
            />
            <StatsCard
              title="Best Air Quality"
              value={bestCity.city}
              subtitle={`AQI: ${bestCity.aqi}`}
              icon={<TrendingDown className="h-4 w-4 text-green-500" />}
            />
            <StatsCard
              title="Needs Attention"
              value={worstCity.city}
              subtitle={`AQI: ${worstCity.aqi}`}
              icon={<TrendingUp className="h-4 w-4 text-red-500" />}
            />
          </div>
        </div>
      </section>

      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-2xl md:text-3xl mb-2">Air Quality Map</h2>
              <p className="text-muted-foreground">
                Live monitoring stations across Ukraine
              </p>
            </div>
            <Link
              to="/map"
              className="text-sm text-primary hover:underline"
              style={{ fontWeight: 500 }}
            >
              Full Screen Map →
            </Link>
          </div>

          <div className="bg-card rounded-lg border border-border overflow-hidden shadow-sm">
            <AirQualityMap stations={MOCK_STATIONS} height="500px" />
          </div>
        </div>
      </section>

      <section className="py-12 md:py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="mb-6">
            <h2 className="text-2xl md:text-3xl mb-2">Major Cities</h2>
            <p className="text-muted-foreground">
              Current air quality in key urban areas
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {featuredStations.map((station) => (
              <CityCard key={station.id} station={station} />
            ))}
          </div>

          <div className="mt-6 text-center">
            <Link
              to="/analytics"
              className="inline-block px-6 py-2 text-sm border border-border rounded-md hover:shadow-md transition-shadow"
              style={{ fontWeight: 500 }}
            >
              View All Cities
            </Link>
          </div>
        </div>
      </section>

      {MOCK_ALERTS.length > 0 && (
        <section className="py-12 md:py-16">
          <div className="container mx-auto px-4">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl md:text-3xl mb-2">Recent Alerts</h2>
                <p className="text-muted-foreground">
                  Air quality notifications and warnings
                </p>
              </div>
              <Link
                to="/alerts"
                className="text-sm text-primary hover:underline"
                style={{ fontWeight: 500 }}
              >
                All Alerts →
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl">
              {MOCK_ALERTS.map((alert) => (
                <AlertCard key={alert.id} alert={alert} />
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="py-12 md:py-16 bg-primary/5">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl mb-4">
              Understanding Air Quality
            </h2>
            <p className="text-muted-foreground mb-6">
              The Air Quality Index (AQI) is a standardized indicator of air
              pollution levels. Lower values indicate better air quality, while
              higher values indicate health concerns. Stay informed and protect
              your health by checking air quality before outdoor activities.
            </p>
            <Link
              to="/analytics"
              className="inline-block px-6 py-2 text-sm text-primary border border-primary rounded-md hover:bg-primary hover:text-white transition-colors"
              style={{ fontWeight: 500 }}
            >
              Learn More
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
