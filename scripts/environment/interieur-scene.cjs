'use strict';
/* Assemblage d'un intérieur à partir du kit (pièces RGBA relues des sources
 * Piskel), selon les règles du guide :
 *  1. fond noir ; sol des cases de salle, textures lues en coordonnées écran,
 *     mélangées au bord de deux sols par leur relief ;
 *  2. décors au sol, trémies d'escalier, puis ombres et lueurs (calques à
 *     leur opacité), seulement sur le sol ;
 *  3. murs, angles, murets, objets triés par case (i + j de la case qui les
 *     porte), puis par profondeur u + v à l'intérieur d'une même diagonale.
 * Une case vide qui touche la salle porte ses morceaux de mur : grand mur au
 * nord ou à l'ouest d'une case de salle, muret au sud ou à l'est. */
const CELL=32,H=48;
const mod=(a,n)=>((a%n)+n)%n;
const hash=(...k)=>{let h=2166136261;for(const n of k){h=Math.imul(h^(n&0xffff),16777619);h=Math.imul(h^(n>>>16),16777619);}h=Math.imul(h^(h>>>13),1274126177);return ((h^(h>>>16))>>>0)/4294967296;};
const FLOORS={'.':'dalles',',':'paves',':':'terre','=':'planches'};
/* Salle type de la forteresse gobeline : grande salle à piliers, galerie
 * creusée à l'ouest qui finit en éboulement, couloir vers une geôle à l'est.
 * i vers l'est (colonnes), j vers le sud (lignes) ; une case = 2 m. Objets
 * et décors en unités du monde (u = 32 i + …, v = 32 j + …). */
