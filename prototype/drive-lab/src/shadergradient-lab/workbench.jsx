import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  formatUrlString,
  presetsArray as officialPresets,
  ShaderGradient,
  ShaderGradientCanvas,
} from '@shadergradient/react'
import './workbench.css'

const STORAGE_KEY = 'sedicivalvole:shadergradient-lab:v2'

const BASE_SETTINGS = {
  type: 'waterPlane',
  shader: 'defaults',
  color1: '#f5ead2',
  color2: '#e55d87',
  color3: '#5078d0',
  animate: 'on',
  uTime: 0,
  uSpeed: 0.22,
  uStrength: 2.6,
  uDensity: 1.15,
  uFrequency: 3.4,
  uAmplitude: 0,
  range: 'disabled',
  rangeStart: 0,
  rangeEnd: 40,
  loop: 'on',
  loopDuration: 12,
  grain: 'on',
  grainBlending: 0.24,
  wireframe: false,
  lightType: '3d',
  envPreset: 'city',
  brightness: 1.2,
  reflection: 0.18,
  rotationX: 18,
  rotationY: 0,
  rotationZ: 18,
  positionX: 0,
  positionY: 0,
  positionZ: 0,
  cAzimuthAngle: 175,
  cPolarAngle: 82,
  cDistance: 4.2,
  cameraZoom: 1,
  smoothTime: 0.05,
  zoomOut: false,
  toggleAxis: false,
  enableTransition: true,
  enableCameraUpdate: false,
  fov: 48,
  pixelDensity: 1,
  pointerEvents: 'none',
  lazyLoad: true,
  threshold: 0.1,
  rootMargin: '0px',
  preserveDrawingBuffer: false,
  powerPreference: 'high-performance',
  envBasePath: '',
  responseMode: 'road-audio',
  speed: 35,
  audioEnergy: 0.25,
}

const PRESETS = {
  'japanese-mist': {
    ...BASE_SETTINGS,
    label: 'Japanese Mist',
    description: 'Soft water, warm paper, and a slow chromatic tide.',
  },
  'acid-orchard': {
    ...BASE_SETTINGS,
    label: 'Acid Orchard',
    description: 'A broad graphic field with punchy, speed-led folding.',
    type: 'plane',
    color1: '#ff3b30',
    color2: '#d8ff43',
    color3: '#ff62bd',
    uSpeed: 0.34,
    uStrength: 3.8,
    uDensity: 1.3,
    uFrequency: 5.2,
    uAmplitude: 1.1,
    brightness: 1.3,
    reflection: 0.08,
    rotationX: 0,
    rotationY: 14,
    rotationZ: 48,
    positionX: -0.7,
    cAzimuthAngle: 205,
    cPolarAngle: 90,
    cDistance: 5.4,
    fov: 52,
    responseMode: 'road',
    speed: 70,
    audioEnergy: 0.15,
  },
  'chromatic-silk': {
    ...BASE_SETTINGS,
    label: 'Chromatic Silk',
    description: 'A luminous sculptural fold for stronger motion studies.',
    type: 'sphere',
    shader: 'cosmic',
    color1: '#28d7cc',
    color2: '#6c45ff',
    color3: '#ff7b32',
    uSpeed: 0.3,
    uStrength: 1.1,
    uDensity: 0.85,
    uFrequency: 4.8,
    uAmplitude: 4.5,
    brightness: 1.45,
    reflection: 0.32,
    rotationX: 0,
    rotationY: 24,
    rotationZ: 132,
    cAzimuthAngle: 245,
    cPolarAngle: 128,
    cDistance: 2.4,
    cameraZoom: 7,
    fov: 44,
    responseMode: 'road-audio',
    speed: 105,
    audioEnergy: 0.55,
  },
}

