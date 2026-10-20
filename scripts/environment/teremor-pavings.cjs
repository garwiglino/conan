'use strict';
/* Teremor : pavages de ville posés dans l'axe des rues (repère au sol U, V).
 * Le pixel d'écran (x, y) correspond au point U = y + ½ + (x + ½)/2,
 * V = y + ½ - (x + ½)/2 : les joints suivent les diagonales 2:1 de la
 * projection, comme les arêtes des bâtiments. Chaque motif est périodique
 * dans le plan et à l'écran (128 × 64), ce qui garde les raccords sans couture.
 * Ombrage identique aux pavés irréguliers : arête claire en haut à gauche,
 * joint sombre d'un pixel en bas à droite, cœur de pierre en trois tons.
 * axis 'v' : même motif tourné d'un quart de tour, pour les rues nord-sud. */
const {rng,Grid}=require('./brushes.cjs');
const hashOf=(s,seed)=>{let h=2166136261^seed;for(let i=0;i<s.length;i++)h=Math.imul(h^s.charCodeAt(i),16777619);h=Math.imul(h^(h>>>13),1274126177);return ((h^(h>>>16))>>>0)/4294967296;};
// Période d'écran de chaque motif (multiple de 32 × 16, compatible avec son réseau au sol).
// Tomettes : réseau (10, 0), (5, 8) ; ses périodes à l'écran imposent 160 × 80.
const SIZE={setts:[192,96],flags:[128,64],bricks:[160,80],fan:[192,96],hex:[160,80],cabochon:[192,96]};
// Clé d'une pierre : son ancre ramenée dans la période de la texture à l'écran.
const canon=kind=>{const [W,H]=SIZE[kind];return (tag,u,v)=>{const x=((u-v)%W+W)%W,y=(((u+v)/2)%H+H)%H;return tag+':'+x.toFixed(2)+','+y.toFixed(2);};};
const C=Object.fromEntries(Object.keys(SIZE).map(k=>[k,canon(k)]));
/* Motifs : (u, v) -> {key, along, across, size:[long, large]} en unités du sol. */
// Pavés en rangs : 8 × 6, rangs le long de la rue, joints décalés d'un demi-pavé.
function setts(u,v){const r=Math.floor(v/6),o=(r&1)*4,c=Math.floor((u-o)/8);return {key:C.setts('s',c*8+o,r*6),along:u-o-c*8,across:v-r*6,size:[8,6]};}
// Dallage : rangs de hauteur variable, dalles de longueurs variées, période 64 × 64.
const FLAG_ROWS=(()=>{const R=rng(5),rows=[];let v=0;while(v<64){let h=[8,10,10,12][Math.floor(R()*4)];if(64-v-h<8)h=64-v;const cuts=[];let u=Math.floor(R()*12);const start=u;while(u<start+64){let l=[10,12,12,14,16][Math.floor(R()*5)];if(start+64-u-l<9)l=start+64-u;cuts.push([u,l]);u+=l;}rows.push({v,h,cuts});v+=h;}return rows;})();
function flags(u,v){const pu=Math.floor(u/64),pv=Math.floor(v/64),lu=u-pu*64,lv=v-pv*64,row=FLAG_ROWS.find(r=>lv>=r.v&&lv<r.v+r.h);
 let x=lu;if(x<row.cuts[0][0])x+=64;const [s,l]=row.cuts.find(([s,l])=>x>=s&&x<s+l);return {key:C.flags('f',pu*64+s,pv*64+row.v),along:x-s,across:lv-row.v,size:[l,row.h]};}
// Briques en chevrons : 10 × 5, chaînes de briques couchées et debout le long de la diagonale.
function bricks(u,v){const B=5;
 for(let m=Math.ceil((u-v-2*B)/(4*B));m<=Math.floor((u-v+3*B)/(4*B));m++){const qu=u-m*2*B,qv=v+m*2*B;
  let k=Math.floor(qv/B);if(qu>=k*B&&qu<k*B+2*B)return {key:C.bricks('h',k*B+m*2*B,k*B-m*2*B),along:qu-k*B,across:qv-k*B,size:[2*B,B]};
  k=Math.floor(qu/B);if(qv>=k*B+B&&qv<k*B+3*B)return {key:C.bricks('v',k*B+m*2*B,k*B+B-m*2*B),along:qv-k*B-B,across:qu-k*B,size:[2*B,B],turned:true};}
 return {key:'?',along:0,across:0,size:[1,1]};}
