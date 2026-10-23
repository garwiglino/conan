'use strict';
// Partitions des bruitages 8 bits. Chaque bruitage est écrit image par image (60 images par seconde) pour les quatre
// voix d'une puce façon NES : deux impulsions (rapport cyclique 0 = 12,5 %, 1 = 25 %, 2 = 50 %, 3 = 75 %), le triangle
// (sans réglage de volume, comme sur la console) et le bruit (16 hauteurs, 0 la plus aiguë ; mode court = grain
// métallique). Les volumes tiennent sur 4 bits (0 à 15). Une famille a plusieurs variantes et un niveau de mixage en dB
// (crête RMS sur 50 ms, bus des bruitages compris) ; scripts/build-chip-sfx.cjs en tire audio/chip-sfx.json et les MIDI.
//
// Règles de son (demandes de Lino) : du vrai 8 bits, pas clinquant ; les armes claquent dans le médium et l'aigu (rien
// ne descend longtemps sous 150 Hz), chaque arme a son attaque, et la dague se sent par un transitoire très net.
// Sous terre, rien ne sonne comme une cloche : les métaux claquent en mode court, une ou deux images, puis se taisent.

const rng=seed=>{let s=seed>>>0||1;return ()=>(s=(Math.imul(s,1664525)+1013904223)>>>0)/4294967296;};
const val=(v,i)=>typeof v==='function'?v(i):Array.isArray(v)?v[Math.min(i,v.length-1)]:v;
const r2=x=>Math.round(x*100)/100;
// Courbe par points [image, valeur], interpolée linéairement.
const K=(...p)=>i=>{if(i<=p[0][0])return p[0][1];for(let j=1;j<p.length;j++)if(i<=p[j][0]){const [a,x]=p[j-1],[b,y]=p[j];return x+(y-x)*(i-a)/(b-a);}return p[p.length-1][1];};
// Décroissance de v vers 0 en n images (k > 1 : chute plus rapide au début).
const fall=(v,n,k=1)=>i=>v*Math.max(0,1-i/n)**k;
const add=(a,t)=>a.map(x=>x+t);

function score(){const V={p1:[],p2:[],tri:[],noise:[]},put=(ch,f,x)=>{if(f>=0)V[ch][f]=x;};
 const S={V,
  pulse(ch,at,n,{note,vol,duty=2}){for(let i=0;i<n;i++){const v=Math.round(val(vol,i)),nt=val(note,i);put(ch,at+i,v>0&&nt!=null?[r2(nt),Math.min(15,v),val(duty,i)]:null);}return S;},
  p1(at,n,o){return S.pulse('p1',at,n,o);},
  p2(at,n,o){return S.pulse('p2',at,n,o);},
  tri(at,n,note){for(let i=0;i<n;i++){const nt=val(note,i);put('tri',at+i,nt==null?null:[r2(nt)]);}return S;},
  noise(at,n,{period,vol,mode=0}){for(let i=0;i<n;i++){const v=Math.round(val(vol,i));put('noise',at+i,v>0?[Math.max(0,Math.min(15,Math.round(val(period,i)))),Math.min(15,v),val(mode,i)?1:0]:null);}return S;}};
 return S;}

// Partition compacte : pour chaque voix, des événements [image, durée, valeurs…] (images identiques fusionnées).
function compile(S,loop=false){let len=0;for(const a of Object.values(S.V))for(let i=a.length-1;i>=0;i--)if(a[i]){len=Math.max(len,i+1);break;}
 const out={len};
 for(const ch of ['p1','p2','tri','noise']){const a=S.V[ch],ev=[];let i=0;
  while(i<len){const x=a[i];if(!x){i++;continue;}let j=i+1;while(j<len&&a[j]&&a[j].join()===x.join())j++;ev.push(i,j-i,...x);i=j;}
  if(ev.length)out[ch]=ev;}
 if(loop)out.loop=1;return out;}

// Cri de créature 8 bits : une courbe de hauteur, une rugosité qui alterne d'une image à l'autre (le grain des cris de
// monstres de la console), un peu de hasard, une seconde impulsion décalée pour l'âpreté et un souffle sur le bruit.
function cry(S,r,{at=0,len,pitch,vol,duty=0,rough=1.5,jit=.6,second=-6,secondVol=.45,secondDuty=1,breath=0,breathPeriod=6}){
 const J=Array.from({length:len},()=>(r()*2-1)*jit),R=i=>(i%2?1:-1)*val(rough,i)/2;
 S.p1(at,len,{note:i=>pitch(i)+R(i)+J[i],vol,duty});
 if(second!=null)S.p2(at,len,{note:i=>pitch(i)+second-R(i)+J[(i+3)%len],vol:i=>val(vol,i)*secondVol,duty:secondDuty});
 if(breath)S.noise(at,len,{period:i=>breathPeriod+(i%3===1?1:0),vol:i=>val(vol,i)*breath/15});}

const CLASS_TITLE={blade:'épée, sabre',dagger:'dague',heavy:'hache, masse',pole:'lance, bâton, glaive'};
const F={};
const fam=(name,group,title,level,variants,recipe,loop=false)=>{F[name]={group,title,level,variants,recipe,loop};};

// ---- Armes : élan et impact par classe d'arme, et le coup final (4e coup de l'enchaînement) plus ample.
const SW={
 blade:(S,t)=>{S.noise(0,9,{period:[6,5,4,3,3,2,3,4,5],vol:[3,7,10,11,9,7,5,3,1]});S.p1(1,6,{note:K([0,95+t],[5,83+t]),vol:[3,5,5,4,2,1],duty:0});},
 dagger:(S,t)=>{S.noise(0,6,{period:[4,2,1,1,2,4],vol:[5,10,11,7,3,1]});S.p1(0,4,{note:K([0,101+t],[3,94+t]),vol:[4,5,3,1],duty:0});},
 heavy:(S,t)=>{S.noise(0,12,{period:[9,8,7,6,5,5,5,6,7,8,9,10],vol:[2,4,7,9,10,10,9,7,5,3,2,1]});S.p1(2,7,{note:K([0,72+t],[6,63+t]),vol:[2,3,4,4,3,2,1],duty:1});},
 pole:(S,t)=>{S.noise(0,10,{period:[7,6,5,4,3,3,4,5,6,7],vol:[3,6,9,10,10,8,6,4,2,1]});S.p1(1,6,{note:K([0,88+t],[5,79+t]),vol:[3,4,4,3,2,1],duty:1});}};
