/* One clock for warning, fear and mobilization. No new inhabitants are invented. */
(()=>{
 const alive=n=>n&&!n.dead&&!n.civilian?.dead&&!n.batracien?.dead&&!n.guardState?.dead;
 const frame=Renderer.prototype.frame;
 Renderer.prototype.frame=function(){const result=frame.call(this);this.g.justiceView={x:this.cam.x,y:this.cam.y,w:this.W,h:this.H-this.top};return result;};
 Game.prototype.justiceSpawnOffscreen=function(p){
  const v=this.justiceView||{x:this.player.x-240,y:this.player.y-160,w:480,h:320},margin=64;
  if(Math.hypot(this.player.x-v.x-v.w/2,this.player.y-v.y-v.h/2)>Math.max(v.w,v.h))return false;
  const outside=(x,y,w,h)=>p.x<x-margin||p.x>x+w+margin||p.y<y-margin||p.y>y+h+margin;
  return outside(v.x,v.y,v.w,v.h)&&outside(this.player.x-v.w/2,this.player.y-v.h/2,v.w,v.h);
 };
 // A warrant targets the player, not the surrounding population. Quiet law
 // guards are not a new civilian danger after the crime's fear has expired.
 Game.prototype.justiceCivilianThreat=function(n){
  if(!n.batracien?.role||!this.isJusticeGuard(n)||!this.justiceEffect(n).wanted)return true;
  return n.wind>0||n.attack>0||!!this.npcMoveLocked(n);
 };
 Game.prototype.refreshJusticeFear=function(force=false){
  const j=this.worldState?.justice;if(!j?.state.cases.length)return;
  if(!force&&this.time<(this._justiceFearAt||0)&&this._justiceFearClock===this.clock)return;
  if(!force&&this.time<(this._justiceFearAt||0)&&Math.abs(this.clock-(this._justiceFearClock||0))<1)return;
  this._justiceFearAt=this.time+.5;this._justiceFearClock=this.clock;
  for(const n of this.npcs){
   if(!alive(n)||this.civilianProtected(n)||this.isJusticeGuard(n)||dist(n,this.player)>900)continue;
   const effect=this.justiceEffect(n),s=n.dangerState;
   if(!effect.refuse){
    if(s?.attacker==='player'&&(s.justiceFearUntil||s.justicePanicUntil)&&this.clock>=(s.justiceFearUntil||s.justicePanicUntil))this.endJusticeFlight(n,s);
    continue;
   }
   this.cancelWorldConversation?.(n);
   if(this.dialogue?.who===n)this.dialogue=null;
   if(this.sameLevel(n,this.player)&&dist(n,this.player)<220&&this.lineClear(n,this.player)){
    if(s?.mode!=='fleeing'||s.attacker!=='player')this.startCivilianFlight(n,this.player);
    if(n.dangerState?.attacker==='player'){n.dangerState.justiceFearUntil=effect.fearUntil;delete n.dangerState.justicePanicUntil;}
   }
  }
 };
 Game.prototype.endJusticeFlight=function(n,s){
  n.dangerState={mode:'returning',post:s.post,shelter:s.shelter,clearAt:this.clock,blocked:0};n.path=[];n.alpha=1;
 };
 const flight=Game.prototype.stepCivilianFlight;
 Game.prototype.stepCivilianFlight=function(n,s,dt){
  const until=s.justiceFearUntil||s.justicePanicUntil;
  if(s.attacker==='player'&&until&&this.clock>=until){this.endJusticeFlight(n,s);return;}
  return flight.call(this,n,s,dt);
 };
 const present=Game.prototype.npcPresent,talk=Game.prototype.talkTo;
 Game.prototype.npcPresent=function(n){return present.call(this,n)&&(!this.worldState?.justice?.state.cases.length||this.civilianProtected(n)||this.isJusticeGuard(n)||!this.justiceEffect(n).refuse);};
 Game.prototype.talkTo=function(n){if(n&&!this.civilianProtected(n)&&!this.isJusticeGuard(n)&&this.justiceEffect(n).refuse){this.refreshJusticeFear(true);return false;}return talk.call(this,n);};
 const npcs=Game.prototype.stepNpcs;
 Game.prototype.stepNpcs=function(dt){this.refreshJusticeFear();return npcs.call(this,dt);};
 const statement=Game.prototype.fileJusticeStatement;
 Game.prototype.fileJusticeStatement=function(...args){const result=statement.apply(this,args);if(result){this.refreshJusticeFear(true);this._justiceResponseDue=this.clock+1;}return result;};
 // Reserve guards in the model only after finding a real, navigable approach.
 // The delay covers mobilization and walking from the post to the offscreen gate.
 Game.prototype.planJusticeDeployment=function(siteId,last){
  const post=Atlas.toGame(Atlas.byId[siteId].x,Atlas.byId[siteId].y),target=Atlas.toGame(last.x,last.y),free=(x,y)=>!this.solid(x,y,6,0);
  if(dist(post,target)>900||!free(target.x,target.y))return null;
  let probes=0;const offset=this._justiceEntryOffset||0,radiusIndex=this._justiceEntryRadius||0,radii=[320,400,480];
  for(const radius of [radii[radiusIndex],radii[(radiusIndex+1)%3],radii[(radiusIndex+2)%3]])for(let i=0;i<16;i++){
   const angle=(i+offset)*Math.PI/8,entry={x:target.x+Math.cos(angle)*radius,y:target.y+Math.sin(angle)*radius};
   if(!this.justiceSpawnOffscreen(entry)||!free(entry.x,entry.y))continue;
   if(++probes>4){this._justiceEntryOffset=(offset+4)%16;if(!this._justiceEntryOffset)this._justiceEntryRadius=(radiusIndex+1)%3;return null;}
   const segment=(a,b)=>this.npcSegmentFree({level:0},a,b);
   const departure=segment(post,entry)?[entry]:Atlas.localPath(post,entry,free,400),approach=segment(entry,target)?[target]:Atlas.localPath(entry,target,free,400);
   if(!departure.length||!approach.length)continue;
   let from=post,length=0,valid=true;
   for(const to of departure){if(!segment(from,to)){valid=false;break;}length+=dist(from,to);from=to;}
   if(!valid)continue;
   const path=[];from=entry;
   for(const to of approach){if(!segment(from,to)){valid=false;break;}const a=Atlas.toWorld(from.x,from.y),b=Atlas.toWorld(to.x,to.y),d=Math.hypot(a.x-b.x,a.y-b.y);if(d)path.push({local:true,from:[a.x,a.y],to:[b.x,b.y],length:d});from=to;}
   if(valid&&path.length){const points=[post,...departure].reverse(),homePath=[];for(let k=1;k<points.length;k++){const a=Atlas.toWorld(points[k-1].x,points[k-1].y),b=Atlas.toWorld(points[k].x,points[k].y);homePath.push({local:true,from:[a.x,a.y],to:[b.x,b.y],length:Math.hypot(a.x-b.x,a.y-b.y)});}
    return {path,homePath,readyAt:this.clock+Math.max(1,length/(WorldPacing.civilianWalk*WorldPacing.dayRealSeconds/1440))};}
  }return null;
 };
 Game.prototype.stepJusticeResponse=function(){
  const j=this.worldState?.justice,s=this.worldState?.simulation;
  if(!j?.state.cases.length||!s||this.journey||this.sleeping||this.dialogue||this.dead||this.dying||this.player.level)return;
  if(this.clock<(this._justiceResponseDue??0)||this.time<(this._justiceResponseTry||0))return;
  this._justiceResponseTry=this.time+5;
  const site=this.justiceSite(),effect=j.effect(site,null,this.clock),last=j.state.sightings[site];
  if(!effect.wanted||!last||this.clock-last.at>j.response(site,this.clock).searchMinutes)return;
  const post=s.state.sites[site],jurisdiction=post?.jurisdiction;if(!post||post.guardAvailable<2||post.treasury<12||(post.stock.provisions||0)<4)return;
  if(s.state.missions.filter(m=>m.kind==='justice'&&j.zone(m.site)?.id===j.zone(site)?.id&&m.status!=='returned').length>=j.response(site,this.clock).responseSquads||(s.state.cooldowns['justice-'+j.zone(site)?.id]||0)>this.clock)return;
  const deployment=this.planJusticeDeployment(site,last);if(deployment)s.dispatchJustice(site,deployment);
 };
 const update=Game.prototype.update;
 Game.prototype.update=function(dt,input){const result=update.call(this,dt,input);this.stepJusticeResponse();return result;};
})();
