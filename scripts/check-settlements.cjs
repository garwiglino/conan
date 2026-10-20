'use strict';
const fs=require('node:fs'),http=require('node:http'),assert=require('node:assert/strict'),{chromium}=require('playwright');
(async()=>{
 const html=fs.readFileSync('index.html','utf8').replace(/\}\)\(\);\s*<\/script>/,'globalThis.districtTest={get game(){return game},Atlas,SETTLEMENT_DATA,HearthreaverArchitectureGame,HearthreaverArchitecture,HearthreaverHumanActivities,HearthreaverHumanStations,renderer,BITMAPS,begin,studioIntro};})();</script>');
 const server=http.createServer((q,r)=>{r.setHeader('Content-Type','text/html; charset=utf-8');r.end(html);}).listen(0,'127.0.0.1');await new Promise(r=>server.on('listening',r));
 const browser=await chromium.launch({executablePath:process.env.UI_BROWSER_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']}),errors=[];
 try{for(const [width,height]of [[568,320],[844,390],[932,430]]){
  const page=await browser.newPage({viewport:{width,height},hasTouch:true,isMobile:true,deviceScaleFactor:2});page.on('pageerror',e=>errors.push(e.message));await page.addInitScript(()=>{localStorage.clear();Element.prototype.requestFullscreen=undefined;});await page.goto('http://127.0.0.1:'+server.address().port);await page.waitForFunction(()=>districtTest.BITMAPS.ready);
  await page.evaluate(()=>{const t=districtTest;t.studioIntro.skip();t.studioIntro.update(2);t.begin();t.game.dialogue=null;t.game.player.spawnFX=0;});
  await page.waitForFunction(()=>performance.now()>districtTest.studioIntro.releaseUntil);
  for(const id of ['town-1','town-69','town-6','town-73','town-50']){
   const result=await page.evaluate(id=>{const t=districtTest,g=t.game,s=g.settlements.sites.get(id),b=s.buildings.find(b=>b.id==='B07'),door=b.geometry.portals[0];g.placeSafely(door.x+door.nx*30,door.y+door.ny*30);g.player.spawnFX=0;g.updateLocation(1);g.updateLocation(1);g.populateCivilians();g.stepCivilianAnimations(.04);return {id,buildings:s.buildings.length,landing:g.stationLanding(id),stats:g.settlementDiagnostics()};},id);
   assert.ok(result.buildings>=8);assert.ok(result.landing,id+' has no transport landing');await page.waitForTimeout(250);await page.screenshot({path:'/tmp/conan-district-'+id+'-'+width+'.png'});
  }
  const transparency=await page.evaluate(()=>{
   const t=districtTest,g=t.game,r=t.renderer,A=t.HearthreaverArchitectureGame,Art=HearthreaverArchitectureRender,project=o=>({...o,...WorldProjection.point(o.x,o.y)});let chosen,point;
   for(const b of g.settlements.sites.get('town-1').buildings){if(A.entry(b.id).openHall)continue;const f=Art.frame(b),foot=b.geometry.foot;
    for(let y=foot.y-32;y<foot.y+foot.h&&!point;y+=2)for(let x=foot.x;x<foot.x+foot.w;x+=2)if(!g.solid(x,y,5,0)&&Art.obscures(f,project(b),project({x,y,level:0}))){chosen=b;point={x,y};break;}if(point)break;
   }
   if(!chosen)throw Error('No walkable point behind a building');g.placeSafely(point.x,point.y);g.player.spawnFX=0;g.player.z=0;delete g.player.elevation;
   for(let i=0;i<45;i++){g.time+=1/60;r.frame();}
   const alpha=r.architectureOcclusion?.get(chosen.uid)?.alpha,objects=Art.objects(r,chosen),wholeHouseFaded=objects.every(o=>o.architectureAlpha===alpha);
   const body=chosen.geometry.solids.find(s=>s.zMin===0&&s.zMax>22&&s.w>30),inside=body.polygon.reduce((v,a)=>[v[0]+a[0]/4,v[1]+a[1]/4],[0,0]);
   return {alpha,wholeHouseFaded,behindFree:!g.solid(g.player.x,g.player.y,5,0),foundationBlocked:g.solid(...inside,5,0)};
  });assert.ok(transparency.alpha>=.32&&transparency.alpha<.35);assert.ok(transparency.wholeHouseFaded&&transparency.behindFree&&transparency.foundationBlocked);await page.screenshot({path:'/tmp/conan-transparency-'+width+'.png'});console.log('PASS whole house fades like starting deck, foundations remain solid '+width+'×'+height);
  const worker=await page.evaluate(()=>{const t=districtTest,g=t.game,pair=[...g.humanWorkstations].find(([id,w])=>w.sheltered&&(()=>{const n=g.npcs.find(n=>n.id===id);return n&&!n.dangerState&&!n.worldChat&&!n.justiceReport&&!n.labourReturning&&!n.reliefPost&&!n.civilian?.critical&&!n.civilian?.dead;})()),[id,w]=pair,n=g.npcs.find(n=>n.id===id),building=g.settlements.buildings.find(b=>b.uid===w.building),door=building.geometry.portals[0];Object.assign(n,{x:door.x+door.nx*30,y:door.y+door.ny*30});g.civilianAction(n,'idle',true);n.civilian.elapsed=1;n.path=[];
   let steps=0;while(Math.hypot(n.x-w.feet[0],n.y-w.feet[1])>2&&steps++<800){const x=n.x,y=n.y;g.walkNpc(n,{x:w.feet[0],y:w.feet[1]},.04);if(Math.hypot(n.x-x,n.y-y)>1.281)throw Error('Worker teleported');if(g.solid(n.x,n.y,4,0))throw Error('Worker crossed a wall '+JSON.stringify({id,steps,before:[x,y],after:[n.x,n.y],level:n.level,goal:w.feet,solidBefore:g.solid(x,y,4,0),path:n.path}));}
   if(Math.hypot(n.x-w.feet[0],n.y-w.feet[1])>2)throw Error('Worker never reached its station '+JSON.stringify({id,feet:w.feet,position:[n.x,n.y],action:n.civilian?.action,chat:!!n.worldChat,report:!!n.justiceReport,returning:!!n.labourReturning,path:n.path}));n.civilian.lastX=n.x;n.civilian.lastY=n.y;n.civilian.restClock=0;n.civilian.moveTime=g.time-1;g.time+=.1;g.stepCivilianAnimations(.04);g.placeSafely(n.x,n.y+48);t.renderer.frame();return {id,steps,action:n.civilian.action,stats:g.settlementDiagnostics()};});assert.ok(worker.steps>0);assert.ok(worker.stats.actorFrames>0);await page.waitForTimeout(150);await page.screenshot({path:'/tmp/conan-worker-'+width+'.png'});
  const result=await page.evaluate(()=>{const t=districtTest,g=t.game,r=t.renderer;const bad=[];for(const s of g.settlements.sites.values())for(const b of s.buildings){const p=b.geometry.portals[0];if(g.solid(p.x+p.nx*20,p.y+p.ny*20,4,0))bad.push(b.uid);}
   const count=g.settlementDiagnostics(),actors=g.npcs.length,pop=Object.values(g.worldState.simulation.state.sites).reduce((n,s)=>n+s.population,0);for(let i=0;i<120;i++){g.time+=1/60;r.frame();}return {bad,count,actorsAfter:g.npcs.length,actors,pop};});assert.deepEqual(result.bad,[]);assert.equal(result.actors,result.actorsAfter);assert.equal(result.count.sites,83);assert.ok(result.count.actorFrames<=256);assert.ok(result.count.fixtureFrames<=98);console.log('PASS native districts '+width+'×'+height+' '+JSON.stringify(result.count));await page.close();
 }assert.deepEqual(errors,[]);}finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
