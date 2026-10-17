/* Hearthreaver — Kaldor assembled from the original human NPC parts.
 * The original Aseprite adult male head, hands, body, boots, three hair planes
 * and all 8 walk poses are composed by scripts/civilian-art.js. Only Kaldor's
 * outfit selection, harness and sword are specific to the hero.
 * Native NPC tile 48x48; engine frame 80x80 with feet at (40,52).
 */
(function(root,factory){
 'use strict';
 const art=factory();
 if(typeof module==='object'&&module.exports)module.exports=art;
 if(root)root.HearthreaverKaldorCivilianArt=art;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const appearance=Object.freeze({
  sex:'masculin',outfit:'E01-masculin-terre',age:'adulte',
  hair:'14',color:'noir',hat:null,beard:null,moustache:null
 });
 const foot=Object.freeze({x:40,y:52});
 const cache=new Map(),strides=new WeakMap();
 let loading=null,loaded=false,failed=false;
 const valid=()=>typeof CIVILIAN_ART!=='undefined'&&typeof CIVILIAN_BITMAPS!=='undefined'&&
  !!CIVILIAN_ART.outfits?.[appearance.outfit]&&
  !!CIVILIAN_ART.modules?.[appearance.sex+'-'+appearance.age]&&
  !!CIVILIAN_ART.modules?.[appearance.sex+'-hair-'+appearance.hair];
 function preload(){
  if(!valid())return Promise.resolve(false);
  if(loading)return loading;
  loading=Promise.resolve().then(()=>CIVILIAN_BITMAPS.preload(appearance))
   .then(values=>{loaded=Array.isArray(values)&&values.every(Boolean);failed=!loaded;return loaded;})
   .catch(()=>{loaded=false;failed=true;return false;});
  return loading;
 }
 function ready(){return loaded&&valid();}
 function clip(action){return valid()?CIVILIAN_ART.clips[action]:null;}
 function frameAt(action,seconds=0,distance=0){
  const spec=clip(action);if(!spec)return 0;
  const sum=spec.durations.reduce((a,b)=>a+b,0);
  let ms=spec.stride?((distance%spec.stride+spec.stride)%spec.stride)/spec.stride*sum:Math.max(0,seconds)*1000;
  ms=spec.loop?ms%sum:Math.min(ms,sum-0.001);
  for(let i=0;i<spec.durations.length;i++){if(ms<spec.durations[i])return i;ms-=spec.durations[i];}
  return spec.durations.length-1;
 }
 // Share the NPC human distance-driven gait: colliding with a wall cannot
 // advance the walk frame. WeakMap is ephemeral, never written to save data.
 function gaitFrame(actor){
  if(!actor||!Number.isFinite(actor.x)||!Number.isFinite(actor.y))return 0;
  let p=strides.get(actor);
  if(!p){p={x:actor.x,y:actor.y,distance:0};strides.set(actor,p);}
  const d=Math.hypot(actor.x-p.x,actor.y-p.y);
  if(actor.moving&&d>0.001&&d<48)p.distance+=d;
  p.x=actor.x;p.y=actor.y;
  return frameAt('walk',0,p.distance);
 }
 function remap(state,frame,walkFrame,time){
  if(state==='idle'||state==='sheathed_idle')return frameAt('idle',time);
  if(state==='walk'||state==='sheathed_walk')return walkFrame;
  // Legacy weaponVisual transition: 6 phases x 6 gait frames.
  // Keep the 6 phases while replacing gait with NPC's 8 real frames.
  if(state==='sheathe_walk'||state==='draw_walk')return Math.floor(frame/6)*8+walkFrame;
  return frame;
 }
 const actions=Object.freeze({
  idle:'idle',walk:'walk',sheathed_idle:'idle',sheathed_walk:'walk',
  attack:'carry',guard:'carry',dash:'flee',hurt:'hit',use:'carry',melee:'startle',
  sheathe:'carry',sheathe_walk:'walk',draw:'carry',draw_walk:'walk',
  sheathed_dash:'flee',sheathed_hurt:'hit',sheathed_use:'carry',sheathed_melee:'startle'
 });
 function pose(state,frame){
  let action=actions[state]||'idle';
  let c=clip(action);if(!c){action='idle';c=clip(action);}
  if(!c)return null;
  const n=c.durations.length;
  let f=state==='sheathe_walk'||state==='draw_walk'?frame%8:frame;
  if(['attack','melee','use','sheathe','draw'].includes(state))f=Math.round(Math.max(0,Math.min(5,f))*(n-1)/5);
  if(['dash','sheathed_dash'].includes(state))f=Math.round(Math.max(0,Math.min(3,f))*(n-1)/3);
  f=Math.min(n-1,Math.max(0,Math.floor(f)));
  return {action,frame:f};
 }
 function line(c,x,y,X,Y,color,thickness=1){
  x=Math.round(x);y=Math.round(y);X=Math.round(X);Y=Math.round(Y);
  c.fillStyle=color;
  let dx=Math.abs(X-x),sx=x<X?1:-1,dy=-Math.abs(Y-y),sy=y<Y?1:-1,err=dx+dy;
  for(;;){
   c.fillRect(x-Math.floor(thickness/2),y-Math.floor(thickness/2),thickness,thickness);
   if(x===X&&y===Y)break;
   const e=err*2;if(e>=dy){err+=dy;x+=sx;}if(e<=dx){err+=dx;y+=sy;}
  }
 }
 const sheath={
  0:{w:[8,-21],v:[-11,14]},1:{w:[-7,-19],v:[4,14]},
  2:{w:[8,-21],v:[-10,14]},3:{w:[7,-19],v:[-4,14]}
 };
 function scabbard(c,dir){
  const {w,v}=sheath[dir],tx=w[0]+v[0],ty=w[1]+v[1];
  line(c,w[0],w[1],tx,ty,'#100e20',4);
  line(c,w[0],w[1],tx,ty,'#50342f',2);
  line(c,w[0]-1,w[1],tx-1,ty,'#a16a44');
  line(c,w[0]-2,w[1]-2,w[0]+2,w[1]+2,'#e5c18a');
  line(c,w[0]+2,w[1]-3,w[0]+5,w[1]-7,'#3b4551',2);
  c.fillStyle='#e5c18a';c.fillRect(w[0]+4,w[1]-7,2,2);
 }
 function handPose(dir){
  // Handle at waist height where the existing human hand is actually drawn.
  return dir===0?[6,-8,10,-11]:dir===1?[5,-7,16,-8]:dir===3?[-5,-7,-16,-8]:[7,-7,15,-11];
 }
 function weapon(c,p,authoritativeSwordPainter){
  if(typeof authoritativeSwordPainter==='function'){
   authoritativeSwordPainter(c,p);return;
  }
  // Browser preview-only fallback, not used by the actual game renderer.
  const [x,y,vx,vy]=p,l=Math.max(1,Math.hypot(vx,vy));
  line(c,x+Math.round(vx*2/l),y+Math.round(vy*2/l),x+vx,y+vy,'#100e20',4);
  line(c,x+Math.round(vx*2/l),y+Math.round(vy*2/l),x+vx,y+vy,'#a5b8bf',2);
  line(c,x-3,y+2,x,y,'#50342f',3);
  line(c,x-3,y-3,x+3,y+3,'#e5c18a');
 }
 function weaponBlend(dir,state,frame){
  const start=handPose(dir),end=sheath[dir];
  const total=state==='draw'||state==='draw_walk'?5:6;
  const phase=state.endsWith('_walk')?Math.floor(frame/8):frame;
  const f=Math.max(0,Math.min(1,(phase+1)/total));
  const t=state.startsWith('draw')?1-f:f;
  return start.map((v,i)=>v+((i<2?end.w[i]:end.v[i-2])-v)*t);
 }
 function gear(c,dir,state,frame){
  // Minimal hero-only leather strap on top of the actual NPC outfit. Human
  // head, hands and walk shapes are never redrawn or replaced.
  c.save();c.translate(40,52);
  const bob=(state==='walk'||state==='sheathed_walk')&&frame%8===2?-1:0;
  if(dir===1||dir===3){
   const sign=dir===3?-1:1;
   line(c,sign*1,-12+bob,sign*3,-7+bob,'#4e332a',2);
   line(c,sign*2,-11+bob,sign*3,-8+bob,'#a27550');
  }else{
   line(c,dir===0?-4:4,-13+bob,dir===0?3:-3,-7+bob,'#4e332a',2);
   line(c,dir===0?-4:4,-12+bob,dir===0?3:-3,-7+bob,'#a27550');
  }
  c.fillStyle='#2c2330';c.fillRect(-1,-6+bob,3,2);
  c.fillStyle='#e5c18a';c.fillRect(0,-6+bob,1,1);
  c.restore();
 }
 function nativeFrame(dir,state,frame,combo=0,swordPose,swordPainter,flash=false){
  if(!Number.isInteger(dir)||dir<0||dir>3)throw new RangeError('Direction Kaldor: 0..3');
  if(!ready()){if(!loading&&!failed)preload();return null;}
  const key=[dir,state,frame,combo,!!flash].join(':');
  if(cache.has(key)){
   const value=cache.get(key);cache.delete(key);cache.set(key,value);return value;
  }
  const p=pose(state,frame);if(!p)return null;
  const human=CIVILIAN_BITMAPS.get(appearance,p.action,dir,p.frame);
  if(!human)return null;
  const out=document.createElement('canvas');out.width=80;out.height=80;
  const c=out.getContext('2d');c.imageSmoothingEnabled=false;
  const sheathed=state.startsWith('sheathed_');
  if(sheathed&&dir!==0){c.save();c.translate(40,52);scabbard(c,dir);c.restore();}
  // Reuse original Aseprite outfit, ADULT MALE HEAD, real NPC hands and
  // all three hair planes, with frame-accurate body/leg animation.
  c.drawImage(human,0,0);
  gear(c,dir,state,frame);
  if(sheathed){
   if(dir===0){c.save();c.translate(40,52);scabbard(c,dir);c.restore();}
  }else{
   let sword;
   if(state==='attack'&&typeof swordPose==='function')sword=swordPose(dir,Math.max(0,Math.min(5,frame)),combo);
   else if(['sheathe','sheathe_walk','draw','draw_walk'].includes(state))sword=weaponBlend(dir,state,frame);
   else sword=handPose(dir);
   c.save();c.translate(40,52);weapon(c,sword,swordPainter);c.restore();
  }
  if(flash){
   c.globalCompositeOperation='source-atop';c.fillStyle='#fff0bf';
   c.fillRect(0,0,80,80);c.globalCompositeOperation='source-over';
  }
  cache.set(key,out);while(cache.size>192)cache.delete(cache.keys().next().value);
  return out;
 }
 function clear(){cache.clear();}
 return Object.freeze({version:1,appearance,anchor:foot,
  preload,ready,frameAt,gaitFrame,remap,pose,nativeFrame,clear,
  stats:()=>({ready:loaded,failed,loading:!!loading,frames:cache.size})
 });
});
