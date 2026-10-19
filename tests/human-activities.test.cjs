'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const A=require('../sprites/humains/activites'),R=require('../sprites/humains/rig'),root=path.resolve(__dirname,'..');
test('every planned activity has an eligible function and compatible equipment',()=>{
 const used=new Set();for(const [role,r]of Object.entries(A.ROLES)){
  const list=A.activitiesFor(role);for(const id of list){assert.ok(A.CLIPS[id],role+'/'+id);used.add(id);}
  assert.ok(list.includes('flee'));assert.ok(list.includes('surrender'));
  if(!r.weapon){assert.ok(list.every(id=>!A.isAttack(id)));assert.ok(!list.includes('armed_walk'));}
  if(!r.shield)for(const id of ['guard_hold','guard_raise','block','guard_break'])assert.ok(!list.includes(id));
  if(r.group==='military'||r.group==='transport'||['miner','quarrier','smith','forester','builder','shipwright','glassworker','charcoal_burner','tanner'].includes(role))assert.deepEqual(r.sexes,['masculin']);
 }
 assert.deepEqual([...used].sort(),Object.keys(A.CLIPS).sort());
 assert.throws(()=>A.raster({role:'miner',sex:'feminin'}),/non autorisé/);
 assert.throws(()=>A.raster({role:'healer',action:'blade_cut'}),/incompatible/);
 assert.ok(!A.activitiesFor('sarak_cavalry').includes('mounted_cut'));
 assert.ok(A.activitiesFor('sarak_cavalry_blade').includes('mounted_cut'));
});
test('all frames and directions draw without clipping, using binary alpha',()=>{
 let frames=0;for(const [action,c]of Object.entries(A.CLIPS)){
  const role=Object.keys(A.ROLES).find(r=>A.activitiesFor(r).includes(action));
  for(const dir of A.directions)for(let frame=0;frame<c.frames;frame++){
   const image=A.raster({role,action,frame,dir});assert.equal(image.metadata.clippedPixels,0,role+'/'+action+'/'+dir+'/'+frame);
   assert.ok(image.data.some(v=>v));for(let i=3;i<image.data.length;i+=4)assert.ok(image.data[i]===0||image.data[i]===255);
   for(const [name,hand]of Object.entries(image.metadata.hands)){const elbow=image.metadata.elbows[name];if(elbow)assert.ok(Math.hypot(hand[0]-elbow[0],hand[1]-elbow[1])<=5,'forearm within native reach');}frames++;
  }
 }assert.ok(frames>3500);console.log('Reviewed '+frames+' directional frames.');
});
test('all roles work with every permitted body and five climate wardrobes',()=>{
 for(const [role,r]of Object.entries(A.ROLES))for(const sex of r.sexes)for(const climate of Object.keys(A.CLIMATES))for(const dir of A.directions){
  const action=r.armed?'armed_idle':r.activities.find(a=>A.CLIPS[a])||'idle',image=A.raster({role,sex,climate,dir,action,frame:0,scene:false});
  assert.equal(image.metadata.sex,sex);assert.equal(image.metadata.climate,climate);assert.ok(image.metadata.body);assert.equal(image.metadata.clippedPixels,0);
 }
});
test('native anatomy, faces and hair recompose to the original atlas pixels',async()=>{
 const {createCanvas,loadImage}=require('@napi-rs/canvas'),atlas=require('../data/civilians/atlas.json'),cache=new Map();
 async function tile(asset,index){if(!cache.has(asset))cache.set(asset,await loadImage(Buffer.from(asset.png,'base64')));const cv=createCanvas(80,80),c=cv.getContext('2d'),id=asset.tiles[index];c.drawImage(cache.get(asset),id%16*48,Math.floor(id/16)*48,48,48,16,16,48,48);return cv;}
 for(const o of Object.values(A.Sources.outfits).filter(o=>!o.id.startsWith('kaldor:'))){
  const source=atlas.outfits[o.source];
  for(const [d,dir]of A.directions.entries()){
   const cv=createCanvas(80,80),c=cv.getContext('2d');
   const mod=async(id,plane=0)=>c.drawImage(await tile(atlas.modules[id].asset,atlas.moduleFrames.idle[d]+plane*atlas.moduleCount),0,0);
   await mod(o.sex+'-hair-01',0);if(o.headFirst)await mod(o.sex+'-adulte');c.drawImage(await tile(source.asset,source.frames.idle[d]),0,0);await mod(o.sex+'-hair-01',1);if(!o.headFirst)await mod(o.sex+'-adulte');c.drawImage(await tile(source.foreground,source.frames.idle[d]),0,0);await mod(o.sex+'-hair-01',2);
   const actual=A.raster({role:'civilian',sex:o.sex,outfit:o.id,action:'idle',frame:0,dir,scene:false,hat:null,native:true});
   assert.deepEqual(Buffer.from(actual.data),Buffer.from(c.getImageData(0,0,80,80).data),o.id+'/'+dir+' native pixels');
  }
 }
});
test('hair masks are temporary and all headwear survives mature/elder combinations',()=>{
 const original=JSON.stringify(A.Sources),options={role:'civilian',sex:'feminin',hair:'03',action:'idle',frame:0,scene:false};
 const before=A.raster({...options,hat:null}).data;
 for(const dir of A.directions)for(const hat of [...Object.keys(A.HEADGEAR).filter(h=>h!=='native'),...Object.keys(A.Sources.helmets)])for(const age of ['mur','age']){
  const image=A.raster({...options,dir,hat,age});assert.equal(image.metadata.clippedPixels,0,hat);
 }
 assert.deepEqual(A.raster({...options,hat:null}).data,before);assert.equal(JSON.stringify(A.Sources),original);
});
test('distance playback holds blocked feet, terminal frames hold, contacts emit once',()=>{
 for(const [id,c]of Object.entries(A.CLIPS)){
  assert.equal(A.frameAt(id,0),0);assert.ok(c.durations.every(n=>n>0));assert.equal(c.frames,c.durations.length);
  if(c.stride)assert.equal(A.frameAt(id,100,0),0);
  if(!c.loop)assert.equal(A.frameAt(id,1e6),c.frames-1);
  for(const m of c.markers){const at=c.durations.slice(0,m.frame).reduce((a,b)=>a+b,0)/1000;if(at===0)continue;const emitted=A.eventsBetween(id,at-1e-6,at+1e-6);assert.equal(emitted.filter(e=>e.id===m.id).length,1);assert.equal(A.eventsBetween(id,at,at+1e-6).filter(e=>e.id===m.id).length,0);}
 }
 assert.throws(()=>A.eventsBetween('walk',2,1),/Intervalle/);
});
test('back-view tools are behind the body and fingers cover visible tool grips',()=>{
 for(const [role,action]of [['porter','carry'],['cook','cook'],['miner','mine'],['weaver','loom'],['healer','bandage']]){
  const r=A.renderLayers({role,action,frame:3,dir:'dos',scene:false});assert.ok(r.layers.rearProps.length||r.layers.rearEquipment.length);assert.ok(r.order.indexOf('rearProps')<r.order.indexOf('body'));assert.ok(r.order.indexOf('rearEquipment')<r.order.indexOf('body'));
 }
 const r=A.renderLayers({role:'smith',action:'forge',frame:3,dir:'face'});assert.ok(r.order.indexOf('equipment')<r.order.indexOf('grips'));assert.ok(r.layers.grips.length);
 for(const id of ['spear_thrust','blade_cut','blade_reverse','axe_chop','staff_sweep']){
  const role=Object.keys(A.ROLES).find(r=>A.activitiesFor(r).includes(id));for(const dir of A.directions){const end=A.renderLayers({role,action:id,frame:7,dir}),rest=A.renderLayers({role,action:'armed_idle',frame:0,dir});assert.deepEqual(end.metadata.hands,rest.metadata.hands,id+'/'+dir+' recovery');}
 }
});
test('rider straddles the saddle with bent legs and both mount depth planes',()=>{
 const Horse=require('../sprites/humains/cheval');assert.equal(Horse.views.droite.length,32);assert.equal(Horse.views.droite[0].length,40);
 for(const dir of A.directions){const image=A.renderLayers({role:'sarak_cavalry',action:'ride',frame:0,dir}),r=image.metadata.rider;assert.ok(r);assert.equal(image.layers.mountBody.length,0,'mount is not baked into actor');const scene=require('../sprites/humains/scene').renderLayers({role:'sarak_cavalry',action:'ride',frame:0,dir});assert.ok(scene.layers['npc.mountBody'].length>150);assert.ok(image.layers.riderNearLeg.length);
  if(dir==='droite'||dir==='gauche'){assert.ok(image.layers.riderFarLeg.length);assert.ok(Math.abs(r.seat[1]-r.saddle[1])<=2);assert.notEqual(r.knees[1][0],r.hips[1][0]);assert.ok(r.feet[1][1]>r.knees[1][1]);assert.ok(image.order.indexOf('riderFarLeg')<image.order.indexOf('mountBody'));}
  else{assert.ok(r.knees[0][0]<r.hips[0][0]);assert.ok(r.knees[1][0]>r.hips[1][0]);assert.equal(image.layers.mountFront.length,0);assert.ok(scene.layers['npc.mountFront'].length);}
  assert.ok(image.order.indexOf('mountFront')<image.order.indexOf('riderNearLeg'));
  for(let i=0;i<r.knees.length;i++){assert.ok(Math.abs(r.knees[i][0]-r.hips[i][0])<=5,'no splayed thighs');assert.ok(r.feet[i][1]-r.knees[i][1]<=4,'short seated calf');}
  assert.equal(image.layers.hatRear.length,0,'removed rectangular desert helmet flaps');
 }
});
test('locomotion keeps a planted foot for every native body and direction',()=>{
 for(const outfit of Object.values(A.Sources.outfits).filter(o=>!o.id.startsWith('kaldor:')))for(const dir of A.directions){
  const options={role:'civilian',sex:outfit.sex,outfit:outfit.id,dir,scene:false},rest=A.renderLayers({...options,action:'idle',frame:0});
  const bottom=r=>Math.max(...['body','rearLegs'].flatMap(k=>r.layers[k]).map(p=>p[1])),ground=bottom(rest);
  for(let frame=0;frame<8;frame++)assert.equal(bottom(A.renderLayers({...options,action:'walk',frame})),ground,outfit.id+'/'+dir+'/'+frame+' planted foot');
 }
});
test('falling and sleeping rest on their ground or bedding in all directions',()=>{
 const anatomy=['body','head','headEarly','hairBack','hairMid','hairFront','frontArms','rearArms'];
 for(const dir of A.directions){
  for(const action of ['death','armed_death','lie_down','sleep','wake']){
   const role=Object.keys(A.ROLES).find(r=>A.activitiesFor(r).includes(action));
   for(let frame=0;frame<A.CLIPS[action].frames;frame++){
    const s=R.pose(action,frame);if(!s.angle)continue;
    const r=A.renderLayers({role,action,frame,dir}),bottom=Math.max(...anatomy.flatMap(k=>r.layers[k]).map(p=>p[1]));
    if(action.includes('death'))assert.equal(bottom,51,action+'/'+dir+'/'+frame+' ground');
    if(action==='sleep'){assert.equal(bottom,A.Props.stationLayout('bedroll',dir).origin[1]-2);assert.equal(r.metadata.support.shadow,false);}
   }
  }
  const image=(action,frame,role='civilian')=>Buffer.from(A.raster({role,action,frame,dir}).data);
  assert.deepEqual(image('sit_down',4),image('seated',0),'seat transition');
  assert.deepEqual(image('stand_up',0),image('seated',0),'rise transition');
  assert.deepEqual(image('lie_down',7),image('sleep',0),'lying transition');
 }
});
test('mount transitions reverse cleanly and the rider follows the saddle bob',()=>{
 for(const dir of A.directions){
  const image=(action,frame)=>Buffer.from(A.raster({role:'groom',action,frame,dir}).data);
  assert.deepEqual(image('mount',0),image('dismount',7));assert.deepEqual(image('mount',7),image('ride',0));
  const grounded=A.renderLayers({role:'groom',action:'mount',frame:0,dir});
  assert.equal(Math.max(...grounded.layers.body.map(p=>p[1])),73,'standing beside horse');
  const seats=[];for(let frame=0;frame<8;frame++){
   const r=A.renderLayers({role:'courier',action:'ride_trot',frame,dir}).metadata.rider;
   seats.push(r.seat[1]-r.saddle[1]);
  }assert.equal(new Set(seats).size,1,'no independent rider bounce');
 }
});
test('work tools meet their support and recover; released cargo remains on the floor',()=>{
 for(const action of ['hoe','fell','hew','mine','quarry','forge','craft','stonecut','repair_boat'])for(const dir of A.directions){
  const role=Object.keys(A.ROLES).find(r=>A.activitiesFor(r).includes(action)),options={role,action,dir};
  const r=A.renderLayers({...options,frame:3}),t=r.metadata.toolContacts;
  assert.ok(t.tip&&t.right,action+'/'+dir+' missing tool contact');
  assert.ok(Math.hypot(t.tip[0]-t.right[0],t.tip[1]-t.right[1])<=1,action+'/'+dir+' misses work surface');
  const start=A.renderLayers({...options,frame:0}),end=A.renderLayers({...options,frame:7});
  assert.deepEqual(start.layers.equipment,end.layers.equipment,action+'/'+dir+' tool recovery');
 }
 for(const dir of A.directions){
  let previous;for(let frame=5;frame<8;frame++){
   const r=A.renderLayers({role:'porter',action:'put_down',frame,dir}),ground=R.project(dir,0,5,0);
   assert.ok(r.metadata.cargo.grounded);assert.equal(r.layers.sceneBack.length,0,'no duplicate stationary crate');
   assert.equal(Math.max(...r.layers.groundProps.map(p=>p[1])),ground[1]-1,'crate on ground');
   if(previous)assert.deepEqual(r.layers.groundProps,previous,'released cargo follows hands');previous=r.layers.groundProps;
  }
 }
});
test('accessories and stations have retained concept references',()=>{
 for(const c of Object.values(A.CLIPS)){for(const id of c.props||[])assert.ok(A.Props.REFERENCE[id],c.id+'/'+id);if(c.station)assert.ok(A.Props.REFERENCE[c.station],c.id+'/'+c.station);}
 for(const name of ['metiers','postes-transports','equipements','cheval-chibi'])assert.ok(fs.statSync(path.join(root,'art/humains/activites/concepts',name+'.png')).size>1000);
 const manifest=JSON.parse(fs.readFileSync(path.join(root,'data/humains/activities-manifest.json')));for(const [file,hash]of Object.entries(manifest.sourceHashes))assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'sprites/humains',file))).digest('hex'),hash,file+' stale manifest');
});
