'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),W=require('../scripts/kaldor-weapons.js'),Projection=require('../scripts/world-projection.js');
test('all 48 weapons have a distinct named and choreographed fourth strike',()=>{
 const names=new Set(),paths=new Set();
 for(const w of W.all){const v=W.finisher(w.id);assert.ok(v.name&&v.kind&&v.effect);assert.ok(v.drive>0);names.add(v.name);
  assert.equal(W.comboNames(w.id)[3],v.name);
  paths.add(JSON.stringify([0,.5,1,1.25,1.5,1.75,2,3,4,5].map(f=>W.pose(w.id,2,f,3))));
 }
 assert.equal(names.size,48);assert.equal(paths.size,48);
 assert.ok(W.all.some(w=>w.finisher.magic));assert.ok(W.all.filter(w=>w.rarity==='Commune').every(w=>!w.finisher.magic));
});
test('fourth strike holds one contact, completes its overshoot and then only retracts',()=>{
 for(const w of W.all)for(let d=0;d<4;d++){
  const contact=W.pose(w.id,d,2,3),held=W.pose(w.id,d,3,3),ready=W.guard(w.id,d);
  assert.deepEqual(contact.h,held.h,w.id+' no second advance');assert.deepEqual(contact.u,held.u,w.id+' no second cut');
  for(const f of [2.25,2.5,2.75]){assert.deepEqual(W.pose(w.id,d,f,3).h,contact.h);}
  let previous=Infinity;
  for(let f=3.5;f<=5;f+=.125){const p=W.pose(w.id,d,f,3),dist=Math.hypot(p.h[0]-ready.h[0],p.h[1]-ready.h[1]);assert.ok(dist<=previous+1e-8,w.id+' retreat does not wind up another hit');previous=dist;}
 }
});
test('spinning finishers turn the existing character through all four native views and share their real swept collision',()=>{
 for(const w of W.all.filter(w=>w.finisher.kind==='whirl'))for(let d=0;d<4;d++){
  const views=new Set();for(let f=1;f<2;f+=.025){const p=W.pose(w.id,d,f,3);views.add(p.view);
   const target={x:p.h[0]+p.u[0]*(p.reach-2),y:p.h[1]+p.u[1]*(p.reach-2)+9,r:1};
   assert.ok(W.hits({x:0,y:0,weapon:w.id,dir:d,combo:3},target,2),w.id+' drawn sweep hits');
   assert.ok(!W.hits({x:0,y:0,weapon:w.id,dir:d,combo:3},{...target,level:1},2));
  }assert.equal(new Set([1,1.25,1.5,1.75].map(f=>W.pose(w.id,d,f,3).view)).size,4,'continuous trail construction retains every native view');assert.equal(views.size,4);assert.equal(W.pose(w.id,d,2,3).view,d);assert.equal(W.pose(w.id,d,5,3).view,d);
 }
});
test('effect palettes are weapon-specific, bounded, and expire before the next attack',()=>{
 const palettes=new Set();for(const w of W.all){
  let count=0;const colors=new Set(),b={set(x,y,c){assert.ok(x>=-34&&x<=34&&y>=-44&&y<=23);count++;colors.add(c);}};
  for(const f of [0,1,4.5,5])W.finisherEffects(b,w.id,2,f);assert.equal(count,0);
  for(const f of [1.5,2,2.5,3,3.75])W.finisherEffects(b,w.id,2,f);assert.ok(count>0,w.id);palettes.add([...colors].sort().join());
 }
 assert.ok(palettes.size>=8,'different materials and magic have different colors');
});
test('all finishers render in the shipped compositor, including rotating views, effects, outfits and helmets',async()=>{
 const {loadGame}=require('./game-harness.cjs'),api=await loadGame(),A=api.HearthreaverKaldorCivilianArt;assert.ok(await A.preload());
 function edge(im,id){const pixels=im.getContext('2d').getImageData(0,0,80,80).data;
  for(let y=0;y<80;y++)for(const x of [0,79])assert.equal(pixels[(y*80+x)*4+3],0,id+' side');
  for(let x=0;x<80;x++)assert.equal(pixels[(79*80+x)*4+3],0,id+' bottom');
 }
 for(const w of W.all){A.wield(w.id);for(let d=0;d<4;d++)for(const f of [0,1,1.25,1.5,1.75,2,2.5,3,4,5])edge(A.nativeFrame(d,'attack',f,3,api.swordPose),w.id);A.clear();await new Promise(r=>setImmediate(r));}
 const native=require('../data/weapons/native-arms.json');
 for(const outfit of Object.keys(native.outfits))for(const helmet of [null,'heaume-ferme']){
  A.wear(outfit);A.wearHelmet(helmet);for(const id of ['brise-givre','flamme-clairfoyer','sarisse-horizon','crosse-pretre','aiguille-corail']){
   A.wield(id);for(const d of [0,1,2,3])for(const f of [1.5,2])edge(A.nativeFrame(d,'attack',f,3,api.swordPose),outfit+':'+id);
  }
 }
 A.wear('pagne-noue');A.wearHelmet(null);A.wield(W.START);
});
test('the actual fourth-combo combat loop hits a victim once across delivery and held impact',async()=>{
 const {loadGame,combatGame}=require('./game-harness.cjs'),api=await loadGame(),g=combatGame(api);
 for(const key of ['populateAtlas','populateRoadTraffic','populateCivilians','advanceAtlas','checkQuests','checkSteles','stepNpcs'])g[key]=()=>{};
 g.enemies=[];g.npcs=[];g.player.weapon='sarisse-horizon';g.player.dir=2;g.player.spawnFX=0;g.player.combo=2;g.player.comboWindow=1;g.swingSword();assert.equal(g.player.combo,3);
 const q=W.pose(g.player.weapon,2,2,3),delta=Projection.inverse(q.h[0]+q.u[0]*(q.reach-2),q.h[1]+q.u[1]*(q.reach-2)+9),victim={id:'one-finisher-victim',kind:'snake',hp:100,r:6,level:g.player.level||0,x:g.player.x+delta.x,y:g.player.y+delta.y};
 g.combatTargets=()=>[victim];g.lineClear=()=>true;let blows=0;g.damageEnemy=()=>blows++;
 const times=W.times(g.player.weapon,3),len=W.duration(g.player.weapon,3);g.player.attackStep=true;
 g.player.attack=len-times[0]-times[1]-times[2]*.5;for(let n=0;n<3;n++)g.update(0,{});
 g.player.attack=len-times[0]-times[1]-times[2]-.001;for(let n=0;n<3;n++)g.update(0,{});
 assert.equal(blows,1);assert.equal(g.player.dir,2);assert.equal(g.player.weapon,'sarisse-horizon');
});
test('the dedicated fourth-strike preview has an explicit pause between each single blow',()=>{
 for(const w of W.all){assert.equal(W.preview(w.id,0,'finisher').state,'idle');let active=0;
  for(let t=.2;t<W.duration(w.id,3)+.2;t+=.01){const p=W.preview(w.id,t,'finisher');assert.equal(p.combo,3);assert.ok(p.frame>=0&&p.frame<=5);if(p.state==='attack')active++;}
  assert.ok(active>0);assert.equal(W.preview(w.id,W.duration(w.id,3)+.3,'finisher').state,'idle');
 }
});

