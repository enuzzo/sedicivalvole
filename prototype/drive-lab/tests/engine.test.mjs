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
  const context = { currentTime: 0, state: "running", sources: [],
    createGain: () => ({ gain: new Param(), connect(to) { return to; }, disconnect() {} }),
    createDynamicsCompressor: () => ({ threshold: new Param(), knee: new Param(), ratio: new Param(), attack: new Param(), release: new Param(), connect(to) { return to; }, disconnect() {} }),
    createBufferSource() { const source = { detune: new Param(), connect(to) { return to; }, start(at) { this.started = at; }, stop(at) { this.stopped = at ?? 0; }, disconnect() {} }; this.sources.push(source); return source; },
    decodeAudioData: async () => ({ length: 48000, numberOfChannels: 2 }),
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
  assert.equal(choose({gear:3,speedKmh:60,drive:1}).reason,"kickdown");
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
test("rev hold revalidates evidence, expires at eight seconds and releases on movement", async () => {
  const f=fixture(); f.runtime.setEnabled(true); await f.runtime.load(); f.evidence.trustedStationary=true; f.tick(); assert.equal(f.runtime.setRevHeld(true),true);
  for(let i=0;i<325;i++) f.tick(); assert.equal(f.runtime.getState().revving,false);
  f.runtime.setRevHeld(true); f.evidence.trustedStationary=false; f.tick(); assert.equal(f.runtime.getState().revving,false); assert.equal(f.runtime.setRevHeld(true),false); f.runtime.destroy();
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
