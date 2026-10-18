# Justice locale et convois — intégration Codex

Auteur : Codex / OpenAI, pour transmission à Claude. Ces ajouts ne modifient pas
les sprites approuvés. Sources : `scripts/world-justice.js`,
`scripts/world-justice-runtime.js`, `scripts/world-convoys.js` et
`scripts/world-simulation.js`.

## Justice

Les faits commis et les preuves effectivement transmises sont distincts. Un
témoin doit voir l'acte, sur le même étage et sans obstacle, puis atteindre un
contact compétent. Sa mort n'efface pas une déposition déjà transmise. Elle ne
transmet pas non plus automatiquement ce qu'il n'avait jamais signalé.

Une personne découvrant des corps peut signaler des morts ou un massacre, sans
acquérir l'identité du meurtrier. Les derniers signalements du suspect sont datés :
ce ne sont pas ses coordonnées actuelles. Les gardes recherchent localement et
doivent réellement voir leur cible pour la poursuivre.

Une arrestation volontaire ou une défaite face à une garde compétente applique
une retenue financière bornée et un temps de détention, sans dette permanente,
retrait d'équipement ou consommation de vie. La recherche prend fin après la
peine ; défiance, refus de renseignements et prix majorés diminuent avec le temps.
Les services essentiels à la progression restent accessibles. De nouveaux actes
restent de nouvelles infractions. Ce n'est pas encore un code pénal pour le vol,
les rançons ou tous les différends politiques.

## Convois : état de validation

Une expédition réserve des biens, le paiement du destinataire, deux convoyeurs,
deux gardes, quatre provisions et six unités de trésorerie à l'origine. À proximité,
sa cargaison économique et ses acteurs physiques partagent la même progression.
Un combat suspend le déplacement ; tuer les convoyeurs abandonne la cargaison.
Une escorte morte réduit les effectifs et ne réapparaît pas au rechargement.
Les survivants ne redeviennent disponibles qu'après leur retour.

Les transitions proche/lointaine, la sauvegarde du groupe blessé et le passage
terrestre/maritime sont testés. Le rattrapage hors écran inclut la fraction de
temps entre deux heures de simulation. Les gardes ne cumulent pas déplacement
de ronde et déplacement de formation. Un combat observé enregistre ses participants et continue hors écran par échanges
de coups déterministes : blessures, morts et reprise du trajet sont persistantes.
Une ancienne sauvegarde sans participants reste suspendue jusqu’à observation.

Le passage maritime utilise encore le transport abstrait et un bateau provisoire,
pas une simulation de bataille navale. Les visuels réemploient les humains,
gardes, charrettes et bateaux existants. Le pillage jouable, la récupération d'un
convoi abandonné et le retour des escortes privées de convoyeurs restent à compléter.
Le moteur ne crée pas de bataille navale ou d’adversaires inconnus hors écran.

## Tests exécutés

- `tests/world-justice.test.cjs` : 16 cas de preuves, sanctions et expiration.
- `tests/world-justice-runtime.test.cjs` : 9 cas dans le moteur embarqué.
- `tests/world-simulation.test.cjs` : 13 cas économiques et de persistance.
- `tests/world-convoys.test.cjs` : 10 cas de matérialisation, arrêt au danger,
  reprise, abandon, conservation des pertes, sauvegarde du vrai `Game`,
  transitions proche/lointaine, routes bloquées et débarquement.
- `scripts/check-world-convoys.cjs` : navigateur réel, collisions du terrain,
  quatre acteurs rendus et charrette, continuité, blessure, arrêt/reprise et
  animation de l'atelier hommes-singes. Captures dans `art/world-convoys/`.

Ces suites et la recette navigateur couvrent les comportements décrits. Elles ne constituent pas une validation exhaustive du
monde vivant ni de l'ensemble du jeu.
