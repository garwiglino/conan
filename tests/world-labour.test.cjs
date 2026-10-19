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
