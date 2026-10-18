/* Hearthreaver — tenues et activités des hommes-singes, Codex / ChatGPT.
 * Corps validé conservé ; poses articulées entières, outils au poignet.
 * Contrat moteur : 80×80, ancre 40,52 ; alpha binaire. Aucun spawn ni stock.
 */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./homme-singe.js'));else root.HearthreaverApeActivities=factory(root.HearthreaverApe);})(globalThis,function(Base){
'use strict';if(!Base)throw Error('HearthreaverApe requis');
const SPECS={"idle":{"label":"Repos debout","family":"life","props":[],"workspace":"ground","markers":[]},"walk":{"label":"Marche","family":"life","props":[],"workspace":"ground","markers":["foot_contacts"]},"flee":{"label":"Course de fuite","family":"life","props":[],"workspace":"escape_path","markers":["foot_contacts"]},"talk":{"label":"Parler et écouter","family":"social","props":[],"workspace":"meeting","markers":[]},"startle":{"label":"Réagir à une alerte","family":"life","props":[],"workspace":"ground","markers":["interrupt_work"]},"sit_down":{"label":"S’asseoir","family":"life","props":["bench"],"workspace":"meeting","markers":["seat_contact"]},"seated":{"label":"Repos assis","family":"life","props":["bench"],"workspace":"meeting","markers":[]},"stand_up":{"label":"Se relever","family":"life","props":["bench"],"workspace":"meeting","markers":["release_seat"]},"eat":{"label":"Manger une portion","family":"life","props":["bowl"],"workspace":"house","markers":["consume_once"]},"drink":{"label":"Boire","family":"life","props":["gourd"],"workspace":"house","markers":["consume_once"]},"carry":{"label":"Porter une charge","family":"life","props":["crate","basket"],"workspace":"safe_path","markers":["two_hand_grip","foot_contacts"]},"put_down":{"label":"Poser et reprendre une charge","family":"life","props":["crate","basket"],"workspace":"granary","markers":["release_once"]},"hit":{"label":"Blessure et interruption","family":"life","props":[],"workspace":"ground","markers":["cancel_action"]},"death":{"label":"Mort persistante","family":"life","props":[],"workspace":"ground","markers":["no_duplicate_corpse"]},"shelter":{"label":"Se replier, attendre puis revenir","family":"behavior","props":[],"workspace":"shelter","markers":["safe_arrival","calm_before_return"]},"sleep":{"label":"Dormir au foyer ou à la halte","family":"life","props":["mat"],"workspace":"house","markers":["bed_reserved"]},"greet":{"label":"Saluer ou remercier","family":"social","props":[],"workspace":"meeting","markers":[]},"mourn":{"label":"Veillée et funérailles","family":"social","props":[],"workspace":"meeting","markers":["existing_person_event"]},"harvest_fruit":{"label":"Cueillir fruits et aromates","family":"work","props":["basket","hook"],"workspace":"garden","markers":["reach_target","collect_once"]},"hoe":{"label":"Biner et entretenir les jardins","family":"work","props":["hoe"],"workspace":"garden","markers":["ground_contact"]},"sow":{"label":"Planter et semer","family":"work","props":["seed_bag"],"workspace":"garden","markers":["plant_once"]},"cut_fiber":{"label":"Récolter des fibres","family":"work","props":["knife","bundle"],"workspace":"garden","markers":["cut_contact"]},"weave":{"label":"Tresser nattes et paniers","family":"work","props":["basket","fiber_bundle"],"workspace":"fiber_yard","markers":["hand_crossing"]},"rope":{"label":"Tordre des cordages","family":"work","props":["rope_rack"],"workspace":"fiber_yard","markers":["twist_cycle"]},"resin":{"label":"Recueillir de la résine","family":"work","props":["scraper","pot"],"workspace":"wood_yard","markers":["tap_contact"]},"prune":{"label":"Élaguer et entretenir le verger","family":"work","props":["pruning_blade"],"workspace":"garden","markers":["cut_contact"]},"hew":{"label":"Débiter du bois au billot","family":"work","props":["axe","log"],"workspace":"wood_yard","markers":["tool_contact"]},"saw":{"label":"Scier au chevalet","family":"work","props":["saw","sawhorse"],"workspace":"wood_yard","markers":["tool_contact"]},"joinery":{"label":"Assembler et réparer","family":"work","props":["mallet","pegs"],"workspace":"wood_yard","markers":["tool_contact"]},"cook":{"label":"Cuire et préparer les repas","family":"work","props":["pot","ladle"],"workspace":"house","markers":["stir_contact"]},"ledger":{"label":"Compter, écrire et peser","family":"work","props":["ledger","scale"],"workspace":"market","markers":["mark_once"]},"load":{"label":"Charger, décharger et arrimer","family":"work","props":["crate","rope"],"workspace":"quay","markers":["hand_over_once"]},"honey":{"label":"Récolter miel et cire","family":"work","props":["smoker","hive","jar"],"workspace":"garden","markers":["collect_once"]},"medicinal":{"label":"Trier et préparer des remèdes","family":"work","props":["mortar","herbs"],"workspace":"house","markers":["mix_contact"]},"pottery":{"label":"Tourner et façonner une poterie","family":"work","props":["wheel","clay_lump"],"workspace":"kiln","markers":["hand_contact"]},"net":{"label":"Réparer les filets ou pêcher","family":"work","props":["net","needle"],"workspace":"quay","markers":["real_water_or_repair"]},"row":{"label":"Ramer ou mener une petite embarcation","family":"work","props":["oar","boat"],"workspace":"quay","markers":["water_contact"]},"repair_boat":{"label":"Calfater et réparer une coque","family":"work","props":["mallet","caulking_tool","resin_pot"],"workspace":"quay","markers":["tool_contact"]},"stitch":{"label":"Coudre cuir et vêtements","family":"work","props":["needle","cloth"],"workspace":"fiber_yard","markers":["needle_contact"]},"bandage":{"label":"Soigner un blessé","family":"care","props":["bandage"],"workspace":"shelter","markers":["care_once"]},"negotiate":{"label":"Négocier et arbitrer","family":"social","props":["ledger"],"workspace":"meeting","markers":["named_parties"]},"surrender":{"label":"Rendre les armes","family":"combat","props":["weapon"],"workspace":"ground","markers":["drop_once"]},"armed_idle":{"label":"Repos armé et orientation","family":"combat","props":["weapon"],"workspace":"watch","markers":[]},"armed_walk":{"label":"Pas armés face à une cible","family":"combat","props":["weapon"],"workspace":"safe_path","markers":["foot_contacts","facing_independent"]},"warn":{"label":"Sommation et ralliement","family":"combat","props":["weapon"],"workspace":"watch","markers":["local_witness"]},"guard_raise":{"label":"Lever le bouclier","family":"combat","props":["shield"],"workspace":"watch","markers":["guard_ready"]},"guard_hold":{"label":"Tenir la garde en mouvement","family":"combat","props":["shield"],"workspace":"ground","markers":["frontal_only"]},"block":{"label":"Encaisser un coup au bouclier","family":"combat","props":["shield"],"workspace":"ground","markers":["blocked_once","no_blood"]},"guard_break":{"label":"Garde brisée et étourdissement","family":"combat","props":["shield"],"workspace":"ground","markers":["stun","cancel_attack"]},"spear_thrust":{"label":"Estoc de lance","family":"combat","props":["spear"],"workspace":"ground","markers":["single_contact","active_smear"]},"staff_sweep":{"label":"Balayage de bâton ou de hampe","family":"combat","props":["staff"],"workspace":"ground","markers":["single_contact","active_smear"]},"axe_chop":{"label":"Frappe de hache ou massue","family":"combat","props":["axe"],"workspace":"ground","markers":["single_contact","active_smear"]},"blade_cut":{"label":"Taille et revers courts","family":"combat","props":["blade"],"workspace":"ground","markers":["single_contact","active_smear"]},"throw_stone":{"label":"Lancer d’une pierre ou d’un javelot","family":"combat","props":["stone","javelin"],"workspace":"ground","markers":["release_projectile","swept_collision"]},"climb":{"label":"Monter par accès forestier aménagé","family":"deferred","props":["ladder","rope"],"workspace":"forest_platform","markers":["real_navigation_edge","no_teleport"]}};
const ROLE_INFO={"gardener":{"label":"Cultivateur et verger","activities":["hoe","sow","harvest_fruit","prune"],"outfitBrief":"toile légère, tablier court, panier ; chapeau optionnel"},"fiber_worker":{"label":"Fibres, paniers et cordages","activities":["cut_fiber","weave","rope"],"outfitBrief":"tablier souple, manches dégagées ; pas de casque"},"forest_worker":{"label":"Bois, résine et ruchers","activities":["resin","hew","saw","honey"],"outfitBrief":"cuir de travail, ceinture d’outils ; couvre-chef selon tâche"},"carpenter":{"label":"Charpente et réparation navale","activities":["joinery","repair_boat"],"outfitBrief":"tablier renforcé et outils à portée ; pas de bouclier permanent"},"porter":{"label":"Portage et chargement","activities":["carry","load","put_down"],"outfitBrief":"veste courte, sangle de portage et sandales adaptées"},"trader":{"label":"Marché et écritures","activities":["ledger","negotiate"],"outfitBrief":"étoffe propre, bourse, tablette ou registre"},"potter":{"label":"Poterie","activities":["pottery"],"outfitBrief":"tablier de toile sans manches flottantes près du four"},"healer":{"label":"Préparations et soins","activities":["medicinal","bandage"],"outfitBrief":"pochettes et étoffe propre ; aucune magie automatique"},"cook":{"label":"Cuisine et réserve","activities":["cook","eat"],"outfitBrief":"tablier et couvre-chef de travail optionnel"},"boat_worker":{"label":"Filets et navigation","activities":["net","row","load"],"outfitBrief":"veste courte, corde et protection de pluie"},"tailor":{"label":"Couture et entretien","activities":["stitch"],"outfitBrief":"tablier, aiguille, cuir ou étoffe selon commande"},"delegate":{"label":"Médiation et mémoire","activities":["talk","ledger","negotiate","mourn"],"outfitBrief":"tenue civile locale, signe de mandat discret et révocable"},"warden":{"label":"Garde de communauté","activities":["armed_idle","armed_walk","warn","guard_raise","guard_hold","block","guard_break","spear_thrust"],"outfitBrief":"protection courte de cuir, lance et bouclier ; casque ouvert facultatif"},"escort":{"label":"Escorte de convoi","activities":["armed_walk","guard_hold","block","blade_cut","surrender"],"outfitBrief":"cuir et toile, lame courte et bouclier ; mandat limité au convoi"},"scout":{"label":"Éclaireur de chemins","activities":["armed_walk","warn","staff_sweep","throw_stone"],"outfitBrief":"tenue légère, bâton, sac de pierres ou javelots ; pas de bouclier par défaut"},"brigand":{"label":"Membre d’une bande identifiée","activities":["armed_walk","axe_chop","blade_cut","throw_stone","surrender"],"outfitBrief":"équipement accessible au groupe, pas d’uniforme racial du crime"}};
const INK='#100e20',WOOD=['#4b302d','#8d5f3d','#c49a61'],METAL=['#414654','#8d9b9e','#e0ddbe'],LINEN=['#645641','#b39a6d','#eddaaa'];
const OUTFITS={
 gardener:{cut:'apron',cloth:['#514c32','#858347','#b4ad63'],trim:LINEN,hat:'straw',weapon:null},
 fiber_worker:{cut:'tunic',cloth:['#51402e','#927245','#c5a466'],trim:['#394a43','#617a5c','#9ca87b'],hat:null,weapon:null},
 forest_worker:{cut:'vest',cloth:['#3d4532','#637349','#98a06a'],trim:WOOD,hat:'cap',weapon:null},
 carpenter:{cut:'apron',cloth:['#54332e','#966047','#c38a61'],trim:LINEN,hat:null,weapon:null},
 porter:{cut:'harness',cloth:['#3d3845','#6d6676','#a19a9e'],trim:WOOD,hat:'band',weapon:null},
 trader:{cut:'coat',cloth:['#493440','#805267','#b98289'],trim:LINEN,hat:null,weapon:null},
 potter:{cut:'apron',cloth:['#564b3c','#9a8665','#c7b48a'],trim:['#4e3d32','#8d6950','#bb9671'],hat:'band',weapon:null},
 healer:{cut:'wrap',cloth:['#3b504b','#628c7b','#a4b9a1'],trim:LINEN,hat:null,weapon:null},
 cook:{cut:'apron',cloth:['#625942','#aaa080','#e5d9ae'],trim:WOOD,hat:'cap',weapon:null},
 boat_worker:{cut:'vest',cloth:['#303b4b','#586e83','#8ba0ab'],trim:WOOD,hat:'band',weapon:null},
 tailor:{cut:'tunic',cloth:['#4b394f','#826582','#b79aa8'],trim:LINEN,hat:null,weapon:null},
 delegate:{cut:'shawl',cloth:['#613731','#a35e43','#d79964'],trim:LINEN,hat:null,weapon:null},
 warden:{cut:'brigandine',cloth:['#343d35','#596c4e','#8c9a6a'],trim:['#6e4d31','#ae824c','#dfb76f'],hat:'helmet',weapon:'spear',shield:true},
 escort:{cut:'jacket',cloth:['#44322f','#7d5142','#ad7b57'],trim:['#343b4a','#687185','#9a9eaa'],hat:'helmet',weapon:'blade',shield:true},
 scout:{cut:'mantle',cloth:['#394338','#647752','#99a475'],trim:WOOD,hat:'hood',weapon:'javelin',shield:false},
 brigand:{cut:'patched',cloth:['#43302f','#765147','#a17a59'],trim:['#413c36','#736957','#a0967e'],hat:null,weapon:'club',shield:false}
};
const ATTACKS=new Set(['spear_thrust','staff_sweep','axe_chop','blade_cut','throw_stone']);
const DURATIONS={startle:[90,65,110,180],sit_down:[120,100,90,100,160],seated:[600,240,400,360],stand_up:[110,100,90,110,180],hit:[55,85,115,120,160],death:[80,100,120,100,70,70,100,360],guard_raise:[35,35,40,70],guard_hold:[240,180,240,180],block:[35,45,55,65,65,75],guard_break:[45,65,110,150,180],surrender:[120,100,140,180,300],put_down:[130,110,120,100,100,140,160,180],load:[130,120,100,110,110,100,120,160],warn:[160,120,160,260],sleep:[700,280,440,350]};
// Milliseconds per pose: preparation, working contact, then recovery.
Object.assign(DURATIONS,{
 harvest_fruit:[220,150,140,230,170,150,160,300],hoe:[220,170,150,90,160,200,220,290],
 sow:[200,160,180,220,180,160,200,320],cut_fiber:[180,140,120,75,120,160,180,260],
 weave:[180,150,170,200,180,150,170,240],rope:[160,140,160,180,160,140,160,200],
 resin:[200,150,130,110,150,180,200,260],prune:[220,160,140,75,130,170,200,280],
 hew:[250,180,130,70,170,220,250,340],saw:[130,110,120,150,130,110,120,170],
 joinery:[200,140,100,65,120,160,180,240],cook:[250,210,220,240,250,210,220,300],
 ledger:[200,140,160,190,180,140,170,300],honey:[280,210,240,300,260,220,250,350],
 medicinal:[180,150,160,180,180,150,160,220],pottery:[230,200,220,250,230,200,220,290],
 net:[220,160,190,230,210,160,190,300],row:[200,140,130,150,220,250,230,240],
 repair_boat:[220,150,110,75,140,190,210,270],stitch:[220,150,170,200,220,150,180,280],
 bandage:[260,190,220,260,240,190,230,340],negotiate:[300,180,240,340,280,180,250,420],
 eat:[280,180,180,300,220,180,200,420],drink:[250,180,200,450,300,220,220,350],
 greet:[170,130,160,220,180,150,180,320],mourn:[500,360,420,600,500,360,420,700],
 climb:[180,140,160,230,180,140,160,230],shelter:[140,130,140,170,200,250,400,600],
 armed_idle:Base.CLIPS.idle.durations.slice(),
 armed_walk:Base.CLIPS.walk.durations.map(t=>Math.round(t*1.15)),
 carry:Base.CLIPS.walk.durations.map(t=>Math.round(t*1.3)),
 spear_thrust:[120,100,90,80,65,35,35,65,80,110,130,170],
 staff_sweep:[130,110,100,85,70,35,40,65,90,115,140,180],
 axe_chop:[180,150,130,110,80,35,45,90,130,160,190,240],
 blade_cut:[105,90,80,70,60,30,35,55,70,95,115,145],
 throw_stone:[140,115,100,90,75,35,40,80,100,130,150,190]
});
const CONTACT_FRAMES={hoe:3,hew:3,joinery:3,repair_boat:3,cut_fiber:3,prune:3};
const CLIPS={};for(const [id,spec]of Object.entries(SPECS)){
 const loop=!['startle','sit_down','stand_up','hit','death','guard_raise','block','guard_break','surrender','put_down','load','shelter'].includes(id)&&!ATTACKS.has(id);
 const durations=Base.CLIPS[id]?.durations||DURATIONS[id]||(ATTACKS.has(id)?[95,85,75,70,65,35,35,50,60,70,85,95]:[130,110,110,120,130,110,110,140]);
 const markers=[];if(ATTACKS.has(id))markers.push({id:id==='throw_stone'?'release_projectile':'contact',frame:5});
 else for(const m of spec.markers)if(!['foot_contacts','frontal_only','facing_independent','two_hand_grip','single_contact','active_smear','swept_collision'].includes(m))markers.push({id:m,frame:CONTACT_FRAMES[id]??Math.min(durations.length-1,Math.floor(durations.length/2))});
 CLIPS[id]={...spec,frames:durations.length,durations,loop,stride:Base.CLIPS[id]?.stride||(id==='armed_walk'||id==='carry'?24:null),duration:durations.reduce((a,b)=>a+b,0)/1000,markers,activeFrames:ATTACKS.has(id)?[5,6]:[],contact:ATTACKS.has(id)?durations.slice(0,5).reduce((a,b)=>a+b,0)/1000:null,navigationRequired:id==='climb'||id==='shelter'};
}
function clip(id){if(!CLIPS[id])throw new RangeError('Activité inconnue : '+id);return CLIPS[id];}
function frameAt(id,seconds=0,distance){const c=clip(id),total=c.duration*1000;let ms=distance!==undefined&&c.stride?((distance%c.stride+c.stride)%c.stride)*total/c.stride:Math.max(0,seconds)*1000;if(c.loop)ms%=total;else ms=Math.min(ms,total-.000001);for(let f=0;f<c.frames;f++){ms-=c.durations[f];if(ms<0)return f;}return c.frames-1;}
function eventsBetween(id,before,after){const c=clip(id);if(!Number.isFinite(before)||!Number.isFinite(after)||after<before)throw RangeError('Intervalle invalide');const events=[];const first=c.loop?Math.max(0,Math.floor(before/c.duration)):0,last=c.loop?Math.floor(after/c.duration):0;if(last-first>128)throw RangeError('Découper le rattrapage temporel');for(let cycle=first;cycle<=last;cycle++)for(const m of c.markers){const t=cycle*c.duration+c.durations.slice(0,m.frame).reduce((a,b)=>a+b,0)/1000;if(t>before&&t<=after)events.push({...m,time:t,cycle});}return events;}
const round=Math.round,lerp=(a,b,t)=>a+(b-a)*t;
function project(dir,l,d,h){if(dir==='face')return [40+round(l),52+round(d*.5-h)];if(dir==='dos')return [40-round(l),52+round(-d*.5-h)];if(dir==='droite')return [40+round(d),52+round(l*.35-h)];return [40-round(d),52+round(-l*.35-h)];}
class Pixels{
 constructor(){this.map=new Map();this.outside=0;}
 set(x,y,color){x=round(x);y=round(y);if(x<0||y<0||x>=80||y>=80){this.outside++;return;}this.map.set(y*80+x,[x,y,color]);}
 rect(x,y,w,h,color){for(let j=0;j<h;j++)for(let i=0;i<w;i++)this.set(x+i,y+j,color);}
 line(ax,ay,bx,by,color,width=1){ax=round(ax);ay=round(ay);bx=round(bx);by=round(by);let dx=Math.abs(bx-ax),sx=ax<bx?1:-1,dy=-Math.abs(by-ay),sy=ay<by?1:-1,e=dx+dy;for(;;){this.rect(ax-Math.floor(width/2),ay-Math.floor(width/2),width,width,color);if(ax===bx&&ay===by)break;const e2=e*2;if(e2>=dy){e+=dy;ax+=sx;}if(e2<=dx){e+=dx;ay+=sy;}}}
 ellipse(cx,cy,rx,ry,color){for(let y=-ry;y<=ry;y++)for(let x=-rx;x<=rx;x++)if(x*x/(rx*rx)+y*y/(ry*ry)<=1)this.set(cx+x,cy+y,color);}
 stamp(rows,x,y,pal){rows.forEach((r,j)=>[...r].forEach((k,i)=>{if(k!=='.')this.set(x+i,y+j,pal[k]);}));}
 values(){return [...this.map.values()];}
}
const wave=[0,1,2,1,0,-1,-2,-1],pulse=[0,1,2,3,2,1,0,0];
function actionPose(id,f){const w=wave[f%8],p=pulse[f%8],pose={right:[7,2,7],left:[-7,2,7],crouch:0,lean:0,head:0,bob:0};
 const work={
 harvest_fruit:()=>({right:[7-w,8,18+p*3],left:[-6,6,9],head:-Number(p>1)}),
 hoe:()=>({right:[3,8+w*3,[16,19,22,7,9,12,15,16][f%8]],left:[-3,5+w*2,[15,17,19,10,11,13,14,15][f%8]],crouch:Math.max(0,2-p),lean:w}),
 sow:()=>({right:[3+w*2,10+p*2,3+p],left:[-5,5,8],crouch:3,head:1}),
 cut_fiber:()=>({right:[8-w*3,10+p,7],left:[-5,11,6],crouch:2,lean:w}),
 weave:()=>({right:[3-w,10,7+p%2],left:[-3+w,10,7+(p+1)%2],crouch:3,head:1}),
 rope:()=>({right:[5+w,10+p,9],left:[-5-w,10-p,9],lean:w}),
 resin:()=>({right:[6,12,12+w*2],left:[-5,7,7],lean:1,head:1}),
 prune:()=>({right:[8-w*2,9,22+p],left:[-6,3,7],head:-1}),
 hew:()=>({right:[3,3+p*3,27-p*6],left:[-2,2+p*3,24-p*6],crouch:p===3?3:0,lean:p===3?2:-1}),
 saw:()=>({right:[5,10+w*3,8],left:[-4,10+w*3,8],crouch:1,lean:w}),
 joinery:()=>({right:[7,9,9+p*3],left:[-5,12,5],crouch:1,lean:Math.max(0,1-p)}),
 cook:()=>({right:[4+w*2,13+p%2,12+p%2],left:[-7,5,7],head:1}),
 ledger:()=>({right:[3+w,11,8+(p%2)],left:[-5,10,6],crouch:2,head:2}),
 honey:()=>({right:[6,10,12+p],left:[-6,7,9],lean:1,head:1}),
 medicinal:()=>({right:[w,12,7+p%2],left:[-5,11,5],crouch:2,head:1}),
 pottery:()=>({right:[4-p%2,11,7+w%2],left:[-4+p%2,11,7-w%2],crouch:3,head:1}),
 net:()=>({right:[6+p,10-w,11],left:[-6-p,10+w,9],head:1}),
 row:()=>({right:[3,7+w*3,12-p],left:[-4,2+w*3,13-p],lean:w*2}),
 repair_boat:()=>({right:[8,10,8+p*3],left:[-4,12,4],crouch:2,lean:1}),
 stitch:()=>({right:[2+w,8,11+p%2],left:[-3,8,9],crouch:2,head:2}),
 bandage:()=>({right:[3+w,13,5+p%2],left:[-3-w,13,5],crouch:4,head:2}),
 negotiate:()=>({right:[8+w,8,12+p],left:[-5,5,8],head:w===2?1:0}),
 climb:()=>({right:[5,3,19+w*3],left:[-5,3,19-w*3],head:-1,climbing:true})
 };
 if(work[id])Object.assign(pose,work[id]());
 if(id==='startle')Object.assign(pose,{right:[9,0,14+f],left:[-9,0,14+f],crouch:[0,0,1,0][f],head:-1});
 if(['sit_down','seated','stand_up','eat','drink','mourn'].includes(id)){pose.crouch=id==='sit_down'?[0,1,2,4,4][f]:id==='stand_up'?[4,4,2,1,0][f]:4;pose.right=[5,7,5];pose.left=[-5,7,5];}
 if(id==='eat'){pose.right=[3,4,9+p*3];pose.left=[-3,6,9];pose.head=1;}
 if(id==='drink'){pose.right=[4,3,9+p*3];pose.left=[-5,3,6];pose.head=p>1?-1:0;}
 if(id==='mourn'){pose.right=[2,2,12];pose.left=[-2,2,12];pose.head=2;pose.crouch=2;}
 if(id==='greet'){pose.right=[9,4,13+p*3];pose.head=w===0?1:0;}
 if(['carry','load','put_down'].includes(id)){let h=10,d=7;if(id==='load'){h=[1,1,3,5,8,10,10,10][f];pose.crouch=[3,3,3,2,1,0,0,0][f];}if(id==='put_down'){h=[10,9,7,5,3,1,1,4][f];pose.crouch=[0,0,1,2,3,3,3,1][f];}pose.left=[-6,d,h];pose.right=[6,d,h];}
 if(id==='hit'){pose.lean=[-2,-3,-2,-1,0][f];pose.head=[-1,1,1,0,0][f];pose.right=[9,-1,10];pose.left=[-9,-1,10];}
 if(id==='death'){pose.crouch=[0,2,4,6,7,8,8,8][f];pose.lean=[-1,-2,0,2,4,5,5,5][f];pose.head=1;pose.fall=f>=4?(f===4?.5:1):0;pose.right=[8,0,10-f];pose.left=[-8,0,10-f];}
 if(id==='sleep'){pose.crouch=8;pose.fall=1;pose.head=f%2;pose.right=[3,0,8];pose.left=[-3,0,8];}
 if(id==='shelter'){pose.crouch=f<3?0:4;pose.head=1;pose.hidden=f>=5&&f<=6;pose.right=[6,0,8];pose.left=[-6,0,8];}
 if(id==='surrender'){pose.right=[9,0,12+f*3];pose.left=[-9,0,12+f*3];pose.crouch=1;pose.head=1;}
 return pose;
}
function combatPose(id,f,role){const p={right:[7,2,7],left:[-7,2,7],tip:[7,5,(['spear','javelin'].includes(OUTFITS[role]?.weapon)?28:18)],crouch:0,lean:0,head:0},guard=['guard_raise','guard_hold','block','guard_break'].includes(id);
 if(guard){const k=id==='guard_raise'?f/3:1;p.left=[-3,4,lerp(7,14,k)];p.right=[7,1,10];if(id==='block'){p.lean=-[1,2,2,1,1,0][f];p.left[1]-=Math.max(0,3-f);}if(id==='guard_break'){p.crouch=[0,1,3,2,1][f];p.left=[-8,0,8];p.head=2;}}
 if(id==='warn'){p.right=[7,5,14+f*3];p.tip=[7,5,32];p.left=[-7,1,9];}
 if(ATTACKS.has(id)){
  const phases=[0,.15,.35,.6,1,1,1,.8,.6,.35,.15,0],a=phases[f],strike=f>=5&&f<=7;
  p.crouch=strike?2:0;p.lean=strike?2:-round(a);p.head=strike?1:0;
  if(id==='spear_thrust'){p.right=strike?[5,17,10]:[7,2-a*7,8+a*3];p.left=strike?[-3,10,10]:[-5,1-a*5,9];p.tip=strike?[5,34,10]:[7,3-a*8,29];}
  if(id==='staff_sweep'){const side=f<5?-10-a*7:f<8?18-(f-5)*2:lerp(16,0,(f-8)/3);p.right=[side*.5,8,11];p.left=[side*.5-6,7,11];p.tip=[side,24,12];}
  if(id==='axe_chop'){p.right=strike?[4,13,6]:[4,1-a*4,10+a*19];p.left=strike?[-2,9,8]:[-2,0,12+a*15];p.tip=strike?[4,19,1]:[4,-3,23+a*14];}
  if(id==='blade_cut'){const side=f<5?-6-a*13:f<8?18-(f-5)*3:lerp(12,0,(f-8)/3);p.right=[side*.5,9,11];p.tip=[side,21,f<5?22:8];p.left=[-8,2,10];}
  if(id==='throw_stone'){p.right=f<5?[6,-2-a*8,12+a*10]:[6,16-(f-5)*2,13-(f-5)*.6];p.tip=[6,25,11];p.left=[-7,2,8];}
  // Recover continuously from the follow-through; never snap back to wind-up.
  if(f>=8){const end=combatPose(id,7,role),rest=combatPose('armed_idle',0,role),t=(f-7)/4;
   for(const key of ['right','left','tip'])p[key]=end[key].map((v,i)=>lerp(v,rest[key][i],t));
   for(const key of ['crouch','lean','head'])p[key]=lerp(end[key],rest[key],t);
  }
 }
 return p;
}
function bodyPoint(x,y,pose,dir){const q=dir==='gauche'?-1:1;let nx=x+pose.lean*q,ny=y+pose.crouch;if(pose.fall){const t=pose.fall,tx=40+(52-y)*.9*q,ty=52+(x-40)*.28;nx=lerp(nx,tx,t);ny=lerp(ny,ty,t);}return [round(nx),round(ny)];}
function colorOf(key,material,palette){return material==='cloth'?palette.cloth[key]:material==='skin'?palette.skin[key]:palette[key];}
function garmentColor(name,key,x,y,role){if(!role||key==='O')return null;const outfit=OUTFITS[role],cut=outfit.cut,shade=(x+y)%5===0?2:x<40?1:0;
 if(name==='torso'&&y>=41&&y<=47){if(cut==='harness')return x===36||x===43||y===46?outfit.trim[shade]:null;if(cut==='vest'&&x>=38&&x<=41)return null;return outfit.cloth[shade];}
 if(name==='cloth'){if(cut==='apron'&&x>=36&&x<=44)return outfit.cloth[shade];if(['coat','shawl','mantle','wrap'].includes(cut))return outfit.cloth[shade];return y<=48?outfit.trim[shade]:null;}
 if(name.endsWith('Arm')&&y<=44&&['tunic','coat','jacket','brigandine','patched','shawl'].includes(cut))return outfit.cloth[shade];return null;
}
// Articulate the approved arm pixels, preserving fur, fingers and native widths.
function drawArm(buffer,shoulder,hand,palette,sleeve,pixels){
 const top=Math.min(...pixels.map(p=>p[1])),bottom=Math.max(...pixels.map(p=>p[1]));
 const crown=pixels.filter(p=>p[1]===top),cx=crown.reduce((a,p)=>a+p[0],0)/crown.length;
 const length=Math.max(2,(bottom-top)/2),dx=hand[0]-shoulder[0],dy=hand[1]-shoulder[1],distance=Math.hypot(dx,dy),reach=Math.min(distance,length*2-.3);
 const ux=distance?dx/distance:0,uy=distance?dy/distance:1;
 hand[0]=round(shoulder[0]+ux*reach);hand[1]=round(shoulder[1]+uy*reach);
 const bend=Math.sqrt(Math.max(0,length*length-reach*reach/4)),sign=dx<0?-1:1;
 const elbow=[round(shoulder[0]+ux*reach/2-uy*bend*sign),round(shoulder[1]+uy*reach/2+ux*bend*sign)];
 const joint=top+length;
 for(const [x,y,key,material] of pixels){const upper=y<=joint,start=upper?shoulder:elbow,end=upper?elbow:hand,angle=Math.atan2(end[1]-start[1],end[0]-start[0])-Math.PI/2,v=y-(upper?top:joint),u=x-cx;
 const px=start[0]+u*Math.cos(angle)-v*Math.sin(angle),py=start[1]+u*Math.sin(angle)+v*Math.cos(angle);
 buffer.set(px,py,sleeve&&upper&&material!=='skin'&&key!=='O'?sleeve:colorOf(key,material,palette));
 }
 return elbow;
}
function outfitDetails(buffer,role,pose,dir){if(!role)return;const o=OUTFITS[role],q=dir==='gauche'?-1:1,p=(x,y)=>bodyPoint(x,y,pose,dir),line=(x,y,a,b,col)=>buffer.line(...p(x,y),...p(a,b),col);
 if(o.cut==='apron'){line(36,43,37,49,o.trim[1]);line(43,43,42,49,o.trim[1]);line(37,49,42,49,o.cloth[2]);}
 if(o.cut==='brigandine'){for(let y=42;y<=46;y+=2)for(let x=36;x<=44;x+=3)buffer.set(...p(x,y),o.trim[2]);}
 if(['coat','jacket','tunic','wrap'].includes(o.cut)){line(40,42,40,47,o.cloth[0]);buffer.set(...p(41,44),o.trim[2]);}
 if(o.cut==='patched'){const a=p(36,44);buffer.rect(a[0],a[1],3,3,o.trim[1]);line(36,45,38,45,o.trim[2]);}
 if(o.cut==='mantle'||o.cut==='shawl'){line(34,41,45,43,o.trim[1]);line(35,42,37,46,o.cloth[2]);}
 const belt=p(35,47);buffer.rect(belt[0],belt[1],11,1,o.trim[0]);buffer.set(...p(40,47),o.trim[2]);
 if(['healer','trader','delegate','scout'].includes(role)){const b=p(44*q+(q<0?80:0),47);buffer.rect(b[0]-1,b[1],4,4,INK);buffer.rect(b[0],b[1],2,3,o.trim[1]);buffer.set(b[0]+1,b[1]+1,o.trim[2]);}
}
function headgear(buffer,hat,dir,headOffset,role){if(!hat)return;const side=dir==='droite'||dir==='gauche',x=40+headOffset[0],y=29+headOffset[1],o=OUTFITS[role];
 if(hat==='straw'){buffer.line(x-10,y+4,x+10,y+4,INK,3);buffer.line(x-9,y+3,x+9,y+3,'#d0ad65',1);buffer.rect(x-5,y-1,11,4,INK);buffer.rect(x-4,y-1,9,3,'#b28d50');buffer.line(x-4,y-1,x+3,y-1,'#e5cc8a');buffer.line(x-4,y+2,x+4,y+2,WOOD[0]);}
 if(hat==='cap'){buffer.ellipse(x,y+1,side?6:8,3,INK);buffer.ellipse(x,y,side?5:7,2,o.cloth[1]);buffer.line(x-6,y+3,x+7,y+3,o.trim[1]);}
 if(hat==='band'){buffer.line(x-7,y+5,x+7,y+5,o.cloth[0],2);buffer.line(x-6,y+4,x+6,y+4,o.cloth[2]);buffer.rect(x+(dir==='gauche'?7:-8),y+5,2,3,o.cloth[1]);}
 if(hat==='helmet'){buffer.ellipse(x,y+1,side?6:8,4,INK);buffer.ellipse(x,y,side?5:7,3,METAL[1]);buffer.line(x-6,y+4,x+6,y+4,o.trim[1]);buffer.line(x-5,y-2,x,y-2,METAL[2]);buffer.rect(x-1,y-3,2,7,o.trim[1]);}
 if(hat==='hood'){buffer.ellipse(x,y+1,side?6:8,4,o.cloth[0]);buffer.line(x-6,y+3,x-6,y+6,o.cloth[1],2);buffer.line(x+6,y+3,x+6,y+6,o.cloth[1],2);buffer.line(x-4,y-1,x+4,y-1,o.cloth[2]);}
}
function shaft(buffer,from,to,type='wood'){buffer.line(...from,...to,INK,3);buffer.line(...from,...to,type==='metal'?METAL[1]:WOOD[1],1);}
function blade(buffer,from,to,width=3){buffer.line(...from,...to,INK,width+2);buffer.line(...from,...to,METAL[1],width);buffer.line(from[0]-1,from[1],to[0]-1,to[1],METAL[2]);}
function tool(buffer,kind,hand,tip,phase=0){const [x,y]=hand,[tx,ty]=tip;
 if(['spear','javelin','staff','club','hoe','oar','axe','hook','scraper','pruning_blade','mallet','needle','caulking_tool','knife','blade','ladle','smoker'].includes(kind)){
  if(['blade','knife','pruning_blade'].includes(kind)){blade(buffer,hand,tip,kind==='blade'?3:1);buffer.line(x-3,y,x+3,y,WOOD[2]);return;}
  shaft(buffer,hand,tip);
  if(['spear','javelin'].includes(kind)){const dx=tx-x,dy=ty-y,k=Math.max(1,Math.hypot(dx,dy)),ux=dx/k,uy=dy/k;blade(buffer,[tx-ux*3,ty-uy*3],[tx+ux*2,ty+uy*2],1);}
  if(kind==='axe'){buffer.rect(tx-3,ty-2,7,5,INK);buffer.rect(tx-3,ty-2,5,4,METAL[1]);buffer.line(tx-3,ty-2,tx-3,ty+1,METAL[2]);}
  if(kind==='hoe'){buffer.line(tx-4,ty,tx+3,ty,INK,3);buffer.line(tx-4,ty-1,tx+3,ty-1,METAL[1]);}
  if(kind==='club')buffer.line(tx,ty-3,tx,ty+2,WOOD[0],5);
  if(kind==='oar')buffer.line(tx,ty-2,tx,ty+3,WOOD[2],3);
  if(kind==='hook'){buffer.line(tx,ty,tx+3,ty,METAL[1]);buffer.line(tx+3,ty,tx+3,ty+3,METAL[1]);}
  if(kind==='mallet')buffer.rect(tx-3,ty-2,7,4,WOOD[1]);
  if(kind==='ladle'){buffer.ellipse(tx,ty,2,1,INK);buffer.set(tx,ty,WOOD[2]);}
  if(kind==='needle'||kind==='scraper'||kind==='caulking_tool')buffer.line(tx-1,ty,tx+1,ty,METAL[2]);
  if(kind==='smoker'){buffer.rect(x-2,y-3,5,5,METAL[0]);buffer.rect(x-1,y-4,3,1,METAL[2]);}
 }
 if(kind==='saw'){buffer.line(...hand,...tip,INK,4);buffer.line(x,y-1,tx,ty-1,METAL[1],2);for(let i=0;i<Math.abs(tx-x);i+=2)buffer.set(Math.min(x,tx)+i,ty+1,METAL[2]);buffer.rect(x-2,y-1,3,3,WOOD[1]);}
 if(['bowl','gourd','jar','stone','basket','crate','ledger','bandage','cloth','mortar','seed_bag'].includes(kind))prop(buffer,kind,x,y,phase);
}
function prop(buffer,kind,x,y,phase=0){
 if(kind==='crate'){buffer.rect(x-6,y-5,13,10,INK);buffer.rect(x-5,y-4,11,8,WOOD[1]);buffer.line(x-5,y-3,x+5,y+3,WOOD[2]);buffer.line(x-5,y+3,x+5,y-3,WOOD[0]);}
 if(kind==='basket'||kind==='seed_bag'){buffer.ellipse(x,y,5,4,INK);buffer.ellipse(x,y,4,3,WOOD[2]);for(let j=-2;j<3;j+=2)buffer.line(x-3,y+j,x+3,y+j,WOOD[1]);}
 if(kind==='bowl'||kind==='mortar'){buffer.ellipse(x,y,5,3,INK);buffer.ellipse(x,y-1,4,1,kind==='bowl'?LINEN[1]:METAL[1]);buffer.line(x-3,y+1,x+3,y+1,WOOD[1]);}
 if(kind==='gourd'||kind==='jar'){buffer.ellipse(x,y,3,4,INK);buffer.ellipse(x,y,2,3,kind==='jar'?WOOD[1]:LINEN[1]);buffer.rect(x-1,y-5,3,2,WOOD[0]);}
 if(kind==='stone'){buffer.ellipse(x,y,2,2,INK);buffer.set(x,y-1,METAL[2]);buffer.set(x-1,y,METAL[1]);}
 if(kind==='ledger'){buffer.rect(x-5,y-3,11,7,INK);buffer.rect(x-4,y-2,9,5,LINEN[2]);buffer.line(x,y-2,x,y+2,WOOD[0]);for(let i=0;i<3;i++)buffer.set(x+2+i%2,y-1+i,WOOD[0]);}
 if(kind==='cloth'||kind==='bandage'){buffer.rect(x-4,y-2,9,5,LINEN[0]);buffer.rect(x-3,y-2,7,4,LINEN[2]);buffer.line(x-3,y+1,x+3,y+1,LINEN[1]);}
}
function shield(buffer,hand,dir,role,impact=0){const side=dir==='droite'||dir==='gauche',x=hand[0],y=hand[1],o=OUTFITS[role]||OUTFITS.warden,rx=side?3:5;buffer.ellipse(x,y,rx,7,INK);buffer.ellipse(x,y,rx-1,6,o.cloth[1]);buffer.line(x,y-5,x,y+5,o.trim[1]);buffer.line(x-rx+1,y,x+rx-1,y,o.trim[1]);buffer.ellipse(x,y,1,2,METAL[1]);if(impact){buffer.line(x-4,y-6,x-6,y-8,LINEN[2]);buffer.line(x+4,y-4,x+7,y-6,LINEN[2]);}}
function workstation(back,front,id,dir,f){const P=(l,d,h)=>project(dir,l,d,h),pt=P(0,14,0),x=pt[0],y=pt[1];
 if(['sit_down','seated','stand_up','eat','drink','mourn','ledger','weave','pottery','stitch'].includes(id)){const b=P(0,-2,1);back.rect(b[0]-9,b[1]-1,19,3,WOOD[0]);back.rect(b[0]-8,b[1]-2,17,2,WOOD[2]);back.rect(b[0]-7,b[1]+2,2,4,WOOD[1]);back.rect(b[0]+5,b[1]+2,2,4,WOOD[1]);}
 if(['hoe','sow','cut_fiber','harvest_fruit','prune'].includes(id)){for(let n=-8;n<=8;n+=4){const a=P(n,16,0);front.line(a[0]-2,a[1],a[0]+2,a[1],WOOD[0]);front.line(a[0],a[1],a[0],a[1]-3,'#738449');}}
 if(['harvest_fruit','prune','resin','honey'].includes(id)){const trunk=P(8,14,0),top=P(8,14,28);back.line(...trunk,...top,INK,5);back.line(...trunk,...top,WOOD[1],3);back.line(top[0]-6,top[1]+5,top[0]+5,top[1]+2,WOOD[1],3);if(id!=='resin'){back.ellipse(top[0],top[1]-1,9,4,'#4c6337');for(const dl of [-5,2,6]){const a=P(8+dl,14,28);back.ellipse(a[0],a[1]+1,1,1,'#cb8d4b');}}if(id==='honey'){const h=P(7,14,13);back.ellipse(h[0],h[1],4,5,WOOD[0]);for(let i=-3;i<=3;i+=2)back.line(h[0]-3,h[1]+i,h[0]+3,h[1]+i,WOOD[2]);}}
 if(['hew','saw','joinery','repair_boat'].includes(id)){front.ellipse(x,y-2,10,4,INK);front.ellipse(x,y-3,9,3,WOOD[1]);front.line(x-7,y-4,x+7,y-2,WOOD[2]);if(id==='saw'){front.line(x-7,y,x-9,y+4,WOOD[0],2);front.line(x+7,y,x+9,y+4,WOOD[0],2);}if(id==='joinery')front.rect(x+4,y-7,2,4,LINEN[1]);}
 if(['cook','medicinal','pottery','ledger','stitch','weave'].includes(id)){const a=P(0,13,4);if(id==='cook'){front.ellipse(a[0],a[1]+4,7,3,WOOD[0]);front.ellipse(a[0],a[1],6,4,INK);front.ellipse(a[0],a[1]-1,5,2,METAL[1]);front.ellipse(a[0],a[1]-2,4,1,'#85965d');}if(id==='medicinal')prop(front,'mortar',...a,f);if(id==='ledger')prop(front,'ledger',...a,f);if(id==='stitch')prop(front,'cloth',...a,f);if(id==='weave')prop(front,'basket',...a,f);if(id==='pottery'){front.ellipse(a[0],a[1]+4,8,2,WOOD[0]);front.line(a[0],a[1]+4,a[0],a[1]+8,WOOD[1],2);front.ellipse(a[0],a[1],3+(f%2),4,'#af7f5c');front.line(a[0]-2,a[1]-2,a[0]+2,a[1]-2,'#dab084');}}
 if(id==='rope'){for(const l of [-12,12]){const a=P(l,13,0),b=P(l,13,12);front.line(...a,...b,WOOD[1],2);}const a=P(-12,13,10),b=P(12,13,10);front.line(...a,...b,LINEN[1]);}
 if(id==='net'){const a=P(-11,16,2),b=P(11,16,2);for(let i=0;i<4;i++)front.line(a[0],a[1]-i*2,b[0],b[1]-i*2,LINEN[0]);for(let i=0;i<7;i++){const t=i/6;front.line(lerp(a[0],b[0],t),lerp(a[1],b[1],t),lerp(a[0],b[0],t),lerp(a[1],b[1],t)-6,LINEN[1]);}}
 if(id==='row'||id==='repair_boat'){const a=P(0,0,-2);back.ellipse(a[0],a[1]+2,dir==='face'||dir==='dos'?11:19,5,WOOD[0]);back.ellipse(a[0],a[1],dir==='face'||dir==='dos'?10:18,3,WOOD[1]);back.line(a[0]-7,a[1],a[0]+7,a[1],WOOD[2]);}
 if(id==='bandage'){const a=P(0,17,1);front.ellipse(a[0],a[1],8,3,LINEN[0]);front.rect(a[0]-2,a[1]-2,4,4,LINEN[2]);}
 if(id==='sleep'){back.rect(26,50,34,7,LINEN[0]);back.rect(27,50,32,5,LINEN[1]);for(let x=28;x<58;x+=3)back.line(x,50,x,54,LINEN[2]);}
 if(id==='climb'){for(const l of [-7,7]){const a=P(l,-2,0),b=P(l,-2,34);back.line(...a,...b,WOOD[0],3);back.line(...a,...b,WOOD[1]);}for(let h=2;h<35;h+=5){const a=P(-7,-2,h),b=P(7,-2,h);back.line(...a,...b,WOOD[2],2);}}
}
function equipmentFor(id,role,pose,f,dir,options){let kind=null,tip=null;const r=pose.right,l=pose.left,w=wave[f%8],p=pulse[f%8],outfit=OUTFITS[role];
 const tools={harvest_fruit:'hook',hoe:'hoe',sow:'seed_bag',cut_fiber:'knife',resin:'scraper',prune:'pruning_blade',hew:'axe',saw:'saw',joinery:'mallet',cook:'ladle',ledger:'needle',honey:'smoker',medicinal:'staff',stitch:'needle',bandage:'bandage',repair_boat:'caulking_tool',row:'oar',eat:'bowl',drink:'gourd',negotiate:'ledger'};
 if(tools[id])kind=tools[id];
 if(['carry','load','put_down'].includes(id))return {kind:'crate',central:true,tip:null};
 if(id==='spear_thrust')kind='spear';if(id==='staff_sweep')kind='staff';if(id==='axe_chop')kind=outfit?.weapon==='club'?'club':'axe';if(id==='blade_cut')kind='blade';if(id==='throw_stone')kind=role==='scout'?'javelin':'stone';
 if(['armed_idle','armed_walk','warn','guard_raise','guard_hold','block','guard_break'].includes(id))kind=outfit?.weapon||'spear';
 if(id==='surrender'||id==='death')return {kind:null,dropped:outfit?.weapon||'blade'};
 if(kind){tip=pose.tip||[r[0],r[1]+4,r[2]+(kind==='spear'||kind==='javelin'?21:kind==='blade'?10:kind==='club'?10:8)];
  if(id==='hoe')tip=[r[0],18,[12,18,20,0,4,8,12,12][f%8]];
  if(id==='hew')tip=[r[0],16,[35,32,24,1,4,12,25,32][f%8]];
  if(id==='saw')tip=[r[0],r[1]+15,r[2]];
  if(id==='joinery'||id==='repair_boat')tip=[r[0],15,[12,17,22,2,5,10,13,13][f%8]];
  if(id==='cook')tip=[w,15,3+p%2];
  if(id==='ledger')tip=[w,13,5];
  if(id==='medicinal')tip=[w,13,4];
  if(id==='stitch')tip=[-1,10,8];
  if(id==='resin')tip=[8,15,12+w*2];
  if(id==='prune')tip=[8-w,14,24];
  if(id==='row')tip=[r[0],r[1]+12,-1+p];
 }
 return {kind,tip,released:id==='throw_stone'&&f>=5};
}
function renderLayers(options={}){
 const {action='idle',dir:direction='face',frame=0,sex='male',tone='brun',role=null,equipment=true,outfit=true,scene=true,smear=true}=options,dir=Base.directionName(direction),c=clip(action);
 if(!Number.isInteger(frame)||frame<0||frame>=c.frames)throw RangeError('Frame hors limite');if(role&&!OUTFITS[role])throw RangeError('Fonction inconnue');
 const pal=Base.paletteFor(tone),armed=c.family==='combat',walking=['walk','flee','armed_walk','carry'].includes(action),baseAction=walking?(action==='flee'?'flee':'walk'):action==='talk'?'talk':'idle',baseFrame=frame%Base.CLIPS[baseAction].durations.length,base=Base.renderLayers(baseAction,dir,baseFrame,sex),simple=Object.hasOwn(Base.CLIPS,action),pose=armed&&action!=='surrender'?combatPose(action,frame,role):actionPose(action,frame);
 const L={rearProps:new Pixels(),rearArms:new Pixels(),rearEquipment:new Pixels(),body:new Pixels(),clothing:new Pixels(),headgear:new Pixels(),arms:new Pixels(),equipment:new Pixels(),frontProps:new Pixels(),smear:new Pixels(),rearSmear:new Pixels(),effects:new Pixels()};
 const projectedR=project(dir,...pose.right),projectedL=project(dir,...pose.left);let hands={right:projectedR,left:projectedL},elbows={},headOffset=[0,0];
 if(scene)workstation(L.rearProps,L.frontProps,action,dir,frame);
 // Restore hidden trunk volume only when moving arms away from the approved body.
 if(!simple){const side=dir==='droite'||dir==='gauche',cx=40,cy=44,w=side?8:12;for(let y=41;y<=48;y++)for(let x=cx-w/2;x<=cx+w/2;x++){const pt=bodyPoint(x,y,pose,dir);L.body.set(...pt,(x===cx-w/2||x===cx+w/2)?INK:pal.F);}}
 for(const name of base.order){if(!simple&&name.endsWith('Arm'))continue;for(const [nx,ny,key,material]of base.layers[name]){
  let x=nx+16,y=ny+16;if(!simple){if(name.endsWith('Leg')){y=round(lerp(y,52,Math.min(1,pose.crouch/9)));if(pose.climbing){const sign=name==='leftLeg'?1:-1;y-=Math.max(0,sign*wave[frame%8]*3);}}else{[x,y]=bodyPoint(x,y,pose,dir);if(name==='head')y+=pose.head||0;}if(pose.fall&&name.endsWith('Leg'))[x,y]=bodyPoint(x,y,{...pose,crouch:0},dir);}
  L.body.set(x,y,colorOf(key,material,pal));const cloth=outfit?garmentColor(name,key,nx+16,ny+16,role):null;if(cloth)L.clothing.set(x,y,cloth);
 }}
 if(!simple){for(const [name,side]of [['rightArm','right'],['leftArm','left']]){const pixels=base.layers[dir==='dos'?(name==='rightArm'?'leftArm':'rightArm'):name],min=Math.min(...pixels.map(p=>p[1])),top=pixels.filter(p=>p[1]===min),shoulder=[round(top.reduce((a,p)=>a+p[0],0)/top.length)+16,min+16];const s=bodyPoint(...shoulder,pose,dir),hand=bodyPoint(...hands[side],{...pose,crouch:0},dir);hands[side]=hand;const behind=dir==='dos'||(dir==='droite'&&side==='left')||(dir==='gauche'&&side==='right');elbows[side]=drawArm(behind?L.rearArms:L.arms,s,hand,pal,outfit&&role&&['tunic','coat','jacket','brigandine','patched','shawl'].includes(OUTFITS[role].cut)?OUTFITS[role].cloth[1]:null,pixels);}}
 else{for(const [name,side]of [['rightArm','right'],['leftArm','left']]){const pixels=base.layers[name].filter(p=>p[3]==='skin');if(pixels.length){const bottom=Math.max(...pixels.map(p=>p[1])),ps=pixels.filter(p=>p[1]>=bottom-1);hands[side]=[round(ps.reduce((a,p)=>a+p[0],0)/ps.length)+16,round(ps.reduce((a,p)=>a+p[1],0)/ps.length)+16];}}}
 if(outfit&&role){outfitDetails(L.clothing,role,pose,dir);const minHeadY=Math.min(...base.layers.head.map(p=>p[1]))+16;headOffset=simple?[0,minHeadY-(sex==='female'?28:27)]:[round(pose.lean*(dir==='gauche'?-1:1)),pose.crouch+(pose.head||0)+minHeadY-(sex==='female'?28:27)];if(!pose.fall)headgear(L.headgear,OUTFITS[role].hat,dir,headOffset,role);}
 const eq=equipmentFor(action,role,pose,frame,dir,options);let tip=eq.tip?project(dir,...eq.tip):null;
 if(equipment){
  if(eq.central)prop(L.equipment,'crate',round((hands.left[0]+hands.right[0])/2),round((hands.left[1]+hands.right[1])/2),frame);
  else if(eq.kind&&!eq.released)tool(dir==='dos'||dir==='gauche'?L.rearEquipment:L.equipment,eq.kind,hands.right,tip||[hands.right[0],hands.right[1]-8],frame);
  if(['weave','net','rope','stitch','pottery'].includes(action)){L.equipment.line(...hands.left,...hands.right,action==='net'?LINEN[0]:LINEN[1]);if(action==='stitch')prop(L.equipment,'cloth',...hands.left,frame);}
  if(action==='eat')prop(L.equipment,'bowl',...hands.left,frame);
  const hasShield=OUTFITS[role]?.shield||['guard_raise','guard_hold','block','guard_break'].includes(action);
  if(hasShield&&armed&&!['surrender'].includes(action))shield(dir==='dos'||dir==='droite'?L.rearEquipment:L.equipment,hands.left,dir,role,action==='block'&&frame<=2);
  if(eq.dropped&&frame>=(action==='death'?4:2)){const a=project(dir,11,9,0);tool(L.frontProps,eq.dropped,a,[a[0]+10,a[1]+1],frame);}
 }
 if(smear&&ATTACKS.has(action)&&c.activeFrames.includes(frame)&&equipment&&action!=='throw_stone'){
  const smearLayer=dir==='dos'||dir==='gauche'?L.rearSmear:L.smear;const prior=combatPose(action,Math.max(0,frame-1),role),previous=project(dir,...prior.tip),current=tip,mid=[round((previous[0]+current[0])/2),round((previous[1]+current[1])/2)-1];smearLayer.line(...previous,...mid,LINEN[1],3);smearLayer.line(...mid,...current,LINEN[2],2);smearLayer.line(...previous,...current,METAL[2]);
 }
 if(action==='sow'&&frame>=3&&frame<=5){const a=project(dir,3,15,0);L.effects.set(a[0]+frame-4,a[1],LINEN[2]);}
 if(action==='honey'&&frame%2){const a=hands.right;L.effects.rect(a[0],a[1]-9-frame%3,2,1,'#a4aba2');}
 const hidden=!!pose.hidden;if(hidden)for(const k of ['body','clothing','headgear','arms','rearArms','rearEquipment','equipment'])L[k]=new Pixels();
 return {width:80,height:80,layers:Object.fromEntries(Object.entries(L).map(([k,v])=>[k,v.values()])),order:['rearProps','rearSmear','rearEquipment','rearArms','body','clothing','headgear','arms','frontProps','smear','equipment','effects'],metadata:{action,dir,frame,sex,tone,role,hands,elbows,toolTip:tip,tool:equipment?eq.kind:null,toolReleased:!!eq.released,active:c.activeFrames.includes(frame),visible:!hidden,markers:c.markers.filter(m=>m.frame===frame).map(m=>m.id),contact:c.contact,navigationRequired:c.navigationRequired,rootMotion:false,clippedPixels:Object.values(L).reduce((a,v)=>a+v.outside,0)}};
}
function raster(options={}){const r=renderLayers(options),data=new Uint8ClampedArray(80*80*4),which=options.layer?[options.layer]:r.order;for(const name of which){if(!r.layers[name])throw RangeError('Calque inconnu');for(const [x,y,color]of r.layers[name]){const n=parseInt(color.slice(1),16),i=(y*80+x)*4;data[i]=n>>16;data[i+1]=n>>8&255;data[i+2]=n&255;data[i+3]=255;}}return {width:80,height:80,data,metadata:r.metadata};}
function draw(ctx,options={}){const r=renderLayers(options);ctx.imageSmoothingEnabled=false;const x=round(options.x||0),y=round(options.y||0);for(const name of options.layer?[options.layer]:r.order){if(!r.layers[name])throw RangeError('Calque inconnu');for(const [px,py,color]of r.layers[name]){ctx.fillStyle=color;ctx.fillRect(x+px,y+py,1,1);}}return r.metadata;}
class Atlas{constructor({canvasFactory,maxFrames=192}={}){this.canvasFactory=canvasFactory||((w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c;});this.maxFrames=maxFrames;this.cache=new Map();}
 get(options={}){const key=JSON.stringify(options);if(this.cache.has(key))return this.cache.get(key);const cv=this.canvasFactory(80,80);draw(cv.getContext('2d'),options);this.cache.set(key,cv);while(this.cache.size>this.maxFrames)this.cache.delete(this.cache.keys().next().value);return cv;}
 draw(ctx,actor,time=0,state={}){const action=state.action||'idle',dir=actor.dir??2,frame=state.frame??frameAt(action,state.elapsed??time,state.distance),cv=this.get({...state,action,dir,frame});ctx.imageSmoothingEnabled=false;ctx.drawImage(cv,round(actor.x)-40,round(actor.y-(actor.z||0))-52);return cv;}
 clear(){this.cache.clear();}}
