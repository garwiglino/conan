'use strict';
/* Sarak : flore et rochers du désert, dans le trait de Teremor (grappes
 * teintées par la lumière en haut à gauche, contour sélectif sombre en bas à
 * droite, ombre portée sur un calque séparé). Ombres violettes du sable. */
const {rng,line,stamp}=require('./brushes.cjs');
const {Sprite,clump,outline,ellipseShadow}=require('./teremor-flora.cjs');
const SH='sable0';
// Palmier dattier : stipe courbe annelé, couronne de palmes retombantes, régimes de dattes.
function palm(seed,{w=56,h=78,lean=1}={}){
 const R=rng(seed),s=new Sprite(w,h,Math.floor(w/2),h-5),g=s.g,base=h-5,cx=w/2;
 ellipseShadow(s,cx+3,base,10,3,SH);
 const top=[cx+lean*(5+R()*3),base-46-Math.floor(R()*6)],mid=[cx+lean*(1+R()*2),base-24];
 const at=t=>[(1-t)*(1-t)*cx+2*(1-t)*t*mid[0]+t*t*top[0],(1-t)*(1-t)*base+2*(1-t)*t*mid[1]+t*t*top[1]];
 // Stipe : 5 px en bas, 3 en haut ; anneaux tous les 3 px, flanc gauche éclairé.
 for(let y=Math.floor(top[1]);y<=base;y++){let t=0;for(let k=0;k<=60;k++){const p=at(k/60);if(Math.abs(p[1]-y)<.6){t=k/60;break;}}
  const [x]=at(t),hw=2.6-t*1.1,a=Math.round(x-hw),b=Math.round(x+hw)-1,ring=((base-y)%3)===0;
  for(let xx=a;xx<=b;xx++){const f=(xx-a)/Math.max(1,b-a);let c=f<.3?4:f<.65?3:2;if(ring)c=f<.3?3:f<.7?2:1;g.set(xx,y,'bois'+c);}
  g.set(a-1,y,'bois0');g.set(b+1,y,'bois0');if(ring&&R()<.5)g.set(a,y-1,'bois5');}
 const [tx,ty]=top;
 // Palmes : nervure courbe et folioles qui pendent ; celles de derrière plus sombres.
 const frond=(ang,len,droop,d)=>{const a=ang*Math.PI/180,ca=Math.cos(a),sa=Math.sin(a),side=ca<0?-1:1;
  for(let s2=0;s2<=len;s2++){const t=s2/len,x=tx+ca*len*t,y=ty+sa*len*t+droop*t*t;
   g.set(x,y,'palme'+Math.max(0,3+d));if(t<.92)g.set(x,y-1,'palme'+Math.max(0,4+d+(side<0?1:0)));
   const ll=t<.12?0:t<.8?2+(s2%2):1;for(let k=1;k<=ll;k++)g.set(x+side*k*.6,y+k,'palme'+Math.max(0,(k===ll?1:2)+d+(side<0?1:0)));}
  g.set(tx+ca*len,ty+sa*len+droop+1,'palme'+Math.max(0,2+d));};
 for(const [a,l,dr]of [[-150,14,5],[-30,14,5],[-105,10,2],[-70,11,3],[-128,12,4],[-52,12,4]])frond(a+(R()-.5)*10,l+Math.floor(R()*3),dr,-1);
 // Régimes de dattes sous la couronne.
 for(const [dx,dy]of [[-2,2],[2,3]]){stamp(g,tx+dx-1,ty+dy,['.a.','abc','.c.'],{a:'ocre6',b:'ocre5',c:'ocre3'});}
 for(const [a,l,dr]of [[175,17,10],[5,17,10],[150,14,9],[30,14,9],[118,10,7],[62,10,7],[92,8,6]])frond(a+(R()-.5)*8,l+Math.floor(R()*3),dr,0);
 g.set(tx,ty,'palme6');g.set(tx-1,ty,'palme5');g.set(tx+1,ty-1,'palme5');
 outline(s,'palme');return s;
}
// Arbre mort : bois blanchi, branches tordues, brindilles.
function deadTree(seed,{w=44,h=50}={}){
 const R=rng(seed),s=new Sprite(w,h,Math.floor(w/2),h-4),g=s.g,base=h-4,cx=w/2;
 ellipseShadow(s,cx+3,base,9,3,SH);
 const limb=(pts,r0,r1)=>{for(let k=1;k<pts.length;k++){const [a,b]=pts[k-1],[c,d]=pts[k],n=Math.ceil(Math.hypot(c-a,d-b)*2);for(let i=0;i<=n;i++){const t=i/n,x=a+(c-a)*t,y=b+(d-b)*t,r=r0+(r1-r0)*((k-1+t)/(pts.length-1));
  for(let yy=Math.floor(y-r);yy<=y+r;yy++)for(let xx=Math.floor(x-r);xx<=x+r;xx++){const dx=xx+.5-x,dy=yy+.5-y;if(dx*dx+dy*dy>r*r+.2)continue;const l=dx/r;g.set(xx,yy,'bois'+(l<-.35?5:l<.25?4:l<.7?3:2));}}}};
 const lean=R()<.5?-1:1;
 limb([[cx,base],[cx-1*lean,base-10],[cx+lean,base-20]],2.6,1.6);
 limb([[cx+lean,base-19],[cx-7*lean,base-28],[cx-11*lean,base-35]],1.4,.7);
 limb([[cx+lean,base-20],[cx+6*lean,base-27],[cx+9*lean,base-36]],1.3,.7);
 limb([[cx,base-12],[cx+8*lean,base-16],[cx+13*lean,base-21]],1.1,.6);
 limb([[cx+lean,base-21],[cx+2*lean,base-31],[cx,base-40]],1.1,.6);
 for(const [a,b,c,d]of [[cx-11*lean,base-35,cx-14*lean,base-39],[cx-11*lean,base-35,cx-9*lean,base-40],[cx+9*lean,base-36,cx+12*lean,base-40],[cx+13*lean,base-21,cx+16*lean,base-23],[cx,base-40,cx-2*lean,base-44],[cx-7*lean,base-28,cx-10*lean,base-27]])line(g,a,b,c,d,'bois3');
 for(const [dx,len]of [[-3,-4],[3,4]]){line(g,cx+dx,base,cx+dx+len,base+1,'bois2');}
 outline(s,'bois');return s;
}
// Buisson de saladelle : touffes gris-vert serrées, parfois en fleur.
function shrub(seed,{w=32,h=24,bloom=false}={}){
 const R=rng(seed),s=new Sprite(w,h,Math.floor(w/2),h-4),cx=w/2,base=h-4;ellipseShadow(s,cx+2,base,12,3.5,SH);
 for(const [dx,dy,rx,ry,b]of [[-6,-5,7,5,-.5],[6,-5,7,5,-.7],[0,-8,8,6,.2],[-1,-3,8,4,-.9]])clump(s,cx+dx,base+dy,rx,ry,'sauge',{R,bias:b+.5,max:5,leaf:2,gain:2.6});
 if(bloom)for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(s.g.get(x,y)&&!s.g.get(x,y-1)&&R()<.35)s.g.set(x,y,R()<.5?'fleur1':'fleur3');
 outline(s,'sauge');return s;
}
// Touffe d'alfa : brins raides en éventail, pointes claires.
function tuft(seed,{dry=false}={}){
 const R=rng(seed),s=new Sprite(22,16,11,13),g=s.g,base=13,ramp=dry?'piste':'sauge';ellipseShadow(s,12,base,7,2,SH);
 for(let i=0;i<11;i++){const a=-Math.PI/2+(i/10-.5)*2.1+(R()-.5)*.2,len=6+R()*6,x1=11+Math.cos(a)*len,y1=base+Math.sin(a)*len*.9;
  line(g,11+(i-5)*.3,base,x1,y1,ramp+(dry?3:2));g.set(x1,y1,ramp+(dry?5:4));if(a<-Math.PI/2)g.set((11+x1)/2,(base+y1)/2,ramp+(dry?4:3));}
 for(let x=7;x<16;x++)g.set(x,base,ramp+(dry?2:1));
 return s;
}
/* Rochers de grès : masse lisse teintée par la lumière, strates sombres. */
function rock(seed,{w=34,h=26,parts=[[0,-8,13,9,-.1]],strata=true}={}){
 const R=rng(seed),s=new Sprite(w,h,Math.floor(w/2),h-5),cx=w/2,base=h-5;ellipseShadow(s,cx+3,base,w*.42,3.5,SH);
 for(const [dx,dy,rx,ry,b]of parts)clump(s,cx+dx,base+dy,rx,ry,'ocre',{R,leaf:5,max:7,smooth:true,gain:2.4,bias:b+.1});
 for(let x=0;x<w;x++)for(let y=base;y<h;y++)s.g.set(x,y,null);
 if(strata)for(let y=base-2;y>2;y-=3+Math.floor(R()*2))for(let x=0;x<w;x++){if(!s.g.get(x,y)||!s.g.get(x,y-1)||R()<.25)continue;s.g.shift(x,y,-1);}
 outline(s,'ocre');return s;
}
// Cheminée de fée : colonne tendre en strates sous un chapeau de roche dure.
function hoodoo(seed,{w=30,h=46}={}){
 const R=rng(seed),s=new Sprite(w,h,Math.floor(w/2),h-5),g=s.g,cx=w/2,base=h-5;ellipseShadow(s,cx+3,base,10,3,SH);
 for(let y=base-1;y>=11;y--){const t=(base-y)/(base-11),hw=6.4-t*2.6+Math.sin(y*.55)*.7+(y>base-5?(y-base+5)*.6:0),a=Math.round(cx-hw),b=Math.round(cx+hw)-1,band=(y%5)===0;
  for(let x=a;x<=b;x++){const f=(x-a)/Math.max(1,b-a);let c=f<.25?5:f<.55?4:f<.82?3:2;if(band)c=Math.max(1,c-1);g.set(x,y,'ocre'+c);}}
 // Chapeau de roche dure, plus sombre et plus large que la colonne.
 clump(s,cx+1,9,9,5,'pise',{R,leaf:4,max:4,smooth:true,gain:2,bias:-1.7});
 for(let x=0;x<w;x++)if(g.name(x,13)?.startsWith('pise')&&g.name(x,14)?.startsWith('ocre'))g.set(x,14,'ocre1');
 outline(s,'ocre');return s;
}
function pebbles(seed){
 const R=rng(seed),s=new Sprite(16,10,8,7),g=s.g;ellipseShadow(s,9,7,6,2,SH);
 stamp(g,3,4,['.ab','abc','.cc'],{a:'ocre6',b:'ocre5',c:'ocre3'});stamp(g,8,5,['ab','cc'],{a:'pierre5',b:'pierre4',c:'pierre3'});stamp(g,11,3,['ab','bc'],{a:'ocre5',b:'ocre4',c:'ocre2'});
 return s;
}
function all(){return {
 palmier_a:palm(1101),palmier_b:palm(1202,{lean:-1,h:72}),arbre_mort_a:deadTree(1303),arbre_mort_b:deadTree(1404,{h:44}),
 buisson_a:shrub(1505),buisson_b:shrub(1606,{bloom:true}),touffe_a:tuft(1707),touffe_b:tuft(1808,{dry:true}),
 rocher_a:rock(1909,{w:38,h:24,parts:[[0,-7,15,8,-.1],[10,-3,6,4,-.5]]}),rocher_b:rock(2010,{w:32,h:34,parts:[[0,-7,13,8,-.3],[-1,-17,9,6,.3]]}),
 cheminee:hoodoo(2111),rocher_rond:rock(2212,{w:30,h:26,parts:[[0,-9,11,9,0]],strata:false}),
 eboulis:rock(2313,{w:34,h:20,parts:[[-7,-5,6,5,-.1],[5,-4,7,5,-.3],[-1,-2,4,3,-.6]]}),cailloux:pebbles(2414)};}
module.exports={all,palm,deadTree,shrub,tuft,rock,hoodoo,pebbles};
if(require.main===module){
 const {save}=require('./png.cjs'),{Grid}=require('./brushes.cjs'),F=all(),list=Object.values(F),W=Math.max(...list.map(s=>s.w)),H=Math.max(...list.map(s=>s.h));
 const tiles=list.map(s=>{const g=new Grid(W,H,{fill:'sable5'});for(let y=0;y<s.h;y++)for(let x=0;x<s.w;x++){const sh=s.shadow.get(x,y);const ty=y+H-s.h,tx=x+((W-s.w)>>1);if(sh)g.set(tx,ty,'sable3');const v=s.g.get(x,y);if(v)g.px[ty*W+tx]=v;}return g;});
 save((process.argv[2]||'.')+'/sarak-flore.png',tiles,{scale:3,cols:7,gap:2,bg:'#111'});console.log('ok');
}
