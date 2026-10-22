'use strict';
/* Sarak, désert : textures de sol au rendu mûr (matiere.cjs), même grille et
 * même lumière que Teremor. L'ambiance vient du sable chaud aux ombres
 * prune, des rides de vent, de la terre battue craquelée et du grès rouge.
 * La hauteur de matière règle les mélanges : une crête de ride déborde sur
 * la piste, un galet reste entier au bord. */
const M=require('./matiere.cjs'),{rng,scatter,surface,fbm,dtone,tone,tuft,pebble,clamp,hash,stamp}={...require('./matiere.cjs'),stamp:require('./brushes.cjs').stamp};
/* Sable : grandes plages claires et ombrées, rides de vent dont la crête
 * prend la lumière et dont le flanc sous le vent tombe dans l'ombre ; les
 * rides s'effacent par endroits ; galets et touffes sèches rares. */
function sand({seed=211,Pd=128,base=8}={}){
 const R=rng(seed),n=Pd/12.8;
 const g=surface(Pd,(x,y,u,v)=>{
  const f=fbm(u,v,Pd,seed,[[48,1],[16,.5],[5,.25]]),A=clamp(fbm(u,v,Pd,seed+5,[[32,1],[12,.4]])*1.8+.5,0,1);
  const ph=(u+v)/Pd*n+fbm(u,v,Pd,seed+9,[[40,1],[14,.4]])*1.1,s=ph-Math.floor(ph);
  let t=base+f*1.6;if(s<.12)t+=1.5*A;else if(s<.34)t-=1.7*A;else if(s<.46)t-=.6*A;
  return [dtone('dune',clamp(t,2,12),x,y),.5+(s<.12?.12*A:0)];});
 for(const [x,y]of scatter(g.w,g.h,16,R)){const k=R();
  if(k<.25)pebble(g,x,y,{ramp:k<.12?'gresrouge':'battue',b:k<.12?7:6,w:2+Math.floor(R()*2),hgt:2,R,cast:-2});
  else if(k<.3)tuft(g,x,y,{ramp:'jonc',b:9,n:3+Math.floor(R()*3),len:[2,4],spread:3,R,dead:{ramp:'dune',b:10},deadRate:.4});
  else if(k<.42)g.set(x,y,tone('dune',base+3),.55);}
 return g;
}
/* Piste damée : terre battue pâle et froide, croûte craquelée en polygones
 * dans les zones sèches, cailloux, empreintes. */
function track({seed=223,Pd=64,base=6}={}){
 const R=rng(seed),W=Pd*2,C=M.cells(W,Pd,7,R,{aniso:1.9});
 const g=surface(Pd,(x,y,u,v)=>{const f=fbm(u,v,Pd,seed,[[20,1],[7,.5],[2.5,.3]]),dry=fbm(u,v,Pd,seed+4,[[24,1]]);
  let t=base+f*1.5;const e=C.edge(x,y);if(dry>.05&&e<1)t-=2.2;else if(dry>.05&&e<2)t+=.6;
  return [dtone('battue',clamp(t,1,9),x,y),.44+f*.06];});
 for(const [x,y]of scatter(g.w,g.h,9,R)){const k=R();
  if(k<.35)pebble(g,x,y,{ramp:k<.15?'gresrouge':'roc',b:k<.15?6:7,w:2+Math.floor(R()*2),hgt:2,R,cast:-1});
  else if(k<.45){g.set(x,y,tone('battue',base-2),.4);g.set(x+1,y,tone('battue',base-2),.4);g.set(x,y-1,tone('battue',base+1),.5);}}
 return g;
}
/* Pavés de grès : pierres arrondies tièdes, quelques-unes rouges, joints de sable. */
function cobbles({seed=231,Pd=64}={}){
 const R=rng(seed),W=Pd*2,C=M.cells(W,Pd,6.6,R),kind=Array.from({length:C.n},()=>R());
 const g=surface(Pd,()=>null,{fill:'dune5',height:.15});
 for(let y=0;y<Pd;y++)for(let x=0;x<W;x++){const k=C.own(x,y),e=C.edge(x,y);
  if(e<1.5){g.set(x,y,tone('dune',e<.8?4:6),.15);continue;}
  const dx=C.dx(x,y),dy=C.dy(x,y),n=Math.min(1,Math.hypot(dx/4.5,dy*1.9/4.5)),l=-dx*.1-dy*.32+(1-n)*.5,red=kind[k]<.16;
  let t=(red?6:kind[k]>.8?6.6:5.6)+l*2+(M.snoise(x,y,2,seed+k,W,Pd)-.5)*1.3;if(e<2.5)t-=.9;if(hash(x,y,seed+5)<.03)t-=1.5;
  g.set(x,y,dtone(red?'gresrouge':'gresm',clamp(t,0,9),x,y),.9);}
 return g;
}
/* Eau de l'oasis : turquoise claire au bord, fonds bleu sombre, rides
 * courtes et reflets du ciel. */
