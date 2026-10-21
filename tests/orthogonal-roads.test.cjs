'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),O=require('../scripts/city-plans/orthogonal-network.cjs'),T=require('../sprites/terrain/terrain-isometric');
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-6,`${a} != ${b}`);
test('cardinal conversion retains crossed and overlapping route identities and junctions',()=>{
 const input=[{id:'east-west',width:4,points:[[0,3],[10,3]]},{id:'north-south',width:4,points:[[4,-4],[4,8]]},{id:'reverse-overlap',width:2,points:[[8,3],[2,3]]}],out=O.build(input);
 assert.deepEqual(out.routes.map(r=>r.id),input.map(r=>r.id));assert.ok(out.routes.every(r=>O.axisAligned(r.points)));const node=out.nodes.find(n=>Math.hypot(n.point[0]-4,n.point[1]-3)<1e-8);assert.ok(node);assert.equal(node.edges.length,4);
 for(let i=0;i<input.length;i++){near(out.routes[i].referenceLengthM,O.length(input[i].points));assert.deepEqual(out.routes[i].points[0],input[i].points[0]);assert.deepEqual(out.routes[i].points.at(-1),input[i].points.at(-1));}
});
test('physical length is reported separately when a right-angle route must be longer',()=>{
 const r=O.build([{id:'diagonal',width:2,points:[[0,0],[30,40]]}]).routes[0];near(r.referenceLengthM,50);near(r.physicalLengthM,70);assert.ok(O.axisAligned(r.points));assert.equal(r.distancePolicy,'reference_and_geometry_separate_no_speed_compensation');
});
test('orthogonal raster has square ends and straight width, without rounded organic caps',()=>{
 const base={family:'grass',kind:'ground',mask:0,height:0,dir:0},d={...base,kind:'path',routes:[{a:[0,0],b:[16,0],width:4,orthogonal:true}]};let visible=0;
 for(let y=-7;y<=7;y++)for(let x=-7;x<=23;x++){const ground=T.top(base,x,y),paint=T.top(d,x,y),inside=x>-4&&x<20&&Math.abs(y)<4;if(!inside)assert.equal(paint,ground,`paint outside square corridor ${x},${y}`);else if(paint!==ground)visible++;}
 assert.ok(visible>70);assert.notEqual(T.top(d,-3,3),T.top(base,-3,3),'square corner must be filled');
});
test('all authored city streets, entrance paths and thresholds use only logical x/y axes',()=>{
 const p=require('../data/architecture/city-plans/clairfoyer.json'),ref=require('../data/architecture/city-plans/sources/clairfoyer-circulation-reference.json');assert.equal(p.streets.length,ref.streets.length);
 for(const r of p.streets){assert.ok(O.axisAligned(r.points),r.id);near(r.referenceLengthM,O.length(ref.streets.find(s=>s.id===r.id).points));near(r.physicalLengthM,O.length(r.points));}
 for(const r of p.walkways){assert.ok(O.axisAligned(r.points),r.id);assert.ok(O.axisAligned(r.threshold.points),r.id+' threshold');}assert.equal(p.activation.runtimeChanged,false);
});
test('world draft preserves every terrestrial route, vertex and bridge reference without activating it',()=>{
 const A=require('../scripts/world-model')({...require('../data/world/atlas.json'),rectilinearRoads:undefined}),p=require('../data/world/orthogonal-roads-draft.json'),source=A.roads.filter(r=>r.type!=='searoutes');assert.equal(p.roads.length,source.length);
 for(const r of source){const s=p.roads.find(s=>s.id===r.id);assert.ok(s,r.id);assert.ok(O.axisAligned(s.points),r.id);near(s.referenceLengthM,O.length(r.pts));for(const v of r.pts)assert.ok(s.points.slice(1).some((b,i)=>A.project(v[0],v[1],s.points[i],b).d<1e-5),`${r.id} vertex ${v[2]} missing`);}
 assert.equal(p.bridges.length,A.crossings.length);assert.ok(p.bridges.every(b=>b.preserved));assert.equal(p.runtimeChanged,false);assert.equal(p.pushAllowed,false);
});
