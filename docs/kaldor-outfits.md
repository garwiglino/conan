# Tenues de Kaldor — garde-robe, mannequins et habillage

Kaldor peut changer de tenue. Chaque tenue est une couche de corps complète
(torse, bras, jambes, pieds) posée sous la tête et les cheveux PNJ
`masculin-adulte` / `masculin-hair-14`, animée par **le même rig que les PNJ
humains** : mêmes clips, mêmes durées, mêmes poses pour l'idle, la marche, la
fuite, le coup reçu, la mort, l'épée tirée et les quatre coups de l'attaque.
Seules les couleurs des bras et des poings redessinés sur la poignée suivent
la tenue (manches et gants).

## Les sept tenues

| Tenue | Chaleur | Où la trouver |
| --- | --- | --- |
| Pagne noué | 0 · Aucune | Portée au départ |
| Brigandine du mercenaire | 1 · Légère | Camp de départ |
| Voiles du nomade | 0 · Aucune | Oasis du Safran |
| Harnais de l'arène | 0 · Aucune | Citadelle de Sarak |
| Pelisse du Grand Froid | 3 · Grand froid | Veille-Boréale |
| Peau de l'ours | 2 · Bonne | Col des Loups |
| Cuir du traqueur | 1 · Légère | Brume-aux-Saules |

- **Pagne noué** : le costume PNJ `E01-masculin-terre`, régénéré pixel pour
  pixel par le rig (test à l'appui), sans la caisse de l'animation `carry`
  qui apparaissait en garde.
- **Pelisse du Grand Froid** : manteau matelassé bleu guède, mantelet de loup
  blanc sur les épaules, ourlet de fourrure, ceinturon à boucle de laiton,
  moufles et bottes fourrées. **Pas de capuche.**
- **Brigandine du mercenaire** : drap de garance riveté de laiton, spalières
  d'acier, manches matelassées, gants et bottes de cuir.
- **Voiles du nomade** : longue robe de lin écru jusqu'aux chevilles (elle
  ondule au pas), écharpe safran sur l'épaule, ceinture d'indigo, sandales.
- **Harnais de l'arène** : torse nu barré d'une sangle cloutée, manica de
  bronze au bras droit seulement, ceinture de bronze, jupe de lanières,
  jambières de bronze.
- **Peau de l'ours** : dépouille d'ours sur les épaules, gilet de cuir
  ouvert, collier de griffes, bras nus aux poignets bandés, jambes
  enroulées de fourrure.
- **Cuir du traqueur** : laine bouillie vert mousse, justaucorps de cuir
  huilé lacé, mantelet frangé, brassards, hautes bottes.

La **chaleur** (0 à 3) est enregistrée pour chaque tenue et lue par
`game.outfitWarmth()`. Elle ne change encore aucune règle : elle est prête
pour les effets du froid à venir.

## En jeu

- Chaque tenue unique attend sur un **mannequin** de bois près de sa
  localité (décalage fixe depuis le lieu de l'atlas, vérifié dégagé et
  accessible par les tests). Le vêtement est posé sur la traverse, les
  bottes au pied, avec un éclat lent.
- À moins de 18 px : **« E  PRENDRE : NOM DE LA TENUE »**. La tenue part
  dans l'inventaire, le mannequin reste, nu. Une notice annonce la trouvaille
  et sa chaleur.
- **Inventaire (I)**, section *Garde-robe* : une cabine montre Kaldor en
  direct, puis la liste des tenues possédées (icône du vêtement, chaleur,
  description, bouton **Porter**). Le nombre de tenues encore cachées est
  indiqué.
- **Habillage** : en changeant de tenue, Kaldor lève les bras, enfile le
  vêtement par la tête, se baisse pour l'ajuster puis se redresse (8 images,
  1,14 s). L'ancienne tenue reste visible jusqu'à ce que le vêtement passe
  la tête. L'animation se joue dans la cabine de l'inventaire et dans le
  monde ; bouger, frapper, esquiver, parer ou être touché l'interrompt.
- Sauvegarde : `wardrobe: {owned, worn}`. Une ancienne sauvegarde démarre en
  pagne ; une tenue inconnue est ignorée.

## Fichiers

| Fichier | Rôle |
| --- | --- |
| `art/kaldor-tenues/*.cjs` | Sources pixel des tenues : grilles par calque et par vue (face, droite, dos ; gauche en miroir avec échange des ombres), palette, chaleur, lieu, couleurs de manches, de poings et d'étoffe. |
| `art/kaldor-tenues/habillage.cjs` | Le vêtement en train de passer la tête (images 1 à 3 de l'habillage). |
| `scripts/kaldor-outfit-rig.cjs` | Portage node du rig PNJ (`animer.lua`) et clip `dress`. |
| `scripts/build-kaldor-outfits.cjs` | Anime chaque tenue et l'emballe comme l'atlas PNJ (tuiles 48 px dédupliquées) : corps, premier plan, torse sans bras, mannequin. Écrit `data/kaldor-outfits/atlas.json` et des planches dans `sprites/kaldor/tenues/`. |
| `scripts/kaldor-civilian-bridge.js` | Compose Kaldor dans la tenue portée ; `wear()`, `dressLook()`, `portrait()`, `garment()`. |
| `scripts/kaldor-outfits.js` | Garde-robe en jeu : mannequins, prise, inventaire, sauvegarde. |
| `tests/kaldor-outfits.test.cjs` | Pagne identique au PNJ, mannequins accessibles, prise et sauvegarde, habillage, toutes les poses de chaque tenue. |

Reconstruire après une retouche d'une tenue :

```sh
npm run build:kaldor-outfits
```

### Ajouter une tenue

1. Créer `art/kaldor-tenues/<id>.cjs` sur le modèle des autres. Le nom de
   chaque calque décide de son mouvement, comme dans le rig PNJ : `Manches`,
   `Mains`, `bras` ou `Gants` suivent les bras, `HABIT 10` les pieds,
   `HABIT 11` ou `Jambes` les jambes, et les pans nommés `HABIT 12`,
   `HABIT 14` ou `Cape` traînent au pas. Le torse doit être fermé (contours
   compris) sous les bras : c'est lui qui reste quand les mains tiennent
   l'épée.
2. Ajouter l'identifiant à `ORDER` dans `scripts/build-kaldor-outfits.cjs`.
3. `npm run build:kaldor-outfits`, puis `npm test`.
