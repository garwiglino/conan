'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {exportBiome}=require('../scripts/environment/export-kit.cjs'),{biomes}=require('../scripts/environment/build-environment.cjs');
const ART=path.join(__dirname,'../art/environnement');

test('the game keeps its current tiles unless a biome is switched on in jeu.json',()=>{
 const active=JSON.parse(fs.readFileSync(path.join(ART,'jeu.json'),'utf8')).biomes_actifs,html=fs.readFileSync(path.join(__dirname,'../ios/Hearthreaver/Game/index.html'),'utf8');
 for(const biome of biomes()){const {global}=JSON.parse(fs.readFileSync(path.join(ART,biome,'manifeste.json'),'utf8'));assert.equal(html.includes('root.'+global+'=data'),active.includes(biome),biome);}
 assert.equal(html.includes('function createEnvironmentArt('),active.length>0);
});
test('the PNG kit of every biome matches its Piskel sources and lists every image',async()=>{
 for(const biome of biomes()){const files=await exportBiome(biome),dir=path.join(ART,biome,'png');
  for(const [rel,buf]of files)assert.ok(fs.existsSync(path.join(dir,rel))&&fs.readFileSync(path.join(dir,rel)).equals(buf),biome+'/png/'+rel+' : npm run kit:environment');
  const catalogue=JSON.parse(files.get('catalogue.json')),listed=new Set(catalogue.elements.map(e=>e.png));
  for(const rel of files.keys())if(rel!=='catalogue.json')assert.ok(listed.has(rel),rel);
  for(const set of Object.keys(catalogue.jeux))for(let mask=0;mask<16;mask++)assert.ok([...listed].some(f=>f.startsWith('chemins/'+set+'/'+String(mask).padStart(2,'0')+'-')),biome+' '+set+' '+mask);}
});