const SW_BIG={
 blade:(S,t)=>{S.noise(0,13,{period:[7,6,5,4,3,3,2,2,3,4,5,6,7],vol:[3,6,9,11,12,12,11,9,7,5,3,2,1]});S.p1(2,8,{note:K([0,96+t],[7,79+t]),vol:[3,5,6,6,5,3,2,1],duty:0});S.p2(3,7,{note:K([0,84+t],[6,72+t]),vol:[2,4,4,3,2,1,1],duty:1});},
 dagger:(S,t)=>{SW.dagger(S,t);S.noise(6,6,{period:[3,2,1,1,2,3],vol:[6,10,12,8,4,1]});S.p1(6,5,{note:K([0,103+t],[4,95+t]),vol:[4,6,4,2,1],duty:0});},
 heavy:(S,t)=>{S.noise(0,16,{period:[10,9,8,7,6,5,5,4,4,5,6,7,8,9,10,11],vol:[2,4,6,8,10,11,12,12,11,9,7,5,4,3,2,1]});S.p1(3,10,{note:K([0,74+t],[9,60+t]),vol:[2,3,4,5,5,4,3,2,1,1],duty:1});S.p2(5,8,{note:K([0,67+t],[7,57+t]),vol:[2,3,3,3,2,2,1,1],duty:2});},
 pole:(S,t)=>{S.noise(0,13,{period:[8,7,6,5,4,3,3,3,4,5,6,7,8],vol:[3,5,8,10,11,12,11,9,7,5,3,2,1]});S.p1(2,8,{note:K([0,90+t],[7,77+t]),vol:[3,4,5,5,4,3,2,1],duty:1});S.p2(4,6,{note:K([0,95+t],[5,87+t]),vol:[2,3,3,2,1,1],duty:0});}};
const HIT={
 blade:(S,t)=>{S.noise(0,9,{period:[2,4,5,6,7,8,9,10,10],vol:[15,13,10,8,6,4,3,2,1]});S.p2(0,2,{note:[91+t,86+t],vol:[10,5],duty:0});S.p1(0,6,{note:add([79,73,68,64,61,59],t),vol:[14,12,9,6,3,1],duty:1});S.tri(0,3,add([62,56,51],t));},
 // Petite lame : transitoire très aigu et très court, deux clics décalés d'une image (« tchk »), pas de grave.
 dagger:(S,t)=>{S.noise(0,6,{period:[1,3,4,6,7,8],vol:[15,12,8,5,3,1]});S.p1(0,3,{note:add([96,90,85],t),vol:[13,9,4],duty:0});S.p2(1,3,{note:add([84,79,75],t),vol:[10,6,2],duty:1});},
 heavy:(S,t)=>{S.noise(0,12,{period:[3,5,6,7,8,8,9,9,10,10,11,11],vol:[15,14,12,10,8,7,5,4,3,2,1,1]});S.p2(0,2,{note:[84+t,78+t],vol:[9,5],duty:0});S.p1(0,7,{note:add([72,65,60,56,53,51,50],t),vol:[15,13,10,7,5,3,1],duty:2});S.tri(0,5,add([60,54,49,45,42],t));},
 pole:(S,t)=>{S.noise(0,8,{period:[3,4,6,7,8,9,10,11],vol:[15,12,9,7,5,3,2,1]});S.p2(0,2,{note:[88+t,83+t],vol:[8,4],duty:0});S.p1(0,6,{note:add([76,70,65,62,60,58],t),vol:[14,11,8,5,3,1],duty:1});S.tri(0,3,add([60,54,49],t));}};
const HIT_BIG={
 blade:(S,t)=>{S.noise(0,14,{period:[2,3,5,6,6,7,8,8,9,9,10,10,11,11],vol:[15,15,13,11,10,8,7,6,5,4,3,2,1,1]});S.p2(0,3,{note:add([93,88,84],t),vol:[11,7,3],duty:0});S.p1(0,9,{note:K([0,81+t],[8,57+t]),vol:[15,13,11,9,7,5,3,2,1],duty:1});S.tri(0,4,add([64,57,51,46],t));},
 dagger:(S,t)=>{S.noise(0,9,{period:[1,2,4,5,6,7,8,9,10],vol:[15,14,11,8,6,4,3,2,1]});S.p1(0,4,{note:add([98,92,86,82],t),vol:[14,10,6,2],duty:0});S.p2(0,5,{note:add([86,80,75,71,68],t),vol:[12,9,6,3,1],duty:1});S.tri(0,2,add([67,60],t));S.noise(4,3,{period:[2,4,6],vol:[9,5,2]});},
 heavy:(S,t)=>{S.noise(0,18,{period:[3,4,5,6,7,5,6,7,8,8,9,9,10,10,11,11,12,12],vol:[15,15,14,12,10,13,11,9,8,7,6,5,4,3,2,2,1,1]});S.p2(0,3,{note:add([86,80,74],t),vol:[10,6,3],duty:0});S.p1(0,10,{note:K([0,74+t],[9,50+t]),vol:[15,14,12,10,8,6,4,3,2,1],duty:2});S.tri(0,6,add([62,56,51,47,44,42],t));},
 pole:(S,t)=>{S.noise(0,12,{period:[2,4,5,6,7,8,8,9,10,10,11,12],vol:[15,14,12,10,8,7,5,4,3,2,1,1]});S.p2(0,3,{note:add([90,85,81],t),vol:[10,6,3],duty:0});S.p1(0,8,{note:K([0,78+t],[7,56+t]),vol:[15,12,10,8,6,4,2,1],duty:1});S.tri(0,4,add([62,56,51,47],t));}};
const TR=[0,1,-1];
for(const cls of Object.keys(SW)){
 fam('swing_'+cls,'Armes','Élan, '+CLASS_TITLE[cls],-40,3,(S,r,k)=>SW[cls](S,TR[k]));
 fam('swing_'+cls+'_big','Armes','Coup final, élan, '+CLASS_TITLE[cls],-38,2,(S,r,k)=>SW_BIG[cls](S,TR[k]));
 fam('hit_'+cls,'Armes','Impact, '+CLASS_TITLE[cls],-33,3,(S,r,k)=>HIT[cls](S,TR[k]));
 fam('hit_'+cls+'_big','Armes','Coup final, impact, '+CLASS_TITLE[cls],-32,2,(S,r,k)=>HIT_BIG[cls](S,TR[k]));}
