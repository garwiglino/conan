const {test}=require('node:test'),assert=require('node:assert/strict'),{A,world,cargo,unfundedBand}=require('./world-audit-fixtures.cjs');
test('audit 5: terrestrial recovery cannot reserve people or take supplies for an offshore wreck',()=>{
 const {w,s,from,c}=cargo(world(),true);for(const u of c.units.filter(u=>u.role==='crew'))s.damageCargoUnit(c,u.id,0);s.systems.reportLoss(c,'Témoin');assert.ok(!A.cellAt(c.abandonedPosition.x,c.abandonedPosition.y)?.land);const before=JSON.stringify({workers:from.workers,guards:from.guardAvailable,stock:from.stock,money:from.treasury});assert.equal(s.systems.recover(c),null);assert.equal(JSON.stringify({workers:from.workers,guards:from.guardAvailable,stock:from.stock,money:from.treasury}),before);assert.equal(c.amount,10);assert.ok(!c.recoveryMission);
});
test('audit 8: insufficient labour never publishes or materialises a band departure',()=>{
 const {w,s,base}=unfundedBand();w.advance(720,()=>({temperature:15}));const band=Object.values(s.state.bands).find(b=>b.home===base.id);assert.ok(!band?.phase);assert.ok(!band?.peopleReserved);assert.equal(base.workers,0);assert.ok(!w.events.some(e=>e.home===base.id&&e.type==='band_movement'));
});
test('audit 15: a stranded convoy consumes finite carried supplies, persists hunger and loses actual people',()=>{
 const legacy=cargo();for(const key of ['rations','foodStores','water','suppliedAt'])delete legacy.c[key];legacy.s.catchUpCargo(legacy.c,3000);assert.ok(legacy.c.units.every(u=>u.hp===(u.role==='guard'?8:6)),'A legacy save cannot receive retroactive starvation damage');
 const {w,s,from,c}=cargo(),leg=c.path[c.leg],e=w.add('bridge',leg.road,480,0,{position:s.cargoPosition(c)});e.edge=leg.edge;w.revision++;const population=from.population,food=c.rations;assert.ok(food>0&&c.water>0);s.catchUpCargo(c,480+720);assert.ok(c.rations<food);const saved=JSON.parse(JSON.stringify(w.serialize())),copy=world(saved),copyCargo=copy.simulation.state.shipments.find(v=>v.id===c.id);assert.equal(copyCargo.rations,c.rations);assert.equal(copyCargo.water,c.water);
 s.catchUpCargo(c,480+30*1440);copy.simulation.catchUpCargo(copyCargo,480+30*1440);assert.deepEqual(c.units.map(u=>u.hp),copyCargo.units.map(u=>u.hp));assert.ok(c.units.every(u=>u.hp===0));assert.equal(from.population,population-4);assert.ok(c.rations>=0&&c.rations<food);assert.equal(c.water,0);assert.equal(c.amount,10);assert.ok(c.abandoned&&c.escortReturned);
});
test('audit 16: reserved band members are absent consumers only while actually away',()=>{
 const w=world(),s=w.simulation,site=s.state.sites.camp,need=s.systems.localNeeds(site).provisions;const b=s.state.bands.audit={home:site.id,peopleReserved:true,phase:'active',members:[0,1,2].map(i=>({id:'audit-'+i,hp:4,dead:false}))};site.workers-=3;assert.equal(s.systems.outsideCount(site),3);assert.equal(s.systems.localNeeds(site).provisions,need*(site.population-3)/site.population);b.members[0].dead=true;b.members[0].hp=0;assert.equal(s.systems.outsideCount(site),2);b.phase='home';assert.equal(s.systems.outsideCount(site),0);
});
test('audit 18: sharing a newer confirmation refreshes knowledge without reviving resolved information',()=>{
 const w=world(),s=w.simulation,n=A.byId.camp,e=w.add('bridge','camp',480,0);s.learn('listener',n.x,n.y,480);w.clock=2400;s.learn('witness',n.x,n.y,2400);w.share('witness','listener',2000);assert.equal(w.knowledge.listener[e.id].confirmed,480,'A historical arrival cannot carry a future confirmation');w.share('witness','listener',2400);assert.equal(w.knowledge.listener[e.id].confirmed,2400);assert.equal(w.news('listener',2400).find(n=>n.id===e.id).uncertain,false);w.resolve(e.id,2500);s.learn('listener',n.x,n.y,2500);w.share('witness','listener',2600);assert.equal(w.knowledge.listener[e.id].resolved,2500);
});
test('expedition subsistence keeps consuming during a band engagement and records its real losses',()=>{
 const {w,s,from,c}=cargo(),e=w.add('bandits',c.path[c.leg].road,480,0,{position:s.cargoPosition(c)}),b=s.state.bands.hungry={home:from.id,members:[0,1,2].map(i=>({id:'hungry-'+i,hp:4,dead:false}))};e.bandKey='hungry';s.systems.prepareBand(b,e);b.peopleReserved=true;from.workers-=3;b.engaged=b.physical=true;b.rations=b.water=0;const population=from.population;s.systems.stepBand(b,1440,1920);assert.ok(b.members.every(u=>u.dead&&u.hp===0));assert.equal(from.population,population-3);assert.equal(b.phase,'home');
});
test('an observed convoy still eats while its position is controlled by physical actors',()=>{
 const {w,s,c}=cargo();for(const site of new Set(Object.values(s.state.sites))){site.capacity={};site.needs={};site.distress=0;site.guardAvailable=0;}s.controlCargo(c.id,true);c.rations=c.water=0;const progress=c.progress;s.advance(480+1440,()=>({temperature:15}));assert.equal(c.progress,progress);assert.ok(c.units.every(u=>u.hp===0));
});
test('expedition stores preserve food types and refund only the unused quantities',()=>{
 const w=world(),s=w.simulation,site=s.state.sites.camp;for(const id of Object.keys(site.stock))site.stock[id]=0;site.needs={provisions:4,water:4};site.stock.grain=100;site.stock.water=30;const units=[{id:'a',hp:6},{id:'b',hp:6}],m={clock:480};s.systems.supplyExpedition(m,site,units,1440);assert.ok(m.rations>0&&m.foodStores.grain>0);assert.equal(site.stock.provisions,0);s.systems.consumeExpedition(m,1200,units,()=>assert.fail('Well supplied people must not be hurt'));s.systems.refundExpedition(m,site);assert.ok(Math.abs(site.stock.grain-98)<1e-8);assert.equal(site.stock.provisions,0);assert.ok(Math.abs(site.stock.water-27)<1e-8);
});
test('workshop input requirements fund continuing maintenance even when finished tools are in stock',()=>{
 const w=world(),s=w.simulation,site=s.state.sites['town-6'];site.stock.tools=4;const need=s.requirements(site);assert.ok(need.timber>=1,'Either tool recipe needs continuing timber supply');assert.ok(need.timber>site.needs.timber||!site.needs.timber);
});
