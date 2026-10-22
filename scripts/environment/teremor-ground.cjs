'use strict';
/* Teremor, forêt tempérée : textures de sol au rendu mûr (voir matiere.cjs),
 * comme la forteresse gobeline. Chaque texture se raccorde sur la grille
 * isométrique (2P × P à l'écran). La hauteur de matière (0 à 1) décide des
 * bords lorsque deux matières se mêlent : une motte d'herbe déborde sur la
 * terre, un pavé reste entier au bord. */
const M=require('./matiere.cjs'),{rng,scatter,surface,fbm,dtone,tone,tuft,pebble,shade,clamp,hash}=M,{stamp}=require('./brushes.cjs');

/* Prairie : mottes d'herbe bombées, pointes de brins qui débordent, plages
 * plus fraîches et plus sèches, hautes touffes éparses, trèfle. */
function grass({seed=11,Pd=128}={}){
 const R=rng(seed),W=Pd*2,dry=(u,v)=>fbm(u,v,Pd,seed+9,[[48,1],[14,.45],[5,.2]]);
 const g=surface(Pd,(x,y,u,v)=>[dtone('pre',3.4+fbm(u,v,Pd,seed,[[8,1],[3,.5]])*1.2,x,y),.35]);
 const C=M.cells(W,Pd,5.4,R);
 M.clumps(g,C,(x,y,k)=>{const [u,v]=M.UV(x,y),d=dry(u,v),r=hash(k,seed);
  if(r<.05)return {ramp:'pre',b:7.4+d,tips:{rate:.2,len:[1,1]}};
  return {ramp:'pre',b:clamp(5.3+d*1.7+(r-.5)*1.5,3.5,8.5),tips:{rate:.55,len:[1,3]}};},{R,seed,crevice:1.7,gain:1.5});
 // Hautes touffes éparses, plus pâles sur le sec.
 for(const [x,y]of scatter(g.w,g.h,10,R)){const [u,v]=M.UV(x,y),d=dry(u,v);if(R()<.45)continue;
  tuft(g,x,y,{ramp:'pre',b:clamp(6+Math.round(d*1.6),4,9),n:3+Math.floor(R()*3),len:[2,5],spread:3,R,dead:{ramp:'pre',b:10},deadRate:d>.2?.25:.05,lean:(R()-.5)*.5});}
 // Trèfle : petites rosettes plus claires sur le frais.
 for(const [x,y]of scatter(g.w,g.h,14,R)){const [u,v]=M.UV(x,y);if(dry(u,v)>-.1||R()<.5)continue;for(const [dx,dy,t]of [[0,-1,9],[-1,0,8],[1,0,8],[0,0,7],[0,1,4]])g.set(x+dx,y+dy,tone('pre',t),.62);}
 return g;
}
// Terre battue des chemins : mottes douces, cailloux, racines, feuilles et brindilles.
function dirt({seed=23,Pd=64,base=5,pebbles=1,ramp='humus'}={}){
 const R=rng(seed),W=Pd*2;
 const g=surface(Pd,(x,y,u,v)=>{const f=fbm(u,v,Pd,seed,[[22,1],[8,.6],[3,.4]]);return [dtone(ramp,base+f*1.7,x,y),.42+f*.08];});
 M.clumps(g,M.cells(W,Pd,9,R),(x,y,k)=>hash(k,seed)<.5?{ramp,b:base+.3+(hash(k,seed+1)-.5)*1.2}:null,{R,seed,crevice:.6,gain:1.1,grain:1.1,h:.5});
 for(const [x,y]of scatter(g.w,g.h,7.5/pebbles,R)){const k=R();
  if(k<.32)pebble(g,x,y,{ramp:'roc',b:5+Math.floor(R()*2),w:2+Math.floor(R()*2),hgt:2,R,cast:-1});
  else if(k<.42){g.set(x,y,tone(ramp,base+2),.5);g.set(x+1,y,tone(ramp,base+1),.5);shade(g,x+1,y+1,-1);}
  else if(k<.5){const L=3+Math.floor(R()*3),d=R()<.5?1:-1;for(let s=0;s<L;s++)g.set(x+s,y+Math.round(s*d*.5),tone('ecorcem',s%2?5:6),.55);}
  else if(k<.56){g.set(x,y,tone('fleurm',3),.5);g.set(x+1,y,tone('fleurm',2),.5);}}
 return g;
}
// Pavés irréguliers : moellons ronds de pierre grise, quelques-uns plus chauds, joints de terre.
function cobbles({seed=31,Pd=64}={}){
 const R=rng(seed),W=Pd*2,C=M.cells(W,Pd,6.6,R),kind=Array.from({length:C.n},()=>R());
 const g=surface(Pd,()=>null,{fill:'humus3',height:.15});
 for(let y=0;y<Pd;y++)for(let x=0;x<W;x++){const k=C.own(x,y),e=C.edge(x,y);
  if(e<1.5){g.set(x,y,hash(x,y,seed)<.2?tone('mousse',1):tone('humus',e<.8?1:2),.15);continue;}
  const dx=C.dx(x,y),dy=C.dy(x,y),n=Math.min(1,Math.hypot(dx/4.5,dy*1.9/4.5)),l=-dx*.1-dy*.32+(1-n)*.5,warm=kind[k]<.08;
  let t=(warm?4.4:kind[k]>.85?6.2:kind[k]<.35?4.4:5.2)+l*2+(M.snoise(x,y,2,seed+k,W,Pd)-.5)*1.3;if(e<2.5)t-=.9;if(hash(x,y,seed+5)<.03)t-=1.5;
  g.set(x,y,dtone(warm?'gresm':'roc',t,x,y),.9);}
 return g;
}
// Planches de pont (plan 32 × 32) : chêne gris, joints noirs, clous.
function planks({seed=71}={}){
 const g=new M.Grid(32,32,{wrap:true,fill:'ecorcem4'});
 for(let a=0;a<32;a++){const k=Math.floor(a/4),r=a%4,base=[5,6,5,4][Math.floor(hash(k,seed)*4)];
  for(let b=0;b<32;b++){let t=r===3?1:r===0?base+1:base+(M.snoise(b,a,3,seed+k,32,32)-.5)*1.5;if(r!==3&&hash(b,k,seed)<.06)t-=1.2;g.set(b,a,dtone('ecorcem',t,b,a));}
  if(r===1)for(const b of [3,28])g.set(b,a,tone('roc',3));}
 return g;
}
// Rivière : eau claire et sombre, rides courtes, reflets de ciel, éclats rares.
function water({seed=41,Pd=64}={}){
 const R=rng(seed);
 const g=surface(Pd,(x,y,u,v)=>{const f=fbm(u,v,Pd,seed,[[40,1],[14,.4]]);return [dtone('riviere',5.6+f*1.6,x,y),0];});
 for(const [x,y]of scatter(g.w,g.h,9,R,{aniso:3})){if(R()<.35)continue;const n=3+Math.floor(R()*6),[u,v]=M.UV(x,y),f=fbm(u,v,Pd,seed,[[40,1],[14,.4]]);
  for(let s=0;s<n;s++){g.set(x+s,y,tone('riviere',7+Math.round(f)+(s>0&&s<n-1?1:0)),0);if(s>0&&s<n-1&&R()<.6)g.set(x+s,y+1,tone('riviere',4),0);}
  if(R()<.18)g.set(x+Math.floor(n/2),y-1,tone('riviere',11),0);}
 return g;
}
// Litière de sous-bois : humus sombre, feuilles mortes (rousses, brunes, quelques
// jaunes), brindilles, plaques de mousse.
function litter({seed=53,Pd=64}={}){
 const R=rng(seed);
 const g=surface(Pd,(x,y,u,v)=>{const f=fbm(u,v,Pd,seed,[[18,1],[6,.6],[2.4,.4]]);return [dtone('humus',3+f*1.6,x,y),.45+f*.05];});
 for(const [x,y]of scatter(g.w,g.h,9,R)){const [u,v]=M.UV(x,y);if(fbm(u,v,Pd,seed+3,[[20,1]])<.25)continue;for(let k=0;k<5;k++)g.set(x+Math.floor(R()*5)-2,y+Math.floor(R()*3)-1,tone('mousse',1+Math.floor(R()*2)),.55);}
 const LEAF=[['.ab.','abbc','.cc.'],['ab.','bbc','.c.'],['.ab','abc','bc.'],['aab','bbc']];
 for(const [x,y]of scatter(g.w,g.h,4,R)){if(R()<.25)continue;const r=R(),p=LEAF[Math.floor(R()*LEAF.length)];
  const map=r<.08?{a:tone('fleurm',2),b:tone('fleurm',3),c:tone('humus',2)}:r<.4?{a:tone('briquem',6),b:tone('briquem',5),c:tone('humus',1)}:r<.75?{a:tone('humus',7),b:tone('humus',6),c:tone('humus',2)}:{a:tone('ecorcem',6),b:tone('ecorcem',5),c:tone('humus',1)};
  stamp(g,x,y,p,map,{h:.7,flip:R()<.5});}
 for(const [x,y]of scatter(g.w,g.h,16,R)){if(R()<.5)continue;const L=4+Math.floor(R()*4),d=R()<.5?1:-1;for(let s=0;s<L;s++)g.set(x+s,y+Math.round(s*d*.4),tone('ecorcem',s%3?5:6),.6);}
 return g;
}
module.exports={grass,dirt,cobbles,water,litter,planks};
if(require.main===module){
 const {save}=require('./png.cjs'),out=process.argv[2]||'.';
 save(out+'/sols.png',[grass(),dirt(),cobbles(),water(),litter(),dirt({seed:7,base:4,pebbles:1.6})],{scale:2,cols:2,gap:4,bg:'#111',tile:[2,2]});
 console.log('ok');
}
