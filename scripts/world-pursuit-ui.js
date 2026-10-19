/* Five small seals inside the location card; the map explains each authority. */
(()=>{
 const hud=Renderer.prototype.hud;
 Renderer.prototype.hud=function(){
  hud.call(this);this.pursuitReadout=null;const g=this.g;if(!g.pursuitStatus||g.dialogue||g.journey||g.dead||g.dying||g.sleeping)return;
  const a=g.pursuitStatus();if(!a.zone)return;const c=this.c,max=Math.max(70,Math.min(144,this.W-(this.safe.l||0)-(this.safe.r||0)-80)),w=48,x=(this.safe.l||0)+5+max-w,y=this.top+12,color=a.level?'#e5a071':'#9dad94';
  c.save();if(a.level){const left=(this.safe.l||0)+7;c.font='6px PixelUI, monospace';box(c,left,y,max-52,8,'#1b1715');travelText(c,travelFit(c,a.zone.authorityName,max-52),left,y+1,color);}
  box(c,x,y,w,8,'#1b1715');travelText(c,'R'+a.level,x+1,y+1,color,5);
  for(let i=0;i<5;i++){box(c,x+13+i*7,y+2,4,4,i<a.level?color:'#51463b');if(i<a.level)box(c,x+14+i*7,y+2,2,1,'#f4d5aa');}c.restore();this.pursuitReadout={x,y:this.top+3,w,h:19,...a};
  if(typeof updatePursuitButton==='function')updatePursuitButton(this);
 };
})();
function renderPursuitRegions(){
 const el=$('pursuitRegions');if(!el)return;const j=game.worldState.justice,s=game.worldState.simulation,current=game.pursuitStatus();
 const species={human:'humain',batracien:'batracien',goblin:'gobelin',orc:'orc',serpentfolk:'peuple serpent',ape_folk:'peuple singe',unknown:'espèce non identifiée'};
 el.innerHTML=j.zones().sort((a,b)=>a.region-b.region).map(z=>{const a=j.alert(z.sites[0],game.clock),missions=s.state.missions.filter(m=>m.status!=='returned'&&j.zone(m.site)?.id===z.id),victims=a.cases.map(c=>{const v=c.knownVictimInfo||c.victimInfo||{};return (v.name||c.victim)+' · '+(v.role==='guard'?'garde':'civil')+' · '+(species[v.species]||'espèce non identifiée')+' · '+({assault:'agression',grave_injury:'blessure grave',murder:'meurtre'}[c.knownKind||c.kind]);});
  return '<article'+(z.id===current.zone?.id?' class="pursuit-current"':'')+'><strong>'+atlasEscape(z.territory+' · '+z.name)+'</strong><p>'+atlasEscape(z.authorityName)+' — '+a.level+'/5 · '+atlasEscape(a.label)+'</p>'+(a.level?'<p>'+missions.filter(m=>m.kind==='justice_patrol').length+' patrouille(s) routière(s) · '+missions.filter(m=>m.kind==='justice').length+' équipe(s) d’intervention · fin des mandats dans '+atlasDuration(a.until-game.clock)+'.</p><p>'+atlasEscape(victims.join(' ; '))+'</p><p>'+missions.filter(m=>m.kind==='justice_mail'&&!m.deliveredAt).length+' messager(s) en route. Chaque poste doit recevoir le signalement avant de rechercher Kaldor.</p>':'')+'</article>';
 }).join('');
}
function updatePursuitButton(r=renderer){
 const b=document.getElementById('pursuitButton');if(!b?.style)return;const a=r.pursuitReadout,show=state==='playing'&&a&&!game.dialogue&&!game.journey&&!game.dead&&!game.dying&&!game.sleeping;b.hidden=!show;if(!show)return;
 const canvas=$('game').getBoundingClientRect(),screen=$('screen').getBoundingClientRect(),sx=canvas.width/r.W,sy=canvas.height/r.H;
 b.style.left=(canvas.left-screen.left+a.x*sx)+'px';b.style.top=(canvas.top-screen.top+a.y*sy)+'px';b.style.width=a.w*sx+'px';b.style.height=Math.max(44,a.h*sy)+'px';
 const label='Recherche : '+a.level+' sur 5, '+a.zone.name+', '+a.zone.authorityName+'. Voir les autorités.';if(b.getAttribute('aria-label')!==label)b.setAttribute('aria-label',label);
}
function installPursuitUI(){
 const b=$('pursuitButton');if(!b?.style)return;
 b.onclick=()=>{openWorldPanel();if(state==='world'){$('worldPursuit').open=true;$('worldPursuit').querySelector('summary').focus();}};
 const refresh=refreshWorldPanel;refreshWorldPanel=function(...args){const out=refresh(...args);renderPursuitRegions();return out;};
 const sync=syncDialogue;syncDialogue=function(...args){const out=sync(...args);updatePursuitButton();return out;};
}
