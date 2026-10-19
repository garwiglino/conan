'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),A=require('../sprites/humains/activites'),P=require('../sprites/decors/postes-humains'),S=require('../sprites/humains/scene');
const map=p=>new Map(p.map(v=>[v[1]*128+v[0],v[2]]));
test('49 empty fixtures/references have complementary depth planes and one fixed operator socket',()=>{
 assert.equal(Object.keys(P.ASSETS).length,49);assert.equal(Object.keys(P.Grids.grids).length,44);
 for(const id of Object.keys(P.ASSETS)){
  let original;for(const dir of P.directions){const r=P.render({id,dir}),back=map(r.layers.back),front=map(r.layers.front);if(id==='snow_access')assert.equal(r.pixels.length,0,'logical socket does not embed natural ground');else assert.ok(r.pixels.length,id);
   for(const key of back.keys())assert.ok(!front.has(key),id+' duplicated front/back pixel');
   assert.deepEqual(new Map([...back,...front]),map(r.pixels));if(original)assert.deepEqual(map(r.pixels),original,id+' world fixture rotated with its user');original=map(r.pixels);
   assert.equal(r.metadata.containsActors,false);assert.equal(r.socket.facing,P.ASSETS[id].operatorFacing);assert.equal(r.socket.role,'operator');assert.deepEqual(P.ASSETS[id].views,['fixed']);for(const point of [r.socket.feet,r.socket.contact,r.socket.approach])assert.ok(point.every(Number.isInteger));
   assert.notDeepEqual(r.socket.approach,r.socket.feet);assert.ok(!r.pixels.some(p=>['49e4e9','dfb35a'].includes(p[2])),id+' editor marks leaked into sprite');
  }
 }
});
test('nature reuses atlas pixels exactly; open water remains a world responsibility',()=>{
 const N=P.ExistingNature;
 for(const [id,key]of [['orchard_tree','world_oak_0'],['resin_tree','world_pine_0'],['ore_node','world_boulder_0']]){
  const r=P.render({id});assert.deepEqual(map(r.pixels),map(N.props[key].pixels.map(([x,y,c])=>[64+x,96+y,c])),id);
 }
 for(const id of ['quench_trough','feeding_trough','salt_basin']){const r=P.render({id});assert.ok(r.metadata.waterPixels.length);for(const [x,y,c]of r.metadata.waterPixels)assert.equal(c,P.terrainAt('water',x,y));}
 for(const id of ['sluice','dock_bollard','bank_platform']){const r=P.render({id});assert.equal(r.metadata.waterPixels.length,0,id+' has embedded river/shore');assert.equal(r.metadata.worldTerrain,'water_edge');}
 const requests=[],adapter=P.createAtlasAdapter({getPropPixels:key=>{requests.push(key);return N.props[key];},getTerrainPixel:(material,x,y)=>{requests.push([material,x,y]);return '112233';}});
 P.render({id:'resin_tree',atlas:adapter,climate:'neige'});assert.ok(requests.includes('world_pine_1'));
 const water=P.render({id:'quench_trough',atlas:adapter});assert.ok(water.metadata.waterPixels.every(p=>p[2]==='112233'));assert.ok(requests.some(v=>Array.isArray(v)&&v[0]==='water'));
});
test('all actor clips exclude furniture, terrain, animals and vehicles, including legacy scene:true',()=>{
 assert.equal(A.Props.scene,undefined,'old baked fixture painter removed');
 for(const [action,c]of Object.entries(A.CLIPS)){const role=Object.keys(A.ROLES).find(r=>A.activitiesFor(r).includes(action)),frame=Math.min(3,c.frames-1);
  for(const dir of A.directions){const o={role,action,frame,dir},a=A.raster({...o,scene:false}),b=A.raster({...o,scene:true});assert.deepEqual(a.data,b.data,action+'/'+dir+' scene flag changes actor');assert.equal(a.metadata.actorOnly,true);
   const r=A.renderLayers(o);for(const key of ['sceneBack','sceneFront','mountBody','mountFront'])assert.equal(r.layers[key].length,0,action+'/'+key);
  }
 }
 assert.ok(A.renderLayers({role:'smith',action:'forge',frame:3}).layers.equipment.length,'held tools were accidentally removed');
});
test('separate station composition covers all directional frames without clipping',()=>{
 let count=0;for(const [action,c]of Object.entries(A.CLIPS)){const role=Object.keys(A.ROLES).find(r=>A.activitiesFor(r).includes(action));for(const dir of A.directions)for(let frame=0;frame<c.frames;frame++){
  const r=S.raster({role,action,dir,frame});assert.equal(r.metadata.compositionClippedPixels,0,action+'/'+dir+'/'+frame);count++;
 }}assert.equal(count,Object.values(A.CLIPS).reduce((n,c)=>n+c.frames*4,0));
 for(const id of Object.keys(P.ASSETS))for(const dir of P.directions){const r=S.raster({...S.optionsFor(id),station:id,dir,frame:0,actors:false});assert.equal(r.metadata.compositionClippedPixels,0);for(const key of r.order.filter(k=>k.startsWith('npc.')))assert.equal(r.layers[key].length,0,id+' empty fixture contains actor');}
});
test('impact tools use external socket contacts; beds and benches are separate supports',()=>{
 for(const action of ['hoe','fell','hew','mine','quarry','forge','craft','stonecut','joinery'])for(const dir of A.directions){const role=Object.keys(A.ROLES).find(r=>A.activitiesFor(r).includes(action)),r=S.raster({role,action,dir,frame:3}),t=r.metadata.toolContacts;
  assert.ok(t.worldTip&&t.worldTarget,action+'/'+dir);assert.deepEqual(t.worldTarget,r.metadata.socket.contact);assert.ok(Math.hypot(t.worldTip[0]-t.worldTarget[0],t.worldTip[1]-t.worldTarget[1])<=1);
 }
 for(const id of ['sleeping_mat','care_bed'])for(const dir of A.directions){const r=S.renderLayers({role:'civilian',action:'sleep',station:id,dir,frame:0}),anatomy=['body','head','headEarly','hairBack','hairMid','hairFront','frontArms','rearArms'];
  assert.equal(Math.max(...anatomy.flatMap(k=>r.layers['npc.'+k]).map(p=>p[1])),r.metadata.socket.support.surface[1],id+'/'+dir+' above/below mattress');
 }
 const full=S.raster({role:'civilian',action:'seated',dir:'droite',frame:0}),hidden=S.raster({role:'civilian',action:'seated',dir:'droite',frame:0,scene:false});assert.equal(full.metadata.socket.support.kind,'seat');assert.deepEqual(full.metadata.actorOffset,hidden.metadata.actorOffset,'hiding prop moves NPC');
});
test('reservation belongs to an instance and fixed socket, and requires its owner to release',()=>{
 const occupancy=new Map(),a=P.sockets('workbench'),b=P.sockets('workbench',{x:60,y:96});
 assert.equal(P.reserve(occupancy,a.operator,'npc1'),true);assert.equal(P.reserve(occupancy,P.render({id:'workbench',dir:'droite'}).socket,'npc2'),false);assert.equal(P.reserve(occupancy,a.operator,'npc1'),true);assert.equal(P.release(occupancy,a.operator,'npc2'),false);assert.equal(P.reserve(occupancy,b.operator,'npc2'),true);assert.equal(P.release(occupancy,a.operator,'npc1'),true);assert.equal(P.reserve(occupancy,a.operator,'npc2'),true);
});
test('world placement preserves local art, translates sockets and samples native terrain in absolute world coordinates',()=>{
 const seen=[],atlas=P.createAtlasAdapter({getPropPixels:key=>P.ExistingNature.props[key],getTerrainPixel:(material,x,y)=>{seen.push([material,x,y]);return P.terrainAt(material,x,y);}});
 const placed=P.place('quench_trough',{x:12000,y:-8000,instanceId:'forge-yard-2',atlas}),local=P.render({id:'quench_trough'});
 assert.deepEqual(placed.drawOrigin,[11936,-8096]);assert.ok(seen.length>0);assert.ok(seen.every(([,x,y])=>Math.abs(x-12000)<32&&Math.abs(y+8000)<32));
 for(const key of Object.keys(local.sockets)){const a=local.sockets[key],b=placed.worldSockets[key];assert.deepEqual(b.feet,[a.feet[0]-64+12000,a.feet[1]-96-8000]);assert.ok(b.id.startsWith('forge-yard-2:'));}
 const a=P.place('workbench',{x:100000,y:200000}),b=P.place('workbench',{x:-100000,y:-200000});assert.deepEqual(a.pixels,b.pixels);assert.notEqual(a.worldSockets.operator.reservationKey,b.worldSockets.operator.reservationKey);
});

