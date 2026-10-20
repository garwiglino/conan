'use strict';
// A review proposal. This does not overwrite runtime settlements or world geometry.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),A=require('../sprites/architecture/architecture-game'),Atlas=require('./world-model')(require('../data/world/atlas.json'));
const source=require('../data/architecture/city-plans/sources/clairfoyer-watabou.json'),profile=require('../data/world/bible/generated/settlements.json').find(s=>s.atlasId==='1'),node=Atlas.byId['town-1'];
const scale=4.4,offset=[-750,-80],convert=p=>[(p[0]-source.center[0])*scale+offset[0],(p[1]-source.center[1])*scale+offset[1]],round=n=>Math.round(n*16)/16;
function inside(p,poly){let b=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){let a=poly[i],c=poly[j];if((a[1]>p[1])!==(c[1]>p[1])&&p[0]<(c[0]-a[0])*(p[1]-a[1])/(c[1]-a[1])+a[0])b=!b;}return b;}
function bounds(poly){const x=Math.min(...poly.map(p=>p[0])),y=Math.min(...poly.map(p=>p[1]));return{x,y,w:Math.max(...poly.map(p=>p[0]))-x,h:Math.max(...poly.map(p=>p[1]))-y};}
function overlap(a,b,p=0){return a.x-p<b.x+b.w&&a.x+a.w+p>b.x&&a.y-p<b.y+b.h&&a.y+a.h+p>b.y;}
const corners=r=>[[r.x,r.y],[r.x+r.w,r.y],[r.x+r.w,r.y+r.h],[r.x,r.y+r.h]],centre=p=>p.reduce((a,b)=>[a[0]+b[0]/p.length,a[1]+b[1]/p.length],[0,0]);
const terrain=(x,y)=>Atlas.terrain(Math.floor(node.x+x),Math.floor(node.y+y));
const dry=r=>{for(let y=r.y;y<=r.y+r.h+.2;y+=Math.max(.5,r.h/4))for(let x=r.x;x<=r.x+r.w+.2;x+=Math.max(.5,r.w/4))if([3,8].includes(terrain(x,y)))return false;return true;};
const wards=source.patches.filter(p=>p.withinCity).map(p=>({id:'ward-'+p.id,sourceWard:p.ward,polygon:p.shape.map(convert),parcels:p.buildings.map(g=>g.map(convert))}));
const streets=[],edgeKeys=new Set();
for(const w of wards)for(let i=0;i<w.polygon.length;i++){const a=w.polygon[i],b=w.polygon[(i+1)%w.polygon.length],key=[a,b].map(p=>p.map(n=>n.toFixed(3)).join(',')).sort().join('/');if(edgeKeys.has(key))continue;edgeKeys.add(key);streets.push({id:'lane-'+streets.length,kind:'street',width:4.4,points:[a,b]});}
for(const points of source.streets)streets.push({id:'artery-'+streets.length,kind:'main',width:8.8,points:points.map(convert)});
// Local connections to the preserved arrival point and the existing southern trail.
streets.push({id:'arrival-east',kind:'access',width:8.8,points:[[0,0],[-80,-15],[-160,-15],[-260,-25],[-430,-35],offset]});
const road=Atlas.roadById['road-5'];const approach=road.pts.at(-2);streets.push({id:'arrival-south',kind:'access',width:8.8,points:[[approach[0]-node.x,approach[1]-node.y],[-100,200],[-260,180],[-390,160]]});
streets.push({id:'resin-access',kind:'access',width:6.4,points:[[-1350,200],[-1240,200],[-1130,190]]});
const orthogonal=require('./city-plans/orthogonal-network.cjs');
const network=orthogonal.build(streets,{valid:(p,width)=>[[-width/2,-width/2],[width/2,-width/2],[width/2,width/2],[-width/2,width/2],[0,0]].every(q=>![3,8].includes(terrain(p[0]+q[0],p[1]+q[1])))});
streets.splice(0,streets.length,...network.routes);
const distance=(p,a,b)=>Atlas.project(...p,a,b).d;
const nearStreet=(r,extra=0)=>streets.some(s=>s.points.slice(1).some((b,i)=>{
 const a=s.points[i],d=s.width/2+extra;if(s.orthogonal)return overlap(r,orthogonal.rect(a,b,s.width+extra*2));return Math.min(...corners(r).map(p=>distance(p,a,b)))<d||inside(a,corners(r))||inside(b,corners(r))||require('./build-settlements.cjs').segmentRect(a,b,r)<d;
}));
const CLEARANCE=2.5,PATH_WIDTH=2,dirs=['face','droite','dos','gauche'];
const nearestStreet=(x,y)=>{let best;for(const s of streets)for(let i=1;i<s.points.length;i++){const q=Atlas.project(x,y,s.points[i-1],s.points[i]);if(!best||q.d<best.d)best={...q,id:s.id};}return best;};
function facing(x,y,target){const q=target||nearestStreet(x,y),dx=q.x-x,dy=q.y-y;return Math.abs(dx)>Math.abs(dy)?dx>0?'gauche':'droite':dy>0?'face':'dos';}
const hash=(x,y,s)=>{let n=Math.imul(Math.round(x*16),374761393)^Math.imul(Math.round(y*16),668265263)^Math.imul(s,1442695041);return (n^(n>>>13))>>>0;};
const buildings=[],rejects={waterOrCliff:0,road:0,parcel:0,overlap:0,frontage:0};
function nativeAt(id,dir,x,y){let g=A.geometry(id,{dir,x:0,y:0}),x0=round(x-g.foot.x/16),y0=round(y-g.foot.y/16);g=A.geometry(id,{dir,x:x0*16,y:y0*16});const foot={x:g.foot.x/16,y:g.foot.y/16,w:g.foot.w/16,h:g.foot.h/16},p=g.portals[0];return {id,dir,x:x0,y:y0,foot,entrance:{x:(p.x+p.nx*20)/16,y:(p.y+p.ny*20)/16},portal:{x:p.x/16,y:p.y/16,nx:p.nx,ny:p.ny}};}
function place(id,dir,x,y,ward,parcel,role,capacity=0){const b=nativeAt(id,dir,x,y),pad={x:b.foot.x-.45,y:b.foot.y-.45,w:b.foot.w+.9,h:b.foot.h+.9};
 if(parcel&&!corners(pad).every(p=>inside(p,parcel))){rejects.parcel++;return;}
 if(!dry(pad)||!dry({x:b.entrance.x-.4,y:b.entrance.y-.4,w:.8,h:.8})){rejects.waterOrCliff++;return;}
 if(nearStreet(pad,.25)){rejects.road++;return;}
 if(buildings.some(o=>overlap(b.foot,o.foot,CLEARANCE))){rejects.overlap++;return;}
 const street=nearestStreet(b.portal.x,b.portal.y);if(capacity&&((street.x-b.portal.x)*b.portal.nx+(street.y-b.portal.y)*b.portal.ny)<0){rejects.frontage++;return;}const o={...b,frontage:{street:street.id,target:[street.x,street.y]},uid:'clairfoyer-'+buildings.length,ward:ward.id,role,capacity};buildings.push(o);return o;
}
const publicAssignments={0:['B05','B07','B08','B06'],11:['B21','B22','B24'],19:['B05','B06'],23:['B21','B08','B24'],26:['B06','B08'],33:['B05','B07']};
// Civic buildings use the broad ward interior rather than a cathedral/castle model.
for(const [key,models]of Object.entries(publicAssignments)){const w=wards.find(w=>w.id==='ward-'+key),box=bounds(w.polygon),c=centre(w.polygon);for(const id of models){let done=false;const candidates=[];for(let y=box.y;y<box.y+box.h;y+=3)for(let x=box.x;x<box.x+box.w;x+=3)candidates.push([x,y]);candidates.sort((a,b)=>Math.hypot(a[0]-c[0],a[1]-c[1])-Math.hypot(b[0]-c[0],b[1]-c[1]));for(const [x,y]of candidates){if(place(id,facing(x+3,y+3,{x:c[0],y:c[1]}),x,y,w,w.polygon,'public')){done=true;break;}}if(!done)throw Error('No civic site '+key+' '+id);}}
const civic=new Set(Object.keys(publicAssignments).map(n=>'ward-'+n));

