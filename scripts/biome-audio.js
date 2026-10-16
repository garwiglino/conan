// Ecological cues use MIDI timing but custom animal synthesis, not GM bird patches.
function biomeVoice(m,song,tr,t,dur,note,velocity){const c=m.ctx,p=tr.p,amp=p.g*velocity/127;
 if(p.kind==='flute'){const f=440*2**((note-69)/12),o=c.createOscillator(),g=c.createGain();o.type='sine';o.frequency.value=f;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(amp,t+.09);g.gain.setTargetAtTime(amp*.65,t+.12,.4);g.gain.setTargetAtTime(0,t+dur,.12);o.connect(g);g.connect(tr.node);o.start(t);o.stop(t+dur+.9);return;}
 const voices={gull:[1100,760,.8,3],hawk:[2500,1250,1.2,2],owl:[340,280,1.1,2],lark:[2200,3600,.18,5],songbird:[1800,2900,.23,4],parrot:[1150,850,.3,3],frog:[210,150,.16,4],cricket:[4300,4500,.045,8],raven:[680,330,.24,3],wolf:[430,600,2.5,1],wind:[100,100,0,0]},v=voices[p.voice]||voices.songbird;
 const transpose=2**((note-74)/36);
 for(let i=0;i<v[3];i++){const at=t+i*(p.voice==='cricket'?.1:dur/(v[3]+.2)),len=Math.min(v[2],dur),o=c.createOscillator(),g=c.createGain(),lp=c.createBiquadFilter();o.type=['parrot','raven','frog'].includes(p.voice)?'triangle':'sine';o.frequency.setValueAtTime(v[0]*transpose,at);o.frequency.exponentialRampToValueAtTime(v[1]*transpose,at+len*.8);lp.type='lowpass';lp.frequency.value=p.voice==='cricket'?6200:4400;g.gain.setValueAtTime(0,at);g.gain.linearRampToValueAtTime(amp,at+Math.min(.03,len*.2));g.gain.exponentialRampToValueAtTime(.00001,at+len);o.connect(lp);lp.connect(g);g.connect(tr.node);o.onended=()=>{o.disconnect();lp.disconnect();g.disconnect();};o.start(at);o.stop(at+len+.01);}
}
const biomeDirectorUpdate=MusicDirector.prototype.update;
MusicDirector.prototype.update=function(g,playing,dt){
 if(g.journey&&!g.dead&&!g.dying){this.hold=0;return 'biome_travel';}
 const mode=biomeDirectorUpdate.call(this,g,playing,dt);
 if((mode==='ambient'||mode==='night')&&g.sky){const family=g.sky().family;if(MUSIC_DATA['biome_'+family])return 'biome_'+family;}
 return mode;
};
Sound.prototype.ambience=function(o){const c=this.ctx;if(!c)return;const active=this.enabled&&this.sfxOn&&c.state==='running'&&o.active;
 if(!active){if(this.amb)this.amb.bus.gain.setTargetAtTime(0,c.currentTime,.08);return;}
 if(!this.amb)this.ambBuild();this.music??=new Music(c,c.destination);const A=this.amb,now=c.currentTime,sky=o.sky||{},family=sky.family||'forest',night=(sky.night??o.night)>.65,key=family+'_'+(night?'night':'day'),score=BIOME_SCORES.fauna[key];
 const exposure=1-clamp((sky.rain||0)*.9+(sky.snow||0)*.8,0,.95);
 A.bus.gain.setTargetAtTime(AMB_VOLUME*(o.battle?.45:1),now,.6);A.crkG.gain.setTargetAtTime(0,now,.15);
 A.windG.gain.setTargetAtTime(.18+(sky.wind||0)*.7+(sky.blizzard||0)*.35,now,1.5);
 if(A.fauna?.name!==key){if(A.fauna){A.fauna.bus.gain.setTargetAtTime(0,now,.3);const old=A.fauna;setTimeout(()=>old.bus.disconnect(),2000);}A.fauna=score?this.music.start(key,now+.03,score,false,false,false,A.bus):null;}
 if(A.fauna){A.fauna.bus.gain.setTargetAtTime(score.gain*exposure*(o.battle?.2:1),now,.6);if(now-(A.faunaScheduled||now)>1)for(const tr of Object.values(A.fauna.tracks)){tr.i=0;tr.iter=Math.max(0,Math.floor((now-A.fauna.t0)/A.fauna.loop));}this.music.schedule(A.fauna,now+.3);A.faunaScheduled=now;}
};

Sound.prototype.setTravelQuiet=function(quiet){this.travelQuiet=quiet;if(this.weatherBus)this.weatherBus.gain.setTargetAtTime(quiet?0:1,this.ctx.currentTime,.04);if(quiet&&this.amb)this.amb.bus.gain.setTargetAtTime(0,this.ctx.currentTime,.04);};
