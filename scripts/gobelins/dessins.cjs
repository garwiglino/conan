'use strict';
/* Premier jet des gobelins, d'après la référence en quatre vues de Lino, avant les
 * retouches dans Piskel.
 * Une vue est une fenêtre de 32 × 25 pixels : colonne 0 = x 8, rangée 0 = y 12 du
 * cadre natif 48 × 48. L'ancre (les pieds) est en x 24, y 36, comme pour les
 * hommes-singes et les batraciens ; le moteur ajoute 16 sur les deux axes.
 * Le gobelin fait 22 pixels de haut : rangée de figure 0 = haut du crâne (y 14),
 * rangée 21 = bas des pieds (y 35). Les dessins sont en rangées de figure ; la vue de
 * face et la vue de dos commencent à la colonne 5 de la fenêtre, la vue droite à la 8.
 * Le corps nu est découpé en calques par zones (pieds, jambes, torse, bras, crâne,
 * oreilles, visage). Une tenue, une coiffe ou une chevelure est dessinée sur le
 * gobelin entier : les pixels qui diffèrent du corps nu forment ses calques, répartis
 * eux aussi par zones. La vue gauche est le miroir de la vue droite, sauf pour les
 * calques qui la dessinent (spalière, arme). */
const X0=8,Y0=12,W=32,H=25,SIZE=48,ANCHOR=[24,36],VIEWS=['face','droite','dos','gauche'];
const TOP=2,LEFT={face:5,droite:8,dos:5};
const COULEURS={
 O:'100c14',                                    // encre
 1:'d8cb61',2:'b4ad53',3:'828244',4:'5a5734',5:'3c3a24', // peau (teinte de référence : olive)
 Y:'f8c00b',y:'e19e1c',W:'f7f7f6',p:'9c5a48',   // yeux, croc, lèvres
 S:'c98144',L:'a9663d',M:'8b5135',d:'6b3f2d',e:'472c20',k:'2e1d14', // cuir, cuir noirci
 T:'6d7889',t:'4c5464',                         // laine bleu-gris
 N:'6b5a48',n:'4a3d30',                         // drap brun
 V:'5b4636',v:'3f3026',                         // laine brune
 b:'a2946f',B:'d6caa8',                         // corde, os
 I:'a7a3ab',i:'6b6873',j:'46434e',r:'8a4a2c',   // fer noirci, rouille
 C:'8b2c23',                                    // chiffon rouge du clan
 H:'4b4656',h:'2b2833',G:'c98a3a',              // cheveux, cuivre
 X:'ffffff'                                     // masque de coiffe
};
// Peau de référence (olive) ; les autres teintes sont dans art/gobelins/gobelins.json.
const PEAU=['d8cb61','b4ad53','828244','5a5734','3c3a24'];

