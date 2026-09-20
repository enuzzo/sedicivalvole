import test from 'node:test';
import assert from 'node:assert/strict';
import { createAutomaticDiagnosticClock, readDiagnosticPreferences, selectDiagnosticMode, diagnosticDeliveryControl } from '../src/automatic-diagnostics.js';
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

test('selecting Dev enables automatic reports; a deliberate pause remains explicit and survives reload',()=>{
 const dev=selectDiagnosticMode('dev'); assert.deepEqual(dev,{mode:'dev',automatic:true});
 assert.equal(diagnosticDeliveryControl(dev).action,'PAUSE SENDING');
 const paused=diagnosticDeliveryControl(dev).next;
 assert.equal(diagnosticDeliveryControl(paused).state,'AUTO REPORTS · OFF');
 assert.equal(diagnosticDeliveryControl(paused).action,'ENABLE SENDING');
 assert.deepEqual(readDiagnosticPreferences({getItem:()=>JSON.stringify(paused)}),paused);
 assert.deepEqual(diagnosticDeliveryControl(paused).next,dev);
 assert.deepEqual(selectDiagnosticMode('dev'),dev);
 const standard=selectDiagnosticMode('standard'); assert.equal(diagnosticDeliveryControl(standard).enabled,false);
 assert.equal(diagnosticDeliveryControl(standard).action,'ENABLE DEV REPORTS');
 assert.deepEqual(diagnosticDeliveryControl(standard).next,dev);
});

// --- Catch-up after a frozen page, persistence across reloads, and best-effort flush on close ---
import { fitDiagnosticReportForKeepalive, DIAGNOSTIC_KEEPALIVE_BODY_BYTES } from '../src/diagnostics-model.js';
const W0 = 1_800_000_000_000;
const liveW = (t, extra = {}) => ({ ...live, wallNow: W0 + t, ...extra });
const memoryStorage = () => { const m = new Map(); return { getItem: k => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: k => m.delete(k), size: () => m.size }; };

test('a page frozen by the browser catches up on resume once fifteen wall minutes hold unsent activity', () => {
  const c = createAutomaticDiagnosticClock();
  for (let t = 0; t <= 588000; t += 1000) assert.equal(c.update(liveW(t), t), false);
  const resume = 588000 + 1932000; // the September 19 Tesla freeze: 588 s observed, then 32 silent minutes
  assert.equal(c.isPending(), false);
  assert.equal(c.update(liveW(resume), resume), true);
  assert.equal(c.isPending(), true);
  c.begin();
  const s = c.snapshot();
  assert.equal(s.deliveryReason, 'catch-up');
  assert.ok(s.activeMs >= 588000 && s.activeMs < 900000);
  assert.ok(s.wallElapsedMs >= 900000);
  assert.ok(s.unobservedMs >= 1900000);
});

test('catch-up needs both fifteen wall minutes and a minute of unsent activity', () => {
  const short = createAutomaticDiagnosticClock();
  for (let t = 0; t <= 120000; t += 1000) short.update(liveW(t), t);
  assert.equal(short.update(liveW(120000 + 600000), 120000 + 600000), false, 'twelve wall minutes is not enough');
  assert.equal(short.isPending(), false);
  const thin = createAutomaticDiagnosticClock();
  for (let t = 0; t <= 30000; t += 1000) thin.update(liveW(t), t);
  assert.equal(thin.update(liveW(30000 + 2400000), 30000 + 2400000), false, 'thirty active seconds is not worth a report');
});

test('a hidden page whose timers still run delivers the catch-up while hidden, and offline waits for the network', () => {
  const c = createAutomaticDiagnosticClock();
  for (let t = 0; t <= 120000; t += 1000) c.update(liveW(t), t);
  let firstDue = null;
  for (let t = 180000; t <= 1200000 && firstDue === null; t += 60000) if (c.update(liveW(t, { visible: false }), t)) firstDue = t;
  assert.equal(firstDue, 900000);
  const o = createAutomaticDiagnosticClock();
  for (let t = 0; t <= 120000; t += 1000) o.update(liveW(t), t);
  assert.equal(o.update(liveW(3600000, { online: false }), 3600000), false);
  assert.equal(o.update(liveW(3601000, { online: true }), 3601000), true);
});

