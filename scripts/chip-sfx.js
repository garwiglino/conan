// Bruitages 8 bits : chaque bruitage du jeu est une petite partition pour une puce façon NES (deux voix d'impulsion
// à rapport cyclique 12,5/25/50/75 %, un triangle 4 bits, un bruit LFSR à 16 hauteurs, long ou court), écrite image
// par image (60 par seconde) dans scripts/chip-sfx-scores.cjs, exportée en MIDI type 1 (une piste par voix) et rendue
// ici par une émulation simple de la puce : périodes entières du processeur, volumes sur 4 bits, mélangeur non
// linéaire et filtres de sortie de la console (passe-haut 90 et 440 Hz, passe-bas 14 kHz).
const ChipSfx=(()=>{
 const CPU=1789773,NOISE=[4,8,16,32,64,96,128,160,202,254,380,508,762,1016,2034,4068];
 const DUTY=[[0,1,0,0,0,0,0,0],[0,1,1,0,0,0,0,0],[0,1,1,1,1,0,0,0],[1,0,0,1,1,1,1,1]];
 const TRI=Array.from({length:32},(_,i)=>i<16?15-i:i-16);
 const hz=note=>440*2**((note-69)/12);
 // Hauteur réelle de la puce : période entière, voix muette hors de sa plage (comme la console).
 const pulseHz=note=>{const P=Math.round(CPU/(16*hz(note))-1);return P<8||P>2047?0:CPU/(16*(P+1));};
 const triHz=note=>{const P=Math.round(CPU/(32*hz(note))-1);return P<2||P>2047?0:CPU/(32*(P+1));};
 // Pistes : événements à pas fixe [image, durée, valeurs…] ; on les déplie image par image.
 const STRIDE={p1:5,p2:5,tri:3,noise:5};
 function unfold(score,key){const ev=score[key]||[],k=STRIDE[key],out=new Array(score.len).fill(null);
  for(let i=0;i<ev.length;i+=k)for(let f=ev[i];f<ev[i]+ev[i+1]&&f<score.len;f++)out[f]=ev.slice(i+2,i+k);return out;}
 // Rendu suréchantillonné ×4 puis moyenné : les créneaux restent nets sans repliement criard.
 // Une boucle est jouée deux fois et l'on garde le second tour (filtres établis, raccord sans clic).
 // Le calcul rend la main tous les 2048 échantillons : le jeu fabrique sa banque par tranches, sans à-coup.
 function* job(score,sr=48000,os=4){const loop=!!score.loop,F=score.len*(loop?2:1),n=loop?2*Math.round(score.len/60*sr):Math.ceil((F/60+.04)*sr),out=new Float32Array(n),dt=1/(sr*os);
  const two=key=>{const a=unfold(score,key);return loop?a.concat(a):a;},P1=two('p1'),P2=two('p2'),T=two('tri'),N=two('noise');
  const pulse=P=>P.map(e=>e&&e[1]>0?{f:pulseHz(e[0]),v:e[1],d:DUTY[e[2]|0]}:null),tri=T.map(e=>e?triHz(e[0]):0),noise=N.map(e=>e&&e[1]>0?{r:CPU/NOISE[e[0]],v:e[1],m:e[2]?6:1}:null);
  const A=pulse(P1),B=pulse(P2);let pa=0,pb=0,pt=0,acc=0,lfsr=1,triOut=0;
  // L'état des voix change à chaque image : on le relit une fois par échantillon de sortie, pas à chaque sous-pas.
  for(let i=0;i<n;i++){const f=Math.floor(i*60/sr),a=f<F?A[f]:null,b=f<F?B[f]:null,z=f<F?noise[f]:null,af=a&&a.f?a.f*dt:0,bf=b&&b.f?b.f*dt:0,tf=f<F?tri[f]*dt:0,zr=z?z.r*dt:0;let s=0;
   for(let o=0;o<os;o++){let p=0;if(af){pa+=af;if(pa>=1)pa-=1;p+=a.d[(pa*8)|0]*a.v;}if(bf){pb+=bf;if(pb>=1)pb-=1;p+=b.d[(pb*8)|0]*b.v;}
    // Le triangle s'arrête sur sa marche quand il se tait : pas de clic.
    if(tf){pt+=tf;if(pt>=1)pt-=1;triOut=TRI[(pt*32)|0];}
    let nz=0;if(zr){acc+=zr;while(acc>=1){acc-=1;const fb=(lfsr^(lfsr>>z.m))&1;lfsr=(lfsr>>1)|(fb<<14);}nz=lfsr&1?0:z.v;}
    const tnd=triOut/8227+nz/12241;s+=(p?95.88/(8128/p+100):0)+(tnd?159.79/(1/tnd+100):0);}
   out[i]=s/os;if((i&2047)===2047)yield;}
  // Sortie de la console : deux passe-haut (90 et 440 Hz) et un passe-bas (14 kHz), du premier ordre.
  const hp=f=>{const rc=1/(2*Math.PI*f),a=rc/(rc+1/sr);let x1=0,y=0;for(let i=0;i<n;i++){const x=out[i];y=a*(y+x-x1);x1=x;out[i]=y;}};
  hp(90);hp(440);const rc=1/(2*Math.PI*14000),k=(1/sr)/(rc+1/sr);let y=0;for(let i=0;i<n;i++){y+=(out[i]-y)*k;out[i]=y;}
  if(loop)return out.slice(n/2);
  // Fin du tampon adoucie (le passe-haut laisse une petite traîne).
  const fade=Math.floor(sr*.01);for(let i=0;i<fade;i++)out[n-1-i]*=i/fade;
  return out;}
 function render(score,sr,os){const g=job(score,sr,os);let r;while(!(r=g.next()).done);return r.value;}
 // Crête de la moyenne quadratique sur 50 ms : la mesure qui règle le niveau de chaque bruitage.
 function loudness(d,sr){const w=Math.max(1,Math.floor(sr*.05));let sum=0,best=0;for(let i=0;i<d.length;i++){sum+=d[i]*d[i];if(i>=w)sum-=d[i-w]*d[i-w];if(i>=w-1||i===d.length-1)best=Math.max(best,sum/Math.min(w,i+1));}return Math.sqrt(Math.max(0,best));}
 return {CPU,NOISE,DUTY,STRIDE,hz,pulseHz,triHz,unfold,job,render,loudness};
})();

