# Arsenal de Kaldor

48 armes de mêlée : l’épée de départ, 39 armes sur des râteliers et huit armes portées à récupérer sur des combattants ou le Prêtre du Serpent. Huit familles et cinq territoires. Les six peuples existants ont des armes courantes et des pièces de maîtrise ; deux armes préparent les futurs centaures. Les appartenances raciales ne créent aucune hostilité ni population supplémentaire.

## Animations et calques conservés

Les nouvelles animations déplacent les **calques originaux des bras, manches, gants et mains** de chaque tenue. Les pixels, couleurs, proportions et contours restent identiques. Aucune nouvelle forme de bras ou de poing, aucun découpage au coude, aucun étirement ni rotation des membres. Les deux silhouettes déjà disjointes des vues face/dos peuvent se déplacer séparément ; un profil conserve son unique silhouette visible, l’autre prise étant occultée. Le corps sans bras vient du calque natif déjà disponible, sans effacement de morceaux du torse.

La donnée `hands` choisit une ou deux mains. Avec une main, l’autre bras garde sa position native ; avec deux, les deux prises suivent le manche, écartées davantage sur une lance, une vouge ou un bâton. Les translations restent en pixels entiers, communes aux manches et aux mains. Les cheveux, casques et corps conservent leur assemblage modulaire.

Les trajectoires des nouvelles armes sont partagées par le rendu et le balayage physique : point de prise, direction et allonge. Les estocs des lances et dagues diffèrent des tailles des sabres et épées, des balayages du bâton et des frappes pesantes des haches et masses. La lance enchaîne un estoc vif, un revers de hampe, une taille croisée et une fente longue : préparations distinctes, transfert du corps et appuis natifs, accélération sur la frappe puis reprise plus lourde. Elle conserve des durées propres à chaque coup. Les attaques ne jouent que la préparation, l’impact, l’après-impact et la garde ; les smears apparaissent sur l’impact, puis la garde retrouve le vrai idle. Le rendu conserve le cadre 80 × 80, ancré aux pieds (40,52).

Après 3,7 secondes sans attaquer ni parer, l’arme se range au milieu du dos, aussi en marchant, avec une durée adaptée à son poids. Les lances/bâtons/haches/masses sont attachés au dos ; les lames rejoignent un fourreau. L’attaque interrompt immédiatement le rangement ; la parade dégaine visuellement selon le poids, sans retarder la défense. Le rig des tenues et les casques restent réutilisés.

## Jeu et sauvegarde

Approcher un râtelier à moins de 18 pixels, puis interagir pour prendre l’arme. Elle rejoint **Inventaire → Armes**, où figurent les pièces possédées, les caractéristiques, les lieux des armes restantes et un aperçu animé tournant de Kaldor. Équiper une arme nécessite de terminer le geste de combat ou le voyage en cours ; cela ne permet pas d’annuler le délai de récupération d’un coup. L’arme trouvée n’est pas équipée automatiquement.

La sauvegarde ajoute `arsenal: {owned, equipped}`. Une ancienne sauvegarde conserve l’épée de départ ; les identifiants inconnus sont ignorés. Un râtelier pris reste vide au rechargement. Les emplacements sont fixes, vérifiés sur le terrain réel, à l’écart des tenues, PNJ et transports. Les dégâts passent par les canaux existants pour ennemis, civils et gardes, avec leurs protections, étages et règles de justice.

Les coefficients ci-dessous sont relatifs à l’épée de départ. Le quatrième coup double les dégâts de base ; le niveau et les défenses de la cible s’appliquent ensuite. La cadence affichée provient des durées réelles des quatre coups : les armes lourdes ont une préparation et une reprise plus longues. Les quatrième coups sont désormais propres à chaque arme. Certaines pièces de maîtrise manifestent une magie visuelle décrite dans leur fiche ; les dégâts suivent les règles de mêlée existantes.

## Combos et poids

Toutes les armes, y compris l’épée de départ, utilisent désormais les calques natifs et le même calcul de trajectoire pour le rendu et les collisions. Chaque famille possède quatre gestes ; la longueur, la variante, la prise et le poids adaptent chaque arme. Les quatre types de coups de la Lance de Boisclair sont conservés ; leurs trajectoires sont revues avec celles des autres armes.

- **Épées** : Taille oblique, Revers croisé, Coupe montante, Abattée.
- **Sabres** : Taille filante, Revers enroulé, Coupe remontante, Taille passante.
- **Dagues** : Entaille vive, Revers court, Estoc oblique, Pointe engagée.
- **Haches** : Taille mordante, Revers de barbe, Crochet oblique, Abattée ample.
- **Masses et marteaux** : Coup croisé, Revers lourd, Levée latérale, Abattée martelée.
- **Bâtons** : Balayage de hampe, Revers circulaire, Taille de relance, Poussée à deux mains.
- **Vouges** : Grande taille, Revers du fer, Crochet bas, Fente à la lame.
- **Lances et harpons** : estoc vif, revers de hampe, taille croisée, fente longue.

Les trois premiers coups chargent leur élan puis suivent leur trajectoire. Le quatrième utilise une frappe unique, un contact tenu, une fin de geste dans son élan puis un retrait distinct, sans nouvelle fenêtre de dégâts. Trois dessins d’attaque (préparation, impact, après-impact) et le vrai idle de garde sont joués, sans dessins intermédiaires. Les poignées traversent le corps avec le coup ; face, dos et profils ont des projections adaptées, avec une lame stable sur les estocs. Les durées sont réduites d’environ 25 %, surtout sur les transitions et la reprise, en conservant les tempos et le poids de chaque arme. Les appuis sont des poses de marche natives et les translations du corps entraînent la tête et les cheveux. La main libre suit le corps sur les armes à une main.

