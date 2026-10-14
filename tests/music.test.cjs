const {test,before}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {loadGame,root}=require('./game-harness.cjs');
let api;before(async()=>{api=await loadGame();});
class Param {
 constructor(){this.value=1;this.events=[];}
 record(kind,v,t){this.events.push({kind,v,t});}
 setValueAtTime(v,t){this.record('set',v,t);}
 linearRampToValueAtTime(v,t){this.record('ramp',v,t);}
 exponentialRampToValueAtTime(v,t){this.record('exp',v,t);}
 setTargetAtTime(v,t){this.record('target',v,t);}
 cancelScheduledValues(t){this.events=this.events.filter(e=>e.t<t);}
}
class Node {
 constructor(){for(const k of ['gain','frequency','pan','delayTime','detune','playbackRate'])this[k]=new Param();this.connections=[];this.starts=[];this.stops=[];}
 connect(to){this.connections.push(to);return to;}
 disconnect(){this.connections=[];this.disconnected=true;}
 setPeriodicWave(){}
 start(t){this.starts.push(t);}
 stop(t){this.stops.push(t);}
}
class AudioContext {
 constructor(){this.currentTime=0;this.sampleRate=8000;this.destination=new Node();this.nodes=[];this.state='running';}
 node(){const n=new Node();this.nodes.push(n);return n;}
 createGain(){return this.node();}createBiquadFilter(){return this.node();}createStereoPanner(){return this.node();}
 createDelay(){return this.node();}createOscillator(){return this.node();}createBufferSource(){return this.node();}
 createPeriodicWave(){return {};}
 createBuffer(ch,len){return {getChannelData:()=>new Float32Array(len)};}
}
function sequence(){const ctx=new AudioContext(),m=new api.Music(ctx,ctx.destination);m.notes=[];m.note=(song,tr,t)=>m.notes.push({song:song.name,t});return {ctx,m};}
function world(){
 const p={x:0,y:0,spawnFX:0,level:0};
 return {player:p,enemies:[],clock:720,sameLevel:(a,b)=>a.level===b.level,lineClear:()=>true,safeZone:()=>false};
}
test('only an engaged visible colossus on the same level triggers combat, with a four-second release hold',()=>{
 const g=world(),d=new api.MusicDirector(),e={id:'g0',kind:'guardian',x:40,y:0,level:0,ai:'idle',dead:false};g.enemies=[e];
 assert.equal(d.update(g,true,.016),'ambient');e.ai='chase';assert.equal(d.update(g,true,.016),'combat');
 e.ai='return';for(let i=0;i<39;i++)assert.equal(d.update(g,true,.1),'combat');assert.equal(d.update(g,true,.1),'ambient');
 for(const kind of ['skeleton','cultist','snake']){e.kind=kind;e.ai='chase';assert.equal(d.update(g,true,.016),'ambient');}
 e.kind='guardian';e.level=1;assert.equal(d.update(g,true,.016),'ambient');e.level=0;
 g.lineClear=()=>false;assert.equal(d.update(g,true,.016),'ambient');g.lineClear=()=>true;
 g.safeZone=()=>true;assert.equal(d.update(g,true,.016),'ambient');
});
test('music policy preserves pause, night, boss priority, death, respawn and new-game resets',()=>{
 const g=world(),d=new api.MusicDirector(),e={kind:'guardian',x:40,y:0,level:0,ai:'chase'};g.enemies=[e];
 assert.equal(d.update(g,true,.02),'combat');e.dead=true;
 for(let i=0;i<100;i++)d.update(g,false,.1);assert.equal(d.hold,4);
 g.clock=60;for(let i=0;i<41;i++)d.update(g,true,.1);assert.equal(d.update(g,true,.01),'night');
 e.dead=false;g.enemies.push({kind:'boss',dead:false});g.bossActive=true;assert.equal(d.update(g,true,.02),'boss');
 g.dying={};assert.equal(d.update(g,true,.02),null);assert.equal(d.hold,0);
 g.dying=null;g.bossActive=false;g.player.spawnFX=.5;assert.equal(d.update(g,true,.02),null);
 assert.equal(d.update(world(),true,.02),'ambient');
});
test('combat crossfade has overlapping envelopes and continues outgoing notes until its end',()=>{
 const {ctx,m}=sequence();m.update('ambient');const ambient=m.current;
 ctx.currentTime=3;m.update('combat');const combat=m.current;
 assert.equal(combat.name,'combat');assert.ok(combat.t0<3.1);assert.equal(m.retiring[0],ambient);
 assert.equal(ambient.envelope.end,3.65);assert.ok(combat.envelope.start<ambient.envelope.end);
 ctx.currentTime=3.3;m.update('combat');assert.ok(m.songGain(ambient,3.3)>0);assert.ok(m.songGain(combat,3.3)>0);
 assert.ok(m.notes.some(n=>n.song==='ambient'&&n.t>=3));
 ctx.currentTime=3.7;m.update('combat');assert.equal(m.retiring.length,0);assert.equal(ambient.bus.disconnected,true);
 ctx.currentTime=6;m.update('ambient');assert.ok(m.current.t0<6.1);assert.equal(m.current.envelope.end,7.83);
});
test('interrupted crossfades keep their current gain, reuse the same song and fully mute',()=>{
 const {ctx,m}=sequence();m.update('ambient');const original=m.current;ctx.currentTime=2;m.update('combat');
 ctx.currentTime=2.2;const outgoing=m.current,gain=m.songGain(outgoing,2.2),oldGain=m.songGain(original,2.2);m.update('ambient');
 assert.equal(m.current,original);assert.ok(Math.abs(original.envelope.from-oldGain)<1e-9);
 assert.ok(Math.abs(outgoing.envelope.from-gain)<1e-9);
 ctx.currentTime=2.3;m.update(null);assert.equal(m.current,null);assert.ok(m.retiring.every(s=>s.retireAt<=2.8));
 ctx.currentTime=2.81;m.update(null);assert.equal(m.retiring.length,0);
});
test('an interrupted game-over intro cannot leak its future loop into resumed exploration',()=>{
 const {ctx,m}=sequence();m.update('boss');ctx.currentTime=1;m.update('gameover');assert.equal(m.current.name,'gameover');
 const old=m.current;assert.ok(m.intro);assert.ok(old.t0>m.intro.t0);
 ctx.currentTime=1.2;m.update('ambient');assert.equal(m.current.name,'ambient');
 assert.equal(old.envelope.from,0);ctx.currentTime=3.1;m.update('ambient');assert.equal(old.bus.disconnected,true);
});
test('the death cue is a type-1 MIDI file whose four note tracks exactly match the in-game score',()=>{
 const b=fs.readFileSync(path.join(root,'audio/guardian-death.mid'));assert.equal(b.toString('ascii',0,4),'MThd');
 assert.equal(b.readUInt16BE(8),1);assert.equal(b.readUInt16BE(10),5);assert.equal(b.readUInt16BE(12),480);
 let offset=14;const parsed={};
 for(let track=0;track<5;track++){
  assert.equal(b.toString('ascii',offset,offset+4),'MTrk');const end=offset+8+b.readUInt32BE(offset+4);let p=offset+8,tick=0,name='',notes=[],active=new Map();
  const vlq=()=>{let n=0,c;do{c=b[p++];n=(n<<7)|(c&127);}while(c&128);return n;};
  while(p<end){tick+=vlq();const status=b[p++];if(status===255){const type=b[p++],len=vlq();if(type===3)name=b.toString('utf8',p,p+len);p+=len;continue;}
   if((status&240)===192){p++;continue;}const n=b[p++],v=b[p++];
   if((status&240)===144&&v>0)active.set(n,{at:tick,n,v});else{const on=active.get(n);assert.ok(on);notes.push([on.at,tick-on.at,n,on.v]);active.delete(n);}
  }
  assert.equal(active.size,0);if(track)parsed[name]=notes.sort((a,b)=>a[0]-b[0]||a[2]-b[2]);offset=end;
 }
 const score=api.CUE_DATA.guardian_death;assert.equal(score.dur,1.4);
 for(const [name,data] of Object.entries(score.tracks)){
  const notes=[];for(let i=0;i<data.length;i+=4)notes.push(Array.from(data.slice(i,i+4)));
  notes.sort((a,b)=>a[0]-b[0]||a[2]-b[2]);assert.deepEqual(parsed[name],notes);
 }
 assert.equal(offset,b.length);
});
test('the MIDI death cue uses the SFX bus, works with music off, and respects the SFX switch',()=>{
 const sound=new api.Sound(),ctx=new AudioContext();sound.ctx=ctx;sound.master=ctx.createGain();sound.enabled=true;sound.sfxOn=true;sound.musicOn=false;
 ctx.resume=()=>{};sound.load=()=>{};sound.unmuteIOS=()=>{};sound.start();const prepared=sound.music;assert.ok(prepared);
 sound.fx('guardianfall',{vol:.8});assert.ok(sound.music);
 assert.equal(sound.music,prepared);
 const bus=ctx.nodes.find(n=>n.connections.includes(sound.master));assert.ok(bus);
 const n=ctx.nodes.length;sound.sfxOn=false;sound.fx('guardianfall');assert.equal(ctx.nodes.length,n);
 sound.sfxOn=true;sound.enabled=false;sound.fx('guardianfall');assert.equal(ctx.nodes.length,n);
});
