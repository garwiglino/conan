# Monde de Kaldor — prototype intégré

## Géographie et échelle

Le monde mesure **1 440 × 960 km**. Une tuile de terrain de 16 pixels représente **un mètre**. Les coordonnées de déplacement, les routes, les distances et les cellules Azgaar utilisent cette même conversion. Rien ne téléporte le joueur lorsqu’il marche à la limite d’une zone. L’horloge d’exploration utilise désormais seize minutes réelles par journée (deux fois plus lent) ; l’échelle 1:1 porte sur l’espace. Les transports utilisent leurs propres vitesses de voyage exprimées en mètres par minute du calendrier.

Igea (neige), Teremor (forêts tempérées) et Sarak (aride) forment une **seule masse terrestre**. Varan (humide et marais) et Tagon (tropical et plages) sont deux îles plus petites. Les 14 régions et 83 localités sont importées de la carte approuvée. La carte en jeu affiche les frontières, les routes, les destinations et les régions au zoom. Les lieux maudits restent limités aux zones de la source, avec pierres grises et lueurs violettes et vertes. Une bande de 800 m de part et d’autre des frontières de biome mélange sols et végétation.

Les sources éditables sont dans `data/world/` : fichier Azgaar `.map`, export intégral, géométrie en mètres et export compact `atlas.json`. `npm run build:world` reconstruit ce dernier et les deux HTML. Deux lignes Azgaar frôlaient des baies : le générateur ajoute des détours côtiers vérifiés tous les 75 m. Ces détours, les chemins des embarcadères et le raccord du camp appartiennent au même réseau utilisé par le rendu et la navigation. Les rivières reçoivent un détail métrique, et les intersections traversables deviennent des ponts.

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

Les transitions de 800 m mélangent des plaques de matières et les espèces, pas seulement la couleur générale. Les décors occupent des bosquets et laissent des clairières ; une marge dégagée protège les routes. Les relais choisissent leur végétation selon leur biome. `scripts/world-props-art.js` contient les silhouettes et variantes, en tampons de 64 × 64 pixels ancrés au pied comme les objets originaux. Les ombres ne sont pas retournées avec les variantes.

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

Une barre pleine représente **36 heures du calendrier**, soit 24 minutes réelles de marche continue à cette vitesse d’horloge. Une ration restaure 50 %. Le partage automatique sous 50 % est activé par défaut et peut être désactivé pour l’exploration ; les repas des voyages organisés restent automatiques. Les provisions sont décomptées par repas, jamais deux fois par le suivi du temps. À jeun, Kaldor perd lentement de la vie après épuisement de sa réserve, sans mourir passivement de faim (plancher de 1 PV) ; les compagnons peuvent s’épuiser. Le groupe porte aussi ses gourdes. Les ennemis peuvent blesser les compagnons : une fiole ou une halte les soigne. Un départ refuse de laisser un membre en attente, blessé ou éloigné.

## Lieu et navigation

Le HUD conserve une seule rangée, y compris sa jauge de nourriture. L’encart de localisation reste sur deux petites lignes sans accents : lieu puis voie proche, ou **Terres Sauvages**. Il garde la route actuelle dans une marge de sortie supérieure à la marge d’entrée ; un changement ordinaire doit durer 0,9 seconde. Une arrivée lointaine ou un changement d’étage met le lieu à jour immédiatement.

**Carte** ou **G** ouvre l’atlas ; le menu de pause possède aussi un bouton Carte. Les boutons Carte et Compagnons se placent sous Menu, au-dessus des actions. La carte permet de déplacer la vue, zoomer, choisir une localité et suivre un point précis ; elle ne permet jamais de déclencher un transport. Villes, relais, embarcadères, transporteurs, auberges et haltes sont tirés des mêmes objets que le monde jouable. Les filtres et les niveaux de zoom limitent l’encombrement. Les auberges correspondent aux bâtiments de halte réellement placés ; les autres haltes sont des campements.

