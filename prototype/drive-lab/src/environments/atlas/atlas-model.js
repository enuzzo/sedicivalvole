export const OPENFREEMAP_VECTOR_URL = "https://tiles.openfreemap.org/planet";
export const WIKIPEDIA_SEARCH_RADIUS_METRES = 10000;

const ATLAS_KEYBOARD_INTERACTIVE_SELECTOR = [
  "a[href]",
  "button",
  "input",
  "select",
  "textarea",
  "[contenteditable]:not([contenteditable='false'])",
  "[role='dialog']",
  "[aria-modal='true']",
].join(", ");

export function atlasKeyboardShortcutAvailable(event, keyboardShortcutsEnabled = true) {
  if (!keyboardShortcutsEnabled || event?.defaultPrevented || event?.altKey || event?.ctrlKey || event?.metaKey) {
    return false;
  }
  const target = event?.target;
  return typeof target?.closest !== "function"
    || !target.closest(ATLAS_KEYBOARD_INTERACTIVE_SELECTOR);
}

export function validAtlasPosition(position) {
  return Boolean(position)
    && Number.isFinite(position.latitude)
    && Number.isFinite(position.longitude)
    && position.latitude >= -90
    && position.latitude <= 90
    && position.longitude >= -180
    && position.longitude <= 180;
}

export function speedToAtlasCamera(speedKmh) {
  const speed = Math.min(130, Math.max(0, Number(speedKmh) || 0));
  const energy = speed / 130;
  // Keep the early pull-back legible, then compress the upper end so motorway
  // speed reveals more city without ever flattening the extruded city field.
  const flight = 0.35 * energy + 0.65 * Math.sqrt(energy);
  return {
    zoom: 16.2 - flight * 1.55,
    pitch: 62 - flight * 6.5,
    durationMs: Math.round(2200 - energy * 1050),
    buildingScale: 0.82 + energy * 0.38,
  };
}

/** Uses device heading when present, otherwise derives travel bearing from two trusted fixes. */
export function resolveAtlasHeading(previous, next, reportedHeading, minimumTravelMetres = 3) {
  if (Number.isFinite(reportedHeading)) return ((reportedHeading % 360) + 360) % 360;
  const previousHeading = Number.isFinite(previous?.heading) ? previous.heading : null;
  if (!validAtlasPosition(previous) || !validAtlasPosition(next)) return previousHeading;

  const meanLatitude = ((previous.latitude + next.latitude) * Math.PI) / 360;
  const northMetres = (next.latitude - previous.latitude) * 111320;
  const eastMetres = (next.longitude - previous.longitude) * 111320 * Math.cos(meanLatitude);
  if (Math.hypot(northMetres, eastMetres) < Math.max(0, minimumTravelMetres)) return previousHeading;
  return ((Math.atan2(eastMetres, northMetres) * 180) / Math.PI + 360) % 360;
}

/** Advances the fixed Milan demo without exposing or inventing user location. */
export function advanceAtlasDemoPosition(position, speedKmh, headingDegrees, deltaSeconds) {
  if (!validAtlasPosition(position)) return null;
  const speedMps = Math.min(130, Math.max(0, Number(speedKmh) || 0)) / 3.6;
  const delta = Math.min(1, Math.max(0, Number(deltaSeconds) || 0));
  const heading = ((Number(headingDegrees) || 0) * Math.PI) / 180;
  const metres = speedMps * delta;
  const latitudeRadians = (position.latitude * Math.PI) / 180;
  const latitude = position.latitude + (Math.cos(heading) * metres) / 111320;
  const longitude = position.longitude
    + (Math.sin(heading) * metres) / Math.max(1, 111320 * Math.cos(latitudeRadians));
  return { latitude, longitude, heading: ((Number(headingDegrees) || 0) + 360) % 360 };
}

export function wikipediaNearbyUrl(position, language = "it") {
  if (!validAtlasPosition(position)) return null;
  const params = new URLSearchParams({
    action: "query",
    format: "json",
    formatversion: "2",
    origin: "*",
    generator: "geosearch",
    ggscoord: `${position.latitude}|${position.longitude}`,
    ggsradius: String(WIKIPEDIA_SEARCH_RADIUS_METRES),
    ggslimit: "6",
    prop: "extracts|info|pageimages",
    exintro: "1",
    explaintext: "1",
    exsentences: "2",
    inprop: "url",
    piprop: "thumbnail",
    pithumbsize: "320",
    pilicense: "free",
  });
  return `https://${language}.wikipedia.org/w/api.php?${params}`;
}

