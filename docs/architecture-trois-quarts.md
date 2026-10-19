# Architecture humaine — trois quarts

Cette seconde bibliothèque reprend **les 234 identifiants existants** : 106 bâtiments,
8 variantes d’hiver et 120 modules, soit **696 vues**. Les familles Teremor,
Sylverive (dans Teremor), Igea, Sarak, Varan et Tagon gardent leurs matériaux,
fonctions et variantes. Les fonctions communes restent communes : cette version
n’invente pas six copies de chaque atelier. Aucun drapeau ni bannière.

[Atelier trois quarts](../art/architecture-34/index.html) ·
[Pack autonome](../art/architecture-34/architecture-34-complete.zip) ·
[Catalogue](../data/architecture-34/catalogue.json) ·
[Anciennes élévations](../art/architecture/atelier.html).

## Dessins et caméra

Les deux faces cardinales adjacentes fournissent les façades et leurs détails.
Le nouveau renderer reconstruit le volume : murs latéraux ombrés, plans inclinés
de toiture, pignons, tuiles/chaume, lucarnes, cheminées, terrasses, patios et
parapets. Ce n’est pas une rotation d’un PNG. Les anciennes élévations sont
conservées pour comparaison. L’étude `direction-artistique.png` est une référence
générée distincte ; les sprites livrés sont les dessins JavaScript de l’atelier,
exportés à leur grille native, et non des découpes de cette étude.

Une seule projection orthographique oblique s’applique à toutes les pièces :

```js
screenX = worldX + worldY * 0.5;
screenY = -worldY * 0.5 - height;
```

La façade reste horizontale ; le côté droit recule vers le haut à 45 degrés.
Il n’y a pas de point de fuite. Une tuile vaut 16 pixels au sol et un humain
mesure toujours 19 pixels verticaux. Les portes gardent leur hauteur native.
La profondeur comprimée n’est pas une réduction du personnage ou de la façade.
Les dimensions exportées incluent le toit et le relief projetés ; le plan au sol,
l’ancrage et les dimensions verticales figurent séparément dans chaque JSON.

Chaque bâtiment a quatre orientations trois quarts : façade + côté droit,
côté droit + arrière, arrière + côté gauche, côté gauche + façade. Chaque module
conserve ses deux états/orientations, y compris escalier seul et escalier avec
palier. Les 120 modules utilisent aussi cette caméra : les L/T ont des façades
et des couronnements, les deux axes de mur gardent la même hauteur, et les marches
montent dans la profondeur du plan. Les kits hauts régionaux restent à 64 px,
avec leur chemin de ronde à 52 px.

## Fichiers et utilisation ultérieure

**Le nouveau renderer `architecture-34.js` n’est chargé ni par le jeu ni par
le HTML iOS.** Cette modification laisse le paquet iOS, les villes et les
sauvegardes existantes inchangés. L’ancien bridge de
jeu ne doit pas être activé tel quel pour cette nouvelle projection : le futur
intégrateur devra adapter le placement écran, les collisions au plan au sol et
le tri de profondeur à la caméra choisie.

Charger les fichiers dans cet ordre dans un outil ou un futur renderer :

```html
<script src="sprites/architecture/architecture-data.js"></script>
<script src="sprites/architecture/architecture.js"></script>
<script src="sprites/architecture/architecture-34.js"></script>
```

```js
const A = HearthreaverArchitecture34;
const sprite = A.raster('T01', { dir: 'face' }); // RGBA + ancrage + plan
A.draw(ctx, { id: 'T01', dir: 'face', x: 160, y: 180, scale: 2 });
const snowy = A.raster('T09-hiver', { dir: 'face', layer: 'snow' });
const position = A.project(48, 0, 0); // décalage d’une travée au sol
```

`x` et `y` dans `draw` sont les coordonnées écran de l’ancrage, exprimées en pixels
d’affichage ; `scale` est un entier de 1 à 16. Les points de `footprint` sont en
pixels natifs projetés relativement à l’ancrage. `nativePlan` donne largeur,
profondeur et hauteur en unités natives. Pour positionner un assemblage, projeter
les coordonnées au sol puis multiplier les déplacements par le zoom. Le runtime
n’utilise aucun fichier PNG, DOM ou bibliothèque d’images pour calculer les pixels.

`art/architecture-34/export/<ID>/` contient une planche PNG transparente,
un JSON avec les cadres des vues, ancrages et dimensions, et les calques non
vides. Les cinq calques sont disjoints : `back`, `roof`, `front`, `mechanism`,
`snow`. Leur réunion reconstitue exactement le dessin. Les mécanismes des moulins
restent séparés ; aucune animation supplémentaire n’est annoncée.

## Reconstruction et vérification

```sh
npm run build:architecture-34
npm run test:architecture-34
npm run package:architecture-34
```

L’export PNG utilise `@napi-rs/canvas`, déjà déclaré dans le dépôt. Les tests
parcourent les 696 dessins, vérifient l’alpha, les calques, les quatre orientations,
les variantes d’hiver, les raccords projetés, les deux axes de mur, la conservation
de l’échelle verticale, le rendu Canvas et l’absence d’intégration au jeu.
