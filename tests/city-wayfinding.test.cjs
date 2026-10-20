'use strict';
const {test,before}=require('node:test'),assert=require('node:assert/strict'),{loadGame}=require('./game-harness.cjs');
let api;before(async()=>{api=await loadGame();});
const arrival=g=>{g.dialogue=null;g.journey=null;const p=api.Atlas.byId['town-1'];Object.assign(g.player,api.Atlas.toGame(p.x,p.y));g.player.level=0;return g.updateLocation(0);};
test('the arrival relay stays at its canonical vertex while the map offers all eleven actual district destinations',()=>{
 const g=new api.Game(),node=api.Atlas.byId['town-1'],place=g.mapPlaces.find(p=>p.id===node.id),districts=g.mapPlaces.filter(p=>p.kind==='district');assert.equal(place.x,node.x);assert.equal(place.y,node.y);assert.equal(districts.length,11);assert.equal(new Set(districts.map(d=>d.district)).size,11);
 for(const p of districts){const q=api.Atlas.toGame(p.x,p.y);assert.ok(!g.solid(q.x,q.y,5,0),p.name+' blocked map destination');assert.equal(p.siteId,node.id);assert.equal(g.canTrackPlace(p),false);}
 assert.equal(g.settlements.sites.get(node.id).planRevision,'734272d030e614b8');
});
test('arriving at Clairfoyer distinguishes the relay and guides the player to the real Halles without moving them',()=>{
 const g=new api.Game(),p=api.Atlas.byId['town-1'],centre=api.Atlas.toGame(p.x,p.y);Object.assign(g.player,centre);const guidance=JSON.stringify(g.questGuidance()),loc=arrival(g);assert.equal(loc.detail,"Relais d'arrivée");assert.equal(g.navigation,'district-town-1-halles');assert.equal(g.player.x,centre.x);assert.equal(g.player.y,centre.y);
 const info=g.navigationInfo();assert.ok(info.metres>850&&info.metres<920);assert.equal(info.arrived,false);assert.ok(info.target.x<g.player.x);assert.equal(JSON.stringify(g.questGuidance()),guidance);
 const halles=info.site;Object.assign(g.player,info.target);g.updateLocation(0);assert.equal(g.location.current.detail,'Les Halles du Boisclair');assert.ok(g.navigationInfo().arrived);assert.ok(g.settlements.sites.get(p.id).buildings.some(b=>b.id==='CF07'&&Math.hypot(b.x-g.player.x,b.y-g.player.y)<150));assert.ok(g.canTrackPlace(halles));
});
test('the arrival hint respects an existing tracked goal',()=>{
 const g=new api.Game();g.navigation='camp';arrival(g);assert.equal(g.navigation,'camp');assert.equal(g.clairfoyerArrivalHinted,true);
});
test('an existing save at the old arrival gains usable district markers and keeps its position after reload',()=>{
 const g=new api.Game();arrival(g);const saved=g.serialize();delete saved.atlas.cityLife;saved.atlas.navigation='town-1';const h=new api.Game(saved);h.dialogue=null;h.updateLocation(0);assert.equal(h.player.x,g.player.x);assert.equal(h.player.y,g.player.y);assert.equal(h.navigation,'district-town-1-halles');
 const copy=new api.Game(h.serialize());assert.equal(copy.navigation,h.navigation);assert.equal(copy.mapPlaces.filter(p=>p.kind==='district').length,11);assert.ok(copy.navigationInfo().metres>850);
});
