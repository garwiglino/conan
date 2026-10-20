'use strict';
const {test,before}=require('node:test'),assert=require('node:assert/strict');
const W=require('../scripts/kaldor-weapons.js'),{loadGame,canvas}=require('./game-harness.cjs');
let api;
before(async()=>{api=await loadGame();assert.equal(await api.HearthreaverKaldorCivilianArt.preload(),true);});
const plain=v=>JSON.parse(JSON.stringify(v));

test('48 authored arms cover seven peoples, five territories and eight distinct melee families',()=>{
 assert.equal(W.all.length,48);assert.equal(new Set(W.all.map(w=>w.id)).size,48);
 assert.equal(new Set(W.all.map(w=>w.family)).size,8);assert.equal(new Set(W.all.map(w=>w.territory)).size,5);
 for(const culture of ['Gobelins','Orques','Batraciens','Hommes-serpents','Hommes-singes','Humains','Centaures'])assert.ok(W.all.some(w=>w.culture.includes(culture)));
 assert.ok(Math.min(...W.all.map(w=>w.damage))<1&&Math.max(...W.all.map(w=>w.damage))>2);
 assert.ok(W.all.some(w=>w.tempo<.8)&&W.all.some(w=>w.tempo>1.4));
 const {Atlas}=api;for(const w of W.all.filter(w=>w.id!==W.START)){if(w.site){assert.ok(Atlas.byId[w.site],w.id);assert.ok(w.place);}else assert.ok(w.discovery,w.id+' carried source');assert.ok(w.description);}
});

test('all 39 racks are approachable, clear of buildings, transport, people and outfit stands',()=>{
 const {Game,Atlas}=api,g=new Game(),racks=g.atlasProps.filter(o=>o.kind==='kaldor_weapon');assert.equal(racks.length,39);
 for(const rack of racks){
  assert.ok(!g.solid(rack.x,rack.y,10,0)&&!g.solid(rack.x,rack.y-18,8,0),rack.weapon+' open ground');
  const site=Atlas.byId[rack.site],p=Atlas.toGame(site.x,site.y);assert.ok(Math.hypot(rack.x-p.x,rack.y-p.y)<=170);
  for(const o of [...g.atlasProps,...g.world.props])if(o!==rack)assert.ok(Math.hypot(o.x-rack.x,o.y-rack.y)>(/^transport_/.test(o.kind)?40:18),rack.weapon+' clear of '+o.kind);
  for(const n of g.npcs)assert.ok(Math.hypot(n.x-rack.x,n.y-rack.y)>18,rack.weapon+' clear of '+n.id);
  const seen=new Set(['0,0']),queue=[[0,0]];let far=0;
  while(queue.length&&far<120){const [x,y]=queue.shift();far=Math.max(far,Math.hypot(x,y));for(const [dx,dy]of [[8,0],[-8,0],[0,8],[0,-8]]){const a=x+dx,b=y+dy,k=a+','+b;if(seen.has(k)||Math.hypot(a,b)>140)continue;seen.add(k);if(!g.solid(rack.x+a,rack.y+b,5,0))queue.push([a,b]);}}
  assert.ok(far>=120,rack.weapon+' accessible patch');
 }
});

test('discovery requires proximity, persists, equips only owned arms and never resets a live attack',()=>{
 const {Game}=api,g=new Game(),rack=g.atlasProps.find(o=>o.kind==='kaldor_weapon'&&o.weapon==='couteau-roulier');
 assert.equal(g.takeWeapon('brise-givre'),false,'remote pickup denied');assert.equal(g.equipWeapon('brise-givre'),false);
 Object.assign(g.player,{x:rack.x,y:rack.y+8,level:0,spawnFX:0});assert.equal(g.context().kind,'weapon');g.interact();
 assert.ok(g.arsenal.owned.includes(rack.weapon));assert.equal(rack.taken,true);assert.equal(g.takeWeapon(rack.weapon),false);
 assert.equal(g.equipWeapon(rack.weapon),true);assert.equal(g.player.weapon,rack.weapon);assert.equal(g.player.kaldorWeapon.mode,'drawing');
 g.swingSword();assert.equal(g.player.attack,W.duration(rack.weapon,0));assert.equal(g.equipWeapon(W.START),false);assert.equal(g.player.attack,W.duration(rack.weapon,0));
 const s=g.serialize(),r=new Game(plain(s));assert.deepEqual(plain(r.arsenal),plain(g.arsenal));assert.equal(r.player.weapon,rack.weapon);
 assert.equal(r.atlasProps.find(o=>o.weapon===rack.weapon).taken,true);
 const old=new Game({...plain(s),arsenal:undefined});assert.equal(old.player.weapon,W.START);
 const corrupt=new Game({...plain(s),arsenal:{owned:['not-real',null,'lance-paleval','lance-paleval'],equipped:'brise-givre'}});
 assert.deepEqual(plain(corrupt.arsenal),{owned:[W.START,'lance-paleval'],equipped:W.START});
});

