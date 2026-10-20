'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),raw=require('../data/world/atlas.json'),create=require('../scripts/world-model'),O=require('../scripts/city-plans/orthogonal-network.cjs');
const A=create(raw),before=create({...raw,rectilinearRoads:undefined});
test('all 137 land roads are rectilinear while canonical graph identities, sites, docks and sea routes remain',()=>{
 assert.equal(A.roads.filter(r=>r.type!=='searoutes').length,137);assert.deepEqual([...A.edgeById.keys()].sort(),[...before.edgeById.keys()].sort());
 for(const n of before.nodes){const now=A.byId[n.id];assert.deepEqual([now.x,now.y,now.vertex],[n.x,n.y,n.vertex]);assert.ok(n.id==='camp'||A.findPath('camp',n.id),n.name);}
 for(const r of A.roads){const old=before.roadById[r.id];assert.deepEqual(r.modes,old.modes);if(r.type==='searoutes')assert.deepEqual(r.pts,old.pts);else{assert.ok(O.axisAligned(r.pts),r.id);assert.ok(Math.abs(r.referenceLength-old.length)<1e-6);assert.ok(r.length+1e-6>=r.referenceLength);}}
 assert.deepEqual(A.crossings,before.crossings);for(const c of A.crossings)assert.ok(A.roadById[c.road].segments.some(s=>A.project(c.x,c.y,s.a,s.b).d<1e-5),c.id);
});
test('the real road corridor stays walkable on land, including bends and bridge banks',()=>{
 let samples=0;for(const r of A.roads.filter(r=>r.type!=='searoutes'))for(const s of r.segments){const count=Math.max(1,Math.ceil(s.length/2));for(let i=0;i<=count;i++){const t=i/count,x=s.a[0]+(s.b[0]-s.a[0])*t,y=s.a[1]+(s.b[1]-s.a[1])*t;samples++;assert.ok(A.cellAt(x,y)?.land,r.id);assert.ok([1,5].includes(A.terrain(Math.floor(x),Math.floor(y))),r.id+' blocked surface');}}
 assert.ok(samples>150000);
});
test('travellers and civilian graph paths follow cardinal legs, with actual distances and unchanged speeds',()=>{
 assert.deepEqual(A.modes,before.modes);
 for(const n of A.nodes.filter(n=>n.id.startsWith('town-'))){const legs=A.findPath('camp',n.id),plan=A.routePlan('camp',n.id);assert.ok(legs&&plan);for(const l of legs){const a=A.vertices.get(l.from),b=A.vertices.get(l.to);if(l.mode!=='boat')assert.ok(O.axisAligned([a,b]),l.road);assert.ok(Math.abs(Math.hypot(a[0]-b[0],a[1]-b[1])-l.length)<1e-5);assert.ok(A.edgeById.has(l.edge));}
  const moves=plan.stages.filter(s=>s.kind==='move');assert.ok(Math.abs(moves.reduce((n,s)=>n+s.length,0)-plan.distance)<1e-5);for(const s of moves){if(s.mode!=='boat')assert.ok(O.axisAligned([s.from,s.to]),s.road);assert.ok(Math.abs(s.minutes*A.modes[s.mode].metresPerMinute-s.length)<1e-5);}
 }
});
