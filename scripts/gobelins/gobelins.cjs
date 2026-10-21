'use strict';
/* Gobelins : sources Piskel -> personnages assemblés, planches et exports.
 * Les sources sont dans art/gobelins/ : corps/, tenues/, coiffes/, armes/.
 * Chaque fichier a quatre cadres (face, droite, dos, gauche) de 48 × 48, pieds
 * à l'ancre x 24, y 36, et des calques nommés comme ceux des humains :
 * ANATOMIE 10 à 13, 07 Crane, 08 Visage, HABIT 10 à 19, COIFFE 21, MASQUE COIFFE.
 * Un personnage prend le corps d'un sexe, une tenue (dont on peut remplacer
 * une pièce par celle d'une autre tenue), une coiffe, une arme et une teinte.
 *   node scripts/gobelins/gobelins.cjs          refait planches et exports
 *   node scripts/gobelins/gobelins.cjs --verifier  dit seulement ce qui diffère */
const fs=require('node:fs'),path=require('node:path');
const ROOT=path.join(__dirname,'../../art/gobelins'),DATA=path.join(ROOT,'gobelins.json');
const SIZE=48,ANCHOR=[24,36],VIEWS=['face','droite','dos','gauche'];
// Même découpage que les humains (sprites/humains/modularite.js).
const SLOTS={10:'feet',11:'legs',12:'tunic',13:'sleeves',14:'outer',15:'belt',16:'pouch',17:'gloves',18:'collar',19:'cape'};
const SLOT_ORDER=[10,11,12,14,15,16,13,17,18,19];
const SLOT_LABELS={feet:'pieds',legs:'jambes',tunic:'torse',sleeves:'manches',outer:'pans',belt:'ceinture',pouch:'bourse',gloves:'avant-bras',collar:'épaules',cape:'cape'};
const FOLDERS=['corps','tenues','coiffes','armes'];

// Ordre d'empilement : arme de dos, corps, habits, tête, coiffe, oreilles (par-dessus
// la coiffe, qui est fendue pour elles), bijoux, arme en main. null : jamais dessiné.
function rank(name){
 if(/^REFERENCE|^MASQUE/.test(name))return null;
 if(/^ARME.*derriere/.test(name))return 0;
 let m=/^ANATOMIE (\d+)/.exec(name);if(m)return 10+(+m[1])/100;
 m=/^HABIT (\d+)/.exec(name);if(m){const k=SLOT_ORDER.indexOf(+m[1]);if(k<0)throw RangeError('Habit hors des numéros 10 à 19 : '+name);return 20+k;}
 if(/^07 Crane - Oreilles/.test(name))return 60;
 if(/^06 Cou/.test(name))return 40;if(/^07 Crane/.test(name))return 41;if(/^08 Visage/.test(name))return 42;if(/^CHEVEUX/.test(name))return 43;
 if(/^COIFFE/.test(name))return 50;if(/^BIJOUX/.test(name))return 61;if(/^ARME/.test(name))return 70;
 throw RangeError('Calque sans place dans l’empilement : '+name);
}
const sortLayers=list=>list.map((l,k)=>({l,k,r:rank(l.name)})).filter(x=>x.r!==null).sort((a,b)=>a.r-b.r||a.k-b.k).map(x=>x.l);
const slotOf=name=>SLOTS[/^HABIT (\d+)/.exec(name)?.[1]]||null;
const hex=(f,i)=>((f[i]<<16)|(f[i+1]<<8)|f[i+2]).toString(16).padStart(6,'0');

