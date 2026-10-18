// Robe du Serpent : longue robe de soie violet nuit bordée d'or, ceinture
// d'écailles d'émeraude, large collier d'or sur les épaules, bras nus aux
// brassards d'or, sandales.
module.exports={
 id:'robe-serpent',label:'Robe du Serpent',warmth:0,
 description:'Soie violet nuit, collier d’or et ceinture d’écailles de serpent. On la dit tissée dans les temples du Serpent.',
 place:{site:'town-34',dx:-40,dy:34},
 palette:{K:'4a3560',k:'30223f',j:'1a1224',G:'ecc560',g:'a7812f',E:'48a077',e:'27664c',
  N:'f8b07a',n:'c8743e',s:'6a4430'},
 arms:{sleeve:['f8b07a','c8743e'],hand:['f8b07a','c8743e']},cloth:['4a3560','30223f','1a1224'],
 swap:{K:'j',j:'K',G:'g',g:'G',E:'e',e:'E',N:'n',n:'N'},
 layers:[
  {name:'HABIT 10 - Sandales',
   face:`
50 .....#NsNn..NsNn#
51 .....############`,
   droite:`
50 .........#NsNn#
51 .........######`},
  {name:'HABIT 12 - Robe de soie',
   face:`
45 .......#KKkkkj#
46 .......#KKGkkj#
47 .......#KKGkkj#`,
   dos:`
45 .......#KKkkkj#
46 .......#KKkkkj#
47 .......#KKkkkj#`,
   droite:`
45 .........#Kkkj#
46 .........#Kkkj#
47 .........#Kkkj#`},
  {name:'HABIT 14 - Pans de la robe',
   face:`
48 ......#KKkGkkjj#
49 .....#KkKkGkkkjj#
50 ......#gGgGgGgg#`,
   dos:`
48 ......#KKkkkkjj#
49 .....#KkKkkkkkjj#
50 ......#gGgGgGgg#`,
   droite:`
48 .........#KkkG#
49 ........#KkKkjG#
50 .........#gGgg#`},
  {name:'HABIT 15 - Ceinture d ecailles',
   face:`
47 .......#EeGEee#
48 ..........Ee`,
   dos:`
47 .......#EeEeee#`,
   droite:`
47 ............Ee#
48 .............e`},
  {name:'ANATOMIE 13 - Bras nus aux brassards',
   face:`
44 .....##........##
45 ....#GN#......#nG#`,
   droite:`
45 ........#GN#
46 ........#Nn#`},
  {name:'HABIT 17 - Mains nues',
   face:`
46 ....#Nn#......#Nn#
47 .....##........##`,
   droite:`
47 ........#Nn#
48 .........##`},
  {name:'06 Cou',
   face:`
44 ..........nn`,
   droite:`
44 ..........nn`},
  {name:'HABIT 18 - Collier d or',
   face:`
44 .......GgEGGEgG
45 ........gGggGg`,
   dos:`
44 .......GgGGGGgG`,
   droite:`
44 .........GgEGg
45 ...........gG`}
 ]
};
