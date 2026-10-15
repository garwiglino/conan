const {test,before}=require('node:test'),assert=require('node:assert/strict');
let api;before(async()=>{api=await require('./game-harness.cjs').loadGame();});
test('unknown places cannot be tracked and are revealed only by visiting, including services',()=>{
 const g=new api.Game(),A=api.Atlas,city=g.mapPlaces.find(n=>n.id===A.home.id),port=g.mapPlaces.find(n=>n.kind==='dock'&&n.category==='transport');
 assert.equal(g.isPlaceVisited(city),false);assert.equal(g.isPlaceVisited(port),false);g.navigation=city.id;assert.equal(g.navigationInfo(),null);
 Object.assign(g.player,A.toGame(city.x,city.y));g.recordExploration();assert.equal(g.isPlaceVisited(city),true);assert.equal(g.isPlaceVisited(port),false);
 Object.assign(g.player,A.toGame(port.x,port.y));g.recordExploration();assert.equal(g.isPlaceVisited(port),true);
 const saved=JSON.parse(JSON.stringify(g.serialize())),loaded=new api.Game(saved);assert.equal(loaded.isPlaceVisited(city),true);assert.equal(loaded.isPlaceVisited(port),true);assert.deepEqual(JSON.parse(JSON.stringify([...loaded.explorationRows])),JSON.parse(JSON.stringify([...g.explorationRows])));
});
test('fog rows merge overlapping explored corridors without revealing gaps',()=>{
 const g=new api.Game();g.explorationRows.clear();g.revealFogRange(10,2,4);g.revealFogRange(10,8,10);g.revealFogRange(10,3,6);
 assert.equal(JSON.stringify(g.explorationRows.get(10)),'[[2,6],[8,10]]');g.revealFogRange(10,7,7);assert.equal(JSON.stringify(g.explorationRows.get(10)),'[[2,10]]');
 const n=g.explorationRows.size;g.revealFogRange(-1,1,2);assert.equal(g.explorationRows.size,n);
});
test('legacy saves retain discovered places but never the previous omniscient selection',()=>{
 const g=new api.Game(),saved=JSON.parse(JSON.stringify(g.serialize()));delete saved.atlas.exploration;saved.atlas.navigation=api.Atlas.home.id;
 const loaded=new api.Game(saved);assert.equal(loaded.navigation,null);assert.equal(loaded.isPlaceVisited(loaded.mapPlaces.find(n=>n.id==='camp')),true);assert.ok(loaded.explorationRows.size>0);
});
test('the HUD updates kilometres at one-metre precision on consecutive draws',()=>{
 const {canvas}=require('./game-harness.cjs'),g=new api.Game(),n=g.mapPlaces.find(n=>n.id==='camp'),r=Object.create(api.Renderer.prototype);
 r.g=g;r.c=canvas.createCanvas(320,224).getContext('2d');r.W=320;r.H=224;r.top=22;r.safe={l:0,r:0,t:0,b:0};r.cam={x:0,y:0};g.navigation=n.id;
 Object.assign(g.player,api.Atlas.toGame(n.x+1500,n.y));r.navigationMarker();assert.equal(r.navigationReadout.label,'1,500 km');
 g.player.x-=16;r.navigationMarker();assert.equal(r.navigationReadout.label,'1,499 km');
 Object.assign(g.player,api.Atlas.toGame(n.x+999,n.y));r.navigationMarker();assert.equal(r.navigationReadout.label,'999 m');g.player.x-=16;r.navigationMarker();assert.equal(r.navigationReadout.label,'998 m');
});