// Une vue : rangées de figure à partir de `at` ; `x` place la colonne 0 ailleurs
// que d'habitude, `miroir` dessine la vue gauche comme le miroir d'un dessin droit.
const vue=(at,...rows)=>({at,rows});
// Remplace des rangées d'une vue (rangées de figure -2 à 21).
function mod(base,at,...rows){
 const m=new Map(base.rows.map((r,k)=>[base.at+k,r]));rows.forEach((r,k)=>m.set(at+k,r));
 const ks=[...m.keys()].sort((a,b)=>a-b);return vue(ks[0],...ks.map(k=>m.get(k)));
}
function grille(view,dir){
 const g=Array.from({length:H},()=>Array(W).fill(null));if(!view)return g;
 const x=view.x??LEFT[view.miroir?'droite':dir];
 view.rows.forEach((row,k)=>[...row].forEach((ch,i)=>{if(ch==='.')return;
  if(!COULEURS[ch])throw Error(dir+' : caractère inconnu « '+ch+' »');
  const j=TOP+view.at+k,c=view.miroir?W-1-(x+i):x+i;if(j<0||j>=H||c<0||c>=W)throw Error(dir+' : hors de la fenêtre');g[j][c]=ch;}));
 return g;
}
const enRangees=g=>g.map(r=>r.map(c=>c||'.').join(''));
// Calques d'une planche : pixels qui diffèrent de la base, rangés par zone(dir, rangée, colonne, caractère).
// `complet` : zones prises en entier, même là où elles égalent la base (un visage qui en remplace un autre).
function decoupe(planche,base,zone,noms,complet=[]){
 const out=new Map(Object.values(noms).map(n=>[n,{name:n,views:{}}]));
 for(const dir of VIEWS){if(!planche[dir])continue;
  const g=grille(planche[dir],dir),b=base?grille(base[dir],dir):grille(null,dir),per=new Map();
  for(let j=0;j<H;j++)for(let i=0;i<W;i++){const ch=g[j][i];if(!ch)continue;
   const key=zone(dir,j-TOP,i-(planche[dir].x??LEFT[dir==='gauche'?'droite':dir]),ch);
   if(ch===b[j][i]&&!complet.includes(key))continue;
   if(!noms[key])throw Error('pixel sans calque : '+dir+' rangée '+(j-TOP)+' colonne '+(i-LEFT[dir])+' ('+key+')');
   if(base&&!complet.includes(key)&&/[1-5]/.test(ch))throw Error(noms[key]+' / '+dir+' rangée '+(j-TOP)+' colonne '+(i-LEFT[dir])+' : ton de peau dans une pièce, il échapperait à la teinte');
   if(!per.has(key))per.set(key,Array.from({length:H},()=>Array(W).fill(null)));per.get(key)[j][i]=ch;}
  for(const [key,n]of Object.entries(noms))out.get(n).views[dir]={at:0,rows:enRangees(per.get(key)||grille(null,dir))};}
 return [...out.values()];
}
// Calque dessiné tel quel (spalière, arme), vue par vue.
function calque(name,views){return {name,views:Object.fromEntries(VIEWS.map(d=>[d,{at:0,rows:enRangees(grille(views[d],d))}]))};}
const masque=(name,j0,j1)=>({name,masque:true,views:Object.fromEntries(VIEWS.map(d=>[d,{at:0,rows:Array.from({length:H},(_,j)=>(j>=j0&&j<=j1?'X':'.').repeat(W))}]))});

