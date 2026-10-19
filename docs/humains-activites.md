# Humains — sprites JavaScript, activités et atelier

Le module `sprites/humains/activites.js` ajoute une bibliothèque visuelle de
**67 fonctions et 152 gestes**, dans quatre directions et cinq climats. Les
48 silhouettes civiles, les 11 tenues de Kaldor, les 72 modules humains et les
cinq casques existants constituent ses sources. Les têtes et cheveux approuvés
restent inchangés. L'atelier est [ici](../art/humains/activites/atelier.html).

Les [48 postes indépendants](humains-postes-javascript.md) sont maintenant
séparés des animations : `activites.js` rend seulement le personnage et ses
objets. `sprites/decors/postes-humains.js` fournit les postes, sockets et plans
d’occultation ; `sprites/humains/scene.js` les assemble dans l’atelier.

La répartition demandée est appliquée : transports, fonctions militaires et
métiers pénibles sont masculins. Les autres fonctions proposées peuvent utiliser
les deux corps civils. Les tenues natives féminines d'atelier restent conservées
comme dessins, sans affectation automatique à un métier pénible.

## Références et réalisation

Avant les nouveaux décors/accessoires, trois planches de concepts ont été
générées : `concepts/metiers.png`, `concepts/postes-transports.png`,
`concepts/equipements.png`. Leurs silhouettes et matières guident les dessins
JavaScript de `accessoires.js`. `REFERENCE` relie chaque outil/poste à une case.
Ces sprites sont des adaptations à la taille du jeu, pas une copie à pleine
résolution des concepts.

Le concept supplémentaire `concepts/cheval-chibi.png`, retenu par l'utilisateur,
est transcrit en grilles JavaScript dans `cheval.js` : 40 × 32 pixels de profil,
24 × 32 de face/dos. Chaque vue est prélevée indépendamment, débarrassée du petit
aperçu voisin et limitée à une palette fixe. Le cheval approuvé est conservé ;
les corrections d'animation conservent les jambes courtes du cavalier et la
suppression des deux rabats rectangulaires du casque.

Le cavalier emploie un bassin posé sur la selle, de courtes jambes pliées,
une jambe éloignée derrière la monture et une jambe proche devant le flanc.
De face/dos, les cuisses sont masquées ; seuls de petits genoux/mollets et bottes
apparaissent sur le plan avant. Les rênes rejoignent la bride. Le cavalier suit le mouvement de la selle ;
la montée part des pieds au sol et la descente inverse les mêmes poses. Les postures de
montée et descente restent des ressources visuelles ; le moteur conserve la
responsabilité du déplacement, du support et des collisions.

## Contenu

- Agriculture et récoltes, élevage, pêche, bois/résine/charbon, mine/carrière,
  forge/fours/verrerie, textile/cuir, cuisine, remèdes et soins.
- Construction, réparation de routes et de coques, portage, attelage, courrier,
  navigation, selle, marché et écritures.
- Repos, parole, nourriture, boisson, sommeil, recueillement, alerte, blessure,
  mort et reddition ; habillage et mise de coiffe.
- Garnisons, milices, gardes et escortes de Teremor, Sylverive, Igea, Sarak,
  Varan et Tagon ; Veilleurs ; variantes de réseaux locaux de la bible.
- Trois études d'armes à distance, explicitement présentées comme études,
  sans inventer des régiments canoniques. L'estoc et la taille montés sont
  réservés respectivement aux cavaliers de lance et de lame.

Les livrées proposées ne prétendent pas fixer de nouveaux blasons. Les groupes
clandestins réutilisent des vêtements de métier cohérents avec leur activité.
Les attaques/sorts du Prêtre existant restent dans son pack déjà livré.

## Utilisation

Charger dans cet ordre : `sources-natives.js`, `catalogue.js`, `rig.js`,
`cheval.js`, `accessoires.js`, `modularite.js`, `activites.js`. L'API publique est
`HearthreaverHumanActivities` dans le navigateur, ou un module CommonJS dans Node.

```js
const Art = require('../sprites/humains/activites.js');
const action = 'mine';
const frame = Art.frameAt(action, elapsedSeconds);
const image = Art.raster({
  role: 'miner', action, frame, dir: 'droite', climate: 'neige',
  sex: 'masculin', age: 'mur', hair: '06', color: 'brun'
});
// image.data : RGBA 80 × 80 ; ancre moteur (40,52).
// Ou Art.draw(context2D, options), sur un canvas de 80 × 80.
```

