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
 for(const name of ['Igea','Teremor']){
  const c=A.cells.find(c=>c.land&&territory(c)===name&&c.biome===9);
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
 for(const [name,biomes]of [['Sarak',[1,2,4,6,12]],['Varan',[8,12]],['Tagon',[4,5,6,7,8]]])for(const b of biomes){
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
 const x=20786.1,y=13620.6,clock=69240,parts=A.environment(x,y).mix;
 const oldSnow=parts.reduce((s,p)=>s+a.climateAt(clock,p.biome,p.height,p.region).snow*p.weight,0);
 assert.ok(oldSnow>.4,'fixture reproduces the former blended-snow defect');
 const sky=a.worldClimateAt(clock,x,y);assert.ok(sky.temperature>4);assert.equal(sky.snow,0);assert.equal(sky.blizzard,0);assert.notEqual(sky.level,'snow');
});

test('warm island climate profiles also run inside the shipped terrain worker',async()=>{
 const {Worker}=require('node:worker_threads'),{once}=require('node:events');
 const worker=new Worker(`const {parentPort}=require('node:worker_threads');globalThis.onmessage=null;globalThis.postMessage=(data,transfer)=>parentPort.postMessage(data,transfer);${a.worldArtWorkerSource()};parentPort.on('message',data=>onmessage({data}));`,{eval:true});
 try{
  let response=once(worker,'message');worker.postMessage({kind:'init',raw:A.raw,ramps:a.RAMP});assert.equal((await response)[0].kind,'ready');
  for(const [name,biome]of [['Sarak',2],['Varan',8],['Tagon',6]]){
   const c=A.cells.find(c=>c.land&&territory(c)===name&&c.biome===biome&&(name!=='Sarak'||c.terrainBiome===11)),cx=Math.floor(c.x/32),cy=Math.floor(c.y/32),clock=104160;
   response=once(worker,'message');worker.postMessage({kind:'render',key:name,cx,cy,clock});
   const actual=(await response)[0],expected=a.WorldTerrainArt.render(cx*512,cy*512,512,512,clock);
   assert.deepEqual(actual.data,expected.data,name);
  }
 }finally{await worker.terminate();}
});


test('all 4230 land cells obey their territory throughout the complete 96-day year',()=>{
 const counts={},ranges={},warm=new Set(['Sarak','Varan','Tagon']);
 for(const c of A.cells.filter(c=>c.land)){
  const name=territory(c);counts[name]=(counts[name]||0)+1;ranges[name]??={min:Infinity,max:-Infinity};
  for(let day=0;day<96;day++)for(const hour of [2,8,14,20]){
   const clock=day*1440+hour*60,t=A.airTemperature(clock,c.biome,c.height,c.region),cover=A.snowCover(c.biome,c.height,clock,c.region);
   assert.ok(Number.isFinite(t));assert.ok(cover>=0&&cover<=1);ranges[name].min=Math.min(ranges[name].min,t);ranges[name].max=Math.max(ranges[name].max,t);
   if(warm.has(name)){assert.ok(t>6,`${name}:${c.id}:${t}`);assert.equal(cover,0);}
   if(c.biome===11){assert.ok(['Igea','Teremor'].includes(name));assert.equal(cover,1);}
  }
 }
 assert.deepEqual(counts,{Igea:1065,Teremor:1616,Sarak:1063,Varan:185,Tagon:301});
 assert.ok(ranges.Igea.min<-20);assert.ok(ranges.Teremor.min<0);assert.ok(ranges.Sarak.max>40);
});

test('Sarak has dry mountains, never imported taiga or permanent glaciers, including boundary mixtures',()=>{
 const changed=A.raw.cells.filter(row=>row[10]!==undefined);assert.equal(changed.length,115);
 for(const row of changed){const c=A.cellById.get(row[0]);assert.equal(territory(c),'Sarak');assert.equal(c.biome,2);assert.ok([9,11].includes(c.terrainBiome));}
 for(const c of A.cells.filter(c=>c.land&&territory(c)==='Sarak')){
  assert.ok(![9,10,11].includes(c.biome));
  for(const [x,y]of [[c.x,c.y],...Array.from({length:c.polygon.length/2},(_,i)=>[c.polygon[i*2]*.999+c.x*.001,c.polygon[i*2+1]*.999+c.y*.001])]){
   if(territory(A.cellAt(x,y))!=='Sarak')continue;
   for(const clock of [72*1440+120,24*1440+840]){
    const sky=a.worldClimateAt(clock,x,y);assert.ok(sky.temperature>6,`${c.id}:${sky.temperature}`);assert.equal(sky.snow,0);assert.equal(sky.blizzard,0);
    for(const p of A.environment(x,y).mix){assert.ok(![9,10,11].includes(p.biome));assert.equal(A.snowCover(p.biome,p.height,clock,p.region),0);}
   }
  }
 }
});

