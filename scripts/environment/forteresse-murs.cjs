'use strict';
/* Forteresse gobeline : murs de pierre sombre, ouvertures et angles.
 * Un module de mur couvre une arête de case de salle (2 m = 32 unités),
 * haut de 48 unités (3 m), épais de 8 (0,5 m), posé du côté du vide. Les
 * assises sont les mêmes d'un module à l'autre (motif de période 32), si
 * bien que tous les modules d'un même côté se raccordent sans joint.
 * Modélisés en voxels (voxel.cjs) dans le repère du mur (a le long du mur,
 * b en travers, b < 0 dans l'épaisseur, z vers le haut), puis teintés par
 * des motifs à plat : bloc éclairé en haut, joint sombre dessous, assises
 * hautes plus sombres (le mur se perd dans le noir), mousse au pied.
 * Orientation 'nord' : mur du bord nord d'une salle, face tournée vers le
 * sud (éclairée, en haut à droite à l'écran). 'ouest' : bord ouest, face
 * tournée vers l'est (à l'ombre, en haut à gauche). */
const {rng,Grid,stamp}=require('./brushes.cjs'),{Model,render,tone}=require('./voxel.cjs');
const CELL=32,H=48,T=8,STUB=6;
const hash=(...k)=>{let h=2166136261;for(const n of k){h=Math.imul(h^(n&0xffff),16777619);h=Math.imul(h^(n>>>16),16777619);}h=Math.imul(h^(h>>>13),1274126177);return ((h^(h>>>16))>>>0)/4294967296;};
const mod=(a,n)=>((a%n)+n)%n;
// Assises [bas, haut) et blocs de chaque assise (début, longueur), période 32.
const COURSES=[[0,6],[6,15],[15,23],[23,32],[32,40],[40,48]];
const BLOCKS=(()=>{const R=rng(707);return COURSES.map((c,k)=>{const out=[];let a=(k%2)*7+Math.floor(R()*3);const start=a;while(a<start+CELL){let l=[10,11,12,13,14,16][Math.floor(R()*6)];if(start+CELL-a-l<8)l=start+CELL-a;out.push([a,l]);a+=l;}return out;});})();
function blockAt(a,z){const k=COURSES.findIndex(([z0,z1])=>z>=z0&&z<z1);if(k<0)return null;
 for(const [s,l]of BLOCKS[k]){const d=mod(a-s,CELL);if(d<l)return {k,s,l,d,z0:COURSES[k][0],z1:COURSES[k][1],id:k*64+mod(s,CELL),whole:s>=0&&s+l<=CELL};}return null;}
// Trame ordonnée 4 × 4 (Bayer) : arrondit v selon la position du pixel.
const BAYER=[0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5];
const dither=(x,y,v)=>{const f=Math.floor(v);return f+((v-f)*16>BAYER[mod(y,4)*4+mod(x,4)]+.5?1:0);};
// Bruit de valeur lissé (0 à 1), périodique de 32 en a pour que les modules se raccordent.
function noise(a,z,s,seed){const fa=a/s,fz=z/s,a0=Math.floor(fa),z0=Math.floor(fz),P=Math.round(CELL/s),sm=t=>t*t*(3-2*t),x=sm(fa-a0),y=sm(fz-z0),h=(i,j)=>hash(mod(i,P),j,seed);
 return (h(a0,z0)*(1-x)+h(a0+1,z0)*x)*(1-y)+(h(a0,z0+1)*(1-x)+h(a0+1,z0+1)*x)*y;}
// Grain de la pierre (environ −1 à +1) : taches de 2 à 4 unités, piqûres.
const grain=(a,z,seed=0)=>(noise(a,z,4,seed+71)-.5)*1.3+(noise(a,z,2,seed+72)-.5)*.9-(hash(mod(a,CELL),z,seed,9)<.05?1.3:0);
// Obscurité du mur : le haut se perd dans le noir, le pied reste dans l'ombre.
const gloom=z=>Math.max(0,(z-24)/24)*2.6+Math.max(0,(4-z)/4)*.9;
// Coulures d'humidité : traînées sombres sous quelques joints.
const stain=(a,z)=>{const c=Math.floor(mod(a,CELL)/2),r=hash(c,61);if(r>.16)return 0;const top=14+Math.floor(hash(c,62)*26),len=8+hash(c,63)*16;return z<top&&z>top-len-(hash(mod(a,CELL),64)*4)?.8:0;};
const mortar=(a,z)=>dither(a,z,1.1+(noise(a,z,2,5)-.5)*1.2-gloom(z)*.5);
/* Niveau de la pierre (rampe cachot) sur la face éclairée, avant lumière.
 * seed : graine de la variante ; seuls les blocs entiers du module changent
 * de teinte, ceux qui chevauchent deux modules gardent la teinte commune.
 * Pierre bombée : lumière du haut à gauche, arête claire en haut, ombre
 * dessous, coins et arêtes écornés, grain, piqûres, coulures ; le haut du
 * mur se perd dans le noir, tramé (Bayer) plutôt qu'en marches. */
