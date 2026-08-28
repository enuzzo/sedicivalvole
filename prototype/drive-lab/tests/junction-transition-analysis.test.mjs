import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const scriptUrl = new URL("../scripts/inspect-junction-audio-transitions.py", import.meta.url);

test("rendered transition analysis is audio-only and calibration cannot block", async () => {
  const source = await readFile(scriptUrl, "utf8");
  assert.match(source, /audio_only_transition_measurement/);
  assert.match(source, /sethares_roughness/);
  assert.match(source, /flag_only_calibration/);
  assert.match(source, /live_browser_delay_tail/);
  assert.doesNotMatch(source, /"action": "block"/);
  assert.doesNotMatch(source, /basic.pitch|pitch_set|proposal/i);
});