// Coup fatal : s'ajoute à l'impact final de l'arme. Chute de hauteur courte et queue de bruit, sans jingle.
fam('kill','Armes','Coup fatal',-36,3,(S,r,k)=>{const t=TR[k];S.p1(2,12,{note:K([0,86+t],[11,60+t]),vol:fall(11,12,1.2),duty:2});S.noise(3,12,{period:K([0,8],[11,12]),vol:fall(7,12)});});

// ---- Défense et blessures
fam('parry','Combat','Parade parfaite',-36,3,(S,r,k)=>{const t=TR[k];S.noise(0,6,{period:[3,4,4,5,5,6],vol:[15,12,9,6,3,1],mode:[1,1,1,1,0,0]});
 S.p1(0,7,{note:add([100,100,99.5,99,98.5,98,97.5],t),vol:[12,10,7,5,3,2,1],duty:0});S.p2(1,5,{note:add([94,93.5,93,92.5,92],t),vol:[9,6,4,2,1],duty:1});});
fam('block','Combat','Coup bloqué',-38,3,(S,r,k)=>{const t=TR[k];S.noise(0,5,{period:[5,7,8,9,10],vol:[13,9,6,3,1],mode:[1,1,0,0,0]});S.p1(0,4,{note:add([74,69,66,64],t),vol:[11,7,4,1],duty:1});S.tri(0,2,add([57,52],t));});
fam('dodge','Combat','Esquive',-45,2,(S,r,k)=>{S.noise(0,7,{period:add([5,4,3,2,2,3,4],k),vol:[2,5,7,7,5,3,1]});S.p1(0,4,{note:K([0,74+k],[3,81+k]),vol:[2,3,2,1],duty:0});});
fam('hurt','Combat','Kaldor touché',-35,3,(S,r,k)=>{const t=TR[k];S.noise(0,5,{period:[5,7,8,9,10],vol:[12,9,6,3,1]});S.p1(0,10,{note:i=>67+t-i+(i%2?-5:0),vol:fall(14,10,.8),duty:2});});
fam('hurt_big','Combat','Kaldor durement touché',-34,2,(S,r,k)=>{const t=TR[k];S.noise(0,9,{period:[4,6,7,8,8,9,10,11,12],vol:[14,12,10,8,6,4,3,2,1]});
 S.p1(0,16,{note:i=>69+t-i*.9+(i%2?-5:0),vol:fall(15,16,.8),duty:2});S.p2(1,12,{note:i=>63+t-i*.9+(i%2?-4:0),vol:fall(7,12),duty:1});});
fam('life_lost','Combat','Vie perdue',-36,1,S=>{const vib=i=>.6*Math.sin(i*2*Math.PI/7.5);S.noise(0,10,{period:K([0,5],[9,12]),vol:fall(12,10)});
 S.p1(0,70,{note:i=>K([0,74],[20,67],[69,50])(i)+vib(i),vol:K([0,13],[20,10],[69,0]),duty:2});S.p2(4,66,{note:i=>K([0,74],[16,67],[65,50])(i)-.12+vib(i),vol:K([0,6],[60,0]),duty:1});S.tri(24,40,K([0,50],[39,43]));});

// ---- Objets et monde
fam('loot','Objets','Pièce ramassée',-45,3,(S,r,k)=>{const t=[0,2,-1][k];S.p1(0,3,{note:83+t,vol:[8,8,7],duty:1});S.p1(3,10,{note:88+t,vol:fall(9,10),duty:1});});
fam('flask','Objets','Fiole bue',-42,2,(S,r,k)=>{[0,7,14].forEach((at,j)=>S.p1(at,5,{note:add([55,58,62,64,64],j+k),vol:[6,9,8,5,2],duty:2}));S.noise(0,3,{period:10,vol:[3,2,1]});
 S.p2(21,12,{note:i=>[76,79,84][Math.min(2,i>>2)]+k,vol:fall(7,12),duty:1});});
fam('seal','Progression','Sceau de Nharos',-40,1,S=>{const m=[67,72,76,79];m.forEach((n,j)=>S.p1(j*7,7,{note:n,vol:fall(11,7,.5),duty:2}));S.p1(28,24,{note:84,vol:fall(11,24),duty:2});
 m.forEach((n,j)=>S.p2(3+j*7,7,{note:n,vol:fall(5,7),duty:1}));S.p2(31,22,{note:79,vol:fall(6,22),duty:1});S.tri(0,14,55);S.tri(14,14,60);S.tri(28,16,55);});
fam('chest_open','Objets','Coffre ouvert',-41,2,(S,r,k)=>{S.p1(0,14,{note:K([0,55+k],[13,59+k]),vol:i=>i%2?3:7,duty:0});S.noise(0,14,{period:11,vol:i=>i%3?1:2});
 S.noise(15,4,{period:[5,7,9,11],vol:[12,7,3,1]});S.tri(15,2,[55,50]);S.p2(18,3,{note:79,vol:6,duty:1});S.p2(21,10,{note:84,vol:fall(7,10),duty:1});});
// Grincement de gonds : impulsion fine dont le volume bat d'une image à l'autre, puis la porte cogne.
fam('door_open','Objets','Porte ouverte',-42,3,(S,r,k)=>{const t=TR[k];S.p1(0,20,{note:K([0,50+t],[19,55+t]),vol:i=>i%2?2:6,duty:0});S.p2(2,16,{note:K([0,57.4+t],[15,61+t]),vol:i=>i%3?1:3,duty:0});
 S.noise(20,4,{period:[8,10,11,12],vol:[9,6,3,1]});S.tri(20,2,[53,48]);});
fam('door_close','Objets','Porte fermée',-40,2,(S,r,k)=>{S.noise(0,7,{period:[7,9,10,11,12,12,13],vol:[14,11,8,6,4,2,1]});S.p1(0,4,{note:add([64,58,54,52],k),vol:[11,7,4,1],duty:1});S.tri(0,4,add([55,50,46,43],k));S.noise(7,3,{period:[4,5,6],vol:[6,3,1]});});
fam('lever','Objets','Levier',-41,2,(S,r,k)=>{const t=k?-1:0;S.noise(0,3,{period:[4,6,8],vol:[12,7,3]});S.p1(0,2,{note:[70+t,66+t],vol:[9,4],duty:1});S.noise(5,1,{period:5,vol:7});S.noise(8,1,{period:5,vol:6});
 S.noise(12,5,{period:[6,8,9,10,11],vol:[14,9,5,3,1]});S.p1(12,3,{note:add([62,57,54],t),vol:[10,6,2],duty:1});S.tri(12,3,[55,50,46]);});