test('interval sending is unchanged when the page is never frozen', () => {
  const c = createAutomaticDiagnosticClock();
  let firstDue = null;
  for (let t = 0; t <= 900000 && firstDue === null; t += 1000) if (c.update(liveW(t), t)) firstDue = t;
  assert.equal(firstDue, 900000);
  c.begin();
  assert.equal(c.snapshot().deliveryReason, 'interval');
});

test('clock progress survives a reload and is discarded when stale, corrupt or unavailable', () => {
  const storage = memoryStorage();
  const before = createAutomaticDiagnosticClock({ storage });
  for (let t = 0; t <= 300000; t += 1000) before.update(liveW(t), t);
  before.persist();
  const after = createAutomaticDiagnosticClock({ storage });
  assert.equal(after.update(liveW(310000), 2000), false);
  let s = after.snapshot();
  assert.equal(s.restored, true);
  assert.equal(s.activeMs, 300000);
  assert.ok(s.wallElapsedMs >= 310000);
  let due = null;
  for (let i = 1; i <= 700 && due === null; i += 1) if (after.update(liveW(310000 + i * 1000), 2000 + i * 1000)) due = i;
  assert.ok(due !== null && due >= 500 && due <= 600, `due after ${due} s`);
  const stale = createAutomaticDiagnosticClock({ storage });
  stale.update(liveW(13 * 3600 * 1000), 0);
  assert.equal(stale.snapshot().restored, false);
  assert.equal(stale.snapshot().activeMs, 0);
  const corrupt = memoryStorage(); corrupt.setItem('sedicivalvole.diagnostic-clock.v1', '{nope');
  assert.equal(createAutomaticDiagnosticClock({ storage: corrupt }).snapshot().activeMs, 0);
  const broken = { getItem() { throw new Error('denied'); }, setItem() { throw new Error('denied'); }, removeItem() { throw new Error('denied'); } };
  const c = createAutomaticDiagnosticClock({ storage: broken }); c.update(liveW(0), 0); c.persist();
  assert.equal(c.snapshot().status, 'waiting');
});

test('an accepted report restarts the wall anchor and clears persisted progress', () => {
  const storage = memoryStorage();
  const c = createAutomaticDiagnosticClock({ storage });
  for (let t = 0; t <= 900000; t += 1000) c.update(liveW(t), t);
  c.begin(); c.complete(true, 901000);
  assert.ok(c.snapshot().wallElapsedMs <= 1000);
  const next = createAutomaticDiagnosticClock({ storage });
  next.update(liveW(902000), 0);
  assert.equal(next.snapshot().activeMs, 0);
});

test('closing the app may flush unsent activity once five wall minutes and two active minutes exist', () => {
  const c = createAutomaticDiagnosticClock();
  for (let t = 0; t <= 299000; t += 1000) c.update(liveW(t), t);
  assert.equal(c.canFlush(W0 + 299000), false);
  for (let t = 300000; t <= 301000; t += 1000) c.update(liveW(t), t);
  assert.equal(c.canFlush(W0 + 301000), true);
  const thin = createAutomaticDiagnosticClock();
  for (let t = 0; t <= 100000; t += 1000) thin.update(liveW(t), t);
  assert.equal(thin.canFlush(W0 + 400000), false, 'a hundred active seconds is below the flush minimum');
  c.beginFlush();
  assert.equal(c.snapshot().deliveryReason, 'hide-flush');
  assert.equal(c.canFlush(W0 + 302000), false, 'one flush at a time');
  c.completeFlush();
  assert.equal(c.snapshot().flushes, 1);
  assert.equal(c.snapshot().activeMs, 0);
  assert.equal(c.canFlush(W0 + 303000), false);
  const off = createAutomaticDiagnosticClock();
  for (let t = 0; t <= 400000; t += 1000) off.update(liveW(t, { enabled: false }), t);
  assert.equal(off.canFlush(W0 + 400000), false);
});

