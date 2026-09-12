import React, {useState} from 'react';
import {createRoot} from 'react-dom/client';
import {DriveyCycleControl, PrtclCycleControl, ShaderGradientCycleControl} from '../ui/visual-cycle-controls.jsx';
import {DEFAULT_DRIVEY_SETTINGS} from '../environments/drivey/drivey-model.js';
import {DEFAULT_PRTCL_SETTINGS} from '../environments/prtcl/prtcl-model.js';
import {FLUX_VISUAL_CHOICES, getFluxEnvironment} from '../flux-environments.js';
import {FLUX_THEMES, getFluxTheme} from '../flux-themes.js';
import {resolveSemanticTheme} from '../semantic-theme.js';
import '../styles.css';
import './showcase.css';

function Showcase() {
  const [appearance,setAppearance] = useState('light');
  const [themeId,setThemeId] = useState('red');
  const [resting,setResting] = useState(false);
  const [drivey,setDrivey] = useState(DEFAULT_DRIVEY_SETTINGS);
  const [prtcl,setPrtcl] = useState(DEFAULT_PRTCL_SETTINGS);
  const [gradient,setGradient] = useState('japanese-mist');
  const theme = resolveSemanticTheme(getFluxTheme(themeId), appearance);
  return <main className="app design-system" data-appearance={appearance} style={theme.css}>
    <header><p className="ds-eyebrow">SEDICIVALVOLE / INTERFACE REFERENCE</p><h1>One language, shared controls.</h1><p>Live production components, semantic colors and type. This development reference has no media, location or diagnostic delivery.</p></header>
    <form className="ds-settings" onSubmit={e=>e.preventDefault()}>
      <label>Appearance <select value={appearance} onChange={e=>setAppearance(e.target.value)}><option>light</option><option>dark</option></select></label>
      <label>Palette <select value={themeId} onChange={e=>setThemeId(e.target.value)}>{FLUX_THEMES.map(t=><option key={t.id} value={t.id}>{t.label.replace(/\s+\d+$/,'')}</option>)}</select></label>
      <button type="button" aria-pressed={resting} onClick={()=>setResting(v=>!v)}>{resting?'Show controls':'Preview resting chrome'}</button>
    </form>
    <section aria-labelledby="controls-title"><h2 id="controls-title">Contextual visual controls</h2><p>Same 112 px cells, minimum 48 px targets, 6 px corners, 1 px stroke and left-aligned label/value. Try every button; Tab exposes focus.</p>
      <div className={`ds-specimens ${resting?'controls-resting':''}`}>
        <article><h3>Drivey</h3><div className="ds-stage"><DriveyCycleControl settings={drivey} onChange={setDrivey}/></div><p>VIEW cycles camera. RENDER is a toggle.</p></article>
        <article><h3>Prtcl</h3><div className="ds-stage"><PrtclCycleControl settings={prtcl} onChange={setPrtcl}/></div><p>TYPE cycles the active particle family.</p></article>
        <article><h3>Gradient</h3><div className="ds-stage"><ShaderGradientCycleControl environment={getFluxEnvironment(gradient)} onChange={setGradient}/></div><p>VARIANT cycles Mist, Orchard and Silk.</p></article>
      </div>
    </section>
    <section><h2>Semantic type</h2><div className="ds-type-ladder">{[['Metadata','--type-meta'],['Label','--type-label'],['Body','--type-body'],['Action','--type-action'],['Active name','--type-active'],['Title','--type-title'],['Primary value','--type-value']].map(([label,token])=><p key={token}><span style={{fontSize:`var(${token})`}}>{label}</span><code>{token}</code></p>)}</div></section>
    <section><h2>Visual inventory</h2><p>A field without a local setting does not acquire a decorative button. Map navigation, live measurements and drawers keep their own semantic roles.</p><div className="ds-table"><table><thead><tr><th>Public visual</th><th>Contextual control</th></tr></thead><tbody>{FLUX_VISUAL_CHOICES.map(v=><tr key={v.id}><td>{v.displayLabel||v.label}</td><td>{v.id==='drivey'?'VIEW / RENDER':v.id==='prtcl'?'TYPE':v.kind==='family'?'VARIANT':v.id==='atlas'?'Map navigation / places':v.id==='air-atlas'?'Traffic / map / orientation / flight':v.id==='stats'?'Time ranges / observations':v.id==='discover'?'Search / language / articles':'None — shared Visual library'}</td></tr>)}</tbody></table></div></section>
    <footer>Source rules and audit evidence: docs/DESIGN-SYSTEM.md · Specimen layout is separate from production control styling.</footer>
  </main>;
}
createRoot(document.getElementById('root')).render(<Showcase/>);
