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
const bundled = await build({ stdin: { contents: 'export {createGeapsRuntime} from "./src/engine/runtime.js"; export {ENGINE_PROFILES} from "./src/engine/profiles.js";', resolveDir: root.pathname }, bundle: true, format: "cjs", platform: "node", write: false });
class Param {
  value = 0; events = [];
  cancelAndHoldAtTime(t) { this.events.push(["hold", t]); }
  setTargetAtTime(v, t, tau) { assert.ok(Number.isFinite(v) && Number.isFinite(t) && tau > 0); this.value = v; this.events.push(["target",v,t,tau]); }
  linearRampToValueAtTime(v,t) { assert.ok(Number.isFinite(v) && Number.isFinite(t)); this.value = v; this.events.push(["ramp",v,t]); }
}
function fixture({ fail = false, manual = false } = {}) {
  const timers = new Map(); let serial = 0, time = 0, failures = fail, requests = 0;
  const context = { currentTime: 0, state: "running", sources: [], gains: [],
    createGain() { const node = { gain: new Param(), connect(to) { return to; }, disconnect() {} }; this.gains.push(node); return node; },
    createDynamicsCompressor: () => ({ threshold: new Param(), knee: new Param(), ratio: new Param(), attack: new Param(), release: new Param(), connect(to) { return to; }, disconnect() {} }),
    createBufferSource() { const source = { detune: new Param(), connect(to) { return to; }, start(at) { this.started = at; }, stop(at) { this.stopped = at ?? 0; }, disconnect() {} }; this.sources.push(source); return source; },
    decodeAudioData: async () => ({ length: 48000, numberOfChannels: 2, getChannelData: () => new Float32Array(48000).fill(0.1) }),
  };
  const exports = {};
  const sandbox = { exports, module: { exports }, console, crypto: webcrypto, AbortController, performance: { now: () => time },
    setInterval: fn => { const id = ++serial; timers.set(id,{fn,interval:true}); return id; },
    clearInterval: id => timers.delete(id), setTimeout: (fn, delay) => { const id = ++serial; timers.set(id,{fn,delay}); return id; }, clearTimeout: id => timers.delete(id),
    fetch: async url => { requests++; if (failures) throw new Error("offline"); const bytes = readFileSync(new URL(`public${url}`,root)); return { ok:true, arrayBuffer:async () => bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength) }; },
  };
  vm.runInNewContext(bundled.outputFiles[0].text, sandbox);
  const evidence = { speedKmh:0, drive:0, deceleration:0, freshness:"fresh", canShift:true, trustedStationary:false };
  const motion = { snapshot:() => ({...evidence}), reset:() => Object.assign(evidence,{freshness:"lost",canShift:false,trustedStationary:false}) };
  const events = [];
  const runtime = sandbox.module.exports.createGeapsRuntime({context,destination:{},motion,now:()=>time,allowManual:manual,onEvent:(type,detail)=>events.push({type,...detail})});
  return { runtime, context, evidence, events, profiles: sandbox.module.exports.ENGINE_PROFILES, timers,
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
  assert.equal(choose({gear:3,speedKmh:54,drive:1}).reason,"kickdown");
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
  const f=fixture(); f.runtime.setEnabled(true); await f.runtime.load(); f.evidence.speedKmh=75;
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
  // A shift has one continuous destination ramp, no intermediate attenuation notch.
  for (const gain of f.context.gains.slice(1)) assert.equal(gain.gain.events.filter(e => e[0] === "ramp").length, 2);
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


test("entertainment gearing reaches second at 35 and third at 65 in every profile", async () => {
  for(const id of ['mono','rosso','touring']) {
    const f=fixture(); f.runtime.setEnabled(true); await f.runtime.load(id);
    const profile=f.profiles.find(p=>p.id===id), drivetrain=profile.configuration.drivetrain;
    assert.ok(Math.abs(virtualRpm(35,1,drivetrain)-profile.up)<.001);
    assert.ok(Math.abs(virtualRpm(65,2,drivetrain)-profile.up)<.001);
    const shifts=[];
    for(let speed=0;speed<=70;speed+=.25){f.evidence.speedKmh=speed;for(let i=0;i<4;i++)f.tick();const gear=f.runtime.getState().gear;if(shifts.at(-1)?.gear!==gear)shifts.push({gear,speed});}
    assert.equal(f.runtime.getState().gear,3);
    assert.ok(shifts[1].speed>=35 && shifts[1].speed<37,JSON.stringify(shifts));
    assert.ok(shifts[2].speed>=65 && shifts[2].speed<67,JSON.stringify(shifts));
    f.evidence.drive=1;for(let i=0;i<240;i++){f.evidence.speedKmh=i%2?64:66;f.tick();assert.equal(f.runtime.getState().gear,3);}
    f.runtime.destroy();
  }
});
test("road shift ladder retains separate downshift and kickdown margins", () => {
  const f=fixture();for(const profile of f.profiles){const d=profile.configuration.drivetrain;
    for(let gear=2;gear<=6;gear++){
      const threshold=profile.upshiftKmh[gear-2];
      for(const delta of [-1,0,1])assert.equal(decideAutomaticGear({gear,speedKmh:threshold+delta,drive:1,canShift:true,heldSeconds:2},profile,d),null);
      assert.equal(decideAutomaticGear({gear,speedKmh:profile.downshiftKmh[gear-2],drive:0,canShift:true,heldSeconds:2},profile,d)?.reason,'downshift');
    }
  }f.runtime.destroy();
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
  assert.ok(movingRpm > 2000);
  for (let time = 1000; time <= 5900; time += 100) {
    const held = step(time, 10000);
    assert.equal(held.motion, "degraded");
    assert.ok(held.rpm >= movingRpm * .95);
    assert.equal(held.drive, 0);
    assert.equal(held.idleBlip, false);
    assert.equal(held.shift, null);
    assert.equal(held.canRev, false);
  }
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
