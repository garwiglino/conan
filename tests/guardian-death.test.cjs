const {test,before}=require('node:test');
const assert=require('node:assert/strict');
const {loadGame,canvas}=require('./game-harness.cjs');
let api;before(async()=>{api=await loadGame();});
function fixture(dir=2){const g=new api.Game(),e=g.enemies.find(e=>e.id==='g0'),p=g.player;
 Object.assign(e,{dir,hp:7,guardTime:0,move:null});Object.assign(p,{x:e.x+22,y:e.y+20,spawnFX:0,hp:10});g.move=()=>{};return {g,e,p};}
test('guardian wounds and fatal hits create stone, never blood, gore or flesh remains',()=>{
 for(let dir=0;dir<4;dir++){
  const {g,e,p}=fixture(dir);g.damageEnemy(e,1);
  assert.ok(g.particles.length);assert.ok(g.particles.every(v=>v.stone&&!v.gore));
  assert.equal(g.blood.length,0);assert.equal(g.bloodFX.length,0);
  e.move='grab';p.held={id:e.id};p.z=25;g.damageEnemy(e,100);
  assert.equal(e.dead,true);assert.equal(e.move,null);assert.equal(p.held,null);assert.equal(p.z,0);
  assert.equal(g.remains.length,1);assert.equal(g.remains[0].kind,'guardian');assert.equal(g.remains[0].dir,dir);
  assert.equal(g.events.filter(e=>e.type==='guardianfall').length,1);assert.equal(g.events.filter(e=>e.type==='kill').length,0);
  const kills=p.kills,xp=p.xp,drops=g.drops.length;g.damageEnemy(e,100);
  assert.equal(p.kills,kills);assert.equal(p.xp,xp);assert.equal(g.drops.length,drops);
  for(let i=0;i<80;i++)g.updateEffects(.02);
  assert.equal(g.blood.length,0);assert.equal(g.bloodFX.length,0);assert.equal(g.remains[0].age,1.4);
  assert.equal(g.remains[0].impact,true);
 }
});
test('stone fragments accelerate downward and rebound with lower energy without crossing the floor',()=>{
 const {g}=fixture();const v={stone:true,x:0,y:0,z:20,vx:20,vy:0,vz:0,life:5};g.particles=[v];
 g.updateEffects(.02);const z=v.z;assert.ok(v.vz<0);g.updateEffects(.02);assert.ok(z-v.z>20-z);
 let bounced=false,last=v.vz;
 for(let i=0;i<80;i++){g.updateEffects(.02);assert.ok(v.z>=0);if(last<0&&v.vz>0){assert.ok(v.vz<Math.abs(last));bounced=true;}last=v.vz;}
 assert.ok(bounced);assert.equal(v.z,0);assert.equal(v.vz,0);
});
test('twelve death poses end in a stable, low pile in every direction and never loop',()=>{
 for(let dir=0;dir<4;dir++){
  const clip=api.guardianClip(dir,'death');assert.equal(clip.durationsMs.length,12);assert.equal(clip.loop,false);
  assert.equal(clip.durationsMs.reduce((a,b)=>a+b,0),1400);
  assert.equal(api.guardianFrame(dir,'death',10),11);
  const im=api.BITMAPS.get('guardian',dir,'death',11),data=im.getContext('2d').getImageData(0,0,80,80).data;
  let top=80,bottom=0,count=0;
  for(let y=0;y<80;y++)for(let x=0;x<80;x++)if(data[(y*80+x)*4+3]){top=Math.min(top,y);bottom=Math.max(bottom,y);count++;}
  assert.ok(top>=35);assert.ok(bottom<65);assert.ok(count>100);
 }
});
test('the real renderer draws an animated guardian remain, then its final ground pose',()=>{
 const {g,e}=fixture(),cv=canvas.createCanvas(80,80),r=Object.create(api.Renderer.prototype);
 r.c=cv.getContext('2d');r.characters=new api.CharacterAtlas();r.g=g;
 const rem={x:40,y:52,dir:e.dir,age:.26};r.guardianRemains(rem);
 const early=cv.toBuffer('image/png');r.c.clearRect(0,0,80,80);rem.age=1.4;r.guardianRemains(rem);
 assert.notDeepEqual(cv.toBuffer('image/png'),early);
});