test('live finisher contact begins on the discrete impact drawing, never in anticipation',()=>{
 for(const w of W.all){
  const q=W.pose(w.id,2,2,3),target={x:q.h[0]+q.u[0]*(q.reach-1),y:q.h[1]+q.u[1]*(q.reach-1)+9,r:.1};
  const times=W.times(w.id,3),len=W.duration(w.id,3),actor={x:0,y:0,weapon:w.id,dir:2,combo:3,attack:len-times[0]-times[1]-.001};
  actor.attack=len-times[0]-times[1]*.5;assert.equal(W.hits(actor,target,2),false,w.id+' no contact in preparation');
  actor.attack=len-times[0]-times[1]-.001;assert.equal(W.frame(actor.attack,w.id,3),2);assert.equal(W.hits(actor,target,2),true,w.id+' contact connects on the displayed impact drawing');
  actor.attack=len-times[0]-times[1]-times[2]-.001;assert.equal(W.frame(actor.attack,w.id,3),3);assert.equal(W.hits(actor,target,3),false,w.id+' follow-through is never another contact');
 }
});
test('a slower frame crossing into impact still sweeps the last part of a spinning delivery',()=>{
 for(const w of W.all.filter(w=>w.finisher.kind==='whirl')){
  const times=W.times(w.id,3),actor={x:0,y:0,weapon:w.id,dir:2,combo:3,attack:W.duration(w.id,3)-times[0]-times[1]-.001};
  const previous=Math.max(1,W.sample(actor.attack+.04,w.id,3)),q=W.pose(w.id,2,(previous+2)/2,3);
  assert.ok(previous<=2);assert.ok(W.hits(actor,{x:q.h[0]+q.u[0]*(q.reach-2),y:q.h[1]+q.u[1]*(q.reach-2)+9,r:.1},3),w.id+' does not drop the final arc at low frame rate');
 }
});