test('temperate marshes freeze in winter while Varan marshes remain mild',()=>{
 const temperate=A.cells.find(c=>c.land&&territory(c)==='Teremor'&&c.biome===12),humid=A.cells.find(c=>c.land&&territory(c)==='Varan'&&c.biome===12),clock=72*1440+120;
 assert.ok(A.airTemperature(clock,12,temperate.height,temperate.region)<0);
 assert.ok(A.snowCover(12,temperate.height,clock,temperate.region)>.5);
 assert.ok(A.airTemperature(clock,12,humid.height,humid.region)>10);
 assert.equal(A.snowCover(12,humid.height,clock,humid.region),0);
});

test('northern seas are cold, southern seas are warm, and water never becomes a snow collision surface',()=>{
 const seas=A.cells.filter(c=>!c.land),pick=name=>seas.find(c=>territory({region:A.environment(c.x,c.y).mix[0].region})===name);
 for(const name of ['Igea','Teremor','Sarak','Varan','Tagon']){
  const c=pick(name);assert.ok(c,name);const sky=a.worldClimateAt(72*1440+120,c.x,c.y),part=A.environment(c.x,c.y).mix[0];
  if(name==='Igea')assert.ok(sky.temperature<0);else if(['Sarak','Varan','Tagon'].includes(name)){assert.ok(sky.temperature>10);assert.equal(sky.snow,0);}
  assert.equal(A.snowCover(0,c.height,72*1440+120,part.region),0);assert.equal(A.terrain(c.x,c.y),3);
 }
});

test('weather does not contradict temperature anywhere on land, and Sarak is drier than the humid islands',()=>{
 for(const c of A.cells.filter(c=>c.land))for(const day of [0,24,48,72]){
  const sky=a.worldClimateAt(day*1440+120,c.x,c.y);
  for(const k of ['rain','snow','blizzard','cloud','fog','wind','storm'])assert.ok(Number.isFinite(sky[k])&&sky[k]>=0&&sky[k]<=1,k);
  if(sky.temperature>=2)assert.equal(sky.snow,0);if(sky.temperature<=-1)assert.equal(sky.rain,0);
  if(['Sarak','Varan','Tagon'].includes(territory(c)))assert.equal(sky.snow,0);
 }
 const mean=name=>{const c=A.cells.find(c=>c.land&&territory(c)===name&&c.biome===(name==='Sarak'?2:8));let water=0,n=0;for(let clock=0;clock<96*1440;clock+=120){const s=a.climateAt(clock,c.biome,c.height,c.region);water+=s.rain+s.snow;n++;}return water/n;};
 assert.ok(mean('Sarak')<mean('Varan')*.35);
});


test('former Sarak glaciers and taiga have no icy terrain, scenery, footsteps or inherited winter danger',()=>{
 const g=new a.Game(),snowColors=new Set(a.WorldTerrainArt.colors.snow.map(c=>parseInt(c.slice(1),16)));
 for(const original of [9,11]){
  const c=A.cells.find(c=>c.land&&territory(c)==='Sarak'&&c.terrainBiome===original),clock=72*1440+120,x=Math.floor(c.x),y=Math.floor(c.y);
  const winter=a.WorldTerrainArt.render(x*16,y*16,48,48,clock),summer=a.WorldTerrainArt.render(x*16,y*16,48,48,24*1440+840);
  assert.deepEqual(winter.surface,summer.surface);assert.deepEqual(winter.data,summer.data);
  for(let i=0;i<winter.data.length;i+=4)assert.ok(!snowColors.has(winter.data[i]*65536+winter.data[i+1]*256+winter.data[i+2]));
  for(let dx=-8;dx<=8;dx++)for(let dy=-8;dy<=8;dy++){
   const p=A.propAt(x+dx,y+dy,A.terrain(x+dx,y+dy),clock);if(p)assert.ok(!/snow_|winter|frostgrass|pine/.test(p.kind),p.kind);
  }
  Object.assign(g.player,A.toGame(c.x,c.y));g.clock=clock;g.bodyHeatGrace=-1;
  assert.equal(g.sky().snow,0);assert.equal(g.bodyHeat().bite,0);assert.equal(a.civilianBiome(g,g.player),'aride');
  assert.notEqual(a.footSurface(g,g.player),'snow');
 }
});

test('marine winter gales create and resolve real storm events without inventing lightning',()=>{
 assert.equal(A.marineWeatherHazard({storm:0,wind:.45,blizzard:0}),false);
 assert.equal(A.marineWeatherHazard({storm:0,wind:.75,blizzard:.4}),true);
 const g=new a.Game(),w=g.worldState,at=g.clock+60;
 w.advance(at,()=>({temperature:-12,rain:0,snow:.8,blizzard:.4,wind:.75,storm:0}));
 assert.ok(w.active(at).some(e=>e.type==='storm'));
 w.advance(at+60,()=>({temperature:8,rain:0,snow:0,blizzard:0,wind:.2,storm:0}));
 assert.equal(w.active(at+60).some(e=>e.type==='storm'),false);
});
