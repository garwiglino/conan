/* Local danger has one policy registry (Atlas.EVENT_TYPES). Simulation uses world
   metres; actors use game pixels. No global difficulty or faction reputation. */
class WorldDanger {
 constructor(game){this.game=game;this.cache=new Map();this.npcTick=-Infinity;}
 refresh(){
  const g=this.game,s=g.worldState,t=g.clock;
  if(this.state===s&&this.revision===s.revision&&this.minute===Math.floor(t)&&t>=this.at&&t<this.boundary)return;
  this.state=s;this.revision=s.revision;this.minute=Math.floor(t);this.at=t;this.boundary=Infinity;this.cache.clear();
  this.events=s.active(t);this.targets=new Map();
  for(const e of s.events)for(const v of [e.at,e.end,e.resolved])if(v!==null&&v>t)this.boundary=Math.min(this.boundary,v);
  for(const e of this.events){if(!this.targets.has(e.target))this.targets.set(e.target,[]);this.targets.get(e.target).push(e);}
 }
 atPoint(x,y){
  this.refresh();const key=x+','+y;if(this.cache.has(key))return this.cache.get(key);
  const g=this.game,cell=Atlas.cellAt(x,y),site=Atlas.siteAt(x,y,12),near=Atlas.closestRoad(x,y),road=near&&near.d<32?near.road:null;
  const roadIds=road?(Atlas.edgeById.get([near.segment.a[2],near.segment.b[2]].sort().join('|'))?.roads||[road.id]):[];
  const events=new Map();for(const id of [...roadIds,site?.id,site?.town])for(const e of this.targets.get(id)||[])events.set(e.id,e);
  // Site events also reach the actual actor positions and the settlement outskirts.
  for(const e of this.events){const n=Atlas.byId[e.target];if(n&&Math.hypot(x-e.x,y-e.y)<(n.radius||12)+20)events.set(e.id,e);}
  const es=[...events.values()].filter(e=>!e.radius||Math.hypot(e.x-x,e.y-y)<=e.radius),cursed=Atlas.curseCells.has(cell?.id),sky=worldClimateAt(g.clock,x,y);
  const terrain=road?(road.type==='roads'?1:road.type==='trails'?2:1):({1:1.8,2:1.6,3:1.3,4:1.2,5:2.3,6:1.8,7:2.2,8:2,9:1.8,10:1.6,11:1.7,12:2.1}[cell?.biome]||1);
  let hostility=(site?.rest? .3:terrain)+(cursed?2:0),hazard=(cell?.height>60?.7:0)+(sky.blizzard||0)+(sky.rain||0)*.25;
  let unsafe=false;for(const e of es){const rule=Atlas.EVENT_TYPES[e.type];hostility+=rule.risk||0;hazard+=rule.hazard||0;unsafe ||=!!rule.evacuate;}
  hostility=clamp(hostility,0,5);const value=clamp(hostility+hazard,0,5);
  const result={value,hostility,hazard,unsafe:unsafe||hostility>=3||sky.blizzard>.45,events:es,site,road,sky};
  if(this.cache.size>=512)this.cache.delete(this.cache.keys().next().value);this.cache.set(key,result);return result;
 }
 atActor(n){const p=Atlas.toWorld(n.x,n.y),base=this.atPoint(p.x,p.y),foe=this.game.localThreatAt(n.x,n.y,n.level||0);return foe?{...base,value:Math.max(4,base.value),hostility:Math.max(4,base.hostility),unsafe:true,nearbyEnemy:foe}:base;}
}
const CIVILIAN_THREAT_RADIUS=180,CIVILIAN_SPAWN_MARGIN=220;
Game.prototype.localThreatAt=function(x,y,level=0,radius=CIVILIAN_THREAT_RADIUS){
 return this.enemies.find(e=>!e.dead&&!e.friendly&&(e.kind!=='boss'||this.bossActive)&&(e.level||0)===level&&Math.hypot(e.x-x,e.y-y)<radius&&(radius<=48||this.lineClear({x,y,level},e)))||null;
};
Game.prototype.canPlaceHostile=function(pos){return !this.npcs.some(n=>!n.civilian?.dead&&!n.batracien?.dead&&!n.guardState?.dead&&!this.civilianProtected(n)&&(dist(n,pos)<CIVILIAN_SPAWN_MARGIN||n.post&&dist(n.post,pos)<CIVILIAN_SPAWN_MARGIN||n.dangerState&&dist(n.dangerState.post,pos)<CIVILIAN_SPAWN_MARGIN));};
Game.prototype.ensureDanger=function(){if(!this.danger||this.danger.game!==this)this.danger=new WorldDanger(this);this.worldState.weatherAt=worldClimateAt;return this.danger;};
Game.prototype.dangerAt=function(x,y,level=0){return this.ensureDanger().atActor({x,y,level});};

