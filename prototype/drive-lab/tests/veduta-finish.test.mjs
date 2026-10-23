import test from 'node:test';
import assert from 'node:assert/strict';
import { createVedutaFinish } from '../src/environments/veduta/veduta-finish.js';

function framebufferFixture() {
  const gl = {}, calls = [], params = new Map(), enabled = new Set(); let serial = 0;
  for (const name of ['VERTEX_SHADER','FRAGMENT_SHADER','COMPILE_STATUS','LINK_STATUS','VIEWPORT','READ_FRAMEBUFFER_BINDING','DRAW_FRAMEBUFFER_BINDING','ACTIVE_TEXTURE','CURRENT_PROGRAM','VERTEX_ARRAY_BINDING','TEXTURE_BINDING_2D','BLEND','DEPTH_TEST','STENCIL_TEST','CULL_FACE','SCISSOR_TEST','DEPTH_WRITEMASK','TEXTURE0','TEXTURE3','TEXTURE_2D','RGBA8','RGBA','UNSIGNED_BYTE','TEXTURE_MIN_FILTER','TEXTURE_MAG_FILTER','LINEAR','TEXTURE_WRAP_S','TEXTURE_WRAP_T','CLAMP_TO_EDGE','READ_FRAMEBUFFER','TRIANGLES']) gl[name] = ++serial;
  const native = { read: {}, draw: {}, program: {}, vao: {}, texture: {} };
  params.set(gl.VIEWPORT,[0,0,800,600]); params.set(gl.READ_FRAMEBUFFER_BINDING,native.read); params.set(gl.DRAW_FRAMEBUFFER_BINDING,native.draw);
  params.set(gl.ACTIVE_TEXTURE,gl.TEXTURE3); params.set(gl.CURRENT_PROGRAM,native.program); params.set(gl.VERTEX_ARRAY_BINDING,native.vao);
  params.set(gl.TEXTURE_BINDING_2D,native.texture); params.set(gl.DEPTH_WRITEMASK,true);
  enabled.add(gl.BLEND); enabled.add(gl.DEPTH_TEST); enabled.add(gl.SCISSOR_TEST);
  gl.getParameter = key => params.get(key);
  gl.isEnabled = key => enabled.has(key);
  gl.enable = key => enabled.add(key); gl.disable = key => enabled.delete(key);
  gl.activeTexture = value => params.set(gl.ACTIVE_TEXTURE,value);
  gl.bindTexture = (target,value) => params.set(gl.TEXTURE_BINDING_2D,value);
  gl.bindFramebuffer = (target,value) => params.set(gl.READ_FRAMEBUFFER_BINDING,value);
  gl.useProgram = value => params.set(gl.CURRENT_PROGRAM,value);
  gl.bindVertexArray = value => params.set(gl.VERTEX_ARRAY_BINDING,value);
  gl.depthMask = value => params.set(gl.DEPTH_WRITEMASK,value);
  for (const method of ['createShader','createProgram','createTexture','createVertexArray']) gl[method] = () => { const object = { id: ++serial }; calls.push([method,object]); return object; };
  for (const method of ['shaderSource','compileShader','attachShader','linkProgram','deleteShader','deleteTexture','deleteProgram','deleteVertexArray','texImage2D','texParameteri','drawArrays']) gl[method] = (...args) => calls.push([method,...args]);
  gl.getShaderParameter = () => true; gl.getProgramParameter = () => true;
  gl.getUniformLocation = (program,name) => name;
  for (const method of ['uniform1i','uniform1f','uniform2f']) gl[method] = (...args) => calls.push([method,...args]);
  gl.copyTexSubImage2D = (...args) => calls.push(['copyTexSubImage2D',params.get(gl.READ_FRAMEBUFFER_BINDING),...args]);
  for (const method of ['readPixels','clear','getContext']) gl[method] = () => { throw new Error(`Forbidden ${method}`); };
  return { gl, calls, params, enabled, native };
}

