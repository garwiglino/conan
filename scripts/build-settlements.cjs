'use strict';
// Authoring only: deterministic districts, in native pixels, on the existing atlas.
const fs=require('node:fs'),crypto=require('node:crypto'),path=require('node:path'),root=path.resolve(__dirname,'..');
const A=require('../sprites/architecture/architecture-game'),Atlas=require('./world-model')(require('../data/world/atlas.json'));
const localities=require('../sprites/architecture/localities'),profiles=require('../data/world/bible/generated/settlements.json');
const prefix={teremor:'TER',sylverive:'SYL',igea:'IGE',sarak:'SAR',varan:'VAR',tagon:'TAG'};
function overlap(a,b,p=0){return a.x-p<b.x+b.w&&a.x+a.w+p>b.x&&a.y-p<b.y+b.h&&a.y+a.h+p>b.y;}
function pointRect(x,y,r){return Math.hypot(Math.max(r.x-x,0,x-r.x-r.w),Math.max(r.y-y,0,y-r.y-r.h));}
function segmentRect(a,b,r){
 let lo=0,hi=1;for(const [p,d,min,max]of [[a[0],b[0]-a[0],r.x,r.x+r.w],[a[1],b[1]-a[1],r.y,r.y+r.h]]){if(!d){if(p<min||p>max){lo=2;break;}}else{const t=[(min-p)/d,(max-p)/d].sort((x,y)=>x-y);lo=Math.max(lo,t[0]);hi=Math.min(hi,t[1]);}}
 if(lo<=hi)return 0;
 return Math.min(pointRect(...a,r),pointRect(...b,r),...[[r.x,r.y],[r.x+r.w,r.y],[r.x,r.y+r.h],[r.x+r.w,r.y+r.h]].map(p=>Atlas.project(...p,a,b).d));
}
function build(){const plan={version:1,layout:Atlas.layout.id,tilePixels:16,projection:'dimetric-2:1',sites:Atlas.nodes.filter(n=>n.id.startsWith('town-')).map(n=>{
 const profile=profiles.find(p=>'town-'+p.atlasId===n.id),l=localities.find(l=>l.name===n.name),centre=Atlas.toGame(n.x,n.y),R=Math.floor(n.radius*16)-40;
 const roads=Atlas.segments.filter(s=>s.r.type!=='searoutes'&&Atlas.project(n.x,n.y,s.a,s.b).d<n.radius+32).map(s=>({a:[(s.a[0]-n.x)*16,(s.a[1]-n.y)*16],b:[(s.b[0]-n.x)*16,(s.b[1]-n.y)*16],width:s.r.width*16}));
 const terrain=(x,y)=>Atlas.terrain(Math.floor(Atlas.toWorld(centre.x+x,centre.y+y).x),Math.floor(Atlas.toWorld(centre.x+x,centre.y+y).y));
 const land=r=>{for(let y=Math.floor((centre.y+r.y)/16)*16-centre.y;y<=r.y+r.h+16;y+=16)for(let x=Math.floor((centre.x+r.x)/16)*16-centre.x;x<=r.x+r.w+16;x+=16)if([3,8].includes(terrain(x,y)))return false;return true;};
 const edge=(Atlas.adj.get(n.vertex)||[]).find(e=>e.edge.modes.includes('horse')),v=edge&&Atlas.vertices.get(edge.to),length=v?Math.hypot(v[0]-n.x,v[1]-n.y):0,service=length?{x:(v[0]-n.x)/length*80,y:(v[1]-n.y)/length*80}:{x:0,y:0};
 const reserved=[{x:-100,y:-100,w:200,h:200},...[[112,-80,24],[128,96,10],[0,-112,8],[service.x,service.y,28],[service.x-36,service.y+30,26],[service.x+63,service.y+34,32]].map(([x,y,r])=>({x:x-r,y:y-r,w:r*2,h:r*2}))];
 const candidates=[];for(let row=-6;row<=6;row++)for(let col=0;col<=(n.radius<=40?36:18);col++)for(const sign of [-1,1]){const x=sign*(144+col*(n.radius<=40?32:64));for(const side of [-1,1]){const y=row*(n.radius<=40?128:192)+side*32;if(Math.hypot(x,y)>R-72)continue;candidates.push({x,y,dir:side<0?'face':'dos',lane:row*(n.radius<=40?128:192)});}}
 candidates.sort((a,b)=>Math.hypot(a.x,a.y)-Math.hypot(b.x,b.y)||a.y-b.y||a.x-b.x);
 const intent=new Set(profile.productionIntent),industry=[];
 if([...intent].some(k=>['tools','arms','iron','copper','tin','bronze','steel'].includes(k)))industry.push('B09');
 if([...intent].some(k=>['cloth','wool','flax','cotton','fiber','leather'].includes(k)))industry.push('B17');
 if([...intent].some(k=>['pottery','glass','clay'].includes(k)))industry.push('B10');
 if([...intent].some(k=>['timber','naval_timber','resin','firewood'].includes(k)))industry.push('B12');
 if([...intent].some(k=>['fish','meat','salt'].includes(k)))industry.push('B16');
 if([...intent].some(k=>['grain','flour','provisions','legumes','rice','tubers','dates'].includes(k)))industry.push('B15');
 const regional=l.models.filter(id=>/^T/.test(id));
 const publicModels=['B07','B05','B06',...(n.regionalCentre?['B21','B22','F01']:[]),...industry,...(n.oceanPort?[regional.find(id=>/Dépôt|Entrepôt/.test(A.entry(id).label))||'B08']:[])];
 const count=n.regionalCentre?48:n.oceanPort?30:18,requested=publicModels.slice();
 while(requested.length<count){const i=requested.length;requested.push(i%5===0?regional[0]:prefix[l.family]+'-C0'+(i%7===0?3:i%3===0?2:1));}
 const buildings=[],lanes=new Map();
 for(const id of requested){const d=A.entry(id);let found;
  for(let i=0;i<candidates.length;i++){const c=candidates[i],o={id,dir:c.dir,x:c.x,y:c.dir==='face'?c.y:c.y+(d.width+d.depth)/2},g=A.geometry(id,o),pad={x:g.foot.x-12,y:g.foot.y-12,w:g.foot.w+24,h:g.foot.h+24};
   if(reserved.some(r=>overlap(pad,r))||Math.hypot(g.foot.x+g.foot.w/2,g.foot.y+g.foot.h/2)>R-48||!land(pad)||buildings.some(b=>overlap(pad,b.foot,12))||roads.some(r=>segmentRect(r.a,r.b,pad)<r.width/2+12))continue;
   const p=g.portals[0],approach={x:p.x+p.nx*20,y:p.y+p.ny*20};if([3,8].includes(terrain(approach.x,approach.y)))continue;
   const lane={x:Math.min(0,c.x)-32,y:c.lane-24,w:Math.abs(c.x)+64,h:48};if(!land(lane))continue;
   found={...o,uid:n.id+'-building-'+buildings.length,role:publicModels.includes(id)?'facility':'housing',foot:g.foot,entrance:approach};buildings.push(found);candidates.splice(i,1);const key=c.lane,old=lanes.get(key);lanes.set(key,old?{...old,x:Math.min(old.x,lane.x),w:Math.max(old.x+old.w,lane.x+lane.w)-Math.min(old.x,lane.x)}:lane);break;
  }
  if(!found&&publicModels.includes(id))throw Error('Aucun terrain accessible pour '+n.name+' / '+id);
 }
 return {id:n.id,name:n.name,family:l.family,role:l.role,radius:n.radius,buildings,lanes:[{x:-24,y:-R,w:48,h:R*2},...lanes.values()]};
 })};
 // Activate the reviewed city at its canonical anchor. Other localities retain
 // their existing layouts until their own city design is authored.
 const city=require('../data/architecture/city-plans/clairfoyer-grid.json'),site=plan.sites.find(s=>s.id===city.id),rect=(a,b,width)=>({x:Math.min(a[0],b[0])*16-width*8,y:Math.min(a[1],b[1])*16-width*8,w:Math.abs(a[0]-b[0])*16+width*16,h:Math.abs(a[1]-b[1])*16+width*16,orthogonal:true});
 site.planRevision=city.revision;site.layoutKind='varied-rectangular-grid';site.designPopulation=city.canon.designPopulation;
 site.buildings=city.buildings.map(b=>{const o={...b,x:Math.round(b.x*16),y:Math.round(b.y*16)},g=require('../sprites/architecture/settlement-architecture').geometry(b.id,o);return {...o,foot:g.foot,entrance:g.portals[0]?{x:g.portals[0].x+g.portals[0].nx*20,y:g.portals[0].y+g.portals[0].ny*20}:b.entrance&&{x:b.entrance.x*16,y:b.entrance.y*16}};});
 const access=new Map(city.walkways.map(w=>[w.building,w.points.map(p=>p.map(v=>v*16))]));for(const b of site.buildings)b.access=access.get(b.uid);
 const nav=require('./city-plans/orthogonal-network.cjs').graph(city.streets),keys=[...nav.nodes.keys()],indices=new Map(keys.map((k,i)=>[k,i]));site.navigation={points:[...nav.nodes.values()].map(n=>n.point.map(v=>v*16)),edges:[...nav.edges.values()].map(e=>[indices.get(e.u),indices.get(e.v)])};
 const laneMap=new Map();for(const s of [...city.streets,...city.walkways,...city.walkways.map(w=>w.threshold)])for(let i=1;i<s.points.length;i++){const r=rect(s.points[i-1],s.points[i],s.width);r.paved=s.kind==='main'||s.kind==='street'||s.kind==='access';laneMap.set([r.x,r.y,r.w,r.h].join(','),r);}site.lanes=[...laneMap.values()];
 const xs=site.buildings.flatMap(b=>[b.foot.x,b.foot.x+b.foot.w]),ys=site.buildings.flatMap(b=>[b.foot.y,b.foot.y+b.foot.h]);site.bounds={x:Math.min(...xs)-32,y:Math.min(...ys)-32,w:Math.max(...xs)-Math.min(...xs)+64,h:Math.max(...ys)-Math.min(...ys)+64};
 site.districts=require('../data/architecture/city-plans/clairfoyer-districts.json').districts.map(d=>({id:d.id,name:d.name,areas:(d.areas||[d.bounds]).map(r=>Object.fromEntries(Object.entries(r).map(([k,v])=>[k,v*16]))),bounds:Object.fromEntries(Object.entries(d.bounds).map(([k,v])=>[k,v*16]))}));
 const City=require('../sprites/architecture/settlement-architecture'),F=require('../sprites/decors/postes-isometriques'),fixtures=[];
 const programme=require('../data/architecture/city-plans/clairfoyer-life.json').fixtures;
 const allSolids=site.buildings.flatMap(b=>City.geometry(b.id,b).solids.filter(s=>s.zMin<19&&s.zMax>3)),solidIndex=new Map(),key=(x,y)=>Math.floor(x/256)+','+Math.floor(y/256);
 for(const r of allSolids)for(let y=Math.floor(r.y/256);y<=Math.floor((r.y+r.h)/256);y++)for(let x=Math.floor(r.x/256);x<=Math.floor((r.x+r.w)/256);x++){const k=x+','+y;if(!solidIndex.has(k))solidIndex.set(k,[]);solidIndex.get(k).push(r);}
 const blocked=(x,y,r=4)=>(solidIndex.get(key(x,y))||[]).some(b=>City.contains(b,x,y,r))||fixtures.some(f=>x+r>f.foot.x&&x-r<f.foot.x+f.foot.w&&y+r>f.foot.y&&y-r<f.foot.y+f.foot.h);
 for(const [district,ids]of Object.entries(programme))for(const [i,id]of ids.entries()){
  const def=F.Art.entry(id),socket=F.sockets(id).operator,inv=p=>[(p[1]-96)+(p[0]-64)/2,(p[1]-96)-(p[0]-64)/2],feet=inv(socket.feet),approach=inv(socket.approach),candidates=site.buildings.filter(b=>b.district===district&&/^(CF|CI)/.test(b.id));let placed=false;
  for(const b of candidates){if(placed)break;const r=b.foot;for(let dy=-40;dy<=r.h+40&&!placed;dy+=8)for(let dx=-40;dx<=r.w+40&&!placed;dx+=8){const x=Math.round(r.x+dx),y=Math.round(r.y+dy),foot={x:x-def.width/2,y:y-def.depth/2,w:def.width,h:def.depth};
   if(['care_bed','sleeping_mat','apothecary_table'].includes(id)&&!City.covered(b,x,y))continue;
   if(site.lanes.some(l=>overlap(foot,l,5))||fixtures.some(f=>overlap(foot,f.foot,10)||f.access?.some(p=>pointRect(p[0],p[1],foot)<6)))continue;
   let bad=false;for(let v=foot.y;v<=foot.y+foot.h&&!bad;v+=4)for(let u=foot.x;u<=foot.x+foot.w;u+=4)if(blocked(u,v,3))bad=true;if(bad||blocked(x+feet[0],y+feet[1],4)||blocked(x+approach[0],y+approach[1],4))continue;
   // A free socket can still sit in a closed pocket. Require a collision-checked
   // route from its building's authored doorstep before accepting the furniture.
   const at={x:x+feet[0],y:y+feet[1]},start={x:b.apron.x*16,y:b.apron.y*16},ownBlocks=(u,v)=>{
    const inside=u>foot.x&&u<foot.x+foot.w&&v>foot.y&&v<foot.y+foot.h;
    if(!inside&&(Math.hypot(u-at.x,v-at.y)<7||Math.hypot(u-x-approach[0],v-y-approach[1])<7)||socket.support&&(Math.hypot(u-at.x,v-at.y)<2||Atlas.project(u,v,[x+approach[0],y+approach[1]],[at.x,at.y]).d<5))return false;
    return u+4>foot.x&&u-4<foot.x+foot.w&&v+4>foot.y&&v-4<foot.y+foot.h;
   },free=(u,v)=>!blocked(u,v,4)&&!ownBlocks(u,v),edge=(p,q)=>{const steps=Math.ceil(Math.hypot(p.x-q.x,p.y-q.y)/3);for(let i=0;i<=steps;i++)if(!free(p.x+(q.x-p.x)*i/Math.max(1,steps),p.y+(q.y-p.y)*i/Math.max(1,steps)))return false;return true;};
   const approachPath=Atlas.localPath(start,at,free,2200,edge);if(!approachPath.length)continue;
   fixtures.push({uid:'clairfoyer-'+district+'-'+id+'-'+i,id,x,y,foot,district,sheltered:City.covered(b,x,y),building:b.uid,access:[start,...approachPath].map(p=>[p.x,p.y])});placed=true;
  }}if(!placed)throw Error('No clear furnished courtyard for '+district+'/'+id);
 }
 site.fixtures=fixtures;
 // Existing farmers work in the clear strip between the arrival relay and the
 // city. These sockets reserve no workers, crops, yields or economic stocks.
 site.hinterlandFields=[-128,-152,-176,-200].flatMap(x=>[-20,20].map(y=>({x:x*16,y:y*16,roadX:x*16,roadY:0})));
 plan.revision=crypto.createHash('sha256').update(JSON.stringify([Atlas.origin,Atlas.raw.sites.map(n=>[n.id,n.x,n.y]),plan])).digest('hex').slice(0,16);return plan;}
if(require.main===module){const out=build();fs.writeFileSync(path.join(root,'data/architecture/settlements.json'),JSON.stringify(out)+'\n');console.log(out.sites.length+' localités, '+out.sites.reduce((n,s)=>n+s.buildings.length,0)+' bâtiments natifs.');}
module.exports={build,overlap,segmentRect};
