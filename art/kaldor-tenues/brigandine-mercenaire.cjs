// Brigandine du mercenaire : drap de garance riveté de laiton, spalières
// d'acier, manches matelassées, gants et bottes de cuir, chausses grises.
module.exports={
 id:'brigandine-mercenaire',label:'Brigandine du mercenaire',warmth:1,
 description:'Plaques rivetées sous drap de garance, spalières d’acier. Coupe le vent, sans retenir la chaleur.',
 place:{site:'camp',dx:44,dy:-12},
 palette:{R:'b0473a',r:'7d2c26',k:'4f1b1b',S:'dfe3e3',s:'9ea7ad',t:'5f666e',y:'ecc55a',L:'8c5b3b',l:'5b3a29',
  H:'a87048',h:'6e4630',G:'67626c',g:'423e49',B:'6e4b37',b:'3f2c24',n:'c8743e'},
 arms:{sleeve:['b0473a','7d2c26'],hand:['a87048','6e4630']},cloth:['b0473a','7d2c26','4f1b1b'],
 swap:{R:'k',k:'R',S:'t',t:'S',L:'l',l:'L',H:'h',h:'H',G:'g',g:'G',B:'b',b:'B'},
 layers:[
  {name:'HABIT 10 - Bottes de cuir',
   face:`
49 ......#BB....Bb#
50 .....#BBBb..BBbb#
51 .....############`,
   droite:`
49 .........#B
50 .........#BBbb#
51 .........######`},
  {name:'HABIT 11 - Chausses grises',
   face:`
48 ........#GGgg#
49 .........#Bb#
50 ..........##`,
   droite:`
48 ...........Gg#
49 ...........B#`},
  {name:'HABIT 12 - Gambeson de garance',
   face:`
45 .......#RRrrrk#
46 .......#RRrrrk#
47 .......#RRrrrk#
48 .......#Rrr#rk#`,
   droite:`
45 .........#Rrrk#
46 .........#Rrrk#
47 .........#Rrrk#
48 .........#rrkk#`},
  {name:'HABIT 16 - Rivets de laiton',
   face:`
45 .........y..y
46 ..........y..y`,
   dos:`
45 .........y..y`,
   droite:`
45 ............y
46 .............y`},
  {name:'HABIT 15 - Ceinturon',
   face:`
47 .......#llyLll#`,
   dos:`
47 .......#llllll#`,
   droite:`
47 ............Ly#`},
  {name:'HABIT 13 - Manches matelassees',
   face:`
44 .....##........##
45 ....#Rr#......#rk#`,
   droite:`
45 ........#Rr#
46 ........#Rr#`},
  {name:'HABIT 17 - Gants de cuir',
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
  {name:'HABIT 18 - Spalieres d acier',
   face:`
44 ...#SSs#......#sSt#`,
   droite:`
44 ........#SSst#`}
 ]
};
