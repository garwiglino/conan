# Hearthreaver — Univers, populations et géopolitique

Pour les fonctionnalités réellement intégrées et leurs limites, consulter [l’état réel du jeu](docs/etat-du-jeu.md). La bible ci-dessous décrit le cadre de production et les données de conception.

Direction retenue : heroic fantasy adulte, noms sobres, institutions crédibles, conflits limités et récurrents ; aucune espèce assimilée automatiquement à une faction hostile.

## Consulter le résultat

- [Bible : principes, état et méthode](docs/world-bible/README.md)
- [Pouvoirs, conflits, accords et légitimité](docs/world-bible/01-geopolitique.md)
- [Peuples, implantations, villes et sprites](docs/world-bible/02-peuples-et-villes.md)
- [54 ressources, répartition et chaînes d'approvisionnement](docs/world-bible/03-ressources-et-echanges.md)
- [Danger, patrouilles, embuscades, motifs et récurrence](docs/world-bible/04-danger-et-evenements.md)
- [Droit, corruption, contrebande, captivité et vie sociale](docs/world-bible/05-societes-et-criminalite.md)

## Registres calculés sur la carte du dépôt

- [Les 83 fiches de localité](docs/world-bible/generated/settlements.md) : identifiant conservé, position sur la carte resserrée, rôle, population, composition, ressources, besoins, voies existantes, fournisseurs possibles, autorité, patrouille, litiges, incidents admissibles et kit artistique.
- [Démographie pondérée](docs/world-bible/generated/demography.md) : chaque région, chaque territoire et le monde ; les groupes ruraux concentrés restent distincts des habitants dispersés.
- [Matrice de 54 ressources × 14 régions](docs/world-bible/generated/resources.md).
- [Les 36 relations entre les neuf acteurs de coordination](docs/world-bible/generated/relations.md).
- [Registres JSON](data/world/bible/generated/) : localités, régions, territoires, monde, ressources, relations, événements, réseaux, litiges et routes.
- [Manifeste et empreintes des sources](data/world/bible/generated/manifest.json).

La compilation courante contient 83 localités, 14 régions, 133 routes, 54 ressources, 36 relations, 17 règles d'événements et 7 familles de réseaux clandestins. Le manifeste initial ne signale aucun accès au graphe ou position/frontière à revoir. Cette vérification porte sur le rattachement des données, pas sur la construction des quartiers ou la navigabilité testée manuellement de chaque mètre du monde.

## Sources éditables

`data/world/bible/source.json` définit les espèces, les effectifs de conception, la part des localités nommées, les mélanges ruraux/urbains, les spécialités, les ressources et leurs paramètres.

`data/world/bible/relations.json` décrit chaque paire politique, les intérêts des deux parties, les échanges, les désaccords, les escalades et les issues. `data/world/bible/events.json` définit motifs, auteurs, cibles, régions, conditions, durées et cooldowns, ainsi que les réseaux locaux.

Les tableaux compacts disposent de colonnes déclarées dans chaque fichier. `settlementOverrides` permet une décision artistique/narrative particulière par identifiant réel, sans renommer ni déplacer la localité. Une correction de pourcentage conserve les six espèces et un total de 100. Ne pas modifier à la main les registres dérivés.

## Validation reproductible

```sh
python3 scripts/test-world-bible.py
python3 scripts/build-world-bible.py
python3 scripts/build-world-bible.py --check
```

Les 24 tests de régression couvrent conservation des populations, pourcentages, identifiants, matrice diplomatique, dépendances des ressources, séparation lac/port océanique, impossibilité d'un incident sans cause, transitions non aléatoires, reproductibilité et absence de fournisseurs fictifs lorsque le graphe n'existe pas.

Le workflow [World bible](.github/workflows/world-bible.yml) effectue ces contrôles puis publie les registres dérivés par un push ordinaire, jamais forcé. Il ne modifie pas les sources de l'atlas, le HTML jouable, l'app iOS ou les sauvegardes. Les empreintes du manifeste permettent de savoir si les registres correspondent encore aux sources courantes.

## Limites explicites et passage à la fabrication

Les rôles et populations sont des choix de conception. Les productions indiquent une capacité envisagée, pas un stock déjà simulé. Les fournisseurs sont des options reliées au graphe ; leurs stocks et contrats doivent être confirmés avant de créer une livraison. L'eau, le combustible et les productions domestiques sans fournisseur spécialisé sont à raccorder à l'arrière-pays et aux infrastructures du site, pas à une cargaison inventée.

Les implantations rurales concentrées sont comptabilisées mais ne sont pas de nouvelles villes placées automatiquement. Les dépôts et ateliers particuliers doivent être positionnés sur des terrains compatibles lors de la construction. Les humains et batraciens disposent de leur intégration ; les ressources visuelles des hommes-singes sont disponibles mais leurs acteurs et routines ne peuplent pas encore le monde. Les éléments manquants des autres espèces restent à fabriquer avec les ancrages artistiques approuvés.

Compiler la bible ne remplace pas à lui seul le moteur temps réel. Le jeu embarqué charge toutefois désormais ses profils via `scripts/embed-world.cjs` et attache `world-simulation.js` : stocks, contrats, pénuries, réparations financées et mandats locaux sont raccordés. La justice locale et les convois physiques sont également intégrés. Le chapitre 04 reste le contrat pour les règles supplémentaires ; diplomatie opérationnelle, mandats sélectifs complets et économie équilibrée sur une longue campagne restent à achever. Voir [le monde vivant](docs/living-world-integration.md) et [la justice et les convois](docs/world-justice.md).

## Règles à préserver lors des prochaines modifications

Sylverive reste un ensemble de cités à charte sous la souveraineté de Teremor. Les accords de commerce ne déclenchent pas une guerre automatique. Darg et Kesh ne représentent pas tous les orques ou tous les gobelins. Les enclaves ne constituent pas un empire secret. Les personnes ne figurent pas dans le catalogue des ressources. La traite et le travail sexuel adulte consenti restent distincts. Les crimes et leurs protections sont attribués à des acteurs identifiés ; un État n'est pas uniformément corrompu. Les villes connaissent aussi travail ordinaire, entraide, justice effective, fêtes et vie familiale.

## Extension jouable : batraciens

[Implantations, palettes, métiers et règles de combat des batraciens](docs/batraciens.md). Cette extension du moteur ajoute des acteurs à 14 localités compatibles, sans renommer les lieux ni remplacer les quêtes. La révision 2.0 du recensement distingue désormais les batraciens et les hommes-singes, sans modifier les acteurs existants.

## Hommes-singes

[Communautés et intérêts](docs/world-bible/06-hommes-singes.md), [programme de fabrication](docs/world-bible/generated/ape-activities.md) et [audit des branches](docs/world-bible/07-audit-branches.md). Cinq ensembles locaux, 22 sites existants, 16 fonctions et 13 structures. Les ressources visuelles couvrent désormais les 55 activités et 16 fonctions, pour deux silhouettes et cinq pelages ; voir [les tenues et activités](docs/hommes-singes-activites.md). Les 13 structures, les routines et les apparitions en jeu restent à intégrer. Le peuple ne constitue pas une dixième faction souveraine.
