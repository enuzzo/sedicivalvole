import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const TEST_DIR = dirname(fileURLToPath(import.meta.url));
const DRIVE_LAB_ROOT = resolve(TEST_DIR, "..");
const REPOSITORY_ROOT = resolve(DRIVE_LAB_ROOT, "../..");

test("the selected 16 Road mark is vector-first and fills a 512 square", () => {
  const svg = readFileSync(resolve(REPOSITORY_ROOT, "logo/sedicivalvole-mark-dark.svg"), "utf8");
  const transparentSvg = readFileSync(
    resolve(REPOSITORY_ROOT, "logo/sedicivalvole-mark-transparent.svg"),
    "utf8",
  );
  const transparentPng = readFileSync(
    resolve(REPOSITORY_ROOT, "logo/sedicivalvole-mark-transparent-512.png"),
  );

  assert.match(svg, /width="512" height="512" viewBox="0 0 512 512"/);
  assert.doesNotMatch(svg, /<text\b/);
  assert.match(svg, /M136 18V92/);
  assert.match(svg, /M208 18V92/);
  assert.match(svg, /translate\(512 0\) scale\(-1 1\)/);
  assert.match(svg, /translate\(150\.04 318\) scale\(\.175 -\.175\)/);
  assert.doesNotMatch(transparentSvg, /<rect\b|<filter\b/);
  assert.equal(transparentPng[25], 6, "transparent PNG must use RGBA colour type");
});

test("browser icon metadata points only to packaged selected-mark assets", () => {
  const html = readFileSync(resolve(DRIVE_LAB_ROOT, "index.html"), "utf8");
  const expected = [
    ["brand/sedicivalvole-mark.svg", 1000],
    ["brand/favicon-32.png", 500],
    ["brand/favicon.ico", 500],
    ["brand/apple-touch-icon.png", 5000],
    ["brand/product-icon-192.png", 5000],
    ["brand/product-icon-512.png", 15000],
  ];

  for (const [relativePath, minimumBytes] of expected) {
    assert.ok(statSync(resolve(DRIVE_LAB_ROOT, `public/${relativePath}`)).size > minimumBytes);
  }
  assert.match(html, /href="\/brand\/sedicivalvole-mark\.svg" type="image\/svg\+xml"/);
  assert.match(html, /href="\/brand\/favicon-32\.png" type="image\/png" sizes="32x32"/);
  assert.match(html, /href="\/brand\/apple-touch-icon\.png" sizes="180x180"/);
});

test("both owner-supplied Illobo marks remain byte-identical in a slow continuous dark-field crossfade", () => {
  const app = readFileSync(resolve(DRIVE_LAB_ROOT, "src/App.jsx"), "utf8");
  const styles = readFileSync(resolve(DRIVE_LAB_ROOT, "src/styles.css"), "utf8");
  const expected = [
    ["illobo-featured-solid.svg", "9973b53c96144d2971188d9ab71207163337e856ead11ff040008e40783626a0"],
    ["illobo-featured-outline.svg", "5e56d9476aff3f9f079650b2c409b1e4f9080313b27ed3f1ea14993f16bd4e3e"],
  ];

  for (const [filename, digest] of expected) {
    const bytes = readFileSync(resolve(DRIVE_LAB_ROOT, `public/brand/${filename}`));
    assert.equal(createHash("sha256").update(bytes).digest("hex"), digest);
    assert.match(app, new RegExp(`/brand/${filename.replace(".", "\\.")}\\?build=`));
  }

  assert.match(app, /className="illobo-featured-cover" role="img" aria-label="Illobo Featured"/);
  assert.match(styles, /\.illobo-featured-cover[\s\S]*?overflow: visible;[\s\S]*?border: 0;[\s\S]*?border-radius: 0;[\s\S]*?background: color-mix\(in srgb, var\(--paper\) 40%, var\(--ink\)\)/);
  assert.match(styles, /illobo-featured-solid 8s linear infinite/);
  assert.match(styles, /illobo-featured-outline 8s linear infinite/);
  assert.doesNotMatch(styles, /\.illobo-featured-cover img:last-child\s*{[^}]*filter:/);
  assert.match(styles, /@keyframes illobo-featured-solid\s*{\s*0%\s*{ opacity: 1; }\s*50%\s*{ opacity: 0; }\s*100%\s*{ opacity: 1; }\s*}/);
  assert.match(styles, /@keyframes illobo-featured-outline\s*{\s*0%\s*{ opacity: 0; }\s*50%\s*{ opacity: 1; }\s*100%\s*{ opacity: 0; }\s*}/);
});

