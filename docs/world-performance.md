# Chargement et performances du monde

Le chargement du décor ne doit pas suspendre les règles du monde. Les stocks, personnes, blessures, contrats, fermetures, déplacements et sauvegardes continuent d’utiliser les mêmes sources et horloges.

## Terrain et mémoire

Le rendu d’un nouveau morceau de terrain de 512 × 512 pixels passe par un worker. Une image de jeu ne lance plus ce calcul complet sur le fil principal. Les cases réelles sont immédiatement disponibles ; une sous-couche provisoire issue de ces cases reste visible jusqu’à l’arrivée de leur illustration détaillée. Une image détaillée déjà présente reste affichée pendant son remplacement saisonnier.

Un seul calcul est envoyé à la fois au worker. La file contient au plus huit demandes et retire les destinations devenues inutiles après un changement de zone. Les résultats obsolètes, hors de la zone demandée ou appartenant à une autre couverture neigeuse sont ignorés. Le cache conserve au plus 32 images détaillées ou provisoires. Les cases et décors occupent au plus 48 morceaux ; les échantillons de collision non encore illustrés ont un cache distinct de 48 morceaux.

Si le worker est absent ou échoue, le même algorithme est exécuté par petites étapes entre les tâches du navigateur. Chaque reprise vise quatre millisecondes et au plus quatre étapes ; ce budget est une cible, pas une garantie de durée sur tout appareil. Aucun calcul complet de terrain n’est réintroduit dans le rendu d’une image. Les tests comparent les pixels du mode fractionné, du rendu synchrone de référence et du worker.

## Collisions, déplacements et sauvegardes

Une vérification de collision échantillonne et mémorise uniquement les cases nécessaires, sans fabriquer le décor d’un morceau entier. Le décor utilise ensuite ces mêmes échantillons. L’éviction ou la saison ne change pas les surfaces solides.

Les contrôles des obstacles ne recopient plus la liste des accessoires et ne reconstruisent plus leurs tables de rayons à chaque appel. Ils continuent de lire les objets courants, leurs positions et leur état : aucun index périmé ne permet de traverser un obstacle déplacé.

La recherche de chemin local vérifie chaque case au plus une fois par recherche. Ses routes et leur ordre de départage sont conservés. Une destination au-delà de la limite préexistante de 36 cases est refusée immédiatement, au lieu d’explorer inutilement jusqu’à 2 200 nœuds. Les contrôles sont renouvelés à la recherche suivante ; une fermeture nouvelle reste prise en compte.

Les PNJ lissent les chemins calculés pour avancer selon des angles libres, avec
une vitesse vectorielle constante (32 pixels/s, 80 pour les compagnons suivant
le joueur). Le lissage se fait lors de la planification ; chaque déplacement
vérifie à nouveau tout le segment par pas d’au plus quatre pixels, avec le rayon
du personnage et les restrictions de danger. Un obstacle refermé interrompt le
trajet et force une nouvelle recherche. La cible reste actualisée même dans une
même case ; le budget de déplacement restant sert à franchir un point de passage
sans pause artificielle. Les trajets lointains et leurs horloges restent gérés par
la simulation du monde.

Le journal du monde réutilise la copie déjà construite pour la sauvegarde du jeu. Un état inchangé n’est plus sérialisé à nouveau pour vérifier qu’il est inchangé. L’écriture locale, l’ordre des écritures de fichier et les protections entre campagnes sont conservés.

## Recette reproductible

```sh
UI_BROWSER_PATH=/usr/bin/chromium node scripts/check-world-performance.cjs
PERF_NO_WORKER=1 UI_BROWSER_PATH=/usr/bin/chromium node scripts/check-world-performance.cjs
PERF_PROFILE=1 UI_BROWSER_PATH=/usr/bin/chromium node scripts/check-world-performance.cjs
```

La recette mesure le camp, Haut-Givre et Palmeraie, puis des arrivées rapides dans 14 relais, huit heures de simulation et une sauvegarde suivie d’une restauration. Elle vérifie les bornes de mémoire, l’arrivée effective du décor détaillé et l’absence de rendu complet du terrain pendant une image de jeu. L’option de profilage écrit `/tmp/conan-world-performance.cpuprofile` pour les outils de développement Chromium.

