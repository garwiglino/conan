// Five original type-1 MIDI scores. Exact note timing also drives the game's weather synth.
const fs=require('node:fs'),path=require('node:path'),root=path.resolve(__dirname,'..'),dir=path.join(root,'audio');
const scores={},tpb=480,bpm=90,loopTicks=8*4*tpb;
const rng=seed=>()=>{seed=seed*16807%2147483647;return seed/2147483647;};
for(const [name,density,gain]of [['rain_light',.3,.7],['rain_steady',.65,.85],['rain_downpour',1,1.05]]){
 const r=rng(730+Math.round(density*100)),tracks={lead:[],arp:[],saw:[],bass:[]};
 // Subtle, irregular foreground droplets over uninterrupted, gently changing beds.
 for(let t=35;t<loopTicks-80;){t+=Math.round(55+(1-density)*170+r()*310);if(t>=loopTicks-80)break;tracks.lead.push(t,22+Math.round(r()*46),62+Math.floor(r()*20),Math.round(24+r()*32+density*12));}
 for(let t=110;t<loopTicks-90;){t+=Math.round(120+(1-density)*360+r()*460);if(t>=loopTicks-90)break;tracks.arp.push(t,30+Math.round(r()*48),70+Math.floor(r()*20),Math.round(18+r()*24+density*12));}
 // Adjacent note gates become legato changes in the rain instrument, including the wrap.
 // Unequal phrase lengths and a cyclic contour avoid an audible bar-by-bar pumping rhythm.
 for(const [part,steps,note,base,depth]of [['saw',12,48,42+density*54,5],['bass',7,30,20+density*37,7]]){
  for(let i=0;i<steps;i++){
   const t=Math.round(i*loopTicks/steps),end=Math.round((i+1)*loopTicks/steps);
   const shape=Math.sin(i/(steps-1)*Math.PI*2)*.65+Math.sin(i/(steps-1)*Math.PI*4)*.35;
   tracks[part].push(t,end-t,note,Math.round(base+depth*shape));
  }
 }
 scores[name]={bpm,tpb,bars:8,dur:8*240/bpm,style:'rain',gain,tracks};
}
scores.thunder_near={bpm:120,tpb,bars:4,dur:7,style:'thunder',gain:1.1,tracks:{
 lead:[0,120,49,116,85,95,51,70,220,140,46,42],
 arp:[420,500,45,52,1180,650,40,40,2120,850,36,24],
 saw:[90,1320,32,80,860,1440,29,66,2220,1500,26,42,3640,1100,24,22],
 bass:[20,1650,24,115,640,2100,22,82,2110,1900,19,56,3580,1150,17,28]}};
scores.thunder_distant={bpm:120,tpb,bars:4,dur:7,style:'thunder',gain:.8,tracks:{
 lead:[0,180,40,30],arp:[580,700,36,26,1840,1000,32,18,3100,1000,29,12],
 saw:[0,1600,30,72,920,1900,27,62,2600,1750,24,38],
 bass:[80,2100,22,80,1460,2250,20,61,3150,1500,17,28]}};
const vlq=n=>{const b=[n&127];while(n>>=7)b.unshift((n&127)|128);return Buffer.from(b);};
const chunk=(id,data)=>{const len=Buffer.alloc(4);len.writeUInt32BE(data.length);return Buffer.concat([Buffer.from(id),len,data]);};
const meta=(type,text)=>Buffer.concat([Buffer.from([255,type]),vlq(Buffer.byteLength(text)),Buffer.from(text)]);
for(const [name,score]of Object.entries(scores)){
 const tempo=Math.round(60000000/score.bpm),end=Math.ceil(score.dur*score.tpb*score.bpm/60);
 const track=events=>{events.sort((a,b)=>a.t-b.t||a.order-b.order);let last=0;const out=[];for(const e of events){out.push(vlq(e.t-last),e.data);last=e.t;}out.push(vlq(Math.max(0,end-last)),Buffer.from([255,47,0]));return chunk('MTrk',Buffer.concat(out));};
 const tracks=[track([{t:0,order:0,data:meta(3,name)},{t:0,order:1,data:Buffer.from([255,81,3,tempo>>16,(tempo>>8)&255,tempo&255])}])];
 let channel=0;for(const [part,notes]of Object.entries(score.tracks)){
  const program=score.style==='rain'?({lead:96,arp:115,saw:122,bass:121}[part]):({lead:127,arp:122,saw:47,bass:47}[part]);
  const events=[{t:0,order:0,data:meta(3,part)},{t:0,order:1,data:Buffer.from([192|channel,program])}];
  for(let i=0;i<notes.length;i+=4){const[t,d,n,v]=notes.slice(i,i+4);events.push({t,order:3,data:Buffer.from([144|channel,n,v])},{t:t+d,order:2,data:Buffer.from([128|channel,n,0])});}
  tracks.push(track(events));channel++;
 }
 const header=Buffer.alloc(6);header.writeUInt16BE(1);header.writeUInt16BE(tracks.length,2);header.writeUInt16BE(tpb,4);
 fs.writeFileSync(path.join(dir,name.replaceAll('_','-')+'.mid'),Buffer.concat([chunk('MThd',header),...tracks]));
}
fs.writeFileSync(path.join(dir,'weather-scores.json'),JSON.stringify(scores,null,2)+'\n');
console.log('Built three rain loops and two thunder cues, each with four instrument tracks and a conductor.');
