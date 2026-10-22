'use strict';
/* Rendu « mûr » des biomes, à la manière de la forteresse gobeline : grain de
 * matière tramé (Bayer 4 × 4) au lieu d'aplats, rampes longues et sourdes,
 * lumière en haut à gauche, ombre de contact sous chaque relief.
 * Les sols sont pensés dans le plan du sol (U, V) puis lus à l'écran :
 * U = y + ½ + (x + ½)/2, V = y + ½ − (x + ½)/2. Une période P au sol donne
 * une texture raccordable de 2P × P à l'écran (multiple de 32 × 16). */
const {rng,Grid,scatter,line}=require('./brushes.cjs'),P=require('./palette.cjs');
const mod=(a,n)=>((a%n)+n)%n,clamp=(v,a,b)=>v<a?a:v>b?b:v;
const hash=(...k)=>{let h=2166136261;for(const n of k){h=Math.imul(h^(n&0xffff),16777619);h=Math.imul(h^(n>>>16),16777619);}h=Math.imul(h^(h>>>13),1274126177);return ((h^(h>>>16))>>>0)/4294967296;};
const BAYER=[0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5];
// Arrondit v selon la trame : deux tons voisins se mêlent sans marches.
const dither=(x,y,v)=>{const f=Math.floor(v);return f+((v-f)*16>BAYER[mod(y,4)*4+mod(x,4)]+.5?1:0);};
const UV=(x,y)=>[y+.5+(x+.5)/2,y+.5-(x+.5)/2];
const smooth=t=>t*t*(3-2*t);
// Bruit de valeur au sol (0 à 1), périodique de P ; cellules d'environ s unités.
function gnoise(u,v,s,seed,Pd){const n=Math.max(1,Math.round(Pd/s)),c=Pd/n,fu=u/c,fv=v/c,u0=Math.floor(fu),v0=Math.floor(fv),a=smooth(fu-u0),b=smooth(fv-v0),h=(i,j)=>hash(mod(i,n),mod(j,n),seed);
 return (h(u0,v0)*(1-a)+h(u0+1,v0)*a)*(1-b)+(h(u0,v0+1)*(1-a)+h(u0+1,v0+1)*a)*b;}
// Somme d'octaves (−1 à 1) : [[taille, poids], …].
function fbm(u,v,Pd,seed,octaves=[[32,1],[12,.5],[5,.25]]){let s=0,w=0;octaves.forEach(([sz,k],i)=>{s+=(gnoise(u,v,sz,seed+i*17,Pd)-.5)*2*k;w+=k;});return s/w;}
// Bruit écran périodique (W × H), cellules 2:1 : grain fin des pierres et des sprites.
function snoise(x,y,s,seed,W,H){const nx=Math.max(1,Math.round(W/(s*2))),ny=Math.max(1,Math.round(H/s)),fx=x/W*nx,fy=y/H*ny,x0=Math.floor(fx),y0=Math.floor(fy),a=smooth(fx-x0),b=smooth(fy-y0),h=(i,j)=>hash(mod(i,nx),mod(j,ny),seed);
 return (h(x0,y0)*(1-a)+h(x0+1,y0)*a)*(1-b)+(h(x0,y0+1)*(1-a)+h(x0+1,y0+1)*a)*b;}
const rampLen=r=>P.RAMPS[r].length;
const tone=(ramp,t)=>ramp+clamp(Math.round(t),0,rampLen(ramp)-1);
const dtone=(ramp,t,x,y)=>ramp+clamp(dither(x,y,t),0,rampLen(ramp)-1);
const toneOf=name=>{const m=/^(.*?)(\d+)$/.exec(name);return m?[m[1],+m[2]]:[name,0];};
// Décale un nom de couleur dans sa rampe ('jonc5', −2 -> 'jonc3').
const shiftName=(c,d)=>{const [r,t]=toneOf(c);return tone(r,t+d);};

/* Sol raccordable : P au sol, 2P × P à l'écran. f(x, y, u, v) -> [couleur, hauteur]. */
function surface(Pd,f,{fill,height=.5}={}){const g=new Grid(Pd*2,Pd,{wrap:true,fill,height});
 for(let y=0;y<g.h;y++)for(let x=0;x<g.w;x++){const [u,v]=UV(x,y),r=f(x,y,u,v);if(r)g.set(x,y,r[0],r[1]);}return g;}
