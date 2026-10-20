'use strict';
/* Premier jet des sources Piskel d'un biome, depuis les pinceaux procéduraux.
 * Une fois écrits, les .piskel sont la source : on les retouche dans
 * piskelapp.com puis `npm run build:environment`. Ce script n'écrit que les
 * fichiers absents ; --ecraser remplace aussi les fichiers existants.
 *   node scripts/environment/piskel-draft.cjs [biome…] [--ecraser]
 * Sans biome : tous ceux de biomes.cjs, dans art/environnement/<biome>. */
const fs=require('node:fs'),path=require('node:path');
const P=require('./palette.cjs'),{NAMES,ORDER}=require('./teremor-pieces.cjs'),piskel=require('./piskel.cjs'),biomes=require('./biomes.cjs');
const args=process.argv.slice(2),force=args.includes('--ecraser'),wanted=args.filter(a=>!a.startsWith('--'));
const ROOT=path.join(__dirname,'../../art/environnement');
const RGB=P.hexes.map(h=>h.length===9?null:[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)));
// Grille indexée -> RGBA, recadrée dans un cadre (w, h) au décalage (dx, dy).
function rgba(g,w=g.w,h=g.h,dx=0,dy=0){const out=new Uint8Array(w*h*4);for(let y=0;y<g.h;y++)for(let x=0;x<g.w;x++){const c=RGB[g.px[y*g.w+x]];if(!c)continue;const i=((y+dy)*w+x+dx)*4;out.set(c,i);out[i+3]=255;}return out;}
function heights(g){const out=new Uint8Array(g.w*g.h*4);for(let i=0;i<g.w*g.h;i++){const v=Math.round(Math.max(0,Math.min(1,g.ht[i]))*255);out.set([v,v,v,255],i*4);}return out;}
// Cadres communs à une famille de sprites : même ancre, marges transparentes.
function frame(list){const ax=Math.max(...list.map(s=>s.ax)),ay=Math.max(...list.map(s=>s.ay)),w=ax+Math.max(...list.map(s=>s.w-s.ax)),h=ay+Math.max(...list.map(s=>s.h-s.ay));return {w,h,ax,ay,place:s=>[ax-s.ax,ay-s.ay]};}
const DESCRIPTION={
 texture:'Texture de sol raccordable (bords opposés jointifs). Calque couleur : pixels du jeu. Calque hauteur (gris) : relief de la matière pour les mélanges, sous la couleur.',
 pavage:'Pavage de ville raccordable, posé dans l’axe des rues : joints sur les diagonales 2:1. Cadre 1 rues est-ouest, cadre 2 rues nord-sud. Calque hauteur (gris) : pierres hautes, joints bas.',
 falaise:'Paroi de falaise dépliée : x le long du bord, y la profondeur depuis le sommet. Cadre 1 face éclairée, cadre 2 face à l’ombre.',
 pieces:'Pièces de chemin standard, case de 2 m (losange 64 × 32). Couleurs de référence : sol, bord, bord, cœur. Une pièce par cadre.',
 decors:'Petits décors posés sur le sol de base. Ancre commune dans le cadre.',
 flore:'Sprite debout, pied à l’ancre. Calque ombre : ombre portée (opacité du calque = opacité en jeu). Une variante par cadre.'
};
function documents(id){
 const B=biomes.load(id),G=B.grids(),sets=B.pieces(),D=B.decors(),F=B.sprites(),docs=[],slug=n=>id+'-'+n;
 const manifest={biome:B.nom,global:B.global,palette:'palette-'+id+'.gpl',echelle:'1 px par unité ; une case de 1 m = losange 32 × 16 ; pièces de chemin sur 2 m',niveaux:{},fichiers:[]};
 if(B.accents)manifest.accents=B.accents;if(B.macro)manifest.macro=B.macro;
 for(const [tid,name]of Object.entries(B.sols)){const g=G[tid],withHeight=tid!=='water',layers=[...(withHeight?[{name:'hauteur',frames:[heights(g)]}]:[]),{name:'couleur',frames:[rgba(g)]}];
  docs.push({file:'sols/'+name+'.piskel',doc:{name:slug(name),description:DESCRIPTION.texture,width:g.w,height:g.h,layers}});manifest.fichiers.push({fichier:'sols/'+name+'.piskel',role:'texture',id:tid});}
 for(const [tid,name]of Object.entries(B.pavages)){const list=[G[tid],G[tid+'_v']];
  docs.push({file:'pavages/'+name+'.piskel',doc:{name:slug(name),description:DESCRIPTION.pavage,width:list[0].w,height:list[0].h,fps:2,layers:[{name:'hauteur',frames:list.map(heights)},{name:'couleur',frames:list.map(g=>rgba(g))}]}});
  manifest.fichiers.push({fichier:'pavages/'+name+'.piskel',role:'texture',cadres:[tid,tid+'_v']});}
 docs.push({file:'falaises/paroi.piskel',doc:{name:slug('paroi'),description:DESCRIPTION.falaise,width:G.cliffS.w,height:G.cliffS.h,fps:2,layers:[{name:'couleur',frames:[rgba(G.cliffS),rgba(G.cliffE)]}]}});
 manifest.fichiers.push({fichier:'falaises/paroi.piskel',role:'falaise',cadres:['cliffS','cliffE']});
 B.niveaux.forEach((cols,i)=>{manifest.niveaux[Object.keys(sets)[i]]=cols;});
 manifest.jeux=B.jeux;
 for(const [set,list]of Object.entries(sets)){const byMask=Object.fromEntries(list.map(g=>[g.mask,g]));
  docs.push({file:'chemins/'+set+'.piskel',doc:{name:slug(set),description:DESCRIPTION.pieces,width:64,height:32,fps:2,layers:[{name:'forme',frames:ORDER.map(m=>rgba(byMask[m]))}]}});
  manifest.fichiers.push({fichier:'chemins/'+set+'.piskel',role:'pieces',jeu:set,cadres:ORDER.map(m=>NAMES[m])});}
 {const list=D.map(g=>({g,w:g.w,h:g.h,ax:g.anchor[0],ay:g.anchor[1]})),f=frame(list);
  docs.push({file:'decors/decors-sol.piskel',doc:{name:slug('decors-sol'),description:DESCRIPTION.decors,width:f.w,height:f.h,fps:2,layers:[{name:'couleur',frames:list.map(s=>rgba(s.g,f.w,f.h,...f.place(s)))}]}});
  manifest.fichiers.push({fichier:'decors/decors-sol.piskel',role:'decors',ancre:[f.ax,f.ay],taux:B.decalRate});}
 for(const [fid,names]of Object.entries(B.flore)){const list=names.map(n=>F[n]),f=frame(list);
  docs.push({file:'flore/'+fid+'.piskel',doc:{name:slug(fid),description:DESCRIPTION.flore,width:f.w,height:f.h,fps:2,layers:[{name:'ombre',opacity:B.ombre,frames:list.map(s=>rgba(s.shadow,f.w,f.h,...f.place(s)))},{name:'couleur',frames:list.map(s=>rgba(s.g,f.w,f.h,...f.place(s)))}]}});
  manifest.fichiers.push({fichier:'flore/'+fid+'.piskel',role:'flore',id:fid,ancre:[f.ax,f.ay],cadres:names});}
 return {docs,manifest,name:B.nom};
}
(async()=>{
 for(const id of wanted.length?wanted:biomes.names){
  const DIR=path.join(ROOT,id),{docs,manifest}=documents(id);
  // Les retouches faites dans Piskel sont gardées : seuls les fichiers absents sont écrits.
  const todo=force?docs:docs.filter(d=>!fs.existsSync(path.join(DIR,d.file)));
  const texts=todo.length?await piskel.session(async page=>{const out=[];for(const d of todo)out.push(await piskel.write(page,d.doc));return out;}):[];
  todo.forEach((d,i)=>{const f=path.join(DIR,d.file);fs.mkdirSync(path.dirname(f),{recursive:true});fs.writeFileSync(f,texts[i]);});
  fs.mkdirSync(DIR,{recursive:true});fs.writeFileSync(path.join(DIR,'manifeste.json'),JSON.stringify(manifest,null,1)+'\n');
  // Palette GIMP : Piskel l'importe (Palettes > Import) pour peindre avec les mêmes couleurs.
  fs.writeFileSync(path.join(DIR,manifest.palette),'GIMP Palette\nName: '+id[0].toUpperCase()+id.slice(1)+'\nColumns: 8\n#\n'+P.list.map((c,i)=>RGB[i+1].map(v=>String(v).padStart(3)).join(' ')+'\t'+c.name).join('\n')+'\n');
  console.log(id+' : '+todo.length+' fichiers .piskel écrits ('+(docs.length-todo.length)+' existants gardés) dans '+path.relative(process.cwd(),DIR));
 }
})().catch(e=>{console.error(e.message||e);process.exit(1);});
