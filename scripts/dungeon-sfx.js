// Bruitages du donjon : portes, herses, leviers, dalles, caisse traînée, treuil, monte-charge, clés, tonneaux et
// caisses qui cassent, voix des gobelins et de Grise-Gueule. Tout est synthétisé par modèles physiques simples
// (modes de bois, fer mat qui cliquette sans jamais sonner comme une cloche, frottement collé-glissé, chaînes, bruit
// filtré, voix de créatures à formants), en tâche de fond par petites tranches d'une image à l'autre dès l'entrée
// dans le donjon. Chaque son a plusieurs variantes.
const DungeonSfx=(()=>{
 const rng=seed=>{let s=(seed>>>0)%2147483646+1;return ()=>(s=s*16807%2147483647)/2147483647;};
 const tick=i=>(i&2047)===0;
 const clock=()=>typeof performance!=='undefined'?performance.now():Date.now();
 // Filtres RBJ : passe-bas, passe-haut, passe-bande (pic à 0 dB). `set` retouche la fréquence en cours de route.
 function biquad(type,f,q,sr){let b0,b1,b2,a1,a2,x1=0,x2=0,y1=0,y2=0;
  const set=(f,q)=>{const w=2*Math.PI*Math.min(f,sr*.45)/sr,cw=Math.cos(w),al=Math.sin(w)/(2*q),a0=1+al;
   if(type==='lp'){b0=(1-cw)/2/a0;b1=(1-cw)/a0;b2=b0;}else if(type==='hp'){b0=(1+cw)/2/a0;b1=-(1+cw)/a0;b2=b0;}else{b0=al/a0;b1=0;b2=-al/a0;}a1=-2*cw/a0;a2=(1-al)/a0;};
  set(f,q);const run=x=>{const y=b0*x+b1*x1+b2*x2-a1*y1-a2*y2;x2=x1;x1=x;y2=y1;y1=y;return y;};run.set=set;return run;}
 const chainF=(...fs)=>x=>{for(const f of fs)x=f(x);return x;};
 // Enveloppe trapèze ; une attaque ou une chute nulle laisse le son plein (boucles).
 const trap=(t,dur,attack,release)=>Math.min(1,attack>0?t/attack:1,release>0?(dur-t)/release:1);
 // Mode amorti : sinus qui décroît (constante de temps `decay`) ; `glide` le fait partir plus haut (>0) ou plus bas (<0).
 // Oscillateur récursif et enveloppe multiplicative : pas de sinus ni d'exponentielle par échantillon.
 function* mode(B,at,f,amp,decay,glide=0){const {d,sr,n}=B,s=Math.max(0,Math.floor(at*sr)),end=Math.min(n,s+Math.ceil(decay*sr*8.5)),k=Math.exp(-1/(decay*sr)),ramp=Math.max(1,Math.round(sr*.0004));
  if(glide){const g=Math.exp(-1/(.02*sr));let ph=0,e=amp,gl=glide;for(let i=s;i<end;i++){ph+=2*Math.PI*f*(1+gl)/sr;gl*=g;d[i]+=e*Math.min(1,(i-s)/ramp)*Math.sin(ph);e*=k;if(tick(i))yield;}return;}
  const w=2*Math.PI*f/sr,c=2*Math.cos(w);let y1=0,y2=-Math.sin(w),e=amp;
  for(let i=s;i<end;i++){const y=c*y1-y2;y2=y1;y1=y;d[i]+=e*(i-s<ramp?(i-s)/ramp:1)*y2;e*=k;if(tick(i))yield;}}
 // Bruit filtré : attaque, puis décroissance en puissance `shape` jusqu'à la fin de `dur`.
 function* hiss(B,r,at,dur,amp,filt,attack=.002,shape=2){const {d,sr,n}=B,s=Math.floor(at*sr),m=Math.min(n,s+Math.floor(dur*sr)),len=Math.max(1,m-s),up=Math.max(1,attack*sr);
  for(let i=Math.max(0,s);i<m;i++){const q=1-(i-s)/len,e=Math.min(1,(i-s)/up)*(shape===1?q:shape===2?q*q:shape===3?q*q*q:q**shape);d[i]+=amp*e*filt(r()*2-1);if(tick(i))yield;}}
 // Bois : modes serrés qui s'éteignent vite (les aigus d'abord), contact bref, parfois un coup sourd dessous.
 const WOOD=[1,1.59,2.13,2.78,3.42,4.31,5.2,6.4];
 function* wood(B,r,at,{f=200,amp=1,decay=.05,bright=1,count=6,thump=0}={}){
  for(let k=0;k<count;k++){const fk=f*WOOD[k]*(.96+r()*.08);yield* mode(B,at,fk,amp*.8**k*(.55+r()*.45)*(k?1:1.2),decay*(f/fk)**.6);}
  yield* hiss(B,r,at,.006,amp*.7*bright,biquad('lp',1800+3000*bright,.7,B.sr),.0003,3);
  if(thump)yield* mode(B,at,f*.42,amp*thump,decay*1.6,.6);}
 // Fer : un choc mat, jamais une cloche. Le fer du donjon est lourd, boulonné, posé sur la pierre ou tenu en main :
 // beaucoup de modes inharmoniques serrés, très amortis, noyés dans un claquement de bruit coloré ; les grosses
 // pièces cliquettent (petits rebonds de jeu) au lieu de résonner.
 const IRON=[1,1.47,1.93,2.44,2.97,3.58,4.2,4.93,5.71,6.6,7.62,8.8];
 function* knock(B,r,at,decay,amp,filt){const {d,sr,n}=B,s=Math.max(0,Math.floor(at*sr)),m=Math.min(n,s+Math.ceil(decay*sr*7)),k=Math.exp(-1/(decay*sr)),up=sr*.0003;let e=amp;
  for(let i=s;i<m;i++){d[i]+=e*Math.min(1,(i-s)/up)*filt(r()*2-1)*2;e*=k;if(tick(i))yield;}}
 function* metal(B,r,at,{f=900,amp=1,decay=.02,count=9,grit=.8,tap=.5,rattle=0,spread=.07}={}){
  for(let k=0;k<count;k++){const fk=f*IRON[k]*(1-spread+r()*2*spread);if(fk>B.sr*.42)break;yield* mode(B,at,fk,amp*.6*.82**k*(.35+r()*.65),decay*(f/fk)**.5*(.6+r()*.8));yield;}
  yield* knock(B,r,at,decay*.8,amp*grit,biquad('bp',f*2.2,.9,B.sr));
  if(tap)yield* hiss(B,r,at,.003,amp*tap,biquad('hp',2500,.7,B.sr),.0002,2);
  for(let j=0,t=at;j<rattle;j++){t+=.012+r()*.03;yield* metal(B,r,t,{f:f*(.85+r()*.3),amp:amp*.45*.7**j*(.5+r()*.5),decay:decay*.5,count:6,grit,tap:tap*.6,spread});}}
 // Choc sourd sur la pierre : sinus grave qui retombe, poussière étouffée.
 function* thud(B,r,at,{f=70,amp=1,decay=.09,dust=.4}={}){yield* mode(B,at,f,amp,decay,.8);yield* hiss(B,r,at,.12,amp*dust,biquad('lp',900,.7,B.sr),.001,3);}
 // Échardes : grains de bruit très courts, de plus en plus rares.
 function* crackle(B,r,at,dur,{rate=400,amp=.5,lo=1500,hi=6000}={}){const {d,sr,n}=B;
  for(let t=at;t<at+dur;){const u=(t-at)/dur,len=.0005+r()*.0025,bp=biquad('bp',lo*(hi/lo)**r(),2+r()*3,sr),a=amp*(1-u)**1.5*(.2+.8*r()**2),s=Math.floor(t*sr),m=Math.min(n,s+Math.floor(len*sr*5));
   for(let i=s;i<m;i++)d[i]+=a*Math.exp(-(i-s)/sr/len)*bp((r()*2-1)*4);
   t+=-Math.log(1-r()*.999)/(rate*(1-u*.85));yield;}}
 // Frottement collé-glissé : impulsions à cadence variable dans des résonances (gond, bois, poulie).
 const HINGE=[[540,9,1],[1350,12,.6],[3100,14,.3]],TIMBER=[[260,5,1],[720,7,.6],[1500,9,.25]],IRONROD=[[700,8,1],[1800,10,.5],[3600,12,.2]];
 function* creak(B,r,at,dur,{rate=[90,60],res=HINGE,amp=1,wobble=.25,attack=.08,release=.15}={}){const {d,sr,n}=B,s=Math.floor(at*sr),m=Math.min(n,s+Math.floor(dur*sr)),R=res.map(([f,q,g])=>[biquad('bp',f,q,sr),g]);let next=0;const phase=r()*6;
  for(let i=Math.max(0,s);i<m;i++){const t=(i-s)/sr,u=t/dur;let x=0;if(t>=next){x=1;const cr=rate[0]+(rate[1]-rate[0])*u;next=t+1/Math.max(4,cr*(1+wobble*Math.sin(2*Math.PI*1.3*t+phase))+r()*cr*.15);}
   const e=trap(t,dur,attack,release);let y=0;for(const [f,g]of R)y+=f(x)*g;d[i]+=amp*e*y*6;if(tick(i))yield;}}
 // Chaîne qui défile : maillons qui claquent sec, de hauteurs très diverses (pas de grelot), un sur cinq plus lourd.
 function* chain(B,r,at,dur,{rate=22,amp=.6,f=2600,attack=.1,release=.2}={}){
  for(let t=0;t<dur;){const e=trap(t,dur,attack,release),heavy=r()<.2;
   yield* metal(B,r,at+t,{f:(heavy?f*.38:f*.7)*(.7+r()*.6),amp:amp*e*(heavy?.9:.5)*(.6+r()*.4),decay:heavy?.012:.005,count:heavy?8:5,grit:1,tap:.7,spread:.12});
   t+=1/(rate*(.7+r()*.6));}}
 // Raclement : bruit coloré, rugosité lente, accrocs.
 function* scrape(B,r,at,dur,{amp=.6,f=900,q=1.2,grit=40,low=180,attack=.05,release=.1}={}){const {d,sr,n}=B,s=Math.floor(at*sr),m=Math.min(n,s+Math.floor(dur*sr)),bp=biquad('bp',f,q,sr),lp=biquad('lp',low,.8,sr);let rough=.5,target=.5,next=0,snag=0;
  for(let i=Math.max(0,s);i<m;i++){const t=(i-s)/sr;if(t>=next){target=.25+r()*.75;next=t+.03+r()*.08;}rough+=(target-rough)*.002;if(r()<grit/sr)snag=1;snag*=.995;
   const e=trap(t,dur,attack,release),w=r()*2-1;d[i]+=amp*e*rough*(bp(w)*3*(1+snag*2)+lp(w)*2);if(tick(i))yield;}}
 // Bulles qui montent : liquide renversé, gargouillis.
 function* bubbles(B,r,at,dur,{rate=30,amp=.4,lo=250,hi=900}={}){for(let t=at;t<at+dur;t+=-Math.log(1-r()*.99)/rate){const u=(t-at)/dur;yield* mode(B,t,lo*(hi/lo)**r(),amp*(1-u)*(.3+.7*r()),.012+r()*.03,-.45);}}
 // Voix de créature : impulsions glottiques lissées (gigue, ruptures de hauteur), seconde source désaccordée (biphonie,
 // grondement à l'octave dessous), râle des fausses cordes (bruit haché de 15 à 70 Hz), souffle, quatre formants
 // larges qui glissent d'une voyelle à l'autre en tremblant, résonance de poitrine, saturation asymétrique.
 // `scale` > 1 raccourcit le conduit vocal (gobelin), < 1 l'allonge (Grise-Gueule).
 const VOWELS={a:[800,1250,2600,3500],e:[480,1900,2550,3400],i:[310,2250,2950,3600],o:[520,900,2450,3300],u:[350,780,2350,3200],ae:[700,1650,2500,3400],eu:[500,1450,2450,3300],ng:[280,1100,2500,3300]};
 const BW=[90,110,150,220],FG=[1,.75,.4,.22];
 const curve=(v,u)=>{if(!Array.isArray(v))return v;if(v.length<2)return v[0];const x=Math.min(.9999,Math.max(0,u))*(v.length-1),k=Math.floor(x);return v[k]+(v[k+1]-v[k])*(x-k);};
 const pulse=ph=>ph<.6?.5*(1-Math.cos(Math.PI*ph/.6)):ph<.78?Math.cos(Math.PI*(ph-.6)/.36):0;
 const BREAKS=[.5,.67,1.5,1.9];
 function* voice(B,r,at,segs,{scale=1.3,breath=.16,jitter=.03,drive=1.6,chest=0,flutter=.05,low=35}={}){const sat=Math.tanh(drive),{d,sr,n}=B,F=BW.map(()=>biquad('bp',1000,5,sr)),air=biquad('hp',1200,.7,sr),
  body=biquad('bp',190*scale,1.6,sr),dc=biquad('hp',low,.7,sr),fl=[0,0,0,0];let t0=at,ph=0,ph2=0,pg=0,last=0,last2=0,odd=1,wob=0,wob2=0,shim=0,jm=1,jt=1,hold=0;
  for(const g of segs){const s=Math.floor(t0*sr),m=Math.min(n,s+Math.floor(g.dur*sr)),len=Math.max(1,m-s),va=VOWELS[g.v[0]],vb=VOWELS[g.v[1]??g.v[0]],voiced=g.voiced??1,rasp=g.rasp||0,fr=g.fr||45,sub=g.sub||0,noise=g.noise??breath,
    growl=g.growl||0,gr=g.gr||fr,bi=g.bi||0,br=g.br||.5,brk=g.brk||0;
   if(g.burst)yield* hiss(B,r,t0,g.burst.dur||.012,g.burst.amp||.5,chainF(biquad('bp',g.burst.f*scale,1.3,sr)),.0005,1.5);
   for(let i=Math.max(0,s);i<m;i++){const u=(i-s)/len;
    if(((i-s)&31)===0){const k=u*u*(3-2*u);for(let j=0;j<4;j++){fl[j]+=((r()*2-1)-fl[j])*.04;const f=(va[j]+(vb[j]-va[j])*k)*scale*(1+flutter*fl[j]*(j?1.4:1));F[j].set(f,f/(BW[j]*scale*(g.wide||1)));}
     // Ruptures : la voix casse d'un coup (octave, quinte) puis revient, comme un cri de bête.
     if(hold>0)hold-=32;else if(jt!==1)jt=1;else if(brk&&r()<brk*32/sr){jt=BREAKS[Math.floor(r()*4)];hold=sr*(.015+r()*.05);}}
    jm+=(jt-jm)*.02;wob+=((r()*2-1)-wob)*.003;wob2+=((r()*2-1)-wob2)*.004;shim+=((r()*2-1)-shim)*.01;
    const f0=curve(g.f0,u)*(1+jitter*wob*8)*jm;ph+=f0/sr;if(ph>=1){ph-=1;odd=-odd;}
    const gl=pulse(ph),dg=(gl-last)*sr/Math.max(30,f0)*.18;last=gl;
    let x2=0;if(bi){const f2=f0*br*(1+jitter*wob2*14);ph2+=f2/sr;if(ph2>=1)ph2-=1;const g2=pulse(ph2);x2=(g2-last2)*sr/Math.max(25,f2)*.18;last2=g2;}
    pg+=gr*(1+wob2*3)/sr;if(pg>=1)pg-=1;const gate=pg<.4?Math.sin(Math.PI*pg/.4)**2:0;
    const t=(i-s)/sr,am=(1+rasp*.8*Math.sin(2*Math.PI*fr*t+wob*3))*(1-growl*.75+growl*1.5*gate),sb=odd>0?1:1-sub,a=curve(g.amp,u)*(1+shim*.3),w=r()*2-1;
    const x=voiced*(dg*sb+bi*x2)*am+noise*(.3+.7*gl*voiced+(1-voiced))*w*1.2+growl*gate*w*.9;
    let y=0;for(let j=0;j<4;j++)y+=F[j](x)*FG[j];if(chest)y+=body(x)*chest*1.5;
    const z=Math.tanh(y*1.6*drive)/sat;d[i]+=a*(dc(z+.18*z*z)+air(w)*noise*.08*(1-voiced*.6));if((i&511)===0)yield;}
   t0+=g.dur;}}
 // Petit outil : sons « voix » successifs.
 const V=(dur,v,f0,amp,more={})=>({dur,v:Array.isArray(v)?v:[v],f0,amp,...more});
 const H=(dur,v,amp)=>({dur,v:[v],f0:200,amp,voiced:0,noise:.9});
 const GAP=dur=>({dur,v:['a'],f0:300,amp:0,voiced:0,noise:0});
 const GOB={scale:1.35,flutter:.08,breath:.2},CHIEF={scale:.78,drive:2.6,chest:.25,low:100,flutter:.06,breath:.22,jitter:.045};

 // Recettes : [secondes, générateur]. Le hasard (graine propre à chaque variante) donne les nuances.
 const R={
  key:[.55,function*(B,r){yield* hiss(B,r,0,.08,.07,biquad('bp',1400,.8,B.sr),.012,2);yield* metal(B,r,.025,{f:1250+r()*200,amp:.7,decay:.016,count:8,grit:.35,rattle:2});yield* metal(B,r,.1+r()*.04,{f:1700+r()*500,amp:.35,decay:.01,count:6,grit:.35,rattle:1});}],
  door_unlock:[2.7,function*(B,r){
   yield* scrape(B,r,0,.13,{amp:.22,f:4200,q:2,grit:300,low:500,attack:.01,release:.03});yield* metal(B,r,.11,{f:2800,amp:.3,decay:.005,count:5});
   yield* metal(B,r,.24,{f:1500,amp:.55,decay:.01,count:7,rattle:1});yield* scrape(B,r,.34,.15,{amp:.45,f:1500,q:1.5,grit:120,low:300,attack:.02,release:.04});
   yield* metal(B,r,.5,{f:430,amp:.85,decay:.028,count:10,rattle:2});yield* wood(B,r,.5,{f:140,amp:.7,decay:.06,thump:.6});
   yield* creak(B,r,.78,1.1,{rate:[70,38],res:HINGE,amp:.55});yield* hiss(B,r,.8,1.1,.18,biquad('lp',260,.7,B.sr),.35,1);
   yield* wood(B,r,1.9,{f:105,amp:.95,decay:.09,thump:1});yield* thud(B,r,1.9,{f:58,amp:.5,decay:.14,dust:.5});yield* metal(B,r,1.92,{f:650,amp:.22,decay:.014,count:8,rattle:2});}],
  door_open:[2.1,function*(B,r){yield* metal(B,r,0,{f:850,amp:.5,decay:.012,count:8,rattle:1});yield* wood(B,r,.005,{f:190,amp:.3,decay:.03});yield* creak(B,r,.12,1.15,{rate:[78,40],res:HINGE,amp:.55});yield* hiss(B,r,.15,1.1,.18,biquad('lp',260,.7,B.sr),.35,1);
   yield* wood(B,r,1.3,{f:105,amp:.95,decay:.09,thump:1});yield* thud(B,r,1.3,{f:58,amp:.5,decay:.14,dust:.5});}],
  door_locked:[.75,function*(B,r){for(const [at,a]of [[0,.8],[.11,.55],[.25,.7]]){yield* wood(B,r,at,{f:155+r()*20,amp:a,decay:.05,thump:.4});yield* metal(B,r,at+.004,{f:700+r()*100,amp:a*.45,decay:.012,count:8,rattle:1});}}],
  door_slam:[2.4,function*(B,r){yield* creak(B,r,0,.26,{rate:[150,230],res:HINGE,amp:.45,attack:.03,release:.04});yield* hiss(B,r,.02,.32,.35,biquad('lp',420,.7,B.sr),.18,1);
   yield* wood(B,r,.32,{f:92,amp:1,decay:.12,thump:1.2,bright:1.2});yield* thud(B,r,.32,{f:52,amp:1,decay:.26,dust:.8});yield* metal(B,r,.33,{f:240,amp:.55,decay:.035,count:11,rattle:3});
   yield* metal(B,r,.62,{f:300,amp:.45,decay:.03,count:10,rattle:2});yield* wood(B,r,.62,{f:170,amp:.4,decay:.04});yield* crackle(B,r,.36,.6,{rate:110,amp:.12,lo:1500,hi:5000});}],
  gate_rise:[2.7,function*(B,r){yield* metal(B,r,0,{f:230,amp:.65,decay:.035,count:10,rattle:2});yield* chain(B,r,.08,2.05,{rate:20,amp:.5});yield* scrape(B,r,.12,1.95,{amp:.2,f:480,q:1.4,grit:30,low:110,attack:.2,release:.25});
   yield* metal(B,r,2.2,{f:260,amp:.75,decay:.04,count:11,rattle:3});yield* thud(B,r,2.2,{f:74,amp:.75,decay:.12,dust:.3});}],
  gate_drop:[1.6,function*(B,r){yield* chain(B,r,0,.46,{rate:46,amp:.5,attack:.03,release:.05});yield* scrape(B,r,.02,.42,{amp:.4,f:900,q:1,grit:60,low:200,attack:.05,release:.03});
   yield* metal(B,r,.46,{f:190,amp:.9,decay:.05,count:12,rattle:4});yield* thud(B,r,.46,{f:60,amp:1,decay:.2,dust:.7});
   yield* metal(B,r,.6,{f:210,amp:.3,decay:.03,count:10,rattle:2});yield* thud(B,r,.6,{f:66,amp:.25,decay:.08,dust:.2});yield* crackle(B,r,.5,.5,{rate:70,amp:.1,lo:900,hi:4000});}],
  gate_cells:[1.7,function*(B,r){for(const [k,at]of [[0,0],[1,.18],[2,.34],[3,.53]]){yield* metal(B,r,at,{f:480+k*30+r()*40,amp:.75,decay:.022,count:9,rattle:2});yield* metal(B,r,at+.01,{f:2200,amp:.2,decay:.005,count:5});yield* creak(B,r,at+.06,.28,{rate:[130,80],res:HINGE.map(([f,q,g])=>[f*(1.2+k*.08),q,g]),amp:.2,attack:.03,release:.08});}}],
  cage_open:[2.3,function*(B,r){yield* chain(B,r,0,1.65,{rate:17,amp:.38,f:2200});yield* creak(B,r,.05,1.55,{rate:[48,34],res:TIMBER,amp:.3});yield* metal(B,r,1.75,{f:400,amp:.75,decay:.03,count:10,rattle:3});yield* thud(B,r,1.75,{f:80,amp:.55,decay:.1});}],
  lever:[1.2,function*(B,r){yield* metal(B,r,0,{f:800,amp:.4,decay:.01,count:7});yield* creak(B,r,.05,.3,{rate:[140,90],res:IRONROD,amp:.35,attack:.03,release:.05});
   yield* metal(B,r,.36,{f:1100,amp:1,decay:.013,count:8,rattle:1});yield* wood(B,r,.36,{f:220,amp:.5,decay:.04});
   yield* thud(B,r,.5,{f:66,amp:.7,decay:.15,dust:.3});yield* metal(B,r,.5,{f:230,amp:.4,decay:.035,count:10,rattle:2});yield* chain(B,r,.55,.35,{rate:26,amp:.22,attack:.03,release:.1});}],
  plate_down:[.8,function*(B,r){yield* scrape(B,r,0,.26,{amp:.5,f:350,q:.8,grit:80,low:120,attack:.03,release:.05});yield* metal(B,r,.22,{f:650,amp:.4,decay:.012,count:8});yield* thud(B,r,.22,{f:82,amp:.8,decay:.1,dust:.5});}],
  plate_up:[.6,function*(B,r){yield* scrape(B,r,0,.18,{amp:.4,f:420,q:.8,grit:80,low:140,attack:.02,release:.04});yield* metal(B,r,.16,{f:850,amp:.35,decay:.01,count:8});yield* wood(B,r,.16,{f:180,amp:.4,decay:.04});}],
  winch:[2.9,function*(B,r){for(let t=0,k=0;t<2.4;k++){yield* metal(B,r,t,{f:1300+r()*300,amp:.5,decay:.006,count:6,spread:.12});yield* wood(B,r,t,{f:260,amp:.3,decay:.02});t+=1/(6+5*t/2.4)*(.92+r()*.16);}
   yield* creak(B,r,0,2.5,{rate:[40,55],res:TIMBER,amp:.25});yield* chain(B,r,.1,2.4,{rate:9,amp:.2});yield* metal(B,r,2.5,{f:950,amp:.75,decay:.014,count:8,rattle:1});yield* thud(B,r,2.5,{f:75,amp:.4});}],
  lift:[3.1,function*(B,r){yield* metal(B,r,0,{f:260,amp:.55,decay:.035,count:10,rattle:3});yield* thud(B,r,0,{f:70,amp:.6});yield* chain(B,r,.1,2.6,{rate:24,amp:.4});yield* creak(B,r,.1,2.6,{rate:[35,48],res:TIMBER,amp:.3});
   yield* hiss(B,r,.1,2.6,.12,biquad('lp',500,.7,B.sr),.6,.5);yield* thud(B,r,2.75,{f:70,amp:.9,decay:.12});yield* wood(B,r,2.75,{f:130,amp:.6,decay:.07,thump:.6});yield* metal(B,r,2.76,{f:300,amp:.35,decay:.03,count:10,rattle:2});}],
  crate_grab:[.4,function*(B,r){yield* hiss(B,r,0,.05,.25,biquad('lp',1200,.7,B.sr),.004,2);yield* wood(B,r,.01,{f:210,amp:.45,decay:.035,bright:.4});yield* creak(B,r,.04,.13,{rate:[200,160],res:TIMBER,amp:.15,attack:.02,release:.04});}],
  crate_release:[.55,function*(B,r){yield* wood(B,r,0,{f:150,amp:.9,decay:.07,thump:.8,bright:.7});yield* thud(B,r,0,{f:70,amp:.5});yield* wood(B,r,.06,{f:340,amp:.2,decay:.03});}],
  crate_hit:[.55,function*(B,r){yield* wood(B,r,0,{f:180+r()*30,amp:1,decay:.06,thump:.6});yield* crackle(B,r,.01,.12,{rate:260,amp:.35});}],
  crate_break:[1.5,function*(B,r){yield* wood(B,r,0,{f:165,amp:1,decay:.07,thump:1});yield* hiss(B,r,.004,.05,.9,biquad('bp',2600,.8,B.sr),.0005,1.5);yield* crackle(B,r,.01,.36,{rate:900,amp:.6});yield* thud(B,r,.05,{f:75,amp:.5,decay:.1});
   for(let k=0;k<6;k++)yield* wood(B,r,.12+k*.1+r()*.08,{f:260+r()*260,amp:(.55-k*.06)*(.6+r()*.4),decay:.035,count:5});yield* crackle(B,r,.5,.45,{rate:60,amp:.1,lo:800,hi:3000});}],
  barrel_hit:[.6,function*(B,r){yield* wood(B,r,0,{f:150,amp:.9,decay:.06});yield* mode(B,0,230*(.95+r()*.1),.6,.05);yield* mode(B,0,115,.4,.06);yield* metal(B,r,.002,{f:800,amp:.22,decay:.01,count:7,tap:0,rattle:1});}],
  barrel_break:[2,function*(B,r){yield* wood(B,r,0,{f:140,amp:1,decay:.07,thump:1});yield* hiss(B,r,.004,.05,.8,biquad('bp',2300,.8,B.sr),.0005,1.5);yield* crackle(B,r,.01,.35,{rate:800,amp:.5});
   yield* hiss(B,r,.02,.38,.45,biquad('bp',1400,.7,B.sr),.01,1.5);yield* bubbles(B,r,.05,.55,{rate:30,amp:.3});
   // Les cercles de fer rebondissent sur la pierre : trois chocs mats qui cliquettent.
   for(const [at,a]of [[.03,.35],[.33,.2],[.6,.1]])yield* metal(B,r,at,{f:340+r()*80,amp:a,decay:.03,count:9,rattle:3,tap:.2});
   for(let k=0;k<7;k++)yield* wood(B,r,.1+k*.11+r()*.08,{f:300+r()*300,amp:(.5-k*.05)*(.6+r()*.4),decay:.035,count:5});}],
  // Gobelins : petites bêtes hargneuses. Conduit court, cris qui cassent, grondement de gorge.
  gob_hurt:[[.42,function*(B,r){yield* voice(B,r,0,[V(.04,'ng',[380,450],[0,.5],{growl:.6,gr:60}),V(.17,['ae','i'],[480,880,700],[.5,1,.9],{rasp:.2,growl:.7,gr:58,sub:.25,brk:8,wide:1.4}),V(.09,['i','eu'],[700,380],[.9,0],{growl:.85,gr:48,wide:1.4})],GOB);}],
   [.36,function*(B,r){yield* voice(B,r,0,[V(.13,['e','ae'],[560,760,520],[1,1,.8],{growl:.8,gr:62,sub:.3,burst:{f:1500,amp:.6},wide:1.4}),V(.03,'ae',[520,420],[.8,0],{growl:.8})],GOB);yield* hiss(B,r,.19,.014,.25,biquad('bp',2600,1.2,B.sr),.0005,1.5);}],
   [.42,function*(B,r){yield* voice(B,r,0,[H(.05,'a',[0,.6]),V(.25,['a','o'],[300,470,260],[.6,1,0],{growl:.9,gr:40,sub:.35,bi:.4,wide:1.3})],GOB);}],
   [.3,function*(B,r){yield* voice(B,r,0,[V(.03,'i',[750,900],[0,.8],{growl:.3}),V(.13,['i','ae'],[900,1150,680],[.8,1,0],{growl:.6,gr:65,brk:10,wide:1.5})],GOB);}]],
  gob_die:[[1.5,function*(B,r){yield* voice(B,r,0,[V(.05,['ng','ae'],[420,520],[0,.7],{growl:.4}),V(.34,['ae','a'],[520,920,820],[.7,1,1],{growl:.6,gr:55,sub:.2,brk:7,wide:1.4}),V(.45,['a','o'],[820,380,210],[1,.8,.55],{growl:.8,gr:40,bi:.35,sub:.35,wide:1.4}),V(.3,['o','u'],[170,90,60],[.5,.35,0],{growl:1,gr:20,noise:.5,voiced:.6})],GOB);yield* bubbles(B,r,.95,.4,{rate:28,amp:.18,lo:180,hi:500});}],
   [1.35,function*(B,r){yield* voice(B,r,0,[V(.36,['u','a'],[440,660,360],[.8,1,.2],{growl:.7,gr:50,brk:5,burst:{f:1100,amp:.5},wide:1.4}),H(.16,'a',[.25,0]),GAP(.18),V(.34,['eu','u'],[150,110,75],[0,.4,0],{growl:1,gr:17,voiced:.5,noise:.4})],GOB);}],
   [1.25,function*(B,r){yield* voice(B,r,0,[V(.06,'i',[780,950],[0,.8],{growl:.3}),V(.38,['i','ae','a'],[950,1250,720],[.8,1,.7],{growl:.55,gr:62,brk:10,wide:1.5}),V(.32,['a','o'],[720,260,110],[.7,.5,0],{growl:.9,gr:30,sub:.5,bi:.3})],GOB);
    for(const at of [.8,.88,.97])yield* hiss(B,r,at,.008,.25,biquad('bp',1200,1.5,B.sr),.0005,1);}]],
  gob_bark:[[.85,function*(B,r){yield* voice(B,r,0,[V(.12,'a',[360,420],[.9,1],{rasp:.4,growl:.6,gr:34,burst:{f:1100,amp:.5}}),V(.04,'a',[420,380],[.7,.2],{growl:.5}),H(.04,'a',[.3,.6]),V(.1,'a',[400,470],[.8,.9],{growl:.4,gr:50}),V(.05,'a',[470,420],[.9,0]),GAP(.05),V(.22,['a','ae'],[480,700,520],[1,1,0],{growl:.55,gr:46,brk:4,burst:{f:1800,amp:.6},wide:1.3})],GOB);}],
   [.8,function*(B,r){yield* voice(B,r,0,[V(.1,'a',[420,470],[0,1],{growl:.4,gr:52}),GAP(.04),V(.08,'a',[380,430],[.8,.9],{rasp:.4,growl:.7,gr:30,burst:{f:1700,amp:.5}}),V(.03,'a',[430,400],[.8,.3]),GAP(.03),V(.22,['e','ae'],[470,640,500],[1,1,0],{growl:.5,gr:48,brk:4,burst:{f:1300,amp:.4},wide:1.3}),{...H(.025,'e',[.4,0]),noise:.6}],GOB);}],
   [.85,function*(B,r){yield* voice(B,r,0,[V(.08,'i',[460,520],[0,.8],{growl:.3}),V(.1,['i','a'],[520,620],[.8,1],{growl:.4,gr:55}),V(.04,'a',[620,560],[1,.4]),V(.06,'a',[480,520],[.7,1],{rasp:.4,growl:.8,gr:30}),V(.28,['a','o'],[560,740,450],[1,1,0],{growl:.5,gr:44,brk:4,wide:1.3})],GOB);}],
   [.7,function*(B,r){yield* voice(B,r,0,[H(.04,'o',[0,.6]),V(.15,['o','i'],[430,540],[.8,1],{growl:.5,gr:46}),GAP(.04),V(.08,'i',[480,540],[0,.9],{growl:.3}),V(.22,['a','ae'],[560,720,460],[1,1,0],{growl:.55,gr:50,brk:5,wide:1.3})],GOB);}]],
  gob_effort:[[.25,function*(B,r){yield* voice(B,r,0,[H(.035,'eu',[0,.7]),V(.09,'eu',[420,360],[1,0],{growl:.7,gr:44})],GOB);}],
   [.25,function*(B,r){yield* voice(B,r,0,[V(.14,['i','a'],[520,640,470],[1,1,0],{growl:.5,gr:56,burst:{f:1900,amp:.55}})],GOB);}],
   [.28,function*(B,r){yield* voice(B,r,0,[V(.16,'eu',[270,250,230],[.6,1,0],{growl:.95,gr:32,sub:.4,bi:.3})],GOB);yield* hiss(B,r,.17,.012,.3,biquad('bp',2200,1.2,B.sr),.0005,1.5);}]],
  gob_fall:[[.9,function*(B,r){yield* thud(B,r,0,{f:95,amp:.9,decay:.08,dust:.7});yield* hiss(B,r,0,.08,.5,biquad('lp',1500,.7,B.sr),.002,2);yield* thud(B,r,.12,{f:120,amp:.4,decay:.05,dust:.3});
   for(const [at,a]of [[.07,.45],[.2,.25],[.31,.12]])yield* metal(B,r,at,{f:1100+r()*300,amp:a,decay:.012,count:7,rattle:1});}],
   [.9,function*(B,r){yield* thud(B,r,0,{f:90,amp:.9,decay:.09,dust:.7});yield* hiss(B,r,0,.08,.5,biquad('lp',1400,.7,B.sr),.002,2);yield* thud(B,r,.14,{f:115,amp:.35,decay:.05,dust:.3});
   for(const [at,a]of [[.06,.6],[.19,.3],[.29,.15]])yield* wood(B,r,at,{f:330,amp:a,decay:.04,count:5});}]],
  // Grise-Gueule : une bête énorme. Conduit long, voix qui gronde à l'octave dessous, poitrine qui résonne.
  chief_roar:[[1.75,function*(B,r){yield* voice(B,r,0,[{...H(.09,'o',[0,.35,0]),noise:.7},V(.16,['u','o'],[58,80],[0,.7],{growl:1,gr:24,bi:.5,wide:1.3}),V(.95,['o','a','a'],[80,128,122,100],[.7,1,1,.85],{growl:.8,gr:31,bi:.6,noise:.32,rasp:.3,fr:37,brk:1.5,wide:1.35}),V(.38,['a','o','u'],[100,68,52],[.85,.45,0],{growl:1,gr:21,bi:.5,noise:.45,wide:1.3})],CHIEF);}]],
  chief_hurt:[[.5,function*(B,r){yield* voice(B,r,0,[H(.04,'a',[0,.7]),V(.3,['a','o'],[105,150,88],[.7,1,0],{growl:.9,gr:29,bi:.55,brk:3,wide:1.35})],CHIEF);}],
   [.45,function*(B,r){yield* voice(B,r,0,[V(.24,['u','o'],[115,140,85],[0,1,0],{growl:1,gr:27,bi:.6,wide:1.3})],CHIEF);yield* hiss(B,r,.25,.05,.3,biquad('bp',900,1,B.sr),.004,2);}]],
  chief_die:[[2.7,function*(B,r){yield* voice(B,r,0,[V(.1,'o',[85,110],[0,.8],{growl:.7,gr:28,bi:.4}),V(.62,'a',[110,155,140],[.8,1,1],{growl:.8,gr:31,bi:.6,brk:2,noise:.3,wide:1.35}),V(.75,['a','o','u'],[140,78,55],[1,.7,.4],{growl:1,gr:23,bi:.5,noise:.4,wide:1.3}),V(.5,'u',[52,38],[.4,0],{growl:1,gr:14,voiced:.5,noise:.5})],CHIEF);
   yield* bubbles(B,r,1.5,.5,{rate:24,amp:.2,lo:150,hi:420});yield* hiss(B,r,2,.5,.05,biquad('lp',700,.7,B.sr),.08,1.5);}]],
  chief_effort:[[.32,function*(B,r){yield* voice(B,r,0,[H(.04,'a',[0,.7]),V(.18,'a',[110,88],[1,0],{growl:.9,gr:30,bi:.5})],CHIEF);}],
   [.34,function*(B,r){yield* voice(B,r,0,[V(.05,'ng',[85,95],[0,.6],{growl:.8,gr:26}),V(.2,['ng','eu'],[95,125,80],[.6,1,0],{growl:.9,gr:28,bi:.55})],CHIEF);}]],
  chief_fall:[[1.3,function*(B,r){yield* thud(B,r,0,{f:58,amp:1,decay:.18,dust:1});yield* metal(B,r,0,{f:280,amp:.5,decay:.04,count:11,rattle:3});yield* metal(B,r,.02,{f:700,amp:.3,decay:.015,count:8,rattle:2});
   for(const [at,a]of [[.1,.5],[.3,.25],[.45,.12]])yield* metal(B,r,at,{f:450+r()*200,amp:a,decay:.02,count:9,rattle:2});yield* crackle(B,r,.05,.6,{rate:90,amp:.12,lo:800,hi:3500});}]],
 };
 // Traînée de caisse : boucle sans couture (frottement bois sur pierre et petits accrocs).
 const LOOPS={crate_scrape:[2.4,function*(B,r){yield* scrape(B,r,0,B.n/B.sr,{amp:.6,f:600,q:.7,grit:25,low:160,attack:0,release:0});yield* creak(B,r,0,B.n/B.sr,{rate:[30,38],res:TIMBER,amp:.25,attack:0,release:0,wobble:.4});}]};
 // Niveau relatif de chaque famille, après égalisation des échantillons par le jeu.
 const LEVEL={key:.6,door_unlock:.8,door_open:.7,door_locked:.7,door_slam:1,gate_rise:.75,gate_drop:.9,gate_cells:.75,cage_open:.75,lever:.8,plate_down:.6,plate_up:.5,winch:.7,lift:.7,
  crate_grab:.45,crate_release:.6,crate_scrape:.5,crate_hit:.8,crate_break:1,barrel_hit:.8,barrel_break:1,
  gob_hurt:.75,gob_die:.85,gob_bark:.7,gob_effort:.5,gob_fall:.7,chief_roar:1,chief_hurt:.9,chief_die:1,chief_effort:.7,chief_fall:.9};
 // Fabrication : chaque variante est un générateur ; la fin du tampon s'éteint doucement, le pic est ramené à 0,9.
 // 32 kHz suffisent à ces bruitages et allègent le calcul d'un tiers.
 function* render(c,sec,gen,seed,loop=false){const sr=Math.min(c.sampleRate,32000),n=Math.ceil(sr*sec),f=loop?Math.floor(sr*.3):0,d=new Float32Array(n+f),B={d,sr,n:n+f};
  yield* gen(B,rng(seed));let peak=0;for(const v of d)peak=Math.max(peak,Math.abs(v));const g=peak>0?.9/peak:0,b=c.createBuffer(1,n,sr),o=b.getChannelData(0);
  for(let i=0;i<n;i++)o[i]=(loop&&i<f?d[i]*(i/f)+d[n+i]*(1-i/f):d[i])*g*(loop?1:Math.min(1,(n-i)/(sr*.02)));return b;}
 const FAMILY=Object.keys(R);
 // Ordre : gobelins et casse d'abord (le combat vient vite), mécanismes ensuite.
 const ORDER=[...FAMILY.filter(k=>/^(gob|chief|crate_hit|crate_break|barrel)/.test(k)),...FAMILY.filter(k=>!/^(gob|chief|crate_hit|crate_break|barrel)/.test(k)),'crate_scrape'];
 function create(c,{budget=3}={}){const bank={},jobs=[];
  for(const name of ORDER){if(LOOPS[name]){jobs.push([name,0,render(c,LOOPS[name][0],LOOPS[name][1],7919,true)]);continue;}
   const list=Array.isArray(R[name][0])?R[name]:[R[name]];const reps=list.length>1?1:Array.isArray(R[name][0])?1:3;let seed=0;for(const ch of name)seed=(seed*31+ch.charCodeAt(0))>>>0;
   list.forEach(([sec,gen],v)=>{for(let k=0;k<reps;k++)jobs.push([name,v*reps+k,render(c,sec,gen,seed+v*977+k*131)]);});}
  const last={};
  function prepare(ms=budget){const end=clock()+ms;while(jobs.length&&clock()<end){const [name,i,gen]=jobs[0],step=gen.next();if(!step.done)continue;jobs.shift();(bank[name]??=[])[i]=step.value;}return !jobs.length;}
  // Une variante au hasard, jamais deux fois la même de suite.
  function pick(name,random=Math.random){const list=(bank[name]||[]).filter(Boolean);if(!list.length)return null;let i=Math.floor(random()*list.length);if(list.length>1&&list[i]===last[name])i=(i+1)%list.length;return last[name]=list[i];}
  return {prepare,pick,bank,get ready(){return !jobs.length;},get pending(){return jobs.length;}};}
 return {create,names:[...ORDER],LEVEL,loops:Object.keys(LOOPS)};
})();