const DEFAULT_PRESET = 'japanese-mist'
const SETTING_KEYS = new Set(Object.keys(BASE_SETTINGS))
const NUMBER_KEYS = new Set(Object.entries(BASE_SETTINGS)
  .filter(([, value]) => typeof value === 'number')
  .map(([key]) => key))
const BOOLEAN_KEYS = new Set(Object.entries(BASE_SETTINGS)
  .filter(([, value]) => typeof value === 'boolean')
  .map(([key]) => key))

function cleanSettings(candidate) {
  const clean = {}
  Object.entries(candidate || {}).forEach(([key, value]) => {
    if (!SETTING_KEYS.has(key)) return
    if (NUMBER_KEYS.has(key)) {
      const number = Number(value)
      if (Number.isFinite(number)) clean[key] = number
      return
    }
    if (BOOLEAN_KEYS.has(key)) {
      clean[key] = value === true || value === 'true'
      return
    }
    clean[key] = value
  })
  return clean
}

function readSavedSettings() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY))
    return saved && typeof saved === 'object'
      ? { ...BASE_SETTINGS, ...cleanSettings(saved) }
      : { ...PRESETS[DEFAULT_PRESET] }
  } catch {
    return { ...PRESETS[DEFAULT_PRESET] }
  }
}

function RangeControl({ label, value, min, max, step, unit = '', onChange }) {
  const decimals = step < 0.1 ? 2 : step < 1 ? 1 : 0
  return (
    <label className="sg-range">
      <span>{label}</span>
      <output>{Number(value).toFixed(decimals)}{unit}</output>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  )
}

function SelectControl({ label, value, options, onChange }) {
  return (
    <label className="sg-select">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </label>
  )
}

function TextControl({ label, value, placeholder, onChange }) {
  return (
    <label className="sg-text-control">
      <span>{label}</span>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  )
}

function ColorControl({ label, value, onChange }) {
  return (
    <label className="sg-color">
      <span>{label}</span>
      <input type="color" value={value} onChange={(event) => onChange(event.target.value)} />
      <code>{value.toUpperCase()}</code>
    </label>
  )
}

function Toggle({ active, children, onClick }) {
  return (
    <button type="button" className={active ? 'is-active' : ''} aria-pressed={active} onClick={onClick}>
      {children}
    </button>
  )
}

function DetailSection({ title, badge, open = false, children }) {
  return (
    <details className="sg-section sg-details" open={open}>
      <summary>
        <h3>{title}</h3>
        {badge ? <span>{badge}</span> : null}
      </summary>
      <div className="sg-detail-body">{children}</div>
    </details>
  )
}

class LabErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <div className="sg-error" role="alert">
          <strong>WebGL preview unavailable</strong>
          <span>{this.state.error.message}</span>
        </div>
      )
    }
    return this.props.children
  }
}

