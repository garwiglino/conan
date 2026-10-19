'use strict';
const fs=require('node:fs'),path=require('node:path'),{createCanvas}=require('@napi-rs/canvas');
const A=require('../sprites/architecture/architecture.js'),root=path.resolve(__dirname,'..');
const output=path.join(root,'art/architecture/export');fs.mkdirSync(output,{recursive:true});
A.setCanvasFactory(createCanvas);
function pngOf(id,layer='all'){
 const def=A.entry(id),frames=def.views.map(dir=>A.raster(id,{dir,layer})),cellW=Math.max(...frames.map(p=>p.width))+4,cellH=Math.max(...frames.map(p=>p.height))+4;
 const canvas=createCanvas(cellW*frames.length,cellH),c=canvas.getContext('2d'),metadata={frames:{},meta:{app:'Hearthreaver native JavaScript architecture',version:1,image:id+'.png',format:'RGBA8888',size:{w:canvas.width,h:canvas.height},scale:'1'}};
 let coloured=0;frames.forEach((p,i)=>{const x=i*cellW+Math.floor((cellW-p.width)/2),y=cellH-2-p.height,image=c.createImageData(p.width,p.height);image.data.set(p.data);c.putImageData(image,x,y);coloured+=p.indices.reduce((n,k)=>n+(k!==0),0);metadata.frames[id+'/'+p.dir]={frame:{x,y,w:p.width,h:p.height},rotated:false,trimmed:false,spriteSourceSize:{x:0,y:0,w:p.width,h:p.height},sourceSize:{w:p.width,h:p.height},duration:100,anchor:p.anchor,renderLift:def.frames[p.dir].lift||0,geometry:A.geometry(id,{dir:p.dir})};});
 metadata.definition=def;return {png:canvas.toBuffer('image/png'),metadata,coloured};
}
let layers=0;for(const d of A.list()){
 const dir=path.join(output,d.id);fs.mkdirSync(dir,{recursive:true});const full=pngOf(d.id);fs.writeFileSync(path.join(dir,d.id+'.png'),full.png);fs.writeFileSync(path.join(dir,d.id+'.json'),JSON.stringify(full.metadata,null,2));
 for(const layer of A.layers){const result=pngOf(d.id,layer);if(result.coloured){fs.writeFileSync(path.join(dir,d.id+'-'+layer+'.png'),result.png);layers++;}}
}
const template=fs.readFileSync(path.join(root,'art/architecture/atelier.template.html'),'utf8');
const base='https://hearthreaver-atelier-humains.sheensaw223.chatgpt.site/architecture/';
const html=template.replaceAll('CONCEPT_LINK',base+'index.html').replaceAll('PACK_LINK','architecture-complete.zip').replaceAll('DATA_SCRIPT','../../sprites/architecture/architecture-data.js').replaceAll('RENDERER_SCRIPT','../../sprites/architecture/architecture.js').replaceAll('HUMAN_SCRIPT','../../sprites/architecture/human-reference.js').replaceAll('LOCALITIES_SCRIPT','../../sprites/architecture/localities.js').replaceAll('SOURCE_ROOT',base);
fs.writeFileSync(path.join(root,'art/architecture/atelier.html'),html);
const samples={};for(const family of ['teremor','sylverive','igea','sarak','varan','tagon'])samples[family]=A.assembly(family).map(A.snapshot);
for(const tier of ['village','bourg','chateau'])samples[tier]=A.assembly('teremor',tier).map(A.snapshot);
fs.writeFileSync(path.join(output,'assemblages.json'),JSON.stringify({version:1,humanHeight:19,samples},null,2));
console.log(JSON.stringify({assets:A.list().length,views:696,layerSheets:layers,assemblies:Object.keys(samples).length,output}));
