# Sources Piskel du biome Varan (marais)

Ces fichiers `.piskel` sont la source des graphismes du marais : le biome 12 de l'atlas. Même grille, même lumière venant du haut à gauche et même rendu que la forteresse gobeline et les autres biomes, avec la palette froide et humide du marais (joncs olive, vase, eau verte, tourbe).

Les mêmes éléments, exportés en PNG un par un, sont dans `png/` (catalogue dans `png/catalogue.json`). Le guide d'assemblage est dans `../LISEZMOI.md`.

## Retoucher un fichier

1. Ouvrir piskelapp.com, puis **Import > Browse .piskel files** et choisir le fichier.
2. Importer la palette `palette-varan.gpl` (**Palettes > Import**) et peindre uniquement avec ces couleurs. Une couleur hors palette est ramenée à la plus proche au moment de la construction.
3. Garder la taille du cadre et le nom des calques (`couleur`, `hauteur`, `ombre`, `forme`).
4. Enregistrer le `.piskel` à la place de l'original dans `art/environnement/varan/`, puis lancer `npm run build:environment` et `npm run kit:environment`.

## Contenu

- `sols/` : jonchaie (herbes du marais en mottes), vase, galets, eau du marais avec lentilles et nénuphars, tourbe, berge, planches. Textures raccordables ; le calque gris `hauteur` sert aux mélanges entre matières.
- `pavages/` : caillebotis, rondins, dalles moussues. Cadre 1 pour les rues est-ouest, cadre 2 pour les rues nord-sud.
- `chemins/` : 16 pièces standard par jeu (vase, galets, chenal), case de 2 m.
- `falaises/paroi.piskel` : talus de tourbe et de vase en strates, racines pendantes, face éclairée et face à l'ombre.
- `flore/` : cyprès chauves à mousse pendante, saules pleureurs, chicot, souche, roseaux, massettes, fougère, champignons, rochers moussus ; une variante par cadre, ombre portée sur le calque `ombre`.
- `decors/` : petits décors posés sur le sol (flaques, iris, salicaires, mousse, brindilles, roseau couché, plume de héron, champignons, os).
- `manifeste.json` : rôle de chaque fichier pour la construction, rampes de la palette, couleurs d'accent (rebord des talus, écume, tablier des ponts) et grandes plages du sol.