// Branchement : sous terre, la banque se fabrique en tâche de fond et un guetteur compare l'état du donjon d'une image
// à l'autre (portes, herses, leviers, dalles, caisse, treuil, monte-charge, clés, gobelins). Chaque changement joue
// son bruitage sur le bus des bruitages (donc dans la réverbération de pierre), placé selon sa position à l'écran.
// Hors du donjon, la banque est libérée.
Sound.prototype.dungeonPlay=function(name,{x,y,delay=0,vol=1,spread=.04}={}){
 const buf=name&&this.dsfx?.pick(name);if(!buf||!this.enabled||!this.sfxOn||!this.ctx||!this.master)return null;
 const c=this.ctx,p=this.dwatch?.game?.player;let pan=0,near=1;
 if(p&&Number.isFinite(x)&&Number.isFinite(y)){near=Math.max(0,1-Math.hypot(x-p.x,y-p.y)/380)**1.3;const P=WorldProjection.point;pan=clamp((P(x,y).x-P(p.x,p.y).x)/240,-.85,.85);}
 if(near<.02)return null;
 const src=c.createBufferSource(),g=c.createGain(),panner=c.createStereoPanner();src.buffer=buf;src.playbackRate.value=1+(Math.random()*2-1)*spread;
 g.gain.value=vol*near*(DungeonSfx.LEVEL[name]??.7)*this.sampleTrim(buf);panner.pan.value=pan;src.connect(g);g.connect(panner);panner.connect(this.master);
 src.onended=()=>{src.disconnect();g.disconnect();panner.disconnect();};src.start(c.currentTime+delay);return src;
};
// Traînée de la caisse : boucle dont le niveau et la hauteur suivent la vitesse.
Sound.prototype.dungeonScrape=function(level){const c=this.ctx;if(!c||!this.master)return;let L=this.dscrape;
 if(level>0&&!L){const buf=this.dsfx?.pick('crate_scrape');if(!buf)return;const src=c.createBufferSource(),g=c.createGain();src.buffer=buf;src.loop=true;g.gain.value=0;src.connect(g);g.connect(this.master);src.start();L=this.dscrape={src,g,quiet:0};}
 if(!L)return;const t=c.currentTime;L.g.gain.setTargetAtTime(level*DungeonSfx.LEVEL.crate_scrape*this.sampleTrim(L.src.buffer),t,.05);L.src.playbackRate.setTargetAtTime(.85+.3*level,t,.08);
 L.quiet=level>0?0:L.quiet+1;if(L.quiet>45){try{L.src.stop();}catch{}L.src.disconnect();L.g.disconnect();this.dscrape=null;}
};
Sound.prototype.dungeonSnapshot=function(g){const F=FirstDungeon,s=F.state(g),d=g.dungeon,e=F.current(g),near=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y)<10;
 const crate=g.dungeonGrip?s.crates.find(b=>b.id===g.dungeonGrip.id):null;
 return {game:g,floor:d.floor,open:new Set(s.open),levers:s.levers.length,keys:d.keys.length,lift:!!d.lift,fairy:!!d.fairy,bossFight:!!d.bossFight,bossDead:!!d.bossDead,grip:g.dungeonGrip?.id??null,
  plates:(e.mecanismes||[]).flatMap(m=>m.dalles||[]).filter(q=>s.crates.some(b=>near(b,F.at(q)))).map(q=>q.join(',')),crate:crate?{x:crate.x,y:crate.y}:null};
};
Sound.prototype.watchDungeon=function(g,active,dt){
 if(!(active&&g?.dungeon?.active&&!g.journey&&this.enabled&&this.sfxOn&&this.ctx&&this.master)){this.dungeonScrape(0);if(!g?.dungeon?.active){this.dwatch=null;this.dsfx=null;}return;}
 this.dsfx??=DungeonSfx.create(this.ctx);this.dsfx.prepare(3);
 const F=FirstDungeon,D=F.design,e=F.current(g),p=g.player,was=this.dwatch,now=this.dwatch=this.dungeonSnapshot(g);
 const play=(name,pt=p,o={})=>this.dungeonPlay(name,{x:pt.x,y:pt.y,...o});
 // Gobelins : touchés, morts, élan d'attaque et cris d'alerte.
 this.dfoes??=new WeakMap();this.dlines??=new WeakSet();
 for(const f of g.enemies){if(f.kind!=='goblin')continue;const m=this.dfoes.get(f),swing=Number.isFinite(f.swingElapsed),who=f.chief?'chief':'gob';
  if(m&&was){if(f.dead&&!m.dead){play(who+'_die',f);play(who+'_fall',f,{delay:.42});}
   else if(!f.dead&&f.hp<m.hp&&g.time-(m.voice??-9)>.3){play(who+'_hurt',f);m.voice=g.time;}
   if(!f.dead&&swing&&!m.swing&&Math.random()<(f.chief?.8:.55))play(who+'_effort',f,{delay:f.chief?.5:.42});}
  this.dfoes.set(f,{hp:f.hp,dead:!!f.dead,swing,voice:m?.voice});}
 for(const line of GoblinTactics.speech(g))if(!this.dlines.has(line)){this.dlines.add(line);if(was)play(line.actor.chief?'chief_roar':'gob_bark',line.actor);}
 // Caisse saisie, lâchée, traînée.
 const moved=now.crate&&was?.crate&&was.grip===now.grip?Math.hypot(now.crate.x-was.crate.x,now.crate.y-was.crate.y):0;
 this.dungeonScrape(dt>0?clamp(moved/dt/24,0,1):0);
 if(!was||was.game!==g)return;
 if(was.floor!==now.floor){if(now.lift&&D.monte_charge.arrets.includes(was.floor)&&D.monte_charge.arrets.includes(now.floor)&&Math.hypot(p.x-(D.monte_charge.case[0]+.5)*32,p.y-(D.monte_charge.case[1]+.5)*32)<48)play('lift');return;}
 if(now.grip!==null&&was.grip===null)play('crate_grab',now.crate);
 if(now.grip===null&&was.grip!==null)play('crate_release',was.crate||p);
 const lever=now.levers>was.levers||now.fairy&&!was.fairy,plate=now.plates.length!==was.plates.length;
 if(lever)play('lever');if(now.fairy&&!was.fairy)play('cage_open',p,{delay:.45});
 for(const q of now.plates)if(!was.plates.includes(q))play('plate_down',F.at(q.split(',').map(Number)));
 for(const q of was.plates)if(!now.plates.includes(q))play('plate_up',F.at(q.split(',').map(Number)));
 if(now.keys>was.keys)play('key');
 if(now.lift&&!was.lift)play('winch');
 const delay=lever?.45:plate?.25:0;let cells=false;
 for(const k of now.open)if(!was.open.has(k)){const w=e.murs[k],pt=F.edge(k);
  if(w==='porte-cellule'){if(!cells)play('gate_cells',pt,{delay});cells=true;}else if(w==='herse')play('gate_rise',pt,{delay});else if(w==='porte-verrouillee')play('door_unlock',pt);else play('door_open',pt,{delay});}
 for(const k of was.open)if(!now.open.has(k)&&e.murs[k]==='herse')play('gate_drop',F.edge(k));
 const bossDoor=Object.keys(e.murs).find(k=>e.murs[k]==='porte');
 if(bossDoor&&now.bossFight&&!was.bossFight&&!now.bossDead)play('door_slam',F.edge(bossDoor));
 if(bossDoor&&now.bossDead&&!was.bossDead)play('door_open',F.edge(bossDoor),{delay:2.2});
};
const dungeonSfxFootsteps=Sound.prototype.updateFootsteps;
Sound.prototype.updateFootsteps=function(game,active,dt){dungeonSfxFootsteps.call(this,game,active,dt);this.watchDungeon(game,active,dt);};
// Les événements « dsfx » (caisse ou tonneau frappé, porte verrouillée) viennent du jeu ; la porte du donjon a son propre son.
const dungeonSfxFx=Sound.prototype.fx;
Sound.prototype.fx=function(name,ev={}){if(name==='dsfx'){this.dungeonPlay(ev.name,ev);return;}if(name==='door'&&this.dwatch)return;return dungeonSfxFx.call(this,name,ev);};
