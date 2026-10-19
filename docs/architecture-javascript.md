# Architecture humaine — pixels JavaScript natifs

Le catalogue complet des planches est transcrit : **106 bâtiments, 8 variantes
d’hiver, 120 modules, 696 vues et 3 218 496 positions de pixels natives**. Les quatre
vues de chaque bâtiment restent des dessins distincts. Les pièces de construction
respectent les axes de la carte : face est–ouest, dessus nord–sud, raccords en L/T
vus du dessus, escaliers de face. Aucun drapeau ni bannière n’est ajouté.

## Fichiers

- `sprites/architecture/architecture-data.js` : palette commune de 95 couleurs,
  grilles indexées compressées sans perte, plans, dimensions et provenance.
- `sprites/architecture/architecture.js` : rendu entier, calques, portes,
  géométrie de collision, surfaces de marche, raccords et export SVG.
- `sprites/architecture/human-reference.js` : vrais pixels du civil du jeu,
  **14 × 19 px**, utilisés dans l’atelier. Aucun personnage de remplacement.
- `sprites/architecture/localities.js` et `data/architecture/localites.json` :
  correspondances des 83 localités. Sylverive appartient à Teremor.
- `scripts/architecture-world.js` : liaison du catalogue avec le moteur,
  rendu des éléments explicitement placés, collisions et sauvegarde.
- `art/architecture/atelier.html` : atelier de contrôle, construction et export.
- `art/architecture/export/` : planches transparentes à l’échelle native,
  calques séparés et données JSON compatibles avec les frames Aseprite.

Le rendu charge uniquement les données JavaScript. Les PNG des concepts ne sont
pas chargés, réduits ou affichés pendant l’exécution. La compilation d’auteur
échantillonne les silhouettes approuvées à leur grille native, supprime fond,
repères et légendes, réindexe les matériaux et normalise les raccords. Les crops
et SHA-256 des références sont conservés pour permettre leur vérification.

## Échelle

Une unité de l’API est un pixel natif du jeu ; la tuile mesure 16 px. Le zoom est
un entier d’affichage, sans ajout de pixels ni interpolation. Les portes civiles
réservent une hauteur libre de 22 px ; les arches fortifiées sont traversantes
avec une hauteur libre de 32 px. Les constructions ouvertes ont des supports
distincts dans leurs collisions, plutôt qu’un rectangle plein.

Les kits village, bourg et château ont respectivement des hauteurs totales de
40, 48 et 64 px, avec des chemins de ronde à 30, 38 et 52 px. Les kits régionaux
utilisent le niveau haut de 64 px avec parapet de 12 px. Un raccord vérifie son
orientation, son épaisseur et son niveau de marche. Une pièce de 40 px ne se
raccorde pas directement à une pièce de 64 px.

Le plan au sol et l’image sont distincts. Le dessus d’un mur et un platelage
sont dessinés à leur altitude, stockée dans `frames[vue].lift`. Un escalier
projette **sa course au sol + sa montée** : celui du kit de château possède une
course de 64 px et une montée de 52 px, soit une image frontale de 116 px. Le
palier ajoute sa profondeur. Cette distinction évite les escaliers trop courts
et les jonctions flottantes. Les raccords plans emploient le même ruban de
matière à épaisseur constante, avec les détails des coins conservés à l’intérieur.

## Utilisation

Dans un navigateur, charger les deux scripts dans cet ordre :

```html
<script src="sprites/architecture/architecture-data.js"></script>
<script src="sprites/architecture/architecture.js"></script>
```

```js
const A = HearthreaverArchitecture;
A.draw(ctx, {id: 'T01', dir: 'face', x: 160, y: 180});
A.draw(ctx, {id: 'T09', dir: 'face', season: 'winter', x: 320, y: 180});

// Raccord exact de deux travées, sans redimensionner les pièces.
const left = {id: 'TER-H01', dir: 'ew', x: 100, y: 160};
const right = A.attach(left, 'east', {id: 'TER-H01', dir: 'ew'}, 'west');
A.drawAssembly(ctx, [left, right]);

const pixels = A.raster('F11', {dir: 'face'}); // RGBA opaque/transparent
const plan = A.geometry('F11', {dir: 'face', x: 160, y: 180, open: 1});
```

`draw` dessine la pièce native à son ancrage. `drawStructure` complète la façade
horizontale sous un raccord élevé ; toutes les surfaces restent orthogonales.
`drawAssembly` trie les pièces selon leur position au sol. Les calques sont
`back`, `roof`, `front`, `mechanism`, `snow` ; leur réunion reconstitue exactement
les pixels du dessin complet. Les mécanismes des deux moulins sont détachables
dans les vues qui les montrent ; aucune animation de mécanique n’est inventée.

Le paramètre `open` ouvre une porte en pixels entiers. `opening` réserve une
ouverture dans le parapet pour un escalier. `geometry`, `collides` et
`standingHeight` fournissent les informations au contrôleur de déplacement ;
les corps et horaires des personnages restent ceux du moteur existant.

En Node, `require('./sprites/architecture/architecture.js')` donne la même API,
avec `raster` utilisable sans navigateur ni bibliothèque d’images. Le rendu
Canvas peut utiliser `setCanvasFactory(createCanvas)` si un cache est souhaité.

## Intégration au jeu

Le catalogue est maintenant chargé dans les éditions web et iOS. Le premier
aménagement des 83 localités est décrit dans [Implantation des localités](implantation-localites.md).
`embed-world.cjs` appelle automatiquement `embed-architecture.cjs` ; le paquet
standalone et l’atelier restent disponibles pour le travail d’auteur.

Les constructions explicitement créées avec
`game.placeArchitecture(id, {x, y, dir, site})` gardent leur sauvegarde propre.
Les quartiers déterministes utilisent une géométrie partagée et un index spatial,
sans les recopier dans chaque sauvegarde. Le contrôleur conserve les surfaces
hautes de la bibliothèque ; ce premier aménagement utilise les bâtiments au sol
et n’installe pas de nouveaux remparts ou escaliers à parcourir.

## Reconstruire et vérifier

Depuis le dépôt complet et les références sauvegardées :

```sh
python scripts/build-architecture.py --concept-root /chemin/architecture
node scripts/build-architecture-human.cjs
node scripts/export-architecture.cjs
node --test tests/architecture.test.cjs
```

La compilation d’auteur demande Pillow, NumPy et SciPy ; l’export des PNG demande
la dépendance de développement existante `@napi-rs/canvas`. L’exécution du rendu
n’a besoin d’aucune de ces dépendances. Les grilles sont compressées avec un
index de palette de 7 bits et une longueur de run de 9 bits par caractère Unicode
(la plage des surrogates est évitée). Le décodeur contrôle la longueur exacte de
chaque vue et refuse tout indice ou run invalide.

Les tests vérifient les 696 vues, leur alpha binaire, la recomposition exacte des
calques, les plans tournés, les passages sous arches, la marche de l’humain sur
les neuf exemples de kits, les raccords incompatibles et les sauvegardes.
