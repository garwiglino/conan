'use strict';
/* Kit d'alimentation des intérieurs, tiré des sources Piskel :
 *  - art/environnement/interieurs/<id>/png/ : chaque pièce en PNG (couleur,
 *    -ombre, -lueur, images d'animation) et catalogue.json ;
 *  - art/environnement/guide/salle-<id>.png : une salle type, rendu et plan ;
 *  - art/environnement/guide/pieces-<id>.png : toutes les pièces nommées.
 * Appelé par export-kit.cjs. */
const {createCanvas}=require('@napi-rs/canvas');
const I=require('./interieurs.cjs'),Scene=require('./interieur-scene.cjs');
const {CELL}=Scene;
function png(w,h,rgba){const c=createCanvas(w,h),x=c.getContext('2d'),im=x.createImageData(w,h);im.data.set(rgba);x.putImageData(im,0,0);return c.toBuffer('image/png');}
const grey=(w,h,f)=>{const o=new Uint8Array(w*h*4);for(let i=0;i<w*h;i++)o.set([f[i*4],f[i*4],f[i*4],f[i*4+3]?255:0],i*4);return o;};
const same=(a,b)=>a&&b&&a.length===b.length&&a.every((x,i)=>x===b[i]);
const NOTES={
 'mur-a':'mur plein','mur-b':'mur plein, mousse et pierre saillante','mur-c':'mur plein, fissure et pierre manquante','mur-ruine':'haut du mur écroulé',
 'mur-breche':'brèche en V jusqu’à 1 m, gravats dans la salle','meurtriere':'meurtrière, ciel de nuit dans la fente','fenetre':'fenêtre à barreaux, clair de lune au sol',
 'baniere':'bannière gobeline au crâne','chaines':'chaînes et fers scellés','levier-haut':'levier mural levé','levier-bas':'levier mural abaissé','mur-torche':'torche murale animée, lueur chaude sur le mur et au sol',
 'arche':'arche ouverte (passage de 1,25 m)','porte':'porte de bois fermée','porte-ouverte':'porte ouverte, battant rabattu vers l’autre côté',
 'porte-verrouillee':'porte verrouillée : barres, cadenas','herse':'herse baissée','herse-levee':'herse levée (passage)',
 'escalier-montant':'escalier qui monte dans le mur ; la case devant reste libre',
 'porte-cellule':'grille de cellule fermée, serrure','porte-cellule-ouverte':'grille de cellule ouverte, battant rabattu dans la cellule',
 'porte-scellee':'grande porte scellée par une rune violette qui pulse (animée) ; s’ouvre avec la fée',
 'muret':'muret arasé','muret-debut':'muret rogné de 8 unités au départ (angle rentrant entre deux murets)','muret-casse':'muret cassé, gravats dans la salle',
 'angle-nord':'angle du fond entre deux grands murs (sol au sud-est du sommet)','bout-nord':'pilier d’about à droite, au bout d’un mur nord (sol au sud-ouest du sommet)',
 'bout-ouest':'pilier d’about à gauche, au bout d’un mur ouest (sol au nord-est du sommet)','angle-sud':'angle de devant entre deux murets (sol au nord-ouest du sommet)',
 'escalier-descendant-nord':'trémie : marches qui descendent vers le nord','escalier-descendant-ouest':'trémie : marches qui descendent vers l’ouest','puits':'trémie : puits du monte-charge, chaînes dans le noir',
 'pilier-carre':'pilier carré','pilier-rond':'pilier rond','pilier-brise':'pilier brisé','eboulis':'éboulis','blocs':'blocs taillés tombés',
 'caisse':'caisse','caisses':'caisses empilées','tonneau':'tonneau','coffre':'coffre','coffre-verrouille':'coffre verrouillé','coffre-ouvert':'coffre ouvert, or',
 'table':'table et chope','ratelier':'râtelier d’armes','paillasse':'paillasse et couverture','totem':'totem à crânes','etendard':'étendard gobelin',
 'cage':'cage','marmite':'marmite verte sur le feu','tresor':'tas d’or','brasero':'brasero animé, lueur au sol',
 'trone':'trône du chef, crânes et cornes','tas-os':'tas d’os','cle':'clé (la même pour toutes les portes, seul le nom change)','dalle-pression':'dalle de pression levée, rune éteinte',
 'dalle-pression-enfoncee':'dalle de pression enfoncée, rune allumée','treuil':'treuil du monte-charge','monte-charge':'plate-forme du monte-charge (posée sur le puits)','cage-fee':'cage suspendue de la fée (animée)',
 fissure:'fissure',flaque:'flaque',os:'os',crane:'crâne',paille:'paille',mousse:'mousse',tache:'tache sombre',gravats:'gravats',grille:'grille d’égout',traces:'traces de griffes',
 toile:'toile d’araignée du coin nord'
};
const ANCRE={
 'mur/nord':'sommet nord de la case de salle (u = 32 i, v = 32 j), au sol ; le mur suit le bord nord vers le bas-droite',
 'mur/ouest':'sommet nord de la case de salle (u = 32 i, v = 32 j), au sol ; le mur suit le bord ouest vers le bas-gauche',
 'muret/sud':'sommet ouest de la case de salle (u = 32 i, v = 32 j + 32) ; le muret suit le bord sud',
 'muret/est':'sommet est de la case de salle (u = 32 i + 32, v = 32 j) ; le muret suit le bord est',
 angle:'sommet de la grille (u = 32 I, v = 32 J), au sol',escalier:'sommet nord de la case de l’escalier',objet:'pied de l’objet, au sol',
 decors:'centre du décor, au sol',toile:'sommet nord de la case du coin, au sol (la toile est dessinée en haut des murs)'
};
// Fichier d'une pièce, sans extension.
const fileOf=P=>(P.groupe==='murs'||P.groupe==='portes'||P.groupe==='murets'?P.groupe+'/'+P.orientation+'/':P.groupe+'/')+P.nom;
// Recadre toutes les images et tous les calques d'une pièce sur leurs pixels visibles.
function trimPiece(P){const {w,h}=P,all=P.images.flatMap(im=>[im.couleur,im.ombre,im.lueur]).filter(Boolean);let x0=w,y0=h,x1=-1,y1=-1;
 for(const f of all)for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(f[(y*w+x)*4+3]){x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);}
 const W=x1-x0+1,H=y1-y0+1,cut=f=>{if(!f)return null;const o=new Uint8Array(W*H*4);for(let y=0;y<H;y++)o.set(f.subarray(((y+y0)*w+x0)*4,((y+y0)*w+x0+W)*4),y*W*4);return f.some((v,i)=>i%4===3&&v)?o:null;};
 return {...P,w:W,h:H,ancre:[P.ancre[0]-x0,P.ancre[1]-y0],images:P.images.map(im=>({couleur:cut(im.couleur),ombre:cut(im.ombre),lueur:cut(im.lueur)}))};}

