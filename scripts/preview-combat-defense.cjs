'use strict';
const fs=require('node:fs'),path=require('node:path'),{loadGame,canvas}=require('../tests/game-harness.cjs');
(async()=>{const api=await loadGame(),A=api.HearthreaverKaldorCivilianArt,W=api.HearthreaverWeapons;await A.preload();const out=path.resolve(__dirname,'../art/combat-defense');fs.mkdirSync(out,{recursive:true});
 for(const family of Object.keys(W.families)){const w=W.all.find(w=>w.family===family),im=canvas.createCanvas(640,420),c=im.getContext('2d');c.fillStyle='#20232c';c.fillRect(0,0,im.width,im.height);c.font='14px sans-serif';c.fillStyle='#f4dfb7';c.fillText(w.label,12,20);A.wield(w.id);A.wear('cotte-mailles');
  for(let dir=0;dir<4;dir++)for(const [row,state]of ['guard','guard_hit','parry'].entries()){const x=dir*160,y=30+row*128;c.fillStyle='#aeb8bf';c.fillText(['Garde','Blocage','Parade'][row]+' · '+['dos','droite','face','gauche'][dir],x+5,y+14);c.imageSmoothingEnabled=false;const sprite=A.nativeFrame(dir,state,state==='guard'?0:1,0,api.swordPose);c.drawImage(sprite,x,y-10,160,160);}
  fs.writeFileSync(path.join(out,family+'.png'),im.toBuffer('image/png'));
 }
 const G=api.HearthreaverGoblins,im=canvas.createCanvas(1120,680),c=im.getContext('2d');c.fillStyle='#20232c';c.fillRect(0,0,im.width,im.height);c.font='13px sans-serif';
 for(let dir=0;dir<4;dir++)for(const [i,f]of [0,.75,1,1.25,2,3,4].entries()){const sprite=G.raster('guerrier-kesh','attack',dir,f,dir%4),cv=canvas.createCanvas(80,80),cx=cv.getContext('2d'),data=cx.createImageData(80,80);data.data.set(sprite.data);cx.putImageData(data,0,0);c.fillStyle='#f4dfb7';c.fillText('Vue '+dir+' · '+f,i*160+8,dir*170+20);c.imageSmoothingEnabled=false;c.drawImage(cv,i*160,dir*170+6,160,160);}
 fs.writeFileSync(path.join(out,'goblin-prehit.png'),im.toBuffer('image/png'));console.log('Defense poses for every family and four-view goblin preparation rendered.');
})().catch(e=>{console.error(e);process.exitCode=1;});
