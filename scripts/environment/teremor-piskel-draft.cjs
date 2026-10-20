'use strict';
/* Premier jet des sources Piskel du biome Teremor, depuis les pinceaux
 * procéduraux. Une fois écrits, les .piskel sont la source : on les retouche
 * dans piskelapp.com puis `npm run build:environment`. Ce script n'écrit que
 * les fichiers absents ; --ecraser remplace aussi les fichiers existants.
 *   node scripts/environment/teremor-piskel-draft.cjs [--ecraser] [dossier] */
const fs=require('node:fs'),path=require('node:path');
const P=require('./palette.cjs'),A=require('./teremor-assets.cjs'),{NAMES,ORDER}=require('./teremor-pieces.cjs'),{decals}=require('./teremor-decals.cjs'),flora=require('./teremor-flora.cjs'),piskel=require('./piskel.cjs');
const args=process.argv.slice(2),force=args.includes('--ecraser'),DIR=path.resolve(args.find(a=>!a.startsWith('--'))||path.join(__dirname,'../../art/environnement/teremor'));
const RGB=P.hexes.map(h=>h.length===9?null:[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)));
// Grille indexée -> RGBA, recadrée dans un cadre (w, h) au décalage (dx, dy).
function rgba(g,w=g.w,h=g.h,dx=0,dy=0){const out=new Uint8Array(w*h*4);for(let y=0;y<g.h;y++)for(let x=0;x<g.w;x++){const c=RGB[g.px[y*g.w+x]];if(!c)continue;const i=((y+dy)*w+x+dx)*4;out.set(c,i);out[i+3]=255;}return out;}
function heights(g){const out=new Uint8Array(g.w*g.h*4);for(let i=0;i<g.w*g.h;i++){const v=Math.round(Math.max(0,Math.min(1,g.ht[i]))*255);out.set([v,v,v,255],i*4);}return out;}
// Cadres communs à une famille de sprites : même ancre, marges transparentes.
function frame(list){const ax=Math.max(...list.map(s=>s.ax)),ay=Math.max(...list.map(s=>s.ay)),w=ax+Math.max(...list.map(s=>s.w-s.ax)),h=ay+Math.max(...list.map(s=>s.h-s.ay));return {w,h,ax,ay,place:s=>[ax-s.ax,ay-s.ay]};}
const FLORE={chene:['chene_a','chene_b','chene_c'],bouleau:['bouleau_a','bouleau_b'],buisson:['buisson_a','buisson_b'],rocher:['rocher_a','rocher_b'],fougere:['fougere'],champignons:['champignons'],fleurs:['fleurs']};
const SOLS={grass:'herbe',dirt:'terre',cobble:'paves',water:'eau',litter:'litiere',bank:'berge',plank:'planches'};
const DESCRIPTION={
 texture:'Texture de sol raccordable (bords opposés jointifs). Calque couleur : pixels du jeu. Calque hauteur (gris) : relief de la matière pour les mélanges, sous la couleur.',
 pavage:'Pavage de ville raccordable, posé dans l’axe des rues : joints sur les diagonales 2:1. Cadre 1 rues est-ouest, cadre 2 rues nord-sud. Calque hauteur (gris) : pierres hautes, joints bas.',
 falaise:'Paroi de falaise dépliée : x le long du bord, y la profondeur depuis le sommet. Cadre 1 face éclairée, cadre 2 face à l’ombre.',
 pieces:'Pièces de chemin standard, case de 2 m (losange 64 × 32). Couleurs de référence : herbe, bord, bord, cœur. Une pièce par cadre.',
 decors:'Petits décors posés sur l’herbe. Ancre commune dans le cadre.',
 flore:'Sprite debout, pied à l’ancre. Calque ombre : ombre portée (opacité du calque = opacité en jeu). Une variante par cadre.'
};
(async()=>{
 const G=A.grids(),sets=A.PIECE_SETS(),D=decals(),F=flora.all(),docs=[],manifest={biome:'Forêt tempérée de Teremor',palette:'palette-teremor.gpl',echelle:'1 px par unité ; une case de 1 m = losange 32 × 16 ; pièces de chemin sur 2 m',niveaux:{},fichiers:[]};
 for(const [id,name]of Object.entries(SOLS)){const g=G[id],withHeight=id!=='water',layers=[...(withHeight?[{name:'hauteur',frames:[heights(g)]}]:[]),{name:'couleur',frames:[rgba(g)]}];
  docs.push({file:'sols/'+name+'.piskel',doc:{name:'teremor-'+name,description:DESCRIPTION.texture,width:g.w,height:g.h,layers}});manifest.fichiers.push({fichier:'sols/'+name+'.piskel',role:'texture',id});}
 for(const [id,name]of Object.entries(A.PAVINGS)){const list=[G[id],G[id+'_v']];
  docs.push({file:'pavages/'+name+'.piskel',doc:{name:'teremor-'+name,description:DESCRIPTION.pavage,width:list[0].w,height:list[0].h,fps:2,layers:[{name:'hauteur',frames:list.map(heights)},{name:'couleur',frames:list.map(g=>rgba(g))}]}});
  manifest.fichiers.push({fichier:'pavages/'+name+'.piskel',role:'texture',cadres:[id,id+'_v']});}
 docs.push({file:'falaises/paroi.piskel',doc:{name:'teremor-paroi',description:DESCRIPTION.falaise,width:G.cliffS.w,height:G.cliffS.h,fps:2,layers:[{name:'couleur',frames:[rgba(G.cliffS),rgba(G.cliffE)]}]}});
 manifest.fichiers.push({fichier:'falaises/paroi.piskel',role:'falaise',cadres:['cliffS','cliffE']});
 A.LEVELS.forEach((cols,i)=>{manifest.niveaux[Object.keys(sets)[i]]=cols;});
 manifest.jeux=A.SETS;
 for(const [set,list]of Object.entries(sets)){const byMask=Object.fromEntries(list.map(g=>[g.mask,g]));
  docs.push({file:'chemins/'+set+'.piskel',doc:{name:'teremor-'+set,description:DESCRIPTION.pieces,width:64,height:32,fps:2,layers:[{name:'forme',frames:ORDER.map(m=>rgba(byMask[m]))}]}});
  manifest.fichiers.push({fichier:'chemins/'+set+'.piskel',role:'pieces',jeu:set,cadres:ORDER.map(m=>NAMES[m])});}
 {const list=D.map(g=>({g,w:g.w,h:g.h,ax:g.anchor[0],ay:g.anchor[1]})),f=frame(list);
  docs.push({file:'decors/decors-sol.piskel',doc:{name:'teremor-decors-sol',description:DESCRIPTION.decors,width:f.w,height:f.h,fps:2,layers:[{name:'couleur',frames:list.map(s=>rgba(s.g,f.w,f.h,...f.place(s)))}]}});
  manifest.fichiers.push({fichier:'decors/decors-sol.piskel',role:'decors',ancre:[f.ax,f.ay],taux:.08});}
 for(const [id,names]of Object.entries(FLORE)){const list=names.map(n=>F[n]),f=frame(list);
  docs.push({file:'flore/'+id+'.piskel',doc:{name:'teremor-'+id,description:DESCRIPTION.flore,width:f.w,height:f.h,fps:2,layers:[{name:'ombre',opacity:.45,frames:list.map(s=>rgba(s.shadow,f.w,f.h,...f.place(s)))},{name:'couleur',frames:list.map(s=>rgba(s.g,f.w,f.h,...f.place(s)))}]}});
  manifest.fichiers.push({fichier:'flore/'+id+'.piskel',role:'flore',id,ancre:[f.ax,f.ay],cadres:names});}
 // Les retouches faites dans Piskel sont gardées : seuls les fichiers absents sont écrits.
 const todo=force?docs:docs.filter(d=>!fs.existsSync(path.join(DIR,d.file)));
 const texts=todo.length?await piskel.session(async page=>{const out=[];for(const d of todo)out.push(await piskel.write(page,d.doc));return out;}):[];
 todo.forEach((d,i)=>{const f=path.join(DIR,d.file);fs.mkdirSync(path.dirname(f),{recursive:true});fs.writeFileSync(f,texts[i]);});
 fs.writeFileSync(path.join(DIR,'manifeste.json'),JSON.stringify(manifest,null,1)+'\n');
 // Palette GIMP : Piskel l'importe (Palettes > Import) pour peindre avec les mêmes couleurs.
 fs.writeFileSync(path.join(DIR,manifest.palette),'GIMP Palette\nName: Teremor\nColumns: 8\n#\n'+P.list.map((c,i)=>RGB[i+1].map(v=>String(v).padStart(3)).join(' ')+'\t'+c.name).join('\n')+'\n');
 console.log(todo.length+' fichiers .piskel écrits ('+(docs.length-todo.length)+' existants gardés) dans '+path.relative(process.cwd(),DIR));
})().catch(e=>{console.error(e.message||e);process.exit(1);});
