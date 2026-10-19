/* Seasonal policy and exposed-surface masks, shared by any occupant race.
 * No replacement furniture/natural textures. Snow colours: WorldTerrainArt.colors.snow.
 * Igea is seasonal: callers must explicitly select igea_winter from actual weather. */
(function(r,f){const api=f();if(typeof module==='object'&&module.exports)module.exports=api;else r.HearthreaverIgeaWinter=api;})(globalThis,function(){
'use strict';
const SEASON='igea_winter',SNOW=Object.freeze(['4a6774','66828d','839fa7','a3b9ba','c2d0ca','dce1d2','f0eedc']);
// Rectangles are inclusive authored grid coordinates. Only the upper silhouette
// inside each rectangle receives a 1–2px cap. Never blanket-coat an object.
const CAPS=Object.freeze({
 sawhorse:[[0,3,0,7],[24,27,0,7]],well:[[0,27,0,5]],
 market_stall:[[0,35,0,8]],beehive:[[3,18,0,6]],
 stable_stall:[[0,4,0,7],[35,39,0,7],[5,34,0,3]],
 care_stall:[[0,4,0,5],[37,41,0,5]],enclosure_gate:[[0,35,0,6]],
 quarry_block:[[0,3,0,8],[28,31,0,8]],
 dock_bollard:[[0,3,0,6],[33,37,0,6]]
});
const INDOOR='workbench anvil forge smelter quench_trough potters_wheel pottery_kiln glass_bench glass_furnace loom fiber_rack hide_frame dye_vat rope_bench grain_mill oil_press kitchen_table cooking_hearth bread_oven apothecary_table care_bed sleeping_mat sitting_bench meal_table clerks_desk feeding_trough clothesline drying_rack fixed_screen wall_scaffold'.split(' ');
const DORMANT={sluice:'Canal d’irrigation arrêté pendant le gel.',crop_patch:'Pas de semis ni de récolte sur un sol enneigé.',salt_basin:'Évaporation solaire interrompue.',beehive:'Ruche laissée fermée pendant l’hivernage.',orchard_tree:'Verger en repos ; pas de cueillette sous la neige.'};
const POLICY=Object.fromEntries(INDOOR.map(id=>[id,{setting:'sheltered',reason:'Poste utilisé dans un local ou sous un abri ; surface de travail dégagée.'}]));
for(const id of ['chopping_block','sawhorse','well','market_stall','stable_stall','care_stall','enclosure_gate','resin_tree','charcoal_clamp','ore_node','quarry_block','dock_bollard','bank_platform','snow_access'])POLICY[id]={setting:'exposed',reason:'Accès et zone de travail entretenus ; neige limitée aux parties inutilisées.'};
for(const [id,reason]of Object.entries(DORMANT))POLICY[id]={setting:'dormant',reason};
for(const p of Object.values(POLICY))Object.freeze(p);Object.freeze(POLICY);
const STOP={
 hoe:'Sol gelé ou couvert de neige.',sow:'Semis reportés au dégel.',harvest:'Moisson hors saison.',uproot:'Récolte de plein champ hors saison.',bundle:'Pas de gerbes fraîches à récolter.',irrigate:'Irrigation arrêtée pendant le gel.',harvest_fruit:'Récolte extérieure hors saison.',cut_fiber:'Fibres récoltées avant l’hiver.',shear:'La laine protège les animaux du froid.',resin:'Écoulement de résine insuffisant au froid.',rake_salt:'Évaporation solaire hors saison.',smoke_hive:'Ne pas ouvrir ni enfumer une ruche en hivernage.',honey:'Prélèvement du miel reporté.',prune:'Taille reportée à une fenêtre hors gel.'
};
const CONDITIONS={
 cast_net:['openWater','Pêche seulement sur une eau libre de glace.'],haul_net:['openWater','Pêche seulement sur une eau libre de glace.'],pan_gold:['openWater','Lavage seulement sur une eau libre et accessible.'],
 row:['openWater','Navigation seulement sur une eau libre de glace.'],pole:['openWater','Navigation seulement sur une eau libre de glace.'],helm:['openWater','Navigation seulement sur une eau libre de glace.'],board:['openWater','Embarquement seulement sur une eau libre de glace.'],disembark:['openWater','Débarquement seulement sur une eau libre de glace.'],
 masonry:['frostProtected','Mortier utilisable seulement dans une zone protégée du gel.'],
 mine:['mineAccessible','Mine accessible, étayée et ravitaillée.'],quarry:['quarryAccessible','Front de taille accessible et débarrassé de la glace.'],herd:['pastureAccessible','Déplacement limité aux pâtures et chemins praticables.']
};
const NEW=Object.freeze(['clear_snow','deice_trough','stoke_fire','warm_hands']);
function enabled(options){return options?.season===SEASON;}
function availability(action,options={}){
 if(!enabled(options))return {allowed:true,state:'ordinary',reason:''};
 if(STOP[action])return {allowed:false,state:'suspended',reason:STOP[action]};
 const c=CONDITIONS[action];if(c&&!options.conditions?.[c[0]])return {allowed:false,state:'conditional',requires:c[0],reason:c[1]};
 return {allowed:true,state:c?'conditional_ready':'winter',reason:c?c[1]:NEW.includes(action)?'Entretien hivernal d’Igea.':'Activité maintenue ; poste et accès dégagés.'};
}
function station(id){const p=POLICY[id];if(!p)throw Error('Politique hivernale manquante : '+id);return p;}
function assertAllowed(action,options){const a=availability(action,options);if(!a.allowed)throw RangeError('Igea enneigée : '+a.reason);return a;}
function overlay(id,g,points,{x,y,socket,put}){
 const result=[];if(!CAPS[id]||!g)return result;
 const ox=x-g.ground[0],oy=y-g.ground[1],original=new Map(points);
 for(const [x0,x1,y0,y1]of CAPS[id])for(let i=x0;i<=x1;i++){
  let j=y0;while(j<=y1&&!original.has((oy+j)*128+ox+i))j++;if(j>y1)continue;
  // Do not mistake a lower object hidden behind a gap for an exposed roof.
  if(original.has((oy+j-1)*128+ox+i))continue;
  for(let t=0;t<2;t++){
   const X=ox+i,Y=oy+j-1+t;
   if(t===1&&!original.has(Y*128+X))continue;
   if(Math.abs(X-socket.feet[0])<=4&&Y>=socket.feet[1]-3)continue;
   if(Math.abs(X-socket.contact[0])<=3&&Math.abs(Y-socket.contact[1])<=2)continue;
   const c=SNOW[t?4:((i%7===0)?5:6)];put(X,Y,c);result.push([X,Y,c]);
  }
 }
 return result;
}
return Object.freeze({SEASON,SNOW,CAPS,POLICY,STOP,CONDITIONS,NEW,enabled,availability,station,assertAllowed,overlay});
});
