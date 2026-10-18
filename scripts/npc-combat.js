/* Hearthreaver: everyone who fights can be hurt, and fighters answer each other.
 * Human patrol guards ("LA GARDE") get health, a wind-up strike, the frog wardens'
 * anger rule and a corpse. World enemies fight back against the guards that engage
 * them instead of only ever targeting Kaldor. Civilian flight lives in world-danger.js.
 * Story enemies keep their player-only AI: guards never complete Kaldor's kill quests.
 */
const NpcCombat=(()=>{
 'use strict';
 const C=Object.freeze({
  guard:{hp:8,reach:26,windup:.36,cooldown:1.4,damage:1,sight:150,leash:230,pursuit:380,view:220,anger:180,witness:220,active:700,speed:1.25},
  foe:{sight:110,memory:6,leash:240,active:700}
 });
 const human=n=>!!n?.eventGuard&&!n.batracien;
 BODY.guard=BODY.npc;
 Game.prototype.isHumanGuard=function(n){return human(n);};
 Game.prototype.ensureHumanGuard=function(n){
  if(!human(n))return null;
  if(!n.guardState){n.guardState={hp:C.guard.hp,maxHp:C.guard.hp,dead:false,inv:0,hostileUntil:0,targetId:null,strikeId:null};Object.assign(n,{kind:'guard',r:6,damage:C.guard.damage,cooldown:.6,post:n.post||{x:n.x,y:n.y}});}
  if(!n.guardRestored){n.guardRestored=true;const r=this.guardRecords?.get(n.id);if(r){n.guardState.hp=clamp(r.hp,0,C.guard.hp);n.guardState.dead=r.hp<=0;n.guardState.hostileUntil=clamp(r.hostileUntil||0,0,this.clock+C.guard.anger);
   if(Number.isFinite(r.x)&&Number.isFinite(r.y)&&dist(n,r)<900&&!this.solid(r.x,r.y,6,0)){n.x=r.x;n.y=r.y;n.post={x:r.x,y:r.y};}
  }}
  return n.guardState;
 };
 Game.prototype.humanGuardAlive=function(n){return human(n)&&!n.guardState?.dead&&(n.alpha??1)>.5;};
 Game.prototype.isHostileHumanGuard=function(n){return this.humanGuardAlive(n)&&(n.guardState?.hostileUntil||0)>this.clock;};
 // Fighters that monsters answer: frog wardens and human patrols, angry or not.
 function fighters(g){
  if(g._fighterTime!==g.time){g._fighterTime=g.time;g._fighters=g.npcs.filter(n=>(n.batracien?.role?!n.batracien.dead&&!n.dead:g.humanGuardAlive(n))&&(n.alpha??1)>.5&&dist(n,g.player)<C.foe.active);}
  return g._fighters;
 }

 Game.prototype.damageHumanGuard=function(n,amount,source){
  const s=this.ensureHumanGuard(n);if(!s||s.dead||(n.alpha??1)<.5||!Number.isFinite(amount)||amount<=0||source&&!this.sameLevel(n,source))return false;
  const p=this.player,playerHit=source===p;if(!playerHit&&s.inv>0)return false;
  if(playerHit){this.reportBatracienAssault(n,p);amount*=this.power();if(p.riposte>0){amount+=1;p.riposte=0;}p.hitPause=p.combo===3?.075:.04;if(!this.target())this.targetId=n.id;}
  s.hp=Math.max(0,Math.round((s.hp-amount)*100)/100);if(s.hp<.05)s.hp=0;s.inv=playerHit?0:.5;
  n.flash=.075;n.hurt=n.hurtDuration=.24;n.stun=Math.max(n.stun||0,.24);n.wind=n.attack=0;
  const from=Number.isFinite(source?.x)?source:n,d=Math.max(1,dist(n,from));if(from!==n)this.move(n,(n.x-from.x)/d*6,(n.y-from.y)/d*6);
  const owner=source?.owner?this.enemies.find(e=>e.id===source.owner):source;if(owner&&this.enemies.includes(owner))s.targetId=owner.id;
  this.spill(n,from,false);this.emit('hit',{heavy:playerHit&&p.combo===3});
  if(!s.hp){s.dead=true;this.spill(n,from,true);this.atlasDeaths[n.id]=true;this.guardRecords||=new Map();this.guardRecords.set(n.id,{id:n.id,eventId:n.eventId,x:n.x,y:n.y,hp:0,hostileUntil:s.hostileUntil});this.npcs=this.npcs.filter(a=>a!==n);
   if(this.dialogue?.who===n)this.dialogue=null;if(this.targetId===n.id)this.targetId=null;this.emit('bodyfall');}
  this.emit('save');return true;
 };

 // An assault seen by a patrol angers it like the frog wardens; witnesses run away.
 const report=Game.prototype.reportBatracienAssault;
 Game.prototype.reportBatracienAssault=function(victim,source){
  const alerted=report.call(this,victim,source);
  if(source!==this.player||!victim||!this.npcs.includes(victim)||!this.sameLevel(victim,source))return alerted;
  this.alarmWitnesses(victim,source);let fresh=false;
  for(const n of this.npcs){if(!this.humanGuardAlive(n)||!this.sameLevel(n,victim))continue;
   if(n!==victim&&(dist(n,victim)>C.guard.witness||!this.lineClear(n,victim)&&!this.lineClear(n,source)))continue;
   const s=this.ensureHumanGuard(n);if(s.hostileUntil<=this.clock){fresh=true;n.cooldown=Math.min(n.cooldown||0,.5);}
   s.hostileUntil=this.clock+C.guard.anger;if(this.dialogue?.who===n)this.dialogue=null;
  }
  if(fresh&&!alerted){this.emit('save');this.emit('notice',{title:'Les gardes interviennent',text:'Une agression a été vue. Éloigne-toi et cesse le combat pour les semer.'});}
  return alerted||fresh;
 };
 const targets=Game.prototype.combatTargets;
 Game.prototype.combatTargets=function(){return [...targets.call(this),...this.npcs.filter(n=>this.isHostileHumanGuard(n))];};
 const damageEnemy=Game.prototype.damageEnemy;
 Game.prototype.damageEnemy=function(n,amount){if(human(n)&&this.npcs.includes(n))return this.damageHumanGuard(n,amount,this.player);return damageEnemy.call(this,n,amount);};
 const present=Game.prototype.npcPresent;
 Game.prototype.npcPresent=function(n){return !(human(n)&&(n.guardState?.dead||this.isHostileHumanGuard(n)))&&present.call(this,n);};
 const talk=Game.prototype.talkTo;
 Game.prototype.talkTo=function(n){if(human(n)&&(n.guardState?.dead||this.isHostileHumanGuard(n)))return false;return talk.call(this,n);};

 Game.prototype.humanGuardTarget=function(n,s){
  const p=this.player;
  if(this.isHostileHumanGuard(n)&&!this.dead&&!this.dying&&this.sameLevel(n,p)&&dist(n,n.post)<C.guard.pursuit&&dist(n,p)<C.guard.view&&this.lineClear(n,p))return p;
  let e=s.targetId?this.enemies.find(e=>e.id===s.targetId&&!e.dead&&!e.retiring):null;
  if(e&&(!this.sameLevel(e,n)||dist(e,n)>C.guard.sight*1.5)){e=null;}if(!e)s.targetId=null;
  return e||this.enemies.filter(e=>!e.dead&&e.world&&!e.retiring&&!e.friendly&&this.sameLevel(n,e)&&dist(n,e)<C.guard.sight&&dist(e,n.post)<C.guard.leash&&this.lineClear(n,e)).sort((a,b)=>dist(a,n)-dist(b,n))[0]||null;
 };
 Game.prototype.stepHumanGuards=function(dt){
  const p=this.player,events=new Set((this.danger?.events||[]).map(e=>e.id));
  for(const n of this.npcs){
   if(!human(n))continue;const s=this.ensureHumanGuard(n);if(s.dead)continue;
   for(const k of ['flash','hurt','stun','cooldown','attack'])n[k]=Math.max(0,(n[k]||0)-dt);s.inv=Math.max(0,s.inv-dt);
   if(dist(n,p)>C.guard.active||!events.has(n.eventId)&&!n.guardRetiring||(n.alpha??1)<1){n.wind=0;n.anim=0;continue;}
   if(n.stun>0||n.hurt>0){n.wind=0;continue;}
   if(n.wind>0){n.wind-=dt;n.anim=0;if(n.wind<=0){n.wind=0;
     const foe=s.strikeId==='player'?p:this.enemies.find(e=>e.id===s.strikeId&&!e.dead);
     if(foe&&this.sameLevel(n,foe)&&dist(n,foe)<=C.guard.reach+8&&this.lineClear(n,foe)){if(foe!==p)this.guardStrike(n,foe);else if(this.isHostileHumanGuard(n))this.damagePlayer(C.guard.damage,n);}
     n.attack=ATTACK_DURATION-.12;n.cooldown=Math.max(n.cooldown,C.guard.cooldown);}
    continue;}
   if(n.attack>0){n.anim=0;continue;}
   const t=this.humanGuardTarget(n,s);
   if(!t){if(dist(n,n.post)>4)this.walkNpc(n,n.post,dt);else n.anim=0;continue;}
   const d=dist(n,t);n.dir=this.direction(t.x-n.x,t.y-n.y);
   if(d<=C.guard.reach&&n.cooldown<=0&&this.lineClear(n,t)){n.wind=n.windup=C.guard.windup;s.strikeId=t===p?'player':t.id;n.anim=0;this.foeSound(n,'melee','cultist');continue;}
   if(d>C.guard.reach-6)this.walkNpc(n,t,dt*C.guard.speed);else n.anim=0;
  }
 };

 // Monsters remember the guard that hit them and answer it with their own moves.
 const strike=Game.prototype.guardStrike;
 Game.prototype.guardStrike=function(n,e){const hp=e?.hp;const result=strike.call(this,n,e);if(e&&!e.dead&&e.hp<hp){e.foeId=n.id;e.foeAt=this.time;}return result;};
 Game.prototype.fightNpcFoe=function(e,dt){
  if(!e.world||e.retiring||e.friendly||e.batracien||e.kind==='boss'||e.guardTime>0)return false;
  // A wind-up, punch or sceptre blow aimed at Kaldor finishes with the original rules.
  if(e.move&&!e.foeMove||e.wind>0&&!e.foeWind||e.melee>0&&!e.foeMelee)return false;
  const p=this.player,F=C.foe,K=AI[e.kind]||AI.skeleton,list=[...fighters(this),...(this.worldBanditVictims?.(e)||[])];
  let foe=e.foeId?list.find(n=>n.id===e.foeId):null;
  if(foe&&(!this.sameLevel(e,foe)||dist(e,foe)>F.leash||this.time-(e.foeAt||0)>F.memory))foe=null;
  if(!foe)foe=list.filter(n=>this.sameLevel(e,n)&&dist(e,n)<F.sight&&this.lineClear(e,n)).sort((a,b)=>dist(a,e)-dist(b,e))[0]||null;
  const busy=e.foeMove&&e.move||e.foeWind&&e.wind>0||e.foeMelee&&e.melee>0;
  if(!foe&&!busy){e.foeId=null;return false;}
  if(foe&&!busy){const dp=this.sameLevel(e,p)&&!this.dying&&!this.dead?dist(e,p):Infinity;if(dp<=dist(e,foe)&&(e.ai==='chase'||dp<K.feel))return false;}
  if(foe){if(e.foeId!==foe.id){e.foeId=foe.id;if(foe.civilian&&!foe.eventGuard&&!foe.batracien?.role){this.startCivilianFlight(foe,e);this.alarmWitnesses(foe,e);}}if(dist(e,foe)<F.sight&&this.lineClear(e,foe))e.foeAt=this.time;}
  const t=foe,d=t?dist(e,t):Infinity,hx=t?t.x-e.x:0,hy=t?t.y-e.y:0;
  if(e.kind==='guardian'){
   if(e.move){const M=CO_MOVES[e.move];e.mt+=dt;let f=0;while(f<5&&e.mt>=M.f[f+1])f++;e.mframe=f;
    if(!e.hitDone&&e.mt>=M.hit){e.hitDone=true;const face=this.facing(e.dir),dp=dist(e,p),dot=((p.x-e.x)*face[0]+(p.y-e.y)*face[1])/Math.max(1,dp);
     if(e.move==='slam'){(this.waves??=[]).push({x:e.x+face[0]*14,y:e.y+face[1]*8,t0:this.time,level:e.level||0});this.emit('hit',{heavy:true});
      for(let i=0;i<16;i++){const a=i/16*Math.PI*2,sp=40+(i%4)*14;this.particles.push({level:e.level||0,x:e.x+face[0]*14+Math.cos(a)*6,y:e.y+face[1]*8+Math.sin(a)*3,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp*.55,life:.35+(i%3)*.08,size:1+(i%3===0?1:0),color:i%2?'#b49a74':'#7a6448'});}
      if(dp<50&&this.sameLevel(e,p))this.damagePlayer(1,{x:e.x,y:e.y,level:e.level||0,unblockable:true});}
     else if(dp<44&&dot>.25&&this.lineClear(e,p))this.damagePlayer(2,e);}
    if(e.mt>=M.end){e.move=null;e.foeMove=false;e.mframe=0;e.cooldown=M.cd;}
    e.anim=0;return true;}
   if(t&&e.cooldown<=0&&d<52&&this.lineClear(e,t)){e.move=d<36&&Math.random()<.6?'punch':'slam';e.foeMove=true;e.mt=0;e.mframe=0;e.hitDone=false;e.dir=this.direction(hx,hy);this.foeSound(e,'strike');e.anim=0;return true;}
  }
  if(e.melee>0){e.melee-=dt;const pr=1-e.melee/e.meleeDur;
   if(!e.meleeHit&&pr>=.55){e.meleeHit=true;if(this.sameLevel(e,p)&&dist(e,p)<27&&this.lineClear(e,p))this.damagePlayer(e.damage,e);}
   if(e.melee<=0){e.melee=0;e.foeMelee=false;e.cooldown=Math.max(e.cooldown,.7);}e.anim=0;return true;}
  if(e.wind>0){e.wind-=dt;if(!e.sfxPre&&e.kind!=='cultist'&&e.wind<=(e.kind==='snake'?.19:.08)){e.sfxPre=true;this.foeSound(e,'strike');}
   if(e.wind<=0){e.wind=0;e.foeWind=false;e.attack=ATTACK_DURATION-.12;
    if(e.kind==='cultist'){this.fire(e,Math.atan2(e.attackY-e.y,e.attackX-e.x),112);this.burst(e.x+(e.dir===1?7:e.dir===3?-7:e.dir===0?-6:7),e.y-27,'#d4e5a0',7);this.foeSound(e,'strike');}
    else if(this.sameLevel(e,p)&&dist(e,p)<e.reach+10&&this.lineClear(e,p))this.damagePlayer(e.damage,e);
    e.cooldown=e.kind==='snake'?1.1:1.45;}
   e.anim=0;return true;}
  if(e.attack>0){e.anim=0;return true;}
  if(!t)return false;
  e.dir=this.direction(hx,hy);
  if(e.kind==='cultist'){e.meleeCD=Math.max(0,(e.meleeCD||0)-dt);if(d<23&&e.meleeCD<=0&&this.lineClear(e,t)){e.melee=e.meleeDur=.55;e.meleeHit=false;e.foeMelee=true;e.meleeCD=1.4;this.foeSound(e,'melee');return true;}}
  if(e.kind!=='guardian'&&d<e.reach&&e.cooldown<=0&&this.lineClear(e,t)){e.wind=e.windup;e.foeWind=true;e.sfxPre=false;e.attackX=t.x;e.attackY=t.y;if(e.kind==='cultist')this.foeSound(e,'wind');return true;}
  const keep=e.kind==='guardian'?30:Math.max(12,e.reach-8);
  if(d>keep){const ox=e.x,oy=e.y;this.moveFoe(e,hx/d*e.speed*dt,hy/d*e.speed*dt);const moved=Math.hypot(e.x-ox,e.y-oy);e.anim=moved>.001?e.anim+moved/3:0;}else e.anim=0;
  return true;
 };

 // Blade, monster strikes, spells and orbs reach patrol guards like every other person.
 const combat=Game.prototype.civilianCombat;
 Game.prototype.civilianCombat=function(dt,before){
  combat.call(this,dt,before);const p=this.player,guards=this.npcs.filter(n=>this.humanGuardAlive(n)&&dist(n,p)<C.guard.active);if(!guards.length)return;
  if(p.attack>0){const f=attackFrame(p.attack,p.combo);if(f===2||f===3)for(const n of guards){if(this.hits.has(n.id)||!this.sameLevel(p,n)||!bladeHits(p,n,f)||!this.lineClear(p,n))continue;this.hits.add(n.id);this.damageHumanGuard(n,p.combo===3?2:1,p);}}
  for(const e of this.enemies){const prev=before.get(e);if(!prev||e.dead||e.friendly||e.batracien)continue;
   const melee=prev.melee>0&&!prev.meleeHit&&e.meleeHit,blow=prev.wind>0&&e.wind<=0&&e.kind!=='cultist',heavy=e.kind==='guardian'&&e.move&&!prev.hitDone&&e.hitDone;
   if(!melee&&!blow&&!heavy)continue;const [fx,fy]=this.facing(e.dir);
   for(const n of guards){if(!this.sameLevel(e,n))continue;const d=dist(n,e),dot=((n.x-e.x)*fx+(n.y-e.y)*fy)/Math.max(1,d);
    if(d<(heavy?e.move==='slam'?50:44:melee?27:(e.reach||20)+8)&&(heavy&&e.move==='slam'||dot>-.05)&&this.lineClear(e,n))this.damageHumanGuard(n,heavy?2:e.damage||1,e);}
  }
  for(const h of this.hazards){if(h.delay>0||h.life<=0)continue;h.humanGuardHits??=new Set();for(const n of guards)if(!h.humanGuardHits.has(n.id)&&this.sameLevel(h,n)&&dist(h,n)<(h.r||18)&&this.lineClear(h,n)){h.humanGuardHits.add(n.id);this.damageHumanGuard(n,2,h);}}
 };
 const projectiles=Game.prototype.civilianProjectiles;
 Game.prototype.civilianProjectiles=function(dt){
  const guards=this.npcs.filter(n=>this.humanGuardAlive(n));
  if(guards.length)for(const s of this.shots){if(s.life<=0)continue;const dx=s.vx*dt,dy=s.vy*dt,L=dx*dx+dy*dy;
   for(const n of guards){if(!this.sameLevel(n,s))continue;const u=L?clamp(((n.x-s.x)*dx+(n.y-s.y)*dy)/L,0,1):0;
    if(Math.hypot(n.x-s.x-dx*u,n.y-s.y-dy*u)<7&&this.lineClear(s,n)){this.damageHumanGuard(n,s.damage||1,s);s.life=0;break;}}}
  return projectiles.call(this,dt);
 };
 const update=Game.prototype.update;
 Game.prototype.update=function(dt,input){
  const running=!this.dialogue&&!this.journey&&!this.sleeping&&!this.dying&&!this.dead&&!this.won;update.call(this,dt,input);
  if(running&&!this.journey)this.stepHumanGuards(clamp(Number(dt)||0,0,.04));
 };

 // Health bar, anger mark and lock-on ring, as drawn over monsters and frog wardens.
 const draw=Renderer.prototype.npcDraw;
 Renderer.prototype.npcDraw=function(n){
  draw.call(this,n);if(!human(n)||!n.guardState||(n.alpha??1)<=0)return;const s=n.guardState,c=this.c;
  if(this.g.targetId===n.id)this.targetRing(n.x,n.y,12);
  if(s.hp<s.maxHp){box(c,n.x-9,n.y-30,18,3,PAL.ink);box(c,n.x-8,n.y-29,Math.ceil(16*s.hp/s.maxHp),1,'#cda46d');}
  if(this.g.isHostileHumanGuard(n))text(c,'!',n.x-2,n.y-46,'#edb279');
 };
 return Object.freeze({config:C});
})();
