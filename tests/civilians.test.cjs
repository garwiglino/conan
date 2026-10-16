const {test,before}=require('node:test'),assert=require('node:assert/strict');
const {loadGame,canvas}=require('./game-harness.cjs');let api;before(async()=>api=await loadGame());
function game(){const g=new api.Game();g.enemies=[];g.clock=480;g.worldState=new api.Atlas.WorldState({clock:g.clock});return g;}
test('all approved human silhouettes and palettes have four-way civilian actions, never attacks',()=>{
 const art=api.CIVILIAN_ART,items=Object.values(art.outfits);assert.equal(items.length,144);assert.equal(new Set(items.map(v=>v.cut+'-'+v.sex)).size,48);
 for(const v of items){if(v.cut.startsWith('TR'))assert.equal(v.sex,'masculin');for(const action of ['idle','walk','flee','startle','talk','sit_down','seated','stand_up','cower','hit','death','carry',v.job]){assert.equal(v.frames[action].length,4);for(const start of v.frames[action])assert.ok(start+art.clips[action].durations.length<=v.asset.tiles.length);}assert.ok(!Object.keys(v.frames).some(s=>/attack|strike|punch/.test(s)));}
 assert.equal(art.clips.death.loop,false);assert.ok(art.clips.flee.durations.reduce((a,b)=>a+b)<art.clips.walk.durations.reduce((a,b)=>a+b));
});
test('appearance is stable, old people are silver-haired, rags use only hirsute styles and hats follow outfits',()=>{
 const g=game();for(const n of g.npcs.filter(n=>n.civilian&&!n.batracien)){const a=n.civilian.appearance,o=api.CIVILIAN_ART.outfits[a.outfit];assert.equal(a.sex,o.sex);if(a.age==='age')assert.equal(a.color,'argente');assert.ok(a.hat===null||a.hat===o.hat);assert.deepEqual(JSON.parse(JSON.stringify(api.civilianAppearance(g,n,a))),JSON.parse(JSON.stringify(a)));}
 const e=g.escortActor.civilian.appearance;assert.equal(e.sex,'feminin');assert.ok(['07','08'].includes(e.hair));assert.ok(e.outfit.startsWith('E'));assert.equal(e.hat,null);
 const old=api.civilianAppearance(g,g.escortActor,{...e,age:'age',color:'roux',hair:'03',hat:'H12-bleu-port'});assert.equal(old.color,'argente');assert.ok(['07','08'].includes(old.hair));assert.equal(old.hat,null);
 const saved=JSON.parse(JSON.stringify(g.serialize())),copy=new api.Game(saved);for(const n of g.npcs.filter(n=>n.civilian)){const restored=copy.npcs.find(v=>v.id===n.id);if(restored)assert.deepEqual(JSON.parse(JSON.stringify(restored.civilian.appearance)),JSON.parse(JSON.stringify(n.civilian.appearance)));}
});
test('walk phase follows distance, one-shot deaths freeze, and all masks restore hair when removed',async()=>{
 assert.equal(api.civilianFrame('walk',0,6),api.civilianFrame('walk',99,6));assert.equal(api.civilianFrame('walk',0,0),api.civilianFrame('walk',0,24));assert.equal(api.civilianFrame('death',99),7);
 const g=game(),n=g.npcs.find(n=>n.civilian),a={...n.civilian.appearance,outfit:'TR03-masculin-chenal',sex:'masculin',age:'adulte',hair:'14',color:'argente',hat:null,beard:null,moustache:null};
 await api.CIVILIAN_BITMAPS.preload(a);const plain=api.CIVILIAN_BITMAPS.get(a,'flee',1,2).toBuffer('image/png');a.hat=api.CIVILIAN_ART.outfits[a.outfit].hat;await api.CIVILIAN_BITMAPS.preload(a);const hat=api.CIVILIAN_BITMAPS.get(a,'flee',1,2).toBuffer('image/png');assert.notDeepEqual(hat,plain);a.hat=null;assert.deepEqual(api.CIVILIAN_BITMAPS.get(a,'flee',1,2).toBuffer('image/png'),plain);
});
test('danger interrupts work with a startle, uses existing shelter paths, then runs and returns',()=>{
 const g=game(),n=g.stations.find(s=>s.site==='camp').actor;g.solid=()=>false;g.lineClear=()=>true;g.civilianAction(n,'idle');Object.assign(g.player,{x:n.x,y:n.y+20});
 const e=api.enemy('cultist',n.x+80,n.y,'test-danger');g.enemies.push(e);g.assessCivilians(true);assert.equal(n.civilian.action,'startle');assert.equal(n.dangerState.mode,'leaving');assert.equal(g.npcPresent(n),false);
 n.dangerState.shelter={x:n.x-100,y:n.y};for(let i=0;i<20;i++){g.time+=.04;g.stepNpcs(.04);}assert.equal(n.civilian.action,'flee');assert.ok(n.civilian.distance>0);assert.equal(g.prepareTransport(n.id),false);
});
test('a seated civilian stands before moving and a hit interrupts the job without creating an attack',()=>{
 const g=game(),n=g.npcs.find(n=>n.resident);g.solid=()=>false;g.civilianAction(n,'seated');const old={x:n.x,y:n.y};assert.equal(g.walkNpc(n,{x:n.x+30,y:n.y},.04),false);assert.equal(n.x,old.x);assert.equal(n.civilian.action,'stand_up');
 g.civilianAction(n,'craft');assert.equal(g.damageCivilian(n,1,g.player),true);assert.equal(n.civilian.action,'hit');assert.equal(g.damageCivilian(n,1,g.player),false);assert.ok(n.dangerState);assert.equal(g.npcPresent(n),false);
});
test('ordinary civilian deaths persist, cannot talk/collide/recruit, and do not grant player XP',()=>{
 const g=game(),n=g.npcs.find(n=>n.resident),xp=g.player.xp,kills=g.player.kills;n.x+=12;const x=n.x;
 assert.equal(g.damageCivilian(n,50,g.player),true);assert.equal(n.civilian.dead,true);assert.equal(n.civilian.action,'death');assert.equal(g.npcPresent(n),false);assert.equal(g.recruitCompanion(n),false);assert.equal(g.talkTo(n),false);assert.ok(!g.bodies(g.player).includes(n));assert.equal(g.player.xp,xp);assert.equal(g.player.kills,kills);
 const copy=new api.Game(JSON.parse(JSON.stringify(g.serialize()))),dead=copy.npcs.find(v=>v.id===n.id);assert.ok(dead.civilian.dead);assert.equal(dead.x,x);assert.equal(dead.civilian.action,'death');copy.assessCivilians(true);assert.equal(dead.dangerState,undefined);
});
test('quest and transport services survive fatal damage, companions retain their existing down/heal rules',()=>{
 const g=game(),n=g.stations[0].actor;g.damageCivilian(n,99,g.player);assert.equal(n.civilian.dead,false);assert.equal(n.civilian.hp,1);
 const e=g.escortActor;g.recruitCompanion(e);g.damageCivilian(e,99,g.player);assert.equal(g.companion.down,true);assert.equal(e.civilian.action,'death');assert.equal(e.civilian.dead,false);g.companion.down=false;g.companion.hp=3;g.time+=.1;g.stepCivilianAnimations(.1);assert.equal(e.civilian.action,'stand_up');
});
test('swept hostile projectiles hit visible civilians but ignore sheltered residents and different levels',()=>{
 const g=game(),n=g.npcs.find(n=>n.resident);g.lineClear=()=>true;g.shots=[{x:n.x-15,y:n.y,vx:750,vy:0,life:1,damage:2,level:0}];g.civilianProjectiles(.04);assert.equal(n.civilian.hp,4);assert.equal(g.shots.length,0);
 n.alpha=0;n.civilian.inv=0;g.shots=[{x:n.x-15,y:n.y,vx:750,vy:0,life:1,damage:2,level:0}];g.civilianProjectiles(.04);assert.equal(n.civilian.hp,4);assert.equal(g.shots.length,1);
});
