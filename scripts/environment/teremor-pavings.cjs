'use strict';
/* Teremor : pavages de ville posés dans l'axe des rues (repère au sol U, V).
 * Le pixel d'écran (x, y) correspond au point U = y + ½ + (x + ½)/2,
 * V = y + ½ - (x + ½)/2 : les joints suivent les diagonales 2:1 de la
 * projection, comme les arêtes des bâtiments. Chaque motif est périodique
 * dans le plan et à l'écran (128 × 64), ce qui garde les raccords sans couture.
 * Ombrage : arête claire en haut à gauche, joint sombre d'un pixel en bas à
 * droite, grain tramé et usure (matiere.cjs).
 * axis 'v' : même motif tourné d'un quart de tour, pour les rues nord-sud. */
const {rng}=require('./brushes.cjs');
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

/* Rendu mûr (matiere.cjs) : pierre grenée et tramée, arête claire en haut à
 * gauche, ombre en bas à droite, joints sombres, usure et fêlures. Chaque
 * style : joint(x, y, coin) et shader({s, x, y, r, edge, deep}). */
const M=require('./matiere.cjs');
const stone=(ramp,{base=[4.4,5.4,6.2],cuts=[.3,.85],crack=0,moss=0,grain=1.4,size=[128,64]})=>({s,x,y,r,edge,deep})=>{
 let t=(r<cuts[0]?base[0]:r>cuts[1]?base[2]:base[1])+(edge?1.3:deep?-1.2:0)+(M.snoise(x,y,2,Math.floor(r*997),size[0],size[1])-.5)*grain;
 if(M.hash(x,y,11)<.035)t-=1.4;
 if(moss&&!edge&&deep&&M.hash(x,y,12)<moss)return [M.tone('mousse',1),.85];
 if(crack&&r<crack&&Math.abs(s.along-s.size[0]*.55+(s.across-s.size[1]*.5)*.9)<.5)return [M.tone(ramp,Math.max(0,base[0]-2)),.85];
 return [M.dtone(ramp,t,x,y),edge?.95:.9];};
const STYLE={
 setts:{joint:(x,y,c)=>M.tone(M.hash(x,y,3)<.3?'mousse':'humus',c?0:1),shader:stone('roc',{base:[4.6,5.6,6.6],size:[192,96]})},
 flags:{joint:(x,y,c)=>M.tone('roc',c?1:2),shader:stone('gresm',{base:[4.2,5.3,6.2],cuts:[.25,.88],crack:.18,size:[128,64]})},
 bricks:{joint:(x,y,c)=>M.tone('gresm',c?1:2),shader:stone('briquem',{base:[3.6,4.6,5.6],cuts:[.3,.92],grain:1.2,size:[160,80]})},
 fan:{joint:(x,y,c)=>M.tone(M.hash(x,y,4)<.25?'mousse':'humus',c?0:1),shader:stone('roc',{base:[4.4,5.4,6.4],size:[192,96]})}
};
/* style : {joint, shader} (voir plus haut). Par défaut le style de Teremor du motif. */
function paving(kind,{axis='u',pattern:name=kind,style=STYLE[kind]}={}){
 const [W,H]=SIZE[name];return M.pave(W,H,PATTERNS[name],{axis,...style});
}
module.exports={paving,PATTERNS,SIZE,STYLE,stone};
