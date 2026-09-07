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
  await page.route('**/api/send-diagnostic.php',r=>{evidence.sends++;return r.abort();});
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
    if(!sessionStorage.getItem('qa-initialized')){localStorage.setItem('sedicivalvole.preferences.v2',JSON.stringify({musicMode:'soundtrack',soundtrackSelection:{kind:'genre',id:'rock'},launchSoundtrackMode:'precise',muted}));sessionStorage.setItem('qa-initialized','1');}
    const originalPlay=HTMLMediaElement.prototype.play;window.__qaPlayed=[];
    HTMLMediaElement.prototype.play=function(){window.__qaPlayed.push(this.currentSrc||this.src);return originalPlay.call(this);};
    const AC=window.AudioContext;window.__qaContexts=[];window.AudioContext=class extends AC{constructor(...args){super(...args);window.__qaContexts.push(this);}};
    const fix=()=>({timestamp:Date.now(),coords:{speed:0,accuracy:5,latitude:0,longitude:0}});Object.defineProperty(navigator,'geolocation',{value:{watchPosition(cb){setTimeout(()=>cb(fix()),100);setTimeout(()=>cb(fix()),600);return 1;},clearWatch(){},getCurrentPosition(cb){cb(fix());}}});
  },{muted});
  await page.goto(base);await page.getByRole('button',{name:'START MUSIC',exact:true}).waitFor();
  assert.match(await page.title(),/^sedicivalvole/);assert.equal(await page.locator('vite-error-overlay').count(),0);
  return {context,page};
}
async function geometry(page,name){
  const result=await page.evaluate(()=>{
    const panel=document.querySelector('.launch-cockpit');const rect=panel.getBoundingClientRect();
    const items=[...panel.querySelectorAll('button')].filter(el=>el.getBoundingClientRect().width&&el.getBoundingClientRect().height).map(el=>{const r=el.getBoundingClientRect();return {name:el.getAttribute('aria-label')||el.innerText,height:r.height,bottom:r.bottom,right:r.right,hit:el.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2))};});
    return {width:innerWidth,height:innerHeight,panel:{x:rect.x,y:rect.y,right:rect.right,bottom:rect.bottom},items,overflow:document.documentElement.scrollWidth>innerWidth};
  });
  assert.equal(result.overflow,false);assert.ok(result.panel.x>=0&&result.panel.right<=result.width&&result.panel.bottom<=result.height);
  for(const item of result.items){assert.ok(item.height>=48,JSON.stringify(item));assert.ok(item.hit,JSON.stringify(item));assert.ok(item.bottom<=result.height&&item.right<=result.width,JSON.stringify(item));}
  evidence.viewports.push({name,...result});
}
try {
  const {context,page}=await setup();
  await page.waitForTimeout(1200);assert.equal(await page.evaluate(()=>window.__qaPlayed.length),0);check('first screen exposes Music and Engine without introductory click; silent preparation');
  await geometry(page,'Tesla 773x601');
  await page.getByRole('button',{name:'Choose soundtrack',exact:true}).click();
  assert.equal(await page.getByRole('group',{name:'Soundtrack genre',exact:true}).getByRole('button').count(),15);
  await page.screenshot({path:`${out}/02-genres.png`});
  await page.keyboard.press('Escape');assert.equal(await page.getByRole('button',{name:'Choose soundtrack',exact:true}).evaluate(el=>el===document.activeElement),true);
  await page.getByRole('button',{name:'Choose soundtrack',exact:true}).click();await page.getByRole('button',{name:'Jazz',exact:true}).click();await page.waitForTimeout(350);assert.match(await page.locator('.cockpit-value').first().innerText(),/Jazz/);check('15 exact genres; Escape restores focus');
  await page.screenshot({path:`${out}/01-music.png`});
  await page.getByRole('button',{name:'Choose soundtrack',exact:true}).click();await page.getByRole('button',{name:'Pace',exact:true}).click();await page.screenshot({path:`${out}/03-pace.png`});await page.getByRole('button',{name:'Slow',exact:true}).click();assert.match(await page.locator('.cockpit-value').first().innerText(),/Slow/);check('pace selection uses catalogue energy filters');
  await page.reload();await page.getByRole('button',{name:'START MUSIC',exact:true}).waitFor();assert.match(await page.locator('.cockpit-value').first().innerText(),/Slow/);check('precise pace survives reload');
  await page.getByRole('button',{name:'Feeling lucky',exact:true}).click();const lucky1=await page.locator('.cockpit-value').first().innerText();
  await page.getByRole('button',{name:'Feeling lucky',exact:true}).click();const lucky2=await page.locator('.cockpit-value').first().innerText();assert.notEqual(lucky1,lucky2);
  await page.reload();await page.getByRole('button',{name:'START MUSIC',exact:true}).waitFor();assert.notEqual(await page.locator('.cockpit-value').first().innerText(),lucky2);check('lucky excludes immediate repeats and rolls again on reload');
  await page.getByRole('button',{name:'Choose soundtrack',exact:true}).click();await page.getByRole('button',{name:'Lobo Playlist',exact:true}).click();assert.match(await page.locator('.cockpit-value').first().innerText(),/Lobo Playlist/);check('Lobo playlist remains selectable');
  await page.getByRole('button',{name:'Night Glass',exact:true}).click();assert.match(await page.locator('.cockpit-value').first().innerText(),/Lounge/);assert.match(await page.locator('.cockpit-visual').innerText(),/Vertigo/);await page.screenshot({path:`${out}/04-dark-preset.png`});
  await page.getByRole('button',{name:'Neon Groove',exact:true}).click();assert.match(await page.locator('.cockpit-value').first().innerText(),/Funk/);check('curated presets select music, visual and appearance together');
  await page.getByRole('button',{name:'Change visual',exact:true}).click();assert.equal(await page.locator('.cockpit-picker-options>button').count(),8);
  await page.locator('.cockpit-picker-options>button').filter({hasText:'Gradient'}).click();assert.equal(await page.locator('.cockpit-picker-options>button').count(),3);await page.locator('.cockpit-picker-options>button').filter({hasText:'Acid Orchard'}).click();assert.match(await page.locator('.cockpit-visual').innerText(),/Acid Orchard/);check('all eight visual families and exact Gradient variants');
  await page.getByRole('button',{name:'Play the Road',exact:true}).click();await page.getByRole('button',{name:'Choose adaptive score',exact:true}).click();assert.equal(await page.locator('.cockpit-picker-options>button').count(),3);await page.locator('.cockpit-picker-options>button').filter({hasText:'Nightshift'}).click();assert.match(await page.locator('.cockpit-value').first().innerText(),/Nightshift/);check('only three implemented adaptive scores selectable');
  await page.getByRole('button',{name:'Engine',exact:true}).click();await page.locator('.cockpit-engine-profiles button').filter({hasText:'Rosso'}).click();await geometry(page,'Engine Tesla');await page.screenshot({path:`${out}/05-engine.png`});assert.equal(await page.getByRole('button',{name:'Feeling lucky',exact:true}).count(),0);check('Engine exposes profiles without irrelevant music controls');
  await page.setViewportSize({width:390,height:844});await geometry(page,'390x844 Engine');await page.screenshot({path:`${out}/06-phone-engine.png`});
  await page.getByRole('button',{name:'Music',exact:true}).click();await page.getByRole('button',{name:'Soundtrack',exact:true}).click();await geometry(page,'390x844 Music');await page.screenshot({path:`${out}/07-phone-music.png`});
  await page.setViewportSize({width:1280,height:800});await geometry(page,'1280x800');
  await page.setViewportSize({width:773,height:601});await page.getByRole('button',{name:'About',exact:true}).click();assert.equal(await page.getByRole('link',{name:'Source · github.com/enuzzo/sedicivalvole',exact:true}).count(),1);await page.getByRole('button',{name:'DONE',exact:true}).click();
  await page.getByRole('button',{name:'Open Buy Me a Coffee support panel',exact:true}).click();await page.getByText('Fuel the experiment',{exact:true}).waitFor();await page.getByRole('button',{name:'CLOSE',exact:true}).click();check('source, credits and accessible support remain available');
  assert.equal(await page.evaluate(()=>window.__qaPlayed.length),0);check('all prelaunch choices remain silent');await context.close();
  const race=await setup({delayJazz:1800});await race.page.waitForTimeout(500);
  await race.page.getByRole('button',{name:'Choose soundtrack',exact:true}).click();await race.page.getByRole('button',{name:'Jazz',exact:true}).click();
  await race.page.getByRole('button',{name:'START MUSIC',exact:true}).click();await race.page.waitForTimeout(3500);
  const played=await race.page.evaluate(()=>window.__qaPlayed);assert.ok(played.length>0);assert.ok(played.every(url=>/track=200[123]/.test(url)),JSON.stringify(played));
  const rates=await race.page.evaluate(()=>[...document.querySelectorAll('audio')].map(el=>el.playbackRate));assert.ok(rates.every(rate=>rate===1));check('START during delayed new genre never plays old queue; new selection plays at 1x');await race.context.close();
  const engineRun=await setup();await engineRun.page.getByRole('button',{name:'Engine',exact:true}).click();await engineRun.page.getByRole('button',{name:'START ENGINE',exact:true}).dblclick();await engineRun.page.getByText('SAMPLE ENGINE',{exact:true}).waitFor({timeout:25000});
  assert.equal(await engineRun.page.evaluate(()=>window.__qaContexts.filter(ctx=>ctx.state!=='closed').length),1);assert.equal(await engineRun.page.evaluate(()=>window.__qaPlayed.length),0);check('direct Engine start, repeated click, one context and no soundtrack');await engineRun.context.close();
  const silent=await setup({muted:true});await silent.page.waitForTimeout(400);await silent.page.getByRole('button',{name:'START MUSIC',exact:true}).click();await silent.page.waitForTimeout(1200);assert.equal(await silent.page.evaluate(()=>window.__qaPlayed.length),0);check('saved mute survives soundtrack launch');await silent.context.close();
  assert.equal(evidence.sends,0);assert.deepEqual(evidence.errors,[]);assert.deepEqual(evidence.failedResponses,[]);
  assert.ok(evidence.warnings.every(message=>message.includes('AudioContext was not allowed to start')),JSON.stringify(evidence.warnings));
  await fs.writeFile(`${out}/browser-evidence.json`,JSON.stringify(evidence,null,2));console.log('COCKPIT QA PASS',evidence.checks.length,'checks',evidence.warnings);
} finally {await browser.close();}
