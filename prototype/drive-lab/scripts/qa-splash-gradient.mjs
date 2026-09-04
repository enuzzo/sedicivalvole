const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_EXECUTABLE || undefined,args:['--autoplay-policy=user-gesture-required']});
const page=await browser.newPage({viewport:{width:773,height:601}});
await page.addInitScript(()=>{window.__catalogCalls=[];const original=window.fetch;window.fetch=function(...args){if(String(args[0]).includes('soundtrack-catalog'))window.__catalogCalls.push({stack:new Error().stack,phase:document.querySelector('main.app')?.className});return original.apply(this,args);};});
const output=process.env.QA_OUTPUT || '/tmp/sedicivalvole-astra-audit'; await fs.mkdir(output,{recursive:true}); const result={requests:[],console:[],checks:[]};
page.on('console',m=>{if(['warning','error'].includes(m.type()))result.console.push({type:m.type(),text:m.text()});});page.on('pageerror',e=>result.console.push({type:'pageerror',text:e.message}));
await page.route('**/api/soundtrack-*.php*',async route=>{const u=new URL(route.request().url());if(u.pathname.includes('catalog'))result.requests.push({at:Date.now(),path:u.pathname+u.search});try {const response=await route.fetch({url:'https://sedicivalvole.app'+u.pathname+u.search,timeout:25000});await route.fulfill({response});} catch {try {await route.abort();} catch {}}});
const launch=async()=>{await page.getByRole('button',{name:'sedicivalvole PLAY THE ROAD',exact:true}).click();await page.getByRole('button',{name:'Mute Visuals only. No music.',exact:true}).click();await page.locator('.launch-visual-grid button').filter({has:page.locator('strong',{hasText:/^Gradient$/})}).click();await page.getByRole('button',{name:/^START/}).click();await page.locator('.shadergradient-field canvas').waitFor();await page.waitForTimeout(1500);};
const frameSample=async duration=>page.evaluate(duration=>new Promise(resolve=>{const intervals=[];let first=performance.now(),last=first;function frame(now){intervals.push(now-last);last=now;if(now-first<duration){requestAnimationFrame(frame);return;}const values=intervals.slice(1).sort((a,b)=>a-b);const canvas=document.querySelector('.shadergradient-field canvas');resolve({frames:values.length,median:values[Math.floor(values.length*.5)],p95:values[Math.floor(values.length*.95)],over50ms:values.filter(x=>x>50).length,canvas:{width:canvas.width,height:canvas.height},speed:document.querySelector('.source-readout strong').textContent});}requestAnimationFrame(frame);}),duration);
try {
 await page.goto('http://127.0.0.1:5173/?qaMute=1&qaAtlasDemo=1');await page.waitForTimeout(5000);
 const splashCount=result.requests.length;assert.ok(splashCount>0);result.checks.push('catalogue request starts on untouched splash');console.log('PASS untouched splash catalogue preload');
 await launch();await page.mouse.click(350,400);await page.waitForTimeout(350);await page.locator('.score-control').click();await page.getByRole('button',{name:'SOUNDTRACK',exact:true}).click();await page.waitForTimeout(1500);
 result.fetchTrace=await page.evaluate(()=>window.__catalogCalls);result.warmup={splashCount,afterSelection:result.requests.length};assert.equal(result.requests.length,splashCount);result.checks.push('Soundtrack reuses prepared catalogue');console.log('PASS prepared catalogue reuse');
 await page.locator('.music-library-heading > button').click();await page.waitForTimeout(350);await page.mouse.click(350,400);await page.waitForTimeout(350);await page.locator('.appearance-trigger').click();await page.getByRole('menuitemradio',{name:'DARK',exact:true}).click();
 await page.goto('http://127.0.0.1:5173/?qaMute=1&qaAtlasDemo=1&qaSpeed=80');await launch();
 result.baseline=await frameSample(3000);console.log('BASELINE '+JSON.stringify(result.baseline));
 await page.keyboard.down('Space');await page.waitForFunction(()=>document.querySelector('.effect-badge')?.classList.contains('is-active'),{},{timeout:5000});
 result.braking=await frameSample(1800);await page.screenshot({path:output+'/after-underwater-dark.png'});
 result.badge=await page.locator('.source-readout,.effect-badge').evaluateAll(ns=>ns.map(n=>({class:n.className,rect:n.getBoundingClientRect().toJSON(),background:getComputedStyle(n).backgroundColor,color:getComputedStyle(n).color})));
 await page.keyboard.up('Space');await page.waitForFunction(()=>!document.querySelector('.effect-badge')?.classList.contains('is-active'),{},{timeout:12000});await page.waitForTimeout(800);result.recovered=await frameSample(3000);
 assert.equal(result.baseline.canvas.width,773);assert.ok(result.braking.canvas.width<=619);assert.equal(result.recovered.canvas.width,773);result.checks.push('Gradient density falls to 0.8 during brake and returns to 1');
 console.log('PASS density recovery '+JSON.stringify({braking:result.braking,recovered:result.recovered}));
 assert.equal(result.badge[0].rect.width,result.badge[1].rect.width);assert.equal(result.badge[0].rect.height,result.badge[1].rect.height);result.checks.push('Underwater badge matches speed footprint');
 assert.ok(result.braking.p95 <= result.baseline.p95 + 1, 'braking p95 must stay within 1 ms of baseline');
 await page.goto('http://127.0.0.1:5173/?qaMute=1&qaAtlasDemo=1&qaEffect=UNDERWATER');await launch();
 await page.mouse.click(350,400);await page.waitForTimeout(350);await page.locator('.appearance-trigger').click();await page.getByRole('menuitemradio',{name:'LIGHT',exact:true}).click();await page.waitForTimeout(400);
 await page.screenshot({path:output+'/after-underwater-light.png'});
 const variants=[];
 for(let i=0;i<3;i++){variants.push(await page.locator('main.app').getAttribute('data-environment'));await page.mouse.click(350,400);await page.waitForTimeout(350);await page.locator('.gradient-cycle-control button').first().click();await page.waitForTimeout(500);assert.ok((await page.locator('main.app').getAttribute('class')).includes('controls-resting'));}
 assert.equal(new Set(variants).size,3);result.variants=variants;result.checks.push('all three Gradient variants cycle and retract');
 await page.emulateMedia({reducedMotion:'reduce'});await page.waitForTimeout(300);
 assert.equal(await page.locator('.effect-badge').evaluate(n=>getComputedStyle(n).transitionDuration),'0s');result.checks.push('reduced motion removes badge transition');
 console.log('PASS badge geometry, LIGHT/DARK, all Gradient variants and reduced motion');
} catch(error){result.failure=error.stack;console.log('FAIL '+error.stack);process.exitCode=1;}
finally{await fs.writeFile(output+'/extra-browser-evidence.json',JSON.stringify(result,null,2));await browser.close();}
