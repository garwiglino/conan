/* One local person cannot also work at home while travelling or incapacitated. */
(()=>{
 const sim=g=>g.worldState?.simulation;
 const enlisted=n=>!!(n?.eventGuard||n?.convoyGuard||n?.convoyId||n?.campaignGroup||n?.guardState||n?.batracien?.role);
 Game.prototype.registerLabourActors=function(){
  const campaign=sim(this)?.state;if(!campaign)return;if(this.labourState!==campaign){this.labourState=campaign;this.labourNpcCount=-1;this.labourActors=new Map();this.labourSiteByPerson=new Map([...new Set(Object.values(campaign.sites))].flatMap(site=>Object.keys(site.workerRecords).map(id=>[id,site.id])));}
  this.labourActors||=new Map();if(this.labourNpcCount===this.npcs.length&&this.labourNpcList===this.npcs)return;this.labourNpcList=this.npcs;this.labourNpcCount=this.npcs.length;
  for(const n of this.npcs){if(enlisted(n)||!(n.resident||/^(relay-|courier-)/.test(n.id)||['elyne','veilleur','zahra'].includes(n.id)))continue;
   const s=sim(this),id=this.labourSiteByPerson.get(n.id)||n.site||this.couriers?.find(c=>c.id===n.id)?.from||Atlas.nearestSite(...Object.values(Atlas.toWorld(n.x,n.y))).id,site=s?.state.sites[id];if(!site)continue;
   const record=site.workerRecords[n.id]||={id:n.id,reasons:{},debited:false,dead:!!site.losses[n.id]};record.home||={...(n.post||{x:n.x,y:n.y})};record.job=n.civilian?.job||'idle';const service=this.stations.find(st=>st.actor===n||st.originalActor===n);if(service)record.service=service.id;n.labourSite=site.id;this.labourSiteByPerson.set(n.id,site.id);this.labourActors.set(n.id,n);
  }
 };
 Game.prototype.applyWorkerDeath=function(n){
  n.dead=true;if(n.civilian){n.civilian.hp=0;n.civilian.dead=true;this.civilianAction(n,'death',true);}if(n.batracien){n.batracien.hp=0;n.batracien.dead=true;}
  this.atlasDeaths[n.id]=true;this.party=this.party.filter(c=>c.id!==n.id);if(n.id==='elyne'){this.story.recruited=false;this.companion.hp=0;this.companion.down=true;}
 };
 Game.prototype.reconcileWorldActors=function(){
  // Discard representations from the replaced campaign without writing their old health back.
  this.npcs=this.npcs.filter(n=>!n.convoyId&&!n.campaignGroup);this.atlasNpcs=this.atlasNpcs.filter(n=>!n.convoyId&&!n.campaignGroup);this.enemies=this.enemies.filter(n=>!n.campaignGroup);
  this.registerLabourActors();const s=sim(this);
  for(const [id,n]of this.labourActors){const p=s.state.sites[n.labourSite]?.workerRecords[id];if(p?.dead){this.applyWorkerDeath(n);continue;}if(Number.isFinite(p?.hp)&&n.civilian){n.civilian.hp=p.hp;const member=this.party.find(c=>c.id===id);if(member){member.hp=p.hp/6*member.maxHp;member.down=member.hp<=0;}}}
  for(const n of this.npcs){const p=s.state.sites[n.site||n.batracien?.site]?.guards.find(p=>p.id===n.id);if(!p)continue;if(n.batracien?.role){n.batracien.hp=p.hp/8*BATRACIEN_CONFIG.combat[n.batracien.role].hp;n.batracien.dead=p.dead;}if(n.guardState){n.guardState.hp=p.hp;n.guardState.dead=p.dead;}if(p.dead){n.dead=true;this.atlasDeaths[n.id]=true;}}
  for(const n of this.enemies){const p=s.state.hostiles?.[n.id];if(p){n.hp=p.hp;n.dead=p.hp<=0;}}
  this.syncLabourActors();
 };
 Game.prototype.syncLabourActors=function(){
  const s=sim(this);if(!s)return;this.registerLabourActors();const members=new Map(this.party.map(c=>[c.id,c]));
  for(const [id,n]of this.labourActors){const record=s.state.sites[n.labourSite]?.workerRecords[id];if(!record)continue;const member=members.get(id);if(n.civilian?.dead&&!member&&!record.dead)s.systems.death(n.labourSite,id);if(record.dead){this.applyWorkerDeath(n);continue;}if(record.recoveryPending&&n.civilian){n.civilian.hp=record.hp;delete record.recoveryPending;}if(member&&n.civilian)n.civilian.hp=member.hp/Math.max(1,member.maxHp||6)*6;record.hp=n.civilian?.hp??record.hp??6;record.onDuty=!n.dangerState&&!n.worldChat&&!n.justiceReport&&this.dialogue?.who!==n&&dist(n,record.home)<48;const incapacitated=!!(n.civilian?.critical||member?.down||!member&&n.civilian?.hp<=1);
   // A legacy save may have an absent person without an availability record.
   if(member)s.systems.setWorkerReason(n.labourSite,id,'party',true);else if(record.reasons.party){if(dist(n,record.home)>12){s.systems.setWorkerReason(n.labourSite,id,'returning',true);record.returnClock=this.clock;n.labourReturning=true;}s.systems.setWorkerReason(n.labourSite,id,'party',false);}
   s.systems.setWorkerReason(n.labourSite,id,'incapacity',incapacitated);
   record.careEligible=!member&&!n.labourReturning&&!n.dangerState&&!n.civilian?.critical&&dist(n,record.home)<48;
   if(!member&&n.civilian?.hp<6&&!n.civilian.dead&&!n.civilian.critical){record.nextCare??=this.clock+360;s.requestCare(n.labourSite,id);}
   else if(!n.civilian?.critical)s.finishCare(n.labourSite,id);
   const courier=this.couriers?.find(c=>c.id===id);if(courier)s.systems.setWorkerReason(n.labourSite,id,'travelling',!member&&!record.reasons.returning&&dist(n,record.home)>48);
  }
 };
 Game.prototype.labourAvailable=function(n,station=null){
  if(!n||enlisted(n)||(n.alpha??1)<.5||n.phase==='away'||n.hurt>0||n.stun>0||n.civilian?.dead||n.civilian?.critical||(n.civilian?.hp??6)<=1||n.dangerState||n.labourReturning||this.party.some(c=>c.id===n.id))return false;
  const p=sim(this)?.state.sites[n.labourSite||n.site]?.workerRecords[n.id];
  return !p?.dead&&!p?.assignment&&!p?.reasons.returning&&!p?.reasons.incapacity&&(!p?.service||p.service===station?.id);
 };
 Game.prototype.canRelieve=function(st,n,restoring=false){
  this.registerLabourActors();const s=sim(this),site=s?.state.sites[n.labourSite||n.site],target=s?.state.sites[st.site];
  const skills=st.modes.includes('boat')?['rope','net','ledger']:['groom','load','carry','ledger'];
  return !!(n.resident&&site===target&&!n.reliefPost&&this.labourAvailable(n,restoring?st:null)&&!n.worldChat&&!n.justiceReport&&this.dialogue?.who!==n&&skills.includes(n.civilian?.job));
 };
 Game.prototype.staffReady=function(st){return !!st&&this.labourAvailable(st.actor,st)&&(!st.actor.reliefPost||dist(st.actor,st.actor.reliefPost)<8);};
 Game.prototype.releaseWorldRelief=function(st){
  const n=st.actor;if(!st.originalActor)return;this.registerLabourActors();const s=sim(this),p=s.state.sites[n.labourSite]?.workerRecords[n.id];
  if(p&&!p.dead){s.systems.setWorkerReason(n.labourSite,n.id,'returning',true);s.systems.setWorkerReason(n.labourSite,n.id,'service',false);delete p.service;p.returnClock=this.clock;n.labourReturning=true;}
  n.title=n.reliefTitle||n.title;delete n.reliefTitle;delete n.reliefPost;st.actor=st.originalActor;delete st.originalActor;
 };
 const recruit=Game.prototype.recruitCompanion;
 Game.prototype.recruitCompanion=function(n,...args){
  if(n?.dead||n?.civilian?.dead||sim(this)?.state.sites[n?.labourSite||n?.site]?.workerRecords[n?.id]?.dead||enlisted(n)||this.stations.some(st=>st.originalActor===n)||n?.reliefPost)return false;this.registerLabourActors();const result=recruit.call(this,n,...args);
  if(result&&n.labourSite){const s=sim(this),record=s.state.sites[n.labourSite].workerRecords[n.id];const job=this.couriers?.find(c=>c.id===n.id);if(job?.returnTo)record.home={...job.returnTo};s.systems.setWorkerReason(n.labourSite,n.id,'party',true);s.systems.setWorkerReason(n.labourSite,n.id,'returning',false);delete record.returnRoute;delete n.labourReturning;if(record.reasons.travelling)s.systems.setWorkerReason(n.labourSite,n.id,'travelling',false);}
  return result;
 };
 const dismiss=Game.prototype.dismissCompanion;
 Game.prototype.dismissCompanion=function(id){const n=this.partyActor(id),result=dismiss.call(this,id);if(result&&n?.labourSite){const s=sim(this);s.systems.setWorkerReason(n.labourSite,id,'returning',true);s.systems.setWorkerReason(n.labourSite,id,'party',false);n.labourReturning=true;s.state.sites[n.labourSite].workerRecords[id].returnClock=this.clock;this.stepLabourReturns(0);}return result;};
 const couriers=Game.prototype.stepCouriers;Game.prototype.stepCouriers=function(minutes){const all=this.couriers;try{this.couriers=all.filter(c=>{const n=this.npcs.find(n=>n.id===c.id);return !n?.labourReturning&&(n?.civilian?.hp??6)>1;});return couriers.call(this,minutes);}finally{this.couriers=all;}};
 const local=Game.prototype.stepWorldLocal;Game.prototype.stepWorldLocal=function(n,...args){if(n.labourReturning||(n.civilian?.hp??6)<=1)return;return local.call(this,n,...args);};
 const walk=Game.prototype.walkNpc;Game.prototype.walkNpc=function(n,to,dt){if(n.labourReturning&&!this.labourWalking)return false;return walk.call(this,n,to,dt);};
 Game.prototype.stepLabourReturns=function(dt=0){
  const s=sim(this);if(!s||!this.labourActors)return;
  for(const [id,n]of this.labourActors){const site=s.state.sites[n.labourSite],record=site?.workerRecords[id];if(!record?.reasons.returning||record.dead||this.party.some(c=>c.id===id))continue;n.labourReturning=true;const elapsed=Math.max(0,this.clock-(record.returnClock??this.clock));record.returnClock=this.clock;
   if(n.civilian?.critical||n.civilian?.dead||n.dangerState||this.dialogue?.who===n){if(record.returnRoute)record.returnRoute.clock=this.clock;continue;}
   const home=record.home,world=Atlas.toWorld(n.x,n.y);let route=record.returnRoute;
   const near=dist(n,this.player)<1500&&!this.journey&&!this.sleeping;
   this.labourWalking=true;try{
    if(!route&&dist(n,home)>48){const path=s.systems.graphPath(site.id,world,{allowBoat:true}),node=Atlas.toGame(Atlas.byId[site.id].x,Atlas.byId[site.id].y),homePath=dist(home,node)>48?s.systems.graphPath(site.id,Atlas.toWorld(home.x,home.y)):[];if(!path||!homePath)continue;route=record.returnRoute={site:site.id,path,leg:path.length,progress:0,clock:this.clock};s.systems.reverse(route);route.path.push(...homePath);}
    let availableMinutes=elapsed,homeSeconds=near?dt:WorldPacing.realSeconds(elapsed);if(route?.path[route.leg]?.mode==='boat'){const result=s.systems.move(route,elapsed,this.clock);Object.assign(n,Atlas.toGame(...Object.values(s.systems.position(route))));availableMinutes=result.remaining;homeSeconds=WorldPacing.realSeconds(result.remaining);n.alpha=route.path[route.leg]?.mode==='boat'?0:1;}else n.alpha=1;
    if(route&&route.path[route.leg]&&route.path[route.leg].mode!=='boat'){const goal=Atlas.toGame(...Object.values(s.systems.position(route)));route.clock=this.clock;let travelMinutes=availableMinutes;
     if(dist(n,goal)>12){const seconds=near?Math.min(dt,WorldPacing.realSeconds(availableMinutes)):Math.min(16,WorldPacing.realSeconds(availableMinutes));let used=0;while(used<seconds-1e-7&&dist(n,goal)>2){const step=Math.min(.25,seconds-used);walk.call(this,n,goal,step);used+=step;}travelMinutes=Math.max(0,availableMinutes-used*1440/WorldPacing.dayRealSeconds);homeSeconds=Math.max(0,homeSeconds-used);}
     if(!near&&dist(n,goal)<=12){const result=s.systems.move(route,travelMinutes,this.clock);Object.assign(n,Atlas.toGame(...Object.values(s.systems.position(route))));homeSeconds=WorldPacing.realSeconds(result.remaining);}
     else if(near&&dist(n,goal)<=12){const leg=route.path[route.leg];if(leg&&!this.worldState.edgeStatus(Atlas.edgeById.get(leg.edge),this.clock).closed){const t=Math.min(1,((route.progress||0)+2)/Math.max(.001,leg.length)),target=Atlas.toGame(leg.from[0]+(leg.to[0]-leg.from[0])*t,leg.from[1]+(leg.to[1]-leg.from[1])*t);walk.call(this,n,target,Math.min(dt,WorldPacing.realSeconds(availableMinutes)));const w=Atlas.toWorld(n.x,n.y),distance=Atlas.project(w.x,w.y,leg.from,leg.to).t*leg.length;s.systems.move(route,Math.max(0,distance-route.progress)/WorldPacing.metresPerMinute(WorldPacing.civilianWalk),this.clock);}}
    }
    if(!route||!route.path[route.leg]){for(let left=Math.min(16,homeSeconds);left>1e-7&&dist(n,home)>12;left-=.25)walk.call(this,n,home,Math.min(.25,left));if(dist(n,home)<=12){s.systems.setWorkerReason(site.id,id,'returning',false);delete record.returnRoute;delete n.labourReturning;n.post={...home};}}
   }finally{n.alpha=record.returnRoute?.path[record.returnRoute.leg]?.mode==='boat'?0:1;this.labourWalking=false;record.position={x:n.x,y:n.y};}
  }
 };
 const damage=Game.prototype.damageCivilian;Game.prototype.damageCivilian=function(...args){const result=damage.apply(this,args);if(result)this.syncLabourActors();return result;};
 const advance=Game.prototype.advanceAtlas;Game.prototype.advanceAtlas=function(dt=0){this.syncLabourActors();const result=advance.call(this,dt);this.syncLabourActors();this.stepLabourReturns(dt);return result;};
 const restore=Game.prototype.finishAtlasRestore;Game.prototype.finishAtlasRestore=function(saved){restore.call(this,saved);this.registerLabourActors();
  // Old party arrays were restored directly: reject institutional actors there too.
  this.party=this.party.filter(c=>!enlisted(this.partyActor(c.id))&&!this.stations.some(st=>st.actor.id===c.id||st.originalActor?.id===c.id));
  for(const [id,n]of this.labourActors){const record=sim(this).state.sites[n.labourSite].workerRecords[id];if(record.reasons.returning&&record.position&&!this.party.some(c=>c.id===id))Object.assign(n,record.position);}
  for(const [id,n]of this.labourActors){const p=sim(this).state.sites[n.labourSite].workerRecords[id];if(p.reasons.service&&!this.stations.some(st=>st.actor===n)){delete p.service;sim(this).systems.setWorkerReason(n.labourSite,id,'service',false);}}
  this.syncLabourActors();
 };
 const update=Game.prototype.update;Game.prototype.update=function(...args){if(this.journeyResuming)return;return update.apply(this,args);};
 const props=Renderer.prototype.visibleAtlasProps;
 Renderer.prototype.visibleAtlasProps=function(){const result=props.call(this);for(const n of this.g.npcs){const record=sim(this.g)?.state.sites[n.labourSite]?.workerRecords[n.id],r=record?.returnRoute;if(r?.path[r.leg]?.mode==='boat'&&!record.dead&&dist(n,this.g.player)<1200)result.push({x:n.x,y:n.y,kind:'transport_boat_front',world:true,returningPerson:n.id});}return result;};
 const serialize=Game.prototype.serialize;Game.prototype.serialize=function(){this.syncLabourActors();return serialize.call(this);};
})();
