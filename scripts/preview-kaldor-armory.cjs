// Compare actual weighted combat timing and centered back storage, using the
// shipped native-layer compositor. No character pixels are generated here.
'use strict';
const fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process');
const {loadGame,canvas,root}=require('../tests/game-harness.cjs'),W=require('./kaldor-weapons.js');
(async()=>{
 const {HearthreaverKaldorCivilianArt:A,swordPose}=await loadGame();await A.preload();
 const ids=['exile','croissant-safran','aiguille-corail','hache-darg','brise-givre','lance-boisclair','baton-lianes','garde-palmes'];
 const out=path.join(root,'test-output/armory-frames');fs.mkdirSync(out,{recursive:true});for(const f of fs.readdirSync(out))if(/^\d+\.png$/.test(f))fs.unlinkSync(path.join(out,f));
 const step=.05,seconds=9.5;
 for(let n=0;n<seconds/step;n++){
  const t=n*step,combat=t<6,cv=canvas.createCanvas(960,626),c=cv.getContext('2d');c.imageSmoothingEnabled=false;
  c.fillStyle='#151d1c';c.fillRect(0,0,960,626);c.font='bold 20px sans-serif';c.fillStyle='#ebd7aa';c.fillText('Arsenal de Kaldor · huit familles',16,26);
  c.font='14px sans-serif';c.fillStyle='#b3c5b8';c.fillText(combat?'Combos à vitesse réelle · appuis et traînées selon le poids':'Rangement et dégainage · armes centrées sur le dos',16,49);
  for(let i=0;i<ids.length;i++){
   const id=ids[i],w=W.get(id),look=W.preview(id,combat?t:t-6,combat?'attack':'holster'),x=i%4*240,y=64+Math.floor(i/4)*278;
   A.wield(id);A.wear('brigandine-mercenaire');
   c.fillStyle='#25342e';c.fillRect(x+5,y+4,230,267);
   c.drawImage(A.nativeFrame(combat?1:0,look.state,look.frame,look.combo,swordPose),0,0,80,80,x,y+12,240,240);
   c.fillStyle='#ebd7aa';c.font='bold 13px sans-serif';c.fillText(w.label,x+12,y+22,218);
   c.fillStyle='#b3c5b8';c.font='12px sans-serif';c.fillText(w.hands+' main'+(w.hands===2?'s':'')+' · '+w.weightKg+' kg',x+12,y+40);
   c.fillText(look.label,x+12,y+252,216);
  }
  fs.writeFileSync(path.join(out,String(n).padStart(3,'0')+'.png'),cv.toBuffer('image/png'));
  if(Math.abs(t-7.3)<.01)fs.writeFileSync(path.join(root,'art/armory-centered-back.png'),cv.toBuffer('image/png'));
 }
 execFileSync('python3',['-c',`from pathlib import Path
from PIL import Image
frames=[Image.open(f).convert('RGB') for f in sorted(Path(${JSON.stringify(out)}).glob('*.png'))]
frames[0].save(${JSON.stringify(path.join(root,'art/armory-combos.gif'))},save_all=True,append_images=frames[1:],duration=50,loop=0,optimize=True,disposal=2)
`]);
 console.log('Eight-family comparison GIF and centered-back still rendered.');
})().catch(e=>{console.error(e);process.exitCode=1;});
