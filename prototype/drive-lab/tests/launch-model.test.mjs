import test from 'node:test';
import assert from 'node:assert/strict';
import { luckySoundtrackGenre, initialLaunchSoundtrack, soundtrackLaunchReady, prepareExactSoundtrackStart } from '../src/launch-model.js';
import { SOUNDTRACK_GENRE_OPTIONS } from '../src/soundtrack/library-model.js';

test('Feeling lucky reaches every supported genre and never immediately repeats', () => {
  const ids = new Set(SOUNDTRACK_GENRE_OPTIONS.map((_,i)=>luckySoundtrackGenre(null,()=>i/SOUNDTRACK_GENRE_OPTIONS.length).id));
  assert.equal(ids.size,SOUNDTRACK_GENRE_OPTIONS.length);
  for(const previous of ids) for(let i=0;i<15;i++) assert.notEqual(luckySoundtrackGenre(previous,()=>i/15).id,previous);
});
test('saved precise genre, pace and Lobo choices survive startup; an unspecified mix gets a genre', () => {
  for(const selection of [{kind:'genre',id:'jazz'},{kind:'pace',id:'slow'},{kind:'featured',id:'signal-border'}]) {
    const actual=initialLaunchSoundtrack(selection,()=>0);assert.equal(actual.kind,selection.kind);assert.equal(actual.id,selection.id);
  }
  assert.equal(initialLaunchSoundtrack(undefined,()=>0).kind,'genre');
  for(const random of [()=>NaN,()=>Infinity,()=>-1,()=>2,()=>{throw Error('unavailable');}]) assert.equal(luckySoundtrackGenre(null,random).kind,'genre');
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


test('lucky startup rolls again, while precise all-genres remains an explicit choice', () => {
  const jazz={kind:'genre',id:'jazz'};
  assert.notEqual(initialLaunchSoundtrack(jazz,()=>0,'lucky').id,'jazz');
  assert.equal(initialLaunchSoundtrack({kind:'library',id:'all'},()=>0,'precise').kind,'library');
});
