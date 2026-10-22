// Donjons : une seule musique pour tous (« Sous la pierre »), sa variante quand les gobelins voient le héros,
// le thème de boss contre leur chef, et une ambiance de cave humide à la place du vent et de la faune.
// La cave est synthétisée au démarrage, par petites tranches d'une image à l'autre pour ne jamais figer le jeu :
// gouttes qui tombent dans des flaques, fuites régulières, filet d'eau, air lourd qui respire, souffle des
// galeries, chaînes, pierres et gonds au loin, le tout dans une réverbération de pierre. Chaque étage tire de
// son nom ses propres fuites : même donjon, autre salle.
const DungeonCave=(()=>{
 const rng=seed=>{let s=(seed>>>0)%2147483646+1;return ()=>(s=s*16807%2147483647)/2147483647;};
 const hash=text=>{let h=2166136261;for(const ch of String(text))h=Math.imul(h^ch.charCodeAt(0),16777619)>>>0;return h;};
 const clock=()=>typeof performance!=='undefined'?performance.now():Date.now();
 // Niveaux relatifs des couches, calés par rendu hors ligne : la cave reste nettement sous l'ambiance d'une forêt
 // au grand jour, avec peu de gouttes et un souffle presque sans grave (demande de Lino, 22 octobre).
 const MIX={air:.05,draft:1.05,trickle:.15,leak:.2,drip:.24,events:.5,wet:1};
 // Filtre passe-bande RBJ pour le pré-calcul des tampons.
 function band(f,q,sr){const w=2*Math.PI*f/sr,al=Math.sin(w)/(2*q),a0=1+al;let x1=0,x2=0,y1=0,y2=0;
  const b0=al/a0,b2=-al/a0,a1=-2*Math.cos(w)/a0,a2=(1-al)/a0;return x=>{const y=b0*x+b2*x2-a1*y1-a2*y2;x2=x1;x1=x;y2=y1;y1=y;return y;};}
 function normalize(d,peak){let m=0;for(const v of d)m=Math.max(m,Math.abs(v));if(m>0)for(let i=0;i<d.length;i++)d[i]*=peak/m;}
 // Chaque tampon se calcule dans un générateur qui rend la main toutes les 4096 valeurs.
 const tick=i=>(i&4095)===0;
 // Boucle sans couture : la fin du tampon se fond dans son début. Les couches graves vivent à 22 050 Hz.
 function* loop(c,sec,ch,fill,rate=c.sampleRate){const n=Math.floor(rate*sec),f=Math.floor(rate*.4),b=c.createBuffer(ch,n,rate);
  for(let k=0;k<ch;k++){const t=new Float32Array(n+f);yield* fill(t,k,rate);const d=b.getChannelData(k);for(let i=0;i<n;i++)d[i]=i<f?t[i]*(i/f)+t[n+i]*(1-i/f):t[i];}return b;}
 // Réponse de pierre : bruit stéréo décorrélé, -60 dB en `seconds`, aigus éteints plus vite que les graves,
 // et quelques premières réflexions de murs proches.
 function* impulse(c,seconds,bright,seed){const sr=c.sampleRate,n=Math.floor(sr*seconds),b=c.createBuffer(2,n,sr);
  for(let ch=0;ch<2;ch++){const d=b.getChannelData(ch),r=rng(seed+ch*7919);let lp=0;
   for(let i=0;i<n;i++){const t=i/sr,a=Math.exp(-2*Math.PI*(180+bright*Math.exp(-t*2.2))/sr);lp=lp*a+(r()*2-1)*(1-a);d[i]=lp*Math.exp(-6.9*t/seconds)*Math.min(1,t/.012);if(tick(i))yield;}
   for(const [at,g]of [[.011,.7],[.019,.5],[.027,.42],[.043,.3],[.061,.22]]){const k=Math.floor((at+ch*.0023)*sr);if(k<n)d[k]+=g*(ch?-.12:.12);}}
  return b;}
 // Goutte : petit choc puis bulle dont la hauteur monte (la bulle qui se referme sous la surface).
 function* drop(c,f0,seed,heavy){const sr=c.sampleRate,n=Math.floor(sr*.32),b=c.createBuffer(1,n,sr),d=b.getChannelData(0),r=rng(seed);
  const rise=.3+r()*.4,tau=.016+r()*.016;
  function* bubble(at,f,amp,decay){let ph=0;for(let i=Math.floor(at*sr);i<n;i++){const t=i/sr-at,e=Math.min(1,t/.0006)*Math.exp(-t/decay);if(e<1e-4&&t>.01)break;ph+=2*Math.PI*f*(1+rise*(1-Math.exp(-t/.011)))/sr;d[i]+=amp*e*Math.sin(ph);if(tick(i))yield;}}
  for(let i=0;i<sr*.004;i++)d[i]+=(r()*2-1)*.1*Math.exp(-i/sr/.0005);
  yield* bubble(0,f0,1,tau);
  if(heavy){yield* bubble(.022+r()*.02,f0*(1.25+r()*.2),.35,tau*.7);let ph=0;for(let i=0;i<n;i++){const t=i/sr;ph+=2*Math.PI*(150+60*Math.exp(-t/.01))/sr;d[i]+=.32*Math.sin(ph)*Math.exp(-t/.03);if(tick(i))yield;}}
  normalize(d,.8);return b;}
 // Filet d'eau : une pluie de micro-bulles et un clapotis filtré, en stéréo large.
 function trickle(c,seed){return loop(c,7.3,2,function*(t,k,sr){const r=rng(seed+k*31),bp=band(2300,1.4,sr);let g=0,target=0,count=0;
  for(let at=r()*.02;at<t.length/sr;at+=-Math.log(1-r()*.999)/55){const f=1600*3.2**r(),amp=.05+.3*r()**2,decay=.004+r()*.005;let ph=0;
   for(let i=Math.floor(at*sr),e=1;i<t.length&&e>1e-3;i++){const x=i/sr-at;e=Math.min(1,x/.0004)*Math.exp(-x/decay);ph+=2*Math.PI*f*(1+.35*(1-Math.exp(-x/.004)))/sr;t[i]+=amp*e*Math.sin(ph);}
   if(++count%24===0)yield;}
  for(let i=0;i<t.length;i++){if(i%Math.floor(sr/9)===0)target=.3+r()*.7;g+=(target-g)*.0009;t[i]+=bp(r()*2-1)*.16*g;if(tick(i))yield;}
  normalize(t,.5);});}
 // Air lourd : bruit brun très grave, il gronde à peine.
 function air(c,seed){return loop(c,9.7,2,function*(t,k){const r=rng(seed+k*101);let b=0;for(let i=0;i<t.length;i++){b=.994*b+(r()*2-1)*.04;t[i]=b;if(tick(i))yield;}normalize(t,.6);},22050);}
 // Souffle des galeries : bruit rose, passé dans un passe-bande qui se déplace lentement en jeu.
 function draft(c,seed){return loop(c,8.1,1,function*(t){const r=rng(seed);let b0=0,b1=0,b2=0;for(let i=0;i<t.length;i++){const w=r()*2-1;b0=.99765*b0+w*.099;b1=.963*b1+w*.2965;b2=.57*b2+w*1.0527;t[i]=(b0+b1+b2+w*.1848)*.11;if(tick(i))yield;}normalize(t,.6);},22050);}
 // Bruits lointains : chaînes qui s'entrechoquent (cliquetis mats, sans résonance de cloche), pierre qui tombe puis
 // cailloux, gond qui grince, eau profonde.
 function* chains(c,seed){const sr=c.sampleRate,n=Math.floor(sr*1.4),b=c.createBuffer(1,n,sr),d=b.getChannelData(0),r=rng(seed);
  for(let at=.01,k=0,count=6+Math.floor(r()*6);k<count&&at<1.1;k++,at+=.03+r()*.13){const f=700+r()*900,amp=.4+.6*r(),bp=band(f*2.2,.9,sr);
   for(const [ratio,level,decay]of [[1,.5,.014],[1.47,.42,.012],[1.93,.34,.01],[2.44,.28,.008],[3.58,.2,.006],[4.93,.14,.005]]){const fr=f*ratio*(.93+r()*.14);for(let i=Math.floor(at*sr),ph=0;i<n;i++){const x=i/sr-at,e=Math.exp(-x/decay);if(e<1e-3)break;d[i]+=amp*level*e*Math.sin(ph+=2*Math.PI*fr/sr);}yield;}
   for(let i=Math.floor(at*sr),j=0;j<sr*.03&&i<n;i++,j++)d[i]+=amp*.6*bp(r()*2-1)*Math.exp(-j/sr/.005);}
  normalize(d,.8);return b;}
 function* stone(c,seed){const sr=c.sampleRate,n=Math.floor(sr*1.8),b=c.createBuffer(1,n,sr),d=b.getChannelData(0),r=rng(seed);let ph=0,lp=0;
  for(let i=0;i<n;i++){const t=i/sr;ph+=2*Math.PI*(38+18*Math.exp(-t/.06))/sr;lp+=.04*((r()*2-1)-lp);d[i]=Math.sin(ph)*Math.exp(-t/.22)+lp*2.2*Math.exp(-t/.12)*Math.min(1,t/.003);if(tick(i))yield;}
  for(let k=0,at=.26+r()*.1,gap=.18;k<4+Math.floor(r()*4)&&at<1.6;k++,at+=gap*(.6+r()*.5),gap*=.78){const f=900+r()*700,amp=.3*(1-k*.1),bp=band(2800,2,sr);
   for(let i=Math.floor(at*sr),j=0,ph2=0;j<sr*.03&&i<n;i++,j++){const x=j/sr;d[i]+=amp*(bp(r()*2-1)*Math.exp(-x/.006)*2+Math.sin(ph2+=2*Math.PI*f/sr)*Math.exp(-x/.005));}yield;}
  normalize(d,.85);return b;}
 function* creak(c,seed){const sr=c.sampleRate,n=Math.floor(sr*1.6),b=c.createBuffer(1,n,sr),d=b.getChannelData(0),r=rng(seed),phase=r()*6;
  const res=[band(380,6,sr),band(1150,8,sr),band(2600,10,sr)];let next=0;
  for(let i=0;i<n;i++){const t=i/sr;let x=0;if(t>=next){x=1;next=t+1/(78+34*Math.sin(2*Math.PI*.8*t+phase)+r()*12);}
   const e=Math.min(1,t/.18)*Math.max(0,Math.min(1,(1.55-t)/.35))*(.75+.25*Math.sin(2*Math.PI*3.1*t));d[i]=e*(res[0](x)+res[1](x)*.6+res[2](x)*.25);if(tick(i))yield;}
  normalize(d,.7);return b;}
 function* splash(c,seed){const sr=c.sampleRate,n=Math.floor(sr*.9),b=c.createBuffer(1,n,sr),d=b.getChannelData(0),r=rng(seed),bp=band(1800,1.2,sr);let ph=0;
  for(let i=0;i<n;i++){const t=i/sr;ph+=2*Math.PI*(270*(1+.55*(1-Math.exp(-t/.02))))/sr;d[i]=Math.sin(ph)*Math.exp(-t/.06)*Math.min(1,t/.001)+bp(r()*2-1)*.9*Math.exp(-t/.08)*Math.min(1,t/.004);if(tick(i))yield;}
  for(let k=0;k<3;k++){const at=.12+k*.09+r()*.06,f=900+r()*900;for(let i=Math.floor(at*sr),ph2=0;i<n;i++){const x=i/sr-at,e=Math.exp(-x/.015);if(e<1e-3)break;d[i]+=.3*e*Math.sin(ph2+=2*Math.PI*f*(1+.5*(1-Math.exp(-x/.01)))/sr);}yield;}
  normalize(d,.8);return b;}
 // Ordre de fabrication : d'abord les gouttes et la pierre (une fuite s'entend tout de suite), puis l'air,
 // le filet d'eau, le souffle et les bruits lointains. Chaque couche commence dès que son tampon est prêt.
 function recipe(c){const r=rng(1709),jobs=[];
  for(let k=0;k<10;k++)jobs.push(['drops',k,drop(c,520*2.6**(k/9)*(.97+r()*.06),300+k*17,k<3)]);
  jobs.push(['stoneIR',0,impulse(c,2.8,2600,5101)],['air',0,air(c,401)],['trickle',0,trickle(c,77)],['draft',0,draft(c,903)],['roomIR',0,impulse(c,1.5,3200,5303)]);
  for(const [kind,make,seeds]of [['chains',chains,[11,12]],['stone',stone,[21,22]],['creak',creak,[31,32]],['splash',splash,[41]]])seeds.forEach((s,k)=>jobs.push([kind,k,make(c,s)]));
  return jobs;}
 // Ce que chaque étage tire de son nom : rythme et place des fuites, filet d'eau, densité des gouttes, écho.
 function floorPlan(id){const r=rng(hash(id));
  // Une fuite lente par salle ; parfois une seconde, plus loin, plus lente et plus faible.
  const leak=(far=1)=>({period:(3.4+r()*3.6)*far,drop:Math.floor(r()*10),rate:.95+r()*.1,pan:(r()*2-1)*.65,gain:(.5+r()*.3)/far});
  const first=leak();
  return {leaks:[first,...(r()<.3?[leak(1.7)]:[])],trickle:r()<.65?{gain:.35+r()*.4,pan:(r()*2-1)*.7}:null,drip:8+r()*7,wet:.5+r()*.35,events:20+r()*20,
   weights:{chains:1+r()*2,stone:1+r()*1.5,creak:.6+r()*1.4,splash:.5+r()}};}
 function create(c,destination,options={}){
  const M={...MIX,...options.mix},S={drops:[],chains:[],stone:[],creak:[],splash:[]},jobs=recipe(c),r=options.random||Math.random;
  const cave={floor:null,plan:null,running:false,leakAt:[],dripAt:0,eventAt:0,draftAt:0,loops:{},leftAt:0};
  const out=c.createGain(),dry=c.createGain(),far=c.createBiquadFilter(),send=c.createGain(),verb=c.createConvolver(),ret=c.createGain();
  out.gain.value=0;out.connect(destination);dry.connect(out);far.type='lowpass';far.frequency.value=2000;far.connect(dry);
  send.connect(verb);verb.connect(ret);ret.gain.value=.85*M.wet;ret.connect(out);
  // Fabrique les tampons restants pendant au plus `budget` millisecondes.
  function prepare(budget=4){const end=clock()+budget;
   while(jobs.length&&clock()<end){const [key,index,gen]=jobs[0],step=gen.next();if(!step.done)continue;jobs.shift();
    if(Array.isArray(S[key]))S[key][index]=step.value;else S[key]=step.value;
    if(key==='stoneIR')verb.buffer=step.value;
    if(cave.running&&['air','trickle','draft'].includes(key))layer(key,c.currentTime);}
   return !jobs.length;}
  // Bruit ponctuel : direct (proche, ou étouffé par la distance) et départ vers la réverbération.
  function shot(buf,at,{gain=1,pan=0,rate=1,wet=.5,distant=false,kind='drip'}={}){if(!buf)return;options.log?.push({kind,at,now:c.currentTime});const s=c.createBufferSource(),g=c.createGain(),p=c.createStereoPanner(),w=c.createGain();
   s.buffer=buf;s.playbackRate.value=rate;g.gain.value=gain;p.pan.value=Math.max(-1,Math.min(1,pan));w.gain.value=wet;
   s.connect(g);g.connect(p);p.connect(distant?far:dry);p.connect(w);w.connect(send);s.onended=()=>{s.disconnect();g.disconnect();p.disconnect();w.disconnect();};s.start(at);}
  // Couches continues : air, souffle, filet d'eau. Elles ne tournent que sous terre.
  function layer(key,t){if(!S[key]||cave.loops[key])return;const s=c.createBufferSource(),g=c.createGain(),p=c.createStereoPanner(),w=c.createGain(),filter=key==='trickle'?null:c.createBiquadFilter();
   s.buffer=S[key];s.loop=true;p.pan.value=0;w.gain.value=key==='air'?.1:key==='draft'?.6:.45;g.gain.value=0;
   if(filter){filter.type=key==='air'?'highpass':'bandpass';filter.frequency.value=key==='air'?75:260;filter.Q.value=key==='air'?.7:4;s.connect(filter);filter.connect(g);}else s.connect(g);
   g.connect(p);p.connect(dry);p.connect(w);w.connect(send);s.start(t,r()*S[key].duration);const l=cave.loops[key]={s,g,p,w,filter};
   // L'air respire : un battement très lent de son niveau.
   if(key==='air'){const lfo=c.createOscillator(),depth=c.createGain();lfo.frequency.value=.055;depth.gain.value=.3*M.air;lfo.connect(depth);depth.connect(g.gain);lfo.start(t);l.lfo=lfo;l.depth=depth;}
   levels(t);}
  function levels(t){const P=cave.plan;if(!P)return;const L=cave.loops;
   L.air?.g.gain.setTargetAtTime(M.air,t,1.2);
   if(L.trickle){L.trickle.g.gain.setTargetAtTime(P.trickle?P.trickle.gain*M.trickle:0,t,.8);L.trickle.p.pan.setTargetAtTime(P.trickle?P.trickle.pan:0,t,.3);}
   if(L.draft&&!cave.draftAt)L.draft.g.gain.setTargetAtTime(.15*M.draft,t,2);}
  function start(t){cave.running=true;for(const key of ['air','trickle','draft'])layer(key,t);}
  function stop(){for(const l of Object.values(cave.loops)){try{l.s.stop();l.lfo?.stop();}catch{}for(const n of [l.s,l.g,l.p,l.w,l.filter,l.lfo,l.depth])n?.disconnect();}cave.loops={};cave.running=false;}
  function enter(id,t){const P=cave.plan=floorPlan(id);cave.floor=id;
   cave.leakAt=P.leaks.map(()=>t+.4+r()*P.leaks[0].period);cave.dripAt=t+r()*P.drip;cave.eventAt=t+6+r()*P.events*.6;cave.draftAt=0;
   send.gain.setTargetAtTime(P.wet,t,.5);levels(t);}
  // Programme les gouttes et les bruits lointains un peu en avance : une image lente ne casse pas le rythme d'une fuite.
  function update(t,{floor=null,level=0,duck=0}={}){
   if(!floor){if(cave.floor!==null){out.gain.setTargetAtTime(0,t,.35);cave.floor=null;cave.leftAt=t;}if(cave.running&&t-cave.leftAt>2.5)stop();return;}
   prepare(options.budget??4);
   if(!cave.running)start(t);
   if(floor!==cave.floor)enter(floor,t);
   const P=cave.plan,ahead=t+.6;out.gain.setTargetAtTime(level*(1-.45*duck),t,.5);
   if(!S.drops.length)return;
   P.leaks.forEach((leak,k)=>{if(cave.leakAt[k]<t-1)cave.leakAt[k]=t+.05;
    while(cave.leakAt[k]<ahead){shot(S.drops[leak.drop]||S.drops[0],cave.leakAt[k],{gain:leak.gain*M.leak*(.9+r()*.2),pan:leak.pan,rate:leak.rate*(.995+r()*.01),wet:P.wet,kind:'leak'+k});cave.leakAt[k]+=leak.period*(.96+r()*.08);}});
   if(cave.dripAt<t-1)cave.dripAt=t+.1;
   while(cave.dripAt<ahead){const d=r();shot(S.drops[Math.floor(r()*S.drops.length)],cave.dripAt,{gain:(.18+.42*(1-d))*M.drip,pan:(r()*2-1)*.85,rate:.92+r()*.16,wet:P.wet*(.6+.8*d),distant:d>.4});cave.dripAt+=P.drip*(.25-Math.log(1-r()*.95)*.75);}
   if(cave.eventAt<t-1)cave.eventAt=t+5;
   if(cave.eventAt<ahead){const W=P.weights,kinds=['chains','stone','creak','splash'].filter(k=>S[k].length),total=kinds.reduce((s,k)=>s+W[k],0);let x=r()*total,kind=kinds[kinds.length-1];
    for(const k of kinds)if((x-=W[k])<0){kind=k;break;}
    if(kind)shot(S[kind][Math.floor(r()*S[kind].length)],cave.eventAt,{gain:(kind==='stone'?.3:kind==='creak'?.32:.42)*M.events,pan:(r()*2-1)*.9,rate:.9+r()*.2,wet:1.3,distant:true,kind});
    cave.eventAt+=P.events*(.6+r()*.8);}
   const D=cave.loops.draft;if(D&&t>cave.draftAt){cave.draftAt=t+3+r()*5;D.filter.frequency.setTargetAtTime(170+r()*240,t,2.2);D.g.gain.setTargetAtTime((.1+r()*.16)*M.draft,t,2.5);}
  }
  return {update,prepare,get floor(){return cave.floor;},get running(){return cave.running;},get ready(){return !jobs.length;},get sounds(){return S;},get plan(){return cave.plan;}};
 }
 // Salle de pierre pour les bruitages : une réverbération courte et sombre, branchée en parallèle dès que la cave l'a fabriquée.
 function room(c,destination){const input=c.createGain(),verb=c.createConvolver(),ret=c.createGain();input.gain.value=0;
  input.connect(verb);verb.connect(ret);ret.connect(destination);let loaded=false;
  return {input,load(buffer){if(!loaded&&buffer){verb.buffer=buffer;loaded=true;}},set(v,t=c.currentTime){input.gain.setTargetAtTime(loaded?v:0,t,.3);}};}
 return {create,room,plan:floorPlan,MIX};
})();

