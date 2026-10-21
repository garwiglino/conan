'use strict';
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict'),{chromium}=require('playwright');
(async()=>{
 const html=fs.readFileSync('ios/Hearthreaver/Game/index.html','utf8').replace(/\}\)\(\);\s*<\/script>/,'globalThis.dungeonCheck={FirstDungeon,HearthreaverKaldorCivilianArt,renderer,BITMAPS,begin,studioIntro,openWorldPanel,openMenu,selectMenuTab,game:()=>game};})();</script>');
 const out=path.resolve('art/dungeon-integration');fs.mkdirSync(out,{recursive:true});const server=http.createServer((q,r)=>{r.setHeader('Content-Type','text/html');r.end(html);}).listen(0,'127.0.0.1');await new Promise(r=>server.on('listening',r));
 const browser=await chromium.launch({executablePath:process.env.UI_BROWSER_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']}),errors=[],results=[];
 try{for(const width of [1280,844,568]){const mobile=width<1000;const page=await browser.newPage({viewport:{width,height:mobile?(width===568?320:390):720},isMobile:mobile,hasTouch:mobile});page.on('pageerror',e=>errors.push(e.stack||e.message));await page.goto('http://127.0.0.1:'+server.address().port);await page.waitForFunction(()=>globalThis.dungeonCheck?.BITMAPS.ready&&dungeonCheck.FirstDungeon.art.ready);
 const start=await page.evaluate(()=>{const t=dungeonCheck;t.studioIntro.skip();t.studioIntro.update(2);t.begin();const g=t.game();g.player.spawnFX=0;g.update=()=>{};return {active:g.dungeon?.active,floor:g.dungeon?.floor,zone:g.zone(),position:[g.player.x,g.player.y]};});assert.ok(start.active);assert.equal(start.floor,'geoles');const prefix=mobile?(width===568?'mobile-small-':'mobile-'):'desktop-';await page.screenshot({path:path.join(out,prefix+'geoles.png')});await page.waitForFunction(()=>!document.getElementById('notices').textContent);
 for(const [id,x,y]of [['grande-salle',11.5,6.5],['galeries',19.5,3.5],['trone',11.5,6.8]]){await page.evaluate(({id,x,y})=>{const t=dungeonCheck,g=t.game();g.enterDungeonFloor(id,{x:x*32,y:y*32});g.player.spawnFX=0;if(id==='trone')g.dungeon.bossFight=true;t.renderer.frame();},{id,x,y});await page.screenshot({path:path.join(out,prefix+id+'.png')});}
 // Exercise the live shipped update and renderer; static screenshots alone miss
 // a projection recreated each frame, which pins the native walk to pose zero.
 const presentation=await page.evaluate(()=>{
  const t=dungeonCheck,g=t.game(),r=t.renderer;delete g.update;
  g.enterDungeonFloor('grande-salle',{x:11.5*32,y:6.5*32});for(const e of g.enemies)e.dead=true;g.player.spawnFX=0;
  const frames=new Set(),positions=[];let firstView;
  for(let i=0;i<22;i++){g.update(.04,{x:1,y:0});r.frame();if(!i)firstView=r.projectionView;positions.push([g.player.x,g.player.y]);frames.add(t.HearthreaverKaldorCivilianArt.gaitFrame(r.projectionView.wrap(g.player)));}
  const moving={poses:frames.size,stableView:firstView===r.projectionView,distance:Math.hypot(positions.at(-1)[0]-positions[0][0],positions.at(-1)[1]-positions[0][1])};
  g.dungeon.fairy=true;g.float('xp',8);g.burst(g.player.x,g.player.y-10,'#edcf80',8);g.spill(g.enemies[0],g.player,false);r.frame();g.dungeon.fairy=false;
  const hud={rows:r.hudLayout.rows,width:r.hudLayout.width,top:r.top,pursuit:r.pursuitReadout};
  g.enterDungeonFloor('trone',{x:11.5*32,y:6.8*32});g.dungeon.bossFight=true;g.update=()=>{};r.frame();return {moving,hud};
 });assert.ok(presentation.moving.poses>=4,JSON.stringify(presentation));assert.ok(presentation.moving.stableView);assert.ok(presentation.moving.distance>20);assert.equal(presentation.hud.rows,1);assert.equal(presentation.hud.pursuit,null);
 const hidden=await page.evaluate(()=>{dungeonCheck.openWorldPanel();return document.getElementById('worldPanel').hidden;});assert.ok(hidden,'world map remains hidden while captive');
 // The on-screen action, menus and actual reload all use the shipped UI.
 await page.locator('#btnMenu').click();await page.evaluate(()=>dungeonCheck.selectMenuTab('bag'));assert.ok((await page.locator('#menuBody').innerText()).includes('Clés de la forteresse'));await page.screenshot({path:path.join(out,prefix+'menu.png')});await page.reload();await page.waitForFunction(()=>globalThis.dungeonCheck?.BITMAPS.ready&&dungeonCheck.FirstDungeon.art.ready);assert.equal(await page.evaluate(()=>dungeonCheck.game().dungeon.floor),'trone');
 const exit=await page.evaluate(()=>{const t=dungeonCheck;t.studioIntro.skip();t.studioIntro.update(2);t.begin();const g=t.game();g.dungeon.bossDead=true;g.dungeon.fairy=true;const escaped=g.leaveFirstDungeon();t.openWorldPanel();return {escaped,mapVisible:!document.getElementById('worldPanel').hidden,fortressListed:[...document.getElementById('worldDestination').options].some(n=>n.textContent==='Forteresse de Grise-Gueule')};});assert.ok(exit.escaped&&exit.mapVisible&&exit.fortressListed);await page.screenshot({path:path.join(out,prefix+'sortie-carte.png')});
 results.push({mobile,width,start,reloadedFloor:'trone',mapHidden:hidden,presentation,exit});await page.close();}
 assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'verification.json'),JSON.stringify({source:'ios/Hearthreaver/Game/index.html',results,browserErrors:errors},null,2)+'\n');console.log('Desktop/mobile opening, four floors, map concealment, inventory, UI save/reload and the discovered exit on the world map passed.');
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
