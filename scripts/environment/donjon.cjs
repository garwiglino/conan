'use strict';
/* Donjons assemblés avec le kit d'un intérieur : données dans
 * data/donjons/<id>.json, planches dans art/environnement/donjons/<id>/ :
 *  - etage-<niveau>-<etage>.png : l'étage rendu (×2) tel que le héros le
 *    découvre (pièces fermées dans le noir), ses repères numérotés (chemin
 *    principal), les gobelins prévus et la légende ;
 *  - vue-d-ensemble.png : les étages empilés, escaliers et monte-charge
 *    reliés, et tout le parcours dans l'ordre.
 * Les étages partagent la même grille : une case (i, j) est au même endroit
 * à chaque niveau (le puits du monte-charge, les escaliers).
 *   node scripts/environment/donjon.cjs [id]          écrit les planches
 *   node scripts/environment/donjon.cjs [id] --gif d  écrit aussi dans d les images des aperçus
 *     animés : <etage>-<k>.png (4 images) et revelation-<k>.png (le premier
 *     levier qui ouvre des pièces fermées : elles s'éclairent). */
const fs=require('fs'),path=require('path'),{createCanvas}=require('@napi-rs/canvas');
const I=require('./interieurs.cjs'),Scene=require('./interieur-scene.cjs'),{CELL}=Scene;
const DATA=path.join(__dirname,'../../data/donjons'),OUT=path.join(__dirname,'../../art/environnement/donjons');
const names=()=>fs.readdirSync(DATA).filter(f=>f.endsWith('.json')).map(f=>f.slice(0,-5));
const load=id=>JSON.parse(fs.readFileSync(path.join(DATA,id+'.json'),'utf8'));
// Taille commune de la grille : même projection pour tous les étages.
const grid=D=>({NI:Math.max(...D.etages.map(e=>e.plan[0].length)),NJ:Math.max(...D.etages.map(e=>e.plan.length))});
/* Étage -> scène de interieur-scene (plan complété à la grille commune,
 * positions en unités du monde). */
function scene(D,e,{ouvertes=[],murs={}}={}){const {NI,NJ}=grid(D),u=([n,x,y])=>[n,x*CELL,y*CELL];
 const plan=Array.from({length:NJ},(_,j)=>(e.plan[j]||'').padEnd(NI,'#')),m={...e.murs};for(const k of ouvertes)m[k]=OUVERT[m[k]]||m[k];
 return {plan,murs:{...m,...murs},murets:e.murets,escaliers:e.escaliers,toiles:e.toiles,objets:(e.objets||[]).map(u),decors:(e.decors||[]).map(u)};}
/* Pièces dans le noir. Les cases de sol d'un étage se groupent en pièces :
 * deux cases voisines vont ensemble sauf si leur bord porte un mur, ou une
 * ouverture fermée (D.obscurite.fermetures : porte verrouillée, herse, grille).
 * Au départ, seules les pièces des entrées sont visibles (réveil du héros,
 * arrivée d'escalier) ; une pièce s'éclaire quand une ouverture la relie à une
 * pièce visible, ou quand le héros y entre (monte-charge). ouvertes : bords
 * ouverts. Renvoie {room(i, j) -> n° de pièce ou -1, visibles, count}. */
const OUVERT={'porte-verrouillee':'porte-ouverte','herse':'herse-levee','porte-cellule':'porte-cellule-ouverte'};
function rooms(D,e,ouvertes=[]){
 const shut=new Set(D.obscurite?.fermetures||[]),open=new Set(ouvertes),floor=(i,j)=>{const c=e.plan[j]?.[i];return !!c&&c!=='#';};
 const blocks=(i,j,o)=>{const k=i+','+j+','+o,m=e.murs?.[k];if(!m)return false;if(!Scene.OPENING.test((o==='N'?'nord/':'ouest/')+m))return true;return shut.has(m)&&!open.has(k);};
 const id=new Map();let count=0;
 e.plan.forEach((r,j0)=>[...r].forEach((_,i0)=>{if(!floor(i0,j0)||id.has(i0+','+j0))return;const todo=[[i0,j0]];id.set(i0+','+j0,count);
  while(todo.length){const [i,j]=todo.pop();
   for(const [a,b,edge]of [[i,j-1,[i,j,'N']],[i,j+1,[i,j+1,'N']],[i-1,j,[i,j,'O']],[i+1,j,[i+1,j,'O']]])if(floor(a,b)&&!id.has(a+','+b)&&!blocks(...edge)){id.set(a+','+b,count);todo.push([a,b]);}}
  count++;}));
 const room=(i,j)=>id.get(i+','+j)??-1,entries=(e.escaliers||[]).filter(t=>t[2]!=='puits').map(([i,j])=>[i,j]);
 if(D.depart.etage===e.id)entries.push(D.depart.pos.map(Math.floor));
 return {room,visibles:new Set(entries.map(c=>room(...c))),count};
}
/* Luminosité de chaque case : 1 si sa pièce est visible, sinon
 * D.obscurite.luminosite ; fondu (0 à 1) éclaire peu à peu les pièces que les
 * bords ouvertes viennent de relier (par rapport à avant). */
