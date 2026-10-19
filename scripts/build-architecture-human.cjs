'use strict';
// Authoring adapter: exact existing civilian pixels become a tiny JS reference.
const fs=require('node:fs'),path=require('node:path'),{createCanvas,loadImage}=require('@napi-rs/canvas');
const root=path.resolve(__dirname,'..'),C=require('../data/civilians/atlas.json');
(async()=>{
 const outfit=C.outfits['E01-masculin-lin-use'],body=C.modules['masculin-adulte'],hair=C.modules['masculin-hair-01'];
 const images=new Map();for(const a of [outfit.asset,outfit.foreground,body.asset,hair.asset])images.set(a,await loadImage(Buffer.from(a.png,'base64')));
 const cv=createCanvas(48,48),c=cv.getContext('2d'),action='idle',dir=0;
 function stamp(a,index){const tile=a.tiles[index];c.drawImage(images.get(a),tile%16*48,Math.floor(tile/16)*48,48,48,0,0,48,48);}
 function moduleStamp(a,plane=0){stamp(a.asset,C.moduleFrames[action][dir]+plane*C.moduleCount);}
 moduleStamp(hair,0);if(outfit.headFirst)moduleStamp(body);stamp(outfit.asset,outfit.frames[action][dir]);moduleStamp(hair,1);if(!outfit.headFirst)moduleStamp(body);stamp(outfit.foreground,outfit.frames[action][dir]);moduleStamp(hair,2);
 const im=c.getImageData(0,0,48,48).data;let x0=48,y0=48,x1=0,y1=0;
 for(let y=0;y<48;y++)for(let x=0;x<48;x++)if(im[(y*48+x)*4+3]){x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);}
 const palette=['#00000000'],pixels=[];for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){const i=(y*48+x)*4;if(!im[i+3]){pixels.push(0);continue;}const hex='#'+[...im.slice(i,i+3)].map(v=>v.toString(16).padStart(2,'0')).join('');if(!palette.includes(hex))palette.push(hex);pixels.push(palette.indexOf(hex));}
 const data={width:x1-x0+1,height:y1-y0+1,palette,pixels,source:'E01-masculin-lin-use / masculin-adulte / masculin-hair-01'};
 if(data.height!==19)throw Error('The actual human reference is '+data.height+'px, not 19');
 const output='/* Exact existing 19px human. No PNG at runtime. */\n(function(r,f){if(typeof module===\'object\'&&module.exports)module.exports=f();else r.HearthreaverArchitectureHuman=f();})(globalThis,function(){return '+JSON.stringify(data)+';});\n';
 fs.writeFileSync(path.join(root,'sprites/architecture/human-reference.js'),output);console.log('Existing human reference:',data.width+' × '+data.height,'native pixels');
})().catch(e=>{console.error(e);process.exitCode=1;});
