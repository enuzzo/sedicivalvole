// Visual regression gate for the interface chrome.
//
// Captures deterministic states of the real App at the Tesla split viewport
// (773 x 601) and the phone remote (390 x 844): animated fields are replaced by
// a flat backdrop, motion is disabled, Math.random is constant, catalogue and
// GPS are fixtures, and the build stamp is masked. Each capture is compared with
// the committed baseline in tests/visual-baseline/ inside Chromium itself.
//
//   npm run qa:visual            compare (fails on drift, writes diffs to output/visual-regression)
//   npm run qa:visual -- --update  accept the current rendering as the new baseline
//
// Requires a running server: QA_URL (default http://localhost:5183/, the dev
// server). The same baseline holds for the compiled build, so a release can be
// checked with QA_URL=http://localhost:5184/ (`npm run preview`).
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
const root = fileURLToPath(new URL("..", import.meta.url));
const base = process.env.QA_URL || "http://localhost:5183/";
const baselineDir = path.join(root, "tests", "visual-baseline");
const outDir = path.join(root, "output", "visual-regression");
const update = process.argv.includes("--update");
// A pixel counts as changed above this per-channel difference; a screen fails
// when more than this share of pixels changed. Text antialiasing stays below it.
const CHANNEL_TOLERANCE = 28;
const MAX_CHANGED_SHARE = 0.004;
await fs.mkdir(outDir, { recursive: true });
await fs.mkdir(baselineDir, { recursive: true });

const tracks = [1, 2, 3, 4, 5, 6].map((n) => ({
  id: String(2000 + n), name: ["Night Drive", "Glass City", "Open Roads", "Standstill", "Low Sun", "Meridian Line"][n - 1],
  artist_id: "qa", artist_name: "Synthetic QA", album_name: "Baseline", license_ccurl: "https://creativecommons.org/licenses/by-nc-sa/4.0/",
  audio: `https://prod-1.storage.jamendo.com/?trackid=${2000 + n}&format=mp32`, shareurl: `https://www.jamendo.com/track/${2000 + n}`,
  musicinfo: { tags: { genres: ["jazz"] } },
}));
const silence = Buffer.alloc(44 + 48000 * 2);
silence.write("RIFF", 0); silence.writeUInt32LE(silence.length - 8, 4); silence.write("WAVEfmt ", 8); silence.writeUInt32LE(16, 16); silence.writeUInt16LE(1, 20); silence.writeUInt16LE(1, 22); silence.writeUInt32LE(48000, 24); silence.writeUInt32LE(96000, 28); silence.writeUInt16LE(2, 32); silence.writeUInt16LE(16, 34); silence.write("data", 36); silence.writeUInt32LE(silence.length - 44, 40);

const FREEZE_CSS = `
  *, *::before, *::after { animation: none !important; transition: none !important; caret-color: transparent !important; }
  canvas, iframe, video, .field-canvas, .splash canvas { visibility: hidden !important; }
  .splash, .experience, .app { background: #101114 !important; }
  .intro-build, .cockpit-build, .intro-diagnostics, .intro-cache-reset { visibility: hidden !important; }
`;

const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_EXECUTABLE || undefined, args: ["--mute-audio", "--font-render-hinting=none", "--disable-lcd-text"] });

async function open({ appearance, viewport = { width: 773, height: 601 }, url = base, speedKmh = 0 }) {
  const context = await browser.newContext({ viewport, deviceScaleFactor: 1, colorScheme: appearance, reducedMotion: "reduce", timezoneId: "Europe/Rome", locale: "en-GB" });
  const page = await context.newPage();
  await page.route("**/api/send-diagnostic.php", (route) => route.abort());
  await page.route("**/api/soundtrack-catalog.php?*", (route) => route.fulfill({ json: { schema: "sedicivalvole.soundtrack-catalog-api.v1", generatedAt: "2026-09-24T12:00:00.000Z", tracks } }));
  await page.route("**/api/soundtrack-audio.php?*", (route) => route.fulfill({ contentType: "audio/wav", body: silence }));
  await page.route("**/audio/illobo/catalog.json", (route) => route.fulfill({ json: { schema: "sedicivalvole.illobo-public-catalog.v1", tracks: [] } }));
  await page.addInitScript(({ appearance, speedKmh }) => {
    if (!sessionStorage.getItem("baseline-init")) {
      localStorage.clear();
      localStorage.setItem("sedicivalvole.appearance.v1", appearance);
      sessionStorage.setItem("baseline-init", "1");
    }
    // A constant, not a seeded sequence: React's development mode calls
    // initializers twice, so a sequence would pick different launch visuals
    // and presets on the dev server and on the compiled build. Every random
    // loop in src is bounded (splice-based), so a constant cannot stall one.
    Math.random = () => 0.05;
    const fix = () => ({ timestamp: Date.now(), coords: { speed: speedKmh / 3.6, heading: 90, accuracy: 5, latitude: 45.4642, longitude: 9.19 } });
    Object.defineProperty(navigator, "geolocation", { value: {
      watchPosition(callback) { callback(fix()); return setInterval(() => callback(fix()), 1000); },
      clearWatch(id) { clearInterval(id); },
      getCurrentPosition(callback) { callback(fix()); },
    } });
  }, { appearance, speedKmh });
  await page.goto(url);
  await page.addStyleTag({ content: FREEZE_CSS });
  return { context, page };
}

async function running(page, source = "play-road") {
  await page.getByRole("button", { name: /^START/ }).waitFor();
  if (source === "play-road") await page.locator(".cockpit-sources button", { hasText: "Play the Road" }).click();
  await page.locator(".cockpit-start").click();
  await page.locator(".app.phase-running").waitFor({ timeout: 20000 });
  await page.addStyleTag({ content: FREEZE_CSS });
  await page.waitForTimeout(1500);
}

