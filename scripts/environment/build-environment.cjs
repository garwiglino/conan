'use strict';
/* Sources Piskel des biomes -> données du jeu (palette indexée, sans navigateur).
 *   node scripts/environment/build-environment.cjs [biome…] [--verifier]
 * Sans biome : chaque dossier art/environnement/<biome> qui a un manifeste.
 * Sortie : sprites/environnement/<biome>-data.js, global du manifeste.
 * --verifier : échoue si un fichier de données n'est pas à jour. */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const P=require('./palette.cjs'),piskel=require('./piskel.cjs'),{NAMES}=require('./teremor-pieces.cjs');
const ART=path.join(__dirname,'../../art/environnement'),SPRITES=path.join(__dirname,'../../sprites/environnement');
const outOf=biome=>path.join(SPRITES,biome+'-data.js');
const biomes=()=>fs.readdirSync(ART).filter(d=>fs.existsSync(path.join(ART,d,'manifeste.json'))).sort();
// Palette d'un biome : ses rampes seulement (manifeste « rampes »), au plus 255 couleurs.
// Sans liste, les rampes des premiers biomes (celles d'avant les intérieurs).
const FIRST_RAMPS=Object.keys(P.RAMPS).slice(0,Object.keys(P.RAMPS).indexOf('cachot'));
function paletteOf(ramps=FIRST_RAMPS){
 for(const r of ramps)if(!P.RAMPS[r])throw Error('rampe inconnue : '+r);
 const list=P.list.filter(c=>ramps.includes(c.ramp));if(list.length>255)throw Error(list.length+' couleurs : une palette de biome en garde 255 au plus');
 const hexes=['#00000000',...list.map(c=>c.hex)],index=new Map(list.map((c,i)=>[c.name,i+1])),RGB=hexes.map(h=>h.length===9?null:[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)));
 return {list,hexes,RGB,EXACT:new Map(RGB.map((c,i)=>c&&[c.join(','),i]).filter(Boolean)),ramps,id:n=>{const i=index.get(n);if(!i)throw RangeError('couleur '+n+' hors des rampes du biome');return i;}};
}
const MASK=Object.fromEntries(Object.entries(NAMES).map(([m,n])=>[n,+m]));
// Couleur hors palette (retouche) : couleur de palette la plus proche, signalée.
function indexer(pal,file,report){const {RGB,EXACT}=pal;return (r,g,b,a)=>{if(a<128)return 0;const k=r+','+g+','+b;let i=EXACT.get(k);if(i!==undefined)return i;let best=1e9;for(let j=1;j<RGB.length;j++){const c=RGB[j],d=(c[0]-r)**2*.3+(c[1]-g)**2*.59+(c[2]-b)**2*.11;if(d<best){best=d;i=j;}}report.set(file+' '+k,(report.get(file+' '+k)||0)+1);EXACT.set(k,i);return i;};}
const indexed=(f,idx)=>{const out=new Uint8Array(f.length/4);for(let i=0;i<out.length;i++)out[i]=idx(f[i*4],f[i*4+1],f[i*4+2],f[i*4+3]);return out;};
// Suites d'octets répétés : [longueur - 1, valeur]. Gardé seulement s'il est plus court.
function encode(a){const r=[];for(let i=0;i<a.length;){let n=1;while(n<256&&i+n<a.length&&a[i+n]===a[i])n++;r.push(n-1,a[i]);i+=n;}return r.length<a.length?'r:'+Buffer.from(r).toString('base64'):Buffer.from(a).toString('base64');}
const layer=(doc,name,file)=>{const l=doc.layers.find(l=>l.name.trim().toLowerCase()===name);if(!l)throw Error(file+' : calque « '+name+' » manquant (calques : '+doc.layers.map(l=>l.name).join(', ')+')');return l;};
// Recadre un sprite sur ses pixels visibles (couleur et ombre) et déplace l'ancre.
function trim(w,h,ax,ay,...grids){let x0=w,y0=h,x1=-1,y1=-1;for(const g of grids)for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(g[y*w+x]){x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);}
 if(x1<0)return null;const W=x1-x0+1,H=y1-y0+1;return {w:W,h:H,ax:ax-x0,ay:ay-y0,grids:grids.map(g=>{const o=new Uint8Array(W*H);for(let y=0;y<H;y++)o.set(g.subarray((y+y0)*w+x0,(y+y0)*w+x0+W),y*W);return o;})};}
/* draft : {docs: Map fichier -> document, manifest} pour construire sans passer
 * par les fichiers .piskel (atelier, aperçus du premier jet). */
