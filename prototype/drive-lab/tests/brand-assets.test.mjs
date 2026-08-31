import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync, statSync } from "node:fs";
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

test("both owner-supplied Illobo marks remain byte-identical and crossfade every three seconds", () => {
  const app = readFileSync(resolve(DRIVE_LAB_ROOT, "src/App.jsx"), "utf8");
  const styles = readFileSync(resolve(DRIVE_LAB_ROOT, "src/styles.css"), "utf8");
  const expected = [
    ["illobo-featured-solid.svg", "e2fec599ff690cc78d599c8941cfacb43f49d39054379e0ab9f5257b1c887ad4"],
    ["illobo-featured-outline.svg", "d713938e350118727752e7b190b3cad946452dd104f8fcab7d5716b231d3b7cd"],
  ];

  for (const [filename, digest] of expected) {
    const bytes = readFileSync(resolve(DRIVE_LAB_ROOT, `public/brand/${filename}`));
    assert.equal(createHash("sha256").update(bytes).digest("hex"), digest);
    assert.match(app, new RegExp(`/brand/${filename.replace(".", "\\.")}\\?build=`));
  }

  assert.match(app, /className="illobo-featured-cover" role="img" aria-label="Illobo Featured"/);
  assert.match(styles, /illobo-featured-solid 6s ease-in-out infinite/);
  assert.match(styles, /illobo-featured-outline 6s ease-in-out infinite/);
  assert.match(styles, /@keyframes illobo-featured-solid[\s\S]*?42%[\s\S]*?50%/);
  assert.match(styles, /@keyframes illobo-featured-outline[\s\S]*?42%[\s\S]*?50%/);
});
