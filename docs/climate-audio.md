# Climat et ambiances de Hearthreaver

Le climat local remplace la météo universelle pour le joueur et les événements de crue/navigation. L'horloge sauvegardée suffit à reconstruire le climat. Une année fictive dure 96 jours de jeu : ce choix rend les saisons observables et n'est pas une reproduction météorologique d'une région terrestre.

| Biome | Régime | Musique / faune |
|---|---|---|
| Mer | Température du territoire côtier, pluie ou neige selon le froid, vent et brume ; pas de manteau sur l’eau | Flûte et cordes / mouettes |
| Désert chaud | Pluies très rares, jamais de neige | Mode phrygien dominant, cordes pincées / rapace, grand-duc |
| Désert et relief aride | Sec et nuits plus fraîches ; à Sarak, aucune neige | Désert / rapace, grand-duc |
| Savane | Saison sèche et fortes pluies saisonnières | Pentatonique, cor et percussions espacées / alouette, insectes |
| Steppe et prairie | Précipitations modérées, neige hivernale | Steppe / oiseaux, insectes |
| Forêt tropicale saisonnière | Longues périodes sèches, mousson plus intense | Pentatonique, cloches et tambours doux / perroquets, grenouilles, insectes |
| Forêt tempérée | Pluie variable, neige seulement au froid, brume surtout nocturne | Flûte, cordes, chœur discret / oiseaux, hibou, insectes |
| Forêt tropicale humide | Pluies fréquentes, renforcées en saison humide, aucune neige | Tropical / oiseaux, amphibiens |
| Forêt humide | Pluies plus fréquentes et brouillard | Forêt / oiseaux, hibou |
| Taïga | Pluie estivale, neige hivernale | Cor grave, cordes / corbeaux, loup lointain |
| Toundra | Faibles précipitations, surtout neige | Notes espacées, cloches / corbeaux rares, vent |
| Glaces | Sec et froid, chutes de neige occasionnelles, jamais de pluie | Ambiance polaire / vent dominant |
| Marais | Humidité et brume fréquentes | Motifs graves, chœur / grenouilles et insectes |
| Terres maudites | Climat du biome sous-jacent conservé | Harmonie plus tendue, corbeaux, silence nocturne |

La neige et la pluie se partagent les précipitations selon une transition thermique de -1 à +2 °C. Le brouillard n'accompagne pas toutes les neiges ; le vent fort peut former un blizzard. Les couches de brouillard restent transparentes pour préserver la lisibilité. Le manteau neigeux du sol suit désormais la température saisonnière et l'altitude, avec un suivi continu de la température diurne et saisonnière. Il est indépendant du front météo : un ciel sec ne retire pas la neige. Ce modèle saisonnier ne simule pas une accumulation en centimètres après chaque averse.

Les paramètres de probabilité sont des réglages de jeu, pas des statistiques terrestres. `audio/biome-audio-analysis.json` mesure la fréquence des profils génériques sans contexte géographique sur un cycle complet (pas de 15 minutes), incluant les transitions entre fronts. Les régimes réellement appliqués aux territoires sont vérifiés séparément par `world-climate-geography.test.cjs`. La météo se mélange aussi aux frontières des biomes. Les orages restent des cellules brèves ; une pluie forte n'implique pas forcément du tonnerre.

## Géographie climatique

Le biome décrit la végétation ; il ne suffit pas à définir la température d'un territoire. Les profils locaux tiennent désormais compte de la région, du biome, de l'altitude et de l'horloge sauvegardée. Les paramètres de relief de la carte sont des indices de hauteur de 20 à 100, pas des altitudes en mètres. Le refroidissement au-dessus de l'indice 65 reste actif, y compris sur les îles.

| Territoire | Règles appliquées |
|---|---|
| Igea | Taïga et toundra saisonnières, glaciers permanents ; hiver neigeux préservé. |
| Teremor | Forêts et prairies tempérées avec hiver froid ; les marais suivent aussi ce cycle. Relief boréal et glaciers de haute montagne conservés. |
| Sarak | Régime aride chaud pour désert, prairies, oasis et reliefs. Nuits plus fraîches, faible pluie, aucune neige sur les 1 063 cellules terrestres actuelles. Les 78 cellules de taïga et 37 glaciers importés deviennent des reliefs arides, sans déplacer le terrain physique. |
| Varan | Forêt humide et marais océaniques doux : moyenne annuelle de 18 °C, amplitude saisonnière de 5 °C, variation diurne de ±2 °C. Les 185 cellules terrestres actuelles restent sans neige toute l'année. |
| Tagon | Forêts tropicales et mousson ; prairies et forêts des collines suivent aussi un régime tropical, avec une moyenne de 23–24 °C et une amplitude de 3–4 °C. Les 301 cellules terrestres actuelles restent sans neige toute l'année. |