test('a fixed fixture never moves or turns its user when a caller requests another direction',()=>{
 for(const id of Object.keys(P.ASSETS)){
  const options={...S.optionsFor(id),station:id},clip=A.CLIPS[options.action];
  for(const frame of [0,Math.min(3,clip.frames-1),clip.frames-1]){
   const original=S.raster({...options,dir:'face',frame});
   for(const dir of P.directions){const r=S.raster({...options,dir,frame});assert.deepEqual(r.data,original.data,id+'/'+frame+'/'+dir);assert.deepEqual(r.metadata.actorOffset,original.metadata.actorOffset);assert.deepEqual(r.metadata.socket,original.metadata.socket);assert.equal(r.metadata.dir,P.ASSETS[id].operatorFacing);}
  }
  const first=S.prepare({...options,frame:0});for(let frame=0;frame<clip.frames;frame++){const q=S.prepare({...options,frame,dir:'gauche'});assert.deepEqual(q.feet,first.feet,id+' moves between frames');assert.deepEqual(q.decor.socket.contact,first.decor.socket.contact);}
  const interaction=P.interaction(first.decor),actor=A.raster({...options,frame:0,interaction,dir:'face'});for(const dir of P.directions)assert.deepEqual(A.raster({...options,frame:0,interaction,dir}).data,actor.data,id+' raw actor ignores bound orientation');
 }
 const bed=P.sockets('care_bed');assert.deepEqual(Object.keys(bed),['operator','patient']);assert.notDeepEqual(bed.operator.feet,bed.patient.feet,'functional occupants are distinct');
 const options={role:'sarak_cavalry',action:'ride',frame:0};assert.notDeepEqual(S.raster({...options,dir:'droite'}).data,S.raster({...options,dir:'face'}).data,'unbound actors and approved horse retain their directions');
});