// ---------- Corps nu ----------
const NU={
 face:vue(0,
'........OOOOOO........',
'......OO322223OO......',
'.....O3322222333O.....',
'OOOOO333222223333OOOOO',
'O12343O11233211O34332O',
'.O1224OOO4334OOO4332O.',
'.O1444yYO3223OYy4442O.',
'..O2431111221111343O..',
'..OOO311134431113OOO..',
'....O311OOOOO1113O....',
'.....O211111W112O.....',
'...O13234555543343O...',
'...O12421122113432O...',
'...O13432111123432O...',
'..O123O31111123O432O..',
'..O112O43211234O211O..',
'..O112O43322334O211O..',
'.O1O12O233OO334O21O1O.',
'..OOOOO23O..O34OOOOO..',
'.....O123O..O321O.....',
'...O11112O..O21111O...',
'...OOOOOOO..OOOOOOO...'),
 droite:vue(0,
'......OOOOO.....',
'....OO32222OO...',
'...O332222221O..',
'...O333222211O..',
'OOOOOOO32OOO11O.',
'O11223433yYO1O..',
'.O1344432112111O',
'..O34443211O233O',
'...OO443211OOOO.',
'...O443211OO1O..',
'....O432111WO...',
'...O33455OOO....',
'...O123O32111O..',
'...O123O432111O.',
'...O124O432111O.',
'..O1123O43211O..',
'..O11112O3321O..',
'..O1O1O2O4332O..',
'...OOOOOO4332O..',
'....O43OO1232O..',
'...O4334OO11112O',
'...OOOOOOOOOOOOO'),
 dos:vue(0,
'........OOOOOO........',
'......OO222223OO......',
'.....O2222222333O.....',
'OOOOO222222223333OOOOO',
'O12342222222333334332O',
'.O122422222333334332O.',
'.O144433333333334442O.',
'..O2433333333333443O..',
'..OOO433333333344OOO..',
'....O443333333344O....',
'.....O4444444444O.....',
'...O13234555543343O...',
'...O12421112223432O...',
'...O13422112233432O...',
'..O123O32222234O432O..',
'..O112O33222334O211O..',
'..O112O43322334O211O..',
'.O1O12O433OO334O21O1O.',
'..OOOOO34O..O43OOOOO..',
'.....O123O..O321O.....',
'...O12222O..O22221O...',
'...OOOOOOO..OOOOOOO...')};
// Oreille de profil, rangées 4 à 8 : colonnes de la pointe à la base.
const OREILLE_DROITE=[[0,6],[0,6],[1,6],[2,6],[3,4]];
function zoneCorps(dir,r,c){
 if(dir==='droite'){
  const o=OREILLE_DROITE[r-4];if(o&&c>=o[0]&&c<=o[1])return 'oreilles';
  if(r>=4&&r<=10&&c>=8)return 'visage';
  if(r<=10)return 'crane';
  // Le bras pend devant le flanc : le torse commence après lui (colonne 8, puis 9 à la main).
  const devant=r<=15?8:9;
  if(r===11||(r<=16&&c>=devant))return 'torse';
  if((r<=18&&c>=devant)||r===19)return 'jambes';
  return r>=20?'pieds':'bras';
 }
 if(r>=3&&r<=8&&(c<=4||c>=17))return 'oreilles';
 if(dir==='face'&&r>=4&&r<=10&&c>=6&&c<=15)return 'visage';
 if(r<=10)return 'crane';
 if((r===11&&c>=6&&c<=15)||(r>=12&&r<=16&&c>=7&&c<=14))return 'torse';
 if((r>=17&&r<=18&&c>=7&&c<=14)||r===19)return 'jambes';
 return r>=20?'pieds':'bras';
}
const NOMS_CORPS={pieds:'ANATOMIE 10 - Pieds nus',jambes:'ANATOMIE 11 - Jambes',torse:'ANATOMIE 12 - Torse et cou',bras:'ANATOMIE 13 - Bras et mains',crane:'07 Crane',visage:'08 Visage',oreilles:'07 Crane - Oreilles'};
const CORPS=decoupe(NU,null,zoneCorps,NOMS_CORPS);
const ANATOMIE=CORPS.filter(l=>/^ANATOMIE/.test(l.name)),CRANE=CORPS.find(l=>l.name==='07 Crane'),VISAGE_M=CORPS.find(l=>l.name==='08 Visage'),OREILLES=CORPS.find(l=>l.name==='07 Crane - Oreilles');
// Sous le visage, le crâne est rempli de peau : il ne se voit pas, mais le calque reste plein.
for(const dir of ['face','droite']){const c=CRANE.views[dir].rows,v=VISAGE_M.views[dir].rows;
 CRANE.views[dir].rows=c.map((row,j)=>[...row].map((ch,i)=>v[j][i]!=='.'&&ch==='.'?'2':ch).join(''));}

