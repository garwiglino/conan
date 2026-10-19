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
 function times(id,combo=0){
  const w=get(id);if(w.family==='spear')return SPEAR_TIMES[combo].map(t=>t*w.tempo);
  const row=MOTIONS[w.family].times[combo],reference={sword:1.8,sabre:1.25,dagger:.6,axe:1.9,mace:2.1,staff:1.6,glaive:2.7}[w.family];
  const inertia=Math.max(.84,Math.min(1.22,1+(w.weightKg/reference-1)*.16));
  return row.map((t,i)=>t*w.tempo*(i===1||i===4||i===5?inertia:1));
 }
 const duration=(id,combo=0)=>times(id,combo).reduce((a,b)=>a+b,0);
 function frame(remaining,id,combo=0){
  const row=times(id,combo);let t=duration(id,combo)-Math.max(0,remaining);
  for(let i=0;i<6;i++){if(t<row[i]-1e-7)return i;t-=row[i];}return 5;
 }
 // Quarter-frame samples interpolate from the previous key drawing into the
 // current one. Active-frame collision sweeps cover exactly that same motion.
 function sample(remaining,id,combo=0){
  const row=times(id,combo),steps=8;let t=duration(id,combo)-Math.max(0,remaining);
  for(let i=0;i<6;i++){if(t<row[i]-1e-7)return Math.max(0,i-1+Math.floor(t/row[i]*steps)/steps);t-=row[i];}return 5;
 }
 // The arms and hands are existing sprite layers. Choreography translates
 // those intact images to the grip; it never generates an arm or changes its shape.
 const handSpan=id=>['staff','spear','glaive'].includes(get(id).family)?3.5:2;
 const fitGrip=(id,dir,h,u)=>({h:[...h],u,span:handSpan(id)});
 const forward=dir=>[[0,-1],[1,0],[0,1],[-1,0]][dir];
 const smooth=t=>t*t*(3-2*t);
 // Each spear blow has a different transfer of weight. Columns are:
 // grip forward, lateral, height, blade angle, body forward, body height, gait.
 // These are translations of original character layers, never new limb shapes.
 const SPEAR_NAMES=freeze(['Estoc vif','Revers de hampe','Taille montante','Fente longue']);
 const SPEAR_TIMES=freeze([
  [0,.12,.045,.055,.085,.115],
  [0,.16,.05,.065,.105,.135],
  [0,.14,.045,.065,.10,.14],
  [0,.21,.05,.085,.15,.19]
 ]);
 const SPEAR_KEYS=freeze([
  [[0,0,0,-.15,0,0,0],[-3,0,1,-.20,-1,0,0],[4,0,0,-.08,1,0,0],[7,0,0,.02,2,0,0],[4,0,1,.08,1,0,1],[0,0,0,-.15,0,0,0]],
  [[0,0,0,-.15,0,0,0],[-1,1,0,1.10,-1,0,3],[2,0,0,.25,1,0,3],[3,-1,-1,-.85,2,0,4],[1,-1,-1,-1.10,1,0,5],[0,0,0,-.15,0,0,0]],
  [[0,0,0,-.15,0,0,0],[-2,1,2,.80,-1,1,6],[3,0,0,.12,1,0,6],[4,-1,-2,-.85,2,-1,7],[2,-1,-2,-1.02,1,-1,7],[0,0,0,-.15,0,0,0]],
  [[0,0,0,-.15,0,0,0],[-4,0,1,-.23,-2,1,0],[5,0,0,-.08,1,0,0],[8,0,0,0,3,1,0],[6,0,1,.07,2,1,1],[0,0,0,-.15,0,0,0]]
 ]);
 function spearKey(id,dir,f,combo){
  const w=get(id),v=SPEAR_KEYS[combo][f],[fx,fy]=forward(dir),side=[-fy,fx],mirror=dir===3?-1:1;
  const home=dir===0?[4,-8]:dir===2?[-4,-7]:dir===1?[1,-6]:[-2,-6];
  const a=v[3]*mirror,ca=Math.cos(a),sa=Math.sin(a),u=[fx*ca+side[0]*sa,fy*ca+side[1]*sa];
  const body=[Math.round(fx*v[4]),Math.round(fy*v[4]*.4+v[5])];
  const h=[home[0]+fx*v[0]+side[0]*v[1]+body[0],home[1]+fy*v[0]*.45+side[1]*v[1]+v[2]+body[1]];
  if(dir===2)h[1]=Math.min(-4,h[1]);
  const lean=f===1?-1:f===2||f===3?1:0;
  return {h,u,reach:w.length+2,body,leg:v[6],head:[body[0]+fx*lean,body[1]+(f===3?1:0)],
   hair:[-fx*(f===2||f===3?2:lean),f===1?1:0],lunge:f>=2&&f<=4,z:dir===0?0:1};
 }
 function guard(id,dir){
  const w=get(id),profile=dir===1||dir===3;
  if(w.family==='spear'){const p=spearKey(id,dir,0,0);return {h:p.h,u:p.u,reach:p.reach,profile};}
  const pole=w.family==='staff'||w.family==='glaive';
  const h=dir===0?[4,-8]:dir===2?[-7,-6]:dir===1?[1,-6]:[-2,-6];
  const u=pole?(dir===0?[.12,-.993]:dir===2?[-.12,.993]:dir===1?[.985,-.173]:[-.985,-.173]):dir===0?[.6,-.8]:dir===2?[-.65,-.76]:dir===1?[.58,-.815]:[-.58,-.815];
  return {h,u,reach:w.length+2,profile};
 }
 // Keep the entire painted weapon and its effects in the common 80px cell.
 // This adjusts the original hand-layer position; it never changes a limb.
 function confineGrip(w,h,u){
  const tip=[h[0]+u[0]*(w.length+2),h[1]+u[1]*(w.length+2)];
  return [h[0]+(tip[0]<-33?-33-tip[0]:tip[0]>33?33-tip[0]:0),h[1]+(tip[1]<-44?-44-tip[1]:tip[1]>22?22-tip[1]:0)];
 }
 function keyPose(id,dir,f,combo){
  const w=get(id);if(w.family==='spear')return spearKey(id,dir,f,combo);
  const ready=guard(id,dir);
  if(f===0||f===5)return {...ready,body:[0,0],leg:0,head:[0,0],hair:[0,0],lunge:false,z:dir===0?0:1};
  const v=MOTIONS[w.family].keys[combo][f],[fx,fy]=forward(dir),side=[-fy,fx],mirror=dir===3?-1:1;
  const two=w.hands===2,load=two?1.12:1,variation=(w.variant-1.5)*.035;
  const a=(v[3]+variation)*mirror,ca=Math.cos(a),sa=Math.sin(a),u=[fx*ca+side[0]*sa,fy*ca+side[1]*sa];
  const body=[Math.round(fx*v[4]*(two?1:.8)),Math.round(fy*v[4]*.35+v[5])];
  let h=[ready.h[0]+fx*v[0]*load+side[0]*v[1]+body[0],ready.h[1]+fy*v[0]*.4+side[1]*v[1]+v[2]+body[1]];
  if(dir===2&&f!==1)h[1]=Math.min(-3,h[1]);h=confineGrip(w,h,u);
  const lean=f===1?-1:f===2||f===3?1:0;
  return {h,u,reach:w.length+2,body,leg:v[6],head:[body[0]+fx*lean,body[1]+(f===3?1:0)],
   hair:[-fx*(f===2||f===3?2:lean),f===1?1:0],lunge:f>=2&&f<=4,z:dir===0||f===1&&v[2]<-5?0:1};
 }
 function pose(id,dir,f,combo=0){
  f=Math.max(0,Math.min(5,f));const i=Math.floor(f),fraction=f-i,w=get(id),spear=w.family==='spear';
  // Slow load, fast delivery, then an overshoot and a weighted recovery.
  const weight=Math.max(1.5,Math.min(2.8,1.6+w.weightKg*.3));
  const t=i===1?Math.pow(fraction,spear?2:weight):i===2?1-Math.pow(1-fraction,spear?3:weight+1):i===3?1-Math.pow(1-fraction,2):i===4?smooth(Math.max(0,(fraction-.2)/.8)):smooth(fraction);
  const a=keyPose(id,dir,i,combo),b=keyPose(id,dir,Math.min(5,i+1),combo);
  let angle=Math.atan2(a.u[1],a.u[0]),delta=Math.atan2(b.u[1],b.u[0])-angle;
  while(delta>Math.PI)delta-=Math.PI*2;while(delta<-Math.PI)delta+=Math.PI*2;
  angle+=delta*t;
  const lerp=(x,y)=>x+(y-x)*t;
  const u=[Math.cos(angle),Math.sin(angle)],raw=a.h.map((v,k)=>lerp(v,b.h[k])),h=spear?raw:confineGrip(w,raw,u);
  return {h,u,reach:a.reach,body:a.body?a.body.map((v,k)=>Math.round(lerp(v,b.body[k]))):[0,0],leg:fraction<.5?a.leg:b.leg,
   head:a.head.map((v,k)=>Math.round(lerp(v,b.head[k]))),hair:a.hair.map((v,k)=>Math.round(lerp(v,b.hair[k]))),lunge:a.lunge||b.lunge,z:a.z};
 }
 function vector(id,dir,f,combo){const p=pose(id,dir,f,combo);return [...p.h,p.u[0]*p.reach,p.u[1]*p.reach];}
 function segmentDistance(x,y,ax,ay,bx,by){const dx=bx-ax,dy=by-ay,l=dx*dx+dy*dy,t=l?Math.max(0,Math.min(1,((x-ax)*dx+(y-ay)*dy)/l)):0;return Math.hypot(x-ax-dx*t,y-ay-dy*t);}
 function hits(actor,target,f){
  if((f!==2&&f!==3)||(actor.level||0)!==(target.level||0))return false;
  for(let i=0;i<=20;i++){
   const p=pose(actor.weapon,actor.dir,f-1+i/20,actor.combo||0),[x,y]=p.h;
   if(segmentDistance(target.x-actor.x,target.y-actor.y-9,x-(get(actor.weapon).family==='staff'?p.u[0]*7:0),y-(get(actor.weapon).family==='staff'?p.u[1]*7:0),x+p.u[0]*p.reach,y+p.u[1]*p.reach)<(target.r||6)+(['axe','mace','sabre'].includes(get(actor.weapon).family)?3:1.5))return true;
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
 function trail(b,id,dir,f,combo){
  const w=get(id),profile=w.family==='spear'?{trailWidth:3,ghosts:0}:MOTIONS[w.family];
  if(f<1.125||f>3.5)return;
  const p=PALETTES[w.material],previous=Math.max(1,f-(w.family==='dagger'?.5:.85));
  const width=profile.trailWidth*(.85+Math.min(.35,w.weightKg*.1));
  // Dithered silhouettes record earlier WEAPON positions, without touching
 // or regenerating any character layer. Heavy heads carry a longer shadow.
  for(let n=profile.ghosts;n>0;n--){
   const q=pose(id,dir,Math.max(1,f-n*.24),combo);
   const ghost={set(x,y,color,z){if(((Math.round(x)+Math.round(y)+n)&(n===2?3:1))===0)b.set(x,y,p[0],-5+n);},
    line(x,y,X,Y,color,z){const count=Math.max(1,Math.ceil(Math.hypot(X-x,Y-y)*2));for(let i=0;i<=count;i++)this.set(x+(X-x)*i/count,y+(Y-y)*i/count,color,z);}};
   paint(ghost,id,...q.h,...q.u);
  }
  for(let i=0;i<=36;i++){
   const t=i/36,q=pose(id,dir,previous+(f-previous)*t,combo),r=q.reach;
   for(let k=0;k<width;k+=.65){
    const x=q.h[0]+q.u[0]*(r-k),y=q.h[1]+q.u[1]*(r-k);
    if(t<.4&&((Math.round(x)+Math.round(y))&1))continue;
    b.set(x,y,k<.8?p[2]:t>.5?p[3]:p[1],1);
   }
   if(w.family==='staff')b.set(q.h[0]-q.u[0]*7,q.h[1]-q.u[1]*7,p[3],0);
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
 function comboNames(id){const w=get(id);return w.family==='spear'?SPEAR_NAMES:MOTIONS[w.family].names;}
 const cadence=id=>[0,1,2,3].reduce((n,c)=>n+duration(START,c),0)/[0,1,2,3].reduce((n,c)=>n+duration(id,c),0);
 const attackStep=(id,combo=0)=>{const f=get(id).family,pairs={dagger:[2,4],sword:[3,6],sabre:[4,7],axe:[3,6],mace:[2,4],staff:[4,7],spear:[4,9],glaive:[4,8]};return pairs[f][combo===3?1:0];};
 const hitPause=(id,combo=0)=>Math.min(.105,.022+get(id).weightKg*.012+(combo===3?.018:0));
 const holster=id=>get(id).family==='spear'?{delay:3.7,stow:.33,draw:.21}:{delay:3.7,stow:Math.min(.46,Math.max(.22,.21+get(id).weightKg*.06)),draw:Math.min(.31,Math.max(.16,.15+get(id).weightKg*.045))};
 function preview(id,seconds,mode='attack'){
  const t=Math.max(0,seconds),gait=Math.floor(t*10)%8;
  if(mode==='walk')return {state:'walk',frame:gait,combo:0,label:'Marche armée'};
  if(mode==='holster'){
   const h=holster(id),total=.7+h.stow+1+h.draw+.5;let at=t%total;
   if(at<.7)return {state:'walk',frame:gait,combo:0,label:'Marche armée'};at-=.7;
   if(at<h.stow)return {state:'sheathe_walk',frame:Math.min(5,Math.floor(at/h.stow*6))*8+gait,combo:0,label:'Rangement au centre du dos'};at-=h.stow;
   if(at<1)return {state:'sheathed_walk',frame:gait,combo:0,label:'Arme centrée dans le dos'};at-=1;
   if(at<h.draw)return {state:'draw_walk',frame:Math.min(4,Math.floor(at/h.draw*5))*8+gait,combo:0,label:'Dégainage'};
   return {state:'walk',frame:gait,combo:0,label:'Garde retrouvée'};
  }
  const lengths=[0,1,2,3].map(c=>duration(id,c)+.12);let at=t%lengths.reduce((a,b)=>a+b,0);
  for(let combo=0;combo<4;combo++){
   if(at<lengths[combo]){const len=duration(id,combo),remaining=len-at,phase=frame(remaining,id,combo);
    return {state:'attack',frame:at<len?sample(remaining,id,combo):5,combo,label:(combo+1)+' · '+comboNames(id)[combo]+' · '+(at<len?['Garde','Préparation','Accélération','Impact','Suite du geste','Reprise'][phase]:'Garde')};
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
  // Same shoulder-to-opposite-hip diagonal as the original sword. The visible
  // midpoint remains on the spine; pole heads use the opposite end of that axis.
  const v=[[-8,10],[6,9],[8,10],[-6,9]][dir],len=Math.hypot(...v),sign=pointUp?-1:1,u=v.map(n=>sign*n/len);
  const center=[dir===1?-3:dir===3?3:0,-10];
  let x0=Infinity,x1=-Infinity,y0=Infinity,y1=-Infinity;
  const bounds={set(x,y){x=Math.round(x);y=Math.round(y);x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);},line(x,y,X,Y){this.set(x,y);this.set(X,Y);}};
  storedShape(bounds,id,[0,0],u);
  const result=freeze({h:[center[0]-(x0+x1)/2,center[1]-(y0+y1)/2],u,center});storedPoses.set(key,result);return result;
 }
 function paintStored(b,id,dir){const s=storage(id,dir);storedShape(b,id,s.h,s.u);}


 return Object.freeze({START,all,get,loadouts,speciesOf,carriedBy,has:id=>Object.hasOwn(byId,id),families:FAMILIES,palettes:PALETTES,times,duration,frame,sample,pose,vector,guard,hits,paint,trail,fitGrip,handSpan,comboNames,cadence,hitPause,attackStep,holster,preview,storage,paintStored,spearNames:SPEAR_NAMES});
});
