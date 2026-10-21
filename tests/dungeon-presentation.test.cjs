'use strict';
const {test,before}=require('node:test'),assert=require('node:assert/strict');
const {loadGame,combatGame}=require('./game-harness.cjs');
let a;before(async()=>{a=await loadGame();});
function dungeon(){const g=combatGame(a);g.startFirstDungeon();g.player.spawnFX=0;g.enterDungeonFloor('grande-salle',{x:11.5*32,y:6.5*32});for(const e of g.enemies)e.dead=true;return g;}
test('dungeon contact uses the shared weapon hit stop and preserves queued input',()=>{
 const g=dungeon(),p=g.player;p.hitPause=.04;p.attack=.2;p.attackHeld=false;const time=g.time,attack=p.attack,elapsed=g.elapsed;
 g.update(.02,{attackPressed:true,x:1,y:0});assert.ok(p.bufferX>0&&Math.abs(p.bufferX+p.bufferY)<1e-8,'queued aim stays in logical coordinates');assert.equal(p.attack,attack);assert.equal(g.time,time);assert.equal(g.elapsed,elapsed);assert.ok(p.attackBuffer>0);assert.ok(Math.abs(p.hitPause-.02)<1e-8);
 g.update(.02,{});assert.equal(p.hitPause,0);assert.equal(p.attack,attack);
 g.update(.02,{});assert.ok(p.attack<attack);
});
test('dungeon hits retain weapon-dependent contact feedback and its decay',()=>{
 const g=dungeon(),p=g.player,e=g.enemies[0];Object.assign(e,{dead:false,hp:3});p.impactTick=true;p.attack=.2;p.combo=0;
 g.damageEnemy(e,1);assert.equal(p.hitPause,a.HearthreaverWeapons.hitPause(p.weapon,p.combo));assert.equal(g.weaponShake.swing,g.swing);const remaining=g.weaponShake.remaining;
 g.update(.01,{});assert.ok(g.weaponShake.remaining<remaining);assert.equal(e.hp,2);
});
test('dungeon applies the native collision-checked impact step once per stroke',()=>{
 const g=dungeon(),p=g.player;p.dir=1;p.combo=0;p.attack=a.HearthreaverWeapons.duration(p.weapon,0);p.attackStep=false;p.impactDone=false;p.hitPause=0;const x=p.x,y=p.y;
 for(let i=0;i<80&&!p.attackStep;i++)g.update(.01,{});
 assert.equal(p.attackStep,true);assert.ok(Math.hypot(p.x-x,p.y-y)>0);assert.equal(g.solid(p.x,p.y),false);const end=[p.x,p.y];
 for(let i=0;i<30;i++)g.update(.01,{});assert.deepEqual([p.x,p.y],end);
});
test('dungeon hits retain shared power, riposte, target acquisition, heavy hit events and blood',()=>{
 const g=dungeon(),p=g.player,e=g.enemies[0];Object.assign(e,{dead:false,hp:10,maxHp:10,stun:0,wind:0,attack:0});g.power=()=>2;p.riposte=1;p.combo=3;p.impactTick=true;p.attack=.2;g.events=[];
 g.damageEnemy(e,1);assert.equal(e.hp,6);assert.equal(p.riposte,0);assert.equal(g.targetId,e.id);assert.ok(g.bloodFX.length>0);assert.ok(g.events.some(v=>v.type==='hit'&&v.heavy));assert.ok(g.weaponShake);assert.ok(p.hitPause>0);
});
test('weapon loot remains on its dungeon floor, survives a save and uses the shared first-discovery pickup',()=>{
 const g=dungeon(),p=g.player,e=g.enemies[0];Object.assign(e,{dead:false,hp:1,stun:0,wind:0,attack:0,armament:'dague-kesh'});assert.ok(!g.arsenal.owned.includes(e.armament));
 g.damageEnemy(e,10);assert.equal(g.weaponDrops.length,1);const drop=g.weaponDrops[0];assert.equal(drop.weapon,'dague-kesh');
 const saved=g.serialize();assert.equal(saved.dungeon.floors['grande-salle'].weaponDrops[0].weapon,drop.weapon);
 const restored=combatGame(a);restored.startFirstDungeon(saved.dungeon);assert.equal(restored.weaponDrops[0].weapon,drop.weapon);assert.equal(restored.weaponDrops.length,1);
 g.enterDungeonFloor('galeries',{x:19.5*32,y:1.5*32});assert.equal(g.weaponDrops.length,0);g.enterDungeonFloor('grande-salle',{x:drop.x,y:drop.y});assert.equal(g.weaponDrops[0].weapon,drop.weapon);
 drop.delay=0;g.stepWeaponDrops(.04);assert.ok(g.arsenal.owned.includes(drop.weapon));assert.equal(g.weaponDrops.length,0);assert.ok(g.events.some(v=>v.type==='weaponfound'));
});
test('shared lethal damage keeps the first chief outcome local to the dungeon',()=>{
 const g=dungeon();g.enterDungeonFloor('trone',{x:11.5*32,y:6.8*32});const chief=g.enemies.find(e=>e.chief),kills=g.player.kills;g.damageEnemy(chief,chief.hp*10);
 assert.equal(chief.dead,true);assert.equal(chief.deathElapsed,0);assert.equal(g.dungeon.bossDead,true);assert.equal(g.dungeon.bossFight,false);assert.equal(g.player.kills,kills+1);assert.equal(g.player.hp,g.player.maxHp);assert.equal(g.won,false);assert.equal(g.story.templeFreed,false);
});
test('steering remains available at the shared attack movement speed while a target is locked',()=>{
 const g=dungeon(),p=g.player,e=g.enemies[0];Object.assign(e,{dead:false,x:p.x+15,y:p.y-15,cooldown:99});g.targetId=e.id;g.swingSword();p.hitPause=0;
 let moved=0;g.movePlayer=(actor,x,y)=>{moved+=Math.hypot(x,y);};g.update(.01,{x:1,y:0});assert.ok(p.attack>0);assert.ok(Math.abs(moved-.18)<1e-7);assert.equal(p.steer,true);
});