// ---------- Gobeline : son visage, sa chevelure (chignon et tresses), ses anneaux ----------
const FEMININ={
 face:mod(NU.face,-2,
'.........OOOO.........',
'........OHHHhO........',
'........OOhhOO........',
'......OHHHHHHhhO......',
'.....OHHHHHHHhhhO.....',
'OOOOOHH32222233hhOOOOO',
'O1234H1OO2332OO1h4332O',
'.O122HO11333311Oh332O.',
'.O144HyYO3223OYyh442O.',
'..O2431111221111343O..',
'.GOOO311124421113OOOG.',
'..OHO3111OppO1113OhO..',
'..OHhO211111W112OhHO..',
'..OHh323455554334hHO..',
'...OO242112211343OO...'),
 droite:mod(NU.droite,-2,
'.....OOOO.......',
'....OHHHhO......',
'.....OhhOOO.....',
'...OHHHHHhhOO...',
'...OHHHHhh221O..',
'...OHHHh22211O..',
'OOOOOOO322OO11O.',
'O1122343OyYO1O..',
'.O1344432112111O',
'..O34443211O233O',
'..GOO443211OOOO.',
'.OHO44321pOO1O..',
'..OHO432111WO...',
'..OHh3455OOO....',
'...OO23O32111O..'),
 dos:mod(NU.dos,-2,
'.........OOOO.........',
'........OHHHhO........',
'........OOhhOO........',
'......OHHHHHHhhO......',
'.....OHHHHHHHhhhO.....',
'OOOOOHHHHHHHHhhhhOOOOO',
'O1234HHHHHHHhhhhh4332O',
'.O122HHHHHHhhhhhh332O.',
'.O1444HHHHhhhhhh4442O.',
'..O24333HHHhhh33443O..',
'.GOOO433333333344OOOG.',
'..OHO443333333344OhO..',
'..OHhO4444444444OhHO..',
'..OHh323455554334hHO..',
'...OO242111222343OO...')};
const NOMS_FEMININ={visage:'08 Visage',cheveux:'CHEVEUX - Chignon et tresses',bijoux:"BIJOUX - Anneaux d'oreille"};
const zoneFeminin=(dir,r,c,ch)=>ch==='G'?'bijoux':zoneCorps(dir,r,c)==='visage'?'visage':'cheveux';
const [VISAGE_F,CHEVEUX,BIJOUX]=decoupe(FEMININ,NU,zoneFeminin,NOMS_FEMININ,['visage']);

// ---------- Tenues (calques HABIT, numérotés comme ceux des humains) ----------
// La tenue de la référence : gilet de cuir ouvert, culotte, ceinture et bourse.
const HARNAIS={
 face:mod(NU.face,11,
'...O13dL455554Ld43O...',
'...O124dL1221Ld432O...',
'...O134MLM11MLM432O...',
'..O123OdMM11MMdO432O..',
'..O112OeeeeeMSMO211O..',
'..O112OMMMdMMdMO211O..',
'.O1O12OdMMOOMMdO21O1O.',
'..OOOOOdMO..OMdOOOOO..'),
 droite:mod(NU.droite,11,
'...OLMd55OOO....',
'...O123OMd111O..',
'...O123OMLMd11O.',
'...O124OMMMd11O.',
'..O1123OeeeMSMO.',
'..O11112OMMMdMO.',
'..O1O1O2OdMMMdO.',
'...OOOOOOdMMdO..'),
 dos:mod(NU.dos,11,
'...O13SdOOOOOOdS43O...',
'...O124LMMMMMMd432O...',
'...O134LMMMMMMd432O...',
'..O123OMMMMMMMdO432O..',
'..O112OeeLLLLeeO211O..',
'..O112OMMdSSdMMO211O..',
'.O1O12OdMMOOMMdO21O1O.',
'..OOOOOdMO..OMdOOOOO..')};
const bourse={face:[[15,16,12,14]],droite:[[15,16,11,14]],dos:[[15,16,9,12]]};
const dans=(zones,r,c)=>(zones||[]).some(([r0,r1,c0,c1])=>r>=r0&&r<=r1&&c>=c0&&c<=c1);
const zoneHarnais=(dir,r,c)=>dans(bourse[dir],r,c)?'bourse':r<=14?'gilet':r===15?'ceinture':'culotte';
const NOMS_HARNAIS={culotte:'HABIT 11 - Culotte de cuir',gilet:'HABIT 12 - Gilet de cuir',ceinture:'HABIT 15 - Ceinture',bourse:'HABIT 16 - Bourse'};

