# 06 — Hommes-singes : communautés, intérêts et fabrication

Intégration de conception : Codex / ChatGPT, 18 octobre 2026. Référentiel : `data/world/bible/ape-folk.json`, démographie de `source.json`, compilateur de la bible et atlas courant. Le corps masculin, la base féminine, les cinq teintes et les quatre animations de base sont réalisés. Le module `sprites/hommes-singes/activites.js` ajoute désormais les ressources visuelles des 55 activités et 16 fonctions ; voir [les tenues et activités](../hommes-singes-activites.md). Les bâtiments, les routines et l’intégration des acteurs au monde restent à réaliser.

## Place dans le monde

Les hommes-singes sont des personnes bipèdes, parlantes, capables de tenir un registre, d’administrer un atelier, de cultiver et de combattre. Leur anatomie explique les prises d’outils et les vêtements ; elle ne fixe ni intelligence, ni alignement, ni métier obligatoire. Les bras longs ne donnent pas automatiquement une portée d’arme ou une capacité de portage supérieure dans le moteur.

Leur principal foyer est Tagon, particulièrement Palmeraie. Des communautés plus petites vivent sur les terrains drainés de Varan et dans certaines forêts de Teremor ; des familles établies dans les villes et les ports prolongent ces contacts. Les quelques résidents de Sarak disposent de véritables approvisionnements et accès à l’eau. Aucun noyau permanent n’est prévu en Igea dans cette révision ; marchands, travailleurs engagés et voyageurs peuvent y séjourner avec des vêtements chauds et un refuge. Ni le pelage clair ni la couleur ébène ne désignent une origine obligatoire, un clan ou une hostilité.

Ils ne sont pas un peuple récemment apparu dans l’histoire du monde. La révision ajoute leur identification dans la bible de production sans raconter une migration massive ou changer rétrospectivement l’identité des PNJ déjà nommés.

## Démographie explicite

La bible passe de quatre à six catégories : humains, gobelins, orques, hommes-serpents, batraciens et hommes-singes. Les nouvelles catégories sont distinguées dans l’ancienne enveloppe humaine de conception. Les effectifs régionaux, le total mondial de **5 450 000 résidents de conception**, les 83 localités et leurs coordonnées sont conservés. L’ancien mélange régional est archivé dans `demographyRevision` ; ce choix n’ajoute pas des habitants au-dessus du total et ne transforme aucun personnage sauvegardé.

La compilation actuelle donne **171 916 hommes-singes**, soit **3,15 %** du monde de conception :

| Territoire | Résidents hommes-singes | Part de la population du territoire | Part de tous les hommes-singes |
|---|---:|---:|---:|
| Tagon | 97 562 | 16,54 % | 56,75 % |
| Teremor | 37 960 | 1,32 % | 22,08 % |
| Varan | 33 492 | 6,44 % | 19,48 % |
| Sarak | 2 902 | 0,31 % | 1,69 % |
| Igea | 0 | 0 % | 0 % |

Ce sont des décisions de conception, pas des acteurs déjà affichés. L’arrière-pays comprend des foyers concentrés et des voisinages mixtes ; une minorité de 3 % dans une région n’implique pas un homme-singe dans chaque rue. Les pourcentages réels des localités, calculés après arrondis, sont dans les fiches générées. Les visiteurs ne sont pas recensés deux fois.

Les batraciens disposent désormais eux aussi d’un recensement de conception distinct : **184 596**, soit **3,39 %**. Leurs 73 acteurs jouables existants restent un échantillon identifié et ne sont pas ajoutés à ces effectifs.

## Cinq ensembles locaux, pas cinq États

### Maisonnées de Palmeraie

Coralbourg, Anse-des-Palmes, Santalune, Relais-des-Lianes, Rive-de-Corail et Palmehaute accueillent des voisinages et ateliers, avec leurs vergers et habitats de l’arrière-pays. Relais-des-Lianes et Palmehaute portent les principales concentrations locales de cette révision. Une maisonnée peut comprendre parents, alliés, apprentis et personnes accueillies ; son appartenance n’exige pas une ascendance fermée.

Les assemblées de foyers désignent des délégués pour une coupe, un stock commun ou un contrat précis. Les ports de Tagon assurent les quais et leur justice locale, mais ne possèdent pas automatiquement les arbres de l’intérieur. Les producteurs veulent des prix prévisibles, conserver leurs arbres nourriciers et payer leurs outils. Les armateurs veulent bois sélectionné, cordages, délais et volume. Certains foyers acceptent une avance et une exclusivité ; d’autres cherchent un débouché direct. Un délégué peut avoir intérêt à protéger son propre contrat contre des voisins.

