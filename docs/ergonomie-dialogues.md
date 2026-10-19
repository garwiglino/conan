# Dialogues et ergonomie — correctif Codex / ChatGPT

Cette révision corrige le comportement de l'interface après la refonte paysage.

- « Au revoir » appartient désormais au même bloc que les réponses. Sa position
  ne dépend plus des règles du joystick ou de la marge droite de la console.
- « Suite » et « Terminer » sont explicites et occupent le même emplacement
  que la commande de sortie des choix.
- La bulle conserve sa position et ses dimensions quand la longueur de la
  réplique change, quand le texte apparaît et quand les réponses s'affichent.
  Elle utilise une zone de lecture fixe sous le HUD, sans queue pointant vers
  un personnage auquel elle n'est plus ancrée. Les textes longs restent accessibles
  par défilement interne. L'affichage des choix ne déplace plus la caméra.
- Les indices des choix incluent correctement la sortie : le clavier peut
  atteindre « Au revoir », le surligner et le valider. Échap sélectionne la vraie
  option de départ ; il n'accepte pas une proposition de quête.
- Le passage au jeu ou au titre synchronise immédiatement la visibilité des
  commandes, sans attendre la prochaine image du rendu.

## Commandes conservées ou retirées

Le bouton « Reprendre » est la fermeture commune du menu. La croix supplémentaire
sur ordinateur est masquée. Dans les options du jeu, « Retour » est masqué car
les rubriques latérales et « Reprendre » couvrent déjà la navigation ; il reste
présent dans les options de l'accueil où il est nécessaire. « Menu principal »
conserve sa fonction distincte de sortie de la partie. Les actions de carte,
transport, soin et compagnie sont conservées : elles ont des effets distincts.

## Noms des personnages

Les personnages humains, civils et batraciens utilisent le même rendu de nom :
10,5 pixels CSS à 100 %, avec la préférence de lecture appliquée, indépendamment
du zoom du monde. Le fond sombre opaque, le filet bronze et le texte clair
permettent de lire le nom sur les sols clairs et la végétation. Le cartouche
est placé sous les pieds pour libérer le visage, les marqueurs de quête et
les jauges. Les noms proches utiles et ceux des donneurs de quête restent
visibles ; les noms éloignés sont écartés pour réduire les superpositions.
Les intitulés longs sont raccourcis dans le monde ; la conversation affiche
le nom du locuteur. Aucun identifiant ou état de personnage sauvegardé ne change.

## Vérification

`tests/interaction-ui.test.cjs` vérifie la stabilité de la géométrie et la taille
physique des noms à plusieurs zooms. Les suites menus, texte, civils et raccord
combat continuent d'exercer les actions et leurs états.

`scripts/check-dialogue-ergonomics.cjs` parcourt de vraies conversations avec un
transporteur présent : texte court puis long, choix construits par le jeu,
navigation jusqu'à « Au revoir », validation, fin et Échap. Il compare les
rectangles de la bulle entre les étapes et teste les points réellement touchables.
Configurations : 568 × 320 à 125 %, 844 × 390 à 100 % et 932 × 430 à 125 %.

L'audit général `scripts/check-landscape-ui.cjs` complète ces parcours sur les
six configurations de la refonte. Les copies de test désactivent l'effet
initial d'apparition de Kaldor avant les captures ; les fichiers distribués
gardent cet effet. Les captures des conversations réelles portent le préfixe
`dialogue-real-` dans `art/ui-landscape/`.

Vérification navigateur sous Chromium. Aucun essai sur iPhone physique.

Résultat final : **24 tests fonctionnels ciblés réussis, 138 contrôles
sur la matrice paysage réussis et 3 parcours de conversations réelles réussis**,
sans erreur JavaScript. Le paquet iOS hors ligne est reconstruit avec les
mêmes corrections que la version web.

## Révision demandée : bulles dans le monde et fiche joueur

Implémentation : Codex / ChatGPT, pour transmission à Claude.

Les répliques restent des bulles avec pointe, ancrées au locuteur et contraintes à la zone visible. Leur enveloppe reste stable entre les lignes et les choix. Les décisions flottent à 28 px du bas (plus zone sûre), avec Au revoir fixé à droite dans la zone des actions. Les noms se placent au-dessus des têtes et tiennent compte de la hauteur du personnage et de son étage.

La fiche Inventaire regroupe désormais portrait animé, niveau, santé, têtes, argent et XP en haut à gauche, les objets en cases en dessous, le climat à leur suite, et la tenue à droite. Les vêtements et casques se changent directement dans cette même fenêtre, avec les animations existantes. Les onglets internes et l’aller-retour Inventaire/Tenue sont supprimés. Le contenu garde un défilement contenu pour les collections longues et les écrans très courts.

Vérification de cette révision : trois conversations réelles (568×320 à 125 %, 844×390 à 100 %, 932×430 à 125 %) ; audit des écrans sur les trois formats, avec changement effectif de vêtement et de casque dans la fiche ; tests ciblés des menus, de la tenue et des métriques de dialogue réussis. Captures de la fiche et des conversations dans `art/ui-landscape/`.

### Ancrages définitifs des choix (correction utilisateur)

L’encart des choix est centré horizontalement dans le rectangle réel du canvas et collé à son bord inférieur, sans marge basse. Les actions Au revoir et Suite sont des éléments frères de cet encart, positionnés dans la colonne de droite, et ne dépendent plus de sa position. La géométrie se recalcule avec celle du canvas après un changement de taille. Les trois conversations réelles vérifient explicitement le centrage, le contact avec le bas du canvas et la présence du bouton dans la colonne de droite.

Les répliques dépassant la bulle fixe sont désormais paginées à la limite des
mots, d’après la place mesurée avec la police, la taille de texte et le format
actuels. Une pression termine d’abord l’apparition de la page ; la pression
suivante affiche la suite de la même réplique. Le moteur ne passe ensuite qu’à
la réplique suivante, au choix, au panneau de quête ou à la fin de conversation.
Les longs préambules des menus suivent la même règle. Un changement de format
conserve la position dans la réplique. Seul un mot isolé trop long pour une page
entière peut être partagé, sans couper une paire Unicode.
