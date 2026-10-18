// Combat, tenues et raccord du tronc : Codex / ChatGPT, 2026-10-18. Voir docs/CODEX-BATRACIENS-HANDOFF.md.
(function(root,factory){'use strict';if(typeof module==='object'&&module.exports)module.exports=factory(require('./batraciens-complet.js'));else root.HearthreaverBatraciensCombattants=factory(root.HearthreaverBatraciens);})(typeof globalThis!=='undefined'?globalThis:this,function(API){'use strict';
 if(!API) throw new Error('HearthreaverBatraciens requis.');
 const VERSION='2.3.0';
 const ANCHOR=API.ANCHOR, NATIVE_ANCHOR=API.NATIVE_ANCHOR, DIR=API.DIR, DIRECTIONS=API.DIRECTIONS, SHEET_DIRECTIONS=API.SHEET_DIRECTIONS;
 const MALE=API.Male;
 const freeze=o=>{if(o&&typeof o==='object'&&!Object.isFrozen(o)){Object.values(o).forEach(freeze);Object.freeze(o);}return o;};
 const ROLE_GROUPS=freeze({
   village_guard:{label:'Garde de communauté',weapon:'spear',offhand:'shield',accent:'guard',banner:false},
   channel_sentinel:{label:'Sentinelle des voies d’eau',weapon:'spear',offhand:'shield',accent:'water',banner:false},
   boat_escort:{label:'Escorte de bateliers',weapon:'sword',offhand:'shield',accent:'escort',banner:false},
   scout:{label:'Éclaireur',weapon:'javelin',offhand:null,accent:'scout',bundle:true,banner:false},
   raider:{label:'Pillard de chenal',weapon:'club',offhand:null,accent:'raider',banner:false},
   captain:{label:'Chef de patrouille',weapon:'spear',offhand:'shield',accent:'captain',banner:true}
 });
 const LEGACY_CLIPS=freeze({
   idle:{label:'Repos armé',group:'commun',frames:8,durations:[1300,220,380,320,650,100,130,1200],loop:true,stride:null,duration:4300,terminal:false,base:'idle'},
   walk:{label:'Marche armée',group:'commun',frames:8,durations:[63,62,63,62,63,62,63,62],loop:true,stride:18,duration:500,terminal:false,base:'walk'},
   patrol:{label:'Patrouille',group:'commun',frames:8,durations:[63,62,63,62,63,62,63,62],loop:true,stride:18,duration:500,terminal:false,base:'walk'},
   alert:{label:'Alerte',group:'combat',frames:8,durations:[100,100,100,100,100,100,100,100],loop:false,stride:null,duration:800,terminal:true,base:'startle'},
   challenge:{label:'Sommer / menacer',group:'combat',frames:8,durations:[120,120,120,120,120,120,120,120],loop:true,stride:null,duration:960,terminal:false,base:'talk'},
   guard:{label:'Garde haute',group:'combat',frames:8,durations:[140,140,140,140,140,140,140,140],loop:true,stride:null,duration:1120,terminal:false,base:'idle'},
   block:{label:'Parade / blocage',group:'combat',frames:8,durations:[120,120,120,120,120,120,120,120],loop:true,stride:null,duration:960,terminal:false,base:'cower'},
   thrust:{label:'Estoc / coup de lance',group:'combat',frames:8,durations:[90,90,90,90,90,90,90,90],loop:false,stride:null,duration:720,terminal:true,base:'fish_spear'},
   slash:{label:'Taille / frappe courte',group:'combat',frames:8,durations:[90,90,90,90,90,90,90,90],loop:false,stride:null,duration:720,terminal:true,base:'harvest'},
   throw_javelin:{label:'Lancer de javelot',group:'combat',frames:8,durations:[90,90,90,90,90,90,90,90],loop:false,stride:null,duration:720,terminal:true,base:'fish_cast'},
   flee:{label:'Fuite armée',group:'combat',frames:8,durations:[80,80,80,80,80,80,80,80],loop:true,stride:18,duration:640,terminal:false,base:'flee'},
   hit:{label:'Réception d’un coup',group:'combat',frames:8,durations:[100,100,100,100,100,100,100,100],loop:false,stride:null,duration:800,terminal:true,base:'hit'},
   death:{label:'Mort',group:'combat',frames:8,durations:[120,120,120,120,120,120,120,120],loop:false,stride:null,duration:960,terminal:true,base:'death'},
   surrender:{label:'Se rendre',group:'combat',frames:8,durations:[120,120,120,120,120,120,120,120],loop:true,stride:null,duration:960,terminal:false,base:'startle'},
   rally:{label:'Rallier / donner un ordre',group:'combat',frames:8,durations:[120,120,120,120,120,120,120,120],loop:true,stride:null,duration:960,terminal:false,base:'talk'}
 });
 // Combat v2: native-pixel posing, attached hands, weapon arcs and brief opaque smears.
 const ATTACKS=freeze({village_guard:['thrust','sweep'],channel_sentinel:['thrust','overhead'],boat_escort:['slash','backslash'],scout:['throw_javelin','jab'],raider:['slash','crush'],captain:['thrust','sweep','overhead']});
 const meleeDurations=[90,75,65,70,60,35,35,40,50,60,65,75];
 function attackClip(label,durations=meleeDurations,contact=.36){return {label,group:'combat',frames:12,durations,loop:false,stride:null,duration:durations.reduce((a,b)=>a+b,0),terminal:true,contact,activeFrames:[5,6],base:'idle'};}
 const CLIPS=freeze({...LEGACY_CLIPS,
  thrust:attackClip('Estoc de lance'),sweep:attackClip('Balayage de hampe'),overhead:attackClip('Frappe plongeante'),
  slash:attackClip('Taille croisée'),backslash:attackClip('Revers court'),crush:attackClip('Coup de massue abattu'),jab:attackClip('Estoc court au javelot'),
  throw_javelin:attackClip('Lancer de javelot',[130,120,110,100,80,35,35,45,60,70,80,95],.54),
  guard:{...LEGACY_CLIPS.guard,base:'idle'},guard_walk:{...LEGACY_CLIPS.walk,label:'Déplacement en garde',base:'walk'},block:{...LEGACY_CLIPS.block,frames:6,durations:[35,45,55,65,65,75],duration:340,loop:false,terminal:true,base:'idle'}
 });
 function isAttack(a){return !!CLIPS[a]?.activeFrames;}
 const KEYS={
  thrust:[[4,6,10,2,7,17],[2,1,11,1,3,18],[0,-3,11,0,-1,19],[-1,-5,11,0,-3,20],[1,-1,11,0,4,23],[5,9,11,0,27,12],[5,11,11,0,29,12],[4,10,11,0,27,12],[3,7,11,0,21,13],[2,5,10,0,15,16],[1,5,10,1,11,17],[4,6,10,2,7,17]],
  slash:[[4,5,10,3,7,20],[3,3,12,-3,2,22],[1,0,14,-9,-3,24],[0,-1,15,-13,-5,25],[1,1,14,-13,-4,23],[5,7,11,15,15,8],[6,9,10,18,16,4],[6,9,10,17,15,4],[5,8,10,13,13,9],[4,6,10,8,10,14],[4,5,10,4,8,18],[4,5,10,3,7,20]],
  backslash:[[4,5,10,3,7,20],[5,7,10,9,12,8],[6,8,10,14,13,5],[6,9,10,16,14,5],[5,8,11,17,13,9],[-2,3,13,-16,-1,20],[-3,2,13,-18,-4,20],[-3,1,13,-16,-4,20],[-1,2,12,-12,1,21],[1,3,11,-6,3,22],[3,4,10,0,5,21],[4,5,10,3,7,20]],
  crush:[[4,5,10,3,7,20],[3,2,13,2,3,25],[2,0,15,1,-2,28],[2,-1,17,0,-4,31],[2,0,17,0,-3,31],[3,10,9,1,18,3],[3,12,7,1,21,1],[3,12,7,1,21,1],[3,11,8,2,18,5],[4,8,9,3,13,10],[4,6,10,3,9,16],[4,5,10,3,7,20]],
  throw_javelin:[[4,5,11,3,7,24],[4,1,13,4,1,27],[4,-4,15,3,-7,29],[3,-7,15,3,-11,29],[3,-8,15,3,-12,28],[4,9,13,3,26,15],[4,12,12,3,29,12],[4,11,11,3,28,11],[4,9,10,3,24,10],[4,7,10,3,17,14],[4,6,10,3,11,19],[4,5,11,3,7,24]]
 };
 function projection(view,l,d,h){if(view==='face')return [40+Math.round(l),52+Math.round(d*.5-h)];if(view==='dos')return [40-Math.round(l),52+Math.round(-d*.5-h)];if(view==='droite')return [40+Math.round(d),52+Math.round(l*.4-h)];return [40-Math.round(d),52+Math.round(-l*.4-h)];}
 function combatPose(role,action,view,frame){
  roleName(role);clipName(action);view=directionName(view);integer(frame,'frame');if(frame<0||frame>=CLIPS[action].frames)throw new RangeError('frame hors limite');
  const guard=['guard','guard_walk','block'].includes(action),walking=['walk','patrol','flee','guard_walk'].includes(action),rest=action==='idle'||walking&&!guard,f=guard?Math.min(frame,5):frame;
  let key=KEYS[action]||KEYS.thrust;
  if(action==='sweep')key=KEYS.slash;if(action==='overhead')key=KEYS.crush;if(action==='jab')key=KEYS.thrust;
  let k=key[f];if(guard)k=[4,3,11,4,6,26];if(rest){const w=ROLE_GROUPS[role].weapon;k=w==='sword'?[4,5,9,4,15,4]:w==='club'?[4,5,9,4,10,19]:[4,5,9,4,7,28];}
  // A spear sweep keeps its full shaft, unlike a short blade's compact arc.
  let [l,d,h,tl,td,th]=k;if(action==='sweep'){tl=Math.round(tl*1.45);td=Math.round(td*1.2);}
  if(action==='overhead')th+=4;if(action==='jab'){td=Math.round(td*.7);th=Math.round(th*.85);}
  const lean=guard||rest?0:[0,-1,-1,-1,-1,2,2,2,1,1,0,0][f],down=rest?0:guard?(action==='block'?[0,1,1,1,0,0][f]:0):[0,0,0,0,0,1,2,2,1,0,0,0][f];
  const hand=projection(view,l,d,h),tip=projection(view,tl,td,th);
  if(rest&&ROLE_GROUPS[role].weapon==='sword'){tip[0]=hand[0]+(view==='gauche'?-10:view==='droite'?10:view==='face'?9:-9);tip[1]=hand[1]+(view==='face'?8:view==='dos'?6:5);}
  const left=guard?projection(view,-4,8+(action==='block'?[0,-2,-2,-1,0,0][f]:0),12-down):projection(view,-4,3+Math.max(0,lean),10-down);
  if(rest)left[1]=46;
  const shift=view==='droite'?[lean,down]:view==='gauche'?[-lean,down]:[0,down+(view==='face'?Math.round(lean*.5):-Math.round(lean*.5))];
  if(walking){const dy=[0,1,1,0,0,1,1,0][frame];shift[1]+=dy;hand[1]+=dy;tip[1]+=dy;left[1]+=dy;}
  return {hand,tip,left,shift,frame,view,phase:rest?(walking?'marche armée':'repos armé'):guard?(action==='block'?'impact':'garde'):f<5?'anticipation':f<7?'frappe':'retour',active:!rest&&!guard&&f>=5&&f<=6,release:action==='throw_javelin'&&f>=5};
 }
 // Local materials: waxed cloth, reed/cured-leather guards, reused iron and limited bronze.
 // Equipment denotes occupation, never an innate faction or an enemy skin pigment.
 const OUTFITS=freeze({
  village_guard:{label:'Garde · cuir tressé et lin écru',fabric:['#50342f','#754b37','#a16a44','#cf955f'],trim:'#dfc889',metal:'#b9a16b',style:'woven'},
  channel_sentinel:{label:'Sentinelle · surcot de toile cirée et épaules renforcées',fabric:['#233b3d','#36575b','#547778','#88a3a0'],trim:'#b9a16b',metal:'#708b91',style:'lamellar'},
  boat_escort:{label:'Épéiste · gilet de cuir et écharpe de lin',fabric:['#30262a','#50342f','#754b37','#a16a44'],trim:'#dfc889',metal:'#c3ced1',style:'vest'},
  scout:{label:'Éclaireur · mantelet court et brassard de cuir',fabric:['#273a30','#40513a','#647149','#969766'],trim:'#b9a16b',metal:'#795445',style:'mantle'},
  raider:{label:'Pillard · cuir rapiécé et ceinture de corde',fabric:['#382c2c','#604038','#87513e','#b47759'],trim:'#a18d66',metal:'#708b91',style:'patched'},
  captain:{label:'Chef · brigandine de cuir, bronze et étoffe garance',fabric:['#412a2d','#683b3c','#96554a','#c18263'],trim:'#d3b374',metal:'#b9a16b',style:'brigandine'}
 });
 const HEADGEAR=freeze({village_guard:'bandeau de cuir',channel_sentinel:'calotte de bronze ouverte',boat_escort:'calotte de fer ouverte',scout:'capuchon court',raider:'tête nue',captain:'casque de bronze ouvert à crête courte'});
 function headgear(image,role,view,action,frame,palette,enabled=true){if(!enabled||role==='raider')return;
  const rows=MALE.SOURCE_VIEWS[view],side=view==='droite'||view==='gauche',x0=40-Math.floor(rows[0].length/2),y0=52-rows.length+1;
  let dx=0,dy=0;if(isAttack(action)||['idle','walk','patrol','flee','guard','guard_walk','block'].includes(action)){const p=combatPose(role,action,view,frame);dx=p.shift[0];dy=p.shift[1];if(isAttack(action)&&frame>=2&&frame<=4)dy--;if(action==='idle')dy=MALE.POSES?MALE.POSES.idle[frame].head:([0,-1,-1,-1,0,0,0,0][frame]);}
  if(['walk','patrol','flee','guard_walk'].includes(action))dy=[0,0,1,0,0,0,1,0][frame];
  const sourceAction=LEGACY_CLIPS[action]?.base,sourceFrames=API.CLIPS[sourceAction]?.frames;
  const sourceFrame=sourceFrames?Math.round(frame*(sourceFrames-1)/(CLIPS[action].frames-1)):frame;
  if(sourceAction==='startle')dy=[0,-1,-2,-1,0,0][sourceFrame];
  if(sourceAction==='talk')dy=[0,0,-1,-1,0,0,0,0][sourceFrame];
  if(action==='hit'){dx=[0,-1,-2,-1,0,0][sourceFrame]*(view==='gauche'?-1:1);dy=[0,0,1,1,0,0][sourceFrame];}
  if(action==='death'){const f=sourceFrame;dy=f<6?[0,0,1,2,3,3][f]:f===6?9:10;dx=f<6?(view==='gauche'?-1:1)*Math.min(f,2):(view==='gauche'?-6:6);}
  const o=OUTFITS[role],dark=role==='boat_escort'?COLOR.metal0:rgba(o.fabric[0]),mid=role==='boat_escort'?COLOR.metal1:role==='scout'?rgba(o.fabric[1]):rgba(o.metal),light=role==='boat_escort'?COLOR.metal2:rgba(o.trim);
  // Leave the protruding eyes and mouth exposed: cap bridge and rear skull only.
  const put=(x,y,c)=>{if(['a','e','y','i'].includes(rows[y]?.[x]))return;set(image,x0+x+dx,y0+y+dy,c);};
  if(!side){for(let x=6;x<=12;x++){put(x,1,COLOR.outline);put(x,2,x<9?light:mid);put(x,3,dark);}if(role==='scout'){for(const x of [1,17]){put(x,6,dark);put(x,7,mid);put(x,8,dark);}}}
  else{const back=view==='droite'?3:12;for(let j=0;j<4;j++){put(back,j+3,j===0?light:mid);put(back+(view==='droite'?1:-1),j+3,dark);}for(let x=5;x<=8;x++){put(x,1,COLOR.outline);put(x,2,x<7?light:mid);}if(role==='scout')put(back,7,dark);}
  if(['channel_sentinel','boat_escort','captain','scout'].includes(role)){if(side){const back=view==='droite'?3:12,sign=view==='droite'?1:-1;for(let y=3;y<=7;y++)for(let j=0;j<3;j++)put(back+sign*j,y,j===0?dark:j===1?mid:light);}else if(view==='dos'){for(let y=3;y<=6;y++)for(let x=5;x<=13;x++)put(x,y,x===5||x===13?dark:(x+y)%4===0?light:mid);}}
  if(role==='captain'){for(let y=-1;y<=1;y++){put(side?7:9,y,y===-1?COLOR.outline:rgba('#96554a'));}put(side?6:8,0,rgba('#c18263'));}
 }

 function rgba(hex){return [parseInt(hex.slice(1,3),16),parseInt(hex.slice(3,5),16),parseInt(hex.slice(5,7),16),255];}
 function dress(image,role,view,action,frame,shift=[0,0],enabled=true){if(!enabled)return;
  const o=OUTFITS[role],rows=MALE.SOURCE_VIEWS[view],side=view==='droite'||view==='gauche',x0=40-Math.floor(rows[0].length/2)+shift[0],y0=52-rows.length+1+shift[1];
  const colors=o.fabric.map(rgba),trim=rgba(o.trim),metal=rgba(o.metal),outline=COLOR.outline;
  const leather=new Map(['u','v','w','t','r'].map((k,i)=>[MALE.PALETTE[k],colors[Math.min(i,3)]]));
  const prone=action==='death'&&frame>=4,top=prone?45:y0+9,bottom=prone?51:y0+18;
  for(let y=top;y<=bottom;y++)for(let x=24;x<=56;x++){const i=(y*80+x)*4;if(!image.data[i+3])continue;const hex='#'+[image.data[i],image.data[i+1],image.data[i+2]].map(v=>v.toString(16).padStart(2,'0')).join('');if(leather.has(hex))image.data.set(leather.get(hex),i);}
  // Decorations stamp only existing cloth/body pixels; silhouettes and hands remain authored.
  const put=(x,y,c)=>{x=Math.round(x);y=Math.round(y);if(x<0||y<0||x>=80||y>=80)return;const i=(y*80+x)*4;if(image.data[i+3])set(image,x,y,c);};
  const patch=(x,y,w,h,c)=>{for(let yy=0;yy<h;yy++)for(let xx=0;xx<w;xx++)put(x+xx,y+yy,c);};
  if(prone)return;
  const left=x0+(side?6:5),right=x0+(side?10:13),topY=y0+10;
  // Closed, continuous tunic. The belt and patterns ride with the torso, never the shield.
  for(let y=topY;y<=y0+16;y++)for(let x=left;x<=right;x++){
   const edge=x===left||x===right;put(x,y,edge?colors[0]:colors[1+((x+y)%4===0?1:0)]);
  }
  for(let x=left;x<=right;x++)put(x,y0+15,colors[0]);put(side?right-1:x0+9,y0+15,metal);
  if(o.style==='woven'){for(let y=topY+1;y<y0+15;y+=2)for(let x=left+1;x<right;x+=2)put(x,y,colors[3]);for(let x=left;x<=right;x++)put(x,y0+10,trim);}
  if(o.style==='lamellar'||o.style==='brigandine'){
   for(let y=topY+1;y<y0+15;y+=2){for(let x=left+1;x<right;x+=2){put(x,y,metal);put(x,y+1,colors[0]);}}
   patch(left-1,topY,3,2,colors[2]);patch(right-1,topY,3,2,colors[2]);put(left,topY,metal);put(right,topY,metal);
   if(o.style==='brigandine'){for(let y=topY;y<y0+17;y++)put(side?left+1:x0+8,y,trim);patch(side?left:x0+5,y0+16,side?3:4,2,colors[2]);}
  }
  if(o.style==='vest'){patch(left,topY,2,4,colors[3]);patch(right-1,topY,2,4,colors[2]);patch(side?right-1:x0+8,topY,2,3,trim);put(side?right:x0+10,topY+3,colors[0]);}
  if(o.style==='patched'){patch(left+1,topY+2,3,3,colors[2]);put(left+1,topY+2,trim);put(left+3,topY+4,trim);for(let x=left;x<=right;x++)put(x,y0+15,(x&1)?trim:colors[3]);patch(right-1,y0+16,2,2,colors[0]);}
  if(o.style==='mantle'){for(let y=topY-1;y<=topY+3;y++)for(let x=left-1;x<=right+1;x++)put(x,y,x<left+2?colors[2]:colors[1]);put(side?left+1:x0+9,topY,trim);for(let x=left;x<=right;x++)if(x%2===0)put(x,topY+3,colors[0]);}
  // Neck wraps remain below the mouth and eyes; no sealed helmet in a wet climate.
  if(o.style==='vest'||o.style==='lamellar'||o.style==='mantle'){
   for(let x=left-1;x<=right+1;x++)put(x,y0+9,o.style==='vest'?trim:colors[2]);
  }
  if(o.style==='brigandine'||o.style==='woven'){
   const crownY=y0+(isAttack(action)&&frame>=2&&frame<=4?-1:0);
   if(side){const backX=x0+(view==='droite'?3:12);put(backX,crownY+4,trim);put(backX,crownY+5,metal);}
   else{for(let x=x0+7;x<=x0+11;x++)put(x,crownY+3,o.style==='brigandine'?metal:colors[2]);put(x0+9,crownY+2,trim);}
  }
 }

 function combatRaster(role,action,view,frame,palette,smears=true,outfit=true,equipment=true){
  const image=empty(),back=empty(),body=empty(),arms=empty(),gear=empty(),fx=empty(),p=combatPose(role,action,view,frame),pal=API.paletteFor('male',palette),rows=MALE.SOURCE_VIEWS[view],side=view==='droite'||view==='gauche',x0=40-Math.floor(rows[0].length/2),y0=52-rows.length+1;
  const resting=['idle','walk','patrol','flee','guard_walk'].includes(action),walking=resting&&action!=='idle';
  const reference=resting?API.renderLayers({sex:'male',action:walking?'walk':'idle',dir:view,frame,palette}).layers.body:null;
  const c=k=>{const h=pal[k];return [parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16),255];},skin=c('g'),light=c('l'),shade=c('s'),outline=c('O');
  // Preserve authored head and torso pixel clusters, clear only the articulated arm regions.
  rows.forEach((row,y)=>{for(let x=0;x<row.length;x++){const k=row[x];if(k==='.')continue;
   // The civilian reference carries a satchel: remove it from armed silhouettes.
   if(side&&y>=11&&y<=17&&(view==='droite'?x<=4:x>=11))continue;
   const head=y<(side?10:9),feet=y>=rows.length-3;if(resting&&(head||walking&&feet))continue;
   let arm=!side&&y>=11&&y<=15&&(x<=3||x>=15);
   if(side)arm=view==='droite'?((y===12&&x>=6&&x<=7)||(y>=13&&y<=17&&x>=5&&x<=10)):((y===12&&x>=8&&x<=9)||(y>=13&&y<=17&&x>=6&&x<=10)||(y>=14&&y<=16&&x===5));
   if(arm)continue;let dx=feet?0:p.shift[0],dy=feet?0:p.shift[1];
   if(head&&isAttack(action)&&frame>=2&&frame<=4)dy-=1;
   if(feet&&isAttack(action)){const near=x<rows[0].length/2;dx=side?(view==='droite'?1:-1)*(near?-1:1)*(frame>=5&&frame<=8?2:1):near?-1:1;}
   set(body,x0+x+dx,y0+y+dy,c(k));
  }});
  if(resting){rect(body,37,40+p.shift[1],6,5,c('b'));for(let y=y0-2;y<y0+(side?10:9);y++)for(let x=24;x<56;x++){const i=(y*80+x)*4;if(reference.data[i+3])body.data.set(reference.data.subarray(i,i+4),i);}
   if(walking)for(let y=y0+rows.length-4;y<=53;y++)for(let x=24;x<56;x++){const i=(y*80+x)*4;if(reference.data[i+3])body.data.set(reference.data.subarray(i,i+4),i);}
  }
  // Removing the source arm also removes pixels it occluded. Rebuild the actual trunk,
  // independently of shield/outfit visibility, before attaching the articulated arms.
  const torso=[];if(side)for(let y=11;y<=17;y++)for(let x=5;x<=10;x++){
   const xx=x0+x+p.shift[0],yy=y0+y+p.shift[1];torso.push([xx,yy]);
   const at=(yy*80+xx)*4;if(!body.data[at+3])set(body,xx,yy,c(x===5||x===10?'u':'v'));
  }
  dress(body,role,view,action,frame,p.shift,outfit);
  function arm(layer,shoulder,hand,far){const elbow=[Math.round((shoulder[0]+hand[0])/2)+(side?0:far?-1:1),Math.round((shoulder[1]+hand[1])/2)+1];for(const [a,b] of [[shoulder,elbow],[elbow,hand]]){for(const [dx,dy] of [[-1,0],[1,0],[0,-1],[0,1]])line(layer,a[0]+dx,a[1]+dy,b[0]+dx,b[1]+dy,outline);line(layer,...a,...b,far?shade:skin);}set(layer,elbow[0]-1,elbow[1],light);rect(layer,hand[0]-1,hand[1]-1,3,3,outline);rect(layer,hand[0],hand[1],2,2,c('b'));return {shoulder,elbow,hand};}
  const shoulder=(left)=>[40+(side?0:left?-5:5)+p.shift[0],42+p.shift[1]];
  const joints=[arm(view==='gauche'?arms:back,shoulder(true),p.left,view!=='gauche'),arm(view==='gauche'?back:arms,shoulder(false),p.hand,view==='gauche')];
  const spec=ROLE_GROUPS[role],weapon=spec.weapon;
  if(equipment&&spec.offhand==='shield')shield(view==='dos'||view==='droite'?back:gear,p.left[0],p.left[1],view,spec.accent);
  if(equipment&&spec.bundle){const bx=view==='gauche'?44:view==='droite'?36:40;rect(back,bx-1,40,3,8,'leather0');rect(back,bx,40,1,7,'leather1');line(back,bx,40,bx,35,'wood2');set(back,bx,34,'metal1');}
  if(equipment&&smears&&p.active){const prev=combatPose(role,action,view,frame-1);const av=[prev.tip[0]-prev.hand[0],prev.tip[1]-prev.hand[1]],bv=[p.tip[0]-p.hand[0],p.tip[1]-p.hand[1]];let a0=Math.atan2(av[1],av[0]),delta=Math.atan2(bv[1],bv[0])-a0;while(delta>Math.PI)delta-=Math.PI*2;while(delta<-Math.PI)delta+=Math.PI*2;
   for(let j=0;j<=24;j++){const t=j/24,a=a0+delta*t,len=Math.hypot(...av)*(1-t)+Math.hypot(...bv)*t,mx=prev.hand[0]*(1-t)+p.hand[0]*t,my=prev.hand[1]*(1-t)+p.hand[1]*t;
    for(let r=len*.68;r<=len;r+=.7){const x=Math.round(mx+Math.cos(a)*r),y=Math.round(my+Math.sin(a)*r);if(j<5&&((x+y)&1))continue;set(fx,x,y,r>len*.9?'metal2':'metal1');}
   }
  }
  const behind=view==='dos'||(resting&&view==='gauche')||(isAttack(action)&&p.tip[1]<32&&frame<5),wl=behind?back:gear;
  if(equipment&&!(action==='throw_javelin'&&frame>=5)){
   if(weapon==='spear'){
    const vx=p.tip[0]-p.hand[0],vy=p.tip[1]-p.hand[1],len=Math.max(1,Math.hypot(vx,vy));const butt=[Math.round(p.hand[0]-vx/len*7),Math.round(p.hand[1]-vy/len*7)];line(wl,...butt,...p.tip,'wood0');spear(wl,p.hand,p.tip,spec.accent,spec.banner);
   }else if(weapon==='sword')sword(wl,p.hand,p.tip);else if(weapon==='club')club(wl,p.hand,p.tip);else javelin(wl,p.hand,p.tip);
  }
  merge(image,fx);merge(image,back);merge(image,body);merge(image,arms);merge(image,gear);
  // Knuckles remain above the grip; the weapon can never float beside a detached hand.
  set(image,p.hand[0],p.hand[1],c('b'));set(image,p.hand[0]+1,p.hand[1],c('c'));
  return {...image,metadata:{role,action,direction:view,engineDirection:DIRECTIONS.indexOf(view),frame,palette,anchor:ANCHOR,phase:p.phase,outfit:outfit?OUTFITS[role].label:null,torso,active:p.active,smear:p.active&&smears&&equipment,joints,weapon:{hand:p.hand,tip:p.tip},release:p.release}};
 }

 const COLOR=freeze({
   outline:[16,14,32,255], wood0:[80,52,47,255], wood1:[117,75,55,255], wood2:[161,106,68,255],
   metal0:[94,104,110,255], metal1:[143,152,156,255], metal2:[207,213,214,255],
   leather0:[80,52,47,255], leather1:[117,75,55,255],
   shield0:[70,60,40,255], shield1:[115,99,66,255], shield2:[184,164,105,255],
   cloth0:[69,92,115,255], cloth1:[107,136,163,255], cloth2:[166,185,201,255],
   red0:[124,43,42,255], red1:[176,77,62,255], red2:[214,145,92,255],
   green0:[63,97,86,255], green1:[88,137,122,255], green2:[121,175,154,255],
   gold0:[181,119,44,255], gold1:[243,175,60,255], gold2:[255,212,94,255]
 });
 function finite(n,label){if(typeof n!=='number'||!Number.isFinite(n)) throw new TypeError(label+' doit être un nombre fini.');return n;}
 function integer(n,label){if(!Number.isInteger(n)) throw new TypeError(label+' doit être un entier.');return n;}
 function clipName(name){if(!Object.hasOwn(CLIPS,name)) throw new RangeError('Animation inconnue : '+name); return name;}
 function roleName(name){if(!Object.hasOwn(ROLE_GROUPS,name)) throw new RangeError('Rôle inconnu : '+name); return name;}
 function directionName(dir){return API.directionName(dir);}
 function paletteName(name){return API.paletteName('male',name||'original');}
 function frameAt(action='idle',seconds=0,distancePx){const clip=CLIPS[clipName(action)];finite(seconds,'seconds');const total=clip.duration;let ms; if(clip.stride!==null&&distancePx!==undefined){finite(distancePx,'distancePx'); ms=((distancePx%clip.stride+clip.stride)%clip.stride)/clip.stride*total;} else {ms=Math.max(0,seconds)*1000; ms=clip.loop?ms%total:Math.min(ms,total-0.001);} for(let i=0;i<clip.frames;i++){if(ms<clip.durations[i]) return i; ms-=clip.durations[i];} return clip.frames-1;}
 function empty(w=80,h=80){return {width:w,height:h,anchor:ANCHOR,data:new Uint8ClampedArray(w*h*4)};}
 function clone(image){return {width:image.width,height:image.height,anchor:image.anchor,data:new Uint8ClampedArray(image.data)};}
 function set(image,x,y,color){if(x<0||y<0||x>=image.width||y>=image.height) return; const c=Array.isArray(color)?color:COLOR[color]; if(!c) return; const i=(y*image.width+x)*4; image.data[i]=c[0]; image.data[i+1]=c[1]; image.data[i+2]=c[2]; image.data[i+3]=c[3];}
 function line(image,x0,y0,x1,y1,color){x0=Math.round(x0);y0=Math.round(y0);x1=Math.round(x1);y1=Math.round(y1);let dx=Math.abs(x1-x0),sx=x0<x1?1:-1,dy=-Math.abs(y1-y0),sy=y0<y1?1:-1,err=dx+dy;for(;;){set(image,x0,y0,color); if(x0===x1&&y0===y1) break; const e2=2*err; if(e2>=dy){err+=dy;x0+=sx;} if(e2<=dx){err+=dx;y0+=sy;}}}
 function rect(image,x,y,w,h,color){for(let j=0;j<h;j++) for(let i=0;i<w;i++) set(image,x+i,y+j,color);}
 function ellipse(image,cx,cy,rx,ry,color,fill=true){for(let y=-ry;y<=ry;y++)for(let x=-rx;x<=rx;x++){const v=(x*x)/(rx*rx)+(y*y)/(ry*ry); if(fill? v<=1 : Math.abs(v-1)<0.35) set(image,cx+x,cy+y,color);}}
 function merge(dst,src){for(let i=0;i<dst.data.length;i+=4){const a=src.data[i+3]; if(!a) continue; dst.data[i]=src.data[i]; dst.data[i+1]=src.data[i+1]; dst.data[i+2]=src.data[i+2]; dst.data[i+3]=a; } return dst;}
 function composite(list){const out=empty(list[0].width,list[0].height); for(const im of list) merge(out,im); return out;}
 function formatImage(image,format){if(format==='engine'||!format) return image; if(format==='native'){for(let y=0;y<80;y++)for(let x=0;x<80;x++)if((x<16||y<16||x>=64||y>=64)&&image.data[(y*80+x)*4+3])throw new RangeError('Cette pose comporte du matériel au sol hors 48x48 ; utiliser engine 80x80, sans recadrage destructeur.');const out=empty(48,48); for(let y=0;y<48;y++) for(let x=0;x<48;x++){const sx=x+16,sy=y+16,si=(sy*80+sx)*4,di=(y*48+x)*4; out.data[di]=image.data[si]; out.data[di+1]=image.data[si+1]; out.data[di+2]=image.data[si+2]; out.data[di+3]=image.data[si+3];} out.anchor=NATIVE_ANCHOR; return out;} throw new RangeError('Format attendu : engine ou native');}
 function baseFrameData(action,view,frame,palette){const base=CLIPS[action].base; const baseClip=API.CLIPS[base]; const mapped=baseClip.frames===CLIPS[action].frames?frame:Math.max(0,Math.min(baseClip.frames-1,Math.round(frame*(baseClip.frames-1)/(CLIPS[action].frames-1)))); const r=API.renderLayers({sex:'male',action:base,dir:view,frame:mapped,palette}); return {image:composite([r.layers.body,r.layers.hands]),body:r.layers.body,hands:r.layers.hands,meta:r.metadata};}
 function fallbackHands(view){if(view==='face') return [[36,42],[44,45]]; if(view==='dos') return [[38,42],[42,45]]; if(view==='droite') return [[47,42],[43,46]]; return [[33,42],[37,46]];}
 function handsFor(meta,view){return meta&&Array.isArray(meta.hands)&&meta.hands.length===2?meta.hands:fallbackHands(view);}
 function shield(image,cx,cy,view,accent){const accentColor=accent==='water'?'cloth1':accent==='captain'?'red1':'shield2'; if(view==='face'||view==='dos'){ellipse(image,cx,cy,5,6,'shield0'); ellipse(image,cx,cy,4,5,'shield1'); rect(image,cx-1,cy-4,2,8,accentColor); rect(image,cx-3,cy-1,6,2,'metal2');} else {ellipse(image,cx,cy,4,6,'shield0'); ellipse(image,cx,cy,3,5,'shield1'); rect(image,cx-1,cy-4,1,8,accentColor); rect(image,cx-2,cy-1,4,2,'metal2');}}
 function spear(image,a,b,accent,banner){line(image,a[0],a[1],b[0],b[1],'wood2'); const dx=Math.sign(b[0]-a[0])||1,dy=Math.sign(b[1]-a[1])||-1; set(image,b[0],b[1],'metal2'); set(image,b[0]-dx,b[1]-dy,'metal1'); set(image,b[0]-dx,b[1],'metal0'); if(banner){rect(image,a[0]+(dx<0?-4:1),a[1]-6,3,5,'red1'); set(image,a[0]+(dx<0?-2:3),a[1]-2,'red2');}}
 function sword(image,a,b){line(image,a[0],a[1],b[0],b[1],'metal1'); line(image,b[0],b[1],b[0]+(b[0]>=a[0]?1:-1),b[1]-1,'metal2'); line(image,a[0]-1,a[1],a[0]+1,a[1],'gold1'); set(image,a[0],a[1]+1,'wood0');}
 function club(image,a,b){line(image,a[0],a[1],b[0],b[1],'wood1'); rect(image,b[0]-1,b[1]-1,3,3,'wood2'); set(image,b[0]+1,b[1]+1,'metal0');}
 function javelin(image,a,b){line(image,a[0],a[1],b[0],b[1],'wood2'); set(image,b[0],b[1],'metal2'); set(image,b[0]-Math.sign(b[0]-a[0]||1),b[1],'metal1');}
 function bundle(image,cx,cy,count=3){for(let i=0;i<count;i++) line(image,cx+i,cy+6,cx+4+i,cy-6,'wood2'); for(let i=0;i<count;i++) set(image,cx+4+i,cy-6,'metal2'); }
 function roleAccent(role){return ROLE_GROUPS[role].accent;}
 function guardHandPose(view,frame){const bob=[0,0,1,1,0,-1,-1,0][frame]; if(view==='face') return {main:[[44,44],[46,29+bob]],off:[35,44],shield:[31,42+bob]}; if(view==='dos') return {main:[[36,44],[34,28+bob]],off:[45,44],shield:[48,42+bob]}; if(view==='droite') return {main:[[44,45],[50,29+bob]],off:[41,44],shield:[38,42+bob]}; return {main:[[36,45],[30,29+bob]],off:[39,44],shield:[42,42+bob]};}
 function attackPose(view,frame,kind){const t=frame/7; if(kind==='thrust'){ if(view==='face') return {a:[44,43],b:[44,30-2*t],c:[36,44],shield:[32,42]}; if(view==='dos') return {a:[36,43],b:[36,28-2*t],c:[44,44],shield:[48,42]}; if(view==='droite') return {a:[44,43],b:[50+Math.round(t*5),38-Math.round(t*3)],c:[41,45],shield:[38,42]}; return {a:[36,43],b:[30-Math.round(t*5),38-Math.round(t*3)],c:[39,45],shield:[42,42]}; }
 if(kind==='slash'){ if(view==='face') return {a:[43,41],b:[49-Math.round(t*5),31+Math.round(t*8)],c:[35,44],shield:[31,42]}; if(view==='dos') return {a:[37,41],b:[31+Math.round(t*5),31+Math.round(t*8)],c:[45,44],shield:[49,42]}; if(view==='droite') return {a:[45,41],b:[52-Math.round(t*6),33+Math.round(t*10)],c:[41,44],shield:[38,42]}; return {a:[35,41],b:[28+Math.round(t*6),33+Math.round(t*10)],c:[39,44],shield:[42,42]}; }
 if(kind==='throw'){ if(view==='face') return {a:[45,39],b:[49-Math.round(t*8),28+Math.round(t*4)],bundle:[33,40]}; if(view==='dos') return {a:[35,39],b:[31+Math.round(t*8),28+Math.round(t*4)],bundle:[47,40]}; if(view==='droite') return {a:[45,39],b:[52-Math.round(t*3)+Math.round(t*10),30-Math.round(t*8)],bundle:[39,40]}; return {a:[35,39],b:[28+Math.round(t*3)-Math.round(t*10),30-Math.round(t*8)],bundle:[41,40]}; }
 return null; }
 function challengePose(view,frame){const t=frame/7; if(view==='face') return {point:[[44,42],[48,37-Math.round(t*2)]],off:[35,44],shield:[31,42]}; if(view==='dos') return {point:[[36,42],[32,37-Math.round(t*2)]],off:[45,44],shield:[48,42]}; if(view==='droite') return {point:[[44,42],[52,39]],off:[41,44],shield:[38,42]}; return {point:[[36,42],[28,39]],off:[39,44],shield:[42,42]}; }
 function renderRoleGear(role,action,view,frame,image,meta){const spec=ROLE_GROUPS[role], accent=roleAccent(role); const hands=handsFor(meta,view);
  // back bundle for scout
  if(spec.bundle && !['death','surrender'].includes(action)){ if(view==='dos') bundle(image,42,38,3); else if(view==='droite') bundle(image,45,39,3); else if(view==='gauche') bundle(image,31,39,3); }
  if(action==='death'){
    if(spec.weapon==='spear') spear(image,[48,54],[55,69],accent,spec.banner); else if(spec.weapon==='sword') sword(image,[47,55],[54,62]); else if(spec.weapon==='club') club(image,[47,56],[53,61]); else if(spec.weapon==='javelin') javelin(image,[48,55],[55,62]);
    if(spec.offhand==='shield') shield(image,31,58,view,accent); return;
  }
  if(action==='surrender') return;
  if(action==='block'){
    if(spec.offhand==='shield'){ const p=guardHandPose(view,frame); shield(image,p.shield[0],p.shield[1]-(view==='face'||view==='dos'?2:1),view,accent);} 
    if(spec.weapon==='spear'){ const p=guardHandPose(view,frame); spear(image,p.main[0], p.main[1], accent,spec.banner); }
    return;
  }
  if(action==='alert'||action==='guard'||action==='idle'||action==='walk'||action==='patrol'||action==='flee'||action==='hit'){
    const p=guardHandPose(view,frame); if(spec.offhand==='shield') shield(image,p.shield[0],p.shield[1],view,accent);
    if(spec.weapon==='spear') spear(image,p.main[0],p.main[1],accent,spec.banner);
    else if(spec.weapon==='sword') sword(image,[view==='gauche'?37:43,46],[view==='gauche'?31:49,35]);
    else if(spec.weapon==='club') club(image,[view==='gauche'?37:43,46],[view==='gauche'?30:50,38]);
    else if(spec.weapon==='javelin'){ const q=view==='gauche'?-1:1; javelin(image,[view==='gauche'?37:43,45],[view==='gauche'?29:51,33]); }
    return;
  }
  if(action==='challenge'||action==='rally'){
    const p=challengePose(view,frame); if(spec.offhand==='shield') shield(image,p.shield[0],p.shield[1],view,accent);
    if(spec.weapon==='spear') spear(image,p.point[0],p.point[1],accent,spec.banner);
    else if(spec.weapon==='sword') sword(image,p.point[0],p.point[1]);
    else if(spec.weapon==='club') club(image,p.point[0],p.point[1]);
    else if(spec.weapon==='javelin'){ javelin(image,p.point[0],p.point[1]); bundle(image,p.bundle?p.bundle[0]:33,p.bundle?p.bundle[1]:40,2); }
    return;
  }
  if(action==='thrust'){
    const p=attackPose(view,frame,'thrust'); if(spec.offhand==='shield') shield(image,p.shield[0],p.shield[1],view,accent);
    if(spec.weapon==='spear') spear(image,p.a,p.b,accent,spec.banner); else if(spec.weapon==='sword') sword(image,p.a,p.b); else if(spec.weapon==='club') club(image,p.a,p.b); else javelin(image,p.a,p.b);
    return;
  }
  if(action==='slash'){
    const p=attackPose(view,frame,'slash'); if(spec.offhand==='shield') shield(image,p.shield[0],p.shield[1],view,accent);
    if(spec.weapon==='spear') spear(image,p.a,p.b,accent,spec.banner); else if(spec.weapon==='sword') sword(image,p.a,p.b); else if(spec.weapon==='club') club(image,p.a,p.b); else javelin(image,p.a,p.b);
    return;
  }
  if(action==='throw_javelin'){
    const p=attackPose(view,frame,'throw'); if(spec.bundle) bundle(image,p.bundle[0],p.bundle[1],2); if(frame<5) javelin(image,p.a,p.b); else if(frame===5) javelin(image,p.a,[p.b[0]+(view==='gauche'?-12:view==='droite'?12:0),p.b[1]-2]);
    return;
  }
 }
 function raster(options={}){const role=roleName(options.role||'village_guard'), action=clipName(options.action||'idle'), view=directionName(options.dir===undefined?DIR.SOUTH:options.dir), frame=integer(options.frame===undefined?0:options.frame,'frame'), palette=paletteName(options.palette||'original'), format=options.format||'engine';
  if(frame<0||frame>=CLIPS[action].frames) throw new RangeError('frame hors limite');
  if(isAttack(action)||['idle','walk','patrol','flee','guard','guard_walk','block'].includes(action)){const im=combatRaster(role,action,view,frame,palette,options.smear!==false,options.outfit!==false,options.equipment!==false);headgear(im,role,view,action,frame,palette,options.headgear!==false);im.metadata.headgear=options.headgear===false?null:HEADGEAR[role];return {...formatImage(im,format),metadata:im.metadata};}
  const base=baseFrameData(action,view,frame,palette); const image=clone(base.body);
  // hide stars for hit? body+hands already no tools only.
  const side=view==='droite'||view==='gauche',rows=MALE.SOURCE_VIEWS[view],x0=40-Math.floor(rows[0].length/2),y0=52-rows.length+1,joint=base.meta.joints?.[side?base.meta.joints.length-1:0];
  const offset=joint?[joint.shoulder[0]-(x0+(side?8:4)),joint.shoulder[1]-(y0+(side?12:11))]:[0,['walk','patrol','flee'].includes(action)&&[1,2,5,6].includes(frame)?1:0];
  dress(image,role,view,action,frame,offset,options.outfit!==false);merge(image,base.hands);
  if(options.equipment!==false)renderRoleGear(role,action,view,frame,image,base.meta);
  headgear(image,role,view,action,frame,palette,options.headgear!==false);
  return {...formatImage(image,format), metadata:{role,action,direction:view,engineDirection:DIRECTIONS.indexOf(view),frame,palette,outfit:options.outfit===false?null:OUTFITS[role].label,anchor:format==='native'?NATIVE_ANCHOR:ANCHOR}};
 }
 class Atlas{ constructor(options={}){this.role=roleName(options.role||'village_guard'); this.palette=paletteName(options.palette||'original'); this.canvasFactory=options.canvasFactory||defaultCanvasFactory; this.maxFrames=options.maxFrames===undefined?128:integer(options.maxFrames,'maxFrames'); if(this.maxFrames<1||this.maxFrames>256)throw new RangeError('maxFrames : 1..256'); this.cache=new Map();}
   get(action='idle',dir=DIR.SOUTH,frame=0){const key=[this.role,this.palette,action,dir,frame].join(':'); if(this.cache.has(key)){const v=this.cache.get(key); this.cache.delete(key); this.cache.set(key,v); return v;} const im=raster({role:this.role,palette:this.palette,action,dir,frame,format:'engine'}); const cv=this.canvasFactory(80,80), c=cv.getContext('2d'); const id=c.createImageData(80,80); id.data.set(im.data); c.putImageData(id,0,0); this.cache.set(key,cv); while(this.cache.size>this.maxFrames) this.cache.delete(this.cache.keys().next().value); return cv;}
   draw(ctx,actor,time=0,state={}){const action=clipName(state.action||'idle'); const frame=state.frame===undefined?frameAt(action,state.elapsed===undefined?time:state.elapsed,state.distance):state.frame; const im=this.get(action,actor.dir===undefined?DIR.SOUTH:actor.dir,frame); const z=actor.z||0, alpha=actor.alpha===undefined?1:actor.alpha; ctx.save(); try{ctx.imageSmoothingEnabled=false; ctx.globalAlpha*=alpha; ctx.drawImage(im,Math.round(actor.x)-ANCHOR.x,Math.round(actor.y-z)-ANCHOR.y);} finally{ctx.restore();} actor._img=im; return im;}
   clear(){this.cache.clear();}
 }
 function defaultCanvasFactory(w,h){let cv;if(typeof document!=='undefined')cv=document.createElement('canvas'); else if(typeof OffscreenCanvas!=='undefined')cv=new OffscreenCanvas(w,h); else throw new Error('Canvas indisponible'); cv.width=w; cv.height=h; return cv;}
 function buildSheet(options={}){const actions=options.actions||Object.keys(CLIPS), role=roleName(options.role||'village_guard'), palette=paletteName(options.palette||'original'), format=options.format||'engine', cell=format==='native'?48:80; const columns=Math.max(...actions.map(a=>CLIPS[clipName(a)].frames)), rows=actions.length*4; const out={width:columns*cell,height:rows*cell,data:new Uint8ClampedArray(columns*cell*rows*cell*4)}; for(let ai=0;ai<actions.length;ai++) for(let di=0;di<4;di++) for(let f=0;f<CLIPS[actions[ai]].frames;f++){const im=raster({role,palette,action:actions[ai],dir:SHEET_DIRECTIONS[di],frame:f,format}); for(let y=0;y<cell;y++) out.data.set(im.data.subarray(y*cell*4,(y+1)*cell*4), (((ai*4+di)*cell+y)*out.width+f*cell)*4);} return out;}
 function manifest(){return {id:'batraciens-combattants',version:VERSION,cell:[80,80],anchor:[40,52],nativeCell:[48,48],nativeAnchor:[24,36],directions:DIRECTIONS,sheetDirections:SHEET_DIRECTIONS,roles:ROLE_GROUPS,clips:CLIPS,palettes:API.COLOR_VARIANTS.male,scope:'Male armed roles only. Sprites and playback, no AI or combat rules.'};}
 return freeze({VERSION,DIR,ANCHOR,NATIVE_ANCHOR,DIRECTIONS,SHEET_DIRECTIONS,ROLES:ROLE_GROUPS,OUTFITS,HEADGEAR,CLIPS,ATTACKS,isAttack,combatPose,frameAt,raster,Atlas,buildSheet,manifest});
});
