/* Hearthreaver — environnement isométrique dessiné à la main (Piskel).
 * Compose le sol d'un secteur pixel par pixel à partir de textures indexées :
 * herbe, terre, pavés, berge, eau, litière, falaises et planches.
 * Projection identique aux bâtiments : x = u - v, y = (u + v) / 2 - z.
 * Les matières se mêlent par leur hauteur dessinée (touffes, pavés entiers),
 * puis des règles de lumière en haut à gauche posent ombres, berges et rebords.
 * Pur JavaScript sans DOM : utilisable dans un worker. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory;else root.createEnvironmentArt=factory;})(globalThis,function createEnvironmentArt(ASSETS){
'use strict';
const PAL=ASSETS.palette,RGB=PAL.map(h=>h.length===9?[0,0,0,0]:[parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16),255]);
const NAME=new Map(ASSETS.names.map((n,i)=>[n,i+1])),RAMP=ASSETS.ramps;
const C=n=>{const i=NAME.get(n);if(!i)throw RangeError('couleur '+n);return i;};
// Décalage dans une rampe (ombre / lumière) en restant dans la palette.
const SHIFT=[];for(let i=1;i<PAL.length;i++){const [r,t]=ASSETS.toneOf[i-1],list=RAMP[r];SHIFT[i]=d=>C(r+Math.max(0,Math.min(list-1,t+d)));}
const shift=(c,d)=>c&&d?SHIFT[c](d):c;
function decode(t){if(t.px instanceof Uint8Array)return t;const b=s=>typeof atob==='function'?Uint8Array.from(atob(s),c=>c.charCodeAt(0)):Uint8Array.from(Buffer.from(s,'base64'));return {...t,px:b(t.px),ht:t.ht?b(t.ht):null};}
const TEX={};for(const [k,v]of Object.entries(ASSETS.textures))TEX[k]=decode(v);
const STAMPS=(ASSETS.decals||[]).map(decode);
// Formes des pièces : 64 × 32, niveaux 0-3 codés par couleur de référence.
const PIECES={};for(const [set,list]of Object.entries(ASSETS.pieces||{}))PIECES[set]=Object.fromEntries(list.map(p=>[p.mask,decode(p)]));
const LEVEL=[];for(const [i,v]of Object.entries(ASSETS.levelOf||{}))LEVEL[i]=v;
const tex=(t,x,y)=>{const i=((y%t.h+t.h)%t.h)*t.w+((x%t.w+t.w)%t.w);return t.px[i];};
const hgt=(t,x,y)=>t.ht?t.ht[((y%t.h+t.h)%t.h)*t.w+((x%t.w+t.w)%t.w)]/255:.5;
const hash=(x,y,s=0)=>{let h=Math.imul(Math.floor(x)+s*7919,374761393)^Math.imul(Math.floor(y)-s*104729,668265263);h=Math.imul(h^(h>>>13),1274126177);return ((h^(h>>>16))>>>0)/4294967296;};
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
// Matières du sol, par code de terrain du moteur.
const GROUND={0:'grass',4:'grass',1:'dirt',2:'cobble',7:'cobble',3:'water',5:'water',6:'grass',8:'grass'};
const K=.55;
/* sampler.tile(i,j) -> {code, height?, bridgeDir?} en tuiles du monde (atlas)
 * sampler.roads(i,j) -> segments {a:[U,V],b:[U,V],width} en unités (16 par tuile)
 * sampler.lanes(i,j) -> rectangles pavés {x,y,w,h,paved}
 * U, V : unités du monde atlas. base : coin du secteur. screen : origine écran
 * entière de ce coin (continuité des textures d'un secteur à l'autre). */
