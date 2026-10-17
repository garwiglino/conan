const {test}=require('node:test'),assert=require('node:assert/strict');
const harness=require('./game-harness.cjs');
const leaveCamp=(Game,to)=>{const g=new Game(),station=g.stations.find(s=>s.site==='camp');Object.assign(g.player,{x:station.actor.x,y:station.actor.y+14,coins:99999});g.prepareTransport(station.id);return g.startJourney(g.planJourney(to))?g:null;};
const lastNotice=g=>g.events.filter(e=>e.type==='notice').at(-1);

test('a hidden journey is announced, frozen, replayed for the time away and ends at its announced time',async()=>{
 const {Game,Atlas}=await harness.loadGame(),g=leaveCamp(Game,Atlas.home.id);
 assert.ok(g);assert.ok(g.events.some(e=>e.type==='journeystart'));for(let i=0;i<10;i++)g.stepJourney(.04);
 const now=1e12,out=g.leaveJourney(now);assert.ok(out.at>now+1000);assert.equal(typeof out.place,'string');assert.ok(out.place);assert.equal(out.arrived,out.reason==='Arrivée à destination');
 assert.deepEqual(g.leaveJourney(now+4000),out,'repeated suspend events keep the first announcement');
 const clock=g.clock,elapsed=g.journey.elapsed;for(let i=0;i<50;i++)g.stepJourney(.04);assert.equal(g.clock,clock);assert.equal(g.journey.elapsed,elapsed);
 const saved=JSON.parse(JSON.stringify(g.serialize()));assert.equal(saved.atlas.journey.arrival,out.at);assert.equal(saved.atlas.journey.away,now);
 g.events.length=0;assert.equal(g.resumeJourney(now+1000),true);assert.ok(g.journey);assert.equal(g.journey.away,undefined);assert.equal(g.journey.outcome,undefined);
 assert.ok(Math.abs(g.journey.elapsed-elapsed-1)<1e-6);assert.ok(g.clock>clock);assert.equal(g.events.map(e=>e.type).join(),'save');assert.equal(g.journeyReplay,false);
 assert.equal(g.resumeJourney(now+2000),false,'nothing to replay once back');
 g.events.length=0;const again=g.leaveJourney(now+2000);assert.equal(g.resumeJourney(again.at),true);assert.equal(g.journey,null);
 const end=lastNotice(g);assert.equal(end.title,out.reason);assert.equal(end.text,out.place);assert.equal(g.events.filter(e=>e.type==='save').length,1);
 const restored=new Game(saved);assert.ok(restored.journey);assert.equal(restored.journey.arrival,out.at);restored.resumeJourney(out.at);assert.equal(restored.journey,null);assert.equal(lastNotice(restored).text,out.place);
});

test('the forecast names the stop and never announces it later than the screen would reach it',async()=>{
 const {Game,Atlas}=await harness.loadGame();
 for(const to of [Atlas.home.id,'town-6']){const g=leaveCamp(Game,to);assert.ok(g,to);for(let i=0;i<20;i++)g.stepJourney(.04);
  const f=g.forecastJourney(),clock=g.clock,world=g.worldState;assert.equal(g.clock,clock);assert.equal(g.worldState,world);
  // Stops only depend on the world calendar; skipping the unseen far road travellers keeps this test fast.
  g.journeyReplay=true;let shown=0;while(g.journey&&shown<900){g.stepJourney(.04);shown+=.04;}const end=lastNotice(g);
  assert.equal(end.title,f.reason,to);assert.equal(end.text,f.place,to);assert.ok(f.seconds>1&&f.seconds<=shown+.1,to+': '+f.seconds+' / '+shown);}
});

test('arrival alerts use the iOS bridge, or web notifications only when the player allowed them',async()=>{
 const {TravelAlerts}=await harness.loadGame(),posts=[],arrived={at:Date.now()+30000,arrived:true,reason:'Arrivée à destination',place:'Aulneport'};
 const native=new TravelAlerts({webkit:{messageHandlers:{hearthreaverTravel:{postMessage:m=>posts.push(m)}}}});
 native.prepare();assert.equal(JSON.stringify(posts.pop()),'{"action":"authorize"}');
 assert.equal(native.schedule(arrived),true);const planned=posts.pop();assert.equal(posts.pop().action,'cancel');
 assert.equal(planned.action,'schedule');assert.equal(planned.title,'Arrivé à destination');assert.equal(planned.body,'Kaldor est arrivé à Aulneport. Le jeu est en pause.');assert.ok(planned.delay>29&&planned.delay<=30);
 native.schedule({at:Date.now()-5000,arrived:false,reason:'Le transport refuse un passage menacé',place:'Val-des-Neiges'});const stopped=posts.pop();
 assert.equal(stopped.title,'Voyage interrompu');assert.equal(stopped.body,'Le transport refuse un passage menacé. Kaldor attend à Val-des-Neiges. Le jeu est en pause.');assert.equal(stopped.delay,1);
 native.cancel();assert.equal(JSON.stringify(posts.pop()),'{"action":"cancel"}');assert.equal(native.schedule({}),false);

 const timers=[],shown=[];let asked=0;
 class Note{static permission='granted';static requestPermission(){asked++;return Promise.resolve('granted');}constructor(title,options){this.title=title;this.options=options;this.closed=false;shown.push(this);}close(){this.closed=true;}}
 const env={Notification:Note,navigator:{},setTimeout:(fn,ms)=>timers.push({fn,ms,live:true}),clearTimeout:id=>{timers[id-1].live=false;},focus(){env.focused=true;}},web=new TravelAlerts(env);
 web.prepare();assert.equal(asked,0,'an answered permission is never asked again');
 assert.equal(web.schedule(arrived),true);assert.equal(timers.length,1);assert.ok(timers[0].ms>29000&&timers[0].ms<=30000);
 timers[0].fn();assert.equal(shown[0].title,'Arrivé à destination');assert.equal(shown[0].options.tag,'hearthreaver-arrival');shown[0].onclick();assert.equal(env.focused,true);assert.equal(shown[0].closed,true);
 web.schedule(arrived);web.cancel();assert.equal(timers[1].live,false);
 Note.permission='default';web.prepare();assert.equal(asked,1);assert.equal(web.schedule(arrived),false);
 Note.permission='denied';assert.equal(web.schedule(arrived),false);assert.equal(timers.length,2);
 Note.permission='granted';assert.equal(new TravelAlerts({...env,navigator:{standalone:true}}).schedule(arrived),false,'iOS home-screen web apps keep the in-game arrival only');
});
