/* Hearthreaver — Kaldor assembled from the original human NPC parts.
 * The original Aseprite adult male head, hands, body, boots, three hair planes
 * and all 8 walk poses are composed by scripts/civilian-art.js. Only Kaldor's
 * harness, sword and sword-holding hands are specific to the hero.
 * Native NPC tile 48x48; engine frame 80x80 with feet at (40,52).
 * Attacks: the NPC layers (back hair, head, torso, front hair) are stacked
 * separately so the head can lean and the hair can trail; the baked hands are
 * folded into the torso and redrawn on the grip. The blade keeps the exact
 * direction of the game's swordPose() on every frame; hit timing, reach and
 * collision sweeps stay in the engine and are not read or changed here.
 * Outfits (v4): the body, foreground and bare-torso sheets come from
 * KALDOR_OUTFITS (scripts/build-kaldor-outfits.cjs, same rig as the NPCs);
 * the head and hair stay the civilian modules. wear() switches the outfit and
 * the 'dress' clip pulls the new garment over his head.
 * Helmets (v5): three planes like the NPC headgear modules, the nape behind
 * the head, the helmet over the hair and a mask that erases the hair under
 * it. wearHelmet() switches it and the 'helm' clip lifts it onto his head.
 */
(function(root,factory){
 'use strict';
 const art=factory();
 if(typeof module==='object'&&module.exports)module.exports=art;
 if(root)root.HearthreaverKaldorCivilianArt=art;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 // outfit names the civilian look the starting pagne reproduces pixel for
 // pixel; the outfit actually drawn is worn.outfit, from KALDOR_OUTFITS.
 const appearance=Object.freeze({
  sex:'masculin',outfit:'E01-masculin-terre',age:'adulte',
  hair:'14',color:'brun',hat:null,beard:null,moustache:null
 });
 const START_OUTFIT='pagne-noue';
 const weapons=()=>typeof HearthreaverWeapons!=='undefined'?HearthreaverWeapons:null;
 let wielded='exile',wielder=null;
 const customWeapon=()=>weapons()&&weapons().has(wielded);
 function wield(id,actor=null){if(!weapons()?.has(id))return false;wielded=id;wielder=actor?.weapon===id&&actor.attack>0?actor:null;return true;}
 // previous: what he wore before the last change ({outfit, helmet}), shown
 // until the swap frame of the dress or helm clip.
 const worn={outfit:START_OUTFIT,helmet:null,previous:null};
 const foot=Object.freeze({x:40,y:52});
 const cache=new Map(),strides=new WeakMap(),layerCache=new Map(),sheets=new Map();
 let loading=null,loaded=false,failed=false;
 const OUTFITS=()=>typeof KALDOR_OUTFITS!=='undefined'?KALDOR_OUTFITS:null;
 const outfitData=id=>OUTFITS()?.outfits?.[id]||null;
 const helmetData=id=>id&&OUTFITS()?.helmets?.[id]||null;
 let headId=appearance.sex+'-'+appearance.age,hairId=appearance.sex+'-hair-'+appearance.hair;
 const valid=()=>typeof CIVILIAN_ART!=='undefined'&&typeof CIVILIAN_BITMAPS!=='undefined'&&
  !!outfitData(worn.outfit)&&!!CIVILIAN_ART.modules?.[headId]&&!!CIVILIAN_ART.modules?.[hairId];
 // Outfit sheets are decoded once and kept: switching never waits on a decode.
 function sheet(key,asset){
  let e=sheets.get(key);if(e)return e;
  const im=new Image();e={image:im,ready:false};
  e.promise=new Promise(resolve=>{im.onload=()=>{e.ready=true;resolve(true);};im.onerror=()=>resolve(false);});
  im.src='data:image/png;base64,'+asset.png;sheets.set(key,e);return e;
 }
 function sheetsOf(o){return {body:sheet(o.id,o.asset),fore:sheet(o.id+'-front',o.foreground),bare:sheet(o.id+'-bare',o.bare),stand:sheet(o.id+'-stand',o.stand)};}
 const helmetSheet=h=>sheet('casque:'+h.id,h.asset);
 function preload(){
  if(!valid())return Promise.resolve(false);
  if(loading)return loading;
  const nativeArms=typeof KALDOR_WEAPON_LIMBS!=='undefined'?Object.entries(KALDOR_WEAPON_LIMBS.outfits).flatMap(([id,views])=>views.flatMap((parts,d)=>parts.map((p,i)=>sheet('native-arm:'+id+':'+d+':'+i,p).promise))):[];
  const modules=[headId,hairId,'masculin-mur','masculin-age',...['01','02','05','09'].map(n=>'masculin-hair-'+n)].map(id=>sheet(id,CIVILIAN_ART.modules[id].asset).promise);
  const outfits=Object.values(OUTFITS().outfits).flatMap(o=>Object.values(sheetsOf(o)).map(e=>e.promise));
  const helmets=Object.values(OUTFITS().helmets||{}).map(h=>helmetSheet(h).promise);
  loading=Promise.all([...modules,...outfits,...helmets,...nativeArms])
   .then(values=>{loaded=values.every(Boolean);failed=!loaded;return loaded;})
   .catch(()=>{loaded=false;failed=true;return false;});
  return loading;
 }
 function ready(){return loaded&&valid();}
 function clip(action){return valid()?(OUTFITS().clips?.[action]||CIVILIAN_ART.clips[action]):null;}
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
  attack:'idle',guard:'carry',dash:'flee',hurt:'hit',use:'carry',melee:'startle',
  sheathe:'carry',sheathe_walk:'walk',draw:'carry',draw_walk:'walk',
  sheathed_dash:'flee',sheathed_hurt:'hit',sheathed_use:'carry',sheathed_melee:'startle'
 });
 // The human atlas profile strides are stored contact -> up -> passing -> down,
 // i.e. backwards: played in index order the planted foot slides forward and
 // the hero moonwalks. Profile gaits are read in reverse (0,7,6...1).
 const PROFILE_GAITS=new Set(['walk','flee']);
 function pose(state,frame,dir=2){
  let action=actions[state]||'idle';
  let c=clip(action);if(!c){action='idle';c=clip(action);}
  if(!c)return null;
  const n=c.durations.length;
  let f=state==='sheathe_walk'||state==='draw_walk'?frame%8:frame;
  if(state==='attack')f=0;
  if(['melee','use','sheathe','draw'].includes(state))f=Math.round(Math.max(0,Math.min(5,f))*(n-1)/5);
  if(['dash','sheathed_dash'].includes(state))f=Math.round(Math.max(0,Math.min(3,f))*(n-1)/3);
  f=Math.min(n-1,Math.max(0,Math.floor(f)));
  if((dir===1||dir===3)&&PROFILE_GAITS.has(action))f=(n-f)%n;
  return {action,frame:f};
 }

 // ---- Pixel buffer: crisp integer pixels, one 1px ink outline pass. ----
 const INK='#100c14';
 const SKIN=['#f8b07a','#c8743e'];
 const STEEL=['#5e686e','#9aa6ab','#d6dcdc','#fbfbef'];
 const GOLD=['#b5772c','#f3af3c'];
 const GRIP=['#50342f','#754b37'];
 const SMEAR=['#fff0be','#e3eee9','#b8cdd2'];
 // Bare arms and hands by default; gloves and sleeves of the worn outfit.
 let ARM=SKIN[1],FIST=SKIN;
 function dressArms(o){const a=o?.arms;FIST=a?a.hand.map(c=>'#'+c):SKIN;ARM=a?'#'+a.sleeve[1]:SKIN[1];}
 function buffer(){
  const px=new Map();
  return {
   px,
   set(x,y,color,z=0){
    x=Math.round(x);y=Math.round(y);const k=x+','+y,o=px.get(k);
    if(!o||o.z<=z)px.set(k,{x,y,color,z});
   },
   line(x,y,X,Y,color,z=0){
    x=Math.round(x);y=Math.round(y);X=Math.round(X);Y=Math.round(Y);
    let dx=Math.abs(X-x),sx=x<X?1:-1,dy=-Math.abs(Y-y),sy=y<Y?1:-1,err=dx+dy;
    for(let k=0;k<200;k++){
     this.set(x,y,color,z);if(x===X&&y===Y)break;
     const e=err*2;if(e>=dy){err+=dy;x+=sx;}if(e<=dx){err+=dx;y+=sy;}
    }
   },
   outline(z=-9){
    const add=[];
    for(const {x,y} of px.values())for(const [a,b] of [[1,0],[-1,0],[0,1],[0,-1]])
     if(!px.has((x+a)+','+(y+b)))add.push([x+a,y+b]);
    for(const [x,y] of add)this.set(x,y,INK,z);
   },
   paint(c){for(const {x,y,color} of px.values()){c.fillStyle=color;c.fillRect(x,y,1,1);}}
  };
 }
 const unit=(x,y)=>{const l=Math.hypot(x,y)||1;return [x/l,y/l];};
 // Kaldor's greatsword at the human NPC scale: 11px blade, 5px gold guard,
 // 3px wrapped grip and pommel (16px from pommel to tip, as tall as his body).
 const BLADE=11;
 function paintSword(b,hx,hy,ux,uy,{hands=2,blade=BLADE,dir=2}={}){
  if(customWeapon()){weapons().paint(b,wielded,hx,hy,ux,uy,blade/BLADE,weapons().handedness(dir));return;}
  blade=Math.max(2,Math.round(blade));
  const nx=-uy,ny=ux,at=d=>[hx+ux*d,hy+uy*d];
  // Second blade row on the axis that keeps a 2px edge at every angle.
  const ox=Math.abs(ux)>=Math.abs(uy)?0:(ux*uy>=0?-1:1),oy=ox?0:-1;
  const [b0x,b0y]=at(2),[b1x,b1y]=at(2+blade),[e1x,e1y]=at(blade);
  b.line(b0x+ox,b0y+oy,e1x+ox,e1y+oy,STEEL[1],2);
  b.line(b0x,b0y,b1x,b1y,STEEL[2],3);
  b.set(b1x,b1y,STEEL[3],4);
  const [gx,gy]=at(1);
  b.line(gx-nx*2,gy-ny*2,gx+nx*2,gy+ny*2,GOLD[0],5);
  b.line(gx-nx,gy-ny,gx+nx,gy+ny,GOLD[1],6);
  const [px,py]=at(-3);
  b.line(...at(0),...at(-2),GRIP[1],4);
  b.set(px,py,GOLD[1],5);
  if(hands>0)fist(b,hx,hy);
  if(hands>1)fist(b,hx-ux*2,hy-uy*2);
 }
 function fist(b,x,y){
  x=Math.round(x-.5);y=Math.round(y-.5);
  b.set(x,y,FIST[0],8);b.set(x+1,y,FIST[0],8);b.set(x,y+1,FIST[0],8);b.set(x+1,y+1,FIST[1],8);
 }
 function arm(b,sx,sy,hx,hy){
  // Hidden behind the big NPC head once the hand is raised above the chin.
  if(Math.hypot(hx-sx,hy-sy)<3.5||hy<-11)return;
  b.line(sx,sy,hx,hy,ARM,1);
 }

 // ---- Separate NPC layers, so the head, hair and torso can move apart. ----
 function layers(action,dir,frame,outfit=worn.outfit,helmet=worn.helmet){
  const key=[headId,hairId,outfit,helmet,action,dir,frame].join(':');
  if(layerCache.has(key))return layerCache.get(key);
  const A=CIVILIAN_ART,o=outfitData(outfit),d=[2,1,0,3][dir];
  if(!o||!o.frames[action])return null;
  const image=e=>e.ready?e.image:null;
  const tile=(asset,img,index,dx=0,dy=0)=>{
   const cv=document.createElement('canvas');cv.width=cv.height=80;
   const c=cv.getContext('2d');c.imageSmoothingEnabled=false;
   const i=asset.tiles[index];c.drawImage(img,(i%16)*48,Math.floor(i/16)*48,48,48,16+dx,16+dy,48,48);
   return cv;
  };
  const S=sheetsOf(o),bodyImage=image(S.body),foreImage=image(S.fore),bareImage=image(S.bare);
  const headImage=image(sheet(headId,A.modules[headId].asset)),hairImage=image(sheet(hairId,A.modules[hairId].asset));
  if(!bodyImage||!foreImage||!bareImage||!headImage||!hairImage)return null;
  // Hero-only clips reuse the rest head, moved like the rig moves a head.
  const hero=!A.moduleFrames[action],[hx,hy]=hero?OUTFITS()[action].head[d][frame]:[0,0];
  const base=hero?A.moduleFrames.idle[d]:A.moduleFrames[action][d]+frame,index=o.frames[action][d]+frame;
  const out={
   body:tile(o.asset,bodyImage,index),
   fore:tile(o.foreground,foreImage,index),
   bare:tile(o.bare,bareImage,index),
   head:tile(A.modules[headId].asset,headImage,base,hx,hy),
   hair:[0,1,2].map(p=>tile(A.modules[hairId].asset,hairImage,base+p*A.moduleCount,hx,hy)),
   headFirst:!!o.headFirst,fold:o.torso==='fold',hat:null,mask:null
  };
  // Helmet planes, animated with the same clips as the outfit bodies.
  const h=helmetData(helmet);
  if(h){
   const helmImage=image(helmetSheet(h));if(!helmImage)return null;
   const at=h.frames[action][d]+frame;
   out.hat=[0,1].map(p=>tile(h.asset,helmImage,p*h.count+at));
   out.mask=tile(h.asset,helmImage,2*h.count+at);
  }
  layerCache.set(key,out);while(layerCache.size>48)layerCache.delete(layerCache.keys().next().value);
  return out;
 }
 // A hair plane at (tx,ty) with the helmet mask at the head (hx,hy) erased,
 // as CivilianAtlas.get masks the hair under an NPC's headgear.
 function hairOn(c,L,p,tx=0,ty=0,hx=tx,hy=ty){
  if(!L.mask){c.drawImage(L.hair[p],tx,ty);return;}
  const [cv,k]=canvas80();k.drawImage(L.hair[p],tx,ty);
  k.globalCompositeOperation='destination-out';k.drawImage(L.mask,hx,hy);c.drawImage(cv,0,0);
 }
 // The same stack as CivilianAtlas.get for Kaldor's head, hair, outfit and
 // helmet (nape behind the head, helmet over the front hair).
 function human(L){
  const [out,c]=canvas80();
  hairOn(c,L,0);if(L.headFirst)c.drawImage(L.head,0,0);c.drawImage(L.body,0,0);
  hairOn(c,L,1);if(L.hat)c.drawImage(L.hat[0],0,0);if(!L.headFirst)c.drawImage(L.head,0,0);c.drawImage(L.fore,0,0);
  hairOn(c,L,2);if(L.hat)c.drawImage(L.hat[1],0,0);
  return out;
 }
 // Fold the two baked NPC hands into the torso: Kaldor's hands are on the grip.
 // Clothed outfits ship a bare torso sheet instead (arms layers removed).
 function torso(L,dir,dx=0){if(customWeapon())return L.bare;return L.fold?torsoOnly(L.body,dir,dx):L.bare;}
 function torsoOnly(body,dir,dx=0){
  const cv=document.createElement('canvas');cv.width=cv.height=80;
  const c=cv.getContext('2d');c.drawImage(body,0,0);
  const im=c.getImageData(0,0,80,80),d=im.data;
  let top=80;for(let i=3;i<d.length;i+=4)if(d[i]){top=Math.floor((i>>2)/80);break;}
  const put=(x,y,hex)=>{const i=(y*80+x)*4;if(!hex){d[i+3]=0;return;}const n=parseInt(hex.slice(1),16);d[i]=n>>16;d[i+1]=n>>8&255;d[i+2]=n&255;d[i+3]=255;};
  const solid=(x,y)=>d[(y*80+x)*4+3]>0;
  if(dir===0||dir===2){
   for(let y=top;y<=top+3;y++)for(let x=28;x<52;x++){
    if(x<=35+dx||x>=(y===top+3?45:44)+dx)put(x,y,null);
   }
   for(const x of [36+dx,43+dx])if(!solid(x,top))put(x,top,INK);
  }else{
   const xs=(dir===1?[38,39,40]:[38,39]).map(x=>x+dx);
   for(let y=top+1;y<=top+2;y++)for(const x of xs)if(solid(x,y))put(x,y,SKIN[0]);
  }
  c.putImageData(im,0,0);return cv;
 }
 // Shift of the NPC head (and the torso under it) from the idle rest pose:
 // walk bob, breathing, recoil. Harness, scabbard and held sword follow it.
 const shiftCache=new Map();
 function headBox(action,dir,frame){
  const L=layers(action,dir,frame);if(!L)return null;
  const d=pixels(L.head);let top=-1,left=80;
  for(let y=0;y<80;y++)for(let x=0;x<80;x++)if(d[(y*80+x)*4+3]){if(top<0)top=y;if(x<left)left=x;}
  return top<0?null:[left,top];
 }
 function bodyShift(action,dir,frame){
  const key=[headId,hairId,worn.outfit,action,dir,frame].join(':');
  if(shiftCache.has(key))return shiftCache.get(key);
  const a=headBox(action,dir,frame),r=headBox('idle',dir,0);
  const out=a&&r?[a[0]-r[0],a[1]-r[1]]:[0,0];
  if(a&&r)shiftCache.set(key,out);
  return out;
 }

 // ---- Attack choreography -------------------------------------------------
 // One key drawing per gameplay frame: 1 wind-up, 2 strike (smear), 3 contact
 // (smear), 4 follow-through, 5 recovery. The blade direction is always
 // swordPose(dir,frame,combo); only hands, lean and hair are authored here.
 // h: front hand on the grip, relative to the feet. z: sword in front of or
 // behind the body. head/hair: pixel lean of the head and trailing hair.
 // lunge: profile legs in a long stride.
 const F=(h,z,head,hair=[0,0],lunge=false,u=null)=>({h,z,head,hair,lunge,u});
 // z: 0 sword and hands behind the head, 1 in front, 2 sword behind but
 // hands visible (overhead grip above the hair).
 const ATTACK={
  // Face view: Kaldor's right hand is screen-left; down on screen is towards the camera.
  2:[
   [null,F([-7,-5],1,[-1,0]),F([-3,-3],1,[0,1],[1,0]),F([3,-3],1,[0,1],[-1,0]),F([6,-5],1,[1,0],[-1,0]),null],
   [null,F([4,-3],1,[1,0]),F([-3,-3],1,[0,1],[1,0]),F([-7,-5],1,[-1,1],[1,0]),F([-6,-8],1,[-1,0],[1,0]),null],
   [null,F([6,-9],1,[1,-1]),F([5,-4],1,[0,0],[-1,0]),F([1,-3],1,[0,1],[0,-1]),F([-5,-3],1,[-1,1],[1,0]),null],
   [null,F([0,-21],2,[0,-1]),F([0,-5],1,[0,1],[0,-1]),F([0,-3],1,[0,2],[0,-1]),F([2,-3],1,[0,1]),null]
  ],
  // Profile, facing right (left is mirrored). Wind-ups raise the grip above
  // the hair, so the blade never has to pass through the head.
  1:[
   [null,F([-3,-20],1,[-1,0]),F([6,-9],1,[1,0],[-1,0],true),F([6,-6],1,[1,1],[-1,0],true),F([4,-4],1,[1,1],[0,0],true),null],
   [null,F([6,-6],1,[0,1]),F([6,-9],1,[1,0],[-1,0],true),F([2,-19],1,[1,-1],[-1,1],true),F([-2,-18],1,[0,-1],[0,1]),null],
   [null,F([-4,-19],1,[-1,0]),F([5,-12],1,[0,-1],[-1,0],true),F([6,-7],1,[1,0],[-1,0],true),F([4,-4],1,[1,1],[0,0],true),null],
   [null,F([-4,-20],1,[-1,-1]),F([5,-11],1,[0,0],[-1,0],true),F([5,-6],1,[1,1],[-1,0],true),F([4,-4],1,[1,2],[0,-1],true),null]
  ],
  // Back view: forward is up on screen. The sword is in front of the hero, so
  // his hair and back hide the hands and the grip; only the blade and its
  // smear show around the head. Overhead wind-up: hands above the hair.
  0:[
   [null,F([7,-9],0,[1,0]),F([2,-15],0,[0,-1],[-1,0]),F([-4,-13],0,[0,-1],[1,0]),F([-7,-7],0,[-1,0],[1,0]),null],
   [null,F([-4,-13],0,[-1,0]),F([2,-15],0,[0,-1],[1,0]),F([7,-9],0,[0,-1],[-1,0]),F([7,-7],0,[1,0],[-1,0]),null],
   [null,F([7,-10],0,[1,0]),F([2,-15],0,[0,-1],[-1,0]),F([-4,-13],0,[0,-1],[1,0]),F([-7,-6],0,[-1,0],[1,0]),null],
   [null,F([0,-22],2,[0,1]),F([0,-17],0,[0,-1],[0,1]),F([0,-14],0,[0,-2],[0,1]),F([2,-12],0,[0,-1]),null]
  ]
 };
 // Sword held point up, ready: recovery frame, idle, walk. Face and back:
 // in the right hand at the side, blade tilted out past the hair. Profile:
 // hands forward, blade raised in front of the face.
 const GUARD={2:{h:[-6,-6],u:[-.5,-.87]},1:{h:[3,-6],u:[.71,-.71]},0:{h:[6,-6],u:[.6,-.8]},3:{h:[-4,-6],u:[-.71,-.71]}};
 const SHOULDERS={2:[[-4,-8],[3,-8]],0:[[-4,-8],[3,-8]],1:[[0,-8]],3:[[-1,-8]]};
 function attackSpec(dir,frame,combo){
  if(customWeapon())return wielder?weapons().combatPose(wielder,frame):weapons().pose(wielded,dir,frame,combo);
  const view=dir===3?1:dir,row=ATTACK[view][Math.max(0,Math.min(3,combo))];
  let s=row[Math.max(1,Math.min(5,frame))];
  if(!s){const g=GUARD[dir];return {h:g.h,z:dir===0?0:1,head:[0,0],hair:[0,0],lunge:false,u:g.u,rest:true};}
  s={...s,h:[...s.h],head:[...s.head],hair:[...s.hair],u:s.u&&[...s.u]};
  if(dir===3){s.h[0]=-s.h[0]-1;s.head[0]=-s.head[0];s.hair[0]=-s.hair[0];if(s.u)s.u[0]=-s.u[0];}
  return s;
 }
 function bladeDir(dir,frame,combo,swordPose){
  if(customWeapon())return (wielder?weapons().combatPose(wielder,frame):weapons().pose(wielded,dir,frame,combo)).u;
  const s=attackSpec(dir,frame,combo);if(s.u)return unit(s.u[0],s.u[1]);
  const f=Math.max(1,Math.min(4,frame));
  const p=typeof swordPose==='function'?swordPose(dir,f,combo):[0,0,GUARD[dir].u[0],GUARD[dir].u[1]];
  return unit(p[2],p[3]);
 }
 // Smear: a crescent left by the blade tip since the previous key drawing,
 // thin and dithered at the tail, widest against the blade.
 function smear(b,dir,frame,combo,swordPose,width,back){
  const a=attackSpec(dir,frame-1,combo),z=attackSpec(dir,frame,combo);
  const ua=bladeDir(dir,frame-1,combo,swordPose),uz=bladeDir(dir,frame,combo,swordPose);
  let aa=Math.atan2(ua[1],ua[0]),az=Math.atan2(uz[1],uz[0]),da=az-aa;
  while(da>Math.PI)da-=2*Math.PI;while(da<-Math.PI)da+=2*Math.PI;
  const r1=2+BLADE+1,steps=40;
  if(Math.abs(da)>2.6){
   // Chop through the line of sight: the tip runs straight across the body.
   const ta=[a.h[0]+ua[0]*r1,a.h[1]+ua[1]*r1],tz=[z.h[0]+uz[0]*r1,z.h[1]+uz[1]*r1];
   const [px,py]=unit(-(tz[1]-ta[1]),tz[0]-ta[0]);
   for(let i=0;i<=steps;i++){
    const t=i/steps,x=ta[0]+(tz[0]-ta[0])*t,y=ta[1]+(tz[1]-ta[1])*t,w=(.5+width*t)/2.4;
    for(let k=-w;k<=w;k+=.5){
     const X=Math.round(x+px*k),Y=Math.round(y+py*k);
     if(t<.45&&(X+Y)%2)continue;
     (back&&dir===2&&Y<-8?back:b).set(X,Y,Math.abs(k)>w-.8?SMEAR[0]:t<.45?SMEAR[2]:SMEAR[1],t>.5?1:0);
    }
   }
   return;
  }
  for(let i=0;i<=steps;i++){
   const t=i/steps,hx=a.h[0]+(z.h[0]-a.h[0])*t,hy=a.h[1]+(z.h[1]-a.h[1])*t,ang=aa+da*t;
   const ux=Math.cos(ang),uy=Math.sin(ang),w=.6+width*t;
   for(let r=r1-w;r<=r1;r+=.5){
    const x=Math.round(hx+ux*r),y=Math.round(hy+uy*r);
    if(t<.4&&(x+y)%2)continue;
    b.set(x,y,r>r1-.9?SMEAR[0]:t<.4?SMEAR[2]:SMEAR[1],t>.5?1:0);
   }
  }
 }
 // Heavy blow: the blade bites the ground, a short burst of grit and light.
 function impact(b,x,y){
  x=Math.round(x);y=Math.round(y);
  for(const [dx,dy,c] of [[0,0,3],[1,0,2],[-1,0,2],[0,-1,2],[0,1,2],[2,0,1],[-2,0,1],[0,-2,1],[0,2,0],[3,-1,0],[-3,-1,0],[2,-2,0],[-2,-2,0],[4,1,0],[-4,1,0]])
   b.set(x+dx,y+dy,[SMEAR[2],SMEAR[1],SMEAR[0],STEEL[3]][c],c);
 }

 // ---- Back scabbard and harness, sized to the human torso. ----
 // Hilt over the right shoulder in every view: screen right from the back,
 // screen left from the front, behind the head in profile.
 const sheath={
  0:{w:[6,-13],v:[-8,10]},1:{w:[-6,-17],v:[6,9]},
  2:{w:[-9,-14],v:[8,10]},3:{w:[5,-17],v:[-6,9]}
 };
 // part: 'sheath' (leather body, under the hair) or 'hilt' (guard, grip
 // and pommel standing out of the hair above the shoulder); default both.
 function storagePose(dir){return weapons().storage(wielded,dir);}

 function scabbard(c,dir,part){
  if(customWeapon()){
   const b=buffer();weapons().paintStored(b,wielded,dir);
   b.outline();b.paint(c);return;
  }
  const {w,v}=sheath[dir],[ux,uy]=unit(v[0],v[1]),b=buffer();
  if(part!=='hilt'){
   b.line(w[0],w[1],w[0]+v[0],w[1]+v[1],GRIP[0],1);
   b.set(w[0]+v[0],w[1]+v[1],GOLD[0],2);
  }
  if(part!=='sheath'){
   const nx=-uy,ny=ux;
   b.line(w[0]-nx*2,w[1]-ny*2,w[0]+nx*2,w[1]+ny*2,GOLD[1],3);
   b.line(w[0]-ux,w[1]-uy,w[0]-ux*3,w[1]-uy*3,GRIP[1],3);
   b.set(w[0]-ux*4,w[1]-uy*4,GOLD[1],4);
  }
  b.outline();b.paint(c);
 }
 // Reused by the compositor: draw the complete stored arm at the moving
 // torso anchor before the body/head decide which pixels occlude it.
 function storedFrame(dir,state='sheathed_idle',frame=0){
  const p=pose(state,frame,dir),shift=bodyShift(p.action,dir,p.frame),[cv,c]=canvas80();
  c.translate(40+shift[0],52+shift[1]);scabbard(c,dir);return cv;
 }
 function gear(c,dir){
  // One leather baldric across the real 4px torso, never across the face.
  const b=buffer();
  if(dir===2)b.line(-3,-7,0,-5,GRIP[1],1);
  else if(dir===0)b.line(2,-7,-1,-5,GRIP[1],1);
  else if(dir===1)b.line(0,-7,1,-5,GRIP[1],1);
  else b.line(-1,-7,-2,-5,GRIP[1],1);
  b.paint(c);
 }

 // ---- The NPC's own right hand in the face view (walk swing, recoil). ----
 // Null when too little of it shows; the guard grip is used instead.
 function handPoint(d,o){
  const [x0,x1,y0,y1]=[30,36,43,49];let sx=0,sy=0,n=0;
  const gloves=o&&o.torso!=='fold'?new Set(o.arms.hand.map(c=>parseInt(c,16))):null;
  for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){
   const i=(y*80+x)*4;if(!d[i+3])continue;
   const r=d[i],g=d[i+1],bb=d[i+2];
   if(gloves?gloves.has((r<<16)|(g<<8)|bb):r>=150&&r>g+30&&g>bb){sx+=x;sy+=y;n++;}
  }
  return n>=3?[sx/n-40,sy/n-52]:null;
 }
 // Draw and sheathe: the hand travels between the guard and the scabbard
 // mouth while the blade turns over the shoulder in depth, so its drawn length
 // shrinks while it points at the camera, then grows into the scabbard.
 function weaponBlend(dir,state,frame,hand,shift=[0,0]){
  const custom=customWeapon(),store=custom?storagePose(dir):null;
  const g=custom?weapons().carry(wielded,dir):GUARD[dir],end=custom?{w:store.h,v:store.u}:sheath[dir],[ex,ey]=unit(end.v[0],end.v[1]);
  const total=state==='draw'||state==='draw_walk'?5:6;
  const phase=state.endsWith('_walk')?Math.floor(frame/8):frame;
  const f=Math.max(0,Math.min(1,(phase+1)/total));
  const t=state.startsWith('draw')?1-f:f;
  const mx=end.w[0]-(custom?0:ex)+shift[0],my=end.w[1]-(custom?0:ey)+shift[1];
  const m=Math.min(1,t/.6),r=Math.max(0,Math.min(1,(t-.3)/.7));
  const vx=g.u[0]+(ex-g.u[0])*r,vy=g.u[1]+(ey-g.u[1])*r,projected=custom&&g.profile&&g.scale;
  return {h:[hand[0]+(mx-hand[0])*m,hand[1]+(my-hand[1])*m],u:projected?[vx,vy]:unit(vx,vy),
   length:(projected?1:Math.max(.3,Math.hypot(vx,vy)))*((g.scale||1)+(1-(g.scale||1))*t),t};
 }

 const HAIR_COLORS=Object.freeze(['#2e2029','#523a34','#927052']);
 const HAIR_KEYS=new Set([0x2e2029,0x523a34,0x927052]);
 const rgb=(d,i)=>(d[i]<<16)|(d[i+1]<<8)|d[i+2];
 function pixels(image){return image.getContext('2d',{willReadFrequently:true}).getImageData(0,0,80,80).data;}
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

 function canvas80(){const out=document.createElement('canvas');out.width=80;out.height=80;const c=out.getContext('2d');c.imageSmoothingEnabled=false;return [out,c];}
 // Stack the NPC layers like the composer does, with the baked hands folded
 // into the torso, the head and hair offset, and the harness on the chest.
 function stack(c,L,legs,dir,head=[0,0],hair=[0,0],shift=[0,0],bodyOffset=[0,0]){
  const at=(img,dx,dy)=>c.drawImage(img,dx,dy);
  const [hx,hy]=head,[tx,ty]=[hx+hair[0],hy+hair[1]];
  hairOn(c,L,0,tx,ty,hx,hy);
  if(L.headFirst)at(L.head,hx,hy);
  at(torso(legs,dir,shift[0]),bodyOffset[0],bodyOffset[1]);
  hairOn(c,L,1,tx,ty,hx,hy);
  if(L.hat)at(L.hat[0],hx,hy);
  if(!L.headFirst)at(L.head,hx,hy);
  if(!customWeapon())at(legs.fore,0,0);
  c.save();c.translate(40+shift[0],52+shift[1]);gear(c,dir);c.restore();
  hairOn(c,L,2,tx,ty,hx,hy);
  if(L.hat)at(L.hat[1],hx,hy);
 }
 const paintAt=(c,g)=>{c.save();c.translate(40,52);g.paint(c);c.restore();};
 // Reuse each existing sleeve/hand silhouette as a rigid image. Face/back
 // have two already disconnected arms, profiles have one visible silhouette.
 // No procedural limb, new fist, elbow cut, stretch, rotation or added contour.
 function nativeArmLayers(dir,h,u,shift=[0,0],freeOffset=[0,0],gripSpan){
  const [front,fc]=canvas80(),[back,bc]=canvas80(),w=weapons().get(wielded);
  const view=[2,1,0,3][dir],parts=KALDOR_WEAPON_LIMBS.outfits[worn.outfit][view];
  const mainSide=dir===0?'right':'left',grip=weapons().fitGrip(wielded,dir,h,u,gripSpan);
  parts.forEach((part,i)=>{
   const main=part.side===null||part.side===mainSide;
   const target=main?grip.h:w.hands===2?grip.support:[part.palm[0]+freeOffset[0],part.palm[1]+freeOffset[1]];
   const dx=Math.round(target[0]-part.palm[0]+shift[0]),dy=Math.round(target[1]-part.palm[1]+shift[1]);
   const c=main?fc:bc,e=sheet('native-arm:'+worn.outfit+':'+view+':'+i,part);
   if(e.ready)c.drawImage(e.image,dx,dy);
  });
  return {front,back};
 }
 function attackFrame(dir,frame,combo,swordPose){
  const facing=dir,s=attackSpec(dir,frame,combo);
  dir=s.view??dir;
  const L=layers('idle',dir,0),legs=s.lunge?layers('walk',dir,s.leg||0):L;
  if(!L||!legs)return null;
  const [out,c]=canvas80();
  const u=customWeapon()?s.u:bladeDir(dir,frame,combo,swordPose);
  const sword=buffer(),hands=buffer(),trail=buffer(),behind=buffer();
  let arms=null;
  if(customWeapon()){
   arms=nativeArmLayers(dir,s.h,u,[0,0],s.body||[0,0]);
   paintSword(sword,s.h[0],s.h[1],u[0],u[1],{hands:0,dir});sword.outline();
  }else{
   if(dir===1||dir===3)for(const [sx,sy] of SHOULDERS[dir])arm(s.z?hands:sword,sx,sy,s.h[0],s.h[1]);
   paintSword(sword,s.h[0],s.h[1],u[0],u[1],{hands:0,dir});
   fist(s.z===0?sword:hands,s.h[0],s.h[1]);fist(s.z===0?sword:hands,s.h[0]-u[0]*2,s.h[1]-u[1]*2);
   sword.outline();hands.outline();
  }
  if(customWeapon()){if(frame>=1.25&&frame<4.75)weapons().trail(trail,wielded,facing,frame,combo,behind,wielder);}
  else if(frame===2||frame===3)smear(trail,dir,frame,combo,swordPose,frame===2?4.5:3,behind);
  else if(frame===4)smear(trail,dir,frame,combo,swordPose,1.5,behind);
  if(customWeapon()&&combo===3)weapons().finisherEffects(trail,wielded,facing,frame,behind,wielder);
  else if(combo===3&&frame===3){const reach=3+BLADE;impact(trail,s.h[0]+u[0]*reach,s.h[1]+u[1]*reach);}
  paintAt(c,behind);
  if(s.z!==1){paintAt(c,trail);paintAt(c,sword);}
  if(arms){c.drawImage(arms.back,0,0);if(s.z===0)c.drawImage(arms.front,0,0);}
  stack(c,L,legs,dir,s.head,s.hair,s.body||[0,0],s.body||[0,0]);
  if(s.z===1){paintAt(c,trail);paintAt(c,sword);}
  if(arms&&s.z!==0)c.drawImage(arms.front,0,0);
  paintAt(c,hands);
  return out;
 }
 const BLEND_STATES=new Set(['sheathe','sheathe_walk','draw','draw_walk']);
 // Sword in hand outside attacks, point up. Face and back: the NPC's own right
 // hand holds it. Profile: both hands forward as in the attack guard. Hidden by
 // the body when it is in front of the hero seen from the back, or on its way
 // over the shoulder into the scabbard in the other views.
 function heldSword(dir,state,frame,p,npcPixels,shift){
  const profile=dir===1||dir===3,normal=state==='idle'||state==='walk'||BLEND_STATES.has(state),g=customWeapon()?(normal?weapons().carry(wielded,dir):weapons().guard(wielded,dir)):GUARD[dir];
  // The back view hides the NPC hands under the hair: use the authored grip.
  const hand=(!customWeapon()&&dir===2&&handPoint(npcPixels,outfitData(worn.outfit)))||[g.h[0]+shift[0],g.h[1]+shift[1]];
  const held=BLEND_STATES.has(state)?weaponBlend(dir,state,frame,hand,shift):{h:hand,u:g.u,length:g.scale||1,t:0};
  held.behind=dir===0?held.t<.5:held.t>=(profile?.3:.5);
  const sword=buffer(),hands=buffer(),grip=held.behind&&dir!==2?sword:hands;
  let arms=null;
  if(customWeapon()){
   const h=weapons().fitGrip(wielded,dir,[held.h[0]-shift[0],held.h[1]-shift[1]],held.u,g.span).h;
   held.h=[h[0]+shift[0],h[1]+shift[1]];arms=nativeArmLayers(dir,h,held.u,shift,[0,0],g.span);
  }
  const [hx,hy]=held.h,[ux,uy]=held.u;
  paintSword(sword,hx,hy,ux,uy,{hands:0,blade:BLADE*held.length,dir});
  if(!customWeapon()){
   if(profile){
    for(const [sx,sy] of SHOULDERS[dir])arm(grip,sx+shift[0],sy+shift[1],hx,hy);
    fist(grip,hx,hy);fist(grip,hx-ux*2,hy-uy*2);
   }else fist(grip,hx,hy);
  }
  sword.outline();hands.outline();
  let L=null;
  if(customWeapon())L=layers(p.action,dir,p.frame);
  else if(profile)L=p.action==='carry'?layers('walk',dir,(8-p.frame)%8):layers(p.action,dir,p.frame);

  return {sword,hands,behind:held.behind,L,arms};
 }

 function nativeFrame(dir,state,frame,combo=0,swordPose,swordPainter,flash=false){
  if(!Number.isInteger(dir)||dir<0||dir>3)throw new RangeError('Direction Kaldor: 0..3');
  if(!ready()){if(!loading&&!failed)preload();return null;}
  const aimKey=state==='attack'&&wielder?.attackAim?JSON.stringify(wielder.attackAim):'';
  const key=[aimKey,headId,hairId,wielded,worn.outfit,worn.helmet,worn.previous?.outfit,worn.previous?.helmet,dir,state,frame,combo,!!flash].join(':');
  if(cache.has(key)){
   const value=cache.get(key);cache.delete(key);cache.set(key,value);return value;
  }
  let out;dressArms(outfitData(worn.outfit));
  if(state==='dress'||state==='helm'){
   out=dressFrame(dir,Math.max(0,Math.min(clip(state).durations.length-1,frame|0)),state);
   if(!out)return null;
  }else if(state==='attack'){
   out=attackFrame(dir,Math.max(0,Math.min(5,frame)),combo,swordPose);
   if(!out)return null;
  }else{
   const p=pose(state,frame,dir);if(!p)return null;
   const L=layers(p.action,dir,p.frame);if(!L)return null;
   const npc=human(L);
   let c;[out,c]=canvas80();
   const shift=bodyShift(p.action,dir,p.frame);
   const onBody=paint=>{c.save();c.translate(40+shift[0],52+shift[1]);paint();c.restore();};
   const sheathed=state.startsWith('sheathed_'),stored=sheathed?storedFrame(dir,state,frame):null;
   const npcPixels=pixels(npc);
   const held=sheathed?null:heldSword(dir,state,frame,p,npcPixels,shift);
   if(stored&&dir!==0)c.drawImage(stored,0,0);
   if(held&&held.behind)paintAt(c,held.sword);
   if(held?.arms){c.drawImage(held.arms.back,0,0);if(dir===0)c.drawImage(held.arms.front,0,0);}
   hairTips(c,npcPixels,dir,state,frame,true);
   if(held&&held.L)stack(c,held.L,held.L,dir,[0,0],[0,0],shift);
   else{c.drawImage(npc,0,0);onBody(()=>gear(c,dir));}
   hairTips(c,npcPixels,dir,state,frame,false);
   if(stored&&dir===0)c.drawImage(stored,0,0);
   if(held&&!held.behind)paintAt(c,held.sword);
   if(held)paintAt(c,held.hands);
   if(held?.arms&&dir!==0)c.drawImage(held.arms.front,0,0);
  }
  if(flash){
   const c=out.getContext('2d');
   c.globalCompositeOperation='source-atop';c.fillStyle='#fff0bf';
   c.fillRect(0,0,80,80);c.globalCompositeOperation='source-over';
  }
  cache.set(key,out);while(cache.size>192)cache.delete(cache.keys().next().value);
  return out;
 }
 // Putting an outfit on ('dress'): the old one until the garment is over the
 // head, then the new one. Changing helmets ('helm'): the old helmet until
 // both hands hold the new one at the head. The sword stays on the back.
 function dressFrame(dir,frame,id='dress'){
  const D=OUTFITS()[id],next=outfitData(worn.outfit),before=frame<D.swap&&worn.previous;
  const outfit=id==='dress'&&before&&outfitData(worn.previous.outfit)?worn.previous.outfit:worn.outfit;
  const helmet=id==='helm'&&before?worn.previous.helmet:worn.helmet;
  const L=layers(id,dir,frame,outfit,helmetData(helmet)?helmet:null);if(!L)return null;
  const [out,c]=canvas80(),d=[2,1,0,3][dir],shift=bodyShift(id,dir,frame);
  const onBody=paint=>{c.save();c.translate(40+shift[0],52+shift[1]);paint();c.restore();};
  if(dir!==0)onBody(()=>scabbard(c,dir));
  hairOn(c,L,0);if(L.headFirst)c.drawImage(L.head,0,0);c.drawImage(L.body,0,0);
  hairOn(c,L,1);if(L.hat)c.drawImage(L.hat[0],0,0);if(!L.headFirst)c.drawImage(L.head,0,0);
  onBody(()=>gear(c,dir));hairOn(c,L,2);if(L.hat)c.drawImage(L.hat[1],0,0);
  if(dir===0)onBody(()=>scabbard(c,dir));
  // Raised arms and the garment are in front of the hair.
  if(D.cloth)for(const [x,y,k] of D.cloth[d][frame]){c.fillStyle=k===3?INK:'#'+next.cloth[k];c.fillRect(x,y,1,1);}
  c.drawImage(L.fore,0,0);
  return out;
 }
 const clipMs=id=>clip(id)?.durations.reduce((a,b)=>a+b,0)||0;
 function wear(id){
  if(!outfitData(id))return false;
  if(id!==worn.outfit){worn.previous={outfit:worn.outfit,helmet:worn.helmet};worn.outfit=id;}
  return true;
 }
 // null takes the helmet off.
 function wearHelmet(id){
  if(id!==null&&!helmetData(id))return false;
  if(id!==worn.helmet){worn.previous={outfit:worn.outfit,helmet:worn.helmet};worn.helmet=id;}
  return true;
 }
 // Engine hook: the dressing pose (dress or helm clip) replaces idle while it
 // plays; moving, fighting or being hit ends it at once.
 function dressLook(actor,time){
  const d=actor?.dressing;if(!d)return null;
  const t=time-d.t0,id=d.clip==='helm'?'helm':'dress';
  if(actor.moving||actor.attack>0||actor.dash>0||actor.hurt>0||actor.guard||actor.melee>0||t<0||t*1000>=clipMs(id)){actor.dressing=null;return null;}
  return {state:id,frame:frameAt(id,t)};
 }
 // Kaldor in any outfit and helmet, for menus: portrait('id') or
 // portrait({outfit, helmet}); a bare id shows the outfit without helmet.
 function portrait(look,dir=2,state='sheathed_idle',frame=0){
  const keep={...worn};
  if(typeof look==='string')look={outfit:look,helmet:null};
  worn.outfit=look.outfit||worn.outfit;worn.helmet=look.helmet===undefined?worn.helmet:look.helmet;worn.previous=null;
  try{return nativeFrame(dir,state,frame);}finally{Object.assign(worn,keep);}
 }
 // Kaldor's bare head and mane at rest, seen from the front ("no helmet").
 function bareHead(){
  const key='head:'+worn.outfit;if(layerCache.has(key))return layerCache.get(key);
  const L=layers('idle',2,0,worn.outfit,null);if(!L)return null;
  const [out,c]=canvas80();c.drawImage(L.hair[0],0,0);c.drawImage(L.head,0,0);c.drawImage(L.hair[1],0,0);c.drawImage(L.hair[2],0,0);
  layerCache.set(key,out);return out;
 }
 // Kaldor bareheaded in an outfit, at rest and seen from the front (wardrobe icon).
 function figure(id){
  const key='figure:'+id;if(layerCache.has(key))return layerCache.get(key);
  const L=layers('idle',2,0,id,null);if(!L)return null;
  const out=human(L);layerCache.set(key,out);return out;
 }
 // Mannequin pieces. Outfit (stand sheet): 0 the garment without legs, 1 its
 // boots. Helmet: its nape and helmet planes at rest, seen from the front.
 function garment(id,part=0){
  const key='stand:'+id+':'+part;if(layerCache.has(key))return layerCache.get(key);
  const o=outfitData(id),h=!o&&helmetData(id),e=o?sheetsOf(o).stand:h&&helmetSheet(h);if(!e?.ready)return null;
  const cv=document.createElement('canvas');cv.width=cv.height=80;
  const c=cv.getContext('2d'),put=(asset,i)=>c.drawImage(e.image,(asset.tiles[i]%16)*48,Math.floor(asset.tiles[i]/16)*48,48,48,16,16,48,48);
  if(o)put(o.stand,part);
  else for(const p of [0,1])put(h.asset,p*h.count+h.frames.idle[0]);
  layerCache.set(key,cv);return cv;
 }
 // Human fighters reuse intact garment/hand layers, with their own existing
 // modular head and hair. Scoped selection never changes Kaldor's equipment.
 function npcFrame(actor,state,frame,weapon,swordPose){
  if(!weapons()?.has(weapon)||!ready())return null;
  const saved={...worn},oldWeapon=wielded,oldWielder=wielder,oldHead=headId,oldHair=hairId;
  let seed=0;for(const c of String(actor.id||''))seed=(Math.imul(seed,31)+c.charCodeAt(0))>>>0;
  try{
   headId='masculin-'+['adulte','mur','age'][seed%3];hairId='masculin-hair-'+['01','02','05','09'][(seed>>>3)%4];
   worn.outfit=actor.kind==='bandit'?'cuir-traqueur':actor.convoyGuard?'brigandine-mercenaire':'cotte-mailles';worn.helmet=null;worn.previous=null;wielded=weapon;wielder=null;
   return nativeFrame(actor.dir??2,state,frame,actor.combo||0,swordPose);
  }finally{Object.assign(worn,saved);wielded=oldWeapon;wielder=oldWielder;headId=oldHead;hairId=oldHair;}
 }
 function clear(){cache.clear();layerCache.clear();shiftCache.clear();}
 // Grip and blade direction actually drawn, exposed for regression tests.
 function attackPose(dir,frame,combo,swordPose){
  const s=attackSpec(dir,frame,combo);
  return {hand:[...s.h],blade:bladeDir(dir,frame,combo,swordPose),front:s.z!==0};
 }
 return Object.freeze({version:5,appearance,anchor:foot,
  preload,ready,frameAt,gaitFrame,remap,pose,nativeFrame,npcFrame,attackPose,nativeArmLayers,storagePose,storedFrame,clear,wield,weapon:()=>wielded,
  wear,wearHelmet,dressLook,portrait,garment,bareHead,figure,dressDuration:(id='dress')=>clipMs(id)/1000,
  outfit:()=>worn.outfit,helmet:()=>worn.helmet,
  outfits:()=>Object.values(OUTFITS()?.outfits||{}).map(({id,label,warmth,description,place,cloth})=>({id,label,warmth,description,place,cloth})),
  helmets:()=>Object.values(OUTFITS()?.helmets||{}).map(({id,label,warmth,description,place,closed})=>({id,label,warmth,description,place,closed})),
  stats:()=>({ready:loaded,failed,loading:!!loading,frames:cache.size})
 });
});
