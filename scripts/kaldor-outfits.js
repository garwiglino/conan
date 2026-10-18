/* Hearthreaver — Kaldor's wardrobe. Unique outfits wait on mannequins in the
 * world; taking one puts it in the inventory, where it can be worn. Kaldor
 * then raises his arms, pulls the garment over his head and settles it
 * (bridge 'dress' clip, also played in the menu fitting room).
 * Warmth (0 to 3) is stored per outfit for the cold rules to come: it does
 * not change any gameplay yet. Saved as save.wardrobe {owned, worn}.
 */
const KaldorWardrobe=(()=>{
 'use strict';
 const START='pagne-noue',REACH=18;
 const Art=()=>HearthreaverKaldorCivilianArt;
 const all=()=>Object.values(KALDOR_OUTFITS.outfits);
 const get=id=>KALDOR_OUTFITS.outfits[id]||null;
 const WARMTH=['Aucune','Légère','Bonne','Grand froid'];
 function normalize(saved){
  const owned=new Set([START]);
  for(const id of Array.isArray(saved?.owned)?saved.owned:[])if(get(id))owned.add(id);
  return {owned:[...owned],worn:owned.has(saved?.worn)?saved.worn:START};
 }
 // Mannequin spot: a fixed offset from a locality, checked clear by the tests.
 function spot(o){
  const n=o.place&&Atlas.byId[o.place.site];if(!n)return null;
  const p=Atlas.toGame(n.x,n.y);return {x:p.x+o.place.dx,y:p.y+o.place.dy};
 }
 // Once taken, the mannequin stays where it was, bare.
 function stands(g){
  g.atlasProps=g.atlasProps.filter(o=>o.kind!=='kaldor_outfit');
  for(const o of all()){
   const p=spot(o);if(!p)continue;
   g.atlasProps.push({kind:'kaldor_outfit',outfit:o.id,taken:g.wardrobe.owned.includes(o.id),x:p.x,y:p.y,world:true,site:o.place.site});
  }
 }
 function nearest(g){
  const p=g.player;if(p.level)return null;let best=null,d=REACH;
  for(const o of g.atlasProps)if(o.kind==='kaldor_outfit'&&!o.taken){const k=Math.hypot(o.x-p.x,o.y-p.y);if(k<d){d=k;best=o;}}
  return best;
 }

 const restore=Game.prototype.finishAtlasRestore;
 Game.prototype.finishAtlasRestore=function(saved){
  restore.call(this,saved);
  this.wardrobe=normalize(saved?.wardrobe);stands(this);
  Art().wear(this.wardrobe.worn);this.player.dressing=null;
 };
 const serialize=Game.prototype.serialize;
 Game.prototype.serialize=function(){
  const saved=serialize.call(this);if(this.wardrobe)saved.wardrobe={owned:[...this.wardrobe.owned],worn:this.wardrobe.worn};
  return saved;
 };
 const context=Game.prototype.context;
 Game.prototype.context=function(){
  const c=context.call(this);if(c&&c.kind!=='sleep')return c;
  const o=this.wardrobe&&nearest(this);
  return o?{kind:'outfit',id:o.outfit,text:'E  PRENDRE : '+get(o.outfit).label.toUpperCase()}:c;
 };
 const interact=Game.prototype.interact;
 Game.prototype.interact=function(){
  const c=this.context();
  if(c?.kind==='outfit'&&!this.dead&&!this.won){this.takeOutfit(c.id);return;}
  return interact.call(this);
 };
 Game.prototype.takeOutfit=function(id){
  const o=get(id);if(!o||!this.wardrobe||this.wardrobe.owned.includes(id))return false;
  const stand=this.atlasProps.find(v=>v.kind==='kaldor_outfit'&&v.outfit===id&&!v.taken);
  this.wardrobe.owned.push(id);stands(this);
  if(stand)this.burst(stand.x,stand.y-14,'#edcf80',14);
  this.emit('loot');this.emit('save');
  this.emit('notice',{title:'Tenue trouvée',text:o.label+' · chaleur '+WARMTH[o.warmth].toLowerCase()+' · Inventaire (I)'});
  return true;
 };
 Game.prototype.wearOutfit=function(id){
  if(!this.wardrobe?.owned.includes(id)||this.wardrobe.worn===id||!Art().wear(id))return false;
  this.wardrobe.worn=id;this.player.dressing={t0:this.time};this.emit('save');
  return true;
 };
 // Read by the cold rules to come: 0 none, 3 dressed for the great cold.
 Game.prototype.outfitWarmth=function(){return get(this.wardrobe?.worn)?.warmth??0;};

 // ---- Mannequin: a wooden stand dressed with the outfit, a slow glint. ----
 // The garment's shoulders (row 44 of its 80px cell) rest on the crossbar,
 // its boots stand on the base.
 const WOOD=['#3b2a20','#6e4c34','#9a6c45'];
 const prop=Renderer.prototype.prop;
 Renderer.prototype.prop=function(o){
  if(o.kind!=='kaldor_outfit')return prop.call(this,o);
  const c=this.c,x=Math.round(o.x),y=Math.round(o.y),cloth=o.taken?null:Art().garment(o.outfit),boots=o.taken?null:Art().garment(o.outfit,1);
  c.save();c.globalAlpha=.28;c.fillStyle='#000';c.fillRect(x-7,y-1,15,2);c.fillRect(x-5,y-2,11,4);c.restore();
  c.fillStyle=WOOD[0];c.fillRect(x-6,y-1,13,2);c.fillRect(x-1,y-20,3,19);c.fillRect(x-4,y-19,9,3);
  c.fillStyle=WOOD[1];c.fillRect(x-5,y-1,11,1);c.fillRect(x,y-19,1,18);c.fillRect(x-3,y-18,7,1);
  c.fillStyle=WOOD[0];c.fillRect(x-2,y-24,5,4);c.fillStyle=WOOD[2];c.fillRect(x-1,y-24,3,3);
  if(!cloth)return;
  c.drawImage(cloth,x-40,y-63);if(boots)c.drawImage(boots,x-40,y-52);
  const t=(this.g.time*.6+(o.x+o.y)*.013)%3;
  if(t<.5){const k=t<.17?1:t<.34?2:1;c.fillStyle='#fff3c4';c.fillRect(x+3,y-16-k,1,1+2*k);c.fillRect(x+3-k,y-16,1+2*k,1);}
 };

 // ---- Inventory: fitting room and outfit list (menu tab "inventory"). ----
 const pips=w=>'<span class="ward-heat" aria-label="Chaleur '+w+' sur 3">'+[0,1,2].map(i=>'<i'+(i<w?' class="on"':'')+'></i>').join('')+'</span>';
 function inventoryHTML(g){
  if(!g.wardrobe)return '';
  const own=all().filter(o=>g.wardrobe.owned.includes(o.id)),hidden=all().length-own.length;
  return '<div class="m-sec">Garde-robe</div><div class="ward-room"><canvas class="ward-stage" width="30" height="28" aria-label="Kaldor"></canvas><div class="grow">'+
   (get(g.wardrobe.worn)?.label||'')+' '+pips(get(g.wardrobe.worn)?.warmth||0)+'<small>Chaleur : '+WARMTH[g.outfitWarmth()].toLowerCase()+'. Les tenues se trouvent sur des mannequins, au fil des relais.</small></div></div>'+
   own.map(o=>'<div class="inv-row ward-row"><canvas class="ward-face" width="20" height="12" data-outfit="'+o.id+'" aria-hidden="true"></canvas><div class="grow">'+esc(o.label)+' '+pips(o.warmth)+'<small>'+esc(o.description)+'</small></div><button class="inv-act" data-wear="'+o.id+'"'+(o.id===g.wardrobe.worn?' disabled':'')+'>'+(o.id===g.wardrobe.worn?'Portée':'Porter')+'</button></div>').join('')+
   (hidden?'<p class="m-empty">'+(hidden>1?hidden+' tenues uniques restent à trouver dans le monde.':'Une tenue unique reste à trouver dans le monde.')+'</p>':'');
 }
 const crop=(c,img)=>{c.imageSmoothingEnabled=false;c.clearRect(0,0,30,28);if(img)c.drawImage(img,25,28,30,28,0,0,30,28);};
 // Inventory icon: the garment alone, folded out of its 80px cell.
 const icon=(c,img)=>{c.imageSmoothingEnabled=false;c.clearRect(0,0,20,12);if(img)c.drawImage(img,30,41,20,12,0,0,20,12);};
 let stage=null;
 function bindInventory(body,g,refresh){
  style();
  for(const cv of body.querySelectorAll('.ward-face'))icon(cv.getContext('2d'),Art().garment(cv.dataset.outfit));
  for(const b of body.querySelectorAll('[data-wear]'))b.addEventListener('click',()=>{if(g.wearOutfit(b.dataset.wear)){stage={start:performance.now()};refresh();}});
  const cv=body.querySelector('.ward-stage');if(!cv)return;
  const c=cv.getContext('2d');
  const tick=now=>{
   if(!cv.isConnected)return;
   const t=stage?(now-stage.start)/1000:Infinity,dress=t<Art().dressDuration();
   if(!dress)stage=null;
   crop(c,dress?Art().nativeFrame(2,'dress',Art().frameAt('dress',t)):Art().nativeFrame(2,'sheathed_idle',Art().frameAt('idle',now/1000)));
   requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
 }
 function style(){
  if(typeof document==='undefined'||!document.head||document.getElementById('wardrobeStyle'))return;
  const s=document.createElement('style');s.id='wardrobeStyle';
  s.textContent='.ward-room{display:flex;align-items:center;gap:12px;padding:10px 0;color:#efe3bd;font-size:13px}.ward-room small{display:block;font-size:12px;line-height:1.35;color:#b7a98a;margin-top:3px}'+
   '.ward-stage,.ward-face{image-rendering:pixelated;flex:none;box-sizing:content-box;border:2px solid transparent;border-image:var(--ui-well) var(--ui-well-s) fill / 4px / 2px stretch}'+
   '.ward-stage{width:90px;height:84px;padding:4px}.ward-face{width:60px;height:36px;padding:5px 2px}'+
   '.ward-heat{display:inline-flex;gap:3px;margin-left:6px;vertical-align:middle}.ward-heat i{width:7px;height:7px;background:#2b3f37;box-shadow:0 0 0 1px #0e0b09}.ward-heat i.on{background:#e58b3a;box-shadow:0 0 0 1px #0e0b09,inset 0 -2px #b0522a}';
  document.head.append(s);
 }
 return {START,WARMTH,normalize,spot,inventoryHTML,bindInventory,style,get,all};
})();
