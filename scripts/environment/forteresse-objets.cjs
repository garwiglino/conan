'use strict';
/* Forteresse gobeline : objets posés dans les salles (piliers, ruines,
 * brasero, mobilier et trophées gobelins), petits décors au sol et lueurs.
 * Même procédé que les murs : volumes en voxels teintés par face, puis
 * quelques détails peints à la main (crânes, os, flammes, toiles). L'ancre
 * de chaque objet est le centre de son pied, au sol. */
const {rng,Grid,stamp}=require('./brushes.cjs'),{Model,render,tone}=require('./voxel.cjs');
const mod=(a,n)=>((a%n)+n)%n;
const W=require('./forteresse-murs.cjs'),{shader,bake,hash,pixel,rubble,glowRing,H}=W;
// Ombre de contact : ellipse sur le sol autour du pied (calque ombre).
function contact(s,M,rx,ry,{dx=1,dy=1}={}){
 for(let py=0;py<s.h;py++)for(let px=0;px<s.w;px++){const X=px-s.ax+.5,Y=py-s.ay+.5,u=Y+X/2,v=Y-X/2,[a,b]=M.turn?[v,u]:[u,v],d=((a-dx)/rx)**2+((b-dy)/ry)**2;if(d<1)s.shadow.set(px,py,d<.55?'cachot0':'cachot1');}
}
// Lueur au sol d'un foyer : disque, trois anneaux.
function pool(s,M,r){if(!s.glow)s.glow=new Grid(s.w,s.h);s.glowKind='torche';
 for(let py=0;py<s.h;py++)for(let px=0;px<s.w;px++){const X=px-s.ax+.5,Y=py-s.ay+.5,u=Y+X/2,v=Y-X/2,d=Math.hypot(u,v)/r;if(d<1){const c=glowRing(d,px,py);if(c)s.glow.set(px,py,c);}}}
// Grandes flammes de brasero, 4 images (9 × 12).
const FIRE=[
 ['....r....','...r.....','...rr..r.','..ryr..r.','..ryyr.rr','.rywyrryr','.rywwyryr','rywwcwyyr','rywccwwyr','ryccccwyr','.ywccwyy.','..oyyoo..'],
 ['.....r...','....r....','.r..rr...','.r.ryr...','rr.ryyr..','ryrrywyr.','ryrywwyr.','ryywcwwyr','rywwccwyr','rywccccyr','.yywccwy.','..ooyyo..'],
 ['....r....','....rr...','.r..ryr..','.rr.ryr..','.ryrryyr.','ryyrywyr.','rywyywwyr','rywwccwyr','rywccccwr','ryccccwyr','.ywccwwy.','..oyyyo..'],
 ['...r.....','..rr..r..','..ryr.r..','.ryyr.rr.','.ryyrryr.','rywyrywr.','rywwyywyr','ryccwwwyr','rywccccyr','rywcccwyr','.yywccyy.','..ooyyo..']
];
const FIRE_MAP={r:'torche3',y:'torche5',w:'torche6',c:'torche7',o:'torche2'};
// Crâne vu de trois quarts, os, toile : petits tampons peints.
const SKULL=['.aaaa.','abbbba','bc.bcb','bbbbbb','.d.d..'],SKULL_MAP={a:'bouleau5',b:'bouleau4',c:'cachot0',d:'bouleau3','.':null};
const put=(s,M,[a,b,z],art,map)=>{const [x,y]=pixel(s,M,a,b,z);stamp(s.g,x-Math.floor(art[0].length/2),y-art.length+1,art,map);};
/* Objets : (M, o) -> void ; o reçoit la teinte, l'ombre {rx, ry}, la
 * lumière {src, r, pool} et les tampons {at, art, map}. */