Les mesures dépendent du navigateur, de l’appareil et de sa charge. Elles ne constituent pas une garantie de 60 images par seconde sur tout matériel, ni une recette iOS sur appareil. Les tests de rendu, déplacements, climat, combats, convois et campagne vérifient séparément la conservation des règles.

## Mesure locale avant et après

Mesure Chromium du 18 octobre 2026, même parcours de 72 images avec changements de zone ; référence avant optimisation : `c02fd29`. Les chiffres portent sur le fil principal et comprennent les premiers chargements.

| Mesure | Avant | Worker | Worker indisponible |
| --- | ---: | ---: | ---: |
| Temps cumulé du rendu du sol | 2 273,5 ms | 169,7 ms | 100,0 ms |
| Appel de rendu du sol le plus long | 1 217,2 ms | 87,7 ms | 57,4 ms |
| Calculs complets du terrain pendant une image de jeu | 10 | 0 | 0 |

La baisse du temps cumulé du rendu du sol sur le fil principal est d’environ 93 % avec le worker. Le mode fractionné répartit le reste du calcul entre les images ; son chiffre ne mesure donc pas le délai total nécessaire pour finir une illustration. Les deux modes ont effectivement terminé les illustrations visibles et passé les contrôles de mémoire, de repos et de restauration. Des pointes plus courtes restent mesurables : ces résultats ne signifient pas qu’aucune image ne pourra dépasser 16,7 ms.

Validation de l’optimisation du 18 octobre : **431 tests JavaScript réussis**, **24 tests de bible réussis**, compilation de la bible sans avertissement, **120 contrôles d’interface paysage réussis**, recettes Chromium des habitants et convois sans erreur JavaScript. Les recettes de performance avec worker et avec worker désactivé ont toutes deux terminé le décor visible, conservé les bornes de cache et restauré l’heure et les pièces. L’intégration HTML est idempotente ; les contenus de jeu web/iOS correspondent et l’archive native contient le HTML actuel.

Vérification après les corrections des personnes du 19 octobre 2026 : les deux recettes de chargement passent encore, avec zéro rendu complet du terrain sur le fil principal pendant les images contrôlées, caches bornés, décor visible terminé et restauration conforme. Les équipes en mission ne sont plus bloquées par la boucle de repos assis ou les conversations ambiantes.

## Prévision des voyages en arrière-plan

L’audit transversal a identifié un autre coût : la suspension d’un long voyage rejouait toute sa prévision synchroniquement, avec un blocage mesuré de 2 121 ms. Cette opération utilise désormais une copie des données de jeu sans reconstruction de la carte ni des illustrations, puis des tranches coopératives de calcul. La première mesure après correction donne 17,5 ms pour l’appel de suspension ; la prévision complète continue ensuite en laissant passer les autres tâches. La reprise du temps absent utilise également des tranches coopératives, avec sauvegarde du temps effectivement rejoué si une nouvelle suspension interrompt le rattrapage. Cette mesure ne garantit pas que chaque image dure moins de 16,7 ms.

`UI_BROWSER_PATH=/usr/bin/chromium node scripts/check-journey-forecast.cjs` vérifie le coût immédiat, la progression d’une tâche témoin pendant le calcul, l’isolation de la vraie campagne et la concordance entre l’arrêt annoncé et la reprise réelle. Le lieu et la notification sont enregistrés lorsque la prévision est prête ; une sauvegarde encore en attente de cette prévision reste reprenable selon le temps écoulé.

Mesure après l’ensemble des 19 correctifs : trajet terrestre vers `town-11` de 4 777,66 minutes, appel de suspension **13,5 ms**, appel de reprise **0,2 ms**. Le rattrapage complet prend environ 1,91 s de temps réel dans cette recette et laisse passer 63 exécutions de la tâche témoin. La campagne réelle reste inchangée pendant la prévision ; la reprise termine au lieu annoncé. Les coûts immédiats ne représentent pas le temps total du calcul.

## Fluidité après voyage et dialogue

Le profilage du 19 octobre 2026 reproduit deux voyages réels, vers la Citadelle-de-Sarak puis Haut-Givre, avec plusieurs secondes de jeu à chaque arrivée, une conversation avec la fée et la reprise après « Au revoir ». L'ancienne recette de 24 images par lieu ne suffisait pas à mesurer ce coût persistant.

