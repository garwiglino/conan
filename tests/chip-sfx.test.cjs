'use strict';
const {test,before}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{RenderingAudioContext}=require('web-audio-engine'),{loadGame}=require('./game-harness.cjs');
const root=path.join(__dirname,'..');
const ChipSfx=new Function(fs.readFileSync(path.join(root,'scripts/chip-sfx.js'),'utf8').match(/^const ChipSfx=[\s\S]*?\n\}\)\(\);/m)[0]+';return ChipSfx;')();
const {families}=JSON.parse(fs.readFileSync(path.join(root,'audio/chip-sfx.json'),'utf8'));
const SR=48000,db=x=>20*Math.log10(x);
let a;before(async()=>{a=await loadGame();});

// Lecteur MIDI minimal : notes, pitch bend, CC et marqueurs, par piste.
function readMidi(buf){let p=0;const u32=()=>{const v=buf.readUInt32BE(p);p+=4;return v;},u16=()=>{const v=buf.readUInt16BE(p);p+=2;return v;};
 assert.equal(buf.toString('ascii',0,4),'MThd');p=8;const format=u16(),count=u16(),tpb=u16(),tracks=[];
 for(let k=0;k<count;k++){assert.equal(buf.toString('ascii',p,p+4),'MTrk');p+=4;const end=u32()+p,ev=[];let t=0,run=0;
  const vlq=()=>{let v=0,b;do{b=buf[p++];v=v<<7|b&127;}while(b&128);return v;};
  while(p<end){t+=vlq();let s=buf[p];if(s<128)s=run;else p++;
   if(s===255){const type=buf[p++],len=vlq();ev.push({t,meta:type,text:buf.toString('utf8',p,p+len),data:buf.subarray(p,p+len)});p+=len;continue;}
   run=s;const hi=s>>4,ch=s&15,d1=buf[p++],d2=hi===12||hi===13?0:buf[p++];ev.push({t,hi,ch,d1,d2});}
  tracks.push(ev);}
 return {format,tpb,tracks};}

test('every family is exported as a type-1 MIDI file whose four voice tracks replay the embedded score exactly',()=>{
 const names=Object.keys(families),files=fs.readdirSync(path.join(root,'audio/sfx')).filter(f=>f.endsWith('.mid'));
 assert.deepEqual(files.map(f=>f.slice(0,-4)).sort(),names.slice().sort());
 for(const name of names){const m=readMidi(fs.readFileSync(path.join(root,'audio/sfx',name+'.mid'))),f=families[name];
  assert.equal(m.format,1);assert.equal(m.tpb,480);assert.equal(m.tracks.length,5);
  assert.deepEqual(m.tracks.map(t=>t.find(e=>e.meta===3).text),[name,'Pulse 1','Pulse 2','Triangle','Noise']);
  const starts=m.tracks[0].filter(e=>e.meta===6).map(e=>e.t/16);assert.equal(starts.length,f.variants.length,name);
  ['p1','p2','tri','noise'].forEach((key,i)=>{const track=m.tracks[i+1],got=f.variants.map(v=>new Array(v.len).fill(null));let bend=8192,cc={},on=null;
   assert.ok(track.some(e=>e.hi===11&&e.d1===6&&e.d2===2),'bend range set');
   for(const e of track){if(e.hi===14)bend=e.d1|e.d2<<7;if(e.hi===11)cc[e.d1]=e.d2;
    if(e.hi===9&&e.d2>0)on={t:e.t,note:e.d1,vel:e.d2,bend,duty:cc[12],mode:cc[13]};
    if(e.hi===8||e.hi===9&&e.d2===0){assert.equal(e.d1,on.note);const k=starts.findLastIndex(s=>s*16<=on.t),f0=on.t/16-starts[k];
     const value=key==='noise'?[75-on.note,(on.vel-7)/8,on.mode?1:0]:key==='tri'?[Math.round((on.note+(on.bend-8192)/4096)*100)/100]:[Math.round((on.note+(on.bend-8192)/4096)*100)/100,(on.vel-7)/8,on.duty];
     for(let fr=f0;fr<f0+(e.t-on.t)/16;fr++)got[k][fr]=value;on=null;}}
   f.variants.forEach((v,k)=>assert.deepEqual(got[k],ChipSfx.unfold(v,key),name+' '+key+' variant '+(k+1)));});}
});

test('the scores stay inside the chip: 4-bit volumes, four duty cycles, sixteen noise pitches, playable periods',()=>{
 for(const [name,f]of Object.entries(families))for(const v of f.variants){assert.ok(v.len>0&&v.len<=120,name);
  for(const key of ['p1','p2','tri','noise'])for(const e of ChipSfx.unfold(v,key)){if(!e)continue;
   if(key==='noise'){assert.ok(Number.isInteger(e[0])&&e[0]>=0&&e[0]<=15&&[0,1].includes(e[2]),name);}
   else if(key==='tri')assert.ok(ChipSfx.triHz(e[0])>0,name+' triangle in range');
   else{assert.ok([0,1,2,3].includes(e[2]),name);assert.ok(ChipSfx.pulseHz(e[0])>0,name+' pulse in range');}
   if(key!=='tri')assert.ok(Number.isInteger(e[1])&&e[1]>=1&&e[1]<=15,name+' 4-bit volume');}}
});

