import { useEffect, useMemo, useRef, useState } from "react";
import { ENGINE_CATALOGUE } from "../engine/catalogue.js";
import { FLUX_THEMES, getFluxTheme } from "../flux-themes.js";
import { resolveSemanticTheme } from "../semantic-theme.js";
import { SetupMark } from "../motion/motion-ui.jsx";
import { FLUX_VISUAL_CHOICES } from "../flux-environments.js";
import { readyScoreGenres } from "../score/genres.js";
import { MediaGlyph } from "../media-glyph.jsx";
import { REMOTE_PAIRING_STORAGE_KEY, createRemoteSession, selectRemotePair } from "./session.js";
import "./remote.css";

const MANUAL_EFFECTS = Object.freeze([
  ["flanger", "Flanger"], ["reverb", "Reverb"], ["underwater", "Underwater"], ["phaser", "Phaser"],
  ["bitcrush", "Bitcrush"], ["bassDrive", "Bass Drive"], ["radioCut", "Radio Cut"], ["highCut", "High Cut"],
]);
const EMPTY_STATE = Object.freeze({ mode: "flux", musicMode: "play-road", genreId: "junction", environmentId: "aperture", engineProfileId: "mono", themeId: "red", muted: false, vehicleEffectsEnabled: true, playing: false, manualEffects: {}, track: null });
const makeId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;

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

function statusText(snapshot) {
  if (snapshot.state === "connected") return snapshot.networkState === "online" ? "Connected to display" : "Reconnecting";
  if (["connecting", "preparing"].includes(snapshot.state)) return "Connecting to display";
  if (snapshot.state === "expired") return "Pairing expired";
  if (["error", "unavailable", "invalid_pairing", "closed"].includes(snapshot.state)) return "Connection ended";
  return "Ready to pair";
}

function PairingGuide({ state, hasPair }) {
  const ended = ["expired", "error", "unavailable", "invalid_pairing", "closed"].includes(state);
  const waiting = hasPair && !ended;
  return <section className="remote-pairing-empty" aria-labelledby="remote-guide-title">
    <div className="remote-guide-heading">
      <div><h1 id="remote-guide-title">{waiting ? "Connecting your phone" : ended && hasPair ? "Connect again" : "Control the drive"}</h1>
      <p>{waiting ? "Keep this page open. Your controls appear as soon as the display responds." : ended && hasPair ? "Open the phone panel on the display and create a new QR." : "Music, visuals and effects, from the passenger seat."}</p></div>
      <img src={`/brand/phone-guide/${waiting ? "connect" : "scan"}.png`} width="128" height="160" alt=""/>
    </div>
    {!waiting ? <ol className="remote-guide-steps">
      <li><span aria-hidden="true">1</span><div><strong>Open the phone panel</strong><p>On the car display, tap the phone icon.</p></div></li>
      <li><span aria-hidden="true">2</span><div><strong>Scan the QR</strong><p>Use your phone camera, then open the link.</p></div></li>
      <li><span aria-hidden="true">3</span><div><strong>Make it your drive</strong><p>Choose music, visuals and effects. GPS stays on the car display.</p></div></li>
    </ol> : <p className="remote-pairing-note" role="status">Both devices need an Internet connection. No sensor permission is required.</p>}
    <details className="remote-guide-help"><summary>Connection help<SetupMark kind="chevron"/></summary><p>Keep both pages open. Brief network interruptions reconnect automatically for up to one hour.</p><p>If pairing expires, create a new QR on the display and scan it again. No app to install and no motion sensors to enable.</p></details>
  </section>;
}

function safePresentation() {
  const query = new URLSearchParams(window.location.search);
  return { palette: query.get("palette") || "red", appearance: query.get("appearance") === "light" ? "light" : "dark" };
}

function DrawerButton({ label, value, onClick, detail }) {
  return <button className="remote-drawer-row" type="button" onClick={onClick}><span>{label}</span><strong>{value}</strong>{detail ? <small>{detail}</small> : null}<span className="remote-chevron" aria-hidden="true">›</span></button>;
}

