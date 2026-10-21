'use strict';
// District programme; --active binds the approved playable grid without rewriting the bible.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),read=f=>JSON.parse(fs.readFileSync(path.join(root,f),'utf8'));
const active=process.argv.includes('--active'),planFile=active?'data/architecture/city-plans/clairfoyer-grid.json':'data/architecture/city-plans/clairfoyer-square.json',plan=read(planFile);
const bibleFile='data/world/bible/generated/settlements.json',canon=read(bibleFile).find(s=>s.atlasId==='1');
const sources=[bibleFile,'docs/world-bible/01-geopolitique.md','docs/world-bible/02-peuples-et-villes.md','docs/world-bible/03-ressources-et-echanges.md','docs/world-bible/05-societes-et-criminalite.md','docs/world-bible/06-hommes-singes.md'];
const districts=[
 {id:'clos',name:'Les Clos communs',color:'#98b977',grid:[0,0,2,2],tagline:'Habiter autour du jardin, se retrouver hors du marché.',
  functions:['Logements et cours communes','Jardin public existant dans le brouillon','Entraide, repas et veillées'],
  identity:{materials:'Enduits clairs, bois réparé, couvertures de chaume ; clôtures basses.',landmarks:'Le grand jardin du nord-ouest et une salle commune à programmer.',props:'Bancs, séchoirs domestiques, petites plates-bandes sur sol drainé.',wear:'Seuils polis, bas de murs humides et barrières reprises ; allées dégagées.'},
  routines:'Départs vers les ateliers au matin, entretien des cours en journée, repas et veillées le soir.',
  services:{water:'Point de distribution à étudier ; captage et qualité non établis.',food:'Petite vente de proximité reliée aux Halles ; jardins complémentaires, sans rendement garanti.',refuge:'Salle commune à programmer dans block-1-0 ; accès au jardin maintenu.'},
  dependencies:['halles','metiers','conseil'],conflict:'Partage des cours et coût de leur entretien ; arbitrage entre foyers, sans antagonisme d’espèce.',
  next:['Préserver intégralement block-0-0 comme jardin.','Réserver une parcelle pour la salle commune, sans compter le jardin comme abri couvert.']},
 {id:'metiers',name:'Les Cours des Métiers',color:'#b4a0c6',grid:[2,0,2,2],tagline:'Petits ateliers et logements mêlés, plutôt qu’un quartier industriel.',
  functions:['Réparation des vêtements et des équipements','Menuiserie légère et entretien des outils','Boutiques et apprentissages'],
  identity:{materials:'Pans de bois, auvents courts, volets et enseignes sobres.',landmarks:'Cours d’atelier ouvertes sur les rues secondaires.',props:'Établis, pièces à réparer, paniers et tissus sous auvent, hors passage.',wear:'Bois marqué par les outils, enduit repris, usure concentrée près des établis.'},
  routines:'Livraisons légères le matin, travail et achats en journée, fermeture des auvents le soir.',
  services:{water:'Distribution domestique à prévoir ; aucun atelier à forte consommation posé sans étude.',food:'Achats aux Halles et vente de voisinage à programmer.',refuge:'Salle commune à programmer dans block-3-0 ; soins à la Cour du Conseil.'},
  dependencies:['bois','halles','conseil'],conflict:'Prix des réparations, avances et salaires d’apprentissage, selon des contrats identifiés.',
  next:['Attribuer des métiers aux boutiques génériques existantes.','Approvisionner étoffes et métal travaillé ; ne pas inventer un gisement, une filature ou une grande forge.']},
 {id:'rive',name:'Les Maisons de la Rive',color:'#73aeb4',grid:[4,0,2,2],tagline:'Un voisinage résidentiel tourné vers la rive, entièrement sur terre praticable.',
  functions:['Logements et cours abritées','Espaces communs de repos','Entretien des abords et du drainage'],
  identity:{materials:'Soubassements lisibles, enduits grisés, bois patiné et couvertures réparées.',landmarks:'Cours ouvertes vers l’est ; aucune jetée ou porte portuaire.',props:'Bancs abrités et végétation basse compatible avec le terrain humide.',wear:'Traces d’humidité et mousse ponctuelle ; seuils et traversées entretenus.'},
  routines:'Vie de voisinage, déplacements vers les Métiers et les Halles, rassemblements à l’abri en soirée.',
  services:{water:'La rive ne vaut pas eau potable ; distribution distincte et qualité à vérifier.',food:'Desserte par les Halles et la Rue des Étapes ; aucune pêcherie présumée.',refuge:'Salle commune à programmer dans block-4-1, sur sol vérifié.'},
  dependencies:['metiers','etapes','conseil'],conflict:'Entretien des écoulements, accès commun aux abords et responsabilité des propriétaires.',
  next:['Vérifier crues et écoulements avant tout mobilier ou terrassement.','Garder des foyers mixtes et des adaptations individuelles ; aucun quartier racial déduit de la proximité de l’eau.']},
 {id:'halles',name:'Les Halles du Boisclair',color:'#d8b96e',grid:[0,2,3,2],tagline:'Le cœur marchand : acheter, peser, rencontrer et échanger.',
  functions:['Marché principal et comptoirs','Vente de grains, miel et biens forestiers autorisés','Auberge et habitat au voisinage du marché'],
  identity:{materials:'Halles en bois, cours minérales, tuiles mêlées au chaume.',landmarks:'Cour marchande de block-2-2, avec halle, auberge, grenier et comptoir du brouillon.',props:'Balances, étals démontables et auvents ; passages traversants des halles conservés.',wear:'Angles de pavés usés, traces de roues et bois poli autour des comptoirs.'},
  routines:'Arrivage et mise en place tôt, marché en journée, rangement des étals et repas à l’auberge le soir.',
  services:{water:'Point public de distribution à programmer, distinct des eaux de nettoyage.',food:'Centre de distribution, alimenté par les réserves et les fournisseurs sous contrat.',refuge:'Nouvelle salle de proximité à programmer dans block-1-3 ; les halles ouvertes ne suffisent pas comme abri.'},
  dependencies:['greniers','bois','etapes','conseil'],conflict:'Droits de place, poids, priorité d’achat et accès des petits vendeurs ; preuves et recours au Conseil.',
  next:['Hiérarchiser les fronts commerciaux autour de la cour existante.','Laisser le grand axe et les sorties libres pendant le marché.']},
 {id:'conseil',name:'La Cour du Conseil',color:'#a9bbd0',grid:[3,2,2,2],tagline:'Administrer et soigner au contact du marché.',
  functions:['Administration locale de Teremor','Registres, arbitrages et litiges de contribution','Maison de soins et refuge civil'],
  identity:{materials:'Enduits soignés, charpentes entretenues, seuils et cours plus minéraux.',landmarks:'Ensemble B21, B22 et B24 déjà dessiné dans block-3-2.',props:'Table d’affichage, bancs d’attente et repères discrets de service.',wear:'Marches et poignées polies, couvertures entretenues, reprises visibles sans luxe uniforme.'},
  routines:'Accueil et registres en journée ; soins et refuge gardent des accès réservés hors de la file administrative.',
  services:{water:'Approvisionnement sûr prioritaire pour les soins ; aucune fontaine déclarée alimentée.',food:'Livraisons identifiées depuis les Greniers et les Halles.',refuge:'B24 déjà placé dans le brouillon ; capacité et fonctionnement non encore dimensionnés.'},
  dependencies:['halles','greniers','etapes','resine'],conflict:'Contribution aux routes, comptes et droits de coupe ; pas de conflit armé sans cause ni mandat.',
  next:['Séparer les accès de soins, de refuge et d’administration.','Dimensionner accueil et refuge : un petit modèle natif ne représente pas à lui seul les besoins de 10 629 personnes.']},
 {id:'etapes',name:'La Rue des Étapes',color:'#cd986e',grid:[5,2,1,2],tagline:'L’accueil commercial entre le relais oriental et les Halles.',
  functions:['Petit marché de transit','Auberge, comptoirs et logements','Information locale et portage'],
  identity:{materials:'Auvents continus par petites séquences, bois et tuiles réparés.',landmarks:'Marché secondaire de block-5-3 et liaison vers l’arrivée conservée.',props:'Bancs de voyageurs, enseignes d’auberge et dépôts temporaires dans les cours.',wear:'Frottements des bagages, seuils fréquentés et traces de roues aux entrées.'},
  routines:'Accueil des arrivants, échanges de nouvelles et transferts vers le marché ; visiteurs distincts des résidents.',
  services:{water:'Distribution publique à prévoir pour voyageurs et résidents.',food:'Marché secondaire et auberge prévus ; ravitaillement depuis les Greniers.',refuge:'B24 du Conseil via les rues partagées ; capacité et parcours à dimensionner.'},
  dependencies:['ancien-relais','halles','conseil','sud'],conflict:'Frais d’étape et déclarations de cargaisons ; une différence de prix ne prouve pas une fraude.',
  next:['Préserver la continuité de l’accès oriental, sans contrôle bloquant permanent.','Traiter l’attente dans les cours, hors des rues et des entrées de maisons.']},
 {id:'bois',name:'Les Cours du Bois',color:'#b68b64',grid:[0,4,2,2],tagline:'La transition entre les métiers forestiers et la ville habitée.',
  functions:['Réception et tri des produits forestiers autorisés','Menuiserie et entretien des charrois à programmer','Logements, comptoir et réserve de proximité'],
  identity:{materials:'Bois brut et réparé, cours terreuses stabilisées, couvertures simples.',landmarks:'Cour logistique de block-0-4 et départ de la desserte ouest.',props:'Tréteaux, pièces de charpente et dépôts limités aux cours ; aucune pile dans les ruelles.',wear:'Marques de manutention, copeaux localisés et traces de roues, sans salir tous les logements.'},
  routines:'Réception et manutention en journée ; fermeture des dépôts et retour des travailleurs vers les maisons.',
  services:{water:'Eau domestique à prévoir ; usages d’atelier séparés et quantifiés.',food:'Grenier et comptoir du brouillon à approvisionner.',refuge:'B24 déjà placé dans block-0-4 ; capacité et accès de repli à vérifier en jeu.'},
  dependencies:['resine','metiers','greniers','halles'],conflict:'Bornage des coupes, sécurité du travail et paiement ; usages forestiers et contrats restent distincts.',
  next:['Dimensionner des cours de manœuvre avant de placer scies ou charges longues.','Garder la chauffe de résine à l’annexe ; ne pas transformer le quartier en dépôt inflammable.']},
 {id:'greniers',name:'Les Greniers du Marché',color:'#c7bb89',grid:[2,4,2,2],tagline:'Recevoir et préserver les vivres avant de les distribuer.',
  functions:['Réserves alimentaires à programmer','Réception, pesée et répartition des denrées','Habitat des foyers et services de proximité'],
  identity:{materials:'Bois ventilé, soubassements secs, portes et fermetures robustes.',landmarks:'Cours de stockage proposées sur la desserte sud.',props:'Contenants fermés et tables de pesée dans les cours ; stocks visibles seulement s’ils existent.',wear:'Seuils de charge, frottements des contenants et entretien marqué contre l’humidité.'},
  routines:'Réception de jour, tenue des comptes et répartition vers marchés et services ; réserve protégée avant exportation.',
  services:{water:'Distribution domestique à prévoir ; drainage sans mélange avec les réserves.',food:'Nœud de réserve proposé, sans capacité ni volume inventés.',refuge:'Salle commune à programmer dans block-3-4, avec accès distinct des magasins.'},
  dependencies:['sud','halles','conseil'],conflict:'Part réservée aux habitants, prix et engagements de livraison ; une pénurie exige un déficit réel.',
  next:['Réserver de vraies parcelles de greniers : aucun B06 n’est encore placé dans ce secteur.','Vérifier volumes, humidité, manutention et contrats ; prévoir les logements déplacés avant toute substitution.']},
 {id:'sud',name:'Le Relais du Sud',color:'#bd929c',grid:[4,4,2,2],tagline:'La cour des rouliers au débouché du sentier existant.',
  functions:['Réception terrestre des convois','Auberge, soins aux animaux et réparation à programmer','Logements et petit commerce quotidien'],
  identity:{materials:'Charpentes pratiques, grands auvents et cours stabilisées.',landmarks:'Liaison vers road-5 et cour de retournement à réserver.',props:'Attaches et abreuvoir à étudier ; chariots uniquement en présence d’un transport réel.',wear:'Ornières contenues dans les cours, bas de portes frottés et pièces de bois remplacées.'},
  routines:'Arrivées et déchargement dans les cours, départs selon les trajets ; pas de caravane créée par la seule heure.',
  services:{water:'Besoins des personnes et des animaux à chiffrer avant tout abreuvoir alimenté.',food:'Greniers pour les provisions ; fourrage et hébergement à approvisionner séparément.',refuge:'Salle commune à programmer dans block-4-5 ; repli séparé des animaux et dépôts.'},
  dependencies:['greniers','etapes','conseil'],conflict:'Priorité des déchargements, prix du fourrage et dommages de passage ; arbitrage local.',
  next:['Réserver une cour adaptée aux charrettes ; la vérification piétonne ne démontre pas leur passage.','Créer les services seulement après vérification de leurs parcelles et du relogement nécessaire.']},
 {id:'ancien-relais',name:'Le Relais de l’Arrivée',color:'#e0cd8f',annex:{x:-70,y:-55,w:125,h:110},tagline:'Le point d’accès historique conservé, relié au nouveau tissu urbain.',
  functions:['Accueil, auberge et comptoir','Refuge du point d’arrivée','Poste d’accès proposé'],
  identity:{materials:'Bâtiments modestes entretenus, enseignes lisibles et sol stabilisé.',landmarks:'Point canonique de Clairfoyer, conservé en (18391.8, 16701.5).',props:'Banc d’attente et panneau d’orientation ; aucune porte fortifiée ajoutée.',wear:'Usure de passage concentrée près de l’auberge et du comptoir.'},
  routines:'Arrivée, orientation, échange de nouvelles et départ vers la Rue des Étapes.',
  services:{water:'Distribution à vérifier pour l’accueil.',food:'Auberge du brouillon, approvisionnée par les circuits de la ville.',refuge:'B24 déjà placé dans le brouillon ; capacités et parcours restent à examiner.'},
  dependencies:['etapes','conseil'],conflict:'Contrôle fiscal seulement avec base juridique, agents et moyens ; aucune apparition de gardes automatique.',
  next:['Conserver le point canonique et sa liaison.','Le nom désigne la fonction de relais ; aucune chronologie historique nouvelle n’est affirmée.']},
 {id:'resine',name:'La Cour des Résiniers',color:'#d68162',annex:{x:-1410,y:155,w:90,h:95},tagline:'L’annexe productive, tenue à distance des logements et des vivres.',
  functions:['Réception de résine et comptage','Stockage adapté à concevoir','Transformation éventuelle sous conditions'],
  identity:{materials:'Auvents simples, espaces dégagés et stockage couvert adapté.',landmarks:'Desserte occidentale indépendante et périmètre de séparation.',props:'Contenants identifiés et postes de travail à concevoir ; aucune cuve chauffée fictive.',wear:'Traces de manutention et taches localisées aux postes, hors des chemins.'},
  routines:'Réception, contrôle des quantités et travail de jour ; chauffage uniquement avec procédé et sécurité définis.',
  services:{water:'Eau de travail et moyens contre l’incendie à dimensionner ; aucun rejet vers la rive présumé acceptable.',food:'Approvisionnement des travailleurs depuis les Cours du Bois, sans nouveau foyer permanent compté.',refuge:'Repli vers le B24 des Cours du Bois ; ne pas abriter les civils dans le stockage de résine.'},
  dependencies:['bois','halles','conseil'],conflict:'Droits de collecte, sécurité et salaire ; illicit_collectors seulement si des actes identifiés le justifient.',
  next:['Le B12 actuel est un atelier de charpente : simple gabarit, pas un atelier de résine achevé.','Le B06 est un grenier collectif, pas un magasin homologué de résine : modèle spécifique, procédés, stocks et sécurité à concevoir.']}
];
function polygon(r){return [[r.x,r.y],[r.x+r.w,r.y],[r.x+r.w,r.y+r.h],[r.x,r.y+r.h]];}
const assignments=[],wardOwners=new Map();
for(const d of districts){
 d.status='functional_proposal_not_validated';d.nameStatus='proposed_not_canonical';d.wardIds=[];
 if(d.grid){const [col,row,w,h]=d.grid;for(let y=row;y<row+h;y++)for(let x=col;x<col+w;x++){const id=`block-${x}-${y}`;if(wardOwners.has(id))throw Error('Duplicate ward '+id);wardOwners.set(id,d.id);d.wardIds.push(id);}
  if(active){d.areas=plan.wards.filter(w=>d.wardIds.includes(w.id)).map(w=>w.bounds);const xs=d.areas.flatMap(r=>[r.x,r.x+r.w]),ys=d.areas.flatMap(r=>[r.y,r.y+r.h]);d.bounds={x:Math.min(...xs),y:Math.min(...ys),w:Math.max(...xs)-Math.min(...xs),h:Math.max(...ys)-Math.min(...ys)};d.polygons=require('./city-plans/rectilinear-outline.cjs').outline(d.areas);}else d.bounds={x:plan.grid.bounds.x+col*128,y:plan.grid.bounds.y+row*128,w:w*128,h:h*128};}else d.bounds=d.annex;
 d.areas=d.areas||[d.bounds];d.polygons=d.polygons||[polygon(d.bounds)];
 d.polygon=d.polygons[0];
}
for(const b of plan.buildings){let id=wardOwners.get(b.ward);if(!id&&b.ward==='arrival-services')id=b.x < -1200?'resine':'ancien-relais';if(!id)throw Error('Unassigned building '+b.uid);assignments.push({buildingUid:b.uid,districtId:id});}
const A=require(active?'../sprites/architecture/settlement-architecture':'../sprites/architecture/architecture-game');
for(const d of districts){const ids=new Set(assignments.filter(a=>a.districtId===d.id).map(a=>a.buildingUid)),bs=plan.buildings.filter(b=>ids.has(b.uid));
 d.inventory={buildings:bs.length,homes:bs.filter(b=>b.capacity>0).length,capacity:bs.reduce((n,b)=>n+(b.capacity||0),0),plannedResidents:bs.reduce((n,b)=>n+(b.plannedResidents||0),0),modelCounts:Object.fromEntries([...new Set(bs.map(b=>b.id))].sort().map(id=>[id,{label:A.entry(id).label,count:bs.filter(b=>b.id===id).length}]))};
 d.inventory.note='Comptage de la variante de travail, pas un recensement canonique par quartier ni des services activés.';
}
if(wardOwners.size!==plan.wards.length||assignments.length!==plan.buildings.length||new Set(assignments.map(a=>a.buildingUid)).size!==assignments.length)throw Error('Coverage mismatch');
if(districts.reduce((n,d)=>n+d.inventory.plannedResidents,0)!==canon.designPopulation)throw Error('Population mismatch');
const flows=[
 {from:'sud',to:'greniers',kind:'food',label:'Vivres entrants',status:'potential_suppliers_require_stock_contract_and_route'},
 {from:'greniers',to:'halles',kind:'food',label:'Distribution alimentaire',status:'proposed'},
 {from:'greniers',to:'conseil',kind:'food',label:'Soins et réserve de secours',status:'proposed'},
 {from:'resine',to:'bois',kind:'forest',label:'Produits forestiers',status:'proposed_not_existing_cargo'},
 {from:'bois',to:'metiers',kind:'forest',label:'Bois et réparations',status:'proposed'},
 {from:'bois',to:'halles',kind:'forest',label:'Vente autorisée',status:'proposed'},
 {from:'ancien-relais',to:'etapes',kind:'travel',label:'Accueil oriental',status:'proposed'},
 {from:'etapes',to:'halles',kind:'travel',label:'Voyageurs et petit commerce',status:'proposed'},
 {from:'clos',to:'conseil',kind:'civil',label:'Soins et recours',status:'proposed'},
 {from:'rive',to:'conseil',kind:'civil',label:'Soins et recours',status:'proposed'}
];
for(const d of districts)for(const id of d.dependencies)if(!districts.some(q=>q.id===id))throw Error('Unknown dependency '+id);
const result={schemaVersion:1,atlasId:'1',name:'Clairfoyer',status:'functional_study_not_validated',approval:{userValidated:false,pushAllowed:false},spatialSupport:{file:planFile,revision:plan.revision,note:'Support de lecture provisoire : aucun choix entre les deux plans. Programme fonctionnel à réadapter au tracé retenu.'},sources:sources.map(file=>({file,sha256:crypto.createHash('sha256').update(fs.readFileSync(path.join(root,file))).digest('hex')})),canon:{...plan.canon,role:canon.roleLabel,needs:canon.needs,disputes:canon.disputes,supplierOptions:canon.supplierOptions},designRules:{mixedNeighborhoods:true,speciesAllocationByDistrict:false,nativeScalePreserved:true,streetGeometryChanged:false,buildingPlacementsChanged:false,allFunctionsProposed:true,identitiesDrawnIntoSprites:false,datesInvented:false,waterSupplyVerified:false,portAdded:false,garrisonCreated:false},districts,assignments,flows,unresolved:['Choix du tracé et validation de tous les sites.','Captage potable, distribution et drainage.','Réservations de parcelles, relogements et maintien de la capacité résidentielle avant ajout de services.','Capacités des réserves, soins et refuges ; budgets, personnel et contrats.','Manœuvres des charrettes et nuisances des ateliers.','Déclinaison graphique des identités, collisions, parcours et performances en jeu.'],activation:{runtimeChanged:false,pushed:false}};
if(active){result.status='integrated_functional_layout';result.approval={userValidated:true,pushAllowed:true};result.activation.runtimeChanged=true;delete result.activation.pushed;result.activation.publicationTrackedBy='git';result.designRules.identitiesDrawnIntoSprites=true;result.designRules.streetGeometryChanged=true;result.designRules.buildingPlacementsChanged=true;result.unresolved=result.unresolved.filter((_,i)=>i!==0&&i!==5);for(const d of result.districts)d.status='integrated_layout_services_require_resources';result.spatialSupport.note='Unequal orthogonal blocks with square and rectangular courts, offset junctions, district designs and workstations.';}
result.revision=crypto.createHash('sha256').update(JSON.stringify(result)).digest('hex').slice(0,16);
fs.writeFileSync(path.join(root,'data/architecture/city-plans/clairfoyer-districts.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({revision:result.revision,districts:districts.length,wards:wardOwners.size,buildings:assignments.length,residents:canon.designPopulation,validated:result.approval.userValidated,runtimeChanged:result.activation.runtimeChanged}));
