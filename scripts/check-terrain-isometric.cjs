'use strict';
const fs=require('node:fs'),http=require('node:http'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {chromium}=require('playwright'),{createCanvas}=require('@napi-rs/canvas'),S=require('../sprites/terrain/terrain-isometric-scene');
(async()=>{
 const root=path.resolve(__dirname,'../art/terrain-isometric-js'),errors=[],server=http.createServer((q,r)=>{
  const file=path.resolve(root,'.'+decodeURIComponent(new URL(q.url,'http://local').pathname));if(!file.startsWith(root+path.sep)&&file!==root){r.writeHead(403).end();return;}
  const p=file===root?path.join(root,'index.html'):file;try{r.setHeader('Content-Type',p.endsWith('.js')?'text/javascript':p.endsWith('.png')?'image/png':p.endsWith('.json')?'application/json':'text/html');r.end(fs.readFileSync(p));}catch{r.writeHead(404).end();}
 }).listen(0,'127.0.0.1');await new Promise(resolve=>server.on('listening',resolve));
 const browser=await chromium.launch({executablePath:process.env.UI_BROWSER_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1000}});page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:'+server.address().port+'/');
  for(const family of ['desert','steppe','grass','forest','jungle','wetforest','marsh','taiga','tundra','snow','cursed']){
   await page.selectOption('#biome',family);const actual=await page.evaluate(()=>Array.from(document.getElementById('view').getContext('2d').getImageData(0,0,800,520).data));
   const cv=createCanvas(800,520),c=cv.getContext('2d');c.fillStyle='#172723';c.fillRect(0,0,800,520);S.render(c,S.makeMap(family));const expected=c.getImageData(0,0,800,520).data;
   const digest=a=>crypto.createHash('sha256').update(a).digest('hex');assert.equal(digest(Buffer.from(actual)),digest(expected),family+' browser/native pixel match');
  }
  await page.getByRole('button',{name:'Pièces et raccords'}).click();await page.selectOption('#kind','cliff');assert.match(await page.locator('#info').textContent(),/30 éléments/);
  await page.getByRole('button',{name:'Atlas réel avant/après'}).click();await page.waitForFunction(()=>document.getElementById('compare').complete&&document.getElementById('compare').naturalWidth>0);
  await page.setViewportSize({width:844,height:390});await page.getByRole('button',{name:'Scène complète'}).click();await page.selectOption('#biome','grass');await page.selectOption('#zoom','1');await page.check('#grid');await page.screenshot({path:'/tmp/hearthreaver-terrain-workshop-mobile.png'});
  assert.deepEqual(errors,[]);console.log('PASS: all 11 browser scenes exactly match native pixels; catalogue, real-atlas comparison, grid and mobile controls work.');
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
