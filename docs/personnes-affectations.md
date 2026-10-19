# Personnes, métiers et affectations

Les règles ci-dessous décrivent le fonctionnement livré. Elles relient les personnages visibles à la simulation des communautés, aux déplacements, aux soins et aux sauvegardes. Sources principales : `world-labour-systems.js`, `world-labour-runtime.js`, `world-life-runtime.js`, `world-campaign-systems.js`, `world-campaign-runtime.js` et `world-simulation.js`.

## Une personne, une affectation

Chaque habitant, courrier et personnel local concerné a un dossier rattaché à sa communauté d’origine. Le recrutement, l’incapacité, une relève et le retour physique peuvent retenir cette personne, sans retirer plusieurs travailleurs pour les mêmes absences cumulées. Un décès est compté une seule fois et supprime la demande de soins correspondante.

Le recrutement retire le personnage du travail local pendant le voyage et l’attente. Son renvoi ne libère pas un travailleur à distance : il doit rentrer par le graphe des routes puis atteindre réellement son poste. Les fermetures suspendent son retour. Les autres routines de promenade et de courrier ne peuvent pas avancer simultanément son itinéraire. Le trajet, la position et les raisons d’absence persistent dans les sauvegardes. Pendant une expédition, les conversations ambiantes et le repos assis automatique ne peuvent pas prendre la priorité sur le déplacement de l’équipe.

Les gardes, escortes et membres des missions institutionnelles ne peuvent pas devenir compagnons. Le titulaire d’un service conserve cette protection lorsqu’il est remplacé. Les anciennes sauvegardes sont réconciliées pour éviter une deuxième affectation ou une absence devenue orpheline.

## Relèves et services

La relève est assurée par une personne existante de la même communauté, disponible, hors de danger et ayant plus d’un PV. Un personnage en retour, en mission, dans le groupe ou déjà affecté à un autre service n’est pas admissible. Les quais et leur ville partagent la même communauté économique ; la restauration d’une relève compare cette communauté plutôt que leurs identifiants d’atlas distincts.

Les compétences sont vérifiées à partir du métier : palefrenier, manutentionnaire, porteur ou gestionnaire pour les transports terrestres ; batelier, filetier ou gestionnaire pour une traversée. L’absence de remplaçant compétent laisse le service fermé ; elle ne crée pas de personnel. Le personnage rejoint physiquement son poste avant de proposer le service.

La relève cesse de contribuer à son métier habituel. Si elle devient incapable, une autre relève admissible peut prendre sa place en conservant l’identité du titulaire initial. À la reprise du titulaire, la relève récupère son titre et rentre physiquement à son poste avant de retrouver sa disponibilité. Les achats et démarches au poste utilisent la même vérification que le transport : ils ne contournent ni l’incapacité ni les fermetures locales.

## Identités, blessures et soins

Les ouvriers des convois, des réparations et des récupérations utilisent un registre commun. Les personnes libres sont réaffectées avec leur identité, leur apparence et leurs PV actuels. Les habitants visibles ne sont pas transformés silencieusement en ouvriers anonymes ailleurs. Une réservation doit disposer d’assez de personnes réellement libres avant tout paiement.

Les blessures de tous les survivants sont conservées, y compris entre deux missions. Les morts ne réapparaissent pas. Un ancien effectif déjà rentré ne peut pas modifier les PV d’une personne repartie avec une nouvelle équipe.

Un ouvrier à un PV ne travaille plus. À domicile, hors de danger, un traitement après six heures consomme un médicament et une provision et restaure deux PV. Les soins continuent jusqu’à guérison, selon le temps de campagne et les stocks disponibles. Une personne en mission n’est pas soignée à distance. Un convoi sans porteur capable laisse sa cargaison et ramène les survivants ; une récupération incapable rentre sans charger les biens et ne verrouille pas une future tentative. Les services essentiels conservent leur incapacité critique et leur premier traitement après vingt-quatre heures ; les gardes conservent leur propre calendrier de soins. Les compagnons restent soumis aux provisions et soins du groupe. Les changements entre PV de compagnon et PV de civil conservent la même proportion de santé, y compris pour Elyne.

## Métiers et ressources

La production utilise les métiers et les affectations effectives. Agriculture, pêche, élevage, collecte, métallurgie, fours, textile, cuisine et construction navale disposent de capacités distinctes. Un cultivateur absent ne remplace pas automatiquement un artisan ; un employé de transport ne produit pas simultanément aux champs. Les personnes en fuite, en conversation ou occupées à signaler un incident ne contribuent pas à leur travail local pendant cette occupation.

