import test from 'node:test';
import assert from 'node:assert/strict';
import { createAutomaticDiagnosticClock, readDiagnosticPreferences } from '../src/automatic-diagnostics.js';
const live={running:true,enabled:true,online:true,visible:true,moving:true};
function dueClock(){const c=createAutomaticDiagnosticClock();for(let t=0;t<=900000;t+=1000)c.update(live,t);return c;}
test('development defaults are explicit and a saved OFF or Standard survives reload',()=>{
 assert.deepEqual(readDiagnosticPreferences({getItem:()=>null}),{mode:'dev',automatic:true});
 assert.deepEqual(readDiagnosticPreferences({getItem:()=>'{"mode":"standard","automatic":false}'}),{mode:'standard',automatic:false});
 assert.equal(readDiagnosticPreferences({getItem:()=>{throw Error();}}).mode,'dev');
});
test('fifteen active minutes count stops and missing GPS, but not hidden clock gaps',()=>{
 const c=createAutomaticDiagnosticClock();c.update(live,0);
 for(let t=1000;t<900000;t+=1000) assert.equal(c.update(live,t),false);
 assert.equal(c.update(live,900000),true);c.begin();assert.equal(c.update(live,901000),false);
 c.complete(true,901000);assert.equal(c.snapshot().accepted,1);assert.equal(c.snapshot().activeMs,0);
 c.update({...live,moving:false},902000);c.update({...live,moving:false},903000);assert.equal(c.snapshot().activeMs,2000);
 c.update({...live,visible:false},904000);c.update(live,1804000);assert.equal(c.snapshot().activeMs,2000);assert.ok(c.snapshot().unobservedMs>=900000);
});
test('offline due work resumes once, OFF clears due work, and no backlog accumulates',()=>{
 const c=dueClock();assert.equal(c.update({...live,online:false},901000),false);
 assert.equal(c.update({...live,moving:false},902000),true);c.begin();c.complete(true,902000);
 assert.equal(c.update({...live,moving:false},903000),false);
 const d=dueClock();assert.equal(d.update({...live,enabled:false},901000),false);assert.equal(d.update(live,902000),false);assert.equal(d.snapshot().activeMs,0);
});
test('transient failures have three bounded retries, permanent rejection waits for another period',()=>{
 const c=dueClock();let t=900000;
 for(const delay of [30000,60000,120000]) {c.begin();c.complete(false,t);assert.equal(c.update({...live,moving:false},t+delay-1),false);t+=delay;assert.equal(c.update({...live,moving:false},t),true);}
 c.begin();c.complete(false,t);assert.equal(c.snapshot().status,'failed');assert.equal(c.update({...live,moving:false},t+1000),false);
 const d=dueClock();d.begin();d.complete(false,900000,false);assert.equal(d.snapshot().activeMs,0);
});

test('a GPS-free offline session becomes pending at fifteen active minutes and sends once online',()=>{
 const c=createAutomaticDiagnosticClock();
 const offline={running:true,enabled:true,online:false,visible:true};
 for(let t=0;t<=1800000;t+=1000) assert.equal(c.update(offline,t),false);
 assert.equal(c.snapshot().activeMs,1800000);
 assert.equal(c.snapshot().status,'waiting-network');
 assert.equal(c.snapshot().timeBasis,'active-visible-session');
 assert.equal(c.update({...offline,online:true},1801000),true);
 c.begin(); assert.equal(c.update({...offline,online:true},1802000),false);
 c.complete(true,1802000);
 assert.equal(c.update({...offline,online:true},1803000),false);
 assert.equal(c.snapshot().accepted,1);
});
test('visible sessions without movement become due exactly at fifteen minutes',()=>{
 const c=createAutomaticDiagnosticClock();const stopped={...live,moving:false};
 for(let t=0;t<900000;t+=1000) assert.equal(c.update(stopped,t),false);
 assert.equal(c.update(stopped,900000),true);
 assert.equal(c.snapshot().activeMs,900000);
});
