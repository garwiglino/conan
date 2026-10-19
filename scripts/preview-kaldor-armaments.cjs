'use strict';
const fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process');
const {loadGame,canvas,root}=require('../tests/game-harness.cjs'),W=require('./kaldor-weapons.js');
(async()=>{
 const api=await loadGame(),A=api.HearthreaverKaldorCivilianArt,F=api.Batraciens.Armed;await A.preload();
 const people=[{id:'preview-milice',name:'Garde humain',eventGuard:true},{id:'preview-convoi',name:'Escorte humaine',convoyGuard:true},{id:'preview-piste',name:'Pillard des pistes',kind:'bandit'},...Object.keys(F.ROLES).map(role=>({id:'preview-'+role,name:F.ROLES[role].label,batracien:{role}}))];
 const dir=1,out=path.join(root,'test-output/armed-npc-frames');fs.mkdirSync(out,{recursive:true});
 for(let n=0;n<32;n++){
  const t=n*.05,cv=canvas.createCanvas(900,800),c=cv.getContext('2d');c.imageSmoothingEnabled=false;c.fillStyle='#151d1c';c.fillRect(0,0,900,800);c.fillStyle='#ebd7aa';c.font='bold 22px sans-serif';c.fillText('Armes réellement portées par les combattants',16,28);c.font='14px sans-serif';c.fillStyle='#b3c5b8';c.fillText('Calques natifs humains · animations batraciennes conservées · butin à la première découverte',16,54);
  for(let i=0;i<people.length;i++){
   const p=people[i],id=W.carriedBy(p),w=W.get(id),x=i%3*300,y=80+Math.floor(i/3)*240;
   c.fillStyle='#25342e';c.fillRect(x+5,y+4,290,230);
   let im;if(p.batracien){const action=t<.3?'idle':F.ATTACKS[p.batracien.role][0],elapsed=t<.3?t:t-.3,frame=F.frameAt(action,elapsed);const art=F.raster({...api.KaldorArmaments.batracienOptions(p),role:p.batracien.role,dir,action,frame});im=canvas.createCanvas(80,80);const ctx=im.getContext('2d'),d=ctx.createImageData(80,80);d.data.set(art.data);ctx.putImageData(d,0,0);}else{let state='idle',frame=0;if(t>=.3){state='attack';const at=t-.3;frame=at<.36?(at<.2?0:1):api.attackFrame(Math.max(0,.48-(at-.36)));}im=A.npcFrame({...p,dir},state,frame,id,api.swordPose);}
   c.drawImage(im,0,0,80,80,x-2,y-3,304,304);
   c.fillStyle='#ebd7aa';c.font='bold 14px sans-serif';c.fillText(p.name,x+12,y+24,276);c.font='13px sans-serif';c.fillStyle='#b3c5b8';c.fillText(w.label,x+12,y+45,276);c.fillText(w.hands+' main'+(w.hands===2?'s':'')+' · '+w.weightKg+' kg',x+12,y+218,276);
  }
  fs.writeFileSync(path.join(out,String(n).padStart(3,'0')+'.png'),cv.toBuffer('image/png'));
  if(n===15)fs.writeFileSync(path.join(root,'art/armed-npcs.png'),cv.toBuffer('image/png'));
  A.clear();await new Promise(resolve=>setImmediate(resolve));
 }
 execFileSync('python3',['-c',`from pathlib import Path\nfrom PIL import Image\nframes=[Image.open(f).convert('RGB') for f in sorted(Path(${JSON.stringify(out)}).glob('*.png'))]\nframes[0].save(${JSON.stringify(path.join(root,'art/armed-npcs.gif'))},save_all=True,append_images=frames[1:],duration=50,loop=0,optimize=True,disposal=2)`]);
 console.log('Nine actual fighter loadouts rendered.');
})().catch(e=>{console.error(e);process.exitCode=1;});
