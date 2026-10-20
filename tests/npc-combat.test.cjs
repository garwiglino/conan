const {test,before}=require('node:test'),assert=require('node:assert/strict');
const {loadGame}=require('./game-harness.cjs');let a;before(async()=>a=await loadGame());
function fixture(){const g=new a.Game();g.clock=480;g.worldState=new a.Atlas.WorldState({clock:g.clock});g.enemies=[];g.populateAtlas=()=>{};g.lineClear=()=>true;g.solid=()=>false;return g;}
function run(g,seconds,input={},each){for(let t=0;t<seconds;t+=.04){g.update(.04,input);if(each?.()===true)break;}}
// Kaldor stays at blade reach and keeps swinging until the target is down.
function chase(g,n,dead,seconds=20){const p=g.player;let t=0;for(;t<seconds&&!dead();t+=.04){const k=Math.atan2(n.y-p.y,n.x-p.x);if(Math.hypot(n.x-p.x,n.y-p.y)>14)Object.assign(p,{x:n.x-Math.cos(k)*14,y:n.y-Math.sin(k)*14});p.dir=g.direction(n.x-p.x,n.y-p.y);p.hp=p.maxHp||10;g.targetId=null;g.update(.04,{attack:true,attackPressed:true});}return t;}
function patrol(){const g=fixture(),ev=g.worldState.add('patrol','camp',g.clock,600),c=a.Atlas.toGame(ev.x,ev.y);Object.assign(g.player,{x:c.x+420,y:c.y,spawnFX:0,inv:0});g.stepEventGroups(0);
 const guards=g.npcs.filter(n=>g.isHumanGuard(n));assert.equal(guards.length,2);for(const n of guards)g.ensureHumanGuard(n);return {g,guards};}

test('a struck civilian runs away in plain sight, then dies when chased down',()=>{
 const g=fixture(),n=g.npcs.find(n=>n.id==='courier-0'),p=g.player;Object.assign(p,{x:n.x-14,y:n.y,dir:1,spawnFX:0});
 assert.equal(g.damageCivilian(n,1,p),true);assert.equal(n.dangerState.mode,'fleeing');
 let far=0,low=1;run(g,4,{},()=>{far=Math.max(far,Math.hypot(n.x-p.x,n.y-p.y));low=Math.min(low,n.alpha??1);});
 assert.ok(far>150,'flees well away from Kaldor: '+far);assert.equal(low,1);assert.notEqual(n.dangerState?.mode,'sheltered');
 const save=JSON.parse(JSON.stringify(g.serialize())).atlas.danger.civilians.find(r=>r.id===n.id);if(save)assert.notEqual(save.mode,'fleeing');
 chase(g,n,()=>n.civilian.dead);assert.equal(n.civilian.dead,true);assert.equal(n.civilian.action,'death');assert.ok(g.npcs.includes(n));
});

test('essential people flee and keep one health point; witnesses run too',()=>{
 const g=fixture(),n=g.npcs.find(n=>n.id==='veilleur'),p=g.player;Object.assign(p,{x:n.x-14,y:n.y,dir:1,spawnFX:0});
 const near=g.npcs.filter(v=>v!==n&&v.civilian&&!g.civilianProtected(v)&&Math.hypot(v.x-n.x,v.y-n.y)<150);
 g.damageCivilian(n,1,p);assert.equal(n.dangerState.mode,'fleeing');for(const v of near)assert.equal(v.dangerState?.mode,'fleeing',v.id);
 chase(g,n,()=>false,6);assert.equal(n.civilian.dead,false);assert.equal(n.civilian.hp,1);assert.equal(n.alpha??1,1);
});

test('a struck frog villager hops away instead of cowering on the spot, and can be killed',()=>{
 const g=fixture(),n=g.npcs.find(n=>n.batracien&&!n.batracien.role),p=g.player;Object.assign(p,{x:n.x-14,y:n.y,dir:1,spawnFX:0});
 g.damageCivilian(n,1,p);let far=0;run(g,3,{},()=>{far=Math.max(far,Math.hypot(n.x-p.x,n.y-p.y));});
 assert.ok(far>80,'frog flees: '+far);assert.equal(n.alpha??1,1);assert.notEqual(n.batracien.action,'cower');
 chase(g,n,()=>n.civilian.dead);assert.equal(n.civilian.dead,true);assert.equal(n.batracien.action,'death');
});

