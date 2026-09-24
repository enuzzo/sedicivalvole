import { useState, useEffect } from "react";
import { FLUX_VISUAL_CHOICES, isShaderGradientEnvironmentId } from "../flux-environments.js";
import { VisualThumb, Led } from "../ui/night-instrument.jsx";
import { CURATED_EXPERIENCES } from "../curated-experiences.js";
import { ExperienceCard } from "../experience-card.jsx";
import { readyScoreGenres, SCORE_SOURCE, scoreSource } from "../score/genres.js";
import { MediaGlyph } from "../media-glyph.jsx";
import { SOUNDTRACK_GENRE_OPTIONS, SOUNDTRACK_PACE_OPTIONS } from "../soundtrack/library-model.js";
import { RecoveringArtwork } from "../recovering-artwork.jsx";
import { APP_BUILD } from "./build-info.js";
import { DialogSurface } from "./dialog-surface.jsx";
import { displayLabel } from "./footer-controls.jsx";

const ILLOBO_FEATURED_MARK_URLS = Object.freeze([
  `/brand/illobo-featured-solid.svg?build=${encodeURIComponent(APP_BUILD)}`,
  `/brand/illobo-featured-outline.svg?build=${encodeURIComponent(APP_BUILD)}`,
]);

export function VisualPicker({ environmentId, onChange, onOpenDiscover, onOpenStats, onSelectGradient, onClose, onExperience, experienceId }) {
  return (
    <DialogSurface
      className="diagnostic-drawer score-drawer environment-drawer"
      labelledBy="visual-picker-title"
      onClose={onClose}
    >
      <div className="drawer-heading">
        <div><small>MUSIC VISUAL LIBRARY</small><h2 id="visual-picker-title">Visual</h2></div>
        <button data-dialog-initial-focus type="button" onClick={onClose} aria-label="Close visual library">CLOSE</button>
      </div>
      <ul className="score-list visual-gallery">
        {FLUX_VISUAL_CHOICES.map((entry) => {
          const destination = entry.kind === "destination";
          const family = entry.kind === "family";
          const active = family
            ? isShaderGradientEnvironmentId(environmentId)
            : !destination && entry.id === environmentId;
          return (
            <li key={entry.id}>
              <button
                type="button"
                className={`score-entry${active ? " is-active" : ""}${destination ? " is-destination" : ""}`}
                aria-pressed={destination ? undefined : active}
                onClick={() => {
                  if (entry.id === "stats") onOpenStats();
                  else if (destination) onOpenDiscover();
                  else if (family) onSelectGradient();
                  else onChange(entry.id);
                  onClose();
                }}
              >
                <span className="visual-gallery-frame">
                  <VisualThumb id={family && active ? environmentId : entry.id} width={192} height={149} />
                  {destination ? <span className="visual-gallery-destination" aria-hidden="true">↗</span> : null}
                </span>
                <span className="score-entry-body">
                  <strong>{displayLabel(entry)}</strong>
                  <span>{entry.launchDescription}</span>
                </span>
                <span className="score-entry-state">
                  {active ? <><Led on />ACTIVE</> : null}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      <h3 className="visual-presets-heading">Presets</h3>
      <div className="experience-list">{CURATED_EXPERIENCES.map(({ id }) => <ExperienceCard key={id} id={id} selected={experienceId === id} onSelect={onExperience} />)}</div>
    </DialogSurface>
  );
}

/** The driving surface lists only scores that can play now. */
function ScoreLibraryContent({ genreId, onChange }) {
  const readyScores = readyScoreGenres();
  const displayScores = [
    ...readyScores.filter((genre) => genre.source === SCORE_SOURCE.sampled),
    ...readyScores.filter((genre) => genre.source === SCORE_SOURCE.generative),
  ];
  return (
    <div className="play-road-library">
      <section className="play-road-intro">
        <h3>THE ROAD BECOMES THE ARRANGEMENT</h3>
        <p>Speed builds the layers. Braking pulls them underwater. Stillness leaves room to breathe.</p>
      </section>
      <ul className="score-list">
        {displayScores.map((genre) => {
          const active = genre.id === genreId;
          return (
            <li key={genre.id} className={`score-list-item is-${genre.source}`}>
              <button
                type="button"
                className={`score-entry${active ? " is-active" : ""}`}
                aria-pressed={active}
                onClick={() => onChange(genre.id)}
              >
                <img className="score-entry-cover" src={genre.coverUrl} alt="" width="72" height="72" />
                <span className="score-entry-body">
                  <strong>
                    <span className="score-entry-title">{displayLabel(genre)} <b>{genre.number}</b></span>
                    <em className={`score-source is-${genre.source}`}>
                      <span aria-hidden="true">{scoreSource(genre.id).mark}</span>
                      {genre.source === SCORE_SOURCE.generative ? "Responsive generative" : scoreSource(genre.id).label}
                    </em>
                  </strong>
                  <span className="score-entry-family">{genre.family}</span>
                  <span className="score-entry-description">{genre.description}</span>
                </span>
                <span className="score-entry-state">
                  <MediaGlyph name={active ? "pause" : "play"} />
                  <span className="visually-hidden">{active ? "Playing" : "Play"}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      <p className="privacy-note">Play the Road contains complete adaptive scores. Vehicle motion arranges their authored material.</p>
    </div>
  );
}

function SoundtrackLibraryContent({
  snapshot,
  retrying = false,
  jamendoPreviewEntries,
  onFeatured,
  onBrowseSelection,
  onTrack,
  onPrevious,
  onPlayPause,
  onNext,
}) {
  const current = snapshot?.current;
  const [trackQrUrl, setTrackQrUrl] = useState("");
  const playing = snapshot?.status === "playing";
  const loading = snapshot?.status === "loading";
  const library = snapshot?.library;
  const entries = library?.entries ?? [];
  const selected = library?.selection;
  const featuredSelected = selected?.kind === "featured";
  const genreRows = [
    SOUNDTRACK_GENRE_OPTIONS.slice(0, 5),
    SOUNDTRACK_GENRE_OPTIONS.slice(5, 10),
    SOUNDTRACK_GENRE_OPTIONS.slice(10, 15),
  ];
  const jamendoCoverEntries = featuredSelected ? jamendoPreviewEntries : entries;
  const attributionItems = snapshot?.attribution
    ? [snapshot.attribution.primary, ...(snapshot.attribution.secondary ?? [])].filter(Boolean)
    : [];
  useEffect(() => {
    let active = true;
    setTrackQrUrl("");
    if (!current?.shareUrl) return () => { active = false; };
    import("qrcode").then(({ default: QRCode }) => QRCode.toDataURL(current.shareUrl, {
      width: 160,
      margin: 1,
      color: { dark: "#070909", light: "#EEEAE0" },
      errorCorrectionLevel: "M",
    })).then((dataUrl) => {
      if (active) setTrackQrUrl(dataUrl);
    }).catch(() => {
      if (active) setTrackQrUrl("");
    });
    return () => { active = false; };
  }, [current?.key, current?.shareUrl]);
  return (
    <div className="soundtrack-panel-body">
      <div className="soundtrack-choice-heading">
        <span>SOURCE</span>
      </div>
      <div className="soundtrack-choice-grid">
        <button type="button" className={`soundtrack-choice-card${selected?.kind === "featured" ? " is-selected" : ""}`} aria-pressed={selected?.kind === "featured"} onClick={onFeatured}>
          <span className="illobo-featured-cover" role="img" aria-label="Illobo Featured">
            {ILLOBO_FEATURED_MARK_URLS.map((source, index) => (
              <img key={source} src={source} alt="" aria-hidden="true" width="64" height="64" data-illobo-variant={index + 1} />
            ))}
          </span>
          <span className="soundtrack-choice-copy">
            <small className="is-featured-artist">FEATURED ARTIST</small>
            <strong>Lobo Playlist</strong>
            <span>Original music written and performed by Illobo.</span>
          </span>
          <span className="soundtrack-choice-action"><MediaGlyph name="play" /><span className="visually-hidden">Play Lobo Playlist</span></span>
        </button>
        <button type="button" className={`soundtrack-choice-card is-library${selected?.kind !== "featured" ? " is-selected" : ""}`} aria-pressed={selected?.kind !== "featured"} onClick={() => onBrowseSelection({ kind: "library", id: "all" })}>
          <span className="soundtrack-cover-stack" aria-hidden="true">
            {jamendoCoverEntries.filter((entry) => entry.imageUrl).slice(0, 3).map((entry) => (
              <img key={entry.key} src={entry.imageUrl} alt="" width="64" height="64" />
            ))}
            {!jamendoCoverEntries.some((entry) => entry.imageUrl) ? <span className="soundtrack-cover-placeholder">JM</span> : null}
          </span>
          <span className="soundtrack-choice-copy">
            <small>JAMENDO LIBRARY</small>
            <strong>Choose your route</strong>
            <span>Start by pace, genre, or an individual track.</span>
          </span>
          <span className="soundtrack-choice-action"><MediaGlyph name="play" /><span className="visually-hidden">Open Jamendo library</span></span>
        </button>
      </div>

      <section className="jamendo-library" aria-labelledby="soundtrack-library-title">
        <div className={`music-library-section-heading${featuredSelected ? "" : " is-jamendo-browser"}`}>
          {featuredSelected ? <div><small>FEATURED ARTIST · ILLOBO</small><h3 id="soundtrack-library-title">Lobo Playlist</h3></div> : <h3 id="soundtrack-library-title" className="visually-hidden">Jamendo soundtrack browser</h3>}
          <div className="soundtrack-library-status">
            {featuredSelected ? <span>ORIGINAL RECORDINGS · 1×</span> : null}
            <strong>{library?.refreshCopy ?? "Fresh mix · changes every 30 min"}</strong>
          </div>
        </div>
        {!featuredSelected ? <div className="soundtrack-filter-layout">
          <div className="soundtrack-filter-group soundtrack-pace-rail">
            <span>PACE</span>
            <div className="soundtrack-filter-row">
            {SOUNDTRACK_PACE_OPTIONS.map((pace) => (
              <button
                key={pace.id}
                type="button"
                className={selected?.kind === "pace" && selected.id === pace.id ? "is-selected" : ""}
                aria-pressed={selected?.kind === "pace" && selected.id === pace.id}
                disabled={loading}
                onClick={() => onBrowseSelection({ kind: "pace", id: pace.id })}
              >
                <strong>{pace.label}</strong>
                {selected?.kind === "pace" && selected.id === pace.id ? <Led on /> : null}
              </button>
            ))}
            </div>
          </div>
          <div className="soundtrack-filter-group soundtrack-genre-board">
            <span>GENRE</span>
            <div className="soundtrack-filter-rows is-genres">
              {genreRows.map((row, rowIndex) => (
                <div key={rowIndex} className="soundtrack-filter-row" style={{ "--filter-columns": row.length }}>
                  {row.map((genre) => (
                    <button
                      key={genre.id}
                      type="button"
                      className={selected?.kind === "genre" && selected.id === genre.id ? "is-selected" : ""}
                      aria-pressed={selected?.kind === "genre" && selected.id === genre.id}
                      disabled={loading}
                      onClick={() => onBrowseSelection({ kind: "genre", id: genre.id })}
                    >
                      <strong>{genre.label}</strong>
                      {selected?.kind === "genre" && selected.id === genre.id ? <Led on /> : null}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div> : null}
        <div className="soundtrack-track-list" aria-live="polite">
          {entries.slice(0, 6).map((entry) => (
            <button key={entry.key} type="button" className={entry.key === current?.key ? "is-current" : ""} onClick={() => onTrack(entry.key)}>
              <RecoveringArtwork src={entry.imageUrl} width={48} height={48} />
              <span><strong>{entry.title}</strong><small>{entry.artistName}</small></span>
              <em>
                <MediaGlyph name={entry.key === current?.key && playing ? "pause" : "play"} />
                <span className="visually-hidden">{entry.key === current?.key && playing ? "Playing" : "Play"}</span>
              </em>
            </button>
          ))}
          {!entries.length ? <p>{loading ? `Loading ${featuredSelected ? "Illobo" : "a fresh Jamendo mix"}…` : snapshot?.status === "error" ? "Music unavailable. Choose a playlist or genre to retry." : "No eligible tracks in this selection."}</p> : null}
        </div>
      </section>

      <div className="soundtrack-playback-grid">
        <section className={`soundtrack-now-playing${snapshot?.attribution?.transitioning ? " is-transitioning" : ""}`} aria-live="polite">
          <RecoveringArtwork src={current?.imageUrl} width={80} height={80} fallback={featuredSelected ? "LO" : "JM"} />
          <div>
            <small className={`soundtrack-now-label${playing ? " is-playing" : ""}`}><MediaGlyph name="levels" />{snapshot?.status === "error" ? (retrying ? "RETRYING" : "LOAD FAILED") : snapshot?.status === "prepared" ? "READY" : ["loading", "buffering"].includes(snapshot?.status) ? "LOADING" : playing ? "NOW PLAYING" : "PAUSED"}</small>
            <strong>{current?.title ?? (snapshot?.status === "error" ? "Music unavailable" : `Preparing ${featuredSelected ? "Illobo playlist" : "Jamendo catalog"}`)}</strong>
            <span>{current?.artistName ?? (snapshot?.status === "error" ? "Choose a playlist or genre to retry" : "Loading library")}</span>
            {snapshot?.attribution?.transitioning ? <span className="soundtrack-transition-status">Crossfading</span> : null}
          </div>
          <div className="soundtrack-transport" aria-label="Soundtrack transport">
            <button type="button" disabled={!snapshot?.hasPrevious} onClick={onPrevious} aria-label="Previous track"><MediaGlyph name="previous" /></button>
            <button type="button" disabled={!current} onClick={onPlayPause} aria-label={playing ? "Pause" : "Play"}><MediaGlyph name={playing ? "pause" : "play"} /></button>
            <button type="button" disabled={!snapshot?.hasNext} onClick={onNext} aria-label="Next track"><MediaGlyph name="next" /></button>
          </div>
        </section>

        {current ? <section className="soundtrack-credit-card" aria-label="Current Soundtrack credits and handoff">
          <div className="soundtrack-credit-copy">
            <small>{snapshot?.attribution?.transitioning ? "AUDIBLE CREDITS" : "TRACK CREDIT"}</small>
            {attributionItems.length ? attributionItems.map((item) => (
              <div key={item.key} className={item.isTarget ? "is-target" : ""}>
                <span>{item.isTarget ? "Current" : "Fading"}</span>
                <strong>{item.credit.title} — {item.credit.artistName}</strong>
                <a href={item.credit.directContentUrl} target="_blank" rel="noreferrer">{item.credit.providerCredit} ↗</a>
                {item.credit.licence.url ? <a href={item.credit.licence.url} target="_blank" rel="noreferrer">{item.credit.licence.label} ↗</a> : <span>{item.credit.licence.label}</span>}
              </div>
            )) : (
              <div className="is-target">
                <span>Current</span>
                <strong>{current.title} — {current.artistName}</strong>
                <a href={current.shareUrl} target="_blank" rel="noreferrer">{current.providerCredit} ↗</a>
                {current.licenceUrl ? <a href={current.licenceUrl} target="_blank" rel="noreferrer">{current.licenceLabel} ↗</a> : <span>{current.licenceLabel}</span>}
              </div>
            )}
          </div>
          <a className="soundtrack-qr-handoff" href={current.shareUrl} target="_blank" rel="noreferrer" aria-label={`Open ${current.title} by ${current.artistName}`}>
            {trackQrUrl ? <img src={trackQrUrl} alt={`QR code for ${current.title} by ${current.artistName}`} width="72" height="72" /> : <span>QR</span>}
            <small>OPEN TRACK</small>
          </a>
        </section> : null}
      </div>

      <p className="privacy-note">Three browser-owned media elements keep previous, current, and next ready. Playback streams from the selected source; no offline copy is retained.</p>
    </div>
  );
}

export function MusicLibraryPanel({
  retrying = false,
  musicMode,
  loadingMode,
  genreId,
  snapshot,
  jamendoPreviewEntries,
  onModeChange,
  onScoreChange,
  onFeatured,
  onBrowseSelection,
  onTrack,
  onPrevious,
  onPlayPause,
  onNext,
  onClose,
}) {
  return (
    <DialogSurface className="diagnostic-drawer soundtrack-drawer" labelledBy="music-library-title" onClose={onClose}>
      <div className="drawer-heading music-library-heading">
        <div><small>MUSIC LIBRARY</small><h2 id="music-library-title">Music</h2></div>
        <button data-dialog-initial-focus type="button" onClick={onClose}>CLOSE</button>
      </div>
      <div className="music-drawer-workspace">
        <nav className="music-source-switch" aria-label="Music source">
          <button type="button" className={musicMode === "play-road" ? "is-active" : ""} aria-pressed={musicMode === "play-road"} onClick={() => onModeChange("play-road")}><strong>PLAY THE ROAD</strong></button>
          <button type="button" className={musicMode === "soundtrack" ? "is-active" : ""} aria-pressed={musicMode === "soundtrack"} onClick={() => onModeChange("soundtrack")}><strong>SOUNDTRACK</strong></button>
        </nav>
        <main className="music-drawer-content">
          {loadingMode === musicMode ? (
            <p className="music-mode-loading" role="status" aria-live="polite">
              <span aria-hidden="true" />
              Loading {musicMode === "soundtrack" ? "Soundtrack" : "Play the Road"}…
            </p>
          ) : null}
          {musicMode === "soundtrack" ? (
            <SoundtrackLibraryContent
              snapshot={snapshot}
              retrying={retrying}
              jamendoPreviewEntries={jamendoPreviewEntries}
              onFeatured={onFeatured}
              onBrowseSelection={onBrowseSelection}
              onTrack={onTrack}
              onPrevious={onPrevious}
              onPlayPause={onPlayPause}
              onNext={onNext}
            />
          ) : <ScoreLibraryContent genreId={genreId} onChange={onScoreChange} />}
        </main>
      </div>
    </DialogSurface>
  );
}
