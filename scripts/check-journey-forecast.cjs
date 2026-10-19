// Real Chromium check for the formerly synchronous long-journey forecast.
const fs=require('node:fs'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
(async()=>{
 const html=fs.readFileSync('index.html','utf8').replace(/\}\)\(\);\s*<\/script>/,'globalThis.forecastTest={Game,Atlas,BITMAPS,renderer,studioIntro};})();</script>');
 const server=http.createServer((q,r)=>{r.setHeader('Content-Type','text/html');r.end(html);}).listen(0,'127.0.0.1');await new Promise(r=>server.on('listening',r));
 const browser=await chromium.launch({executablePath:process.env.UI_BROWSER_PATH||'/usr/bin/chromium',args:['--no-sandbox'],headless:true});
 try{
  const page=await browser.newPage({viewport:{width:844,height:390}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:'+server.address().port);await page.waitForFunction(()=>forecastTest.BITMAPS.ready);
  const result=await page.evaluate(async()=>{
   const t=forecastTest;t.studioIntro.skip();t.studioIntro.update(2);t.renderer.frame=()=>{};
   const g=new t.Game(),st=g.stations.find(s=>s.site==='camp');Object.assign(g.player,{...g.stationLanding(st.site),coins:9999});g.transportSession=st.id;g.supplies.food=g.supplies.water=999;
   const plan=g.travelDestinations().map(n=>g.planJourney(n.id,{mode:'horse',allowBoat:false})).filter(Boolean).sort((a,b)=>b.minutes-a.minutes)[0];
   if(!g.startJourney(plan))throw Error('Long journey did not start');
   const clock=g.clock,world=JSON.stringify(g.worldState.serialize()),start=performance.now(),pending=g.leaveJourney(Date.now()),suspendMs=performance.now()-start;
   let pulses=0,maxGapMs=0,previous=performance.now();const timer=setInterval(()=>{const at=performance.now();maxGapMs=Math.max(maxGapMs,at-previous);previous=at;pulses++;},10);
   let announcement;try{announcement=await pending.ready;}finally{clearInterval(timer);}
   if(!announcement)throw Error('Forecast cancelled unexpectedly');
   const unchanged=g.clock===clock&&JSON.stringify(g.worldState.serialize())===world;
   let replayPulses=0;const replayTimer=setInterval(()=>replayPulses++,10),replayStart=performance.now(),replay=g.resumeJourney(announcement.at),replayMs=performance.now()-replayStart;try{await replay;}finally{clearInterval(replayTimer);}const replayTotalMs=performance.now()-replayStart,notice=g.events.filter(e=>e.type==='notice').at(-1);
   return {destination:plan.to,minutes:plan.minutes,suspendMs,pulses,maxGapMs,replayMs,replayPulses,replayTotalMs,unchanged,finished:!g.journey,consistent:notice?.title===announcement.reason&&notice?.text===announcement.place};
  });
  assert.deepEqual(errors,[]);assert.ok(result.unchanged);assert.ok(result.finished&&result.consistent);assert.ok(result.replayPulses>1,'Replay must also yield to browser tasks');assert.ok(result.replayMs<150,'Replay must not synchronously catch up the whole trip');assert.ok(result.pulses>10,'The forecast must yield to browser tasks');assert.ok(result.suspendMs<150,'Suspension must not synchronously replay the whole journey');
  console.log(JSON.stringify(result,null,2));
 }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
