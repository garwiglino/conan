'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),{Worker}=require('node:worker_threads'),{once}=require('node:events'),crypto=require('node:crypto'),fs=require('node:fs'),path=require('node:path');
const Env=require('../sprites/environnement/environment-iso.js'),DATA=require('../sprites/environnement/varan-data.js'),FOREST=require('../sprites/environnement/teremor-data.js'),DESERT=require('../sprites/environnement/sarak-data.js');
const {build}=require('../scripts/environment/build-environment.cjs');
const A=require('../scripts/world-model')(require('../data/world/atlas.json')),T=require('../sprites/terrain/terrain-isometric'),makeArt=require('../scripts/world-isometric-art');
const ENVS={forest:Env(FOREST),desert:Env(DESERT),marsh:Env(DATA)},digest=a=>crypto.createHash('sha256').update(a).digest('hex');

test('marsh data is built from the current Piskel sources',async()=>{
 const {text}=await build('varan');assert.equal(fs.readFileSync(path.join(__dirname,'../sprites/environnement/varan-data.js'),'utf8'),text);
});
test('marsh textures use their own palette, tile on the 2:1 grid and every street paving runs both ways',()=>{
 const n=DATA.palette.length;assert.ok(n<=256);
 for(const [id,t]of Object.entries(DATA.textures)){assert.equal(t.w%32,0,id);if(!id.startsWith('cliff'))assert.equal(t.h%16,0,id);}
 for(const set of Object.values(DATA.sets)){assert.ok(DATA.pieces[set.forme],set.forme);assert.ok(DATA.textures[set.matiere],set.matiere);}
 for(const kind of ['boards','logs','flags'])for(const axis of ['','_v'])assert.ok(DATA.textures[kind+axis],kind+axis);
 for(const [k,c]of Object.entries(DATA.accents))assert.ok(DATA.names.includes(c),k);
 const out=Env(DATA).render({sampler:{tile:()=>({code:2,paving:'logs'})},base:[0,0],screen:[0,0],tiles:[4,4],width:160,height:96,ox:80,oy:16});
 assert.ok(out.indices.every(v=>v<n));
});
test('every marsh prop of the game has its redrawn sprite',()=>{
 const src=fs.readFileSync(path.join(__dirname,'../scripts/world-isometric-runtime.js'),'utf8'),m=src.match(/const FLORA_PROPS=(\{[\s\S]*?\n\});/),props=Function('return '+m[1])();
 const names=new Set(Object.values(DATA.flora).flatMap(v=>v.frames.map(f=>f.name)));
 for(const [kind,list]of Object.entries(props.marsh))for(const name of list)assert.ok(names.has(name),kind+' '+name);
});
test('marsh towns render the same pixels in a worker and cooperatively; other biomes are unchanged',async()=>{
 const town=A.byId['town-1'],cx=Math.round(town.x/32),cy=Math.round(town.y/32),art=makeArt(A,T,{core:[]},ENVS),expected=art.render(cx*512,cy*512);
 assert.equal(A.cellAt(town.x,town.y).biome,12);assert.notEqual(digest(expected.data),digest(makeArt(A,T,{core:[]},{forest:ENVS.forest,desert:ENVS.desert}).render(cx*512,cy*512).data));
 const other=A.byId['town-63'],ox=Math.floor(other.x/32),oy=Math.floor(other.y/32);assert.ok(![1,2,6,12].includes(A.cellAt(other.x,other.y).biome));
 assert.equal(digest(art.render(ox*512,oy*512).data),digest(makeArt(A,T,{core:[]}).render(ox*512,oy*512).data));
 const env='{'+Object.entries({forest:FOREST,desert:DESERT,marsh:DATA}).map(([k,d])=>JSON.stringify(k)+':('+Env.toString()+')('+JSON.stringify(d)+')').join(',')+'}';
 const source=`const {parentPort}=require('node:worker_threads'),A=require(${JSON.stringify(require.resolve('../scripts/world-model'))})(${JSON.stringify(A.raw)}),T=require(${JSON.stringify(require.resolve('../sprites/terrain/terrain-isometric'))}),ENV=${env};parentPort.postMessage((${makeArt.toString()})(A,T,{core:[]},ENV).render(${cx*512},${cy*512}));`;
 const worker=new Worker(source,{eval:true});try{const [actual]=await once(worker,'message');assert.equal(digest(actual.data),digest(expected.data));assert.equal(actual.features.length,expected.features.length);}finally{await worker.terminate();}
});
