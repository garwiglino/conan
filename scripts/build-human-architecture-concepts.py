#!/usr/bin/env python3
"""Catalogue/briefs de concepts uniquement : ne produit aucun sprite runtime."""
import json
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'data/humains/architecture'
ART = ROOT / 'art/humains/architecture'

def group(key, title, kind, entries, material):
    return dict(id=key, title=title, kind=kind, material=material,
                image=f'art/humains/architecture/concepts/{key}.png',
                items=[dict(id=i, label=l, brief=b, nativeEnvelope=e) for i,l,b,e in entries])

BOARDS = [
group('01-teremor', 'Teremor — habitat tempéré', 'building', [
 ('T01','Chaumière','Petite maison rurale, torchis crème, soubassement pierre, chaume, une porte en façade, cheminée latérale.',[64,56,64]),
 ('T02','Longère de ferme','Habitation rurale allongée, deux volumes sous le même toit, pierre et bois, pas de mobilier ni cultures.',[96,56,64]),
 ('T03','Maison mitoyenne et boutique','Maison urbaine à étage, colombages, tuiles, devanture fermée, murs latéraux aveugles pour mitoyenneté.',[64,48,88]),
 ('T04','Petit manoir','Demeure de domaine, pierre et colombages, deux étages modestes, porte identifiable, aucune armée ou bannière inventée.',[96,72,96]),
], 'Pierre grise chaude, bois brun, enduit écru, chaume ocre et tuiles terre cuite. Petits volumes chibi médiévaux.'),
group('02-sylverive', 'Sylverive — cité et commerce', 'building', [
 ('T05','Maison de négociant','Maison haute à deux étages, rez-de-chaussée en pierre, étage enduit et bois, lucarne, boutique fermée.',[64,56,96]),
 ('T06','Entrepôt portuaire','Grand hangar bois-pierre à toit de tuiles, grandes portes de chargement en façade et arrière, palan fixé au pignon sans cargaison.',[112,80,80]),
 ('T07','Maison des chartes','Maison de conseil civique avec porche central, étage, archives fermées, sans armoiries ni symbole religieux.',[112,80,96]),
 ('T08','Manufacture textile','Atelier collectif de taille artisanale, deux niveaux, fenêtres régulières et évents, pas d’usine industrielle ni machines incluses.',[112,80,88]),
], 'Même famille de matériaux que Teremor, maçonnerie soignée, tuiles brunes, bois foncé et enduit crème. Ports uniquement aux accès confirmés.'),
group('03-igea', 'Igea — habitat et réserves', 'building', [
 ('T09','Maison longue','Maison de vallée, murs pierre et rondins, toit pentu en bardeaux sombres, petit sas d’entrée, cheminée. État sans neige.',[96,64,80]),
 ('T10','Refuge de passage','Petit refuge compact, épais soubassement pierre, toit pentu en bois, entrée protégée du vent, état sans neige.',[64,56,72]),
 ('T11','Grenier surélevé','Réserve fermée sur courts piliers de pierre, accès par escalier court aligné avec porte, toit pentu, état sans neige.',[64,56,72]),
 ('T12','Loge de mineurs','Dortoir modeste en pierre et bois, entrée et appentis de stockage vide, toit pentu, état sans neige.',[96,64,72]),
], 'Pierre grise, rondins bruns, bardeaux sombres, isolations sobres. PAS de neige dans cette planche : le froid est saisonnier.'),
group('04-sarak', 'Sarak — bassins et étapes', 'building', [
 ('T13','Maison à cour','Petite maison compacte d’adobe clair, toit terrasse et parapet bas, entrée ombragée, cour intérieure suggérée par volume, pas de vue du dessus.',[80,72,56]),
 ('T14','Demeure de bourg','Maison urbaine à étage en pierre et enduit sable, petites ouvertures, volets, toit terrasse, pas de coupoles monumentales.',[72,64,80]),
 ('T15','Relais de caravane','Ensemble compact autour d’une cour, portail assez large pour monture, murs adobe et auvent, aucune charrette ni animal.',[128,96,72]),
 ('T16','Réserve fraîche','Grenier en terre crue et pierre, toit terrasse, ouvertures hautes petites, porte abritée, pas de marchandise intégrée.',[80,64,64]),
], 'Enduits sable et argile, pierre ocre, bois sobre, tissus de protection en écru. Pas de désert dessiné, pas de palais oriental cliché.'),
group('05-varan', 'Varan — habitats humides', 'building', [
 ('T17','Maison sur plancher haut','Habitation humaine en bois sur poteaux courts, escalier lié à la seule porte, toit à large débord, plancher vide sous maison.',[72,64,80]),
 ('T18','Maison de bourg drainé','Maison humaine sur soubassement de pierre bas, bois ventilé, toit de bardeaux à large débord, porte protégée.',[80,64,72]),
 ('T19','Halle ventilée','Halle de marché couverte, charpente ouverte sur côtés, petits parapets démontables, aucune table ni étal intégré.',[112,80,72]),
 ('T20','Dépôt surélevé','Entrepôt fermé sur fondations hautes, escalier et quai de chargement fixes, toit très débordant, vide, sans eau sous le bâti.',[112,80,88]),
], 'Bois brun chaud, pierre moussue seulement en teinte, fibre et bardeaux, aérations. Aucun arbre, marécage ou plateforme de terrain dessiné.'),
group('06-tagon', 'Tagon — côtes et arrière-pays', 'building', [
 ('T21','Maison côtière','Maison humaine en bois renforcé sur soubassement pierre, toit en fibres serrées, volets, porche court.',[72,64,72]),
 ('T22','Maison forestière','Maison basse en bois et fibres, toit large, débords courts, une annexe couverte vide, aucune végétation.',[80,64,72]),
 ('T23','Maison des marins','Bâtiment collectif humain, étage en bois, galerie étroite en façade, toit en bardeaux et fibres, sans ancres décoratives géantes.',[112,80,88]),
 ('T24','Dépôt de bois naval','Grand hangar ventilé à charpente renforcée et baies hautes, sol absent, aucun tas de bois, aucun bateau.',[128,80,80]),
], 'Bois brun et miel, soubassement gris chaud, toit fibres paille et bardeaux. Architecture humaine pratique, pas de cabanes perchées attribuées aux hommes-singes.'),
group('07-fermes', 'Dépendances rurales', 'building', [
 ('B01','Grange','Grande enveloppe agricole bois et pierre, large double porte, toit en chaume, aucun foin ni chariot.',[112,80,80]),
 ('B02','Étable fermée','Bâtiment bois-pierre, porte et ouvertures de ventilation, toiture tuiles, intérieur vide : les stalles déjà créées sont séparées.',[112,80,72]),
 ('B03','Bergerie','Petite enveloppe pastorale en pierre sèche et bois, toit bas protecteur, large entrée, aucune bête ni barrière ajoutée.',[96,64,64]),
 ('B04','Abri pastoral démontable','Abri humain en toile écrue sur ossature bois simple, entrée identifiable, piquets structurels, pas de tapis au sol ni troupeau.',[80,64,56]),
], 'Base tempérée bois/pierre/chaume et toile ; fonctions réutilisables avec palettes et enveloppes locales, pas de neige.'),
group('08-echanges', 'Marchés et relais', 'building', [
 ('B05','Halle de marché','Charpente ouverte et toiture tuiles, piliers lisibles, espace vide pour les étals indépendants.',[128,80,80]),
 ('B06','Grenier collectif','Réserve publique maçonnée, petites aérations, grande porte, toiture solide, pas de sacs dessinés.',[112,80,88]),
 ('B07','Auberge-relais','Enveloppe à étage bois/pierre, porte abritée et petite annexe, enseigne vide, pas de tables ni de personnages.',[112,80,96]),
 ('B08','Comptoir d’échange','Petit bâtiment de marché en pierre et bois, ouverture de service fermée et porte latérale, aucun registre intégré.',[80,64,64]),
], 'Bâti civil humain pratique, mêmes contours et couleurs que les postes. Les étals, lits et tables existent séparément.'),
group('09-ateliers', 'Ateliers à nuisances', 'building', [
 ('B09','Forge couverte','Enveloppe de forge en pierre et charpente ouverte sur façade, cheminée de maçonnerie, espace vide pour forge/enclume indépendantes, pas de feu.',[96,80,80]),
 ('B10','Atelier de cuisson','Poterie/verrerie : enveloppe pierre et bois avec cheminée et évents, annexe de refroidissement vide, fours et tour séparés.',[112,80,80]),
 ('B11','Tannerie','Hangar ouvert ventilé à débord de toit, petit local fermé, aucune cuve, peau, eau ou cadre : postes séparés.',[112,80,72]),
 ('B12','Atelier de charpente','Hangar à bois et charpente ouvert à grandes baies, espace vide pour chevalet et établi, aucune lame industrielle ni roue.',[128,80,80]),
], 'Pierre aux zones de chaleur, bois ailleurs, toits bruns et tuiles, cheminées modestes. Aucun outil, machine ou poste de travail inclus.'),
group('10-alimentation', 'Transformation alimentaire', 'building', [
 ('B13','Moulin à vent','Petit moulin-tour de pierre, quatre ailes de bois simples détachables, porte à taille humaine. Ailes structure mécanique indépendante du bâtiment lors de transcription.',[96,80,128]),
 ('B14','Moulin à eau','Maison du moulin pierre et bois, roue à aubes latérale détachable, porte séparée, pas d’eau, pas de rive ni terrain.',[112,80,88]),
 ('B15','Fournil','Petite maison du pain en pierre et enduit, cheminée, porte et fenêtre, aucun four dessiné dans le bâtiment.',[80,64,72]),
 ('B16','Fumoir et séchoir','Petite construction de bois et pierre, évents sous toit, cheminée discrète, porte, aucun poisson/viande ni râtelier intégré.',[64,56,80]),
], 'Bois, pierre et enduit tempérés. Moulins = projets à placer après validation du vent ou du cours d’eau réel, pas installation automatique.'),
group('11-fibres', 'Textile et transformations', 'building', [
 ('B17','Maison des tisserands','Petit atelier bois/enduit avec grandes fenêtres, porte et toit tuiles, aucun métier à tisser intégré.',[96,72,80]),
 ('B18','Teinturerie','Enveloppe d’atelier aérée, cheminée discrète, appentis vide, murs enduit et pierre, aucune cuve ni tissu suspendu.',[96,72,72]),
 ('B19','Corderie','Long hangar étroit, charpente répétable sous toiture légère, ouvert sur longueur, aucun cordage ou banc intégré.',[144,56,64]),
 ('B20','Huilerie et pressoir','Enveloppe pierre et bois, large porte et abri latéral, toit tuile, la presse et les produits restent séparés.',[96,72,72]),
], 'Échelle artisanale préindustrielle, charpente répétable, aucune machine intégrée. Adapter les matériaux au climat sans changer les sockets des postes.'),
group('12-public', 'Vie publique et mémoire', 'building', [
 ('B21','Maison de conseil','Bâtiment administratif modeste à étage, entrée publique et fenêtres régulières, pas de blason inventé.',[112,80,96]),
 ('B22','Maison de soins','Maison basse avec galerie abritée, ouvertures claires, aucune croix religieuse ni lit/personnage.',[112,80,80]),
 ('B23','Salle de mémoire et rites','Petit bâtiment communautaire sobre, pierre et bois, entrée abritée, aucun symbole de culte inventé ni statues.',[96,80,88]),
 ('B24','Salle commune et refuge','Maison commune à grande salle, accès simple et annexe, toiture solide, capacité d’abri civil, vide de mobilier.',[112,80,80]),
], 'Institutions mentionnées ou besoins civils dérivés du lore. Styles proposés à valider, pas de religion nationale inventée.'),
group('13-garde', 'Garde et défense habitée', 'building', [
 ('F01','Poste de garde','Petit corps de garde en pierre et bois, entrée abritée, fenêtre étroite, pas de garde dessiné.',[80,64,80]),
 ('F02','Caserne','Bâtiment collectif à étage modeste, entrée centrale et réserve, pierre et bois, pas de campement ni armes intégrées.',[128,80,96]),
 ('F03','Arsenal','Réserve sécurisée basse, pierre et porte ferrée, aérations étroites, toit tuile, sans armes ni râteliers.',[96,72,80]),
 ('F04','Donjon résidentiel','Tour-maison seigneuriale compacte en pierre, deux étages utiles, entrée à hauteur accessible, pas de palais ni château gigantesque.',[96,80,128]),
], 'Défenses humaines sobres, pierre grise et bois brun, pas d’armoiries ni drapeaux. Garnisons seulement selon mission, budget et stock.'),
group('14-fortifications', 'Tours et portes d’enceinte', 'building', [
 ('F05','Tour de guet bois','Tour de charpente carrée, plate-forme protégée par toit, escalier court puis échelle intérieure, pas de personne.',[64,64,128]),
 ('F06','Tour de rempart pierre','Tour carrée maçonnée, chemin de ronde crénelé, accès par porte basse, raccord de courtine latéral.',[80,80,128]),
 ('F07','Porte de palissade','Porte charpentée à deux piliers et galerie, passage entièrement OUVERT ; les vantaux séparés seront des modules.',[112,48,96]),
 ('F08','Porte de rempart','Porte maçonnée flanquée de deux petites tours carrées, passage OUVERT avec loge haute, pas de herse dans passage.',[144,64,128]),
], 'Palisade brun miel et rempart pierre grise. Le dos montre l’accès réel et la galerie, les profils l’épaisseur et les raccords ; jamais quatre copies de la façade.'),
group('15-sites', 'Dépendances des districts', 'building', [
 ('X01','Portail de mine','Seulement le bâtiment d’accès indépendant : cadre renforcé en bois, petite couverture de protection et portes, profondeur de galerie suggérée par parois structurelles, aucun rocher ni montagne.',[80,56,64]),
 ('X02','Loge de carrière','Petite loge pierre/bois de district, auvent ouvert vide, aucun gisement ni tas de pierres.',[80,64,64]),
 ('X03','Hangar des salines','Hangar sec ventilé, soubassement pierre, toit simple, portes pour chargement, pas de bassin, sel, eau ou sable.',[96,72,72]),
 ('X04','Chantier naval couvert','Grande charpente ouverte et toit bardeaux, espace vide pour coque future séparée, aucun bateau, eau, cordage ou outil.',[144,96,96]),
], 'Architecture de production, indépendante des ressources naturelles et transports ; districts exacts à vérifier avant placement.'),
]

