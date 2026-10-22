'use strict';
const fs=require('node:fs'),path=require('node:path'),root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
let html=read('index.html');
// Light hits stagger a goblin locally; only finishers send it seven units away.
// The legacy seven-unit shove plus its old recovery made each light hit a reset.
html=html.replace('this.move(e,(e.x-this.player.x)/d*7,(e.y-this.player.y)/d*7);',
 "this.move(e,(e.x-this.player.x)/d*(e.kind==='goblin'&&this.player.combo!==3?2:7),(e.y-this.player.y)/d*(e.kind==='goblin'&&this.player.combo!==3?2:7));");
// Keep the shared light compositor current without rebuilding world geography.
html=html.replace(/\/\/ BEGIN WEATHER RENDER[\s\S]*?\/\/ END WEATHER RENDER/,()=> '// BEGIN WEATHER RENDER\n'+read('scripts/weather-render.js')+'\n// END WEATHER RENDER');
html=html.replaceAll("'Clés '+g.dungeon.keys.length+'/3 · Fioles '","'Fioles '");
html=html.replace(/\/\/ BEGIN LANDSCAPE DESIGN[\s\S]*?\/\/ END LANDSCAPE DESIGN/,()=> '// BEGIN LANDSCAPE DESIGN\n'+read('scripts/landscape-ui.js')+'\n'+read('scripts/dialogue-pages.js')+'\n'+read('scripts/interaction-ui.js')+'\n// END LANDSCAPE DESIGN');
// Replace the legacy inline loot loop once; both update paths call the same code.
const lootStart=html.indexOf('for(const d of this.drops){if(d.air)'),lootEnd=lootStart<0?-1:html.indexOf('this.drops=this.drops.filter(d=>!d.taken);',lootStart);
if(lootStart>=0){if(lootEnd<0)throw Error('Incomplete legacy loot loop');html=html.slice(0,lootStart)+'this.stepLoot(dt);'+html.slice(lootEnd+'this.drops=this.drops.filter(d=>!d.taken);'.length);}
const oldChest="if(c.kind==='chest'){const ch=this.chests[c.i];ch.open=true;this.ejectLoot(ch,['coin','coin','coin','coin','coin','heart','heart']);this.emit('chest');this.emit('save');";
html=html.replace(oldChest,"if(c.kind==='chest'){const ch=this.chests[c.i];this.openLootChest(ch);");
const code='// BEGIN FIRST DUNGEON\nconst DUNGEON_DATA='+read('data/donjons/compiled/forteresse-grise-gueule.json').trim()+';\n'+read('sprites/gobelins/native-layers.js')+'\n'+read('sprites/gobelins/gobelin.js')+'\n'+read('scripts/loot-runtime.js')+'\n'+read('scripts/goblin-tactics.js')+'\n'+read('scripts/dungeon-runtime.js')+'\n'+read('scripts/dungeon-sight.js')+'\n'+read('scripts/dungeon-lighting.js')+'\n'+read('scripts/dungeon-occlusion.js')+'\n'+read('scripts/dungeon-render.js')+'\n// END FIRST DUNGEON';
html=html.replace(/\/\/ BEGIN FIRST DUNGEON[\s\S]*?\/\/ END FIRST DUNGEON\s*/, '');
html=html.replace('// app.js',()=>code+'\n// app.js');
if(!html.includes('FirstDungeon.inventoryHTML(g)'))html=html.replace('KaldorWardrobe.inventoryHTML(g)', 'KaldorWardrobe.inventoryHTML(g)+FirstDungeon.inventoryHTML(g)');
// All app entry points create the official opening; programmatic Game arenas keep their API.
// Keep the phone action label in step with the explicit crate grip.
html=html.replace("if(c){if(c.kind==='lift'){","if(c){if(c.kind==='dungeon-crate'){ico='hand';lab=g.dungeonGrip?'LÂCHER':'SAISIR';}else if(c.kind==='lift'){");
html=html.replace("ok?'Agir : '+lab.toLowerCase():'Interagir'","ok?lab.toLowerCase():'Interagir'");
const start=html.indexOf('// app.js');html=html.slice(0,start)+html.slice(start).replace(/game=new Game\(\);(?!game.startFirstDungeon\(\);)/g,'game=new Game();game.startFirstDungeon();').replace(/game=new Game\(saved\);(?!if\(!saved\)game.startFirstDungeon\(\);)/g,'game=new Game(saved);if(!saved)game.startFirstDungeon();');
html=html.replaceAll('Explore les environs avec la fée. Parle à Elyne pour voyager ensemble. Carte : G.','Échappe-toi des geôles. Explore le passage derrière la paillasse.');
fs.writeFileSync(path.join(root,'index.html'),html);
fs.writeFileSync(path.join(root,'ios/Hearthreaver/Game/index.html'),html.replace(/<meta name="apple-mobile-web-app-title"[^>]*><link rel="apple-touch-icon"[^>]*><link rel="manifest"[^>]*>/,''));
console.log('Embedded official first dungeon in web and offline iOS builds.');