// Assombrit (d < 0) ou éclaire un pixel dans sa rampe, en gardant sa hauteur.
const shade=(g,x,y,d)=>{if(d)g.shift(x,y,d);};

/* Touffe d'herbe : brins fins en éventail, pointe éclairée, pied sombre et
 * ombre de contact en bas à droite. b : ton de base dans la rampe. */
function tuft(g,x,y,{ramp,b,n=5,len=[2,5],spread=4,R,dead=null,deadRate=0,lean=0,h=1}){
 const top=rampLen(ramp)-1;
 // Ombre de contact : ellipse plate sous la touffe, décalée vers la droite.
 for(let dx=-Math.ceil(spread/2);dx<=Math.ceil(spread/2)+1;dx++)if(R()<.85)shade(g,x+dx+1,y+1,-1);
 shade(g,x,y+1,-1);
 for(let k=0;k<n;k++){
  const t=n>1?k/(n-1)-.5:0,bx=x+Math.round(t*spread),L=len[0]+Math.floor(R()*(len[1]-len[0]+1)),tilt=t*1.6+lean+(R()-.5)*.8,isDead=dead&&R()<deadRate;
  for(let s=0;s<=L;s++){const f=s/L,px=bx+Math.round(tilt*f*f*L/3),py=y-s;
   const lit=f>.65?(tilt<.3?2:1):f>.3?.5:-1,c=isDead?tone(dead.ramp,dead.b+lit):tone(ramp,clamp(b+lit+(s===0?-1:0),0,top));
   g.set(px,py,c,h*(.55+.45*f));}
 }
}
/* Caillou ou galet : bombé, éclat en haut à gauche, ombre propre et portée. */
function pebble(g,x,y,{ramp,b,w=3,hgt=2,R,cast=-2,h=.9}){
 for(let dy=-hgt+1;dy<=0;dy++)for(let dx=0;dx<w;dx++){const ex=(dx+.5)/w*2-1,ey=(dy+hgt-.5)/hgt*2-1;if(ex*ex+ey*ey>1.25)continue;
  const l=-ex*.6-ey*.8;g.set(x+dx,y+dy,tone(ramp,b+(l>.45?2:l>-.1?1:l>-.6?0:-1)),h);}
 for(let dx=1;dx<=w;dx++)shade(g,x+dx,y+1,cast);
}

/* Cellules aplaties (Voronoï 2:1) qui pavent une texture raccordable :
 * own[k] = cellule du pixel, edge[k] = écart à la cellule voisine (0 au
 * joint), dx/dy = position du pixel par rapport au centre de sa cellule. */
function cells(W,H,size,R,{aniso=1.9}={}){
 const pts=scatter(W,H,size,R,{aniso}),own=new Int32Array(W*H),edge=new Float32Array(W*H),ddx=new Float32Array(W*H),ddy=new Float32Array(W*H);
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){let best=1e9,b2=1e9,k=-1,bx=0,by=0;for(let i=0;i<pts.length;i++){let dx=x-pts[i][0],dy=y-pts[i][1];if(dx>W/2)dx-=W;else if(dx<-W/2)dx+=W;if(dy>H/2)dy-=H;else if(dy<-H/2)dy+=H;const d=dx*dx+(dy*aniso)**2;if(d<best){b2=best;best=d;k=i;bx=dx;by=dy;}else if(d<b2)b2=d;}
  const j=y*W+x;own[j]=k;edge[j]=Math.sqrt(b2)-Math.sqrt(best);ddx[j]=bx;ddy[j]=by;}
 const at=(x,y)=>mod(y,H)*W+mod(x,W);
 return {pts,n:pts.length,own:(x,y)=>own[at(x,y)],edge:(x,y)=>edge[at(x,y)],dx:(x,y)=>ddx[at(x,y)],dy:(x,y)=>ddy[at(x,y)]};
}
/* Herbe en mottes : chaque cellule est une motte bombée, claire en haut à
 * gauche, creusée d'un sillon sombre dessous ; des pointes de brins partent
 * de son bord haut et débordent sur la motte voisine. look(x, y, k) donne
 * {ramp, b, tips} ou null (le pixel garde sa matière). */
