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
const SHIFT=[[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]];for(let i=1;i<PAL.length;i++){const [r,t]=ASSETS.toneOf[i-1],list=RAMP[r];SHIFT[i]=[];for(let d=-8;d<=8;d++)SHIFT[i][d+8]=C(r+Math.max(0,Math.min(list-1,t+d)));}
const shift=(c,d)=>c&&d?SHIFT[c][d+8]:c;
// Base64, ou suites « r: » [longueur - 1, valeur] produites par le build.
const B64=new Uint8Array(128);'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'.split('').forEach((c,i)=>{B64[c.charCodeAt(0)]=i;});
// Décodage base64 sans atob ni Buffer (worker, WebView, contexte isolé).
function raw(a){let n=a.length;while(n&&a[n-1]==='=')n--;const out=new Uint8Array(n*3>>2);for(let i=0,o=0;i<n;i+=4){const v=B64[a.charCodeAt(i)]<<18|B64[a.charCodeAt(i+1)]<<12|(i+2<n?B64[a.charCodeAt(i+2)]<<6:0)|(i+3<n?B64[a.charCodeAt(i+3)]:0);out[o++]=v>>16&255;if(o<out.length)out[o++]=v>>8&255;if(o<out.length)out[o++]=v&255;}return out;}
function bytes(s){if(s instanceof Uint8Array)return s;if(!s.startsWith('r:'))return raw(s);const r=raw(s.slice(2));let n=0;for(let i=0;i<r.length;i+=2)n+=r[i]+1;const out=new Uint8Array(n);for(let i=0,o=0;i<r.length;i+=2){out.fill(r[i+1],o,o+r[i]+1);o+=r[i]+1;}return out;}
function decode(t){return {...t,px:bytes(t.px),ht:t.ht?bytes(t.ht):null,...(t.sh?{sh:bytes(t.sh)}:{})};}
const TEX={};for(const [k,v]of Object.entries(ASSETS.textures))TEX[k]=decode(v);
const STAMPS=(ASSETS.decals||[]).map(decode);
// Formes des pièces : 64 × 32, niveaux 0-3 codés par couleur de référence.
const SHAPES={};for(const [set,list]of Object.entries(ASSETS.pieces||{}))SHAPES[set]=Object.fromEntries(list.map(p=>[p.mask,decode(p)]));
// Jeux de pièces : une forme et une matière (terre, pavages, eau). Les pavages
// ont une variante « _v » posée dans l'axe des rues nord-sud.
const SETS=ASSETS.sets||{chemin:{forme:'chemin',matiere:'dirt'},pave:{forme:'pave',matiere:'cobble'},ruisseau:{forme:'ruisseau',matiere:'water'}};
const KIND={};for(const [name,set]of Object.entries(SETS))KIND[name]=set.matiere==='water'?'water':set.matiere==='dirt'?'dirt':'paving';
const LEVEL=new Float32Array(PAL.length);for(const [i,v]of Object.entries(ASSETS.levelOf||{}))LEVEL[i]=v;
const tex=(t,x,y)=>t.px[((y%t.h+t.h)%t.h)*t.w+((x%t.w+t.w)%t.w)];
const hgt=(t,x,y)=>t.ht?t.ht[((y%t.h+t.h)%t.h)*t.w+((x%t.w+t.w)%t.w)]/255:.5;
// Bruit doux du monde : grandes plages claires et sombres de l'herbe, sans répétition.
const smooth=t=>t*t*(3-2*t);
const vnoise=(x,y,s)=>{const xi=Math.floor(x),yi=Math.floor(y),ux=smooth(x-xi),uy=smooth(y-yi),a=hash(xi,yi,s),b=hash(xi+1,yi,s),c=hash(xi,yi+1,s),d=hash(xi+1,yi+1,s);return (a+(b-a)*ux+(c-a)*uy+(a-b-c+d)*ux*uy)*2-1;};
const hash=(x,y,s=0)=>{let h=Math.imul(Math.floor(x)+s*7919,374761393)^Math.imul(Math.floor(y)-s*104729,668265263);h=Math.imul(h^(h>>>13),1274126177);return ((h^(h>>>16))>>>0)/4294967296;};
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
// Matière du sol par code de terrain du moteur : 1 herbe, 2 terre, 3 pavés, 4 eau.
const GROUND=[1,2,3,4,1,4,1,3,1];
const K=.55,M_GRASS=1,M_DIRT=2,M_COBBLE=3,M_WATER=4,M_BANK=5,M_LITTER=6,M_PLANK=7;
const landish=m=>m&&m!==M_WATER&&m!==M_PLANK;
const NONE=[];
/* sampler.tile(i,j) -> {code, paving?} en cases du monde (atlas), 16 unités par
 *   case ; paving : matière des places (codes 2 et 7), pavés irréguliers sinon
 * sampler.use(i,j) -> la case est dessinée ici (biomes mêlés) ; toutes par défaut
 * sampler.piece(ci,cj) -> [{set, mask}] sur les cases de 2 m (32 unités)
 * sampler.roads(i,j) -> segments {a:[U,V],b:[U,V],width,paved} en unités
 * sampler.lanes(i,j) -> rectangles {x,y,w,h,paved} en unités
 * base : coin du secteur en unités. screen : origine écran entière de ce coin
 * (continuité des textures d'un secteur à l'autre).
 * Résultat : RGBA, indices de palette et priorité par pixel (2 dessiné ici,
 * 1 à n'utiliser que si rien d'autre n'est dessiné, 0 vide), et les morceaux
 * de falaise qui passent devant les acteurs. */