La population non matérialisée reste représentée par des effectifs économiques, sans créer des milliers de personnages. Les capacités nominales représentent leur travail réparti entre les filières. Les ressources sont produites par l’horloge de campagne avec leurs intrants et gisements ; les animations illustrent l’activité, sans créer des biens par image affichée. L’émission des ressources ne dépend donc pas du nombre d’images d’animation affichées. Une animation de métier sans filière locale correspondante reste au repos.

`site.needs` conserve les besoins nominaux de la population vivante. Les besoins alimentaires et hydriques effectivement consommés et commandés sont calculés avec les personnes présentes : un compagnon ou un équipier en expédition n’est pas également nourri dans son village. Les causes d’absence cumulées ne retirent qu’une bouche. Une personne incapable mais restée sur place continue de consommer. Les effectifs réellement disponibles et les soins supplémentaires restent comptés séparément.

## Chantiers et nouvelles

Une réparation mobilise une équipe réelle, des outils, du bois, des provisions et des salaires. Les mêmes personnes se déplacent hors écran sur le graphe et sur le terrain avec les collisions lorsqu’elles sont observées. Le chantier commence à l’arrivée ; le danger interrompt le travail et son rythme dépend des ouvriers capables. Les matériaux déposés restent affectés à l’ouvrage. Une équipe trop blessée ou manquant de provisions entreprend son retour. Une fermeture peut le bloquer ; une famine prolongée peut tuer.

La fin du travail rouvre le passage concerné. Elle ne résout pas un autre incident voisin, notamment une crue. Les ouvriers restent absents jusqu’au retour. Les biens inutilisés reviennent avec les survivants ; des matériaux perdus sont enregistrés à leur position, sans remboursement ni duplication.

L’état réel du passage et la connaissance de cet état sont distincts. Un témoin sur place peut constater la réparation. Le poste reçoit le rapport quand les survivants reviennent ; une sauvegarde ne transmet pas ce rapport à leur place. Si tous les porteurs du rapport meurent avant le retour, le poste n’est pas informé automatiquement. Les convois transportent aussi les nouvelles connues à leur départ et celles acquises à destination lors de leur retour.

Chaque départ rémunéré transfère les salaires de la trésorerie vers les fonds privés une seule fois. Les anciens chantiers déjà payés conservent leur financement et leurs réservations ; leur migration ne crée ni nouvel ouvrier ni second salaire.

## Validation

Les suites `world-labour.test.cjs` et `world-labour-runtime.test.cjs` couvrent les interactions ci-dessus, avec les suites de campagne, de population, de convois, de justice et de voyage. Les recettes Chromium vérifient les personnages et les équipes sur le terrain livré. Les tests de performance contrôlent les limites de caches et le chargement avec et sans worker.

Ce document décrit les garanties vérifiées sur ces systèmes. Il ne constitue pas une preuve d’absence de tout défaut dans l’ensemble du jeu ni une recette sur appareil iOS.

Validation du 19 octobre 2026 : suite complète de **468 tests JavaScript réussis**, puis **69 contrôles ciblés réussis** après la correction des quais, incluant un nouveau cas — soit **469 cas JavaScript distincts validés**. **24 tests de bible** et sa compilation déterministe sans avertissement, **120 contrôles d’interface**, recettes Chromium des habitants, convois et réparateurs réussis. Les chargements avec et sans worker terminent le décor visible, respectent les limites de cache et restaurent l’état après repos et sauvegarde, sans rendu complet du terrain pendant une image de jeu. Intégration HTML idempotente, parité web/iOS et contenu de l’archive native vérifiés.

## Contrat pour les prochaines fonctionnalités

Une nouvelle mission doit réserver ses personnes avec `reserveCrew` et les gardes avec `reserve`, puis utiliser leur dossier existant pour les PV et l’apparence. Un refus de réservation doit précéder les dépenses. Les retours libèrent les personnes seulement au poste ; les morts passent par `death` et ne sont jamais remplacés par une nouvelle identité gratuite.

Un nouveau service doit utiliser les mêmes critères de disponibilité que `staffReady`, vérifier la compétence requise et protéger son titulaire pendant une relève. Une activité productive doit contribuer à sa filière et consommer les intrants du stock commun. Les animations ne créditent pas de ressources.

Un événement résolu loin d’un poste doit distinguer la modification physique du monde et son signalement. Les tests de la fonctionnalité doivent couvrir un personnage blessé, une fermeture de route, une interruption de mission, un retour, une sauvegarde en cours et des avances de temps fractionnées.
