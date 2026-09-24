import { MANUAL_EFFECT_CONTROLS } from "../manual-effects-controls.js";
import { useEffect, useMemo, useRef, useState } from "react";
import { ENGINE_CATALOGUE } from "../engine/catalogue.js";
import { FLUX_THEMES, getFluxTheme } from "../flux-themes.js";
import { resolveSemanticTheme } from "../semantic-theme.js";
import { SetupMark } from "../motion/motion-ui.jsx";
import { FLUX_VISUAL_CHOICES, SHADERGRADIENT_ENVIRONMENTS, isShaderGradientEnvironmentId, visualThumbnailUrl } from "../flux-environments.js";
import { readyScoreGenres } from "../score/genres.js";
import { MediaGlyph } from "../media-glyph.jsx";
import { ActivityBars, Led, NiGlyph } from "../ui/night-instrument.jsx";
import { REMOTE_PAIRING_STORAGE_KEY, createRemoteSession, selectRemotePair } from "./session.js";
import "./remote.css";

const EMPTY_STATE = Object.freeze({ mode: "flux", musicMode: "play-road", genreId: "junction", environmentId: "aperture", engineProfileId: "mono", themeId: "red", muted: false, vehicleEffectsEnabled: true, playing: false, manualEffects: {}, track: null });
const makeId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
const MARK_URL = "/brand/pistons-v1/mark-512.png";
const TABS = Object.freeze([
  Object.freeze({ id: "visual", label: "Visual", glyph: "visual" }),
  Object.freeze({ id: "music", label: "Music", glyph: "music" }),
  Object.freeze({ id: "fx", label: "FX", glyph: "mix" }),
  Object.freeze({ id: "palette", label: "Palette", glyph: "palette" }),
]);
const ENGINE_TABS = Object.freeze([
  Object.freeze({ id: "engine", label: "Engine", glyph: "engine" }),
  Object.freeze({ id: "fx", label: "FX", glyph: "mix" }),
  Object.freeze({ id: "palette", label: "Palette", glyph: "palette" }),
]);

function readSavedPair() {
  try {
    const value = JSON.parse(localStorage.getItem(REMOTE_PAIRING_STORAGE_KEY) || "null");
    return value?.expiresAt && value.expiresAt > Date.now() ? value : null;
  } catch { return null; }
}

function writeSavedPair(value) {
  try { localStorage.setItem(REMOTE_PAIRING_STORAGE_KEY, JSON.stringify(value)); } catch { /* Private browsing can deny storage. */ }
}

function forgetSavedPair() {
  try { localStorage.removeItem(REMOTE_PAIRING_STORAGE_KEY); } catch { /* Ignore unavailable storage. */ }
}

function labelFor(collection, id, fallback = "Choose") {
  return collection.find((item) => item.id === id)?.displayLabel
    || collection.find((item) => item.id === id)?.label
    || fallback;
}

const paletteName = (theme) => theme.label.replace(/\s+\d+$/, "").toLowerCase().replace(/^./, (character) => character.toUpperCase());
const swatchStyle = (theme) => ({ background: theme.swatchSecondary
  ? `linear-gradient(105deg, ${theme.swatch} 0 52%, ${theme.swatchSecondary} 52% 100%)`
  : theme.swatch });

function statusText(snapshot) {
  if (snapshot.state === "connected") return snapshot.networkState === "online" ? "Connected" : "Reconnecting";
  if (["connecting", "preparing"].includes(snapshot.state)) return "Connecting";
  if (snapshot.state === "expired") return "Pairing expired";
  if (["error", "unavailable", "invalid_pairing", "closed"].includes(snapshot.state)) return "Connection ended";
  return "Ready to pair";
}

