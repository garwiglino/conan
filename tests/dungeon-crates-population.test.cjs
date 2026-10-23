'use strict';
const {test,before}=require('node:test'),assert=require('node:assert/strict'),{loadGame,combatGame}=require('./game-harness.cjs'),P=require('../scripts/world-projection.js');let a;before(async()=>a=await loadGame());
function game(){const g=combatGame(a);g.startFirstDungeon();g.player.spawnFX=0;return g;}
function arena(){const g=game();g.enterDungeonFloor('grande-salle',{x:368,y:208});for(const e of g.enemies)e.dead=true;g.player.spawnFX=0;return g;}
test('33 ordinary goblins plus the chief have valid spaced spawns, with a clear opening and boss-room reinforcements gated',()=>{
 const g=game(),counts={geoles:6,'grande-salle':12,galeries:11,trone:5};let total=0;
 for(const [id,n]of Object.entries(counts)){g.enterDungeonFloor(id,{x:368,y:208});assert.equal(g.enemies.length,n);total+=n;for(const e of g.enemies){assert.equal(g.solid(e.x,e.y,e.r),false,id+': '+e.id+' spawns in geometry');for(const other of g.enemies)if(other!==e)assert.ok(Math.hypot(e.x-other.x,e.y-other.y)>=17);}}
 assert.equal(total,34);const guards=g.enemies.filter(e=>e.bossGuard);assert.equal(guards.length,2);g.dungeon.bossFight=false;const plan=a.GoblinTactics.plan(g,.04);assert.ok(guards.every(e=>!plan.active.includes(e)));const start=a.FirstDungeon.design.depart.pos;assert.ok(g.dungeon.floors.geoles.enemies.every(e=>Math.hypot(e.x-start[0]*32,e.y-start[1]*32)>100));
});
test('old saves receive missing reinforcements once while casualties, keys and puzzle positions remain intact',()=>{
 const g=game(),saved=g.serialize().dungeon,old={geoles:3,'grande-salle':8,galeries:7,trone:2};for(const [id,n]of Object.entries(old))saved.floors[id].enemies=saved.floors[id].enemies.filter((e,i)=>i<n||e.chief);saved.floors.geoles.enemies[0].dead=true;saved.floors.geoles.enemies[0].hp=0;saved.keys=['serpent'];saved.floors['grande-salle'].crates[0].x=450;
 const r=combatGame(a);r.startFirstDungeon(saved);assert.equal(r.dungeon.floors.geoles.enemies.length,6);assert.equal(r.dungeon.floors.geoles.enemies[0].dead,true);assert.equal(r.dungeon.keys[0],'serpent');assert.equal(r.dungeon.floors['grande-salle'].crates[0].x,450);const next=combatGame(a);next.startFirstDungeon(r.serialize().dungeon);assert.equal(next.dungeon.floors.geoles.enemies.length,6);assert.equal(next.dungeon.floors.geoles.enemies[0].hp,0);
});
test('grabbing never teleports; continuous joystick traction keeps the player facing the crate and their separation intact on all four sides',()=>{
 const g=arena(),b=g.dungeon.floors['grande-salle'].crates[1],p=g.player;
 for(const [x,y]of [[1,0],[-1,0],[0,1],[0,-1]]){Object.assign(b,{x:368,y:208});Object.assign(p,{x:b.x+x*18,y:b.y+y*18,attack:0,hurt:0,dash:0,spawnFX:0});g.dungeonGrip=null;const start=[p.x,p.y,b.x,b.y];g.interact();assert.ok(g.dungeonGrip);assert.deepEqual([p.x,p.y,b.x,b.y],start);const input=P.point(x,y);let old={x:b.x,y:b.y};
  for(let i=0;i<16;i++){g.update(.02,input);const step=P.distance(b.x-old.x,b.y-old.y);assert.ok(step>0&&step<=.481,'bounded per-frame traction');assert.ok(Math.abs(p.x-b.x-x*18)<1e-6&&Math.abs(p.y-b.y-y*18)<1e-6);assert.equal(p.dir,g.direction(-x,-y));old={x:b.x,y:b.y};}assert.ok(P.distance(b.x-368,b.y-208)>7);assert.match(g.context().text,/LÂCHER/);g.interact();assert.equal(g.dungeonGrip,null);
 }
});
test('a held crate stops at real walls, preserves plates, saves exact positions and releases for combat and floor changes',()=>{
 const g=arena(),b=g.dungeon.floors['grande-salle'].crates[1],p=g.player;Object.assign(b,{x:496,y:80});Object.assign(p,{x:496,y:98});g.interact();assert.ok(g.dungeonGrip);for(let i=0;i<100;i++)g.movePlayer(p,0,-.8);assert.ok(!a.FirstDungeon.geometry(g,b.x,b.y,8,b));assert.ok(b.y>=73&&b.y<80);assert.ok(Math.abs(p.y-b.y-18)<1e-6);
 const saved=g.serialize(),r=combatGame(a);r.startFirstDungeon(saved.dungeon);assert.equal(r.dungeonGrip,null);assert.equal(r.dungeon.floors['grande-salle'].crates[1].y,b.y);
 g.update(.04,{attackPressed:true});assert.equal(g.dungeonGrip,null);assert.ok(p.attack>0);p.attack=0;p.attackCD=0;p.hitPause=0;g.interact();assert.ok(g.dungeonGrip);g.enterDungeonFloor('galeries',{x:624,y:48});assert.equal(g.dungeonGrip,null);
 g.enterDungeonFloor('grande-salle',{x:496,y:194});Object.assign(b,{x:496,y:176});const s=g.dungeon.floors['grande-salle'];Object.assign(s.crates[0],{x:496,y:240});g.updateDungeonPlates();assert.ok(s.open.includes('16,3,O'));g.player.hurt=0;g.interact();assert.ok(g.dungeonGrip);g.movePlayer(p,0,12);assert.equal(s.open.includes('16,3,O'),false,'plate gate follows the continuous position');
});

