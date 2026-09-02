import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const ROOT = new URL('../', import.meta.url)

async function read(relativePath) {
  return readFile(new URL(relativePath, ROOT), 'utf8')
}

test('ShaderGradient Lab is a reusable local and protected-LAB tool', async () => {
  const [html, entry, source, lab, app] = await Promise.all([
    read('shadergradient-lab.html'),
    read('src/shadergradient-lab/main.jsx'),
    read('src/shadergradient-lab/workbench.jsx'),
    read('src/lab/main.jsx'),
    read('src/App.jsx'),
  ])

  assert.match(html, /noindex,nofollow/)
  assert.match(html, /src\/shadergradient-lab\/main\.jsx/)
  assert.match(entry, /ShaderGradientLab/)
  assert.match(source, /from '@shadergradient\/react'/)
  assert.match(source, /Protected experiment/)
  assert.match(lab, /SHADERGRADIENT \/ LAB/)
  assert.match(lab, /<ShaderGradientLab embedded/)
  assert.doesNotMatch(app, /@shadergradient\/react/)
})

test('the local owner LAB uses the same canonical route as production', async () => {
  const [viteConfig, readme, guide] = await Promise.all([
    read('vite.config.mjs'),
    read('README.md'),
    read('../../docs/LOCAL-SHADERGRADIENT-LAB.md'),
  ])

  assert.match(viteConfig, /pathname === "\/lab" \|\| pathname === "\/lab\/"/)
  assert.match(viteConfig, /request\.url = `\/lab\.html/)
  assert.match(viteConfig, /apply: "serve"/)
  assert.match(readme, /127\.0\.0\.1:5180\/lab\//)
  assert.match(guide, /127\.0\.0\.1:5180\/lab\//)
})

test('ShaderGradient Lab exposes every registered family, official presets, and bounded road response', async () => {
  const source = await read('src/shadergradient-lab/workbench.jsx')

  assert.match(source, /Japanese Mist/)
  assert.match(source, /Acid Orchard/)
  assert.match(source, /Chromatic Silk/)
  assert.match(source, /presetsArray as officialPresets/)
  assert.match(source, /3 studies \+ 10 official/)
  for (const shader of ['defaults', 'positionMix', 'cosmic', 'glass']) {
    assert.match(source, new RegExp(`value: '${shader}'`))
  }
  assert.match(source, /settings\.speed \/ 130/)
  assert.match(source, /responseMode === 'free' \? 1 : 0\.5 \+ road \* 2\.3/)
  assert.match(source, /settings\.uSpeed \* \(motionScale \+ audio \* 0\.45\)/)
  assert.match(source, /Road \+ audio/)
  assert.match(source, /lightType=\{settings\.lightType\}/)
  assert.doesNotMatch(source, /key=\{`\$\{settings\.type\}/)
})

test('ShaderGradient Lab exposes the complete useful v2.4.20 runtime control surface', async () => {
  const source = await read('src/shadergradient-lab/workbench.jsx')

  for (const prop of [
    'uTime', 'uAmplitude',
    'rangeStart', 'rangeEnd', 'loopDuration', 'grainBlending', 'envPreset',
    'positionX', 'positionY', 'positionZ', 'rotationX', 'rotationY',
    'cAzimuthAngle', 'cPolarAngle', 'cDistance', 'cameraZoom', 'smoothTime',
    'zoomOut', 'toggleAxis', 'enableTransition', 'enableCameraUpdate',
    'pointerEvents', 'lazyLoad', 'threshold', 'rootMargin',
    'preserveDrawingBuffer', 'powerPreference',
  ]) {
    assert.match(source, new RegExp(`${prop}=\\{settings\\.${prop}\\}`), prop)
  }
  for (const prop of ['uSpeed', 'uStrength', 'uDensity', 'uFrequency']) {
    assert.match(source, new RegExp(`${prop}=\\{effective\\.${prop}\\}`), prop)
    assert.match(source, new RegExp(`value=\\{settings\\.${prop}\\}`), `${prop} control`)
  }
  assert.match(source, /rotationZ=\{effective\.rotationZ\}/)
  assert.match(source, /value=\{settings\.rotationZ\}/)
  assert.match(source, /envBasePath=\{settings\.envBasePath \|\| undefined\}/)
  assert.match(source, /formatUrlString\(urlInput\.trim\(\)\)/)
  assert.match(source, /canvasKey = `\$\{settings\.preserveDrawingBuffer\}:\$\{settings\.powerPreference\}`/)
})

test('ShaderGradient and its rendering peers are exact development dependencies', async () => {
  const manifest = JSON.parse(await read('package.json'))

  assert.equal(manifest.devDependencies['@shadergradient/react'], '2.4.20')
  assert.equal(manifest.devDependencies['@react-three/fiber'], '9.7.0')
  assert.equal(manifest.devDependencies.three, '0.169.0')
  assert.equal(manifest.devDependencies['three-stdlib'], '2.36.1')
  assert.equal(manifest.devDependencies['camera-controls'], '2.9.0')
  assert.equal(manifest.dependencies?.['@shadergradient/react'], undefined)
})

test('the public app excludes ShaderGradient while the protected LAB admits the workbench', async () => {
  const [manifest, labConfig, app, lab] = await Promise.all([
    read('package.json'),
    read('vite.lab.config.mjs'),
    read('src/App.jsx'),
    read('src/lab/main.jsx'),
  ])

  assert.doesNotMatch(manifest, /shadergradient-lab\.html/)
  assert.match(labConfig, /src\/lab\/main\.jsx/)
  assert.doesNotMatch(app, /shadergradient-lab/)
  assert.match(lab, /shadergradient-lab\/workbench\.jsx/)
})

test('the embedded workbench preserves a side inspector at the Tesla viewport', async () => {
  const styles = await read('src/shadergradient-lab/workbench.css')

  assert.match(styles, /\.shadergradient-lab\.is-embedded/)
  assert.match(styles, /min-width: 621px[\s\S]*max-width: 900px/)
  assert.match(styles, /grid-template-columns: minmax\(0, 1fr\) 300px/)
  assert.match(styles, /\.sg-inspector[\s\S]*overflow: auto/)
})

test('the ShaderGradient MIT boundary and local guide are retained', async () => {
  const [notice, scope, guide, license] = await Promise.all([
    read('../../THIRD_PARTY_NOTICES.md'),
    read('../../LICENSE-SCOPE.md'),
    read('../../docs/LOCAL-SHADERGRADIENT-LAB.md'),
    read('../../licenses/ShaderGradient-MIT.txt'),
  ])

  assert.match(notice, /ShaderGradient React.*2\.4\.20/)
  assert.match(scope, /ShaderGradient remains MIT material/)
  assert.match(guide, /does \*\*not\*\* replace/)
  assert.match(license, /Copyright \(c\) ruucm, stone-skipper/)
  assert.match(license, /Permission is hereby granted/)
})
