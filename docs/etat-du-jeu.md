# État réel du jeu — 18 octobre 2026

Cette page décrit les fonctionnalités présentes dans les sources et les HTML web/iOS du dépôt. Elle ne garantit pas leur publication sur le site ni leur installation sur un iPhone. La bible décrit le cadre de conception ; une entrée de catalogue ou une animation disponible ne signifie pas que son comportement est activé dans le monde.

## Aventure et exploration jouables

- Kaldor commence au Campement des Exilés avec la fée. Elyne, à proximité, rejoint le groupe au premier dialogue. La prison de test a été retirée ; l'escorte vers le Refuge des Veilleurs et le retour à Clairfoyer ne sont pas imposés.
- Les trois sceaux, la porte du Temple du Serpent, les quêtes du Veilleur et de Zahra, les stèles, coffres, colosses et le Prêtre de Nharos restent jouables. Vaincre le Prêtre libère le temple et permet de poursuivre l'exploration.
- Le monde mesure 72 × 48 km, à 16 pixels par mètre, avec 14 régions, 83 localités et 133 routes dans l'atlas. Igea, Teremor et Sarak partagent le continent ; Varan et Tagon sont des îles.
- Terrain déterministe chargé autour du joueur, routes et ponts, frontières naturelles, carte, brouillard de guerre et suivi de destination sont intégrés. Les localités restent principalement des relais : les quartiers, intérieurs et quêtes propres à chacune ne sont pas construits.

Sources : `index.html`, `scripts/world-model.js`, `scripts/world-runtime.js`, `scripts/world-exploration.js`. Détails : [monde et voyages](world.md).

## Horloge, besoins et voyages

Une journée du calendrier dure **3 600 secondes réelles, soit 60 minutes**, en exploration normale. Une minute du calendrier vaut 2,5 secondes réelles. La marche nominale est de 67 px/s, soit environ 4,19 m/s ; un kilomètre demande environ quatre minutes réelles. Le voyage organisé et le sommeil font avancer le calendrier plus vite.

Faim, eau, fatigue, soins, nourriture des compagnons et choix de tenue sont intégrés. Faim et déshydratation peuvent réduire la santé de Kaldor avec un plancher de 1 PV ; fatigue et déshydratation ralentissent sa marche. Le froid peut le tuer à pied ; en transport organisé il conserve au moins 1 PV. Une tenue trop chaude accélère la faim. Les feux des relais et bivouacs exigent du bois réel. Les compagnons peuvent tomber à terre ; la fée reste invulnérable et sans besoins alimentaires. Les compagnons matériels subissent aussi le froid et la faim liée à une tenue trop chaude ; le panneau permet de leur acheter un manteau réel (2 lots de tissu et 4 pièces au relais).

Cheval, charrette et bateau exigent un transporteur proche et disponible. Les itinéraires suivent le graphe, les modes autorisés et les fermetures locales. Les réserves insuffisantes sont signalées mais ne bloquent pas seules le départ. Le voyage continue pendant une absence d'onglet ou d'application, puis laisse le jeu en pause à l'arrêt ; les notifications dépendent du navigateur, de l'autorisation et du relais natif installé.

Sources : `scripts/world-pacing.js`, `scripts/travel-party.js`, `scripts/world-life-runtime.js`, `scripts/body-heat.js`, `scripts/travel-background.js`.

## Économie, incidents et convois intégrés

Le jeu embarqué attache `world-simulation.js` à son état mondial. Il utilise des stocks persistants, consommation, capacités de production, intrants de recettes, réserves, trésorerie et personnel disponible. La population économique est une cohorte de campagne réduite ; les 5 450 000 habitants de la bible restent des effectifs de conception.

Les achats débitent les réserves locales et créditent la trésorerie du vendeur. Les médicaments et intrants manquants font l’objet de commandes ; les quais partagent le compte de leur port. Les expéditions réservent biens, paiement, convoyeurs, escortes et provisions ; la livraison transfère les marchandises une seule fois. Les survivants doivent revenir avant de redevenir disponibles, y compris les escortes dont tous les convoyeurs sont morts. Leur identité et leurs blessures suivent leurs affectations. Les pertes déclarées peuvent être réglées et les cargaisons restantes récupérées par une équipe financée qui doit les rapporter physiquement. Près du joueur, les convois ont des acteurs physiques et un chariot provisoire ; blessures, morts et progression sont conservées entre chargement local et déplacement lointain.

Les pénuries suivent les réserves ; les patrouilles demandent un mandat local et des moyens ; des embuscades peuvent viser un trafic réel sous les conditions du modèle. Les crues suivent la pluie et la décrue. Un pont endommagé, un éboulement, une avalanche ou des dégâts d'incendie déjà enregistrés nécessitent un chantier financé et approvisionné. Cela ne signifie pas que tous ces incidents disposent déjà d'un déclencheur causal autonome.

