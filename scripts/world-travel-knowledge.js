/* Advice uses the speaker's dated knowledge; interception uses the ground ahead. */
(()=>{
 Game.prototype.knownTravelState=function(actor){
  const world=this.worldState,book=world.knowledge[actor?.id]||{},clock=this.clock;
  return {edgeStatus(edge){if(!edge)return {closed:true,risk:0,delay:0,events:[]};const events=world.events.filter(e=>book[e.id]&&book[e.id].heard<=clock&&book[e.id].resolved===null&&(!e.edge||e.edge===edge.id)&&(edge.roads.includes(e.target)||Atlas.byId[e.target]&&[edge.a,edge.b].includes(Atlas.byId[e.target].vertex)));
   return {events,closed:events.some(e=>Atlas.EVENT_TYPES[e.type].closed),risk:events.reduce((n,e)=>n+(Atlas.EVENT_TYPES[e.type].risk||0),0),delay:events.reduce((n,e)=>n+(Atlas.EVENT_TYPES[e.type].delay||0),0)};
  }};
 };
 const plan=Game.prototype.planJourney;
 Game.prototype.planJourney=function(to,options={}){const station=this.currentTransport();if(!station)return null;const actor=station.actor,w=Atlas.toWorld(actor.x,actor.y);this.worldState.learn(actor.id,w.x,w.y,this.clock);const result=plan.call(this,to,{...options,knowledgeState:this.knownTravelState(actor)});if(result)result.informedBy=actor.id;return result;};
 Game.prototype.journeyEdgeStatus=function(stage,position=null,minutes=0){
  const status=this.worldState.edgeStatus(Atlas.edgeById.get(stage.edge),this.clock);if(stage.mode==='boat')return status;
  const p=position||Atlas.toWorld(this.player.x,this.player.y),t=stage.from&&stage.to?Atlas.project(p.x,p.y,stage.from,stage.to).t:0,u=Math.min(1,t+minutes/stage.minutes),end=stage.from&&stage.to?[stage.from[0]+(stage.to[0]-stage.from[0])*u,stage.from[1]+(stage.to[1]-stage.from[1])*u]:[p.x,p.y],events=status.events.filter(e=>Atlas.project(e.x,e.y,[p.x,p.y],end).d<=Math.max(80,e.radius||0));
  return {...status,events,closed:events.some(e=>Atlas.EVENT_TYPES[e.type].closed)};
 };
 Game.prototype.journeyThreat=function(stage,knownOnly=false,position=null,minutes=0){if(stage?.kind!=='move'||stage.mode==='boat')return null;
  const status=knownOnly?this.knownTravelState(this.currentTransport()?.actor).edgeStatus(Atlas.edgeById.get(stage.edge)):this.journeyEdgeStatus(stage,position,minutes);
  return status.events.find(e=>Atlas.EVENT_TYPES[e.type].group&&!Atlas.EVENT_TYPES[e.type].guard);
 };
})();
