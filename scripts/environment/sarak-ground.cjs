'use strict';
/* Sarak, désert : textures de sol. Même grille et même lumière que Teremor
 * (raccords 32 × 16, lumière en haut à gauche) ; l'ambiance vient du sable
 * doré, des ombres violettes, des rides de vent et du grès rouge.
 * La hauteur de matière règle les mélanges : une crête de ride déborde sur
 * la piste, un galet reste entier au bord. */
const {rng,Grid,stamp,scatter,line,field}=require('./brushes.cjs');
const tone=(ramp,b,n,max)=>ramp+Math.max(0,Math.min(max,b+n));
const sab=(b,n)=>tone('sable',b,n,8);
// Galets : a éclat, b pierre, c ombre propre, d ombre portée sur le sable.
const PEBBLES=[['ab','cd'],['.ab','abd','.dd'],['abb.','bbcd','.dd.'],['a.','d.']];
/* Sable : grandes plages claires et ombrées, trains de rides de vent (crête
 * éclairée au-dessus, creux d'ombre dessous), rares galets et éclats. */
function sand({seed=211,base=5,w=256,h=128}={}){
 const R=rng(seed),g=new Grid(w,h,{wrap:true,fill:sab(base,0),height:.5}),Z=field(w,h,34,R,2),busy=new Uint8Array(w*h);
 const free=(x,y)=>{for(let dy=-2;dy<=2;dy++)for(let dx=-1;dx<=1;dx++)if(busy[(((y+dy)%h+h)%h)*w+((x+dx)%w+w)%w])return false;return true;};
 // Trains de rides : 4 à 8 rides parallèles, même onde, légèrement montantes
 // vers la droite (le vent vient de l'ouest). Le creux d'ombre fait la ride,
 // l'éclat clair ne marque que la crête de chaque onde.
 for(const [x0,y0]of scatter(w,h,19,R,{aniso:1.4})){
  if(Z.at(x0,y0)<-.12)continue;
  const n=4+Math.floor(R()*5),gap=5+Math.floor(R()*2),P=13+R()*9,ph=R()*Math.PI*2,A=.6+R()*.9,len=14+Math.floor(R()*14),tilt=-.16-R()*.08;
  for(let k=0;k<n;k++){
   const ox=x0+Math.round((R()-.5)*5)-k*2,oy=y0+k*gap,L=len-Math.round(Math.abs(k-(n-1)/2)*3)+Math.floor(R()*4);if(L<6)continue;
   const pts=[];for(let t=0;t<L;t++){const a=Math.PI*2*t/P+ph;pts.push([ox+t,oy+Math.round(A*Math.sin(a)+tilt*t),Math.cos(a)]);}
   if(!pts.every(([x,y])=>free(x,y)))continue;
   pts.forEach(([x,y,c],t)=>{
    if(t>0&&t<L-1)g.set(x,y+1,sab(base,-1),.34);
    if(t>1&&t<L-2&&c>-.2)g.set(x,y,sab(base,1),.64);
   });
   for(const [x,y]of pts)busy[((y%h+h)%h)*w+((x%w+w)%w)]=1;
  }
 }
 // Galets épars et grains clairs.
 for(const [x,y]of scatter(w,h,26,R)){if(R()>.35)continue;const p=PEBBLES[Math.floor(R()*PEBBLES.length)];stamp(g,x,y,p,{a:'pierre5',b:'pierre4',c:'pierre3',d:sab(base,-2)},{h:{a:.95,b:.9,c:.85,d:.4},flip:R()<.5});}
 for(const [x,y]of scatter(w,h,13,R))if(R()<.2&&g.name(x,y)===sab(base,0))g.set(x,y,sab(base,2),.55);
 return g;
}
/* Piste damée : terre pâle et rosée, polygones de craquelures dans les
 * creux, cailloux et empreintes. Plus froide que le sable pour se lire. */
