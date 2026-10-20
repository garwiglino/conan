# Villes, villages, fortifications et avant-postes — conception locale

## Intégration actuelle — 20 octobre 2026

Le joueur a demandé l’intégration et le push de Clairfoyer, des bâtiments et des postes. Cette consigne remplace la restriction de publication des études précédentes. Les 82 autres localités gardent leur implantation existante ; leur conception détaillée reste à faire.

Le plan actif est `data/architecture/city-plans/clairfoyer-grid.json` : quadrillage continu avec **78 cours rectangulaires**, alternant orientations horizontales et verticales et plusieurs largeurs, sans créneaux. Il place **2 631 bâtiments**, dont 2 484 logements, pour une capacité de 11 480 et exactement 10 629 résidents de conception. Ces chiffres ne créent aucun PNJ.

Les onze quartiers utilisent leurs palettes, les 36 nouveaux modèles CF/CI et les maisons régionales. Les 144 vues nouvelles sont précompilées ; le cache de vues visibles est borné à 64 et celui du renderer à 96. Les fondations bloquent le passage et la maison entière s’efface progressivement jusqu’à 32 % quand elle masque le joueur. Les rues et les 2 631 accès sont contrôlés avec les collisions du joueur sur plus de 72 000 points.

Les 49 définitions de postes sont livrées ; 44 modèles sont redessinés. Clairfoyer reçoit 24 meubles fixes dans ses cours, avec sockets indépendants et approches libres. Les travailleurs existants emploient les nouveaux postes lorsque leur métier et les règles de production le permettent. Les personnages gardent quatre directions. L’eau, les stocks, les effectifs et les services non approvisionnés ne sont pas inventés ; les champs restent hors des cours urbaines. Les zones nommées couvrent les quartiers sans transformer les sols naturels en pavage.

Reconstruction : `npm run build:city`, puis `npm run test:city` et `npm run check:city`. Le paquet iOS est reconstruit avec `npm run package:ios`.

## Archives des propositions précédentes

Les sections suivantes documentent les variantes et leurs limites **avant activation**. Leurs mentions de brouillon, d’absence de validation ou d’interdiction de push décrivent ces archives, pas l’état livré ci-dessus. L’ancien plan organique et la variante carrée restent consultables pour comparaison ; ils ne sont pas chargés par le jeu.

## Clairfoyer : fondements et parti urbain

Références : `data/world/bible/generated/settlements.json` (`atlasId: 1`), `docs/world-bible/02-peuples-et-villes.md`, `docs/world-bible/01-geopolitique.md` et l’atlas courant. Centre administratif de Boisclair, sous l’autorité de Teremor, 10 629 résidents de conception : 9 035 humains, 1 063 gobelins, 106 orques, 213 batraciens et 212 hommes-singes. Ces nombres ne sont pas des instances de personnages à créer.

La production prévue concerne la résine ; bois, grain et miel appartiennent aux spécialités de l’arrière-pays. Il n’existe ni contrat de livraison automatique ni gisement garanti. La ville n’est pas enregistrée comme port océanique. Le trait d’eau proche est repris de la géométrie réelle de l’atlas : le plan n’en déduit ni port, ni eau potable, ni flotte. Le biome local est humide ; le nom de la région ne justifie pas de remplacer ce terrain par une forêt sèche.

Le point historique `(18391.8, 16701.5)` reste l’accès oriental. Le sentier `road-5` arrive au sud. Le tissu urbain s’étend sur la terre praticable à l’ouest, sans déplacer les côtes, les routes canoniques, les limites régionales ou le point de localité. Le nouveau centre marchand se situe environ 790 m à l’ouest de l’accès historique. Cette extension impose un travail ultérieur sur le périmètre de services et la navigation : le cercle courant de 65 m ne représente pas une ville complète.

Le plan représente environ **76,29 ha**, 40 îlots, **2 684 bâtiments dont 2 572 logements**. Les capacités hypothétiques de 4, 6 ou 8 personnes selon le modèle totalisent 11 482 places ; l’occupation de conception répartit exactement 10 629 personnes par plus forts restes. Ce sont des hypothèses de programme à examiner, pas des logements recensés ni des maisons dotées d’intérieurs jouables. L’occupation moyenne est 4,13 habitants par logement ; la densité brute est environ 139 habitants/ha. La capacité n’autorise aucune modification des chiffres démographiques de la bible.

