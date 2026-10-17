# Kaldor v5 — barbare chibi au style Game Boy des batraciens

Les sprites du joueur sont **entièrement construits en JavaScript** dans
`sprites/kaldor/kaldor-art.js`. Kaldor suit la même grammaire que les
batraciens : de petites grilles où **un caractère vaut un pixel**, un contour
sombre, la lumière en haut à gauche, une palette courte et une animation
minimaliste par décalages entiers d'un pixel. Case moteur **80 × 80**, pieds en
**(40, 52)**, alpha binaire, aucun lissage, aucune image chargée.

## Le personnage

Quatre dessins de **28 lignes**, relevés case par case sur les grilles de
référence et validés vue par vue : dos (0), droite (1), face (2), gauche (3).
L'image de repos épée rangée reproduit ces planches pixel pour pixel (seuls
quelques pixels de contour sont ajoutés là où une pièce mobile découvre un bord).

- Grosse tête chibi : crinière brune en mèches, visage orangé, yeux carrés
  sous des sourcils froncés, moustache et barbe sombres.
- De profil, **aucun nez** : la ligne du front descend droit jusqu'à la barbe
  et rien ne dépasse cette limite, des deux côtés. Ventre plat, sourcil
  visible, oreille simple, pieds étroits.
- Épaulières de fourrure crème, gilet de cuir, ceinture à boucle dorée, bras
  nus aux brassards de cuir et gros poings, bottes à semelle claire.
- Épée rangée : la poignée dépasse derrière l'épaule de profil et de dos, et
  reste cachée par la tête de face.

Les grilles sont découpées en pièces (tête, tronc, bras, jambes). Les poses
déplacent ces pièces d'un pixel ; seuls l'épée, les bras d'action, les jambes
de profil et les smears sont tracés à la volée. Une finition repose le contour
de chaque bord découvert et bouche les petits trous (les smears tramés restent
ajourés).

## Animations

- **Repos :** respiration d'un pixel et clignement. La tête suit le corps avec
  une image de retard (léger bobbing), sans trou au cou.
- **Marche (6 images) :** rebond d'un pixel, bras en balancier. De face et de
  dos, pieds joints qui se lèvent à tour de rôle ; de profil, petits pas de
  chibi sous le corps, la jambe qui passe devant se lève d'un pixel.
- **Épée droite à longueur fixe :** la lame visible mesure toujours
  **16 pixels** de la main à la pointe, quel que soit l'angle. Elle est tracée
  d'un seul segment pommeau → pointe, garde perpendiculaire : elle ne se plie
  jamais et ne grandit pas pendant les attaques. Seul l'angle vient de
  `swordPose()`.
- **Deux mains :** dès qu'elle est sortie, les deux poings serrent la fusée.
  Les bras sont à deux segments (épaule, coude, poing) et ne s'étirent jamais :
  si un poing sort de portée, toute la poignée glisse vers le torse. Une lame
  levée passe derrière la tête (mains derrière la nuque, pointe au-dessus du
  crâne) ; de profil, une lame qui croiserait le visage recule ou descend.
- **Combos (4 × 6 images) :** armé, frappe, suivi, retour en garde. Smear en
  **éventail** entre la lame précédente et la lame actuelle, sur les images 2
  et 3 seulement : bord clair, cœur doré, départ tramé, couvrant la moitié
  extérieure de la lame. Un coup presque vertical (taille de dos) laisse deux
  traits de vitesse. Les appuis s'écartent en fente et le buste plonge d'un
  pixel à l'impact.
- **Garde :** lame à deux mains en travers du corps, appuis écartés,
  accroupi d'un pixel.
- **Dash, blessure, utiliser, mêlée :** penché, recul avec yeux fermés, main
  levée vers le torse, coup de poing armé puis lancé (l'épée pend alors dans
  l'autre main).

Aucune durée `COMBO_TIMES`, pause d'impact, dash, verrouillage, parade ni
balayage `bladeHits()` n'est modifié.

## Rangement automatique dans le dos

L'état visuel `kaldorWeapon` est inchangé (temps de jeu, sans effet sur les
sauvegardes ni sur les attaques) :

1. Après **3,7 s sans attaque ni garde**, l'épée se range en **0,33 s**
   par-dessus l'épaule, même en marchant.
2. Une attaque remet **immédiatement** l'épée en main ; la garde la dégaine en
   **0,21 s**.
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
avec rebond d'un pixel, le rangement et la reconstruction répétable.
**Aucun test sur iPhone physique n'a été effectué.**
