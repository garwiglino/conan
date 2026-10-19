# Humains — relevé des tenues, couvre-chefs et animations à compléter

Audit du 19 octobre 2026, sur `garwiglino/conan`, branche `main`, commit
`312975eee30ac6ce2919d300fe457a806d9c30cb`. Le dépôt de travail initial est
plus ancien ; la version récente a été examinée au commit `312975eee30ac6ce2919d300fe457a806d9c30cb`.
Ce document prépare la fabrication. Les nouveaux dessins décrits ci-dessous
sont des propositions, pas des ressources déjà livrées ni une nouvelle règle du moteur.

## Répartition des rôles demandée

Consigne de conception donnée pour les humains : les transports, la guerre et
les métiers pénibles sont masculins. Les variantes féminines absentes de ces
fonctions **ne sont pas des manques**. Mine, carrière, abattage, forge lourde,
charpente lourde, manutention et navigation de transport suivent cette règle.
Pour les activités civiles restantes, conserver les variantes existantes et
affecter les personnes selon leur fonction. Ce relevé ne supprime aucun dessin
féminin existant ; l'affectation actuelle du moteur doit aussi être contrôlée.

## Méthode modulaire à conserver

Sources vérifiées : `docs/civilians.md`, `data/civilians/atlas.json`,
`scripts/civilian-art.js`, `scripts/civilian-runtime.js`,
`scripts/build-civilian-art.cjs` et l'archive `art/humains-civils-aseprite.zip`.
Cette archive contient 216 fichiers Aseprite éditables et les scripts Lua
`poses.lua`, `animer.lua`, `modules.lua`, `finaliser.lua` ainsi que leurs index.

- Cellule de travail de 80 × 80 pixels, pieds à `(40,52)` dans le rendu.
  L'atlas extrait des tuiles de 48 × 48, ancrées en `(24,36)`.
- Quatre vues : face, droite, dos, gauche dans l'atlas. Le moteur emploie
  dos, droite, face, gauche : préserver la conversion `[2,1,0,3]`.
- Tenue corporelle, tête, coiffure, barbe, moustache et couvre-chef sont
  indépendants. Les tenues actuelles regroupent le corps habillé ; le moteur
  n'offre pas encore un inventaire séparé de chaque manche, botte et pantalon.
- Trois plans de cheveux ; deux plans visibles de coiffe et un masque de
  découpe des cheveux. Le masque travaille sur la composition temporaire.
  Enlever une coiffe doit restituer la coiffure originale.
- Ordre de profondeur piloté notamment par `headFirst`, les plans de cheveux
  et le premier plan des outils/mains. Ne pas recopier aveuglément cet ordre
  pour les nouveaux outils : les objets cachés par le dos doivent le rester,
  les doigts doivent couvrir les poignées visibles.
- Les Lua déplacent les pixels des parties approuvées selon des poses
  explicites : respiration, pas, flexion, inclinaison, bras et travail.
  Coordonnées arrondies, palettes exactes et aucun lissage. Le compactage
  déduplique les tuiles sans redessiner le personnage.
- Le style Game Boy chibi demandé repose sur ces petites silhouettes et des
  gestes lisibles à l'échelle native. L'existant est coloré : aucune conversion
  automatique en quatre couleurs n'est nécessaire.
- Existant : repos/parole sur 4 poses, marche/fuite/portage sur 8,
  transitions assises et blessure sur 5, mort sur 8. Les travaux ont 8 poses,
  durées `[260,180,150,90,160,180,140,240]` ms, soit 1,4 s par boucle.
  Préparation lisible, contact bref, récupération ; éviter les grands
  balancements de tête. Pour les nouveaux gestes, adapter la cadence à l'effort.
- Marche pilotée par la distance parcourue ; une obstruction ne doit pas
  laisser les pieds patiner. Une action terminale garde sa dernière pose.

Les sources statiques originales référencées par l'archive pointent vers un
ancien atelier Windows non présent dans ce dépôt. Les fichiers animés et
exports sont conservés, mais une régénération intégrale depuis l'atelier
statique demande de rétablir ces sources/chemins. Le builder refuse aussi
actuellement un catalogue dont la taille diffère de 144 tenues : à adapter
lors de l'ajout, sans retirer les contrôles de complétude.

## Inventaire humain existant

