import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { createMotionTrace, TRACE_CAPACITY, TRACE_WINDOW_MS } from './trace-model.js';

// An acceleration-space instrument: camera movement never changes sensor axes.
const defaultAngle = Math.atan2(4, -6);
const world = ([x, y, z]) => new THREE.Vector3(x, z, -y);
const edges = [];
for (let axis = 0; axis < 3; axis++) for (const a of [-1, 1]) for (const b of [-1, 1]) {
  const p = [-1, a, b], q = [1, a, b];
  edges.push([p.map((_, i) => p[(i + axis) % 3]), q.map((_, i) => q[(i + axis) % 3])]);
}
const grid = [];
for (const n of [-.5, 0, .5]) {
  grid.push([[-1, n, -1], [1, n, -1]], [[n, -1, -1], [n, 1, -1]],
    [[-1, 1, n], [1, 1, n]], [[n, 1, -1], [n, 1, 1]],
    [[-1, -1, n], [-1, 1, n]], [[-1, n, -1], [-1, n, 1]]);
}
const labels = [
  { text: 'X', point: [1.4, -1, -1] }, { text: 'Y', point: [-1, 1.4, -1] }, { text: 'Z', point: [-1, -1, 1.23] },
  { value: -1, point: [-1.15, -1, -1.15] },
  ...[0, 1].flatMap(n => [{ value: n, point: [n, -1, -1.15] }, { value: n, point: [-1.15, n, -1] }, { value: n, point: [-1.15, -1, n] }]),
];
const phoneCorners = [[-.28,-.53,0],[.28,-.53,0],[.28,.53,0],[-.28,.53,0],[-.28,-.53,0]];

