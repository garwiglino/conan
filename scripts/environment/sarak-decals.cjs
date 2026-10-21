'use strict';
/* Sarak : petits décors peints sur le sable (cailloux, brindilles, plantes
 * grasses, traces, sel, fleur du désert). */
const {Grid,stamp}=require('./brushes.cjs');
const ART=[
 // Cailloux de grès
 {art:['.ab','acd','.dd'],map:{a:'ocre6',b:'ocre5',c:'ocre3',d:'sable3'},anchor:[1,1]},
 // Cailloux gris
 {art:['ab..','cd.a','...d'],map:{a:'pierre5',b:'pierre4',c:'pierre3',d:'sable3'},anchor:[1,1]},
 // Brindille sèche
 {art:['a....','.ab..','...bb'],map:{a:'bois5',b:'bois3'},anchor:[2,1]},
 // Plante grasse
 {art:['.a.a','babc','.cc.'],map:{a:'sauge4',b:'sauge3',c:'sauge1'},anchor:[1,1]},
 // Traces de lézard
 {art:['a.a....','...a.a.','.....a.a'],map:{a:'sable4'},anchor:[3,1]},
 // Croûte de sel
 {art:['.aa.','abba','.aa.'],map:{a:'piste6',b:'piste5'},anchor:[2,1]},
 // Fleur du désert
 {art:['.a.','aba','.c.'],map:{a:'fleur3',b:'fleur1',c:'sauge2'},anchor:[1,1]}
];
function decals(){return ART.map(({art,map,anchor})=>{const g=new Grid(Math.max(...art.map(r=>r.length)),art.length);stamp(g,0,0,art,map);g.anchor=anchor;return g;});}
module.exports={decals};
