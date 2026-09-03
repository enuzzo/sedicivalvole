import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const stylesheetUrls = {
  product: new URL("../src/styles.css", import.meta.url),
  lab: new URL("../src/lab/styles.css", import.meta.url),
  shadergradient: new URL("../src/shadergradient-lab/workbench.css", import.meta.url),
};

const stylesheets = Object.fromEntries(
  Object.entries(stylesheetUrls).map(([name, url]) => [name, readFileSync(url, "utf8")]),
);

const semanticTypeTokens = {
  "--type-meta": 14,
  "--type-label": 15,
  "--type-body": 16,
  "--type-action": 16,
  "--type-active": 18,
  "--type-title": 24,
  "--type-value": 34,
};

const touchTokens = {
  "--touch-target": 48,
  "--touch-primary": 56,
};

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function cssVariablePixels(source, name) {
  const match = source.match(new RegExp(`${escapeRegExp(name)}\\s*:\\s*([0-9]+)px\\s*;`));
  assert.ok(match, `${name} must be declared as a pixel token`);
  return Number(match[1]);
}

function selectorDeclarations(source, targetSelector) {
  const uncommented = source.replace(/\/\*[\s\S]*?\*\//g, "");
  const normalizedTarget = targetSelector.replace(/\s+/g, " ").trim();
  const declarations = [];

  for (const match of uncommented.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const selectors = match[1]
      .split(",")
      .map((selector) => selector.replace(/\s+/g, " ").trim());
    if (selectors.includes(normalizedTarget)) declarations.push(match[2]);
  }

  assert.ok(declarations.length > 0, `${targetSelector} must have a CSS rule`);
  return declarations;
}

function assertPropertyUsesToken(source, selector, property, token) {
  const propertyPattern = new RegExp(`${escapeRegExp(property)}\\s*:\\s*[^;}]*(?:var\\(${escapeRegExp(token)}\\))`);
  const declarations = selectorDeclarations(source, selector);
  assert.ok(
    declarations.some((body) => propertyPattern.test(body)),
    `${selector} must map ${property} to ${token}`,
  );
}

function assertTypographyUsesToken(source, selector, token) {
  const tokenPattern = new RegExp(`(?:font-size|font)\\s*:\\s*[^;}]*(?:var\\(${escapeRegExp(token)}\\))`);
  const declarations = selectorDeclarations(source, selector);
  assert.ok(
    declarations.some((body) => tokenPattern.test(body)),
    `${selector} must map its typography to ${token}`,
  );
}

function assertGeometryUsesToken(source, selector, properties, token) {
  const declarations = selectorDeclarations(source, selector);
  const patterns = properties.map((property) => (
    new RegExp(`${escapeRegExp(property)}\\s*:\\s*[^;}]*(?:var\\(${escapeRegExp(token)}\\))`)
  ));
  assert.ok(
    declarations.some((body) => patterns.some((pattern) => pattern.test(body))),
    `${selector} must size ${properties.join("/")} with ${token}`,
  );
}

function assertGeometryAtLeast(source, selector, property, minimumPixels, minimumToken) {
  const propertyPattern = new RegExp(`${escapeRegExp(property)}\\s*:\\s*([^;}]*)`);
  const values = selectorDeclarations(source, selector)
    .map((body) => body.match(propertyPattern))
    .filter(Boolean)
    .map((match) => match[1].trim());
  assert.ok(
    values.some((value) => (
      value.includes(`var(${minimumToken})`)
      || Number(value.match(/^([0-9]+)px$/)?.[1]) >= minimumPixels
    )),
    `${selector} must keep ${property} at or above ${minimumPixels}px`,
  );
}

function assertSemanticTokens(source, stylesheetName) {
  for (const [token, pixels] of Object.entries({ ...semanticTypeTokens, ...touchTokens })) {
    assert.equal(
      cssVariablePixels(source, token),
      pixels,
      `${stylesheetName} must keep ${token} at ${pixels}px`,
    );
  }

  assert.doesNotMatch(
    source,
    /--font-size-floor\s*:\s*20px\s*;/,
    `${stylesheetName} must not restore the retired blanket 20px floor`,
  );
}

test("Swiss Compact defines a semantic type scale independently from touch geometry", () => {
  for (const [name, source] of Object.entries(stylesheets)) {
    assertSemanticTokens(source, name);
  }

  assert.equal(cssVariablePixels(stylesheets.product, "--chrome-size"), 72);
  assert.ok(semanticTypeTokens["--type-meta"] < semanticTypeTokens["--type-label"]);
  assert.equal(semanticTypeTokens["--type-body"], semanticTypeTokens["--type-action"]);
  assert.ok(semanticTypeTokens["--type-action"] < semanticTypeTokens["--type-active"]);
  assert.ok(semanticTypeTokens["--type-active"] < semanticTypeTokens["--type-title"]);
  assert.ok(semanticTypeTokens["--type-title"] < semanticTypeTokens["--type-value"]);
  assert.ok(semanticTypeTokens["--type-value"] < touchTokens["--touch-target"]);
  assert.ok(touchTokens["--touch-target"] < touchTokens["--touch-primary"]);
  assert.ok(touchTokens["--touch-primary"] < cssVariablePixels(stylesheets.product, "--chrome-size"));
});

test("the driving surface assigns product roles instead of applying one universal size", () => {
  const source = stylesheets.product;
  const roleContracts = [
    [".source-readout strong", "--type-value"],
    [".source-readout span", "--type-meta"],
    [".mode-selector button", "--type-label"],
    [".discover-button span", "--type-label"],
    [".report-button span", "--type-label"],
    [".now-playing-copy small", "--type-meta"],
    [".now-playing-copy strong", "--type-active"],
    [".now-playing-copy em", "--type-meta"],
    [".drawer-heading h2", "--type-title"],
    [".music-library-heading h2", "--type-title"],
  ];

  for (const [selector, token] of roleContracts) {
    assertTypographyUsesToken(source, selector, token);
  }

  for (const token of ["--type-label", "--type-body"]) {
    assert.match(
      source,
      new RegExp(`(?:font-size|font)\\s*:\\s*[^;}]*(?:var\\(${escapeRegExp(token)}\\))`),
      `${token} must be used by a visible product role`,
    );
  }
});

test("the driving surface keeps chrome and touch targets larger than its type", () => {
  const source = stylesheets.product;

  assertPropertyUsesToken(source, ".topbar", "min-height", "--chrome-size");
  assertPropertyUsesToken(source, ".control-slab", "min-height", "--chrome-size");
  assertGeometryUsesToken(
    source,
    ".persistent-transport.now-playing-dock",
    ["height", "min-height", "grid-auto-rows"],
    "--chrome-size",
  );
  assertPropertyUsesToken(source, ".now-playing-transport button", "min-height", "--touch-target");
  assertGeometryUsesToken(
    source,
    ".now-playing-transport button:nth-child(2)",
    ["width", "min-width", "height", "min-height"],
    "--touch-primary",
  );
  assertGeometryAtLeast(
    source,
    ".launch-start-button",
    "min-height",
    touchTokens["--touch-primary"],
    "--touch-primary",
  );

  assert.match(source, /\.mode-selector button \{[\s\S]*?flex: 1 1 0;[\s\S]*?min-width: 0;/);
  assert.match(source, /\.discover-results > button \{ min-height: 64px; padding: 5px 8px; \}/);
  assert.match(source, /\.discover-drawer \.drawer-panel \{[\s\S]*?display: grid;[\s\S]*?grid-template-rows: auto minmax\(0, 1fr\);/);
  assert.match(source, /\.discover-workspace \{ height: auto; min-height: 0; \}/);
  assert.match(source, /\.soundtrack-drawer \.drawer-panel \{ overflow-y: hidden; \}/);
  assert.match(source, /\.app\.controls-awake\.has-now-playing \.atlas-demo-hint \{ bottom: calc\(var\(--chrome-size\) \+ 116px\); \}/);
  assert.match(source, /\.app\.controls-awake\.has-now-playing \.atlas-field \.maplibregl-ctrl-bottom-left \{ bottom: calc\(var\(--chrome-size\) \+ 76px\); \}/);
});

test("Owner LAB uses the same compact hierarchy and independent touch targets", () => {
  const source = stylesheets.lab;
  const roleContracts = [
    [".lab-build", "--type-meta"],
    [".lab-select select", "--type-action"],
    [".lab-action", "--type-action"],
    [".lab-wordmark", "--type-title"],
    [".lab-signal strong", "--type-value"],
    [".lab-signal span", "--type-label"],
  ];

  for (const [selector, token] of roleContracts) {
    assertTypographyUsesToken(source, selector, token);
  }

  assertGeometryUsesToken(source, ".lab-action", ["height", "min-height"], "--touch-target");
  assertGeometryUsesToken(source, ".lab-action.is-primary", ["height", "min-height"], "--touch-primary");
});

test("ShaderGradient workbench preserves editorial display type above compact controls", () => {
  const source = stylesheets.shadergradient;
  const roleContracts = [
    [".sg-kicker", "--type-label"],
    [".sg-readout > span", "--type-label"],
    [".sg-readout strong", "--type-value"],
    [".sg-stage-note", "--type-body"],
    [".sg-inspector h2", "--type-title"],
    [".sg-button", "--type-action"],
  ];

  for (const [selector, token] of roleContracts) {
    assertTypographyUsesToken(source, selector, token);
  }

  assertGeometryUsesToken(source, ".sg-button", ["height", "min-height"], "--touch-target");
  assertGeometryUsesToken(source, ".sg-button.is-primary", ["height", "min-height"], "--touch-primary");

  const displayRule = selectorDeclarations(source, ".sg-readout strong");
  const displaySize = displayRule
    .map((body) => body.match(/font-size\s*:\s*clamp\(var\(--type-value\),[^,]+,\s*([0-9]+)px\)/))
    .find(Boolean);
  assert.ok(displaySize, "ShaderGradient speed readout must retain its semantic editorial clamp");
  assert.ok(
    Number(displaySize[1]) > semanticTypeTokens["--type-value"],
    "ShaderGradient display type must remain intentionally larger than data-value type",
  );
});