/* PNG d'un intérieur : Map chemin relatif -> octets, avec catalogue.json. */
async function exportInterieur(id,kit){
 kit=kit||await I.read(id);const files=new Map(),sols=[],elements=[],{manifest}=kit;
 for(const [name,t]of Object.entries(kit.sols)){files.set('sols/'+name+'.png',png(t.w,t.h,t.px));const e={nom:name,png:'sols/'+name+'.png',taille:[t.w,t.h],source:t.source};
  if(t.ht){files.set('sols/'+name+'-hauteur.png',png(t.w,t.h,grey(t.w,t.h,t.ht)));e.hauteur='sols/'+name+'-hauteur.png';}sols.push(e);}
 for(const [key,raw]of kit.pieces){const P=trimPiece(raw),base=fileOf(P),n=P.images.length,e={nom:P.nom,role:P.role};
  if(P.orientation)e.orientation=P.orientation;e.description=NOTES[P.nom]||P.nom;e.taille=[P.w,P.h];e.ancre=P.ancre;
  e.ancre_au_sol=ANCRE[P.role+'/'+P.orientation]||ANCRE[P.role];
  if(n===1){files.set(base+'.png',png(P.w,P.h,P.images[0].couleur));e.png=base+'.png';}
  else{e.images=P.images.map((im,k)=>{const f=base+'-'+(k+1)+'.png';files.set(f,png(P.w,P.h,im.couleur));return f;});e.fps=P.fps;}
  for(const layer of ['ombre','lueur']){const fr=P.images.map(im=>im[layer]);if(!fr[0])continue;
   const one=fr.every(f=>same(f,fr[0])),list=one?[fr[0]]:fr,names=list.map((f,k)=>base+'-'+layer+(one?'':'-'+(k+1))+'.png');list.forEach((f,k)=>files.set(names[k],png(P.w,P.h,f)));
   e[layer]={[one?'png':'images']:one?names[0]:names,opacite:P.opacites[layer],usage:layer==='ombre'?'sur le sol seulement, avant les pièces':'sur le sol seulement, après les ombres'};}
  const lum=Scene.LUMIERES[key];if(lum)e.lumiere={depuis_l_ancre:lum.at,rayon:lum.rayon,force:lum.force};
  e.source=P.source;elements.push(e);}
 const catalogue={interieur:manifest.interieur,palette:'../'+manifest.palette,
  grille:{case:'case de salle de 2 m = 32 unités = losange 64 × 32 px',projection:'x = u − v, y = (u + v) / 2 − z ; 16 unités par mètre',axes:'i vers l’est (bas-droite), j vers le sud (bas-gauche) ; u = 32 i, v = 32 j'},
  dimensions:manifest.dimensions,
  regles:{
   fond:'tout ce qui n’est pas une case de salle reste noir',
   murs:'grand mur sur le bord nord ou ouest d’une case de salle qui touche le vide (ou une autre salle, s’il y a une ouverture) ; épaisseur côté vide',
   murets:'muret sur le bord sud ou est qui touche le vide ; muret-debut quand la case de vide a aussi une case de salle à l’ouest de la case de salle',
   angles:'à chaque sommet qui n’a qu’une case de salle parmi ses quatre : sud-est -> angle-nord, sud-ouest -> bout-nord, nord-est -> bout-ouest, nord-ouest -> angle-sud',
   ordre:'sol, décors au sol, trémies, ombres, lueurs, puis murs, murets, angles et objets triés par i + j de la case qui les porte (case de vide pour les murs), puis par u + v',
   ouvertures:'une porte remplace un module de mur ; la case de salle devant une porte ou un escalier montant reste sans objet',
   cloisons:'un mur entre deux salles cache jusqu’à 1,5 case derrière lui : quand un personnage y passe, dessiner ce mur à 40 % d’opacité',
   lumiere:'après tout le reste, chaque pixel est assombri selon sa distance (à l’écran, y × 1,15) aux sources « lumiere » des pièces : I = somme de force × 1,6 × (1 − d / rayon)^1,4 ; luminosité = '+Scene.AMBIANT+' + '+(1-Scene.AMBIANT).toFixed(1)+' × min(1, I), par huitièmes tramés (Bayer 4 × 4)'
  },
  sols,elements};
 files.set('catalogue.json',Buffer.from(JSON.stringify(catalogue,null,1)+'\n'));
 return files;
}

