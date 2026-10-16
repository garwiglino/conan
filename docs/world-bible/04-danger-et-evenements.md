# 04 — Danger local, événements et récurrence

## Audit et frontière d'intégration

Le moteur existant possède déjà événements datés, propagation des nouvelles, sécurité locale des civils, interruptions de transport et incidents persistants. La version de `scripts/world-model.js` examinée au commit `71abc08cfb68c53ad34529143b6e4ec6d4ef46ee` comporte toutefois des déclenchements calendaires : brigands certains jours, patrouilles certains autres, pénuries périodiques et séquence de conflit. Ces dates ne constituent pas encore une causalité géopolitique.

Ce chapitre et le registre `eventRules` définissent leur remplacement, pas une prétention que le HTML embarqué l'utilise déjà. La compilation de la bible reste sans effet sur une sauvegarde. Avant activation, chaque règle doit être raccordée à la source réelle des stocks, relations, météo et effectifs, puis remplacer la branche calendaire correspondante pour éviter deux générateurs concurrents.

Les versions de moteur n'ont pas toutes le même registre : certaines emploient `purified`/`repair`, d'autres `purification`/`reopening`. Utiliser un adaptateur explicite qui vérifie `EVENT_TYPES`; ne jamais envoyer un type inconnu. Le registre de conception garde un `id` stable distinct du `runtimeType`.

## Quatre dimensions indépendantes

1. Menace physique immédiate : ennemis réels, ligne de vue, étage, projectiles ou danger matériel.
2. Risque d'itinéraire : incidents sur le couloir effectivement emprunté, relief et météo.
3. Situation sociale et économique : stocks, droit, exploitation, prix, travail, fermeture administrative.
4. Relation politique : reconnaissance, accès, conflit actif et ordres applicables.

Une pénurie peut affecter prix et services sans créer un groupe hostile. Un différend fiscal ne donne pas le droit d'attaquer tous les habitants. Un port pratiquant légalement l'esclavage peut être bien gardé ; cela ne rend pas cette pratique moralement acceptable. Une communauté minoritaire ne crée aucun coefficient de danger.

## Qui patrouille et pourquoi

| Zone / fonction | Autorité compétente | Mission et limites |
|---|---|---|
| Villes et axes relevant de Teremor | Garnison royale ou autorité locale déléguée | Protéger un accès, un marché, des vivres ou un poste ; mandat territorial |
| Cités de Sylverive | Garde de cité | Quais, ateliers, marchés et voies sous sa charte ; ne commande pas toute la campagne |
| Convois de Sylverive/Tagon | Escorte engagée pour ce convoi | Trajet, durée et personnes protégées identifiés ; fin au terme du contrat |
| Passages et concessions d'Igea | Garde du détenteur du passage, parfois garnison invitée | Protéger l'accès convenu ; renouvellement explicite d'une présence étrangère |
| Villes et grands points d'eau de Sarak | Garde urbaine et unités du gouverneur | Ouvrage, marché et accord d'eau ; pas police omniprésente du désert |
| Troupeaux de Darg et communautés voisines | Escorte communautaire | Protection des troupeaux et droit de passage ; pas mandat contre les autres espèces |
| Ports/voies d'eau de Varan | Garde de la cité concernée | Quais, dépôts et accès financés ; juridiction locale |
| Ports de Tagon | Garde portuaire et équipage autorisé | Port ou parcours désigné ; l'intérieur autonome n'est pas soumis par défaut |
| Villages de Kesh / enclaves | Garde locale | Défense des habitants et limites consenties ; aucun partage universel d'hostilité |

Une patrouille consomme temps, solde/provisions et capacité humaine. Elle réduit le risque sur son parcours et pendant sa présence, pas dans toute une région. Un déficit de moyens réduit sa fréquence plutôt que créer des gardes gratuits. Les unités se replient, relèvent leur poste ou rentrent ; elles ne disparaissent pas pendant un affrontement.

## Catalogue causal des incidents

