'use strict';
// Piskel's model, serializer and deserializer author the editable layered sources.
const fs=require('node:fs'),path=require('node:path');
const P=require('./environment/piskel.cjs'),I=require('./environment/interieurs.cjs'),O=require('./environment/forteresse-objets.cjs'),F=require('./environment/frames.cjs');
const root=path.resolve(__dirname,'..'),dir=path.join(root,'art/environnement/interieurs/forteresse-gobeline/animations');
const W=64,H=64,anchor=[32,48],blank=()=>new Uint8Array(W*H*4);
function pixel(a,x,y,c){x=Math.round(x);y=Math.round(y);if(x<0||y<0||x>=W||y>=H)return;const i=(y*W+x)*4;a.set(c,i);}
function native(s){const r=I.crop(s),a=blank(),raw=F.rgba(r.g);for(let y=0;y<r.h;y++)for(let x=0;x<r.w;x++){const i=(y*r.w+x)*4;if(raw[i+3])pixel(a,x+anchor[0]-r.ax,y+anchor[1]-r.ay,raw.subarray(i,i+4));}return a;}
function destruction(closed){const chunks=new Map();
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=(y*W+x)*4;if(!closed[i+3])continue;const key=Math.floor(x/5)+','+Math.floor(y/4);if(!chunks.has(key))chunks.set(key,[]);chunks.get(key).push({x,y,c:Array.from(closed.subarray(i,i+4))});}
 const parts=[...chunks.values()].map((pixels,i)=>({pixels,i,x:pixels.reduce((n,p)=>n+p.x,0)/pixels.length,y:pixels.reduce((n,p)=>n+p.y,0)/pixels.length}));
 const wood=[],fx=[];
 for(let f=0;f<8;f++){const a=blank(),e=blank();if(f<2){a.set(closed);for(let y=28;y<43;y++){const x=32+Math.round(Math.sin(y*1.6)*2);pixel(e,x,y,[24,16,16,255]);if(f===0)pixel(e,x+1,y,[255,231,174,255]);}}
  else{const t=[0,0,.1,.25,.45,.68,.87,1][f];for(const part of parts){const vx=(part.x-32)*.65+((part.i%3)-1)*3,vy=((part.i*7)%11)-5,jump=(8+part.i%7)*4*t*(1-t),cx=part.x+vx*t,cy=part.y+(48-part.y)*t+vy*t-jump;
    for(const p of part.pixels){const ox=p.x-part.x,oy=p.y-part.y,turn=f>=3&&part.i%3===0;pixel(a,cx+(turn?-oy:ox),cy+(turn?ox:oy)*(1-t*.65),p.c);}
   }}
  if(f<6){for(let j=0;j<10;j++){const t=(f+1)/6,x=32+Math.cos(j*2.4)*(4+14*t),y=39+Math.sin(j*2.4)*(3+7*t)-8*Math.sin(t*Math.PI);pixel(e,x,y,[213,176,117,255]);if(f<3)pixel(e,x+1,y,[255,233,183,255]);}}
  wood.push(a);fx.push(e);
 }
 return {wood,fx};
}
(async()=>{
 fs.mkdirSync(dir,{recursive:true});const empty=native(O.object('coffre',{progress:1,empty:true}));
 const docs=['tonneau','caisses'].map(name=>{const {wood,fx}=destruction(native(O.object(name)));return {file:name+'-brise.piskel',name:'Forteresse · '+name+' brisé',description:'Ancre 32,48. Impact, rupture, éclats balistiques, retombée, débris persistants.',width:W,height:H,fps:18,layers:[{name:'bois et ferrures',frames:wood},{name:'impact et poussiere',frames:fx}]};});
 docs.push({file:'coffre-vide.piskel',name:'Forteresse · coffre vidé',description:'Ancre 32,48. Intérieur vide, sans or après éjection du butin.',width:W,height:H,fps:1,layers:[{name:'coffre vide',frames:[empty]}]});
 await P.session(async page=>{for(const d of docs){const text=await P.write(page,d),opened=await P.open(page,text);if(opened.layers.length!==d.layers.length)throw Error('Piskel layer mismatch');for(let l=0;l<d.layers.length;l++)for(let f=0;f<d.layers[l].frames.length;f++)if(!Buffer.from(opened.layers[l].frames[f]).equals(Buffer.from(d.layers[l].frames[f])))throw Error('Piskel pixel roundtrip');fs.writeFileSync(path.join(dir,d.file),text+'\n');}});
 console.log('Piskel authored and reopened barrel/crate destruction (8 frames, 2 layers each) and empty chest.');
})().catch(e=>{console.error(e);process.exitCode=1;});
