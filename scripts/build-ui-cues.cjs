// Original, short type-1 MIDI cues. The embedded tick score is played by the game's synth.
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),dir=path.join(root,'audio');
const patterns={
 ui_open:{lead:[[0,70,62,65],[55,85,69,54],[105,110,74,42]],arp:[[22,55,81,26]],bass:[[0,80,50,34]]},
 ui_select:{lead:[[0,48,69,52],[40,65,74,42]],arp:[[15,45,86,22]],bass:[[0,55,57,25]]},
 ui_confirm:{lead:[[0,75,62,62],[50,80,66,55],[100,120,69,50]],arp:[[100,100,81,25]],bass:[[0,110,50,38]]},
 ui_back:{lead:[[0,55,69,48],[45,80,62,42]],arp:[[10,48,74,22]],bass:[[45,65,50,28]]}
};
const tpb=480,bpm=120,tick=ms=>Math.round(ms*.96),scores={};
const vlq=n=>{const b=[n&127];while(n>>=7)b.unshift((n&127)|128);return Buffer.from(b);};
const chunk=(id,data)=>{const n=Buffer.alloc(4);n.writeUInt32BE(data.length);return Buffer.concat([Buffer.from(id),n,data]);};
const name=text=>Buffer.concat([Buffer.from([255,3]),vlq(Buffer.byteLength(text)),Buffer.from(text)]);
function track(events){events.sort((a,b)=>a.t-b.t||a.order-b.order);let last=0;const out=[];for(const e of events){out.push(vlq(e.t-last),e.bytes);last=e.t;}out.push(vlq(480-last),Buffer.from([255,47,0]));return chunk('MTrk',Buffer.concat(out));}
for(const [cue,parts]of Object.entries(patterns)){
 const score=scores[cue]={bpm,tpb,bars:1,dur:.45,style:'ui',gain:.55,tracks:{}};
 const tracks=[track([{t:0,order:0,bytes:name(cue)},{t:0,order:1,bytes:Buffer.from([255,81,3,7,161,32])}])];
 let ch=0;for(const [part,notes]of Object.entries(parts)){
  score.tracks[part]=notes.flatMap(([at,len,n,v])=>[tick(at),tick(len),n,v]);
  const events=[{t:0,order:0,bytes:name(part)},{t:0,order:1,bytes:Buffer.from([192|ch,part==='bass'?38:part==='arp'?10:24])}];
  for(const [at,len,n,v]of notes){events.push({t:tick(at),order:3,bytes:Buffer.from([144|ch,n,v])},{t:tick(at)+tick(len),order:2,bytes:Buffer.from([128|ch,n,0])});}
  tracks.push(track(events));ch++;
 }
 const header=Buffer.alloc(6);header.writeUInt16BE(1,0);header.writeUInt16BE(tracks.length,2);header.writeUInt16BE(tpb,4);
 fs.writeFileSync(path.join(dir,cue.replace('_','-')+'.mid'),Buffer.concat([chunk('MThd',header),...tracks]));
}
fs.writeFileSync(path.join(dir,'ui-cues.json'),JSON.stringify(scores,null,2)+'\n');
const file=path.join(root,'index.html'),source=fs.readFileSync(file,'utf8');
const block='// BEGIN UI MIDI CUES\nconst UI_CUES='+JSON.stringify(scores)+';\n// END UI MIDI CUES';
fs.writeFileSync(file,source.includes('// BEGIN UI MIDI CUES')?source.replace(/\/\/ BEGIN UI MIDI CUES[\s\S]*?\/\/ END UI MIDI CUES/,()=>block):source.replace('const CUE_DATA={guardian_death:GUARDIAN_DEATH_CUE}',block+'\nconst CUE_DATA={...UI_CUES,guardian_death:GUARDIAN_DEATH_CUE}'));
console.log('Built four layered MIDI UI cues and matching embedded scores.');