`draw` écrit les pixels avec `putImageData` ; pour un agrandissement, dessiner
ce canvas dans la destination avec le lissage désactivé. `raster` et
`renderLayers` sont synchrones, sans téléchargement ni décodage d'image.
Les sources et les compositions temporaires sont séparées ; enlever une
coiffe restitue les pixels originaux des cheveux. Le vieillissement impose
la couleur argentée des cheveux et de la barbe.

`activitiesFor(role)` filtre les gestes et équipements compatibles.
`frameAt(id, seconds, distance)` accepte une distance pour les locomotions :
une distance inchangée immobilise les pieds même si le temps passe.
`eventsBetween(id, before, after)` émet les repères de contact/transfert une
seule fois par traversée. Une action à fin fixe garde sa dernière pose.
L'option de répétition de l'atelier ne change pas ce contrat.

Le moteur doit appliquer dégâts, inventaires, production et ressources selon
ses propres règles. Un geste de forge ne crée aucun métal par image rendue.
`activites.js` ne peint aucun poste, animal ou véhicule, même si un ancien
appel passe `scene:true`. Les objets de scène sont fournis séparément par le
jeu ou par `scene.js` dans l’atelier. Les rênes et outils tenus restent sur le PNJ.

## Appuis et continuité des animations

L'ombre de l'atelier suit l'ancre du support, indépendamment du cadrage du
poste. La marche conserve une jambe en appui, y compris dans les vues de profil.
Les translations du personnage déplacent le corps entier sans déformer les
jambes. Les poses assises utilisent de courtes jambes pliées ; le sommeil et
les chutes sont recalés sur le couchage et le sol. Les poses de rameur et de conducteur sont conservées, mais leur véhicule
indépendant est reporté au prochain lot de transports vides.

Les outils de frappe gardent leur longueur et atteignent la surface du poste
au contact, puis reviennent à la pose de préparation. Une charge déposée reste
au sol après le lâcher, sans deuxième caisse dans le décor. La perche descend
vers l'eau et les rênes de conduite rejoignent la bride du cheval.

`metadata.support` expose `kind`, `ground`, `shadow`, `actorOffset` et le
progrès de montée `transition`. Utiliser `ground` pour placer l'ombre : l'ancre
(40,52) reste celle d'un humain debout ; la composition montée repose à (40,74).
Ne pas déplacer la caméra quand la première jambe passe sur la selle. Les poses
couchées ou portées par un véhicule ne reçoivent pas d'ombre humaine au sol.
`metadata.toolContacts` expose le point visé et le bout de l'outil rendu ;
`metadata.cargo` indique la position de la charge et son état posé.

## Reconstruction et contrôles

```sh
npm run build:human-sources  # Python 3 standard + sources Aseprite préservées
node scripts/build-human-horse.cjs
npm run build:human-stations # concepts retenus + atlas existant, sans nouveau terrain
npm run preview:humans
npm run test:humans
npm run check:human-workshop # nécessite Playwright et Chromium
```

Le générateur produit l'atelier autonome et cinq planches PNG, puis
`data/humains/activities-manifest.json` avec les rôles, clips, concepts et
empreintes des sources. Le fichier autonome complet, concepts intégrés, est
également écrit dans `test-output/humains/atelier-autonome.html`.

La suite vérifie 4 420 images directionnelles sans débordement, les palettes
à alpha binaire, les deux corps autorisés et les cinq climats, la correspondance
pixel pour pixel du repos des 48 silhouettes avec l'atlas existant, les masques
de cheveux réversibles, les contacts, les restrictions d'équipement et les poses
en selle, les pieds plantés sur les 48 silhouettes, les raccords de poses,
le contact au sol/couchage, la récupération des outils et la dépose des charges.
Le contrôle navigateur parcourt les 152 gestes, vérifie les contrôles,
la recherche, les références, l'affichage mobile, le placement réel des ombres, la stabilité du cadrage pendant la montée,
les 48 postes vides, les sockets et les plans de décor séparés.

## Portée livrée

Ce lot fournit les ressources, leur lecture et leur revue animée. Il ne remplace
pas automatiquement les PNJ du jeu principal, ne crée pas de nouvelles armées
et ne modifie pas les sauvegardes, la simulation ou les HTML web/iOS du jeu.
Le raccordement des formations au mandat, à la juridiction et aux personnages
du monde est une étape d'intégration distincte du présent catalogue visuel.

Adaptation saisonnière : [Humains d’Igea en hiver](humains-igea-hiver.md), avec les masques de neige, activités suspendues et gestes supplémentaires.

Le [système de vêtements modulaires](humains-modularite.md) conserve les pixels des manches, mains, gants, jambes et chaussures dans tous les clips, avec des bras limités aux proportions natives.
