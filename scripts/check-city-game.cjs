'use strict';
const fs=require('node:fs'),http=require('node:http'),path=require('node:path'),assert=require('node:assert/strict'),{chromium}=require('playwright');
(async()=>{
 const html=fs.readFileSync('index.html','utf8').replace(/\}\)\(\);\s*<\/script>/,'globalThis.cityTest={Atlas,WorldProjection,renderer,BITMAPS,begin,studioIntro,get game(){return game}};})();</script>');
 const server=http.createServer((q,r)=>{r.setHeader('Content-Type','text/html');r.end(html);}).listen(0,'127.0.0.1');await new Promise(r=>server.on('listening',r));
 const browser=await chromium.launch({executablePath:process.env.UI_BROWSER_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']}),errors=[],results=[],out=path.resolve('art/city-plans/jeu');fs.mkdirSync(out,{recursive:true});
 try{
  for(const mobile of [false,true]){
   const page=await browser.newPage({viewport:mobile?{width:844,height:390}:{width:1280,height:720},isMobile:mobile,hasTouch:mobile});page.on('pageerror',e=>errors.push(e.stack||e.message));
   if(process.env.PERF_NO_WORKER)await page.addInitScript(()=>{globalThis.Worker=undefined;});
   await page.goto('http://127.0.0.1:'+server.address().port);await page.waitForFunction(()=>cityTest.BITMAPS.ready);
   await page.addStyleTag({content:'#notices { display:none !important; }'});
   await page.evaluate(()=>{const t=cityTest;t.studioIntro.skip();t.studioIntro.update(2);t.begin();const g=t.game,r=t.renderer;t.frame=r.frame.bind(r);g.update=()=>{};r.frame=()=>{};g.dialogue=null;g.player.spawnFX=0;g.clock=720;});
   for(const target of ['CF01','CF07','care_bed','sitting_bench']){
    const at=await page.evaluate(target=>{const t=cityTest,g=t.game,r=t.renderer,site=g.settlements.sites.get('town-1');let goal;
     if(target.startsWith('CF')){const b=site.buildings.find(b=>b.id===target),p=b.geometry.portals[0];goal={x:p.x+p.nx*28,y:p.y+p.ny*28};}else{const f=site.fixtures.find(f=>f.id===target),w=g.humanWorkstations.get(f.uid);goal={x:w.approach[0],y:w.approach[1]};}
     const assertFree=!g.solid(goal.x,goal.y,5,0);if(!assertFree)throw Error('Blocked review approach: '+target);
     g.placeSafely(goal.x,goal.y);g.player.spawnFX=0;g.player.z=0;g.updateLocation(0);r.focus=null;r.cameraPosition=null;t.frame();return {x:g.player.x,y:g.player.y,site:g.atlasContext()?.id};
    },target);
    assert.equal(at.site,'town-1');
    await page.waitForFunction(()=>{const t=cityTest;t.frame();return t.renderer.atlasVisible.every(c=>t.renderer.atlasArtStream.current(c.key,c.cx,c.cy));},{},{timeout:60000});
    const metrics=await page.evaluate(()=>{const t=cityTest,r=t.renderer,times=[];for(let i=0;i<40;i++){const start=performance.now();t.frame();times.push(performance.now()-start);}times.sort((a,b)=>a-b);return {medianFrameMs:times[20],p95FrameMs:times[38],terrainCache:r.atlasGround.size,pending:r.atlasArtStream.pending.size,...t.game.settlementDiagnostics()};});
    assert.ok(metrics.terrainCache<=16);assert.ok(metrics.architecture.models<=96);
    const file=target+(mobile?'-mobile':'')+(process.env.PERF_NO_WORKER?'-fallback':'')+'.png';await page.screenshot({path:path.join(out,file)});results.push({target,mobile,at,metrics,file});
   }await page.close();
  }
  assert.deepEqual(errors,[]);const report={mode:process.env.PERF_NO_WORKER?'cooperative fallback':'worker',results,browserErrors:errors};fs.writeFileSync(path.join(out,'verification'+(process.env.PERF_NO_WORKER?'-fallback':'')+'.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