Les dagues ont une courte traînée ; les sabres une trace courbe ; les haches, masses et vouges gardent jusqu’à deux silhouettes de retard de l’arme, en tramage opaque. Aucun smear n’apparaît pendant la préparation ou une reprise inactive. La pause d’impact et le pas d’attaque varient aussi selon l’arme. Les dégâts des armes lourdes compensent leur moindre cadence ; les dagues restent faibles par frappe et de courte portée.

Le rangement place le **milieu de la silhouette complète sur la colonne du dos** et conserve ce point pendant le mouvement de la tenue. Les lances et bâtons sont droits et verticaux vus de profil, et restent obliques vus de dos et de face ; les autres armes conservent la diagonale de l’épée de départ. De profil, l’attache est derrière le torse. La même destination sert au rangement et au dégainage. Les durées dépendent du poids ; celles de la lance validée restent 0,33 s et 0,21 s. Le délai automatique reste 3,7 s et une attaque interrompt toujours le rangement immédiatement.

## Porteurs, butin et encart

`catalogue.json.loadouts` distingue métier de combat, peuple et rang. Un habitant sans rôle armé reste civil ; un animal ou un gardien de pierre sans arme n’en lâche aucune. Les profils sont déterministes, indépendants de la couleur du personnage. `armament` désigne l’objet porté ; le joueur conserve son propre champ `weapon`.

| Porteur | Arme courante | Arme de maîtrise |
|---|---|---|
| Humains | Lame de la milice ; Sabre des pistes pour les pillards | Épée des Chartes |
| Gobelins | Coutelas de Boisclair ; Dague de Kesh pour les éclaireurs | Marteau de Griseborne ; Crochet du maître de Kesh |
| Orques | Hache de Darg | Brise-Givre |
| Hommes-serpents | Lame d’enclave | Lame de Rosebrume |
| Batraciens | Lance de chenal, Lame de batelier, Javelot des Joncs ou Massue de chenal, selon le rôle | Lance du chef des chenaux |
| Hommes-singes | Bâton des sentiers | Garde des Palmes |
| Centaures, intégration future | Lance des grands chemins | Sarisse de l’Horizon |

Les deux armes centaures sont disponibles sur des râteliers de Sarak, aux contacts des routes et des oasis. Leur attribution future ne crée pas de centaures dans le monde ni de septième catégorie dans le recensement existant. Les gobelins, orques et hommes-serpents reçoivent aussi des profils prêts pour leurs futurs rigs ; seuls les combattants déjà intégrés sont dessinés aujourd’hui.

Les humains armés utilisent les tenues et les calques de mains natifs, avec des têtes distinctes de celle du héros. Leur préparation et leur contact restent synchronisés sur les temps de l’IA existante. Les batraciens conservent leurs clips, corps, mains, boucliers et rythmes ; un peintre optionnel remplace uniquement l’arme dans le calque d’équipement, à leur point de prise actuel. Les squelettes, cultistes et le Prêtre gardent leur animation et leur arme natives, désormais reliées à un objet du catalogue. La crosse ne donne pas les sortilèges du boss au joueur.

À la mort d’un ennemi armé, `dropCarriedWeapon` dépose son arme exacte au sol si elle manque à la collection. La mort par un garde emprunte la même logique sans donner de points d’expérience ni de victoire au joueur. Un cadavre et une arme déjà en attente ne créent pas de doublon. Les habitants non combattants n’ont aucun butin d’arme ajouté.

Le joueur ramasse le butin en passant à moins de 14 pixels, sur le même étage et avec un passage libre. L’objet rejoint l’inventaire sans changer l’arme équipée. Un petit encart non modal sur deux lignes affiche uniquement l’icône et le nom, puis la prise et les dégâts. Il apparaît au-dessus de la position de l’arme et suit les déplacements de la caméra. Les caractéristiques complètes restent dans l’inventaire. Elle se ferme après 3,2 secondes ou avec ×. Une arme déjà possédée ne génère ni butin supplémentaire ni encart. Les râteliers correspondants deviennent vides après acquisition, quelle que soit la source.

La sauvegarde ajoute `arsenal.drops` aux champs `owned` et `equipped`. Les armes au sol restent récupérables après rechargement ; identifiants inconnus, doublons, armes possédées et coordonnées invalides sont ignorés. Les anciennes sauvegardes restent valides. La crosse du Prêtre est ajoutée avant la sauvegarde de victoire, car celle-ci arrête la simulation et empêcherait un ramassage dans l’arène.

[Combattants et leurs armes animés](../art/armed-npcs.gif) · [Encart de découverte en jeu](../art/weapon-discovery.png).

## Catalogue

La cadence de l’inventaire est calculée sur les durées des quatre attaques, relativement à l’épée de départ. Les données de masse et d’équilibre servent à l’animation, sans ajouter un système d’encombrement.

