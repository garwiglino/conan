/* Hearthreaver — modular human sprite library, native pixels + authored JS.
 * 80×80, feet (40,52), binary alpha. Pure rendering, no spawning or economy.
 * Concepts for every new non-character asset are retained beside the workshop. */
(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('./rig.js'):root.HearthreaverHumanRig,typeof module==='object'&&module.exports?require('./accessoires.js'):root.HearthreaverHumanProps,typeof module==='object'&&module.exports?require('./modularite.js'):root.HearthreaverHumanModularity);if(typeof module==='object'&&module.exports)module.exports=api;else root.HearthreaverHumanActivities=api;})(globalThis,function(R,Props,M){
'use strict';
const {S,C,Pixels,decode,category,bodyTransform,round,clamp,project,INK}=R;
const ORDER=['sceneBack','groundProps','rearLegs','riderFarLeg','mountBody','rearEffects','rearProps','rearEquipment','rearArms','hairBack','headEarly','body','hairMid','hatRear','head','clothing','mountFront','riderNearLeg','frontProps','frontArms','faceHair','hairFront','hatFront','equipment','grips','effects','sceneFront'];
const ACTOR=ORDER.filter(k=>!['sceneBack','sceneFront','groundProps','mountBody','mountFront'].includes(k));
function seatedLegs(layers,o,s){
 const side=o.dir==='droite'||o.dir==='gauche',sg=o.dir==='gauche'?-1:1,t=s.seated,x=40+(s.rootX||0),y=48+(s.rootY||0);
 for(const [i,name]of ['right','left'].entries()){
  const dx=side?(i?1:-1):(i?2:-2),hip=[x+dx,y],knee=[x+dx+(side?sg*round(t*2):0),y+1],foot=[knee[0]-(side?sg:0),51+(s.rootY||0)-round(t)];
  M.leg(layers[i===0&&side?'rearLegs':'body'],o.outfit,o.dir,name,{hip,knee,foot});
 }
}
// Intersect native arm reach with the fixed-length tool's circle at the work
// surface. The tool end and both hands share this solution, not separate art.
function workGrip(shoulder,target,length,preferred,reach){
 if(!length)return null;
 const dx=target[0]-shoulder[0],dy=target[1]-shoulder[1],d=Math.hypot(dx,dy);if(!d||d>length+reach)return null;
 const effective=Math.min(length,Math.max(1,d)),a=(reach*reach-effective*effective+d*d)/(2*d),h=Math.sqrt(Math.max(0,reach*reach-a*a)),ux=dx/d,uy=dy/d;
 const result=[-1,1].map(sign=>[shoulder[0]+a*ux-sign*h*uy,shoulder[1]+a*uy+sign*h*ux]).sort((a,b)=>(Math.hypot(a[0]-preferred[0],a[1]-preferred[1])+(a[1]<shoulder[1]?12:0))-(Math.hypot(b[0]-preferred[0],b[1]-preferred[1])+(b[1]<shoulder[1]?12:0)))[0];result.gripOffset=length-effective;return result;
}
function normalize(options={}){
 const role=options.role||'farmer',r=C.ROLES[role];if(!r)throw RangeError('Fonction humaine inconnue : '+role);
 const sex=options.sex||r.sexes[0];if(!r.sexes.includes(sex))throw RangeError(r.label+' : corps '+sex+' non autorisé');
 const climate=options.climate||r.climate||'tempere';if(!C.CLIMATES[climate])throw RangeError('Climat inconnu');
 const action=options.action||(r.armed?'armed_idle':'idle');if(!C.activitiesFor(role).includes(action))throw RangeError('Activité incompatible avec '+role+' : '+action);
 const c=C.CLIPS[action],f=options.frame===undefined?R.frameAt(action,options.seconds||0,options.distance):options.frame;
 if(!Number.isInteger(f)||f<0||f>=c.frames)throw RangeError('Image hors du clip');
 const age=options.age||'adulte';if(!['adulte','mur','age'].includes(age))throw RangeError('Âge inconnu');
 const color=age==='age'?'argente':options.color||'brun';if(!C.HAIR[color])throw RangeError('Couleur inconnue');
 const hair=String(options.hair||'01').padStart(2,'0');if(!S.modules[sex+'-hair-'+hair])throw RangeError('Coiffure incompatible');
 const dir=R.direction(options.interaction?.facing??options.dir??'face'),outfit=M.compose(R.outfitFor(r,sex,climate,options.outfit),options.parts);
 let hat=options.hat===undefined?r.hat:options.hat;
 if(options.hat===undefined&&climate==='neige'&&hat==='straw')hat='felt';
 if(hat==='native')hat=outfit.hat||(climate==='aride'?'desert_wrap':climate==='neige'?'felt':climate==='marais'||climate==='jungle'?'rain':'work_cap');
 if(hat&&!(C.HEADGEAR[hat]||S.modules[hat]?.kind==='hat'||S.helmets[hat]))throw RangeError('Couvre-chef inconnu');
 const beard=sex==='masculin'?(options.beard||null):null,moustache=sex==='masculin'?(options.moustache||null):null;
 if(beard&&!/^B\d{2}$/.test(beard)||beard&&!S.modules[beard])throw RangeError('Barbe inconnue');
 if(moustache&&!/^M\d{2}$/.test(moustache)||moustache&&!S.modules[moustache])throw RangeError('Moustache inconnue');
 return {...options,role,r,sex,climate,action,c,frame:f,age,color,hair,dir,outfit,hat,beard,moustache,scene:false};
}
function nativeFrame(options={}){
 const o=normalize({...options,action:'idle',frame:0,hat:null}),d=R.directions.indexOf(o.dir),out=new Pixels();
 const module=id=>{for(const l of S.modules[id].layers)if(l.visible)out.stamp(decode(l.views[d]));};
 const hair=S.modules[o.sex+'-hair-'+o.hair],plane=pattern=>{for(const l of hair.layers)if(pattern(l.name))out.stamp(decode(l.views[d]));};
 plane(n=>/Arriere/.test(n));
 if(o.outfit.headFirst)module(o.sex+'-'+o.age);
 for(const l of o.outfit.layers)if(l.visible&&category(l.name)!=='head')out.stamp(decode(l.views[d]));
 plane(n=>/Devant tunique/.test(n));if(!o.outfit.headFirst)module(o.sex+'-'+o.age);
 plane(n=>! /Arriere|Devant tunique/.test(n));return out;
}
function drawGarmentDetails(b,o,s){
 const p=bodyTransform(s,o.dir,'body'),at=(x,y,c)=>b.set(...p(x,y),c),side=o.dir==='droite'||o.dir==='gauche',cx=side?(o.dir==='droite'?40:39):40;
 const id=o.role;
 if(['miner','quarrier','smith','charcoal_burner','glassworker','builder','shipwright','tanner'].includes(id)){
  // Reinforced apron and two belt studs, scaled to the native 4px-high torso.
  for(let y=46;y<=49;y++)for(let x=cx-2;x<=cx+1;x++)at(x,y,(x+y)%3?'5c4435':'94714f');
  at(cx-2,45,'c3a679');at(cx+1,45,'c3a679');
 }
 if(['cook','healer','herbalist','miller'].includes(id)){for(let y=46;y<=49;y++)for(let x=cx-2;x<=cx+1;x++)at(x,y,x<cx?'dfd1ae':'b6a482');at(cx-1,45,'eee3c6');}
 if(id==='beekeeper'){for(let y=45;y<=48;y++)for(let x=cx-3;x<=cx+2;x++)at(x,y,x<cx?'c9b994':'99886c');}
 if(o.r.armed){
  const colors=R.liveryColors[o.r.livery]||C.CLIMATES[o.climate].cloth;
  if(!side){for(let y=45;y<=48;y++){at(cx-1,y,colors[0]);at(cx,y,colors[1]);}at(cx+1,47,'c8b58d');}
  else{at(cx,46,colors[0]);at(cx,47,'c8b58d');}
  // Plain service strap. Deliberately no invented coat of arms.
  at(cx-3,45,'b8aa88');
 }
 if(['porter','caravaner','water_carrier','courier'].includes(id))for(let i=0;i<4;i++)at(cx-2+i,45+i,'9c7954');
 if(o.climate==='neige'&&!o.outfit.id.includes('pelisse')&&!o.outfit.id.includes('peau-ours'))for(let x=cx-4;x<=cx+3;x++)at(x,44,(x%2)?'c3bd9f':'8c8979');
 if(o.climate==='aride'&&o.r.armed){for(let x=cx-3;x<=cx+2;x++)at(x,44,'c4ac7a');}
 if(o.climate==='marais'&&['fisher','boatman','shipwright'].includes(id))for(let x=cx-3;x<=cx+2;x++)at(x,44,'718b87');
}
function riderLegs(layers,o,s,horse){
 const side=o.dir==='droite'||o.dir==='gauche',sg=o.dir==='gauche'?-1:1,x=40+(s.rootX||0),y=(side?53:o.dir==='dos'?53:49)+(s.bob||0)+(s.rootY||0)-(side?5:o.dir==='dos'?2:-3);
 const leg=(b,name,hip,knee,foot,calfOnly=false)=>M.leg(b,o.outfit,o.dir,name,{hip,knee,foot,calfOnly});
 const t=s.mounted??1,swing=(o.action==='mount'||o.action==='dismount')?Math.sin(t*Math.PI)*2:0;
 let hips,knees,feet;
 if(side){hips=[[x-1,y],[x,y]],knees=[[x+sg*2,y+2-round(swing)],[x+sg*3,y+2]],feet=[[x+sg*1,y+5-round(swing)],[x+sg*2,y+5]];
  leg(layers.riderFarLeg,o.dir==='gauche'?'right':'left',hips[0],knees[0],feet[0]);leg(layers.riderNearLeg,o.dir==='gauche'?'left':'right',hips[1],knees[1],feet[1]);
 }else{
  // The pony masks the thighs. Only a short curved knee/calf and boot show
  // on its front plane; never long horizontal legs stretched to each side.
  hips=[[x-2,y],[x+2,y]];knees=[[x-6,y+4],[x+6,y+4]];feet=[[x-7,y+6],[x+7,y+6]];
  for(let i=0;i<2;i++)leg(layers.riderNearLeg,i?'left':'right',hips[i],knees[i],feet[i],true);
 }
 // Stirrups outside the pony's flank, reins actually reach its bridle.
 for(const p of feet)layers.riderNearLeg.line(p[0]-1,p[1]+2,p[0]+2,p[1]+2,'b5b5a0');
 return {hips,knees,feet,seat:[x,y],saddle:horse.saddle};
}
function renderLayers(options={}){
 const o=normalize(options),{r,action,dir,frame,climate,outfit}=o,d=R.directions.indexOf(dir),layers=Object.fromEntries(ORDER.map(k=>[k,new Pixels()]));
 const s=R.pose(action,frame),side=dir==='droite'||dir==='gauche',back=dir==='dos',sg=dir==='gauche'?-1:1,nativeOnly=o.native===true;
 const seatAction=['sit_down','seated','stand_up'].includes(action),sleepAction=['lie_down','sleep','wake'].includes(action),boatAction=['row','pole','helm'].includes(action);
 let station=seatAction?'bench':sleepAction?'bedroll':o.c.station,ground=[40,52],shadow=true;
 if(r.mounted&&['armed_idle','armed_walk','warn','salute','order','inspect'].includes(action)){s.mounted=1;s.rootY=1;s.sit=0;}
 const riding=s.mounted!==undefined;let mount=null,rider=null,transition=1;
 if(riding){
  mount=Props.horseLayers(40,74,dir,frame,['ride','ride_trot','armed_walk'].includes(action));ground=[40,74];
  if(['mount','dismount'].includes(action)){const phase=action==='mount'?frame:o.c.frames-1-frame;transition=[0,.08,.24,.55,.88,1,1,1][phase];s.mounted=transition;}
  s.rootX=round((side?-sg*18:-17)*(1-transition));s.rootY=round(22*(1-transition)+(side?5:back?2:-3)*transition);s.bob=mount.saddle[1]-54;
  if(transition>=.55)rider=riderLegs(layers,o,s,mount);
 }
 if(o.interaction?.posture==='seated'&&!seatAction&&!sleepAction){s.seated=1;s.sit=0;s.rootY=0;}
 const bentLegs=rider||s.seated>0;
 if(s.seated)s.rootY=o.interaction?.seat?o.interaction.seat[1]-48:round(s.seated);
 if(boatAction){s.rootY=action==='row'?4:5;s.seated=action==='row'?1:0;ground=[40,62];shadow=false;}
 if(action==='drive'){const seat=project(dir,0,7,0);s.rootX=seat[0]-40;s.rootY=-1;s.seated=1;ground=Props.stationLayout('cart',dir).ground;shadow=false;}
 const contactActions=['hoe','fell','hew','mine','quarry','forge','craft','stonecut','repair_boat','joinery','deice_trough'];
 let contactTarget=contactActions.includes(action)?(o.interaction?.workTarget||Props.stationLayout(station,dir).surface):null,toolContacts={},contactWeight=[0,0,.5,1,1,.5,.15,0][frame];
 if(action==='clear_snow'&&o.interaction?.workTarget){const t=o.interaction.workTarget,dx=[-1,0,1,2,3,5,3,0][frame],dy=[0,0,0,-2,-5,-8,-4,0][frame];toolContacts.snowPath=[t[0]+(dir==='gauche'?-dx:dx),t[1]+dy];}
 const surfaceWork=o.interaction?.workTarget&&o.c.family==='work'&&!['herd','lead','carry','load','put_down','mount','ride','ride_trot','dismount','drive','row','pole','helm','board','disembark'].includes(action),surfaceTarget=o.interaction?.workTarget;
 let cargo=null;
 if(['load','put_down'].includes(action)){
  const progress=action==='load'?[0,0,0,0,.3,.6,.85,1][frame]:[1,.8,.6,.35,.15,0,0,0][frame],floor=project(dir,0,5,4),held=project(dir,0,4,7);
  cargo={point:floor.map((v,i)=>round(v+(held[i]-v)*progress)),grounded:progress===0};
  if(action==='put_down'&&frame>=5)s.sit=round(3*(7-frame)/2);
 }
 const limbModels={right:M.profile(outfit,dir,'right'),left:M.profile(outfit,dir,'left')},gripOffsets={};
 if(contactTarget){
  const model=limbModels.right,shoulder=M.shoulder(model,s,dir),length=Props.TOOL_LENGTH[o.c.props[0]],dx=contactTarget[0]-shoulder[0],dy=contactTarget[1]-shoulder[1],distance=Math.hypot(dx,dy),excess=distance-length-model.reach;
  if(excess>0){const amount=Math.min(2,excess+1)*contactWeight;s.reachShift=[dx/distance*amount,dy/distance*amount];}
  if(!o.interaction){const at=M.shoulder(model,s,dir),dx=contactTarget[0]-at[0],dy=contactTarget[1]-at[1],distance=Math.hypot(dx,dy),limit=length+model.reach-.5;if(distance>limit)contactTarget=[at[0]+dx/distance*limit,at[1]+dy/distance*limit];}
 }
 const headTransform=bodyTransform(s,dir,'head');
 const hat=R.headgear(nativeOnly?null:o.hat,dir,s,{...r,climate});
 const module=(id,target,filter=()=>true,color=c=>c)=>{for(const l of S.modules[id].layers)if(filter(l))layers[target].stamp(decode(l.views[d]),headTransform,color);};
 const hairColor=c=>R.recolorHair(c,o.color),hairId=o.sex+'-hair-'+o.hair;
 for(const l of S.modules[hairId].layers){const target=/Arriere/.test(l.name)?'hairBack':/Devant tunique/.test(l.name)?'hairMid':'hairFront';const points=decode(l.views[d]);for(const [x,y,c]of points){const [X,Y]=headTransform(x,y);if(!hat.mask.map.has(Y*80+X))layers[target].set(X,Y,hairColor(c));}}
 module(o.sex+'-'+o.age,outfit.headFirst?'headEarly':'head');
 if(o.beard)module(o.beard,'faceHair',()=>true,hairColor);
 if(o.moustache)module(o.moustache,'faceHair',()=>true,hairColor);
 layers.hatRear.stamp(hat.rear.values());layers.hatFront.stamp(hat.front.values());
 const articulated=!nativeOnly&&(!['idle','walk','flee','death','armed_death','sleep','lie_down','wake'].includes(action)||riding);
 const cloth=R.materials(outfit).cloth,target=!options.outfit&&!options.parts&&o.r.livery?R.liveryColors[o.r.livery]:null;
 for(const l of outfit.layers){
  if(!l.visible||category(l.name)==='head')continue;
  const kind=category(l.name);if(kind==='arms'&&articulated||(bentLegs||s.seated>0)&&['feet','legs'].includes(kind))continue;
  const t=bodyTransform(s,dir,kind),dest=kind==='arms'&&!nativeOnly?'frontArms':'body';
  const replace=c=>{if(!nativeOnly&&target&&/^HABIT 12|HABIT 14/.test(l.name)&&cloth.includes(c))return target[Math.min(2,cloth.indexOf(c))];return c;};
  const originalPoints=decode(l.views[d]),points=originalPoints.filter(p=>!bentLegs||p[1]<48);
  if(bentLegs&&kind==='body')layers[dest].stamp(M.lowerPanel(originalPoints.filter(p=>p[1]>=48),dir,s,rider),undefined,replace);
  if(!nativeOnly&&side&&(s.step||s.lift)&&['feet','legs'].includes(kind)){
   const far=bodyTransform({...s,step:-s.step,lift:-s.lift},dir,kind);
   layers.rearLegs.stamp(points,far,replace);
  }
  layers[dest].stamp(points,t,replace);
 }
 if(!nativeOnly&&s.seated>0)seatedLegs(layers,o,s);
 if(!nativeOnly&&!options.outfit&&!options.parts)drawGarmentDetails(layers.clothing,o,s);
 const hands={},elbows={},armDepth={};
 if(articulated){
  for(const name of ['right','left']){
   const model=limbModels[name],shoulder=M.shoulder(model,s,dir),legacy=project(dir,name==='right'?-5:5,0,8),wanted=project(dir,...s[name]),ratio=model.reach/6.5,hand=[shoulder[0]+(wanted[0]-legacy[0])*ratio,shoulder[1]+(wanted[1]-legacy[1])*ratio];
   if(contactTarget&&name==='right'){
    const length=Props.TOOL_LENGTH[o.c.props[0]],grip=workGrip(shoulder,contactTarget,length,hand,model.reach),weight=contactWeight;
    if(grip){for(let i=0;i<2;i++)hand[i]+=(grip[i]-hand[i])*weight;if(weight){toolContacts.right=contactTarget;gripOffsets.right=grip.gripOffset;}}
   }
   if(contactTarget&&name==='left'&&hands.right&&['hoe','fell','hew','mine','quarry'].includes(action)){
    const dx=contactTarget[0]-hands.right[0],dy=contactTarget[1]-hands.right[1],n=Math.hypot(dx,dy)||1;
    const target=[hands.right[0]+dx/n*3,hands.right[1]+dy/n*3];for(let i=0;i<2;i++)hand[i]+=(target[i]-hand[i])*contactWeight;
   }
   if(action==='clear_snow'&&toolContacts.snowPath&&name==='right'){const grip=workGrip(shoulder,toolContacts.snowPath,11,hand,model.reach);if(grip){hand[0]=grip[0];hand[1]=grip[1];toolContacts.right=toolContacts.snowPath;gripOffsets.right=grip.gripOffset;}}
   if(surfaceWork&&!['clear_snow','stoke_fire','warm_hands'].includes(action)&&!contactActions.includes(action)){
    const prop=o.c.props?.[name==='right'?0:1],length=Props.TOOL_LENGTH[prop];
    if(length){const grip=workGrip(shoulder,surfaceTarget,length,hand,model.reach);if(grip){hand[0]=grip[0];hand[1]=grip[1];toolContacts[name]=surfaceTarget;gripOffsets[name]=grip.gripOffset;}}
    else{
     // Materials and fingers stay at the bench instead of following the old
     // hard-coded prop height. Preserve a restrained 1 px working movement.
     const lateral=name==='right'?-2:2,cycle=[0,1,1,0,0,-1,-1,0][frame%8];hand[0]=surfaceTarget[0]+(side?cycle:lateral+cycle);hand[1]=surfaceTarget[1]+(side?(name==='right'?-1:1):0);
    }
   }
   if(cargo&&!(action==='put_down'&&frame>=6)){hand[0]=cargo.point[0]+(name==='right'?-1:1)*(side?1:3);hand[1]=cargo.point[1]-1;}
   const behind=back||(dir==='droite'&&name==='left')||(dir==='gauche'&&name==='right'),plane=behind?'rearArms':'frontArms';armDepth[name]=behind?'rear':'front';
   const fingers=behind?layers.rearArms:layers.grips,arm=M.arm(layers[plane],fingers,model,shoulder,hand);hands[name]=arm.hand;elbows[name]=arm.elbow;
  }
 }else for(const name of ['right','left']){hands[name]=project(dir,...s[name]);hands[name][1]+=s.rootY||0;armDepth[name]=back?'rear':'front';}
 if(!nativeOnly){
  // Furniture, patients, terrain, animals and vehicles are composed outside
  // the actor renderer. Reins and all held props remain actor-owned.
  if(riding){const bridle=o.interaction?.bridle||mount.bridle;layers.frontProps.line(...hands.left,...bridle,'5b3d2e');if(!R.C.ATTACKS.has(action))layers.frontProps.line(...hands.right,...bridle,'9c7a4b');}
  if(action==='lead'&&o.interaction?.bridle)layers.frontProps.line(...hands.right,...o.interaction.bridle,'9c7a4b');
  // Work objects in a back view are obscured by the original body and hair.
  const propLayer=back?'rearProps':'frontProps',toolLayer=armDepth.right==='rear'?'rearEquipment':'equipment',leftLayer=armDepth.left==='rear'?'rearEquipment':'equipment';
  if(o.c.props?.length){
   const props=[...o.c.props];
   let h=hands.right;
   if(['carry','load','put_down'].includes(action)){
    h=[round((hands.right[0]+hands.left[0])/2),round((hands.right[1]+hands.left[1])/2)+1];
    const grounded=cargo?.grounded||false;
    if(cargo)h=cargo.point;
    Props.icon(layers[grounded?'groundProps':propLayer],o.cargo||'crate',...h,frame);
   }
   else props.forEach((id,i)=>{
    if(action==='stoke_fire'&&frame>=5)return;
    if(id==='reins'&&(riding||action==='lead'))return;
    const small=['seed_bag','basket','sheaf','cloth','hide','bandage','crate','net','fiber','hay','ore','pan','sieve','pot','jar','bucket','jug','grain_bag','flour_bag','parcel','scroll','coins','ledger','clay','herbs','honeycomb','crucible','salt'].includes(id),dest=small?propLayer:i===0?toolLayer:leftLayer;
    const hand=i===0?hands.right:hands.left;
    const target=i===0?toolContacts.right:toolContacts.left,weight=contactActions.includes(action)?contactWeight:1;
    const tip=Props.tool(layers[dest],id,hand,dir,action,frame,target?{point:target,weight,gripOffset:(gripOffsets[i===0?'right':'left']||0)*weight}:null);if(i===0&&tip)toolContacts.tip=tip;
   });
  }
  if(action==='eat')Props.icon(layers[propLayer],'bowl',...hands.left,frame);
  if(action==='drink')Props.icon(layers[propLayer],'cup',...hands.right,frame);
  if(action==='inspect')Props.icon(layers[propLayer],'scroll',...hands.left,frame);
  if(r.weapon){
   const unarmed=['surrender','disarm'].includes(action),dropped=unarmed&&frame>=(action==='surrender'?1:4),dead=['death','armed_death'].includes(action);
   if(dropped){if(frame<o.c.frames)Props.weapon(layers.groundProps,r.weapon,[side?43:38,52],dir,'dropped',0);}
   else if(['sheathe','draw'].includes(action)){
    if(action==='sheathe'&&frame>=5||action==='draw'&&frame<3){const b=back?layers.equipment:layers.rearEquipment;b.line(35,44,43,52,'4b332b',3);b.line(35,44,43,52,'9a7453');}
    else Props.weapon(layers[toolLayer],r.weapon,hands.right,dir,action,frame);
   }else if(o.c.family==='combat'||['idle','walk','hit','death'].includes(action))Props.weapon(layers[toolLayer],r.weapon,hands.right,dir,action,frame);
   if(r.shield&&!dropped&&(o.c.family==='combat'||['idle','walk','hit','death'].includes(action))){Props.shield(layers[leftLayer],hands.left,dir,r);if(armDepth.left==='front'){// The outer shield must conceal its own grip.
    for(const [k]of layers.grips.map){const x=k%80,y=Math.floor(k/80);if(Math.abs(x-hands.left[0])<3&&Math.abs(y-hands.left[1])<3)layers.grips.map.delete(k);}
   }}
   if(C.ATTACKS.has(action)&&[3,4].includes(frame)&&!['bow_shot','crossbow_shot','javelin_throw'].includes(action)){
    const b=armDepth.right==='rear'?layers.rearEffects:layers.effects,[x,y]=hands.right,sg=dir==='gauche'?-1:1;
    for(let i=0;i<7;i++){const a=(i/6-.5)*1.4,xx=x+round(Math.cos(a)*11*sg),yy=y+round(Math.sin(a)*7);b.set(xx,yy,'d0c59f');if(i>2)b.set(xx-sg,yy,'988b72');}
   }
   if(['bow_shot','crossbow_shot','javelin_throw'].includes(action)&&frame>=3&&frame<=5){const [x,y]=hands.right,sg=dir==='gauche'?-1:1,b=armDepth.right==='rear'?layers.rearEffects:layers.effects,dist=8+(frame-3)*6;b.line(x+sg*dist,y,x+sg*(dist+6),y,'b7bcb3');b.set(x+sg*(dist+6),y-1,'d5d7c1');}
   if(action==='block'&&frame===1){const [x,y]=hands.left;layers.effects.line(x-4,y,x+4,y,'d7d5ac');layers.effects.line(x,y-4,x,y+4,'d7d5ac');}
   if(dead){/* The complete character, including equipment, falls below. */}
  }
  if(contactTarget&&frame===3){const b=back?layers.rearEffects:layers.effects,h=contactTarget;b.set(h[0]+2,h[1]-2,Props.P.edge);b.set(h[0]-2,h[1]-1,Props.P.steel);}
 }
 // In a chibi work pose the large head can occlude a tool behind it.
 // Keep the native face readable; intentional mouth contact remains visible.
 if(o.c.family==='work'&&action!=='glass_blow'){
  const headPixels=new Set(['head','headEarly','hairBack','hairFront','hatFront'].flatMap(k=>layers[k].values().map(p=>p[1]*80+p[0])));
  for(const key of ['equipment','rearEquipment'])for(const k of headPixels)layers[key].map.delete(k);
 }
 // Rotate the actor and held equipment together. Scene furniture stays put.
 let actorOffset=[0,0];
 if(s.angle){const a=s.angle*Math.PI/180,ca=Math.cos(a),sa=Math.sin(a),sign=sleepAction?-1:dir==='gauche'?-1:1;for(const key of ACTOR){const old=layers[key],next=new Pixels();
   // Rotate the full native extent, including tall helmet crests. A fixed
   // crop silently removed their outer pixels in sleeping/left fall views.
   const points=old.values();if(points.length){
    const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]),left=Math.min(...xs)-.5,right=Math.max(...xs)+.5,top=Math.min(...ys)-.5,bottom=Math.max(...ys)+.5;
    const corners=[[left,top],[right,top],[left,bottom],[right,bottom]].map(([x,y])=>[40+(x-40)*ca-(y-51)*sa*sign,51+(x-40)*sa*sign+(y-51)*ca]);
    const x0=Math.max(0,Math.floor(Math.min(...corners.map(p=>p[0])))),x1=Math.min(79,Math.ceil(Math.max(...corners.map(p=>p[0])))),y0=Math.max(0,Math.floor(Math.min(...corners.map(p=>p[1])))),y1=Math.min(79,Math.ceil(Math.max(...corners.map(p=>p[1]))));
    for(let Y=y0;Y<=y1;Y++)for(let X=x0;X<=x1;X++){const dx=X-40,dy=Y-51,x=round(40+dx*ca+dy*sa*sign),y=round(51-dx*sa*sign+dy*ca),pixel=old.map.get(y*80+x);if(pixel)next.set(X,Y,pixel[2]);}
   }
   layers[key]=next;
  }
  const anatomy=['body','head','headEarly','hairBack','hairMid','hairFront','frontArms','rearArms'].flatMap(k=>layers[k].values()),xs=anatomy.map(p=>p[0]),ys=anatomy.map(p=>p[1]),bottom=Math.max(...ys),blend=Math.sin(a),bed=o.interaction?.bed?[o.interaction.bed[0],o.interaction.bed[1]+2]:Props.stationLayout('bedroll',dir).origin;
  actorOffset=[sleepAction?round((bed[0]-(Math.min(...xs)+Math.max(...xs))/2)*blend):0,(sleepAction?round(51+(bed[1]-2-51)*blend):51)-bottom];
  for(const key of ACTOR){const old=layers[key];layers[key]=new Pixels();layers[key].stamp(old.values(),(x,y)=>[x+actorOffset[0],y+actorOffset[1]]);}
  for(const name of ['right','left']){for(const points of [hands,elbows])if(points[name]){const [x,y]=points[name],dx=x-40,dy=y-51;points[name]=[round(40+dx*ca-dy*sa*sign)+actorOffset[0],round(51+dx*sa*sign+dy*ca)+actorOffset[1]];}}
  if(sleepAction)shadow=false;
 }
 const clipped=Object.values(layers).reduce((n,b)=>n+b.clipped,0);
 return {order:ORDER,layers:Object.fromEntries(ORDER.map(k=>[k,layers[k].values()])),metadata:{actorOnly:true,socket:o.interaction?.socket||null,role:o.role,sex:o.sex,climate,action,frame,dir,body:outfit.id,parts:outfit.parts||null,limbSource:'native_garment_pixels',hat:o.hat,hands,elbows,armDepth,rider,toolContacts,cargo,support:{kind:riding?'saddle':sleepAction?'bedroll':boatAction?'boat':action==='drive'?'cart':seatAction?'bench':'ground',ground,shadow,actorOffset,transition},clippedPixels:clipped,contactFrames:o.c.markers,station:station||null,navigationRequired:!!o.c.navigationRequired,scope:'visual_assets'}};
}
function raster(options={}){const result=renderLayers(options),data=new Uint8ClampedArray(80*80*4);for(const name of result.order)for(const [x,y,color]of result.layers[name]){const n=parseInt(color,16),i=(y*80+x)*4;data[i]=n>>16;data[i+1]=n>>8&255;data[i+2]=n&255;data[i+3]=255;}return {width:80,height:80,data,metadata:result.metadata};}
function draw(context,options={}){const r=raster(options),ox=options.x||0,oy=options.y||0;const image=context.createImageData(80,80);image.data.set(r.data);context.putImageData(image,ox,oy);return r.metadata;}
return Object.freeze({VERSION:C.VERSION,Catalogue:C,Sources:S,Props,Modularity:M,CLIPS:C.CLIPS,ROLES:C.ROLES,CLIMATES:C.CLIMATES,HEADGEAR:C.HEADGEAR,HAIR:C.HAIR,directions:R.directions,ORDER,normalize,nativeFrame,renderLayers,raster,draw,activitiesFor:C.activitiesFor,frameAt:R.frameAt,eventsBetween:R.eventsBetween,isAttack:id=>C.ATTACKS.has(id)});
});
