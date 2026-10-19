'use strict';
const fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process'),{createCanvas}=require('@napi-rs/canvas'),A=require('../sprites/humains/activites'),Scene=require('../sprites/humains/scene');
const root=path.resolve(__dirname,'..'),out=path.join(root,'art/humains/activites'),scratch=fs.mkdtempSync(path.join(require('node:os').tmpdir(),'hearthreaver-human-showcase-'));
const cards=A.directions.map(dir=>({role:'sarak_cavalry',action:'ride',dir,label:'Cavalier · '+dir,sub:'Jambes repliées, selle et rênes'})).concat([
 {role:'miner',action:'mine',dir:'droite',label:'Extraction du minerai',sub:'Mineur · pioche'},
 {role:'smith',action:'forge',dir:'face',label:'Travail de forge',sub:'Forgeron · marteau et pince'},
 {role:'weaver',sex:'feminin',action:'loom',dir:'droite',label:'Tissage d’une étoffe',sub:'Tisserande · métier et navette'},
 {role:'teremor_royal',action:'spear_thrust',dir:'droite',label:'Garde de Teremor',sub:'Lance et bouclier'}
]);
for(let i=0;i<16;i++){
 const cv=createCanvas(1280,820),c=cv.getContext('2d');c.fillStyle='#171e1b';c.fillRect(0,0,1280,820);c.fillStyle='#ddbc78';c.font='32px serif';c.fillText('Humains · tenues et activités',27,44);c.fillStyle='#a3af9f';c.font='14px sans-serif';c.fillText('67 fonctions   /   152 gestes   /   4 directions   /   sources et concepts conservés',28,72);
 cards.forEach((card,index)=>{
  const x=index%4*320,y=Math.floor(index/4)*350+100;c.fillStyle='#252e28';c.fillRect(x+9,y,302,335);const frame=A.frameAt(card.action,i*.12),result=Scene.raster({...card,frame,scene:true}),native=createCanvas(128,128),nc=native.getContext('2d'),pixels=nc.createImageData(128,128);pixels.data.set(result.data);nc.putImageData(pixels,0,0);
  const support=result.metadata.support,cam=result.metadata.camera,mounted=support.kind==='saddle',baseline=cam.ground,scale=Math.min(4,Math.floor(280/cam.width),Math.floor(240/(cam.ground-cam.top+3))),offX=x+160-64*scale,offY=y+260-baseline*scale;c.imageSmoothingEnabled=false;if(support.shadow){c.fillStyle='#1b241e';c.beginPath();c.ellipse(offX+support.ground[0]*scale,offY+support.ground[1]*scale+1,(mounted?12:6)*scale,scale,0,0,Math.PI*2);c.fill();}c.drawImage(native,offX,offY,128*scale,128*scale);c.fillStyle='#e5dfc9';c.font='17px sans-serif';c.fillText(card.label,x+23,y+296);c.fillStyle='#a3af9f';c.font='12px sans-serif';c.fillText(card.sub,x+23,y+318);
 });
 fs.writeFileSync(path.join(scratch,String(i).padStart(2,'0')+'.png'),cv.toBuffer('image/png'));if(i===0)fs.writeFileSync(path.join(out,'apercu.png'),cv.toBuffer('image/png'));
}
execFileSync('python3',['-c',"from PIL import Image\nfrom pathlib import Path\nimport sys\np=Path(sys.argv[1])\nims=[Image.open(f).convert('RGB') for f in sorted(p.glob('*.png'))]\nims[0].save(sys.argv[2],save_all=True,append_images=ims[1:],duration=120,loop=0,optimize=False)\n",scratch,path.join(out,'apercu-anime.gif')]);
fs.rmSync(scratch,{recursive:true,force:true});
console.log('Showcase PNG and animated GIF exported.');
