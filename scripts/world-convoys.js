/* Codex / ChatGPT — one cargo, one roster, one position, on and off screen.
 * Existing human/guard/cart/boat art is deliberately temporary. No new sprites.
 */
(()=>{
 'use strict';
 const live=c=>!c.escortReturned&&['travel','returning','abandoned'].includes(c.status);
 const living=n=>n&&!n.dead&&!n.civilian?.dead&&!n.guardState?.dead;
 const simulation=g=>g.worldState.simulation;
 Game.prototype.convoyActors=function(c){return this.npcs.filter(n=>n.convoyId===c.id);};
 Game.prototype.convoyPosition=function(c){const s=simulation(this),p=s.cargoPosition(c);return c.localPosition&&Number.isFinite(c.localPosition.x)&&Number.isFinite(c.localPosition.y)?{...c.localPosition}:Atlas.toGame(p.x,p.y);};
 Game.prototype.saveConvoyActors=function(c){const s=simulation(this);for(const n of this.convoyActors(c)){const u=s.cargoUnits(c).find(u=>u.id===n.id);if(!u)continue;const health=n.convoyGuard?n.guardState:n.civilian;if(health&&u.hp<health.hp){health.hp=u.hp;health.dead=u.hp<=0;if(health.dead&&!n.convoyGuard)this.civilianAction(n,'death',true);}s.damageCargoUnit(c,n.id,n.convoyGuard?n.guardState?.hp??u.hp:n.civilian?.hp??u.hp,n.guardState?.hostileUntil||0);Object.assign(u,{x:n.x,y:n.y,dir:n.dir});if(n.civilian){u.appearance={...n.civilian.appearance};if(c.staffReserved)s.systems.crewHealth(s.state.sites[c.from],u,c.id);}}};
 Game.prototype.convoyInDanger=function(c){const actors=this.convoyActors(c),position=this.convoyPosition(c);return actors.some(n=>living(n)&&(n.wind||n.attack||n.hurt||n.dangerState||n.convoyGuard&&(this.isHostileHumanGuard(n)||this.humanGuardTarget(n,this.ensureHumanGuard(n)))))||this.enemies.some(e=>!e.dead&&e.world&&!e.friendly&&this.sameLevel(e,{level:0})&&dist(e,position)<260&&this.lineClear(e,position));};
 Game.prototype.unloadConvoy=function(c){if(this.convoyInDanger(c)){c.encounter=true;const position=this.convoyPosition(c);simulation(this).beginCargoEncounter(c,this.enemies.filter(e=>e.world&&!e.dead&&!e.friendly&&this.sameLevel(e,{level:0})&&dist(e,position)<260&&this.lineClear(e,position)));}this.saveConvoyActors(c);this.npcs=this.npcs.filter(n=>n.convoyId!==c.id);this.atlasNpcs=this.atlasNpcs.filter(n=>n.convoyId!==c.id);simulation(this).controlCargo(c.id,false);};
 Game.prototype.syncWorldConvoys=function(){
  const s=simulation(this);if(!s)return;for(const e of this.enemies){const record=s.state.hostiles?.[e.id];if(record){e.hp=Math.min(e.hp,record.hp);if(e.hp<=0){e.dead=true;this.atlasDeaths[e.id]=true;}}}for(const c of s.state.shipments.filter(live))s.catchUpCargo(c,this.clock);const active=s.state.shipments.filter(live),loaded=new Set(this.npcs.filter(n=>n.convoyId).map(n=>n.convoyId));let count=loaded.size;
  for(const id of loaded){const c=s.state.shipments.find(c=>c.id===id);if(!c)continue;
   if(!live(c)||c.path[c.leg]?.mode==='boat'||this.journey||this.sleeping||dist(this.convoyPosition(c),this.player)>1500){this.unloadConvoy(c);count--;}
  }
  if(this.journey||this.sleeping)return;
  for(const c of active){const position=this.convoyPosition(c),leg=c.path[c.leg],distance=dist(position,this.player);
   if(distance>1100||leg?.mode==='boat')continue;
   // Every nearby land cargo is materialised. The simulation's global shipment
   // cap bounds actors; a rendering budget must never freeze the economy.
   if(this.npcs.some(n=>n.convoyId===c.id))continue;
   s.controlCargo(c.id,true);
   const candidates=[[0,0],[16,0],[-16,0],[0,20],[24,20],[-24,20],[0,-20]];let centre;
   for(const [x,y]of candidates){const p={x:position.x+x,y:position.y+y};if(!this.solid(p.x,p.y,6,0)){centre=p;break;}}if(!centre){s.controlCargo(c.id,false);continue;}
   c.localPosition={...centre};
   for(const [i,u]of s.cargoUnits(c).entries()){
    if(u.hp<=0||this.atlasDeaths[u.id])continue;const offset=u.role==='guard'?{x:i%2?30:-30,y:24}:{x:i?0:0,y:i?28:0},saved=Number.isFinite(u.x)&&Number.isFinite(u.y)&&dist(u,centre)<200&&!this.solid(u.x,u.y,5,0),p=saved?{x:u.x,y:u.y}:{x:centre.x+offset.x,y:centre.y+offset.y};
    if(this.solid(p.x,p.y,5,0)){p.x=centre.x;p.y=centre.y;}
    const n={id:u.id,...p,convoyId:c.id,convoyGuard:u.role==='guard',convoyRole:u.role,site:c.from,post:{...p},world:true,alpha:1,dir:u.dir??2,look:'nomade',head:30,name:u.role==='guard'?'L’ESCORTE':'LE CONVOYEUR',label:u.role==='guard'?'ESCORTE':'CONVOI',title:u.role==='guard'?'Garde du convoi':'Convoyeur vers '+Atlas.byId[c.to].name,civilianJob:'carry',greet:()=>c.escortOnly?['Nos convoyeurs sont tombés. Nous retournons au poste de '+Atlas.byId[c.from].name+'.'+(c.abandoned?' La cargaison reste sur place.':'')]:['Nous transportons '+(WORLD_BIBLE.resources.find(r=>r.id===c.resource)?.label||c.resource)+' vers '+Atlas.byId[c.to].name+'.'],topics:()=>[],bye:()=>['Bonne route.']};
    if(n.convoyGuard){this.ensureHumanGuard(n);n.guardRestored=true;n.guardState.hp=u.hp;n.guardState.hostileUntil=u.hostileUntil||0;}
    else this.ensureCivilian(n,{hp:u.hp,appearance:u.appearance});this.npcs.push(n);this.atlasNpcs.push(n);
   }count++;
  }
  for(const c of active)if(dist(this.convoyPosition(c),this.player)>1500&&!this.npcs.some(n=>n.convoyId===c.id))s.controlCargo(c.id,false);
 };
 Game.prototype.stepWorldConvoys=function(dt){
  const s=simulation(this);if(!s||this.journey||this.sleeping||this.dialogue||this.dying||this.dead)return;
  for(const c of s.state.shipments.filter(live)){
   const actors=this.convoyActors(c);if(!actors.length)continue;this.saveConvoyActors(c);
   const danger=this.convoyInDanger(c);if(danger)c.encounter=true;else delete c.encounter;
   if(!actors.some(n=>!n.convoyGuard&&living(n)))s.stepCargo(c,0,this.clock);
   const position=this.convoyPosition(c),crew=actors.filter(n=>!n.convoyGuard&&living(n)),driver=(c.escortOnly?actors.filter(n=>living(n)):crew.filter(n=>n.civilian.hp>1)).find(n=>!n.dangerState),leg=c.path[c.leg];
   if(danger||!driver||c.status==='abandoned'||crew.some(n=>this.dialogue?.who===n)){s.stepCargo(c,0,this.clock);continue;}
   if(!leg){s.stepCargo(c,0,this.clock);continue;}
   const edge=this.worldState.edgeStatus(Atlas.edgeById.get(leg.edge),this.clock);if(edge.closed||edge.events.some(e=>Atlas.EVENT_TYPES[e.type].civilianPrey&&!c.passages?.[e.id]&&!s.systems.toll(c,e))){c.waiting=leg.edge;s.stepCargo(c,0,this.clock);continue;}c.waiting=null;
   // A driver who fled must physically return to the wagon before it can move.
   if(dist(driver,position)>12){this.walkNpc(driver,position,dt);s.stepCargo(c,0,this.clock);continue;}
   const a=Atlas.toGame(...Atlas.vertices.get(leg.from)),b=Atlas.toGame(...Atlas.vertices.get(leg.to)),dx=b.x-a.x,dy=b.y-a.y,length=Math.hypot(dx,dy),metres=c.progress*s.cargoRate(c,leg),look=Math.min(leg.length,metres+2),goal={x:a.x+dx*look/leg.length,y:a.y+dy*look/leg.length},old={x:driver.x,y:driver.y};
   this.walkNpc(driver,goal,dt);const projected=clamp(((driver.x-a.x)*dx+(driver.y-a.y)*dy)/Math.max(1,length*length)*leg.length,0,leg.length),delta=Math.max(0,projected-metres);
   if(dist(driver,b)<2){driver.x=b.x;driver.y=b.y;}
   const advance=dist(driver,b)<2?Math.max(0,leg.length-metres):delta;s.stepCargo(c,advance/s.cargoRate(c,leg),this.clock);c.localPosition={x:driver.x,y:driver.y};
   for(const [i,n]of actors.entries())if(n!==driver&&living(n)&&!n.dangerState){const p={x:driver.x+(n.convoyGuard?(i%2?24:-24):0),y:driver.y+(n.convoyGuard?24:28)};n.post={...p};if(!n.convoyGuard||!this.humanGuardTarget(n,this.ensureHumanGuard(n)))this.walkNpc(n,p,dt);}
   driver.post={x:driver.x,y:driver.y};if(dist(old,driver)<.001)driver.anim=0;this.saveConvoyActors(c);
  }
 };
 const target=Game.prototype.humanGuardTarget;
 Game.prototype.humanGuardTarget=function(n,state){const t=target.call(this,n,state);if(t||!n.convoyGuard)return t;return this.enemies.filter(e=>!e.dead&&e.world&&!e.retiring&&!e.friendly&&this.sameLevel(n,e)&&dist(n,e)<280&&dist(e,n.post)<380&&this.lineClear(n,e)).sort((a,b)=>dist(a,n)-dist(b,n))[0]||null;};
 for(const name of ['damageCivilian','damageHumanGuard']){const native=Game.prototype[name];Game.prototype[name]=function(n,...args){const c=n.convoyId&&simulation(this)?.state.shipments.find(c=>c.id===n.convoyId),result=native.call(this,n,...args);if(c&&result){simulation(this).damageCargoUnit(c,n.id,n.convoyGuard?n.guardState.hp:n.civilian.hp,n.guardState?.hostileUntil||0);this.emit('save');}return result;};}
 const recruit=Game.prototype.recruitCompanion;
 Game.prototype.recruitCompanion=function(n,...args){return !n?.convoyId&&recruit.call(this,n,...args);};
 const update=Game.prototype.update;
 Game.prototype.update=function(dt,input){this.syncWorldConvoys();update.call(this,dt,input);this.stepWorldConvoys(clamp(Number(dt)||0,0,.04));};
 const advance=Game.prototype.advanceAtlas;
 Game.prototype.advanceAtlas=function(dt=0){if(this.clock-(this.atlasLastClock??this.clock)>2)for(const c of simulation(this)?.state.shipments||[])if(this.npcs.some(n=>n.convoyId===c.id))this.unloadConvoy(c);return advance.call(this,dt);};
 const save=Game.prototype.serialize;
 Game.prototype.serialize=function(){for(const c of simulation(this)?.state.shipments||[])if(this.npcs.some(n=>n.convoyId===c.id)){if(this.convoyInDanger(c)){c.encounter=true;const position=this.convoyPosition(c);simulation(this).beginCargoEncounter(c,this.enemies.filter(e=>e.world&&!e.dead&&!e.friendly&&this.sameLevel(e,{level:0})&&dist(e,position)<260&&this.lineClear(e,position)));}this.saveConvoyActors(c);}return save.call(this);};
 const restore=Game.prototype.finishAtlasRestore;
 Game.prototype.finishAtlasRestore=function(saved){restore.call(this,saved);this.syncWorldConvoys();};
 const props=Renderer.prototype.visibleAtlasProps;
 Renderer.prototype.visibleAtlasProps=function(){const result=props.call(this),s=simulation(this.g);for(const c of s?.state.shipments.filter(c=>c.abandoned&&!c.recovered||live(c))||[]){const p=c.abandonedPosition?Atlas.toGame(c.abandonedPosition.x,c.abandonedPosition.y):this.g.convoyPosition(c);if(dist(p,this.g.player)<1200&&(!c.delivered||s.cargoUnits(c).some(u=>u.role==='crew'&&u.hp>0)))result.push({...p,y:p.y-10,kind:c.path[c.leg]?.mode==='boat'?'transport_boat_side':'transport_cart',world:true,convoyId:c.id});}return result;};
})();
