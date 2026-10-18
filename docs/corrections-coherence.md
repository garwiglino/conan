# Corrections de cohérence — 18 octobre 2026

Ce registre relie les 21 défauts observés à leurs corrections dans les sources et dans les versions embarquées web/iOS. Il distingue ces défauts des fonctionnalités de conception encore absentes. La bible conserve ses ambitions ; elle ne sert pas de preuve d’implémentation.

## Sauvegarde et économie

| Défaut constaté | Comportement corrigé | Vérification principale |
| --- | --- | --- |
| 1. Deux chargements rapprochés peuvent réinitialiser l’économie | Horloge sauvegardée avec sa fraction ; migration des anciens arrondis sans reconstituer les réserves | `world-coherence`, `world-coherence-runtime` |
| 2. Médicaments absents des commandes de soins | Commandes permanentes minimales et demande nominative des blessés ; guérison contre biens effectivement disponibles | mêmes suites |
| 3. Relève impossible dans beaucoup de relais | Habitants des ports et relais proches présents ; résidents batraciens disponibles admissibles, sans détourner un rôle armé | `world-coherence-runtime`, `world-life-runtime` |
| 4. Ateliers privés de leurs intrants | Besoins de recettes récursifs, production locale compatible avec le potentiel régional, commandes d’importation ; seuil adapté aux outils et tissus indivisibles | `world-coherence`, `world-simulation` |
| 5. Pièces des achats détruites | Paiement transféré à la trésorerie du vendeur réel | `world-coherence`, `world-coherence-runtime` |
| 21. Quais dotés d’une économie fictive indépendante | Compte partagé avec le port ; migration unique des réserves anciennes, sans double consommation ni double production | `world-coherence` |

Les capacités de subsistance et d’entretien ne créent aucun stock au chargement. Les recettes débitent les intrants, les minerais restent finis et les achats peuvent échouer. Les paramètres sont des paramètres de campagne, pas une promesse d’absence de pénurie pendant une guerre, une fermeture ou un hiver rigoureux.

## Personnages, santé et population

| Défaut constaté | Comportement corrigé | Vérification principale |
| --- | --- | --- |
| 6. Recruter puis renvoyer soigne et nourrit gratuitement | Santé proportionnelle réelle au recrutement ; faim, blessures et manteau conservés après renvoi et sauvegarde | `world-coherence-runtime`, `travel-party` |
| 7. Courrier recruté ou en attente poursuit sa tournée | Routine suspendue pendant l’appartenance au groupe ; retour à pied vers son poste après renvoi | `world-coherence-runtime` |
| 8. Courrier critique se déplace | Service et déplacement suspendus jusqu’au soin réel | `world-coherence-runtime`, `world-life-runtime` |
| 9. Voyageurs batraciens trop rapides hors écran | Une seule conversion mètres/pixels et même allure que la marche locale | `world-coherence-runtime`, `batraciens-society` |
| 10. Ennemi sauvage déchargé retrouve sa santé | Santé et position mémorisées ; pertes hors écran consultées au retour | `world-coherence-runtime`, `world-convoys` |
| 11. Cadavre empêche durablement toute apparition hostile | Les morts ne réservent plus une zone de protection de vivant | `world-coherence-runtime` |
| 18. Brigands reconstitués après chaque délai | Membres identifiés d’une bande locale finie ; blessures et morts persistantes ; aucun recrutement gratuit par temporisateur | `world-coherence`, `world-danger` |
| 19. Serpents et cultistes sans cohérence de milieu | Serpents sauvages limités aux biomes et températures admissibles ; morts-vivants aux cellules maudites ; brigands ordinaires humains sans magie | `world-coherence-runtime`, `world-danger`, suites batraciennes |
| 20. Ports exclus du peuplement humain | Les sites habités comprennent les ports ; les quais restent des services du port | `world-coherence-runtime`, `civilians` |