// Sous terre, le ciel garde la trace de l'étage : l'ambiance sait qu'elle est dans un donjon, et lequel.
const dungeonSky=Game.prototype.sky;
Game.prototype.sky=function(){const s=dungeonSky.call(this);return this.dungeon?.active?{...s,dungeon:String(this.dungeon.floor||'donjon')}:s;};

// Musique : « Sous la pierre » dans tous les donjons, « Ils t'ont vu » tant qu'un gobelin voit le héros
// (et cinq secondes encore après), le thème de boss pendant le combat contre le chef.
const dungeonDirectorUpdate=MusicDirector.prototype.update;
MusicDirector.prototype.update=function(g,playing,dt){
 const mode=dungeonDirectorUpdate.call(this,g,playing,dt);
 if(!g.dungeon?.active){this.alert=0;return mode;}
 if(!mode)return mode;
 const d=g.dungeon,p=g.player;
 if(d.bossFight&&!d.bossDead){this.alert=0;return 'boss';}
 if(playing){const seen=g.enemies.some(e=>!e.dead&&!e.chief&&dist(e,p)<150&&g.lineClear(e,p));this.alert=seen?5:Math.max(0,(this.alert||0)-Math.min(.1,Math.max(0,dt)));}
 return this.alert>0?'dungeon_alert':'dungeon';
};

