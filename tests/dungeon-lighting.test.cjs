'use strict';
const {test,before}=require('node:test'),assert=require('node:assert/strict'),{loadGame,canvas}=require('./game-harness.cjs');
let a;before(async()=>{a=await loadGame();await a.FirstDungeon.art.promise;});
function fixture(id='grande-salle'){const floor=a.FirstDungeon.art.floors[id],seen=[...new Set(floor.items.flatMap(it=>(it.cells||[]).map(p=>p.join(','))))],s={seen,open:[]};return {g:{dungeon:{active:true,floor:id,floors:{[id]:s}},player:{x:320,y:160},time:0},floor,s};}
test('every authored torch and brazier produces a projected dynamic source in each dungeon floor',()=>{
 for(const id of ['geoles','grande-salle','galeries','trone']){const r=fixture(id),out=a.DungeonLighting.collect(r),expected=r.floor.items.filter(it=>/mur-torche$|^brasero$/.test(it.piece));assert.ok(expected.length>0);
  for(const it of expected){const spec=a.FirstDungeon.design;assert.ok(out.sources.some(s=>s.piece===it.piece&&s.x>=it.ref[0]&&s.y>=it.ref[1]));}
  for(const s of out.sources){assert.equal(s.screen.x,s.x-s.y);assert.equal(s.screen.y,(s.x+s.y)/2-s.z);assert.ok(s.radius>0&&s.intensity>0);}
 }
});
test('unseen rooms do not contribute lights; opened rune doors and a rescued fairy lose their fixture glow',()=>{
 const r=fixture();r.s.seen=[];assert.equal(a.DungeonLighting.collect(r).sources.length,0);r.s.seen=r.floor.items.flatMap(it=>(it.cells||[]).map(p=>p.join(',')));
 const door=r.floor.items.find(it=>it.piece.endsWith('/porte-scellee'));assert.ok(door);assert.ok(a.DungeonLighting.collect(r).sources.some(s=>s.piece===door.piece));r.s.open=[door.edge.join(',')];assert.ok(!a.DungeonLighting.collect(r).sources.some(s=>s.piece.endsWith('/porte-scellee')));
 const throne=fixture('trone');assert.ok(a.DungeonLighting.collect(throne).sources.some(s=>s.piece==='cage-fee'));throne.g.dungeon.fairy=true;assert.ok(!a.DungeonLighting.collect(throne).sources.some(s=>s.piece==='cage-fee'));
});
test('torch light flickers gently, while underground ambient remains dark regardless of the world clock',()=>{
 const r=fixture(),first=a.DungeonLighting.collect(r).sources.find(s=>s.piece.endsWith('mur-torche'));r.g.time=.25;const later=a.DungeonLighting.collect(r).sources.find(s=>s.x===first.x&&s.y===first.y);assert.notEqual(first.intensity,later.intensity);assert.ok(Math.abs(first.intensity-later.intensity)<.18);
 assert.ok(a.DungeonLighting.AMBIENT.every(n=>n<90));
});
test('the shared light compositor warms actual pixels and uses a viewport-sized mask',()=>{
 const cv=canvas.createCanvas(180,140),c=cv.getContext('2d');c.fillStyle='#fff';c.fillRect(0,0,180,140);const r={cam:{x:0,y:0}};
 a.renderLightLayer(r,c,180,140,a.DungeonLighting.AMBIENT,[[90,70,45,[255,160,80],1]]);
 const at=(x,y)=>Array.from(c.getImageData(x,y,1,1).data),near=at(90,70),far=at(3,3);assert.ok(near[0]>far[0]+100);assert.ok(near[0]>near[2]);assert.ok(far.slice(0,3).every(n=>n<90));assert.equal(r.skyCv.width,182);assert.equal(r.skyCv.height,142);assert.equal(c.globalCompositeOperation,'source-over');
});
test('ordinary outdoor torches keep their existing shared light sources',()=>{
 const r={g:{time:0,player:{x:0,y:0,spawnFX:0},world:{props:[{kind:'torch',x:20,y:30}]},steles:[],seals:[]},projectedSeals:[],litOf:()=>1},lights=a.Renderer.prototype.lights.call(r);assert.equal(lights.length,4);assert.ok(lights.some(l=>l[0]===20&&l[1]===24&&l[3][0]===255&&l[3][1]===160));
});
