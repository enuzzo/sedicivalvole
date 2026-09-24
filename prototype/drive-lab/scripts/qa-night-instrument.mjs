// Night Instrument visual QA: captures every restyled surface at the Tesla
// split viewport (773 x 601) and the phone remote, in LIGHT and DARK, with
// synthetic catalogue/audio fixtures and a controllable fake GPS speed.
// Usage: QA_URL=http://127.0.0.1:5183/ QA_OUTPUT=output/night-instrument node scripts/qa-night-instrument.mjs
import fs from "node:fs/promises";
import assert from "node:assert/strict";

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
const out = process.env.QA_OUTPUT || "output/night-instrument";
const base = process.env.QA_URL || "http://127.0.0.1:5183/";
const only = process.env.QA_ONLY ? new Set(process.env.QA_ONLY.split(",")) : null;
await fs.mkdir(out, { recursive: true });

const fixture = Buffer.alloc(44 + 48000 * 20 * 2);
fixture.write("RIFF", 0); fixture.writeUInt32LE(fixture.length - 8, 4); fixture.write("WAVEfmt ", 8); fixture.writeUInt32LE(16, 16); fixture.writeUInt16LE(1, 20); fixture.writeUInt16LE(1, 22); fixture.writeUInt32LE(48000, 24); fixture.writeUInt32LE(96000, 28); fixture.writeUInt16LE(2, 32); fixture.writeUInt16LE(16, 34); fixture.write("data", 36); fixture.writeUInt32LE(fixture.length - 44, 40);
for (let i = 0; i < (fixture.length - 44) / 2; i += 1) fixture.writeInt16LE(Math.round(Math.sin(i * 2 * Math.PI * 220 / 48000) * 500), 44 + i * 2);

const evidence = { url: base, shots: [], checks: [], errors: [], warnings: [], sends: 0 };
const track = (id, genre) => ({ id: String(id), name: ["Night Drive", "Des lèvres vénéneuses", "Standstill Part 3 and 4", "Chanson d'automne", "Open Roads", "Glass City"][id % 6], artist_id: "qa", artist_name: id % 2 ? "FairyTale&amp;Ghosts [F. T. G]" : "Synthetic QA", album_name: "Launch fixture", license_ccurl: "https://creativecommons.org/licenses/by-nc-sa/4.0/", audio: `https://prod-1.storage.jamendo.com/?trackid=${id}&format=mp32`, shareurl: `https://www.jamendo.com/track/${id}`, musicinfo: { tags: { genres: [genre] } } });

const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_EXECUTABLE || undefined, args: ["--mute-audio", "--use-gl=angle", "--enable-unsafe-swiftshader"] });

async function session({ appearance = "dark", viewport = { width: 773, height: 601 }, url = base, preferences = null, speedKmh = 0, mobile = false } = {}) {
  const context = await browser.newContext({ viewport, deviceScaleFactor: mobile ? 2 : 1, isMobile: mobile, hasTouch: mobile, colorScheme: appearance, reducedMotion: "no-preference" });
  const page = await context.newPage();
  page.on("pageerror", (error) => evidence.errors.push(`${appearance} ${error.message}`));
  page.on("console", (message) => { if (message.type() === "error" && !/503|Failed to load resource|WebSocket/.test(message.text())) evidence.warnings.push(message.text().slice(0, 200)); });
  await page.route("**/api/send-diagnostic.php", (route) => { evidence.sends += 1; return route.abort(); });
  await page.route("**/api/soundtrack-catalog.php?*", (route) => {
    const genre = new URL(route.request().url()).searchParams.get("genre") || "all";
    return route.fulfill({ json: { schema: "sedicivalvole.soundtrack-catalog-api.v1", generatedAt: new Date().toISOString(), tracks: [1, 2, 3, 4, 5, 6].map((n) => track(1000 + n, genre)) } }).catch(() => {});
  });
  await page.route("**/audio/illobo/catalog.json", (route) => route.fulfill({ json: { schema: "sedicivalvole.illobo-public-catalog.v1", tracks: [{ id: "qa-lobo", title: "Synthetic QA fixture", filename: "qa-fixture.mp3" }] } }));
  await page.route("**/audio/illobo/qa-fixture.mp3", (route) => route.fulfill({ contentType: "audio/wav", body: fixture }));
  await page.route("**/api/soundtrack-audio.php?*", (route) => route.fulfill({ contentType: "audio/wav", body: fixture }));
  await page.addInitScript(({ appearance, preferences, speedKmh, mobile }) => {
    if (!sessionStorage.getItem("qa-initialized")) {
      localStorage.setItem("sedicivalvole.appearance.v1", appearance);
      if (preferences) localStorage.setItem("sedicivalvole.preferences.v2", JSON.stringify(preferences));
      sessionStorage.setItem("qa-initialized", "1");
    }
    window.__qaSpeed = speedKmh / 3.6;
    const fix = () => ({ timestamp: Date.now(), coords: { speed: window.__qaSpeed, heading: 90, accuracy: 5, latitude: 45.4642, longitude: 9.19 } });
    Object.defineProperty(navigator, "geolocation", { value: {
      watchPosition(callback) { callback(fix()); return setInterval(() => callback(fix()), 1000); },
      clearWatch(id) { clearInterval(id); },
      getCurrentPosition(callback) { callback(fix()); },
    } });
    if (mobile) {
      const nativeMatchMedia = window.matchMedia.bind(window);
      window.matchMedia = (query) => /pointer:\s*coarse/.test(query) ? { matches: true, media: query, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} } : nativeMatchMedia(query);
    }
  }, { appearance, preferences, speedKmh, mobile });
  await page.goto(url);
  return { context, page };
}

