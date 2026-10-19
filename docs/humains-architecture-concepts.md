# Architecture humaine — concepts de villes et villages

Ce lot est un dossier de conception : **22 planches, 60 modèles de bâtiments, 48 pièces modulaires et 4 variantes hivernales**. Les PNG précèdent la fabrication JavaScript, selon la méthode retenue pour les postes. Ils ne constituent pas un atlas de sprites runtime ni des quartiers déjà placés.

[Galerie des concepts](../art/humains/architecture/index.html) · [Catalogue et briefs](../data/humains/architecture/concepts.json) · [Couverture des localités](../data/humains/architecture/settlement-coverage.json).

## Appui dans le monde existant

La bible actuelle comporte des résidents humains dans ses **83 localités** : Igea 7, Teremor 44, Sarak 17, Varan 6, Tagon 9. Les habitats dispersés de l’arrière-pays nécessitent également maisons, exploitations, réserves et abris ; ils ne sont pas remplacés par les seuls centres nommés.

Les références sont les chapitres [géopolitique](world-bible/01-geopolitique.md), [peuples et villes](world-bible/02-peuples-et-villes.md), [ressources](world-bible/03-ressources-et-echanges.md) et [sociétés](world-bible/05-societes-et-criminalite.md), ainsi que les fiches compilées des localités. Les matériaux et silhouettes sont des **propositions artistiques déduites des climats et fonctions**, pas un nouveau canon attribuant un style ou un culte obligatoire à une population.

| Famille | Besoins retenus | Planches |
|---|---|---|
| Teremor | Agriculture, bourgs, domaines, habitat mitoyen | 01, 07–13 |
| Sylverive, dans Teremor | Maisons marchandes, chartes, entrepôts, textile | 02, 08, 11–12, 19 |
| Igea | Vallées, passages, réserves, mineurs, élevage | 03, 07, 13, 15, 22 |
| Sarak | Habitat abrité, étapes, marchés, réserves, irrigation | 04, 08, 15, 20 |
| Varan | Planchers hauts, ventilation, accès et dépôts | 05, 09, 15, 19–20 |
| Tagon | Habitats côtiers/forestiers humains, stockage naval | 06, 11, 15, 19 |

Les fonctions communes ont une enveloppe de référence ; les six familles donnent les règles de matériaux pour leur adaptation. Ce lot **ne dessine pas chaque atelier dans les six styles**. Il ne remplace pas non plus les architectures propres aux autres espèces vivant dans ces régions.

Les six ports océaniques explicitement reconnus dans les fiches sont Branchebasse, Aulneport, Port-Sarak, Port-des-Veilleurs, Bourg-des-Coquilles et Anse-des-Palmes. Un nom comme « Havre-du-Givre », « Aulneport » ou « Bourg-du-Pont » ne suffit jamais à créer une berge ou un pont : le statut et les accès réels prévalent. Les ouvrages intérieurs restent conditionnés à une vérification hydrologique. Les coordonnées existantes et `runtimeKind` sont conservés.

## Inventaire des planches

| No | Contenu | Références |
|---|---|---|
| 01 | Chaumière, longère, maison-boutique, manoir | T01–T04 |
| 02 | Maison de négociant, entrepôt portuaire, chartes, manufacture | T05–T08 |
| 03 | Maison longue, refuge, grenier haut, loge de mineurs | T09–T12 |
| 04 | Maison à cour, demeure de bourg, relais, réserve fraîche | T13–T16 |
| 05 | Maison haute, maison drainée, halle, dépôt surélevé | T17–T20 |
| 06 | Maison côtière, maison forestière, marins, bois naval | T21–T24 |
| 07 | Grange, étable fermée, bergerie, abri pastoral | B01–B04 |
| 08 | Halle, grenier collectif, auberge, comptoir | B05–B08 |
| 09 | Forge couverte, cuisson, tannerie, charpente | B09–B12 |
| 10 | Moulins à vent/eau, fournil, fumoir-séchoir | B13–B16 |
| 11 | Tisserands, teinturerie, corderie, huilerie | B17–B20 |
| 12 | Conseil, soins, mémoire/rites, salle commune/refuge | B21–B24 |
| 13 | Garde, caserne, arsenal, donjon résidentiel | F01–F04 |
| 14 | Tours bois/pierre, portes palissade/rempart | F05–F08 |
| 15 | Accès de mine, loge de carrière, sel, chantier naval vide | X01–X04 |
| 16 | Murs, fondations, poutres, poteaux, pignon, faîtage | M01–M08 |
| 17 | Palissade, courtine, fins, L/T, parapet, ronde, escalier | M09–M16 |
| 18 | Portes, vantaux, arc, fenêtres, claustra, galerie, auvent | M17–M24 |
| 19 | Ponts, culée, quais, jetée, accostage, rampe | M25–M32 |
| 20 | Citerne, gouttière, encadrement de vanne, conduit, salubrité, cheminée, évent | M33–M40 |
| 21 | Couvertures, palier, échafaudage, ossature en chantier | M41–M48 |
| 22 | Les quatre modèles d’Igea sous neige saisonnière | T09-hiver–T12-hiver |

