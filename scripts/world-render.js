/* All new game artwork uses the game's native pixel buffer and shared ramps. */
PROPS.world_sign=function(b){const W=RAMP.wood;b.shadow(34,57,10,3);blockTier(b,30,33,34,2,21,W);blockTier(b,21,45,29,5,3,W);blockTier(b,18,41,39,5,3,W);for(let x=23;x<43;x+=4){b.set(x,32,W[2]);b.set(x-2,42,W[2]);}b.set(32,31,'#dac8a1');b.set(32,41,'#dac8a1');b.line(42,29,47,32,W[4]);b.line(47,32,43,35,W[2]);};
PROPS.world_cart=function(b){const W=RAMP.wood,I=RAMP.iron;b.shadow(34,57,21,4);blockTier(b,16,45,38,9,5,W);for(let y=31;y<46;y+=4){blockTier(b,16,45,y,2,1,W);b.set(18,y,I[3]);b.set(43,y,I[3]);}for(const x of [20,42]){for(let y=-6;y<=6;y++)for(let dx=-5;dx<=5;dx++){const d=dx*dx/25+y*y/36;if(d<=1&&d>.5)b.set(x+dx,51+y,d>.8?I[1]:W[4]);}b.line(x-4,51,x+4,51,W[2]);b.line(x,46,x,56,W[2]);b.set(x,51,I[4]);}b.line(43,40,57,48,W[1]);b.line(43,39,57,47,W[4]);blockTier(b,24,35,30,4,6,RAMP.rock);};
PROPS.world_cursed=function(b){const P=['#24232f','#383744','#51515d','#686975','#858995','#b5b6b9','#d2cdd1'];b.shadow(35,57,13,4);rockTier(b,31,55,9,4,12,523,P);rockTier(b,32,43,6,2,16,524,P);b.line(31,31,29,38,'#7160a1');b.line(29,38,33,43,'#a88bca');b.line(33,43,30,50,'#8cd6a3');for(const [x,y]of [[25,37],[37,48],[29,53]]){b.set(x,y,'#ae9eda');b.set(x+1,y+1,'#658b7a');}};
const atlasNpcDraw=Renderer.prototype.npcDraw;
Renderer.prototype.npcDraw=function(n){if(n.id!=='fairy'){atlasNpcDraw.call(this,n);if(n.id==='elyne'&&this.g.story.recruited&&!this.g.story.delivered&&this.g.companion.hp<10){box(this.c,n.x-10,n.y-45,20,2,'#34252c');box(this.c,n.x-10,n.y-45,2*this.g.companion.hp,2,'#be807b');}return;}const c=this.c,x=Math.round(n.x),y=Math.round(n.y-12+Math.sin(this.g.time*4)*2),wing=Math.sin(this.g.time*18)>0;c.save();c.globalAlpha=.8;pixels(c,wing?['11.....11','122...221','.122.221.','..12221..']:['.........','..1...1..','.122.221.','112222211'],x-4,y-5,{'1':'#b4c5c9','2':'#dee8d0'});c.globalAlpha=1;pixels(c,['..11..','.1221.','..33..','..44..','.4554.','..44..','..66..'],x-3,y-6,{'1':'#745b8d','2':'#f3dfb4','3':'#f5edce','4':'#799b95','5':'#d3e4bb','6':'#aaa5c4'});for(let i=0;i<3;i++){const t=this.g.time+i*2;box(c,x-8-Math.sin(t)*6,y+5+i*3,1,1,i%2?'#b2d1a1':'#b6a1ca');}c.restore();};
const WorldTerrainArt=createWorldTerrainArt(Atlas,RAMP);
Renderer.prototype.drawAtlasGround=function(){const g=this.g;if(!g.atlas)return;this.atlasGround=this.atlasGround||new Map();this.atlasArtStream=this.atlasArtStream||new WorldArtStream(this.atlasGround,()=>document.createElement('canvas'));const groundClock=Math.floor(g.clock);this.atlasGroundClock=groundClock;g.atlas.setClock(groundClock);this.atlasArtStream.setClock(groundClock);this.refreshColdSiteProps?.(groundClock);const a=Atlas.toWorld(this.cam.x-64,this.cam.y-64),b=Atlas.toWorld(this.cam.x+this.W+64,this.cam.y+this.H+64);this.atlasVisible=[];const centre=Atlas.toWorld(g.player.x,g.player.y),visible=[];for(let cy=Math.floor(a.y/32);cy<=Math.floor(b.y/32);cy++)for(let cx=Math.floor(a.x/32);cx<=Math.floor(b.x/32);cx++)visible.push([cx,cy]);this.atlasArtStream.focus(Math.floor(centre.x/32),Math.floor(centre.y/32),visible);
 for(let cy=Math.floor(a.y/32);cy<=Math.floor(b.y/32);cy++)for(let cx=Math.floor(a.x/32);cx<=Math.floor(b.x/32);cx++){
  const chunk=g.atlas.get(cx,cy),p=Atlas.toGame(cx*32,cy*32);this.atlasVisible.push(chunk);let cv=this.atlasGround.get(chunk.key);
  if(!cv){
   // The collision tiles are authoritative immediately. Art refines in the worker
   // (or bounded cooperative slices) without holding up input or simulation.
   cv=document.createElement('canvas');cv.width=cv.height=512;cv.preview=true;const c=cv.getContext('2d');
   for(let y=0;y<32;y++)for(let x=0;x<32;x++){const t=chunk.tiles[y*32+x],wx=cx*32+x,wy=cy*32+y,cell=Atlas.cellAt(wx+.5,wy+.5),family=WorldTerrainArt.family({biome:cell?.biome,cursed:Atlas.curseCells.has(cell?.id)}),profile=WorldTerrainArt.profiles[family],snow=Atlas.visualSnowCover(cell?.biome,cell?.height,groundClock)>.5,palette=t===3?WorldTerrainArt.colors.water:t===5?WorldTerrainArt.colors.wood:t===8?WorldTerrainArt.colors[profile.rock]:WorldTerrainArt.colors[snow?'snow':t===1?'road':t===2?'pave':profile.ground];c.fillStyle=palette[4];c.fillRect(x*16,y*16,16,16);}
  }
  this.atlasGround.delete(chunk.key);this.atlasGround.set(chunk.key,cv);this.atlasArtStream.request(cx,cy);
  this.c.drawImage(cv,Math.round(p.x),Math.round(p.y));
  // Four sparse native-pixel glint phases, only on genuinely open water.
  if(!chunk.glints){chunk.glints=[];for(let y=1;y<31;y++)for(let x=1;x<31;x++){const i=y*32+x,wx=cx*32+x,wy=cy*32+y;if(chunk.tiles[i]!==3||chunk.tiles[i-1]!==3||chunk.tiles[i+1]!==3||chunk.tiles[i-32]!==3||chunk.tiles[i+32]!==3||Atlas.random(wx,wy,475)<.8)continue;chunk.glints.push({x:p.x+x*16+4+Math.floor(Atlas.random(wx,wy,476)*7),y:p.y+y*16+4+Math.floor(Atlas.random(wx,wy,477)*7),phase:Math.floor(Atlas.random(wx,wy,478)*4)});}}
  for(const glint of chunk.glints){if(glint.x<this.cam.x-3||glint.x>this.cam.x+this.W+3||glint.y<this.cam.y-3||glint.y>this.cam.y+this.H+3)continue;const frame=(Math.floor(g.time*3)+glint.phase)%4;if(frame<3){box(this.c,glint.x+frame-1,glint.y,frame===1?3:2,1,RAMP.water[frame===1?6:5]);if(frame===1)box(this.c,glint.x,glint.y-1,1,1,RAMP.water[5]);}}

 }
 while(this.atlasGround.size>32)this.atlasGround.delete(this.atlasGround.keys().next().value);
 this.atlasArtStream=this.atlasArtStream||new WorldArtStream(this.atlasGround,()=>document.createElement('canvas'));this.atlasArtStream.setClock(groundClock);this.atlasArtStream.prefetch?.(Math.floor(centre.x/32),Math.floor(centre.y/32));

};
Renderer.prototype.visibleAtlasProps=function(){const g=this.g;const result=[...g.world.props,...(this.atlasVisible||[]).flatMap(c=>c.props),...g.atlasProps,...g.prisonProps];for(const e of g.worldState.active(g.clock)){const r=Atlas.roadById[e.target];if(!Atlas.EVENT_TYPES[e.type].closed||!r||r.type==='searoutes')continue;const p=Atlas.toGame(e.x,e.y);for(let i=-2;i<=2;i++)result.push({x:p.x+i*13,y:p.y+i%2*6,kind:'rock_b',world:true});}return result;};
const atlasMap=Renderer.prototype.map;
Renderer.prototype.map=function(){const p=this.g.player;if(atlasCore(p.x/16,p.y/16))return atlasMap.call(this);const c=this.m,W=c.canvas.width,H=c.canvas.height,w=Atlas.toWorld(p.x,p.y);c.fillStyle='#292b26';c.fillRect(0,0,W,H);const scale=2,range=W/scale/2;c.save();c.translate(W/2,H/2);c.strokeStyle='#a99b70';c.lineWidth=2;const roads=new Set();for(let y=w.y-range;y<w.y+range;y+=100)for(let x=w.x-range;x<w.x+range;x+=100){const r=Atlas.closestRoad(x,y);if(r)roads.add(r.road);}for(const r of roads){c.beginPath();r.pts.forEach((p,i)=>{const x=(p[0]-w.x)*scale,y=(p[1]-w.y)*scale;i?c.lineTo(x,y):c.moveTo(x,y);});c.stroke();}for(const n of Atlas.nodes)if(this.g.discovered.has(n.id)&&Math.abs(n.x-w.x)<range&&Math.abs(n.y-w.y)<range){box(c,(n.x-w.x)*scale-2,(n.y-w.y)*scale-2,4,4,'#d6bf87');}box(c,-2,-2,5,5,'#f0e6be');c.restore();};
const atlasFrame=Renderer.prototype.frame;
Renderer.prototype.frame=function(){
 const g=this.g,p=g.player;
 if(g.journey){this.arriving=true;const c=this.c;c.save();c.setTransform(1,0,0,1,0,0);c.fillStyle='#1c2725';c.fillRect(0,0,c.canvas.width,c.canvas.height);c.restore();return;}
 if(this.arriving||this.cameraGame!==g||this.cameraPosition&&Math.hypot(p.x-this.cameraPosition.x,p.y-this.cameraPosition.y)>Math.max(this.W,this.H)){
  this.focus=null;this.easeT=0;this.lastT=g.time;this.atlasVisible=[];this.arriving=false;
 }
 this.cameraGame=g;this.cameraPosition={x:p.x,y:p.y};installLocalRaster(this.c);
 return atlasFrame.call(this);
};
// Rasterize large world coordinates after cancellation in double precision.
// Otherwise the canvas backend can round sprites and terrain differently far from origin.
function installLocalRaster(c){
 if(c.localRaster)return;c.localRaster=true;
 for(const name of ['drawImage','fillRect','strokeRect','clearRect']){const original=c[name];c[name]=function(...args){
  const i=name==='drawImage'?(args.length===9?5:1):0,x=args[i],y=args[i+1];
  if(Math.abs(x)<32768&&Math.abs(y)<32768)return original.apply(this,args);
  const m=this.getTransform();this.save();this.setTransform(m.a,m.b,m.c,m.d,m.a*x+m.c*y+m.e,m.b*x+m.d*y+m.f);args[i]=args[i+1]=0;
  try{return original.apply(this,args);}finally{this.restore();}
 };}
}
function biomeAtmosphere(mix){
 const tones={1:[202,130,65,.055],2:[202,130,65,.045],5:[202,143,75,.035],7:[202,143,75,.035],8:[83,140,99,.045],12:[83,140,99,.05],9:[84,137,202,.055],10:[84,137,202,.06],11:[84,137,202,.065]};
 let alpha=0,r=0,g=0,b=0;for(const part of mix){const t=tones[part.biome];if(!t)continue;const a=t[3]*part.weight;alpha+=a;r+=t[0]*a;g+=t[1]*a;b+=t[2]*a;}
 return alpha?`rgba(${Math.round(r/alpha)},${Math.round(g/alpha)},${Math.round(b/alpha)},${alpha})`:null;
}
const atmosphereWeather=Renderer.prototype.weatherFX;
Renderer.prototype.weatherFX=function(c,W,VH){
 const p=Atlas.toWorld(this.g.player.x,this.g.player.y),color=biomeAtmosphere(Atlas.environment(p.x,p.y).mix);
 if(color){c.save();const k=this.k||1;c.setTransform(k,0,0,k,0,0);c.fillStyle=color;c.fillRect(0,this.top,W,VH);c.restore();}
 return atmosphereWeather.call(this,c,W,VH);
};
const atlasMagic=Renderer.prototype.magic;
Renderer.prototype.magic=function(){const result=atlasMagic.call(this),g=this.g;for(const o of (this.atlasVisible||[]).flatMap(c=>c.props)){if(o.kind!=='world_cursed'||Math.abs(o.x-g.player.x)>this.W||Math.abs(o.y-g.player.y)>this.H)continue;const pulse=.7+.15*Math.sin(g.time*2+o.x),col=[153,120,199];result.L.push([o.x,o.y-5,23,col,.25*pulse]);result.G.push([o.x,o.y-19,9,col,.35*pulse],[o.x-2,o.y-8,7,[124,207,153],.3*pulse]);}const f=g.fairyActor,fy=f.y-12+Math.sin(g.time*4)*2,pulse=.88+.12*Math.sin(g.time*3);result.L.push([f.x,fy,28,[173,210,198],.55*pulse]);result.G.push([f.x,fy,13,[190,180,235],.7*pulse],[f.x,fy,5,[228,247,205],.65]);for(const o of g.prisonProps||[])if(o.kind==='torch')result.L.push([o.x,o.y-10,45,[255,171,95],.6]);return result;};
