// Reproducible browser measurements; no production game rules are replaced.
const fs=require('node:fs'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
(async()=>{
 const html=fs.readFileSync('index.html','utf8').replace(/\}\)\(\);\s*<\/script>/,'globalThis.perfTest={Game,Renderer,Atlas,WorldTerrainArt,BITMAPS,studioIntro,begin,get game(){return game},renderer};})();</script>');
 const server=http.createServer((q,r)=>{r.setHeader('Content-Type','text/html');r.end(html);}).listen(0,'127.0.0.1');await new Promise(r=>server.on('listening',r));
 const browser=await chromium.launch({executablePath:process.env.UI_BROWSER_PATH||'/usr/bin/chromium',args:['--no-sandbox'],headless:true});
 try{
  const page=await browser.newPage({viewport:{width:844,height:390}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  if(process.env.PERF_NO_WORKER)await page.addInitScript(()=>{globalThis.Worker=undefined;});
  await page.goto('http://127.0.0.1:'+server.address().port);await page.waitForFunction(()=>globalThis.perfTest?.BITMAPS.ready);
  const result=await page.evaluate(async()=>{
   const t=perfTest;t.studioIntro.skip();t.studioIntro.update(2);t.begin();const g=t.game,r=t.renderer,update=g.update.bind(g),frame=r.frame.bind(r);t.manualUpdate=update;t.manualFrame=frame;g.update=()=>{};r.frame=()=>{};g.dialogue=null;g.player.spawnFX=0;
   const calls={};for(const [obj,names]of [[g,['advanceAtlas','syncCampaignGroups','stepWorldConvoys','solid','walkNpc']],[g.atlas,['get']],[r,['drawAtlasGround','refreshColdSiteProps']],[t.Atlas,['chunkSnowKey']],[t.WorldTerrainArt,['render']]])for(const name of names){const fn=obj[name];if(!fn)continue;obj[name]=function(...args){const start=performance.now();try{return fn.apply(this,args);}finally{const c=calls[name]||={count:0,total:0,max:0};const elapsed=performance.now()-start;c.count++;c.total+=elapsed;c.max=Math.max(c.max,elapsed);}};}
   const scenarios=[];for(const id of ['camp','town-69','town-27']){Object.assign(g.player,t.Atlas.toGame(t.Atlas.byId[id].x,t.Atlas.byId[id].y));const samples=[];for(let i=0;i<24;i++){const start=performance.now();update(1/60,{x:i>12?1:0});frame();samples.push(performance.now()-start);await new Promise(requestAnimationFrame);}samples.sort((a,b)=>a-b);scenarios.push({id,p50:samples[12],p95:samples[22],max:samples[23]});}
   return {scenarios,calls,terrainCache:r.atlasGround?.size,pending:r.atlasArtStream?.pending.size};
  });
  await page.waitForFunction(()=>{const r=perfTest.renderer;return r.atlasVisible.every(chunk=>r.atlasArtStream.current(chunk.key,chunk.cx,chunk.cy));},{},{timeout:30000});
  const profiler=process.env.PERF_PROFILE?await page.context().newCDPSession(page):null;if(profiler){await profiler.send('Profiler.enable');await profiler.send('Profiler.start');}
  result.stress=await page.evaluate(async()=>{
   const t=perfTest,g=t.game,r=t.renderer,times=[];for(const n of t.Atlas.nodes.filter(n=>n.rest).filter((n,i)=>i%7===0).slice(0,20)){
    Object.assign(g.player,t.Atlas.toGame(n.x,n.y));const start=performance.now();t.manualUpdate(1/60,{x:1,guard:true});t.manualFrame();times.push(performance.now()-start);if(r.atlasGround.size>32||g.atlas.cache.size>48||g.atlas.samples.size>48||r.atlasArtStream.pending.size>8)throw Error('Unbounded streaming cache');await new Promise(requestAnimationFrame);
   }
   const start=performance.now();g.clock+=480;g.advanceAtlas(0);const restMs=performance.now()-start,saveStart=performance.now(),saved=JSON.parse(JSON.stringify(g.serialize())),restored=new t.Game(saved);
   if(Math.abs(restored.clock-g.clock)>1e-6||restored.player.coins!==g.player.coins)throw Error('Restore changed campaign time or purse');
   return {rapidArrivals:times.length,maxArrivalMs:Math.max(...times),restMs,saveAndRestoreMs:performance.now()-saveStart,cachesBounded:true,restoreMatches:true};
  });
  if(profiler){const {profile}=await profiler.send('Profiler.stop');fs.writeFileSync('/tmp/conan-world-performance.cpuprofile',JSON.stringify(profile));await profiler.detach();}
  await page.waitForFunction(()=>{const r=perfTest.renderer;return r.atlasVisible.every(chunk=>r.atlasArtStream.current(chunk.key,chunk.cx,chunk.cy));},{},{timeout:30000});
  assert.deepEqual(errors,[]);assert.equal(result.calls.render?.count||0,0,'No full terrain render may block a gameplay frame');assert.ok(result.pending<=8);assert.ok(result.terrainCache<=32);
  result.visibleArtReady=true;result.mode=process.env.PERF_NO_WORKER?'cooperative fallback':'worker';console.log(JSON.stringify(result,null,2));
 }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
