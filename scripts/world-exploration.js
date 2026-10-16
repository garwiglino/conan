/* A compressed row-interval fog grid: walking reveals terrain, not distant POIs.
   Its size grows with explored corridors, never with the whole world's area. */
const FOG_METRES=256,FOG_COLS=Math.ceil(Atlas.raw.width/FOG_METRES),FOG_ROWS=Math.ceil(Atlas.raw.height/FOG_METRES);
Game.prototype.revealFogRange=function(y,left,right){
 if(y<0||y>=FOG_ROWS)return;left=clamp(left,0,FOG_COLS-1);right=clamp(right,0,FOG_COLS-1);
 const result=[];let a=left,b=right,inserted=false;
 for(const range of this.explorationRows.get(y)||[]){if(range[1]<a-1)result.push(range);else if(range[0]>b+1){if(!inserted){result.push([a,b]);inserted=true;}result.push(range);}else{a=Math.min(a,range[0]);b=Math.max(b,range[1]);}}
 if(!inserted)result.push([a,b]);this.explorationRows.set(y,result);
};
Game.prototype.revealFogAt=function(x,y){const cx=Math.floor(x/FOG_METRES),cy=Math.floor(y/FOG_METRES);for(let dy=-1;dy<=1;dy++)this.revealFogRange(cy+dy,cx-1,cx+1);};
Game.prototype.isPlaceVisited=function(place){return !!place&&(place.category==='places'?this.discovered.has(place.siteId):this.visitedPlaces.has(place.id));};
Game.prototype.canTrackPlace=function(place){return this.isPlaceVisited(place)||!!place&&place.category==='transport'&&place.id===this.transportHint;};
Game.prototype.markNearestTransport=function(){
 const p=Atlas.toWorld(this.player.x,this.player.y),closed=this.worldState.active(this.clock).filter(e=>Atlas.EVENT_TYPES[e.type].closed);
 const places=this.mapPlaces.filter(n=>n.category==='transport');
 places.sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y)||a.id.localeCompare(b.id));
 const nearest=places[0];if(!nearest)return null;const unavailable=closed.some(e=>e.target===nearest.siteId||e.target===Atlas.byId[nearest.siteId]?.town);this.emit('notice',{title:unavailable?'Transport le plus proche — fermé':'Transport le plus proche',text:nearest.name+(unavailable?' · Service temporairement indisponible.':'')});this.transportHint=nearest.id;this.navigation=nearest.id;return nearest;
};
Game.prototype.recordExploration=function(){
 const p=Atlas.toWorld(this.player.x,this.player.y),old=this.explorationLast;
 if(old&&Math.hypot(p.x-old.x,p.y-old.y)<1)return;
 // Large non-travel jumps (restore/respawn) must not reveal an imaginary path.
 const d=old?Math.hypot(p.x-old.x,p.y-old.y):0,steps=old&&(this.journey||d<100)?Math.max(1,Math.ceil(d/(FOG_METRES/2))):1;
 for(let i=1;i<=steps;i++)this.revealFogAt(old&&steps>1?old.x+(p.x-old.x)*i/steps:p.x,old&&steps>1?old.y+(p.y-old.y)*i/steps:p.y);
 for(const n of this.mapPlaces)if(Math.hypot(n.x-p.x,n.y-p.y)<= (n.category==='places'?n.radius:5)){
  this.visitedPlaces.add(n.id);if(n.category==='places')this.discovered.add(n.siteId);
 }
 this.explorationLast=p;
};
const explorationInit=Game.prototype.initTravelParty;
Game.prototype.initTravelParty=function(saved){explorationInit.call(this,saved);this.explorationRows=new Map();this.explorationLast=null;
 this.transportHint=this.mapPlaces.find(n=>n.category==='transport'&&n.id===saved.exploration?.transportHint)?.id||null;
 this.visitedPlaces=new Set((Array.isArray(saved.exploration?.visited)?saved.exploration.visited:[]).filter(id=>this.mapPlaces.some(n=>n.id===id)));
 const rows=Array.isArray(saved.exploration?.rows)?saved.exploration.rows:[];
 for(const entry of rows){if(!Array.isArray(entry)||!Number.isInteger(entry[0])||entry[0]<0||entry[0]>=FOG_ROWS||!Array.isArray(entry[1]))continue;for(const pair of entry[1])if(Array.isArray(pair)&&pair.length===2&&pair.every(Number.isInteger)&&pair[0]>=0&&pair[1]<FOG_COLS&&pair[0]<=pair[1])this.revealFogRange(entry[0],pair[0],pair[1]);}
 // Legacy saves remember visited settlements, not the old omniscient map.
 if(!saved.exploration)for(const id of this.discovered){const n=Atlas.byId[id];if(n)this.revealFogAt(n.x,n.y);}
};
const explorationRestore=Game.prototype.finishTravelRestore;
Game.prototype.finishTravelRestore=function(saved){explorationRestore.call(this,saved);this.recordExploration();if(!this.canTrackPlace(this.mapPlaces.find(n=>n.id===this.navigation)))this.navigation=null;};
const explorationAdvance=Game.prototype.advanceAtlas;
Game.prototype.advanceAtlas=function(dt=0){explorationAdvance.call(this,dt);this.recordExploration();};
const explorationSerialize=Game.prototype.serialize;
Game.prototype.serialize=function(){const data=explorationSerialize.call(this);data.atlas.exploration={version:1,transportHint:this.transportHint,visited:[...this.visitedPlaces],rows:[...this.explorationRows].map(([y,ranges])=>[y,ranges.map(r=>r.slice())])};return data;};
