// One fourth strike at real cadence, with the game's native layers and effects.
'use strict';
const fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process');
const {loadGame,canvas,root}=require('../tests/game-harness.cjs'),W=require('./kaldor-weapons.js');
(async()=>{
 const api=await loadGame(),A=api.HearthreaverKaldorCivilianArt;await A.preload();
 const ids=['exile','lance-boisclair','hache-darg','croissant-safran','brise-givre','crosse-pretre','aiguille-corail','garde-palmes','flamme-clairfoyer','serment-boreal','sarisse-horizon','crochet-kesh'];
 const out=path.join(root,'test-output/finisher-frames');fs.mkdirSync(out,{recursive:true});
 for(const f of fs.readdirSync(out))if(/^\d+\.png$/.test(f))fs.unlinkSync(path.join(out,f));
 for(let n=0;n<96;n++){
  const cv=canvas.createCanvas(960,1190),c=cv.getContext('2d');c.imageSmoothingEnabled=false;c.fillStyle='#141d1c';c.fillRect(0,0,960,1190);
  c.font='bold 22px sans-serif';c.fillStyle='#efd7a4';c.fillText('Quatrièmes coups · une frappe, un impact · vitesse réelle',18,28);
  c.font='14px sans-serif';c.fillStyle='#afc0b4';c.fillText('12 exemples · 4 poses franches, vrai idle et effets propres aux armes · bras et tenues conservés',18,51);
  for(let i=0;i<ids.length;i++){
   const w=W.get(ids[i]),look=W.preview(w.id,n/24,'finisher',A.frameAt('idle',n/24)),x=i%3*320,y=68+Math.floor(i/3)*280;
   A.wield(w.id);A.wear('brigandine-mercenaire');
   c.fillStyle='#25332e';c.fillRect(x+5,y,310,271);c.fillStyle='#efd7a4';c.font='bold 14px sans-serif';c.fillText(w.label,x+14,y+23,290);
   c.fillStyle='#afc0b4';c.font='12px sans-serif';c.fillText(w.hands+' main'+(w.hands===2?'s':'')+' · '+(w.finisher.magic?'Manifestation magique':'Frappe physique'),x+14,y+43,292);
   c.drawImage(A.nativeFrame(2,look.state,look.frame,look.combo,api.swordPose),0,0,80,80,x+40,y+25,240,240);
   c.fillStyle='#efd7a4';c.fillText(w.finisher.name,x+14,y+246,290);c.fillStyle='#afc0b4';c.fillText(look.label.split(' · ').at(-1),x+14,y+263,290);
  }
  fs.writeFileSync(path.join(out,String(n).padStart(3,'0')+'.png'),cv.toBuffer('image/png'));
 }
 // Poses at actual contact: every weapon's own finisher, no borrowed sprite.
 const cv=canvas.createCanvas(1320,8*210+52),c=cv.getContext('2d');c.imageSmoothingEnabled=false;c.fillStyle='#141d1c';c.fillRect(0,0,cv.width,cv.height);
 c.fillStyle='#efd7a4';c.font='20px sans-serif';c.fillText('48 armes · 48 quatrièmes coups',16,30);
 for(let i=0;i<W.all.length;i++){
  const w=W.all[i],x=i%6*220,y=52+Math.floor(i/6)*210;A.wield(w.id);
  c.fillStyle='#25332e';c.fillRect(x+4,y,212,204);c.drawImage(A.nativeFrame(2,'attack',2.25,3,api.swordPose),0,0,80,80,x+30,y-2,160,160);
  c.fillStyle='#efd7a4';c.font='12px sans-serif';c.fillText(w.label,x+10,y+167,200);c.fillStyle='#afc0b4';c.font='11px sans-serif';c.fillText(w.finisher.name,x+10,y+184,200);c.fillText(w.finisher.magic?'Effets magiques':W.families[w.family]+' · physique',x+10,y+198,200);
 }
 fs.writeFileSync(path.join(root,'art/weapon-finishers.png'),cv.toBuffer('image/png'));
 execFileSync('python3',['-c',`from pathlib import Path
from PIL import Image
frames=[Image.open(f).convert('RGB') for f in sorted(Path(${JSON.stringify(out)}).glob('*.png'))]
frames[0].save(${JSON.stringify(path.join(root,'art/weapon-finishers.gif'))},save_all=True,append_images=frames[1:],duration=[40,40,45]*32,loop=0,optimize=True,disposal=2)
`]);console.log('Fourth-strike comparison and all-48 contact sheet rendered.');
})().catch(e=>{console.error(e);process.exitCode=1;});
