# Planches des personnages

Le gardien (`gardien.aseprite`) et le Prêtre du Serpent (`pretre/pretre-animations.aseprite`) sont dessinés dans Aseprite et utilisent directement leurs planches PNG. Les autres personnages sont exportés depuis le jeu, qui dessine leurs images au lancement (`CharacterAtlas` dans `index.html`).

Le dossier `pretre/` remplace les anciennes planches `pretre_du_serpent*.png`, conservées comme références. `index.json` pointe vers les exports utilisés dans le jeu. Les JSON des anciennes planches décrivent uniquement ces références historiques.

Conan est dessiné par le code dans le style des personnages de *Zelda: Oracle of Seasons* (Game Boy Color) : en pixels natifs, à l'échelle du décor (environ 19 px de haut), gros contour noir, couleurs franches, crinière noire coupée au carré, peau bronzée, pagne et bottes de fourrure, épée à deux mains tenue en oblique devant lui. Tête et corps sont des grilles faites main ; bras, poings et épée sont posés par le code. L'épée garde les angles de la trajectoire qui sert à toucher les ennemis (portée de jeu inchangée), avec une lame de grande épée de 16 px au plus. À la marche, le haut du corps s'abaisse d'un pixel à chaque pas. La planche fournie auparavant reste comme référence dans `conan_original_grand.png`.

- Il y a une planche PNG par personnage : Conan, squelette, serpent, cultiste (aussi utilisé pour le Veilleur), gardien, Zahra, et le Prêtre du serpent (normal et enragé).
- Chaque case fait 80 × 80 pixels, avec les pieds du personnage en (40, 52).
- Chaque ligne correspond à une animation dans une direction. Chaque colonne est une image de l'animation, avec 18 images au plus pour le Prêtre, 12 pour le gardien et 6 pour les autres. Les lignes exactes sont indiquées dans les JSON ; le gardien regroupe ses 7 animations initiales par direction (bas, droite, haut, gauche), suivies des quatre animations de mort.
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

## Prêtre Aseprite v4

`pretre/animations.json` décrit les 124 clips (1 280 poses) : repos, marche, taille, seconde taille, préparation de charge, charge, éventail, nova, éruption, garde, récupération, étourdissement, blessure, apparition, transformation et mort. Chaque action existe dans quatre directions et deux phases ; la transformation commence seulement en phase normale. Cellules 80 × 80, pieds en (40, 52). Le runtime utilise les deux atlas de phase, de moins de 5 121 pixels de haut, et limite le cache à 256 images.

Les frappes touchent à 550 ms et 670 ms, suivies de 250 ms d'activité et d'un retour complet. La charge démarre après 700 ms. La marche et la charge avancent selon la distance parcourue. La direction reste fixe pendant chaque action ; une parade annule le coup et déclenche l'étourdissement. La mort dure 1 900 ms et sa dernière pose reste affichée avant l'écran de victoire.

`pretre-sortileges.aseprite` contient 288 images sur trois calques, exportées en deux plans (`sortileges-arriere.png`, `sortileges-avant.png`), cellules 160 × 160, ancre (80, 96). L'éventail libère ses projectiles à 800 ms, la nova commence à 850 ms, l'éruption à 650 ms. Les cercles de dégâts suivent les rayons et l'aplatissement des images, et les trois éruptions se décalent d'une pose. Les tirs mobiles utilisent `projectiles.aseprite` : 64 images, huit angles et deux phases. Au lancement réel, ils remplacent les tirs dessinés dans les grands effets, pour éviter un doublon visuel.

`scripts/boss-runtime.js` contient le lecteur, les transitions et les zones des sorts. Après modification du runtime ou des exports : `npm run embed:boss`, puis `npm test`. `npm run preview:boss` compose un contrôle du véritable moteur dans `test-output/boss-in-game.png`. Le script d'intégration actualise aussi l'index des sprites et la copie iOS. L'archive Xcode allégée télécharge ce même jeu au premier lancement ; elle ne contient pas de copie des sprites. Aucun chargement réseau d'image n'est nécessaire dans le jeu.
