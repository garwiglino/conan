function renderWeather(renderer,c,W,VH){
 const g=renderer.g,sky=g.sky(),{rain,wind}=sky,t=g.time,cx=renderer.cam.x,cy=renderer.cam.y;
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
  const area=W*VH/64000,n=Math.min(420,Math.round(area*(60+270*rain)*rain)),bright=.46+.2*rain+.25*flash;
  c.save();c.fillStyle=flash>.15?'#deebff':sky.night>.6?'#91afce':'#b7cedd';
  for(let i=0;i<n;i++){
   const near=i%3!==0,speed=(160+160*rain+hash(i,1,71)*90)*(near?1:.65),span=VH+40;
   const yy=(hash(i,3,71)*span+t*speed)%span-20,xx=((hash(i,2,71)*(W+80)-t*speed*wind*.45)%(W+80)+W+80)%(W+80)-40;
   const X=Math.round(cx+xx),Y=Math.round(cy+yy),len=Math.round((3+rain*7)*(near?1:.65)),drift=Math.round(wind*len*.45);
   c.globalAlpha=bright*(near?1:.45);c.fillRect(X,Y,1,Math.ceil(len/2));c.fillRect(X-drift,Y+Math.ceil(len/2),1,Math.floor(len/2));
  }
  const count=Math.min(96,Math.round(area*95*rain));c.fillStyle=flash>.15?'#dceaff':'#a1bbcf';
  for(let j=0;j<count;j++){
   const q=t/(.5-.2*rain)+hash(j,4,71),cyc=Math.floor(q),ph=q-cyc,X=Math.round(cx+hash(j,cyc,72)*W),Y=Math.round(cy+hash(j,cyc,73)*VH);
   if([4,6,8].includes(g.tile(X,Y)))continue;c.globalAlpha=(.22+.25*rain+.25*flash)*(1-ph);
   if(ph<.3)c.fillRect(X,Y,1,1);else{const r=ph<.65?1:2;c.fillRect(X-r,Y,1,1);c.fillRect(X+r,Y,1,1);if(ph<.65)c.fillRect(X,Y-1,1,1);}
  }
  // Low, transparent spray during a downpour; enough contrast remains for combat.
  if(rain>.65){c.globalAlpha=(rain-.65)*.12;c.fillStyle='#9fb3c7';c.fillRect(cx,cy,W,VH);}
  c.restore();
 }
 renderer.glowFX(c,dark);
}
