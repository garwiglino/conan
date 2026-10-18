const {test}=require('node:test'),assert=require('node:assert/strict');
const A=require('../scripts/world-model.js')(require('../data/world/atlas.json'));
const create=require('../scripts/world-simulation.js'),pacing=require('../scripts/world-pacing.js');
const load=n=>require('../data/world/bible/generated/'+n+'.json');
const B=Object.fromEntries(['resources','settlements','regions','relations','routes','networks'].map(n=>[n,load(n)]));
function world(saved){const w=new A.WorldState(saved||{clock:480});w.simulation=create(A,B,w,saved?.simulation);return w;}
function pair(w){const sites=Object.values(w.simulation.state.sites);for(const a of sites)for(const b of sites){if(a===b)continue;const p=A.findPath(a.id,b.id,{mode:'cart',allowBoat:true,state:w});if(p?.length&&p.reduce((n,e)=>n+e.length,0)<1500)return [a,b];}throw Error('No short trading route');}
test('manual walking and itinerary use one world-time conversion',()=>{
 assert.equal(pacing.dayRealSeconds,3600);assert.equal(A.modes.foot.metresPerMinute,pacing.playerWalk/pacing.pixelsPerMetre*pacing.dayRealSeconds/1440);
});
test('active incidents and the 181st resident memory survive arbitrary history growth',()=>{
 const w=world(),e=w.add('bridge','camp',480,2);for(let i=0;i<600;i++)w.add('injury','camp',480+i,0,{witnesses:['resident-'+i]});
 w.knowledge['resident-181']={[e.id]:{heard:480,at:480,resolved:null,source:'Voisin'}};
 const copy=world(w.serialize());assert.ok(copy.events.some(x=>x.id===e.id));assert.ok(copy.knowledge['resident-181'][e.id]);assert.equal(copy.events.length,601);
});
test('purchases and dispatch reserve finite stock, money and workers atomically',()=>{
 const w=world(),s=w.simulation,[a,b]=pair(w);a.stock.provisions=a.needs.provisions*a.reserveDays+100;b.treasury=1000;const workers=a.workers,coins=b.treasury,initial=a.stock.provisions;
 assert.equal(s.purchase(a.id,initial+1,0),false);assert.equal(a.stock.provisions,initial);assert.equal(s.purchase(a.id,2,1),true);
 const c=s.addShipment(a.id,b.id,'provisions',20);assert.ok(c);assert.equal(a.stock.provisions,initial-22);assert.equal(a.workers,workers-2);assert.equal(b.treasury,coins-c.paid);assert.equal(c.amount,20);
 assert.equal(s.addShipment(a.id,b.id,'provisions',NaN),null);assert.equal(s.addShipment(a.id,b.id,'not-a-resource',20),null);
});
test('damage cannot expire into a magically repaired bridge without materials',()=>{
 const w=world(),s=w.simulation,e=w.add('bridge','camp',480,60),work=s.state.works.find(x=>x.event===e.id),site=s.state.sites[work.site];
 for(const x of Object.values(s.state.sites)){x.capacity={};x.needs={};x.treasury=0;}site.stock.timber=0;site.stock.tools=0;
 w.advance(480+4000);assert.equal(e.end,null);assert.equal(e.resolved,null);assert.equal(work.paid,false);
 site.stock.timber=6;site.stock.tools=1;site.treasury=100;const workers=site.workers;w.advance(w.clock+60);assert.equal(work.paid,true);assert.equal(site.workers,workers-2);
 w.advance(w.clock+3000);assert.ok(e.resolved);assert.equal(work.status,'completed');assert.equal(site.workers,workers);
});
test('a full store does not destroy ingredients while attempting production',()=>{
 const w=world(),s=w.simulation,site=Object.values(s.state.sites)[0];site.capacity={provisions:100};site.needs={};site.distress=0;site.stock.provisions=3000;site.stock.grain=10;
 // Remove spoilage from the conservation assertion, not from the simulation.
 const grain=load('resources').find(r=>r.id==='grain');w.advance(540);
 assert.ok(site.stock.grain>=10-10/24/grain.storageDays*.1-.00001);
});
test('split advances, a long advance, and a save halfway have identical campaign state',()=>{
 const initial=world().serialize(),a=world(initial),b=world(initial);a.advance(480+1440*4);
 for(let clock=497;clock<480+1440*4;clock+=17)b.advance(clock);b.advance(480+1440*4);
 assert.deepEqual(b.simulation.serialize(),a.simulation.serialize());assert.deepEqual(b.events,a.events);
 let c=world(initial);c.advance(480+1440*2);c=world(c.serialize());c.advance(480+1440*4);
 assert.deepEqual(c.simulation.serialize(),a.simulation.serialize());assert.deepEqual(c.events,a.events);
});
test('remote news does not propagate by distance alone and resolutions do not become omniscient',()=>{
 const w=world(),s=w.simulation,[a,b]=pair(w),na=A.byId[a.id],nb=A.byId[b.id];const e=w.add('bridge',a.id,480,0);
 s.learn('at-origin',na.x,na.y,480);s.learn('remote',nb.x,nb.y,480);assert.ok(w.knowledge['at-origin'][e.id]);assert.equal(w.knowledge.remote[e.id],undefined);
 s.state.channels[b.id]={[e.id]:{heard:480,at:480,resolved:null,source:'Voyageur'}};w.resolve(e.id,500);s.learn('remote',nb.x,nb.y,510);assert.equal(w.knowledge.remote[e.id].resolved,null);
});
test('floodwater stays high in sustained rain and recedes only in dry conditions',()=>{
 const w=world(),road=A.roads.find(r=>r.type==='roads'),e=w.add('flood',road.id,480,60);w.advance(480+720,()=>({rain:1}));assert.equal(e.end,null);assert.equal(e.resolved,null);assert.ok(e.waterLevel>1);
 w.advance(w.clock+900,()=>({rain:0}));assert.ok(e.resolved);assert.ok(!w.events.some(x=>x.type==='repair'&&x.target===road.id),'subsiding water does not repair structural damage');
});
test('delivery occurs exactly once; a closed return road keeps workers away rather than teleporting them home',()=>{
 const w=world(),s=w.simulation,[a,b]=pair(w);for(const site of Object.values(s.state.sites)){site.capacity={};site.needs={};site.treasury=0;for(const id of Object.keys(site.stock))site.stock[id]=0;}a.stock.cloth=100;b.treasury=100;const workers=a.workers,c=s.addShipment(a.id,b.id,'cloth',10),initial=b.stock.cloth;
 assert.ok(c);while(!c.delivered&&w.clock<1080)w.advance(w.clock+60);assert.ok(c.delivered);assert.equal(c.status,'returning');const leg=c.path[0],from=A.vertices.get(leg.from),to=A.vertices.get(leg.to),e=w.add('bridge',leg.road,w.clock,0,{position:{x:(from[0]+to[0])/2,y:(from[1]+to[1])/2}});e.edge=leg.edge;
 w.advance(w.clock+600);assert.equal(a.workers,workers-2);assert.equal(c.status,'returning');
 const copy=world(w.serialize());copy.resolve(e.id,copy.clock);copy.advance(copy.clock+600);assert.equal(copy.simulation.state.history.filter(h=>h.type==='cargo_delivered'&&h.id===c.id).length,1);assert.ok(b.stock.cloth>initial);
 assert.equal(copy.simulation.state.sites[a.id].workers,workers,'the physically completed return releases the crew');
});
test('a saved active crisis keeps its original publication time',()=>{
 const w=world(),e=w.add('shortage','camp',480,0);w.simulation.state.channels.camp[e.id].heard=481;w.clock=500;w.simulation.state.clock=500;const copy=world(w.serialize());assert.equal(copy.simulation.state.channels.camp[e.id].heard,481);
});
test('negative or nonfinite purchases cannot create goods',()=>{
 const w=world(),s=w.simulation,site=Object.values(s.state.sites)[0],before=JSON.stringify(site.stock);for(const [f,h]of [[-1,0],[0,-1],[NaN,0],[0,Infinity]])assert.equal(s.purchase(site.id,f,h),false);assert.equal(JSON.stringify(site.stock),before);
});
test('separate damage on one road keeps separate identities and a local repair cannot resolve the other',()=>{
 const w=world(),road=A.roads.find(r=>r.type==='roads'&&r.length>200),first=A.atDistance(road,20),last=A.atDistance(road,road.length-20),a=w.add('bridge',road.id,480,0,{position:first}),b=w.add('bridge',road.id,480,0,{position:last});assert.notEqual(a.id,b.id);
 w.add('repair',road.id,500,600,{position:a});assert.equal(a.resolved,500);assert.equal(b.resolved,null);
});
test('thirty quiet days retain finite nonnegative stocks without an artificial universal famine',()=>{
 const w=world();w.advance(480+30*1440);const food=['provisions','grain','legumes','rice','tubers','dates','fish','meat'];let hungry=0;
 for(const s of Object.values(w.simulation.state.sites)){for(const n of Object.values(s.stock))assert.ok(Number.isFinite(n)&&n>=0);assert.ok(s.workers>=0&&s.workers<=s.population);assert.ok(s.guardAvailable>=0&&s.guardAvailable<=s.guardPool);if(food.reduce((n,k)=>n+s.stock[k],0)<1)hungry++;}
 assert.ok(hungry<10,'export specialisation must not erase domestic food production');assert.ok(w.simulation.state.shipments.some(c=>c.delivered));
});
