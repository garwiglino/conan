'use strict';
/* Varan, marais : textures de sol au rendu mûr (voir matiere.cjs). Joncs et
 * herbes mouillées en touffes, mousse dans les creux, vase luisante, eau
 * brune et verte voilée de lentilles, tourbe sous les arbres, berges de
 * racines. La hauteur de matière règle les mélanges : une touffe de jonc
 * déborde sur la vase, une flaque reste en creux. */
const M=require('./matiere.cjs'),{rng,scatter,surface,fbm,gnoise,dtone,tone,tuft,pebble,shade,clamp,hash,dither}=M;

/* Jonchaie : herbe sombre et touffue, plages de mousse mouillée dans les
 * creux, brins morts plus pâles. */
function jonchaie({seed=301,Pd=128}={}){
 const R=rng(seed),W=Pd*2,wet=(u,v)=>fbm(u,v,Pd,seed+5,[[64,1],[22,.45],[7,.2]]),dry=(u,v)=>fbm(u,v,Pd,seed+9,[[44,1],[12,.4]]);
 const g=surface(Pd,(x,y,u,v)=>[dtone('marais',5+fbm(u,v,Pd,seed,[[8,1],[3,.5]])*1.4,x,y),.35]);
 const C=M.cells(W,Pd,5.2,R);
 // Mottes : herbe sombre sur le frais, jonc pâle sur le sec, mousse dans le mouillé.
 M.clumps(g,C,(x,y,k)=>{const [u,v]=M.UV(x,y),w=wet(u,v),d=dry(u,v),r=hash(k,seed);
  if(w<-.15)return {ramp:'marais',b:clamp(6.2+d+(r-.5)*1.4+(w+.15)*4,3.5,8),tips:{rate:.3,len:[1,2]}};
  if(r<.4+w*.3)return {ramp:'marais',b:clamp(7.6+d*1.2,6,9.5),tips:{rate:.5,len:[1,3]}};
  return {ramp:'jonc',b:clamp(3.8+d*1.5+(r-.5)*1.4+(w>.35?.7:0),2.5,7),tips:{rate:.55,len:[1,3]}};},{R,seed,crevice:1.6,gain:1.5});
 // Joncs hauts : touffes éparses sur le sec, brins morts plus pâles.
 for(const [x,y]of scatter(g.w,g.h,9,R)){const [u,v]=M.UV(x,y),w=wet(u,v);if(w<-.15||R()<.35)continue;
  tuft(g,x,y,{ramp:'jonc',b:clamp(4+Math.round(dry(u,v)*1.5),3,7),n:3+Math.floor(R()*3),len:[3,6],spread:3,R,dead:{ramp:'jonc',b:8},deadRate:.25,lean:(R()-.5)*.5});}
 // Eau qui affleure dans les creux mouillés : reflets pâles d'un pixel.
 for(const [x,y]of scatter(g.w,g.h,6,R)){const [u,v]=M.UV(x,y);if(wet(u,v)>-.22||R()<.5)continue;g.set(x,y,tone('marais',9),.2);g.set(x+1,y,tone('marais',7),.2);g.set(x,y+1,tone('marais',2),.2);}
 return g;
}

/* Vase : boue noire et brune, plages luisantes, flaques qui reflètent le
 * ciel sur leur bord lointain, traces de pas, brins de jonc couchés. */
