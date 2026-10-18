'use strict';
const {test,before}=require('node:test'),assert=require('node:assert/strict'),{loadGame}=require('./game-harness.cjs'),Art=require('../sprites/batraciens/batraciens-combattants.js');
let api;before(async()=>api=await loadGame());
function fixture(t){if(!api.Game.prototype.isHumanGuard){t.skip('Requires PR #4 npc-combat.js; also run on the composed PR #4 validation checkout.');return null;}
 const g=new api.Game();g.clock=480;g.worldState=new api.Atlas.WorldState({clock:g.clock});g.lineClear=()=>true;g.solid=()=>false;g.inSafe=()=>null;g.safeZone=()=>false;g.populateAtlas=()=>{};g.brain=()=>({engage:true});Object.assign(g.player,{x:600,y:500,level:0,spawnFX:0,inv:0});
 const e=api.enemy('cultist',100,100,'incident-integration-0');Object.assign(e,{world:true,kind:'batracien',speed:0,r:6,level:0});e.batracien={sex:'male',palette:'original',role:'scout',action:'idle',elapsed:0,distance:0,cooldown:0,contactDone:false,lockedDir:1,comboIndex:0};
 const human={id:'incident-human-0',eventGuard:true,x:125,y:100,dir:3,level:0,alpha:1,post:{x:125,y:100}};g.npcs=[human];g.enemies=[e];g.ensureHumanGuard(human);return {g,e,human};
}
test('PR4: a hostile javelin hits a human patrol once, gives it the attacker and can kill it',t=>{
 const f=fixture(t);if(!f)return;const {g,e,human:n}=f;g.launchBatracienJavelin(e,n);g.batracienMissiles[0].vx=1000;const hp=n.guardState.hp;g.stepBatracienMissiles(.04);assert.equal(n.guardState.hp,hp-1);assert.equal(n.guardState.targetId,e.id);assert.equal(g.batracienMissiles.length,0);
 n.guardState.inv=0;n.guardState.hp=1;g.launchBatracienJavelin(e,n);g.batracienMissiles[0].vx=1000;g.stepBatracienMissiles(.04);assert.ok(n.guardState.dead);assert.ok(!g.npcs.includes(n));assert.ok(g.remains.some(r=>r.kind==='guard'));assert.equal(g.atlasDeaths[n.id],true);
});
test('PR4: every new melee animation damages human guards once and stays locked during its swing',t=>{
 const f=fixture(t);if(!f)return;const {g,e,human:n}=f;
 for(const role of ['village_guard','channel_sentinel','boat_escort','raider','captain','scout'])for(let index=0;index<Art.ATTACKS[role].length;index++){
  if(Art.ATTACKS[role][index]==='throw_javelin')continue;
  Object.assign(n,{x:120,y:100,stun:0});Object.assign(n.guardState,{hp:8,dead:false,inv:0});Object.assign(e,{x:100,y:100,stun:0,dead:false});Object.assign(e.batracien,{role,action:'idle',elapsed:0,cooldown:0,comboIndex:index,contactDone:false});g.stepBatracienEnemy(e,.04);
  assert.equal(e.batracien.action,Art.ATTACKS[role][index]);assert.equal(g.npcMoveLocked(e),true);const before={x:e.x,y:e.y};g.walkNpc(e,{x:80,y:80},.04);assert.equal(e.x,before.x);assert.equal(e.y,before.y);
  for(let i=0;i<21;i++)g.stepBatracienEnemy(e,.04);assert.equal(n.guardState.hp,7,role+'/'+index);
 }
});
test('PR4: warden javelins respect the enemy shield, rear opening and NPC retaliation without player XP',t=>{
 const f=fixture(t);if(!f)return;const {g,e}=f;const n={id:'warden-test',x:75,y:100,level:0,dir:1,batracien:{role:'scout',palette:'original',lockedDir:1,action:'idle',hp:6}};g.npcs=[n];e.dir=3;Object.assign(e.batracien,{role:'captain',action:'guard',guardRaise:0,guardHold:.72,blockCount:0});const hp=e.hp,xp=g.player.xp;
 g.launchBatracienJavelin(n,e);g.batracienMissiles[0].vx=1000;g.stepBatracienMissiles(.04);assert.equal(e.hp,hp);assert.equal(e.batracien.action,'block');
 e.dir=1;g.launchBatracienJavelin(n,e);g.batracienMissiles[0].vx=1000;g.stepBatracienMissiles(.04);assert.equal(e.hp,hp-1);assert.equal(e.foeId,n.id);assert.equal(g.player.xp,xp);
});
test('PR4: thrown javelins are stopped by terrain or another floor; player parry stuns the owner',t=>{
 const f=fixture(t);if(!f)return;const {g,e,human:n}=f;const hp=n.guardState.hp;
 for(const mode of ['wall','floor']){g.solid=()=>mode==='wall';n.level=mode==='floor'?1:0;g.launchBatracienJavelin(e,n);g.batracienMissiles[0].vx=1000;g.stepBatracienMissiles(.04);assert.equal(n.guardState.hp,hp);g.batracienMissiles=[];}g.solid=()=>false;g.npcs=[];
 Object.assign(g.player,{x:125,y:100,dir:3,guard:true,parry:.18,inv:0});g.launchBatracienJavelin(e,g.player);g.batracienMissiles[0].vx=1000;g.stepBatracienMissiles(.04);assert.ok(e.stun>0);assert.equal(g.targetId,e.id);assert.equal(g.batracienMissiles.length,0);g.stepBatracienEnemy(e,.04);assert.equal(e.batracien.action,'hit');
});
