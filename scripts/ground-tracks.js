/* Visual tracks are separate from Game.footprints (Elyne's navigation trail). */
function terrainTrackColors(data,width,height){const w=Math.ceil(width/4),h=Math.ceil(height/4),rgb=new Uint8Array(w*h*3);for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=(Math.min(height-1,y*4+2)*width+Math.min(width-1,x*4+2))*4,j=(y*w+x)*3;rgb[j]=data[i];rgb[j+1]=data[i+1];rgb[j+2]=data[i+2];}return {rgb,w,h};}
function trackBody(n,game){return !n.dead&&!n.down&&!n.spirit&&!n.flying&&!n.held&&!n.dash&&!n.elevation&&!n.onStairs&&!n.level&&n.id!=='fairy'&&!['snake','serpent','boss'].includes(n.kind)&&!(n===game.player&&(game.mounted||game.dead||game.dying||game.sleeping));}
function trackSurface(game,n){
 const material=footSurface(game,n);if(material==='snow')return {material,life:20,alpha:.62};
 if(!['sand','earth','grass','gravel','mud'].includes(material)||game.tentAt?.(n.x,n.y,1))return null;
 const w=Atlas.toWorld(n.x,n.y);if(worldClimateAt(game.clock,w.x,w.y).rain<=.04)return null;
 return {material,life:8,alpha:material==='grass'?.30:material==='gravel'?.36:.48};
}
function trackColor(renderer,x,y,material){
 const w=Atlas.toWorld(x,y),cx=Math.floor(w.x/32),cy=Math.floor(w.y/32),colors=renderer.atlasGround?.get(cx+','+cy)?.trackColors;let rgb;
 if(colors&&!atlasCore(x/16,y/16)){const px=w.x*16-cx*512,py=w.y*16-cy*512,p=renderer.projectedTerrain?WorldProjection.point(px,py):{x:px,y:py},ix=clamp(Math.floor((p.x+(renderer.projectedTerrain?512:0))/4),0,colors.w-1),iy=clamp(Math.floor((p.y+(renderer.projectedTerrain?32:0))/4),0,colors.h-1),j=(iy*colors.w+ix)*3;rgb=[colors.rgb[j],colors.rgb[j+1],colors.rgb[j+2]];}
 else {const palettes=WorldTerrainArt.colors,palette=palettes[material==='earth'?'humus':material==='gravel'?'stone':material]||palettes.sand;rgb=[1,3,5].map(i=>parseInt(palette[4].slice(i,i+2),16));}
 // Same hue as the underlying ground; only value changes, no black decal.
 return 'rgb('+rgb.map(v=>Math.round(v*.48)).join(',')+')';
}
class GroundTracks{
 constructor(game){this.game=game;this.actors=new WeakMap();this.marks=[];this.time=game.time;}
 step(renderer){const g=this.game,dt=g.time-this.time;this.time=g.time;const cam=renderer.cam,W=renderer.W,H=renderer.H;
  this.marks=this.marks.filter(m=>g.time>=m.born&&g.time-m.born<m.life&&m.x>cam.x-96&&m.x<cam.x+W+96&&m.y>cam.y-96&&m.y<cam.y+H+96);
  if(g.journey||dt<0||dt>.2){this.actors=new WeakMap();return;}if(dt===0)return;
  const actors=[g.player,...g.npcs.filter(n=>(n.alpha??1)>.1&&(n.civilian?!n.civilian.dead:g.npcPresent(n))),...g.enemies].filter(n=>trackBody(n,g)&&n.x>cam.x-12&&n.x<cam.x+W+12&&n.y>cam.y-12&&n.y<cam.y+H+20).sort((a,b)=>Math.hypot(a.x-g.player.x,a.y-g.player.y)-Math.hypot(b.x-g.player.x,b.y-g.player.y)).slice(0,16);
  let added=0;for(const n of actors){const old=this.actors.get(n),now={x:n.x,y:n.y,anim:n.anim||0,at:g.time,foot:old?.foot||0};this.actors.set(n,now);if(!old||g.time-old.at>.15)continue;
   const dx=n.x-old.x,dy=n.y-old.y,moved=Math.hypot(dx,dy);if(moved<.01||moved>Math.max(8,dt*350)||now.anim<=old.anim||Math.floor(now.anim/3)===Math.floor(old.anim/3))continue;
   now.foot++;if(added>=4)continue;const angle=Math.round(Math.atan2(dy,dx)/(Math.PI/4))*Math.PI/4,ux=Math.cos(angle),uy=Math.sin(angle),side=now.foot%2?1:-1,x=Math.round(n.x-uy*side*2),y=Math.round(n.y+ux*side*2),position={x,y,level:n.level||0};
   const surface=trackSurface(g,position);if(!surface)continue;this.marks.push({...surface,x,y,ux,uy,side,born:g.time,color:trackColor(renderer,x,y,surface.material),check:Math.floor(g.clock)});added++;
  }
  if(this.marks.length>160)this.marks.splice(0,this.marks.length-160);
 }
 draw(renderer,c){const g=this.game;c.save();for(const m of this.marks){
  if(m.material==='snow'&&m.check!==Math.floor(g.clock)){m.check=Math.floor(g.clock);if(footSurface(g,m)!=='snow')m.life=Math.min(m.life,g.time-m.born+1);}
  const age=(g.time-m.born)/m.life;if(age<0||age>=1)continue;c.fillStyle=m.color;c.globalAlpha=m.alpha*(1-skySmooth(.12,1,age));
  for(const [across,along]of [[0,-1],[0,0],[0,1],[1,1]]){const x=m.x+m.ux*along-m.uy*across*m.side,y=m.y+m.uy*along+m.ux*across*m.side,p=renderer.projectionActive?WorldProjection.point(x,y):{x,y};c.fillRect(Math.round(p.x),Math.round(p.y),1,1);}
 }c.restore();}
}
const tracksRainGround=renderRainGround;
renderRainGround=function(renderer,c,W,H){const game=renderer.logicalGame||renderer.g;let tracks=renderer.groundTracks;if(!tracks||tracks.game!==game)tracks=renderer.groundTracks=new GroundTracks(game);
 if(renderer.projectionActive){const cam=renderer.cam,w=renderer.W,h=renderer.H,view=WorldProjection.rect({x:cam.x,y:cam.y,w,h});renderer.cam={x:view.x,y:view.y};renderer.W=view.w;renderer.H=view.h;try{tracks.step(renderer);}finally{renderer.cam=cam;renderer.W=w;renderer.H=h;}}else tracks.step(renderer);
 tracks.draw(renderer,c);tracksRainGround(renderer,c,W,H);};