function vase({seed=311,Pd=64}={}){
 const R=rng(seed),W=Pd*2;
 const g=surface(Pd,(x,y,u,v)=>{const f=fbm(u,v,Pd,seed,[[24,1],[8,.6],[3,.35]]);return [dtone('vase',4.2+f*1.8,x,y),.42+f*.08];});
 // Mottes de boue : bombées, luisantes sur le haut, sillon sombre dessous.
 const C=M.cells(W,Pd,9,R);
 M.clumps(g,C,(x,y,k)=>{const [u,v]=M.UV(x,y),f=fbm(u,v,Pd,seed,[[24,1],[8,.6]]);return hash(k,seed)<.55?{ramp:'vase',b:4.3+f*1.6+(hash(k,seed+1)-.5)*.8}:null;},{R,seed,crevice:.55,gain:1.1,grain:1.1,h:.5});
 // Flaques rares : eau noire, ciel pâle sur le bord lointain, lèvre de boue claire.
 for(const [x,y]of scatter(g.w,g.h,38,R,{aniso:1.6})){if(R()<.3)continue;const rx=5+R()*5,ry=rx/2.1;
  for(let dy=-Math.ceil(ry);dy<=Math.ceil(ry);dy++)for(let dx=-Math.ceil(rx);dx<=Math.ceil(rx);dx++){const e=(dx/rx)**2+(dy/ry)**2+(hash(x+dx,y+dy,seed)-.5)*.35;if(e>1)continue;
   const c=e>.55&&dy<0?tone('marais',8):dy<-ry*.25&&hash(dx,dy,seed)<.5?tone('marais',5):tone('marais',2);g.set(x+dx,y+dy,c,.15);}
  for(let dx=-Math.ceil(rx*.7);dx<=Math.ceil(rx*.7);dx++)if(R()<.7)g.set(x+dx,y-Math.ceil(ry)-1,tone('vase',7),.45);
  for(let dx=-Math.ceil(rx*.7);dx<=Math.ceil(rx*.7);dx++)g.set(x+dx+1,y+Math.ceil(ry)+1,tone('vase',2),.3);}
 // Éclats d'humidité et brins couchés, cailloux.
 for(const [x,y]of scatter(g.w,g.h,5,R)){const k=R();
  if(k<.25)g.set(x,y,tone('vase',8),.5);
  else if(k<.31){const L=3+Math.floor(R()*4),d=R()<.5?1:-1;for(let s=0;s<L;s++)g.set(x+s,y+Math.round(s*d*.5),tone('jonc',s%3?8:6),.55);}
  else if(k<.47)pebble(g,x,y,{ramp:'roc',b:5,w:2+Math.floor(R()*2),hgt:2,R,cast:-1});}
 return g;
}

/* Galets moussus (pavés irréguliers des chemins de village) : pierres
 * rondes enfoncées dans la vase, mousse dans les joints. */
function galets({seed=321,Pd=64}={}){
 const R=rng(seed),W=Pd*2,H=Pd,pts=scatter(W,H,6.2,R,{aniso:1.9}),own=new Int32Array(W*H),dist=new Float32Array(W*H);
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){let best=1e9,b2=1e9,k=-1;pts.forEach((p,i)=>{let dx=Math.abs(x-p[0]),dy=Math.abs(y-p[1]);dx=Math.min(dx,W-dx);dy=Math.min(dy,H-dy);const d=dx*dx+(dy*1.9)**2;if(d<best){b2=best;best=d;k=i;}else if(d<b2)b2=d;});own[y*W+x]=k;dist[y*W+x]=Math.sqrt(b2)-Math.sqrt(best);}
 const kind=pts.map(()=>R()),g=surface(Pd,()=>null,{fill:'vase3',height:.15});
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){
  const k=own[y*W+x],e=dist[y*W+x];
  if(e<1.6){const [u,v]=M.UV(x,y);g.set(x,y,hash(x,y,seed)<.35+gnoise(u,v,10,seed,Pd)*.4?tone('mousse',1+(hash(x,y,7)<.3?1:0)):tone('vase',e<.8?1:2),.15);continue;}
  const p=pts[k];let dx=x-p[0],dy=y-p[1];if(dx>W/2)dx-=W;if(dx<-W/2)dx+=W;if(dy>H/2)dy-=H;if(dy<-H/2)dy+=H;
  const n=Math.hypot(dx/4,dy*1.9/4),l=-dx*.12-dy*.35+(1-Math.min(1,n))*.6,b=kind[k]<.2?3.6:kind[k]>.85?5.6:4.7;
  let t=b+l*2.1+(M.snoise(x,y,2,seed+k,W,H)-.5)*1.2;if(e<2.6)t-=.8;
  g.set(x,y,dtone('roc',t,x,y),.88);
  // Mousse sur le haut des galets qui restent dans l'ombre.
  if(kind[k]>.55&&dy<-1&&e<3.2&&hash(x,y,seed+2)<.5)g.set(x,y,tone('mousse',2),.9);
 }
 return g;
}

