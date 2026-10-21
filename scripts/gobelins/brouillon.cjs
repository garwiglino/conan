'use strict';
/* Premier jet des sources Piskel des gobelins, depuis les dessins en caractères
 * de dessins.cjs. Une fois écrits, les .piskel sont la source : on les retouche
 * dans piskelapp.com, puis `npm run gobelins`. Ce script n'écrit que les
 * fichiers absents ; --ecraser remplace aussi les fichiers existants.
 *   node scripts/gobelins/brouillon.cjs [--ecraser]
 * Les tenues, coiffes et armes portent en plus un calque REFERENCE (le corps,
 * à demi transparent) pour dessiner en place ; il n'est jamais assemblé. */
const fs=require('node:fs'),path=require('node:path');
const Dd=require('./dessins.cjs'),G=require('./gobelins.cjs'),piskel=require('../environment/piskel.cjs');
const {X0,Y0,W,H,SIZE,VIEWS,COULEURS,FICHIERS}=Dd;
const N4=[[0,1],[0,-1],[1,0],[-1,0]];

function grid(layer,dir){
 const g=Array.from({length:H},()=>Array(W).fill(null));let view=layer.views[dir],mirror=false;
 if(!view&&dir==='gauche'&&layer.views.droite){view=layer.views.droite;mirror=true;}
 if(view)view.rows.forEach((row,k)=>[...row].forEach((ch,i)=>{if(ch==='.'||ch===' ')return;if(!COULEURS[ch])throw Error(layer.name+' / '+dir+' : caractère inconnu « '+ch+' »');if(i>=W||view.at+k>=H)throw Error(layer.name+' / '+dir+' : hors de la fenêtre');g[view.at+k][mirror?W-1-i:i]=ch;}));
 return g;
}
// Empile les calques dans l'ordre du jeu et garde, pour chacun, les pixels qu'il pose
// (remplissage et contour). Composés dans le même ordre, ils redonnent l'image.
function bake(layers){
 const own=new Map(layers.map(l=>[l,VIEWS.map(()=>Array.from({length:H},()=>Array(W).fill(null)))]));
 VIEWS.forEach((dir,v)=>{const out=Array.from({length:H},()=>Array(W).fill(null));
  for(const l of layers){const g=grid(l,dir),mine=own.get(l)[v];
   if(l.masque){g.forEach((r,j)=>r.forEach((c,i)=>{if(c)mine[j][i]=c;}));continue;}
   if(l.auto)for(let j=0;j<H;j++)for(let i=0;i<W;i++)if(!g[j][i]&&(l.auto==='coupe'||!out[j][i])&&N4.some(([a,b])=>g[j+b]?.[i+a]))mine[j][i]='O';
   for(let j=0;j<H;j++)for(let i=0;i<W;i++)if(g[j][i])mine[j][i]=g[j][i];
   for(let j=0;j<H;j++)for(let i=0;i<W;i++)if(mine[j][i])out[j][i]=mine[j][i];}});
 return own;
}
function rgba(cells){const f=new Uint8Array(SIZE*SIZE*4);cells.forEach((r,j)=>r.forEach((c,i)=>{if(!c)return;const h=COULEURS[c],k=((j+Y0)*SIZE+i+X0)*4;f.set([parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16),255],k);}));return f;}
const byRank=list=>list.map((l,k)=>({l,k,r:l.masque?G.rank('COIFFE'):G.rank(l.name)})).sort((a,b)=>a.r-b.r||a.k-b.k).map(x=>x.l);
// Contexte d'un fichier : le corps masculin, et pour une arme, le guerrier casqué.
function context(key){const F=FICHIERS[key];if(F.type==='corps')return [];
 const body=FICHIERS['corps/masculin.piskel'].calques;
 return F.type==='arme'?[...body,...FICHIERS['tenues/guerrier.piskel'].calques,...FICHIERS['coiffes/casque-a-pointes.piskel'].calques.filter(l=>!l.masque)]:body;}
function documentOf(key){
 const F=FICHIERS[key],mine=new Set(F.calques),all=byRank([...context(key),...F.calques]),own=bake(all),layers=[];
 let run=[];const flush=()=>{if(!run.length)return;const frames=VIEWS.map((_,v)=>{const f=new Uint8Array(SIZE*SIZE*4);for(const l of run){const g=rgba(own.get(l)[v]);for(let i=0;i<g.length;i+=4)if(g[i+3])f.set(g.subarray(i,i+4),i);}return f;});
  layers.push({name:'REFERENCE - corps ('+(layers.some(l=>!/^REFERENCE/.test(l.name))?'dessus':'dessous')+', non assemble)',opacity:.35,frames});run=[];};
 for(const l of all){if(!mine.has(l)){run.push(l);continue;}flush();layers.push({name:l.name,opacity:l.masque?.3:1,frames:VIEWS.map((_,v)=>rgba(own.get(l)[v]))});}
 flush();
 return {name:'gobelin-'+key.replace(/\.piskel$/,'').replace('/','-'),description:F.description+' Cadres : face, droite, dos, gauche.',width:SIZE,height:SIZE,fps:2,layers};
}
function palette(){const D=G.data(),rows=Object.entries(COULEURS).filter(([k])=>k!=='X').map(([k,h])=>[h,k]);
 for(const [id,t]of Object.entries(D.teintes))t.couleurs.forEach((h,k)=>rows.push([h,'peau '+id+' '+(k+1)]));
 const seen=new Set();return 'GIMP Palette\nName: gobelins\nColumns: 8\n#\n'+rows.filter(([h])=>!seen.has(h)&&seen.add(h)).map(([h,n])=>[0,2,4].map(i=>String(parseInt(h.slice(i,i+2),16)).padStart(3)).join(' ')+'\t'+n).join('\n')+'\n';}

if(require.main===module)(async()=>{
 const force=process.argv.includes('--ecraser'),todo=Object.keys(FICHIERS).filter(k=>force||!fs.existsSync(path.join(G.ROOT,k)));
 const gpl=path.join(G.ROOT,'palette-gobelins.gpl');if(force||!fs.existsSync(gpl)){fs.writeFileSync(gpl,palette());console.log('écrit : palette-gobelins.gpl');}
 if(!todo.length)return console.log('rien à écrire (--ecraser pour remplacer)');
 await piskel.session(async page=>{for(const key of todo){const text=await piskel.write(page,documentOf(key)),f=path.join(G.ROOT,key);fs.mkdirSync(path.dirname(f),{recursive:true});fs.writeFileSync(f,text);console.log('écrit : '+key);}});
})().catch(e=>{console.error(e);process.exit(1);});
module.exports={bake,documentOf,palette};
