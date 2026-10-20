# Postes humains indépendants — JavaScript

## Mobilier isométrique intégré

L’atelier [Mobilier isométrique](../art/mobilier-isometrique/index.html) reprend
les **49 entrées actuelles** : 44 meubles et structures redessinés en géométrie
JavaScript, quatre références du décor naturel et l’accès logique au déneigement.
Ce lot est validé et activé dans le jeu sur demande du joueur. Le prototype huit directions a été abandonné ;
les personnages conservent leurs quatre vues et les durées de leurs activités.

`sprites/decors/mobilier-isometrique.js` utilise le rasteriseur des bâtiments,
la projection `(u-v, (u+v)/2-z)`, les contours natifs, le grain et l’usure des
matériaux. Les onze palettes de quartier changent les matériaux, sans modifier
les emprises ou les sockets. Établi : plateau à 9 unités natives ; banc : assise
à 5 ; couchage : support bas. Les planches utilisent le même zoom pour tous les
objets, et `echelle-joueur.png` montre le vrai joueur livré à côté des meubles.

`sprites/decors/postes-isometriques.js` fournit l’adaptateur compatible avec les
postes existants : vue fixe, socket opérateur, patient distinct, contact, approche,
support, réservation exclusive et plans avant/arrière complémentaires. Les
approches debout évitent l’emprise solide. Les pixels d’eau viennent du terrain
existant ; les quais et vannes ne fabriquent aucune étendue d’eau. La politique
hivernale reste celle du dépôt et ses caps de neige suivent la nouvelle géométrie.

L’assemblage s’obtient avec `HumanScene.withStations(IsometricStations)` ; le jeu livré utilise cet assemblage et le nouvel adaptateur de postes. Les cannes de verrier
conservent leur longueur et atteignent le four et les supports. Le couchage
transmet un angle de support de 63,435° au transformateur des calques déjà utilisé
pour s’allonger : sa silhouette couchée suit ainsi la pente du lit. Aucun dessin
de personnage à huit vues n’est conservé. Le PNJ qui soigne et le patient occupent
des sockets distincts ; le patient ne fait jamais partie du sprite du lit.

Les 92 clips humains déjà associés à des postes restent associés aux mêmes
identifiants. Le pupitre peut aussi montrer le clip existant `ledger`, et le
séchoir `hang`. Le dépôt n’a pas de clip dédié au boulanger : le four de cuisson
est dessiné et possède son socket, avec un aperçu au repos. Aucun métier,
inventaire, résultat de production ou comportement économique n’a été inventé.
Le contrat reste indépendant de la race ; la vérification d’animations de ce lot
porte sur les calques humains, sans annoncer une migration des packs des autres
races.

```sh
node scripts/render-isometric-furniture.cjs
node --test tests/isometric-furniture.test.cjs tests/human-stations.test.cjs tests/human-activities.test.cjs tests/human-igea-winter.test.cjs
node scripts/check-isometric-furniture.cjs
```

Les contrôles incluent 5 836 compositions humaines (corps autorisés, quatre
demandes de direction, toutes les images), les contacts des outils, les supports
des lits, les réservations, les emprises, les variantes de quartier et les 49
entrées de l’atelier dans Chromium. Les tests d’intégration complètent ces contrôles avec les collisions réelles du joueur, les approches des 24 meubles fixes de Clairfoyer, les sauvegardes et des captures Chromium du monde.

## Bibliothèque livrée et références initiales

Les 48 références approuvées sont disponibles dans `sprites/decors/` :
44 structures transcrites en grilles entières à palette fixe et quatre entrées
naturelles réutilisant l’atlas existant. Le renderer ne télécharge aucun PNG.
Les concepts conservés restent la référence de forme ; le builder enregistre
leurs rectangles de prélèvement et leurs empreintes. Les références humaines,
textes, anneaux, croix et outils portables de présentation ne sont pas extraits.

Les grilles de mobilier ont de 16 à 48 pixels de large. Le civil de référence
reste à ses 19 pixels natifs sans coiffe. Le buffer de composition de 128 × 128
sert à accueillir les décors plus hauts, pas à agrandir les personnages.

## Modules

| Module | Responsabilité |
|---|---|
| `sprites/humains/activites.js` | PNJ et objets manipulés, RGBA 80 × 80, ancre (40,52) |
| `sprites/decors/humains-grilles.js` | Grilles fidèles des structures construites |
| `sprites/decors/postes-humains.js` | Postes séparés, sockets, masque avant/arrière, réservation |
| `sprites/decors/atlas-nature.js` | Extraits identiques de l’atlas pour la prévisualisation autonome |
| `sprites/humains/scene.js` | Assemblage de démonstration, RGBA 128 × 128 |

L’ancien `Props.scene` est retiré. Les 152 clips humains de la bibliothèque
rendent uniquement leur acteur, même si un appel ancien fournit `scene:true`.
Les outils, armes, matières en travail et charges restent présents. Le cheval
approuvé est inchangé : la scène l’assemble comme animal séparé. Les transports
vides, notamment barque, charrette et coque du chantier naval, restent au lot
suivant ; leurs poses de PNJ sont conservées sans véhicule dessiné dedans.

## Nature et atlas existants

