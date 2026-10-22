'use strict';
/* Kit d'alimentation des biomes redessinés, tiré des sources Piskel :
 *  - art/environnement/<biome>/png/ : chaque élément en PNG (sols, pavages,
 *    pièces de chemin, falaises, flore, décors) et catalogue.json ;
 *  - art/environnement/guide/ : planches du guide d'assemblage (grille,
 *    pièces numérotées, disposition des maisons, places et ruelles) ;
 *  - art/environnement/interieurs/<id>/png/ et leurs planches : voir
 *    interieur-kit.cjs.
 *   node scripts/environment/export-kit.cjs [--verifier] */
const fs=require('node:fs'),path=require('node:path'),{createCanvas,loadImage}=require('@napi-rs/canvas');
const piskel=require('./piskel.cjs'),{biomes}=require('./build-environment.cjs'),{NAMES,ORDER}=require('./teremor-pieces.cjs');
const Env=require('../../sprites/environnement/environment-iso.js'),Arch=require('../../sprites/architecture/architecture-isometric.js');
const {compose,hash}=require('./preview-scene.cjs');
const ART=path.join(__dirname,'../../art/environnement'),SPRITES=path.join(__dirname,'../../sprites/environnement');
const P=(u,v)=>({x:u-v,y:(u+v)/2});
const two=n=>String(n).padStart(2,'0'),fileOf=(m)=>two(m)+'-'+NAMES[m];
function png(w,h,rgba){const c=createCanvas(w,h),x=c.getContext('2d'),im=x.createImageData(w,h);im.data.set(rgba);x.putImageData(im,0,0);return c.toBuffer('image/png');}
const grey=(w,h,f)=>{const o=new Uint8Array(w*h*4);for(let i=0;i<w*h;i++){o.set([f[i*4],f[i*4],f[i*4],f[i*4+3]?255:0],i*4);}return o;};
// Recadre un sprite (couleur et ombre) sur ses pixels visibles ; l'ancre suit.
function trim(w,h,[ax,ay],...frames){let x0=w,y0=h,x1=-1,y1=-1;for(const f of frames)for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(f[(y*w+x)*4+3]){x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);}
 if(x1<0)return null;const W=x1-x0+1,H=y1-y0+1;return {w:W,h:H,ancre:[ax-x0,ay-y0],frames:frames.map(f=>{const o=new Uint8Array(W*H*4);for(let y=0;y<H;y++)o.set(f.subarray(((y+y0)*w+x0)*4,((y+y0)*w+x0+W)*4),y*W*4);return o;})};}
const layerOf=(doc,name)=>doc.layers.find(l=>l.name.trim().toLowerCase()===name);
const PAVED={setts:'rangs',flags:'dalles',bricks:'briques',fan:'eventail',hex:'tomettes',cabochon:'cabochons',cobble:'pave'};

