'use strict';
/* Teremor : petits décors peints au sol (fleurs, trèfle, cailloux). */
const {Grid,stamp}=require('./brushes.cjs');
const ART=[
 // Pâquerettes
 {art:['.a...','aba.a','.a.ab','...a.'],map:{a:'fleur0',b:'fleur1'},anchor:[2,2]},
 // Boutons d'or
 {art:['.a.','aba','.c.'],map:{a:'fleur1',b:'fleur2',c:'herbe3'},anchor:[1,1]},
 {art:['a..a','bc.b','.c..'],map:{a:'fleur1',b:'fleur2',c:'herbe3'},anchor:[1,1]},
 // Campanules
 {art:['.a..a','ab.ab','.c..c'],map:{a:'fleur4',b:'fleur5',c:'herbe3'},anchor:[2,1]},
 // Trèfle
 {art:['ab.','bcb','.b.'],map:{a:'herbe7',b:'herbe6',c:'herbe5'},anchor:[1,1]},
 // Cailloux
 {art:['.ab','acd','.dd'],map:{a:'pierre5',b:'pierre4',c:'pierre3',d:'herbe2'},anchor:[1,1]},
 {art:['ab..','cd.a','...d'],map:{a:'pierre4',b:'pierre3',c:'pierre3',d:'herbe2'},anchor:[1,1]}
];
function decals(){return ART.map(({art,map,anchor})=>{const g=new Grid(Math.max(...art.map(r=>r.length)),art.length);stamp(g,0,0,art,map);g.anchor=anchor;return g;});}
module.exports={decals};
