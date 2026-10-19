'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto'),A=require('../sprites/humains/activites'),R=require('../sprites/humains/rig'),P=require('../sprites/decors/postes-humains'),S=require('../sprites/humains/scene'),W=P.Winter;
const winter={season:W.SEASON},allConditions={openWater:true,mineAccessible:true,quarryAccessible:true,pastureAccessible:true,frostProtected:true};
const digest=v=>crypto.createHash('sha256').update(JSON.stringify(v)).digest('hex');
const eligible=action=>Object.keys(A.ROLES).find(role=>A.activitiesFor(role).includes(action));
test('Igea policy covers every reused station; winter is explicit and seasonal',()=>{
 assert.deepEqual(Object.keys(W.POLICY).sort(),Object.keys(P.ASSETS).sort());
 assert.equal(Object.values(W.POLICY).filter(p=>p.setting==='dormant').length,5);
 assert.equal(Object.keys(P.Grids.grids).length,44);assert.equal(W.NEW.length,4);
 assert.equal(W.availability('sow',{climate:'neige'}).allowed,true,'cold clothes alone do not imply a frozen farm');
 for(const action of Object.keys(W.STOP)){
  assert.equal(W.availability(action,winter).allowed,false,action);
  assert.throws(()=>S.raster({...winter,role:eligible(action),action}),/Igea enneigée/);
 }
 for(const [action,[condition]]of Object.entries(W.CONDITIONS)){
  assert.equal(W.availability(action,winter).allowed,false,action+' needs actual conditions');
  assert.equal(W.availability(action,{...winter,conditions:{[condition]:true}}).allowed,true);
  assert.doesNotThrow(()=>S.raster({...winter,role:eligible(action),action,conditions:{[condition]:true}}));
 }
 assert.throws(()=>S.raster({...winter,role:'civilian',action:'idle',station:'crop_patch'}),/Igea enneigée/);
});
test('snow uses native colours only, with unchanged grids, sockets and working surfaces',()=>{
 const original=digest(P.Grids.grids),source=fs.readFileSync(require.resolve('../scripts/world-terrain-art.js'),'utf8');for(const color of W.SNOW)assert.ok(source.includes('#'+color));
 let caps=0;for(const id of Object.keys(P.ASSETS)){
  const plain=P.render({id,climate:'neige'}),snow=P.render({id,...winter}),state=snow.metadata.winter;
  assert.deepEqual(snow.socket,plain.socket,id+' snowy user moved');assert.deepEqual(snow.sockets,plain.sockets);
  const back=new Set(snow.layers.back.map(p=>p[1]*128+p[0]));assert.ok(snow.layers.front.every(p=>!back.has(p[1]*128+p[0])),id+' planes overlap');assert.equal(snow.layers.back.length+snow.layers.front.length,snow.pixels.length);
  if(W.station(id).setting==='sheltered')assert.deepEqual(snow.pixels,plain.pixels,id+' snow inside workshop');
  if(!W.CAPS[id])assert.equal(state.snowPixels.length,0,id+' unapproved cap');
  for(const [x,y,c]of state.snowPixels){caps++;assert.ok(W.SNOW.includes(c));assert.ok(Math.abs(x-snow.socket.contact[0])>3||Math.abs(y-snow.socket.contact[1])>2,id+' work contact covered');assert.ok(Math.abs(x-snow.socket.feet[0])>4||y<snow.socket.feet[1]-3,id+' feet covered');}
 }
 assert.ok(caps>100);assert.equal(digest(P.Grids.grids),original);
 for(const id of ['workbench','kitchen_table','meal_table','clerks_desk','apothecary_table','feeding_trough','cooking_hearth','forge','sleeping_mat','care_bed'])assert.equal(P.render({id,...winter}).metadata.winter.snowPixels.length,0,id);
});
test('snowy natural features and terrain come unchanged from the current atlas',()=>{
 for(const [id,key]of [['resin_tree','world_pine_1'],['ore_node','world_boulder_1']]){const r=P.render({id,...winter});assert.equal(r.metadata.natureSource,key);assert.deepEqual(r.pixels,P.ExistingNature.props[key].pixels.map(([x,y,c])=>[64+x,96+y,c]));}
 const p=P.render({id:'snow_access',...winter});assert.deepEqual(p.pixels,[],'ground is not a new furniture sprite');
 const r=S.renderLayers({...winter,role:'farmer',action:'clear_snow',terrain:true});assert.ok(r.layers.worldTerrain.length);for(const [x,y,c]of r.layers.worldTerrain)assert.equal(c,P.terrainAt('snow',x,y));
 const covered=S.renderLayers({...winter,role:'cook',action:'chop_food',terrain:true});assert.ok(!covered.layers.worldTerrain,'no snowy interior ground');
});
test('new winter clips are real articulated cycles with fixed grounded support and external fixtures',()=>{
 for(const action of W.NEW){
  const role=eligible(action),first=S.prepare({...winter,role,action}),actorFrames=new Set(),poses=new Set();
  for(let frame=0;frame<A.CLIPS[action].frames;frame++){
   const o={...winter,role,action,frame},r=S.raster(o),raw=A.renderLayers({...o,climate:'neige',interaction:first.interaction});
   assert.equal(r.metadata.compositionClippedPixels,0,action+'/'+frame);assert.equal(raw.metadata.clippedPixels,0);
   assert.deepEqual(r.metadata.socket,first.decor.socket);assert.deepEqual(r.metadata.support.ground,first.feet);assert.equal(r.metadata.climate,'neige');
   for(const dir of A.directions)assert.deepEqual(S.raster({...o,dir}).data,r.data,action+' direction changed fixed layout');
   for(const name of ['sceneBack','sceneFront','mountBody','mountFront'])assert.deepEqual(raw.layers[name],[]);
   actorFrames.add(digest(raw.layers));poses.add(digest(R.pose(action,frame)));
  }
  assert.ok(actorFrames.size>=3,action+' does not animate');assert.ok(poses.size>=3);
 }
 const r=S.raster({...winter,role:'shepherd',action:'deice_trough',frame:3});assert.equal(r.metadata.socket.role,'water');assert.deepEqual(r.metadata.toolContacts.worldTarget,r.metadata.socket.contact);assert.ok(Math.hypot(...r.metadata.toolContacts.worldTip.map((v,i)=>v-r.metadata.socket.contact[i]))<=1);
 const c=P.Grids.grids.feeding_trough,[x,y]=r.metadata.socket.contact;assert.ok(c.waterMask.some(([i,j])=>i===x-64+c.ground[0]&&j===y-96+c.ground[1]),'mallet contacts water, not hay or stone');
 const before=A.renderLayers({role:'cook',action:'stoke_fire',frame:4}),after=A.renderLayers({role:'cook',action:'stoke_fire',frame:5});const held=r=>['frontProps','rearProps','equipment','rearEquipment'].flatMap(k=>r.layers[k]);assert.ok(held(before).length);assert.equal(held(after).length,0,'released fuel stays in world, not glued to hands');
 assert.equal(A.normalize({role:'farmer',climate:'neige'}).hat,'felt');const slots=P.sockets('feeding_trough'),occupancy=new Map();assert.equal(P.reserve(occupancy,slots.water,'keeper'),true);assert.equal(P.reserve(occupancy,slots.operator,'feeder'),false,'two keepers cannot overlap at the same trough');
});
test('every retained winter activity renders every frame; suspended stations cannot be used',()=>{
 let n=0;for(const action of Object.keys(A.CLIPS)){
  const o={...winter,conditions:allConditions,role:eligible(action),action};if(!W.availability(action,o).allowed)continue;
  for(let frame=0;frame<A.CLIPS[action].frames;frame++)for(const dir of A.directions){const r=S.raster({...o,frame,dir});assert.equal(r.metadata.compositionClippedPixels,0,action+'/'+frame+'/'+dir);assert.equal(r.metadata.clippedPixels,0);n++;}
 }
 assert.ok(n>3800);console.log('Igea reviewed '+n+' winter directional frames.');
 for(const id of Object.keys(P.ASSETS)){const options={...winter,conditions:allConditions,...S.optionsFor(id,{...winter,conditions:allConditions}),station:id};if(W.station(id).setting==='dormant')assert.throws(()=>S.raster(options),/Igea enneigée/);else assert.doesNotThrow(()=>S.raster(options));}
});
