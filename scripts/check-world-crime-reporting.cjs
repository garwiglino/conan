// Actual keyboard combat, authored camp population, terrain and reporting office.
// No invented guards, forced statements, justice records or visibility overrides.
const fs=require('node:fs'),http=require('node:http'),assert=require('node:assert/strict'),{chromium}=require('playwright');
(async()=>{
 const html=fs.readFileSync('index.html','utf8').replace(/\}\)\(\);\s*<\/script>/,'globalThis.reportingTest={get game(){return game},BITMAPS,renderer,begin,studioIntro,bladeHits};})();</script>');
 const server=http.createServer((q,r)=>{r.setHeader('Content-Type','text/html; charset=utf-8');r.end(html);}).listen(0,'127.0.0.1');await new Promise(r=>server.on('listening',r));
 const browser=await chromium.launch({executablePath:process.env.UI_BROWSER_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']}),page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.addInitScript(()=>{Element.prototype.requestFullscreen=undefined;localStorage.clear();});
 try{for(const [width,height]of [[568,320],[844,390],[932,430]]){
  await page.setViewportSize({width,height});await page.goto('http://127.0.0.1:'+server.address().port);await page.waitForFunction(()=>globalThis.reportingTest?.BITMAPS.ready);
  await page.evaluate(()=>{const t=reportingTest;t.studioIntro.skip();t.studioIntro.update(2);t.begin();});await page.waitForFunction(()=>performance.now()>reportingTest.studioIntro.releaseUntil);
  const setup=await page.evaluate(()=>{const t=reportingTest,g=t.game,n=g.npcs.find(n=>n.id==='resident-camp-1'),relay=g.stations.find(s=>s.site==='camp').actor;g.enemies.forEach(e=>e.dead=true);g.dialogue=null;g.player.spawnFX=0;
   let placed=false;for(let y=-24;y<=24&&!placed;y+=8)for(let x=-24;x<=24&&!placed;x+=8)for(let dir=0;dir<4&&!placed;dir++){const p={...g.player,x:n.x+x,y:n.y+y,dir};if(x*x+y*y<100||g.solid(p.x,p.y,6,0)||!g.lineClear(p,n)||!t.bladeHits(p,n,2))continue;Object.assign(g.player,{x:p.x,y:p.y,dir});if(g.justiceWitnesses(n).some(w=>w.id===relay.id))placed=true;}
   if(!placed)throw Error('No real attack position with the authored eyewitness');n.civilian.hp=1;n.stun=2;return {before:g.pursuitStatus().level,weapon:g.player.weapon};});assert.equal(setup.before,0);
  await page.keyboard.down('Numpad0');await page.waitForFunction(()=>reportingTest.game.npcs.find(n=>n.id==='resident-camp-1')?.civilian.dead,{},{timeout:10000});await page.keyboard.up('Numpad0');
  await page.waitForFunction(()=>reportingTest.renderer.pursuitReadout?.level===3);
  const result=await page.evaluate(()=>{const g=reportingTest.game,c=g.worldState.justice.state.cases.find(c=>c.victim==='resident-camp-1');return {level:g.pursuitStatus().level,kind:c.kind,filed:c.witnesses['relay-camp'].filedCount,weapon:g.player.weapon,aria:document.getElementById('pursuitButton').getAttribute('aria-label')};});assert.equal(result.kind,'murder');assert.equal(result.filed,1);assert.equal(result.level,3);assert.equal(result.weapon,setup.weapon);assert.match(result.aria,/3 sur 5/);
  await page.screenshot({path:'/tmp/conan-reporting-'+width+'.png'});await page.locator('#pursuitButton').click();assert.ok(await page.locator('#pursuitRegions').innerText().then(s=>s.includes('3/5')&&s.includes('Monarchie de Sarak')));console.log('PASS native murder/reporting '+width+'×'+height+' '+JSON.stringify(result));
 }assert.deepEqual(errors,[]);}finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
