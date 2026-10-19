// Fixed headroom and source calibration; user music/SFX settings remain independent.
for(const [name,trim]of Object.entries({title:.45,ambient:.4,night:.4,combat:.22,boss:.24,gameover:.5}))MUSIC_DATA[name].gain*=trim;
Sound.prototype.sampleTrim=function(buffer){
 this.sampleLevels??=new WeakMap();if(this.sampleLevels.has(buffer))return this.sampleLevels.get(buffer);
 let peak=0,energy=0,maxRms=0;const size=Math.max(1,Math.floor(buffer.sampleRate*.05));
 for(let ch=0;ch<buffer.numberOfChannels;ch++){const a=buffer.getChannelData(ch);energy=0;for(let i=0;i<a.length;i++){peak=Math.max(peak,Math.abs(a[i]));energy+=a[i]*a[i];if(i>=size)energy-=a[i-size]*a[i-size];if(i>=size-1)maxRms=Math.max(maxRms,Math.sqrt(Math.max(0,energy)/size));}}
 const gain=Math.min(.65,.12/Math.max(peak,.001),.03/Math.max(maxRms,.001));this.sampleLevels.set(buffer,gain);return gain;
};
function footSurface(game,actor){
 if(actor.level)return 'wood';const w=Atlas.toWorld(actor.x,actor.y),t=game.tile(actor.x,actor.y);
 if(t===5)return 'wood';if(t===3)return 'water';
 if(!atlasCore(actor.x/16,actor.y/16)){
  const env=Atlas.environment(w.x,w.y),cell=Atlas.cellAt(w.x,w.y),np=WorldTerrainArt.noise(Math.floor(w.x*16),Math.floor(w.y*16),86,450);
  const parts=env.mix.map(m=>({...m,family:WorldTerrainArt.family(m)})).sort((a,b)=>a.family.localeCompare(b.family)||a.biome-b.biome);
  let part=parts[0],sum=0;for(const p of parts){sum+=p.weight;if(clamp((np-.18)/.64,0,.99999)<sum){part=p;break;}}
  const b=part?.biome??cell?.biome??1,cover=Atlas.visualSnowCover(b,part?.height??cell?.height,Math.floor(game.clock),part?.region??cell?.region);
  if(cover>=.99||cover>0&&np<.18+cover*.64)return 'snow';
  if(t===2||t===8)return 'stone';if(t!==1&&!part?.cursed&&Atlas.coastDistance(w.x,w.y)<6+(WorldTerrainArt.noise(Math.floor(w.x*16),Math.floor(w.y*16),40,41)-.5)*3)return 'sand';if([8,12].includes(b))return 'mud';
  if(t===1)return [9,10,11].includes(b)?'gravel':'earth';
  if(np>.68)return [1,2,3].includes(b)?'sand':[9,10,11].includes(b)?'gravel':'earth';
  return [1,2].includes(b)?'sand':[10,11].includes(b)?'gravel':'grass';
 }
 return t===2||t===8?'stone':t===1?'earth':'sand';
}
const FOOT_MATERIALS={sand:[.16,900,.11,120],earth:[.12,1600,.08,160],grass:[.17,2600,.1,180],gravel:[.14,3800,.08,400],stone:[.09,4400,.045,750],wood:[.13,2100,.12,320],mud:[.19,1200,.08,110],water:[.2,3500,.02,190],snow:[.2,1900,.035,220]};
Sound.prototype.footBuffer=function(material,variant){
 this.footBuffers??=new Map();const key=material+':'+variant;if(this.footBuffers.has(key))return this.footBuffers.get(key);
 const c=this.ctx,[duration,cut,body,freq]=FOOT_MATERIALS[material]||FOOT_MATERIALS.earth,n=Math.ceil(c.sampleRate*duration),buf=c.createBuffer(1,n,c.sampleRate),a=buf.getChannelData(0),alpha=1-Math.exp(-2*Math.PI*cut/c.sampleRate);
 let seed=1237+variant*311+Object.keys(FOOT_MATERIALS).indexOf(material)*97,low=0,peak=0;
 for(let i=0;i<n;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const noise=seed/2147483648-1,t=i/c.sampleRate,u=t/duration;low+=alpha*(noise-low);const crunch=material==='gravel'||material==='snow'?(.6+.4*Math.sin(t*730+variant)**2):1,env=Math.min(1,t/.004)*(1-u)**3;a[i]=env*(low*.7*crunch+body*Math.sin(2*Math.PI*freq*(1+variant*.018)*t)*Math.exp(-t*25));peak=Math.max(peak,Math.abs(a[i]));}
 for(let i=0;i<n;i++)a[i]*=.11/Math.max(.001,peak);this.footBuffers.set(key,buf);return buf;
};
Sound.prototype.footstep=function(material,{gain=1,pan=0,variant=0}={}){
 if(!this.enabled||!this.sfxOn||!this.ctx||!this.master||this.sfxVolume===0||this.travelQuiet)return;
 const c=this.ctx,now=c.currentTime;this.footVoices=(this.footVoices||[]).filter(v=>v.end>now);if(this.footVoices.length>=8)return;
 const src=c.createBufferSource(),g=c.createGain(),p=c.createStereoPanner();src.buffer=this.footBuffer(material,variant%3);g.gain.value=Math.min(1,gain)*.22;p.pan.value=clamp(pan,-.8,.8);src.connect(g);g.connect(p);p.connect(this.master);
 const voice={end:now+src.buffer.duration,src,g,p};this.footVoices.push(voice);src.onended=()=>{src.disconnect();g.disconnect();p.disconnect();};src.start(now);
};
Sound.prototype.updateFootsteps=function(game,active,dt){
 if(!active||game.journey||game.dead||game.dying||game.sleeping||!this.enabled||!this.sfxOn){this.footTracks=new WeakMap();for(const v of this.footVoices||[])try{v.src.stop();}catch{}this.footVoices=[];return;}
 this.footTracks??=new WeakMap();const player=game.player,actors=[player,...game.npcs.filter(n=>n.id!=='fairy'&&(n.civilian?!n.civilian.dead&&(n.alpha??1)>.5:game.npcPresent(n))),...game.enemies.filter(n=>!n.dead&&!['snake','serpent','boss'].includes(n.kind))].filter(n=>!n.down&&(n.level||0)===(player.level||0)&&Math.hypot(n.x-player.x,n.y-player.y)<240).sort((a,b)=>Math.hypot(a.x-player.x,a.y-player.y)-Math.hypot(b.x-player.x,b.y-player.y)).slice(0,16);
 let played=0;for(const n of actors){const prev=this.footTracks.get(n),now={x:n.x,y:n.y,anim:n.anim||0,variant:prev?.variant||0,at:game.time};this.footTracks.set(n,now);if(!prev||game.time-prev.at>.12)continue;const moved=Math.hypot(n.x-prev.x,n.y-prev.y);
  if(moved>Math.max(8,dt*350)||n.dash||n.held||n.hurt||n.attack||n.wind||n.useTime||n.melee||n.move||moved<.001)continue;
  // The six-frame walk has two foot contacts. Never catch up missed sounds.
  if(now.anim<=prev.anim||Math.floor(now.anim/3)===Math.floor(prev.anim/3))continue;now.variant++;if(played>=3)continue;
  const distance=Math.hypot(n.x-player.x,n.y-player.y),gain=n===player?.85:.4*(1-distance/240)**2;this.footstep(footSurface(game,n),{gain,pan:(n.x-player.x)/220,variant:now.variant});played++;
 }
};

Sound.prototype.environmentOutput=function(){if(!this.environmentBus){this.environmentBus=this.ctx.createGain();this.environmentBus.gain.value=SFX_VOLUME*this.environmentVolume;this.environmentBus.connect(this.ctx.destination);}return this.environmentBus;};
Sound.prototype.setEnvironmentVolume=function(value){if(!Number.isFinite(value))return;this.environmentVolume=clamp(value,0,1);this.saveAudio();this.wake();this.applyVolumes();};
