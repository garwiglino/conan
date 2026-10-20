# Implantation des localités dans le jeu

Les bâtiments utilisent désormais les pixels isométriques avec patine dans le jeu
web et iOS. Les anciennes élévations du commit `e9837bd` restent des références
de catalogue et de données historiques. Le lot humain provient notamment de `1c310b5` (activités et postes), avec
les vêtements, coiffes et poses conservés dans `sprites/humains/`.

## Implantation isométrique

Les 83 localités de l’atlas disposent de **1 914 bâtiments** natifs. Les centres
régionaux reçoivent jusqu’à 48 constructions, les ports jusqu’à 30 et les autres
localités jusqu’à 18, selon la place réellement praticable. Chaque localité
conserve au moins quatre bâtiments d’habitation. Il s’agit d’un premier quartier
jouable : ce nombre de façades ne représente pas chaque foyer de la population
de référence et ne change pas celle-ci.

Les six familles architecturales sont respectées : Teremor, Sylverive, Igea,
Sarak, Varan et Tagon. Sylverive reste une région de Teremor. Les coordonnées,
les rayons territoriaux, les routes, les débarcadères et les autorités restent
ceux de l’atlas et de la bible du monde.

Chaque plan contient des habitations régionales, une auberge, une halle et un
grenier. Les centres possèdent aussi conseil, soins et poste de garde. Les
ateliers de métal, de textile, de cuisson, de charpente, de conservation et les
réserves portuaires sont choisis selon les intentions économiques du lieu. Un
bâtiment ne crée aucune ressource : capacités, matières, stocks, travailleurs,
commerce et réparations restent gérés par la simulation existante. Un poste de
garde ne fait apparaître aucun soldat supplémentaire.

Le générateur réserve le centre habité et les équipements des transports. Les
rues ont trois mètres de largeur ; elles rejoignent les voies existantes. Les
empreintes des constructions gardent une marge autour des routes, de l’eau et
des falaises. Les arbres spontanés des parcelles et des rues sont dégagés ;
aucune traversée d’eau ni modification de relief n’est créée. Les sols des rues
réutilisent les pixels des pistes et dallages déjà chargés dans le jeu.

Une tuile mesure toujours un mètre et 16 pixels. Les bâtiments utilisent leurs
pixels natifs, leurs plans tournés et leurs portes, sans redimensionnement. Les
empreintes en losange sont projetées sur le plan du monde, avec des collisions
polygonales issues des mêmes volumes que les dessins. Le terrain et les
personnages conservent leur repère existant. Les dessins sont découpés en bandes
de profondeur au sol pour se trier avec les pieds des personnages, puis mis en
cache dans une limite de 96 modèles. Les 696 vues sont compilées en données
JavaScript indexées avant distribution ; aucun PNG n’est chargé en jeu. Les
maisons fermées possèdent un seuil accessible ; ce lot n’ajoute pas d’intérieurs
explorables. Les halles ouvertes gardent leurs supports physiques et leurs
passages. Le camp scénarisé et les quais conservent leur implantation propre.
Aucun château, mur d’enceinte, mine, moulin hydraulique ou chantier naval n’est
affirmé à partir du seul nom d’une localité ou d’un potentiel de ressources.

## Habitants et activités

Les habitants humains existants utilisent les animations natives pour marcher,
fuir, discuter, recevoir un coup et accomplir les activités effectivement
raccordées. Leur identité, corps, visage, cheveux, vêtements et santé sont
conservés. Les batraciens, les gardes armés, les compagnons et les transports
conservent leurs contrôleurs spécialisés.

Les cultivateurs, artisans, potiers, tisserands et cuisiniers peuvent recevoir un
poste indépendant si leur métier correspond à une capacité locale et si un
emplacement libre existe. Les postes d’artisan sont installés dans une halle
ou un atelier ouvert ; les parcelles se trouvent à côté des habitations, hors
des rues. Le socket fixe la place des pieds, l’approche et la direction du geste.
Les meubles restent dans le monde lorsque leur occupant part ou meurt. Un
nouveau poste doit aussi posséder une sortie libre et un chemin local vérifié
depuis le centre, en tenant compte du meuble à installer.

Un nouvel habitant est placé à son poste avant sa première apparition. Les
positions des habitants déjà vivants sont conservées au rechargement. Après
un déplacement, le PNJ rejoint son poste à pied avec le contrôleur existant.
Une seule nouvelle recherche de trajet vers un poste est autorisée par image,
avec délai de reprise si le chemin est bloqué. Les trajets déjà calculés
continuent normalement. Près du nouveau bâti et des meubles, la recherche vérifie
les segments entre cases, y compris l’approche finale : deux centres libres ne
suffisent pas si une table ou un poteau bloque le passage. Un habitant ne travaille pas à distance de son poste,
sans les matières requises par les recettes locales, pendant une fuite, une discussion, un témoignage, une mission, une relève, une
blessure grave ou un voyage avec le joueur. Le registre du travail utilise ce
poste réel comme lieu d’activité ; les gestes ne produisent aucun stock en plus
de la simulation. Les semis et travaux de sol s’arrêtent sous la neige observée.

Les autres métiers et clips restent disponibles dans la bibliothèque. Leur
présence dans le catalogue ne suffit pas à créer une charge, un animal, un
bateau, un patient ou une production. Leur raccordement exige les entités et
les contrats correspondants dans le monde.

## Sauvegarde et performances

`data/architecture/settlements.json` contient des plans déterministes relatifs
aux localités. Ils sont partagés entre parties et indexés spatialement en cases
de 256 pixels. Les collisions ne parcourent pas les 83 villes à chaque pas.
Le rendu interroge les limites complètes des sprites : un toit reste visible
lorsque le pied du bâtiment est hors de l’écran, y compris en coordonnées
négatives. La neige des bâtiments et des postes partage un cache par cellule et par minute,
comme le terrain. Le cache des images humaines est limité à 256 poses ; les plans et
les meubles ne sont pas recalculés à chaque image.

Les anciens enregistrements restent compatibles. Les plans des quartiers ne sont pas
dupliqués dans les sauvegardes ; les petits placements des postes de travail
sont enregistrés pour rester stables après un décès ou un départ. Une empreinte
des plans permet de les reconstruire si l’implantation ou la géographie évolue. Santé, décès, justice, appartenance au groupe,
économie et constructions explicitement placées conservent leurs données.
Les apparitions des habitants sont contrôlées après l’installation des transports,
pour éviter un habitant créé sous une charrette. Une ancienne position de
compagnon devenue solide est dégagée au chargement. La position réelle des
compagnons est également conservée dans les nouvelles sauvegardes. Le repère de repos rejoint l’entrée de la nouvelle auberge et résiste au
rafraîchissement saisonnier. Les variantes d’hiver et les dépôts de neige sur les toits sans variante suivent l’enneigement réel,
pas seulement le nom d’un continent ou un ancien indice de biome.

## Reconstruction et vérification

```sh
npm run build:settlements
npm run test:settlements
UI_BROWSER_PATH=/usr/bin/chromium npm run check:settlements
npm run package:ios
```

Les tests vérifient les familles, les emprises et les voies de chaque localité,
les seuils et les arrivées de transport dans le moteur réel, la continuité des
chemins, les sockets, les interruptions de travail et les décès sauvegardés.
Le contrôle Chromium visite les cinq territoires dans trois formats mobiles.
Les tests de déplacement, combat, justice, climat, voyage et rendu restent les
contrôles de non-régression à lancer avec ce lot.
