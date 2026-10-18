// Voiles du nomade : longue robe de lin écru, écharpe safran jetée sur
// l'épaule, ceinture d'indigo, manches amples, sandales lacées.
module.exports={
 id:'voiles-nomade',label:'Voiles du nomade',warmth:0,
 description:'Lin écru, écharpe de safran et ceinture d’indigo. Frais sous le soleil des dunes, inutile face au gel.',
 place:{site:'town-7',dx:40,dy:34},
 palette:{W:'f4e9c8',w:'d8c59c',v:'a9926b',Y:'f0b445',y:'cf842a',z:'8f521c',I:'5466b4',i:'313d80',
  N:'f8b07a',n:'c8743e',s:'7a5038'},
 arms:{sleeve:['f4e9c8','d8c59c'],hand:['f8b07a','c8743e']},cloth:['f4e9c8','d8c59c','a9926b'],
 swap:{W:'v',v:'W',Y:'z',z:'Y',I:'i',i:'I',N:'n',n:'N'},
 layers:[
  {name:'HABIT 10 - Sandales',
   face:`
50 .....#NsNn..NsNn#
51 .....############`,
   droite:`
50 .........#NsNn#
51 .........######`},
  {name:'HABIT 12 - Robe de lin',
   face:`
45 .......#WWwwwv#
46 .......#WWwwwv#
47 .......#WWwwwv#`,
   droite:`
45 .........#Wwwv#
46 .........#Wwwv#
47 .........#Wwwv#`},
  {name:'HABIT 14 - Pans de la robe',
   face:`
48 ......#WWwwwwvv#
49 .....#WwWwwvwwvv#
50 ......##########`,
   droite:`
48 .........#Wwwv#
49 ........#WwWwvv#
50 .........######`},
  {name:'HABIT 15 - Ceinture d indigo',
   face:`
47 .......#IIiIii#
48 ...........Ii`,
   dos:`
47 .......#IIiiii#`,
   droite:`
47 ............Ii#
48 .............i`},
  {name:'HABIT 13 - Manches amples',
   face:`
44 .....##........##
45 ...#WWw#......#wwv#`,
   droite:`
45 ........#Ww#
46 .......#Wwwv#`},
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
  {name:'HABIT 18 - Echarpe de safran',
   face:`
44 ......#YYyYyyz#
45 .............yz#
46 .............yz#
47 ..............z#`,
   dos:`
44 ......#YyyyYyz#
45 .......#yz`,
   droite:`
44 .........#YYyz#
45 ...........yz#`}
 ]
};
