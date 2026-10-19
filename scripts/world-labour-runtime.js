/* One local person cannot also work at home while travelling or incapacitated. */
(()=>{
 const sim=g=>g.worldState?.simulation;
 const enlisted=n=>!!(n?.eventGuard||n?.convoyGuard||n?.convoyId||n?.campaignGroup||n?.guardState||n?.batracien?.role);
 Game.prototype.registerLabourActors=function(){
  const campaign=sim(this)?.state;if(!campaign)return;if(this.labourState!==campaign){this.labourState=campaign;this.labourNpcCount=-1;this.labourActors=new Map();this.labourSiteByPerson=new Map([...new Set(Object.values(campaign.sites))].flatMap(site=>Object.keys(site.workerRecords).map(id=>[id,site.id])));}
  this.labourActors||=new Map();if(this.labourNpcCount===this.npcs.length)return;this.labourNpcCount=this.npcs.length;
  for(const n of this.npcs){if(enlisted(n)||!(n.resident||/^(relay-|courier-)/.test(n.id)||['elyne','veilleur','zahra'].includes(n.id)))continue;
   const s=sim(this),id=this.labourSiteByPerson.get(n.id)||n.site||this.couriers?.find(c=>c.id===n.id)?.from||Atlas.nearestSite(...Object.values(Atlas.toWorld(n.x,n.y))).id,site=s?.state.sites[id];if(!site)continue;
   const record=site.workerRecords[n.id]||={id:n.id,reasons:{},debited:false,dead:!!site.losses[n.id]};record.home||={...(n.post||{x:n.x,y:n.y})};n.labourSite=site.id;this.labourSiteByPerson.set(n.id,site.id);this.labourActors.set(n.id,n);
  }
 };
 Game.prototype.syncLabourActors=function(){
  const s=sim(this);if(!s)return;this.registerLabourActors();const members=new Map(this.party.map(c=>[c.id,c]));
  for(const [id,n]of this.labourActors){const record=s.state.sites[n.labourSite]?.workerRecords[id];if(!record)continue;const member=members.get(id);if(n.civilian?.dead&&!member&&!record.dead)s.systems.death(n.labourSite,id);if(record.dead)continue;const incapacitated=!!(n.civilian?.critical||member?.down||!member&&n.civilian?.hp<=1);
   // A legacy save may have an absent person without an availability record.
   if(member)s.systems.setWorkerReason(n.labourSite,id,'party',true);
   s.systems.setWorkerReason(n.labourSite,id,'incapacity',incapacitated);
   if(!member&&n.civilian?.hp<=1&&!n.civilian.dead&&!n.civilian.critical){record.nextCare??=this.clock+360;s.requestCare(n.labourSite,id);
    if(this.clock>=record.nextCare&&!n.dangerState&&dist(n,record.home)<48){const site=s.state.sites[n.labourSite];if(s.stock(site,'medicinal')>=1&&s.stock(site,'provisions')>=1){site.stock.medicinal--;site.stock.provisions--;n.civilian.hp=Math.min(6,n.civilian.hp+2);record.nextCare=this.clock+360;s.finishCare(n.labourSite,id);s.systems.setWorkerReason(n.labourSite,id,'incapacity',false);s.history('worker_treated',{site:site.id,person:id,hp:n.civilian.hp});}}
   }
  }
 };
 const recruit=Game.prototype.recruitCompanion;
 Game.prototype.recruitCompanion=function(n,...args){
  if(enlisted(n))return false;this.registerLabourActors();const result=recruit.call(this,n,...args);
  if(result&&n.labourSite){const s=sim(this),record=s.state.sites[n.labourSite].workerRecords[n.id];const job=this.couriers?.find(c=>c.id===n.id);if(job?.returnTo)record.home={...job.returnTo};s.systems.setWorkerReason(n.labourSite,n.id,'party',true);s.systems.setWorkerReason(n.labourSite,n.id,'returning',false);delete record.returnRoute;delete n.labourReturning;}
  return result;
 };
 const dismiss=Game.prototype.dismissCompanion;
 Game.prototype.dismissCompanion=function(id){const n=this.partyActor(id),result=dismiss.call(this,id);if(result&&n?.labourSite){const s=sim(this);s.systems.setWorkerReason(n.labourSite,id,'returning',true);s.systems.setWorkerReason(n.labourSite,id,'party',false);n.labourReturning=true;s.state.sites[n.labourSite].workerRecords[id].returnClock=this.clock;this.stepLabourReturns(0);}return result;};
 const walk=Game.prototype.walkNpc;Game.prototype.walkNpc=function(n,to,dt){if(n.labourReturning&&!this.labourWalking)return false;return walk.call(this,n,to,dt);};
 Game.prototype.stepLabourReturns=function(dt=0){
  const s=sim(this);if(!s||!this.labourActors)return;
  for(const [id,n]of this.labourActors){const site=s.state.sites[n.labourSite],record=site?.workerRecords[id];if(!record?.reasons.returning||record.dead||this.party.some(c=>c.id===id))continue;n.labourReturning=true;const elapsed=Math.max(0,this.clock-(record.returnClock??this.clock));record.returnClock=this.clock;
   if(n.civilian?.critical||n.civilian?.dead||n.dangerState||this.dialogue?.who===n){if(record.returnRoute)record.returnRoute.clock=this.clock;continue;}
   const home=record.home,world=Atlas.toWorld(n.x,n.y);let route=record.returnRoute;
   const near=dist(n,this.player)<1500&&!this.journey&&!this.sleeping;
   this.labourWalking=true;try{
    if(!route&&dist(n,home)>48){const path=s.systems.graphPath(site.id,world),node=Atlas.toGame(Atlas.byId[site.id].x,Atlas.byId[site.id].y),homePath=dist(home,node)>48?s.systems.graphPath(site.id,Atlas.toWorld(home.x,home.y)):[];if(!path||!homePath)continue;route=record.returnRoute={site:site.id,path,leg:path.length,progress:0,clock:this.clock};s.systems.reverse(route);route.path.push(...homePath);}
    let homeSeconds=near?dt:WorldPacing.realSeconds(elapsed);
    if(route&&route.path[route.leg]){const goal=Atlas.toGame(...Object.values(s.systems.position(route)));route.clock=this.clock;let travelMinutes=elapsed;
     if(dist(n,goal)>12){const seconds=near?dt:Math.min(16,WorldPacing.realSeconds(elapsed));let used=0;while(used<seconds-1e-7&&dist(n,goal)>2){const step=Math.min(.25,seconds-used);walk.call(this,n,goal,step);used+=step;}travelMinutes=Math.max(0,elapsed-used*1440/WorldPacing.dayRealSeconds);homeSeconds=Math.max(0,homeSeconds-used);}
     if(!near&&dist(n,goal)<=12){const result=s.systems.move(route,travelMinutes,this.clock);Object.assign(n,Atlas.toGame(...Object.values(s.systems.position(route))));homeSeconds=WorldPacing.realSeconds(result.remaining);}
     else if(near&&dist(n,goal)<=12){const leg=route.path[route.leg];if(leg&&!this.worldState.edgeStatus(Atlas.edgeById.get(leg.edge),this.clock).closed){const t=Math.min(1,((route.progress||0)+2)/Math.max(.001,leg.length)),target=Atlas.toGame(leg.from[0]+(leg.to[0]-leg.from[0])*t,leg.from[1]+(leg.to[1]-leg.from[1])*t);walk.call(this,n,target,dt);const w=Atlas.toWorld(n.x,n.y),distance=Atlas.project(w.x,w.y,leg.from,leg.to).t*leg.length;s.systems.move(route,Math.max(0,distance-route.progress)/WorldPacing.metresPerMinute(WorldPacing.civilianWalk),this.clock);}}
    }
    if(!route||!route.path[route.leg]){for(let left=Math.min(16,homeSeconds);left>1e-7&&dist(n,home)>12;left-=.25)walk.call(this,n,home,Math.min(.25,left));if(dist(n,home)<=12){s.systems.setWorkerReason(site.id,id,'returning',false);delete record.returnRoute;delete n.labourReturning;n.post={...home};}}
   }finally{this.labourWalking=false;record.position={x:n.x,y:n.y};}
  }
 };
 const damage=Game.prototype.damageCivilian;Game.prototype.damageCivilian=function(...args){const result=damage.apply(this,args);if(result)this.syncLabourActors();return result;};
 const advance=Game.prototype.advanceAtlas;Game.prototype.advanceAtlas=function(dt=0){this.syncLabourActors();const result=advance.call(this,dt);this.syncLabourActors();this.stepLabourReturns(dt);return result;};
 const restore=Game.prototype.finishAtlasRestore;Game.prototype.finishAtlasRestore=function(saved){restore.call(this,saved);this.registerLabourActors();
  // Old party arrays were restored directly: reject institutional actors there too.
  this.party=this.party.filter(c=>!enlisted(this.partyActor(c.id)));
  for(const [id,n]of this.labourActors){const record=sim(this).state.sites[n.labourSite].workerRecords[id];if(record.reasons.returning&&record.position&&!this.party.some(c=>c.id===id))Object.assign(n,record.position);}
  this.syncLabourActors();
 };
 const serialize=Game.prototype.serialize;Game.prototype.serialize=function(){this.syncLabourActors();return serialize.call(this);};
})();
