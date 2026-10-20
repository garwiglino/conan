// Fauna cues per biome and time of day. Type-1 MIDI and the in-game event lists share one source.
// The biome music itself is composed in scripts/chiptune-songs.cjs and built by build-music.cjs.
const fs=require('fs'),path=require('path'),dir=path.join(__dirname,'../audio'),tpb=480;
const fauna={};const add=(a,t,d,n,v)=>a.push(Math.round(t*tpb),Math.round(d*tpb),n,v);
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
 for(const [part,notes]of Object.entries(s.tracks)){const ch=part==='drums'?9:i++,pan=Math.round(64+(s.timbres[part].pan||0)*63),ev=[{t:0,o:0,b:meta(3,part)},{t:0,o:1,b:Buffer.from([192|ch,s.programs[part]])},{t:0,o:1,b:Buffer.from([176|ch,10,pan])},{t:0,o:1,b:Buffer.from([176|ch,7,s.style==='biome'?Math.min(110,Math.round(85*Math.sqrt(s.timbres[part].g/.15))):85])},{t:0,o:1,b:Buffer.from([176|ch,91,24])}];for(let j=0;j<notes.length;j+=4){const[t,d,n,v]=notes.slice(j,j+4);ev.push({t,o:3,b:Buffer.from([144|ch,n,v])},{t:t+d,o:2,b:Buffer.from([128|ch,n,0])});}tracks.push(track(ev));}
 const h=Buffer.alloc(6);h.writeUInt16BE(1);h.writeUInt16BE(tracks.length,2);h.writeUInt16BE(tpb,4);fs.writeFileSync(path.join(dir,name+'.mid'),Buffer.concat([chunk('MThd',h),...tracks]));
}
for(const [n,s]of Object.entries(fauna))midi('fauna_'+n,s);
fs.writeFileSync(path.join(dir,'biome-scores.json'),JSON.stringify({fauna},null,2)+'\n');
console.log('Built 18 four-part fauna scores, MIDI type 1.');
