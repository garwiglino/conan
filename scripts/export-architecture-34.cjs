'use strict';
const fs=require('node:fs'),path=require('node:path'),{createCanvas}=require('@napi-rs/canvas');
const A=require('../sprites/architecture/architecture-34.js'),localities=require('../sprites/architecture/localities.js'),root=path.resolve(__dirname,'..'),out=path.join(root,'art/architecture-34');
fs.mkdirSync(out,{recursive:true});
const catalog={version:2,projection:A.projection,scale:A.scale,counts:{assets:234,buildings:106,winter:8,modules:120,views:696},families:['teremor','sylverive','igea','sarak','varan','tagon'],localities:localities.length,assets:{}};
function canvasOf(p){const cv=createCanvas(p.width,p.height),c=cv.getContext('2d'),im=c.createImageData(p.width,p.height);im.data.set(p.data);c.putImageData(im,0,0);return cv;}
let layerCount=0;
for(const d of A.list()){
 const folder=path.join(out,'export',d.id);fs.mkdirSync(folder,{recursive:true});
 const views=d.views.map(dir=>A.raster(d.id,{dir})),cw=Math.max(...views.map(p=>p.width))+4,ch=Math.max(...views.map(p=>p.height))+4,cv=createCanvas(cw*views.length,ch),c=cv.getContext('2d');
 const record={...d,projection:A.projection,sourceCardinalViews:d.frames,frames:{}};
 for(let i=0;i<views.length;i++){
  const p=views[i],x=i*cw+2,y=ch-2-p.height;c.drawImage(canvasOf(p),x,y);
  record.frames[p.dir]={frame:{x,y,w:p.width,h:p.height},anchor:p.anchor,footprint:p.footprint,nativePlan:p.nativePlan,sourceFacades:[p.dir,d.kind==='building'?d.views[(d.views.indexOf(p.dir)+1)%4]:d.views[0]]};
 }
 fs.writeFileSync(path.join(folder,d.id+'.png'),cv.toBuffer('image/png'));
 fs.writeFileSync(path.join(folder,d.id+'.json'),JSON.stringify(record,null,2));catalog.assets[d.id]=record;
 for(const layer of ['back','roof','front','mechanism','snow']){
  const layerCV=createCanvas(cv.width,cv.height),cc=layerCV.getContext('2d');let count=0;
  for(let i=0;i<views.length;i++){const p=A.raster(d.id,{dir:d.views[i],layer});count+=p.indices.some(Boolean)?1:0;cc.drawImage(canvasOf(p),i*cw+2,ch-2-p.height);}
  if(count){fs.writeFileSync(path.join(folder,d.id+'-'+layer+'.png'),layerCV.toBuffer('image/png'));layerCount++;}
 }
}
fs.mkdirSync(path.join(root,'data/architecture-34'),{recursive:true});fs.writeFileSync(path.join(root,'data/architecture-34/catalogue.json'),JSON.stringify(catalog,null,2));
const groups=[...catalog.families,'shared'];
for(const family of groups){const items=A.list().filter(d=>d.family===family);for(let start=0;start<items.length;start+=24){
 const batch=items.slice(start,start+24),w=1440,h=Math.ceil(batch.length/4)*310+80,cv=createCanvas(w,h),c=cv.getContext('2d');c.fillStyle='#162720';c.fillRect(0,0,w,h);c.fillStyle='#ead79f';c.font='22px sans-serif';c.fillText('HEARTHREAVER / '+family.toUpperCase()+' / TROIS QUARTS',24,38);
 for(let i=0;i<batch.length;i++){const d=batch[i],p=A.raster(d.id),xx=i%4*360,yy=Math.floor(i/4)*310+65,zoom=Math.min(2,Math.floor(325/p.width),Math.floor(260/p.height))||1;A.draw(c,{id:d.id,x:xx+180+(p.anchor[0]-p.width/2)*zoom,y:yy+265,scale:zoom});c.fillStyle='#dacb9d';c.font='13px sans-serif';c.fillText(d.id+' · '+d.label,xx+15,yy+290,335);}
 fs.writeFileSync(path.join(out,'planche-'+family+'-'+(Math.floor(start/24)+1)+'.png'),cv.toBuffer('image/png'));
}}
console.log(JSON.stringify({assets:234,views:696,layerSheets:layerCount,validation:A.validate()}));
