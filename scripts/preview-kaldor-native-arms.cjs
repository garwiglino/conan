// Demonstrate a new two-handed weapon using only translated existing arm layers.
'use strict';
const fs=require('node:fs'),path=require('node:path');
const {loadGame,canvas,root}=require('../tests/game-harness.cjs');
const W=require('./kaldor-weapons.js');
(async()=>{
 const api=await loadGame(),A=api.HearthreaverKaldorCivilianArt;await A.preload();A.wield('lance-boisclair');
 const outfits=['pagne-noue','brigandine-mercenaire','pelisse-grand-froid'],labels=['Pagne noué','Brigandine du mercenaire','Pelisse du Grand Froid'];
 const states=[];
 for(let combo=0;combo<4;combo++){
  const total=W.duration('lance-boisclair',combo);
  for(let t=0;t<total;t+=.025){const remaining=total-t,phase=W.frame(remaining,'lance-boisclair',combo);
   states.push({state:'attack',frame:W.sample(remaining,'lance-boisclair',combo),combo,label:(combo+1)+' · '+W.spearNames[combo]+' · '+['Garde','Préparation','Accélération','Impact','Suite du geste','Reprise'][phase]});
  }
  for(let n=0;n<2;n++)states.push({state:'attack',frame:5,combo,label:(combo+1)+' · '+W.spearNames[combo]+' · Garde retrouvée'});
 }
 for(let i=0;i<24;i++)states.push({state:'walk',frame:Math.floor(i/2)%8,combo:0,label:'Marche · garde de lance'});
 for(let i=0;i<14;i++)states.push({state:'sheathe_walk',frame:Math.min(5,Math.floor(i/14*6))*8+i%8,combo:0,label:'Rangement en marchant'});
 for(let i=0;i<20;i++)states.push({state:'sheathed_walk',frame:Math.floor(i/2)%8,combo:0,label:'Lance attachée dans le dos'});
 for(let i=0;i<9;i++)states.push({state:'draw_walk',frame:Math.min(4,Math.floor(i/9*5))*8+i%8,combo:0,label:'Reprise de la lance'});

 const out=path.join(root,'test-output/boisclair-frames');fs.mkdirSync(out,{recursive:true});for(const file of fs.readdirSync(out))if(/^[0-9]+\.png$/.test(file))fs.unlinkSync(path.join(out,file));
 for(let n=0;n<states.length;n++){
  const pose=states[n],cv=canvas.createCanvas(800,624),b=cv.getContext('2d');b.imageSmoothingEnabled=false;
  b.fillStyle='#141c1c';b.fillRect(0,0,800,624);b.fillStyle='#e9d4a4';b.font='bold 19px sans-serif';b.fillText('Lance de Boisclair · deux mains',20,27);
  b.font='14px sans-serif';b.fillStyle='#b2c2b3';b.fillText(pose.label+' · aperçu ralenti',20,50);
  for(let i=0;i<3;i++){
   A.wear(outfits[i]);const y=66+i*180;
   b.font='13px sans-serif';b.fillStyle='#e9d4a4';b.fillText(labels[i],20,y+15);
   for(let d=0;d<4;d++){
    b.fillStyle='#25332e';b.fillRect(d*200+12,y+24,176,152);
    b.drawImage(A.nativeFrame(d,pose.state,pose.frame,pose.combo,api.swordPose),0,0,80,80,d*200+20,y+18,160,160);
   }
  }
  b.font='12px sans-serif';b.fillStyle='#b2c2b3';b.fillText('Dos                           Profil droit                       Face                           Profil gauche',48,619);
  fs.writeFileSync(path.join(out,String(n).padStart(3,'0')+'.png'),cv.toBuffer('image/png'));
 }
 const {execFileSync}=require('node:child_process');
 execFileSync('python3',['-c',`from pathlib import Path
from PIL import Image
frames=[Image.open(f).convert('RGB') for f in sorted(Path(${JSON.stringify(out)}).glob('*.png'))]
frames[0].save(${JSON.stringify(path.join(root,'art/boisclair-animations.gif'))},save_all=True,append_images=frames[1:],duration=40,loop=0,optimize=True,disposal=2)
`]);
 fs.copyFileSync(path.join(root,'art/boisclair-animations.gif'),path.join(root,'art/boisclair-combo-v2.gif'));
 console.log(out,states.length,'frames, GIF regenerated with authored attack timing (1.6x slow motion).');
})().catch(e=>{console.error(e);process.exitCode=1;});