export function MotionTrace({ getSample, onTelemetry, resetKey = 0, themeKey = "" }) {
  const root = useRef(null), canvas = useRef(null), overlay = useRef(null), phone = useRef(null), reset = useRef(() => {});
  const recolor = useRef(() => {});
  const callbacks = useRef({ getSample, onTelemetry }); callbacks.current = { getSample, onTelemetry };
  const [status, setStatus] = useState('webgl2');
  useEffect(() => {
    const element = root.current, svg = overlay.current, phoneSvg = phone.current;
    let renderer, disposed = false, lost = false, raf = 0, width = 300, height = 300;
    let angle = defaultAngle, lastFrame = -Infinity, reportAt = performance.now(), frames = 0, losses = 0;
    let drag = null, range = 1, lastData = null, hadData = false, drawDirty = true;
    const model = createMotionTrace(), scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1.9, 1.9, 1.9, -1.9, .1, 50);
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const positions = new Float32Array(TRACE_CAPACITY * 6 * 3), colours = new Float32Array(TRACE_CAPACITY * 6 * 3);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage));
    geometry.setAttribute('color', new THREE.BufferAttribute(colours, 3).setUsage(THREE.DynamicDrawUsage));
    geometry.setDrawRange(0, 0);
    const ink = new THREE.Color(getComputedStyle(element).getPropertyValue('--ui-chart-primary').trim() || '#ed2d24');
    const material = new THREE.MeshBasicMaterial({ vertexColors: true, depthTest: false, side: THREE.DoubleSide });
    const trailA = new THREE.Vector3(), trailB = new THREE.Vector3(), side = new THREE.Vector3(), viewDirection = new THREE.Vector3();
    const stripVertices = [[trailA,1],[trailA,-1],[trailB,1],[trailB,1],[trailA,-1],[trailB,-1]];
    const line = new THREE.Mesh(geometry, material); line.frustumCulled = false; scene.add(line);
    const tipGeometry = new THREE.SphereGeometry(.027, 10, 8), tipMaterial = new THREE.MeshBasicMaterial({ color: ink });
    recolor.current = () => {
      ink.set(getComputedStyle(element).getPropertyValue('--ui-chart-primary').trim() || '#ed2d24');
      tipMaterial.color.copy(ink); drawDirty = true;
    };
    const tip = new THREE.Mesh(tipGeometry, tipMaterial); tip.visible = false; scene.add(tip);
    const phoneCamera = new THREE.PerspectiveCamera(35, 1, .1, 20); phoneCamera.position.set(1.1, .7, 3.8); phoneCamera.lookAt(0, 0, 0); phoneCamera.updateMatrixWorld();
    const quaternion = new THREE.Quaternion();
    const path = (list, cam = camera, w = width, h = height, rotate = false) => list.map((p, i) => {
      const v = cam === camera ? world(p) : new THREE.Vector3(...p);
      if (rotate) v.applyQuaternion(quaternion);
      v.project(cam); return `${i ? 'L' : 'M'}${(v.x + 1) * w / 2},${(1 - v.y) * h / 2}`;
    }).join(' ');
    function guides() {
      drawDirty = true;
      camera.position.set(Math.sin(angle) * 7.2, 3.8, Math.cos(angle) * 7.2); camera.lookAt(0, 0, 0); camera.updateMatrixWorld();
      svg.querySelector('[data-edges]').setAttribute('d', edges.map(e => path(e)).join(' '));
      svg.querySelector('[data-grid]').setAttribute('d', grid.map(e => path(e)).join(' '));
      svg.querySelectorAll('[data-axis-label]').forEach((el, i) => {
        const p = world(labels[i].point).project(camera);
        el.setAttribute('x', (p.x + 1) * width / 2); el.setAttribute('y', (1 - p.y) * height / 2);
        el.textContent = labels[i].text ?? (labels[i].value * range).toFixed(range < 10 ? 1 : 0);
      });
    }
    function drawPhone(tilt) {
      const length = tilt ? Math.hypot(...tilt) : 0;
      quaternion.setFromAxisAngle(length ? new THREE.Vector3(...tilt).normalize() : new THREE.Vector3(0,0,1), length * Math.PI / 180);
      phoneSvg.querySelector('[data-phone]').setAttribute('d', path(phoneCorners, phoneCamera, 90, 90, true));
      phoneSvg.querySelector('[data-speaker]').setAttribute('d', path([[-.09,.45,0],[.09,.45,0]], phoneCamera, 90, 90, true));
      [[.85,0,0],[0,.95,0],[0,0,.85]].forEach((p, i) => {
        phoneSvg.querySelector(`[data-phone-axis="${i}"]`).setAttribute('d', path([[0,0,0],p],phoneCamera,90,90,true));
        const v = new THREE.Vector3(...p).multiplyScalar(1.15).applyQuaternion(quaternion).project(phoneCamera);
        const label = phoneSvg.querySelector(`[data-phone-label="${i}"]`);
        label.setAttribute('x',(v.x+1)*45);label.setAttribute('y',(1-v.y)*45);
      });
      phoneSvg.dataset.live = Boolean(tilt);
    }
    function resized() {
      const bounds = element.getBoundingClientRect(); width = Math.max(1,bounds.width); height = Math.max(1,bounds.height);
      camera.left = -1.9 * width / height; camera.right = 1.9 * width / height; camera.updateProjectionMatrix();
      renderer?.setSize(width, height, false); guides();
    }
    function publish(mode, data = lastData) {
      setStatus(mode);
      callbacks.current.onTelemetry?.({ traceRenderer: mode, tracePoints: data?.points.length ?? 0,
        traceRange: data?.range ?? 1, traceFps: frames * 1000 / Math.max(1, performance.now() - reportAt), traceContextLosses: losses });
      frames = 0; reportAt = performance.now();
    }
    function frame() {
      const now = performance.now();
      raf = 0;
      if (disposed || lost || document.visibilityState !== 'visible') return;
      raf = requestAnimationFrame(frame);
      const period = reduced.matches ? 200 : 1000 / 30;
      if (now - lastFrame < period) return;
      lastFrame = Number.isFinite(lastFrame) ? now - (now-lastFrame) % period : now;
      try {
      lastData = model.update(callbacks.current.getSample?.(), now);
      if (!lastData && !hadData && !drawDirty) {
        if (now - reportAt >= 1000) publish('webgl2');
        return;
      }
      hadData = Boolean(lastData);
      const nextRange = lastData?.range ?? 1;
      if (nextRange !== range) { range = nextRange; guides(); }
      const points = lastData?.points ?? [];
      let offset = 0;
      viewDirection.copy(camera.position).normalize();
      if (!reduced.matches) for (let i = 1; i < points.length; i++) {
        const previous = points[i-1], current = points[i];
        trailA.set(previous.value[0]/range,previous.value[2]/range,-previous.value[1]/range);
        trailB.set(current.value[0]/range,current.value[2]/range,-current.value[1]/range);
        side.copy(trailB).sub(trailA).cross(viewDirection).normalize().multiplyScalar(.012);
        for (const [vertex, sign] of stripVertices) {
          positions[offset] = vertex.x + side.x*sign; positions[offset+1] = vertex.y+side.y*sign; positions[offset+2] = vertex.z+side.z*sign;
          const point = vertex === trailA ? previous : current;
          const fade = Math.max(.04, 1 - (now-point.at) / TRACE_WINDOW_MS);
          colours[offset] = ink.r*fade; colours[offset+1] = ink.g*fade; colours[offset+2] = ink.b*fade; offset += 3;
        }
      }
      geometry.setDrawRange(0, offset / 3); geometry.attributes.position.needsUpdate = true; geometry.attributes.color.needsUpdate = true;
      tip.visible = Boolean(points.length && !lastData?.clipped);
      if (tip.visible) tip.position.copy(world(points.at(-1).value.map(n => n / range)));
      drawPhone(lastData?.tilt);
      element.querySelector('[data-trace-state]').textContent = lastData?.clipped ? 'OUT OF RANGE' : lastData ? (reduced.matches ? 'REDUCED MOTION' : 'TRAIL 3 s') : 'AWAITING ZERO & FRESH DATA';
      renderer.render(scene, camera); frames += 1; drawDirty = false;
      if (now - reportAt >= 1000) publish('webgl2');
      } catch { lost = true; cancelAnimationFrame(raf); raf = 0; model.clear(); publish('error', null); }
    }
    function startFrames() { if (!raf && !disposed && !lost && renderer && document.visibilityState === 'visible') raf = requestAnimationFrame(frame); }
    function visibility() {
      cancelAnimationFrame(raf); raf = 0; model.clear(); lastData = null; tip.visible = false; geometry.setDrawRange(0,0); drawPhone(null);
      frames = 0; reportAt = performance.now(); drawDirty = true; startFrames();
    }
    function contextLost(e) { e.preventDefault(); lost = true; losses += 1; cancelAnimationFrame(raf); raf = 0; model.clear(); drawPhone(null); publish('context-lost', null); }
    function contextRestored() { lost = false; model.clear(); publish('webgl2', null); resized(); startFrames(); }
    function pointerDown(e) { if (e.isPrimary && e.button === 0) drag = { id: e.pointerId, x: e.clientX, y: e.clientY, angle }; }
    function pointerMove(e) {
      if (!drag || e.pointerId !== drag.id) return;
      const dx = e.clientX-drag.x, dy = e.clientY-drag.y;
      if (Math.abs(dx) < 8 || Math.abs(dx) < Math.abs(dy)) return;
      angle = drag.angle - dx * .008; guides();
    }
    const pointerUp = () => { drag = null; };
    function keyDown(e) {
      if (!['ArrowLeft','ArrowRight','Home'].includes(e.key)) return;
      e.preventDefault(); angle = e.key === 'Home' ? defaultAngle : angle + (e.key === 'ArrowLeft' ? -.15 : .15); guides();
    }
    reset.current = () => { angle = defaultAngle; guides(); };
    const observer = new ResizeObserver(resized); observer.observe(element);
    element.addEventListener('pointerdown',pointerDown); element.addEventListener('pointermove',pointerMove);
    element.addEventListener('pointerup',pointerUp); element.addEventListener('pointercancel',pointerUp); element.addEventListener('pointerleave',pointerUp); element.addEventListener('keydown',keyDown);
    drawPhone(null); resized();
    try {
      // Each effect owns its canvas, including React's development remount probe.
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
      canvas.current.appendChild(renderer.domElement);
      renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.75)); renderer.setClearColor(0x0f0f0f, 0);
      renderer.domElement.addEventListener('webglcontextlost', contextLost); renderer.domElement.addEventListener('webglcontextrestored', contextRestored);
      resized(); publish('webgl2'); startFrames();
    } catch { publish('unavailable', null); }
    document.addEventListener('visibilitychange', visibility);
    return () => {
      recolor.current = () => {};
      disposed = true; cancelAnimationFrame(raf); observer.disconnect(); model.clear();
      document.removeEventListener('visibilitychange', visibility);
      element.removeEventListener('pointerdown',pointerDown);element.removeEventListener('pointermove',pointerMove);element.removeEventListener('pointerup',pointerUp);element.removeEventListener('pointercancel',pointerUp);element.removeEventListener('pointerleave',pointerUp);element.removeEventListener('keydown',keyDown);
      const target = renderer?.domElement;
      target?.removeEventListener('webglcontextlost',contextLost);target?.removeEventListener('webglcontextrestored',contextRestored);
      geometry.dispose(); material.dispose(); tipGeometry.dispose(); tipMaterial.dispose(); renderer?.dispose(); renderer?.forceContextLoss(); target?.remove();
    };
  }, []);
  useEffect(() => { reset.current(); }, [resetKey]);
  useEffect(() => { recolor.current(); }, [themeKey]);
  return <div className="trace-plot" data-renderer={status} ref={root} tabIndex={0} role="img" aria-label="Three-dimensional acceleration history. Drag sideways or use left and right arrows to turn the view; Home recenters it.">
    <div className="trace-canvas" ref={canvas} aria-hidden="true"/>
    <svg ref={overlay} className="trace-grid" aria-hidden="true"><path data-grid/><path data-edges/>{labels.map((_,i)=><text key={i} data-axis-label={i} className={i<3?'trace-axis':'trace-tick'}/>)}</svg>
    <svg ref={phone} className="trace-phone" viewBox="-8 -8 106 106" aria-hidden="true"><path data-phone/><path data-speaker/>{['X','Y','Z'].map((axis,i)=><g key={axis} className={`trace-phone-axis-${i}`}><path data-phone-axis={i}/><text data-phone-label={i}>{axis}</text></g>)}</svg>
    <span className="trace-state" data-trace-state>AWAITING ZERO & FRESH DATA</span>
    {status !== 'webgl2' && <span className="trace-unavailable" role="status">{status === 'context-lost' ? '3D paused · waiting for graphics recovery' : '3D unavailable · sensor values remain below'}</span>}
  </div>;
}
