const {test,before}=require('node:test'),assert=require('node:assert/strict');
const {loadGame,canvas}=require('./game-harness.cjs');let a;before(async()=>a=await loadGame());
function game(){const g=new a.Game();g.clock=480;g.worldState=new a.Atlas.WorldState({clock:g.clock});g.enemies=[];g.solid=()=>false;g.lineClear=()=>true;g.populateAtlas=()=>{};g.worldStore.readFor=()=>null;return g;}
function pair(g){const people=g.npcs.filter(n=>n.resident&&!n.batracien).slice(0,2);assert.equal(people.length,2);const [n,m]=people;Object.assign(n,{x:350,y:950,post:{x:350,y:950}});Object.assign(m,{x:n.x+32,y:n.y,post:{x:n.x+32,y:n.y}});Object.assign(g.player,{x:n.x-80,y:n.y+80,level:0});for(const p of people){p.civilian.action='idle';p.civilian.elapsed=10;delete p.dangerState;p.alpha=1;}return people;}
function run(g,seconds){for(let t=0;t<seconds;t+=.04)g.update(.04,{});}
test('two civilians converse in real time, face each other and exchange only public knowledge',()=>{
 const g=game(),[n,m]=pair(g),w=a.Atlas.toWorld(n.x,n.y),event=g.worldState.add('caravan','camp',480,600),secret=g.worldState.add('injury','camp',480,0,{witnesses:[n.id]});g.worldState.learn(n.id,w.x,w.y,g.clock,{privateAccess:true});
 assert.equal(g.startWorldConversation(n,m),true);assert.equal(g.dialogue,null);assert.equal(n.dir,1);assert.equal(m.dir,3);assert.equal(g.startWorldConversation(n,m),false);
 const x=n.x;g.walkNpc(n,{x:x+80,y:n.y},.04);assert.equal(n.x,x);assert.equal(g.worldSpeech().length,1);assert.equal(g.worldSpeech()[0].actor,n);
 assert.ok(g.worldState.news(m.id).some(e=>e.id===event.id));assert.ok(!g.worldState.news(m.id).some(e=>e.id===secret.id));
 g.time+=3.4;assert.equal(g.worldSpeech()[0].actor,m);g.time+=4;g.stepWorldConversations();assert.equal(n.worldChat,undefined);assert.equal(m.worldChat,undefined);
});
test('injury, an approaching enemy and player dialogue interrupt both speakers immediately',()=>{
 const g=game(),[n,m]=pair(g);assert.ok(g.startWorldConversation(n,m));g.damageCivilian(n,1,{x:n.x-10,y:n.y,level:0,id:'assailant'});assert.equal(n.worldChat,undefined);assert.equal(m.worldChat,undefined);assert.equal(n.dangerState.mode,'fleeing');assert.equal(n.civilian.action,'hit','conversation cancellation must not erase the wound animation');
 for(const p of [n,m]){delete p.dangerState;p.chatAfter=0;p.civilian.action='idle';p.civilian.elapsed=10;p.hurt=0;}n.civilian.inv=0;assert.ok(g.startWorldConversation(n,m));
 const foe=a.enemy('cultist',n.x+70,n.y,'approaching');foe.world=true;g.enemies.push(foe);g.stepWorldPerception();assert.equal(n.worldChat,undefined);assert.equal(m.worldChat,undefined);assert.equal(n.dangerState.mode,'fleeing');assert.equal(n.alpha,1);
});
test('traffic uses actual land-road segments, obeys closures and preserves death and appearance across reload',()=>{
 const g=game(),A=a.Atlas;g.dangerAt=()=>({unsafe:false});const road=A.roads.find(r=>r.type==='roads'&&r.segments[0].length*16>2048),segment=road.segments[0],start=A.toGame(...segment.a);Object.assign(g.player,{x:start.x,y:start.y});
 const n=g.roadTrafficSpawn(road,0,0,0);assert.ok(n);const old={x:n.x,y:n.y};g.stepRoadTraffic(n,.04);assert.ok(Math.hypot(n.x-old.x,n.y-old.y)<=1.281);assert.ok(n.roadTraffic.progress>0);
 const event=g.worldState.add('bridge',road.id,g.clock,100,{position:A.toWorld(n.x,n.y)}),pos={x:n.x,y:n.y};n.roadTraffic.wait=0;g.stepRoadTraffic(n,1);assert.equal(n.x,pos.x);assert.equal(n.y,pos.y);g.worldState.resolve(event.id,g.clock);
 n.roadTraffic.wait=0;Object.assign(n,n.roadTraffic.b);n.roadTraffic.progress=n.roadTraffic.length;g.stepRoadTraffic(n,.04);assert.equal(n.roadTraffic.window,1,'travellers continue along the road rather than turn at a loading boundary');assert.equal(n.roadTraffic.sign,1);
 const look=JSON.stringify(n.civilian.appearance);g.damageCivilian(n,100,g.player);assert.equal(n.civilian.dead,true);const data=JSON.parse(JSON.stringify(g.serialize())),copy=new a.Game(data);copy.solid=()=>false;copy.dangerAt=()=>({unsafe:false});copy.enemies=[];Object.assign(copy.player,start);
 assert.equal(copy.roadTrafficSpawn(road,0,0,0),null);assert.equal(JSON.stringify(copy.society.records.get(n.id).appearance),look);assert.ok(copy.atlasDeaths[n.id]);
 assert.equal(g.roadTrafficSpawn(A.roads.find(r=>r.type==='searoutes'),0,0,0),null);
});
test('event patrols physically walk along a real road and stop their route to engage a threat',()=>{
 const g=game(),A=a.Atlas,road=A.roads.find(r=>r.type==='roads'),event=g.worldState.add('patrol',road.id,g.clock,600),centre=A.toGame(event.x,event.y);Object.assign(g.player,{x:centre.x+420,y:centre.y});g.stepEventGroups(0);
 const n=g.npcs.find(n=>n.eventId===event.id);assert.ok(n);g.ensureHumanGuard(n);const old={x:n.x,y:n.y};g.stepRoadPatrol(n,.04);assert.ok(dist2(old,n)>0);assert.ok(n.roadPatrol);
 const foe=a.enemy('snake',n.x+30,n.y,'patrol-threat');foe.world=true;g.enemies=[foe];const at={x:n.x,y:n.y};g.stepRoadPatrol(n,.04);assert.equal(n.x,at.x);assert.equal(n.y,at.y);
 g.worldState.resolve(event.id,g.clock);n.wind=.3;g.stepEventGroups(.1);assert.equal(n.alpha,1,'a guard never fades in the middle of an encounter');assert.equal(n.guardRetiring,true);
 function dist2(a,b){return Math.hypot(a.x-b.x,a.y-b.y);}
});
test('ambient life does not interrupt every worker immediately after loading',()=>{
 const g=game(),[n,m]=pair(g);g.stepWorldConversations();assert.equal(n.worldChat,undefined);assert.equal(m.worldChat,undefined);
 g.time=11;g.stepWorldConversations();assert.ok(g.npcs.some(n=>n.worldChat));
});
test('bandit incidents can target civilians with real combat; occupations do not grant indiscriminate attacks',()=>{
 const g=game(),[n,m]=pair(g),ev=g.worldState.add('bandits','camp',g.clock,600),e=a.enemy('snake',n.x-18,n.y,'incident-'+ev.id+'-0');e.world=true;e.eventId=ev.id;e.cooldown=0;g.enemies=[e];Object.assign(g.player,{x:n.x+360,y:n.y+150,inv:999});
 const hp=n.civilian.hp;assert.ok(g.worldBanditVictims(e).includes(n));assert.equal(g.fightNpcFoe(e,.04),true);assert.equal(e.foeId,n.id);assert.equal(n.dangerState.mode,'fleeing');
 // A cornered civilian remains vulnerable; a wind-up causes real damage, no random roll.
 g.civilianFleeGoal=()=>null;run(g,3);assert.ok(n.civilian.hp<hp);assert.equal(g.player.hp,g.player.maxHp);
 const occupation=g.worldState.add('occupation','camp',g.clock,600);e.eventId=occupation.id;e.dead=false;assert.equal(g.worldBanditVictims(e).length,0);
});
test('spoken reports remain limited to learned facts, keep uncertainty and omit technical scores',()=>{
 const g=game(),[n]=pair(g),A=a.Atlas,road=A.roads.find(r=>r.type==='roads'),event=g.worldState.add('bandits',road.id,g.clock,0,{source:'Garde des routes'});Object.assign(n,A.toGame(event.x,event.y));
 const lines=g.atlasNews(n).join(' ');assert.match(lines,/brigands/);assert.doesNotMatch(lines,/Source :|jour \d|\/5|danger \d|Situation terminée/);
 assert.doesNotMatch(g.npcDirections(n).join(' '),/\/5|danger \d/);g.clock+=1500;assert.match(g.atlasNews(n).join(' '),/ça date/);
 const other=g.npcs.find(v=>v.id==='elyne');g.worldState.add('injury','camp',g.clock,0,{witnesses:[other.id]});assert.ok(!g.atlasNews(n).join(' ').includes('blessure demande'));
});
test('ambient bubbles render in the world and disappear during a player conversation',()=>{
 const g=game(),[n,m]=pair(g);assert.ok(g.startWorldConversation(n,m));g.seals=g.seals.map(()=>true);const cv=canvas.createCanvas(640,400),r=new a.Renderer(cv,canvas.createCanvas(1,1),g);r.resize(320,200,{t:0,b:0,l:0,r:0},2);r.frame();assert.ok(cv.toBuffer('image/png').length>1000);
 g.talkTo(n);assert.equal(g.worldSpeech().length,0);assert.equal(n.worldChat,undefined);assert.equal(m.worldChat,undefined);
});
