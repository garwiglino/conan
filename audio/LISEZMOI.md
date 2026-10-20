# Mort du colosse

`guardian-death.mid` est un MIDI type 1 à 480 ticks par noire, tempo 120 BPM : une piste de tempo et quatre pistes instrumentales (éclats, frottement, résonance grave, percussions). Le coup principal est placé à 580 ms, au contact des blocs avec le sol ; les petits impacts suivants accompagnent les rebonds. Durée : 1,4 s.

`guardian-death.json` contient exactement les mêmes notes et durées pour le séquenceur chiptune du jeu. Le son ne dépend d'aucun fichier audio externe et reste disponible hors ligne. Il passe par le bus des bruitages : couper la musique ne le coupe pas, couper les bruitages le coupe.

Reconstruction : `node scripts/build-guardian-cue.cjs`, puis `node scripts/embed-guardian.cjs` pour synchroniser le fichier iOS. Les tests comparent les événements MIDI à la partition utilisée dans le jeu.

La musique de combat préexistante reste inchangée. Son déclenchement exige un colosse engagé, à portée et au même étage ; une simple proximité avec un gardien inactif ne suffit pas. Entrée en 650 ms, maintien de quatre secondes après la fin de l'affrontement, puis retour à l'exploration en 1,8 s. Les notes des deux morceaux continuent pendant le fondu. Les inversions rapides conservent le volume courant ; la musique du boss et celle de défaite gardent leur priorité.

# Musiques 8 bits

Treize morceaux : les neuf familles de biomes (`biome_forest`, `biome_coast`, `biome_desert`, `biome_steppe`, `biome_tropical`, `biome_wetland`, `biome_boreal`, `biome_polar`, `biome_cursed`), le voyage (`biome_travel`), le combat contre les colosses (`combat`), le Prêtre du Serpent (`boss`) et la défaite (`gameover`, avec une introduction de deux mesures). Le thème de l'écran titre, *The Ember Crown*, n'est pas concerné.

La source unique est `scripts/chiptune-songs.cjs`. Chaque mesure s'écrit en notes et durées sur une grille fixe : 16 doubles croches, ou 12 croches de triolet pour le balancé de la côte. `D5:4` est un ré 5 de quatre pas, `-:2` un silence de deux pas. Le build refuse une mesure qui ne remplit pas exactement sa grille, un couloir de batterie de la mauvaise longueur ou un accord inconnu. Basses, arpèges, nappes et contrechants automatiques sont dérivés des accords écrits pour chaque mesure.

`npm run build:music` écrit `audio/music-scores.json`, un MIDI type 1 par morceau (`biome_*.mid`, `combat.mid`, `boss.mid`, `gameover.mid`, `gameover-intro.mid`), les intègre au jeu web et iOS, puis reconstruit `art/musique/atelier.html`, la page d'écoute qui utilise le séquenceur du jeu et montre la grille de la mesure en cours.

Les niveaux (`gain`) sont calibrés par rendu hors ligne au volume musique par défaut : environ -58 dB pour l'exploration, -57 dB pour le voyage, -52 dB pour combat et boss, -51 dB pour la défaite (médiane sur 400 ms). Le séquenceur programme les notes 0,8 s à l'avance (`MUSIC_AHEAD`) : une image lente jusqu'à cette durée ne fait ni sauter ni décaler de note. Dans le scénario du test (plusieurs images lentes jusqu'à 0,7 s), l'ancienne avance de 0,3 s perdait 55 notes sur 191.

Rendu hors ligne avec `web-audio-engine` : ce moteur coupe un nœud resté un moment sans source, ce qui fait taire à tort une piste après un silence. Pour mesurer une piste, il faut lui garder une source muette branchée ; les navigateurs ne sont pas concernés.

