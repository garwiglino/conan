'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),W=require('../scripts/kaldor-weapons.js');
const angle=p=>Math.atan2(p.u[1],p.u[0]),turn=(a,b)=>Math.atan2(Math.sin(b-a),Math.cos(b-a));
const tip=p=>p.h.map((v,k)=>v+p.u[k]*p.reach),distance=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
test('all ordinary cuts continue their signed arc into a pronounced overshoot',()=>{
 let cuts=0;
 for(const w of W.all)for(let d=0;d<4;d++)for(let c=0;c<3;c++){
  const load=W.pose(w.id,d,1,c),hit=W.pose(w.id,d,2,c),post=W.pose(w.id,d,3.5,c),incoming=turn(angle(load),angle(hit)),outgoing=turn(angle(hit),angle(post));
  if(Math.abs(incoming)<.1){assert.ok(distance(tip(load),tip(hit))>=4);continue;}
  assert.ok(Math.abs(incoming)>=.9,w.id+' pronounced preparation');
  assert.ok(distance(load.h,hit.h)>2,w.id+' compact hands still load away from contact');
  cuts++;assert.ok(incoming*outgoing>0,w.id+':'+d+':'+c+' never brakes in the opposite direction');
  assert.ok(Math.abs(outgoing)>=100*Math.PI/180,w.id+' extended follow-through');
  assert.ok(distance(tip(hit),tip(post))>8,w.id+' leading end carries past contact');
  assert.ok(distance(hit.h,post.h)>2,w.id+' hands move with the edge');
 }
 assert.equal(cuts,524);
});
test('ordinary leading-end curves share a tangent through impact and have no key-pose discontinuity',()=>{
 const eps=1e-5;
 for(const w of W.all)for(let d=0;d<4;d++)for(let c=0;c<3;c++){
  const at=f=>tip(W.pose(w.id,d,f,c)),left=at(2-eps),hit=at(2),right=at(2+eps);
  const a=hit.map((v,k)=>(v-left[k])/eps),b=right.map((v,k)=>(v-hit[k])/eps);
  assert.ok(distance(a,b)<.08,w.id+':'+d+':'+c+' shared contact velocity');
  for(const f of [1,2,3.5,5])assert.ok(distance(at(f-eps),at(f))<.01,w.id+' continuous '+f);
 }
});
test('fourth-strike follow-through is continuous, keeps one contact, and spins at waist height',()=>{
 const eps=1e-5;
 for(const w of W.all)for(let d=0;d<4;d++){
  const at=f=>W.pose(w.id,d,f,3),contact=at(2);
  assert.deepEqual(at(3).h,contact.h);assert.deepEqual(at(3).u,contact.u);
  for(const f of [3,3.5,5])assert.ok(distance(tip(at(f-eps)),tip(at(f)))<.01,w.id+' continuous finisher '+f);
  if(w.finisher.kind==='whirl')for(let f=3;f<=3.5;f+=.025){const p=at(f);assert.ok(Math.abs(p.u[1])<=.351);}
 }
});
