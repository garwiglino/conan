const fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'..'),read=n=>fs.readFileSync(path.join(root,n),'utf8');
let html=read('index.html');
const code='// BEGIN WORLD ATLAS\nconst WORLD_DATA='+read('data/world/atlas.json').trim()+';\n'+['world-model.js','world-store.js','world-runtime.js','world-terrain-art.js','world-props-art.js','world-art-stream.js','world-render.js','world-ui.js'].map(n=>read('scripts/'+n)).join('\n')+'\n// END WORLD ATLAS';
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
html=html.replaceAll('Remonte la piste au nord jusqu’au camp du Veilleur. Les sceaux sont indiqués en or sur la carte.','Approche de la fée pour quitter la geôle. La carte du monde s’ouvre avec G.');
fs.writeFileSync(path.join(root,'index.html'),html);
fs.writeFileSync(path.join(root,'ios/Hearthreaver/Game/index.html'),html.replace(/<meta name="apple-mobile-web-app-title"[^>]*><link rel="apple-touch-icon"[^>]*><link rel="manifest"[^>]*>/,''));
console.log('Embedded world atlas, simulation, streaming terrain, map and travel UI.');
