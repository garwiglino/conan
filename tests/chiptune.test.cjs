const {test,before}=require('node:test');
const assert=require('node:assert/strict');
const {loadGame}=require('./game-harness.cjs');
const {SONGS,build}=require('../scripts/chiptune-songs.cjs');
let api;before(async()=>{api=await loadGame();});
class Param {constructor(){this.value=1;}setValueAtTime(){}linearRampToValueAtTime(){}exponentialRampToValueAtTime(){}setTargetAtTime(){}cancelScheduledValues(){}}
class Node {
 constructor(type){this.type=type;for(const k of ['gain','frequency','pan','delayTime','detune','playbackRate','Q'])this[k]=new Param();}
 connect(to){return to;}disconnect(){}setPeriodicWave(){}start(){}stop(){}
}
class AudioContext {
 constructor(){this.currentTime=0;this.sampleRate=8000;this.destination=new Node();this.nodes=[];this.state='running';}
 node(type){const n=new Node(type);this.nodes.push(n);return n;}
 createGain(){return this.node('gain');}createBiquadFilter(){return this.node('filter');}createStereoPanner(){return this.node('pan');}
 createDelay(){return this.node('delay');}createOscillator(){return this.node('osc');}createBufferSource(){return this.node('buffer');}
 createPeriodicWave(){return {};}createBuffer(ch,len){return {getChannelData:()=>new Float32Array(len)};}
}
const SLOTS=['biome_forest','biome_coast','biome_desert','biome_steppe','biome_tropical','biome_wetland','biome_boreal','biome_polar','biome_cursed','biome_travel','combat','boss','gameover'];

test('every biome, travel, combat, boss and defeat slot plays a composed score on the game synthesizer',()=>{
 assert.deepEqual(Object.keys(api.MUSIC_SCORES).sort(),[...SLOTS].sort());
 for(const name of SLOTS){const s=api.MUSIC_DATA[name];assert.equal(s,api.MUSIC_SCORES[name],name);assert.equal(s.style,'chip');assert.ok(s.tracks.lead.length,name);
  for(const [part,t]of Object.entries(s.timbres)){if(part==='drums')continue;
   // Chip waves, or the title theme's brass, choir, timpani and bell voices built on them.
   assert.ok(t.kind?['brass','choir','timpani','bell'].includes(t.kind):['p125','p25','p50','tri','saw'].includes(t.w),name+' '+part);}}
 for(const family of ['forest','coast','desert','steppe','tropical','wetland','boreal','polar','cursed'])assert.ok(api.MUSIC_DATA['biome_'+family]);
});

test('every note starts on its song grid, never spills past the loop and never overlaps itself',()=>{
 const scores=[...Object.entries(api.MUSIC_SCORES),...Object.entries(api.MUSIC_SCORES).filter(([,s])=>s.intro).map(([k,s])=>[k+'-intro',{...s.intro,grid:s.intro.grid}])];
 for(const [name,s]of scores){
  const step=s.tpb*4/s.grid,end=s.bars*s.tpb*4;assert.ok(Number.isInteger(step),name);
  for(const [part,ev]of Object.entries(s.tracks)){const open=new Map();
   for(let i=0;i<ev.length;i+=4){const [t,d,n]=ev.slice(i,i+4);
    assert.equal(t%step,0,name+' '+part+' '+t);assert.ok(d>0&&t+d<=end,name+' '+part+' '+t);
    assert.ok(!(open.get(n)>t),name+' '+part+' note '+n+' overlaps at '+t);open.set(n,t+d);}
  }
 }
});

test('the score builder rejects a bar that does not fill its grid exactly',()=>{
 const song={...SONGS[0],sections:{A:{chords:['Dm'],lead:['D5:4 F5:4 A5:4']}},order:['A']};
 assert.throws(()=>build(song),/12 pas au lieu de 16/);
 assert.throws(()=>build({...song,sections:{A:{chords:['Dm'],lead:['D5:16'],drums:{K:'x...x...x...x..'}}}}),/15 cases/);
});

test('slow frames up to 700 ms neither drop nor shift a single note',()=>{
 for(const name of ['biome_desert','combat','biome_coast']){
  const ctx=new AudioContext(),m=new api.Music(ctx,ctx.destination),played=[];
  m.note=(song,tr,t,dur,note)=>played.push({song:song.name,t});
  const frames=[.016,.033,.7,.016,.25,.5,.016,.4,.066,.016];let i=0;
  while(ctx.currentTime<20){m.update(name);ctx.currentTime+=frames[i++%frames.length];}
  const song=m.current,s=api.MUSIC_DATA[name],spt=60/s.bpm/s.tpb;let expected=0;
  for(const ev of Object.values(s.tracks))for(let k=0;k<ev.length;k+=4)for(let loop=0;loop<3;loop++){const t=song.t0+loop*song.loop+ev[k]*spt;if(t<ctx.currentTime)expected++;}
  const heard=played.filter(n=>n.song===name&&n.t<ctx.currentTime);
  assert.equal(heard.length,expected,name);
  for(const n of heard){const ticks=(n.t-song.t0)%song.loop/spt,step=s.tpb*4/s.grid;assert.ok(Math.abs(ticks/step-Math.round(ticks/step))<1e-6,name+' '+n.t);}
 }
});

test('each song sets its own echo time in beats so triplet pieces keep a matching delay',()=>{
 for(const name of ['biome_coast','biome_forest']){
  const ctx=new AudioContext(),m=new api.Music(ctx,ctx.destination),s=api.MUSIC_DATA[name];m.update(name);
  const delay=ctx.nodes.find(n=>n.type==='delay');assert.ok(Math.abs(delay.delayTime.value-60/s.bpm*s.echo)<1e-9,name);
 }
});