## Échelle et vues

Le civil natif approuvé mesure **19 pixels** de haut sans coiffe. Les enveloppes `[largeur, profondeur, hauteur]` du catalogue sont des **cibles natives** pour la transcription, pas une mesure des images générées. Une porte simple vise environ 16 pixels de largeur utile et 24 de hauteur. Une petite maison tient typiquement dans 64–80 pixels de largeur ; les grandes enveloppes atteignent 96–144 pixels et les tours 128 pixels de haut. Les façades ne doivent pas être réduites pour faire tenir un intérieur jouable dans une seule image : l’aménagement intérieur peut utiliser un plan séparé et les mêmes unités de personnages/postes.

Chaque bâtiment dispose de quatre propositions cardinales : **face, droite, dos, gauche**. Chaque module possède **face et côté**, avec épaisseur réellement plus mince si nécessaire. Les diagonales de charpente, rampes et pentes de toiture sont des formes physiques ; elles ne changent pas la caméra en vue isométrique. Les jonctions L et T restent orthogonales.

Pour la fabrication, établir d’abord un **plan de référence unique** : orientation du faîtage, largeur/profondeur, portes, annexes, cheminées et fondations. Les propositions PNG peuvent conserver des écarts entre détails de vues ; il faudra les normaliser sur ce plan avant de déclarer les quatre sprites géométriquement compatibles. Ne pas extraire automatiquement des rectangles du PNG en prétendant disposer de coordonnées natives exactes.

## Indépendance des objets et occultation

Les bâtiments fournissent l’enveloppe et leurs éléments fixes. Les meubles et machines restent dans le [catalogue des postes](humains-postes-javascript.md), chacun avec son emplacement d’usage. L’étable est une enveloppe pour des stalles indépendantes ; la maison de soins accueille des lits vides et des patients séparés ; un chantier naval reçoit ultérieurement une coque séparée. Les outils, armes, marchandises, personnages et animaux ne sont jamais intégrés dans la toiture ou les murs.

Les roues/ailes de moulin illustrent leur emplacement architectural. Elles devront être des sous-ensembles mécaniques détachables avec pivot explicite, et non des pixels animés avec un personnage. Leurs états et collisions ne sont pas encore fabriqués.

Contrat à appliquer lors de la transcription :

1. Emprise et collisions de structure, zones praticables et raccords de modules sur un pas commun.
2. Entrée physique identifiée par bâtiment ; projection et sens d’approche propres à chacune de ses quatre vues. Aucun socket inventé au dos d’un mur fermé.
3. Composition `structure arrière → postes/acteurs/objets indépendants → structure avant`, avec toiture et murs hauts masquables pour l’intérieur. Seuils, piliers et garde-corps peuvent masquer une partie basse du personnage.
4. Masques complémentaires sans doublons, contacts/altitudes de poste conservés, réservations d’usage gérées par le moteur.
5. Anneaux et points cyan, légendes, échelle et humain de comparaison exclus des sprites. Les annotations des concepts ne sont pas des sockets mesurés.

Les sols, routes, rives, eau, herbe, arbres, sable, rochers et neige au sol sont fournis par les atlas existants. Les tabliers de pont, planchers porteurs surélevés et marches sont des structures architecturales, pas un nouveau revêtement de terrain.

## Conditions de placement et saisons

Les 83 lignes de couverture proposent des fonctions et références ; elles ne prescrivent ni quantité ni plan de quartier. Mine, carrière, moulin, pont, quai, chantier et ouvrage d’irrigation ont des conditions spécifiques inscrites dans le manifeste. Les activités à nuisance restent séparées des logements selon accès, vent, eau et sécurité. Les gisements ne sont pas placés sur la place du marché.

Murs, casernes et garnisons sont des options liées à une autorité, une mission et des réserves ; aucun hameau ne devient automatiquement un fort. Les modules servent aussi à des domaines, passages et dépôts sans fermer tout l’arrière-pays.

En Igea, la neige se limite aux couvertures exposées et rebords inutilisés ; portes, circulation et surfaces de travail restent accessibles. Les variantes dépendent de météo, biome et altitude. Elles n’ajoutent pas une couche permanente à toutes les implantations d’Igea et ne dessinent aucun sol enneigé.

## Reproduction

`python scripts/build-human-architecture-concepts.py` régénère le catalogue et les briefs texte, sans toucher aux PNG. `python scripts/build-human-architecture-gallery.py` reconstruit la galerie et les correspondances à partir de la bible actuelle. Les images sont conservées à part avec leur provenance. Ce lot n’importe aucune bibliothèque d’architecture dans le jeu principal et ne modifie aucun habitant ou atlas de terrain.
