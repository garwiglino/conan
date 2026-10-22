'use strict';
/* Varan : talus de tourbe et de vase, dépliés comme les falaises de Teremor
 * (x le long du bord, y depuis le sommet, cisaillés par le moteur). Strates
 * de tourbe, pierres prises dans la vase, racines pendantes, mousse en haut,
 * pied mouillé plus sombre. Face éclairée et face à l'ombre. */
const M=require('./matiere.cjs'),{rng,Grid,scatter,tone,dtone,hash,clamp}=M;
function face({seed=371,w=64,h=40,lit=true}={}){
 const R=rng(seed),g=new Grid(w,h,{wrap:true,fill:'tourbe3'}),lift=lit?0:-1.2;
 // Strates ondulées : épaisseurs de 3 à 7, chacune un peu plus sombre vers le bas.
 const band=(x,y)=>y+Math.sin(x/w*Math.PI*2*2+seed)*1.2+Math.sin(x/w*Math.PI*2*5)*.6;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){const b=band(x,y),k=Math.floor(b/5),f=b/5-k,deep=y/h;
  let t=(hash(k,seed)<.35?4.2:3.4)+(f<.2?1:f>.85?-1:0)-deep*1.8+lift+(M.snoise(x,y,2,seed+k,w,h)-.5)*1.4;
  const ramp=hash(k,seed+1)<.4?'vase':'tourbe';g.set(x,y,dtone(ramp,clamp(t,0,ramp==='vase'?10:7),x,y));}
 // Pierres prises dans la vase : éclat en haut à gauche, ombre dessous.
 for(const [x,y]of scatter(w,h,9,R,{aniso:1.2})){if(y<5||R()<.4)continue;const rw=2+Math.floor(R()*3),rh=2+Math.floor(R()*2);
  for(let dy=0;dy<rh;dy++)for(let dx=0;dx<rw;dx++){const l=(dx===0||dy===0)?1.5:dx===rw-1||dy===rh-1?-1:0;g.set(x+dx,y+dy,tone('roc',4+l+lift));}
  for(let dx=0;dx<rw;dx++)g.set(x+dx+1,y+rh,tone('tourbe',0));}
 // Racines pendantes depuis le haut, claires sur la face éclairée.
 for(let x=0;x<w;x++){if(hash(x,seed,3)>.16)continue;const L=4+Math.floor(hash(x,seed,4)*12);let xx=x;for(let y=1;y<L;y++){xx+=hash(x,y,5)<.2?(hash(x,y,6)<.5?-1:1):0;g.set(xx,y,tone('tourbe',lit?6:5));g.set(xx+1,y,tone('tourbe',1));}}
 // Mousse et herbe qui retombe au sommet ; pied luisant d'eau.
 for(let x=0;x<w;x++){const n=Math.floor(hash(x,seed,7)*4);for(let y=0;y<=n;y++)g.set(x,y,tone(y===n?'marais':'jonc',y===n?3:lit?5-y:4-y));
  if(hash(x,seed,8)<.3)g.set(x,h-1,tone('marais',lit?7:5));}
 return g;
}
module.exports={face};
if(require.main===module){const {save}=require('./png.cjs');save((process.argv[2]||'.')+'/varan-falaises.png',[face(),face({lit:false,seed:372})],{scale:5,cols:2,gap:2,bg:'#111',tile:[2,1]});console.log('ok');}
