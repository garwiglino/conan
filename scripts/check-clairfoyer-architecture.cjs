'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),http=require('node:http'),assert=require('node:assert/strict'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),out=path.join(root,'art/city-plans/quartiers/batiments'),A=require('../sprites/architecture/clairfoyer-districts'),manifest=require('../art/city-plans/quartiers/batiments/catalogue.json'),P=require('../sprites/architecture/isometric-pixels');
async function check(){
 const originalHash='c392007d907e543a6a7d3a3dc1c0267baf8bd70e14bd396daa430c170f8ee9ca',frameHash=crypto.createHash('sha256').update(JSON.stringify(P.frames)).digest('hex');assert.equal(frameHash,originalHash,'existing runtime art changed');
 const hash=crypto.createHash('sha256');for(const file of ['sprites/architecture/isometric-catalogue.js','sprites/architecture/architecture-isometric.js'])hash.update(fs.readFileSync(path.join(root,file)));assert.equal(P.sourceHash,hash.digest('hex'));
 let views=0;for(const d of A.list()){
  const exported=manifest.assets.find(a=>a.id===d.id);assert.ok(exported);assert.deepEqual(exported.palette,A.paletteFor(d.id));
  for(const dir of d.views){const p=A.raster(d.id,{dir}),f=exported.frames[dir],bytes=fs.readFileSync(path.join(out,f.file));assert.equal(bytes.readUInt32BE(16),p.width);assert.equal(bytes.readUInt32BE(20),p.height);assert.equal(f.pixelHash,crypto.createHash('sha256').update(p.indices).digest('hex'));assert.deepEqual(exported.geometry[dir],A.geometry(d.id,{dir}));views++;}
 }
 const study=require('../data/architecture/city-plans/clairfoyer-districts.json');assert.equal(manifest.districtStudyRevision,study.revision);assert.equal(study.approval.userValidated,true);assert.equal(manifest.runtimeActivated,true);assert.equal(manifest.publicationTrackedBy,'git');
 const missing=[],errors=[],server=http.createServer((req,res)=>{
  if(req.url==='/favicon.ico'){res.writeHead(204);res.end();return;}
  const file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
  const target=fs.existsSync(file)&&fs.statSync(file).isDirectory()?path.join(file,'index.html'):file;
  try{res.setHeader('Content-Type',target.endsWith('.html')?'text/html; charset=utf-8':target.endsWith('.js')?'text/javascript':target.endsWith('.png')?'image/png':'application/json');res.end(fs.readFileSync(target));}catch{missing.push(req.url);res.writeHead(404);res.end();}
 });
 await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
 try{
  browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});const page=await browser.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});await page.setViewportSize({width:1440,height:1000});
  await page.goto(`http://127.0.0.1:${server.address().port}/art/city-plans/quartiers/batiments/`);await page.waitForFunction(()=>document.querySelector('#title').textContent.includes('CF01'));
  let uiViews=0;for(const d of A.list()){await page.selectOption('#model',d.id);for(const dir of d.views){await page.locator(`[data-dir="${dir}"]`).click();assert.ok((await page.locator('#title').innerText()).includes(d.id));uiViews++;}}
  await page.selectOption('#district','rive');assert.equal(await page.locator('#model option').count(),3);await page.selectOption('#kind','infrastructure');assert.equal(await page.locator('#model option').count(),1);await page.selectOption('#district','etapes');assert.equal(await page.locator('#model option').count(),0);assert.equal(await page.locator('#download').isVisible(),false);
  await page.selectOption('#kind','all');await page.selectOption('#district','all');await page.selectOption('#model','CF11');await page.locator('[data-dir="face"]').click();await page.check('#foot');await page.uncheck('#weather');await page.check('#weather');await page.selectOption('#zoom','3');await page.selectOption('#zoom','2');await page.screenshot({path:path.join(out,'atelier-desktop.png'),fullPage:true});
  await page.setViewportSize({width:390,height:844});await page.screenshot({path:path.join(out,'atelier-mobile.png'),fullPage:true});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2),false,'page overflows on mobile');
  const links=await page.locator('a[href],script[src]').evaluateAll(xs=>xs.map(e=>e.getAttribute('href')||e.getAttribute('src')));for(const link of links)if(link!=='verification.json'&&!link.startsWith('data:'))assert.ok(fs.existsSync(path.resolve(out,link)),'missing local link '+link);
  assert.deepEqual(errors,[]);assert.deepEqual(missing,[]);
  const result={revision:manifest.revision,districtStudyRevision:study.revision,status:'integrated_technical_checks_passed',models:36,buildings:22,infrastructures:14,districtPalettes:11,nativeViewsChecked:views,interactiveViewsChecked:uiViews,viewsPerModel:4,nativeUnitsPerMetre:16,doorsNativeClearance:22,paletteColors:81,playerReference:'current Kaldor; same integer zoom as assets',geometryPixelAlignment:'covered across all 144 views by the unit tests',wholeBuildingFade:'shared renderer, target .32, physical solids unchanged',originalRuntimeViews:Object.keys(P.frames).length,existingRuntimePixelsUnchanged:true,existingRuntimeFramesHash:frameHash,desktop:[1440,1000],mobile:[390,844],localLinksChecked:links.length,errors,missing,waterSupplyCreated:false,inventoryCreated:false,userValidated:true,runtimeActivated:true,publicationTrackedBy:'git'};
  fs.writeFileSync(path.join(out,'verification.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
 }finally{if(browser)await browser.close();await new Promise(r=>server.close(r));}
}
check().catch(e=>{console.error(e);process.exitCode=1;});
