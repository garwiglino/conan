'use strict';
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict'),{chromium}=require('playwright');
(async()=>{
 const html=fs.readFileSync('index.html','utf8').replace(/\}\)\(\);\s*<\/script>/,'globalThis.cityLifeTest={Atlas,renderer,BITMAPS,begin,studioIntro,get game(){return game}};})();</script>'),out=path.resolve('art/city-plans/vie');fs.mkdirSync(out,{recursive:true});
 const server=http.createServer((q,r)=>{r.setHeader('Content-Type','text/html');r.end(html);}).listen(0,'127.0.0.1');await new Promise(r=>server.on('listening',r));
 const browser=await chromium.launch({executablePath:process.env.UI_BROWSER_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']}),errors=[],results=[];
 try{for(const mobile of [false,true]){
  const page=await browser.newPage({viewport:mobile?{width:844,height:390}:{width:1280,height:720},isMobile:mobile,hasTouch:mobile});page.on('pageerror',e=>errors.push(e.stack||e.message));
  if(process.env.PERF_NO_WORKER)await page.addInitScript(()=>{globalThis.Worker=undefined;});
  await page.goto('http://127.0.0.1:'+server.address().port);await page.waitForFunction(()=>cityLifeTest.BITMAPS.ready);await page.addStyleTag({content:'#notices { display:none !important; }'});
  const diagnostics=await page.evaluate(()=>{const t=cityLifeTest;t.studioIntro.skip();t.studioIntro.update(2);t.begin();const g=t.game,r=t.renderer;t.frame=r.frame.bind(r);g.update=()=>{};r.frame=()=>{};g.dialogue=null;g.clock=600;g.player.spawnFX=0;g.time+=.04;g.stepCivilianAnimations(.04);return g.cityLifeDiagnostics();});
  assert.equal(diagnostics.length,18);assert.ok(diagnostics.every(n=>n.reachable));
  for(const district of ['halles','metiers','conseil','resine']){
   const residents=await page.evaluate(district=>{const t=cityLifeTest,g=t.game,r=t.renderer,n=g.npcs.find(n=>g.cityLifeDiagnostics().find(p=>p.id===n.id)?.district===district),w=g.humanWorkstations.get(n.id);
    const positions=[[w.approach[0]+20,w.approach[1]+30],[w.approach[0]-32,w.approach[1]+32],[w.approach[0]+48,w.approach[1]]],safe=positions.find(([x,y])=>!g.solid(x,y,5,0));if(!safe)throw Error('No player approach at '+district);g.placeSafely(...safe);g.player.spawnFX=0;g.player.z=0;g.player.level=0;g.updateLocation(0);r.focus=null;r.cameraPosition=null;t.frame();return g.cityLifeDiagnostics().filter(n=>n.district===district);
   },district);
   await page.waitForFunction(()=>{const t=cityLifeTest;t.frame();return t.renderer.atlasVisible.every(c=>t.renderer.atlasArtStream.current(c.key,c.cx,c.cy));},{},{timeout:60000});
   const metrics=await page.evaluate(()=>{const t=cityLifeTest,times=[];for(let i=0;i<40;i++){t.game.time+=.04;t.game.stepCivilianAnimations(.04);const before=performance.now();t.frame();times.push(performance.now()-before);}times.sort((a,b)=>a-b);return {medianFrameMs:times[20],p95FrameMs:times[38],terrainCache:t.renderer.atlasGround.size,pending:t.renderer.atlasArtStream.pending.size,...t.game.settlementDiagnostics()};});
   assert.ok(metrics.terrainCache<=16&&metrics.pending<=8);const file=district+(mobile?'-mobile':'')+(process.env.PERF_NO_WORKER?'-fallback':'')+'.png';await page.screenshot({path:path.join(out,file)});results.push({district,mobile,residents,metrics,file});
  }
  await page.close();
 }
 assert.deepEqual(errors,[]);const report={mode:process.env.PERF_NO_WORKER?'cooperative fallback':'worker',results,browserErrors:errors};fs.writeFileSync(path.join(out,'verification'+(process.env.PERF_NO_WORKER?'-fallback':'')+'.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