| Arme | Mains | Masse | Force par frappe | Origine | Lieu ou porteur |
|---|---:|---:|---:|---|---|
| Épée de l’exilé | 2 | 1.85 kg | ×1 | Humains · Sarak | Portée au départ |
| Couteau du roulier | 1 | 0.57 kg | ×0.37 | Humains · Teremor | Campement des Exilés |
| Bâton d’aulne | 2 | 1.69 kg | ×0.72 | Humains · Teremor | Source-Claire |
| Lame de la milice | 1 | 1.56 kg | ×1.12 | Humains · Teremor | Clairval |
| Hache des Ronces | 1 | 1.55 kg | ×1.89 | Humains · Teremor | Fort-des-Ronces |
| Lance de Boisclair | 2 | 2.02 kg | ×1.12 | Gobelins · Teremor | Val-des-Mousses |
| Épée des Chartes | 1 | 1.44 kg | ×1.45 | Humains · Teremor | Aulneport |
| Marteau de Griseborne | 1 | 2.06 kg | ×2.69 | Gobelins · Sarak | Griseborne |
| Sabre des pistes | 1 | 1.05 kg | ×0.99 | Humains · Sarak | Relais-des-Dunes |
| Dague de Kesh | 1 | 0.57 kg | ×0.51 | Gobelins de Kesh · Sarak | Puits-Rouge |
| Croissant du Safran | 1 | 1.29 kg | ×1.26 | Humains · Sarak | Oasis-du-Safran |
| Vouge des Acacias | 2 | 2.86 kg | ×1.65 | Orques · Sarak | Bourg-des-Acacias |
| Lame de l’Arène | 2 | 1.85 kg | ×1.75 | Humains · Sarak | Citadelle-de-Sarak |
| Hache des cols de Darg | 2 | 2.32 kg | ×2.73 | Orques de Darg · Igea | Val-des-Neiges |
| Pic de Fort-Écho | 1 | 1.94 kg | ×2.72 | Humains · Igea | Fort-Écho |
| Lance de Pâleval | 2 | 2.26 kg | ×1.38 | Humains · Igea | Pâleval |
| Brise-Givre | 2 | 3.4 kg | ×3.91 | Orques · Igea | Veille-Boréale |
| Serment boréal | 2 | 1.97 kg | ×1.9 | Humains · Igea | Roche-Blanche |
| Coutelas des Veilleurs | 1 | 1.29 kg | ×1.17 | Humains · Varan | Port-des-Veilleurs |
| Harpon des Joncs | 2 | 2.26 kg | ×1.36 | Batraciens · Varan | Pont-des-Joncs |
| Battoir de Tourbeclaire | 1 | 1.7 kg | ×2.89 | Batraciens · Varan | Tourbeclaire |
| Lame de Rosebrume | 1 | 1.17 kg | ×1.51 | Hommes-serpents · Varan | Brume-aux-Saules |
| Vouge des Roseaux | 2 | 2.74 kg | ×1.6 | Batraciens · Varan | Bac-des-Roseaux |
| Croc d’enclave | 1 | 0.81 kg | ×0.68 | Hommes-serpents · Sarak | Roche-du-Serpent |
| Bâton des Lianes | 2 | 1.45 kg | ×1.15 | Hommes-singes · Tagon | Relais-des-Lianes |
| Lame de Santalune | 1 | 1.17 kg | ×1.38 | Hommes-singes · Tagon | Santalune |
| Lance de Palmehaute | 2 | 2.14 kg | ×1.63 | Hommes-singes · Tagon | Palmehaute |
| Hache des Coquilles | 1 | 1.91 kg | ×2.41 | Humains et hommes-singes · Tagon | Bourg-des-Coquilles |
| Aiguille de Corail | 1 | 0.45 kg | ×0.78 | Batraciens · Tagon | Rive-de-Corail |
| Garde des Palmes | 2 | 2.62 kg | ×2.05 | Hommes-singes · Tagon | Anse-des-Palmes |
| Masse du Havre | 1 | 1.94 kg | ×2.41 | Gobelins · Sarak | Havre-du-Cuivre |
| Veille des Aulnes | 2 | 1.81 kg | ×1.45 | Hommes-singes et batraciens · Varan | Refuge-des-Aulnes |
| Flamme de Clairfoyer | 2 | 1.85 kg | ×2.05 | Humains · Teremor | Campement de départ, près du spawn |
| Coutelas de Boisclair | 1 | 0.76 kg | ×0.72 | Gobelins · Teremor | Val-des-Mousses |
| Crochet du maître de Kesh | 1 | 0.84 kg | ×1.05 | Gobelins de Kesh · Sarak | Puits-Rouge |
| Hache de Darg | 2 | 2.05 kg | ×1.35 | Orques · Igea | Val-des-Neiges |
| Lame d’enclave | 1 | 1.02 kg | ×0.82 | Hommes-serpents · Varan | Brume-aux-Saules |
| Bâton des sentiers | 2 | 1.32 kg | ×0.65 | Hommes-singes · Tagon | Relais-des-Lianes |
| Lance de chenal | 1 | 1.55 kg | ×0.78 | Batraciens · Varan | Butin des gardes et sentinelles batraciens |
| Lame de batelier | 1 | 1.12 kg | ×0.86 | Batraciens · Varan | Butin des escortes batraciennes |
| Javelot des Joncs | 1 | 1.05 kg | ×0.64 | Batraciens · Varan | Butin des éclaireurs batraciens |
| Massue de chenal | 1 | 1.58 kg | ×1.12 | Batraciens · Varan | Butin des pilleurs de chenal |
| Lance du chef des chenaux | 1 | 1.88 kg | ×1.82 | Batraciens · Varan | Butin des chefs batraciens |
| Lance des grands chemins | 2 | 2.16 kg | ×1.12 | Centaures · Sarak | Relais-des-Dunes |
| Sarisse de l’Horizon | 2 | 2.98 kg | ×2.15 | Centaures · Sarak | Oasis-du-Safran |
| Lame de l’ossuaire | 1 | 1.48 kg | ×0.74 | Armes anciennes · Teremor | Butin des squelettes animés |
| Bâton du culte | 2 | 1.64 kg | ×0.82 | Culte du Serpent · Varan | Butin des cultistes |
| Crosse du Prêtre du Serpent | 2 | 2.24 kg | ×2.3 | Culte du Serpent · Varan | Butin des Prêtre du Serpent |

