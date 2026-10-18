// Browser checks of the shipped game, including canvas speech and live movement.
const fs=require('node:fs'),http=require('node:http'),path=require('node:path'),assert=require('node:assert/strict'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
(async()=>{
 const source=fs.readFileSync(path.join(root,'index.html'),'utf8').replace(/\}\)\(\);\s*<\/script>/,'globalThis.socialTest={get game(){return game},Atlas,WorldSociety,BITMAPS,renderer,begin,studioIntro};})();</script>');
 const server=http.createServer((q,r)=>{r.setHeader('Content-Type','text/html; charset=utf-8');r.end(source)}).listen(0,'127.0.0.1');await new Promise(r=>server.on('listening',r));
 let args=['--no-sandbox'];try{args=(await import('@sparticuz/chromium')).default.args;}catch{}
 const browser=await chromium.launch({executablePath:process.env.UI_BROWSER_PATH||undefined,args,headless:true}),page=await browser.newPage({viewport:{width:844,height:390},hasTouch:true}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));await page.addInitScript(()=>{Element.prototype.requestFullscreen=undefined;try{localStorage.clear();}catch{}});
 try{
  await page.goto('http://127.0.0.1:'+server.address().port);await page.waitForFunction(()=>globalThis.socialTest&&socialTest.BITMAPS.ready);
  const started=await page.evaluate(()=>{
   const t=socialTest;t.studioIntro.skip();t.studioIntro.update(2);t.begin();const g=t.game;g.enemies.forEach(e=>e.dead=true);g.dialogue=null;g.clock=480;
   const [a,b]=g.npcs.filter(n=>n.resident&&!n.batracien).slice(0,2);for(const [n,dx]of [[a,-90],[b,-58]]){Object.assign(n,{x:g.player.x+dx,y:g.player.y,post:{x:g.player.x+dx,y:g.player.y},head:30,alpha:1});delete n.dangerState;n.chatAfter=0;n.civilian.action='idle';n.civilian.elapsed=20;}
   t.ids=[a.id,b.id];return g.startWorldConversation(a,b);
  });assert.equal(started,true);await page.waitForTimeout(300);
  assert.equal(await page.evaluate(()=>socialTest.game.dialogue),null);assert.ok(await page.evaluate(()=>socialTest.game.worldSpeech().some(s=>s.actor.id===socialTest.ids[0])&&socialTest.game.worldSpeech().length<=2));
  assert.ok(await page.evaluate(()=>socialTest.renderer.worldSpeechRects?.length>0),'speech must draw visible pixels');
  const output=path.join(root,'art/world-society');fs.mkdirSync(output,{recursive:true});await page.screenshot({path:path.join(output,'civilian-conversation.png')});
  const changed=await page.evaluate(()=>{const g=socialTest.game,[a,b]=socialTest.ids.map(id=>g.npcs.find(n=>n.id===id));g.time=a.worldChat.start+3.4;g.stepWorldConversations();return g.worldSpeech()[0]?.actor.id===b.id;});assert.equal(changed,true);
  await page.evaluate(()=>{const g=socialTest.game,n=g.npcs.find(n=>n.id===socialTest.ids[0]);g.talkTo(n);g.dialogue.shown=1e9;});await page.waitForTimeout(100);assert.equal(await page.evaluate(()=>socialTest.game.worldSpeech().length),0);
  await page.evaluate(()=>{const g=socialTest.game,n=g.npcs.find(n=>n.id===socialTest.ids[0]);g.worldState.add('bandits','camp',g.clock,600,{source:'Garde des routes'});g.dialogue.lines=g.atlasNews(n);g.dialogue.index=0;g.dialogue.shown=1e9;});await page.waitForTimeout(150);await page.screenshot({path:path.join(output,'world-news.png')});
  const traffic=await page.evaluate(()=>{const g=socialTest.game;g.dialogue=null;g.worldSpeech=()=>[];const A=socialTest.Atlas;for(const road of A.roads.filter(r=>r.type==='roads').slice(0,40)){const s=road.segments[0],p=A.toGame(s.a[0],s.a[1]);Object.assign(g.player,p);g.populateRoadTraffic();if(g.npcs.some(n=>n.roadTraffic))break;}const n=g.npcs.find(n=>n.roadTraffic);if(!n)return null;Object.assign(g.player,{x:n.x-70,y:n.y+40,spawnFX:0});return {id:n.id,x:n.x,y:n.y};});assert.ok(traffic,'real land roads produce a traveller');
  await page.waitForTimeout(1800);const moved=await page.evaluate(id=>{const n=socialTest.game.npcs.find(n=>n.id===id);return {x:n.x,y:n.y,action:n.civilian.action,route:n.roadTraffic,alarm:n.dangerState,won:socialTest.game.won};},traffic.id);assert.ok(Math.hypot(moved.x-traffic.x,moved.y-traffic.y)>0,'traveller really walks: '+JSON.stringify(moved));await page.screenshot({path:path.join(output,'road-traveller.png')});
  await page.waitForTimeout(300);assert.deepEqual(errors,[]);console.log('PASS: shipped browser conversation, alternating speakers, dialogue interruption and road streaming; no JS errors');
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