function clumps(g,C,look,{R,crevice=1.4,gain=1.6,grain=.9,seed=1,h=.6}){
 const W=g.w,H=g.h,info=[];for(let k=0;k<C.n;k++)info.push(look(...C.pts[k],k));
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){
  const k=C.own(x,y),L=info[k];if(!L)continue;const e=C.edge(x,y),dx=C.dx(x,y),dy=C.dy(x,y);
  let t=L.b+(-dy*.32-dx*.08)*gain*.5+(snoise(x,y,2,seed+7,W,H)-.5)*grain*2;
  if(C.own(x,y+1)!==k||C.own(x+1,y+1)!==k)t-=crevice;else if(e<1.2&&dy>0)t-=crevice*.5;else if(e<1.5&&dy<0)t+=.5;
  g.set(x,y,dtone(L.ramp,t,x,y),h-.15+(1-Math.min(1,e/4))*-.1+.1);
 }
 // Pointes de brins sur le bord haut de chaque motte.
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){const k=C.own(x,y),L=info[k];if(!L||!L.tips||C.own(x,y-1)===k)continue;if(hash(x,y,seed+3)>L.tips.rate)continue;
  const n=L.tips.len[0]+Math.floor(hash(x,y,seed+4)*(L.tips.len[1]-L.tips.len[0]+1)),lean=hash(x,y,seed+5)<.3?-1:hash(x,y,seed+5)>.8?1:0;
  for(let s=0;s<n;s++){const px=x+(s===n-1?lean:0),py=y-1-s;g.set(px,py,tone(L.ramp,L.b+1+(s===n-1?1:0)+(L.tips.lit||0)),h+.3);}
 }
}
/* Pavage raccordable : pattern(u, v) -> {key, along, across, size} dans le
 * plan du sol (rue est-ouest ; axis 'v' : tourné pour les rues nord-sud).
 * joint(x, y, coin) colore les joints ; shader({s, x, y, r, edge, deep})
 * renvoie [couleur, hauteur] pour la pierre (r : tirage propre à la pierre,
 * edge : bord haut-gauche, deep : près du bord bas-droit). */
const hstr=(s,seed=0)=>{let h=2166136261^seed;for(let i=0;i<s.length;i++)h=Math.imul(h^s.charCodeAt(i),16777619);h=Math.imul(h^(h>>>13),1274126177);return ((h^(h>>>16))>>>0)/4294967296;};
function pave(W,H,pattern,{axis='u',joint,shader,hJoint=.15}){
 const g=new Grid(W,H,{wrap:true,height:hJoint}),cell=[];
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){const [U,V]=UV(x,y);cell.push(axis==='v'?pattern(V,U):pattern(U,V));}
 const key=(x,y)=>cell[mod(y,H)*W+mod(x,W)].key;
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){const s=cell[y*W+x],k=s.key,jr=key(x+1,y)!==k,jd=key(x,y+1)!==k;
  if(jr||jd){g.set(x,y,joint(x,y,jr&&jd),hJoint);continue;}
  const r=hstr(k,1),edge=key(x-1,y)!==k||key(x,y-1)!==k,deep=key(x,y+2)!==k||key(x+2,y)!==k,out=shader({s,x,y,r,edge,deep,axis});g.set(x,y,out[0],out[1]);}
 return g;
}
/* Sprites : grille + calque d'ombre portée, ancre au pied. */
class Sprite{constructor(w,h,ax,ay){this.g=new Grid(w,h);this.shadow=new Grid(w,h);this.w=w;this.h=h;this.ax=ax;this.ay=ay;}}
// Ombre portée au sol : ellipse aplatie, décalée vers le bas-droite (lumière en haut à gauche).
function castShadow(s,cx,cy,rx,ry,c){for(let y=Math.floor(cy-ry);y<=cy+ry;y++)for(let x=Math.floor(cx-rx);x<=cx+rx;x++)if(((x-cx)/rx)**2+((y-cy)/ry)**2<=1)s.shadow.set(x,y,c);}
// Contour sélectif : encre sombre en bas et à droite, rien en haut à gauche.
function outline(s,ink,{all=false}={}){const g=s.g,src=g.clone();for(let y=0;y<g.h;y++)for(let x=0;x<g.w;x++){if(src.get(x,y))continue;const l=src.get(x-1,y),u=src.get(x,y-1),r=src.get(x+1,y),d=src.get(x,y+1);if(l||u||all&&(r||d))g.set(x,y,ink);}}
/* Masse de feuillage volumétrique : grappes de feuilles (Voronoï), chacune
 * éclairée selon la normale d'une demi-sphère, avec une ombre propre en bas
 * à droite, des trouées sombres et un grain tramé entre deux tons. */
