'use strict';
const {test,before}=require('node:test'),assert=require('node:assert/strict');
const {loadGame}=require('./game-harness.cjs');let api,B,S;
before(async()=>{api=await loadGame();B=api.Game.batracienRuntime;S=api.Game.batracienSociety;});
const json=v=>JSON.parse(JSON.stringify(v));
function game(){const g=new api.Game();g.clock=480;g.worldState=new api.Atlas.WorldState({clock:480});g.player.spawnFX=0;g.enemies=[];return g;}
function actors(g){const guard=g.npcs.find(n=>n.id==='warden-batracien-town-1-0'),civil=g.npcs.find(n=>n.id==='resident-batracien-town-1-0');return {guard,civil};}
function arena(g){const a=actors(g);g.solid=()=>false;g.lineClear=()=>true;Object.assign(g.player,{x:a.guard.x+20,y:a.guard.y,level:0,inv:0,guard:false});a.guard.dir=1;return a;}
function tick(g,t){for(let i=0;i<Math.ceil(t/.04);i++)g.update(.04,{});}
test('population adds 28 local walkers and six named road travellers, with no replacement or duplicate ID',()=>{
 const g=game(),ns=g.npcs.filter(B.isCivil),count=k=>ns.filter(n=>n.batracien.routine.kind===k).length;
 assert.equal(count('worker'),28);assert.equal(count('local'),28);assert.equal(count('road'),6);assert.equal(ns.length,62);
 assert.equal(new Set(g.npcs.map(n=>n.id)).size,g.npcs.length);assert.equal(g.stations.filter(s=>s.actor.batracien).length,0);
 const old=ns.map(n=>n.id);g.populateCivilians();assert.deepEqual(g.npcs.filter(B.isCivil).map(n=>n.id),old);
});
test('a local walker moves on real ground at native speed and can stop for a conversation',()=>{
 const g=game(),n=g.npcs.find(n=>n.id==='resident-batracien-town-1-2');Object.assign(g.player,{x:n.x+100,y:n.y+80});n.batracien.routine.wait=0;n.civilian.restClock=0;
 const start={x:n.x,y:n.y};for(let i=0;i<160;i++){const p={x:n.x,y:n.y};g.time+=.04;g.stepBatracienCivilian(n,.04);assert.ok(Math.hypot(n.x-p.x,n.y-p.y)<=1.281);assert.equal(g.solid(n.x,n.y,5,0),false);}
 assert.ok(Math.hypot(n.x-start.x,n.y-start.y)>8);assert.ok(n.batracien.distance>0);assert.ok(['talk','walk','idle',n.batracien.job].includes(n.batracien.action));
});
test('conversations reserve both participants, face each other, do not pause the game and expire',()=>{
 const g=game(),a=g.npcs.find(n=>n.id==='resident-batracien-town-1-2'),b=g.npcs.find(n=>n.id==='resident-batracien-town-1-3');g.solid=()=>false;g.lineClear=()=>true;
 b.x=a.x+32;b.y=a.y;Object.assign(g.player,{x:a.x,y:a.y+80});const pal=[a.batracien.palette,b.batracien.palette];
 assert.equal(g.startBatracienConversation(a,b),true);assert.equal(a.dir,1);assert.equal(b.dir,3);assert.equal(g.dialogue,null);assert.equal(g.startBatracienConversation(a,b),false);
 g.time+=.04;g.stepBatracienCivilian(a,.04);assert.equal(a.batracien.action,'talk');
 g.time=a.batracien.routine.chatUntil+.01;g.stepBatracienCivilian(a,.04);assert.equal(a.batracien.routine.partner,null);assert.equal(b.batracien.routine.partner,null);assert.deepEqual([a.batracien.palette,b.batracien.palette],pal);
});
test('conversation cancels on injury, disappearance or player dialogue, and cannot involve dead or recruited actors',()=>{
 const g=game(),{civil}=arena(g),other=g.npcs.find(n=>n.id==='resident-batracien-town-1-2');other.x=civil.x+32;other.y=civil.y;
 assert.equal(g.startBatracienConversation(civil,other),true);g.damageCivilian(civil,1,{x:civil.x-12,y:civil.y,level:0});assert.equal(other.batracien.routine.partner,null);
 assert.notEqual(civil.batracien.action,'talk');civil.civilian.dead=true;assert.equal(g.startBatracienConversation(civil,other),false);
});
test('all six trade routes use existing foot edges in both directions and no sea route',()=>{
 for(const [id]of S.roadSpecs)for(const reverse of [false,true]){const route=S.route(id,reverse);assert.ok(route?.segments.length);for(const s of route.segments){assert.ok(api.Atlas.edgeById.get(s.edge).modes.includes('foot'));assert.notEqual(api.Atlas.roadById[s.road].type,'searoutes');assert.ok(s.length>0);}}
});
test('road travel stops at closures rather than cutting across terrain',()=>{
 const g=game(),n=g.npcs.find(n=>n.id==='resident-batracien-town-55-4'),r=n.batracien.routine,route=S.route(n.id),s=route.segments[0];g.solid=()=>false;g.lineClear=()=>true;r.wait=0;r.approach=false;r.progress=160;Object.assign(n,S.roadPoint(route,0,r.progress));Object.assign(g.player,{x:n.x+80,y:n.y+80});
 const edge=api.Atlas.edgeById.get(s.edge),a=api.Atlas.vertices.get(edge.a),b=api.Atlas.vertices.get(edge.b);
 g.worldState.add('flood',s.road,g.clock,300,{position:{x:(a[0]+b[0])/2,y:(a[1]+b[1])/2}});assert.equal(g.worldState.edgeStatus(edge,g.clock).closed,true);
 const p={x:n.x,y:n.y};g.stepBatracienRoutine(n,.04);assert.equal(n.x,p.x);assert.equal(n.y,p.y);assert.equal(r.progress,160);assert.equal(n.batracien.action,'idle');
});
test('road coordinates and palette survive reload; malformed path indices and arbitrary warps are rejected',()=>{
 const g=game(),n=g.npcs.find(n=>n.id==='resident-batracien-town-55-4'),r=n.batracien.routine,route=S.route(n.id),leg=route.segments.findIndex(s=>s.length>2400);assert.ok(leg>=0);r.edge=leg;r.progress=1600;r.approach=false;r.wait=0;const p=S.roadPoint(route,leg,1600);Object.assign(n,p);n.post={...p};assert.equal(g.solid(n.x,n.y,6,0),false);
 const save=json(g.serialize()),copy=new api.Game(save),rn=copy.npcs.find(a=>a.id===n.id);assert.ok(Math.hypot(rn.x-n.x,rn.y-n.y)<.01);assert.equal(rn.batracien.palette,n.batracien.palette);assert.equal(rn.batracien.routine.edge,leg);
 const row=save.atlas.batraciens.people.find(a=>a.id===n.id);row.routine.edge=-99;row.x=1e15;row.y=NaN;assert.equal(copy.validBatracienRoutePosition(n.id,row),false);
});
test('direct player assault makes only nearby witnesses hostile, targetable and able to retaliate in a village',()=>{
 const g=game(),{guard}=arena(g),far=g.npcs.find(n=>n.batracien?.role&&n.site==='town-73');const hp=g.player.hp;
 assert.equal(g.isHostileBatracien(guard),false);g.damageBatracienGuard(guard,1,g.player);assert.equal(g.isHostileBatracien(guard),false);g.damageBatracienGuard(guard,1,g.player);assert.equal(g.isHostileBatracien(guard),true);assert.equal(g.isHostileBatracien(far),false);
 g.targetId=guard.id;assert.equal(g.target(),guard);assert.ok(g.combatTargets().includes(guard));assert.equal(g.talkTo(guard),true);assert.ok(g.dialogue.menu.options.some(o=>o.label==='Se rendre'));g.dialogue=null;
 g.inSafe=()=>({x:g.player.x,y:g.player.y});for(let i=0;i<120;i++){g.time+=.04;g.stepBatracienWardens(.04);}assert.ok(g.player.hp<hp);
});
test('nearby civilian injury or a fatal first hit triggers witnesses, including a human civilian',()=>{
 for(const fatal of [false,true]){const g=game(),{guard,civil}=arena(g);Object.assign(civil,{x:guard.x+28,y:guard.y});g.damageCivilian(civil,fatal?99:1,g.player);if(!fatal){assert.equal(g.isHostileBatracien(guard),false);civil.civilian.inv=0;g.damageCivilian(civil,1,g.player);}assert.equal(g.isHostileBatracien(guard),true);assert.equal(civil.civilian.dead,fatal);}
 const g=game(),{guard}=arena(g),human=g.npcs.find(n=>n.civilian&&!n.batracien&&n.id!=='elyne');Object.assign(human,{x:guard.x+24,y:guard.y,level:0});g.damageCivilian(human,1,g.player);human.civilian.inv=0;g.damageCivilian(human,1,g.player);assert.ok(g.isHostileBatracien(guard));
});
test('monster damage, unseen assaults and other floors never accuse the player',()=>{
 // Perception is tested without another staffed contact filing its own testimony.
 const g=game(),{guard,civil}=arena(g);g.npcs=[guard,civil];Object.assign(civil,{x:guard.x+28,y:guard.y});g.damageCivilian(civil,1,{x:civil.x+10,y:civil.y,level:0,kind:'snake'});assert.equal(g.isHostileBatracien(guard),false);
 civil.civilian.inv=0;g.lineClear=()=>false;g.damageCivilian(civil,1,g.player);assert.equal(g.isHostileBatracien(guard),false);
 g.lineClear=()=>true;guard.level=1;civil.civilian.inv=0;g.damageCivilian(civil,1,g.player);assert.equal(g.isHostileBatracien(guard),false);
});
test('guards use native player power, riposte consumption, hit pause, blood and health without duplicate damage',()=>{
 const g=game(),{guard}=arena(g);g.player.riposte=1;const hp=guard.batracien.hp,power=g.power();g.damageEnemy(guard,1);
 assert.equal(guard.batracien.hp,Math.round((hp-2*power)*100)/100);assert.equal(guard.hp,guard.batracien.hp);assert.equal(g.player.riposte,0);assert.ok(g.player.hitPause>0);assert.ok(g.bloodFX.some(f=>!f.bone&&!f.fatal));assert.ok(guard.flash>0);
});
test('shield blocks are not bleeding wounds, and heavy blows break guard',()=>{
 const g=game(),{guard}=arena(g);guard.batracien.action='guard';guard.dir=1;g.player.combo=0;const hp=guard.batracien.hp,fx=g.bloodFX.length;g.damageEnemy(guard,1);
 assert.equal(guard.batracien.hp,hp);assert.equal(g.bloodFX.length,fx);assert.equal(g.isHostileBatracien(guard),false);guard.batracien.action='guard';g.player.combo=3;g.damageEnemy(guard,2);assert.ok(guard.batracien.hp<hp);assert.ok(g.bloodFX.length>fx);
});
test('parrying an angry guard or its javelin interrupts the same attack and selects it',()=>{
 const g=game(),{guard}=arena(g);g.reportBatracienAssault(guard,g.player);g.player.dir=3;g.player.guard=true;g.player.parry=.18;guard.batracien.action='thrust';guard.batracien.elapsed=.1;guard.batracien.targetId='player';guard.batracien.lockedDir=1;
 assert.equal(g.defend(guard),true);assert.ok(guard.stun>0);assert.equal(g.targetId,guard.id);g.stepBatracienWardens(.04);assert.equal(guard.batracien.action,'hit');
 g.player.parry=.18;guard.stun=0;const shot={x:guard.x+2,y:guard.y,level:0,owner:guard.id,life:1};assert.equal(g.defend(shot),true);assert.ok(guard.stun>0);assert.equal(shot.life,0);
});
test('law javelins target the attacker, never allied guards or innocent people',()=>{
 const g=game(),{civil}=arena(g),guard=g.npcs.find(n=>n.batracien?.role==='scout');Object.assign(guard,{x:g.player.x-28,y:g.player.y,level:0});guard.post={x:guard.x,y:guard.y};g.reportBatracienAssault(guard,g.player);guard.batracien.lockedDir=1;
 Object.assign(civil,{x:guard.x+14,y:guard.y,level:0});const hp=civil.civilian.hp,pHP=g.player.hp;g.launchBatracienJavelin(guard,g.player);assert.equal(g.batracienMissiles[0].law,true);g.batracienMissiles[0].vx=1000;g.stepBatracienMissiles(.04);assert.equal(civil.civilian.hp,hp);assert.equal(g.player.hp,pHP-1);
});
test('civilians bleed and leave stains using enemy blood FX, without XP or duplicated corpses',()=>{
 const g=game(),{civil}=arena(g);const xp=g.player.xp,kills=g.player.kills;g.damageCivilian(civil,99,g.player);
 assert.equal(g.bloodFX.length,2);assert.equal(g.bloodFX[0].fatal,false);assert.equal(g.bloodFX[1].fatal,true);assert.equal(g.bloodFX[1].bone,false);g.updateEffects(.5);assert.ok(g.blood.length>0);assert.equal(g.player.xp,xp);assert.equal(g.player.kills,kills);assert.ok(!g.remains.some(r=>r.x===civil.x&&r.y===civil.y));
});
test('anger survives saves, local warrants outlast anger, and both expire by world clock',()=>{
 const g=game(),{guard}=arena(g);g.damageBatracienGuard(guard,1,g.player);g.damageBatracienGuard(guard,1,g.player);const save=json(g.serialize()),copy=new api.Game(save),n=copy.npcs.find(a=>a.id===guard.id);assert.ok(copy.isHostileBatracien(n));assert.equal(n.batracien.hp,guard.batracien.hp);
 copy.clock=n.batracien.hostileUntil+.01;assert.equal(copy.justiceEffect(n).wanted,true);assert.equal(copy.isHostileBatracien(n),true);
 copy.clock=Math.max(...copy.worldState.justice.state.cases.map(c=>c.wantedUntil))+.01;assert.equal(copy.justiceEffect(n).wanted,false);assert.equal(copy.isHostileBatracien(n),false);assert.ok(!copy.combatTargets().includes(n));
 const row=save.atlas.batraciens.people.find(a=>a.id===guard.id);row.hostileUntil=Infinity;const bad=new api.Game(save);assert.ok(Number.isFinite(bad.npcs.find(a=>a.id===guard.id).batracien.hostileUntil));
});
test('one real sword swing damages an angry guard once through the shared enemy target loop',()=>{
 const g=game(),{guard}=arena(g);g.npcs=[guard];g.atlasNpcs=[guard];g.reportBatracienAssault(guard,g.player);guard.batracien.cooldown=9;guard.stun=.9;guard.batracien.action='hit';guard.batracien.elapsed=0;g.player.dir=3;g.player.inv=10;g.player.combo=-1;g.player.comboWindow=1;g.player.attackCD=0;g.swingSword();const hp=guard.batracien.hp;
 tick(g,.6);assert.equal(guard.batracien.hp,Math.round((hp-g.power())*100)/100);assert.ok(g.hits.has(guard.id));
});
test('walls and leash end pursuit; teleporting across floors cannot produce a late hit',()=>{
 const g=game(),{guard}=arena(g);g.reportBatracienAssault(guard,g.player);assert.equal(g.batracienWardenTarget(guard),g.player);g.lineClear=()=>false;assert.equal(g.batracienWardenTarget(guard),null);g.lineClear=()=>true;g.player.x=guard.post.x+1000;assert.equal(g.batracienWardenTarget(guard),null);
 Object.assign(guard.batracien,{action:'thrust',elapsed:.3,targetId:'player',lockedDir:1,contactDone:false});Object.assign(g.player,{x:guard.x+22,y:guard.y,level:1,inv:0});const hp=g.player.hp;g.stepBatracienWardens(.1);assert.equal(g.player.hp,hp);
});
test('combat blocks both a prepared transport and sleep without spending money or advancing time',()=>{
 const g=game(),{guard}=arena(g);g.reportBatracienAssault(guard,g.player);g.restTent=()=>({rest:true});const c=g.clock,coins=g.player.coins;assert.equal(g.startJourney({to:'town-73'}),false);assert.equal(g.sleep(1440),false);assert.equal(g.clock,c);assert.equal(g.player.coins,coins);
});
test('distant road travellers leave their stop, advance on land only, and never enter the visible area by fast-forward',()=>{
 const g=game(),n=g.npcs.find(n=>n.id==='resident-batracien-town-55-4'),r=n.batracien.routine,path=S.route(n.id),leg=path.segments.findIndex(s=>s.length>2400);assert.ok(leg>=0);g.solid=()=>false;g.lineClear=()=>true;r.wait=0;r.approach=false;r.edge=leg;r.progress=160;
 Object.assign(n,S.roadPoint(path,leg,160));n.post={x:n.x,y:n.y};const old={x:n.x,y:n.y};Object.assign(g.player,S.roadPoint(path,leg,2200));g.atlasLastClock=g.clock;g.clock+=1;g.advanceAtlas(0);
 assert.ok(Math.hypot(n.x-old.x,n.y-old.y)>0);assert.ok(Math.hypot(n.x-g.player.x,n.y-g.player.y)>=999);assert.equal(r.edge,leg);assert.ok(r.progress>160&&r.progress<2200);
});
