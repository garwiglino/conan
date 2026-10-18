/* Compact world: the Azgaar macro map divided by `scale`, one inhabited pays per region,
   walkable roads between neighbouring pays and natural borders everywhere else.
   Deterministic; reads only the editable sources and returns atlas fields. */
'use strict';
const SQRT2=Math.SQRT2;
class Heap{constructor(){this.a=[];}push(v){const a=this.a;let i=a.length;a.push(v);while(i){const p=(i-1)>>1;if(a[p].f<=v.f)break;a[i]=a[p];i=p;}a[i]=v;}pop(){const a=this.a,r=a[0],v=a.pop();if(a.length){let i=0;while(i*2+1<a.length){let c=i*2+1;if(c+1<a.length&&a[c+1].f<a[c].f)c++;if(a[c].f>=v.f)break;a[i]=a[c];i=c;}a[i]=v;}return r;}get size(){return this.a.length;}}
const elide=name=>/^[AEIOUYÂÉÈÊÎÔÛ]/i.test(name)?'d’'+name:'de '+name;

function compactWorld(world,source,spec){
 const K=spec.scale,W=world.coordinateSystem.width/K,H=world.coordinateSystem.height/K,R=spec.raster;
 const round=v=>Math.round(v*10)/10,dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
 const cells=world.macroCells.map(c=>({id:c.id,x:round(c.center[0]/K),y:round(c.center[1]/K),land:!!c.land,height:c.heightIndex,biome:c.biome,region:c.region,feature:c.feature,river:c.river,poly:c.polygon.flat().map(v=>round(v/K))}));
 const regions=world.regions,regionById=new Map(regions.map(r=>[r.id,r]));

 // A raster of macro cells, filled with the same even-odd rule as the runtime lookup.
 const RW=Math.ceil(W/R),RH=Math.ceil(H/R),grid=new Int32Array(RW*RH).fill(-1);
 cells.forEach((c,ci)=>{const p=c.poly;let y0=Infinity,y1=-Infinity;for(let i=1;i<p.length;i+=2){y0=Math.min(y0,p[i]);y1=Math.max(y1,p[i]);}
  for(let row=Math.max(0,Math.floor(y0/R));row<=Math.min(RH-1,Math.floor(y1/R));row++){const yc=(row+.5)*R,xs=[];
   for(let i=0,j=p.length-2;i<p.length;j=i,i+=2){const ay=p[i+1],by=p[j+1];if((ay>yc)!==(by>yc))xs.push(p[i]+(yc-ay)*(p[j]-p[i])/(by-ay));}
   xs.sort((a,b)=>a-b);for(let k=0;k+1<xs.length;k+=2){const c0=Math.max(0,Math.ceil(xs[k]/R-.5)),c1=Math.min(RW-1,Math.floor(xs[k+1]/R-.5));for(let col=c0;col<=c1;col++)grid[row*RW+col]=ci;}}});
 const pix=(x,y)=>{const col=Math.floor(x/R),row=Math.floor(y/R);return col<0||row<0||col>=RW||row>=RH?-1:row*RW+col;};
 const cellAt=(x,y)=>{const i=pix(x,y);return i<0||grid[i]<0?null:cells[grid[i]];};
 const isLand=new Uint8Array(RW*RH);for(let i=0;i<grid.length;i++)isLand[i]=grid[i]>=0&&cells[grid[i]].land?1:0;
 const waterCounts=new Map();for(const c of cells)if(!c.land)waterCounts.set(c.feature,(waterCounts.get(c.feature)||0)+1);
 const ocean=[...waterCounts].sort((a,b)=>b[1]-a[1])[0][0];
 // Chamfer distances in metres: land pixels to water, water pixels to land.
 function chamfer(seed){const d=new Float32Array(RW*RH);for(let i=0;i<d.length;i++)d[i]=seed(i)?0:1e9;const a=R,b=R*SQRT2;
  for(let y=0;y<RH;y++)for(let x=0;x<RW;x++){const i=y*RW+x;let v=d[i];if(x>0)v=Math.min(v,d[i-1]+a);if(y>0){v=Math.min(v,d[i-RW]+a);if(x>0)v=Math.min(v,d[i-RW-1]+b);if(x<RW-1)v=Math.min(v,d[i-RW+1]+b);}d[i]=v;}
  for(let y=RH-1;y>=0;y--)for(let x=RW-1;x>=0;x--){const i=y*RW+x;let v=d[i];if(x<RW-1)v=Math.min(v,d[i+1]+a);if(y<RH-1){v=Math.min(v,d[i+RW]+a);if(x<RW-1)v=Math.min(v,d[i+RW+1]+b);if(x>0)v=Math.min(v,d[i+RW-1]+b);}d[i]=v;}return d;}
 const toWater=chamfer(i=>!isLand[i]),toLand=chamfer(i=>isLand[i]);
 const waterDist=(x,y)=>{const i=pix(x,y);return i<0?0:toWater[i];},landDist=(x,y)=>{const i=pix(x,y);return i<0?0:toLand[i];};
 const isOcean=(x,y)=>{const i=pix(x,y);return i>=0&&!isLand[i]&&grid[i]>=0&&cells[grid[i]].feature===ocean;};

 const scells=source.pack.cells;
 const rivers=source.pack.rivers.map(r=>({id:r.i,name:r.name,width:Math.max(3,Math.min(55,r.width*1000)),points:r.cells.filter(c=>c>=0&&scells[c]).map(id=>{const c=scells[id];return [round((Math.round(c.p[0]*1000)+(c.h>=20?60:0))/K),round((Math.round(c.p[1]*1000)-(c.h>=20?80:0))/K)];})})).filter(r=>r.points.length>1);
 const riverPix=new Uint8Array(RW*RH);
 for(const r of rivers)for(let i=1;i<r.points.length;i++){const [ax,ay]=r.points[i-1],[bx,by]=r.points[i],m=r.width/2+12;
  for(let row=Math.max(0,Math.floor((Math.min(ay,by)-m)/R));row<=Math.min(RH-1,Math.floor((Math.max(ay,by)+m)/R));row++)for(let col=Math.max(0,Math.floor((Math.min(ax,bx)-m)/R));col<=Math.min(RW-1,Math.floor((Math.max(ax,bx)+m)/R));col++){
   const px=(col+.5)*R,py=(row+.5)*R,dx=bx-ax,dy=by-ay,q=dx*dx+dy*dy,t=q?Math.max(0,Math.min(1,((px-ax)*dx+(py-ay)*dy)/q)):0;if(Math.hypot(px-ax-dx*t,py-ay-dy*t)<=m)riverPix[row*RW+col]=1;}}
 const nearRiver=(x,y,m)=>{for(let dy=-m;dy<=m;dy+=R)for(let dx=-m;dx<=m;dx+=R){const i=pix(x+dx,y+dy);if(i>=0&&riverPix[i])return true;}return false;};

 // Settlements and story sites in compact metres; `legacy` keeps the former position.
 const sites=world.settlements.map(s=>({...s,legacy:[s.x,s.y],x:s.x/K,y:s.y/K,vertex:100000+s.id}));
 const story=world.storySites.map(s=>({...s,legacy:[s.x,s.y],x:s.x/K,y:s.y/K,vertex:110000+s.i,region:cells.find(c=>c.id===s.cell).region}));
 const geole=story.find(s=>s.name.startsWith('Geôle')),temple=story.find(s=>s.name.startsWith('Temple')),foyer=story.find(s=>s.name.startsWith('Foyer')),refuge=story.find(s=>s.name.startsWith('Refuge'));
 const settlementsOf=id=>sites.filter(s=>s.region===id);
 const radius=id=>spec.paysRadius.base+spec.paysRadius.perSqrtSettlement*Math.sqrt(settlementsOf(id).length);

 // One hub per region, pulled towards its neighbours but kept inside the region and apart.
 const adjacency=new Set(),seaPairs=new Set(),srcCell=new Map(world.macroCells.map(c=>[c.id,c]));
 const nearestRegion=(x,y)=>world.settlements.reduce((a,s)=>!a||Math.hypot(s.x-x,s.y-y)<Math.hypot(a.x-x,a.y-y)?s:a,null).region;
 for(const r of world.routes){if(r.type==='searoutes'){const a=nearestRegion(...r.points[0]),b=nearestRegion(...r.points.at(-1));if(a!==b)seaPairs.add([a,b].sort((x,y)=>x-y).join('-'));continue;}
  for(let i=1;i<r.points.length;i++){const a=srcCell.get(r.points[i-1][2])?.region,b=srcCell.get(r.points[i][2])?.region;if(a&&b&&a!==b)adjacency.add([a,b].sort((x,y)=>x-y).join('-'));}}
 for(const k of adjacency)seaPairs.delete(k);
 const pairs=s=>[...s].sort().map(k=>k.split('-').map(Number));
 const landLinks=pairs(adjacency),seaLinks=pairs(seaPairs);
 const okHub=(id,p)=>{const c=cellAt(p.x,p.y);if(!c||!c.land||c.region!==id)return false;const r=radius(id)*.6;for(let a=0;a<8;a++)if(!cellAt(p.x+Math.cos(a*Math.PI/4)*r,p.y+Math.sin(a*Math.PI/4)*r)?.land)return false;return true;};
 const centroid={},hub={};
 for(const r of regions){const ss=settlementsOf(r.id);centroid[r.id]={x:ss.reduce((t,s)=>t+s.x,0)/ss.length,y:ss.reduce((t,s)=>t+s.y,0)/ss.length};hub[r.id]={...centroid[r.id]};
  if(!okHub(r.id,hub[r.id])){let best=null;for(const c of cells){if(!c.land||c.region!==r.id||!okHub(r.id,c))continue;const d=dist(c,centroid[r.id]);if(!best||d<best.d)best={x:c.x,y:c.y,d};}if(!best)throw Error('No pays fits in region '+r.name);hub[r.id]={x:best.x,y:best.y};}}
 for(let it=0;it<400;it++){
  for(const a of regions)for(const b of regions){if(a.id>=b.id)continue;const A=hub[a.id],B=hub[b.id],L=dist(A,B),need=radius(a.id)+radius(b.id)+spec.paysGap;if(L>=need||!L)continue;const step=Math.min(150,(need-L)/2),ux=(B.x-A.x)/L,uy=(B.y-A.y)/L,na={x:A.x-ux*step,y:A.y-uy*step},nb={x:B.x+ux*step,y:B.y+uy*step};if(okHub(a.id,na))hub[a.id]=na;if(okHub(b.id,nb))hub[b.id]=nb;}
  for(const [a,b]of landLinks){const A=hub[a],B=hub[b],L=dist(A,B);if(L<=spec.linkTarget)continue;const step=Math.min(100,(L-spec.linkTarget)/2),ux=(B.x-A.x)/L,uy=(B.y-A.y)/L,na={x:A.x+ux*step,y:A.y+uy*step},nb={x:B.x-ux*step,y:B.y-uy*step};if(okHub(a,na))hub[a]=na;if(okHub(b,nb))hub[b]=nb;}
 }

 // Settlements keep their relative arrangement, compressed into the pays and spaced apart.
 const placed=[...sites,geole,refuge];
 // Regions follow their pays: each land cell joins the nearest pays of its own territory.
 const territoryOf=id=>regionById.get(id)?.territory;
 for(const c of cells){if(!c.land)continue;const t=territoryOf(c.region);let best=null;for(const r of regions){if(r.territory!==t)continue;const d=dist(c,hub[r.id])-radius(r.id);if(!best||d<best.d)best={id:r.id,d};}if(best)c.region=best.id;}
 const valid=(p,clear=spec.settlementWaterClearance,region=p.region)=>{const c=cellAt(p.x,p.y);return !!c?.land&&(region==null||[[0,0],[30,0],[-30,0],[0,30],[0,-30]].every(([dx,dy])=>cellAt(p.x+dx,p.y+dy)?.region===region))&&waterDist(p.x,p.y)>=clear&&!nearRiver(p.x,p.y,clear);};
 const nearestValid=(p,ok,reach=2500)=>{if(ok(p))return {x:p.x,y:p.y};for(let r=R;r<=reach;r+=R){const n=Math.max(8,Math.round(2*Math.PI*r/R));for(let k=0;k<n;k++){const q={x:p.x+Math.cos(k/n*Math.PI*2)*r,y:p.y+Math.sin(k/n*Math.PI*2)*r};if(ok(q))return q;}}throw Error('No valid ground near '+p.x+','+p.y);};
 for(const r of regions){const members=placed.filter(s=>s.region===r.id),c=centroid[r.id],h=hub[r.id],far=Math.max(1,...members.map(s=>dist(s,c))),k=Math.min(1,radius(r.id)*.85/far);for(const s of members){s.x=h.x+(s.x-c.x)*k;s.y=h.y+(s.y-c.y)*k;}}
 // The camp needs room for the authored map, the prison and its southern gate.
 const camp=geole,campOk=p=>valid(p,spec.campClearance,camp.region)&&!nearRiver(p.x,p.y,spec.campClearance+60)&&[[-60,-80],[90,-80],[-60,120],[90,120],[60.5,150]].every(([dx,dy])=>cellAt(p.x+dx,p.y+dy)?.land&&waterDist(p.x+dx,p.y+dy)>=40);
 const spread=(group,fixed=new Set())=>{for(let it=0;it<80;it++)for(const p of group)for(const q of group){if(p===q||p.region!==q.region||fixed.has(p))continue;const d=dist(p,q),min=spec.settlementSpacing;if(d<min&&d>0){const push=fixed.has(q)?min-d:(min-d)/2;p.x+=(p.x-q.x)/d*push;p.y+=(p.y-q.y)/d*push;}}};
 // Ports move to the nearest real ocean shore, then the others spread around them.
 const ports=new Set();
 for(const s of sites){if(!s.oceanPort)continue;let best=null;const reach=spec.portReach;
  for(let y=s.y-reach;y<=s.y+reach;y+=R)for(let x=s.x-reach;x<=s.x+reach;x+=R){const d=Math.hypot(x-s.x,y-s.y);if(d>reach||!isOcean(x,y)||landDist(x,y)>R*1.5)continue;if(!best||d<best.d)best={x,y,d};}
  if(!best){s.oceanPort=false;continue;}
  let spot=null;for(let y=best.y-400;y<=best.y+400;y+=R/2)for(let x=best.x-400;x<=best.x+400;x+=R/2){const w=waterDist(x,y);if(Math.abs(w-spec.portInland)>R||!valid({x,y},undefined,s.region))continue;const d=Math.hypot(x-best.x,y-best.y)+Math.hypot(x-s.x,y-s.y)*.25;if(!spot||d<spot.d)spot={x,y,d};}
  if(!spot){s.oceanPort=false;continue;}s.x=spot.x;s.y=spot.y;ports.add(s);}
 Object.assign(camp,nearestValid(camp,campOk));const fixed=new Set([...ports,camp]);
 // A settlement keeps the ground it was founded on (a marsh village stays in the marsh): it moves a little
 // towards that ground, and when none is near, the cell it stands on takes that biome.
 const cellById=new Map(cells.map(c=>[c.id,c])),biomeOf=new Map(placed.map(s=>[s,cellById.get(s.cell)?.biome]));
 const seek=(s,ok)=>{try{return nearestValid(s,q=>ok(q)&&cellAt(q.x,q.y)?.biome===biomeOf.get(s),spec.biomeReach);}catch{return nearestValid(s,ok);}};
 for(let pass=0;pass<4;pass++){spread(placed,fixed);for(const s of placed){if(fixed.has(s))continue;Object.assign(s,seek(s,q=>valid(q,undefined,s.region)));}}
 // The temple ruin stays beside the original camp, as in the authored opening.
 {const ok=p=>valid(p,undefined,camp.region)&&placed.every(s=>s===camp||dist(s,p)>=spec.settlementSpacing*.6)&&dist(p,hub[camp.region])<=radius(camp.region)*1.3;let spot=null;const base=Math.atan2(temple.legacy[1]-geole.legacy[1],temple.legacy[0]-geole.legacy[0]);
  for(const d of [spec.templeDistance,spec.templeDistance*.8,spec.templeDistance*1.25])for(let k=0;k<24&&!spot;k++){const a=base+(k%2?1:-1)*Math.ceil(k/2)*Math.PI/12,p={x:camp.x+Math.cos(a)*d,y:camp.y+Math.sin(a)*d};if(ok(p))spot=p;}
  if(!spot)throw Error('No room for the temple ruin beside the camp');Object.assign(temple,spot,{region:camp.region});}
 const home=sites.find(s=>s.id===1);Object.assign(foyer,{x:home.x+3,y:home.y+4,region:home.region,vertex:home.vertex});
 for(const s of [...placed,temple,foyer]){s.x=round(s.x);s.y=round(s.y);s.cell=cellAt(s.x,s.y).id;}
 const painted=new Set();for(const s of placed){const c=cellById.get(s.cell),b=biomeOf.get(s);if(b==null||c.biome===b||painted.has(c))continue;c.biome=b;painted.add(c);}
 foyer.cell=home.cell;

 // Wild expanses: one open, optional area per large territory, reached off-road.
 const wilds=[];
 for(const t of ['Igea','Teremor','Sarak','Varan','Tagon']){let best=null;
  for(const c of cells){if(!c.land||territoryOf(c.region)!==t)continue;let d=Infinity,near=null;for(const r of regions){const e=dist(c,hub[r.id])-radius(r.id)-spec.fringe;if(e<d){d=e;near=r.id;}}
   if(d<spec.wild.minDistance||d>spec.wild.maxDistance)continue;let ok=true;for(let a=0;a<12&&ok;a++){const q=cellAt(c.x+Math.cos(a*Math.PI/6)*spec.wild.radius,c.y+Math.sin(a*Math.PI/6)*spec.wild.radius);if(!q?.land||territoryOf(q.region)!==t)ok=false;}
   if(ok&&(!best||d>best.d))best={x:c.x,y:c.y,d,near};}
  if(best)wilds.push({territory:t,x:best.x,y:best.y,r:spec.wild.radius,near:best.near});}

 // Routes follow an A* over land on a 50 m lattice, then are straightened where the ground allows.
 const G=50,coreBox=(()=>{const ax=camp.x,ay=camp.y;return {x0:ax-23.5-60,x1:ax+48.5+20,y0:ay-55.5-20,y1:ay+8.5+130};})();
 const inCore=(x,y)=>x>coreBox.x0&&x<coreBox.x1&&y>coreBox.y0&&y<coreBox.y1;
 const walkable=(x,y)=>{const i=pix(x,y);return i>=0&&isLand[i]&&toWater[i]>=30&&!inCore(x,y);};
 const segOk=(a,b,check=walkable)=>{const len=Math.hypot(b[0]-a[0],b[1]-a[1]),n=Math.max(1,Math.ceil(len/8));let run=0;for(let i=0;i<=n;i++){const t=i/n,x=a[0]+(b[0]-a[0])*t,y=a[1]+(b[1]-a[1])*t;if(!check(x,y))return false;const p=pix(x,y);run=riverPix[p]?run+1:0;if(run>12)return false;}return true;};
 const stepCost=(x,y)=>{const c=cellAt(x,y);return 1+(c&&c.height>58?2:0)+(riverPix[pix(x,y)]?4:0);};
 function astar(a,b,{check=walkable,pad=3000,fromFree=false,goal=null}={}){
  const x0=Math.min(a.x,b?b.x:a.x)-pad,y0=Math.min(a.y,b?b.y:a.y)-pad,x1=Math.max(a.x,b?b.x:a.x)+pad,y1=Math.max(a.y,b?b.y:a.y)+pad,cw=Math.ceil((x1-x0)/G)+1,ch=Math.ceil((y1-y0)/G)+1;
  const node=(i,j)=>({x:x0+i*G,y:y0+j*G}),idx=(i,j)=>j*cw+i,gs=new Float64Array(cw*ch).fill(Infinity),prev=new Int32Array(cw*ch).fill(-1);
  const si=Math.round((a.x-x0)/G),sj=Math.round((a.y-y0)/G),ti=b?Math.round((b.x-x0)/G):-1,tj=b?Math.round((b.y-y0)/G):-1,h=(i,j)=>b?Math.hypot(i-ti,j-tj)*G:0;
  const q=new Heap();gs[idx(si,sj)]=0;q.push({i:si,j:sj,g:0,f:h(si,sj)});let end=-1;
  while(q.size){const n=q.pop(),k=idx(n.i,n.j);if(n.g!==gs[k])continue;const here=node(n.i,n.j);if(b?(n.i===ti&&n.j===tj):goal(here)){end=k;break;}
   for(let dj=-1;dj<=1;dj++)for(let di=-1;di<=1;di++){if(!di&&!dj)continue;const i=n.i+di,j=n.j+dj;if(i<0||j<0||i>=cw||j>=ch)continue;const p=node(i,j),start=n.i===si&&n.j===sj,last=b&&i===ti&&j===tj;
    if(!last&&!check(p.x,p.y))continue;if(!(start&&fromFree)&&!last&&!segOk([here.x,here.y],[p.x,p.y],check))continue;const g=n.g+Math.hypot(di,dj)*G*stepCost(p.x,p.y),k2=idx(i,j);if(g<gs[k2]){gs[k2]=g;prev[k2]=k;q.push({i,j,g,f:g+h(i,j)});}}}
  if(end<0)return null;const out=[];for(let k=end;k>=0;k=prev[k]){const i=k%cw,j=Math.floor(k/cw);out.unshift(node(i,j));}out[0]={x:a.x,y:a.y};if(b)out[out.length-1]={x:b.x,y:b.y};return out;}
 // String-pull the lattice path, then add a gentle meander where the ground permits.
 let vertexSerial=200000;
 function shape(path,check=walkable){const pts=[path[0]];let i=0;while(i<path.length-1){let j=Math.min(path.length-1,i+60);while(j>i+1&&!segOk([path[i].x,path[i].y],[path[j].x,path[j].y],check))j--;pts.push(path[j]);i=j;}
  const out=[pts[0]];for(let k=1;k<pts.length;k++){const a=out.at(-1),b=pts[k],len=dist(a,b),n=Math.floor(len/260);for(let m=1;m<=n;m++){const t=m/(n+1),nx=-(b.y-a.y)/len,ny=(b.x-a.x)/len,off=(((Math.sin((a.x+b.x)*.013+m*1.7)+Math.cos((a.y+b.y)*.011-m))*.5))*Math.min(22,len*.04),p={x:a.x+(b.x-a.x)*t+nx*off,y:a.y+(b.y-a.y)*t+ny*off};if(segOk([out.at(-1).x,out.at(-1).y],[p.x,p.y],check)&&segOk([p.x,p.y],[b.x,b.y],check))out.push(p);}out.push(b);}return out;}
 const routes=[],shapes={discs:[],segs:[]},amp=half=>Math.min(spec.border.amplitude,spec.border.share*half);
 const points=(pts,from,to)=>pts.map((p,k)=>[round(p.x),round(p.y),k===0?from.vertex:k===pts.length-1&&to?.vertex!=null?to.vertex:vertexSerial++]);
 const corridor=(pts,half)=>{for(let k=1;k<pts.length;k++)shapes.segs.push([pts[k-1][0],pts[k-1][1],pts[k][0],pts[k][1],half,amp(half)]);};
 const addRoute=(type,name,a,b,path,half)=>{const pts=points(shape(path),a,b);routes.push({id:routes.length,name,type,from:a.id??'story-'+a.i,to:b.id??'story-'+b.i,points:pts});corridor(pts,half);return pts;};
 const label=s=>s.name.replace(/^Geôle de Grise-Gueule$/,'Campement des Exilés');
 // Within each pays: a minimum spanning tree plus a few short loops, never crossing.
 const crosses=(a,b,c,d)=>{const o=(p,q,r)=>Math.sign((q.x-p.x)*(r.y-p.y)-(q.y-p.y)*(r.x-p.x));return a!==c&&a!==d&&b!==c&&b!==d&&o(a,b,c)!==o(a,b,d)&&o(c,d,a)!==o(c,d,b);};
 for(const r of regions){const members=[...placed,temple].filter(s=>s.region===r.id&&s!==camp);if(members.length<2)continue;const edges=[],inTree=new Set([members[0]]);
  while(inTree.size<members.length){let best=null;for(const a of inTree)for(const b of members){if(inTree.has(b))continue;const d=dist(a,b);if(!best||d<best.d)best={a,b,d};}edges.push(best);inTree.add(best.b);}
  const longest=Math.max(...edges.map(e=>e.d)),extra=[];for(let i=0;i<members.length;i++)for(let j=i+1;j<members.length;j++)extra.push({a:members[i],b:members[j],d:dist(members[i],members[j])});
  for(const e of extra.sort((p,q)=>p.d-q.d)){if(e.d>Math.min(longest*1.3,3500)||edges.some(f=>f.a===e.a&&f.b===e.b||f.a===e.b&&f.b===e.a)||edges.some(f=>crosses(e.a,e.b,f.a,f.b)))continue;
   const angle=(p,q,s)=>{const u=Math.atan2(q.y-p.y,q.x-p.x),v=Math.atan2(s.y-p.y,s.x-p.x);let d=Math.abs(u-v)%(Math.PI*2);return d>Math.PI?Math.PI*2-d:d;};
   if(edges.some(f=>f.a===e.a&&angle(e.a,e.b,f.b)<.7||f.b===e.a&&angle(e.a,e.b,f.a)<.7||f.a===e.b&&angle(e.b,e.a,f.b)<.7||f.b===e.b&&angle(e.b,e.a,f.a)<.7))continue;edges.push(e);}
  for(const e of edges){const [a,b]=dist(e.a,hub[r.id])<dist(e.b,hub[r.id])?[e.a,e.b]:[e.b,e.a];const path=astar(a,b,{pad:1500});if(!path)throw Error('No path inside '+r.name+': '+a.name+' → '+b.name);addRoute('trails','Chemin '+elide(label(b)),a,b,path,spec.corridor.trail);}
  // The camp keeps a single trail, leaving by the gate below the authored map.
  if(r.id===camp.region){const exit={x:camp.x+60.5,y:camp.y+150},to=members.filter(s=>s!==temple).reduce((a,s)=>!a||dist(s,camp)<dist(a,camp)?s:a,null),path=astar(exit,to,{pad:1500});if(!path)throw Error('No trail from the camp');addRoute('trails','Chemin '+elide(label(to)),camp,to,[{x:camp.x,y:camp.y},...path],spec.corridor.trail);}}
 // Each cursed zone keeps a path into it from the closest settlement, as on the macro map.
 const article=name=>{const w=name.split(/[ -]/)[0];return /s$/.test(w)?'des ':/e$/.test(w)?'de la ':'du ';};
 for(const z of world.cursedZones){const zone=z.cells.map(id=>cellById.get(id)).filter(c=>c?.land);if(!zone.length)continue;
  const mid={x:zone.reduce((t,c)=>t+c.x,0)/zone.length,y:zone.reduce((t,c)=>t+c.y,0)/zone.length},from=sites.reduce((a,s)=>!a||dist(s,mid)<dist(a,mid)?s:a,null);
  const into=zone.slice().sort((a,b)=>dist(a,from)-dist(b,from)).map(c=>{try{return nearestValid(c,q=>walkable(q.x,q.y)&&cellAt(q.x,q.y)?.id===c.id,400);}catch{return null;}}).find(Boolean);
  const path=into&&astar(from,{x:Math.round(into.x/G)*G,y:Math.round(into.y/G)*G},{pad:2500});if(!path)throw Error('No path into '+z.name);
  addRoute('trails','Sentier '+article(z.name)+z.name,from,{id:'zone-'+z.i,vertex:null},path,spec.corridor.trail);}
 // Between neighbouring pays: the closest pair of settlements, by road.
 for(const [ra,rb]of landLinks){let best=null;for(const a of sites.filter(s=>s.region===ra))for(const b of sites.filter(s=>s.region===rb)){const d=dist(a,b);if(!best||d<best.d)best={a,b,d};}
  const path=astar(best.a,best.b,{pad:4000})||astar(best.a,best.b,{pad:12000});if(!path)throw Error('No land link '+ra+'-'+rb);
  addRoute('roads','Route '+elide(regionById.get(ra).name)+' à '+regionById.get(rb).name,best.a,best.b,path,spec.corridor.road);}
 // Sea crossings: each port walks to a real ocean shore, then the boat follows open water.
 const seaOk=(x,y)=>isOcean(x,y)&&landDist(x,y)>=40;
 function shore(s,toward){let best=null;const path=astar(s,null,{pad:5000,goal:p=>waterDist(p.x,p.y)<=60&&[[G,0],[-G,0],[0,G],[0,-G],[G,G],[-G,-G],[G,-G],[-G,G]].some(([dx,dy])=>seaOk(p.x+dx*2,p.y+dy*2))});
  if(!path)return null;const end=path.at(-1);let sea=null;for(const [dx,dy]of [[G,0],[-G,0],[0,G],[0,-G],[G,G],[-G,-G],[G,-G],[-G,G]]){const p={x:end.x+dx*2,y:end.y+dy*2};if(seaOk(p.x,p.y)){const d=Math.hypot(p.x-toward.x,p.y-toward.y);if(!sea||d<sea.d)sea={...p,d};}}return {path,sea};}
 for(const [ra,rb]of seaLinks){let best=null;
  for(const a of sites.filter(s=>s.region===ra&&(s.oceanPort||!sites.some(t=>t.region===ra&&t.oceanPort))))for(const b of sites.filter(s=>s.region===rb&&(s.oceanPort||!sites.some(t=>t.region===rb&&t.oceanPort)))){const d=dist(a,b);if(!best||d<best.d)best={a,b,d};}
  const A=shore(best.a,best.b),B=shore(best.b,best.a);if(!A||!B)throw Error('No shore for sea link '+ra+'-'+rb);
  const crossing=astar(A.sea,B.sea,{check:seaOk,pad:6000});if(!crossing)throw Error('No open water for sea link '+ra+'-'+rb);
  const landA=shape(A.path),landB=shape(B.path).reverse(),water=shape(crossing,seaOk);
  const pts=points([...landA,...water,...landB],best.a,best.b);routes.push({id:routes.length,name:'Traversée '+elide(regionById.get(ra).name)+' à '+regionById.get(rb).name,type:'searoutes',from:best.a.id,to:best.b.id,points:pts});
  for(const s of [best.a,best.b])s.oceanPort=true;corridor(points(landA,best.a,null),spec.corridor.access);corridor(points(landB.slice().reverse(),best.b,null),spec.corridor.access);}
 for(const s of sites)if(s.oceanPort&&!routes.some(r=>r.type==='searoutes'&&(r.from===s.id||r.to===s.id)))s.oceanPort=false;
 // Passable shapes: pays with their fringe, ports, wild expanses and the corridors above.
 for(const r of regions){const half=radius(r.id)+spec.fringe;shapes.discs.push([round(hub[r.id].x),round(hub[r.id].y),half,amp(half)]);}
 for(const s of sites)if(s.oceanPort)shapes.discs.push([s.x,s.y,400,amp(400)]);
 for(const w of wilds){shapes.discs.push([w.x,w.y,w.r,amp(w.r)]);const h=hub[w.near];corridor([[h.x,h.y],[w.x,w.y]],spec.corridor.wild);}
 return {width:W,height:H,
  cells:cells.map(c=>[c.id,c.x,c.y,+c.land,c.height,c.biome,c.region,c.feature,c.river,c.poly]),
  sites:sites.map(({legacy,...s})=>({...s,legacy})),story:story.map(s=>({...s})),rivers,routes,
  pays:regions.map(r=>({region:r.id,x:round(hub[r.id].x),y:round(hub[r.id].y),r:round(radius(r.id)),fringe:spec.fringe})),wilds,shapes,
  links:{land:landLinks,sea:seaLinks}};
}
module.exports=compactWorld;
