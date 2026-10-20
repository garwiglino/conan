/* Clairfoyer's visible inhabitants are a bounded sample of its existing census.
 * The economic simulation owns every stock, yield, injury and worker loss. */
(()=>{
 'use strict';
 const D=CITY_LIFE_DATA,H=HearthreaverHumanActivities,P=HearthreaverIsometricStations,
  profiles=D.people.map((p,i)=>({...p,id:p.actor||'resident-town-1-city-'+p.key,index:i})),routes=new Map();
 const length=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y),hour=g=>((g.clock/60)%24+24)%24;
 function interrupted(g,n){const c=n.civilian,b=n.batracien;
  const labour=g.worldState.simulation?.state.sites[n.labourSite||D.site]?.workerRecords[n.id];
  return labour?.reasons.returning||labour?.assignment||!c||c.dead||c.critical||c.hp<=1||n.dangerState||n.worldChat||n.justiceReport||n.labourReturning||n.reliefPost||n.convoyId||n.campaignGroup||b?.routine?.partner||g.dialogue?.who===n||g.party.some(m=>m.id===n.id)||['hit','startle','stand_up'].includes(c.action)&&c.elapsed<(b?HearthreaverBatraciens.CLIPS[c.action]?.duration/1000:civilianDuration(c.action));
 }
 function fixture(g,p){return [...g.humanWorkstations.values()].find(w=>!w.actor&&w.site===D.site&&w.district===p.district&&w.id===p.fixture);}
 function socketAt(f){const s=P.sockets(f.id).operator,move=p=>WorldProjection.inverse(p[0]-64,p[1]-96);return {s,feet:move(s.feet),approach:move(s.approach)};}
 // Long commutes use the approved streets, then short collision-checked legs.
 // No straight chord across a district and no large per-frame path search.
 function streetPath(site,centre,start,end){
  const nav=site.navigation,points=nav.points.map(p=>({x:centre.x+p[0],y:centre.y+p[1]})),adj=points.map(()=>[]);
  for(const [u,v]of nav.edges){const d=length(points[u],points[v]);adj[u].push([v,d]);adj[v].push([u,d]);}
  const attach=p=>{let best;for(const [u,v]of nav.edges){const a=points[u],b=points[v],q=Atlas.project(p.x,p.y,[a.x,a.y],[b.x,b.y]);if(!best||q.d<best.distance)best={u,v,distance:q.d};}const id=points.length;points.push(p);adj.push([]);for(const v of [best.u,best.v]){const d=length(p,points[v]);adj[id].push([v,d]);adj[v].push([id,d]);}return {id,...best};};
  const a=attach(start),b=attach(end);if(a.u===b.u&&a.v===b.v){const d=length(start,end);adj[a.id].push([b.id,d]);adj[b.id].push([a.id,d]);}
  const queue=new Atlas.Heap(),cost=new Map([[a.id,0]]),prev=new Map();queue.push({id:a.id,cost:0});
  while(queue.size){const n=queue.pop();if(n.cost!==cost.get(n.id))continue;if(n.id===b.id){const out=[end];let k=b.id;while(prev.has(k)){k=prev.get(k);out.unshift(points[k]);}return out;}
   for(const [id,d]of adj[n.id]){const c=n.cost+d;if(c>=(cost.get(id)??Infinity))continue;cost.set(id,c);prev.set(id,n.id);queue.push({id,cost:c});}}
  return [];
 }
 function subdivide(path){const out=[path[0]];for(let i=1;i<path.length;i++){const a=path[i-1],b=path[i],count=Math.ceil(length(a,b)/192);for(let j=1;j<=count;j++)out.push({x:a.x+(b.x-a.x)*j/count,y:a.y+(b.y-a.y)*j/count});}return out;}
 Game.prototype.populateCityLife=function(){
  const site=this.settlements.sites.get(D.site),campaign=this.worldState.simulation?.state.sites[D.site];if(!site||site.planRevision!==D.planRevision||!campaign)return;
  const centre=Atlas.toGame(Atlas.byId[D.site].x,Atlas.byId[D.site].y);
  for(const p of profiles){let n=this.npcs.find(n=>n.id===p.id);
   if(!n){if(p.actor)continue;const named=Object.values(campaign.workerRecords).filter(r=>!r.dead&&!r.anonymous).length;
    if(!campaign.workerRecords[p.id]&&campaign.workers<=named)continue;const f=site.fixtures.find(f=>f.district===p.district&&f.id===p.fixture);if(!f)continue;
    const q=socketAt(f),pos={x:centre.x+f.x+q.feet.x,y:centre.y+f.y+q.feet.y};
    n={id:p.id,...pos,post:{...pos},dir:2,baseDir:2,level:0,alpha:1,world:true,site:D.site,resident:true,look:'nomade',head:30,civilianJob:'ledger',name:p.label,label:p.label,title:p.purpose,
     greet:()=>[p.purpose+'.'],topics:()=>[],bye:()=>['Bonne route.']};
    this.npcs.push(n);this.atlasNpcs.push(n);
    const saved=this.civilianRecords?.[p.id],sex=H.ROLES[p.role].sexes[civilianHash(p.id)%H.ROLES[p.role].sexes.length];
    this.ensureCivilian(n,saved||{appearance:{sex}});
    // Reserve a named representation, without incrementing the workforce.
    campaign.workerRecords[n.id]||={id:n.id,reasons:{},debited:false,dead:!!campaign.losses[n.id]};
   }
   n.cityLife||={profile:p.index,phase:null,inside:false};
  }
 };
 const populate=Game.prototype.populateCivilians;
 Game.prototype.populateCivilians=function(...args){const out=populate.apply(this,args);this.populateCityLife();if(this.settlementReady)this.bindCityLife();return out;};
 Game.prototype.bindCityLife=function(saved){
  this.populateCityLife();const site=this.settlements.sites.get(D.site);if(!site)return;
  const centre=Atlas.toGame(Atlas.byId[D.site].x,Atlas.byId[D.site].y),records=new Map((saved?.atlas?.cityLife?.people||[]).slice(0,40).map(r=>[r.id,r])),usedHomes=new Set(this.npcs.filter(n=>n.cityLife?.route).map(n=>n.cityLife.route.building));
  for(const p of profiles){const n=this.npcs.find(n=>n.id===p.id),w=fixture(this,p);if(!n||!w||this.humanWorkstations.get(n.id)?.cityFixture)continue;
   const work={x:w.feet[0],y:w.feet[1]},key=SETTLEMENT_DATA.revision+'|'+p.id;let route=routes.get(key);if(route&&usedHomes.has(route.building))route=null;
   if(!route){
    const homes=site.buildings.filter(b=>!usedHomes.has(b.uid)&&(b.role==='housing'||b.id==='B07'||['gallery-inn','carters-inn'].includes(HearthreaverSettlementArchitecture.entry(b.id).shape))).map(b=>({b,point:b.apron?{x:centre.x+b.apron.x*16,y:centre.y+b.apron.y*16}:{x:centre.x+b.entrance.x,y:centre.y+b.entrance.y}})).sort((a,b)=>length(a.point,work)-length(b.point,work));
    const free=(x,y)=>!this.solid(x,y,4,0),edge=(a,b)=>this.npcSegmentFree(n,a,b);
    for(const q of homes.slice(0,32)){if(!free(q.point.x,q.point.y))continue;let path=Atlas.localPath(work,q.point,free,2200,edge);
     if(!path.length){const building=site.buildings.find(b=>b.uid===w.building),access=b=>b.access.map(p=>({x:centre.x+p[0],y:centre.y+p[1]})),from=access(building),to=access(q.b),first=w.access?.slice().reverse().map(p=>({x:centre.x+p[0],y:centre.y+p[1]}))||Atlas.localPath(work,from[0],free,2200,edge),middle=streetPath(site,centre,from.at(-1),to.at(-1));
      if(first.length&&middle.length){const trial=[work,...first,...from,...middle,...to.slice().reverse()],clean=trial.filter((p,i)=>!i||length(p,trial[i-1])>.01);if(clean.slice(1).every((p,i)=>edge(clean[i],p)))path=clean.slice(1);}}
     if(path.length){route={home:q.point,building:q.b.uid,path:subdivide([work,...path])};routes.set(key,route);break;}}
   }
   if(!route){n.cityLife.unreachable=true;continue;}
   usedHomes.add(route.building);delete n.cityLife.unreachable;n.cityLife.route=route;n.cityLife.work=work;
   const clone={...w,uid:n.id+'-city-work',actor:n.id,cityFixture:w.uid,role:p.role||'civilian',action:p.action,fixture:w.id};this.humanWorkstations.set(n.id,clone);
   n.post={...work};n.path=[];delete n.localLife;
   if(n.batracien){n.batracien.work={...work};n.batracien.workDir=['dos','droite','face','gauche'].indexOf(w.socket.facing);}
   const record=this.worldState.simulation.state.sites[n.labourSite||D.site].workerRecords[n.id];if(record){record.home={...work};record.cityService=true;record.service||='city-'+p.id;if(record.reasons.returning)n.labourReturning=true;}
   const position=this.civilianRecords?.[n.id]||this.batracienRecords?.[n.id],row=records.get(n.id);
   if(!interrupted(this,n)||n.civilian.dead){
    if(position&&Number.isFinite(position.x)&&Number.isFinite(position.y)&&!this.solid(position.x,position.y,4,0)&&Math.min(length(position,work),length(position,route.home))<600){n.x=position.x;n.y=position.y;}
    else Object.assign(n,hour(this)<6||hour(this)>=22?route.home:work);
    n.cityLife.inside=!n.civilian.dead&&!!row?.inside&&length(n,route.home)<2;n.alpha=n.cityLife.inside?0:1;
   }
   n.civilian.lastX=n.x;n.civilian.lastY=n.y;
  }
  this.registerLabourActors();
 };
 const restore=Game.prototype.finishAtlasRestore;
 Game.prototype.finishAtlasRestore=function(saved){const out=restore.call(this,saved);this.bindCityLife(saved);this.syncLabourActors();return out;};
 Game.prototype.cityWorkSpec=function(n){const p=profiles[n.cityLife?.profile];return p&&!n.batracien?{role:p.role,action:p.action,fixture:p.fixture}:null;};
 Game.prototype.cityWorkAvailable=function(n){const p=profiles[n.cityLife?.profile],s=this.worldState.simulation?.state.sites[n.labourSite||D.site];if(!p||!s)return false;
  const has=id=>(s.stock[id]||0)>0;if(p.productionJob&&!this.worldState.simulation.systems.jobCanWork(s,p.productionJob))return false;
  if(p.gate&&!p.gate.every(has)||p.gateAny&&!p.gateAny.some(has))return false;
  const w=this.humanWorkstations.get(n.id),at=Atlas.toWorld(n.x,n.y),cell=Atlas.cellAt(at.x,at.y),snow=Atlas.visualSnowCover(cell?.biome,cell?.height,this.clock,cell?.region)>.5;
  return !snow||w?.sheltered||P.Winter.availability(p.action,{season:'igea_winter'}).allowed;
 };
 const action=Game.prototype.civilianAction;
 Game.prototype.civilianAction=function(n,id,restart=false){if(n.cityLife&&!n.batracien&&H.CLIPS[id]){const c=this.ensureCivilian(n);if(c.action!==id||restart){c.action=id;c.elapsed=0;}return;}return action.call(this,n,id,restart);};
 const local=Game.prototype.stepWorldLocal;
 Game.prototype.stepWorldLocal=function(n,...args){if(n.cityLife)return;return local.call(this,n,...args);};
 const present=Game.prototype.npcPresent;
 Game.prototype.npcPresent=function(n){return !n.cityLife?.inside&&present.call(this,n);};
 Game.prototype.stepCityLife=function(n,dt){
  const c=n.civilian,l=n.cityLife,p=profiles[l.profile],w=this.humanWorkstations.get(n.id);if(!l.route||!w||c.tickTime===this.time)return;c.tickTime=this.time;
  c.inv=Math.max(0,c.inv-dt);c.elapsed+=dt;if(n.batracien)n.batracien.elapsed=c.elapsed;
  const h=hour(this),shift=(civilianHash(n.id)%21)/60,night=h<6||h>=22,meal=h>=12+shift&&h<13+shift,
   working=h>=p.hours[0]+shift&&h<p.hours[1]&&!meal,phase=working?'work':night||meal?'inside':'courtyard',goal=working?l.work:l.route.home;
  if(l.phase!==phase){l.phase=phase;n.path=[];l.retryAt=0;l.legs=working?l.route.path.slice().reverse():l.route.path.slice();
   let nearest=Infinity,index=0;for(let i=1;i<l.legs.length;i++){const a=l.legs[i-1],b=l.legs[i],q=Atlas.project(n.x,n.y,[a.x,a.y],[b.x,b.y]);if(q.d<nearest){nearest=q.d;index=i;}}l.leg=index;
  }
  if(l.inside&&phase!=='inside'){l.inside=false;n.alpha=0;}
  if(!l.inside&&(phase!=='inside'||length(n,goal)>1.5))n.alpha=Math.min(1,(n.alpha??1)+dt/0.7);
  let moved=0;
  if(length(n,goal)>1.5){
   if(this.dialogue||this.journey||this.sleeping||this.dead||this.dying)return;
   if(!n.path?.length&&this.time<(l.retryAt||0))return;
   while(l.leg<l.legs.length-1&&length(n,l.legs[l.leg])<1.5)l.leg++;
   const from={x:n.x,y:n.y},next=l.legs[l.leg]||goal;if(!n.path?.length&&this.npcSegmentFree(n,n,next)){n.path=[{...next}];n.pathKey=Math.floor(next.x/16)+','+Math.floor(next.y/16);}this.walkNpc(n,next,dt);moved=length(n,from);
   if(!n.path?.length&&moved<.001)l.retryAt=this.time+2;
   c.distance+=moved;this.civilianAction(n,moved>.001?'walk':'idle');l.status=moved>.001?'commuting':'blocked';
  }else if(phase==='inside'){
   n.alpha=Math.max(0,(n.alpha??1)-dt/0.7);l.inside=n.alpha<=0;this.civilianAction(n,'idle');l.status=meal?'meal-at-home':'rest-at-home';
  }else{
   const available=working&&this.cityWorkAvailable(n);n.dir=working?['dos','droite','face','gauche'].indexOf(w.socket.facing):2;
   this.civilianAction(n,available?(n.batracien?p.action:c.job):'idle');l.status=working?(available?'working':'waiting-for-resources'):'courtyard';
  }
  c.lastX=n.x;c.lastY=n.y;if(n.batracien){const b=n.batracien;b.elapsed=c.elapsed;b.distance=c.distance;b.lastX=n.x;b.lastY=n.y;}
 };
 const animations=Game.prototype.stepCivilianAnimations;
 Game.prototype.stepCivilianAnimations=function(dt){const all=this.npcs,owned=all.filter(n=>n.cityLife?.route&&!interrupted(this,n));
  try{const ids=new Set(owned.map(n=>n.id));this.npcs=all.filter(n=>!ids.has(n.id));animations.call(this,dt);}finally{this.npcs=all;}
  for(const n of owned)this.stepCityLife(n,Math.max(0,Math.min(.04,dt)));
 };
 // A qualified clerk may temporarily staff an existing transport service.
 // Municipal cooks, healers and craftspeople do not inherit transport skills.
 const available=Game.prototype.labourAvailable;
 Game.prototype.labourAvailable=function(n,station=null){const record=this.worldState.simulation?.state.sites[n?.labourSite||n?.site]?.workerRecords[n?.id];if(n?.cityLife&&record?.service?.startsWith('city-')){const service=record.service;delete record.service;try{return available.call(this,n,station);}finally{record.service=service;}}return available.call(this,n,station);};
 const relieve=Game.prototype.canRelieve;
 Game.prototype.canRelieve=function(st,n,...args){if(n?.cityLife){const p=profiles[n.cityLife.profile];if(!['merchant','administrator'].includes(p.role)&&!(n.batracien&&p.action==='ledger'))return false;}return relieve.call(this,st,n,...args);};
 // Returning companions enter through the existing arrival road, then use the
 // same authored street network as the residents. Availability returns only at
 // the actual workplace, never at an intermediate street corner.
 Game.prototype.labourReturnTarget=function(n,destination){
  if(!n.cityLife?.route)return destination;
  const record=this.worldState.simulation.state.sites[n.labourSite||D.site].workerRecords[n.id];
  n.cityLife.inside=false;n.alpha=1;
  if(length(n,destination)<=480&&this.npcSegmentFree(n,n,destination)){n.path=[{...destination}];n.pathKey=Math.floor(destination.x/16)+','+Math.floor(destination.y/16);return destination;}
  const site=this.settlements.sites.get(D.site),centre=Atlas.toGame(Atlas.byId[D.site].x,Atlas.byId[D.site].y),w=this.humanWorkstations.get(n.id);
  this.cityReturnPaths||=new Map();let cached=this.cityReturnPaths.get(n.id),saved=record.cityReturn;
  if(saved?.revision!==SETTLEMENT_DATA.revision||!Array.isArray(saved.start)||saved.start.length!==2||!saved.start.every(Number.isFinite)||!Number.isInteger(saved.leg)||saved.leg<1){delete record.cityReturn;saved=null;}
  if(!cached||!saved||cached.start[0]!==saved.start[0]||cached.start[1]!==saved.start[1]){
   const start=saved?.start?{x:saved.start[0],y:saved.start[1]}:{x:n.x,y:n.y};let nearest;
   for(const [u,v]of site.navigation.edges){const a=site.navigation.points[u],b=site.navigation.points[v],q=Atlas.project(start.x-centre.x,start.y-centre.y,a,b);if(!nearest||q.d<nearest.d)nearest={...q,point:{x:centre.x+a[0]+(b[0]-a[0])*q.t,y:centre.y+a[1]+(b[1]-a[1])*q.t}};}
   if(nearest.d>560)return centre;
   const free=(x,y)=>!this.solid(x,y,4,0),edge=(a,b)=>this.npcSegmentFree(n,a,b),first=edge(start,nearest.point)?[nearest.point]:Atlas.localPath(start,nearest.point,free,2200,edge),b=site.buildings.find(b=>b.uid===w.building),access=b.access.map(p=>({x:centre.x+p[0],y:centre.y+p[1]})),middle=streetPath(site,centre,nearest.point,access.at(-1)),last=w.access.map(p=>({x:centre.x+p[0],y:centre.y+p[1]}));
   if(!first.length||!middle.length)return centre;
   const path=[start,...first,...middle,...access.reverse(),...last],clean=path.filter((p,i)=>!i||length(p,path[i-1])>.01);
   if(!clean.slice(1).every((p,i)=>edge(clean[i],p)))return centre;
   cached={start:[start.x,start.y],path:subdivide(clean)};this.cityReturnPaths.set(n.id,cached);record.cityReturn||={revision:SETTLEMENT_DATA.revision,start:cached.start,leg:1};saved=record.cityReturn;
  }
  saved.leg=Math.min(saved.leg,cached.path.length-1);
  while(saved.leg<cached.path.length-1&&length(n,cached.path[saved.leg])<=1.5)saved.leg++;
  const goal=cached.path[saved.leg]||destination;
  if(!n.path?.length&&this.npcSegmentFree(n,n,goal)){n.path=[{...goal}];n.pathKey=Math.floor(goal.x/16)+','+Math.floor(goal.y/16);}
  return goal;
 };
 const sync=Game.prototype.syncLabourActors;
 Game.prototype.syncLabourActors=function(){sync.call(this);for(const n of this.npcs){if(!n.cityLife?.route)continue;const r=this.worldState.simulation?.state.sites[n.labourSite||D.site]?.workerRecords[n.id];if(r){if(r.cityService&&!r.service&&!r.reasons.service&&!r.reasons.returning)r.service='city-'+n.id;r.onDuty=!interrupted(this,n)&&n.cityLife.status==='working'&&!n.cityLife.inside;}}};
 const serialize=Game.prototype.serialize;
 Game.prototype.serialize=function(){const out=serialize.call(this);if(out.atlas)out.atlas.cityLife={version:1,revision:SETTLEMENT_DATA.revision,people:this.npcs.filter(n=>n.cityLife).map(n=>({id:n.id,inside:n.cityLife.inside}))};return out;};
 Game.prototype.cityLifeDiagnostics=function(){return this.npcs.filter(n=>n.cityLife).map(n=>{const p=profiles[n.cityLife.profile];return {id:n.id,district:p.district,activity:p.action,fixture:p.fixture,status:n.cityLife.status||'ready',home:n.cityLife.route?.building,reachable:!!n.cityLife.route,inside:n.cityLife.inside};});};
})();
