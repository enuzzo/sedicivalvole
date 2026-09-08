import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { createHash, webcrypto } from "node:crypto";
import vm from "node:vm";
import { build } from "esbuild";
import { createEngineMotion } from "../src/engine/motion.js";
import { decideAutomaticGear, virtualRpm } from "../src/engine/gearbox.js";

const root = new URL("../", import.meta.url);
const inventory = JSON.parse(readFileSync(new URL("src/engine/source-inventory.json", root)));
const bundled = await build({ stdin: { contents: 'export {createGeapsRuntime} from "./src/engine/runtime.js"; export {ENGINE_PROFILES} from "./src/engine/profiles.js";', resolveDir: root.pathname }, bundle: true, format: "cjs", platform: "node", write: false,
  plugins: [{ name: "test-audio-worklet-url", setup(plugin) {
    plugin.onResolve({ filter: /\?audio-worklet$/ }, args => ({ path: args.path, namespace: "test-audio-worklet" }));
    plugin.onLoad({ filter: /.*/, namespace: "test-audio-worklet" }, () => ({ contents: 'export default "/assets/test-engine-worklet.js";', loader: "js" }));
  } }],
});
class Param {
  value = 0; events = [];
  cancelAndHoldAtTime(t) { this.events.push(["hold", t]); }
  setTargetAtTime(v, t, tau) { assert.ok(Number.isFinite(v) && Number.isFinite(t) && tau > 0); this.value = v; this.events.push(["target",v,t,tau]); }
  linearRampToValueAtTime(v,t) { assert.ok(Number.isFinite(v) && Number.isFinite(t)); this.value = v; this.events.push(["ramp",v,t]); }
  setValueAtTime(v,t) { assert.ok(Number.isFinite(v) && Number.isFinite(t)); this.value = v; this.events.push(["set",v,t]); }
}
const eventSurface = () => {
  const listeners = new Map();
  return { addEventListener(type, fn) { if (!listeners.has(type)) listeners.set(type, new Set()); listeners.get(type).add(fn); },
    removeEventListener(type, fn) { listeners.get(type)?.delete(fn); },
    dispatch(type) { for (const fn of listeners.get(type) ?? []) fn(); },
  };
};
function fixture({ fail = false, manual = false, worklet = false, workletFailure = false, pendingWorklet = false, resolveProfile } = {}) {
  const timers = new Map(); let serial = 0, time = 0, failures = fail, requests = 0;
  let releaseModule;
  const moduleGate = pendingWorklet ? new Promise(resolve => { releaseModule = resolve; }) : Promise.resolve();
  const context = { ...eventSurface(), currentTime: 0, sampleRate: 48000, state: "running", sources: [], gains: [], voices: [], moduleUrls: [],
    createGain() { const node = { gain: new Param(), connect(to) { return to; }, disconnect() {} }; this.gains.push(node); return node; },
    createDynamicsCompressor: () => ({ threshold: new Param(), knee: new Param(), ratio: new Param(), attack: new Param(), release: new Param(), connect(to) { return to; }, disconnect() {} }),
    createBufferSource() { const source = { detune: new Param(), connect(to) { return to; }, start(at) { this.started = at; }, stop(at) { this.stopped = at ?? 0; }, disconnect() {} }; this.sources.push(source); return source; },
    decodeAudioData: async () => ({ length: 48000, numberOfChannels: 2, getChannelData: () => new Float32Array(48000).fill(0.1) }),
  };
  if (worklet) context.audioWorklet = { async addModule(url) { context.moduleUrls.push(url); await moduleGate; if (workletFailure) throw new Error("Worklet module unavailable"); } };
  class MockAudioWorkletNode {
    parameters = new Map(["rpm", "load", "boost", "active", "events"].map(key => [key, new Param()]));
    messages = []; disconnected = false; closed = false;
    constructor(audioContext, name, options) {
      assert.equal(name, "sedicivalvole-engine"); assert.equal(options.numberOfInputs, 0);
      this.options = options; audioContext.voices.push(this);
      this.port = { postMessage: message => this.messages.push(message), close: () => { this.closed = true; } };
    }
    connect(target) { return target; }
    disconnect() { this.disconnected = true; }
  }
  const document = { ...eventSurface(), visibilityState: "visible" }, window = eventSurface();
  const exports = {};
  const sandbox = { exports, module: { exports }, console, crypto: webcrypto, AbortController, performance: { now: () => time },
    document, window, navigator: { onLine: true }, AudioWorkletNode: MockAudioWorkletNode,
    setInterval: fn => { const id = ++serial; timers.set(id,{fn,interval:true}); return id; },
    clearInterval: id => timers.delete(id), setTimeout: (fn, delay) => { const id = ++serial; timers.set(id,{fn,delay}); return id; }, clearTimeout: id => timers.delete(id),
    fetch: async url => { requests++; if (failures) throw new Error("offline"); const bytes = readFileSync(new URL(`public${url}`,root)); return { ok:true, arrayBuffer:async () => bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength) }; },
  };
  vm.runInNewContext(bundled.outputFiles[0].text, sandbox);
  const evidence = { speedKmh:0, drive:0, deceleration:0, freshness:"fresh", canShift:true, trustedStationary:false };
  const motion = { snapshot:() => ({...evidence}), reset:() => Object.assign(evidence,{freshness:"lost",canShift:false,trustedStationary:false}) };
  const events = [];
  const runtime = sandbox.module.exports.createGeapsRuntime({context,destination:{},motion,now:()=>time,allowManual:manual,resolveProfile,onEvent:(type,detail)=>events.push({type,...detail})});
  return { runtime, context, evidence, events, profiles: sandbox.module.exports.ENGINE_PROFILES, timers, document, window,
    releaseWorklet() { releaseModule?.(); },
    setFailure(value) { failures=value; }, get requests() { return requests; },
    async retry() { const entry = [...timers].find(([,t])=>!t.interval && [5000,10000,20000,30000].includes(t.delay)); assert.ok(entry); timers.delete(entry[0]); entry[1].fn(); await new Promise(resolve=>setTimeout(resolve,80)); },
    tick(seconds=.025) { time+=seconds*1000; context.currentTime+=seconds; for(const t of [...timers.values()]) if(t.interval)t.fn(); },
  };
}
const gps = (model, t, speed, overrides={}) => model.observe({source:"GPS",rawSpeedKmh:speed,sourceTimestampMs:100000+t,epochNowMs:100000+t,receivedMs:t,accuracyM:10,...overrides});

