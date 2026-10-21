'use strict';
/* Intérieurs redessinés : ce que le premier jet Piskel écrit pour chacun, et
 * relecture des sources (.piskel) pour le kit et les planches. Un intérieur
 * est un espace fermé entouré de noir : sols, grands murs au fond (bords
 * nord et ouest), murets arasés devant (bords sud et est), angles, portes,
 * escaliers, objets et décors. Sources dans art/environnement/interieurs/<id>.
 * Les rôles du manifeste :
 *  - sol : texture raccordable à l'écran (calques hauteur et couleur) ;
 *  - mur : modules de 2 m d'un bord nord ou ouest, ancre au sommet de départ ;
 *  - muret : modules de 2 m d'un bord sud ou est ;
 *  - angle : pièces posées sur un sommet de case ;
 *  - escalier : trémie posée sur une case de salle ;
 *  - objet : posé au sol, ancre au pied ;
 *  - decors : peints à plat sur le sol ; toile : dans le coin nord.
 * « anime » : les cadres sont les images d'une animation (fps). */
const fs=require('node:fs'),path=require('node:path'),{Grid}=require('./brushes.cjs'),{rgba,heights,frame}=require('./frames.cjs');
const ROOT=path.join(__dirname,'../../art/environnement/interieurs');
// Recadre un sprite (couleur, ombre, lueur) sur ses pixels visibles ; l'ancre suit.
function crop(s){const layers=[s.g,s.shadow,s.glow].filter(Boolean);let x0=s.w,y0=s.h,x1=-1,y1=-1;
 for(const g of layers)for(let y=0;y<s.h;y++)for(let x=0;x<s.w;x++)if(g.px[y*s.w+x]){x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);}
 if(x1<0)return {...s,w:1,h:1};const w=x1-x0+1,h=y1-y0+1,cut=g=>{if(!g)return g;const o=new Grid(w,h);for(let y=0;y<h;y++)o.px.set(g.px.subarray((y+y0)*s.w+x0,(y+y0)*s.w+x0+w),y*w);return o;};
 return {g:cut(s.g),shadow:cut(s.shadow),glow:cut(s.glow),glowKind:s.glowKind,w,h,ax:s.ax-x0,ay:s.ay-y0};}
// Cadres alignés sur une ancre commune : un document Piskel par famille.
function family(list,{fps=2}={}){const f=frame(list),layer=(name,key,opacity)=>({name,opacity,frames:list.map(s=>s[key]?rgba(s[key],f.w,f.h,...f.place(s)):new Uint8Array(f.w*f.h*4))});
 const layers=[];if(list.some(s=>s.glow))layers.push(layer('lueur','glow',['lune','arcane'].includes(list.find(s=>s.glow).glowKind)?.3:.35));if(list.some(s=>s.shadow&&s.shadow.px.some(Boolean)))layers.push(layer('ombre','shadow',.5));layers.push(layer('couleur','g',1));
 return {width:f.w,height:f.h,fps,layers,ancre:[f.ax,f.ay]};}