## Sources et reconstruction

- `data/weapons/catalogue.json` : armes, prise, puissance, tempo, matière, provenance et emplacements.
- `scripts/kaldor-weapons.js` : formes des armes, trajectoires, smears et balayage physique commun.
- `scripts/build-kaldor-weapon-layers.cjs` : export sans déformation des calques de membres déjà présents dans `art/kaldor-tenues/`.
- `data/weapons/native-arms.json` : images originales de ces calques et leurs points de prise, pour chaque tenue et vue.
- `scripts/kaldor-civilian-bridge.js` : translations des calques natifs, tenue, casque, occultation et rangement.
- `scripts/kaldor-weapons-runtime.js` : râteliers, collection, équipement, sauvegarde et inventaire.
- `scripts/kaldor-armaments.js` : armes portées, morts, butin persistant et encart de découverte.

```sh
npm run build:kaldor-weapons
node --test --test-concurrency=2 tests/kaldor-weapons.test.cjs tests/kaldor-art.test.cjs tests/kaldor-outfits.test.cjs
npm run preview:weapon-layers
npm run preview:weapons
npm run preview:armory
npm run preview:armaments
```

L’export natif ne modifie pas les sources des tenues. `build:kaldor` embarque le catalogue, les calques et les deux modules dans les HTML web et iOS. Après un changement de source de tenue, reconstruire également `build:kaldor-weapons` pour actualiser ses bras natifs.

[Aperçu demandé : Lance de Boisclair, trois tenues et quatre vues](../art/boisclair-combo-v2.gif). L’aperçu est ralenti pour lire les déplacements ; il montre les quatre attaques, la marche, le rangement et la reprise. [Atelier complet](../art/weapons-preview.html).

[Coups en six poses, face et profil à vitesse réelle](../art/armory-strikes.gif) · [Rangement centré, vue de dos](../art/armory-centered-back.png).

## Révision des frappes

`node scripts/preview-kaldor-strikes.cjs` produit `art/armory-strikes.gif` : huit familles, face et profil simultanés, quatre coups à leur cadence réelle. `art/armory-strikes.png` décompose le premier coup de face. L’atelier `art/weapons-preview.html` permet de revoir les 48 armes, les quatre orientations, le ralenti et le rangement.

### Prise des armes d’hast de face

Lances, harpons, vouges et bâtons partagent une garde diagonale. À deux mains, l’écartement de base des prises est de six pixels le long de la hampe, projetés en profondeur pendant une rotation : les mains suivent le manche et changent naturellement de côté lorsque le geste traverse le corps. Les préparations et les après-impacts gardent des côtés différents ; chaque contact converge dans l’axe devant le joueur. Le quatrième suit sa chorégraphie propre : percée, arrachement, fauchée ou tourbillon selon l’arme. Les estocs déplacent les prises dans l’axe de la pointe, avec une préparation plus engagée sur la fente finale. Les armes à une main gardent leur bras libre. Seules des translations entières des calques existants sont utilisées. Ces prises sont conservées en profil et de dos ; les cadences restent propres aux armes.

[Aperçu des prises de face](../art/pole-grips.gif) · `node scripts/preview-kaldor-strikes.cjs --pole-grips`.

La taille croisée basse est conservée en troisième position. La fin de combo devient la frappe propre à l’arme, avec une prise à une ou deux mains respectée.

## Quatrième coup propre à chaque arme

Chaque entrée de `catalogue.json` possède `finisher` : nom, geste, poussée, inclinaison, palette et manifestation magique éventuelle. Le mouvement se compose d’une charge (0–1), d’une seule délivrance (1–2), d’un contact tenu (2–3) puis d’un dépassement inertiel (3–3,5) et d’une reprise (3,5–5). La position de la main et la direction de la lame restent identiques pendant le contact : il n’y a pas de deuxième coup caché dans la pose d’impact. Les durées conservent le tempo et le poids de l’arme.

La trajectoire des tourbillons est construite à partir des quatre vues natives du joueur, sans rotation ni étirement de ses pixels ; la lecture conserve six poses franches. La hampe balaie une ellipse horizontale à hauteur de taille : le raccourcissement en profondeur concerne uniquement l’arme, et la moitié arrière du geste passe derrière le corps. La reprise de face ramène d’abord les mains à l’extérieur de la hanche, puis relève la lame hors du visage. Corps, cheveux, tête, casque et prises conservent les calques natifs. La même trajectoire complète pilote le rendu, les traînées et le balayage de collision ; le tour circulaire utilise un échantillonnage plus dense pour ne pas laisser de trous. Sur une attaque en cours, la collision balaie le saut visible de la préparation à l’impact puis reste au point de contact : les dégâts et la pause d’impact ne peuvent plus précéder visuellement l’arrivée de la lame. Le joueur ne touche une même cible qu’une fois par attaque, grâce au registre de coups existant. Les étages et la ligne de vue restent vérifiés.

Les onze pièces indiquées comme magiques projettent des éclats de givre, braises, signes de jade, embruns, grains de sable, lumière d’étoile ou sillages de vent. Ces effets restent attachés au geste et s’effacent avant l’attaque suivante. Ils ne créent ni projectile autonome ni nouvelle altération d’état : les dégâts du quatrième coup restent ceux de la mêlée, doublés comme auparavant. Les armes courantes conservent des frappes physiques et des traces de mouvement ou d’impact.

L’inventaire et l’atelier proposent le mode **4e coup**. `node scripts/preview-kaldor-finishers.cjs` produit [l’aperçu animé](../art/weapon-finishers.gif) et [la planche des 48 armes](../art/weapon-finishers.png). Cet aperçu, celui des huit familles et l’atelier reflètent la lecture en six poses.

