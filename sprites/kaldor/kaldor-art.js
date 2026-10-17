/* Hearthreaver — Kaldor, long-haired barbarian hero, chibi pixel art v5.
 * Même grammaire que les batraciens : petites grilles dessinées pixel par pixel,
 * contour sombre, animation minimaliste par décalages entiers d'un pixel.
 * Quatre vues de 28 lignes reprises des planches à grille validées (face, profil,
 * dos ; le profil gauche est le profil droit retourné). Repères de hauteur communs :
 * sourcils 9, yeux 10, épaulières 13, menton 16, bras 17, brassards 19, ceinture 20,
 * poings 21, cuisses 23, bottes 25, semelle 27.
 * L'épée, les bras d'action et les smears sont tracés en JavaScript à partir de la
 * pose moteur swordPose() : la lame en garde l'angle, mais sa longueur visible reste
 * fixe et elle est tracée d'un seul segment, donc toujours droite. Épée à deux mains,
 * tenue à deux mains dès qu'elle est sortie ; bras courts jamais étirés.
 * Case moteur 80 × 80, pieds en (40,52) ; aucun lissage, aucune image chargée.
 * Les durées de combo, le dash, la garde, les parades et les dégâts ne changent pas.
 */
(function(root,factory){
 'use strict';
 const art=factory();
 if(typeof module==='object'&&module.exports)module.exports=art;
 root.HearthreaverKaldorArt=art;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const CELL=80, ANCHOR=Object.freeze({x:40,y:52});
 const DIRECTIONS=Object.freeze(['dos','droite','face','gauche']);
 const STATES=Object.freeze({idle:4,walk:6,attack:6,guard:6,dash:4,hurt:4,use:6,melee:6,
   sheathe:6,sheathe_walk:36,sheathed_idle:4,sheathed_walk:6,sheathed_dash:4,sheathed_hurt:4,sheathed_use:6,sheathed_melee:6,draw:5,draw_walk:30});
 const HOLSTER=Object.freeze({delay:3.7,stow:0.33,draw:0.21});
 /** O contour et yeux ; k j h H q Q s cheveux, barbe et cuir ; S m a p peau ;
  *  g f F G fourrure et laiton ; 1 2 3 4 acier ; e E W traînée (smear). */
 const PALETTE=Object.freeze({
  O:'#0b0a17',
  k:'#251920',j:'#3a272d',h:'#4d3030',H:'#5e3933',q:'#7b4d3c',Q:'#8f5a3f',s:'#a66947',
  S:'#c96f40',m:'#dc864f',a:'#f0a868',p:'#fec17f',
  g:'#dfaf70',f:'#fcda9c',F:'#feeebe',G:'#eec27c',
  1:'#3b4551',2:'#728396',3:'#b4c0c8',4:'#eef0ea',
  e:'#c49a5c',E:'#f2dc9c',W:'#fff5da'
 });
 const mirror=rows=>rows.map(r=>[...r].reverse().join(''));
 // Planches validées, sans la poignée de l'épée rangée (elle est posée par-dessus quand
 // l'épée est au fourreau). Dernière ligne = semelle (y = 0).
 const DROITE=[
  '.........OOOOOO......',
  '.......OOhqQQqHOO....',
  '......OhqQssQqqHqO...',
  '.....OhqQqsQqHqqHqO..',
  '....OjhqqHqQqHqQqHqO.',
  '....OjhHqhqqHqqHqqhO.',
  '....OjhHqhHqHhqHqhHO.',
  '....OjhHhqHhqHhqkSmO.',
  '....OjhHqhHqHhmmappO.',
  '.....OhHqhHqhmajjjpO.',
  '....OjhHqhpajmappOpO.',
  '....OjhHqhaSjSmapOpO.',
  '.....OhHhjmjjHmahHjO.',
  '.....OgFFFgOjHqhHjaO.',
  '.....OgFFFgOjhHqjqHO.',
  '.....OgFfFFgOkjjjjjO.',
  '....OgfFFgOOOOOOOOO..',
  '.....OhOSmmaOmSO.....',
  '.....OhOSppaOpSO.....',
  '.....OhOjHHqOSSO.....',
  '.....OOOhHqHOOFO.....',
  '.....OqOSpppOqFO.....',
  '.....OOOSmpSOOGO.....',
  '......OOOOOOSqO......',
  '........OmppOO.......',
  '........OHqHqO.......',
  '........OSSpSaO......',
  '........OOOOOOO......'
 ];
 const VIEWS={
  face:[
   '........OOOOOO.......',
   '......OOHqOqqhOO.....',
   '.....OjHqqhqQqHHO....',
   '....OqqHsqhHqsqqjO...',
   '...OjqqsQqhqHQqqjO...',
   '..OHsqHqjqhHjqhqsHO..',
   '..OhhqjqOOhOOHkHHhO..',
   '...OhjOhOmmmmhOjhhO..',
   '.OOjhkmmapppammOhjhO.',
   '.OhhOmjjjpppjjjmhOhO.',
   '..OmOmpOOpppOOpmOmO..',
   '.OOakmpOOpppOOpmkaOO.',
   '..OSjkpaHjjjHapkjSO..',
   '.OFgOjHqjaaajqHjOgFFO',
   '.OFFgOjhHqjqHhjOgFFO.',
   'OFfFFfOkjjjjjOOgFFfFO',
   'OFHFFFfkOOOOOHfFFgOgO',
   '.OmSOFgHjHmmjHgFfSmO.',
   '.OppSOSpSjHFgHSHOSppO',
   'OqHHjOSmSkHkSmSOjHHqO',
   'OHqHjOOOOFFFOOOOjHqHO',
   'OSpppOhqQFqFQqhOpppSO',
   'OSmpSOOOOGGGOOOOSpmSO',
   '.OOOOSmmSqqqSmmSOOOO.',
   '....OpppSOOOSpppO....',
   '...OHqHpSO.OSpHqHO...',
   '..OqSSpSHO.OHSSpSqO..',
   '..OOOOOOOO.OOOOOOOO..'
  ],
  droite:DROITE,
  dos:[
   '........OOOOOO........',
   '......OOHqhHqHOO......',
   '.....OjHqQHhqQHhO.....',
   '....OhHqQsHqQsqHjO....',
   '...OjHqQsqHqQsqHhO....',
   '..OjHqHqhqHqhqHqHjO...',
   '..OhHqhHqjHqjHqhHhO...',
   '...OjhHqjHqhHqjHhjO...',
   '.OOjhHjqHhjqHjqHhjhO..',
   '.OhhjHjqHjhqHjqHjOhO..',
   '..OmOjHjqHjhqHjhOmO...',
   '.OOakjHjqHjqHjqjkaOO..',
   '..OSjkHjqHjqHjhkjSO...',
   '.OFgOjHjqHjqHjhjOgFFO.',
   '.OFFgOjHjqHjqHjOgFFO..',
   'OFfFFfOjHjqHjOOgFFfFO.',
   'OFHFFFfOjOjOjOfFFgOgO.',
   '.OmSOFgFfFfFfFSsqSmO..',
   '.OppSOqHqHqHSsqHOSppO.',
   'OqHHjOHqHqHSsqHOjHHqO.',
   'OHqHjOOOOSsqOOOOjHqHO.',
   'OSpppOhqSsqqQqhOpppSO.',
   'OSmpSOSsqOOOOOOOSpmSO.',
   '.OOOOSmmSqQqSmmSOOOO..',
   '....OmppSOOOSppmO.....',
   '...OHqHqHO.OHqHqHO....',
   '..OqSSpSHO.OHSpSSqO...',
   '..OOOOOOOO.OOOOOOOO...'
  ],
  gauche:mirror(DROITE)
 };
 // Poignée de l'épée rangée sur le dos : [colonne, ligne, motif] dans la grille de la vue.
 const HILT_DROITE=['..OO...','.OgF...','.OFg...','.Ogqs..','..Oqs..','...OkgO','..Ogg..','...Oq..'];
 const HILT={droite:[0,9,HILT_DROITE],gauche:[14,9,mirror(HILT_DROITE)],
  dos:[17,9,['...O.','..FgO','..gFO','OsqgO','OsqO.','gk...','Ogg..']],face:null};
 // Colonne de l'axe du corps (x = 0) dans chaque grille ; dernière ligne = pieds.
 const ORIGIN=Object.freeze({face:10,dos:10,droite:10,gauche:10});
 const TOP=27;
 function assert(cond,msg){if(!cond)throw new Error('Kaldor Art: '+msg);}
 for(const [view,rows] of Object.entries(VIEWS)){
  assert(rows.length===28,view+' doit compter 28 lignes');
  const width=rows[0].length;
  for(const row of rows){assert(row.length===width,view+' ligne '+row.length+' ≠ '+width);
   for(const key of row)assert(key==='.'||Object.hasOwn(PALETTE,key),view+' pixel inconnu '+key);
  }
  Object.freeze(rows);
 }
 Object.freeze(VIEWS);

 // --- Calques : Map clé entière -> couleur, coordonnées relatives aux pieds ---
 const K=(x,y)=>((y+128)<<8)|(x+128), KX=k=>(k&255)-128, KY=k=>(k>>8)-128;
 function put(layer,x,y,key){x=Math.round(x);y=Math.round(y);if(key&&key!=='.')layer.set(K(x,y),key);}
 // Toujours une copie : les pièces sources ne sont jamais modifiées par un rendu.
 function shift(layer,dx,dy){if(!dx&&!dy)return new Map(layer);const out=new Map();for(const [k,c] of layer)out.set(K(KX(k)+dx,KY(k)+dy),c);return out;}
 const AROUND=[[1,0],[-1,0],[0,1],[0,-1]],HANGING=[[1,0],[-1,0],[0,1]],SOLE=[[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1]];
 function border(layer,dirs=AROUND){const out=new Map();for(const k of layer.keys()){const x=KX(k),y=KY(k);
   for(const [dx,dy] of dirs){const n=K(x+dx,y+dy);if(!layer.has(n))out.set(n,'O');}}return out;}
 /** Pose un calque ; outline=true ajoute un contour d'un pixel, posé avant les couleurs. */
 function over(target,layer,outline=false){if(outline)for(const [k,c] of border(layer,outline===true?AROUND:outline))target.set(k,c);for(const [k,c] of layer)target.set(k,c);return target;}
 function sprite(view,[col,row,rows]){const layer=new Map();
  rows.forEach((line,j)=>{for(let i=0;i<line.length;i++)put(layer,col+i-ORIGIN[view],row+j-TOP,line[i]);});return layer;}

 // --- Découpage des vues en pièces articulées (sources inchangées) ---
 const FRONTAL=v=>v==='face'||v==='dos';
 function region(view,col,row){
  if(FRONTAL(view)){
   // Tête : cheveux, visage et barbe (de dos : les pointes de cheveux entre les épaulières).
   if(row<=12)return 'head';
   if(row===13&&col>=5&&col<=15)return 'head';
   if(row===14&&col>=6&&col<=14)return 'head';
   if(row===15&&col>=7&&col<=12)return 'head';
   if(row===16&&col>=8&&col<=12)return 'head';
   if(row===17&&col<=4)return 'armL';
   if(row===17&&col>=17)return 'armR';
   if(row>=18&&row<=22&&col<=5)return 'armL';
   if(row===18&&col>=16)return 'armR';
   if(row>=19&&row<=22&&col>=15)return 'armR';
   if(row===23&&col<=4)return 'armL';
   if(row===23&&col>=16)return 'armR';
   if(row>=24)return col<=9?'legL':col>=11?'legR':'body';
   return 'body';
  }
  const c=view==='droite'?col:20-col;
  if(row<=12)return 'head';
  if((row===13||row===14)&&c>=12)return 'head';
  if(row===15&&c>=13)return 'head';
  if(row===16&&c>=11)return 'head';
  if(row>=17&&row<=22&&c>=7&&c<=12)return 'arm';
  if(row===23&&c>=7&&c<=11)return 'arm';
  if(row>=24)return 'legs';
  return 'body';
 }
 const PARTS={};
 for(const [view,rows] of Object.entries(VIEWS)){
  const part={head:new Map(),body:new Map(),collar:new Map(),fur:new Map(),armL:new Map(),armR:new Map(),arm:new Map(),legL:new Map(),legR:new Map(),legs:new Map()};
  rows.forEach((row,r)=>{for(let c=0;c<row.length;c++){const key=row[c];if(key==='.')continue;const where=region(view,c,r),k=K(c-ORIGIN[view],r-TOP);part[where].set(k,key);
   // Col de fourrure autour de la tête : repeint par-dessus quand la tête s'abaisse d'un pixel.
   if(where==='body'&&r<=16)part.collar.set(k,key);
   // Épaulières : elles recouvrent le haut d'un bras d'action.
   if(where==='body'&&r>=13&&r<=17&&'FfgG'.includes(key))part.fur.set(k,key);}});
  PARTS[view]=part;
 }
 // Bras de profil sans son contour : cisaillé puis recerné, pour éviter les contours en escalier.
 const ARM_FILL={};for(const view of ['droite','gauche'])ARM_FILL[view]=new Map([...PARTS[view].arm].filter(([,c])=>c!=='O'));
 // Tronc peint sous le bras de profil (lignes 17 à 23) : invisible au repos, révélé quand le bras bouge.
 const UNDER_DROITE=['jSSmma','hjSmap','SHjmaa','OOOOOO','hqQqqh','OOOOOO','SmmaaS'];
 const UNDER_ARM={droite:[7,17,UNDER_DROITE],gauche:[8,17,mirror(UNDER_DROITE)]};
 // Jambe de profil (botte vers l'avant), lignes 24 à 26 ; la jambe éloignée est assombrie.
 const LEG_DROITE=['mpp..','HqHq.','SSpSa'];
 const SIDE_LEG={droite:{x:-1,rows:LEG_DROITE},gauche:{x:-3,rows:mirror(LEG_DROITE)}};
 const SHADE=Object.freeze({p:'a',a:'m',m:'S',S:'s',s:'q',Q:'q',q:'H',H:'h',h:'j',j:'k',k:'k',F:'f',f:'g',g:'Q',G:'g'});
 // Yeux fermés (clignement, douleur) : le haut de l'œil devient peau, il reste un trait.
 const LIDS={face:[[-3,-17,'p'],[-2,-17,'p'],[2,-17,'p'],[3,-17,'p']],dos:[],
  droite:[[7,-17,'p']],gauche:[[-7,-17,'p']]};

 // --- Tracés : lignes nettes et membres épais ---
 function linePoints(ax,ay,bx,by){ax=Math.round(ax);ay=Math.round(ay);bx=Math.round(bx);by=Math.round(by);
  const pts=[],dx=Math.abs(bx-ax),sx=ax<bx?1:-1,dy=-Math.abs(by-ay),sy=ay<by?1:-1;let err=dx+dy;
  for(;;){pts.push([ax,ay]);if(ax===bx&&ay===by)break;const e=2*err;if(e>=dy){err+=dy;ax+=sx;}if(e<=dx){err+=dx;ay+=sy;}}
  // « Pixel perfect » : supprime les coins en L qui épaississent les diagonales.
  const out=[];for(let i=0;i<pts.length;i++){const a=out[out.length-1],b=pts[i],c=pts[i+1];
   if(a&&c&&(a[0]===b[0]||a[1]===b[1])&&(c[0]===b[0]||c[1]===b[1])&&a[0]!==c[0]&&a[1]!==c[1])continue;out.push(b);}
  return out;
 }
 const LIGHT=[-Math.SQRT1_2,-Math.SQRT1_2];
 /** Membre de 3 pixels : bord éclairé, milieu, ombre ; brassard de cuir près du poing. */
 function limb(layer,a,b,{bracer=true,dark=false}={}){
  const vx=b[0]-a[0],vy=b[1]-a[1],len=Math.hypot(vx,vy);
  const ux=len?vx/len:0,uy=len?vy/len:1,nx=-uy,ny=ux,lit=(nx*LIGHT[0]+ny*LIGHT[1])>=0?1:-1;
  const minX=Math.floor(Math.min(a[0],b[0])-2),maxX=Math.ceil(Math.max(a[0],b[0])+2),minY=Math.floor(Math.min(a[1],b[1])-2),maxY=Math.ceil(Math.max(a[1],b[1])+2);
  for(let y=minY;y<=maxY;y++)for(let x=minX;x<=maxX;x++){
   const px=x-a[0],py=y-a[1],t=Math.max(0,Math.min(len,px*ux+py*uy)),cx=a[0]+ux*t,cy=a[1]+uy*t,d=(x-cx)*nx+(y-cy)*ny;
   if(Math.hypot(x-cx,y-cy)>1.25)continue;
   const side=d*lit,skin=side>.45?'p':side<-.45?'m':'a',leather=side>.45?'q':side<-.45?'j':'H';
   let key=bracer&&t>len-3.6&&t<len-.9&&len>3?leather:skin;
   if(dark)key=SHADE[key]||key;
   put(layer,x,y,key);
  }
  return layer;
 }
 /** Bras d'action en deux segments : l'épaule, le coude (plié vers l'extérieur et vers le bas,
 *  de profil vers l'arrière), puis l'avant-bras avec son brassard jusqu'au poing. */
const BONES={face:[4,5],dos:[4,5],droite:[4,4],gauche:[4,4]};
function arm(layer,view,which,s,h,dark=false){
 const [U,F]=BONES[view],dx=h[0]-s[0],dy=h[1]-s[1],d=Math.hypot(dx,dy);
 const out=FRONTAL(view)?(which==='L'?-1:1):(view==='droite'?-1:1);
 let e;
 if(d>=U+F-.01||d<.5)e=[s[0]+dx*U/(U+F),s[1]+dy*U/(U+F)];
 else{const a=Math.acos(Math.max(-1,Math.min(1,(U*U+d*d-F*F)/(2*U*d)))),t=Math.atan2(dy,dx);
  const c=[t+a,t-a].map(r=>[s[0]+Math.cos(r)*U,s[1]+Math.sin(r)*U]);
  const score=p=>(p[0]-s[0])*out+(p[1]-s[1])*.6;
  e=score(c[0])>=score(c[1])?c[0]:c[1];}
 e=[Math.round(e[0]),Math.round(e[1])];
 limb(layer,s,e,{bracer:false,dark});limb(layer,e,h,{dark});
 return layer;
}
function fist(layer,at,dark=false){const x=Math.round(at[0]),y=Math.round(at[1]);
  const keys=[['p','a'],['a','m']];
  for(let j=0;j<2;j++)for(let i=0;i<2;i++){let k=keys[j][i];if(dark)k=SHADE[k];put(layer,x-1+i,y-1+j,k);}
  return layer;
 }
 // Longueur visible de la lame, de la main à la pointe : identique au repos et en attaque.
 const BLADE=16;
 /** Épée : un seul segment du pommeau à la pointe (jamais coudé), garde perpendiculaire,
  *  lame à biseau éclairé. g = main sur la fusée ; seule la direction de tip compte. */
 function sword(layer,g,tip){
  const vx=tip[0]-g[0],vy=tip[1]-g[1],l=Math.hypot(vx,vy)||1,ux=vx/l,uy=vy/l,nx=-uy,ny=ux;
  const end=[g[0]+ux*BLADE,g[1]+uy*BLADE],line=linePoints(g[0]-ux*4,g[1]-uy*4,...end);
  const along=([x,y])=>(x-g[0])*ux+(y-g[1])*uy;
  const litN=(nx*LIGHT[0]+ny*LIGHT[1])>=0?1:-1;
  const edge=Math.abs(nx)>Math.abs(ny)?[Math.sign(nx*litN),0]:[0,Math.sign(ny*litN)];
  const blade=line.filter(p=>along(p)>=2.5);
  for(const [x,y] of blade.slice(0,-1))put(layer,x+edge[0],y+edge[1],'4');
  for(const p of line){const t=along(p);put(layer,p[0],p[1],t<-3.2?'G':t<1.5?((p[0]+p[1])&1?'h':'H'):t<2.5?'G':'3');}
  const [tx,ty]=line[line.length-1];put(layer,tx,ty,'4');
  // Garde : centrée sur le point du segment le plus proche de t = 2.
  const gc=line.reduce((best,p)=>Math.abs(along(p)-2)<Math.abs(along(best)-2)?p:best,line[0]);
  for(const n of [-2,-1,1,2])put(layer,gc[0]+nx*n,gc[1]+ny*n,Math.abs(n)===2?'g':'G');
  return layer;
 }
 /** Contour de l'épée : autour de la lame et de la garde seulement ; la fusée tenue en main
  *  n'en reçoit pas, pour ne pas noircir les poings. */
 function drawSword(target,layer){const steel=new Map([...layer].filter(([,c])=>'34Gg'.includes(c)));
  for(const [k,c] of border(steel))if(!layer.has(k))target.set(k,c);for(const [k,c] of layer)target.set(k,c);}
 /** Traînée de lame : bande en arc entre deux poses, sous la pointe, jamais plus longue que
  *  la lame. Bord extérieur clair, intérieur doré, départ tramé. */
 function smear(layer,A,B){
  const a0=Math.atan2(A.tip[1]-A.g[1],A.tip[0]-A.g[0]),a1=Math.atan2(B.tip[1]-B.g[1],B.tip[0]-B.g[0]);
  let da=a1-a0;while(da>Math.PI)da-=2*Math.PI;while(da<-Math.PI)da+=2*Math.PI;
  const len=BLADE-.5,steps=Math.max(10,Math.ceil(Math.abs(da)*len*1.6)+Math.ceil(Math.hypot(B.g[0]-A.g[0],B.g[1]-A.g[1])*2));
  const cells=new Map();
  for(let i=0;i<=steps;i++){
   const t=i/steps,ang=a0+da*t,gx=A.g[0]+(B.g[0]-A.g[0])*t,gy=A.g[1]+(B.g[1]-A.g[1])*t;
   const width=len*(.3+.2*t);
   for(let r=len-width;r<=len+.01;r+=.35){
    const x=Math.round(gx+Math.cos(ang)*r),y=Math.round(gy+Math.sin(ang)*r),depth=len-r,k=K(x,y);
    const prev=cells.get(k);if(prev===undefined||depth<prev.depth)cells.set(k,{depth,t});
   }
  }
  // Lame qui glisse sans tourner (coup vertical vu de dos) : traits de vitesse sur le chemin
  // de la pointe, au-delà de la lame, à la place de l'éventail.
  if(Math.abs(da)<.2){cells.clear();const ux=Math.cos(a1),uy=Math.sin(a1),n=Math.max(4,Math.ceil(Math.hypot(B.tip[0]-A.tip[0],B.tip[1]-A.tip[1])*2));
   for(let i=0;i<=n;i++){const t=i/n,x0=A.tip[0]+(B.tip[0]-A.tip[0])*t+ux*(2-2*t),y0=A.tip[1]+(B.tip[1]-A.tip[1])*t+uy*(2-2*t);
    for(const w of [-1,1]){const k=K(Math.round(x0-uy*w),Math.round(y0+ux*w));if(!cells.has(k))cells.set(k,{depth:2,t:.5+t/2});}}}
  for(const [k,{depth,t}] of cells){
   const x=KX(k),y=KY(k);
   if(t<.3&&((x+y)&1))continue;
   layer.set(k,depth<1.1?'W':depth<2.6?'E':'e');
  }
  return layer;
 }

 // --- Poses ---
 // La tête suit le buste avec une image de retard (1 px) : léger bobbing sans trou au cou.
 const WALK={bob:[0,1,0,0,1,0],head:[0,0,1,0,0,1],liftL:[0,0,0,0,1,1],liftR:[0,1,1,0,0,0],swing:[1,1,0,-1,-1,0]};
 // Profil : petits pas de chibi autour d'une seule botte au repos ; la jambe qui passe
 // devant se lève d'un pixel, le bras balance à l'opposé de la jambe proche.
 const SIDE_WALK={near:[2,1,0,-2,-1,0],far:[-2,-1,0,2,1,0],nearLift:[0,0,0,0,1,1],farLift:[0,1,1,0,0,0],arm:[-1,-1,0,1,1,0]};
 // Repos : respiration d'un pixel ; en remontant, la tête et les mains restent un instant en bas.
 const IDLE=[{bob:0},{bob:1},{bob:1,relax:1},{bob:0,head:1,relax:1,blink:true}];
 function bodyPose(view,loc,f,combo){
  const side=!FRONTAL(view),fwd=view==='droite'?1:view==='gauche'?-1:0;
  // head : retard de la tête (0 ou 1 px, toujours vers le bas). legIn : pieds joints de face
  // et de dos en marche. spread : appuis écartés (fente d'attaque, garde).
  const P={dx:0,dy:0,hx:0,hy:0,head:0,liftL:0,liftR:0,swingL:0,swingR:0,near:0,far:0,nearLift:0,farLift:0,arm:0,blink:false,relax:0,legIn:0,spread:0};
  if(loc==='idle'){const I=IDLE[f%4];P.dy=I.bob;P.head=I.head||0;P.blink=!!I.blink;P.relax=I.relax||0;}
  else if(loc==='walk'||loc==='guard'){const w=f%6;P.dy=WALK.bob[w];P.head=WALK.head[w];P.liftL=WALK.liftL[w];P.liftR=WALK.liftR[w];
   P.swingL=WALK.swing[w];P.swingR=-WALK.swing[w];P.legIn=1;
   if(side){P.near=SIDE_WALK.near[w];P.far=SIDE_WALK.far[w];P.nearLift=SIDE_WALK.nearLift[w];P.farLift=SIDE_WALK.farLift[w];P.arm=SIDE_WALK.arm[w];P.relax=P.head;}
   if(loc==='guard'){P.dy=1;P.head=0;P.relax=0;P.swingL=P.swingR=0;if(side){P.near=1;P.far=-2;P.nearLift=P.farLift=0;}else{P.legIn=0;P.spread=1;}}}
  else if(loc==='attack'){
   // Fente : appuis écartés, buste abaissé d'un pixel qui recule à l'armé puis plonge vers
   // l'avant ; la tête suit le coup avec un pixel de retard.
   const lean=[0,-1,1,2,1,0][f],spread=[1,1,2,2,2,1][f];
   P.dx=side?lean*fwd:0;P.dy=f>=1&&f<5?1:0;P.head=f===3?1:0;
   if(side){P.near=spread;P.far=-spread;}else P.spread=spread>1?2:1;
  }
  else if(loc==='dash'){const w=f%4;P.dx=side?fwd*2:0;P.dy=1;P.near=side?[2,1,2,1][w]:0;P.far=side?-2:0;P.nearLift=side?1:0;
   P.liftL=!side&&w%2===0?1:0;P.liftR=!side&&w%2===1?1:0;P.swingL=!side?-1:0;P.swingR=!side?-1:0;}
  else if(loc==='hurt'){const back=[-1,-2,-1,0][f];P.dx=side?back*fwd:0;P.dy=[1,1,0,0][f];P.hx=side?[-1,-1,0,0][f]*fwd:0;P.blink=f<3;P.swingL=P.swingR=-1;}
  else if(loc==='use'||loc==='melee'){P.dx=side?[0,0,1,1,0,0][f]*fwd:0;P.dy=[0,0,1,1,0,0][f];}
  P.hx+=P.dx;P.hy+=P.dy+P.head;return P;
 }
 // Épaules, prise et visée de la lame. Le poignet moteur est ramené vers le torse
 // (bras courts de chibi) ; la lame garde l'angle de la lame moteur.
 const SHOULDER={face:{L:[-7,-10],R:[7,-10]},dos:{L:[-7,-10],R:[7,-10]},droite:{near:[-1,-10],far:[-3,-10]},gauche:{near:[1,-10],far:[3,-10]}};
 // Portée maximale d'un bras, de l'épaule au poing : un bras ne s'étire jamais au-delà.
 const REACH={face:8,dos:8,droite:7,gauche:7};
 const ARMS=view=>FRONTAL(view)?['L','R']:['near','far'];
 /** Épaule d'un bras ; elle monte d'un ou deux pixels quand la main passe au-dessus. */
 function shoulderOf(view,arm,hand,P){const s=SHOULDER[view][arm],x=s[0]+P.dx,y=s[1]+P.dy;
  return [x,y-Math.max(0,Math.min(2,Math.round((y-hand[1]-3)/2)))];}
 function span(view,arm,hand,P){const s=shoulderOf(view,arm,hand,P);return Math.hypot(hand[0]-s[0],hand[1]-s[1]);}
 // Zone du visage et de la barbe (x min, x max, y min, y max) ; dos : aucune.
 const FACE={face:[-6,6,-20,-11],droite:[2,9,-20,-11],gauche:[-9,-2,-20,-11]};
 /** Épée à deux mains : main haute contre la garde, main basse sur la fusée, chaque poing
  *  à portée de son épaule. Si un bras devait s'étirer, toute la poignée glisse vers le
  *  torse et la lame suit sans changer d'angle ni de longueur. */
 function twoHands(view,blade,P){
  const vx=blade.tip[0]-blade.g[0],vy=blade.tip[1]-blade.g[1],l=Math.hypot(vx,vy)||1,ux=vx/l,uy=vy/l,[a0,a1]=ARMS(view),R=REACH[view];
  let gx=blade.g[0],gy=blade.g[1];
  const layout=()=>{const hi=[Math.round(gx),Math.round(gy)],lo=[Math.round(gx-2*ux),Math.round(gy-2*uy)];
   const A={[a0]:hi,[a1]:lo},B={[a0]:lo,[a1]:hi},cost=H=>Math.max(span(view,a0,H[a0],P),span(view,a1,H[a1],P));
   return cost(A)<=cost(B)?A:B;};
  for(let it=0;it<20;it++){const H=layout();let mx=0,my=0;
   for(const arm of [a0,a1]){const h=H[arm],s=shoulderOf(view,arm,h,P),dx=h[0]-s[0],dy=h[1]-s[1],d=Math.hypot(dx,dy);
    if(d>R){mx-=dx*(1-R/d);my-=dy*(1-R/d);}}
   if(!mx&&!my)break;gx+=mx*.5;gy+=my*.5;}
  // Poings et pommeau ne montent jamais devant le visage ni dans la barbe : ils restent
  // devant le torse (lame levée : posée sur l'épaule, derrière la tête).
  const F=FACE[view];
  if(F){const fwd=view==='droite'?1:view==='gauche'?-1:0,top=-9+P.dy+Math.max(0,Math.round(4*uy));
   if(fwd&&gy<top&&(gx-P.dx)*fwd<F[fwd>0?1:0]*fwd+2)gx=fwd>0?Math.max(gx,1+P.dx):Math.min(gx,-1+P.dx);
   if(gy<top&&(fwd||(gx-P.dx>=F[0]-1&&gx-P.dx<=F[1]+1)))gy=top;}
  const g=[Math.round(gx),Math.round(gy)],fwd=view==='droite'?1:view==='gauche'?-1:0;
  // De profil, une lame qui couvrirait le visage recule vers la nuque : elle passe devant les
  // cheveux, jamais devant les yeux.
  if(fwd&&crossesFace(view,{g,tip:[g[0]+ux*BLADE,g[1]+uy*BLADE]},P)){
   // Plus petit déplacement de la prise (vers la nuque ou vers le bas) qui dégage le visage.
   let best=null;
   for(let b=0;b<=6&&!best;b++)for(let d=0;d<=4&&!best;d++){if(b+d===0||b+d>6)continue;
    const c=[g[0]-fwd*b,g[1]+d];if(!crossesFace(view,{g:c,tip:[c[0]+ux*BLADE,c[1]+uy*BLADE]},P))best=c;}
   if(best){gx+=best[0]-g[0];gy+=best[1]-g[1];g[0]=best[0];g[1]=best[1];}}
  return {blade:{...blade,g,tip:[g[0]+ux*BLADE,g[1]+uy*BLADE]},hands:layout()};
 }
 /** Lame levée vers le ciel : de face et de dos dès qu'elle monte franchement, de profil
  *  seulement presque verticale (sinon elle passe par-dessus l'épaule, devant les cheveux). */
 function raised(view,b){const vx=b.tip[0]-b.g[0],vy=b.tip[1]-b.g[1],l=Math.hypot(vx,vy)||1;
  return FRONTAL(view)?vy/l<-.6:vy/l<-.75&&Math.abs(vx/l)<.35;}
 /** Lame brandie au-dessus de la tête : les mains passent derrière la tête et
  *  seule la lame dépasse au-dessus des cheveux. */
 function overhead(view,blade,P){
  const vx=blade.tip[0]-blade.g[0],vy=blade.tip[1]-blade.g[1],l=Math.hypot(vx,vy)||1,ux=vx/l,uy=vy/l;
  const fwd=view==='droite'?1:view==='gauche'?-1:0,x0=fwd?fwd*1-1:-4,x1=fwd?fwd*1+1:4;
  const g=[Math.round(Math.max(Math.min(x0,x1+0),Math.min(Math.max(x0,x1),blade.g[0]-P.dx)))+P.dx,Math.round(Math.max(-21,Math.min(view==='dos'?-11:-15,blade.g[1]-P.dy)))+P.dy];
  const lo=[Math.round(g[0]-2*ux),Math.round(g[1]-2*uy)],L=lo[0]<=g[0];
  const hands=fwd?{near:g,far:lo}:{L:L?lo:g,R:L?g:lo};
  return {blade:{...blade,g,tip:[g[0]+ux*BLADE,g[1]+uy*BLADE],overhead:true},hands};
 }
 /** Une lame qui traverserait le visage passe derrière la tête (lame levée vers l'arrière). */
 function inFace(view,x,y){
  if(view==='face')return y>=-20&&y<=-14&&Math.abs(x)<=6||y>=-13&&y<=-11&&Math.abs(x)<=3;
  if(view==='droite'||view==='gauche'){const c=view==='droite'?x:-x;return y>=-20&&y<=-12&&c>=3&&c<=9;}
  return false;}
 function crossesFace(view,blade,P){
  const vx=blade.tip[0]-blade.g[0],vy=blade.tip[1]-blade.g[1],l=Math.hypot(vx,vy)||1;
  for(let t=3;t<=BLADE;t+=.5)if(inFace(view,Math.round(blade.g[0]+vx*t/l-P.dx),Math.round(blade.g[1]+vy*t/l-P.dy)))return true;return false;}
 function visualHand(w,P){return [Math.round(w[0]*.7)+P.dx,Math.round(-8+(w[1]+8)*.72)+P.dy];}
 /** Lame d'une pose moteur : même angle, longueur visible fixe (BLADE). */
 function aim(g,v){const l=Math.hypot(v[0],v[1])||1;return {g,tip:[g[0]+v[0]/l*BLADE,g[1]+v[1]/l*BLADE]};}
 function bladeOf(p,P){return aim(visualHand([p[0],p[1]],P),[p[2],p[3]]);}
 // Poses visuelles (aucune zone de coup) : main sur la fusée, direction de la lame.
 const READY={face:{g:[-1,-8],v:[-14,-9]},dos:{g:[1,-8],v:[14,-9]},droite:{g:[0,-6],v:[14,-6]},gauche:{g:[0,-6],v:[-14,-6]}};
 const GUARD={face:{g:[-2,-7],v:[17,-4]},dos:{g:[2,-7],v:[-17,-4]},droite:{g:[4,-8],v:[15,-3]},gauche:{g:[-4,-8],v:[-15,-3]}};
 // Une main occupée (utiliser, mêlée) : l'épée lourde pend dans l'autre main, pointe au sol.
 const LOW={face:{g:[-8,-5],v:[-4,10]},dos:{g:[8,-5],v:[4,10]},droite:{g:[2,-5],v:[10,7]},gauche:{g:[-2,-5],v:[-10,7]}};
 function restBlade(table,view,P){const b=table[view];return aim([b.g[0]+P.dx,b.g[1]+P.dy],b.v);}
 // Rangement / dégainage : lever la lame, la glisser par-dessus l'épaule, lâcher la poignée.
 const RAISE={face:{g:[-10,-11],v:[-3,-16]},dos:{g:[10,-11],v:[3,-16]},droite:{g:[-1,-11],v:[-5,-17]},gauche:{g:[1,-11],v:[5,-17]}};
 const STOW=Object.freeze(['ready','raise','slide','seat','release','rest']),DRAW=Object.freeze(['release','seat','slide','raise','ready']);
 const IN_SHEATH=new Set(['seat','release','rest']);
 // Fourreau sur le dos : poignée (main), gorge et bout, d'après les planches.
 const SHEATH=Object.freeze({
  dos:{hilt:[9,-16],throat:[7,-13],tip:[-3,-4]},
  face:{hilt:[-9,-15],throat:[-5,-12],tip:[5,-4]},
  droite:{hilt:[-7,-16],throat:[-5,-13],tip:[1,-4]},
  gauche:{hilt:[7,-16],throat:[5,-13],tip:[-1,-4]}
 });
 function sheathAxis(view){const S=SHEATH[view],dx=S.tip[0]-S.throat[0],dy=S.tip[1]-S.throat[1],l=Math.hypot(dx,dy);return [dx/l,dy/l];}
 /** Lame à moitié sortie du fourreau, alignée sur lui ; la main tient la fusée au-dessus de l'épaule. */
 function slideBlade(view,P){const S=SHEATH[view],[ux,uy]=sheathAxis(view),g=[S.hilt[0]+P.dx,S.hilt[1]+P.dy];
  return {...aim(g,[ux,uy]),sliding:true};}
 function hiltHand(view,P){const S=SHEATH[view],[ux,uy]=sheathAxis(view);return [Math.round(S.hilt[0]+ux)+P.dx,Math.round(S.hilt[1]+uy)+P.dy];}

 // --- Pièces statiques animées par décalage entier ---
 /** Bras source cisaillé : l'épaule reste fixe, la main se déplace de (hx, hy). */
 function shearArm(part,hx,hy){
  if(!hx&&!hy)return part;
  const ys=[...part.keys()].map(KY),minY=Math.min(...ys),maxY=Math.max(...ys),out=new Map();
  const rows=new Map();for(const [k,c] of part){const y=KY(k);if(!rows.has(y))rows.set(y,[]);rows.get(y).push([KX(k),c]);}
  let prev=null;
  for(let y=minY;y<=maxY;y++){const row=rows.get(y)||[],t=Math.min(1,(y-minY)/Math.max(1,maxY-minY-1));
   const dx=Math.round(hx*t),dy=Math.round(hy*t),yy=y+dy;
   if(prev&&yy>prev.yy+1)for(let fill=prev.yy+1;fill<yy;fill++)for(const [x,c] of prev.row)out.set(K(x+prev.dx,fill),c);
   for(const [x,c] of row)out.set(K(x+dx,yy),c);prev={yy,dx,row};}
  return out;
 }
 function sideLeg(view,x,lift,far){
  const L=SIDE_LEG[view],layer=new Map();
  L.rows.forEach((row,j)=>{for(let i=0;i<row.length;i++){const c=row[i];if(c==='.')continue;put(layer,L.x+x+i,-3+j-lift,far?SHADE[c]||c:c);}});
  return layer;
 }
 function legsLayer(view,P){
  const part=PARTS[view];
  if(FRONTAL(view)){const s=P.spread-P.legIn,out=new Map();over(out,shift(part.legL,-s,-P.liftL));over(out,shift(part.legR,s,-P.liftR));return out;}
  const fwd=view==='droite'?1:-1,out=new Map();
  // jambe éloignée puis proche ; chacune reçoit son propre contour (semelle à angles nets)
  over(out,sideLeg(view,P.far*fwd+P.dx,P.farLift,true),SOLE);
  over(out,sideLeg(view,P.near*fwd+P.dx,P.nearLift,false),SOLE);
  return out;
 }
 function lids(view,layer,dx,dy){for(const [x,y,c] of LIDS[view])put(layer,x+dx,y+dy,c);}

 // --- Composition d'une image ---
 function normalizeState(state,frame){
   if(state==='sheathed_idle')return {loc:'idle',f:frame,mode:'sheathed',phase:0};
   if(state==='sheathed_walk')return {loc:'walk',f:frame,mode:'sheathed',phase:0};
   if(state==='sheathed_dash')return {loc:'dash',f:frame,mode:'sheathed',phase:0};
   if(state==='sheathed_hurt')return {loc:'hurt',f:frame,mode:'sheathed',phase:0};
   if(state==='sheathed_use')return {loc:'use',f:frame,mode:'sheathed',phase:0};
   if(state==='sheathed_melee')return {loc:'melee',f:frame,mode:'sheathed',phase:0};
   if(state==='sheathe_walk'||state==='draw_walk')return {loc:'walk',f:frame%6,mode:state.startsWith('sheathe')?'stowing':'drawing',phase:Math.floor(frame/6)};
   if(state==='sheathe'||state==='draw')return {loc:'idle',f:0,mode:state==='sheathe'?'stowing':'drawing',phase:frame};
   return {loc:state,f:frame,mode:'drawn',phase:0};
 }
 function freeHand(view,loc,f,P,which){
  // Bras libre d'action : lever un objet ou frapper du poing. null = bras dessiné au repos.
  const side=!FRONTAL(view),fwd=view==='droite'?1:view==='gauche'?-1:0,sx=which==='L'?-1:1;
  if(loc==='use'){const e=[0,.5,1,1,.6,.2][f];if(e<.3)return null;
   if(side)return [Math.round(fwd*(2+4*e))+P.dx,Math.round(-6-3*e)+P.dy];
   return [sx*Math.round(7-4*e)+P.dx,Math.round(-5-(view==='dos'?7:5)*e)+P.dy];}
  if(loc==='melee'){const e=[-.4,-.6,.6,1,.7,.2][f];if(Math.abs(e)<.3)return null;
   if(side)return [Math.round(fwd*(2+4*e))+P.dx,-8+P.dy];
   if(e<0)return [sx*9+P.dx,-9+P.dy];
   return [sx*Math.round(7-5*e)+P.dx,Math.round(-6+(view==='dos'?-3:1)*e)+P.dy];}
  return null;
 }
 function renderPixelMap(dir,state,frame,combo,poseFn){
  assert(Number.isInteger(dir)&&dir>=0&&dir<4,'direction must be 0..3');
  assert(Object.hasOwn(STATES,state),'unknown animation '+state);
  assert(Number.isInteger(frame)&&frame>=0&&frame<STATES[state],'invalid frame '+frame);
  assert(Number.isInteger(combo)&&combo>=0&&combo<=3,'combo must be 0..3');
  assert(typeof poseFn==='function','game swordPose(dir,frame,combo) callback missing');
  const view=DIRECTIONS[dir],side=!FRONTAL(view),part=PARTS[view],v=normalizeState(state,frame),loc=v.loc;
  const P=bodyPose(view,loc,v.f,combo);
  const img=new Map();
  // Lame : pose moteur, pose de repos/garde, ou étape du rangement dans le fourreau.
  const stage=v.mode==='stowing'?STOW[v.phase]:v.mode==='drawing'?DRAW[v.phase]:null;
  const sheathed=v.mode==='sheathed'||IN_SHEATH.has(stage);
  let blade=null,two=false,smearLayer=null,reach=null;const held={};
  const armSwing=side?(loc==='walk'?P.arm:loc==='hurt'?-1:loc==='dash'?-2:0)*(view==='droite'?1:-1):0;
  if(!sheathed){
   if(stage==='raise')blade=restBlade(RAISE,view,P);
   else if(stage==='slide')blade=slideBlade(view,P);
   // Frappe : angle de la lame moteur, longueur fixe. Dernière image : retour au repos.
   else if(loc==='attack'&&v.f<5){const raw=poseFn(dir,v.f,combo);assert(raw.length===4&&raw.every(Number.isFinite),'nonfinite sword pose');blade=bladeOf(raw,P);}
   else if(loc==='use'||loc==='melee')blade={...restBlade(LOW,view,P),low:true};
   // De profil au repos, l'épée reste dans le poing du bras dessiné (la main éloignée,
   // cachée par le corps, la tient aussi) : elle suit le balancement du bras.
   else if(side&&!stage&&loc!=='guard'){const b=READY[view];blade={...aim([b.g[0]+armSwing+P.dx,b.g[1]+P.relax+P.dy],b.v),inFist:true};}
   else blade=restBlade(loc==='guard'?GUARD:READY,view,P);
   // Épée à deux mains : deux poings sur la fusée, sauf pour la ranger ou libérer une main.
   two=!stage&&!blade.low&&!blade.inFist;
   if(two){const T=raised(view,blade)?overhead(view,blade,P):twoHands(view,blade,P);blade=T.blade;Object.assign(held,T.hands);}
   else held[FRONTAL(view)?(blade.g[0]<0?'L':'R'):(blade.sliding||blade.low||stage==='raise'?'far':'near')]=blade.g;
   // Traînée sur les images de contact seulement (2 et 3) : elle ne prolonge jamais la lame.
   if(!stage&&loc==='attack'&&(v.f===2||v.f===3)){
    const pP=bodyPose(view,loc,v.f-1,combo),pb=bladeOf(poseFn(dir,v.f-1,combo),pP);
    const prev=(raised(view,pb)?overhead(view,pb,pP):twoHands(view,pb,pP)).blade;
    smearLayer=smear(new Map(),prev,blade);
   }
  }
  if(stage==='seat')reach=hiltHand(view,P);
  if(stage==='release'){const h=hiltHand(view,P),sh=FRONTAL(view)?SHOULDER[view][SHEATH[view].hilt[0]<0?'L':'R']:SHOULDER[view].far;
   reach=[Math.round((h[0]+sh[0]+P.dx)/2),Math.round((h[1]+sh[1]+P.dy)/2)];}
  if(reach)held[FRONTAL(view)?(SHEATH[view].hilt[0]<0?'L':'R'):'far']=reach;
  // Bras libre : lever un objet ou frapper du poing (main droite de face, main proche de profil).
  if(!reach&&!two&&!blade?.inFist){const free=blade?ARMS(view).find(a=>!held[a]):FRONTAL(view)?'R':'near',h=freeHand(view,loc,v.f,P,free);if(h)held[free]=h;}
  // Bras : pièces sources (repos/marche) ou bras d'action tracés de l'épaule au poing.
  // Les poings sont posés après la lame : ils serrent la fusée, la lame passe sur l'avant-bras.
  const front=new Map(),back=new Map(),hands=new Map(),fists=[];
  const behindBlade=blade&&(blade.sliding?view!=='dos':blade.low&&side||view==='dos'||blade.overhead||crossesFace(view,blade,P));
  if(FRONTAL(view)){
   for(const s of ['L','R']){
    const hand=held[s];
    if(hand){
     // De dos, les bras sont devant le corps donc cachés, sauf la main qui va au fourreau.
     const hidden=(view==='dos'||blade?.overhead)&&!stage;
     if(hidden){const layer=new Map();arm(layer,view,s,shoulderOf(view,s,hand,P),hand,true);fist(layer,hand,true);over(back,layer,true);}
     else{over(front,arm(new Map(),view,s,shoulderOf(view,s,hand,P),hand),true);over(hands,fist(new Map(),hand));fists.push(hand);}
    }
    else{const src=s==='L'?part.armL:part.armR,sw=s==='L'?P.swingL:P.swingR;over(front,shift(shearArm(src,0,sw+P.relax),P.dx,P.dy));}
   }
  }else{
   const fwd=view==='droite'?1:-1;
   // À deux mains, le bras éloigné est caché par le corps : seul son poing serre la fusée.
   if(held.far&&two&&!blade.overhead)over(hands,fist(new Map(),held.far,true));
   else if(held.far&&two);
   else if(held.far){const layer=new Map();arm(layer,view,'far',shoulderOf(view,'far',held.far,P),held.far,true);fist(layer,held.far,true);over(back,layer,true);}
   if(held.near&&blade?.overhead){const layer=new Map();arm(layer,view,'near',shoulderOf(view,'near',held.near,P),held.near,true);fist(layer,held.near,true);over(back,layer,true);}
   else if(held.near){over(front,arm(new Map(),view,'near',shoulderOf(view,'near',held.near,P),held.near),true);over(hands,fist(new Map(),held.near));fists.push(held.near);}
   else{const swing=armSwing;
    if(!swing&&!P.relax)over(front,shift(part.arm,P.dx,P.dy));
    else over(front,shift(shearArm(ARM_FILL[view],swing,P.relax),P.dx,P.dy),HANGING);}
  }
  // Ordre de dessin : lame arrière, bras arrière, jambes, tronc, tête, poignée rangée,
  // bras avant, épaulières, lame avant, poings.
  const swordLayer=blade?sword(new Map(),blade.g,blade.tip):null;
  if(blade&&behindBlade){if(smearLayer)over(img,smearLayer);drawSword(img,swordLayer);}
  over(img,back);
  over(img,legsLayer(view,P));
  if(side)over(img,shift(sprite(view,UNDER_ARM[view]),P.dx,P.dy));
  over(img,shift(part.body,P.dx,P.dy));
  // La traînée d'une lame tenue devant passe sur le corps mais derrière la tête.
  if(smearLayer&&!behindBlade)over(img,smearLayer);
  const head=shift(part.head,P.hx,P.hy);
  if(P.blink)lids(view,head,P.hx,P.hy);
  over(img,head);
  // Coup vertical vu de dos : la lame passe par-dessus la tête, sa traînée aussi.
  if(smearLayer&&view==='dos'&&blade.overhead)over(img,smearLayer);
  if(P.head)over(img,shift(part.collar,P.dx,P.dy));
  if(sheathed&&HILT[view])over(img,shift(sprite(view,HILT[view]),P.dx,P.dy));
  if(blade?.inFist)drawSword(img,swordLayer);
  over(img,front);
  // Les épaulières de fourrure restent par-dessus le haut d'un bras d'action, jamais sur un poing.
  if(view!=='dos'&&fists.length)for(const [k,c] of shift(part.fur,P.dx,P.dy)){
   if(!front.has(k))continue;const x=KX(k),y=KY(k);
   if(fists.some(h=>Math.abs(x-h[0])<=2&&Math.abs(y-h[1])<=2))continue;img.set(k,c);}
  if(blade&&!behindBlade&&!blade.inFist)drawSword(img,swordLayer);
  over(img,hands);
  return finish(img);
 }
 /** Finition de silhouette : tout bord reçoit son contour d'un pixel (même quand une pièce
  *  bouge et découvre un bord) et les petits trous fermés se bouchent. Les traînées tramées
  *  (smears) restent ajourées. */
 const SMEAR_KEYS=new Set(['e','E','W']);
 function finish(img){
  const add=[];
  for(const [k,c] of img){if(c==='O'||SMEAR_KEYS.has(c))continue;const x=KX(k),y=KY(k);
   for(const [dx,dy] of AROUND){const n=K(x+dx,y+dy);if(!img.has(n))add.push(n);}}
  for(const n of add)img.set(n,'O');
  let x0=Infinity,y0=Infinity,x1=-Infinity,y1=-Infinity;
  for(const k of img.keys()){const x=KX(k),y=KY(k);if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y;}
  const out=new Set(),stack=[];
  for(let x=x0-1;x<=x1+1;x++)stack.push(K(x,y0-1),K(x,y1+1));
  for(let y=y0-1;y<=y1+1;y++)stack.push(K(x0-1,y),K(x1+1,y));
  while(stack.length){const k=stack.pop();if(out.has(k)||img.has(k))continue;const x=KX(k),y=KY(k);if(x<x0-1||x>x1+1||y<y0-1||y>y1+1)continue;
   out.add(k);for(const [dx,dy] of AROUND)stack.push(K(x+dx,y+dy));}
  const seen=new Set();
  for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){const k=K(x,y);if(img.has(k)||out.has(k)||seen.has(k))continue;
   const hole=[],q=[k];let smear=false;seen.add(k);
   while(q.length){const h=q.pop();hole.push(h);for(const [dx,dy] of AROUND){const n=K(KX(h)+dx,KY(h)+dy),c=img.get(n);
    if(c===undefined){if(!seen.has(n)){seen.add(n);q.push(n);}}else if(SMEAR_KEYS.has(c))smear=true;}}
   if(!smear&&hole.length<=4)for(const h of hole)img.set(h,'O');}
  return img;
 }
 function draw(context,dir=2,state='idle',frame=0,combo=0,poseFn){
  const pixels=renderPixelMap(dir,state,frame,combo,poseFn);
  for(const [k,c] of pixels){const color=PALETTE[c];if(!color)continue;
   const x=KX(k),y=KY(k);if(x+ANCHOR.x<0||x+ANCHOR.x>=CELL||y+ANCHOR.y<0||y+ANCHOR.y>=CELL)continue;
   context.fillStyle=color;context.fillRect(x,y,1,1);}
 }
 const RGB=Object.fromEntries(Object.entries(PALETTE).map(([k,h])=>[k,[parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)]]));
 function raster(opts={}){
  const {dir=2,state='idle',frame=0,combo=0,swordPose}=opts;
  const pixels=renderPixelMap(dir,state,frame,combo,swordPose),data=new Uint8ClampedArray(CELL*CELL*4);
  for(const [k,c] of pixels){const X=ANCHOR.x+KX(k),Y=ANCHOR.y+KY(k);if(X<0||X>=CELL||Y<0||Y>=CELL)continue;
   const rgb=RGB[c];if(!rgb)continue;const i=(Y*CELL+X)*4;data[i]=rgb[0];data[i+1]=rgb[1];data[i+2]=rgb[2];data[i+3]=255;}
  return {width:CELL,height:CELL,anchor:ANCHOR,data};
 }
 // Respiration lente et clignement, comme le repos des batraciens (boucle de 4,3 s).
 const IDLE_TIMELINE=[[0,1.30],[1,.22],[2,.70],[1,.30],[3,.16],[0,1.62]];
 const IDLE_LOOP=IDLE_TIMELINE.reduce((a,[,d])=>a+d,0);
 function idleFrame(seconds){let t=(Math.max(0,Number.isFinite(seconds)?seconds:0))%IDLE_LOOP;for(const [f,d] of IDLE_TIMELINE){if(t<d)return f;t-=d;}return 0;}
 function weaponVisual(actor,time,state='idle',frame=0){
  // A strictly visual state machine. No swing duration, stamina, hitbox or
  // movement delay is introduced. Clock is game-time, never wall-clock.
  const t=Number.isFinite(time)?time:0;
  let b=actor.kaldorWeapon;
  if(!b||!Number.isFinite(b.lastTime)||t<b.lastTime-0.001){
   b={mode:'drawn',lastAttack:t,lastTime:t,phaseAt:t,wasAttacking:false};actor.kaldorWeapon=b;
  }
  const attacking=(actor.attack||0)>0,guarding=!!(actor.guard||(actor.guardTime||0)>0),
   forced=(actor.hurt||0)>0||(actor.useTime||0)>0||(actor.melee||0)>0||!!actor.held||!!actor.thrown;
  if(attacking){
   if(!b.wasAttacking){b.lastAttack=t;b.mode='drawn';b.phaseAt=t;}
   b.wasAttacking=true;
  }else b.wasAttacking=false;
  b.lastTime=t;
  if(guarding){
   if(b.mode==='sheathed'||b.mode==='stowing'){
    b.mode='drawing';b.phaseAt=t;
   }
   b.lastAttack=t;
  }
  if(b.mode==='drawing'&&t-b.phaseAt>=HOLSTER.draw)b.mode='drawn';
  if(b.mode==='stowing'&&t-b.phaseAt>=HOLSTER.stow)b.mode='sheathed';
  if(!attacking&&!guarding&&!forced&&b.mode==='drawn'&&t-b.lastAttack>=HOLSTER.delay){
   b.mode='stowing';b.phaseAt=t;
  }
  if(attacking)return {state,frame,mode:'drawn'};
  if(forced){ // visual only: impact/use never summons a sheathed sword into the hand.
    if(b.mode==='stowing'){b.mode='drawn';b.lastAttack=t;}
    if(b.mode==='sheathed'&&['hurt','use','melee'].includes(state))
      return {state:'sheathed_'+state,frame,mode:b.mode};
    return {state,frame,mode:b.mode};
  }
  const walking=state==='walk'&&!!actor.moving;
  if(b.mode==='stowing'){
   const phase=Math.min(5,Math.floor((t-b.phaseAt)/HOLSTER.stow*6));
   return walking?{state:'sheathe_walk',frame:phase*6+(frame%6),mode:b.mode}:
      {state:'sheathe',frame:phase,mode:b.mode};
  }
  if(b.mode==='drawing'){
   const phase=Math.min(4,Math.floor((t-b.phaseAt)/HOLSTER.draw*5));
   return walking?{state:'draw_walk',frame:phase*6+(frame%6),mode:b.mode}:
      {state:'draw',frame:phase,mode:b.mode};
  }
  if(b.mode==='sheathed'){
   if(walking)return {state:'sheathed_walk',frame:frame%6,mode:b.mode};
   if(state==='dash')return {state:'sheathed_dash',frame:frame%4,mode:b.mode};
   if(state==='idle')return {state:'sheathed_idle',frame:frame%4,mode:b.mode};
  }
  return {state,frame,mode:b.mode};
 }
 return Object.freeze({version:5,cell:CELL,anchor:ANCHOR,palette:PALETTE,views:VIEWS,directions:DIRECTIONS,states:STATES,holster:HOLSTER,draw,raster,idleFrame,weaponVisual});
});
