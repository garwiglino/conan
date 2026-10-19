# Corrections de l’audit transversal du 19 octobre 2026

Ce document suit les 19 cas reproduits sur la révision `312975e`. Il décrit les règles corrigées et les tests correspondants, sans assimiler la réussite des tests à une preuve d’absence de tout autre défaut.

| Cas | Règle appliquée | Vérification |
| --- | --- | --- |
| 1. Dernière mort et sauvegarde | Zéro vie reste zéro au chargement ; la séquence de défaite reprend sans décrément supplémentaire ni résurrection. | `world-audit-runtime`, cas 1 |
| 2. Mort pendant un repos | Un repos interrompu par la mort ne soigne pas le mourant et n’annonce pas une récupération réussie. | Cas 2 |
| 3. Journal plus récent | Les décès, blessures et effectifs du journal adopté sont appliqués aux acteurs ; les représentations des anciennes expéditions sont retirées sans réécrire leurs anciens PV. Un mort ne peut être recruté. | Cas 3 |
| 4. Péage acquitté | Le convoi visible respecte la même autorisation de passage que le convoi simulé à distance ; le transfert reste unique. | Cas 4 |
| 5. Récupération en mer | Une équipe terrestre ne peut réserver du personnel ni prendre des provisions pour une épave au large. Une récupération exige un accès terrestre et une arrivée à portée du chargement réel. | `world-audit`, cas 5 |
| 6. Retour depuis une île | Le retour utilise les traversées existantes. En mer, le personnage est représenté dans une embarcation ; sa disponibilité ne revient qu’après son arrivée au poste. Les fermetures restent bloquantes. | `world-audit-runtime`, cas 6 |
| 7. Dégâts entre étages | La proximité seule ne suffit pas : le compagnon et l’ennemi doivent être au même étage. | Cas 7 |
| 8. Bande sans effectif | La disponibilité du personnel est vérifiée avant de publier le départ. Les habitants nommés libres ne deviennent pas silencieusement des bandits ailleurs. | `world-audit`, cas 8 |
| 9. Prévision d’un voyage | La suspension enregistre immédiatement l’absence ; une copie indépendante calcule la prévision par petites tranches, puis enregistre et programme l’annonce. La reprise est également fractionnée ; une nouvelle suspension sauvegarde le point effectivement rejoué, sans perdre ni rejouer deux fois le temps restant. | `travel-background`, cas 9 ; `check-journey-forecast.cjs` |
| 10. Chauffage et sauts de temps | Les tranches de survie utilisent leur propre heure : un feu de quatre heures ne perd plus rétroactivement sa chaleur lors d’un repos de huit heures. | `world-audit-runtime`, cas 10 |
| 11. Position des coursiers | La position physique est sauvegardée ; les anciennes sauvegardes la reconstruisent depuis l’étape et sa progression. | Cas 11 |
| 12. Durée des coursiers | L’arrivée, l’échange de nouvelles, l’attente et le trajet suivant utilisent leur heure réelle. Le temps restant n’est pas abandonné à l’arrivée. | Cas 12 |
| 13. Prix du transport | Le prix retiré au voyageur rejoint la trésorerie du poste qui vend le départ, une seule fois. | Cas 13 |
| 14. Eau d’un compagnon éloigné | La gourde et la déshydratation du joueur ne s’appliquent qu’aux compagnons matériellement présents. Le froid et la faim du compagnon éloigné continuent de dépendre de sa situation. | Cas 14 |
| 15. Subsistance des expéditions | Convois, patrouilles, récupérations et bandes portent des réserves finies, débitées du stock de départ. Les aliments gardent leur type dans les réserves transportées. Nourriture et eau sont consommées pendant les attentes aussi ; le manque réduit réellement les PV. Les réserves inutilisées des survivants reviennent avec eux. | `world-audit`, cas 15 ; suites de missions existantes |
| 16. Consommation des bandes absentes | Les membres réservés réellement partis sont retirés des besoins locaux ; les membres revenus y sont de nouveau comptés. | Cas 16 |
| 17. Relève batracienne | Le service et le retour ont priorité sur les conversations et promenades spécifiques aux Batraciens. | `world-audit-runtime`, cas 17 |
| 18. Confirmation des nouvelles | Une confirmation plus récente rafraîchit l’information, sans qu’une vieille nouvelle non résolue puisse annuler une résolution déjà connue. Un partage daté ne peut transmettre une confirmation acquise plus tard. | `world-audit`, cas 18 |
| 19. Occupation d’une porte | Civils et compagnons vivants occupent le passage au même titre que le joueur et les ennemis ; un personnage à l’étage supérieur ne bloque pas une porte au sol. | `world-audit-runtime`, cas 19 |

## Persistance et ressources

Les réserves d’expédition et leur dernière heure de consommation persistent. Les missions de réparation conservent leur gestion spécifique du combustible, des matériaux et de l’alimentation. Une reprise de mission ancienne sans réserves détaillées fait une réconciliation unique avec le stock de sa communauté ; elle ne crée ni nourriture ni eau et ne facture pas rétroactivement une faim non suivie par l’ancienne version. Les nouvelles missions reçoivent leurs réserves au départ. Les grands rattrapages sont découpés ; les convois arrêtent leur consommation à l’heure exacte du retour. Les allocations protègent les besoins alimentaires locaux et les exportations tiennent compte des intrants des ateliers. Le réapprovisionnement en intrants des outils et vêtements couvre leur entretien continu, en plus de la reconstitution du stock.

La récupération navale autonome reste hors du périmètre livré. Refuser une récupération terrestre impossible préserve cette limite ; cela n’ajoute ni navire de secours ni traversée fictive. Un chargement déplacé hors de portée pendant une récupération n’est pas ramassé à distance.

## Voyage en arrière-plan

La prévision utilise le même moteur de voyage et les mêmes règles que la progression normale. Elle ne reconstruit pas les illustrations ni toute la carte ; les données mutables de la campagne, les personnages et les caches de simulation sont isolés. Les tranches rendent la main au navigateur. La sauvegarde de l’absence précède la fin du calcul ; une sauvegarde encore sans annonce peut donc être rechargée et rejouée selon le temps réellement écoulé. L’annonce et la notification exactes sont programmées lorsque le calcul est prêt, selon les possibilités de suspension du navigateur ou de l’application.

La recette Chromium mesure séparément le coût immédiat de suspension, les occasions laissées aux autres tâches, la reprise et la concordance du lieu annoncé. Les seuils sont des contrôles locaux ; la validation native sur appareil reste distincte.

## Validation

La suite complète compte **494 tests JavaScript réussis**. Les derniers contrôles de nouvelles et de persistance passent également (39 tests ciblés). Les **24 tests de bible**, la compilation déterministe sans avertissement et les **120 contrôles d’interface paysage** passent. Le HTML web/iOS et l’archive native sont synchronisés. La mesure Chromium du voyage terrestre de 4 777,66 minutes donne 13,5 ms pour lancer la suspension et 0,2 ms pour lancer la reprise ; le travail continue par tranches, et l’arrêt réel correspond à l’annonce. Ces chiffres mesurent les appels immédiats, pas la durée totale de calcul. Aucune exécution sur appareil iOS n’a été réalisée dans cet environnement.
