'use strict';
/* Fichiers .piskel (format de piskelapp.com, modelVersion 2).
 * write : construit les documents avec l'éditeur Piskel lui-même (paquet
 *   @code-dot-org/piskel, servi localement dans Chromium) et sa sérialisation.
 * open : vérifie qu'un document se rouvre dans Piskel et rend ses pixels.
 * read : lecture Node seule (JSON + PNG des calques), sans navigateur. */
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const ROOT=process.env.PISKEL_DIR||path.join(__dirname,'../../node_modules/@code-dot-org/piskel/dest/prod');
const TYPES={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.gif':'image/gif','.svg':'image/svg+xml','.woff':'font/woff','.woff2':'font/woff2','.ttf':'font/ttf'};

async function session(fn){
 if(!fs.existsSync(path.join(ROOT,'index.html')))throw Error('Piskel introuvable dans '+ROOT+' : npm install, ou PISKEL_DIR=<dossier dest/prod>');
 const {chromium}=require('playwright');
 const server=http.createServer((q,r)=>{const p=path.join(ROOT,decodeURIComponent(q.url.split('?')[0]).replace(/^\/+/,'')||'index.html');if(!p.startsWith(ROOT)){r.statusCode=403;return r.end();}fs.readFile(p,(e,d)=>{if(e){r.statusCode=404;return r.end();}r.setHeader('Content-Type',TYPES[path.extname(p)]||'application/octet-stream');r.end(d);});}).listen(0,'127.0.0.1');
 await new Promise(r=>server.on('listening',r));
 const exe=['/opt/pw-browsers/chromium','/usr/bin/chromium'].find(f=>fs.existsSync(f)),browser=await chromium.launch({headless:true,...(exe?{executablePath:exe}:{})});
 try{
  const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:'+server.address().port+'/index.html');
  await page.waitForFunction(()=>window.pskl&&pskl.app&&pskl.app.piskelController,null,{timeout:60000});
  const out=await fn(page);if(errors.length)throw Error('Piskel : '+errors.join(' / '));return out;
 }finally{await browser.close();server.close();}
}
/* doc : {name, description, width, height, fps, layers:[{name, opacity, frames:[RGBA]}]}
 * Les cadres sont des tableaux RGBA (width × height × 4). Renvoie le texte .piskel. */
function write(page,doc){
 const plain={...doc,layers:doc.layers.map(l=>({...l,frames:l.frames.map(f=>Buffer.from(f.buffer,f.byteOffset,f.byteLength).toString('base64'))}))};
 return page.evaluate(d=>{
  const bytes=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
  const layers=d.layers.map(l=>{const layer=new pskl.model.Layer(l.name);layer.setOpacity(l.opacity??1);
   for(const f of l.frames){const px=bytes(f),frame=new pskl.model.Frame(d.width,d.height);
    for(let y=0;y<d.height;y++)for(let x=0;x<d.width;x++){const i=(y*d.width+x)*4;if(px[i+3])frame.setPixel(x,y,((px[i+3]<<24)>>>0)+(px[i+2]<<16)+(px[i+1]<<8)+px[i]);}
    layer.addFrame(frame);}
   return layer;});
  const piskel=pskl.model.Piskel.fromLayers(layers,d.fps||1,new pskl.model.piskel.Descriptor(d.name,d.description||''));
  pskl.app.piskelController.setPiskel(piskel);pskl.app.piskelController.setFPS?.(d.fps||1);
  return pskl.utils.serialization.Serializer.serialize(pskl.app.piskelController.getPiskel());
 },plain);
}
/* Rouvre un texte .piskel avec le désérialiseur de Piskel et rend chaque calque. */
function open(page,text){
 return page.evaluate(t=>new Promise((ok,ko)=>pskl.utils.serialization.Deserializer.deserialize(JSON.parse(t),piskel=>{
  const out={name:piskel.getDescriptor().name,width:piskel.getWidth(),height:piskel.getHeight(),layers:piskel.getLayers().map(l=>({name:l.getName(),opacity:l.getOpacity(),frames:l.getFrames().map(f=>{
   const a=new Uint8Array(f.width*f.height*4);for(let y=0;y<f.height;y++)for(let x=0;x<f.width;x++){const v=f.getPixel(x,y)>>>0,i=(y*f.width+x)*4;a[i]=v&255;a[i+1]=v>>8&255;a[i+2]=v>>16&255;a[i+3]=v>>>24;}
   let s='';for(let i=0;i<a.length;i+=8192)s+=String.fromCharCode.apply(null,a.subarray(i,i+8192));return btoa(s);})}))};
  ok(out);},ko)),text).then(d=>({...d,layers:d.layers.map(l=>({...l,frames:l.frames.map(f=>new Uint8Array(Buffer.from(f,'base64')))}))}));
}
/* Lecture Node : chaque calque est une suite de bandes PNG (cadres côte à côte). */
async function read(file){
 const {createCanvas,loadImage}=require('@napi-rs/canvas'),data=JSON.parse(fs.readFileSync(file,'utf8'));
 if(data.modelVersion!==2)throw Error(file+' : modelVersion '+data.modelVersion+' non pris en charge (réenregistrer dans Piskel)');
 const {width,height}=data.piskel,layers=[];
 for(const s of data.piskel.layers){
  const l=JSON.parse(s),frames=[];
  for(const chunk of l.chunks){
   const im=await loadImage(Buffer.from(chunk.base64PNG.split(',')[1],'base64')),c=createCanvas(im.width,im.height),x=c.getContext('2d');x.drawImage(im,0,0);
   const all=x.getImageData(0,0,im.width,im.height).data,cols=chunk.layout.length,rows=chunk.layout[0].length,fw=im.width/cols,fh=im.height/rows;
   if(fw!==width||fh!==height)throw Error(file+' : cadre '+fw+'×'+fh+' au lieu de '+width+'×'+height);
   chunk.layout.forEach((col,ci)=>col.forEach((index,ri)=>{const f=new Uint8Array(width*height*4);for(let y=0;y<height;y++){const o=((ri*fh+y)*im.width+ci*fw)*4;f.set(all.subarray(o,o+width*4),y*width*4);}frames[index]=f;}));
  }
  layers.push({name:l.name,opacity:l.opacity??1,frames});
 }
 return {name:data.piskel.name,description:data.piskel.description,fps:data.piskel.fps,width,height,layers};
}
module.exports={session,write,open,read,ROOT};
