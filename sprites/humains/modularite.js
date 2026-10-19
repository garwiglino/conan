/* Native garment articulation. All limb pixels come from the selected source
 * layers: rigid rotations/translations only, no painted tubes or new palette.
 * The same small skeleton serves every current/future conforming garment. */
(function(r,f){const api=f(typeof module==='object'&&module.exports?require('./rig'):r.HearthreaverHumanRig);if(typeof module==='object'&&module.exports)module.exports=api;else r.HearthreaverHumanModularity=api;})(globalThis,function(R){
'use strict';
const {S,decode,round,category,bodyTransform}=R,INK=new Set(['100c14','100e20']);
const SLOT_LABELS=Object.freeze({feet:'Chaussures',legs:'Jambes / jupe',tunic:'Tunique',outer:'Gilet / pans',belt:'Ceinture',pouch:'Poche',sleeves:'Manches',gloves:'Gants',collar:'Col / épaules',cape:'Cape'});
function slot(l){const n=l.name;if(/^ANATOMIE/.test(n))return null;const code=/^HABIT (\d+)/.exec(n)?.[1];return ({10:'feet',11:'legs',12:'tunic',13:'sleeves',14:'outer',15:'belt',16:'pouch',17:'gloves',18:'collar',19:/Cape/.test(n)?'cape':'collar',23:'cape'})[code]||null;}
const mixes=new Map();
function compose(base,parts){
 if(!parts||!Object.keys(parts).length)return base;
 for(const key of Object.keys(parts))if(!SLOT_LABELS[key])throw RangeError('Pièce inconnue : '+key);
 const key=base.id+'|'+JSON.stringify(Object.keys(parts).sort().map(k=>[k,parts[k]]));if(mixes.has(key))return mixes.get(key);
 const layers=[],used=new Set();
 const bare=S.outfits['E01-'+base.sex];for(const l of bare.layers){const n=l.name,k=/Pieds nus/.test(n)?'feet':/Jambes/.test(n)?'legs':/Torse/.test(n)?'tunic':/Bras et mains/.test(n)?'arms':null;if(k&&(parts[k]===null||k==='arms'&&(parts.sleeves===null||parts.gloves===null)))layers.push({...l,sourceOutfit:bare.id});}
 const replacement=k=>{
  if(used.has(k))return;used.add(k);if(parts[k]===null)return;
  const id=parts[k],source=S.outfits[id];if(!source||source.sex!==base.sex)throw RangeError('Pièce incompatible : '+k+' / '+id);
  const chosen=source.layers.filter(l=>slot(l)===k);if(!chosen.length)throw RangeError('Pièce absente : '+k+' / '+id);
  for(const l of chosen)layers.push({...l,sourceOutfit:id});
 };
 for(const l of base.layers){const k=slot(l);if(k&&Object.hasOwn(parts,k))replacement(k);else layers.push(l);}
 for(const k of Object.keys(parts))replacement(k);
 const out={...base,layers,parts:{...parts},baseId:base.id};mixes.set(key,out);return out;
}
function optionsFor(sex,part){return Object.values(S.outfits).filter(o=>o.sex===sex&&o.layers.some(l=>slot(l)===part)).map(o=>o.id);}
// A view only depicts its near limb. The far limb is taken from the opposite
// authored view and reflected, keeping asymmetric armour on its correct arm.
function sourcePoints(outfit,dir,name,kind){
 const side=dir==='droite'||dir==='gauche',near=dir==='droite'?'right':'left',opposite=dir==='droite'?'gauche':'droite',mirror=side&&name!==near,view=R.directions.indexOf(mirror?opposite:dir),points=[];
 for(const l of outfit.layers){if(!l.visible||category(l.name)!==kind)continue;
  for(const [X,y,c]of decode(l.views[view])){
   if(!side){const anatomicalRight=dir==='dos'?X>=40:X<40;if(anatomicalRight!==(name==='right'))continue;}
   const x=mirror?79-X:X;points.push({x,y,c,layer:l.name,slot:slot(l),source:l.sourceOutfit||outfit.id});
  }
 }
 return points;
}
const profiles=new WeakMap();
function profile(outfit,dir,name){
 let cache=profiles.get(outfit);if(!cache)profiles.set(outfit,cache=new Map());const key=dir+name;if(cache.has(key))return cache.get(key);
 const points=sourcePoints(outfit,dir,name,'arms'),visible=new Map();for(const p of points)visible.set(p.y*80+p.x,p);
 const all=[...visible.values()];if(!all.length)throw Error('Bras natif absent : '+outfit.id+'/'+dir+'/'+name);
 const top=Math.min(...all.map(p=>p.y)),upper=all.filter(p=>p.y===top),center=upper.reduce((n,p)=>n+p.x,0)/upper.length;
 const handLayers=points.filter(p=>p.slot==='gloves'||/Mains conservees/i.test(p.layer)),handPoints=handLayers.length?handLayers:all.filter(p=>p.y>=top+2);
 const minHand=Math.min(...handPoints.map(p=>p.y)),maxHand=Math.max(...handPoints.map(p=>p.y));
 const pivot=[center,top],hand=[handPoints.reduce((n,p)=>n+p.x,0)/handPoints.length,(minHand+maxHand)/2],reach=Math.max(1.5,Math.hypot(hand[0]-pivot[0],hand[1]-pivot[1])),elbow=[(pivot[0]+hand[0])/2,(pivot[1]+hand[1])/2];
 const result={points:all,pivot,hand,elbow,reach,upperLength:reach/2,lowerLength:reach/2,handStart:minHand,source:outfit.id};cache.set(key,result);return result;
}
function rotate(p,origin,dest,angle){const c=Math.cos(angle),s=Math.sin(angle),x=p[0]-origin[0],y=p[1]-origin[1];return [dest[0]+x*c-y*s,dest[1]+x*s+y*c];}
// Rasterise each native pixel as a rigid 1x1 square. No length/width scaling,
// interpolation, outline expansion, recolouring or duplicated texture rows.
function stampRigid(buffer,points,origin,dest,angle=0,color=c=>c){
 if(!points.length)return [];
 const map=new Map(points.map(p=>[p.y*80+p.x,p])),left=Math.min(...points.map(p=>p.x))-.5,right=Math.max(...points.map(p=>p.x))+.5,top=Math.min(...points.map(p=>p.y))-.5,bottom=Math.max(...points.map(p=>p.y))+.5,corners=[[left,top],[right,top],[left,bottom],[right,bottom]].map(p=>rotate(p,origin,dest,angle)),xs=corners.map(p=>p[0]),ys=corners.map(p=>p[1]),written=[];
 const x0=Math.ceil(Math.min(...xs)),x1=Math.floor(Math.max(...xs)),y0=Math.ceil(Math.min(...ys)),y1=Math.floor(Math.max(...ys));
 for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){
  const q=rotate([x,y],dest,origin,-angle),p=map.get(round(q[1])*80+round(q[0]));if(!p)continue;
  const c=color(p.c,p);buffer.set(x,y,c);written.push({x,y,c,source:p.source,layer:p.layer,slot:p.slot});
 }
 return written;
}
function solve(model,shoulder,target){
 const dx=target[0]-shoulder[0],dy=target[1]-shoulder[1],distance=Math.hypot(dx,dy),reach=Math.min(distance,model.reach),ux=distance?dx/distance:0,uy=distance?dy/distance:1;
 const hand=[shoulder[0]+ux*reach,shoulder[1]+uy*reach],bend=Math.sqrt(Math.max(0,model.upperLength**2-reach**2/4)),sign=dx<0?-1:1;
 const elbow=[shoulder[0]+ux*reach/2-uy*bend*sign,shoulder[1]+uy*reach/2+ux*bend*sign];
 return {hand:hand.map(round),exactHand:hand,elbow,shoulder,reach:model.reach};
}
function arm(buffer,grips,model,shoulder,target){
 const bone=solve(model,shoulder,target),split=model.elbow[1],upper=model.points.filter(p=>p.y<=split&&p.y<model.handStart),lower=model.points.filter(p=>p.y>split&&p.y<model.handStart),hands=model.points.filter(p=>p.y>=model.handStart),sourceAngle=Math.atan2(model.hand[1]-model.pivot[1],model.hand[0]-model.pivot[0]),a=Math.atan2(bone.elbow[1]-shoulder[1],bone.elbow[0]-shoulder[0])-sourceAngle,b=Math.atan2(bone.exactHand[1]-bone.elbow[1],bone.exactHand[0]-bone.elbow[0])-sourceAngle;
 const written=[...stampRigid(buffer,upper,model.pivot,shoulder,a),...stampRigid(buffer,lower,model.elbow,bone.elbow,b)];
 // Keep the tiny fist's authored orientation/readability; the wrist follows
 // the solved endpoint. Gloves remain a native overlay, never skin dots.
 written.push(...stampRigid(grips,hands,model.hand,bone.exactHand,0));
 return {...bone,elbow:bone.elbow.map(round),written};
}
function shoulder(model,s,dir){return bodyTransform(s,dir,'body')(...model.pivot);}
function lowerPoints(outfit,dir,name,kind){return sourcePoints(outfit,dir,name,kind);}
function leg(buffer,outfit,dir,name,{hip,knee,foot,calfOnly=false}){
 const pants=lowerPoints(outfit,dir,name,'legs'),boots=lowerPoints(outfit,dir,name,'feet'),written=[];
 if(pants.length){const top=Math.min(...pants.map(p=>p.y)),rows=pants.filter(p=>p.y===top),origin=[rows.reduce((n,p)=>n+p.x,0)/rows.length,top];
  // The native lower body is only 2–3px tall. Rotate its thigh and move its
  // cuff to the ankle; never stretch a trouser strip along a longer skeleton.
  const split=top+1,upper=pants.filter(p=>p.y<=split),lower=pants.filter(p=>p.y>split),a=Math.atan2(knee[1]-hip[1],knee[0]-hip[0])-Math.PI/2;
  if(!calfOnly)written.push(...stampRigid(buffer,upper,origin,hip,a));
  written.push(...stampRigid(buffer,lower,[origin[0],split+1],[foot[0],foot[1]-2],0));
 }
 if(boots.length){const bottom=Math.max(...boots.map(p=>p.y)),row=boots.filter(p=>p.y===bottom),origin=[row.reduce((n,p)=>n+p.x,0)/row.length,bottom];written.push(...stampRigid(buffer,boots,origin,[foot[0],foot[1]],0));}
 return written;
}
function lowerPanel(points,dir,s,rider){
 if(!points.length)return [];
 const side=dir==='droite'||dir==='gauche',sg=dir==='gauche'?-1:1,dx=side?sg*(rider?2:round(2*(s.seated||0))):0,dy=rider?1:0;
 const t=bodyTransform(s,dir,'body');return points.map(([x,y,c])=>{const p=t(x,y);return [p[0]+dx,p[1]+dy,c];});
}
return Object.freeze({SLOT_LABELS,slot,compose,optionsFor,sourcePoints,profile,shoulder,solve,arm,leg,stampRigid,lowerPanel});
});
