'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const I=require('../scripts/environment/interieurs.cjs'),Dj=require('../scripts/environment/donjon.cjs');
const kits=new Map(),kitOf=async id=>{if(!kits.has(id))kits.set(id,await I.read(id));return kits.get(id);};
const floor=(e,i,j)=>{const c=e.plan[j]?.[i];return !!c&&c!=='#';},cellOf=([x,y])=>[Math.floor(x),Math.floor(y)];

test('every dungeon uses only pieces of its kit, on floor cells',async()=>{
 for(const id of Dj.names()){const D=Dj.load(id),kit=await kitOf(D.kit),has=k=>kit.pieces.has(k);
  for(const e of D.etages){const at=e.id+' ';
   assert.ok(e.plan.every(r=>r.length===e.plan[0].length),at+'lignes de même longueur');
   for(const [edge,nom]of Object.entries(e.murs||{})){const [i,j,o]=edge.split(',');assert.ok(floor(e,+i,+j),at+edge+' : pas une case de sol');assert.ok(has((o==='N'?'nord/':'ouest/')+nom),at+edge+' '+nom);}
   for(const [edge,nom]of Object.entries(e.murets||{})){const [i,j,o]=edge.split(',');assert.ok(floor(e,+i,+j)&&!floor(e,+i+(o==='E'),+j+(o==='S')),at+edge+' : muret hors du bord');assert.ok(has((o==='S'?'sud/':'est/')+nom),at+edge+' '+nom);}
   for(const [i,j,o]of e.escaliers||[]){assert.ok(floor(e,i,j),at+'trémie '+i+','+j);assert.ok(has(o==='puits'?'puits':'escalier-descendant-'+o),at+'trémie '+o);}
   for(const [nom,x,y]of e.objets||[]){assert.ok(has(nom),at+nom);assert.ok(floor(e,...cellOf([x,y])),at+nom+' hors du sol');}
   for(const [nom,x,y]of e.decors||[]){assert.ok(has('decor/'+nom),at+nom);assert.ok(floor(e,...cellOf([x,y])),at+'décor '+nom+' hors du sol');}
   for(const p of [...e.gobelins||[],...e.reperes.filter(r=>!r.z).map(r=>r.pos)])assert.ok(floor(e,...cellOf(p)),at+'repère hors du sol '+p);}}
});
test('objects keep openings, stairs and the lift shaft free',()=>{
 const K=I.load('forteresse-gobeline'),open=new Set([...K.portes,'porte-scellee','levier-haut','levier-bas']);
 for(const id of Dj.names())for(const e of Dj.load(id).etages){const blocked=new Set();
  for(const [edge,nom]of Object.entries(e.murs||{}))if(open.has(nom)){const [i,j,o]=edge.split(',').map((v,k)=>k<2?+v:v);blocked.add(i+','+j);
   if(floor(e,i-(o==='O'),j-(o==='N')))blocked.add((i-(o==='O'))+','+(j-(o==='N')));}
  for(const [i,j]of e.escaliers||[])blocked.add(i+','+j);
  for(const [nom,x,y]of e.objets||[])if(nom!=='monte-charge')assert.ok(!blocked.has(cellOf([x,y]).join(',')),e.id+' : '+nom+' devant une ouverture ('+cellOf([x,y])+')');}
});
test('keys, doors, stairs and the lift fit together',()=>{
 for(const id of Dj.names()){const D=Dj.load(id),byId=new Map(D.etages.map(e=>[e.id,e]));
  const doors=D.etages.flatMap(e=>(e.portes||[]).map(p=>({...p,e})));
  for(const k of D.cles){const d=doors.filter(p=>p.cle===k.id);assert.equal(d.length,1,k.nom+' : une porte');assert.equal(d[0].nom,k.ouvre);
   assert.equal(d[0].e.murs[d[0].bord],'porte-verrouillee',k.nom+' : porte verrouillée sur '+d[0].bord);
   assert.ok(byId.get(k.etage).objets.some(([n,x,y])=>n==='cle'&&x===k.pos[0]&&y===k.pos[1])||byId.get(k.etage).objets.some(([n,x,y])=>/coffre/.test(n)&&Math.hypot(x-k.pos[0],y-k.pos[1])<.5),k.nom+' : posée ou dans un coffre');}
  for(const p of doors.filter(p=>p.cle))assert.ok(D.cles.some(k=>k.id===p.cle),p.nom+' : sa clé');
  for(const e of D.etages)for(const l of e.liens||[])if(l.bord){assert.equal(e.murs[l.bord],'escalier-montant',e.id+' '+l.bord);
   const t=byId.get(l.vers);assert.ok(t.escaliers.some(([i,j])=>i===l.arrivee[0]&&j===l.arrivee[1]),e.id+' -> '+l.vers+' : trémie d’arrivée');}
  const M=D.monte_charge;if(M){const [i,j]=M.case;
   for(const s of M.arrets){const e=byId.get(s);assert.ok(floor(e,i,j),s+' : puits sur une case de sol');
    if(s===M.depart)assert.ok(e.objets.some(([n,x,y])=>n==='monte-charge'&&Math.floor(x)===i&&Math.floor(y)===j),s+' : plate-forme au départ');
    else assert.ok(e.escaliers.some(([a,b,o])=>a===i&&b===j&&o==='puits'),s+' : puits');}}
  const n=D.etages.flatMap(e=>e.reperes.map(r=>r.n)).filter(x=>/^\d+$/.test(x)).map(Number).sort((a,b)=>a-b);
  assert.deepEqual(n,n.map((_,k)=>k+1),'étapes numérotées de 1 à '+n.length);}
});
test('every floor cell can be walked to from the stairs or the lift once the doors are open',()=>{
 const K=I.load('forteresse-gobeline'),passes=new Set([...K.portes,'porte-scellee']);
 for(const id of Dj.names()){const D=Dj.load(id);
  for(const e of D.etages){const seen=new Set(),todo=[],add=(i,j)=>{const k=i+','+j;if(floor(e,i,j)&&!seen.has(k)){seen.add(k);todo.push([i,j]);}};
   for(const [i,j]of e.escaliers||[])add(i,j);for(const l of e.liens||[])if(l.bord){const [i,j]=l.bord.split(',').map(Number);add(i,j);}
   if(D.monte_charge?.arrets.includes(e.id))add(...D.monte_charge.case);if(D.depart.etage===e.id)add(...cellOf(D.depart.pos));
   // Un bord entre deux cases de sol est fermé s'il porte un mur qui n'est pas une ouverture.
   const shut=(i,j,o)=>{const m=e.murs?.[i+','+j+','+o];return !!m&&!passes.has(m);};
   while(todo.length){const [i,j]=todo.pop();
    if(!shut(i,j,'N'))add(i,j-1);if(!shut(i,j+1,'N'))add(i,j+1);if(!shut(i,j,'O'))add(i-1,j);if(!shut(i+1,j,'O'))add(i+1,j);}
   e.plan.forEach((r,j)=>[...r].forEach((c,i)=>{if(c!=='#')assert.ok(seen.has(i+','+j),D.id+' / '+e.id+' : case '+i+','+j+' inaccessible');}));}}
});
test('the dungeon plates match the data',async()=>{
 for(const id of Dj.names()){const D=Dj.load(id);for(const [rel,buf]of await Dj.plates(id,await kitOf(D.kit))){const f=path.join(Dj.OUT,rel);
  assert.ok(fs.existsSync(f)&&fs.readFileSync(f).equals(buf),rel+' : npm run donjon:environment');}}
});
