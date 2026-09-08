const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
// Local QA only: the compiled option substitutes an authenticated-page fixture,
// never a real owner's login or credentials. All sending endpoints are blocked.
const url = process.env.QA_URL || 'http://127.0.0.1:5173/lab.html';
assert.ok(['127.0.0.1', 'localhost'].includes(new URL(url).hostname), 'Use a local test server');
const endSecond = process.env.QA_SHORT === '1' ? 18 : 68;
const out = process.env.QA_OUTPUT || '/tmp/sedicivalvole-engine-ab-qa'; await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_EXECUTABLE || undefined,args:['--mute-audio']});
const result={url, replaySeconds:endSecond, compiledFixture:Boolean(process.env.QA_INLINE), errors:[],mail:[],takes:[],screens:[]};
let page;
try{
 page=await browser.newPage({viewport:{width:773,height:601},acceptDownloads:true});
 page.on('pageerror',e=>result.errors.push(e.message));
 await page.route(/\/(?:api\/(?:send-diagnostic|session-report)|lab\/send)\.php/,r=>{result.mail.push(r.request().url());return r.abort();});
 if(process.env.QA_INLINE){
  const php=await fs.readFile(process.env.QA_INLINE,'utf8');
  const head=php.slice(php.toLowerCase().indexOf('<!doctype html>'),php.indexOf('<body>')+6);
  const app=php.slice(php.indexOf('<div id="lab-root"></div>'),php.lastIndexOf('<?php endif; ?>'));
  const html=(head+app+'</body></html>').replace(/<\?=\s*htmlspecialchars\(\$nonce[\s\S]*?\?>/g,'local-qa').replace(/<\?=[\s\S]*?\?>/g,'"local-qa-unused"');
  assert.ok(!html.includes('<?'));assert.ok(!html.includes('name="password"'));
  await page.route('**/lab/',r=>r.fulfill({contentType:'text/html',body:html}));
 }

 await page.addInitScript(()=>{window.qaContexts=[];const Native=AudioContext;window.AudioContext=class extends Native{constructor(opts){super(opts);window.qaContexts.push(this);}};window.qaVoices=[];const Voice=AudioWorkletNode;window.AudioWorkletNode=class extends Voice{constructor(...args){super(...args);this.qaOptions=args[2];this.qaDisposed=false;const send=this.port.postMessage.bind(this.port);this.port.postMessage=v=>{if(v==='dispose')this.qaDisposed=true;send(v);};this.addEventListener('processorerror',()=>window.qaProcessorError=true);window.qaVoices.push(this);}};});
 await page.goto(url);
 await page.getByLabel('LAB visual tool').selectOption('engine');
 await page.getByRole('heading',{name:'Engine A/B Listening'}).waitFor();
 await page.screenshot({path:out+'/ab-773x601.png'});
 for(const key of ['A','B']){
  await page.getByRole('button',{name:new RegExp('PLAY '+key)}).click();
  await page.waitForFunction(key=>new RegExp(key+' 16s').test(document.querySelector('.engine-lab-controls').textContent),key,{timeout:35000});
  const state=JSON.parse(await page.locator('.engine-lab-controls pre').textContent());assert.equal(state.gear,key==='A'?3:2);
  assert.equal(await page.evaluate(()=>window.qaContexts.length),1);
  assert.equal(await page.evaluate(()=>window.qaVoices.filter(v=>!v.qaDisposed).length),1);
  result.takes.push({key,at16:{gear:state.gear,rpm:state.rpm},voice:await page.evaluate(()=>window.qaVoices.at(-1).qaOptions.processorOptions)});
  console.log(key,'30 km/h gear',state.gear);
  await page.waitForFunction(({key,endSecond})=>new RegExp(key+' '+endSecond+'s').test(document.querySelector('.engine-lab-controls').textContent),{key,endSecond},{timeout:65000});
  if (endSecond < 68) await page.getByRole('button',{name:'STOP AUDIO',exact:true}).click();
  await page.waitForFunction(()=>Array.from(document.querySelectorAll('button')).find(button=>button.textContent==='STOP AUDIO')?.disabled);
  console.log(key,'complete');
 }
 await page.getByText('Preference & notes · 0 saved',{exact:true}).click();
 await page.getByLabel('Listening preference').selectOption('B');await page.getByLabel('Listening note').fill('Clearer body; <test> remains text.');
 await page.getByRole('button',{name:'SAVE PREFERENCE',exact:true}).click();
 await page.getByText('Preference saved on this device.',{exact:true}).waitFor();
 const download=page.waitForEvent('download');await page.getByRole('button',{name:'EXPORT NOTES (1)',exact:true}).click();const d=await download;await d.saveAs(out+'/notes.json');
 const saved=JSON.parse(await fs.readFile(out+'/notes.json','utf8'));assert.deepEqual(saved.notes[0].listenedSeconds,{A:endSecond,B:endSecond});assert.equal(saved.notes[0].preference,'B');
 await page.reload();await page.getByLabel('LAB visual tool').selectOption('engine');await page.getByText('Preference & notes · 1 saved',{exact:true}).click();assert.ok((await page.locator('.engine-listening-notes').textContent()).includes('Clearer body'));
 await page.getByLabel('Listening note').fill('Keep this draft');await page.getByLabel('Comparison engine').selectOption('otto');await page.getByLabel('Comparison engine').selectOption('mono');
 await page.getByText('Preference & notes · 1 saved',{exact:true}).click();assert.equal(await page.getByLabel('Listening note').inputValue(),'Keep this draft');
 await page.getByLabel('Listening preference').selectOption('B');
 await page.evaluate(()=>{const native=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k==='sedicivalvole.engine-listening.v1')throw new Error('quota');return native.call(this,k,v);};});
 await page.getByRole('button',{name:'SAVE PREFERENCE',exact:true}).click();await page.getByText('Could not save locally. Keep your note and try again.',{exact:true}).waitFor();assert.equal(await page.getByLabel('Listening note').inputValue(),'Keep this draft');
 await page.getByRole('button',{name:/PLAY B/}).click();await page.waitForFunction(()=>document.querySelector('.engine-lab-controls')?.textContent.includes('B 2s'),null,{timeout:30000});
 await page.evaluate(()=>{Object.defineProperty(document,'visibilityState',{get:()=> 'hidden',configurable:true});document.dispatchEvent(new Event('visibilitychange'));});
 await page.waitForFunction(()=>document.querySelector('.engine-lab-controls').textContent.includes('Replay stopped while hidden'));
 await page.evaluate(()=>{Object.defineProperty(document,'visibilityState',{get:()=> 'visible',configurable:true});document.dispatchEvent(new Event('visibilitychange'));});
 await page.waitForTimeout(500);assert.ok(await page.getByRole('button',{name:'STOP AUDIO',exact:true}).isDisabled());
 for(const [width,height] of [[773,601],[956,440]]){await page.setViewportSize({width,height});await page.screenshot({path:out+`/notes-${width}x${height}.png`});result.screens.push({width,height});}
 assert.deepEqual(result.errors,[]);assert.ok(!await page.evaluate(()=>window.qaProcessorError));result.saved=saved;result.pass=true;
 await fs.writeFile(out+'/evidence.json',JSON.stringify(result,null,2));console.log('A/B LAB PASS',out);
} catch(error) {
 result.pass=false; result.failure=String(error.message);
 await fs.writeFile(out+'/evidence.json',JSON.stringify(result,null,2));
 if(page) await page.screenshot({path:out+'/failure.png'}).catch(()=>{});
 throw error;
} finally {await browser.close();}
