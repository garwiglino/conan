const {test}=require('node:test'),assert=require('node:assert/strict'),crypto=require('node:crypto'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),{createCanvas}=require('@napi-rs/canvas');
const A=require('../sprites/architecture/architecture-isometric.js'),catalog=require('../data/architecture/catalogue.json');
const digest=p=>crypto.createHash('sha256').update(p.indices).digest('hex');
test('the whole catalogue renders at its declared native scale with binary transparency',()=>{
 assert.equal(A.list().length,234);assert.deepEqual(A.scale,{human:19,tile:16,door:22});assert.equal(A.palette.length,81);
 let views=0;for(const d of A.list()){
  assert.deepEqual([d.width,d.depth,d.height],[catalog.assets[d.id].width,catalog.assets[d.id].depth,catalog.assets[d.id].height]);
  for(const dir of d.views){const p=A.raster(d.id,{dir});views++;assert.ok(p.indices.some(Boolean),d.id);assert.deepEqual(p.nativePlan,{width:d.width,depth:d.depth,height:d.height});assert.equal(p.data.length,p.width*p.height*4);assert.ok(p.anchor.every(Number.isFinite));
   for(let i=0;i<p.indices.length;i++){assert.ok(p.indices[i]<A.palette.length);assert.equal(p.data[i*4+3],p.indices[i]?255:0);}
  }
 }assert.equal(views,696);
});
test('both floor axes have regular opposite 2:1 slopes, with unchanged human height',()=>{
 assert.deepEqual(A.project(16,0,0),[16,8]);assert.deepEqual(A.project(0,16,0),[-16,8]);assert.deepEqual(A.project(0,0,19),[0,-19]);
 const p=A.raster('TER-H01'),next=A.project(48,0,0);assert.deepEqual(p.footprint[1],next);
 const q=A.raster('TER-H01',{dir:'ns'});assert.equal(Math.abs(q.footprint[1][0]),48);assert.equal(Math.abs(q.footprint[1][1]),24);
});
test('winter is only a palette and snow-layer change on exactly the same native geometry',()=>{
 for(const d of A.list({season:'winter'}))for(const dir of d.views){const summer=A.raster(d.id.replace('-hiver',''),{dir}),snow=A.raster(d.id,{dir});
  assert.deepEqual(snow.geometry,summer.geometry,d.id+'/'+dir);assert.deepEqual(snow.footprint,summer.footprint);assert.deepEqual(snow.anchor,summer.anchor);
  assert.equal(snow.width,summer.width);assert.equal(snow.height,summer.height);
  assert.deepEqual(snow.indices.map(c=>c?1:0),summer.indices.map(c=>c?1:0));assert.notEqual(digest(snow),digest(summer));assert.ok(snow.layers.some(v=>v===5));
 }
});
test('a building turns as one object rather than receiving a fresh facade in each view',()=>{
 for(const d of A.list({kind:'building'})){
  const ps=d.views.map(dir=>A.raster(d.id,{dir}));for(const p of ps)assert.deepEqual(p.geometry,ps[0].geometry,d.id);
  assert.ok(new Set(ps.map(digest)).size>=3,d.id+' must visibly turn');
 }
});
test('doors admit the 19px human and tall stairs reach their declared walkway',()=>{
 for(const d of A.list({kind:'building'})){const p=A.raster(d.id);for(const opening of p.geometry.openings)assert.ok(opening.clearance>=22,d.id);}
 for(const id of ['M55','M63','M71','TER-H07','SAR-H07','VAR-H07']){
  const d=A.entry(id),base=A.raster(id),landing=A.raster(id,{dir:'palier'});assert.equal(base.geometry.stairs[0].rise,d.walkHeight);assert.equal(landing.geometry.stairs[0].landing,16);assert.notEqual(digest(base),digest(landing));
 }
});
test('layers partition the final native drawing and mechanisms can move independently',()=>{
 for(const id of ['T01','T09-hiver','B13','B14','F08','SAR-H07']){const full=A.raster(id),joined=new Uint8Array(full.indices.length);for(const layer of ['wall','roof','detail','mechanism','snow']){const p=A.raster(id,{layer});for(let i=0;i<p.indices.length;i++)if(p.indices[i]){assert.equal(joined[i],0);joined[i]=p.indices[i];}}assert.deepEqual(joined,full.indices);}
 assert.ok(A.raster('B14',{layer:'mechanism'}).indices.some(Boolean));assert.notEqual(digest(A.raster('B13',{mechanismFrame:0})),digest(A.raster('B13',{mechanismFrame:1})));
});
test('Canvas drawing equals transparent raster export, only integer zoom is accepted, and cache stays private',()=>{
 for(const id of ['T01','T13','F06','M53','SAR-H07']){const p=A.raster(id),cv=createCanvas(p.width+4,p.height+4);A.draw(cv.getContext('2d'),{id,x:p.anchor[0]+2,y:p.anchor[1]+2});assert.deepEqual(cv.getContext('2d').getImageData(2,2,p.width,p.height).data,p.data);}
 const p=A.raster('T01'),h=digest(p);p.indices.fill(0);p.anchor[0]=999;p.geometry.parts.length=0;assert.equal(digest(A.raster('T01')),h);assert.notEqual(A.raster('T01').anchor[0],999);
 assert.throws(()=>A.draw(createCanvas(1,1).getContext('2d'),{id:'T01',scale:1.5}),/entier/);assert.throws(()=>A.raster('T01',{dir:'up'}),/Vue/);
});
test('renderer works in a standalone browser global with no DOM, image file or old renderer',()=>{
 const sandbox={};vm.createContext(sandbox);for(const name of ['isometric-catalogue.js','architecture-isometric.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../sprites/architecture',name),'utf8'),sandbox);
 assert.equal(sandbox.HearthreaverIsometric.raster('T01').projection,'dimetric-2:1');assert.equal(sandbox.Image,undefined);assert.equal(sandbox.Game,undefined);
});

test('weathering turns with the local geometry and preserves its scale, alpha and cache independence',()=>{
 for(const id of ['T01','T13','T17','F06','T09-hiver'])for(const dir of A.entry(id).views){
  const worn=A.raster(id,{dir}),clean=A.raster(id,{dir,weather:false});
  assert.equal(worn.width,clean.width);assert.equal(worn.height,clean.height);assert.deepEqual(worn.geometry,clean.geometry);assert.deepEqual(worn.footprint,clean.footprint);assert.deepEqual(worn.anchor,clean.anchor);
  assert.deepEqual(worn.indices.map(v=>v?1:0),clean.indices.map(v=>v?1:0));assert.notEqual(digest(worn),digest(clean));
  assert.equal(digest(A.raster(id,{dir})),digest(worn));
 }
});
