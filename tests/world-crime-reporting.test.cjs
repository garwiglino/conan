const {test,before}=require('node:test'),assert=require('node:assert/strict'),{loadGame}=require('./game-harness.cjs');let a;before(async()=>a=await loadGame());
function camp(){const g=new a.Game();g.enemies.forEach(e=>e.dead=true);g.dialogue=null;g.player.spawnFX=0;return g;}
test('an actual equipped-weapon killing seen by the camp relay raises the HUD without fabricated guards or forced testimony',()=>{
 const g=camp(),n=g.npcs.find(n=>n.id==='resident-camp-1'),relay=g.stations.find(s=>s.site==='camp').actor;let placed=false;
 for(let y=-24;y<=24&&!placed;y+=8)for(let x=-24;x<=24&&!placed;x+=8)for(let dir=0;dir<4&&!placed;dir++){
  const p={...g.player,x:n.x+x,y:n.y+y,dir};if(x*x+y*y<100||g.solid(p.x,p.y,6,0)||!g.lineClear(p,n)||!a.bladeHits(p,n,2))continue;
  Object.assign(g.player,{x:p.x,y:p.y,dir});placed=true;
 }
 assert.ok(placed,'a real attack position on the shipped terrain');assert.ok(g.justiceWitnesses(n).some(w=>w.id===relay.id),'the authored relay actually sees the victim and player');
 n.civilian.hp=1;n.stun=1;for(let i=0;i<60&&!n.civilian.dead;i++)g.update(.04,{x:0,y:0,attack:true,attackPressed:i===0});
 assert.equal(n.civilian.dead,true,'the real weapon collision kills the injured resident');const c=g.worldState.justice.state.cases.find(c=>c.victim===n.id);assert.equal(c.kind,'murder');assert.equal(c.witnesses[relay.id].filedCount,1);assert.equal(g.pursuitStatus().level,3);
});
test('an already saved statement seen by a living relay no longer waits for a second reporting contact',()=>{
 const g=camp(),relay=g.stations.find(s=>s.site==='camp').actor,j=g.worldState.justice,c=j.record({site:'camp',victim:'previous-victim',kind:'murder',witnesses:[relay.id],at:g.clock});
 const copy=new a.Game(JSON.parse(JSON.stringify(g.serialize())));copy.stepJusticeWitnesses(0);const restored=copy.worldState.justice.state.cases.find(k=>k.id===c.id);assert.equal(restored.reportedAt,copy.clock);assert.equal(copy.pursuitStatus().level,3);
});
test('a panicking witness with an old reporting goal still executes the normal flight AI',()=>{
 const g=camp(),n=g.npcs.find(n=>n.id==='resident-camp-1'),relay=g.stations.find(s=>s.site==='camp').actor;
 g.worldState.justice.record({site:'camp',victim:'previous-victim',kind:'murder',witnesses:[n.id],at:g.clock});g.startCivilianFlight(n,g.player);n.justiceReport={contact:relay.id};g.time+=.5;g.stepNpcs(.04);
 assert.ok(n.dangerState?.lookAt>g.time,'the real fleeing controller ran instead of being filtered out');assert.equal(n.justiceReport,undefined,'panic releases the stale walking goal');
});
test('a safe witness returning home gives testimony priority and uses the existing collision checked route',()=>{
 const g=camp(),n=g.npcs.find(n=>n.id==='resident-camp-1'),relay=g.stations.find(s=>s.site==='camp').actor;
 g.worldState.justice.record({site:'camp',victim:'previous-victim',kind:'murder',witnesses:[n.id],at:g.clock});g.player.x+=700;n.hurt=n.stun=0;n.dangerState={mode:'returning',post:{...n.post},shelter:{x:n.x,y:n.y},clearAt:g.clock};
 g.stepJusticeWitnesses(.04);assert.equal(n.dangerState,undefined);assert.equal(n.justiceReport?.contact,relay.id);assert.ok(n.path?.length||n.moving,'a real terrain route is followed');assert.equal(g.pursuitStatus().level,0,'testimony is not transmitted from a distance');for(let i=0;i<400&&g.pursuitStatus().level===0;i++){g.time+=.04;g.stepJusticeWitnesses(.04);}assert.equal(g.pursuitStatus().level,3,'the witness actually reaches an accessible point and reports');
});
test('discovering an unseen murder still reports bodies without inventing the killer identity',()=>{
 const g=camp(),n=g.npcs.find(n=>n.id==='resident-camp-1'),relay=g.stations.find(s=>s.site==='camp').actor;g.npcs=[n];g.damageCivilian(n,100,g.player);assert.equal(g.pursuitStatus().level,0);
 g.npcs.push(relay);Object.assign(relay,{x:n.x-16,y:n.y});g.player.x+=700;assert.ok(g.lineClear(relay,n));g.stepJusticeWitnesses(0);
 assert.ok(g.worldState.justice.state.scenes.some(s=>s.reportedAt!==null));assert.equal(g.pursuitStatus().level,0);assert.equal(g.worldState.justice.state.cases[0].reportedAt,null);
});