**26 codes de coupe, 48 silhouettes coupe/sexe, 144 variantes de palette,
72 modules et 23 clips civils.** Une recoloration ne constitue pas une
nouvelle silhouette ou une nouvelle animation.

| Codes | Tenues présentes | Travail propre à la tenue |
|---|---|---|
| T01–T04, tempéré | Tunique des champs ; tablier de ferme ; gilet d'artisan ; tablier d'atelier | `hoe`, `sow`, `craft`, `craft` |
| A01–A04, aride | Cultivateur d'oasis ; tunique des palmeraies ; gilet des ateliers ; tablier de potier | `hoe`, `sow`, `craft`, `pottery` |
| N01–N04, neige | Pelisse des éleveurs ; manteau des hameaux ; veste des ateliers ; tablier d'hiver | `hoe`, `sow`, `craft`, `craft` |
| J01–J04, jungle | Cultivateur des clairières ; chasuble tissée ; gilet de vannier ; tablier de teinturier | `hoe`, `sow`, `weave`, `stir` |
| M01–M04, marais | Cultivateur des roseaux ; tunique des berges ; gilet des pilotis ; tablier de cuir huilé | `hoe`, `sow`, `net`, `craft` |
| E01–E02 | Pagne et haillons, deux coupes par sexe | `carry`, sans travail spécialisé supplémentaire |
| TR01–TR04 | Palefrenier ; caravanier ; batelier ; maître de port, masculins et tempérés | `groom`, `load`, `rope`, `ledger` |

Les 12 actions communes sont `idle`, `walk`, `flee`, `startle`, `talk`,
`sit_down`, `seated`, `stand_up`, `cower`, `hit`, `death`, `carry`.
Les 11 travaux sont `hoe`, `sow`, `craft`, `pottery`, `weave`, `stir`,
`net`, `groom`, `load`, `rope`, `ledger`. Une tenue ne possède généralement
que son travail propre en plus du socle commun : la présence d'un clip au
catalogue global ne garantit pas sa disponibilité sur chaque costume.

Les 72 modules comprennent 6 têtes (deux sexes × adulte/mûr/âgé),
19 coiffures, 6 barbes, 5 moustaches et 36 coiffes colorées.

| Familles de coiffes existantes | Association actuelle |
|---|---|
| H01, H02 | A01, A02, aride |
| H03, H04 | N01, N02, neige |
| H05, H06 | J01, J02, jungle |
| H07, H08 | M01, M02, marais |
| H09, H10, H11, H12 | TR01, TR02, TR03, TR04 |

Chaque famille possède trois palettes. T01–T04, les ateliers sans coiffe et
les haillons n'ont pas de couvre-chef associé. Cela n'oblige pas à en ajouter
à chaque tenue. Les noms de forme précis des H01–H12 ne sont pas renseignés
dans les métadonnées : comparer leurs pixels avant de dessiner un équivalent.

Kaldor dispose séparément de **11 tenues et 5 casques**, avec notamment
brigandine, mailles, cuir du traqueur, corsaire, kaftan, voiles nomades,
fourrures et robe du Serpent. Les casques sont nasal, cornes, fourré, arène
et heaume fermé. Ce sont des bases réutilisables, pas un catalogue de troupes
déjà raccordé aux factions. Son pont de rendu ajoute combat et habillage ;
ces capacités ne sont pas automatiquement celles des civils.

## Manques civils, par activité

**Absent** : aucun clip spécialisé dans l'atlas humain civil.
**Partiel** : costume ou geste voisin disponible, étapes/outils à compléter.
Les intitulés des nouveaux clips ci-dessous sont des noms de fabrication proposés.
La bible économique décrit certaines filières sans PNJ ni poste spécialisé
jouable : leur animation prépare ce contenu, elle ne prouve pas son intégration.