function obscur(D,e,{ouvertes=[],avant=[],fondu=1}={}){const L=D.obscurite?.luminosite??1;if(L>=1)return null;
 const now=rooms(D,e,ouvertes),then=rooms(D,e,avant);
 return (i,j)=>!now.visibles.has(now.room(i,j))?L:then.visibles.has(then.room(i,j))?1:L+(1-L)*fondu;}
const render=(kit,D,e,{etat=null,...opts}={})=>Scene.compose(kit,scene(D,e,etat||{}),{...opts,obscur:etat?obscur(D,e,etat):null});
// Cadre des pixels non noirs.
function bounds(r){let x0=r.w,y0=r.h,x1=-1,y1=-1;for(let y=0;y<r.h;y++)for(let x=0;x<r.w;x++){const k=(y*r.w+x)*4;if(r.data[k]|r.data[k+1]|r.data[k+2]){if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y;}}return {x0,y0,x1,y1};}
function canvasOf(r,{x0=0,y0=0,w=r.w,h=r.h}={}){const c=createCanvas(w,h),x=c.getContext('2d'),im=x.createImageData(w,h);
 for(let y=0;y<h;y++)for(let xx=0;xx<w;xx++){const s=((y+y0)*r.w+xx+x0)*4,d=(y*w+xx)*4;if(y+y0<0||y+y0>=r.h||xx+x0<0||xx+x0>=r.w){im.data[d+3]=255;continue;}im.data.set(r.data.subarray(s,s+4),d);}x.putImageData(im,0,0);return c;}