La correction des territoires chauds ne masque pas artificiellement les flocons : elle corrige la température qui provoquait aussi du givre au sol et sur les décors. La même source géographique alimente les précipitations, le froid subi, le couvert, les accessoires des relais, les pas, les traces, les événements météo locaux et le worker de terrain. Les sols et collisions ne changent pas avec la saison. Les sauvegardes existantes utilisent automatiquement les règles corrigées.

Chaque échantillon de transition conserve sa hauteur et la région d’origine pour diagnostic ; son biome est interprété dans le régime du territoire qui le reçoit. Une lisière peut mélanger la végétation sans importer un glacier polaire à Sarak. Les cellules marines utilisent le régime maritime de la terre la plus proche, dans un cache borné à 128 cellules. La phase pluie/neige est ensuite calculée à partir de la température de l'air mélangé : un biome voisin froid ne peut plus faire tomber des flocons dans un air local à plus de 2 °C. Les libellés météo sont recalculés après le mélange. Les fronts gardent leur état saisonnier pendant leur passage, sans apparition brutale de pluie au franchissement d'un seuil de mousson.

Les tests de géographie parcourent les **4 230 cellules terrestres des cinq territoires** sur les 96 jours de l'année à quatre heures de la journée. Ils vérifient aussi les frontières, côtes, pixels du terrain, accessoires, pas, froid subi, sauvegardes et caches, ainsi que le maintien de l'hiver d'Igea, des glaciers légitimes de Teremor, de la mousson et du refroidissement d'altitude. La parité worker/fallback inclut les anciens glaciers de Sarak.

Les tempêtes maritimes répondent aussi aux vents forts et aux blizzards, sans exiger de tonnerre : le vent réellement produit par le climat peut les déclencher. Les événements se résolvent au retour du calme. Cela ne transforme pas une pluie ordinaire en tempête.

`node scripts/check-world-climate.cjs` vérifie les 21 combinaisons territoire/biome dans Chromium et les décors des 40 points d’accueil des trois territoires chauds (localités, camp et embarcadères) ; `PERF_NO_WORKER=1` répète le contrôle avec le chargement coopératif de secours. Les biomes canoniques sont produits par `build-world.cjs` et partagés avec la simulation, les habitants et le rendu. La colonne optionnelle 10 des cellules conserve le biome d’origine pour le seul échantillonnage des collisions ; elle ne pilote plus le climat ni l’apparence. Les noms, coordonnées, routes, rivières et emplacements physiques des obstacles restent inchangés.

## Audio

La musique d'exploration est une ambiance par famille de biome (9 morceaux) plus une ambiance de voyage : bourdon, chœur grave qui respire, gouttes de harpe ou de cloche, tambour lointain, sans thème mélodique, sous le niveau du thème titre. Elle est synthétisée par le séquenceur 8 bits du jeu (dents de scie en paliers, pulses, triangle 4 bits, bruit LFSR) avec les voix du thème titre ; les thèmes sont réservés au combat, au boss et à la défaite. Chaque morceau a son mode, son tempo et sa rythmique (voir `audio/LISEZMOI.md` et `scripts/chiptune-songs.cjs`). Les 18 partitions de faune jour/nuit restent séparées : quatre pistes disponibles plus conducteur ; les pistes non pertinentes sont volontairement silencieuses (notamment pas d'insectes dans les glaces).

Les fichiers MIDI type 1 et les notes JSON jouées sont générés ensemble : `scripts/build-music.cjs` pour les musiques, `scripts/build-biome-audio.cjs` pour la faune. Les programmes General MIDI servent de repères à l'édition ; le jeu utilise ses propres timbres, notamment pour les cris d'animaux, qui ne seront donc pas identiques dans un lecteur MIDI généraliste. Les cris sont stylisés et synthétiques, pas des enregistrements zoologiques. Le vent continu reste synthétisé en stéréo.

