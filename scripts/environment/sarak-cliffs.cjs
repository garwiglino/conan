'use strict';
/* Sarak : parois de grès rouge en strates. Dessinées à plat (x le long du
 * mur, y depuis le sommet) puis cisaillées en 2:1 par le moteur, comme les
 * falaises de Teremor et avec la même taille de bloc. Les blocs sont aplatis
 * et rangés en bancs : arête claire en haut, joint sombre dessous, une moitié
 * de bloc tournée vers la lumière, grain tramé (matiere.cjs). Bancs plus
 * pâles par endroits, coulures de patine sous le sommet, sable au pied. */
const M=require('./matiere.cjs'),{rng,Grid,tone,dtone,hash,clamp}=M;
function face({seed=361,w=64,h=40,lit=true}={}){
 const R=rng(seed),g=new Grid(w,h,{wrap:true,fill:'gresrouge2'}),lift=lit?0:-1.8;
 // Bancs : rangées de centres, hauteur 5 à 8, blocs de 8 à 15 de long.
 const pts=[],rows=[];for(let y=2+Math.floor(R()*2);y<h+4;y+=5+Math.floor(R()*4)){const pale=R()<.3;rows.push(y);let x=R()*10;while(x<w){pts.push([x,y+(R()-.5)*1.6,R()*Math.PI,R(),pale]);x+=8+R()*7;}}
 const cell=new Int32Array(w*h);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){let best=1e9,k=-1;pts.forEach((p,i)=>{let dx=Math.abs(x-p[0]);dx=Math.min(dx,w-dx);const d=dx*dx+((y-p[1])*2.5)**2;if(d<best){best=d;k=i;}});cell[y*w+x]=k;}
 const c=(x,y)=>y<0?-1:y>=h?-2:cell[y*w+((x%w+w)%w)];
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const k=c(x,y),[px,py,ang,b,pale]=pts[k];let dx=x-px;if(dx>w/2)dx-=w;if(dx<-w/2)dx+=w;
  const facet=(dx*Math.cos(ang)*.5+(y-py)*1.6*Math.sin(ang))<-1;
  let t=5.6+(b>.8?1:b<.2?-1:0)+(facet?(lit?1.3:.3):-.5)-y/h*1.2+lift+(M.snoise(x,y,2,seed+k,w,h)-.5)*1.3;
  const above=c(x,y-1)!==k,below=c(x,y+1)!==k,right=c(x+1,y)!==k,left=c(x-1,y)!==k;
  if(below)t=lit?1:.4;else if(above)t=Math.max(t+1.4,lit?8:6);else if(c(x,y+2)!==k)t=Math.min(t,lit?3.6:2.6);else if(right)t=Math.min(t,lit?3:2);else if(left&&lit)t=Math.max(t,7);
  if(hash(x,y,seed)<.03)t-=1.5;
  g.set(x,y,dtone(pale?'gresm':'gresrouge',clamp(pale?t-.4:t,0,pale?9:10),x,y));
 }
 // Patine du désert : coulures sombres depuis le sommet, quelques-unes longues.
 for(let x=0;x<w;x++){const n=R();if(n<.22){const len=2+Math.floor(R()*(n<.06?14:5));for(let y=1;y<len&&y<h;y++){const v=g.name(x,y);if(v)g.set(x,y,M.shiftName(v,y===len-1?-1:-2));}}}
 // Rebord de sable au sommet, sable amassé au pied.
 for(let x=0;x<w;x++){const L=hash(x,seed,6)<.3?2:1;for(let y=0;y<L;y++)g.set(x,y,tone('dune',lit?10-y*2:8-y*2));if(hash(x,seed,9)<.55)g.set(x,h-1,tone('dune',lit?6:4));if(hash(x,seed,10)<.2)g.set(x,h-2,tone('dune',lit?5:3));}
 return g;
}
module.exports={face};
if(require.main===module){const {save}=require('./png.cjs');save((process.argv[2]||'.')+'/sarak-falaises.png',[face(),face({lit:false,seed:362})],{scale:5,cols:2,gap:2,bg:'#111',tile:[2,1]});console.log('ok');}
