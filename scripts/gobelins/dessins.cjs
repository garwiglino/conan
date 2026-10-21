'use strict';
/* Premier jet des gobelins, dessiné en caractères, avant les retouches dans Piskel.
 * Une vue est une fenêtre de 28 × 21 pixels : colonne 0 = x 10, rangée 0 = y 16
 * du cadre natif 48 × 48. L'ancre (les pieds) est en x 24, y 36, comme pour les
 * hommes-singes et les batraciens ; le moteur ajoute 16 sur les deux axes.
 * Un calque « auto » reçoit un contour d'encre : 'vide' seulement sur le vide
 * (la silhouette), 'coupe' aussi par-dessus ce qui est dessous (un bras devant
 * le torse). Les autres calques portent leur contour à la main (O).
 * La vue gauche est le miroir de la vue droite, sauf si elle est dessinée. */
const X0=10,Y0=16,W=28,H=21,SIZE=48,ANCHOR=[24,36],VIEWS=['face','droite','dos','gauche'];
const COULEURS={
 O:'100c14',K:'100c14',                         // encre, pupilles
 1:'a3ae8c',2:'7f8c6c',3:'5c6852',4:'404a3c',   // peau (teinte de référence : gris-vert)
 Y:'f2d04a',W:'ece2c4',m:'4a1c1c',p:'7e4848',   // yeux, crocs, bouche, lèvres
 H:'7a5a48',h:'4a3428',G:'c98a3a',              // cheveux, cuivre
 L:'7a5636',l:'553a26',k:'38261a',              // cuir
 T:'9c5b38',t:'6e3e27',                         // laine garance
 N:'59616d',n:'3e444f',                         // drap ardoise
 V:'5b4636',v:'3f3026',                         // laine brune
 b:'a2946f',B:'d6caa8',                         // corde, os
 I:'a7a3ab',i:'6b6873',j:'46434e',r:'8a4a2c',   // fer noirci, rouille
 C:'8b2c23',                                    // chiffon rouge du clan
 M:'ffffff'                                     // masque de coiffe
};
// Peau de référence (gris-vert) ; les autres teintes sont dans art/gobelins/gobelins.json.
const PEAU=['a3ae8c','7f8c6c','5c6852','404a3c'];
const v=(at,...rows)=>({at,rows});

// ---------- Corps (anatomie et tête), commun aux deux sexes sauf le visage ----------
const ANATOMIE=[
 {name:'ANATOMIE 10 - Pieds nus',auto:'vide',views:{
  face:v(18,'.........1112..2223'),droite:v(18,'...........111122'),dos:v(18,'.........2222..2223')}},
 {name:'ANATOMIE 11 - Jambes',auto:'vide',views:{
  face:v(16,'...........12..23','...........12..23'),droite:v(16,'............12','............12'),dos:v(16,'...........12..23','...........12..23')}},
 {name:'ANATOMIE 12 - Torse et cou',auto:'vide',views:{
  face:v(12,'.............22','...........122223','...........122233','............2233'),
  droite:v(12,'...........12222','...........11222','...........1122','............122'),
  dos:v(12,'.............22','...........122223','...........122233','............2233')}},
 {name:'ANATOMIE 13 - Bras et mains',auto:'coupe',views:{
  face:v(13,'........11........23','........12........23','.......112........233','.......122........233'),
  droite:v(13,'..............12','..............12','..............112','..............122'),
  dos:v(13,'........11........23','........12........23','.......112........233','.......122........233')}}
];
const CRANE={name:'07 Crane',views:{
 face:v(3,
'...........OOOOOO',
'.........OO111111OO',
'........O1111111112O',
'........O1111111112O',
'........O1111111112O',
'........O1111111112O',
'.........O111111122O',
'.........O111111122O',
'..........OO1222OO'),
 droite:v(3,
'...........OOOOO',
'.........OO11111OO',
'........O111111111O',
'........O1111111111O',
'........O1111111111O',
'........O21111111112OO',
'.........O211111112222O',
'.........O221111112OOO',
'..........OO222222O'),
 dos:v(3,
'...........OOOOOO',
'.........OO111111OO',
'........O1111111122O',
'........O1111111122O',
'........O1111111222O',
'........O2111111223O',
'.........O22111223O',
'.........O22222233O',
'..........OO2233OO')}};
const OREILLES={name:'07 Crane - Oreilles',views:{
 face:v(3,
'...O.....................O',
'...OOO.................OOO',
'....O1OO.............OO2O',
'....O211OO.........OO223O',
'.....O3421O.......O3443O',
'......O33O.........O33O',
'.......OO...........OO'),
 droite:v(3,
'.....O',
'.....OOO',
'......O21OO',
'......O3421OO',
'.......O33421O',
'........OO33O',
'..........OO'),
 dos:v(3,
'...O.....................O',
'...OOO.................OOO',
'....O1OO.............OO2O',
'....O222OO.........OO223O',
'.....O2222O.......O2233O',
'......O22O.........O33O',
'.......OO...........OO')}};
const VISAGE_M={name:'08 Visage',views:{
 face:v(6,'.........1OOO11OOO2','.........1KY1111YK2','.........1111231112','..........11123322','..........1OWmmWO2'),
 droite:v(6,'................OOO','................YK1','.................12','....................3','...............WmO')}};
