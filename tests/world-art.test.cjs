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
 try{let response=once(worker,'message');worker.postMessage({kind:'init',raw:A.raw,ramps:api.RAMP});assert.equal((await response)[0].kind,'ready');const cx=Math.floor(A.prison.x/32),cy=Math.floor(A.prison.y/32);response=once(worker,'message');worker.postMessage({kind:'render',key:cx+','+cy,cx,cy});const image=(await response)[0];assert.equal(digest(image.data),digest(art.render(cx*512,cy*512).data));}finally{await worker.terminate();}
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
