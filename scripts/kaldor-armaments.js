/* Carried equipment and first-discovery loot. Race chooses a craft tradition,
 * never hostility: only an existing combatant receives a combat loadout. */
const KaldorArmaments=(()=>{
 'use strict';
 const W=HearthreaverWeapons,A=HearthreaverKaldorCivilianArt;
 const dead=n=>!!(n?.dead||n?.guardState?.dead||n?.batracien?.dead||n?.civilian?.dead);
 function equip(n){const id=W.carriedBy(n);if(id)n.armament=id;return id;}
 function restoreDrops(g,rows){
  const seen=new Set();g.weaponDrops=[];
  for(const row of (Array.isArray(rows)?rows:[]).slice(0,W.all.length)){
   if(!row||!W.has(row.weapon)||g.arsenal.owned.includes(row.weapon)||seen.has(row.weapon)||!Number.isFinite(row.x)||!Number.isFinite(row.y))continue;
   const point=Atlas.toWorld(row.x,row.y);if(point.x<0||point.y<0||point.x>=Atlas.raw.width||point.y>=Atlas.raw.height)continue;
   seen.add(row.weapon);g.weaponDrops.push({weapon:row.weapon,x:row.x,y:row.y,level:row.level===1?1:0,source:typeof row.source==='string'?row.source.slice(0,160):'',delay:0});
  }
 }
 const restore=Game.prototype.finishAtlasRestore;
 Game.prototype.finishAtlasRestore=function(saved){restore.call(this,saved);restoreDrops(this,saved?.arsenal?.drops);for(const n of [...this.npcs,...this.enemies])equip(n);};
 const serialize=Game.prototype.serialize;
 Game.prototype.serialize=function(){const s=serialize.call(this);if(s.arsenal)s.arsenal.drops=(this.weaponDrops||[]).filter(d=>!this.arsenal.owned.includes(d.weapon)).map(({weapon,x,y,level,source})=>({weapon,x,y,level,source}));return s;};
 function owned(g,id){return !!g.arsenal?.owned.includes(id);}
 function details(g,id){const w=W.get(id);return {weapon:id,damage:w.damage*g.power(),title:w.label,text:W.families[w.family]+' · '+w.hands+' main'+(w.hands===2?'s':'')+' · '+w.culture+' · '+w.territory+' · '+w.rarity,stats:'Dégâts '+(w.damage*g.power()).toFixed(2)+' · Cadence '+Math.round(W.cadence(id)*100)+' % · '+w.weightKg+' kg',description:w.description};}
 function acquire(g,id,origin){
  if(!W.has(id)||!g.arsenal||owned(g,id))return false;
  const at=origin||g.weaponDrops?.find(d=>d.weapon===id)||g.atlasProps.find(o=>o.kind==='kaldor_weapon'&&o.weapon===id)||g.player;
  const anchor={x:at.x,y:at.y,level:at.level===1?1:0};
  g.arsenal.owned.push(id);g.weaponDrops=(g.weaponDrops||[]).filter(d=>d.weapon!==id);
  for(const o of g.atlasProps)if(o.kind==='kaldor_weapon'&&o.weapon===id)o.taken=true;
  g.emit('weaponfound',{...details(g,id),anchor});g.emit('loot');g.emit('save');return true;
 }
 Game.prototype.dropCarriedWeapon=function(n){
  const id=equip(n);if(!id||!dead(n)||n.armamentDropped||!this.arsenal)return false;
  n.armamentDropped=true;
  if(owned(this,id))return false;
  // The victory animation freezes simulation. Give the priest's actual crosse
  // before the existing win save, so it cannot be left unreachable in the arena.
  if(n.kind==='boss')return acquire(this,id,n);
  this.weaponDrops??=[];if(this.weaponDrops.some(d=>d.weapon===id))return false;
  this.weaponDrops.push({weapon:id,x:n.x,y:n.y,level:n.level===1?1:0,source:String(n.id||''),delay:.18});this.emit('save');return true;
 };
 function opponent(g,n){return g.enemies.includes(n)||g.isHostileHumanGuard?.(n)||g.isHostileBatracien?.(n);}
 // All lethal paths (hero, guard, projectile) converge here. Wrappers can nest;
 // armamentDropped makes a corpse idempotent, even when the NPC is removed.
 for(const name of ['damageEnemy','guardStrike','damageBatracienGuard','damageHumanGuard']){
  const previous=Game.prototype[name];if(typeof previous!=='function')continue;
  Game.prototype[name]=function(n,...args){
   const victim=name==='guardStrike'?args[0]:n,wasDead=dead(victim),eligible=victim&&opponent(this,victim);if(victim)equip(victim);
   const result=previous.call(this,n,...args);
   if(eligible&&!wasDead&&dead(victim))this.dropCarriedWeapon(victim);return result;
  };
 }
 Game.prototype.stepWeaponDrops=function(dt){
  if(!this.arsenal||this.dead||this.dying||this.dialogue||this.journey||this.sleeping||this.transit||this.won)return;
  const p=this.player;
  this.weaponDrops=(this.weaponDrops||[]).filter(d=>!owned(this,d.weapon));
  for(const d of [...this.weaponDrops]){
   d.delay=Math.max(0,(d.delay||0)-dt);if(d.delay>0||!this.sameLevel(d,p)||!this.lineClear(p,d))continue;
   if(Math.hypot(d.x-p.x,d.y-p.y)<14)acquire(this,d.weapon,d);
  }
 };
 const update=Game.prototype.update;
 Game.prototype.update=function(dt,input){const result=update.call(this,dt,input);this.stepWeaponDrops(clamp(Number(dt)||0,0,.04));return result;};
 // Human fighters use authored native garments, intact translated arm layers,
 // and distinct head modules. Their existing AI wind-up/contact times stay intact.
 const draw=CharacterAtlas.prototype.draw;
 CharacterAtlas.prototype.draw=function(c,kind,n,time){
  const id=equip(n),human=!n.batracien&&(!W.speciesOf(n)||W.speciesOf(n)==='human')&&(n.eventGuard||n.convoyGuard||n.kind==='bandit');
  if(!id||!human)return draw.call(this,c,kind,n,time);
  let state='idle',frame=0;
  if(n.hurt>0){state='hurt';frame=Math.min(3,Math.floor((1-n.hurt/(n.hurtDuration||.24))*4));}
  else if(n.wind>0){state='attack';frame=n.wind>(n.windup||.36)*.45?0:1;}
  else if(n.attack>0){state='attack';frame=attackFrame(n.attack);}
  else if(n.guardTime>0){state='guard';frame=2;}
  else if(n.anim>0){state='walk';frame=Math.floor(n.anim)%8;}
  const im=A.npcFrame(n,state,frame,id,swordPose);if(!im)return draw.call(this,c,kind,n,time);
  n._img=im;c.drawImage(im,Math.round(n.x*SUBPX)/SUBPX-40,Math.round(n.y*SUBPX)/SUBPX-52);return im;
 };
 function batracienOptions(n){
  const id=equip(n);if(!id||!n.batracien?.role)return {};
  if(dead(n))return {weaponId:id,equipment:false};
  return {weaponId:id,weaponPainter:(layer,p)=>{
   const cv=document.createElement('canvas');cv.width=cv.height=80;const c=cv.getContext('2d'),dx=p.tip[0]-p.hand[0],dy=p.tip[1]-p.hand[1],len=Math.max(1,Math.hypot(dx,dy));
   KaldorArsenal.drawWeapon(c,id,...p.hand,dx/len,dy/len);
   const data=c.getImageData(0,0,80,80).data;
   for(let i=0;i<data.length;i+=4)if(data[i+3])layer.data.set(data.subarray(i,i+4),i);
  }};
 }
 const debris=Renderer.prototype.groundDebris;
 Renderer.prototype.groundDebris=function(air){
  debris.call(this,air);if(air)return;
  const g=this.g,c=this.c;
  for(const d of g.weaponDrops||[]){
   if(owned(g,d.weapon)||!g.sameLevel(d,g.player)||this.cam&&(d.x<this.cam.x-40||d.y<this.cam.y-40||d.x>this.cam.x+this.W+40||d.y>this.cam.y+this.H+40))continue;
   const y=d.y-(d.level?12:0);this.shadow(d.x,y,8);KaldorArsenal.drawWeapon(c,d.weapon,Math.round(d.x)-5,Math.round(y)-2,.88,-.475);
   if(Math.floor(g.time*3)%3===0){c.fillStyle='#ffe5a0';c.fillRect(Math.round(d.x)+8,Math.round(y)-8,1,3);c.fillRect(Math.round(d.x)+7,Math.round(y)-7,3,1);}
  }
 };
 // Non-modal discovery card: no freeze, forced equip or duplicate notification.
 let timer=0,queue=[],active=null,view=null;
 function clearDiscovery(){if(timer)clearTimeout(timer);timer=0;queue=[];active=null;document.getElementById('weaponDiscovery')?.remove();}
 function showDiscovery(ev){
  if(!document.body||!W.has(ev.weapon))return;
  queue.push(ev);if(timer)return;nextDiscovery();
 }
 function nextDiscovery(){
  const ev=queue.shift();if(!ev){timer=0;return;}
  document.getElementById('weaponDiscovery')?.remove();
  const card=document.createElement('aside');card.id='weaponDiscovery';card.setAttribute('role','status');card.setAttribute('aria-live','polite');
  card.style.cssText='position:fixed;z-index:76;transform:translate(-50%,-100%);box-sizing:border-box;display:flex;align-items:center;gap:7px;width:max-content;max-width:min(230px,calc(100vw - 16px));padding:5px 8px;background:#211b17ed;box-shadow:0 2px 8px #0006;border:1px solid #b89453;color:#efe3bd;font:12px/1.2 system-ui;white-space:nowrap;pointer-events:none;visibility:hidden;';
  const icon=document.createElement('canvas');icon.width=icon.height=40;icon.style.cssText='width:20px;height:20px;flex:none;image-rendering:pixelated';icon.setAttribute('aria-hidden','true');card.append(icon);
  KaldorArsenal.drawWeapon(icon.getContext('2d'),ev.weapon,13,34,.35,-.937);
  const lines=document.createElement('div');lines.style.cssText='display:flex;flex-direction:column;gap:2px;min-width:0';card.append(lines);
  const name=document.createElement('strong');name.textContent=ev.title;name.style.cssText='overflow:hidden;text-overflow:ellipsis;min-width:0;font-weight:600';name.title=ev.title;lines.append(name);
  const w=W.get(ev.weapon),info=document.createElement('span'),damage=Number.isFinite(ev.damage)?ev.damage:w.damage;
  info.textContent=w.hands+' main'+(w.hands===2?'s':'')+' · Dégâts '+damage.toFixed(2).replace('.',',');info.style.cssText='color:#cabd9e';lines.append(info);
  const close=document.createElement('button');close.type='button';close.textContent='×';close.setAttribute('aria-label','Fermer les informations de l’arme');close.style.cssText='flex:none;align-self:flex-start;width:18px;height:20px;padding:0;color:#cabd9e;background:transparent;border:0;font-size:17px;line-height:20px;pointer-events:auto';close.onclick=()=>{clearTimeout(timer);card.remove();active=null;timer=0;nextDiscovery();};card.append(close);document.body.append(card);
  active={card,anchor:ev.anchor};if(view)positionDiscovery(view);
  timer=setTimeout(()=>{card.remove();active=null;timer=0;nextDiscovery();},3200);
 }
 // Project the drop's world position through the same camera and canvas scale
 // as the weapon. Keep the label anchored there while the camera moves.
 function positionDiscovery(renderer){
  if(!active)return;
  const {card,anchor}=active,cv=renderer.c.canvas;
  if(!anchor||!cv.getBoundingClientRect)return;
  const rect=cv.getBoundingClientRect(),sx=rect.width/renderer.W,sy=rect.height/renderer.H;
  const at=renderer.isometricTerrainGame&&typeof WorldProjection!=='undefined'?WorldProjection.point(anchor.x,anchor.y):anchor;
  const px=rect.left+(at.x-renderer.cam.x)*sx,py=rect.top+(renderer.top+at.y-renderer.cam.y-(anchor.level?12:0))*sy;
  const visible=renderer.g.sameLevel(anchor,renderer.g.player)&&px>=rect.left&&px<=rect.right&&py>=rect.top&&py<=rect.bottom;
  card.style.visibility=visible?'visible':'hidden';if(!visible)return;
  const half=card.offsetWidth/2;
  card.style.left=Math.max(rect.left+half+4,Math.min(rect.right-half-4,px))+'px';
  card.style.top=Math.max(rect.top+card.offsetHeight+4,py-18*sy-6)+'px';
 }
 const renderFrame=Renderer.prototype.frame;
 Renderer.prototype.frame=function(){const result=renderFrame.call(this);view=this;positionDiscovery(this);return result;};
 return {equip,restoreDrops,details,acquire,batracienOptions,showDiscovery,clearDiscovery};
})();
globalThis.KaldorArmaments=KaldorArmaments;
