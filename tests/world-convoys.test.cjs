// Codex / ChatGPT — authoritative cargo and its temporary on-screen roster.
const {test,before}=require('node:test'),assert=require('node:assert/strict');
const {loadGame}=require('./game-harness.cjs');let a;before(async()=>a=await loadGame());
function stage(){
 const g=new a.Game();g.clock=480;g.worldState=new a.Atlas.WorldState({clock:480});g.atlasLastClock=480;g.npcs=[];g.atlasNpcs=[];g.enemies=[];g.solid=()=>false;g.lineClear=()=>true;g.dangerAt=()=>({unsafe:false});g.populateAtlas=()=>{};
 const s=g.worldState.simulation,sites=Object.values(s.state.sites);let pair;
 for(const from of sites){for(const to of sites){if(from===to)continue;const path=a.Atlas.findPath(from.id,to.id,{mode:'cart',allowBoat:true,state:g.worldState});if(path?.length&&path.every(l=>l.mode!=='boat')&&path.reduce((n,l)=>n+l.length,0)<1500){pair=[from,to];break;}}if(pair)break;}
 assert.ok(pair);const [from,to]=pair;from.stock.cloth=100;from.stock.provisions=100;from.treasury=100;to.treasury=100;const c=s.addShipment(from.id,to.id,'cloth',10);assert.ok(c);c.progress=Math.min(1,c.path[0].length/s.cargoRate(c,c.path[0])/2);
 const p=g.convoyPosition(c);Object.assign(g.player,{x:p.x+100,y:p.y,level:0});g.syncWorldConvoys();return {g,s,c,from,to};
}
test('one reserved cargo materialises as two carriers and two guards; walking advances the same cargo',()=>{
 const {g,s,c}=stage(),actors=g.convoyActors(c);assert.equal(actors.length,4);assert.equal(actors.filter(n=>n.convoyGuard).length,2);
 const start=g.convoyPosition(c),progress=c.progress;g.clock+=.016;g.stepWorldConvoys(.04);const end=g.convoyPosition(c),distance=Math.hypot(end.x-start.x,end.y-start.y);
 assert.ok(distance>0&&distance<=1.3,'32 px/s carrier pace');assert.ok(c.progress>progress);assert.equal(s.cargoUnits(c).length,4);
 const held=c.progress;s.advance(g.clock+60);assert.equal(c.progress,held,'hourly simulation cannot advance an on-screen wagon behind its actors');
});
test('a visible threat stops the wagon and escort can target it; removing the threat resumes movement',()=>{
 const {g,c}=stage(),p=g.convoyPosition(c),guard=g.convoyActors(c).find(n=>n.convoyGuard),enemy={id:'convoy-threat',x:p.x+60,y:p.y,level:0,world:true,hp:5};g.enemies=[enemy];const before=c.progress;
 g.stepWorldConvoys(.04);assert.equal(c.progress,before);assert.equal(g.humanGuardTarget(guard,g.ensureHumanGuard(guard)),enemy);
 g.enemies=[];g.stepWorldConvoys(.04);assert.ok(c.progress>before);
});
test('dead carriers abandon the shipment, saved casualties never regenerate or deliver goods',()=>{
 const {g,s,c,from}=stage(),units=s.cargoUnits(c),pool=from.guardPool,guard=units.find(u=>u.role==='guard');s.damageCargoUnit(c,guard.id,0);s.damageCargoUnit(c,guard.id,0);assert.equal(from.guardPool,pool-1);
 for(const u of units.filter(u=>u.role==='crew'))s.damageCargoUnit(c,u.id,0);assert.equal(c.status,'abandoned');
 const copy=new a.Atlas.WorldState(JSON.parse(JSON.stringify(g.worldState.serialize()))),saved=copy.simulation.state.shipments.find(x=>x.id===c.id);copy.advance(copy.clock+1440);assert.equal(saved.status,'abandoned');assert.equal(saved.delivered,false);assert.equal(copy.simulation.cargoUnits(saved).filter(u=>u.hp>0).length,1);
});
test('near/far handoff has one position, catches up between hourly ticks and preserves survivors',()=>{
 const {g,s,c}=stage();g.stepWorldConvoys(.04);const actors=g.convoyActors(c),guard=actors.find(n=>n.convoyGuard),crew=actors.find(n=>!n.convoyGuard);g.damageHumanGuard(guard,2,{x:guard.x+1,y:guard.y,level:0});g.damageCivilian(crew,1,{x:crew.x+1,y:crew.y,level:0});
 const health=s.cargoUnits(c).map(u=>[u.id,u.hp]),position=g.convoyPosition(c),progress=c.progress;Object.assign(g.player,{x:position.x+3000,y:position.y});for(const n of actors){n.hurt=0;delete n.dangerState;}g.syncWorldConvoys();assert.equal(g.convoyActors(c).length,0);assert.equal(c.progress,progress);
 g.clock+=1;g.worldState.clock=g.clock;g.syncWorldConvoys();assert.ok(c.progress>progress,'distant cargo advances even between hourly ticks');assert.deepEqual(s.cargoUnits(c).map(u=>[u.id,u.hp]),health);
 const expected=g.convoyPosition(c);Object.assign(g.player,{x:expected.x+100,y:expected.y});g.syncWorldConvoys();assert.equal(g.convoyActors(c).length,4);assert.ok(Math.hypot(g.convoyPosition(c).x-expected.x,g.convoyPosition(c).y-expected.y)<.01);g.syncWorldConvoys();assert.equal(g.convoyActors(c).length,4,'no duplicate roster');assert.deepEqual(s.cargoUnits(c).map(u=>[u.id,u.hp]),health);
});
test('a full Game save restores the nearby convoy without resurrecting guards or losing wounds',()=>{
 const {g,s,c}=stage(),actors=g.convoyActors(c),guard=actors.find(n=>n.convoyGuard),crew=actors.find(n=>!n.convoyGuard);g.damageHumanGuard(guard,100,{x:guard.x+1,y:guard.y,level:0});g.damageCivilian(crew,1,{x:crew.x+1,y:crew.y,level:0});const hp=crew.civilian.hp;
 const copy=new a.Game(JSON.parse(JSON.stringify(g.serialize()))),saved=copy.worldState.simulation.state.shipments.find(x=>x.id===c.id);copy.solid=()=>false;copy.syncWorldConvoys();assert.equal(copy.convoyActors(saved).length,3);assert.equal(copy.convoyActors(saved).find(n=>n.id===crew.id).civilian.hp,hp);assert.equal(copy.convoyActors(saved).some(n=>n.id===guard.id),false);assert.equal(copy.worldState.simulation.cargoUnits(saved).find(u=>u.id===guard.id).hp,0);
});
test('a blocked local road prevents progress until repaired; solid terrain prevents physical movement',()=>{
 const {g,c}=stage(),leg=c.path[c.leg],p=g.worldState.add('bridge',leg.road,g.clock,0);p.edge=leg.edge;const start=c.progress;g.stepWorldConvoys(.04);assert.equal(c.progress,start);g.worldState.resolve(p.id,g.clock);g.stepWorldConvoys(.04);assert.ok(c.progress>start);const held=c.progress;g.solid=()=>true;g.stepWorldConvoys(.04);assert.equal(c.progress,held);
});
test('sea embarkation unloads foot actors and landing restores only the surviving roster',()=>{
 const {g,s,c}=stage(),land=c.path.map(l=>({...l})),sea=[...a.Atlas.edgeById.values()].find(e=>e.modes.includes('boat'));assert.ok(sea);const guard=g.convoyActors(c).find(n=>n.convoyGuard);g.damageHumanGuard(guard,100,{x:guard.x+1,y:guard.y,level:0});
 c.path=[{edge:sea.id,road:sea.roads[0],from:sea.a,to:sea.b,length:sea.length,mode:'boat'}];c.leg=0;c.progress=0;g.syncWorldConvoys();assert.equal(g.convoyActors(c).length,0,'no carrier walks across the sea');assert.equal(s.cargoUnits(c).find(u=>u.id===guard.id).hp,0);
 c.path=land;c.leg=0;c.progress=0;delete c.localPosition;const p=g.convoyPosition(c);Object.assign(g.player,{x:p.x+100,y:p.y});g.syncWorldConvoys();assert.equal(g.convoyActors(c).length,3);assert.equal(g.convoyActors(c).some(n=>n.id===guard.id),false);
});
test('walking away or saving during an ambush cannot turn a suspended fight into a delivered shipment',()=>{
 const {g,s,c}=stage(),p=g.convoyPosition(c);g.enemies=[{id:'ambusher',x:p.x+60,y:p.y,level:0,world:true,hp:5}];g.stepWorldConvoys(.04);assert.equal(c.encounter,true);const before=c.progress;
 Object.assign(g.player,{x:p.x+3000,y:p.y});g.syncWorldConvoys();assert.equal(g.convoyActors(c).length,0);g.clock+=60;g.worldState.clock=g.clock;g.syncWorldConvoys();assert.equal(c.progress,before);assert.equal(c.delivered,false);
 const copy=new a.Atlas.WorldState(JSON.parse(JSON.stringify(g.worldState.serialize()))),saved=copy.simulation.state.shipments.find(x=>x.id===c.id);copy.advance(copy.clock+600);assert.equal(saved.progress,before);assert.equal(saved.delivered,false);
 g.enemies=[];Object.assign(g.player,{x:p.x+100,y:p.y});g.syncWorldConvoys();g.stepWorldConvoys(.04);assert.ok(c.progress>before);assert.equal(c.encounter,undefined);
});
