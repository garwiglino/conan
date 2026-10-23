'use strict';
const {test,before}=require('node:test'),assert=require('node:assert/strict'),{RenderingAudioContext}=require('web-audio-engine'),{loadGame,combatGame}=require('./game-harness.cjs');
let a;before(async()=>{a=await loadGame();});
function dungeon(){const g=combatGame(a);g.startFirstDungeon();g.player.spawnFX=0;for(const e of g.enemies)e.dead=true;return g;}
const run=(m,g,seconds,dt=.1)=>{let mode;for(let t=0;t<seconds-1e-9;t+=dt)mode=m.update(g,true,dt);return mode;};
function context(rate=8000){const c=new RenderingAudioContext({sampleRate:rate,numberOfChannels:2});Object.defineProperty(c,'state',{value:'running'});return c;}

test('every dungeon plays the same ambience; a goblin in sight switches to the alert, which lasts five seconds after losing sight',()=>{
 const g=dungeon(),m=new a.MusicDirector(),p=g.player;
 assert.equal(m.update(g,true,.016),'dungeon');
 assert.equal(g.sky().dungeon,g.dungeon.floor);assert.equal(g.sky().rain,0);
 const goblin=g.enemies.find(e=>!e.chief);Object.assign(goblin,{dead:false,x:p.x+18,y:p.y});assert.ok(g.lineClear(goblin,p));
 assert.equal(m.update(g,true,.016),'dungeon_alert');
 goblin.dead=true;assert.equal(run(m,g,4.8),'dungeon_alert');assert.equal(run(m,g,.4),'dungeon');
 // Far away or behind a wall, a goblin does not raise the alert.
 Object.assign(goblin,{dead:false,x:p.x+400,y:p.y});assert.equal(m.update(g,true,.016),'dungeon');
});

test('the chief fight plays the boss theme; outside the dungeon the world keeps its biome music',()=>{
 const g=dungeon(),m=new a.MusicDirector();
 g.dungeon.bossFight=true;assert.equal(m.update(g,true,.016),'boss');
 g.dungeon.bossDead=true;assert.equal(m.update(g,true,.016),'dungeon');
 g.dungeon.active=false;const mode=m.update(g,true,.016);assert.ok(mode==='biome_'+g.sky().family||mode==='ambient'||mode==='night',mode);assert.equal(g.sky().dungeon,undefined);
});

test('the dungeon alert enters as fast as combat and returns to the ambience gently',()=>{
 const c=context(),m=new a.Music(c,c.destination);m.update('dungeon');m.update('dungeon_alert');
 const e=m.current.envelope;assert.equal(m.current.name,'dungeon_alert');assert.ok(Math.abs(e.end-e.start-.65)<1e-9);
 m.update('dungeon');const back=m.current.envelope;assert.ok(Math.abs(back.end-back.start-1.8)<1e-9);
});

test('underground, wind and wildlife fall silent and the cave plays in its stone reverb; outside, the cave stops',()=>{
 const c=context(16000),s=new a.Sound();s.ctx=c;s.enabled=true;s.musicOn=false;s.master=c.createGain();s.master.connect(c.destination);
 const g=dungeon(),outside={active:true,sky:{family:'forest',night:0,rain:0,wind:.3},night:0,rain:0};
 for(let t=0;t<2;t+=.1){s.ambience(outside);c.processTo(t+.1);}
 assert.ok(s.amb.bus.gain.value>0);
 for(let t=2;t<14;t+=.1){s.ambience({active:true,sky:g.sky(),night:0,rain:0,battle:false});c.processTo(t+.1);}
 assert.ok(s.amb.bus.gain.value<1e-3,'wind and fauna silenced');assert.equal(s.cave.floor,g.dungeon.floor);assert.ok(s.caveRoomLinked);
 // The offline engine is slower than a browser: finish the synthesis, then listen for a few seconds.
 s.cave.prepare(1e6);assert.ok(s.cave.ready);
 for(let t=14;t<20;t+=.1){s.ambience({active:true,sky:g.sky(),night:0,rain:0,battle:false});c.processTo(t+.1);}
 const [l]=c.exportAsAudioData().channelData;let e=0;for(let i=14*16000;i<20*16000;i++)e+=l[i]*l[i];assert.ok(e/(6*16000)>1e-7,'the cave is audible');
 for(let t=20;t<24;t+=.1){s.ambience(outside);c.processTo(t+.1);}
 assert.equal(s.cave.running,false);assert.equal(s.caveRoomLinked,false);assert.ok(s.amb.bus.gain.value>0);
});

test('each floor has its own leaks, and a leak keeps its rhythm through slow frames without scheduling in the past',()=>{
 const plans=['geoles','grande-salle','galeries','trone'].map(id=>JSON.stringify(a.DungeonCave.plan(id)));
 assert.equal(new Set(plans).size,4);assert.equal(JSON.stringify(a.DungeonCave.plan('geoles')),plans[0]);
 const c=context(),log=[],cave=a.DungeonCave.create(c,c.destination,{log,budget:1e6});let t=0;
 const frames=[.016,.033,.7,.016,.25,.5,.016,.4,.066,.016];
 for(let i=0;t<40;i++){cave.update(t,{floor:'geoles',level:.4});t+=frames[i%frames.length];}
 assert.ok(cave.ready);const plan=cave.plan;
 plan.leaks.forEach((leak,k)=>{const times=log.filter(x=>x.kind==='leak'+k).map(x=>x.at);assert.ok(times.length>=Math.floor(38/leak.period)-1,'leak '+k);
  for(let i=1;i<times.length;i++){const gap=times[i]-times[i-1];assert.ok(gap>=leak.period*.96-1e-9&&gap<=leak.period*1.04+1e-9,'leak '+k+' gap '+gap);}});
 assert.ok(log.some(x=>x.kind==='drip'));assert.ok(log.every(x=>x.at>=x.now-1e-9));
});

// Sous terre, plus aucun souffle (« on dirait une tempête de vent », Lino, 23 octobre) : seul le filet d'eau tourne en
// continu, fait de bulles et non de bruit ou de clics, et la cave reste très en dessous de la musique du donjon.
test('the cave carries no wind: only a trickle of separate bubbles runs continuously, well under the dungeon music',()=>{
 assert.deepEqual(Object.keys(a.DungeonCave.MIX).sort(),['drip','events','leak','trickle','wet']);
 const c=context(16000),bus=c.createGain();bus.gain.value=.3;bus.connect(c.destination);let seed=1;
 const cave=a.DungeonCave.create(c,bus,{budget:1e6,random:()=>(seed=seed*16807%2147483647)/2147483647});
 for(let t=0;t<20;t+=.1){cave.update(c.currentTime,{floor:'geoles',level:.45});c.processTo(t+.1);}
 const d=cave.sounds.trickle.getChannelData(0);let e=0,diff=0;for(let i=1;i<d.length;i++){e+=d[i]*d[i];diff+=(d[i]-d[i-1])**2;}
 assert.ok(e>0&&diff/e<.8,'bubbles, not clicks or hiss: '+(diff/e).toFixed(2));
 const [l,r]=c.exportAsAudioData().channelData,W=6400,w=[];for(let i=3*16000;i+W<=l.length;i+=W){let s=0;for(let j=i;j<i+W;j++)s+=l[j]*l[j]+r[j]*r[j];w.push(10*Math.log10(s/(2*W)+1e-24));}
 w.sort((x,y)=>x-y);const median=w[Math.floor(w.length/2)];assert.ok(median<-62&&median>-80,'quiet but present: '+median.toFixed(1)+' dB');
});
