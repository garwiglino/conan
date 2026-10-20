'use strict';
/* Teremor : flore et rochers. Sprites dressés, pied ancré au sol.
 * Feuillage en grappes : chaque grappe de feuilles reçoit une seule teinte
 * selon la lumière en haut à gauche (pas de bruit pixel), contour sélectif
 * sombre en bas à droite, ombre portée sur un calque séparé. */
const {rng,Grid,scatter,line,stamp}=require('./brushes.cjs');
const L=(()=>{const v=[-.55,-.75,.45],l=Math.hypot(...v);return v.map(x=>x/l);})();
class Sprite{
 constructor(w,h,ax,ay){this.g=new Grid(w,h);this.shadow=new Grid(w,h);this.ax=ax;this.ay=ay;this.w=w;this.h=h;}
}
// Une masse de feuilles : bord dentelé de feuilles, grappes de 2-4 px teintées par la lumière.
function clump(s,cx,cy,rx,ry,ramp,{R,bias=0,leaf=2.6,max=7,gaps=0,smooth=false,gain=3}){
 const g=s.g,bumps=[];const n=smooth?0:Math.round((rx+ry)*0.9);for(let i=0;i<n;i++)bumps.push([R()*Math.PI*2,1+R()*1.6]);
 const inside=(x,y)=>{const dx=(x-cx)/rx,dy=(y-cy)/ry,a=Math.atan2(dy,dx);let r=1;for(const [b,k]of bumps){const d=Math.abs(((a-b+Math.PI*3)%(Math.PI*2))-Math.PI);r+=k*.09*Math.max(0,1-d*rx/2.2);}return dx*dx+dy*dy<=r*r*.92;};
 const cells=scatter(Math.ceil(rx*2+6),Math.ceil(ry*2+6),leaf,R,{wrap:false,aniso:1}).map(([x,y])=>[x+cx-rx-3,y+cy-ry-3]);
 const owner=(x,y)=>{let best=1e9,k=-1;for(let i=0;i<cells.length;i++){const d=(x-cells[i][0])**2+((y-cells[i][1])*1.2)**2;if(d<best){best=d;k=i;}}return k;};
 const tone=cells.map(([x,y])=>{const nx=(x-cx)/rx,ny=(y-cy)/ry,nz=Math.sqrt(Math.max(0,1-nx*nx-ny*ny)),d=nx*L[0]+ny*L[1]+nz*L[2];return d*gain+3.1+bias+(R()-.5)*.8;});
 for(let y=Math.floor(cy-ry*1.4);y<=cy+ry*1.4;y++)for(let x=Math.floor(cx-rx*1.4);x<=cx+rx*1.4;x++){
  if(!inside(x,y))continue;const k=owner(x,y);if(gaps&&R()<gaps*.02)continue;
  let t=tone[k];
  // Séparation des grappes : bord bas-droit d'une grappe d'un ton plus sombre.
  if(owner(x+1,y+1)!==k)t-=1;
  g.set(x,y,ramp+Math.max(0,Math.min(max,Math.round(t))));
 }
 return inside;
}
// Contour sélectif : sombre en bas et à droite, fondu en haut à gauche.
function outline(s,ramp){const g=s.g,src=g.clone();for(let y=0;y<g.h;y++)for(let x=0;x<g.w;x++){if(src.get(x,y))continue;const r=src.get(x-1,y),u=src.get(x,y-1),l=src.get(x+1,y),d=src.get(x,y+1);if(r||u)g.set(x,y,ramp+'0');else if(d&&(src.get(x-1,y+1)||src.get(x+1,y+1)))continue;}}
function ellipseShadow(s,cx,cy,rx,ry,c='herbe0'){for(let y=Math.floor(cy-ry);y<=cy+ry;y++)for(let x=Math.floor(cx-rx);x<=cx+rx;x++)if(((x-cx)/rx)**2+((y-cy)/ry)**2<=1)s.shadow.set(x,y,c);}
function trunk(s,x,y0,y1,w,{R,ramp='ecorce',roots=true}){
 const g=s.g;for(let y=y1;y<=y0;y++){const t=(y-y1)/(y0-y1),hw=w/2*(1+(roots&&t>.8?(t-.8)*3:0))+(t>.9&&roots?1:0);
  const a=Math.round(x-hw),b=Math.round(x+hw)-1;for(let xx=a;xx<=b;xx++){const f=(xx-a)/Math.max(1,b-a);let c=f<.25?4:f<.55?3:f<.8?2:1;if(ramp==='tronc')c=f<.3?3:f<.6?2:1;if(ramp==='bouleau'){c=f<.3?5:f<.7?4:f<.9?3:1;}g.set(xx,y,ramp+c);}
  g.set(a-1,y,ramp+'0');g.set(b+1,y,ramp+'0');}
}
function oak(seed,{w=72,h=84}={}){
 const R=rng(seed),s=new Sprite(w,h,Math.floor(w/2),h-5),cx=w/2,base=h-5;
 ellipseShadow(s,cx+5,base,25,8);
 trunk(s,cx,base,base-26,8,{R,ramp:'tronc'});
 for(let y=base-24;y<base-2;y+=2+Math.floor(R()*3))s.g.set(cx-1+Math.floor(R()*3),y,'tronc1');
 // Maîtresses branches épaisses de 2 px, éclairées sur le dessus.
 for(const [x0,y0,x1,y1]of [[cx-2,base-18,cx-11,base-28],[cx+2,base-20,cx+10,base-30],[cx,base-22,cx-1,base-32]]){line(s.g,x0,y0,x1,y1,'tronc1');line(s.g,x0,y0-1,x1,y1-1,'tronc3');}
 const top=base-47,clumps=[[0,-2,25,16,-.9],[-15,6,14,10,-1.2],[15,6,15,10,-1.4],[-10,-12,15,12,.1],[10,-13,15,12,-.1],[-1,-19,14,11,.7],[-17,-3,11,9,.3],[18,-4,10,9,-.5],[1,7,13,8,-.8]];
 for(const [dx,dy,rx,ry,b]of clumps)clump(s,cx+dx+(R()-.5)*3,top+dy+(R()-.5)*2,rx*(.9+R()*.2),ry*(.9+R()*.2),'feuille',{R,bias:b,max:7,gain:3.2});
 for(const [dx,len]of [[-5,-5],[5,5]]){line(s.g,cx+dx,base,cx+dx+len,base+2,'tronc1');line(s.g,cx+dx,base-1,cx+dx+len/2,base+1,'tronc3');}
 outline(s,'feuille');return s;
}
function birch(seed,{w=48,h=96}={}){
 const R=rng(seed),s=new Sprite(w,h,Math.floor(w/2),h-5),cx=w/2,base=h-5;
 ellipseShadow(s,cx+3,base,14,5);
 trunk(s,cx,base,base-70,4,{R,ramp:'bouleau',roots:false});
 for(let y=base-68;y<base;y+=3+Math.floor(R()*4)){const x=cx-2+Math.floor(R()*3);line(s.g,x,y,x+1+Math.floor(R()*2),y,'bouleau0');}
 line(s.g,cx,base-40,cx+9,base-52,'bouleau1');line(s.g,cx-1,base-46,cx-8,base-58,'bouleau1');
 for(const [dx,dy,rx,ry,b]of [[0,-62,12,13,0],[-9,-48,10,10,-.4],[9,-50,10,11,-.3],[-3,-76,9,10,.4],[6,-36,9,8,-.6],[-8,-32,8,7,-.7]])clump(s,cx+dx,base+dy,rx,ry,'tendre',{R,bias:b,max:6,leaf:2.2,gaps:1});
 outline(s,'tendre');return s;
}
function bush(seed,{w=34,h=26}={}){
 const R=rng(seed),s=new Sprite(w,h,Math.floor(w/2),h-4),cx=w/2,base=h-4;ellipseShadow(s,cx+2,base,13,4);
 for(const [dx,dy,rx,ry,b]of [[-5,-6,8,6,-.4],[6,-6,8,6,-.6],[0,-10,9,7,.2]])clump(s,cx+dx,base+dy,rx,ry,'feuille',{R,bias:b+.6,max:7,leaf:2.2});
 if(seed%2)for(const [x,y]of scatter(w,h,5,R,{wrap:false}))if(s.g.get(x,y)&&s.g.get(x,y-1)&&R()<.35){s.g.set(x,y,'fleur3');s.g.set(x+1,y,'fleur2');}
 outline(s,'feuille');return s;
}
function boulder(seed,{w=34,h=28}={}){
 const R=rng(seed),s=new Sprite(w,h,Math.floor(w/2),h-5),cx=w/2,base=h-5;ellipseShadow(s,cx+3,base,14,4);
 const inside=clump(s,cx,base-9,13*(w/34),10*(h/28),'pierre',{R,leaf:5.5,max:6,smooth:true,gain:2.6,bias:-.2});
 for(let x=0;x<w;x++)for(let y=base;y<h;y++)s.g.set(x,y,null);
 for(let x=0;x<w;x++)for(let y=0;y<base;y++){if(s.g.get(x,y)&&y>=base-1){s.g.px[y*w+x]=0;}}
 // Calotte de mousse sur le dessus : une plaque continue, pas des coulures.
 const cap=(x,y)=>((x-cx+2)/(w*.3))**2+((y-(base-18*(h/28)))/(h*.22))**2<1;
 for(let x=0;x<w;x++)for(let y=0;y<h;y++){const v=s.g.name(x,y);if(!v||!cap(x,y))continue;const n=s.g.name(x,y-1);s.g.set(x,y,!n?'mousse3':(v==='pierre5'||v==='pierre6')?'mousse3':'mousse2');}
 for(let x=0;x<w;x++)for(let y=1;y<h;y++){if(s.g.name(x,y)?.startsWith('pierre')&&s.g.name(x,y-1)?.startsWith('mousse')&&R()<.6){s.g.set(x,y,'mousse1');}}
 outline(s,'pierre');return s;
}
function fern(seed){
 const R=rng(seed),s=new Sprite(34,22,17,19),base=19;ellipseShadow(s,18,base,11,3);
 for(const [a,len]of [[-2.75,12],[-2.35,14],[-1.95,13],[-1.57,11],[-1.2,13],[-.8,14],[-.4,12],[-3.0,9],[-.15,9]]){const ex=17+Math.cos(a)*len*1.35,ey=base+Math.sin(a)*len*.95;
  // Fronde arquée : la pointe retombe légèrement.
  const mx=17+(ex-17)*.6,my=base+(ey-base)*.75-1;line(s.g,17,base,mx,my,'tendre2');line(s.g,mx,my,ex,ey+2,'tendre2');
  for(let t=.25;t<1;t+=.15){const x=t<.6?17+(mx-17)*t/.6:mx+(ex-mx)*(t-.6)/.4,y=t<.6?base+(my-base)*t/.6:my+(ey+2-my)*(t-.6)/.4;s.g.set(x,y-1,t<.5?'tendre3':'tendre4');s.g.set(x+(a<-1.57?-1:1),y,'tendre3');if(t>.4&&t<.8)s.g.set(x+(a<-1.57?1:-1),y-1,'tendre5');}
  s.g.set(ex,ey+2,'tendre5');}
 outline(s,'tendre');return s;
}
function mushrooms(seed){
 const R=rng(seed),s=new Sprite(16,12,8,10),g=s.g;ellipseShadow(s,9,10,6,2);
 const art=[['.aab.','abbbc','dcccd','..e..','..e..'],['.ab.','abbc','.ee.','.e..']];
 stamp(g,3,3,art[0],{a:'champi3',b:'champi2',c:'champi1',d:'champi0',e:'bouleau4'});stamp(g,9,6,art[1],{a:'champi3',b:'champi2',c:'champi1',e:'bouleau4'});g.set(5,4,'bouleau5');g.set(10,6,'bouleau5');
 return s;
}
function flowers(seed){
 const R=rng(seed),s=new Sprite(18,14,9,12),g=s.g;ellipseShadow(s,10,12,6,2);
 for(let i=0;i<6;i++){const x=3+Math.floor(R()*12),top=3+Math.floor(R()*5);line(g,x,12,x+(R()<.5?-1:0),top+1,'tendre2');const c=R()<.5?['fleur4','fleur5']:['fleur0','fleur1'];g.set(x,top,c[0]);g.set(x-1,top+1,c[0]);g.set(x+1,top+1,c[0]);g.set(x,top+1,c[1]);}
 for(let x=4;x<15;x+=2)g.set(x,12,'tendre3');return s;
}
function all(){return {
 chene_a:oak(101),chene_b:oak(202),chene_c:oak(303,{w:64,h:84}),bouleau_a:birch(404),bouleau_b:birch(505,{h:88}),
 buisson_a:bush(606),buisson_b:bush(707),rocher_a:boulder(808),rocher_b:boulder(909,{w:28,h:24}),fougere:fern(111),champignons:mushrooms(121),fleurs:flowers(131)};}
module.exports={all,oak,birch,bush,boulder,fern,mushrooms,flowers,Sprite,clump,outline,ellipseShadow,trunk,L};
if(require.main===module){
 const {save}=require('./png.cjs'),F=all(),list=Object.values(F),W=Math.max(...list.map(s=>s.w)),H=Math.max(...list.map(s=>s.h));
 const tiles=list.map(s=>{const g=new Grid(W,H,{fill:'herbe4'});for(let y=0;y<s.h;y++)for(let x=0;x<s.w;x++){const sh=s.shadow.get(x,y);const ty=y+H-s.h,tx=x+((W-s.w)>>1);if(sh)g.set(tx,ty,'herbe2');const v=s.g.get(x,y);if(v)g.px[ty*W+tx]=v;}return g;});
 save((process.argv[2]||'.')+'/flore.png',tiles,{scale:3,cols:6,gap:2,bg:'#111'});console.log('ok');
}
