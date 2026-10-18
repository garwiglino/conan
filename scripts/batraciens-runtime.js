// Révision combat/bouclier/raccord PR #4 : Codex / ChatGPT, 2026-10-18. Voir docs/CODEX-BATRACIENS-HANDOFF.md.
/* Batraciens: palette-only art reuse and bounded, save-stable world integration.
 * This adapter owns only its actors. WorldDanger remains the safety authority.
 * All world displacements/hit tests use feet in game pixels; drawing uses (40,52).
 * No economy rewards, new incidents, global faction hostility or census rewriting.
 */
const Batraciens = (() => {
 'use strict';
 const Art=globalThis.HearthreaverBatraciens, Armed=globalThis.HearthreaverBatraciensCombattants, C=BATRACIEN_CONFIG;
 if(!Art||!Armed||C.version!==1)throw new Error('Batraciens: sources graphiques ou registre absent.');
 const clampN=(n,a,b)=>Math.max(a,Math.min(b,n)), own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k),
  isCivil=n=>!!n?.batracien&&!n.batracien.role, isArmed=n=>!!n?.batracien?.role,
  member=(g,n)=>g.party?.find(c=>c.id===n.id), finite=Number.isFinite,
  active=g=>!g.journey&&!g.dialogue&&!g.dead&&!g.dying&&!g.sleeping&&!g.transit,
  hash=s=>civilianHash(String(s)), duration=(n,a)=>((isArmed(n)?Armed:Art).CLIPS[a]?.duration||1000)/1000;
 const communityMap=new Map(C.communities.map(r=>[r[0],r]));
 const JOB_LABELS={net:'FILETIER',rope:'CORDIER',rice:'CULTIVATEUR',weave:'VANNIER',pottery:'POTIER',gather:'HERBORISTE',stir:'PRÉPARATEUR',craft:'ARTISAN',ledger:'COMMIS',fish_cast:'PÊCHEUR'};
 const locked=new Set(['hit','startle','sit_down','stand_up','cower_enter','cower_exit']);
 const validPoint=p=>p&&finite(p.x)&&finite(p.y)&&(()=>{const w=Atlas.toWorld(p.x,p.y);return w.x>=0&&w.y>=0&&w.x<Atlas.raw.width&&w.y<Atlas.raw.height;})();
 function habitat(site){const cell=site&&Atlas.cellAt(site.x,site.y);return !!cell?.land&&C.allowedBiomes.includes(cell.biome)&&!Atlas.curseCells.has(cell.id)&&['Varan','Tagon','Teremor'].includes(site.territory);}
 function palette(sex,name){try{return Art.paletteName(sex,name);}catch{return sex==='female'?'rose_mauve':'original';}}
 function appearance(id,sex,record){const list=sex==='female'?C.femalePalettes:C.malePalettes;return {sex,palette:palette(sex,typeof record?.palette==='string'?record.palette:list[hash(id+':pigment')%list.length])};}
 function visual(n,action,restart=false){const b=n.batracien;if(!b)return;const api=isArmed(n)?Armed:Art;if(!own(api.CLIPS,action))throw new Error('Batraciens: animation non disponible: '+action);if(b.action!==action||restart){b.action=action;b.elapsed=0;b.contactDone=false;}}
 function syncCivil(n){const b=n.batracien,c=n.civilian;if(c){c.action=b.action;c.elapsed=b.elapsed;c.distance=b.distance;}}
 function register(g,n){g.npcs.push(n);g.atlasNpcs.push(n);return n;}
 function collectRecords(g,saved){
  if(g.batracienRecords)return;g.batracienRecords=Object.create(null);g.batracienCombatRecords=Object.create(null);g.batracienMissiles=[];
  const source=saved?.batraciens;if(source?.version!==1)return;
  for(const row of (Array.isArray(source.people)?source.people:[]).slice(0,128)){
   if(!row||typeof row.id!=='string'||!/^(resident-batracien-|warden-batracien-)/.test(row.id))continue;
   if(!communityMap.has(row.site))continue;g.batracienRecords[row.id]=row;
  }
  for(const row of (Array.isArray(source.incidents)?source.incidents:[]).slice(0,64)){
   if(!row||typeof row.id!=='string'||!row.id.startsWith('incident-'))continue;g.batracienCombatRecords[row.id]=row;
  }
 }
 function safePosition(g,site,id,job=null){
  const centre=Atlas.toGame(site.x,site.y),seed=hash(id),props=[...g.world.props,...g.atlasProps],mechanisms=[...g.levers,...g.steles,...g.chests];
  const field=['rice','gather','harvest','hoe','sow'].includes(job);
  for(let j=0;j<160;j++){
   const a=((seed%32)+j%32)*Math.PI/16,r=(field?(site.radius||12)*16+48:64)+Math.floor(j/32)*32,p={x:Math.round(centre.x+Math.cos(a)*r),y:Math.round(centre.y+Math.sin(a)*r)};
   if(field&&g.tile(p.x,p.y)!==0)continue;
   if(g.solid(p.x,p.y,8,0)||g.localThreatAt(p.x,p.y,0,C.enemyClearance)||g.dangerAt(p.x,p.y,0).unsafe)continue;
   if(g.npcs.some(n=>!n.civilian?.dead&&dist(n,p)<32)||mechanisms.some(n=>dist(n,p)<35))continue;
   if(props.some(o=>o.rest?Math.abs(p.x-o.x)<45&&Math.abs(p.y-o.y-14)<50:dist(o,p)<30))continue;
   // Keep services and the standing room at their access points free, even before initTravelParty.
   if(g.npcs.some(n=>n.id.startsWith('relay-')&&dist(n,p)<44))continue;
   return p;
  }
  return null; // A deferred resident is preferable to one placed in a wall or near a hostile.
 }
 function workPlan(g,n,requested){
  const b=n.batracien; b.job=requested;b.workDir=2;b.work={...n.post};b.water=null;
  if(requested!=='net')return;
  // Fishing is enabled only when an actual water tile is reachable by the displayed line.
  for(const dir of [2,1,0,3]){const [fx,fy]=g.facing(dir),q={x:n.post.x+fx*24,y:n.post.y+fy*24};
   if(g.tile(q.x,q.y)===3){b.job='fish_cast';b.workDir=dir;b.water=q;return;}
  }
 }
 function initialiseCivil(g,n,record){
  const b=n.batracien,seed=hash(n.id),c=n.civilian={appearance:{species:'batracien',sex:b.sex,palette:b.palette},job:b.job,action:'idle',elapsed:0,distance:0,hp:6,dead:false,inv:0,lastX:n.x,lastY:n.y,restClock:seed%52};
  if(record){if(finite(record.hp))c.hp=clampN(record.hp,0,6);c.dead=record.dead===true||c.hp===0;if(c.dead)c.hp=0;if(finite(record.distance))b.distance=Math.max(0,record.distance)%100000;}
  if(c.dead){visual(n,'death');b.elapsed=Art.CLIPS.death.duration/1000;n.alpha=1;delete n.dangerState;}
  syncCivil(n);return c;
 }
 const originalEnsureCivilian=Game.prototype.ensureCivilian;
 Game.prototype.ensureCivilian=function(n,record){if(!n?.batracien)return originalEnsureCivilian.call(this,n,record);if(isArmed(n))return null;return n.civilian||initialiseCivil(this,n,record);};
 const originalAction=Game.prototype.civilianAction;
 Game.prototype.civilianAction=function(n,a,restart=false){if(!isCivil(n))return originalAction.call(this,n,a,restart);this.ensureCivilian(n);visual(n,a,restart);syncCivil(n);};
 const originalPopulate=Game.prototype.populateCivilians;
 Game.prototype.populateCivilians=function(saved){
  collectRecords(this,saved);originalPopulate.call(this,saved);this.populateBatraciens(saved);
 };
 Game.prototype.populateBatraciens=function(saved){
  collectRecords(this,saved);
  for(const [id,jobs,role] of C.communities){const site=Atlas.byId[id];if(!site||!site.rest||!habitat(site))continue;
   for(let slot=0;slot<jobs.length+(role?1:0);slot++){
    const armed=slot===jobs.length,actorId=(armed?'warden-':'resident-')+'batracien-'+id+'-'+(armed?'0':slot);
    if(this.npcs.some(n=>n.id===actorId))continue;
    const rec=this.batracienRecords[actorId],civilRec=this.civilianRecords?.[actorId],partyRec=saved?.party?.find(p=>p.id===actorId),centre=Atlas.toGame(site.x,site.y);
    const validSaved=validPoint(rec)&&(dist(rec,centre)<2000||this.validBatracienRoutePosition?.(actorId,rec));
    let pos=(validSaved&&(rec.dead||partyRec))?{x:rec.x,y:rec.y}:safePosition(this,site,actorId,armed?null:jobs[slot]);
    if(!pos)continue;
    const road=C.society?.roads.find(r=>r.site===id&&r.slot===slot);const sex=armed?'male':road?.sex||(slot%2===0?'male':'female'),look=appearance(actorId,sex,rec);
    const b={...look,site:id,role:armed?role:null,action:'idle',elapsed:0,distance:0,lastX:pos.x,lastY:pos.y,seed:hash(actorId),contactDone:false};
    const n={id:actorId,...pos,post:{...pos},dir:2,baseDir:2,level:0,alpha:1,world:true,site:id,resident:!armed,batracien:b,look:'batracien',head:24,name:'HABITANT',label:'HABITANT',title:'Habitant de '+site.name,
     greet:()=>armed?['Nous veillons sur les habitants et les accès de '+site.name+'.']:['Bienvenue à '+site.name+'. Les nouvelles voyagent avec les bateliers.'],topics:()=>[],bye:()=>['Bonne route.']};
    if(rec?.post&&validPoint(rec.post)&&dist(rec.post,centre)<240&&!this.solid(rec.post.x,rec.post.y,8,0))n.post={...rec.post};
    if(validSaved&&(rec.dead||partyRec)){Object.assign(n,{x:rec.x,y:rec.y});if([0,1,2,3].includes(rec.dir))n.dir=rec.dir;}
    if(armed){if(this.npcs.filter(n=>n.batracien?.role&&!n.eventId).length>=C.maxWardens)continue;
     b.comboIndex=Number.isInteger(rec?.comboIndex)?clampN(rec.comboIndex,0,2):0;b.hp=finite(rec?.hp)?clampN(rec.hp,0,C.combat[role].hp):C.combat[role].hp;b.dead=rec?.dead===true||b.hp===0;b.inv=0;b.cooldown=1;
     if(b.dead){b.hp=0;visual(n,'death');b.elapsed=Armed.CLIPS.death.duration/1000;}
     n.name=n.label=({village_guard:'GARDE',channel_sentinel:'SENTINELLE',boat_escort:'ESCORTE',scout:'ÉCLAIREUR',captain:'CHEF'})[role]||'GARDE';n.title=Armed.ROLES[role].label+' de '+site.name;
    }else{if(this.npcs.filter(isCivil).length>=C.maxCivilians)continue;
     workPlan(this,n,jobs[slot]);initialiseCivil(this,n,civilRec||rec);n.name=n.label=JOB_LABELS[b.job]||'HABITANT';n.title=(sex==='female'?'Batracienne':'Batracien')+' de '+site.name;
    }
    register(this,n);this.restoreBatracienRoutine?.(n,rec);
   }
  }
 };
 // Existing player, quests, transport and ordinary human appearances are untouched.
 const originalRestore=Game.prototype.finishAtlasRestore;
 Game.prototype.finishAtlasRestore=function(saved){originalRestore.call(this,saved);this.populateBatraciens(saved?.atlas);for(const n of this.npcs.filter(n=>n.batracien)){if(!n.batracien.dead&&!n.civilian?.dead&&!member(this,n)&&(this.solid(n.x,n.y,8,0)||this.stations?.some(s=>dist(n,s.actor)<44))){const pos=safePosition(this,Atlas.byId[n.site],n.id,n.batracien.job);if(pos){Object.assign(n,pos);n.post={...pos};if(isCivil(n))workPlan(this,n,n.batracien.job==='fish_cast'?'net':n.batracien.job);}else{this.npcs=this.npcs.filter(a=>a!==n);this.atlasNpcs=this.atlasNpcs.filter(a=>a!==n);}}}for(const n of this.npcs.filter(isCivil)){const b=n.batracien;if(n.civilian.dead){delete n.dangerState;n.alpha=1;}b.lastX=n.x;b.lastY=n.y;}
  this.adoptBatracienIncidents();this.assessCivilians(true);
 };
 const protectedCivilian=Game.prototype.civilianProtected;
 Game.prototype.civilianProtected=function(n){return isArmed(n)||protectedCivilian.call(this,n);};
 const present=Game.prototype.npcPresent;
 Game.prototype.npcPresent=function(n){if(n?.batracien){if(n.batracien.dead||n.civilian?.dead)return false;if(locked.has(n.batracien.action)||['death','cower','thrust','slash','throw_javelin'].includes(n.batracien.action))return false;}return present.call(this,n);};
 const oldBodies=Game.prototype.bodies;
 Game.prototype.bodies=function(o){let bodies=oldBodies.call(this,o).filter(n=>!n.batracien?.dead);if(o?.batracien){const extra=[this.player,...this.npcs,...this.enemies].filter(n=>n!==o&&alive(n)&&dist(o,n)<80&&!member(this,n)&&n.phase!=='away');bodies=[...new Set([...bodies,...extra])];}return bodies;};
 const oldRecruit=Game.prototype.recruitCompanion;
 Game.prototype.recruitCompanion=function(n,options){return !isArmed(n)&&oldRecruit.call(this,n,options);};
 const oldNpcMenu=Game.prototype.npcMenu;
 Game.prototype.npcMenu=function(n){const menu=oldNpcMenu.call(this,n);return isArmed(n)?menu.filter(m=>!/rejoindre|compagnon|recruter|voyager ensemble/i.test(m.label||'')):menu;};
 const oldWalkNpc=Game.prototype.walkNpc,oldMoveLocked=Game.prototype.npcMoveLocked;
 Game.prototype.npcMoveLocked=function(n){
  if(!n?.batracien)return !!oldMoveLocked?.call(this,n);const b=n.batracien;if(b.dead||n.civilian?.dead)return true;
  if(isCivil(n))return ['seated','cower'].includes(b.action)||locked.has(b.action)&&b.elapsed<duration(n,b.action);
  return (Armed.isAttack(b.action)||['block','hit'].includes(b.action))&&b.elapsed<duration(n,b.action);
 };
 Game.prototype.walkNpc=function(n,to,dt){
  if(!n?.batracien)return oldWalkNpc.call(this,n,to,dt);const b=n.batracien;
  if(b.dead||n.civilian?.dead)return false;
  if(isCivil(n)){
   if(locked.has(b.action)&&b.elapsed<duration(n,b.action))return false;
   if(b.action==='seated'){this.civilianAction(n,'stand_up');return false;}
   if(b.action==='cower'){this.civilianAction(n,'cower_exit');return false;}
  }else if((Armed.isAttack(b.action)||['block','hit'].includes(b.action))&&b.elapsed<duration(n,b.action))return false;
  const from={x:n.x,y:n.y};civilianWalk.call(this,n,to,Math.max(0,dt)*(n.dangerState?.mode==='leaving'?2.1:n.dangerState?.mode==='fleeing'?(typeof CIVILIAN_FLIGHT==='undefined'?1.6:CIVILIAN_FLIGHT.speed):1));const dx=n.x-from.x,dy=n.y-from.y;n.x=from.x;n.y=from.y;this.move(n,dx,dy);if(Math.hypot(n.x-from.x,n.y-from.y)<.001&&Math.hypot(dx,dy)>.001)n.path=[];return dist(n,to)<2;
 };
 Game.prototype.stepBatracienCivilian=function(n,dt){
  const b=n.batracien,c=this.ensureCivilian(n);if(!c)return;
  const delta=c.tickTime===this.time?0:Math.max(0,Math.min(.04,dt));c.tickTime=this.time;c.inv=Math.max(0,c.inv-delta);
  const moved=Math.hypot(n.x-b.lastX,n.y-b.lastY);b.lastX=n.x;b.lastY=n.y;c.lastX=n.x;c.lastY=n.y;
  if(moved>.001&&moved<30){b.distance+=moved;c.moveTime=this.time;}
  const m=member(this,n);if(c.dead){visual(n,'death');b.elapsed=Math.min(duration(n,'death'),b.elapsed+delta);syncCivil(n);return;}
  if(m){if(c.lastHP!==undefined&&m.hp<c.lastHP)visual(n,m.down?'death':'hit',true);c.lastHP=m.hp;
   if(m.down){if(b.action!=='death')visual(n,'death');b.elapsed+=delta;syncCivil(n);return;}
   if(b.action==='death')visual(n,'stand_up');
  }
  if(this.dialogue){if(this.dialogue.who===n){visual(n,'talk');b.elapsed+=delta;syncCivil(n);}return;}
  if(!active(this))return;
  if(dist(n,this.player)>C.activeRadius&&!n.dangerState&&!m)return;
  b.elapsed+=delta;
  if(locked.has(b.action)&&b.elapsed<duration(n,b.action)){syncCivil(n);return;}
  if(c.moveTime===this.time){visual(n,['leaving','fleeing'].includes(n.dangerState?.mode)?'flee':'walk');syncCivil(n);return;}
  if(n.dangerState){
   if(n.dangerState.mode==='returning'){if(b.action==='cower')visual(n,'cower_exit');else if(b.action!=='cower_exit'||b.elapsed>=duration(n,'cower_exit'))visual(n,'idle');}
   else if(b.action==='cower_exit'||n.dangerState.mode==='fleeing'&&(n.dangerState.blocked||0)<.5&&!['cower','cower_enter'].includes(b.action))visual(n,'idle');
   else if(!['cower','cower_enter'].includes(b.action))visual(n,'cower_enter');else if(b.action==='cower_enter'&&b.elapsed>=duration(n,'cower_enter'))visual(n,'cower');
   syncCivil(n);return;
  }
  if(m){visual(n,'idle');syncCivil(n);return;}
  if(this.stepBatracienRoutine?.(n,delta)){syncCivil(n);return;}
  if(b.action==='sit_down'){visual(n,'seated');syncCivil(n);return;}
  if(b.action==='stand_up'||b.action==='cower_exit'){visual(n,'idle');syncCivil(n);return;}
  c.restClock=(c.restClock+delta)%64;
  const h=((this.clock/60)%24+24)%24,rest=h<6||h>=22.5||(c.restClock>=44&&c.restClock<53);
  if(rest){if(b.action!=='seated')visual(n,'sit_down');syncCivil(n);return;}
  if(b.action==='seated'){visual(n,'stand_up');syncCivil(n);return;}
  if(dist(n,n.post)>3){this.walkNpc(n,n.post,delta);visual(n,'walk');syncCivil(n);return;}
  if(c.restClock>=53&&c.restClock<58){visual(n,'drink');syncCivil(n);return;}
  if(c.restClock>=58){visual(n,'idle');syncCivil(n);return;}
  n.dir=b.workDir;
  if(b.job==='fish_cast'){
   if(!b.water||this.tile(b.water.x,b.water.y)!==3){b.job='net';b.water=null;visual(n,'net');}
   else if(!['fish_cast','fish_wait','fish_reel'].includes(b.action))visual(n,'fish_cast');
   else if(b.action==='fish_cast'&&b.elapsed>=duration(n,'fish_cast'))visual(n,'fish_wait');
   else if(b.action==='fish_wait'&&b.elapsed>=6)visual(n,'fish_reel');
   else if(b.action==='fish_reel'&&b.elapsed>=duration(n,'fish_reel'))visual(n,'fish_cast');
  }else visual(n,b.job);
  syncCivil(n);
 };
 // Palette selection changes no grids, joints, dimensions, collision or timing.
 Game.prototype.setBatracienPalette=function(id,name){
  const n=this.npcs.find(n=>n.id===id)||this.enemies.find(e=>e.id===id);if(!n?.batracien)return false;
  const b=n.batracien;Art.paletteName(b.sex,name);b.palette=name;if(n.civilian)n.civilian.appearance.palette=name;this.emit('save');return true;
 };
 Game.prototype.adoptBatracienIncidents=function(){
  collectRecords(this);const activeEvents=new Map(this.worldState.active(this.clock).map(e=>[e.id,e]));
  for(const n of [...this.npcs.filter(n=>n.eventGuard),...this.enemies.filter(e=>e.eventId&&!e.dead)]){
   if(n.batracien)continue;const event=activeEvents.get(n.eventId);if(!event)continue;
   const point=Atlas.toWorld(n.x,n.y),cell=Atlas.cellAt(point.x,point.y);
   const site=Atlas.byId[event.target]||Atlas.nearestSite(event.x,event.y);
   const territory=site?.territory||Atlas.raw.regions.find(r=>r.id===(site?.region||cell?.region))?.territory;
   if(!C.allowedBiomes.includes(cell?.biome)||!['Varan','Tagon','Teremor'].includes(territory)||Atlas.curseCells.has(cell?.id))continue;
   if(n.eventGuard){if(event.type!=='patrol'||hash(n.id+':species')%3===0)continue;}
   else if(!C.hostileEvents.includes(event.type)||!['cultist','bandit'].includes(n.kind))continue;
   // Existing bandits remain the incident authority. Equipment is independent of species/pigment.
   const slot=Number(n.id.match(/-(\d+)$/)?.[1]||0),roles=['raider','scout',hash(event.id)%2?'boat_escort':'captain'];
   let role=n.eventGuard?(hash(n.id)%4===0?'captain':hash(n.id)%2?'scout':'channel_sentinel'):roles[slot%roles.length];
   const rec=this.batracienCombatRecords[n.id];if(rec&&roles.includes(rec.role)&&!n.eventGuard)role=rec.role;
   const look=appearance(n.id,'male',rec),b=n.batracien={...look,role,site:site?.id||null,action:'idle',elapsed:0,distance:0,seed:hash(n.id),lastX:n.x,lastY:n.y,cooldown:1,contactDone:false,inv:0};
   if(n.eventGuard){b.comboIndex=Number.isInteger(rec?.comboIndex)?clampN(rec.comboIndex,0,2):0;b.hp=finite(rec?.hp)?clampN(rec.hp,0,C.combat[role].hp):C.combat[role].hp;b.dead=b.hp===0;n.post={x:n.x,y:n.y};n.name=n.label=({village_guard:'GARDE',channel_sentinel:'SENTINELLE',boat_escort:'ESCORTE',scout:'ÉCLAIREUR',captain:'CHEF'})[role]||'GARDE';n.look='batracien';}
   else {n.originalKind=n.kind;n.kind='batracien';n.speed=24;n.reach=C.combat[role].range;n.r=6;n.damage=1;n.wind=n.attack=n.melee=0;n.homeX=n.x;n.homeY=n.y;n.maxHp=C.combat[role].hp;n.hp=clampN(finite(rec?.hp)?rec.hp:(this.incidentHealth?.[n.id]??n.maxHp),.1,n.maxHp);b.comboIndex=Number.isInteger(rec?.comboIndex)?clampN(rec.comboIndex,0,2):0;}
   if(n.eventGuard)this.restoreBatracienRoutine?.(n,rec);
   if(rec&&Armed.isAttack(rec.action)&&finite(rec.elapsed)&&rec.elapsed>=0&&rec.elapsed<Armed.CLIPS[rec.action].duration/1000){b.action=rec.action;b.elapsed=rec.elapsed;b.contactDone=rec.contactDone===true;b.lockedDir=[0,1,2,3].includes(rec.lockedDir)?rec.lockedDir:n.dir;b.comboIndex=Number.isInteger(rec.comboIndex)?clampN(rec.comboIndex,0,2):0;b.chainCount=Number.isInteger(rec.chainCount)?clampN(rec.chainCount,1,3):1;b.attackSerial=Number.isInteger(rec.attackSerial)?clampN(rec.attackSerial,0,1000000):0;b.targetId=typeof rec.targetId==='string'&&rec.targetId.length<128?rec.targetId:null;}
  }
 };
 const previousGroups=Game.prototype.stepEventGroups;
 Game.prototype.stepEventGroups=function(dt=0){previousGroups.call(this,dt);this.adoptBatracienIncidents();};
 // Reuse the existing body footprint and XP class. Species is not a hostility flag.
 BODY.batracien=BODY.cultist;XP_KILL.batracien=XP_KILL.cultist;
 function combatSpec(n){return C.combat[n.batracien.role];}
 function front(g,n,t,min=.15){const [fx,fy]=g.facing(n.dir);return ((t.x-n.x)*fx+(t.y-n.y)*fy)/Math.max(1,dist(n,t))>min;}
 function alive(n){return n&&!n.dead&&!n.batracien?.dead&&!n.civilian?.dead&&!n.guardState?.dead&&(n.alpha??1)>.5;}
 function strike(g,n,t){if(!alive(t)||!g.sameLevel(n,t)||!g.lineClear(n,t))return;
  if(t===g.player)g.damagePlayer(1,n);else if(isArmed(t)&&g.npcs.includes(t))g.damageBatracienGuard(t,1,n);else if(g.isHumanGuard?.(t))g.damageHumanGuard(t,1,n);else if(t.civilian)g.damageCivilian(t,1,n);else{g.guardStrike(n,t);if(t.dead&&t.batracien)g.batracienCorpse(t);}
 }
 function attackRange(n,action=n.batracien.action){return action==='jab'?24:combatSpec(n).range;}
 function attackContact(n){return Armed.CLIPS[n.batracien.action]?.contact??combatSpec(n).contact;}
 function attackDuration(n){return Armed.CLIPS[n.batracien.action].duration/1000;}
 const TACTICS=Object.freeze({village_guard:{chain:2,chance:45},channel_sentinel:{chain:2,chance:35},boat_escort:{chain:2,chance:65},scout:{chain:1,chance:0},raider:{chain:2,chance:40},captain:{chain:3,chance:70}});
 function fightingTarget(g,n,id){if(id==='player')return !g.dead&&!g.dying&&(g.npcs.includes(n)?g.isHostileBatracien?.(n):!g.safeZone(g.player))?g.player:null;return g.npcs.find(t=>t.id===id&&alive(t))||g.enemies.find(t=>t.id===id&&alive(t));}
 // Feet travel independently of facing. No speculative path through an unseen obstacle.
 function combatMove(g,n,t,dt,shield=false){if(!alive(t)||!g.sameLevel(n,t)||!g.lineClear(n,t)||n.stun>0||n.hurt>0||Armed.isAttack(n.batracien?.action)||n.batracien?.action==='block')return 0;
  const b=n.batracien,d=dist(n,t);if(d<1||d>550)return 0;const ux=(t.x-n.x)/d,uy=(t.y-n.y)/d,spec=combatSpec(n),ideal=b.role==='scout'?70:Math.max(19,spec.range-5),speed=(finite(n.speed)?n.speed:24)*(shield?.42:1);
  b.footwork=(b.footwork||0)+dt;const sign=(hash(n.id+':footwork')%2?1:-1)*(Math.floor(b.footwork/2.4)%2?-1:1),radial=clampN((d-ideal)/14,-.7,1),lateral=d<ideal+28?.55*sign:0;
  const vx=ux*radial-uy*lateral,vy=uy*radial+ux*lateral,length=Math.max(1,Math.hypot(vx,vy)),dx=vx/length*speed*dt,dy=vy/length*speed*dt,old={x:n.x,y:n.y};
  const leash=n.post?(g.isHostileBatracien?.(n)?380:230):null;if(leash&&Math.hypot(n.x+dx-n.post.x,n.y+dy-n.post.y)>leash)return 0;
  g.move(n,dx,dy);n.dir=g.direction(t.x-n.x,t.y-n.y);return dist(n,old);
 }
 function movingGuard(g,n,dt){const b=n.batracien;if(!tickGuard(n,dt))return false;
  const t=fightingTarget(g,n,b.guardTargetId);if(t&&b.action!=='block'){const moved=combatMove(g,n,t,dt,true);b.distance+=moved;visual(n,moved>.001?'guard_walk':'guard');}return true;
 }
 function chainAllowed(g,n,t){const b=n.batracien,p=TACTICS[b.role];return (b.chainCount||1)<p.chain&&alive(t)&&g.sameLevel(n,t)&&g.lineClear(n,t)&&dist(n,t)<=attackRange(n)+4&&front(g,n,t,.25)&&hash(n.id+':chain:'+b.attackSerial+':'+b.chainCount)%100<p.chance;}
 Game.prototype.batracienCombatMove=function(n,t,dt,shield=false){return combatMove(this,n,t,dt,shield);};

 function startAttack(g,n,t){const b=n.batracien,spec=combatSpec(n),list=Armed.ATTACKS[b.role];
  const continuation=b.chainQueued&&b.chainTargetId===(t.id||'player');b.chainCount=continuation?(b.chainCount||1)+1:1;if(!continuation)b.attackSerial=(b.attackSerial||0)+1;b.chainQueued=false;
  const action=b.role==='scout'?(dist(n,t)<28?'jab':'throw_javelin'):list[(b.comboIndex||0)%list.length];
  b.comboIndex=((b.comboIndex||0)+1)%list.length;visual(n,action,true);b.targetId=t.id||'player';b.lockedDir=g.direction(t.x-n.x,t.y-n.y);n.dir=b.lockedDir;b.cooldown=spec.cooldown;n.wind=attackContact(n);n.attack=attackDuration(n);g.foeSound?.(n,'melee','cultist');
 }
 function stepAttack(g,n,t,dt){const b=n.batracien,before=b.elapsed,contact=attackContact(n),total=attackDuration(n);b.elapsed+=dt;n.dir=b.lockedDir??n.dir;
  if(!b.contactDone&&before<contact&&b.elapsed>=contact){b.contactDone=true;
   if(b.action==='throw_javelin'){if(alive(t)&&g.sameLevel(n,t)&&g.lineClear(n,t))g.launchBatracienJavelin(n,t);}
   else if(alive(t)&&dist(n,t)<=attackRange(n)&&front(g,n,t,.25))strike(g,n,t);
   // A player's parry during contact interrupts the pending recovery immediately.
   if(n.stun>0){b.chainQueued=false;n.wind=n.attack=0;visual(n,'hit',true);return false;}
  }
  n.wind=Math.max(0,contact-b.elapsed);n.attack=Math.max(0,total-b.elapsed);if(b.elapsed>=total){n.wind=n.attack=0;if(chainAllowed(g,n,t)){b.chainQueued=true;b.chainTargetId=t.id||'player';b.cooldown=.14;}else{b.chainQueued=false;b.cooldown=Math.max(b.cooldown,.35);}visual(n,'idle');return false;}return true;
 }
 function beginGuard(n,t){const b=n.batracien;if(t)b.guardTargetId=t.id||'player';if(!['guard','guard_walk','block'].includes(b.action)){visual(n,'guard',true);b.guardRaise=.10;b.guardHold=.72;b.blockCount=0;}}
 function tickGuard(n,dt){const b=n.batracien;if(!['guard','guard_walk','block'].includes(b.action))return false;b.guardRaise=Math.max(0,(b.guardRaise||0)-dt);b.guardHold=Math.max(0,(b.guardHold??.72)-dt);b.elapsed+=dt;
  if(b.action==='block'&&b.elapsed<duration(n,'block'))return true;
  if(b.guardHold>0&&(b.blockCount||0)<2){visual(n,'guard');return true;}
  visual(n,'idle');b.cooldown=Math.min(b.cooldown,.12);return false;
 }
 // Shared by hostile bandits and local guards: frontal shield, no racial immunity.
 Game.prototype.tryBatracienBlock=function(n,source){const b=n?.batracien;
  if(!b?.role||!combatSpec(n).shield||!source||source.unblockable||!alive(n)||n.stun>0||!['guard','guard_walk','block'].includes(b.action)||(b.guardRaise||0)>0||b.guardHold===0||(b.blockCount||0)>=2||!this.sameLevel(n,source)||!this.lineClear(n,source)||!front(this,n,source,.25))return false;
  if(source===this.player&&source.combo===3){b.guardHold=0;n.stun=.85;n.wind=n.attack=0;visual(n,'hit',true);this.emit('parry');return false;}
  b.blockCount=(b.blockCount||0)+1;visual(n,'block',true);n.wind=n.attack=0;this.burst(n.x,n.y-14,'#c9d4bc',6);if(source===this.player)this.player.hitPause=.035;this.emit('block');return true;
 };
 const nativeGuardStrike=Game.prototype.guardStrike;
 Game.prototype.guardStrike=function(n,e){if(e?.batracien&&this.tryBatracienBlock(e,n))return;return nativeGuardStrike.call(this,n,e);};
 Game.prototype.stepBatracienEnemy=function(e,dt){
  const b=e.batracien;if(!b||e.dead)return;const before={x:e.x,y:e.y};
  for(const key of ['hurt','flash','stun','cooldown'])e[key]=Math.max(0,(e[key]||0)-dt);b.cooldown=Math.max(0,(b.cooldown||0)-dt);
  if(!this.sameLevel(e,this.player)||dist(e,this.player)>900){e.wind=e.attack=0;visual(e,'idle');return;}
  if(e.stun>0){b.chainQueued=false;e.wind=e.attack=0;visual(e,'hit');b.elapsed=Math.min(.79,b.elapsed+dt);return;}
  if(['guard','guard_walk','block'].includes(b.action)&&movingGuard(this,e,dt))return;
  if(e.retiring){e.wind=e.attack=0;visual(e,'flee');b.elapsed+=dt;this.move(e,(e.x>=this.player.x?1:-1)*20*dt,16*dt);b.distance+=dist(e,before);return;}
  if(Armed.isAttack(b.action)){
   const target=b.targetId==='player'?this.player:this.npcs.find(n=>n.id===b.targetId);
   if(!alive(target)||(target===this.player&&this.safeZone(target))){visual(e,'idle');e.wind=e.attack=0;return;}
   stepAttack(this,e,target,dt);return;
  }
  const guard=this.npcs.find(n=>(isArmed(n)||this.isHumanGuard?.(n))&&alive(n)&&this.sameLevel(n,e)&&dist(n,e)<110&&this.lineClear(n,e));
  const d=dist(e,this.player),br=this.brain(e,this.player,d,dt,this.safeZone(this.player));
  const target=guard||(br.engage?this.player:null);const spec=combatSpec(e);
  if(b.chainQueued&&(!target||b.chainTargetId!==(target.id||'player')||dist(e,target)>spec.range+4||!this.lineClear(e,target))){b.chainQueued=false;b.cooldown=Math.max(b.cooldown,.4);}
  if(target){e.dir=this.direction(target.x-e.x,target.y-e.y);const td=dist(e,target);
   if(td<=spec.range&&b.cooldown<=0&&this.lineClear(e,target)){startAttack(this,e,target);return;}
   if(spec.shield&&td<=spec.range+10&&b.cooldown>.25&&front(this,e,target,.25)&&this.lineClear(e,target)){beginGuard(e,target);return;}
   combatMove(this,e,target,dt);
  }else if(finite(br.tx)&&finite(br.ty)){const dx=br.tx-e.x,dy=br.ty-e.y,dd=Math.hypot(dx,dy);if(dd>5){e.dir=this.direction(dx,dy);this.move(e,dx/dd*e.speed*dt,dy/dd*e.speed*dt);}}
  const moved=dist(e,before);b.distance+=moved;visual(e,moved>.001?'walk':e.ai==='alert'?'alert':'idle');b.elapsed+=dt;
 };
 const nativeEnemyDamage=Game.prototype.damageEnemy;
 Game.prototype.damageEnemy=function(n,amount){if(n?.batracien?.role&&this.npcs.includes(n))return this.damageBatracienGuard(n,amount,this.player);if(n?.batracien&&this.tryBatracienBlock(n,this.player))return;return nativeEnemyDamage.call(this,n,amount);};
 Game.prototype.damageBatracienGuard=function(n,amount,source){
  const b=n?.batracien;if(!b?.role||!alive(n)||!finite(amount)||amount<=0||source&&!this.sameLevel(n,source))return false;
  const playerHit=source===this.player;if(!playerHit&&b.inv>0)return false;
  if(playerHit)this.reportBatracienAssault?.(n,source);
  n.kind='batracien';n.r=6;n.maxHp=combatSpec(n).hp;n.hp=b.hp;n.stun=n.stun||0;
  if(this.tryBatracienBlock(n,source))return true;
  if(playerHit){nativeEnemyDamage.call(this,n,amount);b.hp=n.hp;b.dead=n.dead===true;}
  else{b.hp=Math.max(0,b.hp-amount);b.dead=b.hp===0;n.hp=b.hp;n.dead=b.dead;n.flash=.075;n.hurt=.38;n.stun=Math.max(n.stun,.38);this.spill(n,source||n,false);this.emit('hit');if(b.dead)this.spill(n,source||n,true);}
  b.inv=.9;b.cooldown=1;n.wind=n.attack=0;visual(n,b.dead?'death':'hit',true);n.path=[];
  if(b.dead){this.atlasDeaths[n.id]=true;if(this.dialogue?.who===n)this.dialogue=null;}
  this.emit('save');return true;
 };
 Game.prototype.stepBatracienWardens=function(dt){
  if(!active(this))return;
  for(const n of this.npcs.filter(isArmed)){
   const b=n.batracien;if(dist(n,this.player)>C.activeRadius)continue;const old={x:n.x,y:n.y};b.inv=Math.max(0,(b.inv||0)-dt);b.cooldown=Math.max(0,(b.cooldown||0)-dt);for(const key of ['flash','hurt','stun'])n[key]=Math.max(0,(n[key]||0)-dt);
   if(b.dead){n.wind=n.attack=0;if(b.action!=='death')visual(n,'death',true);b.elapsed=Math.min(duration(n,'death'),b.elapsed+dt);continue;}
   if(n.stun>0){b.chainQueued=false;n.wind=n.attack=0;visual(n,'hit');b.elapsed=Math.min(.79,b.elapsed+dt);continue;}
   if(b.action==='hit'&&b.elapsed<duration(n,'hit')){b.elapsed+=dt;continue;}
   if(['guard','guard_walk','block'].includes(b.action)&&movingGuard(this,n,dt))continue;
   const t=this.batracienWardenTarget?.(n)||this.enemies.filter(e=>alive(e)&&e.world&&!e.retiring&&!e.friendly&&this.sameLevel(n,e)&&dist(n,e)<150&&dist(e,n.post||n)<230&&this.lineClear(n,e)).sort((a,b)=>dist(a,n)-dist(b,n))[0];
   if(Armed.isAttack(b.action)){const target=b.targetId==='player'?(this.isHostileBatracien(n)?this.player:null):this.enemies.find(e=>e.id===b.targetId);if(!alive(target)||target.retiring)visual(n,'idle');else stepAttack(this,n,target,dt);continue;}
   if(b.chainQueued&&(!t||b.chainTargetId!==(t.id||'player')||dist(n,t)>combatSpec(n).range+4||!this.lineClear(n,t))){b.chainQueued=false;b.cooldown=Math.max(b.cooldown,.4);}
   if(t){n.ai='chase';n.dir=this.direction(t.x-n.x,t.y-n.y);const s=combatSpec(n);
    if(dist(n,t)<=s.range&&b.cooldown<=0&&this.lineClear(n,t)){startAttack(this,n,t);continue;}
    if(s.shield&&dist(n,t)<=s.range+10&&b.cooldown>.25){beginGuard(n,t);continue;}
    combatMove(this,n,t,dt);
   }else if(this.isHostileBatracien?.(n)){n.ai='return';if(dist(n,n.post)>3)this.walkNpc(n,n.post,dt);
   }else if(!n.eventId||this.worldState.active(this.clock).some(e=>e.id===n.eventId)){
    const post=n.post||n;const phase=Math.floor((this.time+(b.seed%12))/8)%4,offset=[[0,0],[24,0],[0,0],[-24,0]][phase],to={x:post.x+offset[0],y:post.y+offset[1]};
    if(dist(n,to)>2&&!this.solid(to.x,to.y,6,0))this.walkNpc(n,to,dt);
   }
   const moved=dist(n,old);b.distance+=moved;visual(n,moved>.001?'patrol':'idle');b.elapsed+=dt;
  }
 };
 Game.prototype.launchBatracienJavelin=function(n,t){
  if((this.batracienMissiles||[]).length>=12)return;const b=n.batracien,[fx,fy]=this.facing(b.lockedDir??n.dir);
  (this.batracienMissiles??=[]).push({x:n.x+fx*8,y:n.y+fy*8,vx:fx*112,vy:fy*112,life:1.4,level:n.level||0,owner:n.id,friendly:this.npcs.includes(n)&&!this.isHostileBatracien?.(n),law:!!this.isHostileBatracien?.(n),damage:1,dir:b.lockedDir??n.dir});
 };
 function swept(s,t,dx,dy,r=7){const ll=dx*dx+dy*dy,u=ll?clampN(((t.x-s.x)*dx+(t.y-s.y)*dy)/ll,0,1):0;return Math.hypot(t.x-s.x-dx*u,t.y-s.y-dy*u)<r?u:null;}
 Game.prototype.stepBatracienMissiles=function(dt){
  if(!active(this)){if(this.journey||this.dead||this.dying||this.sleeping)this.batracienMissiles=[];return;}
  for(const s of this.batracienMissiles||[]){const dx=s.vx*dt,dy=s.vy*dt,parts=Math.max(1,Math.ceil(Math.hypot(dx,dy)/3));let wall=1.01;
   for(let j=1;j<=parts;j++)if(this.solid(s.x+dx*j/parts,s.y+dy*j/parts,1,s.level)){wall=j/parts;break;}
   const targets=s.friendly?this.enemies.filter(e=>alive(e)&&e.world&&!e.friendly&&!e.retiring):s.law?[this.player]:[this.player,...this.npcs.filter(n=>alive(n)&&(n.civilian||isArmed(n)||this.isHumanGuard?.(n)))];let first=null;
   for(const t of targets){if(!this.sameLevel(s,t))continue;const u=swept(s,t,dx,dy);if(u!==null&&u<wall&&(!first||u<first.u)&&this.lineClear(s,t))first={t,u};}
   if(first){if(s.friendly){const n=this.npcs.find(n=>n.id===s.owner);if(n&&alive(n)){this.guardStrike(n,first.t);if(first.t.dead&&first.t.batracien)this.batracienCorpse(first.t);}}else if(first.t===this.player)this.damagePlayer(1,s);else if(isArmed(first.t))this.damageBatracienGuard(first.t,1,s);else if(this.isHumanGuard?.(first.t))this.damageHumanGuard(first.t,1,s);else this.damageCivilian(first.t,1,s);s.life=0;}
   else if(wall<=1)s.life=0;else{s.x+=dx;s.y+=dy;s.life-=dt;}
  }
  this.batracienMissiles=(this.batracienMissiles||[]).filter(s=>s.life>0);
 };
 const oldProjectiles=Game.prototype.civilianProjectiles;
 Game.prototype.civilianProjectiles=function(dt){
  const guards=this.npcs.filter(n=>isArmed(n)&&alive(n));for(const s of this.shots){if(s.life<=0)continue;const dx=s.vx*dt,dy=s.vy*dt,targets=guards.filter(n=>this.sameLevel(n,s)).map(n=>({n,u:swept(s,n,dx,dy)})).filter(v=>v.u!==null).sort((a,b)=>a.u-b.u);const hit=targets.find(v=>this.lineClear(s,v.n));if(hit){this.damageBatracienGuard(hit.n,s.damage||1,s);s.life=0;}}
  return oldProjectiles.call(this,dt);
 };
 const oldCivilCombat=Game.prototype.civilianCombat;
 Game.prototype.civilianCombat=function(dt,before){oldCivilCombat.call(this,dt,before);const p=this.player,guards=this.npcs.filter(n=>isArmed(n)&&alive(n)&&dist(n,p)<C.activeRadius);
  if(p.attack>0){const f=attackFrame(p.attack,p.combo);if(f===2||f===3)for(const n of guards){if(this.hits.has(n.id)||!bladeHits(p,n,f)||!this.lineClear(p,n))continue;this.hits.add(n.id);this.damageBatracienGuard(n,p.combo===3?2:1,p);}}
  for(const e of this.enemies){const prev=before.get(e);if(!prev||e.dead||e.friendly||e.batracien)continue;const fired=prev.melee>0&&!prev.meleeHit&&e.meleeHit||prev.wind>0&&e.wind<=0&&e.kind!=='cultist'||e.kind==='guardian'&&e.move&&!prev.hitDone&&e.hitDone;
   if(fired)for(const n of guards)if(this.sameLevel(e,n)&&dist(e,n)<(e.kind==='guardian'?44:(e.reach||20)+8)&&front(this,e,n)&&this.lineClear(e,n))this.damageBatracienGuard(n,e.damage||1,e);
  }
  for(const h of this.hazards){if(h.delay>0||h.life<=0)continue;h.batracienHits??=new Set();for(const n of guards)if(!h.batracienHits.has(n.id)&&this.sameLevel(h,n)&&dist(h,n)<(h.r||18)&&this.lineClear(h,n)){h.batracienHits.add(n.id);this.damageBatracienGuard(n,2,h);}}
 };
 Game.prototype.batracienCorpse=function(e){if(e.batracienCorpseAdded)return;e.batracienCorpseAdded=true;this.remains.push({id:e.id,kind:'batracien',x:e.x,y:e.y,level:e.level||0,dir:e.dir,role:e.batracien.role,palette:e.batracien.palette,t0:this.time});if(this.remains.length>75)this.remains.shift();};
 const oldSpill=Game.prototype.spill;
 Game.prototype.spill=function(e,source,fatal){if(e.batracien&&fatal){oldSpill.call(this,e,source,true);if(!this.npcs.includes(e))this.batracienCorpse(e);return;}return oldSpill.call(this,e,source,fatal);};
 const oldUpdate=Game.prototype.update;
 Game.prototype.update=function(dt,input){dt=clampN(Number(dt)||0,0,.04);const run=active(this);oldUpdate.call(this,dt,input);if(run&&active(this)){this.stepBatracienWardens(dt);this.stepBatracienMissiles(dt);}else if(this.journey||this.dying||this.dead||this.sleeping)this.batracienMissiles=[];};
 const oldRespawn=Game.prototype.respawn;
 Game.prototype.respawn=function(){oldRespawn.call(this);this.batracienMissiles=[];for(const e of this.enemies.filter(e=>e.batracien&&!e.dead)){visual(e,'idle',true);e.batracien.cooldown=1;e.batracien.contactDone=false;}};
 const oldSerialize=Game.prototype.serialize;
 Game.prototype.serialize=function(){const out=oldSerialize.call(this);if(!out.atlas)return out;const records={...this.batracienRecords};
  for(const n of this.npcs.filter(n=>n.batracien&&!n.eventId)){const b=n.batracien;records[n.id]={id:n.id,site:n.site,sex:b.sex,palette:b.palette,role:b.role,job:b.job,x:n.x,y:n.y,dir:n.dir,post:n.post,hp:n.civilian?.hp??b.hp,dead:n.civilian?.dead??b.dead??false,distance:b.distance,routine:this.saveBatracienRoutine?.(n),comboIndex:b.comboIndex||0,hostileUntil:finite(b.hostileUntil)?b.hostileUntil:0};}
  const incident=[...this.npcs.filter(n=>n.eventId&&n.batracien),...this.enemies.filter(e=>e.eventId&&e.batracien&&!e.dead)].map(n=>({id:n.id,role:n.batracien.role,palette:n.batracien.palette,hp:n.batracien.hp??n.hp,action:n.batracien.action,elapsed:n.batracien.elapsed,contactDone:n.batracien.contactDone,lockedDir:n.batracien.lockedDir,targetId:n.batracien.targetId,comboIndex:n.batracien.comboIndex||0,chainCount:n.batracien.chainCount||1,attackSerial:n.batracien.attackSerial||0,hostileUntil:n.batracien.hostileUntil||0}));
  out.atlas.batraciens={version:1,people:Object.values(records).slice(0,128),incidents:incident.slice(-64)};return out;
 };
 function atlasFor(renderer,n){
  const b=n.batracien||n,key=[b.role||b.sex,b.palette].join(':');renderer.batracienAtlases??=new Map();const bank=renderer.batracienAtlases;
  if(bank.has(key)){const a=bank.get(key);bank.delete(key);bank.set(key,a);return a;}
  const a=b.role?new Armed.Atlas({role:b.role,palette:b.palette,maxFrames:32}):new Art.Atlas({sex:b.sex,palette:b.palette,maxFrames:32});bank.set(key,a);
  while(bank.size>12){const oldest=bank.keys().next().value;bank.get(oldest).clear();bank.delete(oldest);}return a;
 }
 const oldNpcDraw=Renderer.prototype.npcDraw;
 Renderer.prototype.npcDraw=function(n){if(!n.batracien)return oldNpcDraw.call(this,n);if(this.g.isHostileBatracien?.(n))return this.enemy(n);const b=n.batracien,c=this.c;if((n.alpha??1)<=0||this.cam&&(n.x<this.cam.x-96||n.x>this.cam.x+this.W+96||n.y<this.cam.y-96||n.y>this.cam.y+this.H+96))return;
  const api=b.role?Armed:Art,frame=api.frameAt(b.action,b.elapsed,b.distance),atlas=atlasFor(this,n),dead=b.dead||n.civilian?.dead;
  c.save();try{c.globalAlpha*=n.alpha??1;c.imageSmoothingEnabled=false;
   if(!b.role&&b.work&&!member(this.g,n)){const activeWork=b.action===b.job||b.job==='fish_cast'&&b.action.startsWith('fish_'),f=activeWork?frame:0,action=activeWork?b.action:b.job;
    for(const layer of ['scene_back']){const im=atlas.get(action,b.workDir,f,{layer,catch:false});c.drawImage(im,Math.round(b.work.x)-40,Math.round(b.work.y)-52);}
   }
   this.shadow(n.x,n.y,dead?12:10);const im=atlas.get(b.action,n.dir??2,frame,{catch:false});c.drawImage(im,Math.round(n.x)-40,Math.round(n.y)-52);n._img=im;
   if(!dead){this.npcNameplate(n);const m=this.g.npcPresent(n)&&this.g.npcMark(n);if(m)this.questMark(n.x,n.y-35,m);}
  }finally{c.restore();}
  this.coldBreath?.(n);
 };
 const oldEnemyBody=Renderer.prototype.enemyBody;
 Renderer.prototype.enemyBody=function(e){if(!e.batracien)return oldEnemyBody.call(this,e);const b=e.batracien,c=this.c;if(this.cam&&(e.x<this.cam.x-96||e.x>this.cam.x+this.W+96||e.y<this.cam.y-96||e.y>this.cam.y+this.H+96))return;this.shadow(e.x,e.y,11);if(this.g.targetId===e.id)this.targetRing(e.x,e.y,12);
  c.save();try{c.imageSmoothingEnabled=false;const atlas=atlasFor(this,e),frame=Armed.frameAt(b.action,b.elapsed,b.distance);const im=atlas.get(b.action,e.dir,frame);c.drawImage(im,Math.round(e.x)-40,Math.round(e.y)-52);e._img=im;
   if(e.flash>0){c.globalAlpha=.35;c.globalCompositeOperation='lighter';c.drawImage(im,Math.round(e.x)-40,Math.round(e.y)-52);}
  }finally{c.restore();}
  if(e.hp<e.maxHp){box(c,e.x-9,e.y-28,18,3,PAL.ink);box(c,e.x-8,e.y-27,Math.ceil(16*e.hp/e.maxHp),1,'#cda46d');}
  if(e.ai==='alert'||e.wind>0)text(c,'!',e.x-2,e.y-33,'#edb279');
 };
 Renderer.prototype.batracienRemains=function(r){if(this.cam&&(r.x<this.cam.x-96||r.x>this.cam.x+this.W+96||r.y<this.cam.y-96||r.y>this.cam.y+this.H+96))return;const a=atlasFor(this,{role:r.role,palette:r.palette}),frame=Armed.frameAt('death',Math.max(0,this.g.time-r.t0));this.c.drawImage(a.get('death',r.dir,frame),Math.round(r.x)-40,Math.round(r.y)-52);};
 Renderer.prototype.drawBatracienMissiles=function(){const c=this.c;for(const s of this.g.batracienMissiles||[]){if(!this.g.sameLevel(s,this.g.player))continue;const [fx,fy]=this.g.facing(s.dir),x=Math.round(s.x),y=Math.round(s.y-16-(s.level?12:0));c.save();try{c.imageSmoothingEnabled=false;for(let i=-4;i<=4;i++)box(c,x+fx*i,y+fy*i,1,1,i===4?'#cfd5d6':'#a16a44');}finally{c.restore();}}};
 return Object.freeze({Art,Armed,config:C,habitat,appearance,safePosition,isCivil,isArmed,atlasFor});
})();
// Public inspection surface for automated integration tests and authored scenarios.
Game.batracienRuntime=Batraciens;
