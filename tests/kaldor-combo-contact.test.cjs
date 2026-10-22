'use strict';
const {test,before}=require('node:test'),assert=require('node:assert/strict'),Projection=require('../scripts/world-projection');
const W=require('../scripts/kaldor-weapons.js'),{loadGame,combatGame}=require('./game-harness.cjs');
let api;before(async()=>{api=await loadGame();});
function arena(){
 const g=combatGame(api);g.enemies=[];g.npcs=[];g.lineClear=()=>true;g.solid=()=>false;g.move=()=>{};
 for(const key of ['populateAtlas','populateRoadTraffic','populateCivilians','advanceAtlas','checkQuests','checkSteles','stepNpcs'])g[key]=()=>{};
 g.player.spawnFX=0;g.player.level=0;return g;
}
function target(p,dir,combo,id){const q=W.pose(p.weapon,dir,2,combo);const delta=Projection.inverse(q.h[0]+q.u[0]*q.reach,q.h[1]+q.u[1]*q.reach+9);return {id,kind:'snake',x:p.x+delta.x,y:p.y+delta.y,r:1,level:0};}

test('all 576 links retain a distinct follow-through before the next preparation in all four views',()=>{
 for(const w of W.all)for(let d=0;d<4;d++)for(let c=0;c<3;c++){
  assert.notDeepEqual(W.pose(w.id,d,3.5,c),W.pose(w.id,d,1,c+1),w.id+':'+d+':'+c+' post-hit is not the next wind-up');
  assert.notDeepEqual(W.pose(w.id,d,3.5,c),W.pose(w.id,d,2,c),'post-hit differs from contact');
  assert.equal(W.canChain(W.times(w.id,c)[5]+W.times(w.id,c)[4]/2,w.id,c),false,'cannot cancel mid-recoil');
  const row=W.times(w.id,c),recoil=W.duration(w.id,c)-row[5]-row[4]/2;
  assert.equal(W.preview(w.id,[...Array(c).keys()].reduce((t,k)=>t+W.duration(w.id,k)-W.times(w.id,k)[5],0)+recoil,'attack').state,'attack');
 }
});

test('128 live attacks cover all families and views, emit damage once, and reject late arrivals',()=>{
 const g=arena(),p=g.player;let targets=[],events=[];g.combatTargets=()=>targets;g.hitProps=()=>{};
 g.damageEnemy=(e)=>{events.push({id:e.id,drawing:W.sample(p.attack,p.weapon,p.combo)});};
 for(const family of Object.keys(W.families))for(let dir=0;dir<4;dir++)for(let combo=0;combo<4;combo++){
  const w=W.all.find(w=>w.family===family);
  Object.assign(p,{weapon:w.id,dir,attack:0,attackCD:0,hitPause:0,hurt:0,combo:combo-1,comboWindow:1,attackHeld:false,attackBuffer:0});
  g.swingSword();assert.equal(p.combo,combo);targets=[target(p,dir,combo,'first')];events=[];
  const dt=dir%2?.04:1/60;let late=false,steps=0;
  while((p.attack>0||p.attackCD>0)&&steps++<100){
   g.update(dt,{});
   if(events.length&&!late){late=true;targets.push(target(p,dir,combo,'late'));}
  }
  assert.ok(steps<100);assert.deepEqual(events,[{id:'first',drawing:2}],w.id+':'+dir+':'+combo);
 }
});

test('a spammed combo shows its full recoil, links without idle, and keeps each attack facing locked',()=>{
 const g=arena(),p=g.player;g.populateRoadTraffic=()=>{};g.populateCivilians=()=>{};g.advanceAtlas=()=>{};
 for(const id of ['exile','lance-boisclair','aiguille-corail','brise-givre'])for(let dir=0;dir<4;dir++){
  Object.assign(p,{weapon:id,dir,attack:0,attackCD:0,combo:0,comboWindow:0,hitPause:0,attackHeld:false,attackBuffer:0,hurt:0});g.npcs=[];g.targetId=null;let previous=null,linked=0,postTicks=0;
  for(let i=0;i<200;i++){
   g.update(.04,{attack:true,attackPressed:true});const drawing=p.attack>0?W.sample(p.attack,id,p.combo):5;
   assert.equal(p.dir,dir);
   if(previous&&p.combo!==previous.combo){
    assert.equal(previous.drawing,3.5,id+' shows recoil before link');assert.equal(drawing,.75);
    assert.ok(postTicks*.04>=W.times(id,previous.combo)[4]-.04-1e-6,id+' actual engine preserves the recovery budget');postTicks=0;
    assert.notDeepEqual(W.pose(id,dir,previous.drawing,previous.combo),W.pose(id,dir,drawing,p.combo));
    linked++;
   }
   if(drawing===3.5)postTicks++;
   if(p.combo===3)break;
   if(p.attack>0)assert.notEqual(drawing,5,'no idle between fresh linked blows');
   previous={combo:p.combo,drawing};
  }
  assert.equal(linked,3,id+' complete combo');
 }
});

