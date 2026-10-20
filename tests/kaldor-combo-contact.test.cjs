'use strict';
const {test,before}=require('node:test'),assert=require('node:assert/strict');
const W=require('../scripts/kaldor-weapons.js'),{loadGame}=require('./game-harness.cjs');
let api;before(async()=>{api=await loadGame();});
function arena(){
 const g=new api.Game();g.enemies=[];g.npcs=[];g.lineClear=()=>true;g.solid=()=>false;g.move=()=>{};
 g.populateAtlas=()=>{};g.checkQuests=()=>{};g.checkSteles=()=>{};g.stepNpcs=()=>{};
 g.player.spawnFX=0;g.player.level=0;return g;
}
function target(p,dir,combo,id){const q=W.pose(p.weapon,dir,2,combo);return {id,kind:'snake',x:p.x+q.h[0]+q.u[0]*q.reach,y:p.y+q.h[1]+q.u[1]*q.reach+9,r:1,level:0};}

test('all 576 links reuse the entire previous recoil as the next preparation in all four views',()=>{
 for(const w of W.all)for(let d=0;d<4;d++)for(let c=0;c<3;c++){
  assert.deepEqual(W.pose(w.id,d,3.5,c),W.pose(w.id,d,1,c+1),w.id+':'+d+':'+c);
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

test('a held combo shows recoil, links without idle, and keeps each attack facing locked',()=>{
 for(const id of ['exile','lance-boisclair','aiguille-corail','brise-givre'])for(let dir=0;dir<4;dir++){
  const g=arena(),p=g.player;Object.assign(p,{weapon:id,dir});let previous=null,linked=0;
  for(let i=0;i<200;i++){
   g.update(.04,{attack:true});const drawing=p.attack>0?W.sample(p.attack,id,p.combo):5;
   assert.equal(p.dir,dir);
   if(previous&&p.combo!==previous.combo){
    assert.equal(previous.drawing,3.5,id+' shows recoil before link');assert.equal(drawing,1);
    assert.deepEqual(W.pose(id,dir,previous.drawing,previous.combo),W.pose(id,dir,drawing,p.combo));
    linked++;
   }
   if(p.combo===3)break;
   if(p.attack>0)assert.notEqual(drawing,5,'no idle between queued blows');
   previous={combo:p.combo,drawing};
  }
  assert.equal(linked,3,id+' complete combo');
 }
});

test('contact hit stop freezes attacker, victim and effects, buffers input, and ends without losing time',()=>{
 const g=arena(),p=g.player;Object.assign(p,{weapon:'exile',dir:1});g.swingSword();
 const row=W.times(p.weapon,0);p.attack=W.duration(p.weapon,0)-row[0]-row[1]-.001;
 p.hitPause=W.hitPause(p.weapon,0);const before={time:g.time,attack:p.attack,comboWindow:p.comboWindow,x:p.x,y:p.y};
 let simulated=0;g.stepNpcs=()=>simulated++;g.update(.01,{attackPressed:true,x:0,y:1});
 assert.equal(simulated,0);assert.deepEqual({time:g.time,attack:p.attack,comboWindow:p.comboWindow,x:p.x,y:p.y},before);
 assert.ok(p.attackBuffer>0);assert.equal(p.bufferY,1);assert.equal(p.impactTick,false);
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