Les bâtiments natifs restent à leur échelle : **1 m de sol = 16 unités natives**, sans attribut `scale`. Les rues secondaires réservent 4,4 m ; les axes principaux 8,8 m ; les accès secondaires 6,4 m. Les parcelles proviennent de Watabou ; les modèles du jeu sont implantés à l’intérieur, en ménageant les accès aux portes. Une réserve de 35 m sépare le programme de résine des logements ; les procédés, vents, équipements anti-incendie et stocks restent à préciser.

La distance minimale entre les empreintes des bâtiments est **2,5 m**, vérifiée sur toutes les paires. Les maisons emploient les **quatre orientations natives**, choisies d’après la rue voisine : portes vers l’accès, plutôt qu’une alternance systématique façade/dos. Les bâtiments publics donnent sur leur cour. Aucun sprite n’est tourné ou déformé par une transformation d’image.

Chaque bâtiment possède un seuil et un chemin raccordé à la rue. Les chemins extérieurs suivent seulement les axes X et Y et réservent **2 m de largeur** ; le raccord au seuil se resserre à la largeur physique de la porte existante. Le routage réserve un mètre de chaque côté de l’axe, puis regroupe seulement les segments cardinaux colinéaires ; aucune simplification diagonale ne coupe les virages. Les raccords de grille aux seuils et aux rues sont construits avec des coudes à angle droit et un contrôle géométrique exact. Les accès aux seuils sont contrôlés avec les volumes de collision natifs et le rayon réel du joueur. Les arrières de parcelles sont ménagés en cours et jardins ; les petits parterres bas restent hors de la circulation, sans créer de stocks ou d’obstacles.

Le nombre de maisons est fixé par une capacité de conception d’environ 108 % de la population, puis les façades proches des rues sont conservées en priorité. Une recherche de placements ne signifie donc plus qu’il faut remplir tout l’espace disponible.

Les trois marchés ont des cours ouvertes. Conseil, soins, refuges et logistique occupent les grandes parcelles publiques. Le jardin est conservé ; les espaces libres des cours civiques restent des réserves d’aménagement, pas des terrains à remplir de maisons sans examen. Les catégories automatiques « Cathedral », « MilitaryWard », « Slum » ou « GateWard » conservées dans `sourceWard` documentent la source : elles ne créent pas une religion, une garnison, une catégorie sociale ou une enceinte dans la bible. Les quartiers accueillent une population mixte ; aucun découpage ethnique n’est déduit du générateur.

Aucune enceinte ou citadelle n’est établie par la bible pour Clairfoyer. Le plan les désactive. Un petit poste d’accès et un emplacement d’observation au sud restent **des propositions**, sans soldats, armes, budgets ou provisions créés. Une activation exigera une mission et un approvisionnement réels.

## Usage effectif de Watabou et provenance

L’URL demandée est <https://watabou.itch.io/medieval-fantasy-city-generator>. L’environnement a refusé la connexion HTTP CONNECT avec un code 403 ; ce domaine ne figure pas dans sa liste réseau autorisée. La session n’a donc pas manipulé l’interface actuelle du site.

La proposition a été générée en exécutant le **code officiel public** <https://github.com/watabou/TownGeneratorOS>, révision `7fbc87a9398cc508af24de93f79cf2ad027f352b`, sous Haxe 4.3.7. Son README indique explicitement qu’il manque les plans d’eau et l’interface des options récentes. Le fichier `sources/clairfoyer-watabou.json` conserve la géométrie originale, les rues, parcelles, types de quartiers, la provenance et l’empreinte du fichier Model original.

Paramètres : `size=40` (nombre d’îlots du générateur, **pas** un nombre d’habitants), `seed=10629`, `plaza=true`, `citadel=false`, `walls=false`. L’outil d’export ajoute uniquement ces trois booléens explicites au constructeur et deux corrections de typage pour Haxe 4 ; les classes géométriques minimales servent à exécuter le calcul sans interface OpenFL. L’algorithme Watabou est conservé. Les sources GPL du générateur restent dans un checkout externe ; aucun moteur Watabou n’est embarqué dans le jeu.

Adaptation : 4,4 mètres par unité du générateur, sans rotation, centre source transféré à `(-750, -80)` m du point historique de Clairfoyer. Cette transformation ne déforme pas les axes. Les routes **extérieures** inventées par le générateur ne sont pas importées ; les rues intérieures sont raccordées au seul réseau existant. Rive, rivière, sols et limites sont vérifiés sur l’atlas, et non déduits d’une option visuelle Watabou.

