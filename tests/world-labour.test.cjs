const {test}=require('node:test'),assert=require('node:assert/strict');
const A=require('../scripts/world-model.js')(require('../data/world/atlas.json')),create=require('../scripts/world-simulation.js');
const B=Object.fromEntries(['resources','settlements','regions','relations','routes','networks'].map(n=>[n,require('../data/world/bible/generated/'+n+'.json')]));
function world(saved){const w=new A.WorldState(saved||{clock:480});w.simulation=create(A,B,w,saved?.simulation);return w;}
function fixture(){
 const w=world(),s=w.simulation,node=A.nodes.find(n=>n.kind==='town'&&A.adj.get(n.vertex)?.some(l=>l.edge.modes.includes('foot')&&!l.edge.modes.includes('boat')&&l.edge.length>100)),link=A.adj.get(node.vertex).find(l=>l.edge.modes.includes('foot')&&!l.edge.modes.includes('boat')&&l.edge.length>100),a=A.vertices.get(node.vertex),b=A.vertices.get(link.to),distance=Math.min(100,link.edge.length/2),t=distance/link.edge.length;
 const e=w.add('bridge',link.edge.roads[0],480,0,{position:{x:a[0]+(b[0]-a[0])*t,y:a[1]+(b[1]-a[1])*t}});e.edge=link.edge.id;w.revision++;const work=s.state.works.find(x=>x.event===e.id);work.site=node.id;work.remaining=120;const site=s.state.sites[node.id];Object.assign(site.stock,{tools:20,timber:40,provisions:300});site.treasury=100;return {w,s,site,e,work};
}
test('party, incapacity and physical return share one exclusion, including death and restore',()=>{
 const w=world(),s=w.simulation,site=s.state.sites.camp,before=site.workers;
 s.systems.setWorkerReason(site.id,'named-worker','party',true);s.systems.setWorkerReason(site.id,'named-worker','incapacity',true);assert.equal(site.workers,before-1);
 const copy=world(w.serialize()),other=copy.simulation,restored=other.state.sites.camp;other.systems.setWorkerReason(site.id,'named-worker','party',true);other.systems.setWorkerReason(site.id,'named-worker','party',false);assert.equal(restored.workers,before-1);other.systems.setWorkerReason(site.id,'named-worker','incapacity',false);assert.equal(restored.workers,before);
 s.systems.death(site.id,'named-worker');s.systems.death(site.id,'named-worker');assert.equal(site.workers,before-1);s.systems.setWorkerReason(site.id,'named-worker','party',false);assert.equal(site.workers,before-1);
});
test('an unavailable worker at an exhausted post consumes the next returning slot without creating workers',()=>{
 const s=world().simulation,site=s.state.sites.camp;site.workers=0;s.systems.setWorkerReason(site.id,'injured','incapacity',true);s.systems.restoreWorkers(site,2);assert.equal(site.workers,1);s.systems.setWorkerReason(site.id,'injured','incapacity',false);assert.equal(site.workers,2);
});
test('repair crews travel to the near side of real damage, spend finite goods and transfer wages once',()=>{
 const {w,s,site,e,work}=fixture(),before={workers:site.workers,cash:site.treasury,private:site.householdFunds,tools:site.stock.tools,timber:site.stock.timber};s.systems.prepareRepair(work);const m=s.state.missions.find(m=>m.id===work.mission);assert.ok(m);assert.equal(m.kind,'repair');assert.equal(m.units.length,2);assert.equal(site.workers,before.workers-2);assert.equal(site.treasury,before.cash-4);assert.equal(site.householdFunds,before.private+4);assert.equal(site.stock.tools,before.tools-1);assert.equal(site.stock.timber,before.timber-6);s.systems.prepareRepair(work);assert.equal(site.householdFunds,before.private+4);assert.equal(work.remaining,120);
 const trip=m.path.reduce((n,l)=>n+l.length,0)/require('../scripts/world-pacing.js').metresPerMinute(32),start=s.systems.position(m);let at=480;s.systems.stepMission(m,1,++at);assert.ok(Math.hypot(s.systems.position(m).x-start.x,s.systems.position(m).y-start.y)>0);assert.equal(work.remaining,120);
 s.systems.stepMission(m,100,at+=100);assert.ok(['active','returning','returned'].includes(m.status));assert.ok(e.resolved===null||work.remaining===0);if(m.status==='active'){s.systems.stepMission(m,work.remaining,at+=work.remaining);}
 assert.equal(work.status,'completed');if(m.status!=='returned')s.systems.stepMission(m,100,at+=100);assert.equal(m.status,'returned');assert.equal(site.workers,before.workers);assert.ok(trip>0);
});
test('another closure blocks repair travel and a survivor must actually return after a colleague dies',()=>{
 const {w,s,site,e,work}=fixture(),workers=site.workers,population=site.population;s.systems.prepareRepair(work);const m=s.state.missions.find(m=>m.id===work.mission),block=w.add('flood',e.target,480,0,{position:e});block.edge=m.path[0].edge;w.revision++;s.systems.stepMission(m,100,580);assert.equal(m.progress,0);assert.equal(work.remaining,120);w.resolve(block.id,580);
 s.systems.stepMission(m,100,680);assert.equal(m.status,'active');const remaining=work.remaining;s.systems.missionDamage(m,m.units[0].id,0);assert.equal(site.population,population-1);s.systems.stepMission(m,remaining,680+remaining);assert.ok(work.remaining>0);assert.equal(site.workers,workers-2);s.systems.stepMission(m,work.remaining*2,1000);assert.equal(work.status,'completed');s.systems.stepMission(m,100,1100);assert.equal(site.workers,workers-1);
});
test('an external resolution returns unspent materials and never makes staff available at the distant worksite',()=>{
 const {w,s,site,e,work}=fixture(),workers=site.workers,tools=site.stock.tools;s.systems.prepareRepair(work);const m=s.state.missions.find(m=>m.id===work.mission);s.systems.stepMission(m,1,481);w.resolve(e.id,481);s.systems.stepMission(m,0,481);assert.equal(m.status,'returning');assert.equal(site.workers,workers-2);s.systems.stepMission(m,100,581);assert.equal(m.status,'returned');assert.equal(site.stock.tools,tools);assert.equal(site.workers,workers);
});
test('legacy prepaid repairs keep reserved staff and restore their recorded wages exactly once',()=>{
 const {s,site,work}=fixture(),workers=site.workers,privateFunds=site.householdFunds;work.paid=true;work.staffReserved=true;site.workers-=2;site.treasury-=4;site.stock.tools--;site.stock.timber-=6;s.systems.prepareRepair(work);assert.equal(site.workers,workers-2);assert.equal(site.householdFunds,privateFunds+4);const cash=site.treasury;s.systems.prepareRepair(work);assert.equal(site.householdFunds,privateFunds+4);assert.equal(site.treasury,cash);
});
test('incapacitated returning crew need actual medicine and food before rejoining the workforce',()=>{
 const {s,site,work}=fixture(),workers=site.workers;s.systems.prepareRepair(work);const m=s.state.missions.find(m=>m.id===work.mission);for(const u of m.units)s.systems.missionDamage(m,u.id,1);s.systems.stepMission(m,0,480);assert.equal(m.status,'returned');assert.equal(site.workers,workers-2);site.stock.medicinal=0;s.systems.tickLabour(840);assert.equal(site.workers,workers-2);site.stock.medicinal=1;const food=site.stock.provisions;s.systems.tickLabour(840);assert.equal(site.stock.medicinal,0);assert.equal(site.stock.provisions,food-1);assert.equal(site.workers,workers-1);s.systems.tickLabour(840);assert.equal(site.workers,workers-1);
});
test('repair expeditions preserve the same campaign through split advances and a mid-mission save',()=>{
 const initial=fixture().w.serialize(),one=world(initial),split=world(initial);one.advance(1800,()=>({rain:0,temperature:15}));split.advance(720,()=>({rain:0,temperature:15}));const restored=world(split.serialize());restored.advance(1800,()=>({rain:0,temperature:15}));assert.deepEqual(one.simulation.state,restored.simulation.state);
});