Le litige porte sur arbres cédés, replantation, salaires, accès et paiement. Il se résout par bornage, calendrier, indemnité ou changement d’acheteur ; une coupe contestée ne déclenche pas une guerre de tous les hommes-singes contre les ports.

### Ateliers de Coralune

Bourg-des-Coquilles et Havre-des-Épices accueillent cordiers, porteurs, charpentiers, réparateurs et commerçants. Les ateliers appartiennent à des maisons distinctes, parfois associées à des humains ou batraciens. Le conflit récurrent oppose prix du travail, coût des avances, priorité d’un quai et répartition des frais d’escorte. Les armateurs ne sont pas tous hostiles aux travailleurs ; un atelier peut exploiter ses propres apprentis ou défendre réellement sa caisse de secours.

### Foyers des terres hautes de Varan

Port-des-Veilleurs, Bac-des-Roseaux, Tourbeclaire, Brume-aux-Saules, Pont-des-Joncs et Refuge-des-Aulnes relient jardins drainés, collecte et ateliers aux marchés humides. Les habitations se trouvent sur un sol praticable hors crue ; ils ne deviennent pas des nageurs de marais parce qu’ils habitent Varan.

La coopération avec les batraciens lie fruits, tubercules, fibres et portage sur chemin sec aux transports d’eau, poissons, filets et riz. Cela ne réserve pas ces métiers à une espèce. Des habitants peuvent se disputer un quai, un jardin ou une dette. Les enclaves serpentines voisines gardent leurs limites de collecte et leurs propres lieux de mémoire. Un accord avec une enclave n’engage pas les autres.

### Foyers forestiers de Boisclair

Fort-des-Ronces, Val-des-Mousses, Col-des-Cèdres et Ormerive, avec une liaison vers Bois-de-Lune en Aulneval, réunissent petits propriétaires, tenanciers, apiculteurs, ouvriers et artisans. Leurs usages de forêt sont reconnus ou contestés localement dans Teremor. Les besoins de bois de la couronne ne suppriment pas les droits antérieurs ; un ancien usage ne dispense pas de tout entretien ou impôt.

Les habitants achètent céréales, fer, laine et cuir ; ils vendent des produits forestiers autorisés et du travail. Un garde défend un poste financé, pas une frontière raciale.

### Maisons établies des quais

Branchebasse, Aulneport et Port-Sarak accueillent des familles et ateliers installés. Ils relèvent de la cité ou juridiction où ils vivent. Ils n’obéissent pas à une autorité de diaspora, et le commerce avec Tagon ne prouve pas un transfert d’allégeance. Les petits groupes non détaillés ailleurs dans le recensement restent des habitants ordinaires, non de nouvelles colonies automatiques.

## Vie sociale, transmission et croyances

Les foyers possèdent ou louent jardins, outils et logements selon le droit local. Les réserves communes ont des dépositaires qui rendent compte ; elles peuvent être détournées par des personnes identifiées, pas par une corruption d’espèce. Apprentissages, adoptions et contrats de travail permettent d’intégrer des personnes venues d’ailleurs. Les litiges de succession se tranchent selon la coutume du foyer et la juridiction du lieu, avec des personnes concernées et des témoins.

Femmes et hommes adultes peuvent être propriétaires, artisans, médiateurs, navigateurs ou gardes. Les deux bases graphiques donnent accès aux mêmes métiers et équipements. Les tâches ne sont pas attribuées à partir du pelage. Aucun bonus moral, militaire ou climatique n’est attaché à une teinte.

Repas, entraide, fêtes de récolte, marchés, veillées et funérailles font partie des routines. Les souvenirs de famille et certains vieux arbres ont une valeur de mémoire ou de serment sans être obligatoirement magiques. Des communautés tiennent à l’oral leurs droits, d’autres utilisent marques, contrats et registres ; la capacité d’écrire n’est pas réservée aux humains. Les variantes religieuses ne constituent pas un culte national nouveau.

L’alimentation combine produits du jardin, fruits, tubercules, céréales et protéines disponibles. Pas de régime universel de bananes ni de nouvelle ressource créée pour une plaisanterie. La fourrure ne fournit ni imperméabilité ni immunité au froid : vêtements, abri, faim et vapeur de respiration doivent suivre les règles physiologiques des mammifères et les systèmes existants.