export function normalizeNearbyPages(payload) {
  return (payload?.query?.pages ?? [])
    .filter((page) => page?.title && page?.fullurl)
    .map((page) => {
      const thumbnailSource = String(page.thumbnail?.source ?? "");
      const thumbnail = thumbnailSource.startsWith("//")
        ? `https:${thumbnailSource}`
        : /^https:\/\//i.test(thumbnailSource) ? thumbnailSource : "";
      return {
        id: String(page.pageid),
        title: String(page.title),
        summary: String(page.extract ?? "").replace(/\s+/g, " ").trim(),
        url: String(page.fullurl),
        thumbnail,
        thumbnailWidth: Number.isFinite(page.thumbnail?.width) ? page.thumbnail.width : null,
        thumbnailHeight: Number.isFinite(page.thumbnail?.height) ? page.thumbnail.height : null,
      };
    })
    .slice(0, 5);
}

/**
 * Creates cancellable revision tickets for UI work whose older promises may
 * finish after a newer request has already taken ownership of the surface.
 */
export function createLatestAtlasRequestGate() {
  let revision = 0;
  return {
    begin() {
      const requestRevision = ++revision;
      let active = true;
      return {
        commit(action) {
          if (!active || requestRevision !== revision) return false;
          action();
          return true;
        },
        cancel() {
          active = false;
          if (requestRevision === revision) revision += 1;
        },
      };
    },
  };
}

export function paletteToAtlasCss(palette) {
  const css = (channels) => `rgb(${channels.map((channel) => Math.round(channel * 255)).join(" ")})`;
  return {
    background: css(palette.base),
    terrain: css(palette.mid),
    foreground: css(palette.light),
    accent: css(palette.accent),
    secondary: css(palette.secondary),
  };
}

export function createAtlasStyle(palette) {
  const colors = paletteToAtlasCss(palette);
  return {
    version: 8,
    glyphs: "https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf",
    sources: {
      openfreemap: {
        type: "vector",
        url: OPENFREEMAP_VECTOR_URL,
        attribution: "© OpenFreeMap © OpenMapTiles Data from OpenStreetMap",
      },
    },
    layers: [
      { id: "atlas-background", type: "background", paint: { "background-color": colors.background } },
      {
        id: "atlas-landcover", type: "fill", source: "openfreemap", "source-layer": "landcover",
        paint: { "fill-color": colors.terrain, "fill-opacity": 0.25 },
      },
      {
        id: "atlas-landuse", type: "fill", source: "openfreemap", "source-layer": "landuse",
        paint: { "fill-color": colors.terrain, "fill-opacity": 0.38 },
      },
      {
        id: "atlas-water", type: "fill", source: "openfreemap", "source-layer": "water",
        paint: { "fill-color": colors.secondary, "fill-opacity": 0.24 },
      },
      {
        id: "atlas-roads-underlay", type: "line", source: "openfreemap", "source-layer": "transportation",
        paint: { "line-color": colors.background, "line-width": ["interpolate", ["linear"], ["zoom"], 10, 0.6, 17, 5.5], "line-opacity": 0.9 },
      },
      {
        id: "atlas-roads", type: "line", source: "openfreemap", "source-layer": "transportation",
        paint: { "line-color": colors.secondary, "line-width": ["interpolate", ["linear"], ["zoom"], 10, 0.25, 17, 2.0], "line-opacity": 0.58 },
      },
      {
        id: "sedicivalvole-buildings", type: "fill-extrusion", source: "openfreemap", "source-layer": "building", minzoom: 13.5,
        paint: {
          "fill-extrusion-color": [
            "interpolate", ["linear"], ["coalesce", ["get", "render_height"], 5],
            0, colors.terrain, 80, colors.accent, 240, colors.foreground,
          ],
          "fill-extrusion-height": ["coalesce", ["get", "render_height"], 5],
          "fill-extrusion-base": ["coalesce", ["get", "render_min_height"], 0],
          "fill-extrusion-opacity": 0.78,
        },
      },
      {
        id: "atlas-place-labels", type: "symbol", source: "openfreemap", "source-layer": "place", minzoom: 6,
        layout: {
          "text-field": ["coalesce", ["get", "name:it"], ["get", "name"]],
          "text-font": ["Noto Sans Regular"],
          "text-size": ["interpolate", ["linear"], ["zoom"], 8, 10, 16, 14],
          "text-letter-spacing": 0.08,
        },
        paint: {
          "text-color": colors.foreground,
          "text-halo-color": colors.background,
          "text-halo-width": 1.2,
          "text-opacity": 0.82,
        },
      },
    ],
  };
}
