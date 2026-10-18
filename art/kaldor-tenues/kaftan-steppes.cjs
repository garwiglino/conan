// Kaftan des steppes : kaftan matelassé ocre croisé sur la poitrine, galons
// rouge et or, col et ourlet de martre, ceinture brodée, pantalon bouffant
// rentré dans des bottes souples.
module.exports={
 id:'kaftan-steppes',label:'Kaftan des steppes',warmth:2,
 description:'Kaftan ocre matelassé, col et ourlet de martre, galons rouge et or des cavaliers de l’Est. Chaud en selle comme au bivouac.',
 place:{site:'town-65',dx:-40,dy:34},
 palette:{K:'c7782f',k:'8f4f22',j:'5c3218',F:'6a5140',f:'45352b',e:'8c7158',Y:'ecc15a',R:'b83c30',r:'7d2a24',
  P:'77705e',p:'4f4a3f',B:'7a4a2e',b:'4e2f1e',N:'f8b07a',n:'c8743e'},
 arms:{sleeve:['c7782f','8f4f22'],hand:['7a4a2e','4e2f1e']},cloth:['c7782f','8f4f22','5c3218'],
 swap:{K:'j',j:'K',F:'f',f:'F',P:'p',p:'P',B:'b',b:'B',R:'r',r:'R'},
 layers:[
  {name:'HABIT 10 - Bottes souples',
   face:`
49 ......#BR....Rb#
50 .....#BBBb..BBbb#
51 .....############`,
   droite:`
49 .........#R
50 .........#BBbb#
51 .........######`},
  {name:'HABIT 11 - Pantalon bouffant',
   face:`
48 ........#PPpp#
49 .........#Bb#
50 ..........##`,
   droite:`
48 ...........Pp#
49 ...........B#`},
  {name:'HABIT 12 - Kaftan croise',
   face:`
45 .......#KYkkkj#
46 .......#KKYkkj#
47 .......#KKkYkj#`,
   dos:`
45 .......#KKkkkj#
46 .......#KKkkkj#
47 .......#KKkkkj#`,
   droite:`
45 .........#KkYj#
46 .........#KkkY#
47 .........#Kkkj#`},
  {name:'HABIT 14 - Pans du kaftan',
   face:`
48 ......#KKkkYkjj#
49 ......#eFfeFfFf#`,
   dos:`
48 ......#KKkkkkjj#
49 ......#eFfeFfFf#`,
   droite:`
48 .........#KkkY#
49 .........#eFfF#`},
  {name:'HABIT 15 - Ceinture brodee',
   face:`
47 .......#RYRrYr#`,
   dos:`
47 .......#RrRrRr#`,
   droite:`
47 ............Yr#`},
  {name:'HABIT 13 - Manches du kaftan',
   face:`
44 .....##........##
45 ....#Kk#......#kj#`,
   droite:`
45 ........#Kk#
46 ........#Kk#`},
  {name:'HABIT 17 - Gants de cuir',
   face:`
46 ....#Bb#......#Bb#
47 .....##........##`,
   droite:`
47 ........#Bb#
48 .........##`},
  {name:'06 Cou',
   face:`
44 ..........nn`,
   droite:`
44 ..........nn`},
  {name:'HABIT 18 - Col de martre',
   face:`
44 ......#eFFfFFfe#`,
   dos:`
44 ......#eFFfFFfe#`,
   droite:`
44 .........#eFfe#`}
 ]
};