## Échanges, dépendances et routes

Les communautés utilisent le catalogue existant : fruits, tubercules, fibres, miel/cire, résines, bois, aromates, argile et produits travaillés. Outils de fer, sel, étoffes et vivres complémentaires viennent des ateliers et marchés reliés. L’extraction d’étain de Varan n’est pas une spécialité raciale ; un homme-singe peut y travailler sous un contrat réel sans posséder une mine dans son jardin.

Les stocks alimentaires et le renouvellement des arbres précèdent le surplus exportable. Tisser ne crée pas une corde à chaque boucle visuelle ; débiter un bois n’ouvre pas automatiquement un gisement. Le programme d’activités décrit les gestes et leurs points de travail ; les rendements et échanges du moteur restent à raccorder.

Neuf parcours sont vérifiés contre le graphe actuel. Relais-des-Lianes–Palmehaute suit environ 2,40 km de chemins ; Santalune–Anse-des-Palmes environ 6,73 km ; Brume-aux-Saules–Refuge-des-Aulnes environ 1,20 km. Port-Sarak–Anse-des-Palmes exige un bateau sur son parcours d’environ 27,83 km. Les distances viennent du graphe compilé, pas d’un trait droit ; les devis futurs doivent reprendre ses fermetures et modes effectifs. Les autres parcours et leur statut sont dans `generated/ape-folk.json`.

## Rapports avec tous les pouvoirs

Les neuf cadres de contact détaillés sont dans la source. Aucun n’accorde une assistance militaire automatique.

| Interlocuteur | Intérêts croisés et limite |
|---|---|
| Teremor | Réserves, taxes et entretien des routes contre reconnaissance des usages et résidence ; litiges de coupe avec les titulaires réels |
| Sylverive | Ateliers, fret et comptes contre salaires, logement et recours selon la charte de chaque cité |
| Igea | Contrats rares de voyageurs ou travailleurs ; vêtements chauds, paie et retour convenus, sans colonie imposée |
| Sarak | Eau, marché et statuts personnels ; une affaire de dette ou liberté suit la juridiction concernée |
| Varan | Accès direct, avances et collecte ; les cités fournissent un service et peuvent abuser d’une exclusivité |
| Tagon | Bois naval, fibres et fret contre paiement, droits sur les arbres et limites de coupe |
| Darg | Bêtes, laine et escorte sous contrat ; respect des jardins et passages, pas alliance des deux espèces |
| Kesh | Commerce licite et sécurité des personnes ; les ravisseurs identifiés sont distincts des marchands libres du clan |
| Enclaves serpentines | Collectes et passages consentis ; aucune autorité commune sur toutes les enclaves |

Les rapports avec humains, gobelins, orques, hommes-serpents et batraciens sont des relations entre personnes, voisins et institutions. Il n’existe aucune jauge de réputation commune à tous les hommes-singes.

## Gardes, escortes et actes criminels

Les équipements visuels disponibles pour les rôles armés comprennent : garde de communauté à lance et bouclier, escorte à lame courte et bouclier, éclaireur léger au bâton et au lancer, individu de bande avec matériel obtenu localement. Un chef est une responsabilité dans une unité, pas une nouvelle espèce de combattant ou une palette rouge.

Le poste de Relais-des-Lianes pourra protéger l’accès à ses réserves et à sa voie de marché ; l’escorte de Bourg-des-Coquilles pourra couvrir un convoi signé. Les instances devront recevoir un identifiant, un commandant ou donneur d’ordre, une solde, un itinéraire et une fin de mission avant activation. Sans ces éléments, pas de gardes gratuits ajoutés sur la carte.

Une bande du chemin des Lianes peut rançonner une cargaison si elle existe réellement dans un incident de brigandage. Des coupeurs hors limites peuvent appartenir au réseau `illicit_collectors` ; ils ne deviennent combattants qu’après violence ou mandat applicable. Des receleurs des quais peuvent traiter avec `maritime_receivers`. Un voisin neutre ne prend pas leur couleur politique par association. Les membres des groupes peuvent appartenir à plusieurs espèces.

Captivité, dette, traite et prostitution adulte suivent le chapitre 05. Des personnes de cette espèce peuvent être victimes, témoins, opposants ou responsables ; aucune de ces positions n’est héréditaire. Les victimes conservent identité, proches et choix après libération. Les brigands n’occupent pas le refuge civil : un bivouac de bande est un objet distinct, lié à son incident et éloigné des civils.

