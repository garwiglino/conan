# Hearthreaver — Le retour de Kaldor

[Atelier des humains : tenues, métiers, armées et animations](art/humains/activites/atelier.html)
· [Sources et utilisation de la bibliothèque JavaScript](docs/humains-activites.md).
Ce catalogue visuel est consultable séparément du jeu.
[Bibliothèque humaine et périmètre intégré](docs/humains-integration-differee.md).

Jeu d'action en pixel art, jouable dans le navigateur (clavier ou écran tactile).

**Nouveaux concepts PNG trois quarts — à valider avant fabrication JavaScript :** [galerie et comparaison avec les originaux](art/architecture-concepts-34/index.html), [inventaire et statut de cette reprise](docs/architecture-concepts-png-trois-quarts.md). Les 45 planches reprennent les 234 références existantes. Aucun nouveau sprite n’est intégré au jeu.

**Ancienne reconstruction trois quarts — archive non validée :** [nouvel atelier et comparaison](art/architecture-34/index.html), [catalogue et API](docs/architecture-trois-quarts.md), [pack trois quarts](art/architecture-34/architecture-34-complete.zip). Les 106 bâtiments, 8 variantes d’hiver et 120 modules conservent leurs familles régionales et l’échelle de l’humain de 19 px. [Anciennes élévations conservées](art/architecture/atelier.html).

**Architecture humaine en JavaScript — intégrée aux localités :** [atelier natif et assemblages](art/architecture/atelier.html), [catalogue complet et API](docs/architecture-javascript.md), [pack des sources, sprites et calques](art/architecture/architecture-complete.zip). 106 bâtiments, 8 variantes d’hiver et 120 modules, à l’échelle de l’humain de 19 px.

Le héros est **Kaldor « the Flamebearer »**. Dans la version jouable actuelle, il commence au Campement des Exilés avec la fée ; Elyne, à proximité, rejoint le groupe au premier dialogue. L’exploration est libre. Les trois sceaux, les quêtes locales et le Temple du Serpent restent jouables ; l’escorte vers le Refuge des Veilleurs et le retour à Clairfoyer ne sont pas imposés. La prison de test a été retirée.

[État réel du jeu : fonctionnalités intégrées, ressources disponibles et limites](docs/etat-du-jeu.md). [Registre des corrections de cohérence et vérifications](docs/corrections-coherence.md). [Personnes, patrouilles, combustible et échanges causaux](docs/campagne-causale.md). [Chargement et performances du monde](docs/world-performance.md). [Affectations et réparateurs](docs/personnes-affectations.md).

Le bouton **Monde** ou la touche **G** ouvre la carte : Igea, Teremor et Sarak constituent un seul continent, Varan et Tagon deux îles plus petites. La carte Azgaar est resserrée au vingtième (72 × 48 km) : chaque région forme un pays habité, relié à ses voisins par une route d’environ 15 à 30 minutes de marche, et des frontières naturelles ferment le reste. Le terrain à une tuile par mètre est chargé autour du joueur ; les 83 localités disposent d’un premier quartier bâti régional, avec rues, habitations et services. Itinéraires, voyages par cheval/charrette/bateau, provisions, lieux stables et chronique des nouvelles connues par chaque PNJ sont intégrés. [Fonctionnement, événements et limites de cette première passe](docs/world.md).

Le menu utilise un logo rouge métallique bordé d'or, dessiné dans Aseprite, avec douze images de reflets de flammes. Six plans de ciel, reliefs et poussière composent un panorama qui défile lentement. L'option système de réduction des animations immobilise le décor et les reflets. Les quatre commandes sont **Nouvelle partie**, **Charger**, **Options** et **Quitter**. Charger est grisé sans sauvegarde valide. Les options mémorisent séparément l'activation et le volume de la musique et des bruitages. Quitter coupe la session et tente de fermer la fenêtre lorsque le navigateur l'autorise ; sinon un écran de fin permet de revenir au menu. Sur iOS, la fermeture de l'app reste un geste système.

