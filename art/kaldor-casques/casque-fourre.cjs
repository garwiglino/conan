// Casque fourré : petite calotte de fer sur un épais bandeau de loup blanc,
// rabats de fourrure sur les oreilles. Ouvert, il tient la tête au chaud.
const mask=require('./masque.cjs');
module.exports={
 id:'casque-fourre',label:'Casque fourré',warmth:1,closed:false,
 description:'Calotte de fer sur un bandeau de loup blanc, rabats sur les oreilles. Le vent du col n’y entre pas.',
 place:{site:'town-63',dx:40,dy:34},
 palette:{H:'e1e6df',I:'a3abad',i:'6c7579',k:'444b50',W:'efe7d7',w:'c9bda7',v:'8f8473',M:'ffffff'},
 layers:[
  {name:'COIFFE 21 - Calotte et fourrure',
   face:`
30 .........####
31 .......##HIIi##
32 ......#IHIIIiik#
33 ......#IHIIIiik#
34 ...#WwWWWwWWWWwWvv#
35 ...#WWWwWWWWWwWWvv#
36 ...#wWWWWwWWWWWwvv#
37 ...#Wwv#......#wvv#
38 ...#Wwv#......#wvv#
39 ...#Wwv#......#wvv#
40 ...#wwv#......#wvv#
41 ....#wv#......#vv#
42 .....##........##`,
   droite:`
30 .........####
31 .......##HIIi##
32 ......#IHIIIiik#
33 ......#IHIIIiik#
34 ....#WwWWWwWWWWwv#
35 ....#WWWwWWWWWwvv#
36 ....#wWWWWwWWWWvv#
37 .......#Wwv#
38 .......#Wwv#
39 .......#wwv#
40 ........#vv#
41 .........##`},
  {name:'MASQUE COIFFE - occulter les cheveux',
   face:mask([25,36,29,52]),
   droite:mask([25,36,29,52])}
 ]
};