test('contact hit stop freezes attacker, victim and effects, discards input, and ends without losing time',()=>{
 const g=arena(),p=g.player;Object.assign(p,{weapon:'exile',dir:1});g.swingSword();
 const row=W.times(p.weapon,0);p.attack=W.duration(p.weapon,0)-row[0]-row[1]-.001;
 p.hitPause=W.hitPause(p.weapon,0);const before={time:g.time,attack:p.attack,comboWindow:p.comboWindow,x:p.x,y:p.y};
 let simulated=0;g.stepNpcs=()=>simulated++;g.update(.01,{attackPressed:true,x:0,y:1});
 assert.equal(simulated,0);assert.deepEqual({time:g.time,attack:p.attack,comboWindow:p.comboWindow,x:p.x,y:p.y},before);
 assert.equal(p.attackBuffer,0);assert.equal(p.impactTick,false);
 const remaining=p.hitPause;g.update(remaining+.005,{});assert.ok(Math.abs(g.time-before.time-.005)<1e-8);assert.equal(p.hitPause,0);assert.ok(simulated>0);
 assert.ok(W.hitPause('aiguille-corail')>=.025);assert.ok(W.hitPause('brise-givre',3)<=.065);
 // A miss never requests a stop.
 const miss=arena();miss.swingSword();for(let i=0;i<30;i++){miss.update(.04,{});assert.equal(miss.player.hitPause,0);}
});


test('all 768 contacts gate civilian, human guard, frog guard and breakable channels together',()=>{
 const g=arena(),p=g.player,events=[];g.hazards=[];g.shots=[];
 for(const method of ['damageCivilian','damageHumanGuard','damageBatracienGuard','hitProp'])g[method]=n=>events.push(n.id);
 for(const w of W.all)for(let dir=0;dir<4;dir++)for(let combo=0;combo<4;combo++){
  Object.assign(p,{weapon:w.id,dir,combo});const tip=target(p,dir,combo,'tip'),row=W.times(w.id,combo),len=W.duration(w.id,combo);
  g.npcs=[{...tip,id:'civilian',civilian:{dead:false}},{...tip,id:'human',eventGuard:true},{...tip,id:'frog',batracien:{role:'village_guard',dead:false}}];
  g.world.props=[{...tip,y:tip.y-1,id:'prop',kind:'crates',hp:2}];
  for(const [elapsed,active]of [[row[0]+row[1]/2,false],[row[0]+row[1]+row[2]/2,true],[row[0]+row[1]+row[2]+row[3]/2,false],[len-row[5]-row[4]/2,false]]){
   p.attack=len-elapsed;p.impactTick=active;g.hits.clear();events.length=0;
   g.civilianCombat(0,new Map());g.hitProps(p,W.frame(p.attack,w.id,combo));
   assert.deepEqual(events.sort(),active?['civilian','frog','human','prop']:[],w.id+':'+dir+':'+combo+':'+elapsed);
  }
 }
});


test('confirmed impacts shake the world by at most one pixel, once per swing, and respect reduced motion',()=>{
 const g=arena(),p=g.player,shake=api.KaldorArsenal.cameraShake;
 Object.assign(p,{weapon:'brise-givre',dir:1});g.swingSword();
 const e=()=>({...api.enemy('snake',p.x+15,p.y,'shake-target'),hp:20,maxHp:20});
 g.damageEnemy(e(),1);assert.equal(g.weaponShake,undefined,'no camera kick outside the impact event');
 p.impactTick=true;g.damageEnemy(e(),1);const kick=g.weaponShake;
 assert.ok(kick.duration>=.065&&kick.duration<=.09);assert.equal(shake(kick),1);
 for(let remaining=0;remaining<=kick.duration;remaining+=.001){
  assert.ok(Math.abs(shake({...kick,remaining}))<=1);assert.equal(shake({...kick,remaining},true),0);
 }
 g.damageEnemy(e(),1);assert.equal(g.weaponShake,kick,'multiple victims cannot stack the camera shake');
 const time=g.time,remaining=kick.remaining;g.update(.01,{});
 assert.equal(g.time,time,'hit stop still freezes combat');assert.ok(Math.abs(kick.remaining-(remaining-.01))<1e-9,'shake decays during the pause');
 kick.remaining=0;assert.equal(shake(kick),0);
 // Newly encountered patrols initialize their health inside the damage method.
 p.impactTick=true;g.weaponShake=null;const guard={eventGuard:true,id:'new-shake-guard',x:p.x+15,y:p.y,level:0};
 assert.equal(g.damageHumanGuard(guard,1,p),true);assert.ok(g.weaponShake,'first hit on a newly initialized guard shakes too');
});