| Activité / filière du monde | État | Tenue et coiffe à compléter | Gestes / accessoires manquants |
|---|---|---|---|
| Cultures, céréales, riz, légumes, tubercules | Partiel : biner/semer présents | Réutiliser T/A/N/J/M01–02 ; protection solaire tempérée si utile | Récolter/couper, arracher, ramasser, lier une gerbe ; faucille, panier, outils d'irrigation |
| Verger, dattes, aromates, plantes tinctoriales | Absent pour la cueillette | Base agricole, panier/ceinture ; coiffe locale existante | Cueillir à hauteur, tailler, déposer dans un panier |
| Récolte lin/coton/fibres | Partiel | Base agricole ou vannier | Couper/arracher, réunir une botte ; distinguer récolte et tressage |
| Élevage, lait, laine, peaux | Partiel : `groom` ne couvre que le pansage | Berger masculin pour conduite/efforts ; couches locales, bonnet existant si adapté | Mener/nourrir, traire, tondre ; seau, fourrage, forces ; découpe/préparation des peaux |
| Chasse régulée mentionnée dans la bible | Absent dans le pack civil | Chasseur masculin, cuir du traqueur réutilisable ; capuchon facultatif | Attente, visée/tir selon arme, dépouillage ; aucun tir sans projectile associé |
| Pêche | Partiel : `net` répare un filet | Pêcheur masculin décliné par climat ; coiffe de rive à comparer à H07/H08/H11 | Lancer/relever le filet, tirer une prise ; eau réelle et sortie du matériel |
| Bois de chauffe, construction et bois naval | Absent | Forestier masculin, cuir de travail ; bonnet/capuchon local | Abattre, ébrancher, fendre au billot, scier ; hache, scie, billot/chevalet |
| Résine et poix | Absent | Réutiliser forestier masculin et tablier | Inciser/racler, recueillir dans un pot, préparer la poix |
| Charbon de bois | Absent | Charbonnier masculin, vêtements de travail fermés, coiffe simple | Charger/couvrir/surveiller la meule, ratisser ; pelle/râteau |
| Mine : fer, cuivre, étain, plomb, argent, or | Absent | Mineur masculin, tunique renforcée/tablier, coiffe de protection de cuir ou tissu | Piocher, pelleter, trier ; pioche, pelle, panier ; pas de casque moderne |
| Or alluvionnaire, si le gisement choisi le justifie | Absent, option de site | Base mineur masculin | Laver à la batée ; ne pas généraliser à tout gisement d'or |
| Pierre à bâtir, calcaire | Absent | Carrier/tailleur masculin, tablier et coiffe de travail | Extraire, frapper coin/burin, tailler, charger |
| Sel, sable sélectionné, argile | Absent pour l'extraction | Ouvrier masculin, base locale + tablier ; protection soleil/poussière | Ratisser/pelleter, récolter/cribler ; outils et terrain propres à la matière |
| Forge, métaux, bronze/acier, outils et armes | Partiel : `craft` = marteau sur établi | Forgeron masculin, réutiliser tablier renforcé, protection de tête simple | Soufflet, saisir à la pince, marteler sur enclume, verser/refroidir ; pas une seule boucle pour toute la chaîne |
| Poterie | Partiel : façonnage présent | A04 réutilisable ailleurs ; foulard/coiffe de travail facultative | Préparer terre, enfourner/défourner ; gestes distincts du façonnage |
| Verrerie | Absent | Verrier masculin pour four/travail pénible, tablier couvrant | Prendre/rouler/souffler/former ; canne, four ; pas de lunettes industrielles |
| Filage, tissage, couture | Partiel : `weave` est du panier | Tenue textile civile, tablier ; foulard/bonnet facultatif | Filer, tisser sur métier, coudre/raccommoder ; fuseau, navette, aiguille, étoffe |
| Tannerie / travail du cuir | Partiel : tabliers existants | Tanneur masculin pour travail pénible ; base atelier huilée | Racler/tendre, traiter la peau ; couture du cuir au poste approprié |
| Teinture | Partiel : `stir` présent | J04 réutilisable et variantes locales | Tremper, essorer, suspendre ; étoffe visible et cuve |
| Corderie | Partiel : `rope` manipule une corde | Réutiliser tenue de travail ; masculin si effort lourd | Tordre/tendre/lover sur support ; distinguer fabrication et amarrage |
| Eau potable | Absent pour le prélèvement | Base civile locale ; tenue masculine pour charges lourdes | Puiser, remplir, verser ; seau, corde, puits/berge |
| Moulin / farine, huile | Absent | Meunier/presseur masculin pour travail pénible, tablier ; bonnet simple | Alimenter/récupérer la mouture, presser/transvaser ; moulin/presse réels |
| Cuisine, réserves, provisions | Partiel : `stir` représente la teinture | Tablier de cuisine, coiffe propre simple | Préparer/couper, remuer version cuisine, saler/sécher/conditionner ; bol, couteau, marmite |
| Miel et cire | Absent | Apiculteur masculin si tâche pénible ; protection textile du visage proposée | Enfumer, prélever, filtrer/fondre ; ruche, enfumoir, pot ; pas d'équipement moderne |
| Remèdes et soins | Absent | Tenue civile propre, pochettes et tablier ; coiffe facultative | Cueillir/trier, piler au mortier, appliquer un bandage ; acteur soigné distinct |
| Construction, routes, ponts, réparation | Partiel : missions illustrées par `craft` | Ouvrier/charpentier masculin, tablier renforcé | Scier, assembler, cheviller, réparer pierre/bois ; outils et cible du chantier |
| Construction et réparation navales | Absent spécialisé | Charpentier naval masculin, base M04/TR03, protection pluie locale | Assembler coque, calfater, enduire de poix ; maillet, fer à calfater |
| Portage, convois, quais et magasins | Partiel : `carry` et `load` présents | Masculins ; TR02 et bases de portage, variantes aride/neige/jungle/marais | Poser/reprendre, décharger, arrimer ; sacs/paniers/planches au lieu d'une caisse universelle |
| Transports terrestres et courriers | Partiel : TR01/TR02 présents | Masculins ; adaptations climatiques manquantes | Tenir les rênes, mener attelage, monter/descendre, chevaucher si personnage visible ; remise d'un message |
| Navigation de transport | Partiel : TR03/TR04 et cordages présents | Masculins ; marin/batelier/quai adaptés aux climats | Ramer, manœuvrer à la perche, barre, embarquer/débarquer ; bateau et niveau de pont |
| Marché, gestion, négociation, administration | Partiel : parole et registre présents | Base civile propre ; marchand/administrateur identifiable sans armure | Peser/compter, remettre un objet, consulter/écrire ; balance, bourse ; `ledger` à exporter sur la bonne tenue |
| Vie quotidienne et repos | Partiel : debout/assis/parole présents | Tenues actuelles | Manger, boire, s'allonger/dormir/se lever du couchage, saluer, écouter, veiller un mort |
| Repli, blessés et justice | Partiel : fuite/protection/blessure présents | Même identité et équipement | Repos blessé distinct de mort, reddition désarmée, mains levées, interpellation ; arrestation à raccorder aux règles existantes |

