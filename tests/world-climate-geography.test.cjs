const {test,before}=require('node:test'),assert=require('node:assert/strict');
const {loadGame}=require('./game-harness.cjs');let a,A;
before(async()=>{a=await loadGame();A=a.Atlas;});
const territory=c=>A.regions.get(c.region)?.territory;

test('every actual Varan and Tagon cell stays above freezing with no snow across the complete year',()=>{
 const cells=A.cells.filter(c=>c.land&&['Varan','Tagon'].includes(territory(c)));
 assert.equal(cells.length,486);
 for(const c of cells)for(let day=0;day<96;day++)for(const hour of [2,8,14,20]){
  const clock=day*1440+hour*60,s=a.climateAt(clock,c.biome,c.height,c.region);
  assert.ok(s.temperature>6,`${territory(c)} cell ${c.id}: ${s.temperature}`);
  assert.equal(s.snow,0);assert.equal(s.blizzard,0);
  assert.equal(A.snowCover(c.biome,c.height,clock,c.region),0);
 }
});

test('geography distinguishes island vegetation from continental winter without removing mountain cooling',()=>{
 for(const [name,biomes]of [['Varan',[8]],['Tagon',[4,6,8]]])for(const b of biomes){
  const c=A.cells.find(c=>c.land&&territory(c)===name&&c.biome===b),clock=72*1440+120;
  assert.ok(A.snowCover(b,c.height,clock)>0,'the old biome-only rule reproduces the defect');
  assert.equal(A.snowCover(b,c.height,clock,c.region),0);
  assert.ok(A.airTemperature(clock,b,100,c.region)<A.airTemperature(clock,b,30,c.region));
 }
 for(const name of ['Igea','Teremor','Sarak']){
  const c=A.cells.find(c=>c.land&&territory(c)===name&&c.biome===(name==='Sarak'?2:9));
  assert.ok(A.snowCover(c.biome,c.height,72*1440,c.region)>.1,name);
 }
});

test('real island centres, polygon boundaries and coasts have coherent precipitation and labels',()=>{
 const cs=A.cells.filter(c=>c.land&&['Varan','Tagon'].includes(territory(c)));
 for(const c of cs)for(const [x,y]of [[c.x,c.y],[c.polygon[0],c.polygon[1]]])for(const clock of [480,24*1440+120,72*1440+120,104160]){
  const s=a.worldClimateAt(clock,x,y);
  if(s.temperature>=2)assert.equal(s.snow,0);
  if(s.temperature<=-1)assert.equal(s.rain,0);
  assert.equal(s.level,s.snow>.02?'snow':s.rain<.04?'dry':s.rain<.35?'light':s.rain<.7?'steady':'downpour');
  assert.equal(s.kind,s.snow>.02?'snow':s.rain>.7?'shower':s.rain>.03?'steady':'clear');
  for(const p of A.environment(x,y).mix){assert.ok(Number.isFinite(p.height));assert.ok(Number.isFinite(p.region));}
 }
});

test('island terrain, scenery and footsteps use the same warm climate, and collision surfaces stay seasonal',()=>{
 const art=a.WorldTerrainArt,g=new a.Game(),winter=72*1440+120;
 const snowColors=new Set(art.colors.snow.map(c=>parseInt(c.slice(1),16)));
 for(const [name,biomes]of [['Varan',[8,12]],['Tagon',[4,5,6,7,8]]])for(const b of biomes){
  const c=A.cells.find(c=>c.land&&territory(c)===name&&c.biome===b),x=Math.floor(c.x),y=Math.floor(c.y);
  const w=art.render(x*16,y*16,24,24,winter),s=art.render(x*16,y*16,24,24,24*1440+120);
  assert.deepEqual(w.surface,s.surface);
  for(let i=0;i<w.data.length;i+=4)assert.ok(!snowColors.has(w.data[i]*65536+w.data[i+1]*256+w.data[i+2]),name+':'+b);
  for(let dy=-4;dy<=4;dy++)for(let dx=-4;dx<=4;dx++){
   const prop=A.propAt(x+dx,y+dy,A.terrain(x+dx,y+dy),winter);
   if(prop)assert.ok(!/^snow_|winter|frostgrass/.test(prop.kind)&&!prop.kind.includes('_winter'));
  }
  const pos=A.toGame(x+.5,y+.5);g.clock=winter;g.tile=()=>0;
  assert.notEqual(a.footSurface(g,pos),'snow');
 }
});

test('warm island climate survives a saved winter arrival and cached chunk revisits',()=>{
 const g=new a.Game();g.clock=104160;
 const c=A.cells.find(c=>c.land&&territory(c)==='Tagon'&&c.biome===6);
 Object.assign(g.player,A.toGame(c.x,c.y));const sky=g.sky();assert.equal(sky.snow,0);
 const copy=new a.Game(JSON.parse(JSON.stringify(g.serialize())));assert.equal(JSON.stringify(copy.sky()),JSON.stringify(sky));
 const store=new A.ChunkStore(2),cx=Math.floor(c.x/32),cy=Math.floor(c.y/32);store.setClock(g.clock);
 const chunk=store.get(cx,cy);store.setClock(24*1440+120);assert.equal(store.get(cx,cy),chunk);
});


test('seasonal fronts stay continuous inside the monsoon as well as at front boundaries',()=>{
 for(const [biome,region]of [[3,0],[5,0],[4,13],[6,14]])for(let clock=480;clock<96*1440;clock+=7){
  const left=a.climateAt(clock-.001,biome,30,region),right=a.climateAt(clock+.001,biome,30,region);
  for(const key of ['rain','snow','wind','cloud','fog'])assert.ok(Math.abs(left[key]-right[key])<.001,`${biome}:${clock}:${key}`);
 }
});

test('a real cold coastal neighbour cannot produce flakes in warm mixed air',()=>{
 const x=51763.7,y=8588.1,clock=69240,parts=A.environment(x,y).mix;
 const oldSnow=parts.reduce((s,p)=>s+a.climateAt(clock,p.biome,p.height,p.region).snow*p.weight,0);
 assert.ok(oldSnow>.4,'fixture reproduces the former blended-snow defect');
 const sky=a.worldClimateAt(clock,x,y);assert.ok(sky.temperature>5);assert.equal(sky.snow,0);assert.equal(sky.blizzard,0);assert.notEqual(sky.level,'snow');
});

test('warm island climate profiles also run inside the shipped terrain worker',async()=>{
 const {Worker}=require('node:worker_threads'),{once}=require('node:events');
 const worker=new Worker(`const {parentPort}=require('node:worker_threads');globalThis.onmessage=null;globalThis.postMessage=(data,transfer)=>parentPort.postMessage(data,transfer);${a.worldArtWorkerSource()};parentPort.on('message',data=>onmessage({data}));`,{eval:true});
 try{
  let response=once(worker,'message');worker.postMessage({kind:'init',raw:A.raw,ramps:a.RAMP});assert.equal((await response)[0].kind,'ready');
  for(const [name,biome]of [['Varan',8],['Tagon',6]]){
   const c=A.cells.find(c=>c.land&&territory(c)===name&&c.biome===biome),cx=Math.floor(c.x/32),cy=Math.floor(c.y/32),clock=104160;
   response=once(worker,'message');worker.postMessage({kind:'render',key:name,cx,cy,clock});
   const actual=(await response)[0],expected=a.WorldTerrainArt.render(cx*512,cy*512,512,512,clock);
   assert.deepEqual(actual.data,expected.data,name);
  }
 }finally{await worker.terminate();}
});
