import { createBrowserRouter } from "react-router";
import { RootLayout } from "./components/RootLayout";
import { HomePage } from "./pages/HomePage";
import { MapPage } from "./pages/MapPage";
import { StationDetailPage } from "./pages/StationDetailPage";
import { AnalyticsPage } from "./pages/AnalyticsPage";
import { AlertsPage } from "./pages/AlertsPage";
import { NotFound } from "./pages/NotFound";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: RootLayout,
    children: [
      { index: true, Component: HomePage },
      { path: "map", Component: MapPage },
      { path: "station/:id", Component: StationDetailPage },
      { path: "analytics", Component: AnalyticsPage },
      { path: "alerts", Component: AlertsPage },
      { path: "*", Component: NotFound },
    ],
  },
]);