const PAGNE={
 face:mod(NU.face,15,
'..O112OeddddddeO211O..',
'..O112O4OLLLMO4O211O..',
'.O1O12O2OLLMMO4O21O1O.',
'..OOOOO23OMdO34OOOOO..',
'.....O123OOOO321O.....'),
 droite:mod(NU.droite,15,
'..O1123OeeeedO..',
'..O11112O3OLMO..',
'..O1O1O2O4OLMO..',
'...OOOOOO4OMdO..',
'....O43OO12OOO..'),
 dos:mod(NU.dos,15,
'..O112OeddddddeO211O..',
'..O112O4OLLLMO4O211O..',
'.O1O12O4OLMMMO4O21O1O.',
'..OOOOO34OMdO43OOOOO..',
'.....O123OOOO321O.....')};
const NOMS_PAGNE={pagne:'HABIT 14 - Pagne'};
const BANDEAU={
 face:mod(PAGNE.face,12,'...O124TTTTTTTt432O...','...O134tttttttn432O...'),
 droite:mod(PAGNE.droite,12,
'...O123OTTTTtO..',
'...O123OtttttnO.'),
 dos:mod(PAGNE.dos,12,'...O124TTTCCTTt432O...','...O134tttCCttn432O...')};
const zoneBandeau=(dir,r)=>r<=13?'bandeau':'pagne';
const NOMS_BANDEAU={bandeau:'HABIT 12 - Bandeau',pagne:'HABIT 14 - Pagne'};

const VILLAGEOIS={
 face:mod(NU.face,11,
'...OTTTT455554ttttO...',
'...OTTOTTTTTTttOTtO...',
'...OttOTTTTTTttOttO...',
'..O123OTTTTTTttO432O..',
'..O112ObbBbbbbbO211O..',
'..O112OTTTTLMttO211O..',
'.O1O12OttttMdttO21O1O.',
'..OOOOONnO..OnnOOOOO..',
'.....ONNnO..OnNNO.....',
'...O11bBbO..ObBb11O...'),
 droite:mod(NU.droite,11,
'...OTTt55OOO....',
'...OTTtOTTTTtO..',
'...OtttOTTTTTtO.',
'...O124OTTTTTtO.',
'..O1123ObbBbbO..',
'..O11112OTTLMO..',
'..O1O1O2OttMdO..',
'...OOOOOONNnnO..',
'....OnnOONNNnO..',
'...O4bbbOObBb12O'),
 dos:mod(NU.dos,11,
'...OTTTTTTTTTTttttO...',
'...OTTOTTTTTTttOTtO...',
'...OttOTTTTTTttOttO...',
'..O123OTTTTTTttO432O..',
'..O112ObbbbBbbbO211O..',
'..O112OTTTTTTttO211O..',
'.O1O12OttttttttO21O1O.',
'..OOOOONnO..OnNOOOOO..',
'.....ONNnO..OnNNO.....',
'...O1bBb2O..O2bBb1O...')};
const bourseVillageois={face:[[16,17,11,12]],droite:[[16,17,11,12]]};
const manches={face:[[11,13,0,6],[11,13,15,21]],droite:[[12,13,0,7]],dos:[[11,13,0,6],[11,13,15,21]]};
const zoneVillageois=(dir,r,c)=>r>=20?'pieds':r>=18?'braies':r===15?'ceinture':dans(bourseVillageois[dir],r,c)?'bourse':dans(manches[dir],r,c)?'manches':'tunique';
const NOMS_VILLAGEOIS={pieds:'HABIT 10 - Bandes de pied',braies:'HABIT 11 - Braies',tunique:'HABIT 12 - Tunique',ceinture:'HABIT 15 - Ceinture de corde',bourse:'HABIT 16 - Bourse',manches:'HABIT 13 - Manches courtes'};