L’atelier fournit six vues de ville, plus les deux nouvelles vues de réseau : plan géographique avec empreintes réelles et échelle, géométrie Watabou source, et quatre détails isométriques du marché et des rues habitées au centre, au nord et au sud. Les détails utilisent les sprites existants de Teremor, le terrain natif et la référence actuelle de Kaldor. Ils réemploient `architecture-render.js` : mêmes tranches de profondeur, mêmes orientations et même effacement des maisons que le jeu, au lieu de trier des images entières.

## Transcription orthogonale et distances

Les bâtiments et toutes les voies ont les mêmes axes de sol. `scripts/city-plans/orthogonal-network.cjs` extrait les jonctions et recouvrements du réseau source, conserve les identifiants de routes et les raccordements, puis produit des segments suivant exclusivement X ou Y. La projection `x=u-v ; y=(u+v)/2` donne les deux diagonales de pente ±1/2 du jeu. Les anciens contours de quartiers ne sont plus tracés comme des chemins et les axes organiques ne restent pas en filigrane sur le sol.

Le plan conserve les **126 itinéraires urbains et leurs 98 jonctions sources**, et les seuils et cheminements de chaque maison sont également orthogonaux. Le raster natif accepte `route.orthogonal=true` : bouts et croisements carrés, largeur droite, usure dans la texture sans ondulation du contour. Les autres terrains gardent leur rendu existant.

`data/world/orthogonal-roads-draft.json` transpose les **137 routes terrestres**, en conservant tous les sommets de référence et les **57 points de ponts** de l’atlas. Les itinéraires maritimes ne sont pas convertis en rues. Ce fichier n’est pas chargé par le jeu courant ; les largeurs des ponts, berges et passages du relief nécessitent encore une validation physique avant activation.

**Une conversion à angles droits ne peut pas conserver simultanément les positions exactes des points et toutes les longueurs physiques d’origine.** Entre deux points fixes, la longueur minimale devient |Δx|+|Δy|. Cette version conserve les positions géographiques et les distances de référence comme deux contrats distincts de la géométrie affichée. Aucun changement de vitesse ne masque l’allongement.

Le cumul des itinéraires urbains passe physiquement de **16,019 km à 20,147 km (+25,8 %)** ; les valeurs de référence restent intactes, itinéraire par itinéraire. Les routes terrestres du monde passent de **250,184 km de référence à 316,724 km de géométrie**. Ces cumuls incluent les sections partagées dans chaque itinéraire et ne prétendent pas mesurer la voirie unique. `art/city-plans/distances-chemins.json` et son CSV donnent les deux longueurs et leur différence pour chaque route. Le choix entre maintien des positions et réaménagement pour réduire les longueurs physiques reste à valider ; la longueur effectivement parcourue n’est pas annoncée comme inchangée.

L’atelier ajoute une comparaison avant/après à cadre géographique identique et une vue du réseau du monde en projection 2:1. Les données de l’atlas, la simulation, les vitesses et les paquets distribués ne sont pas modifiés.

## Reproduire et vérifier

Depuis la racine du dépôt, avec Haxe installé et un checkout officiel à la révision indiquée :

```bash
WATABOU_SOURCE=/chemin/TownGeneratorOS HAXE=/chemin/haxe node scripts/generate-watabou-city.cjs 40 10629
node scripts/design-world-roads-orthogonal.cjs
node scripts/design-clairfoyer.cjs
node scripts/check-city-plans.cjs
node scripts/render-city-plans.cjs
node scripts/render-orthogonal-roads.cjs
node --test tests/orthogonal-roads.test.cjs tests/terrain-isometric.test.cjs
python3 -m http.server 8000
```

Ouvrir `/art/city-plans/`. L’export de source est indépendant : une adaptation du plan ne nécessite pas un accès réseau ou une nouvelle génération. La construction habituelle du jeu ne remplace pas ces propositions et ne les active pas.

`clairfoyer-validation.json` vérifie la conservation des coordonnées et de la démographie, les identifiants uniques, l’absence de mise à l’échelle des sprites, les fondations sur terre praticable, l’appartenance de tous les bâtiments à Boisclair, les entrées joignables depuis l’accès historique et les rues sur toute leur largeur, les quatre orientations, les seuils, les chemins de 2 m sur tout leur tracé et les reculs de 2,5 m. Le contrôle piéton utilise une grille de 0,5 m et le rayon physique du joueur, 5/16 m ; c’est une vérification de conception, pas un essai complet de tous les mouvements du moteur. Le nombre de bâtiments par tranche de 32 m est mesuré pour préparer le chargement spatial. `occlusion-check.json` vérifie, pour chacune des quatre orientations, un passage libre derrière une maison, le maintien de sa fondation bloquante, l’effacement progressif de la maison entière et son retour à l’opacité normale. `workshop-check.json` couvre les huit vues et le zoom sur ordinateur et mobile.

