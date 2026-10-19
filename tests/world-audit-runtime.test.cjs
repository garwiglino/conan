const {test,before}=require('node:test'),assert=require('node:assert/strict');
let a;before(async()=>{a=await require('./game-harness.cjs').loadGame();});
function game(saved){const g=new a.Game(saved);g.enemies=[];g.dialogue=null;g.solid=()=>false;g.lineClear=()=>true;g.worldStore.readFor=()=>null;return g;}
function board(g){const st=g.stations.find(s=>s.site==='camp');Object.assign(g.player,{x:st.actor.x,y:st.actor.y+12,coins:9999,level:0});g.transportSession=st.id;return st;}

test('audit 1: saving the last death never restores a life or permits resurrection',()=>{
 const g=game();g.player.lives=1;g.player.hp=0;g.die();const saved=g.serialize();assert.equal(saved.player.hp,0);assert.equal(saved.player.x,g.player.x);const copy=game(JSON.parse(JSON.stringify(saved)));
 assert.equal(copy.player.lives,0);assert.equal(copy.player.hp,0);assert.equal(copy.dying.over,true);copy.reviveNow();assert.equal(copy.player.lives,0);copy.stepDying(2);assert.ok(copy.events.some(e=>e.type==='fallen'&&e.over));
 const normal=game();normal.player.hp=0;normal.die();const alive=game(normal.serialize());assert.equal(alive.player.lives,2);assert.equal(alive.player.hp,10);
});
test('audit 2: a fatal cold rest stops before healing or announcing a successful rest',()=>{
 const g=game();board(g);g.atlasContext=()=>a.Atlas.byId.camp;g.sky=()=>({temperature:-10,wind:0,rain:0,snow:0,blizzard:0});g.hearthAt=()=>false;g.supplies.food=100;
 assert.equal(g.restAtRelay(),false);assert.equal(g.player.hp,0);assert.equal(g.player.lives,2);assert.ok(g.dying);assert.ok(!g.events.some(e=>e.type==='notice'&&e.title.startsWith('Repos à')));
});
test('audit 3: a newer world journal applies deaths to actors and excludes them from recruitment',()=>{
 const g=game();g.registerLabourActors();const n=g.npcs.find(n=>n.resident&&!n.batracien&&n.labourSite),fresh=JSON.parse(JSON.stringify(g.worldState.serialize())),site=fresh.simulation.sites[n.labourSite];
 Object.assign(site.workerRecords[n.id],{dead:true,hp:0});site.losses[n.id]={at:g.clock,role:'worker'};fresh.revision++;g.worldStore.readFor=()=>fresh;g.atlasNews(n);
 assert.ok(n.dead&&n.civilian.dead);assert.equal(n.civilian.hp,0);assert.equal(g.recruitCompanion(n),false);assert.ok(!g.party.some(c=>c.id===n.id));
 const restored=game(JSON.parse(JSON.stringify(g.serialize())));assert.ok(restored.npcs.find(v=>v.id===n.id).civilian.dead);
});
test('audit 6: a dismissed island resident returns over existing ferry edges, including after saving',()=>{
 const g=game(),n=g.npcs.find(n=>n.resident&&!n.batracien);assert.ok(g.recruitCompanion(n));const site=g.worldState.simulation.state.sites[n.labourSite];
 const island=a.Atlas.nodes.find(dest=>dest.rest&&a.Atlas.findPath(site.id,dest.id,{mode:'foot',allowBoat:true})?.some(l=>l.mode==='boat')&&!g.worldState.simulation.systems.graphPath(site.id,dest));assert.ok(island);
 Object.assign(n,a.Atlas.toGame(island.x,island.y));Object.assign(g.player,{x:n.x+10,y:n.y});assert.ok(g.dismissCompanion(n.id));const route=site.workerRecords[n.id].returnRoute;assert.ok(route.path.some(l=>l.mode==='boat'));
 const copy=game(JSON.parse(JSON.stringify(g.serialize()))),actor=copy.npcs.find(v=>v.id===n.id),record=copy.worldState.simulation.state.sites[n.labourSite].workerRecords[n.id];copy.player.x=actor.x+10000;copy.clock+=7*1440;copy.stepLabourReturns(0);
 assert.ok(!record.reasons.returning);assert.ok(Math.hypot(actor.x-record.home.x,actor.y-record.home.y)<=12);
});
test('audit 7: proximity damage respects the companion floor for Elyne and other residents',()=>{
 for(const id of ['elyne',null]){const g=game(),n=id?g.escortActor:g.npcs.find(n=>n.resident&&!n.batracien);assert.ok(g.recruitCompanion(n));const c=g.party.find(c=>c.id===n.id);n.level=0;g.time=100;g.enemies=[{id:'upstairs',kind:'skeleton',ai:'chase',x:n.x,y:n.y,level:1,hp:3}];const hp=c.hp;g.stepParty(0,0);assert.equal(c.hp,hp);g.enemies[0].level=0;g.stepParty(0,0);assert.equal(c.hp,hp-1);}
});
test('audit 10: an expiring four-hour fire gives identical survival over one or sixteen time advances',()=>{
 const setup=()=>{const g=game(),p=a.Atlas.cells.find(p=>p.land&&Math.hypot(p.x-a.Atlas.nearestSite(p.x,p.y).x,p.y-a.Atlas.nearestSite(p.x,p.y).y)>500);Object.assign(g.player,a.Atlas.toGame(p.x,p.y));g.sky=()=>({temperature:2,wind:0,rain:0,snow:0,blizzard:0});g.outfitWarmth=()=>0;g.bodyHeatRest=true;g.bodyHeatGrace=0;g.supplies.firewood=0;g.supplies.campfire={x:g.player.x,y:g.player.y,until:g.clock+240,remaining:240};return g;};
 const one=setup(),split=setup();one.clock+=480;one.advanceNeeds(480);for(let i=0;i<16;i++){split.clock+=30;split.advanceNeeds(30);}assert.equal(one.clock,split.clock);assert.equal(one.player.hp,split.player.hp);assert.equal(one.coldDose,split.coldDose);assert.ok(one.player.hp>1&&one.player.hp<10);
});
test('audit 11: loading preserves the courier route position exactly, with a legacy stage fallback',()=>{
 const g=game(),c=g.couriers[0],n=g.npcs.find(n=>n.id===c.id);c.depart=g.clock;g.clock+=30;g.stepCouriers(30);const saved=JSON.parse(JSON.stringify(g.serialize()));
 for(const legacy of [false,true]){const data=JSON.parse(JSON.stringify(saved));if(legacy)delete data.atlas.couriers[0].position;const copy=game(data),other=copy.npcs.find(v=>v.id===n.id);assert.ok(Math.hypot(n.x-other.x,n.y-other.y)<1e-6);assert.equal(copy.couriers[0].stage,c.stage);}
});
test('audit 12: courier round trips conserve elapsed time across arrival waits',()=>{
 const setup=()=>{const g=game();g.couriers=[g.couriers[0]];g.couriers[0].depart=g.clock;delete g.npcs.find(n=>n.id===g.couriers[0].id).dangerState;return g;};const one=setup(),split=setup();one.clock+=1440;one.stepCouriers(1440);for(let i=0;i<24;i++){split.clock+=60;split.stepCouriers(60);}for(const key of ['from','to','depart','stage','progress'])assert.equal(one.couriers[0][key],split.couriers[0][key],key);const n=one.npcs.find(n=>n.id===one.couriers[0].id),p=split.npcs.find(n=>n.id===split.couriers[0].id);assert.ok(Math.hypot(n.x-p.x,n.y-p.y)<1e-6);
});
test('audit 13: the staffed transport receives the fare exactly once, including on reload',()=>{
 const g=game(),st=board(g),site=g.worldState.simulation.state.sites[st.site],plan=g.planJourney(a.Atlas.home.id),money=g.player.coins+site.treasury,treasury=site.treasury;assert.ok(g.startJourney(plan));assert.equal(site.treasury,treasury+plan.cost);assert.equal(g.player.coins+site.treasury,money);assert.equal(g.startJourney(plan),false);const copy=game(JSON.parse(JSON.stringify(g.serialize())));assert.equal(copy.worldState.simulation.state.sites[st.site].treasury,site.treasury);
});
test('audit 14: distant waiting companions do not drink the player water or inherit player dehydration',()=>{
 const g=game(),n=g.escortActor;g.recruitCompanion(n);const c=g.party.find(c=>c.id===n.id);c.status='waiting';n.x+=10000;g.bodyHeat=()=>({bite:0,hunger:1});g.companionBodyHeat=()=>({bite:0,hunger:1});const water=g.supplies.water;g.clock+=60;g.advanceAtlas(0);assert.equal(water-g.supplies.water,60/480);g.supplies.water=0;const hp=c.hp;g.clock+=240;g.advanceAtlas(0);assert.equal(c.hp,hp);assert.ok(g.player.hp<10);
});
test('audit 17: a qualified batracien relief cancels ordinary routines and stays at its service',()=>{
 const g=game();g.registerLabourActors();const st=g.stations.find(st=>g.npcs.some(n=>n.batracien?.routine?.kind==='local'&&g.canRelieve(st,n))),n=g.npcs.find(n=>n.batracien?.routine?.kind==='local'&&g.canRelieve(st,n));assert.ok(g.assignWorldRelief(st,n));Object.assign(n,n.reliefPost);g.time=100;n.batracien.action='idle';const r=n.batracien.routine;r.wait=0;r.goal={x:n.x+80,y:n.y};const p={x:n.x,y:n.y};for(let i=0;i<100;i++){g.time+=.04;g.stepBatracienRoutine(n,.04);}assert.equal(n.x,p.x);assert.equal(n.y,p.y);assert.equal(r.goal,null);assert.ok(g.staffReady(st));g.clock=Math.floor(g.clock/1440)*1440+23*60;for(let i=0;i<100;i++){g.time+=.04;g.stepBatracienCivilian(n,.04);}assert.equal(n.x,p.x);assert.equal(n.y,p.y);assert.ok(!['sit_down','seated','talk'].includes(n.batracien.action));const other=g.npcs.find(v=>v!==n&&v.batracien?.routine&&!v.batracien.role);Object.assign(other,{x:n.x+20,y:n.y});assert.equal(g.startBatracienConversation(n,other),false);
});
test('audit 19: civilian occupants prevent a ground door closing, but upstairs actors do not',()=>{
 const g=game(),lever=g.levers[0],d=g.doors[lever.door],n=g.npcs.find(n=>n.resident&&!n.batracien);d.open=true;d.progress=1;Object.assign(n,{x:d.x+d.w/2,y:d.y+d.h/2,level:0});Object.assign(g.player,{x:lever.x,y:lever.y,attack:0,dash:0,level:0});g.useMechanism({kind:'lever',i:0});g.tickMechanisms(1);assert.equal(d.open,true);d.open=false;g.tickMechanisms(1);assert.equal(d.open,true);n.level=1;Object.assign(g.fairyActor,{x:d.x+d.w/2,y:d.y+d.h/2,level:0});g.useMechanism({kind:'lever',i:0});g.tickMechanisms(1);assert.equal(d.open,false);assert.equal(d.progress,0);
});
test('audit 4: a visible convoy advances after a single paid toll while the incident remains active',()=>{
 const {w,s,c}=require('./world-audit-fixtures.cjs').cargo();const g=game();g.worldState=w;g.clock=w.clock;g.atlasLastClock=g.clock;g.npcs=[];g.atlasNpcs=[];const p=s.cargoPosition(c);Object.assign(g.player,a.Atlas.toGame(p.x,p.y));g.player.x+=80;g.syncWorldConvoys();const e=w.add('bandits',c.path[0].road,g.clock,0,{position:p});e.edge=c.path[0].edge;e.bandKey='audit-band';e.toll=1;s.state.bands[e.bandKey]={home:c.from,phase:'active',members:[{id:'audit-band-0',hp:4,dead:false}]};w.revision++;const money=c.travelFunds;assert.equal(s.systems.toll(c,e),1);const progress=c.progress;for(let i=0;i<100;i++){g.clock+=.016;g.time+=.04;g.stepWorldConvoys(.04);g.stepCivilianAnimations(.04);}assert.ok(c.progress>progress);assert.equal(c.travelFunds,money-1);assert.equal(e.resolved,null);assert.equal(s.state.bands[e.bandKey].purse,1);
});
test('physical convoy and band records cannot heal food-related damage during actor synchronisation',()=>{
 const {w,s,c,from}=require('./world-audit-fixtures.cjs').cargo();const g=game();g.worldState=w;g.clock=w.clock;g.npcs=[];g.atlasNpcs=[];Object.assign(g.player,a.Atlas.toGame(...Object.values(s.cargoPosition(c))));g.syncWorldConvoys();const u=c.units[0],actor=g.npcs.find(n=>n.id===u.id);s.damageCargoUnit(c,u.id,3);g.saveConvoyActors(c);assert.equal(actor.civilian.hp,3);assert.equal(u.hp,3);
 const e=w.add('bandits',c.path[c.leg].road,g.clock,0,{position:s.cargoPosition(c)}),b=s.state.bands.hungry={home:from.id,members:[{id:'hungry',hp:4,dead:false}]};e.bandKey='hungry';s.systems.prepareBand(b,e);g.syncCampaignGroups();const enemy=g.enemies.find(n=>n.campaignGroup==='hungry');assert.ok(enemy);b.members[0].hp=2;g.saveCampaignActors();assert.equal(enemy.hp,2);assert.equal(b.members[0].hp,2);
});
