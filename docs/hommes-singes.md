# Homme-singe — transcription du concept validé

Auteur : Codex / ChatGPT. Concept visuel validé par l’utilisateur le 18 octobre 2026 ; référence conservée dans `art/hommes-singes/concept-valide.png`.

## Source et fidélité

Le module `sprites/hommes-singes/homme-singe.js` remplace la proposition JavaScript précédente. Ses quatre dessins indépendants se trouvent dans `SOURCE_VIEWS` : face et dos 21×26 pixels, profils 17×26 pixels. Le volume de la tête, les oreilles latérales, les sourcils, le museau, les épaules, les mains, les pieds et le pagne suivent le concept approuvé. Les nuances sont regroupées en treize couleurs et les détails sous-pixel du nez et de la bouche sont adaptés à la grille native. Le rendu est une transcription en pixels du concept illustré, pas le chargement de son PNG.

Le dessin tient dans une cellule native 48×48, pieds sur la ligne y36 et ancre (24,36). Le format moteur ajoute exactement (16,16), produisant une cellule 80×80 avec ancre (40,52). La silhouette est plus haute que le batracien de référence : 26 pixels, conformément aux proportions du concept validé. Aucun redimensionnement fractionnaire.

## Animation par membres

Les pixels sources sont répartis en tête, tronc, bras gauche, bras droit, pagne et deux jambes. Un raccord de cou supplémentaire est masqué sous les membres pendant la respiration. Le repos initial conserve exactement les pixels de chaque grille canonique. Les épaules restent fixes pendant la déformation des bras jusqu’aux poignets ; les jambes alternent et leur raccord est maintenu sous le pagne. Les pieds gardent une référence au sol, sans déplacement automatique de l’acteur.

Les cycles reprennent les rythmes des PNJ humains : repos 4 poses, marche 8 poses, course 8 poses et parole 4 poses. Marche/course peuvent être indexées par distance (24/32 pixels par cycle). Le moteur conserve la propriété du déplacement.

## Utilisation

Le module expose `draw(ctx, {action, dir, frame, x, y, layer, format})`, `frameAt(action, seconds, distance)`, `renderLayers`, `PALETTE`, `SOURCE_VIEWS` et `CLIPS`, en CommonJS et via `HearthreaverApe` dans le navigateur. `format: 'engine'` applique la translation vers le moteur ; le format par défaut est natif. Directions numériques compatibles : 0 dos, 1 droite, 2 face, 3 gauche.

`node scripts/preview-homme-singe.cjs` reconstruit les planches natives et l’atelier autonome `art/hommes-singes/preview.html`. Celui-ci contient le concept validé, la comparaison à échelle égale avec les vrais humains et batraciens du dépôt, les quatre vues animées, une pause, une avance image par image, le réglage de vitesse et l’isolation des calques. La course du batracien y utilise sa marche de référence.

## Vérifications et périmètre

`node --test tests/homme-singe.test.cjs` : quatre tests réussis, couvrant les 96 poses, la connexion des pixels, l’alpha binaire, les appuis, les boucles, la translation native/moteur et la conservation exacte des quatre grilles au repos. Atelier contrôlé dans Chromium : quatre animations, quatre vues, pause, pas à pas et isolation des calques.

Aucun PNG embarqué dans le module de personnage, aucun miroir ni rotation d’image, aucun remplacement des PNJ approuvés. Les costumes de métiers, le combat, les factions et les apparitions en jeu restent à réaliser ultérieurement. La bible de production définit maintenant son implantation : [communautés et intérêts](world-bible/06-hommes-singes.md) et [programme de fabrication](world-bible/generated/ape-activities.md). Cela n’active pas encore de nouveaux acteurs.

## Appuis et balancement de tête

Révision après validation du rendu JavaScript : la tête suit un décalage vertical indépendant d’un pixel, répété à chaque demi-foulée, avec raccord de cou couvert. Les phases de lever des pieds ont été inversées : le pied posé pousse vers l’arrière par rapport à la direction regardée, puis revient vers l’avant en l’air. Les bras balancent en opposition aux jambes. Les dessins et la pose de repos canonique restent inchangés. Un cinquième test vérifie ce sens d’appui sur les deux profils, en marche et en course, ainsi que le mouvement indépendant de la tête.

## Teintes et base féminine

Cinq teintes naturelles (`brun`, `ebene`, `cendre`, `roux`, `sable`) sont disponibles pour les deux bases. Le matériau est stocké avec les pixels : fourrure, peau nue et cuir. Les palettes de peau et de pelage évoluent ensemble, tandis que le cuir et le contour restent stables. `paletteFor(tone)` retourne une palette réutilisable et mise en cache.

`draw(ctx, {sex:'female', tone:'cendre', action:'walk', dir:'face', frame:0})` affiche la base féminine. Elle possède une couronne arrondie, un sourcil adouci, des épaules resserrées de face/dos et un bandeau de poitrine simple ; le museau, les grandes oreilles, les mains et les pieds restent ceux de la même espèce. Pas de maquillage ou de couleur imposée par le sexe. Le rig, les durées, la foulée et les ancrages sont identiques.

`appearanceFor(id, {sex, tone})` peut produire une apparence stable depuis l’identifiant d’un PNJ, avec dérogations explicites. Cette fonction prépare l’intégration ; aucune population en jeu n’est encore ajoutée.

`node scripts/preview-homme-singe-variants.cjs` génère la planche des dix combinaisons. L’atelier complet permet de changer corps et pelage pendant toutes les animations. Sept tests réussis, avec les 192 poses des deux bases, les dix rendus distincts, les matériaux et la stabilité des apparences. Les sélecteurs des dix combinaisons ont aussi été vérifiés dans le navigateur.
