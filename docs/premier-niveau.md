# Niveau 1 — Forteresse de Grise-Gueule

La nouvelle partie commence dans les geôles, avec Kaldor seul. Le donjon reprend les plans, les ressources Piskel et les personnages de la [PR #11 de Claude](https://github.com/garwiglino/conan/pull/11), tête `d4a305bf822d928f17741157cfb87d2fa8060135`. Les modifications récentes du monde, des routes, de Clairfoyer et des armes sont conservées. Le Temple du Serpent reste une aventure ultérieure dans le monde.

## Parcours jouable

1. Dans les **geôles**, contourner la paillasse par la brèche, traverser l’ossuaire, rejoindre la salle des gardes et actionner le levier des cellules. Prendre la clé serpent, déverrouiller sa porte et monter.
2. Dans la **grande salle**, pousser une caisse sur chacune des deux dalles pour lever la herse de l’escalier. La réserve contient une caisse ; l’autre est dans la salle. La porte violette reste scellée.
3. Dans les **galeries**, abaisser les deux leviers pour ouvrir l’armurerie. La clé crâne permet d’atteindre le treuil, qui active le monte-charge.
4. Descendre à la **caserne** par le monte-charge, prendre la clé croc et ouvrir le raccourci vers la grande salle. Le fond du puits, aux geôles, contient du butin facultatif. Remonter aux galeries pour ouvrir la porte croc.
5. Dans la **salle du trône**, vaincre Grise-Gueule. Le levier du fond libère alors la fée. La porte du chef se ferme pendant le combat et se libère après sa mort ; une reprise après décès permet de retenter le combat.
6. Redescendre avec la fée jusqu’à la porte scellée. L’action de sortie termine le niveau et conduit dans l’étendue sauvage de Sarak, près de Safrane, aux coordonnées du plan (61 553 m, 29 042 m), ou au sol praticable voisin.

Marcher contre une caisse la pousse ; **Agir / E** permet de la tirer en reculant pour la dégager d’un mur. Les deux dalles doivent rester occupées. Les clés restent dans l’inventaire et ne sont pas consommées. Le monte-charge propose ses trois arrêts par le menu de dialogue. Les coffres facultatifs donnent cinq pièces et une fiole, dans la limite du sac.

Les pièces fermées cachent leur contenu. Leurs murs restent perceptibles ; les pièces découvertes s’éclairent progressivement et restent connues. Les murs devant Kaldor deviennent transparents pour garder le héros visible. Les torches, braseros, cage et rune utilisent les images animées du kit.

## Progression et sauvegardes

Le journal suit la quête principale **La forteresse de Grise-Gueule**. Les anciennes quêtes du monde sont suspendues à l’intérieur. La carte, les transports et le panneau des compagnons restent inaccessibles pendant la captivité : l’indication est **Lieu inconnu**.

La sauvegarde conserve l’étage, la position, les ennemis et leur santé, les clés, les leviers, les portes, les caisses, les coffres, le monte-charge, les pièces découvertes, la mort du chef et la libération de la fée. Chaque arrivée d’escalier ou de monte-charge fixe la reprise. Un décès garde les mécanismes résolus et dépense une vie selon la règle habituelle. La sauvegarde pendant un décès reprend à cette arrivée, sans enfermer le joueur derrière la porte du chef.

À la sortie, la fée rejoint l’exploration, le lieu devient connu sur la carte, la reprise se fixe dehors et les trois sceaux du Temple du Serpent deviennent disponibles. Elyne attend au Campement des Exilés. Les sauvegardes antérieures sans bloc `dungeon` restent à leur position et ne commencent pas ce niveau.

## Sources et reconstruction

- Plan de Claude : `data/donjons/forteresse-grise-gueule.json`.
- Sources originales et PNG : `art/environnement/interieurs/forteresse-gobeline/`, `art/gobelins/`.
- Compilation des pixels : `scripts/build-dungeon.cjs`, vers `data/donjons/compiled/forteresse-grise-gueule.json`.
- Jeu et rendu : `scripts/dungeon-runtime.js`, `scripts/dungeon-render.js`.
- Assemblage web/iOS hors ligne : `scripts/embed-dungeon.cjs`, appelé après `embed-world.cjs`.

`npm run build:dungeon` reconstruit les pixels et les deux HTML. `npm run embed:world` réintègre aussi le donjon après le monde. `npm run donjon:environment` reconstruit les planches de conception. `npm run package:ios` actualise l’archive native avec le jeu hors ligne.

`npm run test:dungeon` vérifie les sources et le parcours réel à travers les collisions : portes, deux caisses poussées sur les dalles, deux leviers, trois clés, escaliers, monte-charge, chef, fée, retour et sortie. Les tests couvrent également les attaques par les commandes normales, la garde, l’esquive, les caisses tirées, les sauvegardes et les anciennes parties. `npm run check:dungeon` vérifie le démarrage, les quatre rendus, le menu, la carte cachée et le rechargement depuis les interfaces ordinateur et mobile.

Captures réelles : [départ sur mobile](../art/dungeon-integration/mobile-geoles.png), [grande salle](../art/dungeon-integration/desktop-grande-salle.png), [galeries](../art/dungeon-integration/desktop-galeries.png), [chef](../art/dungeon-integration/desktop-trone.png). Résultat navigateur : `art/dungeon-integration/verification.json`.

## Limites de cette intégration

Les gobelins utilisent les quatre vues Piskel de Claude, avec déplacement, orientation, anticipation de frappe et blessure. Le chef reprend cette anatomie dans une silhouette plus haute et une massue dessinée en pixels ; il n’a pas encore de planche d’animation dédiée. Le donjon n’a pas encore de musique originale. L’extérieur est un lieu connu sur la carte ; la façade visitable et la réentrée ne sont pas implémentées. Le contrôle navigateur utilise Chromium ; la compilation et l’installation natives Xcode ne sont pas vérifiées dans cet environnement.

## Continuité du moteur et de l’interface

Le donjon conserve le HUD horizontal du monde (santé, vies, pièces, expérience, satiété et sceaux), les commandes et les bulles habituelles. La carte de lieu indique « Lieu inconnu », l’étage, les clés et les fioles ; aucune autorité extérieure ni recherche régionale n’est affichée pendant la captivité.

La vue projetée reste stable entre les images : les huit poses de marche de Kaldor suivent sa distance réellement parcourue. Les attaques réutilisent le traitement commun des pauses d’impact et des appuis frais sans mise en attente, avec l’avancée soumise aux collisions, les effets de sang, les particules, les gains et la fée du moteur actuel. Les plans, les pixels du donjon et la progression enregistrée sont conservés.

Le contrôle navigateur vérifie aussi huit poses distinctes pendant une marche simulée avec les commandes normales, la stabilité de la projection, le HUD commun et le rendu des effets. `tests/dungeon-presentation.test.cjs` couvre la pause de contact, la direction des commandes mises en attente et l’avancée unique par frappe.

## Éclairage souterrain

L’ambiance reste sombre indépendamment de l’heure extérieure. Torches murales et braseros utilisent la passe de lumière colorée du monde : le masque dynamique éclaire le sol, les murs, les personnages et leurs armes, avec un scintillement discret et une lueur chaude au foyer. Les halos fixes au sol ont été retirés du décor compilé. Les sources reprennent les positions et hauteurs de `interieur-scene.cjs` ; leur projection isométrique est appliquée une seule fois.

Une faible lumière neutre autour de Kaldor garde ses mains et ses appuis lisibles. Les sources des pièces non découvertes ne contribuent pas ; le sceau ouvert et la cage vidée perdent leur lumière. L’éclairage est appliqué avant les textes flottants et l’interface. Le masque est limité à la fenêtre de jeu pour le téléphone.

`npm run test:dungeon-lighting` vérifie les sources, l’obscurité et le masque partagé. `npm run check:dungeon-lighting` contrôle les quatre étages sur deux formats de téléphone, avec des captures dans `art/dungeon-lighting/`.

### Gobelins en groupe

`GoblinTactics` distingue la place d’approche et le droit d’attaquer. Deux gobelins au maximum peuvent entrer à courte portée ; les autres se placent à environ 46 unités logiques, avec un recul court vers 33 unités. Ces distances restent identiques sur les flancs malgré la perspective isométrique. Un secteur libre laisse une issue ; il s’oriente progressivement vers le déplacement du joueur. Les coups commencent avec au moins 0,16 s d’écart. Après un coup, le gobelin recule et rend son tour, tandis qu’un autre peut approcher. Les poses, la direction verrouillée et les dégâts sur l’unique frame d’impact restent partagés avec le combat natif.

La vision porte à 170 unités, avec 2,8 s de mémoire de la dernière position réellement observée ou signalée par un témoin visible. `DungeonSight` vérifie chaque frontière de case et les intersections exactes avec les murs : aucune transparence graphique ne donne la vue à travers un mur ou une porte fermée. Les alertes entre alliés exigent également une ligne de vue dégagée. Après perte de vue, la recherche ne suit pas les déplacements cachés du joueur.

Un gobelin visible à moins de 29 unités du joueur peut reprendre la place d’un allié encore en approche, sans attendre d’avoir atteint son secteur. Un coup déjà lancé conserve sa place et sa direction : deux attaques engagées au maximum, avec leurs anticipations normales. Si les deux places sont occupées, l’adversaire directement menacé tente un pas de dégagement latéral et arrière, soumis aux murs et collisions. Un coup reçu hors engagement donne priorité à sa riposte après sa vraie animation de blessure ; les dégâts restent toujours appliqués. À courte portée, l’approche cherche une position atteignable par la véritable trajectoire d’impact, sans agrandir les dégâts ni traverser les corps ; elle termine ce petit ajustement avant de frapper. Les passages étroits conservent leur réservation.

La préparation d’un gobelin normal dure environ 0,225 s avant l’impact (chef : 0,585 s). Son recul imposé après le coup dure 0,14 s, au lieu de 0,6 s. La première détection ramène son attente initiale à 0,12 s au maximum. Une blessure normale conserve ses quatre poses sur 0,165 s, sans ajouter les anciennes 0,6 s de recharge. Un coup léger repousse de 2 unités ; un coup final conserve 7 unités. L’engagement de frappe après la première pose de préparation encaisse les dégâts sans annuler systématiquement le coup ; une parade ou le quatrième coup du joueur peut toujours l’interrompre. La lame reçoit un ajustement de visée limité à 0,65 radian vers le torse, verrouillé pendant le coup et partagé entre dessin, smear et dégâts. Les calques corporels restent intacts. Une préparation précoce reste interruptible, et un adversaire tué ne frappe pas après sa mort.

Les attaques du joueur n’ont plus de commande mémorisée, dans le monde comme dans le donjon. Les appuis pendant une préparation, un impact, un arrêt d’impact ou une récupération non interruptible sont consommés. Un nouvel appui pendant la fenêtre de liaison permet le coup suivant ; garder le bouton appuyé ne répète pas l’attaque. Les quatre coups conservent leurs vitesses et leurs poses de fin de course.

Les portes ouvertes ont une réservation temporaire : un seul gobelin franchit le seuil, les autres attendent en file espacée. Le gobelin qui passe libère l’issue avant de se placer au combat. Les routes utilisent A* par pas de 8 unités, un budget de 240 nœuds et des contrôles de géométrie et de corps. Un blocage prolongé déclenche un nouveau calcul. Les réservations, chemins et intentions sont transitoires ; ils ne modifient pas les sauvegardes.

Références : [Michael Dawe, Beyond the Kung-Fu Circle, Game AI Pro](https://www.gameaipro.com/GameAIPro/GameAIPro_Chapter28_Beyond_the_Kung-Fu_Circle_A_Flexible_System_for_Managing_NPC_Attacks.pdf) pour distinguer espaces d’approche et capacités d’attaque ; [Red Blob Games, Line drawing on a grid](https://www.redblobgames.com/grids/line-drawing/) pour vérifier les cases traversées et les coins. Les paramètres ci-dessus sont adaptés et testés pour ce donjon.

Vérification : tests `goblin-tactics`, `goblin-combat`, `goblin-pressure`, `goblin-space-vision` et `kaldor-combo-contact` ; `npm run check:goblin-space` charge le jeu iOS hors ligne en 844 × 390 et 568 × 320 avec collisions réelles. Le rapport `art/goblin-space-vision/verification.json` contrôle aussi la réaction locale et les appuis sans mise en attente. Ces contrôles utilisent un téléphone émulé, sans compilation Xcode ni appareil physique.

### Lisibilité, alertes et armes au sol

Les répliques de détection sont de courtes bulles ancrées au-dessus du gobelin. Elles durent 2,2 s, sans dialogue modal, notification ou interruption de l’IA. Une seule bulle est affichée à la fois ; une même détection continue ne relance pas la réplique. Le décès, le changement d’étage et la réapparition réinitialisent la présentation. Les objectifs et messages du donjon ne révèlent plus la fée.

Les murs ne deviennent transparents que si leur ordre de profondeur les place devant le joueur **et** que leurs pixels opaques recouvrent plusieurs points de sa tête ou de son torse. Les marges transparentes, ouvertures de portes et bordures basses ne comptent pas. Le segment concerné conserve 42 % d’opacité, avec un fondu bref à l’entrée et à la sortie ; les collisions restent identiques. Les murs des cases non découvertes ne reçoivent plus l’opacité arbitraire de 14 %. Le test de visibilité ciblée s’appuie sur le principe d’intersection des obstacles documenté par [Godot — Ray-casting](https://docs.godotengine.org/en/stable/tutorials/physics/ray-casting.html), [source consultée](https://github.com/godotengine/godot-docs/blob/master/tutorials/physics/ray-casting.rst), adapté ici à un rendu isométrique 2D trié par profondeur et aux pixels du sprite.

À moins de 16 unités d’une arme inconnue, avec une ligne de vue libre et au même niveau, la fiche compacte à deux lignes apparaît au-dessus de l’arme. Elle reste au sol : il faut toucher « Prendre » ou utiliser « Agir ». L’éloignement ferme la fiche ; une arme déjà possédée ne produit ni dépôt ni fiche. Le ramassage revalide distance, visibilité, niveau et disponibilité du joueur, sans équiper automatiquement l’arme. Les armes trouvées sur la carte et lâchées dans le donjon suivent la même règle. Le don scénarisé du prêtre après la victoire reste distinct du ramassage au sol.

Contrôles : `npm run test:dungeon-readability` et `npm run check:dungeon-readability`. Le contrôle téléphone vérifie les quatre étages, les murs réellement occultants et les murs proches qui doivent rester opaques, la bulle sans pause, le départ de la fiche et le ramassage tactile explicite.

### Population et traction des caisses

La forteresse contient désormais 33 gobelins ordinaires et Grise-Gueule : 6 dans les geôles, 12 dans la grande salle et ses annexes, 11 dans les galeries, 4 au dernier étage en plus du chef. Les deux gardes dans la salle du trône attendent le déclenchement du combat du chef ; les deux autres défendent l’antichambre. Aucun renfort n’apparaît dans la cellule de départ. Les anciennes sauvegardes reçoivent seulement les identifiants manquants, sans ressusciter les morts ni réinitialiser les énigmes.

Le bouton affiche « Saisir » près d’une caisse puis « Lâcher » pendant la prise. La saisie ne déplace ni le joueur ni la caisse. Seule une caisse saisie peut être déplacée : marcher, esquiver ou attaquer contre elle ne la pousse pas. Le joystick entraîne la paire à 24 unités/s dans les huit directions, sans relâcher pour changer de direction et sans accélération en diagonale, avec des sous-pas de collision de 1 unité maximum. Le joueur reste tourné vers la caisse ; murs, autres caisses, meubles et gobelins bloquent le mouvement. Relâcher le joystick arrête immédiatement la paire ; « Lâcher » libère la caisse. Attaquer, se protéger, esquiver, subir un coup ou changer d’étage libère la prise. Les déplacements conservent la distance et le côté de prise ; la paire glisse le long des obstacles lorsqu’un axe reste libre. Les dalles suivent la position réelle de chaque caisse et sont dessinées sous les objets. La profondeur d’une caisse suit sa position actuelle ; elle s’atténue si ses pixels masquent le torse du joueur. La prise est transitoire ; les positions restent sauvegardées normalement.

Parcours des énigmes : passage derrière la paillasse → ossuaire → salle des gardes et levier des cellules → clé serpent dans la cellule du squelette → porte serpent et grande salle → une caisse sur chacune des deux dalles pour ouvrir la herse des galeries → les deux leviers des galeries pour ouvrir l’armurerie → clé crâne et porte crâne → treuil et monte-charge vers la caserne → clé croc dans le coffre et levier du raccourci → retour aux galeries, porte croc et escalier du chef → combat du trône, levier de la cage → retour à la porte scellée de la grande salle. Le réfectoire et la réserve du fond du puits restent facultatifs.

### Clés, coffres et butin partagé

Les clés utilisent leur sprite natif à 50 % et un scintillement de pixels dorés et clairs, sans effet flou. Les coffres ont cinq poses : fermé, trois positions du couvercle et ouvert. Les positions intermédiaires du donjon proviennent du même modèle voxel que le coffre natif ; les images Piskel fermée et ouverte sont conservées. Les coffres du monde utilisent la même chronologie avec leur silhouette existante. L’état ouvert reste acquis après sauvegarde et changement d’étage.

`Game.stepLoot` est appelé dans le monde et le donjon : envol, rebonds, attraction proche et ramassage partagent le même traitement. Chaque coffre fait jaillir cinq pièces et deux soins, comme les coffres du monde ; aucune récompense n’est créditée avant collecte. Une pièce vaut trois unités de monnaie. Le niveau, les obstacles et la capacité de soin sont vérifiés. Un coffre ne délivre son contenu qu’une fois. Les coffres des clés crâne et croc doivent maintenant être ouverts avant de révéler la petite clé à récupérer ; le parcours des énigmes reste identique.

Les noms et catégories visibles des armes viennent de leur identifiant dans le catalogue partagé. Les courbures et têtes asymétriques utilisent le même sens de miroir que la vue du personnage, y compris dans les poses de combat, le port, les traînées et les armes des gobelins. Les silhouettes des bras et tenues restent intactes.


### Décor cassable et interactions silencieuses

Les tonneaux et les piles de caisses du décor se brisent sous les impacts des armes (2 points de résistance, dégâts de l’arme). Les caisses mobiles des énigmes et les coffres restent intacts. Le butin des décors utilise exactement les tables `BREAKABLE.barrel` et `BREAKABLE.crates` du monde : monnaie, parfois soin, ou aucun objet. Le décor ne délivre son butin qu’une fois ; ses débris restent après sauvegarde et changement d’étage. Les piles brisées ne bloquent plus le passage.

Les animations comportent huit sprites, avec impact, rupture, projection des éclats, retombée et débris au sol. Sources éditables dans Piskel : `art/environnement/interieurs/forteresse-gobeline/animations/tonneau-brise.piskel`, `caisses-brise.piskel` et `coffre-vide.piskel`. `node scripts/build-dungeon-object-art.cjs` les produit avec le modèle, le sérialiseur et le désérialiseur de l’éditeur Piskel local ; chaque pixel est vérifié après réouverture. Les fichiers peuvent aussi être importés dans https://www.piskelapp.com/p/create/sprite/.

Les coffres ouverts utilisent désormais le sprite vide : l’or quitte le coffre lors de l’éjection du butin. Les clés ramassées figurent seulement dans l’inventaire, sans compteur dans le HUD ni annonce à leur acquisition. Un levier déjà actionné cesse de proposer une action ; leviers et treuil ne déclenchent pas de popup de réussite. Le monte-charge montre immédiatement les étages accessibles avec les boutons de choix habituels, sans bulle, texte à dérouler ni voix ; chaque destination est sélectionnable librement après activation du treuil.