L'ancien générateur calendaire de `world-model.js` subsiste pour son utilisation isolée. Le jeu embarqué passe par la simulation causale : il ne génère plus automatiquement guerres, successions, fêtes ou disparitions par les anciens modulos de dates. Les 17 règles de conception ne sont pas toutes opérationnelles.

Sources : `scripts/world-simulation.js`, `scripts/world-convoys.js`. Détails : [monde vivant](living-world-integration.md) et [convois](world-justice.md).

## Habitants, nouvelles et justice

Les humains et batraciens présents disposent de routines, conversations locales, réactions aux menaces et règles de repli. Des voyageurs humains parcourent les routes, y compris hors écran, avec identité, santé et progression persistantes. Les batraciens possèdent aussi leurs parcours spécifiques. La présence d'une espèce ne crée pas d'hostilité automatique.

Les connaissances sont individuelles et locales : carnets échangés par les voyageurs, registres locaux et copies datées emportées par les cargaisons. Un habitant peut ignorer un incident ou sa résolution. Le journal du joueur conserve les nouvelles discutées ; les informations privées des compagnons ne sont pas partagées avec les passants.

La justice distingue acte, témoin, déposition et dernier signalement. Un témoin doit atteindre un contact compétent ; découvrir un corps ne révèle pas l'identité du meurtrier. Recherche locale, reddition, arrestation, retenue financière bornée, détention et défiance temporaire sont intégrées. Les personnages essentiels gravement blessés suspendent leur service ; leur guérison consomme nourriture et médicaments. Une relève de transport peut rejoindre son poste à pied.

Sources : `scripts/world-society.js`, `scripts/world-dialogue.js`, `scripts/world-justice.js`, `scripts/world-justice-runtime.js`, `scripts/world-life-runtime.js`.

## Ressources artistiques disponibles

Les humains et les batraciens ont leurs ressources et leur intégration en jeu. Les batraciens ajoutent 62 civils et 11 gardes dans 14 localités, avec rôles armés pour certains groupes existants.

Les hommes-singes disposent des deux silhouettes, cinq pelages, quatre vues et du module visuel couvrant **55 activités et 16 fonctions**. L'atelier permet de les examiner. Ces ressources ne peuplent pas encore le monde et n'installent ni métiers productifs, ni IA de combat, ni escalade navigable. Leurs 13 structures restent à construire. Les anciens statuts du catalogue de conception ne constituent pas un inventaire actualisé des animations ; consulter le [guide des activités](hommes-singes-activites.md) et `data/hommes-singes/activities-manifest.json`.

## Limites encore présentes

- Pas de diplomatie opérationnelle complète, de guerre ou d'alliance militaire décidée par les acteurs politiques.
- Pas de peuplement physique complet des six espèces, de villes entièrement bâties ou d'ateliers dont chaque geste produit un bien réel.
- Pas de bataille navale ni de pillage général libre de tous les objets. Les bandes peuvent prélever des cargaisons abandonnées et financer leurs dépenses ; les équipes de récupération rapportent les biens encore disponibles. Les combats de convois dont les participants ont été observés continuent hors écran avec pertes persistantes ; un ancien combat sauvegardé sans participants attend encore une observation.
- Les patrouilles parcourent désormais les routes pour rejoindre leur mission et rentrer au poste. Les grandes tournées entre plusieurs relais, les rançons, la contrebande et l’ensemble des procédures de la bible restent à développer.
- Les conseils et refus au départ dépendent des nouvelles reçues par le transporteur ; l’interception en route utilise la réalité du passage effectivement abordé. Les tempêtes maritimes suspendent les traversées.
- Les événements et connaissances persistants ne sont plus limités aux 512 derniers événements ; le journal discuté reste limité à 120 entrées et le journal technique économique à 1 000. L'archivage des très longues campagnes reste à prévoir.

## Vérifications disponibles

Les suites de tests décrivent leurs garanties respectives, sans constituer une recette exhaustive sur appareil : `world-simulation.test.cjs`, `world-life-runtime.test.cjs`, `world-convoys.test.cjs`, `world-justice*.test.cjs`, `world-society.test.cjs`, ainsi que les suites de voyage, climat et combat. Les scripts `check-world-society.cjs` et `check-world-convoys.cjs` servent aux recettes navigateur. Les tests de bible et son contrôle déterministe vérifient les données de conception ; leur réussite ne valide pas toutes les fonctionnalités jouables.

Le registre détaillé des corrections et de leurs limites figure dans [Corrections de cohérence](corrections-coherence.md).

Les huit raccordements suivants sont détaillés dans [Personnes, institutions et échanges](campagne-causale.md).
