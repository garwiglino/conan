// Real browser viewport and shipped crime/dialogue handlers, in three formats.
const fs=require('node:fs'),http=require('node:http'),assert=require('node:assert/strict'),{chromium}=require('playwright');
(async()=>{
 const html=fs.readFileSync('index.html','utf8').replace(/\}\)\(\);\s*<\/script>/,'globalThis.crimeTest={get game(){return game},Atlas,BITMAPS,renderer,begin,studioIntro,handleEvents,syncDialogue};})();</script>');
 const server=http.createServer((q,r)=>{r.setHeader('Content-Type','text/html; charset=utf-8');r.end(html);}).listen(0,'127.0.0.1');await new Promise(r=>server.on('listening',r));
 const browser=await chromium.launch({executablePath:process.env.UI_BROWSER_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']}),page=await browser.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));await page.addInitScript(()=>{Element.prototype.requestFullscreen=undefined;localStorage.clear();});
 try{for(const [width,height]of [[568,320],[844,390],[932,430]]){
  await page.setViewportSize({width,height});await page.goto('http://127.0.0.1:'+server.address().port);await page.waitForFunction(()=>globalThis.crimeTest&&crimeTest.BITMAPS.ready);
  const result=await page.evaluate(()=>{
   const t=crimeTest;t.studioIntro.skip();t.studioIntro.update(2);t.begin();const g=t.game;
   // Freeze input-driven updates for a repeatable sequence; rendering/UI are real.
   g.update=()=>{};g.dialogue=null;g.enemies.forEach(e=>e.dead=true);g.power=()=>1;
   const post=t.Atlas.toGame(t.Atlas.byId.camp.x,t.Atlas.byId.camp.y),places=[];
   for(let y=-96;y<=96;y+=16)for(let x=-96;x<=96;x+=16){const p={x:post.x+x,y:post.y+y,level:0};if(!g.solid(p.x,p.y,7,0)&&(!places.length||g.lineClear(places[0],p)))places.push(p);}
   if(places.length<3)throw Error('No real safe ground for fixture');
   const [n,w]=g.npcs.filter(n=>n.resident&&n.civilian&&!n.batracien).slice(0,2);
   for(const [actor,p]of [[n,places[0]],[w,places[1]]]){Object.assign(actor,p,{post:{...p},alpha:1});Object.assign(actor.civilian,{hp:6,inv:0,dead:false});delete actor.dangerState;}
   const guard={id:'browser-law-guard',eventGuard:true,site:'camp',...places[2],alpha:1,post:{...places[2]},name:'GARDE'};g.npcs=[n,w,guard];g.ensureHumanGuard(guard);Object.assign(g.player,places[0]);t.renderer.frame();
   const start=g.clock;g.damageCivilian(n,1,g.player);const warning=g.worldState.justice.state.cases.length===0&&!g.isHostileHumanGuard(guard);
   n.civilian.inv=0;g.damageCivilian(n,1,g.player);t.handleEvents();t.syncDialogue();const refused=g.talkTo(w)===false&&g.npcPresent(w)===false&&w.dangerState?.attacker==='player';
   const until=g.justiceEffect(w).fearUntil,view=g.justiceView;let deployment;for(let i=0;i<12&&!deployment;i++)deployment=g.planJusticeDeployment('camp',t.Atlas.toWorld(g.player.x,g.player.y));
   if(!deployment)throw Error('No navigable offscreen approach on actual terrain');
   const entry=t.Atlas.toGame(...deployment.path[0].from),outside=entry.x<view.x||entry.x>view.x+view.w||entry.y<view.y||entry.y>view.y+view.h;
   g.clock=until;g.refreshJusticeFear(true);return {warning,refused,fearMinutes:until-start,calm:!g.justiceEffect(w).refuse,outside,readyAfter:deployment.readyAt-start};
  });assert.ok(result.warning&&result.refused&&result.calm&&result.outside);assert.equal(result.fearMinutes,180);assert.ok(result.readyAfter>=1);console.log('PASS crime '+width+'×'+height+' '+JSON.stringify(result));
 }assert.deepEqual(errors,[]);}finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
