# Terrain isométrique de Hearthreaver

## Sources Piskel et routes rectilignes intégrées

Les sources originales de Sarak et Teremor sont dans `art/environnement/sarak/` et `art/environnement/teremor/` : sols, pavages, chemins, falaises et flore. Leurs fichiers `.piskel` restent les sources éditables ; le jeu embarque les données compilées de `sprites/environnement/`. Une case de 1 m garde un losange de 32 × 16 pixels ; les pièces de chemin mesurent 2 m, soit 64 × 32 pixels. Les coudes, jonctions en T et croisements utilisent les pièces standard et leurs bords adoucis. Les autres familles de terrain gardent leur renderer natif.

Les **137 routes terrestres**, y compris les accès aux embarcadères, suivent maintenant des segments suivant X ou Y. Les quatre routes maritimes ne changent pas. Les sommets géographiques, localités, identifiants des 1 199 arêtes de navigation et 57 points de pont restent conservés. Chaque arête porte son chemin physique ; les itinéraires des voyageurs et les nouveaux parcours des convois et missions sont décomposés aux virages, avec les mêmes identifiants d’incidents et de passages. Les dangers locaux sont évalués sur le chemin réellement parcouru.

Les longueurs terrestres passent de **250,184 km de référence à 316,724 km physiques (+26,6 %)**. Les durées et les coûts des nouveaux itinéraires suivent ces mètres physiques, sans accélération cachée. Les sauvegardes conservent leurs identités et les voyages déjà engagés conservent leur progression ; les nouveaux plans utilisent les tracés rectilignes. Les mers, les rivières et les positions des villes ne sont pas déplacées.

`data/world/orthogonal-roads.json` et `atlas.json.rectilinearRoads` contiennent la géométrie active. `scripts/build-world-orthogonal.cjs` vérifie la terre et le dégagement latéral, réserve les traversées d’eau aux passages existants et conserve leurs ancrages. Le build du monde reconstruit ce lot ; `npm run build:world-roads` le reconstruit seul. `npm run test:world-roads` contrôle les chemins physiques et les trajets ; `npm run check:world-roads` capture le vrai jeu. Les vues et rapports sont dans `art/world-roads/`.

La ville de Clairfoyer reste sur son plan approuvé à îlots mixtes. Les collisions, seuils et chemins des 2 613 bâtiments ont été testés dans le moteur ; les cultivateurs existants reçoivent leurs postes hors des îlots. L’intégration graphique des chemins ne crée aucun stock ; la vie de Clairfoyer utilise un programme distinct de représentants de son effectif existant, décrit dans `docs/conception-villes.md`.

Les sections suivantes conservent la description de la première reconstruction du terrain.

L’atlas de conception reconstruit les terrains du monde en géométrie native,
avec la projection exacte des bâtiments : `x = u - v`, `y = (u + v) / 2 - z`.
Les palettes proviennent de `WorldTerrainArt` et des rampes du jeu, sans couleurs
calculées par interpolation. Les textures sont échantillonnées aux coordonnées
mondiales : le découpage en cellules ne crée pas de raccords de texture.

## Analyse du monde existant

`scripts/world-model.js` distingue sept codes de terrain : sol (0), route (1),
place pavée (2), eau (3), sol avec décor (4), pont (5), roche et relief (8).
`scripts/world-terrain-art.js` les dessine sur des carrés de 16 px, dans onze
familles climatiques. Les anciennes falaises sont une bande décorative dans ce
rendu à plat. Les bâtiments utilisent désormais une autre projection.
`art/terrain-isometric-js/analyse-atlas.json` conserve cet inventaire.

## Catalogue reconstruit

Le nouveau catalogue contient **1 837 références, 167 par biome** :

- Treize surfaces : sol, terre nue, sable, gravier, boue, neige, glace, eau,
  eau profonde, sable humide, pavés, dallage et bois.
- Six séries de seize raccords : sentiers, sentiers pavés, rivières, rivages,
  transitions de terre et transitions de neige.
- Trente falaises : quinze combinaisons de bords à 16 et 32 unités de hauteur.
- Escaliers et pentes dans quatre directions, à deux hauteurs.
- Ponts et cascades dans quatre directions.
- Quatre décors au sol : touffes, galets, roseaux et racines.

Les bits de raccord sont N=1, E=2, S=4, O=8 dans le plan logique. Une tuile
de 16 × 16 unités devient un losange de 32 × 16 px ; une falaise haute de 32
unités conserve 32 px de hauteur verticale. Les faces ont des lumières fixes,
des strates, fissures et traces de mousse suivant le climat.

Les scènes d’assemblage utilisent les pixels des bâtiments déjà créés,
sans changer leurs dimensions. L’humain de référence mesure toujours 19 px.
Les routes y rejoignent les ponts, les berges encadrent les cours d’eau et les
escaliers rejoignent les plateaux.

Quatre comparatifs reprennent de vrais rectangles de l’atlas géographique.
Les routes y suivent leurs segments et leurs largeurs analytiques d’origine,
plutôt qu’un escalier de centres de cellules. Ces comparatifs montrent le
terrain : les acteurs et placements du jeu ne sont pas migrés dans ces images.

## Sources et livrables

