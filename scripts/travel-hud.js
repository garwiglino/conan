/* Compact HUD: one horizontal status row, two stable location lines. */
const travelPlain=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/œ/g,'oe').replace(/[’]/g,"'");
function travelText(c,value,x,y,color='#e9d8b6',size=6){c.font=size+'px PixelUI, monospace';c.textBaseline='top';c.fillStyle=color;c.fillText(travelPlain(value),Math.round(x),Math.round(y));}
function travelFit(c,value,max){let s=travelPlain(value);if(c.measureText(s).width<=max)return s;while(s.length&&c.measureText(s+'...').width>max)s=s.slice(0,-1);return s+'...';}
const travelResize=Renderer.prototype.resize;
Renderer.prototype.resize=function(...args){travelResize.apply(this,args);this.hudRows=1;this.top=22+(this.safe.t||0);};
Renderer.prototype.travelHudBar=function(){
 const c=this.c,g=this.g,p=g.player,W=this.W,s=this.safe,y=s.t,x=s.l+5,available=W-s.l-s.r-10,gap=Math.max(0,(available-204)/5);
 c.save();box(c,0,0,W,this.top,'#1b1512');box(c,0,this.top-3,W,1,'#c99a48');box(c,0,this.top-2,W,1,'#6a4220');box(c,0,this.top-1,W,1,'#0e0b09');
 for(let i=0;i<5;i++)this.heart(x+i*9,y+5,clamp(p.hp-i*2,0,2));box(c,x,y+14,44,2,'#493727');box(c,x,y+14,Math.round(44*clamp(1-p.dashCD/.8,0,1)),1,'#c99a48');
 let at=x+49+gap;this.lifeHead(at,y+5);travelText(c,String(p.lives??LIVES),at+9,y+6);at+=22+gap;
 pixels(c,['.111.','12221','12321','12221','.111.'],at,y+6,{'1':'#78502b','2':'#ddb461','3':'#fff0b0'});const coins=p.coins>=10000?Math.floor(p.coins/1000)+'k':String(p.coins);travelText(c,coins,at+7,y+6);at+=34+gap;
 const L=g.lvl();travelText(c,String(L.level),at,y+6,'#f3daa0');box(c,at+10,y+6,22,6,'#59402a');box(c,at+11,y+7,20,4,'#171a19');box(c,at+11,y+7,Math.round(20*(L.need?L.into/L.need:1)),3,'#79bac2');if(p.comboWindow>0)for(let i=0;i<4;i++)box(c,at+11+i*5,y+14,3,1,i<=p.combo?'#dfc190':'#4b3825');at+=37+gap;
 const food=g.needs?.satiety??100,sweat=(g.bodyHeat?.().hunger??1)>1;pixels(c,['.1111.','122231','122331','.1111.'],at,y+5,{'1':'#77512c','2':'#d8aa61','3':'#f3d092'});box(c,at+8,y+5,24,6,'#4c3a28');box(c,at+9,y+6,22,4,'#171914');box(c,at+9,y+6,Math.round(22*food/100),3,food<25?'#cc8164':sweat?'#d99a4a':'#a6b977');travelText(c,Math.round(food)+'%',at+9,y+12,'#c6bd9c',5);
 // Too warm an outfit: a sweat drop beside the gauge, which digs faster.
 if(sweat)pixels(c,['.1.','121','121','.1.'],at+3,y+11,{'1':'#c97a2c','2':'#f2c36b'});at+=37+gap;
 for(let i=0;i<3;i++)pixels(c,['.0.','010','.0.'],at+i*6,y+7,{'0':g.seals[i]?'#dbb86b':'#5a4632','1':g.seals[i]?'#f1dfb0':'#2a2018'});
 this.hudLayout={rows:1,left:x,right:at+15,width:W,food};c.restore();
};
const TRAVEL_BODY_GLYPHS={chilly:{rows:['..1..','1.1.1','.111.','1.1.1','..1..'],colors:{'1':'#8fb1c4'}},freezing:{rows:['..1..','1.1.1','.121.','1.1.1','..1..'],colors:{'1':'#b9e4fb','2':'#ffffff'}},overheated:{rows:['1.1.1','.222.','12221','.222.','1.1.1'],colors:{'1':'#c97a2c','2':'#f2b950'}}};
const travelHud=Renderer.prototype.hud;
Renderer.prototype.hud=function(){travelHud.call(this);const g=this.g;if(g.dungeon?.active){const c=this.c,x=(this.safe.l||0)+5,y=this.top+5,max=Math.max(70,Math.min(144,this.W-(this.safe.l||0)-(this.safe.r||0)-80));if(!g.dialogue){c.save();box(c,x-2,y-2,max+5,26,'#1b1715');box(c,x-2,y-2,1,26,'#b79c66');c.font='6px PixelUI, monospace';travelText(c,'Niveau 1 · Lieu inconnu',x+2,y);travelText(c,travelFit(c,FirstDungeon.current(g).nom,max-4),x+2,y+8,'#b8baa1');travelText(c,'Fioles '+(g.player.flasks||0),x+2,y+16,'#b8baa1');c.restore();}return;}if(!g.location?.current||g.dialogue||g.journey)return;const c=this.c,L=g.location.current,x=(this.safe.l||0)+5,y=this.top+5,max=Math.max(70,Math.min(144,this.W-(this.safe.l||0)-(this.safe.r||0)-80));
 c.save();c.globalAlpha=.88;box(c,x-2,y-2,max+5,18,'#1b1715');c.globalAlpha=1;box(c,x-2,y-2,1,18,'#b79c66');c.font='6px PixelUI, monospace';const temperature=Math.round(g.sky().temperature),label=temperature+'°C',tw=c.measureText(label).width,body=g.bodyHeat?.().state,glyph=TRAVEL_BODY_GLYPHS[body],gw=glyph?7:0;travelText(c,travelFit(c,L.title,max-tw-gw-10),x+2,y,'#e9d8b6');
 // The air temperature, coloured by what Kaldor feels in his outfit; a snowflake when he is cold, a sun when too warm.
 const bite=body==='freezing'&&g.time-(g.bodyHeatHit??-Infinity)<.4;if(glyph)pixels(c,glyph.rows,x+max-tw-gw,y,bite?{'1':'#ffffff','2':'#ffffff'}:glyph.colors);travelText(c,label,x+max-tw,y,body==='freezing'?'#9fd2ee':body==='chilly'?'#b7d0d4':body==='overheated'?'#e7a35a':temperature<=0?'#b7d0d4':'#c5bea7');this.temperatureReadout={temperature,label,width:tw,body};travelText(c,travelFit(c,L.detail||'Terres Sauvages',max-52),x+2,y+8,'#b8baa1');c.restore();this.navigationMarker();
};
// A native-pixel cloth pennant: bronze staff, sage cloth, cream stitching.
function drawTravelPin(c,x,y){pixels(c,['.11........','.14333331..','.142222231.','.14222231..','.1433331...','.14........','.14........','.14........','.14........','11111......'],Math.round(x),Math.round(y),{'1':'#24180f','2':'#8eaa76','3':'#d4d7a6','4':'#ba8a4a'});}
Renderer.prototype.navigationMarker=function(){const info=this.g.navigationInfo();if(!info)return;const c=this.c,x=(this.safe.l||0)+5,y=this.top+26,w=Math.min(144,this.W-84-(this.safe.l||0)-(this.safe.r||0)),name=info.site.name;
 c.save();c.font='6px PixelUI, monospace';box(c,x-2,y-2,w+5,12,'#211a13');box(c,x-2,y-2,1,12,'#92703f');drawTravelPin(c,x,y-1);travelText(c,info.label+' · '+travelFit(c,name,w-14-c.measureText(info.label+' · ').width),x+14,y,'#d4d7a6');
 const sx=info.target.x-this.cam.x,sy=info.target.y-this.cam.y+this.top-24,centre={x:this.W/2,y:(this.H+this.top)/2},dx=sx-centre.x,dy=sy-centre.y,top=this.top+50,bottom=this.H-28;
 let mx=sx,my=sy;const offscreen=mx<12||mx>this.W-12||my<top||my>bottom;
 if(offscreen){const k=Math.min((this.W/2-12)/Math.max(.0001,Math.abs(dx)),(dy<0?centre.y-top:bottom-centre.y)/Math.max(.0001,Math.abs(dy)));mx=centre.x+dx*k;my=centre.y+dy*k;}
 mx=Math.round(mx);my=Math.round(my);drawTravelPin(c,mx-4,my-6);
 if(offscreen){const a=Math.round(Math.atan2(dy,dx)/(Math.PI/4))*Math.PI/4;for(const d of [9,12])box(c,mx+Math.round(Math.cos(a)*d),my+Math.round(Math.sin(a)*d),1,1,'#d4d7a6');}
 this.navigationReadout={metres:info.metres,label:info.label};c.restore();
};
