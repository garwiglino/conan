/* Live isometric furniture adapter. Four-view actors and activity timings are retained. */
(function(r,f){const a=f(typeof module==='object'&&module.exports?require('./postes-humains'):r.HearthreaverHumanStations,typeof module==='object'&&module.exports?require('./mobilier-isometrique'):r.HearthreaverIsometricFurniture);if(typeof module==='object'&&module.exports)module.exports=a;else r.HearthreaverIsometricStations=a;})(globalThis,function(Old,Art){
'use strict';
const round=Math.round,ANCHOR=[64,96],SIZE=128;
const project=Art.project,inverse=(x,y)=>[y+x/2,y-x/2];
const ASSETS=Object.freeze(Object.fromEntries(Object.entries(Old.ASSETS).map(([id,a])=>[id,Object.freeze({...a,isometricRedrawn:Art.has(id),operatorFacing:Art.has(id)?(Art.entry(id).arrangement==='front'?'dos':id==='sitting_bench'?'gauche':'droite'):a.operatorFacing,views:['fixed']})])));
function geometry(id){if(!Art.has(id))return Old.geometry(id);const d=Art.entry(id);return {width:d.width+d.depth+4,height:d.height+(d.width+d.depth)/2+4,depth:(d.width+d.depth)/2,contactHeight:d.contactHeight,nativePlan:{width:d.width,depth:d.depth,height:d.height},groundFootprint:[[0,0],[d.width,0],[d.width,d.depth],[0,d.depth]].map(([u,v])=>[u-d.width/2,v-d.depth/2]),details:d.details};}
function sockets(id,{x=64,y=96,instanceId=id+'@'+x+','+y}={}){
 if(!Art.has(id))return Old.sockets(id,{x,y,instanceId});const d=Art.entry(id),W=d.width,D=d.depth,center=project(W/2,D/2),point=(u,v,z=0)=>{const p=project(u,v,z);return [round(x+p[0]-center[0]),round(y+p[1]-center[1])];};
 const make=(role,feet,contact,facing='droite',support=null)=>{const dx=facing==='droite'?-9:facing==='gauche'?9:0,dy=facing==='dos'?9:facing==='face'?-9:0,logical=inverse(feet[0]-x,feet[1]-y);return {id:instanceId+':'+role,reservationKey:instanceId+':'+role,role,feet,contact,facing,approach:[feet[0]+dx,feet[1]+dy],support,occupancy:'exclusive',actorKind:'humanoid',occlusion:'isometric_ground_depth',logicalFeet:logical,logicalFacing:facing==='droite'?[1,-1]:facing==='gauche'?[-1,1]:facing==='dos'?[-1,-1]:[1,1]};};
 let ground=point(0,D*.65),contact=point(0,D*.65,d.contactHeight),feet=[ground[0]-7,ground[1]],facing='droite',support=null;
 if(['front','furnace'].includes(d.arrangement)){ground=point(W/2,D);contact=point(W/2,D,d.contactHeight);feet=[ground[0],ground[1]+(d.arrangement==='furnace'?19:4)];facing='dos';}
 if(d.arrangement==='furnace'){feet=[ground[0]-18,ground[1]];facing='droite';}
 if(d.arrangement==='seat-left'){ground=point(-4.5,D/2+.5);feet=ground;const surface=point(-4.5,D/2+.5,5);support={kind:'seat',surface,height:5};contact=point(1,D/2,d.contactHeight);}
 if(id==='glass_bench')contact=point(12,6,d.contactHeight);
 if(d.arrangement==='seat'){facing='gauche';ground=point(W*.5,D*.6);feet=ground;support={kind:'seat',surface:point(W*.5,D*.6,5),height:5};contact=support.surface;}
 const bed=()=>({kind:'bed',surface:[x,round(y-(id==='care_bed'?6:2)+6)],height:id==='care_bed'?6:2,axis:[1,.5],angle:Math.atan2(1,.5)*180/Math.PI});
 if(d.arrangement==='bed'){feet=[x,y];support=bed();contact=[x,y-2];}
 const result={operator:make('operator',feet,contact,facing,support)};
 if(id==='care_bed')result.patient=make('patient',[x,y],[x,y-6],'droite',bed());
 if(id==='feeding_trough'){const g=point(W*.25,D),c=point(W*.25,D,5);result.water=make('water',[g[0]-7,g[1]],c);result.water.reservationKey=result.operator.reservationKey;}
 // A lying or seated actor can occupy its support, but its entry point must be outside.
 for(const s of Object.values(result)){const dx=s.approach[0]-s.feet[0],dy=s.approach[1]-s.feet[1];for(let step=1;step<=12;step++){const a=[s.feet[0]+dx*step,s.feet[1]+dy*step],q=inverse(a[0]-x,a[1]-y);if(!solid(id,...q,5)){s.approach=a;break;}}}
 return result;
}
function render({id,dir='dos',socketId='operator',x=64,y=96,worldX=x,worldY=y,instanceId=id+'@'+worldX+','+worldY,district='metiers',climate='tempere',season=null,conditions={},atlas=Old.ExistingNature,weather=true}={}){
 if(!Old.directions.includes(dir))throw RangeError('Vue inconnue');
 if(!Art.has(id))return Old.render({id,dir,socketId,x,y,worldX,worldY,instanceId,climate,season,conditions,atlas});
 const d=Art.entry(id),p=Art.pixels(id,{district,weather}),palette=Art.paletteFor(district),center=project(d.width/2,d.depth/2),available=sockets(id,{x,y,instanceId}),socket=available[socketId];if(!socket)throw RangeError('Socket inconnu : '+socketId);
 const points=new Map(),depths=new Map(),waterPixels=[],snowPixels=[],winter=Old.Winter.enabled({season}),policy=winter?Old.Winter.station(id):null;
 const put=(X,Y,c,depth)=>{X=round(X);Y=round(Y);if(X<0||X>=SIZE||Y<0||Y>=SIZE)throw RangeError('Mobilier hors du cadre : '+id);points.set(Y*SIZE+X,[X,Y,c.replace('#','')]);depths.set(Y*SIZE+X,depth);};
 for(let yy=0;yy<p.height;yy++)for(let xx=0;xx<p.width;xx++){const k=yy*p.width+xx,index=p.indices[k];if(!index)continue;const X=round(x+xx-p.anchor[0]-center[0]),Y=round(y+yy-p.anchor[1]-center[1]),depth=p.groundDepth[k]-center[1],c=index>=71&&index<=75?Old.terrainAt('water',X-x+worldX,Y-y+worldY,atlas):palette[index];put(X,Y,c,depth);if(index>=71&&index<=75)waterPixels.push([X,Y,c]);}
 if(winter&&policy.setting!=='sheltered'){
  // Small caps on the actual upper silhouette. Work and grip remain clear.
  const original=new Map(points);for(let X=0;X<SIZE;X++){const column=[...original.values()].filter(p=>p[0]===X);if(!column.length)continue;const top=Math.min(...column.map(p=>p[1]));if(Math.abs(X-socket.contact[0])<=5&&Math.abs(top-socket.contact[1])<=4)continue;const k=top*SIZE+X,depth=depths.get(k);if(top<y-11||['quarry_block','sawhorse','dock_bollard'].includes(id)){const c=Old.Winter.SNOW[X%7?6:5];put(X,top-1,c,depth);snowPixels.push([X,top-1,c]);}}
 }
 const pixels=[...points.values()],back=[],front=[];for(const p of pixels){const bed=id==='care_bed'||id==='sleeping_mat',near=bed?p[1]>=y+(d.width+d.depth)/4-4:depths.get(p[1]*SIZE+p[0])>socket.feet[1]-y+.5;(near?front:back).push(p);}
 const bounds={left:Math.min(...pixels.map(p=>p[0])),right:Math.max(...pixels.map(p=>p[0])),top:Math.min(...pixels.map(p=>p[1])),bottom:Math.max(...pixels.map(p=>p[1]))};
 return {width:SIZE,height:SIZE,id,dir:socket.facing,pixels,pixelDepths:Float32Array.from(pixels,p=>depths.get(p[1]*SIZE+p[0])),layers:{back,front},socket,sockets:available,bounds,metadata:{independent:true,containsActors:false,natureSource:null,waterSource:waterPixels.length?'WorldTerrainArt':null,worldTerrain:Old.ASSETS[id].terrain,waterPixels,nativePixels:[],orientation:'fixed_world',view:'fixed',requestedDir:dir,district,projection:'dimetric-2:1',nativePlan:geometry(id).nativePlan,fixedParts:d.details,source:'authored JavaScript geometry / shared architecture rasteriser',winter:winter?{...policy,snowPixels,source:'WorldTerrainArt.colors.snow',workingSurfaceClear:true}:null}};
}
function interaction(station){const i=Old.interaction(station),s=station.socket;if(s.support?.kind==='bed'){i.bedAngle=s.support.angle;i.bedAxis=s.support.axis;}return i;}
function raster(options){const r=render(options),data=new Uint8ClampedArray(SIZE*SIZE*4);for(const [x,y,c]of r.pixels){const n=parseInt(c,16);data.set([n>>16,n>>8&255,n&255,255],(y*SIZE+x)*4);}return {...r,data};}
function place(id,{x,y,instanceId=id+'@'+x+','+y,...options}){if(!Number.isFinite(x)||!Number.isFinite(y))throw TypeError('Coordonnées requises');const r=render({id,...options,worldX:x,worldY:y,instanceId}),move=p=>[round(p[0]-64+x),round(p[1]-96+y)],worldSockets=Object.fromEntries(Object.entries(r.sockets).map(([k,s])=>[k,{...s,feet:move(s.feet),contact:move(s.contact),approach:move(s.approach),support:s.support?{...s.support,surface:move(s.support.surface)}:null}]));return {...r,worldSockets,worldAnchor:[x,y],drawOrigin:[x-64,y-96]};}
function solid(id,u,v,radius=0){if(!Art.has(id))return false;const d=Art.entry(id);return u+radius>-d.width/2&&u-radius<d.width/2&&v+radius>-d.depth/2&&v-radius<d.depth/2;}
return Object.freeze({...Old,ASSETS,Art,geometry,sockets,render,raster,place,interaction,solid,runtimeActivated:true});
});