function masonry(a,z,{lit=true,seed=0}={}){
 const B=blockAt(a,z);if(!B)return 4;const {k,l,d,whole}=B,hs=whole?seed:0;let {z0,z1,id}=B;
 // Une pierre haute sur quatre est faite de deux moellons superposés, joint décalé.
 if(z1-z0>=8&&hash(id,77)<.3){const m=z0+Math.floor((z1-z0)/2)+(hash(id,78)<.5?0:-1),cut=Math.floor(l*(.3+hash(id,79)*.4));
  if(z===m&&d!==cut)return mortar(a,z);if(z>m){z0=m;id+=1000;}else z1=m;if(d===cut&&z<m)return mortar(a,z);}
 const h=z1-z0;
 if(z===z0||d===l-1)return mortar(a,z);
 // Joints verticaux irréguliers : la pierre s'arrête parfois un pixel plus tôt.
 if(d===l-2&&hash(id,z,80)<.3)return mortar(a,z)+1;
 const top=z===z1-1,low=z===z0+1;
 if((d===0||d===l-2)&&(top||low)&&hash(id,d*7+z,hs+3)<.5)return mortar(a,z)+1;
 if(top&&hash(Math.floor(a/2),id,hs+5)<.2)return mortar(a,z)+1;
 const r=hash(id,hs);let v=r<.2?4.3:r>.85?5.7:5;if(k===0)v-=.4;
 const tz=(z-z0-.5)/Math.max(1,h-1.5),ta=(d+.5)/Math.max(1,l-1);
 v+=(tz-.5)*1.2+(.5-ta)*(lit?.7:.35);
 if(top)v+=.9;else if(low)v-=.7;if(d===0)v+=lit?.6:.25;else if(d===l-2)v-=.6;
 v+=grain(a,z,id+hs*13)-gloom(z)-stain(a,z);
 return dither(a,z,v);
}
// Dessus des murs : dalles de chaperon grenées, arête claire côté salle.
function cap(a,b){const j=mod(a,16);if(b===-1)return dither(a,b,5.6+grain(a,b,3)*.5);if(b===-T)return 3;if(j===15&&b<-2)return 2;return dither(a,b,3.6+grain(a,b*3,4)*.8);}
// Coupe d'un mur (bout visible, cassure) : moellons irréguliers dans le mortier.
function core(b,z){const row=Math.floor(z/6),off=(row%2)*3,cb=Math.floor((b+T*4+off)/5),r=hash(cb,row,19),db=mod(b+T*4+off,5),dz=z-row*6;
 if(dz===0||db===4)return 1;const v=(dz===5||db===0?(r<.4?4.8:5.6):r<.3?3.2:r>.8?4.8:4)+grain(b*3,z,cb)*.7-gloom(z)*.8;return dither(b,z,v);}
// Pierre d'encadrement (tableaux des baies) : assises du mur, joint au milieu une fois sur deux.
function jamb(b,z){const k=COURSES.findIndex(([z0,z1])=>z>=z0&&z<z1),[z0,z1]=COURSES[Math.max(0,k)];if(z===z0)return 1;if(k%2&&b===-5)return 1;return dither(b,z,(z===z1-1?5.8:4.8)+grain(b*3,z,k)*.7-gloom(z)*.8);}
// Arc : claveaux autour d'un cintre (centre ca, cz ; rayon r ; épaisseur e), piédroits en harpe.
function archivolt(a,z,{a0,a1,spring,e=4}){const ca=(a0+a1)/2,r=(a1-a0)/2,d=Math.hypot(a+.5-ca,z+.5-spring);
 if(z>=spring&&d>=r&&d<r+e){const ang=Math.atan2(z+.5-spring,a+.5-ca),n=9,s=Math.floor(ang/Math.PI*n),edge=Math.abs(ang/Math.PI*n-Math.round(ang/Math.PI*n))<.11;
  if(edge&&ang>.05&&ang<Math.PI-.05)return 1;if(d>=r+e-1)return 2;return dither(a,z,(s===Math.floor(n/2)?6.6:(s%2?4.8:5.6)+(d<r+1?.8:0))+grain(a,z,40+s)*.6-gloom(z)*.7);}
 if(z<spring&&((a>=a0-e&&a<a0)||(a>=a1&&a<a1+e))){const k=COURSES.findIndex(([z0,z1])=>z>=z0&&z<z1),[z0,z1]=COURSES[Math.max(0,k)],long=k%2===0,out=a<a0?a0-a:a-a1+1;
  if(z===z0)return 1;if(!long&&out>e-2)return undefined;if(out===e-(long?0:2))return 1;return dither(a,z,(z===z1-1?6.4:5.4)+grain(a,z,44+k)*.6-gloom(z)*.7);}
 return undefined;}
// Décalages de lumière par face du monde : rampe cachot (9 tons) et rampes courtes.
const OFF={z:1,v:0,u:-2},OFF2={z:1,v:0,u:-1};
const MAX={cachot:8,lueur:7,torche:7,fer:6,rouille:3,chiffon:5,planche:6,paille:5,gobelin:5,bouleau:5,eau:7,mousse:4,fleur:6,ocre:7,arcane:7};
const col=(ramp,L,face)=>tone(ramp,L+(ramp==='cachot'?OFF:OFF2)[face],MAX[ramp]);
/* Teinte de toutes les matières des murs. o : {seed, ornament(a, z),
 * moss, crack, dark(hit) -> tons d'obscurité, sigil(a, z)}. */
