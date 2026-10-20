'use strict';
const {test,before}=require('node:test'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const plan=require('../data/architecture/city-plans/clairfoyer-grid.json'),data=require('../data/architecture/settlements.json'),A=require('../sprites/architecture/settlement-architecture'),D=require('../sprites/architecture/clairfoyer-districts'),P=require('../sprites/decors/postes-isometriques'),Projection=require('../scripts/world-projection'),{loadGame}=require('./game-harness.cjs');
let api,g,centre;before(async()=>{api=await loadGame();g=new api.Game();centre=api.Atlas.toGame(plan.anchor.x,plan.anchor.y);});
test('the approved city mixes unequal blocks, square courts, rectangles and offset right-angle junctions',()=>{
 assert.equal(plan.approval.userValidated,true);assert.equal(plan.approval.pushAllowed,true);assert.equal(plan.grid.uniformBlocks,false);
 assert.ok(plan.grid.rectangles.some(r=>r.orientation==='square'&&r.w===r.h));assert.ok(new Set(plan.wards.map(w=>w.bounds.w+','+w.bounds.h)).size>12);assert.ok(new Set(plan.grid.rowHeightsM).size>3);assert.ok(plan.grid.outline[0].length>4);
 assert.ok(plan.grid.rectangles.some(r=>r.orientation==='horizontal'&&r.w>r.h*2));assert.ok(plan.grid.rectangles.some(r=>r.orientation==='vertical'&&r.h>r.w*2));assert.ok(new Set(plan.grid.rectangles.map(r=>Math.min(r.w,r.h))).size>=4);
 for(const s of plan.streets)for(let i=1;i<s.points.length;i++)assert.ok(s.points[i][0]===s.points[i-1][0]||s.points[i][1]===s.points[i-1][1]);
 assert.equal(new Set(plan.buildings.filter(b=>/^(CF|CI)/.test(b.id)).map(b=>b.id)).size,36);assert.equal(plan.buildings.reduce((n,b)=>n+(b.plannedResidents||0),0),10629);assert.ok(plan.summary.housingCapacity>=10629);
 assert.equal(data.sites.length,83);assert.equal(g.settlements.sites.get('town-1').planRevision,plan.revision);assert.equal(g.settlements.sites.get('town-1').buildings.length,plan.buildings.length);
});
test('every offset street connects to the city network without a diagonal or a missing junction',()=>{
 const segments=plan.streets.flatMap(s=>s.points.slice(1).map((b,i)=>({id:s.id,a:s.points[i],b}))),touch=(p,q)=>{
  const bounds=s=>({x:Math.min(s.a[0],s.b[0]),y:Math.min(s.a[1],s.b[1]),w:Math.abs(s.b[0]-s.a[0]),h:Math.abs(s.b[1]-s.a[1])}),a=bounds(p),b=bounds(q);return a.x<=b.x+b.w&&a.x+a.w>=b.x&&a.y<=b.y+b.h&&a.y+a.h>=b.y;
 },seen=new Set([0]),queue=[0];for(let at=0;at<queue.length;at++)for(let i=0;i<segments.length;i++)if(!seen.has(i)&&touch(segments[queue[at]],segments[i])){seen.add(i);queue.push(i);}assert.equal(seen.size,segments.length);
 const vertical=segments.filter(s=>s.a[0]===s.b[0]),horizontal=segments.filter(s=>s.a[1]===s.b[1]);let junctions=0;
 for(const s of vertical)for(const p of [s.a,s.b])if(horizontal.some(h=>h.a[1]===p[1]&&p[0]>Math.min(h.a[0],h.b[0])&&p[0]<Math.max(h.a[0],h.b[0]))&&!vertical.some(v=>v!==s&&v.a[0]===p[0]&&(s.b[1]===p[1]?Math.min(v.a[1],v.b[1])===p[1]:Math.max(v.a[1],v.b[1])===p[1])))junctions++;
 assert.ok(junctions>=12,'offset streets should form real T junctions');
 const area=ring=>Math.abs(ring.reduce((n,p,i)=>{const q=ring[(i+1)%ring.length];return n+p[0]*q[1]-q[0]*p[1];},0))/2;assert.equal(area(plan.grid.outline[0]),plan.wards.reduce((n,w)=>n+w.bounds.w*w.bounds.h,0));
});
test('compiled district pixels preserve every authored color, anchor and native view',()=>{
 const hash=b=>crypto.createHash('sha256').update(b).digest('hex');for(const d of D.list())for(const dir of d.views){const p=A.pixels(d.id,{dir}),ref=D.gameAdapter.pixels(d.id,{dir});assert.equal(hash(p.data),hash(ref.data),d.id+'/'+dir);assert.deepEqual(p.anchor,ref.anchor);assert.deepEqual(p.origin,ref.origin);assert.equal(A.entry(d.id).frames[dir].size[0],ref.width);}
});
test('all city streets, thresholds and paths are walkable by the real player without crossing foundations',()=>{
 let samples=0;const failures=[];
 const check=(points,step,id)=>{for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i],count=Math.max(1,Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/step));for(let j=0;j<=count;j++){const x=centre.x+(a[0]+(b[0]-a[0])*j/count)*16,y=centre.y+(a[1]+(b[1]-a[1])*j/count)*16;samples++;if(g.solid(x,y,5,0)){failures.push({id,x,y});break;}}}};
 for(const s of plan.streets)check(s.points,1,s.id);for(const w of plan.walkways)check([w.threshold.points[0],...w.points],.5,w.building);
 assert.deepEqual(failures,[]);assert.ok(samples>70000);assert.equal(plan.walkways.length,plan.buildings.length);
});
test('placed furniture has independent sockets exactly aligned with projected native actor feet',()=>{
 const site=g.settlements.sites.get('town-1');assert.equal(site.fixtures.length,24);
 for(const f of site.fixtures){const w=g.humanWorkstations.get(f.uid),native=P.sockets(f.id).operator,anchor=Projection.point(w.x,w.y),feet=Projection.point(...w.feet);assert.equal(w.actor,null);assert.ok(Math.abs(feet.x-anchor.x-(native.feet[0]-64))<1e-8);assert.ok(Math.abs(feet.y-anchor.y-(native.feet[1]-96))<1e-8);assert.equal(g.solid(...w.approach,5,0),false,f.uid);if(['care_bed','sleeping_mat','apothecary_table'].includes(w.id))assert.equal(w.sheltered,true);}
 for(const id of Object.keys(P.ASSETS))assert.ok(api.HearthreaverIsometricStations.ASSETS[id]);
});
test('the whole approved house fades behind the hero while its physical foundation remains blocked',()=>{
 const Art=require('../scripts/architecture-render').createRenderer(A);Art.setCanvasFactory(require('@napi-rs/canvas').createCanvas);let found;
 for(const b of g.settlements.sites.get('town-1').buildings.filter(b=>b.id==='CF01')){const f=Art.frame(b),q=Projection.point(b.x,b.y),foot=b.geometry.foot;for(let y=foot.y-32;y<foot.y+foot.h&&!found;y+=2)for(let x=foot.x-12;x<foot.x+foot.w+12;x+=2)if(!g.solid(x,y,5,0)&&Art.obscures(f,{...b,...q},{...Projection.point(x,y),level:0})){found={b,x,y};break;}if(found)break;}
 assert.ok(found);const {b,x,y}=found,r={g:{player:{x,y,z:0,level:0},time:0},logicalGame:{player:{x,y,z:0,level:0}},projectionActive:true,c:require('@napi-rs/canvas').createCanvas(1,1).getContext('2d')};let rows;for(let i=0;i<80;i++){r.g.time+=1/60;rows=Art.objects(r,b);}assert.ok(rows.every(o=>o.architectureAlpha>=.32&&o.architectureAlpha<.33));const wall=b.geometry.solids.find(s=>s.zMin<=1&&s.zMax>22&&s.w>30),middle=wall.polygon.reduce((p,q)=>[p[0]+q[0]/4,p[1]+q[1]/4],[0,0]);assert.equal(g.solid(...middle,5,0),true);assert.equal(g.solid(x,y,5,0),false);
});

test('authored city areas update location names without changing the natural terrain',()=>{
 const fresh=require('../scripts/world-model')(require('../data/world/atlas.json')),site=g.settlements.sites.get('town-1'),n=fresh.byId['town-1'];
 const areas=site.districts.flatMap(d=>d.areas.map(r=>({x:n.x+r.x/16,y:n.y+r.y/16,w:r.w/16,h:r.h/16}))),r=areas[0],x=r.x+r.w/2,y=r.y+r.h/2,before=fresh.terrain(x,y);
 assert.notEqual(fresh.siteAt(x,y)?.id,'town-1');fresh.registerSettlementAreas('town-1',areas);assert.equal(fresh.siteAt(x,y).id,'town-1');assert.equal(fresh.terrain(x,y),before);assert.equal(new fresh.LocationTracker().update(x,y,0).site,'town-1');
 assert.notEqual(fresh.siteAt(n.x-1180,n.y-420)?.id,'town-1','the inset above the western blocks remains outside the city');
});