test("source inventory identifies all byte-exact WAVs and the MIT grant", () => {
  assert.equal(inventory.audio.length,16);
  for (const item of inventory.code) assert.equal(createHash("sha256").update(readFileSync(new URL(item.local,root))).digest("hex"), item.localSha256);
  for(const asset of inventory.audio) { const bytes=readFileSync(new URL(`public${asset.url}`,root)); assert.equal(bytes.length,asset.bytes); assert.equal(createHash("sha256").update(bytes).digest("hex"),asset.sha256); }
  assert.match(readFileSync(new URL("public/engine-audio/LICENSE",root),"utf8"),/Mark Oosting/);
});
test("GPS acquisition age, missing speed, poor accuracy and replay cannot create standstill", () => {
  const m=createEngineMotion();
  for(const data of [{rawSpeedKmh:null},{accuracyM:900},{sourceTimestampMs:90000},{accuracyM:-1}]) { gps(m,0,0,data); assert.equal(m.snapshot(500).trustedStationary,false); }
  gps(m,1000,0); gps(m,1400,0); assert.equal(m.snapshot(1400).trustedStationary,true);
  gps(m,1800,0,{sourceTimestampMs:101400}); assert.equal(m.snapshot(3401).freshness,"degraded");
  assert.equal(m.snapshot(6500).freshness,"lost");
});
test("standstill requires distinct exact zeros; tiny movement, lifecycle and source switches revoke it", () => {
  const m=createEngineMotion(); gps(m,0,0); assert.equal(m.snapshot(400).trustedStationary,false);
  gps(m,400,0); assert.equal(m.snapshot(400).trustedStationary,true);
  gps(m,800,.001); assert.equal(m.snapshot(800).trustedStationary,false);
  gps(m,1200,0); gps(m,1600,0); m.reset("hidden"); assert.equal(m.snapshot(1600).trustedStationary,false);
  gps(m,2000,0); gps(m,2400,0); m.observe({source:"Demo",receivedMs:2500,rawSpeedKmh:0}); assert.equal(m.snapshot(2500).trustedStationary,false);
});
test("outliers revoke confidence; reacquisition resets acceleration and forbids an immediate shift", () => {
  const m=createEngineMotion(); gps(m,0,20); gps(m,100,120); assert.equal(m.snapshot(100).freshness,"lost");
  gps(m,1000,25); assert.equal(m.snapshot(1000).accelerationMps2,0); assert.equal(m.snapshot(1000).canShift,false);
  gps(m,2000,30); assert.equal(m.snapshot(2000).canShift,true); assert.ok(m.snapshot(2000).drive>0.15);
});
test("automatic gearbox covers upshift, downshift, kickdown, stale freeze and redline protection", () => {
  const f=fixture(); const profile=f.profiles[0], drive={gears:[3.4,2.36,1.85,1.47,1.24,1.07],final_drive:3.44};
  const choose=overrides=>decideAutomaticGear({gear:1,speedKmh:75,drive:.3,canShift:true,heldSeconds:2,...overrides},profile,drive);
  assert.equal(choose({}).reason,"upshift"); assert.equal(choose({gear:3,speedKmh:20}).reason,"downshift");
  assert.equal(choose({gear:4,speedKmh:52,drive:1}).reason,"kickdown");
  assert.equal(choose({canShift:false}),null); assert.equal(choose({heldSeconds:.2}),null);
  assert.equal(choose({gear:2,speedKmh:130,drive:1}).reason,"upshift"); assert.ok(virtualRpm(130,1,drive)>9000); f.runtime.destroy();
});
test("runtime loads only the selected bank, survives network failure and retries automatically", async () => {
  const f=fixture({fail:true}); f.runtime.setEnabled(true); assert.equal(await f.runtime.load("mono"),false); assert.equal(f.runtime.getState().status,"retrying");
  f.setFailure(false); await f.retry(); assert.equal(f.runtime.getState().status,"ready"); assert.equal(f.context.sources.length,7); assert.equal(new Set(f.context.sources.map(s=>s.started)).size,1);
  f.runtime.destroy(); assert.equal(f.timers.size,0);
});
test("disable cancels retries and rev; public runtime refuses MANUAL", async () => {
  const f=fixture({fail:true}); f.runtime.setEnabled(true); await f.runtime.load(); f.runtime.setEnabled(false); assert.equal(f.timers.size,0);
  assert.equal(f.runtime.setTransmissionMode("MANUAL"),false); assert.equal(f.runtime.requestGear(2),false); assert.equal(f.runtime.setRevHeld(true),false); f.runtime.destroy();
});
test("scheduled upshift commits exactly once using audio time with bounded detune", async () => {
  const f=fixture(); f.runtime.setEnabled(true); await f.runtime.load(); f.tick(); f.evidence.speedKmh=25;
  for(let i=0;i<65;i++)f.tick();
  assert.equal(f.events.filter(e=>e.type==="engine.shift.scheduled").length,1); assert.equal(f.events.filter(e=>e.type==="engine.shift.committed").length,1); assert.equal(f.runtime.getState().gear,2);
  for(const source of f.context.sources) for(const event of source.detune.events) if(event[0]!=="hold") assert.ok(Math.abs(event[1])<=2400);
  f.tick(2); assert.equal(f.evidence.freshness,"lost"); assert.equal(f.runtime.getState().shift,null); f.runtime.destroy();
});
test("show-off revalidates evidence, ends before eight seconds and releases on movement", async () => {
  const f=fixture(); f.runtime.setEnabled(true); await f.runtime.load(); f.evidence.trustedStationary=true; f.tick(); assert.equal(f.runtime.setRevHeld(true),true);
  for(let i=0;i<325;i++) f.tick(); assert.equal(f.runtime.getState().revving,false);
  f.runtime.setRevHeld(true); f.evidence.trustedStationary=false; f.evidence.speedKmh=2; f.tick(); assert.equal(f.runtime.getState().revving,false); assert.equal(f.runtime.setRevHeld(true),false); f.runtime.destroy();
});
test("LAB manual gear requests use the same scheduled path and reject unsafe ratios", async () => {
  const f=fixture({manual:true}); f.runtime.setEnabled(true); await f.runtime.load(); f.runtime.setTransmissionMode("MANUAL");
  assert.equal(f.runtime.requestGear(3),true); for(let i=0;i<20;i++)f.tick(); assert.equal(f.runtime.getState().gear,3);
  f.evidence.speedKmh=160; assert.equal(f.runtime.requestGear(1),false); assert.equal(f.runtime.requestGear(7),false); f.runtime.destroy();
});

