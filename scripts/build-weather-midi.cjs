// Five original type-1 MIDI scores. Exact note timing also drives the game's weather synth.
const fs=require('node:fs'),path=require('node:path'),root=path.resolve(__dirname,'..'),dir=path.join(root,'audio');
const scores={},tpb=480,bpm=90,loopTicks=8*4*tpb;
const rng=seed=>()=>{seed=seed*16807%2147483647;return seed/2147483647;};
for(const [name,density,gain]of [['rain_light',.3,.7],['rain_steady',.65,.85],['rain_downpour',1,1.05]]){
 const r=rng(730+Math.round(density*100)),tracks={lead:[],arp:[],saw:[],bass:[]};
 // Uneven droplets, separate stone splashes, a rain sheet and slow gusts.
 for(let t=0;t<loopTicks-130;){t+=Math.round(85+(1-density)*300+r()*330);if(t>=loopTicks-130)break;tracks.lead.push(t,25+Math.round(r()*55),62+Math.floor(r()*20),Math.round(25+r()*40+density*18));}
 for(let t=90;t<loopTicks-130;){t+=Math.round(170+(1-density)*540+r()*400);if(t>=loopTicks-130)break;tracks.arp.push(t,25+Math.round(r()*35),70+Math.floor(r()*20),Math.round(20+r()*35+density*20));}
 for(let i=0;i<8;i++){tracks.saw.push(i*1920,1920,48+i%3,Math.round(28+density*65+(i%3-1)*6));tracks.bass.push(i*1920+120,1620,30+i%4,Math.round(12+density*35+(i%4)*4));}
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
