# Architecture isométrique native en JavaScript

Cette bibliothèque autonome interprète les nouveaux concepts avec une grille de
pixels contrôlée : 234 références, 106 bâtiments de base, huit variantes d’hiver,
120 modules et 696 vues. Les PNG sont exportés depuis le code ; aucun dessin de
concept n’est réduit, découpé ou chargé par le renderer.

[Atelier et filtres](../art/architecture-isometric-js/index.html) ·
[Planche de bâtiments](../art/architecture-isometric-js/apercu-batiments.png) ·
[Planche de construction](../art/architecture-isometric-js/apercu-construction.png).

## Style et échelle

- Projection pixel 2:1 symétrique : `x = X − Y`, `y = (X + Y)/2 − Z`.
- Une unité verticale fait un pixel natif ; humain 19 px, tuile 16 unités,
  porte simple avec 22 px de dégagement et 14 px de largeur.
- Les dimensions largeur/profondeur/hauteur du catalogue original sont conservées.
  La boîte de pixels projetés peut être plus grande à cause de la profondeur,
  des débords de toiture, des mécanismes et du contour extérieur de 1 px.
- Palette commune de 80 couleurs opaques, avec des rampes discrètes par matériau.
  Un sprite utilise généralement 10 à 35 couleurs ; les petites pièces en
  utilisent moins. Aucun dégradé, transparence partielle ou lissage.
- Textures en petits amas, joints espacés, aplats, silhouettes et ouvertures
  prioritaires. Les agrandissements se font par facteurs entiers.
- Les variantes d’hiver utilisent exactement les mêmes polygones, ouvertures,
  ancrages et empreintes ; seule la couleur des surfaces de toit change.

Le rendu utilise une grille RGBA indexée calculée en JavaScript, avec un tampon de
profondeur pour les occultations. Les triangles servent uniquement à tracer des
surfaces directement sur la grille native. Les formes, portes, poutres, toitures,
passages, tours, mécanismes et pièces sont définis par le code. Les variantes
régionales partagent des primitives, avec des recettes propres aux fonctions.

## Fichiers et usage

Les deux fichiers `sprites/architecture/isometric-catalogue.js` et
`sprites/architecture/architecture-isometric.js` suffisent, dans cet ordre.
Le personnage de comparaison est indépendant : `human-reference.js`.
Aucun ancien fichier de pixels d’architecture n’est nécessaire.

```js
const A = require('../sprites/architecture/architecture-isometric.js');
const image = A.raster('T01', {dir: 'face'});
// image : width, height, data RGBA, indices, anchor, footprint, nativePlan, geometry
A.draw(ctx, {id: 'T01', dir: 'face', x: 160, y: 180, scale: 2});
const winter = A.raster('T09-hiver');
const mechanism = A.raster('B13', {layer: 'mechanism', mechanismFrame: 1});
```

Les bâtiments ont quatre orientations `face / droite / dos / gauche`. Les modules
ont les orientations du catalogue `ew / ns`, ou `face / palier` pour les escaliers.
La variante palier ajoute une extension structurelle de 16 unités au sommet.
Les coordonnées des ouvertures et des escaliers dans `geometry` sont exprimées
sur le plan local de l’objet ; les points de `footprint` sont projetés et relatifs
à l’ancrage. `x / y` dans `draw` positionnent l’origine locale au sol.

Cinq calques disjoints : `wall / roof / detail / mechanism / snow`. Ils représentent
les pixels visibles après occultation ; leur réunion reconstitue le sprite. Ce
ne sont pas des intérieurs complets dévoilables en retirant le toit. Les exports
par orientation sont transparents et accompagnés des ancrages et mesures JSON.

```sh
npm run build:architecture-isometric
npm run test:architecture-isometric
npm run package:architecture-isometric
```

Le build utilise `@napi-rs/canvas`, déjà déclaré dans le dépôt, uniquement pour
encoder les PNG et dessiner les légendes. Le renderer natif fonctionne sans DOM,
sans Canvas et sans chargement d’image ; `draw` utilise seulement `fillRect`.
L’atelier fonctionne localement et permet recherche, filtres, quatre orientations,
zoom entier, comparaison humaine et téléchargement du PNG choisi.

## Vérification et limites

Les tests du renderer couvrent toutes les références et les 696 vues : tailles natives,
palette, alpha binaire, projection, orientations, correspondance été/hiver,
hauteur des accès et escaliers, séparation des calques, mouvements du moulin à
vent, égalité entre Canvas et raster, indépendance du cache et exécution sans DOM.

Ces dessins sont une interprétation rétro des concepts : ils simplifient les
détails peints et partagent certaines formes de base. Les tests ne constituent
pas une validation artistique de chaque bâtiment. Cette bibliothèque est désormais utilisée par les versions web et iOS, via
l’adaptateur `architecture-game.js`. Les identifiants des placements sauvegardés
sont conservés ; les quartiers et postes sont reconstruits à partir de la
révision du plan. Les intérieurs explorables restent un travail séparé.

## Références consultées