/* PNG d'un biome : Map chemin relatif -> octets, et catalogue. */
async function exportBiome(biome){
 const SRC=path.join(ART,biome),manifest=JSON.parse(fs.readFileSync(path.join(SRC,'manifeste.json'),'utf8')),files=new Map(),items=[];
 const data=require(path.join(SPRITES,biome+'-data.js')),E=Env(data);
 const add=(rel,buf,info)=>{files.set(rel,buf);items.push({png:rel,...info});};
 for(const entry of manifest.fichiers){
  const doc=await piskel.read(path.join(SRC,entry.fichier)),{width:w,height:h}=doc,dir=path.dirname(entry.fichier),base=path.basename(entry.fichier,'.piskel'),source=entry.fichier;
  if(entry.role==='texture'){
   const colour=layerOf(doc,'couleur'),ht=layerOf(doc,'hauteur'),ids=entry.cadres||[entry.id];
   ids.forEach((id,k)=>{
    const name=ids.length===1?base:base+(k?'-rues-nord-sud':'-rues-est-ouest'),role=dir==='pavages'?'pavage':'sol';
    add(dir+'/'+name+'.png',png(w,h,colour.frames[k]),{source,role,id,taille:[w,h],usage:role==='pavage'?(k?'rues nord-sud (axe j)':'rues est-ouest (axe i) et places'):'texture raccordable en coordonnées écran'});
    if(ht)add(dir+'/'+name+'-hauteur.png',png(w,h,grey(w,h,ht.frames[k])),{source,role:'hauteur',id,taille:[w,h],usage:'relief de mélange : le pixel le plus haut l’emporte entre deux matières'});
   });
  }else if(entry.role==='falaise'){
   const colour=layerOf(doc,'couleur');
   entry.cadres.forEach((id,k)=>add('falaises/paroi-face-'+(id==='cliffS'?'sud':'est')+'.png',png(w,h,colour.frames[k]),{source,role:'falaise',id,taille:[w,h],usage:id==='cliffS'?'paroi tournée vers le sud (bas-gauche), éclairée':'paroi tournée vers l’est (bas-droite), à l’ombre'}));
  }else if(entry.role==='pieces'){
   const forme=layerOf(doc,'forme');
   entry.cadres.forEach((name,k)=>{const mask=+Object.keys(NAMES).find(m=>NAMES[m]===name);add('chemins/formes/'+entry.jeu+'/'+fileOf(mask)+'.png',png(w,h,forme.frames[k]),{source,role:'forme de pièce',jeu:entry.jeu,masque:mask,taille:[w,h],usage:'niveaux de la pièce (bord, intérieur, cœur) ; la matière du jeu la remplit'});});
  }else if(entry.role==='decors'){
   layerOf(doc,'couleur').frames.forEach((f,k)=>{const t=trim(w,h,entry.ancre,f);if(t)add('decors/decor-'+two(k+1)+'.png',png(t.w,t.h,t.frames[0]),{source,role:'décor au sol',taille:[t.w,t.h],ancre:t.ancre,usage:'peint à plat sur le sol, environ '+Math.round((entry.taux??.08)*100)+' % des cases de sol nu'});});
  }else if(entry.role==='flore'){
   const colour=layerOf(doc,'couleur'),shadow=layerOf(doc,'ombre');
   colour.frames.forEach((f,k)=>{const name=entry.cadres?.[k]||entry.id+'_'+k,t=trim(w,h,entry.ancre,f,shadow?shadow.frames[k]:new Uint8Array(w*h*4));if(!t)return;
    add('flore/'+name+'.png',png(t.w,t.h,t.frames[0]),{source,role:'flore',taille:[t.w,t.h],ancre:t.ancre,usage:'pied (ancre) posé au centre de sa case, trié par profondeur'});
    if(shadow)add('flore/'+name+'-ombre.png',png(t.w,t.h,t.frames[1]),{source,role:'ombre',taille:[t.w,t.h],ancre:t.ancre,opacite:shadow.opacity,usage:'dessinée avant le sprite, à l’opacité indiquée'});});
  }
 }
 // Pièces rendues avec leur matière (aperçu) : un dossier par jeu de chemin.
 for(const [set,info]of Object.entries(data.sets))for(const mask of ORDER){
  const out=E.render({sampler:{tile:()=>({code:0}),piece:(ci,cj)=>ci===0&&cj===0?[{set,mask}]:[]},base:[0,0],screen:[0,0],tiles:[2,2],width:64,height:34,ox:32,oy:1});
  const px=new Uint8Array(64*32*4);for(let y=0;y<32;y++)for(let x=0;x<64;x++){const X=x-32+.5,Y=y+.5,u=Y+X/2,v=Y-X/2;if(u>=0&&v>=0&&u<32&&v<32)px.set(out.data.subarray(((y+1)*64+x)*4,((y+1)*64+x)*4+4),(y*64+x)*4);}
  add('chemins/'+set+'/'+fileOf(mask)+'.png',png(64,32,px),{source:'chemins/'+info.forme+'.piskel',role:'pièce rendue',jeu:set,forme:info.forme,matiere:info.matiere,masque:mask,taille:[64,32],usage:'aperçu de la pièce posée sur le sol de base (case de 2 m)'});
 }
 const catalogue={biome:manifest.biome,palette:'../'+manifest.palette,grille:{case:'1 m = losange 32 × 16 px',piece:'2 m = losange 64 × 32 px',projection:'x = u − v, y = (u + v) / 2 − z ; 16 unités par mètre'},
  masques:{N:1,E:2,S:4,O:8,regle:'masque = somme des côtés reliés ; N = case j − 1 (haut-droite), E = i + 1 (bas-droite), S = j + 1 (bas-gauche), O = i − 1 (haut-gauche)'},
  jeux:data.sets,elements:items};
 files.set('catalogue.json',Buffer.from(JSON.stringify(catalogue,null,1)+'\n'));
 return files;
}