function tryBlock({role,state,actor,source,sameLevel,lineClear,unblockable=false,heavy=false}){
 if(!OUTFITS[role]?.shield||!state||!actor||!source||unblockable||!sameLevel||!lineClear||actor.dead||actor.stun>0||!['guard_hold','block'].includes(state.action)||(state.guardRaise||0)>0||state.guardHold===0||(state.blockCount||0)>=2)return {blocked:false};
 const dir=Base.directionName(actor.dir??2),v={face:[0,1],dos:[0,-1],droite:[1,0],gauche:[-1,0]}[dir],dx=source.x-actor.x,dy=source.y-actor.y,len=Math.hypot(dx,dy)||1;if((v[0]*dx+v[1]*dy)/len<=.25)return {blocked:false};
 if(heavy||source.combo===3){state.guardHold=0;state.action='guard_break';actor.stun=.85;return {blocked:false,guardBreak:true,stun:.85};}state.blockCount=(state.blockCount||0)+1;state.action='block';return {blocked:true,blood:false,impactRecovery:.34};
}
return {VERSION:'2.0.0',Base,SPECS,ROLE_INFO,OUTFITS,CLIPS,frameAt,eventsBetween,project,renderLayers,raster,draw,Atlas,tryBlock,isAttack:id=>ATTACKS.has(id)};
});