const VISAGE_F={name:'08 Visage',views:{
 face:v(6,'.........1.OO11OO.2','.........OKY1111YKO','.........1111121112','..........11112322','..........11OWmpO2'),
 droite:v(6,'.................OO','................YKO','.................12','....................2','...............WpO')}};
const CHEVEUX={name:'CHEVEUX - Chignon et tresses',auto:'vide',views:{
 face:v(0,'............HhH','...........HHhhh','............Hhh','','','','','','','........H..........h','.......Hh..........hh','.......Hh..........hh','........h..........h'),
 droite:v(0,'...........HhH','..........HHhhh','...........Hhh','','','','','','','.........H','........Hh','........Hh','.........h'),
 dos:v(0,'............hHH','...........hhhHH','............hHH','','','','','','','........H..........h','.......Hh..........hh','.......Hh..........hh','........h..........h')}};
const BIJOUX={name:"BIJOUX - Anneaux d'oreille",views:{face:v(9,'......G..............G'),droite:v(9,'........G'),dos:v(9,'......G..............G')}};

// ---------- Tenues (calques HABIT, numérotés comme ceux des humains) ----------
const PAGNE={name:'HABIT 14 - Pagne',auto:'vide',views:{
 face:v(15,'...........LLLLll','............lLll'),droite:v(15,'...........LLLl','...........lLl'),dos:v(15,'...........LLLLll','............lLll')}};
