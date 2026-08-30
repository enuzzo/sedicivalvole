import assert from "node:assert/strict";
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