function data(){return JSON.parse(fs.readFileSync(DATA,'utf8'));}
function files(){return FOLDERS.flatMap(d=>fs.existsSync(path.join(ROOT,d))?fs.readdirSync(path.join(ROOT,d)).filter(f=>f.endsWith('.piskel')).sort().map(f=>d+'/'+f.slice(0,-7)):[]);}
// Lit toutes les sources : { 'corps/masculin': {name, layers:[{name, opacity, frames}]}, … }
async function sources(){
 const piskel=require('../environment/piskel.cjs'),out={};
 for(const key of files()){const doc=await piskel.read(path.join(ROOT,key+'.piskel'));
  if(doc.width!==SIZE||doc.height!==SIZE)throw Error(key+' : cadre '+doc.width+'×'+doc.height+' au lieu de 48×48');
  for(const l of doc.layers)if(l.frames.length!==4)throw Error(key+' / '+l.name+' : '+l.frames.length+' cadres au lieu de 4 (face, droite, dos, gauche)');
  out[key]={...doc,layers:doc.layers.map(l=>({...l,src:key}))};}
 return out;
}
function source(S,key){if(!S[key])throw RangeError('Source absente : art/gobelins/'+key+'.piskel');return S[key];}
// Recolore la peau des calques du corps vers une teinte.
function tint(layer,from,to){
 const map=new Map(from.map((c,k)=>[c,to[k]].map(h=>h.toLowerCase())));
 return {...layer,frames:layer.frames.map(f=>{const g=f.slice();for(let i=0;i<g.length;i+=4){if(!g[i+3])continue;const t=map.get(hex(g,i));if(t)g.set([parseInt(t.slice(0,2),16),parseInt(t.slice(2,4),16),parseInt(t.slice(4,6),16)],i);}return g;})};
}
// Calques d'un personnage, dans l'ordre d'empilement, prêts à dessiner.
function assemble(S,p,D=data()){
 const body=source(S,'corps/'+p.corps),teinte=D.teintes[p.teinte||'gris-vert'];
 if(!teinte)throw RangeError('Teinte inconnue : '+p.teinte);
 const layers=body.layers.filter(l=>rank(l.name)!==null).map(l=>tint(l,D.peau_reference,teinte.couleurs));
 const pieces=p.pieces||{},used=new Set();
 for(const k of Object.keys(pieces))if(!Object.values(SLOTS).includes(k))throw RangeError('Pièce inconnue : '+k);
 const tenue=source(S,'tenues/'+p.tenue).layers.filter(l=>/^HABIT/.test(l.name));
 for(const l of tenue){const k=slotOf(l.name);if(Object.hasOwn(pieces,k))continue;layers.push(l);}
 for(const [k,id]of Object.entries(pieces)){if(id===null||used.has(k))continue;used.add(k);
  const got=source(S,'tenues/'+id).layers.filter(l=>slotOf(l.name)===k);if(!got.length)throw RangeError('La tenue '+id+' n’a pas de pièce '+k);layers.push(...got);}
 let mask=null;
 if(p.coiffe){const c=source(S,'coiffes/'+p.coiffe);layers.push(...c.layers.filter(l=>/^COIFFE/.test(l.name)));mask=c.layers.find(l=>/^MASQUE/.test(l.name))||null;}
 if(p.arme)layers.push(...source(S,'armes/'+p.arme).layers.filter(l=>/^ARME/.test(l.name)));
 // Le masque de la coiffe cache les cheveux dessous.
 return sortLayers(layers).map(l=>!mask||!/^CHEVEUX/.test(l.name)?l:{...l,frames:l.frames.map((f,v)=>{const g=f.slice(),m=mask.frames[v];for(let i=3;i<g.length;i+=4)if(m[i])g[i-3]=g[i-2]=g[i-1]=g[i]=0;return g;})});
}
// Cadre RGBA d'une vue (alpha binaire : chaque pixel posé remplace celui du dessous).
function flatten(layers,v){const out=new Uint8Array(SIZE*SIZE*4);for(const l of layers){const f=l.frames[v];for(let i=0;i<f.length;i+=4)if(f[i+3])out.set([f[i],f[i+1],f[i+2],255],i);}return out;}
function render(S,p,D){const L=assemble(S,p,D);return {layers:L,views:VIEWS.map((_,v)=>flatten(L,v))};}

