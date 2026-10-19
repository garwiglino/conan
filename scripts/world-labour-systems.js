/* Named absences and road repair crews share the campaign's finite workforce. */
function createWorldLabourSystems(A,W,state,H,S){
 const sites=()=>[...new Set(Object.values(state.sites))];
 for(const site of sites()){site.workerRecords||={};site.workerSerial||=1;}
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
 // Mission identities survive reassignment. Named local actors are never silently
 // converted into anonymous expedition staff while they remain visible at home.
 function reserveCrew(site,count,assignment,{legacy=false}={}){
  const records=Object.values(site.workerRecords),named=records.filter(p=>!p.anonymous&&!p.dead&&!blocked(p)).length;
  const free=records.filter(p=>p.anonymous&&!p.dead&&!p.assignment&&!blocked(p)&&p.hp>1);
  if(!legacy&&site.workers-named<count)return null;
  const chosen=free.slice(0,count);while(chosen.length<count){let id;do{id='worker-'+site.id+'-'+site.workerSerial++;}while(site.workerRecords[id]);const p=site.workerRecords[id]={id,hp:6,anonymous:true,reasons:{},debited:false};chosen.push(p);}
  if(!legacy)site.workers-=count;
  for(const p of chosen){p.assignment=assignment;p.reasons.mission=true;p.debited=true;}
  return chosen.map(p=>({id:p.id,personId:p.id,role:'crew',hp:p.hp,...(p.appearance?{appearance:{...p.appearance}}:{})}));
 }
 function crewHealth(site,u,assignment){
  const id=u.personId||u.id,p=site.workerRecords[id]||={id,hp:u.hp,anonymous:true,reasons:{},debited:false};
  p.hp=Math.max(0,Math.min(6,u.hp));if(u.appearance)p.appearance={...u.appearance};if(assignment){p.assignment=assignment;p.reasons.mission=true;p.debited=true;}
  if(p.hp<=0){p.dead=true;p.assignment=null;p.reasons={};p.debited=false;delete state.care[site.id]?.[id];}
  return p;
 }
 function restoreCrew(site,units,at=state.clock){
  const living=units.filter(u=>u.role==='crew'&&u.hp>0);
  for(const u of living){const p=crewHealth(site,u);p.assignment=null;delete p.reasons.mission;p.debited=false;
   if(p.hp<6){p.nextCare=at+360;(state.care[site.id]||={})[p.id]=true;}
   if(p.hp<=1)p.reasons.incapacity=true;
  }
  restoreWorkers(site,living.length);
 }
 function tickLabour(at){for(const site of sites())for(const p of Object.values(site.workerRecords))if((p.anonymous||p.careEligible)&&!p.dead&&!p.assignment&&p.hp<6&&at>=(p.nextCare??Infinity)&&H.stock(site,'medicinal')>=1&&H.stock(site,'provisions')>=1){
  H.take(site,'medicinal',1);H.take(site,'provisions',1);p.hp=Math.min(6,p.hp+2);if(!p.anonymous)p.recoveryPending=true;p.nextCare=at+360;setWorkerReason(site.id,p.id,'incapacity',false);if(p.hp===6)delete state.care[site.id]?.[p.id];H.history('worker_treated',{site:site.id,person:p.id,hp:p.hp},at);
 }}
 function outsideCount(site){
  let count=Object.values(site.workerRecords).filter(p=>!p.dead&&(p.reasons.party||p.reasons.returning||p.reasons.travelling||p.assignment)).length;
  count+=site.guards.filter(p=>!p.dead&&p.assignment&&!p.post).length;
  count+=Object.values(state.bands).filter(b=>b.home===site.id&&b.peopleReserved&&b.phase&&b.phase!=='home').reduce((n,b)=>n+b.members.filter(p=>!p.dead&&p.hp>0).length,0);
  return Math.min(site.population,count);
 }
 function localNeeds(site){const fraction=site.population?Math.max(0,site.population-outsideCount(site))/site.population:0;return Object.fromEntries(Object.entries(site.needs).map(([id,n])=>[id,n*(['provisions','water'].includes(id)?fraction:1)]));}
 const jobs={hoe:'farm',sow:'farm',craft:'smith',pottery:'kiln',weave:'textile',stir:'kitchen',net:'fish',groom:'herd',load:'service',rope:'boat',ledger:'service',carry:'gather'};
 function resourceJob(id){
  if(['grain','legumes','rice','tubers','dates','fruit','vegetables','oil','flax','cotton','fiber','dyes','aromatics'].includes(id))return 'farm';
  if(id==='fish')return 'fish';if(['meat','milk','wool','hides','pack_animals'].includes(id))return 'herd';
  if(['cloth','leather'].includes(id))return 'textile';if(['boats','rope'].includes(id))return 'boat';
  if(['pottery','glass'].includes(id))return 'kiln';if(['provisions','flour'].includes(id))return 'kitchen';
  if(['tools','arms','iron','copper','tin','bronze','steel','charcoal'].includes(id))return 'smith';return 'gather';
 }
 const jobCanProduce=(site,job)=>Object.keys(site.capacity).some(id=>resourceJob(id)===jobs[job]);
 function productionStaff(site){
  const groups=[...new Set(Object.keys(site.capacity).map(resourceJob))],base=Math.max(1,site.labourBase||site.population),records=Object.values(site.workerRecords),named=records.filter(p=>!p.anonymous&&!p.dead),available=named.filter(p=>!blocked(p)&&p.onDuty!==false&&!p.service),anonymous=Math.max(0,site.workers-named.filter(p=>!blocked(p)).length),share=Math.max(0,(base-named.length)/Math.max(1,groups.length));
  const result={};for(const group of groups){const normal=share+named.filter(p=>jobs[p.job]===group&&!p.service).length,active=anonymous/Math.max(1,groups.length)+available.filter(p=>jobs[p.job]===group).length;result[group]=normal?Math.min(1,active/normal):0;}
  return Object.fromEntries(Object.keys(site.capacity).map(id=>[id,result[resourceJob(id)]||0]));
 }
 // Reconcile active legacy crews without charging staff a second time.
 for(const c of state.shipments)if(c.staffReserved){const legacy=!Array.isArray(c.units);H.cargoUnits(c);if(legacy&&c.guardReserved){const site=state.sites[c.from],guards=site.guards.filter(p=>!p.dead&&p.assignment===c.id);c.units.push(...(guards.length?guards.map(p=>({id:p.id,personId:p.id,role:'guard',hp:p.hp})):S.reserve(site,c.guards||2,c.id)||[]));}}
 for(const item of [...state.shipments.filter(c=>c.staffReserved),...state.missions.filter(m=>m.staffReserved)])for(const u of item.units||[])if(u.role==='crew')crewHealth(state.sites[item.site||item.from],u,item.id);
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
  const id='repair-'+state.serial,units=reserveCrew(site,work.crew,id,{legacy});if(!units)return;state.serial++;
  if(!legacy){for(const [id,n]of Object.entries(materials))H.take(site,id,n);site.treasury-=wage;site.householdFunds+=wage;}
  H.take(site,'provisions',rations);const m={id,kind:'repair',populationLossesRecorded:true,site:site.id,repairEvent:e.id,work:work.event,units,crew:work.crew,staffReserved:true,path,leg:0,progress:0,status:'outbound',clock:state.clock,suppliedAt:state.clock,rations,materials,payment:{amount:wage||work.crew*2,at:state.clock,recipient:site.id}};
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
  if(m.units.some(u=>u.hp>0))for(const id of m.reports||[]){const e=W.events.find(e=>e.id===id);if(e)H.publish(e,m.site);}m.reports=[];
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
    e.reportPending=true;W.resolve(e.id,at-remaining);work.status='completed';const report=H.event('repair',e.target,{source:'Équipe de réparation',position:e,reportPending:true,repairEvent:e.id},1440,at-remaining);m.reports=[e.id,report.id];H.history('repair_completed',{event:e.id,site:work.site,mission:m.id},at-remaining);returnRepair(m,'completed',at-remaining);
   }
   const result=S.move(m,remaining,at);m.clock=at;if(!result.arrived)return;remaining=result.remaining;
   if(m.status==='returning'){finishRepair(m,at-remaining);return;}
   m.status='active';work.materialsOnSite=true;m.materials={};if(!remaining)return;
  }
 }
 Object.assign(H,{restoreWorkers,restoreCrew,crewHealth,reserveCrew,workerDeath,repairApproach,stepRepairMission,tickLabour,localNeeds});
 return {restoreWorkers,restoreCrew,crewHealth,reserveCrew,setWorkerReason,prepareRepair,stepRepairMission,repairApproach,tickLabour,outsideCount,localNeeds,productionStaff,jobCanProduce};
}
if(typeof module!=='undefined'&&module.exports)module.exports=createWorldLabourSystems;
