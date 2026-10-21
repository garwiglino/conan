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
