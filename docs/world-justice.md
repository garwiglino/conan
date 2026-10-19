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
retrait d'équipement ou consommation de vie. La recherche pour les faits connus de ce tribunal prend fin après la
peine ; une preuve plus grave reçue ultérieurement ne facture que le complément. défiance, refus de renseignements et prix majorés diminuent avec le temps.
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
existantes. Les plafonds territoriaux et les délais varient avec le niveau indiqué ci-dessous.
Après sa recherche bornée, le groupe rentre physiquement au poste.
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


## Recherche territoriale et autorités

Le niveau est calculé séparément pour chacune des **14 régions**, dans les cinq
continents. Le mandat est celui de l’autorité canonique de la région : Teremor,
Cités de Sylverive, Autorités d’Igea, Monarchie de Sarak, Cités de Varan ou Ports
de Tagon. Deux régions de même autorité gardent des recherches distinctes.
Le camp relève de Roche-Sèche, à Sarak. L’emprise d’un lieu habité ou d’un
quai conserve son administration, même si la cellule de terrain frontalière
porte le nom d’une autre région : l’embarcadère d’Aulneport reste ainsi
rattaché à sa ville, comme dans le repérage des lieux. Une frontière juridique arrête les
poursuites de police ; elle n’annule pas la légitime défense d’un garde attaqué.

L’interface montre cinq sceaux et le niveau dans le cartouche du lieu, sans
recouvrir les commandes. Pendant l’alerte, l’autorité poursuivante remplace le
sous-titre du lieu ; le bouton accessible nomme aussi la région et cette autorité.
Cliquer ou activer ce bouton au clavier ouvre « Autorités et recherches » sur la
carte : chaque région indique son niveau, ses victimes identifiées, l’autorité
poursuivante, les patrouilles mobilisées et la fin des mandats. Le niveau régional
résume les preuves reçues quelque part dans la zone ; **chaque poste doit recevoir
les faits avant de pouvoir arrêter Kaldor**. Aucun crime sans identification et
signalement n’alimente ces indicateurs.

| Niveau | Chaleur minimale | Intervention (équipes de 2) | Patrouilles routières supplémentaires | Délai entre interventions | Recherche sur place |
| --- | --- | --- | --- | --- | --- |
| 0 · Libre | 0 | 0 | 0 | — | — |
| 1 · Signalé | 1 | 1 | 0 | 60 min | 40 min |
| 2 · Recherché | 3 | 1 | 1 | 45 min | 50 min |
| 3 · Traqué | 6 | 2 | 2 | 30 min | 60 min |
| 4 · Chasse à l’homme | 10 | 2 | 3 | 20 min | 70 min |
| 5 · Alerte majeure | 18 | 3 | 4 | 15 min | 80 min |

Toutes les durées sont en minutes du monde ; les nombres sont des plafonds
simultanés, retours compris, jamais des créations garanties. Les ressources,
les gardes disponibles et les routes praticables limitent les départs. La
planification des patrouilles et des dépêches a lieu au plus toutes les cinq
minutes du monde, avec deux nouveaux départs maximum de chaque catégorie par
passage. Les essais de chemins sont bornés à huit pour les patrouilles et quatre
pour les messagers ; les postes sont examinés à tour de rôle pour qu’un passage
fermé ne monopolise pas la planification. Une même route n’est pas doublonnée dans une zone. Les patrouilles
suivent le graphe routier terrestre, avec une approche dans leur région,
respectent les fermetures, attendent sur leur secteur puis reviennent.
La hausse du niveau ne localise pas magiquement le joueur : les interventions
utilisent son dernier signalement daté.

Une agression vaut 1, une blessure grave 3 et un meurtre 6. Une victime garde
ajoute respectivement 1, 2 ou 4 ; l’intimidation connue d’un témoin ajoute 2.
Ainsi, un meurtre de civil identifié mène au niveau 3, celui d’un garde au niveau
4, et deux gardes tués et identifiés au niveau 5. Chaque mort reste définitive dans
les effectifs ; tuer les renforts ne supprime aucune déposition déjà reçue.
Un épisode continu sur la même victime s’aggrave sans compter plusieurs meurtres.
La chaleur commence à décroître après le premier quart du mandat ; le niveau
baisse progressivement jusqu’à expiration. Une lettre ne renouvelle pas le délai.
La peur conserve ses propres durées fixes (3/6/12 heures), sans fuite à vie.

