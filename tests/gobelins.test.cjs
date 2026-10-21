'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const G=require('../scripts/gobelins/gobelins.cjs');
let cache;const S=async()=>cache||(cache=await G.sources());
const opaque=(f,i)=>f[i+3]!==0;

test('every goblin source is a 48 × 48 Piskel with face, droite, dos and gauche frames and placed layers',async()=>{
 const src=await S();assert.ok(Object.keys(src).length>=9,'sources dans art/gobelins');
 for(const [key,doc]of Object.entries(src)){assert.equal(doc.width,48,key);assert.equal(doc.height,48,key);
  for(const l of doc.layers){assert.equal(l.frames.length,4,key+' / '+l.name);
   if(!/^REFERENCE|^MASQUE/.test(l.name))assert.doesNotThrow(()=>G.rank(l.name),key+' / '+l.name);
   for(const f of l.frames)for(let i=3;i<f.length;i+=4)assert.ok(f[i]===0||l.opacity<1||f[i]===255,key+' / '+l.name+' : alpha binaire');}
  const kind=key.split('/')[0],names=doc.layers.map(l=>l.name).filter(n=>!/^REFERENCE/.test(n));
  if(kind==='tenues')assert.ok(names.every(n=>/^HABIT 1\d - /.test(n)),key+' : seulement des calques HABIT 10 à 19');
  if(kind==='coiffes')assert.ok(names.some(n=>/^COIFFE 21 - /.test(n))&&names.some(n=>/^MASQUE COIFFE/.test(n)),key+' : COIFFE 21 et son masque');
  if(kind==='armes')assert.ok(names.every(n=>/^ARME - .*\((devant|derriere)\)$/.test(n)),key+' : ARME devant ou derrière');}
});
test('both bodies share the same anatomy, so every outfit fits both',async()=>{
 const src=await S(),a=src['corps/masculin'].layers.filter(l=>/^ANATOMIE/.test(l.name)),b=src['corps/feminin'].layers.filter(l=>/^ANATOMIE/.test(l.name));
 assert.deepEqual(a.map(l=>l.name),b.map(l=>l.name));
 a.forEach((l,k)=>l.frames.forEach((f,v)=>assert.ok(Buffer.from(f).equals(Buffer.from(b[k].frames[v])),l.name+' / '+G.VIEWS[v])));
});
test('every character stands on the anchor in all four views',async()=>{
 const src=await S(),D=G.data();
 for(const p of D.personnages){assert.ok(D.teintes[p.teinte],p.id+' : teinte');
  G.render(src,p,D).views.forEach((f,v)=>{let low=-1,xs=[];for(let y=0;y<48;y++)for(let x=0;x<48;x++)if(opaque(f,(y*48+x)*4)){low=Math.max(low,y);if(y===35)xs.push(x);}
   assert.equal(low,35,p.id+' / '+G.VIEWS[v]+' : pieds sur la rangée 35, juste au-dessus de l’ancre');
   assert.ok(Math.min(...xs)<=24&&Math.max(...xs)>=23,p.id+' / '+G.VIEWS[v]+' : pieds autour de x 24');});}
});
test('a piece taken from another outfit replaces only its slot, and a helmet hides the hair it covers',async()=>{
 const src=await S(),D=G.data(),names=p=>G.assemble(src,p,D).map(l=>l.name);
 const base={corps:'masculin',tenue:'villageois',teinte:'gris-vert'},mixed=names({...base,pieces:{tunic:'guerrier'}});
 assert.ok(mixed.includes('HABIT 12 - Cotte de mailles')&&!mixed.includes('HABIT 12 - Tunique'));
 assert.ok(mixed.includes('HABIT 11 - Braies')&&mixed.includes('HABIT 15 - Ceinture de corde'));
 assert.throws(()=>names({...base,pieces:{tunic:'pagne'}}),/pas de pièce/);
 const hair=p=>G.assemble(src,p,D).find(l=>/^CHEVEUX/.test(l.name)).frames[0].filter((a,i)=>i%4===3&&a).length;
 const fem={corps:'feminin',tenue:'villageois',teinte:'gris-vert'};
 assert.ok(hair({...fem,coiffe:'casque-a-pointes'})<hair(fem),'le casque cache le chignon');
 assert.ok(hair({...fem,coiffe:'capuche'})<hair({...fem,coiffe:'casque-a-pointes'}),'la capuche cache aussi les tresses');
});
test('the goblin plates and exports match the Piskel sources',async()=>{
 for(const [rel,buf]of await G.outputs(await S())){const f=path.join(G.ROOT,rel);assert.ok(fs.existsSync(f)&&fs.readFileSync(f).equals(buf),rel+' : npm run gobelins');}
});
