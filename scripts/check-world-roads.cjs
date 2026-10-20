'use strict';
const fs=require('node:fs'),http=require('node:http'),path=require('node:path'),assert=require('node:assert/strict'),{chromium}=require('playwright');
(async()=>{
 const html=fs.readFileSync('index.html','utf8').replace(/\}\)\(\);\s*<\/script>/,'globalThis.roadTest={Atlas,renderer,BITMAPS,begin,studioIntro,get game(){return game}};})();</script>');
 const server=http.createServer((q,r)=>{r.setHeader('Content-Type','text/html');r.end(html);}).listen(0,'127.0.0.1');await new Promise(r=>server.on('listening',r));
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']}),out=path.resolve('art/world-roads'),errors=[],results=[];fs.mkdirSync(out,{recursive:true});
 try{
  const page=await browser.newPage({viewport:{width:1000,height:600}});page.on('pageerror',e=>errors.push(e.message));if(process.env.PERF_NO_WORKER)await page.addInitScript(()=>{globalThis.Worker=undefined;});
  await page.goto('http://127.0.0.1:'+server.address().port);await page.waitForFunction(()=>roadTest.BITMAPS.ready);await page.addStyleTag({content:'#notices{display:none!important}'});
  await page.evaluate(()=>{const t=roadTest;t.studioIntro.skip();t.studioIntro.update(2);t.begin();const g=t.game,r=t.renderer;t.frame=r.frame.bind(r);g.update=()=>{};r.frame=()=>{};g.dialogue=null;g.player.spawnFX=0;g.clock=720;});
  for(const target of ['forest','desert','bridge']){
   const at=await page.evaluate(target=>{const t=roadTest,A=t.Atlas,g=t.game,r=t.renderer;let chosen;
    if(target==='bridge')chosen=A.crossings.find(c=>!A.siteAt(c.x,c.y,15));else for(const road of A.roads.filter(r=>r.orthogonal))for(let i=1;i<road.pts.length-1&&!chosen;i++){const a=road.pts[i-1],b=road.pts[i],c=road.pts[i+1],biome=A.cellAt(...b)?.biome;if((target==='forest'?biome===6:[1,2].includes(biome))&&!A.siteAt(b[0],b[1],15)&&!A.riverAt(...b)&&Math.hypot(a[0]-b[0],a[1]-b[1])>15&&Math.hypot(c[0]-b[0],c[1]-b[1])>15&&(a[0]===b[0])!==(b[0]===c[0]))chosen={x:b[0],y:b[1],road:road.id};}
    if(!chosen)throw Error('No review point '+target);const p=A.toGame(chosen.x,chosen.y);if(!g.placeSafely(p.x,p.y))throw Error('Blocked road');g.player.spawnFX=0;g.player.z=0;g.updateLocation(0);r.focus=null;r.cameraPosition=null;t.frame();return chosen;
   },target);
   await page.waitForFunction(()=>{const t=roadTest;t.frame();return t.renderer.atlasVisible.every(c=>t.renderer.atlasArtStream.current(c.key,c.cx,c.cy));},{},{timeout:60000});
   const result=await page.evaluate(()=>{const t=roadTest,g=t.game,r=t.renderer,before=[g.player.x,g.player.y];for(let i=0;i<20;i++)t.frame();return {cache:r.atlasGround.size,pending:r.atlasArtStream.pending.size,free:!g.solid(...before,5,0),playerUnchanged:before[0]===g.player.x&&before[1]===g.player.y,roadRevision:t.Atlas.raw.rectilinearRoads.revision};});assert.ok(result.free&&result.playerUnchanged&&result.cache<=16&&result.pending<=8);const file=target+(process.env.PERF_NO_WORKER?'-fallback':'')+'.png';await page.screenshot({path:path.join(out,file)});results.push({target,...at,...result,file});
  }
  assert.deepEqual(errors,[]);const report={mode:process.env.PERF_NO_WORKER?'fallback':'worker',results,errors};fs.writeFileSync(path.join(out,'verification'+(process.env.PERF_NO_WORKER?'-fallback':'')+'.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