`node scripts/analyze-biome-audio.cjs` rend le synthétiseur réel, compare les anciens thèmes et les nouveaux, mesure crêtes/RMS/corrélation stéréo et énergie FFT par bandes. Les rendus couvrent une boucle entière et sa reprise. Les statistiques RMS incluent les silences intentionnels. L'analyse ne remplace pas une écoute sur téléphone. Aucun rendu analysé ne doit saturer ni produire de valeur audio non finie.

Les appels de faune sont atténués par pluie, neige et combat. Musique, bruitages d’action et environnement conservent leurs réglages séparés. Pendant un voyage : thème dédié, bus météo/faune coupés, même pour un tonnerre déjà lancé ; reprise de l'ambiance locale à l'arrivée. Aucun changement de sauvegarde requis.

## Références de conception

- Met Office, zones climatiques : https://weather.metoffice.gov.uk/climate/climate-explained/climate-zones
- NOAA, mécanisme et saisonnalité des moussons : https://www.nesdis.noaa.gov/about/k-12-education/severe-weather/what-monsoon

Vérifications : climat des 13 biomes, continuité des fronts, saisons humides/sèches, sauvegarde, rendu réel d'un blizzard, correspondance MIDI/JSON des 28 partitions, bus audio en voyage, tests existants météo/musique/menus/voyages. Xcode et iPhone physique non disponibles dans cet environnement Windows.

## Danger des itinéraires

Le calcul utilise les tronçons du graphe : base du type de voie, relief et cellules maudites réellement traversées, puis événements actifs (brigands, patrouilles, occupation, malédiction) et météo locale. Une portion partagée avec une route aménagée conserve la base de la voie aménagée ; les événements qui ferment ce passage restent bloquants.

L'écran sépare la moyenne pondérée par les distances du pic local. Les détails donnent la route du pic et les facteurs présents. Le trajet prudent minimise la durée estimée plus l'exposition au danger, avec la même fonction que l'affichage et les rencontres à pied près des routes. Il ne promet pas systématiquement une moyenne plus basse si le détour est beaucoup plus long.

Toutes les notes sont bornées entre 0 et 5. L'estimation est un instantané du monde au départ, recalculé à l'achat effectif du trajet : elle ne prédit pas les futurs incidents et ne représente pas un pourcentage d'embuscade. Les fermetures sont contrôlées pendant le voyage. Les morts ennemies sauvegardées restent respectées par le générateur de rencontres ; la note caractérise le parcours, pas un décompte des ennemis visibles.

## Reprise et mixage révisés

Un voyage sauvegardé reste caché au menu initial et reprend avec Charger. En cas de perte de focus, page masquée ou suspension native, les commandes sont relâchées, le jeu sauvegardé et mis en pause ; les notifications répétées ne relancent pas le jeu. Les sauvegardes périodiques du voyage restent nécessaires : un arrêt forcé du processus ne garantit pas la livraison du dernier événement de fermeture.

Le viewport et WKWebView interdisent le zoom de page. Les listes gardent leur défilement interne et la carte ses commandes de navigation. Le réglage de taille du texte reste disponible.

Les dix ambiances ont désormais neuf pistes, avec contrechant de flûte, nappe haute et ponctuations de cloche alternées. La basse est remontée d'une octave, moins soutenue et fortement atténuée ; les percussions sont discrètes. Le thème de titre conserve ses douze pistes avec basse, timbales et batterie réduites ; les anciens thèmes de jeu ont également une assise grave allégée. Les MIDI sont régénérés depuis la même partition que le moteur audio.

## Cohérence des décors

Val-des-Neiges (Haut-Givre) se situe en taïga, et non dans une cellule de glacier. Taïga, toundra, forêts tempérées et déserts frais utilisent maintenant un couvert saisonnier, réduit dans les milieux secs. Les glaciers gardent leur neige permanente. Les décors tropicaux, marécageux chauds et désertiques chauds restent sans neige. La température de fond est partagée avec le modèle météo.

