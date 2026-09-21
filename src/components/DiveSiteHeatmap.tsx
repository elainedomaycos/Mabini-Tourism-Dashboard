import { useEffect, useState, useMemo, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface Site {
  id: string;
  name: string;
  barangay: string;
  depth: string;
  difficulty: string;
  type: string;
  status: string;
  dives: number;
  lat: number;
  lng: number;
}

function heatColor(value: number, min: number, max: number): string {
  const t = max > min ? (value - min) / (max - min) : 0.5;
  if (t < 0.25) return "#3b82f6";
  if (t < 0.5) return "#22d3ee";
  if (t < 0.75) return "#facc15";
  return "#ef4444";
}

export function DiveSiteHeatmap({ sites }: { sites: Site[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const [ready, setReady] = useState(false);

  const center = useMemo(() => {
    if (sites.length === 0) return [13.75, 120.93] as [number, number];
    const lat = sites.reduce((a, s) => a + s.lat, 0) / sites.length;
    const lng = sites.reduce((a, s) => a + s.lng, 0) / sites.length;
    return [lat, lng] as [number, number];
  }, [sites]);

  const diveRange = useMemo(() => {
    const dives = sites.map((s) => s.dives);
    return { min: Math.min(...dives), max: Math.max(...dives) };
  }, [sites]);

  // Initial map creation — run once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center,
      zoom: 13,
      zoomControl: true,
      attributionControl: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 18,
    }).addTo(map);

    mapRef.current = map;
    setReady(true);

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync markers when sites/filter changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear existing circle markers
    map.eachLayer((layer: any) => {
      if (layer instanceof L.CircleMarker) {
        map.removeLayer(layer);
      }
    });

    sites.forEach((site) => {
      const color = heatColor(site.dives, diveRange.min, diveRange.max);
      const radius =
        8 +
        ((site.dives - diveRange.min) / (diveRange.max - diveRange.min || 1)) *
          18;

      const circle = L.circleMarker([site.lat, site.lng], {
        radius,
        fillColor: color,
        color: "#fff",
        weight: 2,
        opacity: 1,
        fillOpacity: 0.8,
      }).addTo(map);

      circle.bindTooltip(
        `<div style="font-family:Inter,sans-serif;min-width:160px">
          <div style="font-weight:600;font-size:13px;margin-bottom:4px">${site.name}</div>
          <div style="font-size:11px;color:#666;margin-bottom:2px">${site.barangay} · ${site.type}</div>
          <div style="font-size:11px;color:#666;margin-bottom:2px">Depth: ${site.depth} · ${site.difficulty}</div>
          <div style="font-size:12px;font-weight:600;color:${color};margin-top:4px">${site.dives.toLocaleString()} dives</div>
        </div>`,
        { direction: "top", offset: [0, -radius], className: "" },
      );

      circle.on("mouseover", function (this: L.CircleMarker) {
        this.setStyle({ weight: 3, fillOpacity: 1 });
      });
      circle.on("mouseout", function (this: L.CircleMarker) {
        this.setStyle({ weight: 2, fillOpacity: 0.8 });
      });
    });

    if (sites.length > 0) {
      map.fitBounds(
        sites.map((s) => [s.lat, s.lng] as [number, number]),
        { padding: [30, 30] },
      );
    }
    // Ensure proper size after data change (also handles tab becoming visible)
    setTimeout(() => map.invalidateSize(), 80);
  }, [sites, diveRange]);

  useEffect(() => {
    if (mapRef.current) {
      // Initial invalidate after mount
      setTimeout(() => mapRef.current?.invalidateSize(), 150);
    }
  }, [ready]);

  // Re-invalidate when the tab becomes visible (TabsContent is hidden via display:none until active)
  // Without this, leaflet renders with 0 height and overlaps the next card.
  useEffect(() => {
    if (!containerRef.current || !mapRef.current) return;
    const el = containerRef.current;
    const observer = new ResizeObserver(() => {
      mapRef.current?.invalidateSize();
    });
    observer.observe(el);

    // Also observe visibility via IntersectionObserver (handles TabsContent hidden -> visible)
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Delay to allow CSS transition to finish
            setTimeout(() => mapRef.current?.invalidateSize(), 100);
            // Re-fit bounds to ensure correct centering after resize
            if (sites.length > 0) {
              mapRef.current?.fitBounds(
                sites.map((s) => [s.lat, s.lng] as [number, number]),
                { padding: [30, 30] },
              );
            }
          }
        });
      },
      { threshold: 0.1 },
    );
    io.observe(el);

    return () => {
      observer.disconnect();
      io.disconnect();
    };
  }, [ready, sites]);

  return (
    <div className="relative rounded-xl overflow-hidden border border-border/60 bg-muted isolate [&_.leaflet-pane]:!z-[1] [&_.leaflet-control]:!z-[2] [&_.leaflet-top]:!z-[2] [&_.leaflet-bottom]:!z-[2]">
      <div ref={containerRef} className="h-[420px] w-full bg-muted relative z-0 [&_.leaflet-container]:!z-0" />
      <div className="absolute bottom-3 left-3 z-10 flex items-center gap-2 rounded-lg bg-card/90 backdrop-blur border border-border/60 px-3 py-2 shadow-lg">
        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
          Heatmap
        </span>
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-muted-foreground">Low</span>
          <div className="flex gap-0.5">
            {["#3b82f6", "#22d3ee", "#facc15", "#ef4444"].map((c) => (
              <div
                key={c}
                className="w-4 h-2.5 rounded-sm"
                style={{ background: c }}
              />
            ))}
          </div>
          <span className="text-[10px] text-muted-foreground">High</span>
        </div>
      </div>
    </div>
  );
}