async function wake(page) {
  await page.mouse.click(386, 300);
  await page.waitForTimeout(400);
}

const captures = [];
async function capture(page, name) {
  await page.waitForTimeout(350);
  const file = path.join(outDir, `${name}.png`);
  await page.screenshot({ path: file, animations: "disabled" });
  captures.push({ name, file });
}

for (const appearance of ["dark", "light"]) {
  {
    const { context, page } = await open({ appearance, speedKmh: 84 });
    await page.getByRole("button", { name: /^START/ }).waitFor();
    await page.waitForTimeout(3500);
    await capture(page, `${appearance}-intro`);
    await running(page);
    await wake(page);
    await capture(page, `${appearance}-running`);
    await page.locator(".environment-control").click();
    await capture(page, `${appearance}-visual-library`);
    await page.keyboard.press("Escape");
    await wake(page);
    await page.locator(".score-control").click();
    await capture(page, `${appearance}-music-library`);
    await page.keyboard.press("Escape");
    await wake(page);
    await page.locator(".mix-button").click();
    await capture(page, `${appearance}-fx-deck`);
    await page.keyboard.press("Escape");
    await wake(page);
    await page.locator(".palette-trigger").click();
    await capture(page, `${appearance}-palette`);
    await context.close();
  }
  {
    const { context, page } = await open({ appearance });
    await page.getByRole("button", { name: /^START/ }).waitFor();
    await page.locator(".cockpit-modes button", { hasText: "Engine" }).click();
    await page.locator(".cockpit-start").click();
    await page.locator(".app.phase-running").waitFor({ timeout: 20000 });
    await page.addStyleTag({ content: FREEZE_CSS + " .engine-telemetry svg { visibility: hidden !important; }" });
    await page.waitForTimeout(2000);
    await wake(page);
    await capture(page, `${appearance}-engine`);
    await context.close();
  }
  {
    const { context, page } = await open({ appearance, viewport: { width: 390, height: 844 }, url: `${base}?remote=phone&appearance=${appearance}` });
    await page.waitForTimeout(1500);
    await page.addStyleTag({ content: ".remote-scene-beam, .remote-scene-link-ring { visibility: hidden !important; }" });
    await capture(page, `${appearance}-phone-guide`);
    await context.close();
  }
}

// Compare inside Chromium: both images are decoded on canvases.
const comparer = await (await browser.newContext()).newPage();
const results = [];
for (const { name, file } of captures) {
  const reference = path.join(baselineDir, `${name}.png`);
  if (update) {
    await fs.copyFile(file, reference);
    results.push({ name, status: "updated" });
    continue;
  }
  let referenceBytes;
  try { referenceBytes = await fs.readFile(reference); } catch { results.push({ name, status: "missing-baseline" }); continue; }
  const currentBytes = await fs.readFile(file);
  const result = await comparer.evaluate(async ({ a, b, tolerance, limit }) => {
    const load = async (b64) => { const image = new Image(); image.src = `data:image/png;base64,${b64}`; await image.decode(); return image; };
    const [left, right] = await Promise.all([load(a), load(b)]);
    if (left.width !== right.width || left.height !== right.height) return { sizeMismatch: true };
    const canvas = new OffscreenCanvas(left.width, left.height);
    const context = canvas.getContext("2d", { willReadFrequently: true });
    context.drawImage(left, 0, 0);
    const first = context.getImageData(0, 0, left.width, left.height).data;
    context.clearRect(0, 0, left.width, left.height);
    context.drawImage(right, 0, 0);
    const second = context.getImageData(0, 0, left.width, left.height);
    let changed = 0;
    for (let index = 0; index < first.length; index += 4) {
      const delta = Math.max(Math.abs(first[index] - second.data[index]), Math.abs(first[index + 1] - second.data[index + 1]), Math.abs(first[index + 2] - second.data[index + 2]));
      if (delta > tolerance) {
        changed += 1;
        second.data[index] = 255; second.data[index + 1] = 0; second.data[index + 2] = 255; second.data[index + 3] = 255;
      }
    }
    const total = first.length / 4;
    if (changed / total <= limit) return { changed, total, diff: null };
    context.putImageData(second, 0, 0);
    const blob = await canvas.convertToBlob({ type: "image/png" });
    const diff = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result).split(",")[1]);
      reader.readAsDataURL(blob);
    });
    return { changed, total, diff };
  }, { a: referenceBytes.toString("base64"), b: currentBytes.toString("base64"), tolerance: CHANNEL_TOLERANCE, limit: MAX_CHANGED_SHARE });
  if (result.sizeMismatch) { results.push({ name, status: "size-mismatch" }); continue; }
  const share = result.changed / result.total;
  const passed = share <= MAX_CHANGED_SHARE;
  if (!passed && result.diff) await fs.writeFile(path.join(outDir, `${name}.diff.png`), Buffer.from(result.diff, "base64"));
  results.push({ name, status: passed ? "pass" : "fail", changedShare: Number(share.toFixed(5)) });
}
await browser.close();

console.log(JSON.stringify(results, null, 2));
const failures = results.filter((result) => !["pass", "updated"].includes(result.status));
if (failures.length) {
  console.error(`Visual regression: ${failures.length} of ${results.length} screens differ. Diffs in ${path.relative(root, outDir)}. Accept intended changes with --update.`);
  process.exit(1);
}
console.log(update ? `Baseline updated: ${results.length} screens.` : `Visual regression passed: ${results.length} screens.`);
