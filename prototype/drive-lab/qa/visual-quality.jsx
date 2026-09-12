import React, {useState} from 'react';
import {createRoot} from 'react-dom/client';
import ShaderGradientField from '../src/environments/shadergradient/shadergradient-field.jsx';
import {getFluxTheme, FLUX_THEMES} from '../src/flux-themes.js';
import {SHADERGRADIENT_STUDY_IDS} from '../src/environments/shadergradient/studies.js';
import '../src/styles.css';

function QualityProbe() {
  const query = new URLSearchParams(location.search);
  const [study, setStudy] = useState(query.get('study') || 'chromatic-silk');
  const [theme, setTheme] = useState(query.get('theme') || 'pearl');
  const [speed, setSpeed] = useState(Number(query.get('speed')) || 0);
  const [brake, setBrake] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [renderer, setRenderer] = useState('Loading');
  return <main className="app" data-appearance="dark">
    <ShaderGradientField studyId={study} theme={getFluxTheme(theme)} speed={speed}
      musicMode="soundtrack" effect={brake ? 'UNDERWATER' : null}
      reducedMotion={reduced} onRenderer={setRenderer} />
    <form style={{position:'absolute',zIndex:100,left:8,bottom:8,background:'#171717',color:'#fff',padding:8,font:'13px sans-serif',display:'flex',gap:8,flexWrap:'wrap'}} onSubmit={e=>e.preventDefault()}>
      <strong>LOCAL QA · synthetic inputs</strong>
      <label>Variant <select value={study} onChange={e=>setStudy(e.target.value)}>{SHADERGRADIENT_STUDY_IDS.map(id=><option key={id}>{id}</option>)}</select></label>
      <label>Palette <select value={theme} onChange={e=>setTheme(e.target.value)}>{FLUX_THEMES.map(t=><option key={t.id}>{t.id}</option>)}</select></label>
      <label>Speed <select value={speed} onChange={e=>setSpeed(Number(e.target.value))}>{[0,40,90,130].map(v=><option key={v}>{v}</option>)}</select></label>
      <button type="button" aria-pressed={brake} onClick={()=>setBrake(v=>!v)}>Brake</button>
      <button type="button" aria-pressed={reduced} onClick={()=>setReduced(v=>!v)}>Reduced motion</button>
      <output>{renderer}</output>
    </form>
  </main>;
}
createRoot(document.getElementById('root')).render(<QualityProbe />);
