# Tenues et casques de Kaldor — garde-robe, mannequins et habillage

Kaldor peut changer de tenue et de casque. Chaque tenue est une couche de
corps complète (torse, bras, jambes, pieds) posée sous la tête et les cheveux
PNJ `masculin-adulte` / `masculin-hair-14`, animée par **le même rig que les
PNJ humains** : mêmes clips, mêmes durées, mêmes poses pour l'idle, la
marche, la fuite, le coup reçu, la mort, l'épée tirée et les quatre coups de
l'attaque. Seules les couleurs des bras et des poings redessinés sur la
poignée suivent la tenue (manches et gants).

Les casques suivent le principe des **couvre-chefs PNJ** : trois plans
animés comme la tête, la nuque (sous la tête), le casque (par-dessus les
cheveux) et un **masque** qui efface les cheveux qu'il recouvre. Un casque
ouvert laisse sortir la crinière dessous ; un casque fermé couvre aussi le
visage.

## Les onze tenues

| Tenue | Chaleur | Où la trouver |
| --- | --- | --- |
| Pagne noué | 0 · Aucune | Portée au départ |
| Brigandine du mercenaire | 1 · Légère | Camp de départ |
| Voiles du nomade | 0 · Aucune | Oasis-du-Safran |
| Harnais de l'arène | 0 · Aucune | Citadelle-de-Sarak |
| Pelisse du Grand Froid | 3 · Grand froid | Veille-Boréale |
| Peau de l'ours | 2 · Bonne | Col-des-Loups |
| Cuir du traqueur | 1 · Légère | Brume-aux-Saules |
| Cotte de mailles | 1 · Légère | Port-des-Veilleurs |
| Robe du Serpent | 0 · Aucune | Roche-du-Serpent |
| Tenue du corsaire | 0 · Aucune | Port-Sarak |
| Kaftan des steppes | 2 · Bonne | Col-de-Verre |

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
- **Cotte de mailles** : haubert d'anneaux d'acier aux manches longues,
  tabard sarcelle bordé d'or des Veilleurs, chausses de mailles, gants et
  bottes de cuir.
- **Robe du Serpent** : soie violet nuit à l'ourlet d'or, large collier d'or
  sur les épaules, ceinture d'écailles d'émeraude, bras nus aux brassards
  d'or, sandales.
- **Tenue du corsaire** : chemise de lin bouffante ouverte sur le torse,
  gilet bleu de mer à boutons d'or, écharpe rouge nouée, culotte rayée,
  bottes à revers.
- **Kaftan des steppes** : kaftan ocre matelassé croisé sur la poitrine,
  galons rouge et or, col et ourlet de martre, pantalon bouffant, bottes
  souples.

## Les cinq casques

| Casque | Forme | Chaleur | Où le trouver |
| --- | --- | --- | --- |
| Casque à nasal | Ouvert | 0 | Relais-des-Trois-Pierres |
| Casque à cornes | Ouvert | 0 | Val-des-Neiges |
| Casque fourré | Ouvert | 1 | Havre-du-Givre |
| Casque de l'arène | Fermé | 0 | Citadelle-de-Sarak |
| Heaume fermé | Fermé | 1 | Fort-Écho |

- **Casque à nasal** : calotte conique d'acier à arête claire, bandeau de
  bronze riveté, nasal entre les yeux.
- **Casque à cornes** : calotte de fer ronde, bandeau de cuir clouté de
  laiton, deux cornes d'aurochs recourbées.
- **Casque fourré** : petite calotte de fer sur un épais bandeau de loup
  blanc, rabats de fourrure sur les oreilles.
- **Casque de l'arène** : bronze corinthien, cimier de crin rouge, nasal et
  joues pleines ; seuls les yeux et la bouche se devinent.
- **Heaume fermé** : seau d'acier à sommet plat, croix de laiton, fente de
  vue et trous d'aération.

Le masque de chaque casque efface les cheveux au-dessus de son bord : la
crinière ne dépasse jamais du dessus, même quand la tête se penche pendant
les coups (le masque suit la tête, les cheveux traînent derrière). Sous un
casque ouvert, les mèches tombent sur les côtés et dans le dos. Vu de face,
un casque fermé repose sur les épaules ; de dos, la crinière sort dessous.

La **chaleur** (0 à 3) est enregistrée pour chaque pièce. `game.outfitWarmth()`
additionne la tenue et le casque (au plus 3). Face à la température ressentie,
elle décide si Kaldor perd de la santé au froid ou si sa faim se creuse plus
vite à la chaleur : voir [froid, chaleur et tenues](body-heat.md).

## En jeu