// Ambiance : sous terre, le vent, la faune et les grillons se taisent ; la cave prend leur place sur le bus
// environnement, et les bruitages du héros résonnent dans la pierre.
const CAVE_LEVEL=1,CAVE_ROOM=.24;
const outdoorAmbience=Sound.prototype.ambience;
Sound.prototype.ambience=function(o){
 const c=this.ctx,floor=o?.active&&o.sky?.dungeon;
 if(!floor||!c){this.caveLeave();return outdoorAmbience.call(this,o);}
 outdoorAmbience.call(this,{...o,active:false});
 if(!this.enabled||this.environmentVolume<=0||c.state!=='running'){this.caveLeave();return;}
 const now=c.currentTime;this.cave??=DungeonCave.create(c,this.environmentOutput());
 this.cave.update(now,{floor,level:AMB_VOLUME*CAVE_LEVEL,duck:o.battle?1:0});
 if(this.master){this.caveRoom??=DungeonCave.room(c,c.destination);this.caveRoom.load(this.cave.sounds.roomIR);
  if(!this.caveRoomLinked){this.master.connect(this.caveRoom.input);this.caveRoomLinked=true;}this.caveRoom.set(CAVE_ROOM,now);this.caveRoomOff=null;}
};
Sound.prototype.caveLeave=function(){const c=this.ctx;if(!c)return;const now=c.currentTime;
 if(this.cave?.floor||this.cave?.running)this.cave.update(now,{floor:null});
 if(this.caveRoomLinked){if(this.caveRoomOff==null){this.caveRoom.set(0,now);this.caveRoomOff=now;}else if(now-this.caveRoomOff>2){try{this.master.disconnect(this.caveRoom.input);}catch{}this.caveRoomLinked=false;this.caveRoomOff=null;}}
};
