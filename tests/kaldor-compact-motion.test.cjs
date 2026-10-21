'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),W=require('../scripts/kaldor-weapons.js');
test('all six held drawings keep native hands near the torso with a quiet head and body',()=>{
 for(const w of W.all)for(let dir=0;dir<4;dir++)for(let combo=0;combo<4;combo++)for(const f of [.75,1,2,W.deliveryEnd(combo),3.5,5]){
  const p=W.pose(w.id,dir,f,combo),grip=W.fitGrip(w.id,dir,p.h,p.u),key=w.id+':'+dir+':'+combo+':'+f;
  assert.ok(p.body.every(v=>Math.abs(v)<=3),key+' grounded torso');
  assert.ok(p.head.every((v,k)=>Math.abs(v-p.body[k])<=1),key+' no head whip');
  assert.ok(p.hair.every(v=>Math.abs(v)<=1),key+' restrained overlap');
  for(const hand of [grip.h,grip.support].filter(Boolean)){
   assert.ok(Math.abs(hand[0]-p.body[0])<=10.5,key+' hands remain at shoulder width');
   assert.ok(hand[1]-p.body[1]>=-20&&hand[1]-p.body[1]<=2,key+' no floating raised sleeve');
  }
 }
});
test('the outgoing drawing keeps the contact foot stance rather than swapping gait frames',()=>{
 for(const w of W.all)for(let dir=0;dir<4;dir++)for(let combo=0;combo<4;combo++){
  const hit=W.pose(w.id,dir,2,combo),post=W.pose(w.id,dir,3.5,combo);assert.equal(post.leg,hit.leg,w.id+':'+dir+':'+combo);
 }
});
