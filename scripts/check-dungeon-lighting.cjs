'use strict';
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict'),{chromium}=require('playwright');
(async()=>{
 const root=path.resolve(__dirname,'..'),out=path.join(root,'art/dungeon-lighting');fs.mkdirSync(out,{recursive:true});
 const source=fs.readFileSync(path.join(root,'ios/Hearthreaver/Game/index.html'),'utf8'),html=source.replace(/\}\)\(\);\s*<\/script>/,'globalThis.lightCheck={F:FirstDungeon,L:DungeonLighting,W:HearthreaverWeapons,P:WorldProjection,renderer,BITMAPS,begin,studioIntro,game:()=>game,data:DUNGEON_DATA};})();</script>');assert.notEqual(source,html);
 const server=http.createServer((q,r)=>{r.setHeader('Content-Type','text/html');r.end(html);}).listen(0,'127.0.0.1');await new Promise(r=>server.on('listening',r));
 const browser=await chromium.launch({executablePath:process.env.UI_BROWSER_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']}),errors=[],results=[];
 try{for(const width of [844,568]){const page=await browser.newPage({viewport:{width,height:width===844?390:320},isMobile:true,hasTouch:true});page.on('pageerror',e=>errors.push(e.stack||e.message));
  await page.goto('http://127.0.0.1:'+server.address().port,{waitUntil:'domcontentloaded',timeout:120000});await page.waitForFunction(()=>globalThis.lightCheck?.BITMAPS.ready&&lightCheck.F.art.ready,null,{timeout:120000});
  await page.evaluate(()=>{const t=lightCheck;t.studioIntro.skip();t.studioIntro.update(2);t.begin();t.game().player.spawnFX=0;t.game().update=()=>{};});
  await page.waitForFunction(()=>!document.getElementById('notices').textContent,null,{timeout:20000});
  for(const floor of ['geoles','grande-salle','galeries','trone']){
   const result=await page.evaluate(id=>{
    const t=lightCheck,g=t.game(),r=t.renderer,it=t.F.art.floors[id].items.find(i=>i.piece.endsWith('/mur-torche')),e=t.F.design.etages.find(e=>e.id===id),cell=it.cells.find(([x,y])=>e.plan[y]?.[x]&&e.plan[y][x]!=='#');
    g.enterDungeonFloor(id,{x:(cell[0]+.5)*32,y:(cell[1]+.5)*32});g.player.spawnFX=0;g.time=2;for(const n of g.enemies)n.dead=true;r.frame();
    const lights=r.dungeonLightSources,torch=lights.find(s=>s.piece===it.piece&&Math.abs(s.x-it.ref[0])<25&&Math.abs(s.y-it.ref[1])<25);if(!torch)throw Error('Visible torch not lit');
    const pool=t.P.point(torch.x,torch.y,torch.z*.20),x=Math.round(pool.x-Math.floor(r.cam.x)),y=Math.round(pool.y-Math.floor(r.cam.y)),ctx=r.skyCv.getContext('2d'),pixel=()=>Array.from(ctx.getImageData(x,y,1,1).data),lit=pixel();
    const specs=t.data.art.lightSpecs;t.data.art.lightSpecs={};r.frame();const unlit=pixel();t.data.art.lightSpecs=specs;r.frame();
    return {floor:id,sources:lights.length,lit,unlit,torch:torch.screen,mask:[r.skyCv.width,r.skyCv.height],viewport:[r.W,r.H-r.top]};
   },floor);
   assert.ok(result.sources>0);assert.ok(result.lit[0]>result.unlit[0]+30,JSON.stringify(result));assert.ok(result.mask[0]<=Math.ceil(result.viewport[0])+2&&result.mask[1]<=Math.ceil(result.viewport[1])+2);
   await page.screenshot({path:path.join(out,'mobile-'+width+'-'+floor+'.png')});results.push({width,...result});
  }
  const combat=await page.evaluate(()=>{const t=lightCheck,g=t.game();g.enterDungeonFloor('grande-salle',{x:11.5*32,y:6.5*32});g.player.spawnFX=0;for(const e of g.enemies)e.dead=true;const e=g.enemies[0];Object.assign(e,{dead:false,hp:3,x:g.player.x-12,y:g.player.y+12,stun:0,wind:0,attack:0,swingElapsed:null});g.targetId=e.id;g.player.attack=0;g.player.attackCD=0;g.player.comboWindow=0;g.aimAttack(e.x-g.player.x,e.y-g.player.y,true);g.swingSword();const row=t.W.times(g.player.weapon,g.player.combo);g.player.attack=t.W.duration(g.player.weapon,g.player.combo)-row[0]-row[1]-row[2]*.5;g.player.impactTick=true;g.damageEnemy(e,1);t.renderer.frame();return {target:g.targetId===e.id,blood:g.bloodFX.length,hitStop:g.player.hitPause,mask:[t.renderer.skyCv.width,t.renderer.skyCv.height]};});assert.ok(combat.target&&combat.blood>0&&combat.hitStop>0);await page.screenshot({path:path.join(out,'mobile-'+width+'-combat.png')});
  await page.evaluate(()=>{const t=lightCheck,g=t.game();g.enterDungeonFloor(t.F.design.depart.etage,t.F.at(t.F.design.depart.pos));g.player.attack=0;g.player.spawnFX=0;t.renderer.frame();});await page.screenshot({path:path.join(out,'mobile-'+width+'-depart.png')});
  results.push({width,combat});
  await page.close();
 }
 assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'verification.json'),JSON.stringify({source:'ios/Hearthreaver/Game/index.html',mobile:true,results,browserErrors:errors},null,2)+'\n');console.log('Both phone sizes: four floors, dynamic torch illumination, ambient contrast and viewport light masks passed.');
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
