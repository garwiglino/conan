'use strict';
/* Scène d'essai : carte logique dessinée à la main, sol composé par
 * environment-iso.js, vrais bâtiments isométriques et Kaldor du jeu à l'échelle. */
const {createCanvas}=require('@napi-rs/canvas'),fs=require('node:fs');
const Env=require('../../sprites/environnement/environment-iso.js');
const A=require('../../sprites/architecture/architecture-isometric.js'),HERO=require('../../sprites/terrain/player-reference.js');
const NATURE=require('../../sprites/decors/atlas-nature.js');
const P=(u,v,z=0)=>({x:u-v,y:(u+v)/2-z});
const hash=(x,y,s=0)=>{let h=Math.imul(x+s*7919,374761393)^Math.imul(y-s*104729,668265263);h=Math.imul(h^(h>>>13),1274126177);return ((h^(h>>>16))>>>0)/4294967296;};
// Carte de démonstration : cases de 2 m pour les pièces, cases de 1 m pour le relief et les arbres.
function map(N=36){
 const C=N/2,sets={chemin:new Set(),pave:new Set(),ruisseau:new Set()},exits={};
 const add=(set,cells)=>cells.forEach(([i,j])=>sets[set].add(i+','+j));
 add('chemin',[[0,10],[1,10],[2,10],[3,10],[4,10],[5,10],[6,10],[7,10],[8,10],[9,10],[10,10],[4,9],[4,8],[4,7],[4,6],[5,6],[10,11],[10,12],[10,13],[10,14],[10,15],[10,16],[10,17]]);
 add('pave',[[11,10],[12,10],[13,10],[14,10],[15,10],[16,10],[17,10],[13,7],[13,8],[13,9],[13,11],[13,12],[13,13]]);
 const river=[];for(let j=0;j<=12;j++)river.push([8,j]);river.push([7,12]);for(let j=13;j<C;j++)river.push([7,j]);add('ruisseau',river);
 const linked=(a,b)=>a===b||a!=='ruisseau'&&b!=='ruisseau';
 const piece=(ci,cj)=>{const out=[];for(const [set,cells]of Object.entries(sets)){if(!cells.has(ci+','+cj))continue;let mask=0;
   for(const [bit,di,dj]of [[1,0,-1],[2,1,0],[4,0,1],[8,-1,0]]){const n=(ci+di)+','+(cj+dj),off=ci+di<0||cj+dj<0||ci+di>=C||cj+dj>=C;if(off||Object.entries(sets).some(([s2,c2])=>c2.has(n)&&linked(set,s2)))mask|=bit;}
   out.push({set,mask});}return out;};
 const used=(i,j)=>sets.chemin.has((i>>1)+','+(j>>1))||sets.pave.has((i>>1)+','+(j>>1))||sets.ruisseau.has((i>>1)+','+(j>>1));
 const code=new Uint8Array(N*N);
 const houses=[['T05',22,15,'face'],['B07',28,14,'face'],['T03',22,24,'face'],['T01',29,24,'face']];
 const inHouse=(i,j)=>houses.some(([id,hi,hj])=>{const e=A.entry(id);return i>=hi-1&&j>=hj-1&&i<=hi+e.width/16&&j<=hj+e.depth/16;});
 for(let j=0;j<N;j++)for(let i=0;i<N;i++){
  const k=j*N+i,plateau=i>=24&&j<=7+Math.round(1.6*Math.sin(i/2.1)+Math.cos(i/1.3))&&!(i>32&&j>4);
  if(plateau){code[k]=8;continue;}
  if(used(i,j)||inHouse(i,j)){code[k]=9;continue;}if(i>=20&&j>=12&&j<=30)continue;
  const near=[[-1,0],[1,0],[0,-1],[0,1]].some(([a,b])=>used(i+a,j+b));if(near)continue;
  const grove=((Math.sin(i/3.3)*Math.cos(j/2.9)+1)/2)**2;if(hash(i,j,4)<.03+.22*grove)code[k]=4;
 }
 return {N,code,piece,houses};
}
/* Compose une carte {N, code, piece, houses, paving?} : sol, flore, bâtiments et
 * Kaldor triés par profondeur. heroes : positions au sol ; crops : [nom, u, v]. */
