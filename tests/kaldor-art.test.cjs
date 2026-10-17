'use strict';
// Regression checks for Kaldor's JS-drawn replacement. No combat rules are patched.
const {test, before} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const vm = require('node:vm');
const {loadGame, canvas, root, html} = require('./game-harness.cjs');
const Art = require('../sprites/kaldor/kaldor-art.js');
const shot = ctx => Buffer.from(ctx.getImageData(0, 0, 80, 80).data);
let api, pose;
function snippet(s,a,b){const i=s.indexOf(a);assert.ok(i>=0,a); const j=s.indexOf(b,i);assert.ok(j>i,b);return s.slice(i,j);}
const authored=snippet(html,'const SWORD_POSES=','function greatsword(');
const sandbox={};vm.runInNewContext(authored+'\nthis.getPose=swordPose;',sandbox);pose=sandbox.getPose;
before(async()=>{api=await loadGame();});

test('four non-mirrored human drawings, same 80px sprite cell and foot anchor as frogs',()=>{
 assert.equal(Art.cell,80);assert.deepEqual(Art.anchor,{x:40,y:52});assert.deepEqual([...Art.directions],['dos','droite','face','gauche']);
 const front=Art.raster({swordPose:pose,dir:2}),left=Art.raster({swordPose:pose,dir:3}),right=Art.raster({swordPose:pose,dir:1});
 assert.notDeepEqual(front.data,left.data);assert.notDeepEqual(left.data,right.data);
});

test('every state and combo paints only opaque crisp pixels within the 80px cell',()=>{
 let count=0;
 for(let dir=0;dir<4;dir++)for(const [state,frames]of Object.entries(Art.states))for(let frame=0;frame<frames;frame++)for(let combo=0;combo<(state==='attack'?4:1);combo++){
  const img=Art.raster({dir,state,frame,combo,swordPose:pose});assert.equal(img.data.length,80*80*4);
  let pixels=0,minX=80,minY=80,maxX=0,maxY=0;
  for(let y=0;y<80;y++)for(let x=0;x<80;x++){
   const v=img.data[(y*80+x)*4+3];assert.ok(v===0||v===255);
   if(v){pixels++;minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);}
  }
  assert.ok(pixels>150,dir+':'+state+':'+frame);
  assert.ok(minX>=1&&minY>=1&&maxX<=78&&maxY<=78,'clipped '+dir+':'+state+':'+frame+':'+combo);
  count++;
 }
 assert.equal(count,240);
});

test('engine painter and exported raster are pixel-identical in each direction and attack frame',()=>{
 for(let dir=0;dir<4;dir++)for(let combo=0;combo<4;combo++)for(let frame=0;frame<6;frame++){
  const cv=canvas.createCanvas(80,80),ctx=cv.getContext('2d');ctx.translate(40,52);
  Art.draw(ctx,dir,'attack',frame,combo,pose);const out=Art.raster({dir,state:'attack',frame,combo,swordPose:pose});
  assert.deepEqual(shot(cv.getContext('2d')),Buffer.from(out.data),`${dir}:${combo}:${frame}`);
 }
});

test('authoritative attack timings, sword vectors and actual collision sweep were not edited',()=>{
 const checks={'const ATTACK_TIMES=':['function greatsword(','d86682d8042a3652852dadea3276ecd85aae91e903ad654616ca29089a6a59da'],'function bladeHits(':['// engine.js','07f5661a9d7e57208ad25fcfb2965702a6e746659c1ce8ebc78098ff0751e4fc']};
 for(const [a,[b,hash]] of Object.entries(checks)){assert.equal(crypto.createHash('sha256').update(snippet(html,a,b)).digest('hex'),hash,a);}
 for(let dir=0;dir<4;dir++)for(let combo=0;combo<4;combo++)for(let frame=0;frame<6;frame++){
  const p=pose(dir,frame,combo);assert.equal(p.length,4);assert.ok(p.every(Number.isFinite));
 }
});

test('all four attacks show multiple poses with a smear on contact frames',()=>{
 for(let dir=0;dir<4;dir++)for(let combo=0;combo<4;combo++){
  const hashes=[];let haveSmear=false;
  for(let frame=0;frame<6;frame++){
   const data=Art.raster({dir,state:'attack',frame,combo,swordPose:pose}).data;
   hashes.push(crypto.createHash('sha256').update(data).digest('hex'));
   if(frame>=2&&frame<=3)for(let i=0;i<data.length;i+=4){
     const r=data[i],g=data[i+1],b=data[i+2];
     if(data[i+3]&&(r===102&&g===137&&b===158 || r===200&&g===220&&b===229))haveSmear=true;
   }
  }
  assert.ok(new Set(hashes).size>=4,`combination ${dir}:${combo} lacks unique frame changes`);
  assert.ok(haveSmear,`missing smear ${dir}:${combo}`);
 }
});

test('CharacterAtlas actually uses replacement art and preserves hero hit flash',()=>{
 const atlas=new api.CharacterAtlas();
 for(let dir=0;dir<4;dir++){
  const hero=atlas.get('hero',dir,'walk',2,false,0),body=Art.raster({dir,state:'walk',frame:2,swordPose:pose});
  assert.deepEqual(shot(hero.getContext('2d')),Buffer.from(body.data));
  const hit=atlas.get('hero',dir,'walk',2,true,0);
  assert.notDeepEqual(shot(hero.getContext('2d')),shot(hit.getContext('2d')));
 }
});

test('world renderer and iOS carry identical source with same save contract',()=>{
 const ios=fs.readFileSync(path.join(root,'ios/Hearthreaver/Game/index.html'),'utf8');
 assert.ok(ios.includes('// BEGIN KALDOR JAVASCRIPT PIXEL ART'));
 assert.ok(html.includes("HearthreaverKaldorArt.draw(c,dir,state,frame,combo,swordPose)"));
 assert.ok(ios.includes("HearthreaverKaldorArt.draw(c,dir,state,frame,combo,swordPose)"));
 const game=new api.Game();const saved=game.serialize();assert.equal(saved.version,1);
 const ctx=canvas.createCanvas(80,80).getContext('2d');
 const p=game.player;game.player.x=40;game.player.y=52;game.player.dir=2;new api.CharacterAtlas().draw(ctx,'hero',p,0);
 const pixels=ctx.getImageData(0,0,80,80).data;
 assert.ok(pixels.some((value,i)=>i%4===3&&value===255));
});