| Arme | Quatrième coup | Mouvement | Manifestation magique |
|---|---|---|---|
| Épée de l’exilé | Brise-garde de l’exilé | Abattée | — |
| Couteau du roulier | Pointe du roulier | Percée | — |
| Bâton d’aulne | Grand revers d’aulne | Fauchée | — |
| Lame de la milice | Sentence de la milice | Abattée | — |
| Hache des Ronces | Morsure des Ronces | Crochet / arrachement | — |
| Lance de Boisclair | Percée de Boisclair | Percée | — |
| Épée des Chartes | Sceau des Chartes | Taille passante | — |
| Marteau de Griseborne | Frappe de borne | Choc lourd | — |
| Sabre des pistes | Taille de caravane | Taille passante | — |
| Dague de Kesh | Crochet des dunes | Crochet / arrachement | — |
| Croissant du Safran | Cercle du Safran | Rotation complète | — |
| Vouge des Acacias | Fauchée des Acacias | Fauchée | — |
| Lame de l’Arène | Coup du champion | Abattée | — |
| Hache des cols de Darg | Abattée des cols | Abattée | — |
| Pic de Fort-Écho | Poinçon de Fort-Écho | Choc lourd | — |
| Lance de Pâleval | Brèche de Pâleval | Percée | — |
| Brise-Givre | Fracture de givre | Choc lourd | Givre |
| Serment boréal | Serment de l’aurore | Abattée | Givre |
| Coutelas des Veilleurs | Revers des quais | Taille passante | — |
| Harpon des Joncs | Arrachement des Joncs | Crochet / arrachement | — |
| Battoir de Tourbeclaire | Choc de Tourbeclaire | Choc lourd | — |
| Lame de Rosebrume | Croissant de Rosebrume | Taille passante | Jade |
| Vouge des Roseaux | Fauchée des berges | Fauchée | — |
| Croc d’enclave | Morsure de l’enclave | Percée | Jade |
| Bâton des Lianes | Ronde des Lianes | Rotation complète | — |
| Lame de Santalune | Spirale de Santal | Rotation complète | — |
| Lance de Palmehaute | Percée de Palmehaute | Percée | — |
| Hache des Coquilles | Coupe de la Coquille | Crochet / arrachement | — |
| Aiguille de Corail | Éclat de Corail | Percée | Embruns |
| Garde des Palmes | Tourbillon des Palmes | Rotation complète | Vent |
| Masse du Havre | Choc de cuivre | Choc lourd | — |
| Veille des Aulnes | Ronde des Aulnes | Fauchée | — |
| Flamme de Clairfoyer | Brasier de Clairfoyer | Taille passante | Braises |
| Coutelas de Boisclair | Taille de noisetier | Taille passante | — |
| Crochet du maître de Kesh | Sillage du maître de Kesh | Crochet / arrachement | Sable |
| Hache de Darg | Abattée pastorale | Abattée | — |
| Lame d’enclave | Revers de bronze | Taille passante | — |
| Bâton des sentiers | Ronde forestière | Fauchée | — |
| Lance de chenal | Percée du chenal | Percée | — |
| Lame de batelier | Brise-cordage | Abattée | — |
| Javelot des Joncs | Pointe de l’éclaireur | Percée | — |
| Massue de chenal | Poids du chenal | Choc lourd | — |
| Lance du chef des chenaux | Fer du capitaine | Percée | Embruns |
| Lance des grands chemins | Charge à pied | Percée | — |
| Sarisse de l’Horizon | Cercle de l’Horizon | Rotation complète | Étoiles |
| Lame de l’ossuaire | Taille de l’ossuaire | Abattée | — |
| Bâton du culte | Revers de l’officiant | Fauchée | — |
| Crosse du Prêtre du Serpent | Sceau du Serpent | Frappe au sceau | Jade |

## Arme légendaire au départ

**Flamme de Clairfoyer** est une pièce légendaire à deux mains, disponible sur un râtelier à droite du point d’apparition réel du joueur au campement des dunes (environ 29 pixels). Son origine reste Clairfoyer, en Teremor ; elle a été confiée aux voyageurs du camp. Elle conserve sa force ×2,05 et son finisher **Brasier de Clairfoyer**. Le joueur la ramasse normalement et choisit de l’équiper ; le râtelier reste vide après l’acquisition, y compris sur une sauvegarde qui la possédait déjà à son ancien emplacement.

### Lecture en six poses

Chaque coup montre une mise en tension, la préparation extrême, l’impact, un bref prolongement et la fin du geste, avant de retrouver le vrai idle armé et sa respiration. La préparation et la récupération restent adaptées au poids et à la cadence de chaque arme ; les durées ont été raccourcies pour un rythme plus sec. Le contact reste lisible et détectable à 25 images/s.

Le smear principal apparaît sur le dessin d’impact et représente le trajet complet de l’arme. La pose immédiatement suivante conserve une courte traînée atténuée de la pointe. Les effets propres aux quatrièmes coups sont conservés, avec leurs couleurs, leurs résidus et leur profondeur derrière le corps. Les trajectoires continues servent au balayage des collisions, aux effets et aux deux poses supplémentaires. Les calques des mains, des bras et des tenues restent entiers.

### Tenue normale des lances et bâtons

