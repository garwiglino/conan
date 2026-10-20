'use strict';
/* Biomes redessinés : ce que le premier jet Piskel écrit pour chacun, et sous
 * quel nom le jeu charge ses données. Les identifiants de texture sont ceux du
 * compositeur (grass = sol de base, dirt = chemin, cobble = pavés…), les noms
 * de fichier ceux que l'on ouvre dans Piskel. */
const pieces=require('./teremor-pieces.cjs');
const BIOMES={
 teremor(){
  const A=require('./teremor-assets.cjs'),{decals}=require('./teremor-decals.cjs'),flora=require('./teremor-flora.cjs');
  return {
   nom:'Forêt tempérée de Teremor',global:'HearthreaverTeremor',
   sols:{grass:'herbe',dirt:'terre',cobble:'paves',water:'eau',litter:'litiere',bank:'berge',plank:'planches'},
   grids:A.grids,pavages:A.PAVINGS,niveaux:A.LEVELS,jeux:A.SETS,pieces:A.PIECE_SETS,decors:decals,decalRate:.08,
   flore:{chene:['chene_a','chene_b','chene_c'],bouleau:['bouleau_a','bouleau_b'],buisson:['buisson_a','buisson_b'],rocher:['rocher_a','rocher_b'],fougere:['fougere'],champignons:['champignons'],fleurs:['fleurs']},
   sprites:flora.all,ombre:.45
  };
 },
 sarak(){
  const G=require('./sarak-ground.cjs'),cliffs=require('./sarak-cliffs.cjs'),pav=require('./sarak-pavings.cjs'),{decals}=require('./sarak-decals.cjs'),flora=require('./sarak-flora.cjs');
  const LEVELS=[['sable5','piste3','piste4','piste5'],['sable5','gres1','gres2','gres3'],['sable5','oasis2','oasis3','oasis4']];
  return {
   nom:'Désert de Sarak',global:'HearthreaverSarak',
   sols:{grass:'sable',dirt:'piste',cobble:'paves-gres',water:'oasis',litter:'eboulis',bank:'berge',plank:'planches'},
   grids:()=>({grass:G.sand(),dirt:G.track(),cobble:G.cobbles(),water:G.water(),litter:G.scree(),bank:G.bank(),plank:G.planks(),
    cliffS:cliffs.face({seed:361}),cliffE:cliffs.face({seed:362,lit:false}),
    ...Object.fromEntries(Object.keys(pav.PAVINGS).flatMap(k=>[[k,pav.paving(k)],[k+'_v',pav.paving(k,{axis:'v'})]]))}),
   pavages:pav.PAVINGS,niveaux:LEVELS,
   jeux:{chemin:{forme:'chemin',matiere:'dirt'},pave:{forme:'pave',matiere:'cobble'},rangs:{forme:'pave',matiere:'setts'},dalles:{forme:'pave',matiere:'flags'},tomettes:{forme:'pave',matiere:'hex'},cabochons:{forme:'pave',matiere:'cabochon'},oued:{forme:'ruisseau',matiere:'water'}},
   pieces:()=>({chemin:pieces.set({half:9,colours:LEVELS[0]}),pave:pieces.set({half:11,colours:LEVELS[1]}),ruisseau:pieces.set({half:12,meander:3.5,swell:1.5,colours:LEVELS[2]})}),
   decors:decals,decalRate:.06,
   flore:{palmier:['palmier_a','palmier_b'],arbre_mort:['arbre_mort_a','arbre_mort_b'],buisson:['buisson_a','buisson_b'],touffe:['touffe_a','touffe_b'],rocher:['rocher_a','rocher_b','rocher_rond'],cheminee:['cheminee'],eboulis:['eboulis'],cailloux:['cailloux']},
   sprites:flora.all,ombre:.5,
   // Couleurs posées par le compositeur : rebord des falaises, berge vue
   // au-dessus de l'eau, écume, ombre du tablier ; grandes plages du sol.
   accents:{lipLit:'sable7',lipShade:'sable6',drape:'sable4',drape2:'sable3',bankFace:'sable4',bankFace2:'sable3',waterDeep:'oasis1',foam:'oasis7',plank:'bois3',deckShade:'bois2',deckShade2:'bois1',deckLip:'bois5'},
   macro:{scale:[220,80],hi:.4,lo:-.6,dither:.8}
  };
 }
};
module.exports={BIOMES,names:Object.keys(BIOMES),load:name=>{const f=BIOMES[name];if(!f)throw Error('biome inconnu : '+name+' ('+Object.keys(BIOMES).join(', ')+')');return f();}};
