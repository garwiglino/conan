// Heaume fermé : seau d'acier à sommet plat, croix de laiton, fente de vue
// et trous d'aération. Toute la tête est couverte ; la crinière sort dessous.
const mask=require('./masque.cjs');
module.exports={
 id:'heaume-ferme',label:'Heaume fermé',warmth:1,closed:true,
 description:'Acier épais, croix de laiton et simple fente de vue. Rien ne passe, ni la lame ni le vent.',
 place:{site:'town-68',dx:-40,dy:34},
 palette:{H:'eef2ea',S:'b9c3c4',s:'838e93',t:'545d63',k:'1f1b22',G:'e3c06e',g:'9a7a3a',M:'ffffff'},
 layers:[
  {name:'COIFFE 21 - Heaume',
   face:`
31 .....############
32 ....#SHSSSGgsssst#
33 ....#SHSSSGgsssst#
34 ....#SHSSSGgsssst#
35 ....#SHSSSGgsssst#
36 ....#SHSSSGgsssst#
37 ....#GGGGGGgggggg#
38 ....#SkkkkGgkkkkt#
39 ....#SHSSSGgsssst#
40 ....#SHSSSGgsssst#
41 ....#SHSSSGgskskt#
42 ....#SHSSSGgskskt#
43 ....#SSSSSGgsssst#
44 ....##############`,
   dos:`
31 .....############
32 ....#SHSSSGgsssst#
33 ....#SHSSSGgsssst#
34 ....#SHSSSGgsssst#
35 ....#SHSSSGgsssst#
36 ....#SHSSSGgsssst#
37 ....#GGGGGGgggggg#
38 ....#SHSSSGgsssst#
39 ....#SHSSSGgsssst#
40 ....#SHSSSGgsssst#
41 ....#SHSSSGgsssst#
42 ....#SHSSSGgsssst#
43 ....#SSSSSGgsssst#
44 ....##############`,
   droite:`
31 .....############
32 ....#SHSSSSSsssg#
33 ....#SHSSSSSsssg#
34 ....#SHSSSSSsssg#
35 ....#SHSSSSSsssg#
36 ....#SHSSSSSsssg#
37 ....#GGGGGGGggggg#
38 ....#SHSSSSkkkkkk#
39 ....#SHSSSSSsssg#
40 ....#SHSSSSSsssg#
41 ....#SHSSSSSskkg#
42 ....#SHSSSSSskkg#
43 ....#SSSSSSSsssg#
44 ....##############`},
  {name:'MASQUE COIFFE - occulter les cheveux',
   face:mask([25,43,29,52]),
   droite:mask([25,43,29,52])}
 ]
};
