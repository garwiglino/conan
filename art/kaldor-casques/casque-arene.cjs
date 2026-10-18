// Casque de l'arène : bronze martelé à la corinthienne, cimier de crin rouge,
// nasal et joues pleines, une fente pour la bouche. Fermé.
const mask=require('./masque.cjs');
module.exports={
 id:'casque-arene',label:'Casque de l’arène',warmth:0,closed:true,
 description:'Bronze corinthien et cimier de crin rouge. La foule de Sarak ne voit que le casque, jamais le visage.',
 place:{site:'town-6',dx:60,dy:-30},
 palette:{Y:'f6d27a',B:'d29a45',b:'a56b2c',u:'6e431c',R:'e45b3c',r:'ab3326',q:'6e1f1d',M:'ffffff'},
 layers:[
  {name:'COIFFE 21 - Casque et cimier',
   face:`
25 ..........##
26 .........#Rr#
27 .........#Rr#
28 .........#Rr#
29 .........#Rq#
30 .........#rq#
31 .........#Yb#
32 .......##YBBb##
33 ......#YBBBBbbu#
34 .....#YBBBBBbbbu#
35 .....#BBBBBBbbbu#
36 ....#BBBBBBBBbbbu#
37 ....#BBuuubbuuubu#
38 ....#BB...Yb...bu#
39 ....#BB...Yb...bu#
40 ....#BBuuuYbuuubu#
41 ....#BBBBu..ubbbu#
42 .....#BBBu..ubbu#
43 .....#Bbu#..#bbu#
44 ......####..####`,
   dos:`
25 ..........##
26 .........#Rr#
27 .........#Rr#
28 .........#Rr#
29 .........#Rq#
30 .........#rq#
31 .........#Yb#
32 .......##YBBb##
33 ......#YBBBBbbu#
34 .....#YBBBBBbbbu#
35 .....#BBBBBBbbbu#
36 ....#BBBBBBBBbbbu#
37 ....#BBBBBBBBbbbu#
38 ....#BBBBBBBBbbbu#
39 ....#BBBBBBBBbbbu#
40 ....#BBBBBBBBbbbu#
41 ...#BBBBBBBBBBbbbu#
42 ...#BBBBBBBBBBbbbu#
43 ...#uuuuuuuuuuuuuu#
44 ....##############`,
   droite:`
25 ........######
26 ......##RrRrRr##
27 .....#RrRrRrRrRq#
28 ....#RrRrRrRrRrqq#
29 .....##qqqqqqqq##
30 ..........#Yb#
31 .....##YBBBBBbb##
32 ....#YBBBBBBBbbbu#
33 ....#YBBBBBBBbbbu#
34 ....#BBBBBBBBbbbu#
35 ....#BBBBBBBBbbbu#
36 ....#BBBBBBBbbuuu#
37 ....#BBBBBBbu...u#
38 ....#BBBBBBbu...b#
39 ....#BBBBBBbbu.bu#
40 ....#BBBBBBBbbbu#
41 ...#BBBBBBBBbbu#
42 ...#BBBBBBBBbbu#
43 ..#uuuuuuuubbu#
44 ...##########`},
  {name:'MASQUE COIFFE - occulter les cheveux',
   face:mask([25,43,29,52]),
   droite:mask([25,43,29,52])}
 ]
};