test('a compact keepalive report fits the browser limit or is refused', () => {
  assert.ok(DIAGNOSTIC_KEEPALIVE_BODY_BYTES <= 64000);
  const base = { schema: 'sedicivalvole.tesla-diagnostic.v4', generatedAt: '2026-09-19T15:41:54.979Z', app: { build: 'x' }, flightRecorder: { summary: {}, samples: Array.from({ length: 900 }, (_, i) => [i, 50, 'GPS']) }, runtimeIssues: [] };
  const big = { ...base, events: Array.from({ length: 800 }, (_, sequence) => ({ sequence, priority: 'significant', detail: 'x'.repeat(3000) })) };
  const fitted = fitDiagnosticReportForKeepalive(big);
  assert.ok(fitted && fitted.transport.requestBodyBytes <= DIAGNOSTIC_KEEPALIVE_BODY_BYTES);
  assert.equal(fitDiagnosticReportForKeepalive({ ...base, audio: 'x'.repeat(70000), events: [] }), null);
});

test('a flush that cannot be built is released without losing progress', () => {
  const c = createAutomaticDiagnosticClock();
  for (let t = 0; t <= 400000; t += 1000) c.update(liveW(t), t);
  assert.equal(c.canFlush(W0 + 400000), true);
  c.beginFlush(); c.abortFlush();
  assert.equal(c.snapshot().deliveryReason, null);
  assert.equal(c.snapshot().activeMs, 400000);
  assert.equal(c.canFlush(W0 + 400000), true);
});

test('a close-time flush reports the wall time of the moment it fires, not of the last tick', () => {
  const c = createAutomaticDiagnosticClock();
  for (let t = 0; t <= 301000; t += 1000) c.update(liveW(t), t);
  c.beginFlush(W0 + 320000);
  assert.equal(c.snapshot().wallElapsedMs, 320000);
  const late = createAutomaticDiagnosticClock();
  for (let t = 0; t <= 200000; t += 1000) late.update(liveW(t), t);
  late.beginFlush(W0 + 100);
  assert.equal(late.snapshot().wallElapsedMs, 200000, 'an older clock reading never moves time backwards');
});

test('after a reload nothing is sent until the new page holds its own data', () => {
  const storage = memoryStorage();
  const before = createAutomaticDiagnosticClock({ storage });
  for (let t = 0; t <= 600000; t += 1000) before.update(liveW(t), t);
  before.persist();
  const hoursLater = W0 + 8 * 3600 * 1000;
  const after = createAutomaticDiagnosticClock({ storage });
  assert.equal(after.update({ ...live, wallNow: hoursLater }, 0), false, 'first tick of a new page sends nothing');
  assert.equal(after.snapshot().restored, true);
  assert.equal(after.isPending(), false);
  let firstDue = null;
  for (let s = 1; s <= 120 && firstDue === null; s += 1) if (after.update({ ...live, wallNow: hoursLater + s * 1000 }, s * 1000)) firstDue = s;
  assert.equal(firstDue, 60, 'due once the new page has a minute of its own activity');
  const flushy = createAutomaticDiagnosticClock({ storage });
  flushy.update({ ...live, wallNow: hoursLater }, 0);
  for (let s = 1; s <= 100; s += 1) flushy.update({ ...live, wallNow: hoursLater + s * 1000 }, s * 1000);
  assert.equal(flushy.canFlush(hoursLater + 100000), false, 'restored progress alone never justifies a close-time report');
});
