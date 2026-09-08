import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {ENGINE_CATALOGUE,isEngineProfile} from '../src/engine/catalogue.js';
test('only the three owner-accepted engines are selectable',()=>{
 assert.deepEqual(ENGINE_CATALOGUE.map(x=>x.id),['mono','rosso','touring']);
 for(const id of ['otto','cinque','turbine','unknown']) assert.equal(isEngineProfile(id),false);
});
test('Intro, running surface and LAB use the same admitted catalogue',()=>{
 for(const file of ['launch-cockpit.jsx','engine/telemetry-field.jsx','engine/lab.jsx']) {
  const source=readFileSync(new URL('../src/'+file,import.meta.url),'utf8');
  assert.match(source,/ENGINE_CATALOGUE\.map/);
  assert.doesNotMatch(source,/ENGINE_PROFILES\.map/);
 }
});
