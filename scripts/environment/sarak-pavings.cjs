'use strict';
/* Sarak : pavages des villes du désert, mêmes motifs et même rendu mûr que
 * Teremor (arête claire en haut à gauche, joint sombre en bas à droite,
 * grain tramé, usure), couleurs du désert : grès jointoyé au sable, dalles
 * de terre battue fêlées, tomettes de terre cuite, carreaux crème à
 * cabochons émaillés turquoise. */
const M=require('./matiere.cjs'),{paving}=require('./teremor-pavings.cjs');
/* Pierre : kinds = [[seuil, rampe, ton]] choisis par le hasard de la pierre
 * (inset : rampe et ton de l'émail des cabochons). */
const stone=(kinds,{grain=1.3,crack=0,inset=null,size})=>({s,x,y,r,edge,deep})=>{
 const [,ramp,b]=s.inset&&inset?inset:kinds.find(k=>r<k[0]);
 let t=b+(edge?1.3:deep?-1.2:0)+(M.snoise(x,y,2,Math.floor(r*997),size[0],size[1])-.5)*grain;if(M.hash(x,y,11)<.035)t-=1.4;
 if(crack&&r<crack&&Math.abs(s.along-s.size[0]*.55+(s.across-s.size[1]*.5)*.9)<.5)return [M.tone(ramp,Math.max(0,b-3)),.85];
 return [M.dtone(ramp,M.clamp(t,0,M.rampLen(ramp)-1),x,y),edge?.95:.9];};
const joint=(ramp,a,b)=>(x,y,c)=>M.tone(ramp,c?b:a);
const STYLE={
 // Rues : pavés de grès en rangs, quelques pierres rouges, joints remplis de sable.
 setts:{joint:joint('dune',5,3),shader:stone([[.62,'gresm',5.6],[.9,'gresm',6.6],[1,'gresrouge',6]],{size:[192,96]})},
 // Places : grandes dalles de terre battue et de grès, fêlures.
 flags:{joint:joint('dune',4,2),shader:stone([[.6,'battue',6.4],[.9,'gresm',6],[1,'gresrouge',6.4]],{crack:.2,size:[128,64]})},
 // Tomettes hexagonales de terre cuite.
 hex:{joint:joint('gresrouge',2,1),shader:stone([[.55,'briquem',5],[.85,'briquem',6],[1,'gresrouge',7]],{grain:1.1,size:[160,80]})},
 // Carreaux crème à cabochons : l'émail turquoise marque chaque coin.
 cabochon:{joint:joint('battue',3,2),shader:stone([[.6,'gresm',7.4],[.92,'battue',7.6],[1,'gresm',6.4]],{inset:[1,'bleu',6.6],size:[192,96]})}
};
// Identifiant de texture -> fichier Piskel.
const PAVINGS={setts:'paves-rangs',flags:'dalles',hex:'tomettes',cabochon:'cabochons'};
const sarakPaving=(kind,opt={})=>paving(kind,{...opt,style:STYLE[kind]});
module.exports={STYLE,PAVINGS,paving:sarakPaving};
if(require.main===module){const {save}=require('./png.cjs');save((process.argv[2]||'.')+'/sarak-pavages.png',Object.keys(STYLE).map(k=>sarakPaving(k)),{scale:3,cols:2,gap:4,bg:'#111'});console.log('ok');}
