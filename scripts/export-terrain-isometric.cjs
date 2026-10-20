'use strict';
const fs=require('node:fs'),path=require('node:path'),{createCanvas,loadImage}=require('@napi-rs/canvas');
const T=require('../sprites/terrain/terrain-isometric'),S=require('../sprites/terrain/terrain-isometric-scene');
const root=path.resolve(__dirname,'..'),out=path.join(root,'art/terrain-isometric-js');
const write=(name,data)=>{const p=path.join(out,name);fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,data);};
const cv=(w,h)=>{const canvas=createCanvas(w,h);canvas.getContext('2d').imageSmoothingEnabled=false;return canvas;};
const png=(name,canvas)=>write(name,canvas.toBuffer('image/png'));
const backdrop=(c,w,h)=>{c.fillStyle='#172723';c.fillRect(0,0,w,h);};
const title=(c,text,x,y,size=24,color='#e1ce9f')=>{c.fillStyle=color;c.font=`${size>=22?'bold ':''}${size}px sans-serif`;c.fillText(text,x,y);};
function canvasOf(im){const c=cv(im.width,im.height),ctx=c.getContext('2d'),data=ctx.createImageData(im.width,im.height);data.data.set(im.data);ctx.putImageData(data,0,0);return c;}
async function main(){
 const records=[],packed=cv(1600,Math.ceil(T.list().length/40)*68),pc=packed.getContext('2d');
 let index=0;
 for(const d of T.list()){
  const p=T.raster(d),image=canvasOf(p),file='tiles/'+d.id.replaceAll('/','-')+'.png',x=index%40*40,y=Math.floor(index/40)*68;
  png(file,image);pc.drawImage(image,x,y);
  records.push({...d,file,width:p.width,height:p.height,anchor:p.anchor,logicalSize:p.logicalSize,elevation:p.elevation,atlas:[x,y,p.width,p.height],footprint:p.footprint});index++;
 }
 png('atlas-pixels-natifs.png',packed);
 write('catalogue.json',JSON.stringify({version:1,projection:'dimetric-2:1',formula:'x=u-v ; y=(u+v)/2-z',unit:16,humanHeight:19,tileCount:records.length,palette:T.palette,maskBits:{north:1,east:2,south:4,west:8},assets:records},null,2)+'\n');
 const columns=[['Sol','ground'],['Terre','bare'],['Sentier','path',5],['Virage','path',3],['Croisée','path',15],['Pavage','paving'],['Rivière','river',5],['Berge','shore',6],['Pont','bridge',0,4,1],['Falaise 16','cliff',6,16],['Falaise 32','cliff',6,32],['Escalier','stairs',0,16],['Cascade','waterfall',0,24,2]];
 const board=cv(1770,1490),bc=board.getContext('2d');backdrop(bc,board.width,board.height);
 title(bc,'HEARTHREAVER / NOUVEL ATLAS DE TERRAIN',26,38,30);title(bc,`${records.length} éléments · 11 biomes · pixels JavaScript · mêmes axes et même échelle que les bâtiments`,26,70,18,'#aebba5');
 columns.forEach(([label],i)=>title(bc,label,192+i*120,112,15));
 T.families.forEach((family,row)=>{
  const y=133+row*120;bc.fillStyle=row%2?'#1c2d27':'#192a25';bc.fillRect(16,y,1736,114);
  title(bc,T.labels[family].split(' / ')[0],28,y+49,17);title(bc,family,28,y+73,12,'#8eab96');
  columns.forEach(([label,kind,mask=0,height=0,dir=0],col)=>{
   const d=T.definition(family,kind,mask,height,dir),im=T.raster(d),image=canvasOf(im);bc.drawImage(image,198+col*120,y+12,im.width*2,im.height*2);
  });
 });
 png('planche-terrain.png',board);
 for(const family of T.families){
  const native=cv(800,520),ctx=native.getContext('2d');backdrop(ctx,800,520);S.render(ctx,S.makeMap(family));
  const large=cv(1600,1040);large.getContext('2d').drawImage(native,0,0,1600,1040);png('scenes/'+family+'.png',large);
  if(family==='grass'){
   png('apercu-monde-isometrique.png',large);
   const caption=cv(1600,1140),c=caption.getContext('2d');backdrop(c,1600,1140);title(c,'HEARTHREAVER / TERRAIN + BÂTIMENTS, MÊME PROJECTION',24,38,26);title(c,'Sols, routes, berges, ponts, falaises, escaliers et cascade · échelle native ×2',24,72,18,'#aebba5');c.drawImage(large,0,100);png('scene-commentee.png',caption);
  }
  const defs=T.list({family}),sheet=cv(1260,Math.ceil(defs.length/14)*128+100),sc=sheet.getContext('2d');backdrop(sc,sheet.width,sheet.height);title(sc,T.labels[family]+' / toutes les pièces et raccords',22,35,24);title(sc,defs.length+' références · zoom ×2 · bits N=1 E=2 S=4 O=8',22,67,16,'#aebba5');
  defs.forEach((d,i)=>{const im=T.raster(d),x=i%14*90,y=Math.floor(i/14)*128+90;sc.drawImage(canvasOf(im),x+12,y,im.width*2,im.height*2);title(sc,d.kind,x+3,y+110,10);title(sc,'m'+d.mask+' z'+d.height+' d'+d.dir,x+3,y+123,10,'#98ac97');});png('planches/'+family+'.png',sheet);
 }
 const montage=cv(1600,Math.ceil(T.families.length/2)*570),mc=montage.getContext('2d');backdrop(mc,montage.width,montage.height);
 for(let i=0;i<T.families.length;i++){const f=T.families[i],x=i%2*800,y=Math.floor(i/2)*570;title(mc,T.labels[f],x+20,y+35,23);mc.drawImage(await loadImage(path.join(out,'scenes/'+f+'.png')),x,y+50,800,520);}png('tous-les-biomes.png',montage);
 // Compare the existing raster with the same logical cells reprojected as geometry.
 const api=await require('../tests/game-harness.cjs').loadGame(),atlas=api.Atlas,art=api.WorldTerrainArt;
 const sources=[];
 for(const [id,biome]of [['desert',1],['forest',6],['snow',11],['marsh',12]]){
  let point;for(const r of atlas.roads.filter(r=>r.type!=='searoutes')){for(const s of r.segments){const x=(s.a[0]+s.b[0])/2,y=(s.a[1]+s.b[1])/2,c=atlas.cellAt(x,y);if(c?.biome===biome){point={x,y};break;}}if(point)break;}
  point||=atlas.cells.find(c=>c.land&&c.biome===biome);
  const x0=Math.floor(point.x)-12,y0=Math.floor(point.y)-11,map=S.extractAtlas(atlas,x0,y0),before=canvasOf(art.render(x0*16,y0*16,384,352)),after=cv(800,520),ac=after.getContext('2d');backdrop(ac,800,520);S.render(ac,map);
  const compare=cv(1600,650),cc=compare.getContext('2d');backdrop(cc,1600,650);title(cc,'ATLAS RÉEL / '+T.labels[id==='forest'?'forest':id],24,38,25);title(cc,'Même rectangle de cellules géographiques · terrain redessiné en géométrie 2:1',24,70,17,'#aebba5');
  title(cc,'ACTUEL / sol en vue de dessus',24,112,18);cc.drawImage(before,26,140,576,528);title(cc,'RECONSTRUIT / projection des bâtiments',820,112,18);cc.drawImage(after,800,125);png('comparaisons/'+id+'.png',compare);sources.push({id,rect:map.atlasRect,codes:[...new Set(map.cells.map(c=>c.sourceCode))]});
 }
 write('extraits-geographiques.json',JSON.stringify(sources,null,2)+'\n');
 for(const [src,dest]of [['sprites/terrain/player-reference.js','runtime/player-reference.js'],['sprites/terrain/terrain-isometric.js','runtime/terrain-isometric.js'],['sprites/terrain/terrain-isometric-scene.js','runtime/terrain-isometric-scene.js'],['sprites/architecture/isometric-catalogue.js','runtime/isometric-catalogue.js'],['sprites/architecture/architecture-isometric.js','runtime/architecture-isometric.js']])write(dest,src.endsWith('terrain-isometric-scene.js')?fs.readFileSync(path.join(root,src),'utf8').replace("require('../architecture/architecture-isometric')","require('./architecture-isometric')"):fs.readFileSync(path.join(root,src)));
 write('runtime/isometric-palettes.json',fs.readFileSync(path.join(root,'sprites/terrain/isometric-palettes.json')));
 write('runtime/isometric-palettes.js','globalThis.HearthreaverTerrainPalettes='+fs.readFileSync(path.join(root,'sprites/terrain/isometric-palettes.json'),'utf8').trim()+';\n');
 write('index.html',fs.readFileSync(path.join(root,'art/terrain-isometric-js/workshop.template.html')));
 console.log(`${records.length} native terrain assets, 11 complete biome boards/scenes and 4 actual atlas comparisons exported to ${out}`);
}
main().catch(e=>{console.error(e);process.exitCode=1;});
