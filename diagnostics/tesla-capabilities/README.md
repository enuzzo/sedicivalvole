# Tesla Capability Harness

A neutral technical tool for measuring the real Tesla browser before final UI, audio-engine, and renderer decisions. It is not a product preview and introduces no independent visual direction.

## Local run

From the project root:

```bash
python3 -m http.server 8080
```

Open `http://localhost:8080/diagnostics/tesla-capabilities/` on desktop. In-car Geolocation requires HTTPS; localhost is only suitable for layout and non-GPS checks.

## Vehicle procedure

1. Park safely and set audio volume low.
2. Open the canonical HTTPS product URL and tap **TEST & START**.
3. Open the integrated report with the `i` button.
4. Allow GPS when prompted and observe whether speed becomes numeric.
5. Copy or photograph the report while parked.
6. Return the report to the project so measured values become targets and fallbacks.

## Measurements

- viewport, screen, VisualViewport, DPR, and orientation;
- user agent, touch points, reported hardware, and connection hints;
- secure context and Geolocation permission/API availability;
- GPS sample counts, `coords.speed`, accuracy, and cadence;
- AudioContext unlock, sample rate, reported latency, and AudioWorklet;
- WebGL2 renderer, frame sample, maximum texture size, and progressive fallbacks;
- local storage, IndexedDB, service worker, Cache Storage, WASM, and OffscreenCanvas;
- a chronological event log.

## Privacy

Coordinates are never copied into state, displayed, stored, or included in the report. The report remains on the page until the user copies it. No endpoint or automatic upload is implemented. FTP credentials must never be exposed to browser code.

## Viewport evidence

Tesla's official Model 3 page reports a 15.4-inch center display, but not a CSS viewport. Community reports suggest the browser viewport can change after software updates, including a reported shift from 1920×1200 at DPR 1 to roughly 1254×784 at DPR 1.53. This is useful responsive-test evidence, not a universal Tesla specification. The target vehicle report remains authoritative.

## Current QA

- static files: present;
- JavaScript syntax: PASS;
- layout checked at 1280×720, 1254×784, and 390×844;
- real Tesla GPS, touch, firmware, and restart persistence: pending.
