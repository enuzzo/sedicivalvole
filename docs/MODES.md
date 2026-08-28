# Primary Experience Modes

Status: **confirmed product architecture; Engine design and implementation pending**.

## Confirmed requirements

`sedicivalvole` has two equal primary modes. Both remain selectable from either experience and the active mode is always unmistakable.

| Mode | Audio purpose | Visual purpose | Current status |
|---|---|---|---|
| **Engine** | Reproduce selectable engine characters through synthesis, licensed samples, or a measured hybrid | Instrument-inspired generative system: abstract tachometer, throttle/load field, acceleration trace, mechanical light, or a selected alternative | Confirmed; not yet designed or implemented |
| **Flux** | Compose and reshape selectable music from speed, acceleration, deceleration, and discrete motion events | Four selectable environments: Aperture, Vertigo, Meridian, and Latitudes; ten curated themes apply to every renderer | Current Drive Lab implementation; FRACTURE and JUNCTION ready, five later directions preparing |

## Naming decision

The adaptive music mode is named **Flux** and the primary selector labels are **ENGINE / FLUX**.

`Flux` communicates continuous transformation, energy, motion, and generative visual flow without tying the mode to one music genre or literal road setting. `Feel the Beat` may be explored later as campaign or onboarding copy, but it is too long and slogan-like for persistent navigation. `Street` is intentionally rejected because it is generic and narrows the mode to an urban/road identity.

`Feel the Beat` now has a concrete product meaning: the driver selects an
authored environment that binds a generative effect, musical genre, palette,
geometry family, and speed-response character. This gives Flux meaningful
variety without turning the driving surface into a low-level mixer or renderer
editor.

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

The current Flux build places the flat ENGINE / FLUX selector in the top rail at `773 × 601`. Flux is active; Engine remains visibly present but disabled until its own direction and audio model are implemented. Final dual-mode switching still requires vehicle validation.

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

- the approved Modular Aperture field, byte-identical upstream `VERTIGO 02`, architectural `MERIDIAN 03`, temporal-topography `LATITUDES 04`, and passenger-oriented OpenFreeMap `ATLAS 05` environments;
- ten curated palettes for every renderer; Vertigo is recoloured only through the external bridge while its upstream files stay byte-identical;
- the current environment selector changes visual mechanics while preserving the shared signal, safety, persistence, and diagnostic contracts; it will later select matching authored musical identities as well;
- palette and supported geometry may be tuned per environment, with curated bounds rather than arbitrary live shader controls;
- procedural road-like flow is allowed when it remains abstract and non-scenic;
- no illustrated landscapes, environmental scenes, characters, narrative objects, or old Flash-like decoration;
- visuals remain subordinate to safe driving and the musical experience.

## Open decisions

- final enabled selector behavior after Engine is implemented;
- whether the last selected mode persists locally and which mode opens on first use;
- crossfade duration and behavior while muted or during Brake;
- Engine synthesis, sample-loop, or hybrid strategy;
- first engine-model catalog and licensing/provenance requirements;
- synthetic ratio/gear behavior, manual overrides, and EV-context framing;
- whether a future hybrid mode is desirable; it is not part of the confirmed two-mode requirement;
- per-mode control sets and which preferences are shared.
