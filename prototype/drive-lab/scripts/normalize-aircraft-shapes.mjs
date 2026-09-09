// Original build adapter. Generated artwork retains the source GPL-3.0 licence.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
const root=resolve('public/third-party/aircraft-shapes');
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser=await chromium.launch({headless:true,...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{})});
try {
 const page=await browser.newPage();
 const inventory=JSON.parse(await readFile(`${root}/inventory.json`,'utf8'));
 await mkdir(`${root}/normalized`,{recursive:true});
 for(const entry of inventory.files){
  const source=await readFile(`${root}/${entry.source}`,'utf8');
  const result=await page.evaluate(source=>{
   const original=new DOMParser().parseFromString(source,'image/svg+xml').documentElement;
   const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg'),group=document.createElementNS(ns,'g');
   svg.append(group);document.body.append(svg);
   function collect(node,transforms=[]){
    const tag=node.localName,label=node.getAttribute('{http://www.inkscape.org/namespaces/inkscape}label') || node.getAttribute('inkscape:label') || '';
    if(['defs','metadata','namedview','title','desc'].includes(tag)||/^(accent|schrift)$/i.test(label)||/display\s*:\s*none/.test(node.getAttribute('style')||''))return;
    const chain=[...transforms,node.getAttribute('transform')].filter(Boolean);
    if(tag==='path'&&node.getAttribute('d')){
     const path=document.createElementNS(ns,'path');path.setAttribute('d',node.getAttribute('d'));path.setAttribute('fill','#000');
     if(chain.length)path.setAttribute('transform',chain.join(' '));
     if(/fill-rule\s*:\s*evenodd/.test(node.getAttribute('style')||''))path.setAttribute('fill-rule','evenodd');
     group.append(path);
    }
    for(const child of node.children)collect(child,chain);
   }
   collect(original);const box=group.getBBox(),pad=Math.max(box.width,box.height)*.08;
   if(!(box.width>0&&box.height>0))throw Error('Empty silhouette');
   svg.setAttribute('viewBox',[box.x-pad,box.y-pad,box.width+2*pad,box.height+2*pad].join(' '));
   svg.setAttribute('xmlns',ns);
   const name=original.querySelector('title')?.textContent?.trim()||'';
   const text=svg.outerHTML;svg.remove();return {text,name};
  },source);
  await writeFile(`${root}/normalized/${entry.code}.svg`,`<!-- RexKramer1; GPL-3.0; normalized 2026-09-09 by enuzzo. Original and licence in parent directory. -->\n${result.text}\n`);
  entry.name=result.name||entry.code;
 }
 await writeFile(`${root}/catalogue.json`,JSON.stringify(inventory.files.map(({code,name})=>({code,name})))+'\n');
 console.log(`Normalized ${inventory.files.length} SVG artwork files`);
} finally {await browser.close();}
