const {test, before} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {loadGame, canvas, root, html} = require('./game-harness.cjs');
let api;
before(async () => {api = await loadGame();});
const raw = c => Buffer.from(c.getContext('2d').getImageData(0, 0, 80, 80).data);

test('all 216 shipped frames match the Aseprite atlas, including independent west lighting', () => {
  assert.equal(api.BITMAPS.ready, true);
  assert.equal(Object.keys(api.CO_ART.clips).length, 32);
  let count = 0;
  for (const [key, clip] of Object.entries(api.CO_ART.clips)) {
    const [dir, state] = key.split(':');
    for (let f = 0; f < clip.durationsMs.length; f++) {
      const expected = canvas.createCanvas(80, 80);
      expected.getContext('2d').drawImage(api.BITMAPS.atlas, f*80, clip.row*80, 80, 80, 0, 0, 80, 80);
      assert.deepEqual(raw(api.BITMAPS.get('guardian', +dir, state, f)), raw(expected));
      count++;
    }
  }
  assert.equal(count, 216);
  assert.notDeepEqual(raw(api.BITMAPS.get('guardian', 1, 'idle', 0)), raw(api.BITMAPS.get('guardian', 3, 'idle', 0)));
});

test('idle follows authored holds; combat impact and recovery match animation timing', () => {
  for (let dir = 0; dir < 4; dir++) {
    assert.equal(api.guardianFrame(dir, 'idle', .699), 0);
    assert.equal(api.guardianFrame(dir, 'idle', .701), 1);
    assert.equal(api.guardianFrame(dir, 'idle', 2.521), 0);
    for (const [move, state] of [['punch', 'attack'], ['slam', 'slam'], ['grab', 'grab']]) {
      const c = api.guardianClip(dir, state), m = api.CO_MOVES[move];
      let elapsed = 0;
      c.durationsMs.forEach((duration, f) => {
        assert.ok(Math.abs(m.f[f] - elapsed/1000) < 1e-9);
        assert.equal(api.guardianFrame(dir, state, (elapsed + 1)/1000), f);
        elapsed += duration;
      });
      assert.equal(elapsed/1000, m.end);
      assert.equal(api.guardianFrame(dir, state, m.hit + .001), 2);
    }
  }
});

test('state selection preserves attack priority, planted guard, hurt, and distance-based walk', () => {
  const atlas = new api.CharacterAtlas(), calls = [], c = {drawImage(){}};
  atlas.get = (...args) => {calls.push(args);return {};};
  const e = api.enemy('guardian', 100, 100, 'test');
  for (let dir = 0; dir < 4; dir++) {
    Object.assign(e, {dir, move: null, anim: 0, hurt: 0, guardTime: 0});
    atlas.draw(c, 'guardian', e, 1.1);assert.deepEqual(calls.at(-1).slice(1,4), [dir, 'idle', 3]);
    e.anim=4.8;atlas.draw(c,'guardian',e,0);assert.deepEqual(calls.at(-1).slice(2,4),['walk',4]);
    e.guardTime=.5;atlas.draw(c,'guardian',e,0);assert.deepEqual(calls.at(-1).slice(2,4),['guard',2]);
    e.hurt=e.hurtDuration=.26;atlas.draw(c,'guardian',e,0);assert.deepEqual(calls.at(-1).slice(2,4),['hurt',0]);
    e.move='slam';e.mframe=2;atlas.draw(c,'guardian',e,0);assert.deepEqual(calls.at(-1).slice(2,4),['slam',2]);
  }
});

function scenario(dir, move='grab') {
  const g = new api.Game(), p = g.player, e = g.enemies.find(e => e.kind === 'guardian');
  const [fx, fy] = g.facing(dir);
  Object.assign(e, {x: 600, y: 800, dir, move, mt: 0, mframe: 0, hitDone: false, level: 0});
  Object.assign(p, {x: e.x + fx*25, y: e.y + fy*25, spawnFX: 0, inv: 0, dash: 0, held: null, thrown: null, z: 0, hp: 10, attackBuffer: .2, level: 0});
  g.lineClear=()=>true;
  g.move=(actor,dx,dy)=>{actor.x+=dx;actor.y+=dy;};
  g.movePlayer=g.move;
  return {g,p,e};
}
function advance(g,p,e,dt) {g.colossusStep(e,p,Math.hypot(e.x-p.x,e.y-p.y),dt,{engage:true});}
function assertAttached(p,e) {
  const [x,y] = api.guardianClip(e.dir,'grab').handSocketPx[e.mframe];
  assert.equal(p.x,e.x+x-40);
  assert.equal(p.y-p.z-8,e.y+y-52);
}

test('all four grabs attach on capture, follow the current pose, and throw at 1050 ms', () => {
  for (let dir=0;dir<4;dir++) {
    const {g,p,e}=scenario(dir);
    advance(g,p,e,.449);assert.equal(p.held,null);
    advance(g,p,e,.002);assert.equal(p.held.id,e.id);assert.equal(e.mframe,2);assertAttached(p,e);
    assert.equal(p.attackBuffer,0);assert.equal(p.attack,0);
    advance(g,p,e,.150);assert.equal(e.mframe,3);assertAttached(p,e);
    advance(g,p,e,.448);assert.ok(p.held);assertAttached(p,e);
    advance(g,p,e,.002);assert.equal(p.held,null);assert.ok(p.thrown);assert.equal(e.mframe,4);assertAttached(p,e);
    const v=g.facing(dir);assert.ok(p.thrown.vx*v[0]+p.thrown.vy*v[1]>140);
    for(let i=0;i<13;i++)g.heldStep(p,.04);
    assert.equal(p.thrown,null);assert.equal(p.z,0);assert.equal(p.hp,8);
    advance(g,p,e,.45);assert.equal(e.move,null);
  }
});