const SALLE={
 plan:[
  '#############',
  '###.....##==#',
  '#::.....,,==#',
  '###.....##==#',
  '###.....#####',
  '#############'],
 murs:{'3,1,N':'mur-a','4,1,N':'mur-torche','5,1,N':'escalier-montant','6,1,N':'mur-torche','7,1,N':'baniere',
  '3,1,O':'porte-verrouillee','3,2,O':'arche','3,3,O':'herse','3,4,O':'mur-ruine','1,2,O':'mur-breche','1,2,N':'mur-c','2,2,N':'chaines',
  '8,2,N':'meurtriere','9,2,N':'mur-b','10,1,N':'fenetre','11,1,N':'mur-c','10,1,O':'mur-torche','10,2,O':'porte-ouverte','10,3,O':'mur-ruine'},
 murets:{'5,4,S':'muret-casse','1,2,S':'muret-casse'},
 escaliers:[[7,4,'nord']],
 toiles:[[3,1]],
 objets:[['pilier-rond',144,80],['pilier-rond',208,80],['pilier-brise',144,128],['pilier-carre',208,128],['brasero',168,112],['totem',136,104],['etendard',246,60],['tonneau',194,40],
  ['eboulis',42,82],['blocs',120,146],['caisses',108,140],['ratelier',136,150],['coffre-verrouille',204,98],['marmite',240,104],
  ['table',344,50],['cage',368,46],['coffre-ouvert',372,84],['paillasse',340,116],['paillasse',370,118]],
 decors:[['os',160,58],['crane',190,128],['flaque',122,112],['fissure',214,100],['mousse',108,152],['tache',164,150],['gravats',70,80],['traces',80,74],['mousse',52,90],['grille',176,140],
  ['fissure',270,76],['paille',344,88],['os',378,70],['crane',332,100],
  ['gravats',152,40],['gravats',228,150],['os',250,92],['tache',196,62],['fissure',118,70],['flaque',186,150],['paille',362,122],['gravats',298,66],['mousse',272,90],['traces',220,120],['gravats',40,74]]
};
/* Kit en mémoire depuis les documents du premier jet (même forme que read). */
function fromDocuments(id){
 const I=require('./interieurs.cjs'),{docs,manifest}=I.documents(id),sols={},pieces=new Map();
 manifest.fichiers.forEach((e,k)=>{const d=docs[k].doc,L=n=>d.layers.find(l=>l.name===n),colour=L('couleur'),shadow=L('ombre'),glow=L('lueur');
  if(e.role==='sol'){sols[e.id]={w:d.width,h:d.height,px:colour.frames[0],ht:L('hauteur')?.frames[0]};return;}
  const frames=k2=>({couleur:colour.frames[k2],ombre:shadow?.frames[k2]||null,lueur:glow?.frames[k2]||null});
  const base={role:e.role,source:e.fichier,groupe:e.fichier.split('/')[0],orientation:e.orientation,w:d.width,h:d.height,ancre:e.ancre,opacites:{ombre:shadow?.opacity??0,lueur:glow?.opacity??0}};
  const key=n=>e.role==='mur'||e.role==='muret'?e.orientation+'/'+n:e.role==='decors'?'decor/'+n:n;
  if(e.anime)pieces.set(key(e.anime),{...base,nom:e.anime,fps:e.fps,images:colour.frames.map((_,k2)=>frames(k2))});
  else e.cadres.forEach((n,k2)=>pieces.set(key(n),{...base,nom:n,images:[frames(k2)]}));});
 return {manifest,sols,pieces};
}
/* Éléments à dessiner et leur ordre. Renvoie {items, floor(i, j)}. */
function layout(scene){
 const NJ=scene.plan.length,NI=scene.plan[0].length,cell=(i,j)=>{const c=scene.plan[j]?.[i];return c&&FLOORS[c]?FLOORS[c]:null;},items=[],P=(u,v)=>[u,v];
 const push=(piece,[u,v],[ci,cj],sub,extra={})=>items.push({piece,ref:[u,v],key:ci+cj,sub,...extra});
 const pick=(i,j,s)=>{const r=hash(i,j,s.charCodeAt(0));return r<.5?'mur-a':r<.8?'mur-b':'mur-c';};
 for(let j=0;j<NJ;j++)for(let i=0;i<NI;i++){if(!cell(i,j))continue;const X=i*CELL,Y=j*CELL;
  const n=scene.murs?.[i+','+j+',N'],o=scene.murs?.[i+','+j+',O'];
  if(!cell(i,j-1)||n)push('nord/'+(n||pick(i,j,'N')),P(X,Y),[i,j-1],X+16+Y-4,{edge:[i,j,'N']});
  if(!cell(i-1,j)||o)push('ouest/'+(o||pick(i,j,'O')),P(X,Y),[i-1,j],X-4+Y+16,{edge:[i,j,'O']});
  if(!cell(i,j+1))push('sud/'+(scene.murets?.[i+','+j+',S']||(cell(i-1,j+1)?'muret-debut':'muret')),P(X,Y+CELL),[i,j+1],X+16+Y+CELL+4,{edge:[i,j,'S']});
  if(!cell(i+1,j))push('est/'+(scene.murets?.[i+','+j+',E']||'muret'),P(X+CELL,Y),[i+1,j],X+CELL+4+Y+16,{edge:[i,j,'E']});
 }
 for(let J=0;J<=NJ;J++)for(let I=0;I<=NI;I++){const q=[cell(I-1,J-1),cell(I,J-1),cell(I-1,J),cell(I,J)].map(Boolean),n=q.filter(Boolean).length;if(n!==1)continue;const X=I*CELL,Y=J*CELL;
  if(q[3])push('angle-nord',P(X,Y),[I-1,J-1],X+Y-8);else if(q[2])push('bout-nord',P(X,Y),[I,J-1],X+Y);else if(q[1])push('bout-ouest',P(X,Y),[I-1,J],X+Y);else push('angle-sud',P(X,Y),[I,J],X+Y+8);}
 for(const [I,J]of scene.toiles||[])push('toile',P(I*CELL,J*CELL),[I,J-1],I*CELL+J*CELL+1e4);
 for(const [nom,u,v]of scene.objets||[])push(nom,[u,v],[Math.floor(u/CELL),Math.floor(v/CELL)],u+v);
 items.sort((a,b)=>a.key-b.key||a.sub-b.sub);
 return {items,cell,NI,NJ};
}
/* Surface de dessin : fond noir, sol peint case par case (cell(i, j) donne
 * la matière ou null), pièces posées calque par calque. (OX, OY) : pixel du
 * point u = v = 0. */