// Casse : bois (caisses), tonneau creux cerclé, poterie.
const CRATE_HIT=(S,t)=>{S.noise(0,6,{period:[6,8,9,10,11,12],vol:[14,10,7,4,2,1]});S.p1(0,4,{note:add([68,62,58,56],t),vol:[12,8,4,1],duty:1});S.tri(0,2,add([57,52],t));S.noise(5,1,{period:4,vol:4});};
const BARREL_HIT=(S,t)=>{S.noise(0,5,{period:[7,9,10,11,12],vol:[13,9,6,3,1]});S.p1(0,6,{note:add([60,57,55,54,53,53],t),vol:[12,10,7,5,3,1],duty:2});S.tri(0,3,add([60,55,52],t));};
const JAR_HIT=(S,t)=>{S.noise(0,4,{period:[2,4,6,7],vol:[13,8,4,1]});S.p1(0,3,{note:add([86,81,78],t),vol:[10,5,2],duty:0});};
const WOOD_BREAK=(S,r,t)=>{S.noise(0,7,{period:[5,7,8,9,10,11,12],vol:[15,12,9,7,5,3,1]});S.p1(0,6,{note:K([0,67+t],[5,54+t]),vol:[13,10,7,5,3,1],duty:1});S.tri(0,4,[57,52,48,45]);
 for(const [at,p,v]of [[3,5,12],[6,6,9],[9,7,7],[13,8,5],[17,9,3]])S.noise(at+Math.floor(r()*2),3,{period:[p,p+2,p+3],vol:[v,Math.round(v*.5),Math.round(v*.2)]});
 S.p2(4,1,{note:72+r()*4,vol:6,duty:1});S.p2(10,1,{note:69+r()*4,vol:4,duty:1});};
fam('crate_hit','Objets','Caisse frappée',-38,3,(S,r,k)=>CRATE_HIT(S,TR[k]));
fam('barrel_hit','Objets','Tonneau frappé',-38,3,(S,r,k)=>BARREL_HIT(S,TR[k]));
fam('jar_hit','Objets','Jarre fêlée',-39,2,(S,r,k)=>JAR_HIT(S,TR[k]));
fam('crate_break','Objets','Caisse brisée',-36,3,(S,r,k)=>WOOD_BREAK(S,r,TR[k]));
fam('barrel_break','Objets','Tonneau brisé',-36,3,(S,r,k)=>{WOOD_BREAK(S,r,TR[k]-2);S.p1(0,6,{note:add([58,55,53,52,51,51],TR[k]),vol:[13,11,8,5,3,1],duty:2});
 S.noise(8,2,{period:5,vol:[8,3],mode:1});S.noise(15,2,{period:6,vol:[5,2],mode:1});});
fam('jar_break','Objets','Jarre brisée',-37,3,(S,r)=>{S.noise(0,8,{period:[1,2,3,4,5,6,7,8],vol:[15,13,10,8,6,4,2,1]});S.p1(0,2,{note:[84,80],vol:[11,5],duty:1});
 for(const [at,v]of [[2,8],[4,7],[7,6],[9,4],[12,3],[15,2]])S.p2(at,1,{note:93+r()*8,vol:v,duty:0});
 for(const [at,v]of [[5,6],[10,4],[14,2]])S.noise(at,2,{period:2,vol:[v,v>>1]});});
fam('bodyfall','Objets','Corps qui tombe',-41,3,(S,r,k)=>{const t=TR[k];S.noise(0,8,{period:[8,9,10,11,12,12,13,13],vol:[13,11,8,6,4,3,2,1]});S.p1(0,4,{note:add([62,56,52,50],t),vol:[9,6,3,1],duty:2});
 S.tri(0,4,add([55,50,46,43],t));S.noise(10,3,{period:[10,11,12],vol:[5,3,1]});});
fam('dissolve','Objets','Ennemi qui se dissipe',-44,1,S=>{S.noise(0,40,{period:K([0,3],[39,12]),vol:K([0,2],[6,7],[39,0])});S.p1(0,36,{note:i=>84-i*.45+[0,7,12][i%3],vol:K([0,1],[6,5],[35,0]),duty:0});});

// ---- Progression
fam('levelup','Progression','Niveau gagné',-40,1,S=>{const N=[72,76,79,84];N.forEach((n,j)=>S.p1(j*4,4,{note:n,vol:11,duty:2}));S.p1(16,18,{note:84,vol:fall(11,18),duty:2});
 N.forEach((n,j)=>S.p2(2+j*4,4,{note:n,vol:5,duty:1}));S.p2(18,16,{note:84,vol:fall(5,16),duty:1});S.tri(0,4,48);S.tri(4,4,52);S.tri(8,4,55);S.tri(12,14,60);});
fam('questnew','Progression','Nouvelle quête',-42,1,S=>{S.p1(0,5,{note:76,vol:[10,10,9,8,7],duty:1});S.p1(5,5,{note:81,vol:[10,10,9,8,7],duty:1});S.p1(10,14,{note:88,vol:fall(10,14),duty:1});
 S.p2(3,5,{note:76,vol:4,duty:2});S.p2(8,5,{note:81,vol:4,duty:2});S.p2(13,13,{note:88,vol:fall(4,13),duty:2});});
fam('questaccept','Progression','Quête acceptée',-43,1,S=>{S.p1(0,4,{note:72,vol:[10,10,9,8],duty:1});S.p1(4,12,{note:79,vol:fall(10,12),duty:1});S.p2(0,4,{note:67,vol:5,duty:2});S.p2(4,12,{note:76,vol:fall(5,12),duty:2});});
fam('questdone','Progression','Quête accomplie',-40,1,S=>{for(const [at,n,nt]of [[0,3,72],[3,3,76],[6,3,79],[9,6,84],[15,3,79],[18,22,84]])S.p1(at,n,{note:nt,vol:n>6?fall(11,n):11,duty:2});
 for(const [at,n,nt]of [[0,3,67],[3,3,72],[6,3,76],[9,6,79],[15,3,76],[18,20,79]])S.p2(at,n,{note:nt,vol:n>6?fall(6,n):6,duty:1});S.tri(0,9,48);S.tri(9,9,55);S.tri(18,16,60);});