function water({seed=241,Pd=64}={}){
 const R=rng(seed);
 const g=surface(Pd,(x,y,u,v)=>{const f=fbm(u,v,Pd,seed,[[36,1],[12,.4]]);return [dtone('bleu',5.8+f*1.8,x,y),0];});
 for(const [x,y]of scatter(g.w,g.h,9,R,{aniso:3})){if(R()<.3)continue;const n=3+Math.floor(R()*5),[u,v]=M.UV(x,y),f=fbm(u,v,Pd,seed,[[36,1],[12,.4]]);
  for(let s=0;s<n;s++){g.set(x+s,y,tone('bleu',clamp(Math.round(8+f+(s>0&&s<n-1?1:0)),0,10)),0);if(s>0&&s<n-1&&R()<.5)g.set(x+s,y+1,tone('bleu',4),0);}
  if(R()<.15)g.set(x+(n>>1),y-1,tone('bleu',10),0);}
 return g;
}
/* Berge : sable mouillé plus sombre, plaques d'algues, galets. */
function bank({seed=251,Pd=64}={}){
 const R=rng(seed);
 const g=surface(Pd,(x,y,u,v)=>{const f=fbm(u,v,Pd,seed,[[16,1],[5,.5]]);return [dtone('dune',5.6+f*1.6,x,y),.45+f*.06];});
 for(const [x,y]of scatter(g.w,g.h,7,R)){const k=R();
  if(k<.35)pebble(g,x,y,{ramp:'battue',b:6,w:2+Math.floor(R()*2),hgt:2,R,cast:-1});
  else if(k<.55)for(let j=0;j<4;j++)g.set(x+Math.floor(R()*4)-2,y+Math.floor(R()*2),tone('palmier',3+Math.floor(R()*2)),.5);}
 return g;
}
/* Éboulis au pied des rochers : sable semé d'éclats de grès rouge. */
function scree({seed=261,Pd=64,base=7}={}){
 const R=rng(seed);
 const g=surface(Pd,(x,y,u,v)=>{const f=fbm(u,v,Pd,seed,[[18,1],[6,.5]]);return [dtone('dune',base+f*1.4,x,y),.5];});
 for(const [x,y]of scatter(g.w,g.h,4.2,R)){if(R()<.25)continue;const k=R();pebble(g,x,y,{ramp:k<.7?'gresrouge':'roc',b:k<.7?5+Math.floor(R()*3):6,w:1+Math.floor(R()*3),hgt:1+Math.floor(R()*2),R,cast:-2});}
 return g;
}
/* Tablier de pont en bois blanchi (32 × 32 en plan). */
function planks({seed=271}={}){
 const g=new M.Grid(32,32,{wrap:true,fill:'gresm4'});
 for(let a=0;a<32;a++){const k=Math.floor(a/4),r=a%4,b=[5,6,5,4][Math.floor(hash(k,seed)*4)];
  for(let x=0;x<32;x++){let t=r===3?1:r===0?b+1:b+(M.snoise(x,a,3,seed+k,32,32)-.5)*1.5;if(r!==3&&hash(x,k,seed)<.06)t-=1.2;g.set(x,a,dtone('gresm',clamp(t,0,9),x,a));}
  if(r===1)for(const x of [3,28])g.set(x,a,tone('roc',3));}
 return g;
}
module.exports={sand,track,cobbles,water,bank,scree,planks};
if(require.main===module){
 const {save}=require('./png.cjs'),out=process.argv[2]||'.';
 save(out+'/sarak-sols.png',[sand(),track(),cobbles(),water(),bank(),scree()],{scale:2,cols:2,gap:4,bg:'#111',tile:[2,2]});
 console.log('ok');
}