// ---- Branchement dans le jeu. Les partitions (CHIP_SFX_DATA, audio/chip-sfx.json) sont rendues une fois à la fréquence
// du contexte audio, en tâche de fond pendant les menus (armes et combat d'abord), puis jouées sur le bus des bruitages.
// Plus aucun échantillon : tout bruitage d'action, de monde, de donjon et de pas sort de la puce. Restent à part les
// ambiances (vent, pluie, tonnerre, cave), les signaux d'interface et le glas du gardien (déjà des partitions MIDI).
const CHIP_CLASS={sword:'blade',sabre:'blade',dagger:'dagger',axe:'heavy',mace:'heavy',spear:'pole',staff:'pole',glaive:'pole'};
// Avance de l'élan sur l'instant du coup : la pointe du souffle tombe juste avant le contact.
const CHIP_LEAD={blade:.05,dagger:.035,heavy:.11,pole:.05,blade_big:.1,dagger_big:.035,heavy_big:.13,pole_big:.095};
const CHIP_PROP={wood:'crate',barrel:'barrel',clay:'jar'};
const CHIP_ORDER=Object.keys(CHIP_SFX_DATA.families).map((n,i)=>[n,i]).sort((a,b)=>(/^(swing|hit|kill|parry|block|hurt|dodge|foot)/.test(a[0])?0:1)-(/^(swing|hit|kill|parry|block|hurt|dodge|foot)/.test(b[0])?0:1)||a[1]-b[1]).map(([n])=>n);
Sound.prototype.chipStore=function(key,v,d){const c=this.ctx,b=c.createBuffer(1,d.length,c.sampleRate),o=b.getChannelData(0);for(let i=0;i<d.length;i++)o[i]=d[i]*v.gain;this.chipBuffers.set(key,b);return b;};
Sound.prototype.chipBuffer=function(name,k=0){const v=CHIP_SFX_DATA.families[name]?.variants[k];if(!v||!this.ctx)return null;
 this.chipBuffers??=new Map();const key=name+':'+k;return this.chipBuffers.get(key)||this.chipStore(key,v,ChipSfx.render(v,this.ctx.sampleRate));};
