// Local development browser QA with synthetic catalogue, radar and pairing fixtures.
// Set PLAYWRIGHT_MODULE to an installed Playwright module; QA_URL selects the dev server.
const {chromium}=require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert=require('assert/strict'),fs=require('fs');
const out='/tmp/sv-road-qa';fs.mkdirSync(out,{recursive:true});
const checks=[],errors=[];const ok=x=>{checks.push(x);console.log('PASS',x)};
const wav=(()=>{const n=48000*35,b=Buffer.alloc(44+n*2);b.write('RIFF');b.writeUInt32LE(b.length-8,4);b.write('WAVEfmt ',8);b.writeUInt32LE(16,16);b.writeUInt16LE(1,20);b.writeUInt16LE(1,22);b.writeUInt32LE(48000,24);b.writeUInt32LE(96000,28);b.writeUInt16LE(2,32);b.writeUInt16LE(16,34);b.write('data',36);b.writeUInt32LE(n*2,40);for(let i=0;i<n;i++)b.writeInt16LE(Math.round(Math.sin(i/48000*Math.PI*440)*1800),44+i*2);return b;})();
(async()=>{
const browser=await chromium.launch({channel:'chrome',headless:true});
const context=await browser.newContext({viewport:{width:773,height:601},geolocation:{latitude:45.4642,longitude:9.19,accuracy:10},permissions:['geolocation']});
await context.addInitScript(()=>{window.__meters=[];const original=AudioNode.prototype.connect;AudioNode.prototype.connect=function(destination,...args){if(destination instanceof AudioDestinationNode){const a=this.context.createAnalyser();a.fftSize=2048;original.call(this,a);original.call(a,destination);window.__meters.push(a);return destination;}return original.call(this,destination,...args)}});
await context.addInitScript(()=>localStorage.setItem('sedicivalvole.diagnostics.v1',JSON.stringify({mode:'dev',automatic:false})));
await context.route('**/api/*diagnostic*',r=>r.fulfill({status:200,body:'{"ok":true}'}));
await context.route('**/api/soundtrack-catalog.php*',r=>r.fulfill({json:{schema:'sedicivalvole.soundtrack-catalog-api.v1',fetchedAt:new Date().toISOString(),tracks:[1,2,3,4].map(id=>({id:String(id),name:`Fixture ${id}`,artist_id:`artist-${id}`,artist_name:'QA artist',album_name:'QA album',license_ccurl:'https://creativecommons.org/licenses/by-nc-sa/4.0/',audio:`https://prod-1.storage.jamendo.com/?trackid=${id}&format=mp32`,shareurl:`https://www.jamendo.com/track/${id}`,musicinfo:{tags:{genres:['electronic']}}}))}}));
await context.route('**/api/soundtrack-audio.php*',r=>r.fulfill({contentType:'audio/wav',body:wav}));
await context.route('**/api/radar-data.php*',r=>r.fulfill({json:{now:Date.now(),ac:[{hex:'abc123',lat:45.48,lon:9.21,seen_pos:0,seen:0,flight:'QA123',t:'A320',category:'A3',alt_baro:12000,gs:240,track:90}]}}));
await context.route('**/api/motion-pair.php',r=>{const data=r.request().postDataJSON();return r.fulfill({json:data.action==='create'?{id:'1'.repeat(32),token:'2'.repeat(64),join:'3'.repeat(64)}:{status:'waiting'}})});
const page=await context.newPage();page.setDefaultTimeout(15000);console.log('browser ready');page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.text().startsWith('QA OUTSIDE'))console.log(m.text())});
await page.goto(`${process.env.QA_URL || 'http://127.0.0.1:5175'}/?qaSpeed=42&qaAtlasDemo=1`);await page.waitForTimeout(3900);
await page.screenshot({path:out+'/intro.png'});
console.log('starting music');await page.getByRole('button',{name:/START MUSIC/}).click();console.log('started');await page.waitForTimeout(2300);
const wake=async()=>{await page.mouse.click(650,250);await page.waitForTimeout(220)};
await wake();console.log('mute',await page.locator('.stop-button').getAttribute('aria-label'));await page.getByRole('button',{name:'Mute music',exact:true}).click();console.log('muted');
assert.equal(await page.getByRole('button',{name:'Unmute music',exact:true}).count(),1);
await wake();await page.locator('.mode-selector').getByRole('button',{name:/Engine/i}).click();await page.waitForTimeout(1600);
assert.equal(await page.getByRole('button',{name:'Mute Engine',exact:true}).count(),1);assert.equal(await page.locator('.source-readout').count(),0);
await page.waitForTimeout(1500);
const rms=()=>page.evaluate(()=>{let sum=0,n=0;for(const a of window.__meters??[]){const samples=new Float32Array(a.fftSize);a.getFloatTimeDomainData(samples);for(const x of samples){sum+=x*x;n++}}return Math.sqrt(sum/Math.max(1,n))});
const engine=await rms();assert.ok(engine>.00001,`Engine silent after Music mute: ${engine}`);
await wake();await page.getByRole('button',{name:'Mute Engine',exact:true}).click();await page.waitForTimeout(1200);const silent=await rms();assert.ok(silent<.000001,`Mute leaked ${silent}`);
console.log('PASS measured Web Audio Engine output after Music mute',engine,'explicit Engine mute',silent);
await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
