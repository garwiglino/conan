const {test, before} = require('node:test');
const assert = require('node:assert/strict');
const {loadGame} = require('./game-harness.cjs');
let Game;
before(async () => {({Game} = await loadGame());});
const side = g => g.questGuidance().find(v => !v.quest.main);

test('a fulfilled objective immediately hands guidance to the next tracked quest, with its reward still pending', () => {
  const g = new Game();
  g.acceptQuest('tresors');g.acceptQuest('steles');g.acceptQuest('os');
  assert.equal(side(g).quest.id, 'tresors');
  const xp = g.player.xp;
  g.chests.slice(0,4).forEach(c => c.open = true);
  assert.equal(g.questTarget('tresors'), null); // Even before the periodic quest check.
  assert.equal(side(g).quest.id, 'steles');
  g.checkQuests();
  assert.equal(g.player.xp, xp);
  assert.equal(g.quests.done.has('tresors'), false);
  assert.equal(g.quests.tracked.has('tresors'), true);
  assert.equal(g.trackedQuests().at(-1).id, 'tresors');
  // Returning at night or loading an older save must never redirect guidance to a tent/NPC.
  const restored = new Game(g.serialize());restored.clock = 23*60;restored.stepNpcs(0);
  assert.equal(restored.npcs.find(n => n.id === 'zahra').phase, 'away');
  assert.equal(restored.questTarget('tresors'), null);
  assert.equal(side(restored).quest.id, 'steles');
  restored.completeQuest('tresors');
  assert.equal(restored.player.xp, xp + 40);
  assert.equal(restored.player.flasks, 1);
  restored.completeQuest('tresors');
  assert.equal(restored.player.xp, xp + 40);
  assert.equal(side(restored).quest.id, 'steles');
});

test('hunt guidance targets living enemies, skips fulfilled hunts, and respects follow order and unfollow', () => {
  const g = new Game();
  for (const id of ['os','culte','viperes']) g.acceptQuest(id);
  assert.equal(side(g).target.kind, 'skeleton');
  const first = g.questTarget('os');first.dead = true;
  assert.notEqual(g.questTarget('os'), first);
  g.enemies.filter(e => e.kind === 'skeleton').slice(0,6).forEach(e => e.dead = true);
  assert.equal(g.questTarget('os'), null);
  assert.equal(side(g).quest.id, 'culte');
  g.toggleTrack('culte');assert.equal(side(g).target.kind, 'snake');
  g.enemies.filter(e => e.kind === 'snake').forEach(e => e.dead = true);
  assert.equal(side(g), undefined);
  assert.equal(g.questGuidance().length, 1); // Only the gold main objective remains.
  g.toggleTrack('sceaux');assert.equal(g.questGuidance().length, 0);
});

test('fulfilled stele counts stop navigation even when other steles remain; main quest chaining still works', () => {
  const g = new Game();g.acceptQuest('steles');g.acceptQuest('tresors');
  g.steles.slice(0,5).forEach(s => s.active = true);
  assert.ok(g.steles.some(s => !s.active));
  assert.equal(g.questTarget('steles'), null);
  assert.equal(side(g).quest.id, 'tresors');
  g.seals.fill(true);assert.equal(g.questTarget('sceaux'), null);
  g.checkQuests();
  assert.equal(g.questGuidance().find(v => v.quest.main).quest.id, 'temple');
  g.gate = true;
  assert.equal(g.questGuidance().filter(v => v.quest.main).length, 0);
  g.checkQuests();assert.equal(g.quests.done.has('temple'), true);
});

test('no guidance for unknown quests; upstairs chests remain valid objectives', () => {
  const g = new Game();assert.equal(g.questTarget('tresors'), null);
  g.acceptQuest('tresors');const chest = g.chests.find(c => c.level === 1);
  g.player.x = chest.x;g.player.y = chest.y;g.player.level = 1;
  assert.equal(g.questTarget('tresors'), chest);
});

test('NPC homes never offer or allow sleep, including at night and after save restoration', () => {
  for (const hour of [12,23]) {
    const g = new Game(new Game().serialize());g.clock = hour*60;g.stepNpcs(0);
    const homes = g.world.props.filter(p => p.kind === 'tent' && p.owner);
    assert.equal(homes.length, 2);
    for (const home of homes) {
      Object.assign(g.player, {x:home.x,y:home.y+16,level:0,hp:4});
      assert.equal(g.restTent(), null);
      assert.notEqual(g.context()?.kind, 'sleep');
      g.events.length = 0;g.interact();
      assert.equal(g.events.some(e => e.type === 'sleepmenu'), false);
      assert.equal(g.sleep(480), false);
      assert.equal(g.sleeping, null);
      assert.equal(g.player.hp, 4);
    }
  }
});

test('the starting camp remains usable for rest, only at its entrance and on the ground floor', () => {
  const g = new Game(), tent = g.world.props.find(p => p.kind === 'tent' && p.rest);
  Object.assign(g.player, {x:tent.x,y:tent.y+16,hp:4});
  assert.equal(g.solid(g.player.x,g.player.y), false);
  assert.equal(g.context().kind, 'sleep');
  g.interact();assert.ok(g.events.some(e => e.type === 'sleepmenu'));
  const clock = g.clock;g.sleep(480);g.stepSleep(10);
  assert.equal(g.clock, clock+480);assert.equal(g.player.hp,g.player.maxHp);
  g.player.level = 1;assert.equal(g.sleep(60),false);
  g.player.level = 0;g.player.y += 60;assert.equal(g.sleep(60),false);
});