// ---------- Planches ----------
const BG='#17151b',PANEL='#24222a',PAPER='#ece0c4',DIM='#a99f8c',GOLD='#d9b46a';
function canvasOf(w,h){const {createCanvas}=require('@napi-rs/canvas'),c=createCanvas(w,h),x=c.getContext('2d');x.fillStyle=BG;x.fillRect(0,0,w,h);x.imageSmoothingEnabled=false;return [c,x];}
// Dessine un cadre RGBA 48 × 48, recadré sur [x0, y0, w, h], au facteur s.
function blit(c,f,X,Y,s,[x0,y0,w,h]=[0,0,SIZE,SIZE]){for(let y=y0;y<y0+h;y++)for(let x=x0;x<x0+w;x++){const i=(y*SIZE+x)*4;if(!f[i+3])continue;c.fillStyle='rgb('+f[i]+','+f[i+1]+','+f[i+2]+')';c.fillRect(X+(x-x0)*s,Y+(y-y0)*s,s,s);}}
const CROP=[4,10,40,28];
function title(c,t,sub,W){c.fillStyle=PAPER;c.font='bold 26px serif';c.fillText(t,24,40);c.fillStyle=DIM;c.font='15px serif';c.fillText(sub,24,64);}
function label(c,t,x,y,{color=PAPER,size=15,align='left',bold=false}={}){c.save();c.fillStyle=color;c.font=(bold?'bold ':'')+size+'px serif';c.textAlign=align;c.fillText(t,x,y);c.restore();}
// Voisins à la même échelle, ancre commune (pieds en x 24, y 36 du cadre natif).
function neighbours(){
 const R=path.join(__dirname,'../..'),{createCanvas}=require('@napi-rs/canvas'),out=[];
 const S0=require(path.join(R,'sprites/humains/sources-natives.js'));
 const human=new Uint8Array(SIZE*SIZE*4);for(const l of S0.outfits['E01-masculin'].layers){const g=l.views[0];if(!g)continue;g.rows.forEach((row,y)=>[...row].forEach((ch,x)=>{if(ch==='.')return;const X=x+g.x-16,Y=y+g.y-16,h=g.palette[S0.alphabet.indexOf(ch)],i=(Y*SIZE+X)*4;human.set([parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16),255],i);}));}
 out.push(['Humain',human]);
 try{const B=require(path.join(R,'sprites/batraciens/batracien.js')),r=B.raster('idle',2,0),f=new Uint8Array(SIZE*SIZE*4);for(let y=0;y<SIZE;y++)for(let x=0;x<SIZE;x++){const i=((y+16)*80+x+16)*4;if(r.data[i+3])f.set([r.data[i],r.data[i+1],r.data[i+2],255],(y*SIZE+x)*4);}out.push(['Batracien',f]);}catch(e){}
 try{const A=require(path.join(R,'sprites/hommes-singes/homme-singe.js')),cv=createCanvas(SIZE,SIZE),x=cv.getContext('2d');A.draw(x,{dir:'face'});const d=x.getImageData(0,0,SIZE,SIZE).data,f=new Uint8Array(SIZE*SIZE*4);for(let i=0;i<d.length;i+=4)if(d[i+3]>127)f.set([d[i],d[i+1],d[i+2],255],i);out.push(['Homme-singe',f]);}catch(e){}
 return out;
}
const NAMES={'ANATOMIE 10 - Pieds nus':'Pieds','ANATOMIE 11 - Jambes':'Jambes','ANATOMIE 12 - Torse et cou':'Torse','ANATOMIE 13 - Bras et mains':'Bras','07 Crane':'Crâne','08 Visage':'Visage','07 Crane - Oreilles':'Oreilles'};
const short=n=>NAMES[n]||n.replace(/^(HABIT|COIFFE|ARME|CHEVEUX|BIJOUX) (\d+ )?- ?/,'').replace(/ \((devant|derriere)\)$/,'').replace('Spaliere dentelee','Spalière').replace('Casque a pointes','Casque').replace('Cimeterre dentele','Cimeterre').replace('Bottes ferrees','Bottes').replace('Tassettes de fer','Tassettes').replace('Cotte de mailles','Mailles').replace('Manches de mailles','Manches');
function designBase(S,D){
 const hero=D.personnages[0],R=render(S,hero,D),s=6,pw=CROP[2]*s+24,ph=CROP[3]*s+50,W=4*pw+5*16;
 const lineup=[...neighbours(),...D.personnages.filter(p=>['guerrier-kesh','villageoise','gobelin-nu'].includes(p.id)).map(p=>[p.nom,render(S,p,D).views[0]])];
 const layers=R.layers.filter(l=>l.frames[0].some((a,i)=>i%4===3&&a)),cols=Math.min(layers.length,7),LC=[6,11,36,26],rows=Math.ceil(layers.length/cols);
 const H=90+ph+40+40+CROP[3]*5+70+40+rows*(LC[3]*4+44)+20,[cv,c]=canvasOf(W,H);
 title(c,'HEARTHREAVER · GOBELINS · DESIGN DE BASE (proposition)','Piskel · 48 × 48, pieds en x 24, y 36 · calques nommés comme ceux des humains · armure de fer noirci, dans l’esprit des gobelins de la Moria',W);
 let y=90;VIEWS.forEach((v,k)=>{const x=16+k*(pw+16);c.fillStyle=PANEL;c.fillRect(x,y,pw,ph);blit(c,R.views[k],x+12,y+8,s,CROP);label(c,v.toUpperCase(),x+16,y+ph-14);});
 label(c,hero.nom+' : corps masculin, tenue « guerrier », casque à pointes, cimeterre dentelé, teinte gris-vert',16,y+ph+26,{color:DIM});
 y+=ph+40+30;label(c,'MÊME ÉCHELLE ×5 · MÊME ANCRAGE',16,y,{bold:true});y+=10;
 const lw=W/lineup.length;lineup.forEach(([n,f],k)=>{const x=k*lw+(lw-CROP[2]*5)/2;blit(c,f,x,y,5,CROP);label(c,n,k*lw+lw/2,y+CROP[3]*5+22,{align:'center',color:k<3?DIM:PAPER});});
 y+=CROP[3]*5+70;label(c,'CALQUES SÉPARÉS, DANS L’ORDRE D’EMPILEMENT (vue de face)',16,y,{bold:true});y+=14;
 const cw=(W-32)/cols;layers.forEach((l,k)=>{const x=16+(k%cols)*cw,yy=y+Math.floor(k/cols)*(LC[3]*4+44);c.fillStyle=PANEL;c.fillRect(x+4,yy,cw-8,LC[3]*4+8);blit(c,l.frames[0],x+4+(cw-8-LC[2]*4)/2,yy+4,4,LC);label(c,short(l.name),x+cw/2,yy+LC[3]*4+30,{align:'center',size:13,color:/^HABIT|^COIFFE|^ARME/.test(l.name)?GOLD:PAPER});});
 return cv.toBuffer('image/png');
}
function variantes(S,D){
 const s=3,cw=CROP[2]*s,list=D.personnages,W=16+(cw+8)*4+420,rowH=CROP[3]*s+16,teintes=Object.entries(D.teintes);
 const H=90+list.length*rowH+60+CROP[3]*4+60,[cv,c]=canvasOf(W,H);
 title(c,'GOBELINS · TENUES, COIFFES ET TEINTES','Chaque ligne : face, droite, dos, gauche. Les pièces d’une tenue se remplacent une à une, comme chez les humains.',W);
 let y=86;
 for(const p of list){const R=render(S,p,D);R.views.forEach((f,k)=>{c.fillStyle=PANEL;c.fillRect(16+k*(cw+8),y,cw,rowH-8);blit(c,f,16+k*(cw+8),y,s,CROP);});
  const x=16+4*(cw+8)+12;label(c,p.nom,x,y+26,{bold:true});
  const bits=[p.corps,'tenue '+p.tenue+(p.pieces?' + '+Object.entries(p.pieces).map(([k,v])=>v===null?'sans '+SLOT_LABELS[k]:SLOT_LABELS[k]+' '+v).join(', '):''),p.coiffe,p.arme,'peau '+D.teintes[p.teinte].nom.toLowerCase()].filter(Boolean);
  label(c,bits.slice(0,2).join(' · '),x,y+48,{color:DIM,size:13});label(c,bits.slice(2).join(' · '),x,y+66,{color:DIM,size:13});y+=rowH;}
 y+=34;label(c,'TEINTES DE PEAU',16,y,{bold:true});y+=10;
 const base=D.personnages.find(p=>p.id==='gobelin-nu'),tw=(W-32)/teintes.length;
 teintes.forEach(([id,t],k)=>{const f=render(S,{...base,teinte:id},D).views[0],x=16+k*tw;blit(c,f,x+(tw-CROP[2]*4)/2,y,4,CROP);label(c,t.nom,x+tw/2,y+CROP[3]*4+20,{align:'center',bold:true});label(c,t.ou,x+tw/2,y+CROP[3]*4+40,{align:'center',size:13,color:DIM});});
 return cv.toBuffer('image/png');
}
// Bande native 192 × 48 par personnage : face, droite, dos, gauche.
function strip(R){const {createCanvas}=require('@napi-rs/canvas'),cv=createCanvas(SIZE*4,SIZE),c=cv.getContext('2d'),im=c.createImageData(SIZE*4,SIZE);
 R.views.forEach((f,k)=>{for(let y=0;y<SIZE;y++)im.data.set(f.subarray(y*SIZE*4,(y+1)*SIZE*4),(y*SIZE*4+k*SIZE)*4);});c.putImageData(im,0,0);return cv.toBuffer('image/png');}
async function outputs(S){S=S||await sources();const D=data(),out=new Map([['planches/design-base.png',designBase(S,D)],['planches/variantes.png',variantes(S,D)]]);
 for(const p of D.personnages)out.set('exports/'+p.id+'.png',strip(render(S,p,D)));return out;}

if(require.main===module)(async()=>{
 const check=process.argv.includes('--verifier'),out=await outputs();let n=0;
 for(const [rel,buf]of out){const f=path.join(ROOT,rel);if(fs.existsSync(f)&&fs.readFileSync(f).equals(buf))continue;n++;
  if(check){console.log('différent : '+rel);continue;}fs.mkdirSync(path.dirname(f),{recursive:true});fs.writeFileSync(f,buf);console.log('écrit : '+rel);}
 if(check&&n)process.exitCode=1;else if(!n)console.log('à jour');
})().catch(e=>{console.error(e);process.exit(1);});
module.exports={ROOT,SIZE,ANCHOR,VIEWS,SLOTS,SLOT_ORDER,SLOT_LABELS,rank,sortLayers,files,sources,data,assemble,flatten,render,outputs};
