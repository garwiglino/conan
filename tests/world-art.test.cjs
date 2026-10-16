const {test,before}=require('node:test'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {Worker}=require('node:worker_threads'),{once}=require('node:events');
const {loadGame,canvas}=require('./game-harness.cjs');
const A=require('../scripts/world-model.js')(require('../data/world/atlas.json'));
let api,art;before(async()=>{api=await loadGame();art=require('../scripts/world-terrain-art.js')(A,api.RAMP);});
const digest=data=>crypto.createHash('sha256').update(data).digest('hex');
test('terrain pixels agree in overlapping renders, across chunk edges in every climate',()=>{
 for(const biome of [1,4,6,7,8,9,10,11,12]){
  const c=A.cells.find(c=>c.land&&c.biome===biome),x=Math.floor(c.x/32)*512-31,y=Math.floor(c.y/32)*512-19,a=art.render(x,y,96,80),b=art.render(x+48,y+16,64,64);
  for(let j=0;j<64;j++)assert.deepEqual(a.data.slice(((j+16)*96+48)*4,((j+16)*96+96)*4),b.data.slice(j*64*4,(j*64+48)*4),'biome '+biome+' row '+j);
  assert.equal(digest(a.data),digest(art.render(x,y,96,80).data),'revisit '+biome);
 }
});
test('drawn road and bridge centres follow the routing geometry',()=>{
 const roads=A.roads.filter(r=>r.type!=='searoutes').filter((r,i)=>i%9===0);
 for(const r of roads){const p=A.atDistance(r,r.length*.37),x=Math.floor(p.x*16),y=Math.floor(p.y*16),draw=art.render(x-8,y-8,17,17);assert.ok([1,5].includes(draw.surface[8*17+8]),r.name);}
 for(const crossing of A.crossings.slice(0,6)){const x=Math.floor(crossing.x*16),y=Math.floor(crossing.y*16),draw=art.render(x-4,y-4,9,9);assert.equal(draw.surface[4*9+4],5,'bridge stays visible');}
});
test('all streamed biome props have native artwork and cold regions use cold decoration',()=>{
 const found=new Set();for(const biome of [1,4,6,7,8,9,10,11,12]){const c=A.cells.find(c=>c.land&&c.biome===biome),store=new A.ChunkStore(2);for(let k=0;k<3;k++){const chunk=store.get(Math.floor(c.x/32)+k,Math.floor(c.y/32));for(const p of chunk.props){assert.equal(typeof api.PROPS[p.kind],'function',p.kind);found.add(p.kind);if(biome===11)assert.ok(!['scrub','pebbles','palm'].includes(p.kind),p.kind);}}}assert.ok(found.size>=15);
});
test('the worker renders the same pixels as the synchronous fallback',async()=>{
 const worker=new Worker(`const {parentPort}=require('node:worker_threads');globalThis.onmessage=null;globalThis.postMessage=(data,transfer)=>parentPort.postMessage(data,transfer);${api.worldArtWorkerSource()};parentPort.on('message',data=>onmessage({data}));`,{eval:true});
 try{let response=once(worker,'message');worker.postMessage({kind:'init',raw:A.raw,ramps:api.RAMP});assert.equal((await response)[0].kind,'ready');const cx=Math.floor(A.prison.x/32),cy=Math.floor(A.prison.y/32);response=once(worker,'message');worker.postMessage({kind:'render',key:cx+','+cy,cx,cy});const image=(await response)[0];assert.equal(digest(image.data),digest(art.render(cx*512,cy*512).data));const town=A.byId['town-69'],sx=Math.floor(town.x/32),sy=Math.floor(town.y/32);for(const clock of [480,35040]){response=once(worker,'message');worker.postMessage({kind:'render',key:'season',cx:sx,cy:sy,clock});const result=(await response)[0];assert.equal(result.clock,clock);assert.equal(digest(result.data),digest(art.render(sx*512,sy*512,512,512,clock).data));}}finally{await worker.terminate();}
});
test('background terrain prefetch is bounded, deduplicated and tolerates a blocked worker',()=>{
 const messages=[],revoked=[];class FakeWorker{postMessage(m){messages.push(m);}terminate(){this.closed=true;}}
 const env={Worker:FakeWorker,Blob:class{},URL:{createObjectURL:()=> 'blob:terrain',revokeObjectURL:url=>revoked.push(url)}};
 const cache=new Map(),stream=new api.WorldArtStream(cache,()=>canvas.createCanvas(1,1),env);stream.prefetch(20,30);stream.prefetch(20,30);assert.equal(stream.pending.size,8);assert.equal(messages.filter(m=>m.kind==='render').length,8);stream.worker.onmessage({data:{kind:'ready'}});assert.deepEqual(revoked,['blob:terrain']);
 for(let i=0;i<40;i++)stream.worker.onmessage({data:{key:'test-'+i,width:1,height:1,data:new Uint8ClampedArray([12,34,56,255])}});assert.equal(cache.size,32);stream.worker.onerror();assert.equal(stream.failed,true);assert.equal(stream.pending.size,0);assert.doesNotThrow(()=>stream.prefetch(100,100));
 const unsupported=new api.WorldArtStream(new Map(),()=>canvas.createCanvas(1,1),{});assert.equal(unsupported.worker,null);
});
test('the fairy has a radial magic light following her bob, with transparent halo corners',()=>{
 const g=new api.Game(),cv=canvas.createCanvas(96,96),r=Object.create(api.Renderer.prototype);r.c=cv.getContext('2d');r.g=g;r.W=r.H=96;g.time=.5;Object.assign(g.fairyActor,{x:48,y:60});r.npcDraw(g.fairyActor);const fy=Math.round(60-12+Math.sin(2)*2);assert.equal(r.c.getImageData(42,fy-6,1,1).data[3],0);const lights=r.magic();assert.ok(lights.G.some(l=>l[0]===48&&Math.abs(l[1]-(48+Math.sin(2)*2))<.001&&l[2]>=12));assert.ok(lights.L.some(l=>l[0]===48&&l[2]>=24));
});

test('Haut-Givre is snowy in cold season, thaws in summer, and keeps identical collision surfaces',()=>{
 const town=A.byId['town-69'],cell=A.cellAt(town.x,town.y);assert.equal(cell.biome,9);assert.ok(A.snowCover(9,cell.height,480)>.5);assert.equal(A.snowCover(9,cell.height,24*1440+480),0);
 const x=Math.floor(town.x*16)-64,y=Math.floor(town.y*16)-64,winter=art.render(x,y,128,128,480),summer=art.render(x,y,128,128,24*1440+480),snow=new Set(art.colors.snow.map(c=>parseInt(c.slice(1),16)));
 const count=im=>{let n=0;for(let i=0;i<im.data.length;i+=4)if(snow.has(im.data[i]*65536+im.data[i+1]*256+im.data[i+2]))n++;return n;};
 assert.ok(count(winter)>128*128*.3);assert.equal(count(summer),0);assert.deepEqual(winter.surface,summer.surface);assert.notEqual(digest(winter.data),digest(summer.data));
 const overlap=art.render(x+64,y+32,64,64,480);for(let j=0;j<64;j++)assert.deepEqual(winter.data.slice(((j+32)*128+64)*4,((j+32)*128+128)*4),overlap.data.slice(j*64*4,(j+1)*64*4));
});
test('all biomes have bounded seasonal cover, tropical lands stay clear and glaciers stay snowy',()=>{
 for(let day=0;day<96;day++)for(let b=0;b<13;b++){const cover=A.snowCover(b,75,day*1440);assert.ok(cover>=0&&cover<=1);if([0,1,3,5,7,12].includes(b))assert.equal(cover,0);if(b===11)assert.equal(cover,1);}
 assert.ok(A.snowCover(10,30,72*1440)>A.snowCover(10,30,24*1440));assert.ok(A.snowCover(6,90,72*1440)>A.snowCover(6,30,72*1440));
 for(const b of [10,11]){const c=A.cells.find(c=>c.land&&c.biome===b&&!A.curseCells.has(c.id));for(let i=0;i<100;i++){const p=A.propAt(c.x+i,c.y,4);assert.ok(!/pine|oak|palm|jungle|cypress/.test(p?.kind||''),p?.kind);}}
});
test('seasonal chunk invalidation replaces snowy foliage without changing solid tiles',()=>{
 const c=A.cellAt(A.byId['town-69'].x,A.byId['town-69'].y),store=new A.ChunkStore(2),cx=Math.floor(c.x/32),cy=Math.floor(c.y/32),winter=store.get(cx,cy);store.setClock(800);assert.equal(store.get(cx,cy),winter);store.setClock(24*1440+480);const summer=store.get(cx,cy);assert.notEqual(summer,winter);assert.deepEqual(summer.tiles,winter.tiles);assert.ok(!summer.props.some(p=>p.kind==='world_pine_1'));
});
test('late worker results cannot overwrite a newer season',()=>{
 class W{postMessage(){}terminate(){}}const cache=new Map(),stream=new api.WorldArtStream(cache,()=>canvas.createCanvas(1,1),{Worker:W,Blob:class{},URL:{createObjectURL:()=> 'blob:x',revokeObjectURL(){}}});
 stream.prefetch(1,1);stream.setClock(35040);stream.prefetch(1,1);const pending=stream.pending.size;
 stream.worker.onmessage({data:{key:'1,1',clock:480,width:1,height:1,data:new Uint8ClampedArray([1,2,3,255])}});assert.equal(cache.size,0);assert.equal(stream.pending.size,pending);
 stream.worker.onmessage({data:{key:'1,1',clock:35040,width:1,height:1,data:new Uint8ClampedArray([1,2,3,255])}});assert.equal(cache.size,1);
});
