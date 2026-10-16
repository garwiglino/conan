# Climat et ambiances de Hearthreaver

Le climat local remplace la météo universelle pour le joueur et les événements de crue/navigation. L'horloge sauvegardée suffit à reconstruire le climat. Une année fictive dure 96 jours de jeu : ce choix rend les saisons observables et n'est pas une reproduction météorologique d'une région terrestre.

| Biome | Régime | Musique / faune |
|---|---|---|
| Mer | Pluie maritime, vent, brume | Flûte et cordes / mouettes |
| Désert chaud | Pluies très rares, jamais de neige | Mode phrygien dominant, cordes pincées / rapace, grand-duc |
| Désert frais | Sec, rares chutes de neige hivernales | Désert / rapace, grand-duc |
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

La neige et la pluie se partagent les précipitations selon une transition thermique de -1 à +2 °C. Le brouillard n'accompagne pas toutes les neiges ; le vent fort peut former un blizzard. Les couches de brouillard restent transparentes pour préserver la lisibilité. Pas d'accumulation dynamique au sol ni de simulation de fonte : les sols restent ceux de la carte.

Les paramètres de probabilité sont des réglages de jeu, pas des statistiques terrestres. `audio/biome-audio-analysis.json` mesure leur fréquence effective sur un cycle complet (pas de 15 minutes), incluant les transitions entre fronts. La météo se mélange aussi aux frontières des biomes. Les orages restent des cellules brèves ; une pluie forte n'implique pas forcément du tonnerre.

## Audio

10 compositions originales de 32 mesures : 9 familles de biomes et une musique de voyage. Six pistes musicales plus conducteur MIDI, panoramiques, phrases aérées, basses centrées, instruments doux et fondus entre morceaux. 18 partitions de faune jour/nuit : quatre pistes disponibles plus conducteur ; les pistes non pertinentes sont volontairement silencieuses (notamment pas d'insectes dans les glaces).

Les fichiers MIDI type 1 et les notes JSON jouées sont générés ensemble par `scripts/build-biome-audio.cjs`. Les programmes General MIDI servent de repères à l'édition ; le jeu utilise ses propres timbres, notamment pour les cris d'animaux, qui ne seront donc pas identiques dans un lecteur MIDI généraliste. Les cris sont stylisés et synthétiques, pas des enregistrements zoologiques. Le vent continu reste synthétisé en stéréo.

`node scripts/analyze-biome-audio.cjs` rend le synthétiseur réel, compare les anciens thèmes et les nouveaux, mesure crêtes/RMS/corrélation stéréo et énergie FFT par bandes. Les rendus couvrent une boucle entière et sa reprise. Les statistiques RMS incluent les silences intentionnels. L'analyse ne remplace pas une écoute sur téléphone. Aucun rendu analysé ne doit saturer ni produire de valeur audio non finie.

Les appels de faune sont atténués par pluie, neige et combat. Musique et bruitages conservent leurs réglages séparés. Pendant un voyage : thème dédié, bus météo/faune coupés, même pour un tonnerre déjà lancé ; reprise de l'ambiance locale à l'arrivée. Aucun changement de sauvegarde requis.

## Références de conception

- Met Office, zones climatiques : https://weather.metoffice.gov.uk/climate/climate-explained/climate-zones
- NOAA, mécanisme et saisonnalité des moussons : https://www.nesdis.noaa.gov/about/k-12-education/severe-weather/what-monsoon

Vérifications : climat des 13 biomes, continuité des fronts, saisons humides/sèches, sauvegarde, rendu réel d'un blizzard, correspondance MIDI/JSON des 28 partitions, bus audio en voyage, tests existants météo/musique/menus/voyages. Xcode et iPhone physique non disponibles dans cet environnement Windows.

## Danger des itinéraires

Le calcul utilise les tronçons du graphe : base du type de voie, relief et cellules maudites réellement traversées, puis événements actifs (brigands, patrouilles, occupation, malédiction) et météo locale. Une portion partagée avec une route aménagée conserve la base de la voie aménagée ; les événements qui ferment ce passage restent bloquants.

L'écran sépare la moyenne pondérée par les distances du pic local. Les détails donnent la route du pic et les facteurs présents. Le trajet prudent minimise la durée estimée plus l'exposition au danger, avec la même fonction que l'affichage et les rencontres à pied près des routes. Il ne promet pas systématiquement une moyenne plus basse si le détour est beaucoup plus long.

Toutes les notes sont bornées entre 0 et 5. L'estimation est un instantané du monde au départ, recalculé à l'achat effectif du trajet : elle ne prédit pas les futurs incidents et ne représente pas un pourcentage d'embuscade. Les fermetures sont contrôlées pendant le voyage. Les morts ennemies sauvegardées restent respectées par le générateur de rencontres ; la note caractérise le parcours, pas un décompte des ennemis visibles.