MODULE_GROUPS = [
 ('16-structures','Structure et enveloppes',[
  ('M01','Panneau colombage','Mur répétable enduit écru et ossature bois, extrémités nettes.'),
  ('M02','Panneau pierre','Mur de maison en blocs gris, répétable sans sol.'),
  ('M03','Panneau adobe','Mur en terre crue ocre avec couronnement simple.'),
  ('M04','Fondation sur poteaux','Travée de poteaux courts et poutres porteuses, sans plancher de terrain.'),
  ('M05','Poutre de liaison','Poutre horizontale avec mortaises d’assemblage.'),
  ('M06','Poteau de charpente','Poteau vertical avec pied pierre et tête de liaison.'),
  ('M07','Pignon de toiture','Pignon triangulaire bois/enduit, faîte et base nets.'),
  ('M08','Faîtage','Segment de faîtage bois/tuiles, extrémités raccordables.'),
 ]),
 ('17-enceintes','Murs et chemins de ronde',[
  ('M09','Palissade droite','Segment répétable de pieux avec traverses arrière.'),
  ('M10','Courtine droite','Segment répétable de rempart pierre et créneaux.'),
  ('M11','Terminaison','Fin verticale propre de mur ou palissade, aucun bout diagonal.'),
  ('M12','Jonction en L','Jonction à angle droit de rempart, dessin cardinal sans caméra diagonale.'),
  ('M13','Jonction en T','Nœud orthogonal d’enceinte, sans branche diagonale.'),
  ('M14','Parapet bas','Garde-corps plein/crénelé répétable de chemin de ronde.'),
  ('M15','Chemin de ronde','Plate-forme porteuse et consoles sans sol naturel, segment rectiligne.'),
  ('M16','Escalier de rempart','Volée de marches structurelles avec palier, hauteur adaptée aux courtes jambes.'),
 ]),
 ('18-ouvertures','Portes, fenêtres et protection',[
  ('M17','Porte de maison','Vantail bois simple fermé, ferrures et huisserie, ouvrant distinct.'),
  ('M18','Vantaux de grand portail','Deux vantaux massifs indépendants de l’enceinte ; présentation fermée et petite silhouette ouverte en annotation.'),
  ('M19','Arc de passage','Encadrement de pierre à passage vide, aucun mur autour.'),
  ('M20','Fenêtre à volets','Huisserie et deux volets bois, version fermée et ouverts indiquée.'),
  ('M21','Fenêtre grillagée','Cadre pierre et grille fine, noir de baie, pas de barre de prison géante.'),
  ('M22','Claustra de ventilation','Panneau bois ajouré pour climats humides/chauds.'),
  ('M23','Garde-corps de galerie','Rambarde de balcon répétable, bois, aucun personnage.'),
  ('M24','Auvent','Petite toiture sur consoles, bois/toile écrue, sans table ou étal dessous.'),
 ]),
 ('19-franchissements','Ponts et accès portuaires',[
  ('M25','Travée de pont bois','Tablier porteur en bois et rambardes, segment vide, sans eau.'),
  ('M26','Arche de pont pierre','Arche maçonnée structurelle et tablier, aucune rivière.'),
  ('M27','Culée de pont','Appui maçonné de raccord, aucun relief naturel.'),
  ('M28','Quai bois','Segment de quai sur pilotis, plateau et poutres, sans eau.'),
  ('M29','Quai pierre','Face maçonnée de quai et couronnement, sans eau ni terrain.'),
  ('M30','Extrémité de jetée','Module terminal carré bois et renforts, sans navire ni cordage.'),
  ('M31','Escalier d’accostage','Petit escalier bois ou pierre fixé au quai, sans eau.'),
  ('M32','Rampe de chargement','Rampe structurelle courte et rambarde, accès pour chariot séparé.'),
 ]),
 ('20-eau-salubrite','Eau et salubrité — structures seules',[
  ('M33','Paroi de citerne','Segment de maçonnerie étanche et couronnement, sans eau.'),
  ('M34','Gouttière et descente','Gouttière bois et descente raccordable pour récupération, sans pluie.'),
  ('M35','Encadrement de vanne','Support maçonné de vanne séparée déjà existante, sans mécanisme ni eau.'),
  ('M36','Conduit sur supports','Travée de conduit d’irrigation vide, bois/pierre, pas de canal creusé dans le sol.'),
  ('M37','Cloison de latrines','Cloison d’intimité et porte de cabine sanitaire, module sans fosse ni terrain.'),
  ('M38','Grille d’évacuation','Cadre d’évacuation en paroi avec grille, pas de dalle de terrain.'),
  ('M39','Cheminée','Souche maçonnée et chapeau, indépendante, pas de fumée/feu.'),
  ('M40','Évent de toiture','Petit capot ventilé indépendant, bois et bardeaux.'),
 ]),
 ('21-toitures-chantier','Couvertures et assemblages',[
  ('M41','Toiture terrasse','Segment de couverture et parapet adobe, aucun sol de terrain.'),
  ('M42','Travée chaume','Section répétable de couverture de chaume, bord d’égout droit.'),
  ('M43','Travée fibres','Section de toit en fibres tropicales, aucun feuillage vivant.'),
  ('M44','Travée bardeaux','Section de couverture en bois sombre.'),
  ('M45','Travée tuiles','Section de couverture en tuiles terre cuite.'),
  ('M46','Palier extérieur','Palier de circulation structurel sur supports et garde-corps, pas de sol naturel.'),
  ('M47','Travée échafaudage','Deux montants, traverses et plate-forme vide, module répétable.'),
  ('M48','Ossature en chantier','Travée de charpente ouverte inachevée, sans outils ni travailleurs.'),
 ]),
]
for key,title,entries in MODULE_GROUPS:
    BOARDS.append(group(key,title,'module',[(i,l,b,[32,32,32]) for i,l,b in entries],
                        'Pierre grise chaude, bois brun, enduit crème ou ocre, couvertures cohérentes avec les six familles.'))
