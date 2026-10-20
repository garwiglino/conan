# Mort du colosse

`guardian-death.mid` est un MIDI type 1 à 480 ticks par noire, tempo 120 BPM : une piste de tempo et quatre pistes instrumentales (éclats, frottement, résonance grave, percussions). Le coup principal est placé à 580 ms, au contact des blocs avec le sol ; les petits impacts suivants accompagnent les rebonds. Durée : 1,4 s.

`guardian-death.json` contient exactement les mêmes notes et durées pour le séquenceur chiptune du jeu. Le son ne dépend d'aucun fichier audio externe et reste disponible hors ligne. Il passe par le bus des bruitages : couper la musique ne le coupe pas, couper les bruitages le coupe.

Reconstruction : `node scripts/build-guardian-cue.cjs`, puis `node scripts/embed-guardian.cjs` pour synchroniser le fichier iOS. Les tests comparent les événements MIDI à la partition utilisée dans le jeu.

La musique de combat préexistante reste inchangée. Son déclenchement exige un colosse engagé, à portée et au même étage ; une simple proximité avec un gardien inactif ne suffit pas. Entrée en 650 ms, maintien de quatre secondes après la fin de l'affrontement, puis retour à l'exploration en 1,8 s. Les notes des deux morceaux continuent pendant le fondu. Les inversions rapides conservent le volume courant ; la musique du boss et celle de défaite gardent leur priorité.

# Musiques du jeu

Treize morceaux : les neuf familles de biomes (`biome_forest`, `biome_coast`, `biome_desert`, `biome_steppe`, `biome_tropical`, `biome_wetland`, `biome_boreal`, `biome_polar`, `biome_cursed`), le voyage (`biome_travel`), le combat contre les colosses (`combat`), le Prêtre du Serpent (`boss`) et la défaite (`gameover`, avec une introduction de deux mesures). Le thème de l'écran titre, *The Ember Crown*, n'est pas concerné.

Exploration et voyage sont des **ambiances**, pas des thèmes : bourdon de basse, chœur qui enfle et retombe à chaque mesure, quelques gouttes de harpe, de marimba ou de cloche, un tambour lointain et feutré, parfois un appel de deux ou trois notes. Elles jouent sous le niveau du thème titre pour rester en fond. Les **thèmes** mélodiques sont réservés au combat, au Prêtre du Serpent et à la défaite, en dark fantasy dans l'esprit des films de barbares : modes mineurs et phrygiens, cors à l'unisson ou en quintes, chœur scandé, cordes qui martèlent un ostinato, timbales, tambours de guerre, enclume et gong.

| Morceau | Titre | Mode, tempo | Couleur |
|---|---|---|---|
| `biome_forest` | Sous les chênes noirs | ré éolien, 52 | chœur qui respire, gouttes de lyre, tambour lointain |
| `biome_coast` | Brumes de la côte | do mineur, 46 | houle du chœur, harpe qui roule, ressac sourd |
| `biome_desert` | Sables de Sarak | mi phrygien majeur, 50 | bourdon, anche lointaine, darbouka feutrée |
| `biome_steppe` | Le vent des steppes | la éolien, 54 | quintes ouvertes comme un vent, cordes graves |
| `biome_tropical` | Les jungles de Kush | fa dièse phrygien, 60 | tambours feutrés en 3-3-2, gouttes de marimba |
| `biome_wetland` | Les eaux mortes | sol mineur, 44 | chœur trouble, basse qui descend, gouttes d'eau |
| `biome_boreal` | Les terres du Nord | si mineur, 50 | quintes ouvertes, cors lointains, timbale |
| `biome_polar` | Glace éternelle | do dièse mineur, 44 | chœur comme un vent, cloche de loin en loin |
| `biome_cursed` | Terres maudites | do mineur, 48 | cœur qui bat, glas, soupir qui tremble |
| `biome_travel` | Sur la route | ré dorien, 60 | pas régulier de la basse, tambour sourd |
| `combat` | Le choc des colosses | mi phrygien, 138 | thème : ostinato de cordes, chœur scandé, tambours |
| `boss` | Le Prêtre du Serpent | do phrygien, 150 | thème : motif qui ondule, chœur de culte, gong |
| `gameover` | Défaite | la mineur, 60 | thème : cor grave, chœur funèbre, timbale |

Les voix sont celles du thème titre, assombries : cor en dents de scie filtrées, chœur à formants, timbales et cloches, plus le triangle 4 bits en basse, des ondes carrées pour l'anche et les plaintes, et la batterie en bruit LFSR. Le séquenceur ajoute trois sons à sa batterie : tambour de guerre (note 35), gong (52) et enclume (80, ondes carrées inharmoniques).

La source unique est `scripts/chiptune-songs.cjs`. Chaque mesure s'écrit en notes et durées sur une grille fixe : 16 doubles croches, ou 12 croches de triolet pour les morceaux balancés (côte, steppe). `D5:4` est un ré 5 de quatre pas, `-:2` un silence de deux pas. Le build refuse une mesure qui ne remplit pas exactement sa grille, un couloir de batterie de la mauvaise longueur ou un accord inconnu. Basses, timbales, chœurs, cordes et doublures des cors (octave, quinte ou tierce) sont dérivés des accords écrits pour chaque mesure ; les ostinatos de cordes du combat et du boss sont écrits note à note. `mix` corrige en dB le niveau d'une piste dans un morceau.

`npm run build:music` écrit `audio/music-scores.json`, un MIDI type 1 par morceau (`biome_*.mid`, `combat.mid`, `boss.mid`, `gameover.mid`, `gameover-intro.mid`), les intègre au jeu web et iOS, puis reconstruit `art/musique/atelier.html`, la page d'écoute qui utilise le séquenceur du jeu et montre la grille de la mesure en cours.

Les niveaux (`gain`) sont calibrés par rendu hors ligne au volume musique par défaut (médiane sur 400 ms) : environ -55 dB pour les ambiances d'exploration et -54 dB pour le voyage, soit 6 dB sous le thème titre (-48,8 dB) ; -43,3 dB pour combat et boss, -41 dB pour la défaite. Dans les thèmes, l'équilibre entre pistes suit celui du thème titre : chœur environ 6 dB sous la mélodie, basse 3 dB, cordes 10 dB. Le séquenceur programme les notes 0,8 s à l'avance (`MUSIC_AHEAD`) : une image lente jusqu'à cette durée ne fait ni sauter ni décaler de note. Dans le scénario du test (plusieurs images lentes jusqu'à 0,7 s), l'ancienne avance de 0,3 s perdait 55 notes sur 191.

Rendu hors ligne avec `web-audio-engine` : ce moteur coupe un nœud resté un moment sans source, ce qui fait taire à tort une piste après un silence ; il faut lui garder une source muette branchée. Il fait aussi tomber à zéro une valeur tenue entre une rampe et un `setValueAtTime` posé plus loin, ce qui coupe les notes longues après 200 ms ; pour mesurer, un tel `setValueAtTime` doit devenir une rampe vers la même valeur. Les navigateurs ne sont concernés ni par l'un ni par l'autre.