const DESCRIPTION={
 sol:'Sol raccordable (bords opposés jointifs), lu en coordonnées écran. Calque couleur : pixels du jeu. Calque hauteur (gris) : relief pour les mélanges entre sols.',
 mur:'Modules de mur de 2 m (32 unités le long du bord, 48 de haut, 8 d’épaisseur côté vide). Ancre : sommet de départ du bord, au sol. Une variante par cadre ; calque ombre : pied du mur sur le sol (opacité = opacité en jeu) ; calque lueur : lumière au sol.',
 anime:'Animation (un cadre par image). Ancre commune ; calques ombre et lueur à l’opacité du jeu.',
 muret:'Murets arasés de 2 m des bords sud et est (6 unités de haut, 8 d’épaisseur côté vide). Ancre : sommet de départ du bord.',
 angle:'Pièces d’angle posées sur un sommet de case (ancre = le sommet, au sol). Voir le guide pour le choix.',
 escalier:'Trémie posée sur une case de salle : escalier descendant ou puits du monte-charge (ancre = coin nord de la case). Le dessus du sol autour est transparent.',
 objet:'Objet debout, ancre au pied (au sol). Calque ombre : ombre de contact ; calque lueur : lumière au sol. Une variante par cadre.',
 decors:'Petits décors peints à plat sur le sol. Ancre commune dans le cadre.',
 toile:'Toile d’araignée du coin nord d’une salle : ancre au sommet du coin, au sol ; dessinée après les deux grands murs.'
};
const INTERIEURS={
 'forteresse-gobeline'(){
  const W=require('./forteresse-murs.cjs'),O=require('./forteresse-objets.cjs'),S=require('./forteresse-sols.cjs');
  return {
   nom:'Forteresse gobeline',W,O,S,
   rampes:['cachot','lueur','torche','fer','rouille','chiffon','planche','paille','gobelin','bouleau','mousse','eau','fleur','ocre','arcane'],
   sols:{dalles:S.dalles,paves:S.paves,terre:S.terre,planches:S.planches},
   murs:['mur-a','mur-b','mur-c','mur-ruine','mur-breche','meurtriere','fenetre','baniere','chaines','levier-haut','levier-bas'],
   portes:['arche','porte','porte-ouverte','porte-verrouillee','herse','herse-levee','escalier-montant','porte-cellule','porte-cellule-ouverte'],
   murets:['muret','muret-debut','muret-casse'],
   objets:{piliers:['pilier-carre','pilier-rond','pilier-brise'],ruines:['eboulis','blocs'],mobilier:['caisse','caisses','tonneau','coffre','coffre-verrouille','coffre-ouvert','table','ratelier','paillasse'],gobelins:['totem','etendard','cage','marmite','tresor'],donjon:['trone','tas-os','cle','dalle-pression','dalle-pression-enfoncee'],mecanismes:['treuil','monte-charge']}
  };
 }
};
const names=Object.keys(INTERIEURS),load=id=>{const f=INTERIEURS[id];if(!f)throw Error('intérieur inconnu : '+id);return f();};
/* Documents Piskel du premier jet et manifeste. */
function documents(id){
 const K=load(id),{W,O}=K,docs=[],slug=n=>id+'-'+n,files=[];
 const manifest={interieur:K.nom,palette:'palette-'+id+'.gpl',rampes:K.rampes,echelle:'1 px par unité ; 16 unités par mètre ; case de salle de 2 m = losange 64 × 32',
  dimensions:{case:W.CELL,mur:W.H,epaisseur:W.T,muret:W.STUB},fichiers:files};
 const add=(file,role,doc,entry)=>{docs.push({file,doc:{name:slug(path.basename(file,'.piskel')),description:DESCRIPTION[entry.anime?'anime':role],...doc}});files.push({fichier:file,role,...entry});};
 for(const [name,make]of Object.entries(K.sols)){const g=make();add('sols/'+name+'.piskel','sol',{width:g.w,height:g.h,layers:[{name:'hauteur',frames:[heights(g)]},{name:'couleur',frames:[rgba(g)]}]},{id:name});}
 for(const o of ['nord','ouest']){
  for(const [group,list]of [['murs',K.murs],['portes',K.portes]]){const f=family(list.map(n=>crop(W.wall(n,o))));add(group+'/'+o+'.piskel','mur',f,{orientation:o,ancre:f.ancre,cadres:list});}
  const f=family([0,1,2,3].map(k=>crop(W.wall('mur-torche',o,{image:k}))),{fps:8});add('murs/torche-'+o+'.piskel','mur',f,{orientation:o,ancre:f.ancre,anime:'mur-torche',fps:8});
  const g=family([0,1,2,3].map(k=>crop(W.wall('porte-scellee',o,{image:k}))),{fps:6});add('portes/scellee-'+o+'.piskel','mur',g,{orientation:o,ancre:g.ancre,anime:'porte-scellee',fps:6});
 }
 for(const o of ['sud','est']){const f=family(K.murets.map(n=>crop(W.stub(n,o))));add('murets/'+o+'.piskel','muret',f,{orientation:o,ancre:f.ancre,cadres:K.murets});}
 {const list=Object.keys(W.CORNERS),f=family(list.map(n=>crop(W.corner(n))));add('angles/angles.piskel','angle',f,{ancre:f.ancre,cadres:list});}
 {const f=family(['nord','ouest'].map(o=>crop(W.stairsDown(o))));add('escaliers/descendant.piskel','escalier',f,{ancre:f.ancre,cadres:['escalier-descendant-nord','escalier-descendant-ouest']});}
 {const f=family([crop(W.shaft())]);add('escaliers/puits.piskel','escalier',f,{ancre:f.ancre,cadres:['puits']});}
 for(const [group,list]of Object.entries(K.objets)){const f=family(list.map(n=>crop(O.object(n))));add('objets/'+group+'.piskel','objet',f,{ancre:f.ancre,cadres:list});}
 for(const n of O.ANIMATED){const f=family([0,1,2,3].map(k=>crop(O.object(n,{image:k}))),{fps:8});add('objets/'+n+'.piskel','objet',f,{ancre:f.ancre,anime:n,fps:8});}
 {const list=Object.keys(O.DECALS),sprites=list.map(n=>{const g=O.decal(n);return {g,w:g.w,h:g.h,ax:g.anchor[0],ay:g.anchor[1]};}),f=family(sprites);add('decors/decors-sol.piskel','decors',f,{ancre:f.ancre,cadres:list});}
 {const g=O.cobweb(),f=family([{g,w:g.w,h:g.h,ax:g.anchor[0],ay:g.anchor[1]+O.WEB_Z}]);add('decors/toile.piskel','toile',f,{ancre:f.ancre,cadres:['toile']});}
 return {docs,manifest,name:K.nom};
}
/* Relit un intérieur depuis ses sources : sols et pièces (cadres RGBA).
 * pieces : Map nom -> {nom, role, groupe, orientation, w, h, ancre, images:
 * [{couleur, ombre, lueur}], opacites, fps}. Nom : 'nord/mur-a',
 * 'ouest/porte', 'sud/muret', 'angle-nord', 'pilier-rond', 'decor/os'…
 * Une couleur hors palette (retouche) est ramenée à la plus proche des rampes
 * du manifeste ; horsPalette compte ces pixels par fichier et par couleur. */
