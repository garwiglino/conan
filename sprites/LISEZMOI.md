# Planches de casse

Une planche par objet cassable, 8 images de 64 × 64 pixels côte à côte :

| Image | Contenu |
|---|---|
| 0 | objet intact |
| 1 | objet fissuré (après un premier coup) |
| 2 à 6 | éclatement (65 ms par image dans le jeu) |
| 7 | débris restés au sol |

Le point d'ancrage au sol est en (32, 56) dans chaque image. Les fichiers `_x4` sont agrandis 4 fois pour les regarder.

Ces planches sont exportées depuis le jeu. Le jeu les dessine lui-même au lancement, pixel par pixel, à partir du code (`BRK` dans `index.html`).
