// These noise instruments play the exact note events exported in the weather MIDI files.
// Filtered, enveloped layers keep the rain organic without adding a competing melody.
const WEATHER_TIMBRES={
 rain:{lead:{kind:'weather',voice:'drop',g:.16,pan:-.42},arp:{kind:'weather',voice:'splash',g:.13,pan:.42},
  saw:{kind:'weather',voice:'sheet',g:.22,pan:-.12},bass:{kind:'weather',voice:'wind',g:.2,pan:.2}},
 thunder:{lead:{kind:'weather',voice:'crack',g:.72,pan:0},arp:{kind:'weather',voice:'echo',g:.38,pan:.35},
  saw:{kind:'weather',voice:'roll',g:.65,pan:-.25},bass:{kind:'weather',voice:'body',g:.8,pan:0}}
};
function weatherVoice(music,song,tr,t,dur,note,velocity){
 const c=music.ctx,p=tr.p,voice=p.voice;
 if(!music.weatherNoise){const count=c.sampleRate*6,b=c.createBuffer(1,count,c.sampleRate),d=b.getChannelData(0);let seed=52691;
  for(let i=0;i<count;i++){seed=(seed*16807)%2147483647;d[i]=(seed/2147483647*2-1);}
  music.weatherNoise=b;
 }
 const profiles={drop:[950,5500,.003,.055],splash:[1500,7000,.002,.035],sheet:[650,5200,.35,.4],wind:[90,950,.55,.6],
  crack:[220,4300,.008,.14],echo:[120,1500,.12,.5],roll:[45,680,.25,.75],body:[28,300,.045,.9]},[low,high,attack,release]=profiles[voice];
 const s=c.createBufferSource(),hp=c.createBiquadFilter(),lp=c.createBiquadFilter(),g=c.createGain();
 s.buffer=music.weatherNoise;s.loop=true;hp.type='highpass';hp.frequency.value=Math.min(low*(.84+(note%12)*.035),c.sampleRate*.4);lp.type='lowpass';lp.frequency.value=Math.min(high,c.sampleRate*.45);
 const amplitude=p.g*velocity/127,end=t+dur;
 g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(amplitude,t+Math.min(attack,dur*.35));
 g.gain.setTargetAtTime(amplitude*(voice==='crack'?.12:.65),t+Math.min(attack,dur*.35),Math.max(.025,dur*.3));
 g.gain.setTargetAtTime(0,end,release/3);
 s.connect(hp);hp.connect(lp);lp.connect(g);g.connect(tr.node);s.start(t,(note*.173+t*.127)%3);s.stop(end+release*3+.02);
 s.onended=()=>{s.disconnect();hp.disconnect();lp.disconnect();g.disconnect();};
}
function weatherRain(sound,level){
 const c=sound.ctx;if(!c)return;
 level=sound.enabled&&sound.sfxOn&&c.state==='running'?clamp(level,0,1):0;
 if(!sound.rainAudio){if(level<=0||!sound.master)return;sound.music??=new Music(c,c.destination);
  const bus=sound.weatherBus||(sound.weatherBus=c.createGain());bus.gain.value=1;bus.connect(sound.master);
  const names=['rain_light','rain_steady','rain_downpour'],songs=names.map(name=>sound.music.start(name,c.currentTime+.025,WEATHER_SCORES[name],false,false,false,bus));
  for(const song of songs){song.bus.gain.cancelScheduledValues(c.currentTime);song.bus.gain.value=0;}
  sound.rainAudio={bus,songs,last:c.currentTime};
 }
 const R=sound.rainAudio,now=c.currentTime;R.bus.gain.setTargetAtTime(level>0?1:0,now,.2);
 const weights=[clamp(level/.24,0,1)*(1-skySmooth(.24,.54,level)),skySmooth(.24,.54,level)*(1-skySmooth(.58,.95,level)),skySmooth(.58,.95,level)];
 R.songs.forEach((song,i)=>{
  const score=WEATHER_SCORES[song.name];song.bus.gain.setTargetAtTime(weights[i]*score.gain*CUE_VOLUME,now,.55);
  // Resuming a suspended tab must not iterate over hours of missed rain notes.
  if(now-R.last>1)for(const tr of Object.values(song.tracks)){tr.i=0;tr.iter=Math.max(0,Math.floor((now-song.t0)/song.loop));}
  if(level>0||now-R.last<2)sound.music.schedule(song,now+.18);
 });
 if(level>0)R.last=now;
}
function weatherThunder(sound,event){
 if(!sound.enabled||!sound.sfxOn||!sound.ctx||!sound.master)return;
 sound.music??=new Music(sound.ctx,sound.ctx.destination);
 const pan=sound.ctx.createStereoPanner();pan.pan.value=clamp(event.pan||0,-.85,.85);pan.connect(sound.weatherBus||sound.master);
 sound.music.cue(event.near?'thunder_near':'thunder_distant',sound.ctx.currentTime+.01,pan,.7+.3*(event.strength??1));
 setTimeout(()=>{try{pan.disconnect();}catch{}},9000);
}
