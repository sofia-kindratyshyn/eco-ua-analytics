import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import { toPng } from "html-to-image";
import { Download } from "lucide-react";
import { useTranslation } from "react-i18next";
import { getAqiLevel } from "../data/mockData";
import AqiLegend from "../components/AqiLegendForMap";
import { SEOMeta } from "../components/SEOMeta";
import { useStations } from "../hooks/useApiData";

const ukraineCenter: [number, number] = [48.9, 31.2];

const MapView = () => {
  const { stations } = useStations();
  const { t, i18n } = useTranslation();
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<L.CircleMarker[]>([]);
  // id of the currently click-pinned station, null when nothing is pinned
  const pinnedRef = useRef<string | null>(null);
  // pending close timer – shared across all markers so any new open cancels it
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current).setView(ukraineCenter, 6);
    mapRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      crossOrigin: "anonymous",
    }).addTo(map);

    // Click on the bare map → unpin whatever is pinned
    map.on("click", () => {
      if (pinnedRef.current !== null) {
        pinnedRef.current = null;
        map.closePopup();
      }
    });

    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear pending close and pinned state when marker set changes
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    closeTimerRef.current = null;
    pinnedRef.current = null;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    stations.forEach((station) => {
      const level = getAqiLevel(station.aqi);
      const marker = L.circleMarker([station.lat, station.lng], {
        radius: 14,
        color: level.color,
        fillColor: level.color,
        fillOpacity: 0.7,
        weight: 2,
      }).addTo(map);

      marker.bindPopup(
        `<div style="min-width:200px;padding:4px;">
          <h4 style="font-weight:bold;font-size:14px;margin:0;">${
            station.name
          }</h4>
          <p style="font-size:12px;color:#888;margin:2px 0 8px;">${
            station.region
          }</p>
          <div style="display:flex;align-items:center;gap:12px;">
            <div style="background:${level.color};color:${
          station.aqi <= 100 ? "#333" : "#fff"
        };width:48px;height:48px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:18px;font-family:monospace;">
              ${station.aqi}
            </div>
            <div style="font-size:12px;">
              <p style="margin:0;"><strong>PM2.5:</strong> ${
                station.pm25
              } µg/m³</p>
              <p style="margin:0;"><strong>PM10:</strong> ${
                station.pm10
              } µg/m³</p>
            </div>
          </div>
          <a href="/station/${
            station.id
          }" style="display:block;text-align:center;margin-top:8px;font-size:12px;color:#2E75B6;">${i18n.t(
          "map.popup.view_details"
        )}</a>
        </div>`,
        // Disable Leaflet's own auto-close so we control the lifetime manually
        { autoClose: false, closeOnClick: false }
      );

      const cancelClose = () => {
        if (closeTimerRef.current) {
          clearTimeout(closeTimerRef.current);
          closeTimerRef.current = null;
        }
      };

      const scheduleClose = () => {
        // Never close a pinned popup via the hover-out path
        if (pinnedRef.current === station.id) return;
        cancelClose();
        closeTimerRef.current = setTimeout(() => marker.closePopup(), 220);
      };

      // ── Hover behaviour ────────────────────────────────────────────────────
      marker.on("mouseover", () => {
        // If a different station is pinned, don't open a competing popup
        if (pinnedRef.current !== null && pinnedRef.current !== station.id)
          return;
        cancelClose();
        // Close any un-pinned hover popup from another marker first
        if (pinnedRef.current === null) map.closePopup();
        marker.openPopup();
      });

      marker.on("mouseout", scheduleClose);

      marker.on("click", (e: L.LeafletMouseEvent) => {
        e.originalEvent.stopPropagation();

        if (pinnedRef.current === station.id) {
          pinnedRef.current = null;
          marker.closePopup();
        } else {
          if (pinnedRef.current !== null) map.closePopup();
          pinnedRef.current = station.id;
          cancelClose();
          marker.openPopup();
        }
      });

      marker.on("popupopen", () => {
        const el = marker.getPopup()?.getElement();
        if (!el) return;
        el.addEventListener("mouseenter", cancelClose);
        el.addEventListener("mouseleave", scheduleClose);
      });

      marker.on("popupclose", () => {
        const el = marker.getPopup()?.getElement();
        if (!el) return;
        el.removeEventListener("mouseenter", cancelClose);
        el.removeEventListener("mouseleave", scheduleClose);
        if (pinnedRef.current === station.id) pinnedRef.current = null;
      });

      markersRef.current.push(marker);
    });
  }, [stations, i18n.language]);

  const handleSaveImage = async () => {
    if (!wrapperRef.current || saving) return;
    setSaving(true);
    try {
      const options = {
        pixelRatio: window.devicePixelRatio || 1,
        cacheBust: true,
      };
      await toPng(wrapperRef.current, options);
      const dataUrl = await toPng(wrapperRef.current, options);
      const link = document.createElement("a");
      link.download = `air-quality-map-${
        new Date().toISOString().split("T")[0]
      }.png`;
      link.href = dataUrl;
      link.click();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      ref={wrapperRef}
      className="relative flex h-[calc(100vh-4rem)] flex-col"
    >
      <SEOMeta
        title={t("seo.map.title")}
        description={t("seo.map.description")}
        path="/map"
      />
      <div className="absolute right-4 bottom-8 z-[1000] max-w-xs">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-md p-3">
          <h3 className="mb-2 text-xs font-semibold text-foreground">
            {t("map.aqi_levels")}
          </h3>
          <AqiLegend />
        </div>
      </div>

      <button
        onClick={handleSaveImage}
        disabled={saving}
        className="absolute top-4 right-4 z-[1000] flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-md text-xs font-semibold text-foreground hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        title="Save map as PNG"
      >
        <Download className="h-4 w-4" />
        {saving ? t("map.saving") : t("map.save_png")}
      </button>

      <div ref={containerRef} className="flex-1 z-0" />
    </div>
  );
};

export default MapView;
