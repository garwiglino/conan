const {test,before}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {loadGame,canvas,root,html}=require('./game-harness.cjs');
let api;before(async()=>{api=await loadGame();});
function fixture(){const g=new api.Game(),e=g.enemies.find(e=>e.kind==='boss'),p=g.player;
 Object.assign(e,{x:400,y:110,dir:2,appearAt:-9});Object.assign(p,{x:400,y:140,spawnFX:0,level:0,guard:false,inv:0});
 g.bossActive=true;g.gate=true;g.time=10;g.dialogue=null;g.enemies=[e];g.events=[];return {g,e,p};}
function tick(g,e,seconds){for(let t=0;t<seconds-1e-8;){const dt=Math.min(.01,seconds-t);g.time+=dt;g.bossStep(e,dt);t+=dt;}}
test('all 1,280 game frames exactly match the two Aseprite sheets, with all clip boundaries',()=>{
 const meta=JSON.parse(fs.readFileSync(path.join(root,'sprites/personnages/pretre/animations.json')));
 let count=0;for(const c of meta.clips){const clip=api.bossClip(c.phase,c.direction,c.state),cv=canvas.createCanvas(80,80),ctx=cv.getContext('2d');let ms=0;
  c.durationsMs.forEach((duration,i)=>{
   assert.equal(api.bossFrame(clip,ms/1000),i,c.name+' boundary '+i);
   assert.equal(api.bossFrame(clip,(ms+duration-1)/1000),i);
   ctx.clearRect(0,0,80,80);ctx.drawImage(api.BITMAPS['boss'+c.phase],i*80,c.sheetRow*80,80,80,0,0,80,80);
   const actual=api.BITMAPS.get('boss',c.direction,c.state,i,false,c.phase);
   assert.deepEqual(Buffer.from(actual.getContext('2d').getImageData(0,0,80,80).data),Buffer.from(ctx.getImageData(0,0,80,80).data));
   count++;ms+=duration;
  });assert.equal(api.bossFrame(clip,ms/1000),c.loop?0:c.durationsMs.length-1);
 }assert.equal(count,1280);assert.ok(api.BITMAPS.cache.size<=256);
});
test('slash connects at 550 ms, locks its direction, recovers fully and chains the authored followup',()=>{
 const {g,e,p}=fixture();g.move=()=>{};let hits=0;g.damagePlayer=()=>{hits++;};
 for(let dir=0;dir<4;dir++){
  const [dx,dy]=g.facing(dir);Object.assign(e,{dir,rage:false});Object.assign(p,{x:e.x+dx*25,y:e.y+dy*25});api.bossPlay(e,'slash');
  const start=hits;tick(g,e,.549);assert.equal(hits,start);tick(g,e,.001);assert.equal(hits,start+1);
  p.x=e.x-dx*25;p.y=e.y-dy*25;tick(g,e,.3);assert.equal(e.dir,dir);assert.equal(hits,start+1);
  tick(g,e,.57);assert.equal(e.motion,null);
 }
 e.rage=true;e.dir=2;p.x=e.x;p.y=e.y+25;api.bossPlay(e,'slash');tick(g,e,1.42);
 assert.equal(e.motion,'followup');const start=hits;tick(g,e,.669);assert.equal(hits,start);tick(g,e,.001);assert.equal(hits,start+1);
 tick(g,e,.87);assert.equal(e.motion,null);
});
test('fan releases three real jade shots from the support palm in four directions and both phases',()=>{
 const {g,e,p}=fixture();for(let phase=0;phase<2;phase++)for(let dir=0;dir<4;dir++){
  Object.assign(e,{dir,rage:!!phase,aimX:p.x,aimY:p.y});g.shots=[];api.bossPlay(e,'fan');tick(g,e,.799);assert.equal(g.shots.length,0);
  tick(g,e,.001);assert.equal(g.shots.length,3);const hand=api.bossClip(phase,dir,'fan').palm[5];
  for(const s of g.shots){assert.equal(s.x,e.x+hand[0]-40);assert.equal(s.y-s.z,e.y+hand[1]-52);assert.ok(s.jade);assert.equal(s.phase,phase);}
  tick(g,e,.5);assert.equal(g.shots.length,3);
 }
});
test('spell damage follows the visible ring and each staggered pillar, and cancels when interrupted',()=>{
 const {g,e,p}=fixture();let hits=0;g.damagePlayer=()=>{hits++;};g.lineClear=()=>true;
 e.dir=2;api.bossPlay(e,'nova');tick(g,e,.85);assert.equal(g.hazards.length,1);const h=g.hazards[0];
 p.x=e.x+35;p.y=e.y;api.stepBossHazard(g,h);assert.equal(h.r,25);assert.equal(hits,0);
 tick(g,e,.05);api.stepBossHazard(g,h);assert.equal(h.r,39);assert.equal(hits,1);
 h.hit=false;p.x=e.x;p.y=e.y+20;api.stepBossHazard(g,h);assert.equal(hits,1,'outside the narrow ground ellipse');
 for(let dir=0;dir<4;dir++){
  e.dir=dir;g.hazards=[];api.bossPlay(e,'eruption');tick(g,e,.65);assert.equal(g.hazards.length,3);const [vx,vy]=g.facing(dir);
  g.hazards.forEach((haz,i)=>{assert.equal(haz.x,e.x+vx*(24+i*14)-vy*[-5,5,0][i]);assert.equal(haz.y,e.y+vy*(24+i*14)*.85+vx*[-5,5,0][i]*.65);api.stepBossHazard(g,haz);assert.equal(haz.active,i===0);});
  tick(g,e,.05);g.hazards.forEach(h=>api.stepBossHazard(g,h));assert.equal(g.hazards[1].active,true);assert.equal(g.hazards[2].active,false);
  tick(g,e,.06);g.hazards.forEach(h=>api.stepBossHazard(g,h));assert.equal(g.hazards[2].active,true);
  e.stun=1;g.hazards.forEach(h=>api.stepBossHazard(g,h));assert.ok(g.hazards.every(h=>h.life===0));e.stun=0;
 }
});
test('parry, transformation, planted guard and respawn cannot resume a canceled attack',()=>{
 const {g,e,p}=fixture();api.bossPlay(e,'slash');p.dir=0;p.guard=true;p.parry=.1;
 tick(g,e,.55);assert.equal(e.motion,'stun');assert.equal(e.stun,1.5);assert.equal(e.wind,0);
 e.stun=0;g.bossStep(e,.01);assert.equal(e.motion,'recover');tick(g,e,.9);assert.equal(e.motion,null);
 api.bossPlay(e,'guard');const x=e.x,y=e.y;tick(g,e,.5);assert.equal(e.x,x);assert.equal(e.y,y);
 g.shots=[{}];g.hazards=[{}];g.bossTransform(e);assert.equal(e.motion,'transform');assert.equal(api.bossVisual(e,g.time).phase,0);assert.equal(g.shots.length,0);assert.equal(g.hazards.length,0);
 g.dialogue=null;tick(g,e,1.15);assert.equal(e.motion,null);assert.equal(api.bossVisual(e,g.time).phase,1);
 g.respawn();assert.equal(e.motion,null);assert.equal(e.rage,false);assert.equal(g.bossActive,false);
});
test('victory waits for the full death animation, blocks attacks, and emits once',()=>{
 const {g,e,p}=fixture();e.armor=1;g.damageEnemy(e,1000);assert.ok(e.dead&&g.won);assert.equal(g.events.filter(e=>e.type==='win').length,0);
 assert.equal(g.hazards.length,0);assert.equal(g.shots.length,0);const rem=g.remains.find(r=>r.kind==='boss');assert.ok(rem);
 const hp=p.hp;g.damagePlayer(10,e);assert.equal(p.hp,hp);const kills=p.kills;g.damageEnemy(e,1000);assert.equal(p.kills,kills);
 for(let i=0;i<189;i++)g.updateEffects(.01);assert.equal(g.events.filter(e=>e.type==='win').length,0);
 g.updateEffects(.01);assert.equal(g.events.filter(e=>e.type==='win').length,1);g.updateEffects(2);assert.equal(g.events.filter(e=>e.type==='win').length,1);assert.equal(rem.age,1.9);
 assert.equal(api.bossFrame(api.bossClip(0,2,'death'),10),13);
 const restored=new api.Game();restored.restore(g.serialize());assert.ok(restored.won);assert.ok(restored.enemies.find(e=>e.kind==='boss').dead);
});
test('the actual game loop completes multiple patterns without stale casts or invalid positions',()=>{
 const {g,e,p}=fixture();p.inv=1000;g.dialogue=null;g.arena=1;g.arenaLock=true;g.seals=[true,true,true];
 const seen=new Set();for(let i=0;i<1800;i++){
  p.x=400+Math.sin(i/100)*55;p.y=145+Math.cos(i/150)*20;
  if(i===900){e.hp=e.maxHp*.45;g.bossTransform(e);g.dialogue=null;}
  g.update(1/60,{});seen.add(e.motion);assert.ok(Number.isFinite(e.x)&&Number.isFinite(e.y));assert.equal(e.dir>=0&&e.dir<4,true);
 }
 assert.ok(seen.has('slash'));assert.ok(seen.has('charge'));assert.ok(seen.has('transform'));assert.ok(seen.has('guard'));assert.ok(!e.dead);
});
test('iOS receives the complete self-contained boss pack and the existing save format',()=>{
 const dir=path.join(root,'sprites/personnages/pretre');
 for(const [i,f] of ['pretre-rituel.png','pretre-enrage.png'].entries())assert.deepEqual(Buffer.from(api.BOSS_ART.sheets[i].png.split(',')[1],'base64'),fs.readFileSync(path.join(dir,f)));
 for(const [k,f] of [['rear','sortileges-arriere.png'],['front','sortileges-avant.png'],['bolt','projectiles.png']])assert.deepEqual(Buffer.from(api.BOSS_ART[k].split(',')[1],'base64'),fs.readFileSync(path.join(dir,f)));
 const ios=fs.readFileSync(path.join(root,'ios/Conan/Game/index.html'),'utf8');assert.equal(ios.slice(ios.indexOf('<script>')),html.slice(html.indexOf('<script>')));assert.ok(html.includes('conan-serpent-v1'));assert.ok(html.trimEnd().endsWith('</html>'));
});
