'use strict';
const {test,before}=require('node:test'),assert=require('node:assert/strict'),{loadGame,combatGame}=require('./game-harness.cjs'),P=require('../scripts/world-projection.js');let a;before(async()=>a=await loadGame());
function arena(n=4){const g=combatGame(a);g.startFirstDungeon();g.enterDungeonFloor('grande-salle',{x:368,y:208});g.player.spawnFX=0;g.time=1;g.enemies=Array.from({length:n},(_,i)=>({id:'test-'+i,kind:'goblin',skin:'guerrier-kesh',x:310-i*10,y:185+i*14,r:6,hp:99,maxHp:99,cooldown:0,stun:0,dir:1}));g.solid=()=>false;g.lineClear=()=>true;return g;}
test('squad separates approach and attack space, keeps two attack tokens and staggers starts',()=>{const g=arena(),T=a.GoblinTactics;let p=T.plan(g,.04);const slots=g.enemies.map(e=>p.s.actors.get(e).slot);assert.equal(new Set(slots).size,4);
 for(const e of g.enemies){const m=p.s.actors.get(e),v=P.inverse(Math.cos(m.angle),Math.sin(m.angle)),n=Math.hypot(v.x,v.y);Object.assign(e,{x:g.player.x+v.x/n*46,y:g.player.y+v.y/n*46});}p=T.plan(g,.04);assert.equal(p.pressing.size,2);const e=[...p.pressing][0];assert.ok(T.canStrike(g,e,p));T.reserve(p,e);assert.equal(T.canStrike(g,e,p),false);g.time+=.29;let q=T.plan(g,.04);assert.deepEqual(g.enemies.map(e=>q.s.actors.get(e).slot),slots);for(const e of q.pressing)e.swingElapsed=0;q=T.plan(g,.04);assert.equal(q.pressing.size,2);assert.ok([...q.pressing].every(e=>!T.canStrike(g,e,q)));const dead=[...q.pressing][0];dead.dead=true;q=T.plan(g,.04);const next=[...q.pressing].find(e=>!Number.isFinite(e.swingElapsed));assert.ok(next&&T.canStrike(g,next,q));});
test('alerts respect walls, retain only last known position and expire; sleeping boss stays inactive',()=>{const g=arena(3),T=a.GoblinTactics;g.enemies[2].chief=true;g.dungeon.bossFight=false;g.lineClear=(x,y)=>x===g.enemies[0]&&y===g.player;let p=T.plan(g,.04);assert.deepEqual(Array.from(p.active,e=>e.id),['test-0']);const last={...T.goal(g,g.enemies[0],p)};g.lineClear=()=>false;g.player.x+=40;g.time+=.1;p=T.plan(g,.04);assert.equal(T.goal(g,g.enemies[0],p).x,last.x);assert.equal(T.canStrike(g,g.enemies[0],p),false);g.time+=3;p=T.plan(g,.04);assert.equal(p.active.length,0);T.reset(g);assert.equal(T.plan(g,.04).active.length,0);});
test('bounded path detours around a wall without cutting through it',()=>{
 const T=a.GoblinTactics,e={id:'path-fixture',x:300,y:200,r:6,cooldown:0,stun:0},g={player:{x:380,y:200},enemies:[e],dungeon:{floor:'path-fixture'},time:1,lineClear:()=>true,direction:()=>1};
 g.solid=(x,y,r=6)=>Math.abs(x-340)<r+3&&y>150;
 g.move=(actor,x,y)=>{assert.ok(!g.solid(actor.x+x,actor.y+y,actor.r),JSON.stringify({x:actor.x,y:actor.y,mx:x,my:y}));actor.x+=x;actor.y+=y;};
 let wentAround=false;for(let i=0;i<300;i++){g.time+=.04;const p=T.plan(g,.04);T.move(g,e,T.goal(g,e,p),p,.04);wentAround||=e.y<145;}assert.ok(wentAround,'follows a collision-checked detour rather than pushing the wall');assert.ok(e.x>340);
});

test('approaching a waiting goblin transfers approach priority without cancelling committed attacks',()=>{
 const g=arena(4),T=a.GoblinTactics;let plan=T.plan(g,.02);
 // Establish two distant approach holders and engage another goblin locally.
 const distant=g.enemies.slice(0,2),local=g.enemies[2];plan.s.engagers=new Set(distant);
 for(const e of distant){Object.assign(e,{x:g.player.x-60,y:g.player.y});const m=plan.s.actors.get(e);m.engageUntil=g.time+2;m.retreatUntil=0;}
 Object.assign(local,{x:g.player.x+19,y:g.player.y,cooldown:0});
 plan=T.plan(g,.02);assert.ok(plan.pressing.has(local));assert.equal(plan.pressing.size,2);assert.ok(T.canStrike(g,local,plan));
 // With two native swings already committed, the threatened third actor moves.
 for(const e of distant){e.swingElapsed=.1;e.swingDir=1;}
 local.x=g.player.x+19;local.y=g.player.y;plan=T.plan(g,.02);
 assert.ok(!plan.pressing.has(local));assert.ok(!T.canStrike(g,local,plan));
 const goal=T.goal(g,local,plan),before={x:local.x,y:local.y};
 g.move=(e,x,y)=>{e.x+=x;e.y+=y;};T.move(g,local,goal,plan,.04);
 assert.ok(Math.hypot(local.x-before.x,local.y-before.y)>.1,'locally threatened actor evades instead of waiting still');
 assert.ok(Math.abs(local.y-before.y)>.01,'evade includes a lateral step');
 assert.ok(distant.every(e=>e.swingElapsed===.1),'no committed strike is cancelled');
});

test('a wounded goblin keeps its full hurt reaction, then prioritizes retaliation',()=>{
 const g=arena(3),T=a.GoblinTactics,e=g.enemies[2];let plan=T.plan(g,.02);Object.assign(e,{x:g.player.x+20,y:g.player.y,stun:.2});
 T.provoke(g,e);plan=T.plan(g,.02);assert.equal(e.stun,.2);assert.ok(!T.canStrike(g,e,plan));
 e.stun=0;g.time+=.21;plan=T.plan(g,.02);assert.ok(plan.pressing.has(e));assert.ok(T.canStrike(g,e,plan));
 g.lineClear=()=>false;plan=T.plan(g,.02);assert.ok(!T.canStrike(g,e,plan),'provocation never grants sight through walls');
});

test('a side-on local engagement finds a real contact position without overlapping bodies',()=>{
 const g=arena(1),T=a.GoblinTactics,e=g.enemies[0],p=g.player;
 Object.assign(e,{x:p.x+19,y:p.y,cooldown:0,armed:true});g.player.inv=999;
 // Restore real movement and crowd collision; retain only the open geometry.
 delete g.move;let ticks=0;while(!Number.isFinite(e.swingElapsed)&&ticks++<60)g.update(.02,{});
 assert.ok(Number.isFinite(e.swingElapsed),'local reaction leads to a real swing');
 assert.ok(ticks*.02<=1.2,'does not wait for a formation turn');
 const se=g.bodySize(e),sp=g.bodySize(p);assert.ok(((e.x-p.x)/(se[0]+sp[0]))**2+((e.y-p.y)/(se[1]+sp[1]))**2>=.99,'native body ellipses stay separate');
 assert.ok(a.HearthreaverGoblins.hits(e,p),'authored impact actually reaches the player');
});
