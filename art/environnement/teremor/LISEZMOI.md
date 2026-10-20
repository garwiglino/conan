# Sources Piskel du biome Teremor (forêt tempérée)

Ces fichiers `.piskel` sont la source des graphismes d'environnement du jeu. Copie de `art/environnement/teremor/` dans le dépôt (branche `claude/project-thread-4ve2og`).

Les mêmes éléments, exportés en PNG un par un, sont dans `png/` (catalogue dans `png/catalogue.json`). Le guide d'assemblage est dans `../LISEZMOI.md`.

## Retoucher un fichier

1. Ouvrir piskelapp.com, puis **Import > Browse .piskel files** et choisir le fichier.
2. Importer la palette `palette-teremor.gpl` (**Palettes > Import**) et peindre uniquement avec ces couleurs. Une couleur hors palette est ramenée à la plus proche au moment de la construction.
3. Garder la taille du cadre et le nom des calques (`couleur`, `hauteur`, `ombre`, `forme`).
4. Enregistrer le `.piskel` à la place de l'original dans `art/environnement/teremor/`, puis lancer `npm run build:environment` et `npm run kit:environment`.

## Contenu

- `sols/` : herbe, terre, pavés, eau, litière, berge, planches. Textures raccordables ; le calque gris `hauteur` sert aux mélanges entre matières.
- `pavages/` : pavés en rangs, dallage de grès, briques en chevrons, pavés en éventail. Cadre 1 pour les rues est-ouest, cadre 2 pour les rues nord-sud.
- `chemins/` : 16 pièces standard par jeu (droites, virages, T, croisement, impasses, placette), case de 2 m.
- `falaises/paroi.piskel` : face éclairée et face à l'ombre.
- `flore/` : arbres, buissons, rochers, fougères, champignons, fleurs ; une variante par cadre, ombre portée sur le calque `ombre`.
- `decors/` : petits décors posés sur l'herbe.
- `manifeste.json` : rôle de chaque fichier pour la construction.