const OBJECTS={
 'pilier-carre':(M,o)=>{M.box(-7,-7,0,7,7,3,'socle');M.box(-5,-5,3,5,5,44,'pierre');M.box(-7,-7,44,7,7,48,'socle');o.socleTop=2;o.capTop=true;o.shadow=[9,9];},
 'pilier-rond':(M,o)=>{M.box(-7,-7,0,7,7,3,'socle');M.cylinder(0,0,5.2,3,44,'pierre');M.box(-7,-7,44,7,7,48,'socle');o.socleTop=2;o.shadow=[9,9];},
 'pilier-brise':(M,o)=>{M.box(-7,-7,0,7,7,3,'socle');
  M.shape((a,b,z)=>{const ang=Math.atan2(b,a),top=15+Math.floor(4*hash(Math.floor((ang+4)*2.2),3));return a*a+b*b<=5.2*5.2&&z<top?'pierre':undefined;},[-6,-6,3,6,6,22]);
  // Tambour tombé, couché le long de a.
  M.shape((a,b,z)=>(b-9)**2+(z-4.5)**2<=4.6*4.6?'pierre':undefined,[6,4,0,16,14,10]);
  rubble(M,71,{a0:-10,a1:10,b0:-2,b1:10,n:7,big:2});o.shadow=[13,11];o.capTop=false;},
 'eboulis':(M,o)=>{rubble(M,81,{a0:-12,a1:12,b0:-9,b1:9,n:26,big:5});o.shadow=[14,11];},
 'blocs':(M,o)=>{M.box(-10,-6,0,2,2,7,'pierre');M.box(-1,1,0,9,8,6,'pierre');M.box(-6,-2,7,1,3,11,'pierre');rubble(M,91,{a0:-12,a1:10,b0:-8,b1:10,n:6,big:1.5});o.shadow=[13,10];},
 'brasero':(M,o)=>{
  for(const [a,b]of [[-4,-3],[4,-3],[0,5]])for(let z=0;z<10;z++)M.set(Math.round(a*(1-z/14)),Math.round(b*(1-z/14)),z,'fer');
  M.shape((a,b,z)=>{const r=Math.hypot(a,b);return z<14&&r<=4+(z-9)*.8&&r>=0?'fer':undefined;},[-8,-8,9,8,8,14]);
  M.cylinder(0,0,4.6,13,14,'braise');
  o.light={src:[0,0,20],r:26,pool:20};o.fire=[0,0,14];o.shadow=[7,6];o.rust=.15;},
 'totem':(M,o)=>{M.box(-1,-1,0,2,2,38,'bois');M.box(-6,-1,32,7,1,34,'bois');
  for(const [a,len]of [[-5,9],[-3,6],[4,8],[6,11]])M.box(a,1,33-len,a+1,2,33,'tissu');
  rubble(M,95,{a0:-5,a1:5,b0:-5,b1:5,n:6,big:2});o.stamps=[[[0,2,30],SKULL,SKULL_MAP],[[0,2,23],SKULL,SKULL_MAP],[[0,2,41],['a...a','ab.ba','.abbb','.bcbc','..bbb'],{a:'bouleau5',b:'bouleau4',c:'cachot0','.':null}]];o.shadow=[6,6];},
 'etendard':(M,o)=>{M.box(-1,-1,0,1,1,44,'bois');M.box(-7,0,40,8,2,42,'bois');
  M.shape((a,b,z)=>{const bot=16+[0,2,4,2,0,1,3,5,3,1,0,2,4,2][Math.floor(a+7)]||16;return z>=bot&&z<40?'tissu':undefined;},[-6,1,10,7,2,40]);
  o.sigil=(a,z)=>{const g=['.xxxx.','xxxxxx','x..x.x','xx.xxx','.xxxx.','.x.x..'],r=g[35-z],c=r&&r[a+3];if(c==='x')return ['bouleau',3];return null;};o.shadow=[5,4];},
 'cage':(M,o)=>{M.box(-8,-8,0,8,8,1,'fer');M.box(-8,-8,25,8,8,26,'fer');M.box(-1,-1,26,1,1,30,'fer');
  M.shape((a,b,z)=>{const e=Math.abs(a)>7||Math.abs(b)>7,fa=Math.floor(a),fb=Math.floor(b);return e&&(((fa+8)%3===0&&Math.abs(b)>7)||((fb+8)%3===0&&Math.abs(a)>7)||Math.floor(z)===12)?'barreau':undefined;},[-8,-8,1,8,8,25]);
  M.box(-3,-2,1,4,0,2,'os');M.box(-1,1,1,1,4,2,'os');o.stamps=[[[1,-2,5],SKULL,SKULL_MAP]];o.rust=.2;o.shadow=[10,10];},
 'caisse':(M,o)=>{M.box(-6,-6,0,6,6,10,'bois');o.crate=[[-6,-6,0,6,6,10]];o.shadow=[8,8];},
 'caisses':(M,o)=>{M.box(-9,-6,0,3,6,10,'bois');M.box(3,-4,0,11,4,8,'bois');M.box(-7,-4,10,1,4,17,'bois');o.crate=[[-9,-6,0,3,6,10],[3,-4,0,11,4,8],[-7,-4,10,1,4,17]];o.shadow=[13,9];},
 'tonneau':(M,o)=>{M.shape((a,b,z)=>{const r=5.2+Math.sin(Math.PI*z/14)*1.1;return a*a+b*b<=r*r?(z===2||z===3||z===10||z===11?'fer':'bois'):undefined;},[-7,-7,0,7,7,14]);o.barrel=true;o.shadow=[8,8];},
 'coffre':(M,o)=>{chest(M,o);o.shadow=[10,7];},
 'coffre-verrouille':(M,o)=>{chest(M,o);o.padlock=[0,5,7];o.shadow=[10,7];},
 'coffre-ouvert':(M,o)=>{chest(M,o,{open:true});o.shadow=[10,7];},
 'paillasse':(M,o)=>{M.shape((a,b,z)=>(a/11)**2+(b/6)**2+(z/3.4)**2<=1?'paille':undefined,[-12,-7,0,12,7,4]);
  M.shape((a,b,z)=>a>-1&&(a/11)**2+(b/6.4)**2+(z/3.9)**2<=1&&(a/11)**2+(b/6)**2+(z/3.4)**2>.7?'cuir':undefined,[-1,-7,0,12,8,5]);o.shadow=[13,8];},
 'table':(M,o)=>{for(const [a,b]of [[-8,-4],[7,-4],[-8,3],[7,3]])M.box(a,b,0,a+1,b+1,9,'bois');M.box(-10,-6,9,10,6,11,'bois');
  M.cylinder(-4,-1,1.6,11,14,'fer');M.box(3,-2,11,8,1,12,'os');M.cylinder(2,3,2.3,11,12,'bois');o.shadow=[12,8];},
 'ratelier':(M,o)=>{M.box(-9,-1,0,-7,1,22,'bois');M.box(7,-1,0,9,1,22,'bois');M.box(-9,-1,18,9,1,20,'bois');M.box(-9,-1,4,9,1,6,'bois');
  for(const a of [-5,-1,3]){M.box(a,1,1,a+1,2,26,'bois');M.box(a,1,26,a+1,2,30,'barreau');}
  M.box(5,1,1,6,2,20,'bois');M.box(4,1,15,8,2,20,'fer');o.shadow=[11,5];},
 'marmite':(M,o)=>{rubble(M,97,{a0:-8,a1:8,b0:-8,b1:8,n:8,big:1.5});M.cylinder(0,0,3.5,0,2,'braise');
  M.shape((a,b,z)=>{const r=Math.sqrt(Math.max(0,49-(z-9)**2));return z>=3&&z<12&&a*a+b*b<=Math.min(r,6.5)**2?'fer':undefined;},[-8,-8,3,8,8,12]);
  M.cylinder(0,0,5.4,11,12,'gelee');o.light={src:[0,0,4],r:16,pool:14};o.shadow=[8,8];},
 'tresor':(M,o)=>{M.shape((a,b,z)=>(a/8)**2+(b/6)**2+(z/4)**2<=1?'or':undefined,[-9,-7,0,9,7,5]);M.cylinder(3,-1,1.6,3,8,'or');o.shadow=[10,8];},
 // Trône du chef : estrade de pierre, siège de planches couvert d'une peau, dossier hérissé de cornes et de crânes.
 'trone':(M,o)=>{M.box(-15,-13,0,15,13,3,'pierre');M.box(-9,-7,3,9,7,11,'bois');M.box(-8,-6,11,8,6,12,'cuir');
  M.box(-10,-9,3,10,-6,36,'bois');for(const a of [-11,9])M.box(a,-8,3,a+2,6,18,'bois');
  for(const [a,h]of [[-9,46],[-4,42],[3,42],[8,46]])M.shape((x,b,z)=>Math.hypot(x+.5-a,b+.5+7.5)<=1.4*(1-(z-36)/(h-36))&&z>=36&&z<h?'os':undefined,[a-2,-10,36,a+2,-5,h]);
  o.stamps=[[[0,-6,33],SKULL,SKULL_MAP],[[-6,-6,25],SKULL,SKULL_MAP],[[6,-6,25],SKULL,SKULL_MAP]];o.shadow=[17,15];o.capTop=true;},
 // Cage de la fée : suspendue à une chaîne, barreaux ronds, la fée luit dedans (animée).
 'cage-fee':(M,o)=>{for(let z=38;z<52;z++)if(z%3!==1)M.set(0,0,z,'fer');else{M.set(-1,0,z,'fer');M.set(1,0,z,'fer');}
  M.shape((a,b,z)=>{const r=Math.hypot(a+.5,b+.5),top=z>=32?Math.sqrt(Math.max(0,1-((z-31.5)/6)**2))*8.4:8.4;
   if(z===10||z===11)return r<=8.4?'fer':undefined;if(z===21&&r<=8.4&&r>7.2)return 'fer';
   const f=mod(Math.atan2(b+.5,a+.5)*7/Math.PI,1);return z>11&&z<38&&r<=top&&r>top-1.3&&(f<.24||(z>=32&&r<2))?'barreau':undefined;},[-9,-9,10,9,9,38]);
  M.cylinder(0,0,2,37,39,'fer');o.fairy=[0,0,22];o.shadow=[9,8];o.glowArcane=20;o.rust=.1;},
 // Clé : la même pour toutes les portes (seul le nom change), couchée au sol.
 'cle':(M,o)=>{M.shape((a,b,z)=>{const r=Math.hypot(a+.5+5,b+.5);return (r<=3.4&&r>=1.7)||(a>=-2&&a<7&&b>=0&&b<1)||(a>=4&&a<7&&b>=1&&b<4&&!(a===5&&b===2))?'or':undefined;},[-9,-4,0,7,4,2]);o.shadow=[7,4];o.glint=[-6,-2,2];},
 // Treuil du monte-charge : bâti de bois, tambour, chaîne enroulée, manivelle.
 'treuil':(M,o)=>{for(const a of [-8,6])M.box(a,-4,0,a+2,4,14,'bois');M.box(-8,-5,0,8,5,2,'bois');
  M.shape((a,b,z)=>Math.hypot(b+.5,z+.5-10)<=3.6&&a>=-6&&a<6?(mod(a,2)===0?'fer':'bois'):undefined,[-6,-5,5,6,5,15]);
  M.box(8,-1,9,10,1,11,'fer');M.box(9,-1,9,10,7,11,'fer');M.box(9,6,4,10,7,11,'bois');o.shadow=[11,7];o.rust=.2;},
 // Dalles de pression : levée (rune gravée) ou enfoncée.
 'dalle-pression':(M,o)=>{M.box(-7,-7,0,7,7,2,'pierre');o.rune=true;o.shadow=[9,9];o.capTop=true;},
 'dalle-pression-enfoncee':(M,o)=>{M.box(-7,-7,0,7,7,1,'pierre');o.rune=true;o.pressed=true;o.shadow=[8,8];},
 // Tas d'os de la salle du chef.
 'tas-os':(M,o)=>{const R=rng(121);for(let i=0;i<22;i++){const ca=(R()-.5)*16,cb=(R()-.5)*12,ang=R()*Math.PI,l=2+R()*4,z=Math.floor(R()*Math.max(1,4-Math.hypot(ca/8,cb/6)*3));
   for(let t=-l;t<=l;t+=.5)M.set(Math.round(ca+Math.cos(ang)*t),Math.round(cb+Math.sin(ang)*t),z,'os');}
  o.stamps=[[[-2,1,5],SKULL,SKULL_MAP],[[5,-2,3],SKULL,SKULL_MAP]];o.shadow=[11,9];},
 // Plate-forme du monte-charge, posée sur le puits : plancher, garde-corps, chaînes qui montent dans le noir.
 'monte-charge':(M,o)=>{M.box(-13,-13,0,13,13,2,'bois');M.box(-14,-14,0,14,14,1,'fer');
  for(const [a,b]of [[-13,-13],[11,-13],[-13,11],[11,11]]){M.box(a,b,2,a+2,b+2,16,'bois');}
  M.box(-13,-13,14,13,-11,16,'bois');M.box(-13,-13,14,-11,13,16,'bois');
  for(const [a,b]of [[-12,-12],[12,-12],[-12,12],[12,12]])for(let z=16;z<52;z++)if(z%3!==1)M.set(a,b,z,'fer');
  }
};
// Coffre : caisse cerclée, couvercle bombé (ou ouvert, dressé derrière, l'or dedans).
function chest(M,o,{open=false}={}){
 M.box(-8,-5,0,8,5,6,'bois');for(const a of [-7,5])M.box(a,-5,0,a+2,6,7,'fer');
 if(open){M.box(-8,-6,6,8,-4,15,'bois');M.shape((a,b,z)=>(a/7)**2+(b/4)**2<1?'or':undefined,[-7,-4,5,7,4,7]);}
 else{M.shape((a,b,z)=>b*b+(z-6)**2<=5*5&&z>=6?((a>=-7&&a<-5)||(a>=5&&a<7)?'fer':'bois'):undefined,[-8,-5,6,8,5,12]);M.box(-1,5,3,1,6,7,'fer');}
}
// Planches de caisse : bords sombres, planches de 3, traverse en diagonale.
function crateShade(base,boxes){
 return hit=>{const c=base(hit);if(!c||hit.mat!=='bois')return c;const {a,b,z,side}=hit,B=boxes.find(([a0,b0,z0,a1,b1,z1])=>a>=a0&&a<a1&&b>=b0&&b<b1&&z>=z0&&z<z1);if(!B)return c;
  const [a0,b0,z0,a1,b1,z1]=B,t=side==='b'?a-a0:side==='a'?b-b0:a-a0,n=side==='z'?b1-b0:side==='b'?a1-a0:b1-b0,zz=side==='z'?b-b0:z-z0,m=side==='z'?a1-a0:z1-z0;
  const edge=t===0||t===n-1||zz===0||zz===m-1,diag=side!=='z'&&Math.abs(t*(m-1)/(n-1)-zz)<.7;
  return W.col('planche',edge?(side==='z'?5:4):diag?4:(Math.floor(t/3)%2?2:3)+(side==='z'?1:0),hit.face);};
}
/* Bords de silhouette assombris d'un ton côté droit et en bas (pas de trait
 * noir autour : l'objet se détache par sa valeur et son ombre de contact). */
