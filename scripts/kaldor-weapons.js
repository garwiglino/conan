/* Shared weapon catalogue, choreography, collision geometry and pixel drawing.
 * Coordinates are relative to the player's feet; callers supply the same poses
 * to the human compositor and to the swept melee collision. No random stats. */
(function(root,factory){
 const data=typeof module==='object'&&module.exports?require('../data/weapons/catalogue.json'):root.KALDOR_WEAPONS_DATA;
 const api=factory(data);if(typeof module==='object'&&module.exports)module.exports=api;
 root.HearthreaverWeapons=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(data){
 'use strict';
 const freeze=o=>{if(o&&typeof o==='object'){Object.values(o).forEach(freeze);Object.freeze(o);}return o;};
 const all=freeze(data.weapons),byId=Object.fromEntries(all.map(w=>[w.id,w]));
 const START=data.start,get=id=>byId[id]||byId[START];
 const FAMILIES=freeze({sword:'Épée',sabre:'Sabre',dagger:'Dague',axe:'Hache',mace:'Masse / marteau',spear:'Lance / harpon',staff:'Bâton',glaive:'Vouge'});
 const PALETTES=freeze({
  iron:['#594e4b','#93857b','#d5c9ae','#aa7950'],steel:['#485664','#91a4ad','#ecf1df','#ccac64'],
  bronze:['#74523e','#bf8b51','#f6cf83','#80a19b'],wood:['#4e342c','#91603e','#d1a270','#b9b49b'],
  jade:['#324c48','#71947c','#c7d7ad','#dbad60'],ember:['#633c39','#a8664d','#edb77f','#f2d383']
 });
 const MOTIONS=freeze(data.motions);
 // Cut dead time, especially the floating follow-through and return. Tempo and
 // inertia remain relative to each individual weapon.
 const BEAT=freeze([1,.70,.35,.66,.46,.48]);
 // Contact must survive a 40ms tick. Recoil gets its own readable budget:
 // light weapons settle briskly; heavy weapons and finishers take more weight.
 const postHold=(id,combo=0)=>Math.min(.115,.058+get(id).weightKg*.012+(combo===3?.014:0));
 const contactWindow=(row,id,combo)=>{row[3]=Math.max(row[3],.045-row[2]);row[4]=Math.max(row[4],postHold(id,combo));return row;};
 function times(id,combo=0){
  const w=get(id),delivery=combo===3?(w.finisher.kind==='whirl'?2.6:1.35):1;
  if(w.family==='spear')return contactWindow(SPEAR_TIMES[combo].map((t,i)=>t*w.tempo*BEAT[i]*(i===2?delivery:i===3&&combo===3?.72:1)),id,combo);
  const row=MOTIONS[w.family].times[combo],reference={sword:1.8,sabre:1.25,dagger:.6,axe:1.9,mace:2.1,staff:1.6,glaive:2.7}[w.family];
  const inertia=Math.max(.84,Math.min(1.22,1+(w.weightKg/reference-1)*.16));
  return contactWindow(row.map((t,i)=>t*w.tempo*BEAT[i]*(i===1||i===4||i===5?inertia:1)*(i===2?delivery:i===3&&combo===3?.72:1)),id,combo);
 }
 const duration=(id,combo=0)=>times(id,combo).reduce((a,b)=>a+b,0);
 function frame(remaining,id,combo=0){
  const row=times(id,combo);let t=duration(id,combo)-Math.max(0,remaining);
  for(let i=0;i<6;i++){if(t<row[i]-1e-7)return i;t-=row[i];}return 5;
 }
 // Four held drawings only: anticipation, contact, recoil and ready.
 // Continuous authored geometry below remains for swept collision and smears.
 const DRAWINGS=freeze([1,1,2,2,3.5,5]);
 function sample(remaining,id,combo=0){return DRAWINGS[frame(remaining,id,combo)];}
 const canChain=(remaining,id,combo=0)=>combo<3&&remaining<=times(id,combo)[5]+1e-7;
 // Even a long engine tick must expose the recoil before a buffered link.
 function advance(remaining,dt,id,combo=0){
  const next=Math.max(0,remaining-dt),row=times(id,combo);
  return sample(remaining,id,combo)===2&&sample(next,id,combo)===5?row[4]+row[5]-1e-6:next;
 }
 // The arms and hands are existing sprite layers. Choreography translates
 // those intact images to the grip; it never generates an arm or changes its shape.
 const isPole=id=>['staff','spear','glaive'].includes(get(id).family);
 const handSpan=(id,dir)=>isPole(id)?dir===2?6:3.5:2;
 const fitGrip=(id,dir,h,u,span=handSpan(id,dir))=>{return {h:[...h],u,span,
  support:get(id).hands===2?[h[0]-u[0]*span,h[1]-u[1]*span]:null};};
 const forward=dir=>[[0,-1],[1,0],[0,1],[-1,0]][dir];
 const smooth=t=>t*t*(3-2*t);
 // Spear blows keep their separate load and recovery budgets.
 const SPEAR_NAMES=freeze(['Estoc vif','Revers de hampe','Taille croisée','Fente longue']);
 const SPEAR_TIMES=freeze([
  [0,.12,.045,.055,.085,.115],
  [0,.16,.05,.065,.105,.135],
  [0,.14,.045,.065,.10,.14],
  [0,.21,.05,.085,.15,.19]
 ]);
 function guard(id,dir){
  const w=get(id),profile=dir===1||dir===3;
  if(dir===2&&isPole(id))return {h:[-3,-7],u:[-.65,Math.sqrt(1-.65*.65)],reach:w.length+2,profile};
  if(w.family==='spear'){
   const [fx,fy]=forward(dir),side=[-fy,fx],a=-.15*(dir===3?-1:1);
   return {h:dir===0?[4,-8]:dir===2?[-4,-7]:dir===1?[1,-6]:[-2,-6],
    u:[fx*Math.cos(a)+side[0]*Math.sin(a),fy*Math.cos(a)+side[1]*Math.sin(a)],reach:w.length+2,profile};
  }
  const pole=w.family==='staff'||w.family==='glaive';
  const h=dir===0?[4,-8]:dir===2?[-7,-6]:dir===1?[1,-6]:[-2,-6];
  const u=pole?(dir===0?[.12,-.993]:dir===2?[-.12,.993]:dir===1?[.985,-.173]:[-.985,-.173]):dir===0?[.6,-.8]:dir===2?[-.65,-.76]:dir===1?[.58,-.815]:[-.58,-.815];
  return {h,u,reach:w.length+2,profile};
 }
 // Normal carrying differs from combat guard: shaft upright across the
 // chest, high leading hand and low supporting hand. The transverse diagonal
 // projects vertically in profile, retaining its shortened vertical component.
 function carry(id,dir){
  const w=get(id);if(!['spear','staff'].includes(w.family))return {...guard(id,dir),span:handSpan(id,dir)};
  const side=dir===0||dir===3?-1:1,profile=dir===1||dir===3;
  return {h:[side*(profile?5:3),profile?-9:-8],u:[profile?0:side*.76,-Math.sqrt(1-.76**2)],reach:w.length*.72+2,profile,span:8,scale:.72};
 }
 // Keep the entire painted weapon and its effects in the common 80px cell.
 // This adjusts the original hand-layer position; it never changes a limb.
 function confineGrip(w,h,u){
  const tip=[h[0]+u[0]*(w.length+2),h[1]+u[1]*(w.length+2)];
  return [h[0]+(tip[0]<-33?-33-tip[0]:tip[0]>33?33-tip[0]:0),h[1]+(tip[1]<-44?-44-tip[1]:tip[1]>22?22-tip[1]:0)];
 }
 // Screen-space stroke drawings, authored separately for face and profile.
 // [hand x, hand height, blade x, blade y]. The hand crosses the torso;
 // the edge travels with it instead of orbiting a fixed wrist. Back view
 // projects the contact away from the camera, while keeping the raised load.
 const STROKES=freeze({
  cut:{face:[[7,-14,.55,-.84],[2,-9,.8,.6],[-5,-3,-.35,.94],[-7,-2,-.65,.76]],
       side:[[-4,-17,-.65,-.76],[5,-12,.9,-.44],[9,-4,.92,.39],[7,-2,.65,.76]]},
  reverse:{face:[[-8,-10,-.8,-.6],[-1,-7,-.5,.87],[7,-4,.7,.71],[8,-5,.88,.48]],
           side:[[0,-3,.4,.92],[6,-7,.98,.18],[8,-14,.75,-.66],[5,-17,.35,-.94]]},
  rise:{face:[[7,-2,.9,.44],[2,-5,.8,-.6],[-5,-12,-.65,-.76],[-7,-14,-.8,-.6]],
        side:[[-3,-2,.55,.83],[6,-6,.99,.12],[9,-13,.85,-.53],[6,-16,.55,-.84]]},
  overhead:{face:[[-1,-19,-.14,-.99],[0,-10,.9,.44],[1,-2,.08,1],[2,0,.16,.99]],
            side:[[-5,-19,-.55,-.84],[5,-12,.94,-.34],[10,-3,.88,.48],[8,0,.55,.84]]},
  thrust:{face:[[-6,-9,-.18,.98],[-3,-5,-.12,.99],[0,0,-.06,1],[-1,-1,-.1,.99]],
          side:[[-4,-7,.99,-.14],[5,-7,1,-.05],[12,-6,1,0],[9,-6,1,.04]]},
  cross:{face:[[6,-3,.75,.66],[1,-5,-.6,.8],[-5,-5,-.75,.66],[-6,-5,-.8,.6]],
         side:[[-4,-5,.8,.6],[4,-7,.99,.1],[9,-5,.99,.1],[7,-5,.98,.2]]},
  butt:{face:[[7,-8,.9,-.44],[1,-6,.94,.34],[-7,-4,.8,.6],[-8,-3,.65,.76]],
        side:[[-5,-5,-.94,-.34],[4,-6,-1,0],[10,-6,-.99,.14],[8,-5,-.94,.34]]}
 });
 // Face-on wind-ups and overshoots alternate sides. Contact converges ahead;
 // their screen order is allowed to change as a real cut crosses the body.
 const POLE_FACE=freeze({
  thrust:[[0,-11,-.65,.76],[-4,-7,-.65,.76],[-7,-3,-.65,.76],[-6,-4,-.65,.76]],
  cut:[[7,-12,.7,-.7],[0,-7,.6,.8],[-7,-3,-.65,.76],[-8,-2,-.7,.71]],
  reverse:[[-7,-12,-.7,-.7],[0,-7,-.6,.8],[7,-3,.65,.76],[8,-2,.7,.71]],
  cross:[[6,-3,.75,.66],[1,-5,-.6,.8],[-5,-5,-.75,.66],[-6,-5,-.8,.6]],
  butt:[[-7,-10,-.8,-.6],[-1,-6,-.6,.8],[7,-3,.8,.6],[8,-3,.85,.53]]
 });
 const STYLES=freeze({
  sword:{strokes:['cut','reverse','rise','overhead'],span:1,drive:1},
  sabre:{strokes:['cut','reverse','rise','cut'],span:1.12,drive:1.1},
  dagger:{strokes:['cut','reverse','thrust','thrust'],span:.73,drive:.9},
  axe:{strokes:['cut','reverse','rise','overhead'],span:1.03,drive:1.12},
  mace:{strokes:['cut','reverse','rise','overhead'],span:.92,drive:1.2},
  spear:{strokes:['thrust','reverse','cross','thrust'],span:1,drive:1.15},
  staff:{strokes:['cut','reverse','cross','thrust'],span:1.08,drive:1},
  glaive:{strokes:['cut','reverse','cross','thrust'],span:1.1,drive:1.12}
 });
 // Contact is a deliberate key pose, not the middle of an arc. Its leading
 // point is straight ahead; wind-up and overshoot carry the combo's contrast.
 // All coordinates feed both native layer placement and swept melee geometry.
 function contactPose(id,dir,combo,body=[0,0]){
  const w=get(id),profile=dir===1||dir===3,[fx,fy]=forward(dir);
  const drive={dagger:7,sword:6,sabre:6,axe:5,mace:4,spear:5,staff:5,glaive:5}[w.family];
  const reach=w.length+2;
  const h=profile?[fx*Math.min(32-reach,drive+Math.abs(body[0])+(combo===2?1:0)),-9]:[0,dir===0?-14:-6];
  return {h:confineGrip(w,h,[fx,fy]),u:[fx,fy]};
 }
 function keyPose(id,dir,f,combo){
  const w=get(id),ready=guard(id,dir);
  if(f===0||f===5)return {...ready,body:[0,0],leg:0,head:[0,0],hair:[0,0],lunge:false,z:dir===0?0:1};
  const style=STYLES[w.family],stroke=style.strokes[combo],profile=dir===1||dir===3;
  const poleFace=dir===2&&isPole(id);
  const row=(poleFace?POLE_FACE[stroke]:STROKES[stroke][profile?'side':'face'])[f-1];
  const [fx,fy]=forward(dir),mirror=dir===3||dir===0?-1:1;
  const finish=combo===3?1.12:1,two=w.hands===2,span=style.span*(two?.92:1);
  const advance=[-1,1,2,1][f-1]*style.drive*finish;
  const body=[Math.round(fx*advance),Math.round(fy*advance*.45+(f===3&&stroke==='overhead'?1:0))];
  let x=row[0]*span,y=row[1],ux=row[2],uy=row[3];
  // The finishing estoc uses the opposite shoulder, rather than repeating
  // the first thrust's left diagonal. Keep its extension on that same axis.
  const oppositeThrust=poleFace&&stroke==='thrust'&&combo===3;
  if(oppositeThrust){x=-x;ux=-ux;}
  if(combo===3&&stroke==='cut'){x*=1.16;y+=f===1?-2:2;}
  // A long finishing thrust moves the grip, not the arm's pixels or length.
  if(stroke==='thrust'&&combo===3){
   const extra=[-1,1,2,1][f-1];
   if(poleFace){x+=ux*extra;y+=uy*extra;}
   else{x+=profile?extra:[0,1,1,0][f-1];y+=profile?0:[0,1,2,1][f-1];}
  }
  if(dir===0){x=-x;y=f===1?y:-12-(y+7)*.45;ux=-ux;if(f>1||stroke==='thrust')uy=-Math.abs(uy);}
  if(dir===3){x=-x;ux=-ux;}
  // Side grips are carried forward by the weight transfer. Face grips traverse
  // shoulder -> centre -> opposite hip. Small family offsets retain identity.
  if(profile)x+=fx*(two?1:0);else x+=(w.variant-1.5)*.25*mirror;
  const len=Math.hypot(ux,uy);let u=[ux/len,uy/len],h=confineGrip(w,[x+body[0],y+body[1]],u);
  if(f===2)({h,u}=contactPose(id,dir,combo,body));
  // A thrust retracts along the same axis as contact. The reverse and cuts
  // keep alternating wind-ups and overshoots instead of four identical stabs.
  if(f===1&&stroke==='thrust'){
   u=forward(dir);h=confineGrip(w,profile?[-fx*4,-9]:[0,dir===0?-8:-12],u);
  }
  if(f===3&&stroke==='thrust'){
   const contact=contactPose(id,dir,combo,body);u=contact.u;h=confineGrip(w,[contact.h[0]+fx,contact.h[1]+fy],u);
  }
  return {h,u,reach:w.length+2,body,leg:f===1?combo===1?3:0:f===2||f===3?combo===2?7:4:5,
   head:[body[0]+(profile?fx*(f===1?-1:1):Math.round(x*.12)),body[1]+(f===3?1:0)],
   hair:[-fx*(f===2||f===3?2:-1),f===1?1:0],lunge:f>=2&&f<=4,z:dir===0?0:1};
 }
 // The finisher has ONE delivery: frame 1 -> 2. Frames 2 -> 3 hold
 // that same contact, then 3 -> 5 only withdraw. No second thrust on settling.
 function finisherPose(id,dir,f){
  const w=get(id),v=w.finisher,g=guard(id,dir),[fx,fy]=forward(dir),profile=dir===1||dir===3;
  if(f===0||f===5)return {...g,body:[0,0],head:[0,0],hair:[0,0],leg:0,lunge:false,z:dir===0?0:1,view:dir};
  const kind=v.kind,whirl=kind==='whirl',thrust=kind==='lunge',smash=kind==='smash'||kind==='cleave';
  const mirror=dir===3?-1:1;
  const {h:contact,u:edge}=contactPose(id,dir,3);
  const a=Math.atan2(edge[1],edge[0]);
  let load=contact.map((x,k)=>x-edge[k]*v.drive),loadAngle=a;
  if(thrust&&!profile)load=[0,dir===0?-8+v.drive*.06+v.tilt*.25:-12-v.drive*.10-Math.abs(v.tilt)*.7];
  if(!thrust){
   load=profile?[-5*mirror,smash?-20:-9]:dir===0?[6,smash?-20:-8]:[-6,smash?-20:-8];
   load[0]+=v.tilt*(profile?mirror:1)*3;load[1]-=Math.abs(v.tilt)*2;
   loadAngle=(profile?(dir===3?Math.PI:0)+(smash?-2.0:-1.25)*mirror:dir===0?(smash?-.5:1.0):(smash?-1.7:2.5))+v.tilt*.65*mirror;
  }
  const landed=[Math.round(fx*(2+v.drive*.08)),Math.round(fy*.7+(smash?1:0))];
  // A body turn sweeps a horizontal waist-height ellipse in perspective,
  // never a vertical wheel pasted over the face. Only weapon projection changes.
  const orbit=Math.max(4,Math.min(8,31-w.length-2));
  const wind=profile?[-fx*(4+v.tilt*2),0]:[dir===0?-6-v.tilt*2:6+v.tilt*2,0];
  if(whirl){loadAngle=a;load=[Math.cos(a)*orbit+Math.round(fx*1.5)+wind[0],-9+Math.sin(a)*2+Math.round(fy*.5)+wind[1]];}
  const homeAngle=Math.atan2(g.u[1],g.u[0]);
  const short=(a,b)=>Math.atan2(Math.sin(b-a),Math.cos(b-a));
  const lerp=(a,b,t)=>a+(b-a)*t;
  let h,angle,view=dir,body,leg=0,depth=1;
  if(f<1){
   const t=smooth(f);h=g.h.map((x,k)=>lerp(x,load[k],t));angle=homeAngle+short(homeAngle,loadAngle)*t;
   if(whirl)depth=lerp(1,.35,t);
   body=whirl?[Math.round(fx*1.5*t),Math.round(fy*.5*t)]:[Math.round(-fx*t),Math.round((smash?1:0)*t)];
  }else if(f<2){
   const t=Math.pow(f-1,whirl?1:2.15);leg=t<.5?0:4;
   if(whirl){
    angle=a-Math.PI*2+Math.PI*2*t;view=(dir+Math.floor(t*4+.0001))%4;
    const turn=forward(view);body=[Math.round(turn[0]*1.5*(1-t)+landed[0]*t),Math.round(turn[1]*.5*(1-t)+landed[1]*t)];
    depth=.35;h=[Math.cos(angle)*orbit+body[0]+wind[0]*(1-t),-9+Math.sin(angle)*2+body[1]+wind[1]*(1-t)];
   }else{
    angle=loadAngle+short(loadAngle,a)*t;h=load.map((x,k)=>lerp(x,contact[k],t));
    body=[Math.round(lerp(-fx,landed[0],t)),Math.round(lerp(smash?1:0,landed[1],t))];
   }
  }else{
   const retreat=f<=3?0:f<4?.35*smooth(f-3):.35+.65*smooth(f-4);
   const end=whirl?[Math.cos(a)*orbit+landed[0],-9+Math.sin(a)*2+landed[1]]:contact;
   const handRetreat=dir===2&&g.u[1]<0?Math.min(1,retreat*1.3):retreat;
   h=end.map((x,k)=>lerp(x,g.h[k],handRetreat));
   // Front recovery drops out to the hip before raising the edge outside the
   // shoulder. The shortest angle used to flick slash blades through the face.
   let recovery=short(a,homeAngle);
   if(dir===2&&g.u[1]<0&&recovery<0)recovery+=Math.PI*2;
   angle=a+recovery*retreat;if(whirl)depth=lerp(.35,1,retreat);
   body=landed.map(x=>Math.round(x*(1-retreat)));leg=retreat<.5?4:5;
  }
  const u=[Math.cos(angle),Math.sin(angle)*depth];h=confineGrip(w,h,u);
  return {h,u,reach:w.length+2,body,view,leg,head:[body[0],body[1]+(f>=2&&f<=3?1:0)],
   hair:[f>=1&&f<2?-fx*2:0,smash&&f<2?1:0],lunge:f>=1&&f<4.5,z:whirl&&f>=1&&f<=3?(u[1]<0?0:1):view===0?0:1};
 }

 function pose(id,dir,f,combo=0){
  if(combo===3)return finisherPose(id,dir,Math.max(0,Math.min(5,f)));
  // A real follow-through: retain the transferred weight and the authored
  // overshoot, rather than disguising the next wind-up as recoil.
  if(f===3.5){
   const p=keyPose(id,dir,3,combo);
   if(STYLES[get(id).family].strokes[combo]==='thrust'){
    const hit=contactPose(id,dir,combo,p.body),v=forward(dir);
    p.h=confineGrip(get(id),hit.h.map((n,k)=>n-v[k]*5),v);p.u=v;
   }
   return p;
  }
  f=Math.max(0,Math.min(5,f));const i=Math.floor(f),fraction=f-i,w=get(id),spear=w.family==='spear';
  // Slow load, fast delivery, then an overshoot and a weighted recovery.
  const weight=Math.max(2,Math.min(3.2,2+w.weightKg*.25));
  const t=i===1?Math.pow(fraction,spear?2:weight):i===2?1-Math.pow(1-fraction,spear?3:weight+1):i===3?Math.min(1,fraction*2):i===4?smooth(fraction):smooth(fraction);
  const a=keyPose(id,dir,i,combo),b=keyPose(id,dir,Math.min(5,i+1),combo);
  let angle=Math.atan2(a.u[1],a.u[0]),delta=Math.atan2(b.u[1],b.u[0])-angle;
  while(delta>Math.PI)delta-=Math.PI*2;while(delta<-Math.PI)delta+=Math.PI*2;
  const outerRecovery=dir===2&&i===4&&b.u[1]<0&&delta<0;
  if(outerRecovery)delta+=Math.PI*2;
  angle+=delta*t;
  const lerp=(x,y)=>x+(y-x)*t,handTime=outerRecovery?Math.min(1,t*1.3):t;
  const u=[Math.cos(angle),Math.sin(angle)],raw=a.h.map((v,k)=>v+(b.h[k]-v)*handTime),h=confineGrip(w,raw,u);
  return {h,u,reach:a.reach,body:a.body?a.body.map((v,k)=>Math.round(lerp(v,b.body[k]))):[0,0],leg:fraction<.5?a.leg:b.leg,
   head:a.head.map((v,k)=>Math.round(lerp(v,b.head[k]))),hair:a.hair.map((v,k)=>Math.round(lerp(v,b.hair[k]))),lunge:a.lunge||b.lunge,z:a.z};
 }
 function vector(id,dir,f,combo){const p=pose(id,dir,f,combo);return [...p.h,p.u[0]*p.reach,p.u[1]*p.reach];}
 function segmentDistance(x,y,ax,ay,bx,by){const dx=bx-ax,dy=by-ay,l=dx*dx+dy*dy,t=l?Math.max(0,Math.min(1,((x-ax)*dx+(y-ay)*dy)/l)):0;return Math.hypot(x-ax-dx*t,y-ay-dy*t);}
 function hits(actor,target,f){
  if(actor.impactTick===false||(f!==2&&f!==3)||(actor.level||0)!==(target.level||0))return false;
  let from=f-1,to=f;
  // A live strike jumps straight from its held load to its impact drawing.
  // Sweep that visible jump once; held contact never casts a future recovery.
  const finisher=(actor.combo||0)===3;
  if(Number.isFinite(actor.attack)&&actor.attack>0){
   to=2;if(sample(actor.attack,actor.weapon,actor.combo||0)!==2)return false;
   from=actor.impactTick===true||f===2||sample(actor.attack+.04,actor.weapon,actor.combo||0)<2?1:2;
  }
  const density=finisher?(from>=2?1:get(actor.weapon).finisher.kind==='whirl'?128:40):20;
  const steps=Math.max(1,Math.ceil(density*(to-from)));
  for(let i=0;i<=steps;i++){
   const p=pose(actor.weapon,actor.dir,from+(to-from)*i/steps,actor.combo||0),[x,y]=p.h;
   if(segmentDistance(target.x-actor.x,target.y-actor.y-9,x-(['staff','spear','glaive'].includes(get(actor.weapon).family)?p.u[0]*7:0),y-(['staff','spear','glaive'].includes(get(actor.weapon).family)?p.u[1]*7:0),x+p.u[0]*p.reach,y+p.u[1]*p.reach)<(target.r||6)+(['axe','mace','sabre'].includes(get(actor.weapon).family)?3:1.5))return true;
  }return false;
 }
 // Palette-authored silhouettes in weapon-local coordinates. Every point is
 // rounded by the compositor's pixel buffer, with one common ink outline.
 function paint(b,id,hx,hy,ux,uy,scale=1){
  const w=get(id),p=PALETTES[w.material],n=[-uy,ux],L=w.length*Math.max(.15,scale),long=['spear','staff','glaive'].includes(w.family);
  const at=(r,s=0)=>[hx+ux*r+n[0]*s,hy+uy*r+n[1]*s];
  const dot=(r,s,c,z=3)=>b.set(...at(r,s),c,z);
  const line=(r,s,R,S,c,z=2)=>b.line(...at(r,s),...at(R,S),c,z);
  const fill=(r0,r1,width,c)=>{for(let r=r0;r<=r1;r+=.5){const wid=typeof width==='function'?width(r):width;for(let s=-wid;s<=wid;s++)dot(r,s,c);}};
  line(long?-7:-3,0,L,0,'#50342f');line(long?-7:-3,-1,L-1,-1,'#91603e');
  for(let r=-2;r<=1;r++)dot(r,0,w.variant%2?'#835c44':'#61513e',5);
  if(w.family==='sword'||w.family==='dagger'||w.family==='sabre'){
   const curve=w.family==='sabre'?1:w.family==='dagger'&&w.variant%2?.5:0;
   for(let r=2;r<=L+2;r+=.5){const s=curve*Math.pow((r-2)/Math.max(1,L),2)*3;
    dot(r,s,p[2]);if(r<L+1)dot(r,s-1,p[1]);if(w.variant===2&&r<L-2)dot(r,s+1,p[0]);}
   line(1,-2-(w.variant===3?1:0),1,2,p[3],6);dot(-3,0,p[3],5);
   if(w.family==='sabre')line(-1,2,1,3,p[3],5);
  }else if(w.family==='axe'){
   for(let r=L-4;r<=L+1;r+=.5){const width=Math.max(1,Math.round(4-Math.abs(r-(L-1))*.6));
    for(let s=0;s<=width;s++)dot(r,s,s===width?p[2]:p[1]);}
   line(L-2,-2,L-1,0,p[3],4);if(w.variant===1)line(L-3,-3,L,-3,p[2],4);
  }else if(w.family==='mace'){
   const hammer=w.variant%2===0;
   fill(L-3,L+1,hammer?2:r=>Math.round(3-Math.abs(r-(L-1))*.4),p[1]);
   line(L-3,-2,L+1,-2,p[2],4);line(L-3,0,L+1,0,p[3],4);
   if(hammer)line(L-1,-4,L,3,p[2],4);
   else for(const s of [-3,3])dot(L-1,s,p[2],5);
  }else if(w.family==='spear'||w.family==='glaive'){
   const wide=w.family==='glaive'?3:1;
   for(let r=L-5;r<=L+2;r+=.5){const width=Math.max(0,wide*(1-Math.abs(r-(L-2))/5));for(let s=-width;s<=width;s++)dot(r,s,s<0?p[1]:p[2]);}
   line(L-6,-1,L-6,1,p[3],5);
   if(w.family==='glaive'||w.variant===3)line(L-4,-3,L-1,-2,p[3],5);
   if(w.id==='harpon-joncs'){line(L-2,1,L-5,3,p[2],5);line(L-2,-1,L-5,-3,p[2],5);}
  }else{
   if(w.head==='orb'){fill(L-2,L+2,r=>Math.max(1,Math.round(3-Math.abs(r-L)*.7)),p[1]);dot(L,-1,p[2],5);dot(L-1,-2,p[2],5);}
   line(L-2,-1,L+2,-1,p[3],4);line(L-2,0,L+2,0,p[2],4);line(-7,0,-5,0,p[3],4);
   for(const r of [3,7,L-4])line(r,-1,r,0,p[3],4);
  }
 }
 function trail(b,id,dir,f,combo,rear=b){
  const w=get(id),profile=w.family==='spear'?{trailWidth:3,ghosts:0}:MOTIONS[w.family];
  if(f!==2)return;
  const p=PALETTES[w.material],previous=1;
  const sink=(q,x,y)=>combo===3&&w.finisher.kind==='whirl'&&(q.z===0||dir===2&&x>-5&&x<5&&y< -9)?rear:b;
  const width=profile.trailWidth*(.85+Math.min(.35,w.weightKg*.1));
  // Dithered silhouettes record earlier WEAPON positions, without touching
 // or regenerating any character layer. Heavy heads carry a longer shadow.
  for(let n=profile.ghosts;n>0;n--){
   const q=pose(id,dir,Math.max(1,f-n*.24),combo);
   const ghost={set(x,y,color,z){if(((Math.round(x)+Math.round(y)+n)&(n===2?3:1))===0)sink(q,x,y).set(x,y,p[0],-5+n);},
    line(x,y,X,Y,color,z){const count=Math.max(1,Math.ceil(Math.hypot(X-x,Y-y)*2));for(let i=0;i<=count;i++)this.set(x+(X-x)*i/count,y+(Y-y)*i/count,color,z);}};
   paint(ghost,id,...q.h,...q.u);
  }
  for(let i=0;i<=36;i++){
   const t=i/36,q=pose(id,dir,previous+(f-previous)*t,combo),r=q.reach;
   for(let k=0;k<width;k+=.65){
    const x=q.h[0]+q.u[0]*(r-k),y=q.h[1]+q.u[1]*(r-k);
    if(t<.4&&((Math.round(x)+Math.round(y))&1))continue;
    sink(q,x,y).set(x,y,k<.8?p[2]:t>.5?p[3]:p[1],1);
   }
   if(w.family==='staff'){const x=q.h[0]-q.u[0]*7,y=q.h[1]-q.u[1]*7;sink(q,x,y).set(x,y,p[3],0);}
  }
 }
 // Pixel effects are bounded to the same native cell and the one delivery.
 // Magic is authored per weapon; ordinary steel gets short impact sparks.
 const FINISH_COLORS=freeze({steel:['#768b91','#cbd4ca','#fff5d9'],gold:['#a16b3e','#e5b955','#fff1ac'],
  dust:['#685340','#ab875c','#d6ba8b'],wind:['#639786','#b7d1b2','#f2f1cb'],
  frost:['#537a9a','#8dccdd','#e3fbf4'],ember:['#a34432','#ee8d43','#fff0a0'],
  tide:['#467e91','#74bfc4','#d4f3e3'],jade:['#3d765b','#8fc87c','#e3edac'],
  sand:['#886044','#d4a766','#f8db9e'],star:['#71709b','#b4b0df','#f5edce']});
 function finisherEffects(buffer,id,dir,f,rear=buffer){
  if(f<1.1||f>4.25)return;
  const w=get(id),v=w.finisher,p=pose(id,dir,f,3),colors=FINISH_COLORS[v.effect],magic=v.magic;
  const set=(x,y,c,z=2,target=buffer)=>{if(x>=-34&&x<=34&&y>=-44&&y<=23)target.set(x,y,c,z);};
  const line=(x,y,X,Y,c,z=2)=>{const n=Math.max(1,Math.ceil(Math.hypot(X-x,Y-y)*2));for(let i=0;i<=n;i++)set(x+(X-x)*i/n,y+(Y-y)*i/n,c,z);};
  const tip=[p.h[0]+p.u[0]*p.reach,p.h[1]+p.u[1]*p.reach];
  if(f<2){
   // A short charge on exceptional heads, never a detached projectile.
   if(magic)for(let k=0;k<3;k++){const d=2+(f-1)*3+k;set(tip[0]+Math.cos(k*2.1+f)*d,tip[1]+Math.sin(k*2.1+f)*d,colors[k]);}
   return;
  }
  const age=f-2,fade=Math.max(0,1-age/2.25),radius=2+age*4;
  if(age<.8)for(let k=0;k<4;k++){
   const a=k*Math.PI/2+v.tilt,dx=Math.cos(a),dy=Math.sin(a),r=(magic?radius+2:radius)*fade;
   line(tip[0]+dx,tip[1]+dy,tip[0]+dx*r,tip[1]+dy*r,colors[age<.3?2:1],3);
  }
  if(!magic&&['steel','gold'].includes(v.effect))return;
  if(v.kind==='smash'||v.effect==='dust'){
   for(let k=0;k<9;k++){const a=k/8*Math.PI,r=(3+age*7)*(k%2?.8:1);
    set(tip[0]+Math.cos(a)*r,tip[1]+Math.sin(a)*r*.35-age*2,colors[k%3],1);}
  }
  if(magic){
   const n=v.effect==='jade'?4:6;
   for(let k=0;k<n;k++){
    const a=k*Math.PI*2/n+v.tilt,r=3+age*4,x=tip[0]+Math.cos(a)*r,y=tip[1]+Math.sin(a)*r*.65-age*.5;
    if(v.effect==='frost'||v.effect==='jade'||v.effect==='star'){
     line(x,y-1.5,x+1,y,colors[2]);line(x+1,y,x,y+1.5,colors[1]);line(x,y+1.5,x-1,y,colors[0]);
    }else if(v.effect==='ember'){
     line(x,y,x+Math.cos(a)*2,y-2-age,colors[k%2+1]);set(x,y-1,colors[2],3);
    }else if(v.effect==='tide'){
     line(x-1,y,x,y-1,colors[1]);line(x,y-1,x+2,y,colors[2]);
    }else set(x,y,colors[k%3],2);
   }
  }
  if(v.kind==='whirl'||v.kind==='sweep'||v.kind==='seal'){
   // Residue follows the same weapon sweep that can actually connect.
   for(let i=0;i<=28;i++){
    const q=pose(id,dir,1+i/28,3),r=q.reach*(magic?.85:.95);
    if(age>.7&&i%3)continue;
    set(q.h[0]+q.u[0]*r,q.h[1]+q.u[1]*r,colors[age<.7?1:0],0,v.kind==='whirl'&&q.z===0?rear:buffer);
   }
  }
 }

 const loadouts=freeze(data.loadouts||{});
 function speciesOf(actor){
  if(actor?.batracien)return 'batracien';
  const raw=actor?.species||actor?.race||actor?.civilian?.appearance?.species;
  const id=String((typeof raw==='object'?raw?.id:raw)||'').toLowerCase().replaceAll('-','_');
  return ({gobelin:'goblin',gobelins:'goblin',orque:'orc',orques:'orc',centaure:'centaur',centaures:'centaur',centaurfolk:'centaur',homme_serpent:'serpentfolk',hommes_serpents:'serpentfolk',homme_singe:'ape_folk',hommes_singes:'ape_folk',humain:'human'})[id]||id||null;
 }
 function carriedBy(actor){
  if(!actor||actor.kind==='snake'||actor.kind==='guardian'||actor.id==='fairy')return null;
  if(hasArmament(actor.armament))return actor.armament;
  const role=actor.batracien?.role||actor.combatRole||actor.role;
  const species=speciesOf(actor);
  if(actor.kind==='boss'&&(!species||species==='human'||species==='cultist'))return loadouts.cultist?.elite||null;
  if(actor.kind==='skeleton')return loadouts.skeleton?.basic||null;
  if(actor.kind==='cultist')return loadouts.cultist?.basic||null;
  const armed=actor.armed===true||actor.eventGuard||actor.convoyGuard||!!actor.batracien?.role||actor.kind==='bandit'||actor.kind==='boss'||['guard','warrior','raider','scout','captain','chief','boss','champion','village_guard'].includes(role);
  if(!armed)return null;
  const profile=loadouts[species||(actor.kind==='bandit'||actor.eventGuard||actor.convoyGuard?'human':'')];if(!profile)return null;
  if(actor.elite||actor.kind==='boss'||['boss','chief','champion'].includes(role))return profile.elite;
  return profile.roles?.[role]||(role==='captain'?profile.elite:null)||(actor.kind==='bandit'||role==='raider'?profile.raider:null)||profile.basic;
 }
 const hasArmament=id=>typeof id==='string'&&Object.hasOwn(byId,id);
 function comboNames(id){const w=get(id),names=[...(w.family==='spear'?SPEAR_NAMES:MOTIONS[w.family].names)];names[3]=w.finisher.name;return names;}
 const cadence=id=>[0,1,2,3].reduce((n,c)=>n+duration(START,c),0)/[0,1,2,3].reduce((n,c)=>n+duration(id,c),0);
 const attackStep=(id,combo=0)=>{const f=get(id).family,pairs={dagger:[2,4],sword:[3,6],sabre:[4,7],axe:[3,6],mace:[2,4],staff:[4,7],spear:[4,9],glaive:[4,8]};return pairs[f][combo===3?1:0];};
 const hitPause=(id,combo=0)=>Math.min(.065,.025+get(id).weightKg*.006+(combo===3?.012:0));
 const holster=id=>get(id).family==='spear'?{delay:3.7,stow:.33,draw:.21}:{delay:3.7,stow:Math.min(.46,Math.max(.22,.21+get(id).weightKg*.06)),draw:Math.min(.31,Math.max(.16,.15+get(id).weightKg*.045))};
 function preview(id,seconds,mode='attack',idleFrame=0){
  const t=Math.max(0,seconds),gait=Math.floor(t*10)%8;
  if(mode==='finisher'){
   const len=duration(id,3),at=t%(len+1),strike=at-.2;
   if(strike<0||strike>=len)return {state:'idle',frame:idleFrame,combo:3,label:comboNames(id)[3]+' · Garde'};
   const phase=frame(len-strike,id,3),drawing=sample(len-strike,id,3);return {state:drawing===5?'idle':'attack',frame:drawing===5?idleFrame:drawing,combo:3,label:comboNames(id)[3]+' · '+['Préparation','Préparation','Impact','Impact','Après-impact','Garde'][phase]};
  }
  if(mode==='walk')return {state:'walk',frame:gait,combo:0,label:'Marche armée'};
  if(mode==='holster'){
   const h=holster(id),total=.7+h.stow+1+h.draw+.5;let at=t%total;
   if(at<.7)return {state:'walk',frame:gait,combo:0,label:'Marche armée'};at-=.7;
   if(at<h.stow)return {state:'sheathe_walk',frame:Math.min(5,Math.floor(at/h.stow*6))*8+gait,combo:0,label:'Rangement au centre du dos'};at-=h.stow;
   if(at<1)return {state:'sheathed_walk',frame:gait,combo:0,label:'Arme centrée dans le dos'};at-=1;
   if(at<h.draw)return {state:'draw_walk',frame:Math.min(4,Math.floor(at/h.draw*5))*8+gait,combo:0,label:'Dégainage'};
   return {state:'walk',frame:gait,combo:0,label:'Garde retrouvée'};
  }
  const lengths=[0,1,2,3].map(c=>duration(id,c)+(c===3?.25:-times(id,c)[5]));let at=t%lengths.reduce((a,b)=>a+b,0);
  for(let combo=0;combo<4;combo++){
   if(at<lengths[combo]){const len=duration(id,combo),remaining=len-at,phase=frame(remaining,id,combo);
    const drawing=at<len?sample(remaining,id,combo):5;return {state:drawing===5?'idle':'attack',frame:drawing===5?idleFrame:drawing,combo,label:(combo+1)+' · '+comboNames(id)[combo]+' · '+(at<len?['Préparation','Préparation','Impact','Impact','Après-impact','Garde'][phase]:'Garde')};
   }at-=lengths[combo];
  }
 }
 // The midpoint of the complete stored silhouette sits on the spine, not on
 // either shoulder. This same endpoint drives both holstering and drawing.
 function storedShape(b,id,h,u){
  const w=get(id);
  if(['spear','staff','glaive','axe','mace'].includes(w.family)){paint(b,id,...h,...u);return;}
  const L=Math.min(18,w.length),[x,y]=h,tx=x+u[0]*(L+2),ty=y+u[1]*(L+2);
  b.line(x,y,tx,ty,'#50342f',1);b.line(x+1,y,tx+1,ty,'#754b37',2);
  b.line(x,y,x-u[0]*4,y-u[1]*4,'#754b37',3);
  b.line(x-u[1]*2,y+u[0]*2,x+u[1]*2,y-u[0]*2,PALETTES[w.material][3],4);
 }
 const storedPoses=new Map();
 function storage(id,dir){
  const key=get(id).id+':'+dir;if(storedPoses.has(key))return storedPoses.get(key);
  const w=get(id),pointUp=['spear','staff','glaive','axe','mace'].includes(w.family);
  // Keep the midpoint on the spine. Spear/staff profiles stand vertically;
  // front/back and other arms keep the original shoulder-to-opposite-hip axis.
  const v=['spear','staff'].includes(w.family)&&(dir===1||dir===3)?[0,1]:[[-8,10],[6,9],[8,10],[-6,9]][dir],len=Math.hypot(...v),sign=pointUp?-1:1,u=v.map(n=>n===0?0:sign*n/len);
  const center=[dir===1?-3:dir===3?3:0,-10];
  let x0=Infinity,x1=-Infinity,y0=Infinity,y1=-Infinity;
  const bounds={set(x,y){x=Math.round(x);y=Math.round(y);x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);},line(x,y,X,Y){this.set(x,y);this.set(X,Y);}};
  storedShape(bounds,id,[0,0],u);
  const result=freeze({h:[center[0]-(x0+x1)/2,center[1]-(y0+y1)/2],u,center});storedPoses.set(key,result);return result;
 }
 function paintStored(b,id,dir){const s=storage(id,dir);storedShape(b,id,s.h,s.u);}


 return Object.freeze({START,all,get,loadouts,speciesOf,carriedBy,has:id=>Object.hasOwn(byId,id),families:FAMILIES,palettes:PALETTES,times,duration,frame,sample,advance,canChain,postHold,pose,vector,guard,carry,hits,paint,trail,fitGrip,handSpan,comboNames,cadence,hitPause,attackStep,holster,preview,finisherEffects,finisher:id=>get(id).finisher,storage,paintStored,spearNames:SPEAR_NAMES});
});
