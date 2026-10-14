// Render the shipped game classes, with no art substitutions.
const fs=require('node:fs'),path=require('node:path');
const {loadGame,canvas,root}=require('../tests/game-harness.cjs');
(async()=>{
 const a=await loadGame(),g=new a.Game(),cv=canvas.createCanvas(320,224),r=new a.Renderer(cv,canvas.createCanvas(1,1),g);
 const e=g.enemies.find(e=>e.kind==='boss');g.bossActive=true;g.gate=true;g.seals=[true,true,true];g.arenaLock=true;g.arena=1;g.time=10;g.clock=720;
 Object.assign(e,{x:400,y:105,dir:2,appearAt:-9});Object.assign(g.player,{x:419,y:151,spawnFX:0,dir:0});
 const states=['slash','fan','nova','eruption','transform','death'],times=[.56,.8,.96,.83,.6,1.15];
 const board=canvas.createCanvas(960,448),b=board.getContext('2d');
 for(let i=0;i<states.length;i++){
  e.dead=false;e.rage=false;g.remains=[];g.shots=[];g.hazards=[];a.bossPlay(e,states[i]);
  e.aimX=g.player.x;e.aimY=g.player.y;
  for(let t=0;t<times[i]-.0001;t+=.01){g.time+=.01;g.bossStep(e,.01);}
  if(states[i]==='death'){e.dead=true;g.remains=[{kind:'boss',x:e.x,y:e.y,dir:e.dir,rage:false,age:times[i]}];}
  r.frame();b.drawImage(cv,i%3*320,Math.floor(i/3)*224);b.fillStyle='#f4deb0';b.font='10px monospace';b.fillText(states[i].toUpperCase(),i%3*320+8,Math.floor(i/3)*224+215);
 }
 fs.mkdirSync(path.join(root,'test-output'),{recursive:true});fs.writeFileSync(path.join(root,'test-output/boss-in-game.png'),board.toBuffer('image/png'));
 const arrows=canvas.createCanvas(512,128),ctx=arrows.getContext('2d');ctx.imageSmoothingEnabled=false;ctx.fillStyle='#263239';ctx.fillRect(0,0,512,128);
 for(let d=0;d<8;d++){a.drawBossBolt(ctx,{x:d*64+32,y:64,z:0,age:.12,vx:Math.cos(d*Math.PI/4),vy:Math.sin(d*Math.PI/4),phase:0});}
 fs.writeFileSync(path.join(root,'test-output/jade-bolts.png'),arrows.toBuffer('image/png'));
 console.log('Real game scene: test-output/boss-in-game.png');
})();
