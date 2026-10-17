/* Hearthreaver — Kaldor, long-haired barbarian hero, chibi pixel art v4.
 * Même grammaire que les batraciens : petites grilles dessinées pixel par pixel,
 * contour sombre, lumière en haut à gauche, animation minimaliste par décalages
 * entiers d'un pixel. Quatre vues indépendantes (dos, droite, face, gauche).
 * L'épée, les bras d'action et les smears sont tracés en JavaScript à partir de
 * la pose moteur swordPose() : la lame en garde l'angle et la longueur. Épée à
 * deux mains, tenue à deux mains dès qu'elle est sortie ; bras courts jamais étirés.
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
 /** O contour ; x encre (yeux) ; H h j k q cheveux et barbe ; s m a p i peau ;
  *  r bouche ; d b c fourrure ; u v w t cuir ; G Y laiton ; 1 2 3 4 acier ;
  *  e E W traînée (smear). Les teintes cuir, fourrure et contour sont celles des batraciens. */
 const PALETTE=Object.freeze({
  O:'#100e20',x:'#100e20',
  H:'#2a1c22',h:'#3d2a2c',j:'#563a33',k:'#74503d',q:'#946746',
  s:'#7d4a34',m:'#a56b48',a:'#c98f5e',p:'#e8b47c',i:'#f6d29c',r:'#9a5a42',
  d:'#b9a16b',b:'#e1c58a',c:'#f3dfa4',
  u:'#50342f',v:'#754b37',w:'#a16a44',t:'#bb8051',
  G:'#a8803a',Y:'#ecd189',
  1:'#3b4551',2:'#728396',3:'#b4c0c8',4:'#eef0ea',
  e:'#c49a5c',E:'#f2dc9c',W:'#fff5da'
 });
 // Quatre dessins indépendants, 22 lignes ; la dernière ligne est celle des pieds (y = 0).
 // Le profil gauche n'est pas une image retournée : la lumière reste en haut à gauche.
 const VIEWS={
  face:[
   '.....OOO.OOOOO.....',
   '...OOkqjOjkkjhOO...',
   '..OjqkjhkqkjhjhhO..',
   '.OjkjhkjjhkjhjjHhO.',
   '.OkjhjhkjhkjhjhHhO.',
   '.OjhHjhapppahjhHhO.',
   '.OjhhxxxpppxxxhHhO.',
   '.OjhapxxpipxxpmhHO.',
   '.OjhmapppmppaamhHO.',
   '.OjhkajkkkkjamhHhO.',
   'ObchjhjkrrrkjhjhcbO',
   'ObccbhjjkjkjjhbccbO',
   'OdbccdOjjkjjOdccbdO',
   'OpamOwvuapauvuOamsO',
   'OvvuOvwvuauvvuOvvuO',
   'OwvuOuuOGYGOuuOwvuO',
   'OpamOwvwvuvwvuOamsO',
   '.OOOOuvwvuvwvuOOOO.',
   '...OOpamO.OpamOO...',
   '...ObcbdO.ObcbdO...',
   '..OuvwwtO.OvwwtuO..',
   '..OOOOOOO.OOOOOOO..'
  ],
  droite:[
   '......OOO.OO......',
   '....OOkqjOjOO.....',
   '...OjqkjhkqkjO....',
   '..OjkjhkjjhkkjO...',
   '..OkjhjhkjjhjjjO..',
   '..OjhjHjhkjppppO..',
   '..OjhjhjappxxpaO..',
   '..OhjhjhpapxxppO..',
   '..OHjhjhmappppaO..',
   '..OhHjhjhkjkkrkO..',
   '..OhhjHjhkjkkkO...',
   '..OhjhObccbkjkO...',
   '..OhjbcccbbdkO....',
   '..OuvOpaamOwtO....',
   '..OuvOpiamOvwtO...',
   '..OuuOwvvuOuYGO...',
   '..OvwOpaamOwtO....',
   '..OvwtOOOOwvO.....',
   '...OmaOpaamO......',
   '...OdbObcbbO......',
   '..OuvOuvwwttO.....',
   '..OOOOOOOOOOO.....'
  ],
  dos:[
   '.....OOO.OOOOO.....',
   '...OOkqjOjkkjhOO...',
   '..OjqkjhkqkjhjhhO..',
   '.OjkjhkjjhkjhjjHhO.',
   '.OkjhjhkjhkjhjhHhO.',
   '.OjhHjhkjhjhkjhHhO.',
   '.OjhjHjhkjjhkjHjhO.',
   '.OjhjhHjhkjhjHjhHO.',
   '.OHjhjhHjhjjHjhjHO.',
   '.OhHjhjhHjhHjhjHhO.',
   'ObchHjhjhHjhjhHhcbO',
   'ObccbhHjhjhjHhbccbO',
   'OdbccdOhHhHhOdccbdO',
   'OmamOvwtvwvtvuOamsO',
   'OvvuOwtvwvwvvuOvvuO',
   'OwvuOuuuuuuuuuOwvuO',
   'OmamOwvwvuvwvuOamsO',
   '.OOOOuvwvuvwvuOOOO.',
   '...OOmamO.OmamOO...',
   '...ObcbdO.ObcbdO...',
   '..OuvwwtO.OvwwtuO..',
   '..OOOOOOO.OOOOOOO..'
  ],
  gauche:[
   '......OO.OOO......',
   '.....OOjOjqkOO....',
   '....OjkqkhjkqjO...',
   '...OjkkhjjkhjkjO..',
   '..OjjjhjjkhjhjkO..',
   '..OppppjkhjHjhjO..',
   '..OpaxxppajhjhjO..',
   '..OipxxpaphjhjhO..',
   '..OappppamhjhjHO..',
   '..OkrkkjkhjhjHhO..',
   '...OkkkjkhjHjhhO..',
   '...OkjkbccbOhjhO..',
   '....OkbcccbbdjhO..',
   '....OtwOpaamOvuO..',
   '...OtwvOpiamOvuO..',
   '...OGYuOwvvuOuuO..',
   '....OtwOpaamOwvO..',
   '.....OvwOOOOtwvO..',
   '......OpaamOamO...',
   '......ObcbbObdO...',
   '.....OttwwvuOvuO..',
   '.....OOOOOOOOOOO..'
  ]
 };
 // Colonne de l'axe du corps (x = 0) dans chaque grille.
 const ORIGIN=Object.freeze({face:9,dos:9,droite:8,gauche:9});
 const TOP=21;
 function assert(cond,msg){if(!cond)throw new Error('Kaldor Art: '+msg);}
 for(const [view,rows] of Object.entries(VIEWS)){
  assert(rows.length===22,view+' doit compter 22 lignes');
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
 const AROUND=[[1,0],[-1,0],[0,1],[0,-1]],HANGING=[[1,0],[-1,0],[0,1]];
 function border(layer,dirs=AROUND){const out=new Map();for(const k of layer.keys()){const x=KX(k),y=KY(k);
   for(const [dx,dy] of dirs){const n=K(x+dx,y+dy);if(!layer.has(n))out.set(n,'O');}}return out;}
 /** Pose un calque ; outline=true ajoute un contour d'un pixel, posé avant les couleurs. */
 function over(target,layer,outline=false){if(outline)for(const [k,c] of border(layer,outline===true?AROUND:outline))target.set(k,c);for(const [k,c] of layer)target.set(k,c);return target;}

 // --- Découpage des vues en pièces articulées (sources inchangées) ---
 const FRONTAL=v=>v==='face'||v==='dos';
 function region(view,col,row){
  if(FRONTAL(view)){
   if(row<=9)return 'head';
   if(row===10&&col>=3&&col<=15)return 'head';
   if(row===11&&col>=5&&col<=13)return 'head';
   if(row===12&&col>=6&&col<=12)return 'head';
   if(row>=13&&row<=17&&col<=3)return 'armL';
   if(row>=13&&row<=17&&col>=15)return 'armR';
   if(row>=18)return col<=8?'legL':'legR';
   return 'body';
  }
  const east=view==='droite',c=east?col:17-col;
  if(row<=10)return 'head';
  if(row===11&&((c>=3&&c<=6)||(c>=11&&c<=15)))return 'head';
  if(row===12&&c>=12&&c<=15)return 'head';
  if(row>=13&&row<=16&&c>=5&&c<=10)return 'arm';
  if(row===17&&c>=6&&c<=9)return 'arm';
  if(row>=18)return 'legs';
  return 'body';
 }
 const PARTS={};
 for(const [view,rows] of Object.entries(VIEWS)){
  const part={head:new Map(),body:new Map(),collar:new Map(),armL:new Map(),armR:new Map(),arm:new Map(),legL:new Map(),legR:new Map(),legs:new Map()};
  rows.forEach((row,r)=>{for(let c=0;c<row.length;c++){const key=row[c];if(key==='.')continue;const where=region(view,c,r);part[where].set(K(c-ORIGIN[view],r-TOP),key);
   // Col de fourrure autour de la tête : repeint par-dessus quand la tête s'abaisse d'un pixel.
   if(where==='body'&&r<=12)part.collar.set(K(c-ORIGIN[view],r-TOP),key);}});
  PARTS[view]=part;
 }
 // Bras de profil sans son contour : cisaillé puis recerné, pour éviter les contours en escalier.
 const ARM_FILL={};for(const view of ['droite','gauche'])ARM_FILL[view]=new Map([...PARTS[view].arm].filter(([,c])=>c!=='O'));
 // Tronc peint sous le bras de profil : invisible au repos, révélé quand le bras bouge.
 const UNDER_ARM={droite:['vwvwtw','vwvwvt','uuuuuY','vwvwvt','wvwvwv'],gauche:['wtwvwv','twvwvv','Yuuuuu','twvwvv','vwvwvw']};
 // Jambes de profil (pied vers l'avant). La jambe éloignée est assombrie, pas redessinée.
 const SIDE_LEG={droite:['.pa..','.bcb.','uvwtt'],gauche:['..pa.','.bcb.','ttwvu']};
 const SHADE=Object.freeze({i:'p',p:'a',a:'m',m:'s',s:'s',c:'b',b:'d',d:'v',t:'w',w:'v',v:'u',u:'u'});
 // Yeux fermés (clignement, douleur) : les sourcils restent, la pupille devient peau.
 const LIDS={face:[[-3,-14,'p'],[-2,-14,'a'],[2,-14,'a'],[3,-14,'p']],dos:[],
  droite:[[3,-14,'a'],[4,-14,'p']],gauche:[[-3,-14,'a'],[-4,-14,'p']]};

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
   const side=d*lit,skin=side>.45?'p':side<-.45?'m':'a',leather=side>.45?'w':side<-.45?'u':'v';
   let key=bracer&&t>len-3.6&&t<len-.9&&len>3?leather:skin;
   if(dark)key=SHADE[key]||key;
   if(!layer.has(K(x,y))||key!==undefined)put(layer,x,y,key);
  }
  return layer;
 }
 function fist(layer,at,dark=false){const x=Math.round(at[0]),y=Math.round(at[1]);
  const keys=[['p','a'],['a','m']];
  for(let j=0;j<2;j++)for(let i=0;i<2;i++){let k=keys[j][i];if(dark)k=SHADE[k];put(layer,x-1+i,y-1+j,k);}
  return layer;
 }
 /** Épée : pommeau, fusée, garde, lame à biseau éclairé. g = main, tip = pointe réelle. */
 function sword(layer,g,tip){
  const vx=tip[0]-g[0],vy=tip[1]-g[1],len=Math.max(4,Math.hypot(vx,vy)),ux=vx/len,uy=vy/len,nx=-uy,ny=ux;
  const at=(t,n=0)=>[g[0]+ux*t+nx*n,g[1]+uy*t+ny*n];
  const litN=(nx*LIGHT[0]+ny*LIGHT[1])>=0?1:-1;
  const edge=Math.abs(nx)>Math.abs(ny)?[Math.sign(nx*litN),0]:[0,Math.sign(ny*litN)];
  const blade=linePoints(...at(3),...at(len));
  for(const [x,y] of blade){put(layer,x+edge[0],y+edge[1],'4');}
  for(const [x,y] of blade)put(layer,x,y,'3');
  const [tx,ty]=blade[blade.length-1];put(layer,tx,ty,'4');
  for(const [x,y] of linePoints(...at(-3),...at(1)))put(layer,x,y,'v');
  put(layer,...at(-3.2),'3');put(layer,...at(-4),'4');
  for(let n=-2;n<=2;n++)put(layer,...at(2,n),Math.abs(n)===2?'G':'Y');
  return layer;
 }
 /** Fourreau en cuir sur le dos ; la poignée n'apparaît que si l'épée est rangée. */
 const SHEATH=Object.freeze({
  dos:{hilt:[7,-15],throat:[4,-11],tip:[-5,-3]},
  face:{hilt:[-7,-15],throat:[-4,-11],tip:[5,-3]},
  droite:{hilt:[-8,-15],throat:[-6,-12],tip:[1,-3]},
  gauche:{hilt:[8,-15],throat:[6,-12],tip:[-1,-3]}
 });
 function scabbard(layer,view,withHilt){
  const S=SHEATH[view],a=S.throat,b=S.tip,vx=b[0]-a[0],vy=b[1]-a[1],len=Math.hypot(vx,vy),ux=vx/len,uy=vy/len;
  const pts=linePoints(...a,...b),lit=ux<0?1:-1;
  for(const [x,y] of pts){put(layer,x-lit,y,'u');put(layer,x+lit,y,'w');}
  for(const [x,y] of pts)put(layer,x,y,'v');
  for(const n of [-1,0,1])put(layer,a[0]+n,a[1],n?'G':'Y');
  put(layer,b[0],b[1],'G');
  if(withHilt){
   const h=S.hilt,grip=linePoints(...h,...a).slice(0,-1);
   for(const [x,y] of grip){put(layer,x,y,'u');put(layer,x+lit,y,'v');}
   put(layer,h[0],h[1],'3');put(layer,h[0]+lit,h[1],'2');put(layer,h[0],h[1]-1,'4');put(layer,h[0]+lit,h[1]-1,'3');
  }
  return layer;
 }
 /** Traînée de lame : croissant plein entre deux poses, bord blanc, cœur bleuté, départ tramé. */
 function smear(layer,A,B,strength=1){
  const a0=Math.atan2(A.tip[1]-A.g[1],A.tip[0]-A.g[0]),a1=Math.atan2(B.tip[1]-B.g[1],B.tip[0]-B.g[0]);
  let da=a1-a0;while(da>Math.PI)da-=2*Math.PI;while(da<-Math.PI)da+=2*Math.PI;
  const l0=Math.hypot(A.tip[0]-A.g[0],A.tip[1]-A.g[1]),l1=Math.hypot(B.tip[0]-B.g[0],B.tip[1]-B.g[1]);
  const steps=Math.max(10,Math.ceil(Math.abs(da)*Math.max(l0,l1)*1.6)+Math.ceil(Math.hypot(B.g[0]-A.g[0],B.g[1]-A.g[1])*2));
  const cells=new Map();
  for(let i=0;i<=steps;i++){
   const t=i/steps,ang=a0+da*t,len=l0+(l1-l0)*t,gx=A.g[0]+(B.g[0]-A.g[0])*t,gy=A.g[1]+(B.g[1]-A.g[1])*t;
   const width=len*(strength<1?.18:.22+.36*t);
   for(let r=len-width;r<=len+.01;r+=.35){
    const x=Math.round(gx+Math.cos(ang)*r),y=Math.round(gy+Math.sin(ang)*r),depth=len-r,k=K(x,y);
    const prev=cells.get(k);if(prev===undefined||depth<prev.depth)cells.set(k,{depth,t});
   }
  }
  for(const [k,{depth,t}] of cells){
   const x=KX(k),y=KY(k);
   if(t<.22&&((x+y)&1))continue;
   if(strength<1&&((x+y)&1))continue;
   const key=depth<1.1?(strength<1?'E':'W'):depth<2.6?'E':'e';
   layer.set(k,key);
  }
  return layer;
 }

 // --- Poses ---
 // La tête suit le buste avec une image de retard (1 px) : léger bobbing sans trou au cou.
 const WALK={bob:[0,1,0,0,1,0],head:[0,0,1,0,0,1],liftL:[0,0,0,0,1,1],liftR:[0,1,1,0,0,0],swing:[1,1,0,-1,-1,0]};
 // Profil : petits pas de chibi, les deux pieds restent sous le corps (écart maximal de 3 px).
 // Décalages par rapport à la pose debout ; la jambe qui passe devant se lève d'un pixel.
 const SIDE_WALK={near:[1,0,-1,-2,-1,0],far:[0,1,2,3,2,1],nearLift:[0,0,0,0,1,1],farLift:[0,1,1,0,0,0],arm:[-1,-1,1,1,1,-1]};
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
   if(loc==='guard'){P.dy=1;P.head=0;P.relax=0;P.swingL=P.swingR=0;if(side){P.near+=1;P.far-=1;}else{P.legIn=0;P.spread=1;}}}
  else if(loc==='attack'){
   // Fente comme sur la planche : appuis écartés, buste abaissé d'un pixel qui recule à
   // l'armé puis plonge vers l'avant ; la tête suit le coup avec un pixel de retard.
   const lean=[0,-1,1,2,1,0][f],spread=[2,2,3,3,2,1][f];
   P.dx=side?lean*fwd:0;P.dy=f<5?1:0;P.head=f===3?1:0;
   if(side){P.near=spread;P.far=-spread;}else P.spread=spread>2?2:1;
  }
  else if(loc==='dash'){const w=f%4;P.dx=side?fwd*2:0;P.dy=1;P.near=side?[2,1,2,1][w]:0;P.far=side?-1:0;P.nearLift=side?1:0;
   P.liftL=!side&&w%2===0?1:0;P.liftR=!side&&w%2===1?1:0;P.swingL=!side?-1:0;P.swingR=!side?-1:0;}
  else if(loc==='hurt'){const back=[-1,-2,-1,0][f];P.dx=side?back*fwd:0;P.dy=[1,1,0,0][f];P.hx=side?[-1,-1,0,0][f]*fwd:0;P.blink=f<3;P.swingL=P.swingR=-1;}
  else if(loc==='use'||loc==='melee'){P.dx=side?[0,0,1,1,0,0][f]*fwd:0;P.dy=[0,0,1,1,0,0][f];}
  P.hx+=P.dx;P.hy+=P.dy+P.head;return P;
 }
 // Épaules, prise et visée de la lame. Le poignet moteur est ramené vers le torse
 // (bras courts de chibi) ; la lame garde l'angle et la longueur de la lame moteur.
 const SHOULDER={face:{L:[-7,-8],R:[7,-8]},dos:{L:[-7,-8],R:[7,-8]},droite:{near:[0,-8],far:[-3,-9]},gauche:{near:[0,-8],far:[3,-9]}};
 // Portée maximale d'un bras, de l'épaule au poing : un bras ne s'étire jamais au-delà.
 const REACH={face:8,dos:8,droite:7,gauche:7};
 const ARMS=view=>FRONTAL(view)?['L','R']:['near','far'];
 /** Épaule d'un bras ; elle monte d'un ou deux pixels quand la main passe au-dessus. */
 function shoulderOf(view,arm,hand,P){const s=SHOULDER[view][arm],x=s[0]+P.dx,y=s[1]+P.dy;
  return [x,y-Math.max(0,Math.min(2,Math.round((y-hand[1]-3)/2)))];}
 function span(view,arm,hand,P){const s=shoulderOf(view,arm,hand,P);return Math.hypot(hand[0]-s[0],hand[1]-s[1]);}
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
  if(F){const fwd=view==='droite'?1:view==='gauche'?-1:0,top=-8+P.dy+Math.max(0,Math.round(4*uy));
   if(fwd&&gy<top&&(gx-P.dx)*fwd<F[fwd>0?1:0]*fwd+2)gx=fwd>0?Math.max(gx,1+P.dx):Math.min(gx,-1+P.dx);
   if(gy<top&&(fwd||(gx-P.dx>=F[0]-1&&gx-P.dx<=F[1]+1)))gy=top;}
  const g=[Math.round(gx),Math.round(gy)];
  return {blade:{...blade,g,tip:[g[0]+vx,g[1]+vy]},hands:layout()};
 }
 // Zone du visage (x min, x max, y min, y max) ; dos : aucune.
 const FACE={face:[-5,5,-19,-10],droite:[1,7,-18,-10],gauche:[-7,-1,-18,-10]};
 /** Une lame qui traverserait le visage passe derrière la tête (lame levée vers l'arrière). */
 function crossesFace(view,blade,P){const F=FACE[view];if(!F)return false;
  const vx=blade.tip[0]-blade.g[0],vy=blade.tip[1]-blade.g[1],l=Math.hypot(vx,vy)||1;
  for(let t=3;t<=l;t+=.5){const x=blade.g[0]+vx*t/l-P.dx,y=blade.g[1]+vy*t/l-P.dy;if(x>=F[0]&&x<=F[1]&&y>=F[2]&&y<=F[3])return true;}return false;}
 function visualHand(w,P){return [Math.round(w[0]*.7)+P.dx,Math.round(-8+(w[1]+8)*.72)+P.dy];}
 function bladeOf(p,P){const g=visualHand([p[0],p[1]],P);return {g,tip:[g[0]+p[2],g[1]+p[3]]};}
 // Poses visuelles (aucune zone de coup), à deux mains : la lame reste hors du visage.
 const READY={face:{g:[-1,-6],tip:[-14,-16]},dos:{g:[1,-6],tip:[14,-16]},droite:{g:[3,-6],tip:[15,-17]},gauche:{g:[-3,-6],tip:[-15,-17]}};
 const GUARD={face:{g:[-2,-7],tip:[15,-11]},dos:{g:[2,-7],tip:[-15,-11]},droite:{g:[4,-8],tip:[19,-11]},gauche:{g:[-4,-8],tip:[-19,-11]}};
 // Une main occupée (utiliser, mêlée) : l'épée lourde pend dans l'autre main, pointe au sol.
 const LOW={face:{g:[-8,-5],tip:[-12,6]},dos:{g:[8,-5],tip:[12,6]},droite:{g:[2,-5],tip:[12,2]},gauche:{g:[-2,-5],tip:[-12,2]}};
 function restBlade(table,view,P){const b=table[view];return {g:[b.g[0]+P.dx,b.g[1]+P.dy],tip:[b.tip[0]+P.dx,b.tip[1]+P.dy]};}
 // Rangement / dégainage : lever la lame, la glisser par-dessus l'épaule, lâcher la poignée.
 const RAISE={face:{g:[-9,-11],tip:[-12,-27]},dos:{g:[9,-11],tip:[12,-27]},droite:{g:[-1,-11],tip:[-6,-28]},gauche:{g:[1,-11],tip:[6,-28]}};
 const STOW=Object.freeze(['ready','raise','slide','seat','release','rest']),DRAW=Object.freeze(['release','seat','slide','raise','ready']);
 const IN_SHEATH=new Set(['seat','release','rest']);
 function sheathAxis(view){const S=SHEATH[view],dx=S.tip[0]-S.throat[0],dy=S.tip[1]-S.throat[1],l=Math.hypot(dx,dy);return [dx/l,dy/l];}
 /** Lame à moitié sortie du fourreau, alignée sur lui ; la main tient la fusée au-dessus de l'épaule. */
 function slideBlade(view,P){const S=SHEATH[view],[ux,uy]=sheathAxis(view),g=[S.hilt[0]+P.dx,S.hilt[1]+P.dy];
  return {g,tip:[g[0]+ux*15,g[1]+uy*15],sliding:true};}
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
  const rows=SIDE_LEG[view],layer=new Map(),w=rows[0].length;
  rows.forEach((row,j)=>{for(let i=0;i<w;i++){const c=row[i];if(c==='.')continue;put(layer,x+i,-3+j-lift,far?SHADE[c]||c:c);}});
  return layer;
 }
 function legsLayer(view,P){
  const part=PARTS[view];
  if(FRONTAL(view)){const s=P.spread-P.legIn,out=new Map();over(out,shift(part.legL,-s,-P.liftL));over(out,shift(part.legR,s,-P.liftR));return out;}
  const east=view==='droite',out=new Map();
  // jambe éloignée puis proche ; chacune reçoit son propre contour
  const farX=east?-5:1,nearX=east?-1:-3,fwd=east?1:-1;
  over(out,sideLeg(view,farX+P.far*fwd,P.farLift,true));
  over(out,sideLeg(view,nearX+P.near*fwd,P.nearLift,false));
  return over(new Map(),out,true);
 }
 function underArm(view,dx,dy){
  const rows=UNDER_ARM[view],layer=new Map(),c0=view==='droite'?5:7;
  rows.forEach((row,j)=>{for(let i=0;i<row.length;i++)put(layer,c0+i-ORIGIN[view]+dx,13+j-TOP+dy,row[i]);});
  return layer;
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
  if(!sheathed){
   if(stage==='raise')blade=restBlade(RAISE,view,P);
   else if(stage==='slide')blade=slideBlade(view,P);
   // Frappe : angle et longueur de la lame moteur. Dernière image : retour au repos.
   else if(loc==='attack'&&v.f<5){const raw=poseFn(dir,v.f,combo);assert(raw.length===4&&raw.every(Number.isFinite),'nonfinite sword pose');blade=bladeOf(raw,P);}
   else if(loc==='use'||loc==='melee')blade={...restBlade(LOW,view,P),low:true};
   else blade=restBlade(loc==='guard'?GUARD:READY,view,P);
   // Épée à deux mains : deux poings sur la fusée, sauf pour la ranger ou libérer une main.
   two=!stage&&!blade.low;
   if(two){const T=twoHands(view,blade,P);blade=T.blade;Object.assign(held,T.hands);}
   else held[FRONTAL(view)?(blade.g[0]<0?'L':'R'):(blade.sliding||blade.low||stage==='raise'?'far':'near')]=blade.g;
   if(!stage&&loc==='attack'&&v.f>=2&&v.f<=4){
    const pP=bodyPose(view,loc,v.f-1,combo),prev=twoHands(view,bladeOf(poseFn(dir,v.f-1,combo),pP),pP).blade;
    smearLayer=smear(new Map(),prev,blade,v.f===4?.5:1);
   }
  }
  if(stage==='seat')reach=hiltHand(view,P);
  if(stage==='release'){const h=hiltHand(view,P),sh=FRONTAL(view)?SHOULDER[view][SHEATH[view].hilt[0]<0?'L':'R']:SHOULDER[view].far;
   reach=[Math.round((h[0]+sh[0]+P.dx)/2),Math.round((h[1]+sh[1]+P.dy)/2)];}
  if(reach)held[FRONTAL(view)?(SHEATH[view].hilt[0]<0?'L':'R'):'far']=reach;
  // Bras libre : lever un objet ou frapper du poing (main droite de face, main proche de profil).
  if(!reach&&!two){const free=blade?ARMS(view).find(a=>!held[a]):FRONTAL(view)?'R':'near',h=freeHand(view,loc,v.f,P,free);if(h)held[free]=h;}
  // Bras : pièces sources (repos/marche) ou bras d'action tracés de l'épaule au poing.
  const front=new Map(),back=new Map(),grip=new Map();
  const behindBlade=blade&&(blade.sliding?view!=='dos':blade.low&&side||view==='dos'||(view==='droite'&&blade.tip[0]<blade.g[0]-4)||(view==='gauche'&&blade.tip[0]>blade.g[0]+4)||(FRONTAL(view)&&blade.tip[1]<-24&&Math.abs(blade.tip[0])<6)||crossesFace(view,blade,P));
  if(FRONTAL(view)){
   for(const s of ['L','R']){
    const hand=held[s];
    if(hand){
     // De dos, les bras sont devant le corps donc cachés, sauf la main qui va au fourreau.
     const hidden=view==='dos'&&!stage,layer=new Map();
     limb(layer,shoulderOf(view,s,hand,P),hand,{dark:hidden});fist(layer,hand,hidden);over(hidden?back:front,layer,true);
    }
    else{const src=s==='L'?part.armL:part.armR,sw=s==='L'?P.swingL:P.swingR;over(front,shift(shearArm(src,0,sw+P.relax),P.dx,P.dy));}
   }
  }else{
   const fwd=view==='droite'?1:-1;
   if(held.near){const layer=new Map();limb(layer,shoulderOf(view,'near',held.near,P),held.near);fist(layer,held.near);over(front,layer,true);}
   else{const swing=loc==='walk'?P.arm*fwd:loc==='hurt'?-fwd:loc==='dash'?-2*fwd:0;
    if(!swing&&!P.relax)over(front,shift(part.arm,P.dx,P.dy));
    else over(front,shift(shearArm(ARM_FILL[view],swing,P.relax),P.dx,P.dy),HANGING);}
   if(held.far){const layer=new Map();limb(layer,shoulderOf(view,'far',held.far,P),held.far,{dark:true});fist(layer,held.far,true);over(back,layer,true);
    // À deux mains, le poing éloigné serre la fusée près du poing proche : il reste visible.
    if(two)over(grip,fist(new Map(),held.far,true),true);}
  }
  // Ordre de dessin : fourreau/lame arrière, bras arrière, jambes, tronc, tête, bras avant, lame avant.
  const S=shift(scabbard(new Map(),view,sheathed),P.dx,P.dy);
  const swordLayer=blade?sword(new Map(),blade.g,blade.tip):null;
  // De face, fourreau et poignée sont entièrement cachés par le corps et la tête.
  if(side)over(img,S,true);
  if(blade&&behindBlade){if(smearLayer)over(img,smearLayer);over(img,swordLayer,true);}
  over(img,back);
  over(img,legsLayer(view,P));
  const body=shift(part.body,P.dx,P.dy);
  if(side)over(img,underArm(view,P.dx,P.dy));
  over(img,body);
  const head=shift(part.head,P.hx,P.hy);
  if(P.blink)lids(view,head,P.hx,P.hy);
  over(img,head);
  if(P.head)over(img,shift(part.collar,P.dx,P.dy));
  if(view==='dos')over(img,S,true);
  if(blade&&!behindBlade){if(smearLayer)over(img,smearLayer);over(img,swordLayer,true);}
  over(img,grip);over(img,front);
  return finish(img);
 }
 /** Finition de silhouette : tout bord reçoit son contour d'un pixel (même quand une pièce
  *  bouge et découvre un bord) et les petits trous fermés se bouchent. Les traînées tramées
  *  (smears) restent ajourées. */
 const SMEAR_KEYS=new Set(['e','E','W']);
 function finish(img){
  const add=[];
  for(const [k,c] of img){if(c==='O'||c==='x'||SMEAR_KEYS.has(c))continue;const x=KX(k),y=KY(k);
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
 return Object.freeze({version:4,cell:CELL,anchor:ANCHOR,palette:PALETTE,views:VIEWS,directions:DIRECTIONS,states:STATES,holster:HOLSTER,draw,raster,idleFrame,weaponVisual});
});
