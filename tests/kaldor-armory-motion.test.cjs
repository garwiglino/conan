'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),W=require('../scripts/kaldor-weapons.js');
test('each of the 48 arms has four named, distinct combos and real mass/balance',()=>{
 for(const w of W.all){
  assert.ok(w.weightKg>0&&w.weightKg<5,w.id);assert.ok(w.hands===1||w.hands===2);assert.ok(w.balance);
  const names=W.comboNames(w.id);assert.equal(names.length,4);assert.equal(new Set(names).size,4);
  for(let d=0;d<4;d++){
   const paths=[0,1,2,3].map(c=>JSON.stringify([1,2,3,4].map(f=>W.pose(w.id,d,f,c))));assert.equal(new Set(paths).size,4,w.id+':'+d);
   for(let c=0;c<4;c++){
    const times=W.times(w.id,c);assert.equal(times.length,6);assert.ok(times[1]>times[2]);assert.ok(times[5]>times[2]);
    assert.equal(W.sample(W.duration(w.id,c),w.id,c),0);
    const before=W.pose(w.id,d,0,c),after=W.pose(w.id,d,5,c),ready=W.guard(w.id,d);assert.deepEqual(before.h,after.h);assert.deepEqual(after.h,ready.h);
    if(d===1||d===3){assert.ok(W.pose(w.id,d,1,c).body.some(n=>n!==0));assert.ok(W.pose(w.id,d,3,c).body.some(n=>n!==0));}
    for(let f=0;f<=5;f+=.125){const p=W.pose(w.id,d,f,c),x=40+p.h[0]+p.u[0]*p.reach,y=52+p.h[1]+p.u[1]*p.reach;assert.ok(x>1&&x<78&&y>1&&y<78,w.id+' tip '+d+':'+c+':'+f);}
   }
  }
 }
 assert.ok(W.duration('brise-givre',0)>W.duration('aiguille-corail',0)*2);
 assert.ok(W.hitPause('brise-givre',3)>W.hitPause('aiguille-corail',3));
 assert.ok(W.get('brise-givre').damage>W.get('aiguille-corail').damage*3);
});
test('all stowed weapons lie diagonally with their silhouette centered on the spine',()=>{
 for(const w of W.all)for(let d=0;d<4;d++){
  const s=W.storage(w.id,d);assert.deepEqual(s.center,[d===1?-3:d===3?3:0,-10]);assert.ok(Math.abs(s.u[0])>.4&&Math.abs(s.u[1])>.6,w.id+' diagonal');assert.ok(Math.abs(Math.hypot(...s.u)-1)<1e-10);
  const points=[],b={set(x,y){points.push([Math.round(x),Math.round(y)]);},line(x,y,X,Y,c,z){const n=Math.max(1,Math.ceil(Math.hypot(X-x,Y-y)*2));for(let i=0;i<=n;i++)this.set(x+(X-x)*i/n,y+(Y-y)*i/n);}};
  W.paintStored(b,w.id,d);
  const mid=k=>(Math.min(...points.map(p=>p[k]))+Math.max(...points.map(p=>p[k])))/2;
  assert.ok(Math.abs(mid(0)-s.center[0])<=.51,w.id+' x');assert.ok(Math.abs(mid(1)-s.center[1])<=.51,w.id+' y');
 }
});
test('weapon afterimages follow mass and stay confined to the attack delivery',()=>{
 function pixels(id,f){const m=new Map();W.trail({set(x,y,c,z){m.set(Math.round(x)+','+Math.round(y),{c,z});}},id,1,f,0);return m;}
 for(const w of W.all){assert.equal(pixels(w.id,.5).size,0);assert.equal(pixels(w.id,4.5).size,0);assert.ok(pixels(w.id,2.5).size>0);}
 assert.ok([...pixels('brise-givre',2.5).values()].some(p=>p.z<0),'heavy weapon has earlier silhouettes');
 assert.ok(![...pixels('aiguille-corail',2.5).values()].some(p=>p.z<0),'dagger uses a short streak');
});

test('mass-based stowing keeps attacks responsive and every preview frame valid',()=>{
 const Art=require('../sprites/kaldor/kaldor-art.js');
 for(const w of W.all){
  const h=W.holster(w.id),a={weapon:w.id,attack:0,moving:true,guard:false};
  Art.weaponVisual(a,0,'walk',0);assert.equal(Art.weaponVisual(a,3.71,'walk',2).mode,'stowing');
  assert.equal(Art.weaponVisual(a,3.71+h.stow+.001,'walk',3).mode,'sheathed');
  a.attack=.1;assert.equal(Art.weaponVisual(a,3.72+h.stow,'attack',2).mode,'drawn');
  assert.equal(a.attack,.1);
  for(const mode of ['attack','walk','holster'])for(let t=0;t<8;t+=.037){
   const p=W.preview(w.id,t,mode),limit=p.state==='attack'?5:p.state==='sheathe_walk'?47:p.state==='draw_walk'?39:7;
   assert.ok(p.frame>=0&&p.frame<=limit,w.id+':'+mode+':'+p.state+':'+p.frame);assert.ok(p.combo>=0&&p.combo<=3);
  }
 }
 assert.ok(W.holster('brise-givre').stow>W.holster('aiguille-corail').stow);
});

test('strikes carry the grip across the body and thrusts drive a stable point forward',()=>{
 for(const w of W.all){
  for(const dir of [1,2,3]){
   const a=W.pose(w.id,dir,1,0),b=W.pose(w.id,dir,3,0);
   assert.ok(Math.hypot(b.h[0]-a.h[0],b.h[1]-a.h[1])>8,w.id+' is a moving strike, not a wrist spin');
  }
  if(W.finisher(w.id).kind==='lunge'){
   for(const dir of [1,2,3]){
    const a=W.pose(w.id,dir,1,3),b=W.pose(w.id,dir,3,3);
    assert.ok(a.u[0]*b.u[0]+a.u[1]*b.u[1]>.96,w.id+' keeps its thrust point aligned');
   }
  }
  if(['cleave','smash'].includes(W.finisher(w.id).kind)){
   const a=W.pose(w.id,2,1,3),b=W.pose(w.id,2,3,3);
   assert.ok(b.h[1]-a.h[1]>12,w.id+' overhead falls from a raised grip');
  }
 }
});

test('a spear reverse can contact with the visible butt instead of a phantom forward blade',()=>{
 const id='lance-boisclair',p=W.pose(id,1,3,1),actor={x:0,y:0,dir:1,combo:1,weapon:id};
 const target={x:p.h[0]-p.u[0]*6,y:p.h[1]-p.u[1]*6+9,r:.1};
 assert.ok(target.x>p.h[0]);assert.ok(W.hits(actor,target,3));
});
