'use strict';
/* Forteresse gobeline : sols raccordables, dessinés au sol (repère U, V)
 * puis lus à l'écran : le pixel (x, y) correspond au point U = y + ½ +
 * (x + ½)/2, V = y + ½ − (x + ½)/2, comme les pavages des villes. Chaque
 * motif a une période de 64 unités au sol, soit 128 × 64 à l'écran.
 * Le calque hauteur (0 à 1) décide des bords entre deux sols : une dalle
 * reste entière, la terre comble les joints. */
const {rng,Grid,scatter,stamp,field}=require('./brushes.cjs'),P=require('./palette.cjs');
const W=128,Hh=64,PER=64;
const hash=(...k)=>{let h=2166136261;for(const n of k){h=Math.imul(h^(n&0xffff),16777619);h=Math.imul(h^(n>>>16),16777619);}h=Math.imul(h^(h>>>13),1274126177);return ((h^(h>>>16))>>>0)/4294967296;};
const mod=(a,n)=>((a%n)+n)%n;
const UV=(x,y)=>[y+.5+(x+.5)/2,y+.5-(x+.5)/2];
// Trame de Bayer et bruit de valeur raccordable à l'écran (période W × Hh).
const BAYER=[0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5];
const dither=(x,y,v)=>{const f=Math.floor(v);return f+((v-f)*16>BAYER[mod(y,4)*4+mod(x,4)]+.5?1:0);};
function noise(x,y,s,seed){const fx=x/s,fy=y/s,x0=Math.floor(fx),y0=Math.floor(fy),PX=Math.round(W/s),PY=Math.round(Hh/s),sm=t=>t*t*(3-2*t),a=sm(fx-x0),b=sm(fy-y0),h=(i,j)=>hash(mod(i,PX),mod(j,PY),seed);
 return (h(x0,y0)*(1-a)+h(x0+1,y0)*a)*(1-b)+(h(x0,y0+1)*(1-a)+h(x0+1,y0+1)*a)*b;}
// Décale le ton d'une couleur de rampe ('cachot5' + 1 -> 'cachot6'), borné à la rampe.
const shift=(c,d)=>{const ramp=c.replace(/\d+$/,''),t=+c.match(/\d+$/)[0];return ramp+Math.max(0,Math.min(P.RAMPS[ramp].length-1,t+d));};
// Grain d'une pierre : taches de 2 à 4 pixels, tramées, et piqûres sombres.
const grainAt=(x,y,seed,amount)=>dither(x,y,((noise(x,y,4,seed)-.5)*1.4+(noise(x,y,2,seed+1)-.5)*.9)*amount+.5)-(hash(x,y,seed,3)<.04?1:0);
// Pierres d'un motif : (u, v) -> {key, along, across, size}. Ombrage commun.
function stones(pattern,{tones,joint,seed=1,crack=0,hJoint=.15,hStone=.9,wear,grain=0}){
 const g=new Grid(W,Hh,{wrap:true,fill:joint[0],height:hJoint}),cell=[];
 for(let y=0;y<Hh;y++)for(let x=0;x<W;x++)cell.push(pattern(...UV(x,y)));
 const key=(x,y)=>cell[mod(y,Hh)*W+mod(x,W)].key;
 for(let y=0;y<Hh;y++)for(let x=0;x<W;x++){
  const s=cell[y*W+x],k=s.key,jr=key(x+1,y)!==k,jd=key(x,y+1)!==k,jl=key(x-1,y)!==k,ju=key(x,y-1)!==k;
  if(jr||jd){g.set(x,y,jd&&jr||hash(x,y,seed,5)<.25?joint[1]:joint[0],hJoint);continue;}
  const r=hash(...k.split(',').map(Number),seed),t=tones.find(([p])=>r<p)[1];
  let c=ju||jl?t[0]:key(x,y+2)!==k||key(x+2,y)!==k?t[2]:t[1];
  // Fêlure : une ligne sombre en travers de quelques dalles, liseré clair au-dessus.
  if(crack&&c===t[1]&&hash(...k.split(',').map(Number),seed+9)<crack){const q=hash(...k.split(',').map(Number),seed+4);const dd=s.along-s.size[0]*(.3+q*.4)+(s.across-s.size[1]*.5)*(q<.5?1.6:-1.6);if(Math.abs(dd)<.55&&s.along<s.size[0]*(.45+q*.3))c=t[3]||joint[0];}
  if(wear)c=wear(s,c,x,y)||c;
  if(grain&&c!==joint[0])c=shift(c,grainAt(x,y,seed,grain));
  g.set(x,y,c,ju||jl?hStone+.05:hStone);
 }
 return g;
}
// Dalles : rangs de hauteurs inégales (10 à 16), pierres de 10 à 23 de long, joints décalés.
const ASHLAR=(()=>{const R=rng(43),rows=[];let v=0;for(const h of [12,10,14,12,16]){const cuts=[];const start=Math.floor(R()*12);let u=start;while(u<start+PER){let l=10+Math.floor(R()*14);if(start+PER-u-l<8)l=start+PER-u;cuts.push([u,l]);u+=l;}rows.push({v,h,cuts});v+=h;}return rows;})();
function slab(u,v){const lv=mod(v,PER),row=ASHLAR.find(r=>lv>=r.v&&lv<r.v+r.h);let x=mod(u,PER);if(x<row.cuts[0][0])x+=PER;const [s0,l]=row.cuts.find(([s0,l])=>x>=s0&&x<s0+l);
 return {key:[mod(s0,PER),row.v,0].join(','),along:x-s0,across:lv-row.v,size:[l,row.h]};}