const BANDEAU={name:'HABIT 12 - Bandeau',auto:'vide',views:{face:v(13,'...........TTTTtt'),droite:v(13,'...........TTTt'),dos:v(13,'...........TTTTtt')}};
const VILLAGEOIS=[
 {name:'HABIT 10 - Bandes de pied',auto:'vide',views:{face:v(18,'..........bBb..bbt'),droite:v(18,'............bBbb'),dos:v(18,'.........bbbb..bbbt')}},
 {name:'HABIT 11 - Braies',auto:'vide',views:{face:v(16,'...........NN..nn','...........Nn..nn'),droite:v(16,'............Nn','............Nn'),dos:v(16,'...........NN..nn','...........Nn..nn')}},
 {name:'HABIT 12 - Tunique',auto:'vide',views:{
  face:v(13,'...........TT11tt','...........TTTTtt','...........TTTTtt','..........TTTTTttt'),
  droite:v(12,'............TTt','...........TTTt','...........TTTt','...........TTTt','..........TTTTt'),
  dos:v(13,'...........TTTTtt','...........TTTTtt','...........TTTTtt','..........TTTTTttt')}},
 {name:'HABIT 15 - Ceinture de corde',auto:'vide',views:{face:v(15,'...........bbBbbb','.............b'),droite:v(15,'...........bbbb'),dos:v(15,'...........bbbbbb')}},
 {name:'HABIT 16 - Bourse',auto:'vide',views:{face:v(15,'................Ll','................ll'),droite:v(15,'..........Ll','..........ll'),dos:v(15,'..........lL','..........ll')}},
 {name:'HABIT 13 - Manches courtes',auto:'vide',views:{face:v(13,'........TT........tt'),droite:v(13,'..............TT'),dos:v(13,'........TT........tt')}}
];
// Guerrier : fer noirci, plaques dentelées et pointes, à la manière des gobelins de la Moria.
const GUERRIER=[
 {name:'HABIT 10 - Bottes ferrees',auto:'vide',views:{face:v(17,'...........ll..lk','.........Illk..lkkI'),droite:v(17,'............lk','...........llllkI'),dos:v(17,'...........ll..lk','.........llll..lkkk')}},
 {name:'HABIT 12 - Cotte de mailles',auto:'vide',views:{
  face:v(13,'...........iIiiIj','...........IiirIj'),droite:v(12,'...........iIii','...........Iiij','...........iri'),dos:v(13,'...........iIiiIj','...........IiiIij')}},
 {name:'HABIT 14 - Tassettes de fer',auto:'vide',views:{
  face:v(16,'...........IjCCIj','...........I..C.I'),droite:v(16,'..........IjCI','..........I.C'),dos:v(16,'...........IjCCIj','...........I.C..I')}},
 {name:'HABIT 15 - Ceinturon',auto:'vide',views:{face:v(15,'...........kkBkkk'),droite:v(15,'..........kkkkk'),dos:v(15,'...........kkkkkk')}},
 {name:'HABIT 13 - Manches de mailles',auto:'vide',views:{face:v(13,'........Ii........iI'),droite:v(13,'..............Ii'),dos:v(13,'........iI........Ii')}},
 {name:'HABIT 17 - Brassards',auto:'vide',views:{face:v(14,'........Ij........Ij'),droite:v(14,'..............Ij'),dos:v(14,'........jj........jj')}},
 {name:'HABIT 18 - Spaliere dentelee',auto:'vide',views:{
  face:v(11,'..................I.I','..................IiIi','..................jjj'),droite:v(11),
  dos:v(11,'.........I.I','........iIiI','.........jjj'),gauche:v(11,'.........I.I','........IiIi','.........jjj')}}
];

// ---------- Coiffes : un calque COIFFE 21 et son masque (cheveux cachés) ----------
const CAPUCHE={name:'COIFFE 21 - Capuche',auto:'vide',views:{
 face:v(2,
'...........VVVVVv',
'.........VVVVVVVVvv',
'........VVVVVVVVVvvv',
'........Vvvvvvvvvvvv',
'........V..........v',
'........V..........v',
'........V..........v',
'........V..........v',
'........V..........v',
'.......VVV........vvv',
'.......VVVV......vvvv'),
 droite:v(2,
'...........VVVVv',
'.........VVVVVVVvv',
'........VVVVVVVVVvv',
'........VVVVVVVVvvv',
'........VVVVVv',
'........VVVVv',
'........VVVVv',
'........VVVVv',
'........VVVvv',
'.......VVVVvv',
'.......VVVVVvv'),
 dos:v(2,
'...........VVVVVv',
'.........VVVVVVVVvv',
'........VVVVVVVVVvvv',
'........VVVVVVVVVvvv',
'........VVVVVVVVVvvv',
'........VVVVVVVVvvvv',
'........VVVVVVVVvvvv',
'........VVVVVVVvvvvv',
'........VVVVVVVvvvvv',
'.......VVVVVVVVvvvvvv',
'.......VVVVVVVvvvvvvv',
'.............Vv')}};
const MASQUE_CAPUCHE={name:'MASQUE COIFFE - occulter les cheveux',masque:true,views:{
 face:v(0,...Array(13).fill('.....MMMMMMMMMMMMMMMMMM')),droite:v(0,...Array(13).fill('.....MMMMMMMMMMMMMMMMMM')),dos:v(0,...Array(13).fill('.....MMMMMMMMMMMMMMMMMM'))}};
