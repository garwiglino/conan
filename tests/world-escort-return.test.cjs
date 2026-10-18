const {test}=require('node:test'),assert=require('node:assert/strict');
const A=require('../scripts/world-model.js')(require('../data/world/atlas.json')),create=require('../scripts/world-simulation.js');
const B=Object.fromEntries(['resources','settlements','regions','relations','routes','networks'].map(n=>[n,require('../data/world/bible/generated/'+n+'.json')]));
function world(saved){const w=new A.WorldState(saved||{clock:480});w.simulation=create(A,B,w,saved?.simulation);return w;}
function fixture(){const w=world(),s=w.simulation,sites=[...new Set(Object.values(s.state.sites))];for(const from of sites)for(const to of sites){if(from===to)continue;const path=A.findPath(from.id,to.id,{mode:'cart',allowBoat:true,state:w});if(!path?.length||path.some(p=>p.mode==='boat')||path.reduce((n,p)=>n+p.length,0)>1500||!path.some(p=>p.length>20))continue;from.stock.cloth=100;from.stock.provisions=100;from.treasury=to.treasury=100;const c=s.addShipment(from.id,to.id,'cloth',10);c.leg=c.path.findIndex(p=>p.length>20);c.progress=c.path[c.leg].length/s.cargoRate(c,c.path[c.leg])/2;return {w,s,c,from,to};}throw Error('No short land route');}
function killCrew(s,c){for(const u of s.cargoUnits(c).filter(u=>u.role==='crew'))s.damageCargoUnit(c,u.id,0);}
function catchUp(w,c,at){w.clock=at;w.simulation.catchUpCargo(c,at);}
test('orphan escorts retrace their actual route, obey closures and return wounded personnel once without moving goods',()=>{
 const {w,s,c,from,to}=fixture(),position=s.cargoPosition(c),guards=s.cargoUnits(c).filter(u=>u.role==='guard'),available=from.guardAvailable,workers=from.workers,stock=to.stock.cloth;
 s.damageCargoUnit(c,guards[0].id,3);s.damageCargoUnit(c,guards[1].id,0);killCrew(s,c);assert.equal(c.status,'abandoned');s.stepCargo(c,0,w.clock);assert.equal(c.status,'returning');assert.ok(Math.hypot(s.cargoPosition(c).x-position.x,s.cargoPosition(c).y-position.y)<1e-7);assert.deepEqual(c.abandonedPosition,position);
 const leg=c.path[0],e=w.add('bridge',leg.road,w.clock,0);e.edge=leg.edge;catchUp(w,c,600);assert.equal(from.guardAvailable,available);assert.equal(c.escortReturned,undefined);assert.equal(c.waiting,leg.edge);
 w.resolve(e.id,w.clock);catchUp(w,c,3000);assert.equal(c.status,'abandoned');assert.equal(c.escortReturned,true);assert.equal(c.delivered,false);assert.equal(to.stock.cloth,stock);assert.equal(c.amount,10);assert.equal(from.workers,workers);assert.equal(from.guardAvailable,available+1);assert.equal(guards[0].hp,3);assert.equal(guards[1].hp,0);assert.deepEqual(c.abandonedPosition,position);
 catchUp(w,c,4000);assert.equal(from.guardAvailable,available+1);assert.equal(s.state.history.filter(e=>e.type==='cargo_crew_return'&&e.id===c.id).length,1);
});
test('orphan return keeps the same arrival time through saves and differently partitioned catch-up',()=>{
 const {w,s,c}=fixture();killCrew(s,c);s.stepCargo(c,0,w.clock);const data=w.serialize(),one=world(data),many=world(data),a=one.simulation.state.shipments[0],b=many.simulation.state.shipments[0];catchUp(one,a,2000);
 for(let at=481;at<=2000;at++)catchUp(many,b,at);assert.equal(a.escortReturned,true);assert.equal(b.escortReturned,true);assert.deepEqual({...a,clock:0},{...b,clock:0});assert.ok(Math.abs(a.clock-b.clock)<1e-8);assert.ok(Math.abs(one.simulation.state.history.find(e=>e.type==='cargo_crew_return').at-many.simulation.state.history.find(e=>e.type==='cargo_crew_return').at)<1e-8);
 const copy=world(many.serialize()),saved=copy.simulation.state.shipments[0],available=copy.simulation.state.sites[c.from].guardAvailable;catchUp(copy,saved,4000);assert.equal(copy.simulation.state.sites[c.from].guardAvailable,available);assert.deepEqual(saved.abandonedPosition,c.abandonedPosition);
});
test('guards losing their carriers after delivery continue home without another delivery or abandonment',()=>{
 const {w,s,c,from,to}=fixture();c.leg=0;c.progress=0;const duration=c.path.reduce((n,p)=>n+p.length/s.cargoRate(c,p),0);catchUp(w,c,480+duration+1);assert.equal(c.delivered,true);const stock=to.stock.cloth,available=from.guardAvailable;killCrew(s,c);catchUp(w,c,w.clock+2000);assert.equal(c.status,'delivered');assert.equal(c.escortReturned,true);assert.equal(c.abandoned,undefined);assert.equal(from.guardAvailable,available+2);assert.equal(to.stock.cloth,stock);
});
test('an escort killed during its retreat cannot return personnel or occupy an active contract forever',()=>{
 const {w,s,c,from}=fixture(),available=from.guardAvailable;killCrew(s,c);s.stepCargo(c,0,w.clock);for(const u of s.cargoUnits(c).filter(u=>u.role==='guard'))s.damageCargoUnit(c,u.id,0);const e=w.add('bridge',c.path[0].road,w.clock,0);e.edge=c.path[0].edge;catchUp(w,c,1000);assert.equal(c.status,'abandoned');assert.equal(c.escortReturned,true);assert.equal(from.guardAvailable,available);assert.equal(c.guardReserved,false);assert.equal(c.staffReserved,false);
});
