'use strict';
const {test,before}=require('node:test'),assert=require('node:assert/strict');
const {loadGame}=require('./game-harness.cjs'),A=require('../sprites/batraciens/batraciens-combattants.js');
let api;before(async()=>api=await loadGame());
function arena(role='village_guard'){
 const g=new api.Game(),n=g.npcs.find(n=>n.batracien?.role===role);g.lineClear=()=>true;g.solid=()=>false;g.npcs=[n];g.enemies=[];
 Object.assign(n,{x:100,y:100,dir:1,level:0,stun:0,hurt:0,wind:0,attack:0});n.post={x:100,y:100};Object.assign(n.batracien,{action:'guard',elapsed:.2,guardRaise:0,guardHold:.72,blockCount:0,inv:0,cooldown:1});Object.assign(g.player,{x:120,y:100,level:0,combo:0,inv:0});return {g,n,b:n.batracien};
}
test('all role attacks have attached hands, binary smears only on strike, four authored views',()=>{
 for(const role of Object.keys(A.ROLES))for(const action of A.ATTACKS[role])for(let dir=0;dir<4;dir++){
  const c=A.CLIPS[action],contactFrame=A.frameAt(action,c.contact+.001);assert.ok(c.activeFrames.includes(contactFrame));
  for(let frame=0;frame<c.frames;frame++){
   const im=A.raster({role,action,dir,frame}),plain=A.raster({role,action,dir,frame,smear:false});
   for(let i=3;i<im.data.length;i+=4)assert.ok(im.data[i]===0||im.data[i]===255);
   const hand=im.metadata.weapon.hand;assert.deepEqual(im.metadata.joints[1].hand,hand);assert.ok(im.data[(hand[1]*80+hand[0])*4+3]);
   if(!c.activeFrames.includes(frame))assert.deepEqual(im.data,plain.data);
   assert.equal(im.metadata.release,action==='throw_javelin'&&frame>=5);
  }
 }
});
test('front shield blocks twice, rear hits land, heavy fourth strike breaks guard',()=>{
 for(const mode of ['front','rear','heavy']){const {g,n,b}=arena(),hp=b.hp;
  if(mode==='rear')g.player.x=80;if(mode==='heavy')g.player.combo=3;
  g.damageBatracienGuard(n,1,g.player);
  if(mode==='front'){assert.equal(b.hp,hp);assert.equal(b.action,'block');g.damageBatracienGuard(n,1,g.player);assert.equal(b.hp,hp);assert.equal(b.blockCount,2);g.damageBatracienGuard(n,1,g.player);assert.ok(b.hp<hp);}
  else {assert.ok(b.hp<hp);if(mode==='heavy')assert.ok(n.stun>=.85);}
 }
});
test('raising a shield, another floor, an obstruction and unblockable damage never produce a block',()=>{
 for(const mode of ['raising','floor','wall','unblockable','unarmed']){const {g,n,b}=arena();if(mode==='raising')b.guardRaise=.1;if(mode==='floor')g.player.level=1;if(mode==='wall')g.lineClear=()=>false;if(mode==='unblockable')g.player.unblockable=true;if(mode==='unarmed')b.role='scout';assert.equal(g.tryBatracienBlock(n,g.player),false,mode);}
});
test('enemy and guard shield use the same defense without invulnerability behind the shield',()=>{
 const {g,n,b}=arena();g.npcs=[];g.enemies=[n];n.world=true;n.hp=n.maxHp=b.hp;n.kind='batracien';
 const hp=n.hp;g.damageEnemy(n,1);assert.equal(n.hp,hp);assert.equal(b.action,'block');g.player.x=80;g.damageEnemy(n,1);assert.ok(n.hp<hp);
});
test('a raised shield expires, allowing the next attack instead of an endless guard loop',()=>{
 const {g,n,b}=arena();g.reportBatracienAssault(n,g.player);for(let i=0;i<30;i++)g.stepBatracienWardens(.04);assert.ok(A.isAttack(b.action),b.action);
});
test('sword and lance categories alternate actual gameplay attacks and scout jabs only at close range',()=>{
 for(const role of ['boat_escort','village_guard','raider','scout']){
  const {g,n,b}=arena(role==='raider'?'village_guard':role);b.role=role;g.npcs=[];g.enemies=[n];n.world=true;n.kind='batracien';n.speed=0;n.ai='chase';g.inSafe=()=>null;g.safeZone=()=>false;g.brain=()=>({engage:true});g.damagePlayer=()=>{};
  const seen=[];for(let turn=0;turn<2;turn++){Object.assign(b,{action:'idle',elapsed:0,cooldown:0});Object.assign(n,{stun:0,x:100,y:100});Object.assign(g.player,{x:role==='scout'?(turn===0?180:120):120,y:100});g.stepBatracienEnemy(n,.04);seen.push(b.action);for(let i=0;i<21;i++)g.stepBatracienEnemy(n,.04);}
  assert.deepEqual(seen,role==='scout'?['throw_javelin','jab']:A.ATTACKS[role].slice(0,2));
 }
});