// Stèle : le feu prend (souffle qui monte), deux impulsions en quinte qui glissent vers le haut, trois notes douces.
fam('stele','Progression','Stèle allumée',-40,1,S=>{S.noise(0,30,{period:K([0,11],[20,6],[29,8]),vol:K([0,1],[12,5],[29,0])});S.p1(0,26,{note:K([0,60],[18,72]),vol:K([0,2],[14,9],[25,0]),duty:2});
 S.p2(2,24,{note:K([0,67],[16,79]),vol:K([0,1],[12,5],[23,0]),duty:1});[79,84,91].forEach((n,j)=>S.p1(26+j*3,j<2?3:14,{note:n,vol:j<2?7:fall(7,14),duty:2}));S.tri(18,24,60);});
fam('respawn','Progression','Retour à la stèle',-41,1,S=>{S.p1(0,40,{note:i=>60+i*.3+[0,4,7,12][i%4],vol:K([0,2],[10,8],[39,0]),duty:0});S.tri(0,30,K([0,48],[29,60]));S.noise(0,24,{period:2,vol:K([0,0],[8,3],[23,0])});});
fam('win','Progression','Victoire',-38,1,S=>{const v=n=>n>12?fall(12,n,.7):i=>[12,12,11,10,9,8][i]??7;
 for(const [at,n,nt]of [[0,6,67],[6,6,71],[12,6,74],[18,12,79],[30,6,74],[36,6,79],[42,36,83]])S.p1(at,n,{note:nt,vol:v(n),duty:2});
 for(const [at,n,nt]of [[0,6,62],[6,6,64],[12,6,67],[18,12,71],[30,6,71],[36,6,74],[42,34,79]])S.p2(at,n,{note:nt,vol:i=>v(n)(i)/2,duty:1});S.tri(0,18,55);S.tri(18,24,62);S.tri(42,30,55);});

// ---- Ennemis du monde
fam('foe_slash','Ennemis','Élan d’un ennemi',-41,3,(S,r,k)=>{const t=[0,-1.5,1][k];S.noise(0,8,{period:[7,6,5,4,4,5,6,7],vol:[3,7,10,10,8,5,3,1]});S.p1(1,5,{note:K([0,82+t],[4,72+t]),vol:[3,4,3,2,1],duty:1});});
fam('foe_heavy','Ennemis','Élan du gardien',-39,2,(S,r,k)=>{S.noise(0,12,{period:[9,8,7,6,6,6,7,8,9,10,11,12],vol:[3,6,9,11,11,10,8,6,4,3,2,1]});S.p1(2,8,{note:K([0,66-k],[7,55-k]),vol:[3,5,6,5,4,3,2,1],duty:2});});
fam('foe_cast','Ennemis','Sortilège qui se prépare',-41,2,(S,r,k)=>{const w=i=>.5*Math.sin(i*2*Math.PI/6);S.p1(0,26,{note:i=>K([0,58+k],[25,82+k])(i)+w(i),vol:K([0,2],[18,8],[25,3]),duty:0});
 S.p2(4,22,{note:i=>K([0,65+k],[21,89+k])(i)-w(i),vol:K([0,1],[16,4],[21,1]),duty:0});S.noise(0,26,{period:K([0,9],[25,5]),vol:K([0,1],[20,4],[25,1])});});
fam('foe_bolt','Ennemis','Trait lancé',-40,2,(S,r,k)=>{S.p1(0,9,{note:K([0,88+k],[8,64+k]),vol:fall(12,9,.8),duty:1});S.noise(0,4,{period:[3,4,5,6],vol:[7,5,3,1]});});
fam('bolt_hit','Ennemis','Trait qui frappe',-37,2,(S,r,k)=>{S.noise(0,10,{period:[4,5,6,7,8,9,10,11,12,12],vol:[14,12,10,8,6,5,3,2,1,1]});S.p1(0,5,{note:add([72,65,59,55,53],k),vol:[11,8,5,3,1],duty:2});S.p2(0,2,{note:[86,81],vol:[7,3],duty:0});});
fam('snake_bite','Ennemis','Morsure de serpent',-38,2,(S,r,k)=>{S.noise(0,4,{period:1,vol:[2,4,5,5]});S.noise(4,4,{period:[4,6,8,9],vol:[14,8,4,1]});S.p1(4,3,{note:add([93,86,81],k),vol:[11,6,2],duty:0});});

// ---- Boss : la préparation (« wind ») annonce le coup, l'impact (« hit ») frappe large.
fam('boss_slash_wind','Boss','Préparation, taille',-39,1,S=>{S.p1(0,20,{note:K([0,55],[19,69]),vol:K([0,3],[19,9]),duty:1});S.noise(0,20,{period:K([0,11],[19,7]),vol:K([0,1],[19,6])});});
fam('boss_slash_hit','Boss','Impact, taille',-34,1,S=>{S.noise(0,16,{period:[3,4,5,6,7,8,8,9,9,10,10,11,11,12,12,13],vol:[15,15,14,12,11,10,9,8,7,6,5,4,3,2,2,1]});S.p1(0,10,{note:K([0,74],[9,50]),vol:fall(15,10,.7),duty:2});
 S.p2(0,3,{note:[88,82,77],vol:[10,6,2],duty:0});S.tri(0,6,[60,54,49,45,42,40]);});
