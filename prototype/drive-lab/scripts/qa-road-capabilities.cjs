// Local development browser QA with synthetic catalogue, radar and pairing fixtures.
// Set PLAYWRIGHT_MODULE to an installed Playwright module; QA_URL selects the dev server.
const {chromium}=require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert=require('assert/strict'),fs=require('fs');const out='/tmp/sv-road-qa';
(async()=>{
const browser=await chromium.launch({channel:'chrome',headless:true});
const context=await browser.newContext({viewport:{width:1024,height:768},hasTouch:true});
await context.addInitScript(()=>{
 localStorage.setItem('sedicivalvole.diagnostics.v1',JSON.stringify({mode:'dev',automatic:false}));
 Object.defineProperty(window.DeviceMotionEvent,'requestPermission',{value:async()=>window.__sensorGrant??'denied',configurable:true});
 Object.defineProperty(window.DeviceOrientationEvent,'requestPermission',{value:async()=>window.__sensorGrant??'denied',configurable:true});
});
let pairs=0;await context.route('**/api/motion-pair.php',r=>{pairs++;return r.abort()});
await context.route('**/api/*diagnostic*',r=>r.abort());
const page=await context.newPage();page.setDefaultTimeout(15000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto(`${process.env.QA_URL || 'http://127.0.0.1:5175'}/?qaSpeed=42`);await page.waitForTimeout(3900);
await page.evaluate(async()=>{localStorage.setItem('qa-preserve','yes');await (await caches.open('sedicivalvole.assets.v1.fixture')).put('/qa',new Response('old'));await(await caches.open('unrelated')).put('/qa',new Response('keep'))});
await page.getByRole('button',{name:'RESET APP CACHE',exact:true}).click();await page.getByRole('button',{name:'RELOAD APP',exact:true}).waitFor();
assert.equal(await page.evaluate(()=>localStorage.getItem('qa-preserve')),'yes');assert.deepEqual(await page.evaluate(()=>caches.keys()),['unrelated']);console.log('PASS cache reset preserves preferences and unrelated caches; explicit reload available');
await page.getByRole('button',{name:'Engine',exact:true}).first().click();await page.getByRole('button',{name:/START ENGINE/}).click();await page.waitForTimeout(1600);
await page.mouse.click(650,250);await page.locator('.motion-button').click();assert.equal(pairs,0);assert.equal(await page.locator('.local-sensors-panel').count(),1);
await page.getByRole('button',{name:'ENABLE SENSORS',exact:true}).click();await page.getByText('Sensor access needed',{exact:true}).waitFor();console.log('PASS permission-capable tablet selects local sensing, no QR or server pairing; denial is explicit');
await page.evaluate(()=>window.__sensorGrant='granted');await page.getByRole('button',{name:'RETRY SENSORS',exact:true}).click();await page.waitForTimeout(800);console.log('SENSOR PANEL',await page.locator('.local-sensors-panel').innerText());
await page.evaluate(()=>window.dispatchEvent(new DeviceMotionEvent('devicemotion',{acceleration:{x:0,y:0,z:0},rotationRate:{alpha:0,beta:0,gamma:0}})));
await page.waitForTimeout(500);assert.equal(await page.getByText(/Ready on both screens|Receiving valid motion data/).count(),0);assert.ok(await page.getByRole('button',{name:'ZERO',exact:true}).isDisabled());console.log('PASS permission is not sensor evidence; synthetic events cannot claim live data');
await page.screenshot({path:out+'/local-sensors-tablet.png'});
await page.getByRole('button',{name:'CLOSE',exact:true}).click();
await page.setViewportSize({width:852,height:393});await page.mouse.click(650,250);await page.screenshot({path:out+'/engine-phone-landscape.png'});
const geometry=await page.locator('.engine-primary').evaluate(n=>({width:n.scrollWidth,client:n.clientWidth}));assert.ok(geometry.width<=geometry.client+1);console.log('PASS phone landscape engine metrics fit horizontally');
assert.deepEqual(errors,[]);await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