/* Petites scènes pour la planche des pièces : la pièce sur sa case de sol. */
function vignette(kit,key){const P=kit.pieces.get(key),sol='dalles';let cells=[[0,0]],ref=[0,0];
 if(P.role==='muret')ref=P.orientation==='sud'?[0,CELL]:[CELL,0];
 else if(P.role==='angle'){ref=[CELL,CELL];cells=[{'angle-nord':[1,1],'bout-nord':[0,1],'bout-ouest':[1,0],'angle-sud':[0,0]}[P.nom]];}
 else if(P.role==='objet'||P.role==='decors')ref=[CELL/2,CELL/2];
 const on=(i,j)=>cells.some(([a,b])=>a===i&&b===j)?sol:null;
 // Boîte : la case (ou les cases) et la pièce autour de son ancre.
 let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;const grow=(x,y)=>{x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);};
 for(const [i,j]of cells)for(const [u,v]of [[i,j],[i+1,j],[i+1,j+1],[i,j+1]])grow((u-v)*CELL,(u+v)*CELL/2);
 const rx=ref[0]-ref[1],ry=(ref[0]+ref[1])/2;grow(rx-P.ancre[0],ry-P.ancre[1]);grow(rx-P.ancre[0]+P.w,ry-P.ancre[1]+P.h);
 const pad=4,w=x1-x0+pad*2,h=y1-y0+pad*2,S=Scene.surface(kit,w,h,pad-x0,pad-y0);S.paint(on);
 if(P.role==='decors')S.blit(key,ref,{onlyFloor:true});else S.place(key,ref);
 return {w,h,data:S.data};}
function canvasOf(r){const c=createCanvas(r.w,r.h),x=c.getContext('2d'),im=x.createImageData(r.w,r.h);im.data.set(r.data);x.putImageData(im,0,0);return c;}

