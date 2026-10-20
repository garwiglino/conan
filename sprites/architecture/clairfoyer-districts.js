/* Authored native pixel assets for the unvalidated Clairfoyer district study.
 * Uses the exact shared rasteriser, palette, textures, outlines and projection.
 * Load after architecture-isometric.js and clairfoyer-district-catalogue.js.
 */
(function(r,f){if(typeof module==='object'&&module.exports)module.exports=f(require('./architecture-isometric'),require('./clairfoyer-district-catalogue'),require('./architecture-game'));else r.ClairfoyerDistrictArchitecture=f(r.HearthreaverIsometric,r.ClairfoyerDistrictCatalogue,r.HearthreaverArchitectureGame);})(globalThis,function(Base,C,Game){
'use strict';
// Browser workshop remains independent of the game's legacy data bundles.
const transform=(d,dir)=>{
 const q=d.views.indexOf(dir),W=d.width,D=d.depth,ow=q%2?D:W,od=q%2?W:D,ground=q===0?[0,0]:q===1?[D,0]:q===2?[W,D]:[0,W],a=Base.project(ow/2,od/2),b=Base.project(...ground),origin=[a[0]-b[0],a[1]-b[1]];
 const point=(x,y)=>{const a=q===0?[x,y]:q===1?[D-y,x]:q===2?[W-x,D-y]:[y,W-x];return [a[0]-(q%2?D:W)/2,a[1]-(q%2?W:D)/2];};
 const normal=(x,y)=>{const a=point(0,0),b=point(x,y),n=Math.hypot(b[0]-a[0],b[1]-a[1]);return [(b[0]-a[0])/n,(b[1]-a[1])/n];};return {point,normal,origin,depthOrigin:a};
};
const contains=Game?Game.contains:(r,x,y,radius=0)=>{
 if(x+radius<r.x||x-radius>r.x+r.w||y+radius<r.y||y-radius>r.y+r.h)return false;
 let pos=false,neg=false,distance=Infinity;for(let i=0;i<r.polygon.length;i++){const a=r.polygon[i],b=r.polygon[(i+1)%r.polygon.length],dx=b[0]-a[0],dy=b[1]-a[1],cross=dx*(y-a[1])-dy*(x-a[0]);if(cross>1e-6)pos=true;if(cross< -1e-6)neg=true;const u=Math.max(0,Math.min(1,((x-a[0])*dx+(y-a[1])*dy)/(dx*dx+dy*dy||1)));distance=Math.min(distance,(x-a[0]-u*dx)**2+(y-a[1]-u*dy)**2);}return !(pos&&neg)||radius>0&&distance<radius*radius;
};
function author(d,P){
 const {face,box,beam,wall,panelY,panelX,window,door,roof,chimney,railing,barrel,meta}=P,W=d.width,D=d.depth,H=d.height,shape=d.shape;
 const slab=(x,y,w,l,mat='stone')=>box(x,y,0,w,l,1,mat,'paving','detail');
 const bench=(x,y,w=26)=>{w=Math.min(w,30);for(const xx of [x+2,x+w-4])beam(xx,y+1,0,2,5,4);box(x,y,4,w,7,1,'wood','plank','detail');};
 // Same working height as the independent human workbench (native 9).
 const table=(x,y,w=26,l=12)=>{for(const xx of [x+1,x+w-3])for(const yy of [y+1,y+l-3])beam(xx,yy,0,2,2,8);beam(x+2,y+l/2,2,w-4,1,1);box(x,y,8,w,l,1,'wood','plank','detail');(meta.furnitureSurfaces||(meta.furnitureSurfaces=[])).push({kind:'table',x,y,width:w,depth:l,height:9});};
 const crate=(x,y,w=12,h=10)=>{box(x,y,0,w,w,h,'wood','plank','detail');for(const z of [1,h-2])beam(x,y+w,z,w,1,2);beam(x+w,y,1,1,w,h-2);};
 const sealed=(x,y,size=11)=>{barrel(x,y,0,size);box(x+1,y+1,9,size-2,size-2,1,'wood','plank','detail');};
 const work=(x,y,label)=>{(meta.workspots||(meta.workspots=[])).push({x,y,label});};
 const opening=(x,y,width=28,ny=1,clearance=28)=>meta.openings.push({x,y,z:0,width,clearance,normal:[0,ny],kind:'open'});
 function brace(x,y,z,span=13,rise=11){face([[x,y,z],[x+span,y,z+rise],[x+span+2,y,z+rise],[x+2,y,z]],'wood','detail','timber');}
 function awning(x,y,w,l,z=29,mat='cloth'){
  for(const xx of [x+1,x+w-4])beam(xx,y+l-4,0,3,3,z-4);
  face([[x,y,z+3],[x+w,y,z+3],[x+w,y+l,z-4],[x,y+l,z-4]],mat,'roof',mat==='cloth'?'roof':'roof');
  beam(x,y+l-2,z-5,w,2,2);meta.parts.push({type:'awning',x,y,width:w,depth:l});
 }
 function sign(x,y,z,kind='tools'){
  beam(x,y,z+11,1,1,4,'iron');panelY(x-4,y+.1,z,12,10,'wood','plank');
  if(kind==='cloth'){panelY(x-1,y+.3,z+2,6,6,'cloth','sail');}
  else if(kind==='honey'){panelY(x-1,y+.3,z+2,6,5,'straw','plain');beam(x,y+.4,z+7,4,1,1,'iron');}
  else if(kind==='records'){panelY(x-1,y+.3,z+1,6,8,'cloth','plain');for(let k=0;k<3;k++)panelY(x,y+.5,z+3+k*2,4,1,'ink','plain');}
  else{beam(x-1,y+.4,z+6,7,1,2,'iron');beam(x+1,y+.4,z+1,2,1,7);}
 }
 function room(x,y,w,l,eave=H-26,mat=d.recipe.wall,cover=d.recipe.roof,opts={}){
  slab(x-1,y-1,w+2,l+2);wall(x,y,1,w,l,eave-1,mat);
  if(mat==='plaster'){
   for(const xx of [x,x+w/2-1,x+w-3])beam(xx,y+l-.3,1,3,1,eave-1);
   for(const yy of [y,y+l/2-1,y+l-3])beam(x+w-.3,yy,1,1,3,eave-1);
   for(const z of [5,eave-3]){beam(x,y+l-.3,z,w,1,2);beam(x+w-.3,y,z,1,l,2);beam(x,y-.2,z,w,1,2);}
   if(eave>50){beam(x,y+l-.3,31,w,1,3);beam(x+w-.3,y,31,1,l,3);}
  }
  const dw=opts.wide?26:14,dx=x+w*(opts.doorAt||.42)-dw/2;
  door(dx,y+l+.2,0,dw,22);
  window(x+w-19,y+l+.3,12,9,11);window(x+w+.3,y+13,14,8,11,true);
  panelY(x+w*.3,y-.15,14,9,11,'glass','window');panelX(x-.15,y+l*.4,14,8,11,'glass','window');
  if(eave>53){window(x+w*.17,y+l+.3,39,9,11);window(x+w*.65,y+l+.3,39,9,11);window(x+w+.3,y+l*.65,38,8,11,true);}
  const peak=Math.min(H-8,eave+22);roof(x-2,y-2,w+4,l+4,eave,peak,cover,cover==='straw');
  if(d.district==='conseil'){
   for(const xx of [x+1,x+w-5])wall(xx,y+l-.3,1,4,2,27,'stone');
   beam(dx-3,y+l+.5,24,dw+6,2,3,'stone');
  }else if(d.district==='metiers'){
   brace(x+3,y+l+.6,17,12,12);brace(x+w-20,y+l+.6,17,12,12);
  }else if(d.district==='rive'){
   beam(x-2,y+l+2,eave-3,w+4,2,2,'wood');beam(x+w+1,y+l-2,2,2,2,eave-3,'wood');
  }else if(d.district==='greniers'){
   panelX(x+w+2.1,y+l*.33,eave+2,20,7,'ink','plain');for(let k=0;k<4;k++)beam(x+w+2.3,y+l*.33,eave+2+k*2,1,20,1);
  }else if(d.district==='sud'){
   for(const xx of [x+1,x+w-5])beam(xx,y+l+.3,1,4,2,eave-1);brace(x+4,y+l+.6,20,18,12);brace(x+w-25,y+l+.6,20,18,12);
  }
  if(opts.chimney)chimney(x+w*.76,y+9,H-20,18);
  meta.parts.push({type:'room',x,y,width:w,depth:l});
  return {x,y,w,l,eave,front:y+l,doorX:dx};
 }
 function openHall({x=4,y=4,w=W-8,l=D-8,eave=H-26,peak=H-3,back=false,cover=d.recipe.roof}={}){
  slab(x,y,w,l);const posts=w>=120?[x+2,x+w*.25-2,x+w*.75-2,x+w-6]:[x+2,x+w-6];for(const xx of posts)for(const yy of [y+2,y+l-6])beam(xx,yy,0,4,4,eave);
  for(const xx of [x+2,x+w-6]){beam(xx,y+2,eave-7,4,l-4,4);}
  beam(x,y+2,eave-4,w,3,3);beam(x,y+l-5,eave-4,w,3,3);
  if(back)wall(x,y,0,w,4,eave-2,'wood');
  roof(x-1,y-1,w+2,l+2,eave,peak,cover,cover==='straw');
  if(['bois','sud'].includes(d.district)){brace(x+6,y+l-2,eave-17,14,12);brace(x+w-25,y+l-2,eave-17,14,12);}
  opening(x+w/2-16,y+l,32,1,eave-3);if(!back)opening(x+w/2-16,y,32,-1,eave-3);
 }
 // Infrastructures have distinct structures and real empty circulation space.
 if(d.category==='infrastructure'){
  if(shape==='garden-bench'){
   bench(1,11,24);wall(28,2,0,11,15,5,'stone');box(30,4,5,7,11,1,'wood','plain','detail');for(let k=0;k<2;k++)box(30+k*3,6+k*3,6,4,5,3,'moss','plain','detail');work(13,D+7,'accès au banc');
  }else if(shape==='meeting-shelter'||shape==='clinic-shelter'){
   openHall({eave:H-18,cover:shape==='meeting-shelter'?'straw':'slate'});bench(12,8,W-24);if(shape==='meeting-shelter')bench(12,22,22);work(W/2,D*.68,'abri civil');
  }else if(shape==='market-stall'){
   for(const x of [4,W-7])for(const y of [4,D-7])beam(x,y,0,3,3,27);
   roof(1,1,W-2,D-2,29,H-2,'cloth');table(8,24,W-16,12);work(W/2,17,'vente');
  }else if(shape==='weighing-table'){
   for(const x of [3,W-5])for(const y of [3,D-5])beam(x,y,0,2,2,8);box(1,1,8,W-2,D-2,2,'wood','plank','detail');beam(16,9,10,1,1,7,'iron');beam(8,9,16,17,1,1,'iron');for(const x of [9,23]){beam(x,9,13,1,1,3,'iron');box(x-3,6,12,7,7,1,'iron','plain','detail');}work(W/2,D+6,'pesée');
  }else if(shape==='notice-board'){
   for(const x of [5,W-9])beam(x,9,0,4,4,H-3);panelY(7,13,14,W-14,21,'wood','plank');for(const x of [9,20]){panelY(x,13.2,18,8,12,'cloth','plain');for(let z=21;z<28;z+=3)panelY(x+1,13.3,z,5,1,'ink','plain');}roof(2,4,W-4,17,H-5,H-1,'wood');work(W/2,D+6,'lecture');
  }else if(shape==='timber-rack'){
   openHall({eave:29,cover:'slate'});for(const y of [10,22])for(let k=0;k<3;k++)beam(10+k%2,y,k*5,W-20,8,4);work(W/2,D-14,'manutention');
  }else if(shape==='saw-trestles'){
   for(const x of [8,W-14]){beam(x,6,0,2,16,6);beam(x+4,6,0,2,16,6);beam(x-2,5,6,10,18,2);}box(1,11,8,W-2,6,1,'wood','plank','detail');work(W/2,D+6,'assemblage');
  }else if(shape==='covered-bins'||shape==='resin-rack'){
   openHall({eave:25,back:true,cover:'tile'});if(shape==='resin-rack'){for(const x of [13,29,45])sealed(x,14,11);}else{crate(11,14,17,12);crate(35,14,17,12);}work(W/2,D-11,'réception');
  }else if(shape==='dry-trough'){
   // Hollow and dry: no water or supply is invented by drawing the object.
   for(const x of [2,W-5])wall(x,2,0,3,D-4,7,'stone');wall(2,2,0,W-4,3,7,'stone');wall(2,D-5,0,W-4,3,7,'stone');slab(5,5,W-10,D-10);work(W/2,D+6,'abreuvoir à raccorder');
  }else if(shape==='covered-cistern'){
   wall(8,8,0,W-16,D-16,23,'stone');roof(4,4,W-8,D-8,25,36,'slate');panelY(24,D-7.8,5,13,15,'wood','door');beam(W-13,D-5,7,4,3,2,'iron');work(W-11,D+6,'distribution à raccorder');
  }else if(shape==='drain'){
   wall(0,0,0,W,4,4,'stone');wall(0,D-4,0,W,4,4,'stone');slab(0,4,W,D-8);for(let x=8;x<W-4;x+=12)beam(x,0,3,2,D,1,'iron');
  }else if(shape==='inspection-shelter'){
   openHall({eave:30,cover:'tile'});table(8,9,28,10);panelY(13,9.1,10,12,9,'cloth','plain');work(W/2,D*.65,'déclaration');
  }
  return true;
 }
 if(shape==='court-house'){
  const r=room(5,5,W-10,D-31,34,'plaster','straw',{chimney:true});
  for(const x of [5,W-9]){beam(x,D-22,0,3,18,9);beam(x,D-22,7,3,18,2);}bench(W-33,D-16,26);slab(r.doorX,D-28,18,25);for(const z of [6,11])beam(W-9,D-19,z,2,14,1);work(22,D-9,'cour');
 }else if(shape==='common-hall'){
  room(5,5,W-10,D-26,43,'plaster','straw',{wide:true});awning(16,D-22,W-32,19,29,'straw');bench(8,D-15,28);bench(W-37,D-15,28);work(W/2,D-6,'assemblée');
 }else if(shape==='cloth-shop'||shape==='tool-shop'){
  const r=room(5,5,W-10,D-29,H-29,'plaster','tile',{chimney:shape==='tool-shop'});awning(W*.51,r.front,W*.42,22,29);sign(14,r.front+.6,31,shape==='cloth-shop'?'cloth':'tools');
  if(shape==='cloth-shop'){panelY(W-29,r.front+.4,5,16,18,'cloth','sail');table(W-27,D-15,18,9);}
  else{table(W-32,D-20,24,11);beam(W-23,D-17,9,10,2,2,'iron');}
  work(W-23,D+7,'réparation');
 }else if(shape==='drained-house'){
  room(8,7,W-16,D-25,39,'plaster','straw',{chimney:true});
  // Raised-looking plinth, but the doorway remains on the native ground plane.
  for(const x of [7,W-12])wall(x,8,0,5,D-25,5,'stone');awning(17,D-20,37,16,27,'wood');bench(W-35,D-14,25);work(31,D-5,'cour abritée');
 }else if(shape==='neighborhood-house'){
  room(5,5,W-10,D-27,49,'plaster','slate');awning(10,D-22,W-20,18,30,'slate');bench(12,D-13,27);bench(W-40,D-13,27);work(W/2,D-6,'cour commune');
 }else if(shape==='market-hall'){
  openHall({eave:49,peak:H-10});box(W*.3,D/2-4,H-10,W*.4,8,5,'wood','plank','detail');roof(W*.3-1,D/2-6,W*.4+2,12,H-5,H-1,'straw');for(const x of [15,W-40])for(const y of [17,D-37])table(x,y,25,15);work(W/2,D/2,'passage et marché');
 }else if(shape==='honey-counter'||shape==='travel-counter'){
  room(5,5,W-10,D-30,H-26);awning(12,D-25,W-24,21,30);sign(15,D-24,31,shape==='honey-counter'?'honey':'records');
  table(W-38,D-23,27,12);
  if(shape==='honey-counter')for(const x of [W-35,W-24]){box(x,D-21,9,7,7,7,'straw','plain','detail');box(x-1,D-22,16,9,9,1,'wood','plank','detail');}else panelY(W-35,D-10.8,10,16,7,'cloth','plain');work(23,D-8,'comptoir');
 }else if(shape==='records'){
  const r=room(5,5,W-10,D-23,57,'plaster','slate');sign(W-26,r.front+.8,32,'records');awning(34,r.front,43,16,30,'slate');bench(W-46,D-15,34);work(26,D+7,'dépôt des registres');
 }else if(shape==='clinic'){
  room(5,5,W-42,D-28,49,'plaster','slate');room(W-37,10,30,D-38,34,'stone','slate');awning(12,D-23,W-24,19,29,'slate');bench(W-90,D-14,35);work(W/2,D+7,'attente des soins');
 }else if(shape==='gallery-inn'||shape==='carters-inn'){
  const r=room(5,5,W-10,D-37,H-31,'plaster','tile',{chimney:true});
  // Ground gallery, not an unsupported gameplay floor.
  awning(9,r.front,W-18,29,31,'tile');bench(W-53,D-18,38);sign(18,r.front+.6,35,'records');sealed(11,D-19,11);work(W/2,D-7,'accueil de l’auberge');
  if(d.district==='etapes'){
   wall(W*.27,r.front-17,H-31,23,14,13,'plaster');roof(W*.27-2,r.front-19,27,18,H-18,H-11,'tile');window(W*.27+7,r.front-2.6,H-28,8,7,false,false);
  }else{beam(W-15,r.front,29,3,13,21);beam(W-17,r.front+11,48,12,3,3);}
 }else if(shape==='carpentry'){
  openHall({back:true,eave:49});for(const x of [15,W-43])table(x,27,30,12);for(let z=0;z<12;z+=4)beam(14,12,z,58,8,4);beam(W-41,28,9,24,2,2,'iron');work(W/2,D*.63,'assemblage');
 }else if(shape==='cart-shed'){
  // Two side bays leave a 48-unit through lane between them.
  openHall({eave:49,cover:'tile'});for(const x of [8,W-35]){box(x,9,0,27,D-18,4,'wood','plank','detail');beam(x+3,18,4,19,3,8);beam(x+3,D-24,4,19,3,8);}work(W/2,D/2,'passage de remise');
 }else if(shape==='ventilated-granary'||shape==='food-store'){
  const r=room(6,6,W-12,D-25,H-27,'wood','tile',{wide:true});
  for(const x of [17,38,59,W-29]){panelY(x,r.front+.4,29,12,9,'ink','plain');for(let k=0;k<4;k++)beam(x,r.front+.6,29+k*2,12,1,1);}
  for(const y of [15,37,59]){panelX(W-5.7,y,23,11,10,'ink','plain');for(let k=0;k<5;k++)beam(W-5.5,y,23+k*2,1,11,1);}
  awning(W-48,r.front,39,17,28,'tile');crate(W-43,D-19,15,12);work(W/2,D-6,'réception des vivres');
 }else if(shape==='stable'){
  openHall({back:true,eave:43,cover:'straw'});for(const x of [10,40,100,130]){beam(x,10,0,3,43,18);beam(x,10,16,3,43,2);}for(const x of [12,W-44]){box(x,11,0,28,12,8,'wood','plank','detail');beam(x,12,8,28,2,1);}work(W/2,D*.64,'soins et passage');
 }else if(shape==='arrival-office'||shape==='baggage-house'){
  const r=room(5,5,W-10,D-26,H-28,'plaster',shape==='arrival-office'?'slate':'tile',{wide:shape==='baggage-house'});awning(25,r.front,W-50,20,29,shape==='arrival-office'?'slate':'cloth');sign(W-25,r.front+.5,32,'records');bench(10,D-14,25);if(shape==='baggage-house')crate(W-30,D-20,16,13);work(W/2,D-6,'accueil');
 }else if(shape==='resin-workshop'){
  openHall({l:D*.58,back:true,eave:45,cover:'tile'});slab(4,D*.58,W-8,D*.42-4);
  for(const x of [17,W-49]){table(x,D*.65,30,17);box(x+4,D*.65+3,9,17,9,1,'iron','plain','detail');}
  for(const x of [12,28,W-38,W-22])sealed(x,D-19,11);work(W/2,D-8,'tri à froid');
 }else if(shape==='resin-store'){
  const r=room(7,7,W-14,D-29,42,'stone','slate',{wide:true});for(const x of [16,W-32]){panelY(x,r.front+.4,28,15,8,'ink','plain');for(let k=0;k<4;k++)beam(x,r.front+.6,28+k*2,15,1,1,'iron');}awning(18,r.front,W-36,20,28,'slate');sealed(W-30,D-20,11);work(30,D-6,'réception séparée');
 }else throw Error('Undrawn district model '+d.id);
 return true;
}
// Each district owns a small material palette; caches remain isolated. Colour
// changes are authored ramps, never an image tint or a hue filter on a PNG.
const libraries=new Map(Object.entries(C.districtPalettes).map(([district,p])=>[district,Base.createLibrary({...C,assets:C.assets.filter(d=>d.district===district),ramps:p.ramps},author)]));
const definitions=new Map(C.assets.map(d=>[d.id,d]));
const library=id=>{const d=definitions.get(id);if(!d)throw new RangeError('Référence inconnue : '+id);return libraries.get(d.district);};
const I={scale:Base.scale,project:Base.project,projection:Base.projection,palette:Base.palette,list:(filters={})=>C.assets.filter(d=>Object.entries(filters).every(([k,v])=>d[k]===v)).map(d=>JSON.parse(JSON.stringify(d))),entry:id=>library(id).entry(id),recipe:id=>library(id).recipe(id),blueprint:(id,o={})=>library(id).blueprint(id,o),paletteFor:id=>library(id).palette,pixels:(id,o={})=>library(id).pixels(id,o),raster:(id,o={})=>library(id).raster(id,o),draw:(g,o)=>library(o.id).draw(g,o),clearCache:()=>{for(const lib of libraries.values())lib.clearCache();}};
function geometry(id,{dir='face',x=0,y=0}={}){
 const d=I.entry(id);if(!d.views.includes(dir))throw new RangeError('Vue incompatible : '+dir);const t=transform(d,dir),bp=I.blueprint(id),bounds=points=>{const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]);return {x:Math.min(...xs),y:Math.min(...ys),w:Math.max(...xs)-Math.min(...xs),h:Math.max(...ys)-Math.min(...ys)};};
 const point=(a,b)=>{const q=t.point(a,b);return [q[0]+x,q[1]+y];};
 // Flush paving and the one-pixel doorstep are ground finish, not obstacles.
 const solids=bp.volumes.filter(v=>v.height>0&&v.z+v.height>3).map(v=>{const polygon=[[v.x,v.y],[v.x+v.w,v.y],[v.x+v.w,v.y+v.depth],[v.x,v.y+v.depth]].map(q=>point(...q));return {...bounds(polygon),polygon,zMin:v.z,zMax:v.z+v.height};});
 const portals=bp.meta.openings.map((a,i)=>{const q=point(a.side?a.x:a.x+a.width/2,a.side?a.y+a.width/2:a.y),n=t.normal(...(a.normal||(a.side?[1,0]:[0,1])));return {id:'door-'+i,x:q[0],y:q[1],nx:n[0],ny:n[1],width:a.width,clearance:a.clearance,z:a.z||0};});
 const workspots=(bp.meta.workspots||[]).map(w=>{const q=point(w.x,w.y);return {x:q[0],y:q[1],label:w.label};});
 const polygon=[[0,0],[d.width,0],[d.width,d.depth],[0,d.depth]].map(q=>point(...q));
 return {id,dir,foot:{...bounds(polygon),polygon},solids,portals,workspots};
}
const gameAdapter=Object.freeze({entry:I.entry,list:I.list,geometry,contains,catalogue:Object.fromEntries(C.assets.map(d=>[d.id,d])),pixels(id,options={}){const d=I.entry(id),dir=options.dir||'face',p=I.raster(id,{...options,dir}),t=transform(d,dir);return {...p,anchor:p.anchor.map((n,i)=>n+t.origin[i]),origin:t.depthOrigin};}});
return Object.freeze({...I,geometry,contains,catalogue:C,gameAdapter,status:'approved_for_game_integration',runtimeActivated:true});
});
