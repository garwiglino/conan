'use strict';
const fs=require('node:fs'),path=require('node:path');
const {loadGame,canvas,root}=require('../tests/game-harness.cjs'),W=require('./kaldor-weapons.js');
(async()=>{
 const api=await loadGame(),A=api.HearthreaverKaldorCivilianArt;await A.preload();A.wear('brigandine-mercenaire');
 const ids=['exile','croissant-safran','aiguille-corail','brise-givre','lance-boisclair','baton-lianes'];
 const cv=canvas.createCanvas(1320,90+ids.length*230),c=cv.getContext('2d'),atlas=new api.CharacterAtlas();c.imageSmoothingEnabled=false;c.fillStyle='#151e1b';c.fillRect(0,0,cv.width,cv.height);
 c.fillStyle='#efd7a4';c.font='bold 22px sans-serif';c.fillText('Contact en diagonale · quatre vues natives · sans aide / visée corrigée',18,30);
 c.fillStyle='#acbdae';c.font='15px sans-serif';for(let d=0;d<4;d++)c.fillText(['Dos','Profil droit','Face','Profil gauche'][d]+' · avant / après',22+d*330,65);
 for(let i=0;i<ids.length;i++)for(let dir=0;dir<4;dir++){
  const id=ids[i],x=dir*330,y=90+i*230,[fx,fy]=[[0,-1],[1,0],[0,1],[-1,0]][dir],dx=fx*18-fy*12,dy=fy*18+fx*12;
  c.fillStyle=i%2?'#203027':'#1a2721';c.fillRect(x,y,330,230);c.fillStyle='#efd7a4';c.font='14px sans-serif';c.fillText(W.get(id).label,x+10,y+22,310);
  for(let k=0;k<2;k++){
   const actor={weapon:id,dir,combo:0,attack:W.duration(id),x:40,y:52,attackAim:k?W.aimForTarget(id,dir,dx,dy):null};
   const tile=canvas.createCanvas(100,100),t=tile.getContext('2d');t.imageSmoothingEnabled=false;t.translate(10,15);
   A.wield(id,actor);const hero=A.nativeFrame(dir,'attack',2,0,api.swordPose),enemy=atlas.get('skeleton',(dir+2)%4,'idle',0);
   const drawEnemy=()=>t.drawImage(enemy,dx,dy),drawHero=()=>t.drawImage(hero,0,0);
   if(dy<0){drawEnemy();drawHero();}else{drawHero();drawEnemy();}
   c.drawImage(tile,0,0,100,100,x+4+k*160,y+30,160,160);
   const aimActor={...actor,x:0,y:0,impactTick:true,attack:W.duration(id)-W.times(id)[0]-W.times(id)[1]-.001};
   const hit=W.hits(aimActor,{x:dx,y:dy,r:6},2);c.fillStyle=hit?'#9fceb0':'#bc9384';c.font='12px sans-serif';c.fillText((k?'Visée corrigée':'Sans aide')+' · '+(hit?'contact':'hors balayage'),x+10+k*160,y+211,150);
  }
 }
 A.wield(W.START);fs.writeFileSync(path.join(root,'art/combat-precision.png'),cv.toBuffer('image/png'));console.log('Native diagonal contact review in all four views.');
})().catch(e=>{console.error(e);process.exitCode=1;});
