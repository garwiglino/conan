// Original sparse modal scores. Type-1 MIDI and the in-game event lists share one source.
const fs=require('fs'),path=require('path'),dir=path.join(__dirname,'../audio'),tpb=480;
const profiles={
 coast:{root:50,scale:[0,2,5,7,9],bpm:58,mel:[0,2,3,1,4,3,2,0],program:73},
 desert:{root:50,scale:[0,1,4,5,7,8,10],bpm:62,mel:[0,2,1,3,4,2,1,0],program:111},
 steppe:{root:48,scale:[0,2,3,7,9],bpm:66,mel:[0,3,2,4,3,1,2,0],program:60},
 forest:{root:50,scale:[0,2,3,5,7,9,10],bpm:60,mel:[2,4,3,1,0,2,1,0],program:73},
 tropical:{root:53,scale:[0,2,5,7,9],bpm:68,mel:[3,1,2,4,2,1,3,0],program:12},
 wetland:{root:45,scale:[0,2,3,5,7,8,10],bpm:54,mel:[0,4,2,1,3,2,1,0],program:69},
 boreal:{root:50,scale:[0,2,3,5,7,10],bpm:56,mel:[0,3,4,2,1,3,1,0],program:60},
 polar:{root:52,scale:[0,2,5,7,10],bpm:52,mel:[4,2,3,0,1,2,1,0],program:89},
 cursed:{root:45,scale:[0,1,3,5,6,8,10],bpm:52,mel:[0,4,1,3,2,1,4,0],program:91},
 travel:{root:50,scale:[0,2,3,5,7,9,10],bpm:76,mel:[0,4,3,2,5,4,1,0],program:60}
};
const scores={},fauna={};const add=(a,t,d,n,v)=>a.push(Math.round(t*tpb),Math.round(d*tpb),n,v);
for(const [family,p]of Object.entries(profiles)){
 const tracks={lead:[],harm:[],arp:[],saw:[],bass:[],drums:[]},note=i=>p.root+12+p.scale[(i+p.scale.length)%p.scale.length];
 for(let bar=0;bar<32;bar++){
  const phrase=Math.floor(bar/4),degree=[0,3,0,4,0,2,4,0][phrase],base=p.root+p.scale[degree%p.scale.length],t=bar*4;
  if(bar%2===0){add(tracks.bass,t,7.7,base-12,37);add(tracks.saw,t+.1,7.6,base,28);add(tracks.harm,t+.3,7.4,base+7,25);}
  // Silence between melodic answers keeps exploration and dialogue in front.
  if(bar%4===0||bar%4===2){const index=p.mel[(phrase+(bar%4===2?3:0))%8];add(tracks.lead,t+.5,1.6,note(index),family==='travel'?49:39);if(bar%4===0)add(tracks.lead,t+2.75,.8,note(index+1),32);}
  if(bar%2===1||family==='travel')for(let beat=0;beat<4;beat+=family==='travel'?1:2)add(tracks.arp,t+beat+.03,.65,base+12+[0,7,12,7][beat],29+(beat===0?6:0));
  if(['desert','steppe','tropical','travel'].includes(family)&&bar%2===0){add(tracks.drums,t,.4,41,30);if(family==='travel'||family==='tropical')add(tracks.drums,t+2.5,.25,45,23);}
 }
 const timbres={lead:{kind:['steppe','boreal','travel'].includes(family)?'brass':family==='polar'?'bell':'flute',g:.19,pan:-.12,a:.12,rel:.45,filter:1300},harm:{kind:'choir',g:.09,pan:.25,a:.6,rel:.8},arp:{kind:'bell',g:family==='tropical'?.12:.075,pan:.3,a:.005,rel:.5},saw:{w:'tri',g:.1,pan:-.3,a:.5,tau:1,sus:.8,rel:.65},bass:{w:'tri',g:.22,pan:0,a:.08,flat:true,rel:.3},drums:{g:.15,pan:-.1}};
 scores['biome_'+family]={bpm:p.bpm,tpb,bars:32,dur:32*240/p.bpm,style:'biome',gain:family==='travel'?2.6:family==='polar'?2.5:2,tracks,timbres,programs:{lead:p.program,harm:52,arp:46,saw:48,bass:43,drums:0}};
}
const habitats={coast:['gull','gull'],desert:['hawk','owl'],steppe:['lark','cricket'],forest:['songbird','owl'],tropical:['parrot','frog'],wetland:['frog','frog'],boreal:['raven','wolf'],polar:['raven','wind'],cursed:['raven','wind']};
for(const [family,calls]of Object.entries(habitats))for(const [phase,voice]of [['day',calls[0]],['night',calls[1]]]){
 const tracks={lead:[],arp:[],saw:[],bass:[]};
 if(voice!=='wind')for(const [t,n,v]of [[3,74,48],[22,70,35],[41,76,42]])add(tracks.lead,t,voice==='wolf'?3:1.2,n,v);
 if(voice!=='wind')for(const t of [11,34,49])add(tracks.arp,t,.9,72,26);
 if(phase==='night'&&['steppe','forest','tropical','wetland'].includes(family))for(let t=0;t<56;t+=5.7)add(tracks.saw,t,1.6,92,18);
 fauna[family+'_'+phase]={bpm:60,tpb,bars:14,dur:56,style:'fauna',gain:1.2,tracks,timbres:{lead:{kind:'fauna',voice,g:.24,pan:-.4},arp:{kind:'fauna',voice:['tropical','wetland'].includes(family)?'frog':voice,g:.12,pan:.45},saw:{kind:'fauna',voice:'cricket',g:.07,pan:.2},bass:{kind:'fauna',voice:'wind',g:0,pan:0}},programs:{lead:123,arp:123,saw:123,bass:122}};
}
function midi(name,s){const vlq=n=>{let b=[n&127];while(n>>=7)b.unshift((n&127)|128);return Buffer.from(b);},chunk=(id,b)=>{const l=Buffer.alloc(4);l.writeUInt32BE(b.length);return Buffer.concat([Buffer.from(id),l,b]);},meta=(type,text)=>Buffer.concat([Buffer.from([255,type]),vlq(Buffer.byteLength(text)),Buffer.from(text)]),end=s.bars*4*tpb;
 const track=ev=>{ev.sort((a,b)=>a.t-b.t||a.o-b.o);let prev=0,out=[];for(const e of ev){out.push(vlq(e.t-prev),e.b);prev=e.t;}out.push(vlq(end-prev),Buffer.from([255,47,0]));return chunk('MTrk',Buffer.concat(out));};
 const tempo=Math.round(60000000/s.bpm),tracks=[track([{t:0,o:0,b:meta(3,name)},{t:0,o:1,b:Buffer.from([255,81,3,tempo>>16,tempo>>8&255,tempo&255])}])];let i=0;
 for(const [part,notes]of Object.entries(s.tracks)){const ch=part==='drums'?9:i++,pan=Math.round(64+(s.timbres[part].pan||0)*63),ev=[{t:0,o:0,b:meta(3,part)},{t:0,o:1,b:Buffer.from([192|ch,s.programs[part]])},{t:0,o:1,b:Buffer.from([176|ch,10,pan])},{t:0,o:1,b:Buffer.from([176|ch,7,85])},{t:0,o:1,b:Buffer.from([176|ch,91,24])}];for(let j=0;j<notes.length;j+=4){const[t,d,n,v]=notes.slice(j,j+4);ev.push({t,o:3,b:Buffer.from([144|ch,n,v])},{t:t+d,o:2,b:Buffer.from([128|ch,n,0])});}tracks.push(track(ev));}
 const h=Buffer.alloc(6);h.writeUInt16BE(1);h.writeUInt16BE(tracks.length,2);h.writeUInt16BE(tpb,4);fs.writeFileSync(path.join(dir,name+'.mid'),Buffer.concat([chunk('MThd',h),...tracks]));
}
for(const [n,s]of Object.entries(scores))midi(n,s);for(const [n,s]of Object.entries(fauna))midi('fauna_'+n,s);
fs.writeFileSync(path.join(dir,'biome-scores.json'),JSON.stringify({music:scores,fauna},null,2)+'\n');
console.log('Built 10 original six-part music scores and 18 four-part fauna scores, MIDI type 1.');
