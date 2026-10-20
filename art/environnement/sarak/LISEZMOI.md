# Sources Piskel du biome Sarak (désert)

Ces fichiers `.piskel` sont la source des graphismes du désert : les biomes désertiques de l'atlas et la zone de départ (Campement des Exilés). Même direction artistique que Teremor (même grille, même lumière venant du haut à gauche, mêmes ombres portées), avec la palette chaude du désert.

## Retoucher un fichier

1. Ouvrir piskelapp.com, puis **Import > Browse .piskel files** et choisir le fichier.
2. Importer la palette `palette-sarak.gpl` (**Palettes > Import**) et peindre uniquement avec ces couleurs. Une couleur hors palette est ramenée à la plus proche au moment de la construction.
3. Garder la taille du cadre et le nom des calques (`couleur`, `hauteur`, `ombre`, `forme`).
4. Enregistrer le `.piskel` à la place de l'original dans `art/environnement/sarak/`, puis lancer `npm run build:environment` et `node scripts/embed-world-isometric.cjs` pour la version iOS.

## Contenu

- `sols/` : sable ridé, piste de terre battue craquelée, pavés de grès, eau d'oasis, éboulis, berge, planches. Textures raccordables ; le calque gris `hauteur` sert aux mélanges entre matières.
- `pavages/` : pavés de grès en rangs, dalles de pisé, tomettes hexagonales de terre cuite, carreaux crème à cabochons turquoise. Cadre 1 pour les rues est-ouest, cadre 2 pour les rues nord-sud.
- `chemins/` : 16 pièces standard par jeu (piste, pavé, oued), case de 2 m.
- `falaises/paroi.piskel` : grès en strates, face éclairée et face à l'ombre.
- `flore/` : palmiers, arbres morts, buissons, touffes d'alfa, rochers, cheminée de fée, éboulis, cailloux ; une variante par cadre, ombre portée sur le calque `ombre`.
- `decors/` : petits décors posés sur le sable (cailloux, brindilles, plantes grasses, traces de lézard, croûte de sel, fleur du désert).
- `manifeste.json` : rôle de chaque fichier pour la construction, couleurs d'accent (rebord des falaises, écume, tablier des ponts) et grandes plages du sol.