/* Original scene: the car display shows a QR, the phone sweeps it. */
function PairingScene({ waiting }) {
  return (
    <svg className="remote-scene" data-waiting={waiting} viewBox="0 0 320 188" role="img" aria-label={waiting ? "Phone connecting to the car display" : "Phone scanning the QR on the car display"}>
      <defs>
        <linearGradient id="remote-scene-beam" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="var(--ui-indicator)" stopOpacity="0" />
          <stop offset=".5" stopColor="var(--ui-indicator)" stopOpacity=".9" />
          <stop offset="1" stopColor="var(--ui-indicator)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <g className="remote-scene-display">
        <rect x="18" y="26" width="176" height="124" rx="12" />
        <rect className="remote-scene-bar" x="18" y="26" width="176" height="18" rx="12" />
        <g className="remote-scene-qr" transform="translate(76 60)">
          <rect width="60" height="60" rx="5" />
          <path d="M6 6h16v16H6zM38 6h16v16H38zM6 38h16v16H6zM28 28h6v6h-6zM38 38h6v6h-6zM48 44h6v10h-6zM38 50h6v4h-6zM28 40h4v14h-4zM28 6h6v12h-6z" />
        </g>
        <path className="remote-scene-lanes" d="M40 150c18-26 34-40 66-46M172 150c-18-26-34-40-66-46" />
      </g>
      <g className="remote-scene-phone" transform="translate(206 20)">
        <rect x="0" y="0" width="92" height="156" rx="16" />
        <rect className="remote-scene-screen" x="7" y="10" width="78" height="136" rx="10" />
        <g className="remote-scene-corners" transform="translate(21 44)">
          <path d="M0 12V2a2 2 0 0 1 2-2h10M38 0h10a2 2 0 0 1 2 2v10M50 38v10a2 2 0 0 1-2 2H38M12 50H2a2 2 0 0 1-2-2V38" />
        </g>
        <rect className="remote-scene-beam" x="17" y="44" width="58" height="10" fill="url(#remote-scene-beam)" />
        <g className="remote-scene-link" transform="translate(46 118)">
          <circle r="7" />
          <circle className="remote-scene-link-ring" r="7" />
        </g>
      </g>
    </svg>
  );
}

function PairingGuide({ state, hasPair }) {
  const ended = ["expired", "error", "unavailable", "invalid_pairing", "closed"].includes(state);
  const waiting = hasPair && !ended;
  const preview = useMemo(() => FLUX_VISUAL_CHOICES.filter((choice) => choice.kind !== "destination").slice(0, 8), []);
  return <section className="remote-pairing-empty" aria-labelledby="remote-guide-title">
    <div className="remote-guide-hero">
      <PairingScene waiting={waiting} />
      <h1 id="remote-guide-title">{waiting ? "Connecting your phone" : ended && hasPair ? "Connect again" : "Control the drive"}</h1>
      <p>{waiting ? "Keep this page open. Your controls appear as soon as the display responds." : ended && hasPair ? "Open the phone panel on the display and create a new QR." : "Music, visuals and effects, from the passenger seat."}</p>
    </div>
    {!waiting ? <ol className="remote-guide-steps">
      <li><span className="remote-step-icon"><NiGlyph name="phone" /><b>1</b></span><div><strong>Open the phone panel</strong><p>On the car display, tap the phone icon.</p></div></li>
      <li><span className="remote-step-icon"><NiGlyph name="scan" /><b>2</b></span><div><strong>Scan the QR</strong><p>Use the camera, then open the link.</p></div></li>
      <li><span className="remote-step-icon"><NiGlyph name="sparkle" /><b>3</b></span><div><strong>Make it your drive</strong><p>GPS stays on the car display.</p></div></li>
    </ol> : <p className="remote-pairing-note" role="status">Both devices need an Internet connection. No sensor permission is required.</p>}
    {!waiting ? <section className="remote-preview" aria-label="What you will control">
      <h2>What you will control</h2>
      <div className="remote-preview-strip">
        {preview.map((choice) => <figure key={choice.id}><img src={visualThumbnailUrl(choice.id)} alt="" width="192" height="149" loading="lazy" /><figcaption>{choice.displayLabel}</figcaption></figure>)}
      </div>
    </section> : null}
    <details className="remote-guide-help"><summary>Connection help<SetupMark kind="chevron"/></summary><p>Keep both pages open. Brief network interruptions reconnect automatically for up to one hour.</p><p>If pairing expires, create a new QR on the display and scan it again. No app to install and no motion sensors to enable.</p></details>
  </section>;
}

