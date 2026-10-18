/* Hearthreaver — homme-singe : transcription du concept validé le 18/10/2026.
 * Codex / ChatGPT. Pixels indexés natifs, quatre vues tracées indépendamment.
 * Dessin canonique : SOURCE_VIEWS ; animation par membres séparés.
 * Cellule native 48×48, ancre (24,36) ; moteur 80×80, ancre (40,52).
 * Aucun PNG embarqué ni miroir ; aucun remplacement des autres PNJ.
 */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.HearthreaverApe=factory();})(globalThis,function(){
'use strict';
const PALETTE={"O":"#080616","D":"#28171e","F":"#4a2b2a","M":"#5f3530","H":"#6b3c33","h":"#7d4736","S":"#894e38","s":"#a16241","b":"#ae7b53","L":"#c88b56","C":"#cf9860","c":"#e0b478","E":"#ecc381"};
// Material palettes keep leather independent from fur and bare skin.
const TONES={
 brun:{label:'Brun chaud',fur:null,skin:null},
 ebene:{label:'Ébène',fur:['080616','17151e','25232a','34303a','403940','4b4248','574d51','685d5f','7b6d6d','8d7d7b','9d8c85','b2a196','c7b8a6'],skin:['080616','241b22','3c292a','503632','5e4038','704c3e','835a46','976b50','ac7e5d','bf9169','cda276','deb88a','edcf9f']},
 cendre:{label:'Gris cendré',fur:['080616','24232e','373641','464550','53515c','62606a','74717a','87838b','99959a','aaa5a7','bab5b5','cbc6c1','dfd9cd'],skin:['080616','2d2027','4a3435','61463e','735345','86634f','987359','ac8665','bd9873','cba981','d8b88e','e5c89e','efdab4']},
 roux:{label:'Roux cuivré',fur:['080616','302027','542c2b','6b352b','7d3e2b','914a2e','a75b33','bd703a','ce8646','de9c55','e8ae65','f0c17b','f5d494'],skin:['080616','2e2026','50362e','694835','7b573c','8f6846','a17a52','b58f60','c7a270','d6b37d','e2c08b','edce9b','f6dfaf']},
 sable:{label:'Fauve sable',fur:['080616','33282b','554137','6d5140','7e5e46','926e4e','a58159','b79667','c8a876','d7b986','e3c797','eed5aa','f6e5c0'],skin:['080616','302329','50372f','684b38','7c5b40','906d49','a07e54','b18f60','c2a16d','d0b17c','ddbf8c','e8ce9d','f2ddb2']}
};
const toneCache=new Map();
function paletteFor(tone='brun'){
 if(!Object.hasOwn(TONES,tone))throw new RangeError('Teinte inconnue');if(toneCache.has(tone))return toneCache.get(tone);
 const def=TONES[tone],keys=Object.keys(PALETTE),fur={},skin={};keys.forEach((k,i)=>{fur[k]=def.fur?'#'+def.fur[i]:PALETTE[k];skin[k]=def.skin?'#'+def.skin[i]:PALETTE[k];});
 const result=Object.freeze({...fur,skin:Object.freeze(skin),cloth:PALETTE});toneCache.set(tone,result);return result;
}
function appearanceFor(id,provided={}){let h=2166136261;for(const c of String(id))h=Math.imul(h^c.charCodeAt(0),16777619);h>>>=0;const tone=provided.tone||Object.keys(TONES)[h%5];
 const selectedSex=provided.sex||((h>>>8)%2?'female':'male');paletteFor(tone);if(!['male','female'].includes(selectedSex))throw new RangeError('Sexe inconnu');return {tone,sex:selectedSex};}
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
const FEMALE_SOURCE_VIEWS=Object.fromEntries(Object.entries(SOURCE_VIEWS).map(([dir,rows])=>[dir,rows.slice()]));
// A related adult silhouette: rounded crown and brow, closer shoulders; no
// eyelashes, lipstick or sex-specific skin colors. Same anchor and joints.
for(const dir of ['face','dos']){
 const rows=FEMALE_SOURCE_VIEWS[dir];rows[0]='.....................';rows[1]='.........OOO.........';rows[2]='.......OOsSsOO.......';
 if(dir==='face'){rows[5]='...OSSbsSSSSSbbSSO...';rows[6]='..OOsSEEESSSEEESsOO..';}
}
for(const dir of ['droite','gauche']){const rows=FEMALE_SOURCE_VIEWS[dir];rows[0]='.................';rows[1]=dir==='droite'?'.......OOssOO....':'....OOssOO.......';}
function partAt(dir,x,y){
 const side=dir==='droite'||dir==='gauche',left=dir==='gauche';
 if(y<=12)return 'head';
 if(!side){if(y===13&&x>=5&&x<=15)return 'head';if(y>=23)return x<10?'leftLeg':'rightLeg';if(x<=5)return 'leftArm';if(x>=15)return 'rightArm';if(y>=19)return 'cloth';return 'torso';}
 if(y===13&&((!left&&x>=10)||(left&&x<=6)))return 'head';if(y>=23)return x<(left?8:9)?'leftLeg':'rightLeg';
 if(y>=15&&y<=22&&x>=(left?11:1)&&x<=(left?15:5))return 'rightArm';
 if(y>=17&&y<=21&&x>=(left?4:8)&&x<=(left?7:11))return 'leftArm';if(y>=19)return 'cloth';return 'torso';
}
function materialAt(dir,x,y,key,part){
 if(part==='cloth')return 'cloth';if(key==='O'||key==='D')return 'fur';
 if(y>=23)return ['E','c','C','L','b'].includes(key)?'skin':'fur';
 if(y<=13)return ['E','c','C','L'].includes(key)?'skin':'fur';
 if(y>=18&&['E','c','C','L','b'].includes(key)&&part.endsWith('Arm'))return 'skin';
 if(part==='torso'&&['E','c','C','L','b'].includes(key))return 'skin';return 'fur';
}
function buildRig(views,sex){const result={};for(const [dir,rows]of Object.entries(views)){
 const parts={head:[],torso:[],leftArm:[],rightArm:[],cloth:[],leftLeg:[],rightLeg:[]},offset=dir==='face'||dir==='dos'?14:16;
 rows.forEach((row,y)=>[...row].forEach((key,x)=>{if(key==='.')return;const name=partAt(dir,x,y);let px=x+offset,material=materialAt(dir,x,y,key,name);
  if(sex==='female'){
   if(name.endsWith('Arm')){const upper=y<=17;if(upper&&(dir==='face'||dir==='dos'))px+=name==='leftArm'?1:-1;}
   // Plain base chest wrap, with its own leather colors, follows the torso.
   if(name==='torso'&&y>=16&&y<=17&&material==='skin'){material='cloth';key=y===16?'s':'H';}
  }
  parts[name].push([px,y+11,key,material]);
 }));result[dir]=parts;
}return result;}
const VIEWS=buildRig(SOURCE_VIEWS,'male'),FEMALE_VIEWS=buildRig(FEMALE_SOURCE_VIEWS,'female');
const CLIPS={idle:{durations:[450,220,350,260],loop:true},walk:{durations:[100,90,90,100,100,90,90,100],loop:true,stride:24},flee:{durations:[75,65,65,75,75,65,65,75],loop:true,stride:32},talk:{durations:[300,120,240,260],loop:true}};
const GAIT=[{step:2,lift:0},{step:1,lift:1,bob:-1},{step:0,lift:1},{step:-1,lift:0,bob:1},{step:-2,lift:0},{step:-1,lift:-1,bob:-1},{step:0,lift:-1},{step:1,lift:0,bob:1}];
function directionName(d){const key=typeof d==='number'?['dos','droite','face','gauche'][d]:d;if(!VIEWS[key])throw new RangeError('Direction inconnue');return key;}
function frameAt(action,time=0,distance){const clip=CLIPS[action];if(!clip)throw new RangeError('Animation inconnue');const total=clip.durations.reduce((a,b)=>a+b,0);let ms=clip.stride&&distance!==undefined?((distance%clip.stride+clip.stride)%clip.stride)/clip.stride*total:((time*1000)%total+total)%total;for(let i=0;i<clip.durations.length;i++){ms-=clip.durations[i];if(ms<0)return i;}return 0;}
function pose(action,frame,dir){
 const walk=action==='walk'||action==='flee',g=walk?GAIT[frame]:{},side=dir==='droite'||dir==='gauche',q=dir==='gauche'?-1:1,fast=action==='flee'?1.5:1;
 const step=Math.round((g.step||0)*fast),bob=walk?Math.max(-1,Math.min(1,g.bob||0)):0,breath=action==='idle'&&[1,2].includes(frame)?-1:0,gesture=action==='talk'?[0,1,2,1][frame]:0;
 // Stance travels backward relative to the facing direction; swing returns forward.
 const headShift=breath+(walk?[0,0,-1,-1,0,0,-1,-1][frame]:0);
 return {step,bob,breath,headShift,gesture,side,q,lift:-(g.lift||0),blink:action==='idle'&&frame===2};
}

function renderLayers(action='idle',dir='face',frame=0,sex='male'){
 if(!['male','female'].includes(sex))throw new RangeError('Sexe inconnu');
 dir=directionName(dir);if(!CLIPS[action]||!Number.isInteger(frame)||frame<0||frame>=CLIPS[action].durations.length)throw new RangeError('Frame invalide');
 const v=pose(action,frame,dir),layers={},source=(sex==='female'?FEMALE_VIEWS:VIEWS)[dir];
 for(const [name,pixels]of Object.entries(source)){
  let dx=0,dy=v.bob;
  if(name.endsWith('Leg')){const sign=name==='leftLeg'?1:-1;dx=v.side?Math.round(sign*v.step/2)*v.q:0;dy=sign*v.lift>0?-(Math.abs(v.lift)+(v.step===0?1:0)):0;}
  if(name==='head')dy+=v.headShift;
  const minY=Math.min(...pixels.map(p=>p[1])),maxY=Math.max(...pixels.map(p=>p[1]));
  const moved=pixels.map(([x,y,key,material])=>{
   let px=x+dx,py=y+dy;
   if(name.endsWith('Arm')){const sign=name==='leftArm'?1:-1,t=(y-minY)/Math.max(1,maxY-minY),swing=-v.step*sign;
    px+=Math.round((v.side?swing*v.q:sign*Math.abs(swing)*.3)*t);py+=Math.round((v.side?-Math.abs(swing)*.25:swing*.4)*t);
    if(name==='rightArm'&&v.gesture){px-=Math.round(v.q*v.gesture*t);py-=Math.round(v.gesture*t);}
   }
   return [px,py,key,material];
  });
  if(name.endsWith('Leg')&&(dx||dy!==v.bob)){
   const top=pixels.filter(p=>p[1]===minY),cx=Math.round(top.reduce((n,p)=>n+p[0],0)/top.length),ay=minY-2+v.bob,by=minY+dy;
   for(let y=Math.min(ay,by);y<=Math.max(ay,by);y++){const t=ay===by?1:(y-ay)/(by-ay),x=cx+Math.round(dx*t);for(let w=-1;w<=1;w++)moved.unshift([x+w,y,w===-1?'O':'H']);}
  }
  layers[name]=moved;
 }
 layers.neck=[];
 // A hidden fur bridge keeps the head and shoulders joined during breathing.
 if(v.headShift){const side=dir==='droite'||dir==='gauche',x0=side?23:21,x1=side?27:28;for(let y=23+v.bob+v.headShift;y<=26+v.bob;y++)for(let x=x0;x<=x1;x++)layers.neck.push([x,y,'H']);}
 // Foreground hands are never painted behind the chest; canonical idle stays exact.
 const order=['neck','leftLeg','rightLeg','torso','cloth','head','leftArm','rightArm'];
 return {layers,order,anchor:[24,36],dir,action,frame};
}
function draw(ctx,{action='idle',dir='face',frame=0,x=0,y=0,layer=null,palette=null,tone='brun',sex='male',format='native'}={}){const colors=palette||paletteFor(tone),r=renderLayers(action,dir,frame,sex),offset=format==='engine'?16:0;ctx.imageSmoothingEnabled=false;for(const name of layer?[layer]:r.order){if(!r.layers[name])throw new RangeError('Calque inconnu');for(const [px,py,key,material]of r.layers[name]){ctx.fillStyle=material==='cloth'?(colors.cloth||PALETTE)[key]:material==='skin'?(colors.skin||colors)[key]:colors[key];ctx.fillRect(Math.round(x)+px+offset,Math.round(y)+py+offset,1,1);}}return r;}
return {VERSION:'1.1.0',author:'Codex / ChatGPT',PALETTE,TONES,paletteFor,appearanceFor,SOURCE_VIEWS,FEMALE_SOURCE_VIEWS,VIEWS,FEMALE_VIEWS,CLIPS,directions:['face','droite','dos','gauche'],frameSize:48,anchor:[24,36],engineFrameSize:80,engineAnchor:[40,52],directionName,frameAt,renderLayers,draw};
});
