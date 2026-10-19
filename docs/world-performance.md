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

Validation de cette version : **431 tests JavaScript réussis**, **24 tests de bible réussis**, compilation de la bible sans avertissement, **120 contrôles d’interface paysage réussis**, recettes Chromium des habitants et convois sans erreur JavaScript. Les recettes de performance avec worker et avec worker désactivé ont toutes deux terminé le décor visible, conservé les bornes de cache et restauré l’heure et les pièces. L’intégration HTML est idempotente ; les contenus de jeu web/iOS correspondent et l’archive native contient le HTML actuel.

Vérification après les corrections des personnes du 19 octobre 2026 : les deux recettes de chargement passent encore, avec zéro rendu complet du terrain sur le fil principal pendant les images contrôlées, caches bornés, décor visible terminé et restauration conforme. Les équipes en mission ne sont plus bloquées par la boucle de repos assis ou les conversations ambiantes.