function safePresentation() {
  const query = new URLSearchParams(window.location.search);
  return { palette: query.get("palette") || "red", appearance: query.get("appearance") === "light" ? "light" : "dark" };
}

/** The display, mirrored: the running visual behind the current track. */
function NowOnDisplay({ remoteState, visualLabel, onCommand }) {
  const track = remoteState.track;
  const engine = remoteState.mode === "engine";
  const source = engine ? "ENGINE" : remoteState.musicMode === "soundtrack" ? "SOUNDTRACK" : "PLAY THE ROAD";
  return <section className="remote-now" aria-label="Now on the display">
    <img className="remote-now-backdrop" src={visualThumbnailUrl(remoteState.environmentId)} alt="" width="192" height="149" />
    <div className="remote-now-scrim" aria-hidden="true" />
    <p className="remote-now-label"><Led on={remoteState.playing && !remoteState.muted} />ON THE DISPLAY · {engine ? labelFor(ENGINE_CATALOGUE, remoteState.engineProfileId, "Engine") : visualLabel}</p>
    <div className="remote-now-track" role="status" aria-live="polite">
      <div className="remote-cover">{track?.artwork ? <img src={track.artwork} alt="" /> : <img className="is-mark" src={MARK_URL} alt="" />}</div>
      <div className="remote-track"><small><ActivityBars playing={remoteState.playing && !remoteState.muted} />{source}</small><strong>{track?.title || "Ready to drive"}</strong><span>{track?.artist || "sedicivalvole"}</span></div>
    </div>
    <div className="remote-transport" aria-label="Transport">
      <button type="button" onClick={() => onCommand("transport", { direction: "previous" })} aria-label="Previous"><MediaGlyph name="previous" /></button>
      <button type="button" className="remote-play" onClick={() => onCommand("transport", { direction: "toggle" })} aria-label={remoteState.playing ? "Pause" : "Play"}><MediaGlyph name={remoteState.playing ? "pause" : "play"} /></button>
      <button type="button" onClick={() => onCommand("transport", { direction: "next" })} aria-label="Next"><MediaGlyph name="next" /></button>
    </div>
  </section>;
}

/** Touch pad for one manual effect: tap for the authored hit, drag for depth. */
function RemotePad({ effect, value, pending, disabled, onChange }) {
  const padRef = useRef(null);
  const dragRef = useRef(null);
  const amount = Number(value) || 0;
  const active = amount > 0.01;
  const percent = Math.round(amount * 100);
  const toggle = () => onChange(effect.id, active ? 0 : effect.performanceAmount);
  const release = (event) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    dragRef.current = null;
    padRef.current?.releasePointerCapture?.(event.pointerId);
    if (!drag.moved && event.type === "pointerup") toggle();
  };
  return <div
    ref={padRef}
    className={`remote-pad${active ? " is-active" : ""}${effect.family ? ` is-family-${effect.family}` : ""}`}
    style={{ "--depth": amount }}
    role="slider"
    tabIndex={disabled ? -1 : 0}
    aria-disabled={disabled || undefined}
    aria-label={`${effect.displayLabel} depth`}
    aria-describedby="remote-pad-help"
    aria-valuemin={0}
    aria-valuemax={100}
    aria-valuenow={percent}
    aria-valuetext={`${percent}%${pending ? ", sending" : active ? ", playing" : ", off"}`}
    onPointerDown={(event) => {
      if (disabled) return;
      dragRef.current = { pointerId: event.pointerId, y: event.clientY, start: amount, moved: false };
      padRef.current?.setPointerCapture?.(event.pointerId);
    }}
    onPointerMove={(event) => {
      const drag = dragRef.current;
      if (!drag || drag.pointerId !== event.pointerId) return;
      const travel = drag.y - event.clientY;
      if (!drag.moved && Math.abs(travel) < 8) return;
      drag.moved = true;
      const height = Math.max(60, padRef.current?.clientHeight ?? 90);
      onChange(effect.id, Math.min(1, Math.max(0, Math.round((drag.start + travel / (height * 1.1)) * 100) / 100)));
    }}
    onPointerUp={release}
    onPointerCancel={release}
    onKeyDown={(event) => {
      if (disabled) return;
      const steps = { ArrowUp: 0.05, ArrowRight: 0.05, ArrowDown: -0.05, ArrowLeft: -0.05 };
      if (event.key in steps) onChange(effect.id, Math.min(1, Math.max(0, Math.round((amount + steps[event.key]) * 100) / 100)));
      else if (event.key === "Enter" || event.key === " ") toggle();
      else return;
      event.preventDefault();
    }}
  >
    <span className="remote-pad-level" aria-hidden="true" />
    <strong>{effect.displayLabel}</strong>
    <span className="remote-pad-value" aria-hidden="true">{pending ? "…" : `${percent}%`}</span>
  </div>;
}

