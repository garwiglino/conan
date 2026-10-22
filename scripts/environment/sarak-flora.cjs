'use strict';
/* Sarak, désert : flore et rochers au rendu mûr (matiere.cjs). Palmiers
 * dattiers, arbres morts blanchis, buissons de saladelle, touffes d'alfa,
 * rochers et cheminées de fée de grès rouge, cailloux. Lumière en haut à
 * gauche, grain tramé, contour sombre prune en bas à droite, ombre portée
 * sur un calque séparé. */
const M=require('./matiere.cjs'),{rng,Sprite,castShadow,outline,foliage,tone,dtone,hash,clamp}=M,{line}=require('./brushes.cjs');
const INK='dune0',SH='dune3';
// Membre de bois rond : rayon r0 -> r1 le long de la polyligne, flanc gauche éclairé.
function limb(s,pts,r0,r1,{ramp='gresm',light=7,seed=1}={}){
 const top=M.rampLen(ramp)-1;
 for(let k=1;k<pts.length;k++){const [a,b]=pts[k-1],[c,d]=pts[k],n=Math.ceil(Math.hypot(c-a,d-b)*2);for(let i=0;i<=n;i++){const t=i/n,x=a+(c-a)*t,y=b+(d-b)*t,r=r0+(r1-r0)*((k-1+t)/(pts.length-1));
  for(let yy=Math.floor(y-r);yy<=y+r;yy++)for(let xx=Math.floor(x-r);xx<=x+r;xx++){const dx=xx+.5-x,dy=yy+.5-y;if(dx*dx+dy*dy>r*r+.2)continue;const l=dx/Math.max(.6,r);
   s.g.set(xx,yy,dtone(ramp,clamp(light-1-l*2.6+(M.snoise(xx,yy,1.5,seed,256,256)-.5)*1.2,0,top),xx,yy));}}}
}
/* Palmier dattier : stipe annelé courbe, couronne de palmes arquées dont
 * les folioles pendent, régimes de dattes ; palmes de derrière plus sombres. */
