import test from 'node:test';
import assert from 'node:assert/strict';
import { createAdaptiveMotionPeer } from '../src/motion/adaptive-peer.js';
import { createRecentMotionReadings } from '../src/motion/recent-readings.js';

const flush = async () => { for (let i = 0; i < 8; i++) await Promise.resolve(); };
function fixture(t, { role = 'receiver', capable = true, offer } = {}) {
  t.mock.timers.enable({ apis: ['setInterval'] });
  let time = 0, relayOptions;
  const peers = [], events = [], standby = [];
  const relay = { closeCount: 0, summary: () => ({ state: 'connected', receiverConfirmed: false }),
    sample: () => ({ from: 'https' }), presentation: () => ({ palette: 'relay' }),
    close() { this.closeCount++; }, setOnline() {}, setStandby: value => standby.push(value) };
  const owner = createAdaptiveMotionPeer({ role, host: { isSecureContext: true, RTCPeerConnection: capable ? class {} : undefined },
    now: () => time, onEvent: type => events.push(type),
    relayFactory: options => { relayOptions = options; return relay; },
    directFactory: options => {
      const peer = { options, status: { state: 'connected', networkState: 'online', receiverConfirmed: true },
        closes: 0, accepts: 0, answers: 0, offer: offer || (async () => 'v=0\r\nfixture'),
        async answer() { this.answers++; return 'v=0\r\nanswer'; }, async accept() { this.accepts++; },
        summary() { return this.status; }, sample: () => ({ from: 'direct' }), presentation: () => ({ palette: 'direct' }),
        setOnline(value) { this.status.networkState = value ? 'online' : 'offline'; }, close() { this.closes++; options.onEvent('stop', {}); } };
      peers.push(peer); return peer;
    },
  });
  const advance = async ms => { time += ms; t.mock.timers.tick(ms); await flush(); };
  const receive = signal => relayOptions.unwrapPacket(JSON.stringify({ v: 'sv-motion-upgrade-1', motion: null, signal }));
  return { owner, relay, peers, standby, events, advance, receive, options: relayOptions };
}

test('authenticated capability gates upgrade; duplicate/stale answers never renegotiate; one owner supplies values and status', async t => {
  const f = fixture(t);
  try {
    f.options.onEvent('channel-open', { state: 'connected' });
    await f.advance(100); assert.equal(f.peers.length, 0);
    assert.equal(f.options.wrapPacket('legacy'), 'legacy');
    f.options.onSummary({ supportsDirectUpgrade: true }); await f.advance(100);
    const wrapper = JSON.parse(f.options.wrapPacket('poll'));
    assert.equal(wrapper.motion, 'poll'); assert.equal(wrapper.signal.type, 'offer');
    f.receive({ ...wrapper.signal, attempt: 99, type: 'answer' }); await flush();
    assert.equal(f.peers[0].accepts, 0);
    f.receive({ ...wrapper.signal, type: 'answer' }); f.receive({ ...wrapper.signal, type: 'answer' }); await flush();
    assert.equal(f.peers[0].accepts, 1);
    await f.advance(100);
    assert.equal(f.owner.summary().transport, 'direct'); assert.equal(f.owner.sample().from, 'direct');
    assert.equal(f.owner.presentation().palette, 'direct'); assert.equal(f.standby.at(-1), true);
    f.peers[0].options.onEvent('stop', {});
    assert.equal(f.owner.summary().state, 'connected'); assert.equal(f.owner.summary().transport, 'https');
    assert.equal(f.owner.sample().from, 'https'); assert.equal(f.standby.at(-1), false);
    assert.equal(f.relay.closeCount, 0); assert.deepEqual(f.events, ['channel-open']);
  } finally { f.owner.close(); }
});

test('one-way direct loss wakes phone HTTPS even while it continues sending; no stale confirmation is fabricated', async t => {
  const f = fixture(t, { role: 'phone' });
  try {
    const offer = { attempt: 1, type: 'offer', sdp: 'v=0\r\nfixture' };
    f.receive(offer); f.receive(offer); await flush(); await f.advance(100);
    assert.equal(f.peers.length, 1); assert.equal(f.peers[0].answers, 1);
    assert.equal(f.owner.summary().transport, 'direct');
    f.peers[0].status.receiverConfirmed = false; f.peers[0].status.sent = 500;
    await f.advance(200); assert.equal(f.owner.summary().receiverConfirmed, false);
    await f.advance(900);
    assert.equal(f.owner.summary().transport, 'https'); assert.equal(f.standby.at(-1), false);
    assert.equal(f.relay.closeCount, 0);
    f.peers[0].status.receiverConfirmed = true; await f.advance(100);
    assert.equal(f.owner.summary().transport, 'direct'); assert.equal(f.peers.length, 1);
  } finally { f.owner.close(); }
});

