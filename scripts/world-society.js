/* Codex / ChatGPT — shared local life, road traffic and witnessed encounters.
 * Uses the existing road graph, event policies, knowledge and combat systems.
 * No species hostility, off-screen damage rolls or forced encounter spawns.
 */
const WorldSociety=(()=>{
 'use strict';
 const C=Object.freeze({trafficLimit:8,window:2048,load:1050,unload:1500,spawn:360,chatRange:62,chatCooldown:32,chatLimit:2,perception:140});
 const alive=n=>n&&!n.dead&&!n.civilian?.dead&&!n.batracien?.dead&&!n.guardState?.dead&&(n.alpha??1)>.8&&n.phase!=='away';
 const member=(g,n)=>g.party?.some(c=>c.id===n.id);
 const calm=(g,n)=>alive(n)&&!n.convoyId&&!n.campaignGroup&&!n.labourReturning&&!n.reliefPost&&!member(g,n)&&!n.dangerState&&!n.wind&&!n.attack&&!n.hurt&&!n.stun&&!g.npcMoveLocked?.(n)&&!g.isHostileHumanGuard?.(n)&&!g.isHostileBatracien?.(n);
 const land=road=>road&&road.type!=='searoutes';
 const finite=Number.isFinite;
 function routePoint(s,p){const t=clamp(p/Math.max(1,s.length),0,1);return {x:s.a.x+(s.b.x-s.a.x)*t,y:s.a.y+(s.b.y-s.a.y)*t};}
 function descriptor(road,index,window){
  const segment=road?.segments[index];if(!land(road)||!segment||!Number.isInteger(index)||index<0||!Number.isInteger(window)||window<0)return null;
  const a=Atlas.toGame(segment.a[0],segment.a[1]),b=Atlas.toGame(segment.b[0],segment.b[1]),length=dist(a,b),start=window*C.window,end=Math.min(length,start+C.window);
  if(end-start<=0||length<32)return null;const s={a,b,length};return {a:routePoint(s,start),b:routePoint(s,end),length:end-start,edge:[segment.a[2],segment.b[2]].sort().join('|'),road:road.id,index,window};
 }
 function roadOpen(g,n,s,point){
  const status=g.worldState.edgeStatus(Atlas.edgeById.get(s.edge),g.clock);
  return !status.closed&&!status.events.some(e=>Atlas.EVENT_TYPES[e.type].evacuate)&&!g.solid(point.x,point.y,5,n?.level||0)&&!g.dangerAt(point.x,point.y,n?.level||0).unsafe;
 }
 function snapshot(g,n){const r=n.roadTraffic,hp=member(g,n)?clamp(n.civilian?.hp??6,1,6):n.civilian?.hp??6;return {id:n.id,x:n.x,y:n.y,road:r.road,index:r.originIndex??r.index,window:r.originWindow??r.window,cursorIndex:r.index,cursorWindow:r.window,slot:r.slot,progress:r.progress,sign:r.sign,hp,dead:!!n.civilian?.dead,appearance:n.civilian?.appearance?{...n.civilian.appearance}:undefined,clock:g.clock};}
 Game.prototype.ensureWorldSociety=function(){return this.society||(this.society={records:new Map(),nextTraffic:0,nextChat:this.time+10,nextPerception:0});};
 Game.prototype.incidentRoadPosition=function(event,slot,attempt){
  if(!Atlas.EVENT_TYPES[event.type]?.guard)return null;
  const road=Atlas.roadById[event.target];if(!land(road))return null;
  const s=road.segments.reduce((best,s)=>{const q=Atlas.project(event.x,event.y,s.a,s.b);return !best||q.d<best.distance?{s,distance:q.d}:best;},null)?.s;if(!s)return null;
  const a=Atlas.toGame(s.a[0],s.a[1]),b=Atlas.toGame(s.b[0],s.b[1]),length=dist(a,b),centre=Atlas.toGame(event.x,event.y),dx=b.x-a.x,dy=b.y-a.y;
  const progress=clamp(((centre.x-a.x)*dx+(centre.y-a.y)*dy)/Math.max(1,length*length),0,1)*length;
  return routePoint({a,b,length},clamp(progress+(slot%2?1:-1)*(70+attempt*14),0,length));
 };
 Game.prototype.roadTrafficSpawn=function(road,index,window,slot,{restore=false,position=null}={}){
  if(!descriptor(road,index,window))return null;const state=this.ensureWorldSociety(),id='road-person-'+road.id+'-'+index+'-'+window+'-'+slot,seed=civilianHash(id),record=state.records.get(id),s=descriptor(road,record?.cursorIndex??index,record?.cursorWindow??window);if(!s)return null;
  if(record?.dead||this.atlasDeaths[id]||this.npcs.some(n=>n.id===id))return null;
  const progress=record?.progress??s.length*(slot===0?.28:.72),expected=routePoint(s,progress),pos=restore&&position&&finite(position.x)&&finite(position.y)?{x:position.x,y:position.y}:restore&&finite(record?.x)&&finite(record?.y)&&dist(record,expected)<400?{x:record.x,y:record.y}:expected,d=dist(pos,this.player);
  if(this.solid(pos.x,pos.y,5,0))return null;
  if(!restore&&(d<C.spawn||d>C.load||this.npcs.some(n=>alive(n)&&dist(n,pos)<28)||!roadOpen(this,null,s,pos)||this.localThreatAt(pos.x,pos.y,0,220)))return null;
  const trader=seed%3===0,n={id,...pos,post:{...pos},world:true,alpha:1,dir:2,look:'nomade',head:30,name:trader?'MARCHAND':'VOYAGEUR',label:trader?'MARCHAND':'VOYAGEUR',title:trader?'Marchand de passage':'Voyageur de la route',civilianJob:trader?'carry':'idle',roadTraffic:{...s,originIndex:index,originWindow:window,slot,progress,sign:record?.sign===-1?-1:1,wait:0,blocked:0},
   greet:()=>trader?['Je fais la tournée des relais. Tu cherches quelque chose ?']:['Toi aussi, tu fais la route ?'],topics:()=>[],bye:()=>['Bonne route.']};
  this.ensureCivilian(n,record);n.civilian.restClock=0;this.npcs.push(n);this.atlasNpcs.push(n);return n;
 };
 Game.prototype.populateRoadTraffic=function(){
  const state=this.ensureWorldSociety();
  for(const n of this.npcs.filter(n=>n.roadTraffic&&dist(n,this.player)>C.unload&&!member(this,n)&&this.dialogue?.who!==n&&!n.dangerState&&!n.worldChat&&!n.justiceReport&&!this.worldState.justice?.pending(n.id,this.clock).length&&!this.worldState.justice?.discoveries(n.id).length)){
   state.records.set(n.id,snapshot(this,n));this.npcs=this.npcs.filter(a=>a!==n);this.atlasNpcs=this.atlasNpcs.filter(a=>a!==n);
  }
  this.advanceDistantRoadTraffic();
  // A traveller keeps its identity after crossing a streaming window or reloading.
  for(const r of state.records.values()){
   if(r.dead||this.npcs.filter(n=>n.roadTraffic).length>=C.trafficLimit)continue;
   const road=Atlas.roadById[r.road],s=descriptor(road,r.cursorIndex??r.index,r.cursorWindow??r.window);if(s&&dist(routePoint(s,r.progress),this.player)<=C.load)this.roadTrafficSpawn(road,r.index,r.window,r.slot,{restore:true});
  }
  if(this.player.level)return;const w=Atlas.toWorld(this.player.x,this.player.y),near=Atlas.closestRoad(w.x,w.y);
  if(!land(near?.road)||near.d>48)return;const road=near.road,index=road.segments.indexOf(near.segment),a=Atlas.toGame(near.segment.a[0],near.segment.a[1]),b=Atlas.toGame(near.segment.b[0],near.segment.b[1]),dx=b.x-a.x,dy=b.y-a.y;
  const p=clamp(((this.player.x-a.x)*dx+(this.player.y-a.y)*dy)/Math.max(1,dx*dx+dy*dy),0,1)*dist(a,b),window=Math.floor(p/C.window);
  for(const k of [window,window-1,window+1])for(let slot=0;slot<2;slot++){
   if(this.npcs.filter(n=>n.roadTraffic).length>=C.trafficLimit)return;
   this.roadTrafficSpawn(road,index,k,slot);
  }
 };
 Game.prototype.advanceDistantRoadTraffic=function(){
  const state=this.ensureWorldSociety(),loaded=new Set(this.npcs.map(n=>n.id));
  for(const r of state.records.values()){
   if(r.dead||loaded.has(r.id)||this.party.some(c=>c.id===r.id))continue;
   const road=Atlas.roadById[r.road];let s=descriptor(road,r.cursorIndex??r.index,r.cursorWindow??r.window);if(!s)continue;
   const elapsed=Math.max(0,this.clock-(r.clock??this.clock));r.clock=this.clock;
   const speed=WorldPacing.civilianWalk*WorldPacing.dayRealSeconds/1440*(civilianHash(r.id)%3===0?.85:1);let remaining=elapsed*speed;
   // The same graph and pace are used outside streaming range. No off-screen damage.
   for(let guard=0;remaining>0&&guard<4096;guard++){
    const old=routePoint(s,r.progress);if(dist(old,this.player)<=C.load)break;
    const status=this.worldState.edgeStatus(Atlas.edgeById.get(s.edge),this.clock);if(status.closed||status.events.some(e=>Atlas.EVENT_TYPES[e.type].evacuate))break;
    const room=r.sign>0?s.length-r.progress:r.progress,step=Math.min(remaining,room,Math.max(1,dist(old,this.player)-C.load));r.progress+=r.sign*step;remaining-=step;
    if(step<room)continue;
    let next=descriptor(road,s.index,s.window+r.sign);
    if(!next){const index=s.index+r.sign,segment=road.segments[index],window=r.sign>0?0:segment?Math.max(0,Math.ceil(segment.length*16/C.window)-1):0;next=descriptor(road,index,window);}
    if(next){s=next;r.cursorIndex=s.index;r.cursorWindow=s.window;r.progress=r.sign>0?0:s.length;}
    else{r.sign*=-1;remaining=Math.max(0,remaining-(15+civilianHash(r.id)%20)*WorldPacing.civilianWalk);}
   }
   Object.assign(r,routePoint(s,r.progress));
  }
 };
 Game.prototype.stepRoadTraffic=function(n,dt){
  const r=n.roadTraffic;if(!r||!alive(n)||member(this,n)||n.dangerState||n.worldChat||this.dialogue?.who===n)return;
  if(r.wait>0){r.wait=Math.max(0,r.wait-dt);n.anim=0;return;}
  const point=routePoint(r,clamp(r.progress+r.sign*40,0,r.length));
  if(!roadOpen(this,n,r,point)){r.wait=2;n.anim=0;return;}
  const before={x:n.x,y:n.y};this.walkNpc(n,point,dt*(n.label==='MARCHAND'?.85:1));const moved=dist(before,n);
  r.blocked=moved<.01?r.blocked+dt:0;if(r.blocked>2){n.path=[];r.wait=2;r.blocked=0;}
  const dx=r.b.x-r.a.x,dy=r.b.y-r.a.y;r.progress=clamp(((n.x-r.a.x)*dx+(n.y-r.a.y)*dy)/Math.max(1,dx*dx+dy*dy)*r.length,0,r.length);n.post={x:n.x,y:n.y};
  if(dist(n,r.sign>0?r.b:r.a)<10){
   const road=Atlas.roadById[r.road];let next=descriptor(road,r.index,r.window+r.sign);
   if(!next){const index=r.index+r.sign,segment=road.segments[index],window=r.sign>0?0:segment?Math.max(0,Math.ceil(segment.length*16/C.window)-1):0;next=descriptor(road,index,window);}
   if(next){const originIndex=r.originIndex,originWindow=r.originWindow;Object.assign(r,next,{originIndex,originWindow,progress:r.sign>0?0:next.length});n.path=[];}
   else{r.sign*=-1;r.wait=15+civilianHash(n.id)%20;}
  }
 };
 Game.prototype.stepRoadPatrol=function(n,dt){
  if(!n.eventGuard||!calm(this,n)||n.worldChat||dist(n,this.player)>700||this.dialogue?.who===n)return;
  const event=this.worldState.active(this.clock).find(e=>e.id===n.eventId);if(!event)return;
  const state=this.ensureHumanGuard(n);if(this.humanGuardTarget(n,state))return;
  let route=n.roadPatrol;
  if(!route){const w=Atlas.toWorld(n.x,n.y),near=Atlas.closestRoad(w.x,w.y);if(!land(near?.road)||near.d>80)return;
   const a=Atlas.toGame(near.segment.a[0],near.segment.a[1]),b=Atlas.toGame(near.segment.b[0],near.segment.b[1]),length=dist(a,b),dx=b.x-a.x,dy=b.y-a.y;
   const progress=clamp(((n.x-a.x)*dx+(n.y-a.y)*dy)/Math.max(1,length*length),0,1)*length;
   route=n.roadPatrol={a:routePoint({a,b,length},Math.max(0,progress-180)),b:routePoint({a,b,length},Math.min(length,progress+180)),sign:civilianHash(n.id)%2?1:-1};
  }
  const goal=route.sign>0?route.b:route.a;if(this.solid(goal.x,goal.y,5,n.level||0))return;
  this.walkNpc(n,goal,dt*.9);n.post={x:n.x,y:n.y};if(dist(n,goal)<10)route.sign*=-1;
 };
 Game.prototype.cancelWorldConversation=function(n){
  const chat=n?.worldChat;if(!chat)return;const other=this.npcs.find(a=>a.id===chat.partner);
  for(const a of [n,other])if(a?.worldChat&&(a===n||a.worldChat.partner===n.id)){delete a.worldChat;a.chatAfter=this.time+C.chatCooldown;a.path=[];if(a.civilian&&!a.civilian.dead&&(a.batracien?.action||a.civilian.action)==='talk')this.civilianAction(a,'idle');}
  if(n.batracien?.routine?.partner)frogCancel.call(this,n);
 };
 Game.prototype.startWorldConversation=function(a,b){
  if(a===b||this.dialogue||![a,b].every(n=>calm(this,n)&&!n.worldChat&&!(n.batracien?.routine?.partner)&&this.time>=(n.chatAfter||0))||!this.sameLevel(a,b)||dist(a,b)<18||dist(a,b)>C.chatRange||!this.lineClear(a,b))return false;
  if(this.localThreatAt(a.x,a.y,a.level||0)||this.localThreatAt(b.x,b.y,b.level||0)||this.dangerAt(a.x,a.y,a.level||0).unsafe||this.dangerAt(b.x,b.y,b.level||0).unsafe)return false;
  for(const n of [a,b]){const w=Atlas.toWorld(n.x,n.y);this.worldState.learn(n.id,w.x,w.y,this.clock,{role:n.roadTraffic?'courier':'resident'});}
  const lines=this.worldConversationLines(a,b),until=this.time+6.8;
  for(const [n,other,turn]of [[a,b,0],[b,a,1]]){n.worldChat={partner:other.id,start:this.time,until,turn,line:lines[turn]};n.path=[];n.anim=0;n.dir=this.direction(other.x-n.x,other.y-n.y);this.civilianAction(n,'talk');}
  this.worldState.share(a.id,b.id,this.clock);this.worldState.share(b.id,a.id,this.clock);return true;
 };
 Game.prototype.worldConversationLines=function(a,b){
  const recent=this.worldState.news(a.id,this.clock).find(n=>!n.resolved&&!n.uncertain);
  if(recent?.type==='bandits')return ['On parle de brigands sur la route.','Alors je vais attendre une escorte.'];
  if(a.eventGuard||b.eventGuard)return ['Vous avez croisé du monde sur le chemin ?','Quelques voyageurs. Rien vu de suspect.'];
  const pairs=[['Tu repars déjà ?','Oui, je voudrais arriver avant la nuit.'],['Le marché était bon ?','Assez pour payer la prochaine halte.'],['Tu as pu réparer cette sangle ?','Ça tiendra. Enfin, jusqu’au relais.'],['Tu prends la même route ?','Un bout de chemin, oui.'],['Garde un peu d’eau pour la montée.','J’en ai rempli une gourde au relais.']];
  return pairs[(civilianHash(a.id+b.id)+Math.floor(this.clock/60))%pairs.length];
 };
 Game.prototype.stepWorldConversations=function(){
  for(const n of this.npcs){const chat=n.worldChat;if(!chat)continue;const other=this.npcs.find(a=>a.id===chat.partner);
   if(!alive(n)||!alive(other)||n.dangerState||other.dangerState||n.hurt||other.hurt||n.wind||other.wind||this.time>=chat.until||dist(n,other)>C.chatRange||!this.sameLevel(n,other)||!this.lineClear(n,other)||this.localThreatAt(n.x,n.y,n.level||0)||this.dialogue){this.cancelWorldConversation(n);continue;}
   n.dir=this.direction(other.x-n.x,other.y-n.y);this.civilianAction(n,'talk');
  }
  const state=this.ensureWorldSociety();if(this.time<state.nextChat||this.dialogue)return;state.nextChat=this.time+2;
  const active=this.npcs.filter(n=>n.worldChat&&n.worldChat.turn===0).length;if(active>=C.chatLimit)return;
  const people=this.npcs.filter(n=>calm(this,n)&&n.id!=='fairy'&&!n.worldChat&&this.time>=(n.chatAfter||0)&&dist(n,this.player)<380).sort((a,b)=>civilianHash(a.id+Math.floor(this.clock/30))-civilianHash(b.id+Math.floor(this.clock/30)));
  for(const n of people){const other=people.find(a=>a!==n&&dist(n,a)<=C.chatRange&&dist(n,a)>=18);if(other&&this.startWorldConversation(n,other))break;}
 };
 Game.prototype.worldBanditVictims=function(e){
  if(!e.world||e.retiring||!e.eventId||!alive(e))return [];
  const event=this.worldState.active(this.clock).find(v=>v.id===e.eventId);
  if(!event||!Atlas.EVENT_TYPES[event.type].civilianPrey)return [];
  return this.npcs.filter(n=>n.civilian&&alive(n)&&!n.eventGuard&&!n.batracien?.role&&!member(this,n)&&!this.civilianProtected(n)&&this.sameLevel(e,n)&&dist(e,n)<140&&this.lineClear(e,n));
 };
 Game.prototype.stepWorldPerception=function(){
  const state=this.ensureWorldSociety();if(this.time<state.nextPerception)return;state.nextPerception=this.time+.35;
  for(const n of this.npcs){if(!n.civilian||!alive(n)||this.civilianProtected(n)||dist(n,this.player)>700)continue;
   const e=this.localThreatAt(n.x,n.y,n.level||0,C.perception);if(e){this.cancelWorldConversation(n);if(n.dangerState?.mode!=='fleeing')this.startCivilianFlight(n,e);}
  }
 };
 Game.prototype.stepWorldLocal=function(n,dt){
  if(!n.resident||n.batracien||n.roadTraffic||n.reliefPost||!calm(this,n)||n.worldChat||this.dialogue?.who===n||dist(n,this.player)>650)return;
  const h=((this.clock/60)%24+24)%24;if(h<6||h>=22)return;
  const s=n.localLife||(n.localLife={after:this.time+10+civilianHash(n.id)%20,cycle:0,goal:null});
  if(!s.goal){if(this.time<s.after)return;s.cycle++;
   const people=this.npcs.filter(a=>a!==n&&alive(a)&&!a.eventGuard&&dist(n,a)<120&&dist(a,n.post)<100);
   const other=people[(civilianHash(n.id)+s.cycle)%Math.max(1,people.length)];
   const angle=(civilianHash(n.id)+s.cycle*3)%16*Math.PI/8,target=other?{x:other.x+26*Math.cos(angle),y:other.y+26*Math.sin(angle)}:{x:n.post.x+44*Math.cos(angle),y:n.post.y+44*Math.sin(angle)};
   if(this.solid(target.x,target.y,5,0)||this.dangerAt(target.x,target.y).unsafe||this.npcs.some(a=>a!==n&&alive(a)&&dist(a,target)<18)||this.stations.some(a=>dist(a.actor,target)<30)||[...this.chests,...this.levers,...this.steles].some(a=>dist(a,target)<28)){s.after=this.time+12;return;}
   s.goal=target;s.until=this.time+8;
  }
  if(dist(n,s.goal)<5||this.time>s.until){s.goal=null;s.after=this.time+18+civilianHash(n.id)%15;n.path=[];return;}
  this.walkNpc(n,s.goal,dt*.8);
 };
 const move=Game.prototype.walkNpc;
 Game.prototype.walkNpc=function(n,to,dt){if(n.worldChat&&!n.dangerState&&this.dialogue?.who!==n){n.anim=0;return false;}return move.call(this,n,to,dt);};
 const talk=Game.prototype.talkTo;
 Game.prototype.talkTo=function(n){this.cancelWorldConversation(n);return talk.call(this,n);};
 const flight=Game.prototype.startCivilianFlight;
 Game.prototype.startCivilianFlight=function(n,source){this.cancelWorldConversation(n);return flight.call(this,n,source);};
 const injury=Game.prototype.damageCivilian;
 Game.prototype.damageCivilian=function(n,amount,source){
  const result=injury.call(this,n,amount,source);if(result){this.cancelWorldConversation(n);if(n.roadTraffic&&n.civilian?.dead)this.atlasDeaths[n.id]=true;}return result;
 };
 const frogRoutine=Game.prototype.stepBatracienRoutine;
 Game.prototype.stepBatracienRoutine=function(n,dt){if(n.worldChat&&this.time>=n.worldChat.until)this.cancelWorldConversation(n);return n.worldChat&&!n.dangerState?true:frogRoutine.call(this,n,dt);};
 const frogCancel=Game.prototype.cancelBatracienConversation;
 Game.prototype.cancelBatracienConversation=function(n){this.cancelWorldConversation(n);return frogCancel.call(this,n);};
 const frogChat=Game.prototype.startBatracienConversation;
 Game.prototype.startBatracienConversation=function(a,b){
  if(a.worldChat||b.worldChat||!frogChat.call(this,a,b))return false;const lines=this.worldConversationLines(a,b),until=this.time+6.8;
  for(const [n,other,turn]of [[a,b,0],[b,a,1]]){n.worldChat={partner:other.id,start:this.time,until,turn,line:lines[turn]};n.batracien.routine.chatUntil=until;}
  return true;
 };
 const courierStep=Game.prototype.stepCouriers;
 Game.prototype.stepCouriers=function(minutes){const all=this.couriers;try{this.couriers=all.filter(c=>!this.npcs.find(n=>n.id===c.id)?.worldChat);return courierStep.call(this,minutes);}finally{this.couriers=all;}};
 const step=Game.prototype.update;
 Game.prototype.update=function(dt,input){
  const running=!this.dialogue&&!this.journey&&!this.sleeping&&!this.dying&&!this.dead&&!this.won;step.call(this,dt,input);
  if(!running||this.journey)return;dt=clamp(Number(dt)||0,0,.04);const state=this.ensureWorldSociety();
  if(this.time>=state.nextTraffic){state.nextTraffic=this.time+2;this.populateRoadTraffic();}
  this.stepWorldPerception();this.stepWorldConversations();
  for(const n of this.npcs){if(n.roadTraffic)this.stepRoadTraffic(n,dt);if(n.eventGuard)this.stepRoadPatrol(n,dt);this.stepWorldLocal(n,dt);}
  this.stepCivilianAnimations(dt);for(const n of this.npcs)if(n.worldChat)this.civilianAction(n,'talk');
 };
 const save=Game.prototype.serialize;
 Game.prototype.serialize=function(){const data=save.call(this);if(!data.atlas)return data;const state=this.ensureWorldSociety(),records=new Map(state.records);for(const n of this.npcs)if(n.roadTraffic)records.set(n.id,snapshot(this,n));
  const guards=new Map(this.guardRecords||[]);for(const n of this.npcs)if(n.eventGuard&&n.guardState)guards.set(n.id,{id:n.id,eventId:n.eventId,x:n.x,y:n.y,hp:n.guardState.hp,hostileUntil:n.guardState.hostileUntil});
  data.atlas.society={version:1,traffic:[...records.values()],guards:[...guards.values()]};return data;};
 Game.prototype.loadSocietyRecords=function(saved){const state=this.ensureWorldSociety();this.guardRecords||=new Map();
  if(saved?.version!==1||this.layoutMigrated)return;
  for(const r of Array.isArray(saved.traffic)?saved.traffic:[]){
   const road=Atlas.roadById[r?.road],s=descriptor(road,r?.cursorIndex??r?.index,r?.cursorWindow??r?.window);
   if(!s||!descriptor(road,r.index,r.window)||![0,1].includes(r.slot)||r.id!=='road-person-'+r.road+'-'+r.index+'-'+r.window+'-'+r.slot||!finite(r.progress)||r.progress<0||r.progress>s.length||![-1,1].includes(r.sign)||!finite(r.hp)||r.hp<0||r.hp>6)continue;
   state.records.set(r.id,{...r,dead:r.dead===true||r.hp===0});
  }
  for(const r of Array.isArray(saved.guards)?saved.guards:[]){const e=this.worldState.events.find(e=>e.id===r?.eventId),rule=e&&Atlas.EVENT_TYPES[e.type];
   if(!rule?.guard||!Array.from({length:rule.group},(_,i)=>'incident-'+e.id+'-'+i).includes(r.id)||!finite(r.hp)||r.hp<0||r.hp>8)continue;this.guardRecords.set(r.id,{...r,hostileUntil:finite(r.hostileUntil)?r.hostileUntil:0});
  }
 };
 const initParty=Game.prototype.initTravelParty;
 Game.prototype.initTravelParty=function(saved={}){
  this.loadSocietyRecords(saved.society);
  for(const r of this.ensureWorldSociety().records.values()){
   const recruited=(saved.party||[]).find(c=>c.id===r.id),s=descriptor(Atlas.roadById[r.road],r.cursorIndex??r.index,r.cursorWindow??r.window);
   if(recruited||s&&dist(routePoint(s,r.progress),this.player)<=C.load)this.roadTrafficSpawn(Atlas.roadById[r.road],r.index,r.window,r.slot,{restore:true,position:recruited});
  }return initParty.call(this,saved);
 };
 const restore=Game.prototype.finishAtlasRestore;
 Game.prototype.finishAtlasRestore=function(saved){restore.call(this,saved);
  // Player coordinates are restored after initTravelParty, so nearby non-party
  // actors must be loaded against the final saved position, not the starting camp.
  for(const r of this.ensureWorldSociety().records.values()){
   if(r.dead||this.npcs.some(n=>n.id===r.id))continue;const road=Atlas.roadById[r.road],s=descriptor(road,r.cursorIndex??r.index,r.cursorWindow??r.window);
   if(s&&dist(routePoint(s,r.progress),this.player)<=C.load)this.roadTrafficSpawn(road,r.index,r.window,r.slot,{restore:true});
  }
 };
 // Bubbles are optional overheard speech: never a modal, voice beep or notification.
 Game.prototype.worldSpeech=function(){
  if(this.dialogue||this.journey||this.sleeping||this.dead||this.dying)return [];
  const lines=[];for(const n of this.npcs){const s=n.worldChat;if(!s||!alive(n)||n.dangerState||!this.sameLevel(n,this.player)||dist(n,this.player)>260)continue;
   const age=this.time-s.start;if(age<s.turn*3.3||age>=s.turn*3.3+3.1)continue;lines.push({actor:n,text:s.line,until:s.until});
  }return lines.slice(0,C.chatLimit);
 };
 const frame=Renderer.prototype.frame;
 Renderer.prototype.frame=function(){const result=frame.call(this),g=this.g;if(!this.cam||!g.worldSpeech)return result;
  const c=this.c,k=this.k||1,used=[];this.worldSpeechRects=used;c.save();c.setTransform(k,0,0,k,0,0);
  for(const speech of g.worldSpeech()){
   const n=speech.actor,x=Math.round(n.x-this.cam.x),heroX=g.player.x-this.cam.x,head=Math.round(this.top+n.y-this.cam.y-(n.head||40)-9-(n.level?12:0)),max=Math.min(156,this.W-24,Math.max(80,(x<heroX?heroX:this.W-heroX)-30)),words=speech.text.split(' '),rows=[];let line='';
   for(const word of words){const next=line?line+' '+word:word;if(textW(c,next)>max-12&&line){rows.push(line);line=word;}else line=next;}if(line)rows.push(line);if(rows.length>2)continue;
   const width=Math.max(...rows.map(s=>textW(c,s)))+12,height=rows.length*10+8,left=Math.round(clamp(x-width/2,8,this.W-width-8)),top=head-height;
   const hero={x:g.player.x-this.cam.x-11,y:this.top+g.player.y-this.cam.y-44,w:22,h:44};
   if(x<8||x>this.W-8||top<this.top+6||top+height>this.H-12||[hero,...used].some(r=>left<r.x+r.w+6&&left+width>r.x-6&&top<r.y+r.h+6&&top+height>r.y-6))continue;
   used.push({x:left,y:top,w:width,h:height});c.globalAlpha=.94;box(c,left-1,top-1,width+2,height+2,'#30291f');box(c,left,top,width,height,'#e8d7b2');box(c,x-1,top+height,3,2,'#30291f');
   rows.forEach((row,i)=>text(c,row,left+6,top+4+i*10,'#30291f'));
  }c.restore();return result;
 };
 return Object.freeze({config:C,descriptor,routePoint});
})();
