'use strict';
const {test,before}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {loadGame,canvas,root}=require('./game-harness.cjs');
const Artwork=require('../sprites/batraciens/batraciens-complet.js'),Armed=require('../sprites/batraciens/batraciens-combattants.js'),approved=require('../data/batraciens/approved-art.json'),combatArt=require('../data/batraciens/combat-art-v2.json'),outfitArt=require('../data/batraciens/headgear-tactics-art-v5.json');
let api,B;before(async()=>{api=await loadGame();B=api.Game.batracienRuntime;});
const json=x=>JSON.parse(JSON.stringify(x));
function game(){const g=new api.Game();g.clock=480;g.worldState=new api.Atlas.WorldState({clock:480});g.player.spawnFX=0;return g;}
function nearby(g,id='resident-batracien-town-73-1'){const n=g.npcs.find(n=>n.id===id);Object.assign(g.player,{x:n.x,y:n.y+64});return n;}
function tick(g,seconds){for(let i=0;i<Math.ceil(seconds/.04);i++)g.update(.04,{});}
function incident(g,type='bandits',siteId='town-73'){
 const site=api.Atlas.byId[siteId],p=api.Atlas.toGame(site.x,site.y);Object.assign(g.player,{x:p.x+520,y:p.y+460});g.solid=()=>false;g.lineClear=()=>true;g.inSafe=()=>null;
 const e=g.worldState.add(type,site.id,g.clock,300);g.stepEventGroups(.04);return e;
}
test('approved civilian pixels remain exact in every default animation, frame and native direction',()=>{
 const snapshot=require('../data/batraciens/approved-civil-pixels.json');assert.equal(snapshot.sourceBundleSHA256,approved.civilBundleSHA256);
 for(const sex of ['male','female']){const h=crypto.createHash('sha256');for(const action of Object.keys(Artwork.CLIPS))for(let dir=0;dir<4;dir++)for(let frame=0;frame<Artwork.CLIPS[action].frames;frame++)h.update(Artwork.raster({sex,action,dir,frame}).data);assert.equal(h.digest('hex'),snapshot.rendered[sex]);}
});
test('outfits match reviewed pixels; disabling outfits retains non-combat v1 frames',()=>{
 for(const role of Object.keys(Armed.ROLES))for(const pal of ['original','jade','turquoise_sombre','ocre_mousse','ardoise']){
  for(const [actions,expected,outfit] of [[Object.keys(Armed.CLIPS),outfitArt.armed,true],[combatArt.unchangedActions.filter(a=>!['idle','walk','patrol','flee'].includes(a)),outfitArt.legacyUnchanged,false]]){
   const hash=crypto.createHash('sha256');for(const action of actions)for(let dir=0;dir<4;dir++)for(let frame=0;frame<Armed.CLIPS[action].frames;frame++)hash.update(Armed.raster({role,palette:pal,action,dir,frame,outfit,headgear:outfit}).data);
   assert.equal(hash.digest('hex'),expected[role+':'+pal],role+':'+pal);
  }
 }
});
test('14 real wetland communities create 62 civilians and 11 separate male wardens',()=>{
 const g=game(),n=g.npcs.filter(n=>n.batracien),c=n.filter(B.isCivil),guards=n.filter(B.isArmed);
 assert.equal(n.length,73);assert.equal(c.length,62);assert.equal(guards.length,11);assert.equal(c.filter(n=>n.batracien.sex==='female').length,31);
 assert.equal(new Set(n.map(n=>n.id)).size,n.length);assert.ok(guards.every(n=>n.batracien.sex==='male'));
 const regions={};for(const a of n){const site=api.Atlas.byId[a.site];assert.ok(B.habitat(site));regions[site.territory]=(regions[site.territory]||0)+1;}
 assert.deepEqual(regions,{Varan:32,Tagon:26,Teremor:15});
});
test('placements clear real geometry, entrances and enemy safety margins after transport props exist',()=>{
 const g=game();for(const n of g.npcs.filter(n=>n.batracien)){
  assert.equal(g.solid(n.x,n.y,n.cityLife?4:8,0),false,n.id);assert.equal(g.localThreatAt(n.x,n.y,0,220),null,n.id);assert.equal(g.dangerAt(n.x,n.y).unsafe,false,n.id);
  for(const s of g.stations)assert.ok(Math.hypot(n.x-s.actor.x,n.y-s.actor.y)>=32,n.id);
 }
});
test('fields require real open earth and fishing cannot target an invented water tile',()=>{
 const g=game();for(const n of g.npcs.filter(B.isCivil)){const b=n.batracien;if(['rice','gather','hoe','sow','harvest'].includes(b.job))assert.equal(g.tile(n.post.x,n.post.y),0,n.id);if(b.job==='fish_cast'){assert.ok(b.water);assert.equal(g.tile(b.water.x,b.water.y),3);}}
});
test('population retry neither duplicates identities nor replaces people, services, or core enemies',()=>{
 const g=game(),before=g.npcs.map(n=>n.id),core=g.enemies.filter(e=>!e.world).map(e=>[e.id,e.kind,e.x,e.y]);for(let i=0;i<3;i++)g.populateCivilians();
 assert.deepEqual(g.npcs.map(n=>n.id),before);assert.deepEqual(g.enemies.filter(e=>!e.world).map(e=>[e.id,e.kind,e.x,e.y]),core);
 assert.ok(g.stations.every(s=>!s.actor.batracien));assert.ok(['elyne','fairy','zahra','veilleur'].every(id=>!g.npcs.find(n=>n.id===id)?.batracien));
});
test('palettes are deterministic and selection preserves identity, position, job, animation and health',()=>{
 const g=game(),n=nearby(g),b=n.batracien,previous={id:n.id,x:n.x,y:n.y,job:b.job,action:b.action,hp:n.civilian.hp};assert.ok(g.setBatracienPalette(n.id,'corail_doux'));
 assert.equal(b.palette,'corail_doux');assert.deepEqual({id:n.id,x:n.x,y:n.y,job:b.job,action:b.action,hp:n.civilian.hp},previous);
 assert.throws(()=>g.setBatracienPalette(n.id,'jade'));assert.equal(b.palette,'corail_doux');assert.equal(g.setBatracienPalette('missing','lilas'),false);
 const copy=new api.Game(json(g.serialize())),rn=copy.npcs.find(a=>a.id===n.id);assert.equal(rn.batracien.palette,'corail_doux');
});
test('palette substitutions preserve alpha and all non-palette equipment pixels in every direction',()=>{
 const recolored=new Set(['s','g','l','h','d','b','c'].map(k=>parseInt(Artwork.Male.PALETTE[k].slice(1),16)));
 for(const role of Object.keys(Armed.ROLES))for(const action of Object.keys(Armed.CLIPS))for(let dir=0;dir<4;dir++){
  const a=Armed.raster({role,action,dir,frame:4}),b=Armed.raster({role,action,dir,frame:4,palette:'jade'});
  for(let i=0;i<a.data.length;i+=4){assert.equal(a.data[i+3],b.data[i+3]);const rgb=(a.data[i]<<16)|(a.data[i+1]<<8)|a.data[i+2];if(!recolored.has(rgb))assert.deepEqual(b.data.subarray(i,i+4),a.data.subarray(i,i+4));}
 }
});
test('armed invalid cache bounds fail promptly and extended death equipment is not silently cropped',()=>{
 for(const maxFrames of [-1,0,257,Infinity])assert.throws(()=>new Armed.Atlas({maxFrames}));
 assert.throws(()=>Armed.raster({role:'village_guard',action:'death',frame:7,format:'native'}),/80x80/);
 const a=Armed.raster({role:'scout',action:'idle',format:'native'});assert.equal(a.width,48);assert.deepEqual(a.anchor,{x:24,y:36});
});
test('native civil frame is an exact translation, never a resized 80px image',()=>{
 for(const sex of ['male','female'])for(const action of Object.keys(Artwork.CLIPS))for(let dir=0;dir<4;dir++){
  const a=Artwork.raster({sex,action,dir,frame:0}),b=Artwork.raster({sex,action,dir,frame:0,format:'native'});
  for(let y=0;y<48;y++)assert.deepEqual(b.data.subarray(y*48*4,(y+1)*48*4),a.data.subarray(((y+16)*80+16)*4,((y+16)*80+64)*4));
 }
});
test('both sexes work, rest, speak, and move using the full shared animation timing',()=>{
 const g=game(),n=nearby(g);n.civilian.restClock=0;tick(g,.16);assert.equal(n.batracien.action,n.batracien.job);
 g.dialogue={who:n};g.time+=.04;g.stepBatracienCivilian(n,.04);assert.equal(n.batracien.action,'talk');g.dialogue=null;
 g.civilianAction(n,'seated');const p={x:n.x,y:n.y};assert.equal(g.walkNpc(n,{x:n.x+20,y:n.y},.04),false);assert.equal(n.batracien.action,'stand_up');assert.equal(n.x,p.x);
});
test('movement animation follows actual distance and does not advance through a wall',()=>{
 const g=game(),n=nearby(g);g.civilianAction(n,'idle');g.solid=()=>true;const d=n.batracien.distance,p={x:n.x,y:n.y};for(let i=0;i<5;i++){g.walkNpc(n,{x:n.x+64,y:n.y},.04);g.time+=.04;g.stepBatracienCivilian(n,.04);}
 assert.equal(n.x,p.x);assert.equal(n.y,p.y);assert.equal(n.batracien.distance,d);
});
test('existing danger interrupts frog work, hides residents, and retains their palette on return',()=>{
 const g=game(),n=nearby(g),pal=n.batracien.palette;g.solid=()=>false;g.lineClear=()=>true;
 g.worldState.add('bandits',n.site,g.clock,50);g.assessCivilians(true);assert.ok(n.dangerState);assert.equal(n.batracien.action,'startle');assert.equal(g.npcPresent(n),false);
 n.dangerState.mode='sheltered';n.alpha=0;const copy=new api.Game(json(g.serialize())),rn=copy.npcs.find(a=>a.id===n.id);assert.equal(rn.alpha,0);assert.equal(rn.batracien.palette,pal);
});
test('ordinary frog deaths persist and grant neither XP nor a player kill',()=>{
 const g=game(),n=nearby(g),xp=g.player.xp,kills=g.player.kills;assert.equal(g.damageCivilian(n,99,g.player),true);assert.equal(n.civilian.dead,true);assert.equal(n.batracien.action,'death');assert.equal(g.player.xp,xp);assert.equal(g.player.kills,kills);assert.equal(g.recruitCompanion(n),false);
 const copy=new api.Game(json(g.serialize())),rn=copy.npcs.find(a=>a.id===n.id);assert.equal(rn.civilian.dead,true);assert.equal(rn.batracien.palette,n.batracien.palette);assert.equal(g.bodies(g.player).includes(n),false);
});
test('frog companions restore by stable identity before the travel party is rebuilt',()=>{
 const g=game(),n=nearby(g);assert.equal(g.recruitCompanion(n),true);n.x+=12;g.party.find(c=>c.id===n.id).x=n.x;g.party.find(c=>c.id===n.id).y=n.y;
 const copy=new api.Game(json(g.serialize()));assert.ok(copy.party.some(c=>c.id===n.id));assert.ok(copy.partyActor(n.id)?.batracien);assert.equal(copy.partyActor(n.id).batracien.palette,n.batracien.palette);
});
test('guard units cannot be recruited as civilian companions',()=>{
 const g=game(),n=g.npcs.find(B.isArmed);assert.equal(g.recruitCompanion(n),false);assert.ok(!g.party.some(c=>c.id===n.id));
});
test('wardens remain non-hostile, patrol only their local area and never add to immediate threat',()=>{
 const g=game(),n=nearby(g,'warden-batracien-town-73-0'),p={...n.post};g.enemies=g.enemies.filter(e=>!e.world);for(let i=0;i<100;i++){g.time+=.04;g.stepBatracienWardens(.04);}assert.ok(Math.hypot(n.x-p.x,n.y-p.y)<=30);assert.ok(n.batracien.distance>0);assert.equal(g.localThreatAt(n.x,n.y),null);
});
test('only eligible wetland bandit groups gain fighter visuals; camp and curse actors stay unchanged',()=>{
 const g=game(),event=incident(g);const group=g.enemies.filter(e=>e.eventId===event.id);assert.equal(group.length,3);assert.ok(group.every(e=>e.batracien));assert.ok(group.some(e=>e.batracien.role==='raider'));
 const camp=incident(g,'bandits','camp');assert.ok(g.enemies.filter(e=>e.eventId===camp.id).every(e=>!e.batracien));
 const curse=incident(g,'curse','town-73');assert.ok(g.enemies.filter(e=>e.eventId===curse.id).every(e=>e.kind==='skeleton'&&!e.batracien));
});
test('raider attack locks direction and applies exactly one hit at its registered contact',()=>{
 const g=game(),ev=incident(g),e=g.enemies.find(e=>e.eventId===ev.id&&e.batracien.role==='raider');g.npcs=[];Object.assign(g.player,{x:e.x+22,y:e.y,inv:0,guard:false});e.batracien.cooldown=0;e.ai='chase';g.stepBatracienEnemy(e,.04);assert.equal(e.batracien.action,'slash');const dir=e.dir;let hits=0;g.damagePlayer=()=>hits++;
 for(let i=0;i<7;i++)g.stepBatracienEnemy(e,.04);assert.equal(hits,0);for(let i=0;i<9;i++)g.stepBatracienEnemy(e,.04);assert.equal(hits,1);assert.equal(e.dir,dir);assert.equal(e.batracien.contactDone,true);
});
test('stun/parry interrupts the pending attack and cannot produce a late hit',()=>{
 const g=game(),ev=incident(g),e=g.enemies.find(e=>e.eventId===ev.id&&e.batracien.role==='raider');g.npcs=[];Object.assign(g.player,{x:e.x+20,y:e.y,inv:0});e.batracien.cooldown=0;e.ai='chase';g.stepBatracienEnemy(e,.04);e.stun=1.2;let hits=0;g.damagePlayer=()=>hits++;for(let i=0;i<20;i++)g.stepBatracienEnemy(e,.04);assert.equal(hits,0);assert.equal(e.batracien.action,'hit');
});
test('a last-frame attack reloaded after contact does not repeat that contact',()=>{
 const g=game(),ev=incident(g),e=g.enemies.find(e=>e.eventId===ev.id&&e.batracien.role==='raider');Object.assign(e.batracien,{action:'slash',elapsed:.5,contactDone:true,lockedDir:1});const save=json(g.serialize()),row=save.atlas.batraciens.incidents.find(n=>n.id===e.id);assert.equal(row.contactDone,true);assert.equal(row.elapsed,.5);
 const copy=new api.Game(save);copy.solid=()=>false;copy.lineClear=()=>true;copy.inSafe=()=>null;Object.assign(copy.player,g.player);copy.stepEventGroups(.04);const restored=copy.enemies.find(n=>n.id===e.id);assert.ok(restored?.batracien);assert.equal(restored.batracien.contactDone,true);
});
test('javelin collision is swept, level-aware, and stopped by walls',()=>{
 const g=game(),ev=incident(g),e=g.enemies.find(e=>e.eventId===ev.id&&e.batracien.role==='scout');assert.ok(e);g.npcs=[];Object.assign(g.player,{x:e.x+25,y:e.y,inv:0});e.batracien.lockedDir=1;g.launchBatracienJavelin(e,g.player);assert.equal(g.batracienMissiles.length,1);g.batracienMissiles[0].vx=1000;const hp=g.player.hp;g.stepBatracienMissiles(.04);assert.equal(g.player.hp,hp-1);assert.equal(g.batracienMissiles.length,0);
 g.player.inv=0;g.launchBatracienJavelin(e,g.player);g.solid=()=>true;g.stepBatracienMissiles(.04);assert.equal(g.player.hp,hp-1);assert.equal(g.batracienMissiles.length,0);
});
test('guard hits preserve player XP/riposte and actual hostile deaths are recorded',()=>{
 const g=game(),guard=nearby(g,'warden-batracien-town-73-0'),ev=incident(g),e=g.enemies.find(e=>e.eventId===ev.id&&e.batracien.role==='raider');Object.assign(guard,{x:e.x-20,y:e.y});g.lineClear=()=>true;e.hp=1;g.player.riposte=1;const xp=g.player.xp,kills=g.player.kills;g.guardStrike(guard,e);if(e.dead)g.batracienCorpse(e);
 assert.equal(e.dead,true);assert.equal(g.atlasDeaths[e.id],true);assert.equal(g.player.riposte,1);assert.equal(g.player.xp,xp);assert.equal(g.player.kills,kills);assert.ok(g.remains.some(r=>r.id===e.id&&r.kind==='batracien'));
});
test('dead guards keep their state and palette without respawning',()=>{
 const g=game(),n=nearby(g,'warden-batracien-town-73-0');g.setBatracienPalette(n.id,'turquoise_sombre');g.damageBatracienGuard(n,999,g.player);assert.ok(n.batracien.dead);const copy=new api.Game(json(g.serialize())),r=copy.npcs.find(a=>a.id===n.id);assert.ok(r.batracien.dead);assert.equal(r.batracien.palette,'turquoise_sombre');copy.populateCivilians();assert.equal(copy.npcs.filter(a=>a.id===r.id).length,1);
});
test('the whole scene renders both sexes and all role colors with bounded atlas caches',()=>{
 const g=game(),n=nearby(g,'resident-batracien-town-74-0'),cv=canvas.createCanvas(320,224),r=new api.Renderer(cv,canvas.createCanvas(1,1),g);r.frame();assert.ok(r.batracienAtlases.size>0);
 for(const role of Object.keys(Armed.ROLES))for(const palette of B.config.malePalettes){const a=B.atlasFor(r,{role,palette});a.get('idle',2,0);assert.ok(a.cache.size<=32);assert.ok(r.batracienAtlases.size<=12);}
 const fake={id:'visible-corpse',kind:'batracien',x:n.x+30,y:n.y,level:0,dir:2,role:'village_guard',palette:'jade',t0:g.time};g.remains.push(fake);r.frame();g.time+=2;r.frame();
});
test('malformed extension records cannot inject roles, palette keys, out-of-world positions or NaNs',()=>{
 const g=game(),save=json(g.serialize());save.atlas.batraciens.people=[{id:'warden-batracien-town-73-0',site:'town-73',sex:'female',role:'nonexistent',palette:'__proto__',x:NaN,y:Infinity,hp:NaN},{id:'resident-batracien-fake',site:'not-real',palette:'lilas'}];const copy=new api.Game(save),n=copy.npcs.find(n=>n.id==='warden-batracien-town-73-0');assert.equal(n.batracien.sex,'male');assert.equal(n.batracien.role,'village_guard');assert.equal(n.batracien.palette,'original');assert.ok(Number.isFinite(n.x+n.y+n.batracien.hp));
});
test('gameplay never changes an approved palette merely because an actor walks, is hurt or changes activity',()=>{
 const g=game(),n=nearby(g);const initial=n.batracien.palette;for(const action of ['idle','walk','talk','hit','seated','stand_up']){g.civilianAction(n,action);assert.equal(n.batracien.palette,initial);}g.damageCivilian(n,1,g.player);assert.equal(n.batracien.palette,initial);
});
test('offline HTML contains the exact same integration sources and has no runtime image-fetch dependency',()=>{
 const web=fs.readFileSync(path.join(root,'index.html'),'utf8'),ios=fs.readFileSync(path.join(root,'ios/Hearthreaver/Game/index.html'),'utf8');for(const f of ['scripts/batraciens-runtime.js','sprites/batraciens/batraciens-complet.js','sprites/batraciens/batraciens-combattants.js']){const s=fs.readFileSync(path.join(root,f),'utf8');assert.ok(web.includes(s),f);assert.ok(ios.includes(s),f);}assert.ok(!fs.readFileSync(path.join(root,'sprites/batraciens/batraciens-combattants.js'),'utf8').includes('/mnt/data/'));
});
