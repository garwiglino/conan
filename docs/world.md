# Monde de Kaldor — prototype intégré

État courant : voir aussi [les fonctionnalités et limites du jeu](etat-du-jeu.md), [le monde vivant](living-world-integration.md) et [la justice et les convois](world-justice.md).

## Géographie et échelle

Le monde jouable mesure **72 × 48 km** : c’est la carte Azgaar resserrée au vingtième (version « Équilibré »). Une tuile de terrain de 16 pixels représente **un mètre** ; les coordonnées de déplacement, les routes, les distances et les cellules utilisent cette même conversion. Rien ne téléporte le joueur lorsqu’il marche à la limite d’une zone. Une journée du calendrier dure **60 minutes réelles** en exploration normale (`world-pacing.js`). Une minute du calendrier vaut 2,5 secondes réelles. Kaldor marche à 67 px/s, soit environ 4,19 m/s : un kilomètre prend 4 minutes réelles. Les transports utilisent leurs propres vitesses de voyage exprimées en mètres par minute du calendrier.

Igea (neige), Teremor (forêts tempérées) et Sarak (aride) forment une **seule masse terrestre**. Varan (humide et marais) et Tagon (tropical et plages) sont deux îles plus petites. Les 14 régions et 83 localités sont importées de la carte approuvée. La carte en jeu affiche les frontières, les routes, les destinations et les régions au zoom ; les terres fermées par les frontières naturelles y sont assombries. Les lieux maudits restent limités aux zones de la source, avec pierres grises et lueurs violettes et vertes, et un sentier mène dans chacune d’elles. Une bande de 60 m de part et d’autre des frontières de biome mélange sols et végétation.

Les sources éditables sont dans `data/world/` : fichier Azgaar `.map`, export intégral, géométrie en mètres, réglages du resserrement `layout.json` et export compact `atlas.json`. `npm run build:world` reconstruit ce dernier avec `scripts/world-layout.cjs`, puis les deux HTML. Le générateur est déterministe. Il trace les routes sur la terre ferme, loin de l’eau, et le contrôle des détours côtiers tous les 75 m reste actif. Les chemins des embarcadères et le raccord du camp appartiennent au même réseau utilisé par le rendu et la navigation. Les rivières reçoivent un détail métrique, et les intersections traversables deviennent des ponts.

## Pays, routes et frontières naturelles

« Pays » désigne ici un regroupement géographique de localités pour l’aménagement de la carte. Ce terme ne crée pas un État souverain par région ; Sylverive reste notamment sous la souveraineté de Teremor.

Chaque région devient un **pays** : ses localités sont regroupées autour d’un centre, à environ 1,2 km les unes des autres (5 minutes de marche), en gardant leur disposition relative et le sol où elles ont été fondées (un village de marais reste dans le marais). Les terres de chaque région sont redistribuées au pays le plus proche de son territoire, sans changer de territoire. Les ports sont placés sur la vraie côte océanique la plus proche.

- **Chemins** : dans un pays, un arbre couvrant relie toutes les localités, complété par quelques boucles courtes qui ne se croisent pas.
- **Routes** : deux pays voisins sont reliés par une route entre leurs deux localités les plus proches, de 14 à 32 minutes de marche.
- **Traversées** : les quatre liaisons maritimes de la carte source partent de vrais rivages et suivent la mer.
- **Frontières naturelles** : la terre reste ouverte dans les pays et leur lisière de 1,5 km, le long des routes et chemins, autour des ports et dans trois **étendues sauvages** (Igea, Teremor et Sarak), atteintes par un couloir sans route. Ailleurs, le sol devient infranchissable. Le bord suit un bruit doux de 700 m pour éviter les lignes droites. Cette passe le dessine en roche ; l’habillage par biome (falaises, forêt dense, dunes, marais profond) viendra ensuite.

Les réglages se trouvent dans `data/world/layout.json`. Les positions Azgaar d’origine des localités restent dans `atlas.json` (`legacy`) pour la migration des sauvegardes.