for board in BOARDS:
    if board['kind']=='module':
        for item in board['items']:
            item['orientations']=['front'] if item['id'] in ['M16','M31'] else ['east_west','north_south']
BOARDS.append(group('22-igea-hiver','Igea — neige saisonnière','seasonal',[
 (i+'-hiver',l+' — hiver',b+' Même bâtiment que la planche 03, même porte, proportions et géométrie. Fine neige sur parties exposées de toiture, rebords inactifs ; entrée et circulation dégagées. Pas de neige sur mobilier, pas de sol enneigé.',e)
 for i,l,b,e in [(x['id'],x['label'],x['brief'],x['nativeEnvelope']) for x in BOARDS[2]['items']]
], 'Garder pierre et bois identiques à la planche Igea sans neige. Neige bleu très pâle seulement en couverture exposée.'))

from human_architecture_expansion import expansion
BOARDS.extend(expansion(group))

COMMON = '''Créer une planche de CONCEPT ART PIXEL ART pour Hearthreaver, cohérente avec les références de postes humains et le personnage natif joint. Game Boy chibi en couleurs limitées, vrais amas de pixels carrés nets, pas de rendu peint, pas de lissage, contour très sombre #100c14, petits volumes géométriques lisibles. Fond UNI uni vert sombre #202e29. Planche de fabrication claire, aucune scène, aucun paysage, pas d'isométrie.
La référence humaine exacte fait 19 pixels natifs de haut, pas 22 ou 24. Chaque ouverture de porte laisse passer un humain de 19 px : hauteur utile environ 24 px, largeur simple 16 px. Petites maisons environ 64-80 px de large, grands bâtiments 96-144 px, tours jusqu'à 128 px haut ; dessiner avec un même grossissement pixel partout. Un petit humain séparé en haut sert uniquement de règle, jamais intégré à un bâtiment. Socles/bandes de sol, terrain, herbe, arbres, eau, rochers, sable, routes, trottoirs, neige au sol : INTERDITS. Les bâtiments finissent directement à leur base structurelle. Les étages et escaliers sont des structures, pas des tuiles de sol. Pas de meubles, machines de poste, outils, véhicules, animaux ou personnages dans les bâtiments. Pas de texte dans les textures, pas d'armoiries, pas de drapeaux ou symboles religieux inventés. Texte de légende français court hors des objets.
CAMÉRA STRICTEMENT CARDINALE : façades droites parallèles à l'image, verticales verticales, bases horizontales. On ne voit JAMAIS simultanément une façade et un mur latéral. Les pentes de vrais toits sont permises, mais AUCUN angle 3/4 ou bâtiment isométrique. Dessiner comme des ÉLÉVATIONS orthographiques cardinales de sprites RPG, caméra sans rotation diagonale. Chaque vue représente le MÊME volume, la même largeur/profondeur, les mêmes portes, cheminées et ouvertures autour du bâtiment. Ne pas réinventer une porte sur chaque face. Droite/gauche sont les deux profils du même bâti ; dos = vraie façade arrière. Les annexes, marches et cheminées passent du bon côté et s'occultent logiquement. Pas de lettres parasites dans les sprites.
'''

