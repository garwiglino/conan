/* Codex / ChatGPT: visible people consume the same campaign state as distant life. */
(()=>{
 const sim=g=>g.worldState.simulation;
 const guardDamage=Game.prototype.damageHumanGuard;
 Game.prototype.damageHumanGuard=function(n,amount,source){const alive=!n.guardState?.dead,result=guardDamage.call(this,n,amount,source);if(result&&alive&&n.guardState?.dead){const s=sim(this),m=s?.state.missions.find(m=>m.event===n.eventId);if(m){m.deadSlots||=[];if(!m.deadSlots.includes(n.id)){m.deadSlots.push(n.id);m.casualties=m.deadSlots.length;if(m.status==='returned'){s.state.sites[m.site].guardAvailable=Math.max(0,s.state.sites[m.site].guardAvailable-1);s.state.sites[m.site].guardPool=Math.max(0,s.state.sites[m.site].guardPool-1);}s.history('patrol_casualty',{mission:m.id,person:n.id});this.emit('save');}}}return result;};
 const supply=Game.prototype.supplyQuote;
 Game.prototype.supplyQuote=function(days=3){const q=supply.call(this,days),at=this.atlasContext(),s=at&&sim(this)?.state.sites[at.id];if(!q||!s)return q;
  const food=Math.min(q.food,Math.floor(sim(this).stock(s,'provisions'))),water=Math.min(q.water,sim(this).stock(s,'water'));
  return {food,water,cost:Math.ceil(food*sim(this).price(at.id,'provisions')+water*.15*sim(this).price(at.id,'water'))};
 };
 const buy=Game.prototype.buySupplies;
 Game.prototype.buySupplies=function(days=3){const q=this.supplyQuote(days),at=this.atlasContext();if(!sim(this))return buy.call(this,days);if(!q||!at||!q.food&&!q.water||this.player.coins<q.cost||!sim(this).purchase(at.id,q.food,q.water,q.cost))return false;
  this.player.coins-=q.cost;this.supplies.food+=q.food;this.supplies.water+=q.water;this.emit('notice',{title:'Provisions achetées',text:q.food+' rations et '+q.water.toFixed(1)+' gourdes.'});this.emit('save');return true;
 };
 const needs=Game.prototype.advanceNeeds;
 Game.prototype.advanceNeeds=function(minutes){if(!Number.isFinite(minutes)||minutes<=0||this.dead||this.dying||this.player.hp<=0)return;const waterBefore=this.supplies.water,people=1+this.party.filter(c=>!c.spirit).length,wet=Math.min(minutes,waterBefore*480/people),dry=minutes-wet,afterDrink=Math.max(0,(this.needs.dehydrated||0)-wet*2);
  needs.call(this,minutes);this.needs.dehydrated=afterDrink+dry;
  const harmful=Math.max(0,this.needs.dehydrated-180)-Math.max(0,afterDrink-180);
  if(harmful>0){const hurt=harmful/240;this.player.hp=Math.min(this.player.hp,Math.max(1,this.player.hp-hurt));for(const c of this.party)if(!c.spirit){c.hp=Math.max(0,c.hp-hurt);c.down=c.hp===0;}}
 };
 const walk=Game.prototype.movePlayer;
 Game.prototype.movePlayer=function(p,dx,dy){const fatigue=this.supplies?.fatigue||0,thirst=this.needs?.dehydrated||0,factor=1-Math.min(.2,Math.max(0,fatigue-60)/200)-Math.min(.15,thirst/2400);return walk.call(this,p,dx*factor,dy*factor);};
 const damage=Game.prototype.damageCivilian;
 Game.prototype.damageCivilian=function(n,amount,source){if(n?.civilian?.critical)return false;const before=n?.civilian?.hp,result=damage.call(this,n,amount,source);if(result&&before>0&&n.civilian.hp===1&&!this.party.some(c=>c.id===n.id)&&(['veilleur','zahra','elyne'].includes(n.id)||this.stations.some(s=>s.actor===n))){
   n.civilian.criticalUntil=this.clock+1440;n.civilian.injuredAt=this.clock;n.civilian.critical=true;this.civilianAction(n,'cower');this.cancelWorldConversation?.(n);delete n.dangerState;n.path=[];sim(this)?.requestCare(n.site||Atlas.nearestSite(...Object.values(Atlas.toWorld(n.x,n.y))).id,n.id);sim(this)?.history('essential_injured',{person:n.id});this.emit('save');
  }return result;
 };
 const present=Game.prototype.npcPresent;
 Game.prototype.npcPresent=function(n){return !n.civilian?.critical&&present.call(this,n);};
 const save=Game.prototype.serialize;
 Game.prototype.serialize=function(){const d=save.call(this);if(d.atlas){d.atlas.deaths={...this.atlasDeaths};d.atlas.relief=this.stations.filter(s=>s.originalActor).map(s=>({site:s.site,original:s.originalActor.id,replacement:s.actor.id}));if(d.atlas.civilians)for(const r of d.atlas.civilians.people){const c=this.npcs.find(n=>n.id===r.id)?.civilian;if(c?.critical)Object.assign(r,{critical:true,criticalUntil:c.criticalUntil,injuredAt:c.injuredAt});}}return d;};
 const restore=Game.prototype.finishAtlasRestore;
 Game.prototype.finishAtlasRestore=function(saved){restore.call(this,saved);for(const r of saved?.atlas?.civilians?.people||[]){const n=this.npcs.find(n=>n.id===r.id);if(n?.civilian&&r.critical&&Number.isFinite(r.criticalUntil)){Object.assign(n.civilian,{critical:true,criticalUntil:r.criticalUntil,injuredAt:Number.isFinite(r.injuredAt)?r.injuredAt:r.criticalUntil-1440});delete n.dangerState;}}
  for(const r of saved?.atlas?.relief||[]){const station=this.stations.find(s=>s.site===r.site&&s.actor.id===r.original),replacement=this.npcs.find(n=>n.id===r.replacement&&n.site===r.site&&!n.civilian?.dead);if(station&&replacement)this.assignWorldRelief(station,replacement,true);}
  // Couriers are constructed after initTravelParty: restore their membership here.
  for(const entry of saved?.atlas?.party||[])if(!this.party.some(c=>c.id===entry.id)){
   const n=this.npcs.find(n=>n.id===entry.id);if(n&&this.recruitCompanion(n,{permanent:!!entry.permanent})){const c=this.party.find(c=>c.id===entry.id);Object.assign(c,{maxHp:travelNumber(entry.maxHp,c.maxHp,10)||c.maxHp,hp:travelNumber(entry.hp,c.hp,entry.maxHp||c.maxHp),hunger:travelNumber(entry.hunger,0),down:!!entry.down,coatOwned:!!entry.coatOwned,coatWorn:!!entry.coatWorn,coldDose:travelNumber(entry.coldDose,0,1000),status:entry.status==='waiting'?'waiting':'following'});if(Number.isFinite(entry.x)&&Number.isFinite(entry.y)){n.x=entry.x;n.y=entry.y;}}
  }
 };
 Game.prototype.assignWorldRelief=function(station,n,restoring=false){if(!station.originalActor)station.originalActor=station.actor;station.actor=n;n.reliefPost={x:station.originalActor.x+22,y:station.originalActor.y};n.title='Relève de '+Atlas.byId[station.site].name;this.cancelWorldConversation(n);if(!restoring)sim(this)?.history('service_relief',{site:station.site,person:n.id});};
 const step=Game.prototype.stepNpcs;
 Game.prototype.stepNpcs=function(dt){step.call(this,dt);for(const n of this.npcs)if(n.reliefPost&&!n.dangerState&&!n.civilian?.critical&&!n.civilian?.dead&&this.dialogue?.who!==n&&dist(n,n.reliefPost)>4)this.walkNpc(n,n.reliefPost,dt);};
 const ready=Game.prototype.currentTransport;
 Game.prototype.currentTransport=function(){const s=ready.call(this);return s&&!s.actor.civilian?.critical&&!s.actor.civilian?.dead&&(!s.actor.reliefPost||dist(s.actor,s.actor.reliefPost)<8)?s:null;};
 const advance=Game.prototype.advanceAtlas;
 Game.prototype.advanceAtlas=function(dt=0){for(const m of sim(this)?.state.missions||[]){const guards=this.npcs.filter(n=>n.eventId===m.event&&!n.guardState?.dead);m.physical=guards.some(n=>dist(n,this.player)<1500);m.engaged=guards.some(n=>n.wind>0||n.attack>0||this.humanGuardTarget(n,this.ensureHumanGuard(n)));}advance.call(this,dt);const s=sim(this);if(!s)return;
  for(const n of this.npcs){const c=n.civilian;if(!c?.critical)continue;
   const station=this.stations.find(st=>st.actor===n&&!st.originalActor);const careSite=n.site||Atlas.nearestSite(...Object.values(Atlas.toWorld(n.x,n.y))).id;s.requestCare(careSite,n.id);
   if(station&&this.clock>=(c.injuredAt??this.clock)+360){const replacement=this.npcs.find(a=>a!==n&&a.site===station.site&&a.resident&&!a.reliefPost&&!a.batracien?.role&&!a.civilian?.dead&&!a.civilian?.critical&&!a.dangerState&&!this.party.some(p=>p.id===a.id));if(replacement)this.assignWorldRelief(station,replacement);}
   if(this.clock>=c.criticalUntil){const w=Atlas.toWorld(n.x,n.y),site=s.state.sites[n.site]||s.state.sites[Atlas.nearestSite(w.x,w.y).id];if(site&&s.stock(site,'medicinal')>=1&&s.stock(site,'provisions')>=1){site.stock.medicinal--;site.stock.provisions--;c.critical=false;c.hp=3;delete n.dangerState;this.civilianAction(n,'idle');s.finishCare(careSite,n.id);s.history('person_recovered',{person:n.id});for(const st of this.stations)if(st.originalActor===n){delete st.actor.reliefPost;st.actor=n;delete st.originalActor;}}else c.criticalUntil=this.clock+360;}
  }
 };
})();
