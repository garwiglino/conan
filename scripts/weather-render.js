// Integrate velocity frame by frame: changing weather must never rewind a drop's path.
class RainVisuals{
 constructor(game,W,H){this.game=game;this.W=W;this.H=H;this.time=game.time;this.slant=.04+.96*clamp(game.sky().wind,0,1);this.drops=[];this.impacts=[];this.credit=0;this.serial=0;}
 step(sky,cam){
  const dt=Math.min(.08,Math.max(0,this.game.time-this.time));this.time=this.game.time;
  const rain=clamp(sky.rain,0,1),area=this.W*this.H/64000,margin=32;
  this.slant+=(.04+.96*clamp(sky.wind,0,1)-this.slant)*(1-Math.exp(-dt*1.5));
  this.count=Math.min(420,Math.round(area*(60+270*rain)*rain));
  while(this.drops.length<this.count){const i=this.drops.length;this.drops.push({x:hash(i,2,71)*(this.W+margin*2)-margin,y:hash(i,3,71)*(this.H+margin*2)-margin,near:i%3!==0,variation:hash(i,1,71),lap:0});}
  for(let i=0;i<this.drops.length;i++){
   const d=this.drops[i],fall=(160+160*rain+d.variation*90)*(d.near?1:.65)*dt;
   d.x-=fall*this.slant;d.y+=fall;
   // Recycle only beyond the visible edges, never reverse or rotate on screen.
   if(d.y>this.H+margin){d.y-=this.H+margin*2;d.x=hash(i,++d.lap,74)*(this.W+margin*2)-margin;}
   if(d.x<-margin)d.x+=this.W+margin*2;
  }
  for(const hit of this.impacts)hit.age+=dt;
  this.impacts=this.impacts.filter(hit=>hit.age<hit.life&&hit.x>=cam.x-8&&hit.x<=cam.x+this.W+8&&hit.y>=cam.y-8&&hit.y<=cam.y+this.H+8);
  this.credit+=dt*Math.min(240,area*(35+135*rain)*rain);
  while(this.credit>=1){
   this.credit--;if(this.impacts.length>=96)continue;
   for(let attempt=0;attempt<3;attempt++){
    const id=++this.serial,x=Math.round(cam.x+hash(id,2,72)*this.W),y=Math.round(cam.y+hash(id,3,73)*this.H),tile=this.game.tile(x,y);
    if([4,6,8].includes(tile)||this.game.tentAt?.(x,y,1))continue;
    this.impacts.push({x,y,age:0,life:.4+hash(id,4,75)*.16,water:tile===3});break;
   }
  }
 }
}
function rainVisuals(renderer,W,H){
 const g=renderer.g,sky=g.sky();
 if(sky.rain<=.01){renderer.rainVisuals=null;return null;}
 let fx=renderer.rainVisuals;
 if(!fx||fx.game!==g||fx.W!==W||fx.H!==H||g.time<fx.time)fx=renderer.rainVisuals=new RainVisuals(g,W,H);
 fx.step(sky,renderer.cam);return fx;
}
function renderRainGround(renderer,c,W,H){
 const fx=rainVisuals(renderer,W,H);if(!fx)return;
 const sky=renderer.g.sky();c.save();c.fillStyle=sky.night>.6?'#d2dfed':'#d0e0e8';
 // Four small pixel-art poses, anchored in world space and drawn below actors/props.
 for(const hit of fx.impacts){
  const {x,y}=hit,ph=hit.age/hit.life;c.globalAlpha=(.62+.2*sky.rain)*(1-skySmooth(.45,1,ph));
  if(ph<.16){c.fillRect(x,y,2,1);continue;}
  const r=ph<.42?1:ph<.7?2:3;
  c.fillRect(x-r,y,1,1);c.fillRect(x+r,y,1,1);
  if(hit.water){c.fillRect(x-r+1,y-1,r*2-1,1);c.fillRect(x-r+1,y+1,r*2-1,1);}
  else if(ph<.7){c.fillRect(x-r,y-1,1,1);c.fillRect(x+r,y-1,1,1);c.fillRect(x,y+1,1,1);}
  else c.fillRect(x-1,y+1,3,1);
 }
 c.restore();
}
function renderWeather(renderer,c,W,VH){
 const g=renderer.g,sky=g.sky(),{rain}=sky,cx=renderer.cam.x,cy=renderer.cam.y;
 const reduced=typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches;
 const flash=g.weather?.flash(reduced)||0,tint=weatherTint(sky,flash),dark=1-(tint[0]*.3+tint[1]*.55+tint[2]*.15)/255;
 renderer.mg=renderer.magic();
 const O=renderer.skyCv||(renderer.skyCv=document.createElement('canvas')),w=Math.ceil(W)+2,h=Math.ceil(VH)+2;
 if(O.width!==w||O.height!==h){O.width=w;O.height=h;}
 const x=O.getContext('2d'),ox=Math.floor(cx),oy=Math.floor(cy);
 x.globalCompositeOperation='source-over';x.fillStyle='rgb('+tint.join(',')+')';x.fillRect(0,0,w,h);
 if(dark>.18){const k=Math.min(1,(dark-.18)/.4);x.globalCompositeOperation='lighter';
  for(const[lx,ly,R,col,amp]of renderer.lights()){
   if(!(R>0)||!Number.isFinite(lx+ly+amp))continue;const X=lx-ox,Y=ly-oy;if(X<-R||Y<-R||X>w+R||Y>h+R)continue;
   x.save();x.translate(X,Y);x.scale(1,.72);const gr=x.createRadialGradient(0,0,0,0,0,R);
   for(const[st,a]of[[0,.92],[.18,.72],[.42,.4],[.68,.15],[.86,.04],[1,0]])gr.addColorStop(st,'rgb('+col.map(v=>Math.round(v*a*amp*k)).join(',')+')');
   x.fillStyle=gr;x.beginPath();x.arc(0,0,R,0,Math.PI*2);x.fill();x.restore();
  }
 }
 c.save();c.globalCompositeOperation='multiply';c.drawImage(O,ox,oy);c.restore();
 if(flash>0){
  // The same strike illuminates the landscape, airborne rain and wet surfaces.
  const side=g.weather.strike.pan,gr=c.createLinearGradient(cx+(side<0?0:W),cy,cx+(side<0?W:0),cy+VH);
  gr.addColorStop(0,'rgba(202,222,250,'+(flash*.12)+')');gr.addColorStop(1,'rgba(156,185,223,0)');
  c.save();c.fillStyle=gr;c.fillRect(cx,cy,W,VH);c.restore();
 }
 if(rain>.01){
  const fx=rainVisuals(renderer,W,VH),bright=.46+.2*rain+.25*flash;
  c.save();c.fillStyle=flash>.15?'#deebff':sky.night>.6?'#91afce':'#b7cedd';
  for(let i=0;i<fx.count;i++){
   const d=fx.drops[i],X=cx+d.x,Y=cy+d.y,len=Math.round((3+rain*7)*(d.near?1:.65));
   c.globalAlpha=bright*(d.near?1:.45);
   // Tail above/right, head below/left. Every segment follows the same falling direction.
   for(let j=0;j<len;j++)c.fillRect(Math.round(X+j*fx.slant),Math.round(Y-j),1,1);
  }
  // Low, transparent spray during a downpour; enough contrast remains for combat.
  if(rain>.65){c.globalAlpha=(rain-.65)*.12;c.fillStyle='#9fb3c7';c.fillRect(cx,cy,W,VH);}
  c.restore();
 }
 renderer.glowFX(c,dark);
}
