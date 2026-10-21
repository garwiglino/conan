'use strict';
const {test,before}=require('node:test'),assert=require('node:assert/strict'),{loadGame}=require('./game-harness.cjs'),programme=require('../data/architecture/city-plans/clairfoyer-life.json');
let api;before(async()=>{api=await loadGame();});
const tick=(g,n,count=1)=>{for(let i=0;i<count;i++){g.time+=.04;g.stepCityLife(n,.04);}};
test('every municipal activity has a reachable unique socket and a real nearby home, within the unchanged census',()=>{
 const g=new api.Game(),s=g.worldState.simulation.state.sites['town-1'],people=g.cityLifeDiagnostics();assert.equal(people.length,programme.people.length);assert.ok(people.every(n=>n.reachable),JSON.stringify(people.filter(n=>!n.reachable)));
 assert.equal(new Set(people.map(n=>n.home)).size,people.length);assert.equal(new Set(people.map(n=>n.district)).size,11);
 assert.equal(s.population,Math.ceil(g.settlements.sites.get('town-1').designPopulation/100));assert.ok(s.workers<=s.population);
 const fixtures=new Set();for(const n of g.npcs.filter(n=>n.cityLife)){const w=g.humanWorkstations.get(n.id);assert.ok(w.cityFixture);assert.ok(!fixtures.has(w.cityFixture));fixtures.add(w.cityFixture);assert.equal(w.district,people.find(p=>p.id===n.id).district);
  assert.ok(!g.solid(...w.feet,4,0));assert.ok(!g.solid(...w.approach,4,0));const r=s.workerRecords[n.id];assert.equal(r.cityService,true);assert.ok(r.service);}
 const traveller=g.npcs.find(n=>n.id==='resident-batracien-town-1-4');assert.ok(traveller.batracien.routine.kind==='road'&&!traveller.cityLife,'the intercity traveller keeps her real route');
});
test('all commutes avoid foundations and furniture, including the long resin-annex route along the city streets',()=>{
 const g=new api.Game();let longest=0,samples=0;for(const n of g.npcs.filter(n=>n.cityLife)){const path=n.cityLife.route.path;let distance=0;for(let i=1;i<path.length;i++){const a=path[i-1],b=path[i],d=Math.hypot(b.x-a.x,b.y-a.y);distance+=d;assert.ok(d<=192.001);assert.ok(g.npcSegmentFree(n,a,b),n.id+' blocked leg');for(let j=0;j<=Math.ceil(d/4);j++){const t=j/Math.max(1,Math.ceil(d/4));assert.equal(g.solid(a.x+(b.x-a.x)*t,a.y+(b.y-a.y)*t,4,0),false,n.id);samples++;}}longest=Math.max(longest,distance);}
 assert.ok(longest>1600);assert.ok(samples>500);
});
test('work follows real resource availability and never fabricates goods, food, patients or horses',()=>{
 const g=new api.Game(),n=g.npcs.find(n=>n.id==='resident-town-1-city-soins'),s=g.worldState.simulation.state.sites['town-1'];g.clock=10*60;
 s.stock.medicinal=0;const before=JSON.stringify(s.stock),horses=g.atlasProps.filter(p=>p.kind==='transport_horse').length;tick(g,n,40);assert.equal(n.cityLife.status,'waiting-for-resources');assert.equal(n.civilian.action,'idle');assert.equal(JSON.stringify(s.stock),before);
 s.stock.medicinal=2;tick(g,n);assert.equal(n.cityLife.status,'working');assert.equal(n.civilian.action,n.civilian.job);assert.equal(g.humanWorkSpec(n).action,'mortar');assert.equal(s.stock.medicinal,2);assert.equal(g.atlasProps.filter(p=>p.kind==='transport_horse').length,horses);
 assert.equal(g.humanWorkstations.get(n.id).id,'apothecary_table','preparation uses a real table, not an empty patient bed');
});
test('a resident actually walks home, rests inside after reaching the doorstep, and returns to work without teleporting',()=>{
 const g=new api.Game(),n=g.npcs.find(n=>n.id==='resident-town-1-city-comptes'),l=n.cityLife;g.clock=10*60;tick(g,n);g.clock=23*60;
 let before={x:n.x,y:n.y},moved=false;for(let i=0;i<3000&&!l.inside;i++){tick(g,n);const d=Math.hypot(n.x-before.x,n.y-before.y);assert.ok(d<=1.281);moved||=d>0;assert.equal(g.solid(n.x,n.y,4,0),false);before={x:n.x,y:n.y};}
 assert.ok(moved&&l.inside);assert.ok(Math.hypot(n.x-l.route.home.x,n.y-l.route.home.y)<1.5);assert.equal(n.alpha,0);assert.equal(g.npcPresent(n),false);g.syncLabourActors();assert.equal(g.worldState.simulation.state.sites[n.labourSite].workerRecords[n.id].onDuty,false);
 const saved=g.serialize(),h=new api.Game(saved),restored=h.npcs.find(v=>v.id===n.id);assert.equal(restored.cityLife.inside,true);assert.equal(restored.alpha,0);
 h.clock=10*60;for(let i=0;i<3000&&restored.cityLife.status!=='working';i++)tick(h,restored);assert.equal(restored.cityLife.status,'working');assert.ok(restored.alpha>.9);assert.ok(Math.hypot(restored.x-restored.post.x,restored.y-restored.post.y)<1.5);
});
test('death and recruitment remain authoritative across save restoration, without duplicate residents or population gains',()=>{
 const g=new api.Game(),n=g.npcs.find(n=>n.id==='resident-town-1-city-soins'),s=g.worldState.simulation.state.sites['town-1'];n.civilian.hp=0;n.civilian.dead=true;g.syncLabourActors();const population=s.population,workers=s.workers;
 const saved=g.serialize(),h=new api.Game(saved),dead=h.npcs.find(v=>v.id===n.id);assert.ok(dead.civilian.dead);assert.equal(dead.civilian.hp,0);assert.equal(h.worldState.simulation.state.sites['town-1'].population,population);assert.equal(h.worldState.simulation.state.sites['town-1'].workers,workers);
 const candidate=h.npcs.find(n=>n.id==='resident-town-1-city-comptes');assert.equal(h.recruitCompanion(candidate),true);const j=new api.Game(h.serialize());assert.ok(j.party.some(p=>p.id===candidate.id));assert.equal(j.npcs.filter(n=>n.id===candidate.id).length,1);assert.equal(j.cityLifeDiagnostics().length,programme.people.length);
});
test('a dismissed inhabitant returns from the arrival relay through the real city, preserving the route and workforce exclusion on reload',()=>{
 let g=new api.Game(),n=g.npcs.find(n=>n.id==='resident-town-1-city-comptes');g.dialogue=null;const id=n.id,site='town-1',workers=g.worldState.simulation.state.sites[site].workers;
 assert.ok(g.recruitCompanion(n));const arrival=api.Atlas.toGame(api.Atlas.byId[site].x,api.Atlas.byId[site].y);Object.assign(n,arrival);assert.ok(!g.solid(n.x,n.y,4,0));Object.assign(g.player,{x:n.x+16,y:n.y});assert.ok(g.dismissCompanion(id));g.player.x+=100000;
 const start={x:n.x,y:n.y};let restored=false;
 for(let i=0;i<250&&n.labourReturning;i++){
  g.clock+=10;g.time+=.04;g.stepLabourReturns(0);assert.equal(g.solid(n.x,n.y,4,0),false);
  if(i===8){const saved=g.serialize(),copy=new api.Game(saved),actor=copy.npcs.find(n=>n.id===id);assert.equal(actor.x,n.x);assert.equal(actor.y,n.y);assert.equal(copy.worldState.simulation.state.sites[site].workers,workers-1);g=copy;n=actor;restored=true;}
 }
 assert.ok(restored);assert.ok(Math.hypot(n.x-start.x,n.y-start.y)>1000);assert.equal(n.labourReturning,undefined);assert.equal(g.worldState.simulation.state.sites[site].workers,workers);assert.ok(Math.hypot(n.x-n.post.x,n.y-n.post.y)<=12);
});
test('batracien furniture contacts reuse the four native views and articulated hands without shifting the feet',()=>{
 const B=require('../sprites/batraciens/batraciens-complet'),P=require('../sprites/decors/postes-isometriques');
 for(const sex of ['male','female'])for(const dir of ['dos','droite','face','gauche'])for(const [action,id]of [['ledger','clerks_desk'],['net','rope_bench'],['weave','fiber_rack'],['pottery','potters_wheel']]){
  const socket=P.sockets(id).operator,target=[40+socket.contact[0]-socket.feet[0],52+socket.contact[1]-socket.feet[1]],frames=B.CLIPS[action].frames;
  for(let frame=0;frame<frames;frame++){const r=B.renderLayers({sex,dir,action,frame,interaction:{workTarget:target}});assert.deepEqual(r.metadata.rootMotion,[0,0]);assert.deepEqual(r.metadata.externalContact,target);assert.ok(r.metadata.hands.every(h=>h.every(Number.isFinite)));assert.ok(r.metadata.joints.length>0);}
 }
});