## Armées et factions humaines : résultat de la vérification

La bible distingue **Teremor, Sylverive, Igea, Sarak, Varan, Tagon** comme
centres de pouvoir. Sylverive appartient à l'ensemble souverain de Teremor.
Igea, Varan et Tagon n'ont pas chacun une armée nationale uniforme dans les
sources. Darg, Kesh et les enclaves ne sont pas des factions humaines à
transformer en uniformes humains.

**La couverture militaire modulaire par faction manque.** Les patrouilles,
escortes et gardes de mission sont créés avec `look:'nomade'` dans
`world-danger.js`, `world-convoys.js`, `world-campaign-runtime.js`.
Ils utilisent le combat des gardes et le rendu historique, et sont exclus
de l'atlas civil par `civilianEligible`. La présence d'une attaque jouable
ne signifie donc pas qu'un soldat modulaire équipé par faction existe.

Les propositions suivantes traduisent les matières et fonctions de la bible.
**Couleurs d'uniforme, blasons, insignes et grades ne sont pas définis par ces
sources** : ne pas présenter une palette ou un emblème inventé comme canonique.
La couleur sarcelle/or des Veilleurs sur la cotte de Kaldor est un repère
existant local, pas une preuve d'uniforme pour tout Teremor.

| Autorité / formation attestée | Tenues masculines à produire ou adapter | Couvre-chefs proposés / bases | Animations nécessaires selon équipement |
|---|---|---|---|
| Teremor : garnison royale | Matelassé, mailles/tabard ; protection plus riche selon moyens | Nasal existant à adapter ; heaume fermé pour fonction appropriée | Repos/marche armés, lance ou lame, bouclier si porté, ordres/sommation |
| Teremor : garde seigneuriale | Même technologie, livrée et signe d'autorité du seigneur local | Nasal/calotte ; pas un nouveau casque obligatoire par seigneur | Socle armé ; mêmes gestes d'armes avec tenue locale |
| Teremor : milice | Tunique locale renforcée, matelassé simple, équipement moins uniforme | Coiffe civile ou calotte simple | Lance/bâton, garde si bouclier réellement porté, alerte/repli |
| Sylverive : garde de cité | Tenue de service portuaire, cuir/mailles, signe de la cité | Casque ouvert adapté de la base nasale | Patrouille, interpellation, contrôle de registre, combat court |
| Sylverive : escorte contractuelle / flotte commune | Cuir ou brigandine légère, équipement de bord, contrat identifiable | Calotte ouverte ou coiffe de marin selon mission | Escorte armée, lame/lance, marche de pont, navigation si poste occupé |
| Igea : maisonnée armée / garde de passage | Laine, cuir, fourrure selon saison ; mailles selon moyens | Bonnet fourré ou casque fourré existant | Lance/hache/lame selon porteur ; marche et garde sans gêne du manteau |
| Igea : garnison étrangère invitée | Tenue de son autorité d'origine adaptée au froid | Casque de l'origine, doublure climatique | Même socle armé ; ne pas la déguiser en force locale |
| Sarak : soldats urbains | Étoffes couvrantes, protection courte de cuir/métal, kaftan adapté | Casque ouvert + tissu de nuque ; coiffe locale hors combat | Lance/lame, garde, contrôle d'accès ; pas de manches traversant l'arme |
| Sarak : cavaliers | Kaftan/tenue de selle, bottes et protection permettant de monter | Coiffe contre poussière, casque selon protection | Monter, assis en selle, allures et arrêt, descendre ; combat monté seulement si développé |
| Sarak : escorte de piste | Tissus couvrants, cuir léger, gourde, équipement de route | Coiffe aride adaptée de H01/H02 ; casque selon rôle | Escorte à pied ou montée, alerte, combat compatible avec arme réelle |
| Varan : garde portuaire et locale | Cuir huilé, étoffes adaptées à l'humidité, armure courte | Calotte ouverte ; protection pluie distincte du casque | Patrouille de quai, contrôle, lance/lame, protection de charge |
| Tagon : garde portuaire | Équipement léger adapté aux quais et au climat local | Casque ouvert/coiffe de service selon rôle | Socle armé, interpellation, garde d'accès |
| Tagon : équipage armé / escorte maritime | Tenue maritime masculine, corsaire de Kaldor comme base graphique possible | Coiffe marine ; calotte en situation armée | Combat de pont, garde adaptée, manœuvre de bord ; aucun statut de pirate déduit de la tenue |
| Veilleurs déjà nommés en jeu | Cotte/tabard existants réutilisables sur PNJ masculin | Nasal/heaume existants selon fonction | Socle armé et service ; préciser mandat local avant d'étendre leur organisation |
| Culte de Nharos / Serpent déjà présent | Conserver adeptes et Prêtre existants ; adapter robe modulaire seulement si PNJ ordinaires nouveaux | Coiffe rituelle propre au rôle si nécessaire | Les attaques/sorts existants ne sont pas à recréer pour le boss ; porter parole/rite/combat sur nouveau modèle seulement si requis |