test('without a house to hide in, a threatened civilian cowers visibly instead of vanishing',()=>{
 const g=fixture(),n=g.stations.find(s=>s.site==='camp').actor;Object.assign(g.player,{x:n.x,y:n.y+60});
 g.worldState.add('siege','camp',g.clock,100);g.assessCivilians(true);assert.equal(n.dangerState.shelter.cover,false);
 for(let i=0;i<80;i++){g.time+=.04;g.stepNpcs(.04);}assert.equal(n.dangerState.mode,'leaving');assert.equal(n.alpha,1);
 g.player.x+=2000;g.time+=.04;g.stepNpcs(.04);assert.equal(n.dangerState.mode,'leaving');assert.equal(n.alpha,1);
});

test('patrol guards bleed, turn on an attacker together, hit back and leave a body that never respawns',()=>{
 const {g,guards:[n,m]}=patrol(),p=g.player;Object.assign(p,{x:n.x-14,y:n.y,dir:1});
 assert.equal(g.npcPresent(n),true);g.damageEnemy(n,1);assert.equal(g.isHostileHumanGuard(n),false);g.damageEnemy(n,1);
 assert.ok(n.guardState.hp<n.guardState.maxHp);assert.equal(g.isHostileHumanGuard(n),true);assert.equal(g.isHostileHumanGuard(m),true);
 assert.equal(g.npcPresent(n),false);assert.ok(g.combatTargets().includes(n));
 let hurt=false;const t=chase(g,n,()=>n.guardState.dead);const hp=p.hp;
 assert.equal(n.guardState.dead,true,'guard dies after '+t);assert.equal(g.npcs.includes(n),false);assert.equal(g.atlasDeaths[n.id],true);
 assert.ok(g.remains.some(r=>r.kind==='guard'));g.time+=2;g.stepEventGroups(0);assert.equal(g.npcs.some(v=>v.id===n.id),false);
 Object.assign(p,{x:m.x-20,y:m.y,hp:10,inv:0});run(g,4,{},()=>{if(p.hp<10)hurt=true;return hurt;});assert.ok(hurt,'the angry guard strikes Kaldor');
});

test('monsters answer the patrol guards and frog wardens that engage them',()=>{
 for(const kind of ['snake','guardian']){
  const {g,guards:[n]}=patrol(),e=a.enemy(kind,n.x+30,n.y,'wild-'+kind);e.world=true;g.enemies.push(e);Object.assign(g.player,{x:n.x+380,y:n.y});const php=g.player.hp,ehp=e.hp;
  run(g,20,{},()=>e.dead||n.guardState.dead);assert.ok(e.hp<ehp,kind+' is hurt by the guard');assert.ok(n.guardState.hp<n.guardState.maxHp,kind+' hurts the guard');assert.equal(g.player.hp,php);
 }
 const g=fixture(),w=g.npcs.find(n=>n.batracien?.role==='village_guard'),e=a.enemy('skeleton',w.x+30,w.y,'wild-bones');e.world=true;g.enemies.push(e);Object.assign(g.player,{x:w.x+380,y:w.y,spawnFX:0});const hp=w.batracien.hp;
 run(g,20,{},()=>e.dead||w.batracien.dead);assert.equal(e.foeId,w.id);assert.ok(w.batracien.hp<hp,'the skeleton hurts the frog warden');
});

test('a fallen frog warden stays in its death pose',()=>{
 const g=fixture(),n=g.npcs.find(n=>n.batracien?.role==='village_guard'),p=g.player;Object.assign(p,{x:n.x-14,y:n.y,dir:1,spawnFX:0});
 chase(g,n,()=>n.batracien.dead);assert.equal(n.batracien.dead,true);const seen=new Set();run(g,2,{},()=>{seen.add(n.batracien.action);});
 assert.deepEqual([...seen],['death']);assert.equal(g.atlasDeaths[n.id],true);
});
