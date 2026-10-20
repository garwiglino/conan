'use strict';
const {test,before}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const data=require('../data/architecture/settlements.json'),A=require('../sprites/architecture/settlement-architecture'),localities=require('../sprites/architecture/localities'),{overlap,segmentRect}=require('../scripts/build-settlements.cjs'),{loadGame,canvas}=require('./game-harness.cjs');let a;
before(async()=>a=await loadGame());
test('all 83 canonical localities have native regional districts without moving their centres',()=>{
 assert.equal(data.sites.length,83);assert.equal(data.layout,a.Atlas.layout.id);assert.equal(data.tilePixels,16);
 const ids=new Set();for(const s of data.sites){assert.ok(!ids.has(s.id));ids.add(s.id);const n=a.Atlas.byId[s.id],l=localities.find(l=>l.name===s.name);assert.equal(n.name,s.name);assert.equal(s.family,l.family);assert.equal(s.radius,n.radius);assert.ok(s.buildings.length>=8,s.name);assert.ok(s.buildings.filter(b=>b.role==='housing').length>=4,s.name+' houses');
  for(const b of s.buildings){const d=A.entry(b.id);assert.ok(d.family==='shared'||d.family===s.family);assert.ok(Number.isInteger(b.x)&&Number.isInteger(b.y));assert.ok(!['B14','X01','X03','X04','F04','F08'].includes(b.id),'No invented river, mineral deposit, shipyard or castle');if(s.layoutKind)assert.ok(b.foot.x>=s.bounds.x&&b.foot.y>=s.bounds.y&&b.foot.x+b.foot.w<=s.bounds.x+s.bounds.w&&b.foot.y+b.foot.h<=s.bounds.y+s.bounds.h);else assert.ok(Math.hypot(b.foot.x+b.foot.w/2,b.foot.y+b.foot.h/2)<n.radius*16);}
 }
});
test('district footprints do not overlap buildings, water, cliffs or existing road corridors',()=>{
 for(const s of data.sites){const n=a.Atlas.byId[s.id],p=a.Atlas.toGame(n.x,n.y),roads=a.Atlas.segments.filter(seg=>seg.r.type!=='searoutes'&&a.Atlas.project(n.x,n.y,seg.a,seg.b).d<n.radius+32);
  for(let i=0;i<s.buildings.length;i++){const b=s.buildings[i],r=b.foot;for(let j=0;j<i;j++)assert.ok(!overlap(r,s.buildings[j].foot,8),s.name+' overlap');
   for(const road of roads){const x=road.a.slice(0,2).map((v,i)=>(v-[n.x,n.y][i])*16),y=road.b.slice(0,2).map((v,i)=>(v-[n.x,n.y][i])*16);assert.ok(segmentRect(x,y,r)>road.r.width*8+12,s.name+' road blocked');}
   for(let y=r.y;y<=r.y+r.h;y+=8)for(let x=r.x;x<=r.x+r.w;x+=8){const w=a.Atlas.toWorld(p.x+x,p.y+y),t=a.Atlas.terrain(Math.floor(w.x),Math.floor(w.y));assert.ok(![3,8].includes(t),s.name+'/'+b.id+' invalid ground');}
  }
 }
});
test('all native entrances and staffed transport arrivals are clear in the actual engine',()=>{
 const g=new a.Game();assert.equal(g.architectureProps.length,0);let total=0;for(const s of g.settlements.sites.values()){assert.ok(g.stationLanding(s.id),s.id+' arrival');for(const b of s.buildings){const door=b.geometry.portals[0];if(!door){total++;continue;}const p={x:door.x+door.nx*20,y:door.y+door.ny*20};assert.ok(!g.solid(p.x,p.y,4,0),b.uid+' entrance');total++;}}
 assert.equal(total,data.sites.reduce((n,s)=>n+s.buildings.length,0));assert.equal(g.settlements.sites.has('camp'),false);assert.equal(g.settlements.sites.has('dock-road-132-a'),false);
});
test('work sockets keep existing identities, population and production; danger and snow stop work',()=>{
 const g=new a.Game(),population=JSON.stringify(Object.fromEntries(Object.entries(g.worldState.simulation.state.sites).map(([id,s])=>[id,[s.population,s.workers,s.stock,s.treasury]]))),people=g.npcs.length;
 g.stepCivilianAnimations(.04);assert.ok([...g.humanWorkstations.values()].filter(w=>w.actor).length>5);assert.equal(g.npcs.length,people);assert.equal(JSON.stringify(Object.fromEntries(Object.entries(g.worldState.simulation.state.sites).map(([id,s])=>[id,[s.population,s.workers,s.stock,s.treasury]]))),population);
 for(const [id,w]of g.humanWorkstations){if(!w.actor||w.cityFixture)continue;const n=g.npcs.find(n=>n.id===id);assert.ok(n.resident);assert.ok(!g.solid(...w.feet,4,0));assert.ok(!g.solid(...w.approach,4,0));assert.ok(g.worldState.simulation.systems.jobCanProduce(g.worldState.simulation.state.sites[n.labourSite||n.site],n.civilian.job));}
 const [id,w]=[...g.humanWorkstations].find(([id,w])=>w.actor&&!w.cityFixture&&w.id==='workbench'),n=g.npcs.find(n=>n.id===id);n.x=w.feet[0];n.y=w.feet[1];n.civilian.restClock=0;g.time+=.1;g.stepCivilianAnimations(.04);g.time+=.1;g.stepCivilianAnimations(.04);assert.equal(n.civilian.action,n.civilian.job);
 n.justiceReport={};g.stepCivilianAnimations(.04);assert.equal(n.civilian.action,'idle');delete n.justiceReport;n.dangerState={mode:'sheltered'};g.stepCivilianAnimations(.04);assert.notEqual(n.civilian.action,n.civilian.job);
});
test('save/restore derives the same districts without serialising generated geometry or reviving the dead',()=>{
 const g=new a.Game();g.stepCivilianAnimations(.04);const n=g.npcs.find(n=>n.resident&&g.humanWorkstations.has(n.id));g.damageCivilian(n,99,g.player);assert.ok(n.civilian.dead);const saved=g.serialize(),h=new a.Game(saved);h.stepCivilianAnimations(.04);
 assert.equal(saved.architecture,undefined);assert.equal(h.settlements,g.settlements);assert.equal(h.npcs.find(p=>p.id===n.id).civilian.dead,true);assert.ok(h.humanWorkstations.has(n.id),'A death must not remove furniture');assert.deepEqual([h.humanWorkstations.get(n.id).x,h.humanWorkstations.get(n.id).y],[g.humanWorkstations.get(n.id).x,g.humanWorkstations.get(n.id).y]);assert.equal(h.settlementDiagnostics().buildings,g.settlementDiagnostics().buildings);
});
test('architecture draws visible roofs by their full bounds, including negative coordinates, without querying every town',()=>{
 const g=new a.Game(),r=new a.Renderer(canvas.createCanvas(640,400),canvas.createCanvas(1,1),g);r.resize(320,200,{t:0,b:0,l:0,r:0},2);const b=g.settlements.buildings.find(b=>b.x<0),f=A.entry(b.id).frames[b.dir];const projection=require('../scripts/world-projection'),at=projection.point(b.x,b.y);r.cam={x:at.x-40,y:at.y-f.size[1]-5};r.logicalGame=g;r.projectionView=projection.display(g);r.projectionActive=true;const objects=r.architectureDrawObjects();assert.ok(objects.some(o=>o.architecture===b.uid));assert.ok(objects.length<300);assert.ok(objects.every(o=>o.always));const visible=r.visibleAtlasProps();for(const o of g.atlasProps)if(/^(world_(oak|pine|cypress|boulder)|palm)/.test(o.kind))assert.ok(visible.some(v=>(v._logical||v)===o),'A static natural collider must remain visible');
});
test('every doorway connects through the walkable district to its existing centre',()=>{
 const g=new a.Game();for(const s of g.settlements.sites.values()){
  if(s.layoutKind)continue; // Full authored street/threshold sweeps are covered by city-integration.test.cjs.
  const node=a.Atlas.byId[s.id],p=a.Atlas.toGame(node.x,node.y),sx=Math.floor(p.x/16),sy=Math.floor(p.y/16),limit=Math.ceil(node.radius)+3,seen=new Set(),q=[[sx,sy]],free=new Map(),key=(x,y)=>x+','+y;
  const open=(x,y)=>{const k=key(x,y);if(!free.has(k))free.set(k,!g.solid(x*16+8,y*16+8,4,0));return free.get(k);};
  seen.add(key(sx,sy));for(let head=0;head<q.length;head++){const [x,y]=q[head];for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy,k=key(nx,ny);if((s.layoutKind?(nx*16<p.x+s.bounds.x-64||nx*16>p.x+Math.max(s.bounds.x+s.bounds.w,64)||ny*16<p.y+s.bounds.y-64||ny*16>p.y+s.bounds.y+s.bounds.h+64):Math.abs(nx-sx)>limit||Math.abs(ny-sy)>limit)||seen.has(k)||!open(nx,ny))continue;seen.add(k);q.push([nx,ny]);}}
  for(const b of s.buildings){const d=b.geometry.portals[0];if(!d)continue;const end={x:d.x+d.nx*20,y:d.y+d.ny*20},tx=Math.floor(end.x/16),ty=Math.floor(end.y/16);let connected=false;
   for(let dy=-1;dy<=1&&!connected;dy++)for(let dx=-1;dx<=1&&!connected;dx++){const from={x:(tx+dx)*16+8,y:(ty+dy)*16+8};if(seen.has(key(tx+dx,ty+dy))&&g.npcSegmentFree({level:0},from,end))connected=true;}
   assert.ok(connected,b.uid+' disconnected entrance');
  }
 }
});
test('assigned work sockets have an actual local walking route and a physical shelter for artisans',()=>{
 const g=new a.Game();g.stepCivilianAnimations(.04);for(const [id,w]of g.humanWorkstations){if(!w.actor||w.cityFixture)continue;const n=g.npcs.find(n=>n.id===id),goal={x:w.feet[0],y:w.feet[1]},route=a.Atlas.localPath(g.settlements.sites.get(n.site).layoutKind?{x:w.approach[0],y:w.approach[1]}:a.Atlas.toGame(a.Atlas.byId[n.site].x,a.Atlas.byId[n.site].y),goal,(x,y)=>!g.solid(x,y,4,0));assert.ok(route.length,id+' unreachable work');if(w.id!=='crop_patch'){assert.equal(w.sheltered,true);const building=g.settlements.buildings.find(b=>b.uid===w.building);assert.ok(building&&A.entry(building.id).openHall);}}
});