Le lieu suivi est sauvegardé et reçoit un fanion pixel art aux tons bronze et sauge, distinct des flèches pleines des quêtes. Le HUD affiche sa distance **à vol d’oiseau** en direct : kilomètres au-delà de 1 000 m avec trois décimales (précision d’un mètre), mètres à l’approche. L’affichage est recalculé à chaque image à partir de la position réelle. Ce suivi n’écrase ni les objectifs ni leur guidage. Il ne prétend pas représenter la longueur d’un itinéraire routier ; celle-ci apparaît dans le devis du transporteur.

Dijkstra travaille sur les sommets partagés des routes. Chaque arête contient sa longueur, ses modes autorisés et son danger. Les routes permettent cheval et charrette ; les sentiers difficiles excluent la charrette. Les voies maritimes exigent le bateau. L’option prudent pénalise le danger en plus du temps ; les événements actifs ferment des arêtes ou modifient leur coût. Une fermeture portant sur une voie partagée ne peut pas être contournée en changeant seulement son nom.

## Transports

Les départs exigent une discussion avec un transporteur physiquement présent et proche. Le moteur vérifie cette proximité, le moyen proposé et l’état du relais, même si une interface essaie de passer outre. Une autorisation de départ n’est jamais sauvegardée. Les chevaux et les charrettes sont visibles aux relais ; 36 embarcadères équipés de barques sont placés sur les côtes réelles. Leur accès terrestre est ajouté au réseau partagé, et les voies maritimes commencent au quai. Les bateaux sont dessinés sur l’eau. Le plan affiche kilomètres, durée, prix, danger, traversées et besoins du groupe. Vitesses : marche 4,8 km/h, cheval 8 km/h, charrette 6 km/h, bateau 10 km/h. Le calendrier comprend huit heures de trajet terrestre puis dix heures de halte, ainsi que les attentes d’embarquement et les retards signalés. Une étape maritime garde sa géométrie : aucune ligne droite à travers un continent.

Les étapes affichent « Chevauche via… », « Voyage en charrette via… », « Se repose à… », « Bivouaque sur… », « Attend l’embarquement à… » et « Navigue via… ». La durée de base passe à 6–24 secondes selon la distance ; chaque nouvelle phase reste visible au moins 1,6 seconde et chaque repas ajoute une pause de 0,9 seconde. Les segments consécutifs portant le même libellé partagent ce délai, pour éviter de ralentir chaque tronçon de route. C’est une progression accélérée du voyage, pas une fausse promesse de travail réseau. L’horloge, les ressources, les voyageurs et les événements avancent par tranches de 60 minutes maximum. Le joueur peut continuer à marcher librement sans ce service. Le déplacement à pied reste manuel. Chez le batelier, le premier segment doit être maritime ; les correspondances terrestres ultérieures s’enchaînent automatiquement.

Une fermeture apparue pendant un voyage terrestre interrompt le trajet à une position praticable. Une demande de halte en mer attend un port. La sauvegarde conserve les étapes, la progression, les pièces déjà payées et la position ; reprendre ne facture pas une seconde fois. Les données de voyage invalides reviennent à une halte sûre. Les besoins sont visibles dans Compagnons et sur l’écran de voyage ; cette première passe n’applique pas de pénalité de combat à la fatigue de Kaldor. Les dangers déterminent le choix du trajet et la densité des ennemis à pied ; le voyage accéléré ne déclenche pas encore d’embuscade scénarisée.

## Chronique locale et connaissances des PNJ

La sauvegarde du jeu contient un identifiant de campagne, une révision, le calendrier, les événements et les connaissances individuelles. Une copie JSON est écrite dans le stockage local du navigateur et, lorsque disponible, dans le fichier privé OPFS **hearthreaver-world-events.json**. Il s’agit du stockage de ce navigateur, pas d’un fichier créé silencieusement dans les documents de l’utilisateur. Le bouton **Exporter la chronique** télécharge une copie lisible. Une erreur de stockage privé laisse fonctionner le miroir local ; si les deux stockages sont refusés, seule la session en mémoire subsiste.

La sauvegarde du jeu reste prioritaire. Une chronique d’une autre campagne, d’un calendrier futur ou d’une révision plus ancienne ne la remplace pas. Les écritures de fichier sont séquentielles. À l’ouverture du jeu, le fichier privé est vérifié ; à chaque discussion, le miroir local est consulté avant la mise à jour des connaissances.