// Services and sanctuary obey the same live local state, including legacy villages.
const dangerInSafe=Game.prototype.inSafe;
Game.prototype.inSafe=function(x,y,m=0){const safe=dangerInSafe.call(this,x,y,m);return safe&&this.worldState&&this.dangerAt(x,y).unsafe?null:safe;};
const dangerPresent=Game.prototype.npcPresent;
Game.prototype.npcPresent=function(n){return !n.dangerState&&(this.civilianProtected(n)||!this.localThreatAt(n.x,n.y,n.level||0))&&dangerPresent.call(this,n);};
const dangerBodies=Game.prototype.bodies;
Game.prototype.bodies=function(o){return dangerBodies.call(this,o).filter(n=>!n.dangerState||n.dangerState.mode!=='sheltered');};
const dangerTransport=Game.prototype.currentTransport;
Game.prototype.currentTransport=function(){const s=dangerTransport.call(this);return s&&this.npcPresent(s.actor)&&!this.dangerAt(s.actor.x,s.actor.y).unsafe?s:null;};
const dangerPrepare=Game.prototype.prepareTransport;
Game.prototype.prepareTransport=function(id){const s=this.stations.find(s=>s.id===id);return !!s&&this.npcPresent(s.actor)&&!this.dangerAt(s.actor.x,s.actor.y).unsafe&&dangerPrepare.call(this,id);};
const dangerQuote=Game.prototype.supplyQuote;
Game.prototype.supplyQuote=function(...args){return this.dangerAt(this.player.x,this.player.y).unsafe?null:dangerQuote.apply(this,args);};
const dangerRest=Game.prototype.restAtRelay;
Game.prototype.restAtRelay=function(){return !this.dangerAt(this.player.x,this.player.y).unsafe&&dangerRest.call(this);};
const dangerTalk=Game.prototype.talkTo;
Game.prototype.talkTo=function(n){if(!n||!this.npcPresent(n))return false;return dangerTalk.call(this,n);};

