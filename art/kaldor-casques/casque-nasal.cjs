// Casque à nasal : calotte conique d'acier à arête claire, bandeau de bronze
// riveté, nasal descendant entre les yeux. Ouvert : la crinière sort dessous.
const mask=require('./masque.cjs');
module.exports={
 id:'casque-nasal',label:'Casque à nasal',warmth:0,closed:false,
 description:'Calotte conique d’acier et bandeau de bronze riveté. Le nasal garde le visage, la crinière reste libre.',
 place:{site:'town-60',dx:40,dy:34},
 palette:{H:'eef2ea',S:'b9c3c4',s:'838e93',t:'545d63',Y:'e2ac4f',y:'b07a32',u:'74481f',M:'ffffff'},
 layers:[
  {name:'COIFFE 21 - Calotte et nasal',
   face:`
30 ..........##
31 .........#Hs#
32 ........#SHss#
33 .......#SSHsst#
34 ......#SSSHssst#
35 .....#SSSSHsssst#
36 ....#YYHYYYHYYYHy#
37 ....#yyyyyyyyyyyu#
38 ..........Hs
39 ..........Ss
40 ..........st`,
   dos:`
30 ..........##
31 .........#Hs#
32 ........#SHss#
33 .......#SSHsst#
34 ......#SSSHssst#
35 .....#SSSSHsssst#
36 ....#YYHYYYHYYYHy#
37 ....#yyyyyyyyyyyu#`,
   droite:`
30 ...........##
31 ..........#Hs#
32 .........#SHss#
33 ........#SSHsst#
34 .......#SSSHssst#
35 ......#SSSSHsssst#
36 ....#YYHYYYHYYYHy#
37 ....#uyyyyyyyyyyu#
38 ...............Ss#
39 ...............Ss#
40 ...............st#`},
  {name:'MASQUE COIFFE - occulter les cheveux',
   face:mask([25,36,29,52],[37,37,33,46]),
   droite:mask([25,36,29,52],[37,37,33,46])}
 ]
};