const CASQUE={name:'COIFFE 21 - Casque a pointes',views:{
 face:v(0,
'.............OO',
'..........O.OIjO.O',
'.........OIOIiijOjO',
'........OIiiiiiijjjO',
'........OiIiiiiijjjO',
'.......OjIjIjIjIjIjjO',
'.......OOOOOOOOOOOOOO'),
 droite:v(0,
'............OO',
'.........O.OIjO.O',
'........OIOIiijOjO',
'.......OIiiiiiijjjO',
'.......OiIiiiiiijjjO',
'......OjjIjIjIjIjIjjO',
'......OjjOOOOOOOOOOOOO',
'......OjjO',
'.......OO'),
 dos:v(0,
'.............OO',
'..........O.OjIO.O',
'.........OjOjiiIOIO',
'........OjjjiiiiiIIO',
'........OjjjiiiiiiIO',
'.......OjjIjIjIjIjIjO',
'........OjjjjjjjjjjO',
'........OjOjjOjjOjjO',
'.........O..O..O..O')}};
const MASQUE_CASQUE={name:'MASQUE COIFFE - occulter les cheveux',masque:true,views:{
 face:v(0,...Array(6).fill('.......MMMMMMMMMMMMMM')),droite:v(0,...Array(6).fill('......MMMMMMMMMMMMMMM')),dos:v(0,...Array(6).fill('.......MMMMMMMMMMMMMM'))}};

// ---------- Arme : tenue dans la main droite ; de profil gauche, derrière le corps ----------
const CIMETERRE_DEVANT={name:'ARME - Cimeterre dentele (devant)',auto:'coupe',views:{
 face:v(10,'...I','...Ij','....Ij','....IIj','.....Ij','.....kBk','.......k'),
 droite:v(10,'......................I','.....................jI','....................jI','...................jII','...................jI','.................kBk','................k'),
 dos:v(10,'........................I','........................jI','.......................jI','......................jII','......................jI','.....................kBk','....................k'),
 gauche:v(10)}};
const CIMETERRE_DERRIERE={name:'ARME - Cimeterre dentele (derriere)',auto:'coupe',views:{
 face:v(10),droite:v(10),dos:v(10),
 gauche:v(10,'.....I','.....Ij','......Ij','......IIj','.......Ij','........kBk','..........k')}};

// ---------- Fichiers Piskel ----------
const corps=visage=>[...ANATOMIE,CRANE,visage,OREILLES];
const FICHIERS={
 'corps/masculin.piskel':{type:'corps',sexe:'masculin',description:'Gobelin, corps masculin : anatomie et tête, sans habit. Cadres : face, droite, dos, gauche. Pieds à l’ancre x 24, y 36.',calques:corps(VISAGE_M)},
 'corps/feminin.piskel':{type:'corps',sexe:'feminin',description:'Gobeline, corps féminin : même silhouette que le masculin (les habits vont aux deux), visage, chignon et anneaux d’oreille.',calques:[...ANATOMIE,CRANE,VISAGE_F,CHEVEUX,OREILLES,BIJOUX]},
 'tenues/pagne.piskel':{type:'tenue',description:'Tenue la plus simple : pagne de cuir.',calques:[PAGNE]},
 'tenues/pagne-bandeau.piskel':{type:'tenue',description:'Pagne de cuir et bandeau de laine.',calques:[BANDEAU,PAGNE]},
 'tenues/villageois.piskel':{type:'tenue',description:'Villageois : tunique de laine ajustée au corps gobelin, braies, ceinture de corde, bourse, bandes de pied.',calques:VILLAGEOIS},
 'tenues/guerrier.piskel':{type:'tenue',description:'Guerrier : cotte de mailles rouillée, tassettes et spalière de fer noirci dentelées, brassards, bottes ferrées.',calques:GUERRIER},
 'coiffes/capuche.piskel':{type:'coiffe',description:'Capuche de laine, fendue pour les oreilles. Le masque cache les cheveux dessous.',calques:[CAPUCHE,MASQUE_CAPUCHE]},
 'coiffes/casque-a-pointes.piskel':{type:'coiffe',description:'Casque de fer noirci à crête de pointes et bord dentelé. Les tresses restent visibles dessous.',calques:[CASQUE,MASQUE_CASQUE]},
 'armes/cimeterre-dentele.piskel':{type:'arme',description:'Cimeterre court à dos dentelé, dans la main droite. Le calque « derrière » passe sous le corps (vue gauche).',calques:[CIMETERRE_DERRIERE,CIMETERRE_DEVANT]}
};
module.exports={X0,Y0,W,H,SIZE,ANCHOR,VIEWS,COULEURS,PEAU,FICHIERS};
