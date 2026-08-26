# Primary Experience Modes

Status: **confirmed product architecture; Engine design and implementation pending**.

## Confirmed requirements

`sedicivalvole` has two equal primary modes. Both remain selectable from either experience and the active mode is always unmistakable.

| Mode | Audio purpose | Visual purpose | Current status |
|---|---|---|---|
| **Engine** | Reproduce selectable engine characters through synthesis, licensed samples, or a measured hybrid | Instrument-inspired generative system: abstract tachometer, throttle/load field, acceleration trace, mechanical light, or a selected alternative | Confirmed; not yet designed or implemented |
| **Flux** | Compose and reshape music from speed, acceleration, deceleration, and discrete motion events | Rich animated gradients, chromatic fields, depth/tunnel motion, and optional abstract procedural road-like WebGL flow | Current Drive Lab implementation |

## Naming decision

The adaptive music mode is named **Flux** and the primary selector labels are **ENGINE / FLUX**.

`Flux` communicates continuous transformation, energy, motion, and generative visual flow without tying the mode to one music genre or literal road setting. `Feel the Beat` may be explored later as campaign or onboarding copy, but it is too long and slogan-like for persistent navigation. `Street` is intentionally rejected because it is generic and narrows the mode to an urban/road identity.

The two modes share:

- one normalized GPS/Demo speed stream and motion-event contract;
- one Geolocation permission lifecycle;
- one AudioContext unlock and resume lifecycle;
- master Stop/Mute, conservative output limiting, and vehicle-alert safety;
- diagnostics, privacy rules, reduced motion, accessibility, and progressive degradation;
- a persistent, touch-first mode selector that works at the verified Tesla split viewport.

They do not share one blended identity by default. Engine is not a Flux layer, and Flux is not decorative audio behind Engine.

## Recommended interaction model

⭐️ Use a large two-state segmented control or similarly immediate selector labeled **ENGINE** and **FLUX**. Keep it visible when controls are awake and preserve a compact unmistakable mode marker when controls rest. Do not hide it inside diagnostics, a settings drawer, or the splash alone.

On switch:

1. keep the current speed source and filtered signal state;
2. prewarm only the incoming mode's minimum assets;
3. perform a click-free bounded crossfade;
4. stop inactive mode scheduling and expensive rendering;
5. retain master mute, diagnostics, hue/accessibility preferences where semantically shared;
6. announce the new active mode accessibly without a blocking confirmation dialog.

This is a recommendation, not yet a selected component design. The selector's exact placement and visual anatomy must be validated at `773 × 601` and in the vehicle.

## Engine signal truthfulness

The current browser evidence confirms GPS speed, not real powertrain telemetry. Engine must treat the following as derived simulation values:

- RPM proxy;
- throttle/load proxy;
- synthetic ratio or gear state;
- lift-off and shift events;
- engine temperature, boost, torque, or similar display values if ever proposed.

The UI must not label a derived value as real Tesla RPM, throttle, gear, CAN, motor load, or accelerator position. GPS cadence and accuracy may be too weak for convincing rapid transients, so the mapping needs smoothing, hysteresis, predictive envelopes, and deterministic desktop simulation.

## Visual boundaries

### Engine

- instrument-inspired rather than dashboard-generic;
- mechanical, precise, tactile, and atmospheric;
- may borrow the information grammar of a tachometer or throttle/load meter without copying a protected cluster;
- must remain useful and beautiful even when only speed-derived proxies are available;
- exactly three Engine-specific directions must be shown before implementation.

### Flux

- abstract WebGL gradients, fields, geometry, light, depth, and tunnel motion;
- procedural road-like flow is allowed when it remains abstract and non-scenic;
- no illustrated landscapes, environmental scenes, characters, narrative objects, or old Flash-like decoration;
- visuals remain subordinate to safe driving and the musical experience.

## Open decisions

- exact selector placement and resting-state treatment;
- whether the last selected mode persists locally and which mode opens on first use;
- crossfade duration and behavior while muted or during Brake;
- Engine synthesis, sample-loop, or hybrid strategy;
- first engine-model catalog and licensing/provenance requirements;
- synthetic ratio/gear behavior, manual overrides, and EV-context framing;
- whether a future hybrid mode is desirable; it is not part of the confirmed two-mode requirement;
- per-mode control sets and which preferences are shared.