// Keep 35 m around the resin processing yard free of homes (fire and fumes).
const yard={id:'resin-yard',x:-1400,y:180,w:48,h:45,buffer:35,role:'proposed_cold_resin_storage_and_separate_processing'};
for(const w of wards){if(civic.has(w.id)||w.sourceWard==='Park')continue;
 for(let pi=0;pi<w.parcels.length;pi++){
  const parcel=w.parcels[pi],r=bounds(parcel),seed=+w.id.slice(5)*977+pi;
  // Fine candidate search avoids rigid rows and keeps the four native footprints.
  for(let y=r.y+.6;y<r.y+r.h-3;y+=1.75)for(let x=r.x+.6;x<r.x+r.w-3;x+=1.75){
   if(overlap({x,y,w:7,h:7},yard,yard.buffer))continue;
   const h=hash(x,y,seed),id=h%13===0?'TER-C03':h%5===0?'T03':h%3===0?'TER-C02':'TER-C01',role=h%31===0?'artisan':'housing',model=role==='artisan'?'T03':id,dir=facing(x+2.5,y+2.5);
   const b=place(model,dir,x,y,w,parcel,role,role==='housing'?(id==='TER-C03'?8:id==='TER-C02'?6:4):0);if(b)b.parcel=pi;
  }
 }
}
// Dedicated service courts at the arrival and resin yard: explicit proposals.
const serviceWard={id:'arrival-services'};for(const [id,x,y,role]of [['B07',-22,-20,'public'],['B08',-20,10,'public'],['F01',-48,18,'watch_proposal'],['B24',-45,-35,'public'],['B12',-1390,184,'resin_workshop_proposal'],['B06',-1370,184,'resin_store_proposal']]){let b;for(let dy=0;dy<=16&&!b;dy+=2)for(const dx of [0,-4,4,-8,8]){b=place(id,facing(x+dx+3,y+dy+3),x+dx,y+dy,serviceWard,null,role);if(b)break;}if(!b)throw Error('No service site '+id);}
// Keep inhabited frontages; reserve the back of each parcel for courts/gardens.
// The search above finds valid options, not a requirement to fill every space.
const housingGroups=new Map();for(const b of buildings.filter(b=>b.capacity)){const key=b.ward+'/'+b.parcel;if(!housingGroups.has(key))housingGroups.set(key,[]);housingGroups.get(key).push(b);}
const ranked=[];for(const group of housingGroups.values()){group.sort((a,b)=>{const dist=o=>Math.hypot(o.frontage.target[0]-o.x,o.frontage.target[1]-o.y);return dist(a)-dist(b)||a.uid.localeCompare(b.uid);});group.forEach((b,rank)=>ranked.push({b,rank,centrality:Math.hypot(b.x-offset[0],b.y-offset[1])}));}
ranked.sort((a,b)=>a.rank-b.rank||a.centrality-b.centrality||a.b.uid.localeCompare(b.b.uid));
const retained=new Set(),capacityTarget=Math.ceil(profile.designPopulation*1.08);let plannedCapacity=0;for(const {b}of ranked){if(plannedCapacity>=capacityTarget)break;retained.add(b.uid);plannedCapacity+=b.capacity;}
let artisanCount=0;for(let i=buildings.length-1;i>=0;i--){const b=buildings[i];if(b.capacity&&!retained.has(b.uid)||b.role==='artisan'&&++artisanCount>90)buildings.splice(i,1);}
const gardens=[...housingGroups.entries()].map(([key,group])=>{const keep=group.filter(b=>retained.has(b.uid)),sample=group[0],ward=wards.find(w=>w.id===sample.ward);return{id:'garden-'+key,ward:sample.ward,parcel:sample.parcel,polygon:ward.parcels[sample.parcel],houses:keep.map(b=>b.uid),kind:'household_court_and_garden',createsStock:false};}).filter(g=>g.houses.length);
const circulation=require('./city-plans/circulation.cjs').build({buildings,streets,anchor:{x:node.x,y:node.y}},Atlas);
// Low, walkable garden beds occupy spare ground, never a reserved path.
const routeIndex=new Map(),segments=streets.concat(circulation.walkways,circulation.walkways.map(w=>w.threshold)).flatMap(s=>s.points.slice(1).map((b,i)=>({a:s.points[i],b,width:s.width})));
for(const seg of segments){const pad=seg.width/2+3;for(let y=Math.floor((Math.min(seg.a[1],seg.b[1])-pad)/32);y<=Math.floor((Math.max(seg.a[1],seg.b[1])+pad)/32);y++)for(let x=Math.floor((Math.min(seg.a[0],seg.b[0])-pad)/32);x<=Math.floor((Math.max(seg.a[0],seg.b[0])+pad)/32);x++){const key=x+','+y;if(!routeIndex.has(key))routeIndex.set(key,[]);routeIndex.get(key).push(seg);}}
const decorations=[],segmentRect=require('./build-settlements.cjs').segmentRect;
for(let i=0;i<gardens.length;i++){if(i%3)continue;const garden=gardens[i],box=bounds(garden.polygon);let found=false;for(let y=box.y+1;y<box.y+box.h-4&&!found;y+=3)for(let x=box.x+1;x<box.x+box.w-3;x+=3){const r={x:round(x),y:round(y),w:1.5,h:3},pad={x:r.x-1,y:r.y-1,w:r.w+2,h:r.h+2};if(!corners(pad).every(q=>inside(q,garden.polygon))||!dry(pad)||buildings.some(b=>overlap(pad,b.foot,1)))continue;const nearby=routeIndex.get(Math.floor((r.x+r.w/2)/32)+','+Math.floor((r.y+r.h/2)/32))||[];if(nearby.some(s=>orthogonal.axisAligned([s.a,s.b])?overlap(r,orthogonal.rect(s.a,s.b,s.width+2)):segmentRect(s.a,s.b,r)<s.width/2+1))continue;decorations.push({id:'bed-'+i,kind:'garden_bed',...r,passable:true,createsStock:false});found=true;break;}}
const cap=buildings.reduce((n,b)=>n+b.capacity,0),housing=buildings.filter(b=>b.capacity>0);
// Planning occupancy only: never inserts or moves any runtime resident.
let remainder=profile.designPopulation;const allocations=housing.map(b=>{const exact=profile.designPopulation*b.capacity/cap;b.plannedResidents=Math.floor(exact);remainder-=b.plannedResidents;return {b,fraction:exact%1};}).sort((a,b)=>b.fraction-a.fraction||a.b.uid.localeCompare(b.b.uid));for(let i=0;i<remainder&&i<allocations.length;i++)allocations[i].b.plannedResidents++;remainder=Math.max(0,profile.designPopulation-cap);
const spec={schema:1,id:'town-1',name:profile.name,status:'draft_for_review',approval:{userValidated:false,pushAllowed:false},units:'metres',tilePixels:16,projection:'dimetric-2:1',anchor:{x:node.x,y:node.y},canon:{region:profile.regionName,territory:profile.territory,authority:profile.authority,designPopulation:profile.designPopulation,speciesCounts:profile.speciesCounts,productionIntent:profile.productionIntent,waterfront:profile.waterfront,oceanPort:node.oceanPort,existingRouteIds:profile.atlasRouteIds},watabou:{file:'sources/clairfoyer-watabou.json',seed:source.seed,size:source.size,features:source.features,provenance:source.provenance},transform:{metresPerGeneratorUnit:scale,offsetM:offset,origin:source.center,rotation:0},wards,streets,roadGeometry:{kind:'orthogonal',axes:'logical x/y; projected screen slopes +1/2 and -1/2',reference:'sources/clairfoyer-circulation-reference.json',summary:network.summary,nodes:network.nodes,edges:network.edges,distanceDecision:'fixed anchors; original lengths retained separately from longer physical routes'},buildings,walkways:circulation.walkways,gardens,decorations,circulation:{minimumBuildingGapM:CLEARANCE,pathWidthM:PATH_WIDTH,capacityReserveFraction:.08,gridStepM:circulation.step,unreachable:circulation.unreachable,orientationPolicy:'housing portals face nearest street; civic portals face courtyard; four native views without image rotation'},industrialYard:yard,defence:{enclosure:false,citadel:false,reason:'No enclosing wall or citadel established by the bible; optional access watch subject to review.',outposts:[{id:'southern-watch',status:'candidate_not_active',position:[-62,275],mission:'observe the only existing land approach',authority:'teremor',garrison:0,stockCreated:false,budget:'to_define_before_activation'}]},water:{potableSource:'unverified',requirements:['confirm fresh water and treatment before activation','reserve public well/cistern sites; no claim of aquifer or stocks']},logistics:{food:'grain and honey hinterland of Boisclair; supplier options from bible remain uncontracted',firebreakM:35,roadWidthsM:{artery:8.8,street:4.4},refuges:buildings.filter(b=>b.id==='B24').map(b=>b.uid)},performance:{staticPlacements:true,chunkSizeM:32,simulation:'existing persistent actors; no NPC per design resident',renderer:'reuse native model caches and spatial query; no whole-city texture'},summary:{orientations:Object.fromEntries(dirs.map(dir=>[dir,buildings.filter(b=>b.dir===dir).length])),sourceParcels:source.patches.filter(p=>p.withinCity).reduce((n,p)=>n+p.buildings.length,0),buildings:buildings.length,houses:housing.length,housingCapacity:cap,unhousedDesignResidents:remainder,areaHa:Math.abs(source.border.reduce((n,p,i)=>{const q=source.border[(i+1)%source.border.length];return n+p[0]*q[1]-p[1]*q[0]},0)/2)*scale*scale/10000,rejectedCandidates:rejects},activation:{runtimeChanged:false,blockedBy:['user_review','potable_water_verification','full_accessibility_review','all_cities_validation_before_push']}};
spec.revision=crypto.createHash('sha256').update(JSON.stringify(spec)).digest('hex').slice(0,16);
fs.writeFileSync(path.join(root,'data/architecture/city-plans/clairfoyer.json'),JSON.stringify(spec)+'\n');
const registryPath=path.join(root,'data/architecture/city-plans/registry.json'),previous=fs.existsSync(registryPath)?JSON.parse(fs.readFileSync(registryPath,'utf8')).sites:[],previousSites=new Map(previous.map(s=>[s.id,s]));
const all=require('../data/world/bible/generated/settlements.json').map(p=>({id:'town-'+p.atlasId,name:p.name,region:p.regionName,territory:p.territory,population:p.designPopulation,role:p.designRole,status:p.atlasId==='1'?'draft_for_review':previousSites.get('town-'+p.atlasId)?.status||'not_started',userValidated:p.atlasId==='1'?false:previousSites.get('town-'+p.atlasId)?.userValidated||false}));fs.writeFileSync(path.join(root,'data/architecture/city-plans/registry.json'),JSON.stringify({schema:1,pushAllowed:false,rule:'No push before all sites are designed and validated by the user.',sites:all},null,2)+'\n');
console.log(JSON.stringify(spec.summary,null,2));
