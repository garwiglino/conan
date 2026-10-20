'use strict';
/* Teremor : parois rocheuses naturelles. Dessinées à plat (largeur = le long
 * du mur, hauteur = depuis le sommet) puis cisaillées en 2:1 par le moteur :
 * les corniches deviennent des lignes isométriques exactes. Face gauche
 * éclairée, face droite à l'ombre, comme les bâtiments. */
const {rng,Grid,scatter}=require('./brushes.cjs');
function face({seed=61,w=64,h=40,lit=true}={}){
 const R=rng(seed),g=new Grid(w,h,{wrap:true,fill:'pierre2'});
 const pts=scatter(w,h,12,R,{aniso:1.35,max:40}).map(([x,y])=>[x,y,R()*Math.PI]);
 const cell=new Int32Array(w*h);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){let best=1e9,k=-1;pts.forEach((p,i)=>{let dx=Math.abs(x-p[0]);dx=Math.min(dx,w-dx);const d=dx*dx+((y-p[1])*1.45)**2;if(d<best){best=d;k=i;}});cell[y*w+x]=k;}
 const c=(x,y)=>y<0?-1:y>=h?-2:cell[y*w+((x%w+w)%w)];
 const base=pts.map(()=>R()),lift=lit?0:-1;
 const tone=n=>'pierre'+Math.max(0,Math.min(6,n+lift));
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const k=c(x,y),p=pts[k],b=base[k],grad=y<5?1:y>h-7?-1:0;
  let dx=x-p[0];if(dx>w/2)dx-=w;if(dx<-w/2)dx+=w;
  // Deux plans par bloc : la moitié haute-gauche regarde la lumière.
  const facet=(dx*Math.cos(p[2])+(y-p[1])*1.4*Math.sin(p[2]))<-1;
  let t=3+(b>.75?1:b<.2?-1:0)+grad+(facet&&lit?1:0)-(facet||lit?0:1);
  const above=c(x,y-1)!==k,below=c(x,y+1)!==k,right=c(x+1,y)!==k,left=c(x-1,y)!==k;
  if(below)t=1;else if(above)t=Math.max(t+1,lit?5:4);else if(right&&!lit)t=Math.min(t,1);else if(right)t=Math.min(t,2);else if(left&&lit)t=Math.max(t,4);
  g.set(x,y,tone(t));
 }
 // Mousse sur les corniches, plus fournie près du sommet ; coulures depuis le haut.
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){const k=c(x,y);if(c(x,y-1)===k)continue;const p=y<4?.5:y<16?.22:.06;if(R()<p&&R()<.6){g.set(x,y,lit?'mousse3':'mousse2');if(R()<.5)g.set(x,y+1,lit?'mousse1':'mousse0');}}
 for(let x=0;x<w;x++){const n=R();if(n<.38){const len=1+Math.floor(R()*(n<.1?4:2));for(let k=0;k<len;k++)g.set(x,k,k===len-1?'mousse1':lit?'mousse2':'mousse1');}}
 return g;
}
module.exports={face};
if(require.main===module){const {save}=require('./png.cjs');save((process.argv[2]||'.')+'/falaises.png',[face(),face({lit:false,seed:62})],{scale:5,cols:2,gap:2,bg:'#111',tile:[2,1]});console.log('ok');}
