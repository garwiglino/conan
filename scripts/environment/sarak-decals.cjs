'use strict';
/* Sarak : petits décors peints sur le sable (cailloux, brindilles, plantes
 * grasses, traces, sel, fleur du désert), dans les rampes du rendu mûr. */
const {Grid,stamp}=require('./brushes.cjs');
const ART=[
 // Cailloux de grès
 {art:['.ab','acd','.dd'],map:{a:'gresrouge8',b:'gresrouge6',c:'gresrouge4',d:'dune5'},anchor:[1,1]},
 // Cailloux gris
 {art:['ab..','cd.a','...d'],map:{a:'roc8',b:'roc6',c:'roc4',d:'dune5'},anchor:[1,1]},
 // Brindille sèche
 {art:['a....','.ab..','...bb'],map:{a:'gresm7',b:'gresm5'},anchor:[2,1]},
 // Plante grasse
 {art:['.a.a','babc','.cc.'],map:{a:'palmier8',b:'palmier6',c:'palmier3'},anchor:[1,1]},
 // Traces de lézard
 {art:['a.a....','...a.a.','.....a.a'],map:{a:'dune6'},anchor:[3,1]},
 // Croûte de sel
 {art:['.aa.','abba','.aa.'],map:{a:'battue9',b:'battue8'},anchor:[2,1]},
 // Fleur du désert
 {art:['.a.','aba','.c.'],map:{a:'fleurm4',b:'fleurm2',c:'palmier5'},anchor:[1,1]}
];
function decals(){return ART.map(({art,map,anchor})=>{const g=new Grid(Math.max(...art.map(r=>r.length)),art.length);stamp(g,0,0,art,map);g.anchor=anchor;return g;});}
module.exports={decals};
