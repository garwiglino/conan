/* Hearthreaver — body heat. Kaldor's outfit warmth (game.outfitWarmth():
 * outfit plus helmet, 0 to 3) against the felt temperature where he stands,
 * at this hour: the biome's air temperature, cooled by wind, rain, snow and
 * blizzard, softened by a village or the fire of a halt.
 * Too cold for the outfit, he first shivers, then the cold bites into his
 * health until it kills him; a journey leaves him at 1 HP. Too warm an
 * outfit in the heat never costs health, but hunger digs faster.
 */
const BodyHeat=(()=>{
 'use strict';
 // Felt °C each warmth level keeps comfortable: below cold Kaldor shivers,
 // above hot the outfit is too warm. Light outfits are never too warm.
 const COMFORT=[{cold:8,hot:Infinity},{cold:-4,hot:30},{cold:-14,hot:22},{cold:-30,hot:14}];
 // Degrees of shivering before the cold costs health; past them, one HP every
 // BITE/degrees game minutes. Each degree of heat adds 10 % hunger, up to ×4.
 const SHIVER=2,BITE=120,HEAT=10,HUNGER_MAX=4;
 // A halt's fire or inn warms to HEARTH; after a respawn Avar's warmth lasts
 // GRACE game minutes; a warning repeats at most every NOTICE game minutes
 // (a third of it for the great cold).
 const HEARTH=18,HEARTH_REACH=56,GRACE=90,NOTICE=180;
 const RANK={comfortable:0,chilly:1,freezing:2};
 const deg=t=>{const v=Math.round(t);return (v<0?'−':'')+Math.abs(v)+' °C';};
 const percent=k=>Math.round((k-1)*100)+' %';

 function felt(sky,shelter){
  const t=sky.temperature;if(shelter==='hearth')return Math.max(t,HEARTH);
  // Wind bites only in the cold; a wet body loses more heat the colder it is.
  const chill=clamp((16-t)/16,0,1),open=shelter==='village'?.4:1;
  return t-(sky.wind||0)*8*chill*open-(sky.rain||0)*(2+4*chill)-(sky.snow||0)*2*chill-(sky.blizzard||0)*6*open+(shelter==='village'?2*chill:0);
 }
 // By a fire Kaldor opens his coat: the heat of the outfit counts from the air.
 function judge(f,warmth,heat=f){
  const comfort=COMFORT[warmth],deficit=comfort.cold-f,excess=heat-comfort.hot;
  return {comfort,deficit,excess,bite:deficit>SHIVER?(deficit-SHIVER)/BITE:0,hunger:excess>0?Math.min(HUNGER_MAX,1+excess/HEAT):1};
 }
 const warmthOf=g=>clamp(Math.round(g.outfitWarmth?.()??0),0,3);

 Game.prototype.hearthAt=function(actor=this.player,ignite=false){
  const w=Atlas.toWorld(actor.x,actor.y),site=Atlas.nearestSite(w.x,w.y),sim=this.worldState.simulation;
  if(Math.hypot(site.x-w.x,site.y-w.y)<=80)return sim?.systems.hearth(site.id,this.clock)||false;
  const fire=this.supplies.campfire;if(fire&&fire.until>this.clock&&(fire.remaining??240)>0&&Math.hypot(actor.x-fire.x,actor.y-fire.y)<HEARTH_REACH)return true;
  if(ignite&&actor===this.player&&(this.supplies.firewood||0)>=1){this.supplies.firewood--;this.supplies.campfire={x:actor.x,y:actor.y,until:this.clock+240,remaining:240};return true;}return false;
 };
 Game.prototype.burnCampfire=function(minutes){const fire=this.supplies.campfire;if(fire&&fire.until>this.clock&&Math.hypot(this.player.x-fire.x,this.player.y-fire.y)<HEARTH_REACH){fire.remaining=Math.max(0,(fire.remaining??Math.min(240,fire.until-this.clock))-minutes);if(fire.remaining===0)fire.until=this.clock;}};
 Game.prototype.bodyShelter=function(){
  const p=this.player;if(p.level)return null;
  const j=this.journey,s=j?.plan?.stages?.[j.index],resting=this.bodyHeatRest||this.sleeping||s?.kind==='rest'||this.restTent()||[...(this.atlasProps||[]),...(this.world?.props||[])].some(o=>o.rest&&Math.abs(o.x-p.x)<HEARTH_REACH&&Math.abs(o.y-p.y)<HEARTH_REACH);
  if(resting)return this.hearthAt(p,true)?'hearth':'village';if(s?.kind==='wait')return 'village';const w=Atlas.toWorld(p.x,p.y);return Atlas.siteAt(w.x,w.y)?.rest?'village':null;
 };
 // Kaldor's thermal state now: air and felt °C, comfort range, health bite
 // (HP per game minute) and hunger factor.
 Game.prototype.bodyHeat=function(){
  const p=this.player,warmth=warmthOf(this),shelter=this.bodyShelter(),warm=this.clock<(this.bodyHeatGrace??-Infinity);
  const key=[this.clock,Math.round(p.x),Math.round(p.y),warmth,shelter,warm].join(':');
  if(this._bodyHeat?.key===key)return this._bodyHeat;
  const sky=this.sky(),f=felt(sky,shelter),j=judge(f,warmth,shelter==='hearth'?Math.min(f,sky.temperature):f);if(warm)j.bite=0;
  const state=j.bite?'freezing':j.deficit>0?'chilly':j.excess>0?'overheated':'comfortable';
  return this._bodyHeat={key,air:sky.temperature,felt:f,warmth,shelter,...j,state};
 };
 // Called by advanceNeeds for every slice of world time.
 Game.prototype.coldBite=function(minutes,body=this.bodyHeat()){
  if(!body?.bite){this.coldDose=0;return;}
  if(this.dying||this.dead||this.won||this.player.hp<=0)return;
  this.coldDose=(this.coldDose||0)+body.bite*minutes;
  while(this.coldDose>=1&&!this.dying){
   this.coldDose--;const p=this.player;
   if(this.journey){p.hp=Math.max(Math.min(p.hp,1),p.hp-1);continue;}
   p.hp=Math.max(0,p.hp-1);this.bodyHeatHit=this.time;
   if(this.time-(this.bodyHeatPainAt??-Infinity)>4){this.bodyHeatPainAt=this.time;this.emit('hurt',{big:false});this.emit('haptic',{kind:'hurt'});}
   if(p.hp<=0){p.hitX=0;this.die();if(this.dying)this.dying.cause='cold';}
  }
 };
 Game.prototype.companionBodyHeat=function(member){
  if(!member||member.spirit)return null;const actor=this.partyActor(member.id);if(!actor)return null;
  const p=Atlas.toWorld(actor.x,actor.y),sky=worldClimateAt(this.clock,p.x,p.y),outfit=CIVILIAN_ART.outfits[actor.civilian?.appearance?.outfit];
  const warmth=member.coatWorn?3:outfit?.biome==='neige'?3:outfit?.biome==='tempere'?1:0;
  const shared=this.journey&&member.status==='following'||this.sleeping&&this.nearCompanion(member),shelter=shared?this.bodyShelter():this.atlasProps.some(o=>o.rest&&dist(o,actor)<HEARTH_REACH)?(this.hearthAt(actor)?'hearth':'village'):Atlas.siteAt(p.x,p.y)?.rest?'village':null;
  const temperature=felt(sky,shelter);return {felt:temperature,warmth,...judge(temperature,warmth,shelter==='hearth'?Math.min(temperature,sky.temperature):temperature)};
 };
 Game.prototype.companionColdBite=function(member,minutes){const body=this.companionBodyHeat(member);if(!body||member.down)return;member.coldDose=(member.coldDose||0)+body.bite*minutes;const damage=Math.floor(member.coldDose);member.coldDose-=damage;if(damage){member.hp=Math.max(0,member.hp-damage);member.down=member.hp===0;}};
 Game.prototype.equipCompanionCoat=function(id){const member=this.party.find(c=>c.id===id);if(!member||member.spirit||!this.nearCompanion(member))return false;
  if(member.coatOwned){member.coatWorn=!member.coatWorn;this.emit('save');return true;}
  const site=this.worldState.simulation?.state.sites[this.atlasContext()?.id];if(!site||site.stock.cloth<2||this.player.coins<4){this.emit('notice',{title:'Manteau indisponible',text:'Il faut un relais disposant d’étoffes et quatre pièces.'});return false;}site.stock.cloth-=2;site.treasury+=4;this.player.coins-=4;member.coatOwned=member.coatWorn=true;this.emit('save');return true;
 };
 // Felt range, health risk and hunger factor of a planned journey, sampled
 // along each stage at the hour Kaldor will be there.
 Game.prototype.journeyClimate=function(plan){
  if(!plan?.stages?.length)return null;
  const warmth=warmthOf(this);let clock=this.clock,minutes=0,hunger=0,min=Infinity,max=-Infinity,bite=0;
  for(const s of plan.stages){
   const move=s.kind==='move',site=!move&&Atlas.nearestSite(s.x,s.y),fuel=site&&this.worldState.simulation?.stock(this.worldState.simulation.state.sites[site.id],'firewood')>0||this.supplies.firewood>0,shelter=s.kind==='rest'?(fuel?'hearth':'village'):s.kind==='wait'?'village':null;
   for(const u of move?[0,.5,1]:[.5]){
    const x=move?s.from[0]+(s.to[0]-s.from[0])*u:s.x,y=move?s.from[1]+(s.to[1]-s.from[1])*u:s.y,sky=worldClimateAt(clock+s.minutes*u,x,y),f=felt(sky,shelter),heat=shelter==='hearth'?Math.min(f,sky.temperature):f,j=judge(f,warmth,heat);
    min=Math.min(min,f);max=Math.max(max,heat);bite=Math.max(bite,j.bite);if(u===.5)hunger+=s.minutes*j.hunger;
   }
   clock+=s.minutes;minutes+=s.minutes;
  }
  const comfort=COMFORT[warmth];
  return {min,max,warmth,comfort,hunger:minutes?hunger/minutes:1,freezing:bite>0,chilly:min<comfort.cold,overheated:max>comfort.hot};
 };
 Game.prototype.journeyHunger=function(plan){return this.journeyClimate(plan)?.hunger??1;};
 Game.prototype.journeyClimateText=function(plan){
  const c=this.journeyClimate(plan);if(!c)return '';
  const lines=['Ressenti en route : '+(Math.round(c.min)===Math.round(c.max)?deg(c.min):'de '+deg(c.min)+' à '+deg(c.max))+'.'];
  if(c.freezing)lines.push('Ta tenue ne protège que jusqu’à '+deg(c.comfort.cold)+' : le froid rongera la santé de Kaldor en route.');
  else if(c.chilly)lines.push('Kaldor grelottera par endroits, sans perdre de santé.');
  if(c.overheated)lines.push('Ta tenue sera trop chaude par endroits : la faim se creusera plus vite.');
  if(lines.length===1)lines.push('Ta tenue convient.');
  return lines.join(' ');
 };

 // ---- Warnings while exploring: only when the state worsens. ----
 const TEXT={
  chilly:b=>({title:'Le froid gagne',text:'Ressenti '+deg(b.felt)+' : Kaldor grelotte. Plus froid, il perdra de la santé. Une tenue plus chaude le protégerait (Inventaire (I), Tenue).'}),
  freezing:b=>({title:'Grand froid',text:'Ressenti '+deg(b.felt)+' : le froid ronge la santé de Kaldor. Change de tenue (Inventaire (I), Tenue) ou rejoins le feu d’une halte.'}),
  overheated:b=>({title:'Trop couvert',text:deg(b.felt)+' : ta tenue est trop chaude, la faim se creuse '+percent(b.hunger)+' plus vite. Une tenue plus légère suffirait (Inventaire (I), Tenue).'})
 };
 Game.prototype.bodyHeatNotices=function(){
  if(this.journey||this.sleeping||this.dying||this.dead||this.dialogue||!this.atlas)return;
  const b=this.bodyHeat(),last=this.bodyHeatState||'comfortable';this.bodyHeatState=b.state;
  const worse=b.state==='overheated'?last!=='overheated':RANK[b.state]>(RANK[last]??0);
  if(!worse||!TEXT[b.state])return;
  const noticed=this.bodyHeatNoticed||(this.bodyHeatNoticed={});
  if(this.clock-(noticed[b.state]??-Infinity)<(b.state==='freezing'?NOTICE/3:NOTICE))return;
  noticed[b.state]=this.clock;this.emit('notice',TEXT[b.state](b));
 };
 const update=Game.prototype.update;
 Game.prototype.update=function(dt,input){update.call(this,dt,input);this.bodyHeatNotices();};
 // Avar brings Kaldor back warmed: time to dress or to reach a fire.
 const respawn=Game.prototype.respawn;
 Game.prototype.respawn=function(...args){const r=respawn.apply(this,args);this.bodyHeatGrace=this.clock+GRACE;this.coldDose=0;this.bodyHeatState=null;return r;};
 const rest=Game.prototype.restAtRelay;
 Game.prototype.restAtRelay=function(...args){this.bodyHeatRest=true;try{return rest.apply(this,args);}finally{this.bodyHeatRest=false;}};

 // ---- Frost on the screen edges while the cold bites. ----
 const FROST=[['#5f93b3',.55],['#8dbbd3',.42],['#c5e1ec',.3],['#e6f4f8',.18]];
 function frost(r,b){
  const g=r.g,c=r.c,W=r.W,top=r.top,H=r.H,pulse=Math.max(0,1-(g.time-(g.bodyHeatHit??-Infinity))/.6);
  const s=clamp((b.deficit-SHIVER)/18,.35,1)*(.8+.2*pulse);
  c.save();
  FROST.forEach(([colour,alpha],i)=>{c.globalAlpha=s*alpha;c.fillStyle=colour;const d=i*2;c.fillRect(0,top+d,W,2);c.fillRect(0,H-2-d,W,2);c.fillRect(d,top,2,H-top);c.fillRect(W-2-d,top,2,H-top);});
  // Frosted corners, then ice needles growing from the edges, longer as the cold deepens.
  c.globalAlpha=s*.32;c.fillStyle='#d8eef6';
  for(let k=0;k<18;k++){const w=Math.round((18-k)*1.6*s);c.fillRect(0,top+k,w,1);c.fillRect(W-w,top+k,w,1);c.fillRect(0,H-1-k,w,1);c.fillRect(W-w,H-1-k,w,1);}
  c.globalAlpha=s*.85;c.fillStyle='#f2fbff';
  for(let x=3;x<W;x+=6){const a=Math.round((2+hash(x,3,71)*9)*s),b2=Math.round((2+hash(x,5,73)*9)*s);c.fillRect(x,top,1,a);c.fillRect(x,H-b2,1,b2);}
  for(let y=top+4;y<H;y+=6){const a=Math.round((2+hash(y,7,79)*9)*s),b2=Math.round((2+hash(y,9,83)*9)*s);c.fillRect(0,y,a,1);c.fillRect(W-b2,y,b2,1);}
  c.restore();
 }
 const hud=Renderer.prototype.hud;
 Renderer.prototype.hud=function(){
  const g=this.g;if(g?.bodyHeat&&!g.journey&&!g.dying&&!g.sleeping&&!g.dialogue){const b=g.bodyHeat();if(b.state==='freezing')frost(this,b);}
  hud.call(this);
 };

 // ---- Inventory: a Climat row under the Tenue row, comfort on the Tenue screen. ----
 const SHELTER={hearth:'au coin du feu',village:'abrité du vent'};
 function range(b){return 'Ta tenue protège jusqu’à '+deg(b.comfort.cold)+(Number.isFinite(b.comfort.hot)?' et devient trop chaude au-delà de '+deg(b.comfort.hot):', jamais trop chaude');}
 function status(b){
  return {comfortable:'Kaldor est à l’aise.',chilly:'Kaldor grelotte : encore un peu plus froid et il perdra de la santé.',
   freezing:'Grand froid : Kaldor perd de la santé. Une tenue plus chaude ou le feu d’une halte l’arrêtent.',
   overheated:'Trop couvert : la faim se creuse '+percent(b.hunger)+' plus vite, sans perte de santé.'}[b.state];
 }
 function climateRow(g){
  const b=g.bodyHeat();
  return '<div class="m-sec">Climat</div><div class="inv-row body-heat '+b.state+'"><div class="grow">Ressenti '+deg(b.felt)+(SHELTER[b.shelter]?' ('+SHELTER[b.shelter]+')':'')+' · air '+deg(b.air)+'<small>'+range(b)+'. '+status(b)+'</small></div></div>';
 }
 // The wardrobe block comes first; without it there is nothing to extend.
 let wardrobe=null;try{wardrobe=KaldorWardrobe;}catch{}
 if(wardrobe){
  const row=wardrobe.inventoryHTML,bind=wardrobe.bindInventory;
  wardrobe.inventoryHTML=function(g){const html=row.call(this,g);return html&&g.bodyHeat?html+climateRow(g):html;};
  wardrobe.bindInventory=function(body,g,refresh){
   bind.call(this,body,g,refresh);
   const total=wardrobe.view==='tenue'&&g.bodyHeat&&body.querySelector?.('.ward-total');if(!total)return;
   const b=g.bodyHeat(),note=total.ownerDocument.createElement('small');note.className='ward-climate';
   note.textContent='Protège jusqu’à '+deg(b.comfort.cold)+(Number.isFinite(b.comfort.hot)?', trop chaude au-delà de '+deg(b.comfort.hot):'')+' · ressenti '+deg(b.felt);
   note.style.cssText='display:block;font-size:12px;color:#b7a98a;margin-top:2px';total.append(note);
  };
 }
 return {COMFORT,SHIVER,BITE,HEAT,HUNGER_MAX,HEARTH,GRACE,felt,judge,deg};
})();
