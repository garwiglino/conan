'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),{createCanvas}=require('@napi-rs/canvas');
const A=require('../sprites/architecture/architecture-game'),Art=require('../scripts/architecture-render');
const P=require('../scripts/world-projection');
Art.setCanvasFactory(createCanvas);
const projected=o=>({...o,...P.point(o.x,o.y)});
function renderer(g,c){return {g,logicalGame:g,projectionActive:true,c};}
function behind(o,f,free=(x,y)=>!A.collides([o],x,y,{radius:5})){
 const foot=A.geometry(o.id,o).foot;
 for(let y=foot.y-32;y<=foot.y+foot.h;y+=2)for(let x=foot.x;x<=foot.x+foot.w;x+=2)if(free(x,y)&&Art.obscures(f,projected(o),projected({x,y})))return {x,y,level:0,z:0};
 throw Error('No free obscured point for '+o.id+'/'+o.dir);
}
function settle(r,o,seconds=1.2){let objects;for(let i=0;i<=Math.ceil(seconds*60);i++){r.g.time+=1/60;objects=Art.objects(r,o);}return objects;}
test('only real upper pixels in front of the player trigger transparency, across rotations and snow',()=>{
 for(const id of ['T01','T09-hiver','F06','SAR-H01'])for(const dir of A.entry(id).views){
  const o={id,dir,x:180,y:240,uid:id+'/'+dir},f=Art.frame(o),p=behind(o,f);assert.equal(A.collides([o],p.x,p.y,{radius:5}),false);assert.equal(Art.obscures(f,projected(o),projected(p)),true);
  assert.equal(Art.obscures(f,o,{x:o.x,y:o.y+25}),false,'player in front');assert.equal(Art.obscures(f,projected(o),projected({...p,level:1})),false,'upper game level draws above architecture');
  assert.equal(Art.obscures(f,o,{x:o.x+500,y:p.y}),false,'distant player');assert.equal(Art.obscures(f,o,{x:o.x,y:o.y-500}),false,'no overlap');
 }
});
test('opacity fades smoothly per instance and restores without leaking Canvas state or changing position',()=>{
 const o={id:'T01',dir:'face',uid:'one',x:180,y:240},p=behind(o,Art.frame(o)),r=renderer({player:{...p},time:0},createCanvas(400,300).getContext('2d'));
 const hidden={...r.g.player};Object.assign(r.g.player,{x:o.x,y:o.y+25});let first=Art.objects(r,o).find(c=>c.architectureUpper).architectureAlpha;assert.equal(first,1);Object.assign(r.g.player,hidden);r.g.time+=1/60;let second=Art.objects(r,o).find(c=>c.architectureUpper).architectureAlpha;assert.ok(second<first&&second>.32);
 assert.ok(Math.abs(second-(1+(.32-1)*(1-Math.pow(.004,1/60))))<1e-12,'same fade curve as the starting deck');
 const faded=settle(r,o);assert.ok(faded.every(c=>c.architectureAlpha>=.32&&c.architectureAlpha<.333));assert.equal(new Set(faded.map(c=>c.architectureAlpha)).size,1,'whole house fades together, including the base');
 const twin={...o,uid:'two',x:580};assert.equal(Art.frame(twin),Art.frame(o),'native cache is shared');assert.ok(Art.objects(r,twin).every(c=>c.architectureAlpha===1),'opacity is not shared');
 r.c.globalAlpha=.7;const savedAlpha=r.c.globalAlpha;for(const c of faded)c.fn();assert.equal(r.c.globalAlpha,savedAlpha);assert.deepEqual(r.g.player,p,'rendering never moves the player');
 Object.assign(r.g.player,{x:o.x,y:o.y+25});assert.ok(settle(r,o).every(c=>c.architectureAlpha>.99));
});
test('the entire house fades to the deck opacity while its solid foundations stay unchanged',()=>{
 const id='T01',p=A.raster(id),o={id,uid:'base',...P.inverse(p.anchor[0]+2,p.anchor[1]+2)},f=Art.frame(o),hidden=behind(o,f),before=A.geometry(id,o),r=renderer({player:hidden,time:0},createCanvas(p.width+4,p.height+4).getContext('2d'));
 const faded=settle(r,o);for(const c of faded)c.fn();const out=r.c.getImageData(2,2,p.width,p.height).data;let base=0,upper=0;
 for(let i=0;i<p.indices.length;i++)if(p.indices[i]){if(f.upper[i]){assert.ok(out[i*4+3]>=80&&out[i*4+3]<=84);upper++;}else{assert.ok(out[i*4+3]>=80&&out[i*4+3]<=84);base++;}}
 assert.ok(base>0&&upper>0);assert.deepEqual(A.geometry(id,o),before);const body=before.solids.find(s=>s.zMin===0&&s.zMax>22&&s.w>30),middle=body.polygon.reduce((v,a)=>[v[0]+a[0]/4,v[1]+a[1]/4],[0,0]);
 assert.equal(A.collides([o],...middle,{radius:5}),true);assert.equal(A.collides([o],hidden.x,hidden.y,{radius:5}),false);
});
test('the actual game allows movement behind a faded house and still rejects walking through its foundation',async()=>{
 const {loadGame}=require('./game-harness.cjs'),api=await loadGame(),g=new api.Game();let o,p;
 for(const b of g.settlements.buildings){if(!A.catalogue[b.id])continue;if(A.entry(b.id).openHall)continue;try{const f=Art.frame(b);p=behind(b,f,(x,y)=>!g.solid(x,y,5,0));o=b;break;}catch{}}
 assert.ok(o);Object.assign(g.player,p);const r=renderer(g,createCanvas(1,1).getContext('2d'));assert.ok(settle(r,o).some(c=>c.architectureAlpha<.33));
 const old={x:g.player.x,y:g.player.y};let moved=false;for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){if(g.solid(old.x+dx*3,old.y+dy*3,5,0))continue;g.move(g.player,dx*2,dy*2);moved=Math.hypot(g.player.x-old.x,g.player.y-old.y)>.1;if(moved)break;}assert.ok(moved,'walkable area behind the building');
 const body=o.geometry.solids.find(s=>s.zMin===0&&s.zMax>22&&s.w>30),target=body.polygon.reduce((v,a)=>[v[0]+a[0]/4,v[1]+a[1]/4],[0,0]);assert.equal(g.solid(...target,5,0),true);
 for(let i=0;i<150;i++){const dx=target[0]-g.player.x,dy=target[1]-g.player.y,len=Math.hypot(dx,dy);if(len<1)break;g.move(g.player,dx/len*1.2,dy/len*1.2);assert.equal(g.solid(g.player.x,g.player.y,5,0),false,'foundation remains impassable during movement');}
 assert.ok(Math.hypot(g.player.x-target[0],g.player.y-target[1])>8);
});
