import test from 'node:test';
import assert from 'node:assert/strict';
import { createSessionExperience, observeSessionExperience, sessionExperienceSnapshot } from '../src/reports/session-experience.js';
import { createSessionReportSnapshot } from '../src/reports/session-report-model.js';

const sample = (clockMs, extra = {}) => ({ visible: true, clockMs,
  track: { id: 'jamendo:123', label: 'Café on the road', detail: 'Beyoncé', imageUrl: 'https://example.test/private' },
  genre: { id: 'jazz', label: 'Jazz' }, visual: { id: 'atlas', label: 'Atlas' },
  palette: { id: 'red', label: 'RED', colors: ['#ff0000','#112233'] }, ...extra });

test('listening needs a progressing audio clock; stalls, pause, seek and switches add no invented playtime', () => {
  const state = createSessionExperience();
  for (const [time, clock, extra] of [[0,0,{}],[1000,1000,{}],[2000,1000,{}],[3000,20000,{}],
    [4000,100,{}],[5000,null,{track:null}],[6000,3000,{}],[7000,4000,{}]]) observeSessionExperience(state,sample(clock,extra),time);
  assert.equal(state.listeningMs,2000);
  assert.equal(state.observedMs,7000);
  assert.equal(state.tracks[0].ms,2000);
  assert.equal(state.genres[0].ms,2000);
  assert.equal(state.visuals[0].ms,7000);
});

test('hidden time and execution gaps are excluded; offline playback can still count', () => {
  const state = createSessionExperience();
  observeSessionExperience(state,sample(0),0);
  observeSessionExperience(state,sample(1000),1000);
  observeSessionExperience(state,sample(2000,{visible:false}),2000);
  observeSessionExperience(state,sample(3000),3000);
  observeSessionExperience(state,sample(4000,{online:false}),4000);
  observeSessionExperience(state,sample(14000),14000);
  assert.equal(state.listeningMs,2000);assert.equal(state.observedMs,2000);
});

test('bounded track collection preserves listening totals when more than 64 recordings play', () => {
  const state=createSessionExperience();let now=0;
  for(let i=0;i<70;i++){
    const track={id:`track:${i}`,label:`Track ${i}`,detail:'Artist'};
    observeSessionExperience(state,sample(0,{track}),now+=1000);
    observeSessionExperience(state,sample(1000,{track}),now+=1000);
  }
  assert.equal(state.tracks.length,64);assert.equal(state.listeningMs,70000);assert.equal(state.unlistedTrackMs,6000);
});

test('exported favourites are sorted, isolated and coordinate-free even if source metadata grows', () => {
  const state=createSessionExperience();observeSessionExperience(state,sample(0),0);observeSessionExperience(state,sample(1000),1000);
  state.privateUrl='https://example.test';state.tracks[0].latitude=45;state.tracks[0].shareUrl='https://example.test';
  const snapshot=sessionExperienceSnapshot(state);
  assert.doesNotMatch(JSON.stringify(snapshot),/latitude|shareUrl|privateUrl|imageUrl/);
  snapshot.palettes[0].colors[0]='#000000';assert.equal(state.palettes[0].colors[0],'#ff0000');
  const report=createSessionReportSnapshot({journey:{},system:{experience:state},app:{version:'0.0.0',build:'20260911-1407',commit:'44f6a29'},nowMs:1000,createdAt:'2026-09-11T12:00:00.000Z'});
  assert.equal(report.experience.tracks[0].label,'Café on the road');
  assert.throws(()=>{report.experience.tracks[0].ms=0;},TypeError);
  assert.doesNotMatch(JSON.stringify(report),/latitude|shareUrl|privateUrl|imageUrl/);
});
