/* Hearthreaver — native architecture pixel renderer and modular construction.
 * All coordinates and drawing runs are integer native pixels. Art is indexed JS
 * data; no image URL, PNG decoder, gradient or perspective transform is used.
 */
(function(root,factory){
 if(typeof module==='object'&&module.exports)module.exports=factory(require('./architecture-data.js'));
 else root.HearthreaverArchitecture=factory(root.HearthreaverArchitectureData);
})(globalThis,function(DATA){
'use strict';
if(!DATA||DATA.version!==1)throw new Error('Architecture: native pixel data must load first');
const DIRECTIONS=Object.freeze(['face','droite','dos','gauche']);
const LAYERS=Object.freeze(['back','roof','front','mechanism','snow']);
const decoded=new Map(),renderCache=new Map();let canvasFactory=null;
const own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
function entry(id){if(!own(DATA.assets,id))throw new RangeError('Bâtiment ou module inconnu : '+id);return DATA.assets[id];}
function direction(def,value){
 if(value===undefined)return def.views[0];
 if(typeof value==='number')value=['dos','droite','face','gauche'][((value%4)+4)%4];
 if(def.kind==='module'){
  if(def.shape==='stairs'){if(value==='face'||value==='palier')return value;throw new RangeError('Escalier : face ou palier uniquement');}
  if(['face','dos','horizontal'].includes(value))value='ew';
  if(['droite','gauche','vertical','top'].includes(value))value='ns';
 }
 if(!def.views.includes(value))throw new RangeError('Vue incompatible : '+value+' / '+def.id);
 return value;
}
function seasonal(id,season){return season==='winter'&&own(DATA.assets,id+'-hiver')?id+'-hiver':id;}
function decode(key){
 if(decoded.has(key))return decoded.get(key);
 const split=key.lastIndexOf('/'),def=entry(key.slice(0,split)),view=key.slice(split+1),f=def.frames[view];
 if(!f)throw new RangeError('Vue inconnue');const [w,h]=f.size,values=DATA.pixels[key],out=new Uint8Array(w*h);let p=0;
 const run=(colour,length)=>{if(colour<0||colour>=DATA.palette.length||!Number.isInteger(length)||length<1||p+length>out.length)throw new Error('Architecture: invalid native run '+key);out.fill(colour,p,p+length);p+=length;};
 if(typeof values==='string')for(const token of values){let v=token.codePointAt(0);if(v>=0xe000)v-=0x800;run(v&127,v>>>7);}
 else for(let i=0;i<values.length;i+=2)run(values[i],values[i+1]);
 if(p!==out.length)throw new Error('Architecture: truncated pixels '+key);
 decoded.set(key,out);return out;
}
const rgba=DATA.palette.map(hex=>hex.length===9?[0,0,0,0]:[parseInt(hex.slice(1,3),16),parseInt(hex.slice(3,5),16),parseInt(hex.slice(5,7),16),255]);
function colourNear(rgb){let best=1,dist=Infinity;for(let i=1;i<rgba.length;i++){const p=rgba[i],d=(p[0]-rgb[0])**2+(p[1]-rgb[1])**2+(p[2]-rgb[2])**2;if(d<dist){dist=d;best=i;}}return best;}
const INK=colourNear([15,12,20]),DARK=colourNear([35,24,26]),WOOD=colourNear([115,71,39]),WOOD_LIGHT=colourNear([176,121,63]),IRON=colourNear([65,62,61]);
function normalize(id,options={}){const resolved=seasonal(id,options.season),def=entry(resolved),dir=direction(def,options.dir);return {id:resolved,def,dir};}
function doorRects(def,view){
 if(def.kind!=='building'||view!=='face'||def.openHall)return [];
 const w=def.frames[view].size[0],h=def.height,gate=/^F(07|08|09|10|11)$/.test(def.id),dw=gate?28:12,clear=def.doorClearance;
 // Native structural threshold. Snow variants keep the same world plan.
 return def.entrances.map(f=>({x:Math.round(w*f-dw/2),y:h-clear-2,w:dw,h:clear,threshold:h-2}));
}
function artLayers(def,dir,indices){
 const [w,h]=def.frames[dir].size,out=new Uint8Array(indices.length),flat=def.family==='sarak'||/^F(06|08|10|11|12)$/.test(def.id),cut=def.kind==='building'?Math.round(h*(flat?.20:.35)):0;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const i=y*w+x;if(!indices[i])continue;const p=rgba[indices[i]];
  if(def.mechanism?.views.includes(dir)){
   const m=def.mechanism,dx=x-m.center[0],dy=y-m.center[1],radius=Math.hypot(dx,dy),wood=p[0]>p[1]*1.08&&p[0]>p[2]*1.25,dark=Math.max(...p.slice(0,3))<75;
   const region=m.type==='sails'?radius<m.radius&&(Math.abs(Math.abs(dx)-Math.abs(dy))<5||radius<7):radius<m.radius;
   if(region&&(wood||dark)){out[i]=4;continue;}
  }
  if(def.season==='winter'&&y<h*.62&&p[2]>p[0]*.82&&p[2]>130&&p[0]>130){out[i]=5;continue;}
  if(def.kind==='module'){
   out[i]=['parapet','railing'].includes(def.shape)?3:def.shape.startsWith('roof')||def.shape==='gable'||def.shape==='ridge'?2:1;
   if(def.high&&dir==='ew'&&!['stairs','deck'].includes(def.shape)&&y<def.parapetHeight)out[i]=3;
  }else out[i]=y<cut?2:y>=h-8?3:1;
 }
 return out;
}
function pixels(id,options={}){
 const {id:resolved,def,dir}=normalize(id,options),meta=def.frames[dir],[w,h]=meta.size;
 const source=decode(resolved+'/'+dir),out=new Uint8Array(source),layers=artLayers(def,dir,source);
 if(def.high&&dir==='ew'&&Number(options.opening)>0){
  const gap=Math.min(w,Math.round(options.opening)),left=Math.floor((w-gap)/2);
  for(let y=0;y<Math.min(h,def.parapetHeight);y++)for(let x=left;x<left+gap;x++)out[y*w+x]=0;
 }
 if(options.roof===false)for(let i=0;i<out.length;i++)if(layers[i]===2)out[i]=0;
 // Door geometry is native too. The opened threshold is a dark interior, with
 // two straight leaves folded flush to jambs: no oblique door planes.
 if(options.open!==undefined){
  const amount=clamp(Number(options.open)||0,0,1);
  for(const d of doorRects(def,dir)){
   for(let y=Math.max(0,d.y);y<Math.min(h,d.y+d.h);y++)for(let x=Math.max(0,d.x);x<Math.min(w,d.x+d.w);x++){
    const i=y*w+x,edge=Math.min(x-d.x,d.x+d.w-1-x),leaf=Math.max(1,Math.round(d.w*.5*(1-amount)));
    out[i]=edge<leaf?(x%3===0?WOOD_LIGHT:WOOD):DARK;layers[i]=3;
    if((x===d.x||x===d.x+d.w-1)||y===d.y+d.h-1)out[i]=INK;
    if(edge<leaf&&(y-d.y===5||y-d.y===d.h-5))out[i]=IRON;
   }
  }
 }
 const layer=options.layer||'all';if(layer!=='all'){
  const n=LAYERS.indexOf(layer)+1;if(!n)throw new RangeError('Calque inconnu : '+layer);
  for(let i=0;i<out.length;i++)if(layers[i]!==n)out[i]=0;
 }
 return {id:resolved,dir,width:w,height:h,anchor:meta.anchor.slice(),indices:out,layers,palette:DATA.palette};
}
function raster(id,options={}){const p=pixels(id,options),data=new Uint8ClampedArray(p.width*p.height*4);for(let i=0;i<p.indices.length;i++){const c=rgba[p.indices[i]];data.set(c,i*4);}return {...p,data};}
function drawRuns(ctx,p,dx,dy,scale){
 for(let y=0;y<p.height;y++){let x=0;while(x<p.width){const colour=p.indices[y*p.width+x];let end=x+1;while(end<p.width&&p.indices[y*p.width+end]===colour)end++;if(colour){ctx.fillStyle=DATA.palette[colour];ctx.fillRect(dx+x*scale,dy+y*scale,(end-x)*scale,scale);}x=end;}}
}
function canvasFor(w,h){
 if(canvasFactory)return canvasFactory(w,h);
 if(typeof OffscreenCanvas!=='undefined')return new OffscreenCanvas(w,h);
 if(typeof document!=='undefined'){const cv=document.createElement('canvas');cv.width=w;cv.height=h;return cv;}
 return null;
}
function draw(ctx,options={}){
 const {id,x=0,y=0,scale=1}=options;if(!Number.isInteger(scale)||scale<1||scale>32)throw new RangeError('Échelle entière de 1 à 32 requise');
 const def=entry(id),resolved=seasonal(id,options.season),dir=direction(entry(resolved),options.dir);
 const key=[resolved,dir,options.layer||'all',options.roof===false?0:1,Math.round(options.opening||0),options.open===undefined?'static':Math.round(clamp(Number(options.open)||0,0,1)*12)].join('|');
 let cached=renderCache.get(key);
 if(!cached){const normalizedOptions=options.open===undefined?options:{...options,open:Math.round(clamp(Number(options.open)||0,0,1)*12)/12};const p=pixels(id,normalizedOptions),cv=canvasFor(p.width,p.height);if(cv){const c=cv.getContext('2d');c.imageSmoothingEnabled=false;drawRuns(c,p,0,0,1);}cached={p,cv};renderCache.set(key,cached);if(renderCache.size>256)renderCache.delete(renderCache.keys().next().value);}
 const lift=entry(resolved).frames[dir].lift||0;
 const dx=Math.round(x)-cached.p.anchor[0]*scale,dy=Math.round(y)-(cached.p.anchor[1]+lift)*scale;
 ctx.save();ctx.imageSmoothingEnabled=false;if(cached.cv)ctx.drawImage(cached.cv,dx,dy,cached.p.width*scale,cached.p.height*scale);else drawRuns(ctx,cached.p,dx,dy,scale);ctx.restore();
 return {x:dx,y:dy,w:cached.p.width*scale,h:cached.p.height*scale,definition:def};
}
function rotatePoint(x,y,turns){for(let i=0;i<turns;i++){[x,y]=[-y,x];}return [x,y];}
function buildingPlan(def,dir){
 const turn={face:0,droite:3,dos:2,gauche:1}[dir],w=def.width,d=def.depth;
 const ow=turn%2?d:w,od=turn%2?w:d,foot={x:-ow/2,y:-od,w:ow,h:od};
 const portals=def.entrances.map((f,index)=>{
  const p=rotatePoint((f-.5)*w,d/2,turn),n=rotatePoint(0,1,turn);
  return {id:'door-'+index,x:p[0],y:p[1]-od/2,nx:n[0],ny:n[1],width:/^F(07|08|09|10|11)$/.test(def.id)?28:12,clearance:def.doorClearance};
 });return {foot,portals};
}
function notch(rect,p,depth=8){
 const gap=p.width/2+1,x0=rect.x,x1=x0+rect.w,y0=rect.y,y1=y0+rect.h;
 if(p.ny){const left=clamp(p.x-gap,x0,x1),right=clamp(p.x+gap,x0,x1);return [{x:x0,y:y0,w:left-x0,h:rect.h},{x:right,y:y0,w:x1-right,h:rect.h},{x:left,y:p.ny>0?y0:y0+depth,w:right-left,h:rect.h-depth}].filter(r=>r.w>0&&r.h>0);}
 const top=clamp(p.y-gap,y0,y1),bottom=clamp(p.y+gap,y0,y1);return [{x:x0,y:y0,w:rect.w,h:top-y0},{x:x0,y:bottom,w:rect.w,h:y1-bottom},{x:p.nx>0?x0:x0+depth,y:top,w:rect.w-depth,h:bottom-top}].filter(r=>r.w>0&&r.h>0);
}
function modulePlan(def,dir,options={}){
 const s=def.shape,w=def.width,t=def.wallThickness,slot=t,ns=dir==='ns';let solids=[],walkables=[],sockets=[];
 const port=(id,x,y,nx,ny,z=def.walkHeight,width=t)=>sockets.push({id,x,y,nx,ny,z,width,material:def.material||'mixed'});
 if(['corner-outer','corner-inner','junction-t'].includes(s)){
  const horizontal={x:-24,y:-slot,w:48,h:slot};
  const vertical={x:s==='junction-t'?-slot/2:(dir==='ew'?-24:24-slot),y:-48,w:slot,h:48};
  solids=[horizontal,vertical];port('west',-24,-slot/2,-1,0);port('east',24,-slot/2,1,0);port('north',vertical.x+slot/2,-48,0,-1);
  if(s!=='junction-t')sockets=sockets.filter(p=>p.id!==(dir==='ew'?'west':'east'));
 }else if(s==='stairs'){
  const length=def.depth;walkables=[{x:-12,y:-length,w:24,h:length,zFrom:0,zTo:def.walkHeight,axis:'north'}];
  port('ground',0,0,0,1,0,def.high?t:16);port('landing',0,-length,0,-1,def.walkHeight,def.high?t:16);
 }else{
  const flat=['deck','landing','platform-raised','bridge-wood','bridge-stone','quay-wood','quay-stone','jetty-end','ramp','awning','scaffold'].includes(s);
  const depth=flat?def.depth:t,rect=ns?{x:-depth/2,y:-w,w:depth,h:w}:{x:-w/2,y:-depth,w,h:depth};
  const overlay=['window-shutters','window-bars','screen','gutter','drain','roof-flat','roof-thatch','roof-fibre','roof-shingle','roof-tile','ridge','gable','awning','vent'].includes(s);
  if(!overlay&&!flat)solids=[rect];if(flat&&!['awning','scaffold'].includes(s))walkables=[{...rect,z:def.walkHeight}];
  const interfaceWidth=def.high?t:flat?Math.min(16,depth):t;
  if(ns){port('north',0,-w,0,-1,def.walkHeight,interfaceWidth);port('south',0,0,0,1,def.walkHeight,interfaceWidth);}
  else{port('west',-w/2,-depth/2,-1,0,def.walkHeight,interfaceWidth);port('east',w/2,-depth/2,1,0,def.walkHeight,interfaceWidth);}
  if(s==='deck'||s==='landing'){
   if(ns){port('west',-depth/2,-w/2,-1,0,def.walkHeight,interfaceWidth);port('east',depth/2,-w/2,1,0,def.walkHeight,interfaceWidth);}
   else{port('north',0,-depth,0,-1,def.walkHeight,interfaceWidth);port('south',0,0,0,1,def.walkHeight,interfaceWidth);}
  }
  if(s==='end')sockets=sockets.filter(p=>p.id===(ns?'north':'west'));
  if(def.high&&['curtain','stockade'].includes(s)){
   if(ns)port('inner',-depth/2,-w/2,-1,0,def.walkHeight,t);
   else port('inner',0,-depth,0,-1,def.walkHeight,t);
  }
 }
 if(def.high&&!['stairs','parapet','deck'].includes(s))walkables=solids.map(r=>({...r,z:def.walkHeight}));
 if(def.high&&dir==='ew'&&Number(options.opening)>0)solids=solids.flatMap(r=>notch(r,{x:0,y:0,nx:0,ny:1,width:Number(options.opening)},4));
 solids=solids.map(r=>({...r,zMin:s==='parapet'?def.walkHeight:0,zMax:s==='parapet'?def.totalHeight:def.high?def.walkHeight:def.totalHeight}));
 if(def.high&&!['stairs','parapet','deck'].includes(s)){
  const rail=4,gap=Math.min(w,Math.max(0,Math.round(options.opening||0)));
  if(!ns||s.startsWith('corner')||s==='junction-t'){
   for(const r of [{x:-w/2,y:-rail,w:(w-gap)/2,h:rail},{x:gap/2,y:-rail,w:(w-gap)/2,h:rail}])if(r.w)solids.push({...r,zMin:def.walkHeight,zMax:def.totalHeight});
  }else if(!s.startsWith('corner')&&s!=='junction-t')solids.push({x:t/2-rail,y:-w,w:rail,h:w,zMin:def.walkHeight,zMax:def.totalHeight});
  if(s.startsWith('corner'))solids.push({x:dir==='ew'?-24:24-rail,y:-48,w:rail,h:48,zMin:def.walkHeight,zMax:def.totalHeight});
 }
 return {foot:boundsOf([...solids,...walkables]),solids,walkables,sockets,portals:[]};
}
function boundsOf(rects){if(!rects.length)return {x:0,y:0,w:0,h:0};const x=Math.min(...rects.map(r=>r.x)),y=Math.min(...rects.map(r=>r.y));return {x,y,w:Math.max(...rects.map(r=>r.x+r.w))-x,h:Math.max(...rects.map(r=>r.y+r.h))-y};}
function geometry(id,options={}){
 const {def,dir}=normalize(id,options);let g;
 if(def.kind==='module')g=modulePlan(def,dir,options);
 else{
  const plan=buildingPlan(def,dir);let rects=[plan.foot];
  if(/^F(07|08|09|10|11)$/.test(def.id)){
   const r=plan.foot,horizontal=dir==='face'||dir==='dos',passage=28;
   rects=horizontal?[{x:r.x,y:r.y,w:(r.w-passage)/2,h:r.h},{x:passage/2,y:r.y,w:(r.w-passage)/2,h:r.h}]:[{x:r.x,y:r.y,w:r.w,h:(r.h-passage)/2},{x:r.x,y:r.y+(r.h+passage)/2,w:r.w,h:(r.h-passage)/2}];
  }
  else if(def.openHall){const r=plan.foot;rects=[{x:r.x,y:r.y,w:6,h:6},{x:r.x+r.w-6,y:r.y,w:6,h:6},{x:r.x,y:r.y+r.h-6,w:6,h:6},{x:r.x+r.w-6,y:r.y+r.h-6,w:6,h:6}];}
  else for(const p of plan.portals)rects=rects.flatMap(r=>notch(r,p));
  g={...plan,solids:rects.map(r=>({...r,zMin:0,zMax:def.height})),walkables:[],sockets:[]};
  if(/^F(07|08|09|10|11)$/.test(def.id)){
   g.solids.push({...plan.foot,zMin:32,zMax:def.height});
   if(options.open===0)g.solids.push({...plan.foot,zMin:0,zMax:32});
  }
  if(def.openHall)g.solids.push({...plan.foot,zMin:Math.max(24,Math.round(def.height*.65)),zMax:def.height});
 }
 const x=Math.round(options.x||0),y=Math.round(options.y||0),shift=r=>({...r,x:r.x+x,y:r.y+y});
 return {...g,id:def.id,dir,foot:shift(g.foot),solids:g.solids.map(shift),walkables:g.walkables.map(shift),sockets:(g.sockets||[]).map(shift),portals:(g.portals||[]).map(shift)};
}
function contains(rect,x,y,radius=0){return x+radius>rect.x&&x-radius<rect.x+rect.w&&y+radius>rect.y&&y-radius<rect.y+rect.h;}
function collides(instances,x,y,{radius=0,z=0,height=19}={}){return instances.some(o=>geometry(o.id,o).solids.some(r=>z+height>r.zMin&&z<r.zMax&&contains(r,x,y,radius)));}
function standingHeight(instances,x,y){
 let best=0;for(const o of instances)for(const r of geometry(o.id,o).walkables)if(contains(r,x,y)){
  const z=r.z===undefined?r.zFrom+(r.zTo-r.zFrom)*clamp((r.y+r.h-y)/r.h,0,1):r.z;best=Math.max(best,z);
 }return best;
}
function attach(a,aPort,b,bPort){
 const ga=geometry(a.id,a),gb=geometry(b.id,{...b,x:0,y:0}),p=ga.sockets.find(p=>p.id===aPort),q=gb.sockets.find(p=>p.id===bPort);
 if(!p||!q)throw new RangeError('Raccord inconnu');
 if(p.nx!==-q.nx||p.ny!==-q.ny)throw new Error('Les raccords doivent se faire face');
 if(p.z!==q.z)throw new Error('Niveaux de marche différents : '+p.z+' / '+q.z);
 if(p.width!==q.width)throw new Error('Épaisseurs de raccord différentes : '+p.width+' / '+q.width);
 return {...b,x:p.x-q.x,y:p.y-q.y};
}
function svg(id,options={}){const p=pixels(id,options),rects=[];for(let y=0;y<p.height;y++){let x=0;while(x<p.width){const c=p.indices[y*p.width+x];let end=x+1;while(end<p.width&&p.indices[y*p.width+end]===c)end++;if(c)rects.push('<rect x="'+x+'" y="'+y+'" width="'+(end-x)+'" height="1" fill="'+DATA.palette[c]+'"/>');x=end;}}return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 '+p.width+' '+p.height+'" width="'+p.width+'" height="'+p.height+'" shape-rendering="crispEdges">'+rects.join('')+'</svg>';}
function list(options={}){return Object.values(DATA.assets).filter(d=>(!options.family||options.family==='all'||d.family===options.family)&&(!options.kind||d.kind===options.kind)&&(!options.season||d.season===options.season));}
function snapshot(instance){if(!instance||typeof instance!=='object')throw new TypeError('Instance architecturale attendue');const def=entry(instance.id),dir=direction(def,instance.dir),x=instance.x??0,y=instance.y??0;if(!Number.isFinite(x)||!Number.isFinite(y))throw new RangeError('Coordonnées natives finies requises');return {id:def.id,dir,x:Math.round(x),y:Math.round(y),...(instance.open===undefined?{}:{open:clamp(Number(instance.open)||0,0,1)}),...(instance.opening?{opening:clamp(Math.round(instance.opening),0,def.width)}:{})};}
function kitFor(family='teremor',tier='regional'){
 const prefix={teremor:'TER',sylverive:'SYL',igea:'IGE',sarak:'SAR',varan:'VAR',tagon:'TAG'}[family];
 if(!prefix)throw new RangeError('Famille inconnue');
 const start={village:49,bourg:57,chateau:65}[tier];
 const ids=start?Array.from({length:8},(_,i)=>'M'+String(start+i).padStart(2,'0')):Array.from({length:8},(_,i)=>prefix+'-H'+String(i+1).padStart(2,'0'));
 return Object.freeze({family,tier,wall:ids[0],end:ids[1],outer:ids[2],inner:ids[3],junction:ids[4],deck:ids[5],stairs:ids[6],parapet:ids[7]});
}
function assembly(family='teremor',tier='regional'){
 const k=kitFor(family,tier),wall={id:k.wall,dir:'ew',x:-48,y:0},second=attach(wall,'east',{id:k.wall,dir:'ew'},'west'),corner=attach(second,'east',{id:k.outer,dir:'ns'},'west'),north=attach(corner,'north',{id:k.wall,dir:'ns'},'south');
 second.opening=24;
 const d=entry(k.deck),deck={id:k.deck,dir:'ew',x:second.x,y:0},stairs=attach(deck,'south',{id:k.stairs,dir:'face'},'landing');
 return [north,corner,wall,second,deck,stairs];
}
function parentWall(def){
 if(!def.high)return null;
 if(def.id.includes('-H'))return def.id.split('-H')[0]+'-H01';
 return 'M'+String(49+Math.floor((Number(def.id.slice(1))-49)/8)*8).padStart(2,'0');
}
function drawStructure(ctx,o){
 const d=entry(o.id),dir=direction(d,o.dir),parent=parentWall(d),corner=d.shape?.startsWith('corner')||d.shape==='junction-t'&&dir==='ns';
 if(parent&&corner){
  // Complete the horizontal elevation below the independent overhead junction.
  // Every edge is still horizontal/vertical. The plan part is not a 3D render.
  draw(ctx,{...o,id:parent,dir:'ew',layer:'all'});draw(ctx,o);
  const p=pixels(parent,{dir:'ew'}),parapet=d.parapetHeight,scale=o.scale||1,px=Math.round(o.x||0)-p.anchor[0]*scale,py=Math.round(o.y||0)-p.height*scale;
  const top={...p,height:parapet,indices:p.indices.slice(0,p.width*parapet)};drawRuns(ctx,top,px,py,scale);
  return;
 }
 draw(ctx,o);
}
function drawAssembly(ctx,instances,options={}){
 const scale=options.scale||1,x=options.x||0,y=options.y||0;
 for(const o of [...instances].sort((a,b)=>(a.y||0)-(b.y||0)))drawStructure(ctx,{...o,x:x+(o.x||0)*scale,y:y+(o.y||0)*scale,scale});
}
function validate(){const errors=[];for(const d of Object.values(DATA.assets))for(const view of d.views){try{const p=pixels(d.id,{dir:view});if(!p.indices.some(Boolean))errors.push(d.id+'/'+view+': empty');if(p.anchor.some(v=>!Number.isInteger(v)))errors.push(d.id+'/'+view+': fractional anchor');}catch(e){errors.push(e.message);}}return {ok:!errors.length,errors,assets:Object.keys(DATA.assets).length,views:Object.keys(DATA.pixels).length};}
return Object.freeze({version:1,scale:Object.freeze({...DATA.scale}),directions:DIRECTIONS,layers:LAYERS,palette:Object.freeze(DATA.palette.slice()),catalogue:Object.freeze(DATA.assets),entry,list,pixels,raster,draw,drawStructure,drawAssembly,geometry,collides,standingHeight,attach,kitFor,assembly,svg,snapshot,validate,setCanvasFactory(f){canvasFactory=f;renderCache.clear();},clearCache(){decoded.clear();renderCache.clear();}});
});
