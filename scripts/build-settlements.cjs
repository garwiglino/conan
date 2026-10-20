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
 })};plan.revision=crypto.createHash('sha256').update(JSON.stringify([Atlas.origin,Atlas.raw.sites.map(n=>[n.id,n.x,n.y]),plan])).digest('hex').slice(0,16);return plan;}
if(require.main===module){const out=build();fs.writeFileSync(path.join(root,'data/architecture/settlements.json'),JSON.stringify(out)+'\n');console.log(out.sites.length+' localités, '+out.sites.reduce((n,s)=>n+s.buildings.length,0)+' bâtiments natifs.');}
module.exports={build,overlap,segmentRect};
