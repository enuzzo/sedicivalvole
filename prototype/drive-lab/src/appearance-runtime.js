import {
  DEFAULT_APPEARANCE_MODE,
  normalizeAppearanceMode,
  resolveAppearance,
  solarAppearancePhase,
} from "./appearance-model.js";

export const SYSTEM_APPEARANCE_QUERY = "(prefers-color-scheme: dark)";
export const SOLAR_POSITION_OPTIONS = Object.freeze({
  enableHighAccuracy: false,
  maximumAge: 5 * 60 * 1000,
  timeout: 5000,
});

const normalizeEffectiveAppearance = (value) => (
  value === "dark" ? "dark" : DEFAULT_APPEARANCE_MODE
);

const normalizeSystemColorScheme = (value) => (
  value === "dark" || value === "light" ? value : null
);

function globalMatchMedia() {
  try {
    return typeof globalThis.matchMedia === "function"
      ? globalThis.matchMedia.bind(globalThis)
      : null;
  } catch {
    return null;
  }
}

function globalGeolocation() {
  try {
    return globalThis.navigator?.geolocation ?? null;
  } catch {
    return null;
  }
}

function colorSchemeFromQuery(query) {
  return typeof query?.matches === "boolean"
    ? (query.matches ? "dark" : "light")
    : null;
}

/**
 * Probe the initial colour-scheme only when the media query is observable.
 * A static `matches` value in an embedded WebView must not seed AUTO forever.
 */
export function readSystemAppearanceSnapshot(matchMedia) {
  const matcher = matchMedia === undefined ? globalMatchMedia() : matchMedia;
  let query = null;
  try {
    query = typeof matcher === "function" ? matcher(SYSTEM_APPEARANCE_QUERY) : null;
  } catch {
    query = null;
  }
  const colorScheme = colorSchemeFromQuery(query);
  if (!colorScheme) return { colorScheme: null, supported: false };

  const probe = () => {};
  try {
    if (typeof query?.addEventListener === "function" && typeof query?.removeEventListener === "function") {
      query.addEventListener("change", probe);
      query.removeEventListener("change", probe);
      return { colorScheme, supported: true };
    }
    if (typeof query?.addListener === "function" && typeof query?.removeListener === "function") {
      query.addListener(probe);
      query.removeListener(probe);
      return { colorScheme, supported: true };
    }
  } catch {
    // Treat a blocked listener API as unavailable, even if `matches` is readable.
  }
  return { colorScheme: null, supported: false };
}

/**
 * Reads and observes the browser colour-scheme signal. The returned disposer
 * covers both the current EventTarget API and older WebKit's listener API.
 */
export function subscribeSystemAppearance(onChange, matchMedia) {
  const matcher = matchMedia === undefined ? globalMatchMedia() : matchMedia;
  let query = null;
  try {
    query = typeof matcher === "function" ? matcher(SYSTEM_APPEARANCE_QUERY) : null;
  } catch {
    query = null;
  }

  const initialColorScheme = colorSchemeFromQuery(query);
  const listener = (event) => {
    const colorScheme = colorSchemeFromQuery(event) ?? colorSchemeFromQuery(query);
    if (colorScheme && typeof onChange === "function") onChange(colorScheme);
  };

  let removeListener = () => {};
  let listenerRegistered = false;
  try {
    if (typeof query?.addEventListener === "function" && typeof query?.removeEventListener === "function") {
      query.addEventListener("change", listener);
      listenerRegistered = true;
      removeListener = () => query.removeEventListener("change", listener);
    } else if (typeof query?.addListener === "function" && typeof query?.removeListener === "function") {
      query.addListener(listener);
      listenerRegistered = true;
      removeListener = () => query.removeListener(listener);
    }
  } catch {
    listenerRegistered = false;
    removeListener = () => {};
  }

  let disposed = false;
  return {
    initialColorScheme,
    supported: initialColorScheme !== null && listenerRegistered,
    dispose() {
      if (disposed) return;
      disposed = true;
      try {
        removeListener();
      } catch {
        // A browser teardown must never interrupt app cleanup.
      }
    },
  };
}

/**
 * Requests one low-power position sample and publishes only its solar phase.
 * Coordinates remain local to the success callback and are never returned.
 */
export function requestSolarAppearancePhase({
  geolocation,
  now = () => Date.now(),
  onPhase,
} = {}) {
  const provider = geolocation === undefined ? globalGeolocation() : geolocation;
  let cancelled = false;
  const publish = (phase) => {
    if (!cancelled && typeof onPhase === "function") onPhase(phase);
  };

  if (typeof provider?.getCurrentPosition !== "function") {
    publish(null);
    return () => {
      cancelled = true;
    };
  }

  try {
    provider.getCurrentPosition(
      (position) => {
        let capturedAt;
        try {
          capturedAt = now();
        } catch {
          publish(null);
          return;
        }
        publish(solarAppearancePhase({
          latitude: position?.coords?.latitude,
          longitude: position?.coords?.longitude,
        }, capturedAt));
      },
      () => publish(null),
      SOLAR_POSITION_OPTIONS,
    );
  } catch {
    publish(null);
  }

  return () => {
    cancelled = true;
  };
}

/**
 * Resolves UI appearance and records why AUTO chose or held that result.
 * Visual/palette state is deliberately absent from this contract.
 */
export function resolveAppearanceState({
  mode,
  systemColorScheme = null,
  solarPhase = null,
  currentAppearance = DEFAULT_APPEARANCE_MODE,
  interactionActive = false,
} = {}) {
  const preference = normalizeAppearanceMode(mode);
  const current = normalizeEffectiveAppearance(currentAppearance);
  if (preference !== "auto") {
    return {
      appearance: preference,
      source: "manual",
      holdReason: null,
    };
  }

  const system = normalizeSystemColorScheme(systemColorScheme);
  const source = system
    ? "system"
    : ["day", "night", "twilight"].includes(solarPhase)
      ? "solar"
      : "fallback";
  const desiredWithoutInteractionHold = resolveAppearance({
    mode: preference,
    systemColorScheme: system,
    solarPhase,
    currentAppearance: current,
    interactionActive: false,
  });
  const appearance = resolveAppearance({
    mode: preference,
    systemColorScheme: system,
    solarPhase,
    currentAppearance: current,
    interactionActive,
  });
  const holdReason = interactionActive && desiredWithoutInteractionHold !== current
    ? "interaction"
    : !system && solarPhase === "twilight"
      ? "twilight"
      : null;

  return {
    appearance,
    source,
    holdReason,
  };
}