/* Planche 1 : grille, axes et masques des pièces. */
function gridPlate(){
 const S=4,W=1560,H=640,cv=createCanvas(W,H),c=cv.getContext('2d');c.fillStyle='#f4efe3';c.fillRect(0,0,W,H);
 const poly=(pts,fill,stroke,lw=1)=>{c.beginPath();pts.forEach(([x,y],k)=>k?c.lineTo(x,y):c.moveTo(x,y));c.closePath();if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=lw;c.stroke();}};
 const text=(t,x,y,{size=20,colour='#2c2420',bold=false,align='left'}={})=>{c.font=(bold?'bold ':'')+size+'px sans-serif';c.fillStyle=colour;c.textAlign=align;c.fillText(t,x,y);c.textAlign='left';};
 const arrow=(x0,y0,x1,y1,colour)=>{c.strokeStyle=colour;c.fillStyle=colour;c.lineWidth=4;c.beginPath();c.moveTo(x0,y0);c.lineTo(x1,y1);c.stroke();const a=Math.atan2(y1-y0,x1-x0);c.beginPath();c.moveTo(x1,y1);c.lineTo(x1-16*Math.cos(a-.4),y1-16*Math.sin(a-.4));c.lineTo(x1-16*Math.cos(a+.4),y1-16*Math.sin(a+.4));c.closePath();c.fill();};
 // Gauche : grille de 6 × 6 cases de 1 m.
 const ox=400,oy=120,at=(i,j)=>{const p=P(i*16,j*16);return [ox+p.x*3,oy+p.y*3];},tile=(i,j)=>[at(i,j),at(i+1,j),at(i+1,j+1),at(i,j+1)];
 text('Grille : 1 case = 1 m = losange 32 × 16 px',40,48,{size:26,bold:true});
 for(let j=0;j<6;j++)for(let i=0;i<6;i++)poly(tile(i,j),(i+j)%2?'#e3dac4':'#ece5d2','#b8ab8c');
 poly([at(2,2),at(4,2),at(4,4),at(2,4)],'rgba(176,138,90,.45)','#8a5a2b',4);
 poly(tile(0,0),'rgba(70,130,180,.35)','#2f6e9e',3);
 text('case de 1 m (32 × 16)',at(1,0)[0]+20,at(1,0)[1]-2,{size:18,colour:'#2f6e9e',bold:true});
 text('case de 2 m = pièce de chemin (64 × 32)',ox,at(6,6)[1]+44,{size:19,colour:'#8a5a2b',bold:true,align:'center'});
 const o=at(0,0);arrow(o[0],o[1],at(6.6,0)[0],at(6.6,0)[1],'#b04a2f');arrow(o[0],o[1],at(0,6.6)[0],at(0,6.6)[1],'#3c7a3a');
 text('i → est',at(6.6,0)[0]-70,at(6.6,0)[1]+42,{size:20,colour:'#b04a2f',bold:true});text('(bas-droite)',at(6.6,0)[0]-70,at(6.6,0)[1]+66,{size:17,colour:'#b04a2f'});
 text('j → sud',40,at(0,6.6)[1]+42,{size:20,colour:'#3c7a3a',bold:true});text('(bas-gauche)',40,at(0,6.6)[1]+66,{size:17,colour:'#3c7a3a'});
 text('(0, 0) : coin nord',o[0],o[1]-16,{size:16,align:'center'});
 // Droite : masques des voisines d'une case de 2 m.
 const cx=1140,cy=330,R=2*S*16;
 text('Pièces : masque des voisines occupées',880,48,{size:26,bold:true});
 const diamond=([x,y],fill,stroke)=>poly([[x,y-R/2],[x+R,y],[x,y+R/2],[x-R,y]],fill,stroke,3);
 const centre=[cx,cy],nb={N:[cx+R,cy-R/2],E:[cx+R,cy+R/2],S:[cx-R,cy+R/2],O:[cx-R,cy-R/2]};
 for(const p of Object.values(nb))diamond(p,'#e9dfc6','#9c8b66');
 diamond(centre,'rgba(176,138,90,.55)','#8a5a2b');
 const bits={N:'N = 1  (j − 1)',E:'E = 2  (i + 1)',S:'S = 4  (j + 1)',O:'O = 8  (i − 1)'};
 for(const [k,[x,y]]of Object.entries(nb))text(bits[k],x,y+7,{size:20,bold:true,align:'center'});
 text('pièce posée',cx,cy+7,{size:18,align:'center'});
 const lines=['Masque = somme des côtés reliés à une case occupée (route, ruelle ou place).','Exemples : 5 = droite nord-sud, 10 = droite est-ouest, 3 = virage N-E,','15 = croisement, 2 = impasse ouverte vers l’est, 0 = placette isolée.','Fichier : chemins/<jeu>/NN-nom.png, NN = masque.'];
 lines.forEach((t,k)=>text(t,880,520+k*28,{size:19}));
 return cv.toBuffer('image/png');
}

