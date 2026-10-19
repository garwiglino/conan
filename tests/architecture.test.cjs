const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto'),{createCanvas}=require('@napi-rs/canvas');
const A=require('../sprites/architecture/architecture.js'),DATA=require('../sprites/architecture/architecture-data.js'),HUMAN=require('../sprites/architecture/human-reference.js'),WORLD=require('../scripts/architecture-world.js');
const root=path.resolve(__dirname,'..');
test('the full native catalogue covers all buildings, winter counterparts and modules',()=>{
 assert.equal(A.list({kind:'building',season:'base'}).length,106);assert.equal(A.list({season:'winter'}).length,8);assert.equal(A.list({kind:'module'}).length,120);assert.equal(Object.keys(DATA.pixels).length,696);
 assert.equal(HUMAN.height,19);assert.equal(A.scale.human,19);assert.equal(A.scale.tile,16);assert.equal(WORLD.localities.length,83);
 for(const l of WORLD.localities){assert.ok(l.models.every(id=>A.entry(id).kind==='building'));assert.ok(l.optionalFortificationKit.every(id=>A.entry(id).family===l.family));if(l.region==='Sylverive'){assert.equal(l.territory,'Teremor');assert.equal(l.family,'sylverive');}}
 for(const d of A.list({season:'winter'})){const normal=A.entry(d.id.replace('-hiver',''));assert.deepEqual([d.width,d.depth,d.height],[normal.width,normal.depth,normal.height]);}
 assert.deepEqual(A.validate(),{ok:true,errors:[],assets:234,views:696});
});
test('every native view has valid colours, binary alpha and exactly recomposable layers',()=>{
 for(const d of A.list())for(const dir of d.views){
  const p=A.raster(d.id,{dir}),joined=new Uint8Array(p.indices.length),occupied=new Uint8Array(p.indices.length);let nonzero=0;
  assert.equal(p.data.length,p.width*p.height*4);assert.ok(p.anchor.every(Number.isInteger));
  for(let i=0;i<p.indices.length;i++){assert.ok(p.indices[i]<A.palette.length);const alpha=p.data[i*4+3];assert.ok(alpha===0||alpha===255);if(alpha)nonzero++;else assert.deepEqual([...p.data.slice(i*4,i*4+4)],[0,0,0,0]);}
  assert.ok(nonzero>12,d.id+'/'+dir+' is empty or an annotation');
  for(const layer of A.layers){const q=A.pixels(d.id,{dir,layer});for(let i=0;i<q.indices.length;i++)if(q.indices[i]){assert.equal(occupied[i],0,d.id+' layers overlap');occupied[i]=1;joined[i]=q.indices[i];}}
  assert.deepEqual(joined,p.indices,d.id+'/'+dir+' layer reconstruction');
 }
 assert.ok(A.pixels('B13',{layer:'mechanism'}).indices.some(Boolean));assert.ok(A.pixels('B14',{dir:'droite',layer:'mechanism'}).indices.some(Boolean));
});
test('native draw output matches indexed pixels and applies overhead render lift exactly',()=>{
 A.setCanvasFactory(createCanvas);
 for(const [id,dir]of [['T01','face'],['T03','droite'],['T09-hiver','dos'],['TER-H01','ns'],['TER-H03','ns'],['M71','face'],['VAR-H06','ew']]){
  const p=A.raster(id,{dir}),f=A.entry(id).frames[dir],cv=createCanvas(p.width+8,p.height+8);A.draw(cv.getContext('2d'),{id,dir,x:p.anchor[0]+4,y:p.anchor[1]+(f.lift||0)+4});
  assert.deepEqual(cv.getContext('2d').getImageData(4,4,p.width,p.height).data,p.data,id+'/'+dir);
 }
 assert.throws(()=>A.draw(createCanvas(32,32).getContext('2d'),{id:'T01',scale:1.5}),/entière/);
 assert.throws(()=>A.pixels('M71',{dir:'ns'}),/face ou palier/);
});
test('the nine kits attach exactly and their stair route stays passable up to the wall walk',()=>{
 const cases=[...DATA.families.map(f=>[f,'regional']),...['village','bourg','chateau'].map(t=>['teremor',t])];
 for(const [family,tier]of cases){
  const k=A.kitFor(family,tier),wall={id:k.wall,dir:'ew',x:0,y:0},next=A.attach(wall,'east',{id:k.wall,dir:'ew'},'west'),p=A.geometry(wall.id,wall).sockets.find(s=>s.id==='east'),q=A.geometry(next.id,next).sockets.find(s=>s.id==='west');assert.deepEqual([p.x,p.y,p.z,p.width],[q.x,q.y,q.z,q.width]);
  const scene=A.assembly(family,tier),stair=scene.find(o=>A.entry(o.id).shape==='stairs'),rise=A.entry(stair.id).walkHeight;
  for(let y=stair.y-.01;y>=-9;y-=.5){const z=A.standingHeight(scene,stair.x,y);assert.equal(A.collides(scene,stair.x,y,{radius:3,z}),false,family+'/'+tier+' blocked at '+y);assert.ok(z>=0&&z<=rise);}
  assert.equal(A.standingHeight(scene,0,-8),rise);assert.ok(A.collides(scene,40,-2,{radius:2,z:rise}), 'parapet stops a walker outside the stair opening');
  const f=A.entry(stair.id).frames.face;assert.equal(f.size[1],A.entry(stair.id).depth+rise);assert.equal(A.entry(k.wall).frames.ns.lift,rise);
  const top=A.pixels(k.outer,{dir:'ns'});assert.ok(top.indices.slice(0,top.width).some(Boolean));
 }
 assert.throws(()=>A.attach({id:'M49',dir:'ew'},'east',{id:'M65',dir:'ew'},'west'),/Niveaux/);
 assert.throws(()=>A.attach({id:'M65',dir:'ew'},'east',{id:'TER-H01',dir:'ew'},'west'),/Épaisseurs/);
});
test('building rotations share a world plan; gate arches have real clear passages',()=>{
 for(const d of A.list({kind:'building'}))for(const dir of d.views){const g=A.geometry(d.id,{dir});assert.equal(g.foot.w,['droite','gauche'].includes(dir)?d.depth:d.width);assert.equal(g.foot.h,['droite','gauche'].includes(dir)?d.width:d.depth);assert.equal(g.portals.length,d.entrances.length);assert.ok(g.portals.every(p=>p.clearance>=19));}
 for(const id of ['F07','F08','F09','F10','F11']){
  const d=A.entry(id);for(let y=-d.depth+4;y<=-4;y+=4)assert.equal(A.collides([{id,dir:'face',open:1}],0,y,{radius:4}),false,id+' open passage');
  assert.equal(A.collides([{id,dir:'face',open:0}],0,-10,{radius:4}),true);assert.equal(A.collides([{id,dir:'face',open:1}],0,-10,{height:40}),true,id+' lintel clearance');
 }
});
test('pixels render without image, DOM, network or base64 decoding APIs',()=>{
 const sandbox=vm.createContext({HearthreaverArchitectureData:DATA});vm.runInContext(fs.readFileSync(path.join(root,'sprites/architecture/architecture.js'),'utf8'),sandbox);
 assert.equal(sandbox.HearthreaverArchitecture.raster('TAG-C03').height,88);assert.equal(sandbox.HearthreaverArchitecture.validate().ok,true);
 const before=crypto.createHash('sha256').update(A.raster('T01').data).digest('hex');const changed=A.pixels('T01');changed.indices.fill(0);assert.equal(crypto.createHash('sha256').update(A.raster('T01').data).digest('hex'),before);
});
test('engine bridge persists explicit placements and leaves an existing world empty',()=>{
 class Game{initAtlas(){}serialize(){return {version:1};}solid(){return false;}}class Renderer{}
 WORLD.install(Game,Renderer);WORLD.install(Game,Renderer);const g=new Game();g.initAtlas(null);assert.equal(g.architectureProps.length,0);assert.deepEqual(g.serialize(),{version:1});
 const one=g.placeArchitecture('T01',{x:100,y:100,site:'Clairfoyer'});assert.ok(g.solid(100,70,2,0));assert.throws(()=>g.placeArchitecture('T13',{site:'Clairfoyer'}),/famille/);
 const saved=g.serialize(),restored=new Game();restored.initAtlas(saved);assert.deepEqual(restored.architectureProps,g.architectureProps);assert.equal(restored.removeArchitecture(one.uid),true);assert.equal(restored.removeArchitecture(one.uid),false);
 assert.throws(()=>WORLD.restore([{id:'T01',x:Infinity}]),/finies/);assert.throws(()=>WORLD.restore([{id:'bad'}]),/inconnu/);
});
