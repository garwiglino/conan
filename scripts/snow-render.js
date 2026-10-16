class SnowVisuals{
 constructor(game,W,H){this.game=game;this.W=W;this.H=H;this.time=game.time;this.flakes=[];}
 step(sky){const dt=clamp(this.game.time-this.time,0,.08);this.time=this.game.time;this.count=Math.min(300,Math.round(this.W*this.H/64000*220*sky.snow));
  while(this.flakes.length<this.count){const i=this.flakes.length;this.flakes.push({x:hash(i,7,51)*this.W,y:hash(i,4,87)*this.H,size:i%5===0?2:1,phase:hash(i,9,55)*6.28});}
  for(const f of this.flakes){f.x-=dt*(12+sky.wind*95+Math.sin(this.time*.6+f.phase)*5);f.y+=dt*(12+f.size*8+sky.blizzard*50);if(f.y>this.H+4)f.y=-4;if(f.x< -4)f.x=this.W+4;}
 }
}
function renderSnowFog(renderer,c,W,H){const g=renderer.g,s=g.sky(),cx=renderer.cam.x,cy=renderer.cam.y;
 c.save();if(s.snow>.005){let fx=renderer.snowVisuals;if(!fx||fx.game!==g||fx.W!==W||fx.H!==H||g.time<fx.time)fx=renderer.snowVisuals=new SnowVisuals(g,W,H);fx.step(s);c.fillStyle='#e3e9ed';for(let i=0;i<fx.count;i++){const f=fx.flakes[i];c.globalAlpha=f.size===2?.8:.48;c.fillRect(Math.round(cx+f.x),Math.round(cy+f.y),f.size,f.size);}}else renderer.snowVisuals=null;
 if(s.fog>.005){c.fillStyle='#bfccd2';c.globalAlpha=s.fog*.20;c.fillRect(cx,cy,W,H);for(let i=0;i<5;i++){const y=((i*H/4+g.time*(2+s.wind*4))%(H+48))-24;c.globalAlpha=s.fog*.045;c.fillRect(cx,cy+y,W,24);}}
 c.restore();
}
