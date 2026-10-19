/* Native 16 px terrain. The original desert ramps remain the art direction.
 * All sampling is in absolute world pixels: no tile/chunk-local noise, seams,
 * rotated lighting or random changes when a chunk is evicted. See docs/world.md.
 */
function createWorldTerrainArt(atlas, ramps) {
 'use strict';
 const Math=globalThis.Math;
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)), mod=(v,n)=>(v%n+n)%n;
 const hex=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16));
 const colors={
  sand:ramps.sand, road:ramps.road, pave:ramps.pave, water:ramps.water,
  rock:ramps.rock, mesa:ramps.mesa, wood:ramps.wood,
  grass:['#26362c','#384b32','#4b6039','#607546','#768850','#929d65','#b3b984'],
  forest:['#202f2a','#304131','#405439','#526542','#677a4a','#82905c','#a2ab78'],
  jungle:['#1c3430','#294c39','#376243','#4c7849','#658b51','#84a568','#b1bc7e'],
  marsh:['#29382f','#3a4b38','#4e5e42','#63734d','#7a8559','#94976c','#b3ae83'],
  mud:['#282e29','#3e4234','#53513c','#6a6349','#81775a','#9e916c','#b9aa83'],
  humus:['#2e3025','#434333','#59553d','#6d684b','#827e5c','#9a9270','#b8ad86'],
  steppe:['#44452b','#5d5d34','#77733e','#918a4d','#a69e60','#bfb57a','#d6ca99'],
  snow:['#4a6774','#66828d','#839fa7','#a3b9ba','#c2d0ca','#dce1d2','#f0eedc'],
  tundra:['#343f3a','#4a5549','#626c59','#7b826b','#949b80','#b3b79a','#d1d1b6'],
  stone:['#262d33','#3e4950','#56626a','#728086','#939e9e','#b6bfba','#d4d6c6'],
  cursed:['#25242e','#3c3947','#53505d','#6c6874','#84818a','#a09ca5','#bfbbc0'],
  ash:['#29262e','#423b49','#59515e','#716875','#887d8c','#a398a6','#bfb5bf'],
  swampWater:['#182f31','#24453e','#35594a','#496d57','#61816b','#82a38a','#a9c2a0','#d4dfb6'],
  tropicalWater:['#133b49','#1a5360','#216e76','#318c8b','#54a9a0','#83c8b6','#b2ded0','#e1eee1']
 };
 const rgb=Object.fromEntries(Object.entries(colors).map(([k,p])=>[k,p.map(hex)]));
 const bayer=[0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5].map(v=>(v+.5)/16);
 function noise(x,y,scale,seed){const gx=x/scale,gy=y/scale,ix=Math.floor(gx),iy=Math.floor(gy),fx=gx-ix,fy=gy-iy,sx=fx*fx*(3-2*fx),sy=fy*fy*(3-2*fy),a=atlas.random(ix,iy,seed),b=atlas.random(ix+1,iy,seed),c=atlas.random(ix,iy+1,seed),d=atlas.random(ix+1,iy+1,seed);return a+(b-a)*sx+(c-a)*sy+(a-b-c+d)*sx*sy;}
 // Cache the lattice, not a huge world texture. Negative coordinates work too.
 function field(x0,y0,w,h,scale,seed){const ox=Math.floor(x0/scale),oy=Math.floor(y0/scale),gw=Math.ceil(w/scale)+3,gh=Math.ceil(h/scale)+3,L=new Float32Array(gw*gh);for(let y=0;y<gh;y++)for(let x=0;x<gw;x++)L[y*gw+x]=atlas.random(ox+x,oy+y,seed);return (x,y)=>{const gx=x/scale-ox,gy=y/scale-oy,ix=Math.floor(gx),iy=Math.floor(gy),fx=gx-ix,fy=gy-iy,sx=fx*fx*(3-2*fx),sy=fy*fy*(3-2*fy),k=iy*gw+ix,a=L[k],b=L[k+1],c=L[k+gw],d=L[k+gw+1];return a+(b-a)*sx+(c-a)*sy+(a-b-c+d)*sx*sy;};}
 function family(m){return m.cursed?'cursed':m.biome===11?'snow':m.biome===10?'tundra':m.biome===9?'taiga':m.biome===12?'marsh':m.biome===8?'wetforest':[5,7].includes(m.biome)?'jungle':[6].includes(m.biome)?'forest':[1,2].includes(m.biome)?'desert':m.biome===3?'steppe':'grass';}
 const profiles={
  desert:{ground:'sand',bare:'sand',rock:'rock',top:'mesa',water:'water'},
  steppe:{ground:'steppe',bare:'sand',rock:'rock',top:'mesa',water:'water'},
  grass:{ground:'grass',bare:'humus',rock:'stone',top:'tundra',water:'water'},
  forest:{ground:'forest',bare:'humus',rock:'stone',top:'tundra',water:'water'},
  jungle:{ground:'jungle',bare:'humus',rock:'stone',top:'marsh',water:'tropicalWater'},
  wetforest:{ground:'forest',bare:'mud',rock:'stone',top:'marsh',water:'swampWater'},
  marsh:{ground:'marsh',bare:'mud',rock:'stone',top:'marsh',water:'swampWater'},
  taiga:{ground:'forest',bare:'tundra',rock:'stone',top:'stone',water:'water'},
  tundra:{ground:'tundra',bare:'stone',rock:'stone',top:'stone',water:'water'},
  snow:{ground:'snow',bare:'tundra',rock:'stone',top:'snow',water:'water'},
  cursed:{ground:'cursed',bare:'ash',rock:'cursed',top:'ash',water:'swampWater'}
 };
 function tileInfo(x,y){
  const e=atlas.environment(x+.5,y+.5),parts=e.mix.filter(m=>m.weight>0).map(m=>({...m,family:family(m)})).sort((a,b)=>a.family.localeCompare(b.family)||a.biome-b.biome),shore=atlas.coastDistance(x+.5,y+.5);
  const gradient=(dx,dy)=>{if(!Number.isFinite(shore))return 0;const n=atlas.coastDistance(x+.5+dx,y+.5+dy,14);return Number.isFinite(n)?n-shore:0;};
  return {x,y,t:atlas.terrain(x,y),parts:parts.length?parts:[{family:'desert',weight:1}],cell:atlas.cellAt(x+.5,y+.5),shore,shoreX:gradient(1,0),shoreY:gradient(0,1)};
 }

 function* distanceField(mat,w,h,water){
  const D=new Uint16Array(w*h).fill(320);
  for(let y=0;y<h;y++){for(let x=0;x<w;x++){const i=y*w+x;if((mat[i]===3)===water)D[i]=0;}if(y%16===15)yield;}
  for(let y=0;y<h;y++){for(let x=0;x<w;x++){const i=y*w+x;let d=D[i];if(x)d=Math.min(d,D[i-1]+10);if(y){d=Math.min(d,D[i-w]+10);if(x)d=Math.min(d,D[i-w-1]+14);if(x<w-1)d=Math.min(d,D[i-w+1]+14);}D[i]=d;}if(y%16===15)yield;}
  for(let y=h-1;y>=0;y--){for(let x=w-1;x>=0;x--){const i=y*w+x;let d=D[i];if(x<w-1)d=Math.min(d,D[i+1]+10);if(y<h-1){d=Math.min(d,D[i+w]+10);if(x)d=Math.min(d,D[i+w-1]+14);if(x<w-1)d=Math.min(d,D[i+w+1]+14);}D[i]=d;}if(y%16===0)yield;}
  return D;
 }
 // Public rectangular renderer also makes overlapping-chunk tests possible.
 function* renderSteps(x0,y0,width=512,height=512,clock=480){
  const PAD=32,ox=x0-PAD,oy=y0-PAD,w=width+PAD*2,h=height+PAD*2,N=w*h;
  const tx0=Math.floor(ox/16)-1,ty0=Math.floor(oy/16)-1,tw=Math.ceil(w/16)+3,th=Math.ceil(h/16)+3,meta=[];
  for(let y=0;y<th;y++){for(let x=0;x<tw;x++)meta.push(tileInfo(tx0+x,ty0+y));if(y%4===3)yield;}
  // Sample thermal cover once per tile/biome, never once per pixel.
  for(const tile of meta)for(const p of tile.parts)p.cover=atlas.visualSnowCover(p.biome,p.height??tile.cell?.height??20,clock,p.region??tile.cell?.region);
  const info=(x,y)=>meta[(Math.floor(y/16)-ty0)*tw+Math.floor(x/16)-tx0];
  const category=t=>t===4?0:t===5?3:t;
  const edge=field(ox,oy,w,h,9,31),edge2=field(ox,oy,w,h,4,32),broad=field(ox,oy,w,h,40,41),grain=field(ox,oy,w,h,24,45),dunes=field(ox,oy,w,h,56,42),ripple=field(ox,oy,w,h,11,43),patch=field(ox,oy,w,h,86,450),fine=field(ox,oy,w,h,7,451);
  // Shared route segments: continuous curves, intersections and carriage ruts.
  const roadTiles=meta.map(m=>atlas.roadIndex.near(m.x+.5,m.y+.5).filter(s=>s.r.type!=='searoutes'&&atlas.project(m.x+.5,m.y+.5,s.a,s.b).d<s.r.width/2+2));
  const mat=new Uint8Array(N),roadDistance=new Float32Array(N).fill(99),roadWidth=new Float32Array(N),roadAngle=new Float32Array(N);
  for(let y=0;y<h;y++){for(let x=0;x<w;x++){
   const px=ox+x,py=oy+y,i=y*w+x,m=info(px,py),a=category(m.t),lx=mod(px,16),ly=mod(py,16);let v=a,best=99;
   const n=edge(px,py)*.75+edge2(px,py)*.25;
   for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){if(!dx&&!dy)continue;const b=category(info(px+dx*16,py+dy*16).t);if(a===b||a===1||b===1)continue;const ex=dx<0?lx+.5:dx>0?15.5-lx:0,ey=dy<0?ly+.5:dy>0?15.5-ly:0,d=Math.hypot(ex,ey);let off=-99;if(a===3||b===3)off=(n-.5)*6*(a===3?1:-1);else if(a===8||b===8)off=(n-.45)*4*(a===8?1:-1);else if(a===2)off=(n-.3)*6;if(d<best&&d<off){v=b;best=d;}}
   const candidates=roadTiles[(Math.floor(py/16)-ty0)*tw+Math.floor(px/16)-tx0];
   let rd=99,rw=0,ang=0;
   for(const s of candidates){const dx=s.b[0]-s.a[0],dy=s.b[1]-s.a[1],q=dx*dx+dy*dy,t=q?clamp(((px/16+.03125-s.a[0])*dx+(py/16+.03125-s.a[1])*dy)/q,0,1):0,d=Math.hypot(px+.5-(s.a[0]+dx*t)*16,py+.5-(s.a[1]+dy*t)*16),hw=s.r.width*8;if(d-hw<rd-rw){rd=d;rw=hw;ang=Math.atan2(dy,dx);}}
   roadDistance[i]=rd;roadWidth[i]=rw;roadAngle[i]=ang;
   if(v===1)v=0;
   if(rw&&rd<rw+(n-.5)*5&&(v===0||v===2))v=1;
   mat[i]=v;
  }if(y%4===3)yield;}
  const dW=yield* distanceField(mat,w,h,true),dL=yield* distanceField(mat,w,h,false);
  const ds=new Uint8Array(N),dn=new Uint8Array(N),dl=new Uint8Array(N),dr=new Uint8Array(N);
  for(let x=0;x<w;x++){if(x%16===15)yield;let r=0;for(let y=h-1;y>=0;y--){const i=y*w+x;ds[i]=r=mat[i]===8?Math.min(32,r+1):0;}r=0;for(let y=0;y<h;y++){const i=y*w+x;dn[i]=r=mat[i]===8?Math.min(32,r+1):0;}}
  for(let y=0;y<h;y++){if(y%16===15)yield;let r=0;for(let x=0;x<w;x++){const i=y*w+x;dl[i]=r=mat[i]===8?Math.min(32,r+1):0;}r=0;for(let x=w-1;x>=0;x--){const i=y*w+x;dr[i]=r=mat[i]===8?Math.min(32,r+1):0;}}
  const data=new Uint8ClampedArray(width*height*4),surface=new Uint8Array(width*height);
  for(let y=PAD;y<h-PAD;y++){for(let x=PAD;x<w-PAD;x++){
   const px=ox+x,py=oy+y,i=y*w+x,m=mat[i],tile=info(px,py),n=broad(px,py),np=patch(px,py),f=fine(px,py),rand=atlas.random(px,py,5),up=atlas.random(px,py-1,5),dw=dW[i]/10;
   // Patch selection is ordered independently of the containing macro cell.
   // A forest/snow border therefore contains snowdrifts and exposed moss,
   // rather than an abrupt palette swap along the Azgaar polygon.
   let part=tile.parts[0],acc=0;const pick=clamp((np-.18)/.64,0,.99999);
   for(const p of tile.parts){acc+=p.weight;if(pick<acc){part=p;break;}}
   const name=part.family,profile=profiles[name],snow=name==='snow',desert=name==='desert',cursed=name==='cursed';let P=rgb[profile.ground],L=4+(n-.5)*2.2;
   const cover=part.cover,drift=cover>0&&(cover>=.99||np<.18+cover*.64);
   if(m===0){
    const exposed=!desert&&(snow?np<.18:np>.68||name==='marsh'&&np<.4);
    if(exposed){P=rgb[profile.bare];L=3.7+(n-.5)*1.5;}
    if(desert||name==='steppe'){
     const nr=dunes(px,py);if(nr>(desert?.34:.64)&&ripple(px,py)>.3){const phase=(py+3*Math.sin(px*.09+nr*6)+1.5*Math.sin(px*.23))/7,r=mod(phase,1);if(r<1/7)L-=1;else if(r>=6/7)L+=1;}
     if(rand>.994)L-=1.5;else if(rand<.004)L+=1;
    }else if(snow&&!exposed){
     const ridge=mod(py+Math.round(Math.sin(px/34)*4+n*7),19);if(ridge===0&&f>.48)L-=.8;else if(ridge===1&&f>.48)L+=.35;
     if(rand>.998)L=6;
    }else if(cursed){
     const crack=Math.abs(grain(px,py)-.5);if(crack<.012&&np>.4)L-=1.4;else if(Math.abs(grain(px,py+1)-.5)<.012&&np>.4)L+=.6;
    }else{
     // Little clusters with a dark root and a lit blade; large quiet patches.
     const gx=Math.floor(px/5),gy=Math.floor(py/5),seed=atlas.random(gx,gy,458),lx=mod(px,5),ly=mod(py,5),tip=1+Math.floor(seed*3);
     if(!exposed&&f>.38&&seed>.5){if(ly===3&&(lx===tip||lx===tip+1))L-=1.2;if(lx===tip&&ly===2)L+=.7;if(lx===tip-1&&ly===1&&seed>.78)L+=1;}
     if(rand>.997&&np>.4)L-=1;
    }
    if(dw<5)L-=(5-dw)*.24;
    // Damp beach sand, mud and banks, only on the land side of real water.
    if(dw<22&&!cursed&&!snow){P=rgb[name==='marsh'?'mud':'sand'];L=dw<4?2+dw*.3:4+(n-.5)*1.7;if(dw>17&&f>.45){P=rgb[profile.ground];L=3.6+(n-.5)*1.4;}}
    // Ankle-deep wet patches are walkable ground, not invented river crossings.
    if((name==='marsh'||name==='wetforest')&&np<(name==='marsh'?.36:.23)&&dw>24){P=rgb.swampWater;L=3.7+(n-.5)*1.2;const rim=(name==='marsh'?.36:.23)-np;if(rim<.018)L-=.7;if(mod(py+Math.floor(n*5),13)===0&&f>.58)L+=1;}
    if(tile.cell?.land&&!cursed&&!snow&&(tile.shore+(mod(px,16)-7.5)/16*tile.shoreX+(mod(py,16)-7.5)/16*tile.shoreY)<6+(n-.5)*3){P=rgb.sand;L=4.5+(n-.5)*1.4-Math.max(0,4-dw)*.38;const r=mod(py+Math.round(Math.sin(px/24)*3),11);if(r===0&&ripple(px,py)>.6)L-=.6;}
    if(mat[i-w]===1)L+=.8;
   }else if(m===1){
    P=rgb[cursed?'ash':snow||name==='tundra'||name==='taiga'?'tundra':name==='marsh'||name==='wetforest'?'mud':desert||name==='steppe'?'road':'humus'];L=4+(grain(px,py)-.5)*1.25;
    if(rand>.988)L=5.5;else if(up>.988)L=2.5;
    if(mat[i-w]===0||mat[i-w]===2)L-=1.4;else if(mat[i-w*2]===0)L-=.5;
    if(mat[i-1]===0)L-=.5;
    const rut=Math.abs(roadDistance[i]-roadWidth[i]*.48);if(rut<1.1&&ripple(px,py)>.33)L-=.65;else if(rut<2&&ripple(px,py)>.33)L+=.25;
    if(dw<4)L-=(4-dw)*.4;
   }else if(m===2){
    P=rgb[desert||name==='steppe'?'pave':'stone'];const row=Math.floor(py/11),shift=Math.floor(atlas.random(row,0,91)*11),xx=mod(px+shift,17),yy=mod(py,11),stone=atlas.random(Math.floor((px+shift)/17),row,92);L=4+(stone>.8?-1:stone<.12?1:0);
    if(xx===0||yy===0)L=1;else if(xx===1||yy===1)L+=1;else if(xx===16||yy===10)L-=1;
    if(rand>.98)L-=1;
   }else if(m===3){
    P=rgb[tile.cell?.land?profile.water:'water'];const landDistance=dL[i]/10;let bank=0;for(let j=1;j<=5;j++)if(mat[i-j*w]!==3){bank=j;break;}
    if(bank===1){P=rgb[profile.bare];L=2;}else if(bank===2){P=rgb[profile.bare];L=1;}else if(bank&&bank<=4)L=1;else if(bank===5)L=2;
    else L=landDistance<=1?6:landDistance<=2.5?5:4.5-Math.min(1,Math.max(0,(landDistance-4)/3))-Math.min(1,Math.max(0,(landDistance-14)/4));
    if(!bank&&landDistance>5){const gy=Math.floor(py/9),gx=Math.floor(px/17),h=atlas.random(gx,gy,470),lx=mod(px,17),ly=mod(py,9);if(h>.65&&ly===Math.floor(h*6)+1&&lx>4&&lx<8+Math.floor(h*3))L+=.65;}
   }else if(m===8){
    const F=15+Math.floor(noise(px,0,7,47)*5);P=rgb[profile.rock];
    if(ds[i]<=F){const s=mod(py+Math.round(noise(px,0,13,48)*6+Math.sin(px*.21)),4);L=s===0?4:s===3?2:3;if(dl[i]<=3)L++;else if(dr[i]<=3)L--;if(dl[i]===1||dr[i]===1||ds[i]===1)L=0;if(ds[i]===F)L=1;}
    else if(dl[i]<4)L=dl[i]===1?0:5;else if(dr[i]<4)L=dr[i]===1?0:2;
    else{P=rgb[profile.top];L=4+(grain(px,py)-.5)*1.2;const crack=Math.abs(grain(px,py)-.5);if(crack<.018)L=2;else if(Math.abs(grain(px,py+1)-.5)<.018)L=5;if(ds[i]===F+1||dn[i]===2)L=6;else if(dn[i]===1)L=1;}
   }
   // Snow settles on land and cliff tops; routes stay readable, water stays water.
   if(drift&&(m===0||m===1||m===2||m===8&&ds[i]>20)){
    const compact=m===1||m===2;P=rgb.snow;L=(compact?3.4:4.8)+(n-.5)*1.4;
    if(compact&&Math.abs(roadDistance[i]-roadWidth[i]*.48)<1.2)L-=.8;
    if(!compact&&mod(py+Math.round(Math.sin(px/34)*4+n*7),19)===0&&f>.48)L-=.6;
   }
   // Bridges follow the actual road direction, including diagonal crossings.
   if(tile.t===5&&roadWidth[i]&&roadDistance[i]<=roadWidth[i]+1){
    const angle=roadAngle[i],along=px*Math.cos(angle)+py*Math.sin(angle),plank=mod(Math.floor(along),5),side=roadWidth[i]-roadDistance[i];P=rgb.wood;L=plank===0?1:plank===1?5:3;if(side<2)L=side<1?1:5;if(plank===2&&side<4)L=1;
   }
   if(m!==8)for(let j=1;j<=4;j++)if(mat[i-j*w]===8){L-=j<=2?1.6:.7;break;}
   const floor=Math.floor(L),fraction=clamp(((L-floor)-.5)*5+.5,0,1),q=clamp(floor+(fraction>bayer[mod(py,4)*4+mod(px,4)]?1:0),0,P.length-1),col=P[q],o=((y-PAD)*width+x-PAD)*4;data[o]=col[0];data[o+1]=col[1];data[o+2]=col[2];data[o+3]=255;surface[o/4]=tile.t===5?5:m;
  }
  if(y%4===3)yield;}
  return {data,width,height,surface};
 }
 function render(...args){const steps=renderSteps(...args);let next;do{next=steps.next();}while(!next.done);return next.value;}
 return {render,renderSteps,noise,family,profiles,colors};
}
if(typeof module!=='undefined'&&module.exports)module.exports=createWorldTerrainArt;