/* Planche : toutes les pièces, par famille, sur leur case. */
function piecesPlate(id,kit){
 const K=I.load(id),groups=[];
 groups.push(['Sols (texture raccordable, ici 2 × 2 répétitions)',Object.keys(kit.sols).map(n=>({sol:n,label:n}))]);
 for(const o of ['nord','ouest'])groups.push(['Murs '+o+' (bord '+o+' d’une case de salle)',[...K.murs,'mur-torche'].map(n=>({key:o+'/'+n,label:n}))]);
 for(const o of ['nord','ouest'])groups.push(['Ouvertures '+o,[...K.portes,'porte-scellee'].map(n=>({key:o+'/'+n,label:n}))]);
 groups.push(['Murets sud et est, angles, escaliers descendants',[...['sud','est'].flatMap(o=>K.murets.map(n=>({key:o+'/'+n,label:n+' ('+o+')'}))),...Object.keys(K.W.CORNERS).map(n=>({key:n,label:n})),{key:'escalier-descendant-nord',label:'escalier (nord)'},{key:'escalier-descendant-ouest',label:'escalier (ouest)'},{key:'puits',label:'puits'}]]);
 groups.push(['Objets',[...Object.values(K.objets).flat(),...K.O.ANIMATED].map(n=>({key:n,label:n}))]);
 groups.push(['Décors au sol et toile',[...Object.keys(K.O.DECALS).map(n=>({key:'decor/'+n,label:n})),{key:'toile',label:'toile'}]]);
 const S=2,pad=14,lab=22,W=1900,head=58;
 // Mise en page en lignes : chaque famille commence une ligne.
 const rows=[];let y=head;
 for(const [title,list]of groups){y+=34;const tiles=list.map(t=>{const r=t.sol?(()=>{const s=kit.sols[t.sol],w=s.w*2,h=s.h*2,d=new Uint8ClampedArray(w*h*4);for(let yy=0;yy<h;yy++)for(let xx=0;xx<w;xx++)d.set(s.px.subarray(((yy%s.h)*s.w+xx%s.w)*4,((yy%s.h)*s.w+xx%s.w)*4+4),(yy*w+xx)*4);return {w,h,data:d};})():vignette(kit,t.key);return {...t,r};});
  let x=pad,rowH=0;rows.push({title,y:y-10});
  for(const t of tiles){const tw=t.r.w*S,th=t.r.h*S;if(x+tw>W-pad){x=pad;y+=rowH+lab+pad;rowH=0;}t.x=x;t.y=y;x+=Math.max(tw,t.label.length*8+6)+pad;rowH=Math.max(rowH,th);}
  rows[rows.length-1].tiles=tiles;y+=rowH+lab+pad;}
 const cv=createCanvas(W,y+pad),c=cv.getContext('2d');c.fillStyle='#1b1a20';c.fillRect(0,0,W,y+pad);c.imageSmoothingEnabled=false;
 c.fillStyle='#efe4c6';c.font='bold 26px sans-serif';c.fillText(K.nom+' : pièces du kit (×2, chaque pièce sur sa case de sol, fond noir = vide)',pad,38);
 for(const row of rows){c.fillStyle='#e8c66a';c.font='bold 19px sans-serif';c.fillText(row.title,pad,row.y);
  for(const t of row.tiles){c.drawImage(canvasOf(t.r),t.x,t.y,t.r.w*S,t.r.h*S);c.fillStyle='#cdbf98';c.font='15px sans-serif';c.fillText(t.label,t.x,t.y+t.r.h*S+16);}}
 return cv.toBuffer('image/png');
}

