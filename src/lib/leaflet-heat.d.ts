import * as L from "leaflet";

declare module "leaflet" {
  interface HeatLayerOptions {
    minOpacity?: number;
    maxZoom?: number;
    max?: number;
    radius?: number;
    blur?: number;
    gradient?: Record<number, string>;
  }

  // Added by the leaflet.heat plugin (side-effect import "leaflet.heat").
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const HeatLayer: any;
  function heatLayer(
    latlngs: Array<[number, number] | [number, number, number]>,
    options?: HeatLayerOptions,
  ): L.Layer;
}

declare module "leaflet.heat";