function shader(o={}){
 const seed=o.seed||0;
 return hit=>{
  const {mat,side,face,a,b,z}=hit,dk=o.dark?o.dark(hit):0;let ramp='cachot',L;
  switch(mat){
   case 'masque':return null;
   case 'noir':return 'cachot0';
   case 'mur':
    if(side==='b'){const orn=o.ornament?o.ornament(a,z,b):undefined;L=orn!==undefined?orn:masonry(a,z,{lit:face==='v',seed});
     if(b<-1)L-=2;// fond d'une pierre manquante
     if(o.crack&&o.crack.has(a+','+z))L=0;else if(o.crack&&o.crack.has((a+1)+','+(z+1)))L+=1;
     if(o.moss&&b===-1){const m=o.moss(a,z,L);if(m>=0){ramp='mousse';L=m;}}}
    else if(side==='z')L=z===H-1?cap(a,b):core(a,b)+1;
    else L=a===CELL-1?core(b,z):b<-T?core(b,z):jamb(b,z);
    break;
   case 'gravat':{const r=hash(a>>1,b>>1,z,31);L=dither(a+b,z+b,(side==='z'?(r<.3?5:5.8):side==='b'?4.4:3.6)+(hash(a,b,z,32)-.5)*1.4-(r>.85?1:0));break;}
   case 'seuil':L=side==='z'?(mod(a,16)===15?3:b===-1?7:6):4;break;
   case 'appui':L=side==='z'?(b===0?7:6):4;break;
   case 'margelle':L=side==='z'?(mod(a+b,8)===7?3:6):4;break;
   case 'marche':L=side==='z'?(o.edge&&o.edge(hit)?7:6):4;break;
   case 'roche':if(side==='z'||(side==='a'&&a===CELL-1)||(side==='b'&&b===CELL-1))return null;L=masonry(side==='b'?a:b,mod(z,48),{lit:face==='v',seed:9})-1;break;
   case 'bois':{ramp='planche';let v=(side==='z'?4:3)+(hash(side==='z'?a+b:side==='b'?a:b,7)-.5)*.9+(noise(a+b,z,2,8)-.5)*.6;if(o.barrel&&side!=='z'&&mod(Math.round(Math.atan2(b+.5,a+.5)*5),2))v-=1;if(hash(a,b,z,5)<.08)v-=1;L=dither(a+b,z,v);break;}
   case 'porte':{ramp='planche';const p=mod(a-(o.door||0),5);L=side==='b'?(p===4?1:p===0?4:3+(hash(Math.floor((a-(o.door||0))/5),2)<.4?0:-1)):side==='z'?4:2;
    if(side==='b'&&p!==4&&p!==0&&hash(a,Math.floor(z/3),7)<.12)L-=1;break;}
   case 'fer':ramp='fer';L=(side==='z'?4:side==='b'?3:2)+(hash(a,b,z,14)<.07?1:0);if(o.rust&&hash(a>>1,b,z>>1,13)<o.rust){ramp='rouille';L=side==='z'?2:1;}break;
   case 'rivet':ramp='fer';L=6;break;
   case 'barreau':ramp='fer';L=side==='z'?6:side==='b'?5:3;break;
   case 'tissu':{ramp='chiffon';const f=mod(a,3);L=side==='b'?(f===0?2:3):side==='z'?4:1;if(o.sigil){const s=o.sigil(a,z);if(s){ramp=s[0];L=s[1];}}break;}
   case 'ciel':ramp='eau';L=z<(o.horizon||0)?1:z<(o.horizon||0)+2?2:0;return tone('eau',L,7);
   case 'lune':return tone('eau',side==='z'?5:4,7);
   case 'braise':return hash(a,b,z,3)<.3?tone('cachot',1,8):tone('torche',hash(a,b,z,4)<.5?2:3,7);
   case 'pierre':{const t=side==='b'?a:b,k=Math.floor(z/8),zz=z-k*8,half=mod(t+(k%2)*5,10);
    if(side!=='z'&&(zz===0||(k%2===1&&half===0)))L=mortar(t,z);
    else L=dither(t,z,(side==='z'?(o.capTop?5.6:5):4.8+(zz-3.5)*.16+(zz===7?.8:zz===1?-.5:0))+grain(t*3+k*11,z,31+k)*.9-Math.max(0,(z-28)/24)*1.8);break;}
   case 'socle':L=dither(a+b,z,(side==='z'?(z>20?3.6:5.2):(z===(o.socleTop||0)?5.8:4.2))+grain(a*2+b,z*3+b*2,33)*.8-(side!=='z'?Math.max(0,(z-28)/24)*1.8:0));break;
   case 'os':ramp='bouleau';L=side==='z'?4:side==='b'?4:2;break;
   case 'paille':ramp='paille';L=side==='z'?(hash(a,b,z,3)<.3?4:3):side==='b'?2:1;if(hash(a,b,z,8)<.12)L+=1;break;
   case 'or':ramp='fleur';return tone(hash(a,b,z,2)<.3?'ocre':'fleur',hash(a,b,z,2)<.3?7:side==='z'?1:2,7);
   case 'gelee':ramp='gobelin';L=side==='z'?(hash(a,b,9)<.2?5:4):3;break;
   case 'cuir':ramp='planche';L=side==='z'?3:2;break;
   default:throw Error('matière inconnue '+mat);
  }
  return col(ramp,L-dk,face);
 };
}
// Point local (a, b, z) -> pixel du sprite.
function pixel(s,M,a,b,z){const [u,v]=M.world(a,b);return [Math.round(s.ax+u-v),Math.round(s.ay+(u+v)/2-z)];}
/* Lumière chaude cuite : les surfaces tournées vers la source virent vers
 * la rampe « lueur » en trois bandes, liseré en damier d'un pixel. */
function bake(s,M,src,r){
 const [lu,lv]=M.world(src[0],src[1]),lz=src[2],N={u:[1,0,0],v:[0,1,0],z:[0,0,1]};
 for(let py=0;py<s.h;py++)for(let px=0;px<s.w;px++){const i=py*s.w+px,hit=s.info[i],c=s.g.px[i];if(!hit||!c)continue;
  const n=N[hit.face],p=[hit.u+.5+n[0]*.5,hit.v+.5+n[1]*.5,hit.z+.5+n[2]*.5],L=[lu-p[0],lv-p[1],lz-p[2]],dot=L[0]*n[0]+L[1]*n[1]+L[2]*n[2];if(dot<=0)continue;
  const d=Math.hypot(...L),band=Math.min(3,dither(px,py,Math.max(0,1-d/r)*3.4));if(band<=0)continue;
  const name=s.g.name(px,py),ramp=name.replace(/\d+$/,''),t=+name.match(/\d+$/)[0];
  if(ramp==='cachot')s.g.set(px,py,tone('lueur',t-4+band,7));else if(MAX[ramp]!==undefined&&!['torche','eau'].includes(ramp))s.g.set(px,py,tone(ramp,t+(band>1?1:0)+(band>2?1:0),MAX[ramp]));
 }
}
/* Ombre de pied de mur (calque ombre) : bande de 3 unités sur le sol devant
 * la face, là où le mur touche le sol. */
