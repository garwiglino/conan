'use strict';
const {test,before}=require('node:test'),assert=require('node:assert/strict'),{Worker}=require('node:worker_threads'),{once}=require('node:events'),crypto=require('node:crypto');
const P=require('../scripts/world-projection'),T=require('../sprites/terrain/terrain-isometric'),makeArt=require('../scripts/world-isometric-art'),A=require('../scripts/world-model')(require('../data/world/atlas.json'));
const {loadGame,canvas}=require('./game-harness.cjs');let api;before(async()=>{api=await loadGame();});
test('projection is reversible at distant and negative coordinates and controls remain screen-relative',()=>{
 for(const a of [[0,0],[-128,256],[2e7,-1e7],[44.4,73.8]]){const s=P.point(...a),q=P.inverse(s.x,s.y);assert.ok(Math.abs(q.x-a[0])<1e-8);assert.ok(Math.abs(q.y-a[1])<1e-8);}
 for(const [x,y]of [[1,0],[0,-1],[-1,0],[0,1],[.5,.5]]){const v=P.input(x,y),s=P.point(v.x,v.y);assert.ok(Math.abs(s.x*y-s.y*x)<1e-10);assert.ok(Math.hypot(v.x,v.y)<=1+1e-10);}
});
test('display views share identities and art caches without mutating save positions or navigation',()=>{
 const n={id:'one',x:12,y:22},g={player:n,npcs:[n],npcPresent(v){assert.equal(v,n);return true;},tile(x,y){assert.equal(x,n.x);assert.equal(y,n.y);return 1;}},v=P.display(g);
 assert.equal(v.game.player,v.game.npcs[0]);assert.deepEqual([v.game.player.x,v.game.player.y],[-10,17]);assert.equal(v.game.npcPresent(v.game.player),true);assert.equal(v.game.tile(-10,17),1);assert.throws(()=>{v.game.player.x=100;},/Cannot move/);
 v.game.player._img={cache:true};assert.equal(n._img.cache,true);assert.deepEqual([n.x,n.y],[12,22]);
});
test('the live renderer leaves authoritative actor positions and saves unchanged while centring the projected player',()=>{
 const g=new api.Game(),r=new api.Renderer(canvas.createCanvas(640,400),canvas.createCanvas(1,1),g);r.resize(320,200,{l:0,r:0,t:0,b:0},2);g.player.spawnFX=0;
 const before=[g.player.x,g.player.y],n=g.npcs.map(n=>[n.id,n.x,n.y]);r.frame();assert.deepEqual([g.player.x,g.player.y],before);assert.deepEqual(g.npcs.map(n=>[n.id,n.x,n.y]),n);assert.equal(r.g,g);assert.equal(r.projectionActive,false);
 const p=P.point(...before);assert.ok(Math.abs(p.x-r.cam.x-160)<1);assert.ok(Math.abs(p.y-r.cam.y-(200-r.top)/2-14)<1);assert.ok(r.atlasGround.size<=16);assert.ok(r.atlasArtStream.pending.size<=8);
 const h=new api.Game(JSON.parse(JSON.stringify(g.serialize())));assert.equal(h.player.x,g.player.x);assert.equal(h.player.y,g.player.y);assert.equal(h.clock,g.clock);
});
test('physical foundations project onto the actual native building footprint in every view',()=>{
 const Art=require('../sprites/architecture/architecture-game'),I=require('../sprites/architecture/architecture-isometric');
 for(const id of ['T01','T13','T09','F06'])for(const dir of Art.entry(id).views){const o={id,dir,x:300,y:400},g=Art.geometry(id,o),t=Art.transform(Art.entry(id),dir),p=P.point(o.x,o.y);for(const v of I.blueprint(id,{dir}).volumes.slice(0,3)){
  const logical=t.point(v.x,v.y),projected=P.point(logical[0],logical[1]);assert.ok(Number.isFinite(projected.x+projected.y+p.x+p.y));
 }assert.ok(g.solids.some(s=>s.polygon.every(p=>Math.abs(p[0]-s.x)<1e-5||Math.abs(p[0]-s.x-s.w)<1e-5)));}
});
test('worker and cooperative terrain render the same native pixels and cliff occluders',async()=>{
 const art=makeArt(A,T,{core:[]}),cx=Math.floor(A.prison.x/32),cy=Math.floor(A.prison.y/32),expected=art.render(cx*512,cy*512),factory=makeArt.toString(),raw=A.raw;
 const source=`const {parentPort}=require('node:worker_threads'),A=require(${JSON.stringify(require.resolve('../scripts/world-model'))})(${JSON.stringify(raw)}),T=require(${JSON.stringify(require.resolve('../sprites/terrain/terrain-isometric'))});parentPort.postMessage((${factory})(A,T,{core:[]}).render(${cx*512},${cy*512}));`;
 const worker=new Worker(source,{eval:true});try{const [actual]=await once(worker,'message'),digest=a=>crypto.createHash('sha256').update(a).digest('hex');assert.equal(actual.width,1024);assert.equal(actual.height,544);assert.equal(digest(actual.data),digest(expected.data));assert.equal(actual.features.length,expected.features.length);}finally{await worker.terminate();}
});
test('fractional atlas origins preserve integer core collision cells and the authored route widths',()=>{
 const g=new api.Game(),art=makeArt(A,T,{core:g.world.tiles,trails:g.world.trails});
 for(const [x,y]of [[10,10],[20,20],[25,55]]){const wx=Math.round(A.origin.x)+x,wy=Math.round(A.origin.y)+y,m=art.metadata(wx,wy,g.clock);assert.equal(m.sourceCode,g.world.tiles[y][x]);assert.ok(Array.isArray(m.routes));}
});