test('whole-scene finish owns one texture and restores the shared GL state after every actual render', () => {
  const f = framebufferFixture(), errors = [];
  let preferences = { style: 'Anime', vehicle: 'point' };
  const layer = createVedutaFinish(() => preferences, () => ({ latitude: 10, longitude: 20, heading: 90 }), error => errors.push(error));
  const map = { getCanvas: () => ({ clientWidth: 400 }), project: () => ({ x: 80,y: 60 }) };
  layer.onAdd(map,f.gl);
  for (const style of ['Anime','Manga','Watercolor']) { preferences = { ...preferences,style }; layer.render(f.gl); }
  assert.deepEqual(errors,[]);
  assert.equal(f.calls.filter(call => call[0] === 'createTexture').length,1);
  assert.equal(f.calls.filter(call => call[0] === 'texImage2D').length,1);
  assert.equal(f.calls.filter(call => call[0] === 'copyTexSubImage2D').length,3);
  assert.equal(f.calls.filter(call => call[0] === 'drawArrays').length,3);
  assert.ok(f.calls.filter(call => call[0] === 'copyTexSubImage2D').every(call => call[1] === f.native.draw));
  assert.deepEqual(f.calls.filter(call => call[0] === 'uniform1f' && call[1] === 'medium').map(call => call[2]),[0,1,2]);
  assert.equal(f.params.get(f.gl.READ_FRAMEBUFFER_BINDING),f.native.read);
  assert.equal(f.params.get(f.gl.CURRENT_PROGRAM),f.native.program);
  assert.equal(f.params.get(f.gl.VERTEX_ARRAY_BINDING),f.native.vao);
  assert.equal(f.params.get(f.gl.TEXTURE_BINDING_2D),f.native.texture);
  assert.equal(f.params.get(f.gl.ACTIVE_TEXTURE),f.gl.TEXTURE3);
  assert.equal(f.params.get(f.gl.DEPTH_WRITEMASK),true);
  assert.deepEqual([...f.enabled],[f.gl.BLEND,f.gl.DEPTH_TEST,f.gl.SCISSOR_TEST]);
  f.params.set(f.gl.VIEWPORT,[0,0,390,844]); layer.render(f.gl);
  assert.equal(f.calls.filter(call => call[0] === 'texImage2D').length,2);
  layer.onRemove(map,f.gl); layer.render(f.gl);
  assert.equal(f.calls.filter(call => call[0] === 'drawArrays').length,4);
  for (const method of ['deleteTexture','deleteProgram','deleteVertexArray']) assert.equal(f.calls.filter(call => call[0] === method).length,1);
});

test('finish compile failure reports once and never draws a falsely named medium', () => {
  const f = framebufferFixture(), errors = [];
  f.gl.getShaderParameter = () => false; f.gl.getShaderInfoLog = () => 'synthetic compile failure';
  const layer = createVedutaFinish(() => ({ style: 'Anime' }), () => null,error => errors.push(error));
  layer.onAdd({},f.gl); layer.render(f.gl); layer.render(f.gl); layer.onRemove({},f.gl);
  assert.equal(errors.length,1); assert.match(errors[0].message,/synthetic compile failure/);
  assert.equal(f.calls.filter(call => call[0] === 'drawArrays').length,0);
});

test('zero-sized and failed copies restore native state without drawing or retry loops', () => {
  const f=framebufferFixture(),errors=[];
  const layer=createVedutaFinish(()=>({style:'Anime',vehicle:'point'}),()=>null,error=>errors.push(error));
  layer.onAdd({getCanvas:()=>({clientWidth:400})},f.gl);
  f.params.set(f.gl.VIEWPORT,[0,0,0,0]); layer.render(f.gl);
  assert.equal(f.calls.filter(call=>call[0]==='drawArrays').length,0);
  f.params.set(f.gl.VIEWPORT,[0,0,800,600]);
  f.gl.copyTexSubImage2D=()=>{throw new Error('synthetic GPU copy failure');};
  layer.render(f.gl); layer.render(f.gl);
  assert.equal(errors.length,1);
  assert.equal(f.params.get(f.gl.READ_FRAMEBUFFER_BINDING),f.native.read);
  assert.equal(f.params.get(f.gl.ACTIVE_TEXTURE),f.gl.TEXTURE3);
  assert.equal(f.params.get(f.gl.TEXTURE_BINDING_2D),f.native.texture);
  assert.equal(f.calls.filter(call=>call[0]==='drawArrays').length,0);
  layer.onRemove({},f.gl);
});
