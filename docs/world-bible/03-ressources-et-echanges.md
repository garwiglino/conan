# 03 — Ressources, production, échanges et dépendances

## Mesures et principes

Le catalogue sépare biens naturels, produits agricoles, animaux et biens transformés. Une ressource possède un identifiant stable, une unité de conception, des zones possibles, des conditions d'accès, une saisonnalité, un délai ou une limite de renouvellement, un mode de conservation et des usages. Les paramètres de la première version sont des valeurs de conception, pas un relevé géologique déjà effectué dans le terrain.

Cinq notions ne sont jamais fusionnées : potentiel naturel, accessibilité, capacité de travail, stock disponible et excédent exportable. Une mine abandonnée garde son potentiel mais peut avoir une production nulle. Une région riche en bois ne peut exporter des mâts sans coupes appropriées, accès et transport. Une ville conserve une réserve et des besoins avant de vendre un excédent.

Les niveaux territoriaux de `source.json` vont de 0 à 5 : 0 absent de la production normale de cette première version ; 1 marginal ; 2 limité ; 3 courant ; 4 excédent fréquent ; 5 spécialisation majeure. Pour une matière, il s'agit d'un potentiel ; pour un produit transformé, d'une capacité artisanale de référence. Ce ne sont ni des tonnes, ni une probabilité d'apparition par case, ni un prix. Les gisements de niveau faible ne sont pas supprimés pour créer artificiellement un monopole.

## Catalogue matériel de référence

| Identifiant | Ressource | Origine et contraintes | Usages principaux |
|---|---|---|---|
| water | Eau potable | Source, puits, captage ou réserve entretenue ; qualité et saison | Habitants, animaux, irrigation et ateliers ; aucun commerce transcontinental d'eau ordinaire |
| grain | Céréales | Bassins cultivés de Teremor, vallées et périmètres irrigués ailleurs | Alimentation, semences, réserves et fourrage |
| legumes | Légumineuses | Cultures tempérées et irriguées ; récolte saisonnière | Alimentation et conservation |
| rice | Riz | Terres chaudes humides aménagées de Varan/Tagon, pas toute surface inondée | Alimentation et réserves |
| tubers | Tubercules | Cultures locales selon climat | Alimentation locale, conservation variable |
| dates | Dattes | Oasis adaptées de Sarak | Alimentation et provisions |
| fruit | Fruits | Vergers et productions tropicales adaptées | Alimentation, fruits secs |
| vegetables | Légumes | Jardins proches de l'eau et des consommateurs | Alimentation périssable |
| fish | Poisson | Mer, lacs ou cours d'eau réellement accessibles | Alimentation fraîche ou conservée |
| meat | Viande | Élevage et chasse régulée localement | Alimentation et provisions |
| milk | Lait et produits laitiers | Élevage ; transformation et proximité nécessaires | Alimentation locale, produits conservés |
| oil | Huiles | Cultures oléagineuses adaptées et ateliers | Cuisine, éclairage et certains métiers |
| salt | Sel | Salines côtières ou gisements reconnus | Conservation et alimentation ; plusieurs fournisseurs possibles |
| timber | Bois de construction | Forêts exploitables, taille et renouvellement | Maisons, outils, véhicules |
| naval_timber | Bois naval sélectionné | Arbres de qualité et dimensions adaptées | Navires ; coupe et séchage longs |
| firewood | Bois de chauffe | Coupes, entretien et collecte autorisée | Chauffage, cuisson et fours |
| charcoal | Charbon de bois | Transformation de bois avec savoir-faire et pertes | Métallurgie et certains ateliers |
| resin | Résines et poix | Forêts adaptées et transformation | Étanchéité, réparation et artisanat |
| flax | Lin | Terres cultivées et traitement de la fibre | Tissus, voiles |
| wool | Laine | Élevage ; tonte et tri saisonniers | Vêtements, couvertures |
| cotton | Coton | Cultures chaudes disposant d'eau | Textiles ; concurrence avec les cultures alimentaires |
| fiber | Fibres végétales | Espèces adaptées aux territoires | Cordages, nattes et usages navals |
| hides | Peaux brutes | Élevage ou chasse ; conservation rapide | Tanneries |
| leather | Cuir | Peaux, eau et atelier ; nuisances à gérer | Chaussures, selles et protections |
| dyes | Matières tinctoriales | Cultures, collecte et ateliers différents selon région | Textiles et artisanat |
| medicinal | Matières médicinales | Collecte/cultures et praticiens ; effets définis séparément | Soins du jeu, sans guérison universelle |
| aromatics | Aromates | Productions localisées, produits légers recherchés | Cuisine et commerce à longue distance |
| honey | Miel | Ruchers et milieux adaptés | Alimentation et artisanat |
| wax | Cire | Apiculture et transformation | Éclairage et artisanat |
| iron_ore | Minerai de fer | District géologique choisi, accès, extraction et tri | Forges ; tous les minerais ne se valent pas |
| copper_ore | Minerai de cuivre | Districts surtout de Sarak, secondaires ailleurs | Métallurgie |
| tin_ore | Minerai d'étain | Districts surtout de Varan, secondaires limités | Alliages ; pas d'apparition dans chaque marais |
| lead_ore | Minerai de plomb | Gisements localisés et travail spécialisé | Usages techniques limités du monde |
| silver_ore | Minerai d'argent | Gisements rares, exploitation coûteuse | Monnaie et objets ; ne remplace pas les vivres |
| gold | Or | Gisements rares et récupération | Monnaie, objets, réserves de valeur |
| clay | Argile | Dépôts appropriés proches des ateliers | Poterie et construction |
| building_stone | Pierre à bâtir | Carrières accessibles | Construction ; commerce surtout local/régional |
| limestone | Calcaire | Gisements et fours adaptés | Mortiers et certains ateliers |
| sand | Sable sélectionné | Qualité spécifique, pas n'importe quel sable du désert | Construction et verrerie |
| iron | Fer travaillé | Minerai, combustible et atelier | Outils, ferrures, armes |
| copper | Cuivre travaillé | Minerai, combustible et atelier | Objets et alliages |
| tin | Étain travaillé | Minerai et atelier | Alliages |
| bronze | Bronze | Cuivre, étain et atelier | Outils, objets, armes et accessoires |
| steel | Acier de qualité | Fer, combustible et compétence spécialisée | Outils et armes ; petites capacités distinctes des gisements |
| pottery | Poterie | Argile, combustible et atelier | Stockage, cuisine et transport |
| cloth | Étoffes | Lin, laine, coton ou fibres ; filage/tissage | Vêtements, voiles et couvertures |
| rope | Cordages | Fibres adaptées et atelier | Navigation, transport, construction |
| tools | Outils | Métal, bois et ateliers | Agriculture, extraction et construction |
| arms | Armes et équipements militaires | Métaux, bois, cuir et artisans | Garnisons, escortes et commerce réglementé |
| provisions | Provisions conservées | Plusieurs recettes : grains/légumineuses ou poisson/viande conservés | Réserves et voyages ; aucune recette unique imposée |
| boats | Embarcations et navires | Bois sélectionné, résines, cordages, tissus, ferrures et chantier | Transport ; unité par classe de bâtiment |
| pack_animals | Animaux de bât et montures | Élevage, nourriture, dressage, soins | Transport ; pas un stock qui se régénère chaque matin |
| flour | Farines | Céréales et moulin | Alimentation et ateliers alimentaires |
| glass | Verre | Sable adapté, fondants, combustible et compétence | Objets coûteux et usages d'atelier |

