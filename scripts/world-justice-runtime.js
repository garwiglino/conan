/* Codex / ChatGPT — actual witnesses, local sanctions and bounded custody.
 * No instant national bounty, invented witness or off-screen killing of a witness.
 */
(()=>{
 'use strict';
 const alive=n=>n&&!n.dead&&!n.civilian?.dead&&!n.batracien?.dead&&!n.guardState?.dead&&(n.alpha??1)>.5&&n.phase!=='away';
 const law=g=>g.worldState?.justice;
 const playerSource=(g,s)=>s===g.player||typeof s?.owner==='string'&&['player','kaldor'].includes(s.owner);
 const dead=n=>!!(n?.dead||n?.civilian?.dead||n?.batracien?.dead||n?.guardState?.dead);
 Game.prototype.justiceSite=function(n=this.player){
  if(n!==this.player&&(n?.eventGuard||n?.convoyGuard||n?.batracien?.role)){const e=this.worldState.events.find(e=>e.id===n.eventId),id=e?.mandateSite||n.site||n.batracien?.site;if(law(this)?.localSite(id))return id;}
  const w=Atlas.toWorld(n.x,n.y),sites=Atlas.nodes.filter(s=>s.rest);return sites.reduce((a,b)=>!a||Math.hypot(b.x-w.x,b.y-w.y)<Math.hypot(a.x-w.x,a.y-w.y)?b:a,null)?.id;
 };
 Game.prototype.isJusticeGuard=function(n){return alive(n)&&(!!n.eventGuard||n.convoyGuard&&this.worldState.simulation?.state.sites[n.site]?.authority===this.worldState.simulation?.state.sites[this.justiceSite(n)]?.authority||!!n.batracien?.role&&!n.eventId&&['village_guard','channel_sentinel','boat_escort','scout','captain'].includes(n.batracien.role));};
 Game.prototype.justiceEffect=function(n=null){return law(this)?.effect(this.justiceSite(n||this.player),n?.id,this.clock)||{wanted:false,refuse:false,price:1,score:0};};
 Game.prototype.justiceWitnesses=function(victim){
  return this.npcs.filter(n=>alive(n)&&n.id!=='fairy'&&!this.party.some(c=>c.id===n.id)&&this.sameLevel(n,victim)&&dist(n,victim)<=180&&(n===victim||this.lineClear(n,victim)&&this.lineClear(n,this.player))).map(n=>({id:n.id,guard:this.isJusticeGuard(n),site:this.justiceSite(n)}));
 };
 Game.prototype.recordJusticeViolence=function(n,witnesses,kind=null){
  const j=law(this);if(!j)return;kind||=dead(n)?'murder':n.civilian?.critical||Math.min(n.civilian?.hp??Infinity,n.guardState?.hp??Infinity,n.batracien?.hp??Infinity)<=1?'grave_injury':'assault';
  const site=this.justiceTerritorialSite?.(n)||this.justiceSite(n),victimInfo=this.justiceIdentity?.(n)||{};if(witnesses.some(w=>w.id===n.id&&w.guard))victimInfo.role='guard';const c=j.record({victim:n.id,site,kind,victimInfo,witnesses:witnesses.map(w=>w.id),position:Atlas.toWorld(this.player.x,this.player.y),at:this.clock});if(!c)return;
  for(const w of witnesses)if(c.witnesses[w.id]&&w.identity)c.witnesses[w.id].identity=w.identity;
  if(dead(n))j.witnessDied(n.id);
  for(const w of witnesses){const actor=this.npcs.find(a=>a.id===w.id);if(w.guard&&alive(actor)&&j.zone(w.site)?.id===j.zone(c.site)?.id)this.fileJusticeStatement(c.id,w.id,this.clock,w.site);}
  this.worldState.simulation?.history('violence_recorded',{case:c.id,kind,site,witnesses:witnesses.map(w=>w.id)});this.emit('save');
 };
 Game.prototype.recordJusticeDeath=function(n){
  const j=law(this),w=Atlas.toWorld(n.x,n.y),site=this.justiceSite(n);if(!j)return;
  const scene=j.death({victim:n.id,site,x:w.x,y:w.y,level:n.level||0,at:this.clock});if(!scene)return;
  // A missing worker is not replaced at reload, and losses lower actual capacity.
  const s=this.worldState.simulation?.state.sites[n.site||n.batracien?.site];if(s&&(n.resident||n.batracien&&!n.eventId)){
   this.worldState.simulation.systems.death(s.id,n.id,{role:n.batracien?.role?'guard':'worker'});
  }
  this.worldState.simulation?.history('violent_death',{person:n.id,site,scene:scene.id});
 };
 // Damage handlers used to anger every guard before knowing whether a hit
 // was accepted or criminal. Defer that reaction until the actual injury exists.
 const reportAssault=Game.prototype.reportBatracienAssault;
 Game.prototype.reportBatracienAssault=function(n,source){if(this._justiceDamage&&source===this.player)return false;return reportAssault.call(this,n,source);};
 for(const name of ['damageCivilian','damageHumanGuard','damageBatracienGuard']){
  const native=Game.prototype[name];Game.prototype[name]=function(n,amount,source){
   const culpable=playerSource(this,source)&&alive(n)&&Number.isFinite(amount)&&amount>0,witnesses=culpable?this.justiceWitnesses(n):null;
   if(this.isHumanGuard(n))this.ensureHumanGuard(n);else if(!n.batracien?.role)this.ensureCivilian(n);
   const hp=()=>name==='damageHumanGuard'?(n.guardState?.hp??Infinity):name==='damageBatracienGuard'?(n.batracien?.hp??Infinity):(n.civilian?.hp??Infinity),before=hp(),old=this._justiceDamage;
   this._justiceDamage=old||culpable;let result;try{result=native.call(this,n,amount,source);}finally{this._justiceDamage=old;}
   const attempt=!result&&culpable&&n.civilian?.critical&&this.sameLevel(n,this.player)&&dist(n,this.player)<60&&this.lineClear(n,this.player)&&this.clock>=(n.justiceAttemptAfter||0);
   if(result&&culpable||attempt){
    const kind=dead(n)?'murder':attempt||n.civilian?.critical||hp()<=1||before-hp()>2?'grave_injury':'assault';
    const qualified=law(this)?.qualify(n.id,kind,this.clock),effect=this.justiceEffect(n),crime=qualified||effect.wanted||effect.refuse;if(attempt)n.justiceAttemptAfter=this.clock+1;
    if(crime){this.recordJusticeViolence(n,witnesses,kind);this.reportBatracienAssault(n,this.player);this.refreshJusticeFear(true);}
    else{
     this.alarmWitnesses(n,this.player);
     for(const actor of this.npcs)if(actor.dangerState?.attacker==='player'&&actor.dangerState.hitAt===this.time)actor.dangerState.justicePanicUntil=this.clock+4;
     this.emit('notice',{title:'Attention à ton arme',text:'Un coup isolé peut être accidentel. Cesse immédiatement : une nouvelle attaque sera une agression.'});this.emit('save');
    }
   }
   if(result&&dead(n)){law(this)?.witnessDied(n.id);this.recordJusticeDeath(n);this.emit('save');}return result;
  };
 }
 Game.prototype.fileJusticeStatement=function(id,witness,at=this.clock,contact=null){const j=law(this),c=j?.state.cases.find(c=>c.id===id),first=c?.reportedAt===null;if(!j?.file(id,witness,at,contact))return false;
  this.worldState.simulation?.history('statement_filed',{case:id,witness,site:c.site});if(first)this.emit('notice',{title:'Une agression a été signalée',text:'Les autorités de '+Atlas.byId[c.site].name+' te recherchent. Éloigne-toi ou rends-toi à une garde locale.'});this.emit('save');return true;
 };
 Game.prototype.fileJusticeDiscovery=function(id,person){
  const j=law(this);if(!j?.fileDiscovery(id,person,this.clock))return false;const s=j.state.scenes.find(s=>s.id===id),mass=s.reportedVictims.length>=3;
  if(mass&&s.event){const old=this.worldState.events.find(e=>e.id===s.event);if(old?.type==='crime_scene')this.worldState.resolve(old.id,this.clock);}
  const e=this.worldState.add(mass?'massacre':'crime_scene',s.site,this.clock,1440,{position:s,source:'Habitants de '+Atlas.byId[s.site].name,detail:s.reportedVictims.length+' morts signalés ; auteur non déduit de la seule découverte.'});if(e)s.event=e.id;
  this.worldState.simulation?.history('bodies_reported',{scene:s.id,person,count:s.reportedVictims.length,site:s.site});this.emit('save');return true;
 };
 Game.prototype.discoverJusticeScenes=function(){
  const j=law(this);if(!j||this._justiceScanWorld===this.worldState&&this.time<(this._justiceScanAt||0))return;this._justiceScanWorld=this.worldState;this._justiceScanAt=this.time+.5;for(const s of j.state.scenes){if(s.reportedVictims.length>=s.victims.length)continue;
   for(const n of this.npcs){if(!alive(n)||n.id==='fairy'||n.civilian?.critical||this.party.some(c=>c.id===n.id)||(n.level||0)!==s.level)continue;
    const centre=Atlas.toGame(s.x,s.y);if(dist(n,centre)>24*16+100)continue;
    const visible=s.victims.filter(v=>{const p=Atlas.toGame(v.x,v.y);p.level=s.level;return dist(n,p)<100&&this.lineClear(n,p);}).map(v=>v.id);
    if(!j.discover(s.id,n.id,visible,this.clock))continue;this.cancelWorldConversation(n);n.justiceDiscoverySay={at:this.time,text:visible.length>=3?'Des morts… Il faut prévenir la garde !':'Qu’est-ce qui s’est passé ici ? Il faut prévenir quelqu’un.'};
    if(this.isJusticeGuard(n))this.fileJusticeDiscovery(s.id,n.id);
    else if(!n.dangerState){const p=Atlas.toGame(s.x,s.y);p.level=s.level;p.id=s.id;this.startCivilianFlight(n,p);}
   }
  }
 };
 Game.prototype.stepJusticeWitnesses=function(dt,at=this.clock){
  const j=law(this);if(!j||this._justiceCustody||!j.state.cases.length&&!j.state.scenes.length)return;this.discoverJusticeScenes();
  const contacts=this.npcs.filter(n=>alive(n)&&!n.civilian?.critical&&(this.isJusticeGuard(n)||this.stations.some(s=>s.actor===n)));
  for(const n of this.npcs){if(dead(n)){j.witnessDied(n.id);delete n.justiceReport;continue;}if(!alive(n)||n.civilian?.critical||this.party.some(c=>c.id===n.id))continue;
   const cases=j.pending(n.id,at),scenes=j.discoveries(n.id);if(!cases.length&&!scenes.length){delete n.justiceReport;continue;}
   const contact=contacts.filter(a=>a!==n&&this.sameLevel(a,n)&&(scenes.length||cases.some(c=>j.zone(this.justiceSite(a))?.id===j.zone(c.site)?.id&&j.canReport(c,this.justiceIdentity(n),this.justiceSite(a)).allowed))&&dist(n,a)<540).sort((a,b)=>dist(n,a)-dist(n,b)).find(a=>dist(n,a)<44?this.lineClear(n,a):!this.solid(a.x,a.y+18,5,0));
   if(!contact){delete n.justiceReport;continue;}
   if(dist(n,contact)<44&&this.lineClear(n,contact)){for(const c of cases)if(j.zone(c.site)?.id===j.zone(this.justiceSite(contact))?.id&&j.canReport(c,this.justiceIdentity(n),this.justiceSite(contact)).allowed)this.fileJusticeStatement(c.id,n.id,at,this.justiceSite(contact));for(const s of scenes)this.fileJusticeDiscovery(s.id,n.id);delete n.justiceReport;continue;}
   if(n.dangerState||n.hurt||n.stun||this.dialogue?.who===n)continue;
   this.cancelWorldConversation?.(n);n.justiceReport={contact:contact.id};this.walkNpc(n,{x:contact.x,y:contact.y+18},dt);
  }
 };
 const npcs=Game.prototype.stepNpcs;
 Game.prototype.stepNpcs=function(dt){const all=this.npcs;try{this.npcs=all.filter(n=>!n.justiceReport);npcs.call(this,dt);}finally{this.npcs=all;}this.stepJusticeWitnesses(dt);};
 const guards=Game.prototype.stepHumanGuards;
 Game.prototype.stepHumanGuards=function(dt){guards.call(this,dt);const j=law(this);if(!j||this._justiceCustody)return;for(const n of this.npcs)if(dist(n,this.player)<220&&this.sameLevel(n,this.player)&&this.isJusticeGuard(n)&&this.lineClear(n,this.player))j.sighting(this.justiceSite(n),Atlas.toWorld(this.player.x,this.player.y),n.id,this.clock);};
 const advance=Game.prototype.advanceAtlas;
 Game.prototype.advanceAtlas=function(dt=0){const before=this.atlasLastClock??this.clock,minutes=this.clock-before,j=law(this);if(this._justiceCustody||minutes<2||!j?.state.cases.length)return advance.call(this,dt);
  // Sleep/transport time does not freeze an already observed witness. Use a
  // bounded, collision-checked local path, never an instant statement timer.
  this.discoverJusticeScenes();
  const eligible=this.npcs.filter(n=>alive(n)&&!n.civilian?.critical&&j.pending(n.id,before).length&&(this.journey||this.sleeping||minutes>10||dist(n,this.player)>900));
  for(const n of eligible){if(n.dangerState&&dist(n,this.player)>300&&!this.localThreatAt(n.x,n.y,n.level||0,120))delete n.dangerState;if(n.civilian){n.civilian.elapsed+=WorldPacing.realSeconds(minutes);if(n.civilian.action==='seated')this.civilianAction(n,'idle');}}
  this.stepJusticeWitnesses(0,before);
  for(const n of eligible){const contact=this.npcs.find(a=>a.id===n.justiceReport?.contact);if(!contact||n.dangerState)continue;let remaining=WorldPacing.realSeconds(minutes),moved=0;
   for(let i=0;i<100&&remaining>0&&dist(n,contact)>=44;i++){const old={x:n.x,y:n.y};this.walkNpc(n,{x:contact.x,y:contact.y+18},Math.min(remaining,1));const distance=dist(old,n);if(distance<.001)break;moved+=distance;remaining-=distance/WorldPacing.civilianWalk;}
   if(dist(n,contact)<44&&this.lineClear(n,contact)){const at=before+Math.min(minutes,moved/(WorldPacing.civilianWalk*WorldPacing.dayRealSeconds/1440));for(const c of j.pending(n.id,at))if(j.zone(c.site)?.id===j.zone(this.justiceSite(contact))?.id&&j.canReport(c,this.justiceIdentity(n),this.justiceSite(contact)).allowed)this.fileJusticeStatement(c.id,n.id,at,this.justiceSite(contact));delete n.justiceReport;}
  }advance.call(this,dt);
 };
 // Keep a witness's reporting goal from fighting ordinary stroll/road/courier AI.
 for(const name of ['stepRoadTraffic','stepWorldLocal','stepBatracienRoutine']){const native=Game.prototype[name];Game.prototype[name]=function(n,...args){if(n.justiceReport&&!n.dangerState)return name==='stepBatracienRoutine'?true:undefined;return native.call(this,n,...args);};}
 const couriers=Game.prototype.stepCouriers;
 Game.prototype.stepCouriers=function(minutes){const all=this.couriers;try{this.couriers=all.filter(c=>!this.npcs.find(n=>n.id===c.id)?.justiceReport);return couriers.call(this,minutes);}finally{this.couriers=all;}};
 const speech=Game.prototype.worldSpeech;
 Game.prototype.worldSpeech=function(){const lines=speech.call(this);if(this.dialogue||this.journey||this.sleeping||this.dead||this.dying)return lines;for(const n of this.npcs)if(alive(n)&&n.justiceDiscoverySay&&this.time-n.justiceDiscoverySay.at<3.1&&this.sameLevel(n,this.player)&&dist(n,this.player)<260)lines.push({actor:n,text:n.justiceDiscoverySay.text,until:n.justiceDiscoverySay.at+3.1});return lines.slice(0,2);};
 for(const name of ['isHostileHumanGuard','isHostileBatracien']){const native=Game.prototype[name];Game.prototype[name]=function(n){if(this._justiceCustody)return false;return native.call(this,n)||!!((name!=='isHostileBatracien'||n?.batracien?.role)&&(name!=='isHostileHumanGuard'||this.isHumanGuard(n))&&this.isJusticeGuard(n)&&law(this)?.effect(this.justiceSite(n),null,this.clock).wanted);};}
 for(const name of ['atlasNews','npcDirections']){const native=Game.prototype[name];Game.prototype[name]=function(n){if(this.justiceEffect(n).refuse)return ['Après ce qui s’est passé, je ne te donnerai pas de renseignements. Laisse passer du temps et n’aggrave pas ton cas.'];return native.call(this,n);};}
 const quote=Game.prototype.supplyQuote;
 Game.prototype.supplyQuote=function(...args){const q=quote.apply(this,args);if(q){const e=this.justiceEffect();return {...q,cost:Math.ceil(q.cost*e.price),justiceMarkup:e.price};}return q;};
 const plan=Game.prototype.planJourney;
 Game.prototype.planJourney=function(...args){const p=plan.apply(this,args);if(p){const e=this.justiceEffect();p.cost=Math.ceil(p.cost*e.price);p.justiceMarkup=e.price;}return p;};
 Game.prototype.canJusticeArrest=function(n){return !!n&&!this._justiceCustody&&!this.dead&&!this.dying&&dist(n,this.player)<64&&this.sameLevel(n,this.player)&&this.isJusticeGuard(n)&&this.lineClear(n,this.player)&&!!law(this)?.effect(this.justiceSite(n),null,this.clock).wanted;};
 const mechanism=Game.prototype.mechanismContext;
 Game.prototype.mechanismContext=function(){if(!this.player.attack&&!this.player.dash){const guard=this.npcs.filter(n=>dist(n,this.player)<48&&this.canJusticeArrest(n)).sort((a,b)=>dist(a,this.player)-dist(b,this.player))[0];if(guard)return {kind:'talk',npc:guard,text:'E  SE RENDRE À LA GARDE'};}return mechanism.call(this);};
 const talk=Game.prototype.talkTo;
 Game.prototype.talkTo=function(n){if(!this.canJusticeArrest(n))return talk.call(this,n);
  this.cancelWorldConversation(n);this.talk(n.name||'LA GARDE',['Tu es recherché ici. Pose ton arme. Le poste tranchera ton affaire.'],n,n.head||40,null,{prompt:'Que fais-tu ?',options:[{label:'Se rendre',act:()=>this.arrestByJustice(n),end:true},{label:'Refuser et partir',lines:['Alors garde tes distances. Nous ne laisserons pas passer ça.'],end:true}]});return true;
 };
 const menu=Game.prototype.npcMenu;
 Game.prototype.npcMenu=function(n){const m=menu.call(this,n);if(this.justiceEffect(n).refuse){const side=m.filter(o=>o.end||o.panel||o.mark||/voyag|embar|provision/i.test(o.label));side.unshift({label:'Parler de ma situation',lines:['Ici, les gens se méfient de toi. La garde peut régler les poursuites. Pour la confiance, il faudra du temps sans nouvel incident.']});return side;}return m;};
 const playerDamage=Game.prototype.damagePlayer,die=Game.prototype.die;
 Game.prototype.damagePlayer=function(amount,source){const n=source?.owner?this.npcs.find(n=>n.id===source.owner):source,old=this._justiceLethalGuard;this._justiceLethalGuard=this.canJusticeArrest(n)?n:null;try{return playerDamage.call(this,amount,source);}finally{this._justiceLethalGuard=old;}};
 Game.prototype.die=function(){if(this._justiceLethalGuard&&this.arrestByJustice(this._justiceLethalGuard))return;return die.call(this);};
 Game.prototype.arrestByJustice=function(guard){
  if(!this.canJusticeArrest(guard))return false;const site=this.justiceSite(guard),j=law(this),sentence=j.sentence(site,this.player.coins,this.clock);if(!sentence)return false;
  const p=this.player,water=this.supplies.water,food=this.supplies.food,fatigue=this.supplies.fatigue,hp=p.hp,people=this.party.map(c=>({c,hp:c.hp,hunger:c.hunger,down:c.down}));
  this._justiceCustody=true;this.dialogue=null;this.journey=null;this.sleeping=null;this.transportSession=this.pendingTransport=null;this.player.coins-=sentence.money;
  p.attack=p.attackBuffer=p.attackCD=p.dash=p.comboWindow=p.riposte=p.parry=0;p.guard=false;this.targetId=null;this.shots=[];this.footprints=[];
  try{this.clock=sentence.releaseAt;this.advanceAtlas(0);}finally{this._justiceCustody=false;}
  // Custody is a paid time skip, not free healing, confiscation of quest gear or
  // starvation of companions while their player is unable to act.
  Object.assign(this.supplies,{water,food,fatigue});p.hp=hp>0?hp:1;for(const r of people)Object.assign(r.c,{hp:r.hp,hunger:r.hunger,down:r.down});
  for(const n of this.npcs){if(j.localSite(this.justiceSite(n))?.jurisdiction!==j.localSite(site)?.jurisdiction)continue;
   if(n.guardState){n.guardState.hostileUntil=0;n.guardState.strikeId=null;}if(n.batracien?.role){n.batracien.hostileUntil=0;n.provoked=false;n.ai='idle';}if(n.eventGuard||n.batracien?.role)n.wind=n.attack=0;
  }
  const landing=this.stationLanding(site)||{x:guard.post?.x??guard.x,y:(guard.post?.y??guard.y)+24};this.placeSafely(landing.x,landing.y);p.inv=Math.max(p.inv||0,3);p.hurt=p.stun=0;p.moving=false;
  for(const c of this.party)if(c.status!=='waiting'){const n=this.partyActor(c.id);if(n){n.x=p.x+18;n.y=p.y+18;c.x=n.x;c.y=n.y;}}
  const s=this.worldState.simulation?.state.sites[site];if(s)s.treasury+=sentence.money;
  this.worldState.simulation?.history('arrest_and_release',{sentence:sentence.id,site,money:sentence.money,minutes:sentence.minutes});this.updateLocation(0);
  this.emit('notice',{title:'Arrestation · remise en liberté',text:Math.round(sentence.minutes/60)+' h de retenue et '+sentence.money+' pièces prélevées. Les poursuites locales sont réglées ; la méfiance diminuera avec le temps.'});this.emit('save');return true;
 };
 const needs=Game.prototype.advanceNeeds;
 Game.prototype.advanceNeeds=function(minutes){if(!this._justiceCustody)return needs.call(this,minutes);};
 const restore=Game.prototype.finishAtlasRestore;
 Game.prototype.finishAtlasRestore=function(saved){restore.call(this,saved);for(const n of this.npcs)if(dead(n))law(this)?.witnessDied(n.id);};
})();