### Anciennes sauvegardes

Une sauvegarde faite sur la carte à l’échelle 1:1 est convertie au chargement. L’histoire, les pièces, l’inventaire, le groupe, les lieux découverts et le journal sont conservés. Kaldor, ses compagnons et ses points de reprise passent au nouvel emplacement de la localité la plus proche ; dans le camp d’origine, rien ne bouge. Un voyage en cours se termine directement à sa destination. Les événements liés aux anciennes routes, les courriers, le brouillard de la carte et les positions des habitants sont recalculés ; les localités déjà visitées restent révélées.

## Terrain, atlas procédural et limites

La zone du Temple du Serpent, ses quêtes, ses mécanismes et ses décors sont conservés. Une sortie au sud relie son camp au réseau mondial. Le monde charge des secteurs de **32 × 32 tuiles**, avec au maximum 48 secteurs de données et 32 textures en mémoire. Le terrain est déterministe ; revenir au même endroit retrouve le même sol. Les morts des rencontres sauvages sont sauvegardées.

Les 83 localités sont pour cette passe des **relais de test** : habitants, halte, tente, charrette et panneau. Elles ont leurs coordonnées, leur région et leurs itinéraires, mais ne sont pas encore 83 villes entièrement bâties avec intérieurs et quêtes propres. Le kit désert de la première carte reste la référence et son sol est conservé. Les nouvelles matières reprennent ses rampes de couleurs, sa lumière en haut à gauche, sa quantification et son dessin pixel par pixel. Les nouveaux arbres, pierres maudites, charrettes, panneaux et la fée sont dessinés en JavaScript avec le système de pixels du jeu. Elyne réutilise provisoirement le sprite de nomade.

## Direction artistique et fabrication des biomes

`scripts/world-terrain-art.js` fabrique les sols directement en JavaScript, à 16 pixels par mètre. Les coordonnées absolues pilotent dunes, grain, strates, fissures, plaques végétales, neige et ornières. Les rives disposent de hauts-fonds, d’une bordure humide et d’ombres. Les plages suivent les vraies côtes ; les ponts suivent la direction de la route, même en diagonale. Les petites flaques de marais sont une couche de sol peu profonde et traversable ; les rivières et la mer restent des obstacles nécessitant un pont ou un transport.

| Milieu | Matières et végétation |
| --- | --- |
| Sarak, aride | Sable et pistes du kit initial, ondulations de dunes, roche stratifiée, arbustes, arbres morts |
| Teremor, tempéré | Humus, herbe en touffes, chênes et feuillage clair, rochers moussus, fougères, fleurs et champignons |
| Igea, froid | Neige, sol gelé, rochers froids, conifères enneigés ; taïga et toundra entre forêt et neige |
| Varan, humide | Boue, flaques peu profondes, cyprès à racines, roseaux, mousses et sous-bois humide |
| Tagon, tropical | Sol végétal dense, grands feuillages, lianes, palmiers, fougères, plages de sable |
| Zones maudites | Pierre grise, cendres fissurées, arbres morts pâles, pierres à veines et lumières violettes/vertes |

Les transitions de 60 m mélangent des plaques de matières et les espèces, pas seulement la couleur générale. Les décors occupent des bosquets et laissent des clairières ; une marge dégagée protège les routes. Les relais choisissent leur végétation selon leur biome. `scripts/world-props-art.js` contient les silhouettes et variantes, en tampons de 64 × 64 pixels ancrés au pied comme les objets originaux. Les ombres ne sont pas retournées avec les variantes.

Le calcul des sols utilise une bordure de 32 pixels pour les distances à l’eau et les reliefs. Elle est retirée après rendu, ce qui assure les raccords entre secteurs. `world-art-stream.js` prépare les secteurs voisins dans un Web Worker, avec huit demandes maximum et 32 images en cache. Si les workers sont indisponibles, le même dessin fonctionne de manière synchrone ; le premier affichage ou un déplacement instantané vers une région non préparée peut demander un calcul initial. Les reflets d’eau utilisent quatre phases légères. La fée utilise les lumières radiales et les lueurs additives des projectiles magiques, centrées sur son mouvement ; le carré translucide a été supprimé.

