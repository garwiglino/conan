// Mesure du mélange : chaque bruitage 8 bits à son niveau de jeu, les pas, et des scènes rendues (musiques, ambiances,
// cave du donjon, combats avec bruitages) aux réglages par défaut. Écrit audio/mix-analysis.json et un aperçu WAV.
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict'),{RenderingAudioContext}=require('web-audio-engine'),{loadGame,root}=require('../tests/game-harness.cjs');
// web-audio-engine laisse retomber à 0 la valeur tenue entre une rampe et un setValueAtTime futur (les navigateurs gardent
// la fin de rampe) : les notes longues des musiques seraient coupées. Pour la mesure, un setValueAtTime posé après un
// autre événement devient une rampe vers la même valeur.
{const proto=Object.getPrototypeOf(new RenderingAudioContext().createGain().gain),seen=new WeakSet(),set=proto.setValueAtTime,lin=proto.linearRampToValueAtTime;
 proto.setValueAtTime=function(v,t){if(seen.has(this))return lin.call(this,v,t);seen.add(this);return set.call(this,v,t);};
 for(const k of ['linearRampToValueAtTime','exponentialRampToValueAtTime','setTargetAtTime','setValueCurveAtTime']){const f=proto[k];proto[k]=function(...a){seen.add(this);return f.apply(this,a);};}}
// Crête et moyenne, crête sur 50 ms (un bruitage), médiane et 9e décile sur 400 ms (le niveau ressenti d'une musique).
function metrics(channels,sr){let peak=0,energy=0,windowPeak=0;const win=Math.floor(sr*.05);for(const a of channels){let sum=0;for(let i=0;i<a.length;i++){assert.ok(Number.isFinite(a[i]));peak=Math.max(peak,Math.abs(a[i]));energy+=a[i]*a[i];sum+=a[i]*a[i];if(i>=win)sum-=a[i-win]*a[i-win];if(i>=win-1)windowPeak=Math.max(windowPeak,sum/win);}}const W=Math.floor(sr*.4),w=[];for(let i=0;i+W<=channels[0].length;i+=W){let e=0;for(const ch of channels)for(let j=i;j<i+W;j++)e+=ch[j]*ch[j];w.push(10*Math.log10(e/(W*channels.length)+1e-24));}w.sort((x,y)=>x-y);
 const q=p=>w.length?w[Math.min(w.length-1,Math.floor(w.length*p))]:-240;
 return {peakDb:20*Math.log10(peak||1e-12),rmsDb:10*Math.log10(energy/(channels.length*channels[0].length)||1e-24),max50msDb:10*Math.log10(windowPeak||1e-24),p50Db:q(.5),p90Db:q(.9)};}
const ChipSfx=new Function(fs.readFileSync(path.join(root,'scripts/chip-sfx.js'),'utf8').match(/^const ChipSfx=[\s\S]*?\n\}\)\(\);/m)[0]+';return ChipSfx;')();
const {families}=JSON.parse(fs.readFileSync(path.join(root,'audio/chip-sfx.json'),'utf8'));
(async()=>{const a=await loadGame(),SR=16000,report={sampleRate:SR,defaultMusic:.45,chip:{},footsteps:{},renders:{}};
// Bruitages : rendu de la puce × gain de la variante × bus des bruitages (0,3) ; Kaldor marche à 0,85.
for(const [name,f]of Object.entries(families)){const v=f.variants[0],gain=v.gain*.3*(f.group==='Pas'?.85:1),d=ChipSfx.render(v,48000).map(x=>x*gain);
 (f.group==='Pas'?report.footsteps:report.chip)[name]={target:f.level,...metrics([d],48000)};}
const setup=()=>{const c=new RenderingAudioContext({sampleRate:SR,numberOfChannels:2});Object.defineProperty(c,'state',{value:'running'});const s=new a.Sound();s.ctx=c;s.enabled=true;s.master=c.createGain();s.master.gain.value=.3;s.master.connect(c.destination);s.music=new a.Music(c,c.destination);s.applyVolumes();return {c,s};};
const forest={active:true,sky:{family:'forest',night:0,wind:.3,rain:0}},cave={active:true,sky:{dungeon:'geoles'}};
const names=['ui_select','ui_confirm','ui_open','ui_back','wind','fauna','rain','thunder','cave','title','combat','boss','biome_forest','biome_travel','dungeon','dungeon_alert','combined','dungeon_fight'];
for(const name of names){const {c,s:mix}=setup();const duration=name.startsWith('ui_')?2:20;mix.chipWarm(1e9);
 for(let t=0;t<duration;t+=.1){const step=Math.round(t*10);if(t===0&&name.startsWith('ui_'))mix.fx(name);
  if(['wind','fauna','combined'].includes(name)){mix.ambience(forest);if(name==='wind')mix.amb.fauna?.bus.gain.setValueAtTime(0,c.currentTime);if(name==='fauna')mix.amb.windG.gain.setValueAtTime(0,c.currentTime);}
  if(name==='cave'||name==='dungeon_fight')mix.ambience({...cave,battle:name==='dungeon_fight'});
  if(name==='rain')mix.rain(.6);if(name==='thunder'&&t===0)mix.fx('thunder',{near:true,strength:1});
  if(a.MUSIC_DATA[name])mix.tick(true,name);
  if(name==='combined'){mix.tick(true,'biome_forest');if(step%5===0)mix.footstep('gravel',{gain:.85});if(step%20===0){mix.fx('sword',{combo:0});mix.fx('ui_select');}if(step%20===2)mix.fx('hit',{});}
  if(name==='dungeon_fight'){mix.tick(true,'dungeon_alert');if(step%5===0)mix.footstep('stone',{gain:.85});const k=step%15;if(k===0)mix.fx('sword',{combo:(step/15)%4});if(k===2)mix.fx('hit',{heavy:(step/15)%4===3});if(k===4)mix.chip('gob_hurt');if(k===9)mix.chip('gob_effort');}
  c.processTo(t+.1);}
 const data=c.exportAsAudioData(),m=metrics(data.channelData,c.sampleRate);assert.ok(m.peakDb<-1,name+' clipping');report.renders[name]=m;console.log(name,JSON.stringify(m));
 if(name==='combined'||name==='dungeon_fight')fs.writeFileSync(path.join(root,'test-output/audio-mix-'+name+'.wav'),Buffer.from(await c.encodeAudioData(data)));}
fs.writeFileSync(path.join(root,'audio/mix-analysis.json'),JSON.stringify(report,null,2)+'\n');
console.log(Object.keys(report.chip).length+' 8-bit effects, '+Object.keys(report.footsteps).length+' surfaces and '+names.length+' rendered scenes measured.');})().catch(e=>{console.error(e);process.exitCode=1;});
