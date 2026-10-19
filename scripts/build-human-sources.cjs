/* Native human pixel layers -> small synchronous JavaScript source grids.
 * Aseprite faces, anatomy and hair are copied exactly. No network or image synthesis. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'..'),rig=require('./kaldor-outfit-rig.cjs');
const data=JSON.parse(execFileSync('python3',[path.join(__dirname,'extract-human-sources.py')],{maxBuffer:24*1024*1024}));
const alphabet='0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!#$%&()*+,-/:;<=>?@[]^_{|}~';
function grid(pixels){
 if(!pixels.length)return null;
 const colors=[...new Set(pixels.map(p=>p[2]))];if(colors.length>alphabet.length)throw Error('Source palette too large');
 const x=Math.min(...pixels.map(p=>p[0])),y=Math.min(...pixels.map(p=>p[1]));
 const w=Math.max(...pixels.map(p=>p[0]))-x+1,h=Math.max(...pixels.map(p=>p[1]))-y+1,rows=Array.from({length:h},()=>Array(w).fill('.'));
 for(const [X,Y,c] of pixels)rows[Y-y][X-x]=alphabet[colors.indexOf(c)];
 return {x,y,palette:colors,rows:rows.map(r=>r.join(''))};
}
function nativeLayers(layers){return layers.filter(l=>l.views.some(v=>v.length)).map(l=>({...l,views:l.views.map(grid)}));}
for(const o of Object.values(data.outfits))o.layers=nativeLayers(o.layers);
for(const o of Object.values(data.modules))o.layers=nativeLayers(o.layers);
function fromDefinition(def){
 return rig.build(def).map(l=>({name:l.name,visible:true,views:l.images.map(im=>{
  const points=[];for(let y=0;y<80;y++)for(let x=0;x<80;x++){const i=(y*80+x)*4;if(im[i+3])points.push([x,y,im.subarray(i,i+3).toString('hex')]);}return grid(points);
 })}));
}
data.helmets={};
for(const file of fs.readdirSync(path.join(root,'art/kaldor-tenues')).filter(f=>f.endsWith('.cjs'))){
 const def=require(path.join(root,'art/kaldor-tenues',file));if(!def.id)continue;
 data.outfits['kaldor:'+def.id]={id:'kaldor:'+def.id,label:def.label,sex:'masculin',biome:'special',headFirst:!!def.headFirst,source:'art/kaldor-tenues/'+file,layers:fromDefinition(def)};
}
for(const file of fs.readdirSync(path.join(root,'art/kaldor-casques')).filter(f=>f.endsWith('.cjs'))){
 const def=require(path.join(root,'art/kaldor-casques',file));if(!def.id)continue;
 data.helmets[def.id]={id:def.id,label:def.label,closed:!!def.closed,layers:fromDefinition(def)};
}
data.provenance={archiveSHA256:crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'art/humains-civils-aseprite.zip'))).digest('hex'),directions:['face','droite','dos','gauche'],cell:[80,80],anchor:[40,52],authoring:'Original Aseprite layers and existing JavaScript pixel grids'};
data.alphabet=alphabet;
const out=path.join(root,'sprites/humains');fs.mkdirSync(out,{recursive:true});
fs.writeFileSync(path.join(out,'sources-natives.js'),'/* Generated lossless native human source grids. Rebuild: node scripts/build-human-sources.cjs */\n(function(r,d){if(typeof module===\'object\'&&module.exports)module.exports=d;else r.HearthreaverHumanSources=d;})(globalThis,'+JSON.stringify(data)+');\n');
console.log('Native sources:',Object.keys(data.outfits).length,'bodies,',Object.keys(data.modules).length,'modules,',Object.keys(data.helmets).length,'helmets.');
