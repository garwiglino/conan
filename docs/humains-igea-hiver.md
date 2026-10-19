# Humains d’Igea — saison enneigée

Les 48 postes existants sont réutilisés, sans nouveau dessin de mobilier. Le catalogue ajoute un **point logique de déneigement**, sans sprite de sol. Les 44 grilles de mobilier restent celles des concepts approuvés. Les personnages, outils, cheval et décors restent séparés.

Le froid n’est pas permanent dans toutes les vallées d’Igea. Le contexte `season: 'igea_winter'` doit être activé d’après l’enneigement observé par le moteur, puis retiré au dégel. Le simple choix d’une tenue `climate: 'neige'` n’active pas les restrictions de saison.

Références : bible des peuples, ressources et événements, notamment Pâlerive (pêche, élevage, laine et bois dans les secteurs forestiers), Haut-Givre (mines accessibles et réserves importées) et Givreval (élevage, fer et productions de vallée). Pas de nouvelle forêt sur la toundra, ni de nouvelle armée nationale.

## Réutilisation et neige

`sprites/decors/igea-hiver.js` définit une politique explicite pour chaque poste. Les masques sont de petites zones supérieures autorisées, dans les coordonnées des grilles existantes. Ils réutilisent exactement `WorldTerrainArt.colors.snow` : pas de recoloration globale ni de nouveau terrain.

- Toit de l’étal, traverse supérieure du puits, sommets des clôtures et quelques extrémités inutilisées : petites accumulations.
- Tables, établis, assises, lits, cuves, fourrage et eau entretenue : dégagés. Les postes sensibles sont employés sous abri ou dans un local.
- Fours, foyer, forge et meule de charbon active : aucune accumulation sur les parties chaudes.
- Pin et minerai : variantes hivernales existantes de l’atlas. Le sol enneigé est celui de `WorldTerrainArt`, fourni par le monde ; son échantillon inchangé sert à l’aperçu hors ligne.

Les mêmes sockets, orientations et masques avant/arrière s’appliquent en hiver. Le foyer utilise un emplacement latéral fixe pour éviter que la tête traverse la marmite. L’abreuvoir possède un socket fonctionnel `water`, sur son compartiment d’eau, distinct de l’opérateur habituel ; ils partagent la même réservation pour éviter deux occupants superposés. Ces emplacements ne sont pas des vues supplémentaires.

## Activités

Cinq postes sont retirés de la sélection active en hiver : irrigation, parcelle cultivable, bassin salin, ruche ouverte et verger. Quatorze gestes sont suspendus : binage, semis, moisson, arrachage, gerbes, irrigation, cueillette, coupe des fibres, tonte, résine, sel solaire, enfumage, miel et taille pendant le gel.

La pêche et la navigation exigent `openWater`, la mine `mineAccessible`, la carrière `quarryAccessible`, la conduite du troupeau `pastureAccessible`, le mortier `frostProtected`. Ces conditions sont fausses par défaut. L’atelier permet de les représenter explicitement ; le moteur devra les déduire du monde, pas les supposer.

Les réserves, le fourrage, les soins aux animaux, le bois de chauffage, la couture, la réparation des filets et le travail en atelier reprennent leurs gestes existants. Pas de doublons d’animations pour ces tâches. Les contraintes de corps masculins pour transports, guerre et travaux pénibles sont conservées.

| Nouveau clip | Poste et outil réutilisés | Séquence et événement |
|---|---|---|
| `clear_snow` | Socket de sol `snow_access`, pelle existante | Engagement, ramassage bas, soulèvement, dépôt latéral, retour ; `snow_scoop`, `snow_deposit` |
| `deice_trough` | Abreuvoir, socket `water`, petit maillet existant | Lever court, contact sur l’eau, retrait ; `ice_contact` |
| `stoke_fire` | Foyer, bois sec existant | Approche des mains, descente du bois, dépôt, retrait vide ; `fuel_place`, fin fixe |
| `warm_hands` | Foyer existant | Mains rapprochées vers la chaleur, petits mouvements alternés ; boucle |

Le déneigement modifie le sol du monde au dépôt, et le déglaçage son état d’eau au contact. Les événements sont livrés ; ils ne modifient pas eux-mêmes la simulation. Le maillet concerne une mince pellicule dans un récipient entretenu : aucune activité sur une étendue d’eau supposée porteuse n’a été inventée.

## API et lecture

Charger `igea-hiver.js` avant `postes-humains.js` dans le navigateur ; CommonJS résout ce lien automatiquement.

```js
const Scene = require('../sprites/humains/scene');
const winter = { season: 'igea_winter' };
const frame = Scene.raster({
  ...winter, role: 'forester', action: 'clear_snow', frame: 3,
  terrain: true // aperçu du sol existant, hors des frames du personnage
});
const fishing = Scene.raster({
  ...winter, role: 'fisher', action: 'cast_net', frame: 3,
  conditions: { openWater: true }
});
```

`Stations.Winter.availability(action, options)` retourne `allowed`, `state`, `reason` et, au besoin, `requires`. La composition `Scene` refuse les actions suspendues et les postes dormants. Le rendu brut `Activities` conserve tous les clips pour l’édition des sprites, sans politique de monde. `Stations.render({ id, season: 'igea_winter' })` ajoute seulement le décor saisonnier ; il peut aussi représenter une ruche fermée et dormante, sans personnage au travail.

Le contexte hiver est ouvert par défaut dans l’atelier. Il filtre la bibliothèque et désactive les gestes incompatibles. La section « Conditions observées » ouvre les activités conditionnelles. Décocher « Igea · saison enneigée » redonne la collection générale.

## Vérification et livrables

- `npm run test:humans` : 36 tests, 4 548 images directionnelles générales et 4 100 hivernales ; sockets constants, contacts, neige autorisée, sources intactes, aucun découpage hors cellule.
- `npm run check:human-workshop` : contrôles réels dans Chromium, sélection saisonnière, conditions, vues fixes et affichage mobile.
- `npm run preview:igea` : planches `igea-postes.png`, `igea-animations.png` et audit détaillé `data/humains/igea-hiver.json`.

Ce lot comprend la bibliothèque JavaScript, les événements de clips et l’atelier interactif. Il ne branche pas encore ces animations au peuplement ni à l’ordonnanceur des PNJ du jeu principal.