test('an obsolete asynchronous offer rejection cannot close its replacement', async t => {
  let rejectFirst, calls = 0;
  const f = fixture(t, { offer: () => ++calls === 1 ? new Promise((_, reject) => { rejectFirst = reject; }) : Promise.resolve('v=0\r\nsecond') });
  try {
    f.options.onSummary({ supportsDirectUpgrade: true }); await f.advance(100);
    f.peers[0].status.receiverConfirmed = false; f.peers[0].status.state = 'connecting';
    await f.advance(21000); await f.advance(10100);
    assert.equal(f.peers.length, 2);
    rejectFirst(new Error('late failure')); await flush(); await f.advance(100);
    assert.equal(f.peers[1].closes, 0); assert.equal(f.owner.summary().transport, 'direct');
  } finally { f.owner.close(); }
});

test('offline excludes direct immediately; original relay expiry closes both paths once and late signaling cannot restart', async t => {
  const f = fixture(t);
  f.options.onSummary({ supportsDirectUpgrade: true }); await f.advance(100); await f.advance(100);
  f.owner.setOnline(false); assert.equal(f.owner.summary().transport, 'https');
  f.options.onEvent('expired', { state: 'expired' }); f.owner.close();
  assert.equal(f.peers[0].closes, 1); assert.equal(f.relay.closeCount, 1);
  assert.equal(f.owner.sample(), null); assert.deepEqual(f.events, ['expired']);
  f.owner.setOnline(true); await f.advance(60000); assert.equal(f.peers.length, 1);
});

test('unavailable direct and oversized SDP preserve the existing bounded HTTPS envelope', async t => {
  const f = fixture(t, { offer: async () => 'v=0' + 'x'.repeat(2600) });
  try {
    f.options.onSummary({ supportsDirectUpgrade: true }); await f.advance(100);
    assert.equal(f.peers[0].closes, 1); assert.equal(f.owner.summary().transport, 'https');
    assert.equal(f.options.wrapPacket('legacy'), 'legacy');
    assert.equal(f.relay.closeCount, 0);
  } finally { f.owner.close(); }
});

test('recent display averages deduplicate samples, paint at 4 Hz and expire without altering instantaneous freshness', () => {
  let time = 0;
  const display = createRecentMotionReadings(() => time);
  const summary = { state: 'connected', transport: 'https', sensorState: 'live', tared: true,
    dataFresh: true, referenceReceived: true, receiverConfirmed: true, received: 1, rttMs: 80 };
  const values = { generation: 1, acceleration: [1, 0, 0], turnRate: 2 };
  const first = display.update(summary, values);
  assert.equal(first.acceleration, 1);
  for (time = 50; time <= 200; time += 50) assert.equal(display.update(summary, values), first);
  time = 250;
  const next = display.update({ ...summary, received: 2 }, { ...values, acceleration: [3, 0, 0], turnRate: -2 });
  assert.equal(next.acceleration, 2, 'repeated snapshots do not overweight the previous sample');
  assert.equal(next.rotation, 0);
  const delayed = { ...summary, dataFresh: false, receiverConfirmed: false, sensorState: 'stale', tared: false };
  time = 600; assert.equal(display.update(delayed, null).acceleration, 2);
  assert.equal(delayed.receiverConfirmed, false, 'historical display never changes live authorization');
  time = 1250; assert.equal(display.update(delayed, null).acceleration, null);
});

test('recent display clears on new ZERO, actual invalidation, offline and stop', () => {
  for (const invalid of [{ state: 'closed' }, { networkState: 'offline' }, { tared: false }, { sensorState: 'stale' }]) {
    const display = createRecentMotionReadings(() => 0);
    const s = { state: 'connected', dataFresh: true, referenceReceived: true, receiverConfirmed: true, sensorState: 'live', tared: true, received: 1 };
    const v = { generation: 1, acceleration: [1, 0, 0], turnRate: 2 };
    display.update(s, v);
    assert.equal(display.update({ ...s, ...invalid }, null).acceleration, null);
  }
  const display = createRecentMotionReadings(() => 0);
  const s = { state: 'connected', dataFresh: true, referenceReceived: true, receiverConfirmed: true, sensorState: 'live', tared: true, received: 1 };
  display.update(s, { generation: 1, acceleration: [4, 0, 0], turnRate: 20 });
  assert.equal(display.update({ ...s, received: 2 }, { generation: 2, acceleration: [0, 0, 0], turnRate: 0 }).acceleration, 0);
});
