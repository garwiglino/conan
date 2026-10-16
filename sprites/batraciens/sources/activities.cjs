'use strict';
// Durées en millisecondes. Les événements sont des repères VISUELS, sans effet de jeu automatique.
const activities = {
 idle: ['Repos','commun',8,true,null,[]],
 walk: ['Marche','commun',8,true,18,[]],
 talk: ['Parler','social',8,true,null,[]],
 carry_idle: ['Tenir une caisse à l’arrêt','manutention',8,true,null,[]],
 carry: ['Porter une caisse','manutention',8,true,18,[]],
 load: ['Soulever une caisse','manutention',8,false,null,[[4,'grasp'],[7,'carried']]],
 unload: ['Déposer une caisse','manutention',8,false,null,[[4,'release'],[7,'placed']]],
 sit_down: ["S’asseoir",'social',8,false,null,[[7,'seated']]],
 seated: ['Repos assis','social',8,true,null,[]],
 stand_up: ['Se relever','social',8,false,null,[[7,'standing']]],
 startle: ['Sursaut','reaction',6,false,null,[]],
 flee: ['Fuir','reaction',8,true,22,[]],
 cower_enter: ['Se recroqueviller','reaction',6,false,null,[]],
 cower_exit: ['Sortir de l’abri des bras','reaction',6,false,null,[]],
 cower: ['Se protéger','reaction',8,true,null,[]],
 hit: ['Coup reçu','reaction',6,false,null,[]],
 death: ['Chute / mort','reaction',12,false,null,[[9,'ground_contact']]],
 fish_cast: ['Lancer la ligne','peche',8,false,null,[[4,'cast']]],
 fish_wait: ['Attendre une touche','peche',8,true,null,[]],
 fish_reel: ['Ramener la prise','peche',10,false,null,[[5,'retrieve']]],
 fish_spear: ['Pêcher au harpon','peche',8,true,null,[[4,'fishing_attempt']]],
 net: ['Réparer un filet','peche',8,true,null,[[5,'knot']]],
 punt: ['Pousser à la perche','navigation',8,true,null,[[2,'pole_planted'],[6,'pole_lifted']]],
 rice: ['Repiquer le riz','agriculture',8,true,null,[[4,'plant']]],
 harvest: ['Couper les roseaux / récolter','agriculture',8,true,null,[[4,'cut']]],
 weave: ['Tresser un panier','artisanat',8,true,null,[[5,'weave_pass']]],
 rope: ['Lover un cordage','navigation',8,true,null,[[5,'coil']]],
 hoe: ['Travailler la terre','agriculture',8,true,null,[[4,'ground_contact']]],
 sow: ['Semer','agriculture',8,true,null,[[4,'scatter']]],
 gather: ['Cueillir des plantes','agriculture',8,true,null,[[4,'gather']]],
 craft: ['Travailler à l’établi','artisanat',8,true,null,[[4,'tool_contact']]],
 pottery: ['Façonner une poterie','artisanat',8,true,null,[[5,'shape']]],
 stir: ['Remuer une préparation','artisanat',8,true,null,[[5,'stir']]],
 ledger: ['Consulter / écrire un registre','commerce',8,true,null,[[5,'write']]],
 eat: ['Manger','quotidien',8,true,null,[[4,'bite']]],
 drink: ['Boire','quotidien',8,true,null,[[4,'sip']]],
 sleep: ['Dormir','quotidien',8,true,null,[]]
};
const overrides={
 idle:[1300,220,380,320,650,100,130,1200],walk:[63,62,63,62,63,62,63,62],carry:[100,100,100,100,100,100,100,100],
 flee:[45,45,45,45,45,45,45,45],startle:[90,75,85,110,140,220],hit:[55,70,80,100,130,200],
 death:[100,100,110,110,110,120,120,140,140,160,190,300],
 fish_cast:[150,110,100,80,100,120,160,230], fish_wait:[550,450,500,500,550,450,500,500],
 fish_reel:[200,140,140,120,140,170,180,170,170,270],
 sit_down:[110,100,100,100,120,120,140,160], stand_up:[160,140,120,120,100,100,100,110],
 sleep:[700,400,500,600,700,400,500,600]
};
module.exports=Object.fromEntries(Object.entries(activities).map(([id,[label,group,frames,loop,stride,events]])=>{
 const durations=overrides[id]||Array(frames).fill(150);const duration=durations.reduce((a,b)=>a+b,0);
 return [id,{label,group,frames,durations,loop,stride,duration,rootMotion:'none',
  groundLocked:stride===null,terminal:!loop,
  phases: ['idle','walk','carry','carry_idle','flee','seated','sleep','fish_wait'].includes(id)?[{name:'loop',from:0,to:frames-1}]:[
   {name:'preparation',from:0,to:Math.max(1,Math.floor(frames*.25)-1)},
   {name:'action',from:Math.max(2,Math.floor(frames*.25)),to:Math.floor(frames*.75)-1},
   {name:'recovery',from:Math.floor(frames*.75),to:frames-1}],
  markers:events.map(([frame,name])=>({name,frame,atMs:durations.slice(0,frame).reduce((a,b)=>a+b,0)}))}];
}));