// Fabrication par petites tranches (ms par image) : vrai quand toute la banque est prête.
Sound.prototype.chipWarm=function(ms=1.5){if(!this.ctx)return false;this.chipBuffers??=new Map();this.chipQueue??=CHIP_ORDER.flatMap(n=>CHIP_SFX_DATA.families[n].variants.map((_,k)=>[n,k]));
 const clock=()=>typeof performance!=='undefined'?performance.now():Date.now(),end=clock()+ms;
 while(this.chipQueue.length&&clock()<end){const [n,k]=this.chipQueue[0],key=n+':'+k,v=CHIP_SFX_DATA.families[n].variants[k];
  if(this.chipBuffers.has(key)){this.chipQueue.shift();this.chipJob=null;continue;}
  if(this.chipJob?.key!==key)this.chipJob={key,gen:ChipSfx.job(v,this.ctx.sampleRate)};
  const step=this.chipJob.gen.next();if(step.done){this.chipStore(key,v,step.value);this.chipQueue.shift();this.chipJob=null;}}
 return !this.chipQueue.length;};
// Une variante au hasard (jamais deux fois la même de suite), sauf si l'appel la choisit.
Sound.prototype.chip=function(name,{vol=1,pan=0,delay=0,variant}={}){const f=CHIP_SFX_DATA.families[name];
 if(!f||!this.enabled||!this.sfxOn||!this.ctx||!this.master||!(vol>0))return null;
 const c=this.ctx,now=c.currentTime;this.chipVoices=(this.chipVoices||[]).filter(v=>v.end>now);if(this.chipVoices.length>=24)return null;
 this.chipLast??={};let k=Number.isInteger(variant)?variant%f.variants.length:Math.floor(Math.random()*f.variants.length);
 if(!Number.isInteger(variant)&&f.variants.length>1&&k===this.chipLast[name])k=(k+1)%f.variants.length;this.chipLast[name]=k;
 const buf=this.chipBuffer(name,k),src=c.createBufferSource(),g=c.createGain();src.buffer=buf;g.gain.value=vol;src.connect(g);let out=g;
 if(pan){const p=c.createStereoPanner();p.pan.value=clamp(pan,-.85,.85);g.connect(p);out=p;}out.connect(this.master);
 const t=now+Math.max(0,delay);src.onended=()=>{src.disconnect();g.disconnect();if(out!==g)out.disconnect();};src.start(t);this.chipVoices.push({end:t+buf.duration,src});return src;};