/* Eau de marais : brune et verte, presque opaque ; grandes nappes plus
 * sombres, rides courtes, voiles de lentilles d'eau et quelques nénuphars. */
function eau({seed=331,Pd=128}={}){
 const R=rng(seed),veil=(u,v)=>fbm(u,v,Pd,seed+3,[[40,1],[14,.5],[5,.3]]);
 const g=surface(Pd,(x,y,u,v)=>{const f=fbm(u,v,Pd,seed,[[56,1],[18,.4]]);return [dtone('marais',5.6+f*1.7,x,y),0];});
 // Rides : traits horizontaux de 3 à 7 px, clairs sur le haut, sombres dessous.
 for(const [x,y]of scatter(g.w,g.h,7,R,{aniso:3})){const n=3+Math.floor(R()*5),[u,v]=M.UV(x,y),f=fbm(u,v,Pd,seed,[[56,1],[18,.4]]);
  for(let s=0;s<n;s++){g.set(x+s,y,tone('marais',8+Math.round(f)+(s>0&&s<n-1?1:0)),0);if(s>0&&s<n-1&&R()<.6)g.set(x+s,y+1,tone('marais',4),0);}}
 // Lentilles d'eau : voiles de points verts serrés, plus denses au cœur.
 for(let y=0;y<g.h;y++)for(let x=0;x<g.w;x++){const [u,v]=M.UV(x,y),w=veil(u,v);if(w<.18)continue;const d=(w-.18)*2.6;
  if(hash(x,y,seed+9)<Math.min(.85,d)){const b=hash(x,y,seed+10)<.3?4:hash(x,y,seed+11)<.5?3:2;g.set(x,y,tone('lentille',b+(d>.6?1:0)),0);if(hash(x,y,seed+12)<.12)g.set(x,y+1,tone('marais',1),0);}}
 // Nénuphars : feuilles rondes fendues, éclat en haut à gauche, ombre dessous.
 for(const [x,y]of scatter(g.w,g.h,30,R,{aniso:1.5})){if(R()<.45)continue;const r=2.5+R()*2;
  for(let dy=-Math.ceil(r/2);dy<=Math.ceil(r/2);dy++)for(let dx=-Math.ceil(r);dx<=Math.ceil(r);dx++){const e=(dx/r)**2+(dy*2/r)**2;if(e>1)continue;if(dx>0&&Math.abs(dy)<1&&dx<r*.8)continue;
   const l=-dx/r*.5-dy*2/r*.7;g.set(x+dx,y+dy,tone('lentille',l>.3?4:l>-.2?3:2),0);}
  for(let dx=-Math.ceil(r)+1;dx<=Math.ceil(r);dx++)g.set(x+dx,y+Math.ceil(r/2)+1,tone('marais',1),0);
  if(R()<.35){g.set(x-1,y-1,tone('fleurm',0));g.set(x,y-1,tone('fleurm',0));g.set(x,y-2,tone('fleurm',1));}}
 return g;
}

/* Tourbe sous les arbres : brun noir, aiguilles et feuilles tombées,
 * racines affleurantes, mousse. */
