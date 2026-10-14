// Original theme: "The Ember Crown". D minor, 112 BPM, 48 bars / 102.86 seconds.
// Brass anthem, ascending string ostinati, wide choirs and low martial percussion.
// Type-1 MIDI: conductor + 12 separate instrumental tracks. Score is identical in game.
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),dir=path.join(root,'audio');
const bpm=112,tpb=480,bars=48,tracks={lead:[],harm:[],arp:[],saw:[],bass:[],horn:[],choir:[],timpani:[],drums:[],brass:[],strings:[],bells:[]};
const add=(tr,beat,len,n,v)=>tracks[tr].push([Math.round(beat*tpb),Math.round(len*tpb),n,Math.max(1,Math.min(127,v))]);
const chords={D:{bass:38,notes:[50,57,62,65],pad:[57,62,65]},B:{bass:34,notes:[46,53,58,62],pad:[58,62,65]},F:{bass:41,notes:[53,60,65,69],pad:[57,60,65]},C:{bass:36,notes:[48,55,60,64],pad:[55,60,64]},G:{bass:31,notes:[43,50,55,58],pad:[55,58,62]},A:{bass:33,notes:[45,52,57,61],pad:[57,61,64]}};
const progression=[
 'D','D','B','A', // call from the canyon
 'D','B','F','C','G','B','A','A', // first melody, with space
 'D','C','B','A','D','G','B','A', // martial answer
 'B','F','C','D','G','B','A','A', // choir bridge
 'D','B','F','C','G','B','A','A', // full reprise
 'D','C','B','A','G','B','A','D', // culmination and resolution
 'B','G','A','A' // low turn-around into D; no hard cut
];
// Each phrase is a composed four-bar sentence; duration includes breathing room.
const phraseA=[
 [0,1.4,74],[1.5,.42,76],[2, .9,77],[3,.85,81],
 [4,1.4,79],[5.5,.42,77],[6,1.4,74],
 [8,.9,77],[9,.9,81],[10,.9,84],[11,.85,81],
 [12,1.9,79],[14,.9,76],[15,.5,72]
];
const phraseB=[
 [0,.9,74],[1,.4,77],[1.5,.4,79],[2,1.4,82],
 [4,1.4,81],[5.5,.4,77],[6,1.4,74],
 [8,.9,73],[9,.9,76],[10,1.4,81],[11.5,.4,79],
 [12,1.9,76],[14,1.4,73]
];
const phraseC=[
 [0,.65,74],[.75,.2,74],[1,.9,77],[2,.9,81],[3,.65,77],
 [4,1.4,79],[5.5,.4,76],[6,.9,72],[7,.7,74],
 [8,.9,77],[9,.9,74],[10,1.4,70],
 [12,.9,73],[13,.9,76],[14,1.4,81]
];
const phraseD=[
 [0,1.4,81],[1.5,.4,79],[2,.9,77],[3,.8,74],
 [4,.9,79],[5,.9,77],[6,1.4,74],
 [8,.9,77],[9,.9,82],[10,.9,81],[11,.7,77],
 [12,.9,76],[13,.9,73],[14,1.4,69]
];
function phrase(start,list,vel=80,octave=0){for(const [b,d,n]of list){add('lead',start*4+b,d,n+octave,vel+(b%4===0?4:0));}}
phrase(4,phraseA,74);phrase(8,phraseB,76);phrase(12,phraseC,84);phrase(16,phraseD,82);
phrase(28,phraseA,89);phrase(32,phraseB,91);phrase(36,phraseC,93);
// Last answer lands on the tonic rather than chaining an endless dominant fanfare.
phrase(40,[[0,1.4,79],[1.5,.4,77],[2,.9,74],[3,.7,70],[4,1.4,77],[5.5,.4,74],[6,1.4,70],[8,.9,73],[9,.9,76],[10,.9,81],[11,.8,73],[12,3.1,74]],88);
// Horn call in the opening, lyrical middle and quiet ending.
for(const [b,d,n,v]of [[0,1.7,50,63],[2,1.6,57,59],[4,2.6,62,67],[7,.8,61,55],[8,1.8,58,60],[10,1.5,62,62],[12,2.7,61,58]])add('horn',b,d,n,v);
for(const [b,d,n]of [[0,2.7,70],[3,.7,74],[4,2.8,69],[8,2.7,67],[11,.7,64],[12,3.2,65],[16,2.6,67],[19,.7,70],[20,2.8,74],[24,1.7,73],[26,1.7,76],[28,2.8,73]])add('horn',80+b,d,n,67);
for(const [b,d,n]of [[0,2.6,70],[4,2.5,67],[8,2.6,69],[12,2.7,61]])add('horn',176+b,d,n,55);
// Independent counterline, never an automatic fixed interval beneath every note.
for(const [b,d,n]of [[16,2.8,65],[20,2.8,62],[24,2.8,69],[28,2.8,64],[32,2.8,62],[36,2.8,65],[40,2.8,64],[44,2.8,61],
 [48,1.5,65],[50,1.5,62],[52,1.5,64],[54,1.5,60],[56,1.5,62],[58,1.5,65],[60,2.8,61],
 [112,2.7,65],[116,2.7,62],[120,2.7,69],[124,2.7,64],[128,2.7,62],[132,2.7,65],[136,2.7,64],[140,2.7,61],
 [144,1.6,65],[146,1.6,69],[148,1.6,64],[150,1.6,67],[152,2.7,65],[156,2.7,64],[160,2.7,62],[164,2.7,65],[168,2.7,64],[172,3.2,65]])add('harm',b,d,n,46);
