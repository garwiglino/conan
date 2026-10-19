const {test,before}=require('node:test'),assert=require('node:assert/strict');
const {loadGame}=require('./game-harness.cjs');let a;before(async()=>a=await loadGame());
function stage(){
 const g=new a.Game();g.clock=480;g.worldState=new a.Atlas.WorldState({clock:480});g.atlasLastClock=480;g.enemies=[];g.solid=()=>false;g.lineClear=()=>true;g.power=()=>1;g.dangerAt=()=>({unsafe:false});g.ensureDanger().atActor=()=>({unsafe:false});
 const p=a.Atlas.toGame(a.Atlas.byId.camp.x,a.Atlas.byId.camp.y),people=g.npcs.filter(n=>n.resident&&n.civilian&&!n.batracien).slice(0,2);
 for(const [i,n]of people.entries()){Object.assign(n,{x:p.x+160+i*35,y:p.y,level:0,site:'camp',alpha:1,post:{x:p.x+160+i*35,y:p.y}});Object.assign(n.civilian,{hp:6,dead:false,inv:0});delete n.dangerState;}
 const e=g.worldState.add('patrol','camp',480,1440),guard={id:'crime-test-guard',eventGuard:true,eventId:e.id,site:'camp',x:p.x+220,y:p.y,level:0,alpha:1,post:{x:p.x+220,y:p.y},name:'GARDE'};
 g.npcs=[...people,guard];g.atlasNpcs=[...g.npcs];g.ensureHumanGuard(guard);Object.assign(g.player,{x:people[0].x-14,y:p.y,level:0});g.justiceView={x:g.player.x-120,y:p.y-80,w:240,h:160};
 return {g,n:people[0],w:people[1],guard,p};
}
test('one accepted light hit only warns; invulnerable or monster hits do not turn it into a crime',()=>{
 const {g,n,guard}=stage();assert.equal(g.damageCivilian(n,1,g.player),true);assert.equal(g.worldState.justice.state.cases.length,0);assert.equal(g.isHostileHumanGuard(guard),false);assert.equal(n.dangerState.mode,'fleeing');
 const at=g.worldState.justice.state.warning.at;assert.equal(g.damageCivilian(n,1,g.player),false);assert.equal(g.worldState.justice.state.warning.at,at);
 n.civilian.inv=0;g.damageCivilian(n,1,{id:'snake',x:n.x,y:n.y,level:0});assert.equal(g.worldState.justice.state.cases.length,0);
});
test('a light-hit panic expires near the player and never creates a witness report',()=>{
 const {g,n}=stage();g.damageCivilian(n,1,g.player);const s=n.dangerState;g.clock+=4;g.stepCivilianFlight(n,s,.04);assert.equal(n.dangerState.mode,'returning');assert.equal(g.worldState.justice.pending(n.id,g.clock).length,0);assert.equal(g.justiceEffect(n).refuse,false);
});
test('a warning survives reload and repeated strikes across different victims count as assault',()=>{
 const {g,n,w}=stage();g.damageCivilian(n,1,g.player);const copy=new a.Game(JSON.parse(JSON.stringify(g.serialize())));assert.equal(copy.worldState.justice.state.warning.victim,n.id);
 g.clock+=1;g.damageCivilian(w,1,g.player);assert.equal(g.worldState.justice.state.cases.length,1);assert.equal(g.worldState.justice.state.cases[0].kind,'assault');assert.equal(g.justiceEffect(n).refuse,true);assert.equal(g.talkTo(n),false);
});
test('a guard tolerates one light hit, but the second observed strike triggers local arrest',()=>{
 const {g,guard}=stage();g.damageHumanGuard(guard,1,g.player);assert.equal(g.isHostileHumanGuard(guard),false);assert.equal(g.worldState.justice.state.cases.length,0);
 g.damageHumanGuard(guard,1,g.player);assert.equal(g.isHostileHumanGuard(guard),true);assert.equal(g.worldState.justice.effect('camp',null,g.clock).wanted,true);
});
test('murder is immediately criminal and known civilians refuse dialogue and flee, but unseen murder creates no magical bounty',()=>{
 const {g,n,w}=stage();g.damageCivilian(n,99,g.player);assert.equal(g.worldState.justice.state.cases[0].kind,'murder');assert.equal(g.talkTo(w),false);assert.equal(w.dangerState.attacker,'player');assert.equal(g.npcPresent(w),false);
 const hidden=stage();hidden.g.npcs=[hidden.n];hidden.g.damageCivilian(hidden.n,99,hidden.g.player);assert.equal(hidden.g.worldState.justice.effect('camp',null,hidden.g.clock).wanted,false);
});
test('fear has a fixed world-clock deadline; proximity does not renew it and speech becomes available again',()=>{
 const {g,n,w}=stage();g.damageCivilian(n,1,g.player);n.civilian.inv=0;g.damageCivilian(n,1,g.player);const until=g.justiceEffect(w).fearUntil;assert.equal(until,g.clock+180);
 g.clock=until;g.refreshJusticeFear(true);assert.equal(g.justiceEffect(w).refuse,false);assert.equal(w.dangerState.mode,'returning');g.stepNpcs(.04);assert.ok(!w.dangerState,JSON.stringify(w.dangerState));assert.equal(g.npcPresent(w),true);
});
test('reported crimes reserve one finite squad, mobilize with a delay and materialize outside the actual view',()=>{
 const {g,guard}=stage();g.damageHumanGuard(guard,1,g.player);g.damageHumanGuard(guard,1,g.player);g.clock+=1;g.time=6;
 const site=g.worldState.simulation.state.sites.camp,before=site.guardAvailable;g.stepJusticeResponse();const m=g.worldState.simulation.state.missions.find(m=>m.kind==='justice');assert.ok(m);assert.ok(m.readyAt>g.clock);assert.equal(site.guardAvailable,before-2);
 g.syncCampaignGroups();assert.equal(g.npcs.filter(n=>n.campaignGroup===m.id).length,0);
 g.clock=m.readyAt;g.guardRecords=new Map(m.units.map(u=>[u.id,{id:u.id,hp:8,x:g.player.x,y:g.player.y,hostileUntil:g.clock+180}]));g.syncCampaignGroups();const officers=g.npcs.filter(n=>n.campaignGroup===m.id);assert.equal(officers.length,2);assert.ok(officers.every(n=>g.justiceSpawnOffscreen(n)));g.time+=10;g.stepJusticeResponse();assert.equal(g.worldState.simulation.state.missions.filter(m=>m.kind==='justice').length,1);
 const save=JSON.parse(JSON.stringify(g.serialize())),copy=new a.Game(save),restored=copy.worldState.simulation.state.missions.find(n=>n.id===m.id);assert.deepEqual(Array.from(restored.units,u=>u.id),Array.from(m.units,u=>u.id));
});
test('an exhausted post cannot invent guards or spend reserves on a failed dispatch',()=>{
 const {g,guard}=stage();g.damageHumanGuard(guard,1,g.player);g.damageHumanGuard(guard,1,g.player);g.clock++;g.time=6;const site=g.worldState.simulation.state.sites.camp;site.guardAvailable=0;const cash=site.treasury;g.planJusticeDeployment=()=>{throw Error('must not search without staff');};g.stepJusticeResponse();assert.equal(site.treasury,cash);assert.equal(g.worldState.simulation.state.missions.filter(m=>m.kind==='justice').length,0);
});
test('human law guards never become frog wardens or a civilian threat merely because of a warrant',()=>{
 const {g,guard}=stage();g.damageHumanGuard(guard,1,g.player);g.damageHumanGuard(guard,1,g.player);assert.equal(g.isHostileHumanGuard(guard),true);assert.equal(g.isHostileBatracien(guard),false);
});
test('a recalled squad returns its survivors to the actual post once and never resurrects a casualty',()=>{
 const {g,guard}=stage(),s=g.worldState.simulation;g.damageHumanGuard(guard,1,g.player);g.damageHumanGuard(guard,1,g.player);g.clock++;g.time=6;g.stepJusticeResponse();const m=s.state.missions.find(m=>m.kind==='justice');assert.ok(m);
 s.systems.missionDamage(m,m.units[0].id,0);g.clock=m.readyAt;g.worldState.justice.sentence('camp',100,g.clock);m.physical=false;s.systems.stepMission(m,600,g.clock+600);
 assert.equal(m.status,'returned');const home=a.Atlas.byId.camp,p=s.systems.position(m);assert.ok(Math.hypot(p.x-home.x,p.y-home.y)<.001);
 const people=s.systems.people(s.state.sites.camp);assert.equal(people.find(p=>p.id===m.units[0].id).dead,true);assert.equal(people.find(p=>p.id===m.units[1].id).assignment,null);
 const snapshot=JSON.stringify(s.state.sites.camp);s.systems.stepMission(m,600,g.clock+1200);assert.equal(JSON.stringify(s.state.sites.camp),snapshot);
});
test('mobilizing guards wait if the entry is now visible; a stale camera cannot authorize a visible spawn',()=>{
 const {g,guard}=stage();g.damageHumanGuard(guard,1,g.player);g.damageHumanGuard(guard,1,g.player);g.clock++;g.time=6;g.stepJusticeResponse();const m=g.worldState.simulation.state.missions.find(m=>m.kind==='justice');assert.ok(m);g.clock=m.readyAt;
 const view=g.justiceView;g.justiceView={x:g.player.x-1200,y:g.player.y-800,w:2400,h:1600};g.syncCampaignGroups();assert.equal(g.npcs.filter(n=>n.campaignGroup===m.id).length,0);
 g.justiceView=view;g.player.x+=10000;assert.equal(g.justiceSpawnOffscreen(g.player),false);
});
test('a quiet frog law guard does not prolong civilian panic after fear expires; an actual fight remains dangerous',()=>{
 const {g,w,guard}=stage();guard.batracien={role:'village_guard',hp:8,action:'idle',elapsed:0,hostileUntil:0};
 const j=g.worldState.justice,c=j.record({victim:'observed-victim',site:'camp',kind:'assault',witnesses:[guard.id],at:g.clock});j.file(c.id,guard.id,g.clock);g.clock+=180;
 assert.equal(g.justiceEffect(w).refuse,false);assert.equal(g.isHostileBatracien(guard),true);assert.equal(g.localThreatAt(w.x,w.y),null);
 guard.wind=.2;assert.equal(g.localThreatAt(w.x,w.y),guard);
});
test('injury severity reads the damaged health component, not an old role attached to the actor',()=>{
 const {g,guard}=stage();guard.civilian={hp:6,dead:false};g.damageHumanGuard(guard,3,g.player);assert.equal(g.worldState.justice.state.cases[0].kind,'grave_injury');
});
