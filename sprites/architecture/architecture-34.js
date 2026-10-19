/* Hearthreaver architecture v2: native pixel orthographic three-quarter volumes.
 * Authored cardinal artwork supplies the distinct facade, end wall and material
 * textures. No image files or image transforms are loaded by this renderer.
 * This optional library does not patch or load into the game.
 */
(function(root,factory){
 if(typeof module==='object'&&module.exports)module.exports=factory(require('./architecture.js'));
 else root.HearthreaverArchitecture34=factory(root.HearthreaverArchitecture);
})(globalThis,function(A){
'use strict';
const palette=[...A.palette,'#e9f1ed','#c9dde0','#96b1b9','#6e8f9b'],cache=new Map(),dirs=['face','droite','dos','gauche'];
const RGB=palette.map(c=>c.length===9?[0,0,0]:[parseInt(c.slice(1,3),16),parseInt(c.slice(3,5),16),parseInt(c.slice(5,7),16)]);
const nearest=c=>{let best=1,dist=Infinity;for(let i=1;i<RGB.length;i++){const d=RGB[i].reduce((s,v,j)=>s+(v-c[j])**2,0);if(d<dist){dist=d;best=i;}}return best;};
const shadeCache=new Map();function shade(i,f=1){if(!i)return 0;const key=i+':'+f;if(!shadeCache.has(key))shadeCache.set(key,nearest(RGB[i].map(v=>Math.round(v*f))));return shadeCache.get(key);}
const ink=nearest([30,24,26]),snow=nearest([220,231,228]);
function project(x,y,z=0){return [x+y*.5,-y*.5-z];}
function pixels(id,options={}){
 const original=A.entry(id),dir=options.dir||original.views[0];if(!original.views.includes(dir))throw new RangeError('Vue inconnue : '+dir);
 const key=id+'/'+dir;if(!cache.has(key))cache.set(key,render(original,dir));const p=cache.get(key);
 return {...p,anchor:p.anchor.slice(),footprint:p.footprint.map(q=>q.slice()),nativePlan:{...p.nativePlan},indices:new Uint8Array(p.indices),layers:new Uint8Array(p.layers)};
}
function render(d,dir){
 const isBuilding=d.kind==='building',quarter=isBuilding?dirs.indexOf(dir):dir==='ns'?1:0;
 const front=A.pixels(d.id,{dir}),side=isBuilding?A.pixels(d.id,{dir:dirs[(quarter+1)%4]}):A.pixels(d.id,{dir:d.views[0]});
 const W=isBuilding?front.width:quarter?d.depth:d.width;
 let D=isBuilding?side.width:quarter?d.width:d.depth;
 if(d.shape==='stairs'&&dir==='palier')D+=16;
 const H=d.height,margin=24,width=Math.ceil(W+D*.5)+margin*2,height=Math.ceil(H+D*.5)+margin*2;
 const indices=new Uint8Array(width*height),layers=new Uint8Array(width*height),offset=[margin,height-margin];
 const P=(x,y,z)=>{const p=project(x,y,z);return [p[0]+offset[0],p[1]+offset[1]];};
 const hash=(x,y)=>((Math.imul(x+31,374761393)^Math.imul(y+17,668265263)^d.id.charCodeAt(0)*101)>>>0);
 function put(x,y,c,layer){x=Math.round(x);y=Math.round(y);if(c&&x>=0&&y>=0&&x<width&&y<height){const k=y*width+x;indices[k]=c;layers[k]=layer;}}
 function line(a,b,c=ink,layer=3){let x=Math.round(a[0]),y=Math.round(a[1]),x2=Math.round(b[0]),y2=Math.round(b[1]),dx=Math.abs(x2-x),sx=x<x2?1:-1,dy=-Math.abs(y2-y),sy=y<y2?1:-1,err=dx+dy;for(;;){put(x,y,c,layer);if(x===x2&&y===y2)break;const e=2*err;if(e>=dy){err+=dy;x+=sx;}if(e<=dx){err+=dx;y+=sy;}}}
 function triangle(a,b,c,uv,texture,layer=1){
  const den=(b[1]-c[1])*(a[0]-c[0])+(c[0]-b[0])*(a[1]-c[1]);if(Math.abs(den)<.001)return;
  const x0=Math.max(0,Math.floor(Math.min(a[0],b[0],c[0]))),x1=Math.min(width-1,Math.ceil(Math.max(a[0],b[0],c[0]))),y0=Math.max(0,Math.floor(Math.min(a[1],b[1],c[1]))),y1=Math.min(height-1,Math.ceil(Math.max(a[1],b[1],c[1])));
  for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){
   const aa=((b[1]-c[1])*(x-c[0])+(c[0]-b[0])*(y-c[1]))/den,bb=((c[1]-a[1])*(x-c[0])+(a[0]-c[0])*(y-c[1]))/den,cc=1-aa-bb;
   if(aa>=-.0001&&bb>=-.0001&&cc>=-.0001){const u=aa*uv[0][0]+bb*uv[1][0]+cc*uv[2][0],v=aa*uv[0][1]+bb*uv[1][1]+cc*uv[2][1];put(x,y,texture(u,v,x,y),layer);}
  }
 }
 function quad(q,texture,layer=1){triangle(q[0],q[1],q[2],[[0,0],[1,0],[1,1]],texture,layer);triangle(q[0],q[2],q[3],[[0,0],[1,1],[0,1]],texture,layer);}
 function outline(q,color=ink,layer=3){for(let i=0;i<q.length;i++)line(q[i],q[(i+1)%q.length],color,layer);}
 function sample(p,x,y,fill=false){x=Math.max(0,Math.min(p.width-1,Math.floor(x)));y=Math.max(0,Math.min(p.height-1,Math.floor(y)));let value=p.indices[y*p.width+x];if(!value&&fill){for(let r=1;r<p.width;r++){const l=x-r,rr=x+r;if(l>=0&&(value=p.indices[y*p.width+l]))break;if(rr<p.width&&(value=p.indices[y*p.width+rr]))break;}}return value;}
 function tex(p,y0,y1,f=1,fill=false){return (u,v)=>shade(sample(p,u*(p.width-1),y0+v*(y1-y0),fill),f);}
 const color=(u,v,x,y)=>{const n=hash(x,y)%5;return shade(sample(front,(u*front.width)%front.width,(v*front.height)%front.height,true)||ink,[.9,1,1,1.08,1][n]);};
 if(isBuilding){
  const flat=d.family==='sarak'||/^F(06|08|10|11|12)$/.test(d.id),roofRise=flat?6:Math.max(14,Math.round(Math.min(34,H*.52))),wall=H-roofRise;
  const cut=H-wall,sideCut=Math.max(0,side.height-wall);
  // Facade and end wall stay at their original native vertical pixel scale.
  const sideQ=[P(W,0,wall),P(W,D,wall),P(W,D,0),P(W,0,0)];
  quad(sideQ,tex(side,sideCut,side.height-1,.78),1);
  const frontQ=[P(0,0,wall),P(W,0,wall),P(W,0,0),P(0,0,0)];quad(frontQ,tex(front,cut,H-1),1);
  const roofSource=A.pixels(d.id.replace('-hiver',''),{dir:'face'});
  const hist=new Map();for(let yy=4;yy<cut;yy++)for(let xx=4;xx<roofSource.width-4;xx++){
   const i=roofSource.indices[yy*roofSource.width+xx],c=RGB[i];if(i&&Math.max(...c)>75&&Math.max(...c)<215&&Math.min(...c)>24)hist.set(i,(hist.get(i)||0)+1);
  }
  const base=[...hist].sort((a,b)=>b[1]-a[1])[0]?.[0]||nearest([131,99,60]);
  const warm=RGB[base][0]>RGB[base][2]*1.25,thatch=warm&&RGB[base][0]<RGB[base][1]*1.6&&(!/^F/.test(d.id)),hip=thatch?Math.round(W*.09):0;
  const roofTexture=(f=1)=>(u,v)=>{
   const xx=Math.floor(u*W),yy=Math.floor(v*Math.max(roofRise,D*.7)),row=Math.floor(yy/(thatch?7:5)),tx=(xx+(row%2)*3)%(thatch?3:7),ty=yy%(thatch?7:5),noise=hash(xx,yy)%7;
   let tone=ty===0?.66:ty===1?1.18:tx===0?.80:noise===0?1.08:1;
   let c=shade(base,tone*f);
   if(d.season==='winter'&&((yy%13<9&&hash(Math.floor(xx/5),Math.floor(yy/13))%7!==0)||yy<3))c=shade(snow,ty===0?.83:f);
   return c;
  };
  const groundProject=P,facadeW=W,facadeD=D;
  if(flat){
   const z=H-6,q=[P(0,0,z),P(W,0,z),P(W,D,z),P(0,D,z)];
   const topBase=nearest(d.family==='sarak'?[186,146,96]:[136,133,123]);const topTexture=(u,v)=>shade(topBase,(Math.floor(v*D)%8===0||(Math.floor(u*W)+(Math.floor(v*D/8)%2)*5)%11===0)?.79:hash(Math.floor(u*W),Math.floor(v*D))%11===0?1.08:1);
   quad(q,topTexture,2);outline(q,ink,2);
   if(/cour|patio|caravane/i.test(d.label)){
    const x0=W*.25,x1=W*.72,y0=D*.24,y1=D*.76,inner=[P(x0,y0,z),P(x1,y0,z),P(x1,y1,z),P(x0,y1,z)];quad(inner,()=>nearest([56,45,35]),2);outline(inner,nearest([122,84,57]),2);
    quad([P(x0,y0,z),P(x1,y0,z),P(x1,y0,z-9),P(x0,y0,z-9)],()=>nearest([154,111,70]),2);
   }
   // Four visible parapet runs, with real depth and consistently spaced merlons.
   for(let y=D-1;y>=0;y--)for(let x=0;x<W;x++)if((x<2||x>=W-2||y<2||y>=D-2)&&((x+y)%10<6)){
    const pp=P(x,y,z);for(let zz=0;zz<6;zz++)put(pp[0],pp[1]-zz,shade(topBase,y<2?1:.8),3);
   }
  }else{
   // Rotate the roof's ridge with the object: an end view shows the gable,
   // rather than receiving an unrelated second long roof.
   const W=quarter%2?facadeD:facadeW,D=quarter%2?facadeW:facadeD;
   const P=quarter%2?((x,y,z)=>groundProject(facadeW-y,x,z)):groundProject;
   const hip=thatch?Math.round(W*.09):0;
   const e=wall+1,ridge=H-3;
   const back=[P(hip,D/2,ridge),P(W-hip,D/2,ridge),P(W+2,D+2,e),P(-2,D+2,e)];
   quad(back,roofTexture(.78),2);outline(back,ink,2);
   if(hip){
    triangle(P(quarter%2?-2:W+2,-2,e),P(quarter%2?-2:W+2,D+2,e),P(quarter%2?hip:W-hip,D/2,ridge),[[0,1],[1,1],[.5,0]],roofTexture(.78),2);
   }else{
    const gx=quarter%2?0:W;const tq=[P(gx,0,wall),P(gx,D,wall),P(gx,D/2,ridge)];triangle(...tq,[[0,1],[1,1],[.5,0]],(u,v)=>shade(sample(side,side.width*.5,Math.max(sideCut+5,side.height*.55),true)||base,.8),1);outline(tq,ink,1);
    const timber=nearest([109,73,43]);line(P(gx,0,wall),P(gx,D/2,ridge),timber,1);line(P(gx,D,wall),P(gx,D/2,ridge),timber,1);line(P(gx,D/2,wall),P(gx,D/2,ridge),timber,1);
    for(let zz=wall+5;zz<ridge-2;zz+=5){const inset=D/2*(zz-wall)/(ridge-wall);line(P(gx,inset,zz),P(gx,D-inset,zz),shade(timber,.85),1);}

   }
   const roof=[P(-2,-2,e),P(W+2,-2,e),P(W-hip,D/2,ridge),P(hip,D/2,ridge)];
   quad(roof,roofTexture(),2);outline(roof,ink,2);
   line(P(hip,D/2,ridge),P(W-hip,D/2,ridge),shade(base,1.25),2);
   // Tile / reed rows follow the roof plane, never the screen axes.
   for(let v=.18;v<.97;v+=.18){const y=-2+(D/2+2)*v,z=e+(ridge-e)*v;line(P(-2+(hip+2)*v,y,z),P(W+2-(hip+2)*v,y,z),shade(base,.82),2);}
   // A dimensional dormer keeps a dwelling's chibi roof silhouette varied.
   if(!/^F|^X|^B(0[1-6]|09|1[0-24689]|20)$/.test(d.id)&&W>=64&&H>=60){
    const dw=Math.min(16,Math.round(W*.18)),cx=W*(d.id.endsWith('03')?.35:.5),yy=D*.19,zz=e+(ridge-e)*.38;
    const faceDormer=[P(cx-dw/2,yy,zz),P(cx+dw/2,yy,zz),P(cx+dw/2,yy,zz+10),P(cx-dw/2,yy,zz+10)];
    quad(faceDormer,()=>nearest([177,133,82]),2);outline(faceDormer,ink,2);
    const window=[P(cx-2,yy-.1,zz+2),P(cx+2,yy-.1,zz+2),P(cx+2,yy-.1,zz+8),P(cx-2,yy-.1,zz+8)];quad(window,()=>nearest([39,44,44]),2);outline(window,nearest([106,70,44]),2);
    const a=P(cx-dw/2-2,yy-.4,zz+10),b=P(cx+dw/2+2,yy-.4,zz+10),tip=P(cx,yy-.4,zz+17);
    triangle(a,b,tip,[[0,1],[1,1],[.5,0]],roofTexture(.94),2);outline([a,b,tip],ink,2);
   }
   // Chimneys are small masonry volumes, not repeated chimney-colored texture.
   if((d.family==='teremor'||d.family==='sylverive'||d.family==='igea'||/^B(07|09|10|15|22)$/.test(d.id))&&!/grenier|grange|bergerie/i.test(d.label)){
    const xx=W*.78,yy=D*.61,zz=ridge-4,cw=6,ch=12,stone=nearest([151,145,128]);
    const brick=(u,v)=>shade(stone,Math.floor(v*ch)%4===0||(Math.floor(u*cw)+(Math.floor(v*ch/4)%2)*3)%6===0?.7:1);
    quad([P(xx,yy,zz+ch),P(xx+cw,yy,zz+ch),P(xx+cw,yy,zz),P(xx,yy,zz)],brick,2);
    quad([P(xx+cw,yy,zz+ch),P(xx+cw,yy+cw,zz+ch),P(xx+cw,yy+cw,zz),P(xx+cw,yy,zz)],(u,v)=>shade(brick(u,v),.75),2);
    const cap=[P(xx-1,yy-1,zz+ch),P(xx+cw+1,yy-1,zz+ch),P(xx+cw+1,yy+cw+1,zz+ch),P(xx-1,yy+cw+1,zz+ch)];quad(cap,()=>d.season==='winter'?snow:ink,2);outline(cap,ink,2);
   }
   if(d.season==='winter'){
    // Snow uses the identical summer volume; irregular lips remain on the roof.
    for(let u=0;u<W;u++){const pp=P(u,-2,e);const n=hash(u,4)%3;for(let j=0;j<2+n;j++)put(pp[0],pp[1]-j,snow,5);}
   }
  }
  // Recover distinctive authored mechanisms as independent native pixel overlays.
  if(d.mechanism){for(const source of [front,side]){
   if(!d.mechanism.views.includes(source.dir))continue;
   const mechanism=A.pixels(d.id,{dir:source.dir,layer:'mechanism'});
   for(let y=0;y<mechanism.height;y++)for(let x=0;x<mechanism.width;x++){const c=mechanism.indices[y*mechanism.width+x];if(c){const pp=source===front?P(x,-2,H-y):P(W+2,x,H-y);put(pp[0],pp[1],c,4);}}
  }}
 }else{
  const shape=d.shape,cutout=['door','gate-leaves','arch','window-shutters','window-bars','screen','railing','scaffold','frame','gutter','sluice-frame','conduit','latrine','drain','chimney','vent','gable','ridge'].includes(shape);
  let materialID=d.id;
  if(d.high){const region=/^([A-Z]{3})-H/.exec(d.id),number=/^M(\d+)$/.exec(d.id);if(region)materialID=region[1]+'-H01';else if(number&&+number[1]>=49)materialID='M'+(49+Math.floor((+number[1]-49)/8)*8);}
  const source=A.pixels(materialID,{dir:A.entry(materialID).views[0]}),t=Math.min(d.wallThickness||8,W,D),walk=d.walkHeight||H;
  const baseZ=d.high&&shape==='parapet'?walk:d.high&&['deck','landing'].includes(shape)?Math.max(0,walk-3):0;
  if(cutout){
   quad([P(W,0,H),P(W,D,H),P(W,D,0),P(W,0,0)],tex(source,0,source.height-1,.75),1);
   quad([P(0,0,H),P(W,0,H),P(W,0,0),P(0,0,0)],tex(source,0,source.height-1),1);
   if(['chimney','vent','ridge'].includes(shape))quad([P(0,0,H),P(W,0,H),P(W,D,H),P(0,D,H)],color,2);
  }else{
   const heights=new Uint16Array(W*D),isStair=shape==='stairs'||shape==='ramp',roof=shape.startsWith('roof')||shape==='awning';
   const terrace=['deck','landing','platform-raised','bridge-wood','bridge-stone','quay-wood','quay-stone','jetty-end'].includes(shape);
   for(let y=0;y<D;y++)for(let x=0;x<W;x++){
    let inside=true;
    if(shape==='corner-outer')inside=y<t||x>=W-t;
    if(shape==='corner-inner')inside=y>=D-t||x<t;
    if(shape==='junction-t')inside=y<t||Math.abs(x-(W-1)/2)<t/2;
    if(!inside)continue;
    let z=H;
    if(isStair){const run=d.depth,n=Math.max(3,Math.round(walk/4));z=y>=run?walk:Math.max(1,Math.ceil((y+1)/run*n)*walk/n);}
    else if(roof&&shape!=='roof-flat'){z=H*.35+H*.65*(1-Math.abs((y+.5)/D*2-1));}
    else if(d.high&&shape!=='parapet')z=walk;
    if(d.high&&!terrace&&!isStair&&shape!=='parapet'){
     // A near-side guard follows the L/T footprint; sockets remain open.
     const boundary=(shape==='corner-outer'?(y<2||(x>=W-2&&y>=t)):shape==='corner-inner'?(x<2||y>=D-2):shape==='junction-t'?y<2:y<2);
     if(boundary)z=H;
    }
    heights[y*W+x]=Math.max(1,Math.round(z));
   }
   const at=(x,y)=>x<0||x>=W||y<0||y>=D?baseZ:heights[y*W+x];
   // Sweep far to near so neighboring faces occlude correctly without filtering.
   for(let y=D-1;y>=0;y--)for(let x=0;x<W;x++){
    const z=at(x,y);if(!z)continue;
    const n=at(x,y-1),right=at(x+1,y);
    const material=(xx,zz,f)=>shade(sample(source,xx%source.width,Math.max(0,source.height-1-zz)%source.height,true)||ink,f);
    if(z>right)quad([P(x+1,y,z),P(x+1,y+1,z),P(x+1,y+1,right),P(x+1,y,right)],(u,v)=>material(y,Math.round(z-v*(z-right)),.73),1);
    if(z>n)quad([P(x,y,z),P(x+1,y,z),P(x+1,y,n),P(x,y,n)],(u,v)=>material(x,Math.round(z-v*(z-n)),1),1);
    const top=(u,v)=>{
     const wood=d.material==='wood'||/wood|stockade|timber/.test(shape)||d.family==='varan'||d.family==='tagon';
     const cap=nearest(wood?[160,111,60]:d.family==='sarak'?[181,139,86]:[143,139,123]);
     let c=shade(cap,(wood?(x%6===0):(y%6===0||(x+(Math.floor(y/6)%2)*4)%9===0))?.72:hash(x,y)%7===0?1.1:1);
     if(isStair&&((y+1)%Math.max(2,Math.round(d.depth/Math.max(3,walk/4)))===0))c=shade(c,.7);
     return c;
    };
    quad([P(x,y,z),P(x+1,y,z),P(x+1,y+1,z),P(x,y+1,z)],top,roof?2:3);
   }
  }
 }
 let minX=width,minY=height,maxX=0,maxY=0;for(let y=0;y<height;y++)for(let x=0;x<width;x++)if(indices[y*width+x]){minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);}
 if(minX>maxX)throw new Error('Empty three-quarter view '+d.id+'/'+dir);
 minX=Math.max(0,minX-1);minY=Math.max(0,minY-1);maxX=Math.min(width-1,maxX+1);maxY=Math.min(height-1,maxY+1);
 const w=maxX-minX+1,h=maxY-minY+1,out=new Uint8Array(w*h),ls=new Uint8Array(w*h);
 for(let y=0;y<h;y++){out.set(indices.subarray((y+minY)*width+minX,(y+minY)*width+minX+w),y*w);ls.set(layers.subarray((y+minY)*width+minX,(y+minY)*width+minX+w),y*w);}
 if(d.season==='winter')for(let i=0;i<out.length;i++)if(out[i]>=A.palette.length)ls[i]=5;
 return {id:d.id,dir,width:w,height:h,anchor:[offset[0]-minX+W/2,offset[1]-minY],indices:out,layers:ls,footprint:[[0,0],[W,0],[W,D],[0,D]].map(([x,y])=>{const pp=project(x-W/2,y);return pp;}),nativePlan:{width:W,depth:D,height:H},projection:'orthographic-oblique-3/4'};
}
function raster(id,options={}){const p=pixels(id,options),data=new Uint8ClampedArray(p.width*p.height*4),layer=options.layer||'all',layerIndex=['back','roof','front','mechanism','snow'].indexOf(layer)+1;if(layer!=='all'&&!layerIndex)throw new RangeError('Calque inconnu');for(let i=0;i<p.indices.length;i++){const c=p.indices[i];if(c&&(layer==='all'||p.layers[i]===layerIndex)){data.set([...RGB[c],255],i*4);}else if(layer!=='all')p.indices[i]=0;}return {...p,data};}
function draw(ctx,options){const {id,x=0,y=0,scale=1}=options;if(!Number.isInteger(scale)||scale<1||scale>16)throw new RangeError('Zoom entier requis');const p=raster(id,options);ctx.imageSmoothingEnabled=false;for(let yy=0;yy<p.height;yy++){let xx=0;while(xx<p.width){const c=p.indices[yy*p.width+xx];let end=xx+1;while(end<p.width&&p.indices[yy*p.width+end]===c)end++;if(c){ctx.fillStyle=palette[c];ctx.fillRect(Math.round(x-p.anchor[0]*scale+xx*scale),Math.round(y-p.anchor[1]*scale+yy*scale),(end-xx)*scale,scale);}xx=end;}}return p;}
function list(filters={}){return A.list(filters);}
function validate(){const errors=[];let views=0;for(const d of list())for(const dir of d.views){try{const p=pixels(d.id,{dir});views++;if(!p.indices.some(Boolean)||p.width*p.height!==p.indices.length)errors.push(d.id+'/'+dir);}catch(e){errors.push(d.id+'/'+dir+': '+e.message);}}return {ok:!errors.length,assets:list().length,views,errors};}
return Object.freeze({version:2,projection:{name:'three-quarter orthographic oblique',depthX:.5,depthY:-.5,vertical:1},palette,scale:A.scale,entry:A.entry,list,project,pixels,raster,draw,validate,clearCache:()=>cache.clear()});
});
