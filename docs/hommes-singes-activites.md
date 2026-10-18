# Hommes-singes — tenues et activités

Ajouts réalisés par Codex / ChatGPT pour transmission à Claude.

L'atelier utilise `activitiesFor(role)` : activités du métier, vie commune et réactions au danger. Les civils n'ont ni attaques ni garde armée ; fuite, blessure, mort et reddition restent disponibles. Les fonctions armées proposent leurs attaques compatibles avec leur équipement et la garde au bouclier uniquement si elles en portent un. Un civil désarmé ne fait pas apparaître de lame à sa mort ou à sa reddition.

Les accessoires de travail suivent la profondeur : les charges, bols, livres et fils sont occultés par le corps dans la vue de dos. Les outils sont partagés entre avant et arrière selon la profondeur de leur poignée et de leur extrémité. Les doigts visibles couvrent la poignée, tandis que la face externe du bouclier masque sa main. Des tests vérifient les pixels de chevauchements réels pour empêcher les accessoires arrière de traverser le corps.

Le module `sprites/hommes-singes/activites.js` complète le corps validé sans modifier ses sources. Il couvre les 55 entrées du catalogue, les 16 fonctions, les deux silhouettes et les cinq pelages. Les activités constituent des ressources visuelles ; elles n'activent pas automatiquement de nouveaux PNJ ni de nouveaux comportements dans le monde.

Les bras articulés réemploient les pixels du modèle initial et une portée limitée par leur longueur native. Les membres et équipements éloignés passent derrière le corps selon la vue ; les smears suivent la profondeur de l'arme. Les mains restent attachées aux outils. Les animations de combat récupèrent progressivement vers la pose de repos.

Les durées sont définies par activité, en millisecondes par pose : préparation, contact et récupération. Marche armée et port de charges sont plus lents que la marche libre ; les travaux lourds ont une préparation et une récupération plus longues ; la couture, le sciage et le tressage ont leurs propres cadences. Les marqueurs de contact du binage, débitage et martelage correspondent à la troisième transition (image 3, indexée depuis zéro). Les attaques différencient préparation, contact bref et récupération.

`frameAt(action, seconds, distance)` fournit une lecture temporelle, ou liée à la distance pour les locomotions. Le moteur garde la responsabilité du déplacement et de sa vitesse ; la distance évite de faire glisser les pieds. `eventsBetween` émet les contacts traversés sans répéter l'événement à chaque rendu. Une animation à fin fixe reste sur sa dernière image ; seule la case de répétition de l'atelier la relance pour inspection.

`tryBlock` fournit une décision de blocage pour une garde tenue, avec orientation, niveau, visibilité et limite de deux blocages. La marche armée seule ne déclenche pas de défense automatique. Le moteur doit transmettre son état de garde et appliquer les résultats ; cette fonction n'installe pas d'IA à elle seule.

L'atelier de revue est `art/hommes-singes/activites/atelier.html`. Régénérer les planches, le manifeste et cet atelier avec `node scripts/preview-ape-activities.cjs`. Vérifier avec `node --test tests/homme-singe.test.cjs tests/homme-singe-activities.test.cjs`.
