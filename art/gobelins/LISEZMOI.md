# Gobelins

Proposition de design, à valider, d'après la référence en quatre vues de Lino : grosse tête ronde, longues oreilles en pointe, yeux jaunes sous des sourcils froncés, nez en bulbe, un croc, peau olive, gilet de cuir ouvert, culotte, ceinture et bourse. Les gobelins sont dessinés dans Piskel, en calques séparés comme les humains : corps, oreilles, visage, cheveux, habits pièce par pièce, coiffe, arme. L'armure de guerre reste de fer noirci, avec des plaques dentelées, des pointes et de la rouille, dans l'esprit des gobelins de la Moria.

![design de base](planches/design-base.png)

![tenues, coiffes et teintes](planches/variantes.png)

## Format

- Cadre de 48 × 48, pieds à l'ancre x 24, y 36, comme les hommes-singes et les batraciens. Le moteur ajoute 16 sur les deux axes, ce qui donne le cadre 80 × 80 des humains, avec l'ancre en 40, 52.
- Quatre cadres par fichier, dans l'ordre des humains : face, droite, dos, gauche.
- Contour d'encre `#100c14`, alpha binaire.
- Un gobelin se tient voûté, comme ceux du Seigneur des anneaux : tête basse enfoncée entre des épaules hautes, bras longs, et de profil tête projetée en avant, dos bombé, genoux fléchis. Il fait ainsi 20 pixels de haut, des pieds au haut du crâne (22 debout, dont 11 pour la tête). Ses oreilles le rendent beaucoup plus large qu'un humain (22 pixels).
- Les dessins de `scripts/gobelins/dessins.cjs` sont faits debout, puis pliés dans la posture voûtée de la même façon pour le corps et pour tout ce qui se pose dessus : une tenue, une coiffe ou une arme dessinée debout reste donc ajustée.

## Fichiers

| Dossier | Contenu |
|---|---|
| `corps/` | `masculin` et `feminin`. Les deux ont la même silhouette, si bien que chaque tenue va aux deux. Le corps féminin a son propre visage (cils, lèvres), un chignon noir avec deux tresses et des anneaux d'oreille. |
| `tenues/` | `harnais` (la tenue de la référence : gilet de cuir, culotte, ceinture, bourse), `pagne`, `pagne-bandeau`, `villageois` (tunique de laine, manches courtes, braies, corde, bourse, bandes de pied) et `guerrier` (cotte de mailles rouillée, tassettes, spalière dentelée, brassards de cuir clouté, bottes ferrées). |
| `coiffes/` | `capuche` (fendue pour les oreilles) et `casque-a-pointes` (avec nasal). |
| `armes/` | `cimeterre-dentele`, tenu dans la main droite. |
| `gobelins.json` | Teintes de peau et personnages assemblés. |
| `planches/` | Planches de validation. |
| `exports/` | Une bande de 192 × 48 par personnage (face, droite, dos, gauche). |
| `palette-gobelins.gpl` | Palette à importer dans Piskel. |

## Calques

Les noms suivent ceux des humains (`sprites/humains/sources-natives.js`), pour que les deux peuples se ressemblent dans les outils.

| Calque | Pièce |
|---|---|
| `ANATOMIE 10` à `13` | pieds, jambes, torse et cou, bras et mains |
| `07 Crane`, `07 Crane - Oreilles`, `08 Visage` | tête ; les oreilles et le visage (sourcils, yeux, nez, bouche, croc) sont des calques à part |
| `CHEVEUX`, `BIJOUX` | chignon et tresses, anneaux |
| `HABIT 10` | pieds |
| `HABIT 11` | jambes |
| `HABIT 12` | torse |
| `HABIT 13` | manches |
| `HABIT 14` | pans, pagne, tassettes |
| `HABIT 15` | ceinture |
| `HABIT 16` | bourse |
| `HABIT 17` | avant-bras |
| `HABIT 18` | épaules |
| `HABIT 19` | cape |
| `COIFFE 21` | capuche, casque |
| `MASQUE COIFFE` | zone où la coiffe cache les cheveux ; ce masque n'est jamais dessiné |
| `ARME - … (devant)` / `(derriere)` | l'arme en main ; vue de gauche, elle passe derrière le corps |
| `REFERENCE - …` | le corps, à demi transparent, pour dessiner une pièce en place ; ce calque n'est jamais assemblé |

## Assemblage

`gobelins.json` décrit chaque personnage : un corps, une tenue, une coiffe et une arme (toutes deux facultatives), et une teinte de peau.

- **Remplacer une pièce.** `pieces` remplace une pièce de la tenue par celle d'une autre tenue, comme `compose()` chez les humains. Par exemple, `"pieces": {"tunic": "guerrier"}` met la cotte de mailles sur un villageois. `null` retire la pièce.
- **Ordre des calques.** De bas en haut : arme dans le dos, corps, habits (10, 11, 12, 14, 15, 16, 13, 17, 18, 19), tête, cheveux, coiffe, oreilles, bijoux, arme en main. Les oreilles passent par-dessus la coiffe.
- **Masque de coiffe.** Il cache les cheveux. Le casque cache le chignon, mais on voit encore les tresses dessous. La capuche cache tout.
- **Teintes de peau.** Une teinte remplace les cinq tons de peau du corps :
  - olive, la teinte de la référence ;
  - gris-vert, dans les souterrains ;
  - mousse, à Boisclair ;
  - ocre, pour le clan Kesh ;
  - cendre, à Griseborne.

## Retoucher

1. Ouvrir le `.piskel` sur piskelapp.com (Open). La palette s'importe depuis `palette-gobelins.gpl`.
2. Garder le cadre de 48 × 48, les quatre cadres et les noms de calques. Pour ajouter une pièce, créer un calque `HABIT nn - Nom` dans une tenue. Pour ajouter une tenue ou une coiffe, créer un fichier dans le bon dossier.
3. Lancer `npm run gobelins` pour refaire les planches et les exports, puis `npm run test:gobelins`.

Le premier jet vient de `scripts/gobelins/dessins.cjs`, des dessins en caractères : le corps nu, découpé en calques par zones, puis le gobelin habillé de chaque tenue, coiffe ou chevelure, dont les pixels qui diffèrent du corps nu forment les calques. `npm run draft:gobelins` n'écrit que les fichiers absents : les `.piskel` sont la source, et `--ecraser` effacerait les retouches.

## Ce qui reste à faire après validation

- **Animations.** Il n'y en a pas encore : ce sont des poses de repos.
- **Intégration au jeu.** Les gobelins ne sont pas encore dans le jeu, ni dans la forteresse de Grise-Gueule.
- **Armes.** En jeu, les armes viennent du catalogue (`data/weapons/catalogue.json`) : Coutelas de Boisclair, Dague de Kesh, Marteau de Griseborne, etc. Le cimeterre dentelé est une proposition de style pour ces armes.
- **Grise-Gueule.** Le chef reste à dessiner : un grand gobelin maigre armé d'une massue.
