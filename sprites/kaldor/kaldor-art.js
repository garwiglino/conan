/* Hearthreaver — Kaldor, long-haired barbarian hero, authored pixel art v3.
 * All pixels are drawn in JavaScript, without a bitmap dependency.
 * Drop-in for CharacterAtlas(kind='hero'); four independent facing silhouettes,
 * head/torso/leg/arm posing, four attack combos and world-aligned blade smears.
 * Player combat timing, hit/stun/guard/dash rules and animation momentum are
 * unchanged. Rendered blade and its actual collision sweep share one swordPose.
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
 const STATES=Object.freeze({idle:4,walk:6,attack:6,guard:6,dash:4,hurt:4,use:6,melee:6,
   sheathe:6,sheathe_walk:36,sheathed_idle:4,sheathed_walk:6,sheathed_dash:4,sheathed_hurt:4,sheathed_use:6,sheathed_melee:6,draw:5,draw_walk:30});
 const HOLSTER=Object.freeze({delay:3.7,stow:0.33,draw:0.21});
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
 function feet(target,dir,state,f){
   const move=state==='walk',dash=state==='dash',guard=state==='guard',atk=state==='attack',lunge=atk&&f>=2&&f<=4;
   const facing=dir===1?1:dir===3?-1:0;
   const stride=move?[0,2,3,0,-2,-3][f%6]:dash?2:lunge?1:0;
   const bases=FEET[DIRECTIONS[dir]],layer=new Map();
   bases.forEach(([bx,by],i)=>{
     const x=bx+stride*(i===0?1:-1)*(facing||1),lift=move?[0,0,2,0,0,2][(f+(i?3:0))%6]:0;
     const y=by-lift;
     // Knee articulation carries the gait. Head/torso heights never oscillate.
     const kneeX=Math.round((x+bx)/2)+(dir===1?-1:dir===3?1:i===0?1:-1),kneeY=-5+(move&&lift?1:0);
     pixelLine(layer,[i?2:-2,-5],[kneeX,kneeY],i===0?'u':'t',2);
     pixelLine(layer,[kneeX,kneeY],[x,-2+y],i===0?'u':'t',2);
     for(let k=-1;k<=1;k++)put(layer,x+k,-3+y,k===-1?'u':'f');
     for(let k=-2;k<=2;k++)put(layer,x+k,y,k===-2?'O':k>=1?'t':'u');
     put(layer,x-2,y,'O');put(layer,x+2,y,'O');
   });
   merge(target,layer,true);
 }
 // Weight shifts at the hips, never by bouncing the neck/skull. Shoulder recovery
 // is tiny; foot lift and hair tips communicate motion instead of bobbing eyes.
 function offsets(state,f,combo,dir){
   const attack=state==='attack',anticipation=attack?[0,-1,-1,0,0,0][f%6]:0;
   const hurt=state==='hurt'&&f<2?1:0;
   const impact=attack&&combo===3&&[3,4].includes(f)?1:0;
   const lunge=attack&&f>=2&&f<=4;
   const push=(dir===1?1:dir===3?-1:0)*(lunge?1:0);
   const twist=state==='walk'?[0,0,1,0,0,-1][f%6]:0;
   return {torsoX:push+twist,torsoY:impact+hurt,
    headX:push+(state==='hurt'&&f===1?(dir===3?-1:1):0),
    headY:impact+hurt+anticipation+(attack&&f>=3&&f<=4?1:0)};
 }
 function drawTorso(target,dir,o,state,f){const part=PARTS[DIRECTIONS[dir]],tmp=new Map();stamp(tmp,part.chest,-Math.floor(part.chest[0].length/2)+o.torsoX,-12+o.torsoY);stamp(tmp,part.waist,-Math.floor(part.waist[0].length/2)+o.torsoX,-5+o.torsoY);
   if(state==='walk'&&f===3)put(tmp,-3+o.torsoX,-9+o.torsoY,'h');
   merge(target,tmp,false);
 }
 // Thick, irregular, shoulder-length hair designed individually for each view.
 // Animated ends lag behind the stride and the blow while skull pixels stay put.
 const HAIR={
  face:[
   [[-7,-17],[-8,-12],[-8,-7]],[[-5,-16],[-7,-10],[-6,-6]],
   [[7,-17],[8,-12],[8,-8]],[[5,-16],[7,-10],[6,-6]]
  ],
  dos:[
   [[-6,-18],[-7,-13],[-7,-7]],[[-4,-18],[-5,-11],[-5,-5]],
   [[-1,-18],[-2,-11],[-1,-6]],[[2,-18],[3,-11],[2,-5]],
   [[5,-18],[6,-12],[7,-7]]
  ],
  droite:[
   [[-7,-18],[-8,-13],[-7,-7]],[[-5,-17],[-6,-11],[-5,-5]],
   [[-3,-17],[-4,-12],[-4,-7]],[[5,-15],[6,-12],[6,-10]]
  ],
  gauche:[
   [[7,-18],[8,-13],[8,-7]],[[5,-17],[6,-11],[5,-5]],
   [[3,-17],[4,-12],[4,-7]],[[-5,-15],[-6,-12],[-6,-10]]
  ]
 };
 function drawLongHair(target,dir,o,state,f){
   const rear=DIRECTIONS[dir]==='dos',move=state==='walk',att=state==='attack';
   const tipMotion=move?[0,0,1,1,0,-1][f%6]:att?[0,-1,-1,0,1,1][f%6]:state==='idle'?[0,1,0,-1][f%4]:0;
   const leftLit=dir===2||dir===0||dir===3;
   const layer=new Map();
   for(let i=0;i<HAIR[DIRECTIONS[dir]].length;i++){
     const [a,b,c]=HAIR[DIRECTIONS[dir]][i];
     const sway=tipMotion*(i%2?1:-1),x=o.headX,y=o.headY;
     const start=[a[0]+x,a[1]+y],mid=[b[0]+x,b[1]+y],end=[c[0]+x+sway,c[1]+y];
     pixelLine(layer,start,mid,i%2?'n':'K',2);
     pixelLine(layer,mid,end,i%2?'n':'K',2);
     // Controlled one-pixel glints: never add non-palette anti-aliasing.
     const shade=rear?(i%2?'H':'n'):(leftLit&&i%2===0?'H':'n');
     pixelLine(layer,[start[0],start[1]+1],[mid[0],mid[1]],shade,1);
     if(i%2===0)put(layer,end[0],end[1]-1,'K');
   }
   merge(target,layer,true);
 }
 function drawHead(target,dir,o,state,f){
   const rows=PARTS[DIRECTIONS[dir]].head, tmp=new Map();
   drawLongHair(tmp,dir,o,state,f);
   stamp(tmp,rows,-Math.floor(rows[0].length/2)+o.headX,-21+o.headY);
   if(state==='idle'&&f===3&&dir===2){
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
 const SHEATH={
  0:{w:[8,-20],v:[-11,14]},1:{w:[-8,-20],v:[3,15]},
  2:{w:[8,-20],v:[-10,15]},3:{w:[8,-20],v:[-3,15]}
 };
 function ease(t){t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);}
 function weaponBlend(a,b,t){
  const w=[a.w[0]+(b.w[0]-a.w[0])*t,a.w[1]+(b.w[1]-a.w[1])*t];
  const aa=Math.atan2(a.v[1],a.v[0]),bb=Math.atan2(b.v[1],b.v[0]);
  let da=bb-aa;while(da>Math.PI)da-=2*Math.PI;while(da<-Math.PI)da+=2*Math.PI;
  const angle=aa+da*t,len=Math.hypot(...a.v)*(1-t)+Math.hypot(...b.v)*t;
  return {w,v:[Math.cos(angle)*len,Math.sin(angle)*len]};
 }
 function storedSword(target,dir,f=0,walk=false){
   const p=SHEATH[dir],layer=new Map(),shift=walk?[0,0,1,1,0,-1][f%6]:[0,0,0,0,0,0][f%6];
   const w=[p.w[0]+(dir===0?shift:0),p.w[1]],v=p.v;
   const len=Math.hypot(...v),u=[v[0]/len,v[1]/len],normal=[-u[1],u[0]];
   const point=(r,side=0)=>[w[0]+u[0]*r+normal[0]*side,w[1]+u[1]*r+normal[1]*side];
   // Scabbard has a dark leather core, bright rim, brass throat and tip.
   const a=point(3),tip=point(len);
   pixelLine(layer,a,tip,'O',3);
   const mid0=point(4,-1),mid1=point(len-2,-1);pixelLine(layer,mid0,mid1,'u',1);
   const rim0=point(4,1),rim1=point(len-3,1);pixelLine(layer,rim0,rim1,'t',1);
   for(let side=-3;side<=3;side++){const [x,y]=point(3,side);put(layer,x,y,Math.abs(side)===3?'F':'Y');}
   const h0=point(2),h1=point(-4);pixelLine(layer,h0,h1,'u',2);
   const [pomX,pomY]=point(-5);put(layer,pomX,pomY,'Z');put(layer,pomX+1,pomY,'O');
   put(layer,...point(len),'Y');
   merge(target,layer,true);
 }
 function relaxedArms(dir,state,f,o){
   const gait=state==='walk'?[0,1,2,0,-1,-2][f%6]:[0,0,0,0,0,0][f%6];
   const front=new Map(),back=new Map(),r=dir===3?-1:1;
   const arms=dir===2?[
     {a:[-5+o.torsoX,-10+o.torsoY],b:[-7-gait,-6],shade:'m'},
     {a:[5+o.torsoX,-10+o.torsoY],b:[7+gait,-6],shade:'a'}
   ]:dir===0?[
     {a:[-5+o.torsoX,-10+o.torsoY],b:[-6+gait,-6],shade:'s'},
     {a:[5+o.torsoX,-10+o.torsoY],b:[6-gait,-6],shade:'m'}
   ]:[
     {a:[-3*r+o.torsoX,-10+o.torsoY],b:[-5*r-gait*r,-6],shade:'m'},
     {a:[3*r+o.torsoX,-10+o.torsoY],b:[5*r+gait*r,-6],shade:'a'}
   ];
   arms.forEach((el,i)=>{const layer=i?front:back;const elbow=[Math.round((el.a[0]+el.b[0])/2)+(i?r:-r),Math.round((el.a[1]+el.b[1])/2)];
     limb(layer,el.a,elbow,el.shade);limb(layer,elbow,el.b,el.shade);fist(layer,el.b,el.shade);});
   return {front,back};
 }
 function normalizeState(state,frame){
   if(state==='sheathed_idle')return {loc:'idle',f:frame,mode:'sheathed',phase:0};
   if(state==='sheathed_walk')return {loc:'walk',f:frame,mode:'sheathed',phase:0};
   if(state==='sheathed_dash')return {loc:'dash',f:frame,mode:'sheathed',phase:0};
   if(state==='sheathed_hurt')return {loc:'hurt',f:frame,mode:'sheathed',phase:0};
   if(state==='sheathed_use')return {loc:'use',f:frame,mode:'sheathed',phase:0};
   if(state==='sheathed_melee')return {loc:'melee',f:frame,mode:'sheathed',phase:0};
   if(state==='sheathe_walk'||state==='draw_walk')return {loc:'walk',f:frame%6,mode:state.startsWith('sheathe')?'stowing':'drawing',phase:Math.floor(frame/6)};
   if(state==='sheathe'||state==='draw')return {loc:'idle',f:frame,mode:state==='sheathe'?'stowing':'drawing',phase:frame};
   return {loc:state,f:frame,mode:'drawn',phase:0};
 }
 function renderPixelMap(dir,state,frame,combo,poseFn){
   assert(Number.isInteger(dir)&&dir>=0&&dir<4,'direction must be 0..3');
   assert(Object.hasOwn(STATES,state),'unknown animation '+state);
   assert(Number.isInteger(frame)&&frame>=0&&frame<STATES[state],'invalid frame '+frame);
   assert(Number.isInteger(combo)&&combo>=0&&combo<=3,'combo must be 0..3');
   const v=normalizeState(state,frame),base=v.loc,frameWalk=v.f,
    pose=simplePoseGuard(poseFn,dir,base,frameWalk,combo),
    offs=offsets(base,frameWalk,combo,dir),img=new Map(),body=new Map();
   feet(body,dir,base,frameWalk);
   drawTorso(body,dir,offs,base,frameWalk);
   drawHead(body,dir,offs,base,frameWalk);
   if(v.mode==='drawn'){
     const arms=actionArms(null,dir,base,frameWalk,combo,pose,offs);
     const behind=dir===0 || (dir===1&&pose.v[0]<-5) || (dir===3&&pose.v[0]>5) || (base==='attack'&&pose.v[1]<-16);
     if(base==='attack'&&(frameWalk===2||frameWalk===3)){
       const p=poseFn(dir,frameWalk,combo),prev=poseFn(dir,frameWalk-1,combo);
       smear(img,prev,p,dir,frameWalk,combo);
     }
     merge(img,arms.back);
     if(behind)sword(img,pose);
     merge(img,body);merge(img,arms.front);
     if(!behind)sword(img,pose);
   }else if(v.mode==='sheathed'){
     const arms=relaxedArms(dir,base,frameWalk,offs);
     merge(img,arms.back);
     if(dir!==0)storedSword(img,dir,frameWalk,base==='walk');
     merge(img,body);
     if(dir===0)storedSword(img,dir,frameWalk,base==='walk');
     merge(img,arms.front);
   }else{
     const count=v.mode==='stowing'?6:5;
     const phase=v.phase, t=ease((phase+1)/count),store=SHEATH[dir],
      now=v.mode==='stowing'?weaponBlend(pose,store,t):weaponBlend(store,pose,t),
      arms=actionArms(null,dir,base,frameWalk,combo,now,offs);
     merge(img,arms.back);
     if(dir!==0&&v.mode==='drawing'&&phase<2)storedSword(img,dir,frameWalk,base==='walk');
     merge(img,body);
     if(dir===0&&v.mode==='drawing'&&phase<2)storedSword(img,dir,frameWalk,base==='walk');
     merge(img,arms.front);
     if(v.mode==='stowing'&&phase===5 || v.mode==='drawing'&&phase===0){
       storedSword(img,dir,frameWalk,base==='walk');
     }else sword(img,now);
   }
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
 function weaponVisual(actor,time,state='idle',frame=0){
  // A strictly visual state machine. No swing duration, stamina, hitbox or
  // movement delay is introduced. Clock is game-time, never wall-clock.
  const t=Number.isFinite(time)?time:0;
  const timing=actor.weapon&&typeof HearthreaverWeapons!=='undefined'?HearthreaverWeapons.holster(actor.weapon):HOLSTER;
  let b=actor.kaldorWeapon;
  if(!b||!Number.isFinite(b.lastTime)||t<b.lastTime-0.001){
   b={mode:'drawn',lastAttack:t,lastTime:t,phaseAt:t,wasAttacking:false};actor.kaldorWeapon=b;
  }
  const attacking=(actor.attack||0)>0,guarding=!!(actor.guard||(actor.guardTime||0)>0),
   forced=(actor.hurt||0)>0||(actor.useTime||0)>0||(actor.melee||0)>0||!!actor.held||!!actor.thrown;
  if(attacking){
   if(!b.wasAttacking){b.lastAttack=t;b.mode='drawn';b.phaseAt=t;}
   b.wasAttacking=true;
  }else b.wasAttacking=false;
  b.lastTime=t;
  if(guarding){
   if(b.mode==='sheathed'||b.mode==='stowing'){
    b.mode='drawing';b.phaseAt=t;
   }
   b.lastAttack=t;
  }
  if(b.mode==='drawing'&&t-b.phaseAt>=timing.draw)b.mode='drawn';
  if(b.mode==='stowing'&&t-b.phaseAt>=timing.stow)b.mode='sheathed';
  if(!attacking&&!guarding&&!forced&&b.mode==='drawn'&&t-b.lastAttack>=timing.delay){
   b.mode='stowing';b.phaseAt=t;
  }
  if(attacking)return {state,frame,mode:'drawn'};
  const defense=typeof HearthreaverWeapons!=='undefined'?HearthreaverWeapons.defenseLook(actor):null;
  if(defense&&!forced){b.mode='drawn';b.lastAttack=t;return {...defense,mode:'drawn'};}
  if(guarding&&!forced){b.mode='drawn';return {state:'guard',frame:actor.moving?6:0,mode:'drawn'};}
  if(forced){ // visual only: impact/use never summons a sheathed sword into the hand.
    if(b.mode==='stowing'){b.mode='drawn';b.lastAttack=t;}
    if(b.mode==='sheathed'&&['hurt','use','melee'].includes(state))
      return {state:'sheathed_'+state,frame,mode:b.mode};
    return {state,frame,mode:b.mode};
  }
  const walking=state==='walk'&&!!actor.moving;
  if(b.mode==='stowing'){
   const phase=Math.min(5,Math.floor((t-b.phaseAt)/timing.stow*6));
   return walking?{state:'sheathe_walk',frame:phase*6+(frame%6),mode:b.mode}:
      {state:'sheathe',frame:phase,mode:b.mode};
  }
  if(b.mode==='drawing'){
   const phase=Math.min(4,Math.floor((t-b.phaseAt)/timing.draw*5));
   return walking?{state:'draw_walk',frame:phase*6+(frame%6),mode:b.mode}:
      {state:'draw',frame:phase,mode:b.mode};
  }
  if(b.mode==='sheathed'){
   if(walking)return {state:'sheathed_walk',frame:frame%6,mode:b.mode};
   if(state==='dash')return {state:'sheathed_dash',frame:frame%4,mode:b.mode};
   if(state==='idle')return {state:'sheathed_idle',frame:frame%4,mode:b.mode};
  }
  return {state,frame,mode:b.mode};
 }
 return Object.freeze({version:3,cell:CELL,anchor:ANCHOR,palette:PALETTE,parts:PARTS,directions:DIRECTIONS,states:STATES,holster:HOLSTER,draw,raster,idleFrame,weaponVisual});
});
