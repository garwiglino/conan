/* Hearthreaver: local routines, shared conversations and witnessed assaults.
 * Pure additions to the approved art. Coordinates and speed are game pixels.
 * Roads are the real land graph; no new routes, war or global species hostility.
 */
const BatracienSociety = (() => {
 'use strict';
 const C=BATRACIEN_CONFIG.society, B=Game.batracienRuntime;
 const roadSpecs=new Map(C.roads.map(r=>['resident-batracien-'+r.site+'-'+r.slot,r]));
 const routes=new Map(), finite=Number.isFinite;
 const alive=n=>n&&!n.dead&&!n.civilian?.dead&&!n.batracien?.dead&&(n.alpha??1)>.5&&n.phase!=='away';
 const member=(g,n)=>g.party?.some(c=>c.id===n.id);
 const locked=n=>['hit','death','startle','sit_down','stand_up','cower','cower_enter','cower_exit'].includes(n.batracien?.action);
 const point=p=>p&&finite(p.x)&&finite(p.y);
 const clampNum=(v,lo,hi,d=lo)=>finite(v)?Math.max(lo,Math.min(hi,v)):d;
 function route(id,reverse=false){
  const key=id+':'+reverse;if(routes.has(key))return routes.get(key);const spec=roadSpecs.get(id);if(!spec)return null;
  const from=reverse?spec.to:spec.site,to=reverse?spec.site:spec.to;
  const path=Atlas.findPath(from,to,{mode:'foot',allowBoat:false});
  if(!path?.length)return null;
  const segments=path.map(leg=>{const a=Atlas.vertices.get(leg.from),b=Atlas.vertices.get(leg.to);return {edge:leg.edge,road:leg.road,a:Atlas.toGame(a[0],a[1]),b:Atlas.toGame(b[0],b[1]),length:leg.length*16};});
  if(segments.some(s=>!point(s.a)||!point(s.b)||!finite(s.length)||s.length<=0||!Atlas.edgeById.get(s.edge)?.modes.includes('foot')))return null;
  const result={from,to,segments};routes.set(key,result);return result;
 }
 function roadPoint(path,index,progress){const s=path?.segments[index];if(!s)return null;const t=clampNum(progress/s.length,0,1);return {x:s.a.x+(s.b.x-s.a.x)*t,y:s.a.y+(s.b.y-s.a.y)*t};}
 function validRoad(g,id,record){
  if(!point(record))return false;const r=record.routine,p=route(id,r?.reverse===true);
  if(!p||!r||!Number.isInteger(r.edge)||r.edge<0||r.edge>=p.segments.length||!finite(r.progress)||r.progress<0||r.progress>p.segments[r.edge].length)return false;
  const expected=roadPoint(p,r.edge,r.progress);return dist(record,expected)<=320&&!g.solid(record.x,record.y,6,0);
 }
 Game.prototype.validBatracienRoutePosition=function(id,r){return validRoad(this,id,r);};
 Game.prototype.isHostileBatracien=function(n){return !!n?.batracien?.role&&alive(n)&&finite(n.batracien.hostileUntil)&&n.batracien.hostileUntil>this.clock;};
 Game.prototype.combatTargets=function(){return [...this.enemies,...this.npcs.filter(n=>this.isHostileBatracien(n))];};
 Game.prototype.restoreBatracienRoutine=function(n,record){
  const b=n.batracien;if(!b)return;
  if(b.role){n.kind='batracien';n.r=6;n.hp=b.hp;n.maxHp=BATRACIEN_CONFIG.combat[b.role].hp;n.dead=!!b.dead;n.stun=n.flash=n.hurt=0;
   const clock=this.worldState?.clock??this.clock;b.hostileUntil=clampNum(record?.hostileUntil,0,clock+C.angerMinutes);n.ai=b.hostileUntil>clock?'alert':'idle';return;}
  const slot=Number(n.id.split('-').at(-1)),kind=roadSpecs.has(n.id)?'road':C.localSlots.includes(slot)?'local':'worker';
  const r=b.routine={kind,mode:'work',wait:2+b.seed%10,goal:null,cycle:0,partner:null,chatUntil:0,chatAfter:0,edge:0,progress:0,reverse:false,approach:true,blocked:0};
  if(kind==='road'){n.name=n.label='VOYAGEUR';const spec=roadSpecs.get(n.id);n.title=(b.sex==='female'?'Voyageuse':'Voyageur')+' de '+Atlas.byId[spec.site].name;
   n.greet=()=>['Je circule entre '+Atlas.byId[spec.site].name+' et '+Atlas.byId[spec.to].name+'.','Je reste sur les routes et j’attends quand un passage est menacé.'];}
  const saved=record?.routine;if(saved?.kind!==kind)return;
  r.cycle=Number.isInteger(saved.cycle)?clampNum(saved.cycle,0,100000):0;r.wait=clampNum(saved.wait,0,60,5);
  if(kind==='road'&&validRoad(this,n.id,record)){r.reverse=saved.reverse===true;r.edge=saved.edge;r.progress=saved.progress;r.approach=saved.approach===true;
   Object.assign(n,{x:record.x,y:record.y});n.post={x:n.x,y:n.y};r.mode='road';
  }else if(kind!=='road'&&point(record)&&dist(record,n.post)<C.walkRadius+200&&!this.solid(record.x,record.y,6,0)){Object.assign(n,{x:record.x,y:record.y});}
  b.lastX=n.x;b.lastY=n.y;n.civilian.lastX=n.x;n.civilian.lastY=n.y;
 };
 Game.prototype.saveBatracienRoutine=function(n){const r=n.batracien?.routine;return r?{kind:r.kind,cycle:r.cycle,wait:r.wait,edge:r.edge,progress:r.progress,reverse:r.reverse,approach:r.approach}:undefined;};
 function safe(g,n,p,margin=18){
  if(!point(p)||g.solid(p.x,p.y,6,n.level||0)||g.localThreatAt(p.x,p.y,n.level||0,100)||g.dangerAt(p.x,p.y,n.level||0).unsafe)return false;
  if(g.stations?.some(s=>dist(p,s.actor)<32)||[...g.levers,...g.chests,...g.steles].some(s=>dist(s,p)<28))return false;
  return !g.npcs.some(a=>a!==n&&alive(a)&&dist(a,p)<margin);
 }
 Game.prototype.cancelBatracienConversation=function(n){
  const r=n?.batracien?.routine;if(!r)return;const partner=this.npcs.find(a=>a.id===r.partner);
  for(const a of [n,partner]){const s=a?.batracien?.routine;if(!s||a!==n&&s.partner!==n.id)continue;s.partner=null;s.chatUntil=0;s.chatAfter=this.time+24;s.goal=null;s.wait=4;
   if(a.batracien.action==='talk')this.civilianAction(a,'idle');}
 };
 Game.prototype.startBatracienConversation=function(a,b){
  if(a===b||![a,b].every(n=>B.isCivil(n)&&alive(n)&&!member(this,n)&&!n.dangerState&&!locked(n)&&n.batracien.routine&&!n.batracien.routine.partner&&this.time>=n.batracien.routine.chatAfter)||this.dialogue||!this.sameLevel(a,b)||dist(a,b)>C.talkRadius||!this.lineClear(a,b))return false;
  if(this.localThreatAt(a.x,a.y,a.level||0)||this.localThreatAt(b.x,b.y,b.level||0))return false;
  const end=this.time+3+(civilianHash(a.id+b.id)%4);
  for(const [n,other]of [[a,b],[b,a]]){const r=n.batracien.routine;r.partner=other.id;r.chatUntil=end;r.chatStarted=this.time;n.path=[];n.dir=this.direction(other.x-n.x,other.y-n.y);this.civilianAction(n,'talk',true);}
  return true;
 };
 function chooseLocal(g,n){
  const r=n.batracien.routine,others=g.npcs.filter(a=>a!==n&&B.isCivil(a)&&a.site===n.site&&alive(a)&&!a.dangerState&&!member(g,a)&&!a.batracien.routine?.partner&&dist(n,a)<360);
  const other=others.length?others[(n.batracien.seed+r.cycle)%others.length]:null;
  if(other)for(const [dx,dy]of [[26,0],[-26,0],[0,26],[0,-26]]){const p={x:other.x+dx,y:other.y+dy};if(safe(g,n,p)){r.goal=p;r.visit=other.id;return true;}}
  const centre=Atlas.toGame(Atlas.byId[n.site].x,Atlas.byId[n.site].y);
  for(let i=0;i<16;i++){const angle=(r.cycle*5+i+n.batracien.seed%16)*Math.PI/8,rad=72+(i%3)*40,p={x:Math.round(centre.x+Math.cos(angle)*rad),y:Math.round(centre.y+Math.sin(angle)*rad)};
   if(safe(g,n,p)){r.goal=p;r.visit=null;return true;}}
  return false;
 }
 function roadOpen(g,s,p){const status=g.worldState.edgeStatus(Atlas.edgeById.get(s.edge),g.clock);return !status.closed&&!status.events?.some(e=>Atlas.EVENT_TYPES[e.type].evacuate)&&safe(g,nullActor,p,0);}
 // `safe` also checks living bodies; this sentinel never aliases a real actor.
 const nullActor={level:0};
 function stepRoad(g,n,dt){
  const b=n.batracien,r=b.routine,path=route(n.id,r.reverse),s=path?.segments[r.edge];if(!s){g.civilianAction(n,'idle');return true;}
  if(r.wait>0){r.wait=Math.max(0,r.wait-dt);g.civilianAction(n,'idle');return true;}
  const h=((g.clock/60)%24+24)%24;if(h<6||h>=22){g.civilianAction(n,'idle');return true;}
  let dest=r.approach?s.a:roadPoint(path,r.edge,Math.min(s.length,r.progress+48));
  if(!roadOpen(g,s,dest)){r.wait=3;g.civilianAction(n,'idle');return true;}
  if(r.approach&&dist(n,s.a)<10){r.approach=false;r.progress=0;return true;}
  const old={x:n.x,y:n.y};g.walkNpc(n,dest,dt);const moved=dist(old,n);g.civilianAction(n,moved>.001?'walk':'idle');
  r.blocked=moved>.001?0:r.blocked+dt;if(r.blocked>2){n.path=[];r.wait=2;r.blocked=0;}
  if(!r.approach){const dx=s.b.x-s.a.x,dy=s.b.y-s.a.y,L=dx*dx+dy*dy;r.progress=clampNum(((n.x-s.a.x)*dx+(n.y-s.a.y)*dy)/L*s.length,0,s.length);
   // The return point during an alarm is the last position on this road, never a distant home.
   n.post={x:n.x,y:n.y};
   if(dist(n,s.b)<10){r.edge++;r.progress=0;if(r.edge>=path.segments.length){r.edge=0;r.reverse=!r.reverse;r.approach=true;r.wait=30;r.cycle++;}}}
  return true;
 }
 Game.prototype.stepBatracienRoutine=function(n,dt){
  const b=n.batracien,r=b.routine;if(!r)return false;
  if(r.partner){const other=this.npcs.find(a=>a.id===r.partner);
   if(!alive(other)||other.dangerState||member(this,other)||locked(other)||this.time>=r.chatUntil||other.batracien?.routine?.partner!==n.id||dist(n,other)>C.talkRadius||!this.lineClear(n,other)){this.cancelBatracienConversation(n);}
   else{n.dir=this.direction(other.x-n.x,other.y-n.y);this.civilianAction(n,'talk');return true;}}
  if(r.kind==='worker')return false;
  if(r.kind==='road')return stepRoad(this,n,dt);
  const h=((this.clock/60)%24+24)%24;if(h<6||h>=22){r.goal=null;return false;}
  if(r.wait>0){r.wait=Math.max(0,r.wait-dt);return false;}
  if(locked(n))return false;
  if(!r.goal){r.cycle++;if(!chooseLocal(this,n)){r.wait=8;return false;}}
  if(!safe(this,n,r.goal,10)){r.goal=null;r.wait=2;return false;}
  if(dist(n,r.goal)<10){const other=this.npcs.find(a=>a.id===r.visit);r.goal=null;r.wait=8+b.seed%12;if(other)this.startBatracienConversation(n,other);return true;}
  const old={x:n.x,y:n.y};this.walkNpc(n,r.goal,dt);const moved=dist(n,old);this.civilianAction(n,moved>.001?'walk':'idle');r.blocked=moved>.001?0:r.blocked+dt;
  if(r.blocked>2){r.goal=null;n.path=[];r.wait=3;r.blocked=0;}return true;
 };
 // World-time progression of distant road travellers, sampled on the same graph.
 // Stop before the visible area; near actors always use collision-checked local movement.
 const advance=Game.prototype.advanceAtlas;
 Game.prototype.advanceAtlas=function(dt=0){const previous=this.atlasLastClock??this.clock;advance.call(this,dt);const minutes=Math.max(0,this.clock-previous);
  if(!minutes||this.dialogue||this.dead||this.dying)return;
  for(const n of this.npcs){const r=n.batracien?.routine;if(r?.kind!=='road'||!alive(n)||n.dangerState||member(this,n)||r.partner||dist(n,this.player)<1100)continue;
   if(r.wait>0){r.wait=Math.max(0,r.wait-minutes*DAY_LEN/1440);continue;}
   if(r.approach){stepRoad(this,n,Math.min(2,minutes*DAY_LEN/1440));continue;}
   const hour=((this.clock/60)%24+24)%24;if(hour<6||hour>=22)continue;
   let budget=Math.min(6144,minutes*80*16),count=0;
   while(budget>.01&&count++<128){const path=route(n.id,r.reverse),s=path?.segments[r.edge];if(!s)break;
    const amount=Math.min(48,budget,s.length-r.progress),p=roadPoint(path,r.edge,r.progress+amount);
    if(dist(p,this.player)<1000||!roadOpen(this,s,p))break;
    n.dir=this.direction(p.x-n.x,p.y-n.y);Object.assign(n,p);r.progress+=amount;budget-=amount;n.post={...p};n.batracien.lastX=n.x;n.batracien.lastY=n.y;
    if(r.progress>=s.length-.01){r.edge++;r.progress=0;if(r.edge>=path.segments.length){r.edge=0;r.reverse=!r.reverse;r.approach=true;r.wait=30;r.cycle++;break;}}
   }
  }
 };
 // Only a direct, witnessed assault creates anger. Hits from monsters never accuse Kaldor.
 Game.prototype.reportBatracienAssault=function(victim,source){
  if(source!==this.player||!victim||!this.npcs.includes(victim)||!this.sameLevel(victim,source))return false;
  this.cancelBatracienConversation(victim);let alerted=false;
  for(const n of this.npcs){if(!B.isArmed(n)||!alive(n)||!this.sameLevel(n,victim))continue;
   if(n!==victim&&(dist(n,victim)>C.witnessRadius||!this.lineClear(n,victim)&&!this.lineClear(n,source)))continue;
   const b=n.batracien,fresh=!this.isHostileBatracien(n);b.hostileUntil=this.clock+C.angerMinutes;b.lastSeen=this.time;b.lastPlayer={x:source.x,y:source.y};n.provoked=true;n.ai='chase';n.kind='batracien';n.hp=b.hp;n.maxHp=BATRACIEN_CONFIG.combat[b.role].hp;n.r=6;n.path=[];
   if(fresh){b.cooldown=Math.min(b.cooldown||0,.5);alerted=true;}
   if(this.dialogue?.who===n)this.dialogue=null;
  }
  if(alerted)this.emit('save');
  if(alerted)this.emit('notice',{title:'Les gardes interviennent',text:'Une agression a été vue. Éloigne-toi et cesse le combat pour les semer.'});
  return alerted;
 };
 Game.prototype.batracienWardenTarget=function(n){
  if(!this.isHostileBatracien(n))return null;const p=this.player,b=n.batracien;
  if(this.dead||this.dying||!this.sameLevel(n,p)||dist(n,n.post)>C.pursuitRadius)return null;
  if(dist(n,p)<220&&this.lineClear(n,p)){b.lastSeen=this.time;b.lastPlayer={x:p.x,y:p.y};return p;}
  return null; // Do not track the player's hidden live coordinates through walls.
 };
 const localThreat=Game.prototype.localThreatAt;
 Game.prototype.localThreatAt=function(x,y,level=0,radius=CIVILIAN_THREAT_RADIUS){
  return localThreat.call(this,x,y,level,radius)||this.npcs.find(n=>this.isHostileBatracien(n)&&(n.level||0)===level&&Math.hypot(n.x-x,n.y-y)<radius&&(radius<=48||this.lineClear({x,y,level},n)))||null;
 };
 const damageCivilian=Game.prototype.damageCivilian;
 Game.prototype.damageCivilian=function(n,amount,source){
  const c=this.ensureCivilian(n),before=c?.hp,wasDead=c?.dead;
  const accepted=damageCivilian.call(this,n,amount,source);if(!accepted)return accepted;
  if(source===this.player)this.reportBatracienAssault(n,source);
  this.cancelBatracienConversation(n);
  if(c.hp<before){n.flash=.075;this.spill(n,source||{x:n.x,y:n.y+10},false);this.emit('hit',{heavy:source===this.player&&source.combo===3});
   if(source===this.player)this.player.hitPause=source.combo===3?.075:.04;
   if(c.dead&&!wasDead){this.spill(n,source||n,true);this.emit('bodyfall');}}
  return accepted;
 };
 const guardStrike=Game.prototype.guardStrike;
 Game.prototype.guardStrike=function(n,e){const hp=e.hp;guardStrike.call(this,n,e);if(e.hp<hp){this.spill(e,n,false);if(e.dead)this.spill(e,n,true);this.emit('hit');}};
 const talk=Game.prototype.talkTo;
 Game.prototype.talkTo=function(n){if(this.isHostileBatracien(n))return false;this.cancelBatracienConversation(n);return talk.call(this,n);};
 const present=Game.prototype.npcPresent;
 Game.prototype.npcPresent=function(n){return !this.isHostileBatracien(n)&&present.call(this,n);};
 const assess=Game.prototype.assessCivilians;
 Game.prototype.assessCivilians=function(force=false){assess.call(this,force);for(const n of this.npcs)if(n.dangerState&&n.batracien?.routine?.partner)this.cancelBatracienConversation(n);};
 const update=Game.prototype.update;
 Game.prototype.update=function(dt,input){const running=!this.dialogue&&!this.journey&&!this.sleeping&&!this.dying&&!this.dead;update.call(this,dt,input);
  if(running)for(const n of this.npcs)if(n.civilian)n.flash=Math.max(0,(n.flash||0)-clampNum(dt,0,.04));
 };
 // A saved travel quote or a bed is not an escape button during a witnessed fight.
 const startJourney=Game.prototype.startJourney;
 Game.prototype.startJourney=function(plan){if(this.npcs.some(n=>this.isHostileBatracien(n)&&this.sameLevel(n,this.player)&&dist(n,this.player)<220&&this.lineClear(n,this.player))){this.emit('notice',{title:'Combat en cours',text:'Sème les gardes avant de prendre un transport.'});return false;}return startJourney.call(this,plan);};
 const sleep=Game.prototype.sleep;
 Game.prototype.sleep=function(minutes){if(this.npcs.some(n=>this.isHostileBatracien(n)&&this.sameLevel(n,this.player)&&dist(n,this.player)<220&&this.lineClear(n,this.player)))return false;return sleep.call(this,minutes);};
 const draw=Renderer.prototype.npcDraw;
 Renderer.prototype.npcDraw=function(n){draw.call(this,n);if(!alive(n)||this.g.isHostileBatracien(n)||!n._img||this.cam&&(n.x<this.cam.x-80||n.x>this.cam.x+this.W+80||n.y<this.cam.y-80||n.y>this.cam.y+this.H+80))return;
  const c=this.c;if(n.flash>0){c.save();c.globalAlpha=.35;c.globalCompositeOperation='lighter';c.drawImage(n._img,Math.round(n.x)-40,Math.round(n.y)-52);c.restore();}
  const r=n.batracien?.routine;if(r?.partner&&this.g.time<r.chatUntil){const turn=Math.floor((this.g.time-(r.chatStarted||0))/1.5)%2,first=n.id<r.partner;
   if(first===(turn===0)){const line=first?'Bonne route.':'Prends soin de toi.',w=textW(c,line)+8,x=Math.round(n.x-w/2),y=Math.round(n.y)-43;c.save();box(c,x,y-2,w,12,PAL.ink);text(c,line,x+4,y,'#fff0be');c.restore();}}

 };
 return Object.freeze({route,roadPoint,roadSpecs,safe,config:C});
})();
Game.batracienSociety=BatracienSociety;
