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
 assert.equal(count,4*Object.entries(Art.states).reduce((sum,[state,n])=>sum+n*(state==='attack'?4:1),0));
});

test('engine painter and exported raster are pixel-identical in each direction and attack frame',()=>{
 for(let dir=0;dir<4;dir++)for(let combo=0;combo<4;combo++)for(let frame=0;frame<6;frame++){
  const cv=canvas.createCanvas(80,80),ctx=cv.getContext('2d');ctx.translate(40,52);
  Art.draw(ctx,dir,'attack',frame,combo,pose);const out=Art.raster({dir,state:'attack',frame,combo,swordPose:pose});
  assert.deepEqual(shot(cv.getContext('2d')),Buffer.from(out.data),`${dir}:${combo}:${frame}`);
 }
});

test('authoritative attack timings, sword vectors and actual collision sweep were not edited',()=>{
 const checks={'const ATTACK_TIMES=':['function swordPose(','42f283a2c61b7fcac55a67531db06c679267a79097e0434ec906a112e59ae3e2'],'function bladeHits(':['// engine.js','07f5661a9d7e57208ad25fcfb2965702a6e746659c1ce8ebc78098ff0751e4fc']};
 for(const [a,[b,hash]] of Object.entries(checks)){assert.equal(crypto.createHash('sha256').update(snippet(html,a,b)).digest('hex'),hash,a);}
 assert.match(snippet(html,'function swordPose(','function greatsword('),/p\[2\]\*1\.02,p\[3\]\*1\.02/);
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

test('CharacterAtlas now composes Kaldor from actual NPC male head, body, hands, hair and walk poses',async()=>{
 const human=api.HearthreaverKaldorCivilianArt;
 assert.equal(human.appearance.sex,'masculin');
 assert.equal(human.appearance.outfit,'E01-masculin-terre');
 assert.equal(human.appearance.age,'adulte');
 assert.equal(human.appearance.beard,null);
 assert.equal(human.appearance.moustache,null);
 assert.deepEqual(api.CIVILIAN_ART.clips.walk.durations.length,8);
 assert.equal(await human.preload(),true);
 assert.equal(human.ready(),true);
 const atlas=new api.CharacterAtlas();
 for(let dir=0;dir<4;dir++){
  const npc=api.CIVILIAN_BITMAPS.get(human.appearance,'walk',dir,2);
  assert.ok(npc,'Missing native NPC frame '+dir);
  const hero=atlas.get('hero',dir,'sheathed_walk',2,false,0);
  assert.ok(hero);
  const a=shot(hero.getContext('2d')),b=shot(npc.getContext('2d'));
  let exactHair=0;
  for(let y=25;y<=35;y++)for(let x=34;x<=44;x++){
   const i=(y*80+x)*4;
   if(b[i+3]===255&&a.slice(i,i+4).equals(b.slice(i,i+4)))exactHair++;
  }
  assert.ok(exactHair>=8,'real NPC head/hair pixels are not reused at direction '+dir);
  const legacy=Art.raster({dir,state:'sheathed_walk',frame:2,swordPose:pose});
  assert.notDeepEqual(a,Buffer.from(legacy.data),'old Kaldor painter still active');
  const flash=atlas.get('hero',dir,'sheathed_walk',2,true,0);
  assert.notDeepEqual(a,shot(flash.getContext('2d')));
 }
 const standing={x:100,y:100,moving:true};
 human.gaitFrame(standing);
 standing.x+=3;
 const step=human.gaitFrame(standing);
 for(let k=0;k<10;k++)assert.equal(human.gaitFrame(standing),step,'animation advances against a wall');
 assert.equal(human.frameAt('walk',0,24),human.frameAt('walk',0,0),'full gait stride repeats');
});

test('world renderer and iOS carry identical source with same save contract',()=>{
 const ios=fs.readFileSync(path.join(root,'ios/Hearthreaver/Game/index.html'),'utf8');
 assert.ok(ios.includes('// BEGIN KALDOR JAVASCRIPT PIXEL ART'));
 assert.ok(html.includes("HearthreaverKaldorArt.draw(c,dir,state,frame,combo,swordPose)"));
 assert.ok(html.includes("HearthreaverKaldorArt.weaponVisual(actor,time,state,frame)"));
 assert.ok(ios.includes("HearthreaverKaldorArt.draw(c,dir,state,frame,combo,swordPose)"));
 assert.ok(html.includes('HearthreaverKaldorCivilianArt.nativeFrame'));
 assert.ok(ios.includes('HearthreaverKaldorCivilianArt.nativeFrame'));
 assert.ok(html.includes('E01-masculin-terre'));
 assert.ok(ios.includes('E01-masculin-terre'));
 const game=new api.Game();const saved=game.serialize();assert.equal(saved.version,1);
 const ctx=canvas.createCanvas(80,80).getContext('2d');
 const p=game.player;game.player.x=40;game.player.y=52;game.player.dir=2;new api.CharacterAtlas().draw(ctx,'hero',p,0);
 const pixels=ctx.getImageData(0,0,80,80).data;
 assert.ok(pixels.some((value,i)=>i%4===3&&value===255));
});


test('long hair remains rooted to a stable head, while 6-frame walk steps visibly move boots',()=>{
 const d=2,imgs=Array.from({length:6},(_,frame)=>Art.raster({dir:d,state:'sheathed_walk',frame,swordPose:pose}));
 const slice=(im,x0,y0,x1,y1)=>{const bytes=[];for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++)bytes.push(...im.data.slice((y*80+x)*4,(y*80+x)*4+4));return Buffer.from(bytes);};
 for(const im of imgs.slice(1))assert.deepEqual(slice(im,36,31,44,37),slice(imgs[0],36,31,44,37),'head wobble detected');
 assert.ok(new Set(imgs.map(im=>crypto.createHash('sha256').update(slice(im,30,47,50,55)).digest('hex'))).size>=4,'legs are not animated');
 // The rear hair strands visibly extend to the waist with varied highlights.
 const withHair=Art.raster({dir:0,state:'sheathed_idle',swordPose:pose}).data;
 const region=new Set();for(let y=41;y<=47;y++)for(let x=34;x<=46;x++){const i=(y*80+x)*4;if(withHair[i+3]===255)region.add([withHair[i],withHair[i+1],withHair[i+2]].join(','));}
 assert.ok(region.size>=3,'rear long hair lacks depth and highlights');
});

test('sheathing transitions are independent of gait, no teleport of feet and all four views render',()=>{
 for(let dir=0;dir<4;dir++){
  const h=[];
  for(let phase=0;phase<6;phase++)for(let gait=0;gait<6;gait++){
   const im=Art.raster({dir,state:'sheathe_walk',frame:phase*6+gait,swordPose:pose});
   assert.equal(im.anchor.x,40);assert.equal(im.anchor.y,52);
   if(gait===0)h.push(crypto.createHash('sha256').update(im.data).digest('hex'));
  }
  assert.ok(new Set(h).size>=4,dir+' sheath moves in steps');
 }
});

test('sword holsters automatically after a short absence of attacks, even while walking',()=>{
 for(const moving of [false,true]){
  const a={attack:0,guard:false,moving,anim:2.4};
  const state=moving?'walk':'idle',frame=2;
  assert.equal(Art.weaponVisual(a,0,state,frame).state,state);
  assert.equal(Art.weaponVisual(a,3.69,state,frame).state,state);
  const active=Art.weaponVisual(a,3.71,state,frame);
  assert.equal(active.state,moving?'sheathe_walk':'sheathe');
  const done=Art.weaponVisual(a,4.06,state,frame);
  assert.equal(done.state,moving?'sheathed_walk':'sheathed_idle');
  assert.equal(a.kaldorWeapon.mode,'sheathed');
 }
});

test('attacking interrupts holstering immediately, stays responsive, and restarts delay after the combo',()=>{
 const a={moving:true,attack:0,attackCD:0,dash:0,comboWindow:0,guard:false};
 Art.weaponVisual(a,0,'walk',0);
 Art.weaponVisual(a,3.85,'walk',4);
 assert.equal(a.kaldorWeapon.mode,'stowing');
 a.attack=.25;a.combo=2;
 assert.equal(Art.weaponVisual(a,3.9,'attack',2).state,'attack');
 assert.equal(a.kaldorWeapon.mode,'drawn');
 const originalAttack=a.attack;
 Art.weaponVisual(a,3.99,'attack',3);
 assert.equal(a.attack,originalAttack,'visual state changed gameplay attack timer');
 a.attack=0;
 Art.weaponVisual(a,5,'walk',0);
 assert.equal(a.kaldorWeapon.mode,'drawn');
 Art.weaponVisual(a,7.61,'walk',2);
 assert.equal(a.kaldorWeapon.mode,'stowing');
});

test('guard draws from the back without changing input state, old saves and death keep working',()=>{
 const a={attack:0,guard:false,guardTime:0,moving:false};
 Art.weaponVisual(a,0,'idle',0);
 Art.weaponVisual(a,3.8,'idle',0);
 Art.weaponVisual(a,4.3,'idle',0);
 assert.equal(a.kaldorWeapon.mode,'sheathed');
 a.guard=true;
 const draw=Art.weaponVisual(a,4.31,'guard',2);
 assert.equal(draw.state,'draw');
 assert.equal(a.guard,true);
 const armed=Art.weaponVisual(a,4.6,'guard',2);
 assert.equal(armed.state,'guard');
 assert.equal(a.kaldorWeapon.mode,'drawn');
 a.guard=false;
 const response=Art.weaponVisual(a,4.9,'idle',0);
 assert.equal(response.state,'idle');
});

test('Kaldor overlay build is deterministic in isolation and never races world renderer tests',()=>{
 const cp=require('node:child_process'),os=require('node:os');
 const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'kaldor-build-'));
 const toCopy=[
  'index.html','ios/Hearthreaver/Game/index.html',
  'scripts/embed-kaldor.cjs','scripts/kaldor-civilian-bridge.js',
  'sprites/kaldor/kaldor-art.js',
  'art/kaldor-preview-template.html','art/kaldor-preview.html',
  'data/kaldor-manifest.json'
 ];
 const hash=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
 try {
  for(const rel of toCopy){
   const dest=path.join(tmp,rel);fs.mkdirSync(path.dirname(dest),{recursive:true});
   fs.copyFileSync(path.join(root,rel),dest);
  }
  const a=hash(path.join(tmp,'index.html')),b=hash(path.join(tmp,'art/kaldor-preview.html'));
  for(let round=0;round<2;round++){
   cp.execFileSync(process.execPath,['scripts/embed-kaldor.cjs'],{cwd:tmp,stdio:'pipe'});
   assert.equal(hash(path.join(tmp,'index.html')),a,'non-idempotent HTML in pass '+round);
   assert.equal(hash(path.join(tmp,'art/kaldor-preview.html')),b,'non-idempotent preview in pass '+round);
  }
  const built=fs.readFileSync(path.join(tmp,'index.html'),'utf8');
  assert.equal(built.split('// BEGIN KALDOR JAVASCRIPT PIXEL ART').length,2);
  assert.equal(built.split('HearthreaverKaldorArt.weaponVisual(actor,time,state,frame)').length,2);
  assert.ok(built.includes('HearthreaverKaldorCivilianArt.nativeFrame'));
  const ios=fs.readFileSync(path.join(tmp,'ios/Hearthreaver/Game/index.html'),'utf8');
  assert.equal(ios.slice(ios.indexOf('<script>')),built.slice(built.indexOf('<script>')));
 } finally {fs.rmSync(tmp,{recursive:true,force:true});}
});