function footShadow(s,M,{a0=0,a1=CELL,depth=3,open=()=>false}={}){
 for(let py=0;py<s.h;py++)for(let px=0;px<s.w;px++){const X=px-s.ax+.5,Y=py-s.ay+.5,u=Y+X/2,v=Y-X/2,[a,b]=M.turn?[v,u]:[u,v];
  if(a>=a0&&a<a1&&b>=0&&b<depth&&!open(Math.floor(a)))s.shadow.set(px,py,b<1.2?'cachot0':'cachot1');}
}
// Anneaux d'une lueur, du cœur clair au bord tramé (un pixel sur deux).
// Lueur tramée : de plus en plus clairsemée vers le bord (Bayer), sans anneau net.
const glowRing=(d,px,py)=>{const t=1-d;if(t<=0||t*1.7<=(BAYER[mod(py,4)*4+mod(px,4)]+.5)/16)return null;return t>.62?'torche6':t>.34?'torche5':'torche4';};
// Lueur au sol (calque lueur) : demi-ellipse devant la source, trois anneaux.
function floorGlow(s,M,[ca,cb],r,{half=true,ramp='torche'}={}){
 if(!s.glow)s.glow=new Grid(s.w,s.h);
 for(let py=0;py<s.h;py++)for(let px=0;px<s.w;px++){const X=px-s.ax+.5,Y=py-s.ay+.5,u=Y+X/2,v=Y-X/2,[a,b]=M.turn?[v,u]:[u,v];if(half&&b<0)continue;
  const d=Math.hypot(a-ca,(b-cb)*1.1)/r;if(d<1){const c=glowRing(d,px,py);if(c)s.glow.set(px,py,c.replace('torche',ramp));}}
}
/* Flammes de torche, 4 images (r rouge, y orange, w jaune, c cœur, o braise). */
const FLAMES=[
 ['..r..','..r..','.rr..','.ryr.','ryyr.','rywyr','rywwr','ryccy','.ycy.','..o..'],
 ['...r.','..r..','..rr.','.ryr.','.ryyr','rywyr','rwwyr','rccyr','.ycy.','..o..'],
 ['..r..','.r...','.rr..','.ryr.','.ryyr','rywyr','rywcr','ryccy','.ycy.','..o..'],
 ['.r...','..r..','.rr..','.ryr.','ryyr.','rywwr','rywyr','rccyr','.ycy.','..o..']
];
const FLAME_MAP={r:'torche3',y:'torche5',w:'torche6',c:'torche7',o:'torche2'};
function flame(g,x,y,k){stamp(g,x-2,y-9,FLAMES[k%4],FLAME_MAP);}
/* ------------------------------------------------------------------ */
// Ouvertures : intérieur d'une baie cintrée (piédroits droits puis demi-cercle).
const inArch=(a,z,{a0,a1,spring})=>{if(a<a0||a>=a1)return false;if(z<spring)return true;const ca=(a0+a1)/2,r=(a1-a0)/2;return (a-ca)**2+(z-spring)**2<r*r;};
// Fêlure : tracé brisé dans le plan du mur, d'un point à l'autre.
function crackPath(seed,[a,z],steps){const R=rng(seed),set=new Set();for(let i=0;i<steps;i++){set.add(a+','+z);const r=R();if(r<.45)z--;else if(r<.75){a++;z--;}else if(r<.9)a++;else{a--;z--;}if(i%3===2){set.add(a+','+z);a+=R()<.5?1:0;}}return set;}
// Mousse au pied et dans les joints bas.
const mossy=s=>(a,z,L)=>{if(z<3&&hash(Math.floor(a/3),z,s)<.45-z*.12)return z===0?0:1;if(L<=1&&z<12&&hash(a,z,s+1)<.35)return 0;if(L<=2&&z<7&&hash(a>>1,z>>1,s+2)<.18)return 1;return -1;};
// Gravats : mottes de pierre tombées au pied du mur (b > 0) ou dans une brèche.
function rubble(M,seed,{a0=3,a1=29,b0=0,b1=10,n=14,big=4}={}){const R=rng(seed);for(let i=0;i<n;i++){const ca=a0+R()*(a1-a0),cb=b0+R()*(b1-b0)*(.4+R()*.6),r=1+R()*(i<3?big:2.4),h=r*(.6+R()*.4);
 M.shape((a,b,z)=>((a-ca)/r)**2+((b-cb)/(r*.9))**2+(z/h)**2<=1?'gravat':undefined,[ca-r-1,cb-r-1,0,ca+r+1,cb+r+1,h+1]);}}
/* Modules de mur. Chaque entrée : (M, o) -> void ; remplit le modèle (repère
 * local) et complète les options de teinte. Le module occupe a ∈ [0, 32),
 * b ∈ [−8, 0) ; il peut déborder devant (b > 0, dans la salle) ou derrière. */
