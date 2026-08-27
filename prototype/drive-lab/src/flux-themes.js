// Body-colour themes.
//
// A theme is a purposeful visual control, not a shader parameter: it sets the
// generative field's palette and the interface accent together, and nothing
// else. `base`, `mid`, `light`, `accent` and `secondary` are linear RGB in
// 0..1, read directly by the WebGL fields and their Canvas2D fallbacks.
//
// The first five are the vehicle's own body colours. The five after them are
// finishes no car is painted in, kept deliberately separate so the list still
// reads as "the car, then everything else". A theme that genuinely uses two
// colours declares `swatchSecondary`, and the control shows both rather than
// picking one and hiding the other.
//
// `red` must stay the default: it is the accepted QA state.

export const FLUX_THEMES = [
  {
    id: "pearl",
    label: "PEARL 01",
    swatch: "#eee9dc",
    palette: {
      base: [0.018, 0.021, 0.022],
      mid: [0.27, 0.28, 0.27],
      light: [0.93, 0.91, 0.86],
      accent: [0.78, 0.76, 0.70],
      secondary: [0.42, 0.55, 0.67],
    },
  },
  {
    id: "graphite",
    label: "GRAPHITE 02",
    swatch: "#454646",
    palette: {
      base: [0.012, 0.014, 0.015],
      mid: [0.23, 0.24, 0.24],
      light: [0.82, 0.82, 0.78],
      accent: [0.48, 0.50, 0.49],
      secondary: [0.19, 0.32, 0.45],
    },
  },
  {
    id: "red",
    label: "RED 03",
    swatch: "#ed2d24",
    palette: {
      base: [0.014, 0.017, 0.018],
      mid: [0.25, 0.26, 0.25],
      light: [0.94, 0.92, 0.86],
      accent: [0.93, 0.07, 0.035],
      secondary: [0.04, 0.20, 0.72],
    },
  },
  {
    id: "blue",
    label: "BLUE 04",
    swatch: "#203c6e",
    palette: {
      base: [0.01, 0.016, 0.026],
      mid: [0.14, 0.22, 0.34],
      light: [0.86, 0.89, 0.90],
      accent: [0.055, 0.23, 0.56],
      secondary: [0.76, 0.82, 0.90],
    },
  },
  {
    id: "silver",
    label: "SILVER 05",
    swatch: "#a6a7a3",
    palette: {
      base: [0.016, 0.019, 0.02],
      mid: [0.31, 0.32, 0.31],
      light: [0.90, 0.90, 0.86],
      accent: [0.66, 0.67, 0.65],
      secondary: [0.28, 0.42, 0.56],
    },
  },
  {
    id: "neon",
    label: "NEON 06",
    swatch: "#ff2d95",
    swatchSecondary: "#3dff6e",
    palette: {
      base: [0.008, 0.008, 0.012],
      mid: [0.20, 0.10, 0.22],
      light: [0.95, 0.92, 0.96],
      accent: [1.0, 0.10, 0.52],
      secondary: [0.18, 1.0, 0.36],
    },
  },
  {
    id: "mint",
    label: "MINT 07",
    swatch: "#a8e6cf",
    swatchSecondary: "#e0479e",
    palette: {
      base: [0.012, 0.020, 0.019],
      mid: [0.18, 0.30, 0.28],
      light: [0.92, 0.96, 0.93],
      accent: [0.60, 0.90, 0.79],
      secondary: [0.86, 0.22, 0.60],
    },
  },
  {
    id: "sodium",
    label: "SODIUM 08",
    swatch: "#ff9d2e",
    palette: {
      // The colour of motorway lighting: amber over a warm, almost brown black.
      base: [0.022, 0.014, 0.008],
      mid: [0.32, 0.20, 0.09],
      light: [0.98, 0.88, 0.72],
      accent: [1.0, 0.58, 0.14],
      secondary: [0.35, 0.24, 0.42],
    },
  },
  {
    id: "signal",
    label: "SIGNAL 09",
    swatch: "#e4362a",
    swatchSecondary: "#9ad4ff",
    palette: {
      // The splash's own pairing, carried into the drive.
      base: [0.008, 0.010, 0.014],
      mid: [0.22, 0.24, 0.28],
      light: [0.94, 0.95, 0.97],
      accent: [0.89, 0.19, 0.14],
      secondary: [0.55, 0.80, 1.0],
    },
  },
  {
    id: "sulphur",
    label: "SULPHUR 10",
    swatch: "#e6d02a",
    swatchSecondary: "#6b3fd4",
    palette: {
      base: [0.014, 0.013, 0.020],
      mid: [0.26, 0.24, 0.16],
      light: [0.96, 0.94, 0.82],
      accent: [0.90, 0.82, 0.16],
      secondary: [0.40, 0.24, 0.82],
    },
  },
];

/** `red` is the default and the fallback for an unknown identifier. */
export const DEFAULT_THEME_ID = "red";

export function getFluxTheme(themeId) {
  return FLUX_THEMES.find((theme) => theme.id === themeId)
    ?? FLUX_THEMES.find((theme) => theme.id === DEFAULT_THEME_ID);
}