function compose(M,file,{scale=1,heroes=[],crops=[]}={}){
 const N=M.N,E=Env(require('../../sprites/environnement/teremor-data.js'));
 const sampler={tile:(i,j)=>i<0||j<0||i>=N||j>=N?{code:0}:{code:M.code[j*N+i]===9?0:M.code[j*N+i],paving:M.paving?.(i,j)},piece:(ci,cj)=>ci<0||cj<0||ci>=N/2||cj>=N/2?[]:M.piece(ci,cj)};
 const width=N*32+64,height=N*16+64,ox=width/2,oy=48;
 const out=E.render({sampler,base:[0,0],screen:[0,0],tiles:[N,N],width,height,ox,oy});
 const cv=createCanvas(width,height),c=cv.getContext('2d');c.fillStyle='#141b1c';c.fillRect(0,0,width,height);
 const tmp=createCanvas(width,height),ti=tmp.getContext('2d').createImageData(width,height);ti.data.set(out.data);tmp.getContext('2d').putImageData(ti,0,0);c.drawImage(tmp,0,0);
 const draw=[];
 const sprite=(pixels,w,h)=>{const s=createCanvas(w,h),x=s.getContext('2d'),im=x.createImageData(w,h);for(const p of pixels){const [px,py]=p,i=(py*w+px)*4;if(typeof p[2]==='string'){im.data.set([parseInt(p[2].slice(0,2),16),parseInt(p[2].slice(2,4),16),parseInt(p[2].slice(4,6),16),255],i);}else im.data.set(p.slice(2,6),i);}x.putImageData(im,0,0);return s;};
 // Flore de Teremor (sources Piskel) : ombre portée à l'opacité de son calque, puis le sprite.
 const toCanvas=(px,w,h)=>{const s=createCanvas(w,h),x=s.getContext('2d'),im=x.createImageData(w,h);for(let k=0;k<px.length;k++)if(px[k])im.data.set(E.rgb[px[k]],k*4);x.putImageData(im,0,0);return s;};
 const SPR={};for(const v of Object.values(E.flora))for(const f of v.frames)SPR[f.name]={img:toCanvas(f.px,f.w,f.h),shadow:toCanvas(f.sh,f.w,f.h),alpha:v.shadow,ax:f.ax,ay:f.ay};
 const place=(k,u,v)=>{const sp=SPR[k],p=P(u,v);c.save();c.globalAlpha=sp.alpha;c.drawImage(sp.shadow,Math.round(p.x+ox-sp.ax),Math.round(p.y+oy-sp.ay));c.restore();draw.push({y:p.y,fn:()=>c.drawImage(sp.img,Math.round(p.x+ox-sp.ax),Math.round(p.y+oy-sp.ay))});};
 const BIG=['chene_a','chene_b','chene_c','chene_a','chene_b','bouleau_a','bouleau_b','buisson_a','buisson_b','rocher_a'],SMALL=['fougere','fougere','champignons','fleurs','buisson_b','rocher_b'];
 for(let j=0;j<N;j++)for(let i=0;i<N;i++){const t=M.code[j*N+i];
  if(t===4)place(BIG[Math.floor(hash(i,j,5)*BIG.length)],i*16+8,j*16+9);
  else if(t===0&&hash(i,j,41)<.035)place(SMALL[Math.floor(hash(i,j,42)*SMALL.length)],i*16+8,j*16+9);}
 for(const [id,i,j,dir]of M.houses){
  const im=A.raster(id,{dir}),s=createCanvas(im.width,im.height),x=s.getContext('2d'),d=x.createImageData(im.width,im.height);d.data.set(im.data);x.putImageData(d,0,0);const e=A.entry(id),p=P(i*16,j*16),q=P(i*16+e.width,j*16+e.depth);draw.push({y:q.y-8,fn:()=>c.drawImage(s,Math.round(p.x+ox-im.anchor[0]),Math.round(p.y+oy-im.anchor[1]))});}
 const hero=sprite(HERO.pixels,HERO.width,HERO.height);
 for(const [u,v]of heroes){const p=P(u,v);draw.push({y:p.y,fn:()=>c.drawImage(hero,Math.round(p.x+ox-HERO.anchor[0]),Math.round(p.y+oy-HERO.anchor[1]))});}
 for(const f of out.features)draw.push({y:f.depth+oy-16+16,fn:()=>{const s=createCanvas(f.width,f.height),x=s.getContext('2d'),d=x.createImageData(f.width,f.height);d.data.set(f.data);x.putImageData(d,0,0);c.drawImage(s,f.x+ox,f.y+oy);}});
 draw.sort((a,b)=>a.y-b.y).forEach(d=>d.fn());
 const big=createCanvas(width*scale,height*scale),b=big.getContext('2d');b.imageSmoothingEnabled=false;b.drawImage(cv,0,0,width*scale,height*scale);
 fs.writeFileSync(file,big.toBuffer('image/png'));
 // Recadrage plein écran à l'échelle du jeu (×2) autour du village et du pont.
 for(const [name,u,v]of crops){const cx=P(u,v);
  const W=422,H=195,crop=createCanvas(W*2,H*2),k=crop.getContext('2d');k.imageSmoothingEnabled=false;k.drawImage(cv,Math.round(cx.x+ox-W/2),Math.round(cx.y+oy-H/2),W,H,0,0,W*2,H*2);fs.writeFileSync(file.replace('.png','-'+name+'.png'),crop.toBuffer('image/png'));
 }
 return file;
}
function render(file,opt={}){return compose(map(),file,{...opt,heroes:[[9*16,21*16],[18*16,20*16],[8.6*16,11*16]],crops:[['village',26*16,20*16],['riviere',15*16,19*16],['plateau',25*16,10*16],['carrefour',9*16,17*16]]});}
module.exports={map,render,compose,hash};
if(require.main===module)console.log(render((process.argv[2]||'.')+'/scene.png',{scale:1}));
