/* Hearthreaver — Kaldor's outfits, animated by the human NPC rig.
 * Node port of the civilian Aseprite Lua rig (poses.lua, animer.lua warp and
 * tool, finaliser.lua foreground): the same static 4-direction layered
 * source gives the same frames, pixel for pixel (tests/kaldor-outfits).
 * Hero additions: the 'dress' and 'helm' clips (whole arms raised to hand
 * targets) and outfit and helmet sources written as pixel grids in
 * art/kaldor-tenues/ and art/kaldor-casques/.
 */
'use strict';
const W=80,H=80;
const round=v=>Math.floor(v+.5);
const clamp01=v=>Math.max(0,Math.min(1,v));
const blank=()=>Buffer.alloc(W*H*4);
const O=[0x10,0x0c,0x14,255];
const get=(im,x,y)=>{const i=(y*W+x)*4;return [im[i],im[i+1],im[i+2],im[i+3]];};
const same=(a,b)=>a[0]===b[0]&&a[1]===b[1]&&a[2]===b[2]&&a[3]===b[3];
function pixel(im,x,y,p){x=round(x);y=round(y);if(x>=0&&x<W&&y>=0&&y<H){const i=(y*W+x)*4;im[i]=p[0];im[i+1]=p[1];im[i+2]=p[2];im[i+3]=p[3];}}
// Aseprite drawImage: alpha-composite, here every pixel is opaque or empty.
function drawImage(dst,src){for(let i=0;i<src.length;i+=4)if(src[i+3]){dst[i]=src[i];dst[i+1]=src[i+1];dst[i+2]=src[i+2];dst[i+3]=src[i+3];}}

// ---- poses.lua ----
const POSES={order:[],clips:{}};
function clip(id,loop,durations,poses,stride){POSES.order.push(id);POSES.clips[id]={loop,durations,poses,stride};}
clip('idle',true,[450,220,350,260],[{},{breath:1},{breath:1,arms:1},{}]);
const gait=[{step:2,lift:0},{step:1,lift:1,breath:-1},{step:0,lift:1},{step:-1,lift:0,breath:1},{step:-2,lift:0},{step:-1,lift:-1,breath:-1},{step:0,lift:-1},{step:1,lift:0,breath:1}];
clip('walk',true,[100,90,90,100,100,90,90,100],gait,24);
const run=[{step:3,lift:0,breath:-1},{step:2,lift:2,breath:-2},{step:0,lift:2,breath:-1},{step:-2,lift:0},{step:-3,lift:0,breath:-1},{step:-2,lift:-2,breath:-2},{step:0,lift:-2,breath:-1},{step:2,lift:0}];
for(const p of run){p.fear=true;p.lean=1;p.arms=2;}
clip('flee',true,[75,65,65,75,75,65,65,75],run,32);
clip('startle',false,[90,65,110,180],[{breath:1},{breath:-1,arms:2,fear:true},{breath:-1,arms:3,fear:true},{arms:2,fear:true}]);
clip('talk',true,[300,120,240,260],[{},{gesture:1},{gesture:2},{gesture:1}]);
clip('sit_down',false,[120,100,90,100,160],[{},{sit:1,lean:1},{sit:2,lean:1},{sit:3},{sit:4}]);
clip('seated',true,[600,240,400,360],[{sit:4},{sit:4,breath:1},{sit:4,breath:1,arms:1},{sit:4}]);
clip('stand_up',false,[110,100,90,110,180],[{sit:4},{sit:3,lean:1},{sit:2,lean:1},{sit:1},{}]);
clip('cower',true,[260,140,230,170],[{sit:1,arms:4,fear:true},{sit:1,arms:4,fear:true,lean:1},{sit:1,arms:4,fear:true},{sit:1,arms:4,fear:true,breath:1}]);
clip('hit',false,[55,85,115,120,160],[{lean:-1,arms:1},{lean:-2,breath:1,arms:2,fear:true},{lean:-1,breath:1,arms:2},{lean:-1,arms:1},{}]);
clip('death',false,[80,100,120,100,70,70,100,180],[{lean:-1,arms:2,fear:true},{sit:1,lean:-1,arms:2},{sit:3,lean:1,arms:1},{sit:3,angle:15},{sit:3,angle:38},{sit:2,angle:68},{sit:1,angle:90},{sit:1,angle:90,settle:1}]);
clip('carry',true,[120,110,110,120,120,110,110,120],gait.map(p=>({...p,load:true})),20);
// Work clips are not used by the hero; the order keeps only non-work clips.
// Hero only: pulling a garment over the head, tugging it down, settling it.
// reach: hand targets drawn as whole arms, face/back [left,right], profile [near].
clip('dress',false,[140,110,170,120,150,110,180,160],[
 {sit:1,arms:1},
 {breath:-1,reach:{front:[[36,41],[43,41]],side:[[42,42]]}},
 {breath:1,reach:{front:[[33,37],[46,37]],side:[[43,35]]}},
 {breath:1,reach:{front:[[34,38],[45,38]],side:[[44,37]]}},
 {sit:2,lean:1},{sit:1,arms:1},{breath:1,arms:2},{}]);
