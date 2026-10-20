/* Discoverable arms, persistent collection and inventory. Loaded after wardrobe.
 * Racks are authored; carried loot is handled by kaldor-armaments.js.
 * Loadouts never change a person's hostility or the world's population. */
const KaldorArsenal=(()=>{
 'use strict';
 const W=HearthreaverWeapons,Art=HearthreaverKaldorCivilianArt;
 const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
 function normalize(saved){
  const ids=Array.isArray(saved?.owned)?saved.owned:[];
  const owned=[...new Set([W.START,...ids.filter(id=>typeof id==='string'&&W.has(id))])];
  return {owned,equipped:owned.includes(saved?.equipped)?saved.equipped:W.START};
 }
 function stands(g){
  g.atlasProps=g.atlasProps.filter(o=>o.kind!=='kaldor_weapon');
  for(const w of W.all){
   const n=Atlas.byId[w.site];if(!n||!w.place)continue;
   const p=Atlas.toGame(n.x,n.y);
   g.atlasProps.push({kind:'kaldor_weapon',weapon:w.id,site:w.site,x:p.x+w.place.dx,y:p.y+w.place.dy,world:true,taken:g.arsenal.owned.includes(w.id)});
  }
 }
 const restore=Game.prototype.finishAtlasRestore;
 Game.prototype.finishAtlasRestore=function(saved){
  restore.call(this,saved);this.arsenal=normalize(saved?.arsenal);
  this.player.weapon=this.arsenal.equipped;Art.wield(this.player.weapon);stands(this);
 };
 const serialize=Game.prototype.serialize;
 Game.prototype.serialize=function(){const s=serialize.call(this);if(this.arsenal)s.arsenal={owned:[...this.arsenal.owned],equipped:this.arsenal.equipped};return s;};
 Game.prototype.weaponDamage=function(base=1){return base*W.get(this.player.weapon).damage;};
 Game.prototype.equipWeapon=function(id){
  const p=this.player;
  if(!this.arsenal?.owned.includes(id)||this.arsenal.equipped===id||this.dead||this.dying||this.won||
   p.attack>0||p.attackCD>0||p.dash>0||p.hurt>0||p.held||p.thrown||this.journey)return false;
  this.arsenal.equipped=id;p.weapon=id;p.comboWindow=0;p.combo=0;p.attackBuffer=0;p.dressing=null;
  // Take it from the back. This visual draw never delays a combat input.
  p.kaldorWeapon={mode:'drawing',lastAttack:this.time,lastTime:this.time,phaseAt:this.time,wasAttacking:false};
  Art.wield(id);this.emit('save');return true;
 };
 const context=Game.prototype.context;
 Game.prototype.context=function(){
  const c=context.call(this);if(c&&c.kind!=='sleep')return c;
  const p=this.player;if(!this.arsenal||p.level)return c;
  let best=null,d=18;
  for(const o of this.atlasProps)if(o.kind==='kaldor_weapon'&&!o.taken){const n=Math.hypot(p.x-o.x,p.y-o.y);if(n<d&&this.lineClear(p,o)){d=n;best=o;}}
  return best?{kind:'weapon',id:best.weapon,text:'E  PRENDRE : '+W.get(best.weapon).label.toUpperCase()}:c;
 };
 Game.prototype.takeWeapon=function(id){
  if(!W.has(id)||!this.arsenal||this.arsenal.owned.includes(id)||this.dead||this.dying||this.won)return false;
  const o=this.atlasProps.find(o=>o.kind==='kaldor_weapon'&&o.weapon===id&&!o.taken),p=this.player;
  if(!o||p.level||Math.hypot(o.x-p.x,o.y-p.y)>=18||!this.lineClear(p,o))return false;
  if(globalThis.KaldorArmaments){const taken=KaldorArmaments.acquire(this,id,o);if(taken){o.taken=true;this.burst(o.x,o.y-12,'#edcf80',12);}return taken;}
  this.arsenal.owned.push(id);o.taken=true;this.burst(o.x,o.y-12,'#edcf80',12);
  this.emit('loot');this.emit('save');this.emit('notice',{title:'Arme trouvée',text:W.get(id).label+' · Inventaire (I), Armes pour l’équiper.'});return true;
 };
 const interact=Game.prototype.interact;
 Game.prototype.interact=function(){const c=this.context();if(c?.kind==='weapon'){this.takeWeapon(c.id);return;}return interact.call(this);};
 // All equipped arms share the native-layer choreography and collision sweep.
 // Calls without a weapon id retain the legacy NPC timing and geometry.
 const legacyHits=bladeHits,legacyFrame=attackFrame,legacyLength=attackLength;
 bladeHits=function(p,e,f){return !p.weapon?legacyHits(p,e,f):W.hits(p,e,f);};
 attackFrame=function(remaining,combo=-1,weapon){return !weapon||combo<0?legacyFrame(remaining,combo):W.frame(remaining,weapon,combo);};
 attackLength=function(combo,weapon){return !weapon?legacyLength(combo):W.duration(weapon,combo);};
 // Select a reachable opponent before an aligned but distant one. Re-evaluate
 // every fresh/queued stroke; explicit steering retains its directional cone.
 // Weapon poses use screen pixels; saves, navigation and line tests stay logical.
 const screenDelta=(x,y)=>typeof WorldProjection==='undefined'?{x,y}:WorldProjection.point(x,y);
 const screenActor=n=>({...n,...screenDelta(n.x,n.y)});
 const oldTarget=Game.prototype.target;
 Game.prototype.target=function(){const n=oldTarget.call(this);if(n){const d=screenDelta(n.x-this.player.x,n.y-this.player.y);if((n.alpha??1)<.5||Math.hypot(d.x,d.y)>112||!this.lineClear(this.player,n)){this.targetId=null;return null;}}return n;};
 Game.prototype.aimAttack=function(dx,dy,automatic=false){
  const p=this.player,input=screenDelta(dx,dy),length=Math.hypot(input.x,input.y);if(length<.1)return;
  const combo=p.comboWindow>0?(p.combo+1)%4:0;let best=null,score=-Infinity;
  for(const n of this.combatTargets()){
   if(n.dead||!this.sameLevel(n,p)||(n.alpha??1)<.5||(n.kind==='boss'&&!this.bossActive)||!this.lineClear(p,n))continue;
   const x=n.x-p.x,y=n.y-p.y,screen=screenDelta(x,y),range=Math.hypot(screen.x,screen.y);if(range<1||range>112)continue;
   const dot=(screen.x*input.x+screen.y*input.y)/(range*length),near=range<=W.get(p.weapon).length+18;
   if(dot<.65&&!(automatic&&near))continue;
   const dir=this.direction(x,y),[fx,fy]=this.facing(dir),step=W.attackStep(p.weapon,combo);
   const actor={...p,dir,combo,x:p.x+fx*step,y:p.y+fy*step,attack:NaN,impactTick:true};
   const projected=screenActor(actor),target=screenActor(n);
   projected.attackAim=W.aimForTarget(p.weapon,dir,target.x-projected.x,target.y-projected.y,combo);
   const reachable=W.hits(projected,target,2),rank=(reachable?1000:near?500:0)-range*2+dot*.5+(n.id===this.targetId?.1:0);
   if(rank>score){score=rank;best=n;}
  }
  this.targetId=best?.id??null;
  if(best)p.dir=this.direction(best.x-p.x,best.y-p.y);
 };
 const swing=Game.prototype.swingSword;
 Game.prototype.swingSword=function(){const serial=this.swing,result=swing.call(this);if(this.swing!==serial){const p=this.player,n=this.target(),d=n?screenDelta(n.x-p.x,n.y-p.y):null;p.attackAim=n?{...W.aimForTarget(p.weapon,p.dir,d.x,d.y,p.combo),targetId:n.id}:null;}return result;};
 const face=Game.prototype.faceTarget;
 Game.prototype.faceTarget=function(){
  const p=this.player;if(p.attack<=0)return face.call(this);
  // Keep the native view fixed; only the weapon and original hand layers get
  // a bounded adjustment. Once contact is displayed, the arc stays frozen.
  const n=this.target();if(!p.impactDone&&W.sample(p.attack,p.weapon,p.combo)<2&&n&&n.id===p.attackAim?.targetId){
   const [fx,fy]=[[0,-1],[1,0],[0,1],[-1,0]][p.dir],d=screenDelta(n.x-p.x,n.y-p.y);
   if(d.x*fx+d.y*fy>0)p.attackAim={...W.aimForTarget(p.weapon,p.dir,d.x,d.y,p.combo),targetId:n.id};
  }
  return n;
 };
 // A single pending press survives the current stroke, including a heavy
 // wind-up. Further presses cannot stack attacks or change that queued aim.
 function queueAttack(p,x=0,y=0){
  if(p.attackBuffer>0)return;
  p.attackBuffer=Math.max(.26,p.attack+.12,p.attackCD+.08);p.bufferX=x;p.bufferY=y;
 }
 // One pixel at most, once per confirmed impact, shared by every target type.
 function contactShake(g){
  const p=g.player;if(!p.impactTick||p.attack<=0||g.weaponShake?.swing===g.swing)return;
  const weight=W.get(p.weapon).weightKg,heavy=p.combo===3;
  const duration=Math.min(.09,.065+weight*.003+(heavy?.01:0));
  g.weaponShake={swing:g.swing,remaining:duration,duration,amplitude:Math.min(1,.7+weight*.04+(heavy?.1:0))};
 }
 function cameraShake(shake,reduced=false){
  if(reduced||!shake||shake.remaining<=0)return 0;
  const t=1-Math.min(1,shake.remaining/shake.duration);
  return Math.round(Math.cos(t*Math.PI*3)*shake.amplitude*(1-t*.35));
 }
 for(const method of ['damageEnemy','damageHumanGuard','damageBatracienGuard','hitProp']){
  const damage=Game.prototype[method];
  const health=n=>n.guardState?.hp??n.batracien?.hp??n.civilian?.hp??n.hp;
  Game.prototype[method]=function(n,...args){
   const before=health(n),result=damage.call(this,n,...args);
   const applied=Number.isFinite(before)?health(n)<before:result===true;
   if(applied&&(method==='damageEnemy'||args[1]===this.player))contactShake(this);
   return result;
  };
 }
 // Freeze simulation at contact, including the victim and impact particles.
 // Input remains live: a press during this short pause is queued for the link.
 const updateCombat=Game.prototype.update;
 Game.prototype.update=function(dt,input={}){
  dt=clamp(Number(dt)||0,0,.04);const p=this.player;p.impactTick=false;
  // Decay in real update time, including hit stop, so the camera settles quickly.
  if(this.weaponShake)this.weaponShake.remaining=Math.max(0,this.weaponShake.remaining-dt);
  if(p.hitPause>0&&!this.dialogue&&!this.sleeping&&!this.dying&&!this.dead&&!this.won&&!this.journey){
   if(input.attackPressed||(input.attack&&!p.attackHeld))queueAttack(p,input.x||0,input.y||0);
   p.attackHeld=!!input.attack;
   const stop=Math.min(dt,p.hitPause);p.hitPause=Math.max(0,p.hitPause-stop);dt-=stop;
   // Do not leave the previous tick's damage event live during the freeze.
   p.impactTick=false;
   if(dt<1e-7)return;
  }
  return updateCombat.call(this,dt,input);
 };
 const civilianDamage=Game.prototype.damageCivilian;
 Game.prototype.damageCivilian=function(n,amount,source){
  const applied=civilianDamage.call(this,n,amount,source);
  if(applied&&source===this.player){this.player.hitPause=Math.max(this.player.hitPause||0,W.hitPause(this.player.weapon,this.player.combo));contactShake(this);}
  return applied;
 };
 // The rack stays empty after pickup, with the weapon's actual silhouette.
 const prop=Renderer.prototype.prop;
 function drawWeapon(c,id,hx,hy,ux,uy){
  const pixels=new Map(),key=(x,y)=>Math.round(x)+','+Math.round(y);
  const b={set(x,y,color,z=0){const k=key(x,y),v=pixels.get(k);if(!v||v.z<=z)pixels.set(k,{x:Math.round(x),y:Math.round(y),color,z});},
   line(x,y,X,Y,color,z=0){const n=Math.max(1,Math.ceil(Math.hypot(X-x,Y-y)*2));for(let i=0;i<=n;i++)this.set(x+(X-x)*i/n,y+(Y-y)*i/n,color,z);}};
  W.paint(b,id,hx,hy,ux,uy);
  const outline=new Map();for(const v of pixels.values())for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){const k=key(v.x+dx,v.y+dy);if(!pixels.has(k))outline.set(k,[v.x+dx,v.y+dy]);}
  c.fillStyle='#100c14';for(const [x,y]of outline.values())c.fillRect(x,y,1,1);
  for(const v of pixels.values()){c.fillStyle=v.color;c.fillRect(v.x,v.y,1,1);}
 }
 Renderer.prototype.prop=function(o){
  if(o.kind!=='kaldor_weapon')return prop.call(this,o);
  const c=this.c,x=Math.round(o.x),y=Math.round(o.y);
  c.fillStyle='#39291f';c.fillRect(x-9,y-1,19,2);c.fillRect(x-7,y-19,3,19);c.fillRect(x+5,y-19,3,19);c.fillRect(x-7,y-14,15,3);
  c.fillStyle='#98704a';c.fillRect(x-6,y-18,1,17);c.fillRect(x+6,y-18,1,17);c.fillRect(x-6,y-14,13,1);
  if(o.taken)return;
  drawWeapon(c,o.weapon,x-4,y-5,.35,-.937);
  const t=(this.g.time*.65+W.all.indexOf(W.get(o.weapon))*.37)%3;
  if(t<.4){c.fillStyle='#fff3c4';c.fillRect(x+10,y-18,1,5);c.fillRect(x+8,y-16,5,1);}
 };
 const pct=n=>Math.round(n*100)+' %';
 function stats(g,w){return 'Dégâts '+(w.damage*g.power()).toFixed(2)+' · cadence '+pct(W.cadence(w.id))+' · '+w.weightKg.toFixed(2)+' kg · allonge '+(w.length<11?'courte':w.length<17?'moyenne':'longue');}
 function inventoryHTML(g){
  if(!g.arsenal)return '';
  const w=W.get(g.arsenal.equipped),owned=W.all.filter(w=>g.arsenal.owned.includes(w.id));
  return '<div class="m-sec">Armes</div><section class="arsenal"><div class="arms-counter">Armes · '+owned.length+'/'+W.all.length+'</div>'+
   '<div class="arms-current"><canvas data-arms-preview width="80" height="80" aria-label="Kaldor avec son arme"></canvas><div class="grow"><b>'+escape(w.label)+'</b><small>'+escape(W.families[w.family])+' · '+w.hands+' main'+(w.hands===2?'s':'')+' · '+escape(w.rarity)+' · '+escape(w.territory)+'</small><small>'+stats(g,w)+'</small><p>'+escape(w.description)+'</p><small>4e coup : '+escape(W.finisher(w.id).name)+(W.finisher(w.id).magic?' · effets magiques':'')+'</small>'+
   '<div class="arms-controls"><button class="q-track" data-arms-turn="-1" aria-label="Tourner à gauche">◀</button><button class="q-track" data-arms-turn="1" aria-label="Tourner à droite">▶</button><select data-arms-motion aria-label="Animation de l’arme"><option value="attack">Combos</option><option value="finisher">4e coup</option><option value="walk">Marche</option><option value="holster">Rangement</option></select></div></div></div>'+
   '<p class="arms-note" role="status">Choisis une arme trouvée pour l’équiper. Le quatrième coup est plus puissant. La cadence est relative à l’épée de départ ; une arme lourde frappe moins souvent.</p>'+
   '<div class="arms-grid">'+owned.map(v=>'<button class="arms-piece'+(v.id===w.id?' on':'')+'" data-equip-weapon="'+v.id+'" aria-pressed="'+(v.id===w.id)+'"><canvas data-weapon-icon="'+v.id+'" width="40" height="40" aria-hidden="true"></canvas><span>'+escape(v.label)+'<small>'+escape(W.families[v.family])+' · '+stats(g,v)+'</small></span></button>').join('')+'</div>'+
   '<details class="arms-find"><summary>'+ (W.all.length-owned.length)+' armes à découvrir</summary>'+W.all.filter(v=>!g.arsenal.owned.includes(v.id)).map(v=>'<p><b>'+escape(v.label)+'</b> · '+escape(Atlas.byId[v.site]?.name||v.discovery||'Arme portée par un combattant')+'<small>'+escape(v.culture)+' · '+escape(v.territory)+' · '+escape(v.rarity)+'</small></p>').join('')+'</details></section>';
 }
 let previewDirection=2,previewMotion='attack';
 function bindInventory(body,g,refresh){
  const cv=body.querySelector('[data-arms-preview]');if(!cv)return;
  style();
  for(const el of body.querySelectorAll('[data-weapon-icon]'))drawWeapon(el.getContext('2d'),el.dataset.weaponIcon,14,33,.35,-.937);
  for(const b of body.querySelectorAll('[data-equip-weapon]'))b.addEventListener('click',()=>{
   if(g.equipWeapon(b.dataset.equipWeapon)){refresh();}
   else if(g.arsenal.equipped!==b.dataset.equipWeapon){const note=body.querySelector('.arms-note');note.textContent='Attends la fin du geste ou du voyage pour changer d’arme.';}
  });
  const select=body.querySelector('[data-arms-motion]');select.value=previewMotion;select.addEventListener('change',()=>{previewMotion=select.value;});
  for(const b of body.querySelectorAll('[data-arms-turn]'))b.addEventListener('click',()=>{previewDirection=(previewDirection+Number(b.dataset.armsTurn)+4)%4;});
  const start=performance.now();
  const tick=now=>{
   if(!cv.isConnected)return;
   const t=(now-start)/1000,id=g.arsenal.equipped;Art.wield(id);
   const look=W.preview(id,t,previewMotion,Art.frameAt('idle',t)),state=look.state,f=look.frame,combo=look.combo;
   const im=Art.nativeFrame(previewDirection,state,f,combo,swordPose),c=cv.getContext('2d');c.clearRect(0,0,80,80);c.imageSmoothingEnabled=false;if(im)c.drawImage(im,0,0);
   requestAnimationFrame(tick);
  };requestAnimationFrame(tick);
 }
 function style(){
  if(!document.head||document.getElementById('arsenalStyle'))return;
  const s=document.createElement('style');s.id='arsenalStyle';s.textContent=
   '#menuBody.player-overview>[data-kind=weapons]{grid-column:1/-1;grid-row:4;min-width:0}.arsenal{color:#efe3bd;min-width:0;width:100%}.arms-current .grow{min-width:0;flex:1}.arsenal small{display:block;color:#b7a98a;font-size:12px;line-height:1.45}.arms-current{display:flex;align-items:center;gap:10px}.arms-current>canvas{width:200px;height:200px;flex:none;image-rendering:pixelated;background:#211b17}.arms-current p{font-size:13px;line-height:1.45}.arms-controls{display:flex;gap:8px;flex-wrap:wrap}.arms-controls button,.arms-controls select{min-height:40px}.arms-controls select{background:#211b17;color:#efe3bd;border:1px solid #85633f;font:inherit;max-width:140px}.arms-note{font-size:12px;color:#b7a98a;line-height:1.5}.arms-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:8px;margin:10px 0}.arms-piece{display:flex;align-items:center;text-align:left;gap:8px;background:#211b17;color:#efe3bd;border:2px solid #59432e;font:inherit;font-size:12px;padding:6px;min-height:64px;cursor:pointer}.arms-piece canvas{width:64px;height:64px;flex:none;image-rendering:pixelated}.arms-piece.on,.arms-piece:focus-visible{border-color:#e5bf67}.arms-find summary{cursor:pointer;min-height:40px;padding-top:8px}.arms-find p{padding:6px;border-bottom:1px solid #4b392b;font-size:13px}@media(max-height:480px),(max-width:560px){.arms-current>canvas{width:136px;height:136px}.arms-grid{grid-template-columns:repeat(auto-fit,minmax(200px,1fr))}}@media(max-width:400px){.arms-current{flex-direction:column;align-items:flex-start}}';document.head.append(s);
 }
 const row=KaldorWardrobe.inventoryHTML,bind=KaldorWardrobe.bindInventory;
 KaldorWardrobe.inventoryHTML=function(g){return row.call(this,g)+inventoryHTML(g);};
 KaldorWardrobe.bindInventory=function(body,g,refresh){bind.call(this,body,g,refresh);bindInventory(body,g,refresh);};
 return {normalize,stands,inventoryHTML,bindInventory,drawWeapon,cameraShake,queueAttack};
})();
