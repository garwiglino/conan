# Affectations, incapacité et équipes de réparation

Cette passe corrige les cinq défauts de l’audit du 19 octobre 2026. Sources : `world-labour-systems.js`, `world-labour-runtime.js`, `world-campaign-systems.js`, `world-campaign-runtime.js` et `world-simulation.js`. Les règles sont embarquées dans les versions web et iOS.

## Disponibilité d’une personne

Les habitants, courriers, personnels des relais et personnages locaux concernés ont un dossier de disponibilité rattaché à leur communauté d’origine. Le recrutement retire une personne de la main-d’œuvre disponible. L’affectation reste enregistrée pendant le voyage, l’attente et la sauvegarde.

Les raisons d’absence se cumulent sans retirer plusieurs personnes : appartenance au groupe, incapacité et trajet de retour. Une personne grièvement blessée et recrutée occupe un seul effectif indisponible. Un décès déjà compté ne retire pas un deuxième travailleur. Si aucun effectif n’était disponible, une incapacité retient le prochain effectif libéré au lieu de créer une disponibilité négative ou gratuite.

Le renvoi d’un compagnon ne le remet pas immédiatement au travail à distance. Il rejoint son poste par les routes et une approche locale respectant les collisions. Les routes fermées suspendent le retour. Le courrier reprend son point de travail interrompu ; son dossier reste attaché à la même communauté après rechargement. Les positions et itinéraires de retour sont conservés, y compris lorsque le personnage est loin de son lieu d’origine. Le temps restant après un déplacement hors écran sert aussi à finir l’approche du poste.

## Gardes et personnels en mission

Un garde humain ou batracien, une escorte et un membre d’une mission ne peuvent pas être recrutés comme compagnons. Le refus intervient avant toute création de fiche ou modification de santé. Cette règle s’applique également à la restauration des anciens groupes : un rôle institutionnel ne devient pas une seconde affectation de voyage. Les gardes conservent leur dossier et leurs blessures dans les systèmes d’escorte, de patrouille et de poste.

## Incapacité et soins

Un service essentiel gravement blessé reste indisponible et retire un travailleur disponible pendant ses soins. Sa relève continue d’utiliser les règles de remplacement existantes. La guérison ne recrée pas une personne : elle lève seulement la cause d’incapacité, si aucune autre absence ne subsiste.

Un habitant ordinaire à un PV ne travaille plus. Revenu à proximité de son poste et hors de danger, il peut recevoir après six heures un traitement consommant un lot de médicaments et une provision, pour deux PV. Un compagnon à terre reste soumis aux soins du groupe. Les services essentiels gardent leur calendrier de soins existant. Les convoyeurs et ouvriers de mission qui rentrent incapables sont retenus dans les comptes jusqu’à un traitement réellement approvisionné ; leur santé et leur besoin de soins sont sauvegardés.

## Réparation physique

Un poste ne peut plus réparer un passage éloigné par un simple compteur lancé depuis le village. Il prépare une expédition de deux ouvriers, avec les outils, le bois requis, les salaires et les provisions du déplacement, du chantier et du retour. L’itinéraire doit être accessible. L’équipe approche un pont ou passage endommagé depuis le côté accessible, en restant avant l’obstacle ; ce droit d’approche ne lui permet pas de traverser une autre fermeture.

Les mêmes ouvriers avancent sur le graphe hors écran et marchent avec les collisions du jeu lorsqu’ils sont observés. Le travail commence seulement au chantier. Une menace locale ou un combat le suspend. Le rythme dépend du nombre d’ouvriers encore capables ; les morts diminuent la population une seule fois. Les provisions sont portées et consommées selon le temps écoulé. Une équipe trop blessée ou manquant de provisions entreprend son retour ; une fermeture peut la bloquer, et la famine prolongée peut tuer ses membres.

La fin du chantier rouvre réellement le passage, mais les survivants ne redeviennent disponibles qu’après leur retour au poste. Les biens inutilisés et provisions restantes reviennent avec eux. Les matériaux déposés au chantier restent affectés à l’ouvrage. Si tous les porteurs meurent en chemin, les matériaux portés sont enregistrés comme perdus à leur position, sans remboursement ni duplication. Cette passe n’ajoute pas de procédure générale de récupération de tous les outils abandonnés.

Les anciens chantiers déjà financés conservent leurs intrants et leurs effectifs réservés ; leur durée restante est reprise par une vraie mission. Un rechargement ne relance pas un deuxième financement et ne libère pas leurs ouvriers à distance.

## Paiement

Chaque départ transfère deux pièces par ouvrier depuis la trésorerie vers le fonds privé des ménages du poste. La transaction est enregistrée une seule fois avec la mission. Une nouvelle équipe remplaçant des morts doit être financée à nouveau ; une sauvegarde ou un simple nouvel appel ne repaie pas l’équipe existante.

Pour un ancien chantier marqué payé, la migration crédite une seule fois le salaire historiquement débité mais absent du fonds privé. Il s’agit d’une réconciliation des dépenses enregistrées, pas d’une subvention périodique.

## Vérifications

`world-labour.test.cjs` couvre les réservations, salaires, matériaux, approches et fermetures, pertes humaines, soins au retour et avances fractionnées avec sauvegarde. `world-labour-runtime.test.cjs` couvre le vrai `Game`, dont recrutement, incapacité, renvoi et retour physique, repos long, sauvegardes et refus des gardes.

`UI_BROWSER_PATH=/usr/bin/chromium node scripts/check-world-labour.cjs` vérifie les deux ouvriers sur le terrain réel, l’approche d’un pont endommagé, l’arrêt face au danger, le chantier et le retour effectif. Les recettes de performance avec et sans worker continuent de vérifier les bornes de cache et le chargement asynchrone.

Les relèves sans compétence professionnelle vérifiée et la production individuelle liée à chaque animation de métier restent des limites distinctes de ces cinq corrections.

Validation du 19 octobre 2026 : **446 tests JavaScript réussis**, dont quinze nouveaux cas sur ces raccordements, **24 tests de bible réussis**, compilation de la bible sans avertissement et **120 contrôles d’interface paysage réussis**. Les recettes Chromium des habitants, convois et réparateurs passent sans erreur JavaScript. Les recettes de performance avec et sans worker passent avec caches bornés et décor visible terminé. L’intégration HTML est idempotente, les contenus de jeu web/iOS correspondent et l’archive native contient le HTML vérifié. La recette sur appareil iOS reste distincte de ces vérifications.
