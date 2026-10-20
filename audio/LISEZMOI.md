# Mort du colosse

`guardian-death.mid` est un MIDI type 1 à 480 ticks par noire, tempo 120 BPM : une piste de tempo et quatre pistes instrumentales (éclats, frottement, résonance grave, percussions). Le coup principal est placé à 580 ms, au contact des blocs avec le sol ; les petits impacts suivants accompagnent les rebonds. Durée : 1,4 s.

`guardian-death.json` contient exactement les mêmes notes et durées pour le séquenceur chiptune du jeu. Le son ne dépend d'aucun fichier audio externe et reste disponible hors ligne. Il passe par le bus des bruitages : couper la musique ne le coupe pas, couper les bruitages le coupe.

Reconstruction : `node scripts/build-guardian-cue.cjs`, puis `node scripts/embed-guardian.cjs` pour synchroniser le fichier iOS. Les tests comparent les événements MIDI à la partition utilisée dans le jeu.

La musique de combat préexistante reste inchangée. Son déclenchement exige un colosse engagé, à portée et au même étage ; une simple proximité avec un gardien inactif ne suffit pas. Entrée en 650 ms, maintien de quatre secondes après la fin de l'affrontement, puis retour à l'exploration en 1,8 s. Les notes des deux morceaux continuent pendant le fondu. Les inversions rapides conservent le volume courant ; la musique du boss et celle de défaite gardent leur priorité.

# Musiques du jeu

Treize morceaux : les neuf familles de biomes (`biome_forest`, `biome_coast`, `biome_desert`, `biome_steppe`, `biome_tropical`, `biome_wetland`, `biome_boreal`, `biome_polar`, `biome_cursed`), le voyage (`biome_travel`), le combat contre les colosses (`combat`), le Prêtre du Serpent (`boss`) et la défaite (`gameover`, avec une introduction de deux mesures). Le thème de l'écran titre, *The Ember Crown*, n'est pas concerné.

Couleur : dark fantasy, dans l'esprit des films de barbares. Modes mineurs et phrygiens, quintes à vide plutôt que tierces, cors à l'unisson ou en quintes, chœur grave tenu ou scandé, cordes qui martèlent un ostinato, timbales, tambours de guerre, enclume et gong. L'exploration est lente (56 à 100 BPM), le combat à 138 BPM, le Prêtre du Serpent à 150 BPM.

| Morceau | Titre | Mode, tempo | Couleur |
|---|---|---|---|
| `biome_forest` | Les chênes noirs | ré éolien, 76 | cor seul sur une lyre, chœur, tambour lointain |
| `biome_coast` | La mer des pillards | do mineur balancé, 56 | coups de rame, chœur de marins |
| `biome_desert` | Sables de Sarak | mi phrygien majeur, 84 | anche sur bourdon, darbouka |
| `biome_steppe` | Les cavaliers des steppes | la mineur balancé, 92 | galop, cordes graves, cors en quintes |
| `biome_tropical` | Les jungles de Kush | fa dièse phrygien, 100 | tambours en 3-3-2, chœur qui scande, marimba |
| `biome_wetland` | Les eaux mortes | sol mineur, 66 | complainte aux cordes, gouttes de harpe |
| `biome_boreal` | Les terres du Nord | si mineur, 80 | appels de cor, timbales |
| `biome_polar` | Glace éternelle | do dièse mineur, 60 | cloches de glace, cors graves, chœur |
| `biome_cursed` | Terres maudites | do mineur, 60 | cœur qui bat, glas, plainte qui tremble |
| `biome_travel` | La route des guerriers | ré mineur, 92 | marche, cordes, cors à l'unisson, enclume |
| `combat` | Le choc des colosses | mi phrygien, 138 | ostinato de cordes, chœur scandé, tambours |
| `boss` | Le Prêtre du Serpent | do phrygien, 150 | motif qui ondule, chœur de culte, gong |
| `gameover` | Défaite | la mineur, 60 | cor grave, chœur funèbre, timbale |

Les voix sont celles du thème titre, assombries : cor en dents de scie filtrées, chœur à formants, timbales et cloches, plus le triangle 4 bits en basse, des ondes carrées pour l'anche et les plaintes, et la batterie en bruit LFSR. Le séquenceur ajoute trois sons à sa batterie : tambour de guerre (note 35), gong (52) et enclume (80, ondes carrées inharmoniques).

La source unique est `scripts/chiptune-songs.cjs`. Chaque mesure s'écrit en notes et durées sur une grille fixe : 16 doubles croches, ou 12 croches de triolet pour les morceaux balancés (côte, steppe). `D5:4` est un ré 5 de quatre pas, `-:2` un silence de deux pas. Le build refuse une mesure qui ne remplit pas exactement sa grille, un couloir de batterie de la mauvaise longueur ou un accord inconnu. Basses, timbales, chœurs, cordes et doublures des cors (octave, quinte ou tierce) sont dérivés des accords écrits pour chaque mesure ; les ostinatos de cordes du combat et du boss sont écrits note à note. `mix` corrige en dB le niveau d'une piste dans un morceau.

`npm run build:music` écrit `audio/music-scores.json`, un MIDI type 1 par morceau (`biome_*.mid`, `combat.mid`, `boss.mid`, `gameover.mid`, `gameover-intro.mid`), les intègre au jeu web et iOS, puis reconstruit `art/musique/atelier.html`, la page d'écoute qui utilise le séquenceur du jeu et montre la grille de la mesure en cours.

Les niveaux (`gain`) sont calibrés par rendu hors ligne au volume musique par défaut : environ -48,5 dB pour l'exploration (comme le thème titre et les anciennes musiques), -47,5 dB pour le voyage, -43,3 dB pour combat et boss, -41 dB pour la défaite (médiane sur 400 ms). L'équilibre entre pistes suit celui du thème titre : chœur environ 6 dB sous la mélodie, basse 3 dB, cordes 10 dB. Le séquenceur programme les notes 0,8 s à l'avance (`MUSIC_AHEAD`) : une image lente jusqu'à cette durée ne fait ni sauter ni décaler de note. Dans le scénario du test (plusieurs images lentes jusqu'à 0,7 s), l'ancienne avance de 0,3 s perdait 55 notes sur 191.

Rendu hors ligne avec `web-audio-engine` : ce moteur coupe un nœud resté un moment sans source, ce qui fait taire à tort une piste après un silence ; il faut lui garder une source muette branchée. Il fait aussi tomber à zéro une valeur tenue entre une rampe et un `setValueAtTime` posé plus loin, ce qui coupe les notes longues après 200 ms ; pour mesurer, un tel `setValueAtTime` doit devenir une rampe vers la même valeur. Les navigateurs ne sont concernés ni par l'un ni par l'autre.