Un témoin proche ou explicitement désigné apprend un événement immédiatement. Les autres attendent son temps de propagation par le réseau, puis le délai de relais : 30 minutes pour un courrier, six heures pour un résident. Deux voyageurs parcourent effectivement les voies entre relais et échangent leur carnet aux arrivées. Un PNJ peut encore croire une route fermée après sa réouverture, jusqu’à recevoir la correction. Les nouvelles vieilles de plus d’une journée sont présentées comme à confirmer. Les blessures, l’épuisement et la confiance d’Elyne sont privés ; ils ne deviennent pas des ragots universels. Les nouvelles discutées entrent dans le journal du joueur avec leur date et leur source.

## Événements

| Famille | Événements et déclenchement | Effet actuel |
| --- | --- | --- |
| Terrain | Crue sous forte pluie, éboulement en montagne, avalanche en biome froid, incendie en forêt sèche | Fermeture temporaire, obstacle local, nouvelle propagée |
| Routes | Pont endommagé à une intersection de rivière ; réouverture après expiration d’un danger de terrain | Fermeture puis remise en service du réseau |
| Sécurité | Brigands et patrouilles périodiques | Danger et densité des rencontres modifiés |
| Conflits | Siège, occupation et trêve d’une même localité ; fermeture d’une voie entre régions | Accès et danger modifiés ; nouvelles |
| Commerce | Pénurie, marché, arrivée de caravane | Prix des provisions ou information locale |
| Vie locale | Fête, disparition, funérailles, changement de dirigeant | Nouvelles datées attachées à une localité |
| Transports | Tempête sur mer, départ retardé, relais fermé | Interdiction d’embarquer, attente ou fermeture |
| Malédictions | Manifestation sur une voie qui traverse réellement une zone maudite | Danger accru et nouvelle ; purification disponible pour une future quête |
| Actions | Captifs libérés, temple vaincu, escorte accomplie, découverte d’un lieu ; vols de marchandises | Chronique et dialogues cohérents avec l’action |
| Compagnons | Blessure, épuisement, confiance après partage | État d’Elyne et carnet privé |
| Météo | Pluie, neige en Igea, brouillard humide, sécheresse aride | Information régionale ; les crues et tempêtes ont des conséquences sur les voies |

Les situations locales utilisent une graine stable et le calendrier du jeu. La simulation ne tourne pas lorsque la partie est fermée. Un saut de calendrier très grand limite la création rétrospective à 90 jours. L’historique conserve les 512 derniers événements et les 120 dernières nouvelles discutées ; il ne grossit pas indéfiniment. Le type `purified` est prêt pour les quêtes mais aucune quête de purification n’est encore distribuée.

## Vérification et reconstruction

- `npm run build:world` : données et HTML web/iOS.
- `npm run embed:title` : menu, météo et monde, sans écraser les modules du monde.
- `npm test` : jeu existant, géographie, connexions à pied, surfaces terrestres, modes, fermetures, connaissances, transitions, streaming, geôle, escorte, voyages, sauvegarde, halte maritime, fichier local et interface réelle sous JSDOM.
- `npm run package:ios` : archive native avec le HTML embarqué à jour.

Le fichier natif Azgaar reste la source pour modifier les grandes formes. Les déports côtiers, le raccord du camp et le terrain à l’échelle du mètre sont des raffinements du jeu et doivent être reconstruits après un nouvel export.

## Planche de transport et vérification

`scripts/transport-art.js` contient les dessins natifs de chevaux, charrettes, barques, quais, barres d’attache et auberges. `node scripts/preview-transport.cjs` reconstruit `docs/art/transport-sprites.png` depuis les mêmes caches que le jeu, avec Kaldor comme référence de taille. Les sorties de contrôle du HUD à 216, 256 et 320 pixels logiques et du camp/port se trouvent dans `test-output/travel/`.

`tests/travel-party.test.cjs` vérifie notamment la faim sur 36 h, les repas, les autorisations de transport, l’emplacement des barques sur l’eau, la persistance des compagnons et lieux suivis, les unités de distance et le HUD sur une seule ligne. Les tests du monde conservent les validations d’itinéraires, événements, connaissances, reprise de voyage et arrêt en mer ; les tests du menu vérifient les nouveaux panneaux et l’absence de départ sur la carte.

