/* Codex / ChatGPT — persistent campaign economy and causal institutions.
 * Quantities are campaign lots (provisions = rations; water = gourdes), not
 * demographic percentages or raw geological potential. No off-screen combat roll.
 */
function createWorldSimulation(A,B,W,saved){
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),finite=Number.isFinite;
 const pacing=typeof WorldPacing!=='undefined'?WorldPacing:require('./world-pacing.js'),controlledCargo=new Set();
 const resources=new Map(B.resources.map(r=>[r.id,r])),profiles=new Map(B.settlements.map(s=>['town-'+s.atlasId,s])),regions=new Map(B.regions.map(r=>[r.id,r]));
 const depths=new Map();function depth(id,seen=new Set()){if(depths.has(id))return depths.get(id);if(seen.has(id))return 0;const recipes=resources.get(id)?.inputAlternatives,value=recipes?.length?1+Math.max(...recipes.flat().map(k=>depth(k,new Set([...seen,id])))):0;depths.set(id,value);return value;}
 const foods=['grain','legumes','rice','tubers','dates','fish','meat'];
 const validState=saved?.version===1&&finite(saved.clock)&&saved.clock<=W.clock+1;
 const state=validState?JSON.parse(JSON.stringify(saved)):{version:1,clock:W.clock,serial:1,sites:{},shipments:[],missions:[],works:[],disputes:{},crimes:[],history:[],channels:{},cooldowns:{}};
 state.history||=[];state.channels||={};state.cooldowns||={};state.crimes||=[];state.works||=[];state.disputes||={};state.shipments||=[];state.missions||=[];state.serial=Math.max(1,Math.floor(state.serial)||1);
 if(validState&&state.clock>W.clock)W.clock=state.clock;
 const sites=()=>[...new Set(Object.values(state.sites))];
 for(const node of A.nodes.filter(n=>n.rest&&n.kind!=='dock')){
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
 // Quays are services of their actual port, not a second village with free
 // farms and guards. Pool legacy stores once, then share the parent's account.
 for(const node of A.nodes.filter(n=>n.kind==='dock')){const parent=state.sites[node.town],old=state.sites[node.id];if(!parent)continue;if(old&&old.id===node.id){for(const [id,n]of Object.entries(old.stock||{}))parent.stock[id]=(parent.stock[id]||0)+n;parent.treasury+=old.treasury||0;parent.population+=old.population||0;parent.workers+=old.workers||0;parent.guardPool+=old.guardPool||0;parent.guardAvailable+=old.guardAvailable||0;for(const [id,n]of Object.entries(old.needs||{}))parent.needs[id]=(parent.needs[id]||0)+n;parent.capacity.water=(parent.capacity.water||0)+(old.capacity?.water||0);}state.sites[node.id]=parent;}
 state.care||={};state.bands||={};state.hostiles||={};
 // A workshop's inputs must be produced locally where the regional potential
 // permits it, or ordered on the graph. No stock is created by this migration.
 for(const site of sites()){
  const node=A.byId[site.id],region=regions.get(node.region);site.supportProduction||=[];
  const ensure=(id,seen=new Set())=>{if(seen.has(id))return;seen.add(id);const r=resources.get(id);if(!r)return;
   if(!site.capacity[id]&&(region?.resourceLevels?.[id]||0)>0){site.capacity[id]=Math.max(site.population*(foods.includes(id)?1.4:.12),(site.needs[id]||0)*1.4);site.deposits[id]=site.capacity[id]*(r.renewal==='finite'?180:120);site.supportProduction.push(id);}
   if(site.capacity[id]&&r.inputAlternatives?.length){const recipe=[...r.inputAlternatives].sort((a,b)=>b.reduce((n,k)=>n+(region?.resourceLevels?.[k]||0),0)-a.reduce((n,k)=>n+(region?.resourceLevels?.[k]||0),0))[0];for(const input of recipe)ensure(input,seen);}
  };
  if(!site.supplyRevision){for(const id of Object.keys(site.capacity))ensure(id);ensure('medicinal');ensure('tools');ensure('cloth');site.supplyRevision=1;}
 }
 function requirements(site){const need={...site.needs},region=regions.get(A.byId[site.id].region);
  // Tools, coats and treatments are indivisible at the service counter. Small
  // communities need the same four-lot replenishment target as their workshop,
  // rather than ceasing input orders while less than one usable lot remains.
  for(const id of ['tools','cloth'])need[id]=Math.max(1,need[id]||0);
  const addInputs=(id,rate,seen=new Set())=>{if(seen.has(id))return;const recipes=resources.get(id)?.inputAlternatives;if(!recipes?.length)return;seen=new Set([...seen,id]);
   const recipe=[...recipes].sort((a,b)=>b.reduce((n,k)=>n+Math.min(1,stock(site,k))+(region?.resourceLevels?.[k]||0),0)-a.reduce((n,k)=>n+Math.min(1,stock(site,k))+(region?.resourceLevels?.[k]||0),0))[0];
   const output=Math.max(0,rate*4-stock(site,id))/4;for(const input of recipe){need[input]=(need[input]||0)+output;addInputs(input,output,seen);}
  };
  for(const [id,rate]of Object.entries(need))addInputs(id,rate);
  need.medicinal=Math.max(need.medicinal||0,Object.keys(state.care[site.id]||{}).length/4,.25);
  for(const work of state.works)if(work.site===site.id&&work.status==='working'&&!work.paid){need.tools=Math.max(need.tools||0,work.tools/4);need.timber=Math.max(need.timber||0,work.timber/4);}
  return need;
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
 function event(type,target,extra={},duration=0,at=state.clock){const e=W.add(type,target,at,duration,extra);publish(e);return e;}
 function stock(site,id){return Math.max(0,Number(site.stock[id])||0);}
 function take(site,id,amount){const n=Math.min(stock(site,id),Math.max(0,amount));site.stock[id]=stock(site,id)-n;return n;}
 function route(from,to){return A.findPath(from,to,{mode:'cart',allowBoat:true,clock:state.clock,state:W});}
 function minutes(path){return path.reduce((n,s)=>n+s.length/A.modes[s.mode].metresPerMinute,0);}
 function cargoRate(c,leg){return leg.mode==='boat'?A.modes.boat.metresPerMinute:c.landRate||A.modes[leg.mode].metresPerMinute;}
 function cargoPosition(c){const leg=c.path[c.leg];if(!leg){const n=A.byId[c.status==='returning'?c.from:c.to];return {x:n.x,y:n.y};}const a=A.vertices.get(leg.from),b=A.vertices.get(leg.to),t=clamp(c.progress*cargoRate(c,leg)/Math.max(.001,leg.length),0,1);return {x:a[0]+(b[0]-a[0])*t,y:a[1]+(b[1]-a[1])*t};}
 function cargoUnits(c){if(!Array.isArray(c.units))c.units=Array.from({length:c.crew||2},(_,i)=>({id:c.id+'-crew-'+i,role:'crew',hp:6}));return c.units;}
 function addShipment(from,to,id,amount){
  const a=state.sites[from],b=state.sites[to];if(!a||!b||from===to||amount<=0||state.shipments.filter(s=>['travel','returning'].includes(s.status)).length>=64)return null;
  if(!resources.has(id)||!finite(amount)||a.workers<2||a.guardAvailable<2||a.treasury<6||stock(a,'provisions')<4)return null;
  const path=route(from,to);if(!path?.length)return null;const qty=Math.min(amount,80,Math.max(0,stock(a,id)-(a.needs[id]||1)*a.reserveDays-(id==='provisions'?4:0)));if(qty<=0)return null;
  const price=Math.max(1,Math.ceil(qty*.5));if(b.treasury<price)return null;
  take(a,id,qty);take(a,'provisions',4);b.treasury-=price;a.workers-=2;a.guardAvailable-=2;a.treasury-=6;const cargo={id:'cargo-'+state.serial++,from,to,resource:id,amount:qty,originalAmount:qty,lost:0,paid:price,path:path.map(p=>({...p})),leg:0,progress:0,status:'travel',depart:state.clock,clock:state.clock,crew:2,guards:2,staffReserved:true,guardReserved:true,landRate:pacing.metresPerMinute(pacing.civilianWalk),delivered:false,news:JSON.parse(JSON.stringify(state.channels[from]||{}))};
  cargoUnits(cargo);for(let i=0;i<2;i++)cargo.units.push({id:cargo.id+'-guard-'+i,role:'guard',hp:8,hostileUntil:0});
  state.shipments.push(cargo);history('cargo_departure',{id:cargo.id,from,to,resource:id,amount:qty});return cargo;
 }
 function produce(site,day,sky){
  const demand=requirements(site);
  const work=clamp(1-site.distress*.06,.2,1)*clamp(site.workers/site.population,0,1),season=(state.clock/1440)%96/96,cold=(sky.temperature??15)<-5;
  for(const [id,rate]of Object.entries(site.capacity).sort((a,b)=>depth(a[0])-depth(b[0])||Number(b[0]==='tools')-Number(a[0]==='tools')||a[0].localeCompare(b[0]))){
   const r=resources.get(id);if(!r)continue;let amount=rate*day*work;
   if(r.kind==='agriculture')amount*=cold?.05:season>.25&&season<.8?1.3:.65;
   if(id==='water')amount*=clamp(1-(sky.storm||0)*.1-(sky.temperature>30?.25:0),.4,1.2);
   const life=r.storageDays||1,maximum=Math.max(['tools','cloth','medicinal'].includes(id)?4:0,(demand[id]||0)*Math.min(4,life),rate*(r.kind==='processed'?1:3));
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
 function beginCargoEncounter(c,enemies){
  const foes=enemies.filter(e=>finite(e.hp)&&e.hp>0).map(e=>{const old=state.hostiles[e.id],n={id:e.id,hp:Math.min(old?.hp??e.hp,e.hp),damage:Math.max(1,e.damage||1),eventId:e.eventId||null};state.hostiles[e.id]=n;return n.id;});
  if(foes.length)c.encounterState={clock:W.clock,foes};else if(!c.encounterState)delete c.encounter;
 }
 function resolveCargoEncounter(c,until){
  const fight=c.encounterState;if(!fight)return null;const roundMinutes=1.4/pacing.realSeconds(1);
  for(let i=0;i<512&&fight.clock+roundMinutes<=until;i++){
   let foes=fight.foes.map(id=>state.hostiles[id]).filter(e=>e?.hp>0),units=cargoUnits(c).filter(u=>u.hp>0);if(!foes.length||!units.length)break;fight.clock+=roundMinutes;
   // Only recorded participants exchange blows. Guards protect the actual crew;
   // there is no random casualty or free victory on unloading a scene.
   for(const u of units.filter(u=>u.role==='guard')){const target=foes.find(e=>e.hp>0);if(target)target.hp=Math.max(0,target.hp-1);}
   for(const e of foes.filter(e=>e.hp>0)){const target=cargoUnits(c).find(u=>u.role==='guard'&&u.hp>0)||cargoUnits(c).find(u=>u.hp>0);if(target)damageCargoUnit(c,target.id,Math.max(0,target.hp-e.damage));}
   for(const e of foes)if(e.eventId){const incident=W.events.find(v=>v.id===e.eventId);if(incident){const slot=Number(e.id.split('-').at(-1));recordBandHealth(incident,slot,e.hp);const count=incident.memberIds?.length??A.EVENT_TYPES[incident.type].group??0;if(Array.from({length:count},(_,i)=>state.hostiles['incident-'+incident.id+'-'+i]?.hp===0).every(Boolean))W.resolve(incident.id,fight.clock);}}
   if(!foes.some(e=>e.hp>0)||!cargoUnits(c).some(u=>u.hp>0))break;
  }
  if(fight.foes.some(id=>state.hostiles[id]?.hp>0)&&cargoUnits(c).some(u=>u.hp>0))return null;
  const ended=fight.clock;delete c.encounter;delete c.encounterState;history('cargo_encounter_resolved',{id:c.id,survivors:cargoUnits(c).filter(u=>u.hp>0).map(u=>u.id)},ended);return ended;
 }
 function recordBandHealth(event,slot,hp){const band=state.bands[event?.bandKey],id=event?.memberIds?.[slot],member=band?.members.find(m=>m.id===id);if(member){member.hp=Math.max(0,hp);member.dead=member.hp<=0;}}
 function progressCargo(c,dt,local=false,at=state.clock){
  if(!['travel','returning'].includes(c.status)||!local&&controlledCargo.has(c.id))return;
  // Resolve recorded opponents before spending the remaining travel time. Legacy
  // encounters with no participants require observation rather than invented losses.
  if(!local&&c.encounter){const resumed=resolveCargoEncounter(c,at);if(resumed===null){c.clock=Math.max(c.clock||0,at);return;}dt=Math.max(0,at-resumed);}
  const units=cargoUnits(c);if(!units.some(u=>u.role==='crew'&&u.hp>0)&&(!c.delivered||!units.some(u=>u.hp>0))){c.status='abandoned';c.abandonedAt=at;history('cargo_abandoned',{id:c.id},at);return;}
  let remaining=Math.max(0,dt);if(!local&&remaining>0)delete c.localPosition;
  for(let guard=0;(remaining>1e-7||!c.path[c.leg])&&guard<20000;guard++){
   const leg=c.path[c.leg];if(!leg){
    if(c.status==='returning'){if(c.staffReserved){state.sites[c.from].workers+=units.filter(u=>u.role==='crew'&&u.hp>0).length;c.staffReserved=false;}if(c.guardReserved){state.sites[c.from].guardAvailable+=units.filter(u=>u.role==='guard'&&u.hp>0).length;c.guardReserved=false;}c.status='delivered';history('cargo_crew_return',{id:c.id},at);break;}
    const site=state.sites[c.to],paid=c.paid*c.amount/(c.originalAmount||c.amount||1);site.stock[c.resource]=stock(site,c.resource)+c.amount;state.sites[c.from].treasury+=paid;site.treasury+=c.paid-paid;c.delivered=true;c.deliveredAmount=c.amount;c.arrived=at-remaining;
    const ledger=state.channels[c.to]||(state.channels[c.to]={});for(const [id,k]of Object.entries(c.news||{}))if(!ledger[id]||(k.heard||0)>(ledger[id].heard||0)||k.resolved!==null&&ledger[id].resolved===null)ledger[id]={...k,heard:state.clock,source:'Caravaniers'};
    history('cargo_delivered',{id:c.id,amount:c.amount,resource:c.resource,to:c.to},at-remaining);event('caravan',c.to,{detail:c.amount.toFixed(0)+' lots de '+(resources.get(c.resource)?.label||c.resource)+' livrés.',source:'Caravaniers'},720,at-remaining);
    c.status='returning';c.path=c.path.slice().reverse().map(p=>({...p,from:p.to,to:p.from}));c.leg=0;c.progress=0;continue;
   }
   const edge=A.edgeById.get(leg.edge);if(!edge){c.waiting='route_migration';break;}const status=W.edgeStatus(edge,state.clock);if(status.closed||status.events.some(e=>A.EVENT_TYPES[e.type].civilianPrey)){c.waiting=leg.edge;break;}c.waiting=null;
   const length=leg.length/cargoRate(c,leg),step=Math.min(remaining,length-c.progress);c.progress+=step;remaining-=step;if(c.progress>=length-1e-7){c.leg++;c.progress=0;}
  }c.clock=Math.max(c.clock||0,at);
 }
 function damageCargoUnit(c,id,hp,hostileUntil=0){const u=cargoUnits(c).find(u=>u.id===id);if(!u||!finite(hp)||hp<0)return false;const alive=u.hp>0;u.hp=clamp(hp,0,u.role==='guard'?8:6);u.hostileUntil=hostileUntil;
  if(alive&&u.hp===0){if(u.role==='guard')state.sites[c.from].guardPool=Math.max(0,state.sites[c.from].guardPool-1);history('cargo_casualty',{id:c.id,person:id,role:u.role});}
  if(!c.delivered&&!cargoUnits(c).some(u=>u.role==='crew'&&u.hp>0)){c.status='abandoned';c.abandonedAt=W.clock;}return true;
 }
 function loseCargo(c,amount,reason='loss'){if(c.delivered||!finite(amount)||amount<=0)return 0;const n=Math.min(c.amount,amount);c.amount-=n;c.lost=(c.lost||0)+n;history('cargo_loss',{id:c.id,resource:c.resource,amount:n,reason});return n;}
 function resolveWork(work,dt){
  if(work.status!=='working')return;const site=state.sites[work.site],e=W.events.find(e=>e.id===work.event);
  if(!site||!e||e.resolved!==null){if(site&&work.staffReserved){site.workers+=work.crew;work.staffReserved=false;}work.status='ended';return;}
  if(W.active(state.clock).some(e=>e.target===work.site&&['siege','occupation','bandits'].includes(e.type)))return;
  if(!work.paid){if(stock(site,'tools')<work.tools||stock(site,'timber')<work.timber||site.workers<work.crew||site.treasury<work.crew*2)return;take(site,'tools',work.tools);take(site,'timber',work.timber);site.workers-=work.crew;site.treasury-=work.crew*2;work.staffReserved=true;work.paid=true;}
  work.remaining-=dt;if(work.remaining<=0){W.resolve(e.id,state.clock);event('repair',e.target,{source:'Équipe de réparation',position:e},1440);work.status='completed';if(work.staffReserved){site.workers+=work.crew;work.staffReserved=false;}history('repair_completed',{event:e.id,site:work.site});}
 }
 function causalEvents(){
  for(const site of sites()){
   const food=stock(site,'provisions')+foods.reduce((n,id)=>n+stock(site,id),0),shortage=food<site.needs.provisions||stock(site,'water')<site.needs.water;
   const old=W.active(state.clock).find(e=>e.type==='shortage'&&e.target===site.id);
   if(shortage&&!old)event('shortage',site.id,{source:'Intendant de '+A.byId[site.id].name});
   if(!shortage&&old&&food>=site.needs.provisions*2&&stock(site,'water')>=site.needs.water*2)W.resolve(old.id,state.clock);
  }
  // Physical damage remains until an actual, paid work order completes.
  for(const e of W.active(state.clock))if(['bridge','landslide','avalanche','fire'].includes(e.type)&&!state.works.some(w=>w.event===e.id)){publish(e);W.revision++;}
 }
 function dispatch(){
  const room=64-state.shipments.filter(c=>['travel','returning'].includes(c.status)).length;if(room<=0)return;
  let count=0;const demandBySite=new Map(sites().map(site=>[site.id,requirements(site)]));
  const demands=sites().flatMap(site=>Object.entries(demandBySite.get(site.id)).map(([id,rate])=>({site,id,rate,missing:rate*4-stock(site,id)})))
   .filter(d=>d.missing>0).sort((a,b)=>{
    const priority=d=>(d.id==='medicinal'&&Object.keys(state.care[d.site.id]||{}).length?100:0)+(d.site.distress||0)*10+(['tools','timber'].includes(d.id)&&state.works.some(w=>w.site===d.site.id&&w.status==='working')?50:0)+d.missing/Math.max(1,d.rate);
    return priority(b)-priority(a)||a.site.id.localeCompare(b.site.id)||a.id.localeCompare(b.id);
   });
  for(const {site,id,rate,missing}of demands){
   if(count>=Math.min(16,room))return;
   const incoming=state.shipments.filter(c=>c.status==='travel'&&c.to===site.id&&c.resource===id).reduce((n,c)=>n+c.amount,0),need=missing-incoming;if(need<=.01)continue;
   const target=A.byId[site.id],suppliers=sites().filter(a=>a!==site&&stock(a,id)>Math.max(1,(demandBySite.get(a.id)[id]||0)*a.reserveDays)).sort((a,b)=>Math.hypot(A.byId[a.id].x-target.x,A.byId[a.id].y-target.y)-Math.hypot(A.byId[b.id].x-target.x,A.byId[b.id].y-target.y));
   let sent=false;for(const supplier of suppliers.slice(0,8))if((id!=='water'||Math.hypot(A.byId[supplier.id].x-target.x,A.byId[supplier.id].y-target.y)<500)&&addShipment(supplier.id,site.id,id,need)){count++;sent=true;break;}
   if(id==='provisions'&&!sent)for(const food of foods){const supplier=sites().find(a=>a!==site&&stock(a,food)>need+3);if(supplier&&addShipment(supplier.id,site.id,food,need)){count++;break;}}
  }
 }
 function mandate(){
  for(const site of sites()){
   const node=A.byId[site.id],wanted=W.justice?.effect(site.id,null,state.clock),last=W.justice?.state.sightings[site.id],incident=W.active(state.clock).find(e=>(['bandits','occupation','massacre','crime_scene'].includes(e.type)||e.type==='missing'&&e.missingMission)&&state.channels[site.id]?.[e.id]?.resolved===null&&Math.hypot(e.x-node.x,e.y-node.y)<1000)||(wanted?.wanted?{id:'warrant-'+site.jurisdiction,target:site.id,x:last?.x??node.x,y:last?.y??node.y,warrant:true}:null);
   const jurisdiction=incident?.warrant?site:incident&&state.sites[A.nearestSite(incident.x,incident.y).id];
   if(!incident||jurisdiction?.authority!==site.authority||site.guardAvailable<2||site.treasury<12||stock(site,'provisions')<4||state.missions.some(m=>m.site===site.id&&m.status==='active'))continue;
   const road=A.roadById[incident.target]||A.closestRoad(incident.x,incident.y)?.road;if(!road||road.type==='searoutes')continue;
   if(W.active(state.clock).some(e=>e.type==='patrol'&&e.target===road.id&&Math.hypot(e.x-incident.x,e.y-incident.y)<80))continue;
   site.guardAvailable-=2;site.treasury-=12;take(site,'provisions',4);const e=event('patrol',road.id,{source:site.authority,position:{x:incident.x,y:incident.y}},1440);
   if(e){e.authority=site.authority;e.mandateSite=site.id;e.mandate=incident.warrant?'search_last_seen':'protect_travellers';if(incident.warrant){e.lastKnownAt=last?.at??state.clock;e.caseIds=wanted.cases.filter(c=>c.servedAt===null&&c.wantedUntil>state.clock).map(c=>c.id);}state.missions.push({id:'mandate-'+state.serial++,event:e.id,site:site.id,road:road.id,crew:2,until:state.clock+1440,status:'active'});}
  }
 }
 function institutions(){
  for(const m of state.missions){
   if(m.status==='active'&&state.clock>=m.until){W.resolve(m.event,m.until);m.status='returning';const e=W.events.find(e=>e.id===m.event),home=A.byId[m.site];m.returnAt=m.until+Math.max(60,Math.hypot((e?.x??home.x)-home.x,(e?.y??home.y)-home.y)/pacing.metresPerMinute(pacing.civilianWalk));}
   if(m.status!=='returning'||m.engaged||m.physical||state.clock<m.returnAt)continue;
   const casualties=m.casualties||0,site=state.sites[m.site];site.guardAvailable+=Math.max(0,m.crew-casualties);site.guardPool=Math.max(0,site.guardPool-casualties);m.status='returned';history('patrol_return',{id:m.id,site:m.site,casualties});
   if(casualties){const missing=event('missing',m.site,{source:'Poste local',detail:casualties+' membres de la patrouille attendue ne sont pas rentrés.'},1440);if(missing)missing.missingMission=m.id;}
  }
  // An identified local band needs a base, members and exposed real traffic.
  for(const cargo of state.shipments.filter(c=>c.status==='travel'&&!c.waiting)){
   const leg=cargo.path[cargo.leg];if(!leg)continue;const road=A.roadById[leg.road],profile=B.routes.find(r=>'road-'+r.atlasRouteId===road?.id);if(!profile)continue;
   const candidate=B.networks.find(n=>n.rule==='bandit_ambush'&&n.regions.some(r=>profile.regions.includes(r)));if(!candidate)continue;
   const position=cargoPosition(cargo),base=sites().filter(s=>profiles.get(s.id)?.criminalNetworks.includes(candidate.id)&&s.distress>=1.5&&Math.hypot(A.byId[s.id].x-position.x,A.byId[s.id].y-position.y)<1500).sort((a,b)=>Math.hypot(A.byId[a.id].x-position.x,A.byId[a.id].y-position.y)-Math.hypot(A.byId[b.id].x-position.x,A.byId[b.id].y-position.y))[0];if(!base)continue;
   const key='band-'+candidate.id+'-'+base.id,previous=state.cooldowns[key]??-Infinity;if(state.clock-previous<4320||W.active(state.clock).some(e=>e.target===road.id&&['patrol','bandits'].includes(e.type)))continue;
   const band=state.bands[key]||(state.bands[key]={home:base.id,members:Array.from({length:3},(_,i)=>({id:key+'-'+i,hp:4,dead:false}))}),members=band.members.filter(m=>!m.dead&&m.hp>0);if(!members.length)continue;
   const e=event('bandits',road.id,{source:'Voyageurs',position:cargoPosition(cargo)},1440);if(e){e.groupId=candidate.id;e.memberIds=members.map(m=>m.id);e.bandKey=key;e.objective='cargo_or_toll';e.victimCargo=cargo.id;e.home=base.id;state.cooldowns[key]=state.clock;history('band_ambush',{event:e.id,group:candidate.id,cargo:cargo.id});}
  }
 }
 function advance(clock,weather=()=>({})){if(!finite(clock)||clock<state.clock)return;const begin=Math.floor(state.clock/60),end=Math.floor(clock/60);
  for(let hour=begin+1;hour<=end;hour++){
   state.clock=hour*60;W.clock=state.clock;
   // Reserve ready work before daily wear/spoilage consumes its exact materials.
   for(const work of state.works)resolveWork(work,60);
   for(const site of sites()){const node=A.byId[site.id],sky=weather(state.clock,node.x,node.y)||{};produce(site,1/24,sky);
    for(const [type,condition]of [['rain',(sky.rain||0)>.35],['snow',(sky.snow||0)>.35],['fog',(sky.fog||0)>.6]]){const old=W.active(state.clock).find(e=>e.type===type&&e.target===site.id);if(condition&&!old)event(type,site.id,{source:'Habitants de '+node.name});else if(!condition&&old)W.resolve(old.id,state.clock);}
   }
   for(const sea of A.roads.filter(r=>r.type==='searoutes')){const rough=sea.pts.some(p=>{const sky=weather(state.clock,p[0],p[1])||{};return sky.storm>.3||sky.wind>.85;}),old=W.active(state.clock).find(e=>e.type==='storm'&&e.target===sea.id);if(rough&&!old)event('storm',sea.id,{source:'Bateliers'});else if(!rough&&old)W.resolve(old.id,state.clock);}
   for(const c of state.shipments)progressCargo(c,Math.max(0,state.clock-(c.clock??state.clock-60)));causalEvents();
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
   const knownResolution=local?e.resolved:k?.resolved??book[e.id]?.resolved??null,next={heard:clock,confirmed:local?clock:k?.confirmed??k?.heard??book[e.id]?.confirmed??e.at,at:e.at,resolved:knownResolution,source:witnessed?'Témoin direct':k?.source||'Information locale'};
   if(!book[e.id]||book[e.id].resolved!==next.resolved||local&&book[e.id].confirmed!==clock){book[e.id]=next;changed=true;}
  }if(changed)W.revision++;return book;
 }
 function price(id,resource='provisions'){const s=state.sites[id];if(!s)return 1;const cover=stock(s,resource)/Math.max(1,s.needs[resource]||1);return clamp(2-cover/3,.65,3);}
 function purchase(id,food,water,payment=0){const s=state.sites[id];if(!s||!finite(food)||!finite(water)||!finite(payment)||payment<0||food<0||water<0||stock(s,'provisions')<food||stock(s,'water')<water)return false;take(s,'provisions',food);take(s,'water',water);s.treasury+=payment;history('player_purchase',{site:id,food,water});return true;}
 for(const e of W.active(state.clock))publish(e);
 return {state,advance,learn,price,purchase,requirements,beginCargoEncounter,recordBandHealth,requestCare:(id,person)=>{const site=state.sites[id];if(site)(state.care[site.id]||={})[person]=true;},finishCare:(id,person)=>{const site=state.sites[id];if(site&&state.care[site.id])delete state.care[site.id][person];},addShipment,publish,stock,history,cargoPosition,cargoRate,cargoUnits,damageCargoUnit,loseCargo,controlCargo:(id,on)=>on?controlledCargo.add(id):controlledCargo.delete(id),catchUpCargo:(c,at=W.clock)=>{if(state.shipments.includes(c)&&finite(at)&&at>(c.clock??at)&&!controlledCargo.has(c.id))progressCargo(c,at-c.clock,false,at);},stepCargo:(c,minutes,at=W.clock)=>{if(state.shipments.includes(c)&&finite(minutes)&&minutes>=0)progressCargo(c,minutes,true,at);},serialize:()=>JSON.parse(JSON.stringify(state))};
}
if(typeof module!=='undefined'&&module.exports)module.exports=createWorldSimulation;