MODULE_CAMERA = '''CAMÉRA RPG FIXE VUE DU DESSUS : il faut des ORIENTATIONS DANS LE PLAN DE LA CARTE, pas des élévations techniques face/profil. La caméra regarde toujours du même côté, légèrement du dessus, comme un RPG Game Boy chibi (axe vertical du monde projeté vers le haut de l'écran, hauteur des murs visible vers le bas). Aucun changement de caméra entre les dessins. Les axes de la carte sont horizontaux et verticaux à l'écran, jamais diagonaux/isométriques.
HORIZONTAL E–O : le segment court de gauche à droite, sommet/couronnement visible en bande horizontale et face avant sous le sommet.
VERTICAL N–S : le MÊME TYPE de segment se prolonge de BAS EN HAUT dans la carte ; son sommet/couronnement est une bande LONGUE ET VERTICALE visible du dessus, avec sa texture répétée sur TOUTE la longueur et la hauteur physique suggérée à l'extrémité proche. Ce n'est JAMAIS une simple tranche verticale de 1 pilier représentant le bout du mur. Par exemple une courtine verticale montre plusieurs créneaux et plusieurs dalles de couronnement qui s'éloignent vers le haut de l'image, pas un seul créneau vu par la tranche. Palissade verticale = suite de sommets de pieux le long de l'axe écran vertical, pas un pieu isolé. Les motifs des planches d'origine sont des références de MATIÈRE uniquement : remplacer leurs faux profils par ces vrais segments longitudinaux N–S.
Ne PAS pivoter une image plate de 90 degrés : reconstruire sommet, faces et occultation pour la même caméra en gardant la pesanteur, poteaux, jambages et hauteur verticale dans l'écran. Une porte dans un mur N–S a son passage ouvert transversalement E–O, ses deux montants séparés le long de l'axe N–S, et son couronnement se raccorde aux segments N–S. Fenêtres et supports s'insèrent dans les vraies parois E–O ou N–S. Les modules quasi carrés/poteaux peuvent avoir des orientations semblables, mais leurs raccords tournent dans le plan de carte. Passerelles et ponts verticaux doivent montrer TOUTE la longueur du tablier par-dessus, jamais le petit bout du pont.
Même épaisseur, hauteur et échelle de personnage entre les orientations. Longueur de raccord indicative 32 px natifs : elle se projette sur x pour E–O et sur y pour N–S ; la hauteur d'un mur s'ajoute à la projection. Points cyan de raccord aux VRAIES extrémités : gauche/droite sur E–O, haut/bas sur N–S. Aucun point haut/bas utilisé pour la hauteur physique d'un simple poteau. Les angles L/T forment de vrais chemins orthogonaux vus du dessus, branches complètes et sommet continu ; pas une élévation plate qui cache la branche perpendiculaire.
PRIORITÉ À LA DERNIÈRE CORRECTION : ESCALIERS TOUJOURS DE FACE. M16 et M31 ont UNE SEULE orientation utile : volée qui monte vers le haut de l'écran, marches horizontales bien visibles de face. Ne JAMAIS dessiner leur profil en escalier incliné vers gauche/droite. Leur paire de cases montre ESCALIER FACE et RACCORDEMENT AU PALIER, pas deux orientations forcées. La rampe M32 présente aussi sa surface utilisable du dessus plutôt qu'un profil.
PLATEFORMES ET TABLIERS TOUJOURS VUS DU DESSUS, dans LES DEUX orientations, horizontales et verticales. Cela comprend M04 (structure porteuse et plancher), M15, M25/M26, M28/M29, M30, M32, M46/M47. E–O = vrai rectangle de surface praticable de gauche à droite (environ64×32px) ; N–S = rectangle de surface praticable de bas en haut (environ32×64px). On voit les planches/dalles sur TOUTE la surface, pas seulement la face latérale et les pieds de support. Petit rebord de hauteur à l'avant permis, mais ne pas masquer la surface par une grande façade. Aucun tablier en diagonale ou trapèze isométrique.
Les barrières/garde-corps sont des modules distincts qui se COLLENT EXACTEMENT aux BORDS des plateformes : mêmes sections, même épaisseur et même perspective que M09/M14/M23 ; orientations E–O et N–S réelles. Aucune barrière qui flotte à côté ou traverse le milieu de la surface, aucun vide entre bord de plateforme et pied de barrière. Montrer les plateformes vides SANS garde-corps intégré dans les cases principales, puis un petit exemple d'assemblage en bas avec ces barrières raccordées aux bords et l'escalier DE FACE raccordé au bord proche. Laisser le passage d'escalier ouvert entre deux barrières.
'''