test('side torso remains closed with shields hidden, independent of outfit decoration',()=>{
 for(const role of Object.keys(A.ROLES))for(const action of [...A.ATTACKS[role],'guard','block'])for(const dir of [1,3])for(let frame=0;frame<A.CLIPS[action].frames;frame++){
  for(const outfit of [true,false]){const im=A.raster({role,action,dir,frame,equipment:false,outfit,smear:false});assert.ok(im.metadata.torso.length>0);
   for(const[x,y]of im.metadata.torso)assert.equal(im.data[(y*80+x)*4+3],255,[role,action,dir,frame,x,y].join('/'));
  }
 }
});
test('six occupation outfits remain distinct without equipment and respect native binary pixels',()=>{
 const hashes=new Set(),crypto=require('node:crypto');for(const role of Object.keys(A.ROLES)){
  assert.ok(A.OUTFITS[role].label);const im=A.raster({role,action:'idle',dir:2,frame:0,equipment:false});hashes.add(crypto.createHash('sha256').update(im.data).digest('hex'));
  for(const action of Object.keys(A.CLIPS))for(let dir=0;dir<4;dir++){const a=A.raster({role,action,dir,frame:0}),b=A.raster({role,action,dir,frame:0,palette:'jade'});for(let i=3;i<a.data.length;i+=4){assert.ok(a.data[i]===0||a.data[i]===255);assert.equal(a.data[i],b.data[i]);}}
 }assert.equal(hashes.size,6);
});

test('armed idle and gait keep a drawn weapon at its hand socket in every view',()=>{
 for(const role of Object.keys(A.ROLES))for(const action of ['idle','walk','patrol','flee'])for(let dir=0;dir<4;dir++)for(let frame=0;frame<8;frame++){
  const a=A.raster({role,action,dir,frame}),b=A.raster({role,action,dir,frame,equipment:false});const {hand,tip}=a.metadata.weapon;
  assert.deepEqual(a.metadata.joints[1].hand,hand);assert.equal(a.metadata.active,false);assert.equal(a.metadata.release,false);
  let visible=0;for(let y=tip[1]-1;y<=tip[1]+1;y++)for(let x=tip[0]-1;x<=tip[0]+1;x++){const i=(y*80+x)*4;if(a.data[i+3]&&a.data.slice(i,i+4).some((v,k)=>v!==b.data[i+k]))visible++;}
  assert.ok(visible>0,[role,action,dir,frame,'drawn tip'].join('/'));
  for(const[x,y]of a.metadata.torso)assert.equal(b.data[(y*80+x)*4+3],255);
 }
});

test('combat footwork faces the target while strafing, retreats when crowded and stops at walls',()=>{
 const {g,n,b}=arena();n.speed=24;n.hurt=0;b.footwork=0;g.player.x=n.x+24;g.player.y=n.y;const old={x:n.x,y:n.y};g.batracienCombatMove(n,g.player,.04);assert.notEqual(n.y,old.y);assert.equal(n.dir,g.direction(g.player.x-n.x,g.player.y-n.y));
 Object.assign(n,{x:100,y:100});Object.assign(g.player,{x:110,y:100});g.batracienCombatMove(n,g.player,.04);assert.ok(n.x<100);assert.equal(n.dir,1);
 const p={x:n.x,y:n.y};g.solid=()=>true;g.batracienCombatMove(n,g.player,.04);assert.equal(n.x,p.x);assert.equal(n.y,p.y);g.solid=()=>false;g.lineClear=()=>false;assert.equal(g.batracienCombatMove(n,g.player,.04),0);
});
test('headgear keeps visible eyes and uses fixed material colors across skin palettes',()=>{
 const skinEyes=new Set(['a','e','y','i'].map(k=>require('../sprites/batraciens/batraciens-complet.js').Male.PALETTE[k]));
 const rgb=(d,i)=>'#'+[d[i],d[i+1],d[i+2]].map(v=>v.toString(16).padStart(2,'0')).join('');
 for(const role of Object.keys(A.ROLES))for(let dir=0;dir<4;dir++){
  const base=A.raster({role,action:'idle',dir,frame:0,headgear:false}),dressed=A.raster({role,action:'idle',dir,frame:0}),jade=A.raster({role,action:'idle',dir,frame:0,palette:'jade'});
  for(let i=0;i<base.data.length;i+=4){const y=Math.floor(i/4/80);if(y<42&&base.data[i+3]&&skinEyes.has(rgb(base.data,i)))assert.deepEqual(dressed.data.subarray(i,i+4),base.data.subarray(i,i+4),role+'/'+dir+'/eyes');
   if(dressed.data.subarray(i,i+4).some((v,k)=>v!==base.data[i+k]))assert.deepEqual(dressed.data.subarray(i,i+4),jade.data.subarray(i,i+4),role+'/'+dir+'/material');
  }
  if(role==='raider')assert.deepEqual(base.data,dressed.data);
 }
});
test('short combos sometimes continue, sometimes pause, and never chain ranged throws',()=>{
 const {g,n,b}=arena();g.npcs=[];g.enemies=[n];Object.assign(n,{kind:'batracien',world:true,speed:0,stun:0,hurt:0});Object.assign(g.player,{x:122,y:100});g.safeZone=()=>false;g.brain=()=>({engage:true});g.damagePlayer=()=>{};let chains=0,pauses=0;
 for(let serial=0;serial<20;serial++){
  Object.assign(b,{role:'boat_escort',action:'idle',elapsed:0,cooldown:0,comboIndex:0,chainQueued:false,attackSerial:serial});g.stepBatracienEnemy(n,.04);for(let i=0;i<21;i++)g.stepBatracienEnemy(n,.04);if(b.chainQueued)chains++;else pauses++;
 }assert.ok(chains>0);assert.ok(pauses>0);
 Object.assign(b,{role:'scout',action:'idle',elapsed:0,cooldown:0,chainQueued:false});g.player.x=180;g.stepBatracienEnemy(n,.04);assert.equal(b.action,'throw_javelin');for(let i=0;i<30;i++)g.stepBatracienEnemy(n,.04);assert.equal(!!b.chainQueued,false);
});