test('worker identities and every surviving wound persist across repair, reassignment and reload',()=>{
 const {w,s,site,work}=fixture();s.systems.prepareRepair(work);const m=s.state.missions.find(m=>m.id===work.mission),ids=m.units.map(u=>u.id);for(const u of m.units)s.systems.missionDamage(m,u.id,3);
 m.status='returning';m.path=[];s.systems.stepMission(m,0,480);assert.equal(m.status,'returned');assert.deepEqual(ids.map(id=>site.workerRecords[id].hp),[3,3]);
 const copy=world(w.serialize()),other=copy.simulation,post=other.state.sites[site.id],next=other.systems.reserveCrew(post,2,'next-mission');assert.deepEqual(next.map(u=>[u.id,u.hp]),ids.map(id=>[id,3]));const medicine=post.stock.medicinal=1;other.systems.tickLabour(2000);assert.equal(post.stock.medicinal,medicine,'assigned workers cannot receive treatment remotely');
});
test('local meals and water count each absent living person once, but incapacity alone does not remove a local mouth',()=>{
 const {s,site}=fixture(),food=site.needs.provisions,water=site.needs.water,pop=site.population;s.systems.setWorkerReason(site.id,'absent','party',true);s.systems.setWorkerReason(site.id,'absent','returning',true);s.systems.setWorkerReason(site.id,'absent','incapacity',true);s.systems.setWorkerReason(site.id,'local-patient','incapacity',true);
 assert.ok(Math.abs(s.systems.localNeeds(site).provisions-food*(pop-1)/pop)<1e-8);assert.ok(Math.abs(s.systems.localNeeds(site).water-water*(pop-1)/pop)<1e-8);s.systems.setWorkerReason(site.id,'absent','party',false);s.systems.setWorkerReason(site.id,'absent','returning',false);assert.equal(s.systems.localNeeds(site).provisions,food);
});
test('a finite anonymous expedition cannot reserve a named local person who is still working visibly at home',()=>{
 const {s,site}=fixture();site.workers=2;site.workerRecords.local={id:'local',hp:6,job:'hoe',reasons:{},debited:false};const before=JSON.stringify(site);assert.equal(s.systems.reserveCrew(site,2,'no-hidden-clone'),null);assert.equal(JSON.stringify(site),before);
});
test('a dead worker is never recreated by reassignment and all treatment requests are removed',()=>{
 const {s,site}=fixture(),units=s.systems.reserveCrew(site,2,'first');s.state.care[site.id]={[units[0].id]:true};s.systems.death(site.id,units[0].id,{reserved:true});units[0].hp=0;s.systems.restoreCrew(site,units,480);assert.equal(s.state.care[site.id][units[0].id],undefined);const next=s.systems.reserveCrew(site,2,'second');assert.ok(next.every(u=>u.id!==units[0].id));
});
test('production follows the available profession and does not assign a transport relief to farming or crafting',()=>{
 const {s,site}=fixture();site.capacity={grain:100,tools:100};site.labourBase=site.workers=2;site.workerRecords={farmer:{id:'farmer',job:'hoe',hp:6,reasons:{},onDuty:true},smith:{id:'smith',job:'craft',hp:6,reasons:{},onDuty:true}};
 assert.deepEqual(s.systems.productionStaff(site),{grain:1,tools:1});s.systems.setWorkerReason(site.id,'farmer','party',true);assert.deepEqual(s.systems.productionStaff(site),{grain:0,tools:1});s.systems.setWorkerReason(site.id,'farmer','party',false);site.workerRecords.farmer.service='relay';assert.equal(s.systems.productionStaff(site).grain,0);site.workerRecords.smith.onDuty=false;assert.equal(s.systems.productionStaff(site).tools,0);
});
test('a remote repair reopens the passage before the crew returns but its report reaches the home ledger only with the survivors',()=>{
 const {w,s,site,e,work}=fixture();s.systems.prepareRepair(work);const m=s.state.missions.find(m=>m.id===work.mission);s.systems.stepMission(m,100,580);assert.equal(m.status,'active');work.remaining=1;s.systems.stepMission(m,1,581);assert.equal(e.resolved,581);assert.equal(m.status,'returning');assert.equal(s.state.channels[site.id]?.[e.id]?.resolved??null,null);const report=w.events.find(e=>e.type==='repair');assert.ok(report.reportPending);assert.equal(Object.values(s.state.channels).some(book=>book[report.id]),false);
 const copy=world(w.serialize()),other=copy.simulation,saved=other.state.missions.find(v=>v.id===m.id);assert.equal(other.state.channels[site.id]?.[e.id]?.resolved??null,null);other.systems.stepMission(saved,100,681);assert.equal(saved.status,'returned');assert.equal(other.state.channels[site.id][e.id].resolved,581);assert.ok(other.state.channels[site.id][report.id]);
});
test('named workers heal by campaign hours and finite medicine with identical results across split advances',()=>{
 const {w,s,site}=fixture();site.workerRecords.patient={id:'patient',job:'hoe',hp:2,reasons:{},careEligible:true,nextCare:840};site.stock.medicinal=20;const saved=w.serialize(),one=world(saved),split=world(saved);one.advance(1260,()=>({temperature:15}));split.advance(900,()=>({temperature:15}));const restored=world(split.serialize());restored.advance(1260,()=>({temperature:15}));assert.deepEqual(one.simulation.state,restored.simulation.state);assert.equal(one.simulation.state.sites[site.id].workerRecords.patient.hp,6);
});

