'use strict';
const fs=require('node:fs'),path=require('node:path');
const {loadGame,canvas,root}=require('../tests/game-harness.cjs'),W=require('./kaldor-weapons.js');
(async()=>{
 const api=await loadGame(),A=api.HearthreaverKaldorCivilianArt;await A.preload();A.wear('brigandine-mercenaire');
 const ids=['exile','aiguille-corail','lance-boisclair','brise-givre'],cv=canvas.createCanvas(1420,4*4*150+80),c=cv.getContext('2d');c.imageSmoothingEnabled=false;
 c.fillStyle='#151e1b';c.fillRect(0,0,cv.width,cv.height);c.fillStyle='#efd7a4';c.font='bold 22px sans-serif';c.fillText('Six poses · mise en tension / charge / impact / prolongement / fin / garde',18,30);
 c.font='15px sans-serif';c.fillStyle='#acbdae';for(const [k,label] of ['Tension','Charge','Impact','Prolongement','Fin du geste','Garde'].entries())c.fillText(label,280+k*188,60);
 for(let i=0;i<ids.length;i++)for(let d=0;d<4;d++){
  const id=ids[i],y=80+(i*4+d)*150;A.wield(id);c.fillStyle=(i*4+d)%2?'#203027':'#1a2721';c.fillRect(0,y,1420,150);
  c.fillStyle='#efd7a4';c.font='bold 16px sans-serif';c.fillText(W.get(id).label,16,y+45,270);
  c.fillStyle='#acbdae';c.font='14px sans-serif';c.fillText(['Dos','Profil droit','Face','Profil gauche'][d],16,y+70);c.fillText(Math.round(W.times(id,0)[4]*1000)+' ms après le contact',16,y+94);
  for(const [k,[frame,combo]]of [[.75,0],[1,0],[2,0],[2.25,0],[3.5,0],[5,0]].entries()){
   c.drawImage(A.nativeFrame(d,frame===5?'idle':'attack',frame===5?0:frame,combo,api.swordPose),0,0,80,80,260+k*188,y-10,170,170);
  }
 }
 fs.writeFileSync(path.join(root,'art/weapon-followthrough.png'),cv.toBuffer('image/png'));console.log('Six native poses in all four views.');
})().catch(e=>{console.error(e);process.exitCode=1;});
