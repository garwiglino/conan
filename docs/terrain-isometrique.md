# Terrain isométrique de Hearthreaver

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
leurs centres et disposent de 1 947 bâtiments. Les positions de la simulation,
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
