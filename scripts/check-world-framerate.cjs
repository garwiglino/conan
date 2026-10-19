// Sustained gameplay after real journeys, with a real dialogue and its closure.
// FPS_HTML accepts a previous self-contained build for comparable measurements.
const fs=require('node:fs'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
(async()=>{
 const source=fs.readFileSync(process.env.FPS_HTML||'index.html','utf8');
 const html=source.replace(/\}\)\(\);\s*<\/script>/,'globalThis.fpsTest={Game,Atlas,renderer,BITMAPS,studioIntro,begin,get game(){return game}};})();</script>');
 const server=http.createServer((q,r)=>{r.setHeader('Content-Type','text/html');r.end(html);}).listen(0,'127.0.0.1');await new Promise(r=>server.on('listening',r));
 const browser=await chromium.launch({executablePath:process.env.UI_BROWSER_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:844,height:390}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  if(process.env.PERF_NO_WORKER)await page.addInitScript(()=>{globalThis.Worker=undefined;});
  await page.goto('http://127.0.0.1:'+server.address().port);await page.waitForFunction(()=>fpsTest.BITMAPS.ready);
  const result=await page.evaluate(async()=>{
   const t=fpsTest;t.studioIntro.skip();t.studioIntro.update(2);t.begin();const g=t.game,r=t.renderer,update=g.update.bind(g),frame=r.frame.bind(r);
   // Keep the app's event/save/UI handling, but advance gameplay exactly once.
   g.update=()=>{};r.frame=()=>{};g.dialogue=null;g.player.spawnFX=0;g.player.coins=9999;g.supplies.food=g.supplies.water=999;
   let calls={};for(const name of ['walkNpc','npcPresent','isHostileBatracien','isJusticeGuard','syncLabourActors','stepCivilianAnimations']){
    const fn=g[name];g[name]=function(...args){calls[name]=(calls[name]||0)+1;return fn.apply(this,args);};
   }
   const stats=values=>{values.sort((a,b)=>a-b);return {p50:values[Math.floor(values.length*.5)],p95:values[Math.floor(values.length*.95)],max:values.at(-1),mean:values.reduce((a,b)=>a+b,0)/values.length};};
   const stages=[];
   async function sample(label,n=180){
    calls={};const frames=[],updates=[],renders=[],intervals=[];let previous;
    for(let i=0;i<n;i++){
     const at=performance.now();update(1/60,{});const mid=performance.now();frame();const end=performance.now();frames.push(end-at);updates.push(mid-at);renders.push(end-mid);
     const raf=await new Promise(requestAnimationFrame);if(previous!==undefined)intervals.push(raf-previous);previous=raf;
    }
    stages.push({label,npcs:g.npcs.length,events:g.worldState.events.length,clock:g.clock,frameMs:stats(frames),updateMs:stats(updates),renderMs:stats(renders),rafIntervalMs:stats(intervals),calls:{...calls}});
    if(new Set(g.npcs.map(n=>n.id)).size!==g.npcs.length)throw Error('Duplicated people');
    if(r.atlasGround.size>32||g.atlas.cache.size>48||r.atlasArtStream.pending.size>8)throw Error('Unbounded streaming cache');
   }
   await sample('camp');
   const journeys=[];
   for(const target of ['town-6','town-69']){
    const station=g.stations.find(s=>s.site===g.atlasContext()?.id);if(!station)throw Error('Missing departure station');
    Object.assign(g.player,g.stationLanding(station.site));g.transportSession=station.id;
    const plan=g.planJourney(target,{mode:'horse',allowBoat:true});if(!plan||!g.startJourney(plan))throw Error('Journey could not start');
    let steps=0;while(g.journey&&steps<6000){update(.04,{});if(++steps%30===0)await new Promise(done=>setTimeout(done,0));}
    if(g.journey)throw Error('Journey never completed');journeys.push({requested:target,actual:g.atlasContext()?.id,steps});
    await sample('arrival-'+target);
    g.talkTo(g.fairyActor);if(!g.dialogue)throw Error('Dialogue did not open');const frozenClock=g.clock;
    await sample('dialogue-'+target,120);if(g.clock!==frozenClock)throw Error('Dialogue advanced the world clock');
    for(let i=0;g.dialogue&&i<40;i++){
     if(g.dialogue.choosing){const end=g.dialogue.menu.options.findIndex(o=>o.end);if(end<0)throw Error('No farewell');g.choose(end);}else g.advanceDialogue();
    }
    if(g.dialogue)throw Error('Dialogue did not close');await sample('closed-'+target,180);
    if(g.clock<=frozenClock)throw Error('World clock did not resume');
   }
   const saved=JSON.parse(JSON.stringify(g.serialize())),restored=new t.Game(saved);
   if(restored.clock!==g.clock||restored.player.coins!==g.player.coins)throw Error('Restore changed time or purse');
   return {stages,journeys,restorationMatches:true,cachesBounded:true};
  });
  await page.waitForFunction(()=>{const r=fpsTest.renderer;return r.atlasVisible.every(c=>r.atlasArtStream.current(c.key,c.cx,c.cy));},{},{timeout:60000});
  assert.deepEqual(errors,[]);result.mode=process.env.PERF_NO_WORKER?'cooperative fallback':'worker';result.browserErrors=errors;console.log(JSON.stringify(result,null,2));
 }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