test("the music drawer packages one coherent square cover for every playable score and Illobo track", () => {
  const artworkRoot = resolve(DRIVE_LAB_ROOT, "public/artwork");
  const playRoadNames = readdirSync(resolve(artworkRoot, "play-road")).sort();
  const illoboNames = readdirSync(resolve(artworkRoot, "illobo")).sort();
  const illoboMasterRoot = resolve(DRIVE_LAB_ROOT, "artwork-masters/illobo");
  const illoboMasters = readdirSync(illoboMasterRoot).sort();
  const illoboDerivatives = illoboNames.filter((name) => name.endsWith(".webp"));
  assert.deepEqual(playRoadNames, ["fracture.png", "junction.png", "nightshift.png"]);
  assert.equal(illoboMasters.length, 29);
  assert.equal(illoboDerivatives.length, 29);
  assert.deepEqual(illoboDerivatives.map((name) => name.replace(/\.webp$/, ".png")), illoboMasters);
  assert.ok(illoboMasters.every((name) => /^[a-z0-9]+(?:-[a-z0-9]+)*\.png$/.test(name)));

  for (const relativePath of [
    ...playRoadNames.map((name) => `play-road/${name}`),
    ...illoboMasters.map((name) => `../../artwork-masters/illobo/${name}`),
  ]) {
    const bytes = readFileSync(resolve(artworkRoot, relativePath));
    assert.equal(bytes.subarray(1, 4).toString(), "PNG");
    assert.equal(bytes.readUInt32BE(16), 512, `${relativePath} width`);
    assert.equal(bytes.readUInt32BE(20), 512, `${relativePath} height`);
  }

  for (const name of illoboDerivatives) {
    const webp = readFileSync(resolve(artworkRoot, "illobo", name));
    const png = readFileSync(resolve(illoboMasterRoot, name.replace(/\.webp$/, ".png")));
    assert.equal(webp.subarray(0, 4).toString(), "RIFF", `${name} RIFF header`);
    assert.equal(webp.subarray(8, 12).toString(), "WEBP", `${name} WebP header`);
    assert.ok(webp.length < png.length * 0.25, `${name} is materially smaller than its HD master`);
  }
});

test("music controls use the licensed Tabler media icon set", () => {
  const iconRoot = resolve(DRIVE_LAB_ROOT, "public/third-party/tabler-icons");
  for (const name of [
    "player-play-filled.svg",
    "player-pause-filled.svg",
    "player-skip-back-filled.svg",
    "player-skip-forward-filled.svg",
  ]) {
    const icon = readFileSync(resolve(iconRoot, name), "utf8");
    assert.match(icon, /viewBox="0 0 24 24"/);
    assert.doesNotMatch(icon, /<text\b/);
  }
});

test("appearance controls package the pinned byte-identical Tabler icons", () => {
  const iconRoot = resolve(DRIVE_LAB_ROOT, "public/third-party/tabler-icons");
  const notices = readFileSync(resolve(REPOSITORY_ROOT, "THIRD_PARTY_NOTICES.md"), "utf8");
  const expected = [
    ["sun.svg", "1.0", "6d4dc625a54dea6c696e8320c35fcf7e235dc039f512ef2c30af9b0663a7ab3f"],
    ["moon.svg", "1.0", "921d27bb214f2ec714ff4deeffa8a5efc4bb989e367df47f9f58351d2effee00"],
    ["sun-moon.svg", "1.96", "20eefd8c98102c0d0731a44ab7a45593dab2e9b76b37b879094d47a2cbb40ef1"],
  ];

  for (const [name, metadataVersion, digest] of expected) {
    const icon = readFileSync(resolve(iconRoot, name));
    assert.equal(createHash("sha256").update(icon).digest("hex"), digest);
    assert.match(icon.toString("utf8"), new RegExp(`version: "${metadataVersion.replace(".", "\\.")}"`));
  }

  assert.match(notices, /tabler-icons\/tree\/v3\.46\.0\/icons/);
  assert.match(notices, /media, appearance, search/);
});