for(let bar=0;bar<bars;bar++){
 const c=chords[progression[bar]],b=bar*4,full=bar>=28&&bar<44,march=bar>=12&&bar<20,bridge=bar>=20&&bar<28,end=bar>=44;
 const v=full?97:march?82:bridge?77:end?52:bar<4?62:72;
 // Root/fifth bass with short pickups; gaps leave the drums intelligible.
 add('bass',b,full?1.25:2.7,c.bass,full?88:70);if(bar>=4&&!bridge&&!end){add('bass',b+2,1.35,c.bass+7,full?81:64);if(full)add('bass',b+3.5,.32,c.bass,70);}
 if(bridge||end)add('bass',b+3,.75,c.bass+7,51);
 for(let j=0;j<3;j++){
  add('choir',b+.04+j*.008,3.76,c.pad[j]+(full?12:0),v-(j===1?5:0));
  if(full||march)add('saw',b+.03,3.5,c.pad[j],full?63:49);
 }
 // Low men's voices underpin the soprano choir at the two great reprises.
 if(full){add('choir',b+.04,3.7,c.pad[0],76);add('choir',b+.05,3.7,c.pad[2],70);}
 // Bowed eighth-note ostinato builds motion beneath the broad brass melody.
 if(bar>=4&&bar<44&&!bridge){const order=[0,1,2,1,0,1,3,2];
  for(let j=0;j<8;j++)add('strings',b+j*.5,.38,c.notes[order[j]]+12,(full?76:march?64:50)+(j%4===0?10:0));
 }
 // Brass chords answer on structural beats, leaving room for melody and breathing.
 if(full||march||bar===0||bar===2){
  for(const [j,n]of c.pad.entries())add('brass',b,full?1.65:march?1.25:2.6,n,full?83-j*6:march?65-j*5:53-j*4);
  if(full&&bar%2===1)for(const n of [c.pad[0],c.pad[2]])add('brass',b+3,.7,n,66);
 }
 if([0,4,12,20,28,36,43].includes(bar))add('bells',b,2.7,c.bass+36,full?73:57);
 if(bar>=2&&bar<46){const order=[0,1,2,1,3,1,2,1],density=full||march?8:bridge?4:8;
  for(let j=0;j<density;j++){const len=bridge?.55:.23;add('arp',b+j*4/density,len,c.notes[order[j]]+(bridge?12:0),(full?48:bridge?30:37)+(j%2?0:5));}
 }
 // Low martial drums; phrase-end rolls use different tom pitches, not a hi-hat wall.
 if(bar<4||bridge||end){if(bar%2===0)add('timpani',b,.9,c.bass+12,end?48:64);if(bar%4===3)add('drums',b+3,.25,45,45);}
 else{
  add('drums',b,.18,36,full?110:92);add('timpani',b,.95,c.bass+12,full?94:77);
  add('drums',b,.3,41,full?108:86);add('drums',b+2,.3,41,full?96:75);
  add('drums',b+2,.18,36,full?99:82);add('drums',b+1.5,.18,43,full?86:68);add('drums',b+3,.18,45,full?90:75);
  if(full){add('timpani',b+2,.7,c.bass+12,78);add('drums',b+2.75,.18,43,65);}
  if(full||march){add('drums',b+1,.15,38,full?62:48);add('drums',b+3,.15,38,full?67:52);add('drums',b+3.5,.13,43,60);}
  if(bar%4===3)for(let j=0;j<8;j++)add('drums',b+3+j*.125,.10,[45,43,45,43,41,43,41,41][j],53+j*7);
  if(bar%8===4||bar===28||bar===36)add('drums',b,.55,49,full?94:70);
  if(full)for(let j=1;j<8;j+=2)add('drums',b+j*.5,.08,42,25+(j===7?6:0));
 }
 // Horn answers in the melody's breathing spaces.
 if((full||march)&&bar%4===1){add('horn',b+3,.75,c.pad[0]+12,57);add('horn',b+3,.75,c.pad[2]+12,48);}
}
// Combine an accented roll with its beat instead of sending two note-ons for one key.
// MIDI and the runtime receive exactly the same normalized events.
for(const name of Object.keys(tracks)){
 const merged=new Map();for(const e of tracks[name]){const key=e[0]+':'+e[2],prev=merged.get(key);if(prev){prev[1]=Math.max(prev[1],e[1]);prev[3]=Math.max(prev[3],e[3]);}else merged.set(key,e);}
 const events=[...merged.values()].sort((a,b)=>a[0]-b[0]||a[2]-b[2]),last=new Map();
 for(const e of events){const prev=last.get(e[2]);if(prev&&prev[0]+prev[1]>e[0])prev[1]=e[0]-prev[0];last.set(e[2],e);}tracks[name]=events;
}
const score={title:'HearthreaveR — The Ember Crown',version:2,bpm,tpb,bars,style:'title',gain:.92,tracks:{}};
for(const [name,ev]of Object.entries(tracks))score.tracks[name]=ev.sort((a,b)=>a[0]-b[0]||a[2]-b[2]).flat();
fs.writeFileSync(path.join(dir,'hearthreaver-theme.json'),JSON.stringify(score,null,2)+'\n');
const vlq=n=>{const b=[n&127];while(n>>=7)b.unshift((n&127)|128);return Buffer.from(b);};
const meta=(type,text)=>Buffer.concat([Buffer.from([255,type]),vlq(Buffer.byteLength(text)),Buffer.from(text)]);
const chunk=(type,b)=>{const len=Buffer.alloc(4);len.writeUInt32BE(b.length);return Buffer.concat([Buffer.from(type),len,b]);};
const midiTrack=ev=>{ev.sort((a,b)=>a.t-b.t||a.order-b.order);let last=0;const b=[];for(const e of ev){b.push(vlq(e.t-last),e.d);last=e.t;}b.push(vlq(bars*4*tpb-last),Buffer.from([255,47,0]));return chunk('MTrk',Buffer.concat(b));};
const tempo=Math.round(60000000/bpm),conductor=[{t:0,order:0,d:meta(3,score.title)},{t:0,order:1,d:Buffer.from([255,81,3,tempo>>16,tempo>>8&255,tempo&255])},{t:0,order:2,d:Buffer.from([255,88,4,4,2,24,8])},{t:0,order:3,d:Buffer.from([255,89,2,255,1])}];
for(const [bar,label]of [[0,'I / The canyon calls'],[4,'II / The wanderer'],[12,'III / March of the embers'],[20,'IV / Choir of stone'],[28,'V / The ember crown'],[36,'VI / The oath'],[44,'VII / Return to the dunes']])conductor.push({t:bar*4*tpb,order:4,d:meta(6,label)});
const channels={lead:0,harm:1,arp:2,saw:3,bass:4,horn:5,choir:6,timpani:7,drums:9,brass:8,strings:10,bells:11};
const programs={lead:56,harm:60,arp:46,saw:48,bass:43,horn:60,choir:52,timpani:47,brass:61,strings:48,bells:14};
const pans={lead:64,harm:84,arp:38,saw:50,bass:64,horn:77,choir:64,timpani:54,drums:67,brass:80,strings:37,bells:69};
const midi=[midiTrack(conductor)];
for(const [name,ev]of Object.entries(tracks)){
 const ch=channels[name],list=[{t:0,order:0,d:meta(3,name)},{t:0,order:1,d:Buffer.from([176|ch,10,pans[name]])},{t:0,order:1,d:Buffer.from([176|ch,7,name==='choir'?84:100])},{t:0,order:1,d:Buffer.from([176|ch,91,name==='choir'?64:36])}];
 if(name!=='drums')list.push({t:0,order:1,d:Buffer.from([192|ch,programs[name]])});
 for(const [t,d,n,v]of ev){list.push({t,order:3,d:Buffer.from([144|ch,n,v])},{t:t+d,order:2,d:Buffer.from([128|ch,n,0])});}
 midi.push(midiTrack(list));
}
const head=Buffer.alloc(6);head.writeUInt16BE(1);head.writeUInt16BE(midi.length,2);head.writeUInt16BE(tpb,4);
fs.writeFileSync(path.join(dir,'hearthreaver-theme.mid'),Buffer.concat([chunk('MThd',head),...midi]));
console.log('The Ember Crown: 12 instrumental tracks + conductor, '+bars+' bars, '+(bars*240/bpm).toFixed(2)+' s.');
