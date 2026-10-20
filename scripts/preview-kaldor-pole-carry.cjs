// Normal carrying and back storage, using the shipped human compositor.
'use strict';
const fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process');
const {loadGame,canvas,root}=require('../tests/game-harness.cjs'),W=require('./kaldor-weapons.js');
(async()=>{
 const api=await loadGame(),A=api.HearthreaverKaldorCivilianArt;await A.preload();A.wear('brigandine-mercenaire');
 const ids=['lance-boisclair','baton-lianes'],views=[2,1,0,3],names=['Face','Profil droit','Dos','Profil gauche'];
 const out=path.join(root,'test-output/pole-carry-frames');fs.mkdirSync(out,{recursive:true});
 for(const f of fs.readdirSync(out))if(/^\d+\.png$/.test(f))fs.unlinkSync(path.join(out,f));
 for(let n=0;n<120;n++){
  const t=n/24,cv=canvas.createCanvas(960,630),c=cv.getContext('2d');c.imageSmoothingEnabled=false;
  c.fillStyle='#141d1c';c.fillRect(0,0,960,630);c.fillStyle='#efd7a4';c.font='bold 20px sans-serif';c.fillText('Lances et bâtons · tenue normale et rangement',16,27);
  c.fillStyle='#afc0b4';c.font='14px sans-serif';c.fillText('En main : diagonale, main haute / main basse · Dans le dos : droit de profil, oblique de dos',16,50);
  for(let i=0;i<ids.length;i++)for(let j=0;j<views.length;j++){
   const id=ids[i],x=j*240,y=66+i*280,look=t<.6?{state:'idle',frame:A.frameAt('idle',t),combo:0,label:'Repos armé'}:W.preview(id,t-.6,'holster',A.frameAt('idle',t));A.wield(id);
   c.fillStyle='#25332e';c.fillRect(x+4,y,232,273);c.fillStyle='#efd7a4';c.font='14px sans-serif';c.fillText(W.get(id).label,x+12,y+20,220);
   c.fillStyle='#afc0b4';c.font='12px sans-serif';c.fillText(names[j],x+12,y+39);
   c.drawImage(A.nativeFrame(views[j],look.state,look.frame,look.combo,api.swordPose),0,0,80,80,x,y+17,240,240);
   c.fillStyle='#efd7a4';c.fillText(look.label,x+12,y+262,220);
  }
  fs.writeFileSync(path.join(out,String(n).padStart(3,'0')+'.png'),cv.toBuffer('image/png'));
 }
 execFileSync('python3',['-c',`from pathlib import Path
from PIL import Image
frames=[Image.open(f).convert('RGB') for f in sorted(Path(${JSON.stringify(out)}).glob('*.png'))]
frames[0].save(${JSON.stringify(path.join(root,'art/pole-carry.gif'))},save_all=True,append_images=frames[1:],duration=[40,40,45]*40,loop=0,optimize=True,disposal=2)
frames[8].save(${JSON.stringify(path.join(root,'art/pole-carry.png'))})
`]);
 console.log('Normal pole carrying and back storage rendered in all four views.');
})().catch(e=>{console.error(e);process.exitCode=1;});
