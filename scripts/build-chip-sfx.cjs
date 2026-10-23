'use strict';
// Bruitages 8 bits : partitions (scripts/chip-sfx-scores.cjs) → audio/chip-sfx.json (lu par le jeu) et un MIDI type 1
// par famille dans audio/sfx/ (pistes Pulse 1, Pulse 2, Triangle, Noise ; une variante par mesure, repérée par un marqueur).
// Le gain de chaque variante est réglé ici pour que sa crête sur 50 ms atteigne le niveau de sa famille, bus compris.
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),dir=path.join(root,'audio/sfx');
const {build}=require('./chip-sfx-scores.cjs');
const ChipSfx=new Function(fs.readFileSync(path.join(__dirname,'chip-sfx.js'),'utf8').match(/^const ChipSfx=[\s\S]*?\n\}\)\(\);/m)[0]+';return ChipSfx;')();
const SFX_VOLUME=.3,SR=48000,TPB=480,FRAME=16;// 120 bpm : une noire = 30 images = 480 tics

// Correspondance MIDI (aussi relue par tests/chip-sfx.test.cjs) :
// canal 0 Pulse 1, 1 Pulse 2, 2 Triangle, 3 Noise ; vélocité = volume × 8 + 7 (triangle : 127, il n'a pas de volume) ;
// hauteur fractionnaire en pitch bend (plage ±2 demi-tons, RPN 0) ; rapport cyclique en CC12 (0 à 3) ;
// bruit : note 75 − hauteur (0 à 15), mode court en CC13 (127) ou long (0).
const CH={p1:0,p2:1,tri:2,noise:3},NAMES={p1:'Pulse 1',p2:'Pulse 2',tri:'Triangle',noise:'Noise'},PROGRAM={p1:80,p2:80,tri:38,noise:118};
const vlq=n=>{const b=[n&127];while(n>>=7)b.unshift((n&127)|128);return Buffer.from(b);};
const chunk=(id,data)=>{const n=Buffer.alloc(4);n.writeUInt32BE(data.length);return Buffer.concat([Buffer.from(id),n,data]);};
const meta=(type,text)=>Buffer.concat([Buffer.from([255,type]),vlq(Buffer.byteLength(text)),Buffer.from(text)]);
function track(events,end){events.sort((a,b)=>a.t-b.t||a.o-b.o);let last=0;const out=[];for(const e of events){out.push(vlq(e.t-last),e.b);last=e.t;}out.push(vlq(Math.max(0,end-last)),Buffer.from([255,47,0]));return chunk('MTrk',Buffer.concat(out));}
// Début de chaque variante : sur un temps, au moins un temps après la fin de la précédente.
const starts=variants=>{let at=0;return variants.map(v=>{const s=at;at+=Math.ceil((v.len+15)/30)*30;return s;});};
function midi(name,family){const S=starts(family.variants),last=S.at(-1)+family.variants.at(-1).len,end=Math.ceil((last+1)/30)*30*FRAME;
 const conductor=[{t:0,o:0,b:meta(3,name)},{t:0,o:1,b:Buffer.from([255,81,3,7,161,32])},{t:0,o:2,b:Buffer.from([255,88,4,4,2,24,8])}];
 family.variants.forEach((v,k)=>conductor.push({t:S[k]*FRAME,o:3,b:meta(6,'variante '+(k+1))}));
 const tracks=[track(conductor,end)];
 for(const key of ['p1','p2','tri','noise']){const c=CH[key],ev=[{t:0,o:0,b:meta(3,NAMES[key])},{t:0,o:1,b:Buffer.from([192|c,PROGRAM[key]])},
   ...[[101,0],[100,0],[6,2],[38,0],[7,100]].map(([cc,v])=>({t:0,o:1,b:Buffer.from([176|c,cc,v])}))];
  let duty=-1,bend=8192,mode=-1;
  family.variants.forEach((v,k)=>{const e=v[key]||[],st=ChipSfx.STRIDE[key];
   for(let i=0;i<e.length;i+=st){const [f,len,a,b,x]=e.slice(i,i+st),t=(S[k]+f)*FRAME,off=t+len*FRAME;
    let note,vel;
    if(key==='noise'){note=75-a;vel=b*8+7;if(x!==mode){mode=x;ev.push({t,o:2,b:Buffer.from([176|c,13,x?127:0])});}}
    else{note=Math.round(a);vel=key==='tri'?127:b*8+7;const w=Math.round((a-note)*4096)+8192;if(w!==bend){bend=w;ev.push({t,o:3,b:Buffer.from([224|c,w&127,w>>7])});}
     if(key!=='tri'&&x!==duty){duty=x;ev.push({t,o:2,b:Buffer.from([176|c,12,x])});}}
    ev.push({t,o:4,b:Buffer.from([144|c,note,vel])},{t:off,o:1,b:Buffer.from([128|c,note,0])});}});
  tracks.push(track(ev,end));}
 const h=Buffer.alloc(6);h.writeUInt16BE(1,0);h.writeUInt16BE(tracks.length,2);h.writeUInt16BE(TPB,4);
 return Buffer.concat([chunk('MThd',h),...tracks]);}

const families=build();
for(const f of Object.values(families))for(const v of f.variants){const d=ChipSfx.render(v,SR),rms=ChipSfx.loudness(d,SR);
 v.gain=+(10**(f.level/20)/SFX_VOLUME/Math.max(rms,1e-6)).toFixed(4);}
fs.mkdirSync(dir,{recursive:true});
for(const old of fs.readdirSync(dir))if(old.endsWith('.mid')&&!families[old.slice(0,-4)])fs.unlinkSync(path.join(dir,old));
for(const [name,f]of Object.entries(families))fs.writeFileSync(path.join(dir,name+'.mid'),midi(name,f));
fs.writeFileSync(path.join(root,'audio/chip-sfx.json'),JSON.stringify({frameRate:60,families},null,1)+'\n');
const count=Object.values(families).reduce((n,f)=>n+f.variants.length,0);
console.log('Built '+Object.keys(families).length+' 8-bit SFX families ('+count+' variants), their MIDI files and audio/chip-sfx.json.');
module.exports={starts};