Aucun nouvel arbre, rocher naturel, gazon ou motif d’eau n’est dessiné.
`orchard_tree`, `resin_tree` et `ore_node` utilisent respectivement les props
`world_oak_0`, `world_pine_0` et `world_boulder_0`, avec les variantes de neige
existantes. La parcelle utilise le sol et des pixels de `scrub` existants.
La structure de la vanne et les plateformes ne contiennent pas de rivière,
berge ou herbe collée à leur image. Le monde conserve sa topologie et son sol.
L’eau contenue dans les auges/bassins passe par un masque d’intérieur et le
fournisseur de terrain existant ; son échantillonnage utilise les coordonnées
absolues du monde. Les snapshots de prévisualisation conservent leurs couleurs
et leurs sources ; ils ne constituent pas un nouvel atlas naturel canonique.

Dans le jeu, fournir directement les pixels de l’atlas déjà chargé :

```js
const Posts = require('../sprites/decors/postes-humains');
const atlas = Posts.createAtlasAdapter({
  // Pixels natifs relatifs au pied du prop, sans redimensionnement.
  getPropPixels: key => loadedNativeProps[key],
  // Couleur RGB hexadécimale du renderer existant, aux coordonnées du monde.
  getTerrainPixel: (material, worldX, worldY) =>
    existingTerrainPixel(material, worldX, worldY)
});
const instance = Posts.place('workbench', {
  x: 12000, y: 8400, instanceId: 'atelier-17', atlas
});
// instance.drawOrigin : origine du buffer local dans le monde.
// instance.worldSockets.operator : pieds, approche, direction, contact.
// instance.layers.back / front : deux masques disjoints du même sprite.
```

`getPropPixels` renvoie une liste `[x,y,couleurHex]` ou `{pixels: liste}` ;
`getTerrainPixel` reste la fonction du monde. Un atlas incomplet provoque une
erreur explicite, sans fabriquer un arbre ou une texture de remplacement.
L’adaptateur ne modifie pas les données fournies.

## Sockets et occultation

Chaque poste possède une seule vue de décor et un socket `operator` dont
les pieds, l’orientation, l’approche et le contact sont fixés par l’agencement
dessiné. Une demande de direction différente ne déplace ni ne retourne le PNJ
à un autre bord du meuble. Les chaises, ouvertures de four et zones de travail
restent donc les mêmes pendant toute l’activité. Le lit de soins ajoute un
socket `patient`, qui représente un occupant distinct, pas un autre angle.
Un futur angle de caméra nécessiterait un dessin de décor correspondant et
un raccord conservant le même emplacement physique ; aucun angle artificiel
n’est créé ici.
Les plans arrière et avant sont complémentaires : aucun pixel du poste n’est
dessiné deux fois. La scène ordonne les plans du décor autour de ceux du PNJ ;
seules les mains et parties d’outils réellement visibles au-dessus du contact
peuvent repasser au-dessus du bord. Un outil caché par le dos ne traverse pas
ensuite la tête à cause de ce raccord.

Le socket porte pieds, direction, approche, contact, support éventuel et clé
d’occupation. Les sièges et couchages sont des supports séparés. Le patient
et le cheval du palefrenier restent des entités distinctes du lit/de la stalle.
La scène de soins choisit un emplacement latéral de soignant, distinct du
couchage. Un outil long, comme la canne du verrier, fait reculer l’utilisateur
au lieu d’allonger ses bras ou de traverser le four.

```js
const occupancy = new Map();
const socket = instance.worldSockets.operator;
if (Posts.reserve(occupancy, socket, 'npc-42')) {
  // Navigation du jeu vers socket.approach, puis socket.feet.
  // Aligner le PNJ selon socket.facing avant de démarrer son clip.
}
Posts.release(occupancy, socket, 'npc-42');
```

La réservation est propre à chaque instance et au rôle fonctionnel du socket. Un autre PNJ ne peut pas libérer le poste à la place de son
occupant. Le moteur conserve la responsabilité du trajet, des collisions,
des inventaires et de l’exécution de l’activité ; ce module fournit le contrat
et les positions sans créer de population ou de production automatique.

## Atelier et reconstruction

L’onglet **Postes séparés · 48** montre les postes vides. Le sélecteur **Poste**
permet de les associer au PNJ. Les contrôles affichent les sockets, le sol de
l’atlas, le personnage seul et chaque plan du décor. Masquer le décor ne
recalcule pas la position du PNJ. Un poste affiche une seule vue fixe ; les
personnages sans poste et le cheval approuvé conservent leurs quatre directions. Les huit planches de concepts sont conservées
sur l’onglet de références.

```sh
npm run build:human-stations
npm run preview:humans
npm run test:humans
npm run check:human-workshop
```

Les tests vérifient notamment les 48 entrées, leur emplacement fixe, les plans
complémentaires, les pixels naturels identiques aux sources, l’adaptateur du
monde, les outils au contact, les corps sans mobilier et 4 420 compositions
sans débordement. Le navigateur parcourt les 152 clips et les 48 postes.

Ce lot migre la bibliothèque humaine et son atelier. Le contrat de postes est
réutilisable par toutes les races ; leurs packs et le peuplement du jeu
principal ne sont pas remplacés automatiquement par cette livraison.

Adaptation saisonnière : [Humains d’Igea en hiver](humains-igea-hiver.md), avec les masques de neige, activités suspendues et gestes supplémentaires.
