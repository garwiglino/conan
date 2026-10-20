'use strict';
// Unequal rectilinear blocks, offset junctions and a mixture of square/rectangular courts.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),A=require('../sprites/architecture/settlement-architecture'),O=require('./city-plans/orthogonal-network.cjs'),Atlas=require('./world-model')(require('../data/world/atlas.json')),base=require('../data/architecture/city-plans/clairfoyer.json');
const count=6,y0=-444,mainX=-780,rowHeights=[112,144,128,96,160,128],rowWidths=[[112,96,112,128,112,112],[144,144,128,112,144,144],[128,128,160,160,112,128],[96,160,128,128,160,112],[160,112,112,144,128,128],[96,112,112,112,112,112]],rows=rowHeights.map((h,i)=>{const widths=rowWidths[i],x=mainX-widths.slice(0,3).reduce((a,b)=>a+b,0);return {x,y:y0+rowHeights.slice(0,i).reduce((a,b)=>a+b,0),w:widths.reduce((a,b)=>a+b,0),h,widths};}),round=n=>Math.round(n*16)/16,streets=[],wards=[],buildings=[],rejections={water:0,road:0,spacing:0};
const overlap=(a,b,p=0)=>a.x-p<b.x+b.w&&a.x+a.w+p>b.x&&a.y-p<b.y+b.h&&a.y+a.h+p>b.y;
const dry=r=>{for(let y=r.y;y<=r.y+r.h+.1;y+=1)for(let x=r.x;x<=r.x+r.w+.1;x+=1)if([3,8].includes(Atlas.terrain(Math.floor(base.anchor.x+x),Math.floor(base.anchor.y+y))))return false;return true;};
const street=(id,kind,width,points)=>streets.push({id,kind,width,points,orthogonal:true,physicalLengthM:O.length(points)});
for(let i=0;i<=count;i++){const adjacent=rows.slice(Math.max(0,i-1),Math.min(count,i+1)),y=i===count?rows.at(-1).y+rows.at(-1).h:rows[i].y;street('grid-h-'+i,i===3?'main':'street',i===3?8.8:4.4,[[Math.min(...adjacent.map(r=>r.x)),y],[Math.max(...adjacent.map(r=>r.x+r.w)),y]]);}
street('grid-v-main','main',8.8,[[mainX,y0],[mainX,rows.at(-1).y+rows.at(-1).h]]);
for(const [row,r]of rows.entries())for(let i=0;i<=count;i++)if(i!==3){const x=r.x+r.widths.slice(0,i).reduce((a,b)=>a+b,0);street('grid-v-'+row+'-'+i,'street',4.4,[[x,r.y],[x,r.y+r.h]]);}
const east=Math.max(...rows.map(r=>r.x+r.w)),southAccessY=rows[5].y;
const approach=Atlas.roadById['road-5'].pts.at(-2),external=[approach[0]-base.anchor.x,approach[1]-base.anchor.y];
street('arrival-east','access',8.8,[[0,0],[east,0],[east,rows[3].y]]);
street('arrival-south','access',6.4,[external,[east,external[1]],[east,southAccessY]]);
street('resin-access','access',6.4,[[-1350,200],[-1350,southAccessY],[rows[4].x,southAccessY]]);
const programmes={
 '1,0':{role:'neighborhood',models:['CF01','CF02','CI01','CI02']},
 '2,0':{role:'workshops',models:['CF03','CF04','CI08']},
 '4,1':{role:'neighborhood',models:['CF05','CF06','CI12']},
 '2,2':{role:'market',models:['CF07','CF08','B07','B06','CI03','CI04']},
 '3,2':{role:'civic',models:['CF09','CF10','B24','B08','CI05','CI06']},
 '5,3':{role:'market',models:['CF11','CF12','B06']},
 '0,4':{role:'logistics',models:['CF13','CF14','B06','B24','CI07']},
 '2,4':{role:'stores',models:['CF15','CF16','CI09','CI11']},
 '4,5':{role:'travel',models:['CF17','CF18','CI10']}
};
const districtFor=(col,row)=>row<2?col<2?'clos':col<4?'metiers':'rive':row<4?col<3?'halles':col<5?'conseil':'etapes':col<2?'bois':col<4?'greniers':'sud';
const rectangles=[],patterns=[['whole','h2','v2','t','whole','v3'],['whole','v2','h3','whole','t','h2'],['whole','whole','t','h2','v2','t'],['h2','v3','whole','t','h2','v2'],['t','whole','v2','h2','v3','t'],['v2','h2','whole','whole','t','h3']];
function court(w,x,y,width,height){rectangles.push({ward:w.id,orientation:width===height?'square':width>height?'horizontal':'vertical',x,y,w:width,h:height});}
const near=(x,y)=>{let best;for(const s of streets)for(let i=1;i<s.points.length;i++){const q=Atlas.project(x,y,s.points[i-1],s.points[i]);if(!best||q.d<best.d)best={...q,id:s.id};}return best;};
function facing(x,y,target){const q=target||near(x,y),dx=q.x-x,dy=q.y-y;return Math.abs(dx)>Math.abs(dy)?dx>0?'gauche':'droite':dy>0?'face':'dos';}
function native(id,dir,cx,cy){let g=A.geometry(id,{dir}),x=round(cx-(g.foot.x+g.foot.w/2)/16),y=round(cy-(g.foot.y+g.foot.h/2)/16);g=A.geometry(id,{dir,x:x*16,y:y*16});const f=g.foot,norm=({face:[0,1],droite:[-1,0],dos:[0,-1],gauche:[1,0]})[dir],spot=g.workspots[0],p=g.portals[0]||{x:f.x+f.w/2+norm[0]*f.w/2,y:f.y+f.h/2+norm[1]*f.h/2,nx:norm[0],ny:norm[1]};return{id,dir,x,y,foot:{x:f.x/16,y:f.y/16,w:f.w/16,h:f.h/16},portal:{x:p.x/16,y:p.y/16,nx:p.nx,ny:p.ny},entrance:{x:(p.x+p.nx*20)/16,y:(p.y+p.ny*20)/16}};}
function place(id,dir,cx,cy,ward,role,capacity=0){const b=native(id,dir,cx,cy);if(!dry(b.foot)){rejections.water++;return;}
 if(streets.some(s=>s.points.slice(1).some((p,i)=>overlap(b.foot,O.rect(s.points[i],p,s.width+1.5))))){rejections.road++;return;}
 if(buildings.some(o=>overlap(b.foot,o.foot,2.5))){rejections.spacing++;return;}
 const q=near(b.portal.x,b.portal.y);if(capacity&&(q.x-b.portal.x)*b.portal.nx+(q.y-b.portal.y)*b.portal.ny<0)return;
 const o={...b,district:ward.district|| (cx < -1200?'resine':'ancien-relais'),uid:'grid-'+ward.id+'-'+buildings.filter(b=>b.ward===ward.id).length,ward:ward.id,role,capacity,frontage:{street:q.id,target:[q.x,q.y]}};buildings.push(o);return o;
}
for(let row=0;row<count;row++)for(let col=0;col<count;col++){
 const r=rows[row],x=r.x+r.widths.slice(0,col).reduce((a,b)=>a+b,0),y=r.y,width=r.widths[col],height=r.h,programme=programmes[col+','+row],park=col===0&&row===0,w={id:'block-'+col+'-'+row,col,row,role:park?'park':programme?.role||'housing',sourceWard:park?'Park':programme?.role==='market'?'Market':'CommonWard',district:districtFor(col,row),bounds:{x,y,w:width,h:height},polygon:[[x,y],[x+width,y],[x+width,y+height],[x,y+height]],parcels:[]};wards.push(w);
 if(park)continue;
 const pattern=programme?'cross':patterns[row][col];w.courtPattern=pattern;
 const hLane=offset=>street('court-h-'+col+'-'+row+'-'+offset,'alley',2,[[x,y+offset],[x+width,y+offset]]),vLane=(offset,start=0)=>street('court-v-'+col+'-'+row+'-'+offset,'alley',2,[[x+offset,y+start],[x+offset,y+height]]);
 if(pattern==='whole')court(w,x,y,width,height);
 else if(pattern==='cross'||pattern==='t'){
  const a=width/2,b=height/2;hLane(b);vLane(a,pattern==='t'?b:0);
  if(pattern==='t')court(w,x,y,width,b);else{court(w,x,y,a,b);court(w,x+a,y,width-a,b);}court(w,x,y+b,a,height-b);court(w,x+a,y+b,width-a,height-b);
 }else{const horizontal=pattern[0]==='h',span=horizontal?height:width,offsets=pattern[1]==='3'?[Math.round(span*.28),Math.round(span*.68)]:[Math.round(span*([.4,.5,.6][(col+row)%3]))];for(const offset of offsets)(horizontal?hLane:vLane)(offset);const cuts=[0,...offsets,span];for(let j=1;j<cuts.length;j++)court(w,x+(horizontal?0:cuts[j-1]),y+(horizontal?cuts[j-1]:0),horizontal?width:cuts[j]-cuts[j-1],horizontal?cuts[j]-cuts[j-1]:height);}

 if(programme){const positions=[[-15,-15],[15,-15],[-15,15],[15,15],[-36,-15],[36,15]];for(let i=0;i<programme.models.length;i++){const cx=x+width/2+positions[i][0],cy=y+height/2+positions[i][1];if(!place(programme.models[i],facing(cx,cy,{x:x+width/2,y:y+height/2}),cx,cy,w,'public'))throw Error('Public site cannot fit '+w.id);}}
}
for(const w of wards){if(w.role==='park')continue;const {x,y,w:width,h:height}=w.bounds,programme=programmes[w.col+','+w.row];for(let row=0;row<=Math.floor((height-14)/11);row++)for(let col=0;col<=Math.floor((width-14)/11);col++){
 const cx=x+7+col*11,cy=y+7+row*11;if(programme&&Math.abs(cx-(x+width/2))<44&&Math.abs(cy-(y+height/2))<28)continue;
 const h=(Math.imul(w.col*11+col+1,374761393)^Math.imul(w.row*11+row+1,668265263))>>>0,id=h%19===0?'TER-C03':h%4===0?'TER-C02':h%5===0?'T03':'TER-C01',role=h%37===0?'artisan':'housing',model=role==='artisan'?'T03':w.district==='clos'&&h%3===0?'CF01':w.district==='rive'&&h%3===0?'CF05':id;
 place(model,facing(cx,cy),cx,cy,w,role,role==='housing'?(id==='TER-C03'?8:id==='TER-C02'?6:4):0);
}}
// Preserve the same arrival and industry service programme outside the grid.
const services={id:'arrival-services'};for(const [id,x,y,role]of [['B07',-22,-20,'public'],['CF19',-20,10,'public'],['F01',-48,18,'watch_proposal'],['CF20',-45,-35,'public'],['CF21',-1390,184,'resin_workshop'],['CF22',-1370,184,'resin_store'],['CI13',-1380,215,'infrastructure'],['CI14',-45,45,'infrastructure']]){if(!place(id,facing(x,y),x,y,services,role))throw Error('Service cannot fit '+id);}
// Prefer inhabited street frontages; retain a capacity reserve of eight percent.
const houses=buildings.filter(b=>b.capacity),distance=b=>Math.hypot(b.x-b.frontage.target[0],b.y-b.frontage.target[1]);houses.sort((a,b)=>distance(a)-distance(b)||a.uid.localeCompare(b.uid));const keep=new Set();let capacity=0;for(const b of houses){if(capacity>=Math.ceil(base.canon.designPopulation*1.08))break;keep.add(b.uid);capacity+=b.capacity;}for(let i=buildings.length-1;i>=0;i--)if(buildings[i].capacity&&!keep.has(buildings[i].uid))buildings.splice(i,1);
if(capacity<base.canon.designPopulation)throw Error('Insufficient housing capacity '+capacity);
const circulation=require('./city-plans/circulation.cjs').build({streets,buildings,anchor:base.anchor},Atlas);if(circulation.unreachable.length)throw Error('Unreachable entrances: '+circulation.unreachable.join(','));
const residents=buildings.filter(b=>b.capacity);let remaining=base.canon.designPopulation;const fractions=residents.map(b=>{const exact=base.canon.designPopulation*b.capacity/capacity;b.plannedResidents=Math.floor(exact);remaining-=b.plannedResidents;return{b,f:exact%1};}).sort((a,b)=>b.f-a.f||a.b.uid.localeCompare(b.b.uid));for(let i=0;i<remaining;i++)fractions[i].b.plannedResidents++;
const marketWard='block-2-2',market=wards.find(w=>w.id===marketWard).bounds,mx=market.x+market.w/2,my=market.y+market.h/2,plazaPolygon=[[mx-24,my-24],[mx+24,my-24],[mx+24,my+24],[mx-24,my+24]],outline=require('./city-plans/rectilinear-outline.cjs').outline(wards.map(w=>w.bounds)),gridBounds={x:Math.min(...rows.map(r=>r.x)),y:y0,w:Math.max(...rows.map(r=>r.x+r.w))-Math.min(...rows.map(r=>r.x)),h:rowHeights.reduce((a,b)=>a+b,0)};
const result={...base,id:base.id,variant:'rectangular-grid',variantLabel:'QUADRILLAGE / ÎLOTS RECTANGULAIRES VARIÉS',status:'approved_for_game_integration',sourcePlanRevision:base.revision,approval:{userValidated:true,pushAllowed:true,instruction:'Integrate buildings and workstations; retain right angles with unequal blocks, squares, rectangles and offset junctions.'},wards,streets,buildings,walkways:circulation.walkways,gardens:[],decorations:[],marketWard,plazaPolygon,grid:{columns:count,rows:count,uniformBlocks:false,rowHeightsM:rowHeights,rowColumnsM:rowWidths,outline,rectangles,bounds:gridBounds,throughStreets:8,offsetJunctions:true,smallZigzags:0},roadGeometry:{kind:'rectangular-grid',distanceDecision:'Internal junctions and parcels reorganized; original distances remain references, not a claim of unchanged physical lengths.',summary:{allAxisAligned:true,allEndpointsPreserved:false,originalAccessPointsPreserved:true},nodes:[],edges:[]},circulation:{...base.circulation,gridStepM:circulation.step,unreachable:circulation.unreachable},summary:{...base.summary,sourceParcels:0,referenceParcels:base.summary.sourceParcels,rejectedCandidates:rejections,buildings:buildings.length,houses:residents.length,housingCapacity:capacity,unhousedDesignResidents:0,areaHa:wards.reduce((n,w)=>n+w.bounds.w*w.bounds.h,0)/10000,orientations:Object.fromEntries(['face','droite','dos','gauche'].map(dir=>[dir,buildings.filter(b=>b.dir===dir).length]))},callouts:[['1 · Marché et cour carrée',[-844,-124],[-1060,-170]],['2 · Conseil, soins et refuge',[-716,-124],[-750,-260]],['3 · Jardin public',[-1100,-380],[-1200,-480]],['4 · Cour de résine',[-1370,184],[-1400,300]],['5 · Arrivée conservée',[0,0],[-240,-100]],['6 · Accès sud conservé',external,[-300,310]]],activation:{...base.activation,runtimeChanged:true,blockedBy:[]},designNote:'Unequal orthogonal blocks with squares, long and short rectangles, offset T junctions and a stepped outer footprint; all entrances connected.'};
delete result.revision;result.revision=crypto.createHash('sha256').update(JSON.stringify(result)).digest('hex').slice(0,16);fs.writeFileSync(path.join(__dirname,'../data/architecture/city-plans/clairfoyer-grid.json'),JSON.stringify(result)+'\n');console.log(JSON.stringify({revision:result.revision,rectangles:rectangles.length,summary:result.summary,paths:result.walkways.length,rejections}));
