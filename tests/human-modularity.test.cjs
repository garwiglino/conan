'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),crypto=require('node:crypto'),A=require('../sprites/humains/activites'),R=require('../sprites/humains/rig'),M=A.Modularity,S=require('../sprites/humains/scene');
const digest=v=>crypto.createHash('sha256').update(JSON.stringify(v)).digest('hex');
const roleFor=(sex,action)=>Object.keys(A.ROLES).find(r=>A.ROLES[r].sexes.includes(sex)&&A.activitiesFor(r).includes(action));
test('native arms reconstruct exactly, retain their own colours, and never grow beyond native reach',()=>{
 const original=digest(A.Sources);let combinations=0;
 for(const outfit of Object.values(A.Sources.outfits))for(const dir of A.directions)for(const name of ['right','left']){
  const model=M.profile(outfit,dir,name),rest=new R.Pixels(),hands=new R.Pixels();
  M.arm(rest,hands,model,model.pivot,model.hand);
  const map=pts=>new Map(pts.map(p=>[p[1]*80+p[0],p[2]]));assert.deepEqual(map([...rest.values(),...hands.values()]),new Map(model.points.map(p=>[p.y*80+p.x,p.c])),outfit.id+'/'+dir+'/'+name+' native rest');
  assert.ok(model.reach>=1.5&&model.reach<=3);
  for(const [dx,dy]of [[-30,0],[30,0],[0,-30],[0,30],[15,-15],[.5,.5]]){
   const b=new R.Pixels(),g=new R.Pixels(),arm=M.arm(b,g,model,model.pivot,[model.pivot[0]+dx,model.pivot[1]+dy]);
   assert.ok(Math.hypot(arm.exactHand[0]-model.pivot[0],arm.exactHand[1]-model.pivot[1])<=model.reach+1e-9);
   for(const p of arm.written)assert.ok(model.points.some(q=>q.c===p.c&&q.layer===p.layer&&q.source===p.source),'invented arm pixel/material');
   assert.equal(b.clipped+g.clipped,0);assert.ok(arm.written.length);combinations++;
  }
 }
 assert.equal(R.arm,undefined,'generic tube painter must not be reachable');assert.equal(digest(A.Sources),original);console.log(combinations+' native limb articulations validated.');
});
test('sitting and mounted legs reuse native trousers, hems and boots including fur, sandals and bare legs',()=>{
 for(const outfit of Object.values(A.Sources.outfits))for(const dir of A.directions){
  for(const action of ['seated','ride']){const role=roleFor(outfit.sex,action);if(!role)continue;
   const r=A.renderLayers({role,sex:outfit.sex,outfit:outfit.id,dir,action,frame:0}),legPixels=['riderFarLeg','riderNearLeg','rearLegs'].flatMap(k=>r.layers[k]);
   const allowed=new Set(outfit.layers.filter(l=>['legs','feet'].includes(R.category(l.name))).flatMap(l=>l.views.flatMap(g=>R.decode(g).map(p=>p[2]))));allowed.add('b5b5a0');
   for(const p of legPixels)assert.ok(allowed.has(p[2]),outfit.id+'/'+dir+'/'+action+' generic trouser/boot colour '+p[2]);
   assert.equal(r.metadata.clippedPixels,0);
  }
  const bootModel=M.sourcePoints(outfit,dir,'right','feet'),b=new R.Pixels(),written=M.leg(b,outfit,dir,'right',{hip:[40,48],knee:[42,49],foot:[41,52]});
  assert.ok(written.some(p=>bootModel.some(q=>q.c===p.c&&q.layer===p.layer)),outfit.id+' lost boots');
 }
});
test('individual garments can be mixed or removed without stale hands, colours or source mutation',()=>{
 const original=digest(A.Sources);
 for(const sex of ['masculin','feminin']){
  const base=A.Sources.outfits['T01-'+sex];
  for(const slot of Object.keys(M.SLOT_LABELS))for(const source of [...M.optionsFor(sex,slot),null]){
   const mixed=M.compose(base,{[slot]:source});assert.notEqual(mixed,base);assert.equal(M.compose(base,{[slot]:source}),mixed);
   if(source){assert.ok(mixed.layers.some(l=>M.slot(l)===slot&&l.sourceOutfit===source));assert.ok(mixed.layers.filter(l=>M.slot(l)===slot).every(l=>l.sourceOutfit===source));}
   else assert.ok(mixed.layers.every(l=>M.slot(l)!==slot));
   for(const dir of A.directions){const role=roleFor(sex,'stitch'),r=A.renderLayers({role,sex,parts:{[slot]:source},action:'stitch',dir,frame:3,outfit:base.id});assert.equal(r.metadata.clippedPixels,0,slot+'/'+source);assert.deepEqual(r.metadata.parts,{[slot]:source});}
  }
 }
 assert.throws(()=>M.compose(A.Sources.outfits['T01-feminin'],{sleeves:'kaldor:cotte-mailles'}),/incompatible/);
 assert.throws(()=>M.compose(A.Sources.outfits['T01-masculin'],{unknown:'T01-masculin'}),/inconnue/);
 const a=A.raster({role:'smith',action:'forge',outfit:'T01-masculin',parts:{sleeves:'N04-masculin',gloves:'N04-masculin'}}),b=A.raster({role:'smith',action:'forge',outfit:'T01-masculin'});assert.notDeepEqual(a.data,b.data);
 assert.equal(digest(A.Sources),original);
});
test('every eligible clip, native wardrobe, direction and frame uses the common rig without clipping',()=>{
 const original=digest(A.Sources);let frames=0,combinations=0;
 for(const outfit of Object.values(A.Sources.outfits)){
  for(const [action,c]of Object.entries(A.CLIPS)){
   const role=roleFor(outfit.sex,action);if(!role)continue;combinations++;
   for(const dir of A.directions)for(let frame=0;frame<c.frames;frame++){
    const r=A.renderLayers({role,sex:outfit.sex,outfit:outfit.id,action,frame,dir});assert.equal(r.metadata.clippedPixels,0,outfit.id+'/'+action+'/'+dir+'/'+frame);assert.equal(r.metadata.body,outfit.id);assert.equal(r.metadata.limbSource,'native_garment_pixels');
    for(const point of Object.values(r.metadata.hands))assert.ok(point.every(Number.isFinite));frames++;
   }
  }
 }
 assert.equal(digest(A.Sources),original);assert.equal(combinations,6856);assert.equal(frames,202948);console.log('All '+frames+' frames / '+combinations+' garment–clip combinations passed.');
});
test('mixed clothing follows stationary sockets, tools and approved horse depth in the scene',()=>{
 const parts={sleeves:'kaldor:cotte-mailles',gloves:'N04-masculin',feet:'kaldor:robe-serpent',legs:'A04-masculin'};
 for(const action of ['forge','clear_snow','stoke_fire','deice_trough','ride','mount','seated']){
  const role=roleFor('masculin',action),o={role,action,parts,frame:3},first=S.raster(o);
  assert.equal(first.metadata.compositionClippedPixels,0);assert.deepEqual(first.metadata.parts,parts);
  if(first.metadata.socket)for(const dir of A.directions){const r=S.raster({...o,dir});assert.deepEqual(r.metadata.socket,first.metadata.socket);assert.deepEqual(r.data,first.data);}
 }
});
