// Compare actual native impact drawings against the last published weapon rig.
'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),{execFileSync}=require('node:child_process');
const {loadGame,canvas,root}=require('../tests/game-harness.cjs'),W=require('./kaldor-weapons.js');
(async()=>{
 const api=await loadGame(),A=api.HearthreaverKaldorCivilianArt;await A.preload();A.wear('brigandine-mercenaire');
 const baseline={KALDOR_WEAPONS_DATA:require('../data/weapons/catalogue.json')};
 vm.runInNewContext(execFileSync('git',['show','3c2de1c:scripts/kaldor-weapons.js'],{cwd:root,encoding:'utf8'}),baseline);
 const global=api.Game.constructor('return globalThis')(),current=global.HearthreaverWeapons;
 const rows=[['exile',2],['croissant-safran',0],['aiguille-corail',2],['hache-darg',0],['brise-givre',2],['lance-boisclair',1],['baton-lianes',2],['garde-palmes',3]];
 const cv=canvas.createCanvas(1000,rows.length*210+84),c=cv.getContext('2d');c.imageSmoothingEnabled=false;c.fillStyle='#141d1c';c.fillRect(0,0,cv.width,cv.height);
 c.font='bold 22px sans-serif';c.fillStyle='#efd7a4';c.fillText('Impact dans l’axe · avant / après · poses natives du jeu',16,30);
 c.font='13px sans-serif';c.fillStyle='#afc0b4';c.fillText('Repère or : axe de frappe · Vert : nouveau contact · Préparations et après-impacts restent distincts',16,52);
 try{
  for(let i=0;i<rows.length;i++){
   const [id,combo]=rows[i],y=84+i*210;A.wield(id);c.fillStyle='#25332e';c.fillRect(4,y,992,202);
   c.fillStyle='#efd7a4';c.font='13px sans-serif';c.fillText(W.get(id).label+' · '+W.comboNames(id)[combo],14,y+20,970);
   for(let k=0;k<4;k++){
    const dir=k<2?2:1,after=!!(k%2),x=k*250,weapon=after?api.HearthreaverWeapons:baseline.HearthreaverWeapons;
    global.HearthreaverWeapons=weapon;A.clear();const im=A.nativeFrame(dir,'attack',2,combo,api.swordPose),p=weapon.pose(id,dir,2,combo);
    c.fillStyle='#afc0b4';c.font='12px sans-serif';c.fillText((dir===2?'Face':'Profil')+' · '+(after?'Après':'Avant'),x+12,y+40);
    c.save();c.translate(x+42,y+37);c.scale(2,2);c.strokeStyle='#a6894e';c.setLineDash([2,2]);c.beginPath();c.moveTo(40,43);c.lineTo(dir===1?74:40,dir===1?43:75);c.stroke();
    c.drawImage(im,0,0);c.setLineDash([]);c.strokeStyle=after?'#a5d6a2':'#c98a77';c.strokeRect(40+p.h[0]+p.u[0]*p.reach-1,52+p.h[1]+p.u[1]*p.reach-1,2,2);c.restore();
   }
  }
 }finally{global.HearthreaverWeapons=current;A.clear();}
 fs.writeFileSync(path.join(root,'art/weapon-impact-before-after.png'),cv.toBuffer('image/png'));
 console.log('Native before/after impact comparison rendered.');
})().catch(e=>{console.error(e);process.exitCode=1;});