/* Planche 2 : les 16 pièces de chaque jeu, rendues, avec leur masque. */
function piecesPlate(biome){
 const data=require(path.join(SPRITES,biome+'-data.js')),E=Env(data),sets=Object.keys(data.sets),S=3,cw=64*S,ch=32*S,pad=18,lab=26,head=50,cols=16;
 const W=pad+cols*(cw+pad)+150,H=head+sets.length*(ch+lab+pad)+pad,cv=createCanvas(W,H),c=cv.getContext('2d');c.fillStyle='#141b1c';c.fillRect(0,0,W,H);c.imageSmoothingEnabled=false;
 c.fillStyle='#efe4c6';c.font='bold 24px sans-serif';c.fillText(data.biome+' : pièces de chemin (NN = masque, N = 1, E = 2, S = 4, O = 8)',pad,34);
 sets.forEach((set,r)=>{const y=head+r*(ch+lab+pad);c.fillStyle='#efe4c6';c.font='bold 20px sans-serif';c.fillText(set,pad+cols*(cw+pad),y+ch/2+8);
  ORDER.slice().sort((a,b)=>a-b).forEach((mask,k)=>{const out=E.render({sampler:{tile:()=>({code:0}),piece:(ci,cj)=>ci===0&&cj===0?[{set,mask}]:[]},base:[0,0],screen:[0,0],tiles:[2,2],width:64,height:34,ox:32,oy:1});
   const t=createCanvas(64,34),x=t.getContext('2d'),im=x.createImageData(64,34);im.data.set(out.data);x.putImageData(im,0,0);const X=pad+k*(cw+pad);c.drawImage(t,0,1,64,32,X,y,cw,ch);
   c.fillStyle='#cdbf98';c.font='15px sans-serif';c.fillText(two(mask)+' '+NAMES[mask],X,y+ch+18);});});
 return cv.toBuffer('image/png');
}

/* Quartier type : place au centre, rues qui s'arrêtent à son bord, maisons
 * tournées vers la rue ou la place avec une case de marge, flore à l'écart. */
