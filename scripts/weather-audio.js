// MIDI velocities shape continuous rain beds; droplets and thunder retain note envelopes.
const WEATHER_TIMBRES={
 rain:{lead:{kind:'weather',voice:'drop',g:.08,pan:-.24},arp:{kind:'weather',voice:'splash',g:.065,pan:.28},
  saw:{kind:'weather',voice:'sheet',g:.34,pan:0},bass:{kind:'weather',voice:'wind',g:.28,pan:0}},
 thunder:{lead:{kind:'weather',voice:'crack',g:.72,pan:0},arp:{kind:'weather',voice:'echo',g:.38,pan:.35},
  saw:{kind:'weather',voice:'roll',g:.65,pan:-.25},bass:{kind:'weather',voice:'body',g:.8,pan:0}}
};
function weatherNoise(music,kind){
 const cache=music.weatherNoise||(music.weatherNoise={});if(cache[kind])return cache[kind];
 const c=music.ctx,seconds=kind==='sheet'?7.3:kind==='wind'?11.1:5.7,n=Math.round(c.sampleRate*seconds),overlap=Math.round(c.sampleRate*.45);
 const b=c.createBuffer(2,n,c.sampleRate);let seed=kind==='sheet'?52691:kind==='wind'?196613:8191;
 // Independent stereo channels. Overlap the continuation with the beginning at equal power:
 // the final sample leads naturally into the first, with no fade to silence at the wrap.
 for(let channel=0;channel<2;channel++){
  const raw=new Float32Array(n+overlap),out=b.getChannelData(channel);let slow=0,mid=0;
  for(let i=0;i<raw.length;i++){
   seed=seed*16807%2147483647;const white=seed/2147483647*2-1;
   slow+=Math.min(1,220/c.sampleRate)*(white-slow);mid+=Math.min(1,2800/c.sampleRate)*(white-mid);
   raw[i]=kind==='wind'?slow*3.2+mid*.6:kind==='sheet'?white*.52+mid*.85:white;
  }
  out.set(raw.subarray(0,n));
  for(let i=0;i<overlap;i++){const angle=i/(overlap-1)*Math.PI/2;out[i]=raw[n+i]*Math.cos(angle)+raw[i]*Math.sin(angle);}
 }
 return cache[kind]=b;
}
function weatherVoice(music,song,tr,t,dur,note,velocity){
 const c=music.ctx,p=tr.p,voice=p.voice,bed=voice==='sheet'||voice==='wind',amplitude=p.g*velocity/127;
 if(bed&&tr.bed){tr.bed.g.gain.setTargetAtTime(amplitude,t,voice==='wind'?1.8:.85);return;}
 const profiles={drop:[1100,6400,.004,.08],splash:[1800,8200,.006,.11],sheet:[480,6800,.7,1],wind:[90,1200,1.2,1],
  crack:[220,4300,.008,.14],echo:[120,1500,.12,.5],roll:[45,680,.25,.75],body:[28,300,.045,.9]},[low,high,attack,release]=profiles[voice];
 const s=c.createBufferSource(),hp=c.createBiquadFilter(),lp=c.createBiquadFilter(),g=c.createGain();
 s.buffer=weatherNoise(music,bed?voice:'detail');s.loop=true;
 hp.type='highpass';hp.frequency.value=Math.min(low*(bed?1:.84+(note%12)*.035),c.sampleRate*.4);hp.Q.value=.45;
 lp.type='lowpass';lp.frequency.value=Math.min(high,c.sampleRate*.45);lp.Q.value=.45;
 s.connect(hp);hp.connect(lp);lp.connect(g);g.connect(tr.node);
 const cleanup=()=>{s.disconnect();hp.disconnect();lp.disconnect();g.disconnect();};s.onended=cleanup;
 s.start(t,(note*.173+t*.127)%s.buffer.duration);
 g.gain.setValueAtTime(0,t);
 if(bed){
  // Legato instrument: adjoining MIDI notes change the texture, never restart its source.
  g.gain.setTargetAtTime(amplitude,t,attack);tr.bed={s,g,cleanup};
 }else{
  const end=t+dur;g.gain.linearRampToValueAtTime(amplitude,t+Math.min(attack,dur*.35));
  g.gain.setTargetAtTime(amplitude*(voice==='crack'?.12:.3),t+Math.min(attack,dur*.35),Math.max(.015,dur*.25));
  g.gain.setTargetAtTime(0,end,release/3);s.stop(end+release*3+.02);
 }
}
function weatherRain(sound,level){
 const c=sound.ctx;if(!c)return;
 level=sound.enabled&&sound.environmentVolume>0&&c.state==='running'?clamp(level,0,1):0;
 if(!sound.rainAudio){if(level<=0||!sound.master)return;sound.music??=new Music(c,c.destination);
  if(!sound.weatherBus){sound.weatherBus=c.createGain();sound.weatherBus.connect(sound.environmentOutput());}
  const songs=['rain_light','rain_steady','rain_downpour'].map(name=>sound.music.start(name,c.currentTime+.025,WEATHER_SCORES[name],false,false,false,sound.weatherBus));
  for(const song of songs){song.bus.gain.cancelScheduledValues(c.currentTime);song.bus.gain.value=0;}
  sound.rainAudio={songs,lastWet:c.currentTime,scheduled:c.currentTime};
 }
 const R=sound.rainAudio,now=c.currentTime;
 const weights=[clamp(level/.24,0,1)*(1-skySmooth(.24,.54,level)),skySmooth(.24,.54,level)*(1-skySmooth(.58,.95,level)),skySmooth(.58,.95,level)];
 if(level>0)R.lastWet=now;
 if(!level&&now-R.lastWet>3){
  for(const song of R.songs){for(const tr of Object.values(song.tracks)){if(tr.bed){tr.bed.s.stop();tr.bed.cleanup();}tr.node.disconnect();}song.bus.disconnect();}
  sound.rainAudio=null;return;
 }
 R.songs.forEach((song,i)=>{
  song.bus.gain.setTargetAtTime(weights[i]*WEATHER_SCORES[song.name].gain*CUE_VOLUME*.22,now,level>0?.65:.18);
  // Skip missed note events after suspension; continuous sources keep their phase.
  if(now-R.scheduled>1)for(const tr of Object.values(song.tracks)){tr.i=0;tr.iter=Math.max(0,Math.floor((now-song.t0)/song.loop));}
  sound.music.schedule(song,now+.3);
 });
 R.scheduled=now;
}
function weatherThunder(sound,event){
 if(sound.travelQuiet||!sound.enabled||sound.environmentVolume===0||!sound.ctx||!sound.master)return;
 if(!sound.weatherBus){sound.weatherBus=sound.ctx.createGain();sound.weatherBus.connect(sound.master);}
 sound.music??=new Music(sound.ctx,sound.ctx.destination);
 const pan=sound.ctx.createStereoPanner();pan.pan.value=clamp(event.pan||0,-.85,.85);pan.connect(sound.weatherBus||sound.master);
 sound.music.cue(event.near?'thunder_near':'thunder_distant',sound.ctx.currentTime+.01,pan,(.7+.3*(event.strength??1))*.25);
 setTimeout(()=>{try{pan.disconnect();}catch{}},9000);
}
