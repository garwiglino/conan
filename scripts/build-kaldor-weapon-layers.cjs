// Export the EXISTING garment arm/hand layers without warping or redrawing.
// Face/back already contain two disconnected silhouettes separated by empty
// columns; profiles contain one visible arm. Never subdivide a limb at a joint.
'use strict';
const fs=require('node:fs'),path=require('node:path'),{createCanvas}=require('@napi-rs/canvas');
const rig=require('./kaldor-outfit-rig.cjs'),root=path.resolve(__dirname,'..');
const outfits={};
for(const file of fs.readdirSync(path.join(root,'art/kaldor-tenues')).filter(f=>f.endsWith('.cjs')&&f!=='habillage.cjs')){
 const def=require(path.join(root,'art/kaldor-tenues',file)),layers=rig.build(def).filter(l=>rig.role(l.name)==='arms');
 outfits[def.id]=[0,1,2,3].map(d=>{
  const profile=d===1||d===3,groups=profile?[null]:['left','right'];
  return groups.map(side=>{
   const im=rig.blank();
   for(const l of layers){
    const src=l.images[d];
    for(let y=0;y<80;y++)for(let x=0;x<80;x++){
     const col=rig.get(src,x,y);if(!col[3])continue;
     if(!profile&&(x===39||x===40))throw Error(def.id+': source arms are not disjoint; do not cut a silhouette');
     if(side==='left'&&x>=40||side==='right'&&x<40)continue;
     rig.pixel(im,x,y,col);
    }
   }
   let bottom=-1,hand=[];
   for(let y=0;y<80;y++)for(let x=0;x<80;x++){const col=rig.get(im,x,y);if(!col[3]||col.slice(0,3).every((v,k)=>v===rig.O[k]))continue;
    if(y>bottom){bottom=y;hand=[];}if(y===bottom)hand.push(x);
   }
   const palm=[hand.reduce((a,b)=>a+b,0)/Math.max(1,hand.length)-40,bottom-52];
   const cv=createCanvas(80,80),c=cv.getContext('2d'),image=c.createImageData(80,80);image.data.set(im);c.putImageData(image,0,0);
   return {side,palm,png:cv.toBuffer('image/png').toString('base64'),sources:layers.map(l=>l.name)};
  });
 });
}
fs.writeFileSync(path.join(root,'data/weapons/native-arms.json'),JSON.stringify({version:1,method:'Unmodified native arm/hand layers; integer translation only',outfits}));
console.log('Exported unchanged arm layers for',Object.keys(outfits).length,'outfits.');