fam('boss_charge_wind','Boss','Préparation, charge',-39,1,S=>{S.p1(0,30,{note:i=>K([0,50],[29,58])(i)+(i%2?.7:-.7),vol:K([0,4],[29,11]),duty:2});S.p2(0,30,{note:i=>K([0,57],[29,65])(i)+(i%2?-.7:.7),vol:K([0,2],[29,6]),duty:1});S.noise(0,30,{period:12,vol:K([0,2],[29,7])});});
fam('boss_charge_hit','Boss','Impact, charge',-34,1,S=>{S.noise(0,22,{period:K([0,4],[21,13]),vol:K([0,15],[4,13],[21,0])});S.p1(0,12,{note:K([0,70],[11,48]),vol:fall(15,12,.7),duty:2});S.p2(0,3,{note:[84,79,74],vol:[9,5,2],duty:0});S.tri(0,8,K([0,60],[7,42]));});
fam('boss_eruption_wind','Boss','Préparation, éruption',-39,1,S=>{S.noise(0,36,{period:K([0,13],[35,10]),vol:K([0,2],[35,10])});S.p1(0,36,{note:i=>50+i*.3+(i%2?1:0),vol:K([0,2],[35,8]),duty:1});S.tri(0,36,i=>i%4<2?47:null);});
fam('boss_eruption_hit','Boss','Impact, éruption',-34,1,S=>{S.noise(0,40,{period:K([0,5],[10,9],[39,13]),vol:K([0,15],[8,12],[39,0])});for(const at of [10,17,25])S.noise(at,4,{period:[6,8,10,12],vol:[10,7,4,2]});
 S.p1(0,16,{note:K([0,67],[15,45]),vol:fall(14,16,.7),duty:2});S.p2(0,10,{note:K([0,79],[9,57]),vol:fall(9,10),duty:1});S.tri(0,10,K([0,57],[9,40]));});
fam('boss_fan_wind','Boss','Préparation, éventail',-39,1,S=>{for(let j=0;j<3;j++)S.p1(j*6,6,{note:K([0,70+j*3],[5,82+j*3]),vol:[4,6,7,6,4,2],duty:0});S.noise(0,18,{period:K([0,8],[17,4]),vol:K([0,1],[17,5])});});
fam('boss_fan_hit','Boss','Impact, éventail',-35,1,S=>{[0,4,8].forEach((at,j)=>{S.p1(at,6,{note:K([0,86-j*2],[5,68-j*2]),vol:[12,10,7,5,3,1],duty:1});S.noise(at,3,{period:[3,5,7],vol:[8,5,2]});});});
fam('boss_nova_wind','Boss','Préparation, nova',-39,1,S=>{const w=(i,p)=>.4*Math.sin(i*2*Math.PI/5+p);S.p1(0,40,{note:i=>K([0,50],[39,84])(i)+w(i,0),vol:K([0,2],[39,10]),duty:2});
 S.p2(0,40,{note:i=>K([0,57],[39,91])(i)+w(i,2),vol:K([0,1],[39,5]),duty:0});S.noise(0,40,{period:K([0,10],[39,3]),vol:K([0,0],[39,6])});});
fam('boss_nova_hit','Boss','Impact, nova',-34,1,S=>{S.noise(0,30,{period:K([0,1],[29,11]),vol:K([0,15],[29,0])});S.p1(0,18,{note:K([0,96],[17,50]),vol:fall(14,18,.8),duty:0});S.p2(0,18,{note:K([0,91],[17,45]),vol:fall(9,18),duty:2});S.tri(0,10,K([0,60],[9,42]));});
fam('boss_block','Boss','Le boss bloque',-37,1,S=>{S.noise(0,6,{period:[4,5,6,7,8,9],vol:[15,11,8,5,3,1],mode:[1,1,1,0,0,0]});S.p1(0,5,{note:[71,67,64,62,61],vol:[12,8,5,3,1],duty:1});S.p2(0,3,{note:[83,82,81],vol:[8,5,2],duty:0});S.tri(0,3,[55,50,46]);});
fam('boss_stun','Boss','Boss étourdi',-40,1,S=>{S.noise(0,4,{period:[5,7,9,11],vol:[10,6,3,1]});for(let j=0;j<5;j++)S.p1(j*8,4,{note:[88-j,91-j,88-j,84-j],vol:[7,8,6,3].map(v=>Math.max(1,v-j)),duty:0});});
fam('boss_transform','Boss','Métamorphose du boss',-37,1,S=>{S.noise(0,110,{period:K([0,13],[60,9],[90,5],[109,12]),vol:K([0,1],[60,6],[88,12],[109,0])});
 S.p1(0,90,{note:i=>K([0,45],[88,69])(i)+(i%2?.8:-.8),vol:K([0,2],[85,11],[89,6]),duty:2});S.p2(0,90,{note:i=>K([0,52],[88,76])(i)+(i%2?-.8:.8),vol:K([0,1],[85,6],[89,3]),duty:1});
 S.p1(90,20,{note:K([0,74],[19,50]),vol:fall(15,20,.7),duty:2});S.p2(90,14,{note:K([0,86],[13,62]),vol:fall(9,14),duty:1});S.tri(88,14,K([0,60],[13,42]));});

// ---- Donjon : mécanismes. Le fer claque en mode court, une ou deux images ; le bois cogne ; la pierre sourde.
fam('key','Donjon','Clé ramassée',-43,2,(S,r,k)=>{S.noise(0,2,{period:3,vol:[5,2],mode:1});S.p1(0,2,{note:84+k,vol:7,duty:1});S.p1(2,9,{note:91+k,vol:fall(8,9),duty:1});});
fam('door_unlock','Donjon','Porte déverrouillée',-41,2,(S,r,k)=>{S.noise(0,2,{period:[5,7],vol:[9,4]});S.p1(0,1,{note:76+k,vol:6,duty:0});S.noise(4,2,{period:[5,7],vol:[8,3]});
 S.noise(9,6,{period:[6,8,9,10,11,12],vol:[14,10,7,4,2,1]});S.p1(9,4,{note:add([64,59,55,53],k),vol:[11,7,4,1],duty:1});S.tri(9,3,[55,50,46]);});
fam('door_locked','Donjon','Porte verrouillée',-41,2,(S,r,k)=>{[0,4,8].forEach((at,j)=>{S.noise(at,3,{period:[6,8,10],vol:[11-j*2,6-j,2]});S.p1(at,2,{note:[62+k,58+k],vol:[8-j*2,3],duty:1});});});
fam('door_slam','Donjon','Porte qui claque',-36,1,S=>{S.noise(0,14,{period:K([0,5],[13,12]),vol:K([0,15],[3,13],[13,1])});S.p1(0,8,{note:K([0,67],[7,48]),vol:fall(15,8,.7),duty:2});S.p2(0,3,{note:[81,76,72],vol:[9,5,2],duty:1});
 S.tri(0,6,K([0,57],[5,42]));S.noise(14,8,{period:12,vol:[3,4,3,2,2,1,1,1]});});
