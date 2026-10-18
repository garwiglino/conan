const fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'..'),read=n=>fs.readFileSync(path.join(root,n),'utf8');
let html=read('index.html');
const code='// BEGIN WORLD ATLAS\nconst WORLD_DATA='+read('data/world/atlas.json').trim()+';\n'+['world-model.js','world-store.js','world-runtime.js','travel-party.js','travel-background.js','world-exploration.js','world-terrain-art.js','world-props-art.js','world-art-stream.js','world-render.js','transport-art.js','travel-hud.js','travel-select.js','world-ui.js','biome-climate.js','cold-effects.js','biome-audio.js','audio-mix.js','ground-tracks.js','world-danger.js'].map(n=>read('scripts/'+n)).join('\n')+'\nconst CIVILIAN_ART='+read('data/civilians/atlas.json').trim()+';\n'+['civilian-art.js','civilian-runtime.js'].map(n=>read('scripts/'+n)).join('\n')+'\n'+read('sprites/batraciens/batraciens-complet.js')+'\n'+read('sprites/batraciens/batraciens-combattants.js')+'\nconst BATRACIEN_CONFIG='+read('data/batraciens/communities.json').trim()+';\n'+read('scripts/batraciens-runtime.js')+'\n'+read('scripts/batraciens-society.js')+'\n// END WORLD ATLAS';
html=html.includes('// BEGIN WORLD ATLAS')?html.replace(/\/\/ BEGIN WORLD ATLAS[\s\S]*?\/\/ END WORLD ATLAS/,()=>code):html.replace('// app.js',()=>code+'\n// app.js');
for(const [start,end,body,before]of [['/* BEGIN WORLD CSS */','/* END WORLD CSS */',read('scripts/world-ui.css'),'</style>'],['<!-- BEGIN WORLD UI -->','<!-- END WORLD UI -->',read('scripts/world-ui.html'),'<script>']]){const a=html.indexOf(start),b=html.indexOf(end),block=start+'\n'+body+'\n'+end;if(a>=0)html=html.slice(0,a)+block+html.slice(b+end.length);else html=html.replace(before,()=>block+'\n'+before);}
function once(from,to){if(html.includes(to))return;if(!html.includes(from))throw Error('Missing integration anchor: '+from.slice(0,100));html=html.replace(from,()=>to);}
once('  if(saved)this.restore(saved);','  this.initAtlas(saved);if(saved)this.restore(saved);this.finishAtlasRestore(saved);');
once('this.cam.x=snap(Math.max(0,Math.min(MW*16-W,F.x-W/2)));this.cam.y=snap(Math.max(0,Math.min(MH*16-VH,F.y-VH/2-14)));','const bounds=g.atlas?{left:-Atlas.origin.x*16,top:-Atlas.origin.y*16,right:(Atlas.raw.width-Atlas.origin.x)*16,bottom:(Atlas.raw.height-Atlas.origin.y)*16}:{left:0,top:0,right:MW*16,bottom:MH*16};this.cam.x=snap(clamp(F.x-W/2,bounds.left,bounds.right-W));this.cam.y=snap(clamp(F.y-VH/2-14,bounds.top,bounds.bottom-VH));');
once('c.translate(-this.cam.x+shake,T-this.cam.y);c.drawImage(this.bg,0,0);','c.translate(-this.cam.x+shake,T-this.cam.y);this.drawAtlasGround();c.drawImage(this.bg,0,0);');
once('...g.world.props.filter(o=>o.x>this.cam.x-25','...this.visibleAtlasProps().filter(o=>o.x>this.cam.x-25');
once('if(this.gate&&p.y<190&&p.x>320','if(this.gate&&p.y>=0&&p.y<190&&p.x>320');
once("function updateUI(){$('zone').textContent=game.zone();renderTracker();syncBadge();}","function updateUI(){$('zone').textContent=game.zone();renderTracker();syncBadge();updateWorldUI();}");
once('!this.bossActive){this.bossActive=true;', '!this.bossActive&&!this.story?.templeFreed){this.bossActive=true;');
html=html.replace(/g=>g\.won\?\[/g, 'g=>(g.won||g.story?.templeFreed)?[').replace('lines:g.won?[','lines:(g.won||g.story?.templeFreed)?[');
once('refreshTitleMenu();syncTitleOptions();syncLandscape();updateUI();','installWorldUI();refreshTitleMenu();syncTitleOptions();syncLandscape();updateUI();');
html=html.replace('for(const n of this.npcs){if(!n.home)continue;', 'for(const n of this.npcs){if(!n.home||this.party?.some(c=>c.id===n.id))continue;');
html=html.replaceAll('Remonte la piste au nord jusqu’au camp du Veilleur. Les sceaux sont indiqués en or sur la carte.','Explore les environs avec la fée. Parle à Elyne pour voyager ensemble. Carte : G.');
html=html.replace('Approche de la fée pour quitter la geôle. La carte du monde s’ouvre avec G.','Explore les environs avec la fée. Parle à Elyne pour voyager ensemble. Carte : G.');
const hudStart=html.indexOf('hud(){const c=this.c,g=this.g,p=g.player'),hudEnd=html.indexOf('this.clockPill(g);',hudStart);
if(hudStart>=0&&hudEnd>=0)html=html.slice(0,hudStart)+"hud(){const c=this.c,g=this.g,p=g.player,W=this.W,H=this.H,s=this.safe,T=this.top;this.travelHudBar();\n  "+html.slice(hudEnd);
// Sleep and staffed rest obey the same starvation rule; settle clock before healing.
html=html.replace("this.sleeping=null;this.player.hp=this.player.maxHp;this.emit('notice',{title:'Réveil',text:'Il est '+this.hourText()+'. Tes forces sont revenues.'}","this.sleeping=null;this.advanceAtlas(0);if(this.needs.satiety>0)this.player.hp=this.player.maxHp;this.emit('notice',{title:'Réveil',text:'Il est '+this.hourText()+(this.needs.satiety>0?'. Tes forces sont revenues.':'. La faim empêche de récupérer ta santé.')}");
// Body heat reads the wardrobe's warmth: its block follows the wardrobe, just before the app.
const heat='// BEGIN BODY HEAT\n'+read('scripts/body-heat.js')+'\n// END BODY HEAT';
html=html.includes('// BEGIN BODY HEAT')?html.replace(/\/\/ BEGIN BODY HEAT[\s\S]*?\/\/ END BODY HEAT/,()=>heat):html.replace('// app.js',()=>heat+'\n// app.js');
// A death by cold names its cause on the death screen.
once("this.emit('fallen',{over:D.over})","this.emit('fallen',{over:D.over,cause:D.cause})");
once("overlay('TU AS PERDU UNE VIE','Vaincu',headLine(game.player.lives)+'<br>Avar te rappelle à la dernière stèle allumée.'","overlay('TU AS PERDU UNE VIE',ev.cause==='cold'?'Mort de froid':'Vaincu',headLine(game.player.lives)+'<br>'+(ev.cause==='cold'?'Ta tenue ne protégeait pas assez du froid. ':'')+'Avar te rappelle à la dernière stèle allumée.'");
once("'Tu n’as plus de vies : ta chronique s’achève ici. Une nouvelle aventure t’attend.'","(ev.cause==='cold'?'Le froid a eu raison de Kaldor. ':'')+'Tu n’as plus de vies : ta chronique s’achève ici. Une nouvelle aventure t’attend.'");
fs.writeFileSync(path.join(root,'index.html'),html);
fs.writeFileSync(path.join(root,'ios/Hearthreaver/Game/index.html'),html.replace(/<meta name="apple-mobile-web-app-title"[^>]*><link rel="apple-touch-icon"[^>]*><link rel="manifest"[^>]*>/,''));
console.log('Embedded world atlas, simulation, streaming terrain, map and travel UI.');
