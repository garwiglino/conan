const {test,before}=require('node:test'),assert=require('node:assert/strict');
const {loadGame,canvas}=require('./game-harness.cjs');let a;
before(async()=>{a=await loadGame();});
test('blocked navigation goals fail immediately and opening them is visible to the next search',()=>{
 let open=false,calls=0;const start={x:8,y:8},end={x:248,y:248},free=(x,y)=>{calls++;return open||x!==248||y!==248;};
 assert.deepEqual(Array.from(a.Atlas.localPath(start,end,free)),[]);assert.equal(calls,1);
 open=true;calls=0;assert.ok(a.Atlas.localPath(start,end,free).length>0);assert.ok(calls>1);
});
test('zero-time walking does not search for a path, but a positive step still does',()=>{
 const g=new a.Game(),n={id:'zero-step',x:100,y:100,level:0},to={x:150,y:150},native=a.Atlas.localPath;let calls=0;
 try{a.Atlas.localPath=()=>{calls++;return [];};assert.equal(g.walkNpc(n,to,0),false);assert.equal(calls,0);assert.equal(n.x,100);g.walkNpc(n,to,.04);assert.equal(calls,1);}finally{a.Atlas.localPath=native;}
});
test('local threat queries exclude distant justice work and see actors moving into range immediately',()=>{
 const g=new a.Game(),far={id:'far',x:10000,y:10000,level:0,hostile:true},near={id:'near',x:g.player.x+12,y:g.player.y,level:0,hostile:true};g.enemies=[];g.npcs=[far,near];g.lineClear=()=>true;const queried=[];
 g.isHostileBatracien=n=>{queried.push(n.id);return n.hostile;};
 assert.equal(g.localThreatAt(g.player.x,g.player.y,0),near);assert.deepEqual(queried,['near']);
 Object.assign(far,{x:g.player.x+5,y:g.player.y});queried.length=0;
 assert.equal(g.localThreatAt(g.player.x,g.player.y,0),far);assert.deepEqual(queried,['far']);
 far.level=1;assert.equal(g.localThreatAt(g.player.x,g.player.y,0),near);
});
test('campaign synchronization keeps unchanged actor lists and removes obsolete representations',()=>{
 const g=new a.Game(),npcs=g.npcs,enemies=g.enemies;g.syncCampaignGroups();assert.equal(g.npcs,npcs);assert.equal(g.enemies,enemies);
 const obsolete={id:'obsolete',campaignGroup:'not-a-live-group'};g.npcs.push(obsolete);g.syncCampaignGroups();assert.ok(!g.npcs.includes(obsolete));
});
test('an existing worker job stays current without rebuilding the actor registry or charging an extra absence',()=>{
 const g=new a.Game();g.syncLabourActors();const [id,n]=[...g.labourActors].find(([,n])=>n.civilian&&!n.reliefPost),site=g.worldState.simulation.state.sites[n.labourSite],workers=site.workers,list=g.npcs;
 n.civilian.job='weave';g.syncLabourActors();assert.equal(site.workerRecords[id].job,'weave');assert.equal(site.workers,workers);assert.equal(g.npcs,list);
});
test('interaction selection checks presence only for people within talking distance',()=>{
 const g=new a.Game(),near={id:'near',label:'PROCHE',x:g.player.x+12,y:g.player.y},far={id:'far',label:'LOINTAIN',x:g.player.x+10000,y:g.player.y},seen=[];g.npcs=[far,near];g.npcPresent=n=>{seen.push(n.id);return true;};
 const action=g.mechanismContext();assert.equal(action?.npc,near);assert.ok(seen.includes('near'));assert.ok(!seen.includes('far'));
});
test('offscreen drawing is culled horizontally without removing the person from the world',()=>{
 const g=new a.Game(),near={id:'visible-test',x:g.player.x+20,y:g.player.y},far={id:'invisible-test',x:g.player.x+1000000,y:g.player.y};g.npcs.push(near,far);
 const r=new a.Renderer(canvas.createCanvas(640,400),canvas.createCanvas(1,1),g),drawn=[];r.resize(320,200,{t:0,b:0,l:0,r:0},2);r.npcDraw=n=>drawn.push(n.id);r.frame();
 assert.ok(drawn.includes(near.id));assert.ok(!drawn.includes(far.id));assert.ok(g.npcs.includes(far));
});

test('distant dead campaign representations unload even while their mission remains active',()=>{
 const g=new a.Game(),s=g.worldState.simulation,site=a.Atlas.byId['town-69'];
 const mission={id:'far-mission-test',site:site.id,status:'active',units:[],path:[],anchor:{x:site.x,y:site.y}};
 s.state.missions.push(mission);const dead={id:'far-dead-test',campaignGroup:mission.id,dead:true,...a.Atlas.toGame(site.x,site.y)};g.enemies.push(dead);
 g.syncCampaignGroups();assert.ok(!g.enemies.includes(dead));assert.ok(s.state.missions.includes(mission));
});


test('an unknown projectile owner is not an arresting guard',()=>{
 const g=new a.Game();assert.equal(g.canJusticeArrest(undefined),false);assert.equal(g.canJusticeArrest(null),false);
});

test('negative world coordinates do not turn distant enemies, remains or drops into always-drawn layers',()=>{
 const g=new a.Game(),e=a.enemy('snake',g.player.x,-20000,'negative-offscreen'),remain={kind:'batracien',x:g.player.x,y:-30000,age:0},drop={kind:'flask',level:1,x:g.player.x,y:-40000,z:0};g.enemies.push(e);g.remains.push(remain);g.drops.push(drop);
 const r=new a.Renderer(canvas.createCanvas(640,400),canvas.createCanvas(1,1),g),drawn={enemy:0,remain:0,drop:0,deck:0,shade:0,top:0};r.resize(320,200,{t:0,b:0,l:0,r:0},2);
 const enemy=r.enemy.bind(r);r.enemy=n=>{if(n===e)drawn.enemy++;else enemy(n);};r.batracienRemains=()=>drawn.remain++;r.flask=()=>drawn.drop++;
 for(const [name,key]of [['drawDeck','deck'],['levelShade','shade']]){const native=r[name].bind(r);r[name]=(...args)=>{drawn[key]++;return native(...args);};}
 const stairs=r.drawStairs.bind(r);r.drawStairs=where=>{if(where==='top')drawn.top++;return stairs(where);};r.frame();
 assert.equal(drawn.enemy,0);assert.equal(drawn.remain,0);assert.equal(drawn.drop,0);assert.equal(drawn.deck,1);assert.equal(drawn.shade,1);assert.equal(drawn.top,1);
 assert.ok(g.enemies.includes(e));assert.ok(g.remains.includes(remain));assert.ok(g.drops.includes(drop));
});
