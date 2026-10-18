const {test,before}=require('node:test'),assert=require('node:assert/strict');let api;before(async()=>{api=await require('./game-harness.cjs').loadGame();});
function near(g,id){const s=g.stations.find(s=>s.site===id);assert.ok(Math.hypot(g.player.x-s.actor.x,g.player.y-s.actor.y)<48,id);assert.equal(g.solid(g.player.x,g.player.y,5,0),false);assert.equal(g.markNearestTransport().siteId,id);assert.ok(g.navigationInfo().metres<3);}
function depart(g){const s=g.stations.find(s=>s.site==='camp');Object.assign(g.player,g.stationLanding('camp'),{coins:9999});g.prepareTransport(s.id);assert.ok(g.startJourney(g.planJourney(api.Atlas.home.id)));}
test('all destinations finish at their physical nearest staffed transport',()=>{const g=new api.Game();for(const n of g.travelDestinations()){g.journey={index:1,plan:{to:n.id,stages:[{}]}};g.finishJourney();near(g,n.id);}});
test('cancelling midway returns to the last staffed stop and preserves paid fare',()=>{const g=new api.Game();depart(g);const j=g.journey,s=j.plan.stages.find(s=>s.kind==='move');j.index=j.plan.stages.indexOf(s);j.progress=s.minutes/2;g.journeyPosition();j.cancel=true;const coins=g.player.coins;g.stepJourney(.04);assert.equal(g.journey,null);near(g,'camp');assert.equal(g.player.coins,coins);});
test('closure midway returns to a transport instead of a road coordinate',()=>{const g=new api.Game();depart(g);const j=g.journey,s=j.plan.stages.find(s=>s.kind==='move');j.index=j.plan.stages.indexOf(s);j.progress=s.minutes/2;g.journeyPosition();g.worldState.add('landslide',s.road,g.clock,600,{position:{x:(s.from[0]+s.to[0])/2,y:(s.from[1]+s.to[1])/2}});g.stepJourney(.04);assert.equal(g.journey,null);near(g,'camp');});
test('interruption chooses the recorded relay rather than the final destination',()=>{const g=new api.Game(),n=g.travelDestinations().find(n=>n.id!=='camp'&&n.id!==api.Atlas.home.id);g.journey={lastSafe:n.id,index:0,plan:{from:'camp',to:api.Atlas.home.id,stages:[{}]}};g.finishJourney('Voyage interrompu');near(g,n.id);});
test('invalid save recovers beside a provider and valid cancelled save remains safe',()=>{const g=new api.Game();depart(g);let saved=JSON.parse(JSON.stringify(g.serialize()));saved.atlas.journey.plan.stages[0].minutes=-1;const bad=new api.Game(saved);assert.equal(bad.journey,null);near(bad,'camp');saved=JSON.parse(JSON.stringify(g.serialize()));saved.atlas.journey.cancel=true;const restored=new api.Game(saved);restored.stepJourney(.04);assert.equal(restored.journey,null);near(restored,'camp');});

test('abrupt restarts at departure, midway, meal and final stage still reach a staffed arrival',()=>{
 const source=new api.Game();depart(source);const paid=source.player.coins;
 for(const mode of ['departure','middle','meal','last']){
  const saved=JSON.parse(JSON.stringify(source.serialize())),j=saved.atlas.journey;
  j.index=mode==='last'?j.plan.stages.length-1:mode==='middle'?Math.floor(j.plan.stages.length/2):0;
  j.progress=j.plan.stages[j.index].minutes*.5;if(mode==='meal'){j.mealPause=1;j.readTime=10;}
  const restored=new api.Game(saved);restored.worldState.advance=function(clock){this.clock=clock;};assert.ok(restored.journey);assert.equal(restored.player.coins,paid);
  let steps=0;while(restored.journey&&steps++<10000)restored.stepJourney(.1);
  assert.equal(restored.journey,null,mode);near(restored,api.Atlas.home.id);assert.equal(restored.player.coins,paid);
 }
});
