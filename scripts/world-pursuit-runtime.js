/* Actor identity, legal borders and escalating, finite responses. */
(()=>{
 Game.prototype.justiceTerritorialSite=function(actor=this.player){
  const p=Atlas.toWorld(actor.x,actor.y),tx=Math.floor(p.x),ty=Math.floor(p.y),cached=actor._justiceTerritorial;if(cached&&cached.x===tx&&cached.y===ty)return cached.site;const local=Atlas.siteAt(p.x,p.y);if(local?.rest){actor._justiceTerritorial={x:tx,y:ty,site:local.id};return local.id;}const cell=Atlas.cellAt(p.x,p.y),region=cell?.region;
  const choices=Atlas.nodes.filter(n=>n.rest&&n.region===region);if(!choices.length)return null;
  const id=choices.reduce((best,n)=>!best||Math.hypot(n.x-p.x,n.y-p.y)<Math.hypot(best.x-p.x,best.y-p.y)?n:best,null)?.id;actor._justiceTerritorial={x:tx,y:ty,site:id};return id;
 };
 const site=Game.prototype.justiceSite;
 Game.prototype.justiceSite=function(n=this.player){return n!==this.player&&(n.eventGuard||n.convoyGuard||n.batracien?.role)?site.call(this,n):this.justiceTerritorialSite(n)||site.call(this,n);};
 Game.prototype.justiceIdentity=function(n={}){
  const sim=this.worldState.simulation,event=this.worldState.events.find(e=>e.id===n.eventId),band=n.campaignGroup&&sim?.state.bands[n.campaignGroup],siteId=n.site||n.batracien?.site||this.justiceSite(n),post=sim?.state.sites[siteId];
  return {id:n.id,name:n.name||n.label||n.id,species:n.species||n.civilian?.appearance?.species||(n.batracien?'batracien':'human'),role:n.eventGuard||n.convoyGuard||n.batracien?.role?'guard':'civilian',affiliation:n.affiliation||n.faction||n.clan||post?.authority||'',network:n.criminalNetwork||event?.bandKey||band?.event||'',loyalty:this.party.some(c=>c.id===n.id)||n.playerAlly?'player':'independent'};
 };
 const witnesses=Game.prototype.justiceWitnesses;
 Game.prototype.justiceWitnesses=function(n){return witnesses.call(this,n).map(w=>({...w,identity:this.justiceIdentity(this.npcs.find(a=>a.id===w.id))}));};
 const report=Game.prototype.fileJusticeStatement;
 Game.prototype.fileJusticeStatement=function(id,witness,at=this.clock,contact=null){
  const j=this.worldState.justice,c=j.state.cases.find(c=>c.id===id),n=this.npcs.find(a=>a.id===witness),before=c?j.alert(c.site,at).level:0;
  if(c&&n&&!j.canReport(c,this.justiceIdentity(n)).allowed)return false;
  const result=report.call(this,id,witness,at,contact);if(!result||!c)return result;
  const after=j.alert(c.site,at);if(after.level>before&&after.level>=2)this.emit('notice',{title:'Recherche · niveau '+after.level+'/5',text:after.zone.authorityName+' : '+after.label+(after.guardsKilled?' · '+after.guardsKilled+' garde(s) tué(s) identifié(s).':'.')});
  return result;
 };
 Game.prototype.justiceAuthorized=function(n){
  const j=this.worldState.justice,here=j.zone(this.justiceTerritorialSite()||this.justiceSite()),post=j.zone(this.justiceSite(n));
  return !!here&&here.id===post?.id;
 };
 const arrest=Game.prototype.canJusticeArrest;
 Game.prototype.canJusticeArrest=function(n){return !!n&&this.justiceAuthorized(n)&&arrest.call(this,n);};
 for(const name of ['isHostileHumanGuard','isHostileBatracien']){const native=Game.prototype[name];Game.prototype[name]=function(n){const hostile=native.call(this,n);if(!hostile||!this.isJusticeGuard(n)||this.justiceAuthorized(n))return hostile;return (n.guardState?.hostileUntil||n.batracien?.hostileUntil||0)>this.clock;};}
 Game.prototype.pursuitStatus=function(){
  const j=this.worldState.justice,site=this.justiceTerritorialSite()||this.justiceSite(),a=j.alert(site,this.clock),s=this.worldState.simulation;
  const missions=(s?.state.missions||[]).filter(m=>['justice','justice_patrol'].includes(m.kind)&&m.status!=='returned'&&j.zone(m.site)?.id===a.zone?.id);
  return {...a,site,patrols:missions.filter(m=>m.kind==='justice_patrol').length,squads:missions.filter(m=>m.kind==='justice').length,seen:j.state.sightings[site]?.at,guardReserve:a.zone?.sites.reduce((n,id)=>n+(s?.state.sites[id]?.guardAvailable||0),0)||0};
 };
 const update=Game.prototype.update;
 Game.prototype.update=function(dt,input){const out=update.call(this,dt,input);if(!this.dialogue&&!this.dead&&!this.dying)this.worldState.simulation?.justiceInfrastructure(this.clock);return out;};
})();
