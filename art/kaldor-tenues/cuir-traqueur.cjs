// Cuir du traqueur : tunique de laine bouillie couleur de mousse, justaucorps
// de cuir huilé lacé, mantelet frangé, brassards, hautes bottes à revers.
module.exports={
 id:'cuir-traqueur',label:'Cuir du traqueur',warmth:1,
 description:'Cuir huilé lacé sur laine bouillie couleur de mousse. Garde au sec dans la brume des saules.',
 place:{site:'town-75',dx:0,dy:44},
 palette:{M:'7d9a55',m:'56713c',o:'364a2a',J:'7a5236',j:'4f3424',t:'d9b77a',B:'5a4030',b:'33251e',
  P:'8b7458',p:'5e4e3c',H:'9a6a44',h:'664530',n:'c8743e'},
 arms:{sleeve:['7d9a55','56713c'],hand:['9a6a44','664530']},cloth:['7d9a55','56713c','364a2a'],
 swap:{M:'o',o:'M',J:'j',j:'J',B:'b',b:'B',P:'p',p:'P',H:'h',h:'H'},
 layers:[
  {name:'HABIT 10 - Hautes bottes',
   face:`
49 ......#BB....Bb#
50 .....#BBBb..BBbb#
51 .....############`,
   droite:`
49 .........#B
50 .........#BBbb#
51 .........######`},
  {name:'HABIT 11 - Chausses et revers',
   face:`
48 ........#PPpp#
49 .........#Bb#
50 ..........##`,
   droite:`
48 ...........Pp#
49 ...........B#`},
  {name:'HABIT 12 - Tunique de laine',
   face:`
45 .......#MMmmmo#
46 .......#MMmmmo#
47 .......#MMmmmo#
48 .......#Mmmmmo#`,
   droite:`
45 .........#Mmmo#
46 .........#Mmmo#
47 .........#Mmmo#
48 .........#mmmo#`},
  {name:'HABIT 16 - Justaucorps lace',
   face:`
45 ........JJt.jj
46 ........Jj.tjj
47 ........JJt.jj`,
   dos:`
45 ........JJjjjj
46 ........JJjjjj
47 ........JJjjjj`,
   droite:`
45 ...........Jjt
46 ...........Jjt
47 ...........Jjt`},
  {name:'HABIT 15 - Ceinture',
   face:`
48 .......#jjtjjj#`,
   dos:`
48 .......#jjjjjj#`,
   droite:`
48 ...........jjt#`},
  {name:'HABIT 13 - Manches de laine',
   face:`
44 .....##........##
45 ....#Mm#......#mo#`,
   droite:`
45 ........#Mm#
46 ........#Mm#`},
  {name:'HABIT 17 - Brassards et gants',
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
  {name:'HABIT 18 - Mantelet frange',
   face:`
44 ....#MmMmo#..#mMmMo#
45 .....#o#o#....#o#o#`,
   dos:`
44 ....#MmMmMmMmMmMmo#
45 .....#o#o#o#o#o#o#`,
   droite:`
44 ........#MmMmo#
45 .........#mMo#`}
 ]
};
