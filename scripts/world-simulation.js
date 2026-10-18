/* Codex / ChatGPT — persistent campaign economy and causal institutions.
 * Quantities are campaign lots (provisions = rations; water = gourdes), not
 * demographic percentages or raw geological potential. No off-screen combat roll.
 */
function createWorldSimulation(A,B,W,saved){
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),finite=Number.isFinite;
 const resources=new Map(B.resources.map(r=>[r.id,r])),profiles=new Map(B.settlements.map(s=>['town-'+s.atlasId,s])),regions=new Map(B.regions.map(r=>[r.id,r]));
 const foods=['grain','legumes','rice','tubers','dates','fish','meat'];
 const validState=saved?.version===1&&finite(saved.clock)&&saved.clock<=W.clock;
 const state=validState?JSON.parse(JSON.stringify(saved)):{version:1,clock:W.clock,serial:1,sites:{},shipments:[],missions:[],works:[],disputes:{},crimes:[],history:[],channels:{},cooldowns:{}};
 state.history||=[];state.channels||={};state.cooldowns||={};state.crimes||=[];state.works||=[];state.disputes||={};state.shipments||=[];state.missions||=[];state.serial=Math.max(1,Math.floor(state.serial)||1);
 for(const node of A.nodes.filter(n=>n.rest)){
  if(state.sites[node.id])continue;const profile=profiles.get(node.id),region=regions.get(node.region),population=Math.max(8,Math.min(600,Math.ceil((profile?.designPopulation||800)/100))),needs={provisions:population*2,water:population*3,firewood:population*.2,cloth:population*.025,tools:population*.02};
  const inputs=[...new Set([...(profile?.productionIntent||[]),...(profile?.hinterlandSpecialties||[])])];
  const stock={},capacity={},deposits={};for(const id of resources.keys())stock[id]=0;
  // Explicit starting reserves. They are debited thereafter and never refilled on load.
  for(const [id,amount]of Object.entries(needs))stock[id]=amount*5;
  for(const id of inputs){if(!resources.has(id)||(region?.resourceLevels?.[id]||0)<=0)continue;capacity[id]=population*(foods.includes(id)?2.6:.35);stock[id]+=capacity[id]*3;deposits[id]=capacity[id]*(resources.get(id).renewal==='finite'?180:60);}
  // Export specialities are not an exhaustive list of subsistence activities.
  // A settlement cultivates a locally viable staple; inhospitable sites still import.
  const staple=['grain','legumes','tubers','dates'].sort((a,b)=>(region?.resourceLevels?.[b]||0)-(region?.resourceLevels?.[a]||0))[0],potential=region?.resourceLevels?.[staple]||0;
  if(potential>0&&!capacity[staple]){capacity[staple]=needs.provisions*1.4*Math.min(1,potential/2);stock[staple]=capacity[staple]*30;deposits[staple]=capacity[staple]*120;}
  const biome=A.cellAt(node.x,node.y)?.biome;
  // Freshwater access is a maintained settlement well/catchment, with finite storage.
  // Regional potential measures export surplus, not the absence of a village well.
  // Domestic catchments cover ordinary demand; heat and lost workers can exhaust them.
  capacity.water=needs.water*(1.35+(region?.resourceLevels?.water??1)*.05);capacity.provisions=needs.provisions*1.2;
  if([5,6,7,8,9,12].includes(biome)){capacity.firewood=needs.firewood*1.4;deposits.firewood=capacity.firewood*120;}
  state.sites[node.id]={id:node.id,authority:profile?.authority||region?.authority||'local',jurisdiction:profile?.jurisdiction||'local-'+node.id,population,census:profile?.speciesCounts||{},needs,stock,capacity,deposits,workers:population,treasury:population*40,guardPool:Math.max(2,Math.round(population*.12)),guardAvailable:Math.max(2,Math.round(population*.12)),reserveDays:3,distress:0,mail:{},production:0,consumption:0};
 }
 function history(type,detail,at=state.clock){state.history.push({type,at,...detail});if(state.history.length>1000)state.history.shift();}
 function publish(e,site){if(!e)return;
  if(e.resolved===null&&e.type==='flood'){e.end=null;e.waterLevel=finite(e.waterLevel)?e.waterLevel:1;}
  if(e.resolved===null&&['bridge','landslide','avalanche','fire'].includes(e.type)&&!state.works.some(w=>w.event===e.id)){
   e.end=null;const nearest=A.nodes.filter(n=>state.sites[n.id]).sort((a,b)=>Math.hypot(a.x-e.x,a.y-e.y)-Math.hypot(b.x-e.x,b.y-e.y))[0];
   state.works.push({event:e.id,site:nearest.id,status:'working',remaining:e.type==='bridge'?2880:720,crew:2,tools:1,timber:e.type==='bridge'?6:0,paid:false});
  }
  if(A.roadById[e.target]&&!e.edge&&['bandits','bridge','landslide','avalanche','fire','flood'].includes(e.type)){
   const road=A.roadById[e.target],s=road.segments.reduce((best,s)=>{const d=A.project(e.x,e.y,s.a,s.b).d;return !best||d<best.d?{s,d}:best;},null)?.s;
   if(s){e.edge=[s.a[2],s.b[2]].sort().join('|');e.radius=40;}
  }
  const target=site||A.byId[e.target]?.id||A.nearestSite(e.x,e.y).id;const ledger=state.channels[target]||(state.channels[target]={});if(!ledger[e.id]||ledger[e.id].resolved!==e.resolved)ledger[e.id]={heard:state.clock,at:e.at,resolved:e.resolved,source:'Habitants de '+(A.byId[target]?.name||'la région')};
 }
 function event(type,target,extra={},duration=0){const e=W.add(type,target,state.clock,duration,extra);publish(e);return e;}
 function stock(site,id){return Math.max(0,Number(site.stock[id])||0);}
 function take(site,id,amount){const n=Math.min(stock(site,id),Math.max(0,amount));site.stock[id]=stock(site,id)-n;return n;}
 function route(from,to){return A.findPath(from,to,{mode:'cart',allowBoat:true,clock:state.clock,state:W});}
 function minutes(path){return path.reduce((n,s)=>n+s.length/A.modes[s.mode].metresPerMinute,0);}
 function addShipment(from,to,id,amount){
  const a=state.sites[from],b=state.sites[to];if(!a||!b||from===to||amount<=0||state.shipments.filter(s=>['travel','returning'].includes(s.status)).length>=24)return null;
  if(!resources.has(id)||!finite(amount)||a.workers<2)return null;
  const path=route(from,to);if(!path?.length)return null;const qty=Math.min(amount,80,Math.max(0,stock(a,id)-(a.needs[id]||1)*a.reserveDays));if(qty<=0)return null;
  const price=Math.max(1,Math.ceil(qty*.5));if(b.treasury<price)return null;
  take(a,id,qty);b.treasury-=price;a.workers-=2;const cargo={id:'cargo-'+state.serial++,from,to,resource:id,amount:qty,paid:price,path:path.map(p=>({...p})),leg:0,progress:0,status:'travel',depart:state.clock,clock:state.clock,crew:2,staffReserved:true,delivered:false,news:JSON.parse(JSON.stringify(state.channels[from]||{}))};
  state.shipments.push(cargo);history('cargo_departure',{id:cargo.id,from,to,resource:id,amount:qty});return cargo;
 }
 function produce(site,day,sky){
  const work=clamp(1-site.distress*.06,.2,1)*clamp(site.workers/site.population,0,1),season=(state.clock/1440)%96/96,cold=(sky.temperature??15)<-5;
  for(const [id,rate]of Object.entries(site.capacity)){
   const r=resources.get(id);if(!r)continue;let amount=rate*day*work;
   if(r.kind==='agriculture')amount*=cold?.05:season>.25&&season<.8?1.3:.65;
   if(id==='water')amount*=clamp(1-(sky.storm||0)*.1-(sky.temperature>30?.25:0),.4,1.2);
   const life=r.storageDays||1,maximum=Math.max((site.needs[id]||rate)*Math.min(30,life),rate*3);
   amount=Math.min(amount,Math.max(0,maximum-stock(site,id)));
   if(r.inputAlternatives?.length){const recipe=r.inputAlternatives.find(list=>list.every(input=>stock(site,input)>0));if(!recipe)continue;amount=Math.min(amount,...recipe.map(input=>stock(site,input)));for(const input of recipe)take(site,input,amount);
   }else if(id!=='water'){
    if(!finite(site.deposits[id]))continue;amount=Math.min(amount,site.deposits[id]);site.deposits[id]-=amount;
    if(r.renewal!=='finite')site.deposits[id]+=rate*day*.8;
   }
   site.stock[id]=stock(site,id)+amount;site.production+=amount;
  }
  let deficiency=0;for(const [id,need]of Object.entries(site.needs)){const requested=need*day;let n=0;if(id==='provisions')for(const food of foods){n+=take(site,food,requested-n);if(n>=requested)break;}n+=take(site,id,requested-n);site.consumption+=n;if(['water','provisions'].includes(id)&&n<requested-.00001)deficiency+=(requested-n)/Math.max(1,requested);}
  for(const [id,r]of resources)if(r.storageDays>0&&r.storageDays<999)take(site,id,stock(site,id)*day/Math.max(1,r.storageDays)*.1);
  site.distress=clamp(site.distress+(deficiency?deficiency*day*3:-day*.4),0,10);site.treasury+=site.population*day*.3;
 }
 function progressCargo(c,dt){
  if(!['travel','returning'].includes(c.status))return;let remaining=dt;
  for(let guard=0;remaining>1e-7&&guard<128;guard++){
   const leg=c.path[c.leg];if(!leg){
    if(c.status==='returning'){if(c.staffReserved){state.sites[c.from].workers+=c.crew;c.staffReserved=false;}c.status='delivered';history('cargo_crew_return',{id:c.id});break;}
    const site=state.sites[c.to];site.stock[c.resource]=stock(site,c.resource)+c.amount;state.sites[c.from].treasury+=c.paid;c.delivered=true;c.arrived=state.clock;
    const ledger=state.channels[c.to]||(state.channels[c.to]={});for(const [id,k]of Object.entries(c.news||{}))if(!ledger[id]||(k.heard||0)>(ledger[id].heard||0)||k.resolved!==null&&ledger[id].resolved===null)ledger[id]={...k,heard:state.clock,source:'Caravaniers'};
    history('cargo_delivered',{id:c.id,amount:c.amount,resource:c.resource,to:c.to});event('caravan',c.to,{detail:c.amount.toFixed(0)+' lots de '+(resources.get(c.resource)?.label||c.resource)+' livrés.',source:'Caravaniers'},720);
    c.status='returning';c.path=c.path.slice().reverse().map(p=>({...p,from:p.to,to:p.from}));c.leg=0;c.progress=0;break;
   }
   const edge=A.edgeById.get(leg.edge);if(!edge){c.waiting='route_migration';break;}const status=W.edgeStatus(edge,state.clock);if(status.closed||status.events.some(e=>A.EVENT_TYPES[e.type].civilianPrey)){c.waiting=leg.edge;break;}c.waiting=null;
   const length=leg.length/A.modes[leg.mode].metresPerMinute,step=Math.min(remaining,length-c.progress);c.progress+=step;remaining-=step;if(c.progress>=length-1e-7){c.leg++;c.progress=0;}
  }c.clock=state.clock;
 }
 function resolveWork(work,dt){
  if(work.status!=='working')return;const site=state.sites[work.site],e=W.events.find(e=>e.id===work.event);
  if(!site||!e||e.resolved!==null){if(site&&work.staffReserved){site.workers+=work.crew;work.staffReserved=false;}work.status='ended';return;}
  if(W.active(state.clock).some(e=>e.target===work.site&&['siege','occupation','bandits'].includes(e.type)))return;
  if(!work.paid){if(stock(site,'tools')<work.tools||stock(site,'timber')<work.timber||site.workers<work.crew||site.treasury<work.crew*2)return;take(site,'tools',work.tools);take(site,'timber',work.timber);site.workers-=work.crew;site.treasury-=work.crew*2;work.staffReserved=true;work.paid=true;}
  work.remaining-=dt;if(work.remaining<=0){W.resolve(e.id,state.clock);event('repair',e.target,{source:'Équipe de réparation',position:e},1440);work.status='completed';if(work.staffReserved){site.workers+=work.crew;work.staffReserved=false;}history('repair_completed',{event:e.id,site:work.site});}
 }
 function causalEvents(){
  for(const site of Object.values(state.sites)){
   const food=stock(site,'provisions')+foods.reduce((n,id)=>n+stock(site,id),0),shortage=food<site.needs.provisions||stock(site,'water')<site.needs.water;
   const old=W.active(state.clock).find(e=>e.type==='shortage'&&e.target===site.id);
   if(shortage&&!old)event('shortage',site.id,{source:'Intendant de '+A.byId[site.id].name});
   if(!shortage&&old&&food>=site.needs.provisions*2&&stock(site,'water')>=site.needs.water*2)W.resolve(old.id,state.clock);
  }
  // Physical damage remains until an actual, paid work order completes.
  for(const e of W.active(state.clock))if(['bridge','landslide','avalanche','fire'].includes(e.type)&&!state.works.some(w=>w.event===e.id)){publish(e);W.revision++;}
 }
 function dispatch(){
  // At most four reservations per dispatch (six hours); every load has a capacity.
  let count=0;for(const site of Object.values(state.sites).sort((a,b)=>b.distress-a.distress))for(const id of [...new Set(['provisions','water',...Object.keys(site.needs)])]){
   if(count>=4)return;const need=(site.needs[id]||1)*4-stock(site,id);if(need<=0||state.shipments.some(s=>s.status==='travel'&&s.to===site.id&&s.resource===id))continue;
   const target=A.byId[site.id],suppliers=Object.values(state.sites).filter(a=>a!==site&&stock(a,id)>(a.needs[id]||1)*5).sort((a,b)=>Math.hypot(A.byId[a.id].x-target.x,A.byId[a.id].y-target.y)-Math.hypot(A.byId[b.id].x-target.x,A.byId[b.id].y-target.y));
   let sent=false;for(const supplier of suppliers.slice(0,4))if((id!=='water'||Math.hypot(A.byId[supplier.id].x-target.x,A.byId[supplier.id].y-target.y)<500)&&addShipment(supplier.id,site.id,id,need)){count++;sent=true;break;}
   if(id==='provisions'&&!sent)for(const food of foods){const supplier=Object.values(state.sites).filter(a=>a!==site&&stock(a,food)>need+3).sort((a,b)=>Math.hypot(A.byId[a.id].x-target.x,A.byId[a.id].y-target.y)-Math.hypot(A.byId[b.id].x-target.x,A.byId[b.id].y-target.y))[0];if(supplier&&addShipment(supplier.id,site.id,food,need)){count++;break;}}
  }
 }
 function mandate(){
  for(const site of Object.values(state.sites)){
   const node=A.byId[site.id],incident=W.active(state.clock).find(e=>['bandits','occupation'].includes(e.type)&&Math.hypot(e.x-node.x,e.y-node.y)<1000);
   const jurisdiction=incident&&state.sites[A.nearestSite(incident.x,incident.y).id];
   if(!incident||jurisdiction?.authority!==site.authority||site.guardAvailable<2||site.treasury<12||stock(site,'provisions')<4||state.missions.some(m=>m.site===site.id&&m.status==='active'))continue;
   const road=A.roadById[incident.target]||A.closestRoad(incident.x,incident.y)?.road;if(!road||road.type==='searoutes')continue;
   if(W.active(state.clock).some(e=>e.type==='patrol'&&e.target===road.id&&Math.hypot(e.x-incident.x,e.y-incident.y)<80))continue;
   site.guardAvailable-=2;site.treasury-=12;take(site,'provisions',4);const e=event('patrol',road.id,{source:site.authority,position:{x:incident.x,y:incident.y}},1440);
   if(e){e.authority=site.authority;e.mandateSite=site.id;e.mandate='protect_travellers';state.missions.push({id:'mandate-'+state.serial++,event:e.id,site:site.id,road:road.id,crew:2,until:state.clock+1440,status:'active'});}
  }
 }
 function institutions(){
  for(const m of state.missions)if(m.status==='active'&&state.clock>=m.until){const active=W.active(state.clock).find(e=>e.id===m.event);if(active)W.resolve(active.id,state.clock);const casualties=m.casualties||0;state.sites[m.site].guardAvailable+=Math.max(0,m.crew-casualties);state.sites[m.site].guardPool-=casualties;m.status='returned';history('patrol_return',{id:m.id,site:m.site,casualties});}
  // An identified local band needs a base, members and exposed real traffic.
  for(const cargo of state.shipments.filter(c=>c.status==='travel'&&!c.waiting)){
   const leg=cargo.path[cargo.leg];if(!leg)continue;const road=A.roadById[leg.road],profile=B.routes.find(r=>'road-'+r.atlasRouteId===road?.id);if(!profile)continue;
   const candidate=B.networks.find(n=>n.rule==='bandit_ambush'&&n.regions.some(r=>profile.regions.includes(r)));if(!candidate)continue;
   const key='band-'+candidate.id,previous=state.cooldowns[key]??-Infinity;if(state.clock-previous<4320||W.active(state.clock).some(e=>e.target===road.id&&['patrol','bandits'].includes(e.type)))continue;
   const base=Object.values(state.sites).find(s=>profiles.get(s.id)?.criminalNetworks.includes(candidate.id));if(!base||base.distress<1.5)continue;
   const e=event('bandits',road.id,{source:'Voyageurs',position:A.atDistance(road,road.length*.5)},1440);if(e){e.groupId=candidate.id;e.objective='cargo_or_toll';e.victimCargo=cargo.id;e.home=base.id;state.cooldowns[key]=state.clock;history('band_ambush',{event:e.id,group:candidate.id,cargo:cargo.id});}
  }
 }
 function advance(clock,weather=()=>({})){if(!finite(clock)||clock<state.clock)return;const begin=Math.floor(state.clock/60),end=Math.floor(clock/60);
  for(let hour=begin+1;hour<=end;hour++){
   state.clock=hour*60;W.clock=state.clock;
   // Reserve ready work before daily wear/spoilage consumes its exact materials.
   for(const work of state.works)resolveWork(work,60);
   for(const site of Object.values(state.sites)){const node=A.byId[site.id],sky=weather(state.clock,node.x,node.y)||{};produce(site,1/24,sky);
    for(const [type,condition]of [['rain',(sky.rain||0)>.35],['snow',(sky.snow||0)>.35],['fog',(sky.fog||0)>.6]]){const old=W.active(state.clock).find(e=>e.type===type&&e.target===site.id);if(condition&&!old)event(type,site.id,{source:'Habitants de '+node.name});else if(!condition&&old)W.resolve(old.id,state.clock);}
   }
   for(const c of state.shipments)progressCargo(c,60);causalEvents();
   if(hour%6===2)dispatch();if(hour%6===0){mandate();institutions();}
   // A crossing reopens only after its water has actually subsided.
   for(const e of W.active(state.clock))if(e.type==='flood'){const sky=weather(state.clock,e.x,e.y)||{};e.waterLevel=clamp((e.waterLevel??1)+(sky.rain||0)*.35-.16,0,2);if(e.waterLevel<.2)W.resolve(e.id,state.clock);}
   if(hour%6===0)for(const crossing of A.crossings){const sky=weather(state.clock,crossing.x,crossing.y)||{};if(sky.rain>.8&&!W.active(state.clock).some(e=>e.target===crossing.road&&e.type==='flood'))event('flood',crossing.road,{position:crossing,source:'Bateliers'});}
   for(const e of W.events)if(e.resolved===null&&e.end!==null&&e.end<=state.clock)W.resolve(e.id,e.end);
  }state.clock=clock;W.clock=clock;W.lastHour=Math.floor(clock/60);
 }
 function learn(id,x,y,clock,{privateAccess=false}={}){
  const node=A.nearestSite(x,y),book=W.knowledge[id]||(W.knowledge[id]={}),ledger=Math.hypot(x-node.x,y-node.y)<=Math.max(80,(node.radius||0)+20)?state.channels[node.id]||{}:{};let changed=false;
  for(const e of W.events){if(e.at>clock||A.EVENT_TYPES[e.type].private&&!privateAccess&&!e.witnesses.includes(id))continue;
   const witnessed=e.witnesses.includes(id),local=Math.hypot(x-e.x,y-e.y)<80,k=ledger[e.id];if(!witnessed&&!local&&!k)continue;
   const knownResolution=witnessed||local?e.resolved:k?.resolved??null,next={heard:clock,at:e.at,resolved:knownResolution,source:witnessed?'Témoin direct':k?.source||'Information locale'};
   if(!book[e.id]||book[e.id].resolved!==next.resolved){book[e.id]=next;changed=true;}
  }if(changed)W.revision++;return book;
 }
 function price(id,resource='provisions'){const s=state.sites[id];if(!s)return 1;const cover=stock(s,resource)/Math.max(1,s.needs[resource]||1);return clamp(2-cover/3,.65,3);}
 function purchase(id,food,water){const s=state.sites[id];if(!s||!finite(food)||!finite(water)||food<0||water<0||stock(s,'provisions')<food||stock(s,'water')<water)return false;take(s,'provisions',food);take(s,'water',water);history('player_purchase',{site:id,food,water});return true;}
 for(const e of W.active(state.clock))publish(e);
 return {state,advance,learn,price,purchase,addShipment,publish,stock,history,serialize:()=>JSON.parse(JSON.stringify(state))};
}
if(typeof module!=='undefined'&&module.exports)module.exports=createWorldSimulation;