test("leaving Engine frees the decoded bank and all sample loops", async () => {
  const f=fixture(); f.runtime.setEnabled(true); await f.runtime.load(); f.runtime.unload();
  assert.equal(f.runtime.getState().decodedBytes,0); assert.equal(f.timers.size,0);
  assert.ok(f.context.sources.every(source=>source.stopped!==undefined)); f.runtime.destroy();
});


test("small periodic idle blips stop on movement, manual rev and disable", async () => {
  const f = fixture(); f.runtime.setEnabled(true); await f.runtime.load();
  f.evidence.trustedStationary = true;
  let maximum = 0, blips = 0, previous = false;
  for (let i = 0; i < 480; i++) {
    f.tick(); const s = f.runtime.getState(); maximum = Math.max(maximum, s.rpm);
    if (s.idleBlip && !previous) blips++; previous = s.idleBlip;
  }
  assert.equal(blips, 2); assert.ok(maximum >= 1750 && maximum <= 1800);
  f.runtime.setRevHeld(true); f.tick();
  assert.equal(f.runtime.getState().idleBlip, false);
  f.runtime.releaseRev(); f.evidence.trustedStationary = false;
  for (let i = 0; i < 240; i++) { f.tick(); assert.equal(f.runtime.getState().idleBlip, false); }
  f.runtime.setEnabled(false); assert.equal(f.runtime.getState().idleBlip, false);
  f.runtime.destroy();
});

test("stationary GPS renewal never overlaps and ignores late callbacks after cancellation", async () => {
  const { startStationaryRefresh } = await import('../src/engine/stationary-refresh.js');
  let tick, allowed = true, calls = 0, success, failure, received = 0, cleared = false;
  const stop = startStationaryRefresh({
    geolocation: { getCurrentPosition(ok, fail, options) { calls++; success = ok; failure = fail; assert.equal(options.maximumAge, 0); assert.equal(options.timeout, 3000); } },
    eligible: () => allowed, onPosition: () => received++, interval: fn => { tick = fn; return 7; }, clear: id => { assert.equal(id, 7); cleared = true; },
  });
  tick(); tick(); assert.equal(calls, 1);
  success({ timestamp: 100 }); assert.equal(received, 1);
  tick(); failure(); tick(); assert.equal(calls, 3);
  allowed = false; success({ timestamp: 200 }); tick(); assert.equal(received, 1); assert.equal(calls, 3);
  allowed = true; tick(); stop(); success({ timestamp: 300 }); tick();
  assert.equal(received, 1); assert.equal(cleared, true); assert.equal(calls, 4);
});


test("Engine level stays constant on lift, downshift and lost-signal idle", async () => {
  const f = fixture({ manual: true }); f.runtime.setEnabled(true); await f.runtime.load();
  f.evidence.speedKmh = 35; f.evidence.drive = 1;
  f.runtime.setTransmissionMode("MANUAL"); f.runtime.requestGear(3);
  for (let i = 0; i < 24; i++) f.tick();
  f.evidence.drive = 0; f.evidence.deceleration = 1; f.runtime.requestGear(2);
  for (let i = 0; i < 24; i++) f.tick();
  assert.equal(f.runtime.getState().gear, 2);
  f.evidence.freshness = "lost"; f.evidence.canShift = false; f.tick();
  const levels = f.context.gains[0].gain.events.filter(e => e[0] === "target" && e[1] !== 0);
  assert.ok(levels.length > 20); assert.ok(levels.every(e => e[1] === .16));
  const shifts = f.events.filter(event => event.type === "engine.shift.scheduled");
  assert.equal(shifts.length, 2);
  for (const event of shifts) {
    assert.ok(event.effectiveContextTime < event.releaseAt && event.releaseAt < event.syncAt && event.syncAt < event.endAt);
    // Every sample renderer reaches the same release, synchronization and return boundaries.
    for (const gain of f.context.gains.slice(1)) for (const boundary of [event.releaseAt, event.syncAt, event.endAt]) {
      assert.ok(gain.gain.events.some(ramp => ramp[0] === "ramp" && ramp[2] === boundary));
    }
  }
  f.runtime.destroy();
});


test("show-off repeatedly rises and falls in neutral, reaches the limiter and returns to idle", async () => {
  const f=fixture(); f.runtime.setEnabled(true); await f.runtime.load();
  f.evidence.trustedStationary=true; f.evidence.speedKmh=0; f.tick();
  f.runtime.setRevHeld(true); const states=[];
  for(let i=0;i<260;i++) { f.tick(); states.push(f.runtime.getState()); }
  const active=states.filter(s=>s.revving);
  assert.ok(active.length>100 && active.length<230);
  assert.ok(Math.max(...active.map(s=>s.rpm))>8500);
  assert.ok(active.some(s=>s.showOffPhase==='limiter'));
  assert.ok(active.some(s=>s.drive===0 && s.rpm>4000));
  let peaks=0; for(let i=1;i<active.length-1;i++) if(active[i].rpm>active[i-1].rpm && active[i].rpm>active[i+1].rpm) peaks++;
  assert.ok(peaks>=4, `Expected several revs and limiter pulses, got ${peaks}`);
  assert.ok(active.every(s=>s.gear===1 && s.shift==null && !s.idleBlip));
  assert.equal(states.at(-1).rpm,600); assert.equal(states.at(-1).revving,false);
  f.runtime.destroy();
});
test("show-off timing and peaks vary but stay bounded for every profile limit", async () => {
  const { createShowOff }=await import('../src/engine/show-off.js');
  const traces=[];
  for(const random of [()=>0,()=>.5,()=>1]) for(const limit of [8900,9000]) {
    const gesture=createShowOff(random);gesture.start(10,1000,limit);const trace=[];
    for(let i=0;i<300;i++){const s=gesture.sample(10+i*.025);if(s){assert.ok(s.rpm>=600 && s.rpm<=limit);trace.push(Math.round(s.rpm));}}
    assert.ok(trace.length>100 && trace.length<230);assert.equal(gesture.sample(18),null);traces.push(trace);
    gesture.start(20,2000,limit);gesture.reset();assert.equal(gesture.sample(20.1),null);
  }
  assert.notDeepEqual(traces[0],traces[2]);
});


