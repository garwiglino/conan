'use strict';
/* Modeleur en voxels d'une unité (16 par mètre) et rendu isométrique exact.
 * Chaque pixel de l'écran lance un rayon le long de (−1, −1, −1), direction
 * de visée de la projection x = u − v, y = (u + v) / 2 − z, et prend la face
 * du premier voxel plein qu'il rencontre (dessus, face +u ou face +v). Les
 * arêtes tombent sur les diagonales 2:1 et les embrasures, marches et grilles
 * se cachent les unes les autres sans retouche. La couleur de chaque face
 * vient d'une fonction de teinte, qui lit des motifs dessinés à plat.
 *
 * Repère local (a, b, z) : a le long du mur ou de l'objet, b en travers.
 * Orientation 'nord' : u = a, v = b. Orientation 'ouest' : u = b, v = a
 * (le même objet tourné d'un quart de tour, vu en miroir). La lumière dépend
 * de la face dans le monde : dessus clair, face +v (sud) éclairée, face +u
 * (est) à l'ombre, comme partout ailleurs dans le jeu. */
const {Grid}=require('./brushes.cjs');
class Model{
 // Bornes locales [a0, a1) × [b0, b1) × [z0, z1).
 constructor(a0,b0,z0,a1,b1,z1,{turn=false}={}){
  Object.assign(this,{a0,b0,z0,a1,b1,z1,turn});this.na=a1-a0;this.nb=b1-b0;this.nz=z1-z0;
  this.m=new Uint8Array(this.na*this.nb*this.nz);this.mats=[null];this.ids=new Map();
 }
 id(name){if(!name)return 0;if(!this.ids.has(name)){this.ids.set(name,this.mats.length);this.mats.push(name);}return this.ids.get(name);}
 index(a,b,z){a-=this.a0;b-=this.b0;z-=this.z0;return a<0||b<0||z<0||a>=this.na||b>=this.nb||z>=this.nz?-1:(z*this.nb+b)*this.na+a;}
 get(a,b,z){const i=this.index(a,b,z);return i<0?null:this.mats[this.m[i]];}
 set(a,b,z,name){const i=this.index(a,b,z);if(i>=0)this.m[i]=this.id(name);}
 // Remplit les voxels dont le centre vérifie f(a, b, z) ; f renvoie une matière, null (vide) ou undefined (inchangé).
 shape(f,box=[this.a0,this.b0,this.z0,this.a1,this.b1,this.z1]){
  const [a0,b0,z0,a1,b1,z1]=box.map(Math.round);
  for(let z=Math.max(z0,this.z0);z<Math.min(z1,this.z1);z++)for(let b=Math.max(b0,this.b0);b<Math.min(b1,this.b1);b++)for(let a=Math.max(a0,this.a0);a<Math.min(a1,this.a1);a++){const r=f(a+.5,b+.5,z+.5);if(r!==undefined)this.set(a,b,z,r);}
  return this;
 }
 box(a0,b0,z0,a1,b1,z1,name){return this.shape(()=>name,[a0,b0,z0,a1,b1,z1]);}
 cylinder(ca,cb,r,z0,z1,name){return this.shape((a,b)=>(a-ca)**2+(b-cb)**2<=r*r?name:undefined,[ca-r-1,cb-r-1,z0,ca+r+1,cb+r+1,z1]);}
 // Monde -> local et inversement (quart de tour = échange u, v).
 world(a,b){return this.turn?[b,a]:[a,b];}
}
const FACE={0:'u',1:'v',2:'z'};
/* Rendu : shade(hit) -> nom de couleur, null (transparent mais opaque au
 * rayon : masque) ; hit = {mat, face ('u' | 'v' | 'z' dans le monde),
 * side ('a' | 'b' | 'z' dans le repère local), a, b, z, model}.
 * Renvoie un sprite {g, shadow, info, w, h, ax, ay} : l'ancre est le point
 * écran de l'origine locale (0, 0, 0). */
function render(model,shade,{pad=1}={}){
 const M=model,[U0,V0]=M.world(M.a0,M.b0),[U1,V1]=M.world(M.a1,M.b1),u0=Math.min(U0,U1),u1=Math.max(U0,U1),v0=Math.min(V0,V1),v1=Math.max(V0,V1);
 const X0=Math.floor(u0-v1)-pad,X1=Math.ceil(u1-v0)+pad,Y0=Math.floor((u0+v0)/2-M.z1)-pad,Y1=Math.ceil((u1+v1)/2-M.z0)+pad,w=X1-X0,h=Y1-Y0;
 const g=new Grid(w,h),info=new Array(w*h).fill(null),lo=[u0,v0,M.z0];
 const at=(u,v,z)=>M.turn?M.get(v,u,z):M.get(u,v,z);
 for(let py=0;py<h;py++)for(let px=0;px<w;px++){
  const X=px+X0+.5,Y=py+Y0+.5,zs=Math.ceil(Math.max(M.z1,u1-Y-X/2,v1-Y+X/2))+.5;
  const p=[Y+zs+X/2,Y+zs-X/2,zs],c=p.map(Math.floor),t=p.map((q,i)=>q-c[i]);
  for(let guard=0;guard<4096;guard++){
   let k=0;if(t[1]<t[k])k=1;if(t[2]<t[k])k=2;const d=t[k];t[0]-=d;t[1]-=d;t[2]-=d;t[k]=1;c[k]--;
   if(c[0]<lo[0]||c[1]<lo[1]||c[2]<lo[2])break;
   const mat=at(c[0],c[1],c[2]);if(!mat)continue;
   const [a,b]=M.world(c[0],c[1]),face=FACE[k],side=face==='z'?'z':(M.turn?(face==='u'?'b':'a'):(face==='u'?'a':'b'));
   const hit={mat,face,side,a,b,z:c[2],u:c[0],v:c[1],model:M,px,py},col=shade(hit);
   info[py*w+px]=hit;if(col)g.set(px,py,col);break;
  }
 }
 return {g,shadow:new Grid(w,h),info,w,h,ax:-X0,ay:-Y0};
}
// Teinte d'une rampe décalée (bornée), utilitaire des fonctions de teinte.
const tone=(ramp,t,max)=>ramp+Math.max(0,Math.min(max,Math.round(t)));
module.exports={Model,render,tone};