function Transport({ remoteState, onCommand }) {
  const track = remoteState.track;
  return <section className="remote-now-playing" aria-label="Now playing">
    <div className="remote-cover">{track?.artwork ? <img src={track.artwork} alt="" /> : <span aria-hidden="true">16</span>}</div>
    <div className="remote-track"><small>{remoteState.mode === "engine" ? "ENGINE" : remoteState.musicMode === "soundtrack" ? "SOUNDTRACK" : "PLAY THE ROAD"}</small><strong>{track?.title || "Ready to drive"}</strong><span>{track?.artist || "sedicivalvole"}</span></div>
    <div className="remote-transport" aria-label="Transport">
      <button type="button" onClick={() => onCommand("transport", { direction: "previous" })} aria-label="Previous"><MediaGlyph name="previous" /></button>
      <button type="button" className="remote-play" onClick={() => onCommand("transport", { direction: "toggle" })} aria-label={remoteState.playing ? "Pause" : "Play"}><MediaGlyph name={remoteState.playing ? "pause" : "play"} /></button>
      <button type="button" onClick={() => onCommand("transport", { direction: "next" })} aria-label="Next"><MediaGlyph name="next" /></button>
    </div>
  </section>;
}

export function MotionPhone() {
  const [remoteState, setRemoteState] = useState(EMPTY_STATE);
  const [snapshot, setSnapshot] = useState({ state: "idle", networkState: "offline" });
  const [pair, setPair] = useState(null);
  const [drawer, setDrawer] = useState(null);
  const [showGuide, setShowGuide] = useState(false);
  const drawerRef = useRef(null);
  const openerRef = useRef(null);
  const [notice, setNotice] = useState(null);
  const sessionRef = useRef(null);
  const swipeRef = useRef(null);
  const presentation = useMemo(safePresentation, []);
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
      onState: (next) => setRemoteState((current) => ({ ...current, ...next, manualEffects: { ...current.manualEffects, ...(next.manualEffects || {}) } })),
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
    if (!accepted) setNotice("Reconnecting… command will be available again shortly.");
  };
  useEffect(() => {
    if (!drawer) { openerRef.current?.focus?.(); return; }
    drawerRef.current?.querySelector("button")?.focus();
  }, [drawer]);

  useEffect(() => {
    if (snapshot.state !== "connected") setDrawer(null);
    if (snapshot.state === "connected" && snapshot.networkState === "online") setNotice(null);
  }, [snapshot.state, snapshot.networkState]);

  const open = (page) => {
    if (!drawer) openerRef.current = document.activeElement;
    setDrawer(page);
  };
  const close = () => setDrawer(null);
  const back = () => setDrawer((current) => current && current.includes("/") ? current.split("/").slice(0, -1).join("/") : null);
  const handleSwipeStart = (event) => {
    swipeRef.current = event.target instanceof Element && event.target.closest("input, select, textarea, [role='slider']")
      ? null : { x: event.clientX, y: event.clientY };
  };
  const handleSwipeEnd = (event) => {
    const start = swipeRef.current;
    swipeRef.current = null;
    if (!start || !drawer) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (Math.abs(dx) < 48 || Math.abs(dx) < Math.abs(dy)) return;
    if (dx > 0) back(); else close();
  };
  const handleDrawerKey = (event) => {
    if (event.key === "Escape") { event.preventDefault(); close(); }
    if (event.key !== "Tab") return;
    const controls = [...(drawerRef.current?.querySelectorAll("button:not([disabled]), input:not([disabled])") ?? [])];
    const first = controls[0], last = controls.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  };
  const forget = () => { sessionRef.current?.stop(); forgetSavedPair(); setPair(null); setRemoteState(EMPTY_STATE); setSnapshot({ state: "idle", networkState: "offline" }); close(); setShowGuide(false); };
  const connected = snapshot.state === "connected";
  const ready = connected && snapshot.networkState === "online";
  const palette = pair ? remoteState.themeId : presentation.palette;
  const appearance = remoteState.appearance === "light" || remoteState.appearance === "dark" ? remoteState.appearance : presentation.appearance;
  const colors = resolveSemanticTheme(getFluxTheme(palette), appearance);
  const guideVisible = !pair || !connected || showGuide;
  const activeEffectCount = Object.values(remoteState.manualEffects || {}).filter((value) => Number(value) > 0.01).length;
  const drawerTitle = drawer === "mode" ? "Mode" : drawer === "music" ? "Music" : drawer === "music/genre" ? "Genre" : drawer === "visual" ? "Visual" : drawer === "engine" ? "Engine sound" : drawer === "effects" ? "Effects" : drawer === "theme" ? "Palette" : "Remote";

  return <main className="remote-phone" style={colors.css} data-palette={palette} data-appearance={appearance} onPointerDown={handleSwipeStart} onPointerUp={handleSwipeEnd}>
    <div className="remote-phone-content" inert={drawer ? true : undefined}>
    <header className="remote-phone-header"><div className="remote-brand"><img src="/brand/pistons-v1/mark-512.png" width="48" height="48" alt=""/><span><span className="remote-wordmark">sedicivalvole</span><small>PASSENGER REMOTE</small></span></div></header>
    <div className="remote-connection-row"><div className="remote-link-status" data-connected={ready} role="status"><i aria-hidden="true"/><span>{statusText(snapshot)}</span></div>{connected ? <button type="button" onClick={() => setShowGuide(v => !v)}>{showGuide ? "BACK TO REMOTE" : "HELP"}</button> : null}</div>

    {guideVisible ? <PairingGuide state={snapshot.state} hasPair={Boolean(pair) && !showGuide}/> : <>
      <Transport remoteState={remoteState} onCommand={send} />
      <section className="remote-home-grid" aria-label="Remote controls">
        <button type="button" onClick={() => open("mode")}><span className="remote-control-icon">◐</span><small>MODE</small><strong>{remoteState.mode === "engine" ? "Engine" : "Flux"}</strong></button>
        <button type="button" onClick={() => open("music")}><span className="remote-control-icon">♫</span><small>MUSIC</small><strong>{remoteState.musicMode === "soundtrack" ? "Soundtrack" : labelFor(genres, remoteState.genreId, "Play the Road")}</strong></button>
        <button type="button" onClick={() => open("visual")}><span className="remote-control-icon">✦</span><small>VISUAL</small><strong>{labelFor(visualChoices, remoteState.environmentId, "Aperture")}</strong></button>
        <button type="button" onClick={() => open("effects")}><span className="remote-control-icon">⌁</span><small>EFFECTS</small><strong>{remoteState.vehicleEffectsEnabled ? `${activeEffectCount ? `${activeEffectCount} active` : "On"}` : "Off"}</strong></button>
      </section>
      <section className="remote-home-effects"><div><small>PLAY WITH THE SOUND</small><h2>Performance FX</h2></div><button type="button" aria-label="Vehicle effects" aria-pressed={remoteState.vehicleEffectsEnabled} className={remoteState.vehicleEffectsEnabled ? "is-active" : ""} onClick={() => send("vehicle-effects", { value: !remoteState.vehicleEffectsEnabled })}>{remoteState.vehicleEffectsEnabled ? "ON" : "OFF"}</button><div className="remote-effect-pills">{MANUAL_EFFECTS.slice(0, 4).map(([id, label]) => <button key={id} type="button" aria-pressed={Number(remoteState.manualEffects?.[id]) > 0.01} className={Number(remoteState.manualEffects?.[id]) > 0.01 ? "is-active" : ""} onClick={() => send("manual-effect", { effect: id, value: Number(remoteState.manualEffects?.[id]) > 0.01 ? 0 : 0.72 })}>{label}</button>)}</div></section>
      <section className="remote-secondary-links"><button type="button" onClick={() => open("engine")}><span>Engine character</span><strong>{labelFor(ENGINE_CATALOGUE, remoteState.engineProfileId, "Mono")}</strong>›</button><button type="button" onClick={() => open("theme")}><span>Palette</span><strong>{labelFor(FLUX_THEMES, remoteState.themeId, "Red 03")}</strong>›</button></section>
    </>}

    {notice ? <p className="remote-notice" role="status">{notice}</p> : null}
    <footer className="remote-phone-footer"><span>{ready ? "GPS stays on the car display" : connected ? "Pairing saved · reconnecting" : "No app to install · no sensor access"}</span>{pair ? <button type="button" onClick={forget}>FORGET THIS DISPLAY</button> : null}</footer>
    </div>

    {drawer ? <aside ref={drawerRef} className="remote-drawer" data-page={drawer} role="dialog" aria-modal="true" aria-label={`${drawerTitle} controls`} onKeyDown={handleDrawerKey}><header><button type="button" onClick={back} aria-label="Back">‹</button><div><small>REMOTE CONTROL</small><h2>{drawerTitle}</h2></div><button type="button" onClick={close} aria-label="Close"><SetupMark kind="close"/></button></header>

      {drawer === "mode" ? <div className="remote-drawer-list"><DrawerButton label="Flux" value={remoteState.mode === "flux" ? "Selected" : "Visual field"} onClick={() => { send("mode", { value: "flux" }); close(); }}/><DrawerButton label="Engine" value={remoteState.mode === "engine" ? "Selected" : "Engine sound"} onClick={() => { send("mode", { value: "engine" }); close(); }}/></div>
        : drawer === "music" ? <div className="remote-drawer-list"><DrawerButton label="Play the Road" value={remoteState.musicMode === "play-road" ? "Selected" : "Genres"} onClick={() => { send("music-mode", { value: "play-road" }); open("music/genre"); }}/><DrawerButton label="Soundtrack" value={remoteState.musicMode === "soundtrack" ? "Selected" : "Library"} onClick={() => { send("music-mode", { value: "soundtrack" }); close(); }}/></div>
          : drawer === "music/genre" ? <div className="remote-drawer-list">{genres.map((genre) => <DrawerButton key={genre.id} label={`${genre.displayLabel} ${genre.number}`} value={genre.family} onClick={() => { send("genre", { value: genre.id }); close(); }}/>)}</div>
            : drawer === "visual" ? <div className="remote-drawer-list">{visualChoices.map((choice) => <DrawerButton key={choice.id} label={`${choice.displayLabel} ${choice.number}`} value={choice.launchDescription} onClick={() => { send("visual", { value: choice.id }); close(); }}/>)}</div>
              : drawer === "engine" ? <div className="remote-drawer-list">{ENGINE_CATALOGUE.map((profile) => <DrawerButton key={profile.id} label={profile.label} value={profile.description} onClick={() => { send("engine-profile", { value: profile.id }); close(); }}/>)}</div>
                : drawer === "theme" ? <div className="remote-drawer-list remote-theme-list">{FLUX_THEMES.map((theme) => <DrawerButton key={theme.id} label={theme.label} value={remoteState.themeId === theme.id ? "Selected" : ""} detail={theme.id} onClick={() => { send("theme", { value: theme.id }); close(); }}/>)}</div>
                  : <div className="remote-drawer-effects"><button type="button" className={`remote-effects-master${remoteState.vehicleEffectsEnabled ? " is-active" : ""}`} aria-pressed={remoteState.vehicleEffectsEnabled} onClick={() => send("vehicle-effects", { value: !remoteState.vehicleEffectsEnabled })}><span>Vehicle effects</span><strong>{remoteState.vehicleEffectsEnabled ? "ON" : "OFF"}</strong></button>{MANUAL_EFFECTS.map(([id, label]) => <label key={id}><span>{label}</span><input type="range" min="0" max="1" step="0.01" value={Number(remoteState.manualEffects?.[id] || 0)} onChange={(event) => send("manual-effect", { effect: id, value: Number(event.target.value) })}/><output>{Math.round(Number(remoteState.manualEffects?.[id] || 0) * 100)}</output></label>)}</div>}
    </aside> : null}
  </main>;
}
