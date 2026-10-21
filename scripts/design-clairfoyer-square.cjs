'use strict';
// Alternative proposal, kept separate from the previously reviewed plan and game.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),A=require('../sprites/architecture/architecture-game'),O=require('./city-plans/orthogonal-network.cjs'),Atlas=require('./world-model')(require('../data/world/atlas.json')),base=require('../data/architecture/city-plans/clairfoyer.json');
const pitch=128,count=6,x0=-1164,y0=-444,round=n=>Math.round(n*16)/16,streets=[],wards=[],buildings=[],rejections={water:0,road:0,spacing:0};
const overlap=(a,b,p=0)=>a.x-p<b.x+b.w&&a.x+a.w+p>b.x&&a.y-p<b.y+b.h&&a.y+a.h+p>b.y;
const dry=r=>{for(let y=r.y;y<=r.y+r.h+.1;y+=1)for(let x=r.x;x<=r.x+r.w+.1;x+=1)if([3,8].includes(Atlas.terrain(Math.floor(base.anchor.x+x),Math.floor(base.anchor.y+y))))return false;return true;};
const street=(id,kind,width,points)=>streets.push({id,kind,width,points,orthogonal:true,physicalLengthM:O.length(points)});
for(let i=0;i<=count;i++){street('grid-h-'+i,i===3?'main':'street',i===3?8.8:4.4,[[x0,y0+i*pitch],[x0+count*pitch,y0+i*pitch]]);street('grid-v-'+i,i===3?'main':'street',i===3?8.8:4.4,[[x0+i*pitch,y0],[x0+i*pitch,y0+count*pitch]]);}
const approach=Atlas.roadById['road-5'].pts.at(-2),external=[approach[0]-base.anchor.x,approach[1]-base.anchor.y];
street('arrival-east','access',8.8,[[0,0],[x0+count*pitch,0],[x0+count*pitch,y0+3*pitch]]);
street('arrival-south','access',6.4,[external,[x0+count*pitch,external[1]],[x0+count*pitch,y0+5*pitch]]);
street('resin-access','access',6.4,[[-1350,200],[-1350,y0+5*pitch],[x0,y0+5*pitch]]);
const programmes={'2,2':{role:'market',models:['B05','B07','B06','B08']},'3,2':{role:'civic',models:['B21','B22','B24','B08']},'5,3':{role:'market',models:['B05','B07','B06']},'0,4':{role:'logistics',models:['B06','B08','B24']}};
const near=(x,y)=>{let best;for(const s of streets)for(let i=1;i<s.points.length;i++){const q=Atlas.project(x,y,s.points[i-1],s.points[i]);if(!best||q.d<best.d)best={...q,id:s.id};}return best;};
function facing(x,y,target){const q=target||near(x,y),dx=q.x-x,dy=q.y-y;return Math.abs(dx)>Math.abs(dy)?dx>0?'gauche':'droite':dy>0?'face':'dos';}
function native(id,dir,cx,cy){let g=A.geometry(id,{dir}),x=round(cx-(g.foot.x+g.foot.w/2)/16),y=round(cy-(g.foot.y+g.foot.h/2)/16);g=A.geometry(id,{dir,x:x*16,y:y*16});const f=g.foot,p=g.portals[0];return{id,dir,x,y,foot:{x:f.x/16,y:f.y/16,w:f.w/16,h:f.h/16},portal:{x:p.x/16,y:p.y/16,nx:p.nx,ny:p.ny},entrance:{x:(p.x+p.nx*20)/16,y:(p.y+p.ny*20)/16}};}
function place(id,dir,cx,cy,ward,role,capacity=0){const b=native(id,dir,cx,cy);if(!dry(b.foot)){rejections.water++;return;}
 if(streets.some(s=>s.points.slice(1).some((p,i)=>overlap(b.foot,O.rect(s.points[i],p,s.width+1.5))))){rejections.road++;return;}
 if(buildings.some(o=>overlap(b.foot,o.foot,2.5))){rejections.spacing++;return;}
 const q=near(b.portal.x,b.portal.y);if(capacity&&(q.x-b.portal.x)*b.portal.nx+(q.y-b.portal.y)*b.portal.ny<0)return;
 const o={...b,uid:'square-'+ward.id+'-'+buildings.filter(b=>b.ward===ward.id).length,ward:ward.id,role,capacity,frontage:{street:q.id,target:[q.x,q.y]}};buildings.push(o);return o;
}
for(let row=0;row<count;row++)for(let col=0;col<count;col++){
 const x=x0+col*pitch,y=y0+row*pitch,programme=programmes[col+','+row],park=col===0&&row===0,w={id:'block-'+col+'-'+row,col,row,role:park?'park':programme?.role||'housing',sourceWard:park?'Park':programme?.role==='market'?'Market':'CommonWard',polygon:[[x,y],[x+pitch,y],[x+pitch,y+pitch],[x,y+pitch]],parcels:[]};wards.push(w);
 if(park)continue;
 // Two straight shared alleys per block. No crenellated tracing of old parcels.
 street('court-h-'+col+'-'+row,'alley',2,[[x,y+pitch/2],[x+pitch,y+pitch/2]]);
 street('court-v-'+col+'-'+row,'alley',2,[[x+pitch/2,y],[x+pitch/2,y+pitch]]);
 if(programme){const positions=[[-15,-15],[15,-15],[-15,15],[15,15]];for(let i=0;i<programme.models.length;i++){const cx=x+pitch/2+positions[i][0],cy=y+pitch/2+positions[i][1];if(!place(programme.models[i],facing(cx,cy,{x:x+pitch/2,y:y+pitch/2}),cx,cy,w,'public'))throw Error('Public site cannot fit '+w.id);}}
}
for(const w of wards){if(w.role==='park')continue;const [x,y]=w.polygon[0],programme=programmes[w.col+','+w.row];for(let row=0;row<11;row++)for(let col=0;col<11;col++){
 const cx=x+7+col*11,cy=y+7+row*11;if(programme&&Math.abs(cx-(x+64))<25&&Math.abs(cy-(y+64))<25)continue;
 const h=(Math.imul(w.col*11+col+1,374761393)^Math.imul(w.row*11+row+1,668265263))>>>0,id=h%19===0?'TER-C03':h%4===0?'TER-C02':h%5===0?'T03':'TER-C01',role=h%37===0?'artisan':'housing',model=role==='artisan'?'T03':id;
 place(model,facing(cx,cy),cx,cy,w,role,role==='housing'?(id==='TER-C03'?8:id==='TER-C02'?6:4):0);
}}
// Preserve the same arrival and industry service programme outside the grid.
const services={id:'arrival-services'};for(const [id,x,y,role]of [['B07',-22,-20,'public'],['B08',-20,10,'public'],['F01',-48,18,'watch_proposal'],['B24',-45,-35,'public'],['B12',-1390,184,'resin_workshop_proposal'],['B06',-1370,184,'resin_store_proposal']]){if(!place(id,facing(x,y),x,y,services,role))throw Error('Service cannot fit '+id);}
// Prefer inhabited street frontages; retain a capacity reserve of eight percent.
const houses=buildings.filter(b=>b.capacity),distance=b=>Math.hypot(b.x-b.frontage.target[0],b.y-b.frontage.target[1]);houses.sort((a,b)=>distance(a)-distance(b)||a.uid.localeCompare(b.uid));const keep=new Set();let capacity=0;for(const b of houses){if(capacity>=Math.ceil(base.canon.designPopulation*1.08))break;keep.add(b.uid);capacity+=b.capacity;}for(let i=buildings.length-1;i>=0;i--)if(buildings[i].capacity&&!keep.has(buildings[i].uid))buildings.splice(i,1);
if(capacity<base.canon.designPopulation)throw Error('Insufficient housing capacity '+capacity);
const circulation=require('./city-plans/circulation.cjs').build({streets,buildings,anchor:base.anchor},Atlas);if(circulation.unreachable.length)throw Error('Unreachable entrances: '+circulation.unreachable.join(','));
const residents=buildings.filter(b=>b.capacity);let remaining=base.canon.designPopulation;const fractions=residents.map(b=>{const exact=base.canon.designPopulation*b.capacity/capacity;b.plannedResidents=Math.floor(exact);remaining-=b.plannedResidents;return{b,f:exact%1};}).sort((a,b)=>b.f-a.f||a.b.uid.localeCompare(b.b.uid));for(let i=0;i<remaining;i++)fractions[i].b.plannedResidents++;
const marketWard='block-2-2',plazaPolygon=[[-868,-148],[-820,-148],[-820,-100],[-868,-100]];
const result={...base,id:base.id,variant:'square-grid',variantLabel:'VARIANTE CARRÉE / 6 × 6 ÎLOTS',status:'alternative_for_visual_review',sourcePlanRevision:base.revision,approval:{userValidated:false,pushAllowed:false},wards,streets,buildings,walkways:circulation.walkways,gardens:[],decorations:[],marketWard,plazaPolygon,grid:{columns:count,rows:count,blockSideM:pitch,bounds:{x:x0,y:y0,w:pitch*count,h:pitch*count},throughStreets:14,smallZigzags:0},roadGeometry:{kind:'square-grid',distanceDecision:'Internal junctions and parcels reorganized; original distances remain references, not a claim of unchanged physical lengths.',summary:{allAxisAligned:true,allEndpointsPreserved:false,originalAccessPointsPreserved:true},nodes:[],edges:[]},circulation:{...base.circulation,gridStepM:circulation.step,unreachable:circulation.unreachable},summary:{...base.summary,sourceParcels:0,referenceParcels:base.summary.sourceParcels,rejectedCandidates:rejections,buildings:buildings.length,houses:residents.length,housingCapacity:capacity,unhousedDesignResidents:0,areaHa:(pitch*count)**2/10000,orientations:Object.fromEntries(['face','droite','dos','gauche'].map(dir=>[dir,buildings.filter(b=>b.dir===dir).length]))},callouts:[['1 · Marché et cour carrée',[-844,-124],[-1060,-170]],['2 · Conseil, soins et refuge',[-716,-124],[-750,-260]],['3 · Jardin public',[-1100,-380],[-1200,-480]],['4 · Cour de résine',[-1370,184],[-1400,300]],['5 · Arrivée conservée',[0,0],[-240,-100]],['6 · Accès sud conservé',external,[-300,310]]],activation:{...base.activation,runtimeChanged:false},designNote:'Alternative with long shared straight streets and square blocks; old internal junction locations are deliberately not copied.'};
delete result.revision;result.revision=crypto.createHash('sha256').update(JSON.stringify(result)).digest('hex').slice(0,16);fs.writeFileSync(path.join(__dirname,'../data/architecture/city-plans/clairfoyer-square.json'),JSON.stringify(result)+'\n');console.log(JSON.stringify({grid:result.grid,summary:result.summary,paths:result.walkways.length,rejections},null,2));