- Chaque tenue unique attend sur un **mannequin** de bois près de sa
  localité, chaque casque sur un **poteau** (décalage fixe depuis le lieu de
  l'atlas, vérifié dégagé, loin des chevaux et charrettes de transport et
  accessible par les tests). Le vêtement est posé sur la traverse, les bottes
  au pied ; le casque repose sur la tête du poteau. Un éclat lent les signale.
- À moins de 18 px : **« E  PRENDRE : NOM »**. La pièce part dans
  l'inventaire, le mannequin ou le poteau reste, nu. Une notice annonce la
  trouvaille et sa chaleur.
- **Inventaire (I)**, ligne *Tenue* juste sous le personnage : Kaldor en
  direct, la tenue et le casque portés, la chaleur totale, ce qui reste à
  trouver, et le bouton **Tenue**.
- **Écran Tenue** : Kaldor en grand, qu'on fait tourner (de face, profils,
  de dos) avec ◀ ▶ ; à côté, les **tenues** puis les **casques** possédés
  sous forme de cases (icône, nom, chaleur), plus « Sans casque » et une case
  « ? » pour ce qui reste à trouver. Toucher une case l'équipe aussitôt, et
  tenue et casque se combinent librement. Survoler ou sélectionner une case
  affiche sa description. **‹ Inventaire** ou Échap ramène à l'inventaire.
- **Habillage** : en changeant de tenue, Kaldor lève les bras, enfile le
  vêtement par la tête, se baisse pour l'ajuster puis se redresse (8 images,
  1,14 s). En changeant de casque, il porte les deux mains à la tête, le
  casque change quand ses mains l'y tiennent, puis il l'enfonce et laisse
  retomber les bras (5 images, 0,76 s). Les deux se jouent sur l'écran Tenue
  et dans le monde ; bouger, frapper, esquiver, parer ou être touché les
  interrompt.
- Sauvegarde : `wardrobe: {owned, worn, helmets, helmet}`. Une ancienne
  sauvegarde démarre en pagne et tête nue ; une pièce inconnue est ignorée.

## Fichiers

| Fichier | Rôle |
| --- | --- |
| `art/kaldor-tenues/*.cjs` | Sources pixel des tenues : grilles par calque et par vue (face, droite, dos ; gauche en miroir avec échange des ombres), palette, chaleur, lieu, couleurs de manches, de poings et d'étoffe. |
| `art/kaldor-tenues/habillage.cjs` | Le vêtement en train de passer la tête (images 1 à 3 de l'habillage). |
| `art/kaldor-casques/*.cjs` | Sources pixel des casques : calque `COIFFE 21` (casque), `COIFFE 20` (nuque, facultatif) et `MASQUE` (zone de cheveux effacée), chaleur, forme, lieu. |
| `art/kaldor-casques/masque.cjs` | Petit outil qui écrit un masque à partir de bandes de lignes. |
| `scripts/kaldor-outfit-rig.cjs` | Portage node du rig PNJ (`animer.lua`) et clips `dress` et `helm`. |
| `scripts/build-kaldor-outfits.cjs` | Anime chaque tenue et chaque casque et les emballe comme l'atlas PNJ (tuiles 48 px dédupliquées) : corps, premier plan, torse sans bras, mannequin ; nuque, casque et masque. Écrit `data/kaldor-outfits/atlas.json` et des planches dans `sprites/kaldor/tenues/` et `sprites/kaldor/casques/`. |
| `scripts/kaldor-civilian-bridge.js` | Compose Kaldor dans la tenue et le casque portés ; `wear()`, `wearHelmet()`, `dressLook()`, `portrait()`, `garment()`, `bareHead()`. |
| `scripts/kaldor-outfits.js` | Garde-robe en jeu : mannequins et poteaux, prise, ligne Tenue et écran Tenue de l'inventaire, sauvegarde. |
| `tests/kaldor-outfits.test.cjs` | Pagne identique au PNJ, atlas des casques, mannequins et poteaux accessibles, prise et sauvegarde, habillage, masque des cheveux, toutes les poses de chaque tenue et de chaque casque, ligne Tenue. |

Reconstruire après une retouche d'une tenue ou d'un casque :

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

### Ajouter un casque

1. Créer `art/kaldor-casques/<id>.cjs` sur le modèle des autres. Les calques
   commencent par `COIFFE` ou `MASQUE` (rôle « couvre-chef » du rig : ils
   bougent comme la tête). `COIFFE 20` ou `Nuque` va sous la tête, les autres
   `COIFFE` par-dessus les cheveux, `MASQUE` efface les cheveux. Repères de
   la tête de face : crâne x 34 à 45, lignes 34 à 44, yeux ligne 38, bouche
   ligne 42 ; la crinière monte jusqu'à la ligne 30.
2. Ajouter l'identifiant à `HELMETS` dans `scripts/build-kaldor-outfits.cjs`.
3. `npm run build:kaldor-outfits`, puis `npm test`.
