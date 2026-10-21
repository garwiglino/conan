'use strict';
// Phone-only verification of the shipped dungeon compositor and touch input.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict'),{chromium}=require('playwright');
(async()=>{
 const root=path.resolve(__dirname,'../..'),out=path.join(root,'art/gobelins/animations'),source=fs.readFileSync(path.join(root,'ios/Hearthreaver/Game/index.html'),'utf8');
 const html=source.replace(/\}\)\(\);\s*<\/script>/,'globalThis.goblinCheck={G:HearthreaverGoblins,W:HearthreaverWeapons,FirstDungeon,WorldProjection,renderer,BITMAPS,begin,studioIntro,game:()=>game};})();</script>');assert.notEqual(html,source);
 const server=http.createServer((q,r)=>{r.setHeader('Content-Type','text/html');r.end(html);}).listen(0,'127.0.0.1');await new Promise(r=>server.on('listening',r));
 const browser=await chromium.launch({executablePath:process.env.UI_BROWSER_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']}),errors=[],results=[];
 try{for(const width of [844,568]){
  const page=await browser.newPage({viewport:{width,height:width===844?390:320},isMobile:true,hasTouch:true});page.on('pageerror',e=>errors.push(e.stack||e.message));
  await page.goto('http://127.0.0.1:'+server.address().port,{waitUntil:'domcontentloaded',timeout:120000});await page.waitForFunction(()=>globalThis.goblinCheck?.BITMAPS.ready&&goblinCheck.FirstDungeon.art.ready,null,{timeout:120000});
  const poses=await page.evaluate(()=>{
   const t=goblinCheck;t.studioIntro.skip();t.studioIntro.update(2);t.begin();const g=t.game(),r=t.renderer,G=t.G;g.player.spawnFX=0;g.enterDungeonFloor('grande-salle',{x:11.5*32,y:6.5*32});g.update=()=>{};for(const e of g.enemies)e.dead=true;
   const e=g.enemies[0];Object.assign(e,{dead:false,x:g.player.x-12,y:g.player.y+12,dir:1,stun:0,flash:0,cooldown:99});
   g.targetId=e.id;const rings=[],ring=r.targetRing;r.targetRing=function(x,y,radius){rings.push([x,y,radius]);return ring.call(this,x,y,radius);};
   const hashes=new Set();let contacts=0;
   for(let dir=0;dir<4;dir++)for(let combo=0;combo<4;combo++)for(let f=0;f<6;f++){
    e.dir=dir;e.nextCombo=combo;G.start(e);const row=G.times('attack',false,combo);e.swingElapsed=row.slice(0,f).reduce((a,b)=>a+b,0)+row[f]*.5;e.wind=Math.max(0,row[0]+row[1]-e.swingElapsed);
    r.frame();const look=G.look(e);if(f===2){contacts++;if(look.frame!==2)throw Error('Impact drawing mismatch');}
    const pixels=r.c.getImageData(0,0,r.c.canvas.width,r.c.canvas.height).data;let h=2166136261;for(let i=0;i<pixels.length;i+=17)h=Math.imul(h^pixels[i],16777619);hashes.add(h);
   }
   e.dir=1;e.nextCombo=0;G.start(e);const row=G.times('attack');e.swingElapsed=row[0]+row[1]+row[2]*.5;e.wind=0;r.frame();const pose=G.look(e),q=t.WorldProjection.point(e.x,e.y);if(!rings.length||rings.some(a=>a[0]!==q.x||a[1]!==q.y||a[2]!==12))throw Error('Shared target ring must sit at projected feet');
   g.player.comboWindow=0;g.player.attack=0;g.player.attackCD=0;g.aimAttack(e.x-g.player.x,e.y-g.player.y,true);g.swingSword();const hit=t.W.times(g.player.weapon,g.player.combo);g.player.attack=t.W.duration(g.player.weapon,g.player.combo)-hit[0]-hit[1]-hit[2]*.5;g.player.impactTick=true;g.damageEnemy(e,1);r.frame();const feedback={blood:g.bloodFX.length,hitStop:g.player.hitPause,shake:g.weaponShake?.amplitude,heavyEvent:g.events.some(e=>e.type==='hit')};return {distinctDrawings:hashes.size,contacts,pose,ringChecks:rings.length,feedback};
  });assert.ok(poses.distinctDrawings>=16,JSON.stringify(poses));assert.equal(poses.contacts,16);assert.ok(poses.ringChecks>=96);assert.ok(poses.feedback.blood>0&&poses.feedback.hitStop>0&&poses.feedback.shake<=1);
  await page.waitForFunction(()=>!document.getElementById('notices').textContent,null,{timeout:20000});await page.screenshot({path:path.join(out,'mobile-'+width+'-combat.png')});
  const chief=await page.evaluate(()=>{const t=goblinCheck,g=t.game();g.enterDungeonFloor('trone',{x:11.5*32,y:6.8*32});g.player.spawnFX=0;g.dungeon.bossFight=true;const e=g.enemies.find(e=>e.chief);g.targetId=e.id;e.dead=false;e.dir=2;e.nextCombo=3;t.G.start(e);const row=t.G.times('attack',true,3);e.swingElapsed=row[0]+row[1]+row[2]*.5;e.wind=0;delete t.renderer.targetRing;t.renderer.frame();return {state:t.G.look(e),bodySize:t.G.SIZE};});assert.equal(chief.bodySize,80);
  await page.screenshot({path:path.join(out,'mobile-'+width+'-chef.png')});
  await page.evaluate(()=>{const t=goblinCheck,g=t.game();g.weaponDrops=[{weapon:'dague-kesh',x:g.player.x,y:g.player.y,level:0,delay:0,source:'mobile-check'}];g.stepWeaponDrops(.04);t.renderer.frame();});
  await page.waitForFunction(()=>document.getElementById('weaponDiscovery')?.style.visibility==='visible',null,{timeout:10000});
  const discovery=await page.evaluate(()=>{const t=goblinCheck,r=t.renderer,g=t.game(),card=document.getElementById('weaponDiscovery'),box=card.getBoundingClientRect(),cv=r.c.canvas.getBoundingClientRect(),q=t.WorldProjection.point(g.player.x,g.player.y),footY=cv.top+(r.top+q.y-r.cam.y)*cv.height/r.H;return {width:box.width,aboveWeapon:box.bottom<footY,owned:g.arsenal.owned.includes('dague-kesh'),lines:card.querySelectorAll('strong,span').length};});assert.ok(discovery.width<=230&&discovery.aboveWeapon&&discovery.owned&&discovery.lines===2,JSON.stringify(discovery));
  await page.screenshot({path:path.join(out,'mobile-'+width+'-loot.png')});await page.locator('#weaponDiscovery button').tap();
  await page.evaluate(()=>{const g=goblinCheck.game();for(const e of g.enemies)e.dead=true;g.player.attack=0;g.player.attackCD=0;g.player.attackHeld=false;g.player.spawnFX=0;delete g.update;});
  await page.locator('[data-key="attack"]').tap();await page.waitForFunction(()=>goblinCheck.game().player.attack>0,null,{timeout:10000});
  results.push({width,mobile:true,poses,chief,discovery,touchAttack:true});await page.close();
 }
 assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'mobile-verification.json'),JSON.stringify({source:'ios/Hearthreaver/Game/index.html',results,browserErrors:errors},null,2)+'\n');console.log('Both phone sizes: all goblin combos and native views rendered, chief rendered without stretching, real touch attack passed.');
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