## Nouvelles, transports et sécurité

| Défaut constaté | Comportement corrigé | Vérification principale |
| --- | --- | --- |
| 12. Huit nouvelles récentes effacent les crises actives du conseil | Les dangers connus non résolus passent avant les faits anodins récents ; leur identité reste persistante | `world-coherence` |
| 13. Observation actuelle présentée comme vieille rumeur | Date de confirmation locale distincte de la date de l’incident ; aucune résolution devinée à distance | `world-coherence` |
| 14. Transporteurs et patrouilles omniscients | Devis/refus fondés sur le carnet reçu ; mandat fondé sur le registre local ; danger réel vérifié à l’approche du segment parcouru | `world-coherence-runtime`, suites de voyage et justice |
| 15. Temps restant perdu à la livraison | Livraison unique puis retour avec le temps réellement restant, y compris entre deux heures | `world-coherence`, `world-simulation` |
| 16. Troisième convoi proche figé | Tous les convois terrestres proches ont leurs acteurs ; plafond global de 64 expéditions, sans limite visuelle de deux | `world-convoys` |
| 17. Garde rendue disponible alors qu’elle combat encore | Mission en retour, personnel réservé tant qu’engagé ou physiquement en chemin ; retour local à pied | `world-coherence`, `world-danger` |

## Trois raccordements supplémentaires

- Un combat de convoi observé conserve les adversaires et les unités réellement présents. Hors écran, ils échangent des coups déterministes avec pertes persistantes avant une éventuelle reprise. Une ancienne sauvegarde ne contenant aucun participant ne permet pas de fabriquer une issue : elle attend une observation. Ce mécanisme n’est pas un simulateur général de guerre.
- Les tempêtes ou vents maritimes dangereux suspendent les traversées ; le retour au calme rouvre le passage.
- Les compagnons matériels subissent leur climat, leur tenue et leurs abris. Le manteau achetable coûte deux lots de tissu du relais et quatre pièces versées au vendeur. Exposition, état et vêtement sont sauvegardés.

La prévision d’absence rejoue désormais le moteur de voyage sur une copie isolée du jeu, pauses de repas comprises, plutôt qu’un deuxième calcul divergent.

## Contenu restant à construire

Les corrections ci-dessus ne construisent pas les quartiers et intérieurs des 83 villes, le peuplement physique complet des six espèces, des métiers dont chaque geste produit un lot, la diplomatie opérationnelle, les péages négociables, le pillage, les rançons et la récupération complète des convois abandonnés. Les tournées de garde entre plusieurs relais et les batailles navales restent également hors de cette implémentation. Ces éléments restent des chantiers de contenu et de systèmes ; ils ne sont pas annoncés comme terminés.

## Recette reproductible

Depuis la racine :

```sh
node scripts/embed-world.cjs
PYTHONDONTWRITEBYTECODE=1 python3 scripts/package-ios.py
npm test
UI_BROWSER_PATH=/usr/bin/chromium node scripts/check-world-convoys.cjs
UI_BROWSER_PATH=/usr/bin/chromium node scripts/check-world-society.cjs
```

Les suites `tests/world-coherence*.test.cjs` ajoutent des régressions sur les défauts ci-dessus, dont une année de campagne sous climat doux. Un contrôle automatisé ne remplace pas une recette sur appareil iOS.

Résultat de la recette du 18 octobre 2026 : **403 tests JavaScript réussis**, **24 tests de bible réussis**, contrôle déterministe sans avertissement, recettes navigateur des habitants et des convois sans erreur JavaScript et **120 contrôles d’interface paysage réussis**. La régression ciblée des embuscades réelles a également été rejouée après renforcement du test. L’intégration est idempotente ; le contenu de jeu web/iOS correspond et l’archive native contient le HTML embarqué actuel. Le contrôle paysage a aussi corrigé le retour à la ligne des noms de vêtements en texte agrandi.
