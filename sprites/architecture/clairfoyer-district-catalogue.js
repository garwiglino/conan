/* Authoring catalogue only: not registered in the playable game's catalogue. */
(function(r,f){if(typeof module==='object'&&module.exports)module.exports=f();else r.ClairfoyerDistrictCatalogue=f();})(globalThis,()=>{
'use strict';
const views=['face','droite','dos','gauche'];
const districtPalettes={
 clos:{label:'Crème, blé et bois de miel',ramps:{plaster:['#67554a','#998264','#cdb78d','#e2d3aa','#f0e5c6'],straw:['#655038','#927044','#bc995c','#d6b878','#e9d39d'],wood:['#3d3029','#614633','#8b643e','#b48a56','#d4ae75']}},
 metiers:{label:'Enduit grège, brique et noyer',ramps:{plaster:['#5b5052','#8c7774','#b9a296','#d2beb0','#e5d7c6'],tile:['#432d32','#70433e','#9b6250','#bc8667','#d7ae8d'],wood:['#302b30','#4c3c39','#715445','#9d7860','#bea084']}},
 rive:{label:'Sauge grisée et bois patiné',ramps:{plaster:['#4e5752','#778271','#a7b3a0','#c6d0b8','#dee1c9'],straw:['#51503b','#77734b','#a59c65','#c5ba83','#ddd5ad'],slate:['#2d3c41','#46575d','#6b8184','#96aaa8','#c0ccc3'],wood:['#2b3330','#465448','#68755b','#95a17c','#b4bb96']}},
 halles:{label:'Ocre, miel et toile écrue',ramps:{plaster:['#6b5440','#9a7951','#c6a66c','#dec792','#efddb2'],wood:['#3b2c29','#604032','#8a5e3b','#b88a50','#dbb371'],straw:['#654735','#967044','#c5994f','#dfb866','#f0d48c'],cloth:['#765c3d','#9e8150','#c7a967','#e0c68f','#f0dfb6']}},
 conseil:{label:'Calcaire clair et ardoise froide',ramps:{plaster:['#525354','#838784','#b7bcb4','#d1d6cb','#e7e8db'],slate:['#303b49','#485667','#6a7b89','#94a6af','#bfccd0'],wood:['#2c2b2c','#45413c','#6b5d4c','#95836a','#b8a88d'],stone:['#42474b','#626b6b','#8b9691','#adb6aa','#ced3c1']}},
 etapes:{label:'Terre cuite, enduit rosé et toile safran',ramps:{plaster:['#6d4c45','#9d7058','#c6916e','#ddaf86','#eccba5'],tile:['#472b37','#703943','#9d5551','#c17665','#dfa18d'],cloth:['#725835','#9b7543','#c39a58','#dbb77b','#ecd2a3'],wood:['#38282c','#583b34','#81573f','#ac8054','#ceaa77']}},
 bois:{label:'Bois forestier grisé et couverture d’écorce',ramps:{wood:['#252e2b','#424e3d','#68735a','#8a9773','#b3bb91'],tile:['#322e2c','#50473b','#766244','#a2865c','#c0a67c'],plaster:['#595846','#858064','#b4ac87','#d0c5a0','#e6ddbc']}},
 greniers:{label:'Bois blond sec et tuiles gris sable',ramps:{wood:['#362e29','#5b4a37','#876a48','#ac8a59','#c7ad78'],tile:['#393c3d','#58594e','#82816a','#a8a485','#c9c0a0'],plaster:['#5c584a','#88816b','#b6ad90','#d1c9ab','#e8e2cb']}},
 sud:{label:'Enduit chaud, argile sombre et bois robuste',ramps:{plaster:['#5a4b45','#8b6b59','#b98d6c','#d3ae88','#e9cba6'],tile:['#3c2e31','#62413e','#8b5b4b','#af7c60','#cfa38a'],straw:['#514634','#7a6542','#a68a57','#c4a974','#dfc897'],wood:['#2c2929','#4c3d33','#75553b','#9e7952','#c0a17b']}},
 'ancien-relais':{label:'Ivoire, ardoise verte et toile olive',ramps:{plaster:['#5b5849','#89816a','#bbb08b','#d8cda7','#eee4c4'],slate:['#2b3d3c','#435b55','#6b8070','#95a793','#bfcbb4'],cloth:['#50523d','#73784d','#99a06b','#bbc18c','#d9d9b3'],wood:['#38302c','#5b4836','#876b47','#ad8e60','#ceb388']}},
 resine:{label:'Pierre froide, brun poix et tuiles sombres',ramps:{wood:['#29292c','#413833','#655042','#8b7054','#ae9371'],stone:['#343b40','#515d60','#778783','#9daaa0','#c1c8b6'],tile:['#332b31','#514039','#785c46','#9d7b5b','#bfa487'],slate:['#262e37','#3c4851','#5d6e75','#85979a','#afbfba'],plaster:['#50534c','#7a7f6f','#a8ae96','#c7cbb1','#e0e0c6']}}
};
const rows=[
 ['CF01','Maison des Clos','clos','court-house',96,80,60],
 ['CF02','Salle commune du jardin','clos','common-hall',128,96,70],
 ['CF03','Boutique de réparation textile','metiers','cloth-shop',96,80,80],
 ['CF04','Atelier des outils','metiers','tool-shop',112,96,68],
 ['CF05','Logis des abords humides','rive','drained-house',104,88,64],
 ['CF06','Maison de voisinage de la rive','rive','neighborhood-house',128,96,78],
 ['CF07','Grande halle traversante','halles','market-hall',160,112,76],
 ['CF08','Comptoir du miel et des échanges','halles','honey-counter',112,88,62],
 ['CF09','Annexe des registres','conseil','records',128,96,86],
 ['CF10','Maison de soins avec galerie','conseil','clinic',144,112,78],
 ['CF11','Auberge des Étapes','etapes','gallery-inn',144,120,100],
 ['CF12','Comptoir des voyageurs','etapes','travel-counter',96,80,66],
 ['CF13','Charpenterie ouverte','bois','carpentry',144,112,76],
 ['CF14','Remise traversante des charrois','bois','cart-shed',144,112,76],
 ['CF15','Grenier ventilé','greniers','ventilated-granary',144,112,78],
 ['CF16','Magasin des vivres','greniers','food-store',128,96,68],
 ['CF17','Auberge de la cour des rouliers','sud','carters-inn',160,128,94],
 ['CF18','Écurie et remise du relais','sud','stable',160,112,70],
 ['CF19','Pavillon d’accueil','ancien-relais','arrival-office',112,88,70],
 ['CF20','Relais et dépôt des bagages','ancien-relais','baggage-house',112,96,76],
 ['CF21','Atelier de tri des résines','resine','resin-workshop',144,112,72],
 ['CF22','Magasin séparé des résines','resine','resin-store',112,96,70],
 ['CI01','Banc et jardinière','clos','garden-bench',40,20,10],
 ['CI02','Abri de rencontre ouvert','clos','meeting-shelter',80,80,46],
 ['CI03','Étal couvert','halles','market-stall',64,48,44],
 ['CI04','Table de pesée','halles','weighing-table',32,20,17],
 ['CI05','Panneau des avis publics','conseil','notice-board',40,24,40],
 ['CI06','Auvent d’attente des soins','conseil','clinic-shelter',64,64,44],
 ['CI07','Râtelier à bois couvert','bois','timber-rack',96,64,48],
 ['CI08','Tréteaux de charpente','metiers','saw-trestles',44,28,12],
 ['CI09','Bacs de réserve sous auvent','greniers','covered-bins',64,56,42],
 ['CI10','Abreuvoir à raccorder','sud','dry-trough',36,18,8],
 ['CI11','Citerne de distribution couverte','greniers','covered-cistern',64,64,38],
 ['CI12','Caniveau maçonné','rive','drain',64,16,4],
 ['CI13','Contenants de résine sous abri','resine','resin-rack',72,64,42],
 ['CI14','Pavillon de déclaration des charges','ancien-relais','inspection-shelter',80,64,48]
];
const assets=rows.map(([id,label,district,shape,width,depth,height])=>({id,label,district,shape,width,depth,height,family:'teremor',kind:'building',category:id.startsWith('CI')?'infrastructure':'building',season:'base',views:views.slice(),doorClearance:22,recipe:{type:shape,wall:['carpentry','stable','ventilated-granary','cart-shed','resin-workshop'].includes(shape)?'wood':'plaster',roof:['court-house','common-hall','drained-house','market-hall','stable'].includes(shape)?'straw':['records','clinic','neighborhood-house','resin-store','arrival-office'].includes(shape)?'slate':'tile'},status:'draft_not_validated',waterConnected:false,inventoryCreated:false}));
for(const asset of assets)asset.paletteLabel=districtPalettes[asset.district].label;
return {version:1,scale:{human:19,tile:16,door:22},nativeUnitsPerMetre:16,districtPalettes,assets};
});
