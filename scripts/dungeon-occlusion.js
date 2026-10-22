// Fade only a foreground wall or crate whose opaque art covers the hero's head/torso.
// Transparent sprite margins, distant walls and low corridor borders stay solid.
const DungeonOcclusion=(()=>{
 const masks=new WeakMap();
 function covered(it,piece,image,p){
  if(!it.edge&&it.piece!=='caisse')return false;
  const key=Math.floor(p.x/32)+Math.floor(p.y/32),sub=p.x+p.y;
  if(it.key<key||it.key===key&&it.sub<=sub)return false;
  const q=WorldProjection.point(...it.ref),hero=WorldProjection.point(p.x,p.y),left=Math.round(q.x-piece.anchor[0]),top=Math.round(q.y-piece.anchor[1]);
  if(hero.x+6<left||hero.x-6>=left+piece.w||hero.y-8<top||hero.y-29>=top+piece.h)return false;
  let mask=masks.get(image);if(!mask){const cv=document.createElement('canvas');cv.width=piece.w;cv.height=piece.h;const c=cv.getContext('2d');c.drawImage(image,0,0);mask=c.getImageData(0,0,piece.w,piece.h).data;masks.set(image,mask);}
  let hits=0;
  for(const dy of [-27,-22,-17,-12])for(const dx of [-4,0,4]){const x=Math.round(hero.x+dx)-left,y=Math.round(hero.y+dy)-top;if(x>=0&&y>=0&&x<piece.w&&y<piece.h&&mask[(y*piece.w+x)*4+3]>96)hits++;}
  return hits>=4;
 }
 function alpha(renderer,it,piece,image,p){
  const hidden=covered(it,piece,image,p),target=hidden?(it.piece==='caisse'?.55:.42):1;
  if(renderer.dungeonOcclusionFloor!==renderer.g.dungeon.floor){renderer.dungeonOcclusionFloor=renderer.g.dungeon.floor;renderer.dungeonWallAlpha=new Map();}
  const key=it.occlusionKey||it.piece+'/'+it.ref.join(','),map=renderer.dungeonWallAlpha,old=map.get(key)??1,dt=renderer.dungeonOcclusionDt??1/60,value=target+(old-target)*Math.exp(-dt/.075),a=Math.abs(value-target)<.005?target:value;
  if(a<1)map.set(key,a);else map.delete(key);
  if(it.edge||it.piece==='caisse')renderer.dungeonOcclusion.push({piece:it.piece,ref:it.ref,covered:hidden,alpha:a});return a;
 }
 return {covered,alpha};
})();
