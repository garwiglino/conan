'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),crypto=require('node:crypto'),A=require('../sprites/humains/activites'),R=require('../sprites/humains/rig'),S=require('../sprites/humains/scene');
const hats=[...new Set([...Object.keys(A.HEADGEAR).filter(h=>h!=='native'),...Object.keys(A.Sources.helmets),...Object.entries(A.Sources.modules).filter(([,m])=>m.kind==='hat').map(([id])=>id)])];
const digest=v=>crypto.createHash('sha256').update(JSON.stringify(v)).digest('hex');
const roleFor=(sex,action)=>Object.keys(A.ROLES).find(r=>A.ROLES[r].sexes.includes(sex)&&A.activitiesFor(r).includes(action));
test('all headgear masks follow the same head transform; hidden editor masks never become visible pixels',()=>{
 const original=digest(A.Sources);
 for(const sex of ['masculin','feminin'])for(const hat of hats)for(const dir of A.directions)for(const action of ['idle','stitch','seated','sleep','death']){
  const role=roleFor(sex,action);if(!role)continue;const frame=Math.min(3,A.CLIPS[action].frames-1),options={role,sex,hat,dir,action,frame,age:'age',hair:sex==='masculin'?'02':'03',beard:sex==='masculin'?'B03':null,moustache:sex==='masculin'?'M02':null},r=A.renderLayers(options),o=A.normalize(options),pose=R.pose(action,frame);if(pose.seated)pose.rootY=Math.round(pose.seated);const mask=R.headgear(hat,dir,pose,{...o.r,climate:o.climate}).mask;
  if(!pose.angle){const transform=R.bodyTransform(pose,dir,'head'),points=A.Sources.modules[sex+'-hair-'+(sex==='masculin'?'02':'03')].layers.flatMap(l=>R.decode(l.views[A.directions.indexOf(dir)]));
   // A hair pixel inside the coiffe's mask must have been removed from every
   // hair plane before composition, regardless of its front/back editor layer.
   const hair=new Set(['hairBack','hairMid','hairFront'].flatMap(k=>r.layers[k].map(p=>p[1]*80+p[0])));for(const [x,y]of points){const [X,Y]=transform(x,y),key=Y*80+X;if(mask.map.has(key))assert.ok(!hair.has(key),hat+'/'+action+' hair through mask');}
  }
  const native=A.Sources.helmets[hat]||A.Sources.modules[hat];if(native){const allowed=new Set(native.layers.filter(l=>!/MASQUE/.test(l.name)).flatMap(l=>l.views.flatMap(g=>R.decode(g).map(p=>p[2]))));for(const p of [...r.layers.hatRear,...r.layers.hatFront])assert.ok(allowed.has(p[2]),hat+' editor mask leaked');}
  assert.equal(r.metadata.clippedPixels,0);
 }
 const o={role:'civilian',sex:'feminin',hair:'03',hat:null};const a=A.raster(o).data;for(const hat of hats)A.raster({...o,hat,action:'seated'});assert.deepEqual(A.raster(o).data,a);assert.equal(digest(A.Sources),original);
});
test('coiffes stay on the same head with mixed garments, functional sockets and approved mounted poses',()=>{
 for(const hat of hats)for(const [role,action]of [['smith','forge'],['cook','stoke_fire'],['groom','ride'],['groom','mount'],['civilian','sleep'],['civilian','seated']]){
  const parts={sleeves:'N04-masculin',gloves:'kaldor:cotte-mailles',feet:'kaldor:robe-serpent'},options={role,action,parts,hat,frame:3},r=S.raster(options);assert.equal(r.metadata.hat,hat);assert.equal(r.metadata.clippedPixels,0);assert.equal(r.metadata.compositionClippedPixels,0);
  if(r.metadata.socket)for(const dir of A.directions)assert.deepEqual(S.raster({...options,dir}).data,r.data,hat+' fixed fixture changed head orientation');
 }
});
test('all 55 headgear variants render every eligible clip frame in four directions for both human bodies',()=>{
 let count=0,combinations=0;const original=digest(A.Sources);
 for(const sex of ['masculin','feminin'])for(const [action,c]of Object.entries(A.CLIPS)){
  const role=roleFor(sex,action);if(!role)continue;
  for(const hat of hats){combinations++;for(const dir of A.directions)for(let frame=0;frame<c.frames;frame++){
   const r=A.renderLayers({role,sex,hat,dir,action,frame,age:frame%3===1?'age':frame%3===2?'mur':'adulte',hair:frame%2?(sex==='masculin'?'02':'03'):'01',beard:sex==='masculin'?'B03':null,moustache:sex==='masculin'?'M02':null});
   assert.equal(r.metadata.hat,hat);assert.equal(r.metadata.clippedPixels,0,hat+'/'+sex+'/'+action+'/'+dir+'/'+frame);assert.ok(r.layers.hatFront.length+r.layers.hatRear.length,hat+'/'+action+' lost headgear');count++;
  }}
 }
 assert.equal(hats.length,55);const expected=hats.length*['masculin','feminin'].reduce((total,sex)=>total+Object.values(A.CLIPS).filter(c=>roleFor(sex,c.id)).reduce((n,c)=>n+c.frames*4,0),0);assert.equal(count,expected);assert.equal(digest(A.Sources),original);console.log(count+' headgear frames / '+combinations+' coiffe–body–clip combinations passed.');
});

test('all native hairstyles and facial hair variants remain reversible under each coiffe',()=>{
 const original=digest(A.Sources);let n=0;
 for(const sex of ['masculin','feminin'])for(const id of Object.keys(A.Sources.modules).filter(id=>id.startsWith(sex+'-hair-')))for(const hat of hats)for(const dir of A.directions)for(const age of ['adulte','mur','age']){
  const o={role:'civilian',sex,hair:id.slice(-2),hat,dir,age,action:'greet',frame:3},r=A.renderLayers(o),pose=R.pose('greet',3),mask=R.headgear(hat,dir,pose,{climate:'tempere'}).mask;
  for(const k of ['hairBack','hairMid','hairFront'])for(const [x,y]of r.layers[k])assert.ok(!mask.map.has(y*80+x),id+'/'+hat+' overlaps hair mask');assert.equal(r.metadata.clippedPixels,0);n++;
 }
 for(const id of Object.keys(A.Sources.modules).filter(id=>/^[BM]\d{2}$/.test(id)))for(const hat of hats)for(const dir of A.directions){const o={role:'civilian',hat,dir,action:'seated',frame:0,[id[0]==='B'?'beard':'moustache']:id},a=A.raster({...o,hat:null}).data;const r=A.raster(o);assert.equal(r.metadata.clippedPixels,0);assert.deepEqual(A.raster({...o,hat:null}).data,a);n++;}
 assert.equal(digest(A.Sources),original);console.log(n+' hairstyle/facial-hair checks passed.');
});

test('sleeping and fallen figures retain every native coiffe pixel, including tall crests',()=>{
 for(const hat of hats)for(const dir of A.directions)for(const action of ['sleep','death']){
  const frame=action==='sleep'?0:A.CLIPS.death.frames-1,r=A.renderLayers({role:'civilian',hat,dir,action,frame}),source=R.headgear(hat,dir,R.pose(action,frame),{climate:'tempere'});
  assert.equal(r.layers.hatRear.length,source.rear.values().length,hat+'/'+dir+'/'+action+' rear crest cropped');assert.equal(r.layers.hatFront.length,source.front.values().length,hat+'/'+dir+'/'+action+' front crest cropped');
 }
});