La guerre n'est pas générale à l'état initial. Un kit de soldat ne doit pas
créer une armée, une occupation ou un siège sans effectifs, mandat et stocks.
Les mêmes formations peuvent avoir des équipements variés selon poste, richesse
et saison. Un officier peut se distinguer par un petit signe lisible et un geste
d'ordre ; pas besoin de redessiner tout son corps.

### Bandes et réseaux : variantes humaines, sans uniforme du crime

| Réseau de la bible | Base vestimentaire cohérente | Manques graphiques / limites |
|---|---|---|
| `inland_bandits` | Voyageur/ouvrier local, pièces d'armure acquises individuellement | Armes compatibles, menace, interception, reddition ; aucun blason national automatique |
| `mine_deserters` | Mineur/ancien soldat d'Igea, équipement usé cohérent avec son histoire | Réemploi mineur + kit armé ; ne pas appliquer cette apparence à tous les mineurs |
| `customs_smugglers` | Marchand, roulier ou marin | Chargement, remise, contrôle, éventuellement fuite ; pas de coiffe révélant la fraude |
| `captive_brokers` | Marchand/intermédiaire local | Parole, registre, remise d'objet ; tenue ordinaire, aucun uniforme généralisé |
| `maritime_receivers` | Marin, négociant ou manutentionnaire de Varan/Tagon | Kits de quai et marché ; armement seulement pour personne réellement armée |
| `illicit_collectors` | Forestier/collecteur local | Réemploi collecte/bois ; aucun uniforme rendant le vol visible |

