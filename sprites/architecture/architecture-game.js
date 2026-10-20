/* Runtime adapter: projected native geometry shares the game's world XY plane.
 * It rotates a complete local building, never the terrain or the actors. */
(function(r,f){if(typeof module==='object'&&module.exports)module.exports=f(require('./architecture.js'),require('./architecture-isometric.js'),require('./isometric-pixels.js'));else r.HearthreaverArchitectureGame=f(r.HearthreaverArchitecture,r.HearthreaverIsometric,r.HearthreaverIsometricPixels);})(globalThis,function(Base,I,P){
'use strict';
const definitions=new Map(),plans=new Map(),decoded=new Map(),layers=['wall','roof','detail','mechanism','snow'];
function normalize(id,o={}){if(o.season==='winter'&&Base.catalogue[id+'-hiver'])id+='-hiver';const clean=Base.snapshot({...o,id});if(/^F(07|08|09|10|11)$/.test(id)&&clean.open===undefined)clean.open=1;return {d:I.entry(id),o:clean};}
function transform(d,dir){
 const q=d.kind==='building'?d.views.indexOf(dir):dir==='ns'?1:0,W=d.width,D=d.depth,ow=q%2?D:W,od=q%2?W:D,origin=[(ow-od)/2,(W+D)/2];
 const rotate=(x,y)=>q===0?[x,y]:q===1?[D-y,x]:q===2?[W-x,D-y]:[y,W-x];
 const point=(x,y)=>{const r=rotate(x,y),p=I.project(...r);return [p[0]-origin[0],p[1]-origin[1]];};
 const normal=(x,y)=>{const a=point(0,0),b=point(x,y),dx=b[0]-a[0],dy=b[1]-a[1],len=Math.hypot(dx,dy);return [dx/len,dy/len];};
 return {point,normal,origin};
}
function entry(id){
 if(!definitions.has(id)){
  const d=Base.entry(id),frames={};for(const dir of d.views){const p=P.frames[id+'/'+dir],t=transform(d,dir);frames[dir]={size:[p.width,p.height],anchor:[p.anchor[0]+t.origin[0],p.anchor[1]+t.origin[1]],lift:0};}
  definitions.set(id,{...d,frames,projection:'dimetric-2:1'});
 }return definitions.get(id);
}
function bounds(points){const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]),x=Math.min(...xs),y=Math.min(...ys);return {x,y,w:Math.max(...xs)-x,h:Math.max(...ys)-y};}
function polygonRect(t,x,y,w,h,zMin=0,zMax=1){const polygon=[[x,y],[x+w,y],[x+w,y+h],[x,y+h]].map(v=>t.point(...v));return {...bounds(polygon),polygon,zMin,zMax};}
function contains(r,x,y,radius=0){
 if(x+radius<r.x||x-radius>r.x+r.w||y+radius<r.y||y-radius>r.y+r.h)return false;
 if(!r.polygon)return x+radius>r.x&&x-radius<r.x+r.w&&y+radius>r.y&&y-radius<r.y+r.h;
 let pos=false,neg=false,distance=Infinity;
 for(let i=0;i<r.polygon.length;i++){
  const a=r.polygon[i],b=r.polygon[(i+1)%r.polygon.length],dx=b[0]-a[0],dy=b[1]-a[1],cross=dx*(y-a[1])-dy*(x-a[0]);if(cross>1e-6)pos=true;if(cross< -1e-6)neg=true;
  const u=Math.max(0,Math.min(1,((x-a[0])*dx+(y-a[1])*dy)/(dx*dx+dy*dy||1)));distance=Math.min(distance,(x-a[0]-u*dx)**2+(y-a[1]-u*dy)**2);
 }return !(pos&&neg)||distance<radius*radius;
}
function localPlan(id,o){
 const {d}=normalize(id,o),t=transform(d,o.dir),bp=I.blueprint(id,o),solids=bp.volumes.filter(v=>v.height>0&&!(v.z===0&&v.height<=5&&v.w>20&&v.depth>20)).map(v=>polygonRect(t,v.x,v.y,v.w,v.depth,v.z,v.z+v.height));
 if(/^F(07|08|09|10|11)$/.test(id)&&o.open===0){const tw=Math.floor(d.width*.23);solids.push(polygonRect(t,tw,d.depth*.8,d.width-2*tw,4,0,d.height*.55));}
 const openings=bp.meta.openings.length?bp.meta.openings:d.kind==='building'?[{x:d.width*.23,y:d.depth-6-(bp.recipe?.type==='market'||d.openHall?Math.floor(d.depth*.27):0),z:0,width:22,clearance:24,kind:'open'}]:[];
 const portals=openings.map((p,i)=>{const at=t.point(p.side?p.x:p.x+p.width/2,p.side?p.y+p.width/2:p.y),n=t.normal(p.side?1:0,p.side?0:1);return {id:'door-'+i,x:at[0],y:at[1],nx:n[0],ny:n[1],width:p.width,clearance:p.clearance,z:p.z||0};});
 const full=polygonRect(t,0,0,d.width,d.depth,0,d.height),low=solids.filter(v=>v.zMin<19),foot=bounds([full,...low].flatMap(r=>r.polygon));
 const walkables=[];
 if(d.kind==='module'){
  if(d.shape==='stairs'||d.shape==='ramp')for(const v of bp.volumes.filter(v=>v.z===0&&v.style!=='timber'))walkables.push({...polygonRect(t,v.x,v.y,v.w,v.depth),z:v.height});
  else if(d.walkHeight)walkables.push({...full,z:d.walkHeight});
 }
 const workspots=d.openHall?[.35,.5].flatMap(row=>[.22,.45,.7,.82].map(f=>{const p=t.point(d.width*f,d.depth*row);return {x:p[0],y:p[1]};})).filter(p=>!solids.some(r=>r.zMin<19&&r.zMax>0&&contains(r,p.x,p.y,5))):[];
 const sockets=[];
 if(d.kind==='module'){
  const W=d.width,D=d.depth,thickness=d.wallThickness||Math.min(D,8),z=d.walkHeight||0,width=d.high?thickness:Math.min(16,D),shape=d.shape;
  const port=(id,x,y,nx,ny,h=z,w=width)=>{const p=t.point(x,y),n=t.normal(nx,ny);sockets.push({id,x:p[0],y:p[1],nx:n[0],ny:n[1],z:h,width:w});};
  if(shape==='stairs'){port('ground',W/2,D,0,1,0);port('landing',W/2,0,0,-1);}
  else if(shape==='corner-outer'){port('west',0,thickness/2,-1,0);port('south',W-thickness/2,D,0,1);}
  else if(shape==='corner-inner'){port('east',W,D-thickness/2,1,0);port('north',thickness/2,0,0,-1);}
  else if(shape==='junction-t'){port('west',0,thickness/2,-1,0);port('east',W,thickness/2,1,0);port('south',W/2,D,0,1);}
  else{port('west',0,D/2,-1,0);if(shape!=='end')port('east',W,D/2,1,0);if(['deck','landing','platform-raised','quay-wood','quay-stone'].includes(shape)){port('north',W/2,0,0,-1);port('south',W/2,D,0,1);}}
 }
 return {id,dir:o.dir,foot,solids,walkables,portals,sockets,workspots};
}
function geometry(id,options={}){
 const n=normalize(id,options),o=n.o,key=n.d.id+'/'+o.dir+'/'+(o.open===0?0:1)+'/'+(o.opening||0);if(!plans.has(key))plans.set(key,localPlan(n.d.id,o));const g=plans.get(key),x=o.x,y=o.y;
 const shift=r=>({...r,x:r.x+x,y:r.y+y,...(r.polygon?{polygon:r.polygon.map(p=>[p[0]+x,p[1]+y])}:{})});
 return {...g,foot:shift(g.foot),solids:g.solids.map(shift),walkables:g.walkables.map(shift),portals:g.portals.map(shift),sockets:g.sockets.map(shift),workspots:g.workspots.map(shift)};
}
function collides(objects,x,y,{radius=0,z=0,height=19}={}){return objects.some(o=>geometry(o.id,o).solids.some(r=>r.zMin<z+height&&r.zMax>z&&contains(r,x,y,radius)));}
function standingHeight(objects,x,y){let height=0;for(const o of objects)for(const p of geometry(o.id,o).walkables)if(contains(p,x,y))height=Math.max(height,p.z);return height;}
function attach(a,aPort,b,bPort){
 const ga=geometry(a.id,a),gb=geometry(b.id,{...b,x:0,y:0}),p=ga.sockets.find(v=>v.id===aPort),q=gb.sockets.find(v=>v.id===bPort);
 if(!p||!q)throw new RangeError('Raccord inconnu');
 if(Math.abs(p.nx+q.nx)>1e-6||Math.abs(p.ny+q.ny)>1e-6)throw new Error('Les raccords doivent se faire face');
 if(p.z!==q.z)throw new Error('Niveaux de marche différents');if(p.width!==q.width)throw new Error('Épaisseurs de raccord différentes');
 return {...b,x:p.x-q.x,y:p.y-q.y};
}
function decode(text,size){const out=new Uint8Array(size);let n=0;for(const ch of text){let code=ch.codePointAt(0);if(code>=0xe000)code-=0x800;const len=code>>>7,value=code&127;out.fill(value,n,n+len);n+=len;}if(n!==size)throw Error('Native pixel run length mismatch');return out;}
function pixels(id,options={}){
 const {d,o}=normalize(id,options),key=d.id+'/'+o.dir,t=transform(d,o.dir);let p;
 if(options.weather===false||o.open===1||options.mechanismFrame){p=I.raster(d.id,{...options,dir:o.dir});}
 else{
  if(!decoded.has(key)){const f=P.frames[key],size=f.width*f.height;decoded.set(key,{...f,indices:decode(f.indices,size),layers:decode(f.layers,size),groundDepth:Float32Array.from(decode(f.depths,size),v=>(v-1)*8+4)});if(decoded.size>128)decoded.delete(decoded.keys().next().value);}
  p=decoded.get(key);
 }
 const indices=new Uint8Array(p.indices),data=new Uint8ClampedArray(indices.length*4),li=options.layer&&options.layer!=='all'?layers.indexOf(options.layer==='back'?'wall':options.layer==='front'?'detail':options.layer)+1:0;
 for(let i=0;i<indices.length;i++){const index=indices[i];if(!index||li&&p.layers[i]!==li){indices[i]=0;continue;}const hex=I.palette[index];data.set([parseInt(hex.slice(1,3),16),parseInt(hex.slice(3,5),16),parseInt(hex.slice(5,7),16),255],i*4);}
 return {...p,data,indices,layers:new Uint8Array(p.layers),groundDepth:new Float32Array(p.groundDepth),anchor:[p.anchor[0]+t.origin[0],p.anchor[1]+t.origin[1]],origin:t.origin};
}
function drawStructure(ctx,options){const {d,o}=normalize(options.id,options),t=transform(d,o.dir),scale=options.scale||1;return I.draw(ctx,{...options,id:d.id,dir:o.dir,x:(o.x||0)-t.origin[0]*scale,y:(o.y||0)-t.origin[1]*scale});}
function list(filters){return Base.list(filters).map(d=>entry(d.id));}
return Object.freeze({version:1,projection:I.projection,scale:I.scale,palette:I.palette,catalogue:Base.catalogue,entry,list,geometry,contains,collides,standingHeight,attach,pixels,raster:pixels,draw:drawStructure,drawStructure,snapshot:Base.snapshot,kitFor:Base.kitFor,transform});
});
