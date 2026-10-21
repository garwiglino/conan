'use strict';
const {test,before}=require('node:test'),assert=require('node:assert/strict');
const {loadGame,combatGame,canvas}=require('./game-harness.cjs'),W=require('../scripts/kaldor-weapons.js');
let api,g;
const plain=v=>JSON.parse(JSON.stringify(v));
before(async()=>{api=await loadGame();await api.HearthreaverKaldorCivilianArt.preload();g=combatGame(api);});
function foe(kind,id){const p=g.player,n=api.enemy(kind==='bandit'?'skeleton':kind,p.x+18,p.y,id);n.kind=kind;n.hp=1;n.world=true;n.level=p.level||0;n.guardTime=0;n.block=0;n.rage=true;n.stun=0;n.wind=0;n.attack=0;g.enemies.push(n);return n;}
function reset(){g.events=[];g.weaponDrops=[];g.arsenal.owned=[W.START];g.player.weapon=W.START;g.arsenal.equipped=W.START;g.won=false;g.dead=false;g.dying=null;g.journey=null;g.dialogue=null;g.sleeping=null;g.transit=null;g.player.level=0;g.player.riposte=0;g.player.combo=0;}

test('racial loadouts distinguish common, elite and actual frog roles; future centaurs do not populate the world',()=>{
 assert.equal(Object.keys(W.loadouts).length,9);
 for(const [species,profile]of Object.entries(W.loadouts)){
  for(const id of [profile.basic,profile.elite,...Object.values(profile.roles||{})])assert.ok(W.has(id),species+':'+id);
  if(['skeleton','cultist'].includes(species))continue;
  assert.equal(W.carriedBy({species,armed:true}),profile.basic);assert.equal(W.carriedBy({species,armed:true,elite:true}),profile.elite);
  assert.equal(W.carriedBy({species,resident:true}),null,'a race is not a combat role');
 }
 assert.equal(W.carriedBy({race:'gobelin',armed:true}),'coutelas-gobelin');assert.equal(W.carriedBy({race:'centaure',armed:true}),'lance-centaure');
 assert.equal(W.carriedBy({batracien:{role:'raider'}}),'massue-chenal');assert.equal(W.carriedBy({batracien:{role:'captain'}}),'lance-capitaine');
 assert.equal(W.carriedBy({species:'orc',kind:'boss'}),'brise-givre');assert.equal(W.carriedBy({species:'centaur',kind:'boss'}),'sarisse-horizon');
 assert.equal(W.carriedBy({kind:'snake'}),null);assert.equal(W.carriedBy({kind:'guardian'}),null);
 assert.ok(W.loadouts.centaur.future);assert.ok(!g.npcs.some(n=>W.speciesOf(n)==='centaur'));
});

test('a lethal hit drops only the carried unknown weapon; known weapons produce no drop or card',()=>{
 reset();const n=foe('skeleton','armament-death');g.damageEnemy(n,100);assert.ok(n.dead);assert.equal(g.weaponDrops.length,1);assert.equal(g.weaponDrops[0].weapon,'lame-ossuaire');
 assert.equal(g.events.filter(e=>e.type==='weaponfound').length,0,'discovery happens on approach');
 g.damageEnemy(n,100);g.dropCarriedWeapon(n);assert.equal(g.weaponDrops.length,1);
 g.arsenal.owned.push('lame-ossuaire');const known=foe('skeleton','armament-known');g.events=[];g.damageEnemy(known,100);assert.ok(known.dead);assert.ok(!g.events.some(e=>e.type==='weaponfound'));assert.ok(!g.weaponDrops.some(d=>d.source===known.id));
 const animal=foe('snake','armament-animal');g.damageEnemy(animal,100);assert.ok(!g.weaponDrops.some(d=>d.source===animal.id));
});

test('guards can kill an enemy without granting hero XP and still release its actual weapon',()=>{
 reset();const n=foe('bandit','armament-guard-kill'),guard={id:'test-fighter',x:n.x-4,y:n.y,level:0};
 const xp=g.player.xp,kills=g.player.kills;g.guardStrike(guard,n);
 assert.ok(n.dead);assert.equal(g.player.xp,xp);assert.equal(g.player.kills,kills);assert.equal(g.weaponDrops.length,1);assert.equal(g.weaponDrops[0].weapon,n.armament);assert.equal(n.armament,'sabre-piste');
});

test('picking up is local, floor- and line-of-sight-aware, gives one info card, no coins and no forced equip',()=>{
 reset();const n=foe('cultist','armament-pickup');g.damageEnemy(n,100);const d=g.weaponDrops[0],pos={x:g.player.x,y:g.player.y,level:0};
 Object.assign(g.player,{x:d.x,y:d.y,level:1});g.stepWeaponDrops(1);assert.ok(!g.arsenal.owned.includes(d.weapon));
 g.player.level=0;const clear=g.lineClear;g.lineClear=()=>false;g.stepWeaponDrops(1);assert.ok(!g.arsenal.owned.includes(d.weapon));g.lineClear=clear;
 g.events=[];const coins=g.player.coins;g.stepWeaponDrops(1);
 assert.ok(!g.arsenal.owned.includes('baton-cultiste'));assert.equal(g.weaponDrops.length,1);assert.ok(g.takeNearbyWeapon('baton-cultiste'));assert.ok(g.arsenal.owned.includes('baton-cultiste'));assert.equal(g.weaponDrops.length,0);assert.equal(g.player.coins,coins);assert.equal(g.player.weapon,W.START);
 const cards=g.events.filter(e=>e.type==='weaponfound');assert.equal(cards.length,1);assert.equal(cards[0].weapon,'baton-cultiste');assert.match(cards[0].text,/2 mains/);assert.match(cards[0].stats,/Dégâts/);assert.ok(cards[0].description);assert.deepEqual(plain(cards[0].anchor),{x:d.x,y:d.y,level:d.level});
 g.stepWeaponDrops(1);assert.equal(g.events.filter(e=>e.type==='weaponfound').length,1);Object.assign(g.player,pos);
});

