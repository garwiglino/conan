/* Human civilians consume world-danger's placement, retreat and return states.
   No independent danger field, hostile AI or civilian attack action is introduced. */
const CIVILIAN_JOB_NAMES={hoe:'CULTIVATEUR',sow:'PAYSAN',craft:'ARTISAN',pottery:'POTIER',weave:'VANNIER',stir:'TEINTURIER',net:'FILETIER',groom:'PALEFRENIER',load:'CARAVANIER',rope:'BATELIER',ledger:'MAÎTRE DE PORT',carry:'PORTEUR'};
const civilianEligible=n=>n.id!=='fairy'&&!n.eventGuard&&!n.convoyGuard;
const civilianDuration=id=>(CIVILIAN_ART.clips[id]?.durations||[1000]).reduce((a,b)=>a+b,0)/1000;
Game.prototype.ensureCivilian=function(n,record){
 if(!civilianEligible(n))return null;if(n.civilian)return n.civilian;
 const appearance=civilianAppearance(this,n,record?.appearance),outfit=CIVILIAN_ART.outfits[appearance.outfit],seed=civilianHash(n.id);
 const c=n.civilian={appearance,job:n.id==='elyne'?'idle':n.civilianJob||outfit.job,action:'idle',elapsed:seed%100/100,distance:0,hp:6,dead:false,inv:0,lastX:n.x,lastY:n.y,restClock:seed%50};
 if(record){if(Number.isFinite(record.hp))c.hp=clamp(record.hp,0,6);c.dead=record.dead===true;if(c.dead)c.hp=0;if(Number.isFinite(record.distance))c.distance=Math.max(0,record.distance)%100000;
  if(c.dead){c.action='death';c.elapsed=civilianDuration('death');n.alpha=1;delete n.dangerState;
   if(Number.isFinite(record.x)&&Number.isFinite(record.y)&&Math.hypot(record.x-n.x,record.y-n.y)<2000){n.x=record.x;n.y=record.y;}if([0,1,2,3].includes(record.dir))n.dir=record.dir;c.lastX=n.x;c.lastY=n.y;}}
 if(!n.post)n.post={x:n.x,y:n.y};return c;
};
Game.prototype.civilianAction=function(n,action,restart=false){const c=this.ensureCivilian(n);if(!c)return;if(!CIVILIAN_ART.clips[action])action='idle';if(c.action!==action||restart){c.action=action;c.elapsed=0;}};
Game.prototype.populateCivilians=function(saved){
 this.civilianRecords??=Object.create(null);this.civilianSites??=new Set();
 if(saved?.civilians?.version===1)for(const row of (Array.isArray(saved.civilians.people)?saved.civilians.people:[]).slice(0,1000))if(row&&typeof row.id==='string'&&/^(resident-|relay-|courier-|veilleur$|zahra$|elyne$)/.test(row.id))this.civilianRecords[row.id]=row;
 for(const site of Atlas.nodes.filter(n=>n.rest&&n.kind!=='dock')){
  const centre=Atlas.toGame(site.x,site.y);if(this.civilianSites.has(site.id))continue;const observer=saved?.player||this.player;if(site.kind==='relay'&&dist(centre,observer)>1500&&!this.stations?.some(s=>s.site===site.id&&s.actor.civilian?.critical))continue;
  // Place only on real walkable settlement ground, away from enemies and doors.
  let made=0;
  for(let slot=0;slot<2;slot++){
   const id='resident-'+site.id+'-'+slot;if(this.npcs.some(n=>n.id===id)){made++;continue;}
   const seed=civilianHash(id);let pos;
   for(let j=0;j<32;j++){
    const angle=((seed%24)+j)/24*Math.PI*2,r=40+Math.floor(j/8)*16,p={x:centre.x+Math.round(Math.cos(angle)*r),y:centre.y+Math.round(Math.sin(angle)*r)};
    const entrances=[...this.world.props,...this.atlasProps].filter(o=>o.rest).some(o=>Math.hypot(p.x-o.x,p.y-o.y-16)<42);
    const mechanisms=[...this.levers,...this.steles,...this.chests].some(o=>dist(o,p)<30);
    if(entrances||mechanisms||this.solid(p.x,p.y,6,0)||this.localThreatAt(p.x,p.y,0,CIVILIAN_SPAWN_MARGIN)||this.npcs.some(n=>dist(n,p)<24))continue;
    const w=Atlas.toWorld(p.x,p.y);if(this.ensureDanger().atPoint(w.x,w.y).unsafe)continue;pos=p;break;
   }
   if(!pos)continue;
   const actor={id,...pos,post:{...pos},dir:2,baseDir:2,look:'nomade',head:30,alpha:1,world:true,site:site.id,resident:true,
    name:'HABITANT',label:'HABITANT',title:'Habitant de '+site.name,greet:()=>['Le travail nous attend. Fais attention sur les routes.'],topics:()=>[],bye:()=>['Bonne route.']};
   this.npcs.push(actor);this.atlasNpcs.push(actor);const c=this.ensureCivilian(actor,this.civilianRecords[id]);actor.name=actor.label=CIVILIAN_JOB_NAMES[c.job]||'HABITANT';made++;
  }
  if(made===2)this.civilianSites.add(site.id);
 }
};
// Residents must exist before the existing companion restoration resolves IDs.
const civilianTravelInit=Game.prototype.initTravelParty;
Game.prototype.initTravelParty=function(saved){this.populateCivilians(saved);civilianTravelInit.call(this,saved);};
const civilianRestore=Game.prototype.finishAtlasRestore;
Game.prototype.finishAtlasRestore=function(saved){civilianRestore.call(this,saved);for(const n of this.npcs){const c=this.ensureCivilian(n,this.civilianRecords?.[n.id]);if(c?.dead){delete n.dangerState;n.alpha=1;n.phase='post';}}};
const civilianPresent=Game.prototype.npcPresent;
Game.prototype.npcPresent=function(n){return !n.civilian?.dead&&!['hit','startle','cower','death'].includes(n.civilian?.action)&&civilianPresent.call(this,n);};
const civilianBodies=Game.prototype.bodies;
Game.prototype.bodies=function(n){return civilianBodies.call(this,n).filter(a=>!a.civilian?.dead);};
const civilianTalk=Game.prototype.talkTo;
Game.prototype.talkTo=function(n){if(!n||n.civilian?.dead)return false;if(n.civilian)this.civilianAction(n,'talk');return civilianTalk.call(this,n);};
const civilianRecruit=Game.prototype.recruitCompanion;
Game.prototype.recruitCompanion=function(n,opts){return !n?.civilian?.dead&&civilianRecruit.call(this,n,opts);};
const civilianAssess=Game.prototype.assessCivilians;
Game.prototype.assessCivilians=function(force=false){
 const previous=new Set(this.npcs.filter(n=>n.dangerState).map(n=>n.id)),all=this.npcs;
 try{this.npcs=all.filter(n=>!n.civilian?.dead);civilianAssess.call(this,force);}finally{this.npcs=all;}
 for(const n of all)if(n.dangerState&&!previous.has(n.id)){const c=this.ensureCivilian(n);if(c&&!c.dead){this.civilianAction(n,c.action==='seated'||c.action==='sit_down'?'stand_up':'startle');c.alarmed=true;}}
};
const civilianWalk=Game.prototype.walkNpc;
Game.prototype.npcMoveLocked=function(n){const c=n?.civilian;return !!c&&(c.dead||c.critical||c.action==='seated'||['hit','startle','sit_down','stand_up'].includes(c.action)&&c.elapsed<civilianDuration(c.action));};
Game.prototype.walkNpc=function(n,to,dt){
 const c=this.ensureCivilian(n);if(c&&(c.dead||c.critical||['hit','startle','sit_down','stand_up'].includes(c.action)&&c.elapsed<civilianDuration(c.action)))return false;
 if(c&&c.action==='seated'){this.civilianAction(n,'stand_up');return false;}
 return civilianWalk.call(this,n,to,dt*({leaving:2.1,fleeing:CIVILIAN_FLIGHT.speed}[n.dangerState?.mode]||1));
};
const civilianStepNpcs=Game.prototype.stepNpcs;
Game.prototype.stepNpcs=function(dt){const all=this.npcs;try{this.npcs=all.filter(n=>!n.civilian?.dead);civilianStepNpcs.call(this,dt);}finally{this.npcs=all;}
 for(const n of all){const c=n.civilian;if(!c||c.dead||c.job!=='groom'||n.dangerState||this.dialogue||dist(n,this.player)>650||['hit','startle'].includes(c.action))continue;
  const horse=this.atlasProps.find(o=>o.kind==='transport_horse'&&o.site===n.site);if(!horse)continue;
  const target=c.restClock<26?{x:horse.x+21,y:horse.y-3}:n.post;
  if(this.localThreatAt(target.x,target.y)||this.solid(target.x,target.y,4,0))continue;
  if(dist(n,target)>2)this.walkNpc(n,target,dt);else if(c.restClock<26)n.dir=this.direction(horse.x-n.x,horse.y-n.y);
 }this.stepCivilianAnimations(dt);};
