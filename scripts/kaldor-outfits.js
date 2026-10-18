/* Hearthreaver — Kaldor's wardrobe. Unique outfits and helmets wait on
 * mannequins and helmet posts in the world; taking one puts it in the
 * inventory. The Tenue screen of the inventory shows Kaldor and switches his
 * outfit and helmet among those he owns: he then pulls the garment over his
 * head (bridge 'dress' clip) or lifts the helmet onto it ('helm' clip).
 * Warmth (0 to 3) is stored per piece; body-heat.js weighs it against the felt
 * temperature. Saved as save.wardrobe {owned, worn, helmets, helmet}.
 */
const KaldorWardrobe=(()=>{
 'use strict';
 const START='pagne-noue',REACH=18;
 const Art=()=>HearthreaverKaldorCivilianArt;
 const all=()=>Object.values(KALDOR_OUTFITS.outfits);
 const get=id=>KALDOR_OUTFITS.outfits[id]||null;
 const allHelmets=()=>Object.values(KALDOR_OUTFITS.helmets||{});
 const getHelmet=id=>id&&KALDOR_OUTFITS.helmets?.[id]||null;
 const WARMTH=['Aucune','Légère','Bonne','Grand froid'];
 const text=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c]);
 function normalize(saved){
  const owned=new Set([START]),helmets=new Set();
  for(const id of Array.isArray(saved?.owned)?saved.owned:[])if(get(id))owned.add(id);
  for(const id of Array.isArray(saved?.helmets)?saved.helmets:[])if(getHelmet(id))helmets.add(id);
  return {owned:[...owned],worn:owned.has(saved?.worn)?saved.worn:START,
   helmets:[...helmets],helmet:helmets.has(saved?.helmet)?saved.helmet:null};
 }
 // Mannequin spot: a fixed offset from a locality, checked clear by the tests.
 function spot(o){
  const n=o.place&&Atlas.byId[o.place.site];if(!n)return null;
  const p=Atlas.toGame(n.x,n.y);return {x:p.x+o.place.dx,y:p.y+o.place.dy};
 }
 // Once taken, the mannequin or helmet post stays where it was, bare.
 function stands(g){
  g.atlasProps=g.atlasProps.filter(o=>o.kind!=='kaldor_outfit'&&o.kind!=='kaldor_helmet');
  for(const o of all()){
   const p=spot(o);if(!p)continue;
   g.atlasProps.push({kind:'kaldor_outfit',outfit:o.id,taken:g.wardrobe.owned.includes(o.id),x:p.x,y:p.y,world:true,site:o.place.site});
  }
  for(const h of allHelmets()){
   const p=spot(h);if(!p)continue;
   g.atlasProps.push({kind:'kaldor_helmet',helmet:h.id,taken:g.wardrobe.helmets.includes(h.id),x:p.x,y:p.y,world:true,site:h.place.site});
  }
 }
 function nearest(g){
  const p=g.player;if(p.level)return null;let best=null,d=REACH;
  for(const o of g.atlasProps)if((o.kind==='kaldor_outfit'||o.kind==='kaldor_helmet')&&!o.taken){const k=Math.hypot(o.x-p.x,o.y-p.y);if(k<d){d=k;best=o;}}
  return best;
 }

 const restore=Game.prototype.finishAtlasRestore;
 Game.prototype.finishAtlasRestore=function(saved){
  restore.call(this,saved);
  this.wardrobe=normalize(saved?.wardrobe);stands(this);
  Art().wear(this.wardrobe.worn);Art().wearHelmet(this.wardrobe.helmet);this.player.dressing=null;
 };
 const serialize=Game.prototype.serialize;
 Game.prototype.serialize=function(){
  const saved=serialize.call(this),w=this.wardrobe;
  if(w)saved.wardrobe={owned:[...w.owned],worn:w.worn,helmets:[...w.helmets],helmet:w.helmet};
  return saved;
 };
 const context=Game.prototype.context;
 Game.prototype.context=function(){
  const c=context.call(this);if(c&&c.kind!=='sleep')return c;
  const o=this.wardrobe&&nearest(this);if(!o)return c;
  return o.kind==='kaldor_helmet'?{kind:'helmet',id:o.helmet,text:'E  PRENDRE : '+getHelmet(o.helmet).label.toUpperCase()}:
   {kind:'outfit',id:o.outfit,text:'E  PRENDRE : '+get(o.outfit).label.toUpperCase()};
 };
 const interact=Game.prototype.interact;
 Game.prototype.interact=function(){
  const c=this.context();
  if(c?.kind==='outfit'&&!this.dead&&!this.won){this.takeOutfit(c.id);return;}
  if(c?.kind==='helmet'&&!this.dead&&!this.won){this.takeHelmet(c.id);return;}
  return interact.call(this);
 };
 function found(g,stand,title,piece){
  if(stand)g.burst(stand.x,stand.y-14,'#edcf80',14);
  g.emit('loot');g.emit('save');
  g.emit('notice',{title,text:piece.label+' · chaleur '+WARMTH[piece.warmth].toLowerCase()+' · Inventaire (I), Tenue'});
 }
 Game.prototype.takeOutfit=function(id){
  const o=get(id);if(!o||!this.wardrobe||this.wardrobe.owned.includes(id))return false;
  const stand=this.atlasProps.find(v=>v.kind==='kaldor_outfit'&&v.outfit===id&&!v.taken);
  this.wardrobe.owned.push(id);stands(this);found(this,stand,'Tenue trouvée',o);
  return true;
 };
 Game.prototype.takeHelmet=function(id){
  const h=getHelmet(id);if(!h||!this.wardrobe||this.wardrobe.helmets.includes(id))return false;
  const stand=this.atlasProps.find(v=>v.kind==='kaldor_helmet'&&v.helmet===id&&!v.taken);
  this.wardrobe.helmets.push(id);stands(this);found(this,stand,'Casque trouvé',h);
  return true;
 };
 Game.prototype.wearOutfit=function(id){
  if(!this.wardrobe?.owned.includes(id)||this.wardrobe.worn===id||!Art().wear(id))return false;
  this.wardrobe.worn=id;this.player.dressing={t0:this.time,clip:'dress'};this.emit('save');
  return true;
 };
 // null takes the helmet off.
 Game.prototype.wearHelmet=function(id){
  const w=this.wardrobe;
  if(!w||(id!==null&&!w.helmets.includes(id))||w.helmet===id||!Art().wearHelmet(id))return false;
  w.helmet=id;this.player.dressing={t0:this.time,clip:'helm'};this.emit('save');
  return true;
 };
 // Read by body-heat.js: outfit and helmet together, 0 none to 3
 // dressed for the great cold.
 Game.prototype.outfitWarmth=function(){
  return Math.min(3,(get(this.wardrobe?.worn)?.warmth??0)+(getHelmet(this.wardrobe?.helmet)?.warmth??0));
 };

 // ---- Mannequin: a wooden stand dressed with the outfit, a slow glint. ----
 // The garment's shoulders (row 44 of its 80px cell) rest on the crossbar,
 // its boots stand on the base. Helmets sit on a bare post.
 const WOOD=['#3b2a20','#6e4c34','#9a6c45'];
 function glint(r,o,x,y){
  const c=r.c,t=(r.g.time*.6+(o.x+o.y)*.013)%3;
  if(t<.5){const k=t<.17?1:t<.34?2:1;c.fillStyle='#fff3c4';c.fillRect(x,y-k,1,1+2*k);c.fillRect(x-k,y,1+2*k,1);}
 }
 function base(c,x,y){
  c.save();c.globalAlpha=.28;c.fillStyle='#000';c.fillRect(x-7,y-1,15,2);c.fillRect(x-5,y-2,11,4);c.restore();
  c.fillStyle=WOOD[0];c.fillRect(x-6,y-1,13,2);c.fillStyle=WOOD[1];c.fillRect(x-5,y-1,11,1);
 }
 // Lowest opaque row of a helmet's rest image, so it sits on its post.
 const rims=new Map();
 function rim(img,id){
  if(rims.has(id))return rims.get(id);
  const d=img.getContext('2d').getImageData(0,0,80,80).data;let bottom=44;
  for(let i=d.length-1;i>=0;i-=4)if(d[i]){bottom=Math.floor((i>>2)/80);break;}
  rims.set(id,bottom);return bottom;
 }
 const prop=Renderer.prototype.prop;
 Renderer.prototype.prop=function(o){
  if(o.kind==='kaldor_helmet'){
   const c=this.c,x=Math.round(o.x),y=Math.round(o.y),helm=o.taken?null:Art().garment(o.helmet);
   base(c,x,y);
   c.fillStyle=WOOD[0];c.fillRect(x-1,y-17,3,16);c.fillRect(x-2,y-21,5,4);
   c.fillStyle=WOOD[1];c.fillRect(x,y-17,1,15);c.fillStyle=WOOD[2];c.fillRect(x-1,y-21,3,3);
   if(!helm)return;
   // The helmet's rim rests on the knob; a closed helm hangs a little lower.
   c.drawImage(helm,x-40,y-20-rim(helm,o.helmet));
   glint(this,o,x+4,y-26);
   return;
  }
  if(o.kind!=='kaldor_outfit')return prop.call(this,o);
  const c=this.c,x=Math.round(o.x),y=Math.round(o.y),cloth=o.taken?null:Art().garment(o.outfit),boots=o.taken?null:Art().garment(o.outfit,1);
  base(c,x,y);
  c.fillStyle=WOOD[0];c.fillRect(x-1,y-20,3,19);c.fillRect(x-4,y-19,9,3);
  c.fillStyle=WOOD[1];c.fillRect(x,y-19,1,18);c.fillRect(x-3,y-18,7,1);
  c.fillStyle=WOOD[0];c.fillRect(x-2,y-24,5,4);c.fillStyle=WOOD[2];c.fillRect(x-1,y-24,3,3);
  if(!cloth)return;
  c.drawImage(cloth,x-40,y-63);if(boots)c.drawImage(boots,x-40,y-52);
  glint(this,o,x+3,y-16);
 };

 // ---- Inventory (menu tab "bag"): the Tenue row opens the Tenue screen. ----
 let view=null,dir=2,stage=null,info=null;
 const DIRS=[2,3,0,1],DIR_NAMES={2:'De face',3:'Profil gauche',0:'De dos',1:'Profil droit'};
 const pips=(w,label='Chaleur')=>'<span class="ward-heat" role="img" aria-label="'+label+' '+w+' sur 3">'+[0,1,2].map(i=>'<i'+(i<w?' class="on"':'')+'></i>').join('')+'</span>';
 const ownedOutfits=g=>all().filter(o=>g.wardrobe.owned.includes(o.id));
 const ownedHelmets=g=>allHelmets().filter(h=>g.wardrobe.helmets.includes(h.id));
 const plural=(n,word)=>n+' '+word+(n>1?'s':'');
 function inventoryHTML(g){
  if(!g.wardrobe)return '';
  return '<div class="m-sec">Tenue</div>'+tenueHTML(g);
 }
 function tile(kind,piece,on){
  const id=piece?piece.id:'',label=piece?piece.label:'Sans casque';
  return '<button class="ward-tile'+(on?' on':'')+'" data-'+kind+'="'+id+'" aria-pressed="'+on+'" aria-label="'+text(label)+(on?', porté':'')+'">'+
   '<canvas width="24" height="24" data-icon="'+id+'" aria-hidden="true"></canvas><span>'+text(label)+'</span>'+pips(piece?piece.warmth:0)+'</button>';
 }
 // Pieces still on their mannequins: one tile for all of them.
 const locked=(n,what)=>n?'<div class="ward-tile locked" role="img" aria-label="'+n+' '+what+' à trouver"><b>?</b><span>'+n+' à trouver</span></div>':'';
 function tenueHTML(g){
  const w=g.wardrobe,outfits=ownedOutfits(g),helmets=ownedHelmets(g);
  return '<div class="ward">'+
   '<div class="ward-top"><button class="q-track" data-ward-back>‹ Inventaire</button><span class="ward-total">Chaleur : '+WARMTH[g.outfitWarmth()].toLowerCase()+' '+pips(g.outfitWarmth(),'Chaleur totale')+'</span></div>'+
   '<div class="ward-body"><div class="ward-mirror"><canvas class="ward-big" width="34" height="34" aria-label="Kaldor dans sa tenue"></canvas>'+
   '<div class="ward-turn"><button class="q-track" data-turn="-1" aria-label="Tourner Kaldor vers la gauche">◀</button><span class="ward-dir">'+DIR_NAMES[dir]+'</span><button class="q-track" data-turn="1" aria-label="Tourner Kaldor vers la droite">▶</button></div>'+
   '<div class="ward-info" aria-live="polite"></div></div>'+
   '<div class="ward-pick"><div class="m-sec">Tenues '+outfits.length+'/'+all().length+'</div><div class="ward-grid">'+
   outfits.map(o=>tile('wear',o,o.id===w.worn)).join('')+locked(all().length-outfits.length,all().length-outfits.length>1?'tenues':'tenue')+'</div>'+
   '<div class="m-sec">Casques '+helmets.length+'/'+allHelmets().length+'</div><div class="ward-grid">'+
   tile('helm',null,w.helmet===null)+helmets.map(h=>tile('helm',h,h.id===w.helmet)).join('')+locked(allHelmets().length-helmets.length,allHelmets().length-helmets.length>1?'casques':'casque')+'</div>'+
   '</div></div></div>';
 }
 const BARE={label:'Sans casque',warmth:0,description:'Tête nue, la crinière au vent.'};
 // The hovered or focused piece, else what Kaldor wears.
 function describe(el,g){
  if(!el)return;
  const pieces=info?[info]:[get(g.wardrobe.worn),getHelmet(g.wardrobe.helmet)].filter(Boolean);
  el.innerHTML=pieces.map(p=>'<b>'+text(p.label)+'</b> '+pips(p.warmth)+'<small>'+text(p.description)+'</small>').join('');
 }
 // Kaldor cropped from his 80px cell (helmet crests and horns kept).
 const crop=(c,img,x,y,w,h)=>{c.imageSmoothingEnabled=false;c.clearRect(0,0,w,h);if(img)c.drawImage(img,x,y,w,h,0,0,w,h);};
 // Icon: a piece, or Kaldor wearing it, centred on its opaque pixels (rows y0..y1 only).
 function icon(c,img,y0=0,y1=79){
  c.imageSmoothingEnabled=false;c.clearRect(0,0,24,24);if(!img)return;
  const d=img.getContext('2d').getImageData(0,0,80,80).data;let x0=80,x1=-1,top=80,bottom=-1;
  for(let y=y0;y<=y1;y++)for(let x=0;x<80;x++)if(d[(y*80+x)*4+3]){x0=Math.min(x0,x);x1=Math.max(x1,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
  if(x1<0)return;
  const w=Math.min(24,x1-x0+1),h=Math.min(24,bottom-top+1),sx=Math.round((x0+x1+1)/2-w/2),sy=Math.round((top+bottom+1)/2-h/2);
  c.drawImage(img,sx,sy,w,h,Math.floor((24-w)/2),Math.floor((24-h)/2),w,h);
 }
 function animate(cv,turn,[x,y]){
  const c=cv.getContext('2d');
  const tick=now=>{
   if(!cv.isConnected)return;
   const clip=stage?.clip||'dress',t=stage?(now-stage.start)/1000:Infinity,dressing=t<Art().dressDuration(clip);
   if(!dressing)stage=null;
   const d=turn?dir:2;
   crop(c,dressing?Art().nativeFrame(d,clip,Art().frameAt(clip,t)):Art().nativeFrame(d,'sheathed_idle',Art().frameAt('idle',now/1000)),x,y,cv.width,cv.height);
   requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
 }
 function bindTenue(body,g,refresh,inline=false){
  if(!inline)body.innerHTML=tenueHTML(g);
  const title=document.getElementById('menuTitle');if(title&&!inline)title.textContent='Tenue';
  for(const cv of body.querySelectorAll('[data-icon]')){
   const id=cv.dataset.icon,c=cv.getContext('2d');
   // Outfits: Kaldor wearing them bareheaded. Helmets alone. No helmet: his bare head and mane.
   icon(c,!id?Art().bareHead():get(id)?Art().figure(id):Art().garment(id));
  }
  const panel=body.querySelector('.ward-info');describe(panel,g);
  const preview=(el,piece)=>{
   for(const ev of ['mouseenter','focus'])el.addEventListener(ev,()=>{info=piece;describe(panel,g);});
   for(const ev of ['mouseleave','blur'])el.addEventListener(ev,()=>{info=null;describe(panel,g);});
  };
  const changed=clip=>{stage={start:performance.now(),clip};info=null;const top=body.scrollTop;refresh();body.scrollTop=top;};
  for(const b of body.querySelectorAll('[data-wear]')){
   preview(b,get(b.dataset.wear));
   b.addEventListener('click',()=>{if(g.wearOutfit(b.dataset.wear))changed('dress');});
  }
  for(const b of body.querySelectorAll('[data-helm]')){
   const id=b.dataset.helm||null;preview(b,getHelmet(id)||BARE);
   b.addEventListener('click',()=>{if(g.wearHelmet(id))changed('helm');});
  }
  for(const b of body.querySelectorAll('[data-turn]'))b.addEventListener('click',()=>{
   dir=DIRS[(DIRS.indexOf(dir)+Number(b.dataset.turn)+4)%4];body.querySelector('.ward-dir').textContent=DIR_NAMES[dir];
  });
  body.querySelector('[data-ward-back]')?.addEventListener('click',()=>{view=null;info=null;refresh();});
  animate(body.querySelector('.ward-big'),true,[23,20]);
 }
 function bindInventory(body,g,refresh){
  style();if(!g.wardrobe)return;
  if(body.querySelector('.ward')){bindTenue(body,g,refresh,true);return;}
  body.querySelector('[data-ward-open]')?.addEventListener('click',()=>{view='tenue';refresh();body.scrollTop=0;body.querySelector('.ward-tile.on')?.focus({preventScroll:true});});
  const cv=body.querySelector('.ward-stage');if(cv)animate(cv,false,[25,23]);
 }
 // Leaves the Tenue screen (another tab, the menu reopened, Escape); true
 // when it was open.
 function leave(){const open=view==='tenue';view=null;info=null;return open;}
 function style(){
  if(typeof document==='undefined'||!document.head||document.getElementById('wardrobeStyle'))return;
  const s=document.createElement('style');s.id='wardrobeStyle';
  s.textContent=
   '.ward-stage,.ward-big,.ward-tile canvas{image-rendering:pixelated;flex:none;box-sizing:content-box;border:2px solid transparent;border-image:var(--ui-well) var(--ui-well-s) fill / 4px / 2px stretch}'+
   '.ward-stage{width:60px;height:60px;padding:2px}'+
   '.ward-heat{display:inline-flex;gap:3px;margin-left:6px;vertical-align:middle}.ward-heat i{width:7px;height:7px;background:#2b3f37;box-shadow:0 0 0 1px #0e0b09}.ward-heat i.on{background:#e58b3a;box-shadow:0 0 0 1px #0e0b09,inset 0 -2px #b0522a}'+
   '.ward{color:#efe3bd}.ward-top{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;padding:4px 0 8px}.ward-total{font-size:13px;color:#e5d2a5}'+
   '.ward-body{display:flex;gap:16px;align-items:flex-start}.ward-mirror{flex:none;width:220px;display:flex;flex-direction:column;align-items:center;gap:8px}'+
   '.ward-big{width:204px;height:204px;padding:6px;background:radial-gradient(circle at 50% 72%,#3a2c20 0,#1c1712 70%)}'+
   '.ward-turn{display:flex;align-items:center;gap:8px}.ward-turn .q-track{min-width:44px;min-height:40px;padding:4px 10px}.ward-dir{font-size:12px;color:#b7a98a;min-width:104px;text-align:center;white-space:nowrap}'+
   '.ward-info{align-self:stretch;font-size:13px;line-height:1.35;min-height:86px}.ward-info b{font-weight:400;color:#f1e3bd}.ward-info small{display:block;font-size:12px;color:#b7a98a;margin:2px 0 8px}'+
   '.ward-pick{flex:1;min-width:0}.ward-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(84px,1fr));gap:8px;margin:6px 0 10px}'+
   '.ward-tile{display:flex;flex-direction:column;align-items:center;gap:4px;min-width:0;padding:6px 4px;font:400 11px/1.2 PixelUI,monospace;color:#efe3bd;background:#1c1712;border:2px solid #3a2c20;touch-action:manipulation;cursor:pointer}'+
   '.ward-tile canvas{width:72px;height:72px}.ward-tile span{max-width:100%;min-height:2.4em;overflow:hidden;text-align:center;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}.ward-tile .ward-heat{margin:0}'+
   '.ward-tile:hover,.ward-tile:focus-visible{border-color:#8a6b3c;outline:none}.ward-tile.on{border-color:#e5bf67;box-shadow:inset 0 0 0 1px #f0dca0,0 0 8px #e5bf6755}'+
   '.ward-tile.locked{cursor:default;color:#7d6a50;border-style:dashed}.ward-tile.locked b{display:block;font-weight:400;font-size:28px;line-height:76px;height:76px}'+
   '@media(max-width:560px){.ward-body{flex-direction:column;align-items:stretch}.ward-mirror{width:auto}.ward-big{width:136px;height:136px}.ward-grid{grid-template-columns:repeat(auto-fill,minmax(72px,1fr))}.ward-tile canvas{width:48px;height:48px}.ward-tile.locked b{line-height:52px;height:52px}}'+
   '@media(max-height:480px){.ward-top{padding:0 0 4px}.ward-body{gap:10px}.ward-mirror{width:150px;gap:4px}.ward-turn{gap:4px}.ward-turn .q-track{min-width:40px;padding:4px 6px}.ward-dir{min-width:58px;font-size:11px;white-space:normal}.ward-big{width:136px;height:136px;padding:3px}.ward-info{min-height:0}.ward-grid{grid-template-columns:repeat(auto-fill,minmax(70px,1fr));gap:6px}.ward-tile{padding:4px 2px}.ward-tile canvas{width:48px;height:48px}.ward-tile.locked b{line-height:52px;height:52px}}';
  document.head.append(s);
 }
 return {START,WARMTH,normalize,spot,inventoryHTML,bindInventory,leave,style,get,all,helmet:getHelmet,helmets:allHelmets,get view(){return view;}};
})();
