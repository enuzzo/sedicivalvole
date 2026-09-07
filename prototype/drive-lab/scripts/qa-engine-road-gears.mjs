import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const out=process.env.QA_OUTPUT || '/tmp/sedicivalvole-road-gears';await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_EXECUTABLE || undefined,args:['--mute-audio']});
const evidence={url:process.env.QA_URL || 'http://127.0.0.1:5173/',errors:[],sends:0,profiles:[]};
try {
 for(const name of ['Mono','Rosso','Touring']) {
  const context=await browser.newContext({viewport:{width:773,height:601}}),page=await context.newPage();
  page.on('pageerror',e=>evidence.errors.push(e.message));await page.route('**/api/send-diagnostic.php',r=>{evidence.sends++;return r.abort();});
  await page.addInitScript(()=>{
   window.__speed=0;window.__gpsAvailable=false;
   const fix=()=>({timestamp:Date.now(),coords:{speed:window.__gpsAvailable?window.__speed/3.6:null,accuracy:5,latitude:0,longitude:0}});
   Object.defineProperty(navigator,'geolocation',{value:{watchPosition(cb){return setInterval(()=>cb(fix()),150);},clearWatch(id){clearInterval(id);},getCurrentPosition(cb){cb(fix());}}});
   const AC=window.AudioContext;window.__meters=[];window.AudioContext=class extends AC{createAnalyser(){const a=super.createAnalyser();window.__meters.push(a);return a;}};
  });
  await page.goto(evidence.url);await page.locator('.cockpit-build').waitFor();evidence.build=await page.locator('.cockpit-build').innerText();if(process.env.EXPECT_BUILD)assert.equal(evidence.build,process.env.EXPECT_BUILD);
  await page.getByRole('button',{name:'Engine',exact:true}).click();await page.locator('.cockpit-engine-profiles button').filter({hasText:name}).click();await page.getByRole('button',{name:'START ENGINE',exact:true}).click();await page.getByText('SAMPLE ENGINE',{exact:true}).waitFor({timeout:60000});
  if(name==='Mono'){
   await page.getByText('IDLE · NO SPEED SIGNAL',{exact:true}).waitFor();await page.waitForTimeout(6100);assert.equal(await page.locator('.engine-tach').getAttribute('aria-valuenow'),'1000');assert.equal(await page.locator('.engine-rev:disabled').count(),2);await page.screenshot({path:out+'/no-speed-signal.png'});
  }
  await page.evaluate(()=>window.__gpsAvailable=true);await page.getByText('IDLE · AUTO BLIPS ON',{exact:true}).waitFor();
  if(name==='Mono'){await page.getByText('IDLE BLIP',{exact:true}).waitFor({timeout:8000});await page.waitForTimeout(200);const rpm=Number(await page.locator('.engine-tach').getAttribute('aria-valuenow'));assert.ok(rpm>1100 && rpm<=1450);evidence.idleBlipRpm=rpm;await page.screenshot({path:out+'/idle-blip.png'});}
  const trace=await page.evaluate(()=>new Promise(resolve=>{const rows=[];let steps=0;const timer=setInterval(()=>{window.__speed=Math.min(70,++steps);const a=window.__meters.at(-1),buf=new Float32Array(a.fftSize);a.getFloatTimeDomainData(buf);rows.push({speed:window.__speed,gear:document.querySelectorAll('.engine-primary strong')[1].textContent,rpm:Number(document.querySelector('.engine-tach').getAttribute('aria-valuenow')),peak:Math.max(...buf.map(Math.abs))});if(steps>=85){clearInterval(timer);resolve(rows);}},150);}));
  const second=trace.find(r=>r.gear==='2'),third=trace.find(r=>r.gear==='3');assert.ok(second&&second.speed>=35&&second.speed<=40,JSON.stringify(second));assert.ok(third&&third.speed>=65&&third.speed<=70,JSON.stringify(third));assert.equal(trace.at(-1).gear,'3');assert.ok(trace.every(r=>r.peak<1));assert.ok(trace.some(r=>r.peak>.001));
  evidence.profiles.push({name,secondAt:second.speed,thirdAt:third.speed,trace});console.log(name,'second',second.speed,'third',third.speed);
  if(name==='Mono')await page.screenshot({path:out+'/third-at-70.png'});
  await context.close();
 }
 assert.deepEqual(evidence.errors,[]);assert.equal(evidence.sends,0);await fs.writeFile(out+'/browser-evidence.json',JSON.stringify(evidence,null,2)+'\n');console.log('ROAD GEARS PASS',evidence.build);
}finally {await browser.close();}
