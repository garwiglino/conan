/* Named absences and road repair crews share the campaign's finite workforce. */
function createWorldLabourSystems(A,W,state,H,S){
 const sites=()=>[...new Set(Object.values(state.sites))];
 for(const site of sites())site.workerRecords||={};
 const blocked=p=>!p.dead&&Object.values(p.reasons||{}).some(Boolean);
 function restoreWorkers(site,count){
  for(const p of Object.values(site.workerRecords||{}))if(count>0&&blocked(p)&&!p.debited){p.debited=true;count--;}
  site.workers+=count;
 }
 function setWorkerReason(id,person,reason,on){
  const site=state.sites[id];if(!site||!person)return false;
  const p=site.workerRecords[person]||={id:person,reasons:{},debited:false,dead:!!site.losses[person]};
  if(p.dead)return false;if(!!p.reasons[reason]===!!on)return true;const before=blocked(p);if(on)p.reasons[reason]=true;else delete p.reasons[reason];const after=blocked(p);
  if(!before&&after){p.debited=site.workers>0;if(p.debited)site.workers--;H.history('worker_unavailable',{site:site.id,person,reason});}
  if(before&&!after){const held=p.debited;p.debited=false;if(held)restoreWorkers(site,1);H.history('worker_available',{site:site.id,person});}
  return true;
 }
 function workerDeath(site,person,reserved){
  const p=site.workerRecords[person];if(!reserved&&!p?.debited)site.workers=Math.max(0,site.workers-1);
  if(p){p.dead=true;p.reasons={};p.debited=false;}if(state.care[site.id])delete state.care[site.id][person];
 }
 function restoreCrew(site,units,at=state.clock){
  const living=units.filter(u=>u.role==='crew'&&u.hp>0);
  for(const u of living)if(u.hp<=1){const p=site.workerRecords[u.id]||={id:u.id,reasons:{},debited:false};p.hp=u.hp;p.anonymous=true;p.reasons.incapacity=true;p.nextCare=at+360;(state.care[site.id]||={})[u.id]=true;}
  restoreWorkers(site,living.length);
 }
 function tickLabour(at){for(const site of sites())for(const p of Object.values(site.workerRecords))if(p.anonymous&&!p.dead&&p.reasons.incapacity&&at>=p.nextCare&&H.stock(site,'medicinal')>=1&&H.stock(site,'provisions')>=1){H.take(site,'medicinal',1);H.take(site,'provisions',1);p.hp=Math.min(6,p.hp+2);setWorkerReason(site.id,p.id,'incapacity',false);delete state.care[site.id]?.[p.id];H.history('worker_treated',{site:site.id,person:p.id,hp:p.hp},at);}}
 function repairApproach(m,leg,at){
  if(m.kind!=='repair'||leg.repairApproach!==m.repairEvent)return false;
  return W.edgeStatus(A.edgeById.get(leg.edge),at).events.filter(e=>A.EVENT_TYPES[e.type].closed).every(e=>e.id===m.repairEvent);
 }
 function repairPath(work,e){
  const node=A.byId[work.site];if(e.target===work.site&&Math.hypot(e.x-node.x,e.y-node.y)<8)return [];
  const path=S.graphPath(work.site,e);if(!path)return null;
  const last=path.at(-1);if(last&&last.edge===e.edge){
   // Approach the damaged passage from an open endpoint without crossing it.
   const clearance=Math.min(last.length,Math.max(6,(A.roadById[e.target]?.width||5)/2+3)),fraction=(last.length-clearance)/Math.max(.001,last.length);
   last.to=[last.from[0]+(last.to[0]-last.from[0])*fraction,last.from[1]+(last.to[1]-last.from[1])*fraction];last.length-=clearance;last.repairApproach=e.id;
  }
  return path;
 }
 function prepareRepair(work){
  const site=state.sites[work.site],e=W.events.find(e=>e.id===work.event);if(!site)return;
  if(work.paid&&!work.wagesReconciled){site.householdFunds+=work.crew*2;work.wagesReconciled=true;H.history('repair_legacy_wages',{event:work.event,amount:work.crew*2});}
  if(work.status!=='working')return;
  const current=work.mission&&state.missions.find(m=>m.id===work.mission);if(current&&current.status!=='returned')return;
  if(!e||e.resolved!==null){if(work.staffReserved)restoreWorkers(site,work.crew);work.staffReserved=false;work.status=e?'completed':'ended';return;}
  if(W.active().some(e=>e.target===work.site&&['siege','occupation','bandits'].includes(e.type)))return;
  const legacy=!!work.staffReserved,materialsOnSite=!!work.materialsOnSite,materials=legacy?{tools:work.tools,timber:work.timber}:materialsOnSite?{}:{tools:work.tools,timber:work.timber};
  if(!legacy&&(site.workers<work.crew||site.treasury<work.crew*2||Object.entries(materials).some(([id,n])=>H.stock(site,id)<n))||H.stock(site,'provisions')<work.crew*4)return;
  const path=repairPath(work,e);if(!path)return;
  const trip=path.reduce((n,l)=>n+l.length,0)/H.pacing.metresPerMinute(H.pacing.civilianWalk),rations=Math.max(work.crew*4,Math.ceil((trip*2+work.remaining)/720)*work.crew+work.crew*2),wage=legacy?0:work.crew*2;
  if(!legacy&&(site.workers<work.crew||site.treasury<wage||Object.entries(materials).some(([id,n])=>H.stock(site,id)<n))||H.stock(site,'provisions')<rations)return;
  if(!legacy){site.workers-=work.crew;for(const [id,n]of Object.entries(materials))H.take(site,id,n);site.treasury-=wage;site.householdFunds+=wage;}
  H.take(site,'provisions',rations);const id='repair-'+state.serial++,m={id,kind:'repair',populationLossesRecorded:true,site:site.id,repairEvent:e.id,work:work.event,units:Array.from({length:work.crew},(_,i)=>({id:id+'-crew-'+i,role:'crew',hp:6})),crew:work.crew,staffReserved:true,path,leg:0,progress:0,status:'outbound',clock:state.clock,suppliedAt:state.clock,rations,materials,payment:{amount:wage||work.crew*2,at:state.clock,recipient:site.id}};
  work.paid=true;work.wagesReconciled=true;work.staffReserved=false;work.mission=id;state.missions.push(m);H.history('repair_departure',{id,event:e.id,site:site.id,wage,rations});
 }
 function returnRepair(m,reason,at){
  if(m.status==='returning'||m.status==='returned')return;S.reverse(m);m.status='returning';m.returnReason=reason;H.history('repair_returning',{id:m.id,reason},at);
 }
 function finishRepair(m,at){
  const site=state.sites[m.site],work=state.works.find(w=>w.event===m.work);
  if(m.staffReserved){restoreCrew(site,m.units,at);m.staffReserved=false;}
  for(const [id,n]of Object.entries(m.materials||{}))site.stock[id]=H.stock(site,id)+n;m.materials={};
  site.stock.provisions=H.stock(site,'provisions')+Math.max(0,m.rations);m.rations=0;m.status='returned';m.clock=at;if(work?.mission===m.id)work.mission=null;
  H.history('repair_crew_return',{id:m.id,survivors:m.units.filter(u=>u.hp>0).length},at);
 }
 function stepRepairMission(m,minutes,at=W.clock,local=false){
  if(m.status==='returned'||!local&&m.physical)return;
  const work=state.works.find(w=>w.event===m.work),e=W.events.find(e=>e.id===m.repairEvent);
  let living=m.units.filter(u=>u.hp>0),elapsed=Math.max(0,at-(m.suppliedAt??m.clock)),food=elapsed*living.length/720,unfed=living.length?Math.max(0,food-m.rations)*720/living.length:0;m.rations=Math.max(0,m.rations-food);m.suppliedAt=at;
  const oldStarved=m.starved||0;m.starved=m.rations>0?0:oldStarved+unfed;const harm=Math.floor(m.starved/180)-Math.floor(oldStarved/180);if(harm>0)for(const u of living)S.missionDamage(m,u.id,Math.max(0,u.hp-harm));living=m.units.filter(u=>u.hp>0);
  if(!living.length){if(work){work.lostMaterials||=[];if(Object.keys(m.materials||{}).length)work.lostMaterials.push({mission:m.id,position:S.position(m),materials:m.materials});}m.materials={};m.rations=0;finishRepair(m,at);return;}
  const travelled=m.path.slice(0,m.leg).reduce((n,l)=>n+l.length,0)+(m.path[m.leg]?m.progress:0),returnFood=travelled/H.pacing.metresPerMinute(H.pacing.civilianWalk)*living.length/720;
  if(!work||!e||e.resolved!==null||m.status!=='returning'&&m.rations<=returnFood||living.every(u=>u.hp<=1)){returnRepair(m,!e||e.resolved!==null?'passage_resolved':m.rations<=returnFood?'low_provisions':'injured_crew',at);if(work&&(!e||e.resolved!==null))work.status=e?'completed':'ended';}
  if(m.engaged){m.clock=at;return;}
  let remaining=Math.max(0,minutes);
  for(let phase=0;phase<4;phase++){
   if(m.status==='active'){
    if(W.active(at).some(threat=>A.EVENT_TYPES[threat.type].civilianPrey&&Math.hypot(threat.x-e.x,threat.y-e.y)<80)){m.waiting='hostiles';m.clock=at;return;}
    m.waiting=null;const rate=living.filter(u=>u.hp>1).length/Math.max(1,work.crew),used=Math.min(remaining,work.remaining/rate);work.remaining=Math.max(0,work.remaining-used*rate);remaining-=used;m.clock=at;
    if(work.remaining>1e-7)return;
    W.resolve(e.id,at-remaining);work.status='completed';H.event('repair',e.target,{source:'Équipe de réparation',position:e},1440,at-remaining);H.history('repair_completed',{event:e.id,site:work.site,mission:m.id},at-remaining);returnRepair(m,'completed',at-remaining);
   }
   const result=S.move(m,remaining,at);m.clock=at;if(!result.arrived)return;remaining=result.remaining;
   if(m.status==='returning'){finishRepair(m,at-remaining);return;}
   m.status='active';work.materialsOnSite=true;m.materials={};if(!remaining)return;
  }
 }
 Object.assign(H,{restoreWorkers,restoreCrew,workerDeath,repairApproach,stepRepairMission,tickLabour});
 return {restoreWorkers,restoreCrew,setWorkerReason,prepareRepair,stepRepairMission,repairApproach,tickLabour};
}
if(typeof module!=='undefined'&&module.exports)module.exports=createWorldLabourSystems;