// Pavés en éventail : écailles de rayon 34 en quinconce, anneaux de 6, pavés de 6 le long des arcs.
function fan(u,v){const F=48,R=34,S=6;let best=null;
 const j0=Math.floor(v/(F/2));for(let j=j0+2;j>=j0-2&&!best;j--){const off=(j&1)*F/2,i0=Math.round((u-off)/F);for(let i=i0-1;i<=i0+1;i++){const cu=i*F+off,cv=j*F/2,du=u-cu,dv=v-cv,d=Math.hypot(du,dv);if(d<R&&dv<=0+R*.05){best={cu,cv,du,dv,d};break;}}}
 if(!best){const j=Math.floor(v/(F/2)),off=(j&1)*F/2,i=Math.round((u-off)/F);best={cu:i*F+off,cv:j*F/2,du:u-i*F-off,dv:v-j*F/2,d:0};}
 const ring=Math.floor(best.d/S),a=Math.atan2(best.du,-best.dv),len=Math.max(1,Math.round((ring+.5)*Math.PI)),seg=Math.floor((a/Math.PI+1)/2*len*2);
 return {key:C.fan('e'+ring+'.'+seg,best.cu,best.cv),along:(a/Math.PI+1)/2*len*2-seg,across:best.d/S-ring,size:[S,S]};}
// Tomettes hexagonales : cellules de Voronoï du réseau (10, 0), (5, 8), presque régulières.
function hex(u,v){const j0=Math.round(v/8);let best=1e9,bi=0,bj=0;
 for(let j=j0-1;j<=j0+1;j++){const i0=Math.round((u-5*j)/10);for(let i=i0-1;i<=i0+1;i++){const d=(u-10*i-5*j)**2+(v-8*j)**2;if(d<best){best=d;bi=i;bj=j;}}}
 const cu=10*bi+5*bj,cv=8*bj;return {key:C.hex('h',cu,cv),along:u-cu+5,across:v-cv+5,size:[10,10]};}
// Carreaux à cabochons : carrés de 12 aux coins coupés par un petit losange émaillé.
function cabochon(u,v){const ci=Math.round(u/12),cj=Math.round(v/12),du=u-ci*12,dv=v-cj*12;
 if(Math.abs(du)+Math.abs(dv)<3.6)return {key:C.cabochon('c',ci*12,cj*12),along:du+2,across:dv+2,size:[4,4],inset:true};
 const i=Math.floor(u/12),j=Math.floor(v/12);return {key:C.cabochon('t',i*12,j*12),along:u-i*12,across:v-j*12,size:[12,12]};}
const PATTERNS={setts,flags,bricks,fan,hex,cabochon};

const STYLE={
 setts:{joint:['pierre2','pierre1'],kinds:[[.6,['pierre5','pierre4','pierre3']],[.94,['pierre4','pierre3','pierre2']],[1,['terre5','terre4','terre3']]]},
 flags:{joint:['gres0','pierre1'],kinds:[[.7,['gres3','gres2','gres1']],[.92,['gres2','gres1','gres0']],[1,['pierre4','pierre3','pierre2']]],cracks:true},
 bricks:{joint:['brique1','brique0'],kinds:[[.6,['brique3','brique2','brique1']],[.95,['brique4','brique3','brique2']],[1,['gres2','gres1','gres0']]]},
 fan:{joint:['pierre2','pierre1'],kinds:[[.6,['pierre5','pierre4','pierre3']],[.95,['pierre4','pierre3','pierre2']],[1,['terre5','terre4','terre3']]]}
};
/* style : {joint:[clair, sombre], kinds:[[seuil, [arête, cœur, ombre]], …] ou
 * (pierre) -> kinds, cracks}. Par défaut le style de Teremor du motif. */
function paving(kind,{axis='u',seed=91,pattern:name=kind,style=STYLE[kind]}={}){
 const [W,H]=SIZE[name],pattern=PATTERNS[name],R=rng(seed),g=new Grid(W,H,{wrap:true,fill:style.joint[0],height:.15});
 const at=(x,y)=>{x=(x%W+W)%W;y=(y%H+H)%H;const U=y+.5+(x+.5)/2,V=y+.5-(x+.5)/2;return axis==='v'?pattern(V,U):pattern(U,V);};
 const cell=[];for(let y=0;y<H;y++)for(let x=0;x<W;x++)cell.push(at(x,y));
 const key=(x,y)=>cell[((y%H+H)%H)*W+((x%W+W)%W)].key;
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){
  const s=cell[y*W+x],k=s.key,jr=key(x+1,y)!==k,jd=key(x,y+1)!==k,jl=key(x-1,y)!==k,ju=key(x,y-1)!==k;
  if(jr||jd){g.set(x,y,jd&&jr?style.joint[1]:style.joint[0],.15);continue;}
  const r=hashOf(k,seed),kinds=typeof style.kinds==='function'?style.kinds(s):style.kinds,tones=kinds.find(([p])=>r<p)[1];
  let c=ju||jl?tones[0]:key(x,y+2)!==k||key(x+2,y)!==k?tones[2]:tones[1];
  // Usure : quelques pixels plus sombres au cœur des grandes dalles, fêlures rares.
  if(style.cracks&&c===tones[1]){const w=hashOf(k+'#',seed);if(w<.18&&Math.abs(s.along-s.size[0]*.5+(s.across-s.size[1]*.5)*.8)<.45)c=tones[2];else if(R()<.025)c=tones[2];}
  g.set(x,y,c,ju||jl?.95:.9);
 }
 return g;
}
module.exports={paving,PATTERNS,SIZE,STYLE};