Au repos et pendant la marche, les lances et bâtons sont portés en diagonale devant le torse (environ 40° au-dessus de l’horizontale), pointe relevée, au lieu d’être pointés dans la direction du déplacement. De profil, cette diagonale transversale se projette verticalement devant le torse : elle ne pointe pas vers l’avant. Sa composante verticale et le raccourcissement en profondeur sont conservés, y compris sur les prises pendant le rangement et le dégainage. La partie haute est affichée à 72 % de sa longueur de frappe, pour une silhouette plus compacte ; les coups conservent leur longueur et leur allonge. Le rangement et le dégainage interpolent cette présentation vers la silhouette rangée. La prise à deux mains place la main principale en haut et la seconde plus bas sur le même manche, avec huit pixels d’écartement. Le profil conserve l’occlusion naturelle du bras éloigné. Les trois javelots et lances à une main gardent leur bras libre.

Cette pose de port est distincte de la garde de combat : coups, parade et poses de préparation restent inchangés. Le rangement et le dégainage partent de cette tenue normale ; dans le dos, la hampe est verticale de profil et diagonale de dos. Les bras et manches des onze tenues restent des images entières déplacées sans déformation.

[Aperçu de la tenue normale dans les quatre vues](../art/pole-carry.gif) · `node scripts/preview-kaldor-pole-carry.cjs`.

### Révision de la pose d’impact et références d’animation

La pose affichée à l’impact doit être le contact lisible avec la cible. Une traversée latérale ou une remontée n’est plus retenue comme dessin d’impact. Les 48 armes, quatre coups et quatre directions placent leur extrémité active sur l’axe devant le joueur : vers le bas de face, vers le haut de dos, vers la droite ou la gauche dans les profils. Le torse, les mains et les appuis restent des calques natifs, déplacés sans étirement.

Les préparations conservent leur contraste et le poids de l’arme ; les tailles dépassent l’axe dans l’après-impact, les estocs finissent leur extension dans leur axe avant le retrait. Le revers de lance frappe désormais avec l’extrémité dirigée vers la cible. Les tourbillons gardent leur ellipse, leur volume de collision et les résidus arrière masqués par le corps, mais terminent devant le joueur. Le contact reste tenu une seule fois. Smears et effets magiques sont calculés sur la même géométrie que les coups.

