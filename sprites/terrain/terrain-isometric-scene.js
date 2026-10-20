/* Review scenes: native terrain plus the actual architecture pixels at 1:1. */
(function(r,f){if(typeof module==='object'&&module.exports)module.exports=f(require('./terrain-isometric'),require('../architecture/architecture-isometric'),require('./player-reference'));else r.HearthreaverTerrainScene=f(r.HearthreaverIsometricTerrain,r.HearthreaverIsometric,r.HearthreaverTerrainPlayer);})(globalThis,function(T,A,Player){
'use strict';
const directions=[[0,-1,1],[1,0,2],[0,1,4],[-1,0,8]];
const houseFor={desert:'T13',grass:'T01',steppe:'T09',forest:'T05',wetforest:'T17',jungle:'T21',marsh:'T17',taiga:'T09',tundra:'T10',snow:'T09',cursed:'T16'};
function makeMap(family='grass'){
 const width=24,height=22,cells=[];
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const riverX=10+(y>11?Math.floor(Math.sin((y-11)/4)*1.1):0),river=x===riverX||x===riverX+1;
  const plateau=x<14&&y<8&&!(x<2&&y>5),z=plateau?32:x>17&&y<4?16:0;
  const road=!river&&(y===15||x===18&&y>8||x===5&&y>=5&&y<=15),bridge=river&&y===15;
  cells.push({x,y,family,z,kind:river?'water':bridge?'bridge':road?'path':'ground',river,road,bridge});
 }
 const at=(x,y)=>x>=0&&y>=0&&x<width&&y<height?cells[y*width+x]:null;
 for(const c of cells){
  if(c.bridge){c.kind='bridge';c.dir=1;}
  c.mask=0;c.cliffMask=0;c.shoreMask=0;
  for(const [dx,dy,bit]of directions){const n=at(c.x+dx,c.y+dy);if(n?.road||n?.bridge)c.mask|=bit;if((n?.z||0)<c.z)c.cliffMask|=bit;if(n?.river)c.shoreMask|=bit;}
  if(!c.river&&!c.road&&c.shoreMask)c.kind='shore';
  if(c.x===5&&c.y===8){c.kind='stairs';c.dir=0;}
  if(c.river&&c.y===7){c.kind='waterfall';c.dir=2;}
 }
 const houses=[{id:houseFor[family]||'T01',x:2*16,y:1*16,z:32,dir:'face'}, {id:houseFor[family]||'T01',x:15*16,y:6*16,z:0,dir:'face'}, {id:family==='snow'?'T09-hiver':family==='desert'?'T14':'T11',x:18*16,y:17*16,z:0,dir:'face'}];
 for(const h of houses){if(!A.list().some(d=>d.id===h.id))h.id='T01';const d=A.entry(h.id);h.width=d.width;h.depth=d.depth;h.dir=d.views[0];}
 const insideHouse=(x,y)=>houses.some(h=>x>h.x-8&&x<h.x+h.width+8&&y>h.y-8&&y<h.y+h.depth+8);
 const trees=[];
 for(const c of cells){
  const h=T.hash(c.x,c.y,28);if(c.kind!=='ground'||insideHouse(c.x*16+8,c.y*16+8)||c.x>8&&c.x<14||h%17!==0||directions.some(([dx,dy])=>at(c.x+dx,c.y+dy)?.road)||Math.hypot(c.x-18,c.y-13)<3)continue;
  trees.push({x:c.x*16+5+h%7,y:c.y*16+6+h%5,z:c.z,seed:h,family});
 }
 return {width,height,family,cells,houses,trees,at};
}
function extractAtlas(atlas,x0,y0,width=24,height=22){
 const family=c=>atlas.curseCells.has(c?.id)?'cursed':c?.biome===11?'snow':c?.biome===10?'tundra':c?.biome===9?'taiga':c?.biome===12?'marsh':c?.biome===8?'wetforest':[5,7].includes(c?.biome)?'jungle':c?.biome===6?'forest':[1,2].includes(c?.biome)?'desert':c?.biome===3?'steppe':'grass';
 const cells=[],offset=[x0*16,y0*16];
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const wx=x0+x,wy=y0+y,code=atlas.terrain(wx,wy),c=atlas.cellAt(wx+.5,wy+.5);
  let mask=0,shoreMask=0,cliffMask=0;
  for(const [dx,dy,bit]of directions){const n=atlas.terrain(wx+dx,wy+dy);if(n===1||n===5)mask|=bit;if(n===3)shoreMask|=bit;if(n!==8)cliffMask|=bit;}
  const road=atlas.closestRoad(wx+.5,wy+.5),seg=road?.road?.segments?.[0],dir=seg&&Math.abs(seg.b[0]-seg.a[0])>Math.abs(seg.b[1]-seg.a[1])?1:0;
  const routes=atlas.roadIndex.near(wx+.5,wy+.5).filter(s=>s.r.type!=='searoutes').map(s=>({a:s.a.map(v=>v*16),b:s.b.map(v=>v*16),width:s.r.width*8}));
  cells.push({x,y,family:family(c),sourceCode:code,z:code===8?32:0,kind:code===8?'cliff':code===3?'water':code===5?'bridge':code===1?'path':code===2?'paving':shoreMask?'shore':'ground',mask,shoreMask,cliffMask:code===8?cliffMask:0,dir,routes});
 }
 return {width,height,family:cells[Math.floor(cells.length/2)].family,cells,houses:[],trees:[],offset,atlasRect:{x:x0,y:y0,width,height}};
}
function tree(ctx,o,origin){
 const [sx,sy]=T.project(o.x,o.y,o.z),x=Math.round(sx+origin[0]),y=Math.round(sy+origin[1]),snow=['snow','tundra'].includes(o.family),pine=['snow','tundra','taiga'].includes(o.family),desert=o.family==='desert';
 const colors=T.colors,fol=colors[o.family==='cursed'?'cursed':desert?'steppe':o.family==='jungle'?'jungle':'forest'];
 function px(a,b,c){ctx.fillStyle=c;ctx.fillRect(x+a,y+b,1,1);}
 // Roots and foot shadow follow projected ground axes, never a front-on base.
 for(let a=-8;a<=8;a++)for(let b=-3;b<=3;b++)if(a*a/64+b*b/9<1)px(a+2,b+1,colors.forest[0]);
 for(let z=0;z<29;z++)for(let a=-2;a<=1;a++)px(a,-z,colors.wood[a<0?4:2]);
 for(let i=0;i<8;i++){px(-i,-Math.floor(i/2),colors.wood[3]);px(i,-Math.floor(i/2),colors.wood[2]);}
 if(pine){
  for(let tier=0;tier<5;tier++){
   const cy=-14-tier*8,rx=17-tier*3;
   for(let b=-10;b<=5;b++)for(let a=-rx;a<=rx;a++){
    const lim=rx*(b+11)/16;if(Math.abs(a)>lim||b>5-Math.abs(a)*.14)continue;
    let k=a<0?4:2;if(mod(a+b,7)<2)k--;px(a,cy+b,snow&&b<-1&&mod(a*2+b,9)>1?colors.snow[a<0?5:4]:fol[Math.max(0,k)]);
   }
  }
 }else if(desert){
  for(let j=0;j<6;j++)for(let i=0;i<17;i++){const a=Math.round((j-2.5)*i/4),b=-30+Math.floor(i*i/65);px(a,b,fol[j<3?4:2]);if(i<12)px(a,b+1,fol[3]);}
 }else{
  const clusters=[[-13,-27,12,9],[12,-27,12,10],[0,-23,16,10],[-10,-39,13,11],[10,-41,12,10],[0,-48,13,10]];
  for(const [cx,cy,rx,ry]of clusters)for(let b=-ry-1;b<=ry;b++)for(let a=-rx-1;a<=rx;a++){
   const dx=a/rx,dy=b/ry,angle=Math.atan2(dy,dx),edge=1+.06*Math.sin(angle*9+o.seed),dist=dx*dx+dy*dy;if(dist>edge)continue;
   const light=-dx*.45-dy*.8,h=T.hash(Math.floor((a+cx)/3),Math.floor((b+cy)/3),o.seed);let k=dist>.84?(light>.2?3:1):light>.45?5:light>-.1?4:light>-.6?3:2;
   if(h%7===0&&mod(a+b,5)<2)k++;px(cx+a,cy+b,fol[Math.min(6,k)]);
  }
 }
}
const mod=(v,n)=>(v%n+n)%n;
function render(ctx,map,options={}){
 const origin=options.origin||[400,111],grid=!!options.grid;
 ctx.save();ctx.imageSmoothingEnabled=false;
 const sorted=map.cells.slice().sort((a,b)=>a.x+a.y-b.x-b.y||a.x-b.x);
 for(const c of sorted){
  const [sx,sy]=T.project(c.x*16,c.y*16,c.z),x=sx+origin[0],y=sy+origin[1],base={family:c.family,kind:c.kind,mask:c.kind==='shore'?c.shoreMask:c.mask,height:0,dir:c.dir||0,routes:c.routes},tex={x:c.x*16+(map.offset?.[0]||0),y:c.y*16+(map.offset?.[1]||0)};
  if(c.cliffMask)T.draw(ctx,{...base,kind:'cliff',mask:c.cliffMask,height:c.z},x,y+c.z,tex);
  if(c.kind==='stairs')T.draw(ctx,{...base,height:32},x,y,tex);
  else if(c.kind==='waterfall')T.draw(ctx,{...base,height:32},x,y+c.z,tex);
  else T.draw(ctx,base,x,y,tex);
  if(c.kind==='ground'&&T.hash(c.x,c.y,19)%13===0)T.draw(ctx,{...base,kind:'pebbles'},x+5,y+3,{x:c.x*16,y:c.y*16});
  if(grid){ctx.strokeStyle='#d5deb03b';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+16,y+8);ctx.lineTo(x,y+16);ctx.lineTo(x-16,y+8);ctx.closePath();ctx.stroke();}
 }
 const objects=map.trees.map(t=>({depth:(t.x+t.y)/2,draw:()=>tree(ctx,t,origin)}));
 for(const h of map.houses){
  const d=A.entry(h.id),winter=map.family==='snow'&&A.list().some(a=>a.id===h.id+'-hiver'),id=winter?h.id+'-hiver':h.id;
  const [x,y]=T.project(h.x,h.y,h.z);objects.push({depth:(h.x+h.y+d.width+d.depth)/2,draw:()=>A.draw(ctx,{id,x:Math.round(x+origin[0]),y:Math.round(y+origin[1]),dir:h.dir})});
 }
 // The reference human is 19 native pixels tall, matching the architecture pack.
 const [hx,hy]=T.project(18*16+8,13*16+7);
 if(!map.atlasRect)objects.push({depth:(18*16+8+13*16+7)/2,draw:()=>{for(const [x,y,r,g,b,a]of Player.pixels){ctx.fillStyle=`rgba(${r},${g},${b},${a/255})`;ctx.fillRect(Math.round(hx+origin[0])-Player.anchor[0]+x,Math.round(hy+origin[1])-Player.anchor[1]+y,1,1);}}});
 objects.sort((a,b)=>a.depth-b.depth).forEach(o=>o.draw());ctx.restore();
 return {houses:map.houses.length,tiles:map.cells.length,projection:'dimetric-2:1',humanHeight:19};
}
return Object.freeze({makeMap,extractAtlas,render,tree});
});
