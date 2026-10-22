'use strict';
/* Varan, marais : flore au rendu mûr. Cyprès chauves à contreforts et
 * mousse pendante, saules pleureurs, chicots blanchis, souches, roseaux,
 * massettes, fougères, champignons et rochers moussus. Lumière en haut à
 * gauche, feuillage en grappes tramées (matiere.cjs), contour sélectif
 * sombre en bas à droite, ombre portée sur un calque séparé. */
const M=require('./matiere.cjs'),{rng,Sprite,castShadow,outline,foliage,tone,dtone,hash,clamp,trunk,branch}=M,{line}=require('./brushes.cjs');
const INK='marais0';
// Mèches pendantes (mousse espagnole, rideaux de saule) : un brin par colonne.
function strands(s,x0,x1,yTop,len,{ramp,R,light=7,dark=3,every=1,gap=.15,seed=1,wave=3}){
 for(let x=x0;x<=x1;x+=every){if(R()<gap)continue;const top=yTop(x);if(top===null)continue;const L=Math.max(2,Math.round(len(x)+(R()-.5)*wave));
  const f=(x-x0)/Math.max(1,x1-x0),lit=light-f*(light-dark);
  for(let k=0;k<L;k++){const y=top+k,tn=lit-(k/L)*1.6+(hash(x,k,seed)<.2?1:0);if(s.g.get(x,y)&&k<2)continue;s.g.set(x+(k>L*.6&&hash(x,seed,3)<.3?1:0),y,tone(ramp,Math.round(tn)));}}
}
/* Cyprès chauve : pied évasé en contreforts cannelés, couronne en plateaux
 * de feuillage plume, mousse espagnole qui pend, pneumatophores autour. */
function cypres(seed,{w=80,h=124,tiers=5}={}){
 const R=rng(seed),s=new Sprite(w,h,w>>1,h-7),cx=w/2,base=h-7,top=base-96;
 castShadow(s,cx+10,base,28,8,'marais1');
 // Racines et pneumatophores (genoux) autour du pied.
 for(const [dx,len]of [[-11,-6],[9,7],[-5,-3],[13,4]]){line(s.g,cx+dx*.5,base-1,cx+dx+len,base+1,tone('ecorcem',2));line(s.g,cx+dx*.5,base-2,cx+dx+len*.8,base,tone('ecorcem',5));}
 for(const [dx,dy,hk]of [[-17,2,4],[15,3,3],[-9,4,3],[21,0,2],[6,5,2]]){for(let k=0;k<hk;k++){s.g.set(cx+dx,base+dy-k,tone('ecorcem',k===hk-1?6:4));s.g.set(cx+dx+1,base+dy-k,tone('ecorcem',k===hk-1?4:2));}s.g.set(cx+dx-1,base+dy,tone('ecorcem',3));s.g.set(cx+dx+2,base+dy,tone('ecorcem',1));}
 trunk(s,cx,base,top,t=>1.4+2.4*(1-t)+6.5*Math.max(0,1-t*4.2)**2,{seed,flutes:5,light:6.4});
 // Branches qui portent les plateaux.
 const levels=[];for(let k=0;k<tiers;k++){const f=k/(tiers-1),y=Math.round(top+8+f*50+(R()-.5)*4),side=k%2?1:-1,reach=10+R()*8+(1-Math.abs(f-.45))*10;levels.push({y,side,reach,f});
  branch(s,cx,y+6,cx+side*reach*.8,y,{thick:2});branch(s,cx,y+8,cx-side*reach*.4,y+3,{thick:1});}
 // Plateaux de feuillage : larges et plats, plus étroits en haut.
 const crowns=[[0,top+2,13,7,.9]];for(const L of levels){crowns.push([L.side*L.reach*.55,L.y-2,L.reach*.75+6,5+R()*2,.5-L.f*.9]);crowns.push([-L.side*L.reach*.35,L.y+2,L.reach*.45+4,4+R()*2,.1-L.f*.9]);}
 const masks=crowns.map(([dx,y,rx,ry,b],k)=>foliage(s,cx+dx,y,rx,ry,'frondaison',{R,leaf:1.9,gain:3.2,bias:b,edge:1.6,seed:seed+k,holes:.12}));
 outline(s,INK);
 // Mousse espagnole : mèches gris-vert sous chaque plateau.
 crowns.slice(1).forEach(([dx,y,rx,ry],k)=>{const inside=masks[k+1];strands(s,Math.round(cx+dx-rx*.8),Math.round(cx+dx+rx*.8),x=>{for(let yy=Math.round(y+ry+3);yy>y-ry;yy--)if(inside(x,yy))return yy+1;return null;},x=>3+5*Math.abs(Math.sin(x*.7+k))+(k%2?3:0),{ramp:'saule',R,light:8,dark:4,every:1,gap:.55,seed:seed+k,wave:4});});
 return s;
}
/* Saule pleureur : tronc court et noueux, silhouette en fontaine. Le
 * feuillage est fait de grappes pendantes (cellules étirées en hauteur),
 * claires en haut à gauche, sombres à droite et dessous ; des trouées
 * laissent voir le cœur d'ombre et le tronc ; ourlet ondulé près du sol. */
