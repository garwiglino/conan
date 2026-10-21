'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),O=require('./city-plans/orthogonal-network.cjs'),create=require('./world-model');
const root=path.resolve(__dirname,'..'),digest=o=>crypto.createHash('sha256').update(JSON.stringify(o)).digest('hex');
function build(raw){
 const source={...raw};delete source.rectilinearRoads;const A=create(source),inputs=[],originals=new Map(),dockPoints=A.nodes.filter(n=>n.kind==='dock');
 for(const r of A.roads.filter(r=>r.type!=='searoutes'))for(const s of r.segments){
  const cuts=A.crossings.filter(c=>c.road===r.id).map(c=>({...A.project(c.x,c.y,s.a,s.b),id:c.id})).filter(c=>c.d<1e-5&&c.t>1e-7&&c.t<1-1e-7).sort((a,b)=>a.t-b.t),id='leg-'+inputs.length;
  const leg={id,road:r.id,width:r.width,from:s.a[2],to:s.b[2],points:[s.a.slice(0,2),...cuts.map(c=>[c.x,c.y]),s.b.slice(0,2)]};inputs.push(leg);originals.set(id,leg);
 }
 const valid=(p,width,edge)=>{
  if(!A.cellAt(...p)?.land||!A.passable(...p))return false;
  const nearDock=dockPoints.some(d=>Math.hypot(d.x-p[0],d.y-p[1])<6),pad=width/2+.4;
  if(!nearDock)for(const [dx,dy]of [[pad,0],[-pad,0],[0,pad],[0,-pad]])if(!A.cellAt(p[0]+dx,p[1]+dy)?.land||!A.passable(p[0]+dx,p[1]+dy))return false;
  const river=A.riverAt(...p);if(!river)return true;
  // Water is allowed only at an existing crossing/bank approach of this edge.
  // A new L bend must never create an unrelated bridge farther along the river.
  const a=edge.u.split(',').map(n=>Number(n)/1e6),b=edge.v.split(',').map(n=>Number(n)/1e6),q=A.project(...p,a,b),old=A.riverAt(q.x,q.y);
  if(old?.river.id===river.river.id)return true;
  return edge.sources.some(id=>A.crossings.some(c=>c.road===originals.get(id).road&&c.river===river.river.id&&Math.hypot(c.x-p[0],c.y-p[1])<river.river.width*1.6));
 };
 const converted=O.build(inputs,{sampleStep:2,valid,offsets:[0,-8,8,-16,16,-32,32,-64,64,-128,128]}),edges={},roads=[];
 for(const leg of converted.routes){const id=[leg.from,leg.to].sort().join('|'),old=edges[id],points=leg.points;if(old){const aligned=old.a===leg.from?old.points:old.points.slice().reverse();if(JSON.stringify(aligned)!==JSON.stringify(points))throw Error('Inconsistent shared route geometry '+id);}else edges[id]={a:leg.from,b:leg.to,points,referenceLengthM:leg.referenceLengthM,length:leg.physicalLengthM};}
 for(const r of A.roads.filter(r=>r.type!=='searoutes')){const parts=converted.routes.filter(l=>l.road===r.id),points=O.compact(parts.flatMap(p=>p.points));roads.push({id:r.id,name:r.name,type:r.type,width:r.width,points,referenceLengthM:r.length,physicalLengthM:O.length(points)});}
 const out={version:1,sourceHash:digest(source),policy:'original graph identities and bridge anchors; physical distances follow the right-angle geometry; no speed compensation',edges,bridges:A.crossings,roads,summary:{landRoutes:roads.length,originalEdges:Object.keys(edges).length,bridges:A.crossings.length,referenceLengthM:roads.reduce((n,r)=>n+r.referenceLengthM,0),physicalLengthM:roads.reduce((n,r)=>n+r.physicalLengthM,0),allAxisAligned:roads.every(r=>O.axisAligned(r.points))}};
 out.revision=digest(out).slice(0,16);return out;
}
if(require.main===module){const file=path.join(root,'data/world/atlas.json'),raw=JSON.parse(fs.readFileSync(file,'utf8'));raw.rectilinearRoads=build(raw);fs.writeFileSync(file,JSON.stringify(raw));fs.writeFileSync(path.join(root,'data/world/orthogonal-roads.json'),JSON.stringify(raw.rectilinearRoads)+'\n');console.log(JSON.stringify({revision:raw.rectilinearRoads.revision,...raw.rectilinearRoads.summary}));}
module.exports={build};
