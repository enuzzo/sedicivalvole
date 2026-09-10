import { SupportButton } from "./support-button.jsx";
import { ENGINE_CATALOGUE } from "./engine/catalogue.js";
import { useState } from 'react';
import { SOUNDTRACK_GENRE_OPTIONS, SOUNDTRACK_PACE_OPTIONS } from './soundtrack/library-model.js';
import { FLUX_VISUAL_CHOICES, SHADERGRADIENT_ENVIRONMENTS, getFluxEnvironment, isShaderGradientEnvironmentId } from './flux-environments.js';
import { readyScoreGenres, getScoreGenre } from './score/genres.js';
import { CURATED_EXPERIENCES, chooseCuratedRecommendations } from './curated-experiences.js';
import './launch-cockpit.css';

const SOURCES = [
  ['soundtrack', 'Soundtrack'], ['play-road', 'Play the Road'], ['mute', 'Mute'],
];
const ENGINES = ENGINE_CATALOGUE.map(({ id, label, description }) => [id, label, description]);
const label = value => value.displayLabel || value.label;
const MUSIC_ARTWORK = '/assets/launch/soundtrack.png';
function Thumbnail({ src, fallback = MUSIC_ARTWORK }) {
  return <img key={src} className="cockpit-thumb" src={src || fallback} alt="" width="64" height="64" decoding="async" style={{ backgroundImage: `url("${fallback}")`, backgroundSize: 'cover' }} onLoad={event => { event.currentTarget.style.backgroundImage = 'none'; }} onError={event => { if (event.currentTarget.getAttribute('src') !== fallback) event.currentTarget.src = fallback; }} />;
}
// Original outline action glyphs, sharing the existing compact control weight.
function ActionIcon({name}) {
  const paths={music:<><path d="M9 18V5l11-2v13M9 9l11-2"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/></>,
    visual:<><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
    dice:<><rect x="3" y="3" width="18" height="18" rx="3"/>{[[7,7],[17,7],[12,12],[7,17],[17,17]].map(([cx,cy])=><circle key={`${cx}-${cy}`} cx={cx} cy={cy} r=".8" fill="currentColor" stroke="none"/>)}</>,
    palette:<><path d="M12 3a9 9 0 1 0 0 18h1a2 2 0 0 0 1.4-3.4 1.8 1.8 0 0 1 1.3-3.1H18a3 3 0 0 0 3-3C21 6.8 17 3 12 3Z"/>{[[7,10],[10,7],[15,7]].map(([cx,cy])=><circle key={cx} cx={cx} cy={cy} r="1"/>)}</>};
  return <svg className="cockpit-action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}
const ModeIcon = ({ name }) => <span className={`cockpit-mode-icon is-${name}`} aria-hidden="true" />;

export function LaunchCockpit({ mode, onMode, musicId, onMusic, selection, lucky, onSelection, onLucky,
  environmentId, onVisual, onRandomVisual, soundtrackArtworkUrl, soundtrackTrack, theme, onPalette, scoreId, onScore, engineProfileId, onEngineProfile, experienceId, onExperience,
  markUrl, build, onStart, ready, pending, muted, onUnmute, onSupport, onReset, Dialog }) {
  const [picker, setPicker] = useState(null);
  const [recommendations, setRecommendations] = useState(() => chooseCuratedRecommendations({selectedId:experienceId}));
  const presets = experienceId && !recommendations.some(item => item.id === experienceId) ? [CURATED_EXPERIENCES.find(item => item.id === experienceId), recommendations[1]].filter(Boolean) : recommendations;
  const [mixTab, setMixTab] = useState(selection.kind === 'pace' ? 'pace' : 'genre');
  const engine = mode === 'engine';
  const visual = getFluxEnvironment(environmentId);
  const visualLabel = FLUX_VISUAL_CHOICES.find(item => item.id === environmentId)?.displayLabel || label(visual);
  const profile = ENGINES.find(item => item[0] === engineProfileId) || ENGINES[0];
  const selectionLabel = selection.kind === 'featured' ? 'Lobo Playlist' : selection.kind === 'library' ? 'All genres' : selection.label;
  const score = getScoreGenre(scoreId);
  const mixLabel = musicId === 'soundtrack' ? selectionLabel : musicId === 'mute' ? 'No music' : label(score);
  const close = () => setPicker(null);
  const choose = action => { action(); close(); };
  const button = (id, name, active, action, detail = null) => <button type="button" key={id} aria-pressed={active} onClick={action}><strong>{name}</strong>{detail ? <small>{detail}</small> : null}</button>;
  const startLabel = engine ? 'START ENGINE' : musicId === 'mute' ? 'START VISUALS' : 'START MUSIC';
  return <>
    <section className="launch-cockpit" aria-label="Choose your drive" inert={picker ? true : undefined}>
      <header className="cockpit-heading">
        <img src={markUrl} alt="" aria-hidden="true" />
        <div className="cockpit-wordmark"><h1>sedicivalvole</h1><small>Drive responsibly</small></div><small className="cockpit-build">{build}</small>
        <button type="button" onClick={() => setPicker('about')} aria-haspopup="dialog">About</button>
        <SupportButton onClick={onSupport} />
      </header>
      <nav className="cockpit-modes" aria-label="Experience mode">
        {button('music', <><ModeIcon name="music" />Music</>, !engine, () => onMode('flux'))}
        {button('engine', <><ModeIcon name="engine" />Engine</>, engine, () => onMode('engine'))}
      </nav>
      {engine ? <div className="cockpit-engine-body">
        <p className="cockpit-engine-intro">Sound that follows your drive.</p>
        <div className="cockpit-engine-profiles" role="group" aria-label="Engine profile">
          {ENGINES.map(([id, name, detail]) => button(id, name, engineProfileId === id, () => onEngineProfile(id), detail))}
        </div>
        <div className="cockpit-engine-note"><span>{engineProfileId === 'turbine' ? 'Continuous shaft' : 'Automatic gears'}</span><span>Stationary revs</span><span>Pure engine sound</span></div>
      </div> : <div className="cockpit-music-body">
        <nav className="cockpit-sources" aria-label="Music source">{SOURCES.map(([id, name]) => button(id, name, musicId === id, () => onMusic(id)))}</nav>
        <div className="cockpit-choices">
          <div className="cockpit-selection">
            <div className="cockpit-selection-heading">
              <Thumbnail src={musicId === 'play-road' ? score.coverUrl : musicId === 'soundtrack' ? soundtrackArtworkUrl || (selection.kind === 'featured' ? '/brand/illobo-featured-solid.svg' : MUSIC_ARTWORK) : '/third-party/tabler-icons/palette.svg'} />
              <div className="cockpit-value"><div className="cockpit-metadata-row"><small>{musicId === 'soundtrack' ? (selectionLabel.toLowerCase() === 'soundtrack' ? 'SOUNDTRACK' : `SOUNDTRACK · ${selectionLabel}`) : musicId === 'mute' ? 'JUST THE VIEW' : 'ADAPTIVE SCORE'}</small></div><strong title={musicId === 'soundtrack' ? soundtrackTrack?.title : mixLabel}>{musicId === 'soundtrack' ? soundtrackTrack?.title || 'Finding a track…' : mixLabel}</strong></div>
            </div>
            <div className="cockpit-choice-actions">
              {musicId !== 'mute' ? <button type="button" className="cockpit-text-action" aria-label={musicId === 'soundtrack' ? 'Choose soundtrack' : 'Choose adaptive score'} aria-haspopup="dialog" onClick={() => { setMixTab(selection.kind === 'pace' ? 'pace' : 'genre'); setPicker(musicId === 'soundtrack' ? 'mix' : 'score'); }}><ActionIcon name="music"/>Choose</button> : null}
              {musicId === 'soundtrack' ? <button type="button" className="cockpit-random" aria-label="Random soundtrack" onClick={onLucky}><ActionIcon name="dice"/>Random</button> : null}
              {musicId === 'mute' ? <span className="cockpit-explanation">Visuals follow your drive.</span> : null}
            </div>
          </div>
          <div className="cockpit-selection cockpit-visual">
            <div className="cockpit-selection-heading">
              <Thumbnail src={`/artwork/visuals/${environmentId}.png`} fallback="/third-party/tabler-icons/palette.svg" />
              <div className="cockpit-value"><small>VISUAL</small><strong>{visualLabel}</strong></div>
            </div>
            <div className="cockpit-choice-actions">
              <button type="button" className="cockpit-text-action" aria-label="Choose visual" aria-haspopup="dialog" onClick={() => setPicker('visual')}><ActionIcon name="visual"/>Choose</button>
              <button type="button" className="cockpit-random" aria-label="Random visual" onClick={onRandomVisual}><ActionIcon name="dice"/>Random</button>
            </div>
          </div>
        </div>
        <div className="cockpit-presets">
          <div className="cockpit-presets-group"><small>PRESETS</small><div className="cockpit-preset-options">{presets.map(item => <button type="button" key={item.id} title={item.title} aria-pressed={experienceId === item.id} onClick={() => onExperience(item.id)}><img className="cockpit-preset-thumb" src={item.image} alt=""/><span><strong>{item.title}</strong><small>{SOUNDTRACK_GENRE_OPTIONS.find(genre => genre.id === item.settings.soundtrackSelection.id)?.label}</small></span></button>)}</div><button type="button" className="cockpit-preset-random" aria-label="Random presets" title="Random presets" onClick={() => setRecommendations(chooseCuratedRecommendations({selectedId:experienceId, excludeIds:presets.map(item=>item.id)}))}><ActionIcon name="dice"/></button></div>
          <div className="cockpit-palette-group"><small>PALETTE</small><button type="button" className="cockpit-palette" aria-label="Next palette" title={`Palette: ${theme.label}`} onClick={onPalette}><i className="cockpit-palette-thumb" style={{background:theme.swatch}} aria-hidden="true"/><strong>{theme.label}</strong></button></div>
        </div>
      </div>}
      <div className="cockpit-start-row">
        {muted && (engine || musicId !== 'mute') ? <button className="cockpit-unmute" type="button" onClick={onUnmute}>UNMUTE</button> : null}
        <button className="cockpit-start" type="button" aria-label={startLabel} disabled={!ready} onClick={onStart}>
          <strong>{startLabel}</strong><span>{muted && (engine || musicId !== 'mute') ? 'Audio muted' : pending && !engine && musicId === 'soundtrack' ? 'Music joins when ready' : engine ? `${profile[1]} · ${engineProfileId === 'turbine' ? 'continuous' : 'automatic'}` : `${mixLabel} · ${visualLabel}`}</span>
        </button>
      </div>
    </section>
    <footer className="cockpit-footer" inert={picker ? true : undefined}>
      <span>by <a href="https://github.com/enuzzo" target="_blank" rel="noreferrer">enuzzo</a> · with <a href="https://github.com/illobo" target="_blank" rel="noreferrer">Illobo</a></span>
    </footer>
    {picker ? <Dialog className="cockpit-dialog" labelledBy="cockpit-picker-title" onClose={close} panelClass="cockpit-picker" backdropClass="cockpit-backdrop">
      <header><h2 id="cockpit-picker-title">{({ mix: 'Choose your soundtrack', score: 'Choose your score', visual: 'Choose your visual', gradient: 'Gradient variants', about: 'About sedicivalvole' })[picker]}</h2><button type="button" data-dialog-initial-focus onClick={close}>DONE</button></header>
      {picker === 'mix' ? <>
        <nav className="cockpit-picker-tabs" aria-label="Soundtrack selection method">{button('genre','Genre',mixTab === 'genre',()=>setMixTab('genre'))}{button('pace','Pace',mixTab === 'pace',()=>setMixTab('pace'))}{button('featured','Lobo Playlist',selection.kind === 'featured',()=>choose(()=>onSelection({kind:'featured',id:'signal-border'})))}</nav>
        <div className="cockpit-picker-options" role="group" aria-label={mixTab === 'pace' ? 'Soundtrack pace' : 'Soundtrack genre'}>{(mixTab === 'pace' ? SOUNDTRACK_PACE_OPTIONS : SOUNDTRACK_GENRE_OPTIONS).map(item=>button(item.id,item.label,selection.kind === mixTab && selection.id === item.id,()=>choose(()=>onSelection({kind:mixTab,id:item.id}))))}</div>
        <p>{mixTab === 'pace' ? 'Pace chooses recordings with that energy. Tracks play at their original speed.' : 'Pick a genre, or let Random choose one on the start screen.'}</p>
      </> : null}
      {picker === 'score' ? <div className="cockpit-picker-options is-scores">{readyScoreGenres().map(item=>button(item.id,label(item),scoreId === item.id,()=>choose(()=>onScore(item.id)),item.family))}</div> : null}
      {picker === 'visual' ? <div className="cockpit-picker-options is-visuals">{FLUX_VISUAL_CHOICES.map(item=>button(item.id,label(item),item.kind === 'family' ? isShaderGradientEnvironmentId(environmentId) : environmentId === item.id,()=>item.kind === 'family' ? setPicker('gradient') : choose(()=>onVisual(item.id)),item.launchDescription))}</div> : null}
      {picker === 'gradient' ? <div className="cockpit-picker-options is-scores">{SHADERGRADIENT_ENVIRONMENTS.map(item=>button(item.id,label(item),environmentId === item.id,()=>choose(()=>onVisual(item.id))))}</div> : null}
      {picker === 'about' ? <div className="cockpit-about"><p>Music, light and engine sound shaped by your drive.</p><p>Audio, display, motion, and GPS are checked locally. Position stays in this session.</p><p>BUILD {build}</p><a href="https://github.com/enuzzo/sedicivalvole" target="_blank" rel="noreferrer">Source · github.com/enuzzo/sedicivalvole</a><button type="button" onClick={()=>choose(onReset)}>RESET SAVED STATE</button></div> : null}
    </Dialog> : null}
  </>;
}
