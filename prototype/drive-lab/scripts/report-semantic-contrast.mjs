import { FLUX_THEMES } from "../src/flux-themes.js";
import { resolveSemanticTheme } from "../src/semantic-theme.js";

console.log("palette,appearance,role,raw,resolved,variant,minimum,raw_ratio,resolved_ratio,backgrounds");
for (const theme of FLUX_THEMES) {
  for (const appearance of ["light", "dark"]) {
    for (const [role, value] of Object.entries(resolveSemanticTheme(theme, appearance).roles)) {
      console.log([theme.id, appearance, role, value.raw, value.resolved, value.variant,
        value.minimum, value.rawRatio.toFixed(6), value.ratio.toFixed(6), value.backgrounds.join("|")].join(","));
    }
  }
}
