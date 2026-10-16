# 02 — Peuples, démographie, villes et sprites

## Ce que mesurent les pourcentages

Les pourcentages de cette bible sont des cibles de conception, pas des recensements découverts dans le code. Quatre espèces démographiques : `human`, `goblin`, `orc`, `serpentfolk`. Les fées, squelettes animés, gardiens, animaux, visiteurs et soldats de passage sont exclus du dénominateur des résidents permanents.

La population est comptée à trois échelles : localité nommée, arrière-pays, région. Le total régional égale les résidents des localités plus ceux des habitats non nommés. Le total territorial additionne les régions, sans compter Sylverive une seconde fois comme un autre territoire. Les pourcentages territoriaux et mondiaux sont calculés sur les effectifs, jamais par moyenne simple de pourcentages de villages.

Chaque région possède dans `source.json` un effectif de conception, une fraction affectée aux localités nommées et un mélange rural. L'effectif restant appartient aux hameaux, domaines, exploitations, campements durables et enclaves de l'arrière-pays. Le compilateur répartit les résidents nommés entre les localités selon les poids de population hérités de l'atlas, puis arrondit par plus forts restes. Tous les habitants sont conservés ; aucun arrondissement ne crée ou ne supprime une espèce régionale.

Un pourcentage de résidents n'est ni un quota d'ennemis, ni une proportion de gardes, ni une probabilité de rencontre à chaque tuile. Une enclave peuplée peut représenter une minorité régionale importante sans que ses habitants se trouvent dans toutes les rues. Les visiteurs sont une couche distincte dépendant d'un itinéraire, d'un métier et d'un motif.

## Répartition des arrière-pays

Ordre : humains / gobelins / orques / hommes-serpents. Les colonnes totalisent 100 % pour chaque ligne. Les localités urbaines utilisent leur propre profil, généralement plus humain ; le compilateur publie le résultat combiné exact.

| Région | Répartition rurale (%) | Implantation à dessiner |
|---|---|---|
| Pâlerive | 87 / 10 / 3 / 0 | Vallées habitées, pêche, petites exploitations et communautés mixtes |
| Haut-Givre | 81 / 7 / 12 / 0 | Habitats concentrés dans les accès viables ; vastes espaces non peuplés |
| Givreval | 65 / 10 / 25 / 0 | Communautés orques regroupées dans les piémonts et vallées, non uniformes |
| Boisclair | 88 / 11 / 1 / 0 | Villages forestiers et agricoles ; communautés gobelines anciennes |
| Valdorne | 91 / 8 / 1 / 0 | Bassins agricoles denses, bourgs de marché et domaines |
| Sylverive | 89 / 8 / 3 / 0 | Arrière-pays portuaires, artisans, marins établis et réseaux familiaux |
| Aulneval | 90 / 9 / 1 / 0 | Cultures, élevage, bourgs d'échange et habitats dispersés |
| Roche-Sèche | 73 / 14 / 12 / 1 | Districts de production, pistes secondaires et habitats chauds protégés |
| Sables-Rouges | 78 / 18 / 4 / 0 | Oasis et reliefs habités ; implantation principale de certaines communautés de Kesh |
| Safrane | 88 / 9 / 2 / 1 | Bassins irrigués et marchés ; enclaves rares disposant d'eau |
| Brumeraie | 76 / 12 / 2 / 10 | Cités d'accès, villages et enclaves intérieures séparées |
| Rosebrume | 70 / 10 / 2 / 18 | Communautés serpentines plus nombreuses mais concentrées dans des habitats adaptés |
| Coralune | 89 / 6 / 2 / 3 | Côtes et arrière-pays cultivés ; petites communautés de contact |
| Palmeraie | 85 / 7 / 2 / 6 | Habitats forestiers, exploitations et enclaves isolées |

Zéro signifie absence de communauté permanente dans cette catégorie de la première version ; ce n'est pas une interdiction physique de voyage. Les hommes-serpents ont une contrainte thermique réelle, contrairement aux limites surtout sociales, foncières ou économiques des autres espèces.

## Habitats et concentration

**Humains :** présents dans les cinq territoires, avec des cultures locales distinctes et des diasporas surtout aux ports et grands marchés. Pas de morphologie ou de moralité nationale obligatoire.

**Gobelins :** villages, quartiers, carrières et vallées ; agriculture, élevage, artisanat et commerce. Les vêtements et équipements sont adaptés à leur corps, pas systématiquement des déchets humains. Les droits sur la terre et les relations locales expliquent leurs implantations. Quelques communautés peuvent être majoritaires localement alors que le territoire reste majoritairement humain.

**Orques :** noyaux importants en Givreval et au nord de Sarak, hameaux et individus ailleurs. Leurs économies comprennent élevage, cultures, métallurgie et services armés. Les orques urbains n'adoptent pas obligatoirement le costume pastoral de Darg. Le passage d'un troupeau ne transforme pas la répartition permanente d'un bourg.

**Hommes-serpents :** enclaves de l'intérieur chaud de Varan, quelques habitats à Tagon et sites spécifiques de Sarak. Eau, chaleur et aménagement adapté sont requis. Leurs contacts dans une ville peuvent être temporaires ; la présence d'une enclave régionale ne force pas une population urbaine serpentine. Aucun empire secret commun.

Le générateur crée des indications d'implantation rurale, non des apparitions automatiques. Toute nouvelle enclave doit avoir accès à l'eau, à la nourriture, à des échanges et à un abri adapté. Son emplacement détaillé reste un objet d'aménagement à placer sur un sol vérifié, pas un déplacement de la ville voisine.

