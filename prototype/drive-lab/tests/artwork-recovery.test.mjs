import test from 'node:test';
import assert from 'node:assert/strict';
import { createArtworkRecovery } from '../src/artwork-recovery.js';
function fixture(online=true) {
 let time=0, allowed=online, next=0;const timers=new Map(), images=[],states=[];
 const runtime=createArtworkRecovery({url:'https://example.test/cover.jpg',makeImage:()=>{const image={};images.push(image);return image},now:()=>time,schedule:(fn,ms)=>{timers.set(++next,{fn,at:time+ms});return next},cancel:id=>timers.delete(id),canRetry:()=>allowed,onState:state=>states.push(state)});
 return {runtime,images,states,timers,setAllowed(value){allowed=value},advance(ms){const end=time+ms;while(true){const due=[...timers].filter(([,v])=>v.at<=end).sort((a,b)=>a[1].at-b[1].at)[0];if(!due)break;time=due[1].at;timers.delete(due[0]);due[1].fn()}time=end}};
}
test('offline artwork waits, retries on recovery, and publishes only loaded artwork',()=>{
 const f=fixture(false);assert.equal(f.images.length,0);assert.equal(f.states.at(-1).status,'waiting');
 f.setAllowed(true);f.runtime.wake();assert.equal(f.images.length,1);assert.equal(f.states.at(-1).src,null);
 f.images[0].onerror();f.advance(10000);assert.equal(f.images.length,2);f.images[1].onload();
 assert.equal(f.states.at(-1).src,'https://example.test/cover.jpg');assert.equal(f.timers.size,0);
 f.runtime.wake();assert.equal(f.images.length,2);f.runtime.dispose();
});
test('artwork deadline bounds one request and stale callbacks cannot replace a new selection',()=>{
 const f=fixture();const stale=f.images[0].onload;f.advance(15000);assert.equal(f.states.at(-1).status,'retrying');
 stale();assert.equal(f.states.at(-1).src,null);f.advance(5000);assert.equal(f.images.length,2);
 const late=f.images[1].onload;f.runtime.dispose();late();assert.equal(f.states.at(-1).src,null);assert.equal(f.timers.size,0);
});
test('hidden/offline artwork cancels inflight work and resumes without overlapping requests',()=>{
 const f=fixture();f.setAllowed(false);f.runtime.wake();assert.equal(f.images[0].src,'');f.advance(30000);assert.equal(f.images.length,1);
 f.setAllowed(true);f.runtime.wake();assert.equal(f.images.length,2);f.runtime.wake();assert.equal(f.images.length,2);f.runtime.dispose();
});
