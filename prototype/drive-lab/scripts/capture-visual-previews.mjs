// Captures the real product preview frames used by the Visual gallery, the
// Intro picker and the passenger remote: DARK appearance, red palette, 2x
// density, chrome hidden. Output PNGs are converted to 384 x 298 WebP by
// scripts/convert-visual-previews.py.
// Usage: QA_URL=http://localhost:5183/ node scripts/capture-visual-previews.mjs
import fs from "node:fs/promises";

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
const base = process.env.QA_URL || "http://localhost:5183/";
const out = process.env.QA_OUTPUT || "output/visual-previews";
const only = process.env.QA_ONLY ? new Set(process.env.QA_ONLY.split(",")) : null;
await fs.mkdir(out, { recursive: true });

const SHOTS = [
  { id: "aperture", pick: "Aperture", speed: 72, turn: 6, settle: 5000 },
  { id: "vertigo", pick: "Vertigo", speed: 80, turn: 0, settle: 5000 },
  { id: "meridian", pick: "Meridian", speed: 58, turn: -8, settle: 6000 },
  { id: "drivey", pick: "Drivey", speed: 70, turn: 0, settle: 7000 },
  { id: "prtcl", pick: "Prtcl", speed: 40, turn: 0, settle: 5000 },
  { id: "japanese-mist", pick: "Gradient", variant: "Japanese Mist", speed: 60, turn: 0, settle: 7000 },
  { id: "acid-orchard", pick: "Gradient", variant: "Acid Orchard", speed: 60, turn: 0, settle: 7000 },
  { id: "chromatic-silk", pick: "Gradient", variant: "Chromatic Silk", speed: 60, turn: 0, settle: 7000 },
  { id: "atlas", pick: "Atlas", speed: 35, turn: 4, settle: 12000 },
  { id: "air-atlas", pick: "Air Atlas", speed: 0, turn: 0, settle: 12000 },
  { id: "discover", pick: "Discover", speed: 0, turn: 0, settle: 12000, panel: true },
  { id: "stats", pick: "Stats for Nerds", speed: 45, turn: 5, settle: 8000, panel: true, running: "Aperture" },
];

const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_EXECUTABLE || undefined, args: ["--mute-audio", "--use-gl=angle", "--enable-unsafe-swiftshader"] });
const results = [];

for (const shot of SHOTS) {
  if (only && !only.has(shot.id)) continue;
  const context = await browser.newContext({ viewport: { width: 773, height: 601 }, deviceScaleFactor: 2, colorScheme: "dark" });
  const page = await context.newPage();
  await page.route("**/api/send-diagnostic.php", (route) => route.abort());
  await page.addInitScript(({ speed, turn }) => {
    if (!sessionStorage.getItem("preview-init")) {
      localStorage.setItem("sedicivalvole.appearance.v1", "dark");
      localStorage.setItem("sedicivalvole.preferences.v2", JSON.stringify({ themeId: "red", atlasMapAppearance: "palette" }));
      sessionStorage.setItem("preview-init", "1");
    }
    const road = { speed, turn, heading: 60, lat: 45.4642, lon: 9.19 };
    let last = performance.now();
    const fix = () => {
      const now = performance.now();
      const dt = (now - last) / 1000;
      last = now;
      road.heading = (road.heading + road.turn * dt + 360) % 360;
      const metres = road.speed / 3.6 * dt;
      const rad = road.heading * Math.PI / 180;
      road.lat += (metres * Math.cos(rad)) / 111_320;
      road.lon += (metres * Math.sin(rad)) / (111_320 * Math.cos(road.lat * Math.PI / 180));
      return { timestamp: Date.now(), coords: { latitude: road.lat, longitude: road.lon, speed: road.speed / 3.6, heading: road.heading, accuracy: 4 } };
    };
    Object.defineProperty(navigator, "geolocation", { value: {
      watchPosition(callback) { callback(fix()); return setInterval(() => callback(fix()), 200); },
      clearWatch(id) { clearInterval(id); },
      getCurrentPosition(callback) { callback(fix()); },
    } });
  }, { speed: shot.speed, turn: shot.turn });
  await page.goto(base);
  await page.getByRole("button", { name: /^START/ }).waitFor();
  await page.locator(".cockpit-sources button", { hasText: "Mute" }).click();
  const choose = async (name) => {
    await page.getByRole("button", { name: "Choose visual" }).click();
    await page.locator(".cockpit-picker-options button").filter({ has: page.locator("strong", { hasText: new RegExp(`^${name}$`) }) }).click();
  };
  await choose(shot.panel && shot.running ? shot.running : shot.pick);
  if (shot.variant) await page.locator(".cockpit-picker-options button").filter({ has: page.locator("strong", { hasText: new RegExp(`^${shot.variant}$`) }) }).click();
  await page.locator(".cockpit-start").click();
  await page.locator(".app.phase-running").waitFor({ timeout: 20000 });
  if (shot.panel && shot.running) {
    await page.waitForTimeout(4000);
    await page.mouse.click(386, 300);
    await page.waitForTimeout(400);
    await page.locator(".environment-control").click();
    await page.locator(".visual-gallery .score-entry").filter({ has: page.locator("strong", { hasText: new RegExp(`^${shot.pick}$`) }) }).click();
  }
  await page.waitForTimeout(shot.settle);
  await page.addStyleTag({ content: ".experience .topbar, .experience .topbar *, .footer-stack, .footer-stack *, .contextual-rail, .engine-contextual-rail, [class*='cycle-control'], .session-update-notice, .control-status-notice, .keyboard-hint { visibility: hidden !important; }" });
  await page.waitForTimeout(300);
  const path = `${out}/${shot.id}.png`;
  await page.screenshot({ path });
  results.push(path);
  await context.close();
}

await browser.close();
console.log(JSON.stringify(results, null, 2));