test('stationary work stops when every required input or deposit is exhausted',()=>{
 const g=new a.Game();g.stepCivilianAnimations(.04);const [id,w]=[...g.humanWorkstations].find(([id,w])=>w.actor&&!w.cityFixture&&w.id==='workbench'),n=g.npcs.find(n=>n.id===id),site=g.worldState.simulation.state.sites[n.labourSite||n.site];
 n.x=w.feet[0];n.y=w.feet[1];n.civilian.lastX=n.x;n.civilian.lastY=n.y;n.civilian.moveTime=-1;n.civilian.restClock=0;g.time+=.1;g.stepCivilianAnimations(.04);assert.equal(n.civilian.action,n.civilian.job);
 for(const key of Object.keys(site.stock))site.stock[key]=0;for(const key of Object.keys(site.deposits))site.deposits[key]=0;
 g.time+=.1;g.stepCivilianAnimations(.04);assert.equal(n.civilian.action,'idle');assert.ok(g.humanWorkstations.has(id));
});
test('initial residents remain free after carts and service equipment are installed',()=>{
 const g=new a.Game();for(const n of g.npcs.filter(n=>n.resident&&!n.civilian?.dead))assert.ok(!g.solid(n.x,n.y,4,0),n.id+' spawned inside equipment');
});
test('saved companions displaced by the new architecture recover a nearby free position',()=>{
 const g=new a.Game(),n=g.npcs.find(n=>n.resident&&!n.batracien&&g.settlements.sites.has(n.site));assert.ok(n);g.recruitCompanion(n);const b=g.settlements.buildings.find(b=>b.site===n.site&&!A.entry(b.id).openHall),r=b.geometry.foot;n.x=r.x+r.w/2;n.y=r.y+r.h/2;assert.ok(g.solid(n.x,n.y,4,0));const door=b.geometry.portals[0];g.placeSafely(door.x+door.nx*40,door.y+door.ny*40);const saved=g.serialize(),h=new a.Game(saved),restored=h.npcs.find(v=>v.id===n.id);assert.ok(h.party.some(v=>v.id===n.id));assert.ok(!h.solid(restored.x,restored.y,4,0));assert.ok(Math.hypot(restored.x-n.x,restored.y-n.y)<240);
});

