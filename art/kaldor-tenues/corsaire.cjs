// Tenue du corsaire : chemise de lin bouffante ouverte sur le torse, gilet
// bleu de mer à boutons d'or, écharpe rouge nouée, culotte rayée, hautes
// bottes noires à revers.
module.exports={
 id:'corsaire',label:'Tenue du corsaire',warmth:0,
 description:'Chemise de lin, gilet bleu de mer et écharpe rouge des Côtes Noires. Faite pour le sel et le soleil.',
 place:{site:'town-5',dx:40,dy:34},
 palette:{W:'f3ecdc',w:'cfc2a6',v:'93846b',R:'cc4034',r:'8c2823',I:'34588f',i:'213a66',y:'e6be55',
  B:'3a2a26',b:'221816',T:'b98a58',N:'f8b07a',n:'c8743e'},
 arms:{sleeve:['f3ecdc','cfc2a6'],hand:['f8b07a','c8743e']},cloth:['f3ecdc','cfc2a6','93846b'],
 swap:{W:'v',v:'W',R:'r',r:'R',I:'i',i:'I',B:'b',b:'B',N:'n',n:'N'},
 layers:[
  {name:'HABIT 10 - Bottes a revers',
   face:`
49 ......#BB....Bb#
50 .....#BBBb..BBbb#
51 .....############`,
   droite:`
49 .........#B
50 .........#BBbb#
51 .........######`},
  {name:'HABIT 11 - Culotte rayee',
   face:`
48 ........#IWiW#
49 .........#TT#
50 ..........##`,
   droite:`
48 ...........Wi#
49 ...........T#`},
  {name:'HABIT 12 - Chemise de lin',
   face:`
45 .......#WWNnwv#
46 .......#WWwNwv#
47 .......#WWwwwv#
48 .......#Wwwwvv#`,
   dos:`
45 .......#WWwwwv#
46 .......#WWwwwv#
47 .......#WWwwwv#
48 .......#Wwwwvv#`,
   droite:`
45 .........#WwNn#
46 .........#WwwN#
47 .........#Wwwv#
48 .........#wwvv#`},
  {name:'HABIT 16 - Gilet de mer',
   face:`
45 ........Iy..yi
46 ........Iy..yi`,
   dos:`
45 ........IIiiii
46 ........IIiiii`,
   droite:`
45 ..........Iiy
46 ..........Iiy`},
  {name:'HABIT 15 - Echarpe rouge',
   face:`
47 .......#RRrRrr#
48 ............Rr`,
   dos:`
47 .......#RRrrrr#`,
   droite:`
47 ..........RRr#
48 ..........Rr`},
  {name:'HABIT 13 - Manches bouffantes',
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
44 ..........nn`}
 ]
};
