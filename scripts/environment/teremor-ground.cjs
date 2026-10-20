'use strict';
/* Teremor, forêt tempérée : textures de sol. Chaque texture se raccorde sur la
 * grille isométrique (largeur multiple de 32, hauteur multiple de 16). La
 * hauteur de matière (0 à 1) décide des bords lorsque deux matières se mêlent :
 * une touffe haute déborde sur la terre, un pavé reste entier au bord. */
const {rng,Grid,stamp,scatter,line,field,patch}=require('./brushes.cjs');
const tone=(ramp,b,n,max)=>ramp+Math.max(0,Math.min(max,b+n));
// Touffes : L pointe éclairée, M brin, D pied, S ombre portée.
const TUFTS={
 small:[['L','D'],['.L.','LMM','.D.'],['L.L','MLM','DSD'],['.L..','LM.L','DMMD']],
 large:[['L...L','ML.LM','.DMD.'],['...L...','.L.M.L.','.MLMDM.','..DSD..'],['..L.L..','.LM.ML.','LMDMDML','.SD.DS.'],['.L...L.','.ML.LM.','L.MDM.L','MDDSDDM']]
};
const herb=(b,n)=>tone('herbe',b,n,7);
function grass({seed=11,base=4,w=256,h=128}={}){
 const R=rng(seed),g=new Grid(w,h,{wrap:true,fill:herb(base,0),height:.5}),F=field(w,h,20,R,2),G=field(w,h,8,R,1);
 const zone=(x,y)=>{const f=F.at(x,y)+G.at(x,y)*.18;return f<-.3?-1:f>.34?1:0;};
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){const z=zone(x,y);if(z)g.set(x,y,herb(base,z),z<0?.62:.42);}
 // Herbes hautes : pointes de brins sur le bord supérieur, ombre brisée dessous.
 for(let x=0;x<w;x++)for(let y=0;y<h;y++){
  if(zone(x,y)===-1&&zone(x,y-1)!==-1){const n=Math.floor(R()*4);for(let k=1;k<=[0,1,2,1][n];k++)g.set(x,y-k,herb(base,-1),.62);if(n===2)g.set(x,y-3,herb(base,0),.9);}
  if(zone(x,y)===-1&&zone(x,y+1)!==-1&&R()<.6)g.set(x,y+1,herb(base,-2),.38);
 }
 for(const [x,y]of scatter(w,h,7,R)){
  const z=zone(x,y+1),p=z<0?.7:z>0?.14:.36;if(R()>p)continue;
  const b=base+z,set=z<0||R()<.3?TUFTS.large:TUFTS.small,t=set[Math.floor(R()*set.length)];
  stamp(g,x,y,t,{L:herb(b,z<0?1:2),M:herb(b,1),D:herb(b,-1),S:herb(b,-2)},{h:{L:1,M:.9,D:.7,S:.4},flip:R()<.5});
 }
 for(const [x,y]of scatter(w,h,18,R))if(zone(x,y)===1&&R()<.5)line(g,x,y,x+1,y,herb(base,2),.6);
 return g;
}
// Terre battue : nuances douces, craquelures courtes, quelques cailloux gris.
const PEBBLES=[['ab','cd'],['.ab','abd','.dd'],['abb.','bbcd','.dd.']];
function dirt({seed=23,w=128,h=64,base=4,pebbles=1,ramp='terre'}={}){
 const R=rng(seed),g=new Grid(w,h,{wrap:true,fill:ramp+base,height:.45}),F=field(w,h,10,R,2);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){const f=F.at(x,y);if(f<-.42)g.set(x,y,ramp+(base-1),.35);else if(f>.48)g.set(x,y,ramp+(base+1),.5);}
 for(const [x,y]of scatter(w,h,11,R)){const k=R();if(k<.3)line(g,x,y,x+2,y+(R()<.5?0:1),ramp+(base-1),.3);else if(k<.5){g.set(x,y,ramp+(base+1),.55);g.set(x+1,y,ramp+(base+1),.55);g.set(x+1,y+1,ramp+(base-1),.4);}}
 for(const [x,y]of scatter(w,h,14/pebbles,R)){if(R()>.5*pebbles)continue;const p=PEBBLES[Math.floor(R()*PEBBLES.length)];stamp(g,x,y,p,{a:'pierre5',b:'pierre4',c:'pierre3',d:ramp+(base-2)},{h:{a:.95,b:.9,c:.85,d:.4},flip:R()<.5});}
 return g;
}
// Pavés : grosses pierres arrondies, joints discrets, lumière en haut à gauche.
function cobbles({seed=31,w=128,h=64}={}){
 const R=rng(seed),g=new Grid(w,h,{wrap:true,fill:'pierre2',height:.15});
 const pts=scatter(w,h,8.6,R,{aniso:1.8}),own=new Int32Array(w*h).fill(-1),best=new Float32Array(w*h).fill(1e9);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++)pts.forEach((p,k)=>{let dx=Math.abs(x-p[0]),dy=Math.abs(y-p[1]);dx=Math.min(dx,w-dx);dy=Math.min(dy,h-dy);const d=dx*dx+(dy*1.9)**2;if(d<best[y*w+x]){best[y*w+x]=d;own[y*w+x]=k;}});
 const kind=pts.map(()=>{const r=R();return r<.16?'warm':r<.4?'dark':'mid';});
 const T={mid:['pierre5','pierre4','pierre3'],dark:['pierre4','pierre3','pierre2'],warm:['terre6','terre5','terre4']};
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const k=own[y*w+x],o=(dx,dy)=>own[((y+dy+h)%h)*w+(x+dx+w)%w];
  const jr=o(1,0)!==k,jd=o(0,1)!==k,jl=o(-1,0)!==k,ju=o(0,-1)!==k;
  if(jr||jd){g.set(x,y,jd&&jr?'pierre1':'pierre2',.15);continue;}
  const t=T[kind[k]],c=ju||jl?t[0]:o(0,2)!==k||o(2,0)!==k?t[2]:t[1];
  g.set(x,y,c,ju||jl?.95:.9);
 }
 return g;
}
// Tablier de pont vu en plan (32 × 32 unités) : planches de 4, joints sombres.
function planks({seed=71}={}){
 const R=rng(seed),g=new Grid(32,32,{wrap:true,fill:'ecorce3'});
 for(let a=0;a<32;a++){const plank=Math.floor(a/4),tone=['ecorce3','ecorce3','ecorce2','ecorce4'][Math.floor(R()*4)];for(let b=0;b<32;b++){const r=a%4;g.set(b,a,r===3?'ecorce1':r===0?(tone==='ecorce2'?'ecorce3':'ecorce4'):tone);}
  for(let k=0;k<3;k++){const b=Math.floor(R()*32);if(a%4===1)g.set(b,a,'ecorce2');}
  if(a%4===1)for(const b of [3,28])g.set(b,a,'pierre3');}
 return g;
}
// Eau : tons profonds calmes, rides horizontales courtes, rares éclats.
function water({seed=41,w=128,h=64}={}){
 const R=rng(seed),g=new Grid(w,h,{wrap:true,fill:'eau3',height:0}),F=field(w,h,24,R,2);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(F.at(x,y)<-.25)g.set(x,y,'eau2');
 for(const [x,y]of scatter(w,h,8,R,{aniso:3})){const n=2+Math.floor(R()*4),deep=g.name(x,y)==='eau2';line(g,x,y,x+n,y,deep?'eau3':'eau4');if(!deep&&R()<.35)g.set(x+n+1,y,'eau5');if(R()<.3)line(g,x+1,y+1,x+n-1,y+1,deep?'eau1':'eau2');}
 return g;
}
// Litière de sous-bois : feuilles mortes et mousse sous les arbres.
function litter({seed=53,w=128,h=64}={}){
 const R=rng(seed),g=new Grid(w,h,{wrap:true,fill:'herbe3',height:.5}),F=field(w,h,12,R,2);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){const f=F.at(x,y);if(f<-.2)g.set(x,y,'herbe2',.4);}
 const LEAF=[['ab','.c'],['a.','bc'],['.a','bc']];
 for(const [x,y]of scatter(w,h,4,R)){if(R()<.35)continue;const r=R(),p=LEAF[Math.floor(R()*3)];stamp(g,x,y,p,r<.4?{a:'litiere3',b:'litiere2',c:'litiere1'}:r<.75?{a:'litiere2',b:'litiere1',c:'litiere0'}:{a:'mousse3',b:'mousse2',c:'mousse1'},{h:.7,flip:R()<.5});}
 return g;
}
module.exports={grass,dirt,cobbles,water,litter,planks,TUFTS,PEBBLES};
if(require.main===module){
 const {save}=require('./png.cjs'),out=process.argv[2]||'.';
 save(out+'/sols.png',[grass({w:128,h:64}),dirt(),cobbles(),water(),litter(),dirt({seed:7,base:5,pebbles:1.6})],{scale:3,cols:2,gap:4,bg:'#111',tile:[2,2]});
 console.log('ok');
}
