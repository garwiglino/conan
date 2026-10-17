/* World geometry, navigation and simulation. One ground tile = one metre.
   No DOM dependency. Shared vertices keep displayed roads and routing identical. */
const createWorldAtlas = (raw) => {
 'use strict';
 const VERSION=1,CHUNK=32,PIXELS=16,clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
 const climateProfiles=[
 {temp:15,range:5,wet:.34,fog:.18,family:'coast'},
 {temp:29,range:8,wet:.035,fog:.01,family:'desert'},
 {temp:9,range:15,wet:.08,fog:.025,family:'desert'},
 {temp:25,range:4,wet:.09,monsoon:.55,fog:.06,family:'steppe'},
 {temp:12,range:16,wet:.25,fog:.12,family:'steppe'},
 {temp:26,range:3,wet:.12,monsoon:.62,fog:.18,family:'tropical'},
 {temp:12,range:13,wet:.40,fog:.24,family:'forest'},
 {temp:27,range:2,wet:.62,monsoon:.19,fog:.25,family:'tropical'},
 {temp:11,range:8,wet:.56,fog:.32,family:'forest'},
 {temp:0,range:15,wet:.36,fog:.16,family:'boreal'},
 {temp:-8,range:11,wet:.22,fog:.12,family:'polar'},
 {temp:-22,range:7,wet:.16,fog:.07,family:'polar'},
 {temp:18,range:7,wet:.48,fog:.55,family:'wetland'}
];
 function climateTemperature(clock,biome=6,height=20){const p=climateProfiles[biome]||climateProfiles[6];return p.temp+p.range*Math.sin(clock/1440/96*Math.PI*2)-Math.max(0,height-65)*.18;}
 function airTemperature(clock,biome=6,height=20){return climateTemperature(clock,biome,height)+2*Math.sin((clock/60-8)/24*Math.PI*2);}
 // Continuous thermal cover, independent from a passing precipitation front.
 function snowCover(biome,height=20,clock=480){if(biome===11)return 1;if([0,1,3,5,7,12].includes(biome))return 0;const t=airTemperature(clock,biome,height),v=clamp((6-t)/10,0,1),wet=climateProfiles[biome]?.wet||0;return v*v*(3-2*v)*([2,4].includes(biome)?Math.min(.45,wet*2):1);}
 // 32 native-pixel coverage levels; cache descriptors only for nearby chunks.
 const visualSnowCover=(b,h,t)=>Math.round(snowCover(b,h,t)*32)/32;
 const snowRegions=new Map();
 function chunkSnowKey(cx,cy,clock,propsOnly=false){
  const key=cx+','+cy;let entry=snowRegions.get(key);
  if(!entry){const pairs=new Map();for(let y=-3;y<35;y++)for(let x=-3;x<35;x++){const wx=cx*32+x+.5,wy=cy*32+y+.5,h=cellAt(wx,wy)?.height||20;for(const p of environment(wx,wy).mix)pairs.set(p.biome+':'+h,[p.biome,h]);}entry={pairs:[...pairs.values()]};snowRegions.set(key,entry);while(snowRegions.size>64)snowRegions.delete(snowRegions.keys().next().value);}
  if(entry.clock!==clock){entry.clock=clock;const values=entry.pairs.map(([b,h])=>snowCover(b,h,clock));entry.value=values.map(v=>Math.round(v*32)).join(',');entry.props=values.map(v=>v>.3?1:0).join(',');}return propsOnly?entry.props:entry.value;
 }
 const distance=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
 const random=(x,y,s=1)=>{let n=Math.imul(x|0,374761393)^Math.imul(y|0,668265263)^Math.imul(s,1442695041);n=Math.imul(n^(n>>>13),1274126177);return ((n^(n>>>16))>>>0)/4294967296;};
 const project=(x,y,a,b)=>{const dx=b[0]-a[0],dy=b[1]-a[1],q=dx*dx+dy*dy,t=q?clamp(((x-a[0])*dx+(y-a[1])*dy)/q,0,1):0;return {x:a[0]+dx*t,y:a[1]+dy*t,t,d:Math.hypot(x-a[0]-dx*t,y-a[1]-dy*t)};};
 class Heap{constructor(){this.a=[];}push(value){const a=this.a;let i=a.length;a.push(value);while(i){const p=(i-1)>>1;if(a[p].cost<=value.cost)break;a[i]=a[p];i=p;}a[i]=value;}pop(){const a=this.a,r=a[0],v=a.pop();if(a.length){let i=0;while(i*2+1<a.length){let c=i*2+1;if(c+1<a.length&&a[c+1].cost<a[c].cost)c++;if(a[c].cost>=v.cost)break;a[i]=a[c];i=c;}a[i]=v;}return r;}get size(){return this.a.length;}}
 class Index{
  constructor(size){this.size=size;this.cells=new Map();}
  put(item,x0,y0,x1,y1){for(let y=Math.floor(y0/this.size);y<=Math.floor(y1/this.size);y++)for(let x=Math.floor(x0/this.size);x<=Math.floor(x1/this.size);x++){const k=x+','+y;if(!this.cells.has(k))this.cells.set(k,[]);this.cells.get(k).push(item);}}
  near(x,y){return this.cells.get(Math.floor(x/this.size)+','+Math.floor(y/this.size))||[];}
 }
 const cells=raw.cells.map(c=>({id:c[0],x:c[1],y:c[2],land:!!c[3],height:c[4],biome:c[5],region:c[6],feature:c[7],river:c[8],polygon:c[9]}));
 const layout=raw.layout||null,scale=layout?.scale||1,cellById=new Map(cells.map(c=>[c.id,c])),cellIndex=new Index(16000/scale);
 for(const c of cells){let x0=Infinity,y0=Infinity,x1=-Infinity,y1=-Infinity;for(let i=0;i<c.polygon.length;i+=2){x0=Math.min(x0,c.polygon[i]);x1=Math.max(x1,c.polygon[i]);y0=Math.min(y0,c.polygon[i+1]);y1=Math.max(y1,c.polygon[i+1]);}cellIndex.put(c,x0,y0,x1,y1);}
 function contains(poly,x,y){let inside=false;for(let i=0,j=poly.length-2;i<poly.length;j=i,i+=2){const a=poly[i],b=poly[i+1],c=poly[j],d=poly[j+1];if(((b>y)!==(d>y))&&x<(c-a)*(y-b)/(d-b)+a)inside=!inside;}return inside;}
 function cellAt(x,y){if(x<0||y<0||x>=raw.width||y>=raw.height)return null;const list=cellIndex.near(x,y);return list.find(c=>contains(c.polygon,x,y))||list.reduce((a,c)=>!a||Math.hypot(c.x-x,c.y-y)<Math.hypot(a.x-x,a.y-y)?c:a,null);}
 // Route vertices are shared ids; a compact layout gives every place its own vertex.
 const vertexOf=s=>'v'+(s.vertex??s.cell);
 const geole=raw.story.find(s=>s.name.startsWith('Geôle')),anchor=raw.routes.flatMap(r=>r.points).find(p=>p[2]===(geole.vertex??geole.cell))||[geole.x,geole.y,geole.cell];
 const origin={x:anchor[0]-23.5,y:anchor[1]-55.5};
 const toWorld=(x,y)=>({x:x/16+origin.x,y:y/16+origin.y});
 const toGame=(x,y)=>({x:(x-origin.x)*16,y:(y-origin.y)*16});
 const core=(x,y)=>x>=origin.x&&y>=origin.y&&x<origin.x+72&&y<origin.y+64;
 const regions=new Map(raw.regions.map(r=>[r.id,r]));
 const nodes=raw.sites.map(s=>({...s,id:'town-'+s.id,vertex:vertexOf(s),radius:s.regionalCentre?65:38,kind:s.oceanPort?'port':s.regionalCentre?'town':'relay',rest:true}));
 nodes.push({id:'camp',name:'Campement des Exilés',x:anchor[0],y:anchor[1],cell:geole.cell,vertex:vertexOf(geole),radius:10,kind:'camp',region:cellById.get(geole.cell).region,rest:true});
 for(const s of raw.story)if(s!==geole&&!nodes.some(n=>n.vertex===vertexOf(s)))nodes.push({id:'story-'+s.i,name:s.name,x:s.x,y:s.y,cell:s.cell,vertex:vertexOf(s),radius:18,kind:'ruin',region:cellById.get(s.cell).region,rest:false});
 const byId=Object.fromEntries(nodes.map(n=>[n.id,n]));
 const home=nodes.find(n=>n.name==='Clairfoyer'),refuge=nodes.find(n=>n.name==='Refuge des Veilleurs');
 if(refuge){refuge.kind='refuge';refuge.rest=true;}
 let extraVertex=0;
 const roads=raw.routes.map(r=>({id:'road-'+r.id,name:r.name,type:r.type,width:r.type==='roads'?4.6:r.type==='trails'?2.8:0,modes:r.type==='searoutes'?['boat']:r.type==='roads'?['foot','horse','cart']:['foot','horse'],danger:r.type==='roads'?1:r.type==='searoutes'?2:3,interval:r.type==='searoutes'?180:0,pts:r.points.map(p=>[p[0],p[1],'v'+p[2]])}));
 // Redirect the macro spur through the preserved southern gate of the original map.
 for(const r of roads){for(const end of [0,r.pts.length-1]){if(r.pts[end][2]!==vertexOf(geole))continue;const other=r.pts[end===0?1:end-1],right=other[0]>=origin.x+36,side=origin.x+(right?84:-12),ys=origin.y+74;let via=[[anchor[0],ys],[side,ys]];if(other[1]<origin.y)via.push([side,origin.y-12]);via=via.map(p=>[...p,'gate-'+extraVertex++]);if(end===0)r.pts.splice(1,0,...via);else r.pts.splice(end,0,...via.reverse());}}
 const prison={x:origin.x-25,y:origin.y+80,w:18,h:15,door:{x:origin.x-7,y:origin.y+90}};
 // Marine routes begin at an actual coastline. The inland approach stays a road.
 for(const r of roads.filter(r=>r.type==='searoutes'))for(const reverse of [false,true]){
  const pts=reverse?r.pts.slice().reverse():r.pts.slice(),town=nodes.find(n=>n.vertex===pts[0][2]);if(!town)continue;
  let crossing=null;
  for(let i=1;i<pts.length&&!crossing;i++){const a=pts[i-1],b=pts[i],len=distance(a,b),steps=Math.ceil(len/50);for(let j=1;j<=steps;j++){const t=j/steps,x=a[0]+(b[0]-a[0])*t,y=a[1]+(b[1]-a[1])*t;if(!cellAt(x,y)?.land){let lo=(j-1)/steps,hi=t;for(let k=0;k<22;k++){const mid=(lo+hi)/2;if(cellAt(a[0]+(b[0]-a[0])*mid,a[1]+(b[1]-a[1])*mid)?.land)lo=mid;else hi=mid;}const ux=(b[0]-a[0])/len,uy=(b[1]-a[1])/len;crossing={i,x:a[0]+(b[0]-a[0])*lo-ux*2,y:a[1]+(b[1]-a[1])*lo-uy*2,ux,uy};break;}}}
  if(!crossing)continue;const q=crossing,id='dock-'+r.id+'-'+(reverse?'b':'a'),point=[q.x,q.y,id],dock={id,name:'Embarcadère de '+town.name,x:q.x,y:q.y,cell:town.cell,region:town.region,vertex:id,radius:5,kind:'dock',rest:true,town:town.id,boat:{x:q.x+q.ux*4,y:q.y+q.uy*4},shore:{x:q.ux,y:q.uy}};
  nodes.push(dock);byId[id]=dock;
  roads.push({id:'access-'+id,name:'Chemin du port de '+town.name,type:'roads',width:4.6,modes:['foot','horse','cart'],danger:1,interval:0,pts:[...pts.slice(0,q.i),point]});
  const sea=[point,...pts.slice(q.i)];r.pts=reverse?sea.reverse():sea;
 }
 const roadCells=r=>r.cells||(r.cells=r.pts.map(p=>cellAt(p[0],p[1])).filter(Boolean));
 for(const r of roads){const cs=roadCells(r);if(r.type==='trails'&&r.id!=='prison-road'&&cs.every(c=>c.height<58&&c.biome!==12))r.modes.push('cart');}
 const roadById=Object.fromEntries(roads.map(r=>[r.id,r])),segments=[],roadIndex=new Index(2048),riverIndex=new Index(2048),vertices=new Map(),adj=new Map();
 const curseCells=new Set(raw.zones.flatMap(z=>z.cells));
 function addEdge(a,b,r,len){const key=[a[2],b[2]].sort().join('|');let e=edgeById.get(key);if(!e){e={id:key,a:a[2],b:b[2],length:len,roads:[],modes:[],danger:1};edgeById.set(key,e);for(const [u,v]of [[a[2],b[2]],[b[2],a[2]]]){if(!adj.has(u))adj.set(u,[]);adj.get(u).push({to:v,edge:e});}}e.roads.push(r.id);e.modes=[...new Set([...e.modes,...r.modes])];e.danger=Math.max(e.danger,r.danger);}
 const edgeById=new Map();
 for(const r of roads){r.cumulative=[0];r.length=0;r.segments=[];for(const p of r.pts)vertices.set(p[2],p);for(let i=1;i<r.pts.length;i++){const a=r.pts[i-1],b=r.pts[i],len=distance(a,b),s={r,a,b,length:len,start:r.length,i};r.length+=len;r.cumulative.push(r.length);r.segments.push(s);segments.push(s);roadIndex.put(s,Math.min(a[0],b[0])-25,Math.min(a[1],b[1])-25,Math.max(a[0],b[0])+25,Math.max(a[1],b[1])+25);addEdge(a,b,r,len);}}
 // Evaluate only the cells traversed by each graph edge, never the whole road.
 for(const e of edgeById.values()){
  const a=vertices.get(e.a),b=vertices.get(e.b),base=Math.min(...e.roads.map(id=>roadById[id].danger)),count=Math.max(1,Math.min(24,Math.ceil(e.length/250))),values=[],reasons=new Set();
  e.x=(a[0]+b[0])/2;e.y=(a[1]+b[1])/2;
  for(let i=0;i<count;i++){const u=(i+.5)/count,c=cellAt(a[0]+(b[0]-a[0])*u,a[1]+(b[1]-a[1])*u);let v=base;
   if(c?.land&&c.height>60){v+=1;reasons.add('Relief montagneux');}
   if(c&&curseCells.has(c.id)){v+=2;reasons.add('Terres maudites');}
   values.push(clamp(v,0,5));
  }e.danger=values.reduce((a,b)=>a+b,0)/values.length;e.peakDanger=Math.max(...values);e.terrainReasons=[...reasons];
 }
 // NPC road summaries remain averages; local encounters use the actual edge.
 for(const r of roads)r.danger=r.segments.reduce((sum,s)=>sum+edgeById.get([s.a[2],s.b[2]].sort().join('|')).danger*s.length,0)/(r.length||1);
 function edgeRisk(edge,clock=480,state=null){
  const status=state?.edgeStatus(edge,clock)||{closed:false,risk:0,events:[]},sky=state?.weatherAt?.(clock,edge.x,edge.y),sea=edge.modes.includes('boat')&&!edge.modes.includes('horse');
  const weather=sky?(sea?Math.max(sky.storm||0,(sky.wind||0)*.6)*(sky.rain>.5?1.5:1):(sky.blizzard||0)+(sky.rain||0)*(edge.terrainReasons.includes('Relief montagneux')?.5:.15)):0;
  const delta=status.risk+weather;return {value:clamp(edge.danger+delta,0,5),peak:clamp(edge.peakDanger+delta,0,5),closed:status.closed,reasons:[...edge.terrainReasons,...(weather>.15?['Intempéries locales']:[]),...(status.events||[]).filter(e=>EVENT_TYPES[e.type].risk).map(e=>EVENT_TYPES[e.type].name)]};
 }
 for(const r of raw.rivers)for(let i=1;i<r.points.length;i++){const a=r.points[i-1],b=r.points[i],s={r,a,b};riverIndex.put(s,Math.min(a[0],b[0])-r.width,Math.min(a[1],b[1])-r.width,Math.max(a[0],b[0])+r.width,Math.max(a[1],b[1])+r.width);}
 for(const n of nodes){const v=vertices.get(n.vertex);if(v){n.x=v[0];n.y=v[1];}}
 const siteIndex=new Index(2048);for(const n of nodes)siteIndex.put(n,n.x-150,n.y-150,n.x+150,n.y+150);
 function siteAt(x,y,margin=0){return siteIndex.near(x,y).filter(n=>Math.hypot(n.x-x,n.y-y)<=n.radius+margin).sort((a,b)=>Math.hypot(a.x-x,a.y-y)-Math.hypot(b.x-x,b.y-y))[0]||null;}
 function nearestSite(x,y){return nodes.reduce((a,n)=>!a||Math.hypot(n.x-x,n.y-y)<Math.hypot(a.x-x,a.y-y)?n:a,null);}
 function closestRoad(x,y,land=true){let best=null;for(const s of roadIndex.near(x,y)){if(land&&s.r.type==='searoutes')continue;const p=project(x,y,s.a,s.b);if(!best||p.d<best.d-0.01||Math.abs(p.d-best.d)<.01&&s.r.id<best.road.id)best={...p,road:s.r,segment:s,along:s.start+p.t*s.length};}return best;}
 function atDistance(r,d){d=clamp(d,0,r.length);let i=1;while(i<r.cumulative.length-1&&r.cumulative[i]<d)i++;const a=r.pts[i-1],b=r.pts[i],t=(d-r.cumulative[i-1])/(r.cumulative[i]-r.cumulative[i-1]||1);return {x:a[0]+(b[0]-a[0])*t,y:a[1]+(b[1]-a[1])*t};}
 function riverAt(x,y){let best=null;for(const s of riverIndex.near(x,y)){const p=project(x,y,s.a,s.b);if(p.d<s.r.width/2&&(!best||p.d<best.d))best={...p,river:s.r};}return best;}
 function coastDistance(x,y,max=12){const c=cellAt(x,y);if(!c?.land)return 0;let best=Infinity;for(let i=0;i<c.polygon.length;i+=2){const j=(i+2)%c.polygon.length,a=[c.polygon[i],c.polygon[i+1]],b=[c.polygon[j],c.polygon[j+1]],p=project(x,y,a,b);if(p.d>max||p.d>=best)continue;const len=distance(a,b)||1,nx=-(b[1]-a[1])/len,ny=(b[0]-a[0])/len;if([1,-1].some(sign=>cellAt(p.x+nx*sign*2,p.y+ny*sign*2)?.land===false))best=p.d;}return best;}
 // Natural borders of a compact layout: land stays open only in the pays, their fringe,
 // the wild expanses and the corridors of roads; the edge wanders with smooth noise.
 const shapeIndex=new Index(1024);
 if(layout){for(const [x,y,h,a]of layout.shapes.discs)shapeIndex.put({x,y,h,a},x-h-a,y-h-a,x+h+a,y+h+a);for(const [ax,ay,bx,by,h,a]of layout.shapes.segs)shapeIndex.put({p:[ax,ay],q:[bx,by],h,a},Math.min(ax,bx)-h-a,Math.min(ay,by)-h-a,Math.max(ax,bx)+h+a,Math.max(ay,by)+h+a);}
 function valueNoise(x,y,size,seed){const u=x/size,v=y/size,i=Math.floor(u),j=Math.floor(v),fx=u-i,fy=v-j,sx=fx*fx*(3-2*fx),sy=fy*fy*(3-2*fy),a=random(i,j,seed),b=random(i+1,j,seed),c=random(i,j+1,seed),d=random(i+1,j+1,seed);return (a+(b-a)*sx+(c-a)*sy+(a-b-c+d)*sx*sy)*2-1;}
 function passable(x,y){if(!layout)return true;const n=valueNoise(x,y,layout.border.wavelength,71)*.75+valueNoise(x,y,layout.border.wavelength/5,72)*.25;
  for(const s of shapeIndex.near(x,y)){const d=s.p?project(x,y,s.p,s.q).d:Math.hypot(x-s.x,y-s.y);if(d<=s.h+s.a*n)return true;}return false;}
 function terrain(x,y){const c=cellAt(x+.5,y+.5);if(!c)return 8;const near=closestRoad(x+.5,y+.5),on=near&&near.d<=near.road.width/2+.2;
  if(!c.land)return 3;
  if(!on&&!passable(x+.5,y+.5))return 8;
  if(riverAt(x+.5,y+.5))return on?5:3;
  if(on)return 1;
  const site=siteAt(x+.5,y+.5);if(site)return site.kind==='town'||site.kind==='ruin'?2:0;
  const noise=Math.sin(x/94)*Math.cos(y/113)+Math.sin((x+y)/39)*.2;
  if((c.height>58&&noise>1.1)||([1,2].includes(c.biome)&&c.height>30&&noise>1.08))return 8;
  // Woodland clumps with clearings. The cleared road corridor takes priority.
  const wooded=[5,6,7,8,9,12].includes(c.biome),grove=(Math.sin(x/8)*Math.cos(y/11)+1)/2;
  const density=wooded?.018+.055*grove*grove:c.biome===11?.012:.016;
  if((!near||near.d>near.road.width/2+1)&&random(x,y,39)<density)return 4;
  return 0;
 }
 const BLEND=layout?.blend||800;
 function environment(x,y){const c=cellAt(x,y);if(!c)return {biome:0,mix:[]};let nearest=null;for(let i=0;i<c.polygon.length;i+=2){const j=(i+2)%c.polygon.length,p=project(x,y,[c.polygon[i],c.polygon[i+1]],[c.polygon[j],c.polygon[j+1]]);if(!nearest||p.d<nearest.d)nearest={...p,dx:c.polygon[j]-c.polygon[i],dy:c.polygon[j+1]-c.polygon[i+1]};}const own={biome:c.biome,cursed:curseCells.has(c.id),weight:1};if(nearest&&nearest.d<BLEND){const len=Math.hypot(nearest.dx,nearest.dy)||1,nx=-nearest.dy/len,ny=nearest.dx/len;const choices=[cellAt(nearest.x+nx*2,nearest.y+ny*2),cellAt(nearest.x-nx*2,nearest.y-ny*2)],other=choices.find(n=>n&&n.id!==c.id&&n.land);if(other){const weight=.5*(1-nearest.d/BLEND);own.weight=1-weight;return {biome:c.biome,mix:[own,{biome:other.biome,cursed:curseCells.has(other.id),weight}]};}}return {biome:c.biome,mix:[own]};}
 function propAt(x,y,t,clock=480){const c=cellAt(x+.5,y+.5);if(!c)return null;let kind;
  const blend=environment(x+.5,y+.5),sample=blend.mix.length>1&&random(x,y,49)<blend.mix[1].weight?blend.mix[1]:blend.mix[0],biome=sample?.biome??c.biome,snow=snowCover(biome,c.height,clock)>.3;
  const r=random(x,y,40),v=Math.floor(random(x,y,44)*3);
  if(t===4)kind=sample?.cursed?(r<.65?'world_cursed':'world_dead_cursed'):biome===11?'world_boulder_1':biome===10?(snow?'world_boulder_1':'world_boulder_0'):biome===9?(r<.8?(snow?'world_pine_1':'world_pine_0'):(snow?'world_boulder_1':'world_boulder_2')):[1,2].includes(biome)?['rock_a','rock_b','rock_e','deadtree','shrub'][Math.floor(r*5)]:biome===8?(snow?'world_oak_winter':r<.55?'world_cypress':'world_oak_'+v):[5,7].includes(biome)?(r<.3?'palm':r<.85?'world_jungle':'world_boulder_2'):biome===12?(r<.7?'world_cypress':'world_boulder_2'):[3,4].includes(biome)?(r<.4?'shrub':'world_boulder_0'):(r<.86?(snow?'world_oak_winter':'world_oak_'+v):(snow?'world_boulder_1':'world_boulder_2'));
  else if(t===0&&random(x,y,41)<.06){const plants=sample?.cursed?['bones','world_gravel']:biome===11?['world_gravel']:biome===10?(snow?['world_frostgrass','world_gravel']:['world_gravel','scrub']):biome===9?(snow?['world_frostgrass','world_gravel']:['world_mushrooms','world_fern']):snow?['world_frostgrass','world_gravel']:[1,2,3,4].includes(biome)?['scrub','pebbles']:[5,7].includes(biome)?['world_fern','world_fern','world_flowers']:[8,12].includes(biome)?['world_reeds','world_fern','world_mushrooms']:['world_flowers','world_mushrooms','world_fern'];kind=plants[Math.floor(random(x,y,42)*plants.length)];}
  if(!kind)return null;const q=toGame(x+.5,y+.65);return {kind,...q,world:true};
 }
 // Fares keep the economy of the macro map: a compact kilometre stands for `scale` of them.
 const modes={foot:{name:'À pied',metresPerMinute:80,costPerKm:0,verb:'Marche'},horse:{name:'À cheval',metresPerMinute:133.333,costPerKm:.04*scale,verb:'Chevauche'},cart:{name:'En charrette',metresPerMinute:100,costPerKm:.025*scale,verb:'Voyage en charrette'},boat:{name:'En embarcation',metresPerMinute:166.667,costPerKm:.05*scale,verb:'Navigue'}};
 function findPath(from,to,{mode='horse',allowBoat=true,preference='fast',clock=480,state=null,knownRoutes=null}={}){
  const start=byId[from]?.vertex||from,goal=byId[to]?.vertex||to;if(!adj.has(start)||!adj.has(goal)||!modes[mode]||mode==='boat')return null;
  const q=new Heap(),best=new Map([[start,0]]),prev=new Map();q.push({id:start,cost:0});
  while(q.size){const u=q.pop();if(u.cost!==best.get(u.id))continue;if(u.id===goal)break;
   for(const {to:v,edge:e}of adj.get(u.id)||[]){const status=state?.edgeStatus(e,clock)||{closed:false,risk:0};if(status.closed)continue;
    const m=e.modes.includes(mode)?mode:allowBoat&&e.modes.includes('boat')?'boat':null;if(!m)continue;
    const choices=e.roads.map(id=>roadById[id]).filter(r=>r.modes.includes(m)&&(!knownRoutes||knownRoutes.has(r.id)));if(!choices.length)continue;
    const r=choices.sort((a,b)=>(a.type==='roads'?0:1)-(b.type==='roads'?0:1)||a.id.localeCompare(b.id))[0];
    const cost=u.cost+e.length/modes[m].metresPerMinute+(preference==='safe'?edgeRisk(e,clock,state).value*e.length/160:0);
    if(cost<(best.get(v)??Infinity)){best.set(v,cost);prev.set(v,{from:u.id,to:v,edge:e.id,road:r.id,mode:m,length:e.length});q.push({id:v,cost});}
   }
  }
  if(!best.has(goal))return null;const result=[];let v=goal;while(v!==start){const e=prev.get(v);if(!e)return null;result.unshift(e);v=e.from;}return result;
 }
 function routePlan(from,to,options={}){const path=findPath(from,to,options);if(!path||!path.length)return null;const clock=options.clock??480,stages=[],dangerLegs=path.map(l=>{const e=edgeById.get(l.edge),risk=edgeRisk(e,clock,options.state);return {...risk,road:l.road,length:l.length};});let time=clock,effort=0,distanceTotal=0,cost=0,lastMode=null,lastRoad=null;
  for(const leg of path){const r=roadById[leg.road],a=vertices.get(leg.from),b=vertices.get(leg.to),rate=modes[leg.mode].metresPerMinute;
   if(leg.mode==='boat'&&lastMode!=='boat'){const wait=(r.interval-time%r.interval)%r.interval;if(wait){stages.push({kind:'wait',minutes:wait,x:a[0],y:a[1],label:'Attend l’embarquement à '+nearestSite(a[0],a[1]).name});time+=wait;}}
   const delay=options.state?.edgeStatus(edgeById.get(leg.edge),time).delay||0;if(delay&&lastRoad!==r.id){stages.push({kind:'wait',minutes:delay,x:a[0],y:a[1],label:'Départ retardé sur '+r.name});time+=delay;}
   let left=leg.length,done=0;
   while(left>1e-7){if(leg.mode!=='boat'&&effort>=480-1e-7){const x=a[0]+(b[0]-a[0])*done/leg.length,y=a[1]+(b[1]-a[1])*done/leg.length,n=siteAt(x,y,100),minutes=600;stages.push({kind:'rest',minutes,x,y,label:n?'Se repose à '+n.name:'Bivouaque sur '+r.name});time+=minutes;effort=0;}
    const length=Math.min(left,leg.mode==='boat'?rate*180:Math.max(1,(480-effort)*rate)),minutes=length/rate,u=done/leg.length,v=(done+length)/leg.length;
    stages.push({kind:'move',minutes,road:r.id,edge:leg.edge,mode:leg.mode,length,from:[a[0]+(b[0]-a[0])*u,a[1]+(b[1]-a[1])*u],to:[a[0]+(b[0]-a[0])*v,a[1]+(b[1]-a[1])*v],label:modes[leg.mode].verb+' via '+r.name});time+=minutes;effort+=leg.mode==='boat'?0:minutes;done+=length;left-=length;
   }
   distanceTotal+=leg.length;cost+=leg.length/1000*modes[leg.mode].costPerKm;lastMode=leg.mode;lastRoad=r.id;
  }
  return {from,to,mode:options.mode||'horse',preference:options.preference||'fast',allowBoat:options.allowBoat!==false,stages,distance:distanceTotal,minutes:time-clock,cost:Math.ceil(cost),boat:path.some(l=>l.mode==='boat'),danger:clamp(dangerLegs.reduce((sum,l)=>sum+l.value*l.length,0)/distanceTotal,0,Math.max(...dangerLegs.map(l=>l.peak))),maxDanger:Math.max(...dangerLegs.map(l=>l.peak)),dangerLegs,dangerAt:clock,screenSeconds:clamp(6+Math.log1p(distanceTotal/5000)*2.5,6,24),plannedAt:clock};
 }
 const crossings=[];
 function intersection(a,b,c,d){const ux=b[0]-a[0],uy=b[1]-a[1],vx=d[0]-c[0],vy=d[1]-c[1],det=ux*vy-uy*vx;if(Math.abs(det)<1e-7)return null;const t=((c[0]-a[0])*vy-(c[1]-a[1])*vx)/det,u=((c[0]-a[0])*uy-(c[1]-a[1])*ux)/det;return t>=0&&t<=1&&u>=0&&u<=1?{x:a[0]+t*ux,y:a[1]+t*uy}:null;}
 for(const s of segments){if(s.r.type==='searoutes')continue;const seen=new Set();for(let d=0;d<=s.length;d+=1024){const f=d/s.length,x=s.a[0]+(s.b[0]-s.a[0])*f,y=s.a[1]+(s.b[1]-s.a[1])*f;for(const r of riverIndex.near(x,y)){if(seen.has(r))continue;seen.add(r);const p=intersection(s.a,s.b,r.a,r.b);if(p&&cellAt(p.x,p.y)?.land)crossings.push({...p,id:'bridge-'+crossings.length,road:s.r.id,river:r.r.id,kind:'bridge',width:s.r.width});}}}
 const EVENT_TYPES={
  flood:{name:'Crue',category:'Terrain',closed:true},landslide:{name:'Éboulement',category:'Terrain',closed:true},avalanche:{name:'Avalanche',category:'Terrain',closed:true},fire:{name:'Incendie',category:'Terrain',closed:true},
  bridge:{name:'Pont endommagé',category:'Routes',closed:true},repair:{name:'Passage rouvert',category:'Routes'},bandits:{name:'Brigands signalés',category:'Sécurité',risk:3},patrol:{name:'Patrouille renforcée',category:'Sécurité',risk:-1},
  siege:{name:'Siège',category:'Conflits',closed:true},occupation:{name:'Occupation',category:'Conflits',risk:2},truce:{name:'Trêve',category:'Conflits'},border:{name:'Frontière fermée',category:'Conflits',closed:true},
  shortage:{name:'Pénurie',category:'Commerce',price:1.5},caravan:{name:'Caravane arrivée',category:'Commerce'},market:{name:'Jour de marché',category:'Commerce',price:.8},festival:{name:'Fête locale',category:'Vie locale'},missing:{name:'Disparition',category:'Vie locale'},funeral:{name:'Funérailles',category:'Vie locale'},ruler:{name:'Nouveau dirigeant',category:'Vie locale'},
  storm:{name:'Navigation suspendue',category:'Transports',closed:true},delay:{name:'Départ retardé',category:'Transports',delay:90},relay:{name:'Relais fermé',category:'Transports',closed:true},
  curse:{name:'Manifestation maudite',category:'Malédictions',risk:3},purified:{name:'Lieu purifié',category:'Malédictions'},liberated:{name:'Captifs libérés',category:'Actions'},victory:{name:'Menace vaincue',category:'Actions'},theft:{name:'Vol signalé',category:'Actions'},rescued:{name:'Secours apportés',category:'Actions'},discovery:{name:'Passage découvert',category:'Découvertes'},
  injury:{name:'Blessure',category:'Compagnons',private:true},exhaustion:{name:'Épuisement',category:'Compagnons',private:true},trust:{name:'Confiance',category:'Compagnons',private:true},
  rain:{name:'Pluie soutenue',category:'Météo'},snow:{name:'Chutes de neige',category:'Météo'},fog:{name:'Brouillard',category:'Météo'},drought:{name:'Sécheresse',category:'Météo'}
 };
 // Declarative incident policy shared by travel, local encounters and civilians.
 Object.assign(EVENT_TYPES.bandits,{group:3,enemy:'cultist',evacuate:true});
 Object.assign(EVENT_TYPES.occupation,{group:3,enemy:'cultist',evacuate:true});
 Object.assign(EVENT_TYPES.siege,{group:3,enemy:'cultist',risk:3,evacuate:true});
 Object.assign(EVENT_TYPES.curse,{group:2,enemy:'skeleton',evacuate:true});
 Object.assign(EVENT_TYPES.patrol,{group:2,guard:true});
 Object.assign(EVENT_TYPES.purified,{risk:-2});
 Object.assign(EVENT_TYPES.victory,{risk:-1});
 for(const type of ['flood','landslide','avalanche','fire'])Object.assign(EVENT_TYPES[type],{hazard:2,evacuate:true});
 for(const type of ['bridge','border','storm','relay'])Object.assign(EVENT_TYPES[type],{hazard:1});
 const eventTarget=id=>byId[id]||roadById[id];
 class WorldState{
  constructor(saved={}){this.schema=VERSION;this.campaign=typeof saved.campaign==='string'?saved.campaign:'world-'+Date.now().toString(36)+'-'+Math.floor(Math.random()*1e6).toString(36);this.revision=Number.isInteger(saved.revision)?Math.max(0,saved.revision):0;this.clock=Number.isFinite(saved.clock)?saved.clock:480;
   this.events=Array.isArray(saved.events)?saved.events.filter(e=>e&&EVENT_TYPES[e.type]&&typeof e.id==='string'&&eventTarget(e.target)&&Number.isFinite(e.at)&&Number.isFinite(e.x)&&Number.isFinite(e.y)&&(e.end===null||Number.isFinite(e.end))&&(e.resolved===null||Number.isFinite(e.resolved))).slice(-512).map(e=>({...e,witnesses:Array.isArray(e.witnesses)?e.witnesses.filter(w=>typeof w==='string').slice(0,20):[],title:EVENT_TYPES[e.type].name,source:typeof e.source==='string'?e.source:'Voyageurs',detail:typeof e.detail==='string'?e.detail:''})):[];
   this.nextId=Math.max(Number.isInteger(saved.nextId)?saved.nextId:1,...this.events.map(e=>(Number(e.serial)||0)+1));this.lastHour=Number.isInteger(saved.lastHour)?saved.lastHour:Math.floor(this.clock/60);this.knowledge={};this.journal=Array.isArray(saved.journal)?saved.journal.filter(j=>j&&typeof j.text==='string').slice(-120):[];this.newsDistances=new Map();
   for(const [id,book]of Object.entries(saved.knowledge||{}).slice(0,180)){if(!book||typeof book!=='object')continue;this.knowledge[id]={};for(const [key,k]of Object.entries(book).slice(-512))if(this.events.some(e=>e.id===key)&&k&&Number.isFinite(k.heard))this.knowledge[id][key]={...k,at:Number.isFinite(k.at)?k.at:k.heard,resolved:Number.isFinite(k.resolved)?k.resolved:null,source:typeof k.source==='string'?k.source:'Voyageurs'};}
  }
  add(type,target,at,duration=0,extra={}){if(!EVENT_TYPES[type]||!eventTarget(target)||!Number.isFinite(at))return null;
   const settles={truce:['siege','occupation'],purified:['curse'],victory:['bandits','occupation','siege'],repair:['bridge','flood','landslide','avalanche','fire']};if(settles[type]&&!extra.expiry)for(const e of this.active(at))if(e.target===target&&settles[type].includes(e.type))this.resolve(e.id,at);
   const duplicate=this.active(at).find(e=>e.type===type&&e.target===target);if(duplicate&&!EVENT_TYPES[type].private)return duplicate;const route=roadById[target],site=byId[target],p=extra.position|| (route?atDistance(route,route.length*.5):site),serial=this.nextId++;
   const e={id:'event-'+serial,serial,type,target,at,end:duration>0?at+duration:null,resolved:null,x:p.x,y:p.y,title:EVENT_TYPES[type].name,source:extra.source||'Voyageurs',detail:extra.detail||'',witnesses:Array.isArray(extra.witnesses)?extra.witnesses.slice(0,20):[]};this.events.push(e);if(this.events.length>512){const gone=this.events.shift();for(const b of Object.values(this.knowledge))delete b[gone.id];this.newsDistances.delete(gone.id);}this.revision++;return e;
  }
  resolve(id,at){const e=this.events.find(e=>e.id===id);if(e&&e.resolved===null&&Number.isFinite(at)&&at>=e.at){e.resolved=at;this.revision++;return true;}return false;}
  active(clock=this.clock){return this.events.filter(e=>e.at<=clock&&(e.resolved===null||e.resolved>clock)&&(e.end===null||e.end>clock));}
  routeStatus(id,clock=this.clock){const road=roadById[id];if(!road)return {closed:true,risk:0,delay:0,events:[]};const es=this.active(clock).filter(e=>e.target===id||byId[e.target]&&road.pts.some(p=>p[2]===byId[e.target].vertex));return {closed:es.some(e=>EVENT_TYPES[e.type].closed),risk:es.reduce((n,e)=>n+(EVENT_TYPES[e.type].risk||0),0),delay:es.reduce((n,e)=>n+(EVENT_TYPES[e.type].delay||0),0),events:es};}
  edgeStatus(edge,clock=this.clock){const es=this.active(clock).filter(e=>edge.roads.includes(e.target)||byId[e.target]&&[edge.a,edge.b].includes(byId[e.target].vertex));return {closed:es.some(e=>EVENT_TYPES[e.type].closed),risk:es.reduce((n,e)=>n+(EVENT_TYPES[e.type].risk||0),0),delay:es.reduce((n,e)=>n+(EVENT_TYPES[e.type].delay||0),0),events:es};}
  price(site,clock=this.clock){return this.active(clock).filter(e=>e.target===site).reduce((n,e)=>n*(EVENT_TYPES[e.type].price||1),1);}
  advance(clock,weather=()=>({})){if(!Number.isFinite(clock)||clock<this.clock)return;const hour=Math.floor(clock/60),begin=Math.max(this.lastHour+1,hour-24*90);for(let h=begin;h<=hour;h++){
    const day=Math.floor(h/24),phase=h%24,at=h*60,pick=(list,s)=>list[Math.floor(random(day,s,91)*list.length)],town=pick(nodes.filter(n=>n.rest&&n.id!=='camp'),2),route=pick(roads.filter(r=>r.type!=='searoutes'&&r.id!=='prison-road'),3),sea=pick(roads.filter(r=>r.type==='searoutes'),4),sky=weather(at,town.x,town.y)||{};
    if(phase===9&&day%3===0)this.add('market',town.id,at,480,{source:'Marchands de '+town.name});
    if(phase===14&&day%2===1)this.add('bandits',route.id,at,1440,{source:'Caravaniers'});
    if(phase===7&&day%3===1)this.add('patrol',route.id,at,1440,{source:'Garde des relais'});
    if(phase===12&&crossings.length){const b=pick(crossings,5);if((weather(at,b.x,b.y)||{}).rain>.7)this.add('flood',b.road,at,720,{position:b,source:'Bateliers'});}
    if(phase===18&&(weather(at,sea.pts[0][0],sea.pts[0][1])||{}).storm>.3)this.add('storm',sea.id,at,180,{source:'Capitainerie'});
    if(phase===10&&day%5===3){const mountain=roads.filter(r=>roadCells(r).some(c=>c.height>58));if(mountain.length)this.add('landslide',pick(mountain,6).id,at,1440,{source:'Éclaireurs'});}
    if(phase===15&&day%6===4)this.add('shortage',town.id,at,2880,{source:'Intendant de '+town.name});
    if(phase===16&&day%7===2)this.add('caravan',town.id,at,720,{source:'Maître du relais'});
    if(phase===20&&day%4===2){const cursed=roads.filter(r=>roadCells(r).some(c=>curseCells.has(c.id)));if(cursed.length)this.add('curse',pick(cursed,7).id,at,720,{source:'Veilleurs'});}
    const region=regions.get(town.region),territory=region?.territory,climateRoutes=biomes=>roads.filter(r=>r.type!=='searoutes'&&roadCells(r).some(c=>biomes.includes(c.biome)));
    if(phase===6&&Math.max(sky.rain||0,sky.snow||0)>.35)this.add((sky.snow||0)>(sky.rain||0)?'snow':'rain',town.id,at,360,{source:'Habitants de '+town.name});
    if(phase===5&&['Varan','Tagon'].includes(territory)&&day%3===0)this.add('fog',town.id,at,180,{source:'Bateliers'});
    if(phase===13&&day%17===7){const rs=climateRoutes([1,2]);if(rs.length)this.add('drought',pick(rs,11).id,at,4320,{source:'Nomades'});}
    if(phase===11&&day%19===8){const rs=climateRoutes([9,10,11]);if(rs.length&&(()=>{const r=pick(rs,12),p=atDistance(r,r.length*.5),s=weather(at,p.x,p.y)||{};return (s.snow||0)>.2||(s.blizzard||0)>.1;})())this.add('avalanche',pick(rs,12).id,at,1440,{source:'Éclaireurs'});}
    if(phase===17&&day%23===10&&sky.rain<.1){const rs=climateRoutes([5,6,7,8]);if(rs.length)this.add('fire',pick(rs,13).id,at,2160,{source:'Forestiers'});}
    if(phase===8&&day%7===6)this.add('festival',town.id,at,720,{source:'Habitants de '+town.name});
    if(phase===10&&day%9===4)this.add('delay',town.id,at,360,{source:'Maître du relais'});
    if(phase===21&&day%29===13)this.add('relay',town.id,at,480,{source:'Maître du relais'});
    if(phase===13&&day%13===5)this.add('theft',town.id,at,1440,{source:'Marchands',detail:'Un chargement a disparu au marché.'});
    if(phase===8&&day%17===9){const borders=roads.filter(r=>r.type!=='searoutes'&&new Set(roadCells(r).map(c=>c.region)).size>1);if(borders.length)this.add('border',pick(borders,14).id,at,720,{source:'Gardes de la frontière'});}
    if(phase===19&&day%31===16)this.add('missing',town.id,at,4320,{source:'Habitants de '+town.name});
    if(phase===9&&day%37===18)this.add('funeral',town.id,at,480,{source:'Habitants de '+town.name});
    if(phase===12&&day%61===30)this.add('ruler',town.id,at,0,{source:'Messagers de '+town.name});
    const conflictTown=nodes.filter(n=>n.rest&&n.id!=='camp')[Math.floor(random(Math.floor(day/43),32,91)*nodes.filter(n=>n.rest&&n.id!=='camp').length)];
    if(phase===6&&day%43===20)this.add('siege',conflictTown.id,at,2160,{source:'Éclaireurs'});
    if(phase===7&&day%43===22)this.add('occupation',conflictTown.id,at,2880,{source:'Éclaireurs'});
    if(phase===8&&day%43===24)this.add('truce',conflictTown.id,at,1440,{source:'Messagers'});
    if(phase===11&&day%11===5&&crossings.length){const b=pick(crossings,8);this.add('bridge',b.road,at,2880,{position:b,source:'Garde du pont'});}
   }
   this.lastHour=Math.max(this.lastHour,hour);this.clock=clock;const expired=this.events.filter(e=>e.resolved===null&&e.end!==null&&e.end<=clock);for(const e of expired){e.resolved=e.end;this.revision++;if(['bridge','flood','landslide','avalanche','fire'].includes(e.type))this.add('repair',e.target,e.end,1440,{position:e,source:'Garde des routes',expiry:true});}
  }
  distances(e){if(this.newsDistances.has(e.id))return this.newsDistances.get(e.id);const start=nearestSite(e.x,e.y).vertex,best=new Map([[start,0]]),q=new Heap();q.push({id:start,cost:0});while(q.size){const u=q.pop();if(u.cost!==best.get(u.id))continue;for(const {to,edge}of adj.get(u.id)||[]){const cost=u.cost+edge.length/(edge.modes.includes('boat')?166.67:200);if(cost<(best.get(to)??Infinity)){best.set(to,cost);q.push({id:to,cost});}}}this.newsDistances.set(e.id,best);return best;}
  learn(id,x,y,clock,{role='resident',privateAccess=false}={}){const book=this.knowledge[id]||(this.knowledge[id]={}),site=nearestSite(x,y);let changed=false;
   for(const e of this.events){if(e.at>clock)continue;if(EVENT_TYPES[e.type].private&&!privateAccess&&!e.witnesses.includes(id))continue;const near=Math.hypot(x-e.x,y-e.y)<80||e.witnesses.includes(id),network=this.distances(e).get(site.vertex),lag=near?0:(network??Infinity)+Math.hypot(x-site.x,y-site.y)/80+(role==='courier'?30:360);
    if(clock>=e.at+lag){if(!book[e.id]){book[e.id]={heard:clock,at:e.at,resolved:null,source:near?'Témoin direct':e.source};changed=true;}
     if(e.resolved!==null&&clock>=e.resolved+lag&&book[e.id].resolved!==e.resolved){book[e.id].resolved=e.resolved;changed=true;}}
   }if(changed)this.revision++;return book;
  }
  share(from,to,clock){const source=this.knowledge[from]||{},dest=this.knowledge[to]||(this.knowledge[to]={});let changed=false;for(const [id,k]of Object.entries(source)){const e=this.events.find(e=>e.id===id);if(!e||EVENT_TYPES[e.type].private)continue;if(!dest[id]||k.resolved!==null&&dest[id].resolved===null){dest[id]={...k,heard:clock,source:'Voyageur de relais'};changed=true;}}if(changed)this.revision++;}
  news(id,clock=this.clock){const book=this.knowledge[id]||{};return this.events.filter(e=>book[e.id]).sort((a,b)=>b.at-a.at).slice(0,8).map(e=>{const k=book[e.id],resolved=k.resolved!==null;return {id:e.id,type:e.type,target:e.target,title:e.title,text:(resolved?'Situation terminée : ':'')+e.title+' — '+eventTarget(e.target).name+'.'+(e.detail?' '+e.detail:''),source:k.source,at:e.at,heard:k.heard,resolved,uncertain:!resolved&&clock-k.at>1440};});}
  recordNews(id,clock=this.clock){for(const n of this.news(id,clock)){const key=n.id+':'+n.resolved;if(!this.journal.some(j=>j.key===key))this.journal.push({...n,key,npc:id});}this.journal=this.journal.slice(-120);this.revision++;}
  serialize(){return {schema:this.schema,campaign:this.campaign,revision:this.revision,clock:this.clock,events:this.events,knowledge:this.knowledge,journal:this.journal,lastHour:this.lastHour,nextId:this.nextId};}
 }
 class LocationTracker{
  constructor(){this.current=null;this.pending=null;this.age=0;this.last=null;}
  update(x,y,dt,{override=null,level=0}={}){const jump=!this.last||Math.hypot(x-this.last.x,y-this.last.y)>60||this.last.level!==level;this.last={x,y,level};let next=override;
   if(!next){let site=siteAt(x,y);const oldSite=byId[this.current?.site];if(!site&&oldSite&&Math.hypot(x-oldSite.x,y-oldSite.y)<oldSite.radius+8)site=oldSite;const c=cellAt(x,y),region=regions.get(c?.region);let near=closestRoad(x,y);const old=roadById[this.current?.route];if(old){const keep=old.segments.map(s=>({...project(x,y,s.a,s.b),road:old})).find(p=>p.d<=old.width/2+9);if(keep)near=keep;}
    const close=near&&near.d<=near.road.width/2+(old?.id===near.road.id?9:5),detail=site?(site.kind==='dock'?'Embarcadere':site.kind==='port'?'Port et relais':site.kind==='ruin'?'Ruines anciennes':'Lieu de halte'):close?near.road.name:'Terres sauvages';next={title:site?.name||region?.name||'Haute mer',detail,territory:region?.territory||region?.continent||'',site:site?.id,route:close?near.road.id:null};}
   next={...next,key:next.key||next.title+'|'+next.detail};if(!this.current||jump){this.current=next;this.pending=null;this.age=0;}else if(next.key===this.current.key){this.pending=null;this.age=0;}else{if(this.pending?.key!==next.key){this.pending=next;this.age=0;}this.age+=Math.max(0,Math.min(dt,.25));if(this.age>=.9){this.current=next;this.pending=null;this.age=0;}}return this.current;
  }
 }
 class ChunkStore{
  constructor(max=48){this.max=max;this.cache=new Map();this.clock=480;}
  setClock(clock){if(Number.isFinite(clock))this.clock=clock;}
  get(cx,cy){const key=cx+','+cy,snowKey=chunkSnowKey(cx,cy,this.clock,true);let c=this.cache.get(key);if(c&&c.snowKey===snowKey){this.cache.delete(key);this.cache.set(key,c);return c;}const tiles=c?.tiles||new Uint8Array(CHUNK*CHUNK),props=[];for(let y=0;y<CHUNK;y++)for(let x=0;x<CHUNK;x++){const wx=cx*CHUNK+x,wy=cy*CHUNK+y,t=c?tiles[y*CHUNK+x]:terrain(wx,wy);tiles[y*CHUNK+x]=t;if(!core(wx,wy)){const p=propAt(wx,wy,t,this.clock);if(p)props.push(p);}}c={key,cx,cy,tiles,props,snowKey,glints:c?.glints};this.cache.set(key,c);while(this.cache.size>this.max)this.cache.delete(this.cache.keys().next().value);return c;}
  tile(x,y){x=Math.floor(x);y=Math.floor(y);const cx=Math.floor(x/CHUNK),cy=Math.floor(y/CHUNK);return this.get(cx,cy).tiles[(y-cy*CHUNK)*CHUNK+x-cx*CHUNK];}
 }
 function localPath(start,end,free,max=2200){const sx=Math.floor(start.x/16),sy=Math.floor(start.y/16),tx=Math.floor(end.x/16),ty=Math.floor(end.y/16),key=(x,y)=>x+','+y,q=new Heap(),best=new Map([[key(sx,sy),0]]),prev=new Map();q.push({x:sx,y:sy,g:0,cost:0});let count=0;
  while(q.size&&count++<max){const n=q.pop(),k=key(n.x,n.y);if(n.g!==best.get(k))continue;if(n.x===tx&&n.y===ty){const path=[{x:end.x,y:end.y}];let p=k;while(prev.has(p)){const u=prev.get(p);if(u.x!==sx||u.y!==sy)path.unshift({x:u.x*16+8,y:u.y*16+8});p=key(u.x,u.y);}return path;}
   for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){const x=n.x+dx,y=n.y+dy;if(Math.abs(x-sx)>36||Math.abs(y-sy)>36||!free(x*16+8,y*16+8))continue;const k2=key(x,y),g=n.g+1;if(g>=(best.get(k2)??Infinity))continue;best.set(k2,g);prev.set(k2,n);q.push({x,y,g,cost:g+Math.abs(tx-x)+Math.abs(ty-y)});}}
  return [];
 }
 return {layout,scale,passable,roadCells,vertexOf,airTemperature,visualSnowCover,chunkSnowKey,climateProfiles,climateTemperature,snowCover,VERSION,CHUNK,PIXELS,raw,origin,toWorld,toGame,core,cells,cellById,cellAt,regions,nodes,byId,home,refuge,prison,roads,roadById,segments,roadIndex,vertices,adj,edgeById,edgeRisk,crossings,curseCells,riverAt,coastDistance,environment,closestRoad,siteAt,nearestSite,atDistance,terrain,propAt,modes,findPath,routePlan,WorldState,EVENT_TYPES,LocationTracker,ChunkStore,localPath,project,random,distance,Heap};
};
if(typeof module!=='undefined'&&module.exports)module.exports=createWorldAtlas;
