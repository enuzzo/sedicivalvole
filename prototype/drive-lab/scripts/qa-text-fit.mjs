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
// Measure settled chrome geometry, as in the visual regression gate. The
// animated canvas/iframe backdrop is irrelevant to typography and can exhaust
// the six-second controls window on software-rendered headless hosts.
const SETTLED_CSS = `
  *, *::before, *::after { animation: none !important; transition: none !important; }
  canvas, iframe, video { visibility: hidden !important; }
`;
const probe = async (page, label) => {
  const clipped = await page.evaluate(() => {
    const app = document.querySelector(".app");
    const footer = document.querySelector(".footer-stack");
    if (!app?.matches(".controls-awake:not(.modal-open)") || footer?.inert
      || !footer || footer.getBoundingClientRect().top >= innerHeight) {
      throw new Error("Text fit requires visible, usable running chrome");
    }
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
try {
  for (const appearance of ["dark", "light"]) {
    const context = await browser.newContext({ viewport: { width: 773, height: 601 }, colorScheme: appearance, reducedMotion: "reduce" });
    const page = await context.newPage();
    page.setDefaultTimeout(60000);
    await page.route("**/api/send-diagnostic.php", (route) => route.abort());
    await page.addInitScript((appearance) => {
      if (!sessionStorage.getItem("t")) { localStorage.clear(); localStorage.setItem("sedicivalvole.appearance.v1", appearance); sessionStorage.setItem("t", "1"); }
      // Typography QA uses a stable launch choice, like the visual baseline.
      Math.random = () => 0.05;
      const fix = () => ({ timestamp: Date.now(), coords: { speed: 127 / 3.6, heading: 90, accuracy: 5, latitude: 45.4642, longitude: 9.19 } });
      Object.defineProperty(navigator, "geolocation", { value: { watchPosition(cb) { cb(fix()); return setInterval(() => cb(fix()), 1000); }, clearWatch(id) { clearInterval(id); }, getCurrentPosition(cb) { cb(fix()); } } });
    }, appearance);
    await page.goto(base);
    await page.addStyleTag({ content: SETTLED_CSS });
    await page.getByRole("button", { name: /^START/ }).waitFor();
    await page.locator(".cockpit-sources button", { hasText: "Play the Road" }).click();
    await page.locator(".cockpit-start").click();
    await page.locator(".app.phase-running").waitFor({ timeout: 20000 });
    await page.waitForTimeout(2500);
    // The real keyboard wake also works on maps, which consume central taps.
    // Avoid spending the six-second wake window on extra browser round trips.
    const wake = () => page.keyboard.press("Tab");
    await wake(); await probe(page, `${appearance} running`);
    // Keyboard activation invokes the same button handler without waiting for
    // two compositor frames of pointer stability on a software GPU.
    const activate = async (button) => {
      await button.waitFor({ state: "visible" });
      await button.press("Enter");
    };
    const press = async (selector, pressed) => {
      await wake();
      await activate(page.locator(selector));
      await page.waitForFunction(({ selector, pressed }) =>
        document.querySelector(selector)?.getAttribute("aria-pressed") === String(pressed),
      { selector, pressed });
      // A completed action queues chrome retraction on the next display frame.
      // Observe it before waking again; a fixed delay can race that frame.
      await page.locator(".app.controls-resting").waitFor();
      await wake();
    };
    await press(".stop-button", true); await probe(page, `${appearance} muted`);
    await press(".stop-button", false);
    await press(".effects-button", false); await probe(page, `${appearance} brake off`);
    await press(".effects-button", true);
    for (const name of ["Stats for Nerds", "Air Atlas", "Gradient"]) {
      await wake();
      await activate(page.locator(".environment-control"));
      const entry = page.locator(".visual-gallery .score-entry").filter({ has: page.locator("strong", { hasText: new RegExp(`^${name}$`) }) });
      await activate(entry); await page.waitForTimeout(1500);
      await page.keyboard.press("Escape").catch(() => {});
      await page.locator(".app.controls-resting").waitFor();
      await wake(); await probe(page, `${appearance} ${name === "Stats for Nerds" ? "return from" : "visual"} ${name}`);
    }
    await wake();
    await activate(page.locator(".mode-selector button", { hasText: /engine/i }));
    await page.locator(".engine-telemetry").waitFor();
    await page.locator(".app.controls-resting").waitFor();
    await page.waitForTimeout(2500); await wake(); await probe(page, `${appearance} engine`);
    await context.close();
  }
} finally {
  await browser.close();
}
const failures = report.filter((entry) => entry.clipped.length);
for (const { state, clipped } of failures) console.error(`${state}: ${clipped.join("; ")}`);
if (failures.length) process.exit(1);
console.log(`Text fit passed: ${report.length} states, no clipped chrome text.`);
