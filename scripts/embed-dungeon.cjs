'use strict';
const fs=require('node:fs'),path=require('node:path'),root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
let html=read('index.html');
// Keep the shared light compositor current without rebuilding world geography.
html=html.replace(/\/\/ BEGIN WEATHER RENDER[\s\S]*?\/\/ END WEATHER RENDER/,()=> '// BEGIN WEATHER RENDER\n'+read('scripts/weather-render.js')+'\n// END WEATHER RENDER');
const code='// BEGIN FIRST DUNGEON\nconst DUNGEON_DATA='+read('data/donjons/compiled/forteresse-grise-gueule.json').trim()+';\n'+read('sprites/gobelins/native-layers.js')+'\n'+read('sprites/gobelins/gobelin.js')+'\n'+read('scripts/goblin-tactics.js')+'\n'+read('scripts/dungeon-runtime.js')+'\n'+read('scripts/dungeon-lighting.js')+'\n'+read('scripts/dungeon-occlusion.js')+'\n'+read('scripts/dungeon-render.js')+'\n// END FIRST DUNGEON';
html=html.replace(/\/\/ BEGIN FIRST DUNGEON[\s\S]*?\/\/ END FIRST DUNGEON\s*/, '');
html=html.replace('// app.js',()=>code+'\n// app.js');
if(!html.includes('FirstDungeon.inventoryHTML(g)'))html=html.replace('KaldorWardrobe.inventoryHTML(g)', 'KaldorWardrobe.inventoryHTML(g)+FirstDungeon.inventoryHTML(g)');
// All app entry points create the official opening; programmatic Game arenas keep their API.
const start=html.indexOf('// app.js');html=html.slice(0,start)+html.slice(start).replace(/game=new Game\(\);(?!game.startFirstDungeon\(\);)/g,'game=new Game();game.startFirstDungeon();').replace(/game=new Game\(saved\);(?!if\(!saved\)game.startFirstDungeon\(\);)/g,'game=new Game(saved);if(!saved)game.startFirstDungeon();');
html=html.replaceAll('Explore les environs avec la fée. Parle à Elyne pour voyager ensemble. Carte : G.','Échappe-toi des geôles. Explore le passage derrière la paillasse.');
fs.writeFileSync(path.join(root,'index.html'),html);
fs.writeFileSync(path.join(root,'ios/Hearthreaver/Game/index.html'),html.replace(/<meta name="apple-mobile-web-app-title"[^>]*><link rel="apple-touch-icon"[^>]*><link rel="manifest"[^>]*>/,''));
console.log('Embedded official first dungeon in web and offline iOS builds.');
