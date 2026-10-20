# Architecture humaine — reprise des concepts PNG en trois quarts

Ce lot est **un dossier de concepts à valider**, redessiné à partir des PNG
originaux. Il remplace la reconstruction automatique rejetée comme base de
travail artistique. Il ne contient aucune nouvelle conversion des bâtiments en
sprites JavaScript et n’active aucune ressource dans le jeu.

[Galerie de comparaison](../art/architecture-concepts-34/index.html) ·
[Inventaire des références et des redessins](../art/architecture-concepts-34/manifest.json).

Les **45 planches** couvrent les **234 références existantes** : 106 bâtiments,
8 variantes hivernales et 120 modules. Les familles graphiques restent Teremor,
Sylverive dans Teremor, Igea, Sarak, Varan et Tagon ; les bâtiments de fonction
commune restent identifiés séparément. Chaque référence conserve son identifiant.
Les quatre orientations des bâtiments et les deux orientations/états des pièces
restent présentés sur leurs planches, avec le nouveau volume trois quarts.

La référence principale de chaque génération est son propre PNG original :
silhouette, matériaux, couverture, ouvertures, annexes, accès, type d’habitat ou
fonction. La référence secondaire commune guide seulement la caméra et la finition
pixel art. Les variantes hivernales partent également de leur nouvelle planche
d’été afin de préserver la géométrie et les accès, avec ajout de neige saisonnière.
Aucun drapeau ni bannière.

Les PNG sont des dessins de conception agrandis. **L’humain de 19 pixels et les
mesures annotées restent des cibles natives** : ce ne sont pas encore des grilles
de sprites prouvées pixel pour pixel. L’échelle finale, les raccords, les
ancrages, les collisions et les calques runtime seront construits après validation
des dessins. Une comparaison visuelle ne garantit pas à elle seule la cohérence
métrique de toutes les orientations.

## Fichiers

- `art/architecture-concepts-34/*.png` : 45 nouveaux concepts.
- `references/01.png` à `references/45.png` dans le même dossier : copies exactes
  des références originales, conservées pour comparaison.
- `manifest.json` : inventaire, correspondance original/redessin, empreintes SHA-256,
  dimensions des images et état « À valider ».
- `generation/*.json` : provenance des fichiers générés et de leurs références.
- Trois archives PNG regroupent les planches 1–15, 16–30 et 31–45 ; chaque archive
  contient les dessins, son inventaire et une note de statut. Aucun renderer.
- `index.html` : galerie des PNG, filtres régionaux/types et comparaison avec les
  originaux. Ses repères et remarques personnels restent dans le navigateur ; leur
  export ne déclenche ni conversion ni intégration.

`scripts/build-architecture-concepts-review.py` construit uniquement la galerie
et les archives. Il vérifie la présence des 45 PNG, les 234 identifiants sans
omission ni doublon et l’intégrité des références originales. Il ne fabrique pas
les dessins et ne compile aucune donnée de sprite.

## Étape suivante

Attendre la validation artistique explicite de l’utilisateur. Les remarques peuvent
citer un numéro de planche et un identifiant de modèle. Corriger les PNG concernés
avant toute nouvelle transcription JavaScript. Les anciens rendus JavaScript
restent des archives du travail précédent, pas des dessins validés de ce lot.