function* renderSteps(o){
 const {sampler,base,screen,tiles=[32,32],width=1024,height=544,ox=512,oy=32}=o,[U0,V0]=base,[S0,T0]=screen;
 const ti0=Math.floor(U0/16),tj0=Math.floor(V0/16);
 // Cases du secteur et de ses abords : codes, usage, falaises proches.
 const PAD=4,GW=tiles[0]+PAD*2,GH=tiles[1]+PAD*2,gi0=ti0-PAD,gj0=tj0-PAD,codes=new Uint8Array(GW*GH),used=new Uint8Array(GW*GH),plazas=new Array(GW*GH),extra=new Map();
 for(let j=0;j<GH;j++)for(let i=0;i<GW;i++){const k=j*GW+i,t=sampler.tile(gi0+i,gj0+j)||{code:0};codes[k]=t.code;plazas[k]=TEX[t.paving]||TEX.cobble;used[k]=!sampler.use||sampler.use(gi0+i,gj0+j)?1:0;}
 const plazaAt=(i,j)=>{const a=i-gi0,b=j-gj0;return a>=0&&b>=0&&a<GW&&b<GH?plazas[b*GW+a]:TEX[(sampler.tile(i,j)||{}).paving]||TEX.cobble;};
 const code=(i,j)=>{const a=i-gi0,b=j-gj0;if(a>=0&&b>=0&&a<GW&&b<GH)return codes[b*GW+a];const k=i+','+j;let c=extra.get(k);if(c===undefined){c=(sampler.tile(i,j)||{code:0}).code;extra.set(k,c);}return c;};
 const useAt=(i,j)=>{const a=i-gi0,b=j-gj0;return a>=0&&b>=0&&a<GW&&b<GH?used[b*GW+a]:!sampler.use||sampler.use(i,j)?1:0;};
 const isCliffCode=c=>c===6||c===8,cliffAt=(i,j)=>isCliffCode(code(i,j));
 yield;
 // Routes et ruelles analytiques, par case.
 const tileList=(fn)=>{if(!fn)return null;const g=new Array(GW*GH);return (i,j)=>{const a=i-gi0,b=j-gj0;if(a<0||b<0||a>=GW||b>=GH)return fn(i,j)||NONE;const k=b*GW+a;return g[k]||(g[k]=fn(i,j)||NONE);};};
 const roadsOf=tileList(sampler.roads),lanesOf=tileList(sampler.lanes);
 // Pièces sur les cases de 2 m.
 const C0=Math.floor(U0/32)-3,D0=Math.floor(V0/32)-3,CW=Math.ceil(tiles[0]/2)+7,CH=Math.ceil(tiles[1]/2)+7,cells=new Array(CW*CH);
 const pieceList=(ci,cj)=>(sampler.piece?sampler.piece(ci,cj)||NONE:NONE).map(p=>{const set=SETS[p.set];if(!set)return null;const ns=(p.mask&5)&&!(p.mask&10);return {set:p.set,kind:KIND[p.set],mask:p.mask,m:SHAPES[set.forme]?.[p.mask],tex:TEX[set.matiere+(ns?'_v':'')]||TEX[set.matiere]};}).filter(p=>p&&p.m);
 const piecesAt=(ci,cj)=>{const a=ci-C0,b=cj-D0;if(a<0||b<0||a>=CW||b>=CH)return pieceList(ci,cj);const k=b*CW+a;return cells[k]||(cells[k]=pieceList(ci,cj));};
 // Matière en un point du monde : résultat dans gm (matière), gw (part d'eau)
 // et gp (texture du pavage : place, rue en rangs, chevrons…).
 let gm=0,gw=0,gp=null,wg=0,wd=0,wc=0,ww=0,wl=0,pw=0;
 const corner=(i,j,w)=>{const c=code(i,j),m=GROUND[c]||1;if(m===4)ww+=w;else if(m===2)wd+=w;else if(m===3){wc+=w;if(w>pw){pw=w;gp=plazaAt(i,j);}}else wg+=w;if(c===4)wl+=w;};
 function ground(U,V,sx,sy){
  const fu=(U-8)/16,fv=(V-8)/16,i0=Math.floor(fu),j0=Math.floor(fv),tx=fu-i0,ty=fv-j0;
  wg=wd=wc=ww=wl=pw=0;gp=TEX.cobble;corner(i0,j0,(1-tx)*(1-ty));corner(i0+1,j0,tx*(1-ty));corner(i0,j0+1,(1-tx)*ty);corner(i0+1,j0+1,tx*ty);const pz=wc;
  // Routes et ruelles analytiques : bord net, sans escalier de cases.
  const i=Math.floor(U/16),j=Math.floor(V/16);
  if(roadsOf)for(const r of roadsOf(i,j)){const dx=r.b[0]-r.a[0],dy=r.b[1]-r.a[1],len=dx*dx+dy*dy||1,t=clamp(((U-r.a[0])*dx+(V-r.a[1])*dy)/len,0,1),d=Math.hypot(U-r.a[0]-t*dx,V-r.a[1]-t*dy),w=clamp((r.width-d)/7+.5,0,1);if(w>0){if(r.paved)wc=Math.max(wc,w);else wd=Math.max(wd,w);}}
  if(lanesOf)for(const l of lanesOf(i,j)){const d=Math.max(l.x-U,U-(l.x+l.w),l.y-V,V-(l.y+l.h)),w=clamp(-d/6+.5,0,1);if(w>0){if(l.paved)wc=Math.max(wc,w);else wd=Math.max(wd,w);}}
  // Pièces standard (cases de 2 m) : chemin, rue pavée, ruisseau.
  let wp=0;const ci=Math.floor(U/32),cj=Math.floor(V/32),list=piecesAt(ci,cj);
  if(list.length){const lu=U-ci*32,lv=V-cj*32,mx=Math.floor(lu-lv+32),my=Math.floor((lu+lv)/2);
   for(const pc of list){const q=pc.m.px[my*64+mx]||0,w=LEVEL[q];if(!w)continue;if(pc.kind==='water')ww=Math.max(ww,w);else if(pc.kind==='paving'){if(w>=wc)gp=pc.tex;wc=Math.max(wc,w);wp=Math.max(wp,w);}else{wd=Math.max(wd,w);wp=Math.max(wp,w);}}}
  if(ww>.5&&wp>.6){gm=M_PLANK;gw=0;return;}
  // Une place pavée garde son pavage : le chemin de terre s'arrête à son bord.
  if(pz>.5)wd=0;
  if(wd+wc>0){const land=Math.max(0,1-ww-wd-wc);wg=Math.min(wg,land);}
  const sg=wg+K*(hgt(TEX.grass,sx,sy)-.5),sd=wd?wd+K*(hgt(TEX.dirt,sx,sy)-.5):-9,sc=wc?wc+K*(hgt(gp,sx,sy)-.5):-9,landBest=Math.max(sg,sd,sc);
  // L'eau gagne quand sa part dépasse la moitié, déformée par la hauteur des rives.
  const bankH=hgt(TEX.bank,sx,sy);gw=ww;
  if(ww>.5+K*.6*(bankH-.5)){gm=M_WATER;return;}
  if(ww>.2+K*.5*(bankH-.5)){gm=M_BANK;return;}
  if(landBest===sc&&wc){gm=M_COBBLE;return;}
  if(landBest===sd&&wd){gm=M_DIRT;return;}
  gm=wl>0&&wl*1.4+K*(hgt(TEX.litter,sx,sy)-.5)>.62?M_LITTER:M_GRASS;
 }
 // Tablier du pont : planches perpendiculaires au chemin (texture en plan, 32 × 32).
 function plank(U,V){const P=TEX.plank;if(!P)return C('ecorce3');const pc=piecesAt(Math.floor(U/32),Math.floor(V/32)).find(p=>p.kind!=='water'),ns=pc&&(pc.mask&5)&&!(pc.mask&10);return tex(P,Math.floor(ns?U:V),Math.floor(ns?V:U));}
 // Herbe : plages claires et sombres à l'échelle de la dizaine de mètres ; leur
 // bord suit les touffes dessinées (hauteur de la texture), jamais un contour lisse.
 function grassColour(sx,sy,U,V){const c=tex(TEX.grass,sx,sy),n=vnoise(U/150,V/150,71)*.7+vnoise(U/56,V/56,72)*.3+(hgt(TEX.grass,sx,sy)-.5)*.7;return n>.48?shift(c,1):n<-.5?shift(c,-1):c;}
 function colourOf(m,w,sx,sy,U,V,p){
  switch(m){case M_PLANK:return plank(U,V);case M_GRASS:return grassColour(sx,sy,U,V);case M_DIRT:return tex(TEX.dirt,sx,sy);case M_COBBLE:return tex(p||TEX.cobble,sx,sy);case M_BANK:return tex(TEX.bank,sx,sy);case M_LITTER:return tex(TEX.litter,sx,sy);
   case M_WATER:{const c=tex(TEX.water,sx,sy);return w<.62?shift(c,1):w>.9?shift(c,-1):c;}}return 0;
 }
 // 1. Sol : matière et couleur pour chaque pixel du secteur (+ marge haute de 4 px).
 const MARGIN=4,GHp=height+MARGIN,mat=new Uint8Array(width*GHp),col=new Uint8Array(width*GHp),own=new Uint8Array(width*GHp),prio=new Uint8Array(width*height);
 for(let py=-MARGIN;py<height;py++){
  for(let px=0;px<width;px++){
   const X=px-ox+.5,Y=py-oy+.5,u=Y+X/2,v=Y-X/2,U=U0+u,V=V0+v,k=(py+MARGIN)*width+px;
   const li=Math.floor(u/16),lj=Math.floor(v/16);own[k]=li>=0&&lj>=0&&li<tiles[0]&&lj<tiles[1]?1:0;
   if(!own[k]&&py>=0)continue;
   if(py>=0)prio[py*width+px]=useAt(li+ti0,lj+tj0)?2:1;
   const sx=S0+px-ox,sy=T0+py-oy;ground(U,V,sx,sy);mat[k]=gm;col[k]=colourOf(gm,gw,sx,sy,U,V,gp);
  }
  if((py&3)===3)yield;
 }
 const at=(px,py)=>(py+MARGIN)*width+px;
 // 2. Lumière : ombre sous l'herbe, berge visible au loin, écume au bord proche.
 let upPx=0,upPy=0,upM=0;const up=n=>upPy-n>=-MARGIN?mat[at(upPx,upPy-n)]:upM;
 const out=new Uint8Array(width*height),cE0=C('ecorce0'),cE1=C('ecorce1'),cE2=C('ecorce2'),cE4=C('ecorce4'),cEau0=C('eau0'),cEau5=C('eau5'),cT2=C('terre2'),cT3=C('terre3');
 for(let py=0;py<height;py++){
  for(let px=0;px<width;px++){
   const k=at(px,py);if(!own[k])continue;let c=col[k];const m=mat[k],sx=S0+px-ox,sy=T0+py-oy;
   upPx=px;upPy=py;upM=m;
   if(m===M_WATER){
    if(up(1)===M_PLANK)c=cE2;else if(up(2)===M_PLANK)c=cE1;else if(up(3)===M_PLANK||up(4)===M_PLANK&&up(3)===M_WATER)c=cEau0;
    else if(landish(up(1)))c=cT3;else if(landish(up(2)))c=cT2;else if(landish(up(3)))c=cEau0;
    else if(py+1<height&&landish(mat[at(px,py+1)])&&hash(sx>>1,sy,3)<.45)c=cEau5;
   }else if(m===M_PLANK){if(!up(1)||up(1)===M_WATER)c=cE4;
   }else if(m===M_DIRT||m===M_BANK||m===M_COBBLE){if(up(1)===M_GRASS||up(1)===M_LITTER)c=shift(c,-2);else if(up(2)===M_GRASS&&hash(sx,sy,5)<.5)c=shift(c,-1);}
   else if((m===M_GRASS||m===M_LITTER)&&(up(1)===M_DIRT||up(1)===M_COBBLE||up(1)===M_BANK)&&hash(sx,sy,6)<.4)c=shift(c,1);
   out[py*width+px]=c;
  }
  if((py&15)===15)yield;
 }
 // 3. Décors au sol (fleurs, cailloux) sur l'herbe uniquement, par case du monde.
 if(STAMPS.length){
  for(let j=tj0-1;j<=tj0+tiles[1];j++)for(let i=ti0-1;i<=ti0+tiles[0];i++){
   if(code(i,j)!==0||!useAt(i,j))continue;const r=hash(i,j,11);if(r>(ASSETS.decalRate||.07))continue;
   const s=STAMPS[Math.floor(hash(i,j,12)*STAMPS.length)],u=i*16+2+hash(i,j,13)*12-U0,v=j*16+2+hash(i,j,14)*12-V0,px0=Math.round(u-v+ox-s.ax),py0=Math.round((u+v)/2+oy-s.ay);
   for(let y=0;y<s.h;y++)for(let x=0;x<s.w;x++){const c=s.px[y*s.w+x];if(!c)continue;const px=px0+x,py=py0+y;if(px<0||py<0||px>=width||py>=height)continue;const k=at(px,py);if(own[k]&&mat[k]===M_GRASS)out[py*width+px]=c;}
  }
 }
 yield;
 // 4. Reliefs naturels : contour lissé entre les centres des cases, jamais en
 // créneaux. Chaque pixel lance un rayon vertical : le premier point plein
 // rencontré donne le dessus herbeux ou la paroi, éclairée selon sa normale.
 const kind=new Uint8Array(width*height),blockOf=new Int32Array(width*height).fill(-1);
 const FS=TEX.cliffS,FE=TEX.cliffE,G=TEX.grass,cH6=C('herbe6'),cH5=C('herbe5'),cH3=C('herbe3'),cH2=C('herbe2');
 const near=new Uint8Array(GW*GH);let anyCliff=false;
 for(let j=0;j<GH;j++)for(let i=0;i<GW;i++){let a=0;for(let dj=-1;dj<=3&&!a;dj++)for(let di=-1;di<=3&&!a;di++)a=cliffAt(gi0+i+di,gj0+j+dj)?1:0;near[j*GW+i]=a;if(a)anyCliff=true;}
 const nearAt=(i,j)=>{const a=i-gi0,b=j-gj0;return a>=0&&b>=0&&a<GW&&b<GH&&near[b*GW+a];};
 const jitter=(U,V)=>(hash(Math.floor(U/6),Math.floor(V/6),31)-.5)*.08+(Math.sin(U*.21+V*.07)+Math.sin(V*.19-U*.05))*.035;
 function solid(U,V){
  const fu=(U-8)/16,fv=(V-8)/16,i0=Math.floor(fu),j0=Math.floor(fv),tx=fu-i0,ty=fv-j0;let f=0,h=0,c;
  c=code(i0,j0);if(c===6||c===8){f+=(1-tx)*(1-ty);h=Math.max(h,c===6?24:32);}
  c=code(i0+1,j0);if(c===6||c===8){f+=tx*(1-ty);h=Math.max(h,c===6?24:32);}
  c=code(i0,j0+1);if(c===6||c===8){f+=(1-tx)*ty;h=Math.max(h,c===6?24:32);}
  c=code(i0+1,j0+1);if(c===6||c===8){f+=tx*ty;h=Math.max(h,c===6?24:32);}
  return h&&f+jitter(U,V)>=.5?h:0;
 }
 const hits=[];
 if(anyCliff)for(let py=0;py<height;py++){
  for(let px=0;px<width;px++){
   const X=px-ox+.5,Y=py-oy+.5,gi=Math.floor((Y+X/2)/16)+ti0,gj=Math.floor((Y-X/2)/16)+tj0;
   if(!nearAt(gi,gj))continue;
   for(let z=32;z>=0;z--){
    const u=Y+z+X/2,v=Y+z-X/2,U=U0+u,V=V0+v,H=solid(U,V);if(!H||z>H)continue;
    // Case propriétaire (pour le tri avec les acteurs) : la case de relief la plus proche.
    let i=Math.floor(U/16),j=Math.floor(V/16);if(!cliffAt(i,j)){const c=[[i-1,j],[i,j-1],[i-1,j-1],[i+1,j],[i,j+1]].find(([a,b])=>cliffAt(a,b));if(c)[i,j]=c;}
    const li=i-ti0,lj=j-tj0;if(li<0||lj<0||li>=tiles[0]||lj>=tiles[1])break;
    const k=py*width+px;
    // Relief d'une case dessinée ailleurs : son ancien dessin passe devant.
    if(!useAt(i,j)){if(prio[k]===2)prio[k]=1;break;}
    const sx=S0+px-ox;
    if(z===H){out[k]=tex(G,sx,T0+py-oy+H);kind[k]=1;}
    else{
     const e=1.5,gu=solid(U+e,V)-solid(U-e,V),gv=solid(U,V+e)-solid(U,V-e),nu=-gu,nv=-gv,light=(nv-nu)/(Math.hypot(nu,nv)||1),row=H-z;
     let c=light>.45?tex(FS,sx,row):light<-.45?tex(FE,sx,row):shift(tex(FS,sx,row),-1);if(z<2)c=shift(c,-1);
     out[k]=c;kind[k]=light>-.45?2:3;
    }
    prio[k]=2;blockOf[k]=lj*tiles[0]+li;hits.push(k);break;
   }
  }
  if((py&3)===3)yield;
 }
 // Rebords : lèvre claire, herbe qui retombe, pied sombre sur le sol.
 for(const k of hits){const kd=kind[k];if(k+width>=out.length||k<width)continue;const px=k%width,sx=S0+px-ox;
  if(kd===1&&kind[k+width]>1){out[k]=kind[k+width]===2?cH6:cH5;continue;}
  if(kd>1&&kind[k-width]===1){const n=Math.floor(hash(sx,0,21)*4);for(let d=0;d<[0,1,2,1][n]&&kind[k+d*width]>1;d++)out[k+d*width]=d?cH2:cH3;}
 }
 for(const k of hits){if(kind[k]<2)continue;const px=k%width,py=(k-px)/width;if(py+1>=height||kind[k+width])continue;for(let d=1;d<=2&&py+d<height;d++){const q=k+d*width;if(kind[q]||!own[at(px,py+d)])break;out[q]=shift(out[q],d===1?-2:-1);}}
 const blocks=new Map();for(const k of hits){const b=blockOf[k];if(!blocks.has(b))blocks.set(b,{faces:false,x0:1e9,y0:1e9,x1:-1,y1:-1,list:[]});const B=blocks.get(b),px=k%width,py=(k-px)/width;B.list.push(k);if(kind[k]>1)B.faces=true;B.x0=Math.min(B.x0,px);B.x1=Math.max(B.x1,px);B.y0=Math.min(B.y0,py);B.y1=Math.max(B.y1,py);}
 yield;
 // Image RGBA et pièces de relief qui passent devant les acteurs.
 const data=new Uint8ClampedArray(width*height*4);for(let k=0;k<out.length;k++)if(prio[k]&&out[k])data.set(RGB[out[k]],k*4);else{prio[k]=0;out[k]=0;}
 const features=[];
 for(const [id,B]of blocks){if(!B.faces)continue;const w=B.x1-B.x0+1,h=B.y1-B.y0+1,fd=new Uint8ClampedArray(w*h*4);
  for(const k of B.list){const px=k%width,py=(k-px)/width;fd.set(RGB[out[k]],((py-B.y0)*w+px-B.x0)*4);}
  const li=id%tiles[0],lj=Math.floor(id/tiles[0]);features.push({width:w,height:h,data:fd,x:B.x0-ox,y:B.y0-oy,depth:(li+lj)*8+16,tile:[li+ti0,lj+tj0]});}
 return {width,height,data,features,indices:out,priority:prio};
}
function render(o){const steps=renderSteps(o);let next;do{next=steps.next();}while(!next.done);return next.value;}
// Flore : variantes décodées {name, w, h, ax, ay, px, sh} ; ombre à l'opacité du calque Piskel.
const FLORA={};for(const [k,v]of Object.entries(ASSETS.flora||{}))FLORA[k]={shadow:v.shadow,frames:v.frames.map(decode)};
return {render,renderSteps,palette:PAL,rgb:RGB,shift,C,flora:FLORA,sets:Object.keys(SETS),shapes:SHAPES};
});
