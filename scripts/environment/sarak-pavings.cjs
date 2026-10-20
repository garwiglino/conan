'use strict';
/* Sarak : pavages des villes du désert, mêmes motifs et même ombrage que
 * Teremor (arête claire en haut à gauche, joint sombre en bas à droite),
 * couleurs du désert : grès et pisé jointoyés au sable, tomettes de terre
 * cuite, carreaux crème à cabochons émaillés turquoise. */
const {paving}=require('./teremor-pavings.cjs');
const STYLE={
 // Rues : pavés de grès en rangs, joints remplis de sable.
 setts:{joint:['sable3','sable2'],kinds:[[.6,['gres3','gres2','gres1']],[.9,['gres4','gres3','gres2']],[1,['pise3','pise2','pise1']]]},
 // Places : grandes dalles de pisé et de grès, quelques dalles rouges.
 flags:{joint:['sable3','pise0'],kinds:[[.62,['pise4','pise3','pise2']],[.9,['gres3','gres2','gres1']],[1,['ocre6','ocre5','ocre4']]],cracks:true},
 // Tomettes hexagonales de terre cuite.
 hex:{joint:['pise1','brique0'],kinds:[[.55,['brique3','brique2','brique1']],[.85,['brique4','brique3','brique2']],[1,['ocre5','ocre4','ocre3']]]},
 // Carreaux crème à cabochons : l'émail turquoise ou cobalt marque chaque coin.
 cabochon:{joint:['pise1','pise0'],kinds:s=>s.inset?[[.55,['zellige3','zellige2','zellige1']],[1,['zellige4','zellige3','zellige2']]]:[[.6,['pise4','pise3','pise2']],[.92,['gres4','gres3','gres2']],[1,['pise3','pise2','pise1']]]}
};
// Identifiant de texture -> fichier Piskel.
const PAVINGS={setts:'paves-rangs',flags:'dalles',hex:'tomettes',cabochon:'cabochons'};
const sarakPaving=(kind,opt={})=>paving(kind,{...opt,style:STYLE[kind]});
module.exports={STYLE,PAVINGS,paving:sarakPaving};
if(require.main===module){const {save}=require('./png.cjs');save((process.argv[2]||'.')+'/sarak-pavages.png',Object.keys(STYLE).map(k=>sarakPaving(k)),{scale:3,cols:2,gap:4,bg:'#111'});console.log('ok');}