// Guerrier : fer noirci, mailles rouillées, plaques dentelées, à la manière des gobelins de la Moria.
const GUERRIER={
 face:mod(NU.face,11,
'...OiIiI455554IiIjO...',
'...OIiOIiIiIiijOijO...',
'...OiIOiIiIiIjjOjjO...',
'..OdIeOIiIiIiijOeIeO..',
'..OdedOkkkBkkkkOedeO..',
'..O112OIijCCIijO211O..',
'.O1O12OIjjCCIjjO21O1O.',
'..OOOOOOjOCrOjOOOOOO..',
'.....OeekO..OkeeO.....',
'...OIeeekO..OkeeeIO...'),
 droite:mod(NU.droite,11,
'...OiIi55OOO....',
'...OIiIOIiIijO..',
'...OiIjOiIiIjjO.',
'...OdIeOIiIijjO.',
'..OdedeOkkBkkO..',
'..O11112OIijCIO.',
'..O1O1O2OIjjCjO.',
'...OOOOOOOjOrOO.',
'....OkkOOeeekO..',
'...OkkkkOOeeekIO'),
 dos:mod(NU.dos,11,
'...OiIiIiIiIiIijijO...',
'...OIiOIiIiIiijOijO...',
'...OiIOiIiIiIjjOjjO...',
'..OdIeOIiIiIiijOeIeO..',
'..OdedOkkkkkkkkOedeO..',
'..O112OIijCCIijO211O..',
'.O1O12OIjjCCIjjO21O1O.',
'..OOOOOOjOCrOjOOOOOO..',
'.....OeekO..OkeeO.....',
'...OkeeeeO..OeeeekO...')};
const mailles={face:[[11,13,0,6],[11,13,15,21]],droite:[[12,13,0,7]],dos:[[11,13,0,6],[11,13,15,21]]};
const brassards={face:[[14,15,0,6],[14,15,15,21]],droite:[[14,15,0,7]],dos:[[14,15,0,6],[14,15,15,21]]};
const zoneGuerrier=(dir,r,c)=>r>=19?'bottes':r>=16?'tassettes':dans(brassards[dir],r,c)?'brassards':r===15?'ceinturon':dans(mailles[dir],r,c)?'manches':'cotte';
const NOMS_GUERRIER={bottes:'HABIT 10 - Bottes ferrees',cotte:'HABIT 12 - Cotte de mailles',tassettes:'HABIT 14 - Tassettes de fer',ceinturon:'HABIT 15 - Ceinturon',manches:'HABIT 13 - Manches de mailles',brassards:'HABIT 17 - Brassards'};
// Spalière sur l'épaule gauche : à droite de la vue de face, à gauche de dos ; de profil,
// elle ne se voit que dans la vue gauche (dessinée ici comme un profil droit, puis retournée).
const SPALIERE=calque('HABIT 18 - Spaliere dentelee',{
 face:{...vue(9,
'.................O.O..',
'.................IOIO.',
'..............IiIiIjO.',
'...............OjjjjO.',
'................jOjO..'),x:LEFT.face},
 dos:{...vue(9,
'..O.O.................',
'.OIOI.................',
'.OjIiIiI..............',
'.OjjjjO...............',
'..OjOj................'),x:LEFT.dos},
 gauche:{...vue(9,
'...O.O..........',
'..OIOIO.........',
'..OIiIiIjO......',
'..OjjjjjjO......',
'..OjOjOjO.......'),miroir:true}});

