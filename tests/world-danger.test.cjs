const {test,before}=require('node:test'),assert=require('node:assert/strict');
const {loadGame}=require('./game-harness.cjs');let a;before(async()=>a=await loadGame());
function fixture(){const g=new a.Game();g.clock=480;g.worldState=new a.Atlas.WorldState({clock:g.clock});g.enemies=[];g.lineClear=()=>true;return g;}
test('new campaign moves only the party to a safe camp spawn and loading keeps its actual player position',()=>{
 const g=new a.Game();assert.equal(g.player.y,952);assert.equal(g.escortActor.y,952);assert.equal(g.dangerAt(g.player.x,g.player.y).unsafe,false);assert.equal(g.localThreatAt(g.escortActor.x,g.escortActor.y),null);
 const snake=g.enemies.find(e=>e.id==='e1');assert.equal(snake.x,408);assert.equal(snake.y,744);
 g.player.x+=16;const save=g.serialize(),loaded=new a.Game(save);assert.equal(loaded.player.x,g.player.x);assert.equal(loaded.player.y,g.player.y);
});
test('incident policies alter only affected areas and settle or expire without clearing unrelated threats',()=>{
 const g=fixture(),A=a.Atlas,n=A.byId.camp,field=g.ensureDanger(),before=field.atPoint(n.x,n.y),far=field.atPoint(A.home.x,A.home.y);
 const siege=g.worldState.add('siege',n.id,g.clock,100),bandits=g.worldState.add('bandits',n.id,g.clock,200);
 assert.equal(field.atPoint(n.x,n.y).unsafe,true);assert.equal(field.atPoint(A.home.x,A.home.y).value,far.value);
 assert.equal(g.worldState.add('bandits',n.id,g.clock+1,200),bandits);
 g.worldState.add('truce',n.id,g.clock+2,100);g.clock+=2;assert.ok(!g.worldState.active(g.clock).includes(siege));assert.ok(g.worldState.active(g.clock).includes(bandits));
 g.clock=680;assert.equal(field.atPoint(n.x,n.y).hostility,before.hostility);assert.equal(field.atPoint(n.x,n.y).unsafe,false);
 for(let i=0;i<700;i++)field.atPoint(n.x+i,n.y);assert.ok(field.cache.size<=512);
});
test('an idle physical enemy threatens civilians immediately even without a world event, only locally and on the same level',()=>{
 const g=fixture(),n=g.stations.find(s=>s.site==='camp').actor;Object.assign(g.player,{x:n.x,y:n.y+16});
 const e=a.enemy('cultist',n.x+60,n.y,'local-test');g.enemies.push(e);
 assert.equal(g.dangerAt(n.x,n.y).unsafe,true);assert.equal(g.npcPresent(n),false);g.assessCivilians(true);assert.ok(n.dangerState);assert.equal(g.npcPresent(n),false);assert.equal(g.prepareTransport(n.id),false);assert.equal(g.canPlaceHostile({x:n.x+30,y:n.y}),false);
 assert.equal(g.dangerAt(n.x+2000,n.y).nearbyEnemy,undefined);e.level=1;assert.equal(g.localThreatAt(n.x,n.y),null);e.level=0;e.dead=true;assert.equal(g.localThreatAt(n.x,n.y),null);
});
test('an immediately adjacent enemy permits escape steps but not steps toward it; patrol strikes never use player bonuses',()=>{
 const g=fixture(),n=g.stations.find(s=>s.site==='camp').actor,e=a.enemy('cultist',n.x+30,n.y,'wild-test');e.world=true;g.enemies=[e];g.solid=()=>false;
 assert.equal(g.civilianStepSafe(n,n.x-8,n.y),true);assert.equal(g.civilianStepSafe(n,n.x+8,n.y),false);
 const kills=g.player.kills,xp=g.player.xp;g.player.riposte=1;g.guardStrike(n,e);assert.equal(g.player.riposte,1);e.hp=1;g.guardStrike(n,e);assert.equal(e.dead,true);assert.equal(g.atlasDeaths[e.id],true);assert.equal(g.player.kills,kills);assert.equal(g.player.xp,xp);
});
test('civilians withdraw, remain absent, survive reload and return only after an actual calm interval',()=>{
 const g=fixture(),n=g.stations.find(s=>s.site==='camp').actor,home={x:n.x,y:n.y};g.solid=()=>false;
 const event=g.worldState.add('siege','camp',g.clock,100);g.assessCivilians(true);assert.ok(n.dangerState);
 Object.assign(n,n.dangerState.shelter);for(let i=0;i<50;i++){g.time+=.04;g.stepNpcs(.04);}assert.equal(n.dangerState.mode,'sheltered');assert.equal(n.alpha,0);
 const save=JSON.parse(JSON.stringify(g.serialize())),restored=new a.Game(save),rn=restored.npcs.find(v=>v.id===n.id);assert.equal(rn.dangerState.mode,'sheltered');assert.equal(rn.alpha,0);
 g.worldState.resolve(event.id,g.clock);g.assessCivilians(true);assert.equal(n.dangerState.mode,'sheltered');g.clock+=9;g.assessCivilians(true);assert.equal(n.dangerState.mode,'sheltered');g.clock+=2;g.assessCivilians(true);assert.equal(n.dangerState.mode,'returning');Object.assign(n,home);g.stepNpcs(.04);assert.equal(n.dangerState,undefined);assert.equal(g.npcPresent(n),true);
});
test('companions never disappear, hidden civilians do not block and blocked shelters never teleport a visible civilian',()=>{
 const g=fixture(),n=g.npcs.find(n=>n.id==='zahra');g.recruitCompanion(n);g.worldState.add('siege','camp',g.clock,100);g.assessCivilians(true);assert.equal(n.dangerState,undefined);
 const c=g.stations.find(s=>s.site==='camp').actor;g.assessCivilians(true);const p={x:c.x,y:c.y};g.solid=()=>true;c.dangerState.shelter={x:c.x+48,y:c.y};for(let i=0;i<100;i++){g.time+=.04;g.stepNpcs(.04);}assert.equal(c.x,p.x);assert.equal(c.y,p.y);assert.ok(c.dangerState);assert.ok(c.alpha>0);
});
test('event groups respect civilian placement, keep deaths and health, and resolve only after every member is defeated',()=>{
 const g=fixture(),n=a.Atlas.byId.camp,centre=a.Atlas.toGame(n.x,n.y);g.solid=()=>false;g.inSafe=()=>null;
 const ev=g.worldState.add('bandits',n.id,g.clock,100);Object.assign(g.player,{x:centre.x+500,y:centre.y+500});g.stepEventGroups(1);
 const foes=g.enemies.filter(e=>e.eventId===ev.id);assert.equal(foes.length,3);for(const e of foes)assert.equal(g.canPlaceHostile(e),true);
 g.damageEnemy(foes[0],1);const hp=foes[0].hp,save=g.serialize(),copy=new a.Game(save);assert.equal(copy.incidentHealth[foes[0].id],hp);
 for(const e of foes)g.damageEnemy(e,100);assert.ok(!g.worldState.active(g.clock).some(e=>e.id===ev.id));g.stepEventGroups(1);assert.equal(g.enemies.filter(e=>e.eventId===ev.id&&!e.dead).length,0);
});
test('a real hostile incident refuses departure without charging and can stop an already-running transport',()=>{
 const g=fixture(),station=g.stations.find(s=>s.site==='camp');Object.assign(g.player,{x:station.actor.x,y:station.actor.y+16,coins:5000});assert.ok(g.prepareTransport(station.id));
 const plan=g.planJourney(a.Atlas.home.id,{mode:'horse'}),leg=plan.stages.find(s=>s.kind==='move'),money=g.player.coins;
 const ev=g.worldState.add('bandits',leg.road,g.clock,600);assert.equal(g.startJourney(plan),false);assert.equal(g.player.coins,money);
 g.worldState.resolve(ev.id,g.clock);assert.ok(g.startJourney(plan));const paid=g.player.coins;g.worldState.add('bandits',leg.road,g.clock,600);g.stepJourney(.04);assert.equal(g.journey,null);assert.equal(g.player.coins,paid);
});
test('snow announcements follow actual precipitation, and incomplete legacy saves remain loadable',()=>{
 const A=a.Atlas,snow=new A.WorldState({clock:0}),rain=new A.WorldState({clock:0});snow.advance(360,()=>({snow:.8,rain:0}));rain.advance(360,()=>({snow:0,rain:.8}));assert.ok(snow.events.some(e=>e.type==='snow'));assert.ok(!snow.events.some(e=>e.type==='rain'));assert.ok(rain.events.some(e=>e.type==='rain'));
 const g=fixture(),save=g.serialize();save.atlas.danger={civilians:[{id:'relay-camp',mode:'sheltered',x:NaN}],health:{fake:Infinity}};const restored=new a.Game(save);assert.equal(restored.npcs.find(n=>n.id==='relay-camp').dangerState,undefined);
});
