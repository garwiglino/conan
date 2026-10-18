/* Hearthreaver — homme-singe : transcription du concept validé le 18/10/2026.
 * Codex / ChatGPT. Pixels indexés natifs, quatre vues tracées indépendamment.
 * Dessin canonique : SOURCE_VIEWS ; animation par membres séparés.
 * Cellule native 48×48, ancre (24,36) ; moteur 80×80, ancre (40,52).
 * Aucun PNG embarqué ni miroir ; aucun remplacement des autres PNJ.
 */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.HearthreaverApe=factory();})(globalThis,function(){
'use strict';
const PALETTE={"O":"#080616","D":"#28171e","F":"#4a2b2a","M":"#5f3530","H":"#6b3c33","h":"#7d4736","S":"#894e38","s":"#a16241","b":"#ae7b53","L":"#c88b56","C":"#cf9860","c":"#e0b478","E":"#ecc381"};
const SOURCE_VIEWS={
 "face": [
  "..........OO.........",
  "........OsSFOO.......",
  "......OOhSsSMhO......",
  ".....OMSSSsSSSMFO....",
  "....OSSSSsssSSSSO....",
  "...OSSbsSSSSSbbSSO...",
  "..OOhHEEESSSEEEHSOO..",
  ".OEEOhFsEEEEEhFHOEEO.",
  ".OCSSSEOEsssEOESHsCO.",
  ".OCCOSbOEEEcEObSOLLO.",
  "..OOSSCEEFEFEEESSOO..",
  "...OMSEEEEEEEEESMO...",
  "....OMEEFFFFFEEMOO...",
  "..OMHODCEEEEECFOMhO..",
  "..OSSSMsOOOOOFMSSSO..",
  ".OSSSFbELLSbbEsFSSSO.",
  ".OSSMOHEEECEEEMOMSSO.",
  "OSSSOOMLEEEEELHOOSSHO",
  "OsEEOOSMOOOOOHSOOEEbO",
  "OEECEOOHsHsHssOOEbEEO",
  "OCEhDOSHOsMsOHSODHECO",
  ".OLLOSSSOsSsOSSSOLLO.",
  "..OOOOSHMOSOMHSOOOO..",
  "...OEEEEFOOOsEEEEO...",
  "..OESESELO.OLESESEO..",
  "..OOOOOOOO.OOOOOOOO.."
 ],
 "droite": [
  ".........OO......",
  "......OOOMsO.....",
  "....OOSSHSSSOO...",
  "...OHSSSsSSSSO...",
  "...MSSSsSSSHShO..",
  "...SSSSSSSEEECsO.",
  "..FSSHEMSShMhELO.",
  ".OSSOEccMSSODsO..",
  ".OShOEsMSSSOcEEO.",
  ".OMHMCECHSSEEEEEO",
  "..OMMMOFSSEEEEEEO",
  "..OMMMMMHSEEEhHOO",
  "...OODMMMMsEEEEO.",
  "..OSSSSHHDMsCLO..",
  "..OSSSSSSssO.....",
  ".OSSSSOMcEcLO....",
  "OhSSMOMhLEELO....",
  "OSSSSOMhSLcO.....",
  "OMSSEOHsssHhO....",
  ".OLEEEOODFMD.....",
  ".OLEESEhSOsHO....",
  "..sCELOSShsO.....",
  "..OOOOHSSOO......",
  "....OLHEEOLO.....",
  "...OLLEEEbcEO....",
  "...OOOOOOOOOO...."
 ],
 "dos": [
  ".........OOO.........",
  "........OOSDOO.......",
  "......OOhSSSMSOO.....",
  "....OOMSSSSSSSSMO....",
  "....OSSSSSSSSSSSO....",
  "...OhSsSSSSSSSsSSO...",
  "..OOSSSsSSSSSsSShOO..",
  ".OEEOSSSSSSSSSSSFEEO.",
  ".OCLSSSSSSSSSSSShLCO.",
  ".OLLOSSSSSSSSSSSOLLO.",
  "..OOMMSSSSSSSShMMOO..",
  "...OMMMMHMSMMHMMMO...",
  "...OOFMMHMMMMMMOO....",
  "..OsSSSHSHMhSHSSSDO..",
  "..OSSSSSSSSSSSSSSSO..",
  ".OSSSFSSSSSSSSSDSSMO.",
  ".OSSMOMSSSSSSSMOMShO.",
  "OhSMOOFhSSMSSHDOFHSh.",
  "OHSsOOSssssssssOOShHO",
  "OcELLODOHHHHHODOCLEcO",
  "OCEhOOSMSsSSFMSOhSECO",
  ".OCCOSSSOSSSOSSSOLLO.",
  "..OOODSHMOSOMHSOOOO..",
  "...OEEELOOOOsLEECO...",
  "..OEsEELLO.OLCEEscO..",
  "..OOOOOOOO.OOOOOOOO.."
 ],
 "gauche": [
  "......OO.........",
  ".....OsDOOO......",
  "...ODsSSMSSO.....",
  "..OHSSSSsSSSO....",
  "..OShMSSSsSSHO...",
  ".OsEEEESSSSSSO...",
  ".OCCFFHSSbcMSSO..",
  "..ObOLSSDEcEOSSO.",
  ".OEEOESSSSLEOSSO.",
  "OEEEEESSFcEOMHMO.",
  "OEEEEEESSOOMMMO..",
  "OHhEEEEhHMMMMO...",
  ".OEEEEMMMMMOOO...",
  "..OCLMMFMHSSShO..",
  "....ODsCSSSSSSO..",
  "....OLEEbMMSSSSO.",
  "....OcEELhMMHSSF.",
  ".....FELhhMOSSSSO",
  "....OsMsssHObSHMO",
  "....OMHOOOOEEELO.",
  "....OMsOSOESEELO.",
  ".....OFSSSOCECD..",
  ".....OOOShHOOO...",
  "....ObSOEEHLO....",
  "...OchESEEcLLO...",
  "...OOOOOOOOOOO..."
 ]
};
const VIEWS={};
function partAt(dir,x,y){
 const side=dir==='droite'||dir==='gauche',left=dir==='gauche';
 if(y<=12)return 'head';
 if(!side){
  if(y===13&&x>=5&&x<=15)return 'head';
  if(y>=23)return x<10?'leftLeg':'rightLeg';
  if(x<=5)return 'leftArm';if(x>=15)return 'rightArm';
  if(y>=19)return 'cloth';return 'torso';
 }
 if(y===13&&((!left&&x>=10)||(left&&x<=6)))return 'head';
 if(y>=23)return x<(left?8:9)?'leftLeg':'rightLeg';
 if(y>=15&&y<=22&&x>=(left?11:1)&&x<=(left?15:5))return 'rightArm';
 if(y>=17&&y<=21&&x>=(left?4:8)&&x<=(left?7:11))return 'leftArm';
 if(y>=19)return 'cloth';return 'torso';
}
for(const [dir,rows]of Object.entries(SOURCE_VIEWS)){
 const parts={head:[],torso:[],leftArm:[],rightArm:[],cloth:[],leftLeg:[],rightLeg:[]},offset=dir==='face'||dir==='dos'?14:16;
 rows.forEach((row,y)=>[...row].forEach((key,x)=>{if(key!=='.')parts[partAt(dir,x,y)].push([x+offset,y+11,key]);}));
 VIEWS[dir]=parts;
}
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
 const v=pose(action,frame,dir),layers={},source=VIEWS[dir];
 for(const [name,pixels]of Object.entries(source)){
  let dx=0,dy=v.bob;
  if(name.endsWith('Leg')){const sign=name==='leftLeg'?1:-1;dx=v.side?Math.round(sign*v.step/2)*v.q:0;dy=sign*v.lift>0?-(Math.abs(v.lift)+(v.step===0?1:0)):0;}
  if(name==='head')dy+=v.breath;
  const minY=Math.min(...pixels.map(p=>p[1])),maxY=Math.max(...pixels.map(p=>p[1]));
  const moved=pixels.map(([x,y,key])=>{
   let px=x+dx,py=y+dy;
   if(name.endsWith('Arm')){const sign=name==='leftArm'?1:-1,t=(y-minY)/Math.max(1,maxY-minY),swing=v.step*sign;
    px+=Math.round((v.side?swing*v.q:sign*Math.abs(swing)*.3)*t);py+=Math.round((v.side?-Math.abs(swing)*.25:swing*.4)*t);
    if(name==='rightArm'&&v.gesture){px-=Math.round(v.q*v.gesture*t);py-=Math.round(v.gesture*t);}
   }
   return [px,py,key];
  });
  if(name.endsWith('Leg')&&(dx||dy!==v.bob)){
   const top=pixels.filter(p=>p[1]===minY),cx=Math.round(top.reduce((n,p)=>n+p[0],0)/top.length),ay=minY-2+v.bob,by=minY+dy;
   for(let y=Math.min(ay,by);y<=Math.max(ay,by);y++){const t=ay===by?1:(y-ay)/(by-ay),x=cx+Math.round(dx*t);for(let w=-1;w<=1;w++)moved.unshift([x+w,y,w===-1?'O':'H']);}
  }
  layers[name]=moved;
 }
 layers.neck=[];
 // A hidden fur bridge keeps the head and shoulders joined during breathing.
 if(v.breath){const side=dir==='droite'||dir==='gauche',x0=side?23:21,x1=side?27:28;for(let y=23+v.bob+v.breath;y<=26+v.bob;y++)for(let x=x0;x<=x1;x++)layers.neck.push([x,y,'H']);}
 // Foreground hands are never painted behind the chest; canonical idle stays exact.
 const order=['neck','leftLeg','rightLeg','torso','cloth','head','leftArm','rightArm'];
 return {layers,order,anchor:[24,36],dir,action,frame};
}
function draw(ctx,{action='idle',dir='face',frame=0,x=0,y=0,layer=null,palette=PALETTE,format='native'}={}){const r=renderLayers(action,dir,frame),offset=format==='engine'?16:0;ctx.imageSmoothingEnabled=false;for(const name of layer?[layer]:r.order){if(!r.layers[name])throw new RangeError('Calque inconnu');for(const [px,py,key]of r.layers[name]){ctx.fillStyle=palette[key];ctx.fillRect(Math.round(x)+px+offset,Math.round(y)+py+offset,1,1);}}return r;}
return {VERSION:'1.0.0',author:'Codex / ChatGPT',PALETTE,SOURCE_VIEWS,VIEWS,CLIPS,directions:['face','droite','dos','gauche'],frameSize:48,anchor:[24,36],engineFrameSize:80,engineAnchor:[40,52],directionName,frameAt,renderLayers,draw};
});