Les conifères boréaux, feuillus dormants, rochers et installations des relais suivent le couvert. Aucun arbre généré sur les glaciers ou en toundra. Le pavage hors régions arides utilise la pierre grise ; les chemins utilisent l'humus, la boue ou le sol froid local. Les collisions, ponts et traversées d'eau restent identiques entre saisons. Les caches de terrain et les réponses du worker sont datés pour éviter le retour d'un ancien décor après voyage ou rechargement.

## Mixage et pas

Musique à 45 % par défaut pour les nouvelles préférences ; les niveaux déjà choisis restent mémorisés. Environnement (vent, faune, pluie, tonnerre) possède son propre bus, son propre curseur et reste audible même si les bruitages d'action sont coupés. Les sons d'interface peuvent être désactivés séparément. Les trois niveaux et l'interrupteur sont persistants dans les menus d'accueil et de pause.

Les 41 échantillons d'action sont calibrés par leur crête et leur RMS maximal sur 50 ms, sans amplifier les enregistrements discrets. Les annonces MIDI d'interface, les musiques de combat, la pluie et le tonnerre sont atténués ; le vent est remonté et la faune espacée reste en retrait. Le script scripts/analyze-audio-mix.cjs mesure les sources et des scènes réellement synthétisées ; audio/mix-analysis.json contient les résultats en dBFS, pas une certification LUFS. Une écoute physique sur iPhone reste nécessaire.

Pas du joueur, des PNJ à pied et des ennemis bipèdes : neuf surfaces (sable, terre, herbe, gravier, pierre, bois, boue, eau, neige), trois variantes chacune. La distance parcourue déclenche les pas ; proximité et panoramique règlent leur position. Aucun pas pour la fée, les serpents, les téléportations ou les voyages. Limites : seize acteurs proches suivis, trois déclenchements par image et huit voix simultanées. Les pas s'arrêtent en pause ; les ponts et étages utilisent le bois, le manteau neigeux suit le même motif que le sol visible.


### Neige continue, température et respiration

Le couvert thermique ne saute plus à minuit. Le rendu vérifie la date chaque minute de jeu (environ 0,67 seconde hors voyage) et utilise 32 niveaux de couverture pixel art. Seuls les secteurs dont la couverture visible change sont recalculés. Les collisions sont conservées ; les variantes de végétation changent seulement au franchissement de leur seuil. La température est échantillonnée une fois par tuile et biome pendant la fabrication du terrain, jamais par pixel.

Le worker conserve au plus huit tâches et le cache trente-deux images. Une ancienne image reste visible pendant sa mise à jour ; une réponse périmée ne peut remplacer une révision climatique plus récente. Sans worker, une seule image de terrain déjà chargée est renouvelée par frame. Les accessoires de transport et auberges sont préservés.

La température locale arrondie apparaît à droite du nom de lieu, sur la ligne existante. Sous 5 °C, le joueur, les humanoïdes vivants et chevaux émettent de petites expirations désynchronisées, pendant environ une seconde toutes les trois secondes. Les sept groupes de pixels maximum partent de la bouche, restent ancrés dans le monde, se dispersent et disparaissent. Les esprits, morts-vivants et reptiles sont exclus ; les futurs acteurs peuvent préciser breathes, warmBlooded, coldBlooded et breathMouth. Aucun effet hors écran ni pendant le voyage.


### Direction de la neige et empreintes

La neige se dessine directement dans le repère écran après sauvegarde de la transformation du canvas : aucune grande coordonnée du monde, direction du joueur, translation ou secousse de caméra ne participe à sa trajectoire. La vitesse est intégrée, toujours vers le bas et la gauche ; la diagonale évolue progressivement avec le vent et le blizzard.

Les empreintes visuelles utilisent un état GroundTracks distinct du chemin Game.footprints suivi par Elyne. Les contacts animés des pieds produisent des marques alternées sur neige par tout temps, ou sur sable, terre, herbe, gravier et boue pendant la pluie. Ni bois, pierre ou eau, ni déplacements instantanés ou vols. Durée de vingt secondes sur neige et huit secondes sur sol mouillé, avec fondu doux et retrait lors du dégel.

La teinte provient du terrain mis en cache, assombrie sans changer de famille de couleur. Une petite grille RGB échantillonnée tous les quatre pixels accompagne les secteurs ; aucun getImageData pendant les pas. Au maximum seize acteurs proches, quatre nouvelles empreintes par frame et cent soixante empreintes conservées. Les traces hors de la zone proche sont retirées.
