/* Transcribe approved concept furniture to integer JS grids. Natural art is
 * sampled unchanged from the game's own renderer, never from the concepts. */
'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto'),{createCanvas,loadImage}=require('@napi-rs/canvas'),{loadGame}=require('../tests/game-harness.cjs');
const root=path.resolve(__dirname,'..'),concepts=require('../data/humains/stations-concepts.json');
// Source rectangles exclude reference people, captions and socket annotations.
const boxes=[
[163,138,174,75,32,14],[594,132,98,82,16,14],[931,126,154,86,28,16],[1337,126,110,86,22,16],
[132,304,264,124,48,24],[574,308,166,116,30,24],[907,344,215,82,36,14],[1297,329,181,101,32,18],
[168,522,174,132,32,26],[544,564,183,94,32,16],[904,521,178,136,34,26],[1291,519,188,144,32,26],
[139,778,227,84,40,14],[541,732,204,141,36,26],[907,762,182,110,32,18],[1272,757,235,118,42,20],
[135,148,148,97,28,20],[526,150,148,96,28,18],[874,129,145,119,28,24],[1262,179,172,66,32,12],
[136,335,168,114,32,24],[521,338,155,114,28,24],[874,367,177,79,32,14],[1260,368,198,84,36,14],
[130,597,204,57,36,10],[527,602,159,56,28,10],[840,577,252,83,44,14],[1259,528,201,132,36,24],
[135,776,181,89,32,16],[544,757,115,108,22,20],[874,730,221,141,40,26],[1262,789,224,77,40,14],
[130,128,231,94,42,18],[524,130,197,96,36,18],[906,137,216,87,40,16],[1320,124,187,100,34,20],
[208,338,95,110,18,22],null,null,null,
[126,550,220,109,40,20],null,[912,556,190,105,32,18],[1308,556,202,104,36,20],
[129,784,231,87,40,14],[521,751,218,120,40,24],[906,751,207,120,38,22],[1304,754,145,118,28,22]
];
const palettes={wood:['100c14','33272a','4b332b','65432f','79533a','946742','ad8255','c7a67a'],stone:['100c14','3b3d40','525f69','7b8583','a9aaa0','d2cbb3'],clay:['764836','aa734d','d4a76e'],linen:['9f8a69','c6b28a','e4d5ac'],fire:['a24d2c','dc773b','f2bd5d']};
const palette=[...new Set(Object.values(palettes).flat())],alphabet='0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const rgb=h=>[0,2,4].map(i=>parseInt(h.slice(i,i+2),16)),colors=palette.map(rgb),dist=(a,b)=>a.reduce((s,v,i)=>s+(v-b[i])**2,0),nearest=c=>colors.map((p,i)=>[i,dist(p,c)]).sort((a,b)=>a[1]-b[1])[0][0];
const cyan=(r,g,b)=>g>145&&b>145&&r<g*.7,gold=(r,g,b)=>r>220&&g>180&&g<245&&b<145;
const naturalGreen=(r,g,b)=>g>r*1.12&&g>b*1.08;
const foreground=(r,g,b)=>(r<30&&g<26&&b<36)||(r>g*1.035&&r>b*1.04)||(Math.max(r,g,b)-Math.min(r,g,b)<24&&Math.max(r,g,b)>50);
const sourceHashes={};
(async()=>{
 const grids={},cache={};
 for(const [i,a]of concepts.assets.entries()){
  if(!boxes[i])continue;
  const file=path.join(root,a.concept.file);if(!cache[file]){const im=await loadImage(file),cv=createCanvas(im.width,im.height),c=cv.getContext('2d');c.drawImage(im,0,0);cache[file]={data:c.getImageData(0,0,cv.width,cv.height).data,width:cv.width};sourceHashes[a.concept.file]=crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');}
  const im=cache[file],[x,y,w,h,W,H]=boxes[i],rows=[],water=[],goldPoints=[];
  const sample=(X,Y)=>{const k=(Y*im.width+X)*4;return [im.data[k],im.data[k+1],im.data[k+2]];};
  for(let j=0;j<H;j++){let row='';for(let k=0;k<W;k++){
   let count=0,total=0,wet=0;const votes={};
   for(let Y=y+Math.floor(j*h/H);Y<y+Math.floor((j+1)*h/H);Y++)for(let X=x+Math.floor(k*w/W);X<x+Math.floor((k+1)*w/W);X++){
    const c=sample(X,Y),[r,g,b]=c;total++;
    if(cyan(...c)||naturalGreen(...c))continue;
    if(b>r*1.18&&g>r*1.1&&b>50){if(['quench_trough','feeding_trough','sluice','salt_basin','dock_bollard','bank_platform'].includes(a.id)){wet++;continue;}count++;const n=nearest(c);votes[n]=(votes[n]||0)+1;continue;}
    if(gold(...c)){goldPoints.push([k,j]);continue;}
    if(!foreground(...c))continue;
    count++;const n=nearest(c);votes[n]=(votes[n]||0)+1;
   }
   if(wet/total>.3){water.push([k,j]);row+='.';}else row+=count/total<.28?'.':alphabet[Object.keys(votes).sort((a,b)=>votes[b]-votes[a])[0]];
  }rows.push(row);}
  // Repair only the editor's gold cross using nearby material, not a gold
  // decoration. All cyan/editor/grass pixels are absent from runtime grids.
  const gp=[...new Map(goldPoints.map(p=>[p.join(','),p])).values()];
  for(const [X,Y]of gp){const votes={};for(let dy=-3;dy<=3;dy++)for(let dx=-3;dx<=3;dx++){
   const yy=Y+dy,xx=X+dx;if(yy<0||yy>=H||xx<0||xx>=W||gp.some(p=>p[0]===xx&&p[1]===yy))continue;
   const ch=rows[yy][xx];if(ch!=='.')votes[ch]=(votes[ch]||0)+1;
  }const ch=Object.keys(votes).sort((a,b)=>votes[b]-votes[a])[0]||'.';rows[Y]=rows[Y].slice(0,X)+ch+rows[Y].slice(X+1);}
  // Remove the hanging portable tool in the original workbench illustration.
  if(i===0)for(let Y=5;Y<H;Y++)rows[Y]=rows[Y].slice(0,W-2)+'..';
  const contactHeight=Math.max(3,Math.min(12,gp.length?H-1-Math.round(gp.reduce((n,p)=>n+p[1],0)/gp.length):a.proposedContactHeight||7));
  grids[a.id]={width:W,height:H,rows,waterMask:['sluice','dock_bollard','bank_platform'].includes(a.id)?[]:water,contactHeight,source:{file:a.concept.file,box:boxes[i].slice(0,4)},ground:[Math.floor(W/2),H-1]};
 }
 const catalogue={assets:concepts.assets.map(a=>({id:a.id,number:a.number,label:a.label,posture:a.posture,concept:a.concept})),stationCoverage:concepts.stationCoverage,extraBindings:concepts.extraBindings};
 fs.writeFileSync(path.join(root,'sprites/decors/humains-grilles.js'),'/* Approved concept transcription. Rebuild: node scripts/build-human-stations.cjs. */\n(function(r,d){if(typeof module===\'object\'&&module.exports)module.exports=d;else r.HearthreaverHumanStationGrids=d;})(globalThis,'+JSON.stringify({palette,alphabet,grids,sourceHashes,catalogue})+');\n');
 const api=await loadGame(),game=new api.Game(),renderer=new api.Renderer(createCanvas(320,224),createCanvas(1,1),game),props={};
 const keys=['world_oak_0','world_oak_1','world_oak_winter','world_pine_0','world_pine_1','world_boulder_0','world_boulder_1','world_boulder_2','scrub','world_flower_0','world_gravel'];
 for(const key of keys){const cv=renderer.propCache[key];if(!cv)continue;const raw=cv.getContext('2d').getImageData(0,0,64,64).data,pixels=[];for(let y=0;y<64;y++)for(let x=0;x<64;x++){const n=(y*64+x)*4;if(raw[n+3]===255)pixels.push([x-32,y-56,Buffer.from(raw.slice(n,n+3)).toString('hex')]);}props[key]={pixels,source:'PROPS.'+key,anchor:[32,56]};}
 // Native terrain tiles retain original RGB values and world phase. They are
 // preview fallbacks; a live world uses its own already-rendered ground.
 const terrain={};for(const [id,biome,water]of [['grass',4,false],['soil',6,false],['water',4,true],['sand',1,false],['snow',11,false]]){
  let p=api.Atlas.cells.find(c=>c.land&&c.biome===biome&&!api.Atlas.curseCells.has(c.id)),x=Math.floor(p.x)*16,y=Math.floor(p.y)*16;
  if(water){let found=false;for(const c of api.Atlas.cells.filter(c=>!c.land).slice(0,120)){const X=Math.floor(c.x),Y=Math.floor(c.y);if(api.Atlas.terrain(X,Y)===3){x=X*16;y=Y*16;found=true;break;}}if(!found)throw Error('No existing water sample');}
  const image=api.WorldTerrainArt.render(x,y,16,16,480);terrain[id]={width:16,height:16,colors:Array.from({length:256},(_,i)=>Buffer.from(image.data.slice(i*4,i*4+3)).toString('hex')),source:{renderer:'WorldTerrainArt',world:[x,y],clock:480}};
 }
 const nativeSources=['scripts/world-props-art.js','scripts/world-terrain-art.js','index.html'];
 const atlas={props,terrain,sourceHashes:Object.fromEntries(nativeSources.map(f=>[f,crypto.createHash('sha256').update(fs.readFileSync(path.join(root,f))).digest('hex')]))};
 fs.writeFileSync(path.join(root,'sprites/decors/atlas-nature.js'),'/* Unchanged native atlas pixels; preview extraction only. Live world may provide its own atlas. */\n(function(r,d){if(typeof module===\'object\'&&module.exports)module.exports=d;else r.HearthreaverExistingNature=d;})(globalThis,'+JSON.stringify(atlas)+');\n');
 const P=require('../sprites/decors/postes-humains');
 const runtime={...concepts,phase:'human_runtime_library',liveAnimationMigration:'human_activity_library_actor_only',naturalPolicy:'Existing native props and terrain; external atlas providers in the live world, unchanged snapshots for offline preview',runtimeSources:['sprites/decors/humains-grilles.js','sprites/decors/atlas-nature.js','sprites/decors/igea-hiver.js','sprites/decors/postes-humains.js','sprites/humains/scene.js'],assets:concepts.assets.map(a=>({...a,viewsRequired:['fixed'],socketStatus:'fixed_layout_available',runtime:{kind:P.ASSETS[a.id].kind,source:P.ASSETS[a.id].atlasKey||grids[a.id].source.file,size:grids[a.id]?[grids[a.id].width,grids[a.id].height]:[64,64],sockets:P.sockets(a.id),ground:P.ANCHOR,view:'fixed',operatorFacing:P.ASSETS[a.id].operatorFacing,complementaryPlanes:['back','front']}}))};
 fs.writeFileSync(path.join(root,'data/humains/stations-concepts.json'),JSON.stringify(runtime,null,2)+'\n');
 console.log(Object.keys(grids).length+' fixed structures transcribed; '+Object.keys(props).length+' existing natural props and 5 unchanged terrain samples referenced.');
})().catch(e=>{console.error(e);process.exitCode=1;});
