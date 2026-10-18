// Peau de l'ours : dépouille brune jetée sur les épaules, gilet de cuir
// bordé de fourrure, collier de griffes, bras nus aux poignets bandés,
// jambes enroulées de fourrure liée de lanières.
module.exports={
 id:'peau-ours',label:'Peau de l’ours',warmth:2,
 description:'Dépouille d’ours sur les épaules et jambes enroulées de fourrure. Chaude, mais le vent mord les bras nus.',
 place:{site:'town-72',dx:-40,dy:34},
 palette:{F:'a0754c',f:'74503a',e:'4b3328',T:'d3ab7a',C:'efe6d0',c:'b9ab90',J:'5a3d2d',j:'3c2a22',
  N:'f8b07a',n:'c8743e',H:'9c7a5c',h:'6a523f',r:'7a5a40'},
 arms:{sleeve:['f8b07a','c8743e'],hand:['9c7a5c','6a523f']},cloth:['a0754c','74503a','4b3328'],
 swap:{F:'e',e:'F',J:'j',j:'J',N:'n',n:'N',H:'h',h:'H',C:'c',c:'C'},
 layers:[
  {name:'HABIT 10 - Bottes de fourrure',
   face:`
49 ......#TF....Ff#
50 .....#FFfe..FFfe#
51 .....############`,
   droite:`
49 .........#T
50 .........#FFfe#
51 .........######`},
  {name:'HABIT 11 - Jambes enroulees',
   face:`
48 ........#FrFr#
49 .........#Tf#
50 ..........##`,
   droite:`
48 ...........rF#
49 ...........T#`},
  {name:'HABIT 12 - Gilet de cuir',
   face:`
45 .......#JNNnnj#
46 .......#JNNnnj#
47 .......#JJjjjj#
48 .......#Jjjj#j#`,
   dos:`
45 .......#JJjjjj#
46 .......#JJjjjj#
47 .......#JJjjjj#
48 .......#Jjjj#j#`,
   droite:`
45 .........#JjjN#
46 .........#JjjN#
47 .........#Jjjj#
48 .........#jjjj#`},
  {name:'HABIT 15 - Ceinture et boucle d os',
   face:`
47 .......#rrCrrr#`,
   dos:`
47 .......#rrrrrr#`,
   droite:`
47 ............rC#`},
  {name:'ANATOMIE 13 - Bras nus',
   face:`
44 .....##........##
45 ....#NN#......#nn#`,
   droite:`
45 ........#NN#
46 ........#Nn#`},
  {name:'HABIT 17 - Mains aux poignets bandes',
   face:`
46 ....#Hh#......#Hh#
47 .....##........##`,
   droite:`
47 ........#Hh#
48 .........##`},
  {name:'06 Cou',
   face:`
44 ..........nn`,
   droite:`
44 ..........nn`},
  {name:'HABIT 18 - Depouille d ours',
   face:`
44 ...#TFFfF#..#FfFFT#
45 ...#FfeT#....#TefF#
46 ....##.........##`,
   dos:`
44 ...#TFFfFFFFFFfFFT#
45 ...#FfeFfFFfFfFefF#
46 ....#ffefFfefFfef#
47 .....#efe#fef#efe#`,
   droite:`
44 ........#TFFfF#
45 .......#FfeTfe#
46 ........#efFe#`},
  {name:'HABIT 19 - Collier de griffes',
   face:`
45 .........CcC
46 ..........c`,
   droite:`
45 .............C`}
 ]
};