// Hero only: a helmet lifted onto the head (or off it) with both hands,
// pressed down on the hair, then the arms drop.
clip('helm',false,[130,160,170,130,170],[
 {breath:-1,reach:{front:[[36,42],[43,42]],side:[[42,43]]}},
 {reach:{front:[[32,35],[47,35]],side:[[44,33]]}},
 {breath:1,reach:{front:[[33,36],[46,36]],side:[[43,35]]}},
 {breath:1,arms:1},{}]);

// ---- animer.lua ----
function role(name){
 if(/07 Crane|08 Visage/.test(name)||/^VISAGE|^BARBE|^MOUSTACHE/.test(name))return 'head';
 if(/^CHEVEUX|^ADAPTATION/.test(name))return 'hair';
 if(/^COIFFE|^MASQUE/.test(name))return 'hat';
 if(/Manches|Mains|mains|bras|Bras|Gants/.test(name))return 'arms';
 if(/HABIT 10|Pieds nus/.test(name))return 'feet';
 if(/HABIT 11|Jambes/.test(name))return 'legs';
 return 'body';
}
function sourcePixels(src){
 const out=[];
 for(let y=25;y<=59;y++)for(let x=24;x<=55;x++){const p=get(src,x,y);if(p[3]>0)out.push([x,y,p,get(src,x,y-1)]);}
 return out;
}
function warp(src,name,p,d,fi,clipId){
 let im=blank();const r=role(name),side=d===2||d===4,sign=d===4?-1:1;
 const breathe=p.breath||0,sit=p.sit||0,lean=p.lean||0,step=p.step||0;
 const hx=side?lean*sign:0,by=breathe+round(sit*.65);
 const hair=/Arriere|Devant tunique/.test(name);
 function mapping(x,y){
  let X=x,Y=y;const limb=x<40?1:-1;
  if(r==='head'||r==='hat'||r==='hair'){
   X=x+hx;Y=y+by;
   if(r==='hair'&&hair&&y>43)X=X+round((y-43)/8*(step!==0?-step*.3:((fi%4===2)?.6:0)));
  }else if(r==='arms'){
   const frac=clamp01((y-44)/3),swing=side?-step*.65*sign:0;
   let up=(p.arms||0)+(!side?Math.max(0,-step*limb)*.35:0),reach=0;
   if(p.gesture&&(side||limb===-1)){up=p.gesture;reach=side?p.gesture*sign:limb*-p.gesture;}
   if(p.load){up=2;reach=side?2*sign:-limb*2;}
   if(p.fear)reach=side?sign:limb*.7;
   const elbow=(up!==0||reach!==0||swing!==0)?Math.sin(frac*Math.PI)*(side?sign:limb)*.7:0;
   X=x+hx+frac*(swing+reach)+elbow;Y=y+by-frac*up;
  }else if(r==='feet'||r==='legs'){
   const frac=clamp01((y-48)/3),lift=p.lift||0;
   if(side){X=x+round(step*frac*sign);Y=y-round(Math.max(0,lift)*frac);}
   else{X=x;Y=y-round(Math.max(0,lift*limb)*frac);}
   if(sit>0){Y=y;X=X+(side?round(sit*.65*frac)*sign:round(sit*.25*frac)*limb);}
   if(y<49)Y=Y+round(by*(49-y)/4);
  }else{
   const top=clamp01((50-y)/5);
   X=x+round(hx*top);Y=y+round(by*top);
   if(y>=48&&/HABIT 14|Cape|HABIT 12/.test(name)){X=X+round((y-47)*step*.12);Y=Y-round(Math.max(0,sit-1)*(y-47)/7);}
  }
  return [round(X),round(Y)];
 }
 if(side&&(r==='feet'||r==='legs')&&p.step!==undefined&&!p.far){
  const q={...p,step:-step,lift:-(p.lift||0),far:true};
  const far=warp(src,name,q,d,fi,clipId);
  let shade=null,value=10000;
  for(let y=44;y<=53;y++)for(let x=30;x<=49;x++){const col=get(src,x,y);if(!same(col,O)&&col[3]>0){const v=col[0]+col[1]+col[2];if(v<value){shade=col;value=v;}}}
  if(shade)for(let i=0;i<far.length;i+=4){if(far[i+3]>0&&!(far[i]===O[0]&&far[i+1]===O[1]&&far[i+2]===O[2]&&far[i+3]===O[3])){far[i]=shade[0];far[i+1]=shade[1];far[i+2]=shade[2];far[i+3]=shade[3];}}
  drawImage(im,far);
 }
 for(const [x,y,color,above] of sourcePixels(src)){
  const [X,Y]=mapping(x,y);
  if((r==='body'||r==='arms'||r==='legs')&&y>25){
   if(above[3]>0){const [ax,ay]=mapping(x,y-1),distance=Math.max(Math.abs(X-ax),Math.abs(Y-ay));
    if(distance>1)for(let t=1;t<=distance-1;t++)pixel(im,ax+(X-ax)*t/distance,ay+(Y-ay)*t/distance,t/distance<.5?above:color);}
  }
  pixel(im,X,Y,color);
  if(r==='legs'&&y===48&&breathe<0)pixel(im,X,Y-1,color);
 }
 if(p.angle){
  const rotated=blank(),a=p.angle*Math.PI/180,ca=Math.cos(a),sa=Math.sin(a);
  for(let y=20;y<=64;y++)for(let x=16;x<=66;x++){const px=x-40,py=y-51-(p.settle||0);
   const sx=round(40+px*ca+py*sa),sy=round(51-px*sa+py*ca);
   if(sx>=0&&sx<W&&sy>=0&&sy<H)pixel(rotated,x,y,get(im,sx,sy));}
  im=rotated;
 }
 return im;
}
const hex=h=>[parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16),255];
// Only the NPC carry crate (validation against the shipped civilians).
function tool(p,d,id){
 const im=blank();if(p.work===undefined&&!p.load)return im;
 const side=d===2||d===4,y=48+(p.sit||0),x=side?44:40,wood=hex('79533a'),light=hex('c7a67a');
 const dot=(xx,yy,col)=>{if(d===4)xx=79-xx;pixel(im,xx,yy,col);};
 const rect=(xx,yy,ww,hh,col)=>{for(let a=0;a<ww;a++)for(let b=0;b<hh;b++)dot(xx+a,yy+b,col);};
 if(id==='carry'||p.load){rect(x-3,y-3,7,5,O);rect(x-2,y-3,5,4,wood);rect(x-2,y-3,5,1,light);rect(x,y-2,1,3,light);}
 return im;
}
// Whole arms from the shoulder to a hand target (hero dress clip): a 2px
// sleeve, a 2x2 hand, one ink outline. Gauche mirrors droite.
const ARMS={sleeve:['f8b07a','c8743e'],hand:['f8b07a','c8743e']};
function reachArms(im,p,d,arms){
 const side=d===2||d===4,by=(p.breath||0)+round((p.sit||0)*.65),own=blank(),sl=arms.sleeve.map(hex),hd=arms.hand.map(hex);
 const put=(x,y,c)=>pixel(own,x,y,c);
 const list=side?[[38.5,45+by,...p.reach.side[0]]]:[[34.5,45+by,...p.reach.front[0]],[44.5,45+by,...p.reach.front[1]]];
 for(let [sx,sy,hx,hy] of list){
  if(d===4){sx=79-sx;hx=79-hx;}
  if(d===3&&hy>40)continue; // seen from the back, hands at the chest are hidden
  hy+=by;const n=Math.ceil(Math.hypot(hx-sx,hy-sy)*2);
  for(let i=0;i<=n;i++){const t=i/n,x=sx+(hx-sx)*t,y=sy+(hy-sy)*t;put(x-.5,y,sl[0]);put(x+.5,y,sl[1]);}
  const fx=Math.round(hx-.5),fy=Math.round(hy-.5);put(fx,fy,hd[0]);put(fx+1,fy,hd[0]);put(fx,fy+1,hd[0]);put(fx+1,fy+1,hd[1]);
 }
 const ink=[];for(let y=1;y<H-1;y++)for(let x=1;x<W-1;x++){if(get(own,x,y)[3])continue;if([[1,0],[-1,0],[0,1],[0,-1]].some(([a,b])=>get(own,x+a,y+b)[3]))ink.push([x,y]);}
 for(const [x,y] of ink)pixel(own,x,y,O);
 drawImage(im,own);
}
const COMMON=['idle','walk','flee','startle','talk','sit_down','seated','stand_up','cower','hit','death','carry'];
// layers: [{name, images:[face,droite,dos,gauche] 80x80 buffers}] bottom to top.
// Returns frames (body incl. tools), foreground frames, and the clip index.
function animate(layers,{tools=false,clips=COMMON,arms=ARMS}={}){
 const order=POSES.order.filter(id=>clips.includes(id));
 const frames=[],front=[],noArms=[],index={};
 for(const id of order){
  index[id]=[];const c=POSES.clips[id];
  for(let d=1;d<=4;d++){
   index[id].push(frames.length);
   c.poses.forEach((p,i)=>{
    const fi=i+1,body=blank(),fg=blank(),bare=blank();
    for(const l of layers){const r=role(l.name);if(r==='head'||(p.reach&&r==='arms'))continue;
     const im=warp(l.images[d-1],l.name,p,d,fi,id);drawImage(body,im);
     if(r!=='arms')drawImage(bare,im);
     if(r==='arms'&&(p.arms||0)>=3)drawImage(fg,im);
    }
    if(p.reach)reachArms(fg,p,d,arms);
    if(tools){const t=tool(p,d,id);drawImage(body,t);drawImage(fg,t);}
    frames.push(body);front.push(fg);noArms.push(bare);
   });
  }
 }
 return {frames,front,noArms,index,count:frames.length};
}

