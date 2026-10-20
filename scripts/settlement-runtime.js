/* Permanent native districts. Geometry is indexed once; the camera only culls art.
 * Existing people, economy, transport services and canonical geography stay authoritative. */
(()=>{
 const A=HearthreaverArchitectureGame,H=HearthreaverHumanActivities,P=HearthreaverHumanStations;
 const NATURAL_PROP=/^(?:world_(?:oak|pine|cypress|jungle|boulder|fern|reeds|log|flowers|mushrooms|gravel)|palm)/;
 const bucket=256,contains=(r,x,y,p=0)=>x>=r.x-p&&x<=r.x+r.w+p&&y>=r.y-p&&y<=r.y+r.h+p;
 class Spatial{
  constructor(){this.cells=new Map();}
  put(o,r){for(let y=Math.floor(r.y/bucket);y<=Math.floor((r.y+r.h)/bucket);y++)for(let x=Math.floor(r.x/bucket);x<=Math.floor((r.x+r.w)/bucket);x++){const k=x+','+y;if(!this.cells.has(k))this.cells.set(k,[]);this.cells.get(k).push(o);}}
  near(x,y,r=0){const found=new Set();for(let by=Math.floor((y-r)/bucket);by<=Math.floor((y+r)/bucket);by++)for(let bx=Math.floor((x-r)/bucket);bx<=Math.floor((x+r)/bucket);bx++)for(const o of this.cells.get(bx+','+by)||[])found.add(o);return found;}
  rect(r){const found=new Set();for(let y=Math.floor(r.y/bucket);y<=Math.floor((r.y+r.h)/bucket);y++)for(let x=Math.floor(r.x/bucket);x<=Math.floor((r.x+r.w)/bucket);x++)for(const o of this.cells.get(x+','+y)||[])found.add(o);return found;}
 }
 let districts=null;
 function makeDistricts(){
  if(districts)return districts;if(SETTLEMENT_DATA.layout!==Atlas.layout.id)throw Error('Les implantations doivent être reconstruites pour cet atlas');
  const collision=new Spatial(),art=new Spatial(),clear=new Spatial(),lanes=new Spatial(),sites=new Map(),buildings=[];
  for(const s of SETTLEMENT_DATA.sites){const node=Atlas.byId[s.id],p=Atlas.toGame(node.x,node.y),placed=[];
   for(const b of s.buildings){const o={...b,x:Math.round(p.x+b.x),y:Math.round(p.y+b.y),site:s.id},g=A.geometry(o.id,o);o.geometry=g;o.bounds=A.worldBounds(o);
    buildings.push(o);placed.push(o);collision.put(o,g.foot);art.put(o,o.bounds);const r={x:g.foot.x-16,y:g.foot.y-16,w:g.foot.w+32,h:g.foot.h+48};clear.put(r,r);
   }
   for(const lane of s.lanes){const r={...lane,x:p.x+lane.x,y:p.y+lane.y};clear.put(r,r);r.paved=node.regionalCentre;lanes.put(r,r);}
   sites.set(s.id,{...s,buildings:placed});
  }return districts={collision,art,clear,lanes,sites,buildings};
 }
 const cleared=(d,x,y)=>!!d&&[...d.clear.near(x,y)].some(r=>contains(r,x,y,8));
 const init=Game.prototype.initAtlas;
 Game.prototype.initAtlas=function(saved){this.settlements=makeDistricts();this.humanWorkstations=new Map();this.humanFixtureIndex=new Spatial();const stored=saved?.atlas?.humanWorkstations;this.humanStationRecords=new Map(stored?.version===1&&stored.layout===SETTLEMENT_DATA.layout&&stored.revision===SETTLEMENT_DATA.revision&&Array.isArray(stored.people)?stored.people.slice(0,200).filter(r=>r&&typeof r.actor==='string'&&Number.isFinite(r.x)&&Number.isFinite(r.y)&&Number.isInteger(r.x)&&Number.isInteger(r.y)).map(r=>[r.actor,r]):[]);const out=init.call(this,saved);
  for(const s of this.settlements.sites.values()){
   const inn=s.buildings.find(b=>b.id==='B07'),old=this.atlasProps.find(o=>o.site===s.id&&o.rest);if(!inn||!old)continue;
   const door=inn.geometry.portals[0];Object.assign(old,{kind:'settlement_refuge',x:door.x+door.nx*20,y:door.y+door.ny*20-14});
   const place=this.mapPlaces.find(p=>p.id==='rest-'+s.id);if(place)Object.assign(place,Atlas.toWorld(old.x,old.y+14),{name:'Auberge · '+s.name,kind:'inn'});
  }
  this.atlasProps=this.atlasProps.filter(o=>!NATURAL_PROP.test(o.kind)||!cleared(this.settlements,o.x,o.y));
  for(const n of this.npcs)if(n.resident&&!n.civilian?.dead&&!this.party.some(p=>p.id===n.id))this.repairSettlementSpawn(n);
  return out;
 };
 const serialize=Game.prototype.serialize;
 Game.prototype.serialize=function(){const saved=serialize.call(this);if(saved.atlas){for(const member of saved.atlas.party||[]){const actor=this.npcs.find(n=>n.id===member.id);if(actor&&!member.spirit){member.x=actor.x;member.y=actor.y;}}const records=new Map(this.humanStationRecords);for(const w of this.humanWorkstations.values())records.set(w.actor,{actor:w.actor,id:w.id,x:w.x,y:w.y,sheltered:w.sheltered,building:w.building});if(records.size)saved.atlas.humanWorkstations={version:1,layout:SETTLEMENT_DATA.layout,revision:SETTLEMENT_DATA.revision,people:[...records.values()]};}return saved;};
 Game.prototype.repairSettlementSpawn=function(n){
  if(n.level||!this.settlements.sites.has(n.site)||!this.solid(n.x,n.y,4,0))return false;
  const from={x:n.x,y:n.y};let goal;
  for(let r=8;r<=160&&!goal;r+=8)for(const [dx,dy]of [[0,r],[r,0],[-r,0],[0,-r],[r,r],[-r,r],[r,-r],[-r,-r]]){const p={x:from.x+dx,y:from.y+dy};if(!this.solid(p.x,p.y,4,0)&&!this.npcs.some(a=>a!==n&&!a.civilian?.dead&&Math.hypot(a.x-p.x,a.y-p.y)<14)){goal=p;break;}}
  if(!goal)return false;Object.assign(n,goal);if(n.civilian)Object.assign(n.civilian,{lastX:n.x,lastY:n.y});n.path=[];
  if(!this.humanWorkstations.has(n.id)&&n.post&&Math.hypot(n.post.x-from.x,n.post.y-from.y)<4){n.post={...goal};const record=this.worldState.simulation?.state.sites[n.labourSite||n.site]?.workerRecords[n.id];if(record)record.home={...goal};}return true;
 };
 Game.prototype.placeSettlementResident=function(n,record){
  const w=this.humanWorkstations.get(n.id),c=n.civilian;if(!w||!c||c.dead||c.critical||c.hp<=1||n.dangerState||n.justiceReport||n.labourReturning||n.reliefPost||n.convoyId||n.campaignGroup||this.party.some(p=>p.id===n.id))return;
  const valid=record&&Number.isFinite(record.x)&&Number.isFinite(record.y)&&Math.hypot(record.x-w.feet[0],record.y-w.feet[1])<800&&!this.solid(record.x,record.y,4,0);
  n.x=valid?record.x:w.feet[0];n.y=valid?record.y:w.feet[1];if(valid&&[0,1,2,3].includes(record.dir))n.dir=record.dir;
  c.lastX=n.x;c.lastY=n.y;n.path=[];
 };
 const populate=Game.prototype.populateCivilians;
 Game.prototype.populateCivilians=function(...args){const before=new Set(this.npcs.filter(n=>n.resident).map(n=>n.id)),result=populate.apply(this,args),added=this.npcs.filter(n=>n.resident&&!before.has(n.id));if(this.stations?.length)for(const n of added)if(!n.civilian?.dead)this.repairSettlementSpawn(n);
  if(this.settlementReady&&added.length){this.humanStationCount=-1;this.ensureHumanWorkstations();for(const n of added)this.placeSettlementResident(n,this.civilianRecords?.[n.id]);}return result;
 };
 const restore=Game.prototype.finishAtlasRestore;
 Game.prototype.finishAtlasRestore=function(saved){const result=restore.call(this,saved);this.ensureHumanWorkstations();
  const positions=new Map((saved?.atlas?.civilians?.people||[]).map(r=>[r.id,r]));for(const n of this.npcs)if(n.resident&&!n.batracien)this.placeSettlementResident(n,positions.get(n.id));this.settlementReady=true;
  for(const member of this.party){const n=this.npcs.find(n=>n.id===member.id);if(n&&!n.civilian?.dead){const site=n.site;n.site=Atlas.siteAt(...Object.values(Atlas.toWorld(n.x,n.y)))?.id||site;this.repairSettlementSpawn(n);n.site=site;}}
  if(this.solid(this.player.x,this.player.y,5,this.player.level))this.placeSafely(this.player.x,this.player.y);return result;
 };
 const tile=Game.prototype.tile;
 Game.prototype.tile=function(x,y){const t=tile.call(this,x,y);return t===4&&cleared(this.settlements,x,y)?0:t;};
 const solid=Game.prototype.solid;
 Game.prototype.solid=function(x,y,r=5,level=0){
  const d=this.settlements;if(d&&!level){for(const o of d.collision.near(x,y,r))for(const b of o.geometry.solids)if(b.zMin<19&&b.zMax>0&&A.contains(b,x,y,r))return true;
   for(const o of this.humanFixtureIndex?.near(x,y,r)||[]){if(o.id==='crop_patch')continue;const s=o.feet,q=o.foot;if(Math.hypot(x-s[0],y-s[1])<7||Math.hypot(x-o.approach[0],y-o.approach[1])<7)continue;if(x+r>q.x&&x-r<q.x+q.w&&y+r>q.y&&y-r<q.y+q.h)return true;}
  }return solid.call(this,x,y,r,level);
 };
 const props=Renderer.prototype.visibleAtlasProps;
 Renderer.prototype.visibleAtlasProps=function(){const d=this.g.settlements,cam=this.cam||{x:0,y:0},right=cam.x+(this.W||320)+64,bottom=cam.y+(this.H||224)+128;return props.call(this).filter(o=>o.kind!=='settlement_refuge'&&!(d&&NATURAL_PROP.test(o.kind)&&o.x>=cam.x-64&&o.x<=right&&o.y>=cam.y-64&&o.y<=bottom&&cleared(d,o.x,o.y)));};
 const ground=Renderer.prototype.drawAtlasGround;
 Renderer.prototype.drawAtlasGround=function(){ground.call(this);const d=this.g.settlements;if(!d)return;
  const view={x:this.cam.x,y:this.cam.y,w:this.W,h:this.H},lanes=d.lanes.rect(view);if(!lanes.size)return;
  // Reuse the shipped native trail/paving pixels, without inventing a ground atlas.
  this.districtGround ||= new Map();const painted=new Set();
  for(const lane of lanes){const type=lane.paved?2:1;let source=this.districtGround.get(type);
   if(!source){outer:for(let y=2;y<MH-2;y++)for(let x=2;x<MW-2;x++)if(this.g.world.tiles[y][x]===type&&this.g.world.tiles[y-1][x]===type&&this.g.world.tiles[y+1][x]===type&&this.g.world.tiles[y][x-1]===type&&this.g.world.tiles[y][x+1]===type){source={x:x*16,y:y*16};break outer;}if(!source)continue;this.districtGround.set(type,source);}
   const x0=Math.max(Math.ceil(lane.x/16),Math.floor(view.x/16)),y0=Math.max(Math.ceil(lane.y/16),Math.floor(view.y/16));
   for(let y=y0;y*16+16<=Math.min(lane.y+lane.h,view.y+view.h+16);y++)for(let x=x0;x*16+16<=Math.min(lane.x+lane.w,view.x+view.w+16);x++){
    const key=x+','+y;if(painted.has(key))continue;painted.add(key);const t=this.g.tile(x*16+8,y*16+8);if([3,5,8].includes(t)||isSnow(this.g,{x:x*16+8,y:y*16+8}))continue;
    this.c.drawImage(this.bg,source.x,source.y,16,16,x*16,y*16,16,16);
   }
  }
 };
 const JOBS={hoe:['farmer','hoe','crop_patch'],sow:['farmer','sow','crop_patch'],craft:['smith','craft','workbench'],pottery:['potter','pottery','potters_wheel'],weave:['weaver','loom','loom'],stir:['cook','cook','cooking_hearth'],net:['fisher','net','drying_rack'],groom:['groom','groom','care_stall'],load:['caravaner','load','market_stall'],rope:['boatman','rope','rope_bench'],ledger:['merchant','ledger','clerks_desk'],carry:['porter','carry',null]};
 Game.prototype.humanWorkSpec=function(n){
  const c=n.civilian,s=this.worldState.simulation?.state.sites[n.labourSite||n.site],spec=JOBS[c?.job];if(!spec||!n.resident||n.batracien||!s||!this.worldState.simulation.systems.jobCanProduce(s,c.job)||!this.settlements.sites.has(n.site))return null;
  let [role,action,fixture]=spec;if(!H.ROLES[role].sexes.includes(c.appearance.sex)){if(['hoe','sow'].includes(c.job)){role='gardener';action='sow';}else return null;}
  // Carrying and animal/boat actions require the corresponding live entity;
  // a stationary work loop must not manufacture a load, mount or vehicle.
  if(['carry','groom','rope','load','net'].includes(c.job))return null;
  return {role,action,fixture};
 };
 Game.prototype.ensureHumanWorkstations=function(){
  if(this.humanStationCount===this.npcs.length)return;this.humanStationCount=this.npcs.length;
  for(const n of this.npcs){if(this.humanWorkstations.has(n.id))continue;const spec=this.humanWorkSpec(n);if(!spec)continue;
   const local=P.sockets(spec.fixture,{x:0,y:0}).operator,g=P.geometry(spec.fixture),district=this.settlements.sites.get(n.site),crop=spec.fixture==='crop_patch';
   const models=spec.fixture==='workbench'?['B09','B12','B05']:['B05'],candidates=[];
   for(const b of district.buildings){
    if(crop&&b.role==='housing'){const r=b.geometry.foot;for(const side of [-1,1])candidates.push({x:r.x+(side<0?-32:r.w+32),y:r.y+r.h/2,sheltered:false});}
    else if(!crop&&models.includes(b.id)&&A.entry(b.id).openHall){for(const spot of b.geometry.workspots)candidates.push({...spot,sheltered:true,building:b.uid});}
   }
   const centre=Atlas.toGame(Atlas.byId[n.site].x,Atlas.byId[n.site].y),angle=(civilianHash(n.id)%24)/24*Math.PI*2,origin={x:centre.x+Math.round(Math.cos(angle)*40),y:centre.y+Math.round(Math.sin(angle)*40)};
   candidates.sort((p,q)=>Math.hypot(p.x-origin.x,p.y-origin.y)-Math.hypot(q.x-origin.x,q.y-origin.y));
   const stored=this.humanStationRecords.get(n.id);if(stored?.id===spec.fixture&&Math.hypot(stored.x-centre.x,stored.y-centre.y)<district.radius*16+64)candidates.unshift({x:stored.x+local.feet[0],y:stored.y+local.feet[1],sheltered:!!stored.sheltered,building:stored.building,restored:true});
   for(const target of candidates){
    if(!target.restored&&Math.hypot(target.x-origin.x,target.y-origin.y)>500)continue;
    const x=Math.floor(target.x/16)*16+8-local.feet[0],y=Math.floor(target.y/16)*16+8-local.feet[1],foot={x:x-g.width/2,y:y-g.depth,w:g.width,h:g.depth+2};
    const feet=[x+local.feet[0],y+local.feet[1]],approach=[x+local.approach[0],y+local.approach[1]];
    if(!target.restored&&(this.solid(...feet,4,0)||this.solid(...approach,4,0)))continue;
    if(!target.restored&&crop&&[...this.settlements.lanes.near(x,y,32)].some(r=>foot.x<r.x+r.w&&foot.x+foot.w>r.x&&foot.y<r.y+r.h&&foot.y+foot.h>r.y))continue;
    let blocked=false;for(let dy=-g.depth;!target.restored&&dy<=0;dy+=4)for(let dx=-g.width/2;dx<=g.width/2;dx+=4)if(this.solid(x+dx,y+dy,2,0))blocked=true;if(blocked)continue;
    if(!target.restored){
     const fixtureBlocks=(px,py)=>Math.hypot(px-feet[0],py-feet[1])>=7&&Math.hypot(px-approach[0],py-approach[1])>=7&&px+4>foot.x&&px-4<foot.x+foot.w&&py+4>foot.y&&py-4<foot.y+foot.h;
     const free=(px,py)=>!this.solid(px,py,4,0)&&!fixtureBlocks(px,py);
     if(![[16,0],[-16,0],[0,24],[0,-24]].some(([dx,dy])=>free(feet[0]+dx,feet[1]+dy)))continue;
     if(!Atlas.localPath(centre,{x:feet[0],y:feet[1]},free).length)continue;
    }
    const w={...spec,id:spec.fixture,uid:n.id+'-workstation',actor:n.id,x,y,foot,feet,approach,socket:local,sheltered:target.sheltered,building:target.building};
    this.humanWorkstations.set(n.id,w);this.humanFixtureIndex.put(w,foot);n.post={x:feet[0],y:feet[1]};n.path=[];
    const record=this.worldState.simulation?.state.sites[n.labourSite||n.site]?.workerRecords[n.id];if(record)record.home={...n.post};break;
   }
  }
 };
 const step=Game.prototype.stepCivilianAnimations;
 Game.prototype.stepCivilianAnimations=function(dt){step.call(this,dt);if(!this.humanWorkstations)return;this.ensureHumanWorkstations();for(const n of this.npcs)if(n.resident&&!n.batracien&&this.settlements.sites.has(n.site)&&n.civilian?.action===n.civilian?.job&&!this.humanWorkstations.has(n.id))this.civilianAction(n,'idle');
  for(const [id,w]of this.humanWorkstations){const n=this.npcs.find(n=>n.id===id),c=n?.civilian;if(c&&!c.dead&&['sit_down','seated','stand_up'].includes(c.action)&&!w.socket.support){this.civilianAction(n,'idle');continue;}if(!c||c.dead||c.action!==c.job)continue;
   if(!this.humanWorkSpec(n)||!this.worldState.simulation.systems.jobCanWork(this.worldState.simulation.state.sites[n.labourSite||n.site],c.job)||isSnow(this,n)&&!P.Winter.availability(w.action,{season:'igea_winter'}).allowed||n.dangerState||n.worldChat||n.justiceReport||n.labourReturning||n.convoyId||n.campaignGroup||n.reliefPost||this.dialogue?.who===n||this.party.some(m=>m.id===id)||Math.hypot(n.x-w.feet[0],n.y-w.feet[1])>2){this.civilianAction(n,'idle');continue;}
   n.dir=['dos','droite','face','gauche'].indexOf(w.socket.facing);
  }
 };
 Game.prototype.settlementPathEdges=function(n,to){if(n.level||!this.settlements||Math.abs(Math.floor(n.x/16)-Math.floor(to.x/16))>36||Math.abs(Math.floor(n.y/16)-Math.floor(to.y/16))>36)return null;const r={x:Math.min(n.x,to.x)-8,y:Math.min(n.y,to.y)-8,w:Math.abs(n.x-to.x)+16,h:Math.abs(n.y-to.y)+16};if(!this.settlements.collision.rect(r).size&&!this.humanFixtureIndex.rect(r).size)return null;return(from,end)=>this.npcSegmentFree(n,from,end);};
 const stepPeople=Game.prototype.stepNpcs;
 Game.prototype.stepNpcs=function(dt){stepPeople.call(this,dt);if(!this.humanWorkstations||!(dt>0)||this.dialogue||this.journey||this.sleeping)return;
  let planned=false;for(const [id,w]of this.humanWorkstations){const n=this.npcs.find(n=>n.id===id),c=n?.civilian;if(!n||c?.dead||c?.critical||c?.hp<=1||n.dangerState||n.worldChat||n.justiceReport||n.labourReturning||n.convoyId||n.campaignGroup||n.reliefPost||this.party.some(p=>p.id===id))continue;
   if(Math.hypot(n.x-w.feet[0],n.y-w.feet[1])<=2)continue;
   if(!n.path?.length){if(planned||this.time<(w.retryAt||0))continue;planned=true;w.retryAt=this.time+1;}
   this.walkNpc(n,{x:w.feet[0],y:w.feet[1]},dt);
  }
 };
 const frameCache=new Map(),fixtureCache=new Map(),roofSnowCache=new Map();
 function pixelCanvas(width,height,points){const cv=document.createElement('canvas');cv.width=width;cv.height=height;const c=cv.getContext('2d');for(const [x,y,colour]of points){c.fillStyle='#'+colour.replace('#','');c.fillRect(x,y,1,1);}return cv;}
 function nativeAtlas(renderer){return P.createAtlasAdapter({getPropPixels(key){const cv=renderer.propCache[key];if(!cv)throw Error('Prop natif manquant : '+key);const c=cv.getContext('2d'),v=c.getImageData(0,0,cv.width,cv.height).data,out=[];for(let y=0;y<cv.height;y++)for(let x=0;x<cv.width;x++){let i=(y*cv.width+x)*4;if(v[i+3])out.push([x-32,y-56,((v[i]<<16)|(v[i+1]<<8)|v[i+2]).toString(16).padStart(6,'0')]);}return out;},getTerrainPixel(material,x,y){renderer.humanTerrainPixels ||= new Map();let data=renderer.humanTerrainPixels.get(material);if(!data){const type=material==='water'?3:1;let at;outer:for(let ty=1;ty<MH-1;ty++)for(let tx=1;tx<MW-1;tx++)if(renderer.g.world.tiles[ty][tx]===type){at=[tx*16,ty*16];break outer;}if(!at)throw Error('Matière native manquante : '+material);data=renderer.bg.getContext('2d').getImageData(...at,16,16).data;renderer.humanTerrainPixels.set(material,data);}const i=(((Math.round(y)%16+16)%16)*16+(Math.round(x)%16+16)%16)*4;return ((data[i]<<16)|(data[i+1]<<8)|data[i+2]).toString(16).padStart(6,'0');}});}
 function fixtureImage(w,snow,renderer){const key=w.id+'|'+snow+'|'+!!w.sheltered;let v=fixtureCache.get(key);if(!v){const decor=P.render({id:w.id,season:snow&&!w.sheltered?'igea_winter':null,atlas:nativeAtlas(renderer)});v={decor,back:pixelCanvas(128,128,decor.layers.back),front:pixelCanvas(128,128,decor.layers.front)};fixtureCache.set(key,v);}return v;}
 function isSnow(g,o){const minute=Math.floor(g.clock);if(g.settlementSnowClock!==minute){g.settlementSnowClock=minute;g.settlementSnow=new Map();}const p=Atlas.toWorld(o.x,o.y),c=Atlas.cellAt(p.x,p.y),key=c?.id??'none';if(!g.settlementSnow.has(key))g.settlementSnow.set(key,Atlas.visualSnowCover(c?.biome,c?.height,minute,c?.region)>.5);return g.settlementSnow.get(key);}
 const architecture=Renderer.prototype.architectureDrawObjects;
 Renderer.prototype.architectureDrawObjects=function(){const out=architecture?architecture.call(this):[],g=this.g,d=g.settlements;if(!d)return out;
  const view={x:this.cam.x-16,y:this.cam.y-16,w:this.W+32,h:this.H+32};
  for(const o of d.art.rect(view)){const b=o.bounds;if(b.x+b.w<view.x||b.x>view.x+view.w||b.y+b.h<view.y||b.y>view.y+view.h)continue;
   out.push(...HearthreaverArchitectureRender.objects(this,o,isSnow(g,o)));
  }
  for(const w of g.humanWorkstations?.values()||[]){if(w.id==='crop_patch'&&isSnow(g,w))continue;if(Math.abs(w.x-(view.x+view.w/2))>view.w/2+70||Math.abs(w.y-(view.y+view.h/2))>view.h/2+100)continue;const im=fixtureImage(w,isSnow(g,w),this);
   const p=this.projectionActive?WorldProjection.point(w.x,w.y):w,feet=this.projectionActive?WorldProjection.point(...w.feet):{y:w.feet[1]};out.push({always:true,y:Math.min(p.y,feet.y)-.1,fn:()=>this.c.drawImage(im.back,p.x-64,p.y-96)},{always:true,y:Math.max(p.y,feet.y)+.1,fn:()=>this.c.drawImage(im.front,p.x-64,p.y-96)});
  }return out;
 };
 const draw=Renderer.prototype.npcDraw;
 Renderer.prototype.npcDraw=function(n){const c=n.civilian,w=this.g.humanWorkstations?.get(n.id);if(!c||n.batracien||!n.resident||!this.g.settlements.sites.has(n.site))return draw.call(this,n);
  const physical=n._logical||n,working=w&&c.action===c.job&&this.g.humanWorkSpec(n)&&Math.hypot(physical.x-w.feet[0],physical.y-w.feet[1])<=2,action=working?w.action:H.activitiesFor('civilian').includes(c.action)?c.action:'idle',role=working?w.role:'civilian',a=c.appearance;
  const dir=['dos','droite','face','gauche'][n.dir??2],climate=({teremor:'tempere',sylverive:'tempere',igea:'neige',sarak:'aride',varan:'marais',tagon:'jungle'})[this.g.settlements.sites.get(n.site)?.family]||'tempere';
  const frame=H.frameAt(action,c.elapsed||0,H.CLIPS[action].stride?c.distance:undefined),interaction=(working||w?.socket.support&&['sit_down','seated','stand_up'].includes(c.action)&&Math.hypot(physical.x-w.feet[0],physical.y-w.feet[1])<=2)?P.interaction(fixtureImage(w,isSnow(this.g,w),this).decor):undefined;
  const outfit=H.Sources.outfits[a.outfit]?a.outfit:Object.keys(H.Sources.outfits).find(id=>H.Sources.outfits[id].source===a.outfit);
  const options={...a,outfit,role,action,dir,climate,frame,interaction},key=JSON.stringify([a,role,action,dir,frame,climate,working?w.id:null]);let im=frameCache.get(key);
  if(!im){const p=H.renderLayers(options);im=pixelCanvas(80,80,p.order.flatMap(k=>p.layers[k]));frameCache.set(key,im);if(frameCache.size>256)frameCache.delete(frameCache.keys().next().value);}
  if((n.alpha??1)<=0)return;this.c.save();this.c.globalAlpha=n.alpha??1;this.shadow(n.x,n.y,c.dead?17:12);this.c.drawImage(im,Math.round(n.x)-40,Math.round(n.y)-52);n._img=im;
  if(!c.dead){this.npcNameplate(n);const m=this.g.npcPresent(n)&&this.g.npcMark(n);if(m)this.questMark(n.x,n.y-38-Math.max(0,(textSettings.scale-1)*8),m);}this.c.restore();
 };
 Game.prototype.settlementDiagnostics=function(){return {sites:this.settlements?.sites.size||0,buildings:this.settlements?.buildings.length||0,workstations:this.humanWorkstations?.size||0,actorFrames:frameCache.size,fixtureFrames:fixtureCache.size,architecture:HearthreaverArchitectureRender.diagnostics()};};
})();
