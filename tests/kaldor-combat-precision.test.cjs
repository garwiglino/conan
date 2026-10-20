'use strict';
const {test,before}=require('node:test'),assert=require('node:assert/strict');
const {loadGame,canvas}=require('./game-harness.cjs'),W=require('../scripts/kaldor-weapons.js'),P=require('../scripts/world-projection.js');
let api;before(async()=>{api=await loadGame();});
function arena(){const g=new api.Game();g.npcs=[];g.enemies=[];for(const key of ['populateAtlas','populateRoadTraffic','populateCivilians','advanceAtlas','checkQuests','checkSteles'])g[key]=()=>{};g.lineClear=()=>true;g.solid=()=>false;g.player.spawnFX=0;g.player.inv=100;return g;}
function aim(g,x,y,automatic=false){const v=P.input(x,y);g.aimAttack(v.x,v.y,automatic);}
function foe(g,id,dx,dy){const v=P.inverse(dx,dy),e=api.enemy('snake',g.player.x+v.x,g.player.y+v.y,id);e.hp=e.maxHp=50;e.stun=100;g.enemies.push(e);return e;}

test('near reachable foes beat distant aligned foes, and each automatic press reacquires',()=>{
 const g=arena(),p=g.player;Object.assign(p,{dir:1,weapon:'lance-boisclair'});const close=foe(g,'close',16,12);foe(g,'far',90,0);
 g.targetId='far';aim(g,1,0);assert.equal(g.targetId,close.id);
 g.enemies=[g.enemies[1]];const next=foe(g,'next',0,16);g.targetId='far';g.update(.001,{attackPressed:true,attack:true});assert.equal(g.targetId,next.id);assert.equal(p.dir,2);
});
test('explicit steering keeps its cone, wall locks are dropped, and neutral people are not auto-targeted',()=>{
 const g=arena(),p=g.player;foe(g,'right',17,0);foe(g,'behind',-10,0);aim(g,1,0);assert.equal(g.targetId,'right');
 g.lineClear=()=>false;assert.equal(g.target(),null);assert.equal(g.targetId,null);aim(g,1,0,true);assert.equal(g.targetId,null);
 g.enemies=[];g.npcs=[{id:'civilian',x:p.x+8,y:p.y,civilian:{hp:6},alpha:1}];g.lineClear=()=>true;aim(g,1,0,true);assert.equal(g.targetId,null);
});
test('diagonal targets get a bounded visible grip adjustment in all four views',()=>{
 for(const id of ['exile','lance-boisclair','aiguille-corail','brise-givre'])for(let dir=0;dir<4;dir++)for(const sign of [-1,1]){
  const [fx,fy]=[[0,-1],[1,0],[0,1],[-1,0]][dir],dx=fx*16-fy*sign*12,dy=fy*16+fx*sign*12;
  const aim=W.aimForTarget(id,dir,dx,dy,0),actor={weapon:id,dir,combo:0,x:0,y:0,attack:W.duration(id)-W.times(id)[0]-W.times(id)[1]-.001,impactTick:true,attackAim:aim};
  assert.ok(Math.abs(aim.angle)<=25*Math.PI/180+1e-9);assert.ok(aim.shift.every(v=>Math.abs(v)<=4));
  assert.ok(W.hits(actor,{x:dx,y:dy,r:6},2),id+':'+dir+':'+sign+' diagonal connects');
  assert.equal(W.hits(actor,{x:dx,y:dy,r:6,level:1},2),false);
 }
});
test('tracking follows during wind-up without turning the native view, then freezes at impact',()=>{
 const g=arena(),p=g.player;Object.assign(p,{dir:1,weapon:'lance-boisclair'});const e=foe(g,'moving',18,5);g.targetId=e.id;g.swingSword();const start=JSON.stringify(p.attackAim);e.y+=5;g.faceTarget();assert.notEqual(JSON.stringify(p.attackAim),start);assert.equal(p.dir,1);
 p.impactDone=true;const held=JSON.stringify(p.attackAim);e.y+=5;g.faceTarget();assert.equal(JSON.stringify(p.attackAim),held);assert.equal(p.dir,1);
});
test('the delivery shown by the impact smear reaches its first post pose exactly once',()=>{
 for(const id of ['exile','lance-boisclair','brise-givre'])for(let dir=0;dir<4;dir++)for(let combo=0;combo<4;combo++){
  const row=W.times(id,combo),len=W.duration(id,combo),actor={weapon:id,dir,combo,x:0,y:0,impactTick:true,attack:len-row[0]-row[1]-.001};
  const p=W.combatPose(actor,W.deliveryEnd(combo)),target={x:p.h[0]+p.u[0]*(p.reach-1),y:p.h[1]+p.u[1]*(p.reach-1)+9,r:1};
  assert.ok(W.hits(actor,target,2),id+':'+dir+':'+combo+' outgoing delivery belongs to contact');
  actor.impactTick=false;assert.equal(W.hits(actor,target,2),false);
  actor.impactTick=true;actor.attack=len-row[0]-row[1]-row[2]-.001;assert.equal(W.hits(actor,target,3),false);
 }
});
test('civilian combos bypass NPC invulnerability while monster repeats still respect it',()=>{
 const g=new api.Game(),n=g.npcs.find(n=>n.id==='courier-0'),p=g.player;Object.assign(p,{x:n.x-14,y:n.y,spawnFX:0});
 assert.equal(g.damageCivilian(n,1,p),true);const hp=n.civilian.hp;assert.ok(n.civilian.inv>0);
 assert.equal(g.damageCivilian(n,1,p),true);assert.equal(n.civilian.hp,hp-1);
 assert.equal(g.damageCivilian(n,1,{x:p.x,y:p.y,level:0}),false);
});
test('assisted native hands and smears use exactly the collision pose and fit the common cell',async()=>{
 const A=api.HearthreaverKaldorCivilianArt;await A.preload();
 for(const id of ['exile','lance-boisclair','sarisse-horizon','brise-givre','aiguille-corail','garde-palmes'])for(let dir=0;dir<4;dir++)for(let combo=0;combo<4;combo++)for(const sign of [-1,1]){
  const [fx,fy]=[[0,-1],[1,0],[0,1],[-1,0]][dir],actor={weapon:id,dir,combo,attack:W.duration(id,combo),attackAim:W.aimForTarget(id,dir,fx*18-fy*sign*14,fy*18+fx*sign*14,combo)};
  A.wield(id,actor);const expected=W.combatPose(actor,2),drawn=A.attackPose(dir,2,combo,api.swordPose);
  assert.deepEqual(JSON.parse(JSON.stringify(drawn.hand)),expected.h);assert.deepEqual(JSON.parse(JSON.stringify(drawn.blade)),expected.u);
  for(const frame of [.75,1,2,W.deliveryEnd(combo),3.5]){const im=A.nativeFrame(dir,'attack',frame,combo,api.swordPose),rgba=im.getContext('2d').getImageData(0,0,80,80).data;
   for(let k=0;k<80;k++)for(const edge of [k,79*80+k,k*80,k*80+79])assert.equal(rgba[edge*4+3],0,id+':'+dir+':'+combo+':'+frame+' cell edge');}
  A.clear();
 }
 A.wield(W.START);
});

