import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const out = process.env.QA_OUTPUT || '/tmp/sv-cockpit-qa';
await fs.mkdir(out, {recursive:true});
const base = process.env.QA_URL || 'http://127.0.0.1:5173/';
const fixture = Buffer.alloc(44 + 48000 * 20 * 2);
fixture.write('RIFF',0);fixture.writeUInt32LE(fixture.length-8,4);fixture.write('WAVEfmt ',8);fixture.writeUInt32LE(16,16);fixture.writeUInt16LE(1,20);fixture.writeUInt16LE(1,22);fixture.writeUInt32LE(48000,24);fixture.writeUInt32LE(96000,28);fixture.writeUInt16LE(2,32);fixture.writeUInt16LE(16,34);fixture.write('data',36);fixture.writeUInt32LE(fixture.length-44,40);
for(let i=0;i<(fixture.length-44)/2;i++)fixture.writeInt16LE(Math.round(Math.sin(i*2*Math.PI*220/48000)*500),44+i*2);
const browser = await chromium.launch({headless:true,executablePath:process.env.CHROME_EXECUTABLE || undefined,args:['--mute-audio']});
const evidence={url:base,viewports:[],checks:[],errors:[],warnings:[],failedResponses:[],requests:[],sends:0};
const check=(name)=>evidence.checks.push(name);
const track=(id,genre)=>({id:String(id),name:`${genre} fixture ${id}`,artist_id:'qa',artist_name:'Synthetic QA',album_name:'Launch fixture',license_ccurl:'https://creativecommons.org/licenses/by-nc-sa/4.0/',audio:`https://prod-1.storage.jamendo.com/?trackid=${id}&format=mp32`,shareurl:`https://www.jamendo.com/track/${id}`,musicinfo:{tags:{genres:[genre]}}});
async function setup({delayJazz=0, muted=false}={}) {
  const context=await browser.newContext({viewport:{width:773,height:601},colorScheme:'light'});
  const page=await context.newPage();
  page.on('response',r=>{if(r.status()>=400)evidence.failedResponses.push({url:r.url(),status:r.status()});});
  page.on('pageerror',e=>evidence.errors.push(e.message));page.on('console',m=>{if(['error','warning'].includes(m.type()))evidence.warnings.push(m.text().slice(0,220));});
  await page.route(/\/api\/(?:send-diagnostic|session-report)\.php/,r=>{evidence.sends++;return r.abort();});
  await page.route('**/api/soundtrack-catalog.php?*',async r=>{
    const u=new URL(r.request().url());const genre=u.searchParams.get('genre') || u.searchParams.get('speed') || 'all';evidence.requests.push(genre);
    if(genre==='jazz'&&delayJazz)await new Promise(resolve=>setTimeout(resolve,delayJazz));
    const id=genre==='jazz'?2000:genre==='rock'?3000:1000;
    await r.fulfill({json:{schema:'sedicivalvole.soundtrack-catalog-api.v1',generatedAt:new Date().toISOString(),tracks:[track(id+1,genre),track(id+2,genre),track(id+3,genre)]}}).catch(()=>{});
  });
  await page.route('**/audio/illobo/catalog.json',r=>r.fulfill({json:{schema:'sedicivalvole.illobo-public-catalog.v1',tracks:[{id:'qa-lobo',title:'Synthetic QA fixture',filename:'qa-fixture.mp3'}]}}));
  await page.route('**/audio/illobo/qa-fixture.mp3',r=>r.fulfill({contentType:'audio/wav',body:fixture}));
  await page.route('**/artwork/illobo/qa-fixture.webp',r=>r.fulfill({status:204}));
  await page.route('**/api/soundtrack-audio.php?*',r=>r.fulfill({contentType:'audio/wav',body:fixture}));
  await page.addInitScript(({muted})=>{
    if(!sessionStorage.getItem('qa-initialized')){localStorage.setItem('sedicivalvole.preferences.v2',JSON.stringify({soundtrackSelection:{kind:'genre',id:'rock'},launchSoundtrackMode:'precise',muted}));sessionStorage.setItem('qa-initialized','1');}
    const originalPlay=HTMLMediaElement.prototype.play;window.__qaPlayed=[];window.__qaMedia=[];
    HTMLMediaElement.prototype.play=function(){window.__qaPlayed.push(this.currentSrc||this.src);if(!window.__qaMedia.includes(this))window.__qaMedia.push(this);return originalPlay.call(this);};
    const AC=window.AudioContext;window.__qaContexts=[];window.AudioContext=class extends AC{constructor(...args){super(...args);window.__qaContexts.push(this);}};
    const fix=()=>({timestamp:Date.now(),coords:{speed:0,accuracy:5,latitude:0,longitude:0}});Object.defineProperty(navigator,'geolocation',{value:{watchPosition(cb){setTimeout(()=>cb(fix()),100);setTimeout(()=>cb(fix()),600);return 1;},clearWatch(){},getCurrentPosition(cb){cb(fix());}}});
  },{muted});
  await page.goto(base);await page.getByRole('button',{name:'START MUSIC',exact:true}).waitFor();
  assert.match(await page.title(),/^sedicivalvole/);assert.equal(await page.locator('vite-error-overlay').count(),0);
  return {context,page};
}
try {
 const {context,page}=await setup();await page.waitForTimeout(900);
 if(process.env.QA_BASELINE){await page.getByRole('button',{name:'Soundtrack',exact:true}).click();await page.waitForTimeout(900);await page.screenshot({path:`${out}/baseline.png`});console.log(await page.locator('.launch-cockpit').evaluate(el=>({height:el.getBoundingClientRect().height,colors:['--ui-surface','--ui-text','--ui-line','--ui-accent-text'].map(k=>getComputedStyle(el).getPropertyValue(k))})));await context.close();}
 else {
 assert.equal(await page.getByRole('button',{name:'Soundtrack',exact:true}).getAttribute('aria-pressed'),'true');
 assert.equal(await page.locator('.cockpit-preset-options>button').count(),2);
 const presetNames=await page.locator('.cockpit-preset-options').innerText();
 const colors=await page.locator('.launch-cockpit').evaluate(el=>['--ui-surface','--ui-text','--ui-line','--ui-accent-text'].map(k=>getComputedStyle(el).getPropertyValue(k)));
 console.log('COLORS',colors);
 const images=await page.locator('.cockpit-thumb').evaluateAll(es=>es.map(e=>({width:e.width,render:e.getBoundingClientRect().width,radius:getComputedStyle(e).borderRadius})));
 assert.ok(images.every(e=>e.render===80&&e.radius==='6px'));check('80px square covers; inherited UI colors');
 const controls=await page.locator('.cockpit-choice-actions button').evaluateAll(es=>es.map(e=>({height:e.getBoundingClientRect().height,padding:parseFloat(getComputedStyle(e).paddingTop),border:getComputedStyle(e).borderColor,hit:parseFloat(getComputedStyle(e,'::after').height)})));assert.ok(controls.every(e=>e.height===32&&e.padding===2&&e.hit===48&&e.border!=='transparent'));const extendedHits=await page.locator('.cockpit-choice-actions button').evaluateAll(es=>es.every(e=>{const r=e.getBoundingClientRect();return e.contains(document.elementFromPoint(r.x+r.width/2,r.bottom+6));}));assert.equal(extendedHits,true);
 assert.equal(await page.locator('.cockpit-palette-group').evaluate(e=>getComputedStyle(e).borderLeftWidth),'1px');assert.equal(await page.locator('.cockpit-preset-thumb').count(),2);const author=await page.locator('.cockpit-metadata-row span').evaluate(e=>getComputedStyle(e).textAlign);assert.equal(author,'right');check('outlined compact actions, author alignment, round presets and palette divider');
 assert.match(await page.locator('.cockpit-value').first().innerText(),/fixture/);assert.match(await page.locator('.cockpit-value').first().innerText(),/Synthetic QA/);check('prepared track metadata matches current genre');
 await page.screenshot({path:`${out}/compact-773.png`});
 await page.getByRole('button',{name:'Choose soundtrack',exact:true}).click();await page.getByRole('button',{name:'Jazz',exact:true}).click();await page.waitForTimeout(400);
 assert.match(await page.locator('.cockpit-value').first().innerText(),/jazz fixture/);
 const genre=await page.locator('.cockpit-value small').first().innerText();await page.getByRole('button',{name:'Random soundtrack',exact:true}).click();assert.notEqual(await page.locator('.cockpit-value small').first().innerText(),genre);
 const visual=await page.locator('.cockpit-visual .cockpit-value strong').innerText();await page.getByRole('button',{name:'Random visual',exact:true}).click();assert.notEqual(await page.locator('.cockpit-visual .cockpit-value strong').innerText(),visual);
 const palette=await page.getByRole('button',{name:'Next palette'}).getAttribute('title');await page.getByRole('button',{name:'Next palette'}).click();assert.notEqual(await page.getByRole('button',{name:'Next palette'}).getAttribute('title'),palette);assert.equal(await page.locator('.cockpit-dialog').count(),0);
 assert.equal(await page.locator('.cockpit-preset-options').innerText(),presetNames);check('independent random choices and direct palette cycle keep recommendations stable');
 await page.locator('.cockpit-preset-options>button').first().click();assert.equal(await page.locator('.cockpit-preset-options>button[aria-pressed=true]').count(),1);await page.waitForTimeout(500);await page.screenshot({path:`${out}/preset-dark.png`});check('genre-labelled preset applies coherent selection');
 await page.getByRole('button',{name:'Choose visual',exact:true}).click();await page.getByRole('button').filter({hasText:/^Air Atlas/}).click();await page.locator('.cockpit-visual .cockpit-thumb').evaluate(e=>e.decode());assert.equal(await page.locator('.cockpit-visual .cockpit-thumb').evaluate(e=>getComputedStyle(e).backgroundColor),'rgb(241, 233, 219)');await page.screenshot({path:`${out}/dark-aircraft-preview.png`});check('black SVG preview keeps its original light backing in dark mode');
 await page.getByRole('button',{name:'Mute',exact:true}).click();await page.getByRole('button',{name:'START VISUALS',exact:true}).waitFor();assert.equal(await page.getByRole('button',{name:'Random soundtrack',exact:true}).count(),0);assert.equal(await page.evaluate(()=>window.__qaPlayed.length),0);check('Mute retains visual and all Intro choices stay silent');
 await page.getByRole('button',{name:'Soundtrack',exact:true}).click();await page.waitForTimeout(600);
 for(const [width,height] of [[1280,800],[1280,1200],[874,402],[956,440],[390,844]]){
  await page.setViewportSize({width,height});await page.waitForTimeout(150);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  const rowHeight=await page.locator('.cockpit-choices').evaluate(e=>e.getBoundingClientRect().height);if(width>650)assert.equal(rowHeight,82);
  const sizes=await page.locator('.launch-cockpit button').evaluateAll(es=>es.map(e=>Math.max(e.getBoundingClientRect().height,parseFloat(getComputedStyle(e,'::after').height)||0)));assert.ok(sizes.every(h=>h>=48));
  await page.screenshot({path:`${out}/compact-${width}-${height}.png`});
 }
 check('compact row does not expand on tall desktop; Tesla and phone controls retain 48px targets');
 await page.evaluate(()=>{const key='sedicivalvole.preferences.v2';const p=JSON.parse(localStorage.getItem(key)||'{}');localStorage.setItem(key,JSON.stringify({...p,musicMode:'play-road'}));});await page.reload();await page.getByRole('button',{name:'Play the Road',exact:true}).waitFor();assert.equal(await page.getByRole('button',{name:'Soundtrack',exact:true}).getAttribute('aria-pressed'),'true');check('every Intro starts with Soundtrack even after saved Play the Road');
 assert.deepEqual(evidence.errors,[]);assert.deepEqual(evidence.failedResponses,[]);
 await fs.writeFile(`${out}/evidence.json`,JSON.stringify(evidence,null,2));console.log('PASS',evidence.checks,evidence.errors);await context.close();
 }
}finally{await browser.close();}
