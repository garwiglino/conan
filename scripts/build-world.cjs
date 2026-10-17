const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const world=JSON.parse(fs.readFileSync(path.join(root,'data/world/atlas-source.json')));
const source=JSON.parse(fs.readFileSync(path.join(root,'data/world/azgaar-source.json')));
// The playable world is the compact layout: Azgaar distances divided by `scale`,
// settlements gathered into one pays per region, natural borders elsewhere.
const spec=JSON.parse(fs.readFileSync(path.join(root,'data/world/layout.json')));
const compact=require('./world-layout.cjs')(world,source,spec);
const geole=world.storySites.find(s=>s.name.startsWith('Geôle')),legacyAnchor=world.routes.flatMap(r=>r.points).find(p=>p[2]===geole.cell)||[geole.x,geole.y];
const data={version:2,seed:546366735,width:compact.width,height:compact.height,territories:world.territories,regions:world.regions,
 cells:compact.cells,sites:compact.sites,story:compact.story,zones:world.cursedZones,biomes:world.biomes,routes:compact.routes,rivers:compact.rivers,
 layout:{id:spec.id,scale:spec.scale,pays:compact.pays,wilds:compact.wilds,links:compact.links,shapes:compact.shapes,border:{wavelength:spec.border.wavelength},blend:spec.blend,
  legacy:{width:world.coordinateSystem.width,height:world.coordinateSystem.height,origin:[legacyAnchor[0]-23.5,legacyAnchor[1]-55.5]}}};
// Fine coastal detours keep a land road on land at metre scale. Azgaar centres
// can graze a bay when joined by a straight segment; the graph and drawing use
// the same added vertices. The native source remains an editable macro map.
const atlas=require('./world-model.js')(data);let vertex=-1;const refinements=[];
const clear=(a,b)=>{const len=Math.hypot(b[0]-a[0],b[1]-a[1]),steps=Math.ceil(len/75);for(let i=0;i<=steps;i++){const t=i/steps;if(!atlas.cellAt(a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t)?.land)return false;}return true;};
for(const r of data.routes){if(r.type==='searoutes')continue;for(let i=1;i<r.points.length;i++){const a=r.points[i-1],b=r.points[i];if(clear(a,b))continue;const len=Math.hypot(b[0]-a[0],b[1]-a[1]),nx=-(b[1]-a[1])/len,ny=(b[0]-a[0])/len;let detour=null;for(let offset=250;offset<=20000&&!detour;offset+=250)for(const side of [-1,1]){const points=[.25,.5,.75].map(t=>[a[0]+(b[0]-a[0])*t+nx*offset*side,a[1]+(b[1]-a[1])*t+ny*offset*side]);const line=[a,...points,b];if(line.every((q,j)=>!j||clear(line[j-1],q))){detour=points;break;}}if(!detour)throw Error('No dry coastal refinement for route '+r.id);for(const q of detour)q.push(vertex--);r.points.splice(i,0,...detour);refinements.push({route:r.id,points:detour});i+=detour.length;}}
data.refinements=refinements;
const boundaryEdges=new Map();
for(const cell of data.cells){if(!cell[3])continue;const poly=cell[9];for(let i=0;i<poly.length;i+=2){const j=(i+2)%poly.length,a=[poly[i],poly[i+1]],b=[poly[j],poly[j+1]],key=[a.join(','),b.join(',')].sort().join('|'),edge=boundaryEdges.get(key);if(edge){edge.other=cell[6];edge.shared=true;}else boundaryEdges.set(key,{a,b,region:cell[6],other:null,shared:false});}}
const regionById=Object.fromEntries(data.regions.map(r=>[r.id,r]));data.boundaries=[...boundaryEdges.values()].filter(e=>!e.shared||e.region!==e.other).map(e=>[...e.a,...e.b,!e.shared?'coast':regionById[e.region]?.territory===regionById[e.other]?.territory?'region':'territory']);

// Land behind the natural borders, sampled for the atlas map: run lengths per row,
// alternating open and closed and starting with open.
{const step=spec.maskStep,cols=Math.ceil(data.width/step),rows=[];for(let j=0;j*step<data.height;j++){const runs=[];let closed=false,run=0;for(let i=0;i<cols;i++){const x=(i+.5)*step,y=(j+.5)*step,v=!!atlas.cellAt(x,y)?.land&&!atlas.passable(x,y);if(v===closed)run++;else{runs.push(run);closed=v;run=1;}}runs.push(run);rows.push(runs);}data.layout.closed={step,cols,rows};}
fs.writeFileSync(path.join(root,'data/world/atlas.json'),JSON.stringify(data));
console.log(refinements.length+' coastal segments refined');
console.log(`${data.cells.length} macro cells, ${data.sites.length} settlements, ${data.routes.length} routes; compact layout ${spec.id}, ${data.width/1000} × ${data.height/1000} km`);
