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
  hair:'14',color:'brun',hat:null,beard:null,moustache:null
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

 // Keep the native NPC adult head, hands and eight-step body atlas untouched.
 // Kaldor alone receives a pixel-authored chest and longer hair extensions.
 // The shades are read from his original head, rather than guessed for his hands.
 const HAIR_COLORS=Object.freeze(['#2e2029','#523a34','#927052']);
 const HAIR_KEYS=new Set([0x2e2029,0x523a34,0x927052]);
 const rgb=(d,i)=>(d[i]<<16)|(d[i+1]<<8)|d[i+2];
 const flesh=(r,g,b)=>r>=125&&g>=74&&r>g+17&&g>b+12&&r>b*1.35;
 function pixels(image){return image.getContext('2d',{willReadFrequently:true}).getImageData(0,0,80,80).data;}
 function skinSample(d){
  const colors=new Map();
  for(let y=29;y<=40;y++)for(let x=33;x<=46;x++){
   const i=(y*80+x)*4;
   if(!d[i+3]||!flesh(d[i],d[i+1],d[i+2])||HAIR_KEYS.has(rgb(d,i)))continue;
   const key=rgb(d,i);colors.set(key,(colors.get(key)||0)+1);
  }
  const n=[...colors].filter(([,count])=>count>=2).map(([k])=>k).sort((a,b)=>
   ((a>>16)*3+((a>>8)&255)*4+(a&255))-((b>>16)*3+((b>>8)&255)*4+(b&255)));
  const hex=k=>'#'+k.toString(16).padStart(6,'0');
  return n.length>=2?[hex(n[0]),hex(n[Math.floor(n.length/2)]),hex(n[n.length-1])]:
   ['#ac663d','#d28b56','#e8ab71'];
 }
 function skinAt(d,x,y){
  if(x<0||x>=80||y<0||y>=80)return false;
  const i=(y*80+x)*4;return !!d[i+3]&&flesh(d[i],d[i+1],d[i+2]);
 }
 function swordAtHand(d,dir){
  const fallback=handPose(dir),cx=40+fallback[0],cy=52+fallback[1];
  let point=null,best=Infinity;
  for(let y=Math.max(41,cy-4);y<=Math.min(51,cy+5);y++)
   for(let x=Math.max(22,cx-5);x<=Math.min(58,cx+5);x++){
    if(!skinAt(d,x,y))continue;
    if((dir===2&&x<44)||(dir===0&&x<43)||(dir===1&&x<41)||(dir===3&&x>39))continue;
    const dx=x-cx,dy=y-cy,score=dx*dx+dy*dy*.7+(y<43?4:0);
    if(score<best){best=score;point=[x,y];}
   }
  return point&&best<=16?[point[0]-40,point[1]-52,fallback[2],fallback[3]]:fallback;
 }
 const HAIR_SWAY=[0,0,1,1,0,-1,-1,0];
 function hairTips(c,d,dir,state,frame,under){
  // The visible roots come from the real Aseprite three-plane hair module.
  const sway=/walk|dash/.test(state)?HAIR_SWAY[frame%8]:0;
  for(const side of dir===1?[-1]:dir===3?[1]:[-1,1]){
   let x0=side<0?80:-1,y0=-1;
   for(let y=34;y<=42;y++)for(let x=28;x<=52;x++){
    const i=(y*80+x)*4;
    if(!d[i+3]||!HAIR_KEYS.has(rgb(d,i)))continue;
    if((side<0&&x<=x0)||(side>0&&x>=x0)){
     if(y>=y0-1){x0=x;y0=y;}
    }
   }
   if(y0<36||x0<26||x0>54)continue;
   if(under===false&&dir!==0||under===true&&dir===0)continue;
   const x=x0+side*(under?0:1)+sway,y=y0+1+(under?1:0);
   if(y>48)continue;
   c.fillStyle=HAIR_COLORS[0];c.fillRect(x,y,2,3);
   c.fillStyle=HAIR_COLORS[1];c.fillRect(x+(side<0?1:0),y,1,2);
  }
 }
 function bareChest(c,d,dir){
  // Recolour only shirt pixels inside the real human torso silhouette;
  // never paint over the modular adult male head, hands, boots or rear hair.
  if(dir===0)return;
  const [dark,mid,light]=skinSample(d);
  const rows=dir===2?[[40,35,45],[41,34,46],[42,35,45],[43,35,45],[44,36,44]]:
   [[40,37,44],[41,37,44],[42,38,44],[43,38,43],[44,39,43]];
  for(const [y,left,right] of rows)for(let x=left;x<=right;x++){
   const i=(y*80+x)*4;
   if(!d[i+3]||HAIR_KEYS.has(rgb(d,i))||skinAt(d,x,y))continue;
   c.fillStyle=x===left||y===44?dark:(x>right-2||y===40)?light:mid;
   c.fillRect(x,y,1,1);
  }
  c.fillStyle=dark;
  if(dir===2){c.fillRect(38,41,2,1);c.fillRect(42,41,2,1);c.fillRect(40,43,1,1);}
  else c.fillRect(dir===1?42:37,42,2,1);
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
  const npcPixels=pixels(human);
  hairTips(c,npcPixels,dir,state,frame,true);
  c.drawImage(human,0,0);
  bareChest(c,npcPixels,dir);
  hairTips(c,npcPixels,dir,state,frame,false);
  gear(c,dir,state,frame);
  if(sheathed){
   if(dir===0){c.save();c.translate(40,52);scabbard(c,dir);c.restore();}
  }else{
   let sword;
   if(state==='attack'&&typeof swordPose==='function')sword=swordPose(dir,Math.max(0,Math.min(5,frame)),combo);
   else if(['sheathe','sheathe_walk','draw','draw_walk'].includes(state))sword=weaponBlend(dir,state,frame);
   else sword=swordAtHand(npcPixels,dir);
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
 return Object.freeze({version:2,appearance,anchor:foot,
  preload,ready,frameAt,gaitFrame,remap,pose,nativeFrame,clear,
  stats:()=>({ready:loaded,failed,loading:!!loading,frames:cache.size})
 });
});
