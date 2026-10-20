'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),W=require('../scripts/kaldor-weapons.js');
const facing=[[0,-1],[1,0],[0,1],[-1,0]];

test('all 768 impact poses aim straight ahead and put the leading end on the player attack axis',()=>{
 for(const w of W.all)for(let dir=0;dir<4;dir++)for(let combo=0;combo<4;combo++){
  const p=W.pose(w.id,dir,2,combo),[fx,fy]=facing[dir],length=Math.hypot(...p.u);
  assert.ok((p.u[0]*fx+p.u[1]*fy)/length>.999999,w.id+':'+dir+':'+combo+' points forward');
  const tip=[p.h[0]+p.u[0]*p.reach,p.h[1]+p.u[1]*p.reach+9];
  assert.ok(tip[0]*fx+tip[1]*fy>8,w.id+' active end ahead of torso');
  assert.ok(Math.abs(tip[0]*-fy+tip[1]*fx)<1e-8,w.id+' contact is not a lateral overshoot');
  const t=W.times(w.id,combo),len=W.duration(w.id,combo);
  for(const remaining of [len-t[0]-t[1]-t[2]*.1,len-t[0]-t[1]-t[2]*.9]){
   assert.equal(W.sample(remaining,w.id,combo),2,'the entire contact window displays the aligned impact');
   const actor={x:100,y:100,dir,combo,weapon:w.id,attack:remaining},target={x:100+tip[0],y:100+tip[1],r:1};
   assert.ok(W.hits(actor,target,W.frame(remaining,w.id,combo)),w.id+' rendered point hits');
   assert.equal(W.hits(actor,{...target,level:1},2),false,'floors stay isolated');
  }
 }
});

test('alignment preserves distinct wind-ups, follow-through, and one- or two-handed grips',()=>{
 for(const w of W.all)for(let dir=0;dir<4;dir++){
  const drawings=new Set();
  for(let combo=0;combo<4;combo++){
   const load=W.pose(w.id,dir,1,combo),hit=W.pose(w.id,dir,2,combo),post=W.pose(w.id,dir,3.5,combo);
   drawings.add(JSON.stringify([load.h,load.u,post.h,post.u]));
   assert.ok(Math.hypot(hit.h[0]-load.h[0],hit.h[1]-load.h[1])>1,w.id+' load differs from contact');
   assert.notDeepEqual([post.h,post.u],[hit.h,hit.u],w.id+' a separate post-impact pose');
   const grip=W.fitGrip(w.id,dir,hit.h,hit.u);
   if(w.hands===2){const dx=grip.support[0]-hit.h[0],dy=grip.support[1]-hit.h[1];assert.ok(Math.abs(dx*hit.u[1]-dy*hit.u[0])<1e-9,'both original hands stay on shaft');}
   else assert.equal(grip.support,null,'free arm stays free');
   let pixels=0;W.trail({set(){pixels++;}},w.id,dir,2,combo);assert.ok(pixels>0,'impact smear retained');
  }
  assert.equal(drawings.size,4,w.id+' four distinct combos');
 }
});

test('the actual native compositor uses the same aligned grip and blade in every view',async()=>{
 const {loadGame}=require('./game-harness.cjs'),api=await loadGame(),A=api.HearthreaverKaldorCivilianArt;await A.preload();
 for(const w of W.all){A.wield(w.id);for(let dir=0;dir<4;dir++)for(let combo=0;combo<4;combo++){
  const expected=W.pose(w.id,dir,2,combo),drawn=A.attackPose(dir,2,combo,api.swordPose);
  assert.deepEqual(JSON.parse(JSON.stringify(drawn.hand)),expected.h);assert.deepEqual(JSON.parse(JSON.stringify(drawn.blade)),expected.u);
  for(const frame of [.75,1,2,combo===3?3.0625:2.25,3.5]){const im=A.nativeFrame(dir,'attack',frame,combo,api.swordPose);assert.equal(im.width,80);assert.equal(im.height,80);const rgba=im.getContext('2d').getImageData(0,0,80,80).data;for(let k=0;k<80;k++)for(const edge of [k,79*80+k,k*80,k*80+79])assert.equal(rgba[edge*4+3],0,w.id+':'+dir+':'+combo+':'+frame+' native drawing fits cell');}
 }A.clear();}
 A.wield(W.START);
});