test("runtime keeps city cruise restrained and has sustained power by 80 across piston voices", async () => {
  for(const id of ['mono','rosso','touring','otto','cinque']) {
    const f=fixture({worklet:true}); f.runtime.setEnabled(true); await f.runtime.load(id);
    f.evidence.drive=.15; f.evidence.accelerationMps2=0; f.tick();
    for(const speed of [20,30,40,80]) {
      f.evidence.speedKmh=speed; f.evidence.rawSpeedKmh=speed;
      for(let i=0;i<240;i++)f.tick();
      const state=f.runtime.getState();
      assert.equal(state.shift,null);
      assert.ok(state.rpm>1000 && state.rpm<(speed<=40?3100:4600),`${id} at ${speed}: ${state.rpm}`);
      if(speed===80)assert.ok(state.rpm>3000,`${id} power at 80: ${state.rpm}`);
    }
    f.runtime.destroy();
  }
});
test("road shift ladder retains separate downshift and kickdown margins", () => {
  const f=fixture();for(const profile of f.profiles.filter(p=>!p.singleSpeed)){const d=profile.configuration.drivetrain;
    for(let gear=2;gear<=6;gear++){
      const threshold=profile.upshiftKmh[gear-2];
      for(const delta of [-1,0,1])assert.equal(decideAutomaticGear({gear,speedKmh:threshold+delta,drive:.2,canShift:true,heldSeconds:2},profile,d),null);
      assert.equal(decideAutomaticGear({gear,speedKmh:profile.downshiftKmh[gear-2],drive:0,canShift:true,heldSeconds:2},profile,d)?.reason,'downshift');
    }
  }f.runtime.destroy();
});

test("loading and reacquiring at road speed avoid a first-gear flare and keep true speed above the acoustic cap", async () => {
  for (const id of ['mono','rosso','touring','otto','cinque','turbine']) {
    const f=fixture({worklet:true});
    f.evidence.speedKmh=80; f.evidence.rawSpeedKmh=80; f.evidence.drive=.15; f.evidence.accelerationMps2=0;
    f.runtime.setEnabled(true); await f.runtime.load(id);
    const initial=[]; for(let i=0;i<160;i++){f.tick();initial.push(f.runtime.getState());}
    assert.ok(initial.every(s=>s.rpm<6000 && !s.shift),id);
    assert.equal(f.events.filter(e=>e.type==='engine.shift.scheduled').length,0);
    if(id!=='turbine')assert.ok(f.runtime.getState().gear>=4);
    f.evidence.freshness='lost';f.evidence.canShift=false;for(let i=0;i<80;i++)f.tick();
    f.evidence.speedKmh=130;f.evidence.rawSpeedKmh=130;f.evidence.freshness='fresh';f.evidence.canShift=true;
    for(let i=0;i<240;i++)f.tick();
    const ceiling=f.runtime.getState();
    f.evidence.speedKmh=160;f.evidence.rawSpeedKmh=160;for(let i=0;i<240;i++)f.tick();
    const above=f.runtime.getState();
    assert.equal(above.motionSpeedKmh,160);assert.equal(above.gear,ceiling.gear);
    assert.ok(Math.abs(above.rpm-ceiling.rpm)<=1,`${id}: ${above.rpm}/${ceiling.rpm}`);
    assert.ok(Math.abs(above.drive-ceiling.drive)<1e-8);
    assert.equal(f.events.filter(e=>e.type==='engine.shift.scheduled').length,0);
    f.runtime.destroy();
  }
});

test("full-demand top gear engages below the asymptotic GPS ceiling", () => {
  const f=fixture();
  for(const profile of f.profiles.filter(p=>!p.singleSpeed)) {
    const decision=decideAutomaticGear({gear:5,speedKmh:129.999999,drive:1,canShift:true,heldSeconds:2},profile,profile.configuration.drivetrain);
    assert.equal(decision?.gear,6,profile.id);
  }
  f.runtime.destroy();
});

test("a newly selected bank uses bounded held road speed during a degraded GPS interval without shifting", async () => {
  const f=fixture({worklet:true});f.runtime.setEnabled(true);await f.runtime.load('mono');f.tick();
  Object.assign(f.evidence,{speedKmh:80,rawSpeedKmh:80,drive:0,freshness:'degraded',canShift:false});
  await f.runtime.load('otto');
  for(let i=0;i<160;i++){f.tick();assert.ok(f.runtime.getState().rpm<3500);}
  assert.equal(f.runtime.getState().gear,4);assert.equal(f.runtime.getState().motion,'degraded');
  assert.equal(f.events.filter(e=>e.type==='engine.shift.scheduled').length,0);
  f.evidence.freshness='lost';f.evidence.speedKmh=null;
  for(let i=0;i<120;i++)f.tick();
  assert.equal(f.runtime.getState().rpm,1000);f.runtime.destroy();
});

test("foreground and context recovery acquire the current road gear even when fresh GPS beats the next tick", async () => {
  for (const recovery of ['visibilitychange','statechange','source-generation']) {
    const f=fixture({worklet:true});f.evidence.generation=1;f.runtime.setEnabled(true);await f.runtime.load('mono');f.tick();
    assert.equal(f.runtime.getState().gear,1);
    if(recovery==='visibilitychange')f.document.dispatch(recovery);
    else if(recovery==='statechange')f.context.dispatch(recovery);
    else f.evidence.generation++;
    Object.assign(f.evidence,{speedKmh:100,rawSpeedKmh:100,drive:.15,accelerationMps2:0,freshness:'fresh',canShift:false});
    f.tick();assert.equal(f.runtime.getState().gear,5);
    for(let i=0;i<80;i++)f.tick();
    assert.ok(f.runtime.getState().rpm<5000);assert.equal(f.runtime.getState().shift,null);
    assert.equal(f.events.filter(e=>e.type==='engine.shift.scheduled').length,0);
    f.runtime.destroy();
  }
});
test("no speed evidence never produces an automatic idle blip", async () => {
  const f=fixture();f.runtime.setEnabled(true);await f.runtime.load();f.evidence.freshness='lost';f.evidence.trustedStationary=false;
  for(let i=0;i<500;i++){f.tick();assert.equal(f.runtime.getState().idleBlip,false);assert.equal(f.runtime.getState().rpm,1000);}
  f.runtime.destroy();
});


