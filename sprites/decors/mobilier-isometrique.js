/* Authored furniture, same native scale, projection and rasteriser as buildings.
 * One fixed world view. No actor pixels, item stock or production is embedded. */
(function(r,f){const a=f(typeof module==='object'&&module.exports?require('../architecture/architecture-isometric'):r.HearthreaverIsometric,typeof module==='object'&&module.exports?require('../architecture/clairfoyer-district-catalogue'):r.ClairfoyerDistrictCatalogue);if(typeof module==='object'&&module.exports)module.exports=a;else r.HearthreaverIsometricFurniture=a;})(globalThis,function(Base,Districts){
'use strict';
// id, ground width/depth, height, working height, operator arrangement,
// defining fixed parts. Dimensions are native units, never PNG zoom factors.
const rows=[
 ['workbench',26,12,10,9,'left','plateau, quatre pieds, entretoise, mors fixe'],
 ['chopping_block',10,10,8,7,'left','souche, écorce, cerne et entailles'],
 ['sawhorse',30,12,10,8,'left','deux tréteaux, traverses et berceau de sciage'],
 ['anvil',12,10,12,10,'left','souche, pied, bigorne, table et trou carré'],
 ['forge',26,18,26,9,'front','foyer, hotte, cheminée, soufflet et levier fixe'],
 ['smelter',18,18,27,8,'front','cuve maçonnée, bouche, tuyère et coulée'],
 ['quench_trough',22,10,7,5,'left','auge creuse, cerclages et eau de trempe'],
 ['potters_wheel',14,14,9,8,'seat-left','plateau tournant, arbre, volant, pédale et siège'],
 ['pottery_kiln',20,18,24,8,'front','chambre, sole, bouche, évent et rebord'],
 ['glass_bench',28,12,10,8,'seat-left','banc, appuis de canne et siège de verrier'],
 ['glass_furnace',20,18,25,10,'furnace','bouche de travail, sole, cheminée et parement'],
 ['loom',24,10,24,10,'front','montants, ensouples, fils, peigne et pédales'],
 ['fiber_rack',20,10,19,10,'left','montants, fuseaux fixes et traverses'],
 ['hide_frame',22,8,23,12,'left','cadre, liens périphériques et surface tendue'],
 ['dye_vat',14,14,11,9,'left','cuve ouverte, douves, cerclages et bain'],
 ['rope_bench',32,10,11,9,'left','banc long, peignes, crochets et axe de torsion'],
 ['well',18,18,30,10,'left','margelle ouverte, treuil, corde, manivelle et couverture'],
 ['grain_mill',18,16,19,10,'left','meules, axe, trémie et bec de sortie'],
 ['oil_press',18,16,25,9,'front','bâti, vis, presse, bac et évacuation'],
 ['kitchen_table',26,12,10,8,'left','plateau de travail, planche fixe et barre basse'],
 ['cooking_hearth',18,16,17,7,'left','pierres, braises, trépied et marmite fixe'],
 ['bread_oven',22,20,24,8,'front','socle, voûte, bouche et conduit'],
 ['apothecary_table',24,12,11,8,'left','table, mortier fixe, tablette et rangement vide'],
 ['care_bed',32,14,10,4,'care','cadre, quatre pieds, matelas, oreiller et chevet'],
 ['sleeping_mat',28,12,3,2,'bed','natte, bord cousu, couverture et oreiller'],
 ['sitting_bench',24,7,6,5,'seat','assise, pieds, entretoise et dosseret bas'],
 ['meal_table',22,14,10,8,'seat-left','table, entretoises et deux tabourets'],
 ['market_stall',28,18,29,9,'left','quatre poteaux, auvent, comptoir et tablette vide'],
 ['clerks_desk',22,12,13,11,'seat-left','pupitre incliné, rebord, tablette et tabouret'],
 ['beehive',12,12,17,8,'left','corps tressé, couverture, planche et entrée'],
 ['stable_stall',32,26,25,8,'left','poteaux, cloison, râtelier vide et passage ouvert'],
 ['feeding_trough',24,12,7,5,'left','deux compartiments, séparateur et abreuvoir'],
 ['care_stall',30,24,20,8,'left','barres de maintien, portillon et ouverture latérale'],
 ['enclosure_gate',32,8,20,9,'front','poteaux, lisses, portillon, gond et verrou'],
 ['clothesline',30,14,23,12,'left','deux portiques, corde et tendeurs, sans linge'],
 ['drying_rack',26,14,18,10,'left','chevalets, trois niveaux et claire-voie vide'],
 ['sluice',22,16,22,8,'left','montants, vanne, vis et manivelle, sans rivière'],
 ['charcoal_clamp',26,24,15,7,'left','meule couverte, évents et ouverture de chargement'],
 ['quarry_block',24,18,14,10,'left','bloc, lignes de taille, coins et cales'],
 ['fixed_screen',22,14,18,10,'left','bâti, tamis incliné, maillage et sortie'],
 ['salt_basin',30,22,4,2,'left','bassin, levées basses, chenal et rives'],
 ['wall_scaffold',28,14,25,9,'front','maçonnerie, échafaudage bas, planches et échelle'],
 ['dock_bollard',28,20,10,5,'left','platelage, pilotis, borne et anneau fixe'],
 ['bank_platform',28,24,6,3,'left','platelage, marche et rive ouverte sans eau intégrée']
];
const definitions=rows.map(([id,width,depth,height,contactHeight,arrangement,details])=>({id,width,depth,height,contactHeight,arrangement,details:details.split(', '),family:'teremor',kind:'furniture',season:'base',views:['fixed']}));
function author(d,P){
 const {box,beam,face,panelY,panelX,roof,meta}=P,W=d.width,D=d.depth,H=d.height,id=d.id;
 const B=(x,y,z,w,l,h,mat='wood',style='plank')=>box(x,y,z,w,l,h,mat,style,'detail');
 const rod=(x,y,z,w,l,h,mat='wood')=>beam(x,y,z,w,l,h,mat);
 const slab=(x,y,z,w,l,mat='wood',h=1)=>B(x,y,z,w,l,h,mat);
 const cylinder=(x,y,z,rx,ry,h,mat='wood',style='plain',sides=12)=>{const ring=Array.from({length:sides},(_,i)=>[x+Math.cos(i/sides*Math.PI*2)*rx,y+Math.sin(i/sides*Math.PI*2)*ry]);for(let i=0;i<sides;i++){const a=ring[i],b=ring[(i+1)%sides];face([[...a,z],[...b,z],[...b,z+h],[...a,z+h]],mat,'detail',style);}face(ring.map(a=>[...a,z+h]),mat,'detail',style);};
 const legs=(x,y,w,l,z)=>{for(const xx of [x+1,x+w-3])for(const yy of [y+1,y+l-3])rod(xx,yy,0,2,2,z);rod(x+2,y+l/2,2,w-4,1,1);};
 const table=(z=d.contactHeight,w=W,l=D)=>{legs(0,0,w,l,z-1);slab(0,0,z-1,w,l,'wood',1);};
 const stool=(x,y)=>{legs(x,y,7,7,4);slab(x,y,4,7,7);};
 const basin=(x,y,z,w,l,h,mat='wood',wet=true)=>{slab(x+1,y+1,z,w-2,l-2,mat);B(x,y,z,2,l,h,mat);B(x+w-2,y,z,2,l,h,mat);B(x+2,y,z,w-4,2,h,mat);B(x+2,y+l-2,z,w-4,2,h,mat);if(wet)slab(x+2,y+2,z+h-2,w-4,l-4,'water');};
 const posts=(w=W,l=D,h=H)=>{for(const x of [0,w-2])for(const y of [0,l-2])rod(x,y,0,2,2,h);};
 const opening=(x,y,z,w,h)=>panelY(x,y,z,w,h,'ink','plain');
 const furnace=(mat='stone')=>{B(0,0,0,W,D,5,mat,'masonry');B(1,1,5,W-2,D-2,11,mat,'masonry');B(3,2,16,W-6,D-4,5,mat,'masonry');B(6,5,21,W-12,D-10,H-21,mat,'masonry');opening(W/2-4,D+.15,5,8,8);panelY(W/2-3,D+.3,5,6,2,'fire','fire');rod(W/2-5,D-1,4,10,3,1,'stone');};
 if(['workbench','kitchen_table','apothecary_table','glass_bench','meal_table','clerks_desk'].includes(id)){
  table(id==='clerks_desk'?8:d.contactHeight);
  if(id==='workbench'){B(W-6,2,9,5,4,2);rod(W-7,3,9,1,3,3,'iron');rod(W-6,3,10,7,1,1,'iron');}
  if(id==='kitchen_table')slab(3,3,8,11,6,'log');
  if(id==='apothecary_table'){cylinder(W-5,5,8,3,3,2,'stone');cylinder(W-5,5,10,2,2,.2,'ink');slab(4,2,3,W-8,D-4);}
  if(id==='glass_bench')for(const x of [4,W-5])rod(x,1,8,1,D-2,2,'iron');
  if(id==='clerks_desk'){face([[0,0,12],[W,0,12],[W,D,9],[0,D,9]],'wood','detail','plank');rod(0,D-1,9,W,1,1);slab(3,2,3,W-6,D-4);}
  if(['glass_bench','meal_table','clerks_desk'].includes(id))stool(-8,D/2-3);
  if(id==='meal_table')stool(W+2,D/2-3);
 }else if(id==='chopping_block'){
  cylinder(W/2,D/2,0,5,5,7,'log','barrel');cylinder(5,5,7,4,4,.3,'wood');slab(4,2,7.5,1,5,'ink',.2);slab(1,5,7.5,3,1,'wood',.2);
 }else if(id==='sawhorse'){
  for(const x of [3,W-7]){for(const y of [1,D-3])rod(x,y,0,2,2,7);rod(x-1,0,7,6,D,1);rod(x,1,3,2,D-2,1);}rod(2,D/2-1,4,W-4,2,1);rod(0,D/2-2,8,W,4,1);
 }else if(id==='anvil'){
  cylinder(6,5,0,5,4,6,'log','barrel');B(2,2,6,8,6,1,'iron','plain');B(4,3,7,4,4,2,'iron','plain');B(1,2,9,10,6,2,'iron','plain');face([[0,3,9],[-4,4,10],[0,5,11],[2,5,11],[2,3,11]],'iron','detail');slab(8,3,11.1,1,1,'ink',.1);
 }else if(id==='forge'){
  B(0,0,0,17,16,8,'stone','masonry');basin(1,1,8,15,14,3,'stone',false);slab(4,5,9,8,6,'fire');for(const x of [0,14])rod(x,1,11,2,2,9,'stone');B(1,0,19,15,7,3,'stone','masonry');B(5,1,22,7,6,4,'stone','masonry');B(17,4,3,8,10,4,'log','sail');slab(17,4,7,8,10);rod(20,3,7,2,12,1);rod(16,7,6,3,2,1,'iron');
 }else if(['smelter','pottery_kiln','glass_furnace','bread_oven'].includes(id)){
  furnace(id==='pottery_kiln'||id==='bread_oven'?'tile':'stone');if(id==='smelter'){slab(6,D+1,0,5,5,'stone');rod(9,D,1,2,5,1,'iron');}if(id==='glass_furnace')rod(W-3,3,4,2,2,H-4,'stone');
 }else if(['quench_trough','feeding_trough'].includes(id)){
  basin(0,0,1,W,D,5,id==='feeding_trough'?'wood':'stone');for(const x of [4,W-5])rod(x,0,0,1,D,2,'iron');if(id==='feeding_trough'){B(W/2-1,1,1,2,D-2,5);slab(W/2+2,2,5,W/2-4,D-4,'wood');}
 }else if(id==='potters_wheel'){
  legs(2,2,10,10,5);cylinder(7,7,2,6,6,1,'wood');rod(6,6,2,2,2,6,'iron');cylinder(7,7,7,6,6,1,'wood');rod(-3,5,1,8,2,1);stool(-8,D/2-3);
 }else if(id==='loom'){
  for(const x of [1,W-3]){rod(x,1,0,2,D-2,1);rod(x,3,0,2,2,H);}for(const z of [5,H-2])rod(1,3,z,W-2,3,2);for(let x=5;x<W-4;x+=2)rod(x,4,7,1,1,H-9,'cloth');rod(3,5,10,W-6,1,2);for(const x of [7,13])rod(x,5,1,2,D-4,1);rod(1,3,16,W-2,1,1,'iron');
 }else if(id==='fiber_rack'||id==='drying_rack'){
  posts();for(const z of id==='fiber_rack'?[7,14,18]:[4,10,16]){rod(0,0,z,W,2,1);rod(0,D-2,z,W,2,1);if(id==='drying_rack')for(let x=4;x<W-2;x+=4)rod(x,1,z,1,D-2,1);}if(id==='fiber_rack')for(let x=4;x<W-1;x+=5)rod(x,1,8,1,3,7,'cloth');
 }else if(id==='hide_frame'){
  for(const x of [0,W-2]){rod(x,1,0,2,2,H);rod(x,0,0,2,D,1);}for(const z of [4,H-2])rod(0,1,z,W,2,2);panelY(4,2.3,7,W-8,H-12,'cloth','sail');for(let x=3;x<W-1;x+=4)rod(x,2,5,1,1,3,'log');for(let z=8;z<H-3;z+=4){rod(2,2,z,3,1,1,'log');rod(W-5,2,z,3,1,1,'log');}
 }else if(id==='dye_vat'){
  basin(0,0,0,W,D,10,'wood');for(const z of [2,7]){rod(0,0,z,W,1,1,'iron');rod(0,D-1,z,W,1,1,'iron');rod(0,0,z,1,D,1,'iron');rod(W-1,0,z,1,D,1,'iron');}
 }else if(id==='rope_bench'){
  table(8);for(const x of [1,W-3]){rod(x,1,8,2,D-2,3);for(let y=3;y<D-1;y+=3)rod(x-1,y,10,4,1,1,'iron');}rod(2,4,10,W-4,1,1,'log');rod(2,7,10,W-4,1,1,'log');
 }else if(id==='well'){
  basin(0,0,0,W,D,8,'stone',false);slab(3,3,2,W-6,D-6,'ink');for(const x of [1,W-3])rod(x,7,0,2,3,25);rod(2,8,20,W-4,2,2);cylinder(9,9,18,3,3,4,'wood');rod(9,9,5,1,1,15,'log');rod(-2,8,19,5,1,1,'iron');rod(-2,8,16,1,1,4,'iron');roof(-1,-1,W+2,D+2,25,29,'wood');
 }else if(id==='grain_mill'){
  B(1,1,0,W-2,D-2,5,'stone','masonry');cylinder(9,8,5,7,6,3,'stone');cylinder(9,8,8,7,6,2,'stone');rod(8,7,8,2,2,7,'iron');B(5,4,15,8,8,2);B(6,5,17,6,6,1,'ink','plain');rod(1,8,9,9,1,1);rod(1,8,9,1,1,4);B(W-2,6,4,4,3,2);
 }else if(id==='oil_press'){
  basin(0,0,0,W,D,3,'stone',false);for(const x of [1,W-3])rod(x,5,0,2,3,23);rod(1,5,22,W-2,3,2);rod(8,6,8,2,2,15,'iron');for(let z=10;z<22;z+=3)rod(7,5,z,4,4,1,'iron');slab(4,3,7,10,10,'wood',2);rod(3,6,17,12,1,1);rod(6,D,1,3,3,1,'stone');
 }else if(id==='cooking_hearth'){
  basin(0,0,0,W,D,3,'stone',false);slab(4,4,2,10,8,'fire');for(const x of [3,14])rod(x,6,3,1,2,8,'iron');rod(3,6,11,12,1,1,'iron');cylinder(9,8,5,5,4,5,'iron');cylinder(9,8,10,4,3,.2,'ink');rod(8,8,10,2,1,4,'iron');
 }else if(id==='care_bed'||id==='sleeping_mat'){
  if(id==='care_bed'){legs(0,0,W,D,3);slab(0,0,3,W,D);for(const x of [0,W-2])rod(x,0,0,2,D,8);for(const y of [1,D-2])rod(0,y,0,2,2,10);}
  const z=id==='care_bed'?4:0;slab(2,1,z,W-4,D-2,id==='care_bed'?'cloth':'straw',1);slab(W*.36,1,z+1,W*.55,D-2,'cloth',1);slab(3,3,z+1,5,D-6,'cloth',1);for(let x=8;x<W-3;x+=5)rod(x,D-2,z+2,1,1,.3,'log');
 }else if(id==='sitting_bench'){
  legs(0,0,W,D,4);slab(0,0,4,W,D);for(const x of [1,W-3])rod(x,0,4,2,1,2);rod(0,0,6,W,1,1);
 }else if(id==='market_stall'){
  posts(W,D,25);for(const x of [2,W-5])for(const y of [5,D-5])rod(x,y,0,2,2,8);slab(1,5,8,W-2,D-6);slab(2,6,3,W-4,D-8);roof(-1,-1,W+2,D+2,25,28,'cloth');
 }else if(id==='beehive'){
  slab(-1,-1,0,W+2,D+2,'wood',2);cylinder(6,6,2,5,5,9,'straw','sail');cylinder(6,6,11,4,4,3,'straw','sail');cylinder(6,6,14,2,2,2,'straw');opening(4,D-.9,2,3,2);slab(3,D-1,1,6,4);
 }else if(id==='stable_stall'||id==='care_stall'){
  posts();rod(0,0,H-2,W,2,2);rod(0,0,9,W,2,2);for(const x of [0,W-2])for(const z of [5,12,H-3])rod(x,0,z,2,D-2,1);if(id==='stable_stall'){B(4,1,0,W-8,6,5);for(let x=6;x<W-3;x+=3)rod(x,1,5,1,4,6);}else{rod(0,D-2,9,9,2,1);rod(W-10,D-2,9,10,2,1);}
 }else if(id==='enclosure_gate'){
  for(const x of [0,10,23,W-2])rod(x,2,0,2,2,H);for(const z of [6,14]){rod(0,2,z,11,1,2);rod(24,2,z,W-24,1,2);}for(const z of [5,15])rod(12,2,z,11,1,2);rod(12,2,5,1,1,12);rod(21,2,5,1,1,12);rod(21,2,10,4,1,1,'iron');rod(11,2,6,2,1,2,'iron');
 }else if(id==='clothesline'){
  for(const x of [0,W-2]){rod(x,4,0,2,2,H);rod(x-1,1,H-2,4,D-2,1);}for(const y of [3,D-4])rod(1,y,H-3,W-2,1,.6,'log');
 }else if(id==='sluice'){
  for(const x of [0,W-3]){B(x,0,0,3,D,3,'stone','masonry');rod(x,5,2,3,3,H-2);}rod(0,5,H-3,W,3,2);B(3,6,1,W-6,2,9);rod(W/2,6,8,1,1,H-9,'iron');rod(W/2-4,5,H-1,9,2,1,'iron');
 }else if(id==='charcoal_clamp'){
  B(1,1,0,W-2,D-2,5,'log','masonry');B(3,3,5,W-6,D-6,4,'log','masonry');B(6,6,9,W-12,D-12,4,'log','masonry');B(10,8,13,6,8,1,'ink','plain');opening(4,D-.8,1,5,4);for(const x of [4,19])opening(x,D-1,7,2,2);
 }else if(id==='quarry_block'){
  B(0,0,0,W,D,10,'stone','masonry');B(2,1,10,W-6,D-3,3,'stone','masonry');for(let x=5;x<W-3;x+=5)rod(x,4,13,1,2,1,'iron');slab(3,8,13,12,1,'ink',.2);
 }else if(id==='fixed_screen'){
  legs(0,0,W,D,9);face([[1,1,17],[W-1,1,17],[W-1,D-1,9],[1,D-1,9]],'iron','detail');for(let x=2;x<W-1;x+=3)face([[x,1,17.1],[x+1,1,17.1],[x+1,D-1,9.1],[x,D-1,9.1]],'ink','detail');for(let y=2;y<D;y+=3)rod(1,y,17-(y-1)*8/(D-2),W-2,1,.4);rod(0,1,9,2,D-1,1);rod(W-2,1,9,2,D-1,1);
 }else if(id==='salt_basin'){
  basin(0,0,0,W,D,3,'stone');slab(3,3,2,7,D-6,'cloth',.2);rod(W-4,3,0,4,3,1,'stone');
 }else if(id==='wall_scaffold'){
  B(0,0,0,W,4,H-3,'stone','masonry');B(2,0,H-3,12,4,3,'stone','masonry');for(const x of [1,W-3])for(const y of [5,D-2])rod(x,y,0,2,2,9);slab(0,5,8,W,D-5);for(const z of [1,4,7])rod(W-6,D-2,z,5,1,1);rod(W-7,D-2,0,1,1,9);rod(W-1,D-2,0,1,1,9);
 }else if(id==='dock_bollard'||id==='bank_platform'){
  for(const x of [1,W-3])for(const y of [1,D-3])rod(x,y,0,2,2,3);slab(0,0,2,W,D);if(id==='dock_bollard'){rod(W-8,6,3,4,4,6);rod(W-10,5,7,8,6,1,'iron');}else slab(3,D,0,W-6,4,'wood',1);
 }else throw Error('Mobilier non dessiné : '+id);
 meta.fixedParts=d.details;meta.furniture=true;return true;
}
const entries=new Map(definitions.map(d=>[d.id,d])),libraries=new Map();
function library(district='metiers'){if(libraries.has(district))return libraries.get(district);const p=Districts.districtPalettes[district];if(!p)throw RangeError('Quartier inconnu : '+district);const lib=Base.createLibrary({scale:Base.scale,assets:definitions,ramps:p.ramps},author);libraries.set(district,lib);return lib;}
return Object.freeze({definitions,has:id=>entries.has(id),entry:id=>{const d=entries.get(id);if(!d)throw RangeError('Mobilier inconnu : '+id);return JSON.parse(JSON.stringify(d));},districts:Object.keys(Districts.districtPalettes),paletteFor:district=>library(district).palette,blueprint:(id,o={})=>library(o.district).blueprint(id,{...o,dir:'fixed'}),pixels:(id,o={})=>library(o.district).pixels(id,{...o,dir:'fixed'}),raster:(id,o={})=>library(o.district).raster(id,{...o,dir:'fixed'}),projection:Base.projection,project:Base.project,scale:Base.scale});
});