export function ShaderGradientLab({ embedded = false }) {
  const [settings, setSettings] = useState(readSavedSettings)
  const [activePreset, setActivePreset] = useState(DEFAULT_PRESET)
  const [officialPreset, setOfficialPreset] = useState('')
  const [urlInput, setUrlInput] = useState('')
  const [urlStatus, setUrlStatus] = useState('Paste a full shadergradient.co URL or query.')
  const [copyStatus, setCopyStatus] = useState('Copy JSON')

  const set = useCallback((key, value) => {
    setSettings((current) => ({ ...current, [key]: value }))
    setActivePreset('custom')
    setOfficialPreset('')
  }, [])

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  }, [settings])

  const effective = useMemo(() => {
    const road = settings.responseMode === 'free' ? 0 : settings.speed / 130
    const audio = settings.responseMode === 'road-audio' ? settings.audioEnergy : 0
    const motionScale = settings.responseMode === 'free' ? 1 : 0.5 + road * 2.3
    return {
      uSpeed: settings.uSpeed * (motionScale + audio * 0.45),
      uStrength: settings.uStrength + road * 2.8 + audio * 1.25,
      uDensity: settings.uDensity + road * 0.55 + audio * 0.18,
      uFrequency: settings.uFrequency + road * 1.6,
      brightness: settings.brightness + road * 0.2 + audio * 0.22,
      rotationZ: settings.rotationZ + road * 32,
    }
  }, [settings])

  const choosePreset = useCallback((presetKey) => {
    setSettings({ ...PRESETS[presetKey] })
    setActivePreset(presetKey)
    setOfficialPreset('')
  }, [])

  const chooseOfficialPreset = useCallback((title) => {
    const preset = officialPresets.find((entry) => entry.title === title)
    if (!preset) return
    setSettings((current) => ({
      ...BASE_SETTINGS,
      ...cleanSettings(preset.props),
      responseMode: current.responseMode,
      speed: current.speed,
      audioEnergy: current.audioEnergy,
    }))
    setActivePreset('official')
    setOfficialPreset(title)
  }, [])

  const resetLab = useCallback(() => {
    window.localStorage.removeItem(STORAGE_KEY)
    choosePreset(DEFAULT_PRESET)
    setUrlInput('')
    setUrlStatus('Paste a full shadergradient.co URL or query.')
  }, [choosePreset])

  const importUrl = useCallback(() => {
    try {
      const query = formatUrlString(urlInput.trim())
      const params = new URLSearchParams(query)
      const imported = {}
      params.forEach((value, key) => {
        if (!SETTING_KEYS.has(key)) return
        if (NUMBER_KEYS.has(key)) imported[key] = Number(value)
        else if (BOOLEAN_KEYS.has(key)) imported[key] = value === 'true'
        else imported[key] = value
      })
      const clean = cleanSettings(imported)
      if (Object.keys(clean).length === 0) throw new Error('No supported parameters found')
      setSettings((current) => ({ ...current, ...clean }))
      setActivePreset('custom')
      setOfficialPreset('')
      setUrlStatus(`${Object.keys(clean).length} supported parameters imported.`)
    } catch (error) {
      setUrlStatus(`Import failed: ${error.message}`)
    }
  }, [urlInput])

  const handleCameraUpdate = useCallback((updates) => {
    const camera = cleanSettings(updates)
    setSettings((current) => ({ ...current, ...camera }))
    setActivePreset('custom')
    setOfficialPreset('')
  }, [])

  const copySettings = useCallback(async () => {
    const payload = JSON.stringify({
      source: '@shadergradient/react@2.4.20',
      settings,
      effective,
    }, null, 2)
    try {
      await navigator.clipboard.writeText(payload)
      setCopyStatus('Copied')
    } catch {
      setCopyStatus('Clipboard blocked')
    }
    window.setTimeout(() => setCopyStatus('Copy JSON'), 1400)
  }, [effective, settings])

  const canvasKey = `${settings.preserveDrawingBuffer}:${settings.powerPreference}`

  return (
    <main className={`shadergradient-lab${embedded ? ' is-embedded' : ''}`}>
      <section className="sg-stage" aria-label="ShaderGradient live preview">
        <LabErrorBoundary key={canvasKey}>
          <ShaderGradientCanvas
            key={canvasKey}
            className="sg-canvas"
            style={{ position: 'absolute', inset: 0 }}
            pixelDensity={settings.pixelDensity}
            fov={settings.fov}
            pointerEvents={settings.pointerEvents}
            envBasePath={settings.envBasePath || undefined}
            lazyLoad={settings.lazyLoad}
            threshold={settings.threshold}
            rootMargin={settings.rootMargin}
            preserveDrawingBuffer={settings.preserveDrawingBuffer}
            powerPreference={settings.powerPreference}
          >
            <ShaderGradient
              control="props"
              type={settings.type}
              shader={settings.shader}
              animate={settings.animate}
              grain={settings.grain}
              grainBlending={settings.grainBlending}
              wireframe={settings.wireframe}
              color1={settings.color1}
              color2={settings.color2}
              color3={settings.color3}
              uTime={settings.uTime}
              uSpeed={effective.uSpeed}
              uStrength={effective.uStrength}
              uDensity={effective.uDensity}
              uFrequency={effective.uFrequency}
              uAmplitude={settings.uAmplitude}
              range={settings.range}
              rangeStart={settings.rangeStart}
              rangeEnd={settings.rangeEnd}
              loop={settings.loop}
              loopDuration={settings.loopDuration}
              lightType={settings.lightType}
              envPreset={settings.envPreset}
              brightness={effective.brightness}
              reflection={settings.reflection}
              positionX={settings.positionX}
              positionY={settings.positionY}
              positionZ={settings.positionZ}
              rotationX={settings.rotationX}
              rotationY={settings.rotationY}
              rotationZ={effective.rotationZ}
              cAzimuthAngle={settings.cAzimuthAngle}
              cPolarAngle={settings.cPolarAngle}
              cDistance={settings.cDistance}
              cameraZoom={settings.cameraZoom}
              smoothTime={settings.smoothTime}
              zoomOut={settings.zoomOut}
              toggleAxis={settings.toggleAxis}
              enableTransition={settings.enableTransition}
              enableCameraUpdate={settings.enableCameraUpdate}
              onCameraUpdate={settings.enableCameraUpdate ? handleCameraUpdate : undefined}
            />
          </ShaderGradientCanvas>
        </LabErrorBoundary>

        <header className="sg-brand">
          <div>
            <span className="sg-kicker">{embedded ? 'SEDICIVALVOLE · PROTECTED LAB' : 'SEDICIVALVOLE · LOCAL TOOL'}</span>
            <h1>ShaderGradient Lab</h1>
          </div>
          <span className="sg-license">MIT · v2.4.20</span>
        </header>

        <div className="sg-readout" aria-live="polite">
          <span>{settings.responseMode.replace('-', ' + ')}</span>
          <strong>{settings.speed}<small> km/h</small></strong>
          <span>motion {effective.uSpeed.toFixed(2)} · fold {effective.uStrength.toFixed(1)}</span>
        </div>

        <footer className="sg-stage-note">
          {settings.pointerEvents === 'auto' ? 'Touch camera enabled · drag the field' : embedded ? 'Protected experiment · public production renderer remains unchanged' : 'Experimental only · no production renderer is changed by this page'}
        </footer>
      </section>

      <aside className="sg-inspector">
        <div className="sg-inspector-header">
          <div>
            <span className="sg-kicker">COMPLETE CONTROL SURFACE</span>
            <h2>Shape the field</h2>
          </div>
          <button type="button" className="sg-button is-quiet" onClick={resetLab}>Reset</button>
        </div>

        <DetailSection title="Starting points" badge="3 studies + 10 official" open>
          <div className="sg-presets">
            {Object.entries(PRESETS).map(([key, preset]) => (
              <button
                key={key}
                type="button"
                className={activePreset === key ? 'is-active' : ''}
                onClick={() => choosePreset(key)}
              >
                <span>{preset.label}</span>
                <small>{preset.description}</small>
              </button>
            ))}
          </div>
          <div className="sg-official-preset">
            <SelectControl
              label="Official ShaderGradient presets"
              value={officialPreset}
              options={[
                { value: '', label: 'Choose one of 10…' },
                ...officialPresets.map((preset) => ({ value: preset.title, label: preset.title })),
              ]}
              onChange={chooseOfficialPreset}
            />
          </div>
        </DetailSection>

        <DetailSection title="Geometry and shader" badge="All families" open>
          <div className="sg-grid-2">
            <SelectControl
              label="Geometry"
              value={settings.type}
              options={[
                { value: 'plane', label: 'Plane' },
                { value: 'waterPlane', label: 'Water plane' },
                { value: 'sphere', label: 'Sphere' },
              ]}
              onChange={(value) => set('type', value)}
            />
            <SelectControl
              label="Shader"
              value={settings.shader}
              options={[
                { value: 'defaults', label: 'Default' },
                { value: 'positionMix', label: 'Position mix' },
                { value: 'cosmic', label: 'Cosmic' },
                { value: 'glass', label: 'Glass' },
              ]}
              onChange={(value) => set('shader', value)}
            />
          </div>
          <p className="sg-note">3 geometries × 4 registered shader families = every renderer combination in v2.4.20.</p>
        </DetailSection>

        <DetailSection title="Drive response" badge="130 km/h = 100%" open>
          <div className="sg-segmented" aria-label="Response mode">
            {[
              ['free', 'Free'],
              ['road', 'Road'],
              ['road-audio', 'Road + audio'],
            ].map(([value, label]) => (
              <Toggle key={value} active={settings.responseMode === value} onClick={() => set('responseMode', value)}>{label}</Toggle>
            ))}
          </div>
          <RangeControl label="Road speed" value={settings.speed} min={0} max={130} step={1} unit=" km/h" onChange={(value) => set('speed', value)} />
          <RangeControl label="Audio energy" value={settings.audioEnergy} min={0} max={1} step={0.01} onChange={(value) => set('audioEnergy', value)} />
        </DetailSection>

        <DetailSection title="Palette" open>
          <div className="sg-colors">
            <ColorControl label="Color 1" value={settings.color1} onChange={(value) => set('color1', value)} />
            <ColorControl label="Color 2" value={settings.color2} onChange={(value) => set('color2', value)} />
            <ColorControl label="Color 3" value={settings.color3} onChange={(value) => set('color3', value)} />
          </div>
        </DetailSection>

        <DetailSection title="Motion and surface" badge="Full timeline">
          <div className="sg-toggle-row">
            <Toggle active={settings.animate === 'on'} onClick={() => set('animate', settings.animate === 'on' ? 'off' : 'on')}>Animate</Toggle>
            <Toggle active={settings.grain === 'on'} onClick={() => set('grain', settings.grain === 'on' ? 'off' : 'on')}>Grain</Toggle>
            <Toggle active={settings.wireframe} onClick={() => set('wireframe', !settings.wireframe)}>Wireframe</Toggle>
          </div>
          {settings.animate === 'off' ? <RangeControl label="Manual time" value={settings.uTime} min={0} max={40} step={0.1} unit=" s" onChange={(value) => set('uTime', value)} /> : null}
          <RangeControl label="Speed" value={settings.uSpeed} min={0} max={2} step={0.01} onChange={(value) => set('uSpeed', value)} />
          <RangeControl label="Strength" value={settings.uStrength} min={0} max={8} step={0.1} onChange={(value) => set('uStrength', value)} />
          <RangeControl label="Density" value={settings.uDensity} min={0.1} max={4} step={0.05} onChange={(value) => set('uDensity', value)} />
          <RangeControl label="Frequency" value={settings.uFrequency} min={0} max={10} step={0.1} onChange={(value) => set('uFrequency', value)} />
          {settings.type === 'sphere' ? <RangeControl label="Spiral amplitude" value={settings.uAmplitude} min={0} max={8} step={0.1} onChange={(value) => set('uAmplitude', value)} /> : null}
          <RangeControl label="Grain blending" value={settings.grainBlending} min={0} max={1} step={0.01} onChange={(value) => set('grainBlending', value)} />
          <div className="sg-subgroup">
            <h4>Timeline boundaries</h4>
            <div className="sg-toggle-row sg-toggle-row-2">
              <Toggle active={settings.loop === 'on'} onClick={() => set('loop', settings.loop === 'on' ? 'off' : 'on')}>Loop</Toggle>
              <Toggle active={settings.range === 'enabled'} onClick={() => set('range', settings.range === 'enabled' ? 'disabled' : 'enabled')}>Range</Toggle>
            </div>
            {settings.loop === 'on' ? <RangeControl label="Loop duration" value={settings.loopDuration} min={1} max={60} step={1} unit=" s" onChange={(value) => set('loopDuration', value)} /> : null}
            {settings.loop === 'off' && settings.range === 'enabled' ? (
              <>
                <RangeControl label="Range start" value={settings.rangeStart} min={0} max={60} step={0.5} unit=" s" onChange={(value) => set('rangeStart', value)} />
                <RangeControl label="Range end" value={settings.rangeEnd} min={0.5} max={120} step={0.5} unit=" s" onChange={(value) => set('rangeEnd', value)} />
              </>
            ) : null}
          </div>
        </DetailSection>

        <DetailSection title="Lighting" badge={settings.lightType === 'env' ? 'Remote HDR' : 'Local'}>
          <div className="sg-grid-2">
            <SelectControl
              label="Light model"
              value={settings.lightType}
              options={[
                { value: '3d', label: '3D lights' },
                { value: 'env', label: 'HDR environment' },
              ]}
              onChange={(value) => set('lightType', value)}
            />
            {settings.lightType === 'env' ? (
              <SelectControl
                label="Environment"
                value={settings.envPreset}
                options={[
                  { value: 'city', label: 'City' },
                  { value: 'dawn', label: 'Dawn' },
                  { value: 'lobby', label: 'Lobby' },
                ]}
                onChange={(value) => set('envPreset', value)}
              />
            ) : null}
          </div>
          {settings.lightType === '3d' ? (
            <RangeControl label="Brightness" value={settings.brightness} min={0.1} max={3} step={0.05} onChange={(value) => set('brightness', value)} />
          ) : (
            <>
              <RangeControl label="Reflection" value={settings.reflection} min={0} max={1} step={0.01} onChange={(value) => set('reflection', value)} />
              <TextControl label="HDR base path (blank = upstream)" value={settings.envBasePath} placeholder="/assets/hdr/" onChange={(value) => set('envBasePath', value)} />
              <p className="sg-note is-warning">Environment mode downloads the official HDR maps unless a local base path is supplied.</p>
            </>
          )}
        </DetailSection>

        <DetailSection title="Position and rotation">
          <div className="sg-axis-grid">
            <RangeControl label="Position X" value={settings.positionX} min={-10} max={10} step={0.1} onChange={(value) => set('positionX', value)} />
            <RangeControl label="Position Y" value={settings.positionY} min={-10} max={10} step={0.1} onChange={(value) => set('positionY', value)} />
            <RangeControl label="Position Z" value={settings.positionZ} min={-10} max={10} step={0.1} onChange={(value) => set('positionZ', value)} />
            <RangeControl label="Rotation X" value={settings.rotationX} min={-360} max={360} step={1} unit="°" onChange={(value) => set('rotationX', value)} />
            <RangeControl label="Rotation Y" value={settings.rotationY} min={-360} max={360} step={1} unit="°" onChange={(value) => set('rotationY', value)} />
            <RangeControl label="Rotation Z" value={settings.rotationZ} min={-360} max={360} step={1} unit="°" onChange={(value) => set('rotationZ', value)} />
          </div>
        </DetailSection>

        <DetailSection title="Camera and view" badge={settings.pointerEvents === 'auto' ? 'Touch enabled' : 'Fixed'}>
          <RangeControl label="Field of view" value={settings.fov} min={10} max={180} step={1} unit="°" onChange={(value) => set('fov', value)} />
          {settings.type === 'sphere' ? (
            <RangeControl label="Camera zoom" value={settings.cameraZoom} min={0.1} max={30} step={0.1} onChange={(value) => set('cameraZoom', value)} />
          ) : (
            <RangeControl label="Distance" value={settings.cDistance} min={0} max={20} step={0.1} onChange={(value) => set('cDistance', value)} />
          )}
          <RangeControl label="Azimuth" value={settings.cAzimuthAngle} min={0} max={360} step={1} unit="°" onChange={(value) => set('cAzimuthAngle', value)} />
          <RangeControl label="Polar" value={settings.cPolarAngle} min={0} max={180} step={1} unit="°" onChange={(value) => set('cPolarAngle', value)} />
          <RangeControl label="Camera smoothing" value={settings.smoothTime} min={0} max={1} step={0.01} unit=" s" onChange={(value) => set('smoothTime', value)} />
          <div className="sg-toggle-grid">
            <Toggle active={settings.zoomOut} onClick={() => set('zoomOut', !settings.zoomOut)}>Wide view</Toggle>
            <Toggle active={settings.toggleAxis} onClick={() => set('toggleAxis', !settings.toggleAxis)}>Axis guide</Toggle>
            <Toggle active={settings.enableTransition} onClick={() => set('enableTransition', !settings.enableTransition)}>Smooth transition</Toggle>
            <Toggle active={settings.pointerEvents === 'auto'} onClick={() => set('pointerEvents', settings.pointerEvents === 'auto' ? 'none' : 'auto')}>Touch camera</Toggle>
            <Toggle active={settings.enableCameraUpdate} onClick={() => set('enableCameraUpdate', !settings.enableCameraUpdate)}>Sync camera values</Toggle>
          </div>
        </DetailSection>

        <DetailSection title="Canvas and performance" badge="Context controls">
          <RangeControl label="Pixel density" value={settings.pixelDensity} min={0.25} max={3} step={0.05} onChange={(value) => set('pixelDensity', value)} />
          <div className="sg-grid-2 sg-spaced-grid">
            <SelectControl
              label="GPU preference"
              value={settings.powerPreference}
              options={[
                { value: 'default', label: 'Automatic' },
                { value: 'high-performance', label: 'High performance' },
                { value: 'low-power', label: 'Low power' },
              ]}
              onChange={(value) => set('powerPreference', value)}
            />
            <div className="sg-toggle-column">
              <Toggle active={settings.preserveDrawingBuffer} onClick={() => set('preserveDrawingBuffer', !settings.preserveDrawingBuffer)}>Keep drawing buffer</Toggle>
              <Toggle active={settings.lazyLoad} onClick={() => set('lazyLoad', !settings.lazyLoad)}>Lazy load</Toggle>
            </div>
          </div>
          {settings.lazyLoad ? (
            <>
              <RangeControl label="Visibility threshold" value={settings.threshold} min={0} max={1} step={0.05} onChange={(value) => set('threshold', value)} />
              <TextControl label="Observer root margin" value={settings.rootMargin} placeholder="0px" onChange={(value) => set('rootMargin', value)} />
            </>
          ) : null}
          <p className="sg-note">Changing GPU preference or drawing-buffer retention safely rebuilds the WebGL canvas.</p>
        </DetailSection>

        <DetailSection title="Import official URL" badge="Advanced">
          <label className="sg-url-control">
            <span>ShaderGradient URL or query</span>
            <textarea value={urlInput} placeholder="https://www.shadergradient.co/customize?…" onChange={(event) => setUrlInput(event.target.value)} />
          </label>
          <div className="sg-import-row">
            <button type="button" className="sg-button" onClick={importUrl} disabled={!urlInput.trim()}>Import supported values</button>
            <small aria-live="polite">{urlStatus}</small>
          </div>
        </DetailSection>

        <div className="sg-actions">
          <button type="button" className="sg-button is-primary" onClick={copySettings}>{copyStatus}</button>
          <a href="https://github.com/ruucm/shadergradient" target="_blank" rel="noreferrer">Upstream ↗</a>
        </div>
        <p className="sg-legal">ShaderGradient is MIT-licensed software by ruucm and stone-skipper. This lab exposes every visual and runtime choice in the v2.4.20 public API. Framer-only plumbing and callback objects are intentionally not presented as visual controls.</p>
      </aside>
    </main>
  )
}