Les besoins de fourrage, d'eau, de semences et de combustible sont prélevés avant le surplus. Les fondants et ingrédients secondaires non jouables restent des intrants d'atelier explicitement abstraits ; ils ne sont pas inventés comme objets disponibles dans toutes les boutiques. Les recettes du registre décrivent des dépendances matérielles, pas encore des rendements physiques équilibrés au kilogramme.

## Distribution géographique

**Pâlerive :** pêche, élevage, laine, bois dans les portions forestières et échanges de vallée. **Haut-Givre :** fer/pierre dans des districts accessibles et élevage limité ; l'exploitation nécessite des réserves importées. **Givreval :** fer, élevage et productions de vallée, avec conflits possibles sur les droits de passage. Les forêts ne doivent pas être dessinées sur toute la toundra.

**Boisclair :** bois, résines, cultures et miel. **Valdorne :** céréales, légumineuses, lin, moulins, bétail et marché intérieur. **Sylverive :** ateliers, textile, logistique et chantiers là où l'eau navigable est vérifiée. **Aulneval :** cultures, élevage, cuir et approvisionnement des villes.

**Roche-Sèche :** cuivre, pierre et districts d'élevage ; eau et combustible contraignants. **Sables-Rouges :** sel, élevage et marchés d'oasis ; pas d'agriculture uniforme sur le sable. **Safrane :** agriculture irriguée, dattes, coton et teintures ; arbitrage entre alimentation et cultures de rente.

**Brumeraie :** accès à des districts d'étain, bois, résines et agriculture humide. **Rosebrume :** cultures, produits médicinaux, ressources forestières et districts secondaires d'étain. Les enclaves ont leurs propres droits de collecte et d'accès.

**Coralune :** pêche, fibres, cultures et métiers navals près des ports effectifs. **Palmeraie :** bois sélectionnés, fibres, aromates et agriculture. Coupe, maturation et transport limitent les volumes navals.