// ---- outfit sources ----
// Grid rows: "<y> <pixels from x=29>" ; '.' empty, '#' ink outline, other
// characters from the outfit palette. Views: face, droite, dos, gauche.
const X0=29,INK='100c14';
function parse(text){
 const px=[];if(!text)return px;
 for(const line of text.split('\n')){const t=line.trim();if(!t)continue;
  const m=/^(\d+)\s+(\S+)$/.exec(t);if(!m)throw Error('bad grid row: '+t);
  const y=+m[1];[...m[2]].forEach((ch,i)=>{if(ch!=='.')px.push([X0+i,y,ch]);});}
 return px;
}
const mirror=(px,swap={})=>px.map(([x,y,ch])=>[79-x,y,swap[ch]||ch]);
function image(px,palette,id,layer){
 const im=blank();
 for(const [x,y,ch] of px){const h=ch==='#'?INK:palette[ch];if(!h)throw Error(id+'/'+layer+': no colour for '+ch);
  const [r,g,b]=hex(h),i=(y*80+x)*4;im[i]=r;im[i+1]=g;im[i+2]=b;im[i+3]=255;}
 return im;
}
// layer: {name, face, droite, dos?:'face'|grid, gauche?:'mirror'|grid, swap?:{}}
function build(outfit){
 return outfit.layers.map(l=>{
  const face=parse(l.face),droite=parse(l.droite);
  const dos=l.dos===undefined||l.dos==='face'?face:parse(l.dos);
  const swap={...(outfit.swap||{}),...(l.swap||{})};
  const gauche=l.gauche===undefined||l.gauche==='mirror'?mirror(droite,swap):parse(l.gauche);
  return {name:l.name,images:[face,droite,dos,gauche].map(p=>image(p,outfit.palette,outfit.id,l.name))};
 });
}
// Garment pulled over the head (dress frames): shade 0..2 light to dark, 3 ink.
function clothPixels(views,d,frame){
 const g=d===4?views.droite?.[frame]:views[['face','droite','dos'][d-1]]?.[frame];if(!g)return [];
 let px=parse(g);if(d===4)px=mirror(px);
 return px.map(([x,y,ch])=>[x,y,ch==='#'?3:'abc'.indexOf(ch)]);
}
// Head and hair of the dress clip: the idle rest tile moved as warp moves a head.
function headOffset(p,d){const side=d===2||d===4,sign=d===4?-1:1;return [side?(p.lean||0)*sign:0,(p.breath||0)+round((p.sit||0)*.65)];}
module.exports={ARMS,reachArms,POSES,role,warp,tool,animate,blank,drawImage,get,pixel,hex,round,COMMON,W,H,O,INK,parse,mirror,image,build,clothPixels,headOffset};
