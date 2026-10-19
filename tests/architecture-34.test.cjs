const {test}=require('node:test'),assert=require('node:assert/strict'),crypto=require('node:crypto'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path'),{createCanvas}=require('@napi-rs/canvas');
const A=require('../sprites/architecture/architecture-34.js'),B=require('../sprites/architecture/architecture.js');
const digest=p=>crypto.createHash('sha256').update(p.data).digest('hex');
test('all 234 original identities, regional families, functions and 696 directions have three-quarter art',()=>{
 assert.deepEqual(A.list().map(d=>[d.id,d.family,d.label,d.season]),B.list().map(d=>[d.id,d.family,d.label,d.season]));
 assert.deepEqual(A.validate(),{ok:true,assets:234,views:696,errors:[]});assert.equal(A.scale.human,19);assert.equal(A.scale.tile,16);
 for(const d of A.list())for(const dir of d.views){const p=A.raster(d.id,{dir});assert.ok(p.width>0&&p.height>0);assert.equal(p.data.length,p.width*p.height*4);assert.equal(p.nativePlan.height,d.height);assert.ok(p.anchor.every(Number.isFinite));assert.equal(p.footprint.length,4);for(let i=0;i<p.indices.length;i++){assert.ok(p.indices[i]<A.palette.length);assert.equal(p.data[i*4+3],p.indices[i]?255:0);}}
});
test('depth is a real shared orthographic displacement and native vertical height stays unchanged',()=>{
 assert.deepEqual(A.project(48,0,0),[48,-0]);assert.deepEqual(A.project(0,48,0),[24,-24]);assert.deepEqual(A.project(0,0,19),[0,-19]);
 for(const family of ['TER','SYL','IGE','SAR','VAR','TAG']){const ew=A.pixels(family+'-H01',{dir:'ew'}),ns=A.pixels(family+'-H01',{dir:'ns'});assert.deepEqual(ew.nativePlan,{width:48,depth:16,height:64});assert.deepEqual(ns.nativePlan,{width:16,depth:48,height:64});const next=A.project(48,0),edge=ew.footprint[1];assert.deepEqual([ew.footprint[0][0]+next[0],ew.footprint[0][1]+next[1]],edge);const stair=A.pixels(family+'-H07');assert.ok(stair.height>52);assert.ok(stair.height<116);}
});
test('four oriented buildings remain distinct, and winter counterparts share the same ground plan',()=>{
 for(const d of A.list({kind:'building'})){assert.equal(new Set(d.views.map(dir=>digest(A.raster(d.id,{dir})))).size,4,d.id);}
 for(const d of A.list({season:'winter'}))for(const dir of d.views){const p=A.raster(d.id,{dir}),summer=A.raster(d.id.replace('-hiver',''),{dir});assert.deepEqual(p.nativePlan,summer.nativePlan);assert.deepEqual(p.footprint,summer.footprint);assert.notEqual(digest(p),digest(summer));assert.ok(A.raster(d.id,{dir,layer:'snow'}).indices.some(Boolean));}
 for(const family of ['TER','SYL','IGE','SAR','VAR','TAG'])assert.notEqual(digest(A.raster(family+'-H03')),digest(A.raster(family+'-H04')));
});
test('all projected layers are disjoint and recombine exactly; mills retain mechanisms',()=>{
 for(const d of A.list())for(const dir of d.views){const full=A.raster(d.id,{dir}),joined=new Uint8Array(full.indices.length);for(const layer of ['back','roof','front','mechanism','snow']){const p=A.raster(d.id,{dir,layer});for(let i=0;i<p.indices.length;i++)if(p.indices[i]){assert.equal(joined[i],0);joined[i]=p.indices[i];}}assert.deepEqual(joined,full.indices);}
 assert.ok(A.raster('B13',{layer:'mechanism'}).indices.some(Boolean));assert.ok(A.raster('B14',{dir:'face',layer:'mechanism'}).indices.some(Boolean));
});
test('integer Canvas rendering is identical to transparent export, and returned pixels cannot corrupt cache',()=>{
 for(const id of ['T01','T09-hiver','T13','T17','B13','TER-H03','TER-H07']){const p=A.raster(id),cv=createCanvas(p.width+4,p.height+4);A.draw(cv.getContext('2d'),{id,x:p.anchor[0]+2,y:p.anchor[1]+2});assert.deepEqual(cv.getContext('2d').getImageData(2,2,p.width,p.height).data,p.data);}
 const hash=digest(A.raster('T01')),p=A.pixels('T01');p.indices.fill(0);p.anchor[0]=999;p.footprint[0][0]=999;assert.equal(digest(A.raster('T01')),hash);assert.notEqual(A.pixels('T01').anchor[0],999);
 assert.throws(()=>A.draw(createCanvas(2,2).getContext('2d'),{id:'T01',scale:1.5}),/entier/);
});
test('three-quarter library runs without image loading, DOM or engine integration',()=>{
 const context={};vm.createContext(context);for(const name of ['architecture-data.js','architecture.js','architecture-34.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../sprites/architecture',name),'utf8'),context);
 assert.equal(context.HearthreaverArchitecture34.raster('T13').projection,'orthographic-oblique-3/4');assert.equal(context.Game,undefined);assert.equal(context.Image,undefined);

});