test('body turns sweep at waist height and hide the rear arc instead of wheeling in front of the face',()=>{
 for(const w of W.all.filter(w=>w.finisher.kind==='whirl'))for(let f=1;f<=3;f+=.025){
  const p=W.pose(w.id,2,f,3);assert.ok(Math.abs(p.u[1])<=.351,w.id+' shallow horizontal projection');
  if(p.u[1]<0)assert.equal(p.z,0,w.id+' rear weapon goes behind character');
  else{assert.equal(p.z,1);assert.ok(p.h[1]-p.body[1]>=-9.001,w.id+' forward grip stays below face');}
 }
});
test('front finishing arcs keep the rising edge outside either shoulder',()=>{
 for(const w of W.all.filter(w=>!['spear','staff','glaive'].includes(w.family)))for(let f=3;f<5;f+=.025){
  const p=W.pose(w.id,2,f,3);
  if(p.u[1]<0)assert.ok(Math.abs(p.h[0])>4.5&&p.h[0]*p.u[0]>0,w.id+' rising edge points away from the cleared shoulder');
  for(let r=2;r<p.reach;r+=.5){const x=p.h[0]+p.u[0]*r-p.body[0],y=p.h[1]+p.u[1]*r-p.body[1];assert.ok(!(x>-5&&x<5&&y<-9&&y>-23),w.id+' no return through the face');}
 }
});

test('rear spinning afterimages and magic residue are composited behind the body',()=>{
 for(const w of W.all.filter(w=>w.finisher.kind==='whirl')){
  let front=0,rear=0;const back={set(){rear++;}},face={set(x,y){front++;assert.ok(!(x>-5&&x<5&&y< -9),w.id+' no forward streak over face');}};
  W.trail(face,w.id,2,2,3,back);W.finisherEffects(face,w.id,2,2.25,back);
  assert.ok(front>0&&rear>0,w.id+' separates the two depth planes');
 }
});

test('ordinary front combo recoveries also keep the rising blade outside the head',()=>{
 for(const w of W.all)for(let c=0;c<3;c++)for(let f=4;f<5;f+=.025){
  const p=W.pose(w.id,2,f,c);
  for(let r=2;r<p.reach;r+=.5){const x=p.h[0]+p.u[0]*r-p.body[0],y=p.h[1]+p.u[1]*r-p.body[1];
   assert.ok(!(x>-5&&x<5&&y<-9&&y> -23),w.id+':'+c+' no blade recovery through face');
  }
 }
});