Game.prototype.civilianProtected=function(n){return n.id==='fairy'||n.eventGuard||n.convoyGuard||this.party?.some(c=>c.id===n.id);};
// A struck or witnessing civilian runs from the attacker on foot and stays visible,
// so it can still be caught. Shelter/return follow once the attacker is out of reach.
const CIVILIAN_FLIGHT=Object.freeze({speed:1.6,calm:4,safe:220,lost:3,look:56,witness:150});
Game.prototype.civilianAttacker=function(s){
 if(s.attacker==='player')return this.player;if(!s.attacker)return null;
 return this.enemies.find(e=>e.id===s.attacker&&!e.dead)||this.npcs.find(n=>n.id===s.attacker&&!n.civilian?.dead&&!n.batracien?.dead&&!n.guardState?.dead)||null;
};
Game.prototype.startCivilianFlight=function(n,source){
 if(!n||!source||this.civilianProtected(n)||n.civilian?.dead||n.batracien?.dead||(n.alpha??1)<.5)return false;
 const owner=source.owner?this.enemies.find(e=>e.id===source.owner)||this.npcs.find(a=>a.id===source.owner)||source:source,from=Number.isFinite(owner.x)?owner:source;
 const old=n.dangerState,origin=old?.post||n.post||n;
 const s=old?.mode==='fleeing'?old:n.dangerState={mode:'fleeing',post:{x:origin.x,y:origin.y},shelter:{x:n.x,y:n.y},clearAt:null,blocked:0};
 Object.assign(s,{attacker:owner===this.player?'player':owner.id||null,ax:from.x,ay:from.y,hitAt:this.time,seenAt:this.time,goal:null});
 n.alpha=1;n.path=[];if(this.dialogue?.who===n)this.dialogue=null;if(this.transportSession===n.id){this.transportSession=null;this.pendingTransport=null;}
 return true;
};
Game.prototype.alarmWitnesses=function(victim,source){
 for(const n of this.npcs){if(n===victim||!n.civilian||!this.sameLevel(n,victim)||dist(n,victim)>CIVILIAN_FLIGHT.witness)continue;
  if(this.lineClear(n,victim)||this.lineClear(n,source))this.startCivilianFlight(n,source);}
};
Game.prototype.civilianFleeGoal=function(n,x,y){
 const a=Math.atan2(n.y-y,n.x-x),L=CIVILIAN_FLIGHT.look,open=(px,py)=>!this.solid(px,py,4,0),free=(px,py)=>open(px,py)&&this.civilianStepSafe(n,px,py),here=Math.hypot(n.x-x,n.y-y);
 // Walk each ray up to the first obstacle, so a wall ahead turns the run along it. The goal tile is checked too,
 // because the path search aims for it, and a failed search must never run every frame.
 let best=null,score=here-8;
 for(const turn of [0,.4,-.4,.8,-.8,1.2,-1.2,1.6,-1.6,2.1,-2.1,2.7,-2.7]){const c=Math.cos(a+turn),s=Math.sin(a+turn);let len=0;for(let t=8;t<=L&&open(n.x+c*t,n.y+s*t);t+=8)len=t;
  if(len<16)continue;const q={x:n.x+c*len,y:n.y+s*len},v=Math.hypot(q.x-x,q.y-y)+len*.25;if(v>score&&free(q.x,q.y)&&free(Math.floor(q.x/16)*16+8,Math.floor(q.y/16)*16+8)){best=q;score=v;if(turn===0&&len===L)break;}}
 return best;
};
Game.prototype.stepCivilianFlight=function(n,s,dt){
 const F=CIVILIAN_FLIGHT,a=this.civilianAttacker(s);
 if(a&&this.time>=(s.lookAt||0)&&this.sameLevel(a,n)&&dist(a,n)<F.safe){s.lookAt=this.time+.25;if(this.lineClear(n,a)){s.seenAt=this.time;s.ax=a.x;s.ay=a.y;}}
 const away=Math.hypot(n.x-s.ax,n.y-s.ay);
 if(dist(n,this.player)>900||this.time-s.hitAt>=F.calm&&(!a||away>F.safe||this.time-s.seenAt>F.lost)){
  const unsafe=this.dangerAt(n.x,n.y).unsafe||!!this.localThreatAt(n.x,n.y,n.level||0);
  n.dangerState={mode:unsafe?'leaving':'returning',post:s.post,shelter:unsafe?this.civilianShelter(n):s.shelter,clearAt:null,blocked:0};n.path=[];return;
 }
 const busy=!!this.npcMoveLocked?.(n);
 if(this.time>=(s.retryAt||0)&&(!s.goal||dist(n,s.goal)<4||this.time-(s.goalAt||0)>1.2)){s.goal=this.civilianFleeGoal(n,s.ax,s.ay);s.goalAt=this.time;n.path=[];if(!s.goal)s.retryAt=this.time+.3;}
 if(!s.goal){if(!busy)s.blocked+=dt;return;} // Cornered: cower until a way out opens.
 const before={x:n.x,y:n.y};this.walkNpc(n,s.goal,dt);
 if(!busy&&!n.path?.length&&dist(n,s.goal)>=2){s.goal=null;s.retryAt=this.time+.3;}
 s.blocked=busy?0:dist(before,n)<.01?s.blocked+dt:0;if(s.blocked>.5)s.goal=null;
};
Game.prototype.civilianStepSafe=function(n,x,y){const foe=this.localThreatAt(x,y,n.level||0,48);return !foe||Math.hypot(x-foe.x,y-foe.y)>dist(n,foe)+.1;};
Game.prototype.civilianShelter=function(n){
 const home=n.home||this.atlasProps.filter(o=>o.rest&&Math.hypot(o.x-n.x,o.y-n.y)<240).sort((a,b)=>dist(a,n)-dist(b,n))[0];
 const foe=this.localThreatAt(n.x,n.y,n.level||0),away=foe?Math.atan2(n.y-foe.y,n.x-foe.x):0;
 const target=home?{x:home.x,y:home.y+(n.home?0:14)}:foe?{x:n.x+Math.cos(away)*80,y:n.y+Math.sin(away)*80}:{x:n.x,y:n.y};
 // Only a house or rest spot hides a civilian. In the open it stays visible, cowering, and can still be hurt.
 for(const r of [0,16,32,48])for(const [dx,dy]of [[0,r],[r,0],[-r,0],[0,-r]])if(!this.solid(target.x+dx,target.y+dy,4,n.level||0)&&!this.localThreatAt(target.x+dx,target.y+dy,n.level||0,72))return {x:target.x+dx,y:target.y+dy,cover:!!home};
 return {x:n.x,y:n.y};
};
Game.prototype.assessCivilians=function(force=false){
 const field=this.ensureDanger();field.refresh();if(!force&&field.npcRevision===this.worldState.revision&&this.time-field.npcTick<.5&&this.clock>=field.npcClock&&this.clock-field.npcClock<1)return;
 field.npcTick=this.time;field.npcClock=this.clock;field.npcRevision=this.worldState.revision;
 for(const n of this.npcs){
  if(!n.dangerState&&dist(n,this.player)>1200)continue;
  if(this.civilianProtected(n)){if(n.dangerState){delete n.dangerState;n.alpha=1;n.phase='post';}continue;}
  if(n.dangerState?.mode==='fleeing')continue;
  const s=n.dangerState,origin=s?.post||n.post||n,d=field.atActor({...origin,level:n.level||0}),combat=!!this.localThreatAt(n.x,n.y,n.level||0);
  const danger=d.unsafe||combat;
  if(danger){if(!s){n.dangerState={mode:'leaving',post:{x:origin.x,y:origin.y},shelter:this.civilianShelter(n),clearAt:null,blocked:0};n.path=[];}else{s.clearAt=null;if(s.mode==='returning')s.mode='leaving';}
   if(this.dialogue?.who===n)continue;
   if(this.transportSession===n.id){this.transportSession=null;this.pendingTransport=null;}
  }else if(s){if(s.clearAt===null)s.clearAt=this.clock;if(this.clock-s.clearAt>=10&&s.mode!=='returning'){s.mode='returning';n.path=[];}}
 }
};
const dangerStepNpcs=Game.prototype.stepNpcs;
Game.prototype.stepNpcs=function(dt){
 this.assessCivilians();const all=this.npcs;
 // The old day/night schedule must not fight a retreat or move a hidden resident.
 try{this.npcs=all.filter(n=>!n.dangerState);dangerStepNpcs.call(this,dt);}finally{this.npcs=all;}
 for(const n of all){const s=n.dangerState;if(!s||this.dialogue?.who===n)continue;
  if(s.mode==='fleeing'){this.stepCivilianFlight(n,s,dt);continue;}
  if(s.mode==='sheltered'){n.alpha=0;n.anim=0;continue;}
  const target=s.mode==='returning'?s.post:s.shelter,offscreen=dist(n,this.player)>900;
  if(offscreen){Object.assign(n,{x:target.x,y:target.y});if(s.mode!=='leaving')this.finishCivilianReturn(n);else if(s.shelter.cover){s.mode='sheltered';n.alpha=0;}else n.alpha=1;continue;}
  if(s.mode==='returning')n.alpha=Math.min(1,(n.alpha??0)+dt/1.2);
  if(this.localThreatAt(target.x,target.y,n.level||0,72)&&s.mode==='leaving'){s.shelter=this.civilianShelter(n);n.path=[];continue;}
  const before={x:n.x,y:n.y},arrived=dist(n,target)<10||this.walkNpc(n,target,dt);
  s.blocked=dist(before,n)<.01&&!arrived?s.blocked+dt:0;
  // No teleport through walls. Retry a reachable nearby shelter when the path is blocked.
  if(s.blocked>3){n.path=[];if(s.mode==='leaving')s.shelter=this.civilianShelter(n);s.blocked=0;}
  if(arrived){if(s.mode==='leaving'){if(!s.shelter.cover){n.alpha=Math.min(1,(n.alpha??1)+dt/1.2);continue;}n.alpha=Math.max(0,(n.alpha??1)-dt/1.2);if(n.alpha===0){s.mode='sheltered';n.anim=0;}}else this.finishCivilianReturn(n);}
 }
};
Game.prototype.finishCivilianReturn=function(n){delete n.dangerState;n.alpha=1;n.phase='post';n.lastClock=this.clock;n.anim=0;n.path=[];const h=(this.clock/60)%24;if(n.home&&(h>=22.5||h<6))n.phase='leaving';};
const dangerCouriers=Game.prototype.stepCouriers;
Game.prototype.stepCouriers=function(minutes){const all=this.couriers;try{this.couriers=all.filter(c=>{const n=this.npcs.find(n=>n.id===c.id);return !n?.dangerState&&!n?.civilian?.dead;});dangerCouriers.call(this,minutes);}finally{this.couriers=all;}};