function render(o){
 const {sampler,base,screen,tiles=[32,32],width=1024,height=544,ox=512,oy=32}=o,[U0,V0]=base,[S0,T0]=screen;
 const tileCache=new Map(),T=(i,j)=>{const k=i+','+j;let t=tileCache.get(k);if(!t){t=sampler.tile(i,j)||{code:0};tileCache.set(k,t);}return t;};
 const segCache=new Map(),roadsOf=(i,j)=>{const k=i+','+j;let s=segCache.get(k);if(!s){s=sampler.roads?sampler.roads(i,j)||[]:[];segCache.set(k,s);}return s;};
 const laneCache=new Map(),lanesOf=(i,j)=>{const k=i+','+j;let s=laneCache.get(k);if(!s){s=sampler.lanes?sampler.lanes(i,j)||[]:[];laneCache.set(k,s);}return s;};
 const isCliff=t=>t.code===6||t.code===8,cliffH=t=>t.code===6?24:t.code===8?32:0;
 const ti0=Math.floor(U0/16),tj0=Math.floor(V0/16);
 // Matière du sol en un point du monde, avec sa couleur.
 const M_GRASS=1,M_DIRT=2,M_COBBLE=3,M_WATER=4,M_BANK=5,M_LITTER=6,M_PLANK=7;
 const landish=m=>m&&m!==M_WATER&&m!==M_PLANK;
 function ground(U,V,sx,sy){
  const fu=(U-8)/16,fv=(V-8)/16,i0=Math.floor(fu),j0=Math.floor(fv),tx=fu-i0,ty=fv-j0;
  let wg=0,wd=0,wc=0,ww=0,wl=0;
  for(const [di,dj,w]of [[0,0,(1-tx)*(1-ty)],[1,0,tx*(1-ty)],[0,1,(1-tx)*ty],[1,1,tx*ty]]){const t=T(i0+di,j0+dj),m=GROUND[t.code]||'grass';
   if(m==='water')ww+=w;else if(m==='dirt')wd+=w;else if(m==='cobble')wc+=w;else wg+=w;if(t.code===4)wl+=w;}
  // Routes et ruelles analytiques : bord net, sans escalier de cases.
  const i=Math.floor(U/16),j=Math.floor(V/16);
  for(const r of roadsOf(i,j)){const dx=r.b[0]-r.a[0],dy=r.b[1]-r.a[1],len=dx*dx+dy*dy||1,t=clamp(((U-r.a[0])*dx+(V-r.a[1])*dy)/len,0,1),d=Math.hypot(U-r.a[0]-t*dx,V-r.a[1]-t*dy),w=clamp((r.width-d)/7+.5,0,1);if(w>0){const m=r.paved?'c':'d';if(m==='c')wc=Math.max(wc,w);else wd=Math.max(wd,w);}}
  for(const l of lanesOf(i,j)){const d=Math.max(l.x-U,U-(l.x+l.w),l.y-V,V-(l.y+l.h)),w=clamp(-d/6+.5,0,1);if(w>0){if(l.paved)wc=Math.max(wc,w);else wd=Math.max(wd,w);}}
  // Pièces standard (cases de 2 m) : chemin, rue pavée, ruisseau.
  let wp=0;
  if(sampler.piece){const ci=Math.floor(U/32),cj=Math.floor(V/32);for(const pc of sampler.piece(ci,cj)||[]){const m=PIECES[pc.set]?.[pc.mask];if(!m)continue;const lu=U-ci*32,lv=V-cj*32,mx=Math.floor(lu-lv+32),my=Math.floor((lu+lv)/2),q=m.px[my*64+mx]||0,w=q?LEVEL[q]||0:0;if(!w)continue;
   if(pc.set==='ruisseau')ww=Math.max(ww,w);else if(pc.set==='pave'){wc=Math.max(wc,w);wp=Math.max(wp,w);}else{wd=Math.max(wd,w);wp=Math.max(wp,w);}}}
  if(ww>.5&&wp>.6)return {m:M_PLANK};
  if(wd+wc>0){const land=Math.max(0,1-ww-wd-wc);wg=Math.min(wg,land);}
  const G=TEX.grass,D=TEX.dirt,Cb=TEX.cobble;
  const sg=wg+K*(hgt(G,sx,sy)-.5),sd=wd?wd+K*(hgt(D,sx,sy)-.5):-9,sc=wc?wc+K*(hgt(Cb,sx,sy)-.5):-9,landBest=Math.max(sg,sd,sc);
  // L'eau gagne quand sa part dépasse la moitié, déformée par la hauteur des rives.
  const bankH=hgt(TEX.bank,sx,sy);
  if(ww>.5+K*.6*(bankH-.5))return {m:M_WATER,w:ww};
  if(ww>.2+K*.5*(bankH-.5))return {m:M_BANK,w:ww};
  if(landBest===sc&&wc)return {m:M_COBBLE};
  if(landBest===sd&&wd)return {m:M_DIRT};
  if(wl>0&&wl*1.4+K*(hgt(TEX.litter,sx,sy)-.5)>.62)return {m:M_LITTER};
  return {m:M_GRASS};
 }
 // Tablier du pont : planches perpendiculaires au chemin (texture en plan, 32 × 32).
 function plank(U,V){const P=TEX.plank;if(!P)return C('ecorce3');const ci=Math.floor(U/32),cj=Math.floor(V/32),pc=(sampler.piece(ci,cj)||[]).find(p=>p.set!=='ruisseau'),ns=pc&&(pc.mask&5)&&!(pc.mask&10);const a=Math.floor(ns?V:U),b=Math.floor(ns?U:V);return tex(P,b,a);}
 const colourOf=(g,sx,sy,U,V)=>g.m===M_PLANK?plank(U,V):g.m===M_GRASS?tex(TEX.grass,sx,sy):g.m===M_DIRT?tex(TEX.dirt,sx,sy):g.m===M_COBBLE?tex(TEX.cobble,sx,sy):g.m===M_BANK?tex(TEX.bank,sx,sy):g.m===M_LITTER?tex(TEX.litter,sx,sy):g.m===M_WATER?(g.w<.62?shift(tex(TEX.water,sx,sy),1):g.w>.9?shift(tex(TEX.water,sx,sy),-1):tex(TEX.water,sx,sy)):0;
 // 1. Sol : matière et couleur pour chaque pixel du secteur (+ marge haute de 4 px).
 const MARGIN=4,GH=height+MARGIN,mat=new Uint8Array(width*GH),col=new Uint8Array(width*GH),own=new Uint8Array(width*GH),ww=new Float32Array(width*GH);
 for(let py=-MARGIN;py<height;py++)for(let px=0;px<width;px++){
  const X=px-ox+.5,Y=py-oy+.5,u=Y+X/2,v=Y-X/2,U=U0+u,V=V0+v,k=(py+MARGIN)*width+px;
  const li=Math.floor(u/16),lj=Math.floor(v/16);own[k]=li>=0&&lj>=0&&li<tiles[0]&&lj<tiles[1]?1:0;
  if(!own[k]&&py>=0)continue;
  const sx=S0+px-ox,sy=T0+py-oy,g=ground(U,V,sx,sy);mat[k]=g.m;ww[k]=g.w||0;col[k]=colourOf(g,sx,sy,U,V);
 }
 const at=(px,py)=>(py+MARGIN)*width+px;
 // 2. Lumière : ombre sous l'herbe, berge visible au loin, écume au bord proche.
 const out=new Uint8Array(width*height);
 for(let py=0;py<height;py++)for(let px=0;px<width;px++){
  const k=at(px,py);if(!own[k])continue;let c=col[k];const m=mat[k],sx=S0+px-ox,sy=T0+py-oy;
  const up=n=>py-n>=-MARGIN?mat[at(px,py-n)]:m,land=landish;
  if(m===M_WATER){
   if(up(1)===M_PLANK)c=C('ecorce2');else if(up(2)===M_PLANK)c=C('ecorce1');else if(up(3)===M_PLANK||up(4)===M_PLANK&&up(3)===M_WATER)c=C('eau0');
   else if(landish(up(1)))c=C('terre3');else if(landish(up(2)))c=C('terre2');else if(landish(up(3)))c=C('eau0');
   else if(py+1<height&&landish(mat[at(px,py+1)])&&hash(sx>>1,sy,3)<.45)c=C('eau5');
  }else if(m===M_PLANK){if(!up(1)||up(1)===M_WATER)c=C('ecorce4');
  }else if(m===M_DIRT||m===M_BANK||m===M_COBBLE){if(up(1)===M_GRASS||up(1)===M_LITTER)c=shift(c,-2);else if(up(2)===M_GRASS&&hash(sx,sy,5)<.5)c=shift(c,-1);}
  else if((m===M_GRASS||m===M_LITTER)&&(up(1)===M_DIRT||up(1)===M_COBBLE||up(1)===M_BANK)&&hash(sx,sy,6)<.4)c=shift(c,1);
  out[py*width+px]=c;
 }
 // 3. Décors au sol (fleurs, cailloux) sur l'herbe uniquement, par case du monde.
 if(STAMPS.length){
  for(let j=tj0-1;j<=tj0+tiles[1];j++)for(let i=ti0-1;i<=ti0+tiles[0];i++){
   const t=T(i,j);if(t.code!==0)continue;const r=hash(i,j,11);if(r>(ASSETS.decalRate||.07))continue;
   const s=STAMPS[Math.floor(hash(i,j,12)*STAMPS.length)],u=i*16+2+hash(i,j,13)*12-U0,v=j*16+2+hash(i,j,14)*12-V0,px0=Math.round(u-v+ox-s.ax),py0=Math.round((u+v)/2+oy-s.ay);
   for(let y=0;y<s.h;y++)for(let x=0;x<s.w;x++){const c=s.px[y*s.w+x];if(!c)continue;const px=px0+x,py=py0+y;if(px<0||py<0||px>=width||py>=height)continue;const k=at(px,py);if(own[k]&&mat[k]===M_GRASS)out[py*width+px]=c;}
  }
 }
 // 4. Reliefs naturels : contour lissé entre les centres des cases, jamais en
 // créneaux. Chaque pixel lance un rayon vertical : le premier point plein
 // rencontré donne le dessus herbeux ou la paroi, éclairée selon sa normale.
 const kind=new Uint8Array(width*height),blockOf=new Int32Array(width*height).fill(-1);
 const FS=TEX.cliffS,FE=TEX.cliffE,G=TEX.grass;
 const cliffAt=(i,j)=>isCliff(T(i,j));
 const ahead=new Map(),near=(i,j)=>{const k=i+','+j;if(!ahead.has(k)){let a=false;for(let dj=-1;dj<=3&&!a;dj++)for(let di=-1;di<=3&&!a;di++)a=cliffAt(i+di,j+dj);ahead.set(k,a);}return ahead.get(k);};
 const jitter=(U,V)=>(hash(Math.floor(U/6),Math.floor(V/6),31)-.5)*.08+(Math.sin(U*.21+V*.07)+Math.sin(V*.19-U*.05))*.035;
 function solid(U,V){
  const fu=(U-8)/16,fv=(V-8)/16,i0=Math.floor(fu),j0=Math.floor(fv),tx=fu-i0,ty=fv-j0;let f=0,h=0;
  for(const [di,dj,w]of [[0,0,(1-tx)*(1-ty)],[1,0,tx*(1-ty)],[0,1,(1-tx)*ty],[1,1,tx*ty]]){const t=T(i0+di,j0+dj);if(isCliff(t)){f+=w;h=Math.max(h,cliffH(t));}}
  return f+jitter(U,V)>=.5?h:0;
 }
 const hits=[];
 for(let py=0;py<height;py++)for(let px=0;px<width;px++){
  const X=px-ox+.5,Y=py-oy+.5,gi=Math.floor((Y+X/2)/16)+ti0,gj=Math.floor((Y-X/2)/16)+tj0;
  if(!near(gi,gj))continue;
  for(let z=32;z>=0;z--){
   const u=Y+z+X/2,v=Y+z-X/2,U=U0+u,V=V0+v,H=solid(U,V);if(!H||z>H)continue;
   // Case propriétaire (pour le tri avec les acteurs) : la case de relief la plus proche.
   let i=Math.floor(U/16),j=Math.floor(V/16);if(!cliffAt(i,j)){const c=[[i-1,j],[i,j-1],[i-1,j-1],[i+1,j],[i,j+1]].find(([a,b])=>cliffAt(a,b));if(c)[i,j]=c;}
   const li=i-ti0,lj=j-tj0;if(li<0||lj<0||li>=tiles[0]||lj>=tiles[1])break;
   const k=py*width+px,sx=S0+px-ox,sy=T0+py-oy;
   if(z===H){out[k]=tex(G,sx,sy+H);kind[k]=1;}
   else{
    const e=1.5,gu=solid(U+e,V)-solid(U-e,V),gv=solid(U,V+e)-solid(U,V-e),nu=-gu,nv=-gv,light=(nv-nu)/(Math.hypot(nu,nv)||1),row=H-z;
    let c=light>.45?tex(FS,sx,row):light<-.45?tex(FE,sx,row):shift(tex(FS,sx,row),-1);if(z<2)c=shift(c,-1);
    out[k]=c;kind[k]=light>-.45?2:3;
   }
   blockOf[k]=lj*tiles[0]+li;hits.push(k);break;
  }
 }
 // Rebords : lèvre claire, herbe qui retombe, pied sombre sur le sol.
 for(const k of hits){const kd=kind[k];if(k+width>=out.length||k<width)continue;const px=k%width,sx=S0+px-ox;
  if(kd===1&&kind[k+width]>1){out[k]=C(kind[k+width]===2?'herbe6':'herbe5');continue;}
  if(kd>1&&kind[k-width]===1){const n=Math.floor(hash(sx,0,21)*4);for(let d=0;d<[0,1,2,1][n]&&kind[k+d*width]>1;d++)out[k+d*width]=C(d?'herbe2':'herbe3');}
 }
 for(const k of hits){if(kind[k]<2)continue;const px=k%width,py=(k-px)/width;if(py+1>=height||kind[k+width])continue;for(let d=1;d<=2&&py+d<height;d++){const q=k+d*width;if(kind[q]||!own[at(px,py+d)])break;out[q]=shift(out[q],d===1?-2:-1);}}
 const blocks=new Map();for(const k of hits){const b=blockOf[k];if(!blocks.has(b))blocks.set(b,{faces:false,x0:1e9,y0:1e9,x1:-1,y1:-1,list:[]});const B=blocks.get(b),px=k%width,py=(k-px)/width;B.list.push(k);if(kind[k]>1)B.faces=true;B.x0=Math.min(B.x0,px);B.x1=Math.max(B.x1,px);B.y0=Math.min(B.y0,py);B.y1=Math.max(B.y1,py);}
 // Image RGBA et pièces de relief qui passent devant les acteurs.
 const data=new Uint8ClampedArray(width*height*4);for(let k=0;k<out.length;k++)if(out[k])data.set(RGB[out[k]],k*4);
 const features=[];
 for(const [id,B]of blocks){if(!B.faces)continue;const w=B.x1-B.x0+1,h=B.y1-B.y0+1,fd=new Uint8ClampedArray(w*h*4);
  for(const k of B.list){const px=k%width,py=(k-px)/width;fd.set(RGB[out[k]],((py-B.y0)*w+px-B.x0)*4);}
  const li=id%tiles[0],lj=Math.floor(id/tiles[0]);features.push({width:w,height:h,data:fd,x:B.x0-ox,y:B.y0-oy,depth:(li+lj)*8+16});}
 return {width,height,data,features,indices:out};
}
return {render,palette:PAL,shift,C};
});
