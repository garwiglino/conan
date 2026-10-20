'use strict';
/* Pièces de chemin standard, cases de 2 m (losange 64 × 32 px).
 * Raccords N/E/S/O (bits 1/2/4/8) : impasses, droites, virages arrondis,
 * T, croisement et placette isolée, soit les 16 combinaisons d'usage.
 * Chaque pièce est une forme à quatre niveaux (0 herbe, 1-2 bord, 3 cœur) ;
 * la matière (terre, pavés, eau) et ses bords viennent du compositeur.
 * Le profil est identique au milieu de chaque arête : les pièces se raccordent. */
const {Grid}=require('./brushes.cjs');
const CELL=32,DIRS=[[1,[16,0]],[2,[32,16]],[4,[16,32]],[8,[0,16]]];
const seg=(p,a,b)=>{const dx=b[0]-a[0],dy=b[1]-a[1],t=Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/(dx*dx+dy*dy||1)));return Math.hypot(p[0]-a[0]-t*dx,p[1]-a[1]-t*dy);};
const smin=(a,b,k)=>{const h=Math.max(k-Math.abs(a-b),0)/k;return Math.min(a,b)-h*h*k/4;};
// Bras sinueux (ruisseau) : décalage latéral nul au centre et au bord de case.
function wavy(p,a,b,amp){let best=1e9;const n=24;let prev=null;for(let k=0;k<=n;k++){const t=k/n,ox=-(b[1]-a[1]),oy=b[0]-a[0],l=Math.hypot(ox,oy)||1,o=amp*Math.sin(Math.PI*t)*(a[0]+a[1]>b[0]+b[1]?-1:1),q=[a[0]+(b[0]-a[0])*t+ox/l*o,a[1]+(b[1]-a[1])*t+oy/l*o];if(prev)best=Math.min(best,seg(p,prev,q));prev=q;}return best;}
function distance(mask,u,v,meander=0){
 const p=[u,v],c=[16,16],arms=DIRS.filter(([bit])=>mask&bit);
 if(meander&&arms.length&&!(arms.length===2&&[3,6,12,9].includes(mask)))return join(arms.map(([bit,m])=>[bit,wavy(p,c,m,meander)]));
 if(!arms.length)return Math.hypot(u-16,v-16)-4;
 // Virage : quart de cercle centré sur le coin commun, rayon d'une demi-case.
 if(arms.length===2&&(mask===3||mask===6||mask===12||mask===9)){const corner={3:[32,0],6:[32,32],12:[0,32],9:[0,0]}[mask];return Math.abs(Math.hypot(u-corner[0],v-corner[1])-16);}
 return join(arms.map(([bit,m])=>[bit,seg(p,c,m)]));
}
// Union des bras : congé arrondi seulement dans les angles intérieurs (bras
// perpendiculaires), jamais de renflement du côté fermé d'un T.
function join(list){let d=Math.min(...list.map(a=>a[1]));if(list.length>2)for(const [a,da]of list)for(const [b,db]of list)if(a<b&&(a|b)!==5&&(a|b)!==10)d=Math.min(d,smin(da,db,7));return d;}
function piece(mask,{half=7,meander=0,swell=0,colours=['herbe4','terre3','terre4','terre5']}={}){
 const g=new Grid(64,32);
 for(let py=0;py<32;py++)for(let px=0;px<64;px++){
  const X=px-32+.5,Y=py+.5,u=Y+X/2,v=Y-X/2;if(u<0||v<0||u>=CELL||v>=CELL)continue;
  const sw=swell?swell*Math.sin(Math.PI*2*((u+v)/32)):0,d=distance(mask,u,v,meander)-half-sw,level=d<-3?3:d<-1?2:d<1.5?1:0;
  // Couleurs de référence pour l'édition dans Piskel ; seul le niveau compte.
  g.set(px,py,colours[level],level/3);
 }
 return g;
}
const NAMES={0:'placette',1:'impasse-N',2:'impasse-E',4:'impasse-S',8:'impasse-O',5:'droite-NS',10:'droite-EO',3:'virage-NE',6:'virage-ES',12:'virage-SO',9:'virage-ON',7:'T-sans-O',11:'T-sans-S',13:'T-sans-E',14:'T-sans-N',15:'croisement'};
const ORDER=[5,10,3,6,12,9,7,11,13,14,15,1,2,4,8,0];
function set(opts){return ORDER.map(m=>Object.assign(piece(m,opts),{mask:m,label:NAMES[m]}));}
module.exports={set,piece,NAMES,ORDER,CELL};
if(require.main===module){const {save}=require('./png.cjs');save((process.argv[2]||'.')+'/pieces.png',set(),{scale:4,cols:8,gap:2,bg:'#111'});console.log('ok');}
