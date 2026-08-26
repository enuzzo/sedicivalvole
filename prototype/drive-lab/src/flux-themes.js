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
    },
  },
];

export function getFluxTheme(themeId) {
  return FLUX_THEMES.find((theme) => theme.id === themeId) ?? FLUX_THEMES[2];
}
