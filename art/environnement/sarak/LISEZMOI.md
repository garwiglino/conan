# Sources Piskel du biome Sarak (désert)

Ces fichiers `.piskel` sont la source des graphismes du désert : les biomes désertiques de l'atlas et la zone de départ (Campement des Exilés). Même grille, même lumière venant du haut à gauche et même rendu que la forteresse gobeline (matière grenée et tramée, ombres propres, contour sombre sur la flore), avec la palette chaude du désert.

Les mêmes éléments, exportés en PNG un par un, sont dans `png/` (catalogue dans `png/catalogue.json`). Le guide d'assemblage est dans `../LISEZMOI.md`.

## Retoucher un fichier

1. Ouvrir piskelapp.com, puis **Import > Browse .piskel files** et choisir le fichier.
2. Importer la palette `palette-sarak.gpl` (**Palettes > Import**) et peindre uniquement avec ces couleurs. Une couleur hors palette est ramenée à la plus proche au moment de la construction.
3. Garder la taille du cadre et le nom des calques (`couleur`, `hauteur`, `ombre`, `forme`).
4. Enregistrer le `.piskel` à la place de l'original dans `art/environnement/sarak/`, puis lancer `npm run build:environment` et `npm run kit:environment`.

## Contenu

- `sols/` : sable ridé, piste de terre battue craquelée, pavés de grès, eau d’oasis turquoise, éboulis de grès rouge, berge mouillée, planches blanchies. Textures raccordables ; le calque gris `hauteur` sert aux mélanges entre matières.
- `pavages/` : pavés de grès en rangs, dalles de terre battue fêlées, tomettes hexagonales de terre cuite, carreaux crème à cabochons turquoise. Cadre 1 pour les rues est-ouest, cadre 2 pour les rues nord-sud.
- `chemins/` : 16 pièces standard par jeu (piste, pavé, oued), case de 2 m.
- `falaises/paroi.piskel` : grès en strates, face éclairée et face à l'ombre.
- `flore/` : palmiers, arbres morts, buissons, touffes d'alfa, rochers, cheminée de fée, éboulis, cailloux ; une variante par cadre, ombre portée sur le calque `ombre`.
- `decors/` : petits décors posés sur le sable (cailloux, brindilles, plantes grasses, traces de lézard, croûte de sel, fleur du désert).
- `manifeste.json` : rôle de chaque fichier pour la construction, rampes de la palette, couleurs d’accent (rebord des falaises, écume, tablier des ponts) et grandes plages du sol.