Les recherches locales filtrent maintenant la distance et l'étage avant de calculer les politiques d'hostilité, de présence ou de justice. Cela conserve l'ordre de sélection des personnes éligibles ; un personnage qui entre dans le rayon est pris en compte dès la requête suivante, sans cache de position. Le rendu exclut les personnages entièrement hors écran avant la construction de sa liste de dessin. Leur déplacement, santé, métier, connaissance et rôle dans la simulation ne sont pas suspendus par la caméra.

Les couches de décor qui doivent toujours être dessinées portent désormais un indicateur explicite. Une coordonnée négative du monde ne vaut plus instruction de dessin systématique : les ennemis, restes et objets lointains des régions au nord sont filtrés normalement, sans être retirés du monde. Les couches du pont et des escaliers conservent leur ordre et leur dessin.

La synchronisation des groupes ne remplace plus les tableaux de personnages lorsqu'aucun membre ne change. Le registre des travailleurs reste ainsi réutilisable ; les métiers et les états de santé continuent d'être synchronisés, et les représentations obsolètes ou éloignées restent déchargées. Aucun effectif, stock ou contrat n'est supprimé pour réduire le travail.

Une demande de marche de durée nulle ne lance plus une recherche de chemin. Une destination dont la case est bloquée est refusée immédiatement, au lieu d'explorer jusqu'à 2 200 nœuds. La recherche suivante vérifie de nouveau l'obstacle : ouvrir un passage reste immédiatement pris en compte. Les chemins de référence accessibles gardent exactement leurs points et leur ordre.

Recette soutenue, avec traitement normal des événements et sauvegardes par l'application :

```sh
UI_BROWSER_PATH=/usr/bin/chromium node scripts/check-world-framerate.cjs
PERF_NO_WORKER=1 UI_BROWSER_PATH=/usr/bin/chromium node scripts/check-world-framerate.cjs
```

Pour comparer un ancien HTML autonome, `FPS_HTML=/chemin/ancien-index.html` utilise ce HTML avec le même protocole. La recette relève séparément la simulation, le rendu, les intervalles réels entre callbacks d'affichage et les appels aux politiques coûteuses. Elle contrôle deux voyages terminés, le gel de l'horloge pendant le dialogue, sa reprise après fermeture, l'unicité des personnes, les caches bornés et la restauration de l'heure et de la bourse. Les durées de travail ne sont pas une mesure directe du FPS d'un iPhone.

Mesure comparative locale, même navigateur et même protocole, référence `324ebcd` (180 images après chaque fermeture) :

| Séquence | Médiane avant | Médiane après | 95e centile avant | 95e centile après |
| --- | ---: | ---: | ---: | ---: |
| Reprise après dialogue à Sarak | 14,5 ms | 6,3 ms | 20,7 ms | 11,2 ms |
| Reprise après dialogue à Haut-Givre | 15,4 ms | 6,6 ms | 29,1 ms | 19,0 ms |

Le travail médian d'une image baisse d'environ 56 % dans ces deux séquences. À Haut-Givre, les appels à la qualification d'hostilité batracienne passent de 15 144 623 à 94 799 sur la séquence, soit une baisse de plus de 99 %. Ce sont des coûts et compteurs de cette recette instrumentée, pas une promesse de fréquence d'affichage sur tout appareil. Des pointes de chargement et de sauvegarde restent possibles.

Les intervalles entre callbacks d'affichage donnent aussi environ **39 → 58 images/s** après le dialogue à Sarak et **33 → 52 images/s** à Haut-Givre dans cette recette Chromium. Ils incluent le traitement d'interface et des sauvegardes de la page de test ; ils ne préjugent pas du débit d'un téléphone particulier.

Validation finale : **519 tests JavaScript et 24 tests de bible réussis**, compilation de la bible sans avertissement, recettes soutenues et chargement avec et sans worker, reconstruction HTML idempotente, scripts web/iOS identiques et archive native vérifiée. Les tests spécifiques couvrent les buts de navigation bloqués puis rouverts, les pas de durée nulle, les acteurs qui entrent dans le rayon de menace, les métiers après réutilisation du registre, les représentations de mission mortes, les propriétaires de projectile absents et les coordonnées négatives du monde.
