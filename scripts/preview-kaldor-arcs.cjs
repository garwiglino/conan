// Trace the actual weapon tip, through the held impact and exaggerated finish.
'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),{execFileSync}=require('node:child_process');
const {loadGame,canvas,root}=require('../tests/game-harness.cjs'),W=require('./kaldor-weapons.js');
(async()=>{
 const api=await loadGame(),A=api.HearthreaverKaldorCivilianArt;await A.preload();A.wear('brigandine-mercenaire');
 const old={KALDOR_WEAPONS_DATA:require('../data/weapons/catalogue.json')};
 vm.runInNewContext(execFileSync('git',['show','8199c14:scripts/kaldor-weapons.js'],{cwd:root,encoding:'utf8'}),old);
 const rows=[['exile',0],['croissant-safran',1],['aiguille-corail',2],['hache-darg',2],['brise-givre',0],['lance-boisclair',0],['baton-lianes',3],['garde-palmes',2],['flamme-clairfoyer',3],['crosse-pretre',3]];
 const cv=canvas.createCanvas(1280,80+rows.length*260),c=cv.getContext('2d');c.imageSmoothingEnabled=false;c.fillStyle='#141d1b';c.fillRect(0,0,cv.width,cv.height);
 c.fillStyle='#ecd7aa';c.font='bold 22px sans-serif';c.fillText('Trajectoire de la pointe · avant / après · quatre vues',16,28);
 c.fillStyle='#b5c8b9';c.font='14px sans-serif';c.fillText('Orange pointillé : avant · Vert : nouvel arc · Or : contact · Carré blanc : fin du geste',16,53);
 const point=(p,x,y)=>[x+(40+p.h[0]+p.u[0]*p.reach)*2.3,y+(52+p.h[1]+p.u[1]*p.reach)*2.3];
 for(let i=0;i<rows.length;i++)for(let d=0;d<4;d++){
  const [id,combo]=rows[i],x=d*320,y=80+i*260;A.wield(id);c.fillStyle=i%2?'#22332b':'#1b2a24';c.fillRect(x+3,y,314,252);
  c.fillStyle='#ecd7aa';c.font='bold 13px sans-serif';c.fillText(W.get(id).label,x+10,y+19,298);
  c.fillStyle='#b5c8b9';c.font='12px sans-serif';c.fillText(['Dos','Profil droit','Face','Profil gauche'][d]+' · '+W.comboNames(id)[combo],x+10,y+37,298);
  const bx=x+68,by=y+40;c.drawImage(A.nativeFrame(d,'attack',3.5,combo,api.swordPose),0,0,80,80,bx,by,184,184);
  for(const [model,color,dashed]of [[old.HearthreaverWeapons,'#ba8865',true],[W,'#75dab0',false]]){
   c.strokeStyle=color;c.lineWidth=dashed?1.3:2;c.setLineDash(dashed?[3,3]:[]);c.beginPath();
   for(let k=0;k<=180;k++){const f=1+2.5*k/180,[X,Y]=point(model.pose(id,d,f,combo),bx,by);if(k===0)c.moveTo(X,Y);else c.lineTo(X,Y);}c.stroke();
  }
  c.setLineDash([]);const hit=point(W.pose(id,d,2,combo),bx,by),post=point(W.pose(id,d,3.5,combo),bx,by);
  c.fillStyle='#f5ce6a';c.fillRect(hit[0]-3,hit[1]-3,6,6);c.strokeStyle='#ecf8ef';c.lineWidth=1.4;c.strokeRect(post[0]-3,post[1]-3,6,6);
  c.fillStyle='#b5c8b9';c.fillText(W.get(id).hands+' main'+(W.get(id).hands===2?'s':'')+' · '+W.get(id).weightKg+' kg',x+12,y+239);
 }
 fs.writeFileSync(path.join(root,'art/weapon-arcs.png'),cv.toBuffer('image/png'));console.log('Native tip arcs compared against 8199c14 in four views.');
})().catch(e=>{console.error(e);process.exitCode=1;});