test('new workers start at their authored workplace and living positions persist on reload',()=>{
 const g=new a.Game();assert.ok([...g.humanWorkstations.values()].filter(w=>w.actor).length>5);for(const [id,w]of g.humanWorkstations){if(!w.actor||w.cityFixture)continue;const n=g.npcs.find(n=>n.id===id);assert.ok(Math.hypot(n.x-w.feet[0],n.y-w.feet[1])<=2,id+' misplaced initial worker');}
 const [id,w]=[...g.humanWorkstations].find(([id,w])=>w.actor&&w.sheltered),n=g.npcs.find(n=>n.id===id);const candidates=[[16,0],[-16,0],[0,24],[0,-24]].map(([x,y])=>({x:n.x+x,y:n.y+y})),p=candidates.find(p=>!g.solid(p.x,p.y,4,0));assert.ok(p);Object.assign(n,p);const h=new a.Game(g.serialize()),restored=h.npcs.find(v=>v.id===id);assert.deepEqual([restored.x,restored.y],[n.x,n.y]);
});

test('standing workplaces do not render sitting poses without a physical seat',()=>{
 const g=new a.Game(),[id,w]=[...g.humanWorkstations].find(([id,w])=>w.actor&&!w.cityFixture&&w.id==='workbench'),n=g.npcs.find(n=>n.id===id);n.civilian.restClock=40;g.stepCivilianAnimations(.04);assert.equal(n.civilian.action,'idle');assert.equal(w.socket.support,null);
});

