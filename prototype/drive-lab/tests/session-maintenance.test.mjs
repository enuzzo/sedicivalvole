import test from 'node:test';
import assert from 'node:assert/strict';
import { canAutoReload, createUpdateController, releaseFromHtml, UPDATE_CHECK_MS } from '../src/session/update-controller.js';
import { RETENTION_MS, canRetireCache, staticPath } from '../src/session/cache-policy.js';
const current='20260909-0911.abcdef0', next='20260909-1200.abcdef1';
const html=key=>`<meta name="sedicivalvole-release" content="${key}" />`;
function fixture() {
 let now=1000, available=true, safe=false, latest=next, fail=false, fetches=0, reloads=0, serial=0;
 const timers=new Map();
 const owner=createUpdateController({current,now:()=>now,available:()=>available,safe:()=>safe,
  fetcher:async()=>{fetches++;if(fail)throw Error('offline');return new Response(html(latest));},
  reload:()=>reloads++,schedule:(fn,ms)=>{const id=++serial;timers.set(id,{fn,ms});return id;},cancel:id=>timers.delete(id)});
 return {owner,get fetches(){return fetches},get reloads(){return reloads},setAvailable:v=>available=v,setSafe:v=>safe=v,setLatest:v=>latest=v,setFail:v=>fail=v,
  async settle(){await new Promise(r=>setImmediate(r))},
  async tick(ms=1000){now+=ms;const timer=[...timers].find(([,v])=>v.ms!==12000);assert(timer);timers.delete(timer[0]);timer[1].fn();await new Promise(r=>setImmediate(r));},
  jump:ms=>now+=ms,
 };
}
test('release identity compares builds even when SemVer is unchanged and rejects malformed pages',()=>{
 assert.equal(releaseFromHtml(html(next)),next);assert.equal(releaseFromHtml('<h1>maintenance</h1>'),null);assert.equal(releaseFromHtml(html('garbage')),null);
});
test('new build waits through driving, hidden/offline time and interaction; safe idle reload happens once',async()=>{
 const f=fixture();await f.settle();assert(f.owner.snapshot().due);
 for(let i=0;i<35;i++)await f.tick();assert.equal(f.reloads,0);
 f.setSafe(true);for(let i=0;i<20;i++)await f.tick();f.owner.interact();
 for(let i=0;i<20;i++)await f.tick();assert.equal(f.reloads,0);
 f.setAvailable(false);await f.tick();f.setAvailable(true);f.owner.wake();await f.settle();
 for(let i=0;i<32;i++)await f.tick();assert.equal(f.reloads,1);
 await f.tick();assert.equal(f.reloads,1);f.owner.dispose();
});
test('failed fresh verification cannot reload or discard the running session',async()=>{
 const f=fixture();await f.settle();f.setFail(true);
 assert.equal(await f.owner.requestReload(),false);assert.equal(f.reloads,0);
 f.setFail(false);assert.equal(await f.owner.requestReload(),true);assert.equal(f.reloads,1);f.owner.dispose();
});
test('one-week refresh requires a fresh check and a newly observed quiet window after an execution gap',async()=>{
 const f=fixture();f.setLatest(current);await f.settle();await f.owner.requestReload();assert.equal(f.reloads,0);
 f.setSafe(true);await f.tick();f.jump(RETENTION_MS);await f.tick();assert.equal(f.reloads,0);
 for(let i=0;i<32;i++)await f.tick();assert.equal(f.reloads,1);f.owner.dispose();
});
test('unchanged releases are polled at five minutes and never reloaded early',async()=>{
 const f=fixture();f.setLatest(current);await f.settle();await f.owner.requestReload();const requests=f.fetches;
 f.setSafe(true);for(let i=0;i<40;i++)await f.tick();assert.equal(f.reloads,0);assert.equal(f.fetches,requests);
 f.jump(UPDATE_CHECK_MS);await f.tick();assert.equal(f.fetches,requests+1);f.owner.dispose();
});
test('retention keeps active generations and excludes navigation, private endpoints and transient music',()=>{
 assert.equal(canRetireCache(1000,1000+RETENTION_MS-1,false),false);
 assert.equal(canRetireCache(1000,1000+RETENTION_MS,true),false);
 assert.equal(canRetireCache(1000,1000+RETENTION_MS,false),true);
 for(const path of ['/', '/api/soundtrack-audio.php','/lab/lab.js','/audio/illobo/song.mp3','/assets/../lab/token'])assert.equal(staticPath(path),false);
 for(const path of ['/assets/main-123.js','/engine-audio/0123456789.wav','/third-party/drivey/sedicivalvole.html','/fonts/main.woff2'])assert.equal(staticPath(path),true);
});

test('automatic reload requires live exact standstill, mute and no passenger modal',()=>{
 const state={phase:'running',muted:true,source:'GPS',motion:{freshness:'fresh',trustedStationary:true,rawSpeedKmh:0},modalOpen:false};
 assert.equal(canAutoReload(state),true);
 for(const patch of [{muted:false},{source:'Demo'},{modalOpen:true},{motion:{...state.motion,freshness:'lost'}},{motion:{...state.motion,rawSpeedKmh:.001}},{motion:null}])assert.equal(canAutoReload({...state,...patch}),false);
 assert.equal(canAutoReload({phase:'idle',modalOpen:false}),true);
});
test('a maintenance page cannot turn an earlier update detection into a reload',async()=>{
 const f=fixture();await f.settle();f.setLatest('unrecognized');assert.equal(await f.owner.requestReload(),false);assert.equal(f.reloads,0);f.owner.dispose();
});