Restent avant activation : approbation du plan ; confirmation et aménagement de l’eau potable ; drainage, fontaines, puits/citernes, cours et mobilier ; ravitaillement et emplois des services ; statut et budget des postes ; accès des montures et charrettes ; parcours réels, transparence, sauvegardes et essais de performance dans le moteur sur mobile. Les modèles conservent leurs collisions et leur transparence existantes, mais les 2 684 placements n’ont pas été activés ni mesurés en jeu.

Pour les autres villes, villages, fortifications et avant-postes : repartir de chaque fiche, du relief et des accès, choisir des paramètres et une graine conservés, adapter le programme à sa population et sa fonction, vérifier l’eau et le ravitaillement, puis présenter les cartes. Un nom de ville, un type de quartier Watabou ou une ressource potentielle ne suffit jamais à justifier une forteresse ou un avant-poste opérationnel.

## Variante carrée séparée

À la demande d’un aperçu sans petits décrochements, `clairfoyer-square.json` propose **36 îlots de 128 × 128 m**, sur une emprise carrée de 768 m de côté. Quatorze rues continues structurent la grille ; les ruelles intérieures sont droites. Les accès historiques sont conservés, mais les carrefours et les parcelles internes sont recomposés : les distances physiques doivent être recalculées pour cette variante. Elle ne remplace ni le plan précédent ni le registre des localités.

Les 2 601 bâtiments utilisent les modèles natifs et leurs quatre orientations. Les 2 601 entrées sont raccordées par des cheminements orthogonaux de 2 m ; le contrôle géométrique retrouve un écart minimal de 4 m entre fondations. Les capacités de logement et les 10 629 habitants de conception restent comptabilisés. `art/city-plans/variante-carree/validation.json` lie ces vérifications à la révision du plan. Aucun placement n’est activé en jeu et aucun push n’est effectué.

```bash
node scripts/design-clairfoyer-square.cjs
node scripts/render-city-plans.cjs --square
node scripts/render-square-comparison.cjs
```

L’aperçu, la comparaison au même cadre et à la même échelle, et les vues natives sont consultables dans `art/city-plans/variante-carree/index.html`.

## Étude fonctionnelle des quartiers — sans validation

La demande du joueur ne valide aucun tracé. `data/architecture/city-plans/clairfoyer-districts.json` est une couche séparée, appuyée provisoirement sur la variante carrée pour localiser les fonctions. Le programme devra être réadapté au tracé retenu. Les noms sont proposés ; aucune date, dynastie, corporation historique ou origine de quartier n’est ajoutée à la bible. Les chapitres 01, 02, 03, 05 et 06 et la fiche canonique de Clairfoyer sont référencés avec leur empreinte.

Neuf quartiers composent le tissu principal : Clos communs (jardin et voisinage), Cours des Métiers (réparations et petites boutiques), Maisons de la Rive (habitat sur terre praticable), Halles du Boisclair (marché), Cour du Conseil (administration, soins et refuge), Rue des Étapes (accueil commercial oriental), Cours du Bois (réception et métiers forestiers), Greniers du Marché (réserves à programmer), Relais du Sud (logistique du sentier). Le Relais de l’Arrivée conserve le point canonique ; la Cour des Résiniers forme une annexe productive à l’ouest. Ces limites suivent les rues et ne constituent ni murs ni colliders.

Chaque fiche précise fonctions, matières, repères, mobilier, usure, routines, dépendances, eau, vivres, refuge, tensions possibles et travail restant. Tous les voisinages restent mixtes ; aucun métier ou réseau criminel ne leur est attribué par espèce. Les effectifs par quartier sont seulement la somme des logements du brouillon ; la démographie canonique reste celle de la ville entière. Les réseaux criminels ne sont pas implantés par cette étude et les litiges ne créent aucun événement.

Les teintes de carte servent de légende. Les placements du plan ne portent pas encore les nouvelles identités visuelles ; le catalogue séparé décrit ci-dessous en propose désormais les dessins. Les maisons, chemins, collisions et orientations ne sont pas modifiés. Les nouveaux services doivent obtenir des parcelles et parfois remplacer des logements : relogement et capacité devront être rééquilibrés. Eau potable, drainage, volumes de réserve, capacité des soins et refuges, personnel, contrats, manœuvres des charrettes et performances restent à vérifier. Aucun nouveau puits, abreuvoir, stock, visiteur ou garde n’est créé.