async function shot(page, name) {
  if (only && !only.has(name.replace(/^(dark|light)-/, ""))) return;
  await page.waitForTimeout(450);
  const path = `${out}/${name}.png`;
  await page.screenshot({ path });
  evidence.shots.push(path);
}

async function wake(page) {
  await page.mouse.click(386, 300);
  await page.waitForTimeout(500);
}

async function startRunning(page, source) {
  await page.getByRole("button", { name: /^START/ }).waitFor();
  if (source === "play-road") await page.locator(".cockpit-sources button", { hasText: "Play the Road" }).click();
  await page.waitForTimeout(400);
  await page.locator(".cockpit-start").click();
  await page.locator(".app.phase-running").waitFor({ timeout: 15000 });
  await page.waitForTimeout(2200);
}

for (const appearance of process.env.QA_MAIN === "0" ? [] : ["dark", "light"]) {
  // Intro, Soundtrack running, Music drawer (Soundtrack), FX deck, palette.
  {
    const { context, page } = await session({ appearance, speedKmh: 0 });
    await page.getByRole("button", { name: /^START/ }).waitFor();
    await page.waitForTimeout(3600);
    await shot(page, `${appearance}-intro`);
    await startRunning(page, "soundtrack");
    await page.keyboard.press("Escape");
    await page.waitForTimeout(700);
    await shot(page, `${appearance}-soundtrack-rest`);
    await wake(page);
    await shot(page, `${appearance}-soundtrack-awake`);
    await page.locator(".score-control").click();
    await page.waitForTimeout(600);
    await shot(page, `${appearance}-music-soundtrack`);
    await page.keyboard.press("Escape");
    await wake(page);
    await page.locator(".mix-button").click();
    await page.waitForTimeout(400);
    const pads = page.locator(".fx-pad");
    assert.equal(await pads.count(), 8);
    await pads.nth(0).click();
    const box = await pads.nth(6).boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height - 10);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height * 0.45, { steps: 6 });
    await page.mouse.up();
    evidence.checks.push(`${appearance}: pad tap and drag set ${await pads.nth(0).getAttribute("aria-valuenow")}% / ${await pads.nth(6).getAttribute("aria-valuenow")}%`);
    await shot(page, `${appearance}-fx-deck`);
    await page.keyboard.press("Escape");
    await wake(page);
    await page.locator(".palette-trigger").click();
    await shot(page, `${appearance}-palette`);
    await context.close();
  }
  // Play the Road while moving: speed gauge, Visual gallery, Road library, Engine.
  {
    const { context, page } = await session({ appearance, speedKmh: 84 });
    await startRunning(page, "play-road");
    await page.waitForTimeout(1500);
    await page.keyboard.press("Escape");
    await page.waitForTimeout(700);
    await shot(page, `${appearance}-road-rest-moving`);
    await wake(page);
    await shot(page, `${appearance}-road-awake-moving`);
    await page.locator(".environment-control").click();
    await shot(page, `${appearance}-visual-gallery`);
    await page.keyboard.press("Escape");
    await wake(page);
    await page.locator(".score-control").click();
    await shot(page, `${appearance}-music-road`);
    await page.keyboard.press("Escape");
    await page.evaluate(() => { window.__qaSpeed = 0; });
    await page.waitForTimeout(2500);
    await wake(page);
    await page.locator(".mode-selector button", { hasText: "ENGINE" }).click();
    await page.waitForTimeout(2500);
    await wake(page);
    await shot(page, `${appearance}-engine-awake`);
    await page.keyboard.press("Escape");
    await page.waitForTimeout(700);
    await shot(page, `${appearance}-engine-rest`);
    await context.close();
  }
  // Passenger remote, unpaired, on a phone.
  {
    const { context, page } = await session({ appearance, viewport: { width: 390, height: 844 }, url: `${base}?remote=phone&appearance=${appearance}` });
    await page.waitForTimeout(1500);
    await shot(page, `${appearance}-phone-guide`);
    await context.close();
  }
}

