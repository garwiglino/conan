# Mort du colosse

`guardian-death.mid` est un MIDI type 1 à 480 ticks par noire, tempo 120 BPM : une piste de tempo et quatre pistes instrumentales (éclats, frottement, résonance grave, percussions). Le coup principal est placé à 580 ms, au contact des blocs avec le sol ; les petits impacts suivants accompagnent les rebonds. Durée : 1,4 s.

`guardian-death.json` contient exactement les mêmes notes et durées pour le séquenceur chiptune du jeu. Le son ne dépend d'aucun fichier audio externe et reste disponible hors ligne. Il passe par le bus des bruitages : couper la musique ne le coupe pas, couper les bruitages le coupe.

Reconstruction : `node scripts/build-guardian-cue.cjs`, puis `node scripts/embed-guardian.cjs` pour synchroniser le fichier iOS. Les tests comparent les événements MIDI à la partition utilisée dans le jeu.

La musique de combat préexistante reste inchangée. Son déclenchement exige un colosse engagé, à portée et au même étage ; une simple proximité avec un gardien inactif ne suffit pas. Entrée en 650 ms, maintien de quatre secondes après la fin de l'affrontement, puis retour à l'exploration en 1,8 s. Les notes des deux morceaux continuent pendant le fondu. Les inversions rapides conservent le volume courant ; la musique du boss et celle de défaite gardent leur priorité.
