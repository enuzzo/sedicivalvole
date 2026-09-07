const {chromium} = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
import assert from 'node:assert/strict';import fs from 'node:fs/promises';
await fs.mkdir(process.env.QA_OUTPUT || '/tmp/sedicivalvole-engine-qa',{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_EXECUTABLE || undefined,args:['--mute-audio']});
try{const page=await browser.newPage({viewport:{width:1440,height:900}});const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:5173/lab.html');
await page.getByLabel('LAB visual tool').selectOption('engine');await page.getByRole('button',{name:'START ENGINE',exact:true}).click();await page.getByText('SAMPLE ENGINE',{exact:true}).waitFor({timeout:30000});
await page.getByLabel('Transmission',{exact:true}).selectOption('MANUAL');await page.getByRole('button',{name:'3',exact:true}).click();await page.waitForTimeout(500);assert.match(await page.locator('.engine-primary').innerText(),/GEAR \/ MANUAL\n3/);
await page.getByText('Engine diagnostics / latest 100 events').click();const data=JSON.parse(await page.locator('.engine-lab-controls pre').innerText());assert.equal(data.gear,3);assert.equal(data.transmissionMode,'MANUAL');assert.ok(data.decodedBytes>0);
await page.screenshot({path:`${process.env.QA_OUTPUT || '/tmp/sedicivalvole-engine-qa'}/06-lab.png`});assert.deepEqual(errors,[]);await fs.writeFile(`${process.env.QA_OUTPUT || '/tmp/sedicivalvole-engine-qa'}/lab-evidence.json`,JSON.stringify({data,errors},null,2));console.log('LAB PASS',data.decodedBytes);
}finally{await browser.close();}
