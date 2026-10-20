'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),{Worker}=require('node:worker_threads'),{once}=require('node:events'),crypto=require('node:crypto'),fs=require('node:fs'),path=require('node:path');
const Env=require('../sprites/environnement/environment-iso.js'),DATA=require('../sprites/environnement/teremor-data.js'),E=Env(DATA);
const {PATTERNS,SIZE}=require('../scripts/environment/teremor-pavings.cjs'),{build}=require('../scripts/environment/build-environment.cjs');
const digest=a=>crypto.createHash('sha256').update(a).digest('hex');

test('game data is built from the current Piskel sources',async()=>{
 const {text}=await build();assert.equal(fs.readFileSync(path.join(__dirname,'../sprites/environnement/teremor-data.js'),'utf8'),text);
});
test('every texture uses the palette and tiles on the 2:1 screen grid',()=>{
 const n=DATA.palette.length;
 // Les parois de falaise sont dépliées (hauteur = profondeur), pas raccordées en hauteur.
 for(const [id,t]of Object.entries(DATA.textures)){assert.equal(t.w%32,0,id);if(!id.startsWith('cliff'))assert.equal(t.h%16,0,id);}
 for(const set of Object.values(DATA.sets)){assert.ok(DATA.pieces[set.forme],set.forme);assert.ok(DATA.textures[set.matiere],set.matiere);}
 for(const kind of ['setts','flags','bricks','fan'])for(const axis of ['','_v'])assert.ok(DATA.textures[kind+axis],kind+axis);
 // Les indices décodés restent dans la palette.
 const out=E.render({sampler:{tile:()=>({code:2,paving:'fan'})},base:[0,0],screen:[0,0],tiles:[4,4],width:160,height:96,ox:80,oy:16});
 assert.ok(out.indices.every(v=>v<n));
});
test('town pavings repeat seamlessly along the street axes',()=>{
 for(const [kind,pattern]of Object.entries(PATTERNS)){const [W,H]=SIZE[kind],key=(x,y)=>pattern(y+.5+(x+.5)/2,y+.5-(x+.5)/2).key;
  for(let y=0;y<H;y+=3)for(let x=0;x<W;x+=5){assert.equal(key(x+W,y),key(x,y),kind);assert.equal(key(x,y+H),key(x,y),kind);}}
});
test('neighbouring path pieces meet with the same width at shared edges',()=>{
 const level=(p,lu,lv)=>DATA.levelOf[p.px[Math.floor((lu+lv)/2)*64+Math.floor(lu-lv+32)]]?1:0;
 const edge=(p,e,t)=>e==='N'?level(p,t,1):e==='E'?level(p,31,t):e==='S'?level(p,t,31):level(p,1,t);
 const width=(p,e)=>{let n=0;for(let t=.5;t<32;t++)n+=edge(p,e,t);return n;};
 for(const [name,list]of Object.entries(E.shapes)){
  const ref={N:width(list[5],'N'),S:width(list[5],'S'),E:width(list[10],'E'),W:width(list[10],'W')},tol=name==='ruisseau'?8:3;
  for(const [mask,p]of Object.entries(list))for(const [bit,e]of [[1,'N'],[2,'E'],[4,'S'],[8,'W']]){
   if(mask&bit){const w=width(p,e);assert.ok(Math.abs(w-ref[e])<=tol,name+' '+mask+' '+e+' '+w+'/'+ref[e]);}
   // La placette (aucune voisine) est une petite place qui peut toucher les bords.
   else if(name!=='ruisseau'&&+mask)assert.equal(edge(p,e,16),0,name+' '+mask+' '+e+' fermé');
  }
 }
});
test('a chunk is fully covered and only the selected tiles are drawn',()=>{
 const sampler={tile:(i,j)=>({code:(i*7+j*3)%11===0?4:i===9?3:0}),piece:(ci,cj)=>cj===2?[{set:'rangs',mask:10}]:null};
 const all=E.render({sampler,base:[512,1024],screen:[-512,768]});
 let holes=0;for(let k=0;k<all.priority.length;k++){const px=k%1024,py=(k-px)/1024,X=px-512+.5,Y=py-32+.5,u=Y+X/2,v=Y-X/2;if(u>=0&&v>=0&&u<512&&v<512&&all.data[k*4+3]!==255)holes++;}
 assert.equal(holes,0);assert.equal(digest(all.data),digest(E.render({sampler,base:[512,1024],screen:[-512,768]}).data));
 const half=E.render({sampler:{...sampler,use:i=>i<48},base:[512,1024],screen:[-512,768]});let strong=0,weak=0;
 for(let k=0;k<half.priority.length;k++){if(half.priority[k]===2){strong++;const px=k%1024,py=(k-px)/1024,X=px-512+.5,Y=py-32+.5,i=Math.floor((Y+X/2)/16)+32;assert.ok(i<48||i>=64,'case non choisie dessinée');}else if(half.priority[k]===1)weak++;}
 assert.ok(strong>0&&weak>0);
});
test('forest chunks render the same pixels in a worker and cooperatively; other biomes are unchanged',async()=>{
 const A=require('../scripts/world-model')(require('../data/world/atlas.json')),T=require('../sprites/terrain/terrain-isometric'),makeArt=require('../scripts/world-isometric-art');
 const town=A.byId['town-12'],cx=Math.round(town.x/32),cy=Math.round(town.y/32),art=makeArt(A,T,{core:[]},E),expected=art.render(cx*512,cy*512);
 assert.notEqual(digest(expected.data),digest(makeArt(A,T,{core:[]}).render(cx*512,cy*512).data));
 const other=A.prison,ox=Math.floor(other.x/32),oy=Math.floor(other.y/32);assert.notEqual(A.cellAt(other.x,other.y).biome,6);
 assert.equal(digest(art.render(ox*512,oy*512).data),digest(makeArt(A,T,{core:[]}).render(ox*512,oy*512).data));
 const source=`const {parentPort}=require('node:worker_threads'),A=require(${JSON.stringify(require.resolve('../scripts/world-model'))})(${JSON.stringify(A.raw)}),T=require(${JSON.stringify(require.resolve('../sprites/terrain/terrain-isometric'))}),ENV=(${Env.toString()})(${JSON.stringify(DATA)});parentPort.postMessage((${makeArt.toString()})(A,T,{core:[]},ENV).render(${cx*512},${cy*512}));`;
 const worker=new Worker(source,{eval:true});try{const [actual]=await once(worker,'message');assert.equal(digest(actual.data),digest(expected.data));assert.equal(actual.features.length,expected.features.length);}finally{await worker.terminate();}
});