Références étudiées pour la méthode (aucun sprite tiers importé) :

- [Tiled — terrains et raccords](https://doc.mapeditor.org/en/stable/manual/terrain/) : cohérence des bords et des coins, variantes compatibles.
- [SLYNYRD — Top Down Tiles](https://www.slynyrd.com/blog/2019/8/27/pixelblog-20-top-down-tiles) : amas de pixels, zones calmes, palettes limitées et contrastes entre matières.
- [Saint11 — Pixel Art Tutorials](https://saint11.art/blog/pixel-art-tutorials/) : références de fabrication des textures et des silhouettes.
- [SorceressGameLab — Top down RPG tileset sur itch.io](https://sorceressgamelab.itch.io/top-down-rpg-tileset) : référence de famille de tuiles 16 × 16 et de palette cohérente.

`node scripts/preview-world-art.cjs` produit des captures du véritable rendu dans `test-output/world-art/`, dont les biomes, les transitions, les décors et la fée. Les tests comparent les pixels de rendus qui se chevauchent, vérifient le dessin des routes/ponts, les décors, la parité worker/repli, les limites du préchargement et la lumière de la fée.

## Début et compagnons

Cette version est un bac à sable : Kaldor apparaît au camp initial, accompagné de la fée. Elyne est à proximité et rejoint le groupe au premier dialogue. La forteresse gobeline, sa grille et sa piste ont été retirées. Aucun départ forcé vers Varan, retour au foyer ou événement de fin d’escorte n’est imposé. Le Temple et les quêtes locales existantes restent jouables. Une ancienne sauvegarde encore dans la prison de test revient au camp, sans perdre son inventaire ni ses événements.

Le bouton **Compagnons** (ou **C**) donne accès aux membres du groupe, à leur vie et à leur réserve de nourriture. Les actions permettent de partager une ration, soigner, parler, attendre/reprendre la marche et quitter le groupe si le compagnon est temporaire. La fée est permanente, spirituelle, invulnérable et sans besoins alimentaires. L’API `recruitCompanion(actor, {permanent})` prépare les recrutements futurs ; les compagnons conservent leur statut et leur position à la sauvegarde, suivent les chemins praticables et suspendent leurs horaires de village pendant leur présence dans le groupe.

Une barre pleine représente **36 heures du calendrier**, soit 90 minutes réelles à satiété initiale pleine, sans chaleur excessive ni repas, à cette vitesse d’horloge. Une ration restaure 50 %. Le partage automatique sous 50 % est activé par défaut et peut être désactivé pour l’exploration ; les repas des voyages organisés restent automatiques. Les provisions sont décomptées par repas, jamais deux fois par le suivi du temps. À jeun, Kaldor perd lentement de la vie après épuisement de sa réserve, sans mourir passivement de faim (plancher de 1 PV) ; les compagnons peuvent s’épuiser. Une tenue trop chaude pour la chaleur creuse la faim plus vite, et le froid ronge la santé de Kaldor quand sa tenue ne suffit pas : voir [froid, chaleur et tenues](body-heat.md). Le groupe porte aussi ses gourdes. Les ennemis peuvent blesser les compagnons : une fiole ou une halte les soigne. Un départ refuse de laisser un membre en attente, blessé ou éloigné.

## Lieu et navigation

Le HUD conserve une seule rangée, y compris sa jauge de nourriture. L’encart de localisation reste sur deux petites lignes sans accents : lieu puis voie proche, ou **Terres Sauvages**. Il garde la route actuelle dans une marge de sortie supérieure à la marge d’entrée ; un changement ordinaire doit durer 0,9 seconde. Une arrivée lointaine ou un changement d’étage met le lieu à jour immédiatement.

**Carte** ou **G** ouvre l’atlas ; le menu de pause possède aussi un bouton Carte. Les boutons Carte et Compagnons se placent sous Menu, au-dessus des actions. La carte permet de déplacer la vue, zoomer, choisir une localité et suivre un point précis ; elle ne permet jamais de déclencher un transport. Villes, relais, embarcadères, transporteurs, auberges et haltes sont tirés des mêmes objets que le monde jouable. Les filtres et les niveaux de zoom limitent l’encombrement. Les auberges correspondent aux bâtiments de halte réellement placés ; les autres haltes sont des campements.

Le lieu suivi est sauvegardé et reçoit un fanion pixel art aux tons bronze et sauge, distinct des flèches pleines des quêtes. Le HUD affiche sa distance **à vol d’oiseau** en direct : kilomètres au-delà de 1 000 m avec trois décimales (précision d’un mètre), mètres à l’approche. L’affichage est recalculé à chaque image à partir de la position réelle. Ce suivi n’écrase ni les objectifs ni leur guidage. Il ne prétend pas représenter la longueur d’un itinéraire routier ; celle-ci apparaît dans le devis du transporteur.

Dijkstra travaille sur les sommets partagés des routes. Chaque arête contient sa longueur, ses modes autorisés et son danger. Les routes permettent cheval et charrette ; les sentiers difficiles excluent la charrette. Les voies maritimes exigent le bateau. L’option prudent pénalise le danger en plus du temps ; les événements actifs ferment des arêtes ou modifient leur coût. Une fermeture portant sur une voie partagée ne peut pas être contournée en changeant seulement son nom.

## Transports

Les départs exigent une discussion avec un transporteur physiquement présent et proche. Le moteur vérifie cette proximité, le moyen proposé et l’état du relais, même si une interface essaie de passer outre. Une autorisation de départ n’est jamais sauvegardée. Les chevaux et les charrettes sont visibles aux relais ; 8 embarcadères équipés de barques, deux par traversée, sont placés sur les côtes réelles. Leur accès terrestre est ajouté au réseau partagé, et les voies maritimes commencent au quai. Les bateaux sont dessinés sur l’eau. Le plan affiche kilomètres, durée, prix, danger, traversées et besoins du groupe. Les vitesses de devis sont dérivées de la même horloge que la marche : environ 0,63 km par heure du calendrier à pied, 1,05 à cheval, 0,79 en charrette et 1,31 en bateau. La marche manuelle reste à environ 4,19 mètres par seconde réelle avant fatigue et déshydratation ; le transport organisé accélère la présentation du trajet. Le calendrier comprend huit heures de trajet terrestre puis dix heures de halte, ainsi que les attentes d’embarquement et les retards signalés ; sur la carte resserrée, seule une très longue marche atteint cette limite. Une étape maritime garde sa géométrie : aucune ligne droite à travers un continent.

Les étapes affichent « Chevauche via… », « Voyage en charrette via… », « Se repose à… », « Bivouaque sur… », « Attend l’embarquement à… » et « Navigue via… ». La durée de base passe à 6–24 secondes selon la distance ; chaque nouvelle phase reste visible au moins 1,6 seconde et chaque repas ajoute une pause de 0,9 seconde. Les segments consécutifs portant le même libellé partagent ce délai, pour éviter de ralentir chaque tronçon de route. C’est une progression accélérée du voyage, pas une fausse promesse de travail réseau. L’horloge, les ressources, les voyageurs et les événements avancent par tranches de 60 minutes maximum. Quand le jeu est masqué (autre app, autre onglet), le voyage suit l'heure réelle : à la sortie, le moteur prévoit l'arrêt (arrivée, passage menacé ou fermé, halte demandée) en rejouant les vérifications sur une copie de l’état mondial, y compris sa simulation économique. Cette prévision rejoue le même moteur de voyage sur une copie isolée du jeu et compte les pauses de repas. Le conseil initial dépend des nouvelles du transporteur ; les dangers encore inconnus interrompent le voyage à leur approche physique. Au retour, l'absence est rejouée par pas de 0,25 s, avec une seule sauvegarde ; passé l'heure annoncée, le voyage est toujours mené à son terme et le jeu reste en pause. Les voyageurs batraciens lointains, invisibles, ne se déplacent pas pendant ce rattrapage. Le joueur peut continuer à marcher librement sans ce service. Le déplacement à pied reste manuel. Chez le batelier, le premier segment doit être maritime ; les correspondances terrestres ultérieures s’enchaînent automatiquement.

Une fermeture apparue pendant un voyage terrestre interrompt le trajet à une position praticable. Une demande de halte en mer attend un port. La sauvegarde conserve les étapes, la progression, les pièces déjà payées et la position ; reprendre ne facture pas une seconde fois. Les données de voyage invalides reviennent à une halte sûre. Les besoins sont visibles dans Compagnons et sur l’écran de voyage ; cette première passe n’applique pas de pénalité de combat à la fatigue de Kaldor. Les dangers déterminent le choix du trajet et la densité des ennemis à pied ; le voyage accéléré ne déclenche pas encore d’embuscade scénarisée.

## Chronique locale et connaissances des PNJ

La sauvegarde du jeu contient un identifiant de campagne, une révision, le calendrier, les événements et les connaissances individuelles. Une copie JSON est écrite dans le stockage local du navigateur et, lorsque disponible, dans le fichier privé OPFS **hearthreaver-world-events.json**. Il s’agit du stockage de ce navigateur, pas d’un fichier créé silencieusement dans les documents de l’utilisateur. Le bouton **Exporter la chronique** télécharge une copie lisible. Une erreur de stockage privé laisse fonctionner le miroir local ; si les deux stockages sont refusés, seule la session en mémoire subsiste.

La sauvegarde du jeu reste prioritaire. Une chronique d’une autre campagne, d’un calendrier futur ou d’une révision plus ancienne ne la remplace pas. Les écritures de fichier sont séquentielles. À l’ouverture du jeu, le fichier privé est vérifié ; à chaque discussion, le miroir local est consulté avant la mise à jour des connaissances.

Un personnage explicitement désigné comme témoin apprend un événement comme témoignage direct ; la proximité seule donne une information locale. Les autres reçoivent les nouvelles par les registres locaux, les échanges de carnets des voyageurs et les copies datées emportées par les cargaisons. Une distance ou un délai fixe ne suffit plus, dans le jeu embarqué, à donner automatiquement une nouvelle à tous les habitants. Les délais historiques de 30 minutes pour un courrier et six heures pour un résident appartiennent au modèle isolé sans simulation attachée. Un PNJ peut encore croire une route fermée après sa réouverture, jusqu’à recevoir la correction. Les nouvelles vieilles de plus d’une journée sont présentées comme à confirmer. Les blessures, l’épuisement et la confiance d’Elyne sont privés ; ils ne deviennent pas des ragots universels. Les nouvelles discutées entrent dans le journal du joueur avec leur date et leur source.

## Événements et simulation actuelle

Le jeu embarqué attache `world-simulation.js` à `WorldState`. Son avance remplace le générateur historique par modulos de dates ; les types encore présents dans le registre ne disposent pas tous d’un déclencheur autonome.

| Famille | Fonctionnement intégré | Limite actuelle |
| --- | --- | --- |
| Économie | Stocks persistants, consommation, intrants, achats et prix locaux ; pénurie quand les réserves alimentaires ou l’eau manquent | Cohortes économiques réduites et paramètres encore à équilibrer ; pas d’ateliers physiques complets |
| Convois | Réservation des biens, argent, convoyeurs et escortes ; livraison unique puis retour ; acteurs physiques proches | Prises de cargaisons et récupération financée intégrées ; pas de bataille navale ou de simulateur général de guerre hors écran |
| Sécurité | Patrouilles financées sous autorité locale ; embuscades liées à un trafic réel et un réseau admissible | Aller et retour sur le graphe, péages réels ; grandes tournées et rançons encore absentes |
| Terrain | Crues sous forte pluie et réouverture après décrue ; chantiers pour dégâts de pont, éboulement, avalanche ou incendie enregistrés | Tous les types de dégâts n’ont pas encore leur propre déclencheur causal |
| Justice | Témoins et dépositions, recherche locale, reddition, sanctions financières et détention temporaires | Vol, contrebande et autres procédures de la bible incomplets |
| Vie locale | Conversations, voyageurs, fuite, repli, retour, blessures et décès persistants ; relève de service | Peuplement complet, besoins et relations durables de chaque habitant à compléter |
| Météo | Pluie, neige et brouillard locaux selon le climat ; information et effets sur risques et besoins | Tempêtes maritimes issues du climat ; sécheresses et autres conséquences encore partielles |
| Conflits et malédictions | Le registre et le combat savent traiter certains incidents déjà enregistrés ; libération du temple conservée | Pas de diplomatie opérationnelle, de sièges périodiques ou de quête distribuée de purification |

Fêtes, successions, disparitions et guerres ne sont plus inventées par le calendrier historique. Les 17 règles de la bible définissent des conditions de conception ; elles ne sont pas toutes activées dans le moteur.

Le monde n’avance pas continuellement quand la partie est fermée ; un voyage masqué fait l’objet d’un rattrapage au retour. La simulation causale traite les heures traversées, sans l’ancienne limite rétrospective de 90 jours. Les événements et connaissances persistants ne sont plus évincés après 512 événements. Le journal des nouvelles discutées conserve 120 entrées et le journal technique économique 1 000 ; un archivage des très longues campagnes reste à prévoir. Les limites spécifiques des autres registres de sauvegarde restent distinctes.

## Vérification et reconstruction

- `npm run build:world` : données et HTML web/iOS.
- `npm run embed:title` : menu, météo et monde, sans écraser les modules du monde.
- `npm test` : jeu existant, géographie, connexions à pied, surfaces terrestres, modes, fermetures, connaissances, transitions, streaming, migrations de l’ancienne geôle, compagnons, voyages, sauvegarde, halte maritime, fichier local et interface réelle sous JSDOM.
- `npm run package:ios` : archive native avec le HTML embarqué à jour.

Le fichier natif Azgaar reste la source pour modifier les grandes formes. Le resserrement en pays, les routes, les frontières naturelles, le raccord du camp et le terrain à l’échelle du mètre sont des raffinements du jeu et doivent être reconstruits après un nouvel export.

## Planche de transport et vérification

`scripts/transport-art.js` contient les dessins natifs de chevaux, charrettes, barques, quais, barres d’attache et auberges. `node scripts/preview-transport.cjs` reconstruit `docs/art/transport-sprites.png` depuis les mêmes caches que le jeu, avec Kaldor comme référence de taille. Les sorties de contrôle du HUD à 216, 256 et 320 pixels logiques et du camp/port se trouvent dans `test-output/travel/`.

`tests/travel-party.test.cjs` vérifie notamment la faim sur 36 h, les repas, les autorisations de transport, l’emplacement des barques sur l’eau, la persistance des compagnons et lieux suivis, les unités de distance et le HUD sur une seule ligne. Les tests du monde conservent les validations d’itinéraires, événements, connaissances, reprise de voyage et arrêt en mer ; les tests du menu vérifient les nouveaux panneaux et l’absence de départ sur la carte.

## Brouillard de guerre

La carte commence en vue générale. Le bouton « Transport le plus proche » suit le relais ou port ouvert le plus proche à vol d’oiseau, même inconnu, sans révéler les autres lieux ni enregistrer une visite. Ce repère persiste dans la sauvegarde. Les terrains et routes inconnus restent visibles en niveaux de gris ; les zones explorées retrouvent leurs couleurs ; un quadrillage de 256 m, stocké sous forme d’intervalles fusionnés par rangée, conserve les couloirs explorés sans allouer une texture à l’échelle du monde. La marche et les voyages révèlent le terrain parcouru ; une réapparition lointaine ne révèle pas une ligne fictive entre les deux positions.

Les villes visitées sont conservées dans `discovered`. Les transporteurs, auberges et autres services sont révélés individuellement à moins de 5 m. Les points inconnus sont absents du rendu, des clics et de la liste de sélection ; un ancien suivi vers un point jamais visité est supprimé au chargement. Les sauvegardes antérieures conservent leurs localités déjà découvertes. Les transporteurs peuvent encore proposer des destinations inconnues dans leur propre dialogue : leur visite les ajoute ensuite à la carte.

### Provisions facultatives et retour de voyage

Le départ ne dépend plus des rations ni des gourdes : seules les conditions du transport, les pièces et la disponibilité du groupe restent bloquantes. Le panneau affiche les quantités conseillées, le manque et le prix du lot de trois jours ; « Partir sans compléter » accepte les réserves actuelles sans achat automatique. Pendant le trajet, les jauges de faim et de santé de chaque membre, les stocks et les repas (−1 ration, +50 points) sont affichés. À faim vide, la santé baisse continûment à raison de 1 PV par trois heures du calendrier, uniquement pour le temps réellement passé à jeun. Le plancher existant de 1 PV de Kaldor est conservé ; les compagnons peuvent tomber épuisés. Les voyages anciens restent rechargeables.

### Cohérence des réserves et des haltes

Le ravitaillement propose au moins trois jours, ou davantage pour couvrir les rations conseillées du trajet choisi. Le prix et la quantité réellement ajoutée sont calculés ensemble ; le joueur ne paie pas les rations rejetées par la limite de 999. Un avertissement prévient si l’achat ne laisserait plus assez de pièces pour le transport. L’eau alimente désormais la déshydratation : après trois heures du calendrier sans eau, elle peut coûter de la santé, avec un plancher de 1 PV pour Kaldor. La déshydratation et la fatigue ralentissent la marche ; l’eau ne provoque pas un avertissement de nourriture manquante. Le repos au relais et le sommeil sous tente ne rendent de santé qu’avec une réserve de nourriture non vide. Le plancher de faim ne remonte jamais la santé d’un personnage déjà sous 1 PV et n’agit pas sur un personnage mourant. Un compagnon épuisé en trajet est affiché comme transporté ; il devra être soigné avant un autre départ. Les pauses de présentation sont réinitialisées au chargement, sans modifier le trajet payé ni sa progression.

### Réseau et présentation du voyage

La liste commerciale contient 85 destinations habitées (83 localités, le camp et le refuge), au lieu de 121 points incluant les quais techniques. Les 8 quais restent à leur côte réelle pour les bateaux, les correspondances et les anciennes sauvegardes, mais ne doublonnent plus les localités dans la liste. Les villages isolés restent desservis : retirer leur relais imposerait plusieurs kilomètres à pied dans cette géographie. Aucun relais n’est ajouté aux ruines ou aux tronçons sauvages. Les transporteurs terrestres sont placés sur une voie d’accès, à environ cinq mètres du centre local. Une arrivée normale dépose le groupe à un emplacement libre et visible, à moins de trois mètres du transporteur ; les interruptions et haltes maritimes conservent leur comportement.

Le panneau du palefrenier utilise des textes plus petits et une aide séparée « Comment voyager », fermable avec Retour ou Échap. Le départ avec réserves insuffisantes s’intitule « Partir avec ressources actuelles ». L’écran en route présente une ligne par membre avec nom, faim et vie ; les repas sont résumés par membre (« −1 ration · +50 % »). La progression représente le temps du trajet, attentes et repos inclus, et reste immobile pendant les pauses de présentation.
