'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const P=require('../sprites/decors/postes-isometriques'),Old=require('../sprites/decors/postes-humains'),A=require('../sprites/humains/activites'),S=require('../sprites/humains/scene').withStations(P);
const pixelMap=p=>new Map(p.map(v=>[v[1]*128+v[0],v[2]]));
test('all 49 station identities and 44 new native models retain their functions and fixed parts',()=>{
 assert.deepEqual(Object.keys(P.ASSETS),Object.keys(Old.ASSETS));assert.equal(P.Art.definitions.length,44);assert.equal(P.runtimeActivated,true);assert.deepEqual(P.Art.scale,{human:19,tile:16,door:22});
 for(const [action]of Object.entries(A.CLIPS))assert.equal(P.forActivity(action),Old.forActivity(action));
 for(const d of P.Art.definitions){const r=P.render({id:d.id});assert.ok(r.pixels.length);assert.equal(r.metadata.projection,'dimetric-2:1');assert.deepEqual(r.metadata.nativePlan,{width:d.width,depth:d.depth,height:d.height});assert.equal(r.metadata.containsActors,false);assert.deepEqual(r.metadata.fixedParts,d.details);}
 assert.equal(P.Art.entry('workbench').contactHeight,9);assert.equal(P.Art.entry('sitting_bench').contactHeight,5);assert.equal(P.Art.entry('care_bed').contactHeight,4);
});
test('world art and sockets stay fixed across the four actor direction requests, with complementary depth masks',()=>{
 for(const id of Object.keys(P.ASSETS)){const base=P.render({id});for(const dir of P.directions){const r=P.render({id,dir}),back=pixelMap(r.layers.back),front=pixelMap(r.layers.front);assert.deepEqual(r.pixels,base.pixels);assert.deepEqual(r.socket,base.socket);for(const k of back.keys())assert.equal(front.has(k),false);assert.deepEqual(new Map([...back,...front]),pixelMap(r.pixels));}for(const p of base.pixels){assert.ok(p[0]>=0&&p[0]<128&&p[1]>=0&&p[1]<128);assert.match(p[2],/^[0-9a-f]{6}$/i);}}
});
test('all activity frames, available bodies and four view requests compose without clipping or changing timings',()=>{
 let count=0;for(const [action,c]of Object.entries(A.CLIPS)){const role=Object.keys(A.ROLES).find(k=>A.activitiesFor(k).includes(action));for(const sex of A.ROLES[role].sexes)for(const dir of A.directions)for(let frame=0;frame<c.frames;frame++){const r=S.raster({role,sex,action,dir,frame});assert.equal(r.metadata.clippedPixels,0,action+'/'+sex+'/'+frame);assert.equal(r.metadata.compositionClippedPixels,0,action+'/'+sex+'/'+frame);count++;}}
 assert.equal(count,5836);
 for(const id of Object.keys(P.ASSETS)){const o={...S.optionsFor(id),station:id,frame:0},base=S.raster({...o,dir:'face'});for(const dir of A.directions)assert.deepEqual(S.raster({...o,dir}).data,base.data,id);}
});
test('contact tools hit their external work targets for both native bodies, without changing tool lengths',()=>{
 for(const action of ['hoe','fell','hew','mine','quarry','forge','craft','stonecut','joinery','glass_blow','glass_roll','masonry']){const role=Object.keys(A.ROLES).find(k=>A.activitiesFor(k).includes(action));for(const sex of A.ROLES[role].sexes){const r=S.raster({role,sex,action,frame:3}),t=r.metadata.toolContacts;assert.deepEqual(t.worldTarget,r.metadata.socket.contact,action+'/'+sex);assert.ok(Math.hypot(t.worldTip[0]-t.worldTarget[0],t.worldTip[1]-t.worldTarget[1])<=1.01,action+'/'+sex);}}
 for(const action of ['glass_blow','glass_roll']){const role=Object.keys(A.ROLES).find(k=>A.activitiesFor(k).includes(action));for(let frame=0;frame<8;frame++){const r=S.raster({role,action,frame});assert.ok(r.metadata.toolContacts.worldTarget,action+'/'+frame);}}
});
test('beds have the real floor-axis support, retain lying layers and a separate patient; seats hold their own support',()=>{
 for(const id of ['care_bed','sleeping_mat'])for(const sex of ['masculin','feminin'])for(const action of ['lie_down','sleep','wake']){const c=A.CLIPS[action];for(let frame=0;frame<c.frames;frame++){const r=S.raster({role:'civilian',sex,action,frame,station:id});assert.equal(r.metadata.clippedPixels,0);assert.deepEqual(r.metadata.socket.support.axis,[1,.5]);assert.ok(Math.abs(r.metadata.socket.support.angle-63.43494882292201)<1e-9);assert.equal(r.metadata.compositionClippedPixels,0);}}
 const care=S.renderLayers({role:Object.keys(A.ROLES).find(k=>A.activitiesFor(k).includes('bandage')),action:'bandage',station:'care_bed',frame:3});assert.equal(care.metadata.entities.filter(e=>e.kind==='patient').length,1);assert.ok(care.layers.independentPatient.length>100);assert.deepEqual(care.metadata.entities.find(e=>e.kind==='patient').feet,P.sockets('care_bed').patient.feet);
 const mat=S.renderLayers({role:'civilian',action:'sleep',station:'sleeping_mat'}),cover=new Set(mat.layers.decorFront.map(p=>p[1]*128+p[0])),body=mat.layers['npc.body'];assert.ok(body.filter(p=>!cover.has(p[1]*128+p[0])).length>body.length*.8,'mat masks sleeper');
 for(const id of ['sitting_bench','potters_wheel','meal_table','glass_bench','clerks_desk'])assert.equal(P.sockets(id).operator.support.kind,'seat');
});
test('operator approaches avoid furniture foundations and reservations remain exclusive per instance',()=>{
 for(const d of P.Art.definitions){const socket=P.sockets(d.id).operator;if(!socket.support)assert.equal(P.solid(d.id,...socket.logicalFeet,2),false,d.id);{const local=[socket.approach[0]-64,socket.approach[1]-96],logical=[local[1]+local[0]/2,local[1]-local[0]/2];assert.equal(P.solid(d.id,...logical,2),false,d.id+' approach');}assert.equal(P.solid(d.id,0,0),true);}
 const a=P.place('workbench',{x:12000,y:-8000,instanceId:'one'}),b=P.place('workbench',{x:12000,y:-8000,instanceId:'two'}),occupancy=new Map(),s=a.worldSockets.operator;assert.equal(P.reserve(occupancy,s,'npc1'),true);assert.equal(P.reserve(occupancy,s,'npc2'),false);assert.equal(P.release(occupancy,s,'npc2'),false);assert.equal(P.reserve(occupancy,b.worldSockets.operator,'npc2'),true);assert.equal(P.release(occupancy,s,'npc1'),true);assert.deepEqual(a.pixels,b.pixels);
});
test('district colors share the same silhouettes, geometry and sockets; nature remains from its native atlas',()=>{
 for(const d of P.Art.definitions){const base=P.Art.pixels(d.id);for(const district of P.Art.districts){const p=P.Art.pixels(d.id,{district});assert.equal(p.width,base.width);assert.equal(p.height,base.height);assert.deepEqual([...p.indices].map(Boolean),[...base.indices].map(Boolean));assert.deepEqual(p.groundDepth,base.groundDepth);}}
 for(const id of ['crop_patch','orchard_tree','resin_tree','ore_node','snow_access'])assert.deepEqual(P.raster({id}).data,Old.raster({id}).data,id);
 const atlas=P.createAtlasAdapter({getPropPixels:key=>P.ExistingNature.props[key],getTerrainPixel:()=> '112233'});for(const id of ['quench_trough','feeding_trough','salt_basin']){const r=P.render({id,atlas});assert.ok(r.metadata.waterPixels.length);assert.ok(r.metadata.waterPixels.every(p=>p[2]==='112233'));}
 for(const id of ['sluice','dock_bollard','bank_platform'])assert.equal(P.render({id}).metadata.waterPixels.length,0);
});
test('winter keeps its activity policy, native snow colors and clear work targets on the new geometry',()=>{
 for(const id of Object.keys(P.ASSETS)){const r=P.render({id,season:'igea_winter'});assert.equal(r.metadata.winter.setting,P.Winter.station(id).setting);assert.ok(r.metadata.winter.snowPixels.every(p=>P.Winter.SNOW.includes(p[2])));assert.deepEqual(r.socket,P.render({id}).socket);}
 assert.throws(()=>S.raster({role:'farmer',action:'hoe',season:'igea_winter'}),/Igea/);const r=S.raster({role:Object.keys(A.ROLES).find(k=>A.activitiesFor(k).includes('clear_snow')),action:'clear_snow',season:'igea_winter',frame:3});assert.equal(r.metadata.compositionClippedPixels,0);
});
