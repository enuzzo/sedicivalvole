const {chromium}=await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const out=process.env.QA_OUTPUT || '/tmp/sedicivalvole-live-launch';
await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_EXECUTABLE || undefined,args:['--mute-audio']});
const evidence={build:process.env.EXPECT_BUILD,commit:process.env.EXPECT_COMMIT,url:'https://sedicivalvole.app/',checks:[],errors:[],warnings:[],sends:0};
assert.ok(evidence.build && evidence.commit,'Set EXPECT_BUILD and EXPECT_COMMIT for the exact published candidate.');
async function setup(){
 const context=await browser.newContext({viewport:{width:773,height:601},colorScheme:'light'});const page=await context.newPage();
 page.on('pageerror',e=>evidence.errors.push(e.message));page.on('console',m=>{if(['error','warning'].includes(m.type()))evidence.warnings.push(m.text().slice(0,250));});
 await page.route('**/api/send-diagnostic.php',r=>{evidence.sends++;return r.abort();});
 await page.addInitScript(()=>{const fix=()=>({timestamp:Date.now(),coords:{speed:0,accuracy:5,latitude:0,longitude:0}});Object.defineProperty(navigator,'geolocation',{value:{watchPosition(cb){setTimeout(()=>cb(fix()),100);setTimeout(()=>cb(fix()),600);return 1;},clearWatch(){},getCurrentPosition(cb){cb(fix());}}});
 const play=HTMLMediaElement.prototype.play;window.__played=[];window.__media=[];HTMLMediaElement.prototype.play=function(){window.__played.push(this.currentSrc||this.src);if(!window.__media.includes(this))window.__media.push(this);return play.call(this);};});
 await page.goto(evidence.url);await page.getByRole('button',{name:'Music',exact:true}).waitFor();assert.equal(await page.locator('.cockpit-build').innerText(),evidence.build);return {page,context};
}
async function report(page){await page.locator('.app').click({position:{x:300,y:220}});await page.locator('.topbar-mark').click();await page.getByRole('button',{name:'SHOW RAW',exact:true}).click();const r=JSON.parse(await page.locator('pre').innerText());assert.equal(r.app.build,evidence.build);assert.equal(r.app.commit,evidence.commit);await page.getByRole('button',{name:'Close session report',exact:true}).click();return r;}
try{
 const {page,context}=await setup();await page.getByRole('button',{name:'Soundtrack',exact:true}).click();
 await page.getByRole('button',{name:'Choose soundtrack',exact:true}).click();
 const catalogResponse=page.waitForResponse(r=>r.url().includes('soundtrack-catalog.php')&&new URL(r.url()).searchParams.get('genre')==='jazz'&&r.status()===200,{timeout:60000});
 await page.getByRole('button',{name:'Jazz',exact:true}).click();const catalog=await (await catalogResponse).json();assert.ok(catalog.tracks.length>0);
 await page.waitForFunction(()=>!document.querySelector('.cockpit-start')?.innerText.includes('Music joins when ready'),{},{timeout:60000});
 assert.equal(await page.evaluate(()=>window.__played.length),0);
 await page.screenshot({path:out+'/08-canonical-music.png'});
 await page.getByRole('button',{name:'START MUSIC',exact:true}).click();
 await page.waitForFunction(()=>window.__media.some(a=>!a.paused&&a.currentTime>0.3&&a.playbackRate===1),{},{timeout:60000});
 console.log('LIVE JAZZ AUDIO PASS');const musicReport=await report(page);assert.equal(musicReport.audio.soundtrack.status,'playing');assert.equal(musicReport.audio.soundtrack.contextTopology,'shared');
 evidence.music={app:musicReport.app,audio:musicReport.audio.soundtrack,catalogEntries:catalog.tracks.length,metadata:await page.evaluate(()=>({title:navigator.mediaSession.metadata?.title,artist:navigator.mediaSession.metadata?.artist}))};
 evidence.checks.push('canonical immediate cockpit, actual Jazz catalogue, silent preparation, playing soundtrack and shared context');await context.close();
 const lobo=await setup();await lobo.page.getByRole('button',{name:'Soundtrack',exact:true}).click();await lobo.page.getByRole('button',{name:'Choose soundtrack',exact:true}).click();
 const loboResponse=lobo.page.waitForResponse(r=>r.url().includes('/audio/illobo/catalog.json')&&r.status()===200,{timeout:60000});
 await lobo.page.getByRole('button',{name:'Lobo Playlist',exact:true}).click();const loboCatalog=await (await loboResponse).json();assert.equal(loboCatalog.tracks.length,29);
 await lobo.page.waitForFunction(()=>!document.querySelector('.cockpit-start')?.innerText.includes('Music joins when ready'),{},{timeout:60000});
 await lobo.page.getByRole('button',{name:'START MUSIC',exact:true}).click();await lobo.page.waitForFunction(()=>window.__media.some(a=>!a.paused&&a.currentTime>0.3&&a.playbackRate===1),{},{timeout:60000});
 console.log('LIVE LOBO AUDIO PASS');evidence.lobo={tracks:loboCatalog.tracks.length,metadata:await lobo.page.evaluate(()=>({title:navigator.mediaSession.metadata?.title,artist:navigator.mediaSession.metadata?.artist}))};assert.match(evidence.lobo.metadata.artist,/Illobo/);evidence.checks.push('actual 29-track Lobo catalogue and playback');await lobo.context.close();
 const engine=await setup();await engine.page.getByRole('button',{name:'Engine',exact:true}).click();await engine.page.locator('.cockpit-engine-profiles button').filter({hasText:'Rosso'}).click();await engine.page.screenshot({path:out+'/09-canonical-engine.png'});
 await engine.page.getByRole('button',{name:'START ENGINE',exact:true}).click();await engine.page.getByText('SAMPLE ENGINE',{exact:true}).waitFor({timeout:60000});await engine.page.getByText('IDLE BLIP',{exact:true}).waitFor({timeout:12000});
 assert.equal(await engine.page.evaluate(()=>window.__played.length),0);assert.equal(await engine.page.locator('.engine-rev:enabled').count(),2);assert.equal(await engine.page.getByRole('button',{name:'Open Performance FX',exact:true}).count(),0);assert.equal(await engine.page.locator('.effect-badge.is-active').count(),0);
 const engineReport=await report(engine.page);assert.equal(engineReport.app.engine.status,'ready');assert.ok(engineReport.app.engine.decodedBytes>0);evidence.engine=engineReport.app;evidence.checks.push('direct public Rosso startup, dry Engine, dual stationary controls and idle blip');
 assert.equal(evidence.sends,0);assert.deepEqual(evidence.errors,[]);await fs.writeFile(out+'/canonical-browser.json',JSON.stringify(evidence,null,2)+'\n');console.log('LIVE COCKPIT PASS',evidence.build,evidence.checks);
}finally{await browser.close();}