test('failed, blocked, invulnerable and dodged grabs recover immediately without capturing', () => {
  for(const reason of ['range','behind','wall','invulnerable','dodge']) {
    const {g,p,e}=scenario(2);
    if(reason==='range')p.y+=100;
    if(reason==='behind')p.y=e.y-25;
    if(reason==='wall')g.lineClear=()=>false;
    if(reason==='invulnerable')p.inv=1;
    if(reason==='dodge')p.dash=.1;
    advance(g,p,e,.451);
    assert.equal(p.held,null,reason);assert.equal(e.mframe,5,reason);
    advance(g,p,e,.3);assert.equal(e.move,null,reason);
  }
});

test('the full update loop keeps capture and lifting aligned without accepting held inputs', () => {
  for(let dir=0;dir<4;dir++) {
    const {g,p,e}=scenario(dir);g.enemies=g.enemies.filter(o=>o===e||o.kind==='boss');
    Object.assign(e,{ai:'chase',cooldown:0,stun:0,guardTime:0,mt:.44});p.attackBuffer=0;
    g.update(.02,{});assert.ok(p.held);assertAttached(p,e);
    for(let i=0;i<25;i++) {
      g.update(.02,{x:1,y:1,attack:true,guard:true,dodge:true,interact:true});
      assert.ok(p.held);assertAttached(p,e);assert.equal(p.attack,0);assert.equal(p.dash,0);
    }
  }
});

test('punch and slam hit once at contact in every direction, with original damage', () => {
  for(let dir=0;dir<4;dir++)for(const move of ['punch','slam']) {
    const {g,p,e}=scenario(dir,move),m=api.CO_MOVES[move];
    advance(g,p,e,m.hit-.001);assert.equal(p.hp,10);
    advance(g,p,e,.002);assert.equal(p.hp,move==='slam'?9:8);
    p.inv=0;advance(g,p,e,.05);assert.equal(p.hp,move==='slam'?9:8);
    if(move==='slam')assert.equal(g.waves.length,1);
  }
});

test('release on guardian death prevents a stuck held state; saves keep the existing schema', () => {
  const {g,p,e}=scenario(2);advance(g,p,e,.451);e.dead=true;
  assert.equal(g.heldStep(p,.04),false);assert.equal(p.held,null);assert.equal(p.z,0);
  const saved=g.serialize();assert.equal(saved.version,1);
  const restored=new api.Game(saved);assert.equal(restored.player.hp,p.hp);assert.equal(restored.player.coins,p.coins);
  assert.equal(restored.enemies.find(o=>o.id===e.id).dead,true);
});

test('iOS receives all sprite bytes in index.html with the same game code and save key', () => {
  const ios=fs.readFileSync(path.join(root,'ios/Hearthreaver/Game/index.html'),'utf8');
  assert.equal(ios.slice(ios.indexOf('<script>')),html.slice(html.indexOf('<script>')));
  assert.ok(Buffer.byteLength(html)>500000);assert.ok(html.includes('conan-serpent-v1'));assert.ok(html.slice(-64).includes('</html>'));
  const m=JSON.parse(fs.readFileSync(path.join(root,'sprites/personnages/gardien-animations.json')));
  for(const [key,file] of [['png',m.sheet],['grip',m.gripSheet]])assert.deepEqual(Buffer.from(api.CO_ART[key].split(',')[1],'base64'),fs.readFileSync(path.join(root,'sprites/personnages',file)));
});

test('published sprite metadata points to the same rows and frame counts as the game', () => {
  const art=path.join(root,'sprites/personnages');
  const index=JSON.parse(fs.readFileSync(path.join(art,'index.json'))).personnages.gardien;
  const meta=JSON.parse(fs.readFileSync(path.join(art,'gardien.json')));
  assert.equal(meta.taille_planche.largeur,960);
  const dirs=['haut','droite','bas','gauche'];
  for(const [key,clip] of Object.entries(api.CO_ART.clips)) {
    const [dir,state]=key.split(':');
    const row=index.animations.find(a=>a.animation===state&&a.direction===dirs[dir]);
    const a=Object.values(meta.animations).find(a=>a.code_du_jeu===state);
    assert.equal(row.ligne,clip.row);assert.equal(row.images,clip.durationsMs.length);
    assert.equal(a.directions[dirs[dir]].ligne,clip.row);assert.equal(a.images,clip.durationsMs.length);
  }
});

test('an image decode failure leaves a recoverable loading error instead of starting with missing art', async () => {
  class FailedImage {set src(value){queueMicrotask(()=>this.onerror());}}
  const failed=await loadGame(FailedImage);assert.equal(failed.BITMAPS.ready,false);assert.ok(failed.BITMAPS.errors.length);
});