Game.prototype.damageCivilian=function(n,amount,source){
 const c=this.ensureCivilian(n);if(!c||c.dead||c.inv>0||!Number.isFinite(amount)||amount<=0||(n.alpha??1)<.5||source&&!this.sameLevel(n,source))return false;
 const member=this.party?.find(v=>v.id===n.id);if(member?.down)return false;c.inv=.9;
 if(member){member.hp=Math.max(0,member.hp-amount);member.down=member.hp===0;member.hitAt=this.time+2.5;c.hp=member.hp;}
 else{
  // Main quest givers and staffed routes remain recoverable; ordinary residents
  // have persistent deaths. This avoids destroying the only quest/travel service.
  const essential=['veilleur','zahra','elyne'].includes(n.id)||this.stations?.some(s=>s.actor===n);
  c.hp=Math.max(essential?1:0,c.hp-amount);c.dead=c.hp===0;
 }
 this.civilianAction(n,c.dead||member?.down?'death':'hit',true);n.anim=0;n.path=[];
 if(c.dead){delete n.dangerState;n.alpha=1;n.phase='post';}
 else if(source&&!member)this.startCivilianFlight(n,source);
 if(this.dialogue?.who===n)this.dialogue=null;
 this.emit('save');return true;
};
Game.prototype.civilianCombat=function(dt,before){
 const p=this.player,near=this.npcs.filter(n=>n.civilian&&!n.civilian.dead&&(n.alpha??1)>.5&&dist(n,p)<650);
 if(p.attack>0){const f=attackFrame(p.attack,p.combo);if(f===2||f===3)for(const n of near){if(this.hits.has(n.id)||!this.sameLevel(p,n)||!bladeHits(p,n,f)||!this.lineClear(p,n))continue;this.hits.add(n.id);this.damageCivilian(n,p.combo===3?2:1,p);}}
 for(const e of this.enemies){const old=before.get(e);if(!old||e.dead||e.friendly)continue;
  const melee=old.melee>0&&!old.meleeHit&&e.meleeHit,strike=old.wind>0&&e.wind<=0&&e.kind!=='cultist',heavy=e.kind==='guardian'&&e.move&&!old.hitDone&&e.hitDone;
  if(!melee&&!strike&&!heavy)continue;
  const [fx,fy]=this.facing(e.dir);for(const n of near){if(this.party.some(c=>c.id===n.id))continue;const d=dist(n,e),dot=((n.x-e.x)*fx+(n.y-e.y)*fy)/Math.max(1,d);if(d<(heavy?e.move==='slam'?50:44:melee?27:(e.reach||24)+8)&&(heavy&&e.move==='slam'||dot>-.05)&&this.lineClear(e,n))this.damageCivilian(n,heavy?2:e.damage||1,e);}
 }
 for(const h of this.hazards){if(h.delay>0||h.life<=0)continue;h.civilianHits??=new Set();for(const n of near){if(h.civilianHits.has(n.id)||!this.sameLevel(h,n)||dist(h,n)>(h.r||18)||!this.lineClear(h,n))continue;h.civilianHits.add(n.id);this.damageCivilian(n,2,h);}}
};
Game.prototype.civilianProjectiles=function(dt){
 for(const shot of this.shots){if(shot.life<=0)continue;const dx=shot.vx*dt,dy=shot.vy*dt,L=dx*dx+dy*dy;
  for(const n of this.npcs){if(!n.civilian||n.civilian.dead||(n.alpha??1)<.5||!this.sameLevel(n,shot))continue;const t=L?clamp(((n.x-shot.x)*dx+(n.y-shot.y)*dy)/L,0,1):0;
   if(Math.hypot(n.x-shot.x-dx*t,n.y-shot.y-dy*t)<7&&this.lineClear(shot,n)){this.damageCivilian(n,shot.damage||1,shot);shot.life=0;break;}
  }
 }this.shots=this.shots.filter(s=>s.life>0);
};
Game.prototype.stepCivilianAnimations=function(dt){
 for(const n of this.npcs){if(n.batracien&&!n.batracien.role){this.stepBatracienCivilian(n,dt);continue;}const c=this.ensureCivilian(n);if(!c)continue;const delta=c.tickTime===this.time?0:dt;c.tickTime=this.time;c.inv=Math.max(0,c.inv-delta);c.elapsed+=delta;
  const moved=Math.hypot(n.x-c.lastX,n.y-c.lastY);c.lastX=n.x;c.lastY=n.y;const member=this.party?.find(v=>v.id===n.id);if(moved>.01&&moved<20){c.distance+=moved;c.moveTime=this.time;}
  if(member){if(c.lastHP!==undefined&&member.hp<c.lastHP)this.civilianAction(n,member.down?'death':'hit',true);c.lastHP=member.hp;if(member.down){if(c.action!=='death')this.civilianAction(n,'death');continue;}if(c.action==='death')this.civilianAction(n,'stand_up');}
  if(c.dead)continue;
  if(c.critical){this.civilianAction(n,'cower');n.anim=0;n.path=[];continue;}
  if(['hit','death','startle','sit_down','stand_up'].includes(c.action)&&c.elapsed<civilianDuration(c.action))continue;
  if(this.dialogue?.who===n){this.civilianAction(n,'talk');continue;}
  if((n.alpha??1)<.1||n.phase==='away')continue;
  if(c.moveTime===this.time){this.civilianAction(n,['leaving','fleeing'].includes(n.dangerState?.mode)?'flee':'walk');n.anim=c.distance/(c.action==='flee'?16/3:4);continue;}
  if(n.dangerState){this.civilianAction(n,n.dangerState.mode==='returning'?'idle':'cower');continue;}
  if(member){this.civilianAction(n,'idle');continue;}
  c.restClock=(c.restClock+delta)%52;
  if(c.action==='sit_down'){this.civilianAction(n,'seated');continue;}
  if(c.action==='stand_up'){this.civilianAction(n,'idle');continue;}
  if(c.restClock>=38&&c.restClock<45){if(c.action!=='seated')this.civilianAction(n,'sit_down');continue;}
  if(c.action==='seated'){this.civilianAction(n,'stand_up');continue;}
  let job=c.job;
  const station=this.stations?.find(s=>s.actor===n);
  if(station)job=CIVILIAN_ART.outfits[c.appearance.outfit].cut.startsWith('TR')?c.job:'idle';
  if(job==='groom'&&!this.atlasProps.some(o=>o.kind==='transport_horse'&&dist(o,n)<26))job='ledger';
  if(c.restClock<26&&CIVILIAN_ART.outfits[c.appearance.outfit].frames[job])this.civilianAction(n,job);else this.civilianAction(n,'idle');
 }
};
const civilianUpdate=Game.prototype.update;
Game.prototype.update=function(dt,input){
 dt=clamp(dt,0,.04);const active=!this.dialogue&&!this.sleeping&&!this.dying&&!this.dead&&!this.journey,before=new Map();
 if(active){for(const e of this.enemies)before.set(e,{wind:e.wind,melee:e.melee,meleeHit:e.meleeHit,hitDone:e.hitDone});this.civilianProjectiles(dt);}
 civilianUpdate.call(this,dt,input);if(this.journey)return;
 if(active)this.civilianCombat(dt,before);this.stepCivilianAnimations(dt);
 if(this.time>(this.nextCivilianPopulation||0)){this.nextCivilianPopulation=this.time+10;this.populateCivilians();}
};
const civilianSerialize=Game.prototype.serialize;
Game.prototype.serialize=function(){const saved=civilianSerialize.call(this);if(!saved.atlas)return saved;
 const records={...this.civilianRecords};for(const n of this.npcs)if(n.civilian){const c=n.civilian;records[n.id]={id:n.id,appearance:{...c.appearance},hp:c.hp,dead:c.dead,distance:c.distance,x:n.x,y:n.y,dir:n.dir};}
 saved.atlas.civilians={version:1,people:Object.values(records).slice(-1000)};return saved;
};
