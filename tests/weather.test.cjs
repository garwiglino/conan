const {test,before}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {loadGame,root}=require('./game-harness.cjs');
const {RenderingAudioContext}=require('web-audio-engine');let a;before(async()=>{a=await loadGame();});
test('the day fades at 16, dusk lasts 18–23, night 23–5 and dawn 5–9 without jumps',()=>{
 const cases=[[0,'night',1],[5,'dawn',1],[9,'day',0],[16,'lateDay',0],[18,'dusk',.28],[23,'night',1]];
 for(const[h,period,night]of cases){const s=a.dayCycle(h*60);assert.equal(s.period,period);assert.equal(s.night,night);}
 assert.ok(a.dayCycle(17*60).night>0);assert.ok(a.dayCycle(22*60).night<1);
 for(let m=0;m<1440;m++){
  const s=a.dayCycle(m),next=a.dayCycle(m+1);assert.ok(s.night>=0&&s.night<=1);assert.ok(Math.abs(next.night-s.night)<.01);
  assert.ok(s.tint.every((v,i)=>Math.abs(v-next.tint[i])<3));
  const tomorrow=a.dayCycle(m+1440);assert.equal(tomorrow.period,s.period);assert.ok(Math.abs(tomorrow.night-s.night)<1e-10);assert.ok(tomorrow.tint.every((v,i)=>Math.abs(v-s.tint[i])<1e-8));
 }
 for(let m=960;m<1380;m++)assert.ok(a.dayCycle(m+1).night>=a.dayCycle(m).night);
 for(let m=300;m<540;m++)assert.ok(a.dayCycle(m+1).night<=a.dayCycle(m).night);
});
test('rain intensity and storm cells vary independently of daylight and remain continuous across fronts',()=>{
 const kinds=new Set(),rainByDay=new Set(),stormByDay=new Set();let steady=0,heavyWithoutThunder=0;
 for(let m=480;m<480+1440*40;m+=2){const s=a.skyAt(m);kinds.add(s.kind);if(s.rain>.2)rainByDay.add(s.period==='day'?'day':'other');if(s.storm>.5)stormByDay.add(s.period==='day'?'day':'other');
  if(s.kind==='steady'){assert.equal(s.storm,0);if(s.rain>.5&&s.rain<.55)steady++;}
  if(s.rain>.8&&s.storm===0)heavyWithoutThunder++;
  for(const k of ['rain','storm','cloud','wind'])assert.ok(s[k]>=0&&s[k]<=1,k);
 }
 assert.equal(kinds.size,5);assert.equal(rainByDay.size,2);assert.equal(stormByDay.size,2);assert.ok(steady>20&&heavyWithoutThunder>20);
 for(let k=1;k<100;k++){const before=a.skyAt(480+k*240-.0001),after=a.skyAt(480+k*240+.0001);for(const p of ['rain','cloud','wind','storm'])assert.ok(Math.abs(before[p]-after[p])<.0001,p);}
 const durations=[];for(let k=1;k<100;k++){if(a.weatherFront(k).kind!=='storm')continue;let wet=0,electric=0;for(let m=0;m<240;m++){const s=a.skyAt(480+k*240+m);if(s.rain>.5)wet++;if(s.storm>.4)electric++;}assert.ok(electric>0&&electric<wet/2);durations.push(electric);}
 assert.ok(Math.max(...durations)>Math.min(...durations)*1.5);
});
test('lightning is a single soft pulse followed by delayed thunder; dry rain, sleep and reload cannot create phantom claps',()=>{
 const storm=new a.StormSystem(),sky={front:2,storm:1},listener={x:300,y:400};let started=null,heard=null,peak=0,litRuns=0,wasLit=false;
 for(let i=0;i<280;i++){const events=storm.step(.04,sky,listener);if(storm.strike&&started===null)started=storm.time;const flash=storm.flash();peak=Math.max(peak,flash);if(flash>0&&!wasLit)litRuns++;wasLit=flash>0;
  assert.ok(storm.flash(true)<=flash*.161);if(events.length&&heard===null)heard=storm.time;
 }
 assert.ok(started!==null&&heard-started>.6&&heard-started<3);assert.ok(peak>.5&&peak<1);assert.equal(litRuns,1);
 storm.step(.04,sky,listener,false);assert.equal(storm.pending.length,0);assert.equal(storm.flash(),0);
 const dry=new a.StormSystem();for(let i=0;i<2000;i++)assert.equal(dry.step(.04,{front:1,storm:0,rain:1},listener).length,0);assert.equal(dry.strike,null);
 const g=new a.Game();g.clock=5000;const expected=JSON.stringify(g.sky()),saved=g.serialize();g.weather.pending.push({due:1});g.restore(saved);assert.equal(g.weather.pending.length,0);assert.equal(JSON.stringify(g.sky()),expected);
});
test('lightning lifts the same night tint that controls the lamps without washing the scene white',()=>{
 for(const h of [0,7,12,17,20,23]){const s={...a.dayCycle(h*60),rain:.95,cloud:.98};const normal=a.weatherTint(s),flash=a.weatherTint(s,.85);assert.ok(flash.every(v=>v<255));if(s.night>.5)assert.ok(flash.every((v,i)=>v>normal[i]));}
 const g=new a.Game(),r={g,nightK:a.Renderer.prototype.nightK},torch={x:376,y:600};g.clock=720;const daytime=a.Renderer.prototype.litOf.call(r,torch);g.clock=1380;assert.ok(a.Renderer.prototype.litOf.call(r,torch)>=daytime);assert.equal(r.nightK(),1);
});
test('rain always falls down-left through changing wind and intensity, even after hours of play',()=>{
 let sky={rain:.95,wind:.9};const cam={x:100,y:200};
 const fresh={time:0,sky:()=>sky,tile:()=>0},old={...fresh,time:36000};
 const first=new a.RainVisuals(fresh,320,180),late=new a.RainVisuals(old,320,180);
 first.step(sky,cam);late.step(sky,cam);
 for(let frame=1;frame<=600;frame++){
  sky={rain:.15+.8*(.5+.5*Math.cos(frame*.08)),wind:frame%100<50?0:1};
  const prev=late.drops.map(d=>({...d}));fresh.time=frame/60;old.time=36000+frame/60;
  first.step(sky,cam);late.step(sky,cam);
  assert.ok(late.slant>=.04&&late.slant<=1);
  for(let i=0;i<prev.length;i++){
   const p=prev[i],d=late.drops[i];
   if(p.x>=0&&p.x<=320&&p.y>=0&&p.y<=180){
    assert.ok(d.x<=p.x&&d.y>=p.y,'visible drops cannot reverse direction');
    assert.ok(d.y-p.y<7.1&&p.x-d.x<7.1,'weather changes cannot teleport drops');
   }
   assert.ok(Math.abs(d.x-first.drops[i].x)<1e-5&&Math.abs(d.y-first.drops[i].y)<1e-5,'absolute session age cannot affect trajectories');
  }
 }
 const stopped=late.drops.map(d=>[d.x,d.y]);late.step(sky,cam);assert.deepEqual(late.drops.map(d=>[d.x,d.y]),stopped);
});
test('ground impacts remain anchored while the camera moves and weather changes; walls and shelters stay clear',()=>{
 let sky={rain:1,wind:.8};const g={time:0,sky:()=>sky,tile:(x,y)=>x<40?6:y<50?3:0,tentAt:(x,y)=>x>120&&x<150&&y>100};
 const fx=new a.RainVisuals(g,320,180),cam={x:0,y:0};
 for(let i=0;i<40;i++){g.time+=1/60;fx.step(sky,cam);}
 assert.ok(fx.impacts.length>30);assert.ok(fx.impacts.some(h=>h.water));
 const anchors=new Map(fx.impacts.map(h=>[h,{x:h.x,y:h.y,age:h.age}]));
 sky={rain:.2,wind:0};g.time+=1/60;fx.step(sky,{x:12,y:7});
 let retained=0;
 for(const hit of fx.impacts){assert.notEqual(g.tile(hit.x,hit.y),6);assert.ok(!g.tentAt(hit.x,hit.y));if(anchors.has(hit)){const before=anchors.get(hit);retained++;assert.equal(hit.x,before.x);assert.equal(hit.y,before.y);assert.ok(hit.age>before.age);}}
 assert.ok(retained>20);
});
test('ground splashes draw distinct visible pixel-art poses through their lifetime',()=>{
 const sky={rain:.52,wind:.3,night:0},g={time:0,sky:()=>sky,tile:()=>0},r={g,cam:{x:0,y:0}};
 const fx=r.rainVisuals=new a.RainVisuals(g,320,180),hit={x:100,y:90,age:0,life:.5,water:false};fx.impacts.push(hit);
 const poses=[];let drawn;const c={save(){},restore(){},fillRect(...rect){drawn.push([...rect,this.globalAlpha]);}};
 for(const phase of [.05,.3,.55,.8]){hit.age=phase*hit.life;drawn=[];a.renderRainGround(r,c,320,180);assert.ok(drawn.length>0&&drawn.every(p=>p[4]>.2));poses.push(JSON.stringify(drawn.map(p=>p.slice(0,4))));}
 assert.equal(new Set(poses).size,4);
});
function midiTracks(file){const b=fs.readFileSync(file);assert.equal(b.toString('ascii',0,4),'MThd');assert.equal(b.readUInt16BE(8),1);assert.equal(b.readUInt16BE(10),5);assert.equal(b.readUInt16BE(12),480);let offset=14;const parsed={};
 for(let track=0;track<5;track++){assert.equal(b.toString('ascii',offset,offset+4),'MTrk');const end=offset+8+b.readUInt32BE(offset+4);let p=offset+8,t=0,name='',notes=[],active=new Map();const vlq=()=>{let n=0,c;do{c=b[p++];n=(n<<7)|(c&127);}while(c&128);return n;};
  while(p<end){t+=vlq();const status=b[p++];if(status===255){const type=b[p++],n=vlq();if(type===3)name=b.toString('utf8',p,p+n);p+=n;continue;}if((status&240)===192){p++;continue;}const n=b[p++],v=b[p++];if((status&240)===144&&v){assert.ok(!active.has(n));active.set(n,{t,v});}else{const on=active.get(n);assert.ok(on);notes.push([on.t,t-on.t,n,on.v]);active.delete(n);}}
  assert.equal(active.size,0);if(track)parsed[name]=notes.sort((x,y)=>x[0]-y[0]||x[2]-y[2]);offset=end;
 }assert.equal(offset,b.length);return parsed;
}
test('all five weather MIDI scores contain four complete instrument tracks identical to the runtime score',()=>{
 assert.equal(Object.keys(a.WEATHER_SCORES).length,5);for(const[name,score]of Object.entries(a.WEATHER_SCORES)){const parsed=midiTracks(path.join(root,'audio',name.replaceAll('_','-')+'.mid'));for(const[part,data]of Object.entries(score.tracks)){const notes=[];for(let i=0;i<data.length;i+=4)notes.push(Array.from(data.slice(i,i+4)));notes.sort((x,y)=>x[0]-y[0]||x[2]-y[2]);assert.deepEqual(parsed[part],notes);}}
});
test('weather synth renders increasing rain levels and thunder through SFX only, with fades and no clipping',async()=>{
 const c=new RenderingAudioContext({sampleRate:8000,numberOfChannels:2});Object.defineProperty(c,'state',{value:'running'});
 const sound=new a.Sound();sound.ctx=c;sound.enabled=true;sound.musicOn=false;sound.master=c.createGain();sound.master.gain.value=.3;sound.master.connect(c.destination);
 for(let t=0;t<26;t+=.1){const rain=t<5?.24:t<10?.52:t<15?.96:0;sound.rain(rain);if(t>=12&&t<12.1)sound.fx('thunder',{near:true,pan:.6,strength:1});c.processTo(t+.1);}
 const data=c.exportAsAudioData(),d=data.channelData[0],rms=(start,end)=>Math.sqrt(d.slice(start*8000,end*8000).reduce((s,v)=>s+v*v,0)/((end-start)*8000));
 let peak=0;for(const channel of data.channelData)for(const n of channel){assert.ok(Number.isFinite(n));peak=Math.max(peak,Math.abs(n));}assert.ok(peak<.95&&peak>.005);
 assert.ok(rms(7,9)>rms(2,4)*1.1);assert.ok(rms(11,12)>rms(7,9)*1.05);assert.ok(rms(24,25)<.00001);
 sound.sfxOn=false;sound.rain(1);// No extra cue when SFX are muted.
 const music=sound.music;let cues=0;music.cue=()=>cues++;sound.fx('thunder',{near:false});assert.equal(cues,0);
});
test('each rain texture stays stereo and continuous across three MIDI loops and noise-buffer wraps',()=>{
 for(const level of [.24,.52,.96]){
  const rate=8000,c=new RenderingAudioContext({sampleRate:rate,numberOfChannels:2});Object.defineProperty(c,'state',{value:'running'});
  const sound=new a.Sound();sound.ctx=c;sound.enabled=true;sound.master=c.createGain();sound.master.gain.value=.3;sound.master.connect(c.destination);
  for(let t=0;t<66;t+=.1){sound.rain(level);c.processTo(t+.1);}
  const [left,right]=c.exportAsAudioData().channelData;
  const rms=(start,end)=>{let sum=0;for(let i=Math.round(start*rate);i<Math.round(end*rate);i++)sum+=left[i]*left[i];return Math.sqrt(sum/Math.round((end-start)*rate));};
  const bins=[];for(let t=4;t<65;t+=.5)bins.push(rms(t,t+.5));
  assert.ok(Math.min(...bins)>Math.max(...bins)*.65,'no periodic silences or pumping');
  for(const boundary of [21.333333+.025,42.666667+.025,64+.025]){
   const before=rms(boundary-.5,boundary-.1),seam=rms(boundary-.1,boundary+.1),after=rms(boundary+.1,boundary+.5);
   assert.ok(seam>Math.min(before,after)*.8&&seam<Math.max(before,after)*1.2,'MIDI wrap has no level dip or burst');
  }
  let ll=0,rr=0,lr=0;for(let i=rate*5;i<rate*15;i++){ll+=left[i]**2;rr+=right[i]**2;lr+=left[i]*right[i];}
  assert.ok(Math.abs(lr/Math.sqrt(ll*rr))<.4,'decorrelated stereo texture');
  for(const buffer of Object.values(sound.music.weatherNoise))for(let ch=0;ch<2;ch++){
   const d=buffer.getChannelData(ch),n=d.length;let energy=0;
   for(let i=n-801;i<n-1;i++)energy+=(d[i+1]-d[i])**2;
   assert.ok(Math.abs(d[0]-d[n-1])<Math.sqrt(energy/800)*5,'noise wrap behaves like adjacent samples');
  }
 }
});