Références consultées : [Animation Mentor — Anticipation](https://www.animationmentor.com/blog/anticipation-the-12-basic-principles-of-animation/) pour la relation entre préparation, énergie et vitesse ; [AnimSchool — Pushing Poses Through Iteration](https://blog.animschool.edu/2018/08/06/pushing-poses-through-iteration/) pour l’intention, la ligne d’action, la silhouette et le contraste. Le centrage de l’impact est notre application de ces principes à la lecture en six poses de ce jeu, pas une règle universelle imposée à toute animation de combat.

[Comparaison avant/après dans le compositeur natif](../art/weapon-impact-before-after.png) · `node scripts/preview-kaldor-impact-alignment.cjs`. Les tests `kaldor-impact-alignment.test.cjs` couvrent les 768 contacts, la collision pendant le contact tenu et le rendu des trois poses d’attaque dans les quatre vues.

### Impacts uniques, raccords du combo et hit stop

Chaque attaque émet maintenant un seul événement de dégâts au premier tick qui affiche le dessin d’impact (`sample === 2`). Les phases logiques 2 et 3 maintiennent ce même dessin ; elles ne déclenchent pas de nouvelle frappe. Le même verrou passe par `hits` pour les monstres, civils, gardes humains, gardes batraciens et objets cassables. Plusieurs cibles présentes au contact peuvent être touchées ensemble ; une arrivée tardive ne l’est pas. La trajectoire balayée et le smear restent ceux de la préparation vers l’impact, sans collision de récupération.

Le dessin d’après-impact conserve maintenant un vrai dépassement après les tailles et une extension terminale dans l’axe après les estocs. Il reste distinct du contact et de la préparation suivante. Un nouvel appui mémorisé attend la fin du budget de récupération avant d’enchaîner, sans retour intermédiaire à la garde. Ce budget est au minimum de 58 ms + 12 ms par kilogramme, avec 14 ms supplémentaires au quatrième coup, plafonné à 115 ms pour ce minimum ; les récupérations déjà plus lourdes gardent leur durée. Sans commande, le joueur retrouve son repos ; le quatrième coup conserve sa récupération propre. Les quatre vues emploient leurs poses natives et la direction reste verrouillée pendant chaque attaque. Aucun bras ni vêtement n’est étiré ou redessiné.

Le hit stop de contact dure 25 à 65 ms selon la masse et le coup final. Il suspend la simulation de combat, la victime et les effets avec le joueur, conserve les entrées du combo, puis consomme seulement le temps restant du tick à la reprise. Une frappe dans le vide ne provoque pas de pause. Les dégâts ne se réémettent pas pendant cet arrêt.

Références consultées : [Eric Williams, Combat Canceled: God of War & Action Game Design](https://www.gamedeveloper.com/game-platforms/combat-canceled-i-god-of-war-i-action-game-design) pour les fenêtres d’enchaînement et les commandes mémorisées ; [Jiesang Song, Improving the Combat ‘Impact’ Of Action Games](https://www.gamedeveloper.com/audio/improving-the-combat-impact-of-action-games) pour la pause sur une pose de contact lisible et le lien visuel assuré par les traînées. Les calques existants de Kaldor restent intacts ; la lecture actuelle ajoute deux dessins brefs.

Une secousse de caméra de 65 à 90 ms accompagne le contact confirmé : un pixel de jeu au maximum, légèrement pondéré par la masse et le dernier coup. Elle ne se cumule pas entre les victimes d’une même frappe, décroît aussi pendant le hit stop, respecte la préférence de mouvement réduit et ne renforce pas les secousses plus fortes déjà utilisées quand le joueur est blessé.

### Lecture du momentum et de l’après-impact

La préparation et la livraison conservent leurs timings secs. La récupération est une pose lisible à part entière : appui encore engagé, main et lame qui terminent la trajectoire, tête et cheveux en retard sur l’impulsion. Le combo ne peut plus la supprimer après un seul affichage. `canChain` ne s’ouvre qu’après la phase de récupération ; le démarrage par fin de cooldown attend aussi la fin de l’attaque, afin de ne pas contourner ce verrou. Le hit stop, la secousse et les dégâts restent liés au contact, sans nouveaux dégâts dans l’après-impact. Aucun dessin intermédiaire n’est ajouté.

Références : [Drew Adams, Follow-through and Overlapping Action](https://www.animationmentor.com/blog/follow-through-and-overlapping-action-the-12-basic-principles-of-animation/) pour la poursuite du mouvement après l’impulsion et les réponses différentes selon la masse ; [Jonathan Cooper, The 12 principles of animation in video games](https://www.gamedeveloper.com/production/the-12-principles-of-animation-in-video-games) pour la récupération et les points de reprise du contrôle. La durée minimale choisie est un réglage de ce jeu, vérifié à 25, 60 et 120 images par seconde, pas une durée prescrite par ces sources.

[Planche des quatre vues](../art/weapon-followthrough.png) · [Combos à vitesse réelle](../art/armory-strikes.gif).

### Commandes d’attaque : appuis distincts et mémoire d’un coup

Maintenir le bouton ne répète plus les attaques. Chaque nouvel appui peut démarrer un coup ou réserver le suivant pendant l’animation en cours, même au début d’une préparation lourde. Cette mémoire conserve une seule attaque et sa direction ; les appuis supplémentaires ne créent pas de file de coups. L’enchaînement attend la fin de l’après-impact (`canChain`), et le quatrième coup attend également sa fin d’animation et son cooldown avant un nouveau cycle. Un appui pendant le hit stop reste mémorisé. Les interruptions déjà prévues (blessure, esquive, mort) annulent cette mémoire.

### Arcs de pointe et dépassement inertiel

La trajectoire suivie est celle de l’extrémité active, `h + u × reach`. Le diagnostic de la version 8199c14 trouvait 186 fins de coupe de moins de 30° et 36 inversions de rotation après le contact, parmi 524 coupes ordinaires projetées. Le nouvel après-impact prolonge le sens de la frappe : environ 104–126° pour les tailles courantes, 164–176° pour le revers de profil qui enveloppe l’épaule, et 155–174° pour les remontées de face/dos. La masse module ces amplitudes ; les mains se déplacent avec l’arme et le corps rejoint son appui. La partie du revers qui passe derrière le personnage est dessinée derrière son corps.

La livraison et le dépassement ordinaires utilisent deux courbes d’Hermite avec une tangente commune au contact, aussi bien pour la prise que pour l’orientation. Le suivi de pointe ne présente donc pas de cassure à l’impact. Les grands manches gardent une petite marge dans leur cellule de face pour que la limite du dessin n’arrête pas leur trajectoire sur le contact. Les estocs restent rectilignes et finissent leur extension avant le retrait. Les tourbillons poursuivent une ellipse aplatie à hauteur de taille ; ils ne deviennent pas des roues verticales devant le visage.

La reprise conserve le passage extérieur à l’épaule avant le retour à la garde. La main du troisième coup de profil recharge à proximité de la fin du revers, pour éviter de sauter jusqu’à l’autre hanche. Deux dessins brefs sont désormais ajoutés sur ces mêmes courbes : mise en tension avant la préparation et prolongement entre le contact et l’après-impact extrême. Le timing, l’appui distinct par attaque, la mémoire d’un seul coup, le verrou d’après-impact, les dégâts uniques au contact, le hit stop et la petite secousse restent en vigueur.

Référence principale : [Anthony Wong, Arc: The 12 Basic Principles of Animation](https://www.animationmentor.com/blog/arc-the-12-basic-principles-of-animation/), notamment le suivi de pointe et la signature des arcs selon la masse. La tangente commune et les amplitudes ci-dessus sont nos choix d’adaptation à ce jeu, pas des valeurs prescrites par cet article.

[Tracés avant/après dans les quatre vues](../art/weapon-arcs.png) · `node scripts/preview-kaldor-arcs.cjs`. Les tests `kaldor-arcs.test.cjs` vérifient le sens du dépassement, sa lisibilité géométrique, la continuité de la pointe et l’ellipse des tourbillons.

### Amplitude des poses de préparation et de fin

L’amplitude de la lame conserve sa charge, sa traversée et son dépassement. La préparation ajoute un court recul de 2 à 3 pixels, puis les prises restent autour des épaules et du torse. Les tailles de profil terminent vers l’autre hanche ; les remontées et les revers se prolongent à l’extérieur de l’épaule. Le corps accompagne le geste avec un déplacement limité à trois pixels. Les mains, bras et manches restent leurs images originales simplement déplacées.

Les fentes gardent une lame stable dans leur axe et chargent plus loin en arrière. La préparation de la fente finale de profil place les mains légèrement plus haut, pour qu’elle se distingue du petit estoc. Les tourbillons partent d’une charge supplémentaire sur leur ellipse et poursuivent plus loin leur fin circulaire. Les retours qui restent déjà hors de l’épaule prennent le chemin court vers la garde ; une récupération ne rajoute pas de tour devant le visage.

[Poses réelles : préparation / impact / fin du geste dans les quatre vues](../art/weapon-followthrough.png). La planche ne remplace pas l’amplitude par un tracé : ce sont les mêmes poses natives qui sont jouées dans le jeu. Les 192 couples arme/vue gardent leurs quatre coups distincts.


### Deux poses brèves pour l’anticipation et le prolongement

La lecture joue désormais six poses : mise en tension (`0,75`), préparation extrême (`1`), contact (`2`), prolongement (`2,25` ou `3,0625` pour le quatrième coup), fin du geste (`3,5`) et repos natif (`5`). Les coordonnées désignent la trajectoire, pas des secondes. La première pose dure 65–85 ms, puis la charge reste visible au moins 62,5 ms. Le contact dispose seul de sa fenêtre d’au moins 45 ms. Le prolongement dure 51,25–68,75 ms selon la masse, puis la fin extrême conserve son temps de freinage propre. Il n’ajoute aucun dégât et n’efface pas l’après-impact en cas de spam. Le smear principal reste au contact ; la pose suivante porte une traînée plus étroite, sombre et tramée, sans silhouette fantôme entière. Elle suit le même arc et disparaît sur la fin du geste. Les effets finaux conservent leur enveloppe.

Les poses supplémentaires sont prises sur les trajectoires signées existantes : le prolongement se situe après le contact, avant le dépassement extrême, sans inversion. Les estocs restent dans leur axe et les tourbillons gardent leur ellipse à hauteur de taille. Les bras, vêtements et mains restent des images natives déplacées sans déformation.

Références consultées : [Animation Mentor — Anticipation](https://www.animationmentor.com/blog/anticipation-the-12-basic-principles-of-animation/) pour la mise en tension adaptée à l’énergie du coup ; [Animation Mentor — Follow-through and Overlapping Action](https://www.animationmentor.com/blog/follow-through-and-overlapping-action-the-12-basic-principles-of-animation/) pour la poursuite du mouvement et le freinage selon la masse. Les six dessins et leurs durées sont notre adaptation au jeu mobile.


### Précision du combat et aide à la visée mobile

Chaque nouvel appui ou coup mémorisé réévalue les ennemis visibles : un adversaire atteignable passe avant une cible lointaine simplement mieux alignée. Avec le stick, le cône de direction reste prioritaire ; sans direction, les ennemis proches peuvent être repris autour du joueur. Un obstacle, un étage différent ou la disparition de la cible invalident le verrou. Les civils neutres ne sont pas sélectionnés automatiquement.

La vue native du personnage reste fixe pendant le coup. Pendant la préparation, une correction de direction de l’arme, limitée à 25 degrés et à quatre pixels de déplacement des prises, accompagne la cible sélectionnée. Elle se fige à l’impact, conserve la courbe du prolongement et disparaît dans le retour à la garde. Aucun bras, vêtement ou corps n’est étiré ni tourné : seuls l’arme et les positions des images intactes des mains changent. Les tourbillons conservent leur ellipse horizontale. Le cache des dessins distingue les visées et les PNJ gardent leur propre contexte graphique.

`combatPose` fournit la même pose au dessin des armes, aux prises, aux effets et aux collisions. Le smear principal représente le balayage jusqu’au premier dessin de prolongement ; ce même intervalle est résolu lors de l’unique événement d’impact. Le smear résiduel reprend ensuite cette fin de trajectoire, sans rouvrir de dégâts. Les cibles arrivées plus tard restent intactes ; les parades, les obstacles et les étages conservent leurs règles.

Les civils gardent leur protection contre les dégâts répétés des autres PNJ, mais cette invulnérabilité ne masque plus les coups distincts du joueur. Le registre commun des victimes d’un coup continue d’interdire les doubles dégâts. Les tests `kaldor-combat-precision.test.cjs` couvrent le choix proche/lointain, le changement de cible, les murs, les diagonales, le suivi puis le verrouillage, le balayage visible, les civils et le compositeur natif.

[Comparaison native du contact en diagonale](../art/combat-precision.png) · `node scripts/preview-kaldor-precision.cjs`.

La carte isométrique conserve les positions logiques : les vecteurs du stick, les distances de visée et les candidats sont projetés une seule fois pour les comparer aux poses natives en pixels écran. Les déplacements, les sauvegardes et les tests de visibilité utilisent toujours les coordonnées logiques. Un test de combat réel vérifie les contacts diagonaux dans les quatre vues avec cette projection.


### Gestes plus compacts, appuis plus calmes

La trajectoire angulaire et le sens des tailles sont conservés, avec une vitesse continue au passage du contact. Le centre des prises reste près des épaules et du torse ; les lames relevées passent à l’extérieur de la tête. Les mains peuvent traverser le corps, mais les manches natives ne sont plus transportées loin dans le vide. Les prises à deux mains restent sur le manche, sans découpe, étirement ni rotation des images de bras.

Le corps se déplace de trois pixels au maximum, la tête reste à un pixel du déplacement du torse, et les cheveux n’ajoutent qu’un pixel d’inertie. L’après-impact conserve l’appui de pied du contact au lieu de passer brusquement à une autre image de marche. L’impulsion physique du joueur est réduite de 20 % sur les coups ordinaires et de 28 % sur le quatrième ; la préparation et le freinage disposent d’un peu plus de temps. La pose d’impact, ses dégâts uniques, son smear et la petite traînée suivante sont conservés. Le poids relatif des armes, les quatre vues et l’assistance de visée isométrique restent actifs.

`kaldor-compact-motion.test.cjs` vérifie les prises proches du corps, la stabilité de la tête et du torse, ainsi que la conservation des appuis au passage en après-impact pour les 48 armes.

Le ralentissement global multiplie par 1,25 les durées de préparation, de continuation et de récupération de toutes les armes et de leurs quatre coups. Les proportions entre armes sont conservées pour ces phases. La durée du dessin d’impact reste strictement identique, avec ses smears et sa fenêtre unique de dégâts : le poids vient de la préparation et du freinage, sans étirer le contact.