- `sprites/terrain/terrain-isometric.js` : catalogue, géométrie, raster natif.
- `sprites/terrain/isometric-palettes.json` : palettes et profils existants.
- `sprites/terrain/terrain-isometric-scene.js` : scènes et lecture de l’atlas.
- `art/terrain-isometric-js/index.html` : atelier autonome, onze biomes,
  filtres, zoom entier et grille de projection.
- `planche-terrain.png` : comparaison des familles de pièces.
- `scene-commentee.png` : composition avec les bâtiments à l’échelle.
- `planches/`, `scenes/`, `comparaisons/` : tous les visuels.
- `tiles/`, `atlas-pixels-natifs.png`, `catalogue.json` : PNG natifs, atlas
  transparent, ancrages, hauteurs et emprises.

Commandes reproductibles :

```sh
npm run build:terrain-isometric
npm run test:terrain-isometric
npm run check:terrain-isometric
npm run package:terrain-isometric
```

## Intégration au jeu web et iOS

La projection est active dans la version jouable. Les 83 localités conservent
leurs centres et disposent de 4 514 bâtiments, dont 2 613 à Clairfoyer. Les positions de la simulation,
les routes géographiques, les stocks, la justice, la navigation et les
sauvegardes restent dans leur plan logique existant.

`world-projection.js` fournit une vue d’affichage : terrain, acteurs, objets,
effets, marqueurs et caméra passent dans le même repère 2:1. Les vues d’acteurs
partagent leurs identités et leurs caches ; elles interdisent les déplacements
écrits depuis le renderer. Les contrôles écran sont convertis vers le plan
logique, les coups d’armes vers leur géométrie dessinée, et les javelots visent
la position logique de leur cible. Les fondations utilisent l’inverse exact de
la projection des dessins. Les maisons s’atténuent entièrement à 32 % lorsqu’elles
masquent le joueur, avec la courbe de la plateforme initiale.

`world-isometric-art.js` peint le terrain final dans un worker. Sans worker,
le même générateur avance par petites tranches coopératives. Le rendu principal
ne reconstruit pas de région complète. Les routes suivent leurs segments et
largeurs ; les chemins du camp et des quartiers utilisent leurs tracés existants.
Les anciennes cellules solides de roche et de mur deviennent des reliefs
visuels à 32 et 24 unités ; elles restent bloquantes. Les escaliers, la plateforme,
les portes et le monte-charge du camp conservent leurs règles de jeu.

Le cache de terrain est borné à 16 régions, la file à huit demandes et un seul
travail est lancé à la fois. Les faces de falaise visibles se trient avec les
pieds des acteurs. Les parties de bâtiments hors écran sont retirées avant le
dessin, sans supprimer leurs fondations ou leurs habitants. Les sources sont
embarquées hors ligne dans le HTML web et iOS ; aucun PNG du nouvel atlas
n’est demandé pendant la partie.

Les captures et rapports réels sont dans `integration/`. La petite scène de
conception emploie désormais le Kaldor courant du jeu, extrait sans changement
de taille par `build-terrain-player-reference.cjs`, avec sa tenue et son arme.

### Contrôle de la version distribuée — 20 octobre 2026

`node scripts/check-world-isometric.cjs` compare les sources du dépôt avec les
sources réellement embarquées dans les HTML web et iOS, puis contrôle les
arrivées des 83 localités et capture sept scènes couvrant les cinq territoires.
Clairfoyer est photographié aux Halles, pas au relais d’arrivée situé à 885 m.
`PERF_NO_WORKER=1 node scripts/check-world-isometric.cjs` répète le contrôle
avec le rendu coopératif. Les positions et sauvegardes doivent rester stables,
les caches bornés et les fondations solides lorsque les maisons s’atténuent.
[Galerie et rapports](../art/terrain-isometric-js/integration/index.html).

Les textures Piskel actuelles sont actives dans la forêt tempérée (biome 6),
le désert (biomes 1 et 2) et le sol de départ. Les autres climats emploient le
catalogue isométrique à onze familles ; ils ne sont pas remplacés par les
textures de forêt ou de désert. La neige saisonnière peut recouvrir les sols.
Les 82 localités autres que Clairfoyer conservent leur implantation régionale :
leurs bâtiments utilisent le rendu isométrique courant, mais leurs plans
détaillés et programmes de quartiers restent à concevoir. Les captures sont
réalisées sous Chromium au format mobile et ne constituent pas un essai sur iPhone.

## Vérifications

Les tests couvrent l’égalité de projection avec l’architecture, les 1 837
rendus à alpha binaire, toutes les combinaisons de raccords, la couverture
sans trou du sol projeté, la continuité des routes/rivières, les hauteurs et
la conservation des codes de terrain des extraits réels. Chromium compare
les pixels des onze scènes à ceux du renderer natif et vérifie les contrôles
de l’atelier, les comparatifs et l’affichage mobile.

Deux anciens contrôles d’armes supposant une lame dirigée vers l’ennemi pendant
la préparation et la récupération ont été remis en accord avec les phases
actuelles déjà présentes sur `origin/main` (`a71bbd7`). La direction reste
strictement contrôlée au contact ; la préparation et l’après-impact restent
également distincts. Les dessins et poses d’armes ne changent pas.
