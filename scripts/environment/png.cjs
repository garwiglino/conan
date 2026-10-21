'use strict';
/* Export PNG des grilles indexées (aperçus et atelier). */
const {createCanvas}=require('@napi-rs/canvas'),fs=require('node:fs'),P=require('./palette.cjs');
const RGB=P.hexes.map(h=>h.length===9?[0,0,0,0]:[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)).concat(255));
function canvasOf(grids,{scale=1,cols=1,gap=0,bg=null,tile=[1,1]}={}){
 grids=Array.isArray(grids)?grids:[grids];
 const cw=Math.max(...grids.map(g=>g.w))*tile[0],ch=Math.max(...grids.map(g=>g.h))*tile[1],rows=Math.ceil(grids.length/cols);
 const W=(cw*cols+gap*(cols+1)),H=(ch*rows+gap*(rows+1)),cv=createCanvas(W*scale,H*scale),c=cv.getContext('2d');
 if(bg){c.fillStyle=bg;c.fillRect(0,0,W*scale,H*scale);}
 const im=c.createImageData(W,H);
 grids.forEach((g,k)=>{const ox=gap+(k%cols)*(cw+gap),oy=gap+Math.floor(k/cols)*(ch+gap);
  for(let ty=0;ty<tile[1];ty++)for(let tx=0;tx<tile[0];tx++)for(let y=0;y<g.h;y++)for(let x=0;x<g.w;x++){const v=g.px[y*g.w+x];if(!v)continue;const i=((oy+ty*g.h+y)*W+ox+tx*g.w+x)*4;im.data.set(RGB[v],i);}});
 const small=createCanvas(W,H);small.getContext('2d').putImageData(im,0,0);if(bg){const s2=createCanvas(W,H),c2=s2.getContext('2d');c2.fillStyle=bg;c2.fillRect(0,0,W,H);c2.drawImage(small,0,0);c.imageSmoothingEnabled=false;c.drawImage(s2,0,0,W*scale,H*scale);}else{c.imageSmoothingEnabled=false;c.drawImage(small,0,0,W*scale,H*scale);}
 return cv;
}
function save(file,grids,opt){fs.writeFileSync(file,canvasOf(grids,opt).toBuffer('image/png'));return file;}
module.exports={RGB,canvasOf,save};
