# Kaldor v4 — barbare chibi au style Game Boy des batraciens

Les sprites du joueur sont **entièrement construits en JavaScript** dans
`sprites/kaldor/kaldor-art.js`. Kaldor suit maintenant la même grammaire que
les batraciens : de petites grilles où **un caractère vaut un pixel**, un
contour sombre `#100e20`, la lumière en haut à gauche, une palette courte
(les cuirs, fourrures et contours sont ceux des batraciens) et une animation
minimaliste par décalages entiers d'un pixel. Case moteur **80 × 80**, pieds en
**(40, 52)**, alpha binaire, aucun lissage, aucune image chargée.

## Le personnage

Quatre dessins indépendants d'après la planche de référence : dos (0), droite
(1), face (2), gauche (3). Le profil gauche n'est pas un miroir : la lumière
reste en haut à gauche.

- Grosse tête chibi aux cheveux longs bruns, regard dur, barbe.
- Fourrure crème sur les épaules, brassards de cuir, ceinture à boucle dorée,
  bottes à revers de fourrure.
- Fourreau en diagonale dans le dos ; la poignée dépasse derrière l'épaule de
  profil et de dos, et reste cachée par la tête de face, comme sur la planche.

Les grilles sources sont découpées en pièces (tête, tronc, bras, jambes). Les
poses déplacent ces pièces d'un pixel ; seuls l'épée, les bras d'action, les
jambes de profil et les smears sont tracés à la volée.

## Animations

- **Repos :** respiration d'un pixel et clignement (boucle de 4,3 s comme les
  batraciens).
- **Marche (6 images) :** rebond d'un pixel du haut du corps, pied levé à tour
  de rôle de face et de dos, foulée alternée de profil, bras en balancier.
- **Combos (4 × 6 images) :** les mains suivent la pose moteur `swordPose()`
  ramenée vers le torse (bras courts de chibi), deux mains sur la poignée. La
  **pointe dessinée est la vraie pointe de la zone de coup**. Smear en
  croissant plein (bord blanc, cœur bleuté, départ tramé) sur les images 2 et 3,
  traîne tramée plus légère sur l'image 4, retour au repos sur l'image 5.
- **Garde :** lame tenue à deux mains en travers du corps, accroupi d'un pixel.
- **Dash, blessure, utiliser, mêlée :** penché, recul avec yeux fermés, main
  levée vers le torse, coup de poing armé puis lancé.
- Hors combat, l'épée en main reste **à côté de la tête, jamais devant le
  visage**.

Aucune durée `COMBO_TIMES`, pause d'impact, dash, verrouillage, parade ni
balayage `bladeHits()` n'est modifié ; le facteur de lame partagé reste `1.02`.

## Rangement automatique dans le dos

L'état visuel `kaldorWeapon` est inchangé (temps de jeu, sans effet sur les
sauvegardes ni sur les attaques) :

1. Après **3,7 s sans attaque ni garde**, l'épée se range en **0,33 s** :
   lame levée, glissée par-dessus l'épaule dans le fourreau, poignée lâchée,
   bras au repos. Le rangement fonctionne aussi en marchant (36 variantes).
2. Une attaque remet **immédiatement** l'épée en main ; la garde la dégaine en
   **0,21 s** (main à la poignée, lame tirée, levée, en garde).
3. Blessure, utilisation d'objet et mêlée gardent l'épée dans le dos si elle
   y était déjà.

## Construction et tests

```sh
npm install
npm run build:batraciens   # reconstruit aussi Kaldor
node --test --test-concurrency=2 tests/*.test.cjs
npm run package:ios
```

Le constructeur Kaldor est idempotent : il remplace seulement le bloc
`// BEGIN KALDOR JAVASCRIPT PIXEL ART` du HTML web et iOS, l'aperçu
`art/kaldor-preview.html` et `data/kaldor-manifest.json`. L'atelier donne les
quatre vues, chaque pose, les combos et la démonstration du rangement.
Les tests vérifient le rendu de chaque état (pixels opaques, aucun rognage),
l'identité entre le peintre du jeu et le raster exporté, les smears, la marche
rigide avec rebond d'un pixel, le rangement et la reconstruction répétable.
**Aucun test sur iPhone physique n'a été effectué.**