| Règle | Conditions indispensables | Auteurs et cibles | Résolution |
|---|---|---|---|
| bandit_ambush | Trafic exposé, groupe local disponible, couverture/accès praticable, patrouille insuffisante | Bande déterminée visant une cargaison ou une rançon ; aucune cible d'espèce | Fuite, défaite, abandon, arrestation ou déplacement du groupe |
| mining_interception | Litige de concession actif + acte violent documenté + groupe armé | Faction locale impliquée visant un convoi lié au litige, pas tous les mineurs | Accord, restitution, défaite ou fin de mandat |
| pasture_retaliation | Passage contesté + dommage/saisie antérieur + refus de médiation | Groupe réellement lésé ou chef opportuniste ; troupeau/poste lié au contentieux | Restitution, indemnité, passage rétabli, arrestation ou trêve |
| kesh_raid | Bande `kesh_raiders` active, besoin/commanditaire connu et cible accessible | Membres de cette bande, pas les habitants de Kesh dans leur ensemble | Captifs secourus, groupe défait, restitution ou rupture du contrat |
| fiscal_checkpoint | Contentieux Teremor–Sylverive + ordre légal contesté + agents affectés | Poste inspectant les cargaisons relevant de l'ordre | Paiement contestable, recours, révocation ou expiration ; pas combat obligatoire |
| port_seizure | Litige précis, titre de saisie et navire/cargaison identifiés | Autorité ou équipage mandaté ; seuls intérêts visés | Indemnité, arbitrage, restitution ou expiration |
| labour_dispute | Salaires/contrat/sécurité réellement contestés | Travailleurs, exploitant et autorité ; aucune bande hostile implicite | Paiement, expertise, correction ou accord |
| shortage | Stock disponible inférieur aux besoins après réserves et livraisons possibles | Situation économique, sans ennemi automatique | Livraison effectivement arrivée ou reprise vérifiée |
| caravan | Excédent à l'origine, demande, moyen de transport, cargaison et parcours possibles | Marchand/transporteur nommé, escorte éventuelle | Arrivée et transfert unique des biens ; perte/retard enregistré |
| patrol | Mandat, capacité, financement, itinéraire et risque justifiant la mission | Autorité locale ou escorte contractuelle | Fin de tour, relève, perte de moyens ou changement de mission |
| local_occupation | Escalade armée approuvée, objectif limité, force et ravitaillement | Unité identifiée tenant un poste/site précis | Retrait négocié, défaite ou remplacement effectif du contrôleur |
| siege | Guerre locale active, refus de reddition/accès, moyens, lignes d'approvisionnement | Assiégeant identifié contre une place précise | Accord, levée, défaite ou prise effectivement simulée |
| truce | Parties concernées et incident actif ; accord obtenu ou décision explicite | Parties signataires uniquement | Démobilisation locale, réouverture conditionnelle ; autres conflits conservés |
| smuggling_interception | Marchandise interdite/taxée localement, activité réelle et contrôle compétent | Agent et réseau précis ; résultat selon mandat et résistance | Saisie, recours, fuite, sanction ou restitution |
| missing_person | Personnage existant + cause enregistrée : accident, départ ou crime | Recherche fondée sur indices, pas automatiquement réseau de traite | Localisation, secours ou constat ; identité persistante |
| curse_manifestation | Site maudit existant, condition surnaturelle propre et réserve locale | Manifestation, pas une espèce ou une nation | Purification ou extinction locale, cooldown persistant |
| weather_hazard | Météo/terrain compatibles au lieu et à l'heure | Crue, avalanche, tempête ou incendie selon conditions | Fin physique vérifiée, réparation ou déblaiement |

Les autorisations de violence et la menace immédiate sont séparées. Une escorte légale pour A peut être contestée par B ; les civils neutres ne changent pas de camp. Le joueur peut négocier, se détourner, escorter, enquêter ou combattre selon l'incident ; ce ne sont pas dix skins du même groupe hostile.

## Récurrence mesurée

La source exprime une intensité `lambdaPerEligibleDay` par zone d'exposition admissible et par journée du calendrier. Ce n'est ni une chance par frame, ni une durée, ni une multiplication par le nombre de tuiles. À pas horaire, la probabilité conditionnelle vaut `1-exp(-lambda/24)`. Si une condition requise est absente, la probabilité est exactement zéro.

Valeurs initiales de conception : embuscade ordinaire 0,10 ; interception de concession 0,04 ; représailles de passage 0,035 ; raid Kesh 0,025 ; contrôle fiscal 0,08 ; saisie portuaire 0,025 ; conflit de travail 0,03 ; pénurie 0,08 ; convoi 0,18 ; patrouille 0,22 ; manifestation 0,02. Les occupations, sièges, trêves, disparitions d'un personnage et catastrophes météo ne doivent pas être inventés par un tirage générique : ils suivent une transition ou une cause attestée.

Ces nombres sont des paramètres de départ à tester, pas des fréquences historiquement exactes. La fréquence réalisée dépend du trafic, des conditions, des budgets et du temps pendant lequel une cible existe.

**Unités d'exposition :** couloir de route borné pour une embuscade ; district et convoi lié pour un conflit minier ; passage saisonnier pour un troupeau ; quai et navire pour une saisie ; localité et ressource pour une pénurie ; périmètre maudit préexistant pour une manifestation. Changer le zoom ou charger davantage de secteurs ne crée pas de nouvelles expositions indépendantes.

