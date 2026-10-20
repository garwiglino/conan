'use strict';
const fs=require('node:fs'),path=require('node:path'),root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
let html=read('index.html'),start=html.indexOf(' frame(){const c=this.c,g=this.g,p=g.player,W=this.W'),end=html.indexOf(' lifeHead(',start);
if(start<0||end<0)throw Error('Main renderer frame anchor missing');
let frame=html.slice(start,end);
if(!frame.includes('this.drawTempleGate()')){
 frame=frame.replace('this.drawAtlasGround();c.drawImage(this.bg,0,0);','this.drawAtlasGround();if(!this.projectionActive)c.drawImage(this.bg,0,0);');
 frame=frame.replace('const wf=this.waterFX','const wf=this.projectionActive?null:this.waterFX');
 frame=frame.replace(/under=(!p.level[\s\S]*?),lvT=/,'under=this.projectionActive?this.platformUnder():($1),lvT=');
 frame=frame.replace('{y:this.g.stairs.bottom,','{y:this.projectionActive?this.projectedStairsDepth():this.g.stairs.bottom,');
 frame=frame.replaceAll('SEALS','(this.projectedSeals||SEALS)');
 const a=frame.indexOf('  // Temple gate:'),b=frame.indexOf('  for(const d of g.drops',a);
 if(a<0||b<0)throw Error('Temple gate frame anchors missing');
 frame=frame.slice(0,a)+'  if(this.projectionActive)this.drawTempleGate();else {\n'+frame.slice(a,b)+'  }\n'+frame.slice(b);
 frame=frame.replace('const bounds=g.atlas?', 'const bounds=this.projectionActive?{left:-1e10,top:-1e10,right:1e10,bottom:1e10}:g.atlas?');
}
html=html.slice(0,start)+frame+html.slice(end);
for(const [a,b]of [[' magic(){',' glowFX('],[' lights(){',' weatherFX(']]){const s=html.indexOf(a),e=html.indexOf(b,s);if(s>=0&&e>s){let code=html.slice(s,e);if(!code.includes('this.projectedSeals'))code=code.replaceAll('SEALS','(this.projectedSeals||SEALS)');html=html.slice(0,s)+code+html.slice(e);}}
const begin='// BEGIN ISOMETRIC WORLD',finish='// END ISOMETRIC WORLD';
// Biomes redessinés (art/environnement) : le jeu ne les charge que s'ils sont
// listés dans art/environnement/jeu.json ; sinon il garde ses tuiles actuelles.
const active=JSON.parse(read('art/environnement/jeu.json')).biomes_actifs||[];
for(const b of active)if(!fs.existsSync(path.join(root,'sprites/environnement',b+'-data.js')))throw Error('jeu.json : biome '+b+' sans données (npm run build:environment)');
const environment=active.length?[...active.map(b=>'sprites/environnement/'+b+'-data.js'),'sprites/environnement/environment-iso.js']:[];
const block=begin+'\nconst HearthreaverTerrainPalettes=globalThis.HearthreaverTerrainPalettes='+read('sprites/terrain/isometric-palettes.json').trim()+';\n'+['sprites/terrain/terrain-isometric.js',...environment,'scripts/world-projection.js','scripts/world-isometric-art.js','scripts/world-isometric-runtime.js'].map(read).join('\n')+'\n'+finish;
if(html.includes(begin)){const a=html.indexOf(begin),b=html.indexOf(finish,a);if(b<0)throw Error('World projection block corrupted');html=html.slice(0,a)+block+html.slice(b+finish.length);}else html=html.replace('// app.js',()=>block+'\n// app.js');
fs.writeFileSync(path.join(root,'index.html'),html);fs.writeFileSync(path.join(root,'ios/Hearthreaver/Game/index.html'),html.replace(/<meta name="apple-mobile-web-app-title"[^>]*><link rel="apple-touch-icon"[^>]*><link rel="manifest"[^>]*>/,''));
console.log('Isometric terrain, camera and display projection embedded in web and offline iOS'+(active.length?' (biomes redessinés : '+active.join(', ')+').':'.'));
