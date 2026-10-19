'use strict';
// Offline, reproducible integration. The full native JS pack stays available
// without image requests. Native districts and human activity resources are installed offline.
const fs=require('node:fs'),path=require('node:path'),root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const begin='// BEGIN NATIVE JAVASCRIPT ARCHITECTURE',end='// END NATIVE JAVASCRIPT ARCHITECTURE';
const parts=['sprites/architecture/architecture-data.js','sprites/architecture/architecture.js','sprites/architecture/localities.js','scripts/architecture-world.js','sprites/humains/sources-natives.js','sprites/humains/catalogue.js','sprites/humains/rig.js','sprites/humains/modularite.js','sprites/humains/cheval.js','sprites/humains/accessoires.js','sprites/humains/activites.js','sprites/decors/humains-grilles.js','sprites/decors/atlas-nature.js','sprites/decors/igea-hiver.js','sprites/decors/postes-humains.js'];
const block=begin+'\n'+parts.map(read).join('\n')+'\nHearthreaverArchitectureWorld.install(Game,Renderer);\nconst SETTLEMENT_DATA='+read('data/architecture/settlements.json').trim()+';\n'+read('scripts/settlement-runtime.js')+'\n'+end;
let html=read('index.html');
if(html.includes(begin)){
 const a=html.indexOf(begin),b=html.indexOf(end,a);if(b<0||html.indexOf(begin,a+begin.length)>=0)throw Error('Architecture block is corrupted');html=html.slice(0,a)+block+html.slice(b+end.length);
}else{if(html.split('// app.js').length!==2)throw Error('Architecture insertion marker not unique');html=html.replace('// app.js',()=>block+'\n// app.js');}
const old='const objs=[...g.drops.filter(d=>d.level)',patched='const objs=[...this.architectureDrawObjects(),...g.drops.filter(d=>d.level)';
if(!html.includes(patched)){if(html.split(old).length!==2)throw Error('Renderer sort insertion marker not unique');html=html.replace(old,patched);}
fs.writeFileSync(path.join(root,'index.html'),html);
fs.writeFileSync(path.join(root,'ios/Hearthreaver/Game/index.html'),html.replace(/<meta name="apple-mobile-web-app-title"[^>]*><link rel="apple-touch-icon"[^>]*><link rel="manifest"[^>]*>/,''));
console.log('Native architecture embedded in web and iOS; renderer, collisions and save bridge installed.');
