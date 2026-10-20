'use strict';
/* Rassemble les grilles de Teremor au format du compositeur (palette indexée). */
const P=require('./palette.cjs'),pieces=require('./teremor-pieces.cjs'),ground=require('./teremor-ground.cjs'),cliffs=require('./teremor-cliffs.cjs'),{decals}=require('./teremor-decals.cjs');
const b64=a=>Buffer.from(a).toString('base64');
function pack(g,{height=true}={}){return {w:g.w,h:g.h,px:b64(g.px),ht:height?b64(Uint8Array.from(g.ht,v=>Math.round(Math.max(0,Math.min(1,v))*255))):null};}
// Couleurs de référence des niveaux de forme (édition Piskel) : herbe, bord, bord, cœur.
const LEVELS=[['herbe4','terre3','terre4','terre5'],['herbe4','pierre2','pierre3','pierre4'],['herbe4','eau2','eau3','eau4']];
const PIECE_SETS=()=>({chemin:pieces.set({half:9,colours:LEVELS[0]}),pave:pieces.set({half:11,colours:LEVELS[1]}),ruisseau:pieces.set({half:12,meander:3.5,swell:1.5,colours:LEVELS[2]})});
function grids(){
 return {
  grass:ground.grass(),dirt:ground.dirt(),cobble:ground.cobbles(),water:ground.water(),litter:ground.litter(),
  bank:ground.dirt({seed:7,base:5,pebbles:1.2}),plank:ground.planks(),cliffS:cliffs.face({seed:61}),cliffE:cliffs.face({seed:62,lit:false})
 };
}
function assets(G=grids(),D=decals()){
 const textures={};for(const [k,g]of Object.entries(G))textures[k]=pack(g,{height:!k.startsWith('cliff')&&k!=='water'});
 return {palette:P.hexes,names:P.list.map(c=>c.name),toneOf:P.list.map(c=>[c.ramp,c.tone]),ramps:Object.fromEntries(Object.entries(P.RAMPS).map(([k,v])=>[k,v.length])),textures,
  decals:D.map(g=>({w:g.w,h:g.h,ax:g.anchor[0],ay:g.anchor[1],px:b64(g.px)})),decalRate:.08,
  pieces:Object.fromEntries(Object.entries(PIECE_SETS()).map(([k,list])=>[k,list.map(g=>({mask:g.mask,w:64,h:32,px:b64(g.px)}))])),
  levelOf:Object.fromEntries(LEVELS.flatMap(cols=>cols.map((n,i)=>[P.id(n),i/3])).filter(([,v])=>v>0))};
}
module.exports={grids,assets,pack,PIECE_SETS,LEVELS};
