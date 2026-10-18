/* Shared survival and staffed transport rules. Time is in world minutes. */
const FULL_MEAL_MINUTES=2160,RATION_ENERGY=50;
const travelNumber=(v,fallback,max=100)=>Number.isFinite(v)?clamp(v,0,max):fallback;
Game.prototype.initTravelParty=function(saved){
 this.formerCompanions=saved.formerCompanions&&typeof saved.formerCompanions==='object'?JSON.parse(JSON.stringify(saved.formerCompanions)):{};
 this.needs={satiety:travelNumber(saved.needs?.satiety,100),autoEat:saved.needs?.autoEat!==false,starved:travelNumber(saved.needs?.starved,0,100000),dehydrated:travelNumber(saved.needs?.dehydrated,0,100000)};
 this.mapPlaces=Atlas.nodes.map(n=>({...n,siteId:n.id,category:'places'}));
 this.transportSession=null;this.pendingTransport=null;this.stations=[];
 this.companion.status=saved.companion?.status==='waiting'?'waiting':'following';
 this.party=[{id:'fairy',name:'La fée',permanent:true,spirit:true,status:'following'}];
 if(this.story.recruited)this.party.push(Object.assign(this.companion,{id:'elyne',name:'Elyne',permanent:false,maxHp:10}));
 for(const entry of (Array.isArray(saved.party)?saved.party:[]).slice(0,12)){
  if(['fairy','elyne'].includes(entry?.id))continue;const actor=this.npcs.find(n=>n.id===entry.id);if(!actor)continue;
  const c={id:actor.id,name:actor.title||actor.label,permanent:!!entry.permanent,status:entry.status==='waiting'?'waiting':'following',hp:travelNumber(entry.hp,10,10),maxHp:travelNumber(entry.maxHp,10,10)||10,hunger:travelNumber(entry.hunger,0),down:!!entry.down,coatOwned:!!entry.coatOwned,coatWorn:!!entry.coatWorn,coldDose:travelNumber(entry.coldDose,0,1000)};
  if(Number.isFinite(entry.x)&&Number.isFinite(entry.y))Object.assign(actor,{x:entry.x,y:entry.y});this.party.push(c);
 }
 // Every departure has a local person, visible equipment and a graph endpoint.
 for(const site of Atlas.nodes.filter(n=>n.rest)){
  const p=Atlas.toGame(site.x,site.y),dock=site.kind==='dock';
  // A staffed village entrance on its access road; docks stay on the real coast.
  const edge=(Atlas.adj.get(site.vertex)||[]).find(e=>e.edge.modes.includes('horse')),v=edge&&Atlas.vertices.get(edge.to),length=v?Math.hypot(v[0]-site.x,v[1]-site.y):0;
  if(!dock&&site.id!=='camp'&&length){p.x+=(v[0]-site.x)/length*80;p.y+=(v[1]-site.y)/length*80;}
  const modes=dock?['boat']:['horse',...((Atlas.adj.get(site.vertex)||[]).some(e=>e.edge.modes.includes('cart'))?['cart']:[])];
  let actor=this.npcs.find(n=>n.id==='relay-'+site.id);
  if(!actor){actor={id:'relay-'+site.id,...p,dir:2,look:'nomade',head:40,world:true,site:site.id,topics:()=>[],bye:()=>['Bonne route.']};this.npcs.push(actor);this.atlasNpcs.push(actor);}
  Object.assign(actor,{x:p.x+(site.id==='camp'?-36:dock?-12:0),y:p.y+(site.id==='camp'?-25:dock?4:0),name:dock?'LE BATELIER':'LE PALEFRENIER',label:dock?'BATELIER':'TRANSPORT',title:site.name,greet:()=>[dock?'Le bateau est au quai. Où souhaites-tu aller ?':'Les chevaux sont prêts. Je peux organiser les relais et les traversées de ton voyage.']});
  const station={id:actor.id,site:site.id,actor,modes};this.stations.push(station);this.mapPlaces.push({id:'transport-'+site.id,name:(dock?'Port · ':'Transport · ')+site.name,...Atlas.toWorld(actor.x,actor.y),siteId:site.id,category:'transport',kind:dock?'dock':'stable',radius:3});
  if(dock){const boat=Atlas.toGame(site.boat.x,site.boat.y);this.atlasProps=this.atlasProps.filter(o=>o.site!==site.id);this.atlasProps.push({kind:Math.abs(site.shore.x)>Math.abs(site.shore.y)?'transport_boat_side':'transport_boat_front',...boat,world:true,site:site.id});for(let i=0;i<4;i++)this.atlasProps.push({kind:'transport_quay',x:p.x+site.shore.x*i*12,y:p.y+site.shore.y*i*12,world:true,site:site.id});}
  else {const camp=site.id==='camp',hx=p.x+(camp?-72:-36),hy=p.y+(camp?-52:30);this.atlasProps.push({kind:'transport_horse',x:hx,y:hy,world:true,site:site.id},{kind:'transport_hitch',x:hx-1,y:hy+12,world:true,site:site.id});if(modes.includes('cart'))this.atlasProps.push({kind:'transport_cart',x:p.x+(camp?-24:63),y:p.y+(camp?-52:34),world:true,site:site.id});}
 }
 for(const site of Atlas.nodes.filter(n=>n.rest&&n.kind!=='dock')){const tent=site.id==='camp'?this.world.props.find(o=>o.rest):this.atlasProps.find(o=>o.site===site.id&&o.rest);if(!tent)continue;const inn=site.kind==='town';if(inn)tent.kind='transport_inn';this.mapPlaces.push({id:'rest-'+site.id,name:(inn?'Auberge · ':'Halte · ')+site.name,...Atlas.toWorld(tent.x,tent.y+12),siteId:site.id,category:'rest',kind:inn?'inn':'halt',radius:3});}
 this.navigation=this.mapPlaces.some(n=>n.id===this.navigation)?this.navigation:null;
};
Game.prototype.finishTravelRestore=function(saved){
 // Migrate a legacy save still inside the removed goblin test prison to the camp.
 const w=Atlas.toWorld(this.player.x,this.player.y),p=Atlas.prison;
 if(saved?.atlas?.version!==2&&w.x>=p.x-2&&w.x<=p.x+p.w+2&&w.y>=p.y-2&&w.y<=p.y+p.h+2){this.placeSafely(START.x,START.y);this.checkpoint={level:0,x:this.player.x,y:this.player.y};this.worldCheckpoint={...this.checkpoint};this.escortActor.x=this.player.x+36;this.escortActor.y=this.player.y;}
 Object.assign(this.fairyActor,{x:this.player.x-28,y:this.player.y-22});
 if(!this.story.recruited&&!saved?.atlas?.party){this.escortActor.x=START.x+36;this.escortActor.y=START.y;}
};
Game.prototype.recruitCompanion=function(actor,{permanent=false}={}){
 if(!actor||actor.civilian?.critical||!this.npcs.includes(actor)||this.stations.some(s=>s.actor===actor)||this.party.some(c=>c.id===actor.id)||this.party.length>=12)return false;
 const prior=this.formerCompanions[actor.id],maximum=prior?.maxHp||6,health=Number.isFinite(actor.civilian?.hp)?actor.civilian.hp/6*maximum:maximum;
 const member=actor.id==='elyne'?this.companion:{...prior,hp:Math.min(prior?.hp??health,health),maxHp:maximum,hunger:prior?.hunger??0,down:health<=0};
 const job=this.couriers?.find(c=>c.id===actor.id);if(job&&!job.returnTo)job.returnTo={x:actor.x,y:actor.y};actor.alpha=1;actor.phase='post';Object.assign(member,{id:actor.id,name:actor.title||actor.label,permanent,maxHp:actor.id==='elyne'?10:member.maxHp,status:'following'});this.party.push(member);
 if(actor.id==='elyne')this.story.recruited=true;this.emit('notice',{title:'Compagnon de voyage',text:member.name+' rejoint le groupe.'});this.emit('save');return true;
};
const travelTalk=Game.prototype.talkTo;
Game.prototype.talkTo=function(n){if(n?.id==='elyne')this.recruitCompanion(n);return travelTalk.call(this,n);};
Game.prototype.partyActor=function(id){return this.npcs.find(n=>n.id===id);};
Game.prototype.nearCompanion=function(c){const actor=this.partyActor(c?.id);return !!actor&&(this.journey&&c.status==='following'||dist(actor,this.player)<100);};
Game.prototype.eatRation=function(id='kaldor',quiet=false){
 const c=id==='kaldor'?null:this.party.find(n=>n.id===id),satiety=c?100-c.hunger:this.needs.satiety;
 if(id!=='kaldor'&&(!c||c.spirit||!this.nearCompanion(c))||satiety>75||this.supplies.food<1)return false;
 this.supplies.food--;if(c)c.hunger=Math.max(0,c.hunger-RATION_ENERGY);else{this.needs.satiety=Math.min(100,satiety+RATION_ENERGY);this.needs.starved=0;}
 if(this.journey){const at=this.journey.elapsed||0,meal={name:c?.name||'Kaldor',before:satiety,after:c?100-c.hunger:this.needs.satiety},previous=this.journey.meal;this.journey.meal={...meal,at,items:[...(previous&&Math.abs(at-previous.at)<.1?previous.items||[]:[]),meal]};this.journey.mealPause=.9;}
 if(!quiet){this.emit('notice',{title:'Provisions partagées',text:(c?.name||'Kaldor')+' a mangé une ration.'});this.emit('save');}return true;
};
Game.prototype.feedCompanion=function(id='elyne'){return this.eatRation(id);};
Game.prototype.healCompanion=function(id='elyne'){const c=this.party.find(n=>n.id===id);if(!c||c.spirit||!this.nearCompanion(c)||c.hp>=c.maxHp||this.player.flasks<1)return false;this.player.flasks--;c.hp=c.maxHp;c.down=false;this.emit('save');return true;};
Game.prototype.setCompanionWaiting=function(id,wait){const c=this.party.find(n=>n.id===id);if(!c||c.spirit||!this.nearCompanion(c)||this.journey)return false;c.status=wait?'waiting':'following';this.footprints=[];this.emit('save');return true;};
Game.prototype.dismissCompanion=function(id){const c=this.party.find(n=>n.id===id);if(!c||c.permanent||c.down||!this.nearCompanion(c)||this.journey)return false;const n=this.partyActor(id);this.formerCompanions[id]={hp:c.hp,maxHp:c.maxHp,hunger:c.hunger,down:c.down,coatOwned:c.coatOwned,coatWorn:c.coatWorn,coldDose:c.coldDose};if(n?.civilian)n.civilian.hp=c.hp/c.maxHp*6;this.party=this.party.filter(n=>n!==c);if(id==='elyne')this.story.recruited=false;this.emit('save');return true;};
Game.prototype.advanceNeeds=function(minutes){
 if(!Number.isFinite(minutes)||minutes<=0||this.dead||this.dying||this.player.hp<=0)return;
 // Small deterministic slices preserve the same meal schedule through sleep/travel.
 // Body heat: an outfit too warm for the heat digs hunger, the cold bites health.
 const body=this.bodyHeat?.(),hunger=body?.hunger??1;
 for(let remaining=minutes;remaining>1e-7;){const step=Math.min(remaining,30);remaining-=step;
  const before=this.needs.satiety;this.needs.satiety=Math.max(0,before-step*hunger*100/FULL_MEAL_MINUTES);
  if((this.needs.autoEat||this.journey)&&this.needs.satiety<50)this.eatRation('kaldor',true);
  const hungryMinutes=Math.max(0,step-before*FULL_MEAL_MINUTES/(100*hunger));
  if(this.needs.satiety<=0){this.needs.starved+=hungryMinutes;this.player.hp=Math.min(this.player.hp,Math.max(1,this.player.hp-hungryMinutes/180));}else this.needs.starved=0;
  this.coldBite?.(step,body);this.burnCampfire?.(step);if(this.dying)break;
  for(const c of this.party){if(c.spirit)continue;const reserve=100-c.hunger,heat=this.companionBodyHeat?.(c)?.hunger??1;c.hunger=Math.min(100,c.hunger+step*heat*100/FULL_MEAL_MINUTES);this.companionColdBite?.(c,step);if((this.needs.autoEat||this.journey)&&c.hunger>50)this.eatRation(c.id,true);if(c.hunger>=100){c.hp=Math.max(0,c.hp-Math.max(0,step-reserve*FULL_MEAL_MINUTES/(100*heat))/180);c.down=c.hp<=0;}}
 }
};
Game.prototype.journeyNeeds=function(plan){
 const group=this.party.filter(c=>!c.spirit),energy=plan.minutes*100/FULL_MEAL_MINUTES;
 const meals=(satiety,k=1)=>Math.max(0,Math.ceil((energy*k-satiety+50)/RATION_ENERGY));
 return {food:meals(this.needs.satiety,this.journeyHunger?.(plan)??1)+group.reduce((n,c)=>n+meals(100-c.hunger),0),water:Math.ceil(plan.minutes*(1+group.length)/480)+1};
};
Game.prototype.prepareTransport=function(id){const s=this.stations.find(s=>s.id===id);if(!s||this.journey||this.player.level||dist(s.actor,this.player)>48||!this.lineClear(this.player,s.actor))return false;this.transportSession=s.id;this.pendingTransport=s.id;return true;};
Game.prototype.currentTransport=function(){const s=this.stations.find(s=>s.id===this.transportSession);if(!s||this.player.level||dist(s.actor,this.player)>48||!this.lineClear(this.player,s.actor))return null;const closed=this.worldState.active(this.clock).some(e=>(e.target===s.site||e.target===Atlas.byId[s.site].town)&&Atlas.EVENT_TYPES[e.type].closed);return closed?null:s;};
const travelNpcMenu=Game.prototype.npcMenu;
Game.prototype.npcMenu=function(n){const menu=travelNpcMenu.call(this,n),s=this.stations.find(s=>s.actor===n);if(s)menu.splice(0,0,{label:s.modes[0]==='boat'?'Embarquer / préparer un voyage':'Voyager / acheter des provisions',lines:['Préparons ton itinéraire.'],act:()=>this.prepareTransport(s.id)});return menu;};
const travelStepParty=Game.prototype.stepParty;
Game.prototype.stepParty=function(dt,minutes){travelStepParty.call(this,dt,minutes);for(const c of this.party){if(c.spirit||c.id==='elyne')continue;const n=this.partyActor(c.id);if(!n)continue;if(this.journey){n.x=this.player.x+18;n.y=this.player.y+18;}else if(!c.down&&c.status==='following'&&!this.dialogue&&dist(n,this.player)>32)this.walkNpc(n,this.player,dt);if(!this.journey&&!this.dialogue&&!c.down&&this.time>(c.hitAt||0)&&this.enemies.some(e=>!e.dead&&e.kind!=='boss'&&['chase','alert'].includes(e.ai)&&dist(e,n)<24&&this.lineClear(e,n))){c.hp=Math.max(0,c.hp-1);c.down=c.hp<=0;c.hitAt=this.time+2.5;n.flash=.12;}c.x=n.x;c.y=n.y;}};
const travelStart=Game.prototype.startJourney;
Game.prototype.startJourney=function(plan){if(this.party.some(c=>!c.spirit&&(c.status==='waiting'||c.down||!this.nearCompanion(c)))){this.emit('notice',{title:'Rassemble le groupe',text:'Les compagnons doivent être présents, soignés et prêts à suivre.'});return false;}return travelStart.call(this,plan);};
const travelBodies=Game.prototype.bodies;
Game.prototype.bodies=function(o){return travelBodies.call(this,o).filter(n=>!this.party?.some(c=>c.id===n.id));};
function travelDistance(metres){return metres>=1000?(metres/1000).toFixed(3).replace('.',',')+' km':Math.round(metres)+' m';}
Game.prototype.navigationInfo=function(){const site=this.mapPlaces.find(n=>n.id===this.navigation);if(!site||!this.canTrackPlace(site))return null;const w=Atlas.toWorld(this.player.x,this.player.y),metres=Math.hypot(site.x-w.x,site.y-w.y);return {site,metres,label:travelDistance(metres),target:Atlas.toGame(site.x,site.y),arrived:metres<=site.radius};};
const travelNpcPresent=Game.prototype.npcPresent;
Game.prototype.npcPresent=function(n){return this.party?.some(c=>c.id===n.id)||travelNpcPresent.call(this,n);};
const travelSolid=Game.prototype.solid;
const TRANSPORT_PROP_RADII={transport_horse:16,transport_cart:22,transport_hitch:18,transport_inn:24};
Game.prototype.solid=function(x,y,r=5,level=0){if(this.atlas&&!level)for(const o of this.atlasProps){if(Math.abs(x-o.x)>24+r||Math.abs(y-o.y)>24+r)continue;const radius=TRANSPORT_PROP_RADII[o.kind];if(radius&&Math.abs(x-o.x)<radius+r&&y+r>o.y-(o.kind==='transport_inn'?24:10)&&y-r<o.y+1)return true;}return travelSolid.call(this,x,y,r,level);};

Game.prototype.travelDestinations=function(){return this.stations.filter(s=>Atlas.byId[s.site].kind!=='dock').map(s=>Atlas.byId[s.site]);};
Game.prototype.stationLanding=function(id){const station=this.stations.find(s=>s.site===id);if(!station)return null;const a=station.actor;for(const [dx,dy]of [[0,18],[18,0],[-18,0],[0,-18],[24,24],[-24,24],[24,-24],[-24,-24]]){const p={x:a.x+dx,y:a.y+dy};if(!this.solid(p.x,p.y,5,0)&&this.lineClear(p,a))return p;}return null;};