const LIGHT=(()=>{const v=[-.55,-.7,.45],l=Math.hypot(...v);return v.map(x=>x/l);})();
function foliage(s,cx,cy,rx,ry,ramp,{R,leaf=2.4,bias=0,gain=3.4,mid=null,holes=0,edge=1,droop=0,seed=1,shape=null,stretch=1.25,box=null}){
 const g=s.g,top=rampLen(ramp)-1,m=mid??top*.45,bumps=[];const nb=Math.round((rx+ry)*1.1);for(let i=0;i<nb;i++)bumps.push([R()*Math.PI*2,.6+R()*1.4]);
 const inside=shape||((x,y)=>{const dx=(x-cx)/rx,dy=(y-cy)/ry,a=Math.atan2(dy,dx);let r=1;for(const [b,k]of bumps){const d=Math.abs(((a-b+Math.PI*3)%(Math.PI*2))-Math.PI);r+=k*.08*edge*Math.max(0,1-d*rx/2)}if(droop&&dy>0)r+=droop*dy*.25;return dx*dx+dy*dy<=r*r*.95;});
 const [bx0,by0,bx1,by1]=box||[cx-rx*1.5,cy-ry*1.5,cx+rx*1.5,cy+ry*1.6],W=Math.ceil(bx1-bx0+8),H=Math.ceil(by1-by0+8),cells=scatter(W,H,leaf,R,{wrap:false,aniso:Math.min(1,stretch/1.25),max:4000}).map(([x,y])=>[x+bx0-4,y+by0-4]);
 const owner=(x,y)=>{let best=1e9,k=-1;for(let i=0;i<cells.length;i++){const d=(x-cells[i][0])**2+((y-cells[i][1])*stretch)**2;if(d<best){best=d;k=i;}}return k;};
 const lum=cells.map(([x,y])=>{const nx=(x-cx)/rx,ny=(y-cy)/ry,nz=Math.sqrt(Math.max(0,1-nx*nx-ny*ny));return nx*LIGHT[0]+ny*LIGHT[1]+nz*LIGHT[2];});
 const hole=cells.map(()=>R()<holes);
 for(let y=Math.floor(by0);y<=by1;y++)for(let x=Math.floor(bx0);x<=bx1;x++){
  if(!inside(x,y))continue;const k=owner(x,y);let t=m+bias+lum[k]*gain+(hash(k,seed)-.5)*.9;
  // Ombre propre de chaque grappe en bas à droite, éclat sur son bord haut-gauche.
  if(owner(x+1,y+1)!==k)t-=1.2;else if(owner(x-1,y-1)!==k)t+=.7;
  if(hole[k]&&lum[k]<.5)t-=2.2;
  g.set(x,y,dtone(ramp,clamp(t,0,top),x,y));
 }
 return inside;
}
// Tronc vertical : largeur hw(t) (t = 0 au pied, 1 en haut), cannelures, grain.
function trunk(s,cx,y0,y1,hw,{ramp='ecorcem',seed=1,flutes=0,light=6.2,lean=0}){
 const g=s.g,top=rampLen(ramp)-1;
 for(let y=y1;y<=y0;y++){const t=(y0-y)/Math.max(1,y0-y1),w=hw(t),c=cx+lean*t*(y0-y1),a=Math.round(c-w),b=Math.round(c+w);
  for(let x=a;x<=b;x++){const f=(x-a+.5)/Math.max(1,b-a+1);let tn=light-f*4.6+(snoise(x,y,1.5,seed,256,256)-.5)*1.5;
   if(flutes){const ph=(x-c)/Math.max(1,w);tn+=Math.sin(ph*Math.PI*flutes+seed)*.9*Math.min(1,(1-t)*2.5);}
   g.set(x,y,dtone(ramp,clamp(tn,0,top),x,y));}}
}
// Branche : trait de 1 à 2 px, dessus éclairé.
function branch(s,x0,y0,x1,y1,{ramp='ecorcem',thick=1,light=5}){line(s.g,x0,y0,x1,y1,tone(ramp,light-2));if(thick>1){line(s.g,x0,y0-1,x1,y1-1,tone(ramp,light));}}
module.exports={pave,hstr,cells,clumps,mod,clamp,hash,BAYER,dither,UV,gnoise,fbm,snoise,tone,dtone,toneOf,shiftName,rampLen,surface,shade,tuft,pebble,Sprite,castShadow,outline,foliage,trunk,branch,LIGHT,rng,scatter,Grid};
