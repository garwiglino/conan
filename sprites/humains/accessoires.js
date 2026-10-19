/* Hand-authored integer sprites based on the three generated pixel-art concept
 * sheets in art/humains/activites/concepts/. No external bitmap at runtime.
 * Reference cell numbers are retained in REFERENCE for asset review. */
(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('./rig.js'):root.HearthreaverHumanRig,typeof module==='object'&&module.exports?require('./cheval.js'):root.HearthreaverHumanHorse);if(typeof module==='object'&&module.exports)module.exports=api;else root.HearthreaverHumanProps=api;})(globalThis,function(R,HORSE){
'use strict';
const {Pixels,project,round,INK,lerp}=R;
const P={ink:INK,wood:'79533a',oak:'a77c50',edge:'c7a67a',dark:'4b332b',iron:'84989d',steel:'c4ccbf',shade:'525f69',linen:'dfc99c',fold:'b19b74',red:'a96754',clay:'b77650',clayDark:'764836',green:'6d875b',water:'537f91',waterLight:'8ab3b3',gold:'dfb35a',fire:'dc773b',ember:'f2bd5d'};
const REFERENCE={
 hoe:['metiers',1],shovel:['metiers',1],sickle:['metiers',2],sheaf:['metiers',2],seed_bag:['metiers',3],basket:['metiers',3],knife:['metiers',4],fiber:['metiers',4],bucket:['metiers',5],shears:['metiers',5],net:['metiers',6],needle:['metiers',6],axe:['metiers',7],log:['metiers',7],saw:['metiers',8],sawhorse:['metiers',8],scraper:['metiers',9],jar:['metiers',9],charcoal:['metiers',10],rake:['metiers',10],pickaxe:['metiers',11],ore:['metiers',11],rock:['metiers',12],chisel:['metiers',12],mallet:['metiers',12],pan:['metiers',13],sieve:['metiers',13],salt:['metiers',14],anvil:['metiers',15],hammer:['metiers',15],tongs:['metiers',15],bellows:['metiers',16],forge:['metiers',16],crucible:['metiers',17],trough:['metiers',18],wheel:['metiers',19],clay:['metiers',19],kiln:['metiers',20],blowpipe:['metiers',21],glass:['metiers',21],spindle:['metiers',22],loom:['metiers',23],shuttle:['metiers',23],cloth:['metiers',24],hide:['metiers',26],hide_rack:['metiers',26],dye:['metiers',27],rope:['metiers',28],rope_rack:['metiers',28],hive:['metiers',29],smoker:['metiers',29],honeycomb:['metiers',29],herbs:['metiers',30],pestle:['metiers',30],bandage:['metiers',30],
 well:['postes-transports',1],mill:['postes-transports',2],grain_bag:['postes-transports',2],flour_bag:['postes-transports',2],press:['postes-transports',3],lever:['postes-transports',3],pot:['postes-transports',4],ladle:['postes-transports',4],kitchen:['postes-transports',5],fish:['postes-transports',5],clothesline:['postes-transports',6],medicine:['postes-transports',7],patient:['postes-transports',8],bedroll:['postes-transports',8],wall:['postes-transports',9],trowel:['postes-transports',9],hull:['postes-transports',10],caulking:['postes-transports',10],brush:['postes-transports',10],bollard:['postes-transports',11],boat:['postes-transports',12],oar:['postes-transports',12],pole:['postes-transports',12],tiller:['postes-transports',12],gangway:['postes-transports',13],horse:['cheval-chibi',1],reins:['postes-transports',14],cart:['postes-transports',15],crate:['postes-transports',16],parcel:['postes-transports',17],scroll:['postes-transports',17],coins:['postes-transports',17],market:['postes-transports',18],ledger:['postes-transports',18],quill:['postes-transports',18],weight:['postes-transports',18],jug:['postes-transports',19],cup:['postes-transports',19],bowl:['postes-transports',19],bench:['postes-transports',20],
 blade:['equipements',1],spear:['equipements',2],battle_axe:['equipements',3],staff:['equipements',4],bow:['equipements',5],crossbow:['equipements',6],javelin:['equipements',7],shield:['equipements',8],heater_shield:['equipements',9],sheath:['equipements',10],
 soil:['metiers',2],tree:['metiers',7],pile:['metiers',11],water:['postes-transports',12],path:['postes-transports',13],canal:['postes-transports',1],fiber_rack:['metiers',22],hay:['metiers',2],sheep:['metiers',5],peg:['metiers',12],twine:['metiers',28]
};
function rect(b,x,y,w,h,c){b.rect(round(x),round(y),w,h,P[c]||c);}
function line(b,x,y,X,Y,c,w=1){b.line(x,y,X,Y,P[c]||c,w);}
function ellipse(b,x,y,rx,ry,c){b.ellipse(round(x),round(y),rx,ry,P[c]||c);}
function jar(b,x,y,kind='jar'){
 if(kind==='bucket'){rect(b,x-3,y-2,7,6,'ink');rect(b,x-2,y-1,5,4,'oak');for(let i=-1;i<=1;i++)line(b,x+i*2,y-1,x+i*2,y+2,i===-1?'edge':'wood');line(b,x-2,y-3,x-2,y-5,'iron');line(b,x-2,y-5,x+2,y-5,'iron');line(b,x+2,y-5,x+2,y-3,'iron');line(b,x-2,y+2,x+2,y+2,'iron');return;}
 ellipse(b,x,y,3,3,'ink');ellipse(b,x,y,2,2,'clay');rect(b,x-1,y-5,3,3,'clayDark');line(b,x-1,y-5,x+1,y-5,'edge');b.set(x-1,y-1,P.edge);
}
function crate(b,x,y,type='crate'){
 if(type==='sack'||type==='grain_bag'||type==='flour_bag'||type==='seed_bag'){ellipse(b,x,y,4,4,'ink');ellipse(b,x,y,3,3,'fold');rect(b,x-2,y-5,5,2,'linen');line(b,x-2,y-3,x+2,y-3,'wood');b.set(x-2,y,P.linen);if(type==='flour_bag')b.set(x+1,y,P.linen);return;}
 if(type==='basket'){ellipse(b,x,y,4,3,'ink');ellipse(b,x,y,3,2,'oak');line(b,x-3,y-2,x+3,y-2,'edge');for(let i=-2;i<=2;i+=2)line(b,x+i,y-1,x+i,y+2,'wood');line(b,x-2,y-3,x-2,y-5,'oak');line(b,x-2,y-5,x+2,y-5,'edge');line(b,x+2,y-5,x+2,y-3,'oak');return;}
 rect(b,x-4,y-3,9,7,'ink');rect(b,x-3,y-2,7,5,'wood');for(let j=-2;j<=2;j+=2)line(b,x-3,y+j,x+3,y+j,'oak');line(b,x-3,y-2,x+3,y+2,'edge');line(b,x-3,y+2,x+3,y-2,'edge');line(b,x-3,y-3,x+3,y-3,'edge');
}
function textile(b,x,y,kind='cloth',f=0){
 rect(b,x-4,y-2,8,5,'ink');rect(b,x-3,y-2,6,4,kind==='bandage'?'linen':kind==='hide'?'fold':'red');line(b,x-2,y-1,x+2,y-1,kind==='hide'?'edge':'linen');
 if(kind==='bandage'){ellipse(b,x+3,y,2,2,'linen');ellipse(b,x+3,y,1,1,'fold');}
 if(kind==='cloth'){for(let i=-2;i<=2;i+=2)b.set(x+i,y+2,P.fold);b.set(x-2+(f%3),y,P.linen);}
}
function sheaf(b,x,y){for(let i=-3;i<=3;i++){line(b,x,y+4,x+i,y-5,'oak');b.set(x+i,y-5,P.edge);b.set(x+i+1,y-4,P.gold);}line(b,x-2,y+1,x+2,y+1,'wood');}
function fire(b,x,y,f){for(const [dx,dy]of [[-3,1],[1,1],[-1,0]])rect(b,x+dx,y+dy,3,2,'dark');for(let i=-2;i<=2;i++){const h=2+(i+f)%3;line(b,x+i,y,x+i,y-h,'fire');if(i%2===0)b.set(x+i,y-h,P.ember);}}
function pot(b,x,y,f,fireOn=true){if(fireOn)fire(b,x,y+7,f);ellipse(b,x,y+1,5,4,'ink');ellipse(b,x,y+1,4,3,'shade');ellipse(b,x,y-1,4,1,'iron');line(b,x-4,y-4,x+4,y-4,'iron');line(b,x-4,y-4,x-4,y-1,'iron');line(b,x+4,y-4,x+4,y-1,'iron');}
// Transcription of concepts/cheval-chibi.png: short rounded pony, oversized
// head, short neck and stubby legs. Separate front plane masks the rider's
// pelvis in front/back views; the rider's near bent leg goes OVER the flank.
function horseLayers(x,y,dir,f=0,moving=false){
 const Horse=HORSE,rows=Horse.views[dir],body=new Pixels(),front=new Pixels(),side=dir==='droite'||dir==='gauche',sg=dir==='gauche'?-1:1;
 const left=x-Math.floor(rows[0].length/2),top=y-rows.length,step=moving?[0,1,1,0,0,-1,-1,0][f%8]:0,bob=moving?[0,0,-1,0,0,0,-1,0][f%8]:0;
 rows.forEach((row,j)=>[...row].forEach((ch,i)=>{if(ch==='.')return;const leg=j>=rows.length-5,offset=leg?step*(i<rows[0].length/2?1:-1):0,X=left+i+offset,Y=top+j+(leg?0:bob),color=Horse.palette[ch];body.set(X,Y,color);
  if(dir==='face'&&j<21||dir==='dos'&&j>=19)front.set(X,Y,color);
 }));
 return {body,front,saddle:[x-1,y-20+bob],bridle:side?[x+sg*17,y-18+bob]:[x,y-15+bob],ground:[x,y]};
}
function horse(b,x,y,dir,f=0){const h=horseLayers(x,y,dir,f,false);b.stamp(h.body.values());b.stamp(h.front.values());}
function stationLayout(station,dir){
 const near=['anvil','bench','sawhorse','log','rock','kitchen','medicine','wheel','market','pot','dye','trough','hull'].includes(station),distance=near?8:12,origin=project(dir,0,distance,0);
 const heights={anvil:6,bench:4,sawhorse:7,log:4,rock:8,kitchen:4,medicine:2,wheel:4,market:2,pot:2,dye:6,trough:3,tree:6,hull:2,wall:8};
 return {origin,ground:[origin[0],origin[1]],surface:[origin[0],origin[1]-(heights[station]||0)],seat:station==='bench'?[40,49]:null};
}
function icon(b,id,x,y,f=0){
 switch(id){
 case 'crate':case 'basket':case 'grain_bag':case 'flour_bag':case 'seed_bag':crate(b,x,y,id);break;
 case 'jar':case 'jug':case 'bucket':case 'cup':jar(b,x,y,id);break;
 case 'pot':pot(b,x,y,f,false);break;
 case 'sheaf':case 'fiber':case 'hay':case 'herbs':sheaf(b,x,y);if(id==='herbs')for(let i=-2;i<=2;i++)b.set(x+i,y-3,P.green);break;
 case 'cloth':case 'hide':case 'bandage':textile(b,x,y,id,f);break;
 case 'parcel':textile(b,x,y,'cloth',f);line(b,x,y-2,x,y+2,'fold');line(b,x-3,y,x+3,y,'fold');break;
 case 'scroll':rect(b,x-3,y-2,7,4,'linen');line(b,x-3,y-2,x-3,y+1,'fold');line(b,x+3,y-2,x+3,y+1,'fold');b.set(x,y,P.red);break;
 case 'coins':case 'salt':case 'ore':for(let i=-2;i<=2;i+=2){ellipse(b,x+i,y+(i%3),1,1,id==='coins'?'gold':id==='salt'?'linen':'iron');b.set(x+i,y+(i%3)-1,id==='coins'?P.edge:P.steel);}break;
 case 'fish':ellipse(b,x,y,4,1,'iron');line(b,x+4,y,x+6,y-2,'iron');line(b,x+4,y,x+6,y+2,'iron');b.set(x-3,y,INK);line(b,x-2,y-1,x+2,y-1,'steel');break;
 case 'ledger':rect(b,x-4,y-3,9,6,'dark');rect(b,x-3,y-3,7,5,'linen');line(b,x,y-3,x,y+1,'wood');for(let j=-2;j<=0;j+=2)line(b,x+1,y+j,x+2,y+j,'fold');break;
 case 'bowl':case 'pan':case 'sieve':ellipse(b,x,y,5,2,'ink');ellipse(b,x,y-1,4,1,id==='pan'?'iron':'oak');if(id==='sieve')for(let i=-3;i<=3;i+=2)b.set(x+i,y-1,P.linen);if(id==='bowl')line(b,x-3,y-1,x+3,y-1,'green');break;
 case 'clay':ellipse(b,x,y,3,2,'clayDark');ellipse(b,x-1,y-1,2,2,'clay');b.set(x-1,y-2,P.edge);break;
 case 'honeycomb':rect(b,x-3,y-3,6,6,'wood');rect(b,x-2,y-2,4,4,'gold');for(let j=-2;j<=1;j+=2)for(let i=-2;i<=1;i+=2)b.set(x+i,y+j,P.edge);break;
 case 'net':for(let i=-5;i<=5;i+=2)line(b,x+i,y-4,x+i+(f%2),y+3,'fold');for(let j=-4;j<=3;j+=2)line(b,x-5,y+j,x+5,y+j,'edge');break;
 case 'rope':case 'twine':ellipse(b,x,y,4,2,'edge');ellipse(b,x,y,2,1,'dark');line(b,x-3,y,x-5,y-3,'oak');break;
 case 'log':rect(b,x-5,y-2,11,4,'wood');ellipse(b,x-5,y,2,2,'edge');ellipse(b,x-5,y,1,1,'wood');line(b,x-2,y-1,x+4,y-1,'oak');break;
 case 'crucible':ellipse(b,x,y,4,3,'ink');ellipse(b,x,y-1,3,1,'ember');line(b,x-2,y+1,x+2,y+1,'iron');break;
 case 'smoker':rect(b,x-2,y-2,5,6,'shade');ellipse(b,x,y-3,2,1,'iron');line(b,x+2,y-1,x+5,y-2,'iron');b.set(x-1,y-1,P.steel);break;
 case 'bellows':rect(b,x-5,y-2,8,4,'dark');line(b,x-5,y-3,x+3,y-2,'edge');line(b,x+3,y-1,x+6,y-1,'iron');break;
 case 'weight':rect(b,x-2,y-1,5,4,'shade');ellipse(b,x,y-2,1,1,'iron');line(b,x-1,y,x+1,y,'steel');break;
 case 'reins':line(b,x-3,y,x+6,y+2,'dark');line(b,x-3,y+1,x+6,y+3,'oak');break;
 case 'spindle':line(b,x,y-5,x,y+4,'wood');ellipse(b,x,y-1,2,2,'linen');line(b,x,y+4,x+2,y+4,'edge');break;
 case 'shuttle':line(b,x-3,y,x+3,y,'wood',2);b.set(x,y,P.linen);break;
 case 'needle':case 'quill':line(b,x-1,y+2,x+2,y-3,id==='quill'?'linen':'steel');if(id==='quill')line(b,x+1,y-2,x+3,y-2,'linen');break;
 case 'pestle':line(b,x,y+2,x+1,y-4,'iron',2);b.set(x+1,y-4,P.steel);break;
 case 'salt_food':break;
 default:throw RangeError('Petit accessoire inconnu : '+id);
 }
}
function shaft(b,hand,unit,length,color='wood',width=1){const end=[round(hand[0]+unit[0]*length),round(hand[1]+unit[1]*length)];line(b,...hand,...end,'ink',width+2);line(b,...hand,...end,color,width);return end;}
const TOOL_LENGTH={hoe:10,shovel:11,rake:12,pickaxe:10,axe:10,hammer:5,mallet:5,staff:16,pole:21,oar:20,ladle:7,scraper:5,knife:4,sickle:6,saw:9,chisel:4,tongs:8,trowel:5,caulking:4,brush:5,blowpipe:18,lever:13,tiller:10,shears:5,peg:3};
function tool(b,id,h,dir,action,f,contact=null){
 const [x,y]=h,p=[0,.3,.8,1,.75,.45,.15,0][f%8],side=dir==='droite'||dir==='gauche',sg=dir==='gauche'?-1:1;
 let u=[side?sg*.65:.25,.85];if(['fell','hew','mine','quarry','forge','joinery','stonecut','repair_boat'].includes(action))u=f<3?[side?-sg*.35:.15,-.95]:[side?sg*.8:.4,.6];
 if(['fell','hew','mine','quarry','forge','joinery','stonecut','repair_boat'].includes(action)&&f>=5){const k=(f-4)/3,rest=[side?-sg*.35:.15,-.95];u=u.map((v,i)=>lerp(v,rest[i],k));}
 const n=Math.hypot(...u);u=u.map(v=>v/n);
 if(['hoe','shovel','rake','pickaxe','axe','hammer','mallet','staff','pole','oar','ladle','scraper','knife','sickle','saw','chisel','tongs','trowel','caulking','brush','blowpipe','lever','tiller','shears','peg'].includes(id)){
  const length=TOOL_LENGTH[id];
  if(id==='blowpipe')u=[side?sg:1,side?.1:0];if(id==='saw'||id==='tongs')u=[side?sg:1,0];
  if(id==='staff')u=[side?sg*.3:.1,-.98];if(id==='pole')u=[side?sg*.3:.1,.98];if(id==='ladle'||id==='scraper'||id==='knife'||id==='chisel'||id==='brush')u=[side?sg*.4:.2,.95];
  if(id==='oar')u=[side?sg*.8:.7,.6];
  if(contact){const dx=contact.point[0]-x,dy=contact.point[1]-y,n=Math.hypot(dx,dy);if(n){const a=Math.atan2(u[1],u[0]),delta=Math.atan2(Math.sin(Math.atan2(dy,dx)-a),Math.cos(Math.atan2(dy,dx)-a)),angle=a+delta*contact.weight;u=[Math.cos(angle),Math.sin(angle)];}}
  const slide=contact?.gripOffset||0,start=[h[0]-u[0]*slide,h[1]-u[1]*slide],end=shaft(b,start,u,length,['tongs','chisel','knife','caulking','blowpipe'].includes(id)?'iron':'oak'),[ex,ey]=end,px=-u[1],py=u[0];
  if(id==='hoe'||id==='rake'||id==='pickaxe'){
   const w=id==='pickaxe'?5:4;line(b,ex-px*w,ey-py*w,ex+px*w,ey+py*w,'iron',2);line(b,ex-px*(w-1),ey-py*(w-1),ex+px*(w-1),ey+py*(w-1),'steel');
   if(id==='rake')for(let k=-3;k<=3;k+=2)line(b,ex+px*k,ey+py*k,ex+px*k+u[0]*2,ey+py*k+u[1]*2,'wood');
  }else if(['axe','hammer','mallet'].includes(id)){line(b,ex-px*2,ey-py*2,ex+px*3,ey+py*3,id==='mallet'?'wood':'iron',3);line(b,ex-px*2,ey-py*2,ex+px*3,ey+py*3,id==='mallet'?'edge':'steel');}
  else if(id==='shovel'){line(b,ex-u[0]*2,ey-u[1]*2,ex+u[0]*2,ey+u[1]*2,'iron',4);b.set(ex,ey,P.steel);}
  else if(id==='oar'){line(b,ex-u[0]*4,ey-u[1]*4,ex,ey,'wood',4);line(b,ex-u[0]*3,ey-u[1]*3,ex,ey,'edge');}
  else if(id==='saw'){line(b,x,y+1,ex,ey+1,'iron',2);for(let k=1;k<length;k+=2)b.set(x+k*u[0],y+2,P.steel);}
  else if(id==='sickle'){line(b,ex-2,ey+2,ex-3,ey,'iron');line(b,ex-3,ey,ex-1,ey-3,'steel');line(b,ex-1,ey-3,ex+2,ey-3,'steel');}
  else if(id==='ladle')ellipse(b,ex,ey,2,1,'wood');
  else if(id==='tongs'){line(b,x,y+2,ex,ey+2,'shade');line(b,ex,ey,ex+2,ey+1,'steel');}
  else if(id==='blowpipe'){ellipse(b,ex,ey,3,2,'fire');ellipse(b,ex-1,ey-1,1,1,'ember');}
  else if(id==='knife'||id==='scraper'||id==='chisel'||id==='caulking'||id==='trowel'){line(b,ex-1,ey,ex+1,ey,'steel',2);}
  else if(id==='brush'){rect(b,ex-1,ey,4,2,'fold');line(b,ex,ey+1,ex+2,ey+1,'dark');}
  else if(id==='shears'){line(b,x-2,y,x+1,y+5,'steel');line(b,x+2,y,x-1,y+5,'iron');ellipse(b,x,y-1,2,1,'dark');}
  return end;
 }
 icon(b,id,x,y,f);
}
function shield(b,hand,dir,role){const [x,y]=hand,profile=dir==='droite'||dir==='gauche';ellipse(b,x,y,profile?2:5,6,'ink');ellipse(b,x,y,profile?1:4,5,'iron');ellipse(b,x,y,profile?1:3,4,'wood');if(!profile){for(let i=-2;i<=2;i+=2)line(b,x+i,y-3,x+i,y+3,'oak');ellipse(b,x,y,1,1,'steel');}else line(b,x,y-4,x,y+4,'steel');}
function weapon(b,type,hand,dir,action,f){
 if(action==='dropped'){
  const source=new Pixels();weapon(source,type,[40,40],dir,'armed_idle',0);
  const pixels=source.values(),xs=pixels.map(p=>p[0]),ys=pixels.map(p=>p[1]),rotate=Math.max(...ys)-Math.min(...ys)>Math.max(...xs)-Math.min(...xs);
  const flat=pixels.map(([x,y,c])=>rotate?[40-y,x-40,c]:[x-40,y-40,c]),bottom=Math.max(...flat.map(p=>p[1]));
  b.stamp(flat,(x,y)=>[hand[0]+x,hand[1]-1+y-bottom]);return;
 }
 const side=dir==='droite'||dir==='gauche',sg=dir==='gauche'?-1:1,attack=R.C.ATTACKS.has(action),strike=attack&&(f===3||f===4),p=[0,.3,.8,1,.75,.45,.15,0][f%8];
 let u=[side?sg*.4:-.3,-.95];
 if(strike)u=['spear_thrust','mounted_thrust'].includes(action)?[side?sg:0,side?0:-1]:[side?sg*.85:.85,.5];
 if(['blade_cut','blade_reverse','staff_sweep','mounted_cut'].includes(action)&&f<3)u=[side?-sg*.4:-.8,-.85];
 if(attack&&f>=5){const k=(f-4)/3,start=['spear_thrust','mounted_thrust'].includes(action)?[side?sg:0,side?0:-1]:[side?sg*.85:.85,.5],rest=[side?sg*.4:-.3,-.95];u=start.map((v,i)=>lerp(v,rest[i],k));}
 const n=Math.hypot(...u);u=u.map(v=>v/n);
 if(type==='bow'){
  const [x,y]=hand;for(let j=-6;j<=6;j++){const curve=round((1-j*j/36)*3);b.set(x+(side?sg*curve:curve),y+j,P.oak);if(j%2===0)b.set(x+(side?sg*curve:curve)-sg,y+j,P.edge);}line(b,x,y-6,x,y+6,'linen');if(action==='bow_shot'&&f<3)line(b,x,y-6,x-sg*round(p*3),y,'linen');if(!(action==='bow_shot'&&f>=3))line(b,x-3,y,x+sg*8,y,'iron');return;
 }
 if(type==='crossbow'){const [x,y]=hand;line(b,x-4,y,x+7,y,'wood',2);line(b,x+5,y-4,x+5,y+4,'iron');line(b,x+5,y-4,x,y,'linen');line(b,x+5,y+4,x,y,'linen');if(action!=='crossbow_shot'||f<3)line(b,x,y-1,x+8,y-1,'steel');return;}
 if(type==='javelin'&&action==='javelin_throw'&&f>=3)return;
 const len={blade:11,spear:20,axe:11,staff:17,javelin:18}[type];if(!len)throw RangeError('Arme inconnue : '+type);
 const h=hand,end=shaft(b,h,u,len,type==='blade'?'steel':'oak',type==='blade'?2:1),[ex,ey]=end;
 if(type==='blade'){const px=-u[1],py=u[0];line(b,h[0]+u[0]*2-px*3,h[1]+u[1]*2-py*3,h[0]+u[0]*2+px*3,h[1]+u[1]*2+py*3,'iron');line(b,h[0]+u[0]*3,h[1]+u[1]*3,ex,ey,'steel');}
 if(type==='spear'||type==='javelin'){line(b,ex-u[0]*3,ey-u[1]*3,ex,ey,'iron',3);line(b,ex-u[0]*3,ey-u[1]*3,ex,ey,'steel');}
 if(type==='axe'){line(b,ex+u[1]*3,ey-u[0]*3,ex-u[1]*3,ey+u[0]*3,'iron',3);line(b,ex-u[1]*3,ey+u[0]*3,ex-u[1]*3+u[0]*2,ey+u[0]*3+u[1]*2,'steel',2);}
}
return Object.freeze({P,REFERENCE,TOOL_LENGTH,stationLayout,icon,tool,weapon,shield,horse,horseLayers,crate,jar,project});
});