// Bruitage placé : sous terre, distance et panoramique suivent la position (voir dungeonPlay).
Sound.prototype.chipAt=function(name,ev={}){return this.dwatch&&Number.isFinite(ev.x)&&Number.isFinite(ev.y)?this.dungeonPlay(name,ev):this.chip(name,ev);};
Sound.prototype.weaponClass=function(id){return CHIP_CLASS[HearthreaverWeapons.get(id)?.family]||'blade';};
// Voix des dialogues : un bip 8 bits par lettre, cinq hauteurs selon la lettre, timbre selon le personnage.
const CHIP_VOICE={'LE VEILLEUR':'voice_watcher','LE PRÊTRE DU SERPENT':'voice_priest'};
const chipFx=Sound.prototype.fx;
Sound.prototype.fx=function(name,ev={}){
 if(name==='thunder'||name==='guardianfall'||name.startsWith('ui_'))return chipFx.call(this,name,ev);
 if(!this.enabled||!this.sfxOn||!this.ctx)return;
 const play=(n,o)=>this.chip(n,o);
 switch(name){
  case 'sword':{const c=ev.combo??0,cls=this.weaponClass(ev.weapon),big=c===3,t=HearthreaverWeapons.times(ev.weapon,c,COMBO_TIMES);this.chipWeapon=cls;
   play('swing_'+cls+(big?'_big':''),{delay:Math.max(0,t[0]+t[1]-CHIP_LEAD[cls+(big?'_big':'')])});return;}
  case 'hit':{const cls=this.chipWeapon||'blade';this.lastHit={src:play('hit_'+cls+(ev.heavy?'_big':'')),t:this.ctx.currentTime};return;}
  case 'kill':{const cls=this.chipWeapon||'blade';if(this.lastHit&&this.ctx.currentTime-this.lastHit.t<.06){try{this.lastHit.src?.stop();}catch{}}play('hit_'+cls+'_big');play('kill');return;}
  case 'crack':this.chipAt((CHIP_PROP[ev.mat]||'crate')+'_hit',ev);return;
  case 'break':this.chipAt((CHIP_PROP[ev.mat]||'crate')+'_break',ev);return;
  case 'hurt':play(ev.big?'hurt_big':'hurt');return;
  case 'dead':case 'lifelost':play('life_lost');return;
  case 'parry':case 'block':case 'dodge':case 'loot':case 'flask':case 'seal':case 'bodyfall':case 'dissolve':case 'levelup':case 'stele':case 'respawn':case 'win':
  case 'questnew':case 'questaccept':case 'questdone':play(name);return;
  case 'heal':play('flask');return;
  case 'chest':play('chest_open');return;
  case 'door':play(ev.open?'door_open':'door_close');return;
  // Sous terre, le guetteur du donjon joue déjà le levier au changement d'état.
  case 'lever':if(!this.dwatch)play('lever');return;
  case 'bosscue':play('boss_'+ev.cue);return;
  case 'voice':{const n=CHIP_VOICE[ev.who]||'voice';play(n,{variant:((ev.ch|0)*7)%5});return;}
  case 'foe':{const vol=ev.vol??1;
   if(ev.kind==='bolt')play('bolt_hit',{vol});else if(ev.kind==='cultist')play(ev.act==='melee'?'foe_slash':ev.act==='wind'?'foe_cast':'foe_bolt',{vol});
   else if(ev.kind==='snake')play('snake_bite',{vol});else play(ev.kind==='guardian'?'foe_heavy':'foe_slash',{vol});return;}
 }};
// Pas : la matière choisit sa famille 8 bits ; le niveau est porté par la partition (gain 1 pour Kaldor à pleine voix).
Sound.prototype.footBuffer=function(material,variant){return this.chipBuffer('foot_'+(FOOT_MATERIALS[material]?material:'earth'),variant%3);};
Sound.prototype.footstep=function(material,{gain=1,pan=0,variant=0}={}){
 if(!this.enabled||!this.sfxOn||!this.ctx||!this.master||this.sfxVolume===0||this.travelQuiet)return;
 const c=this.ctx,now=c.currentTime;this.footVoices=(this.footVoices||[]).filter(v=>v.end>now);if(this.footVoices.length>=8)return;
 const src=c.createBufferSource(),g=c.createGain(),p=c.createStereoPanner();src.buffer=this.footBuffer(material,variant%3);g.gain.value=Math.min(1,gain);p.pan.value=clamp(pan,-.8,.8);src.connect(g);g.connect(p);p.connect(this.master);
 const voice={end:now+src.buffer.duration,src,g,p};this.footVoices.push(voice);src.onended=()=>{src.disconnect();g.disconnect();p.disconnect();};src.start(now);};
const chipTick=Sound.prototype.tick;
Sound.prototype.tick=function(...args){if(this.ctx&&this.enabled&&this.sfxOn&&!this.chipReady)this.chipReady=this.chipWarm(1.5);return chipTick.apply(this,args);};
