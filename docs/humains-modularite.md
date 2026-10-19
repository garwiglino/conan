# Vêtements modulaires et animations humaines

Les 152 animations partagent désormais l’articulation des **pièces natives**. Les bras peints en tubes, les points de peau ajoutés sur les gants, les pantalons et bottes génériques des poses assises ont été retirés.

## Pièces et proportions

`sprites/humains/modularite.js` lit les calques des tenues existantes : manches, bras nus, mains, gants, jambes, chaussures, tunique et pans. Les mêmes pixels conservent leurs couleurs, leurs bordures et leurs détails. Les mailles restent des mailles, les moufles restent des moufles, et les sandales ne deviennent pas des bottes.

Les points d’épaule, de coude et de main sont déduits de chaque vue native. La portée est celle du membre source : environ 2 à 3 pixels entre épaule et centre de la main. Les pièces sont déplacées et tournées sur la grille, à l’échelle 1, sans étirer leur longueur ou leur largeur et sans tracer un nouveau contour de bras. La rastérisation reste à alpha binaire.

Une vue de profil ne contient qu’un bras visible : le bras éloigné reprend la vue opposée, réfléchie. Les équipements asymétriques gardent ainsi les pixels de leur propre côté. Les masques de cheveux, coiffes et les plans avant/arrière restent indépendants.

Les jambes assises ou montées utilisent les vrais calques de jambes et de chaussures. Les pans de robe et de jupe suivent le bassin. Les coordonnées approuvées du cavalier, ses jambes courtes et les plans du cheval sont conservés. Le cheval n’a pas été redessiné.

## Contacts et objets

Une cible éloignée ne rallonge plus le bras. Le geste reste dans sa portée native. Pour travailler à un poste, un petit mouvement du buste peut accompagner le contact, sans déplacer le socket ni les pieds. La main peut saisir un outil à différents endroits de son manche : l’outil garde sa longueur totale. Le visage occulte les outils de travail qui passent derrière lui ; les gestes intentionnels vers la bouche sont conservés.

Les postes, les animaux et le terrain restent des entités séparées. Seuls les objets manipulés suivent les mains. Les restrictions de fonction, de corps et de saison restent inchangées.

## Composer les vêtements

La tenue complète demeure l’option `outfit`. L’option facultative `parts` remplace seulement les pièces sélectionnées :

```js
const A = require('../sprites/humains/activites');
const image = A.raster({
  role: 'smith', sex: 'masculin', action: 'forge', frame: 3,
  outfit: 'T01-masculin',
  parts: {
    sleeves: 'kaldor:cotte-mailles',
    gloves: 'N04-masculin',
    feet: 'kaldor:robe-serpent'
  }
});
```

| Clé | Pièce |
|---|---|
| `feet` | Chaussures |
| `legs` | Pantalon, jambes ou jupe |
| `tunic` | Chemise ou tunique |
| `outer` | Gilet, tablier ou pans |
| `belt` | Ceinture |
| `pouch` | Poche ou éléments du calque 16 |
| `sleeves` | Manches |
| `gloves` | Gants ou mains du calque 17 |
| `collar` | Col et épaules |
| `cape` | Cape |

Omettre une clé conserve sa pièce d’origine. `null` retire la pièce : l’anatomie nécessaire provient alors des calques natifs du même corps, pas d’un dessin de remplacement. Une pièce absente de la tenue donneuse ou destinée à l’autre corps est refusée. Les pièces explicitement sélectionnées ne sont pas recouvertes par les détails génériques de métier ou les substitutions automatiques de livrée.

`A.Modularity.optionsFor(sex, slot)` donne les sources disponibles. `metadata.parts` décrit la composition choisie ; `metadata.limbSource` vaut `native_garment_pixels`. Dans l’atelier, ouvrir **Coiffure et variantes → Pièces du vêtement** pour essayer les combinaisons pendant une animation.

## Ajouter une tenue

Aucune série d’animations propre à chaque vêtement n’est nécessaire. Une nouvelle tenue doit respecter le contrat existant : quatre vues, cellule de 80 × 80, ancrage des pieds `(40, 52)`, proportions humaines natives et noms de calques `HABIT 10…19/23` ou `ANATOMIE`. Les membres doivent exister dans les calques correspondants. Les tenues qui changeraient le squelette ou ces proportions nécessiteraient un autre contrat de rig.

Les sources ne sont jamais modifiées : les assemblages et profils articulés sont des compositions temporaires mises en cache. En navigateur, charger `modularite.js` après `rig.js` et avant `activites.js`.

## Contrôles

`npm run test:humans` comprend les régressions d’activités, de postes, d’hiver et de modularité. `npm run test:human-modularity` cible les contrôles des vêtements :

- restitution exacte des bras natifs dans leur pose source, matériaux et portée vérifiés ;
- pantalons, robes, bottes, fourrure, sandales et jambes nues dans les poses assises/montées ;
- chaque pièce donneuse testée séparément, ainsi que son retrait ;
- **202 948 images**, soit **6 856 combinaisons autorisées tenue–activité**, couvrant les 59 tenues, les 152 clips, leurs quatre directions et toutes leurs images ;
- sockets, contacts et occultation avec des pièces mélangées ;
- contrôles dans le navigateur des sélecteurs et de la lecture des gestes.

`node scripts/render-human-modularity.cjs` produit la planche `art/humains/activites/modularite.png`. Les contrôles automatiques portent sur le rendu, les matériaux et la géométrie ; ils ne remplacent pas une revue artistique de chaque image.

## Couvre-chefs, cheveux et pilosité

Les coiffes et casques reprennent le même déplacement et la même rotation que la tête, y compris pendant le contact au poste, le sommeil, la chute et les transitions en selle. Les masques natifs cachent les cheveux ; leurs calques d’édition restent invisibles. Retirer la coiffe restitue les cheveux d’origine sans modifier les sources.

Les 55 coiffes et casques sont contrôlés sur **336 820 images** : tous les clips autorisés pour chaque corps, toutes les directions et toutes les images, avec variation d’âge, coiffure et pilosité. Les 19 coiffures natives et les 11 variantes de barbe/moustache ajoutent **14 960 contrôles** de masques et de réversibilité. Des vérifications spécifiques mélangent vêtements, coiffes et postes fixes, ainsi que les poses montées.

`npm run test:human-headgear` cible ces cinq tests. `node scripts/render-human-headgear.cjs` produit la planche `couvre-chefs.png`. La vérification complète `npm run test:humans` comprend 36 tests et peut prendre quelques minutes.

La rotation des personnages couchés calcule ses limites depuis les pièces présentes : les crêtes hautes de casque sont conservées en entier, au lieu d’être coupées par une fenêtre fixe. Un test compare le nombre de pixels de chaque coiffe avant/après rotation à 90°.