// ---------- Coiffes : un calque COIFFE 21 et son masque (cheveux cachés) ----------
const CAPUCHE={
 face:mod(NU.face,-1,
'.......OOOOOOOO.......',
'.....OOVVVVVVvvOO.....',
'....OVVVVVVVVVvvvO....',
'...OVVVVVVVVVVvvvvO...',
'OOOOOVVVVVVVVVvvvOOOOO',
'O1234VvvvvvvvvvvvO332O'.slice(0,17)+'4332O',
'.O122VOOO4334OOOv332O.',
'.O144VyYO3223OYyv442O.',
'..O24V1111221111v43O..',
'..OOOV1113443111vOOO..',
'...OVV11OOOOO111vvO...',
'..OVVV211111W112vvvO..',
'..OVVVV34555543vvvvO..',
'..OOOO4211221134OOOO..'),
 droite:mod(NU.droite,-1,
'.....OOOOOO.....',
'....OVVVVVvO....',
'...OVVVVVVvvO...',
'..OVVVVVVVVvvO..',
'..OVVVVVVVVvvvO.',
'OOOOOOOVvOOO11O.',
'O112234VvyYO1O..',
'.O13444Vv112111O',
'..O3444Vv11O233O',
'.OVOOVVVv11OOOO.',
'.OVVVVVv11OO1O..',
'.OVVVVv2111WO...',
'.OVVVVVv5OOO....',
'.OOOOOOOO2111O..'),
 dos:mod(NU.dos,-1,
'.......OOOOOOOO.......',
'.....OOVVVVVVvvOO.....',
'....OVVVVVVVVVvvvO....',
'...OVVVVVVVVVVvvvvO...',
'OOOOOVVVVVVVVVvvvOOOOO',
'O1234VVVVVVVVvvvv4332O',
'.O122VVVVVVVVvvvv332O.',
'.O144VVVVVVVvvvvv442O.',
'..O24VVVVVVVvvvvv43O..',
'..OOOVVVVVVvvvvvvOOO..',
'...OVVVVVVVvvvvvvvO...',
'..OVVVVVVVVvvvvvvvvO..',
'..OVVVVVVVVvvvvvvvvO..',
'..OOOOOOOVVvvOOOOOOO..',
'.........OOOO.........')};
const CASQUE={
 face:mod(NU.face,-2,
'..........OO..........',
'.......O.OIjO.O.......',
'......OIOOIjOOjO......',
'.....OIiIiiiijjjO.....',
'....OIiiiiiiiijjjO....',
'OOOOOIiiiiiiiijjjOOOOO'.slice(0,17)+'OOOOO',
'O1234jIjIjIjIjIjj4332O'.slice(0,17)+'4332O',
'.O1224OOO4Ij4OOO4332O.',
'.O1444yYO3Ij3OYy4442O.'),
 droite:mod(NU.droite,-2,
'.......OO.......',
'....O.OIjO.O....',
'...OIOOIjOOjO...',
'...OIiIiiiijO...',
'..OIiiiiiiijjO..',
'..OIiiiiiiijjjO.',
'OOOOOOOjIjIjIjO.',
'O11223433yYOIO..'),
 dos:mod(NU.dos,-2,
'..........OO..........',
'.......O.OjIO.O.......',
'......OjOOjIOOIO......',
'.....OIiIiiiijjjO.....',
'....OIiiiiiiiijjjO....',
'OOOOOIiiiiiiiijjjOOOOO'.slice(0,17)+'OOOOO',
'O1234jIjIjIjIjIjj4332O'.slice(0,17)+'4332O',
'.O122Iiiiiiiiijjj332O.',
'.O144jOjOjOjOjOjO442O.')};

// ---------- Arme : tenue dans la main droite ; de profil gauche, derrière le corps ----------
const CIMETERRE_FACE=vue(6,
'.....O',
'....OIO',
'....OIjO',
'....OIOO',
'.....OIjO',
'.....OIOO',
'......OIjO',
'......OIjO',
'.....OkBBkO',
'........k',
'........k',
'........k',
'........B');
const CIMETERRE_DROITE=vue(6,
'........O',
'.......OIO',
'.......OIjO',
'.......OIOO',
'........OIjO',
'........OIOO',
'.........OIjO',
'.........OIjO',
'..........OkBkO',
'............k',
'............k',
'............k',
'............B');
const retourne=v=>({...vue(v.at,...v.rows.map(r=>[...r.padEnd(W,'.')].reverse().join(''))),x:0});
const CIMETERRE_DEVANT=calque('ARME - Cimeterre dentele (devant)',{
 face:{...CIMETERRE_FACE,x:0},droite:{...CIMETERRE_DROITE,x:0},dos:retourne(CIMETERRE_FACE)});
