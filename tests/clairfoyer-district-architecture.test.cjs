'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),crypto=require('node:crypto'),{createCanvas}=require('@napi-rs/canvas');
const A=require('../sprites/architecture/clairfoyer-districts'),Base=require('../sprites/architecture/architecture-isometric'),Art=require('../scripts/architecture-render');
const hash=p=>crypto.createHash('sha256').update(p.indices).digest('hex'),project=p=>({x:p.x-p.y,y:(p.x+p.y)/2});
const collides=(g,x,y)=>g.solids.some(s=>s.zMin<19&&s.zMax>0&&A.contains(s,x,y,5));
test('district assets are separate, cover all eleven sectors and render 144 native views',()=>{
 assert.equal(A.list().length,36);assert.equal(A.list({category:'building'}).length,22);assert.equal(A.list({category:'infrastructure'}).length,14);assert.equal(new Set(A.list().map(d=>d.district)).size,11);
 assert.equal(Base.list().length,234);assert.throws(()=>Base.entry('CF01'),RangeError);assert.equal(A.runtimeActivated,true);
 let views=0;for(const d of A.list()){
  const palettes=A.paletteFor(d.id);assert.equal(palettes.length,81);const rgb=new Set(palettes.slice(1).map(h=>h.toLowerCase()));
  for(const dir of d.views){const p=A.raster(d.id,{dir});views++;assert.deepEqual(p.nativePlan,{width:d.width,depth:d.depth,height:d.height});assert.ok(p.indices.some(Boolean));assert.ok(p.colors<=40,d.id+' stays restrained');
   for(let i=0;i<p.indices.length;i++){const k=i*4;assert.equal(p.data[k+3],p.indices[i]?255:0);if(p.indices[i])assert.ok(rgb.has('#'+Array.from(p.data.slice(k,k+3)).map(n=>n.toString(16).padStart(2,'0')).join('')));}
   const clean=A.raster(d.id,{dir,weather:false});assert.deepEqual(clean.indices.map(n=>n?1:0),p.indices.map(n=>n?1:0));assert.deepEqual(clean.geometry,p.geometry);assert.deepEqual(clean.anchor,p.anchor);
  }
  assert.ok(new Set(d.views.map(dir=>hash(A.raster(d.id,{dir})))).size>=3,d.id+' rotates as a volume');
 }assert.equal(views,144);
});
test('district palettes are distinct authoring ramps, without changing the shared palette',()=>{
 const palettes=Object.values(A.catalogue.districtPalettes);assert.equal(palettes.length,11);assert.equal(new Set(palettes.map(p=>JSON.stringify(p.ramps))).size,11);
 assert.equal(Base.palette[11],'#65544f');assert.notDeepEqual(A.paletteFor('CF03'),A.paletteFor('CF05'));assert.notDeepEqual(A.paletteFor('CF05'),A.paletteFor('CF09'));
 for(const d of A.list())assert.ok(d.paletteLabel.length>10);
});
test('all approaches and work spots remain free for the actual player radius',()=>{
 for(const d of A.list())for(const dir of d.views){const g=A.geometry(d.id,{dir});
  for(const p of g.portals){assert.ok(p.width>=14);assert.ok(p.clearance>=22);assert.equal(collides(g,p.x+p.nx*8,p.y+p.ny*8),false,d.id+'/'+dir+' approach');}
  for(const w of g.workspots)assert.equal(collides(g,w.x,w.y),false,d.id+'/'+dir+' '+w.label);
  assert.ok(g.solids.length);assert.throws(()=>A.geometry(d.id,{dir:'invalid'}),RangeError);
 }
 // A full 32-unit (2 m) corridor, including player clearance, crosses both bays.
 for(const id of ['CF07','CF14'])for(const dir of ['face','droite','dos','gauche']){
  const d=A.entry(id),g=A.geometry(id,{dir}),quarter=d.views.indexOf(dir),ow=quarter%2?d.depth:d.width,od=quarter%2?d.width:d.depth;
  for(let v=-6;v<=d.depth+6;v++)for(const u of [-11,0,11]){const x=d.width/2+u,y=v,q=quarter===0?[x,y]:quarter===1?[d.depth-y,x]:quarter===2?[d.width-x,d.depth-y]:[y,d.width-x];assert.equal(collides(g,q[0]-ow/2,q[1]-od/2),false,id+'/'+dir+' through lane');}
 }
});
test('centred physical footprints, native pixels and depth bands align in every view',()=>{
 const renderer=Art.createRenderer(A.gameAdapter);renderer.setCanvasFactory(createCanvas);
 for(const d of A.list())for(const dir of d.views){const p=A.raster(d.id,{dir}),adapter=A.gameAdapter.pixels(d.id,{dir}),g=A.geometry(d.id,{dir});
  for(let i=0;i<4;i++){const xy=project({x:g.foot.polygon[i][0],y:g.foot.polygon[i][1]});assert.ok(Math.abs(xy.x+adapter.anchor[0]-(p.footprint[i][0]+p.anchor[0]))<1e-6);assert.ok(Math.abs(xy.y+adapter.anchor[1]-(p.footprint[i][1]+p.anchor[1]))<1e-6);}
  const c=createCanvas(p.width+2,p.height+2),r={c:c.getContext('2d'),g:{time:0}},o={id:d.id,dir,x:adapter.anchor[0]+1,y:adapter.anchor[1]+1};
  for(const part of renderer.objects(r,o).sort((a,b)=>a.y-b.y))part.fn();assert.deepEqual(r.c.getImageData(1,1,p.width,p.height).data,p.data,d.id+'/'+dir+' native slabs');
 }
});
test('whole-building fade works in the shared renderer while solid foundations stay blocked',()=>{
 const renderer=Art.createRenderer(A.gameAdapter);renderer.setCanvasFactory(createCanvas);
 for(const id of ['CF01','CF07','CF22'])for(const dir of A.entry(id).views){
  const o={id,dir,x:0,y:0,uid:id+'/'+dir},f=renderer.frame(o),g=A.geometry(id,{dir});let hidden;
  for(let y=g.foot.y-30;y<=g.foot.y+g.foot.h&&!hidden;y+=2)for(let x=g.foot.x-15;x<=g.foot.x+g.foot.w+15;x+=2)if(!collides(g,x,y)&&renderer.obscures(f,o,project({x,y}))){hidden={x,y};break;}
  assert.ok(hidden,id+'/'+dir+' free behind');const r={g:{time:0,player:{x:10000,y:10000}},c:createCanvas(1,1).getContext('2d')};renderer.objects(r,o);r.g.player=project(hidden);let parts;
  for(let i=0;i<72;i++){r.g.time+=1/60;parts=renderer.objects(r,o);}assert.ok(parts.every(p=>p.architectureAlpha>=.32&&p.architectureAlpha<.333));assert.equal(new Set(parts.map(p=>p.architectureAlpha)).size,1);assert.deepEqual(A.geometry(id,{dir}),g);
  r.g.player={x:10000,y:10000};for(let i=0;i<72;i++){r.g.time+=1/60;parts=renderer.objects(r,o);}assert.ok(parts.every(p=>p.architectureAlpha>.99));
  if(id!=='CF07'){const body=g.solids.find(s=>s.zMax-s.zMin>25&&s.w>30&&s.h>30);assert.ok(body);assert.equal(collides(g,body.x+body.w/2,body.y+body.h/2),true);}
 }
});
test('browser workshop has the same geometry and pixel colours without loading legacy game data',()=>{
 const sandbox={};vm.createContext(sandbox);for(const file of ['isometric-catalogue.js','architecture-isometric.js','clairfoyer-district-catalogue.js','clairfoyer-districts.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../sprites/architecture',file),'utf8'),sandbox);
 const browser=sandbox.ClairfoyerDistrictArchitecture;assert.equal(sandbox.Game,undefined);assert.equal(sandbox.Image,undefined);
 for(const id of ['CF01','CF05','CF09','CF11','CF15','CF22','CI12'])for(const dir of A.entry(id).views){assert.equal(JSON.stringify(browser.geometry(id,{dir})),JSON.stringify(A.geometry(id,{dir})));assert.deepEqual(Array.from(browser.raster(id,{dir}).data),Array.from(A.raster(id,{dir}).data));}
});
