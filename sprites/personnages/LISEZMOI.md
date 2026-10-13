# Planches des personnages

Elles sont exportées depuis le jeu, qui dessine lui-même chaque image au lancement, à partir du code (`CharacterAtlas` dans `index.html`).

**Exception : `conan.png` est la planche fournie pour le joueur, réduite à 75 %** pour avoir la taille des autres personnages (environ 32 px de haut). L'original pleine taille est dans `conan_original_grand.png`. Le jeu utilise directement `conan.png`, avec la même disposition et les mêmes ancrages : pieds au bas de la case (ligne 51), centrés en x = 40. Le dessin par le code ne sert plus que de secours tant que l'image n'est pas chargée.

- Il y a une planche PNG par personnage : Conan, squelette, serpent, cultiste (aussi utilisé pour le Veilleur), gardien, Zahra, et le Prêtre du serpent (normal et enragé).
- Chaque case fait 80 × 80 pixels, avec les pieds du personnage en (40, 52).
- Chaque ligne correspond à une animation dans une direction (haut, droite, bas, gauche). Chaque colonne est une image de l'animation, avec 6 images au plus.
- Chaque planche a son fichier JSON explicatif du même nom (`conan.json`, `squelette.json`…). On y trouve, animation par animation : le nom, la description, le nombre d'images, si l'animation tourne en boucle, la durée de chaque image quand elle est fixe, le rôle de chaque image (élan, frappe…) et, pour chaque direction, la ligne et le cadre [x, y, largeur, hauteur] de chaque image.
- Le fichier `index.json` regroupe les mêmes informations pour tous les personnages, ligne par ligne.
- Les fichiers `_apercu` sont agrandis 2 fois, avec le nom de chaque ligne écrit à gauche.

Les planches de casse des objets sont dans le dossier `sprites/`.