const CIMETERRE_DERRIERE=calque('ARME - Cimeterre dentele (derriere)',{gauche:retourne(CIMETERRE_DROITE)});

// ---------- Fichiers Piskel ----------
const tenue=(planche,zone,noms)=>decoupe(planche,NU,zone,noms);
const coiffe=(planche,nom)=>decoupe(planche,NU,()=>'coiffe',{coiffe:nom});
const FICHIERS={
 'corps/masculin.piskel':{type:'corps',sexe:'masculin',description:'Gobelin, corps masculin : anatomie et tête, sans habit. Pieds à l’ancre x 24, y 36.',calques:[...ANATOMIE,CRANE,VISAGE_M,OREILLES]},
 'corps/feminin.piskel':{type:'corps',sexe:'feminin',description:'Gobeline, corps féminin : même silhouette que le masculin (les habits vont aux deux), son visage, un chignon avec deux tresses et des anneaux d’oreille.',calques:[...ANATOMIE,CRANE,VISAGE_F,CHEVEUX,OREILLES,BIJOUX]},
 'tenues/harnais.piskel':{type:'tenue',description:'La tenue de la référence : gilet de cuir ouvert, culotte de cuir, ceinture et bourse.',calques:tenue(HARNAIS,zoneHarnais,NOMS_HARNAIS)},
 'tenues/pagne.piskel':{type:'tenue',description:'Tenue la plus simple : pagne de cuir.',calques:tenue(PAGNE,()=>'pagne',NOMS_PAGNE)},
 'tenues/pagne-bandeau.piskel':{type:'tenue',description:'Pagne de cuir et bandeau de laine.',calques:tenue(BANDEAU,zoneBandeau,NOMS_BANDEAU)},
 'tenues/villageois.piskel':{type:'tenue',description:'Villageois : tunique de laine, manches courtes, braies, ceinture de corde, bourse, bandes de pied.',calques:tenue(VILLAGEOIS,zoneVillageois,NOMS_VILLAGEOIS)},
 'tenues/guerrier.piskel':{type:'tenue',description:'Guerrier : cotte de mailles rouillée, tassettes et spalière de fer noirci dentelées, brassards, bottes ferrées.',calques:[...tenue(GUERRIER,zoneGuerrier,NOMS_GUERRIER),SPALIERE]},
 'coiffes/capuche.piskel':{type:'coiffe',description:'Capuche de laine, fendue pour les oreilles. Le masque cache les cheveux dessous.',calques:[...coiffe(CAPUCHE,'COIFFE 21 - Capuche'),masque('MASQUE COIFFE - occulter les cheveux',0,16)]},
 'coiffes/casque-a-pointes.piskel':{type:'coiffe',description:'Casque de fer noirci à crête de pointes, avec nasal. Les tresses restent visibles dessous.',calques:[...coiffe(CASQUE,'COIFFE 21 - Casque a pointes'),masque('MASQUE COIFFE - occulter les cheveux',0,5)]},
 'armes/cimeterre-dentele.piskel':{type:'arme',description:'Cimeterre court à dos dentelé, dans la main droite. Le calque « derrière » passe sous le corps (vue gauche).',calques:[CIMETERRE_DERRIERE,CIMETERRE_DEVANT]}
};
module.exports={X0,Y0,W,H,SIZE,ANCHOR,VIEWS,COULEURS,PEAU,FICHIERS,NU,HARNAIS,grille};
