# Monde vivant — intégration en cours

Auteur des ajouts : **Codex / ChatGPT**, pour transmission à Claude.
Branche de travail : `codex/living-world`. Ce document ne vaut pas validation
d'une simulation politique ou démographique complète.

## Raccordements effectifs

- `world-pacing.js` : journée de 3 600 secondes réelles, 16 pixels par mètre,
  marche nominale du joueur à 67 px/s. Le graphe de transport utilise cette
  conversion ; fatigue et déshydratation ralentissent effectivement le joueur.
- `world-society.js`, `npc-combat.js` : restauration des voyageurs proches et
  recrutés, blessés/à terre compris ; santé et hostilité des gardes ; conservation
  de tous les décès et livres de connaissances. La distance minimale d'apparition
  d'un nouveau passant ne s'applique pas à une identité déjà sauvegardée.
- Voyageurs humains déchargés : progression sur leurs segments, à la vitesse des
  civils, arrêt aux fermetures, aucun dégât abstrait. Leur proximité avec le joueur
  arrête l'avance abstraite et rend la main au déplacement local.
- `world-simulation.js` : stocks persistants, consommation, intrants des recettes,
  gisements et renouvellement, trésorerie, personnel réservé, contrats de transport
  et circulation des nouvelles avec les cargaisons. Le moteur embarqué remplace
  les incidents tirés selon le modulo des dates par ces causes.
- Un chargement réserve au départ ses marchandises, deux travailleurs et le
  paiement en séquestre. Capacité de 80 lots par chargement, 64 convois en mouvement
  au maximum. Livraison unique ; retour sur le graphe avant libération du personnel.
  Un retour bloqué ne rend ni les ouvriers ni les biens par téléportation.
- Une pénurie provient des disponibilités alimentaires/eau, et sa fin exige un
  rétablissement des réserves. Les achats du joueur débitent les réserves réelles.
- Ponts, éboulements, avalanches et dégâts d'incendie : travaux payés, outils,
  bois éventuel, salaires transférés, provisions finies et ouvriers suivant les
  routes jusqu’au chantier puis au poste. Les blessures et pertes sont
  persistantes ; les survivants ne sont disponibles qu’au retour. Pas de
  réparation par expiration. Voir [les affectations](personnes-affectations.md). Les crues ne se terminent qu'après décrue du niveau simulé.
- Patrouilles : budget, provisions, effectifs disponibles et autorité locale
  requis pour un mandat. Les morts observés ne réintègrent pas les effectifs.
  Une proximité géographique n'autorise pas une intervention chez une autre autorité.
- Nouvelles : un registre local reste local ; les cargaisons emportent une copie
  datée de ce qu'elles savent au départ. Une résolution survenue ailleurs n'est
  pas devinée. La proximité seule ne donne pas la qualité de « témoin direct ».
- Personnages essentiels : blessure grave persistante, travail/déplacement/service
  suspendus, guérison conditionnée par médicaments et nourriture. Après six heures,
  un résident disponible peut prendre la relève d'un transport. Il rejoint son
  poste à pied ; le service n'est utilisable qu'une fois arrivé. La relève est
  sauvegardée et prend fin à la guérison du titulaire.

## Unités et limites de ce premier raccordement

La population canonique et ses six espèces restent celles de la bible. Le champ
`population` économique est une **cohorte de campagne réduite**, pas une nouvelle
estimation de population réelle. Les réserves de départ, débits et budgets sont
des paramètres de jeu explicites, persistants et encore à équilibrer.

Les spécialités exportatrices ne constituent pas toute l'alimentation d'une ville :
une culture de subsistance compatible avec le potentiel régional complète le
modèle. Les habitants mangent aussi des aliments frais, pas exclusivement des
provisions conservées. Les recettes de conservation consomment leurs vrais intrants.

Le niveau hydrologique est un modèle de jeu, pas une simulation de bassin versant.
Le moteur pur `world-model.js`, utilisé seul sans bible ni simulation attachée,
conserve le générateur historique pour compatibilité ; **le jeu embarqué**, lui,
attache toujours la simulation causale. Les tests de celle-ci doivent donc passer
par `world-simulation.test.cjs`, et non seulement par les tests historiques.

## Points encore ouverts — ne pas annoncer comme terminés

1. Les convois économiques ont désormais leurs propres convoyeurs et escortes
   physiques, distincts des marchands ordinaires. Les premiers tests de liaison
   passent, ainsi que les transitions et la recette navigateur. La récupération
   des cargaisons abandonnées est raccordée aux équipes financées et aux trajets ; les combats déjà observés se résolvent hors écran avec pertes persistantes (voir `world-justice.md`).
2. Les gardes chargés reviennent physiquement au poste ; aucun effectif engagé
   ne redevient disponible pendant le combat. Les tournées entre plusieurs relais
   et les batailles générales hors écran restent à construire.
3. Les relations et différends politiques de la bible sont chargés mais ne
   constituent pas encore des décisions diplomatiques opérationnelles. Aucune
   guerre, occupation ou alliance militaire ne doit être inventée par calendrier.
4. Une justice locale avec preuves, arrestation et sanctions temporaires est
   désormais intégrée ; ses limites et celles des convois sont consignées dans
   `docs/world-justice.md`. Le vol général d’objets, la contrebande et les autres procédures restent à compléter ; les prises de cargaisons sont maintenant comptabilisées.
5. Les péages et prises de cargaisons financent désormais une caisse et un dépôt réels.
   Les rançons et la négociation politique restent à construire.
6. Le transport du joueur sépare désormais conseil fondé sur les nouvelles
   reçues et interception réelle au passage ; les tempêtes suspendent les routes maritimes.
7. Les courriers et voyageurs batraciens gardent certaines routines distinctes ;
   la progression hors écran des humains doit encore être testée au passage des
   fermetures historiques et sur une campagne fortement accélérée.
8. Peuplement physique des six espèces, vrais ateliers, besoins personnels,
   emplois du temps et relations sociales durables restent à compléter. Ne pas
   confondre un stock de ville avec un atelier animé ayant réellement produit.
9. Les événements et connaissances persistants ne sont plus évincés après les
   512 derniers événements. Le journal discuté reste limité à 120 entrées et
   le journal technique économique à 1 000. Prévoir un archivage
   indexé des faits anciens résolus pour les très longues campagnes, sans effacer
   les incidents actifs, morts, mandats ou conséquences persistantes.

## Vérification

Compiler les deux variantes avec `node scripts/embed-world.cjs`.

- `tests/world-simulation.test.cjs` : conservation, intrants, réservations,
  réparation financée, décrue, livraison unique, retour bloqué, propagation et
  équivalence avance fractionnée / longue / sauvegarde intermédiaire.
- `tests/world-life-runtime.test.cjs` : régressions de persistance, voyageurs
  recrutés à terre, gardes, relève et soif dans le vrai `Game` embarqué.
- `scripts/check-world-society.cjs` : navigateur réel, conversations, bulles,
  interruption, circulation routière et erreurs JavaScript.

Les tests historiques qui ajoutaient un incident au milieu d'une longue route
pour arrêter son premier segment ont été précisés : l'incident est maintenant
placé sur le segment réellement testé. Il ne ferme plus toute la route par magie.

Mise à jour suivante : [Personnes, institutions et échanges de la campagne](campagne-causale.md) décrit les gardes nommés, trajets de patrouilles, combustible, outils, butin, contrats et population vivante.