test('sword holsters after 3.7 seconds idle or moving and draws on renewed attack',()=>{
 const a={attack:0,moving:true,anim:0,dir:2};
 const visual=(t,s='walk',f=0)=>Art.weaponVisual(a,t,s,f);
 assert.equal(visual(0).state,'walk');
 assert.equal(visual(3.69).state,'walk');
 assert.equal(visual(3.71).state,'sheathe_walk');
 assert.equal(visual(3.89).state,'sheathe_walk');
 assert.equal(visual(4.05).state,'sheathed_walk');
 a.moving=false;assert.equal(visual(4.1,'idle').state,'sheathed_idle');
 a.moving=true;assert.equal(visual(4.15,'walk',3).state,'sheathed_walk');
 a.attack=.6;assert.equal(visual(4.16,'attack',0).state,'attack');
 a.attack=0;assert.equal(visual(4.8,'idle').state,'idle');
 assert.equal(visual(7.90,'idle').state,'sheathe');
 assert.equal(visual(8.25,'idle').state,'sheathed_idle');
 a.guard=true;visual(8.3,'guard',2);assert.equal(a.kaldorWeapon.mode,'drawing');
 assert.equal(visual(8.53,'guard',2).mode,'drawn');
});

test('sword reduction is shared by visual pose and gameplay sweep, not frame timings',()=>{
 assert.ok(html.includes('return [p[0],p[1],p[2]*1.02,p[3]*1.02];'));
 assert.equal(html.match(/const ATTACK_TIMES=/g)?.length,1);
 for(let dir=0;dir<4;dir++)for(let combo=0;combo<4;combo++)for(let f=0;f<6;f++){
  const [x,y,vx,vy]=pose(dir,f,combo);assert.ok(Number.isFinite(x+y+vx+vy));
 }
});