test("confirmed idle is 600 RPM at 70 percent; show-off and real motion restore full level", async () => {
  const f=fixture(); f.runtime.setEnabled(true); await f.runtime.load();
  f.evidence.trustedStationary=true; f.evidence.rawSpeedKmh=0; f.tick();
  assert.equal(f.runtime.getState().rpm,600); assert.equal(f.runtime.getState().outputLevel,.7);
  f.runtime.setRevHeld(true); f.tick(); assert.equal(f.runtime.getState().outputLevel,1);
  f.runtime.releaseRev(); f.tick(); assert.equal(f.runtime.getState().outputLevel,.7);
  f.evidence.trustedStationary=false; f.evidence.rawSpeedKmh=.2; f.tick();
  assert.equal(f.runtime.getState().outputLevel,.7);
  f.evidence.freshness="lost"; f.evidence.rawSpeedKmh=5; f.tick();
  assert.equal(f.runtime.getState().outputLevel,.7);
  f.evidence.freshness="fresh"; f.evidence.rawSpeedKmh=2; f.evidence.speedKmh=2; f.tick();
  assert.equal(f.runtime.getState().outputLevel,1);
  f.evidence.drive=0; f.evidence.deceleration=1; f.tick();
  assert.equal(f.runtime.getState().outputLevel,1); f.runtime.destroy();
});

test("automatic idle gestures last 1.2 seconds and peak 1200 RPM above idle", async () => {
 const {createIdleBlip}=await import('../src/engine/idle-blip.js');const blip=createIdleBlip();
 assert.equal(blip.sample(0,true),0);assert.ok(blip.sample(5.6,true)>1199);
 assert.ok(blip.sample(6.1,true)>0);assert.equal(blip.sample(6.21,true),0);
 assert.equal(blip.sample(6.3,false),0);
});


test("manual TAMARRO needs ready audio but no GPS fix", async () => {
  const f=fixture(); f.evidence.freshness="lost"; f.evidence.speedKmh=null;
  assert.equal(f.runtime.setRevHeld(true),false);
  f.runtime.setEnabled(true); await f.runtime.load(); f.tick();
  assert.equal(f.runtime.getState().canRev,true); assert.equal(f.runtime.setRevHeld(true),true);
  let peak=0;for(let i=0;i<120;i++){f.tick();peak=Math.max(peak,f.runtime.getState().rpm);}
  assert.ok(peak>4000);f.runtime.setEnabled(false);assert.equal(f.runtime.setRevHeld(true),false);f.runtime.destroy();
});
test("live watch receipts share one monotonic clock despite stale provider timestamps", () => {
  const m=createEngineMotion();
  const watch=(t,speed)=>gps(m,t,speed,{sourceTimestampMs:90000,liveWatch:true});
  watch(0,0);gps(m,1000,0,{sourceTimestampMs:90001});
  assert.equal(m.snapshot(6000).trustedStationary,true);
  assert.equal(m.snapshot(12001).trustedStationary,false);
  watch(13000,1);watch(13100,2);watch(13200,3);
  assert.equal(m.snapshot(13200).freshness,"fresh");assert.ok(m.snapshot(13200).speedKmh>1);
  gps(m,13300,3);watch(13400,4);
  assert.equal(m.snapshot(13400).freshness,"fresh");assert.ok(m.snapshot(13400).speedKmh>2);
  watch(13500,4);m.reset("hidden");assert.equal(m.snapshot(13500).trustedStationary,false);
});

test("the observed three-second accuracy collapse holds moving RPM evidence without inventing motion", () => {
  const m = createEngineMotion();
  const watch = (time, speed, accuracyM = 6) => gps(m, time, speed, { liveWatch: true, accuracyM });
  watch(125212.9, 21);
  // Coordinate-free observations from the owner's build 20260907-1936 report.
  const poorAccuracyTrace = [
    [125362.7, 22], [125463.2, 22], [125515.9, 22], [125562.9, 22],
    [125662.9, 22], [125762.5, 23], [125864.9, 23], [125962.7, 23],
    [126063, 24], [126162.2, 24], [126262.7, 24], [126362.5, 24],
    [126462.7, 25], [126562.8, 25], [126663, 25], [126763.8, 26],
    [126880, 26], [126929.7, 27], [127030.4, 27], [127129.6, 27],
    [127229.6, 28], [127331.3, 28], [127414.7, 28], [127479.7, 29],
    [127530.1, 29], [127629.9, 30], [127730, 30], [127830.5, 31],
    [127930, 32], [128031.9, 33], [128130, 34], [128230.5, 35],
  ];
  for (const [time, speed] of poorAccuracyTrace) {
    assert.equal(watch(time, speed, 10000), false);
    const evidence = m.snapshot(time);
    assert.equal(evidence.freshness, "degraded");
    assert.equal(evidence.reason, "position-accuracy-hold");
    assert.equal(evidence.speedKmh, 21);
    assert.equal(evidence.drive, 0);
    assert.equal(evidence.canShift, false);
    assert.equal(evidence.trustedStationary, false);
    assert.equal(evidence.ageMs, time - 125212.9);
  }
  assert.equal(watch(128331.3, 36), true);
  const recovered = m.snapshot(128333.5);
  assert.equal(recovered.freshness, "fresh");
  assert.equal(recovered.speedKmh, 36);
  assert.equal(recovered.accelerationMps2, 0);
  assert.equal(recovered.canShift, false);
});