test('repairing one event does not drain a separate flood at the same crossing',()=>{
 const {w,s,e,work}=fixture();s.systems.prepareRepair(work);const m=s.state.missions.find(m=>m.id===work.mission);s.systems.stepMission(m,100,580);assert.equal(m.status,'active');const flood=w.add('flood',e.target,580,0,{position:e});work.remaining=1;s.systems.stepMission(m,1,581);assert.notEqual(e.resolved,null);assert.equal(flood.resolved,null);
});
test('a returned roster cannot damage or resurrect a worker assigned to the next expedition',()=>{
 const {s,site}=fixture(),units=s.systems.reserveCrew(site,2,'first'),m={id:'first',site:site.id,units,status:'returned'};s.systems.restoreCrew(site,units,480);const next=s.systems.reserveCrew(site,2,'next'),population=site.population;assert.equal(next[0].id,units[0].id);assert.equal(s.systems.missionDamage(m,units[0].id,0),false);assert.equal(site.population,population);assert.equal(site.workerRecords[next[0].id].assignment,'next');
});
test('the same worker keeps their appearance as well as their wounds when changing jobs',()=>{
 const {s,site}=fixture(),units=s.systems.reserveCrew(site,2,'first');units[0].appearance={sex:'feminin',outfit:'saved-outfit'};units[0].hp=3;s.systems.crewHealth(site,units[0],'first');s.systems.restoreCrew(site,units,480);const next=s.systems.reserveCrew(site,2,'next');assert.deepEqual(next[0].appearance,units[0].appearance);assert.equal(next[0].hp,3);
});
function cargoFixture(){const w=world(),s=w.simulation,posts=[...new Set(Object.values(s.state.sites))];for(const from of posts)for(const to of posts){if(from===to)continue;const path=A.findPath(from.id,to.id,{mode:'cart',allowBoat:false,state:w});if(!path?.length||path.reduce((n,l)=>n+l.length,0)>1500)continue;Object.assign(from.stock,{cloth:200,provisions:200,tools:20});from.treasury=to.treasury=1000;const c=s.addShipment(from.id,to.id,'cloth',10);if(!c)continue;c.progress=c.path[0].length/s.cargoRate(c,c.path[0])/2;return {w,s,site:from,c};}throw Error('No cargo fixture');}
test('an entirely incapacitated convoy leaves its goods and returns its living personnel without inventing deaths',()=>{
 const {s,site,c}=cargoFixture(),population=site.population,workers=site.workers;for(const u of c.units.filter(u=>u.role==='crew'))s.damageCargoUnit(c,u.id,1);s.stepCargo(c,0,480);assert.equal(c.abandoned,true);assert.equal(c.status,'returning');assert.equal(site.population,population);assert.equal(site.workers,workers);assert.equal(c.amount,10);
});
test('a recovery with incapacitated porters returns without loading goods and permits a subsequent recovery',()=>{
 const {w,s,site,c}=cargoFixture();for(const u of c.units)s.damageCargoUnit(c,u.id,0);s.systems.reportLoss(c,'Témoin');const m=s.systems.recover(c);assert.ok(m);for(const u of m.units.filter(u=>u.role==='crew'))s.systems.missionDamage(m,u.id,1);s.systems.stepMission(m,1000,1480);assert.equal(m.status,'returned');assert.equal(c.amount,10);assert.equal(c.recoveryMission,null);assert.ok(s.systems.recover(c));
});
test('the death of all returning repairers does not deliver their pending report remotely',()=>{
 const {w,s,site,e,work}=fixture();s.systems.prepareRepair(work);const m=s.state.missions.find(m=>m.id===work.mission);s.systems.stepMission(m,100,580);work.remaining=1;s.systems.stepMission(m,1,581);assert.equal(m.status,'returning');for(const u of m.units)s.systems.missionDamage(m,u.id,0);s.systems.stepMission(m,0,581);assert.equal(m.status,'returned');assert.equal(s.state.channels[site.id]?.[e.id]?.resolved??null,null);assert.equal(Object.values(s.state.channels).some(book=>Object.keys(book).some(id=>w.events.find(e=>e.id===id)?.type==='repair')),false);
});
test('a convoy brings back a dated snapshot of news acquired at its destination',()=>{
 const {w,s,site,c}=cargoFixture(),e=w.add('shortage',c.to,480,0);assert.equal(s.state.channels[site.id]?.[e.id],undefined);w.clock=3000;s.catchUpCargo(c,3000);assert.equal(c.status,'delivered');assert.ok(s.state.channels[site.id][e.id]);assert.equal(s.state.channels[site.id][e.id].source,'Caravaniers de retour');
});
test('legacy convoys without units retain their reserved guards and bind crew without charging workers again',()=>{
 const {w,s,site,c}=cargoFixture(),saved=w.serialize(),data=saved.simulation.shipments.find(v=>v.id===c.id),workers=site.workers,guards=c.units.filter(u=>u.role==='guard').map(u=>[u.id,u.hp]);for(const u of c.units.filter(u=>u.role==='crew'))delete saved.simulation.sites[site.id].workerRecords[u.id];delete data.units;const restored=world(saved),other=restored.simulation,copy=other.state.shipments.find(v=>v.id===c.id);assert.equal(other.state.sites[site.id].workers,workers);assert.deepEqual(copy.units.filter(u=>u.role==='guard').map(u=>[u.id,u.hp]),guards);assert.equal(copy.units.filter(u=>u.role==='crew').length,2);assert.equal(other.systems.outsideCount(other.state.sites[site.id]),4);
});