async function read(id){
 const piskel=require('./piskel.cjs'),P=require('./palette.cjs'),DIR=path.join(ROOT,id),manifest=JSON.parse(fs.readFileSync(path.join(DIR,'manifeste.json'),'utf8')),sols={},pieces=new Map(),horsPalette=new Map();
 const pal=manifest.rampes.flatMap(r=>P.RAMPS[r]).map(h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16))),near=new Map(pal.map(c=>[c.join(','),c]));
 const snap=(f,file)=>{for(let i=0;i<f.length;i+=4){if(f[i+3]<128){f.fill(0,i,i+4);continue;}f[i+3]=255;const k=f[i]+','+f[i+1]+','+f[i+2];let c=near.get(k);
  if(!c){let best=1e9;for(const p of pal){const d=(p[0]-f[i])**2*.3+(p[1]-f[i+1])**2*.59+(p[2]-f[i+2])**2*.11;if(d<best){best=d;c=p;}}near.set(k,c);}
  if(c.join(',')!==k){horsPalette.set(file+' '+k,(horsPalette.get(file+' '+k)||0)+1);f.set(c,i);}}return f;};
 const layer=(doc,n)=>doc.layers.find(l=>l.name.trim().toLowerCase()===n);
 for(const e of manifest.fichiers){
  const doc=await piskel.read(path.join(DIR,e.fichier)),{width:w,height:h}=doc,colour=layer(doc,'couleur'),shadow=layer(doc,'ombre'),glow=layer(doc,'lueur');
  if(!colour)throw Error(e.fichier+' : calque « couleur » manquant');
  for(const l of [colour,shadow,glow])if(l)l.frames.forEach(f=>snap(f,e.fichier));
  if(e.role==='sol'){const ht=layer(doc,'hauteur');sols[e.id]={w,h,px:colour.frames[0],ht:ht?ht.frames[0]:null,source:e.fichier};continue;}
  const frames=k=>({couleur:colour.frames[k],ombre:shadow?.frames[k]||null,lueur:glow?.frames[k]||null});
  const base={role:e.role,source:e.fichier,groupe:path.dirname(e.fichier),orientation:e.orientation,w,h,ancre:e.ancre,opacites:{ombre:shadow?.opacity??0,lueur:glow?.opacity??0}};
  const key=n=>e.role==='mur'||e.role==='muret'?e.orientation+'/'+n:e.role==='decors'?'decor/'+n:n;
  if(e.anime)pieces.set(key(e.anime),{...base,nom:e.anime,fps:e.fps,images:colour.frames.map((_,k)=>frames(k))});
  else e.cadres.forEach((n,k)=>pieces.set(key(n),{...base,nom:n,images:[frames(k)]}));
 }
 return {manifest,sols,pieces,horsPalette};
}
module.exports={INTERIEURS,names,load,documents,read,crop,ROOT};