def prompt(board):
    if board['kind']=='module':
        layout = '''Disposition paysage, grand titre en haut puis QUATRE rangées et QUATRE colonnes. Chaque rangée contient DEUX objets indépendants : colonnes 1/2 = HORIZONTAL E–O puis VERTICAL N–S du module de gauche ; colonnes 3/4 = HORIZONTAL E–O puis VERTICAL N–S du module de droite. Huit modules au total, SEIZE dessins. Les modules N–S peuvent être beaucoup plus hauts que larges : réserver la place de leur LONGUEUR dans la carte. En-têtes HORIZONTAL / VERTICAL / HORIZONTAL / VERTICAL. Numéro et nom sous chaque paire. Petits points cyan de raccord, jamais de sol dessiné. Conserver les numéros M01 à M48 selon le contenu exact. En bas ajouter un petit exemple de raccord avec des segments horizontaux ET verticaux formant un L, dessus continus, sans aucune texture de terrain. Cet exemple d'assemblage est une annotation séparée, pas un module supplémentaire.'''
    else:
        layout = '''Disposition paysage, grand titre en haut puis QUATRE rangées et QUATRE colonnes. Chaque rangée contient un seul bâtiment répété en QUATRE VUES DISTINCTES du même modèle. Colonnes exactement FACE / DROITE / DOS / GAUCHE. Quatre bâtiments au total, SEIZE dessins. Respecter les profils étroits lorsque la profondeur est plus faible que la largeur. Numéro et nom au début de chaque ligne. Dimensions natives largeur × profondeur × hauteur dans brief = proportions cibles, pas texte à recopier partout. Petit socket cyan séparé au pied de la vraie entrée de chaque vue où l'entrée est visible ; si la porte est sur face cachée, aucun socket faux devant le mur arrière. Le socket ne fait pas partie de l'art. Le premier plan d'un seuil pourra masquer les pieds, toiture/haut du mur sont détachables lors de la transcription future ; ne pas faire de vue intérieure coupée dans ces seize vues.'''
    rows='\n'.join(f"{n+1}. {x['id']} — {x['label']} : {x['brief']} Proportions natives cibles {x['nativeEnvelope']}." for n,x in enumerate(board['items']))
    if board.get('layout')=='high_wall_portrait':
        h=board['heightPx']
        layout=layout.replace('Disposition paysage','FORMAT PORTRAIT VERTICAL, image 1024x1536 ou 1536x2048. Disposition portrait')
        layout+=f'''\nRÈGLE VISUELLE DE HAUTEUR : un module droit est UNE TRAVÉE courte de48px de long et {h}px de HAUT, pas sept travées étirées côte à côte. La face du mur droit doit être presque CARRÉE ou PLUS HAUTE QUE LARGE. Dessiner au maximum quatre ou cinq grandes pierres de largeur, mais au moins dix assises de pierres de hauteur si pierre ; si bois, longues palissades massives sur toute la hauteur. Pas de paroi deux ou trois fois plus large que haute : ce serait encore un muret. Un humain de19px, dessiné séparément à côté du pied de la première paroi, doit être clairement plus petit : le mur est {h/19:.2f}fois sa hauteur. Utiliser le MÊME zoom pour l'humain et les murs. Dans la colonne N–S le couronnement reste une LONGUE bande vue par-dessus ; ne pas étirer un profil terminal. Les plateformes et escaliers peuvent être plus bas en dessin, c'est leur surface qui est vue par-dessus. Les murs doivent surtout montrer une longue élévation, de la base au parapet, hauteur visible sans raccourcir pour remplir une cellule horizontale.'''
    common=COMMON
    priority='Priorité absolue : chaque cellule est une vraie élévation de face ou de profil, jamais de biais.'
    if board['kind']=='module':
        common=COMMON.split('CAMÉRA STRICTEMENT CARDINALE :')[0]+MODULE_CAMERA
        priority='Priorité absolue : les deux orientations sont des segments utilisables dans la carte, sommet visible, caméra RPG unique. Les VERTICAUX montrent une vraie longueur N–S, pas le bout de l’objet vu de profil.'
    extra='\n'+board['additionalBrief'] if board.get('additionalBrief') else ''
    return common+'\nTITRE : '+board['title'].upper()+'\n'+layout+'\nMATÉRIAUX : '+board['material']+'\nCONTENU EXACT :\n'+rows+extra+'\n'+priority+' Pixel art très proche des postes de référence, volumes chibi sobres et fonctionnels.'