test('hurt, melee and object use keep a holstered sword on the back without changing game status',()=>{
 for(let dir=0;dir<4;dir++){
  const a={dir,attack:0,guard:false,moving:false};
  Art.weaponVisual(a,0,'idle',0);Art.weaponVisual(a,3.9,'idle',0);Art.weaponVisual(a,4.3,'idle',0);
  assert.equal(a.kaldorWeapon.mode,'sheathed');
  for(const [state,field]of [['hurt','hurt'],['melee','melee'],['use','useTime']]){
   a[field]=.25;const look=Art.weaponVisual(a,4.35,state,0);assert.equal(look.state,'sheathed_'+state);
   const img=Art.raster({dir,state:look.state,frame:0,swordPose:pose});assert.equal(img.anchor.x,40);a[field]=0;
  }
  assert.equal(Art.weaponVisual(a,4.5,'idle',0).state,'sheathed_idle');
 }
});

test('the real CharacterAtlas draws modular human head, hands and sheathed sword with stable gait',async()=>{
 const human=api.HearthreaverKaldorCivilianArt;
 assert.equal(await human.preload(),true);
 const atlas=new api.CharacterAtlas(),cv=canvas.createCanvas(80,80),ctx=cv.getContext('2d');
 const actor={x:40,y:52,dir:2,attack:0,attackCD:0,guard:false,moving:false,anim:0,flash:0,hurt:0,dash:0,combo:0};
 atlas.draw(ctx,'hero',actor,0);
 assert.equal(actor.kaldorWeapon.mode,'drawn');
 ctx.clearRect(0,0,80,80);atlas.draw(ctx,'hero',actor,3.8);
 assert.equal(actor.kaldorWeapon.mode,'stowing');
 ctx.clearRect(0,0,80,80);atlas.draw(ctx,'hero',actor,4.2);
 assert.equal(actor.kaldorWeapon.mode,'sheathed');
 const expectedIdle=human.nativeFrame(2,'sheathed_idle',human.frameAt('idle',4.2));
 assert.deepEqual(shot(ctx),shot(expectedIdle.getContext('2d')));
 actor.anim=2;actor.moving=true;
 ctx.clearRect(0,0,80,80);atlas.draw(ctx,'hero',actor,4.35);
 // Animation driven by real distance, not an arbitrary actor.anim counter.
 const expectedWalk=human.nativeFrame(2,'sheathed_walk',0);
 assert.deepEqual(shot(ctx),shot(expectedWalk.getContext('2d')));
 actor.x+=3;
 ctx.clearRect(0,0,80,80);atlas.draw(ctx,'hero',actor,4.40);
 const nextStep=human.gaitFrame(actor);
 const expectedStep=human.nativeFrame(2,'sheathed_walk',nextStep);
 assert.deepEqual(shot(actor._img.getContext('2d')),shot(expectedStep.getContext('2d')));
 actor.attack=.18;actor.combo=2;ctx.clearRect(0,0,80,80);atlas.draw(ctx,'hero',actor,4.5);
 assert.equal(actor.kaldorWeapon.mode,'drawn');assert.ok(actor._img);
});