/* Planche : la salle type rendue, et son plan avec les règles d'assemblage. */
function sallePlate(id,kit,scene=Scene.SALLE){
 const K=I.load(id),out=Scene.compose(kit,scene),L=out.layout,S=2;
 // Recadrage sur ce qui n'est pas noir.
 let x0=out.w,y0=out.h,x1=0,y1=0;for(let y=0;y<out.h;y++)for(let x=0;x<out.w;x++){const k=(y*out.w+x)*4;if(out.data[k]|out.data[k+1]|out.data[k+2]){x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);}}
 const m=12;x0-=m;y0-=m;x1+=m;y1+=m;const w=(x1-x0+1)*S,h=(y1-y0+1)*S,pad=24,head=92,legend=276,W=w*2+pad*3,H=head+h+legend;
 const cv=createCanvas(W,H),c=cv.getContext('2d');c.fillStyle='#000';c.fillRect(0,0,W,H);c.imageSmoothingEnabled=false;
 c.drawImage(canvasOf(out),x0,y0,x1-x0+1,y1-y0+1,pad,head,w,h);
 // Plan : mêmes cases, même projection, au sol.
 const X0=pad*2+w,at=(u,v)=>{const [x,y]=out.proj(u,v);return [X0+(x-x0)*S,head+(y-y0)*S];},cellAt=(i,j)=>[at(i*CELL,j*CELL),at((i+1)*CELL,j*CELL),at((i+1)*CELL,(j+1)*CELL),at(i*CELL,(j+1)*CELL)];
 const poly=(pts,fill,stroke,lw=1)=>{c.beginPath();pts.forEach(([x,y],k)=>k?c.lineTo(x,y):c.moveTo(x,y));c.closePath();if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=lw;c.stroke();}};
 const line=(a,b,colour,lw,dash=[])=>{c.setLineDash(dash);c.strokeStyle=colour;c.lineWidth=lw;c.beginPath();c.moveTo(...a);c.lineTo(...b);c.stroke();c.setLineDash([]);};
 const text=(t,x,y,{size=14,colour='#f4efe3',bold=false,align='center'}={})=>{c.font=(bold?'bold ':'')+size+'px sans-serif';c.textAlign=align;c.lineWidth=3;c.strokeStyle='rgba(0,0,0,.85)';c.strokeText(t,x,y);c.fillStyle=colour;c.fillText(t,x,y);c.textAlign='left';};
 c.fillStyle='#0d0c11';c.fillRect(X0,head,w,h);
 const FLOOR={dalles:'#6f6878',paves:'#8d867a',terre:'#7a5a40',planches:'#9a7146'};
 for(let j=0;j<L.NJ;j++)for(let i=0;i<L.NI;i++){const mat=L.cell(i,j);if(mat)poly(cellAt(i,j),FLOOR[mat],'rgba(0,0,0,.35)',1);}
 for(const [i,j]of scene.escaliers||[]){poly(cellAt(i,j),'#e8c66a','#7a5a10',2);const [a,b]=[at(i*CELL+16,j*CELL+26),at(i*CELL+16,j*CELL+6)];line(a,b,'#3b2f1c',3);text('▼',...at(i*CELL+16,j*CELL+16),{size:13,colour:'#3b2f1c'});}
 const OPEN=new Set(['arche','porte-ouverte','herse-levee','porte-cellule-ouverte']),SHUT=new Set(['porte','porte-verrouillee','herse','porte-cellule','porte-scellee']);
 for(const it of L.items){if(!it.edge)continue;const [i,j,s]=it.edge,nom=it.piece.split('/')[1],X=i*CELL,Y=j*CELL;
  const seg={N:[[X,Y],[X+CELL,Y]],O:[[X,Y],[X,Y+CELL]],S:[[X,Y+CELL],[X+CELL,Y+CELL]],E:[[X+CELL,Y],[X+CELL,Y+CELL]]}[s].map(p=>at(...p));
  if(s==='S'||s==='E'){line(...seg,'#a79fb3',4,nom==='muret-casse'?[6,5]:[]);continue;}
  const colour=OPEN.has(nom)?'#5fbf5a':SHUT.has(nom)?'#d9572f':nom==='escalier-montant'?'#e8c66a':'#2a2533';
  line(...seg,'#000',9);line(...seg,colour,6);
  const mid=[(seg[0][0]+seg[1][0])/2,(seg[0][1]+seg[1][1])/2];
  if(nom==='mur-torche'){c.fillStyle='#f9bb47';c.beginPath();c.arc(...mid,6,0,7);c.fill();}
  else if(nom==='fenetre'||nom==='meurtriere'){c.fillStyle='#7fa7c4';c.fillRect(mid[0]-5,mid[1]-5,10,10);}
  else if(nom==='escalier-montant')text('▲',mid[0],mid[1]+5,{size:13,colour:'#3b2f1c'});}
 const CORNER={'angle-nord':['#c9a3e8','N'],'bout-nord':['#7fd0c4','b'],'bout-ouest':['#7fd0c4','b'],'angle-sud':['#c9a3e8','S']};
 for(const it of L.items){const k=CORNER[it.piece];if(!k)continue;const [x,y]=at(...it.ref);c.fillStyle='#000';c.fillRect(x-7,y-7,14,14);c.fillStyle=k[0];c.fillRect(x-5,y-5,10,10);}
 for(const it of L.items){if(it.edge||CORNER[it.piece]||it.piece==='toile')continue;const [x,y]=at(...it.ref);c.fillStyle='#000';c.beginPath();c.arc(x,y,5,0,7);c.fill();c.fillStyle='#f4efe3';c.beginPath();c.arc(x,y,3.5,0,7);c.fill();}
 // Numéros des cases, dans la première case de chaque colonne (i, bord nord) et de chaque ligne (j, bord ouest).
 const muted={size:12,colour:'#d8d0e4'};
 for(let i=0;i<L.NI;i++){let j=0;while(j<L.NJ&&!L.cell(i,j))j++;if(j<L.NJ){const [x,y]=at(i*CELL+18,j*CELL+5);text('i'+i,x,y+4,muted);}}
 for(let j=0;j<L.NJ;j++){let i=0;while(i<L.NI&&!L.cell(i,j))i++;if(i<L.NI){const [x,y]=at(i*CELL+5,j*CELL+18);text('j'+j,x,y+4,muted);}}
 c.fillStyle='#efe4c6';c.font='bold 26px sans-serif';c.fillText(K.nom+' : salle type',pad,38);c.font='18px sans-serif';c.fillText('Rendu (sources Piskel, ×2)',pad,head-14);c.fillText('Plan (mêmes cases de 2 m)',X0,head-14);
 const items=[['#6f6878','dalles (salle)'],['#8d867a','pavés (couloir)'],['#7a5a40','terre battue (galerie creusée)'],['#9a7146','plancher (quartiers gobelins)'],
  ['#2a2533','grand mur, bord nord ou ouest'],['#a79fb3','muret, bord sud ou est (tirets : muret cassé)'],['#5fbf5a','ouverture : arche, porte ouverte, herse levée'],['#d9572f','fermée : porte, porte verrouillée, herse'],
  ['#e8c66a','escalier : ▲ montant dans le mur, ▼ trémie descendante'],['#f9bb47','torche murale'],['#7fa7c4','fenêtre ou meurtrière'],['#c9a3e8','angle : N du fond, S de devant'],['#7fd0c4','b : pilier d’about'],['#f4efe3','objet (pied)']];
 items.forEach(([col,label],k)=>{const x=pad+(k%4)*(W/4),y=head+h+34+Math.floor(k/4)*34;c.fillStyle=col;c.fillRect(x,y-16,26,20);c.strokeStyle='#555';c.lineWidth=1;c.strokeRect(x,y-16,26,20);c.fillStyle='#efe4c6';c.font='17px sans-serif';c.fillText(label,x+36,y);});
 const notes=['Le vide reste noir. Un grand mur se pose sur le bord nord ou ouest d’une case de salle, un muret sur le bord sud ou est : on voit dans la salle par-dessus les murets.',
  'Ordre : sol, décors, trémies, ombres, lueurs, puis pièces triées par i + j de la case qui les porte et par u + v. Une ouverture remplace un module de mur ; sa case reste libre.',
  'Lumière : tout s’assombrit loin des torches, du brasero, de la marmite et des fenêtres, jusqu’à '+Math.round(Scene.AMBIANT*100)+' % (calcul dans interieur-scene.cjs, règle dans catalogue.json).'];
 notes.forEach((t,k)=>{c.fillStyle='#cdbf98';c.font='17px sans-serif';c.fillText(t,pad,head+h+34+4*34+k*26);});
 return cv.toBuffer('image/png');
}

/* Tout le kit des intérieurs : Map chemin (relatif à art/environnement) -> octets. */
async function kit(){
 const files=new Map();
 for(const id of I.names){const k=await I.read(id);
  for(const [what,n]of k.horsPalette)console.warn(id+' : couleur hors palette '+what+' : '+n+' px ramenés à la plus proche');
  for(const [rel,buf]of await exportInterieur(id,k))files.set('interieurs/'+id+'/png/'+rel,buf);
  files.set('guide/salle-'+id+'.png',sallePlate(id,k));files.set('guide/pieces-'+id+'.png',piecesPlate(id,k));}
 return files;
}
module.exports={kit,exportInterieur,sallePlate,piecesPlate,vignette,NOTES};
