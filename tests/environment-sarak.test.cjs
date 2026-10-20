'use strict';
const {test,before}=require('node:test'),assert=require('node:assert/strict'),{Worker}=require('node:worker_threads'),{once}=require('node:events'),crypto=require('node:crypto'),fs=require('node:fs'),path=require('node:path');
const Env=require('../sprites/environnement/environment-iso.js'),DATA=require('../sprites/environnement/sarak-data.js'),FOREST=require('../sprites/environnement/teremor-data.js');
const {build}=require('../scripts/environment/build-environment.cjs'),{loadGame}=require('./game-harness.cjs');
const A=require('../scripts/world-model')(require('../data/world/atlas.json')),T=require('../sprites/terrain/terrain-isometric'),makeArt=require('../scripts/world-isometric-art');
const ENVS={forest:Env(FOREST),desert:Env(DATA)},digest=a=>crypto.createHash('sha256').update(a).digest('hex');
let api;before(async()=>{api=await loadGame();});

test('desert data is built from the current Piskel sources',async()=>{
 const {text}=await build('sarak');assert.equal(fs.readFileSync(path.join(__dirname,'../sprites/environnement/sarak-data.js'),'utf8'),text);
});
test('desert textures use their palette, tile on the 2:1 grid and every town paving runs both ways',()=>{
 const n=DATA.palette.length;
 for(const [id,t]of Object.entries(DATA.textures)){assert.equal(t.w%32,0,id);if(!id.startsWith('cliff'))assert.equal(t.h%16,0,id);}
 for(const set of Object.values(DATA.sets)){assert.ok(DATA.pieces[set.forme],set.forme);assert.ok(DATA.textures[set.matiere],set.matiere);}
 for(const kind of ['setts','flags','hex','cabochon'])for(const axis of ['','_v'])assert.ok(DATA.textures[kind+axis],kind+axis);
 for(const [k,c]of Object.entries(DATA.accents))assert.ok(DATA.names.includes(c),k);
 const out=Env(DATA).render({sampler:{tile:()=>({code:2,paving:'cabochon'})},base:[0,0],screen:[0,0],tiles:[4,4],width:160,height:96,ox:80,oy:16});
 assert.ok(out.indices.every(v=>v<n));
});
test('every desert and forest prop of the game has its redrawn sprite',()=>{
 const src=fs.readFileSync(path.join(__dirname,'../scripts/world-isometric-runtime.js'),'utf8'),m=src.match(/const FLORA_PROPS=(\{[\s\S]*?\n\});/),props=Function('return '+m[1])();
 for(const [family,data]of [['forest',FOREST],['desert',DATA]]){const names=new Set(Object.values(data.flora).flatMap(v=>v.frames.map(f=>f.name)));
  for(const [kind,list]of Object.entries(props[family]))for(const name of list)assert.ok(names.has(name),family+' '+kind+' '+name);}
});
test('the start zone is redrawn in the desert style while its walls keep their structure art',()=>{
 const g=new api.Game(),cfg={core:g.world.tiles,trails:g.world.trails},core=cfg.core,OX=Math.floor(A.origin.x),OY=Math.floor(A.origin.y),dU=(A.origin.x-OX)*16,dV=(A.origin.y-OY)*16;
 const cx=Math.floor(A.origin.x/32)+1,cy=Math.floor(A.origin.y/32)+1,now=makeArt(A,T,cfg,ENVS).render(cx*512,cy*512),old=makeArt(A,T,cfg).render(cx*512,cy*512),walls={n:0,same:0},ground={n:0,same:0};
 // Chaque pixel du secteur est rapporté à sa case de la carte locale (réseau décalé de l'origine).
 for(let py=0;py<544;py++)for(let px=0;px<1024;px++){const X=px-512+.5,Y=py-32+.5,u=Y+X/2,v=Y-X/2;if(u<0||v<0||u>=512||v>=512)continue;
  const c=core[Math.floor((cy*512+v-dV)/16)-OY]?.[Math.floor((cx*512+u-dU)/16)-OX];if(c===undefined||c===2||c===7)continue;
  const k=(py*1024+px)*4,s=[0,1,2,3].every(o=>now.data[k+o]===old.data[k+o]),b=c===6?walls:ground;b.n++;if(s)b.same++;}
 assert.ok(walls.n>1000&&ground.n>100000);assert.ok(walls.same/walls.n>.95,'murs : '+walls.same+'/'+walls.n);assert.ok(ground.same/ground.n<.02,'sol : '+ground.same+'/'+ground.n);
});
test('desert towns render the same pixels in a worker and cooperatively; other biomes are unchanged',async()=>{
 const town=A.byId['town-35'],cx=Math.round(town.x/32),cy=Math.round(town.y/32),art=makeArt(A,T,{core:[]},ENVS),expected=art.render(cx*512,cy*512);
 assert.ok([1,2].includes(A.cellAt(town.x,town.y).biome));assert.notEqual(digest(expected.data),digest(makeArt(A,T,{core:[]}).render(cx*512,cy*512).data));
 const other=A.byId['town-1'],ox=Math.floor(other.x/32),oy=Math.floor(other.y/32);assert.ok(![1,2,6].includes(A.cellAt(other.x,other.y).biome));
 assert.equal(digest(art.render(ox*512,oy*512).data),digest(makeArt(A,T,{core:[]}).render(ox*512,oy*512).data));
 const env='{'+Object.entries({forest:FOREST,desert:DATA}).map(([k,d])=>JSON.stringify(k)+':('+Env.toString()+')('+JSON.stringify(d)+')').join(',')+'}';
 const source=`const {parentPort}=require('node:worker_threads'),A=require(${JSON.stringify(require.resolve('../scripts/world-model'))})(${JSON.stringify(A.raw)}),T=require(${JSON.stringify(require.resolve('../sprites/terrain/terrain-isometric'))}),ENV=${env};parentPort.postMessage((${makeArt.toString()})(A,T,{core:[]},ENV).render(${cx*512},${cy*512}));`;
 const worker=new Worker(source,{eval:true});try{const [actual]=await once(worker,'message');assert.equal(digest(actual.data),digest(expected.data));assert.equal(actual.features.length,expected.features.length);}finally{await worker.terminate();}
});