const STEP='#f2c14e',OPTION='#7fd0c4',GOBLIN='#d9572f',INK='#1b1a20',PAPER='#efe4c6',DIM='#cdbf98';
const optional=n=>!/^\d+$/.test(n);
function marker(c,x,y,n,{r=15,font=15}={}){c.beginPath();c.arc(x,y,r,0,7);c.fillStyle=optional(n)?OPTION:STEP;c.fill();c.lineWidth=3;c.strokeStyle=INK;c.stroke();
 c.save();c.fillStyle=INK;c.font='bold '+font+'px sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText(n,x,y+1);c.restore();}
function goblin(c,x,y,r=6){c.beginPath();c.arc(x,y,r,0,7);c.fillStyle=GOBLIN;c.fill();c.lineWidth=2;c.strokeStyle=INK;c.stroke();}
function wrap(c,text,w){const out=[];let line='';for(const word of text.split(' ')){const t=line?line+' '+word:word;if(c.measureText(t).width>w&&line){out.push(line);line=word;}else line=t;}if(line)out.push(line);return out;}
const level=n=>n<0?'Niveau −'+(-n):'Niveau '+n;

/* Planche d'un étage : rendu ×2, repères, gobelins, légende dessous. */
function floorPlate(kit,D,e){
 const full=render(kit,D,e),b=bounds(full),r=render(kit,D,e,{etat:{}}),m=16,S=2,x0=b.x0-m,y0=b.y0-m,w=b.x1-b.x0+1+m*2,h=b.y1-b.y0+1+m*2;
 const W=Math.max(w*S,1100),pad=24,head=84,at=([x,y],z=0)=>{const [px,py]=r.proj(x*CELL,y*CELL,z);return [(px-x0)*S+(W-w*S)/2,(py-y0)*S+head];};
 const probe=createCanvas(10,10).getContext('2d');probe.font='17px sans-serif';
 const lines=e.reperes.flatMap(p=>wrap(probe,p.texte,W-pad*2-46).map((t,k)=>({n:k?null:p.n,t})));
 const H=head+h*S+30+lines.length*25+70,cv=createCanvas(W,H),c=cv.getContext('2d');
 c.fillStyle=INK;c.fillRect(0,0,W,H);c.imageSmoothingEnabled=false;
 c.fillStyle=PAPER;c.font='bold 26px sans-serif';c.fillText(D.nom+' · '+level(e.niveau)+' · '+e.nom,pad,38);
 c.fillStyle=DIM;c.font='16px sans-serif';c.fillText('Rendu du kit « '+D.kit+' » (×2), une case = 2 m. État à l’arrivée : les pièces fermées à clé ou par une herse restent dans le noir.',pad,64);
 c.drawImage(canvasOf(r,{x0,y0,w,h}),(W-w*S)/2,head,w*S,h*S);
 for(const g of e.gobelins||[])goblin(c,...at(g),7);
 for(const p of e.reperes)marker(c,...at(p.pos,p.z||0),p.n);
 let y=head+h*S+34;c.font='17px sans-serif';
 for(const l of lines){if(l.n)marker(c,pad+14,y-6,l.n,{r:12,font:13});c.fillStyle=PAPER;c.font='17px sans-serif';c.fillText(l.t,pad+40,y);y+=25;}
 y+=14;c.font='15px sans-serif';marker(c,pad+10,y-5,'1',{r:9,font:11});c.fillStyle=DIM;c.fillText('étape du chemin principal',pad+26,y);
 marker(c,pad+250,y-5,'A',{r:9,font:11});c.fillStyle=DIM;c.fillText('facultatif',pad+266,y);
 goblin(c,pad+372,y-5,6);c.fillStyle=DIM;c.fillText('gobelin prévu (pas encore dessiné)',pad+386,y);
 return cv.toBuffer('image/png');
}

/* Vue d'ensemble : étages empilés (le plus haut en haut) à la même échelle
 * et au même cadrage horizontal, escaliers et monte-charge reliés. */
function overview(kit,D){
 const floors=[...D.etages].sort((a,b)=>b.niveau-a.niveau).map(e=>{const r=render(kit,D,e);return {e,r,b:bounds(r)};});
 const m=12,x0=Math.min(...floors.map(f=>f.b.x0))-m,x1=Math.max(...floors.map(f=>f.b.x1))+m,w=x1-x0+1,pad=24,head=96,label=34,gap=26,side=660;
 let y=head;for(const f of floors){f.y=y+label;f.y0=f.b.y0-m;f.h=f.b.y1-f.b.y0+1+m*2;y=f.y+f.h+gap;}
 const steps=D.etages.flatMap(e=>e.reperes.map(p=>({...p,etage:e}))).sort((a,b)=>optional(a.n)-optional(b.n)||(optional(a.n)?a.n.localeCompare(b.n):a.n-b.n));
 const probe=createCanvas(10,10).getContext('2d');probe.font='16px sans-serif';
 const tag=p=>'niv. '+(p.etage.niveau<0?'−'+(-p.etage.niveau):p.etage.niveau),lines=steps.flatMap(p=>wrap(probe,p.texte,side-120).map((t,k)=>({p:k?null:p,t})));
 const W=pad+w+pad+side,H=Math.max(y,head+60+lines.length*22+steps.length*6+340)+pad,cv=createCanvas(W,H),c=cv.getContext('2d');
 c.fillStyle=INK;c.fillRect(0,0,W,H);c.imageSmoothingEnabled=false;
 c.fillStyle=PAPER;c.font='bold 28px sans-serif';c.fillText(D.nom+' : vue d’ensemble, toutes les pièces éclairées',pad,40);
 c.fillStyle=DIM;c.font='16px sans-serif';c.fillText(wrap(probe,D.resume,W-pad*2)[0],pad,68);c.fillText(wrap(probe,D.resume,W-pad*2).slice(1).join(' '),pad,90);
 const at=(f,[x,y],z=0)=>{const [px,py]=f.r.proj(x*CELL,y*CELL,z);return [pad+px-x0,f.y+py-f.y0];},byId=new Map(floors.map(f=>[f.e.id,f]));
 for(const f of floors){c.fillStyle=STEP;c.font='bold 20px sans-serif';c.fillText(level(f.e.niveau)+' · '+f.e.nom,pad,f.y-10);c.drawImage(canvasOf(f.r,{x0,y0:f.y0,w,h:f.h}),pad,f.y);}
 // Liaisons : escaliers (pointillés dorés), monte-charge (pointillés violets).
 c.setLineDash([7,6]);c.lineWidth=3;
 for(const f of floors)for(const l of f.e.liens||[])if(l.bord&&l.arrivee){const t=byId.get(l.vers),[i,j]=l.bord.split(',').map(Number),[ai,aj]=l.arrivee;
  c.strokeStyle=STEP;c.beginPath();c.moveTo(...at(f,[i+.5,j+.5],24));c.lineTo(...at(t,[ai+.5,aj+.5]));c.stroke();}
 if(D.monte_charge){const [i,j]=D.monte_charge.case,stops=D.monte_charge.arrets.map(id=>byId.get(id)).sort((a,b)=>a.y-b.y);c.strokeStyle='#b48ae6';c.beginPath();
  c.moveTo(...at(stops[0],[i+.5,j+.5],40));c.lineTo(...at(stops[stops.length-1],[i+.5,j+.5]));c.stroke();}
 c.setLineDash([]);
 for(const f of floors){for(const g of f.e.gobelins||[])goblin(c,...at(f,g),4);for(const p of f.e.reperes)marker(c,...at(f,p.pos,p.z||0),p.n,{r:11,font:12});}
 // Parcours.
 const X=pad+w+pad;let yy=head+8;c.fillStyle=STEP;c.font='bold 21px sans-serif';c.fillText('Le parcours',X,yy);yy+=30;
 for(const l of lines){if(l.p){yy+=6;marker(c,X+12,yy-6,l.p.n,{r:11,font:12});c.fillStyle=DIM;c.font='14px sans-serif';c.fillText(tag(l.p),X+30,yy);}
  c.fillStyle=PAPER;c.font='16px sans-serif';c.fillText(l.t,X+90,yy);yy+=22;}
 yy+=24;c.fillStyle=STEP;c.font='bold 18px sans-serif';c.fillText('Clés (même objet, seul le nom change)',X,yy);yy+=26;c.font='16px sans-serif';
 for(const k of D.cles){c.fillStyle=PAPER;c.fillText(k.nom+' → '+k.ouvre+' ('+k.ou+')',X,yy);yy+=22;}
 yy+=18;c.fillStyle=STEP;c.font='bold 18px sans-serif';c.fillText('Lieu',X,yy);yy+=26;c.font='16px sans-serif';c.fillStyle=PAPER;
 for(const t of wrap(c,D.lieu.territoire+', '+D.lieu.zone+', près de '+D.lieu.region.nom+' (x '+D.lieu.monde.x+' m, y '+D.lieu.monde.y+' m). '+D.lieu.note,side-20)){c.fillText(t,X,yy);yy+=22;}
 yy+=18;c.font='15px sans-serif';c.setLineDash([7,6]);c.lineWidth=3;
 c.strokeStyle=STEP;c.beginPath();c.moveTo(X,yy-5);c.lineTo(X+40,yy-5);c.stroke();c.fillStyle=DIM;c.fillText('escalier',X+50,yy);
 c.strokeStyle='#b48ae6';c.beginPath();c.moveTo(X+140,yy-5);c.lineTo(X+180,yy-5);c.stroke();c.fillText('monte-charge',X+190,yy);c.setLineDash([]);
 goblin(c,X+320,yy-5,5);c.fillText('gobelin prévu',X+332,yy);
 return cv.toBuffer('image/png');
}

/* Planches d'un donjon : Map chemin (relatif à art/environnement/donjons) -> octets. */
async function plates(id,kit){
 const D=load(id);kit=kit||await I.read(D.kit);const files=new Map();
 for(const e of D.etages)files.set(id+'/etage-'+(e.niveau<0?'m'+(-e.niveau):e.niveau)+'-'+e.id+'.png',floorPlate(kit,D,e));
 files.set(id+'/vue-d-ensemble.png',overview(kit,D));
 return files;
}
module.exports={names,load,grid,scene,rooms,obscur,render,bounds,plates,OUVERT,DATA,OUT};

if(require.main===module)(async()=>{
 const args=process.argv.slice(2),gif=args.indexOf('--gif'),ids=args.filter((a,k)=>!a.startsWith('--')&&k!==gif+1);
 for(const id of ids.length?ids:names()){const D=load(id),kit=await I.read(D.kit);
  for(const [rel,buf]of await plates(id,kit)){const f=path.join(OUT,rel);fs.mkdirSync(path.dirname(f),{recursive:true});fs.writeFileSync(f,buf);console.log(path.relative(process.cwd(),f));}
  if(gif>=0){const dir=args[gif+1],m=12,crop=r=>{const b=bounds(render(kit,D,r.e));return {x0:b.x0-m,y0:b.y0-m,w:b.x1-b.x0+1+m*2,h:b.y1-b.y0+1+m*2};};fs.mkdirSync(dir,{recursive:true});
   const save=(name,r,box)=>fs.writeFileSync(path.join(dir,name+'.png'),canvasOf(r,box).toBuffer('image/png'));
   for(const e of D.etages){const box=crop({e});for(let k=0;k<4;k++)save(e.id+'-'+k,render(kit,D,e,{image:k,etat:{}}),box);}
   const e=D.etages.find(x=>(x.mecanismes||[]).some(q=>q.bord&&q.ouvre)),lever=e.mecanismes.find(q=>q.bord&&q.ouvre),box=crop({e});
   for(let k=0;k<18;k++){const etat=k<6?{}:{ouvertes:lever.ouvre,fondu:Math.min(1,(k-5)/5),murs:{[lever.bord]:'levier-bas'}};save('revelation-'+k,render(kit,D,e,{image:k,etat}),box);}}}
})();