test('weapon damage, individual timings and all hero collision channels use the equipped arm',()=>{
 const {Game,attackFrame,attackLength,bladeHits}=api,g=new Game();
 for(const id of ['couteau-roulier','brise-givre','garde-palmes']){
  g.player.weapon=id;
  assert.equal(g.weaponDamage(1),W.get(id).damage);assert.equal(g.weaponDamage(2),W.get(id).damage*2);
  for(let combo=0;combo<4;combo++){
   assert.equal(attackLength(combo,id),W.duration(id,combo));
   const t=W.times(id,combo);assert.equal(attackFrame(W.duration(id,combo)-t[1]-.001,combo,id),2);
  }
 }
 for(const w of W.all.filter(w=>w.id!==W.START))for(let dir=0;dir<4;dir++)for(let combo=0;combo<4;combo++)for(const f of [2,3]){
  const p={x:100,y:100,dir,combo,weapon:w.id},q=W.pose(w.id,dir,f,combo);
  const delta=require('../scripts/world-projection').inverse(q.h[0]+q.u[0]*q.reach,q.h[1]+q.u[1]*q.reach+9),e={x:p.x+delta.x,y:p.y+delta.y,r:1};
  assert.ok(bladeHits(p,e,f),w.id+' matches the drawn tip');
  assert.equal(bladeHits(p,{...e,level:1},f),false,'different floor');
  assert.equal(bladeHits(p,{x:600,y:600,r:6},f),false);assert.equal(bladeHits(p,e,1),false);
 }
 // One actual hit on an ordinary enemy, not only catalogue arithmetic.
 for(const w of [W.get('couteau-roulier'),W.get('brise-givre')]){
  const h=new Game();h.player.weapon=w.id;
  const e={kind:'snake',x:h.player.x+15,y:h.player.y,hp:20,maxHp:20,level:0,r:6,id:'test-victim',stun:0,wind:0,attack:0};
  h.damageEnemy(e,h.weaponDamage(1));assert.ok(Math.abs(e.hp-(20-w.damage*h.power()))<.011);
 }
});

test('every arm renders four combos in four views, including intermediate poses, without clipping',()=>{
 const A=api.HearthreaverKaldorCivilianArt,signatures=new Map();
 for(const w of W.all){
  A.wield(w.id);
  for(let d=0;d<4;d++)for(let c=0;c<4;c++)for(const f of [1,1.5,2,2.5,3,3.5,4,5]){
   
   const im=A.nativeFrame(d,'attack',f,c,api.swordPose);assert.ok(im,w.id);
   const a=im.getContext('2d').getImageData(0,0,80,80).data;
   for(let x=0;x<80;x++)assert.equal(a[(79*80+x)*4+3],0,w.id+' bottom '+d+':'+c+':'+f);
   for(let y=0;y<80;y++)for(const x of [0,79])assert.equal(a[(y*80+x)*4+3],0,w.id+' side');
   if(d===1&&c===0&&f===2)signatures.set(w.id,Buffer.from(a).toString('base64'));
   if(w.id!==W.START){const p=A.attackPose(d,f,c,api.swordPose),v=W.pose(w.id,d,f,c);assert.deepEqual(plain(p.hand),v.h);assert.deepEqual(plain(p.blade),v.u);}
  }
 }
 assert.equal(new Set(signatures.values()).size,W.all.length,'individual silhouettes, not stat-only clones');A.wield(W.START);
});

test('every family supports moving holsters, guard, hurt and all outfits and helmets',()=>{
 const A=api.HearthreaverKaldorCivilianArt;
 for(const w of W.all){A.wield(w.id);for(let d=0;d<4;d++)for(const [state,n]of [['walk',8],['sheathed_walk',8],['sheathe_walk',48],['draw_walk',40],['guard',6],['sheathed_hurt',4],['sheathed_dash',4]]){
  for(const f of [0,n-1])assert.ok(A.nativeFrame(d,state,f,0,api.swordPose),w.id+':'+state);
 }}
 for(const id of ['pagne-noue','brigandine-mercenaire','voiles-nomade','harnais-arene','pelisse-grand-froid','peau-ours','cuir-traqueur','cotte-mailles','robe-serpent','corsaire','kaftan-steppes']){
  A.wear(id);for(const helm of [null,'casque-nasal','casque-cornes','casque-fourre','casque-arene','heaume-ferme']){
   A.wearHelmet(helm);for(const family of Object.keys(W.families)){
    A.wield(W.all.find(w=>w.family===family&&w.id!==W.START).id);
    for(let d=0;d<4;d++)assert.ok(A.nativeFrame(d,'attack',2.5,3,api.swordPose),id+':'+helm+':'+family);
   }
  }
 }
 A.wear('pagne-noue');A.wearHelmet(null);A.wield(W.START);
});

