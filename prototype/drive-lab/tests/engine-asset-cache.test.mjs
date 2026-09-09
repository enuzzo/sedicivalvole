import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createEngineAssetCache } from '../src/engine/asset-cache.js';
const bytes = new Uint8Array([1,2,3,4]);
const asset = { url: '/engine-audio/test.wav', sha256: createHash('sha256').update(bytes).digest('hex') };
test('preload and playback share transfer; decoding cannot detach the retained copy', async () => {
  let calls = 0;
  const cache = createEngineAssetCache({ fetcher: async () => { calls++; return new Response(bytes); } });
  const [a,b] = await Promise.all([cache.read(asset), cache.read(asset)]);
  structuredClone(a, { transfer: [a] });
  assert.equal(a.byteLength, 0); assert.equal(b.byteLength, 4);
  assert.deepEqual(new Uint8Array(await cache.read(asset)), bytes); assert.equal(calls, 1);
});
test('one cancelled consumer does not abort a foreground transfer', async () => {
  let finish, networkSignal;
  const cache = createEngineAssetCache({ fetcher: (_, {signal}) => { networkSignal=signal; return new Promise(r => finish=r); } });
  const controller=new AbortController();
  const bg=cache.read(asset,{signal:controller.signal}); const fg=cache.read(asset);
  controller.abort(); await assert.rejects(bg,{name:'AbortError'});
  assert.equal(networkSignal.aborted,false); finish(new Response(bytes));
  assert.equal((await fg).byteLength,4);
});
test('last cancellation aborts network, failed integrity is never retained, and LRU stays bounded', async () => {
  let networkSignal;
  const blocked = createEngineAssetCache({fetcher:(_, {signal})=> {networkSignal=signal; return new Promise((_,reject)=>signal.addEventListener('abort',()=>reject(new Error('abort'))));}});
  const controller=new AbortController(); const task=blocked.read(asset,{signal:controller.signal}); controller.abort();
  await assert.rejects(task); assert.equal(networkSignal.aborted,true);
  let calls=0;
  const cache=createEngineAssetCache({maxBytes:4,fetcher:async()=>{calls++;return new Response(bytes);}});
  await assert.rejects(cache.read({...asset,sha256:'wrong'}),/integrity/); assert.equal(cache.size,0);
  await cache.read(asset); await cache.read({...asset,url:'/other.wav'}); assert.equal(cache.size,4);
  await cache.read(asset); assert.equal(calls,4);
});
