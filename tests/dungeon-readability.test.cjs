'use strict';
const {test,before}=require('node:test'),assert=require('node:assert/strict'),{loadGame,combatGame,canvas}=require('./game-harness.cjs');let a;before(async()=>{a=await loadGame();await a.FirstDungeon.art.promise;});
function arena(){const g=combatGame(a);g.startFirstDungeon();g.player.spawnFX=0;g.enterDungeonFloor('grande-salle',{x:368,y:208});for(const e of g.enemies)e.dead=true;g.events=[];return g;}
test('occlusion requires a foreground sprite with actual opaque pixels over the torso, never its transparent margin or a low border',()=>{
 const O=a.DungeonOcclusion,p={x:100,y:100},it={edge:[3,3,'N'],ref:[100,100],key:9,sub:400},piece={w:60,h:60,anchor:[30,40]},im=canvas.createCanvas(60,60),c=im.getContext('2d');c.fillStyle='#fff';c.fillRect(24,10,12,24);
 assert.equal(O.covered(it,piece,im,p),true);assert.equal(O.covered({...it,key:5},piece,im,p),false);assert.equal(O.covered({...it,edge:null},piece,im,p),false);assert.equal(O.covered({...it,ref:[150,100]},piece,im,p),false);
 const border=canvas.createCanvas(60,60);border.getContext('2d').fillRect(0,36,60,20);assert.equal(O.covered(it,piece,border,p),false);
 const gap=canvas.createCanvas(60,60);gap.getContext('2d').fillRect(0,0,8,60);assert.equal(O.covered(it,piece,gap,p),false);
 const r={g:{dungeon:{floor:'test'}},dungeonOcclusion:[],dungeonOcclusionDt:.04};for(let i=0;i<15;i++)O.alpha(r,it,piece,im,p);assert.ok(r.dungeonWallAlpha.values().next().value>=.42);for(let i=0;i<20;i++)O.alpha(r,it,piece,im,{x:300,y:300});assert.equal(r.dungeonWallAlpha.size,0);
});
test('goblin detection speaks once without a dialogue or gameplay pause; walls, death and repeated visible ticks do not spam',()=>{
 const g=arena(),T=a.GoblinTactics,e=g.enemies[0];Object.assign(e,{dead:false,x:g.player.x-30,y:g.player.y,stun:0,cooldown:0});g.lineClear=()=>false;T.plan(g,.04);assert.equal(T.speech(g).length,0);g.lineClear=()=>true;T.plan(g,.04);assert.equal(T.speech(g).length,1);assert.equal(g.dialogue,null);const start=T.speech(g)[0].start;
 for(let i=0;i<80;i++){g.time+=.04;T.plan(g,.04);}assert.equal(T.speech(g).length,0);assert.equal(g.dialogue,null);assert.ok(g.time>start+2);T.reset(g);T.plan(g,.04);assert.equal(T.speech(g).length,1);e.dead=true;assert.equal(T.speech(g).length,0);
});
test('unknown weapon is previewed at the feet, stays on the ground until manual action, and rejects remote, blocked or busy pickup',()=>{
 const g=arena(),p=g.player,d={weapon:'dague-kesh',x:p.x,y:p.y,level:0,delay:0};g.weaponDrops=[d];g.lineClear=()=>true;g.stepWeaponDrops(.04);assert.equal(g.events.filter(e=>e.type==='weaponfound'&&e.pickup).length,1);for(let i=0;i<30;i++)g.stepWeaponDrops(.04);assert.equal(g.events.filter(e=>e.type==='weaponfound').length,1);assert.ok(!g.arsenal.owned.includes(d.weapon));assert.equal(g.context().kind,'weapon');
 p.x+=30;assert.equal(g.takeNearbyWeapon(d.weapon),false);g.stepWeaponDrops(.04);p.x=d.x;g.lineClear=()=>false;assert.equal(g.takeNearbyWeapon(d.weapon),false);g.lineClear=()=>true;p.attack=.2;assert.equal(g.takeNearbyWeapon(d.weapon),false);p.attack=0;g.stepWeaponDrops(.04);g.interact();assert.ok(g.arsenal.owned.includes(d.weapon));assert.equal(g.weaponDrops.length,0);assert.equal(g.player.weapon,a.HearthreaverWeapons.START);assert.equal(g.takeNearbyWeapon(d.weapon),false);
});
test('dungeon objective and notices do not reveal the fairy in the UI',()=>{const fs=require('node:fs'),source=fs.readFileSync(require('node:path').join(__dirname,'../scripts/dungeon-runtime.js'),'utf8');assert.doesNotMatch(source,/fée/iu);});
test('authored world weapons also preview before a manual pickup and preserve ownership after reload',()=>{
 const g=combatGame(a),rack=g.atlasProps.find(o=>o.kind==='kaldor_weapon'&&o.weapon==='couteau-roulier');assert.ok(rack);Object.assign(g.player,{x:rack.x,y:rack.y+8,level:0,attack:0,dash:0,hurt:0});g.events=[];g.stepWeaponDrops(.04);assert.ok(!g.arsenal.owned.includes(rack.weapon));assert.ok(g.events.some(e=>e.type==='weaponfound'&&e.pickup&&e.weapon===rack.weapon));assert.equal(g.context().kind,'weapon');g.interact();assert.ok(rack.taken&&g.arsenal.owned.includes(rack.weapon));const r=combatGame(a,g.serialize());assert.ok(r.arsenal.owned.includes(rack.weapon));assert.ok(r.atlasProps.find(o=>o.kind==='kaldor_weapon'&&o.weapon===rack.weapon).taken);
});

test('a foreground crate covering the hero fades while background and nonoverlapping crates remain opaque',()=>{
 const O=a.DungeonOcclusion,p={x:100,y:100},piece={w:60,h:60,anchor:[30,40]},im=canvas.createCanvas(60,60);im.getContext('2d').fillRect(0,0,60,60);
 const it={piece:'caisse',ref:[108,108],key:6,sub:216};assert.equal(O.covered(it,piece,im,p),true);assert.equal(O.covered({...it,key:5},piece,im,p),false);assert.equal(O.covered({...it,ref:[160,80]},piece,im,p),false);
 const r={g:{dungeon:{floor:'test'}},dungeonOcclusion:[],dungeonOcclusionDt:.04};let alpha;for(let i=0;i<20;i++)alpha=O.alpha(r,it,piece,im,p);assert.ok(alpha>=.55&&alpha<.56);
});
