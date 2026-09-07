import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const out=process.env.QA_OUTPUT || '/tmp/sedicivalvole-show-off';await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_EXECUTABLE || undefined,args:['--mute-audio']});
const evidence={url:process.env.QA_URL || 'http://127.0.0.1:5173/',errors:[],sends:0,profiles:[]};
try {
 const page=await browser.newPage({viewport:{width:773,height:601}});
 page.on('pageerror',e=>evidence.errors.push(e.message));
 await page.route('**/api/send-diagnostic.php',r=>{evidence.sends++;return r.abort();});
 await page.addInitScript(()=>{
  const fix=()=>({timestamp:Date.now(),coords:{speed:0,accuracy:5,latitude:0,longitude:0}});
  Object.defineProperty(navigator,'geolocation',{value:{watchPosition(cb){setTimeout(()=>cb(fix()),100);setTimeout(()=>cb(fix()),600);return 1;},clearWatch(){},getCurrentPosition(cb){cb(fix());}}});
  const AC=window.AudioContext;window.__meters=[];window.AudioContext=class extends AC{createAnalyser(){const a=super.createAnalyser();window.__meters.push(a);return a;}};
 });
 await page.goto(evidence.url);await page.locator('.cockpit-build').waitFor();evidence.build=await page.locator('.cockpit-build').innerText();if(process.env.EXPECT_BUILD)assert.equal(evidence.build,process.env.EXPECT_BUILD);await page.getByRole('button',{name:'Engine',exact:true}).click();await page.getByRole('button',{name:'START ENGINE',exact:true}).click();
 await page.getByText('SAMPLE ENGINE',{exact:true}).waitFor({timeout:30000});
 const left=page.getByRole('button',{name:'TAMARRO left',exact:true}),right=page.getByRole('button',{name:'TAMARRO right',exact:true});
 for(const name of ['Mono','Rosso','Touring']) {
  await page.getByRole('button',{name,exact:true}).click();await page.waitForTimeout(700);await page.getByText('SAMPLE ENGINE',{exact:true}).waitFor({timeout:60000});await left.waitFor();await page.waitForFunction(()=>document.querySelector('.engine-rev:enabled'));
  await left.click();await page.waitForFunction(()=>document.querySelector('.engine-rev')?.getAttribute('aria-pressed')==='true');
  const trace=await page.evaluate(()=>new Promise(resolve=>{const rows=[],start=performance.now();const t=setInterval(()=>{const meter=document.querySelector('.engine-tach'),a=window.__meters.at(-1),buf=new Float32Array(a.fftSize);a.getFloatTimeDomainData(buf);rows.push({ms:Math.round(performance.now()-start),rpm:Number(meter.getAttribute('aria-valuenow')),neutral:document.querySelectorAll('.engine-primary strong')[1].textContent==='N',active:document.querySelector('.engine-rev').getAttribute('aria-pressed')==='true',peak:Math.max(...buf.map(Math.abs)),rms:Math.sqrt(buf.reduce((s,v)=>s+v*v,0)/buf.length)});if(performance.now()-start>5700){clearInterval(t);resolve(rows);}},50);}));
  const active=trace.filter(r=>r.active);console.log('PROFILE',name,'samples',active.length,'maximum',Math.max(...active.map(r=>r.rpm)));await fs.writeFile(out+'/'+name.toLowerCase()+'-trace.json',JSON.stringify(trace));assert.ok(active.length>45);assert.ok(active.every(r=>r.neutral));assert.ok(Math.max(...active.map(r=>r.rpm))>8400);assert.ok(active.every(r=>r.peak<1));assert.ok(active.some(r=>r.rms>.001));
  let rising=false,peaks=0;for(let i=1;i<active.length;i++){const d=active[i].rpm-active[i-1].rpm;if(d>100)rising=true;else if(d< -100&&rising){peaks++;rising=false;}}assert.ok(peaks>=3,`${name}: ${peaks} peaks`);
  assert.equal(trace.at(-1).active,false);assert.equal(trace.at(-1).rpm,1000);assert.equal(await page.locator('.effect-badge.is-active').count(),0);
  evidence.profiles.push({name,peaks,trace});
 }
 await right.click();await page.waitForTimeout(650);await page.screenshot({path:out+'/show-off.png'});await left.click();await page.waitForTimeout(180);assert.equal(await right.getAttribute('aria-pressed'),'false');
 await right.focus();await page.keyboard.press('Enter');await page.waitForTimeout(250);assert.equal(await right.getAttribute('aria-pressed'),'true');
 await page.locator('.engine-telemetry').click({position:{x:300,y:200}});await page.getByRole('button',{name:'Mute audio',exact:true}).click();await page.waitForTimeout(200);assert.equal(await right.getAttribute('aria-pressed'),'false');assert.equal(await page.locator('.engine-rev:disabled').count(),2);
 assert.deepEqual(evidence.errors,[]);assert.equal(evidence.sends,0);
 evidence.checks=['one tap survives pointer release','three profiles repeatedly rise and fall in neutral','redline reached without clipping','phrase ends at idle','opposite button cancels','keyboard Enter starts','mute cancels','no Underwater or diagnostic sends'];
 await fs.writeFile(out+'/browser-evidence.json',JSON.stringify(evidence,null,2)+'\n');console.log('SHOW-OFF PASS',evidence.profiles.map(p=>({name:p.name,peaks:p.peaks,maxRpm:Math.max(...p.trace.map(r=>r.rpm))})));
}finally {await browser.close();}
