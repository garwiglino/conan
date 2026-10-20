'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const I=require('../scripts/environment/interieurs.cjs'),{exportInterieur}=require('../scripts/environment/interieur-kit.cjs'),Scene=require('../scripts/environment/interieur-scene.cjs');
const {gpl}=require('../scripts/environment/frames.cjs');
const kits=new Map(),kitOf=async id=>{if(!kits.has(id))kits.set(id,await I.read(id));return kits.get(id);};

test('every interior has its Piskel sources, its palette and a manifest that lists them',async()=>{
 for(const id of I.names){const dir=path.join(I.ROOT,id),{manifest,horsPalette}=await kitOf(id);
  for(const e of manifest.fichiers)assert.ok(fs.existsSync(path.join(dir,e.fichier)),id+'/'+e.fichier);
  assert.equal(fs.readFileSync(path.join(dir,manifest.palette),'utf8'),gpl(id[0].toUpperCase()+id.slice(1),manifest.rampes),id+' : palette');
  assert.deepEqual([...horsPalette.keys()],[],id+' : couleurs hors palette');}
});
test('the PNG kit of every interior matches its Piskel sources and lists every image',async()=>{
 for(const id of I.names){const files=await exportInterieur(id,await kitOf(id)),dir=path.join(I.ROOT,id,'png');
  for(const [rel,buf]of files)assert.ok(fs.existsSync(path.join(dir,rel))&&fs.readFileSync(path.join(dir,rel)).equals(buf),id+'/png/'+rel+' : npm run kit:environment');
  const catalogue=JSON.parse(files.get('catalogue.json')),listed=new Set();
  for(const s of catalogue.sols){listed.add(s.png);if(s.hauteur)listed.add(s.hauteur);}
  for(const e of catalogue.elements){(e.images||[e.png]).forEach(f=>listed.add(f));for(const l of [e.ombre,e.lueur])if(l)(l.images||[l.png]).forEach(f=>listed.add(f));assert.ok(e.ancre_au_sol,e.nom);}
  for(const rel of files.keys())if(rel!=='catalogue.json')assert.ok(listed.has(rel),rel);
  for(const f of listed)assert.ok(files.has(f),f);}
});
test('wall modules stand on the floor edge of their room cell and low walls run along it',async()=>{
 const {pieces}=await kitOf('forteresse-gobeline'),K=I.load('forteresse-gobeline');
 const opaque=(P,x,y)=>{const X=P.ancre[0]+x,Y=P.ancre[1]+y;return X>=0&&Y>=0&&X<P.w&&Y<P.h&&P.images[0].couleur[(Y*P.w+X)*4+3]>0;};
 for(const o of ['nord','ouest'])for(const nom of [...K.murs,...K.portes,'mur-torche','porte-scellee']){const P=pieces.get(o+'/'+nom),s=o==='nord'?1:-1;
  // Le long du bord : x = ±a, y = a / 2. Le pied du mur est juste au-dessus de la ligne.
  for(const a of [2,30])assert.ok(opaque(P,s*a,a/2-1),o+'/'+nom+' : pied à '+a);
  if(['mur-a','mur-b','mur-c','meurtriere','fenetre','baniere','chaines','levier-haut','levier-bas','mur-torche'].includes(nom))for(const a of [8,16,24])assert.ok(!opaque(P,s*a,a/2),o+'/'+nom+' : rien sur le sol à '+a);}
 for(const o of ['sud','est'])for(const nom of K.murets){const P=pieces.get(o+'/'+nom),s=o==='sud'?1:-1;
  for(const a of [10,16,30])assert.ok(opaque(P,s*a,a/2),o+'/'+nom+' : muret à '+a);
  assert.equal(opaque(P,s*2,-4),nom!=='muret-debut',o+'/'+nom+' : départ (dessus du muret)');}
});
test('the sample room uses only pieces of the kit and keeps the cell in front of an opening free',async()=>{
 const kit=await kitOf('forteresse-gobeline'),scene=Scene.SALLE,out=Scene.compose(kit,scene),{items,cell}=out.layout;
 assert.ok(items.length>50);
 const blocked=new Set((scene.escaliers||[]).map(([i,j])=>i+','+j)),K=I.load('forteresse-gobeline');
 for(const it of items)if(it.edge&&K.portes.includes(it.piece.split('/')[1]))blocked.add(it.edge[0]+','+it.edge[1]);
 for(const [nom,u,v]of scene.objets){const i=Math.floor(u/Scene.CELL),j=Math.floor(v/Scene.CELL);assert.ok(cell(i,j),nom+' hors de la salle');assert.ok(!blocked.has(i+','+j),nom+' devant une ouverture ('+i+', '+j+')');}
 // Le vide reste noir.
 const [x,y]=out.proj(-48,-48);assert.deepEqual([...out.data.subarray((Math.round(y)*out.w+Math.round(x))*4,(Math.round(y)*out.w+Math.round(x))*4+3)],[0,0,0]);
});