function tourbe({seed=341,Pd=64}={}){
 const R=rng(seed);
 const g=surface(Pd,(x,y,u,v)=>{const f=fbm(u,v,Pd,seed,[[20,1],[7,.6],[2.5,.4]]);return [dtone('tourbe',3.3+f*1.8,x,y),.45+f*.05];});
 for(const [x,y]of scatter(g.w,g.h,2.6,R)){const k=R();
  if(k<.45){const c=R()<.5?tone('tourbe',5+Math.floor(R()*2)):tone('jonc',7+Math.floor(R()*3));const d=R()<.5?1:-1;g.set(x,y,c,.6);g.set(x+1,y+(R()<.5?0:d),c,.6);shade(g,x+1,y+1,-1);}
  else if(k<.6){g.set(x,y,tone('mousse',2+Math.floor(R()*2)),.55);g.set(x+1,y,tone('mousse',1),.5);}}
 // Racines : traits sinueux clairs dessus, sombres dessous.
 for(const [x,y]of scatter(g.w,g.h,24,R)){if(R()<.4)continue;const L=8+Math.floor(R()*10),a=R()*.6-.3;let yy=y;for(let s=0;s<L;s++){yy+=a+Math.sin(s*.7)*.4;g.set(x+s,Math.round(yy),tone('tourbe',6),.7);g.set(x+s,Math.round(yy)+1,tone('tourbe',1),.4);}}
 return g;
}

/* Berge : vase compacte, racines, chaumes de jonc cassés, laisse d'algues. */
function berge({seed=351,Pd=64}={}){
 const R=rng(seed);
 const g=surface(Pd,(x,y,u,v)=>{const f=fbm(u,v,Pd,seed,[[18,1],[6,.6],[2.4,.35]]);return [dtone('vase',3.4+f*1.8,x,y),.4+f*.12];});
 for(const [x,y]of scatter(g.w,g.h,5,R)){const k=R();
  if(k<.4)tuft(g,x,y,{ramp:'jonc',b:5+Math.floor(R()*3),n:2+Math.floor(R()*2),len:[1,3],spread:2,R,dead:{ramp:'jonc',b:8},deadRate:.5,h:.85});
  else if(k<.55)pebble(g,x,y,{ramp:'roc',b:4,w:2,hgt:2,R,cast:-1});
  else if(k<.7){for(let s=0;s<4;s++)g.set(x+s,y,tone('lentille',1+(s%2)),.5);}}
 for(const [x,y]of scatter(g.w,g.h,16,R)){if(R()<.5)continue;const L=6+Math.floor(R()*8);let yy=y;for(let s=0;s<L;s++){yy+=Math.sin(s*.6+x)*.5;g.set(x+s,Math.round(yy),tone('tourbe',5),.75);g.set(x+s,Math.round(yy)+1,tone('vase',1),.35);}}
 return g;
}

/* Planches de pont (plan 32 × 32) : bois sombre délavé, joints noirs,
 * clous rouillés, mousse dans les fentes. */
function planches({seed=361}={}){
 const R=rng(seed),g=new M.Grid(32,32,{wrap:true,fill:'planche3'});
 for(let a=0;a<32;a++){const k=Math.floor(a/4),r=a%4,base=[3,4,3,2][Math.floor(hash(k,seed)*4)];
  for(let b=0;b<32;b++){let t=r===3?0:r===0?base+1:base+(M.snoise(b,a,3,seed+k,32,32)-.5)*1.6;if(r!==3&&hash(b,k,seed)<.06)t-=1;g.set(b,a,dtone('planche',t,b,a));}
  if(r===3)for(let b=0;b<32;b++)if(hash(b,a,seed+1)<.15)g.set(b,a,tone('mousse',1));
  if(r===1)for(const b of [3,28])g.set(b,a,tone('rouille',2));}
 return g;
}
module.exports={jonchaie,vase,galets,eau,tourbe,berge,planches};
if(require.main===module){
 const {save}=require('./png.cjs'),out=process.argv[2]||'.';
 save(out+'/varan-sols.png',[jonchaie(),vase(),galets(),eau(),tourbe(),berge()],{scale:3,cols:2,gap:4,bg:'#111',tile:[2,2]});
 console.log('ok');
}