function outline(s){const src=s.g.clone(),P=require('./palette.cjs');for(let y=0;y<s.h;y++)for(let x=0;x<s.w;x++){if(!src.get(x,y))continue;if(src.get(x+1,y)&&src.get(x,y+1))continue;
 const c=s.g.name(x,y),ramp=c.replace(/\d+$/,''),t=+c.match(/\d+$/)[0];if(ramp==='torche')continue;s.g.set(x,y,ramp+Math.max(0,t-1));}}
function object(name,{image=0}={}){
 const M=new Model(-16,-16,0,18,18,52),o={};OBJECTS[name](M,o);
 let sh=shader(o);if(o.crate)sh=crateShade(sh,o.crate);
 const s=render(M,sh);
 outline(s);
 if(o.shadow)contact(s,M,...o.shadow);
 if(o.light){bake(s,M,o.light.src,o.light.r);pool(s,M,o.light.pool);}
 if(o.fire){const [x,y]=pixel(s,M,...o.fire);stamp(s.g,x-4,y-11,FIRE[image%4],FIRE_MAP);}
 for(const [at,art,map]of o.stamps||[])put(s,M,at,art,map);
 if(o.padlock){const [x,y]=pixel(s,M,...o.padlock);stamp(s.g,x-1,y-2,['.a.','a.a','bbb','bcb'],{a:'fer5',b:'fer4',c:'fer0','.':null});}
 if(o.glint){const [x,y]=pixel(s,M,...o.glint);s.g.set(x,y,'fer6');}
 // Rune gravée sur la dalle de pression (sombre, ou luisante une fois enfoncée).
 if(o.rune){const [x,y]=pixel(s,M,0,0,o.pressed?1:2);stamp(s.g,x-3,y-2,['..a..','.a.a.','a.b.a','.a.a.','..a..'],o.pressed?{a:'arcane4',b:'arcane6','.':null}:{a:'cachot2',b:'cachot1','.':null});}
 // Fée : petite silhouette claire aux ailes battantes, lueur violette au sol.
 if(o.fairy){const [x,y]=pixel(s,M,...o.fairy),k=image%4,wings=[['b.....b','ab.c.ba','.abcba.','...c...','..c.c..'],['...c...','aabcbaa','.abcba.','...c...','..c.c..'],['b.....b','ab.c.ba','.abcba.','...c...','..c.c..'],['...c...','..bcb..','abbcbba','a..c..a','..c.c..']][k];
  stamp(s.g,x-3,y-2,wings,{a:'arcane5',b:'arcane6',c:'arcane7','.':null});const [dx,dy]=[[-5,-4],[4,-3],[-4,3],[5,2]][k];s.g.set(x+dx,y+dy,'arcane6');}
 if(o.glowArcane){if(!s.glow)s.glow=new Grid(s.w,s.h);for(let py=0;py<s.h;py++)for(let px=0;px<s.w;px++){const X=px-s.ax+.5,Y=py-s.ay+.5,d=Math.hypot(Y+X/2,Y-X/2)/o.glowArcane;if(d<1){const c=glowRing(d,px,py);if(c)s.glow.set(px,py,'arcane'+(+c.slice(-1)-1));}}s.glowKind='arcane';}
 return s;
}
const ANIMATED=['brasero','cage-fee'];
/* Décors au sol : tampons peints à plat (ancre au milieu). */
const DECALS={
 fissure:{art:['a.......','.ab.....','..aab...','....ab..','.....aab','.......a'],map:{a:'cachot1',b:'cachot6'}},
 flaque:{art:['..aaaa...','.abbbba..','abccbbba.','.abbbbbba','..aaaaaa.'],map:{a:'cachot2',b:'eau1',c:'eau3'}},
 os:{art:['ab.....','.bbbbba','.....ab','..a.ab.','...bb..'],map:{a:'bouleau4',b:'bouleau3'}},
 crane:{art:['.aaa.','abbba','bc.cb','.bbb.'],map:{a:'bouleau5',b:'bouleau3',c:'cachot0','.':null}},
 paille:{art:['a...b..a.','.ab..ab..','..b.a..ab','.a..b.a..'],map:{a:'paille3',b:'paille2'}},
 mousse:{art:['..ab.a..','.abbab..','abbbba.a','.aabba..'],map:{a:'mousse1',b:'mousse2'}},
 tache:{art:['..aaa...','.abbbaa.','aabbbba.','.aaabba.','...aa...'],map:{a:'chiffon1',b:'chiffon0'}},
 gravats:{art:['.ab..a.','abc.ab.','.c..bc.','..ab..a','..bc...'],map:{a:'cachot6',b:'cachot4',c:'cachot2'}},
 grille:{art:['....aa....','..aabbaa..','aabcbcbbaa','.abcbcbcba','..aabbaa..','....aa....'],map:{a:'fer1',b:'fer3',c:'cachot0'}},
 traces:{art:['a.a.......','.a.....a.a','.......aa.','..a.a.....','...aa.....'],map:{a:'lueur1'}}
};
function decal(name){const {art,map}=DECALS[name],g=new Grid(Math.max(...art.map(r=>r.length)),art.length);stamp(g,0,0,art,map);g.anchor=[Math.floor(g.w/2),Math.floor(g.h/2)];return g;}
/* Toile d'araignée pour le coin nord d'une salle (posée en haut de l'angle). */
function cobweb(){const g=new Grid(17,12),c='bouleau3',d='bouleau2';
 const pts=[[8,0],[0,4],[16,4],[3,10],[13,10]];for(const [x,y]of pts){const n=Math.max(Math.abs(x-8),Math.abs(y-1))*2;for(let i=0;i<=n;i++){const t=i/n;g.set(Math.round(8+(x-8)*t),Math.round(1+(y-1)*t),i%3?c:d);}}
 for(const r of [3,6]){for(let k=0;k<4;k++){const [x0,y0]=pts[[1,3,4,2][k]],[x1,y1]=pts[[3,4,2,2][k]];}for(let i=-r*2;i<=r*2;i++){const x=8+i,y=1+Math.round(r*.9-Math.abs(i)*.25);if(y>0&&(i+r)%2===0)g.set(x,y,d);}}
 g.anchor=[8,0];return g;}
// Hauteur de la toile au-dessus du sommet du coin (pixels écran).
const WEB_Z=46;
module.exports={OBJECTS,NAMES:Object.keys(OBJECTS),ANIMATED,object,DECALS,decal,cobweb,FIRE,SKULL,WEB_Z};
