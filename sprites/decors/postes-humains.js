/* Independent human fixtures. One authored layout and operator position per
 * fixture; an actor direction request never moves its socket or changes its art.
 * No character dependency, actor pixels, DOM, bitmap or PNG at runtime. */
(function(r,f){const api=f(typeof module==='object'&&module.exports?require('./humains-grilles'):r.HearthreaverHumanStationGrids,typeof module==='object'&&module.exports?require('./atlas-nature'):r.HearthreaverExistingNature,typeof module==='object'&&module.exports?require('../humains/catalogue'):r.HearthreaverHumanCatalogue,typeof module==='object'&&module.exports?require('./igea-hiver'):r.HearthreaverIgeaWinter);if(typeof module==='object'&&module.exports)module.exports=api;else r.HearthreaverHumanStations=api;})(globalThis,function(G,N,C,W){
'use strict';
const SIZE=128,ANCHOR=[64,96],dirs=['face','droite','dos','gauche'],round=Math.round,mod=(x,n)=>(x%n+n)%n;
const nativeKeys={orchard_tree:'world_oak_0',resin_tree:'world_pine_0',ore_node:'world_boulder_0',crop_patch:'scrub'};
const needsWater=new Set(['sluice','dock_bollard','bank_platform']),seatIds=new Set(['sitting_bench','potters_wheel','glass_bench','meal_table','clerks_desk']),bedIds=new Set(['care_bed','sleeping_mat']);
const operatorFacings={workbench:'face',chopping_block:'droite',sawhorse:'droite',anvil:'droite',forge:'dos',smelter:'dos',quench_trough:'face',potters_wheel:'gauche',pottery_kiln:'dos',glass_bench:'face',glass_furnace:'dos',loom:'dos',fiber_rack:'face',hide_frame:'droite',dye_vat:'droite',rope_bench:'face',well:'droite',grain_mill:'droite',oil_press:'dos',kitchen_table:'face',cooking_hearth:'droite',bread_oven:'dos',apothecary_table:'face',care_bed:'droite',sleeping_mat:'droite',sitting_bench:'droite',meal_table:'gauche',market_stall:'face',clerks_desk:'gauche',beehive:'droite',stable_stall:'droite',feeding_trough:'face',care_stall:'droite',enclosure_gate:'dos',clothesline:'droite',drying_rack:'droite',sluice:'droite',crop_patch:'droite',orchard_tree:'droite',resin_tree:'droite',charcoal_clamp:'dos',ore_node:'droite',quarry_block:'droite',fixed_screen:'droite',salt_basin:'droite',wall_scaffold:'droite',dock_bollard:'droite',bank_platform:'droite'};
const access={id:'snow_access',number:49,label:'Accès à déneiger',posture:'debout',concept:null};
operatorFacings.snow_access='droite';
const ASSETS=Object.freeze(Object.fromEntries([...G.catalogue.assets,access].map(a=>[a.id,Object.freeze({...a,kind:nativeKeys[a.id]||a.id==='snow_access'?'atlas_reference':'fixture',atlasKey:nativeKeys[a.id]||null,orientation:'fixed_world',views:['fixed'],operatorFacing:operatorFacings[a.id],terrain:needsWater.has(a.id)?'water_edge':a.id==='crop_patch'?'cultivated_ground':'world_ground',conceptGrid:!!G.grids[a.id]})])));
for(const a of Object.values(ASSETS))if(!dirs.includes(a.operatorFacing))throw Error('Orientation de poste non définie : '+a.id);
function asset(id){if(!ASSETS[id])throw RangeError('Poste inconnu : '+id);return ASSETS[id];}
function forActivity(action){
 const winter={clear_snow:'snow_access',deice_trough:'feeding_trough',stoke_fire:'cooking_hearth',warm_hands:'cooking_hearth'};if(winter[action])return winter[action];
 const explicit=G.catalogue.extraBindings[action];if(explicit)return explicit[0];
 if(action==='smelt')return 'smelter';if(action==='glass_blow')return 'glass_furnace';if(action==='joinery')return 'workbench';
 const station=C.CLIPS[action]?.station;
 if(station==='bench')return 'workbench';if(action==='quarry'||action==='stonecut')return 'quarry_block';if(action==='fell'||action==='resin')return 'resin_tree';
 return G.catalogue.stationCoverage[station]?.assets?.[0]||null;
}
function terrainAt(material,x,y,atlas=N){if(atlas.terrainPixel)return atlas.terrainPixel(material,round(x),round(y));const tile=atlas.terrain[material];if(!tile)throw Error('Missing existing terrain '+material);return tile.colors[mod(round(y),tile.height)*tile.width+mod(round(x),tile.width)];}
function propPixels(atlas,key){const p=atlas.prop?atlas.prop(key):atlas.props[key];if(!p)throw Error('Missing existing prop '+key);return p.pixels||p;}
function createAtlasAdapter({getPropPixels,getTerrainPixel}){if(typeof getPropPixels!=='function'||typeof getTerrainPixel!=='function')throw TypeError('Les deux fournisseurs de l’atlas existant sont requis');return {prop:getPropPixels,terrainPixel:getTerrainPixel};}
function nativeKey(id,climate){let k=nativeKeys[id];if(climate==='neige'){if(k==='world_oak_0')k='world_oak_winter';if(k==='world_pine_0')k='world_pine_1';if(k==='world_boulder_0')k='world_boulder_1';}return k;}
function geometry(id){asset(id);const g=G.grids[id];if(id==='snow_access')return {width:28,height:10,depth:4,contactHeight:0};return {width:g?.width||(id==='crop_patch'?40:24),height:g?.height||(id==='crop_patch'?16:56),depth:Math.max(4,Math.min(10,round((g?.width||24)/5))),contactHeight:id==='crop_patch'?0:g?.contactHeight||7};}
function sockets(id,{x=64,y=96,instanceId=id+'@'+x+','+y}={}){
 const a=asset(id),g=geometry(id),w=g.width/2,d=g.depth,h=g.contactHeight,facing=a.operatorFacing;
 // Each position is defined by the depicted opening, seat or working edge.
 // These are functional sockets, never an inferred set of camera angles.
 let feet,contact,support=null;
 if(facing==='face'){feet=[x,y-d-2];contact=[x,y-d+1-h];}
 else if(facing==='dos'){feet=[x,y+3];contact=[x,y-h];}
 else {const sg=facing==='droite'?1:-1;feet=[x-sg*(w+2),y];contact=[x-sg*(w-3),y-h];}
 if(id==='snow_access'){feet=[x-16,y];contact=[x-8,y+1];}
 if(id==='market_stall'){feet=[x,y-1];contact=[x,y-h];}
 if(id==='cooking_hearth'){feet=[x-19,y];contact=[x-9,y-6];}
 if(id==='forge'){feet=[x+14,y+3];contact=[x+14,y-7];}
 if(id==='glass_furnace'){feet=[x,y+19];contact=[x,y-h];}
 if(seatIds.has(id)){
  const dx=id==='potters_wheel'?round(w*.72):id==='clerks_desk'?round(w*.68):id==='meal_table'?round(w*.78):0;
  feet=[x+dx,y+1];contact=[x+(id==='sitting_bench'?dx:Math.max(0,dx-6)),y-h];support={kind:'seat',surface:[feet[0],feet[1]-4],height:4};
 }
 if(id==='care_bed'){feet=[x-w-2,y+2];contact=[feet[0]+4,feet[1]-7];}
 if(id==='sleeping_mat'){feet=[x,y+2];contact=[x,y-2];support={kind:'bed',surface:[x-4,y-2],height:2};}
 const make=(key,feet,contact,support,facing)=>{const approach=facing==='face'?[feet[0],feet[1]-8]:facing==='dos'?[feet[0],feet[1]+8]:[feet[0]+(facing==='droite'?-8:8),feet[1]];return {id:instanceId+':'+key,reservationKey:instanceId+':'+key,role:key,feet:feet.map(round),facing,contact:contact.map(round),approach:approach.map(round),support,occupancy:'exclusive',actorKind:a.kind==='atlas_reference'?'any':'humanoid',occlusion:'fixed_fixture_layout'};};
 const result={operator:make('operator',feet,contact,support,facing)};
 // The patient is a separate occupant, not another view of the caregiver.
 if(id==='feeding_trough'){result.water=make('water',[x+10,y-7],[x+10,y-9],null,'face');result.water.reservationKey=result.operator.reservationKey;}
 if(id==='care_bed')result.patient=make('patient',[x,y+2],[x,y-5],{kind:'bed',surface:[x-4,y-5],height:5},'droite');
 return result;
}
function render({id,dir='dos',socketId='operator',x=64,y=96,worldX=x,worldY=y,instanceId=id+'@'+worldX+','+worldY,climate='tempere',season=null,conditions={},atlas=N}={}){
 const a=asset(id),winter=W.enabled({season});if(winter)climate='neige';if(!dirs.includes(dir))throw RangeError('Vue inconnue');const requestedDir=dir,available=sockets(id,{x,y,instanceId}),socket=available[socketId];if(!socket)throw RangeError('Socket inconnu : '+socketId);dir=socket.facing;
 const g=G.grids[id],points=new Map(),waterPoints=[],native=[];
 const put=(X,Y,c)=>{X=round(X);Y=round(Y);if(X<0||X>=128||Y<0||Y>=128)throw RangeError('Poste hors de la cellule 128 px');points.set(Y*128+X,[X,Y,c]);};
 if(g){const ox=x-g.ground[0],oy=y-g.ground[1];for(let j=0;j<g.height;j++)for(let i=0;i<g.width;i++){const ch=g.rows[j][i];if(ch!=='.')put(ox+i,oy+j,G.palette[G.alphabet.indexOf(ch)]);}
  for(const [i,j]of g.waterMask){const X=ox+i,Y=oy+j,c=terrainAt('water',X-x+worldX,Y-y+worldY,atlas);put(X,Y,c);waterPoints.push([round(X),round(Y),c]);}
 }else if(id==='snow_access'){
  // Logical world socket only. The snow surface belongs to WorldTerrainArt,
  // never a rectangular ground prop or part of the actor animation.
 }else if(id==='crop_patch'){
  // World soil + already-authored plant sprites. No new dirt/grass artwork.
  for(let dy=-9;dy<=2;dy++)for(let dx=-18;dx<=18;dx++)put(x+dx,y+dy,terrainAt('soil',worldX+dx,worldY+dy,atlas));
  for(const dx of [-11,0,11])for(const [X,Y,c]of propPixels(atlas,'scrub')){if(Y<-8||Math.abs(X)>5)continue;put(x+dx+X,y-3+Y,c);native.push([x+dx+X,y-3+Y,c]);}
 }else{
  const key=nativeKey(id,climate);
  for(const [X,Y,c]of propPixels(atlas,key)){put(x+X,y+Y,c);native.push([x+X,y+Y,c]);}
 }
 const snowPixels=winter?W.overlay(id,g,points,{x,y,socket,put}):[];
 const all=[...points.values()],back=[],front=[];
 // Disjoint masks: each original fixture pixel belongs to exactly one plane.
 // A PNJ behind the fixture is occluded by its complete silhouette; side
 // interaction keeps the near edge/posts in front. Hands above the contact
 // surface are composed separately by the scene, never cut out of the asset.
 for(const p of all){let near=false;
  if(bedIds.has(id))near=p[1]>=y-1;
  else if(dir==='face')near=true;
  else if(dir==='droite'||dir==='gauche'){
   const side=dir==='droite'?-1:1,edge=x+side*(geometry(id).width/2-3);
   near=p[1]>=y-3||(side<0?p[0]<edge:p[0]>edge)&&p[1]>=y-geometry(id).height+2;
  }
  (near?front:back).push(p);
 }
 const bounds=all.length?{left:Math.min(...all.map(p=>p[0])),top:Math.min(...all.map(p=>p[1])),right:Math.max(...all.map(p=>p[0])),bottom:Math.max(...all.map(p=>p[1]))}:{left:x,top:y,right:x,bottom:y};
 return {width:128,height:128,id,dir,layers:{back,front},pixels:all,socket,sockets:sockets(id,{x,y,instanceId}),bounds,metadata:{independent:true,containsActors:false,natureSource:a.atlasKey?nativeKey(id,climate):null,waterSource:waterPoints.length?'WorldTerrainArt':null,worldTerrain:a.terrain,concept:a.concept,waterPixels:waterPoints,nativePixels:native,orientation:'fixed_world',view:'fixed',requestedDir,winter:winter?{...W.station(id),snowPixels,source:'WorldTerrainArt.colors.snow',workingSurfaceClear:true}:null}};
}
function place(id,{x,y,instanceId=id+'@'+x+','+y,...options}){
 if(!Number.isFinite(x)||!Number.isFinite(y))throw TypeError('Coordonnées du monde requises');
 const r=render({id,...options,worldX:x,worldY:y,instanceId}),translate=p=>[round(p[0]-64+x),round(p[1]-96+y)];
 const worldSockets=Object.fromEntries(Object.entries(r.sockets).map(([dir,s])=>[dir,{...s,feet:translate(s.feet),contact:translate(s.contact),approach:translate(s.approach),support:s.support?{...s.support,surface:translate(s.support.surface)}:null}]));
 return {...r,worldAnchor:[x,y],worldSockets,drawOrigin:[x-64,y-96]};
}
function interaction(station){const s=station.socket,toActor=p=>[40+p[0]-s.feet[0],52+p[1]-s.feet[1]];return {socket:s.id,feet:[40,52],facing:s.facing,workTarget:toActor(s.contact),posture:s.support?.kind==='seat'?'seated':null,seat:s.support?.kind==='seat'?toActor(s.support.surface):null,bed:s.support?.kind==='bed'?toActor(s.support.surface):null};}
function raster(options){const r=render(options),data=new Uint8ClampedArray(128*128*4);for(const [x,y,c]of r.pixels){const n=parseInt(c,16),k=(y*128+x)*4;data.set([n>>16,n>>8&255,n&255,255],k);}return {...r,data};}
function reserve(occupancy,socket,actorId){if(actorId===undefined||actorId===null||actorId==='')throw TypeError('Identifiant du PNJ requis');const key=socket.reservationKey,current=occupancy.get(key);if(current!==undefined&&current!==actorId)return false;occupancy.set(key,actorId);return true;}
function release(occupancy,socket,actorId){if(occupancy.get(socket.reservationKey)!==actorId)return false;return occupancy.delete(socket.reservationKey);}
return Object.freeze({ASSETS,SIZE,ANCHOR,directions:dirs,forActivity,geometry,sockets,render,raster,place,interaction,terrainAt,createAtlasAdapter,reserve,release,ExistingNature:N,Grids:G,Winter:W});
});
