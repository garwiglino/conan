/* Serializable worker/fallback renderer. No DOM, PNG or synchronous full-world pass.
 * `env` (createEnvironmentArt) paints the redrawn biomes; other families keep T. */
function createProjectedWorldArt(atlas,T,config={},env=null){
 const core=config.core||[],familyOf=c=>atlas.curseCells.has(c?.id)?'cursed':c?.biome===11?'snow':c?.biome===10?'tundra':c?.biome===9?'taiga':c?.biome===12?'marsh':c?.biome===8?'wetforest':[5,7].includes(c?.biome)?'jungle':c?.biome===6?'forest':[1,2].includes(c?.biome)?'desert':c?.biome===3?'steppe':'grass';
 const ENV_FAMILIES=new Set(env?['forest']:[]);
 const laneIndex=new Map();for(const l of config.lanes||[])for(let y=Math.floor(l.y/512);y<=Math.floor((l.y+l.h)/512);y++)for(let x=Math.floor(l.x/512);x<=Math.floor((l.x+l.w)/512);x++){const k=x+','+y;if(!laneIndex.has(k))laneIndex.set(k,[]);laneIndex.get(k).push(l);}
 const trails=[];for(const trail of config.trails||[])for(let i=1;i<trail.pts.length;i++){const a=trail.pts[i-1],b=trail.pts[i];trails.push({a:[(a[0]+atlas.origin.x)*16,(a[1]+atlas.origin.y)*16],b:[(b[0]+atlas.origin.x)*16,(b[1]+atlas.origin.y)*16],width:trail.w*8});}
 const isLocal=(wx,wy)=>wx+.5>=atlas.origin.x&&wy+.5>=atlas.origin.y&&wy+.5<atlas.origin.y+core.length&&wx+.5<atlas.origin.x+(core[0]?.length||0);
 const code=(wx,wy)=>{const x=Math.floor(wx+.5-atlas.origin.x),y=Math.floor(wy+.5-atlas.origin.y);return x>=0&&y>=0&&y<core.length&&x<(core[0]?.length||0)?core[y][x]:atlas.terrain(wx,wy);};
 function familyAt(wx,wy,clock){if(isLocal(wx,wy))return 'desert';const cell=atlas.cellAt(wx+.5,wy+.5);return atlas.visualSnowCover(cell?.biome,cell?.height,clock,cell?.region)>.5?'snow':familyOf(cell);}
 function metadata(wx,wy,clock){
  const gx=(wx-atlas.origin.x)*16,gy=(wy-atlas.origin.y)*16,local=isLocal(wx,wy);
  let type=code(wx,wy),mask=0,shore=0,cliff=0;
  for(const [dx,dy,bit]of [[0,-1,1],[1,0,2],[0,1,4],[-1,0,8]]){const n=code(wx+dx,wy+dy);if(n===1||n===5)mask|=bit;if(n===3)shore|=bit;if(n!==8&&n!==6)cliff|=bit;}
  let kind=type===6||type===8?'cliff':type===5?'bridge':type===3?'water':type===2||type===7?'paving':type===1?'path':shore?'shore':'ground';
  const lanes=laneIndex.get(Math.floor(gx/512)+','+Math.floor(gy/512))||[];
  if(type!==3&&type!==5&&type!==6&&type!==8&&lanes.some(l=>gx+8>=l.x&&gx+8<l.x+l.w&&gy+8>=l.y&&gy+8<l.y+l.h))kind=lanes.some(l=>l.paved)?'paving':'path',mask=15;
  const near=!local?atlas.closestRoad(wx+.5,wy+.5):null,seg=near?.segment;
  const routes=local?trails.filter(r=>wx*16+16>=Math.min(r.a[0],r.b[0])-r.width&&wx*16<=Math.max(r.a[0],r.b[0])+r.width&&wy*16+16>=Math.min(r.a[1],r.b[1])-r.width&&wy*16<=Math.max(r.a[1],r.b[1])+r.width):atlas.roadIndex.near(wx+.5,wy+.5).filter(s=>s.r.type!=='searoutes'&&atlas.project(wx+.5,wy+.5,s.a,s.b).d<s.r.width/2+2).map(s=>({a:s.a.map(n=>n*16),b:s.b.map(n=>n*16),width:s.r.width*8}));
  // Authored district lanes are ground geometry too; their centre/width is kept.
  if(routes)for(const l of lanes)if(gx+16>=l.x&&gx<=l.x+l.w&&gy+16>=l.y&&gy<=l.y+l.h){const horizontal=l.w>=l.h,a=horizontal?[l.x,l.y+l.h/2]:[l.x+l.w/2,l.y],b=horizontal?[l.x+l.w,l.y+l.h/2]:[l.x+l.w/2,l.y+l.h];routes.push({a:[a[0]+atlas.origin.x*16,a[1]+atlas.origin.y*16],b:[b[0]+atlas.origin.x*16,b[1]+atlas.origin.y*16],width:(horizontal?l.h:l.w)/2});}
  return {family:familyAt(wx,wy,clock),kind,mask:kind==='shore'?shore:kind==='cliff'?cliff:mask,height:kind==='cliff'?(type===6?24:32):0,dir:seg&&Math.abs(seg.b[0]-seg.a[0])>Math.abs(seg.b[1]-seg.a[1])?1:0,routes,sourceCode:type,offsetX:local?(atlas.origin.x-Math.round(atlas.origin.x))*16:0,offsetY:local?(atlas.origin.y-Math.round(atlas.origin.y))*16:0};
 }
 // Chemins des biomes redessinés : routes et ruelles posées sur des cases de
 // 2 m (deux cases du monde) ; chaque case prend la pièce standard que
 // désignent ses voisines occupées (droite, virage, T, croisement, impasse).
 const segmentCells=new Map();
 function cellLine(ax,ay,bx,by){
  let ci=Math.floor(ax),cj=Math.floor(ay);const ei=Math.floor(bx),ej=Math.floor(by),dx=bx-ax,dy=by-ay,si=Math.sign(dx),sj=Math.sign(dy),out=[[ci,cj]];
  const tdx=si?Math.abs(1/dx):Infinity,tdy=sj?Math.abs(1/dy):Infinity;let tx=si>0?(ci+1-ax)/dx:si<0?(ax-ci)/-dx:Infinity,ty=sj>0?(cj+1-ay)/dy:sj<0?(ay-cj)/-dy:Infinity;
  for(let n=0;(ci!==ei||cj!==ej)&&n<4096;n++){if(tx<=ty&&ci!==ei){ci+=si;tx+=tdx;}else if(cj!==ej){cj+=sj;ty+=tdy;}else{ci+=si;tx+=tdx;}out.push([ci,cj]);}
  return out;
 }
 function pathCells(wx0,wy0,size){
  const lo=[wx0-8,wy0-8],hi=[wx0+size+8,wy0+size+8],occ=new Map(),seen=new Set();
  const add=(cells,set)=>{for(const [ci,cj]of cells){if(ci*2+2<lo[0]||ci*2>hi[0]||cj*2+2<lo[1]||cj*2>hi[1])continue;const k=ci+','+cj;if(occ.get(k)!=='rangs')occ.set(k,set);}};
  for(const [x,y]of [[lo[0],lo[1]],[hi[0],lo[1]],[lo[0],hi[1]],[hi[0],hi[1]]])for(const s of atlas.roadIndex.near(x,y)){
   if(seen.has(s)||s.r.type==='searoutes')continue;seen.add(s);
   if(Math.max(s.a[0],s.b[0])<lo[0]||Math.min(s.a[0],s.b[0])>hi[0]||Math.max(s.a[1],s.b[1])<lo[1]||Math.min(s.a[1],s.b[1])>hi[1])continue;
   let cells=segmentCells.get(s);if(!cells){cells=cellLine(s.a[0]/2,s.a[1]/2,s.b[0]/2,s.b[1]/2);segmentCells.set(s,cells);if(segmentCells.size>4096)segmentCells.delete(segmentCells.keys().next().value);}
   add(cells,'chemin');
  }
  // Ruelles des localités, en coordonnées de jeu : leur axe devient une suite de pièces.
  const g0=[(lo[0]-atlas.origin.x)*16,(lo[1]-atlas.origin.y)*16],g1=[(hi[0]-atlas.origin.x)*16,(hi[1]-atlas.origin.y)*16],lanes=new Set();
  for(let y=Math.floor(g0[1]/512);y<=Math.floor(g1[1]/512);y++)for(let x=Math.floor(g0[0]/512);x<=Math.floor(g1[0]/512);x++)for(const l of laneIndex.get(x+','+y)||[])lanes.add(l);
  for(const l of lanes){const horizontal=l.w>=l.h,a=horizontal?[l.x+4,l.y+l.h/2]:[l.x+l.w/2,l.y+4],b=horizontal?[l.x+l.w-4,l.y+l.h/2]:[l.x+l.w/2,l.y+l.h-4],t=p=>[(p[0]/16+atlas.origin.x)/2,(p[1]/16+atlas.origin.y)/2];add(cellLine(...t(a),...t(b)),l.paved?'rangs':'chemin');}
  return occ;
 }
 // Localités des biomes redessinés : herbe entre les ruelles, place pavée au centre.
 // Le pavage de la place dépend de la localité (stable d'une partie à l'autre).
 const PLAZAS={town:['flags','fan','bricks','setts'],port:['flags','setts'],relay:['cobble','setts'],ruin:['cobble'],refuge:['cobble'],camp:['cobble'],dock:['cobble']};
 const plazaOf=site=>{const list=PLAZAS[site.kind]||['cobble'];let h=0;for(const ch of String(site.id))h=Math.imul(h^ch.charCodeAt(0),16777619)>>>0;return list[(h>>>3)%list.length];};
 // Les routes (code 1) deviennent des pièces de chemin, sauf sur la place qu'elles traversent.
 function placeTile(i,j){const c=code(i,j);if(c!==1&&c!==2&&c!==7)return {code:c};const site=atlas.siteAt(i+.5,j+.5);if(!site)return {code:0};const d=Math.hypot(i+.5-site.x,j+.5-site.y),r=site.kind==='town'?7:site.kind==='port'?5:3.5;return d<=r?{code:2,paving:plazaOf(site)}:{code:0};}
 function* renderSteps(x0,y0,width=512,height=512,clock=480){
  const data=new Uint8ClampedArray(1024*544*4),features=[],tiles=[],wx0=x0/16,wy0=y0/16;let redrawn=0;
  for(let y=0;y<32;y++)for(let x=0;x<32;x++){const d=metadata(wx0+x,wy0+y,clock);d.env=ENV_FAMILIES.has(d.family);if(d.env)redrawn++;tiles.push({x,y,d});if(x%4===3)yield;}
  tiles.sort((a,b)=>a.x+a.y-b.x-b.y||a.x-b.x);
  for(let k=0;k<tiles.length;k++){
   const {x,y,d}=tiles[k];if(d.env)continue;
   const im=T.raster(d,{x:x0+x*16+d.offsetX,y:y0+y*16+d.offsetY}),sx=Math.round((x-y)*16+d.offsetX-d.offsetY+512-im.anchor[0]),sy=Math.round((x+y)*8+(d.offsetX+d.offsetY)/2+32-im.anchor[1]);
   for(let iy=0;iy<im.height;iy++)for(let ix=0;ix<im.width;ix++){const src=(iy*im.width+ix)*4,tx=sx+ix,ty=sy+iy;if(im.data[src+3]&&tx>=0&&tx<1024&&ty>=0&&ty<544)data.set(im.data.subarray(src,src+4),(ty*1024+tx)*4);}
   // Only exposed boundaries need foreground occlusion. Their solid cells never
   // become walkable just because a facade is drawn after an actor.
   if(d.kind==='cliff'&&(d.mask&6))features.push({width:im.width,height:im.height,data:im.data,x:sx-512,y:sy-32,depth:(x+y)*8+(d.offsetX+d.offsetY)/2+16});
   yield;
  }
  if(redrawn){
   // Sol, chemins, eau et reliefs du nouvel environnement ; les anciens dessins
   // gardent les cases des autres familles et l'emportent sur les pixels incertains.
   const families=new Map(tiles.map(({x,y,d})=>[(wx0+x)+','+(wy0+y),d.family])),occ=pathCells(wx0,wy0,32);yield;
   const familyOfTile=(i,j)=>{const k=i+','+j;let f=families.get(k);if(f===undefined){f=familyAt(i,j,clock);families.set(k,f);}return f;};
   const has=(ci,cj)=>occ.has(ci+','+cj);
   const sampler={
    tile:placeTile,
    use:(i,j)=>ENV_FAMILIES.has(familyOfTile(i,j)),
    piece:(ci,cj)=>{const set=occ.get(ci+','+cj);return set?[{set,mask:(has(ci,cj-1)?1:0)|(has(ci+1,cj)?2:0)|(has(ci,cj+1)?4:0)|(has(ci-1,cj)?8:0)}]:null;}
   };
   const im=yield* env.renderSteps({sampler,base:[x0,y0],screen:[x0-y0,(x0+y0)/2]});
   for(let k=0;k<im.priority.length;k++){const p=im.priority[k];if(p===2||p===1&&!data[k*4+3])data.set(im.data.subarray(k*4,k*4+4),k*4);}
   for(const f of im.features)features.push(f);
  }
  return {width:1024,height:544,data,features};
 }
 function render(...args){const steps=renderSteps(...args);let next;do{next=steps.next();}while(!next.done);return next.value;}
 return {metadata,renderSteps,render,pathCells};
}
if(typeof module==='object'&&module.exports)module.exports=createProjectedWorldArt;