## Bâti et vie quotidienne

Les treize structures sont définies avec matériaux, usage et empreinte : maison de cour, jardin-verger, grenier ventilé, cour de fibres, atelier du bois, poterie/four, quai partagé, auvent de marché, cour commune, poste de veille, refuge, bivouac de bande et plateforme forestière facultative.

Les constructions suivent la caméra et la lumière du jeu, sur tuiles de 16 pixels. Les portes et colliders restent proportionnés au corps natif ; les longues mains doivent saisir les outils au poignet. Un quartier doit fournir eau, nourriture/réserve, logement, lieu de travail, accès au marché et refuge. Un quai touche une vraie eau navigable ; un jardin ne pousse pas sur les pavés ; les fours et scies restent à l’écart des passages.

La plupart des routines sont au sol ou sur soubassement accessible. Pas de ville entière suspendue dans une canopée décorative. L’escalade est P3 : elle exige un accès navigable réel, une hauteur, des collisions, un point d’arrivée libre et une règle de fuite compatible. Le simple dessin d’une corde ne permet pas de franchir un obstacle.

## Activités visuelles disponibles et raccordements restants

La [liste exhaustive générée](generated/ape-activities.md) contient **55 entrées**, **16 fonctions** et les **13 structures**. Ses statuts et les priorités ci-dessous conservent le plan initial ; les animations et tenues sont maintenant couvertes par le module visuel. L’ordre reste utile pour raccorder les comportements, leurs postes et leurs conséquences :

1. **P0, vie sûre :** raccorder alerte, assise/relevé, repas, boisson, portage et pose de charge, blessure, mort et repli/retour aux états persistants et aux lieux réels.
2. **P1, travail quotidien :** raccorder jardins et vergers, fibres, vannerie, cordages, résine, taille/scie/assemblage, cuisine, chargement et registres ; intégrer sommeil et salutations aux routines.
3. **P2, spécialités et combats :** relier ruchers, préparations médicinales, poterie, filets, rame, coque, couture, soins, médiation et veillée à leurs postes et effets ; raccorder le répertoire armé à l’IA, aux collisions et aux dégâts.
4. **P3, accès vertical :** escalade aménagée, uniquement après validation du moteur et du bâti.

Chaque boucle de travail possède prise de main, outil, surface et repère de contact. Les outils et objets reposent sur des calques distincts. Les vêtements suivent le tronc, les poignets et la tête ; ils ne remplacent pas un membre et ne changent pas avec le pelage. Même couverture des quatre vues, des deux bases et des cinq teintes.

Avant les combats : préparation/frappe/récupération, marqueur de contact unique, smears seulement actifs, arme visible aux deux profils, marche armée gardant l’orientation de cible, interruptions et combos courts conformes au moteur. Le bouclier doit partager les contrôles frontaux, d’étage et de ligne de vue ; un blocage ne saigne pas et ne donne pas d’invulnérabilité arrière. Un projectile ne quitte la main qu’au marqueur et utilise la collision balayée existante. Aucun profil armé ne sera activé seulement parce que le dessin de repos existe.

## Intégration jouable : conditions restantes

La source définit ce qui doit être construit ; elle ne fait apparaître aucun acteur. L’activation doit conserver identifiant, sexe, teinte, métier, santé, décès et état de trajet dans la sauvegarde. Les positions devront être cherchées sur terrain praticable, à distance de sécurité des menaces et hors des services existants ; si aucune place n’est sûre, l’habitant reste différé. Les trajets utilisent les routes, l’étage et les collisions ; pas de téléportation ni de marche sur l’eau. Les civils donnent zéro expérience.

La sécurité existante garde priorité sur les horaires. Une alerte interrompt le travail, réserve un refuge atteignable et attend le calme avant le retour. Les nouvelles restent locales et propagées, sans connaissance instantanée d’un incident dans tout Tagon. Les événements de cette extension réutilisent les règles causales de la bible ; aucune fréquence ne dépend de la seule proportion d’hommes-singes.

La règle de conflit de travail est étendue aux forêts de Boisclair/Aulneval et de Palmeraie pour rendre possibles leurs litiges de salaire et de sécurité dans le référentiel. Ce changement de régions admissibles n’active aucun générateur du jeu.