**The Ember Crown**, le thème principal, comporte douze pistes instrumentales et une piste de direction : cuivres, cors, cordes, harpe, basse, chœurs, timbales, tambours et cloches. La boucle de 48 mesures en ré mineur dure 102,86 secondes à 112 BPM. [Partition MIDI multipiste](audio/hearthreaver-theme.mid) · [Écoute du synthétiseur du jeu](audio/hearthreaver-theme-preview.mp3). Le thème démarre à la première interaction autorisée par le navigateur si la musique est activée ; un fondu croisé de 1,8 s accompagne l'entrée dans l'aventure.

**Jouer :** https://garwiglino.github.io/conan/

Sur iPhone : ouvrir l'adresse dans Safari, puis Partager › « Sur l'écran d'accueil » (laisser « Ouvrir en tant qu'app web » activé) pour jouer en plein écran.

Le jeu se joue en **paysage**. Le menu garde ses quatre boutons dans une colonne et adapte la taille du logo à la hauteur disponible, à l'encoche et à la barre d'accueil. L'app iOS autorise uniquement les deux orientations paysage. La version web demande le verrouillage lorsque le navigateur le permet ; sinon, passer en portrait affiche une invitation à tourner l'appareil et met la partie en pause, sans mouvement ni combat en arrière-plan. Un voyage en cours continue, comme lorsque l'app passe en arrière-plan.

Le colosse gardien utilise 32 animations Aseprite : huit actions dans quatre directions, avec un repos animé, une saisie synchronisée avec Kaldor et une mort en pierres sans sang. Sa chute accélère sous la gravité, avec des rebonds amortis et un peu de poussière. Les sprites sont inclus dans le jeu pour rester disponibles hors ligne.

Le morceau de combat accompagne les affrontements avec les colosses. Il entre par un fondu croisé de 650 ms ; après quatre secondes sans affrontement, l'exploration revient sur 1,8 s. Le boss conserve sa musique. Le bruit de mort est composé en [MIDI multipiste](audio/guardian-death.mid) et joué par le séquenceur du jeu, indépendamment du réglage de musique.

Le Prêtre du Serpent utilise maintenant son [pack Aseprite](sprites/personnages/pretre/) : 124 animations, 1 280 poses, quatre directions et deux phases. Ses frappes gardent leur direction pendant l'élan et le retour ; les sorts de jade suivent les mêmes images que leurs zones de dégâts. L'éventail lance trois projectiles depuis sa main, la nova s'étend au sol et les trois éruptions jaillissent successivement. La victoire attend les 1,9 seconde de sa chute. Les sources et les effets sont inclus dans la mise à jour iOS.

Après publication, fermer complètement l'app iOS native puis la rouvrir avec une connexion pour recevoir le jeu actualisé. La sauvegarde existante est conservée. Le nouveau nom sous l'icône et l'icône native sont inclus dans les sources Xcode ; leur installation nécessite une reconstruction de l'app. Voir [les instructions iOS](ios/LISEZMOI.md).

## Kaldor v3 — cheveux longs et épée dans le dos

