'use strict';
/* Teremor, forêt tempérée : flore au rendu mûr (matiere.cjs). Chênes à
 * couronne en grappes, bouleaux blancs, buissons, rochers à lichen,
 * fougères, champignons et fleurs des champs. Lumière en haut à gauche,
 * feuillage tramé, contour sombre sélectif en bas à droite, ombre portée sur
 * un calque séparé. */
const M=require('./matiere.cjs'),{rng,Sprite,castShadow,outline,foliage,tone,dtone,hash,clamp,trunk,branch}=M,{line}=require('./brushes.cjs');
const INK='frondaison0',SHADOW='pre1';
/* Couronne : grappes posées de l'arrière (bas, plus sombres) vers l'avant
 * (haut, éclairées) sur un cœur d'ombre où l'on devine les branches. */
function crown(s,cx,cy,rx,ry,ramp,{R,seed,lobes,leaf=2.2,gain=3.4,holes=.1,core=1}){
 const inside=(x,y)=>((x-cx)/rx)**2+((y-cy)/ry)**2<=1;
 for(let y=Math.floor(cy-ry);y<=cy+ry;y++)for(let x=Math.floor(cx-rx);x<=cx+rx;x++)if(inside(x,y)&&hash(x,y,seed)<.97)s.g.set(x,y,tone(ramp,core));
 lobes.sort((a,b)=>b[1]-a[1]).forEach(([dx,dy,lx,ly],k)=>{const f=(dy/ry+1)/2;
  foliage(s,cx+dx*rx,cy+dy*ry,lx*rx,ly*ry,ramp,{R,leaf,gain,bias:.9-f*2.4-(dx>0?.3:0),edge:1.5,holes,seed:seed+k});});
}
// Branches visibles sous la couronne : fourche du tronc et bras qui montent.
function limbs(s,cx,y0,arms,{ramp='ecorcem',light=6}={}){for(const [dx,dy,t]of arms){branch(s,cx,y0,cx+dx,y0+dy,{ramp,thick:t,light});}}
/* Chêne : tronc trapu à empattement, fourche, couronne large en dômes. */
function oak(seed,{w=72,h=84}={}){
 const R=rng(seed),s=new Sprite(w,h,w>>1,h-6),cx=w/2,base=h-6,rx=w/2-9,ry=h*.29,cy=base-h*.6;
 castShadow(s,cx+12,base,rx*.8,9,SHADOW);
 trunk(s,cx,base,cy+4,t=>2.6+1.4*(1-t)+4*Math.max(0,1-t*5)**2,{seed,flutes:3,light:6.4});
 for(const [dx,len]of [[-6,-5],[5,6],[-2,-3]]){line(s.g,cx+dx*.4,base,cx+dx+len*.6,base+1,tone('ecorcem',2));line(s.g,cx+dx*.4,base-1,cx+dx+len*.4,base,tone('ecorcem',5));}
 limbs(s,cx,cy+10,[[-rx*.55,-ry*.5,2],[rx*.5,-ry*.6,2],[-2,-ry*.9,2],[rx*.2,-ry*.2,1]]);
 const lobes=[[-.5,-.35,.52,.55],[.45,-.3,.55,.55],[0,-.6,.5,.45],[-.62,.25,.4,.42],[.6,.3,.42,.42],[-.15,.35,.45,.4],[.22,-.05,.45,.45],[-.3,-.75,.3,.3],[.35,-.72,.3,.28]];
 crown(s,cx,cy,rx,ry,'frondaison',{R,seed,lobes:lobes.map(([a,b,c,d])=>[a+(R()-.5)*.1,b+(R()-.5)*.1,c,d]),leaf:2.3,gain:3.5,holes:.12});
 // Glands et feuilles sèches pour la variété.
 for(let k=0;k<6;k++){const x=cx+(R()-.5)*rx*1.4,y=cy+(R()-.3)*ry;if(s.g.get(x,y)&&M.toneOf(s.g.name(x,y))[1]>5)s.g.set(x,y,tone('fleurm',3));}
 outline(s,INK);return s;
}
/* Bouleau : tronc blanc fin marqué de lenticelles noires, ramure qui monte,
 * feuillage clair en petites grappes aérées entre lesquelles on voit le bois. */
