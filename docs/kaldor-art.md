# Kaldor v4 — barbare chibi au style Game Boy des batraciens

Les sprites du joueur sont **entièrement construits en JavaScript** dans
`sprites/kaldor/kaldor-art.js`. Kaldor suit maintenant la même grammaire que
les batraciens : de petites grilles où **un caractère vaut un pixel**, un
contour sombre `#100e20`, la lumière en haut à gauche, une palette courte
(les cuirs, fourrures et contours sont ceux des batraciens) et une animation
minimaliste par décalages entiers d'un pixel. Case moteur **80 × 80**, pieds en
**(40, 52)**, alpha binaire, aucun lissage, aucune image chargée.

## Le personnage

Quatre dessins indépendants de 24 lignes, relevés case par case sur la planche
de référence : dos (0), droite (1), face (2), gauche (3). Le profil gauche
n'est pas un miroir : la lumière reste en haut à gauche.

- Grosse tête chibi (plus de la moitié de la hauteur) : crinière brune en
  mèches, large visage orangé, yeux carrés sous des sourcils froncés,
  oreilles, moustache et barbe sombres, bouche claire.
- Grandes épaulières de fourrure crème en pointes, plus larges que la tête ;
  de profil, une épaulière en dôme sur l'épaule proche.
- Gilet de cuir ouvert sur le torse (sangles en V), grosse ceinture à boucle
  dorée, bras nus aux brassards de cuir et gros poings, cuisses nues, bottes
  à semelle claire.
- De dos, la crinière tombe entre les épaulières sur un col de fourrure
  continu ; le fourreau traverse le dos en diagonale comme le baudrier de la
  planche. La poignée dépasse derrière l'épaule de profil et de dos, et reste
  cachée par la tête de face.
- De profil, la tête est posée au-dessus du corps et le dos reste droit (aucune
  bosse) : les cheveux tombent dans le dos jusqu'aux épaules.

Les grilles sources sont découpées en pièces (tête, tronc, bras, jambes). Les
poses déplacent ces pièces d'un pixel ; seuls l'épée, les bras d'action, les
jambes de profil et les smears sont tracés à la volée. Une finition vérifie la
silhouette de chaque image : tout bord découvert par une pièce qui bouge reçoit
son contour et les petits trous se bouchent (les smears tramés restent ajourés).

## Animations

- **Repos :** respiration d'un pixel et clignement (boucle de 4,3 s comme les
  batraciens). En remontant, la tête et les mains restent un instant en bas :
  léger bobbing d'un pixel, sans trou au cou (le col de fourrure est repeint
  par-dessus la tête abaissée).
- **Marche (6 images) :** rebond d'un pixel du haut du corps, la tête suivant
  avec une image de retard, bras en balancier. De face et de dos, les pieds
  sont joints et se lèvent à tour de rôle. De profil, petits pas de chibi :
  les deux pieds restent sous le corps et la jambe qui passe devant se lève
  d'un pixel.
- **Épée à deux mains :** dès qu'elle est sortie (repos, marche, garde, dash,
  blessure, combos), les deux poings serrent la fusée, l'un contre la garde,
  l'autre en dessous. Chaque poing reste à portée de son épaule (8 px de face,
  7 px de profil) : si un bras devait s'étirer, toute la poignée glisse vers le
  torse. Seuls le rangement, le dégainage et une main occupée (utiliser, mêlée :
  l'épée pend alors dans l'autre main, pointe au sol) se font à une main. Les
  bras d'action partent sous les épaulières : la fourrure est repeinte
  par-dessus le haut du bras, jamais sur un poing.
- **Combos (4 × 6 images) :** la lame garde l'angle et la longueur de la pose
  moteur `swordPose()`, les mains restant devant le torse. Poings et pommeau ne
  montent jamais devant le visage ; une lame levée passe derrière la tête (lame
  sur l'épaule). Smear en croissant plein (bord clair, cœur doré, départ
  tramé) sur les images 2 et 3, traîne tramée plus légère sur l'image 4, retour
  en garde haute sur l'image 5. Le smear est crème et doré comme sur la planche.
  Les appuis s'écartent en fente : de profil, pied avant devant, pied arrière
  derrière, buste abaissé d'un pixel qui recule à l'armé puis plonge vers
  l'avant ; de face et de dos, appuis élargis. La tête plonge d'un pixel à
  l'impact.
- **Garde :** lame tenue à deux mains en travers du corps, appuis écartés,
  accroupi d'un pixel.
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