test('changing aim invalidates native attack drawings and never leaks into NPC equipment',async()=>{
 const A=api.HearthreaverKaldorCivilianArt;await A.preload();A.clear();
 const actor={weapon:'exile',dir:2,combo:0,attack:W.duration('exile'),attackAim:W.aimForTarget('exile',2,-12,18)};
 A.wield(actor.weapon,actor);const left=A.nativeFrame(2,'attack',2,0,api.swordPose),npc={id:'audit-guard',kind:'guard',dir:2};
 const npcLeft=A.npcFrame(npc,'attack',2,'exile',api.swordPose);
 actor.attackAim=W.aimForTarget('exile',2,12,18);A.wield(actor.weapon,actor);
 const right=A.nativeFrame(2,'attack',2,0,api.swordPose),npcRight=A.npcFrame(npc,'attack',2,'exile',api.swordPose);
 assert.notEqual(left,right,'aim is part of the bounded image cache key');
 assert.notDeepEqual(left.getContext('2d').getImageData(0,0,80,80).data,right.getContext('2d').getImageData(0,0,80,80).data,'the drawn weapon follows the changed collision pose');
 assert.deepEqual(npcLeft.getContext('2d').getImageData(0,0,80,80).data,npcRight.getContext('2d').getImageData(0,0,80,80).data,'NPC drawing is independent of player aim');
 assert.deepEqual(JSON.parse(JSON.stringify(A.attackPose(2,2,0,api.swordPose).hand)),W.combatPose(actor,2).h,'NPC rendering restores player grip context');A.wield(W.START);
});


test('live isometric contacts align projected weapons with logical targets in all native views',()=>{
 for(const weapon of ['exile','lance-boisclair','aiguille-corail'])for(let dir=0;dir<4;dir++){
  const g=arena(),p=g.player,[fx,fy]=[[0,-1],[1,0],[0,1],[-1,0]][dir];Object.assign(p,{weapon,dir});
  const n=foe(g,'projected-contact',fx*16-fy*10,fy*16+fx*10);aim(g,fx,fy);assert.equal(g.targetId,n.id);assert.equal(p.dir,dir);g.swingSword();
  const hp=n.hp;let impact=false;for(let tick=0;tick<80&&!impact;tick++){g.update(1/60,{});impact=p.impactTick;}
  assert.ok(impact,weapon+':'+dir+' impact reached');assert.ok(n.hp<hp,weapon+':'+dir+' projected diagonal contact damages logical target');
  const pos=P.point(p.x,p.y),target={...n,...P.point(n.x,n.y)},actor={...p,...pos};
  assert.equal(api.bladeHits(p,n,2),W.hits(actor,target,2),'projection is applied once at the collision boundary');
  const held=JSON.stringify(p.attackAim);n.x+=5;g.faceTarget();assert.equal(JSON.stringify(p.attackAim),held,'contact locks aim in screen space');
 }
});