const OPEN={a0:8,a1:24,spring:20};// porte ordinaire : 1 m de large, 1,75 m sous la clé
const WIDE={a0:6,a1:26,spring:22};// arche et herse : 1,25 m
const STAIR={a0:6,a1:26,spring:30};
const wallBox=M=>M.box(0,-T,0,CELL,0,H,'mur');
const threshold=(M,{a0,a1})=>M.box(a0,-T,-1,a1,0,0,'seuil');
const carve=(M,arch,b0=-T,b1=0)=>M.shape((a,b,z)=>inArch(a,z,arch)?null:undefined,[0,b0,0,CELL,b1,H]);
const MODULES={
 'mur-a':(M,o)=>{wallBox(M);o.seed=1;},
 'mur-b':(M,o)=>{wallBox(M);o.seed=2;o.moss=mossy(2);
  // Une pierre qui ressort d'une unité.
  M.shape((a,b,z)=>{const B=blockAt(a,z);return B&&B.k===3&&B.whole&&B.d<B.l-1&&z>B.z0?'mur':undefined;},[0,0,0,CELL,1,H]);},
 'mur-c':(M,o)=>{wallBox(M);o.seed=3;o.crack=crackPath(31,[12,40],22);
  // Une pierre manquante : creux de deux unités.
  M.shape((a,b,z)=>{const B=blockAt(a,z);return B&&B.k===2&&B.s===BLOCKS[2].find(([s,l])=>s>=0&&s+l<=CELL)[0]&&B.d<B.l-1&&z>B.z0?null:undefined;},[0,-2,0,CELL,0,H]);},
 'mur-ruine':(M,o)=>{o.seed=4;o.moss=mossy(4);o.crack=crackPath(44,[17,36],30);
  const top=a=>{const B=blockAt(a,42);return B&&B.whole?(B.s<12?40:32):H;};
  M.shape((a,b,z)=>z<top(Math.floor(a))?'mur':undefined,[0,-T,0,CELL,0,H]);
  M.shape((a,b,z)=>{const B=blockAt(a,z);return B&&(B.k===1||B.k===3)&&B.whole&&B.d>0&&B.d<B.l-1&&z>B.z0&&hash(B.id,17)<.6?null:undefined;},[0,-3,0,CELL,0,H]);
  rubble(M,41,{n:7,b1:6,big:2.5});},
 'mur-breche':(M,o)=>{o.seed=5;o.moss=mossy(5);
  // Assises tombées bloc par bloc au-dessus d'un profil en V.
  const prof=a=>{const t=Math.sin(Math.PI*Math.max(0,Math.min(1,(a-1)/30)))**.8;return H-t*32;};
  M.shape((a,b,z)=>{const B=blockAt(Math.floor(a),Math.floor(z));if(!B)return undefined;const mid=B.s+B.l/2;return (B.z0+B.z1)/2<prof(B.whole?mid:Math.floor(a))+(hash(B.id,23)-.5)*6?'mur':undefined;},[0,-T,0,CELL,0,H]);
  rubble(M,51,{n:16,b1:12,big:3.5});rubble(M,52,{n:6,a0:8,a1:24,b0:-T,b1:0,big:2});},
 'mur-torche':(M,o)=>{wallBox(M);o.seed=6;o.moss=mossy(6);
  M.box(15,0,27,17,3,28,'fer');M.box(14,2,26,18,5,29,'fer');// console et bague
  M.box(15,3,25,17,4,34,'bois');M.box(14,2,32,18,5,35,'tissu');// manche et tête enduite
  o.light={src:[16,4,37],r:20,pool:[16,4],radius:17};o.flame=[16,3.5,35];},
 'meurtriere':(M,o)=>{wallBox(M);o.seed=7;
  // Fente évasée vers la salle : 2 unités dehors, 10 dedans ; appui en pente.
  M.shape((a,b,z)=>{const t=Math.max(0,(b+4)/4),hw=1+t*2,z0=17-t*2,z1=37+t*2;return Math.abs(a-16)<hw&&z>z0&&z<z1?null:undefined;},[0,-T,0,CELL,0,H]);
  M.box(14,-T-2,14,18,-T,40,'ciel');o.horizon=22;
  // Encadrement en pierre claire autour de la fente.
  o.ornament=(a,z)=>{const d=Math.abs(a+.5-16);if(z>=14&&z<41&&d>=3&&d<6){if(z===14||z===40||mod(z-14,9)===0)return 2;return d<4?7:6;}return undefined;};},
 'fenetre':(M,o)=>{wallBox(M);o.seed=8;
  const W={a0:10,a1:22,spring:30};M.shape((a,b,z)=>inArch(a,z,W)&&z>=20?null:undefined,[0,-T,0,CELL,0,H]);
  M.box(9,-T,19,23,1,20,'appui');
  for(const a of [12,15,17,20])M.box(a,-3,20,a+1,-2,37,'barreau');M.box(10,-3,27,22,-2,28,'barreau');
  M.box(8,-T-2,18,24,-T,38,'ciel');o.horizon=24;
  o.ornament=(a,z)=>archivolt(a,z,{...W,e:3});o.moon={pool:[16,8],radius:12};},
 'baniere':(M,o)=>{wallBox(M);o.seed=9;o.moss=mossy(9);
  M.box(8,0,40,24,2,42,'bois');M.box(7,0,39,9,3,43,'bois');M.box(23,0,39,25,3,43,'bois');
  const bot=a=>14+[0,1,3,5,3,1,0,2,4,6,4,2][Math.floor(a-10)%12];
  M.shape((a,b,z)=>a>=10&&a<22&&z>=bot(a)?'tissu':undefined,[10,0,10,22,1,40]);
  o.sigil=(a,z)=>{const g=['.xxxx.','xxxxxx','x..x.x','xx.xxx','.xxxx.','.x.x..','.xxxx.'],r=g[36-z],c=r&&r[a-13];if(c==='x')return ['bouleau',3];if(z===37&&a>=12&&a<20)return ['chiffon',4];if(z===22&&a>=12&&a<20)return ['gobelin',3];return null;};},
 'chaines':(M,o)=>{wallBox(M);o.seed=10;o.moss=mossy(10);o.rust=.25;
  for(const [a,len]of [[10,9],[22,13]]){M.box(a-1,0,32,a+2,1,34,'fer');// anneau scellé
   for(let z=32-len;z<32;z++)if(z%3!==1)M.set(a,0,z,'fer');else{M.set(a-1,0,z,'fer');M.set(a+1,0,z,'fer');}
   const zb=32-len-4;M.shape((aa,b,z)=>{const d=Math.hypot(aa-a-.5,z-zb-.5);return d>1.4&&d<2.8?'fer':undefined;},[a-3,0,zb-3,a+4,1,zb+3]);}},
 'arche':(M,o)=>{wallBox(M);o.seed=11;carve(M,WIDE);threshold(M,WIDE);o.ornament=(a,z)=>archivolt(a,z,{...WIDE,e:4});o.open=a=>a>=WIDE.a0&&a<WIDE.a1;},
 'porte':(M,o)=>{wallBox(M);o.seed=12;carve(M,OPEN);threshold(M,OPEN);o.ornament=(a,z)=>archivolt(a,z,{...OPEN,e:4});o.open=a=>a>=OPEN.a0&&a<OPEN.a1;
  M.shape((a,b,z)=>inArch(a,z,OPEN)?'porte':undefined,[0,-5,0,CELL,-3,H]);o.door=OPEN.a0;
  for(const z of [4,13,21])M.box(OPEN.a0,-3,z,OPEN.a0+12,-2,z+2,'fer');M.box(20,-3,10,22,-2,12,'fer');},
 'porte-ouverte':(M,o)=>{wallBox(M);o.seed=13;carve(M,OPEN);threshold(M,OPEN);o.ornament=(a,z)=>archivolt(a,z,{...OPEN,e:4});o.open=a=>a>=OPEN.a0&&a<OPEN.a1;
  // Vantail rabattu contre le tableau gauche, de l'autre côté du mur.
  M.shape((a,b,z)=>inArch(a+8,z,OPEN)||z<OPEN.spring?'porte':undefined,[OPEN.a0,-T-16,0,OPEN.a0+2,-T,H]);o.door=0;
  M.box(OPEN.a0+2,-T-5,4,OPEN.a0+3,-T-1,6,'fer');M.box(OPEN.a0+2,-T-5,13,OPEN.a0+3,-T-1,15,'fer');
  M.box(OPEN.a0+2,-T-24,26,CELL,-T,H,'masque');o.dark=h=>h.b<-T?Math.ceil((-T-h.b)/5):0;},
 'porte-verrouillee':(M,o)=>{wallBox(M);o.seed=14;carve(M,OPEN);threshold(M,OPEN);o.ornament=(a,z)=>archivolt(a,z,{...OPEN,e:4});o.open=a=>a>=OPEN.a0&&a<OPEN.a1;o.rust=.12;
  M.shape((a,b,z)=>inArch(a,z,OPEN)?'porte':undefined,[0,-5,0,CELL,-3,H]);o.door=OPEN.a0;
  for(const z of [3,10,17,24])M.shape((a,b,zz)=>inArch(a,zz,OPEN)?'fer':undefined,[OPEN.a0,-3,z,OPEN.a1,-2,z+2]);
  // Barres en croix rivées.
  M.shape((a,b,z)=>{const t=(a-OPEN.a0)/(OPEN.a1-OPEN.a0),z1=2+t*22,z2=24-t*22;return inArch(a,z,OPEN)&&(Math.abs(z-z1)<1.1||Math.abs(z-z2)<1.1)?'fer':undefined;},[OPEN.a0,-2,0,OPEN.a1,-1,H]);
  o.padlock=[16,-1,13];o.skull=[16,0,34];},
 'herse':(M,o)=>{wallBox(M);o.seed=15;carve(M,WIDE);threshold(M,WIDE);o.ornament=(a,z)=>archivolt(a,z,{...WIDE,e:4});o.open=a=>a>=WIDE.a0&&a<WIDE.a1;o.rust=.2;
  M.shape((a,b,z)=>{const fa=Math.floor(a),fz=Math.floor(z);return inArch(fa,fz,WIDE)&&(mod(fa-WIDE.a0,4)===1||mod(fz,7)===5)?'fer':undefined;},[0,-5,0,CELL,-4,H]);},
 'herse-levee':(M,o)=>{wallBox(M);o.seed=16;carve(M,WIDE);threshold(M,WIDE);o.ornament=(a,z)=>archivolt(a,z,{...WIDE,e:4});o.open=a=>a>=WIDE.a0&&a<WIDE.a1;o.rust=.2;
  M.shape((a,b,z)=>{const fa=Math.floor(a),fz=Math.floor(z);if(!inArch(fa,fz,WIDE)||fz<24)return undefined;return mod(fa-WIDE.a0,4)===1||mod(fz,7)===5||(fz===24||fz===25)&&mod(fa-WIDE.a0,4)===1?'fer':undefined;},[0,-5,0,CELL,-4,H]);},
 'escalier-montant':(M,o)=>{wallBox(M);o.seed=17;carve(M,STAIR);o.ornament=(a,z)=>archivolt(a,z,{...STAIR,e:4});o.open=a=>a>=STAIR.a0&&a<STAIR.a1;
  // Marches de 4 sur 4 : quatre dans la salle, deux dans l'épaisseur, puis dans le noir.
  for(let k=0;k<10;k++){const b1=16-4*k,b0=b1-4;M.box(STAIR.a0,b0,0,STAIR.a1,b1,4*(k+1),'marche');}
  M.box(STAIR.a1,0,0,STAIR.a1+1,16,1,'mur');
  M.box(0,-T-26,36,CELL,-T,H+1,'masque');M.box(STAIR.a1,-T-26,0,CELL,-T,36,'masque');o.dark=h=>h.b<-T?Math.ceil((-T-h.b)/4):0;},
 // Leviers muraux : platine de fer, pivot, manche levé ou baissé terminé par une poignée de bois.
 'levier-haut':(M,o)=>lever(M,o,1),
 'levier-bas':(M,o)=>lever(M,o,-1),
 // Porte de cellule : grille de barreaux dans une baie ordinaire, serrure à droite.
 'porte-cellule':(M,o)=>{wallBox(M);o.seed=18;carve(M,OPEN);threshold(M,OPEN);o.ornament=(a,z)=>archivolt(a,z,{...OPEN,e:4});o.open=a=>a>=OPEN.a0&&a<OPEN.a1;o.rust=.25;
  M.shape((a,b,z)=>{const fa=Math.floor(a),fz=Math.floor(z);return inArch(fa,fz,OPEN)&&(mod(fa-OPEN.a0,3)===1||fz===3||fz===14||fz===OPEN.spring)?(fz===3||fz===14||fz===OPEN.spring?'fer':'barreau'):undefined;},[0,-4,0,CELL,-3,H]);
  M.box(19,-3,9,22,-2,13,'fer');},
 // Porte de cellule ouverte : la grille pivote sur le tableau droit et entre dans la salle.
 'porte-cellule-ouverte':(M,o)=>{wallBox(M);o.seed=19;carve(M,OPEN);threshold(M,OPEN);o.ornament=(a,z)=>archivolt(a,z,{...OPEN,e:4});o.open=a=>a>=OPEN.a0&&a<OPEN.a1;o.rust=.25;
  M.shape((a,b,z)=>{const fb=Math.floor(b),fz=Math.floor(z);return fb>=-3&&fb<13&&fz<OPEN.spring+1&&(mod(fb+3,3)===1||fz===3||fz===14||fz===OPEN.spring||fb===12)?(fz===3||fz===14||fz===OPEN.spring?'fer':'barreau'):undefined;},[OPEN.a1-1,-3,0,OPEN.a1,13,H]);},
 // Porte de sortie scellée : double vantail sous une grande arche, sceau magique animé (voir wall).
 'porte-scellee':(M,o)=>{wallBox(M);o.seed=20;carve(M,WIDE);threshold(M,WIDE);o.ornament=(a,z)=>archivolt(a,z,{...WIDE,e:4});o.open=a=>a>=WIDE.a0&&a<WIDE.a1;
  M.shape((a,b,z)=>inArch(a,z,WIDE)?'porte':undefined,[0,-5,0,CELL,-3,H]);o.door=WIDE.a0;
  for(const z of [5,24])M.shape((a,b,zz)=>inArch(a,zz,WIDE)?'fer':undefined,[WIDE.a0,-3,z,WIDE.a1,-2,z+2]);
  M.box(15,-3,0,17,-2,32,'fer');o.seal={a:16,z:15,r:7};o.rust=.1;}
};
function lever(M,o,dir){wallBox(M);o.seed=21+dir;o.moss=mossy(21);
 // Platine sombre avec sa fente en arc, pivot en saillie, manche incliné dans le plan du mur.
 M.box(12,0,12,21,1,30,'fer');M.box(15,1,19,18,3,23,'fer');
 const P0=[16.5,2.5,21],P1=[22,5,21+dir*10],L2=(P1[0]-P0[0])**2+(P1[1]-P0[1])**2+(P1[2]-P0[2])**2;
 M.shape((a,b,z)=>{const t=Math.max(0,Math.min(1,((a+.5-P0[0])*(P1[0]-P0[0])+(b+.5-P0[1])*(P1[1]-P0[1])+(z+.5-P0[2])*(P1[2]-P0[2]))/L2)),
  d=Math.hypot(a+.5-P0[0]-t*(P1[0]-P0[0]),b+.5-P0[1]-t*(P1[1]-P0[1]),z+.5-P0[2]-t*(P1[2]-P0[2]));return d<(t>.68?1.35:.9)?(t>.68?'bois':'barreau'):undefined;},[14,1,6,26,8,36]);
 o.ornament=undefined;o.slot=dir;}