function birch(seed,{w=48,h=96}={}){
 const R=rng(seed),s=new Sprite(w,h,w>>1,h-5),cx=w/2,base=h-5,top=base-h*.88,lean=(R()-.5)*.08,H=base-top;
 castShadow(s,cx+9,base,14,5,SHADOW);
 const tx=q=>cx+lean*q*H;
 // Grappes de l'arrière, sombres : elles donnent la masse.
 const clumps=[];for(let k=0;k<11;k++){const q=.36+k/10*.6+(R()-.5)*.06,side=k%2?1:-1,reach=(1-q)*13+3+R()*3;clumps.push([tx(q)+side*reach,base-q*H,5+R()*3+(1-q)*3,3.5+R()*1.5,q,side]);}
 for(const [x,y,rx,ry]of clumps)foliage(s,x+(x<cx?2:-2),y+3,rx*.9,ry,'pre',{R,leaf:1.7,gain:2,bias:-1.6,edge:1.8,holes:.2,droop:.7,seed:seed+x|0});
 trunk(s,cx,base,top+6,q=>1.1+1*(1-q)+1.8*Math.max(0,1-q*6)**2,{ramp:'bouleau',seed,light:5.4,lean});
 for(let y=top+8;y<base-1;y++){const x=Math.round(tx((base-y)/H));if(hash(y,seed)<.24){s.g.set(x-1,y,tone('roc',1));s.g.set(x,y,tone('roc',hash(y,seed+1)<.5?2:1));}}
 for(let y=base-6;y<base;y++)s.g.set(Math.round(tx(0))+(hash(y,seed+2)<.5?0:-1),y,tone('roc',2));
 for(const [x,y,,,q,side]of clumps){const x0=tx(q-.08),y0=base-(q-.08)*H;branch(s,x0,y0,x,y,{ramp:'bouleau',light:4});}
 // Grappes de devant, claires, posées en quinconce : le tronc se lit entre elles.
 clumps.sort((a,b)=>a[1]-b[1]).forEach(([x,y,rx,ry,q],k)=>foliage(s,x,y,rx,ry,'pre',{R,leaf:1.7,gain:3.6,bias:.9-q*.3,edge:1.8,holes:.25,droop:.7,seed:seed+k*7}));
 outline(s,INK);return s;
}
/* Buisson : dôme de grappes serrées ; aubépine en fleur ou baies rouges. */
function bush(seed,{w=34,h=26,bloom=false}={}){
 const R=rng(seed),s=new Sprite(w,h,w>>1,h-4),cx=w/2,base=h-4;castShadow(s,cx+5,base,w*.42,4,SHADOW);
 crown(s,cx,base-h*.38,w/2-2,h*.38,'frondaison',{R,seed,lobes:[[-.45,.2,.55,.6],[.45,.25,.55,.55],[0,-.25,.6,.6],[-.2,.35,.5,.45],[.25,-.4,.4,.4]],leaf:1.9,gain:3.4,holes:.06,core:1});
 for(let k=0;k<(bloom?22:9);k++){const x=cx+(R()-.5)*(w-8),y=base-h*.38+(R()-.55)*h*.6;const n=s.g.name(Math.round(x),Math.round(y));if(!n)continue;const lit=M.toneOf(n)[1]>4;
  if(bloom){s.g.set(x,y,tone('fleurm',lit?0:1));if(lit&&R()<.5)s.g.set(x+1,y,tone('fleurm',1));}
  else{s.g.set(x,y,tone('fleurm',lit?6:7));s.g.set(x+1,y+1,tone('fleurm',7));}}
 outline(s,INK);return s;
}
/* Rocher : facettes grises à lichen pâle et mousse, touffe d'herbe au pied. */
function boulder(seed,{w=34,h=28}={}){
 const R=rng(seed),s=new Sprite(w,h,w>>1,h-5),cx=w/2,base=h-5;castShadow(s,cx+5,base,w*.45,4,SHADOW);
 foliage(s,cx,base-h*.33,w*.4,h*.38,'roc',{R,leaf:5.2,stretch:1,gain:3,bias:.5,edge:.45,seed});
 for(let x=0;x<w;x++)for(let y=base+1;y<h;y++)s.g.set(x,y,null);
 for(let x=0;x<w;x++)for(let y=0;y<=base;y++){const n=s.g.name(x,y);if(!n)continue;const top=!s.g.get(x,y-1),t=M.toneOf(n)[1];
  if(M.snoise(x,y,1.6,seed,64,64)>.72&&t>4&&hash(x,y,seed)<.6)s.g.set(x,y,tone('gresm',t>6?7:5+(hash(x,y,seed+1)<.5?1:0)));
  else if(y>base-4&&hash(x,y,seed+2)<.5)s.g.set(x,y,tone('mousse',t>4?2:1));}
 for(const dx of [-.42,.38]){const x=cx+dx*w;M.tuft(s.g,Math.round(x),base,{ramp:'pre',b:6,n:5,len:[2,4],spread:3,R,h:1});}
 outline(s,'roc0');return s;
}
/* Fougère : six à huit frondes arquées (courbe de Bézier) qui partent du
 * cœur, montent puis retombent ; folioles en peigne de part et d'autre de la
 * nervure, dessus éclairé, revers sombre, plus courtes vers la pointe. */