test('workers walk around a tabletop between clear tile centres instead of retrying a blocked edge',()=>{
 const g=new a.Game(),[id,w]=[...g.humanWorkstations].find(([id,w])=>w.actor&&!w.cityFixture&&w.id==='workbench'),n=g.npcs.find(n=>n.id===id),b=g.settlements.buildings.find(b=>b.uid===w.building),door=b.geometry.portals[0];Object.assign(n,{x:door.x+door.nx*30,y:door.y+door.ny*30});n.civilian.action='idle';n.civilian.elapsed=1;n.path=[];assert.ok(!g.solid(n.x,n.y,4,0));
 let steps=0;while(Math.hypot(n.x-w.feet[0],n.y-w.feet[1])>2&&steps++<800){const from={x:n.x,y:n.y};g.walkNpc(n,{x:w.feet[0],y:w.feet[1]},.04);assert.ok(Math.hypot(n.x-from.x,n.y-from.y)<=1.281);assert.ok(!g.solid(n.x,n.y,4,0));}
 assert.ok(Math.hypot(n.x-w.feet[0],n.y-w.feet[1])<=2,'The real sweep must agree with the planned route');
});

test('a continental walking request fails before expanding local building indexes',()=>{
 const g=new a.Game(),n=g.npcs.find(n=>n.resident&&!n.batracien),index=g.settlements.collision,original=index.rect;index.rect=()=>{throw Error('A distant goal must not scan the world');};try{assert.equal(g.walkNpc(n,{x:n.x+10000000,y:n.y+10000000},.04),false);}finally{index.rect=original;}
});