// Bounded event groups. Stable event/slot IDs prevent save/reload or chunk farming.
Game.prototype.stepEventGroups=function(dt=0){
 const field=this.ensureDanger();field.refresh();const active=new Set(field.events.map(e=>e.id));
 for(const e of this.enemies){if(e.campaignGroup)continue;if(e.eventId&&!active.has(e.eventId))e.retiring=true;if(e.retiring)e.retireAge=(e.retireAge||0)+dt;}
 this.enemies=this.enemies.filter(e=>!e.retiring||dist(e,this.player)<600&&(e.retireAge||0)<12);
 const guards=this.npcs.filter(n=>n.eventGuard);for(const n of guards)if(!n.campaignGroup&&!active.has(n.eventId)){
  n.guardRetiring=true;this.cancelWorldConversation?.(n);
  const mission=this.worldState.simulation?.state.missions.find(m=>m.event===n.eventId);if(mission?.status==='returned'){this.npcs=this.npcs.filter(a=>a!==n);continue;}const state=this.ensureHumanGuard?.(n),fighting=state&&this.humanGuardTarget?.(n,state)||n.wind>0||n.attack>0;
  if(mission){mission.engaged=!!fighting;mission.physical=dist(n,this.player)<1500;}if(fighting){n.alpha=1;continue;}
  if(mission&&dist(n,this.player)<1500){const home=Atlas.toGame(Atlas.byId[mission.site].x,Atlas.byId[mission.site].y),distance=dist(n,home);if(distance>20){const k=Math.min(1,256/distance);this.walkNpc(n,{x:n.x+(home.x-n.x)*k,y:n.y+(home.y-n.y)*k},dt);n.post={x:n.x,y:n.y};continue;}this.npcs=this.npcs.filter(a=>a!==n);mission.physical=this.npcs.some(a=>a.eventId===mission.event);continue;}
  if(dist(n,this.player)<300){const a=Math.atan2(n.y-this.player.y,n.x-this.player.x);this.walkNpc(n,{x:n.x+Math.cos(a)*48,y:n.y+Math.sin(a)*48},dt);n.post={x:n.x,y:n.y};continue;}
  n.alpha=Math.max(0,(n.alpha??1)-dt);if(n.alpha===0)this.npcs=this.npcs.filter(a=>a!==n);
 }
 if(field.groupRevision===this.worldState.revision&&field.groupMinute===Math.floor(this.clock)&&this.time-(field.groupTick||0)<1)return;
 field.groupRevision=this.worldState.revision;field.groupMinute=Math.floor(this.clock);field.groupTick=this.time;
 for(const event of field.events){if(event.managedMovement)continue;const rule=Atlas.EVENT_TYPES[event.type],count=event.memberIds?.length??rule.group??0;if(!count)continue;const centre=Atlas.toGame(event.x,event.y);if(dist(centre,this.player)>1100)continue;
  for(let i=0;i<count;i++){const id='incident-'+event.id+'-'+i;if(this.worldState.simulation?.state.hostiles[id]?.hp===0)this.atlasDeaths[id]=true;if(this.atlasDeaths[id]||this.enemies.some(e=>e.id===id)||this.npcs.some(n=>n.id===id))continue;
   if(rule.guard?this.npcs.filter(n=>n.eventGuard).length>=8:this.enemies.filter(e=>e.eventId&&!e.dead).length>=24)break;
   let pos;for(let j=0;j<24;j++){const angle=(i/count+j/24)*Math.PI*2,r=rule.guard?80+j*8:220+j*12,q=this.incidentRoadPosition?.(event,i,j)||{x:centre.x+Math.cos(angle)*r,y:centre.y+Math.sin(angle)*r};if(dist(q,this.player)>300&&!this.solid(q.x,q.y,7,0)&&(rule.guard||!this.inSafe(q.x,q.y)&&this.canPlaceHostile(q))){pos=q;break;}}
   if(!pos)continue;
   if(rule.guard)this.npcs.push({id,eventId:event.id,eventGuard:true,...pos,look:'nomade',dir:2,head:40,alpha:1,name:'LA GARDE',label:'GARDE',title:'Patrouille du relais',greet:()=>['Nous sécurisons ce passage.'],topics:()=>[],bye:()=>['Reste sur tes gardes.']});
   else{const e=enemy(rule.enemy||'cultist',pos.x,pos.y,id),saved=this.incidentHealth?.[id]??this.worldState.simulation?.state.bands[event.bandKey]?.members.find(m=>m.id===event.memberIds?.[i])?.hp;Object.assign(e,{world:true,eventId:event.id});if(Number.isFinite(saved))e.hp=clamp(saved,.1,e.hp);this.enemies.push(e);}
  }
 }
};
const dangerBrain=Game.prototype.brain;
Game.prototype.brain=function(e,p,d,dt,sz){if(e.retiring){e.ai='return';e.wind=e.attack=0;return {engage:false,tx:e.x+(e.x>=p.x?100:-100),ty:e.y+80,keep:0};}return dangerBrain.call(this,e,p,d,dt,sz);};
const dangerEnemyDraw=Renderer.prototype.enemy;
Renderer.prototype.enemy=function(e){this.c.save();if(e.retiring)this.c.globalAlpha*=clamp((12-(e.retireAge||0))/3,0,1);dangerEnemyDraw.call(this,e);this.c.restore();};
Game.prototype.settleIncident=function(e){
 if(!e.eventId)return;const bandEvent=this.worldState.events.find(v=>v.id===e.eventId);this.worldState.simulation?.recordBandHealth(bandEvent,Number(e.id.split('-').at(-1)),e.hp);this.incidentHealth??={};this.incidentHealth[e.id]=e.hp;
 if(!e.dead)return;const event=this.worldState.events.find(v=>v.id===e.eventId),rule=event&&Atlas.EVENT_TYPES[event.type];
 if(rule&&!rule.guard&&this.worldState.active(this.clock).some(v=>v.id===event.id)&&Array.from({length:event.memberIds?.length??rule.group},(_,i)=>'incident-'+event.id+'-'+i).every(id=>this.atlasDeaths[id])){
  this.worldState.resolve(event.id,this.clock);this.worldState.add(event.type==='curse'?'purified':'victory',event.target,this.clock,1440,{source:'Témoins locaux',position:event,expiry:true});this.emit('notice',{title:'Passage sécurisé',text:'La menace locale est vaincue. Les habitants pourront revenir.'});
 }
};
Game.prototype.guardStrike=function(n,e){
 // Guard damage must not consume the player's riposte or grant them kills/XP.
 if(e.dead||!e.world||!this.lineClear(n,e))return;e.hp=Math.max(0,e.hp-1);e.flash=.1;e.hurt=.2;e.stun=Math.max(e.stun||0,.2);e.hitX=(e.x-n.x)/Math.max(1,dist(e,n));e.hitY=(e.y-n.y)/Math.max(1,dist(e,n));
 if(!e.hp){e.dead=true;this.atlasDeaths[e.id]=true;if(this.targetId===e.id)this.targetId=null;}this.settleIncident(e);
};
const dangerDamage=Game.prototype.damageEnemy;
Game.prototype.damageEnemy=function(e,...args){const result=dangerDamage.call(this,e,...args);this.settleIncident(e);return result;};