function fern(seed,{w=48,h=34,ramp='frondaison'}={}){
 const R=rng(seed),s=new Sprite(w,h,w>>1,h-6),cx=w/2,base=h-6,top=M.rampLen(ramp)-1;castShadow(s,cx+4,base,w*.38,4,SHADOW);
 const fronds=[];for(const [th,dir]of [[74,-1],[64,1],[44,-1],[36,1],[16,-1],[12,1]])fronds.push({th:(th+(R()-.5)*8)*Math.PI/180,dir,L:13+R()*6});
 // Les frondes dressées sont derrière (posées d'abord), les couchées devant.
 fronds.sort((p,q)=>q.th-p.th);
 for(const f of fronds){const c=Math.cos(f.th),sn=Math.sin(f.th),P0=[cx,base-1],P1=[cx+f.dir*c*f.L*.7,base-1-sn*f.L*1.05],P2=[cx+f.dir*(c*f.L*1.15+3),base-1-sn*f.L*.35+2];
  const at=t=>[(1-t)**2*P0[0]+2*(1-t)*t*P1[0]+t*t*P2[0],(1-t)**2*P0[1]+2*(1-t)*t*P1[1]+t*t*P2[1]];
  const lit=(f.dir<0?.7:-.3)+(f.th>1?-1.2:0),n=Math.ceil(f.L*1.5);
  for(let i=3;i<=n;i+=3){const t=i/n,[x,y]=at(t),[x2,y2]=at(Math.min(1,t+.02)),L=Math.hypot(x2-x,y2-y)||1,ux=(x2-x)/L,uy=(y2-y)/L,len=Math.round(Math.sin(Math.PI*Math.min(1,t*1.1))*3+.8);
   for(const side of [-1,1]){const nx=-uy*side,ny=ux*side,up=ny<-.1;
    for(let k=1;k<=len;k++){const px=x+nx*k*.95+ux*k*.55,py=y+ny*k*.95+uy*k*.55;s.g.set(px,py,tone(ramp,clamp(Math.round(5.6+lit+(up?2:-1)-(k===len?.6:0)+t*.6),1,top)));}}}
  for(let i=1;i<=n;i++){const [x,y]=at(i/n);s.g.set(x,y,tone(ramp,clamp(Math.round(4.6+lit+i/n*1.5),1,top)));}}
 return s;
}
/* Champignons : amanites tue-mouches et cèpes sur un coussin de mousse. */
function mushrooms(seed){
 const R=rng(seed),s=new Sprite(22,18,11,15),g=s.g,base=15;castShadow(s,12,base,8,2,SHADOW);
 for(let x=3;x<19;x++)if(R()<.8){g.set(x,base,tone('mousse',1+(R()<.4?1:0)));if(R()<.4)g.set(x,base-1,tone('mousse',2+(R()<.3?1:0)));}
 const cap=(x,y,r,ramp,b,spots)=>{for(let k=0;k<base-y;k++){g.set(x,y+1+k,tone('gresm',k?8:6));if(r>2)g.set(x+1,y+1+k,tone('gresm',k?6:4));}
  for(let dy=-Math.ceil(r*.7);dy<=0;dy++)for(let dx=-r;dx<=r;dx++){if((dx/r)**2+(dy/(r*.7+.5))**2>1)continue;const l=-dx/r*.8-dy*.4;g.set(x+dx,y+dy,tone(ramp,clamp(Math.round(b+l*1.4),0,M.rampLen(ramp)-1)));}
  for(let dx=-r;dx<=r;dx++)g.set(x+dx,y+1,tone(ramp,Math.max(0,b-2)));
  if(spots)for(const [dx,dy]of spots)g.set(x+dx,y+dy,tone('fleurm',0));};
 cap(7,8,4,'champi',2,[[-2,-1],[1,-2],[2,0],[-1,0]]);cap(14,10,3,'champi',2,[[-1,-1],[1,0]]);cap(17,13,2,'humus',6,null);cap(4,12,2,'humus',7,null);
 outline(s,INK);return s;
}
/* Fleurs des champs : pâquerettes, boutons d'or, campanules sur leurs tiges. */
function flowers(seed){
 const R=rng(seed),s=new Sprite(30,22,15,18),g=s.g,base=18;castShadow(s,16,base,11,3,SHADOW);
 M.tuft(g,15,base,{ramp:'pre',b:6,n:9,len:[2,5],spread:7,R,h:1});
 const heads=[];for(let k=0;k<11;k++){const x=Math.round(4+R()*22),L=5+Math.floor(R()*8);heads.push([x,base-L,k%3]);}
 heads.sort((a,b)=>a[1]-b[1]);
 for(const [x,y,kind]of heads){line(g,x,base,x+(x<15?-1:1),y+1,tone('pre',kind?7:6));
  if(kind===0){for(const [dx,dy]of [[0,-1],[-1,0],[1,0],[0,1]])g.set(x+dx,y+dy,tone('fleurm',dx<0||dy<0?0:1));g.set(x,y,tone('fleurm',2));}
  else if(kind===1){for(const [dx,dy,t]of [[0,0,2],[1,0,3],[0,-1,2],[-1,0,2],[1,1,3]])g.set(x+dx,y+dy,tone('fleurm',t));}
  else{for(const [dx,dy,t]of [[0,-1,4],[0,0,4],[1,0,5],[0,1,5],[-1,0,4]])g.set(x+dx,y+dy,tone('fleurm',t));}}
 outline(s,INK);return s;
}
function all(){return {
 chene_a:oak(101),chene_b:oak(202),chene_c:oak(303,{w:64,h:84}),bouleau_a:birch(404),bouleau_b:birch(505,{h:88}),
 buisson_a:bush(606,{bloom:true}),buisson_b:bush(707),rocher_a:boulder(808),rocher_b:boulder(909,{w:28,h:24}),fougere:fern(111),champignons:mushrooms(121),fleurs:flowers(131)};}
module.exports={all,oak,birch,bush,boulder,fern,mushrooms,flowers,crown,INK,SHADOW};
if(require.main===module){
 const {save}=require('./png.cjs'),{Grid}=require('./brushes.cjs'),F=all(),list=Object.values(F),W=Math.max(...list.map(s=>s.w)),H=Math.max(...list.map(s=>s.h));
 const tiles=list.map(s=>{const g=new Grid(W,H,{fill:'pre4'});for(let y=0;y<s.h;y++)for(let x=0;x<s.w;x++){const ty=y+H-s.h,tx=x+((W-s.w)>>1);if(s.shadow.get(x,y))g.set(tx,ty,'pre2');const v=s.g.get(x,y);if(v)g.px[ty*W+tx]=v;}return g;});
 save((process.argv[2]||'.')+'/flore.png',tiles,{scale:3,cols:6,gap:2,bg:'#111'});console.log('ok');
}
