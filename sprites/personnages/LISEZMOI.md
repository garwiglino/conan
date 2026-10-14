# Planches des personnages

Le gardien est dessiné dans Aseprite (`gardien.aseprite`) et utilise directement sa planche PNG. Les autres personnages sont exportés depuis le jeu, qui dessine leurs images au lancement (`CharacterAtlas` dans `index.html`).

Conan est dessiné par le code dans le style des personnages de *Zelda: Oracle of Seasons* (Game Boy Color) : en pixels natifs, à l'échelle du décor (environ 19 px de haut), gros contour noir, couleurs franches, crinière noire coupée au carré, peau bronzée, pagne et bottes de fourrure, épée à deux mains tenue en oblique devant lui. Tête et corps sont des grilles faites main ; bras, poings et épée sont posés par le code. L'épée garde les angles de la trajectoire qui sert à toucher les ennemis (portée de jeu inchangée), avec une lame de grande épée de 16 px au plus. À la marche, le haut du corps s'abaisse d'un pixel à chaque pas. La planche fournie auparavant reste comme référence dans `conan_original_grand.png`.

- Il y a une planche PNG par personnage : Conan, squelette, serpent, cultiste (aussi utilisé pour le Veilleur), gardien, Zahra, et le Prêtre du serpent (normal et enragé).
- Chaque case fait 80 × 80 pixels, avec les pieds du personnage en (40, 52).
- Chaque ligne correspond à une animation dans une direction. Chaque colonne est une image de l'animation, avec 12 images au plus pour le gardien et 6 pour les autres. Les lignes exactes sont indiquées dans les JSON ; le gardien regroupe ses 7 animations initiales par direction (bas, droite, haut, gauche), suivies des quatre animations de mort.
- Chaque planche a son fichier JSON explicatif du même nom (`conan.json`, `squelette.json`…). On y trouve, animation par animation : le nom, la description, le nombre d'images, si l'animation tourne en boucle, la durée de chaque image quand elle est fixe, le rôle de chaque image (élan, frappe…) et, pour chaque direction, la ligne et le cadre [x, y, largeur, hauteur] de chaque image.
- Le fichier `index.json` regroupe les mêmes informations pour tous les personnages, ligne par ligne.
- Les fichiers `_apercu` sont agrandis 2 fois, avec le nom de chaque ligne écrit à gauche.

Les planches de casse des objets sont dans le dossier `sprites/`.

## Gardien Aseprite v3

216 images, 32 animations : repos, marche, coup de poing, garde, blessure, frappe au sol, saisie/projection et mort dans les quatre directions. La vue gauche a son propre éclairage. Le fichier `gardien-animations.json` décrit les lignes, durées et points de prise ; `gardien-prise.png` fournit les doigts à placer devant Conan pendant la saisie.

La mort dure 1,4 s sur 12 poses par direction. Les blocs suivent une chute à 360 pixels/s², un rebond amorti (restitution 0,24) et un glissement freiné au sol. La poussière se disperse puis disparaît ; la dernière pose reste comme amas de pierres. Les blessures produisent aussi des éclats physiques, sans sang ni restes organiques. `gardien-mort.gif` montre les quatre vues.

`scripts/guardian-death.lua` reconstruit les poses de mort dans Aseprite à partir des calques des poses de repos, conserve les autres animations et exporte la source, la planche et l'aperçu. Paramètres Aseprite : `source` (fichier `.aseprite`) et `out` (dossier d'export existant).

Le repos dure 2,52 s. Les coups touchent à 500 ms (poing) et 750 ms (sol) ; la saisie attrape à 450 ms et projette à 1 050 ms. La marche avance d'une pose tous les 3 pixels parcourus. La garde tient la pose 2. Les dimensions des collisions et les dégâts restent ceux du jeu.

Après modification des exports, lancer `node scripts/embed-guardian.cjs` depuis la racine. Cette commande incorpore les PNG et les données dans `index.html` et synchronise la copie iOS. C'est nécessaire : les apps déjà installées téléchargent uniquement ce fichier HTML. L'archive Xcode allégée télécharge elle aussi cette version au premier lancement.

Vérification : installer les dépendances de développement avec `npm install`, puis `npm test`. `node scripts/preview-guardian.cjs` produit des vues de contrôle avec le moteur du jeu dans `test-output/`.

`node scripts/preview-guardian.cjs --death` montre l'effondrement dans le décor. Les tests vérifient également que les 216 images recomposées depuis les calques Aseprite correspondent à la planche intégrée.
