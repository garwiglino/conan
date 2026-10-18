# Livraison intégrée du 18 octobre 2026

Responsable de ces ajouts : Codex / OpenAI. Note de transmission pour Claude.

## Contenu conservé

- Batraciens : corps sous les boucliers, tenues, coiffes, armes sorties au repos,
  attaques différenciées, smears, blocage, déplacement face à la cible et combos.
  Leurs sources de sprites sont identiques à celles de la consolidation locale
  précédente ; les noms au-dessus des têtes suivent l'interface récente.
- Hommes-singes : base native JavaScript, démarche et bob de tête, cinq pelages,
  silhouettes masculine/féminine, 16 fonctions/tenues, 55 activités, occultations,
  atelier animé, manifestes, répartition et catalogue de la bible.
- Interface : bulles dans le monde, choix centrés au bas sans marge inférieure,
  au revoir dans la colonne de droite, fiche joueur/inventaire/tenue unifiée.
- Vie locale : discussions et petites bulles, voyageurs routiers, réactions aux
  menaces, patrouilles et brigands liés aux incidents.
- Persistance, temps unifié, économie causale, blessures critiques des personnes
  essentielles et relève : `docs/living-world-integration.md`.
- Justice locale et convois physiques : `docs/world-justice.md`.

L'historique distant de référence est `d212ef9` (`origin/main`, PR 9), fusionné
sans écrasement forcé. Les anciennes variantes d'interface ne remplacent pas les
corrections plus récentes. Les sources validées restent compilées dans les deux
HTML web/iOS ; le paquet iOS est régénéré à partir de ces sources.

## Vérifications de livraison

- Tests des hommes-singes, du combat batracien et de l'intégration PR 4.
- Tests de justice, économie, convois, persistance, vie locale et menus.
- Recette navigateur des convois : déplacement sur le vrai terrain, groupe rendu,
  continuité proche/lointaine, blessure persistante, arrêt/reprise.
- Recette navigateur des discussions et des dialogues en paysage : 568×320,
  844×390 et 932×430, dont taille de texte à 125 %.
- Compilateur et tests de la bible ; identité du bloc monde web/iOS et paquet iOS.

Les tests d'interface antérieurs qui exigeaient encore des sous-onglets ont été
adaptés à la fiche unifiée déjà demandée, sans modifier l'interface à cette fin.
Le test de risque routier positionne l'incident sur le tronçon qu'il mesure,
plutôt que d'attendre une contamination de toute la route.

## Ne pas confondre fichiers livrés et fonctionnalités achevées

Les hommes-singes sont des ressources et un référentiel de population : les
ateliers ne peuplent pas encore automatiquement le monde de nouveaux acteurs.
Les sprites de véhicules et escortes restent provisoires, comme demandé.
Pas de résolution automatique des combats hors écran, de bataille navale,
de pillage/récupération jouable de cargaison ou de diplomatie militaire complète.
Les limites du monde vivant restent détaillées dans les documents cités.
