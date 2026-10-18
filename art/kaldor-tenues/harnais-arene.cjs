// Harnais de l'arène : torse nu barré de sangles cloutées, manica de bronze
// au bras droit, jupe de lanières, jambières de bronze et sandales.
module.exports={
 id:'harnais-arene',label:'Harnais de l’arène',warmth:0,
 description:'Sangles cloutées, manica de bronze et jambières de gladiateur. Taillé pour la foule de Sarak, pas pour le froid.',
 place:{site:'town-6',dx:-40,dy:34},
 palette:{N:'f8b07a',n:'c8743e',L:'6a4430',l:'3f2a22',Y:'f2c867',u:'c58e3a',U:'85582a',
  K:'b98a58',k:'7e5634',H:'d9b68a',h:'a07c58'},
 arms:{sleeve:['f8b07a','c8743e'],hand:['d9b68a','a07c58']},cloth:['9b6a3e','6c4429','3f2a22'],
 swap:{N:'n',n:'N',Y:'U',U:'Y',K:'k',k:'K',H:'h',h:'H'},
 layers:[
  {name:'HABIT 10 - Sandales',
   face:`
49 ......#ul....lu#
50 .....#NlNn..NlNn#
51 .....############`,
   droite:`
49 .........#u
50 .........#NlNn#
51 .........######`},
  {name:'HABIT 11 - Jambieres de bronze',
   face:`
48 ........#NNnn#
49 .........#YU#
50 ..........##`,
   droite:`
48 ...........Nn#
49 ...........u#`},
  {name:'ANATOMIE 12 - Torse',
   face:`
45 .......#NNNnnn#
46 .......#NNNnnn#
47 .......#NNNnnn#`,
   droite:`
45 .........#NNnn#
46 .........#NNnn#
47 .........#NNnn#`},
  {name:'HABIT 16 - Sangles cloutees',
   face:`
45 ........Ll
46 ..........LY`,
   dos:`
45 ............lL
46 ..........lL`,
   droite:`
45 ............L
46 .............l`},
  {name:'HABIT 14 - Jupe de lanieres',
   face:`
48 .......#K.K.Kk#`,
   droite:`
48 .........#K.Kk#`},
  {name:'HABIT 15 - Ceinture cloutee',
   face:`
47 .......#YuYuuU#`,
   droite:`
47 .........#YuuU#`},
  {name:'ANATOMIE 13 - Bras nus',
   face:`
44 .....##........##
45 ....#NN#......#nn#`,
   droite:`
45 ........#NN#
46 ........#Nn#`},
  {name:'HABIT 17 - Mains bandees',
   face:`
46 ....#Hh#......#Hh#
47 .....##........##`,
   droite:`
47 ........#Hh#
48 .........##`},
  {name:'HABIT 13 - Manica de bronze au bras droit',
   face:`
44 ....#Yu#
45 ....#uU#`,
   dos:`
44 ..............#uY#
45 ..............#Uu#`,
   droite:`
45 ........#Yu#
46 ........#uU#`,
   gauche:''},
  {name:'06 Cou',
   face:`
44 ..........nn`,
   droite:`
44 ..........nn`}
 ]
};
