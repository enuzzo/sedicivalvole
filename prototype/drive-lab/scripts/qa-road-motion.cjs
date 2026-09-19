const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const fs=require('fs'),assert=require('assert/strict');
(async()=>{
const root=require('path').resolve(__dirname,'../../..'),out=process.env.QA_OUTPUT || root+'/docs/qa/2026-09-19-road-motion';
const browser=await chromium.launch({channel:'chrome',headless:true});const page=await browser.newPage({viewport:{width:773,height:601}});const errors=[],checks=[];
page.on('pageerror',e=>errors.push(e.message));await page.route('**/api/*diagnostic*',r=>r.abort());
// Test-only receiver seam. Production module/package is never modified by this interception.
await page.route('**/src/motion/session.js',async route=>{
 const response=await route.fetch();let body=await response.text();body=body.replace('export function createMotionSession(', 'function originalMotionSession(');
 body+=`\nexport function createMotionSession(options){
 if(options.role!=='receiver')return originalMotionSession(options);
 let state='idle';const refresh=()=>options.onChange?.({state,sensorState:window.__roadFixture?.sensorState??'live',tared:!!window.__roadFixture?.sample,mountSelected:true,roadState:window.__roadFixture?.roadState??'calibrated',receiverConfirmed:!!window.__roadFixture?.sample});
 const timer=setInterval(refresh,100);
 return {start(){state='connected';refresh();},stop(){state='closed';window.__roadFixture.sample=null;refresh();},sample:()=>window.__roadFixture?.sample??null,report:()=>({synthetic:true}),dispose(){clearInterval(timer);}};
 }`;
 await route.fulfill({response,body});
});
await page.addInitScript(()=>{window.__roadFixture={sample:null};});
await page.goto('http://127.0.0.1:5175/qa/ui-harmony.html?speed=40');await page.waitForTimeout(3800);
await page.getByRole('button',{name:'Engine',exact:true}).first().click();await page.getByRole('button',{name:/START/}).click();await page.waitForTimeout(1500);
const phone=async(a,age=0,generation=1)=>page.evaluate(({a,age,generation})=>{window.__roadFixture={sample:{frame:'tare-relative',generation,ageMs:age,acceleration:[0,0,0],rotation:[0,0,0],tilt:[0,0,0],turnRate:15,road:{longitudinalMps2:a,yawRate:15}}};},{a,age,generation});
await page.mouse.click(350,420);await page.locator('.stop-button').click();await page.waitForTimeout(1200);
await phone(2);await page.waitForTimeout(800);assert.match(await page.locator('.motion-button').getAttribute('aria-label'),/iPhone motion \+ GPS speed/);checks.push('actual App selects fresh mounted input');
const drive=()=>page.locator('.engine-telemetry small').filter({hasText:'DRIVE RESPONSE'}).locator('b').innerText();
assert.ok(parseInt(await drive())>60);checks.push('real Engine runtime increases drive demand at fixed 40 km/h');
await page.mouse.click(350,400);await page.waitForTimeout(250);await page.screenshot({path:out+'/engine-phone-live.png'});
await phone(-4);await page.waitForTimeout(1000);assert.ok(parseInt(await drive())<20);assert.ok(parseInt(await page.locator('.engine-telemetry small').filter({hasText:'DECELERATION'}).locator('b').innerText())>80);checks.push('real Engine runtime coasts and decelerates from phone at fixed GPS speed');
await page.screenshot({path:out+'/engine-phone-braking.png'});await phone(2);await page.waitForTimeout(400);
await page.locator('.motion-button').click();await page.waitForTimeout(250);assert.match(await page.locator('.motion-effective-source').textContent(),/iPhone motion/);await page.screenshot({path:out+'/receiver-phone-live.png'});checks.push('receiver panel exposes actual source');
await phone(-4,251);await page.waitForTimeout(250);assert.equal(await page.locator('.motion-button').getAttribute('data-connected'),'false');checks.push('251ms sample never claims LIVE');
await page.evaluate(()=>{window.__roadFixture={sample:null,sensorState:'stale'};});await page.waitForTimeout(250);assert.match(await page.locator('.motion-effective-source').textContent(),/stale/);await page.screenshot({path:out+'/receiver-stale.png'});
await page.evaluate(()=>{window.__roadFixture={sample:null,roadState:'moved'};});await page.waitForTimeout(250);assert.match(await page.locator('.motion-effective-source').textContent(),/remount/);checks.push('moved mount explains retare');
await page.getByRole('button',{name:'CLOSE',exact:true}).click();await phone(2);await page.waitForTimeout(350);await page.mouse.click(350,420);await page.keyboard.down('ArrowUp');await page.waitForTimeout(500);assert.match(await page.locator('.motion-button').getAttribute('aria-label'),/Demo motion/);await page.keyboard.up('ArrowUp');checks.push('Demo excludes otherwise fresh phone');
assert.deepEqual(errors,[]);fs.writeFileSync(out+'/browser-integration.json',JSON.stringify({synthetic:true,checks,errors},null,2));console.log(checks);await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