const dangerAdvance=Game.prototype.advanceAtlas;
Game.prototype.advanceAtlas=function(dt=0){dangerAdvance.call(this,dt);if(!this.journey){this.assessCivilians();this.stepEventGroups(dt);}};
// A transport halts before an actual hostile incident; no arbitrary damage roll.
Game.prototype.journeyThreat=function(s){if(s?.kind!=='move'||s.mode==='boat')return null;return this.worldState.edgeStatus(Atlas.edgeById.get(s.edge),this.clock).events.find(e=>Atlas.EVENT_TYPES[e.type].group&&!Atlas.EVENT_TYPES[e.type].guard);};

const dangerSerialize=Game.prototype.serialize;
Game.prototype.serialize=function(){const data=dangerSerialize.call(this),ids=new Set(this.worldState.active(this.clock).flatMap(e=>Array.from({length:Atlas.EVENT_TYPES[e.type].group||0},(_,i)=>'incident-'+e.id+'-'+i)));data.atlas.danger={version:1,health:Object.fromEntries(Object.entries(this.incidentHealth||{}).filter(([id])=>ids.has(id)).slice(-128)),civilians:this.npcs.filter(n=>n.dangerState&&!this.civilianProtected(n)).map(n=>({id:n.id,x:n.x,y:n.y,alpha:n.alpha,...(n.dangerState.mode==='fleeing'?{mode:'returning',post:n.dangerState.post,shelter:n.dangerState.shelter,clearAt:null}:n.dangerState)}))};return data;};
Game.prototype.placeCampaignStart=function(){
 // Keep the authored combat layout. Only a new campaign starts farther south
 // on the existing camp path, with Elyne and the fairy still beside the hero.
 for(const offset of [64,80,96,112]){
  const p={x:START.x,y:START.y+offset},elyne={x:p.x+36,y:p.y};
  if(this.solid(p.x,p.y,7,0)||this.solid(elyne.x,elyne.y,4,0)||this.localThreatAt(p.x,p.y)||this.localThreatAt(elyne.x,elyne.y))continue;
  Object.assign(this.player,p);Object.assign(this.escortActor,elyne);Object.assign(this.fairyActor,{x:p.x-28,y:p.y-22});this.checkpoint={...p,level:0};this.worldCheckpoint={...this.checkpoint};this.updateLocation(0);return true;
 }return false;
};
const dangerRestore=Game.prototype.finishAtlasRestore;
Game.prototype.finishAtlasRestore=function(saved){dangerRestore.call(this,saved);if(!saved)this.placeCampaignStart();this.ensureDanger();this.incidentHealth={};for(const [id,hp]of Object.entries(saved?.atlas?.danger?.health||{}).slice(-128))if(id.startsWith('incident-')&&Number.isFinite(hp)&&hp>0)this.incidentHealth[id]=hp;
 for(const row of (Array.isArray(saved?.atlas?.danger?.civilians)?saved.atlas.danger.civilians:[]).slice(0,512)){
  if(!row||typeof row!=='object')continue;const n=this.npcs.find(n=>n.id===row.id);if(!n||this.civilianProtected(n)||!['leaving','sheltered','returning'].includes(row.mode))continue;
  if(![row.x,row.y,row.post?.x,row.post?.y,row.shelter?.x,row.shelter?.y].every(Number.isFinite)||Math.hypot(row.x-row.post.x,row.y-row.post.y)>2000||Math.hypot(row.shelter.x-row.post.x,row.shelter.y-row.post.y)>2000)continue;
  const w=Atlas.toWorld(row.x,row.y);if(w.x<0||w.y<0||w.x>=Atlas.raw.width||w.y>=Atlas.raw.height)continue;
  n.dangerState={mode:row.mode,post:{...row.post},shelter:{...row.shelter},clearAt:Number.isFinite(row.clearAt)&&row.clearAt<=this.clock?row.clearAt:null,blocked:0};Object.assign(n,{x:row.x,y:row.y,alpha:clamp(Number(row.alpha)||0,0,1)});
 }
 this.assessCivilians(true);
};

// Ordinary armed people use the existing human art and melee system; no jade spells.
const mundaneEnemyBody=Renderer.prototype.enemyBody;
Renderer.prototype.enemyBody=function(e){if(e.kind!=='bandit')return mundaneEnemyBody.call(this,e);
 const c=this.c;c.save();this.shadow(e.x,e.y,12);if(this.g.targetId===e.id)this.targetRing(e.x,e.y,13);
 this.characters.draw(c,'nomade',e,this.g.time); // The armament adapter owns the weapon, attached to the native hand.
 if(e.wind>0)text(c,'!',e.x-2,e.y-38,'#edb279');if(e.hp<e.maxHp){box(c,e.x-9,e.y-34,18,3,PAL.ink);box(c,e.x-8,e.y-33,Math.ceil(16*e.hp/e.maxHp),1,'#cda46d');}c.restore();
};
