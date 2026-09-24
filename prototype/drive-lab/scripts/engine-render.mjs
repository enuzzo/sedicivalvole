// Renders the real Engine runtime along a scripted Tesla-like GPS route (whole
// km/h at 10 Hz) and writes one WAV and one RPM/gear/load trace per variant.
// Dev only: the page scripts/engine-harness.html is served by the Vite dev server.
//   OUT=output/engine-render VARIANTS=mono:0,mono:1 node scripts/engine-render.mjs
// Variant suffix 0 = neutral voicing (Refined), 1 = profile voicing (Full body).
import fs from "node:fs/promises";
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
const out = process.env.OUT || "output/engine-render";
await fs.mkdir(out, { recursive: true });
const route = JSON.parse(process.env.ROUTE || "[[0,0],[3,0],[4,2],[13,95],[18,100],[19,100],[26,30],[29,30]]");
const variants = (process.env.VARIANTS || "mono:0,mono:1,rosso:0,rosso:1,touring:0,touring:1").split(",");
const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_EXECUTABLE || undefined, args: ["--autoplay-policy=no-user-gesture-required"] });
const page = await (await browser.newContext()).newPage();
page.on("pageerror", (e) => console.error("pageerror", e.message));
await page.goto((process.env.QA_URL || "http://localhost:5183/") + "scripts/engine-harness.html");
await page.waitForFunction(() => window.harnessReady === true);
for (const variant of variants) {
  const [profileId, voiced] = variant.split(":");
  const result = await page.evaluate((args) => window.renderEngine(args), { profileId, voiced: voiced === "1", route });
  const pcm = Buffer.from(result.pcm, "base64");
  const header = Buffer.alloc(44);
  header.write("RIFF", 0); header.writeUInt32LE(36 + pcm.length, 4); header.write("WAVEfmt ", 8); header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); header.writeUInt16LE(2, 22); header.writeUInt32LE(48000, 24); header.writeUInt32LE(48000 * 4, 28);
  header.writeUInt16LE(4, 32); header.writeUInt16LE(16, 34); header.write("data", 36); header.writeUInt32LE(pcm.length, 40);
  const name = `${profileId}-${voiced === "1" ? "B-fullbody" : "A-refined"}`;
  await fs.writeFile(`${out}/${name}.wav`, Buffer.concat([header, pcm]));
  await fs.writeFile(`${out}/${name}.trace.json`, JSON.stringify(result.trace));
  console.log(name, (result.frames / 48000).toFixed(1) + "s");
}
await browser.close();