const NAMES=Object.keys(MODULES);
/* Rend un module : orientation 'nord' ou 'ouest'. image (0-3) : flamme de
 * torche. Renvoie {g, shadow, glow?, w, h, ax, ay}, ancre = coin de départ du
 * module au sol (extrémité nord du bord nord, ou extrémité nord du bord ouest). */
function wall(name,orientation='nord',{image=0}={}){
 const M=new Model(0,-T-26,-1,CELL,20,H+2,{turn:orientation==='ouest'}),o={};MODULES[name](M,o);
 const s=render(M,shader(o));
 footShadow(s,M,{open:o.open||(()=>false)});
 if(o.light){bake(s,M,o.light.src,o.light.r);floorGlow(s,M,o.light.pool,o.light.radius);}
 if(o.moon){if(!s.glow)s.glow=new Grid(s.w,s.h);const [ca,cb]=o.moon.pool;for(let py=0;py<s.h;py++)for(let px=0;px<s.w;px++){const X=px-s.ax+.5,Y=py-s.ay+.5,u=Y+X/2,v=Y-X/2,[a,b]=M.turn?[v,u]:[u,v];if(b<1)continue;const d=Math.hypot((a-ca)*1.3,b-cb)/o.moon.radius;if(d<.6)s.glow.set(px,py,'eau5');else if(d<1)s.glow.set(px,py,'eau4');}s.glowKind='lune';}
 if(o.flame){const [x,y]=pixel(s,M,...o.flame);flame(s.g,x,y,image);}
 if(o.padlock){const [x,y]=pixel(s,M,...o.padlock);stamp(s.g,x-2,y-3,['.aa.','a..a','bbbb','bcbb','bbbb','.dd.'],{a:'fer5',b:'fer4',c:'fer0',d:'fer2'});}
 if(o.skull){const [x,y]=pixel(s,M,...o.skull);stamp(s.g,x-3,y-3,['.aaaa.','abbbba','bc.bcb','bbbbbb','.b.b..'],{a:'bouleau5',b:'bouleau4',c:'cachot0','.':null});}
 if(o.light)s.glowKind='torche';
 // Sceau magique : cercle de runes sur les vantaux, claveaux luisants, lueur au sol ; pulsation sur 4 images.
 if(o.seal){const pulse=[0,1,2,1][image%4],{a:ca,z:cz,r}=o.seal,RUNES=['x.x','.x.','xxx','x.x','.xx','xx.'];
  for(let i=0;i<s.w*s.h;i++){const h=s.info[i];if(!h||h.side!=='b')continue;const px=i%s.w,py=Math.floor(i/s.w),d=Math.hypot(h.a+.5-ca,h.z+.5-cz);
   if(h.mat==='porte'||h.mat==='fer'){if(Math.abs(d-r)<.75)s.g.set(px,py,tone('arcane',4+pulse,7));
    else if(d<r-1.2){const ang=Math.atan2(h.z+.5-cz,h.a+.5-ca),k=mod(Math.floor((ang/Math.PI+1)*3),6),g=RUNES[k],ra=mod(h.a,3),rz=mod(h.z,2);
     if(d>r-3.4&&g[ra]==='x'&&rz===0)s.g.set(px,py,tone('arcane',3+pulse,7));else if(d<2.2)s.g.set(px,py,tone('arcane',5+pulse,7));}}
   else if(h.mat==='mur'&&h.z>=WIDE.spring&&Math.abs(Math.hypot(h.a+.5-16,h.z+.5-WIDE.spring)-(WIDE.a1-WIDE.a0)/2-2)<1.6&&mod(h.a+h.z,4)===0)s.g.set(px,py,tone('arcane',2+pulse,7));}
  floorGlow(s,M,[16,3],15,{ramp:'arcane'});s.glowKind='arcane';}
 return s;
}
/* Angles et murets, dans le repère du monde (pas d'orientation) ; l'ancre
 * est le sommet de case indiqué. Voir le guide (§ Intérieurs). */
