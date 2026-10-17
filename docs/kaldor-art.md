# Kaldor v3 — barbare à cheveux longs, locomotion stable, épée dans le dos

Les sprites du joueur sont **entièrement construits en JavaScript** dans
`sprites/kaldor/kaldor-art.js`. Chaque dessin est un assemblage de pixels RGBA
opaques dans un cadre **80 × 80**, avec ancre des pieds **(40, 52)**, contour
sombre et éclairage supérieur gauche, cohérent avec les personnages batraciens.

## Personnage et animations

- Kaldor conserve son apparence humaine adulte, sa peau bronzée, ses tenues de
  cuir et sa grosse épée à deux mains. Sa chevelure noire descend désormais sur
  les épaules et les omoplates, avec des mèches et des reflets distincts selon
  les directions : dos (0), droite (1), face (2), gauche (3).
- **Locomotion :** six positions de jambes avec pas alternés et genoux fléchis,
  bras en contre-mouvement lorsque la lame est rangée. La tête reste fixe par
  rapport au sol pendant la marche, tandis que les extrémités des cheveux
  suivent une petite inertie ; les pieds conservent leur ancrage moteur.
- **Attaques :** quatre combos avec six poses chacun, mêmes trajectoires
  dessinées, interpolation de smear entre les poses et les deux mains à la
  garde. Aucun changement des durées `COMBO_TIMES`, de la pause d'impact, du
  dash, du verrouillage, des parades et de l'enchaînement des coups.
- **Lame raccourcie** d'environ 7,3 % par rapport au rendu précédent : facteur
  partagé `1.02` au lieu de `1.10` dans la fonction moteur `swordPose()` ; le
  balayage physique `bladeHits()` et la projection des smears restent alignés.

## Rengainage automatique dans le dos

Le lecteur du héros suit un **état visuel éphémère** `kaldorWeapon` utilisant
le temps simulé du jeu, sans modifier les sauvegardes ni retarder les attaques :

1. Après **3,7 s sans nouvelle attaque ni posture de garde**, l'épée commence
   une transition de **0,33 s** vers le dos.
2. Si le héros est en mouvement, sa marche conserve sa propre phase ; les six
   étapes de rangement sont croisées avec les six images de marche (36 variantes
   mises en cache), sans arrêter ni glisser les pieds.
3. À l'arrêt, l'épée reste en diagonale dans un fourreau dans le dos et les
   mains retombent au repos ; en mouvement, les bras balancent naturellement.
4. Une attaque, y compris pendant le rangement, remet **immédiatement** l'épée
   en main sans toucher aux délais de combo. La garde la dégaine visuellement
   en 0,21 s ; le mécanisme défensif existant n'est pas retardé.
5. Les blessures, interactions, saisies et situations où le héros est jeté
   conservent la priorité de leur animation. Le timer repart après une attaque.

Le dessin de l'épée au dos et son fourreau sont faits en pixels JavaScript. Aucun
atlas PNG pré-calculé n'est nécessaire au fonctionnement du jeu ; des captures
sont fournies seulement pour vérification graphique.

## Construction, isolation et tests

```sh
npm install
npm run build:batraciens
npm run build:kaldor
node --test --test-concurrency=2 tests/*.test.cjs
npm run package:ios
```

Le constructeur Kaldor est idempotent et remplace uniquement le bloc de code
`// BEGIN KALDOR JAVASCRIPT PIXEL ART` du HTML web, plus la sélection du type
visuel `hero` dans `CharacterAtlas`. Les copies HTML web et iOS sont
synchronisées. La source du moteur d'attaque reste inchangée, à l'exception du
facteur d'échelle commun de l'épée. Aucune population, quête, faction ni
apparence des autres PNJ n'est changée.

L'atelier `art/kaldor-preview.html` donne accès aux quatre vues, aux poses
individuelles, aux combos et à une démonstration du rangement debout/en marche.
Les tests automatisés assurent le rendu, l'absence de rognage, le maintien des
timings, les smears, le rengainage, la sauvegarde et la construction répétable.
**Aucun test sur iPhone physique n'a été effectué.**
