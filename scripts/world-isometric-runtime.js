/* One display projection for terrain, actors, mechanisms, effects and buildings.
 * Game state and save coordinates remain logical. Installed after other renderers. */
(()=>{
'use strict';
const P=WorldProjection,T=HearthreaverIsometricTerrain;
// Biomes redessinés (sources Piskel) : sol, chemins, places et flore, par famille de terrain.
const ENV_DATA=Object.entries({forest:typeof HearthreaverTeremor==='object'?HearthreaverTeremor:null,desert:typeof HearthreaverSarak==='object'?HearthreaverSarak:null,marsh:typeof HearthreaverVaran==='object'?HearthreaverVaran:null}).filter(([,d])=>d);
const ENV=typeof createEnvironmentArt==='function'&&ENV_DATA.length?Object.fromEntries(ENV_DATA.map(([k,d])=>[k,createEnvironmentArt(d)])):null;
const update=Game.prototype.update,direction=Game.prototype.direction;
Game.prototype.update=function(dt,controls={}){const aim=P.input(controls.x||0,controls.y||0);return update.call(this,dt,{...controls,...aim});};
Game.prototype.direction=function(x,y){const q=P.point(x,y);return direction.call(this,q.x,q.y);};
Game.prototype.facing=function(dir){const a=[[0,-1],[1,0],[0,1],[-1,0]][dir]||[0,1],p=P.inverse(...a),l=Math.hypot(p.x,p.y);return [p.x/l,p.y/l];};
const hit=bladeHits;bladeHits=function(a,b,f){return hit({...a,...P.point(a.x,a.y)},{...b,...P.point(b.x,b.y)},f);};
function logical(renderer,fn){const g=renderer.g,cam=renderer.cam,W=renderer.W,H=renderer.H,view=P.rect({x:cam.x-96,y:cam.y-96,w:W+192,h:H+256});renderer.g=renderer.logicalGame||g;renderer.cam={x:view.x,y:view.y};renderer.W=view.w;renderer.H=view.h;try{return fn();}finally{renderer.g=g;renderer.cam=cam;renderer.W=W;renderer.H=H;}}
function config(g){return {core:g.world.tiles.map(row=>Array.from(row)),trails:g.world.trails,lanes:[...g.settlements.sites.values()].flatMap(s=>{const n=Atlas.byId[s.id],p=Atlas.toGame(n.x,n.y);return s.lanes.map(l=>({...l,x:p.x+l.x,y:p.y+l.y,paved:l.paved??!!n.regionalCentre}));})};}
function workerSource(cfg){
 const pacing='{'+Object.entries(WorldPacing).map(([key,value])=>typeof value==='function'?value.toString():JSON.stringify(key)+':'+JSON.stringify(value)).join(',')+'}';
 return '"use strict";const WorldPacing='+pacing+';const createWorldAtlas='+createWorldAtlas.toString()+';const T=('+T.create.toString()+')('+JSON.stringify(HearthreaverTerrainPalettes)+');const makeArt='+createProjectedWorldArt.toString()+';const ENV='+(ENV?'{'+ENV_DATA.map(([k,d])=>JSON.stringify(k)+':('+createEnvironmentArt.toString()+')('+JSON.stringify(d)+')').join(',')+'}':'null')+';const cfg='+JSON.stringify(cfg)+';let art;onmessage=e=>{const m=e.data;if(m.kind==="init"){art=makeArt(createWorldAtlas(m.raw),T,cfg,ENV);postMessage({kind:"ready"});return;}if(!art)return;const im=art.render(m.cx*512,m.cy*512,512,512,m.clock);postMessage({...m,...im},[im.data.buffer,...im.features.map(f=>f.data.buffer)]);};';
}
const props=Renderer.prototype.visibleAtlasProps,architecture=Renderer.prototype.architectureDrawObjects,map=Renderer.prototype.map;
Renderer.prototype.visibleAtlasProps=function(){if(!this.projectionActive)return props.call(this);return logical(this,()=>props.call(this)).map(o=>this.projectionView.wrap(o));};
Renderer.prototype.architectureDrawObjects=function(){if(!this.projectionActive)return architecture.call(this);const cam=this.cam,W=this.W,H=this.H;return [...logical(this,()=>architecture.call(this)),...(this.projectedCliffs||[])].filter(o=>!o.bounds||o.bounds.x+o.bounds.w>=cam.x-8&&o.bounds.x<=cam.x+W+8&&o.bounds.y+o.bounds.h>=cam.y-8&&o.bounds.y<=cam.y+H+8);};
Renderer.prototype.map=function(){const g=this.g;this.g=this.logicalGame||g;try{return map.call(this);}finally{this.g=g;}};
Renderer.prototype.drawAtlasGround=function(){
 const g=this.logicalGame||this.g,clock=Math.floor(g.clock);g.atlas.setClock(clock);logical(this,()=>this.refreshColdSiteProps?.(clock));
 if(this.isometricTerrainGame!==g){this.atlasArtStream?.worker?.terminate();this.atlasGround=new Map();const cfg=config(g);this.projectedTerrain=createProjectedWorldArt(Atlas,T,cfg,ENV);this.atlasArtStream=new WorldArtStream(this.atlasGround,()=>document.createElement('canvas'),globalThis,this.projectedTerrain,()=>workerSource(cfg));this.isometricTerrainGame=g;this.flatTerrainTiles=new Map();}
 const view=P.rect({x:this.cam.x-48,y:this.cam.y-48,w:this.W+96,h:this.H+160}),a=Atlas.toWorld(view.x,view.y),b=Atlas.toWorld(view.x+view.w,view.y+view.h),centre=Atlas.toWorld(g.player.x,g.player.y),visible=[];
 for(let cy=Math.floor(a.y/32);cy<=Math.floor(b.y/32);cy++)for(let cx=Math.floor(a.x/32);cx<=Math.floor(b.x/32);cx++)visible.push([cx,cy]);
 visible.sort((a,b)=>a[0]+a[1]-b[0]-b[1]);this.atlasArtStream.focus(Math.floor(centre.x/32),Math.floor(centre.y/32),visible);this.atlasArtStream.setClock(clock);this.atlasVisible=[];this.projectedCliffs=[];
 for(const [cx,cy]of visible){
  const chunk=g.atlas.get(cx,cy),logicalOrigin=Atlas.toGame(cx*32,cy*32),p=P.point(logicalOrigin.x,logicalOrigin.y);this.atlasVisible.push(chunk);let cv=this.atlasGround.get(chunk.key);
  if(!cv){
   cv=document.createElement('canvas');cv.width=1024;cv.height=544;cv.preview=true;const c=cv.getContext('2d'),cell=Atlas.cellAt(cx*32+16,cy*32+16),family=Atlas.visualSnowCover(cell?.biome,cell?.height,clock,cell?.region)>.5?'snow':WorldTerrainArt.family({biome:cell?.biome,cursed:Atlas.curseCells.has(cell?.id)});
   // The immediate placeholder is cheap; final pixels are painted in the worker
   // or in <=4ms cooperative slices. Collision data is available immediately.
   for(let y=0;y<32;y++)for(let x=0;x<32;x++){
    const gx=logicalOrigin.x+x*16,gy=logicalOrigin.y+y*16,inCore=atlasCore(gx/16,gy/16),type=inCore?(g.world.tiles[Math.floor(gy/16)]?.[Math.floor(gx/16)]??8):chunk.tiles[y*32+x],kind=type===3?'water':type===5?'wood':type===1?'bare':type===2||type===7?'paving':type===6||type===8?'gravel':'ground',key=(inCore?'desert':family)+'/'+kind;
    let tile=this.flatTerrainTiles.get(key);if(!tile){const im=T.raster({family:inCore?'desert':family,kind,mask:0,height:0,dir:0}),canvas=document.createElement('canvas');canvas.width=im.width;canvas.height=im.height;const ctx=canvas.getContext('2d'),pixels=ctx.createImageData(im.width,im.height);pixels.data.set(im.data);ctx.putImageData(pixels,0,0);tile={canvas,anchor:im.anchor};this.flatTerrainTiles.set(key,tile);}
    c.drawImage(tile.canvas,(x-y)*16+512-tile.anchor[0],(x+y)*8+32-tile.anchor[1]);
   }
  }
  this.atlasGround.delete(chunk.key);this.atlasGround.set(chunk.key,cv);this.atlasArtStream.request(cx,cy);this.c.drawImage(cv,Math.round(p.x-512),Math.round(p.y-32));
  for(const f of cv.features||[]){const x=Math.round(p.x+f.x),y=Math.round(p.y+f.y);if(x+f.canvas.width<this.cam.x-8||x>this.cam.x+this.W+8||y+f.canvas.height<this.cam.y-8||y>this.cam.y+this.H+40)continue;this.projectedCliffs.push({always:true,y:p.y+f.depth,fn:()=>this.c.drawImage(f.canvas,x,y)});}
 }
 while(this.atlasGround.size>16)this.atlasGround.delete(this.atlasGround.keys().next().value);
 this.atlasArtStream.prefetch(Math.floor(centre.x/32),Math.floor(centre.y/32));
};
// Flore des biomes redessinés : mêmes emplacements et mêmes objets du monde,
// sprites Piskel ancrés au pied, ombre portée à l'opacité de son calque.
// Le désert couvre aussi la zone de départ (décors de la carte locale).
const FLORA_PROPS={
 forest:{world_oak_0:['chene_a','chene_b','bouleau_a'],world_oak_1:['chene_b','chene_c','buisson_a'],world_oak_2:['chene_c','chene_a','bouleau_b'],world_boulder_2:['rocher_a','rocher_b'],world_fern:['fougere','buisson_b'],world_mushrooms:['champignons'],world_flowers:['fleurs']},
 desert:{rock_a:['rocher_a'],world_boulder_0:['rocher_a','rocher_rond'],rock_b:['rocher_b'],rock_c:['cheminee'],rock_d:['rocher_rond'],rock_e:['eboulis'],deadtree:['arbre_mort_a','arbre_mort_b'],shrub:['buisson_a','buisson_b'],palm:['palmier_a','palmier_b'],scrub:['touffe_a','touffe_b'],pebbles:['cailloux']},
 marsh:{world_cypress:['cypres_a','cypres_b','saule_a','cypres_a','saule_b','chicot'],world_boulder_2:['rocher_a','rocher_b','souche'],world_reeds:['roseaux_a','roseaux_b','massettes'],world_fern:['fougere'],world_mushrooms:['champignons','souche']}
};
let floraSprites=null;
function floraSprite(family,name){
 if(!floraSprites){floraSprites=new Map();for(const [k,E]of Object.entries(ENV)){const paint=(px,w,h)=>{const cv=document.createElement('canvas');cv.width=w;cv.height=h;const x=cv.getContext('2d'),im=x.createImageData(w,h);for(let i=0;i<px.length;i++)if(px[i])im.data.set(E.rgb[px[i]],i*4);x.putImageData(im,0,0);return cv;};
  for(const v of Object.values(E.flora))for(const f of v.frames)floraSprites.set(k+'/'+f.name,{img:paint(f.px,f.w,f.h),shadow:paint(f.sh,f.w,f.h),alpha:v.shadow,ax:f.ax,ay:f.ay});}}
 return floraSprites.get(family+'/'+name);
}
function floraOf(o){
 if(!ENV||!Object.values(FLORA_PROPS).some(f=>f[o.kind]))return null;const L=o._logical||o;
 if(L._flora===undefined){let family=null;
  if(o.world){const w=Atlas.toWorld(L.x,L.y),cell=Atlas.cellAt(w.x,w.y);if(cell&&!Atlas.curseCells.has(cell.id))family=cell.biome===6?'forest':[1,2].includes(cell.biome)?'desert':cell.biome===12?'marsh':null;}
  else if(atlasCore(L.x/16,L.y/16))family='desert';
  const kinds=family&&ENV[family]&&FLORA_PROPS[family][o.kind],r=Math.abs(Math.sin(L.x*12.9898+L.y*78.233)*43758.5453)%1;
  L._flora=kinds?[family,kinds[Math.floor(r*kinds.length)]]:null;}
 return L._flora&&floraSprite(...L._flora);
}
const prop=Renderer.prototype.prop;
Renderer.prototype.prop=function(o){
 const s=this.projectionActive&&!o.broken&&floraOf(o);if(!s)return prop.call(this,o);
 const c=this.c,dx=o.shake>0?Math.round(Math.sin(o.shake*70)*o.shake*9):0,x=Math.round(o.x)+dx,y=Math.round(o.y);
 c.save();c.globalAlpha*=s.alpha;c.drawImage(s.shadow,x-s.ax,y-s.ay);c.restore();c.drawImage(s.img,x-s.ax,y-s.ay);
};
Renderer.prototype.platformUnder=function(){const g=this.logicalGame,p=g.player,d=g.deck;return !p.level&&!p.onStairs&&p.x>d.x-12&&p.x<d.x+d.w+12&&p.y>d.y&&p.y<d.y+d.h+25;};
Renderer.prototype.projectedStairsDepth=function(){const s=this.logicalGame.stairs;return P.point(s.x,s.bottom).y;};
function slab(renderer,x,y,w,h,z=12){for(let v=0;v<h;v+=16)for(let u=0;u<w;u+=16){const p=P.point(x+u,y+v);T.draw(renderer.c,{family:'desert',kind:'wood',mask:6,height:z,dir:0},Math.round(p.x),Math.round(p.y),{x:x+u,y:y+v});}}
Renderer.prototype.drawDeck=function(){const d=this.logicalGame.deck;slab(this,d.x,d.y,d.w,d.h,12);};
Renderer.prototype.drawStairs=function(part){if(part!=='low')return;const s=this.logicalGame.stairs;for(let i=0;i<6;i++)slab(this,s.x-8,s.bottom-6*(i+1),16,6,2*(i+1));};
function fence(renderer,a,b,z=0,height=30){const p=P.point(...a,z),q=P.point(...b,z),n=Math.max(1,Math.ceil(Math.abs(q.x-p.x)));for(let i=0;i<=n;i++){const t=i/n,x=Math.round(p.x+(q.x-p.x)*t),y=Math.round(p.y+(q.y-p.y)*t);renderer.c.fillStyle=RAMP.wood[i%5===0?1:i%5===1?5:3];renderer.c.fillRect(x,y-height,1,height);}}
Renderer.prototype.drawTempleGate=function(){const g=this.logicalGame;if(!g.gate)fence(this,[367,211],[425,211],0,27);};
Renderer.prototype.drawMechanisms=function(){
 const g=this.logicalGame,c=this.c;
 for(const l of g.lifts){const rise=12*(l.bottom-l.y)/(l.bottom-l.top);slab(this,l.x-16,l.y-16,32,32,rise+2);}
 for(const d of g.doors){const progress=d.progress*d.progress*(3-2*d.progress),half=d.w/2;for(const side of [-1,1]){const hinge=side<0?d.x:d.x+d.w,angle=progress*Math.PI/2,a=[hinge,d.y+d.h],b=[hinge-side*half*Math.cos(angle),d.y+d.h+half*Math.sin(angle)];fence(this,a,b,0,32);}}
 for(const l of g.levers){const p=P.point(l.x,l.y),x=Math.round(p.x),y=Math.round(p.y);c.fillStyle=RAMP.rock[2];c.fillRect(x-6,y-5,12,7);c.fillStyle=RAMP.iron[3];c.fillRect(x-1,y-13,2,11);c.fillStyle=l.progress>.5?'#83a573':'#b05435';c.fillRect(x-3+(l.progress>.5?4:0),y-15,5,4);}
};
const frame=Renderer.prototype.frame;
Renderer.prototype.frame=function(){
 const g=this.g;if(this.projectionActive)return frame.call(this);
 if(this.projectionViewGame!==g){this.projectionViewGame=g;this.projectionView=P.display(g);this.focus=null;this.cameraPosition=null;this.projectedSeals=this.projectionView.wrap(SEALS);}
 this.logicalGame=g;this.projectionActive=true;this.g=this.projectionView.game;
 try{return frame.call(this);}finally{this.g=g;this.projectionActive=false;}
};
})();