// Secondary surfaces: report, support, Discover, Stats, Atlas and Air Atlas.
for (const appearance of process.env.QA_SURFACES === "1" ? ["dark", "light"] : []) {
  const { context, page } = await session({ appearance, speedKmh: 38 });
  await startRunning(page, "play-road");
  await page.waitForTimeout(1500);
  const openFromGallery = async (name) => {
    await wake(page);
    await page.locator(".environment-control").click();
    await page.locator(".visual-gallery .score-entry").filter({ has: page.locator("strong", { hasText: new RegExp(`^${name}$`) }) }).click();
  };
  await wake(page);
  await page.locator(".report-button").click();
  await page.waitForTimeout(900);
  await shot(page, `${appearance}-surface-report`);
  await page.locator(".diagnostic-report-drawer .coffee-support-button").click().catch(() => {});
  await page.waitForTimeout(900);
  await shot(page, `${appearance}-surface-support`);
  await page.keyboard.press("Escape");
  await page.keyboard.press("Escape");
  await page.waitForTimeout(600);
  await wake(page);
  await page.locator(".discover-button").click();
  await page.waitForTimeout(6000);
  await shot(page, `${appearance}-surface-discover`);
  await page.keyboard.press("Escape");
  await page.waitForTimeout(600);
  await openFromGallery("Stats for Nerds");
  await page.waitForTimeout(3000);
  await shot(page, `${appearance}-surface-stats`);
  await page.keyboard.press("Escape");
  await page.waitForTimeout(600);
  await openFromGallery("Atlas");
  await page.waitForTimeout(9000);
  await page.locator(".topbar-mark").click();
  await page.waitForTimeout(600);
  await shot(page, `${appearance}-surface-atlas`);
  // A map tap belongs to the map; the identity cell is the deliberate wake
  // (when chrome is already awake the same cell opens the report instead).
  const wakeMap = async () => {
    if (await page.locator(".app.controls-resting").count()) await page.locator(".topbar-mark").click();
    await page.waitForTimeout(600);
  };
  await wakeMap();
  await page.locator(".environment-control").click({ timeout: 8000 });
  await page.locator(".visual-gallery .score-entry").filter({ has: page.locator("strong", { hasText: /^Air Atlas$/ }) }).click();
  await page.waitForTimeout(7000);
  await wakeMap();
  await shot(page, `${appearance}-surface-air-atlas`);
  await context.close();
}

// Other supported display geometries: phone landscape and a narrow desktop window.
for (const [name, viewport, mobile] of process.env.QA_GEOMETRY === "0" ? [] : [["phone-landscape", { width: 844, height: 390 }, true], ["narrow", { width: 702, height: 546 }, false]]) {
  const { context, page } = await session({ appearance: "dark", viewport, speedKmh: 0, mobile });
  await startRunning(page, "play-road");
  if (mobile) await page.touchscreen.tap(viewport.width / 2, viewport.height / 2);
  else await page.mouse.click(viewport.width / 2, viewport.height / 2);
  await page.waitForTimeout(500);
  evidence.checks.push(`${name}: phone layout ${await page.locator(".app").getAttribute("data-phone-layout")}`);
  evidence.checks.push(`${name}: top bar ${await page.evaluate(() => [...document.querySelector(".topbar").children].map((el) => { const r = el.getBoundingClientRect(); return `${el.className.toString().split(" ")[0]}@${Math.round(r.x)}+${Math.round(r.width)}`; }).join(" "))}`);
  await shot(page, `dark-${name}-awake`);
  await page.locator(".mix-button").click();
  await shot(page, `dark-${name}-fx`);
  await context.close();
}

