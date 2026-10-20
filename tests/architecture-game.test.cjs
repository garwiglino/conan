const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{createCanvas}=require('@napi-rs/canvas');
const A=require('../sprites/architecture/architecture-game'),I=require('../sprites/architecture/architecture-isometric'),P=require('../sprites/architecture/isometric-pixels'),Art=require('../scripts/architecture-render');
test('all 696 embedded views are exactly the authored worn native pixels, including seasons and alpha',()=>{
 const h=crypto.createHash('sha256');for(const file of ['isometric-catalogue.js','architecture-isometric.js'])h.update(fs.readFileSync(path.join(__dirname,'../sprites/architecture',file)));assert.equal(h.digest('hex'),P.sourceHash);
 assert.equal(Object.keys(P.frames).length,696);
 for(const d of I.list())for(const dir of d.views){
  const original=I.raster(d.id,{dir,open:0}),compiled=A.raster(d.id,{dir,open:0});assert.deepEqual(compiled.indices,original.indices,d.id+'/'+dir);assert.deepEqual(compiled.data,original.data,d.id+'/'+dir);assert.deepEqual(compiled.layers,original.layers);assert.equal(compiled.width,original.width);assert.equal(compiled.height,original.height);
 }
});
test('collision polygons match the same projected mesh, with free diamond corners and real open halls',()=>{
 const g=A.geometry('T01',{x:100,y:100}),wall=g.solids.find(r=>r.zMin===0&&r.zMax>22&&r.w>20);assert.ok(wall);
 const middle=wall.polygon.reduce((v,p)=>[v[0]+p[0]/4,v[1]+p[1]/4],[0,0]);assert.ok(A.contains(wall,...middle));assert.equal(A.contains(wall,wall.x+.1,wall.y+.1),false);
 for(const id of ['B05','B09','B12']){const d=A.entry(id);assert.ok(d.openHall);const plan=A.geometry(id);assert.ok(plan.workspots.length);assert.ok(plan.workspots.some(p=>!A.collides([{id}],p.x,p.y,{radius:4})),id+' must have an accessible covered work area');}
 const base=A.geometry('T09'),winter=A.geometry('T09-hiver');assert.deepEqual(winter.solids,base.solids);assert.deepEqual(winter.portals,base.portals);
});
test('cached depth slabs recompose the full raster with integer placement and allow actors to interleave',()=>{
 Art.setCanvasFactory(createCanvas);
 for(const id of ['T01','T13','T09-hiver','B09','F06','M53']){
  const p=A.raster(id),cv=createCanvas(p.width+4,p.height+4),renderer={c:cv.getContext('2d')},instance={id,uid:'test-'+id,x:p.anchor[0]+2,y:p.anchor[1]+2};
  const objects=Art.objects(renderer,instance);assert.ok(objects.length>1);assert.ok(new Set(objects.map(o=>o.y)).size>1);
  for(const o of objects.sort((a,b)=>a.y-b.y))o.fn();assert.deepEqual(renderer.c.getImageData(2,2,p.width,p.height).data,p.data,id);
 }
 assert.ok(Art.diagnostics().models<=Art.diagnostics().maxModels);
});
test('compiled-frame results and their metadata cannot be corrupted through returned pixels',()=>{
 const p=A.pixels('T01'),copy=A.pixels('T01');p.indices.fill(0);p.layers.fill(0);p.groundDepth.fill(999);p.anchor[0]=999;assert.deepEqual(A.pixels('T01').indices,copy.indices);assert.deepEqual(A.pixels('T01').anchor,copy.anchor);assert.deepEqual(A.pixels('T01').groundDepth,copy.groundDepth);
});
test('regional wall modules attach on the projected grid with matching walk heights',()=>{
 for(const family of ['teremor','sylverive','igea','sarak','varan','tagon']){
  const kit=A.kitFor(family),first={id:kit.wall,dir:'ew',x:0,y:0},next=A.attach(first,'east',{id:kit.wall,dir:'ew'},'west');assert.deepEqual([next.x,next.y],[48,24]);
  const a=A.geometry(first.id,first).sockets.find(p=>p.id==='east'),b=A.geometry(next.id,next).sockets.find(p=>p.id==='west');assert.deepEqual([a.x,a.y,a.z,a.width],[b.x,b.y,b.z,b.width]);
 }
 assert.throws(()=>A.attach({id:'M49',dir:'ew'},'east',{id:'M65',dir:'ew'},'west'),/Niveaux/);
});
