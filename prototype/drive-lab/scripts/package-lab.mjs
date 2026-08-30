import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";

const buildDirectory = new URL("../dist/lab-build/", import.meta.url);
const outputDirectory = new URL("../dist/client/lab/", import.meta.url);
const template = await readFile(new URL("../server/lab-index.php", import.meta.url), "utf8");
const css = await readFile(new URL("lab.css", buildDirectory), "utf8");
const javascript = await readFile(new URL("lab.js", buildDirectory), "utf8");
const font = await readFile(new URL("../public/fonts/orbitron-latin-variable.woff2", import.meta.url));
if (/\bprocess\.env\b/.test(javascript)) {
  throw new Error("LAB browser bundle still contains an unresolved Node.js environment reference");
}
const safeCss = css
  .replace("__LAB_FONT_BASE64__", font.toString("base64"))
  .replaceAll("</style", "<\\/style");
const safeJavascript = javascript.replaceAll("</script", "<\\/script");
const page = template
  .replace("/*__LAB_CSS__*/", () => safeCss)
  .replace("/*__LAB_JS__*/", () => safeJavascript);

if (page.includes("/*__LAB_CSS__*/") || page.includes("/*__LAB_JS__*/") || page.includes("__LAB_FONT_BASE64__")) {
  throw new Error("LAB package still contains an unresolved placeholder");
}

await mkdir(outputDirectory, { recursive: true });
await writeFile(new URL("index.php", outputDirectory), page);
await writeFile(new URL("bootstrap.php", outputDirectory), await readFile(new URL("../server/lab-bootstrap.php", import.meta.url)));
await writeFile(new URL("send.php", outputDirectory), await readFile(new URL("../server/lab-send.php", import.meta.url)));

const runtimeAssets = Object.freeze(["bloom-processor.js", "score-processor.js"]);
for (const asset of runtimeAssets) {
  await copyFile(new URL(asset, buildDirectory), new URL(asset, outputDirectory));
}

console.log(`Packaged protected inline LAB with ${runtimeAssets.length} audio runtime assets`);
