'use strict';
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict'),{chromium}=require('playwright');
(async()=>{const root=path.resolve(__dirname,'..'),out=path.join(root,'art/goblin-tactics');fs.mkdirSync(out,{recursive:true});
 const source=fs.readFileSync(path.join(root,'ios/Hearthreaver/Game/index.html'),'utf8'),html=source.replace(/\}\)\(\);\s*<\/script>/,'globalThis.squadCheck={T:GoblinTactics,G:HearthreaverGoblins,renderer,BITMAPS,F:FirstDungeon,begin,studioIntro,game:()=>game};})();</script>');assert.notEqual(html,source);
 const server=http.createServer((q,r)=>{r.setHeader('Content-Type','text/html');r.end(html);}).listen(0,'127.0.0.1');await new Promise(r=>server.on('listening',r));const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']}),errors=[],results=[];
 try{for(const width of [844,568]){const page=await browser.newPage({viewport:{width,height:width===844?390:320},isMobile:true,hasTouch:true});page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:'+server.address().port,{waitUntil:'domcontentloaded',timeout:120000});await page.waitForFunction(()=>globalThis.squadCheck?.BITMAPS.ready&&squadCheck.F.art.ready,null,{timeout:120000});
 await page.evaluate(()=>{const t=squadCheck;t.studioIntro.skip();t.studioIntro.update(2);t.begin();t.game().update=()=>{};});await page.waitForFunction(()=>!document.getElementById('notices').textContent,null,{timeout:20000});
 const result=await page.evaluate(()=>{const t=squadCheck,g=t.game(),G=t.G;g.enterDungeonFloor('grande-salle',{x:368,y:208});g.player.spawnFX=0;g.player.inv=999;for(const e of g.enemies)e.dead=true;
 // Four native goblins in the authored hall, with real furniture, walls and body collisions.
 const positions=[[330,208],[348,174],[399,188],[395,236]];
 g.enemies=positions.map(([x,y],i)=>({...g.enemies[i%g.enemies.length],id:'squad-'+i,dead:false,x,y,hp:20,maxHp:20,stun:0,cooldown:0,swingElapsed:null,chief:false}));
 const original=g.update;delete g.update;const starts=[],contacts=[],angles=new Set();let maxAttacks=0,maxFrameMs=0,moving=0;
 for(let frame=0;frame<300;frame++){const before=g.enemies.map(e=>Number.isFinite(e.swingElapsed)),now=performance.now();g.update(.04,{});maxFrameMs=Math.max(maxFrameMs,performance.now()-now);
  let count=0;g.enemies.forEach((e,i)=>{const swing=Number.isFinite(e.swingElapsed);if(swing)count++;if(swing&&!before[i])starts.push({time:g.time,id:e.id,dir:e.swingDir});if(G.look(e).frame===2&&swing)contacts.push(e.id);if(e.moving)moving++;const angle=Math.atan2(e.y-g.player.y,e.x-g.player.x);angles.add(Math.round(angle/(Math.PI/2)));if(g.solid(e.x,e.y,e.r))throw Error('Goblin entered solid geometry');});maxAttacks=Math.max(maxAttacks,count);
  if(frame===55)t.renderer.frame();
 }
 g.update=original;g.targetId=g.enemies[0].id;t.renderer.frame();return {starts,contacts:contacts.length,sectors:angles.size,maxAttacks,moving,maxFrameMs};});
 assert.ok(result.starts.length>=4&&result.contacts>0&&result.moving>0&&result.sectors>=3,JSON.stringify(result));assert.ok(result.maxAttacks<=2);for(let i=1;i<result.starts.length;i++)assert.ok(result.starts[i].time-result.starts[i-1].time>=.155);await page.screenshot({path:path.join(out,'mobile-'+width+'-squad.png')});results.push({width,...result});await page.close();}
 assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'verification.json'),JSON.stringify({source:'ios/Hearthreaver/Game/index.html',mobile:true,results,browserErrors:errors},null,2)+'\n');console.log('Phone squad combat: native impact, staggered attacks, encirclement, real collisions and zero browser errors passed.');
 }finally{await browser.close();server.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
