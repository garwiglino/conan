# Conan — Le Temple du Serpent

Jeu d'action en pixel art, jouable dans le navigateur (clavier ou écran tactile).

**Jouer :** https://garwiglino.github.io/conan/

Sur iPhone : ouvrir l'adresse dans Safari, puis Partager › « Sur l'écran d'accueil » (laisser « Ouvrir en tant qu'app web » activé) pour jouer en plein écran.

Le colosse gardien utilise 32 animations Aseprite : huit actions dans quatre directions, avec un repos animé, une saisie synchronisée avec Conan et une mort en pierres sans sang. Sa chute accélère sous la gravité, avec des rebonds amortis et un peu de poussière. Les sprites sont inclus dans le jeu pour rester disponibles hors ligne.

Le morceau de combat accompagne les affrontements avec les colosses. Il entre par un fondu croisé de 650 ms ; après quatre secondes sans affrontement, l'exploration revient sur 1,8 s. Le boss conserve sa musique. Le bruit de mort est composé en [MIDI multipiste](audio/guardian-death.mid) et joué par le séquenceur du jeu, indépendamment du réglage de musique.

Le Prêtre du Serpent utilise maintenant son [pack Aseprite](sprites/personnages/pretre/) : 124 animations, 1 280 poses, quatre directions et deux phases. Ses frappes gardent leur direction pendant l'élan et le retour ; les sorts de jade suivent les mêmes images que leurs zones de dégâts. L'éventail lance trois projectiles depuis sa main, la nova s'étend au sol et les trois éruptions jaillissent successivement. La victoire attend les 1,9 seconde de sa chute. Les sources et les effets sont inclus dans la mise à jour iOS.

Dans l'app iOS native, fermer complètement l'app puis la rouvrir avec une connexion pour recevoir la mise à jour. La sauvegarde existante est conservée ; cette mise à jour du jeu ne demande pas de réinstallation Xcode. Voir [les instructions iOS](ios/LISEZMOI.md).

## Crédits
- Polices : [Alagard](https://www.dafont.com/alagard.font) (Hewett Tsoi) · [Pixel Operator](https://www.dafont.com/pixel-operator.font) (Jayvee Enaguas, CC0)
