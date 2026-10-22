'use strict';
/* Pinceaux de pixel art : grilles indexées, tampons dessinés à la main
 * (ASCII), répartition à densité égale et raccords sans couture. Les indices
 * sont ceux de la palette commune (plus de 256 couleurs : Uint16) ; chaque
 * biome est réindexé sur ses propres rampes à la construction. */
const P=require('./palette.cjs');
function rng(seed){let a=seed>>>0;return ()=>{a=a+0x6D2B79F5>>>0;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296;};}
class Grid{
 constructor(w,h,{wrap=false,fill=0,height=0}={}){this.w=w;this.h=h;this.wrap=wrap;this.px=new Uint16Array(w*h).fill(fill?P.id(fill):0);this.ht=new Float32Array(w*h).fill(height);}
 at(x,y){x=Math.round(x);y=Math.round(y);if(this.wrap){x=(x%this.w+this.w)%this.w;y=(y%this.h+this.h)%this.h;}else if(x<0||y<0||x>=this.w||y>=this.h)return -1;return y*this.w+x;}
 get(x,y){const i=this.at(x,y);return i<0?0:this.px[i];}
 name(x,y){const v=this.get(x,y);return v?P.list[v-1].name:null;}
 set(x,y,c,h){const i=this.at(x,y);if(i<0)return;if(c!==null&&c!==undefined)this.px[i]=typeof c==='number'?c:P.id(c);if(h!==undefined)this.ht[i]=h;}
 height(x,y){const i=this.at(x,y);return i<0?0:this.ht[i];}
 clone(){const g=new Grid(this.w,this.h,{wrap:this.wrap});g.px.set(this.px);g.ht.set(this.ht);return g;}
 // Décale une couleur dans sa rampe (ombre, lumière) sans quitter la palette.
 shift(x,y,d){const v=this.get(x,y);if(!v)return;const c=P.list[v-1],r=P.RAMPS[c.ramp],t=Math.max(0,Math.min(r.length-1,c.tone+d));this.set(x,y,c.ramp+t);}
}
/* Tampon ASCII : chaque caractère renvoie à une couleur nommée (ou null pour
 * transparent / inchangé). `h` donne la hauteur de la matière pour le mélange. */
function stamp(g,x0,y0,art,map,{h,flip=false,anchor=[0,0]}={}){
 const rows=Array.isArray(art)?art:art.split('\n');
 rows.forEach((row,y)=>{[...row].forEach((ch,x)=>{const c=map[ch];if(c===undefined||c===null)return;const xx=flip?row.length-1-x:x;const hh=typeof h==='object'?h[ch]:h;if(typeof c==='function')c(g,x0+xx-anchor[0],y0+y-anchor[1]);else g.set(x0+xx-anchor[0],y0+y-anchor[1],c,hh);});});
}
// Points répartis à distance minimale (Bridson simplifié), métrique isométrique 2:1.
function scatter(w,h,min,random,{aniso=2,wrap=true,tries=30,max=1e4}={}){
 const pts=[],d2=min*min,dist=(a,b)=>{let dx=Math.abs(a[0]-b[0]),dy=Math.abs(a[1]-b[1]);if(wrap){dx=Math.min(dx,w-dx);dy=Math.min(dy,h-dy);}return dx*dx+(dy*aniso)**2;};
 let fails=0;while(pts.length<max&&fails<tries*40){const p=[Math.floor(random()*w),Math.floor(random()*h)];if(pts.every(q=>dist(p,q)>=d2)){pts.push(p);fails=0;}else fails++;}
 return pts;
}
// Plaque en ellipse 2:1 dont le bord est fait de petites dents (herbe), sans bruit pixel.
function patch(g,cx,cy,rx,ry,c,{h,teeth=0,random=Math.random,keep}={}){
 const bumps=[];for(let i=0;i<teeth;i++)bumps.push([random()*Math.PI*2,.12+random()*.18,1+Math.floor(random()*3)]);
 for(let y=Math.floor(cy-ry-3);y<=cy+ry+3;y++)for(let x=Math.floor(cx-rx-3);x<=cx+rx+3;x++){
  const dx=(x-cx)/rx,dy=(y-cy)/ry,a=Math.atan2(dy,dx);let r=1;for(const [b,s,k]of bumps)r+=s*Math.max(0,Math.cos((a-b)*k*3))**6;
  if(dx*dx+dy*dy<=r*r&&(!keep||keep(g.name(x,y))))g.set(x,y,c,h);
 }
}
function line(g,x0,y0,x1,y1,c,h){const n=Math.max(Math.abs(x1-x0),Math.abs(y1-y0));for(let i=0;i<=n;i++){const t=n?i/n:0;g.set(Math.round(x0+(x1-x0)*t),Math.round(y0+(y1-y0)*t),c,h);}}
// Bruit de valeur raccordable (périodes entières), cellules 2:1 isométriques.
function field(w,h,cell,random,octaves=2){
 const layers=[];for(let o=0;o<octaves;o++){const cw=cell*2>>o||2,chh=cell>>o||1,nx=Math.max(1,Math.round(w/cw)),ny=Math.max(1,Math.round(h/chh)),v=Array.from({length:nx*ny},()=>random()*2-1);layers.push({nx,ny,v,amp:1/(1<<o)});}
 const s=t=>t*t*(3-2*t),out=new Float32Array(w*h);let norm=layers.reduce((a,l)=>a+l.amp,0);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){let sum=0;for(const l of layers){const fx=x/w*l.nx,fy=y/h*l.ny,ix=Math.floor(fx),iy=Math.floor(fy),tx=s(fx-ix),ty=s(fy-iy),V=(i,j)=>l.v[((j%l.ny+l.ny)%l.ny)*l.nx+((i%l.nx+l.nx)%l.nx)];
  sum+=l.amp*((V(ix,iy)*(1-tx)+V(ix+1,iy)*tx)*(1-ty)+(V(ix,iy+1)*(1-tx)+V(ix+1,iy+1)*tx)*ty);}out[y*w+x]=sum/norm;}
 return {at:(x,y)=>out[((Math.round(y)%h+h)%h)*w+((Math.round(x)%w+w)%w)],data:out};
}
module.exports={rng,Grid,stamp,scatter,patch,line,field,P};
