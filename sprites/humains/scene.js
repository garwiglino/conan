/* Scene assembly only. The actor API never contains furniture/transport pixels.
 * The same fixture/socket contract can receive actors from any race. */
(function(r,f){const api=f(typeof module==='object'&&module.exports?require('./activites'):r.HearthreaverHumanActivities,typeof module==='object'&&module.exports?require('../decors/postes-humains'):r.HearthreaverHumanStations);if(typeof module==='object'&&module.exports)module.exports=api;else r.HearthreaverHumanScene=api;})(globalThis,function createScene(A,P){
'use strict';
const SIZE=128,round=Math.round,seatActions=['sit_down','seated','stand_up'],sleepActions=['lie_down','sleep','wake'];
function activityFor(id,options={}){const action=Object.keys(A.CLIPS).find(action=>P.forActivity(action)===id&&P.Winter.availability(action,options).allowed);if(action)return action;return P.ASSETS[id].posture==='assis'?'seated':'idle';}
function optionsFor(id,options={}){const action=activityFor(id,options),role=Object.keys(A.ROLES).find(role=>A.activitiesFor(role).includes(action));return {role,action};}
function prepare(options={}){
 const winter=P.Winter.enabled(options);if(winter)options={...options,climate:'neige'};
 const requested=A.normalize(options);const availability=P.Winter.assertAllowed(requested.action,options),id=options.station===null?null:options.station||P.forActivity(requested.action);
 if(winter&&id&&P.Winter.station(id).setting==='dormant')throw RangeError('Igea enneigée : '+P.Winter.station(id).reason);
 const socketId=id==='feeding_trough'&&requested.action==='deice_trough'?'water':id==='care_bed'&&sleepActions.includes(requested.action)?'patient':'operator';
 const decor=id?P.render({id,dir:requested.dir,socketId,climate:requested.climate,season:options.season,conditions:options.conditions,district:options.district,weather:options.weather}):null;
 const o=decor?A.normalize({...options,dir:decor.socket.facing}):requested;
 const interaction=decor?P.interaction(decor):undefined,feet=decor?.socket.feet||[64,96];
 return {o,id,decor,interaction,feet,availability,offset:[feet[0]-40,feet[1]-52]};
}
function renderLayers(options={}){
 const q=prepare(options),{o,id,decor,feet,offset}=q,visible=options.scene!==false,actor=A.renderLayers({...options,climate:o.climate,dir:o.dir,interaction:q.interaction}),layers={},order=[],entities=[{kind:'npc',role:o.role,feet,source:'HearthreaverHumanActivities'}];
 const put=(key,pixels)=>{order.push(key);layers[key]=pixels;};
 const move=(pixels,dx=offset[0],dy=offset[1])=>pixels.map(([x,y,c])=>[round(x+dx),round(y+dy),c]);
 if(visible&&options.terrain&&!(P.Winter.enabled(options)&&decor?.metadata.winter?.setting==='sheltered')){const tile=P.Winter.enabled(options)?'snow':decor?.metadata.worldTerrain==='water_edge'?'water':id==='crop_patch'?'soil':'grass',ground=[];for(let y=0;y<128;y++)for(let x=0;x<128;x++)ground.push([x,y,P.terrainAt(tile,x,y)]);put('worldTerrain',ground);}
 put('decorBack',visible&&decor?decor.layers.back:[]);
 let horse=null;
 if(actor.metadata.support.kind==='saddle')horse=A.Props.horseLayers(40,74,o.dir,o.frame,['ride','ride_trot','armed_walk'].includes(o.action));
 let animal=null;
 if(visible&&options.actors!==false&&['groom','lead'].includes(o.action)){
  animal=A.Props.horseLayers(64,96,o.dir,0,o.action==='lead');put('independentHorse',animal.body.values());entities.push({kind:'horse',feet:[64,96],source:'approved_cheval.js'});
 }
 if(visible&&options.actors!==false&&id==='care_bed'&&o.action==='bandage'){
  const sleepStation=P.render({id:'care_bed',socketId:'patient',climate:o.climate,district:options.district}),sleep=A.renderLayers({role:'civilian',sex:'masculin',action:'sleep',frame:0,dir:'droite',scene:false,interaction:P.interaction(sleepStation)}),patientFeet=sleepStation.socket.feet;
  put('independentPatient',move(sleep.order.flatMap(k=>sleep.layers[k]),patientFeet[0]-40,patientFeet[1]-52));entities.push({kind:'patient',feet:patientFeet,source:'separate_human_sleep'});
 }
 const actorVisible=new Map(),heldKeys=new Set();
 for(const key of actor.order){
  let pixels=options.actors===false?[]:move(actor.layers[key]);
  // Inject an already approved independent animal into the scene depth planes.
  // These two planes are always empty in the actor-only result.
  if(visible&&horse&&key==='mountBody')pixels=move(horse.body.values());
  if(visible&&horse&&key==='mountFront')pixels=move(horse.front.values());
  put('npc.'+key,pixels);
  for(const p of pixels){const k=p[1]*128+p[0];actorVisible.set(k,p);if(['equipment','rearEquipment','grips','frontProps','rearProps','frontArms','rearArms'].includes(key))heldKeys.add(k);else heldKeys.delete(k);}
 }
 if(horse&&visible)entities.push({kind:'horse',feet:[64,118],source:'approved_cheval.js'});
 const front=visible&&decor?decor.layers.front:[];put('decorFront',front);
 const cover=new Set(front.map(p=>p[1]*128+p[0]));
 // Keep only the actor's actually visible hand/tool pixels above the working
 // surface. A rear tool hidden by the body cannot reappear through its face.
 const above=decor&&options.actors!==false?[...actorVisible.entries()].filter(([k,p])=>heldKeys.has(k)&&cover.has(k)&&p[1]<=decor.socket.contact[1]+1).map(([,p])=>p):[];
 put('heldAboveSurface',above);
 const contacts={...actor.metadata.toolContacts};if(contacts.tip)contacts.worldTip=move([[...contacts.tip,'000000']])[0].slice(0,2);if(contacts.right)contacts.worldTarget=move([[...contacts.right,'000000']])[0].slice(0,2);
 const cameraGround=horse?118:Math.max(96,feet[1]),g=id?P.geometry(id):null;
 const top=Math.min(decor?decor.bounds.top:128,horse?76:feet[1]-28),span=Math.max(44,g?g.width+25:44,Math.abs(feet[0]-64)*2+18);
 return {width:128,height:128,order,layers,metadata:{...actor.metadata,actorOnly:false,independentStation:id,view:decor?'fixed':o.dir,socket:decor?.socket||null,entities,toolContacts:contacts,actorOffset:offset,stationGeometry:decor?.bounds||null,terrainSource:layers.worldTerrain?.length?'existing WorldTerrainArt':null,camera:{ground:cameraGround,centerX:64,top,width:span},support:{...actor.metadata.support,ground:horse?[64,118]:feet},sceneVisible:visible,winter:decor?.metadata.winter||null,availability:q.availability}};
}
function raster(options={}){const r=renderLayers(options),data=new Uint8ClampedArray(128*128*4);let clipped=0;for(const key of r.order){if(options.plane==='back'&&key!=='decorBack'||options.plane==='front'&&key!=='decorFront'||options.plane==='actor'&&!key.startsWith('npc.'))continue;for(const [x,y,c]of r.layers[key]){if(x<0||x>=128||y<0||y>=128){clipped++;continue;}const n=parseInt(c,16),p=(y*128+x)*4;data.set([n>>16,n>>8&255,n&255,255],p);}}r.metadata.compositionClippedPixels=clipped;return {...r,data};}
return Object.freeze({SIZE,prepare,optionsFor,activityFor,renderLayers,raster,withStations:stations=>createScene(A,stations)});
});
