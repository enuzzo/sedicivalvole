// Text-fit check for the running chrome at the Tesla split viewport (773 x 601).
// Drives the real App through running, muted, brake-off, three visual families
// and Engine, in DARK and LIGHT, and fails when any visible top bar, footer,
// Now Playing or Engine rail text is clipped (ellipsis or hidden overflow).
//
//   npm run qa:text-fit    (QA_URL defaults to the dev server on :5183)
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
const base = process.env.QA_URL || "http://localhost:5183/";
const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_EXECUTABLE || undefined, args: ["--mute-audio"] });
const report = [];
const probe = async (page, label) => {
  const clipped = await page.evaluate(() => {
    const out = [];
    for (const el of document.querySelectorAll(".topbar *, .footer-stack *, .control-slab *, .now-playing-dock *, .engine-contextual-rail *")) {
      if (!el.childNodes.length || ![...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) continue;
      const cs = getComputedStyle(el);
      if (cs.visibility === "hidden" || cs.display === "none" || el.closest("[aria-hidden='true']")) continue;
      const r = el.getBoundingClientRect();
      if (!r.width || r.width < 2) continue;
      if (el.scrollWidth > el.clientWidth + 1 && cs.overflow !== "visible") out.push(`${el.className || el.tagName}: "${el.textContent.trim().slice(0, 40)}" ${el.clientWidth}/${el.scrollWidth}`);
    }
    return out;
  });
  report.push({ state: label, clipped });
};
for (const appearance of ["dark", "light"]) {
  const context = await browser.newContext({ viewport: { width: 773, height: 601 }, colorScheme: appearance });
  const page = await context.newPage();
  await page.route("**/api/send-diagnostic.php", (route) => route.abort());
  await page.addInitScript((appearance) => {
    if (!sessionStorage.getItem("t")) { localStorage.clear(); localStorage.setItem("sedicivalvole.appearance.v1", appearance); sessionStorage.setItem("t", "1"); }
    const fix = () => ({ timestamp: Date.now(), coords: { speed: 127 / 3.6, heading: 90, accuracy: 5, latitude: 45.4642, longitude: 9.19 } });
    Object.defineProperty(navigator, "geolocation", { value: { watchPosition(cb) { cb(fix()); return setInterval(() => cb(fix()), 1000); }, clearWatch(id) { clearInterval(id); }, getCurrentPosition(cb) { cb(fix()); } } });
  }, appearance);
  await page.goto(base);
  await page.getByRole("button", { name: /^START/ }).waitFor();
  await page.locator(".cockpit-sources button", { hasText: "Play the Road" }).click();
  await page.locator(".cockpit-start").click();
  await page.locator(".app.phase-running").waitFor({ timeout: 20000 });
  await page.waitForTimeout(2500);
  const wake = async () => { await page.mouse.click(386, 300); await page.waitForTimeout(400); };
  await wake(); await probe(page, `${appearance} running`);
  const press = async (selector) => { await wake(); await page.locator(selector).click(); await page.waitForTimeout(300); };
  await press(".stop-button"); await probe(page, `${appearance} muted`);
  await press(".stop-button");
  await press(".effects-button"); await probe(page, `${appearance} brake off`);
  await press(".effects-button");
  for (const name of ["Stats for Nerds", "Air Atlas", "Chromatic Silk"]) {
    await wake();
    await page.locator(".environment-control").click();
    const entry = page.locator(".visual-gallery .score-entry").filter({ has: page.locator("strong", { hasText: new RegExp(`^${name === "Chromatic Silk" ? "Gradient" : name}$`) }) });
    await entry.click(); await page.waitForTimeout(1500);
    await page.keyboard.press("Escape").catch(() => {});
    await wake(); await probe(page, `${appearance} visual ${name}`);
  }
  await wake();
  await page.locator(".mode-selector button", { hasText: /engine/i }).click().catch(() => {});
  await page.waitForTimeout(2500); await wake(); await probe(page, `${appearance} engine`);
  await context.close();
}
await browser.close();
const failures = report.filter((entry) => entry.clipped.length);
for (const { state, clipped } of failures) console.error(`${state}: ${clipped.join("; ")}`);
if (failures.length) process.exit(1);
console.log(`Text fit passed: ${report.length} states, no clipped chrome text.`);
