'use strict';
const fs=require('node:fs'),http=require('node:http'),assert=require('node:assert/strict'),path=require('node:path'),{chromium}=require('playwright');
(async()=>{
 const web=fs.readFileSync('index.html','utf8'),native=fs.readFileSync('ios/Hearthreaver/Game/index.html','utf8');
 assert.equal(web.replace(/<meta name="apple-mobile-web-app-title"[^>]*><link rel="apple-touch-icon"[^>]*><link rel="manifest"[^>]*>/,''),native,'Web/iOS must run the same world');
 const sources=['sprites/terrain/terrain-isometric.js','sprites/environnement/teremor-data.js','sprites/environnement/sarak-data.js','sprites/environnement/environment-iso.js','sprites/architecture/isometric-pixels.js','sprites/architecture/city-pixels.js','scripts/settlement-runtime.js','scripts/city-life-runtime.js','scripts/city-wayfinding-runtime.js','scripts/world-projection.js','scripts/world-isometric-art.js','scripts/world-isometric-runtime.js'];
 for(const source of sources)assert.ok(native.includes(fs.readFileSync(source,'utf8')),source+' is stale in the shipped game');
 const html=native.replace(/\}\)\(\);\s*<\/script>/,'globalThis.isoTest={Game,Renderer,Atlas,WorldProjection,HearthreaverArchitectureRender:HearthreaverArchitectureRender.createRenderer(HearthreaverSettlementArchitecture),HearthreaverArchitectureGame:HearthreaverSettlementArchitecture,renderer,BITMAPS,begin,studioIntro,get game(){return game}};})();</script>');
 const server=http.createServer((q,r)=>{r.setHeader('Content-Type','text/html');r.end(html);}).listen(0,'127.0.0.1');await new Promise(r=>server.on('listening',r));
 const browser=await chromium.launch({executablePath:process.env.UI_BROWSER_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']}),errors=[],results=[];
 const output=path.resolve('art/terrain-isometric-js/integration');fs.mkdirSync(output,{recursive:true});
 try{
  const page=await browser.newPage({viewport:{width:844,height:390},isMobile:true,hasTouch:true});page.on('pageerror',e=>errors.push(e.stack||e.message));
  if(process.env.PERF_NO_WORKER)await page.addInitScript(()=>{globalThis.Worker=undefined;});
  await page.goto('http://127.0.0.1:'+server.address().port);await page.waitForFunction(()=>isoTest.BITMAPS.ready);
  await page.evaluate(()=>{const t=isoTest;t.studioIntro.skip();t.studioIntro.update(2);t.begin();const g=t.game,r=t.renderer;t.update=g.update.bind(g);t.frame=r.frame.bind(r);g.update=()=>{};r.frame=()=>{};g.dialogue=null;g.player.spawnFX=0;g.clock=720;});
  const localities=await page.evaluate(()=>{const {game:g,Atlas:A}=isoTest;return [...g.settlements.sites.values()].map(s=>{const n=A.byId[s.id],c=A.cellAt(n.x,n.y),r=A.regions.get(c?.region),landing=g.stationLanding(s.id);if(!landing)throw Error(s.id+' has no staffed arrival');return {id:s.id,name:s.name,territory:r?.territory||r?.continent,biome:c?.biome,buildings:s.buildings.length,arrival:landing};});});assert.equal(localities.length,83);assert.equal(localities.reduce((n,s)=>n+s.buildings,0),4514);
  for(const id of ['camp','town-1','town-2','town-69','town-6','town-73','town-50']){
   await page.evaluate(id=>{const t=isoTest,g=t.game,r=t.renderer,node=t.Atlas.byId[id],site=g.settlements.sites.get(id),b=site?.buildings.find(b=>b.id==='B07');
    const p=b?.geometry.portals[0],halles=id==='town-1'?g.mapPlaces.find(n=>n.id==='district-town-1-halles'):null,at=halles?t.Atlas.toGame(halles.x,halles.y):p?{x:p.x+p.nx*25,y:p.y+p.ny*25}:t.Atlas.toGame(node.x,node.y);g.placeSafely(at.x,at.y);g.player.spawnFX=0;g.player.z=0;g.updateLocation(0);g.updateLocation(1);r.focus=null;r.cameraPosition=null;t.frame();
   },id);
   await page.waitForFunction(()=>{const r=isoTest.renderer;isoTest.frame();return r.atlasVisible.every(c=>r.atlasArtStream.current(c.key,c.cx,c.cy));},{},{timeout:60000});
   const result=await page.evaluate(()=>{const t=isoTest,g=t.game,r=t.renderer,before=JSON.stringify([g.player.x,g.player.y]),p=t.WorldProjection.point(g.player.x,g.player.y),time=g.clock;t.frame();
    if(before!==JSON.stringify([g.player.x,g.player.y]))throw Error('Renderer moved the player');const save=JSON.parse(JSON.stringify(g.serialize())),copy=new t.Game(save);if(copy.player.x!==g.player.x||copy.player.y!==g.player.y||copy.clock!==time)throw Error('Save/restore moved the player');
    return {logical:[g.player.x,g.player.y],projected:[p.x,p.y],cache:r.atlasGround.size,pending:r.atlasArtStream.pending.size,occluders:r.projectedCliffs.length,restored:true,stats:g.settlementDiagnostics()};
   });assert.ok(result.cache<=16);assert.ok(result.pending<=8);results.push({id,...result});await page.screenshot({path:path.join(output,id+(process.env.PERF_NO_WORKER?'-fallback':'')+'.png')});
  }
  const occlusion=await page.evaluate(()=>{
   const t=isoTest,g=t.game,r=t.renderer,P=t.WorldProjection,Art=t.HearthreaverArchitectureRender,A=t.HearthreaverArchitectureGame;let chosen,point;
   for(const b of g.settlements.sites.get('town-1').buildings){if(A.entry(b.id).openHall)continue;const f=Art.frame(b),foot=b.geometry.foot,bp={...b,...P.point(b.x,b.y)};
    for(let y=foot.y-40;y<foot.y+foot.h&&!point;y+=2)for(let x=foot.x-40;x<foot.x+foot.w+40;x+=2)if(!g.solid(x,y,5,0)&&Art.obscures(f,bp,{...P.point(x,y),level:0})){chosen=b;point={x,y};break;}if(point)break;
   }if(!chosen)throw Error('No free space behind a house');g.placeSafely(point.x,point.y);g.player.z=0;delete g.player.elevation;for(let i=0;i<90;i++){g.time+=1/60;t.frame();}
   const alpha=r.architectureOcclusion.get(chosen.uid)?.alpha,body=chosen.geometry.solids.find(s=>s.zMin<=1&&s.zMax>22&&s.w>25),inside=body.polygon.reduce((v,p)=>[v[0]+p[0]/4,v[1]+p[1]/4],[0,0]);
   return {alpha,free:!g.solid(g.player.x,g.player.y,5,0),foundationSolid:g.solid(...inside,5,0)};
  });assert.ok(occlusion.alpha>=.32&&occlusion.alpha<.33);assert.ok(occlusion.free&&occlusion.foundationSolid);
  await page.screenshot({path:path.join(output,'passage-derriere-maison'+(process.env.PERF_NO_WORKER?'-fallback':'')+'.png')});
  assert.deepEqual(errors,[]);const report={source:'ios/Hearthreaver/Game/index.html',browser:'Chromium',viewport:[844,390],sources,mode:process.env.PERF_NO_WORKER?'cooperative fallback':'worker',localities,results,occlusion,browserErrors:errors};fs.writeFileSync(path.join(output,'verification'+(process.env.PERF_NO_WORKER?'-fallback':'')+'.json'),JSON.stringify(report,null,2)+'\n');console.log('PASS current web/iOS sources; 83 staffed localities; seven scenes covering all five territories; bounded caches, stable saves and solid foundations behind faded houses ('+report.mode+').');
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
