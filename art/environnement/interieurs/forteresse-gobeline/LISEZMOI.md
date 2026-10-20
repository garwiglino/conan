# Sources Piskel de l'intérieur « Forteresse gobeline »

Ces fichiers `.piskel` sont la source des graphismes du donjon de la forteresse gobeline : pierre sombre, torches, portes, herses, escaliers, piliers, ruines, mobilier et objets gobelins. La grille et la lumière sont celles des biomes (même projection, lumière venant du haut à gauche). Un intérieur est un espace fermé : tout ce qui n'est pas une case de salle reste noir.

Les mêmes pièces, exportées en PNG une par une, sont dans `png/` (catalogue dans `png/catalogue.json`). Les règles d'assemblage sont dans `../../LISEZMOI.md`, section « Intérieurs ». Les planches `../../guide/salle-forteresse-gobeline.png` et `../../guide/pieces-forteresse-gobeline.png` montrent une salle type et toutes les pièces.

## Retoucher un fichier

1. Ouvrir piskelapp.com, puis **Import > Browse .piskel files** et choisir le fichier.
2. Importer la palette `palette-forteresse-gobeline.gpl` (**Palettes > Import**) et peindre uniquement avec ces couleurs. Une couleur hors palette est ramenée à la plus proche au moment de l'export.
3. Garder la taille du cadre, l'ordre des cadres et le nom des calques (`couleur`, `ombre`, `lueur`, `hauteur`). L'ancre de chaque fichier est dans `manifeste.json` : c'est le point du cadre posé sur le sommet de case (ou le pied de l'objet).
4. Enregistrer le `.piskel` à la place de l'original, puis lancer `npm run kit:environment` et `npm run test:environment`.

## Contenu

- `sols/` : dalles en rangs inégaux (salles), pavés (couloirs), terre battue (galeries creusées), plancher (quartiers gobelins). Ce sont des textures raccordables en coordonnées écran. Le calque gris `hauteur` sert aux mélanges entre deux sols.
- `murs/nord.piskel`, `murs/ouest.piskel` : modules de grand mur de 2 m, un par cadre.
  - Murs pleins : `mur-a`, `mur-b` (mousse), `mur-c` (fissure, pierre manquante).
  - Murs abîmés : `mur-ruine`, `mur-breche`.
  - Ouvertures sur le dehors : `meurtriere`, `fenetre` (clair de lune au sol).
  - Décor accroché : `baniere`, `chaines`.
- `murs/torche-nord.piskel`, `murs/torche-ouest.piskel` : torche murale, 4 images à 8 images/s.
- `portes/nord.piskel`, `portes/ouest.piskel` : `arche`, `porte`, `porte-ouverte`, `porte-verrouillee`, `herse`, `herse-levee`, `escalier-montant`.
- `murets/sud.piskel`, `murets/est.piskel` : murets arasés du devant de la salle (`muret`, `muret-debut`, `muret-casse`).
- `angles/angles.piskel` : `angle-nord`, `bout-nord`, `bout-ouest`, `angle-sud`.
- `escaliers/descendant.piskel` : trémie d'escalier qui descend vers le nord ou vers l'ouest.
- `objets/` :
  - `piliers` : carré, rond, brisé ;
  - `ruines` : éboulis, blocs ;
  - `mobilier` : caisses, tonneau, coffres (fermé, verrouillé, ouvert), table, râtelier, paillasse ;
  - `gobelins` : totem, étendard, cage, marmite, trésor ;
  - `brasero` : animé, 4 images.
- `decors/decors-sol.piskel` : fissure, flaque, os, crâne, paille, mousse, tache, gravats, grille, traces. `decors/toile.piskel` : toile d'araignée du coin nord.
- `manifeste.json` : rôle, orientation, ancre et cadres de chaque fichier, dimensions de la grille.

Les calques `ombre` et `lueur` ont l'opacité à utiliser en jeu (0,5 pour l'ombre ; 0,35 pour le feu, 0,3 pour la lune). Ils se peignent sur le sol seulement.