def build():
    OUT.mkdir(parents=True,exist_ok=True)
    catalogue={'schema':2,'status':'concepts_only_not_runtime','humanNativeHeightPx':19,
      'buildingDirections':['face','droite','dos','gauche'],'moduleDirections':['east_west','north_south'],
      'moduleProjection':'caméra RPG fixe surplombante, sommet visible ; orientation dans le plan de carte, jamais une simple tranche vue de profil',
      'stairsProjection':'M16/M31 : uniquement de face, montée vers le haut de la carte ; seconde case = exemple de raccord au palier',
      'platformProjection':'surface praticable vue du dessus dans les deux orientations ; barrières indépendantes accolées aux bords, passage d’escalier ouvert',
      'projectionReference':'art/humains/architecture/principe-modules.png',
      'highWallScaleReference':'art/humains/architecture/echelle-enceintes-hautes.png',
      'nativeEnvelopeMeaning':'[largeur, profondeur, hauteur], cibles de fabrication non mesurées sur PNG généré',
      'sources':['docs/world-bible/01-geopolitique.md','docs/world-bible/02-peuples-et-villes.md',
                 'docs/world-bible/03-ressources-et-echanges.md','docs/world-bible/05-societes-et-criminalite.md',
                 'data/world/bible/generated/settlements.json','docs/humains-postes-concepts.md'],
      'artDirectionStatus':'propositions graphiques dérivées du climat et des fonctions ; aucun nouveau canon architectural ou religieux',
      'boards':BOARDS}
    (OUT/'concepts.json').write_text(json.dumps(catalogue,ensure_ascii=False,indent=2)+'\n')
    for board in BOARDS:
        (OUT/(board['id']+'.prompt.txt')).write_text(prompt(board)+'\n')
    print(json.dumps({'boards':len(BOARDS),'kinds':dict(Counter(b['kind'] for b in BOARDS)),
                     'items':sum(len(b['items']) for b in BOARDS)},ensure_ascii=False))

if __name__=='__main__': build()