test("poor accuracy cannot renew a moving hold or create standstill, and invalid data revokes it", () => {
  const watch = (m, time, speed, overrides = {}) => gps(m, time, speed, { liveWatch: true, ...overrides });
  const m = createEngineMotion();
  watch(m, 0, 20);
  for (let time = 100; time <= 6000; time += 100) {
    watch(m, time, 0, { accuracyM: 10000 });
    assert.equal(m.snapshot(time).freshness, time <= 5000 ? "degraded" : "lost");
    assert.equal(m.snapshot(time).trustedStationary, false);
  }
  for (const invalid of [{ rawSpeedKmh: null }, { rawSpeedKmh: -1 }, { rawSpeedKmh: 300 }, { accuracyM: -1 }, { accuracyM: null }]) {
    const model = createEngineMotion();
    watch(model, 0, 20); watch(model, 100, 21, { accuracyM: 10000 });
    watch(model, 200, 21, invalid);
    assert.equal(model.snapshot(200).freshness, "lost");
  }
  for (const initialSpeed of [null, 0]) {
    const model = createEngineMotion();
    if (initialSpeed !== null) watch(model, 0, initialSpeed);
    watch(model, 500, 0, { accuracyM: 10000 });
    assert.equal(model.snapshot(500).freshness, "lost");
    assert.equal(model.snapshot(500).trustedStationary, false);
  }
  const reset = createEngineMotion();
  watch(reset, 0, 20); watch(reset, 100, 21, { accuracyM: 10000 }); reset.reset("hidden");
  assert.equal(reset.snapshot(200).freshness, "lost");
  assert.equal(reset.snapshot(200).speedKmh, null);
});

test("degraded moving evidence preserves coupled Engine RPM until the bounded hold expires", async () => {
  const f = fixture();
  f.runtime.setEnabled(true); await f.runtime.load();
  const m = createEngineMotion();
  const step = (time, accuracyM) => {
    gps(m, time, 21, { liveWatch: true, accuracyM });
    Object.assign(f.evidence, m.snapshot(time));
    f.tick(.1);
    return f.runtime.getState();
  };
  for (let time = 0; time < 1000; time += 100) step(time, 6);
  const movingRpm = f.runtime.getState().rpm;
  assert.ok(movingRpm > 1500);
  let previousLoad = f.runtime.getState().drive;
  for (let time = 1000; time <= 5900; time += 100) {
    const held = step(time, 10000);
    assert.equal(held.motion, "degraded");
    assert.ok(held.rpm >= movingRpm * .95);
    // drive now reports the acoustic load, which decays to the continuous idle texture.
    // It does not represent a measured throttle or permission to initiate a shift.
    assert.ok(held.drive >= .08 && held.drive <= previousLoad + 1e-12);
    previousLoad = held.drive;
    assert.equal(held.idleBlip, false);
    assert.equal(held.shift, null);
    assert.equal(held.canRev, false);
  }
  assert.ok(Math.abs(previousLoad - .08) < 1e-8);
  for (let time = 6000; time <= 7000; time += 100) step(time, 10000);
  assert.equal(f.runtime.getState().motion, "lost");
  assert.equal(f.runtime.getState().rpm, 1000);
  f.runtime.destroy();
});

test("an existing Engine bank keeps playing while a replacement retries and mute remains authoritative", async () => {
  const f = fixture(); f.runtime.setEnabled(true); await f.runtime.load("mono"); f.tick();
  const firstNodes = [...f.context.sources];
  f.setFailure(true); assert.equal(await f.runtime.load("rosso"), false);
  assert.equal(f.runtime.getState().status, "retrying");
  assert.equal(f.runtime.getState().profileId, "mono");
  assert.equal(f.runtime.getState().requestedProfileId, "rosso");
  assert.equal(f.runtime.getState().playing, true);
  assert.ok(firstNodes.every(source => source.stopped == null));
  f.runtime.setEnabled(false); assert.equal(f.runtime.getState().playing, false);
  f.runtime.setEnabled(true); f.setFailure(false); await f.runtime.load("rosso");
  assert.equal(f.runtime.getState().profileId, "rosso");
  assert.equal(f.runtime.getState().playing, true);
  assert.ok(firstNodes.every(source => Number.isFinite(source.stopped)));
  f.runtime.destroy();
});

test("only transmission loops fall silent at zero and Neutral while core loops remain active", async () => {
  const f = fixture(); f.runtime.setEnabled(true); await f.runtime.load("mono"); f.tick();
  const levels = () => Object.fromEntries(f.profiles[0].assets.map((asset, index) => [asset.role, f.context.gains[index + 1].gain.value]));
  assert.equal(levels().tranny_on + levels().tranny_off, 0);
  assert.ok(levels().off_low > 0);
  f.evidence.speedKmh = 20; f.evidence.rawSpeedKmh = 20; f.tick();
  assert.ok(levels().tranny_off > 0);
  f.evidence.speedKmh = 0; f.evidence.rawSpeedKmh = 0; f.evidence.trustedStationary = true; f.tick();
  assert.equal(f.runtime.setRevHeld(true), true); f.tick(.1);
  assert.equal(levels().tranny_on + levels().tranny_off, 0);
  assert.ok(levels().on_low + levels().off_low > 0);
  assert.equal(f.runtime.getState().outputLevel, 1);
  f.runtime.destroy();
});

test("hybrid shifts schedule shared sample/worklet phases once and retain a constant master", async () => {
  const f = fixture({ worklet: true, manual: true });
  f.runtime.setEnabled(true); assert.equal(await f.runtime.load("mono"), true);
  assert.equal(f.runtime.getState().source, "hybrid");
  assert.equal(f.context.moduleUrls.length, 1); assert.equal(f.context.voices.length, 1);
  f.evidence.speedKmh = 25; f.evidence.rawSpeedKmh = 25; f.evidence.drive = 1;
  f.runtime.setTransmissionMode("MANUAL");
  for (let i = 0; i < 20; i++) f.tick();
  assert.equal(f.runtime.requestGear(2), true); f.tick();
  const scheduled = f.events.find(event => event.type === "engine.shift.scheduled");
  assert.ok(scheduled); assert.equal(f.runtime.requestGear(3), false);
  const voice = f.context.voices[0];
  for (const name of ["rpm", "load", "boost"]) for (const at of [scheduled.releaseAt, scheduled.syncAt, scheduled.endAt]) {
    assert.ok(voice.parameters.get(name).events.some(event => event[0] === "ramp" && event[2] === at));
  }
  const loadRamps = voice.parameters.get("load").events.filter(event => event[0] === "ramp");
  const releaseLoad = loadRamps.find(event => event[2] === scheduled.releaseAt)[1];
  const finalLoad = loadRamps.find(event => event[2] === scheduled.endAt)[1];
  assert.ok(releaseLoad < .1 && finalLoad > .7);
  const phases = new Set();
  for (let i = 0; i < 20; i++) { f.tick(); if (f.runtime.getState().shiftPhase) phases.add(f.runtime.getState().shiftPhase); }
  assert.ok(phases.has("release") && phases.has("synchronize") && phases.has("engage"));
  assert.equal(f.events.filter(event => event.type === "engine.shift.scheduled").length, 1);
  assert.equal(f.events.filter(event => event.type === "engine.shift.committed").length, 1);
  assert.equal(f.runtime.getState().gear, 2); assert.equal(f.runtime.getState().shiftPhase, null);
  assert.ok(f.context.gains[0].gain.events.filter(event => event[0] === "target" && event[1] !== 0).every(event => event[1] === .16));
  f.runtime.destroy();
  assert.equal(voice.disconnected, true); assert.equal(voice.closed, true);
});

