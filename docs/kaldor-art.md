# Kaldor v4 — vrai personnage humain modulaire, épée et attaques refaites

**Rendu courant :** le joueur utilise désormais les mêmes morceaux de personnage
que les PNJ humains (atlas **Aseprite Lua**, et non une imitation JavaScript du
corps). L’assemblage passe directement par `CIVILIAN_BITMAPS.get()` de
`scripts/civilian-art.js` : corps et mains du costume `E01-masculin-terre`
(*Pagne noué*), tête `masculin-adulte`, cheveux hirsutes
`masculin-hair-14` dans leurs **trois plans de profondeur**, teinte `brun`,
sans barbe ni moustache. Le baudrier (une sangle de cuir sur le torse de
4 px), l'épée, son fourreau et les mains sur la poignée sont la seule couche
propre à Kaldor ; rien ne recouvre les yeux, le nez ni la bouche de la tête PNJ.

- **Résolution réelle :** tuile humaine 48×48, affichée par le moteur dans la
  case 80×80, pieds (40,52). Aucun format artificiel 60×68.
- **Idle / walk :** reprise des clips du vrai atlas humain, soit 4 poses
  au repos et **8 poses de marche** par direction (0 dos, 1 droite,
  2 face, 3 gauche). La marche progresse selon les pixels réellement
  parcourus ; collisions et immobilité ne font pas avancer les jambes.
  Les pas de profil de l'atlas humain (`walk`, `flee`) sont rangés à
  l'envers (contact, levé, passage, appui : joués dans l'ordre, le pied posé
  glisse vers l'avant et le héros recule). Pour les vues 1 et 3, Kaldor les
  lit donc dans l'ordre 0, 7, 6 … 1 ; face et dos gardent l'ordre de l'atlas.
- **Épée :** grande épée à l'échelle du corps humain (lame de 11 px sur
  deux rangs, garde dorée de 5 px, poignée de cuir et pommeau : 16 px de la
  pointe au pommeau), contour d'encre de 1 px comme les PNJ.
- **Attaques :** les calques PNJ (cheveux arrière, tête, torse, cheveux
  avant) sont posés séparément pour que la tête se penche et que les
  cheveux traînent ; les deux mains peintes dans le torse sont repliées et
  redessinées sur la poignée. Un dessin par image de jeu : 1 élan, 2 frappe
  (traînée en croissant), 3 contact (traînée), 4 suite du geste, 5 retour
  en garde ; jambes en fente de profil sur la frappe ; éclat au sol au
  contact du coup 4. Sur les images 2 à 4, la lame suit exactement la
  direction de **`swordPose()`**, celle que balaie `bladeHits()` ; l'élan et
  le retour sont libres. Durées `COMBO_TIMES`, pas d'attaque, pause
  d'impact, zones de touche et règles de gameplay ne changent pas.
- **Autres états :** `carry`, `hit`, `startle` et `flee` restent les poses
  du corps en garde, blessure, mêlée et esquive ; l'épée tirée est tenue
  basse vers l'avant dans la vraie main du PNJ, sans passer devant le visage.
- **Rengainage :** conservation de `HearthreaverKaldorArt.weaponVisual()`.
  Les transitions de rangement gardent leurs étapes, tout en échantillonnant
  les **8** véritables frames de marche. Le fourreau, raccourci à la taille
  de l'épée, passe sous les cheveux : de profil seul le pommeau dépasse
  au-dessus de l'épaule.
- **Chargement :** les modules PNG existants restent dans l'atlas intégré au
  HTML du jeu ; aucun téléchargement supplémentaire. Tant que le décodeur
  d'images prépare le module du héros, l'ancien Kaldor JavaScript sert de
  secours sans être enregistré en cache à la place de l'image définitive.
- **Codes :** `scripts/kaldor-civilian-bridge.js` (compositeur du héros)
  et `scripts/embed-kaldor.cjs` (injection web/iOS, reproductible).
  `sprites/kaldor/kaldor-art.js` est conservé uniquement pour les transitions
  d'arme et en secours pendant le chargement.

Construire avec `npm run build:batraciens`, puis `npm test` et
`npm run package:ios`.

---

# Archives : Kaldor v3 — barbare à cheveux longs, locomotion stable, épée dans le dos

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