`kesh_raiders` est une branche gobeline de conception : ce n'est pas un kit
militaire humain supplémentaire. Les réseaux ci-dessus ne sont pas des
factions ethniques, ni tous déjà matérialisés en jeu.

### Socle d'animation militaire à ajouter au système modulaire

Réutiliser les travaux de Kaldor comme référence de bras/poignées/profondeur,
et ceux des hommes-singes/batraciens comme référence fonctionnelle, sans
copier leurs proportions ni déclarer leurs clips disponibles chez les humains.

| Lot | Clips proposés | Conditions |
|---|---|---|
| Présence | `armed_idle`, `armed_walk`, `warn`, `draw`, `sheathe` | Arme portée/tenue cohérente ; orientation distincte du déplacement si visée |
| Défense | `guard_raise`, `guard_hold`, `block`, `guard_break` | Bouclier uniquement si équipé ; garde d'arme distincte ; contact unique et récupération |
| Mêlée | `spear_thrust`, `blade_cut`, `axe_chop`, `staff_sweep` | Préparation/contact/retour, portée réelle ; smears brefs au bon plan de profondeur |
| Distance, si une unité utilise ces armes | Tir d'arc, tir d'arbalète/rechargement, jet de javelot | Familles proposées, pas unités attestées pour chaque faction ; libération du projectile à la bonne pose |
| Réactions | Blessure/mort armées, recul, `surrender`, désarmement | Aucune arme qui apparaît ou disparaît sans transition ; cadavre persistant |
| Service | Saluer, ordonner, pointer/contrôler, arrêter puis accompagner | Lier à un rôle et au mandat ; justice existante à préserver |
| Monture / pont | Montée/descente, selle/allures, rames/barre, transitions de pont | À fabriquer seulement avec support, collisions et déplacement correspondants |

## Couvre-chefs à compléter : lots proposés

Le manque confirmé est l'absence d'association au rôle/faction et de variantes
adaptées, pas l'obligation de fabriquer un objet entièrement neuf par ligne.
Comparer H01–H12 et les cinq casques de Kaldor avant de créer ces familles.

1. Protection solaire des travaux tempérés : chapeau de paille simple.
2. Bonnet/foulard propre de cuisine et de travail textile, partagé si sa forme convient.
3. Coiffe de cuir/tissu de mine et carrière, sans accessoire industriel moderne.
4. Bonnet/capuchon de forestier/charbonnier, à mutualiser avec une base climatique.
5. Protection textile de rucher et masque associé, spécifique au geste de récolte.
6. Coiffe de pluie de pêcheur/marin, avec masque compatible avec les coiffures.
7. Adaptations aride, froide et humide des coiffes de transport H09–H12.
8. Calotte ouverte simple de milice/garde, ou adaptation du casque à nasal.
9. Casque ouvert avec protection textile de nuque pour Sarak.
10. Adaptations militaires climatiques : fourré pour Igea, court/ouvert pour quais et ponts.
11. Signes d'autorité locale, de mandat, de cité/seigneur ou de grade sur coiffe/tenue/bouclier.
    Motifs à définir ; ce sont de petits modules, pas onze casques nouveaux.
12. Coiffes de fonction civile ou rituelle seulement pour un personnage/poste établi.

## Raccordements nécessaires avant intégration

- **Répartition des rôles** : `civilianAppearance` tire aujourd'hui le sexe et
  les tenues surtout par identité/biome. Des tabliers féminins ont `craft` et
  peuvent donc représenter un métier pénible. La consigne donnée nécessite
  une affectation métier → sexe autorisé → tenue, préservant les identités
  sauvegardées. TR01–TR04 sont déjà masculins ; ne pas ajouter leur miroir féminin.
- **Rôle visuel exact** : N01 s'appelle « Pelisse des éleveurs » mais joue `hoe`.
  `stir` est une teinture visuelle et correspond à `kitchen` dans l'économie.
  `craft` est classé `smith`, les réparateurs jouent aussi `craft` ; ces
  raccourcis ne représentent pas les métiers spécialisés annoncés par les noms.
