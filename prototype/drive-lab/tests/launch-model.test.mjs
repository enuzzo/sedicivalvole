import test from 'node:test';
import assert from 'node:assert/strict';
import { luckySoundtrackGenre, luckyLaunchVisual, initialLaunchSoundtrack, soundtrackLaunchReady, prepareExactSoundtrackStart } from '../src/launch-model.js';
import { SOUNDTRACK_GENRE_OPTIONS } from '../src/soundtrack/library-model.js';

test('Feeling lucky reaches every supported genre and never immediately repeats', () => {
  const ids = new Set(SOUNDTRACK_GENRE_OPTIONS.map((_,i)=>luckySoundtrackGenre(null,()=>i/SOUNDTRACK_GENRE_OPTIONS.length).id));
  assert.equal(ids.size,SOUNDTRACK_GENRE_OPTIONS.length);
  for(const previous of ids) for(let i=0;i<15;i++) assert.notEqual(luckySoundtrackGenre(previous,()=>i/15).id,previous);
});
test('every visit rolls a genre even after an exact genre, pace or playlist choice', () => {
  for(const selection of [{kind:'genre',id:'jazz'},{kind:'pace',id:'slow'},{kind:'featured',id:'signal-border'}]) {
    const actual=initialLaunchSoundtrack(selection,()=>0);assert.equal(actual.kind,'genre');assert.notEqual(actual.id,selection.id);
  }
  for(const random of [()=>NaN,()=>Infinity,()=>-1,()=>2,()=>{throw Error('unavailable');}]) assert.equal(luckySoundtrackGenre(null,random).kind,'genre');
});
test('visual roulette reaches all effects, treats Gradient as one family and never opens passenger tools', () => {
  const ids=new Set();
  for(let family=0;family<6;family++) for(let variant=0;variant<3;variant++){let call=0;ids.add(luckyLaunchVisual(null,()=>call++ === 0 ? family/6 : variant/3));}
  for(const id of ['aperture','vertigo','meridian','drivey','prtcl','japanese-mist','acid-orchard','chromatic-silk']) assert.ok(ids.has(id),id);
  for(const previous of ids) for(let i=0;i<60;i++) {
    const next=luckyLaunchVisual(previous,()=>i/60);
    assert.notEqual(next,previous);assert.ok(!['atlas','discover','stats'].includes(next));
    if(['japanese-mist','acid-orchard','chromatic-silk'].includes(previous)) assert.ok(!['japanese-mist','acid-orchard','chromatic-silk'].includes(next));
  }
});
test('START never plays the old queue while a different genre loads, then resumes the ready selection', async () => {
  const selection={kind:'genre',id:'jazz'};let resumes=0,loads=0;
  let snapshot={status:'loading',current:{key:'old-rock'},library:{selection}};
  const controller={getSnapshot:()=>snapshot,resume:async()=>{resumes++;return snapshot;},load:async()=>{loads++;return snapshot;}};
  assert.equal(soundtrackLaunchReady(snapshot,selection),false);
  await prepareExactSoundtrackStart(controller,selection);assert.equal(resumes,0);assert.equal(loads,0);
  snapshot={...snapshot,status:'prepared',current:{key:'new-jazz'}};
  await prepareExactSoundtrackStart(controller,selection);assert.equal(resumes,1);assert.equal(loads,0);
});
test('START recovers a cancelled or failed selection without substituting a remembered track', async () => {
  const selection={kind:'pace',id:'slow'};let resumes=0,requested;
  const snapshot={status:'paused',current:{key:'old-rock'},library:{selection:{kind:'genre',id:'rock'}}};
  const controller={getSnapshot:()=>snapshot,resume:async()=>{resumes++;},load:async args=>{requested=args;}};
  await prepareExactSoundtrackStart(controller,selection);assert.equal(resumes,0);assert.deepEqual(requested,{selection});
  assert.equal(soundtrackLaunchReady({...snapshot,status:'prepared',current:null},snapshot.library.selection),false);
});