const CORNERS={
 // Coin nord d'une salle : bloc d'angle entre les deux grands murs, seul son chaperon se voit.
 'angle-nord':M=>M.box(-T,-T,0,0,0,H,'mur'),
 // Bout du mur nord au coin est de la salle : pilier pleine hauteur, coupe tournée vers l'est.
 'bout-nord':M=>M.box(0,-T,0,T,0,H,'mur'),
 // Bout du mur ouest au coin ouest : pilier pleine hauteur, coupe tournée vers le sud.
 'bout-ouest':M=>M.box(-T,0,0,0,T,H,'mur'),
 // Coin sud : angle des deux murets.
 'angle-sud':M=>M.box(0,0,0,T,T,STUB,'muret')
};
// Teinte des angles : faces de mur continuant les modules voisins, coupe aux bouts.
function cornerShader(name){
 return hit=>{const {face,u,v,z}=hit;let L;
  if(hit.mat==='muret'){L=face==='z'?(u===0||v===0?6:4):masonry(face==='v'?u:v,z,{lit:face==='v',seed:20})+1;return col('cachot',L,face);}
  if(face==='z')L=z===H-1?(name==='angle-nord'?(u===-1||v===-1?6:4):cap(face==='z'&&name==='bout-ouest'?v:u,name==='bout-ouest'?u:v)):core(u,v)+1;
  else if(name==='bout-nord')L=face==='u'?core(v,z):masonry(u,z,{lit:true});
  else if(name==='bout-ouest')L=face==='v'?core(u,z):masonry(v,z,{lit:false});
  else L=masonry(face==='v'?u:v,z,{lit:face==='v'});
  return col('cachot',L,face);};
}
function corner(name){const M=new Model(-T-1,-T-1,0,T+1,T+1,H+1);CORNERS[name](M);return render(M,cornerShader(name));}
/* Murets (devant de la salle, murs arasés à 6 unités) : 'sud' le long du bord
 * sud, 'est' le long du bord est ; épaisseur du côté du vide (b > 0). */
