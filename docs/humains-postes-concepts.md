# Humains — concepts de postes indépendants

Références retenues et désormais [transcrites en JavaScript](humains-postes-javascript.md) : **48 concepts de postes fixes**, trois planches de seize cases, une planche de sockets/occultation et le guide du personnage natif. Les PNG sont des références de fabrication, pas des sprites runtime ni des masques déjà calculés. Les transports vides sont reportés au lot suivant.

## Règle commune à toutes les races

Le décor existe comme entité indépendante du monde. Il possède ses propres sprites et états ; ses pixels ne sont jamais intégrés aux images d’animation d’un personnage. Cela comprend tables, bancs, lits, étables, machines, fours, structures de travail et véhicules lors du prochain lot. Les personnages, patients et animaux restent des entités distinctes. Les armes, outils tenus, objets manipulés, matières en cours de travail et charges gardent leur rendu propre avec l’acteur ou l’objet concerné.

Les exemples humains dessinés à côté ou dans une composition servent de repères visuels. Ils ne doivent pas être extraits avec le mobilier. Les anneaux cyan, croix dorées, lignes et teintes magenta sont des annotations d’éditeur, jamais des pixels décoratifs du sprite final.

## Planche et échelle

- [Ateliers, forge, fours et textile](../art/humains/activites/concepts/postes/01-ateliers.png)
- [Vie quotidienne, soins et ferme](../art/humains/activites/concepts/postes/02-vie-ferme.png)
- [Sites fixes, récoltes et quais](../art/humains/activites/concepts/postes/03-sites.png)
- [Sockets et occultation](../art/humains/activites/concepts/postes/04-sockets-occultation.png)
- [Personnage natif, quatre vues](../art/humains/activites/concepts/postes/humain-echelle.png)

Le civil de référence sans coiffe mesure réellement 19 pixels de haut dans les sources ; sa largeur est de 14 pixels de face/dos et 12 de profil. La mention illustrative « 22 px » de certains en-têtes n’est pas une mesure de ce sprite natif. Le guide natif prévaut : sol à (40,52), surface de travail visée environ 7 pixels plus haut ; assise environ 4 pixels plus haut. Les volumes plus grands restent possibles pour les machines et les cadres. Les dimensions du manifeste sont des cibles de dessin à vérifier au contact, pas des coordonnées de sockets validées.

## Contrat de socket et d’occultation

Chaque socket doit fournir une position locale des pieds, une direction du personnage, des contacts de mains ou d’outil, une zone d’approche libre, un support éventuel (assise/couchage), un masque d’occultation pour son agencement fixe et un état d’occupation. Les personnages se déplacent jusqu’à l’approche puis alignent les pieds ; ils ne sont pas déplacés verticalement pour compenser une mauvaise taille de table. La réservation d’un poste appartient au moteur, pas au dessin.

Composition : `décor arrière → couches propres du PNJ et objets → décor avant`. Les couches avant/arrière d’un même objet doivent être complémentaires, sans double plateau, rail ou pieds. Les objets tenus et les mains au-dessus d’un plateau peuvent réclamer un plan distinct au-dessus de ce plateau. Une simple superposition globale ne suffit pas : les masques et l’altitude du contact déterminent ce qui est caché. Chaque poste garde un emplacement d’utilisation fixe. Les quatre directions du personnage ne créent pas quatre positions autour du meuble. Tout angle supplémentaire demanderait un décor correspondant et un raccord du même emplacement physique.

Un lit possède un socket de couchage et un socket de soin latéral ; un patient ne fait jamais partie du lit. Une stalle possède des sockets distincts pour l’animal et l’intervenant ; sa barrière proche peut masquer les jambes sans cacher arbitrairement les mains. Un banc pose le bassin sur l’assise et garde de courtes jambes repliées. Aucun marqueur d’éditeur n’apparaît dans les images de jeu.

## Inventaire des 48 concepts