test('the JSON is the compiled catalogue and every variant meets its family level',()=>{
 const built=require('../scripts/chip-sfx-scores.cjs').build();assert.deepEqual(Object.keys(built),Object.keys(families));
 for(const [name,f]of Object.entries(families)){assert.equal(built[name].level,f.level);
  f.variants.forEach((v,k)=>{const {gain,...score}=v;assert.deepEqual(score,built[name].variants[k],name);
   const level=db(ChipSfx.loudness(ChipSfx.render(v,SR),SR)*gain*.3);assert.ok(Math.abs(level-f.level)<.1,name+' '+level.toFixed(2));});}
});

// Spectre d'un rendu : part d'énergie sous 200 Hz et centre de gravité.
function spectrum(d){const N=1024;let E=0,C=0,low=0;
 for(let f=0;f<d.length;f+=N/2){const re=new Float64Array(N),im=new Float64Array(N);for(let i=0;i<N;i++)re[i]=(d[f+i]||0)*(.5-.5*Math.cos(2*Math.PI*i/N));
  for(let i=1,j=0;i<N;i++){let b=N>>1;for(;j&b;b>>=1)j^=b;j^=b;if(i<j)[re[i],re[j]]=[re[j],re[i]];}
  for(let len=2;len<=N;len<<=1){const w=-2*Math.PI/len;for(let i=0;i<N;i+=len)for(let j=0;j<len/2;j++){const cr=Math.cos(w*j),ci=Math.sin(w*j),p=i+j,q=p+len/2,vr=re[q]*cr-im[q]*ci,vi=re[q]*ci+im[q]*cr;re[q]=re[p]-vr;im[q]=im[p]-vi;re[p]+=vr;im[p]+=vi;}}
  for(let k=1;k<N/2;k++){const e=re[k]*re[k]+im[k]*im[k],hz=k*SR/N;E+=e;C+=e*hz;if(hz<200)low+=e;}}
 return {low:low/E,centroid:C/E};}

test('weapon impacts hit at once, sit in the mids and highs, and stand well above the swings; the dagger snaps brightest',()=>{
 const centroid={};
 for(const cls of ['blade','dagger','heavy','pole'])for(const big of ['','_big']){const name='hit_'+cls+big,f=families[name];
  for(const v of f.variants){const d=ChipSfx.render(v,SR),w=SR*.005,env=[];let peak=0;for(let i=0;i+w<=d.length;i+=w/5){let e=0;for(let j=i;j<i+w;j++)e+=d[j]*d[j];env.push(e);}d.forEach(x=>{peak=Math.max(peak,Math.abs(x));});
   const top=Math.max(...env),at=env.findIndex(e=>e>=top*.5)*w/5/SR;assert.ok(at<.004,name+' attack '+(at*1000).toFixed(1)+' ms');let end=0;d.forEach((x,i)=>{if(Math.abs(x)>peak*.03)end=i;});assert.ok(end/SR<.35,name+' stays short');
   const s=spectrum(d);assert.ok(s.low<.1,name+' low share '+s.low.toFixed(3));assert.ok(s.centroid>2000,name+' centroid '+s.centroid);if(!big)centroid[cls]=Math.max(centroid[cls]||0,s.centroid);}
  assert.ok(f.level>=families['swing_'+cls+big].level+5,name+' above its swing');}
 assert.ok(centroid.dagger>Math.max(centroid.blade,centroid.heavy,centroid.pole),'dagger brightest');
 assert.ok(families.hit_dagger.level>=families.hit_heavy.level,'small weapons hit as hard');
});

// Une lame qui tranche, pas une gifle (demande de Lino, 23 octobre) : le fil métallique (impulsion fine aiguë qui
// tient), le grain de métal (bruit court juste après le contact), la chair (impulsion carrée), et un corps qui dure.
test('weapon impacts are bloody metallic slashes: a ringing edge, a metal grain, a wet body, not a single slap',()=>{
 for(const name of Object.keys(families).filter(n=>/^hit_/.test(n)))families[name].variants.forEach((v,k)=>{const id=name+'#'+k,P1=ChipSfx.unfold(v,'p1'),P2=ChipSfx.unfold(v,'p2'),N=ChipSfx.unfold(v,'noise');
  assert.ok(P1.filter(e=>e&&e[2]===0&&e[0]>=80).length>=6,id+' edge rings');
  assert.ok(N.slice(1,4).some(e=>e&&e[2]===1),id+' metal grain');
  assert.ok(P2.filter(e=>e&&e[2]===2).length>=5&&N.slice(3).filter(e=>e&&e[2]===0).length>=4,id+' wet body');
  const d=ChipSfx.render(v,SR),w=SR*.01,e=[];for(let i=0;i+w<=d.length;i+=w){let s=0;for(let j=i;j<i+w;j++)s+=d[j]*d[j];e.push(s);}
  const top=Math.max(...e);assert.ok(e.filter(x=>x>=top*.1).length*10>=85,id+' body lasts');});
});

