import { useState } from 'react';
import { SOUNDTRACK_GENRE_OPTIONS, SOUNDTRACK_PACE_OPTIONS } from './soundtrack/library-model.js';
import { FLUX_VISUAL_CHOICES, SHADERGRADIENT_ENVIRONMENTS, getFluxEnvironment, isShaderGradientEnvironmentId } from './flux-environments.js';
import { readyScoreGenres, getScoreGenre } from './score/genres.js';
import { CURATED_EXPERIENCES } from './curated-experiences.js';
import './launch-cockpit.css';

const SOURCES = [
  ['soundtrack', 'Soundtrack'], ['play-road', 'Play the Road'], ['mute', 'Visuals only'],
];
const ENGINES = [['mono', 'Mono', 'Agile and raw'], ['rosso', 'Rosso', 'Bright and expressive'], ['touring', 'Touring', 'Deep and relaxed']];
const label = value => value.displayLabel || value.label;

export function LaunchCockpit({ mode, onMode, musicId, onMusic, selection, lucky, onSelection, onLucky,
  environmentId, onVisual, scoreId, onScore, engineProfileId, onEngineProfile, experienceId, onExperience,
  markUrl, build, onStart, ready, pending, muted, onUnmute, onSupport, onReset, Dialog }) {
  const [picker, setPicker] = useState(null);
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
        <h1>sedicivalvole</h1><small className="cockpit-build">{build}</small>
        <button type="button" onClick={() => setPicker('about')} aria-haspopup="dialog">About</button>
      </header>
      <nav className="cockpit-modes" aria-label="Experience mode">
        {button('music', 'Music', !engine, () => onMode('flux'))}
        {button('engine', 'Engine', engine, () => onMode('engine'))}
      </nav>
      {engine ? <div className="cockpit-engine-body">
        <p className="cockpit-engine-intro">Sound that follows your drive.</p>
        <div className="cockpit-engine-profiles" role="group" aria-label="Engine profile">
          {ENGINES.map(([id, name, detail]) => button(id, name, engineProfileId === id, () => onEngineProfile(id), detail))}
        </div>
        <div className="cockpit-engine-note"><span>Automatic gears</span><span>Stationary revs</span><span>Pure engine sound</span></div>
      </div> : <div className="cockpit-music-body">
        <nav className="cockpit-sources" aria-label="Music source">{SOURCES.map(([id, name]) => button(id, name, musicId === id, () => onMusic(id)))}</nav>
        <div className="cockpit-selection">
          <div className="cockpit-value"><small>{musicId === 'soundtrack' ? 'YOUR SOUNDTRACK' : musicId === 'mute' ? 'JUST THE VIEW' : 'ADAPTIVE SCORE'}</small><div><strong>{mixLabel}</strong>{musicId === 'soundtrack' && selection.kind !== 'featured' ? <span>{selection.kind === 'pace' ? 'Pace' : selection.kind === 'library' ? 'Library' : lucky ? 'Lucky pick' : 'Genre'}</span> : null}</div></div>
          {musicId !== 'mute' ? <button type="button" className="cockpit-text-action" aria-label={musicId === 'soundtrack' ? 'Choose soundtrack' : 'Choose adaptive score'} aria-haspopup="dialog" onClick={() => { setMixTab(selection.kind === 'pace' ? 'pace' : 'genre'); setPicker(musicId === 'soundtrack' ? 'mix' : 'score'); }}>Choose</button> : null}
          {musicId === 'soundtrack' ? <button type="button" className="cockpit-lucky" onClick={onLucky}>Feeling lucky</button> : null}
          {musicId === 'mute' ? <span className="cockpit-explanation">Visuals follow your drive.</span> : null}
        </div>
        <div className="cockpit-selection cockpit-visual"><div className="cockpit-value"><small>VISUAL</small><strong>{visualLabel}</strong></div><button type="button" className="cockpit-text-action" aria-label="Change visual" aria-haspopup="dialog" onClick={() => setPicker('visual')}>Change</button></div>
        <div className="cockpit-presets"><small>PRESETS</small><div>{CURATED_EXPERIENCES.map(item => button(item.id, item.title, experienceId === item.id, () => onExperience(item.id)))}</div></div>
      </div>}
      <div className="cockpit-start-row">
        {muted && (engine || musicId !== 'mute') ? <button className="cockpit-unmute" type="button" onClick={onUnmute}>UNMUTE</button> : null}
        <button className="cockpit-start" type="button" aria-label={startLabel} disabled={!ready} onClick={onStart}>
          <strong>{startLabel}</strong><span>{muted && (engine || musicId !== 'mute') ? 'Audio muted' : pending && !engine && musicId === 'soundtrack' ? 'Music joins when ready' : engine ? `${profile[1]} · automatic` : `${mixLabel} · ${visualLabel}`}</span>
        </button>
      </div>
    </section>
    <footer className="cockpit-footer" inert={picker ? true : undefined}>
      <span>by <a href="https://github.com/enuzzo" target="_blank" rel="noreferrer">enuzzo</a> · with <a href="https://github.com/illobo" target="_blank" rel="noreferrer">Illobo</a></span>
      <small>Drive responsibly</small><button type="button" onClick={onSupport} aria-label="Open Buy Me a Coffee support panel" aria-haspopup="dialog">Support</button>
    </footer>
    {picker ? <Dialog className="cockpit-dialog" labelledBy="cockpit-picker-title" onClose={close} panelClass="cockpit-picker" backdropClass="cockpit-backdrop">
      <header><h2 id="cockpit-picker-title">{({ mix: 'Choose your soundtrack', score: 'Choose your score', visual: 'Choose your visual', gradient: 'Gradient variants', about: 'About sedicivalvole' })[picker]}</h2><button type="button" data-dialog-initial-focus onClick={close}>DONE</button></header>
      {picker === 'mix' ? <>
        <nav className="cockpit-picker-tabs" aria-label="Soundtrack selection method">{button('genre','Genre',mixTab === 'genre',()=>setMixTab('genre'))}{button('pace','Pace',mixTab === 'pace',()=>setMixTab('pace'))}{button('featured','Lobo Playlist',selection.kind === 'featured',()=>choose(()=>onSelection({kind:'featured',id:'signal-border'})))}</nav>
        <div className="cockpit-picker-options" role="group" aria-label={mixTab === 'pace' ? 'Soundtrack pace' : 'Soundtrack genre'}>{(mixTab === 'pace' ? SOUNDTRACK_PACE_OPTIONS : SOUNDTRACK_GENRE_OPTIONS).map(item=>button(item.id,item.label,selection.kind === mixTab && selection.id === item.id,()=>choose(()=>onSelection({kind:mixTab,id:item.id}))))}</div>
        <p>{mixTab === 'pace' ? 'Pace chooses recordings with that energy. Tracks play at their original speed.' : 'Pick a genre, or let Feeling lucky choose one on the start screen.'}</p>
      </> : null}
      {picker === 'score' ? <div className="cockpit-picker-options is-scores">{readyScoreGenres().map(item=>button(item.id,label(item),scoreId === item.id,()=>choose(()=>onScore(item.id)),item.family))}</div> : null}
      {picker === 'visual' ? <div className="cockpit-picker-options is-visuals">{FLUX_VISUAL_CHOICES.map(item=>button(item.id,label(item),item.kind === 'family' ? isShaderGradientEnvironmentId(environmentId) : environmentId === item.id,()=>item.kind === 'family' ? setPicker('gradient') : choose(()=>onVisual(item.id)),item.launchDescription))}</div> : null}
      {picker === 'gradient' ? <div className="cockpit-picker-options is-scores">{SHADERGRADIENT_ENVIRONMENTS.map(item=>button(item.id,label(item),environmentId === item.id,()=>choose(()=>onVisual(item.id))))}</div> : null}
      {picker === 'about' ? <div className="cockpit-about"><p>Music, light and engine sound shaped by your drive.</p><p>Audio, display, motion, and GPS are checked locally. Position stays in this session.</p><p>BUILD {build}</p><a href="https://github.com/enuzzo/sedicivalvole" target="_blank" rel="noreferrer">Source · github.com/enuzzo/sedicivalvole</a><button type="button" onClick={()=>choose(onReset)}>RESET SAVED STATE</button></div> : null}
    </Dialog> : null}
  </>;
}
