// A real type-1 MIDI file and the identical tick-based score for the game sequencer.
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),dir=path.join(root,'audio');fs.mkdirSync(dir,{recursive:true});
const tpb=480,bpm=120,tick=ms=>Math.round(ms*tpb*bpm/60000);
const events={
  lead:[[180,28,68,30],[260,24,63,26],[420,25,58,24],[680,24,65,18],[790,20,61,14]],
  saw:[[0,65,37,34],[100,70,34,28],[260,85,31,24]],
  bass:[[0,90,31,62],[340,70,28,48],[580,135,24,95],[740,65,28,34]],
  drums:[[0,35,38,45],[180,25,42,25],[340,50,36,50],[420,30,42,30],[500,30,42,24],
    [580,100,49,82],[580,100,36,100],[680,25,42,24],[740,45,36,36],[820,25,42,18],[940,20,42,12]]
};
const score={bpm,tpb,bars:1,dur:1.4,style:'stone',gain:.72,tracks:{}};
for(const [name,list] of Object.entries(events))score.tracks[name]=list.flatMap(([at,dur,n,v])=>[tick(at),tick(dur),n,v]);
fs.writeFileSync(path.join(dir,'guardian-death.json'),JSON.stringify(score,null,2)+'\n');
const vlq=n=>{const bytes=[n&127];while(n>>=7)bytes.unshift((n&127)|128);return Buffer.from(bytes);};
const meta=(type,text)=>Buffer.concat([Buffer.from([255,type]),vlq(Buffer.byteLength(text)),Buffer.from(text)]);
const chunk=(id,data)=>{const size=Buffer.alloc(4);size.writeUInt32BE(data.length);return Buffer.concat([Buffer.from(id),size,data]);};
const track=ev=>{ev.sort((a,b)=>a.t-b.t||a.order-b.order);let last=0;const parts=[];for(const e of ev){parts.push(vlq(e.t-last),e.data);last=e.t;}parts.push(vlq(tick(1400)-last),Buffer.from([255,47,0]));return chunk('MTrk',Buffer.concat(parts));};
const tracks=[track([{t:0,order:0,data:meta(3,'Guardian - stone collapse')},{t:0,order:1,data:Buffer.from([255,81,3,7,161,32])}])];
const channels={lead:0,saw:1,bass:2,drums:9},programs={lead:115,saw:112,bass:47};
for(const [name,list] of Object.entries(events)) {
  const channel=channels[name],ev=[{t:0,order:0,data:meta(3,name)}];
  if(name!=='drums')ev.push({t:0,order:1,data:Buffer.from([192|channel,programs[name]])});
  for(const [at,dur,n,v] of list){ev.push({t:tick(at),order:3,data:Buffer.from([144|channel,n,v])});ev.push({t:tick(at)+tick(dur),order:2,data:Buffer.from([128|channel,n,0])});}
  tracks.push(track(ev));
}
const header=Buffer.alloc(6);header.writeUInt16BE(1,0);header.writeUInt16BE(tracks.length,2);header.writeUInt16BE(tpb,4);
fs.writeFileSync(path.join(dir,'guardian-death.mid'),Buffer.concat([chunk('MThd',header),...tracks]));
const file=path.join(root,'index.html'),html=fs.readFileSync(file,'utf8');
const marker=/\/\/ BEGIN GUARDIAN MIDI CUE\n[\s\S]*?\/\/ END GUARDIAN MIDI CUE/;
const block='// BEGIN GUARDIAN MIDI CUE\nconst GUARDIAN_DEATH_CUE='+JSON.stringify(score)+';\n// END GUARDIAN MIDI CUE';
fs.writeFileSync(file,marker.test(html)?html.replace(marker,block):html.replace('const CUE_DATA={};',block+'\nconst CUE_DATA={guardian_death:GUARDIAN_DEATH_CUE};'));
console.log('Composed guardian-death.mid: conductor + 4 instrument tracks; identical score embedded.');
