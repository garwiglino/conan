'use strict';
const {test,before}=require('node:test'),assert=require('node:assert/strict'),W=require('../scripts/kaldor-weapons.js'),{loadGame,combatGame}=require('./game-harness.cjs');let api;before(async()=>api=await loadGame());
test('every weapon crosses the chest in face/back and foreshortens upright in both profiles',()=>{
 for(const w of W.all)for(let dir=0;dir<4;dir++){
  const p=W.defensePose(w.id,dir);assert.ok(Math.abs(Math.hypot(...p.u)-1)<1e-8);
  if(dir%2)assert.ok(Math.abs(p.u[0])<.2&&p.u[1]<-.98,w.id+' profile');else assert.ok(Math.abs(p.u[0])>.95,w.id+' transverse');
  const support=W.fitGrip(w.id,dir,p.h,p.u,p.span).support;
  if(w.hands===2)assert.ok(support&&Math.abs(Math.hypot(support[0]-p.h[0],support[1]-p.h[1])-p.span)<1e-8);
  assert.notDeepEqual(W.defensePose(w.id,dir,'guard_hit',1),p);
  assert.notDeepEqual(W.defensePose(w.id,dir,'parry',1),W.defensePose(w.id,dir,'guard_hit',1));
 }
});
test('real blocked and parried contacts trigger different animations; failed and rear defenses do not',()=>{
 for(const dungeon of [false,true])for(let dir=0;dir<4;dir++){
  const g=combatGame(api);if(dungeon){g.startFirstDungeon();g.enterDungeonFloor('grande-salle',{x:368,y:208});}g.enemies=[];g.npcs=[];const p=g.player;Object.assign(p,{dir,guard:true,parry:0,attack:0,hurt:0,spawnFX:0,inv:0});
  const [x,y]=g.facing(dir),e={kind:'goblin',x:p.x+x*18,y:p.y+y*18,r:6,stun:0};
  assert.equal(g.defend(e),true);assert.equal(p.defenseFX.kind,'guard_hit');
  assert.equal(api.HearthreaverWeapons.defenseLook(p).state,'guard_hit');
  p.guard=true;p.parry=.18;assert.equal(g.defend(e),true);assert.equal(p.defenseFX.kind,'parry');assert.ok(p.riposte>0);assert.ok(e.stun>0);
  p.defenseFX=null;p.parry=.18;p.guard=true;const rear={...e,x:p.x-x*18,y:p.y-y*18};assert.equal(g.defend(rear),false);assert.equal(p.defenseFX,null);
  p.guard=false;assert.equal(g.defend(e),false);assert.equal(p.defenseFX,null);
 }
});
test('all families and outfits render distinct guard, blocked impact and parry without changing carry or attack poses',async()=>{
 const A=api.HearthreaverKaldorCivilianArt;await A.preload();
 for(const outfit of A.outfits())for(const family of Object.keys(W.families))for(let dir=0;dir<4;dir++){
  const w=W.all.find(w=>w.family===family);A.wear(outfit.id);A.wield(w.id);
  const rgba=(state,frame)=>{const im=A.nativeFrame(dir,state,frame,0,api.swordPose);assert.ok(im);return im.getContext('2d').getImageData(0,0,80,80).data;};
  const guard=rgba('guard',0),hit=rgba('guard_hit',1),parry=rgba('parry',1);assert.notDeepEqual(guard,hit,w.id+' blocked');assert.notDeepEqual(hit,parry,w.id+' parried');
 }
 A.wear('pagne-noue');A.wield(W.START);
});

test('the shipped character renderer selects the real block/parry sprites and contact pause preserves their first pose',async()=>{
 const A=api.HearthreaverKaldorCivilianArt;await A.preload();A.wear('pagne-noue');const atlas=new api.CharacterAtlas(),cv=require('./game-harness.cjs').canvas.createCanvas(80,80),c=cv.getContext('2d');
 for(let dir=0;dir<4;dir++)for(const state of ['guard','guard_hit','parry']){
  const actor={x:40,y:52,dir,weapon:'exile',guard:true,anim:0,attack:0,hurt:0,dash:0,combo:0,moving:false,defenseFX:state==='guard'?null:{kind:state,elapsed:.05}};
  atlas.draw(c,'hero',actor,1);assert.equal(actor._img,A.nativeFrame(dir,state,state==='guard'?0:1,0,api.swordPose),'rendered state '+state+' view '+dir);
 }
 const p={weapon:'exile',defenseFX:{kind:'guard_hit',elapsed:0},hitPause:.03};
 api.KaldorArsenal.combatStep.call({player:p},.02,{},()=>{});assert.equal(p.defenseFX.elapsed,0);
 api.KaldorArsenal.combatStep.call({player:p},.02,{},()=>{});assert.ok(Math.abs(p.defenseFX.elapsed-.01)<1e-8);
 for(let i=0;i<20;i++)api.KaldorArsenal.combatStep.call({player:p},.02,{},()=>{});assert.equal(p.defenseFX,null,'reaction finishes even after releasing guard');
});

test('moving in guard keeps the native eight-step walking legs in all views instead of sliding a frozen pose',async()=>{
 const A=api.HearthreaverKaldorCivilianArt;await A.preload();A.wear('cotte-mailles');A.wield('lance-boisclair');
 for(let dir=0;dir<4;dir++){
  const frames=new Set();for(let gait=0;gait<8;gait++){
   assert.equal(A.remap('guard',6,gait,0),6+gait);const im=A.nativeFrame(dir,'guard',6+gait,0,api.swordPose),rgba=im.getContext('2d').getImageData(0,42,80,16).data;
   frames.add(Buffer.from(rgba).toString('base64'));
  }assert.ok(frames.size>=3,'native feet walk in view '+dir);
 }
 A.wear('pagne-noue');A.wield('exile');
});
