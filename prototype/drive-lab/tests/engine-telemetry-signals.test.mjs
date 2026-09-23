import test from 'node:test';
import assert from 'node:assert/strict';
import { telemetrySignals } from '../src/engine/telemetry-signals.js';
const live = { rpm: 3000, gear: 3, motion: 'fresh', status: 'ready', playing: true, enabled: true, drive: .5 };
test('visual cadence increases with the existing RPM and speed, without changing inputs', () => {
  const saved = {...live}; const low = telemetrySignals(live, 30), high = telemetrySignals({...live,rpm:6000},60);
  assert.equal(low.rpmSeconds,high.rpmSeconds*2); assert.equal(low.speedSeconds,high.speedSeconds*2);
  assert.equal(low.rpmRunning,true); assert.equal(low.speedRunning,true); assert.deepEqual(live,saved);
});
test('aging GPS keeps a readable value but cannot show continued road movement', () => {
  const signal=telemetrySignals({...live,motion:'degraded'},80);
  assert.equal(signal.speedKnown,true); assert.equal(signal.speedRunning,false);
  for(const motion of ['lost',undefined]) { const value=telemetrySignals({...live,motion},80); assert.equal(value.speedKnown,false); assert.equal(value.speedRunning,false); }
});
test('zero and invalid speed do not animate, explicit demo does not need GPS', () => {
  assert.equal(telemetrySignals(live,0).speedRunning,false);
  for(const speed of [NaN,Infinity,null]) assert.equal(telemetrySignals(live,speed,'DEMO').speedRunning,false);
  assert.equal(telemetrySignals({...live,motion:'lost'},42,'DEMO').speedRunning,true);
});
test('muted, preparing or suspended engine cannot imply live combustion or shifting', () => {
  for(const patch of [{enabled:false},{playing:false},{status:'loading'}]) {
    const signal=telemetrySignals({...live,shiftPhase:'synchronize',...patch},42);
    assert.equal(signal.rpmRunning,false); assert.equal(signal.gearEngaged,false); assert.equal(signal.phase,'steady');
    assert.equal(signal.speedRunning,true,'fresh speed remains independent of audio');
  }
});
test('fresh GPS remains visible when muted Engine has no audio motion snapshot', () => {
  const paused = { ...live, status: 'idle', playing: false, enabled: false, motion: 'lost' };
  const fresh = telemetrySignals(paused, 43, 'GPS', 'fresh');
  assert.equal(fresh.speedKnown, true);
  assert.equal(fresh.speedRunning, true);
  assert.equal(fresh.rpmRunning, false);
  assert.equal(telemetrySignals(paused, 43, 'GPS', 'lost').speedKnown, false);
});
test('neutral, continuous shaft and invalid gears cannot select a fictitious ratio', () => {
  for(const patch of [{revving:true},{singleSpeed:true},{gear:0},{gear:7},{gear:NaN}]) assert.equal(telemetrySignals({...live,...patch},42).gear,null);
  for(const phase of ['release','synchronize','engage']) assert.equal(telemetrySignals({...live,shiftPhase:phase},42).phase,phase);
  assert.equal(telemetrySignals({...live,shiftPhase:'invented'},42).phase,'steady');
});
test('invalid and extreme RPM/load produce finite bounded visual parameters', () => {
  for(const rpm of [NaN,Infinity,-1,0,999999]) {
    const signal=telemetrySignals({...live,rpm,drive:NaN},42);
    assert.ok(Number.isFinite(signal.rpmSeconds)&&signal.rpmSeconds>=.2);
    assert.ok(signal.pulseHeight>=.3&&signal.pulseHeight<=1);
    if(!Number.isFinite(rpm)||rpm<=0) assert.equal(signal.rpmRunning,false);
  }
});
