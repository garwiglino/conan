# Planches des personnages

Elles sont exportées depuis le jeu, qui dessine lui-même chaque image au lancement, à partir du code (`CharacterAtlas` dans `index.html`).

Conan est dessiné par le code dans le style des personnages de *Zelda: Oracle of Seasons* (Game Boy Color) : pixels doublés (1 pixel du dessin = 2 × 2 pixels de la case), gros contour noir, couleurs franches, crinière noire coupée au carré, peau bronzée, pagne et bottes de fourrure, épée à deux mains tenue en oblique devant lui. Tête et corps sont des grilles faites main ; bras, poings et épée sont posés par le code, l'épée suivant la même trajectoire que celle qui sert à toucher les ennemis. La planche fournie auparavant reste comme référence dans `conan_original_grand.png`.

- Il y a une planche PNG par personnage : Conan, squelette, serpent, cultiste (aussi utilisé pour le Veilleur), gardien, Zahra, et le Prêtre du serpent (normal et enragé).
- Chaque case fait 80 × 80 pixels, avec les pieds du personnage en (40, 52).
- Chaque ligne correspond à une animation dans une direction (haut, droite, bas, gauche). Chaque colonne est une image de l'animation, avec 6 images au plus.
- Chaque planche a son fichier JSON explicatif du même nom (`conan.json`, `squelette.json`…). On y trouve, animation par animation : le nom, la description, le nombre d'images, si l'animation tourne en boucle, la durée de chaque image quand elle est fixe, le rôle de chaque image (élan, frappe…) et, pour chaque direction, la ligne et le cadre [x, y, largeur, hauteur] de chaque image.
- Le fichier `index.json` regroupe les mêmes informations pour tous les personnages, ligne par ligne.
- Les fichiers `_apercu` sont agrandis 2 fois, avec le nom de chaque ligne écrit à gauche.

Les planches de casse des objets sont dans le dossier `sprites/`.