const KITS={
 teremor:{rue:'rangs',ruelle:'chemin',place:'flags',placeNom:'dallage de grès',
  maisons:[['T01','face',1],['H02','face',6],['H01','dos',1],['T03','dos',7],['H03','face',12,'place'],['T04','dos',13,'place'],['H02','face',22],['T02','dos',21]],
  gros:['chene_a','chene_b','chene_c','bouleau_a','bouleau_b','buisson_a','rocher_a'],petits:['fougere','fleurs','champignons','buisson_b'],eau:false},
 sarak:{rue:'rangs',ruelle:'chemin',place:'cabochon',placeNom:'carreaux à cabochons',
  maisons:[['H13','face',1],['T14','face',6],['SAR-C01','dos',1],['T16','dos',6],['H14','face',12,'place'],['T13','dos',13,'place'],['T15','face',22],['H16','dos',21]],
  gros:['rocher_a','rocher_b','rocher_rond','arbre_mort_a','arbre_mort_b','buisson_a','buisson_b'],petits:['touffe_a','touffe_b','cailloux','buisson_b'],eau:true,
  rive:['palmier_a','palmier_b','palmier_a','buisson_a'],riveNom:'palmiers'},
 varan:{rue:'rangs',ruelle:'chemin',place:'flags',placeNom:'dalles moussues',rueNom:'rue en caillebotis',
  maisons:[['T01','face',1],['H02','face',6],['H01','dos',1],['T03','dos',7],['H03','face',12,'place'],['T04','dos',13,'place'],['H02','face',22],['T02','dos',21]],
  gros:['cypres_a','cypres_b','saule_a','chicot','rocher_a','souche'],petits:['roseaux_a','roseaux_b','massettes','fougere','champignons'],eau:true,
  rive:['roseaux_a','massettes','roseaux_b','saule_a','roseaux_a','massettes','roseaux_b','saule_b'],riveNom:'roseaux et saules'}
};
const row=(cj,a,b)=>Array.from({length:b-a+1},(_,k)=>[a+k,cj]),col=(ci,a,b)=>Array.from({length:b-a+1},(_,k)=>[ci,a+k]);
function footprintOf(id,dir){const e=Arch.entry(id),turned=dir==='droite'||dir==='gauche';return {w:(turned?e.depth:e.width)/16,d:(turned?e.width:e.depth)/16,e};}
function district(biome){
 const K=KITS[biome],N=32,code=new Uint8Array(N*N),plaza=new Map(),set=(i,j,c)=>{if(i>=0&&j>=0&&i<N&&j<N)code[j*N+i]=c;},get=(i,j)=>i<0||j<0||i>=N||j>=N?255:code[j*N+i];
 for(let j=12;j<=19;j++)for(let i=12;i<=19;i++){set(i,j,2);plaza.set(i+','+j,K.place);}
 const streets=[[K.rue,[...row(7,0,5),...row(7,10,15)]],[K.ruelle,col(9,0,5)]],owner=new Map();
 for(const [s,cells]of streets)for(const [ci,cj]of cells){owner.set(ci+','+cj,s);for(const [a,b]of [[0,0],[1,0],[0,1],[1,1]])set(ci*2+a,cj*2+b,9);}
 const onPlaza=(ci,cj)=>ci>=6&&ci<=9&&cj>=6&&cj<=9;
 // Masque : voisine occupée par une rue, la place ou le bord de la carte (la rue continue).
 const piece=(ci,cj)=>{const s=owner.get(ci+','+cj);if(!s)return [];let mask=0;for(const [bit,di,dj]of [[1,0,-1],[2,1,0],[4,0,1],[8,-1,0]]){const ni=ci+di,nj=cj+dj;if(ni<0||nj<0||ni>=N/2||nj>=N/2||owner.has(ni+','+nj)||onPlaza(ni,nj))mask|=bit;}return [{set:s,mask}];};
 // Maisons : façade à une case de la rue (nord : porte au sud ; sud : porte au nord) ou de la place.
 const houses=[],rects=[];
 for(const [id,dir,hi,where]of K.maisons){const {w,d,e}=footprintOf(id,dir),north=dir==='face';
  const edge=where==='place'?(north?11:21):(north?13:17),hj=north?Math.floor(edge-d):edge;
  houses.push([id,hi,hj,dir]);rects.push({id,dir,hi,hj,w,d,e});
  for(let j=hj-1;j<Math.ceil(hj+d)+1;j++)for(let i=hi-1;i<Math.ceil(hi+w)+1;i++)if(!get(i,j))set(i,j,9);}
 if(K.eau)for(let j=24;j<=29;j++)for(let i=25;i<=30;i++)if(((i+.5-27.8)/2.9)**2+((j+.5-27)/2.4)**2<1&&!get(i,j))set(i,j,3);
 const nearWater=(i,j)=>{for(let b=-2;b<=2;b++)for(let a=-2;a<=2;a++)if(get(i+a,j+b)===3)return true;return false;};
 for(let j=0;j<N;j++)for(let i=0;i<N;i++){if(get(i,j))continue;const free=[[-1,0],[1,0],[0,-1],[0,1]].every(([a,b])=>{const v=get(i+a,j+b);return v===0||v===4||v===3||v===255;});if(!free)continue;
  if(K.eau&&nearWater(i,j)?hash(i,j,4)<.3:hash(i,j,4)<.08)set(i,j,4);}
 return {N,code,piece,houses,rects,owner,paving:(i,j)=>plaza.get(i+','+j),K};
}
async function dispositionPlate(biome,scratch){
 const M=district(biome),N=M.N,K=M.K,data=require(path.join(SPRITES,biome+'-data.js'));
 const tmp=path.join(scratch,'.disposition-'+biome+'.png');
 const nearWater=(i,j)=>{for(let b=-2;b<=2;b++)for(let a=-2;a<=2;a++)if(M.code[(j+b)*N+i+a]===3)return true;return false;};
 compose(M,tmp,{data,big:(i,j)=>K.eau&&nearWater(i,j)?K.rive:K.gros,small:K.petits,heroes:[[16*16,16*16]]});
 const rendu=await loadImage(tmp);fs.unlinkSync(tmp);
 const w=rendu.width,h=rendu.height,ox=w/2,oy=48,pad=24,head=92,legend=150,W=w*2+pad*3,H=head+h+legend,cv=createCanvas(W,H),c=cv.getContext('2d');
 c.fillStyle='#141b1c';c.fillRect(0,0,W,H);c.imageSmoothingEnabled=false;c.drawImage(rendu,pad,head);
 const X0=pad*2+w,at=(u,v)=>{const p=P(u*16,v*16);return [X0+ox+p.x,head+oy+p.y];};
 const poly=(pts,fill,stroke,lw=1)=>{c.beginPath();pts.forEach(([x,y],k)=>k?c.lineTo(x,y):c.moveTo(x,y));c.closePath();if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=lw;c.stroke();}};
 const rect=(i0,j0,i1,j1)=>[at(i0,j0),at(i1,j0),at(i1,j1),at(i0,j1)];
 const text=(t,x,y,{size=14,colour='#f4efe3',bold=false,align='center'}={})=>{c.font=(bold?'bold ':'')+size+'px sans-serif';c.textAlign=align;c.lineWidth=3;c.strokeStyle='rgba(20,27,28,.85)';c.strokeText(t,x,y);c.fillStyle=colour;c.fillText(t,x,y);c.textAlign='left';};
 const COL={0:'#d8cdb3',2:'#7fa7c4',3:'#3e8fb0',4:'#d8cdb3',9:'#e8c66a'};
 for(let j=0;j<N;j++)for(let i=0;i<N;i++){const v=M.code[j*N+i];poly(rect(i,j,i+1,j+1),COL[v]||'#d8cdb3','rgba(20,27,28,.18)');}
 for(const [k,s]of M.owner){const [ci,cj]=k.split(',').map(Number),mask=M.piece(ci,cj)[0].mask;poly(rect(ci*2,cj*2,ci*2+2,cj*2+2),s===K.rue?'#9b6b3e':'#bf9a68','#5c3b1e',1.5);const [x,y]=at(ci*2+1,cj*2+1);text(String(mask),x,y+5,{size:13,bold:true});}
 for(let j=0;j<N;j++)for(let i=0;i<N;i++)if(M.code[j*N+i]===4){const [x,y]=at(i+.5,j+.5);c.fillStyle='#3f7a35';c.beginPath();c.arc(x,y,5,0,7);c.fill();}
 for(const r of M.rects){poly(rect(r.hi,r.hj,r.hi+r.w,r.hj+r.d),'#5b4840','#2a1f1b',2);
  const f=r.e.entrances?.[0]??.5,south=r.dir==='face',du=south?f*r.w:(1-f)*r.w,dv=south?r.d:0,dw=12/16,dc=(r.e.doorClearance||22)/16,sgn=south?1:-1;
  poly(rect(r.hi+du-dw/2,r.hj+dv,r.hi+du+dw/2,r.hj+dv+sgn*dc),'#d9572f','#7a2a12',1.5);
  const [x,y]=at(r.hi+r.w/2,r.hj+r.d/2),fr=n=>String(n).replace('.',',');text(r.id,x,y-3,{size:14,bold:true});text(fr(r.w)+' × '+fr(r.d)+' m · porte '+(south?'sud':'nord'),x,y+13,{size:12});}
 const [px,py]=at(16,16);text('Place : '+K.placeNom,px,py+6,{size:16,bold:true});
 c.fillStyle='#efe4c6';c.font='bold 26px sans-serif';c.fillText(data.biome+' : disposition type d’un bourg',pad,38);c.font='18px sans-serif';c.fillText('Rendu',pad,head-14);c.fillText('Plan (mêmes cases)',X0,head-14);
 const items=[['#d8cdb3','sol nu (texture de base)'],['#9b6b3e',(K.rueNom||'rue pavée en rangs')+', case de 2 m (chiffre = masque)'],['#bf9a68','ruelle de terre, case de 2 m'],['#7fa7c4','place : un seul pavage, les rues s’y arrêtent'],['#5b4840','emprise d’une maison (catalogue d’architecture)'],['#e8c66a','marge : une case de sol nu autour de chaque maison'],['#d9572f','dégagement devant la porte (22 unités ≈ 1,4 m)'],['#3f7a35','flore : sur les cases libres, loin des rues et des maisons']];
 if(K.eau)items.push(['#3e8fb0','eau : '+K.riveNom+' à 2 m au plus de la rive']);
 items.forEach(([col,label],k)=>{const x=pad+(k%3)*(W/3),y=head+h+30+Math.floor(k/3)*36;c.fillStyle=col;c.fillRect(x,y-16,26,20);c.strokeStyle='#000';c.lineWidth=1;c.strokeRect(x,y-16,26,20);c.fillStyle='#efe4c6';c.font='17px sans-serif';c.fillText(label,x+36,y);});
 return cv.toBuffer('image/png');
}