// A real local pairing (dev relay with SEDICIVALVOLE_MOTION_QA=1): display and phone.
for (const appearance of process.env.QA_PAIRED === "0" ? [] : ["dark", "light"]) {
  const display = await session({ appearance, speedKmh: 0 });
  await startRunning(display.page, "play-road");
  await wake(display.page);
  await display.page.locator(".motion-button").click();
  await display.page.locator(".remote-receiver-qr").waitFor({ timeout: 15000 });
  await shot(display.page, `${appearance}-receiver-qr`);
  let qrUrl = null;
  for (let attempt = 0; attempt < 10 && !qrUrl; attempt += 1) {
    await display.page.waitForTimeout(500);
    qrUrl = await display.page.evaluate(() => {
      for (const node of document.querySelectorAll(".remote-receiver, .remote-receiver-qr")) {
        const key = Object.keys(node).find((name) => name.startsWith("__reactFiber$"));
        for (let fiber = key ? node[key] : null; fiber; fiber = fiber.return) if (fiber.memoizedProps?.snapshot?.qrUrl) return fiber.memoizedProps.snapshot.qrUrl;
      }
      return null;
    });
  }
  if (!qrUrl) {
    const debug = await display.page.evaluate(() => ({ status: document.querySelector(".remote-receiver-status")?.textContent, hasQr: Boolean(document.querySelector(".remote-receiver-qr")) }));
    console.error("pairing debug", JSON.stringify(debug));
  }
  assert.ok(qrUrl, "pairing URL");
  const phone = await session({ appearance, viewport: { width: 390, height: 844 }, url: qrUrl });
  await phone.page.locator(".remote-now").waitFor({ timeout: 20000 });
  await phone.page.waitForTimeout(1200);
  await shot(phone.page, `${appearance}-phone-visual`);
  for (const tab of ["Music", "FX", "Palette"]) {
    await phone.page.locator(".remote-tabbar button", { hasText: tab }).click();
    await shot(phone.page, `${appearance}-phone-${tab.toLowerCase()}`);
  }
  await phone.page.locator(".remote-tabbar button", { hasText: "FX" }).click();
  await phone.page.locator(".remote-pad").nth(1).click();
  await display.page.waitForTimeout(1500);
  const reverb = await display.page.evaluate(() => document.querySelector(".mix-button")?.textContent);
  evidence.checks.push(`${appearance}: phone pad reached the display MIX key (${reverb?.trim()})`);
  await shot(phone.page, `${appearance}-phone-fx-active`);
  // Soundtrack from the passenger seat: source, genre and the live track list.
  await phone.page.locator(".remote-tabbar button", { hasText: "Music" }).click();
  await phone.page.locator(".remote-switch button", { hasText: "Soundtrack" }).click();
  await phone.page.waitForTimeout(3000);
  await phone.page.locator(".remote-chip-grid button", { hasText: "Jazz" }).click();
  await phone.page.locator(".remote-track-list button").first().waitFor({ timeout: 15000 });
  await phone.page.waitForTimeout(1200);
  evidence.checks.push(`${appearance}: phone lists ${await phone.page.locator(".remote-track-list button").count()} Soundtrack tracks after choosing Jazz`);
  await shot(phone.page, `${appearance}-phone-soundtrack`);
  await phone.page.locator(".remote-track-list button").nth(2).click();
  await phone.page.waitForTimeout(2500);
  evidence.checks.push(`${appearance}: display title after tapping the third track: "${await display.page.title()}"`);
  // XY filter: hold on the left, the display's High Cut engages; release opens.
  await phone.page.locator(".remote-tabbar button", { hasText: "FX" }).click();
  await phone.page.locator(".remote-switch button", { hasText: "XY filter" }).click();
  const xy = await phone.page.locator(".remote-xy").boundingBox();
  await phone.page.mouse.move(xy.x + xy.width * 0.12, xy.y + xy.height * 0.3);
  await phone.page.mouse.down();
  await phone.page.mouse.move(xy.x + xy.width * 0.1, xy.y + xy.height * 0.25, { steps: 4 });
  await display.page.waitForTimeout(1800);
  await shot(phone.page, `${appearance}-phone-xy`);
  evidence.checks.push(`${appearance}: holding XY left -> display MIX "${(await display.page.locator(".mix-button").textContent())?.trim()}"`);
  await phone.page.mouse.up();
  await display.page.waitForTimeout(1800);
  evidence.checks.push(`${appearance}: released XY -> display MIX "${(await display.page.locator(".mix-button").textContent())?.trim()}"`);
  await phone.page.locator(".remote-switch button", { hasText: "Engine" }).first().click();
  await phone.page.waitForTimeout(2500);
  await shot(phone.page, `${appearance}-phone-engine`);
  await shot(display.page, `${appearance}-receiver-connected`);
  await phone.context.close();
  await display.context.close();
}

await browser.close();
await fs.writeFile(`${out}/evidence.json`, JSON.stringify(evidence, null, 2));
console.log(JSON.stringify({ shots: evidence.shots.length, checks: evidence.checks, errors: evidence.errors, warnings: evidence.warnings.slice(0, 8), sends: evidence.sends }, null, 2));
