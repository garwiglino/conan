'use strict';
/* Teremor : petits décors peints au sol (fleurs, trèfle, cailloux, feuilles,
 * brindilles), dans les rampes du rendu mûr. */
const {Grid,stamp}=require('./brushes.cjs');
const ART=[
 // Pâquerettes
 {art:['.a...','aba.a','.a.ab','...a.'],map:{a:'fleurm0',b:'fleurm2'},anchor:[2,2]},
 // Boutons d'or
 {art:['.a.','aba','.c.'],map:{a:'fleurm2',b:'fleurm3',c:'pre3'},anchor:[1,1]},
 {art:['a..a','bc.b','.c..'],map:{a:'fleurm2',b:'fleurm3',c:'pre3'},anchor:[1,1]},
 // Campanules
 {art:['.a..a','ab.ab','.c..c'],map:{a:'fleurm4',b:'fleurm5',c:'pre3'},anchor:[2,1]},
 // Trèfle
 {art:['ab.','bcb','.b.'],map:{a:'pre9',b:'pre8',c:'pre6'},anchor:[1,1]},
 // Cailloux
 {art:['.ab','acd','.dd'],map:{a:'roc8',b:'roc6',c:'roc4',d:'pre2'},anchor:[1,1]},
 {art:['ab..','cd.a','...d'],map:{a:'roc7',b:'roc5',c:'roc5',d:'pre2'},anchor:[1,1]},
 // Feuilles mortes et brindille
 {art:['.ab','abc','c..'],map:{a:'briquem6',b:'briquem5',c:'humus3'},anchor:[1,1]},
 {art:['aab.','.bbc'],map:{a:'humus7',b:'humus6',c:'humus3'},anchor:[1,1]},
 {art:['ab...','.aab.','...ab'],map:{a:'ecorcem5',b:'ecorcem3'},anchor:[2,1]}
];
function decals(){return ART.map(({art,map,anchor})=>{const g=new Grid(Math.max(...art.map(r=>r.length)),art.length);stamp(g,0,0,art,map);g.anchor=anchor;return g;});}
module.exports={decals};