Le compilateur publie pour les 14 régions une ligne pour chacune des ressources, y compris les niveaux nuls, les spécialisations et les restrictions. Une spécialisation régionale ne distribue pas un gisement à chaque localité : le rôle local précise producteur, transformateur, marché ou consommateur.

## Circuits d'échange

| Circuit | Marchandises principales | Intérêts et litiges |
|---|---|---|
| Igea — Teremor | Fer, laine, peaux contre grains, étoffes et outils | Contrats de livraison, réserves hivernales, péages et concessions |
| Teremor intérieur — Sylverive | Vivres, lin et bois contre transformation, débouchés et équipements | Contributions communes, droits de marché, priorités d'achat |
| Sarak — Varan | Cuivre, sel et tissus contre étain, bois et résines | Accès aux ports, prix, garanties et saison des parcours |
| Sylverive — Tagon | Outils, métal travaillé, textiles contre fibres, bois et fret | Répartition des frais d'escorte, concurrence entre chantiers |
| Varan — Tagon | Produits forestiers/miniers/agricoles et services maritimes | Achats directs contre marchés obligatoires, exclusivités locales |
| Sarak — Teremor | Sel, cuivre, tissus et denrées selon récoltes | Choix de parcours, approvisionnement, taxes et contrats |
| Darg — marchés voisins | Animaux, laine, peaux et services contre grains, métal et outils | Passages saisonniers, dommages aux cultures, paiement des services |
| Communautés de Kesh — villes proches | Cultures, petits élevages, fabrication, échanges de récupération | Accès au marché, droits fonciers et actes de bandes distinctes |
| Enclaves — intermédiaires locaux | Produits autorisés de collecte et artisanat contre outils/denrées | Consentement d'accès, protection des habitats et qualité des échanges |

Ces circuits sont des relations entre marchés. Leur activation nécessite un chemin dans le graphe réel ; une route prévue mais absente reste non opérationnelle. Les terres partagées ne permettent pas de traverser une mer à pied. Les routes maritimes ne passent pas à travers un continent. Les marchandises lourdes privilégient un coût logistique réellement inférieur, pas systématiquement la ligne droite.

## Prix, stocks et pénuries : contrat de simulation

Une localité possède stock, consommation, production, réserve protégée, engagements et cargaisons en route. Les prix peuvent réagir à un ratio stock/besoin borné, aux coûts d'acheminement et aux règles locales. Le moteur ne doit pas multiplier les prix sans limite à chaque chargement ou à chaque rumeur identique.

Une pénurie nécessite un déficit constaté après prise en compte des réserves et livraisons possibles. Causes admissibles : baisse de récolte, interruption documentée d'un accès, perte de cargaison, mobilisation retirant de la main-d'œuvre, demande exceptionnelle ou stockage autorisé/abusif. La simple présence d'un gouverneur corrompu ne suffit pas.

Une hausse du prix de l'étain ne doit pas vider toutes les échoppes de nourriture. Une perte de cuivre peut toucher certains ateliers sans arrêter la poterie. Un lieu peut disposer d'un stock importé d'une ressource dont le potentiel local est nul.

Les pénuries, livraisons et reprises ont des dates et des références causales. Une caravane prend son chargement à l'origine, le transporte, puis le livre ; elle ne crée pas le même stock aux deux extrémités. Les voyages accélérés utilisent les mêmes quantités et ne décomptent pas deux fois les provisions.

## Renouvellement et conflits écologiques

Récoltes et tonte suivent un calendrier ; poisson et gibier ont une capacité locale ; les arbres adaptés à la construction navale ne repoussent pas en quelques journées. Un gisement s'épuise à une échelle longue ; les capacités de travail varient plus vite. Une source peut diminuer pendant une sécheresse, mais son assèchement demande une condition hydrologique persistante, pas quelques minutes de ciel sec.

Les différends possibles comprennent droits de coupe, réserves d'eau, terre cultivable, passage des troupeaux, redevance de mine, conditions d'atelier et priorité d'achat. Les pouvoirs tentent aussi de résoudre ces conflits, de faire entretenir les infrastructures et de protéger les échanges.

## Raccord avec les ressources jouables existantes

Ce catalogue ne renomme pas les objets d'inventaire déjà enregistrés. Chaque ressource économique doit être raccordée à un objet réel par une table explicite ou rester une donnée macroéconomique. Une tonne de céréales régionale n'est pas un sac que le joueur peut porter. `provisions` s'exprime en équivalents de ration après conversion ; ne pas le confondre avec la réserve de faim. Aucune recette nouvelle n'est activée par la seule rédaction de cette bible.