## Brouillard de guerre

La carte commence en vue générale. Le bouton « Transport le plus proche » suit le relais ou port ouvert le plus proche à vol d’oiseau, même inconnu, sans révéler les autres lieux ni enregistrer une visite. Ce repère persiste dans la sauvegarde. Les terrains et routes inconnus restent visibles en niveaux de gris ; les zones explorées retrouvent leurs couleurs ; un quadrillage de 256 m, stocké sous forme d’intervalles fusionnés par rangée, conserve les couloirs explorés sans allouer une texture à l’échelle du monde. La marche et les voyages révèlent le terrain parcouru ; une réapparition lointaine ne révèle pas une ligne fictive entre les deux positions.

Les villes visitées sont conservées dans `discovered`. Les transporteurs, auberges et autres services sont révélés individuellement à moins de 5 m. Les points inconnus sont absents du rendu, des clics et de la liste de sélection ; un ancien suivi vers un point jamais visité est supprimé au chargement. Les sauvegardes antérieures conservent leurs localités déjà découvertes. Les transporteurs peuvent encore proposer des destinations inconnues dans leur propre dialogue : leur visite les ajoute ensuite à la carte.

### Provisions facultatives et retour de voyage

Le départ ne dépend plus des rations ni des gourdes : seules les conditions du transport, les pièces et la disponibilité du groupe restent bloquantes. Le panneau affiche les quantités conseillées, le manque et le prix du lot de trois jours ; « Partir sans compléter » accepte les réserves actuelles sans achat automatique. Pendant le trajet, les jauges de faim et de santé de chaque membre, les stocks et les repas (−1 ration, +50 points) sont affichés. À faim vide, la santé baisse continûment à raison de 1 PV par trois heures du calendrier, uniquement pour le temps réellement passé à jeun. Le plancher existant de 1 PV de Kaldor est conservé ; les compagnons peuvent tomber épuisés. Les voyages anciens restent rechargeables.

### Cohérence des réserves et des haltes

Le ravitaillement propose au moins trois jours, ou davantage pour couvrir les rations conseillées du trajet choisi. Le prix et la quantité réellement ajoutée sont calculés ensemble ; le joueur ne paie pas les rations rejetées par la limite de 999. Un avertissement prévient si l’achat ne laisserait plus assez de pièces pour le transport. L’eau reste une réserve suivie sans pénalité de soif et ne provoque plus un avertissement de nourriture manquante. Le repos au relais et le sommeil sous tente ne rendent de santé qu’avec une réserve de nourriture non vide. Le plancher de faim ne remonte jamais la santé d’un personnage déjà sous 1 PV et n’agit pas sur un personnage mourant. Un compagnon épuisé en trajet est affiché comme transporté ; il devra être soigné avant un autre départ. Les pauses de présentation sont réinitialisées au chargement, sans modifier le trajet payé ni sa progression.

### Réseau et présentation du voyage

La liste commerciale contient 85 destinations habitées (83 localités, le camp et le refuge), au lieu de 121 points incluant les quais techniques. Les 36 quais restent à leur côte réelle pour les bateaux, les correspondances et les anciennes sauvegardes, mais ne doublonnent plus les localités dans la liste. Les villages isolés restent desservis : retirer leur relais imposerait des dizaines de kilomètres à pied dans cette géographie. Aucun relais n’est ajouté aux ruines ou aux tronçons sauvages. Les transporteurs terrestres sont placés sur une voie d’accès, à environ cinq mètres du centre local. Une arrivée normale dépose le groupe à un emplacement libre et visible, à moins de trois mètres du transporteur ; les interruptions et haltes maritimes conservent leur comportement.

Le panneau du palefrenier utilise des textes plus petits et une aide séparée « Comment voyager », fermable avec Retour ou Échap. Le départ avec réserves insuffisantes s’intitule « Partir avec ressources actuelles ». L’écran en route présente une ligne par membre avec nom, faim et vie ; les repas sont résumés par membre (« −1 ration · +50 % »). La progression représente le temps du trajet, attentes et repos inclus, et reste immobile pendant les pauses de présentation.
