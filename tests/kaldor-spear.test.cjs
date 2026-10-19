'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),W=require('../scripts/kaldor-weapons.js');
const id='lance-boisclair';
test('spear has four distinct blows and weighted anticipation/strike/recovery timings',()=>{
 assert.deepEqual(W.spearNames,['Estoc vif','Revers de hampe','Taille croisée','Fente longue']);
 for(let dir=0;dir<4;dir++){
  const paths=[0,1,2,3].map(c=>JSON.stringify([1,2,3,4].map(f=>W.pose(id,dir,f,c))));assert.equal(new Set(paths).size,4);
 }
 for(let c=0;c<4;c++){const t=W.times(id,c);assert.ok(t[1]>t[2]*2);assert.ok(t[5]>t[2]*2);}
 assert.ok(W.duration(id,3)>W.duration(id,0)*1.5);
});
test('spear loads from guard, accelerates into contact and follows through with the body',()=>{
 for(let c=0;c<4;c++){
  assert.equal(W.sample(W.duration(id,c),id,c),0,'preparation starts in ready pose');
  const a=W.pose(id,1,1.25,c),b=W.pose(id,1,1.5,c),z=W.pose(id,1,1.75,c);
  assert.ok(Math.hypot(z.h[0]-b.h[0],z.h[1]-b.h[1])>Math.hypot(b.h[0]-a.h[0],b.h[1]-a.h[1]));
  assert.ok(W.pose(id,1,1,c).body[0]<0);assert.ok(W.pose(id,1,3,c).body[0]>0);
  assert.deepEqual(W.pose(id,1,5,c).h,W.guard(id,1).h);
 }
 const pixels=new Map(),sink={set(x,y,c){pixels.set(Math.round(x)+','+Math.round(y),c);}};
 W.trail(sink,id,1,.75,0);assert.equal(pixels.size,0,'no smear on loading');
 W.trail(sink,id,1,2.5,0);assert.ok(pixels.size>0,'smear follows the actual delivery');
 pixels.clear();W.trail(sink,id,1,4.5,0);assert.equal(pixels.size,0,'no new cut painted during recovery');
});
test('every spear sub-pose keeps the drawn tip inside the engine frame and its active sweep',()=>{
 for(const w of W.all.filter(w=>w.family==='spear'))for(let dir=0;dir<4;dir++)for(let c=0;c<4;c++){
  for(let f=0;f<=5;f+=.125){const p=W.pose(w.id,dir,f,c),x=40+p.h[0]+p.u[0]*p.reach,y=52+p.h[1]+p.u[1]*p.reach;assert.ok(x>1&&x<78&&y>1&&y<78,w.id+':'+dir+':'+c+':'+f);}
  for(const f of [2,3]){const p=W.pose(w.id,dir,f,c),actor={x:0,y:0,dir,combo:c,weapon:w.id},target={x:p.h[0]+p.u[0]*p.reach,y:p.h[1]+p.u[1]*p.reach+9,r:.1};assert.ok(W.hits(actor,target,f));}
 }
});