- **Travail disponible sur la tenue** : un réparateur, une relève ou un opérateur
  peut recevoir un travail dont sa tenue n'a pas les images. Le test
  `outfit.frames[job]` le laisse alors au repos. Prévoir les clips nécessaires
  pour sa tenue ou un équipement professionnel compatible.
- **Coiffe indépendante** : `civilianAppearance` accepte actuellement l'absence
  de chapeau, sinon reprend celui de la tenue ; un identifiant de coiffe fourni
  n'est pas librement sélectionné. Ajouter une sélection validée pour les kits.
- **Factions** : conserver séparément origine, employeur/autorité, juridiction,
  rôle, mandat, équipement et climat. La garde étrangère d'Igea reste celle de
  son employeur ; les cités de Sylverive ne deviennent pas une nation ennemie.
- **Acteurs masculins institutionnels** : les équipes de mission et de convoi
  reçoivent actuellement des apparences civiles déterministes sans contrainte
  générale sur le sexe. Les gardes historiques n'ont pas de sélection de sexe
  modulaire. Ces chemins doivent suivre la consigne au raccordement des kits.
- **Événements** : préparation, prise, contact, transfert, lâcher et retour
  doivent avoir des repères. La production reste pilotée par l'horloge et les
  stocks de campagne ; aucune ressource ni blessure par image dessinée.
- **Interruptions** : danger, conversation, blessure, recrutement et incapacité
  doivent quitter le travail proprement sans dupliquer objet ni transaction.
- **Sources** : sortir les nouveaux Lua/index de leurs anciens chemins absolus,
  conserver les natifs modifiables, puis reconstruire atlas et versions web/iOS.

## Ordre de fabrication recommandé

1. Règles de rôle et manifeste de couverture : métier/faction, sexe autorisé,
   tenue, coiffe, arme, clips requis, climat, statut disponible/absent.
2. Gardes humains modulaires : une base masculine équipée, quatre directions,
   marche/attente armées, lance/lame, bouclier, blessure/mort et sommation.
   Décliner ensuite autorité et climat avec les bases existantes.
3. Travaux déjà simulés mais mal illustrés : réparation, portage/dépose,
   soins, cuisine ; exporter les gestes sur les tenues des vrais intervenants.
4. Filières sans gestes spécialisés : mine/carrière, bois, forge, textile,
   élevage, récolte, eau, fours et préparation des matières.
5. Transports masculins climatiques, navigation, cavaliers et unités à distance
   au rythme de l'intégration de leurs supports et comportements.
6. Vie quotidienne, variantes sociales/rituelles et signes locaux documentés.

Validation graphique future : comparer le repos aux pixels approuvés ; revoir
les quatre directions, les coiffures longues avec/sans coiffe, l'adhérence des
mains, le dos et les objets occultés, les pieds bloqués, les contacts, la fin
des chutes, les transitions et le rechargement de sauvegarde. Un atelier animé
doit afficher seulement les activités compatibles avec le rôle et l'équipement.

## Références de monde utilisées

- `docs/world-bible/01-geopolitique.md` : autorités, souveraineté, mandats et limites.
- `docs/world-bible/02-peuples-et-villes.md` : métiers, corps armés, matières et habitats.
- `docs/world-bible/03-ressources-et-echanges.md` et
  `data/world/bible/generated/resources.json` : toutes les 54 ressources de conception.
- `docs/world-bible/05-societes-et-criminalite.md` et
  `data/world/bible/generated/networks.json` : réseaux, juridictions et tenues ordinaires.
- `docs/kaldor-outfits.md`, `scripts/kaldor-civilian-bridge.js` : bases du héros réutilisables.
- `docs/personnes-affectations.md`, `scripts/world-labour-systems.js`,
  `scripts/world-labour-runtime.js`, `scripts/world-life-runtime.js` : travail et soins réels.
- `scripts/world-danger.js`, `scripts/npc-combat.js`, `scripts/world-convoys.js`,
  `scripts/world-campaign-runtime.js`, `scripts/world-justice-runtime.js` : acteurs militaires et justice.

Les nombres du catalogue ont été contrôlés directement dans l'atlas et l'archive.
Ce relevé n'ajoute encore ni pixels, ni PNJ, ni animations au jeu.
