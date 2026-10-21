'use strict';
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict'),{chromium}=require('playwright');
(async()=>{
 const html=fs.readFileSync('ios/Hearthreaver/Game/index.html','utf8').replace(/\}\)\(\);\s*<\/script>/,'globalThis.cityAccessTest={Atlas,renderer,BITMAPS,begin,studioIntro,openWorldPanel,get game(){return game}};})();</script>'),out=path.resolve('art/city-plans/acces');fs.mkdirSync(out,{recursive:true});
 const server=http.createServer((q,r)=>{r.setHeader('Content-Type','text/html');r.end(html);}).listen(0,'127.0.0.1');await new Promise(r=>server.on('listening',r));
 const browser=await chromium.launch({executablePath:process.env.UI_BROWSER_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']}),errors=[],results=[];
 try{for(const mobile of [false,true]){
  const page=await browser.newPage({viewport:mobile?{width:844,height:390}:{width:1280,height:720},isMobile:mobile,hasTouch:mobile});page.on('pageerror',e=>errors.push(e.stack||e.message));
  // Exercise the cooperative renderer used when a WKWebView disables workers.
  await page.addInitScript(()=>{globalThis.Worker=undefined;});await page.goto('http://127.0.0.1:'+server.address().port);await page.waitForFunction(()=>cityAccessTest.BITMAPS.ready);
  const arrival=await page.evaluate(()=>{const t=cityAccessTest;t.studioIntro.skip();t.studioIntro.update(2);t.begin();const g=t.game,r=t.renderer;t.frame=r.frame.bind(r);g.update=()=>{};r.frame=()=>{};g.dialogue=null;g.clock=600;g.player.spawnFX=0;g.time+=.04;g.stepCivilianAnimations(.04);const p=t.Atlas.byId['town-1'];g.placeSafely(...Object.values(t.Atlas.toGame(p.x,p.y)));g.player.z=0;g.player.level=0;g.updateLocation(0);r.focus=null;r.cameraPosition=null;t.frame();return {detail:g.location.current.detail,navigation:g.navigation,distance:g.navigationInfo().metres,position:{x:g.player.x,y:g.player.y}};});
  assert.equal(arrival.detail,"Relais d'arrivée");assert.equal(arrival.navigation,'district-town-1-halles');assert.ok(arrival.distance>850&&arrival.distance<920);
  const settle=()=>page.waitForFunction(()=>{const t=cityAccessTest;t.frame();return t.renderer.atlasVisible.every(c=>t.renderer.atlasArtStream.current(c.key,c.cx,c.cy));},{},{timeout:60000});
  await settle();const prefix=mobile?'mobile-':'bureau-';await page.screenshot({path:path.join(out,prefix+'arrivee.png')});
  await page.evaluate(()=>cityAccessTest.openWorldPanel());const options=await page.locator('#worldDestination option').evaluateAll(nodes=>nodes.map(n=>({id:n.value,name:n.textContent})));assert.equal(options.filter(n=>n.id.startsWith('district-town-1-')).length,11);await page.screenshot({path:path.join(out,prefix+'carte.png')});
  await page.locator('#worldDestination').selectOption('district-town-1-metiers');await page.locator('#worldTrack').click();assert.equal(await page.evaluate(()=>cityAccessTest.game.navigation),'district-town-1-metiers');
  await page.evaluate(()=>cityAccessTest.openWorldPanel());await page.locator('#worldDestination').selectOption('district-town-1-halles');await page.locator('#worldTrack').click();
  await page.addStyleTag({content:'#notices { display:none !important; }'});
  const halles=await page.evaluate(()=>{const t=cityAccessTest,g=t.game,p=g.navigationInfo().target;g.placeSafely(p.x,p.y);g.player.spawnFX=0;g.updateLocation(0);t.renderer.focus=null;t.renderer.cameraPosition=null;t.frame();return {detail:g.location.current.detail,arrived:g.navigationInfo().arrived,position:{x:g.player.x,y:g.player.y}};});assert.equal(halles.detail,'Les Halles du Boisclair');assert.ok(halles.arrived);await settle();await page.screenshot({path:path.join(out,prefix+'halles.png')});
  results.push({mobile,arrival,halles,districts:options.filter(n=>n.id.startsWith('district-town-1-'))});await page.close();
 }
 assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'verification.json'),JSON.stringify({source:'ios/Hearthreaver/Game/index.html',browser:'Chromium',worker:false,results,browserErrors:errors},null,2)+'\n');console.log('Arrival, all 11 district destinations, map tracking and actual Halles rendering passed on desktop and mobile; no browser errors.');
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