/* Tout le kit : Map chemin (relatif à art/environnement) -> octets. */
async function kit(scratch=require('node:os').tmpdir()){
 const files=new Map();
 for(const biome of biomes()){for(const [rel,buf]of await exportBiome(biome))files.set(biome+'/png/'+rel,buf);
  files.set('guide/pieces-'+biome+'.png',piecesPlate(biome));files.set('guide/disposition-'+biome+'.png',await dispositionPlate(biome,scratch));}
 files.set('guide/grille.png',gridPlate());
 for(const [rel,buf]of await require('./interieur-kit.cjs').kit())files.set(rel,buf);
 return files;
}
// Fichiers déjà présents dans les dossiers générés (pour retirer ceux qui ne le sont plus).
function existing(){const out=[],walk=d=>{if(!fs.existsSync(d))return;for(const f of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,f.name);f.isDirectory()?walk(p):out.push(path.relative(ART,p));}};for(const b of biomes())walk(path.join(ART,b,'png'));for(const i of require('./interieurs.cjs').names)walk(path.join(ART,'interieurs',i,'png'));walk(path.join(ART,'guide'));return out.filter(f=>!f.endsWith('.md'));}
module.exports={kit,exportBiome,district,KITS};
if(require.main===module)(async()=>{
 const files=await kit(),stale=existing().filter(f=>!files.has(f));
 if(process.argv.includes('--verifier')){let bad=stale.map(f=>'en trop : '+f);for(const [rel,buf]of files){const p=path.join(ART,rel);if(!fs.existsSync(p)||!fs.readFileSync(p).equals(buf))bad.push('à refaire : '+rel);}
  if(bad.length){console.error(bad.slice(0,20).join('\n')+'\nnpm run kit:environment');process.exitCode=1;}else console.log('kit à jour ('+files.size+' fichiers)');return;}
 for(const f of stale)fs.unlinkSync(path.join(ART,f));
 for(const [rel,buf]of files){const p=path.join(ART,rel);fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,buf);}
 console.log(files.size+' fichiers dans art/environnement/<biome>/png, interieurs/<id>/png et guide');
})().catch(e=>{console.error(e);process.exit(1);});