function track({seed=223,w=128,h=64,base=4}={}){
 const R=rng(seed),g=new Grid(w,h,{wrap:true,fill:'piste'+base,height:.45}),F=field(w,h,10,R,2),Q=field(w,h,16,R,1);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){const f=F.at(x,y);if(f<-.55)g.set(x,y,'piste'+(base-1),.36);else if(f>.6)g.set(x,y,'piste'+(base+1),.52);}
 // Craquelures : bords de cellules (Voronoï 2:1) dans les zones sèches.
 const pts=scatter(w,h,9,R,{aniso:1.9}),own=new Int32Array(w*h);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){let best=1e9,k=0;pts.forEach((p,i)=>{let dx=Math.abs(x-p[0]),dy=Math.abs(y-p[1]);dx=Math.min(dx,w-dx);dy=Math.min(dy,h-dy);const d=dx*dx+(dy*1.9)**2;if(d<best){best=d;k=i;}});own[y*w+x]=k;}
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){if(Q.at(x,y)<.3)continue;const k=own[y*w+x],r=own[y*w+(x+1)%w],d=own[((y+1)%h)*w+x];
  if((r!==k||d!==k)&&R()<.7)g.set(x,y,'piste'+(base-1),.3);}
 for(const [x,y]of scatter(w,h,15,R)){if(R()>.45)continue;const p=PEBBLES[Math.floor(R()*PEBBLES.length)];stamp(g,x,y,p,{a:'pierre5',b:'pierre4',c:'pierre3',d:'piste'+(base-2)},{h:{a:.95,b:.9,c:.85,d:.4},flip:R()<.5});}
 for(const [x,y]of scatter(w,h,23,R))if(R()<.3){g.set(x,y,'piste'+(base-1),.35);g.set(x+1,y,'piste'+(base-1),.35);g.set(x,y-1,'piste'+(base+1),.5);}
 return g;
}
/* Pavés de grès : pierres arrondies tièdes, joints remplis de sable. */
function cobbles({seed=231,w=128,h=64}={}){
 const R=rng(seed),g=new Grid(w,h,{wrap:true,fill:'sable3',height:.15});
 const pts=scatter(w,h,8.6,R,{aniso:1.8}),own=new Int32Array(w*h).fill(-1),best=new Float32Array(w*h).fill(1e9);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++)pts.forEach((p,k)=>{let dx=Math.abs(x-p[0]),dy=Math.abs(y-p[1]);dx=Math.min(dx,w-dx);dy=Math.min(dy,h-dy);const d=dx*dx+(dy*1.9)**2;if(d<best[y*w+x]){best[y*w+x]=d;own[y*w+x]=k;}});
 const kind=pts.map(()=>{const r=R();return r<.14?'red':r<.38?'pale':'mid';});
 const T={mid:['gres3','gres2','gres1'],pale:['gres4','gres3','gres2'],red:['pise3','pise2','pise1']};
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const k=own[y*w+x],o=(dx,dy)=>own[((y+dy+h)%h)*w+(x+dx+w)%w];
  const jr=o(1,0)!==k,jd=o(0,1)!==k,jl=o(-1,0)!==k,ju=o(0,-1)!==k;
  if(jr||jd){g.set(x,y,jd&&jr?'sable2':'sable4',.15);continue;}
  const t=T[kind[k]],c=ju||jl?t[0]:o(0,2)!==k||o(2,0)!==k?t[2]:t[1];
  g.set(x,y,c,ju||jl?.95:.9);
 }
 return g;
}
/* Eau de l'oasis : turquoise claire, fonds plus sombres, rides courtes. */
function water({seed=241,w=128,h=64}={}){
 const R=rng(seed),g=new Grid(w,h,{wrap:true,fill:'oasis4',height:0}),F=field(w,h,24,R,2);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(F.at(x,y)<-.25)g.set(x,y,'oasis3');
 for(const [x,y]of scatter(w,h,8,R,{aniso:3})){const n=2+Math.floor(R()*4),deep=g.name(x,y)==='oasis3';line(g,x,y,x+n,y,deep?'oasis4':'oasis5');if(!deep&&R()<.35)g.set(x+n+1,y,'oasis7');if(R()<.3)line(g,x+1,y+1,x+n-1,y+1,deep?'oasis2':'oasis3');}
 return g;
}
/* Berge : sable mouillé plus sombre, taches humides, galets. */
function bank({seed=251,w=128,h=64}={}){
 const R=rng(seed),g=new Grid(w,h,{wrap:true,fill:'sable4',height:.45}),F=field(w,h,9,R,2);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){const f=F.at(x,y);if(f<-.58)g.set(x,y,'sable3',.35);else if(f>.58)g.set(x,y,'sable5',.55);}
 for(const [x,y]of scatter(w,h,10,R)){if(R()>.5)continue;const p=PEBBLES[Math.floor(R()*PEBBLES.length)];stamp(g,x,y,p,{a:'pierre5',b:'pierre4',c:'pierre3',d:'sable2'},{h:{a:.95,b:.9,c:.85,d:.4},flip:R()<.5});}
 return g;
}
/* Éboulis au pied des rochers : sable semé d'éclats de grès rouge. */
function scree({seed=261,w=128,h=64,base=5}={}){
 const R=rng(seed),g=new Grid(w,h,{wrap:true,fill:sab(base,0),height:.5}),F=field(w,h,12,R,2);
 const CHIPS=[['ab','cd'],['ab.','bcd'],['a','d'],['.a.','bcd']];
 for(const [x,y]of scatter(w,h,5,R)){if(R()<.3)continue;const p=CHIPS[Math.floor(R()*CHIPS.length)],r=R();stamp(g,x,y,p,r<.6?{a:'ocre6',b:'ocre5',c:'ocre4',d:sab(base,-2)}:r<.85?{a:'ocre5',b:'ocre4',c:'ocre3',d:sab(base,-2)}:{a:'pierre5',b:'pierre4',c:'pierre3',d:sab(base,-2)},{h:{a:.9,b:.85,c:.8,d:.4},flip:R()<.5});}
 return g;
}
/* Tablier de pont en bois blanchi (32 × 32 en plan). */
function planks({seed=271}={}){
 const R=rng(seed),g=new Grid(32,32,{wrap:true,fill:'bois3'});
 for(let a=0;a<32;a++){const tone=['bois3','bois4','bois3','bois5'][Math.floor(R()*4)];for(let b=0;b<32;b++){const r=a%4;g.set(b,a,r===3?'bois1':r===0?(tone==='bois3'?'bois4':'bois5'):tone);}
  for(let k=0;k<3;k++){const b=Math.floor(R()*32);if(a%4===1)g.set(b,a,'bois2');}
  if(a%4===1)for(const b of [3,28])g.set(b,a,'pierre3');}
 return g;
}
module.exports={sand,track,cobbles,water,bank,scree,planks,PEBBLES};
if(require.main===module){
 const {save}=require('./png.cjs'),out=process.argv[2]||'.';
 save(out+'/sarak-sols.png',[sand({w:128,h:64}),track(),cobbles(),water(),bank(),scree()],{scale:3,cols:2,gap:4,bg:'#111',tile:[2,2]});
 save(out+'/sarak-sable.png',[sand()],{scale:2,tile:[2,2]});
 console.log('ok');
}
