// Casque à cornes : calotte de fer ronde, bandeau de cuir clouté de laiton,
// deux cornes d'aurochs recourbées vers le ciel. Ouvert.
const mask=require('./masque.cjs');
module.exports={
 id:'casque-cornes',label:'Casque à cornes',warmth:0,closed:false,
 description:'Fer rond, cuir clouté et deux cornes d’aurochs. Il ne protège pas mieux qu’un autre, mais on le voit venir de loin.',
 place:{site:'town-69',dx:40,dy:34},
 palette:{H:'e1e6df',I:'a3abad',i:'6c7579',k:'444b50',L:'7a5236',l:'4f3424',r:'e3c06e',C:'f3ead2',c:'cdb994',n:'927d5a',M:'ffffff'},
 layers:[
  {name:'COIFFE 21 - Calotte et cornes',
   face:`
28 .#..................#.
29 #c#................#c#
30 #C#................#C#
31 #Cn#.....####.....#nC#
32 #Cn#...##HIIi##...#nC#
33 .#Cc#.#IHIIIiik#.#cC#.
34 ..#Cc#IHIIIIiiik#cC#..
35 ...#CcIIIIIIiikkcC#...
36 ...##LrLLLrLLLrLl##...
37 ....#llllllllllll#....`,
   droite:`
27 ...............#
28 ..............#c#
29 .............#Cn#
30 ............#Cn#
31 .........###Cc#
32 .......##H#Cc##
33 ......#IHI#Cn#k#
34 .....#IHIII##iik#
35 .....#IIIIIIiikk#
36 ....#LrLLLrLLLrLl#
37 ....#llllllllllll#`},
  {name:'MASQUE COIFFE - occulter les cheveux',
   face:mask([25,36,29,52],[37,37,33,46]),
   droite:mask([25,36,29,52],[37,37,33,46])}
 ]
};
