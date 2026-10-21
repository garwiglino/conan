# Niveau 1 — Forteresse de Grise-Gueule

La nouvelle partie commence dans les geôles, avec Kaldor seul. Le donjon reprend les plans, les ressources Piskel et les personnages de la [PR #11 de Claude](https://github.com/garwiglino/conan/pull/11), tête `d4a305bf822d928f17741157cfb87d2fa8060135`. Les modifications récentes du monde, des routes, de Clairfoyer et des armes sont conservées. Le Temple du Serpent reste une aventure ultérieure dans le monde.

## Parcours jouable

1. Dans les **geôles**, contourner la paillasse par la brèche, traverser l’ossuaire, rejoindre la salle des gardes et actionner le levier des cellules. Prendre la clé serpent, déverrouiller sa porte et monter.
2. Dans la **grande salle**, pousser une caisse sur chacune des deux dalles pour lever la herse de l’escalier. La réserve contient une caisse ; l’autre est dans la salle. La porte violette reste scellée.
3. Dans les **galeries**, abaisser les deux leviers pour ouvrir l’armurerie. La clé crâne permet d’atteindre le treuil, qui active le monte-charge.
4. Descendre à la **caserne** par le monte-charge, prendre la clé croc et ouvrir le raccourci vers la grande salle. Le fond du puits, aux geôles, contient du butin facultatif. Remonter aux galeries pour ouvrir la porte croc.
5. Dans la **salle du trône**, vaincre Grise-Gueule. Le levier du fond libère alors la fée. La porte du chef se ferme pendant le combat et se libère après sa mort ; une reprise après décès permet de retenter le combat.
6. Redescendre avec la fée jusqu’à la porte scellée. L’action de sortie termine le niveau et conduit dans l’étendue sauvage de Sarak, près de Safrane, aux coordonnées du plan (61 553 m, 29 042 m), ou au sol praticable voisin.

Marcher contre une caisse la pousse ; **Agir / E** permet de la tirer en reculant pour la dégager d’un mur. Les deux dalles doivent rester occupées. Les clés restent dans l’inventaire et ne sont pas consommées. Le monte-charge propose ses trois arrêts par le menu de dialogue. Les coffres facultatifs donnent cinq pièces et une fiole, dans la limite du sac.

Les pièces fermées cachent leur contenu. Leurs murs restent perceptibles ; les pièces découvertes s’éclairent progressivement et restent connues. Les murs devant Kaldor deviennent transparents pour garder le héros visible. Les torches, braseros, cage et rune utilisent les images animées du kit.

## Progression et sauvegardes

Le journal suit la quête principale **La forteresse de Grise-Gueule**. Les anciennes quêtes du monde sont suspendues à l’intérieur. La carte, les transports et le panneau des compagnons restent inaccessibles pendant la captivité : l’indication est **Lieu inconnu**.

La sauvegarde conserve l’étage, la position, les ennemis et leur santé, les clés, les leviers, les portes, les caisses, les coffres, le monte-charge, les pièces découvertes, la mort du chef et la libération de la fée. Chaque arrivée d’escalier ou de monte-charge fixe la reprise. Un décès garde les mécanismes résolus et dépense une vie selon la règle habituelle. La sauvegarde pendant un décès reprend à cette arrivée, sans enfermer le joueur derrière la porte du chef.

À la sortie, la fée rejoint l’exploration, le lieu devient connu sur la carte, la reprise se fixe dehors et les trois sceaux du Temple du Serpent deviennent disponibles. Elyne attend au Campement des Exilés. Les sauvegardes antérieures sans bloc `dungeon` restent à leur position et ne commencent pas ce niveau.

## Sources et reconstruction

- Plan de Claude : `data/donjons/forteresse-grise-gueule.json`.
- Sources originales et PNG : `art/environnement/interieurs/forteresse-gobeline/`, `art/gobelins/`.
- Compilation des pixels : `scripts/build-dungeon.cjs`, vers `data/donjons/compiled/forteresse-grise-gueule.json`.
- Jeu et rendu : `scripts/dungeon-runtime.js`, `scripts/dungeon-render.js`.
- Assemblage web/iOS hors ligne : `scripts/embed-dungeon.cjs`, appelé après `embed-world.cjs`.

`npm run build:dungeon` reconstruit les pixels et les deux HTML. `npm run embed:world` réintègre aussi le donjon après le monde. `npm run donjon:environment` reconstruit les planches de conception. `npm run package:ios` actualise l’archive native avec le jeu hors ligne.

`npm run test:dungeon` vérifie les sources et le parcours réel à travers les collisions : portes, deux caisses poussées sur les dalles, deux leviers, trois clés, escaliers, monte-charge, chef, fée, retour et sortie. Les tests couvrent également les attaques par les commandes normales, la garde, l’esquive, les caisses tirées, les sauvegardes et les anciennes parties. `npm run check:dungeon` vérifie le démarrage, les quatre rendus, le menu, la carte cachée et le rechargement depuis les interfaces ordinateur et mobile.

Captures réelles : [départ sur mobile](../art/dungeon-integration/mobile-geoles.png), [grande salle](../art/dungeon-integration/desktop-grande-salle.png), [galeries](../art/dungeon-integration/desktop-galeries.png), [chef](../art/dungeon-integration/desktop-trone.png). Résultat navigateur : `art/dungeon-integration/verification.json`.

## Limites de cette intégration

Les gobelins utilisent les quatre vues Piskel de Claude, avec déplacement, orientation, anticipation de frappe et blessure. Le chef reprend cette anatomie dans une silhouette plus haute et une massue dessinée en pixels ; il n’a pas encore de planche d’animation dédiée. Le donjon n’a pas encore de musique originale. L’extérieur est un lieu connu sur la carte ; la façade visitable et la réentrée ne sont pas implémentées. Le contrôle navigateur utilise Chromium ; la compilation et l’installation natives Xcode ne sont pas vérifiées dans cet environnement.

## Continuité du moteur et de l’interface

Le donjon conserve le HUD horizontal du monde (santé, vies, pièces, expérience, satiété et sceaux), les commandes et les bulles habituelles. La carte de lieu indique « Lieu inconnu », l’étage, les clés et les fioles ; aucune autorité extérieure ni recherche régionale n’est affichée pendant la captivité.

La vue projetée reste stable entre les images : les huit poses de marche de Kaldor suivent sa distance réellement parcourue. Les attaques réutilisent le traitement commun des pauses d’impact et des commandes mises en attente, avec l’avancée soumise aux collisions, les effets de sang, les particules, les gains et la fée du moteur actuel. Les plans, les pixels du donjon et la progression enregistrée sont conservés.

Le contrôle navigateur vérifie aussi huit poses distinctes pendant une marche simulée avec les commandes normales, la stabilité de la projection, le HUD commun et le rendu des effets. `tests/dungeon-presentation.test.cjs` couvre la pause de contact, la direction des commandes mises en attente et l’avancée unique par frappe.
