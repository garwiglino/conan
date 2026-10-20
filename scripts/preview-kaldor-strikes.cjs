// Review real-time strikes face-on and in profile with the shipped compositor.
'use strict';
const fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process');
const {loadGame,canvas,root}=require('../tests/game-harness.cjs'),W=require('./kaldor-weapons.js');
(async()=>{
 const {HearthreaverKaldorCivilianArt:A,swordPose}=await loadGame();await A.preload();
 const contactOnly=process.argv.includes('--contact-only'),focus=process.argv.includes('--pole-grips'),columns=focus?3:4,name=focus?'pole-grips':'armory-strikes';
 const ids=focus?['lance-boisclair','harpon-joncs','lance-palmehaute','lance-chenal','sarisse-horizon','baton-lianes']:['exile','croissant-safran','aiguille-corail','hache-darg','brise-givre','lance-boisclair','baton-lianes','garde-palmes'];
 const out=path.join(root,'test-output/'+name+'-frames');fs.mkdirSync(out,{recursive:true});
 if(!contactOnly)for(const f of fs.readdirSync(out))if(/^\d+\.png$/.test(f))fs.unlinkSync(path.join(out,f));
 if(!contactOnly)for(let n=0;n<144;n++){
  const t=n/24,cv=canvas.createCanvas(columns*320,640),c=cv.getContext('2d');c.imageSmoothingEnabled=false;
  c.fillStyle='#141d1c';c.fillRect(0,0,cv.width,640);c.fillStyle='#efd7a4';c.font='bold 21px sans-serif';c.fillText(focus?'Prises de face · lances, harpons et hampes':'Coups retravaillés · face et profil · vitesse réelle',18,28);
  c.fillStyle='#afc0b4';c.font='14px sans-serif';c.fillText(focus?'Préparations alternées · impacts dans l’axe · mains sur la hampe · vitesse réelle':'Quatre coups par arme · anticipation courte, frappe sèche, reprise de garde · calques des bras intacts',18,51);
  for(let i=0;i<ids.length;i++){
   const id=ids[i],w=W.get(id),look=focus&&t<.8?{state:'idle',frame:0,combo:0,label:'Garde · prises en diagonale'}:W.preview(id,focus?t-.8:t,'attack',A.frameAt('idle',t)),x=i%columns*320,y=66+Math.floor(i/columns)*280;
   A.wield(id);A.wear('brigandine-mercenaire');c.fillStyle='#25332e';c.fillRect(x+5,y,310,268);
   c.fillStyle='#efd7a4';c.font='bold 14px sans-serif';c.fillText(w.label,x+14,y+23,290);
   c.fillStyle='#afc0b4';c.font='12px sans-serif';c.fillText(w.hands+' main'+(w.hands===2?'s':'')+' · '+w.weightKg+' kg',x+14,y+43);
   if(focus)c.drawImage(A.nativeFrame(2,look.state,look.frame,look.combo,swordPose),0,0,80,80,x+40,y+16,240,240);
   else for(const [k,d]of [2,1].entries())c.drawImage(A.nativeFrame(d,look.state,look.frame,look.combo,swordPose),0,0,80,80,x+k*156,y+44,160,160);
   c.fillStyle='#afc0b4';if(focus)c.fillText('Face',x+144,y+211);else{c.fillText('Face',x+64,y+211);c.fillText('Profil',x+220,y+211);}
   c.fillStyle='#efd7a4';c.fillText(look.label,x+14,y+243,292);
  }
  fs.writeFileSync(path.join(out,String(n).padStart(3,'0')+'.png'),cv.toBuffer('image/png'));
 }
 // A contact sheet makes the grip travel and the separate combo shapes reviewable.
 const cv=canvas.createCanvas(1120,ids.length*(focus?200:160)+55),c=cv.getContext('2d');c.imageSmoothingEnabled=false;c.fillStyle='#141d1c';c.fillRect(0,0,cv.width,cv.height);
 c.fillStyle='#efd7a4';c.font='18px sans-serif';c.fillText(focus?'Face · les quatre impacts convergent dans l’axe du joueur':'Face · préparation / impact / après-impact / garde',16,30);
 for(let i=0;i<ids.length;i++){
  const id=ids[i],w=W.get(id),y=55+i*(focus?200:160);A.wield(id);c.fillStyle='#afc0b4';c.font='14px sans-serif';c.fillText(w.label,12,y+30,170);
  for(let k=0;k<4;k++){const f=focus?2:[1,2,3.5,0][k];c.drawImage(A.nativeFrame(2,!focus&&k===3?'idle':'attack',f,focus?k:0,swordPose),0,0,80,80,180+k*230,y,focus?200:154,focus?200:154);}
 }
 fs.writeFileSync(path.join(root,'art/'+name+'.png'),cv.toBuffer('image/png'));
 if(!contactOnly)execFileSync('python3',['-c',`from pathlib import Path
from PIL import Image
frames=[Image.open(f).convert('RGB') for f in sorted(Path(${JSON.stringify(out)}).glob('*.png'))]
frames[0].save(${JSON.stringify(path.join(root,'art/'+name+'.gif'))},save_all=True,append_images=frames[1:],duration=[40,40,45]*48,loop=0,optimize=True,disposal=2)
`]);
 console.log('Face/profile strike review rendered at real weapon cadence.');
})().catch(e=>{console.error(e);process.exitCode=1;});
