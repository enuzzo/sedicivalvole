import assert from "node:assert/strict";
import test from "node:test";
import {
  SOLAR_POSITION_OPTIONS,
  SYSTEM_APPEARANCE_QUERY,
  readSystemAppearanceSnapshot,
  requestSolarAppearancePhase,
  resolveAppearanceState,
  subscribeSystemAppearance,
} from "../src/appearance-runtime.js";
import {
  readAppearancePreference,
  resetAppearancePreference,
  writeAppearancePreference,
} from "../src/appearance-model.js";

function modernMediaQuery(matches = false) {
  let listener = null;
  return {
    matches,
    addEventListener(type, nextListener) {
      assert.equal(type, "change");
      listener = nextListener;
    },
    removeEventListener(type, nextListener) {
      assert.equal(type, "change");
      assert.equal(nextListener, listener);
      listener = null;
    },
    emit(nextMatches) {
      this.matches = nextMatches;
      listener?.({ matches: nextMatches });
    },
    hasListener: () => listener !== null,
  };
}

function legacyMediaQuery(matches = false) {
  let listener = null;
  return {
    matches,
    addListener(nextListener) {
      listener = nextListener;
    },
    removeListener(nextListener) {
      assert.equal(nextListener, listener);
      listener = null;
    },
    emit(nextMatches) {
      this.matches = nextMatches;
      listener?.({ matches: nextMatches });
    },
    hasListener: () => listener !== null,
  };
}

test("system appearance uses modern matchMedia change events and disposes idempotently", () => {
  const query = modernMediaQuery(false);
  const changes = [];
  const subscription = subscribeSystemAppearance(
    (scheme) => changes.push(scheme),
    (mediaQuery) => {
      assert.equal(mediaQuery, SYSTEM_APPEARANCE_QUERY);
      return query;
    },
  );

  assert.deepEqual(subscription, {
    initialColorScheme: "light",
    supported: true,
    dispose: subscription.dispose,
  });
  assert.equal(query.hasListener(), true);
  query.emit(true);
  query.emit(false);
  assert.deepEqual(changes, ["dark", "light"]);
  subscription.dispose();
  subscription.dispose();
  assert.equal(query.hasListener(), false);
});

test("system appearance supports legacy WebKit listeners and unavailable signals", () => {
  const query = legacyMediaQuery(true);
  const changes = [];
  const subscription = subscribeSystemAppearance((scheme) => changes.push(scheme), () => query);
  assert.equal(subscription.initialColorScheme, "dark");
  query.emit(false);
  assert.deepEqual(changes, ["light"]);
  subscription.dispose();
  assert.equal(query.hasListener(), false);

  const missing = subscribeSystemAppearance(() => assert.fail("unexpected change"), null);
  assert.equal(missing.initialColorScheme, null);
  assert.equal(missing.supported, false);
  assert.doesNotThrow(() => missing.dispose());
  const throwing = subscribeSystemAppearance(() => {}, () => { throw new Error("blocked"); });
  assert.equal(throwing.supported, false);
});

test("a readable but unobservable system colour signal falls back instead of freezing AUTO", () => {
  assert.deepEqual(readSystemAppearanceSnapshot(() => ({ matches: true })), {
    colorScheme: null,
    supported: false,
  });
  assert.deepEqual(readSystemAppearanceSnapshot(() => ({
    matches: true,
    addEventListener() { throw new Error("listener blocked"); },
    removeEventListener() {},
  })), {
    colorScheme: null,
    supported: false,
  });

  const readOnly = subscribeSystemAppearance(() => assert.fail("unexpected change"), () => ({ matches: true }));
  assert.equal(readOnly.initialColorScheme, "dark");
  assert.equal(readOnly.supported, false);
  assert.doesNotThrow(() => readOnly.dispose());

  const throwingListener = subscribeSystemAppearance(() => assert.fail("unexpected change"), () => ({
    matches: false,
    addEventListener() { throw new Error("listener blocked"); },
  }));
  assert.equal(throwingListener.initialColorScheme, "light");
  assert.equal(throwingListener.supported, false);
});

test("the initial appearance probe verifies and removes modern and legacy listeners", () => {
  const modern = modernMediaQuery(true);
  assert.deepEqual(readSystemAppearanceSnapshot(() => modern), {
    colorScheme: "dark",
    supported: true,
  });
  assert.equal(modern.hasListener(), false);

  const legacy = legacyMediaQuery(false);
  assert.deepEqual(readSystemAppearanceSnapshot(() => legacy), {
    colorScheme: "light",
    supported: true,
  });
  assert.equal(legacy.hasListener(), false);
});

