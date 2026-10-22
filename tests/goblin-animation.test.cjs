'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),G=require('../sprites/gobelins/gobelin.js'),Native=require('../scripts/gobelins/gobelins.cjs'),C=require('../scripts/gobelins/compile-animation.cjs');
test('rig export preserves every source pixel and only separates already disconnected native shapes',async()=>{
 const S=await Native.sources(),D=Native.data();for(const p of D.personnages){const layers=Native.assemble(S,{...p,arme:null},D),ch=G.DATA.characters[p.id];
  for(let v=0;v<4;v++)for(const l of layers){const actual=ch.views[v].filter(p=>p.name===l.name).flatMap(p=>p.pixels),wanted=[];for(let y=0;y<48;y++)for(let x=0;x<48;x++){const i=(y*48+x)*4;if(l.frames[v][i+3])wanted.push([x,y,'#'+Buffer.from(l.frames[v].subarray(i,i+3)).toString('hex')]);}
   assert.deepEqual(actual.map(p=>JSON.stringify(p)).sort(),wanted.map(p=>JSON.stringify(p)).sort(),p.id+':'+l.name+':'+v);
   const shapes=C.islands(l.frames[v]);for(const piece of ch.views[v].filter(p=>p.name===l.name))if(/^arm|^leg/.test(piece.part))assert.ok(shapes.some(a=>JSON.stringify(a)===JSON.stringify(piece.pixels)),l.name+' native connected shape remains intact');
  }
 }
});
test('every character and clip renders in all views without changing any limb shape or transparency',()=>{
 for(const id of Object.keys(G.DATA.characters))for(const state of Object.keys(G.CLIPS))for(let dir=0;dir<4;dir++)for(let f=0;f<G.CLIPS[state].times.length;f++){
  const r=G.raster(id,state,dir,f);assert.equal(r.width,80);assert.equal(r.height,80);assert.ok(r.data.some((v,i)=>i%4===3&&v));
  const p=r.pose;for(const part of ['body','head','armL','armR','legL','legR'])assert.ok(p[part].length===2&&p[part].every(Number.isInteger),'rig uses integer translation only');
  assert.ok(Math.abs(p.armL[0]-p.body[0])<=3&&Math.abs(p.armR[0]-p.body[0])<=3,'shoulders remain near torso');
 }
});
test('cuts alternate their arc, contact points forward, and the two post-hit drawings continue the signed momentum',()=>{
 for(let dir=0;dir<4;dir++)for(const combo of [0,1,3]){
  const p=[1,2,3,4].map(f=>G.pose('attack',dir,f,combo)),turn=p[1].turn;
  assert.ok((p[1].angle-p[0].angle)*turn>1.5);assert.ok((p[2].angle-p[1].angle)*turn>0);assert.ok((p[3].angle-p[2].angle)*turn>0);
  const forward=[[0,-1],[1,0],[0,1],[-1,0]][dir],v=G.weaponPose(dir,p[1]);assert.ok(v.u[0]*forward[0]+v.u[1]*forward[1]>.999);
  assert.notEqual(G.pose('attack',dir,1,0).turn,G.pose('attack',dir,1,1).turn);
 }
});
test('impact is short and fires once per swing at mobile tick rates; preparation, recoil and interrupted attacks never damage',()=>{
 for(const chief of [false,true])for(const dt of [.04,1/60,1/120])for(let combo=0;combo<4;combo++){
  const e={dir:2,chief,nextCombo:combo};G.start(e);const row=G.times('attack',chief,combo),contact=row[0]+row[1];assert.equal(row[2],.045);let hits=0,t=0;
  while(Number.isFinite(e.swingElapsed)){t+=dt;if(G.advance(e,dt)){hits++;assert.ok(t>=contact-1e-8&&t<contact+dt+1e-8);assert.equal(G.look(e).frame,2);}}
  assert.equal(hits,1);G.start(e);G.advance(e,.04);G.cancel(e);for(let k=0;k<80;k++)assert.equal(G.advance(e,dt),false);
 }
});
test('stationary actors return to idle, death settles, and heavier attacks retain longer anticipation with the same fast hit',()=>{
 const e={dir:1};assert.equal(G.look(e).state,'idle');e.moving=true;assert.equal(G.look(e).state,'walk');e.moving=false;assert.equal(G.look(e).state,'idle');
 e.dead=true;e.deathElapsed=0;for(let k=0;k<100;k++)G.advance(e,.04);assert.equal(G.look(e).frame,4);assert.equal(G.times('attack',true)[2],G.times('attack')[2]);assert.ok(G.times('attack',true)[1]>G.times('attack')[1]*1.5);
});
test('every combo returns to the exact native ready drawing and leads into its preparation from a nearby angle',()=>{
 for(const id of Object.keys(G.DATA.characters))for(let dir=0;dir<4;dir++)for(let combo=0;combo<4;combo++){
  assert.deepEqual(G.raster(id,'attack',dir,5,combo).data,G.raster(id,'idle',dir,0).data,id+':'+dir+':'+combo+' settles without an unrelated weapon pose');
  const angle=G.pose('attack',dir,0,combo).angle+Math.PI/2;assert.ok(Math.abs(Math.atan2(Math.sin(angle),Math.cos(angle)))<.65,'restrained initial tension');
 }
});

test('bounded target aim is shared by the drawn blade and impact, keeps original limb layers, and settles back to idle',()=>{
 const P=require('../scripts/world-projection.js');
 for(let dir=0;dir<4;dir++)for(let combo=0;combo<4;combo++){
  const [x,y]=[[0,-18],[18,0],[0,18],[-18,0]][dir],q=P.inverse(x,y),e={x:0,y:0,dir,skin:'guerrier-kesh',nextCombo:combo},target={x:q.x,y:q.y,r:5};G.start(e,target);
  assert.ok(Math.abs(e.swingAim)<=.66);
  const base=G.pose('attack',dir,2,combo),draw=G.raster(e.skin,'attack',dir,2,combo,{aim:e.swingAim}).pose,expected=G.pose('attack',dir,2,combo,e.swingAim);
  assert.equal(draw.angle,expected.angle);for(const limb of ['body','head','armL','armR','legL','legR'])assert.deepEqual(draw[limb],base[limb]);
  assert.equal(G.pose('attack',dir,5,combo,e.swingAim).angle,G.pose('idle',dir,0).angle);
 }
});
