'use strict';
/* « Avant » : la même carte de démonstration rendue avec l'ancien atlas
 * (terrain-isometric.js, famille forêt) et les anciens arbres du jeu. */
const {createCanvas}=require('@napi-rs/canvas'),fs=require('node:fs');
const T=require('../../sprites/terrain/terrain-isometric.js'),A=require('../../sprites/architecture/architecture-isometric.js'),HERO=require('../../sprites/terrain/player-reference.js'),NATURE=require('../../sprites/decors/atlas-nature.js');
const {map}=require('./preview-scene.cjs'),assets=require('./teremor-assets.cjs');
const P=(u,v,z=0)=>({x:u-v,y:(u+v)/2-z});
const hash=(x,y,s=0)=>{let h=Math.imul(x+s*7919,374761393)^Math.imul(y-s*104729,668265263);h=Math.imul(h^(h>>>13),1274126177);return ((h^(h>>>16))>>>0)/4294967296;};
function render(file){
 const M=map(),N=M.N,A2=assets.assets(),levels=A2.levelOf;
 // Matière d'une case de 1 m d'après les pièces (centre de case).
 const pieceAt=(i,j,set)=>{const ci=i>>1,cj=j>>1,pc=M.piece(ci,cj).find(p=>p.set===set);if(!pc)return 0;const m=A2.pieces[set].find(p=>p.mask===pc.mask),px=Buffer.from(m.px,'base64'),lu=(i%2)*16+8,lv=(j%2)*16+8,mx=Math.floor(lu-lv+32),my=Math.floor((lu+lv)/2);return levels[px[my*64+mx]]||0;};
 const code=(i,j)=>{if(i<0||j<0||i>=N||j>=N)return 0;const w=pieceAt(i,j,'ruisseau')>.5,p=pieceAt(i,j,'chemin')>.5||pieceAt(i,j,'pave')>.5;if(w&&p)return 5;if(w)return 3;if(pieceAt(i,j,'pave')>.5)return 2;if(p)return 1;const c=M.code[j*N+i];return c===9?0:c;};
 const width=N*32+64,height=N*16+64,ox=width/2,oy=48,cv=createCanvas(width,height),c=cv.getContext('2d');c.fillStyle='#141b1c';c.fillRect(0,0,width,height);
 const tiles=[];for(let j=0;j<N;j++)for(let i=0;i<N;i++)tiles.push([i,j]);tiles.sort((a,b)=>a[0]+a[1]-b[0]-b[1]);
 const draw=[];
 for(const [i,j]of tiles){const t=code(i,j);let mask=0,shore=0,cliff=0;for(const [dx,dy,bit]of [[0,-1,1],[1,0,2],[0,1,4],[-1,0,8]]){const n=code(i+dx,j+dy);if(n===1||n===5||n===2)mask|=bit;if(n===3)shore|=bit;if(n!==8)cliff|=bit;}
  const kind=t===8?'cliff':t===5?'bridge':t===3?'water':t===2?'paving':t===1?'path':shore?'shore':'ground';
  const d={family:'forest',kind,mask:kind==='shore'?shore:kind==='cliff'?cliff:kind==='path'?mask:0,height:kind==='cliff'?32:0,dir:1};
  const im=T.raster(d,{x:i*16,y:j*16}),s=createCanvas(im.width,im.height),x=s.getContext('2d'),id=x.createImageData(im.width,im.height);id.data.set(im.data);x.putImageData(id,0,0);
  const p=P(i*16,j*16);const fn=()=>c.drawImage(s,Math.round(p.x+ox-im.anchor[0]),Math.round(p.y+oy-im.anchor[1]));if(kind==='cliff')draw.push({y:p.y+16,fn});else fn();}
 const old=['world_oak_0','world_oak_1','world_boulder_2'].map(k=>{const d=NATURE.props[k];const s=createCanvas(64,64),x=s.getContext('2d'),im=x.createImageData(64,64);for(const [dx,dy,hex]of d.pixels){const px=dx+d.anchor[0],py=dy+d.anchor[1];if(px<0||py<0||px>=64||py>=64)continue;im.data.set([parseInt(hex.slice(0,2),16),parseInt(hex.slice(2,4),16),parseInt(hex.slice(4,6),16),255],(py*64+px)*4);}x.putImageData(im,0,0);return s;});
 for(let j=0;j<N;j++)for(let i=0;i<N;i++)if(M.code[j*N+i]===4){const p=P(i*16+8,j*16+9),o=old[Math.floor(hash(i,j,5)*3)];draw.push({y:p.y,fn:()=>c.drawImage(o,Math.round(p.x+ox-32),Math.round(p.y+oy-56))});}
 for(const [id,i,j,dir]of M.houses){const im=A.raster(id,{dir}),s=createCanvas(im.width,im.height),x=s.getContext('2d'),d=x.createImageData(im.width,im.height);d.data.set(im.data);x.putImageData(d,0,0);const e=A.entry(id),p=P(i*16,j*16),q=P(i*16+e.width,j*16+e.depth);draw.push({y:q.y-8,fn:()=>c.drawImage(s,Math.round(p.x+ox-im.anchor[0]),Math.round(p.y+oy-im.anchor[1]))});}
 const hero=createCanvas(HERO.width,HERO.height),hx=hero.getContext('2d'),him=hx.createImageData(HERO.width,HERO.height);for(const p of HERO.pixels)him.data.set(p.slice(2,6),(p[1]*HERO.width+p[0])*4);hx.putImageData(him,0,0);
 for(const [u,v]of [[9*16,21*16],[18*16,20*16],[8.6*16,11*16]]){const p=P(u,v);draw.push({y:p.y,fn:()=>c.drawImage(hero,Math.round(p.x+ox-HERO.anchor[0]),Math.round(p.y+oy-HERO.anchor[1]))});}
 draw.sort((a,b)=>a.y-b.y).forEach(d=>d.fn());
 fs.writeFileSync(file,cv.toBuffer('image/png'));
 for(const [name,cx]of [['village',P(26*16,20*16)],['carrefour',P(9*16,17*16)],['riviere',P(15*16,19*16)],['plateau',P(25*16,10*16)]]){const W=422,H=195,crop=createCanvas(W*2,H*2),k=crop.getContext('2d');k.imageSmoothingEnabled=false;k.drawImage(cv,Math.round(cx.x+ox-W/2),Math.round(cx.y+oy-H/2),W,H,0,0,W*2,H*2);fs.writeFileSync(file.replace('.png','-'+name+'.png'),crop.toBuffer('image/png'));}
 return file;
}
if(require.main===module)console.log(render((process.argv[2]||'.')+'/avant.png'));
