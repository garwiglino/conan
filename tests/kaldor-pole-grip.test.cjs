'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const W=require('../scripts/kaldor-weapons.js'),poles=W.all.filter(w=>['spear','staff','glaive'].includes(w.family));
test('face-on polearms keep both separated hands on the shaft through guard and all four blows',()=>{
 for(const w of poles){
  const ready=W.guard(w.id,2);assert.ok(ready.u[0]<-.55&&ready.u[1]>.6,w.id+' diagonal ready');
  for(let c=0;c<4;c++)for(let f=0;f<=5;f+=.125){
   const p=W.pose(w.id,2,f,c),g=W.fitGrip(w.id,2,p.h,p.u);
   if(w.hands===1){assert.equal(g.support,null);continue;}
   const dx=g.support[0]-g.h[0],dy=g.support[1]-g.h[1];
   assert.ok(Math.abs(dx*p.u[1]-dy*p.u[0])<1e-9,w.id+' both grips on shaft');
   assert.ok(Math.abs(Math.hypot(dx,dy)-6*Math.hypot(...p.u))<1e-9);
   assert.ok(dx*p.u[0]+dy*p.u[1]<0,'rear hand lies behind leading hand');
  }
 }
});
test('front spear thrust moves down its diagonal shaft while retaining its individual tempo',()=>{
 for(const w of poles.filter(w=>w.family==='spear'))for(const c of [0,...(W.finisher(w.id).kind==='lunge'?[3]:[])]){
  const a=W.pose(w.id,2,1,c),b=W.pose(w.id,2,3,c),dx=b.h[0]-a.h[0],dy=b.h[1]-a.h[1];
  assert.ok((c===0?dx< -5:dx>5)&&dy>7,w.id+' extends along its alternating front diagonal');
  assert.ok(a.u[0]*b.u[0]+a.u[1]*b.u[1]>.999);
  assert.ok((dx*b.u[0]+dy*b.u[1])/Math.hypot(dx,dy)>.98);
 }
});
test('all face-on polearm combos deliver left, right, left, right and collision follows each visible tip',()=>{
 for(const w of poles){
  for(let c=0;c<4;c++){
   const p=W.pose(w.id,2,3,c),x=p.h[0]+p.u[0]*p.reach,y=p.h[1]+p.u[1]*p.reach;
   assert.ok(c%2?x>8:x< -8,w.id+':'+c+' genuinely changes delivery side');
   assert.ok(W.hits({x:0,y:0,dir:2,weapon:w.id,combo:c},{x,y:y+9,r:.1},3));
  }
  if(w.family!=='spear')for(const c of [0,1]){
   const a=W.pose(w.id,2,1,c),b=W.pose(w.id,2,3,c);
   const ax=a.h[0]+a.u[0]*a.reach,bx=b.h[0]+b.u[0]*b.reach;
   assert.ok(c===0?ax>8&&bx< -8:ax< -8&&bx>8,w.id+' cut and reverse cross in opposite directions');
  }
 }
});
test('all outfits use their unmodified hand and sleeve images at the actual two grip positions',async()=>{
 const {loadGame,canvas}=require('./game-harness.cjs'),api=await loadGame(),A=api.HearthreaverKaldorCivilianArt;
 assert.ok(await A.preload());const source=require('../data/weapons/native-arms.json');
 for(const [outfit,views]of Object.entries(source.outfits)){
  A.wear(outfit);const parts=views[0],images=await Promise.all(parts.map(p=>canvas.loadImage(Buffer.from(p.png,'base64'))));
  for(const w of poles){A.wield(w.id);
   for(let c=0;c<4;c++)for(const f of [0,1,2.5,3,4,5]){
    const p=W.pose(w.id,2,f,c),g=W.fitGrip(w.id,2,p.h,p.u),layers=A.nativeArmLayers(2,p.h,p.u);
    for(let i=0;i<parts.length;i++){
     const part=parts[i],main=part.side==='left',target=main?g.h:w.hands===2?g.support:part.palm;
     const expected=canvas.createCanvas(80,80);expected.getContext('2d').drawImage(images[i],Math.round(target[0]-part.palm[0]),Math.round(target[1]-part.palm[1]));
     assert.deepEqual(layers[main?'front':'back'].getContext('2d').getImageData(0,0,80,80).data,expected.getContext('2d').getImageData(0,0,80,80).data,outfit+':'+w.id+':'+c+':'+f);
    }
   }
  }
 }
 A.wear('pagne-noue');A.wield(W.START);
});

test('the closing polearm cuts and thrusts stay directed at the opponent instead of lifting into the air',()=>{
 for(const w of poles)for(const c of [2,...(W.finisher(w.id).kind==='lunge'?[3]:[])])for(let f=1;f<=4.75;f+=.125){
  const p=W.pose(w.id,2,f,c);assert.ok(p.u[1]>.1,w.id+':'+c+' tip stays forward/down in face view');
  assert.ok(p.h[1]>=-17,w.id+' no raised overhead grip in the closing pair');
  for(const dir of [1,3]){const q=W.pose(w.id,dir,f,c);assert.ok((dir===1?q.u[0]:-q.u[0])>.7,w.id+' profile closes toward opponent');}
 }
});