test('inventory identifies owned arms and discovery locations, and racks draw their actual silhouettes',()=>{
 const {Game,KaldorArsenal}=api,g=new Game();const markup=KaldorArsenal.inventoryHTML(g);
 assert.match(markup,/Armes · 1\/48/);assert.match(markup,/47 armes à découvrir/);assert.match(markup,/Veille-Boréale/);assert.match(markup,/data-equip-weapon="exile"/);
 const cv=canvas.createCanvas(80,80);KaldorArsenal.drawWeapon(cv.getContext('2d'),'garde-palmes',40,60,0,-1);
 assert.ok(cv.getContext('2d').getImageData(0,0,80,80).data.some(v=>v));
});


test('all existing arm, hand and sleeve silhouettes keep their exact pixels after translation',async()=>{
 const native=require('../data/weapons/native-arms.json'),{loadImage}=require('@napi-rs/canvas'),A=api.HearthreaverKaldorCivilianArt;
 function shape(cv){const d=cv.getContext('2d').getImageData(0,0,80,80).data,points=[];let x0=80,y0=80;
  for(let y=0;y<80;y++)for(let x=0;x<80;x++){const i=(y*80+x)*4;if(d[i+3]){x0=Math.min(x0,x);y0=Math.min(y0,y);points.push([x,y,...d.slice(i,i+4)]);}}
  return points.map(([x,y,...c])=>[x-x0,y-y0,...c]);
 }
 for(const [id,views]of Object.entries(native.outfits)){
  A.wear(id);
  for(let dir=0;dir<4;dir++){
   const view=[2,1,0,3][dir],parts=views[view],originals=[];
   for(const p of parts){const im=await loadImage(Buffer.from(p.png,'base64')),cv=canvas.createCanvas(80,80);cv.getContext('2d').drawImage(im,0,0);originals.push(shape(cv));}
   for(const family of Object.keys(W.families))for(const hands of [1,2]){
    const weapon=W.all.find(w=>w.family===family&&w.hands===hands&&w.id!==W.START);if(!weapon)continue;A.wield(weapon.id);
    for(const f of [1,2,3,4,5]){
     const pose=W.pose(weapon.id,dir,f,0),layers=A.nativeArmLayers(dir,pose.h,pose.u);
     parts.forEach((p,i)=>{const main=p.side===null||p.side===(dir===0?'right':'left');assert.deepEqual(shape(layers[main?'front':'back']),originals[i],id+':'+family+':'+hands+' hands');});
    }
   }
  }
 }
 A.wear('pagne-noue');A.wield(W.START);
});

test('the legendary Clairfoyer sword is reachable beside the actual spawn and stays acquired after reload',()=>{
 const {Game}=api,g=new Game(),w=W.get('flamme-clairfoyer'),rack=g.atlasProps.find(o=>o.kind==='kaldor_weapon'&&o.weapon===w.id);
 assert.equal(w.rarity,'Légendaire');assert.equal(w.site,'camp');assert.equal(w.hands,2);assert.equal(W.finisher(w.id).effect,'ember');
 assert.ok(Math.hypot(rack.x-g.player.x,rack.y-g.player.y)<40,'near actual player spawn, not only the distant camp marker');
 assert.ok(g.lineClear(g.player,rack));assert.ok(!g.solid(rack.x,rack.y,10,0));assert.ok(!g.solid(rack.x,rack.y-18,8,0));
 assert.equal(g.takeWeapon(w.id),false,'still a local pickup');
 Object.assign(g.player,{x:rack.x,y:rack.y+8,level:0,spawnFX:0});assert.equal(g.context()?.kind,'weapon');
 g.interact();assert.ok(g.arsenal.owned.includes(w.id));assert.equal(rack.taken,true);assert.equal(g.player.weapon,W.START,'no automatic equip');assert.equal(g.takeWeapon(w.id),false);
 assert.equal(g.equipWeapon(w.id),true);
 const restored=new Game(plain(g.serialize()));assert.ok(restored.arsenal.owned.includes(w.id));assert.equal(restored.player.weapon,w.id);assert.ok(restored.atlasProps.find(o=>o.weapon===w.id).taken);
});