fam('gate_rise','Donjon','Herse qui monte',-42,2,(S,r,k)=>{S.noise(0,44,{period:12,vol:K([0,2],[6,4],[40,4],[43,1])});for(let at=0;at<42;at+=4){S.noise(at,1,{period:6+k,vol:8,mode:1});S.p1(at,1,{note:70+r(),vol:3,duty:0});}
 S.noise(44,5,{period:[6,8,10,11,12],vol:[13,9,5,3,1]});S.tri(44,3,[52,47,43]);S.p1(44,3,{note:[60,55,52],vol:[9,5,2],duty:1});});
fam('gate_drop','Donjon','Herse qui tombe',-37,1,S=>{for(let at=0;at<9;at+=2)S.noise(at,1,{period:6,vol:6+at/2,mode:1});S.noise(10,16,{period:K([0,4],[15,13]),vol:K([0,15],[3,12],[15,0])});
 S.p1(10,8,{note:K([0,64],[7,48]),vol:fall(14,8,.7),duty:2});S.p2(10,4,{note:[79,74,70,67],vol:[8,5,3,1],duty:1});S.tri(10,6,K([0,57],[5,42]));S.noise(26,6,{period:6,vol:[3,0,2,0,1,0],mode:1});});
fam('gate_cells','Donjon','Portes des cellules',-40,1,(S,r)=>{[0,6,11,17].forEach((at,j)=>{const p=r()*1.5;S.noise(at,4,{period:[5,7,9,11],vol:[12-j,8-j,4,1],mode:[1,1,0,0]});S.p1(at,2,{note:[66+p-j,62+p-j],vol:[9,4],duty:1});});
 S.p2(2,8,{note:K([0,57],[7,59]),vol:i=>i%2?1:3,duty:0});S.p2(13,8,{note:K([0,58],[7,61]),vol:i=>i%2?1:3,duty:0});});
fam('cage_open','Donjon','Cage de la fée',-42,1,S=>{S.noise(0,3,{period:[4,6,8],vol:[10,5,2],mode:[1,0,0]});S.p1(0,2,{note:[76,72],vol:[8,3],duty:1});S.p1(4,12,{note:K([0,72],[11,77]),vol:i=>i%2?2:5,duty:0});
 [84,88,91].forEach((n,j)=>S.p2(16+j*3,j<2?3:9,{note:n,vol:j<2?5:fall(5,9),duty:1}));});
fam('plate_down','Donjon','Dalle enfoncée',-42,2,(S,r,k)=>{S.noise(0,6,{period:[9,10,11,12,12,13],vol:[11,9,7,5,3,1]});S.tri(0,4,[55,51,48,45]);S.p1(0,3,{note:add([59,55,53],-k),vol:[7,4,1],duty:1});S.noise(7,2,{period:[5,7],vol:[4,1],mode:1});});
fam('plate_up','Donjon','Dalle relâchée',-45,2,(S,r,k)=>{S.noise(0,4,{period:[8,9,10,11],vol:[7,5,3,1]});S.p1(0,3,{note:add([60,63,65],k),vol:[5,3,1],duty:1});});
// Treuil : cliquet régulier et courts grincements de corde entre les crans (jamais un son tenu).
fam('winch','Donjon','Treuil',-43,1,(S,r)=>{for(let at=0;at<46;at+=5){S.noise(at,2,{period:[5,8],vol:[8,3]});S.p1(at,1,{note:74+r()*1.5,vol:4,duty:0});S.p2(at+2,3,{note:55+r()*2,vol:[2,1,2],duty:0});}});
fam('lift','Donjon','Monte-charge',-42,1,S=>{S.noise(0,50,{period:i=>i%2?12:13,vol:K([0,2],[8,5],[44,5],[49,1])});for(let at=3;at<46;at+=7)S.noise(at,1,{period:7,vol:7,mode:1});
 S.noise(50,6,{period:[7,9,10,11,12,13],vol:[13,10,7,4,2,1]});S.tri(50,4,[55,50,46,43]);});
fam('crate_grab','Donjon','Caisse saisie',-45,2,(S,r,k)=>{S.noise(0,4,{period:[8,9,10,11],vol:[9,7,4,1]});S.p1(0,3,{note:add([62,59,57],-k),vol:[6,3,1],duty:1});});
fam('crate_release','Donjon','Caisse lâchée',-42,2,(S,r,k)=>{S.noise(0,5,{period:[9,10,11,12,13],vol:[11,8,5,3,1]});S.tri(0,3,add([53,49,46],-k));S.p1(0,3,{note:add([60,55,52],-k),vol:[7,4,1],duty:1});});
fam('crate_scrape','Donjon','Caisse traînée (boucle)',-46,1,(S,r)=>{S.noise(0,48,{period:i=>[10,11,10,12,11,10][(i+Math.floor(r()*2))%6],vol:()=>4+Math.round(r()*2)});
 for(let at=5;at<44;at+=11+Math.floor(r()*4))S.noise(at,1,{period:6,vol:6});},true);

// ---- Gobelins : petits, aigus, nasillards. Grise-Gueule : gros, rauque, mais lisible sur un haut-parleur de téléphone.
fam('gob_hurt','Gobelins','Gobelin touché',-38,3,(S,r,k)=>{const t=TR[k]*1.5;cry(S,r,{len:10,pitch:K([0,80+t],[2,86+t],[9,73+t]),vol:K([0,12],[3,13],[9,3]),duty:0,rough:2,second:-6,breath:5});S.noise(0,2,{period:4,vol:[8,4]});});
fam('gob_die','Gobelins','Gobelin qui meurt',-38,3,(S,r,k)=>{const t=TR[k]*1.5;cry(S,r,{len:34,pitch:K([0,82+t],[5,87+t],[18,78+t],[33,62+t]),vol:K([0,11],[5,13],[22,9],[33,0]),duty:0,rough:K([0,1.5],[33,4]),second:-6,breath:4});});
fam('gob_bark','Gobelins','Gobelin qui donne l’alerte',-39,3,(S,r,k)=>{const t=TR[k]*1.5;cry(S,r,{len:7,pitch:K([0,78+t],[6,83+t]),vol:K([0,10],[2,12],[6,6]),duty:0,rough:1.2,second:-5});
 cry(S,r,{at:9,len:10,pitch:K([0,85+t],[9,76+t]),vol:K([0,12],[9,2]),duty:0,rough:1.6,second:-5});});
