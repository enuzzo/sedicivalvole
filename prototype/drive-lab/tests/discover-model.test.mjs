import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  DISCOVER_RESULT_LIMIT,
  discoverDistanceMetres,
  discoverGoogleMapsUrl,
  discoverPreferredLanguage,
  discoverViewPages,
  discoverWikipediaContinuationUrl,
  discoverWikipediaUrl,
  filterDiscoverPages,
  formatDiscoverDistance,
  normalizeDiscoverPages,
  quantizeDiscoverPosition,
} from "../src/discover/discover-model.js";

const appSource = readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");
const styles = readFileSync(new URL("../src/styles.css", import.meta.url), "utf8");

test("Discover follows the first supported browser language and keeps a safe fallback", () => {
  assert.equal(discoverPreferredLanguage(["ca-ES", "it-IT", "en-US"]), "it");
  assert.equal(discoverPreferredLanguage(["de-DE"]), "de");
  assert.equal(discoverPreferredLanguage(["ca-ES"]), "en");
});

test("Discover sends only a quantized session position to the localized Wikipedia API", () => {
  assert.deepEqual(quantizeDiscoverPosition({ latitude: 45.4642, longitude: 9.1901 }), { latitude: 45.45, longitude: 9.2 });
  const url = new URL(discoverWikipediaUrl(
    { latitude: 45.4642, longitude: 9.1901 },
    { language: "it-IT", view: "region", requestLimit: 99 },
  ));
  assert.equal(url.hostname, "it.wikipedia.org");
  assert.equal(url.searchParams.get("generator"), "geosearch");
  assert.equal(url.searchParams.get("ggscoord"), "45.45|9.2");
  assert.equal(url.searchParams.get("ggsradius"), "10000");
  assert.equal(url.searchParams.get("ggslimit"), "50");
  assert.equal(url.searchParams.get("pilicense"), "free");
});

test("Discover carries MediaWiki continuation tokens without accepting unsafe keys", () => {
  const continued = new URL(discoverWikipediaContinuationUrl(
    "https://en.wikipedia.org/w/api.php?action=query&ggslimit=35",
    { continue: "||", ggsoffset: 10, "bad-key!": "ignored", nested: { no: true } },
  ));
  assert.equal(continued.searchParams.get("continue"), "||");
  assert.equal(continued.searchParams.get("ggsoffset"), "10");
  assert.equal(continued.searchParams.has("bad-key!"), false);
  assert.equal(continued.searchParams.has("nested"), false);
});

test("Discover normalizes at most fifteen places with distance and a bounded local ETA", () => {
  const pages = Array.from({ length: 18 }, (_, index) => ({
    pageid: index + 1,
    title: `Place ${index + 1}`,
    extract: "  A useful   introduction. ",
    fullurl: `https://en.wikipedia.org/wiki/Place_${index + 1}`,
    coordinates: [{ lat: 45.46 + index * 0.001, lon: 9.19 }],
    thumbnail: { source: "//upload.wikimedia.org/example.jpg", width: 720, height: 480 },
  }));
  const normalized = normalizeDiscoverPages({ query: { pages } }, { latitude: 45.46, longitude: 9.19 });
  assert.equal(normalized.length, DISCOVER_RESULT_LIMIT);
  assert.equal(normalized[0].summary, "A useful introduction.");
  assert.match(normalized[0].thumbnail, /^https:\/\//);
  assert.ok(normalized[1].distanceMetres > normalized[0].distanceMetres);
  assert.ok(normalized[1].estimatedMinutes >= 1);
  assert.equal(formatDiscoverDistance(950), "950 m");
  assert.equal(formatDiscoverDistance(1250), "1.3 km");
  assert.ok(discoverDistanceMetres({ latitude: 45.46, longitude: 9.19 }, { latitude: 45.47, longitude: 9.19 }) > 1000);
});

test("Ahead prioritizes the driver's bearing and search covers title plus summary", () => {
  const pages = [
    { id: "north", title: "North Museum", summary: "Art", bearing: 2, distanceMetres: 900 },
    { id: "east", title: "East Gate", summary: "Architecture", bearing: 88, distanceMetres: 100 },
    { id: "north-east", title: "Garden", summary: "Botanical museum", bearing: 30, distanceMetres: 1200 },
  ];
  assert.equal(discoverViewPages(pages, { view: "ahead", heading: 0 })[0].id, "north");
  assert.deepEqual(filterDiscoverPages(pages, "museum").map(({ id }) => id), ["north", "north-east"]);
});

test("Discover creates an official Maps directions handoff without fixing the origin", () => {
  const url = new URL(discoverGoogleMapsUrl({ latitude: 45.4642, longitude: 9.19 }));
  assert.equal(url.origin, "https://www.google.com");
  assert.equal(url.pathname, "/maps/dir/");
  assert.equal(url.searchParams.get("api"), "1");
  assert.equal(url.searchParams.get("destination"), "45.4642,9.19");
  assert.equal(url.searchParams.get("travelmode"), "driving");
  assert.equal(url.searchParams.has("origin"), false);
});

test("Discover renders the selected split index, language/search controls and reciprocal Atlas action", () => {
  assert.match(appSource, /function DiscoverPanel/);
  assert.match(appSource, /navigator\.languages \?\? \[navigator\.language\]/);
  assert.match(appSource, /type="search" placeholder="Search places"/);
  assert.match(appSource, /\+\{hiddenCount\} MORE/);
  assert.match(appSource, /OPEN IN GOOGLE MAPS/);
  assert.match(appSource, /onOpenAtlas/);
  assert.match(styles, /\.discover-workspace \{ display: grid; grid-template-columns: 246px minmax\(0, 1fr\)/);
  assert.match(styles, /\.discover-reader \{ display: grid/);
});
