/* Codex / ChatGPT — spoken reports retain the existing knowledge/rumour limits.
 * The journal keeps precise event records; people speak about what they heard.
 */
const WorldDialogue=(()=>{
 'use strict';
 const reports={
  crime_scene:'des morts ont été découverts. Les gens cherchent encore ce qui s’est passé.',
  massacre:'plusieurs personnes ont été tuées. La garde a été prévenue ; les nouvelles sont encore incomplètes.',
  bandits:'des brigands arrêtent les voyageurs. Je ne partirais pas seul.',
  patrol:'des gardes font la ronde. C’est plutôt rassurant, mais garde les yeux ouverts.',
  siege:'la place est assiégée. Évite de t’en approcher pour le moment.',
  occupation:'des hommes armés tiennent le passage. Mieux vaut se renseigner avant d’y aller.',
  truce:'les deux camps ont cessé de se battre. Pourvu que ça tienne.',
  border:'on ne laisse plus passer les gens comme avant. Demande au poste avant de faire le détour.',
  flood:'l’eau a coupé le passage. Attends qu’elle baisse.',landslide:'des pierres sont tombées sur le chemin. On ne passe plus.',
  avalanche:'la neige a emporté une partie du chemin. Ce serait imprudent d’y aller.',fire:'un incendie a coupé le passage. Tiens-toi à l’écart.',
  bridge:'le pont est abîmé. Ne compte pas le traverser.',repair:'le passage est de nouveau praticable.',
  shortage:'on manque de provisions. Les prix ont dû grimper.',caravan:'une caravane est arrivée. Il devrait y avoir du ravitaillement.',
  market:'le marché se tient. C’est le moment de refaire tes provisions.',festival:'on prépare une fête. Ça changera un peu les idées aux gens.',
  missing:'quelqu’un a disparu. Les proches cherchent encore des nouvelles.',funeral:'on enterre un habitant. Les gens n’ont pas le cœur à parler.',
  ruler:'il y a eu un changement à la tête du pouvoir. On verra ce que ça donnera.',
  storm:'les bateaux restent à quai à cause du mauvais temps.',delay:'les départs ont du retard. Prévois de patienter.',relay:'le relais est fermé. Ne pars pas en comptant y dormir.',
  curse:'les gens ont vu des choses inquiétantes. Même les habitués évitent le coin.',purified:'les manifestations ont cessé. Les gens osent revenir.',
  liberated:'des captifs ont été libérés. Il y en avait qui n’espéraient plus sortir.',victory:'le groupe qui menaçait le passage a été défait.',
  theft:'il y a eu un vol. Garde ta bourse près de toi.',rescued:'des gens ont reçu de l’aide. Ça aurait pu mal finir.',discovery:'un passage a été découvert. Ça pourrait raccourcir la route.',
  rain:'il pleut depuis un moment. Les chemins doivent être bien lourds.',snow:'la neige tombe. Prends de quoi te couvrir si tu y vas.',
  fog:'on n’y voit pas loin avec ce brouillard. Reste sur le chemin.',drought:'l’eau commence à manquer. Remplis tes gourdes dès que tu peux.',
  injury:'une blessure demande des soins. On ferait bien de faire une halte.',exhaustion:'la fatigue commence à peser. Il faut se reposer.',trust:'le voyage nous a rapprochés. On peut compter les uns sur les autres.'
 };
 function place(event){const road=Atlas.roadById[event.target],site=Atlas.byId[event.target];return road?'Sur « '+road.name+' », ':site?'Du côté de '+site.name+', ':'Dans les environs, ';}
 function spoken(event){
  const ended={bandits:'on dit que les brigands ne tiennent plus le passage.',patrol:'la ronde des gardes est terminée.',siege:'le siège est terminé. Les nouvelles recommencent à circuler.',occupation:'l’occupation a pris fin, à ce qu’on m’a dit.',bridge:'le passage a été rétabli, d’après les dernières nouvelles.',flood:'on peut de nouveau passer, à ce qu’on m’a dit.',shortage:'le ravitaillement a repris.',storm:'les bateaux peuvent de nouveau partir.'};
  let line=event.resolved?place(event)+(ended[event.type]||'on m’a dit que les choses étaient rentrées dans l’ordre.'):place(event)+(reports[event.type]||'il s’est passé quelque chose. Je n’en sais pas assez pour te conseiller.');
  if(event.uncertain)return line+' Mais ça date ; je ne sais pas si c’est encore le cas.';
  if(event.resolved)return line;
  if(event.source==='Témoin direct')return line+' Je l’ai vu moi-même.';
  if(/garde/i.test(event.source||''))return line+' C’est un garde qui en a parlé.';
  return line;
 }
 const learn=Game.prototype.atlasNews;
 Game.prototype.atlasNews=function(n){
  learn.call(this,n);const news=this.worldState.news(n.id,this.clock),w=Atlas.toWorld(n.x,n.y);
  const priority=e=>(!e.resolved&&['bandits','siege','occupation','curse','bridge','border','flood','avalanche','fire','landslide'].includes(e.type)?100:0)+(!e.uncertain?10:0)-Math.hypot((Atlas.byId[e.target]||{}).x-w.x||0,(Atlas.byId[e.target]||{}).y-w.y||0)/10000;
  news.sort((a,b)=>priority(b)-priority(a)||b.at-a.at);
  return news.length?news.slice(0,3).map(spoken):['Pas grand-chose de neuf à te raconter. Si tu pars loin, demande aussi aux gens du prochain relais.'];
 };
 Game.prototype.npcDirections=function(n){
  const w=Atlas.toWorld(n.x,n.y),site=Atlas.byId[n.site]||Atlas.nearestSite(w.x,w.y),book=this.worldState.news(n.id,this.clock);
  const roads=Atlas.roads.filter(r=>r.type!=='searoutes'&&Atlas.roadCells(r).some(c=>c.region===site.region));
  roads.sort((a,b)=>Math.min(...a.pts.map(p=>Math.hypot(p[0]-w.x,p[1]-w.y)))-Math.min(...b.pts.map(p=>Math.hypot(p[0]-w.x,p[1]-w.y))));
  const lines=roads.slice(0,3).map(r=>{
   const known=book.filter(e=>e.target===r.id&&!e.resolved),fresh=known.filter(e=>!e.uncertain),closed=fresh.find(e=>Atlas.EVENT_TYPES[e.type].closed),risk=clamp(r.danger+fresh.reduce((sum,e)=>sum+(Atlas.EVENT_TYPES[e.type].risk||0),0),0,5),prefix='Pour « '+r.name+' », ';
   if(closed)return prefix+'on m’a signalé un passage coupé. Renseigne-toi au relais avant de t’engager.';
   if(fresh.some(e=>e.type==='bandits'))return prefix+'évite de partir seul : des voyageurs y ont été arrêtés par des brigands.';
   if(risk>=3)return prefix+'c’est un trajet exposé. Je chercherais de la compagnie pour le faire.';
   if(fresh.some(e=>e.type==='patrol'))return prefix+'les gardes passent en ce moment. Profite de leur ronde si tu peux.';
   if(known.some(e=>e.uncertain))return prefix+'j’ai entendu des histoires, mais rien de récent. Demande à quelqu’un qui en revient.';
   if(risk>=2)return prefix+'reste sur le chemin et évite de traîner après la tombée du jour.';
   return prefix+'je n’ai rien entendu d’inquiétant récemment. Ça ne veut pas dire qu’il ne peut rien arriver.';
  });return lines.length?lines:['Je connais surtout les abords d’ici. Un voyageur au relais pourra mieux te guider.'];
 };
 return Object.freeze({spoken});
})();
