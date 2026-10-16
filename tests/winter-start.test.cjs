const {test,before}=require('node:test');
const assert=require('node:assert/strict');
let a;before(async()=>{a=await require('./game-harness.cjs').loadGame();});
test('new campaign starts in winter with a synchronized world clock and snowy Igea',()=>{
 const g=new a.Game();assert.equal(g.clock,72*1440+480);assert.equal(a.dayCycle(g.clock).hour,8);
 assert.equal(g.worldState.clock,g.clock);assert.equal(g.atlasLastClock,g.clock);
 const cells=a.Atlas.cells.filter(c=>a.Atlas.regions.get(c.region)?.territory==='Igea');assert.ok(cells.length>0);
 for(const c of cells){assert.equal(a.Atlas.snowCover(c.biome,c.height,g.clock),1);assert.equal(a.climateAt(g.clock,c.biome,c.height).rain,0);}
 assert.ok(cells.some(c=>a.climateAt(g.clock,c.biome,c.height).snow>.1));
 assert.equal(a.climateAt(g.clock,7).snow,0);assert.equal(a.Atlas.snowCover(7,20,g.clock),0);
 assert.ok(a.climateAt(24*1440+480,5).monsoon>a.climateAt(g.clock,5).monsoon);
});
test('saved calendars including old saves without an explicit clock retain their date',()=>{
 for(const clock of [480,20*1440+310,72*1440+480,99*1440]){
  const g=new a.Game();g.clock=clock;g.advanceAtlas(0);const saved=JSON.parse(JSON.stringify(g.serialize()));
  const loaded=new a.Game(saved);assert.equal(loaded.clock,clock);assert.equal(loaded.worldState.clock,clock);
  assert.equal(JSON.stringify(loaded.sky()),JSON.stringify(g.sky()));
 }
 const old=new a.Game().serialize();delete old.clock;delete old.atlas;old.elapsed=960;
 assert.equal(new a.Game(old).clock,480+1440);
});
test('weather fronts keep their original epoch when only the campaign date changes',()=>{
 assert.equal(a.climateAt(480,9).front,0);
 assert.equal(a.climateAt(new a.Game().clock,9).front,432);
});