function saule(seed,{w=90,h=88}={}){
 const R=rng(seed),s=new Sprite(w,h,w>>1,h-5),cx=w/2,base=h-5,rx=w/2-6,top=base-70,cy=base-34;
 castShadow(s,cx+8,base,rx+2,9,'marais1');
 const hem=x=>base-7-Math.round(3+3*Math.sin(x*.29+seed)+2*Math.sin(x*.13+1)+((x-cx)/rx)**2*6);
 const shape=(x,y)=>{const f=(x-cx)/rx;if(Math.abs(f)>1||y>hem(x))return false;const yTop=top+Math.round((1-Math.sqrt(1-f*f*.92))*34+3*Math.sin(x*.4+seed)*Math.abs(f));return y>=yTop;};
 for(let x=Math.round(cx-rx);x<=cx+rx;x++)for(let y=top;y<=base;y++)if(shape(x,y))s.g.set(x,y,tone('saule',1));
 trunk(s,cx,base,base-30,t=>2.2+2.4*(1-t)+3*Math.max(0,1-t*5)**2,{seed,flutes:3,light:6.6,lean:.06});
 foliage(s,cx-6,cy-10,rx,36,'saule',{R,leaf:3.2,stretch:.32,gain:4.3,bias:1,holes:.22,seed,shape:(x,y)=>shape(x,y)&&!(Math.abs(x-cx-1)<4&&y>base-24&&hash(x,y,seed)<.85),box:[cx-rx,top,cx+rx,base]});
 // Pointes de brins sous l'ourlet et quelques brins clairs isolés.
 for(let x=Math.round(cx-rx);x<=cx+rx;x++){const y=hem(x);if(!shape(x,y)||hash(x,seed,4)<.4)continue;s.g.set(x,y+1,tone('saule',(x<cx?5:3)));if(hash(x,seed,5)<.3)s.g.set(x,y+2,tone('saule',x<cx?4:2));}
 outline(s,INK);
 return s;
}
/* Chicot : arbre mort blanchi, branches cassées, écorce qui pèle. */
function chicot(seed,{w=56,h=84}={}){
 const R=rng(seed),s=new Sprite(w,h,w>>1,h-5),cx=w/2,base=h-5,top=base-62;
 castShadow(s,cx+6,base,15,5,'marais1');
 trunk(s,cx,base,top,t=>1+2.2*(1-t)+3*Math.max(0,1-t*5)**2,{ramp:'roc',seed,flutes:2,light:9.2,lean:-.06});
 const arm=(x0,y0,a,len,d)=>{let x=x0,y=y0;for(let k=0;k<len;k++){const nx=x+Math.cos(a),ny=y+Math.sin(a);line(s.g,x,y,nx,ny,tone('roc',d>1?8:7));if(d>1)s.g.set(Math.round(nx),Math.round(ny)+1,tone('roc',5));x=nx;y=ny;a+=(R()-.5)*.25;}
  if(d>0)for(let k=0;k<2;k++)if(R()<.8)arm(x,y,a+(k?.6:-.6)+(R()-.5)*.3,len*.55,d-1);};
 arm(cx-1,top+18,-2.4,14,2);arm(cx+1,top+10,-.7,12,2);arm(cx,top+2,-1.6,8,1);arm(cx+1,top+30,-.3,9,1);
 // Écorce qui pèle : plaques sombres sur le tronc.
 for(let k=0;k<7;k++){const y=top+8+Math.floor(R()*48),x=cx-1+Math.floor(R()*3);s.g.set(x,y,tone('ecorcem',3));s.g.set(x,y+1,tone('ecorcem',2));}
 outline(s,INK);return s;
}
/* Souche : coupe aux cernes clairs, mousse, champignons en console. */
function souche(seed){
 const R=rng(seed),s=new Sprite(30,26,15,21),cx=15,base=21;castShadow(s,cx+4,base,11,3,'marais1');
 trunk(s,cx,base,base-9,t=>5.5+1.5*Math.max(0,1-t*3)**2,{seed,flutes:4,light:6});
 for(let y=-3;y<=3;y++)for(let x=-6;x<=6;x++){const e=(x/6)**2+(y/2.6)**2;if(e>1)continue;const r=Math.hypot(x/6,y/2.6);s.g.set(cx+x,base-10+y,tone('ecorcem',r>.82?4:Math.floor(r*8)%2?7:8));}
 for(let x=-6;x<=6;x++)if(R()<.5)s.g.set(cx+x,base-12-(R()<.3?1:0),tone('mousse',3));
 for(const [dx,dy]of [[5,-5],[6,-3],[-6,-4]]){s.g.set(cx+dx,base+dy,tone('vase',9));s.g.set(cx+dx+(dx>0?1:-1),base+dy,tone('vase',8));s.g.set(cx+dx,base+dy+1,tone('vase',5));}
 outline(s,INK);return s;
}
/* Roseaux : tiges serrées, feuilles qui retombent, plumets bruns. */
function roseaux(seed,{n=18,height=30,w=34}={}){
 const R=rng(seed),h=height+8,s=new Sprite(w,h,w>>1,h-4),cx=w/2,base=h-4;castShadow(s,cx+5,base,12,3,'marais1');
 const stems=[];for(let k=0;k<n;k++){const x0=cx+(R()-.5)*12,L=height*(.55+R()*.45),bend=(R()-.5)*6+(x0-cx)*.3;stems.push({x0,L,bend,front:R()});}
 stems.sort((a,b)=>a.front-b.front);
 for(const st of stems){const f=(st.x0-cx+8)/16,lit=st.front>.5?(f<.5?8:7):(f<.5?6:4);let px=st.x0,py=base;
  for(let k=0;k<=st.L;k++){const t=k/st.L,x=st.x0+st.bend*t*t,y=base-k;s.g.set(x,y,tone('jonc',lit-(k<3?2:0)));px=x;py=y;}
  if(st.front>.35)for(let k=0;k<3;k++){s.g.set(px,py-k-1,tone('tourbe',6-k));s.g.set(px+1,py-k,tone('tourbe',k?4:5));if(k===1)s.g.set(px-1,py-k,tone('tourbe',7));}
  // Feuille : part de la tige et retombe vers l'extérieur.
  if(R()<.55){const y0=base-st.L*(.3+R()*.3),dir=st.x0<cx?-1:1,len=6+R()*5;let x=st.x0+st.bend*.2,y=y0;for(let k=0;k<len;k++){x+=dir*.8;y+=-.5+k*.13;s.g.set(x,y,tone('jonc',lit-1));}}}
 outline(s,INK);return s;
}
/* Massettes : tiges raides, épis bruns veloutés, feuilles en lame. */
function massettes(seed){
 const R=rng(seed),s=new Sprite(30,40,15,36),cx=15,base=36;castShadow(s,cx+4,base,10,3,'marais1');
 for(let k=0;k<9;k++){const x0=cx+(R()-.5)*10,L=14+R()*14,dir=x0<cx?-1:1;let x=x0,y=base;for(let j=0;j<L;j++){x+=dir*(j/L)*.6;y-=1;s.g.set(x,y,tone('jonc',dir<0?7:5));}}
 for(let k=0;k<5;k++){const x=Math.round(cx-6+k*3+(R()-.5)*2),L=20+Math.floor(R()*10);for(let y=base;y>base-L;y--)s.g.set(x,y,tone('jonc',k<2?7:5));
  for(let j=0;j<6;j++){s.g.set(x,base-L+2+j,tone('tourbe',j===0?6:j<4?4:3));s.g.set(x+1,base-L+2+j,tone('tourbe',j<4?2:1));}s.g.set(x,base-L,tone('jonc',8));s.g.set(x,base-L+1,tone('jonc',8));}
 outline(s,INK);return s;
}
/* Fougère royale : frondes en rosette, folioles alternées, pied sombre. */
function fougere(seed){
 const R=rng(seed),s=new Sprite(38,26,19,22),cx=19,base=22;castShadow(s,cx+4,base,13,3,'marais1');
 for(const [a,len]of [[-2.8,13],[-2.4,15],[-2,14],[-1.6,12],[-1.2,14],[-.8,15],[-.4,13],[-3,9],[-.15,9]]){
  const ex=cx+Math.cos(a)*len*1.3,ey=base+Math.sin(a)*len*.95,mx=cx+(ex-cx)*.6,my=base+(ey-base)*.75-1,lit=a<-1.6?1:0;
  line(s.g,cx,base,mx,my,tone('frondaison',4));line(s.g,mx,my,ex,ey+2,tone('frondaison',5));
  for(let t=.2;t<1;t+=.12){const x=t<.6?cx+(mx-cx)*t/.6:mx+(ex-mx)*(t-.6)/.4,y=t<.6?base+(my-base)*t/.6:my+(ey+2-my)*(t-.6)/.4,d=a<-1.57?-1:1;
   s.g.set(x,y-1,tone('frondaison',7+lit+(t>.5?1:0)));s.g.set(x-d,y,tone('frondaison',5+lit));s.g.set(x+d,y,tone('frondaison',6+lit));}
  s.g.set(ex,ey+2,tone('frondaison',9));}
 outline(s,INK);return s;
}
/* Champignons : bouquet de chapeaux pâles sur un tapis de mousse. */
function champignons(seed){
 const R=rng(seed),s=new Sprite(20,16,10,13),g=s.g;castShadow(s,11,13,7,2,'marais1');
 for(let x=3;x<17;x++)if(R()<.8)g.set(x,13,tone('mousse',1+(R()<.4?1:0)));
 for(const [x,y,r]of [[6,8,3],[12,9,2],[9,5,3],[15,11,1]]){for(let k=0;k<13-y;k++)g.set(x,y+1+k,tone('vase',k?8:6));
  for(let dx=-r;dx<=r;dx++){g.set(x+dx,y,tone('vase',dx<0?10:dx>r/2?7:9));if(Math.abs(dx)<r)g.set(x+dx,y-1,tone(dx<0?'fleurm':'vase',dx<0?0:10));}
  g.set(x+r,y+1,tone('vase',4));g.set(x-r,y+1,tone('vase',6));}
 outline(s,INK);return s;
}
/* Rocher moussu : facettes de pierre, calotte de mousse, pied dans la vase. */
function rocher(seed,{w=36,h=28}={}){
 const R=rng(seed),s=new Sprite(w,h,w>>1,h-5),cx=w/2,base=h-5;castShadow(s,cx+4,base,15,4,'marais1');
 const inside=foliage(s,cx,base-9,13*(w/36),10*(h/28),'roc',{R,leaf:5,gain:2.8,bias:-.3,edge:.4,seed});
 for(let x=0;x<w;x++)for(let y=base;y<h;y++)s.g.set(x,y,null);
 for(let x=0;x<w;x++)for(let y=0;y<base;y++){const v=s.g.name(x,y);if(!v)continue;const cap=((x-cx+2)/(w*.32))**2+((y-(base-17*(h/28)))/(h*.24))**2<1;
  if(cap)s.g.set(x,y,tone('mousse',!s.g.get(x,y-1)?4:M.toneOf(v)[1]>5?3:2));else if(y>base-3&&hash(x,y,seed)<.6)s.g.set(x,y,tone('vase',3));}
 for(let x=0;x<w;x++)for(let y=1;y<h;y++)if(s.g.name(x,y)?.startsWith('roc')&&s.g.name(x,y-1)?.startsWith('mousse')&&hash(x,y,seed+1)<.6)s.g.set(x,y,tone('mousse',1));
 outline(s,INK);return s;
}
function all(){return {
 cypres_a:cypres(401),cypres_b:cypres(402,{w:72,h:112,tiers:4}),saule_a:saule(411),saule_b:saule(412,{w:82,h:80}),chicot:chicot(421),souche:souche(431),
 roseaux_a:roseaux(441),roseaux_b:roseaux(442,{n:13,height:24,w:28}),massettes:massettes(451),fougere:fougere(461),champignons:champignons(471),rocher_a:rocher(481),rocher_b:rocher(482,{w:28,h:24})};}
module.exports={all,cypres,saule,chicot,souche,roseaux,massettes,fougere,champignons,rocher,strands};
if(require.main===module){
 const {save}=require('./png.cjs'),{Grid}=require('./brushes.cjs'),F=all(),list=Object.values(F),W=Math.max(...list.map(s=>s.w)),H=Math.max(...list.map(s=>s.h));
 const tiles=list.map(s=>{const g=new Grid(W,H,{fill:'jonc4'});for(let y=0;y<s.h;y++)for(let x=0;x<s.w;x++){const ty=y+H-s.h,tx=x+((W-s.w)>>1);if(s.shadow.get(x,y))g.set(tx,ty,'jonc2');const v=s.g.get(x,y);if(v)g.px[ty*W+tx]=v;}return g;});
 save((process.argv[2]||'.')+'/varan-flore.png',tiles,{scale:3,cols:7,gap:2,bg:'#111'});console.log('ok');
}
