// Aseprite layers are embedded for the installed iOS app's single-file updater.
class TitleScene {
 constructor(canvas,flameCanvas=null){this.canvas=canvas;this.c=canvas.getContext('2d');this.flameCanvas=flameCanvas;this.ready=false;this.images=[];
  this.flame=new Image();this.flame.src=TITLE_ART.flamePNG;
  this.promise=Promise.all(TITLE_ART.layers.map(l=>new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=()=>reject(new Error('Décor du titre indisponible'));im.src=l.png;}))).then(images=>{this.images=images;this.ready=true;}).catch(()=>{});
 }
 draw(time,reduced=false){
  if(this.flameCanvas){const f=this.flameCanvas,fc=f.getContext('2d'),meta=TITLE_ART.flame;fc.clearRect(0,0,f.width,f.height);fc.imageSmoothingEnabled=false;
   if(this.flame.complete&&this.flame.naturalWidth){const i=reduced?0:Math.floor(time*1000/meta.frameMs)%meta.frames;fc.drawImage(this.flame,i*f.width,0,f.width,f.height,0,0,f.width,f.height);}}
  const c=this.c,w=this.canvas.width,h=this.canvas.height;c.imageSmoothingEnabled=false;c.fillStyle='#081218';c.fillRect(0,0,w,h);if(!this.ready)return;
  c.save();c.scale(w/640,h/360);const t=reduced?0:Math.max(0,time);
  for(let i=0;i<this.images.length;i++){const im=this.images[i],l=TITLE_ART.layers[i];if(!l.speed){c.drawImage(im,0,0);continue;}
   const x=-Math.floor(t*l.speed)%im.width;c.globalAlpha=l.file==='dust.png'?.22:1;c.drawImage(im,x,0);if(x+im.width<640)c.drawImage(im,x+im.width,0);
  }
  c.globalAlpha=1;
  // Sparse amber embers. They drift from the warm lower edge, never flash on the logo.
  if(!reduced)for(let i=0;i<30;i++){
   const age=(t*(.025+i%4*.008)+i*.137)%1,x=(i*157+Math.floor(t*(.6+i%3*.2)))%640,y=358-Math.floor(age*108);
   c.globalAlpha=Math.min(1,age*8,(1-age)*5)*.65;c.fillStyle=i%3?'#c89753':'#f8e3ac';c.fillRect(x,y,1,i%5===0?2:1);
  }
  c.globalAlpha=1;c.restore();
 }
}
const TITLE_TIMBRES={
 lead:{kind:'brass',g:.32,pan:-.06,a:.035,rel:.16,filter:3100},
 harm:{w:'p50',g:.12,pan:.32,a:.035,tau:.5,sus:.7,rel:.13,vib:5},
 arp:{w:'p125',g:.10,pan:-.35,a:.004,tau:.08,sus:.35,rel:.05},
 saw:{w:'saw',g:.075,pan:-.18,a:.22,tau:1,sus:.68,rel:.24,filter:2100},
 bass:{w:'tri',g:.34,pan:0,a:.007,flat:true,rel:.035},
 horn:{kind:'brass',g:.25,pan:.17,a:.08,rel:.23,filter:1550},
 choir:{kind:'choir',g:.23,pan:0,a:.24,rel:.38},
 timpani:{kind:'timpani',g:.63,pan:-.12,a:.003,rel:.2},
 drums:{g:.39,pan:.08},
 brass:{kind:'brass',g:.18,pan:.26,a:.06,rel:.16,filter:2100},
 strings:{w:'saw',g:.13,pan:-.42,a:.024,tau:.15,sus:.58,rel:.08,filter:3400,vib:5},
 bells:{kind:'bell',g:.13,pan:.08,a:.003,rel:.8}
};
function titleVoice(m,song,tr,t,dur,note,vel){
 const c=m.ctx,p=tr.p,f=440*2**((note-69)/12),amp=p.g*vel/127,end=t+dur;
 if(p.kind==='timpani'){
  const o=c.createOscillator(),g=c.createGain();o.type='sine';o.frequency.setValueAtTime(f*1.13,t);o.frequency.exponentialRampToValueAtTime(f,t+.045);
  g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(amp,t+.003);g.gain.exponentialRampToValueAtTime(.0001,t+Math.min(1.1,dur+.35));o.connect(g);g.connect(tr.node);o.start(t);o.stop(t+Math.min(1.1,dur+.35)+.02);return;
 }
 if(p.kind==='brass'){
  const env=c.createGain(),lp=c.createBiquadFilter();lp.type='lowpass';lp.Q.value=.7;
  lp.frequency.setValueAtTime(p.filter*.45,t);lp.frequency.linearRampToValueAtTime(p.filter,t+.09);lp.frequency.setTargetAtTime(p.filter*.65,t+.15,.3);
  env.gain.setValueAtTime(0,t);env.gain.linearRampToValueAtTime(amp,t+p.a);env.gain.setTargetAtTime(amp*.78,t+p.a,.2);env.gain.setTargetAtTime(0,end,p.rel/3);lp.connect(env);env.connect(tr.node);
  for(const [detune,w,level]of [[-5,'saw',.43],[5,'saw',.43],[0,'tri',.26]]){const o=c.createOscillator(),g=c.createGain();o.setPeriodicWave(m.waves[w]);o.frequency.value=f;o.detune.value=detune;g.gain.value=level;o.connect(g);g.connect(lp);o.start(t);o.stop(end+p.rel*4+.01);}return;
 }
 if(p.kind==='bell'){
  for(const [ratio,level,decay]of [[1,.65,1.5],[2.76,.23,.7],[5.4,.1,.32]]){const o=c.createOscillator(),g=c.createGain();o.type='sine';o.frequency.value=f*ratio;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(amp*level,t+.003);g.gain.exponentialRampToValueAtTime(.0001,t+decay);o.connect(g);g.connect(tr.node);o.start(t);o.stop(t+decay+.02);}return;
 }
 // A quiet, two-voice formant choir, preserving the game's synthesized timbres.
 for(const detune of [-5,5]){
  const o=c.createOscillator(),env=c.createGain();o.setPeriodicWave(m.waves.saw);o.frequency.value=f;o.detune.value=detune;
  env.gain.setValueAtTime(0,t);env.gain.linearRampToValueAtTime(amp*.48,t+Math.min(p.a,dur*.35));env.gain.setValueAtTime(amp*.43,end);env.gain.linearRampToValueAtTime(0,end+p.rel);
  for(const [freq,q,gain]of [[650,3,.70],[1100,4,.43],[2700,5,.17]]){const formant=c.createBiquadFilter(),g=c.createGain();formant.type='bandpass';formant.frequency.value=freq;formant.Q.value=q;g.gain.value=gain;o.connect(formant);formant.connect(g);g.connect(env);}
  env.connect(tr.node);o.start(t);o.stop(end+p.rel+.01);
 }
}
