/* Cached native pixel slabs sorted with actor feet, not the roof's screen Y.
 * Browser canvases are built once per visible model; no PNG is fetched. */
(function(r,f){if(typeof module==='object'&&module.exports)module.exports=f(require('../sprites/architecture/architecture-game.js'));else r.HearthreaverArchitectureRender=f(r.HearthreaverArchitectureGame);})(globalThis,function(A){
'use strict';
const frames=new Map(),STEP=8,MAX=96,BASE_HEIGHT=8,FADE_ALPHA=.32;let factory=null;
const projectPoint=(x,y)=>typeof WorldProjection!=='undefined'?WorldProjection.point(x,y):require('./world-projection.js').point(x,y);
function frame(o,snow){
 const id=snow&&A.catalogue[o.id+'-hiver']?o.id+'-hiver':o.id,dir=o.dir||A.entry(id).views[0],key=[id,dir,!!snow,(o.open===undefined&&/^F(07|08|09|10|11)$/.test(id))||o.open===1,o.weather!==false].join('/');
 if(frames.has(key)){const old=frames.get(key);frames.delete(key);frames.set(key,old);return old;}
 const p=A.pixels(id,{dir,open:o.open,weather:o.weather}),data=new Uint8ClampedArray(p.data),groups=new Map(),upper=new Uint8Array(p.indices.length),depths=new Float32Array(p.indices.length);
 if(snow&&!id.endsWith('-hiver'))for(let x=0;x<p.width;x++){
  let y=0;while(y<p.height&&p.layers[y*p.width+x]!==2)y++;if(y>=p.height)continue;
  for(let dy=0;dy<2&&y+dy<p.height;dy++)if(p.layers[(y+dy)*p.width+x]===2)data.set(dy?[190,209,215,255]:[222,233,230,255],((y+dy)*p.width+x)*4);
 }
 for(let i=0;i<p.indices.length;i++)if(p.indices[i]){
  const y=Math.floor(i/p.width),x=i%p.width,depth=p.groundDepth[i]-p.origin[1],bin=Math.floor(depth/STEP),height=depth-(y-p.anchor[1]),high=height>BASE_HEIGHT+STEP/2;upper[i]=high?1:0;depths[i]=bin*STEP+STEP/2;const groupKey=bin+':'+high;let g=groups.get(groupKey);
  if(!g){g={bin,upper:high,x0:x,y0:y,x1:x,y1:y,pixels:[]};groups.set(groupKey,g);}
  g.x0=Math.min(g.x0,x);g.x1=Math.max(g.x1,x);g.y0=Math.min(g.y0,y);g.y1=Math.max(g.y1,y);g.pixels.push(i);
 }
 const chunks=[];let pixelArea=0;
 for(const g of groups.values()){
  const cv=factory?factory(1,1):document.createElement('canvas');cv.width=g.x1-g.x0+1;cv.height=g.y1-g.y0+1;const c=cv.getContext('2d'),im=c.createImageData(cv.width,cv.height);
  for(const i of g.pixels){const x=i%p.width-g.x0,y=Math.floor(i/p.width)-g.y0;im.data.set(data.subarray(i*4,i*4+4),(y*cv.width+x)*4);}c.putImageData(im,0,0);
  chunks.push({cv,x:g.x0-p.anchor[0],y:g.y0-p.anchor[1],depth:g.bin*STEP+STEP/2,upper:g.upper});pixelArea+=cv.width*cv.height;
 }
 const result={chunks,pixelArea,id,dir,width:p.width,height:p.height,anchor:p.anchor.slice(),upper,depths};frames.set(key,result);if(frames.size>MAX)frames.delete(frames.keys().next().value);return result;
}
// Only opaque upper pixels which will actually draw AFTER the hero can hide it.
// Upper pixels trigger the fade; the entire building follows the opening deck effect.
// The player's collision radius/position and all ground geometry remain untouched.
function obscures(f,o,player){
 if(!player||!Number.isFinite(player.x+player.y)||player.level||player.elevation>0)return false;
 const lift=Math.max(0,Number(player.z)||0),cx=player.x-o.x+f.anchor[0],feet=player.y-lift-o.y+f.anchor[1];
 if(cx+7<0||cx-7>=f.width||feet<0||feet-30>=f.height)return false;
 let covered=0;
 for(let y=Math.max(0,Math.floor(feet-30));y<=Math.min(f.height-1,Math.ceil(feet-1));y++){
  const above=feet-y,half=above>23?4:above<6?4:7;
  for(let x=Math.max(0,Math.floor(cx-half));x<=Math.min(f.width-1,Math.ceil(cx+half));x++){
   const i=y*f.width+x;if(f.upper[i]&&o.y+f.depths[i]>player.y+.01&&++covered>=3)return true;
  }
 }return false;
}
function opacity(renderer,o,f){
 let player=renderer.g?.player;if(renderer.projectionActive&&renderer.logicalGame){const p=renderer.logicalGame.player;player={...p,...projectPoint(p.x,p.y)};}if(!player)return 1;
 const hidden=obscures(f,o,player),target=hidden?FADE_ALPHA:1,time=Number(renderer.g.time)||0,key=o.uid||[o.id,o.dir,o.x,o.y].join('/');
 const states=renderer.architectureOcclusion||(renderer.architectureOcclusion=new Map());let state=states.get(key);
 if(!state){state={alpha:target,time};states.set(key,state);if(states.size>256)states.delete(states.keys().next().value);}
 const dt=Math.max(0,Math.min(.1,time-state.time));state.time=time;state.hidden=hidden;
 // Same target and easing as Renderer.frame() for the starting skeleton deck.
 state.alpha+=(target-state.alpha)*(1-Math.pow(.004,dt));
 return state.alpha;
}
function objects(renderer,o,snow=false){
 if(renderer.projectionActive){const p=projectPoint(o.x,o.y);o={...o,x:p.x,y:p.y};}
 const f=frame(o,snow),alpha=opacity(renderer,o,f);
 return f.chunks.map(chunk=>({always:true,level:0,y:o.y+chunk.depth,bounds:{x:o.x+chunk.x,y:o.y+chunk.y,w:chunk.cv.width,h:chunk.cv.height},architecture:o.uid,architectureUpper:chunk.upper,architectureAlpha:alpha,fn:()=>{
  const c=renderer.c;c.save();c.imageSmoothingEnabled=false;c.globalAlpha*=alpha;c.drawImage(chunk.cv,Math.round(o.x+chunk.x),Math.round(o.y+chunk.y));c.restore();
 }}));
}
function diagnostics(){return {models:frames.size,pixelArea:[...frames.values()].reduce((s,v)=>s+v.pixelArea,0),maxModels:MAX};}
return Object.freeze({objects,frame,obscures,diagnostics,setCanvasFactory(f){factory=f;frames.clear();},clear(){frames.clear();}});
});
