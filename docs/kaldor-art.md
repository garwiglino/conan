# Kaldor — art pixel JavaScript v2

## Objectif

Refonte strictement graphique du héros humain barbare, dans la direction artistique
validée pour les batraciens, sans changer son identité ni la logique du combat.
Le personnage conserve cheveux sombres, peau bronzée, musculature, pagne, bracelets,
bottes et épée à deux mains.

## Contrat technique

- Case moteur **80 × 80** pixels, ancre des pieds **(40,52)**, pixels natifs.
- Quatre vues **indépendamment dessinées** (dos / droite / face / gauche), lumière **haut-gauche**.
- Repos (4 poses), marche (6), garde (6), dash (4), blessure (4), usage (6), mêlée (6).
- **Quatre combos × six poses × quatre vues**, avec des smears de trajectoire
  exactement associés aux frames 2–3 du moteur, y compris l'attaque lourde verticale.
- Tête, jambes, torse et bras animés séparément et connectés à la poignée.
- Palette sombre limitée, silhouettes et ombrages proches du reste des personnages.

## Garanties sur le moteur

`sprites/kaldor/kaldor-art.js` n'altère **ni** `swordPose()`,
`COMBO_TIMES`, `bladeHits()`, la parade, le dash, les collisions ou les dégâts.
Le dessin utilise `swordPose()` **du moteur** et son repère au sol, ce qui évite
une épée visuelle totalement différente du volume de frappe. L'ancien
`oracleHero` reste dans la source pour comparaison / retour arrière.

Le constructeur `scripts/embed-kaldor.cjs` intègre la nouvelle illustration
dans `index.html` et `ios/Hearthreaver/Game/index.html`. Il crée aussi
`art/kaldor-preview.html` pour inspecter toutes les directions et actions.
`npm run build:batraciens` reconstruit cet art en dernier ; le même constructeur
peut être appelé isolément avec `npm run build:kaldor`.

Aucun fichier PNG externe n'est nécessaire pour le rendu du héros.
Les tests `tests/kaldor-art.test.cjs` comparent le Canvas au tampon RGBA et
vérifient la fidélité des durées/poses, l'enveloppe et les quatre combos.

L'assemblage iOS ne constitue pas une validation sur iPhone physique.