async function build(biome='teremor',draft=null){
 const SRC=path.join(ART,biome),manifest=draft?draft.manifest:JSON.parse(fs.readFileSync(path.join(SRC,'manifeste.json'),'utf8')),report=new Map(),hash=crypto.createHash('sha256'),pal=paletteOf(manifest.rampes);
 const data={biome:manifest.biome,palette:pal.hexes,names:pal.list.map(c=>c.name),toneOf:pal.list.map(c=>[c.ramp,c.tone]),ramps:Object.fromEntries(pal.ramps.map(k=>[k,P.RAMPS[k].length])),textures:{},decals:[],decalRate:.08,pieces:{},levelOf:{},flora:{}};
 // Couleurs d'accent du compositeur et grandes plages du sol, propres au biome.
 for(const n of Object.values(manifest.accents||{}))pal.id(n);if(manifest.accents)data.accents=manifest.accents;if(manifest.macro)data.macro=manifest.macro;
 for(const cols of Object.values(manifest.niveaux))cols.forEach((n,i)=>{if(i)data.levelOf[pal.id(n)]=i/(cols.length-1);});
 for(const entry of manifest.fichiers){
  const file=path.join(SRC,entry.fichier),doc=draft?draft.docs.get(entry.fichier):await piskel.read(file),idx=indexer(pal,entry.fichier,report),{width:w,height:h}=doc;hash.update(entry.fichier);if(!draft)hash.update(fs.readFileSync(file));
  if(entry.role==='texture'){
   if(w%32||h%16)throw Error(entry.fichier+' : '+w+'×'+h+' ; une texture raccordable mesure un multiple de 32 × 16');
   const ht=doc.layers.find(l=>l.name.trim().toLowerCase()==='hauteur'),colour=layer(doc,'couleur',entry.fichier);
   (entry.cadres||[entry.id]).forEach((id,k)=>{if(!colour.frames[k])throw Error(entry.fichier+' : cadre '+(k+1)+' ('+id+') manquant');data.textures[id]={w,h,px:encode(indexed(colour.frames[k],idx)),ht:ht?encode(Uint8Array.from({length:w*h},(_,i)=>ht.frames[k][i*4])):null};});
  }else if(entry.role==='falaise'){const l=layer(doc,'couleur',entry.fichier);entry.cadres.forEach((id,k)=>{data.textures[id]={w,h,px:encode(indexed(l.frames[k],idx)),ht:null};});}
  else if(entry.role==='pieces'){
   if(w!==64||h!==32)throw Error(entry.fichier+' : les pièces mesurent 64 × 32');
   const l=layer(doc,'forme',entry.fichier);data.pieces[entry.jeu]=entry.cadres.map((name,k)=>{if(!(name in MASK))throw Error(entry.fichier+' : pièce inconnue '+name);return {mask:MASK[name],w,h,px:encode(indexed(l.frames[k],idx))};});
  }else if(entry.role==='decors'){
   data.decalRate=entry.taux??data.decalRate;for(const f of layer(doc,'couleur',entry.fichier).frames){const t=trim(w,h,...entry.ancre,indexed(f,idx));if(t)data.decals.push({w:t.w,h:t.h,ax:t.ax,ay:t.ay,px:encode(t.grids[0])});}
  }else if(entry.role==='flore'){
   const colour=layer(doc,'couleur',entry.fichier),shadow=doc.layers.find(l=>l.name.trim().toLowerCase()==='ombre');
   data.flora[entry.id]={shadow:shadow?shadow.opacity:0,frames:colour.frames.map((f,k)=>{const t=trim(w,h,...entry.ancre,indexed(f,idx),shadow?indexed(shadow.frames[k],idx):new Uint8Array(w*h));return t&&{name:entry.cadres?.[k]||entry.id+'_'+k,w:t.w,h:t.h,ax:t.ax,ay:t.ay,px:encode(t.grids[0]),sh:encode(t.grids[1])};}).filter(Boolean)};
  }else throw Error(entry.fichier+' : rôle inconnu '+entry.role);
 }
 for(const need of ['grass','dirt','cobble','water','litter','bank','plank','cliffS','cliffE'])if(!data.textures[need])throw Error('texture '+need+' absente du manifeste');
 data.sets=manifest.jeux||{};for(const [name,set]of Object.entries(data.sets)){if(!data.pieces[set.forme])throw Error('jeu '+name+' : forme '+set.forme+' absente');if(!data.textures[set.matiere])throw Error('jeu '+name+' : matière '+set.matiere+' absente');}
 data.source=hash.digest('hex').slice(0,16);
 const global=manifest.global||'Hearthreaver'+biome[0].toUpperCase()+biome.slice(1);
 return {text:'/* Généré par scripts/environment/build-environment.cjs depuis art/environnement/'+biome+' (.piskel). Ne pas modifier à la main. */\n(function(root,data){if(typeof module===\'object\'&&module.exports)module.exports=data;else root.'+global+'=data;})(globalThis,'+JSON.stringify(data)+');\n',report,out:outOf(biome)};
}
if(require.main===module)(async()=>{
 const wanted=process.argv.slice(2).filter(a=>!a.startsWith('--'));
 for(const biome of wanted.length?wanted:biomes()){const {text,report,out}=await build(biome);
  for(const [k,n]of report)console.warn(biome+' : couleur hors palette '+k+' : '+n+' px ramenés à la plus proche');
  if(process.argv.includes('--verifier')){const now=fs.existsSync(out)&&fs.readFileSync(out,'utf8');if(now!==text){console.error(path.basename(out)+' n’est pas à jour : npm run build:environment');process.exitCode=1;}else console.log(path.basename(out)+' à jour');continue;}
  fs.writeFileSync(out,text);console.log(path.relative(process.cwd(),out)+' : '+(text.length/1024).toFixed(0)+' Kio');}
})().catch(e=>{console.error(e.message||e);process.exit(1);});
module.exports={build,encode,biomes,outOf,paletteOf};