**Cooldowns de départ :** même bande/cible 3 jours pour brigandage, 5 jours pour concessions/pâturages, 7 jours pour raid Kesh, 2 jours pour contrôle fiscal, 5 jours pour saisie, 4 jours pour conflit de travail, 2 jours pour pénurie après résolution et 6 jours pour manifestation après purification. Le simple rechargement n'efface pas ces dates.

**Budgets :** au plus deux nouveaux incidents armés par région et journée, huit dans le monde par journée, un incident de même cause/type/cible actif. Les patrouilles utilisent un budget séparé, inférieur aux unités disponibles. Les limites d'acteurs déjà présentes dans `world-danger.js` restent prioritaires ; les événements hors écran sont abstraits et ne font pas pathfinder des soldats à l'autre bout du continent.

## Saison, heure et motif

Le calendrier climatique observé dans le moteur utilise un cycle de 96 jours. Le début du cycle correspond à une remontée des températures, le maximum vers le jour 24 et le minimum vers le jour 72. Les fenêtres saisonnières de conception sont cohérentes avec ce cycle mais les dangers utilisent la météo réelle, pas seulement l'étiquette de saison.

Igea : convois miniers et réserves avant la période froide, passages réellement praticables et neige constatée. Sarak : conflits d'eau lorsque le déficit est persistant ; passages de troupeaux durant une fenêtre convenue ; pas de sécheresse créée par un modulo de jour. Varan/Tagon : trafic et crues liés à la météo locale ; pas de pirates dès qu'il pleut.

Le commerce de jour peut favoriser certaines cibles ; la faible visibilité peut aider une bande mais gêner aussi sa fuite. Une embuscade nocturne exige une cible présente la nuit. Aucun multiplicateur nocturne ne crée une caravane inexistante.

## État persistant et causalité

Chaque incident conserve : identifiant stable, règle/version, acteur, cible, autorité de juridiction, cause/incident parent, lieu/route, heure de création, fin prévue, état, ressources engagées, mandat éventuel et witnesses. La chaîne causale doit être sans boucle. Une occupation ne se cite pas elle-même comme raison d'une guerre.

La graine combine campagne, règle, exposition et créneau horaire. Les sauvegardes conservent dernier créneau traité, budgets journaliers, cooldowns, état des groupes et incidents. Recharger, marcher vite ou accélérer le voyage ne relance pas les mêmes tirages. Traiter les créneaux chronologiquement ; après un grand saut, réconcilier les états sans faire apparaître les ennemis d'incidents déjà terminés.

Le dénouement d'un incident ne résout que ses effets et ses enfants explicitement liés. Une trêve minière ne purifie pas un sanctuaire et n'annule pas un autre blocage de la route. Un groupe défait ne réapparaît pas pour conserver artificiellement un taux d'embuscade.

## Civils, transports et réputation

Conserver les règles existantes de menace proche, ligne de vue, étage, points de repli et délai de calme. `leaving → sheltered → returning` dépend de la sécurité réelle ; l'espèce et la relation diplomatique ne téléportent pas les résidents. Les services indisponibles sont retirés à l'interface et au contrôle final de départ.

Une fermeture sélective concerne le navire, la marchandise, l'unité ou la personne visée. Si l'API courante ne sait fermer qu'une route pour tous, elle ne peut pas représenter fidèlement un mandat sélectif : ne pas convertir silencieusement une saisie en fermeture universelle.

Les gardes et les ennemis ne doivent pas utiliser tous le sprite de cultiste sous prétexte que l'ancien `EVENT_TYPES` le désigne par défaut. L'activation de nouveaux combats exige la correspondance acteur/équipement/animations et des règles d'engagement. À défaut, conserver un incident non combattant ou refuser cette variante avec un diagnostic.

Une réputation change lorsqu'un acte identifié est attribué à son auteur par un témoin ou une nouvelle reçue. Pas de réputation globale d'espèce et pas de connaissance instantanée dans tous les ports. Les personnes libérées gardent leur histoire, leurs besoins et leurs choix ; elles ne disparaissent pas après une récompense.

## Tests obligatoires avant activation dans le jeu

Vérifier : zéro conflit sans cause ; même résultat à graine identique ; séparation des budgets ; cumul borné ; expiration ; absence de doublon après sauvegarde ; trêve ciblée ; passage maritime réel ; stock conservé entre départ et arrivée ; absence de pénurie créée par rumeur ; mandat sélectif ; absence d'hostilité d'espèce ; pas de combat de civils sans rôle combattant ; sécurité du transport avant paiement ; repli et retour des résidents ; continuité des quêtes/compagnons ; aucun changement d'identifiant ancien.

La validation de données de cette livraison vérifie références, pourcentages, couverture et cohérence du registre. Elle n'est pas un test de jeu sur iPhone et ne doit pas être présentée comme tel.
