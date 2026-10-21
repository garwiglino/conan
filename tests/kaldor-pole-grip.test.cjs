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
test('front spear thrust translates toward the target along the centred shaft',()=>{
 for(const w of poles.filter(w=>w.family==='spear'))for(const c of [0,...(W.finisher(w.id).kind==='lunge'?[3]:[])]){
  const a=W.pose(w.id,2,1,c),b=W.pose(w.id,2,2,c),dx=b.h[0]-a.h[0],dy=b.h[1]-a.h[1];
  assert.ok(Math.abs(dx)<1e-9&&dy>=4,w.id+' moves forward on the centre line');
  assert.ok(a.u[0]*b.u[0]+a.u[1]*b.u[1]>.999);assert.ok((dx*b.u[0]+dy*b.u[1])/Math.hypot(dx,dy)>.99);
 }
});
test('face-on polearm wind-ups alternate while every impact converges ahead of the player',()=>{
 for(const w of poles){
  for(let c=0;c<4;c++){
   const p=W.pose(w.id,2,2,c),x=p.h[0]+p.u[0]*p.reach,y=p.h[1]+p.u[1]*p.reach;
   assert.ok(Math.abs(x)<1e-9,w.id+':'+c+' contact stays centred');assert.ok(y+9>8);
   assert.ok(W.hits({x:0,y:0,dir:2,weapon:w.id,combo:c},{x:0,y:y+9,r:.1},2));
  }
  if(w.family!=='spear'){
   const a=W.pose(w.id,2,1,0),b=W.pose(w.id,2,1,1);assert.ok(a.h[0]+a.u[0]*a.reach>8&&b.h[0]+b.u[0]*b.reach< -8,w.id+' cuts load from opposite sides');
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

test('closing polearm contacts aim at the opponent while preserving distinct preparation and follow-through',()=>{
 for(const w of poles)for(const c of [2,...(W.finisher(w.id).kind==='lunge'?[3]:[])]){
  const f=2;
  const p=W.pose(w.id,2,f,c);assert.ok(p.u[1]>.1,w.id+':'+c+' tip stays forward/down in face view');
  assert.ok(p.h[1]>=-17,w.id+' no raised overhead grip in the closing pair');
  for(const dir of [1,3]){const q=W.pose(w.id,dir,f,c);assert.ok((dir===1?q.u[0]:-q.u[0])>.7,w.id+' profile closes toward opponent');}
  for(const dir of [0,1,2,3]){assert.notDeepEqual(W.pose(w.id,dir,1,c),W.pose(w.id,dir,2,c),'preparation remains distinct');assert.notDeepEqual(W.pose(w.id,dir,3.5,c),W.pose(w.id,dir,2,c),'follow-through remains distinct');}
 }
});

test('normal spear and staff carrying projects the transverse diagonal vertically in side views',()=>{
 for(const w of W.all.filter(w=>['spear','staff'].includes(w.family)))for(let dir=0;dir<4;dir++){
  const p=W.carry(w.id,dir),grip=W.fitGrip(w.id,dir,p.h,p.u,p.span);
  assert.ok(p.u[1]<-.6&&p.u[1]>-.7,w.id+' relaxed diagonal');if(dir===1||dir===3){assert.equal(p.u[0],0);assert.ok(Math.hypot(...p.u)<.7,'profile retains perspective foreshortening');}else assert.ok(Math.abs(p.u[0])>.7&&Math.abs(p.u[0])<.8);assert.equal(p.scale,.72);assert.equal(p.reach,w.length*.72+2);assert.ok(p.reach<W.guard(w.id,dir).reach);
  assert.equal(p.span,8);assert.ok((dir===0||dir===3)?p.h[0]<0:p.h[0]>0,'shaft stays in front of torso in profile');
  if(w.hands===2){assert.ok(grip.support[1]-grip.h[1]>5,'one hand high and one low');assert.ok(Math.abs((grip.support[0]-p.h[0])*p.u[1]-(grip.support[1]-p.h[1])*p.u[0])<1e-9);}else assert.equal(grip.support,null,'one-handed javelins keep the free arm');
  assert.notDeepEqual(p.u,W.guard(w.id,dir).u,'normal carrying does not replace combat guard');
  const s=W.storage(w.id,dir);if(dir===1||dir===3){assert.equal(s.u[0],0);assert.equal(s.u[1],-1);}else assert.ok(Math.abs(s.u[0])>.5,'front/back stowing remains diagonal');
 }
});

test('normal carrying renders all walking poses and stored sides with intact outfit arm images',async()=>{
 const {loadGame,canvas}=require('./game-harness.cjs'),api=await loadGame(),A=api.HearthreaverKaldorCivilianArt;await A.preload();
 const source=require('../data/weapons/native-arms.json');
 for(const [outfit,views]of Object.entries(source.outfits)){
  A.wear(outfit);
  for(const id of ['lance-boisclair','baton-lianes'])for(let dir=0;dir<4;dir++){
   A.wield(id);const p=W.carry(id,dir),g=W.fitGrip(id,dir,p.h,p.u,p.span),layers=A.nativeArmLayers(dir,p.h,p.u,[0,0],[0,0],p.span),parts=views[[2,1,0,3][dir]];
   for(const part of parts){const main=part.side===null||part.side===(dir===0?'right':'left'),target=main?g.h:g.support,im=await canvas.loadImage(Buffer.from(part.png,'base64')),expected=canvas.createCanvas(80,80);expected.getContext('2d').drawImage(im,Math.round(target[0]-part.palm[0]),Math.round(target[1]-part.palm[1]));assert.deepEqual(layers[main?'front':'back'].getContext('2d').getImageData(0,0,80,80).data,expected.getContext('2d').getImageData(0,0,80,80).data,outfit+':'+id+':'+dir+' untouched arms');}
   for(const state of ['idle','walk','sheathed_walk','sheathe_walk','draw_walk'])for(let f=0;f<(state==='idle'?4:state==='walk'||state==='sheathed_walk'?8:state==='draw_walk'?40:48);f++){
    const im=A.nativeFrame(dir,state,f,0,api.swordPose),data=im.getContext('2d').getImageData(0,0,80,80).data;
    for(let k=0;k<80;k++)for(const offset of [k,79*80+k,k*80,k*80+79])assert.equal(data[offset*4+3],0,id+':'+dir+':'+state+':'+f+' no clipping');
   }
  }
 }
 A.wear('pagne-noue');A.wield(W.START);
});