// Tous les événements sonores du jeu, avec leurs variantes de charge utile.
const EVENTS=[['hit',{}],['hit',{heavy:true}],['kill',{}],['crack',{mat:'wood'}],['crack',{mat:'barrel'}],['crack',{mat:'clay'}],['break',{mat:'wood'}],['break',{mat:'barrel'}],['break',{mat:'clay'}],
 ['hurt',{big:false}],['hurt',{big:true}],['lifelost',{}],['dead',{}],['parry',{}],['block',{}],['dodge',{}],['loot',{}],['flask',{}],['heal',{}],['seal',{}],['bodyfall',{}],['dissolve',{}],['levelup',{}],['stele',{}],['respawn',{}],['win',{}],
 ['questnew',{}],['questaccept',{}],['questdone',{}],['chest',{}],['door',{open:true}],['door',{open:false}],['lever',{}],
 ...['block','charge_hit','charge_wind','eruption_hit','eruption_wind','fan_hit','fan_wind','nova_hit','nova_wind','slash_hit','slash_wind','stun','transform'].map(cue=>['bosscue',{cue}]),
 ['voice',{who:'ELYNE',ch:3}],['voice',{who:'LE VEILLEUR',ch:1}],['voice',{who:'LE PRÊTRE DU SERPENT',ch:2}],
 ['foe',{kind:'bolt'}],['foe',{kind:'cultist',act:'melee'}],['foe',{kind:'cultist',act:'wind'}],['foe',{kind:'cultist',act:'bolt'}],['foe',{kind:'snake'}],['foe',{kind:'guardian'}],['foe',{kind:'skeleton'}]];

test('every game sound event plays an existing 8-bit family, every family is reachable, weapons pick their class',()=>{
 const s=new a.Sound(),heard=[];Object.assign(s,{enabled:true,sfxOn:true,ctx:{currentTime:0},master:{}});s.chip=(n,o)=>{heard.push(n);return {stop(){}};};
 const W=a.HearthreaverWeapons,ids=[...new Set(['sword','sabre','dagger','axe','mace','spear','staff','glaive'].map(fam=>W.all.find(w=>w.family===fam)?.id).filter(Boolean))];
 for(const id of ids)for(const combo of [0,3]){s.fx('sword',{combo,weapon:id});s.fx('hit',{heavy:combo===3});}
 const used=new Set(heard);assert.equal(ids.length,8,'one weapon per family');
 for(const cls of ['blade','dagger','heavy','pole'])for(const n of ['swing_'+cls,'swing_'+cls+'_big','hit_'+cls,'hit_'+cls+'_big'])assert.ok(used.has(n),n);
 for(const [type,ev]of EVENTS){heard.length=0;s.fx(type,ev);assert.ok(heard.length>0,type+' '+JSON.stringify(ev));for(const n of heard){assert.ok(families[n],n);used.add(n);}}
 const watcher=['dungeon-sfx.js','dungeon-runtime.js'].map(f=>fs.readFileSync(path.join(root,'scripts',f),'utf8')).join('\n');
 for(const n of Object.keys(families))assert.ok(used.has(n)||n.startsWith('foot_')||watcher.includes("'"+n+"'")||/^(gob|chief)_(die|fall|hurt|effort)$/.test(n)&&watcher.includes("who+'_"+n.split('_')[1]+"'"),n+' is reachable');
 // Les signaux d'interface, le tonnerre et le glas du gardien gardent leur propre moteur.
 heard.length=0;let cues=0;s.music={cue:()=>cues++};s.fx('ui_select');s.fx('guardianfall');assert.equal(heard.length,0);assert.equal(cues,2);
});

test('the bank renders in background slices at the context rate, never repeats a variant twice in a row and caps its voices',()=>{
 const c=new RenderingAudioContext({sampleRate:16000}),s=new a.Sound();s.ctx=c;s.enabled=true;s.master=c.createGain();s.master.connect(c.destination);
 let slices=0;while(!s.chipWarm(2))slices++;assert.ok(slices>3,'spread over frames');
 const total=Object.values(families).reduce((n,f)=>n+f.variants.length,0);assert.equal(s.chipBuffers.size,total);
 const b=s.chipBuffer('hit_dagger',0);assert.equal(b.sampleRate,16000);assert.equal(s.chipBuffer('hit_dagger',0),b);
 let last=null;for(let i=0;i<20;i++){s.chip('hit_blade');const k=s.chipLast.hit_blade;assert.notEqual(k,last);last=k;}
 for(let i=0;i<40;i++)s.chip('win');assert.equal(s.chipVoices.length,24);
 s.sfxOn=false;assert.equal(s.chip('parry'),null);
});
