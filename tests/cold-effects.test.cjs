const {test,before}=require('node:test'),assert=require('node:assert/strict');
const {loadGame,canvas}=require('./game-harness.cjs');let a;before(async()=>a=await loadGame());
test('cover evolves within the day, remains continuous at midnight and shares the air temperature',()=>{
 const A=a.Atlas;assert.notEqual(A.snowCover(9,30,480),A.snowCover(9,30,800));
 assert.ok(Math.abs(A.snowCover(9,30,1440-.001)-A.snowCover(9,30,1440+.001))<.0001);
 for(const b of [1,6,9,11])assert.equal(A.airTemperature(800,b,30),a.climateAt(800,b,30).temperature);
 const cell=A.cells.find(c=>c.biome===7),store=new A.ChunkStore(2),cx=Math.floor(cell.x/32),cy=Math.floor(cell.y/32),chunk=store.get(cx,cy);store.setClock(90000);assert.equal(store.get(cx,cy),chunk);
});
test('stream retains old art, accepts matching thermal revisions and rejects outdated snow without unbounded jobs',()=>{
 const messages=[];class Worker{postMessage(m){messages.push(m);}terminate(){}}
 const cache=new Map(),stream=new a.WorldArtStream(cache,()=>canvas.createCanvas(1,1),{Worker,Blob:class{},URL:{createObjectURL:()=>'',revokeObjectURL(){}}});
 const town=a.Atlas.byId['town-69'],cx=Math.floor(town.x/32),cy=Math.floor(town.y/32),key=cx+','+cy;
 stream.request(cx,cy);const initial=messages.at(-1),old=canvas.createCanvas(1,1);old.snowKey=initial.snowKey;cache.set(key,old);
 stream.setClock(800);assert.equal(cache.get(key),old);assert.equal(stream.pending.size,1);
 const reply=m=>stream.worker.onmessage({data:{...m,width:1,height:1,data:new Uint8ClampedArray([1,2,3,255])}});
 reply(initial);assert.equal(cache.get(key),old);assert.equal(stream.pending.size,0);
 stream.request(cx,cy);const fresh=messages.at(-1);reply(fresh);assert.notEqual(cache.get(key),old);assert.equal(stream.current(key,cx,cy),true);
 for(let i=0;i<100;i++){stream.setClock(800+i);stream.prefetch(cx+i,cy);}assert.ok(stream.pending.size<=8);assert.ok(cache.size<=32);
});
test('breathing respects body type, small world-anchored pixel puffs fade and warm air stops emissions',()=>{
 for(const n of [{id:'fairy',look:'nomade'},{look:'skeleton',race:'human'},{race:'snake'},{look:'nomade',spirit:true},{look:'nomade',hp:0},{look:'nomade',breathes:false}])assert.equal(a.coldBreathProfile(n),null);
 assert.ok(a.coldBreathProfile({look:'nomade'}));assert.ok(a.coldBreathProfile({race:'goblin'}));assert.ok(a.coldBreathProfile({kind:'transport_horse'}));
 const g=new a.Game(),town=a.Atlas.byId['town-69'],pos=a.Atlas.toGame(town.x,town.y),n={id:'breath-test',...pos,look:'nomade',dir:1},calls=[];
 const r=Object.create(a.Renderer.prototype);Object.assign(r,{g,W:320,H:180,cam:{x:n.x-100,y:n.y-100},c:{save(){},restore(){},fillRect(x,y,w,h){calls.push({x,y,w,h,alpha:this.globalAlpha});}}});
 let peak=0,emitted=false;for(let i=0;i<400;i++){g.time=i/60;calls.length=0;r.coldBreath(n);peak=Math.max(peak,calls.length);if(calls.length){emitted=true;for(const p of calls){assert.equal(p.x,Math.round(p.x));assert.equal(p.y,Math.round(p.y));assert.ok(p.alpha<=.58);assert.ok(Math.abs(p.x-n.x)<20);assert.ok(p.y<n.y-6);}}}
 assert.ok(emitted);assert.ok(peak<=7);g.clock=24*1440+800;g.time+=.1;calls.length=0;r.coldBreath(n);assert.equal(calls.length,0);
});
test('site snow refresh preserves transport props and compact HUD shows temperature without a new row',()=>{
 const g=new a.Game(),town=a.Atlas.byId['town-69'],p=a.Atlas.toGame(town.x,town.y),cv=canvas.createCanvas(640,400),r=new a.Renderer(cv,canvas.createCanvas(1,1),g);r.resize(320,200,{t:0,b:0,l:0,r:0},2);
 Object.assign(g.player,p);g.dialogue=null;g.updateLocation(0);const props=g.atlasProps,transport=props.filter(o=>o.kind.startsWith('transport_')),before=transport.map(o=>o.kind);
 r.frame();assert.ok(r.breathActors.has(g.player));g.clock=24*1440+480;r.frame();assert.equal(g.atlasProps,props);assert.deepEqual(transport.map(o=>o.kind),before);assert.equal(r.hudRows,1);assert.equal(r.top,22);assert.equal(r.temperatureReadout.temperature,Math.round(g.sky().temperature));
});
