import assert from 'node:assert/strict';
import test from 'node:test';
import { build } from 'esbuild';
const compiled = await build({entryPoints:[new URL('../src/engine/lab-comparison.js',import.meta.url).pathname],bundle:true,platform:'node',format:'esm',write:false});
const { comparisonSpeed, comparisonProfile, makeComparisonNote, readComparisonNotes, COMPARISON_SECONDS } = await import(`data:text/javascript;base64,${Buffer.from(compiled.outputFiles[0].text).toString('base64')}`);
test('the shared listening route visits city, 80–130 and standstill without speed jumps',()=>{
 assert.equal(COMPARISON_SECONDS,68);
 for (const [time,speed] of [[0,0],[9,20],[15,30],[22,40],[32,80],[42,100],[52,130],[68,0]]) assert.equal(comparisonSpeed(time),speed);
 let previous=0;
 for(let tick=0;tick<=680;tick++){const speed=comparisonSpeed(tick/10);assert.ok(speed>=0&&speed<=130);assert.ok(Math.abs(speed-previous)<=1.31);previous=speed;}
 for(const invalid of [NaN,Infinity,-1]) assert.equal(comparisonSpeed(invalid),0);
});
test('reference and refined calibrations preserve source assets and physical ratios but expose both urban schedules',()=>{
 for(const id of ['mono','rosso','touring','otto','cinque','turbine']){
  const a=comparisonProfile(id,'A'),b=comparisonProfile(id,'B');
  assert.equal(a.assets,b.assets);assert.equal(a.configuration,b.configuration);
  if(!a.singleSpeed){assert.ok(a.upshiftKmh[1]<30);assert.ok(b.upshiftKmh[1]>=36);}
  if(a.voice){assert.ok(a.voice.acoustics.pipeFeedback>.5);assert.equal(b.voice.acoustics,undefined);}
  assert.equal(a.sampleBlend,'reference');assert.equal(b.sampleBlend,undefined);
 }
 assert.throws(()=>comparisonProfile('mono','bad'));
});
test('saved feedback identifies partial takes, bounded text, build and preference without positions',()=>{
 const result=makeComparisonNote({profile:'mono',preference:'B',note:'x'.repeat(5000),listened:{A:8,B:100},build:'20260908-test',sampleRate:48000,now:new Date('2026-09-08T10:00:00Z')});
 assert.equal(result.note.length,4000);assert.deepEqual(result.listenedSeconds,{A:8,B:68});
 assert.equal(result.build,'20260908-test');assert.equal(result.preference,'B');
 assert.ok(!('latitude' in result)&&!('longitude' in result));
 assert.throws(()=>makeComparisonNote({profile:'mono',preference:'',note:'',listened:{}}),/Choose a preference/);
 const storage={getItem:()=>JSON.stringify(Array(65).fill(result))};assert.equal(readComparisonNotes(storage).length,60);
 assert.deepEqual(readComparisonNotes({getItem:()=>'{'}),[]);
 assert.deepEqual(readComparisonNotes({getItem:()=>JSON.stringify([{},null,{schema:'engine-listening.v1'}])}),[]);
 assert.deepEqual(readComparisonNotes({getItem:()=>{throw new Error('unavailable')}}),[]);
});