test("clock gaps and disable cancel a pending acoustic shift before it can commit", async () => {
  for (const cancel of ["clock-gap", "disable"]) {
    const f = fixture({ worklet: true, manual: true });
    f.runtime.setEnabled(true); await f.runtime.load("otto");
    f.evidence.speedKmh = 22; f.evidence.rawSpeedKmh = 22;
    f.runtime.setTransmissionMode("MANUAL"); f.runtime.requestGear(2); f.tick();
    assert.equal(f.runtime.getState().shift, "manual");
    f.tick(); assert.ok(f.runtime.getState().shiftPhase);
    if (cancel === "clock-gap") f.tick(1);
    else { f.runtime.setEnabled(false); f.tick(1); }
    assert.equal(f.runtime.getState().shift, null); assert.equal(f.runtime.getState().shiftPhase, null);
    assert.equal(f.runtime.getState().gear, 1);
    assert.equal(f.events.filter(event => event.type === "engine.shift.committed").length, 0);
    if (cancel === "clock-gap") assert.equal(f.evidence.freshness, "lost");
    else {
      assert.equal(f.context.voices[0].parameters.get("active").value, 0);
      assert.equal(f.runtime.getState().playing, false);
    }
    f.runtime.destroy();
  }
});

test("every procedural profile prepares without sample requests and supports bounded no-GPS TAMARRO", async () => {
  for (const id of ["otto", "cinque", "turbine"]) {
    const f = fixture({ worklet: true });
    f.evidence.freshness = "lost"; f.evidence.speedKmh = null; f.evidence.canShift = false;
    f.runtime.setEnabled(true); assert.equal(await f.runtime.load(id), true);
    assert.equal(f.runtime.getState().prepared, true); assert.equal(f.runtime.getState().source, "procedural");
    assert.equal(f.requests, 0); assert.equal(f.context.sources.length, 0); assert.equal(f.runtime.getState().decodedBytes, 0);
    f.tick(); assert.equal(f.runtime.getState().canRev, true); assert.equal(f.runtime.setRevHeld(true), true);
    let peak = 0;
    for (let i = 0; i < 180; i++) { f.tick(); peak = Math.max(peak, f.runtime.getState().rpm); }
    assert.ok(peak > 4000 && peak <= f.profiles.find(profile => profile.id === id).configuration.engine.limiter);
    assert.equal(f.events.filter(event => event.type === "engine.shift.scheduled").length, 0);
    f.runtime.setEnabled(false);
    assert.equal(f.runtime.getState().playing, false); assert.equal(f.runtime.getState().revving, false);
    assert.equal(f.context.voices[0].parameters.get("active").value, 0);
    f.runtime.unload(); assert.equal(f.runtime.getState().prepared, false);
    assert.equal(f.context.voices[0].messages.filter(message => message === "dispose").length, 1);
    f.runtime.destroy();
  }
});

test("Turbine is single-speed in AUTO and rejects LAB gear requests", async () => {
  const f = fixture({ worklet: true, manual: true }); f.runtime.setEnabled(true); await f.runtime.load("turbine");
  f.runtime.setTransmissionMode("MANUAL"); assert.equal(f.runtime.requestGear(2), false);
  f.runtime.setTransmissionMode("AUTO");
  for (let speed = 0; speed <= 130; speed += 2) {
    f.evidence.speedKmh = speed; f.evidence.rawSpeedKmh = speed; f.evidence.drive = .8;
    f.tick(.1);
  }
  assert.equal(f.runtime.getState().singleSpeed, true); assert.equal(f.runtime.getState().gear, 1);
  assert.ok(f.runtime.getState().rpm > 7000 && f.runtime.getState().rpm <= 9000);
  assert.equal(f.events.filter(event => event.type === "engine.shift.scheduled").length, 0);
  f.runtime.destroy();
});

test("late procedural preparation cannot replace the latest selected profile or interrupt its predecessor", async () => {
  const f = fixture({ worklet: true, pendingWorklet: true });
  f.runtime.setEnabled(true); await f.runtime.load("rosso"); f.tick();
  const outgoing = [...f.context.sources];
  const first = f.runtime.load("otto");
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(f.context.moduleUrls.length, 1);
  assert.equal(f.runtime.getState().profileId, "rosso"); assert.equal(f.runtime.getState().playing, true);
  assert.ok(outgoing.every(source => source.stopped == null));
  const latest = f.runtime.load("cinque");
  f.releaseWorklet();
  assert.equal(await first, false); assert.equal(await latest, true);
  assert.equal(f.runtime.getState().profileId, "cinque"); assert.equal(f.runtime.getState().source, "procedural");
  assert.equal(f.context.moduleUrls.length, 1);
  // Cancellation is checked before constructing a native processor for the superseded selection.
  assert.equal(f.context.voices.length, 1);
  assert.equal(f.context.voices.at(-1).disconnected, false);
  assert.ok(outgoing.every(source => Number.isFinite(source.stopped)));
  assert.deepEqual(f.events.filter(event => event.type === "engine.bank.ready").map(event => event.profileId), ["rosso", "cinque"]);
  f.runtime.destroy();
});

