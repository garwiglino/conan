# Hearthreaver — Bible du monde

Version de conception 2.0 — 18 octobre 2026. Révision explicite à six espèces, incluant batraciens et hommes-singes.

Cette bible formalise la direction approuvée : sword-and-sorcery adulte, noms sobres, sociétés fonctionnelles, intérêts contradictoires et conflits limités. Elle remplace les propositions antérieures de guerre générale Teremor–Sylverive et d'alliances automatiques entre territoires.

## Ordre de lecture et sources

1. `01-geopolitique.md` : pouvoirs, institutions, conflits, accords, relations entre tous les acteurs.
2. `02-peuples-et-villes.md` : démographie, espèces, statut, implantations, urbanisme, fabrication des sprites.
3. `03-ressources-et-echanges.md` : catalogue matériel, distribution, production, besoins, chaînes et commerce.
4. `04-danger-et-evenements.md` : événements causaux, cibles, fréquence, patrouilles, embuscades et contrat d'intégration.
5. `05-societes-et-criminalite.md` : droit, corruption, contrebande, captivité et conséquences sociales.
6. `06-hommes-singes.md` : communautés, intérêts, structures, relations et programme de fabrication.
7. `data/world/bible/ape-folk.json` : référentiel validé des activités, métiers, implantations et contacts.
8. `data/world/bible/source.json` : paramètres numériques et référentiels structurés.
9. `scripts/build-world-bible.py` : compilation déterministe, vérification et export des fiches de toutes les localités de l'atlas.

Les documents définissent le sens des champs. Les paramètres chiffrés de `source.json` sont la source des calculs. Les fichiers du répertoire `data/world/bible/generated/` et les registres Markdown produits sont dérivés : on corrige la source ou une dérogation de localité, puis on reconstruit.

## Géographie et compatibilité

Igea, Teremor et Sarak restent une seule masse terrestre ; Varan et Tagon sont des îles. Les 14 régions et les localités déjà présentes dans `data/world/atlas.json` conservent leurs identifiants, leurs noms et leurs coordonnées. Aucun renommage automatique, déplacement de ville, effacement de sauvegarde ou changement de sprite n'est autorisé par cette bible.

Le compilateur lit les localités réellement présentes ; il n'invente pas une liste parallèle à partir des anciens noms du README. Il distingue ports océaniques, sites au bord d'un lac, débarcadères de service et capitales administratives. Un statut de capitale importé de la carte ne crée pas à lui seul un royaume indépendant.

Les chiffres de population de l'atlas sont conservés comme données historiques de conception, non comme recensement vérifié. Les pourcentages sont des décisions de conception. Les effectifs utilisés pour pondérer ces pourcentages sont explicitement séparés des acteurs réellement affichés en jeu.

## Invariants

- Espèce, culture, autorité, métier, statut juridique et comportement sont des dimensions distinctes.
- Sylverive reconnaît la souveraineté de Teremor : ses cités disposent de chartes, pas d'une indépendance étrangère uniforme.
- Un pacte commercial n'oblige pas à entrer en guerre. Les clauses d'assistance ont un objet, un territoire et une durée.
- La présence d'une espèce minoritaire ne produit jamais une hausse de danger.
- Les populations ordinaires mangent, travaillent, commercent et se reproduisent ; le pillage ne nourrit pas seul un peuple entier.
- Abondance naturelle, ressource accessible, capacité productive, stock et exportation sont cinq mesures différentes.
- Une juridiction peut être sûre contre les brigands et pratiquer une oppression légale. Cette oppression n'est pas une aura de combat.
- Les ressources cataloguées sont des biens matériels. Les personnes, captifs et travailleurs forcés ne sont jamais une ressource de l'inventaire économique.
- Les violences ciblées relèvent d'acteurs et d'actes documentés, jamais d'une culpabilité collective d'espèce.
- Les événements ont des causes, des responsables, des cibles et des fins. Une date fixe ne suffit pas à créer une guerre, une disparition ou une pénurie.
- Les phénomènes magiques restent rares et localisés ; ils ne remplacent pas gratuitement agriculture, transports ou main-d'œuvre.
- Les conflits ne sont pas tous matériels : serments, reconnaissance, successions, lieux religieux et réputation politique comptent réellement.

## État livré et état du jeu

La bible constitue un référentiel de conception compilable. Le jeu embarqué en utilise désormais les profils pour une simulation économique causale : stocks, contrats, pénuries, réparations et patrouilles financées. Justice locale, convois physiques et vie locale sont intégrés. Les intérieurs des villes, la diplomatie opérationnelle et le peuplement complet restent à construire ; l’économie n’est pas déclarée équilibrée sur de très longues campagnes. Voir [l’état réel du jeu](../etat-du-jeu.md) pour la distinction entre jeu, ressources visuelles et conception.

Les branches anciennes du moteur emploient des schémas d'atlas et des noms d'événements différents. Le contrat d'intégration les distingue ; l'adaptateur doit lire le registre effectif et refuser un type absent plutôt que deviner. Les données narratives restent utilisables pour la conception. Toute activation supplémentaire doit passer les contrôles du chapitre 04 et les tests de sauvegarde, voyage et sécurité existants. La compilation de la bible seule ne réembarque pas le jeu : cette étape passe par `scripts/embed-world.cjs`.

## Construction et vérification

Exécuter depuis la racine :

```sh
python3 scripts/build-world-bible.py
python3 scripts/build-world-bible.py --check
```

La compilation génère un manifeste lié au SHA-256 de l'atlas, une fiche par localité, les agrégats démographiques pondérés, la matrice complète des relations, la distribution régionale des ressources et les événements applicables par site/route. Elle ne modifie ni `atlas.json`, ni `index.html`, ni le jeu iOS.

Tout ajout ultérieur d'espèce, ressource, faction, ville ou événement doit disposer d'un identifiant stable, d'une définition sociale ou matérielle, d'un rattachement géographique, de relations explicites et d'une validation des références. Le générateur n'est pas autorisé à attribuer arbitrairement une guerre à un nouvel acteur.

## Révision hommes-singes

L’audit des 16 branches distantes est conservé dans [le rapport](07-audit-branches.md) et dans `data/world/bible/branch-audit.json`. Le total de 5 450 000 habitants de conception reste inchangé. Le générateur publie aussi `generated/ape-folk.json` et [le catalogue des 55 activités, 16 fonctions et 13 structures](generated/ape-activities.md). Au-delà des quatre clips de base, le module visuel couvre désormais les 55 activités et 16 fonctions, les deux silhouettes et les cinq pelages ; voir [les tenues et activités](../hommes-singes-activites.md). Les statuts du catalogue conservent le plan initial de conception. Les structures et comportements restent à intégrer, et aucun nouvel acteur homme-singe n’apparaît automatiquement dans les HTML.
