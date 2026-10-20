'use strict';
/* Palette commune de l'environnement. Les rampes vont du sombre froid (violet,
 * bleu-vert) au clair chaud (jaune, crème), comme celles de l'architecture.
 * Pierre, écorce, mousse, brique et grès reprennent exactement les rampes des
 * bâtiments. Les nouvelles rampes s'ajoutent à la fin (indices stables). */
const RAMPS={
 herbe:   ['#1d2a2a','#26392f','#314a33','#3f5d37','#4f703b','#638540','#7d9a48','#a2b45e'],
 terre:   ['#2a2128','#3d2e2c','#544033','#6b543c','#836a47','#9c8356','#b89e6b'],
 litiere: ['#3a2e29','#55402f','#6f5534','#8a6c3d'],
 pierre:  ['#23212b','#33323e','#50505b','#72717a','#96918b','#b9b1a0','#d5ccb6'],
 mousse:  ['#2d3830','#43513a','#657046','#899153','#aeb773'],
 eau:     ['#142331','#1b3443','#234755','#2c5b66','#3a7277','#578e89','#8bb6a5','#cde2cc'],
 ecorce:  ['#302830','#514036','#79573b','#a37748','#c69b60'],
 tronc:   ['#24282c','#3b3e3b','#5d5d4b','#838063','#a4a07b'],
 bouleau: ['#2a2629','#70665e','#9b9179','#c2b79b','#ded5b6','#ede6cd'],
 feuille: ['#152120','#1c302d','#264233','#335639','#436c3d','#58833f','#739a45','#97b255'],
 tendre:  ['#22362d','#33502f','#476b33','#61873a','#80a146','#a5bb5d','#c7d07e'],
 fleur:   ['#ede6cd','#efd36a','#d79a3c','#b8574a','#8a6fa6','#5f4c86','#7f9ccf'],
 champi:  ['#5a2a2c','#8c3b36','#b85a48','#d98a68'],
 // Pavages de ville : tuiles et grès clair des bâtiments (mêmes couleurs).
 brique:  ['#492d38','#713e3c','#a45b47','#c57b57','#e3a377'],
 gres:    ['#65544f','#94765f','#c4aa83','#dec99d','#eee1b6'],
 // Sarak, désert : lumière de midi, ombres violettes, sable doré, grès rouge
 // en strates, oasis turquoise. Le pisé reprend la rampe des bâtiments.
 sable:   ['#2f2331','#4b3139','#6f4a45','#946553','#b8825f','#d29f6c','#e2b97f','#eed29c','#f7e7c0'],
 piste:   ['#3a2c31','#5b4643','#7f6454','#a2836a','#bfa083','#d7bc9d','#eadabd'],
 ocre:    ['#2a1c26','#47272c','#6b3a35','#91513f','#b56d4a','#d18d5d','#e5ae78','#f2cf98'],
 sauge:   ['#28302e','#3f4a3d','#5c6a4c','#7d8a5d','#9fa872','#c2c48d'],
 palme:   ['#16232a','#1d3836','#29503f','#3a6944','#52834a','#749d52','#a2b864'],
 bois:    ['#2c2429','#4a3b37','#6d5848','#917860','#b49c7f','#d2bf9f','#e9ddc3'],
 oasis:   ['#11242f','#143843','#185055','#1f6a67','#2b8579','#45a18a','#76bea0','#b9dfc2'],
 pise:    ['#665042','#977153','#bb9466','#d7b780','#edcf98'],
 zellige: ['#1c2844','#25456a','#2b6c86','#3d9794','#79c1a7']
};
const list=[];for(const [ramp,colors]of Object.entries(RAMPS))colors.forEach((hex,i)=>list.push({name:ramp+i,ramp,tone:i,hex}));
const index=new Map(list.map((c,i)=>[c.name,i+1]));
const hexes=['#00000000',...list.map(c=>c.hex)];
function id(name){const i=index.get(name);if(!i)throw new RangeError('Couleur inconnue : '+name);return i;}
module.exports={RAMPS,list,hexes,id,ramp:name=>RAMPS[name].map((_,i)=>id(name+i))};