function surface(kit,w,h,OX,OY,{image=0}={}){
 const data=new Uint8ClampedArray(w*h*4),floor=new Uint8Array(w*h);for(let i=0;i<w*h;i++)data[i*4+3]=255;
 const proj=(u,v,z=0)=>[OX+u-v,OY+(u+v)/2-z];
 // Sol, mélange par relief à moins de 5 unités d'un bord entre deux matières.
 const S=kit.sols,tex=(m,x,y)=>{const t=S[m],k=(mod(y-OY,t.h)*t.w+mod(x-OX,t.w))*4;return [t.px,k,t.ht?t.ht[k]/255:.5];};
 const paint=cell=>{for(let y=0;y<h;y++)for(let x=0;x<w;x++){const X=x-OX+.5,Y=y-OY+.5,u=Y+X/2,v=Y-X/2,i=Math.floor(u/CELL),j=Math.floor(v/CELL),m=cell(i,j);if(!m)continue;
  let px,k,ht,score;[px,k,ht]=tex(m,x,y);score=ht;const fu=u-i*CELL,fv=v-j*CELL;
  for(const [di,dj,d]of [[0,-1,fv],[1,0,CELL-fu],[0,1,CELL-fv],[-1,0,fu]]){if(d>=5)continue;const n=cell(i+di,j+dj);if(!n||n===m)continue;const [p2,k2,h2]=tex(n,x,y),own=ht+d*.09,other=h2-d*.09;if(other>own&&other>score){px=p2;k=k2;score=other;}}
  data.set(px.subarray(k,k+3),(y*w+x)*4);floor[y*w+x]=1;}};
 const blit=(piece,ref,{layer='couleur',alpha=1,onlyFloor=false,img=image}={})=>{const P=kit.pieces.get(piece);if(!P)throw Error('pièce absente du kit : '+piece);const fr=P.images[img%P.images.length][layer];if(!fr)return;
  const [X,Y]=proj(...ref),x0=Math.round(X-P.ancre[0]),y0=Math.round(Y-P.ancre[1]);
  for(let y=0;y<P.h;y++)for(let x=0;x<P.w;x++){const s=(y*P.w+x)*4;if(!fr[s+3])continue;const xx=x0+x,yy=y0+y;if(xx<0||yy<0||xx>=w||yy>=h)continue;const d=(yy*w+xx)*4;if(onlyFloor&&!floor[yy*w+xx])continue;
   for(let c=0;c<3;c++)data[d+c]=Math.round(data[d+c]*(1-alpha)+fr[s+c]*alpha);}};
 // Une pièce complète : ombre et lueur sur le sol à leur opacité, puis la couleur.
 const place=(piece,ref,opts={})=>{const P=kit.pieces.get(piece);if(!P)throw Error('pièce absente du kit : '+piece);
  for(const layer of ['ombre','lueur'])if(P.opacites[layer])blit(piece,ref,{...opts,layer,alpha:P.opacites[layer],onlyFloor:true});blit(piece,ref,opts);};
 return {w,h,data,proj,floor,paint,blit,place};
}
/* Sources de lumière des pièces : décalage (u, v, z) depuis l'ancre au sol,
 * rayon (unités) et force. Hors de leur portée, la salle tombe à AMBIANT de
 * sa luminosité, par paliers de 1/8 tramés (Bayer 4 × 4). */
const LUMIERES={'nord/mur-torche':{at:[16,5,37],rayon:118,force:1},'ouest/mur-torche':{at:[5,16,37],rayon:118,force:1},
 brasero:{at:[0,0,18],rayon:130,force:1.1},marmite:{at:[0,0,8],rayon:64,force:.55},'nord/fenetre':{at:[16,6,28],rayon:64,force:.5},'ouest/fenetre':{at:[6,16,28],rayon:64,force:.5}};
const AMBIANT=.3,BAYER=[0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5];
function light(S,items){const src=[];for(const it of items){const L=LUMIERES[it.piece];if(L)src.push({p:S.proj(it.ref[0]+L.at[0],it.ref[1]+L.at[1],L.at[2]),...L});}
 for(let y=0;y<S.h;y++)for(let x=0;x<S.w;x++){let I=0;for(const l of src){const d=Math.hypot(x-l.p[0],(y-l.p[1])*1.15)/l.rayon;if(d<1)I+=(1-d)**1.4*l.force*1.6;}
  const f=AMBIANT+(1-AMBIANT)*Math.min(1,I),q=Math.min(8,Math.floor(f*8+BAYER[(y%4)*4+x%4]/16))/8,k=(y*S.w+x)*4;
  if(q<1)for(let c=0;c<3;c++)S.data[k+c]=Math.round(S.data[k+c]*q);}}
/* Rend la scène : image RGBA (w × h) et projection monde -> pixel. */
function compose(kit,scene,{image=0,pad=24,lumiere=true}={}){
 const L=layout(scene),{cell,NI,NJ}=L,w=CELL*(NI+NJ)+pad*2,h=16*(NI+NJ)+H+pad*2+8,OX=CELL*NJ+pad,OY=H+pad+8;
 const S=surface(kit,w,h,OX,OY,{image}),{blit}=S;
 // 1. Sol.
 S.paint(cell);
 // 2. Décors, trémies, ombres et lueurs sur le sol.
 for(const [nom,u,v]of scene.decors||[])blit('decor/'+nom,[u,v],{onlyFloor:true});
 for(const [i,j,o]of scene.escaliers||[])blit('escalier-descendant-'+o,[i*CELL,j*CELL]);
 for(const layer of ['ombre','lueur'])for(const it of L.items){const P=kit.pieces.get(it.piece);if(P&&P.opacites[layer])blit(it.piece,it.ref,{layer,alpha:P.opacites[layer],onlyFloor:true});}
 // 3. Murs, angles, murets et objets dans l'ordre.
 for(const it of L.items)blit(it.piece,it.ref);
 // 4. Lumière : obscurité loin des torches, du brasero et des fenêtres.
 if(lumiere)light(S,L.items);
 return {w,h,data:S.data,proj:S.proj,layout:L};
}
module.exports={SALLE,FLOORS,LUMIERES,AMBIANT,layout,compose,surface,fromDocuments,CELL,H};
