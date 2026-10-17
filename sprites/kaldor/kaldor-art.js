/* Hearthreaver — Kaldor, barbarian hero, authored pixel art v2.
 * All pixels are drawn in JavaScript, without a bitmap dependency.
 * Drop-in for CharacterAtlas(kind='hero'); four independent facing silhouettes,
 * head/torso/leg/arm posing, four attack combos and world-aligned blade smears.
 * Visuals ONLY: the game's combo windows, range, collisions, physics, and
 * stun/guard/dash timing remain under the original combat engine.
 * Native engine cell 80×80; feet at (40,52); no pixel rescaling or smoothing.
 */
(function(root,factory){
 'use strict';
 const art=factory();
 if(typeof module==='object'&&module.exports)module.exports=art;
 root.HearthreaverKaldorArt=art;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const CELL=80, ANCHOR=Object.freeze({x:40,y:52});
 const DIRECTIONS=Object.freeze(['dos','droite','face','gauche']);
 const STATES=Object.freeze({idle:4,walk:6,attack:6,guard:6,dash:4,hurt:4,use:6,melee:6});
 const PALETTE=Object.freeze({
  '.':null, O:'#100e20',K:'#282431',n:'#383649',H:'#53566d',L:'#74768b',
  s:'#75452d',m:'#ac663d',a:'#d28b56',h:'#e8ab71',i:'#f3c994',
  t:'#4e332a',u:'#785038',U:'#a27550',
  v:'#652f30',r:'#93463a',R:'#bd6751',
  f:'#8b612f',F:'#bb8d45',Y:'#e2b55f',Z:'#f4d287',
  1:'#3b4551',2:'#728396',3:'#aab9c8',4:'#e8edf0',
  e:'#66899e',E:'#c8dce5'
 });
 // Carefully painted 16/18-pixel silhouettes; each view has its own lighting.
 // Head is at -21..-12; torso -12..-6; legs -6..0.
 const PARTS={
  face:{
   head:[
    '.....OOOOOO.....',
    '...OOKKKKKKOO...',
    '..OKKHKKKKKKKO..',
    '.OKHnnnKnnnnKO..',
    'OKnKOhOOOOhOKKO.',
    'OKnOmhOaOhaOnKO.',
    'OKKmahmmhmmhKKO.',
    '.OKmahhimhaaKO..',
    '..OKmaaaaamKO...',
    '...OOKOOOOOKO...'
   
   ],
   chest:[
    '....OaahiiaO....',
    '..OmahhiihhaamO.',
    '.OmahhhaUahhhaO.',
    '.OmahmmuUhhhaaO.',
    '..OmmhmaRamahmO.',
    '...OaamrrmaO....',
    '....OuuUUuO.....'
   ],
   waist:[
    '.....OtUtO......',
    '....OYYFYFO.....',
    '....OFRRfO......'
   ]
  },
  dos:{
   head:[
    '.....OOOOOO.....',
    '...OOKKKKKKOO...',
    '..OKKHKKKKKKKO..',
    '.OKHnnnnnKKKHO..',
    'OKnKKKKKKKKKnnO.',
    'OKnKKKHHKKKKnnO.',
    'OKnKKKnnKKKKnnO.',
    '.OKnKKKnnKKKnO..',
    '..OKnKKKnnKKO...',
    '...OOKOOOOOKO...'
   
   ],
   chest:[
    '....OaahmhaO....',
    '..OmmhaaUhhammO.',
    '.OmmhaaUhhammO..',
    '.OmmhaaUhhammO..',
    '..OmmmaUammmO...',
    '...OummrmmmO....',
    '....OuuUuuO.....'
   ],
   waist:[
    '.....OtUtO......',
    '....OffffFO.....',
    '....OFRRfO......'
   ]
  },
  droite:{
   head:[
    '....OOOOOO......',
    '..OOKKKKKKOO....',
    '.OKHnKKKKKKKO...',
    'OKHnnnKKKKKKO...',
    'OKnKKKKKOOhhKO..',
    'OKnKKKKOahhKO...',
    'OKnKKKmahhiOO...',
    '.OKnnmahhaaaO...',
    '..OKnmaaaaO.....',
    '...OOKOOOOO.....'
   
   ],
   chest:[
    '.....OaahhO.....',
    '...OmaahhhaO....',
    '...OmahUhhhO....',
    '....OmhUahhO....',
    '....OmmRhmO.....',
    '.....OmrrmO.....',
    '.....OuUUuO.....'
   ],
   waist:[
    '.....OtUtO......',
    '.....OYFfO......',
    '.....OFRfO......'
   ]
  },
  gauche:{
   head:[
    '......OOOOOO....',
    '....OOKKKKKKOO..',
    '...OKKKKKKKnKO..',
    '...OKKKKKKnnnHO.',
    '..OKhhOOKKKKKnO.',
    '...OKhmOaOKKKnO.',
    '..OOihhamKKKKnO.',
    '...OaaahmmKKnO..',
    '.....OaaaamKnO..',
    '.....OOOOOKOO...'
   
   ],
   chest:[
    '.....OahhmO.....',
    '....OahhhamO....',
    '....OahhUhmO....',
    '....OhhaUhmO....',
    '.....OmmRmmO....',
    '.....OmrrmO.....',
    '.....OuUUuO.....'
   ],
   waist:[
    '......OtUtO.....',
    '......OfFYO.....',
    '......OfRFO.....'
   ]
  }
 };
 // Sprite-painted boots/legs, at offsets relative to foot (0,0), not a moving anchor.
 const FEET={
  face:[[-5,0],[5,-1]],dos:[[-4,0],[4,-1]],
  droite:[[0,0],[3,-1]],gauche:[[-3,-1],[0,0]]
 };
 function assert(cond,msg){if(!cond)throw new Error('Kaldor Art: '+msg);}
 for(const [view,groups] of Object.entries(PARTS))for(const [part,rows]of Object.entries(groups)){
  const width=rows[0].length;
  for(const row of rows){assert(row.length===width,view+'/'+part+' row '+row.length+' ≠ '+width);
   for(const key of row)assert(Object.hasOwn(PALETTE,key),view+'/'+part+' invalid pixel '+key);
  }
 }
 const coord=(x,y)=>Math.round(x)+','+Math.round(y);
 function put(map,x,y,key){if(key!=='.'&&Object.hasOwn(PALETTE,key))map.set(coord(x,y),key);}
 function stamp(map,rows,x,y){rows.forEach((r,j)=>{for(let i=0;i<r.length;i++)put(map,x+i,y+j,r[i]);});}
 function border(layer){const outline=new Map();for(const [at,k] of layer){const [x,y]=at.split(',').map(Number); for(const [dx,dy]of [[-1,0],[0,-1],[1,0],[0,1]]){const n=coord(x+dx,y+dy);if(!layer.has(n))outline.set(n,'O');}}
  return outline;}
 function merge(target,layer,outline=false){if(outline)for(const [p,k]of border(layer))target.set(p,k);for(const [p,k]of layer)target.set(p,k);}
 function pixelLine(map,a,b,key,thickness=1){const steps=Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])*3);for(let i=0;i<=steps;i++){const t=i/Math.max(steps,1),x=Math.round(a[0]+(b[0]-a[0])*t),y=Math.round(a[1]+(b[1]-a[1])*t);for(let j=0;j<thickness;j++)put(map,x+(j===0?0:1),y+(j===2?1:0),key);}}
 function limb(target,a,b,shade){const layer=new Map();pixelLine(layer,a,b,shade,2);merge(target,layer,true);}
 function fist(target,at,shade){const layer=new Map(),x=Math.round(at[0]),y=Math.round(at[1]);for(let yy=0;yy<2;yy++)for(let xx=0;xx<3;xx++)put(layer,x+xx-1,y+yy-1,xx===2||yy===1?'m':shade);merge(target,layer,true);}
 function shift(map,dx,dy){if(!dx&&!dy)return map;const next=new Map();for(const [p,c]of map){const [x,y]=p.split(',').map(Number);next.set(coord(x+dx,y+dy),c);}return next;}
 function feet(target,dir,state,f){const move=state==='walk',dash=state==='dash',guard=state==='guard',atk=state==='attack',lunge=atk&&f>=2&&f<=4;
   const facing=dir===1?1:dir===3?-1:0;
   const stride=move?[0,1,1,0,-1,-1][f%6]:dash?2:lunge?1:0;
   const feet=FEET[DIRECTIONS[dir]],layer=new Map();
   feet.forEach(([bx,by],i)=>{
     const x=bx+stride*(i===0?1:-1)*(facing||1), lift=move?[0,1,0,0,1,0][(f+i*3)%6]:0, y=by-lift;
     // calves, fur-wrap and defined leather boots
     const jointX=dir===1?x-1:dir===3?x+1:x+(i===0?1:-1);
     pixelLine(layer,[jointX,-6],[x,-3+y],i===0?'u':'t',2);
     for(let k=-1;k<=1;k++)put(layer,x+k,-3+y,k===-1?'u':'f');
     for(let k=-2;k<=2;k++)put(layer,x+k,y,k===-2?'O':k>=1?'t':'u');
     put(layer,x-2,y,'O');put(layer,x+2,y,'O');
   });
   merge(target,layer,true);
 }
 // Frame-specific shoulder/head spacing: a few pixels, no elastic scale effects.
 function offsets(state,f,combo,dir){
   const walk=state==='walk',attack=state==='attack';
   const step=walk?[0,1,0,0,1,0][f%6]:0;
   const anticipation=attack?[0,-1,-1,0,0,0][f%6]:0;
   const impact=attack&&combo===3&&[3,4].includes(f)?1:0;
   const hurt=state==='hurt'&&f<2?1:0;
   const breathing=state==='idle'&&f===1?-1:0;
   const lunge=attack&&f>=2&&f<=4;
   const push=(dir===1?1:dir===3?-1:0)*(lunge?1:0);
   return {torsoX:push,torsoY:step+impact+hurt+breathing,
    headX:push+(state==='walk'?[-1,0,1,0,-1,0][f%6]:0)+(state==='hurt'&&f===1?(dir===3?-1:1):0),
    headY:step+impact+hurt+breathing+anticipation+(attack&&f>=3&&f<=4?1:0)};
 }
 function drawTorso(target,dir,o,state,f){const part=PARTS[DIRECTIONS[dir]],tmp=new Map();stamp(tmp,part.chest,-Math.floor(part.chest[0].length/2)+o.torsoX,-12+o.torsoY);stamp(tmp,part.waist,-Math.floor(part.waist[0].length/2)+o.torsoX,-5+o.torsoY);
   if(state==='walk'&&f===3)put(tmp,-3+o.torsoX,-9+o.torsoY,'h');
   merge(target,tmp,false);
 }
 function drawHead(target,dir,o,state,f){const rows=PARTS[DIRECTIONS[dir]].head; const tmp=new Map();stamp(tmp,rows,-Math.floor(rows[0].length/2)+o.headX,-21+o.headY);
   if(state==='idle'&&f===3&&dir===2){ // blink, no eyelash styling
     for(const [x,y] of [[-3,-17],[3,-17]])put(tmp,x+o.headX,y+o.headY,'s');
   }
   merge(target,tmp,false);
 }
 function posesFor(dir,state,f,combo,swordPose){const d=dir,front=d===2,back=d===0,east=d===1,west=d===3;
   const facing=west?-1:1;
   // The attack pose comes from the game's EXACT hurt-box source (no retiming).
   if(state==='attack'){
     const a=swordPose(d,Math.min(f,5),combo),v=[a[2],a[3]];
     return {w:[a[0],a[1]],v,attack:true};
   }
   if(state==='guard'){const w=front?[-3,-13]:back?[3,-15]:[facing*8,-13],v=front?[13,-8]:back?[-12,-8]:[facing*15,-6];return {w,v};}
   if(state==='use'){const w=front?[4,-7]:back?[4,-10]:[facing*6,-8];return {w,v:[facing*12,-12]};}
   const walking=state==='walk';
   const jog=walking?[0,-1,-2,0,1,2][f%6]:0;
   const hurt=state==='hurt'&&f<2?-2:0;
   // sword is held off the right shoulder or out from side profile; elbows share the hilt
   if(front) return {w:[6+jog/2,-11+jog/3+hurt],v:[14,-11]};
   if(back) return {w:[5+jog/2,-13+jog/3+hurt],v:[13,-12]};
   return {w:[facing*(7+jog/3),-11+jog/3+hurt],v:[facing*16,-11]};
 }
 function actionArms(target,dir,state,f,combo,pose,o){
   const side=dir===1||dir===3,west=dir===3,back=dir===0;
   const shoulderR=side?[west?-4:4,-10+o.torsoY]:[4+o.torsoX,-10+o.torsoY];
   const shoulderL=side?[west?1:-1,-10+o.torsoY]:[-4+o.torsoX,-10+o.torsoY];
   const len=Math.max(1,Math.hypot(...pose.v)),unit=[pose.v[0]/len,pose.v[1]/len];
   const w=pose.w,off=[w[0]-unit[0]*3,w[1]-unit[1]*3];
   // Support hand and blade hand both grip same handle for every attack frame.
   const backLayer=new Map(),frontLayer=new Map();
   limb(backLayer,shoulderL,off,back?'s':'m');fist(backLayer,off,back?'s':'a');
   limb(frontLayer,shoulderR,w,back?'m':'a');fist(frontLayer,w,back?'m':'h');
   return {back:backLayer,front:frontLayer};
 }
 function sword(target,pose){const {w,v}=pose,layer=new Map(),len=Math.max(1,Math.hypot(...v)),ux=v[0]/len,uy=v[1]/len,nx=-uy,ny=ux;
   const pt=(t,side=0)=>[w[0]+ux*t+nx*side,w[1]+uy*t+ny*side];
   // pommel, binding, hilt, two-pixel thick crossguard
   for(let t=-5;t<=2;t+=.75){const [x,y]=pt(t);put(layer,x,y,t<-4?'Z':'u');}
   for(let i=-4;i<=1;i+=2){const [x,y]=pt(i,1);put(layer,x,y,'U');}
   for(let side=-3;side<=3;side++){const [x,y]=pt(3,side);put(layer,x,y,Math.abs(side)===3?'Y':side<0?'F':'f');}
   // continuous blade (not hard-snapped to 8 angles), base with blue-gray shadow and bright screen-left highlight.
   for(let t=4;t<len;t+=.5){const [x,y]=pt(t);put(layer,x,y,t>len-3?'4':'3');if(t<len-1){const [sx,sy]=pt(t,1);put(layer,sx,sy,'2');}}
   const [px,py]=pt(len);put(layer,px,py,'4');
   merge(target,layer,true);
 }
 function smear(target,a,b,dir,f,combo){
   const A={w:[a[0],a[1]],v:[a[2],a[3]]},B={w:[b[0],b[1]],v:[b[2],b[3]]};
   const A0=Math.atan2(A.v[1],A.v[0]),A1=Math.atan2(B.v[1],B.v[0]);let delta=A1-A0;while(delta>Math.PI)delta-=Math.PI*2;while(delta<-Math.PI)delta+=Math.PI*2;
   const lenA=Math.hypot(...A.v),lenB=Math.hypot(...B.v),dense=combo===3?32:25;
   for(let i=0;i<=dense;i++){
     const t=i/dense,phi=A0+delta*t,len=lenA+(lenB-lenA)*t;
     const mx=A.w[0]+(B.w[0]-A.w[0])*t,my=A.w[1]+(B.w[1]-A.w[1])*t;
     for(let r=len*.65;r<=len;r+=.8){
       const x=Math.round(mx+Math.cos(phi)*r),y=Math.round(my+Math.sin(phi)*r);
       if(i<dense*.18&&((x+y)&1))continue;
       if((r/len)<.78&&((x+y+f)&1))continue;
       const shade=r>len*.92?'E':t>.5?'e':'2';
       put(target,x,y,shade);
     }
   }
   // A near-straight heavy overhead strike has little angular change:
   // keep a narrow parallel afterimage rather than a fictitious wide fan.
   if(Math.abs(delta)<.24){
     const vx=B.v[0]/Math.max(.001,lenB),vy=B.v[1]/Math.max(.001,lenB);
     const side=(dir===0||dir===1)?1:-1;
     for(let r=lenB*.72;r<=lenB;r+=1.2){
       const x=B.w[0]+vx*r-vy*side*3,y=B.w[1]+vy*r+vx*side*3;
       put(target,x,y,r>lenB*.88?'E':'e');
     }
   }
 }
 function renderPixelMap(dir,state,frame,combo,poseFn){
   assert(Number.isInteger(dir)&&dir>=0&&dir<4,'direction must be 0..3');
   assert(Object.hasOwn(STATES,state),'unknown animation '+state);
   assert(Number.isInteger(frame)&&frame>=0&&frame<STATES[state],'invalid frame '+frame);
   assert(Number.isInteger(combo)&&combo>=0&&combo<=3,'combo must be 0..3');
   const pose=simplePoseGuard(poseFn,dir,state,frame,combo),
    offs=offsets(state,frame,combo,dir),arms=actionArms(null,dir,state,frame,combo,pose,offs),
    body=new Map(),img=new Map();
   feet(body,dir,state,frame);
   drawTorso(body,dir,offs,state,frame);
   drawHead(body,dir,offs,state,frame);
   // Rear-facing : blade and hands behind the hair and back; other directions use geometry for occlusion.
   const behind=dir===0 || (dir===1&&pose.v[0]<-5) || (dir===3&&pose.v[0]>5) || (state==='attack'&&pose.v[1]<-16);
   // Let trailing sword smear live behind main body. Do not shade other actors or move the hitbox.
   if(state==='attack'&&(frame===2||frame===3)){
     const p=poseFn(dir,frame,combo),prev=poseFn(dir,frame-1,combo);
     smear(img,prev,p,dir,frame,combo);
   }
   merge(img,arms.back);
   if(behind)sword(img,pose);
   merge(img,body);
   merge(img,arms.front);
   if(!behind)sword(img,pose);
   return img;
 }
 function simplePoseGuard(fn,dir,state,frame,combo){
   assert(typeof fn==='function','game swordPose(dir,frame,combo) callback missing');
   const pose=posesFor(dir,state,frame,combo,fn);
   assert([...pose.w,...pose.v].every(Number.isFinite),'nonfinite sword pose');
   return pose;
 }
 function draw(context,dir=2,state='idle',frame=0,combo=0,poseFn){
   const pixels=renderPixelMap(dir,state,frame,combo,poseFn);
   for(const [xy,k]of pixels){const color=PALETTE[k];if(!color)continue;
    const comma=xy.indexOf(','),x=+xy.slice(0,comma),y=+xy.slice(comma+1);
    context.fillStyle=color;context.fillRect(x,y,1,1);
   }
 }
 function raster(opts={}){
   const {dir=2,state='idle',frame=0,combo=0,swordPose}=opts;
   const pixels=renderPixelMap(dir,state,frame,combo,swordPose);
   const data=new Uint8ClampedArray(CELL*CELL*4);
   for(const [xy,key]of pixels){const comma=xy.indexOf(','),x=+xy.slice(0,comma),y=+xy.slice(comma+1);
    const X=ANCHOR.x+x,Y=ANCHOR.y+y;
    if(X<0||X>=CELL||Y<0||Y>=CELL)continue;
    const hex=PALETTE[key];if(!hex)continue;
    const i=(Y*CELL+X)*4;data[i]=parseInt(hex.slice(1,3),16);data[i+1]=parseInt(hex.slice(3,5),16);data[i+2]=parseInt(hex.slice(5,7),16);data[i+3]=255;
   }
   return {width:CELL,height:CELL,anchor:ANCHOR,data};
 }
 function idleFrame(seconds){return [0,0,1,0,0,3,0,0][Math.floor(Math.max(0,seconds)*2)%8];}
 return Object.freeze({version:2,cell:CELL,anchor:ANCHOR,palette:PALETTE,parts:PARTS,directions:DIRECTIONS,states:STATES,draw,raster,idleFrame});
});
