// Pelisse du Grand Froid: long quilted woad-blue coat under a wolf-fur
// mantlet, fur hem, fur-topped boots, leather mittens, broad belt. No hood.
module.exports={
 id:'pelisse-grand-froid',label:'Pelisse du Grand Froid',warmth:3,
 description:'Laine de guède matelassée et mantelet de loup. Tient le gel à distance.',
 place:{site:'town-71',dx:40,dy:34},
 palette:{W:'ece3d2',w:'c8b9a0',v:'8f7f69',l:'55779a',m:'3b5878',n:'263a55',p:'7a5038',q:'4d3226',y:'e0b04f',Y:'9c6a2c',g:'4f4a55',h:'35313d',s:'c8743e'},
 arms:{sleeve:['55779a','3b5878'],hand:['7a5038','4d3226']},cloth:['55779a','3b5878','263a55'],
 swap:{l:'n',n:'l',p:'q',q:'p',g:'h',h:'g'},
 layers:[
  {name:'HABIT 10 - Bottes fourrees',
   face:`
49 ......#Ww....wv#
50 .....#pppp..qqqq#
51 .....############`,
   droite:`
49 .........#Wwv#
50 .........#ppqq#
51 .........######`},
  {name:'HABIT 11 - Chausses de laine',
   face:`
48 ........#gghh#
49 .........#gh#
50 ..........##`,
   droite:`
48 ...........gh#
49 ...........g#`},
  {name:'HABIT 12 - Pelisse matelassee',
   face:`
45 .......#llmnnn#
46 .......#llmnnn#
47 .......#llmnnn#
48 .......#llmnnn#`,
   dos:`
45 .......#llmmnn#
46 .......#llmmnn#
47 .......#llmmnn#
48 .......#llmmnn#`,
   droite:`
45 .........#lmmn#
46 .........#lmmn#
47 .........#lmmn#
48 .........#lmmn#`},
  {name:'HABIT 14 - Ourlet de loup',
   face:`
49 ......#WwWwwWwv#`,
   droite:`
49 ........#WwWwv#`},
  {name:'HABIT 15 - Ceinturon',
   face:`
47 .......#ppyYqq#`,
   dos:`
47 .......#pqqqqq#`,
   droite:`
47 ............qy#`},
  {name:'HABIT 13 - Manches rembourrees',
   face:`
44 .....##........##
45 ....#lm#......#mn#`,
   droite:`
45 ........#lm#
46 ........#lm#`},
  {name:'HABIT 17 - Gants moufles fourres',
   face:`
46 ....#pq#......#pq#
47 .....##........##`,
   droite:`
47 ........#pq#
48 .........##`},
  {name:'06 Cou',
   face:`
44 ..........ss`,
   droite:`
44 ..........ss`},
  {name:'HABIT 18 - Mantelet de loup',
   face:`
44 ...#wWWwwwWwwwwWWw#
45 ...#vwvwwvwvwvwwvw#`,
   dos:`
44 ...#wWWwwwwwwwwWWw#
45 ...#vwvwvwvwvwvwvw#`,
   droite:`
44 ........wWWwwv#
45 ........vwvwvw#`}
 ]
};