const STUBS={
 'muret':M=>M.box(0,0,0,CELL,T,STUB,'muret'),
 // Début rogné : à un angle rentrant entre deux murets, le muret voisin (bord est) tient l'angle.
 'muret-debut':M=>M.box(T,0,0,CELL,T,STUB,'muret'),
 // Muret cassé : brèche au milieu, gravats tombés dans la salle (b < 0).
 'muret-casse':M=>{M.shape((a,b,z)=>z<STUB-(a>9&&a<23?3+Math.floor(hash(Math.floor(a/3),5)*3):0)?'muret':undefined,[0,0,0,CELL,T,STUB]);rubble(M,61,{a0:8,a1:24,b0:-1,b1:-9,n:6,big:2});}
};
function stub(name,orientation='sud'){
 const M=new Model(0,-13,0,CELL,T+1,STUB+1,{turn:orientation==='est'});STUBS[name](M);
 return render(M,hit=>{const {mat,side,face,a,b,z}=hit;if(mat==='gravat')return shader({})(hit);let L;
  if(side==='z')L=z===STUB-1?(b===0?6:b===T-1?3:4):core(a,b)+2;
  else if(side==='b')L=masonry(a,z,{lit:face==='v',seed:21})+1;
  else L=a===CELL-1?core(b,z):masonry(b,z,{lit:false,seed:22})+1;
  return col('cachot',L,face);});
}
/* Escalier descendant : trémie d'une case de salle, marches qui plongent vers
 * le nord (ou l'ouest) dans le noir, margelle sur trois côtés. Le dessus du
 * sol autour reste transparent : le sol de la salle se voit dessous. */
function stairsDown(orientation='nord'){
 const M=new Model(0,0,-30,CELL,CELL,3,{turn:orientation==='ouest'}),A0=4,A1=28;
 M.shape((a,b,z)=>a>=A0&&a<A1&&b>=3&&b<31?undefined:'roche',[0,0,-30,CELL,CELL,0]);
 // Marches de 5 sur 2 vers le nord, palier, puis un passage noir sous le sol.
 for(let k=0;k<6;k++){const b1=31-5*k,b0=Math.max(3,b1-5);M.box(A0,b0,-30,A1,b1,-2*(k+1),'marche');}
 M.box(A0+4,1,-12,A1-4,3,-2,null);M.box(A0+4,0,-12,A1-4,1,-2,'noir');
 M.box(A0-2,1,0,A0,31,2,'margelle');M.box(A1,1,0,A1+2,31,2,'margelle');M.box(A0-2,1,0,A1+2,3,2,'margelle');
 const s=render(M,shader({dark:h=>h.z<0?Math.floor(-h.z/6):0,edge:h=>h.z<0&&mod(h.b-1,5)===4}));
 // Ombre portée de la margelle dans la trémie.
 return s;
}
/* Puits du monte-charge : trou carré d'une case, margelle sur les quatre
 * côtés, rails de fer et chaînes qui plongent dans le noir. La plate-forme
 * (objet 'monte-charge') se pose par-dessus quand elle est à cet étage. */
function shaft(){
 const M=new Model(0,0,-30,CELL,CELL,3),A0=3,A1=29;
 M.shape((a,b,z)=>a>=A0&&a<A1&&b>=A0&&b<A1?undefined:'roche',[0,0,-30,CELL,CELL,0]);
 M.box(A0-2,A0-2,0,A1+2,A0,2,'margelle');M.box(A0-2,A0,0,A0,A1+2,2,'margelle');M.box(A1,A0,0,A1+2,A1+2,1,'margelle');M.box(A0,A1,0,A1,A1+2,1,'margelle');
 for(const a of [8,23])M.box(a,A0,-30,a+2,A0+1,0,'fer');
 for(const [a,b]of [[6,6],[25,6],[6,25],[25,25]])for(let z=-30;z<0;z++)if(mod(z,3)!==1)M.set(a,b,z,'fer');else{M.set(a-1,b,z,'fer');M.set(a+1,b,z,'fer');}
 return render(M,shader({dark:h=>h.z<0?Math.floor(-h.z/5):0,edge:()=>false}));
}
module.exports={CELL,H,T,STUB,COURSES,BLOCKS,MODULES,NAMES,CORNERS,STUBS,masonry,cap,core,shader,wall,corner,stub,stairsDown,shaft,bake,flame,FLAMES,hash,pixel,col,floorGlow,glowRing,rubble,dither,noise,grain};