| No | Poste | Planche / case | Enveloppe native proposée |
|---|---|---|---|
| 01 | Établi commun | 1 / 1,1 | 32 × 16 |
| 02 | Billot | 1 / 1,2 | 16 × 12 |
| 03 | Chevalet de sciage | 1 / 1,3 | 32 × 16 |
| 04 | Enclume sur souche | 1 / 1,4 | 24 × 16 |
| 05 | Forge et soufflet fixe | 1 / 2,1 | 48 × 32 |
| 06 | Four de fusion | 1 / 2,2 | 32 × 32 |
| 07 | Auge de trempe | 1 / 2,3 | 32 × 16 |
| 08 | Tour de potier | 1 / 2,4 | 32 × 24 |
| 09 | Four de potier | 1 / 3,1 | 32 × 32 |
| 10 | Banc de verrier | 1 / 3,2 | 32 × 16 |
| 11 | Four de verrier | 1 / 3,3 | 40 × 32 |
| 12 | Métier à tisser | 1 / 3,4 | 32 × 32 |
| 13 | Râtelier à fibres | 1 / 4,1 | 32 × 16 |
| 14 | Cadre à peaux | 1 / 4,2 | 32 × 32 |
| 15 | Cuve de teinture | 1 / 4,3 | 32 × 16 |
| 16 | Banc de corderie | 1 / 4,4 | 40 × 24 |
| 17 | Puits à treuil | 2 / 1,1 | 32 × 32 |
| 18 | Meule et trémie | 2 / 1,2 | 32 × 24 |
| 19 | Presse à huile | 2 / 1,3 | 32 × 32 |
| 20 | Table de cuisine | 2 / 1,4 | 32 × 16 |
| 21 | Foyer et marmite fixe | 2 / 2,1 | 32 × 32 |
| 22 | Four de cuisson | 2 / 2,2 | 32 × 32 |
| 23 | Table de remèdes | 2 / 2,3 | 32 × 16 |
| 24 | Lit de soins vide | 2 / 2,4 | 32 × 16 |
| 25 | Couchage vide | 2 / 3,1 | 32 × 12 |
| 26 | Banc d’assise | 2 / 3,2 | 24 × 12 |
| 27 | Table et tabourets | 2 / 3,3 | 40 × 20 |
| 28 | Étal vide | 2 / 3,4 | 40 × 32 |
| 29 | Pupitre et tabouret | 2 / 4,1 | 32 × 20 |
| 30 | Ruche | 2 / 4,2 | 24 × 24 |
| 31 | Module d’étable vide | 2 / 4,3 | 48 × 32 |
| 32 | Mangeoire et abreuvoir | 2 / 4,4 | 48 × 16 |
| 33 | Stalle de traite et tonte vide | 3 / 1,1 | 48 × 32 |
| 34 | Enclos et portillon | 3 / 1,2 | 48 × 24 |
| 35 | Étendage vide | 3 / 1,3 | 40 × 24 |
| 36 | Séchoir vide | 3 / 1,4 | 32 × 24 |
| 37 | Vanne d’irrigation | 3 / 2,1 | 40 × 24 |
| 38 | Parcelle cultivable | 3 / 2,2 | 40 × 24 |
| 39 | Arbre de verger | 3 / 2,3 | 40 × 40 |
| 40 | Arbre résinier | 3 / 2,4 | 32 × 40 |
| 41 | Meule de charbon | 3 / 3,1 | 40 × 24 |
| 42 | Filon de minerai | 3 / 3,2 | 32 × 24 |
| 43 | Bloc de carrière | 3 / 3,3 | 32 × 24 |
| 44 | Crible fixe | 3 / 3,4 | 32 × 20 |
| 45 | Bassin salin | 3 / 4,1 | 40 × 16 |
| 46 | Mur et échafaudage bas | 3 / 4,2 | 40 × 32 |
| 47 | Quai et borne d’amarrage | 3 / 4,3 | 40 × 24 |
| 48 | Accès de quai et rive | 3 / 4,4 | 40 × 24 |

## Raccord avec les activités existantes

[data/humains/stations-concepts.json](../data/humains/stations-concepts.json) classe chaque station existante : concept fixe associé, objet mobile, entité vivante ou transport reporté. Les activités partageant actuellement `bench` réutilisent l’établi 01 ; les gestes de repos assis emploient le banc 26. La rive et le quai 48 servent aux gestes de pêche et d’accès. La coque du charpentier naval sera raccordée au bateau vide du lot transports. Les ressources naturelles sont des cibles fixes indépendantes ; les moutons ne sont pas des décors.

Le four de cuisson, le séchoir et l’étable complètent les usages humains sans inventer de nouvelle faction. Le dessin représente une base de matériaux humains commune ; les variantes locales/climatiques seront des ressources du décor, pas des versions intégrées au PNJ.

## Transcription et migration humaines réalisées

Le lot JavaScript est décrit dans [le guide des postes](humains-postes-javascript.md). Les 44 structures sont transcrites en grilles synchrones ; quatre entrées naturelles référencent les arbres, rochers ou plantes existants. Les marqueurs et personnages de comparaison sont exclus. Les 152 clips humains passent par un rendu de personnage sans décor ; l’atelier compose séparément les postes et leurs occupants.

La règle reste commune aux autres races. Ce lot implémente les postes humains et leur contrat réutilisable ; il ne modifie pas automatiquement les packs des autres races ni le peuplement du jeu principal. Les futurs transports vides restent à créer séparément.
