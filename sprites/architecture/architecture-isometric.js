/* Hearthreaver: native 2:1 pixel architecture, built from authored JS geometry.
 * No PNG, DOM, image resampling, previous elevation pixels or external renderer.
 * World unit = one native pixel of height; human 19, tile 16, door clearance 22.
 */
(function(r,f){if(typeof module==='object'&&module.exports)module.exports=f(require('./isometric-catalogue.js'));else r.HearthreaverIsometric=f(r.HearthreaverIsometricCatalogue);})(globalThis,function createLibrary(C,buildMesh){
'use strict';
const RAMPS={
 ink:['#171820','#23212b','#302b33','#453942','#5b4850'],
 stone:['#33323e','#50505b','#72717a','#96918b','#b9b1a0'],
 plaster:['#65544f','#94765f','#c4aa83','#dec99d','#eee1b6'],
 wood:['#302830','#514036','#79573b','#a37748','#c69b60'],
 log:['#24282c','#3b3e3b','#5d5d4b','#838063','#a4a07b'],
 straw:['#604331','#91633b','#be8b47','#ddb963','#edce85'],
 tile:['#492d38','#713e3c','#a45b47','#c57b57','#e3a377'],
 slate:['#2c3042','#424a61','#626e84','#8d9aac','#b7c3c8'],
 adobe:['#665042','#977153','#bb9466','#d7b780','#edcf98'],
 cloth:['#70665e','#9b9179','#c2b79b','#ded5b6','#ede6cd'],
 glass:['#1f2833','#2d4049','#43636b','#74918d','#b4c3a3'],
 snow:['#607a91','#8fa6b6','#bed0d7','#dce7e4','#f0f3e8'],
 iron:['#262b34','#3c424b','#5c656b','#86908e','#b2b9a7'],
 fire:['#773d35','#aa5436','#d87c36','#efb64b','#f4da7c'],
 water:['#24373f','#36565c','#51777a','#7a9a93','#b2bfa4'],
 moss:['#2d3830','#43513a','#657046','#899153','#aeb773']
};
// Authoring libraries may supply five-tone material ramps without changing
// the native catalogue, palette indices, geometry or cached game drawings.
for(const [material,ramp]of Object.entries(C.ramps||{})){
 if(!RAMPS[material]||ramp.length!==5||ramp.some(c=>!/^#[0-9a-f]{6}$/i.test(c)))throw new RangeError('Palette de matériau invalide : '+material);
 RAMPS[material]=ramp.slice();
}
const palette=['#00000000',...Object.values(RAMPS).flat()],start={},names=Object.keys(RAMPS);names.forEach((n,i)=>start[n]=1+i*5);
const rgb=palette.map(c=>c.length===9?[0,0,0,0]:[parseInt(c.slice(1,3),16),parseInt(c.slice(3,5),16),parseInt(c.slice(5,7),16),255]);
const defs=new Map(C.assets.map(d=>[d.id,d])),cache=new Map(),dirs=['face','droite','dos','gauche'];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),project=(x,y,z=0)=>[x-y,(x+y)/2-z];
function entry(id){const d=defs.get(id);if(!d)throw new RangeError('Référence inconnue : '+id);return structuredCloneSafe(d);}
function structuredCloneSafe(o){return JSON.parse(JSON.stringify(o));}
function list(filters={}){return C.assets.filter(d=>Object.entries(filters).every(([k,v])=>d[k]===v)).map(structuredCloneSafe);}
const seedOf=s=>[...s].reduce((n,c)=>(Math.imul(n,31)+c.charCodeAt(0))>>>0,7);
const hash=(x,y,s=0)=>(Math.imul((x|0)+s+17,374761393)^Math.imul((y|0)+39,668265263))>>>0;
function recipe(d){
 const id=d.id.replace('-hiver',''),n=+(id.match(/\d+$/)||[0])[0],label=d.label.toLocaleLowerCase('fr');
 const r={type:'house',wall:'plaster',roof:'tile',rise:24,chimney:false,storeys:d.height>=80?2:1,raised:0,annex:false,balcony:false,twin:false,porch:false};
 if(d.recipe)return {...r,...d.recipe};
 if(d.family==='teremor'){r.roof=/chaum|modeste|familiale/.test(label)?'straw':'tile';r.chimney=true;r.porch=/chaum/.test(label);}
 if(d.family==='sylverive'){r.roof='slate';r.chimney=true;r.balcony=/galerie/.test(label);}
 if(d.family==='igea'){r.wall=/pierre/.test(label)?'stone':'log';r.roof='wood';r.rise=28;r.chimney=!/grenier/.test(label);}
 if(d.family==='sarak'){r.wall='adobe';r.roof='adobe';r.rise=6;r.type=/cour|patio|caravane/.test(label)?'courtyard':'terrace';}
 if(d.family==='varan'){r.wall=/enduit/.test(label)?'plaster':'wood';r.roof='straw';r.raised=12;r.porch=true;r.balcony=/galerie|véranda|ventil/.test(label);}
 if(d.family==='tagon'){r.wall='plaster';r.roof='slate';r.balcony=/galerie/.test(label);r.chimney=true;}
 r.annex=/manoir|artisan|aisée|maisonnée|soins|marins/.test(label);r.twin=/jumelé|deux logis/.test(label);
 if(/^B/.test(id)){
  r.wall='plaster';r.roof='tile';r.chimney=false;
  const types=['','barn','barn','barn','tent','market','granary','inn','counter','forge','kiln','tannery','carpenter','windmill','watermill','bakery','smokehouse','weaver','dyer','ropewalk','press','council','healer','rites','hall'];
  r.type=types[n];r.roof=[1,3,5,10,11,19].includes(n)?'straw':[12,14,17,18,21,23,24].includes(n)?'slate':'tile';
  r.wall=[1,12,16,19].includes(n)?'wood':[3,13].includes(n)?'stone':'plaster';
  r.chimney=[7,9,10,15,16,22].includes(n);r.raised=n===6?12:0;r.annex=[7,22].includes(n);r.balcony=n===7;
 }
 if(/^F/.test(id)){
  r.type=[7,8,9,10,11].includes(n)?'gate':[4,5,6,12].includes(n)?'tower':'military';
  r.wall=[5,7,9].includes(n)?'wood':'stone';r.roof='slate';r.rise=[6,8,10,11,12].includes(n)?10:22;r.chimney=n===4;
  r.annex=n===4;r.battlements=[6,8,10,11,12].includes(n);r.openTower=n===5;
 }
 if(/^X/.test(id)){r.type=['','mine','quarry','saltern','shipyard'][n];r.wall='wood';r.roof='slate';r.chimney=false;}
 if(id==='T06'||id==='T24'||id==='T20')r.type='warehouse';
 if(id==='T08')r.type='weaver';if(id==='T11')r.type='granary',r.raised=14;
 if(id==='T19')r.type='market';if(id==='T12')r.type='miners';
 if(id==='T16')r.type='coolstore';
 return r;
}
function mesh(d,options={}){
 const polys=[],volumes=[],meta={openings:[],stairs:[],parts:[]},W=d.width,D=d.depth,H=d.height,baseID=d.id.replace('-hiver',''),seed=seedOf(baseID),winter=d.season==='winter';
 function face(v,mat='stone',layer='wall',style='plain',bias=0){polys.push({v,mat,layer,style,bias});}
 function box(x,y,z,w,l,h,mat='stone',style='plain',layer='wall'){
  if(w<=0||l<=0||h<=0)return;
  volumes.push({x,y,z,w,depth:l,height:h,mat,style,layer});
  face([[x,y,z],[x+w,y,z],[x+w,y,z+h],[x,y,z+h]],mat,layer,style);
  face([[x+w,y,z],[x+w,y+l,z],[x+w,y+l,z+h],[x+w,y,z+h]],mat,layer,style);
  face([[x+w,y+l,z],[x,y+l,z],[x,y+l,z+h],[x+w,y+l,z+h]],mat,layer,style);
  face([[x,y+l,z],[x,y,z],[x,y,z+h],[x,y+l,z+h]],mat,layer,style);
  face([[x,y,z+h],[x+w,y,z+h],[x+w,y+l,z+h],[x,y+l,z+h]],mat,layer,style);
 }
 const beam=(x,y,z,w,l,h,mat='wood')=>box(x,y,z,w,l,h,mat,'timber','detail');
 function wall(x,y,z,w,l,h,mat){box(x,y,z,w,l,h,mat,mat==='wood'||mat==='log'?'plank':mat==='stone'?'masonry':'plaster');}
 function panelY(x,y,z,w,h,mat='wood',style='plank',layer='detail'){face([[x,y,z],[x+w,y,z],[x+w,y,z+h],[x,y,z+h]],mat,layer,style,.08);}
 function panelX(x,y,z,w,h,mat='wood',style='plank',layer='detail'){face([[x,y,z],[x,y+w,z],[x,y+w,z+h],[x,y,z+h]],mat,layer,style,.08);}
 function window(x,y,z,w=9,h=12,side=false,shutters=true){
  const draw=side?panelX:panelY;draw(x,y,z-1,w,h+2,'wood','frame');draw(x+(side?.12:2),y+(side?2:.12),z+1,w-4,h-2,'glass','window');
  if(side){beam(x+.15,y+w/2-1,z,1,2,h);beam(x+.15,y,z+h/2,1,w,1);}
  else{beam(x+w/2-1,y+.15,z,2,1,h);beam(x,y+.15,z+h/2,w,1,1);}
  if(side)box(x-.3,y-1,z-2,3,w+2,2,'stone','masonry','detail');else box(x-1,y-.3,z-2,w+2,3,2,'stone','masonry','detail');
  if(shutters){if(side){beam(x,y-3,z,1,3,h);beam(x,y+w,z,1,3,h);}else{beam(x-3,y,z,3,1,h);beam(x+w,y,z,3,1,h);}}
 }
 function door(x,y,z,w=14,h=22,side=false){
  const draw=side?panelX:panelY;draw(x-2,y,z,w+4,h+3,'stone','archframe');draw(x,y+.12,z,w,h,'wood','door');
  if(side)beam(x+.2,y+w-3,z+9,1,1,2,'iron');else beam(x+w-3,y+.3,z+9,1,1,2,'iron');
  if(!side){box(x-2,y-.3,z-1,w+4,4,2,'stone','paving','detail');
   for(const zz of [5,17]){beam(x,y+.35,z+zz,w,1,1,'iron');beam(x+2,y+.45,z+zz,1,1,1,'iron');}}
  meta.openings.push({x,y,z,width:w,clearance:h,side,kind:'door'});
 }
 function roof(x,y,w,l,eave,peak,mat='tile',hip=false){
  const z=peak,ex=hip?Math.min(w/5,12):0;
  const a=[x,y,eave],b=[x+w,y,eave],c=[x+w,y+l,eave],f=[x,y+l,eave],r=[x+ex,y+l/2,z],s=[x+w-ex,y+l/2,z];
  face([a,b,s,r],mat,'roof','roof');face([c,f,r,s],mat,'roof','roof');
  face([b,c,s],hip?mat:(d.kind==='building'?recipe(d).wall:'plaster'),hip?'roof':'wall',hip?'roof':'gable');face([f,a,r],hip?mat:(d.kind==='building'?recipe(d).wall:'plaster'),hip?'roof':'wall',hip?'roof':'gable');
  if(!hip){beam(x-1,y,eave,2,l,2);beam(x+w-1,y,eave,2,l,2);}
  // Thick eaves, rafter tips, and a ridge cap are part of the shared volume.
  const fascia=mat==='straw'?'straw':mat==='cloth'?'cloth':'wood';
  box(x,y,eave-2,w,2,2,fascia,'timber','roof');box(x,y+l-2,eave-2,w,2,2,fascia,'timber','roof');
  if(d.kind==='building'&&mat!=='cloth')for(let xx=x+5;xx<x+w-3;xx+=12){beam(xx,y+1,eave-4,2,4,3);beam(xx,y+l-5,eave-4,2,4,3);}
  if(mat!=='cloth')box(x+ex,y+l/2-1,peak-2,w-2*ex,2,2,mat,'ridgecap','roof');
  meta.parts.push({type:'roof',x,y,width:w,depth:l,eave,peak});
 }
 function chimney(x,y,z,h=13){wall(x,y,z,7,7,h-2,'stone');box(x-1,y-1,z+h-2,9,9,2,'stone','masonry','detail');box(x+1,y+1,z+h-.1,5,5,.1,'ink','plain','detail');}
 function stairs(x,y,z,w,run,rise,mat='stone',landing=0){
  const n=Math.max(2,Math.ceil(rise/3));for(let i=0;i<n;i++)box(x,y+i*run/n,z,w,run/n,(n-i)*rise/n,mat,mat==='wood'?'plank':'masonry','detail');
  if(landing)box(x,y-landing,z+rise-3,w,landing,3,mat,'plank','detail');
  meta.stairs.push({x,y,z,width:w,run,rise,landing});
 }
 function terrace(x,y,w,l,z,mat='adobe',parapet=5){
  box(x,y,z-3,w,l,3,mat,'paving','roof');
  if(parapet){wall(x,y,z,w,3,parapet,mat);wall(x,y+l-3,z,w,3,parapet,mat);wall(x,y,z,3,l,parapet,mat);wall(x+w-3,y,z,3,l,parapet,mat);}
 }
 function railing(x,y,z,w,l,h=9){
  if(w>l){for(let t=0;t<=w;t+=10)beam(x+t,y,z,2,l,h);beam(x,y,z+h-2,w,l,2);beam(x,y,z+3,w,l,1);}
  else{for(let t=0;t<=l;t+=10)beam(x,y+t,z,w,2,h);beam(x,y,z+h-2,w,l,2);beam(x,y,z+3,w,l,1);}
 }
 function barrel(x,y,z=0,size=10,mat='wood'){
  box(x+1,y,z,size-2,size,9,mat,'barrel','detail');box(x,y+2,z+2,size,size-4,6,mat,'barrel','detail');
  box(x+1,y,z+2,size-2,size,1,'iron','plain','detail');box(x+1,y,z+7,size-2,size,1,'iron','plain','detail');
 }
 function stack(x,y,z,w=15){for(let k=0;k<3;k++)beam(x+(k%2),y,z+k*3,w,8,2);}
 function basin(x,y,z=0,w=14,l=12,mat='wood',fill='water'){
  box(x,y,z,w,l,8,mat,'plank','detail');box(x+2,y+2,z+8.1,w-4,l-4,.2,fill,'plain','detail');
 }
 function truss(x,y,z,w,h,side=false){
  const draw=side?panelX:panelY;draw(x,y,z,w,2,'wood');
  const verts=side?[[x,y,z],[x,y+w/2,z+h],[x,y+w,z]]:[[x,y,z],[x+w/2,y,z+h],[x+w,y,z]];
  face(verts,'wood','detail','plain',.1);
 }
 function building(){
  const r=recipe(d),variant=seed%3,normalZ=r.raised,flat=['terrace','courtyard','coolstore'].includes(r.type),roofRise=flat?6:Math.min(H-30,r.rise+(r.storeys===2?2:0));
  if(r.type==='gate'){
   const tw=Math.floor(W*.23),walk=Math.floor(H*.60),archH=Math.max(26,walk-7),mat=r.wall;
   for(const x of [0,W-tw]){
    wall(x,0,0,tw,D,H-(r.battlements?12:22),mat);
    for(const yy of [D*.25,D*.7])window(x+tw+.05,yy,H*.57,5,11,true,false);
    window(x+tw/2-3,D+.05,H*.55,6,13,false,false);
    if(r.battlements)crenels(x,0,tw,D,H-10,H,mat);else roof(x-2,-2,tw+4,D+4,H-22,H,r.roof);
   }
   const gap=W-2*tw;box(tw,D*.2,archH,gap,D*.62,walk-archH,mat,'masonry');
   if(options.open!==1)panelY(tw+1,D*.82,0,gap-2,archH,'wood','gate');
   railing(tw,D*.82,walk,gap,3,9);box(tw,D*.2,walk-3,gap,D*.62,3,'wood','plank','detail');
   meta.openings.push({x:tw,y:D*.82,z:0,width:gap,clearance:archH,kind:'gate'});return;
  }
  if(r.type==='tower'){
   const upper=r.openTower?H-30:H-12;
   if(r.openTower){
    for(const x of [3,W-7])for(const y of [3,D-7])beam(x,y,0,4,4,H-26);
    box(0,0,H-52,W,D,4,'wood','plank');railing(0,D-2,H-48,W,2,14);railing(W-2,0,H-48,2,D,14);
    stairs(3,D*.12,0,16,D*.65,H-52,'wood');roof(-2,-2,W+4,D+4,H-28,H,'wood');
   }else{
    wall(0,0,0,W,D,upper,r.wall);door(W*.5-7,D+.1,0);
    for(let z=34;z<upper-10;z+=28){window(W*.5-3,D+.1,z,6,13,false,false);window(W+.1,D*.5-3,z,6,13,true,false);}
    if(r.battlements)crenels(0,0,W,D,upper,H,r.wall);else roof(-2,-2,W+4,D+4,H-24,H,r.roof);
    if(r.annex){wall(W*.68,D*.55,0,W*.32,D*.45,H*.35,'plaster');roof(W*.68,D*.55,W*.32,D*.45,H*.35,H*.53,'slate');}
   }return;
  }
  if(r.type==='mine'){
   wall(0,0,0,W*.22,D,H*.75,'stone');wall(W*.78,0,0,W*.22,D,H*.75,'stone');wall(W*.22,0,H*.55,W*.56,D,H*.2,'stone');
   for(const x of [W*.2,W*.75])beam(x,D-10,0,5,8,H*.6);beam(W*.2,D-10,H*.55,W*.6,8,6);panelY(W*.25,D*.45,0,W*.5,H*.54,'ink');
   for(const x of [W*.38,W*.62])beam(x,D*.4,0,2,D*.6,2,'iron');meta.openings.push({x:W*.25,y:D*.45,z:0,width:W*.5,clearance:H*.54,kind:'mine'});return;
  }
  if(r.type==='windmill'){
   const bw=W*.55,bx=(W-bw)/2,bodyH=H-30;
   wall(bx,8,0,bw,D-16,bodyH,'stone');roof(bx-2,6,bw+4,D-12,bodyH,H,'tile');door(W*.5-7,D-7.9,0);
   const cx=W*.5,cy=D+12,cz=H*.66,radius=Math.min(W*.46,H*.3),ang=options.mechanismFrame*Math.PI/8||0;
   for(let k=0;k<4;k++){
    const a=ang+Math.PI/4+k*Math.PI/2,dx=Math.cos(a),dz=Math.sin(a),px=-dz,pz=dx;
    const V=(s,t)=>[cx+dx*s+px*t,cy,cz+dz*s+pz*t];
    face([V(2,-1),V(radius,-1),V(radius,1),V(2,1)],'wood','mechanism','timber');
    face([V(radius*.38,1),V(radius,1),V(radius,8),V(radius*.38,8)],'cloth','mechanism','sail');
   }box(cx-3,cy,cz-3,6,5,6,'wood','timber','mechanism');return;
  }
  const open=['market','counter','forge','kiln','tannery','carpenter','dyer','ropewalk','press','shipyard','saltern','quarry'].includes(r.type),tent=r.type==='tent';
  let x=3,y=3,w=W-6,l=D-6,z=normalZ,eave=H-roofRise,peak=H;
  if(r.chimney){peak=H-8;eave-=8;}
  const yard=open?Math.floor(D*.27):r.porch||r.balcony?10:0;l-=yard;
  if(r.annex)w-=Math.floor(W*.22);
  if(r.raised){
   for(const xx of [x+2,x+w/2-2,x+w-5])for(const yy of [y+2,y+l-5])beam(xx,yy,0,4,4,z);
   box(x-2,y-2,z-3,w+4,l+yard+4,3,'wood','plank','detail');
   stairs(x+w*.35,y+l+1,0,16,Math.max(8,yard),z,'wood');
  }else box(x,y,0,w,l,5,'stone','masonry','wall');
  if(tent){
   const ridge=H-3;roof(x,y,w,l,8,ridge,'cloth');
   face([[x+w*.2,y+l,8],[x+w*.5,y+l,ridge],[x+w*.8,y+l,8]],'ink','detail');
   for(const xx of [x+1,x+w-3])beam(xx,y+l,0,3,3,18);meta.openings.push({x:x+w*.35,y:y+l,z:0,width:18,clearance:24,kind:'tent'});return;
  }
  if(flat){
   const top=H-6;
   if(r.type==='courtyard'){
    const t=Math.max(16,Math.round(Math.min(w,l)*.24)),innerW=w-2*t,innerD=l-2*t;
    wall(x,y,z,w,t,top-z,r.wall);wall(x,y+t,z,t,l-t,top-z,r.wall);wall(x+w-t,y+t,z,t,l-t,top-z,r.wall);
    wall(x,y+l-t,z,w*.38,t,top-z,r.wall);wall(x+w*.62,y+l-t,z,w*.38,t,top-z,r.wall);
    terrace(x,y,w,t,top,r.wall,5);terrace(x,y+t,t,l-t,top,r.wall,5);terrace(x+w-t,y+t,t,l-t,top,r.wall,5);
    terrace(x,y+l-t,w*.38,t,top,r.wall,5);terrace(x+w*.62,y+l-t,w*.38,t,top,r.wall,5);
    panelY(x+w*.38,y+l-.05,0,w*.24,24,'wood','gate');meta.openings.push({x:x+w*.38,y:y+l,z:0,width:w*.24,clearance:24,kind:'gate'});
    box(x+t,y+t,0,innerW,innerD,1,'adobe','paving');
    if(w>100){for(const xx of [x+t+3,x+w-t-5])beam(xx,y+l-t-2,0,2,2,24);face([[x+t,y+l-t-2,24],[x+w-t,y+l-t-2,24],[x+w-t,y+l-t-14,29],[x+t,y+l-t-14,29]],'cloth','detail','plain');}
   }else{
    wall(x,y,z,w,l,top-z,r.wall);terrace(x,y,w,l,top,r.wall,5);door(x+w*.5-7,y+l+.1,z);
    window(x+w*.15,y+l+.1,z+27,8,10,false,false);window(x+w+.1,y+l*.55,z+25,7,10,true,false);
    if(r.type==='coolstore'){box(x+w*.24,y+l*.2,top,w*.52,l*.6,4,'adobe','plaster','roof');}
    if(H>=78){stairs(x+w-16,y+l*.15,z,16,l*.75,top-z,'adobe');}
   }return;
  }
  if(open){
   wall(x,y,z,w,4,eave-z,r.wall);wall(x,y,z,4,l,eave-z,r.wall);
   for(const xx of [x+2,x+w*.5-2,x+w-5])beam(xx,y+l-4,z,4,4,eave-z);
   beam(x,y+l-4,eave-4,w,4,4);beam(x+w-4,y,eave-4,4,l,4);
  }else{
   wall(x,y,z,w,l,eave-z,r.wall);
   if(r.wall==='plaster'){
    for(const xx of [x,x+w/2-1,x+w-3])beam(xx,y+l-.5,z,3,1,eave-z);
    beam(x,y+l-.5,z+5,w,1,2);beam(x,y+l-.5,eave-3,w,1,3);
    for(const yy of [y,y+l/2-1,y+l-3])beam(x+w-.5,yy,z,1,3,eave-z);
    beam(x+w-.5,y,z+5,1,l,2);beam(x+w-.5,y,eave-3,1,l,3);
    if(r.storeys===2){beam(x,y+l-.5,z+29,w,1,3);beam(x+w-.5,y,z+29,1,l,3);}
   }
   const big=['barn','warehouse','shipyard'].includes(r.type),doorW=big?26:14,doorX=x+w*(d.entrances?.[0]||.5)-doorW/2;door(doorX,y+l+.15,z,doorW,22);
   if(r.type==='barn'){panelY(doorX,y+l+.35,z+3,doorW,2,'wood');face([[doorX,y+l+.35,z+3],[doorX+doorW,y+l+.35,z+19],[doorX+doorW,y+l+.35,z+21],[doorX,y+l+.35,z+5]],'wood','detail','timber',.2);}
   const baseWindow=z+(/barn|warehouse|granary/.test(r.type)?28:12),upper=eave-20;
   if(w>=58)window(x+w*.74,y+l+.2,baseWindow,9,11,false,true);
   if(w>=90)window(x+w*.12,y+l+.2,baseWindow,9,11,false,true);
   if(eave-z>53){for(const xx of [x+w*.2,x+w*.64])window(xx,y+l+.2,upper,9,12);}
   for(let yy=y+12;yy<y+l-14;yy+=Math.max(22,l/2))window(x+w+.15,yy,z+(eave-z>50?34:13),8,11,true,true);
   // Back entrances and windows exist in the same world geometry for all views.
   panelY(x+w*.65,y-.1,z+15,8,11,'glass','window');panelX(x-.1,y+l*.42,z+14,8,11,'glass','window');
  }
  if(r.twin){
   roof(x-2,y-2,w*.5+3,l+4,eave,peak,r.roof,r.roof==='straw');roof(x+w*.5-1,y-2,w*.5+3,l+4,eave,peak-2,r.roof,r.roof==='straw');
   door(x+w*.72-7,y+l+.22,z);beam(x+w*.5-1,y+l,z,3,1,eave-z);
  }else roof(x-2,y-2,w+4,l+4,eave,peak,r.roof,r.roof==='straw');
  if(r.chimney)chimney(x+w*.75,y+l*.22,peak-10,18);
  if(r.annex){const aw=W-w-6,ax=x+w,al=l*.7,ae=Math.min(eave-10,34+z);wall(ax,y+l-al,z,aw,al,ae-z,'stone');roof(ax,y+l-al,aw+1,al,ae,ae+13,r.roof);window(ax+aw+.1,y+l-al*.6,z+10,7,10,true);}
  if(r.porch||r.balcony){
   const zz=r.balcony?z+29:z;box(x,y+l,zz,w,Math.max(yard,8),3,'wood','plank','detail');
   railing(x+w-2,y+l,zz+3,2,Math.max(8,yard),9);railing(x+w*.6,y+l+Math.max(8,yard)-2,zz+3,w*.4,2,9);
   if(r.porch){for(const xx of [x+2,x+w-4])beam(xx,y+l+yard-2,z,3,3,24);face([[x-1,y+l,32+z],[x+w+1,y+l,32+z],[x+w+1,y+l+yard,24+z],[x-1,y+l+yard,24+z]],r.roof,'roof','roof');}
  }
  // Purpose-specific structural silhouettes and a small number of readable details.
  const fy=y+l+3;
  if(r.type==='watermill'){
   const cx=x+w+2,cy=y+l*.5,cz=19,R=18;
   for(let k=0;k<16;k++){
    const a=k*Math.PI/8,b=(k+1)*Math.PI/8,V=(a,r,xx)=>[xx,cy+Math.cos(a)*r,cz+Math.sin(a)*r];
    face([V(a,R,cx),V(b,R,cx),V(b,R-4,cx),V(a,R-4,cx)],'wood','mechanism','plank');
    face([V(a,R,cx+5),V(b,R,cx+5),V(b,R-4,cx+5),V(a,R-4,cx+5)],'wood','mechanism','plank');
    face([V(a,R,cx),V(a,R,cx+5),V(a,R-4,cx+5),V(a,R-4,cx)],'wood','mechanism','timber');
    if(k%2===0)face([V(a,0,cx+5.1),V(a,R,cx+5.1),V(a+.08,R,cx+5.1)],'wood','mechanism');
   }beam(cx,cy-2,cz-2,8,4,4,'iron');
  }
  if(r.type==='forge'){wall(x+w*.1,y+8,z,17,17,20,'stone');box(x+w*.1+3,y+25.1,z+5,11,1,10,'fire','fire','detail');chimney(x+w*.1+5,y+10,eave-8,H-eave+7);box(x+w*.6,y+l*.55,z,9,5,13,'iron','plain','detail');beam(x+w*.6-3,y+l*.55,z+12,15,5,3,'iron');}
  if(r.type==='kiln'||r.type==='bakery'){wall(x+w*.2,y+l*.35,z,24,20,22,'stone');panelY(x+w*.2+7,y+l*.35+20.1,z+3,10,12,'fire','fire');}
  if(r.type==='tannery'||r.type==='dyer'){for(let k=0;k<3;k++)basin(x+10+k*22,fy,0,17,14,'wood',r.type==='dyer'?'tile':'water');for(const xx of [x+8,x+w-6])beam(xx,y+l*.55,z,2,2,26);beam(x+8,y+l*.55,z+24,w-14,2,2);face([[x+14,y+l*.55+.1,z+24],[x+31,y+l*.55+.1,z+24],[x+29,y+l*.55+.1,z+8],[x+17,y+l*.55+.1,z+10]],'cloth','detail','plain');}
  if(r.type==='carpenter'||r.type==='shipyard'){stack(x+w*.2,y+l*.5,z,30);if(r.type==='shipyard'){for(let k=0;k<5;k++)truss(x+14+k*16,y+l*.5,z,15,18);}}
  if(r.type==='market'||r.type==='counter'){for(let k=0;k<3;k++){beam(x+6+k*30,y+l-5,z,23,7,3);for(const xx of [x+6+k*30,x+25+k*30])beam(xx,y+l-5,z,2,2,11);box(x+5+k*30,y+l-6,z+10,26,10,3,'wood','plank','detail');}}
  if(r.type==='ropewalk'){for(let k=0;k<6;k++)beam(x+8+k*18,y+l*.5,z,2,4,16);beam(x+8,y+l*.5,z+13,w-16,1,1,'straw');}
  if(r.type==='press'){beam(x+w*.4,y+l*.45,z,3,9,23);beam(x+w*.7,y+l*.45,z,3,9,23);beam(x+w*.35,y+l*.45,z+22,w*.42,9,3);beam(x+w*.55,y+l*.45,z+5,3,3,20);basin(x+w*.4,y+l*.45,z,22,15);}
  if(r.type==='smokehouse'){for(let k=0;k<4;k++)panelY(x+8+k*10,y+l+.4,z+27,3,8,'tile');}
  if(['warehouse','granary','inn'].includes(r.type)){barrel(x+w-14,fy,z);}
  if(r.type==='miners'){beam(x+7,fy,0,3,3,24);beam(x+25,fy,0,3,3,24);beam(x+7,fy,22,21,3,3);}
  if(r.type==='council'){panelY(x+w*.48,y+l+.4,z+30,9,14,'slate','window');beam(x+w*.3,y+l+.2,26,w*.4,1,3);}
  if(r.type==='rites'){window(x+w*.4,y+l+.3,z+29,12,18,false,false);}
  if(baseID==='T03'){panelY(x+w*.67,y+l+.4,z+3,13,16,'glass','window');face([[x+w*.61,y+l,25],[x+w-1,y+l,25],[x+w-1,y+l+7,21],[x+w*.61,y+l+7,21]],'tile','roof','roof');}
  if(r.type==='weaver'){panelY(x+w*.72,y+l+.4,z+4,11,16,'cloth','sail');}
  if(r.type==='healer'){box(x+w*.1,fy,0,14,8,6,'stone','masonry','detail');}
 }
 function crenels(x,y,w,l,z,top,mat){
  box(x,y,z-3,w,l,3,mat,'paving','detail');
  for(const yy of [y,y+l-4]){wall(x,yy,z,w,4,4,mat);for(let xx=x;xx<x+w;xx+=12)wall(xx,yy,z+4,Math.min(7,x+w-xx),4,top-z-4,mat);}
  for(const xx of [x,x+w-4]){wall(xx,y,z,4,l,4,mat);for(let yy=y;yy<y+l;yy+=12)wall(xx,yy,z+4,4,Math.min(7,y+l-yy),top-z-4,mat);}
 }
 function moduleArt(){
  const s=d.shape,mat=d.material||(/wood|timber|stockade/.test(s)?'wood':/adobe/.test(s)?'adobe':'stone'),t=d.wallThickness||Math.min(D,8),walk=d.walkHeight||H;
  const capMat=mat==='wood'?'wood':mat;
  function run(x,y,w,l){
   const h=d.high?walk:H;wall(x,y,0,w,l,h,s==='wall-timber'?'plaster':mat);
   if(d.high){
    if(w>=l){wall(x,y,h,w,3,4,mat);for(let xx=x;xx<x+w;xx+=10)wall(xx,y,h+4,Math.min(6,x+w-xx),3,H-h-4,mat);}
    else{wall(x+w-3,y,h,3,l,4,mat);for(let yy=y;yy<y+l;yy+=10)wall(x+w-3,yy,h+4,3,Math.min(6,y+l-yy),H-h-4,mat);}
   }
  }
  if(['curtain','end','wall-timber','wall-stone','wall-adobe','cistern-wall','latrine','stockade','corner-outer','corner-inner','junction-t'].includes(s)){
   if(s==='stockade'){
    for(let x=0;x<W;x+=5){wall(x,0,0,4,D,H-5,'wood');face([[x,0,H-5],[x+4,0,H-5],[x+2,0,H]],'wood','detail');face([[x,D,H-5],[x+4,D,H-5],[x+2,D,H]],'wood','detail');}beam(0,D-2,8,W,2,3);beam(0,D-2,H-12,W,2,3);return;
   }
   if(s==='corner-outer'){run(0,0,W,t);run(W-t,t,t,D-t);}
   else if(s==='corner-inner'){run(0,D-t,W,t);run(0,0,t,D-t);}
   else if(s==='junction-t'){run(0,0,W,t);run((W-t)/2,t,t,D-t);}
   else run(0,0,W,D);
   if(s==='wall-timber'){for(const x of [0,W/2-1,W-3])beam(x,D-.5,0,3,1,H);beam(0,D-.5,0,W,1,3);beam(0,D-.5,H-3,W,1,3);}
   return;
  }
  if(s==='parapet'){
   const z=d.high?walk:0;wall(0,0,z,W,D,H-z-4,mat);for(let x=0;x<W;x+=10)wall(x,0,H-4,Math.min(6,W-x),D,4,mat);return;
  }
  if(s==='stairs'||s==='ramp'){
   const landing=options.dir==='palier'?16:0;
   if(s==='stairs')stairs(0,0,0,W,D,walk,mat,landing);
   else{face([[0,0,0],[W,0,0],[W,D,H],[0,D,H]],'wood','detail','plank');face([[W,0,0],[W,D,0],[W,D,H]],mat,'wall','masonry');}
   if(d.high){railing(0,0,walk,W,2,H-walk);}
   return;
  }
  if(['deck','landing','platform-raised','bridge-wood','bridge-stone','quay-wood','quay-stone','jetty-end'].includes(s)){
   const z=d.high?walk:H,wood=/wood|raised|landing|deck|jetty/.test(s)||mat==='wood',m=wood?'wood':'stone';
   box(0,0,z-3,W,D,3,m,wood?'plank':'paving','detail');
   if(s==='bridge-stone'){
    // An actual arch opening, formed from wedge segments, not a solid block.
    for(let i=0;i<12;i++){
     const a=i*Math.PI/12,b=(i+1)*Math.PI/12,rad=W*.42,cx=W/2;
     const V=(angle,r,y)=>[cx+Math.cos(angle)*r,y,Math.sin(angle)*r*.65];
     for(const y of [0,D])face([V(a,rad,y),V(b,rad,y),V(b,rad+5,y),V(a,rad+5,y)],'stone','wall','masonry');
    }
   }else if(!wood){wall(0,0,0,W*.22,D,z-3,m);wall(W*.78,0,0,W*.22,D,z-3,m);}
   else for(const x of [1,W-4])for(const y of [1,D-4])beam(x,y,0,3,3,z-3);
   if(d.high){railing(0,0,z,W,2,H-z);}
   return;
  }
  if(s==='door'||s==='gate-leaves'){door(2,D-.1,0,W-4,H-4);if(s==='gate-leaves')beam(W/2-1,D+.1,0,2,1,H-4,'iron');return;}
  if(s==='arch'){
   const t=5;wall(0,0,0,t,D,H-t,'stone');wall(W-t,0,0,t,D,H-t,'stone');box(0,0,H-t,W,D,t,'stone','masonry');
   for(let k=0;k<5;k++){box(t+k*2,0,H-t-5+k,2,D,5-k,'stone','masonry');box(W-t-k*2-2,0,H-t-5+k,2,D,5-k,'stone','masonry');}return;
  }
  if(['window-shutters','window-bars','screen','drain'].includes(s)){
   const iron=s==='window-bars'||s==='drain';if(s==='window-shutters')panelY(3,D-1,3,W-6,H-6,'glass','window');beam(0,0,0,W,D,3,iron?'stone':'wood');beam(0,0,H-3,W,D,3,iron?'stone':'wood');beam(0,0,0,3,D,H,iron?'stone':'wood');beam(W-3,0,0,3,D,H,iron?'stone':'wood');
   for(let x=5;x<W-3;x+=5)beam(x,D/2,3,1,2,H-6,iron?'iron':'wood');beam(3,D/2,H/2,W-6,2,1,iron?'iron':'wood');return;
  }
  if(s==='railing'){railing(0,0,0,W,D,H);return;}
  if(s==='beam'||s==='post'){beam(0,0,0,W,D,H);return;}
  if(s==='scaffold'||s==='frame'){
   for(const x of [0,W-3])for(const y of [0,D-3])beam(x,y,0,3,3,H);
   for(let z=10;z<H;z+=13){beam(0,0,z,W,3,3);beam(0,D-3,z,W,3,3);beam(0,0,z,3,D,3);beam(W-3,0,z,3,D,3);}
   if(s==='scaffold')box(0,0,H-3,W,D,3,'wood','plank','detail');return;
  }
  if(s.startsWith('roof')||s==='awning'||s==='gable'||s==='ridge'){
   if(s==='roof-flat'){terrace(0,0,W,D,H-3,'adobe',3);return;}
   if(s==='ridge'){roof(0,0,W,D,0,H,'tile');return;}
   if(s==='gable'){face([[0,D,0],[W,D,0],[W/2,D,H]],'plaster','wall','gable');beam(0,D-1,0,W,1,2);return;}
   const m=s==='roof-thatch'?'straw':s==='roof-fibre'?'cloth':s==='roof-shingle'?'wood':'tile';
   if(s==='awning'){face([[0,0,H],[W,0,H],[W,D,H*.5],[0,D,H*.5]],m,'roof','roof');}
   else roof(0,0,W,D,0,H,m);return;
  }
  if(s==='abutment'){wall(0,0,0,W,D,H,'stone');return;}
  if(s==='chimney'||s==='vent'){wall(1,1,0,W-2,D-2,H-4,'stone');box(0,0,H-4,W,D,3,'stone','masonry','detail');box(3,3,H-1,W-6,D-6,1,'ink','plain','detail');return;}
  if(s==='gutter'){beam(0,0,H-4,W,3,3,'iron');beam(W-3,0,0,3,3,H,'iron');return;}
  if(s==='conduit'){for(const x of [3,W-6])wall(x,2,0,3,D-4,H-6,'stone');box(0,2,H-8,W,D-4,7,'iron','plank','detail');return;}
  if(s==='sluice-frame'){beam(0,0,0,4,D,H);beam(W-4,0,0,4,D,H);beam(0,0,H-4,W,D,4);panelY(4,D/2,0,W-8,H*.6,'wood','plank');beam(W/2-1,D/2,0,2,2,H,'iron');return;}
  throw new Error('Module non dessiné : '+d.id+' '+s);
 }
 const authored=buildMesh&&buildMesh(d,{face,box,beam,wall,panelY,panelX,window,door,roof,chimney,stairs,terrace,railing,barrel,stack,basin,truss,meta},options);
 if(!authored){if(d.kind==='building')building();else moduleArt();}
 return {polys,volumes,meta,seed,winter,recipe:d.kind==='building'?recipe(d):null};
}
function render(d,options){
 const dir=options.dir||d.views[0];if(!d.views.includes(dir))throw new RangeError('Vue incompatible : '+dir);
 const quarter=d.kind==='building'?dirs.indexOf(dir):dir==='ns'?1:0,W=d.width,D=d.depth;
 const rot=v=>{const [x,y,z]=v;return quarter===0?[x,y,z]:quarter===1?[D-y,x,z]:quarter===2?[W-x,D-y,z]:[y,W-x,z];};
 const M=mesh(d,{...options,dir}),weather=options.weather!==false,ps=M.polys.map(p=>({...p,v:p.v.map(rot)}));
 let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
 for(const p of ps)for(const v of p.v){const [x,y]=project(...v);minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);}
 minX=Math.floor(minX)-2;minY=Math.floor(minY)-2;maxX=Math.ceil(maxX)+2;maxY=Math.ceil(maxY)+2;
 const width=maxX-minX+1,height=maxY-minY+1,indices=new Uint8Array(width*height),layers=new Uint8Array(width*height),groundDepth=new Float32Array(width*height),depth=new Float32Array(width*height);depth.fill(-Infinity);
 function color(p,v){
  const normal=p.normal,top=p.top,ov=p.original.v,on=p.localNormal;
  const local=quarter===0?v:quarter===1?[v[1],D-v[0],v[2]]:quarter===2?[W-v[0],D-v[1],v[2]]:[W-v[1],v[0],v[2]];
  const [x,y,z]=local,along=Math.abs(on[0])>Math.abs(on[1])?y:x;
  let tone=top?3:Math.abs(normal[0])>Math.abs(normal[1])?1:2,mat=p.mat,layer=p.layer;
  const cellX=Math.floor(along/8),cellZ=Math.floor(z/5),n=hash(cellX,cellZ,M.seed);
  const iAlong=Math.floor(along),iz=Math.floor(z),floorMod=(a,b)=>((Math.floor(a)%b)+b)%b;
  const edge=Math.min(along-p.alongLo,p.alongHi-along),base=z-p.lo[2],ceiling=p.hi[2]-z;
  if(p.style==='masonry'){
   const row=Math.floor(z/5),brickX=along+(row%2)*5,col=Math.floor(brickX/10),h=hash(col,row,M.seed),bx=floorMod(brickX,10),bz=floorMod(z,5);
   // Broad stone faces with intermittent joints; relief is concentrated at edges.
   if((bz===0||bx===0)&&h%4!==0)tone--;
   else if(h%9===0&&bz>=2)tone++;
   if(weather){
    if(h%7===0&&bz===3&&bx>=2&&bx<=6)tone++;
    if(h%9===0&&bz<=1&&bx>=7)tone--;
    if(h%17===0&&bz>1&&bz<4&&bx===3+Math.floor(bz/2))tone--;
   }
  }else if(p.style==='plaster'){
   if(n%17===0&&floorMod(z,5)>2)tone++;
   if(weather){
    const h=hash(Math.floor(along/11),Math.floor(z/9),M.seed),u=floorMod(along,11),v=floorMod(z,9);
    if(h%13===0&&u>=2&&u<=7&&v>=2&&v<=5&&!(u===2&&v<4)){
     mat=p.mat==='adobe'?'adobe':'stone';tone=top?2:1;
     if(v===2||v===5)tone++;if(v===4&&u>=5)tone--;
    }
    // Small branching hairline cracks, not random isolated noise.
    if(h%23===0&&v>=2&&v<=7&&u===3+Math.floor(v/3))tone--;
    if(h%23===0&&v===5&&u>=3&&u<=5)tone--;
    if(ceiling<2&&!top)tone--;
   }
  }else if(['plank','door','gate','barrel','timber','frame'].includes(p.style)){
   const long=p.axis,grain=local[long],across=long===2?along:z,gu=floorMod(across,5),gv=floorMod(grain,17);
   if(p.style==='plank'||p.style==='door'||p.style==='gate'||p.style==='barrel'){
    if(floorMod(along,5)===0)tone--;
   }
   if(weather){
    const h=hash(Math.floor(across/5),Math.floor(grain/17),M.seed);
    if(gu===2&&gv>=3&&gv<=9&&h%3===0)tone--;
    if(gu===3&&gv>=7&&gv<=12&&h%5===0)tone++;
    const knot=(gu-2)**2/3+(gv-8)**2/6;
    if(h%9===0&&knot>=.65&&knot<=1.9)tone--;
    if(edge<1&&p.mat!=='iron'&&hash(Math.floor(along/5),Math.floor(z/7),M.seed)%4===0)tone++;
    if(base<2&&!top)tone--;
   }
   if((p.style==='door'||p.style==='gate')&&(Math.abs(base-5)<1||Math.abs(base-17)<1))mat='iron',tone=1;
  }else if(p.style==='archframe'){
   if(floorMod(z,5)===0&&!top)tone--;if(edge<1)tone++;
  }else if(p.style==='roof'){
   const row=Math.floor(z/4),offset=(row%2)*3,rx=floorMod(x+offset,7),rz=floorMod(z,4),h=hash(Math.floor((x+offset)/7),row,M.seed);
   if(p.mat==='straw'){
    const bundle=Math.floor(z/6),strip=Math.floor((x+(bundle%2)*2)/5),hh=hash(strip,bundle,M.seed),u=floorMod(x+(bundle%2)*2,5),v=floorMod(z,6);
    if(u===0&&v<4)tone--;
    if(v===0&&u<4)tone--;
    if(v===1&&u>=1&&u<=3)tone++;
    if(hh%5===0&&u>=2&&v>=3)tone++;
    if(weather&&hh%11===0&&u<3&&v>=4)tone--;
   }else if(p.mat==='cloth'){
    if(floorMod(x,9)===0)tone--;if(weather&&h%13===0&&rx>=2&&rx<=4&&rz>1)tone--;
   }else{
    // Individual tile lips, staggered joints, and a few repaired or chipped tiles.
    if(rz===0||rx===0)tone--;
    else if(rz===1&&rx>=2&&rx<=5)tone++;
    if(weather){
     if(h%9===0&&rx>=2&&rz>=1)tone--;
     if(h%17===0&&rx<=3&&rz>=2)tone++;
     if(h%13===0&&rx>=4&&rz===3)tone--;
    }
   }
  }else if(p.style==='ridgecap'){
   if(floorMod(x,6)===0)tone--;else if(weather&&floorMod(x,6)===1)tone++;
  }else if(p.style==='paving'){
   if(floorMod(x,10)===0||floorMod(y,8)===0)tone--;
   if(weather&&hash(Math.floor(x/10),Math.floor(y/8),M.seed)%7===0&&floorMod(x,10)<3&&floorMod(y,8)<3)tone--;
  }else if(p.style==='window'){
   tone=1;if(floorMod(along+z,9)<3)tone=2;
   if(weather&&ceiling<2&&edge>1)tone=0;
  }else if(p.style==='sail'){
   if(floorMod(along,4)===0||floorMod(z,5)===0)tone--;
   if(weather&&n%13===0&&floorMod(z,5)>=2)tone--;
  }else if(p.style==='fire'){tone=2+hash(Math.floor(along/2),Math.floor(z/3),M.seed)%3;}
  else if(p.style==='gable'){
   if(floorMod(along,16)<2||Math.abs(z-p.lo[2])<2)mat='wood',tone=1;
   else if(weather&&n%19===0&&floorMod(z,5)>2)tone--;
  }
  // Patina is fixed in local world coordinates, and turns with the structure.
  // It changes material pixels only: summer and winter silhouettes remain equal.
  if(weather&&!top&&['masonry','plaster','plank'].includes(p.style)){
   const damp=d.family==='varan'||d.family==='tagon'||d.family==='sylverive';
   const h=hash(Math.floor(along/7),0,M.seed),u=floorMod(along,7);
   if(base<3+(h%3)&&u>=1&&u<=5&&h%(damp?3:7)===0){
    if(d.family!=='sarak'&&d.material!=='adobe'&&p.mat!=='adobe'){mat='moss';tone=base<2?1:2;}
    else tone--;
   }
  }
  if(M.winter&&p.layer==='roof'&&top&&!(hash(Math.floor(x/7),Math.floor(y/6),M.seed)%13===0&&floorMod(x,7)>2&&floorMod(y,6)>2)){mat='snow';tone=3;if(floorMod(z+y*.35,10)<2)tone=2;if(ceiling<2)tone=4;layer='snow';}
  return [start[mat]+clamp(tone,0,4),['wall','roof','detail','mechanism','snow'].indexOf(layer)+1];
 }
 function triangle(p,ia,ib,ic){
  const vs=[p.v[ia],p.v[ib],p.v[ic]],q=vs.map(v=>{const a=project(...v);return [a[0]-minX,a[1]-minY];}),[a,b,c]=q,den=(b[1]-c[1])*(a[0]-c[0])+(c[0]-b[0])*(a[1]-c[1]);if(Math.abs(den)<.0001)return;
  const x0=Math.max(0,Math.floor(Math.min(a[0],b[0],c[0]))),x1=Math.min(width-1,Math.ceil(Math.max(a[0],b[0],c[0]))),y0=Math.max(0,Math.floor(Math.min(a[1],b[1],c[1]))),y1=Math.min(height-1,Math.ceil(Math.max(a[1],b[1],c[1])));
  for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){
   const aa=((b[1]-c[1])*(x-c[0])+(c[0]-b[0])*(y-c[1]))/den,bb=((c[1]-a[1])*(x-c[0])+(a[0]-c[0])*(y-c[1]))/den,cc=1-aa-bb;
   if(aa<-.0001||bb<-.0001||cc<-.0001)continue;
   const v=[0,1,2].map(j=>aa*vs[0][j]+bb*vs[1][j]+cc*vs[2][j]),z=v[0]+v[1]+v[2]+(p.bias||0),k=y*width+x;
   if(z+1e-4<depth[k])continue;
   const [colorIndex,layer]=color(p,v);indices[k]=colorIndex;layers[k]=layer;groundDepth[k]=(v[0]+v[1])/2;depth[k]=z;
  }
 }
 const cross=vs=>{const u=vs[1].map((n,i)=>n-vs[0][i]),v=vs[2].map((n,i)=>n-vs[0][i]);return [u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];};
 for(let i=0;i<ps.length;i++){const p=ps[i];p.original=M.polys[i];p.normal=cross(p.v);p.localNormal=cross(p.original.v);p.lo=[0,1,2].map(k=>Math.min(...p.original.v.map(a=>a[k])));p.hi=[0,1,2].map(k=>Math.max(...p.original.v.map(a=>a[k])));p.axis=[0,1,2].reduce((a,k)=>p.hi[k]-p.lo[k]>p.hi[a]-p.lo[a]?k:a,0);const axis=Math.abs(p.localNormal[0])>Math.abs(p.localNormal[1])?1:0;p.alongLo=p.lo[axis];p.alongHi=p.hi[axis];p.top=Math.abs(p.normal[2])>Math.max(Math.abs(p.normal[0]),Math.abs(p.normal[1]))*.6;for(let k=1;k<p.v.length-1;k++)triangle(p,0,k,k+1);}
 // A one-native-pixel dark contour follows only the outside silhouette.
 const original=new Uint8Array(indices);for(let y=1;y<height-1;y++)for(let x=1;x<width-1;x++){const k=y*width+x;if(!original[k]&&(original[k-1]||original[k+1]||original[k-width]||original[k+width])){indices[k]=start.ink;layers[k]=3;const neighbor=[k-1,k+1,k-width,k+width].find(n=>original[n]);groundDepth[k]=groundDepth[neighbor];}}
 const ground=rot([0,0,0]),anchor=project(...ground).map((v,i)=>v-(i?minY:minX));
 const footprint=[[0,0,0],[W,0,0],[W,D,0],[0,D,0]].map(v=>project(...rot(v)).map((n,i)=>n-project(...ground)[i]));
 return {id:d.id,dir,width,height,indices,layers,groundDepth,anchor,footprint,nativePlan:{width:W,depth:D,height:d.height},projection:'dimetric-2:1',geometry:{...M.meta,recipe:M.recipe},colors:new Set(indices).size-1};
}
function pixels(id,options={}){const d=entry(id),key=id+'/'+(options.dir||d.views[0])+'/'+(options.mechanismFrame||0)+'/'+(options.weather!==false)+'/'+(options.open===1?1:0);if(!cache.has(key))cache.set(key,render(d,options));const p=cache.get(key);return {...p,indices:new Uint8Array(p.indices),layers:new Uint8Array(p.layers),groundDepth:new Float32Array(p.groundDepth),anchor:p.anchor.slice(),footprint:p.footprint.map(a=>a.slice()),nativePlan:{...p.nativePlan},geometry:structuredCloneSafe(p.geometry)};}
function raster(id,options={}){
 const p=pixels(id,options),data=new Uint8ClampedArray(p.width*p.height*4),names=['wall','roof','detail','mechanism','snow'],li=options.layer?names.indexOf(options.layer)+1:0;
 if(options.layer&&!li)throw new RangeError('Calque inconnu');
 for(let i=0;i<p.indices.length;i++){const c=p.indices[i];if(c&&(!li||li===p.layers[i]))data.set(rgb[c],i*4);else if(li)p.indices[i]=0;}
 return {...p,data};
}
function draw(ctx,options){const {id,x=0,y=0,scale=1}=options;if(!Number.isInteger(scale)||scale<1||scale>8)throw new RangeError('Zoom entier 1 à 8 requis');const p=pixels(id,options),li=options.layer?['wall','roof','detail','mechanism','snow'].indexOf(options.layer)+1:0;if(options.layer&&!li)throw new RangeError('Calque inconnu');ctx.imageSmoothingEnabled=false;
 for(let yy=0;yy<p.height;yy++){for(let xx=0;xx<p.width;){const i=yy*p.width+xx,c=p.indices[i],visible=!li||p.layers[i]===li;let end=xx+1;while(end<p.width&&p.indices[yy*p.width+end]===c&&(!li||p.layers[yy*p.width+end]===p.layers[i]))end++;if(c&&visible){ctx.fillStyle=palette[c];ctx.fillRect(Math.round(x+(xx-p.anchor[0])*scale),Math.round(y+(yy-p.anchor[1])*scale),(end-xx)*scale,scale);}xx=end;}}
 return p;
}
return Object.freeze({version:1,scale:Object.freeze({...C.scale}),palette:Object.freeze(palette),projection:Object.freeze({name:'pixel isometric 2:1',x:[1,-1,0],y:[.5,.5,-1]}),project,entry,list,blueprint:(id,options={})=>mesh(entry(id),options),recipe:id=>recipe(entry(id)),pixels,raster,draw,createLibrary,clearCache:()=>cache.clear()});
});
