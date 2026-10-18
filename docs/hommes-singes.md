# Hommes-singes — base graphique à valider

Auteur : Codex / ChatGPT. Dessins originaux créés depuis zéro à la demande de l’utilisateur. Les propositions précédentes ne sont pas des sources de pixels ou des bases de construction de ce module.

## Références et périmètre

Les contrats des sprites batraciens et du rig humain sont les références : cellule native 48×48 avec pieds à (24,36), moteur 80×80 avec ancre (40,52), pixels entiers opaques, contour sombre et lumière supérieure gauche. Les quatre vues sont dessinées séparément, sans miroir. La silhouette possède une petite crête de fourrure, un museau court, des joues nues, un tronc large, des bras plus longs et des jambes compactes. Un pagne simple permet de valider le corps avant les vêtements liés aux activités.

La bible démographique actuelle ne définit pas cette espèce ; cette proposition n’ajoute donc pas de faction, de ville, de population ou de règle de climat au monde. Aucun remplacement des humains ou des batraciens approuvés.

## Calques et animation

Huit pièces : jambe gauche, jambe droite, tronc, bras gauche, bras droit, pagne, tête et cou de raccord. L’ordre de profondeur dépend de la direction. Chaque bras conserve une épaule fixe et une déformation progressive jusqu’au poignet. Le tronc et la tête suivent le rythme sans déplacement automatique de l’acteur. Un pied garde contact avec le sol pendant la marche. Le cou couvre les changements de respiration.

Les rythmes reprennent les PNJ humains : repos 4 poses (450/220/350/260 ms), marche 8 poses (~95 ms), course 8 poses (~70 ms), parole 4 poses. Marche/course peuvent être indexées par distance (foulées de 24/32 pixels) ; le jeu conserve la propriété du déplacement. Pas de rotations lissées ou de pixels semi-transparents.

## Fichiers et atelier

- `sprites/hommes-singes/homme-singe.js` : module autonome navigateur/CommonJS, grilles, palettes, poses, rendu par calque, `frameAt` et translation native/moteur.
- `art/hommes-singes/preview.html` : atelier autonome ; animations, quatre vues, pause, image par image, vitesse et isolation des calques. Comparaison avec les vrais sprites humains et batraciens du dépôt.
- `scripts/preview-homme-singe.cjs` : reconstruit l’atelier, les planches natives et l’aperçu.
- `tests/homme-singe.test.cjs` : toutes les poses, pixels entiers et connectés, alpha binaire, pied posé, boucle et correspondance exacte native/moteur.

La comparaison du batracien utilise sa marche pour illustrer la course ; ce n’est pas une nouvelle animation batracienne.

Statut : proposition visuelle à valider avant costumes, métiers, combat et intégration aux populations. Tests automatisés : 3 réussis sur 96 poses ; atelier vérifié dans Chromium (4 animations × 4 vues, pause, pas à pas et calques).