## Comment chaque localité reçoit une fiche

Chaque fiche conserve `atlasId`, nom, coordonnées, région, territoire et propriétés sources. Elle ajoute : autorité de coordination, juridiction locale, rôle économique, effectif de conception, effectifs et pourcentages par espèce, présence temporaire, ressources de l'arrière-pays, productions transformées, besoins, contraintes d'implantation, liaisons accessibles, patrouille responsable, litiges pertinents, événements éligibles et kit artistique.

Le statut de port océanique vient du champ explicite `oceanPort` ou du registre `atlas.ports`, jamais du seul booléen/numéro `port` qui peut désigner un lac dans l'export historique. Le compilateur distingue `ocean_port`, `inland_waterfront` et `inland`.

Une route et sa relation à une ville sont extraites des extrémités et sommets du graphe ou d'une proximité géométrique vérifiée. Un site n'obtient pas un port, un fleuve, une route ou un pont uniquement parce que son nom les suggère. Les liaisons à créer restent indiquées comme projets non intégrés.

Les rôles initiaux sont des fonctions de production, pas des villes déjà dessinées : centre administratif, port de commerce, marché agricole, marché du métal, centre textile, relais pastoral, dépôt forestier et halte d'échange. Un marché du métal n'implique pas un gisement sous la place centrale. Ses minerais peuvent provenir d'un district de l'arrière-pays ; la localisation du gisement doit être validée séparément.

Les localités de l'atlas qui utilisent encore des bâtiments de relais restent des relais en jeu tant que leurs quartiers n'ont pas été fabriqués. `designRole` n'altère pas silencieusement `runtimeKind`.

## Règles de placement et de construction

1. Conserver le point existant de la localité comme référence d'accès. Étendre le tissu bâti autour d'un terrain praticable plutôt que déplacer ce point.
2. Définir un accès à l'eau, une ressource alimentaire ou un approvisionnement régulier, un accès commercial et un motif historique d'installation.
3. Distinguer terres cultivées, réserves, habitations, ateliers à nuisance, place de marché, bâtiments publics et défense. Une enceinte ne protège pas tout l'arrière-pays.
4. Placer forges, fours et tanneries selon leurs besoins et nuisances ; ne pas mettre tous les ateliers sur les mêmes trois cases décoratives.
5. Pour un port, séparer le point de localité de l'embarcadère réel et utiliser l'accès déjà généré. Les navires restent sur l'eau.
6. Placer les postes de patrouille aux accès et relais pertinents. Les gardes ne se matérialisent pas derrière le joueur pour justifier un score abstrait.
7. Réserver des refuges et des itinéraires de repli aux civils. Les points de travail et de service respectent les règles existantes de distance aux ennemis.

Les domaines ruraux et habitats minoritaires ne reçoivent pas tous une enceinte ni une garnison permanente. Une garnison est alimentée par un budget, une mission et un stock ; une ville riche peut protéger davantage les entrepôts que les hameaux voisins, sans que tous ses dirigeants soient des criminels.

## Mobilité, absence et retour

Un résident conserve son identifiant lorsqu'il se réfugie, travaille ailleurs ou rejoint le groupe. Les résidents déplacés sont comptés à destination comme déplacés temporaires tant qu'une installation permanente n'est pas actée. Le village d'origine n'est pas artificiellement repeuplé à chaque chargement.

Une évacuation temporaire modifie la présence, pas le recensement canonique. Un décès, une installation durable ou un départ définitif modifie un registre de campagne séparé. La somme des migrants aux deux extrémités doit être conservée. Les compagnons restent sous les règles du groupe.

## Traduction en sprites

Les kits reprennent les familles climatiques existantes : tempéré, aride, neige, jungle et marais. Ajouter métier, niveau de moyens, âge adulte, autorité de service et adaptation au déplacement. Ne pas réinventer des corps ou des ancrages avant d'avoir relu les fichiers artistiques approuvés.

| Ensemble | Civils prioritaires | Corps armés | Matières et accessoires |
|---|---|---|---|
| Teremor | Cultivateurs, artisans, rouliers, administrateurs | Garnison royale, garde seigneuriale, milice | Laine, lin, cuir, fer ; outils du métier |
| Sylverive | Dockers, charpentiers, négociants, ouvriers du textile | Garde de cité, escorte contractuelle | Tenues de travail portuaire, registres, cordages |
| Igea | Éleveurs, mineurs, pêcheurs, forestiers | Maisonnée armée, garde de passage | Couches de laine, fourrure selon saison, outils de mine |
| Sarak | Irrigants, cultivateurs, caravaniers, artisans | Soldats urbains, cavaliers, escorte de piste | Tissus couvrants, gourdes, protections contre la poussière |
| Varan | Bateliers, producteurs, bûcherons, mineurs | Garde portuaire et locale | Protections contre l'humidité, équipements de navigation locale |
| Tagon | Marins, artisans navals, cultivateurs, forestiers | Garde portuaire, équipage armé | Fibres, cordages, outils navals et vêtements adaptés |

Un contrebandier porte d'abord sa tenue de marin, de marchand ou de roulier. Un responsable de traite n'a pas un uniforme révélant son crime. Les travailleurs du sexe sont des adultes habillés selon leur milieu et leur activité ; ils ne constituent pas une catégorie d'ennemis ou un modèle automatiquement dénudé.

Pour chaque espèce nouvelle : corps et ancrage approuvés, quatre/huit directions compatibles avec le moteur concerné, marche, repos, parole, travail, fuite, blessure et comportements sociaux avant de multiplier les variantes de combat. Ne pas transformer la démographie entière en liste de monstres.