test('neither crate nor player passes through a living goblin during traction',()=>{
 const g=arena(),b=g.dungeon.floors['grande-salle'].crates[1],p=g.player,e=g.enemies[0];Object.assign(b,{x:368,y:208});Object.assign(p,{x:350,y:208});Object.assign(e,{dead:false,x:393,y:208,stun:99,cooldown:99});g.interact();assert.ok(g.dungeonGrip);for(let i=0;i<60;i++)g.movePlayer(p,.8,0);assert.ok(b.x<=378.01);assert.ok(e.x-b.x>=15);assert.ok(Math.abs(b.x-p.x-18)<1e-6);
});

test('throne guards keep fighting after the chief falls, while a migrated cleared boss room gains no living reinforcements',()=>{
 const g=game();g.enterDungeonFloor('trone',{x:350,y:220});g.player.spawnFX=0;g.dungeon.bossFight=false;g.dungeon.bossDead=true;g.lineClear=()=>true;const guard=g.enemies.find(e=>e.bossGuard);assert.ok(a.GoblinTactics.plan(g,.04).active.includes(guard));
 const saved=g.serialize().dungeon;saved.floors.trone.enemies=saved.floors.trone.enemies.filter(e=>!e.bossGuard);const r=combatGame(a);r.startFirstDungeon(saved);assert.ok(r.enemies.filter(e=>e.bossGuard).every(e=>e.dead&&e.hp===0));
});

test('walking or combat movement cannot push a crate before grabbing or after releasing',()=>{
 const g=arena(),b=g.dungeon.floors['grande-salle'].crates[1],p=g.player;Object.assign(b,{x:368,y:208});Object.assign(p,{x:350,y:208});
 for(let i=0;i<30;i++)g.movePlayer(p,2,0);assert.equal(b.x,368);assert.equal(b.y,208);assert.ok(p.x<=354);
 g.interact();assert.ok(g.dungeonGrip);g.movePlayer(p,4,0);assert.ok(Math.abs(P.distance(b.x-368,b.y-208)-4)<1e-6);const releasedX=b.x;g.interact();assert.equal(g.dungeonGrip,null);
 for(let i=0;i<30;i++)g.movePlayer(p,2,0);assert.equal(b.x,releasedX);
});
test('one grip permits changing freely through all eight joystick directions at the same bounded speed',()=>{
 const g=arena(),b=g.dungeon.floors['grande-salle'].crates[1],p=g.player;Object.assign(b,{x:368,y:208});Object.assign(p,{x:350,y:208});g.interact();const grip=g.dungeonGrip;
 for(const [x,y]of [[1,0],[1,1],[0,1],[-1,1],[-1,0],[-1,-1],[0,-1],[1,-1]]){const ox=b.x,oy=b.y;const input=P.point(x,y),length=Math.hypot(input.x,input.y);input.x/=length;input.y/=length;for(let i=0;i<8;i++)g.update(.02,input);
  assert.equal(g.dungeonGrip,grip);const shown=P.point(b.x-ox,b.y-oy);assert.ok(Math.abs(shown.x-input.x*3.84)<1e-6);assert.ok(Math.abs(shown.y-input.y*3.84)<1e-6);assert.ok(Math.abs(p.x-b.x+18)<1e-6);assert.ok(Math.abs(p.y-b.y)<1e-6);
 }
});
