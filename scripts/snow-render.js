// Screen-space flakes: neither camera translation nor actor facing affects velocity.
class SnowVisuals{
 constructor(game,W,H){this.game=game;this.W=W;this.H=H;this.time=game.time;this.flakes=[];this.slant=.12;}
 step(sky){const dt=clamp(this.game.time-this.time,0,.08);this.time=this.game.time;const snow=clamp(sky.snow||0,0,1),wind=clamp(sky.wind||0,0,1),blizzard=clamp(sky.blizzard||0,0,1),margin=12;
  this.slant+=(.08+wind*1.1+blizzard*.22-this.slant)*(1-Math.exp(-dt*1.4));this.count=Math.min(300,Math.round(this.W*this.H/64000*220*snow));
  while(this.flakes.length<this.count){const i=this.flakes.length;this.flakes.push({x:hash(i,7,51)*this.W,y:hash(i,4,87)*this.H,size:i%5===0?2:1,lap:0});}
  for(let i=0;i<this.flakes.length;i++){const f=this.flakes[i],fall=dt*(18+f.size*7+snow*10+blizzard*28);f.x-=fall*this.slant;f.y+=fall;
   if(f.y>this.H+margin){f.y-=this.H+margin*2;f.x=hash(i,++f.lap,53)*(this.W+margin*2)-margin;}if(f.x< -margin)f.x+=this.W+margin*2;
  }
 }
}
function renderSnowFog(renderer,c,W,H){const g=renderer.g,s=g.sky(),K=renderer.k||1;
 c.save();c.setTransform?.(K,0,0,K,0,(renderer.top||0)*K);
 if(s.snow>.005){let fx=renderer.snowVisuals;if(!fx||fx.game!==g||fx.W!==W||fx.H!==H||g.time<fx.time)fx=renderer.snowVisuals=new SnowVisuals(g,W,H);fx.step(s);c.fillStyle='#e3e9ed';for(let i=0;i<fx.count;i++){const f=fx.flakes[i];c.globalAlpha=f.size===2?.8:.48;c.fillRect(Math.round(f.x),Math.round(f.y),f.size,f.size);}}else renderer.snowVisuals=null;
 if(s.fog>.005){c.fillStyle='#bfccd2';c.globalAlpha=s.fog*.20;c.fillRect(0,0,W,H);for(let i=0;i<5;i++){const y=((i*H/4+g.time*(2+s.wind*4))%(H+48))-24;c.globalAlpha=s.fog*.045;c.fillRect(0,y,W,24);}}
 c.restore();
}