Le barbare a maintenant une chevelure longue et une marche en six poses sans
balancement excessif de la tête. Après 3,7 secondes sans attaquer, il range son
épée raccourcie dans le dos, **même pendant un déplacement**. Reprendre l'attaque
interrompt le rangement immédiatement, sans perdre le momentum des quatre
combos et de leurs smears. Les quatre directions et le rendu en JavaScript
préservent les mêmes dimensions que les batraciens. Voir [la réalisation et
ses tests](docs/kaldor-art.md) et [l'atelier interactif](art/kaldor-preview.html).

## Armes à trouver

Flamme de Clairfoyer, une épée légendaire à deux mains, attend sur un râtelier près du point d’apparition au campement. Kaldor dispose de 48 armes : épées, sabres, dagues, haches, masses, lances, bâtons et vouges. 39 armes attendent sur des râteliers dans les cinq territoires ; les combattants et le Prêtre portent aussi leurs propres armes. Un ennemi armé vaincu lâche son arme si elle manque à la collection. Le ramassage affiche ses caractéristiques, sans équiper l’arme ni afficher de doublon. Prise à une ou deux mains, puissance, cadence et allonge diffèrent ; les animations déplacent les calques originaux des bras et des mains de la tenue. Équipement et aperçu dans **Inventaire → Armes**. [Catalogue et fonctionnement](docs/kaldor-weapons.md) · [Atelier des 48 armes](art/weapons-preview.html) · [Quatrièmes coups propres aux armes](art/weapon-finishers.gif) · [Combos en quatre poses des huit familles](art/armory-strikes.gif) · [Rangement des huit familles](art/armory-combos.gif) · [Tenue normale des lances et bâtons](art/pole-carry.gif) · [Armes des combattants](art/armed-npcs.gif).

## Froid, chaleur et tenues

La chaleur de la tenue et du casque de Kaldor est comparée à la température ressentie du lieu, selon la saison, l'heure, le vent, la pluie, la neige et l'abri. Sans tenue assez chaude, il grelotte puis **perd vite de la santé** et peut mourir de froid ; un voyage organisé le laisse au pire à 1 PV. Une tenue trop chaude dans la chaleur ne coûte jamais de santé mais **creuse la faim plus vite**. Le HUD, le givre au bord de l'écran, l'inventaire et le panneau du palefrenier l'indiquent. Voir [les règles et les exemples](docs/body-heat.md).

## Voyages en arrière-plan

Un voyage en cheval, charrette ou bateau continue quand on change d'app ou d'onglet. Il suit l'heure réelle : au retour, le temps passé ailleurs est rattrapé. Si le voyage s'est terminé pendant l'absence, Kaldor est à destination et **le jeu est en pause**, avec la raison de l'arrêt. Sur iPhone, l'app programme une notification **« Arrivé à destination »** à l'heure prévue ; un voyage stoppé en route (passage menacé ou fermé) annonce « Voyage interrompu » et l'étape où Kaldor attend. L'autorisation est demandée au premier départ. Dans un navigateur, le premier départ propose aussi les notifications du site ; sans autorisation (ou depuis l'écran d'accueil d'un iPhone), seule la pause au retour s'applique. **Les notifications iOS demandent une réinstallation depuis Xcode (version 1.4, build 5)** ; sans elle, le voyage continue tout de même et le jeu se met en pause au retour.

## Quêtes et repos

Le suivi conserve une flèche or pour la quête principale et une seule quête secondaire suivie, indiquée en bleu. Accepter une autre quête ne remplace pas celle suivie. Dès que son objectif est rempli, la quête sort du petit encart et le suivi passe à la prochaine quête inachevée dans l’ordre d’acceptation (puis revient aux plus anciennes s’il n’en reste aucune après). Le joueur peut choisir une autre quête dans le journal ou arrêter le suivi. Les anciennes sauvegardes avec plusieurs quêtes suivies sont normalisées sans perte de progression.

Une quête à rendre reste dans le journal avec son donneur indiqué discrètement, sans flèche de retour. Les « ! » et « ? » dorés au-dessus des PNJ sont légèrement agrandis et dessinés en pixels ; aucun « ? » gris n’apparaît pendant une quête en cours. Le panneau au-dessus du joystick conserve ses cartes entières et son défilement avec arrêt doux lorsque nécessaire. Les abris du Veilleur et de Zahra sont privés : seule la tente du campement de départ permet de dormir.

## Menu, sons et vibrations

Un seul bouton **Menu** apparaît en haut à droite en jeu. Le menu suspend la simulation et place **Quêtes**, **Inventaire**, **Options**, **Aide** et **Reprendre** à droite, dans la zone du pouce. Les options sont partagées avec l’écran titre ; Retour revient au panneau précédent, et Menu principal sauvegarde avant de quitter la partie. Les commandes restent utilisables sur les petits écrans paysage et au clavier.

Les choix de dialogue affichent le nom de la quête accompagné d’un médaillon pixel art « ! » ou « ? » agrandi, sans libellé supplémentaire « Accepter » ou « Rendre ». La typographie et les espacements du menu sont plus compacts. **Taille des textes**, disponible dans les options, règle les textes de **85 % à 125 %**, par pas de 5 %, avec aperçu immédiat et remise à 100 %. Ce réglage est mémorisé séparément des sauvegardes. Il s’applique aussi aux textes dessinés en jeu ; les boutons, barres, retours à la ligne, cartes de suivi et bulles de dialogue s’adaptent. Les longs dialogues et panneaux restent accessibles par défilement.

Quatre sons originaux en MIDI multipiste accompagnent l’ouverture, la sélection, la validation et le retour : [ouvrir](audio/ui-open.mid), [sélectionner](audio/ui-select.mid), [valider](audio/ui-confirm.mid), [revenir](audio/ui-back.mid). Ils utilisent le synthétiseur du jeu et le réglage des bruitages, avec une limite de fréquence pour les appuis rapides. `npm run build:ui-cues` reconstruit les MIDI et leur partition intégrée.

Les vibrations sont courtes et espacées : sélection d’interface, dégâts reçus, parade réussie, stèle et récompense importante. Elles sont désactivables dans les options, indépendamment du son ; le réglage est conservé. Le relais UIKit dans l’app iOS utilise des retours haptiques natifs. **Une réinstallation depuis Xcode est nécessaire pour activer ce nouveau relais sur iPhone** ; la mise à jour du HTML seule ne peut pas l’ajouter. Les navigateurs compatibles utilisent l’API Vibration et les autres restent silencieux. La caméra ne tremble que lorsqu’un coup blesse réellement le joueur, jamais pour les caisses, l’apparition du héros ou la mort des ennemis. La réduction des animations désactive aussi cette secousse.

## Cycle du ciel et météo

La lumière commence à baisser à **16 h**. Le crépuscule s’étend de **18 h à 23 h**, la nuit de **23 h à 5 h**, et l’aube de **5 h à 9 h**. Les couleurs, les braseros, les ambiances et la musique évoluent progressivement avec ce cycle. Une journée du calendrier dure **60 minutes réelles** en exploration normale. Les voyages organisés et le sommeil accélèrent le calendrier.

Les fronts météo sont indépendants de l’heure : ciel sec, pluie fine, pluie moyenne soutenue, grosses averses sans tonnerre ou épisodes orageux. **Une pluie ne finit pas forcément en orage.** Les cellules orageuses peuvent être brèves puis laisser la pluie continuer. Les changements d’intensité et les nuages se fondent progressivement ; les anciennes sauvegardes restent compatibles.

Les gouttes tombent toujours vers le bas et le même côté. Le vent fait varier progressivement leur inclinaison ; leur déplacement est intégré image par image, sans inversion lorsque l’intensité change ou après une longue partie. Les petits impacts au sol ont quatre poses en pixel art, restent fixés à leur point de contact pendant les mouvements de caméra et apparaissent sous les personnages et les décors. Les surfaces d’eau reçoivent de petites rides.

Chaque éclair produit une seule impulsion douce qui éclaire ensemble le terrain, les personnages et la pluie, sans tremblement de caméra. Le tonnerre arrive ensuite, avec une direction et un retard liés à la distance. Les éclairs sont atténués lorsque la réduction des animations est activée. Dormir ou charger une partie ne rejoue pas les anciens coups de tonnerre.

Cinq compositions MIDI originales, chacune avec quatre pistes d’instruments et une piste de direction, alimentent le synthétiseur météo du jeu : [pluie fine](audio/rain-light.mid), [pluie soutenue](audio/rain-steady.mid), [grosse averse](audio/rain-downpour.mid), [tonnerre proche](audio/thunder-near.mid), [tonnerre lointain](audio/thunder-distant.mid). Les gouttes irrégulières, éclaboussures, nappes de pluie et rafales se mélangent en douceur ; les claquements, roulements et échos du tonnerre se superposent. Leur volume suit les **bruitages**, indépendamment de la musique. `npm run build:weather` reconstruit les MIDI et intègre les partitions et les sources météo dans les versions web et iOS.

Les trois pluies utilisent des nappes stéréo continues à boucles croisées, pilotées en legato par leurs pistes MIDI. Les changements de notes modulent leur intensité sans relancer la texture. Les gouttes et éclaboussures restent irrégulières et discrètes ; les raccords des échantillons et de la partition ne créent ni silence ni reprise d’attaque. Les trois niveaux se fondent entre eux et les sources sont libérées après le retour au sec.

## Introduction du studio

Le [logo Crest Interactive fourni](art/studio/crest-interactive.svg) est intégré au HTML, y compris dans la version iOS hors ligne. Au lancement : apparition sur noir, maintien, disparition vers le noir, puis apparition progressive du menu. Toucher l’écran, Entrée, Espace ou Échap passe l’introduction ; le geste est consommé pour ne pas activer accidentellement Nouvelle partie. Le mode de réduction des animations raccourcit cette séquence.

La musique du titre démarre dès l’introduction et continue sans redémarrer à l’arrivée du menu. Les réglages de volume et de coupure mémorisés sont respectés. L’app native autorise la lecture automatique ; lorsqu’un navigateur bloque l’audio avant toute interaction, le premier toucher le déverrouille. Les sources sont `scripts/startup.js` et `scripts/startup.css` ; `npm run embed:title` les intègre avec le SVG.

## Sources du menu

- [Logo animé Aseprite](art/title/hearthreaver-logo.aseprite) : quatre calques et douze images de 120 ms.
- [Paysage Aseprite](art/title/hearthreaver-landscape.aseprite) : panorama de 960 × 360 pixels et six calques.
- [Boutons Aseprite](art/title/hearthreaver-menu.aseprite) : quatre états, dont l'état grisé.
- [Icône Aseprite H/R](art/title/hearthreaver-icon.aseprite) : monogramme rouge et or, lame centrale, quatre calques éditables à 128 × 128 pixels. `scripts/app-icon.lua` produit les tailles web et iOS sans lissage ; le fond est opaque et iOS applique ses propres coins arrondis.
- `scripts/title-art.lua` reconstruit les dessins dans Aseprite ; `npm run build:title-theme` reconstruit le MIDI et sa partition JSON ; `npm run embed:title` intègre le tout dans les versions web et iOS hors ligne.
- Les identifiants techniques historiques de stockage, d'origine iOS et de dépôt restent stables pour préserver les sauvegardes et les mises à jour des installations existantes.
- [Archive iOS](Hearthreaver-iOS.zip) : sources natives, nouvelles icônes et jeu hors ligne synchronisé.
- [Projet Xcode Hearthreaver](ios/Hearthreaver.xcodeproj) : cible et schéma partagés Hearthreaver, version native 1.4 (build 5). La signature conserve l'identifiant historique pour mettre à jour l'app existante sans perdre sa sauvegarde.

## Crédits
- Polices : [Alagard](https://www.dafont.com/alagard.font) (Hewett Tsoi) · [Pixel Operator](https://www.dafont.com/pixel-operator.font) (Jayvee Enaguas, CC0)

## Batraciens en jeu

Les [batraciens civils et gardes](docs/batraciens.md) utilisent les dessins JavaScript approuvés et des palettes déterministes, sans redessin. Le registre ajoute 62 civils et 11 gardes dans 14 localités humides de Varan, Tagon et Teremor, sous les règles existantes de sécurité. Certains groupes de brigands et patrouilles déjà générés dans ces milieux utilisent les rôles armés ; aucun peuple ne devient hostile par défaut. Sources, apparences et animations sont intégrées au HTML web et iOS. [Atelier des palettes et animations](art/batraciens-preview.html).

Les routines locales ajoutent des déplacements, des discussions entre habitants et six liaisons routières. Les gardes témoins répondent aux agressions du joueur, avec le ciblage et les effets de blessure communs au combat. Voir `docs/batraciens.md`.

Postes humains indépendants : [guide JavaScript](docs/humains-postes-javascript.md),
[48 concepts retenus](docs/humains-postes-concepts.md), sockets et atlas naturels réutilisés.

- [Sprites humains d’Igea en saison enneigée](docs/humains-igea-hiver.md) : réutilisation des postes, neige sélective et gestes hivernaux.

- [Vêtements et animations modulaires des humains](docs/humains-modularite.md) : pièces natives articulées, combinaisons de vêtements et vérifications.

Les [implantations des 83 localités](docs/implantation-localites.md) intègrent les bâtiments natifs et les postes des habitants dans les versions web et iOS.