function palm(seed,{w=60,h=80,lean=1}={}){
 const R=rng(seed),s=new Sprite(w,h,Math.floor(w/2),h-5),g=s.g,base=h-5,cx=w/2;
 castShadow(s,cx+10,base,16,5,SH);
 const top=[cx+lean*(5+R()*3),base-48-Math.floor(R()*6)],mid=[cx+lean*(1+R()*2),base-24];
 const at=t=>[(1-t)*(1-t)*cx+2*(1-t)*t*mid[0]+t*t*top[0],(1-t)*(1-t)*base+2*(1-t)*t*mid[1]+t*t*top[1]];
 // Stipe : 5 px en bas, 3 en haut ; écailles en chevrons, flanc gauche éclairé.
 for(let y=Math.floor(top[1]);y<=base;y++){let t=0;for(let k=0;k<=60;k++){const p=at(k/60);if(Math.abs(p[1]-y)<.6){t=k/60;break;}}
  const [x]=at(t),hw=2.8-t*1.1+(y>base-3?.8:0),a=Math.round(x-hw),b=Math.round(x+hw)-1,ring=((base-y)%3)===0;
  for(let xx=a;xx<=b;xx++){const f=(xx-a)/Math.max(1,b-a);let c=7-f*4.4;if(ring)c-=1.6;else if(((base-y)%3)===1&&(xx+y)%2)c+=.6;g.set(xx,y,dtone('ecorcem',clamp(c,0,8),xx,y));}}
 const [tx,ty]=top;
 const frond=(ang,len,droop,d)=>{const a=ang*Math.PI/180,ca=Math.cos(a),sa=Math.sin(a),side=ca<0?-1:1;
  for(let s2=0;s2<=len;s2++){const t=s2/len,x=tx+ca*len*t,y=ty+sa*len*t+droop*t*t,lit=(side<0?1:0)+d;
   g.set(x,y,tone('palmier',clamp(4+lit,0,9)));if(t<.92)g.set(x,y-1,tone('palmier',clamp(6+lit,0,9)));
   const ll=t<.12?0:t<.8?2+(s2%2):1;for(let k=1;k<=ll;k++)g.set(x+side*k*.6,y+k,dtone('palmier',clamp((k===ll?2.4:3.6)+lit+(1-t),0,9),Math.round(x+side*k*.6),Math.round(y+k)));}
  g.set(tx+ca*len,ty+sa*len+droop+1,tone('palmier',clamp(3+d,0,9)));};
 for(const [a,l,dr]of [[-150,15,5],[-30,15,5],[-105,11,2],[-70,12,3],[-128,13,4],[-52,13,4]])frond(a+(R()-.5)*10,l+Math.floor(R()*3),dr,-2);
 // Régimes de dattes sous la couronne.
 for(const [dx,dy]of [[-2,2],[2,3]])for(const [ex,ey,t]of [[0,0,6],[1,0,5],[-1,1,5],[0,1,4],[1,1,3],[0,2,2]])g.set(tx+dx+ex,ty+dy+ey,tone('briquem',t));
 for(const [a,l,dr]of [[175,18,10],[5,18,10],[150,15,9],[30,15,9],[118,11,7],[62,11,7],[92,9,6]])frond(a+(R()-.5)*8,l+Math.floor(R()*3),dr,0);
 g.set(tx,ty,tone('palmier',8));g.set(tx-1,ty,tone('palmier',7));g.set(tx+1,ty-1,tone('palmier',7));
 outline(s,INK);return s;
}
// Arbre mort : bois blanchi par le soleil, branches tordues, brindilles.
function deadTree(seed,{w=46,h=52}={}){
 const R=rng(seed),s=new Sprite(w,h,Math.floor(w/2),h-4),base=h-4,cx=w/2;
 castShadow(s,cx+8,base,13,4,SH);
 const lean=R()<.5?-1:1,o={seed};
 limb(s,[[cx,base],[cx-1*lean,base-10],[cx+lean,base-20]],2.8,1.6,o);
 limb(s,[[cx+lean,base-19],[cx-7*lean,base-28],[cx-11*lean,base-35]],1.4,.7,o);
 limb(s,[[cx+lean,base-20],[cx+6*lean,base-27],[cx+9*lean,base-36]],1.3,.7,o);
 limb(s,[[cx,base-12],[cx+8*lean,base-16],[cx+13*lean,base-21]],1.1,.6,o);
 limb(s,[[cx+lean,base-21],[cx+2*lean,base-31],[cx,base-40]],1.1,.6,o);
 for(const [a,b,c,d]of [[cx-11*lean,base-35,cx-14*lean,base-39],[cx-11*lean,base-35,cx-9*lean,base-40],[cx+9*lean,base-36,cx+12*lean,base-40],[cx+13*lean,base-21,cx+16*lean,base-23],[cx,base-40,cx-2*lean,base-44],[cx-7*lean,base-28,cx-10*lean,base-27]])line(s.g,a,b,c,d,tone('gresm',5));
 // Fentes sombres le long du tronc, racines qui affleurent.
 for(let y=base-18;y<base-2;y++)if(hash(y,seed)<.35)s.g.set(cx-lean*.5+(hash(y,seed+1)<.5?0:1),y,tone('gresm',2));
 for(const [dx,len]of [[-3,-5],[3,5],[0,-2]]){line(s.g,cx+dx,base,cx+dx+len,base+1,tone('gresm',3));line(s.g,cx+dx,base-1,cx+dx+len*.7,base,tone('gresm',6));}
 outline(s,INK);return s;
}
// Buisson de saladelle : touffes gris-vert serrées, parfois en fleur.
function shrub(seed,{w=32,h=24,bloom=false}={}){
 const R=rng(seed),s=new Sprite(w,h,Math.floor(w/2),h-4),cx=w/2,base=h-4;castShadow(s,cx+5,base,12,4,SH);
 for(const [dx,dy,rx,ry,b]of [[-6,-5,7,5,-.6],[6,-5,7,5,-.8],[-1,-3,8,4,-1],[0,-9,8,6,.6]])foliage(s,cx+dx,base+dy,rx,ry,'saule',{R,leaf:1.9,gain:3.2,bias:b+1,edge:1.6,holes:.1,seed:seed+dx});
 if(bloom)for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(s.g.get(x,y)&&!s.g.get(x,y-1)&&R()<.35)s.g.set(x,y,tone('fleurm',R()<.5?4:2));
 outline(s,INK);return s;
}
// Touffe d'alfa : brins raides en éventail, pointes claires (sèche : paille).
function tuft(seed,{dry=false}={}){
 const R=rng(seed),s=new Sprite(24,18,12,14),g=s.g,base=14,ramp=dry?'gresm':'jonc',b=dry?6:6;castShadow(s,14,base,8,2,SH);
 const blades=[];for(let i=0;i<13;i++)blades.push({a:-Math.PI/2+(i/12-.5)*2.2+(R()-.5)*.2,len:6+R()*7,x0:12+(i-6)*.3});
 blades.sort((p,q)=>Math.abs(q.a+Math.PI/2)-Math.abs(p.a+Math.PI/2));
 for(const {a,len,x0}of blades){const x1=x0+Math.cos(a)*len,y1=base+Math.sin(a)*len*.9,lit=a<-Math.PI/2?1:-1;
  for(let k=0;k<=len;k++){const t=k/len;g.set(x0+(x1-x0)*t,base+(y1-base)*t,tone(ramp,clamp(Math.round(b+lit+t*2.4),0,11)));}}
 for(let x=8;x<17;x++)g.set(x,base,tone(ramp,b-3));
 return s;
}
/* Rochers de grès : masse lisse teintée par la lumière, strates sombres. */
function rock(seed,{w=34,h=26,parts=[[0,-8,13,9,-.1]],strata=true}={}){
 const R=rng(seed),s=new Sprite(w,h,Math.floor(w/2),h-5),cx=w/2,base=h-5;castShadow(s,cx+5,base,w*.45,4,SH);
 parts.forEach(([dx,dy,rx,ry,b],k)=>foliage(s,cx+dx,base+dy,rx,ry,'gresrouge',{R,leaf:5,stretch:1.6,gain:3,bias:b+.8,edge:.4,seed:seed+k}));
 for(let x=0;x<w;x++)for(let y=base+1;y<h;y++)s.g.set(x,y,null);
 if(strata)for(let y=base-2;y>2;y-=3+Math.floor(R()*2))for(let x=0;x<w;x++){const v=s.g.name(x,y);if(!v||!s.g.get(x,y-1)||R()<.25)continue;s.g.set(x,y,M.shiftName(v,-2));if(s.g.get(x,y+1)&&R()<.5)s.g.set(x,y+1,M.shiftName(s.g.name(x,y+1),1));}
 outline(s,INK);return s;
}
// Cheminée de fée : colonne tendre en strates sous un chapeau de roche dure.
function hoodoo(seed,{w=30,h=46}={}){
 const R=rng(seed),s=new Sprite(w,h,Math.floor(w/2),h-5),g=s.g,cx=w/2,base=h-5;castShadow(s,cx+6,base,10,4,SH);
 for(let y=base-1;y>=11;y--){const t=(base-y)/(base-11),hw=6.4-t*2.6+Math.sin(y*.55)*.7+(y>base-5?(y-base+5)*.6:0),a=Math.round(cx-hw),b=Math.round(cx+hw)-1,band=(y%5)===0;
  for(let x=a;x<=b;x++){const f=(x-a)/Math.max(1,b-a);let c=8.4-f*5;if(band)c-=1.6;else if((y%5)===1)c+=.6;g.set(x,y,dtone('gresrouge',clamp(c,0,10),x,y));}}
 // Chapeau de roche dure, plus sombre et plus large que la colonne.
 foliage(s,cx+1,9,9,5,'battue',{R,leaf:4,gain:2.6,bias:-.6,edge:.5,seed});
 for(let x=0;x<w;x++)if(g.name(x,13)?.startsWith('battue')&&g.name(x,14)?.startsWith('gresrouge'))g.set(x,14,tone('gresrouge',1));
 outline(s,INK);return s;
}
function pebbles(seed){
 const R=rng(seed),s=new Sprite(18,12,9,8);castShadow(s,10,8,7,2,SH);
 for(const [x,y,ramp,b,w]of [[4,6,'gresrouge',7,3],[9,7,'roc',7,2],[13,5,'gresrouge',6,2],[7,3,'battue',7,2]])M.pebble(s.g,x,y,{ramp,b,w,hgt:2,R,cast:0});
 return s;
}
function all(){return {
 palmier_a:palm(1101),palmier_b:palm(1202,{lean:-1,h:74}),arbre_mort_a:deadTree(1303),arbre_mort_b:deadTree(1404,{h:46}),
 buisson_a:shrub(1505),buisson_b:shrub(1606,{bloom:true}),touffe_a:tuft(1707),touffe_b:tuft(1808,{dry:true}),
 rocher_a:rock(1909,{w:38,h:24,parts:[[0,-7,15,8,-.1],[10,-3,6,4,-.5]]}),rocher_b:rock(2010,{w:32,h:34,parts:[[0,-7,13,8,-.3],[-1,-17,9,6,.3]]}),
 cheminee:hoodoo(2111),rocher_rond:rock(2212,{w:30,h:26,parts:[[0,-9,11,9,0]],strata:false}),
 eboulis:rock(2313,{w:34,h:20,parts:[[-7,-5,6,5,-.1],[5,-4,7,5,-.3],[-1,-2,4,3,-.6]]}),cailloux:pebbles(2414)};}
module.exports={all,palm,deadTree,shrub,tuft,rock,hoodoo,pebbles,limb};
if(require.main===module){
 const {save}=require('./png.cjs'),{Grid}=require('./brushes.cjs'),F=all(),list=Object.values(F),W=Math.max(...list.map(s=>s.w)),H=Math.max(...list.map(s=>s.h));
 const tiles=list.map(s=>{const g=new Grid(W,H,{fill:'dune8'});for(let y=0;y<s.h;y++)for(let x=0;x<s.w;x++){const ty=y+H-s.h,tx=x+((W-s.w)>>1);if(s.shadow.get(x,y))g.set(tx,ty,'dune5');const v=s.g.get(x,y);if(v)g.px[ty*W+tx]=v;}return g;});
 save((process.argv[2]||'.')+'/sarak-flore.png',tiles,{scale:3,cols:7,gap:2,bg:'#111'});console.log('ok');
}
