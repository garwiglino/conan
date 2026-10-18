// Cotte de mailles et tabard : haubert d'anneaux d'acier aux manches
// longues, tabard sarcelle bordé d'or des Veilleurs, ceinturon, gants et
// chausses de mailles, bottes de cuir.
module.exports={
 id:'cotte-mailles',label:'Cotte de mailles',warmth:1,
 description:'Haubert d’anneaux d’acier sous le tabard sarcelle des Veilleurs. Lourd, mais rien ne le perce.',
 place:{site:'town-10',dx:40,dy:34},
 palette:{m:'b5bcbf',n:'7b8489',o:'4d5459',T:'2f7a72',t:'1d4f4b',y:'e0b04f',L:'8c5b3b',l:'5b3a29',
  H:'a87048',h:'6e4630',B:'6e4b37',b:'3f2c24'},
 arms:{sleeve:['b5bcbf','7b8489'],hand:['a87048','6e4630']},cloth:['b5bcbf','7b8489','4d5459'],
 swap:{m:'o',o:'m',T:'t',t:'T',L:'l',l:'L',H:'h',h:'H',B:'b',b:'B'},
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
  {name:'HABIT 11 - Chausses de mailles',
   face:`
48 ........#mnno#
49 .........#Bb#
50 ..........##`,
   droite:`
48 ...........mo#
49 ...........B#`},
  {name:'HABIT 12 - Haubert',
   face:`
45 .......#mnmnmo#
46 .......#nmnmno#
47 .......#mnmnmo#
48 .......#nmnmno#`,
   droite:`
45 .........#mnmo#
46 .........#nmno#
47 .........#mnmo#
48 .........#nmno#`},
  {name:'HABIT 14 - Tabard des Veilleurs',
   face:`
45 .........yTty
46 .........TyTt
47 .........TTtt
48 .........yTty`,
   dos:`
45 .........yTty
46 .........TTtt
47 .........TTtt
48 .........yTty`,
   droite:`
45 ............Ty
46 ............Tt
47 ............Tt
48 ............Ty`},
  {name:'HABIT 15 - Ceinturon',
   face:`
47 .......#llyLll#`,
   dos:`
47 .......#llllll#`,
   droite:`
47 ............Ly#`},
  {name:'HABIT 13 - Manches de mailles',
   face:`
44 .....##........##
45 ....#mn#......#no#`,
   droite:`
45 ........#mn#
46 ........#mn#`},
  {name:'HABIT 17 - Gants de cuir',
   face:`
46 ....#Hh#......#Hh#
47 .....##........##`,
   droite:`
47 ........#Hh#
48 .........##`},
  {name:'HABIT 19 - Col de mailles',
   face:`
44 .........#mnn#`,
   droite:`
44 ..........mn#`}
 ]
};
