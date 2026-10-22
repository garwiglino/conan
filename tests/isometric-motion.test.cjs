'use strict';
const {test,before}=require('node:test'),assert=require('node:assert/strict');
const P=require('../scripts/world-projection.js'),{loadGame,combatGame,canvas}=require('./game-harness.cjs');
let a;before(async()=>{a=await loadGame();});
const axes=Array.from({length:16},(_,i)=>[Math.cos(i*Math.PI/8),Math.sin(i*Math.PI/8)]);
function arena(){const g=combatGame(a);g.npcs=[];g.enemies=[];g.party=[];g.seals=g.seals.map(()=>true);g.solid=()=>false;g.crowd=()=>false;g.player.onStairs=false;g.player.level=0;g.supplies.fatigue=0;g.needs.dehydrated=0;return g;}
function near(actual,expected){assert.ok(Math.abs(actual-expected)<1e-7,`${actual} != ${expected}`);}
test('player walking and enemy movement cover equal displayed distances on sixteen axes',()=>{
 const g=arena();
 for(const [x,y]of axes){
  const p=g.player;Object.assign(p,{x:1000,y:1000});g.movePlayer(p,x*2,y*2);near(P.distance(p.x-1000,p.y-1000),2);
  const e={x:1000,y:1000,r:5};g.move(e,x*2,y*2);near(P.distance(e.x-1000,e.y-1000),2);
 }
 // An unblocked result remains collinear with the requested logical path.
 const e={x:0,y:0};g.move(e,1,2);near(e.y/e.x,2);
});
test('dungeon player and grabbed crate share one conversion and keep their grip offset',()=>{
 const g=arena();g.startFirstDungeon();g.enterDungeonFloor('grande-salle',{x:368,y:208});g.solid=()=>false;g.crowd=()=>false;
 for(const [x,y]of axes){Object.assign(g.player,{x:368,y:208});g.movePlayer(g.player,x,y);near(P.distance(g.player.x-368,g.player.y-208),1);}
 // The actual paired sweep is exercised in the crate regression suite; here
 // capture its input to catch a second conversion between movePlayer and grip.
 g.dungeonGrip={id:1};let v;g.moveDungeonCrate=(p,x,y)=>{v={x,y};};g.movePlayer(g.player,1,1);near(P.distance(v.x,v.y),Math.SQRT2);
});
test('live dungeon input has the same walking, guarding and dodge speed in every screen direction',()=>{
 const g=arena();g.startFirstDungeon();g.enterDungeonFloor('grande-salle',{x:368,y:208});g.enemies=[];g.npcs=[];g.solid=()=>false;g.crowd=()=>false;
 for(const mode of ['walk','guard','dodge'])for(const [x,y]of axes){const p=g.player;Object.assign(p,{x:368,y:208,spawnFX:0,attack:0,attackCD:0,hurt:0,held:null,thrown:null,inv:999,dash:0,dashCD:0,guard:false,guardHeld:false});g.targetId=null;g.dungeonGrip=null;
  const input={x,y,guard:mode==='guard',dodge:mode==='dodge'};g.update(.02,input);const expected=(mode==='guard'?29:mode==='dodge'?120:67)*.02;near(P.distance(p.x-368,p.y-208),expected);
 }
});
test('NPC path budgets use displayed length, including turns and exact arrival',()=>{
 const g=arena();g.party=[];
 for(const [x,y]of axes){const n={id:'motion-npc',x:1000,y:1000},to={x:1000+x*200,y:1000+y*200};n.pathKey=Math.floor(to.x/16)+','+Math.floor(to.y/16);n.path=[to];g.walkNpc(n,to,.1);near(P.distance(n.x-1000,n.y-1000),3.2);}
 const n={id:'turning',x:1000,y:1000},to={x:1010,y:1010};n.pathKey=Math.floor(to.x/16)+','+Math.floor(to.y/16);n.path=[{x:1002,y:1000},to];
 const first=P.distance(2,0),remaining=3.2-first;g.walkNpc(n,to,.1);near(P.distance(n.x-1002,n.y-1000),remaining);
 for(let i=0;i<50;i++)g.walkNpc(n,to,.1);near(n.x,to.x);near(n.y,to.y);
});
test('batracien path replay does not apply the projection compensation twice',()=>{
 const g=combatGame(a),n=g.npcs.find(n=>n.batracien&&n.civilian);assert.ok(n);g.party=[];g.solid=()=>false;g.crowd=()=>false;g.civilianAction(n,'idle');
 for(const [x,y]of axes){Object.assign(n,{x:1000,y:1000});const to={x:1000+x*200,y:1000+y*200};n.pathKey=Math.floor(to.x/16)+','+Math.floor(to.y/16);n.path=[to];g.walkNpc(n,to,.1);near(P.distance(n.x-1000,n.y-1000),3.2);}
});
test('corrected steps still stop at solid geometry',()=>{
 const g=arena(),e={x:1000,y:1000,r:5};g.solid=(x,y)=>x>1001||y>1001;g.move(e,5,5);assert.ok(e.x<=1001&&e.y<=1001);
});
test('world camera keeps one native pixel phase at every render density and odd viewport size',()=>{
 const g=arena(),r=new a.Renderer(canvas.createCanvas(640,400),canvas.createCanvas(1,1),g);
 const cameraReady=Error('camera-ready');r.drawAtlasGround=()=>{throw cameraReady;};
 g.player.spawnFX=0;Object.assign(g.player,{x:800,y:800});
 for(const K of [1,2,3,4]){r.resize(321,201,{l:0,r:0,t:0,b:0},K);
  for(const f of [.05,.22,.49,.51,.78,.95]){Object.assign(g.player,{x:800+f,y:800+f*.3});g.time+=.02;assert.throws(()=>r.frame(),e=>e===cameraReady);r.c.restore();const p=P.point(g.player.x,g.player.y);assert.ok(Number.isInteger(r.cam.x)&&Number.isInteger(r.cam.y));near(P.snap(p.x)-r.cam.x,160);near(P.snap(p.y)-r.cam.y,Math.floor((201-r.top)/2)+14);}
 }
});