test("solar fallback samples an ephemeral position and timestamps inside the success boundary", () => {
  let success = null;
  let requestedOptions = null;
  let nowCalls = 0;
  const phases = [];
  const cancel = requestSolarAppearancePhase({
    geolocation: {
      getCurrentPosition(onSuccess, _onFailure, options) {
        success = onSuccess;
        requestedOptions = options;
      },
    },
    now: () => {
      nowCalls += 1;
      return Date.parse("2026-03-20T12:00:00Z");
    },
    onPhase: (phase) => phases.push(phase),
  });

  assert.equal(nowCalls, 0);
  assert.deepEqual(requestedOptions, SOLAR_POSITION_OPTIONS);
  success({ coords: { latitude: 0, longitude: 0, accuracy: 12 } });
  assert.equal(nowCalls, 1);
  assert.deepEqual(phases, ["day"]);
  assert.equal(JSON.stringify(phases).includes("latitude"), false);
  assert.equal(JSON.stringify(phases).includes("longitude"), false);
  cancel();
});

test("solar fallback fails closed and cancellation drops late coordinates", () => {
  const unavailable = [];
  requestSolarAppearancePhase({ geolocation: null, onPhase: (phase) => unavailable.push(phase) });
  assert.deepEqual(unavailable, [null]);

  const failed = [];
  requestSolarAppearancePhase({
    geolocation: { getCurrentPosition(_success, failure) { failure(new Error("denied")); } },
    onPhase: (phase) => failed.push(phase),
  });
  assert.deepEqual(failed, [null]);

  let lateSuccess = null;
  const cancelled = [];
  const cancel = requestSolarAppearancePhase({
    geolocation: { getCurrentPosition(success) { lateSuccess = success; } },
    now: () => Date.parse("2026-03-20T12:00:00Z"),
    onPhase: (phase) => cancelled.push(phase),
  });
  cancel();
  lateSuccess({ coords: { latitude: 0, longitude: 0 } });
  assert.deepEqual(cancelled, []);
});

test("AUTO reports system, solar and fallback sources with interaction and twilight holds", () => {
  assert.deepEqual(resolveAppearanceState({ mode: "light", systemColorScheme: "dark" }), {
    appearance: "light", source: "manual", holdReason: null,
  });
  assert.deepEqual(resolveAppearanceState({ mode: "dark", systemColorScheme: "light" }), {
    appearance: "dark", source: "manual", holdReason: null,
  });
  assert.deepEqual(resolveAppearanceState({
    mode: "auto", systemColorScheme: "dark", solarPhase: "day", currentAppearance: "light",
  }), { appearance: "dark", source: "system", holdReason: null });
  assert.deepEqual(resolveAppearanceState({
    mode: "auto", solarPhase: "night", currentAppearance: "light",
  }), { appearance: "dark", source: "solar", holdReason: null });
  assert.deepEqual(resolveAppearanceState({
    mode: "auto", solarPhase: "twilight", currentAppearance: "dark",
  }), { appearance: "dark", source: "solar", holdReason: "twilight" });
  assert.deepEqual(resolveAppearanceState({
    mode: "auto", solarPhase: "night", currentAppearance: "light", interactionActive: true,
  }), { appearance: "light", source: "solar", holdReason: "interaction" });
  assert.deepEqual(resolveAppearanceState({ mode: "auto", currentAppearance: "dark" }), {
    appearance: "dark", source: "fallback", holdReason: null,
  });
});

test("global localStorage getter failures stay inside the appearance boundary", () => {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    get() {
      throw new Error("SecurityError");
    },
  });
  try {
    assert.equal(readAppearancePreference(), "light");
    assert.equal(writeAppearancePreference("dark"), false);
    assert.equal(resetAppearancePreference(), false);
  } finally {
    if (descriptor) Object.defineProperty(globalThis, "localStorage", descriptor);
    else delete globalThis.localStorage;
  }
});

test("appearance runtime has no network or coordinate persistence path", async () => {
  const source = await import("node:fs/promises")
    .then(({ readFile }) => readFile(new URL("../src/appearance-runtime.js", import.meta.url), "utf8"));
  assert.doesNotMatch(source, /\bfetch\b|XMLHttpRequest|WebSocket|EventSource|https?:\/\//);
  assert.doesNotMatch(source, /localStorage|sessionStorage|indexedDB|setItem|latitude\s*:.*(?:storage|persist)/i);
  assert.doesNotMatch(source, /watchPosition/);
});
