import assert from "node:assert/strict";
import test from "node:test";
import { FLUX_THEMES } from "../src/flux-themes.js";
import { contrastRatio, hexToOklab, resolveContrast, resolveSemanticTheme } from "../src/semantic-theme.js";

test("WCAG reference pairs retain exact unrounded threshold arithmetic", () => {
  assert.equal(contrastRatio("#000000", "#ffffff"), 21);
  assert.equal(contrastRatio("#abcdef", "#abcdef"), 1);
  assert.ok(contrastRatio("#777777", "#ffffff") < 4.5);
  assert.ok(contrastRatio("#767676", "#ffffff") > 4.5);
});

for (const theme of FLUX_THEMES) {
  for (const appearance of ["light", "dark"]) {
    test(`${theme.id} × ${appearance}: every critical semantic role passes all declared surfaces`, () => {
      const before = JSON.stringify(theme);
      const result = resolveSemanticTheme(theme, appearance);
      assert.equal(resolveSemanticTheme(theme, appearance), result, "palette variants are cached outside frame work");
      for (const [name, role] of Object.entries(result.roles)) {
        for (const background of role.backgrounds) assert.ok(contrastRatio(role.resolved, background) >= role.minimum, `${name} ${role.resolved} on ${background}`);
        assert.equal(role.variant, role.raw === role.resolved ? "authored" : "contrast-enhanced");
        if (role.rawRatio >= role.minimum) assert.equal(role.resolved, role.raw, "preserve a passing authored colour byte-for-byte");
        else {
          const [, a, b] = hexToOklab(role.raw);
          const [, c, d] = hexToOklab(role.resolved);
          const angle = Math.atan2(b, a) - Math.atan2(d, c);
          const hueDifference = Math.abs(Math.atan2(Math.sin(angle), Math.cos(angle))) * 180 / Math.PI;
          if (Math.hypot(a, b) > .025 && Math.hypot(c, d) > .025) assert.ok(hueDifference < 3, `${name}: hue drift ${hueDifference}`);
        }
      }
      assert.equal(JSON.stringify(theme), before, "renderer palette is untouched");
    });
  }
}

test("ACID green is corrected for LIGHT and retains its authored DARK colour", () => {
  const acid = FLUX_THEMES.find((theme) => theme.id === "acid");
  const light = resolveSemanticTheme(acid, "light").roles.chartSecondary;
  const dark = resolveSemanticTheme(acid, "dark").roles.chartSecondary;
  assert.equal(light.raw, "#54ff29");
  assert.ok(light.rawRatio < 1.5);
  assert.equal(light.variant, "contrast-enhanced");
  assert.equal(dark.variant, "authored");
});

test("invalid and mutually impossible contrast contexts fail explicitly", () => {
  assert.throws(() => resolveContrast("red", "#ffffff"), TypeError);
  assert.throws(() => resolveContrast("#777777", [], 4.5), RangeError);
  assert.throws(() => resolveContrast("#777777", ["#000000", "#ffffff"], 7), RangeError);
});
