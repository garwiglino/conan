const {test,before}=require('node:test'),assert=require('node:assert/strict');
const {loadGame}=require('./game-harness.cjs');let a;before(async()=>a=await loadGame());
function game(){const g=new a.Game();g.enemies=[];g.solid=()=>false;g.lineClear=()=>true;g.worldStore.readFor=()=>null;g.populateAtlas=()=>{};g.dangerAt=()=>({unsafe:false});return g;}
function traveller(g){const A=a.Atlas,road=A.roads.find(r=>r.type==='roads'&&r.segments[0].length*16>2048),p=A.toGame(...road.segments[0].a);Object.assign(g.player,p);const n=g.roadTrafficSpawn(road,0,0,0);assert.ok(n);return {n,road};}
function save(g){return JSON.parse(JSON.stringify(g.serialize()));}
test('nearby road travellers and recruited/downed travellers retain identity and membership',()=>{
 const g=game(),{n}=traveller(g);Object.assign(g.player,{x:n.x-50,y:n.y});n.civilian.hp=3;let data=save(g),copy=new a.Game(data),actor=copy.npcs.find(a=>a.id===n.id);assert.ok(actor,'minimum new-spawn distance must not discard an existing neighbour');assert.equal(actor.civilian.hp,3);
 assert.ok(g.recruitCompanion(n));const c=g.party.find(c=>c.id===n.id);c.hp=0;c.down=true;n.civilian.hp=0;
 data=save(g);copy=new a.Game(data);assert.ok(copy.npcs.find(a=>a.id===n.id));assert.equal(copy.party.find(c=>c.id===n.id)?.down,true);assert.equal(copy.party.find(c=>c.id===n.id)?.hp,0);
});
test('patrol health, hostility and death do not reset on reload',()=>{
 const g=game(),A=a.Atlas,road=A.roads.find(r=>r.type==='roads'),e=g.worldState.add('patrol',road.id,g.clock,600),p=A.toGame(e.x,e.y);Object.assign(g.player,{x:p.x+420,y:p.y});g.stepEventGroups(0);
 const n=g.npcs.find(n=>n.eventId===e.id);assert.ok(n);const s=g.ensureHumanGuard(n);s.hp=3;s.hostileUntil=g.clock+100;const copy=new a.Game(save(g));copy.solid=()=>false;copy.enemies=[];copy.stepEventGroups(0);const guard=copy.npcs.find(a=>a.id===n.id);assert.ok(guard);assert.equal(copy.ensureHumanGuard(guard).hp,3);assert.equal(guard.guardState.hostileUntil,s.hostileUntil);
 g.damageHumanGuard(n,100,{x:n.x-12,y:n.y,level:0,id:'foe'});const deadSave=save(g);assert.equal(deadSave.atlas.society.guards.find(r=>r.id===n.id).hp,0);assert.ok(deadSave.atlas.deaths[n.id]);
});
test('essential injuries stop work and travel, persist, and use an existing resident for relief',()=>{
 const g=game(),station=g.stations.find(st=>g.npcs.some(n=>n.resident&&!n.batracien&&n.site===st.site)),n=station.actor;g.ensureCivilian(n);Object.assign(g.player,{x:n.x-20,y:n.y});
 assert.ok(g.damageCivilian(n,100,{x:n.x-10,y:n.y,level:0,id:'foe'}));assert.equal(n.civilian.critical,true);const pos={x:n.x,y:n.y};g.walkNpc(n,{x:n.x+50,y:n.y},1);assert.equal(n.x,pos.x);g.time+=1;g.stepCivilianAnimations(.04);assert.equal(n.civilian.action,'cower');assert.equal(g.npcPresent(n),false);
 const copy=new a.Game(save(g));assert.equal(copy.npcs.find(a=>a.id===n.id).civilian.critical,true);
 g.clock+=361;g.advanceAtlas(0);assert.equal(station.originalActor,n);assert.notEqual(station.actor,n);assert.ok(station.actor.resident);assert.ok(station.actor.reliefPost);assert.ok(!g.recruitCompanion(station.actor));
 const restored=new a.Game(save(g)),st=restored.stations.find(a=>a.site===station.site);assert.equal(st.originalActor.id,n.id);assert.equal(st.actor.id,station.actor.id);
});
test('off-screen road travellers progress at the civilian pace without crossing closed edges',()=>{
 const g=game(),{n,road}=traveller(g),r=save(g).atlas.society.traffic.find(r=>r.id===n.id);g.npcs=g.npcs.filter(a=>a!==n);g.ensureWorldSociety().records.set(n.id,r);g.player.x=n.x+10000;g.player.y=n.y+10000;const before=r.progress;g.clock+=1;g.advanceDistantRoadTraffic();assert.ok(Math.abs(r.progress-before-80*(n.label==='MARCHAND'?.85:1))<.001);
 const ev=g.worldState.add('bridge',road.id,g.clock,0,{position:a.Atlas.toWorld(r.x,r.y)}),at=r.progress;g.clock+=10;g.advanceDistantRoadTraffic();assert.equal(r.progress,at);assert.equal(r.clock,g.clock);assert.equal(ev.end,null);
});
test('dehydration and every death record survive reload, including beyond the former 5000 cap',()=>{
 const g=game();g.supplies.water=0;g.needs.dehydrated=170;const hp=g.player.hp;g.advanceNeeds(20);assert.ok(Math.abs(g.player.hp-(hp-10/240))<1e-8,'only the minutes beyond the thirst threshold cause damage');g.needs.dehydrated=250;for(let i=0;i<5002;i++)g.atlasDeaths['dead-'+i]=true;const data=save(g);assert.ok(data.atlas.deaths['dead-0']);const copy=new a.Game(data);assert.equal(copy.needs.dehydrated,250);assert.equal(Object.keys(copy.atlasDeaths).length,5002);
});