// Pavés de couloir : moellons arrondis (Voronoï à l'écran), joints serrés.
function cobbleKeys(seed){const R=rng(seed),pts=scatter(W,Hh,6.4,R,{aniso:1.9}),own=new Int32Array(W*Hh);
 for(let y=0;y<Hh;y++)for(let x=0;x<W;x++){let best=1e9;pts.forEach((p,k)=>{let dx=Math.abs(x-p[0]),dy=Math.abs(y-p[1]);dx=Math.min(dx,W-dx);dy=Math.min(dy,Hh-dy);const d=dx*dx+(dy*1.9)**2;if(d<best){best=d;own[y*W+x]=k;}});}
 return (u,v)=>{const x=mod(Math.round(u-v-.5),W),y=mod(Math.round((u+v)/2-.5),Hh);return {key:own[y*W+x]+',0',along:0,across:0,size:[6,6]};};}
const DALLE=[[.18,['cachot6','cachot4','cachot3','cachot2']],[.86,['cachot7','cachot5','cachot4','cachot2']],[1,['cachot7','cachot6','cachot5','cachot3']]];
function dalles({seed=3}={}){
 return stones(slab,{seed,tones:DALLE,joint:['cachot2','cachot1'],crack:.12,grain:1});
}
function paves({seed=5}={}){
 return stones(cobbleKeys(seed+30),{seed,tones:[[.3,['cachot6','cachot4','cachot3']],[.985,['cachot7','cachot5','cachot3']],[1,['lueur3','lueur2','lueur1']]],joint:['cachot2','cachot1'],hStone:.85,grain:.8});
}
// Terre battue des galeries creusées : brun sombre tramé, cailloux, rares brins de paille.
function terre({seed=7}={}){
 const R=rng(seed),g=new Grid(W,Hh,{wrap:true,fill:'lueur2',height:.4}),F=field(W,Hh,10,R,2);
 for(let y=0;y<Hh;y++)for(let x=0;x<W;x++){const f=F.at(x,y),t=Math.max(0,Math.min(4,dither(x,y,2.1+f*1.3+(noise(x,y,2,seed)-.5)*1.1)-(hash(x,y,seed,7)<.05?1:0)));g.set(x,y,'lueur'+t,.3+t*.05);}
 for(const [x,y]of scatter(W,Hh,8,R)){const k=R();
  if(k<.4)stamp(g,x,y,k<.18?['ab','cd']:['.ab','abd','.dd'],{a:'cachot5',b:'cachot4',c:'cachot3',d:'lueur1'},{h:{a:.8,b:.75,c:.7,d:.3},flip:R()<.5});
  else if(k<.47)stamp(g,x,y,R()<.5?['a...','.ab.','...b']:['..a','ab.','b..'],{a:'paille2',b:'paille1'},{h:.5});
  else if(k<.7){g.set(x,y,'lueur4',.5);g.set(x+1,y+1,'lueur1',.3);}}
 return g;
}
// Plancher gobelin : planches grossières le long de U, clous, fentes noires.
const BOARD_ROWS=(()=>{const R=rng(53),rows=[];for(let v=0;v<PER;v+=8){const cuts=[];let u=Math.floor(R()*16);const start=u;while(u<start+PER){let l=[20,24,28,32,40][Math.floor(R()*5)];if(start+PER-u-l<16)l=start+PER-u;cuts.push([u,l]);u+=l;}rows.push({v,cuts});}return rows;})();
function board(u,v){const pu=Math.floor(u/PER),pv=Math.floor(v/PER),lu=u-pu*PER,lv=v-pv*PER,row=BOARD_ROWS[Math.floor(lv/8)];
 let x=lu;if(x<row.cuts[0][0])x+=PER;const [s,l]=row.cuts.find(([s,l])=>x>=s&&x<s+l);return {key:[mod(pu*PER+s,PER),row.v].join(','),along:x-s,across:lv-row.v,size:[l,8]};}
function planches({seed=9}={}){
 return stones(board,{seed,tones:[[.3,['planche5','planche3','planche2','planche1']],[.8,['planche6','planche4','planche3','planche1']],[1,['planche5','planche4','planche3','planche1']]],joint:['planche1','cachot0'],hJoint:.1,hStone:.7,grain:.5,
  wear:(s,c,x,y)=>{const k=s.key.split(',').map(Number);
   // Clous près des bouts, fil du bois en traits courts.
   if((s.along>=1.5&&s.along<2.5||s.along>=s.size[0]-3&&s.along<s.size[0]-2)&&s.across>=2&&s.across<3)return 'fer5';
   if(c!=='planche1'&&Math.abs(s.across-2-hash(...k,seed)*4)<.5&&mod(Math.floor(s.along+hash(...k,3)*20),9)<4)return c.replace(/\d$/,d=>String(Math.max(1,+d-1)));}});
}
module.exports={dalles,paves,terre,planches,W,H:Hh,UV};
if(require.main===module){const {save}=require('./png.cjs');save((process.argv[2]||'.')+'/forteresse-sols.png',[dalles(),paves(),terre(),planches()],{scale:4,cols:2,gap:2,bg:'#000',tile:[2,2]});console.log('ok');}
