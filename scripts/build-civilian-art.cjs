/* Lossless atlas packing: sprite drawing and animation are authored in Aseprite. */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{createCanvas,loadImage}=require('@napi-rs/canvas');
const root=path.resolve(__dirname,'..'),source=path.resolve(process.argv[2]||path.join(root,'../atelier-peuples/humains-animes-01'));
const read=n=>JSON.parse(fs.readFileSync(path.join(source,n),'utf8'));
async function pack(file,count,planes=1,planeHeight=0){
 const im=await loadImage(file),cv=createCanvas(im.width,im.height),ctx=cv.getContext('2d');ctx.drawImage(im,0,0);
 const seen=new Map(),unique=[],tiles=[];
 for(let plane=0;plane<planes;plane++)for(let frame=0;frame<count;frame++){
  const pixels=ctx.getImageData(frame%16*48,Math.floor(frame/16)*48+plane*planeHeight,48,48),bytes=Buffer.from(pixels.data),hash=crypto.createHash('sha256').update(bytes).digest('hex');let id=seen.get(hash);
  if(id===undefined){id=unique.length;seen.set(hash,id);unique.push(pixels);}tiles.push(id);
 }
 const packed=createCanvas(768,Math.ceil(unique.length/16)*48),p=packed.getContext('2d');unique.forEach((im,i)=>p.putImageData(im,i%16*48,Math.floor(i/16)*48));
 return {tiles,unique:unique.length,png:packed.toBuffer('image/png').toString('base64')};
}
(async()=>{
 const inv=read('inventaire.json'),animation=read('animation-index.json'),mods=read('modules-index.json');
 if(animation.outfits.length!==144)throw Error('The complete 144-outfit export must finish first.');
 const result={version:1,authoring:'Aseprite Lua',frameSize:48,anchor:[24,36],directions:['face','droite','dos','gauche'],clips:animation.clips,outfits:{},modules:{},moduleFrames:mods.frames,moduleCount:mods.count};
 const pngDir=path.join(root,'sprites/civilians');fs.mkdirSync(pngDir,{recursive:true});
 for(const entry of animation.outfits){const v=inv.outfits.find(v=>v.id===entry.id),asset=await pack(path.join(source,'exports',entry.id+'.png'),entry.count),foreground=await pack(path.join(source,'premier-plan',entry.id+'.png'),entry.count);result.outfits[v.id]={id:v.id,cut:v.cut,sex:v.sex,label:v.label,biome:v.biome,palette:v.palette,hat:v.hat?path.basename(v.hat,'.aseprite'):null,job:v.job,frames:entry.frames,headFirst:!!entry.headFirst,asset,foreground};fs.writeFileSync(path.join(pngDir,v.id+'.png'),Buffer.from(asset.png,'base64'));fs.writeFileSync(path.join(pngDir,v.id+'-front.png'),Buffer.from(foreground.png,'base64'));}
 for(const m of mods.modules){const asset=await pack(path.join(source,'modules-exports',m.id+'.png'),mods.count,m.planes,mods.planeHeight);result.modules[m.id]={kind:m.kind,planes:m.planes,asset};fs.writeFileSync(path.join(pngDir,m.id+'.png'),Buffer.from(asset.png,'base64'));}
 fs.mkdirSync(path.join(root,'data/civilians'),{recursive:true});fs.writeFileSync(path.join(root,'data/civilians/atlas.json'),JSON.stringify(result));
 const summary={outfits:Object.keys(result.outfits).length,modules:Object.keys(result.modules).length,actions:Object.keys(result.clips),nativeFrames:animation.outfits.reduce((n,a)=>n+a.count,0)+mods.count*mods.modules.length,pngBytes:Object.values(result.outfits).concat(Object.values(result.modules)).reduce((n,a)=>n+Buffer.from(a.asset.png,'base64').length,0)};
 fs.writeFileSync(path.join(root,'data/civilians/summary.json'),JSON.stringify(summary,null,2));console.log(summary);
})();
