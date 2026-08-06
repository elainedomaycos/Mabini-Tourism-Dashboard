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

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center,
      zoom: 13,
      zoomControl: true,
      attributionControl: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 18,
    }).addTo(map);

    sites.forEach((site) => {
      const color = heatColor(site.dives, diveRange.min, diveRange.max);
      const radius = 8 + ((site.dives - diveRange.min) / (diveRange.max - diveRange.min || 1)) * 18;

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
        { direction: "top", offset: [0, -radius], className: "" }
      );

      circle.on("mouseover", function (this: L.CircleMarker) {
        this.setStyle({ weight: 3, fillOpacity: 1 });
      });
      circle.on("mouseout", function (this: L.CircleMarker) {
        this.setStyle({ weight: 2, fillOpacity: 0.8 });
      });
    });

    map.fitBounds(
      sites.map((s) => [s.lat, s.lng] as [number, number]),
      { padding: [30, 30] }
    );

    mapRef.current = map;
    setReady(true);

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [sites, center, diveRange]);

  useEffect(() => {
    if (mapRef.current) {
      setTimeout(() => mapRef.current?.invalidateSize(), 100);
    }
  }, [ready]);

  return (
    <div className="relative rounded-xl overflow-hidden border border-border/60">
      <div ref={containerRef} className="h-[420px] w-full bg-muted" />
      <div className="absolute bottom-3 left-3 z-[1000] flex items-center gap-2 rounded-lg bg-card/90 backdrop-blur border border-border/60 px-3 py-2 shadow-lg">
        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Heatmap</span>
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-muted-foreground">Low</span>
          <div className="flex gap-0.5">
            {["#3b82f6", "#22d3ee", "#facc15", "#ef4444"].map((c) => (
              <div key={c} className="w-4 h-2.5 rounded-sm" style={{ background: c }} />
            ))}
          </div>
          <span className="text-[10px] text-muted-foreground">High</span>
        </div>
      </div>
    </div>
  );
}
