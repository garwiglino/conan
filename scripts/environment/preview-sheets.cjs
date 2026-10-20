'use strict';
/* Planches de revue : pièces de chemin rendues, flore, textures. */
const {createCanvas}=require('@napi-rs/canvas'),fs=require('node:fs'),path=require('node:path');
const Env=require('../../sprites/environnement/environment-iso.js'),assets=require('./teremor-assets.cjs');
const {RGB}=require('./png.cjs'),{ORDER,NAMES}=require('./teremor-pieces.cjs');
function piecesSheet(file,{scale=4}={}){
 const A=assets.assets(),E=Env(A),sets=['chemin','pave','ruisseau'],cols=8,cw=64,ch=32,pad=12,lab=12,rows=sets.length*2;
 const W=cols*(cw+pad)+pad,H=rows*(ch+pad+lab)+pad,cv=createCanvas(W*scale,H*scale),c=cv.getContext('2d');c.fillStyle='#141b1c';c.fillRect(0,0,W*scale,H*scale);c.imageSmoothingEnabled=false;
 sets.forEach((set,r)=>ORDER.forEach((mask,k)=>{
  const sampler={tile:()=>({code:0}),piece:(ci,cj)=>ci===0&&cj===0?[{set,mask}]:[]};
  const out=E.render({sampler,base:[0,0],screen:[0,0],tiles:[2,2],width:64,height:36,ox:32,oy:2});
  const t=createCanvas(64,36),x=t.getContext('2d'),im=x.createImageData(64,36);im.data.set(out.data);x.putImageData(im,0,0);
  const row=r*2+Math.floor(k/cols),X=pad+(k%cols)*(cw+pad),Y=pad+row*(ch+pad+lab);c.drawImage(t,0,0,64,36,X*scale,(Y-2)*scale,64*scale,36*scale);
  c.fillStyle='#cdbf98';c.font=(4.5*scale)+'px sans-serif';c.fillText(set+' · '+NAMES[mask],X*scale,(Y+ch+9)*scale);
 }));
 fs.writeFileSync(file,cv.toBuffer('image/png'));return file;
}
function floraSheet(file,{scale=3}={}){
 const F=require('./teremor-flora.cjs').all(),list=Object.entries(F),pad=8,W=list.reduce((a,[,s])=>a+s.w+pad,pad),H=Math.max(...list.map(([,s])=>s.h))+pad*2+12;
 const cv=createCanvas(W*scale,H*scale),c=cv.getContext('2d');c.fillStyle='#4f703b';c.fillRect(0,0,W*scale,H*scale);c.imageSmoothingEnabled=false;
 let x0=pad;for(const [name,s]of list){const t=createCanvas(s.w,s.h),x=t.getContext('2d'),im=x.createImageData(s.w,s.h);
  for(let k=0;k<s.g.px.length;k++){if(s.g.px[k])im.data.set(RGB[s.g.px[k]],k*4);else if(s.shadow.px[k])im.data.set([47,74,51,255],k*4);}
  x.putImageData(im,0,0);const y0=H-pad-12-s.h;c.drawImage(t,0,0,s.w,s.h,x0*scale,y0*scale,s.w*scale,s.h*scale);c.fillStyle='#f0e6c8';c.font=(4*scale)+'px sans-serif';c.fillText(name.replace('_',' '),x0*scale,(H-pad)*scale);x0+=s.w+pad;}
 fs.writeFileSync(file,cv.toBuffer('image/png'));return file;
}
module.exports={piecesSheet,floraSheet};
if(require.main===module){const out=process.argv[2]||'.';console.log(piecesSheet(path.join(out,'pieces-de-chemin.png')),floraSheet(path.join(out,'flore.png')));}
