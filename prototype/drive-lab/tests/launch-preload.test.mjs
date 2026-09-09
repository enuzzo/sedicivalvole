import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {preloadVisualDocument} from '../src/launch-preload.js';
test('both pinned iframe dependency graphs can be prepared without executing third-party code',async()=>{
 for(const entry of ['drivey/sedicivalvole.html','infinite-lights/index7.html']) {
  const urls=[];const signal=new AbortController().signal;
  await preloadVisualDocument('https://fixture.test/third-party/'+entry,signal,async(url)=>{
   urls.push(url);return new Response(await readFile(new URL('../public'+new URL(url).pathname,import.meta.url)));
  });
  assert.equal(urls.length,new Set(urls).size);
  assert(urls.every(url=>url.startsWith('https://fixture.test/third-party/'+entry.split('/')[0]+'/')));
  assert(urls.some(url=>url.endsWith(entry.startsWith('drivey')?'three.module.js':'Distortions.js')));
 }
});
test('visual preparation stops on cancellation and rejects failed resources for bounded retry',async()=>{
 const controller=new AbortController();controller.abort();let calls=0;
 await assert.rejects(preloadVisualDocument('https://fixture.test/index.html',controller.signal,async()=>{calls++;}),{name:'AbortError'});
 assert.equal(calls,0);
 await assert.rejects(preloadVisualDocument('https://fixture.test/index.html',new AbortController().signal,async()=>new Response('',{status:503})),/503/);
});
