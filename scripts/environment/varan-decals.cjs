'use strict';
/* Varan : petits décors peints sur la jonchaie (flaques, iris, salicaires,
 * mousse, brindilles, plume, champignons minuscules, os de héron). */
const {Grid,stamp}=require('./brushes.cjs');
const ART=[
 // Flaques : ciel pâle sur le bord lointain, eau noire, lèvre de vase.
 {art:['..aaaa...','.abbbbba.','cbdddddbc','.cdddddc.','..cccc...'],map:{a:'vase7',b:'marais8',c:'vase2',d:'marais2'},anchor:[4,2]},
 {art:['.aaa..','abbbaa','cdddbc','.cccc.'],map:{a:'vase7',b:'marais7',c:'vase2',d:'marais3'},anchor:[3,2]},
 {art:['...aa.....','.aabbaaa..','abbdddbbac','cdddddddc.','.ccddcc...','...cc.....'],map:{a:'vase7',b:'marais8',c:'vase2',d:'marais2'},anchor:[4,3]},
 // Iris jaunes : lames vertes et fleurs.
 {art:['.a..a.','.b.ab.','.cbcc.','.c.c..','.dcd..'],map:{a:'iris4',b:'iris3',c:'frondaison6',d:'frondaison3'},anchor:[2,4]},
 // Salicaires : épis pourpres.
 {art:['a..','b.a','cab','c.c','dc.'],map:{a:'iris2',b:'iris1',c:'frondaison5',d:'frondaison3'},anchor:[1,4]},
 // Coussins de mousse.
 {art:['.ab.','abbc','.ccd'],map:{a:'mousse4',b:'mousse3',c:'mousse2',d:'mousse0'},anchor:[1,1]},
 // Brindilles et jonc couché.
 {art:['a.....','.ab...','...bb.','.....c'],map:{a:'tourbe6',b:'tourbe5',c:'tourbe3'},anchor:[2,2]},
 {art:['aab...','...bbc'],map:{a:'jonc9',b:'jonc8',c:'jonc6'},anchor:[2,1]},
 // Plume de héron.
 {art:['..a','.ab','ab.','c..'],map:{a:'iris5',b:'roc8',c:'roc6'},anchor:[1,2]},
 // Champignons minuscules.
 {art:['ab.a','cd.c'],map:{a:'vase10',b:'vase8',c:'vase5',d:'vase4'},anchor:[1,1]},
 // Os de héron blanchi.
 {art:['a....','.bbb.','....a'],map:{a:'roc9',b:'roc8'},anchor:[2,1]}
];
function decals(){return ART.map(({art,map,anchor})=>{const g=new Grid(Math.max(...art.map(r=>r.length)),art.length);stamp(g,0,0,art,map);g.anchor=anchor;return g;});}
module.exports={decals};