fam('gob_effort','Gobelins','Gobelin qui frappe',-42,3,(S,r,k)=>{const t=TR[k]*1.5;cry(S,r,{len:8,pitch:K([0,77+t],[7,71+t]),vol:K([0,11],[7,1]),duty:1,rough:1.2,second:-7,breath:5,breathPeriod:5});});
fam('gob_fall','Gobelins','Gobelin qui s’effondre',-40,2,(S,r,k)=>{S.noise(0,6,{period:[7,9,10,11,12,13],vol:[11,9,6,4,2,1]});S.p1(0,3,{note:add([64,58,55],-k),vol:[7,4,1],duty:2});S.tri(0,3,[57,52,48]);
 S.noise(7,2,{period:5,vol:[6,2],mode:1});S.noise(11,2,{period:6,vol:[4,1],mode:1});});
const flutter=(from,to,len)=>i=>i%2?null:K([0,from],[len-1,to])(i);
fam('chief_roar','Gobelins','Grise-Gueule rugit',-35,1,(S,r)=>{cry(S,r,{len:62,pitch:K([0,55],[10,61],[40,60],[61,49]),vol:K([0,6],[8,14],[44,13],[61,0]),duty:2,rough:2.4,jit:.8,second:7,secondVol:.55,secondDuty:1,breath:7,breathPeriod:9});S.tri(0,58,flutter(45,41,58));});
fam('chief_hurt','Gobelins','Grise-Gueule touché',-36,2,(S,r,k)=>{cry(S,r,{len:16,pitch:K([0,63-k],[3,68-k],[15,57-k]),vol:K([0,13],[3,14],[15,2]),duty:1,rough:2,second:-5,breath:8,breathPeriod:8});});
fam('chief_die','Gobelins','Grise-Gueule meurt',-35,1,(S,r)=>{cry(S,r,{len:90,pitch:K([0,62],[10,66],[40,58],[89,45]),vol:K([0,10],[8,14],[50,10],[89,0]),duty:2,rough:K([0,2],[89,4]),jit:.8,second:7,secondVol:.5,breath:6,breathPeriod:9});S.tri(0,80,flutter(45,40,80));});
fam('chief_effort','Gobelins','Grise-Gueule frappe',-39,2,(S,r,k)=>{cry(S,r,{len:12,pitch:K([0,59+k],[4,64+k],[11,56+k]),vol:K([0,12],[11,1]),duty:2,rough:2,second:-5,breath:8,breathPeriod:8});});
fam('chief_fall','Gobelins','Grise-Gueule s’effondre',-36,1,(S,r)=>{S.noise(0,12,{period:K([0,6],[11,13]),vol:K([0,15],[11,1])});S.p1(0,6,{note:K([0,60],[5,48]),vol:fall(14,6,.7),duty:2});S.tri(0,6,K([0,55],[5,42]));
 for(const [at,v]of [[8,9],[14,6],[21,4],[27,2]])S.noise(at,2,{period:5+Math.floor(r()*2),vol:[v,v>>1],mode:1});});

// ---- Voix des dialogues : un bip par lettre, qui fléchit ; cinq hauteurs (la lettre choisit la variante).
const VO=[0,.76,1.52,2.28,3.04];
fam('voice','Dialogues','Voix, habitants',-43,5,(S,r,k)=>S.p1(0,3,{note:add([64,63.6,63.1],VO[k]),vol:[7,7,3],duty:1}));
fam('voice_watcher','Dialogues','Voix, le Veilleur',-43,5,(S,r,k)=>S.p1(0,3,{note:add([59.2,58.6,58.1],VO[k]),vol:[7,7,3],duty:2}));
fam('voice_priest','Dialogues','Voix, le prêtre du serpent',-42,5,(S,r,k)=>{S.p1(0,4,{note:add([47,46,45.2,44.4],VO[k]),vol:[8,8,6,2],duty:0});S.noise(0,3,{period:10,vol:[2,2,1]});});

// ---- Pas : une à cinq images de bruit, la matière se lit dans la hauteur et le grain.
const FOOT={
 sand:(S,o)=>S.noise(0,4,{period:add([9,8,9,10],o),vol:[6,5,3,1]}),
 earth:(S,o)=>{S.noise(0,4,{period:add([10,10,11,12],o),vol:[7,5,2,1]});S.tri(0,1,52+o);},
 grass:(S,o)=>S.noise(0,5,{period:add([5,4,4,5,6],o),vol:[3,5,4,2,1]}),
 gravel:(S,o)=>S.noise(0,5,{period:add([5,7,4,8,6],o),vol:[8,5,4,2,1]}),
 stone:(S,o)=>{S.noise(0,3,{period:add([4,7,9],o),vol:[7,3,1]});S.p1(0,1,{note:70+o,vol:4,duty:1});},
 wood:(S,o)=>{S.noise(0,3,{period:add([7,9,11],o),vol:[7,4,1]});S.p1(0,2,{note:[62+o,58+o],vol:[6,2],duty:1});S.tri(0,2,[57+o,53+o]);},
 mud:(S,o)=>{S.noise(0,5,{period:add([12,11,11,12,13],o),vol:[6,5,4,2,1]});S.p1(1,3,{note:add([55,58,61],o),vol:[3,2,1],duty:2});},
 water:(S,o)=>{S.noise(0,5,{period:add([3,2,2,3,4],o),vol:[4,6,5,3,1]});S.p1(1,2,{note:[81+o,86+o],vol:[3,2],duty:0});},
 snow:(S,o)=>S.noise(0,5,{period:add([6,7,8,8,9],o),vol:[4,6,5,3,1]})};
const FOOT_TITLE={sand:'sable',earth:'terre',grass:'herbe',gravel:'gravier',stone:'pierre',wood:'bois',mud:'boue',water:'eau',snow:'neige'};
for(const m of Object.keys(FOOT))fam('foot_'+m,'Pas','Pas, '+FOOT_TITLE[m],-51,3,(S,r,k)=>FOOT[m](S,[0,1,-1][k]));

// Toutes les familles, variantes compilées (graine tirée du nom : la fabrication est reproductible).
function build(){const out={};
 for(const [name,f]of Object.entries(F)){let seed=7;for(const ch of name)seed=(Math.imul(seed,31)+ch.charCodeAt(0))>>>0;
  const variants=[];for(let k=0;k<f.variants;k++){const S=score();f.recipe(S,rng(seed+k*977),k);variants.push(compile(S,f.loop));}
  out[name]={group:f.group,title:f.title,level:f.level,...(f.loop?{loop:1}:{}),variants};}
 return out;}
module.exports={build,families:F};
