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
   // Rendu mûr : rampes propres au biome (palette réindexée à la construction).
   rampes:A.RAMPES,accents:A.ACCENTS,macro:A.MACRO,
   sols:{grass:'herbe',dirt:'terre',cobble:'paves',water:'eau',litter:'litiere',bank:'berge',plank:'planches'},
   grids:A.grids,pavages:A.PAVINGS,niveaux:A.LEVELS,jeux:A.SETS,pieces:A.PIECE_SETS,decors:decals,decalRate:.08,
   flore:{chene:['chene_a','chene_b','chene_c'],bouleau:['bouleau_a','bouleau_b'],buisson:['buisson_a','buisson_b'],rocher:['rocher_a','rocher_b'],fougere:['fougere'],champignons:['champignons'],fleurs:['fleurs']},
   sprites:flora.all,ombre:.45
  };
 },
 sarak(){
  const G=require('./sarak-ground.cjs'),cliffs=require('./sarak-cliffs.cjs'),pav=require('./sarak-pavings.cjs'),{decals}=require('./sarak-decals.cjs'),flora=require('./sarak-flora.cjs');
  const LEVELS=[['dune8','battue3','battue4','battue5'],['dune8','gresm2','gresm3','gresm4'],['dune8','bleu2','bleu3','bleu4']];
  return {
   nom:'Désert de Sarak',global:'HearthreaverSarak',
   // Rendu mûr : rampes propres au biome (palette réindexée à la construction).
   rampes:['roc','dune','gresrouge','battue','palmier','bleu','ecorcem','gresm','briquem','saule','jonc','fleurm'],
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
   accents:{lipLit:'dune11',lipShade:'dune9',drape:'dune6',drape2:'dune5',bankFace:'dune6',bankFace2:'dune4',waterDeep:'bleu1',foam:'bleu10',plank:'gresm4',deckShade:'gresm2',deckShade2:'gresm1',deckLip:'gresm6'},
   macro:{scale:[220,80],hi:.4,lo:-.6,dither:.8}
  };
 },
 varan(){
  const G=require('./varan-ground.cjs'),cliffs=require('./varan-cliffs.cjs'),pav=require('./varan-pavings.cjs'),{decals}=require('./varan-decals.cjs'),flora=require('./varan-flora.cjs');
  const LEVELS=[['jonc4','vase3','vase4','vase5'],['jonc4','roc2','roc3','roc4'],['jonc4','marais2','marais3','marais4']];
  return {
   nom:'Marais de Varan',global:'HearthreaverVaran',
   // Rendu mûr : rampes propres au biome (palette réindexée à la construction).
   rampes:['roc','jonc','vase','marais','lentille','saule','tourbe','iris','mousse','planche','rouille','ecorcem','frondaison','fleurm'],
   sols:{grass:'jonchaie',dirt:'vase',cobble:'galets',water:'eau',litter:'tourbe',bank:'berge',plank:'planches'},
   grids:()=>({grass:G.jonchaie(),dirt:G.vase(),cobble:G.galets(),water:G.eau(),litter:G.tourbe(),bank:G.berge(),plank:G.planches(),
    cliffS:cliffs.face({seed:371}),cliffE:cliffs.face({seed:372,lit:false}),
    ...Object.fromEntries(Object.keys(pav.PAVINGS).flatMap(k=>[[k,pav.paving(k)],[k+'_v',pav.paving(k,{axis:'v'})]]))}),
   pavages:pav.PAVINGS,niveaux:LEVELS,
   // Rues des villages : caillebotis (« rangs », ruelles pavées du jeu), rondins, dalles moussues.
   jeux:{chemin:{forme:'chemin',matiere:'dirt'},pave:{forme:'pave',matiere:'cobble'},rangs:{forme:'pave',matiere:'boards'},rondins:{forme:'pave',matiere:'logs'},dalles:{forme:'pave',matiere:'flags'},ruisseau:{forme:'ruisseau',matiere:'water'}},
   pieces:()=>({chemin:pieces.set({half:9,colours:LEVELS[0]}),pave:pieces.set({half:11,colours:LEVELS[1]}),ruisseau:pieces.set({half:12,meander:3.5,swell:1.5,colours:LEVELS[2]})}),
   decors:decals,decalRate:.07,
   flore:{cypres:['cypres_a','cypres_b'],saule:['saule_a','saule_b'],chicot:['chicot'],souche:['souche'],roseaux:['roseaux_a','roseaux_b'],massettes:['massettes'],fougere:['fougere'],champignons:['champignons'],rocher:['rocher_a','rocher_b']},
   sprites:flora.all,ombre:.5,
   accents:{lipLit:'jonc7',lipShade:'jonc5',drape:'jonc3',drape2:'jonc2',bankFace:'vase4',bankFace2:'vase3',waterDeep:'marais1',foam:'marais9',plank:'planche4',deckShade:'planche2',deckShade2:'planche1',deckLip:'planche5'},
   macro:{scale:[180,64],hi:.42,lo:-.5,dither:.8}
  };
 }
};
module.exports={BIOMES,names:Object.keys(BIOMES),load:name=>{const f=BIOMES[name];if(!f)throw Error('biome inconnu : '+name+' ('+Object.keys(BIOMES).join(', ')+')');return f();}};
