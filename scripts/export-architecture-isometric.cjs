'use strict';
async function main(){
const fs=require('node:fs'),path=require('node:path'),{createCanvas,loadImage}=require('@napi-rs/canvas');
const root=path.resolve(__dirname,'..'),out=path.join(root,'art/architecture-isometric-js'),A=require('../sprites/architecture/architecture-isometric.js'),human=require('../sprites/architecture/human-reference.js');
fs.mkdirSync(out,{recursive:true});fs.mkdirSync(path.join(out,'runtime'),{recursive:true});
for(const name of ['architecture-isometric.js','isometric-catalogue.js','human-reference.js'])fs.copyFileSync(path.join(root,'sprites/architecture',name),path.join(out,'runtime',name));
function canvasOf(p){const cv=createCanvas(p.width,p.height),c=cv.getContext('2d'),im=c.createImageData(p.width,p.height);im.data.set(p.data);c.putImageData(im,0,0);return cv;}
function drawHuman(c,x,y,s){for(let yy=0;yy<human.height;yy++)for(let xx=0;xx<human.width;xx++){const i=human.pixels[yy*human.width+xx];if(i){c.fillStyle=human.palette[i];c.fillRect(x+xx*s,y+yy*s,s,s);}}}
const inventory={version:1,source:'Native JavaScript geometry, no source image decoding',projection:A.projection,scale:A.scale,palette:A.palette,assets:{},views:0};
const layers=['wall','roof','detail','mechanism','snow'];
for(const d of A.list()){
 const folder=path.join(out,'export',d.id);fs.mkdirSync(folder,{recursive:true});
 const record={...d,recipe:d.kind==='building'?A.recipe(d.id):undefined,frames:{}};
 for(const dir of d.views){
  const p=A.raster(d.id,{dir});inventory.views++;
  fs.writeFileSync(path.join(folder,dir+'.png'),canvasOf(p).toBuffer('image/png'));
  record.frames[dir]={width:p.width,height:p.height,anchor:p.anchor,footprint:p.footprint,nativePlan:p.nativePlan,colors:p.colors,geometry:p.geometry};
  for(let k=0;k<layers.length;k++)if(p.layers.some(v=>v===k+1)){
   const data=new Uint8ClampedArray(p.data);for(let i=0;i<p.indices.length;i++)if(p.layers[i]!==k+1)data.fill(0,i*4,i*4+4);
   fs.writeFileSync(path.join(folder,dir+'-'+layers[k]+'.png'),canvasOf({...p,data}).toBuffer('image/png'));
  }
 }
 fs.writeFileSync(path.join(folder,'metadata.json'),JSON.stringify(record,null,2));inventory.assets[d.id]=record;
}
fs.writeFileSync(path.join(out,'catalogue.json'),JSON.stringify(inventory,null,2));
function board(filename,title,ids,cols=4,zoom=2){
 const views=ids.map(id=>A.raster(id)),cellW=Math.max(340,Math.ceil((Math.max(...views.map(p=>p.width))+40)*zoom/10)*10),cellH=Math.max(315,Math.ceil((Math.max(...views.map(p=>p.height))+45)*zoom/10)*10),rows=Math.ceil(ids.length/cols),W=cellW*cols,H=rows*cellH+115;
 const cv=createCanvas(W,H),c=cv.getContext('2d');c.fillStyle='#14241f';c.fillRect(0,0,W,H);c.imageSmoothingEnabled=false;
 c.fillStyle='#e8d3a2';c.font='bold 26px sans-serif';c.fillText(title,25,38);c.font='16px sans-serif';c.fillStyle='#a4b1a2';c.fillText('Pixels JavaScript natifs · isométrie 2:1 · humain 19 px · zoom ×'+zoom+' sans lissage',25,68);
 for(let i=0;i<ids.length;i++){
  const p=views[i],d=A.entry(ids[i]),xx=i%cols*cellW,yy=Math.floor(i/cols)*cellH+88,px=xx+Math.floor((cellW-p.width*zoom)/2),py=yy+cellH-75-p.height*zoom;
  c.strokeStyle='#31483a';c.strokeRect(xx,yy,cellW,cellH);c.drawImage(canvasOf(p),px,py,p.width*zoom,p.height*zoom);
  drawHuman(c,xx+12,yy+cellH-78-19*zoom,zoom);
  c.fillStyle='#e2c797';c.font='bold 15px sans-serif';c.fillText(d.id+' · '+d.label,xx+12,yy+cellH-44,cellW-24);c.fillStyle='#97a799';c.font='13px sans-serif';c.fillText(`${d.width} × ${d.depth} × ${d.height} unités · ${p.width} × ${p.height} px · ${p.colors} couleurs`,xx+12,yy+cellH-20,cellW-24);
 }
 fs.writeFileSync(path.join(out,filename),cv.toBuffer('image/png'));
}
board('apercu-batiments.png','HEARTHREAVER / BÂTIMENTS EN PIXEL ART JAVASCRIPT',['T01','T05','T09','T13','T17','T21','B09','B13','B14','F06','T09-hiver','H04'],4,2);
board('apercu-construction.png','HEARTHREAVER / KIT DE CONSTRUCTION NATIF',['M01','M20','M25','M49','M51','M53','M55','SAR-H01','SAR-H03','SAR-H05','SAR-H07','TAG-H03'],4,3);
const proposal=JSON.parse(fs.readFileSync(path.join(root,'art/architecture-isometrique-proposition/inventaire.json'),'utf8'));
for(const s of proposal.sheets)board('planche-'+String(s.number).padStart(2,'0')+'.png','HEARTHREAVER / CATALOGUE NATIF '+s.number+'/12',s.entries.map(e=>e.id),4,2);
// Preserve the original native renders beside this refinement for direct review.
if(fs.existsSync(path.join(out,'avant/T01.png'))){
 const ids=['T01','T13','T17','F06'],zoom=3,cellW=480,cellH=530,cv=createCanvas(cellW*4,cellH*2+100),c=cv.getContext('2d');
 c.imageSmoothingEnabled=false;c.fillStyle='#14241f';c.fillRect(0,0,cv.width,cv.height);c.font='bold 26px sans-serif';c.fillStyle='#e5d1a2';c.fillText('HEARTHREAVER / DÉTAILS ET USURE',24,37);c.font='16px sans-serif';c.fillStyle='#a6b2a0';c.fillText('Avant / Après · même grille native · maisons ×3, tour ×2 · aucun lissage',24,68);
 for(let i=0;i<ids.length;i++){
  const id=ids[i],before=await loadImage(path.join(out,'avant',id+'.png'));const after=canvasOf(A.raster(id));
  for(let j=0;j<2;j++){
   const xx=(i%2*2+j)*cellW,yy=Math.floor(i/2)*cellH+90,img=j?after:before,scale=id==='F06'?2:zoom;
   c.strokeStyle='#354b3b';c.strokeRect(xx,yy,cellW,cellH);c.fillStyle=j?'#e3ba79':'#a5b29b';c.font='bold 17px sans-serif';c.fillText(id+' · '+(j?'APRÈS':'AVANT'),xx+16,yy+29);
   c.drawImage(img,xx+Math.floor((cellW-img.width*scale)/2),yy+cellH-35-img.height*scale,img.width*scale,img.height*scale);
  }
 }
 fs.writeFileSync(path.join(out,'comparaison-usure.png'),cv.toBuffer('image/png'));
}
const html=fs.readFileSync(path.join(root,'art/architecture-isometric-js/workshop.template.html'),'utf8');fs.writeFileSync(path.join(out,'index.html'),html);
console.log(JSON.stringify({assets:Object.keys(inventory.assets).length,views:inventory.views,palette:A.palette.length-1,output:out}));

}
main().catch(e=>{console.error(e);process.exitCode=1;});