test("failed worklet preparation retains a playing sample bank and reports a truthful failure", async () => {
  const f = fixture({ worklet: true, workletFailure: true });
  f.runtime.setEnabled(true); await f.runtime.load("rosso");
  const outgoing = [...f.context.sources];
  assert.equal(await f.runtime.load("cinque"), false);
  assert.equal(f.runtime.getState().profileId, "rosso"); assert.equal(f.runtime.getState().playing, true);
  assert.equal(f.runtime.getState().status, "retrying");
  assert.match(f.runtime.getState().error, /Worklet module unavailable/);
  assert.ok(outgoing.every(source => source.stopped == null));
  f.runtime.destroy();
});

test("stale evidence and the first clock-gap frame suppress turbo events without muting the dry engine", async () => {
  const f = fixture({ worklet: true }); f.runtime.setEnabled(true); await f.runtime.load("cinque");
  f.evidence.speedKmh = 25; f.evidence.rawSpeedKmh = 25; f.evidence.drive = 1;
  for (let i = 0; i < 30; i++) f.tick();
  const voice = f.context.voices[0];
  assert.equal(voice.parameters.get("events").value, 1);
  f.evidence.freshness = "degraded"; f.evidence.canShift = false; f.evidence.drive = 0; f.tick();
  assert.equal(voice.parameters.get("events").value, 0); assert.equal(voice.parameters.get("active").value, 1);
  f.evidence.freshness = "fresh"; f.evidence.drive = 1; f.tick();
  assert.equal(voice.parameters.get("events").value, 1);
  f.tick(1);
  assert.equal(f.evidence.freshness, "lost");
  assert.equal(voice.parameters.get("events").value, 0);
  assert.equal(voice.parameters.get("active").value, 1);
  f.runtime.destroy();
});

test("visibility and context suspension discard pending shifts and prevent late commits", async () => {
  for (const reason of ["hidden", "suspended"]) {
    const f = fixture({ worklet: true, manual: true });
    f.runtime.setEnabled(true); await f.runtime.load("cinque");
    f.evidence.speedKmh = 20; f.evidence.rawSpeedKmh = 20;
    f.runtime.setTransmissionMode("MANUAL"); f.runtime.requestGear(2); f.tick();
    assert.equal(f.runtime.getState().shift, "manual");
    if (reason === "hidden") { f.document.visibilityState = "hidden"; f.document.dispatch("visibilitychange"); }
    else { f.context.state = "suspended"; f.context.dispatch("statechange"); }
    assert.equal(f.runtime.getState().shift, null); assert.equal(f.runtime.getState().shiftPhase, null);
    assert.equal(f.context.voices[0].parameters.get("events").value, 0);
    assert.equal(f.context.voices[0].parameters.get("active").value, 0);
    f.tick(.4);
    if (reason === "hidden") { f.document.visibilityState = "visible"; f.document.dispatch("visibilitychange"); }
    else { f.context.state = "running"; f.context.dispatch("statechange"); }
    f.tick();
    assert.equal(f.events.filter(event => event.type === "engine.shift.committed").length, 0);
    assert.equal(f.runtime.getState().gear, 1); assert.equal(f.runtime.getState().idleBlip, false);
    f.runtime.destroy();
  }
});

test("an unresolved worklet module times out without blocking a later sample-profile selection", async () => {
  const f = fixture({ worklet: true, pendingWorklet: true });
  f.runtime.setEnabled(true); await f.runtime.load("rosso");
  const pending = f.runtime.load("otto"); await new Promise(resolve => setImmediate(resolve));
  assert.equal(f.context.moduleUrls.length, 1);
  const timeout = [...f.timers].find(([, timer]) => !timer.interval && timer.delay === 20000);
  assert.ok(timeout); f.timers.delete(timeout[0]); timeout[1].fn();
  assert.equal(await pending, false); assert.equal(f.runtime.getState().status, "retrying");
  assert.equal(f.runtime.getState().profileId, "rosso"); assert.equal(f.runtime.getState().playing, true);
  assert.equal(await f.runtime.load("touring"), true);
  f.releaseWorklet(); await new Promise(resolve => setImmediate(resolve));
  assert.equal(f.runtime.getState().profileId, "touring"); assert.equal(f.context.voices.length, 0);
  f.runtime.destroy();
});

test("disable interrupts an unsettled module immediately and late readiness creates no processor", async () => {
  const f = fixture({ worklet: true, pendingWorklet: true });
  f.runtime.setEnabled(true); const pending = f.runtime.load("cinque");
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(f.context.moduleUrls.length, 1);
  f.runtime.setEnabled(false); assert.equal(await pending, false);
  assert.equal(f.timers.size, 0); assert.equal(f.runtime.getState().prepared, false);
  f.releaseWorklet(); await new Promise(resolve => setImmediate(resolve));
  assert.equal(f.context.voices.length, 0); assert.equal(f.runtime.getState().playing, false);
  f.runtime.destroy();
});

test("processor failure removes false availability and retries one fresh procedural voice", async () => {
  const f = fixture({ worklet: true });
  f.runtime.setEnabled(true); await f.runtime.load("cinque"); f.tick();
  const failed = f.context.voices[0], reportFailure = failed.onprocessorerror;
  assert.equal(f.runtime.getState().prepared, true);
  reportFailure();
  assert.equal(f.runtime.getState().prepared, false); assert.equal(f.runtime.getState().playing, false);
  assert.equal(f.runtime.setRevHeld(true), false);
  assert.equal(f.runtime.getState().status, "retrying"); assert.match(f.runtime.getState().error, /synthesis interrupted/);
  assert.equal(f.events.filter(event => event.type === "engine.renderer.failed").length, 1);
  await f.retry();
  assert.equal(f.runtime.getState().status, "ready"); assert.equal(f.runtime.getState().playing, true);
  assert.equal(f.context.voices.length, 2); assert.equal(f.context.moduleUrls.length, 1);
  reportFailure();
  assert.equal(f.runtime.getState().status, "ready");
  assert.equal(f.events.filter(event => event.type === "engine.renderer.failed").length, 1);
  f.runtime.destroy();
  assert.ok(f.context.voices.every(source => source.disconnected && source.closed));
});


test("public Engine ignores a bench-only profile resolver", async () => {
  const f = fixture({ resolveProfile: () => { throw new Error("Bench profile escaped"); } });
  assert.equal(await f.runtime.load("mono"), true);
  assert.equal(f.runtime.getState().profileId, "mono");
  f.runtime.destroy();
});
