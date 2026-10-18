/* Hearthreaver — Homme-singe, base originale Codex / ChatGPT.
 * Grilles et calques indépendants, lumière en haut à gauche dans chaque vue.
 * Pixels entiers, alpha binaire, aucun miroir ni rotation d'image.
 * Contrat PNJ : 48×48 ancre 24,36 ; moteur 80×80 ancre 40,52.
 * Atelier de validation uniquement : aucun spawn ou équipement de métier.
 */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.HearthreaverApe=factory();})(globalThis,function(){
'use strict';
const PALETTE={O:'#100e20',D:'#392930',F:'#614032',M:'#8c5d3d',H:'#b58752',S:'#ad7d58',L:'#d5aa73',C:'#efd099',E:'#211521',B:'#684631',T:'#96734b',U:'#c09e68'};
const p=(x,y,rows)=>({x,y,rows});
// Every member is drawn with a covered joint; the head overlaps the neck.
const VIEWS={
face:{
 leftLeg:p(19,31,['.OOO.','OFMDO','OFMDO','OSLDO','OSLLDO','OOOOOO']),rightLeg:p(25,31,['.OOO.','OFDDO','OFDDO','OSSDO','OSLSDO','OOOOOO']),
 torso:p(18,24,['..OOOOOO..','.OHMMMFFO.','OHMMHHMFFO','OMMSSSMFDO','OFMSLSMFDO','.OFMMMFDO.','..OFFFFO..']),
 leftArm:p(15,25,['.OOO.','OHMFO','OHMFO','OMMDO','.OMDO','.OSLO','OSLLO','.OOO.']),
 rightArm:p(28,25,['.OOO.','OMFDO','OMFDO','OFFDO','OFDO.','OSDO.','OSLSO','.OOO.']),
 cloth:p(19,30,['OOOOOOOOOO','OBTTUTTBBO','OTTUUTTTBO','.OTTOOTBO.','..OO..OO..']),
 head:p(16,14,['.....OO......','...OOHFOO....','..OHMMMFFO...','.OHMHHMMFDO..','OMMSSSSSMFDO.','OSLDDSSDDSDO.','OSLELSLLESDO.','.OSSSDDSSSO..','..OSLSSLSO...','..OSLCCLSO...','...OOOOOO....'])
},
dos:{
 leftLeg:p(19,31,['.OOO.','OFMDO','OFMDO','OMMDO','OMMMDO','OOOOOO']),rightLeg:p(25,31,['.OOO.','OFDDO','OFDDO','OMFDO','OMFFDO','OOOOOO']),
 torso:p(18,24,['..OOOOOO..','.OHMMMFFO.','OHMHHMMFFO','OMMMHMMFDO','OFMMFMMFDO','.OFMMMFDO.','..OFFFFO..']),
 leftArm:p(15,25,['.OOO.','OHMFO','OHMFO','OMMDO','.OMDO','.OSLO','OSLLO','.OOO.']),rightArm:p(28,25,['.OOO.','OMFDO','OMFDO','OFFDO','OFDO.','OSDO.','OSLSO','.OOO.']),
 cloth:p(19,30,['OOOOOOOOOO','OBTTUTTBBO','OTTUUTTTBO','.OTTOOTBO.','..OO..OO..']),
 head:p(16,14,['.....OO......','...OOHFOO....','..OHMMMFFO...','.OHHHHMMFDO..','OMHHHMMMFDDO.','OMHHMMMMFDDO.','OFMMMMMMFDDO.','.OFMMMMFDDO..','..OFMMFFDO...','...OFFFDO....','....OOOO.....'])
},
droite:{
 leftLeg:p(21,31,['OOO.','OFDO','OFDO','OMDO','OMFDO','OOOOO']),rightLeg:p(24,31,['.OOO.','OMFDO','OMFDO','OSLDO','OSLLSO','OOOOOO']),
 torso:p(20,24,['.OOOOO.','OHMMFDO','OMMMFFDO','OMSSMFDO','OFSSMFDO','.OFFFDO.','..OOOO..']),
 leftArm:p(25,25,['OOO.','OFDO','OFDO','OFDO','OSDO','OSSO','OOOO']),
 rightArm:p(19,25,['.OOO.','OHMFO','OHMFO','OMMDO','OMFDO','.OSDO','.OSLSO','..OOO.']),
 cloth:p(20,30,['OOOOOOOO','OBTUTTBO','OTTUTTBO','.OTTBO..','..OOO...']),
 head:p(18,14,['....OO......','..OOHFOO....','.OHMMMFFO...','OHHHMMFFDO..','OHMMSSSSSO..','OMMSSOOESO..','OFFSLOOSSSO.','OFFSSSDDLLSO','.OFSSLLCCLSO','..OFFSSLLDO.','...OOOOOOO..'])
},
gauche:{
 leftLeg:p(22,31,['.OOO','OFDO','OFDO','OMDO','OMFDO','OOOOO']),rightLeg:p(18,31,['.OOO..','OMFDO.','OMFDO.','OSLDO.','OSLLSO','OOOOOO']),
 torso:p(20,24,['.OOOOO..','OHMMFDO.','OHMMMFDO','OHMSSMDO','OFMSSMDO','.OFFFDO.','..OOOO..']),
 leftArm:p(18,25,['.OOO','OMFO','OMFO','OFDO','OSLO','OSSO','OOOO']),rightArm:p(25,25,['.OOO.','OMFDO','OMFDO','OFFDO','OFMDO','OSDO.','OSLSO','.OOO.']),
 cloth:p(19,30,['OOOOOOOO','OBTUTTBO','OTTUTTBO','..OTTBO.','...OOO..']),
 head:p(15,14,['.....OO.....','...OOHFOO...','..OHMMMFFO..','.OHMMMMFFDO.','.OSSSSMMFDO.','.OSEOOOMFDO.','OSSSOOLSFDO.','OSLLDDSSFFO.','OSLCCLLSFO..','.OSLLSFFO...','..OOOOOO....'])
}};
const CLIPS={idle:{durations:[450,220,350,260],loop:true},walk:{durations:[100,90,90,100,100,90,90,100],loop:true,stride:24},flee:{durations:[75,65,65,75,75,65,65,75],loop:true,stride:32},talk:{durations:[300,120,240,260],loop:true}};
const GAIT=[{step:2,lift:0},{step:1,lift:1,bob:-1},{step:0,lift:1},{step:-1,lift:0,bob:1},{step:-2,lift:0},{step:-1,lift:-1,bob:-1},{step:0,lift:-1},{step:1,lift:0,bob:1}];
function directionName(d){const key=typeof d==='number'?['dos','droite','face','gauche'][d]:d;if(!VIEWS[key])throw new RangeError('Direction inconnue');return key;}
function frameAt(action,time=0,distance){const clip=CLIPS[action];if(!clip)throw new RangeError('Animation inconnue');const total=clip.durations.reduce((a,b)=>a+b,0);let ms=clip.stride&&distance!==undefined?((distance%clip.stride+clip.stride)%clip.stride)/clip.stride*total:((time*1000)%total+total)%total;for(let i=0;i<clip.durations.length;i++){ms-=clip.durations[i];if(ms<0)return i;}return 0;}
function pose(action,frame,dir){
 const walk=action==='walk'||action==='flee',g=walk?GAIT[frame]:{},side=dir==='droite'||dir==='gauche',q=dir==='gauche'?-1:1,fast=action==='flee'?1.5:1;
 const step=Math.round((g.step||0)*fast),bob=walk?Math.max(-1,Math.min(1,g.bob||0)):0,breath=action==='idle'&&[1,2].includes(frame)?-1:0,gesture=action==='talk'?[0,1,2,1][frame]:0;
 return {step,bob,breath,gesture,side,q,lift:g.lift||0,blink:action==='idle'&&frame===2};
}
function renderLayers(action='idle',dir='face',frame=0){
 dir=directionName(dir);if(!CLIPS[action]||!Number.isInteger(frame)||frame<0||frame>=CLIPS[action].durations.length)throw new RangeError('Frame invalide');
 const source=VIEWS[dir],v=pose(action,frame,dir),layers={};
 for(const [name,part]of Object.entries(source)){
  const out=[];let dx=0,dy=v.bob;
  if(name.endsWith('Leg')){const sign=name==='leftLeg'?1:-1;dx=v.side?Math.round(sign*v.step/2)*v.q:0;dy=sign*v.lift>0?-(Math.abs(v.lift)+(v.step===0?1:0)):0;}
  if(name==='head')dy+=v.breath;
  part.rows.forEach((row,y)=>[...row].forEach((key,x)=>{if(key==='.')return;let px=x+part.x+dx,py=y+part.y+dy;
   if(name.endsWith('Arm')){const sign=name==='leftArm'?1:-1,t=y/(part.rows.length-1),swing=v.step*sign;
    px+=Math.round((v.side?swing*v.q:sign*Math.abs(swing)*.4)*t);py+=Math.round((v.side?-Math.abs(swing)*.3:swing*.45)*t);
    if(name==='rightArm'&&v.gesture){px+=Math.round(-v.q*v.gesture*t);py-=Math.round(v.gesture*1.5*t);}
   }
   if(name==='head'&&v.blink&&key==='E')key='S';
   out.push([px,py,key]);
  }));layers[name]=out;
 }
 // Fill the neck under both poses; no transparent seam during respiration.
 layers.neck=[];for(let y=23+v.bob+v.breath;y<=26+v.bob;y++)for(let x=22;x<=26;x++)layers.neck.push([x,y,dir==='dos'?'F':'S']);
 const order=dir==='dos'?['leftLeg','rightLeg','leftArm','rightArm','torso','cloth','neck','head']:['leftLeg','rightLeg','leftArm','torso','cloth','neck','head','rightArm'];
 if(dir==='face'){order.splice(order.indexOf('leftArm'),1);order.push('leftArm');}
 return {layers,order,anchor:[24,36],dir,action,frame};
}
function draw(ctx,{action='idle',dir='face',frame=0,x=0,y=0,layer=null,palette=PALETTE,format='native'}={}){const r=renderLayers(action,dir,frame),offset=format==='engine'?16:0;ctx.imageSmoothingEnabled=false;for(const name of layer?[layer]:r.order){if(!r.layers[name])throw new RangeError('Calque inconnu');for(const [px,py,key]of r.layers[name]){ctx.fillStyle=palette[key];ctx.fillRect(Math.round(x)+px+offset,Math.round(y)+py+offset,1,1);}}return r;}
return {VERSION:'0.1.0',author:'Codex / ChatGPT',PALETTE,VIEWS,CLIPS,directions:['face','droite','dos','gauche'],frameSize:48,anchor:[24,36],engineFrameSize:80,engineAnchor:[40,52],directionName,frameAt,renderLayers,draw};
});