test('pending weapon loot survives saving and rejects duplicates, owned arms and corrupt records',()=>{
 reset();const n=foe('bandit','armament-saved');g.damageEnemy(n,100);const saved=plain(g.serialize());
 assert.equal(saved.arsenal.drops[0].weapon,'sabre-piste');const r=combatGame(api,saved);assert.equal(r.weaponDrops.length,1);assert.equal(r.weaponDrops[0].source,n.id);
 const d=r.weaponDrops[0];api.KaldorArmaments.restoreDrops(r,[d,d,{...d,weapon:W.START},{...d,weapon:'unknown'},{...d,x:Infinity}]);assert.equal(r.weaponDrops.length,1);
 Object.assign(r.player,{x:d.x,y:d.y,level:d.level});r.dialogue=null;r.stepWeaponDrops(1);assert.ok(!r.arsenal.owned.includes(d.weapon));assert.ok(r.takeNearbyWeapon(d.weapon));const collected=plain(r.serialize());assert.equal(collected.arsenal.drops.length,0);assert.ok(collected.arsenal.owned.includes('sabre-piste'));
 const old=combatGame(api,{...saved,arsenal:undefined});assert.equal(old.weaponDrops.length,0);assert.equal(old.arsenal.equipped,W.START);
});

test('hostile human and batracien guards drop their own arms through their real damage channels',()=>{
 reset();const p=g.player,n={id:'test-armed-human',eventGuard:true,x:p.x+12,y:p.y,level:0,alpha:1,dir:2,kind:'guard',stun:0,wind:0,attack:0};g.npcs.push(n);
 const s=g.ensureHumanGuard(n);s.hp=1;s.hostileUntil=g.clock+180;g.damageHumanGuard(n,100,p);assert.ok(s.dead);assert.equal(g.weaponDrops.at(-1).weapon,'lame-milice');
 const b=g.npcs.find(n=>n.batracien?.role==='village_guard');assert.ok(b);b.batracien.hp=1;b.batracien.hostileUntil=g.clock+180;b.batracien.inv=0;b.batracien.action='idle';Object.assign(b,{x:p.x+12,y:p.y,level:0,alpha:1});
 g.damageBatracienGuard(b,100,p);assert.ok(b.batracien.dead);assert.equal(g.weaponDrops.at(-1).weapon,'lance-chenal');
});

test('the priest gives his crosse before the existing victory save, without an unreachable arena drop',()=>{
 reset();const b=foe('boss','armament-boss');g.damageEnemy(b,1000);assert.ok(b.dead&&g.won);assert.ok(g.arsenal.owned.includes('crosse-pretre'));
 assert.equal(g.weaponDrops.length,0);assert.equal(g.events.filter(e=>e.type==='weaponfound'&&e.weapon==='crosse-pretre').length,1);
 assert.ok(g.serialize().arsenal.owned.includes('crosse-pretre'));g.dropCarriedWeapon(b);assert.equal(g.events.filter(e=>e.type==='weaponfound').length,1);
});

test('native fighter rendering preserves the player outfit and identity; frog gear changes retain existing poses',()=>{
 reset();const A=api.HearthreaverKaldorCivilianArt;A.wield('brise-givre');A.wear('voiles-nomade');const old=A.weapon(),before=A.nativeFrame(1,'attack',2,0,api.swordPose);
 const n={id:'test-npc-rig',eventGuard:true,dir:1,kind:'guard'};for(const d of [0,1,2,3]){n.dir=d;for(const [s,f]of [['idle',0],['walk',4],['attack',2],['hurt',1]])assert.ok(A.npcFrame(n,s,f,'lame-milice',api.swordPose));}
 assert.equal(A.weapon(),old);assert.equal(A.nativeFrame(1,'attack',2,0,api.swordPose),before);
 const c=canvas.createCanvas(200,160).getContext('2d'),r=new api.CharacterAtlas();r.draw(c,'nomade',{...n,x:80,y:80,anim:1},0);assert.equal(A.weapon(),old);
 const F=api.Batraciens.Armed;
 for(const role of Object.keys(F.ROLES))for(const dir of [0,1,2,3]){
  const actor={batracien:{role},dir},options=api.KaldorArmaments.batracienOptions(actor);
  const bare=F.raster({role,dir,action:'thrust',frame:5,equipment:false}),held=F.raster({...options,role,dir,action:'thrust',frame:5});
  assert.deepEqual(plain(held.metadata.joints),plain(bare.metadata.joints));assert.equal(held.metadata.phase,bare.metadata.phase);assert.equal(F.CLIPS.thrust.duration,720);
 }
 A.wear('pagne-noue');A.wield(W.START);
});
