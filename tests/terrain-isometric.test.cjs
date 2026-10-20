'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),crypto=require('node:crypto'),{createCanvas}=require('@napi-rs/canvas');
const T=require('../sprites/terrain/terrain-isometric'),A=require('../sprites/architecture/architecture-isometric'),S=require('../sprites/terrain/terrain-isometric-scene');
test('ground, relief and architecture share exactly the same projection and native scale',()=>{
 for(const p of [[0,0,0],[16,0,0],[0,16,0],[64,56,32],[-18,31,17]]){assert.deepEqual(T.project(...p),A.project(...p));const q=T.project(...p);assert.deepEqual(T.unproject(...q,p[2]),p.slice(0,2));}
 assert.equal(T.SIZE,16);assert.deepEqual(T.project(16,0),[16,8]);
});
test('all atlas families have complete topology, four access directions, heights and native binary pixels',()=>{
 const defs=T.list();assert.equal(defs.length,1837);assert.equal(new Set(defs.map(d=>d.id)).size,defs.length);
 for(const f of T.families){
  for(const k of ['path','pavedPath','river','shore','bareEdge','snowEdge'])assert.deepEqual(T.list({family:f,kind:k}).map(d=>d.mask),Array.from({length:16},(_,i)=>i));
  for(const d of T.list({family:f})){
   const im=T.raster(d);assert.ok(im.width>0&&im.height>0,d.id);assert.equal(im.data.length,im.width*im.height*4);let visible=0;
   for(let i=0;i<im.indices.length;i++){assert.ok(im.indices[i]<T.palette.length,d.id);assert.equal(im.data[i*4+3],im.indices[i]?255:0,d.id);if(im.indices[i])visible++;}assert.ok(visible,d.id);
   for(const face of im.surfaces)for(const p of face.vertices)assert.ok(p.every(Number.isFinite),d.id);
  }
 }
});
test('neighbouring projected ground tiles cover the plane exactly once with continuous world textures',()=>{
 const cv=createCanvas(130,80),c=cv.getContext('2d'),family='grass',d=T.definition(family,'ground');
 for(let v=0;v<3;v++)for(let u=0;u<3;u++){const [x,y]=T.project(u*16,v*16);T.draw(c,d,x+64,y+8,{x:u*16,y:v*16});}
 const pixels=c.getImageData(0,0,130,80).data;
 for(let y=0;y<80;y++)for(let x=0;x<130;x++){
  const [u,v]=T.unproject(x+.5-64,y+.5-8),inside=u>=0&&v>=0&&u<48&&v<48,i=(y*130+x)*4;
  assert.equal(pixels[i+3],inside?255:0,`${x},${y}`);
  if(inside){const tx=Math.floor(u/16)*16,ty=Math.floor(v/16)*16,expected=T.palette[T.top(d,u-tx,v-ty,tx,ty)];assert.equal('#'+Array.from(pixels.slice(i,i+3),v=>v.toString(16).padStart(2,'0')).join(''),expected);}
 }
});
test('paths and rivers join on all ground edges without changing their material at tile borders',()=>{
 for(const family of T.families)for(const kind of ['path','pavedPath','river'])for(let t=.25;t<16;t+=.5){
  const a=T.definition(family,kind,10),b=T.definition(family,kind,5);
  assert.equal(T.top(a,16,t,32,48),T.top(a,0,t,48,48),`${family}/${kind} E/W`);
  assert.equal(T.top(b,t,16,32,48),T.top(b,t,0,32,64),`${family}/${kind} N/S`);
 }
});
test('cliffs and steps use real Z and keep vertical height independent of screen projection',()=>{
 const d=T.definition('grass','cliff',6,32),im=T.raster(d);assert.equal(im.height,48);assert.equal(im.width,32);assert.equal(im.elevation,32);
 for(const dir of [0,1,2,3]){const faces=T.geometry(T.definition('snow','stairs',0,32,dir));const zs=new Set(faces.flatMap(f=>f.v.map(v=>v[2])));for(const z of [0,4,8,12,16,20,24,28,32])assert.ok(zs.has(z));}
});
test('review scenes use actual building dimensions and remain deterministic across revisits',()=>{
 const digest=buf=>crypto.createHash('sha256').update(buf).digest('hex'),render=()=>{const cv=createCanvas(800,520);S.render(cv.getContext('2d'),S.makeMap('grass'));return cv.toBuffer('image/png');};assert.equal(digest(render()),digest(render()));
 for(const family of T.families){const m=S.makeMap(family);for(const h of m.houses){const d=A.entry(h.id);assert.equal(h.width,d.width);assert.equal(h.depth,d.depth);}assert.ok(m.cells.some(c=>c.kind==='bridge'));assert.ok(m.cells.some(c=>c.kind==='waterfall'));}
});
test('real atlas excerpts retain terrain codes and analytic roads rather than staircase autotiles',async()=>{
 const atlas=require('../scripts/world-model')(require('../data/world/atlas.json')),point=atlas.roads.find(r=>r.type!=='searoutes').segments[0].a,map=S.extractAtlas(atlas,Math.floor(point[0])-3,Math.floor(point[1])-3,6,6);
 for(const c of map.cells){assert.equal(c.sourceCode,atlas.terrain(map.atlasRect.x+c.x,map.atlasRect.y+c.y));assert.ok(Array.isArray(c.routes));for(const r of c.routes)assert.ok(r.width>0);}
 const d={family:'grass',kind:'path',mask:0,routes:[{a:[0,0],b:[64,64],width:4}]},empty={family:'grass',kind:'ground'};
 // A diagonal goes through each tile corner; neither a centre dot nor a zigzag.
 for(let s=0;s<48;s+=.5){const tile=Math.floor(s/16)*16;assert.notEqual(T.top(d,s-tile,s-tile,tile,tile),T.top(empty,s-tile,s-tile,tile,tile));assert.equal(T.top(d,s-tile,s-tile+8,tile,tile),T.top(empty,s-tile,s-tile+8,tile,tile));}
});