export function MotionPhone() {
  const presentation = useMemo(safePresentation, []);
  const [remoteState, setRemoteState] = useState(() => ({ ...EMPTY_STATE, themeId: presentation.palette, appearance: presentation.appearance }));
  const [pendingManualEffects, setPendingManualEffects] = useState({});
  const [snapshot, setSnapshot] = useState({ state: "idle", networkState: "offline" });
  const [pair, setPair] = useState(null);
  const [tab, setTab] = useState("visual");
  const [showGuide, setShowGuide] = useState(false);
  const [notice, setNotice] = useState(null);
  const sessionRef = useRef(null);
  const visualChoices = useMemo(() => FLUX_VISUAL_CHOICES.filter((choice) => choice.kind !== "destination" || ["discover", "stats"].includes(choice.id)), []);
  const genres = useMemo(() => readyScoreGenres(), []);

  useEffect(() => {
    const saved = selectRemotePair(window.location.hash.slice(1), readSavedPair());
    if (saved) setPair(saved);
    const session = createRemoteSession({
      role: "phone",
      getPresentation: () => presentation,
      onChange: (next) => {
        setSnapshot(next);
        if (next.credentials) {
          const savedPair = { ...saved, ...next.credentials, key: saved?.key, paired: true, expiresAt: next.credentials.expiresAt || Date.now() + 3600000 };
          if (savedPair.key) {
            setPair(savedPair);
            writeSavedPair(savedPair);
            if (window.location.hash.startsWith("#pair=")) {
              window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
            }
          }
        }
      },
      onState: (next, { pending = [] } = {}) => {
        setRemoteState((current) => ({ ...current, ...next, manualEffects: { ...current.manualEffects, ...(next.manualEffects || {}) } }));
        setPendingManualEffects(Object.fromEntries(pending.filter((command) => command.type === "manual-effect").map((command) => [command.effect, command.value])));
      },
      onEvent: (type) => {
        if (type === "error") setNotice(null);
        if (type === "channel-open") setNotice(null);
      },
    });
    sessionRef.current = session;
    if (saved) void session.start(saved);
    return () => { session.dispose(); sessionRef.current = null; };
  }, [presentation]);

  const send = (type, value = {}) => {
    const accepted = sessionRef.current?.command({ id: makeId(), type, ...value });
    if (accepted && type === "manual-effect") setPendingManualEffects((current) => ({ ...current, [value.effect]: value.value }));
    if (!accepted) setNotice("Reconnecting… command will be available again shortly.");
  };

  useEffect(() => {
    if (snapshot.state === "connected" && snapshot.networkState === "online") setNotice(null);
  }, [snapshot.state, snapshot.networkState]);

  const forget = () => { sessionRef.current?.stop(); forgetSavedPair(); setPair(null); setRemoteState(EMPTY_STATE); setPendingManualEffects({}); setSnapshot({ state: "idle", networkState: "offline" }); setShowGuide(false); };
  const connected = snapshot.state === "connected";
  const ready = connected && snapshot.networkState === "online";
  const palette = pair ? remoteState.themeId : presentation.palette;
  const appearance = remoteState.appearance === "light" || remoteState.appearance === "dark" ? remoteState.appearance : presentation.appearance;
  const colors = resolveSemanticTheme(getFluxTheme(palette), appearance);
  const guideVisible = !pair || !connected || showGuide;
  const engine = remoteState.mode === "engine";
  const musicEffectsAvailable = !engine;
  const displayedManualEffects = { ...remoteState.manualEffects, ...pendingManualEffects };
  const tabs = engine ? ENGINE_TABS : TABS;
  const activeTab = tabs.some((item) => item.id === tab) ? tab : tabs[0].id;
  const visualLabel = isShaderGradientEnvironmentId(remoteState.environmentId)
    ? labelFor(SHADERGRADIENT_ENVIRONMENTS, remoteState.environmentId, "Gradient")
    : labelFor(visualChoices, remoteState.environmentId, "Aperture");

  return <main className="remote-phone" style={colors.css} data-palette={palette} data-appearance={appearance} data-view={guideVisible ? "guide" : "remote"}>
    <div className="remote-phone-content">
      <header className="remote-phone-header">
        <div className="remote-brand"><img src={MARK_URL} width="40" height="40" alt=""/><span><span className="remote-wordmark">sedicivalvole</span><small>PASSENGER REMOTE</small></span></div>
        <div className="remote-link-status" data-connected={ready} role="status"><Led on tone={ready ? "success" : "caution"} /><span>{statusText(snapshot)}</span></div>
        {connected ? <button type="button" className="remote-help-button" onClick={() => setShowGuide((value) => !value)} aria-label={showGuide ? "Back to remote" : "Help"}>{showGuide ? <NiGlyph name="back" /> : "?"}</button> : null}
      </header>

      {guideVisible ? <PairingGuide state={snapshot.state} hasPair={Boolean(pair) && !showGuide}/> : <>
        <NowOnDisplay remoteState={remoteState} visualLabel={visualLabel} onCommand={send} />

        <nav className="remote-switch ni-switch" aria-label="Mode" data-index={engine ? 1 : 0} style={{ "--switch-count": 2 }}>
          <span className="ni-switch-thumb" aria-hidden="true" />
          <button type="button" aria-pressed={!engine} onClick={() => send("mode", { value: "flux" })}><NiGlyph name="music" />Music</button>
          <button type="button" aria-pressed={engine} onClick={() => send("mode", { value: "engine" })}><NiGlyph name="engine" />Engine</button>
        </nav>

        <section className="remote-panel" aria-label={`${tabs.find((item) => item.id === activeTab)?.label} controls`}>
          {activeTab === "visual" ? <div className="remote-visual-grid">
            {visualChoices.map((choice) => {
              const active = choice.kind === "family" ? isShaderGradientEnvironmentId(remoteState.environmentId) : choice.id === remoteState.environmentId;
              return <button key={choice.id} type="button" aria-pressed={active} className={active ? "is-active" : ""} onClick={() => send("visual", { value: choice.id })}>
                <img src={visualThumbnailUrl(choice.kind === "family" && active ? remoteState.environmentId : choice.id)} alt="" width="192" height="149" loading="lazy" />
                <span>{choice.displayLabel}</span>
              </button>;
            })}
          </div> : null}

          {activeTab === "music" ? <div className="remote-music">
            <nav className="remote-switch is-compact ni-switch" aria-label="Music source" data-index={remoteState.musicMode === "soundtrack" ? 1 : 0} style={{ "--switch-count": 2 }}>
              <span className="ni-switch-thumb" aria-hidden="true" />
              <button type="button" aria-pressed={remoteState.musicMode !== "soundtrack"} onClick={() => send("music-mode", { value: "play-road" })}>Play the Road</button>
              <button type="button" aria-pressed={remoteState.musicMode === "soundtrack"} onClick={() => send("music-mode", { value: "soundtrack" })}>Soundtrack</button>
            </nav>
            {remoteState.musicMode === "soundtrack"
              ? <p className="remote-hint">Soundtrack follows the pace and genre chosen on the display. Use the transport above to move between tracks.</p>
              : <div className="remote-genre-grid">{genres.map((genre) => {
                const active = genre.id === remoteState.genreId;
                return <button key={genre.id} type="button" aria-pressed={active} className={active ? "is-active" : ""} onClick={() => send("genre", { value: genre.id })}>
                  <img src={genre.coverUrl} alt="" width="72" height="72" loading="lazy" />
                  <span><strong>{genre.displayLabel}</strong><small>{genre.family}</small></span>
                </button>;
              })}</div>}
          </div> : null}

          {activeTab === "fx" ? <div className="remote-fx">
            <button type="button" disabled={!musicEffectsAvailable} className={`remote-brake${remoteState.vehicleEffectsEnabled && musicEffectsAvailable ? " is-active" : ""}`} aria-pressed={remoteState.vehicleEffectsEnabled} onClick={() => send("vehicle-effects", { value: !remoteState.vehicleEffectsEnabled })}>
              <span><small>BRAKING RESPONSE</small><strong>Underwater</strong></span>
              <span className="remote-brake-state"><Led on={remoteState.vehicleEffectsEnabled && musicEffectsAvailable} />{musicEffectsAvailable ? remoteState.vehicleEffectsEnabled ? "ON" : "OFF" : "DRY"}</span>
            </button>
            <p className="remote-hint">{musicEffectsAvailable ? remoteState.vehicleEffectsEnabled ? "Firm braking filters the music. Manual FX below work independently." : "Braking changes visuals only. Manual FX still work." : "Effects apply to Music. Engine stays dry."}</p>
            <p id="remote-pad-help" className="remote-visually-hidden">Tap a pad to play it. Drag up or down to set its depth.</p>
            <div className="remote-pad-grid" aria-label="Manual FX">
              {MANUAL_EFFECT_CONTROLS.map((effect) => <RemotePad key={effect.id} effect={effect} value={displayedManualEffects[effect.id]} pending={effect.id in pendingManualEffects} disabled={!musicEffectsAvailable} onChange={(id, value) => send("manual-effect", { effect: id, value })} />)}
            </div>
          </div> : null}

          {activeTab === "engine" ? <div className="remote-engine-list">
            {ENGINE_CATALOGUE.map((profile) => {
              const active = profile.id === remoteState.engineProfileId;
              return <button key={profile.id} type="button" aria-pressed={active} className={active ? "is-active" : ""} onClick={() => send("engine-profile", { value: profile.id })}>
                <span><strong>{profile.label}</strong><small>{profile.description}</small></span>
                <Led on={active} />
              </button>;
            })}
          </div> : null}

          {activeTab === "palette" ? <div className="remote-palette-grid">
            {FLUX_THEMES.map((theme) => {
              const active = theme.id === remoteState.themeId;
              return <button key={theme.id} type="button" aria-pressed={active} aria-label={`Use the ${paletteName(theme)} palette`} className={active ? "is-active" : ""} onClick={() => send("theme", { value: theme.id })}>
                <span className="remote-swatch" style={swatchStyle(theme)} aria-hidden="true" />
                <span>{paletteName(theme)}</span>
              </button>;
            })}
          </div> : null}
        </section>

        <nav className="remote-tabbar" aria-label="Remote sections" role="tablist">
          {tabs.map((item) => <button key={item.id} type="button" role="tab" aria-selected={activeTab === item.id} onClick={() => setTab(item.id)}><NiGlyph name={item.glyph} /><span>{item.label}</span></button>)}
        </nav>
      </>}

      {notice ? <p className="remote-notice" role="status">{notice}</p> : null}
      {<footer className="remote-phone-footer"><span>{ready ? "GPS stays on the car display" : connected ? "Pairing saved · reconnecting" : "No app to install · no sensor access"}</span>{pair ? <button type="button" onClick={forget}>FORGET THIS DISPLAY</button> : null}</footer>}
    </div>
  </main>;
}
