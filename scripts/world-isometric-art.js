/* Serializable worker/fallback renderer. No DOM, PNG or synchronous full-world pass. */
function createProjectedWorldArt(atlas,T,config={}){
 const core=config.core||[],familyOf=c=>atlas.curseCells.has(c?.id)?'cursed':c?.biome===11?'snow':c?.biome===10?'tundra':c?.biome===9?'taiga':c?.biome===12?'marsh':c?.biome===8?'wetforest':[5,7].includes(c?.biome)?'jungle':c?.biome===6?'forest':[1,2].includes(c?.biome)?'desert':c?.biome===3?'steppe':'grass';
 const laneIndex=new Map();for(const l of config.lanes||[])for(let y=Math.floor(l.y/512);y<=Math.floor((l.y+l.h)/512);y++)for(let x=Math.floor(l.x/512);x<=Math.floor((l.x+l.w)/512);x++){const k=x+','+y;if(!laneIndex.has(k))laneIndex.set(k,[]);laneIndex.get(k).push(l);}
 const trails=[];for(const trail of config.trails||[])for(let i=1;i<trail.pts.length;i++){const a=trail.pts[i-1],b=trail.pts[i];trails.push({a:[(a[0]+atlas.origin.x)*16,(a[1]+atlas.origin.y)*16],b:[(b[0]+atlas.origin.x)*16,(b[1]+atlas.origin.y)*16],width:trail.w*8});}
 const code=(wx,wy)=>{const x=Math.floor(wx+.5-atlas.origin.x),y=Math.floor(wy+.5-atlas.origin.y);return x>=0&&y>=0&&y<core.length&&x<(core[0]?.length||0)?core[y][x]:atlas.terrain(wx,wy);};
 function metadata(wx,wy,clock){
  const gx=(wx-atlas.origin.x)*16,gy=(wy-atlas.origin.y)*16,local=wx+.5>=atlas.origin.x&&wy+.5>=atlas.origin.y&&wy+.5<atlas.origin.y+core.length&&wx+.5<atlas.origin.x+(core[0]?.length||0),cell=atlas.cellAt(wx+.5,wy+.5),snow=!local&&atlas.visualSnowCover(cell?.biome,cell?.height,clock,cell?.region)>.5;
  let type=code(wx,wy),mask=0,shore=0,cliff=0;
  for(const [dx,dy,bit]of [[0,-1,1],[1,0,2],[0,1,4],[-1,0,8]]){const n=code(wx+dx,wy+dy);if(n===1||n===5)mask|=bit;if(n===3)shore|=bit;if(n!==8&&n!==6)cliff|=bit;}
  let kind=type===6||type===8?'cliff':type===5?'bridge':type===3?'water':type===2||type===7?'paving':type===1?'path':shore?'shore':'ground';
  const lanes=laneIndex.get(Math.floor(gx/512)+','+Math.floor(gy/512))||[];
  if(type!==3&&type!==5&&type!==6&&type!==8&&lanes.some(l=>gx+8>=l.x&&gx+8<l.x+l.w&&gy+8>=l.y&&gy+8<l.y+l.h))kind=lanes.some(l=>l.paved)?'paving':'path',mask=15;
  const near=!local?atlas.closestRoad(wx+.5,wy+.5):null,seg=near?.segment;
  const routes=local?trails.filter(r=>wx*16+16>=Math.min(r.a[0],r.b[0])-r.width&&wx*16<=Math.max(r.a[0],r.b[0])+r.width&&wy*16+16>=Math.min(r.a[1],r.b[1])-r.width&&wy*16<=Math.max(r.a[1],r.b[1])+r.width):atlas.roadIndex.near(wx+.5,wy+.5).filter(s=>s.r.type!=='searoutes'&&atlas.project(wx+.5,wy+.5,s.a,s.b).d<s.r.width/2+2).map(s=>({a:s.a.map(n=>n*16),b:s.b.map(n=>n*16),width:s.r.width*8}));
  // Authored district lanes are ground geometry too; their centre/width is kept.
  if(routes)for(const l of lanes)if(gx+16>=l.x&&gx<=l.x+l.w&&gy+16>=l.y&&gy<=l.y+l.h){const horizontal=l.w>=l.h,a=horizontal?[l.x,l.y+l.h/2]:[l.x+l.w/2,l.y],b=horizontal?[l.x+l.w,l.y+l.h/2]:[l.x+l.w/2,l.y+l.h];routes.push({a:[a[0]+atlas.origin.x*16,a[1]+atlas.origin.y*16],b:[b[0]+atlas.origin.x*16,b[1]+atlas.origin.y*16],width:(horizontal?l.h:l.w)/2,orthogonal:l.orthogonal!==false});}
  return {family:local?'desert':snow?'snow':familyOf(cell),kind,mask:kind==='shore'?shore:kind==='cliff'?cliff:mask,height:kind==='cliff'?(type===6?24:32):0,dir:seg&&Math.abs(seg.b[0]-seg.a[0])>Math.abs(seg.b[1]-seg.a[1])?1:0,routes,sourceCode:type,offsetX:local?(atlas.origin.x-Math.round(atlas.origin.x))*16:0,offsetY:local?(atlas.origin.y-Math.round(atlas.origin.y))*16:0};
 }
 function* renderSteps(x0,y0,width=512,height=512,clock=480){
  const data=new Uint8ClampedArray(1024*544*4),features=[],tiles=[];
  for(let y=0;y<32;y++)for(let x=0;x<32;x++){tiles.push({x,y,d:metadata(x0/16+x,y0/16+y,clock)});if(x%4===3)yield;}
  tiles.sort((a,b)=>a.x+a.y-b.x-b.y||a.x-b.x);
  for(let k=0;k<tiles.length;k++){
   const {x,y,d}=tiles[k],im=T.raster(d,{x:x0+x*16+d.offsetX,y:y0+y*16+d.offsetY}),sx=Math.round((x-y)*16+d.offsetX-d.offsetY+512-im.anchor[0]),sy=Math.round((x+y)*8+(d.offsetX+d.offsetY)/2+32-im.anchor[1]);
   for(let iy=0;iy<im.height;iy++)for(let ix=0;ix<im.width;ix++){const src=(iy*im.width+ix)*4,tx=sx+ix,ty=sy+iy;if(im.data[src+3]&&tx>=0&&tx<1024&&ty>=0&&ty<544)data.set(im.data.subarray(src,src+4),(ty*1024+tx)*4);}
   // Only exposed boundaries need foreground occlusion. Their solid cells never
   // become walkable just because a facade is drawn after an actor.
   if(d.kind==='cliff'&&(d.mask&6))features.push({width:im.width,height:im.height,data:im.data,x:sx-512,y:sy-32,depth:(x+y)*8+(d.offsetX+d.offsetY)/2+16});
   yield;
  }
  return {width:1024,height:544,data,features};
 }
 function render(...args){const steps=renderSteps(...args);let next;do{next=steps.next();}while(!next.done);return next.value;}
 return {metadata,renderSteps,render};
}
if(typeof module==='object'&&module.exports)module.exports=createProjectedWorldArt;
