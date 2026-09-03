import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const stylesheets = [
  "../src/styles.css",
  "../src/lab/styles.css",
  "../src/shadergradient-lab/workbench.css",
];

function numericCssSizes(source) {
  const declarations = [
    ...source.matchAll(/font-size\s*:\s*([^;}{]+)/g),
    ...source.matchAll(/font\s*:\s*([^;}{]+)/g),
  ];
  return declarations.flatMap((declaration) => (
    [...declaration[1].matchAll(/([0-9]*\.?[0-9]+)(px|rem|em)/g)].map((match) => ({
      declaration: declaration[0],
      pixels: match[2] === "px" ? Number(match[1]) : Number(match[1]) * 20,
    }))
  ));
}

test("every product stylesheet enforces the 20 px Automotive Glance floor", () => {
  for (const relativePath of stylesheets) {
    const source = readFileSync(new URL(relativePath, import.meta.url), "utf8");
    const undersized = numericCssSizes(source).filter(({ pixels }) => pixels > 0 && pixels < 20);
    assert.deepEqual(undersized, [], `${relativePath} contains visible type below 20 px`);
  }
  const productStyles = readFileSync(new URL("../src/styles.css", import.meta.url), "utf8");
  assert.match(productStyles, /--font-size-floor: 20px/);
  assert.match(productStyles, /Automotive Glance/);
});
