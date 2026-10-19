// Real browser: all five territories use their climate in streamed terrain and the live game.
const fs=require('node:fs'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
(async()=>{
 const html=fs.readFileSync('index.html','utf8').replace(/\}\)\(\);\s*<\/script>/,'globalThis.climateTest={Atlas,BITMAPS,renderer,studioIntro,begin,get game(){return game}};})();</script>');
 const server=http.createServer((q,r)=>{r.setHeader('Content-Type','text/html');r.end(html);}).listen(0,'127.0.0.1');await new Promise(r=>server.on('listening',r));
 const browser=await chromium.launch({executablePath:process.env.UI_BROWSER_PATH||'/usr/bin/chromium',args:['--no-sandbox'],headless:true});
 try{
  const page=await browser.newPage({viewport:{width:844,height:390}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  if(process.env.PERF_NO_WORKER)await page.addInitScript(()=>{globalThis.Worker=undefined;});
  await page.goto('http://127.0.0.1:'+server.address().port);await page.waitForFunction(()=>climateTest.BITMAPS.ready);
  const targets=await page.evaluate(()=>{
   const t=climateTest;t.studioIntro.skip();t.studioIntro.update(2);t.begin();
   const g=t.game,r=t.renderer;t.frame=r.frame.bind(r);g.update=()=>{};r.frame=()=>{};g.clock=72*1440+120;g.dialogue=null;g.player.spawnFX=0;
   return [['Igea',[9,10,11]],['Teremor',[4,6,8,9,11,12]],['Sarak',[1,2,4,6,12]],['Varan',[8,12]],['Tagon',[4,5,6,7,8]]].flatMap(([name,biomes])=>biomes.map(b=>{const c=t.Atlas.cells.find(c=>c.land&&t.Atlas.regions.get(c.region)?.territory===name&&c.biome===b);return {name,biome:b,x:c.x,y:c.y};}));
  });
  const checks=[];
  for(const target of targets){
   const result=await page.evaluate(p=>{
    const t=climateTest,g=t.game,r=t.renderer;Object.assign(g.player,t.Atlas.toGame(p.x,p.y));g.updateLocation(0);t.frame();
    const sky=g.sky();return {...p,temperature:sky.temperature,snow:sky.snow,blizzard:sky.blizzard,cover:t.Atlas.snowCover(p.biome,t.Atlas.cellAt(p.x,p.y).height,g.clock,t.Atlas.cellAt(p.x,p.y).region),pending:r.atlasArtStream.pending.size};
   },target);
   await page.waitForFunction(()=>{const r=climateTest.renderer;return r.atlasVisible.length&&r.atlasVisible.every(c=>r.atlasArtStream.current(c.key,c.cx,c.cy));},{},{timeout:30000});
   if(['Sarak','Varan','Tagon'].includes(result.name)){assert.ok(result.temperature>6);assert.equal(result.snow,0);assert.equal(result.blizzard,0);assert.equal(result.cover,0);}else if(result.biome===11)assert.equal(result.cover,1);assert.ok(result.pending<=8);checks.push(result);
  }
  const sites=await page.evaluate(()=>{
   const t=climateTest,g=t.game,result=[];
   for(const n of t.Atlas.nodes.filter(n=>n.rest&&['Sarak','Varan','Tagon'].includes(t.Atlas.regions.get(n.region)?.territory))){
    Object.assign(g.player,t.Atlas.toGame(n.x,n.y));g.updateLocation(0);t.frame();
    const frozen=g.atlasProps.filter(p=>p.site===n.id&&(/^snow_|winter|frostgrass/.test(p.kind)||p.kind.includes('_winter')));
    if(frozen.length)throw Error('Snowy warm-territory settlement: '+n.name);
    result.push(n.id);
   }
   return result;
  });
  assert.deepEqual(errors,[]);console.log(JSON.stringify({mode:process.env.PERF_NO_WORKER?'cooperative fallback':'worker',checks,settlementsWithoutSnow:sites.length,browserErrors:errors},null,2));
 }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
