// Drives the real App geolocation callback along a curved road and captures
// the original fields straight, turning left and turning right.
// Usage: QA_URL=http://localhost:5183/ QA_VISUALS=Aperture,Meridian node scripts/qa-visual-curves.mjs
import fs from "node:fs/promises";

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
const base = process.env.QA_URL || "http://localhost:5183/";
const out = process.env.QA_OUTPUT || "output/visual-curves";
const visuals = (process.env.QA_VISUALS || "Aperture,Meridian").split(",");
const appearance = process.env.QA_APPEARANCE || "dark";
const intervalMs = Number(process.env.QA_GPS_MS || 100);
await fs.mkdir(out, { recursive: true });

const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_EXECUTABLE || undefined, args: ["--mute-audio", "--use-gl=angle", "--enable-unsafe-swiftshader"] });
const evidence = { shots: [], errors: [] };

for (const visual of visuals) {
  const context = await browser.newContext({ viewport: { width: 773, height: 601 }, deviceScaleFactor: 1, colorScheme: appearance });
  const page = await context.newPage();
  page.on("pageerror", (error) => evidence.errors.push(`${visual}: ${error.message}`));
  await page.route("**/api/send-diagnostic.php", (route) => route.abort());
  await page.addInitScript(({ appearance, intervalMs }) => {
    if (!sessionStorage.getItem("qa-curve")) { localStorage.setItem("sedicivalvole.appearance.v1", appearance); sessionStorage.setItem("qa-curve", "1"); }
    // A simple kinematic road: speed in km/h, turn rate in degrees per second.
    const road = { speedKmh: 0, turnRate: 0, heading: 90, lat: 45.4642, lon: 9.19 };
    window.__qaRoad = road;
    let last = performance.now();
    const fix = () => {
      const now = performance.now();
      const dt = (now - last) / 1000;
      last = now;
      road.heading = (road.heading + road.turnRate * dt + 360) % 360;
      const metres = road.speedKmh / 3.6 * dt;
      const rad = road.heading * Math.PI / 180;
      road.lat += (metres * Math.cos(rad)) / 111_320;
      road.lon += (metres * Math.sin(rad)) / (111_320 * Math.cos(road.lat * Math.PI / 180));
      return { timestamp: Date.now(), coords: { latitude: road.lat, longitude: road.lon, speed: road.speedKmh / 3.6, heading: road.heading, accuracy: 4 } };
    };
    Object.defineProperty(navigator, "geolocation", { value: {
      watchPosition(callback) { callback(fix()); return setInterval(() => callback(fix()), intervalMs); },
      clearWatch(id) { clearInterval(id); },
      getCurrentPosition(callback) { callback(fix()); },
    } });
  }, { appearance, intervalMs });
  await page.goto(base);
  await page.getByRole("button", { name: /^START/ }).waitFor();
  await page.locator(".cockpit-sources button", { hasText: "Play the Road" }).click();
  await page.getByRole("button", { name: "Choose visual" }).click();
  await page.locator(".cockpit-picker-options button").filter({ has: page.locator("strong", { hasText: new RegExp(`^${visual}$`) }) }).click();
  await page.locator(".cockpit-start").click();
  await page.locator(".app.phase-running").waitFor({ timeout: 15000 });
  const name = visual.toLowerCase().replace(/\s+/g, "-");
  const capture = async (label) => {
    await page.keyboard.press("Escape");
    await page.waitForTimeout(600);
    const path = `${out}/${appearance}-${name}-${label}.png`;
    await page.screenshot({ path });
    evidence.shots.push(path);
  };
  await page.waitForTimeout(1500);
  await capture("rest");
  await page.evaluate(() => { window.__qaRoad.speedKmh = 18; });
  await page.waitForTimeout(1600);
  await capture("wall-18kmh");
  await page.evaluate(() => { window.__qaRoad.speedKmh = 70; });
  await page.waitForTimeout(3500);
  await capture("straight-70");
  await page.evaluate(() => { window.__qaRoad.turnRate = -14; });
  await page.waitForTimeout(2600);
  await capture("left-70");
  await page.evaluate(() => { window.__qaRoad.turnRate = 14; });
  await page.waitForTimeout(3200);
  await capture("right-70");
  await context.close();
}

await browser.close();
console.log(JSON.stringify(evidence, null, 2));