- [Raymond Schlitter — Pixelblog 41, Isometric Pixel Art](https://www.slynyrd.com/blog/2022/11/28/pixelblog-41-isometric-pixel-art) : diagonales pixel 2:1, volumes et cohérence de grille.
- [Raymond Schlitter — Pixelblog 2, Texture](https://www.slynyrd.com/blog/2018/2/15/pixelblog-2-texture) : simplification, petits groupes de pixels et contraste de densité.
- [MDN — imageSmoothingEnabled](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/imageSmoothingEnabled) : désactiver le lissage aux agrandissements.

Les dessins et le code de ce lot sont originaux ; aucun asset de ces sources
n’est copié. Références consultées le 20 octobre 2026.

## Finition et patine

La seconde passe ajoute rebords de fenêtre et seuils, épaisseur des rives,
faîtières, extrémités de chevrons, veinage et nœuds du bois, assemblages des
portes, éclats de pierre, petites fissures et enduit écaillé. Les couvertures ont
des rangs décalés, quelques tuiles plus sombres et des lèvres de chaume.
La mousse est concentrée au pied des matériaux des régions humides ; Sarak
conserve une usure sèche. Ces détails restent fixes dans le repère local de
l’objet, donc tournent avec lui. Aucun filtre de bruit n’est appliqué sur l’image.

L’échelle de 19 px par humain est conservée : cette passe enrichit les pixels
natifs au lieu d’augmenter arbitrairement la résolution de toutes les maisons.
`raster(id, {weather:false})` ou la case « Patine » de l’atelier désactive les
marques de vieillissement sans changer le volume. La touche n’enlève pas les
nouveaux éléments structurels. Les PNG du dossier `avant/` et la planche
`comparaison-usure.png` conservent le résultat de la première passe.

## Intégration au moteur

`architecture-game.js` conserve les positions de placement dans le repère logique
XY existant. Ses fondations sont les volumes natifs tournés dans ce plan ;
leurs pixels et les acteurs sont projetés une seule fois par la caméra commune.
Il expose les volumes
solides sous forme de polygones, les accès, les emprises et les positions de
travail couvertes. Les villes utilisent ces mesures pour leurs implantations.
Les 234 modèles restent disponibles via `placeArchitecture(id, options)` et
`architectureHeight(x,y)` fournit les hauteurs des plateformes et escaliers.
Les remparts hauts ne créent pas automatiquement un nouveau niveau de gameplay
ou des intérieurs : aucun système de construction par menu n’est ajouté.

`compile-isometric-runtime.cjs` précompile exactement les 696 vues avec la patine
validée. `isometric-pixels.js` stocke les indices, calques et bandes de profondeur
par suites de pixels. Une empreinte SHA-256 du renderer et du catalogue empêche
d’embarquer un ancien dessin après modification des sources. L’atelier conserve
le renderer de conception ; le jeu décode uniquement les vues utiles.

`architecture-render.js` prépare des morceaux de Canvas natifs, mis en cache
pour 96 combinaisons modèle/orientation/saison/état au maximum. Les morceaux se
trient avec les pieds des acteurs par profondeur au sol. Aucun PNG externe ni
reconstruction de toute la bibliothèque n’est nécessaire au lancement.

La commande `node scripts/embed-architecture.cjs` synchronise les sources web et
iOS et compile les données lorsque leurs sources ont changé. Le build du monde
et le paquet iOS l’appellent aussi. Les tests de l’adaptateur comparent les
696 vues embarquées pixel pour pixel aux dessins natifs, vérifient les passages,
les halles ouvertes, l’isolement du cache et la recomposition exacte des bandes.
Les tests des localités vérifient en outre routes, relief, transport, postes,
chemins et sauvegardes. Les contrôles Chromium couvrent trois formats mobiles.

Les modules peuvent être accolés sur la grille projetée sans deviner leurs
positions : `Game.attachArchitecture(parentUid, 'east', moduleId, 'west', options)`.
Les raccords vérifient la direction, la largeur et la hauteur de marche.
`HearthreaverArchitectureGame.attach` fournit la même opération pour un outil.

## État des contrôles locaux

L’intégration architecture, les routes de chaque entrée, les postes, les
sauvegardes et les trois formats Chromium passent. Les sources web et iOS ainsi
que le ZIP iOS ont été synchronisés et vérifiés. Le rapport se trouve dans
`art/architecture-isometric-js/verification-integration.json`.

Les contrôles de combat ont été adaptés au repère d’affichage commun. Deux
anciens contrôles de poses ont aussi été recalés sur la phase actuelle de
contact, sans modifier les dessins ni les mouvements d’armes. Les tests
concernés passent après relance.

## Passage derrière le bâti

Le renderer détecte les pixels opaques des parties hautes qui se dessinent
devant la silhouette du joueur. Le bâtiment concerné descend progressivement à
32 % d’opacité sur toute sa surface (toit, murs et base), puis retrouve son opacité quand le joueur est dégagé. Un autre
bâtiment utilisant le même dessin conserve sa propre opacité.

Le fondu reprend exactement la cible et la courbe de la plateforme initiale
avec le squelette : `alpha += (cible - alpha) * (1 - 0.004 ** dt)`.
La base s’atténue avec le reste du dessin. Les collisions des
volumes et fondations ne changent jamais avec l’effet. Les ouvertures et zones
libres derrière les murs restent praticables ; les parties physiques du bâti
restent infranchissables. Il n’y a ni déplacement automatique du joueur ni
suppression des collisions lorsque le bâtiment devient transparent.

Les quatre orientations, la neige, les transitions, le retour à l’opacité, les
fondations et le mouvement réel du joueur sont couverts par
`tests/architecture-occlusion.test.cjs`. Le contrôle Chromium vérifie également
la transparence et les fondations aux trois formats mobiles. Le comparatif
`art/architecture-isometric-js/passage-transparence.png` est produit par
`scripts/preview-architecture-occlusion.cjs` à partir des pixels du jeu.