test('every attack reserves readable follow-through at 25, 60 and 120 fps before a combo can cancel',()=>{
 for(const w of W.all)for(let combo=0;combo<4;combo++)for(const dt of [.04,1/60,1/120]){
  const row=W.times(w.id,combo);assert.ok(row[4]>=W.postHold(w.id,combo));
  let remaining=W.duration(w.id,combo),postTicks=0;
  while(remaining>0){
   const f=W.sample(remaining,w.id,combo);
   if(f===3.5){postTicks++;assert.equal(W.canChain(remaining,w.id,combo),false,'post-hit stays uncancellable');}
   if(combo<3&&W.canChain(remaining,w.id,combo))break;
   remaining=W.advance(remaining,dt,w.id,combo);
  }
  assert.ok(postTicks*dt>=row[4]-dt-1e-6,w.id+':'+combo+' full recoil budget');
  assert.ok(postTicks>= (dt===.04?1:dt===1/60?3:6),w.id+' legible at '+Math.round(1/dt)+' fps');
 }
});


test('early spam is discarded in world and dungeon; holding never repeats and fresh late presses chain',()=>{
 for(const dungeon of [false,true]){
 const g=arena(),p=g.player;if(dungeon){g.startFirstDungeon();g.enterDungeonFloor('grande-salle',{x:368,y:208});g.enemies=[];p.spawnFX=0;}
 for(const id of ['exile','aiguille-corail','brise-givre','lance-boisclair']){
  const reset=()=>Object.assign(p,{weapon:id,dir:1,attack:0,attackCD:0,combo:0,comboWindow:0,hitPause:0,hurt:0,attackBuffer:0,attackHeld:false,spawnFX:0});
  reset();let start=g.swing;
  for(let i=0;i<120;i++)g.update(.04,{attack:true});
  assert.equal(g.swing-start,1,id+' held attack fires once');
  reset();start=g.swing;g.update(.01,{attack:true,attackPressed:true});
  for(let i=0;i<5;i++){g.update(.01,{});g.update(.01,{attack:true,attackPressed:true});}
  p.attackBuffer=10; // Older saves cannot reintroduce the removed queue.
  for(let i=0;i<120;i++)g.update(.04,{});
  assert.equal(g.swing-start,1,id+' ignored early presses never execute later');
  reset();start=g.swing;g.update(.01,{attackPressed:true});
  for(let combo=0;combo<3;combo++){
   let ticks=0;while(!W.canChain(p.attack,id,combo)&&ticks++<400)g.update(.005,{});
   assert.ok(ticks<400);assert.equal(p.combo,combo);
   g.update(.001,{attackPressed:true});assert.equal(p.combo,combo+1,id+' fresh press in link window');
  }
  assert.equal(g.swing-start,4);
  // A press consumed by hit stop stays consumed even when the tick has time left.
  reset();g.update(.01,{attackPressed:true});p.comboRecoilShown=true;p.attack=W.times(id,0)[5]/2;p.hitPause=.001;
  const before=g.swing;g.update(.01,{attackPressed:true,attack:true});assert.equal(g.swing,before);
  for(let i=0;i<120;i++)g.update(.04,{attack:true});assert.equal(g.swing,before);
 }
 }
});


test('spamming across repeated fourth strikes cannot cut their recovery or cooldown',()=>{
 const g=arena(),p=g.player;g.populateRoadTraffic=()=>{};g.populateCivilians=()=>{};g.advanceAtlas=()=>{};
 for(const id of ['aiguille-corail','brise-givre','lance-boisclair']){
  Object.assign(p,{weapon:id,attack:0,attackCD:0,combo:0,comboWindow:0,attackBuffer:0,attackHeld:false,hitPause:0,hurt:0});g.npcs=[];g.targetId=null;
  let fourthEnds=0;const start=g.swing;
  for(let i=0;i<600&&g.swing-start<9;i++){
   const before={attack:p.attack,cd:p.attackCD,combo:p.combo,swing:g.swing};
   g.update(.01,{attack:true,attackPressed:true});
   if(g.swing>before.swing&&before.combo===3){
    assert.ok(before.attack<=.010001,id+' finisher animation must end');
    assert.ok(before.cd<=.010001,id+' finisher cooldown must end');fourthEnds++;
   }
  }
  assert.equal(g.swing-start,9);assert.equal(fourthEnds,2,'two full combo cycles');
 }
});
