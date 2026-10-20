'use strict';
/* Sarak : parois de grès rouge en strates. Dessinées à plat (x le long du
 * mur, y depuis le sommet) puis cisaillées en 2:1 par le moteur, comme les
 * falaises de Teremor et avec la même taille de bloc. Les blocs sont aplatis
 * et rangés en bancs : arête claire en haut, joint sombre dessous, une moitié
 * de bloc tournée vers la lumière. Coulures de patine sous le sommet. */
const {rng,Grid}=require('./brushes.cjs');
function face({seed=361,w=64,h=40,lit=true}={}){
 const R=rng(seed),g=new Grid(w,h,{wrap:true,fill:'ocre2'});
 // Bancs : rangées de centres, hauteur 5 à 8, blocs de 8 à 15 de long.
 const pts=[];for(let y=2+Math.floor(R()*2);y<h+4;y+=5+Math.floor(R()*4)){let x=R()*10;while(x<w){pts.push([x,y+(R()-.5)*1.6,R()*Math.PI,R()]);x+=8+R()*7;}}
 const cell=new Int32Array(w*h);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){let best=1e9,k=-1;pts.forEach((p,i)=>{let dx=Math.abs(x-p[0]);dx=Math.min(dx,w-dx);const d=dx*dx+((y-p[1])*2.5)**2;if(d<best){best=d;k=i;}});cell[y*w+x]=k;}
 const c=(x,y)=>y<0?-1:y>=h?-2:cell[y*w+((x%w+w)%w)];
 const lift=lit?0:-2,tone=n=>'ocre'+Math.max(0,Math.min(7,n+lift));
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const k=c(x,y),p=pts[k],b=p[3],grad=y<4?1:y>h-7?-1:0;
  let dx=x-p[0];if(dx>w/2)dx-=w;if(dx<-w/2)dx+=w;
  const facet=(dx*Math.cos(p[2])*.5+(y-p[1])*1.6*Math.sin(p[2]))<-1;
  let t=4+(b>.8?1:b<.2?-1:0)+grad+(facet&&lit?1:0);
  const above=c(x,y-1)!==k,below=c(x,y+1)!==k,right=c(x+1,y)!==k,left=c(x-1,y)!==k;
  if(below)t=1;else if(above)t=Math.max(t+1,lit?6:5);else if(c(x,y+2)!==k)t=Math.min(t,3);else if(right)t=Math.min(t,2);else if(left&&lit)t=Math.max(t,5);
  g.set(x,y,tone(t));
 }
 // Patine du désert : coulures sombres depuis le sommet, quelques-unes longues.
 for(let x=0;x<w;x++){const n=R();if(n<.22){const len=2+Math.floor(R()*(n<.06?14:5));for(let y=0;y<len&&y<h;y++)g.shift(x,y,y===len-1?-1:-2);}}
 return g;
}
module.exports={face};
if(require.main===module){const {save}=require('./png.cjs');save((process.argv[2]||'.')+'/sarak-falaises.png',[face(),face({lit:false,seed:362})],{scale:5,cols:2,gap:2,bg:'#111',tile:[2,1]});console.log('ok');}
