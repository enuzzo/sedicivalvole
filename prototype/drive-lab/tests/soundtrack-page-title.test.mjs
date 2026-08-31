import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_PAGE_TITLE,
  soundtrackPageTitle,
} from "../src/soundtrack/page-title.js";

test("Soundtrack playback exposes artist and track in the browser title", () => {
  assert.equal(soundtrackPageTitle({
    status: "playing",
    current: { artistName: "Lobo", title: "Night Drive" },
  }), "16 - Lobo - Night Drive");
});

test("the browser title falls back outside complete active playback", () => {
  assert.equal(soundtrackPageTitle(null), DEFAULT_PAGE_TITLE);
  assert.equal(soundtrackPageTitle({ status: "paused", current: { artistName: "Lobo", title: "Night Drive" } }), DEFAULT_PAGE_TITLE);
  assert.equal(soundtrackPageTitle({ status: "playing", current: { artistName: "", title: "Night Drive" } }), DEFAULT_PAGE_TITLE);
});

test("browser-title metadata is normalized and bounded", () => {
  const longArtist = `  ${"A".repeat(120)}\n`;
  assert.equal(soundtrackPageTitle({
    status: "playing",
    current: { artistName: longArtist, title: "  Two   Words  " },
  }), `16 - ${"A".repeat(96)} - Two Words`);
});
