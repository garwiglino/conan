# Commandes téléphone

Les deux bandes latérales restent à 150 pixels CSS : les marges de l’encoche protègent les commandes dans ces bandes sans être ajoutées une seconde fois à la largeur du terrain. Le calcul reconnaît le tactile dès le premier affichage, avant l’installation de la classe `mobile`. La taille du texte ne modifie pas le cadre du jeu.

Le joystick de 116 pixels reste ancré en bas à gauche. Un contact proche de son socle donne immédiatement une direction ; un contact plus éloigné dans les 48 % gauches du terrain, sous le premier quart de l’écran, crée un socle flottant. Il suit le doigt et retrouve sa position initiale au relâchement, à l’annulation du geste, au changement de visibilité ou à l’ouverture d’un menu. Les menus, dialogues, boutons et le suivi de quête gardent la priorité tactile.

L’attaque dispose d’une cible de 88 pixels, complétée par une tolérance de 12 pixels hors du bouton ; les autres actions ont une tolérance de 6 pixels. La cible la plus proche est choisie. Un second doigt peut attaquer pendant un déplacement, sans interrompre le joystick. Maintenir le bouton n’enchaîne pas les attaques. Les écrans de 350 pixels de haut ou moins utilisent un arc de commandes adapté pour éviter les trois boutons de menu.

Sources : `scripts/mobile-viewport.js`, `scripts/mobile-controls.js`, `scripts/mobile-controls.css`. `npm run embed:mobile-controls` les intègre au HTML web et au HTML iOS hors ligne. Cette intégration est également appelée par la compilation du donjon et du monde.

`npm run check:mobile-controls` contrôle le HTML iOS avec de vrais événements tactiles Chromium sur cinq formats paysage de 568 à 932 pixels, avec et sans encoche simulée : zones sûres, absence de chevauchement, stabilité du terrain, prise du joystick dans le terrain, attaque légèrement manquée, deux doigts, maintien sans répétition, retour au socle, annulation et reprise après menu. Les captures et le rapport sont dans `art/mobile-controls/`. Ce contrôle ne remplace pas un essai sur un téléphone physique.
