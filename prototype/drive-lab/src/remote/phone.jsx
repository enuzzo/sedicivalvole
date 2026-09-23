import { useEffect, useMemo, useRef, useState } from "react";
import { ENGINE_CATALOGUE } from "../engine/catalogue.js";
import { FLUX_THEMES } from "../flux-themes.js";
import { FLUX_VISUAL_CHOICES } from "../flux-environments.js";
import { readyScoreGenres } from "../score/genres.js";
import { MediaGlyph } from "../media-glyph.jsx";
import { REMOTE_PAIRING_STORAGE_KEY, createRemoteSession, parseRemotePair } from "./session.js";
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
  if (snapshot.state === "connected") return snapshot.networkState === "online" ? "Connected" : "Reconnecting…";
  if (snapshot.state === "connecting") return "Connecting…";
  if (snapshot.state === "preparing") return "Preparing…";
  if (snapshot.state === "expired") return "Pairing expired";
  return "Scan the car QR";
}

function safePresentation() {
  const query = new URLSearchParams(window.location.search);
  return { palette: query.get("palette") || "red", appearance: query.get("appearance") || "dark" };
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
  const [notice, setNotice] = useState(null);
  const sessionRef = useRef(null);
  const swipeRef = useRef(null);
  const presentation = useMemo(safePresentation, []);
  const visualChoices = useMemo(() => FLUX_VISUAL_CHOICES.filter((choice) => choice.kind !== "destination" || ["discover", "stats"].includes(choice.id)), []);
  const genres = useMemo(() => readyScoreGenres(), []);

  useEffect(() => {
    const fromHash = parseRemotePair(window.location.hash.slice(1));
    const saved = fromHash || readSavedPair();
    if (saved) setPair(saved);
    const session = createRemoteSession({
      role: "phone",
      getPresentation: () => presentation,
      onChange: (next) => {
        setSnapshot(next);
        if (next.credentials) {
          const savedPair = { ...saved, ...next.credentials, key: saved?.key, paired: true, expiresAt: next.credentials.expiresAt || Date.now() + 3600000 };
          if (savedPair.key) { setPair(savedPair); writeSavedPair(savedPair); }
        }
      },
      onState: (next) => setRemoteState((current) => ({ ...current, ...next, manualEffects: { ...current.manualEffects, ...(next.manualEffects || {}) } })),
      onEvent: (type) => {
        if (type === "error") setNotice("The link will retry while this pairing is valid.");
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
  const open = (page) => setDrawer(page);
  const close = () => setDrawer(null);
  const back = () => setDrawer((current) => current && current.includes("/") ? current.split("/").slice(0, -1).join("/") : null);
  const handleSwipeStart = (event) => { swipeRef.current = { x: event.clientX, y: event.clientY }; };
  const handleSwipeEnd = (event) => {
    const start = swipeRef.current;
    swipeRef.current = null;
    if (!start || !drawer) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (Math.abs(dx) < 48 || Math.abs(dx) < Math.abs(dy)) return;
    if (dx > 0) back(); else close();
  };
  const connected = snapshot.state === "connected";
  const activeEffectCount = Object.values(remoteState.manualEffects || {}).filter((value) => Number(value) > 0.01).length;
  const drawerTitle = drawer === "mode" ? "Mode" : drawer === "music" ? "Music" : drawer === "music/genre" ? "Genre" : drawer === "visual" ? "Visual" : drawer === "engine" ? "Engine sound" : drawer === "effects" ? "Effects" : drawer === "theme" ? "Palette" : "Remote";

  return <main className="remote-phone" data-palette={presentation.palette} data-appearance={presentation.appearance} onPointerDown={handleSwipeStart} onPointerUp={handleSwipeEnd}>
    <header className="remote-phone-header"><div className="remote-brand"><img src={`/brand/pistons-v1/mark-512.png?build=${encodeURIComponent(window.__APP_BUILD__ || "dev")}`} alt=""/><span>sedicivalvole<small>PASSENGER REMOTE</small></span></div><div className="remote-link-status" data-connected={connected}><i aria-hidden="true"/><span>{statusText(snapshot)}</span></div></header>

    {!pair ? <section className="remote-pairing-empty"><div className="remote-pairing-mark" aria-hidden="true">⌁</div><h1>Pair once.<br/>Control the drive.</h1><p>Scan the QR shown on Sedici Valvole. This companion uses the encrypted control link only; it never asks for motion sensors.</p><ol><li>Open <b>Connect a phone</b> on the car display.</li><li>Scan the QR with this iPhone.</li><li>Keep this page open as the remote.</li></ol><p className="remote-pairing-note">If the link is interrupted, the pairing is retained and retried automatically.</p></section> : <>
      <Transport remoteState={remoteState} onCommand={send} />
      <section className="remote-home-grid" aria-label="Remote controls">
        <button type="button" onClick={() => open("mode")}><span className="remote-control-icon">◐</span><small>MODE</small><strong>{remoteState.mode === "engine" ? "Engine" : "Flux"}</strong></button>
        <button type="button" onClick={() => open("music")}><span className="remote-control-icon">♫</span><small>MUSIC</small><strong>{remoteState.musicMode === "soundtrack" ? "Soundtrack" : labelFor(genres, remoteState.genreId, "Play the Road")}</strong></button>
        <button type="button" onClick={() => open("visual")}><span className="remote-control-icon">✦</span><small>VISUAL</small><strong>{labelFor(visualChoices, remoteState.environmentId, "Aperture")}</strong></button>
        <button type="button" onClick={() => open("effects")}><span className="remote-control-icon">⌁</span><small>EFFECTS</small><strong>{remoteState.vehicleEffectsEnabled ? `${activeEffectCount ? `${activeEffectCount} active` : "On"}` : "Off"}</strong></button>
      </section>
      <section className="remote-home-effects"><div><small>PLAY WITH THE SOUND</small><h2>Performance FX</h2></div><button type="button" className={remoteState.vehicleEffectsEnabled ? "is-active" : ""} onClick={() => send("vehicle-effects", { value: !remoteState.vehicleEffectsEnabled })}>{remoteState.vehicleEffectsEnabled ? "ON" : "OFF"}</button><div className="remote-effect-pills">{MANUAL_EFFECTS.slice(0, 4).map(([id, label]) => <button key={id} type="button" className={Number(remoteState.manualEffects?.[id]) > 0.01 ? "is-active" : ""} onClick={() => send("manual-effect", { effect: id, value: Number(remoteState.manualEffects?.[id]) > 0.01 ? 0 : 0.72 })}>{label}</button>)}</div></section>
      <section className="remote-secondary-links"><button type="button" onClick={() => open("engine")}><span>Engine character</span><strong>{labelFor(ENGINE_CATALOGUE, remoteState.engineProfileId, "Mono")}</strong>›</button><button type="button" onClick={() => open("theme")}><span>Palette</span><strong>{labelFor(FLUX_THEMES, remoteState.themeId, "Red 03")}</strong>›</button></section>
    </>}

    {notice ? <p className="remote-notice" role="status">{notice}</p> : null}
    <footer className="remote-phone-footer"><span>{connected ? "The display is ready" : "Pairing stays private to this device"}</span>{pair ? <button type="button" onClick={() => { sessionRef.current?.stop(); forgetSavedPair(); setPair(null); setRemoteState(EMPTY_STATE); setSnapshot({ state: "idle", networkState: "offline" }); close(); }}>FORGET THIS DISPLAY</button> : null}</footer>

    {drawer ? <aside className="remote-drawer" data-page={drawer} aria-label={`${drawerTitle} controls`}><header><button type="button" onClick={back} aria-label="Back">‹</button><div><small>REMOTE CONTROL</small><h2>{drawerTitle}</h2></div><button type="button" onClick={close} aria-label="Close">×</button></header>
      {drawer === "mode" ? <div className="remote-drawer-list"><DrawerButton label="Flux" value={remoteState.mode === "flux" ? "Selected" : "Visual field"} onClick={() => { send("mode", { value: "flux" }); close(); }}/><DrawerButton label="Engine" value={remoteState.mode === "engine" ? "Selected" : "Engine sound"} onClick={() => { send("mode", { value: "engine" }); close(); }}/></div>
        : drawer === "music" ? <div className="remote-drawer-list"><DrawerButton label="Play the Road" value={remoteState.musicMode === "play-road" ? "Selected" : "Genres"} onClick={() => { send("music-mode", { value: "play-road" }); open("music/genre"); }}/><DrawerButton label="Soundtrack" value={remoteState.musicMode === "soundtrack" ? "Selected" : "Library"} onClick={() => { send("music-mode", { value: "soundtrack" }); close(); }}/></div>
          : drawer === "music/genre" ? <div className="remote-drawer-list">{genres.map((genre) => <DrawerButton key={genre.id} label={`${genre.displayLabel} ${genre.number}`} value={genre.family} onClick={() => { send("genre", { value: genre.id }); close(); }}/>)}</div>
            : drawer === "visual" ? <div className="remote-drawer-list">{visualChoices.map((choice) => <DrawerButton key={choice.id} label={`${choice.displayLabel} ${choice.number}`} value={choice.launchDescription} onClick={() => { send("visual", { value: choice.id }); close(); }}/>)}</div>
              : drawer === "engine" ? <div className="remote-drawer-list">{ENGINE_CATALOGUE.map((profile) => <DrawerButton key={profile.id} label={profile.label} value={profile.description} onClick={() => { send("engine-profile", { value: profile.id }); close(); }}/>)}</div>
                : drawer === "theme" ? <div className="remote-drawer-list remote-theme-list">{FLUX_THEMES.map((theme) => <DrawerButton key={theme.id} label={theme.label} value={remoteState.themeId === theme.id ? "Selected" : ""} detail={theme.id} onClick={() => { send("theme", { value: theme.id }); close(); }}/>)}</div>
                  : <div className="remote-drawer-effects"><button type="button" className={`remote-effects-master${remoteState.vehicleEffectsEnabled ? " is-active" : ""}`} onClick={() => send("vehicle-effects", { value: !remoteState.vehicleEffectsEnabled })}><span>Vehicle effects</span><strong>{remoteState.vehicleEffectsEnabled ? "ON" : "OFF"}</strong></button>{MANUAL_EFFECTS.map(([id, label]) => <label key={id}><span>{label}</span><input type="range" min="0" max="1" step="0.01" value={Number(remoteState.manualEffects?.[id] || 0)} onChange={(event) => send("manual-effect", { effect: id, value: Number(event.target.value) })}/><output>{Math.round(Number(remoteState.manualEffects?.[id] || 0) * 100)}</output></label>)}</div>}
    </aside> : null}
  </main>;
}
