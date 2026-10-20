/* Native terrain geometry. Same units and projection as architecture-isometric.js.
 * Each texel is painted in world coordinates, never a rotated/resized PNG.
 * N/E/S/W mask bits = 1/2/4/8 in the logical ground plane. */
(function(root,factory){
 if(typeof module==='object'&&module.exports)module.exports=factory(require('./isometric-palettes.json'));
 else root.HearthreaverIsometricTerrain=factory(root.HearthreaverTerrainPalettes);
})(globalThis,function createIsometricTerrain(P){
'use strict';
const SIZE=16,project=(u,v,z=0)=>[u-v,(u+v)/2-z],unproject=(x,y,z=0)=>[y+z+x/2,y+z-x/2];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),mod=(a,b)=>(a%b+b)%b;
const hash=(x,y,s=0)=>{let h=Math.imul(Math.floor(x)+s,374761393)^Math.imul(Math.floor(y)-s,668265263);h=Math.imul(h^(h>>>13),1274126177);return (h^(h>>>16))>>>0;};
function noise(u,v,scale=12,seed=7){
 const x=Math.floor(u/scale),y=Math.floor(v/scale),fx=mod(u,scale)/scale,fy=mod(v,scale)/scale,a=fx*fx*(3-2*fx),b=fy*fy*(3-2*fy);
 const n=(dx,dy)=>hash(x+dx,y+dy,seed)/4294967295;
 return n(0,0)*(1-a)*(1-b)+n(1,0)*a*(1-b)+n(0,1)*(1-a)*b+n(1,1)*a*b;
}
const labels={desert:'Désert / Sarak',steppe:'Steppe',grass:'Prairie / Teremor',forest:'Forêt / Sylverive',jungle:'Jungle / Tagon',wetforest:'Forêt humide',marsh:'Marais / Varan',taiga:'Taïga / Igea',tundra:'Toundra',snow:'Neige / Igea',cursed:'Terres maudites'};
const families=Object.keys(P.profiles),palette=['#00000000',...new Set(Object.values(P.colors).flat())],indices=new Map(palette.map((c,i)=>[c,i]));
const rgb=palette.map(c=>c.length===9?[0,0,0,0]:[1,3,5].map(i=>parseInt(c.slice(i,i+2),16)).concat(255));
const colour=(mat,tone)=>{const p=P.colors[mat]||P.colors.stone;return indices.get(p[clamp(Math.round(tone),0,p.length-1)]);};
const catalogue=[];
function add(family,kind,mask=0,height=0,dir=0){const id=[family,kind,mask,height,dir].join('/');const d={id,family,kind,mask,height,dir};catalogue.push(d);return d;}
for(const f of families){
 for(const k of ['ground','bare','sand','gravel','mud','snow','ice','water','deepWater','wetSand','cobble','paving','wood'])add(f,k);
 for(const k of ['path','pavedPath','river','shore','bareEdge','snowEdge'])for(let m=0;m<16;m++)add(f,k,m);
 for(const h of [16,32])for(let m=1;m<16;m++)add(f,'cliff',m,h);
 for(let d=0;d<4;d++){for(const h of [16,32]){add(f,'stairs',0,h,d);add(f,'slope',0,h,d);}add(f,'bridge',0,4,d);add(f,'waterfall',0,24,d);}
 for(const k of ['tufts','pebbles','reeds','roots'])add(f,k);
}
const definitions=new Map(catalogue.map(d=>[d.id,d]));
function entry(id){const d=definitions.get(id);if(!d)throw new RangeError('Unknown terrain: '+id);return {...d};}
function list(filter={}){return catalogue.filter(d=>Object.entries(filter).every(([k,v])=>d[k]===v)).map(d=>({...d}));}
function definition(family,kind,mask=0,height=0,dir=0){return entry([family,kind,mask,height,dir].join('/'));}
function distance(u,v,mask){
 let d=mask?99:Math.hypot(u-8,v-8);
 if(mask&1)d=Math.min(d,Math.hypot(u-8,v-clamp(v,0,8)));
 if(mask&2)d=Math.min(d,Math.hypot(u-clamp(u,8,16),v-8));
 if(mask&4)d=Math.min(d,Math.hypot(u-8,v-clamp(v,8,16)));
 if(mask&8)d=Math.min(d,Math.hypot(u-clamp(u,0,8),v-8));
 return d;
}
function edgeDistance(u,v,mask){return Math.min(mask&1?v:99,mask&2?16-u:99,mask&4?16-v:99,mask&8?u:99);}
function base(mat,u,v){
 const n=noise(u,v,28,13),fine=noise(u,v,6,81),h=hash(Math.floor(u/2),Math.floor(v/2),3),rx=mod(Math.floor(u),6),ry=mod(Math.floor(v),6);
 let tone=3.5+(n-.5)*1.35;
 if(['sand','steppe','wetSand'].includes(mat)){
  const ridge=mod(Math.floor(v+Math.sin(u/21)*3+noise(u,v,54,16)*5),12);
  if(ridge===0&&fine>.46)tone-=.7;else if(ridge===1&&fine>.46)tone+=.25;
 }else if(['grass','forest','jungle','marsh','tundra'].includes(mat)){
  if(h%11<3&&fine>.42){if(ry===4&&rx>=2&&rx<=3)tone-=.8;if(ry===3&&rx===2)tone+=.8;if(ry===2&&rx===3&&h%3===0)tone+=.6;}
 }else if(mat==='snow'){
  const ridge=mod(Math.floor(v+Math.sin(u/31)*4),22);if(ridge===0&&fine>.55)tone-=.7;else if(ridge===1&&fine>.55)tone+=.3;
 }else if(['stone','cursed','ash','rock','mesa'].includes(mat)){
  const seam=Math.abs(noise(u,v,12,59)-.5);if(seam<.015&&fine>.45)tone-=1.2;else if(seam<.035&&fine>.45)tone+=.4;
 }
 if(h%157===0&&rx===1&&ry===2)tone--;
 return colour(mat,tone);
}
function water(d,u,v,bankDistance=99,deep=false){
 const pr=P.profiles[d.family],mat=pr.water;
 let tone=deep?1.8:bankDistance<1.5?5:bankDistance<3?4:2.8;
 const x=u-v,y=(u+v)/2,cell=hash(Math.floor(x/14),Math.floor(y/8),44),lx=mod(Math.floor(x),14),ly=mod(Math.floor(y),8);
 if(cell%5===0&&ly===2&&lx>2&&lx<7)tone+=.8;
 if(bankDistance<.65)tone=6;
 return colour(mat,tone+(noise(u,v,34,45)-.5)*.55);
}
function road(d,u,v,lu,lv,paved=false){
 const pr=P.profiles[d.family],desert=['desert','steppe'].includes(d.family),mat=paved?(desert?'pave':'stone'):(desert?'road':['marsh','wetforest'].includes(d.family)?'mud':pr.bare);
 if(paved){
  const row=Math.floor(v/5),xx=mod(u+(row%2)*4,8),yy=mod(v,5),r=hash(Math.floor((u+(row%2)*4)/8),row,27);
  return colour(mat,xx<.85||yy<.8?1:xx<1.8||yy<1.7?5:xx>6.9||yy>4?2:3.7+(r%3-1)*.5);
 }
 const dist=d.routeDistance??distance(lu,lv,d.mask),n=noise(u,v,9,34),along=d.routeAngle===undefined?(d.mask===5?v:u):u*Math.cos(d.routeAngle)+v*Math.sin(d.routeAngle);
 let tone=3.4+(noise(u,v,19,71)-.5)*.8;
 if(Math.abs(dist-1.65)<.45&&n>.32)tone-=.65;
 if(mod(Math.floor(along),11)===0&&hash(Math.floor(u),Math.floor(v),53)%11===0)tone+=1;
 if(dist>3.5)tone-=.6;
 return colour(mat,tone);
}
function top(d,lu,lv,wx=0,wy=0){
 const pr=P.profiles[d.family],u=lu+wx,v=lv+wy,n=noise(u,v,7,62),ground=pr.ground;
 // Real atlas excerpts retain analytic road centre lines and widths. Autotile
 // masks describe authored kits; they must not quantise a diagonal world road.
 if(d.routes&&['path','ground','shore','paving'].includes(d.kind)){
  let best=null;
  for(const r of d.routes){const dx=r.b[0]-r.a[0],dy=r.b[1]-r.a[1],len=dx*dx+dy*dy,t=clamp(((u-r.a[0])*dx+(v-r.a[1])*dy)/len,0,1),dist=Math.hypot(u-r.a[0]-t*dx,v-r.a[1]-t*dy);if(!best||dist-r.width<best.dist-best.width)best={dist,width:r.width,angle:Math.atan2(dy,dx)};}
  if(best&&best.dist<best.width+(n-.5)*1.2)return road({...d,routeDistance:best.dist*.48/Math.max(1,best.width)*3.4,routeAngle:best.angle},u,v,lu,lv,false);
  if(d.kind==='path')return base(ground,u,v);
 }
 switch(d.kind){
 case 'path':case 'pavedPath':{
  const dist=distance(lu,lv,d.mask),w=3.8+(n-.5)*1.3;
  return dist>w?base(ground,u,v):road(d,u,v,lu,lv,d.kind==='pavedPath');
 }
 case 'river':{
  const dist=distance(lu,lv,d.mask),w=4.6+(n-.5)*1.3;
  if(dist<w)return water(d,u,v,w-dist);
  if(dist<w+1.2)return colour(pr.bare,2);
  if(dist<w+2.5)return base(d.family==='desert'?'sand':'mud',u,v);
  return base(ground,u,v);
 }
 case 'shore':{
  const dist=edgeDistance(lu,lv,d.mask),w=5.9+(n-.5)*2.4;
  if(dist<w)return water(d,u,v,w-dist);
  if(dist<w+1.3)return colour(pr.bare,2);
  if(dist<w+3.3)return base(['snow','tundra'].includes(d.family)?'tundra':'sand',u,v);
  return base(ground,u,v);
 }
 case 'bareEdge':case 'snowEdge':{
  const dist=edgeDistance(lu,lv,d.mask),w=4+(n-.5)*3;
  return base(dist<w?(d.kind==='snowEdge'?'snow':pr.bare):ground,u,v);
 }
 case 'water':return water(d,u,v);
 case 'deepWater':return water(d,u,v,99,true);
 case 'wetSand':return colour('sand',2.5+(n-.5)*1.3);
 case 'ice':{
  const seam=Math.abs(noise(u,v,15,84)-.5);return colour('snow',seam<.013?1:seam<.03?5:2.8+(n-.5)*.7);
 }
 case 'paving':case 'cobble':return road({...d,mask:15},u,v,lu,lv,true);
 case 'wood':case 'bridge':{
  const along=d.dir%2?u:v,cross=d.dir%2?v:u,gap=mod(along,4);
  return colour('wood',gap<.8?1:gap<1.6?5:mod(cross+Math.sin(along/9),7)<1?2:3);
 }
 case 'bare':return base(pr.bare,u,v);
 case 'gravel':return colour(pr.rock,hash(Math.floor(u/3),Math.floor(v/2),81)%7===0?2:3.7+(n-.5));
 case 'cliff':return base(pr.top,u,v);
 case 'stairs':return colour(pr.rock,mod(d.dir%2?u:v,2)<.8?5:3);
 case 'slope':return base(pr.bare,u,v);
 case 'waterfall':return water(d,u,v);
 case 'ground':return base(ground,u,v);
 default:return base(d.kind,u,v);
 }
}
function side(d,u,v,z,face){
 if(d.kind==='wood')return colour('wood',face===2?2:4);
 const pr=P.profiles[d.family],along=face%2?v:u,n=noise(along,z,9,96),strata=mod(z+Math.floor(noise(along,0,12,94)*4),5);
 let tone=(face===2?2.7:3.6)+(n-.5)*.7;
 if(strata<1)tone-=1;if(strata>=4)tone+=.6;
 const crack=mod(along+Math.floor(z/6)*2+Math.floor(noise(along,0,7,17)*4),12);
 if(crack<.8&&n>.35)tone-=1.1;
 if(z<2)tone-=.9;
 if(z>d.height-1.5)tone=face===2?4:5;
 if(z<5&&['marsh','wetforest','forest','jungle'].includes(d.family)&&n>.55)return colour(pr.ground,face===2?1:2);
 return colour(pr.rock,tone);
}
function geometry(d){
 const faces=[],h=d.height||0;
 const face=(v,material='top',edge=0)=>faces.push({v,material,edge});
 function box(x,y,z,w,l,rise,material='rock'){
  if(rise>0){
   face([[x,y,z],[x+w,y,z],[x+w,y,z+rise],[x,y,z+rise]],material,1);
   face([[x+w,y,z],[x+w,y+l,z],[x+w,y+l,z+rise],[x+w,y,z+rise]],material,2);
   face([[x+w,y+l,z],[x,y+l,z],[x,y+l,z+rise],[x+w,y+l,z+rise]],material,4);
   face([[x,y+l,z],[x,y,z],[x,y,z+rise],[x,y+l,z+rise]],material,8);
  }
  face([[x,y,z+rise],[x+w,y,z+rise],[x+w,y+l,z+rise],[x,y+l,z+rise]],material==='wood'?'wood':material==='plant'?'plant':'top');
 }
 if(d.kind==='stairs'){
  for(let i=0;i<8;i++){
   const rise=(i+1)*h/8,a=(d.dir===0||d.dir===3)?14-i*2:i*2;
   if(d.dir%2)box(a,0,0,2,16,rise);else box(0,a,0,16,2,rise);
  }
 }else if(d.kind==='slope'){
  const height=(x,y)=>(d.dir===0?16-y:d.dir===1?x:d.dir===2?y:16-x)/16*h;
  const pts=[[0,0],[16,0],[16,16],[0,16]];
  for(let i=0;i<4;i++){const a=pts[i],b=pts[(i+1)%4];face([[...a,0],[...b,0],[...b,height(...b)],[...a,height(...a)]],'rock',1<<i);}
  face(pts.map(([x,y])=>[x,y,height(x,y)]));
 }else if(d.kind==='bridge'){
  box(0,0,0,16,16,4,'wood');
  for(const a of [1,14]){
   if(d.dir%2){box(0,a,10,16,1,1,'wood');for(const b of [1,14])box(b,a,4,1,1,9,'wood');}
   else{box(a,0,10,1,16,1,'wood');for(const b of [1,14])box(a,b,4,1,1,9,'wood');}
  }
 }else if(d.kind==='waterfall'){
  box(0,0,0,16,16,h);
  const edge=[1,2,4,8][d.dir],axis=d.dir%2;
  if(edge===2)face([[16.03,3,0],[16.03,13,0],[16.03,13,h],[16.03,3,h]],'fall',edge);
  if(edge===4)face([[3,16.03,0],[13,16.03,0],[13,16.03,h],[3,16.03,h]],'fall',edge);
  if(edge===1)face([[3,-.03,0],[13,-.03,0],[13,-.03,h],[3,-.03,h]],'fall',edge);
  if(edge===8)face([[-.03,3,0],[-.03,13,0],[-.03,13,h],[-.03,3,h]],'fall',edge);
 }else if(['tufts','pebbles','reeds','roots'].includes(d.kind)){
  // Decorations are thin vertical geometry, with their feet on the same plane.
  for(let i=0;i<5;i++){
   const x=3+hash(i,0,7)%11,y=3+hash(i,1,8)%11,rise=d.kind==='reeds'?5+hash(i,2)%8:d.kind==='tufts'?3:2;
   box(x,y,0,d.kind==='pebbles'?3:1,d.kind==='pebbles'?2:1,rise,d.kind==='pebbles'?'rock':'plant');
  }
 }else{
  const pts=[[0,0],[16,0],[16,16],[0,16]];
  if(h)for(let i=0;i<4;i++)if(d.mask&(1<<i)){const a=pts[i],b=pts[(i+1)%4];face([[...a,0],[...b,0],[...b,h],[...a,h]],'rock',1<<i);}
  face(pts.map(([x,y])=>[x,y,h]));
 }
 return faces;
}
function raster(input,options={}){
 const d=typeof input==='string'?entry(input):{...input},faces=geometry(d),wx=options.x||0,wy=options.y||0;
 const points=faces.flatMap(f=>f.v.map(v=>project(...v))),minX=Math.floor(Math.min(...points.map(p=>p[0]))),minY=Math.floor(Math.min(...points.map(p=>p[1]))),width=Math.ceil(Math.max(...points.map(p=>p[0])))-minX,height=Math.ceil(Math.max(...points.map(p=>p[1])))-minY;
 const data=new Uint8ClampedArray(width*height*4),pix=new Uint16Array(width*height),depth=new Float64Array(width*height).fill(-Infinity);
 function triangle(f,va,vb,vc){
  const a=project(...va),b=project(...vb),c=project(...vc),det=(b[1]-c[1])*(a[0]-c[0])+(c[0]-b[0])*(a[1]-c[1]);if(Math.abs(det)<.0001)return;
  const x0=Math.max(0,Math.floor(Math.min(a[0],b[0],c[0])-minX)),x1=Math.min(width-1,Math.ceil(Math.max(a[0],b[0],c[0])-minX));
  const y0=Math.max(0,Math.floor(Math.min(a[1],b[1],c[1])-minY)),y1=Math.min(height-1,Math.ceil(Math.max(a[1],b[1],c[1])-minY));
  for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){
   const px=x+minX+.5,py=y+minY+.5,wa=((b[1]-c[1])*(px-c[0])+(c[0]-b[0])*(py-c[1]))/det,wb=((c[1]-a[1])*(px-c[0])+(a[0]-c[0])*(py-c[1]))/det,wc=1-wa-wb;
   if(wa<-.000001||wb<-.000001||wc<-.000001)continue;
   const u=wa*va[0]+wb*vb[0]+wc*vc[0],v=wa*va[1]+wb*vb[1]+wc*vc[1],z=wa*va[2]+wb*vb[2]+wc*vc[2],i=y*width+x,dep=u+v+z*2;
   if(dep<depth[i]-.00001)continue;depth[i]=dep;
   let color;
   if(f.material==='fall'){
    const along=(f.edge===2||f.edge===8?v:u)+wx+wy,col=mod(Math.floor(along*2+noise(along,z,5,39)*2),7),foam=z<2||z>d.height-1;
    color=colour(P.profiles[d.family].water,foam?6:col<2?5:col===2?4:2);
   }else if(f.material==='wood')color=colour('wood',f.edge?f.edge===2?2:4:mod(d.dir%2?u:v,4)<.9?1:4);
   else if(f.material==='plant')color=colour(P.profiles[d.family].ground,z>3?5:2);
   else if(f.material==='top')color=top(d,u,v,wx,wy);
   else color=side(d,u+wx,v+wy,z,f.edge);
   pix[i]=color;data.set(rgb[color],i*4);
  }
 }
 for(const f of faces)for(let i=1;i<f.v.length-1;i++)triangle(f,f.v[0],f.v[i],f.v[i+1]);
 return {data,indices:pix,width,height,anchor:[-minX,-minY],id:d.id,projection:'dimetric-2:1',logicalSize:[16,16],elevation:d.height,footprint:[[0,0],[16,0],[16,16],[0,16]],surfaces:faces.map(f=>({material:f.material,edge:f.edge,vertices:f.v})),palette};
}
function draw(ctx,input,x=0,y=0,options={}){
 const im=raster(input,options),scale=options.scale||1;
 for(let y0=0;y0<im.height;y0++)for(let x0=0;x0<im.width;){const i=im.indices[y0*im.width+x0];let end=x0+1;while(end<im.width&&im.indices[y0*im.width+end]===i)end++;if(i){ctx.fillStyle=palette[i];ctx.fillRect(x+(x0-im.anchor[0])*scale,y+(y0-im.anchor[1])*scale,(end-x0)*scale,scale);}x0=end;}
 return im;
}
return Object.freeze({create:createIsometricTerrain,SIZE,project,unproject,palette,families,labels,profiles:P.profiles,colors:P.colors,list,entry,definition,raster,draw,top,geometry,noise,hash,distance});
});
