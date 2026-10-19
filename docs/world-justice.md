# Justice locale et convois — intégration Codex

Auteur : Codex / OpenAI, pour transmission à Claude. Ces ajouts ne modifient pas
les sprites approuvés. Sources : `scripts/world-justice.js`,
`scripts/world-justice-runtime.js`, `scripts/world-crime-response.js`, `scripts/world-convoys.js` et
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
Les services essentiels restent récupérables après le retour au calme ; leurs personnages ne disparaissent pas définitivement. De nouveaux actes
restent de nouvelles infractions. Ce n'est pas encore un code pénal pour le vol,
les rançons ou tous les différends politiques.

## Coup isolé, crime et retour au calme

Un premier contact léger accepté avertit le joueur et peut faire paniquer les
civils pendant quatre minutes du monde (dix secondes réelles). Il ne crée ni
plainte ni hostilité de la garde. Un deuxième contact dans les cinq minutes du
monde (12,5 secondes réelles), même contre une autre victime, devient une
agression. L’avertissement est conservé à la sauvegarde. Un contact rejeté par
l’invulnérabilité ou provenant d’un monstre ne compte pas. Une blessure grave
(perte de plus de deux points, état critique ou santé restante au plus égale à
un) et un meurtre constituent immédiatement un crime. Une victime déjà informée
d’un crime récent ne réinterprète pas une nouvelle attaque comme un accident.

Les civils qui connaissent le crime refusent toute conversation, interrompent
leurs échanges et fuient le joueur lorsqu’ils le voient à proximité. La peur
expire à une date fixe, sans renouvellement par la seule présence du joueur :

| Acte connu | Peur dans le monde | Durée réelle à l’horloge normale |
| --- | --- | --- |
| Agression | 3 heures | 7 min 30 |
| Blessure grave | 6 heures | 15 minutes |
| Meurtre | 12 heures | 30 minutes |

Leur retour au poste reste physique et peut demander quelques secondes de plus.
Un autre danger réel peut continuer à les mettre à l’abri. Une garde calme ne constitue pas, par le seul mandat visant le joueur, une menace pour les civils. La peur et la justice
sont distinctes : les poursuites locales durent au plus un, deux ou quatre jours
selon la gravité, sauf nouveau crime ; la reddition les règle immédiatement.
Les majorations de prix décroissent séparément pendant deux, quatre ou sept jours.
Une découverte de corps sans témoin de l’acte n’identifie toujours pas le joueur.

## Renforts et arrestation

Une déposition transmise à un contact réel peut mobiliser un groupe de deux
gardes, sans attendre la ronde institutionnelle de six heures. Le poste doit
disposer des deux personnes, de douze pièces et de quatre provisions ; les
rations et l’eau suivent les règles communes des expéditions. Aucun garde
supplémentaire n’est inventé si les réserves sont épuisées.

Le groupe rejoint une entrée navigable hors du champ réel de la caméra, avec
une marge de sécurité. La mobilisation prend au moins une minute du monde et
inclut le temps de marche entre le poste et cette entrée. Si la caméra révèle
l’entrée, la matérialisation attend ; une ancienne position sauvegardée ne peut
pas remplacer la position d’approche et faire apparaître un garde près du joueur.
La planification est bornée à quatre candidats par essai, espacés de cinq
secondes réelles, et n’est pas lancée sans effectifs ni ressources.

Les gardes rejoignent le dernier lieu signalé, sans connaître la position cachée
du joueur. Ils peuvent proposer ou imposer l’arrestation selon les règles
existantes. Une seule intervention de renfort est active par juridiction ; une
nouvelle mobilisation est espacée d’au moins une heure du monde. La recherche
locale dure trente minutes du monde hors combat, puis le groupe rentre au poste.
Les morts, blessures, ressources et personnes réservées persistent au rechargement.
Seuls les survivants redeviennent disponibles à leur retour, une seule fois.

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
gardes, charrettes et bateaux existants. Les bandes prélèvent les biens réellement laissés sans défense ; les équipes financées peuvent récupérer les marchandises restantes. Le règlement exige un signalement de perte. Le pillage général et les rançons restent à construire. Voir [les règles de campagne](campagne-causale.md).
Le moteur ne crée pas de bataille navale ou d’adversaires inconnus hors écran.

## Retour des escortes isolées

Quand les derniers convoyeurs meurent, la cargaison reste à sa position réelle. Après la fin du combat, les escortes survivantes reviennent par les segments déjà parcourus, à pied à proximité du joueur et par le même trajet hors écran. Elles respectent les fermetures et conservent blessures et décès à la sauvegarde. Une escorte privée de convoyeurs après livraison poursuit le retour déjà commencé.

Les gardes restent réservés jusqu’à l’arrivée effective au poste ; seuls les survivants redeviennent disponibles, une seule fois. Les convoyeurs morts ne sont pas remplacés et les marchandises abandonnées ne sont ni rapportées ni livrées. Un chariot abandonné reste visible au lieu de l’abandon quand ses gardes s’éloignent. Si toute l’escorte meurt, le contrat cesse d’occuper une place de transport actif, même si le passage est fermé. Les anciennes sauvegardes de convois abandonnés peuvent reprendre ce retour.

## Tests exécutés

- `tests/world-justice.test.cjs` : 18 cas de preuves, sanctions et expiration.
- `tests/world-crime-response.test.cjs` : avertissements, refus, expiration, renforts hors champ, retour et conservation des pertes.
- `tests/world-justice-runtime.test.cjs` : 9 cas dans le moteur embarqué.
- `tests/world-simulation.test.cjs` : 13 cas économiques et de persistance.
- `tests/world-convoys.test.cjs` : 12 cas de matérialisation, arrêt au danger,
  reprise, abandon, conservation des pertes, sauvegarde du vrai `Game`,
  transitions proche/lointaine, routes bloquées et débarquement.
- `tests/world-escort-return.test.cjs` : retour partiel, passage fermé, pertes, retour après livraison et absence de double remise en effectif.
- `scripts/check-world-convoys.cjs` : navigateur réel, collisions du terrain,
  quatre acteurs rendus et charrette, continuité, blessure, arrêt/reprise et
  animation de l'atelier hommes-singes. Captures dans `art/world-convoys/`.

Ces suites et la recette navigateur couvrent les comportements décrits. Elles ne constituent pas une validation exhaustive du
monde vivant ni de l'ensemble du jeu.