L’inventaire révèle deux gabarits impropres à une installation résinière définitive : B12 est un atelier de charpente et B06 un grenier collectif. Ils ne prouvent ni la transformation de résine ni la sécurité de son stockage. Le programme signale explicitement cette reprise nécessaire.

Reproduction : `node scripts/design-clairfoyer-districts.cjs`, puis `node scripts/render-clairfoyer-districts.cjs`. L’atelier `art/city-plans/quartiers/index.html` affiche la carte, les relations fonctionnelles et les onze fiches. Les flèches sont schématiques, pas des routes diagonales. Aucun plan n’est validé, activé ou poussé.

## Bâtiments et infrastructures proposés pour les quartiers

Le catalogue d’auteur `sprites/architecture/clairfoyer-district-catalogue.js` et les géométries de `clairfoyer-districts.js` ajoutent **22 bâtiments et 14 infrastructures**, avec quatre orientations par modèle, soit 144 vues. Chaque secteur possède deux bâtiments ; les équipements complètent jardin, marché, soins, bois, réserves, transit et résine. L’atelier est `art/city-plans/quartiers/batiments/index.html`.

Onze palettes de matériaux différencient les quartiers : crème/blé aux Clos ; grège/brique aux Métiers ; sauge grisée à la Rive ; ocre/miel aux Halles ; calcaire/ardoise froide au Conseil ; enduit rosé et terre cuite aux Étapes ; bois forestier grisé aux Cours du Bois ; bois blond et tuiles gris sable aux Greniers ; argile sombre au Sud ; ivoire/olive à l’Arrivée ; pierre froide et bois brun à la Résine. Les rampes comportent cinq tons par matériau, sur les mêmes indices et le même budget de palette que la bibliothèque native. Aucun filtre coloré n’est appliqué à un PNG.

Les variations de volume incluent le lanterneau bas de la halle, la lucarne des Étapes, les renforts du Sud et des ateliers forestiers, les pilastres du Conseil, les lames de ventilation des Greniers, les rives de toiture de la Rive et les auvents plus compacts de l’Arrivée. Contours, textures, lumière et usure sont calculés par le renderer commun. Les modèles conservent 16 unités natives par mètre de sol et 22 unités de dégagement aux portes ; Kaldor sert de comparaison avec ses pixels actuels et le même zoom entier.

Le placement des nouveaux modèles utilise le centre de l’emprise au sol comme ancrage logique ; pixels, collisions, ouvertures et profondeurs sont vérifiés ensemble dans les quatre vues. Pavage affleurant et seuil d’un pixel restent des finitions traversables ; corps des maisons, poteaux et mobilier gardent leurs volumes solides. Halles et remise de charrois réservent une traversée de 2 m ; cela ne démontre pas encore les manœuvres de tous les véhicules. Les portes fermées ne créent pas d’intérieurs. Le fondu de la maison entière à 32 % conserve les fondations bloquantes dans le renderer partagé.

`architecture-isometric.js` expose une fabrique de bibliothèques d’auteur et `architecture-render.js` une fabrique d’adaptateurs isolés. Le catalogue principal n’enregistre aucun nouvel identifiant. La recompilation des 696 vues existantes actualise seulement leur empreinte de source : leurs données de pixels, calques, ancrages et profondeurs restent identiques octet par octet. Ni les pages du jeu distribuées ni le paquet iOS ne sont reconstruits.

Reproduction : `node scripts/export-clairfoyer-architecture.cjs`. Contrôle de l’atelier, des exports et de la conservation des vues existantes : `node scripts/check-clairfoyer-architecture.cjs`. Vérification unitaire : `node --test tests/clairfoyer-district-architecture.test.cjs tests/architecture-isometric.test.cjs tests/architecture-game.test.cjs tests/architecture-occlusion.test.cjs`. Les planches, les 144 PNG natifs et le manifeste exporté portent les dimensions, ancrages et volumes.

Tout reste proposé et séparé du jeu : citernes et abreuvoirs à raccorder, stockage sans inventaire créé, bâtiments publics sans capacité collective approuvée, aucun résident ou garde ajouté. Les futures implantations devront réserver parcelles et accès et maintenir la capacité de logement. Aucun plan validé ni push.
