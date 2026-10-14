// Render with the actual game classes and a native Canvas 2D implementation.
const fs = require('node:fs');
const path = require('node:path');
const {loadGame, canvas, root} = require('../tests/game-harness.cjs');
(async () => {
  const api=await loadGame(),out=path.join(root,'test-output');fs.mkdirSync(out,{recursive:true});
  if(process.argv.includes('--export-sheet')) {
    const sheet=canvas.createCanvas(300+api.CO_ART.size[0]*2,api.CO_ART.size[1]*2),s=sheet.getContext('2d');s.imageSmoothingEnabled=false;
    s.fillStyle='#292c30';s.fillRect(0,0,sheet.width,sheet.height);
    s.drawImage(api.BITMAPS.atlas,300,0,api.CO_ART.size[0]*2,api.CO_ART.size[1]*2);
    s.font='18px monospace';s.fillStyle='#e0bf83';
    const meta=JSON.parse(fs.readFileSync(path.join(root,'sprites/personnages/index.json'),'utf8'));
    for(const clip of meta.personnages.gardien.animations) {
      s.fillText(clip.nom,12,clip.ligne*160+65);s.fillText(clip.direction+' / '+clip.images+' poses',12,clip.ligne*160+92);
    }
    fs.writeFileSync(path.join(root,'sprites/personnages/gardien_apercu.png'),sheet.toBuffer('image/png'));
    console.log('Updated the labelled guardian sheet.');return;
  }
  const g=new api.Game(),cv=canvas.createCanvas(320,224),map=canvas.createCanvas(1,1);
  const r=new api.Renderer(cv,map,g);g.player.spawnFX=0;
  const e=g.enemies.find(e=>e.id==='g0'),p=g.player;
  Object.assign(p,{x:e.x+30,y:e.y+24,dir:0});e.ai='chase';g.targetId=e.id;g.clock=720;
  if(process.argv.includes('--death')) {
    const panel=canvas.createCanvas(320*4,224*2),pc=panel.getContext('2d');
    e.guardTime=0;g.damageEnemy(e,100);g.events=[];
    const remain=g.remains.find(x=>x.kind==='guardian');
    for(let i=0;i<8;i++){
      const target=[0,.18,.34,.5,.58,.68,.9,1.4][i];
      while(remain.age<target){const dt=Math.min(.02,target-remain.age);g.updateEffects(dt);g.time+=dt;}
      r.frame();
      pc.drawImage(cv,(i%4)*320,Math.floor(i/4)*224);
    }
    fs.writeFileSync(path.join(out,'colosse-mort-dans-le-jeu.png'),panel.toBuffer('image/png'));
    console.log('Stone-collapse sequence rendered in the actual scene.');return;
  }
  r.frame();fs.writeFileSync(path.join(out,'colosse-dans-le-jeu.png'),cv.toBuffer('image/png'));
  const board=canvas.createCanvas(4*120,5*108),b=board.getContext('2d');
  b.fillStyle='#292c30';b.fillRect(0,0,board.width,board.height);
  for(let dir=0;dir<4;dir++)for(let pose=0;pose<5;pose++) {
    const cell=canvas.createCanvas(120,108),c=cell.getContext('2d');
    const renderer=Object.create(api.Renderer.prototype);renderer.c=c;renderer.g=g;renderer.characters=r.characters;
    Object.assign(e,{x:60,y:80,dir,move:pose?'grab':null,mframe:pose===1?2:pose===2?3:pose===3?4:5,anim:0,guardTime:0,hurt:0,flash:0});
    Object.assign(p,{x:dir===3?23:97,y:83,z:0,dir:(dir+2)%4,held:null,thrown:null});
    if(pose===1||pose===2){p.held={id:e.id};g.syncHeldPlayer(p,e);}
    if(pose===3){g.syncHeldPlayer(p,e);p.thrown={t:0,dur:.5,vx:dir===3?-150:150};}
    const hero=()=>p.held||p.thrown?renderer.heroAir(p):r.characters.draw(c,'hero',p,g.time);
    if(p.held&&dir===0){hero();r.characters.draw(c,'guardian',e,g.time);}else{r.characters.draw(c,'guardian',e,g.time);hero();}
    b.drawImage(cell,dir*120,pose*108);
    b.fillStyle='#e0bf83';b.font='10px monospace';b.fillText(['NORD','EST','SUD','OUEST'][dir]+' '+['REPOS','PRISE','LEVE','LANCER','RETOUR'][pose],dir*120+4,pose*108+102);
  }
  const enlarged=canvas.createCanvas(board.width*3,board.height*3),z=enlarged.getContext('2d');z.imageSmoothingEnabled=false;z.drawImage(board,0,0,enlarged.width,enlarged.height);
  fs.writeFileSync(path.join(out,'colosse-prise-4-directions.png'),enlarged.toBuffer('image/png'));
  console.log('Game scene and grab contact sheet rendered in test-output/.');
})();