### Témoins, appartenances et transmission

Le fait conserve le nom, l’espèce, le rôle et l’affiliation de la victime, ainsi
que l’identité et l’appartenance des témoins réels. Les compagnons et alliés
personnels ne déposent pas contre Kaldor. Un réseau clandestin explicitement
identifié ne coopère pas contre une affiliation extérieure, sauf si le témoin est
lui-même la victime. Un conflit déclaré entre factions empêcherait une telle
coopération ; les relations canoniques actuelles ne sont pas des guerres ouvertes.
L’espèce, seule, ne crée ni solidarité automatique ni culpabilité collective :
les règles de la bible interdisent précisément cette déduction. Un accord de
commerce ou d’escorte n’est pas un traité de police ou d’extradition.

Les dépêches emploient un travailleur réel, deux pièces et deux provisions du
poste. Le messager marche par les routes ouvertes, reçoit ses rations et revient ;
il peut être blessé ou tué. Seule son arrivée transmet le mandat. Les caravanes
transportent aussi une copie des signalements effectivement connus au départ,
y compris au retour. Une aggravation ultérieure exige une nouvelle transmission.
La coopération est bornée à la même région et à la même autorité, sans alliance
policière inventée. La sauvegarde conserve les copies reçues, leurs dates, les
missions, les pertes, et les faits déjà jugés. Un tribunal ne peut sanctionner une
gravité qu’il n’a pas reçue ; de nouvelles preuves plus graves laissent uniquement
le complément de responsabilité à régler.

### Références de conception consultées

- [OpenMW, `MechanicsManager::commitCrime` et `canReportCrime`](https://github.com/OpenMW/openmw/blob/master/apps/openmw/mwmechanics/mechanicsmanagerimp.cpp) : témoins capables de signaler, perception locale, exception des compagnons, distinction entre provocation et infractions. Ici, la visibilité directe du crime reste exigée.
- [Endless Sky, `Politics::Offend`](https://github.com/endless-sky/endless-sky/blob/master/source/Politics.cpp) : conséquences dépendant des gouvernements et des faits, distinction entre provocation temporaire et réputation.

Ces références éclairent les choix ; les règles d’autorité et d’appartenance sont
celles de notre bible, sans importer une hostilité raciale ou un partage universel
des primes.

Validation ajoutée : `tests/world-pursuit.test.cjs`,
`tests/world-pursuit-runtime.test.cjs` et `scripts/check-world-pursuit.cjs`.


## Vérification du compteur R0 après l’arsenal

`R0` signifie qu’aucun mandat actif n’est connu dans la région. Un meurtre
sans témoin survivant capable de déposer conserve ce niveau ; la découverte
ultérieure du corps ne révèle pas l’identité de son auteur.

Un relais déjà habilité à recevoir des dépositions enregistre aussi ce qu’il a
lui-même vu, au titre de son poste : il n’attend plus un second employé. Les
anciens témoignages sauvegardés reprennent ce même chemin. Un témoin ordinaire
qui a échappé au danger donne priorité à son signalement avant de rentrer chez
lui. Sa fuite reste prioritaire s’il est encore menacé ; un ancien objectif de
déposition ne le retire plus du contrôleur de fuite.

Les approches des relais réemploient `stationLanding`, avec les collisions et la
visibilité réelles : la cible n’est plus systématiquement dix-huit pixels au sud
du contact, point parfois situé dans un mur. Les gardes utilisent les mêmes
candidats d’approche. Ce choix vaut aussi pour le rattrapage hors écran.

Régression reproduite sur `bf61312` avec une attaque de l’arme équipée contre un
résident du camp, sous les yeux du palefrenier : la déposition restait vide et le
compteur à zéro. `tests/world-crime-reporting.test.cjs` couvre ce parcours réel,
les anciennes sauvegardes, la fuite, le retour et les corps sans identification.
`scripts/check-world-crime-reporting.cjs` attaque par la touche de combat réelle
et vérifie `R0 → R3`, le HUD et la carte sur trois formats, sans garde inventé,
signalement forcé ou remplacement des règles de visibilité.
