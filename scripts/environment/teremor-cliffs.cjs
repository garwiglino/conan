'use strict';
/* Teremor : parois rocheuses naturelles. Dessinées à plat (largeur = le long
 * du mur, hauteur = depuis le sommet) puis cisaillées en 2:1 par le moteur :
 * les corniches deviennent des lignes isométriques exactes. Face gauche
 * éclairée, face droite à l'ombre, comme les bâtiments. Rendu mûr
 * (matiere.cjs) : blocs à deux plans, grain tramé, fissures, mousse sur les
 * corniches, herbe qui retombe du sommet, pied plus sombre. */
const M=require('./matiere.cjs'),{rng,Grid,scatter,tone,dtone,hash,clamp}=M;
function face({seed=61,w=64,h=40,lit=true}={}){
 const R=rng(seed),g=new Grid(w,h,{wrap:true,fill:'roc2'}),lift=lit?0:-1.6;
 const pts=scatter(w,h,11,R,{aniso:1.35,max:40}).map(([x,y])=>[x,y,R()*Math.PI,R()]);
 const cell=new Int32Array(w*h);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){let best=1e9,k=-1;pts.forEach((p,i)=>{let dx=Math.abs(x-p[0]);dx=Math.min(dx,w-dx);const d=dx*dx+((y-p[1])*1.45)**2;if(d<best){best=d;k=i;}});cell[y*w+x]=k;}
 const c=(x,y)=>y<0?-1:y>=h?-2:cell[y*w+((x%w+w)%w)];
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const k=c(x,y),[px,py,ang,b]=pts[k];let dx=x-px;if(dx>w/2)dx-=w;if(dx<-w/2)dx+=w;
  // Deux plans par bloc : la moitié haute-gauche regarde la lumière.
  const facet=(dx*Math.cos(ang)+(y-py)*1.4*Math.sin(ang))<-1;
  let t=5.4+(b>.75?1:b<.2?-1:0)+(facet?(lit?1.4:.4):-.6)-y/h*1.4+lift+(M.snoise(x,y,2,seed+k,w,h)-.5)*1.4;
  const above=c(x,y-1)!==k,below=c(x,y+1)!==k,right=c(x+1,y)!==k,left=c(x-1,y)!==k;
  if(below)t=lit?1:.4;else if(above)t=Math.max(t+1.4,lit?7:5);else if(right)t=Math.min(t,lit?2.6:1.6);else if(left&&lit)t=Math.max(t,6);
  if(hash(x,y,seed)<.03)t-=1.5;
  g.set(x,y,dtone('roc',clamp(t,0,10),x,y));
 }
 // Fissures : traits sombres qui descendent en zigzag dans quelques blocs.
 for(let n=0;n<4;n++){let x=Math.floor(R()*w),y=4+Math.floor(R()*(h-14));const L=5+Math.floor(R()*8);for(let k=0;k<L;k++){g.set(x,y,tone('roc',lit?1:0));g.set(x+1,y,tone('roc',lit?6:4));y++;if(R()<.35)x+=R()<.5?-1:1;}}
 // Mousse et lichen sur les corniches, plus fournis près du sommet.
 for(let y=1;y<h;y++)for(let x=0;x<w;x++){const k=c(x,y);if(c(x,y-1)===k)continue;const p=y<6?.55:y<18?.25:.08;if(hash(x,y,seed+3)<p){g.set(x,y,tone('mousse',lit?3:2));if(hash(x,y,seed+4)<.5)g.set(x,y+1,tone('mousse',lit?1:0));}
  else if(lit&&hash(x,y,seed+5)<.06)g.set(x,y+1,tone('gresm',7));}
 // Herbe qui retombe du sommet (racines et brins), pied d'humus.
 for(let x=0;x<w;x++){const n=hash(x,seed,6),L=n<.12?3+Math.floor(hash(x,seed,7)*4):n<.6?1+Math.floor(hash(x,seed,8)*2):1;
  for(let y=0;y<L;y++)g.set(x,y,tone('pre',y===L-1?(lit?3:2):lit?6-y:4-y));
  if(hash(x,seed,9)<.4)g.set(x,h-1,tone('humus',lit?3:2));}
 return g;
}
module.exports={face};
if(require.main===module){const {save}=require('./png.cjs');save((process.argv[2]||'.')+'/falaises.png',[face(),face({lit:false,seed:62})],{scale:5,cols:2,gap:2,bg:'#111',tile:[2,1]});console.log('ok');}
