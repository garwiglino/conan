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
 zellige: ['#1c2844','#25456a','#2b6c86','#3d9794','#79c1a7'],
 // Intérieurs, forteresse gobeline : pierre sombre et froide, pierre chauffée
 // par les torches, flamme, fer et rouille, chiffons rouges, bois noirci,
 // paille et peinture verte des gobelins.
 cachot:  ['#0c0b11','#15131c','#1e1b27','#282533','#342f40','#423c4e','#524b5d','#655d6e','#7d7483'],
 lueur:   ['#1f181b','#2f2427','#433331','#5b433b','#765847','#937056','#b38b67','#d2aa7c'],
 torche:  ['#3a1410','#6e2214','#a8361a','#d65a1f','#f08a2a','#f9bb47','#fde27f','#fff6d0'],
 fer:     ['#101116','#1d1f26','#2f323b','#474b55','#666b74','#8d9198','#b8bbbd'],
 rouille: ['#2e1913','#4f2818','#74391d','#9a5126'],
 chiffon: ['#1e1212','#331a19','#4a2320','#632d27','#7d3b31','#965042'],
 planche: ['#1c1513','#2c201b','#3e2d24','#543c2e','#6c4e3a','#87644a','#a27e5d'],
 paille:  ['#2f271b','#4a3d26','#655631','#80703f','#9a8a52','#b4a46c'],
 gobelin: ['#141a12','#1f2a19','#2c3b21','#3d4f29','#526634','#6c8042'],
 // Magie (sceau de la porte, fée) : violet profond vers blanc lilas.
 arcane:  ['#120c22','#211640','#352063','#4e2f8a','#6f45b3','#9a6fd6','#c7a6ef','#efe0ff'],
 // Rendu mûr des biomes (comme la forteresse) : rampes longues et sourdes,
 // ombres froides, lumières chaudes, interpolées en OKLab. Chaque biome ne
 // garde dans ses données que ses propres rampes (manifeste « rampes »).
 roc:     ['#0f0e13','#19181e','#24222a','#312f36','#3f3c42','#504b4e','#615b5b','#756e6a','#8a8279','#a0978b','#b6ad9e'],
 // Varan, marais : joncs et herbes mouillées, vase, eau brune et verte,
 // lentilles d'eau, saules argentés, tourbe et iris.
 jonc:    ['#0e110e','#161a13','#1f2418','#292f1d','#363b22','#434727','#52542d','#626234','#73703a','#848047','#969056','#a8a065'],
 vase:    ['#0d0c0b','#181613','#24201c','#312b24','#3f362c','#4d4234','#5d5241','#6e624e','#7e715b','#8c7f69','#9a8e76'],
 marais:  ['#070c0b','#0b1311','#101a16','#15221c','#1b2a22','#223327','#2c3c2d','#374733','#435139','#546046','#687154','#7c8263'],
 lentille:['#1f2c17','#32421e','#485b25','#62762c','#7e8e39','#9aa649'],
 saule:   ['#0d1210','#141b17','#1b251e','#243027','#2f3d30','#3a4a3a','#485845','#57664f','#69765c','#7e886b','#949a7a'],
 tourbe:  ['#0e0a09','#1a130f','#261c16','#33261d','#413225','#503e2f','#5f4c3a','#6f5a45'],
 iris:    ['#2f2a3e','#4b3c63','#6f5a8a','#b08a2c','#d9b648','#e8dfc0'],
 // Teremor : pré, humus, frondaison, écorce, rivière, grès et briques sourds.
 pre:     ['#10160f','#161f14','#1d291a','#263521','#304228','#3d4f2f','#4b5c34','#5b6a3b','#6c7842','#7e874b','#919658','#a5a565'],
 humus:   ['#120d0c','#1f1613','#2c201a','#3c2c22','#4d392a','#5f4936','#725a43','#856d51','#98805f','#a89171','#b9a283'],
 frondaison:['#0b110f','#101914','#15211a','#1b2b1f','#223624','#2b4129','#364d2d','#425932','#516735','#62753a','#778345','#8d9150'],
 ecorcem: ['#110d0d','#1d1614','#2a201b','#3a2d24','#4a3a2d','#5c4a39','#6e5a45','#816d57','#94806a'],
 riviere: ['#070f12','#0b181d','#0f2128','#152c32','#1c373d','#264548','#325454','#436562','#5b7b72','#749183','#8ea694','#a8bba5'],
 gresm:   ['#1e1817','#2f2622','#42362e','#58483f','#6f5d51','#897663','#a38f75','#bda889','#cebb99','#ddcca8'],
 briquem: ['#1c1012','#2e1919','#432320','#592e26','#723b2e','#8b4a38','#a05d49','#b3725a','#c4876b'],
 fleurm:  ['#d2cbb4','#a59d86','#c3a04a','#9a7a32','#7a6189','#56456a','#9a4a3a','#6d3229'],
 // Sarak : dunes, grès rouge, terre battue, palmes et eau d'oasis sourdes.
 dune:    ['#18121a','#281e22','#3a2a2a','#513a33','#6a4b3c','#825e48','#9a7155','#ae8564','#c39a73','#d0ad86','#ddc19a','#e5ceab','#ecdcbd'],
 gresrouge:['#170f12','#281718','#3a201e','#4e2a24','#62352a','#764231','#8b4f39','#9d5f45','#b07052','#be8266','#cc957a'],
 battue:  ['#18121a','#2b2124','#40322f','#58453d','#6f5a4c','#87715e','#9e8871','#b49f86','#c7b499','#d8c8ad'],
 palmier: ['#0c1214','#131f1e','#1b2d28','#273b30','#344a37','#445a3d','#576a44','#6b7a4b','#828b57','#9b9c66'],
 bleu:    ['#071216','#0a1e23','#0d2a30','#12383d','#17474b','#215858','#2b6a65','#437f76','#5b9488','#7fac9d','#a3c4b3']
};
const list=[];for(const [ramp,colors]of Object.entries(RAMPS))colors.forEach((hex,i)=>list.push({name:ramp+i,ramp,tone:i,hex}));
const index=new Map(list.map((c,i)=>[c.name,i+1]));
const hexes=['#00000000',...list.map(c=>c.hex)];
function id(name){const i=index.get(name);if(!i)throw new RangeError('Couleur inconnue : '+name);return i;}
module.exports={RAMPS,list,hexes,id,ramp:name=>RAMPS[name].map((_,i)=>id(name+i))};
