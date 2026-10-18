// Real conversations, not only isolated screenshots. Requires Playwright/Chromium.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
(async()=>{
 let args=['--no-sandbox'];try{args=(await import('@sparticuz/chromium')).default.args;}catch{}
 const source=fs.readFileSync(path.join(root,'index.html'),'utf8').replace(/\}\)\(\);\s*<\/script>/,'globalThis.ui={get game(){return game},BITMAPS,studioIntro,renderer,begin,syncDialogue,handleEvents,setTextSize};})();</script>');
 const server=http.createServer((q,r)=>{r.setHeader('Content-Type','text/html');r.end(source)}).listen(0,'127.0.0.1');await new Promise(r=>server.on('listening',r));
 const browser=await chromium.launch({executablePath:process.env.UI_BROWSER_PATH||undefined,args,headless:true});const reports=[];
 const page=await browser.newPage({viewport:{width:568,height:320},hasTouch:true,deviceScaleFactor:1});
 await page.addInitScript(()=>{Element.prototype.requestFullscreen=undefined;try{localStorage.clear();}catch{}});
 try{for(const [width,height,percent]of [[568,320,125],[844,390,100],[932,430,125]]){
  await page.evaluate(async()=>{if(document.fullscreenElement)await document.exitFullscreen();});await page.setViewportSize({width,height});const errors=[];page.removeAllListeners('pageerror');page.on('pageerror',e=>errors.push(String(e)));
  await page.goto('http://127.0.0.1:'+server.address().port);await page.waitForFunction(()=>globalThis.ui&&ui.BITMAPS.ready);
  await page.evaluate(percent=>{ui.studioIntro.skip();ui.studioIntro.update(2);ui.setTextSize(percent,false);ui.begin();const n=ui.game.stations.find(s=>s.site==='camp').actor;ui.testNpcId=n.id;Object.assign(ui.game.player,{x:n.x+14,y:n.y+14,level:n.level||0,inv:999,spawnFX:0});ui.game.talkTo(n);ui.game.dialogue.lines=['Bonjour.','Les chemins du nord sont gelés. Prépare ta tenue, tes vivres et tes compagnons avant de reprendre la route. '+('Le passage exige de la prudence. '.repeat(16))];ui.game.dialogue.shown=1e9;ui.handleEvents();},percent);
  await page.waitForTimeout(250);const first=await page.locator('#dialogue').boundingBox();
  await page.click('#dlgNext');await page.waitForTimeout(100);const long=await page.locator('#dialogue').boundingBox();assert.deepEqual(long,first,'the long line must not move or resize the panel');
  assert.equal(await page.locator('#dialogue').evaluate(n=>n.classList.contains('below')),false);
  await page.click('#dlgNext');await page.click('#dlgNext');await page.waitForTimeout(100);
  await page.waitForFunction(()=>ui.game.dialogue?.choosing);
  assert.deepEqual(await page.locator('#dialogue').boundingBox(),first,'choices must not move or resize the panel');
  assert.equal(await page.locator('#dlgChoices #dlgBye').count(),1);
  const before=await page.locator('#dlgList').evaluate(n=>n.scrollTop);
  await page.keyboard.press('ArrowUp');await page.waitForTimeout(80);assert.equal(await page.locator('#dlgBye').evaluate(n=>document.activeElement===n&&n.classList.contains('sel')),true,'farewell participates in keyboard choice navigation');
  assert.equal(await page.locator('#dlgList').evaluate(n=>n.scrollTop),before,'focusing farewell must not scroll the list');
  for(const selector of ['#dlgBye','#dlgChoices .dlg-choice']){
   const result=await page.locator(selector).first().evaluate(n=>{const r=n.getBoundingClientRect(),t=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return {inside:r.x>=0&&r.y>=0&&r.right<=innerWidth&&r.bottom<=innerHeight,hit:n.contains(t)};});assert.ok(result.inside&&result.hit,selector+' must remain tappable');
  }
  if(width===844){const out=path.join(root,'art/ui-landscape');await page.screenshot({path:path.join(out,'dialogue-real-choices.png')});}
  await page.keyboard.press('Enter');await page.waitForTimeout(100);assert.equal(await page.evaluate(()=>ui.game.dialogue.after),'end');
  assert.equal(await page.locator('#dlgNext').innerText(),'Terminer');assert.deepEqual(await page.locator('#dialogue').boundingBox(),first);
  await page.evaluate(()=>{ui.game.dialogue.shown=1e9;});await page.click('#dlgNext');await page.waitForFunction(()=>!ui.game.dialogue);
  await page.waitForTimeout(250);if(width===844)await page.screenshot({path:path.join(root,'art/ui-landscape/npcs-real-nameplates.png')});
  await page.evaluate(()=>{ui.game.talkTo(ui.game.npcs.find(n=>n.id===ui.testNpcId));const d=ui.game.dialogue;d.choosing=true;d.menu.options=d.menu.build();ui.handleEvents();});await page.waitForTimeout(100);
  await page.keyboard.press('Escape');await page.waitForTimeout(100);assert.equal(await page.evaluate(()=>ui.game.dialogue.after),'end','Escape uses the actual farewell action');
  if(width===844){await page.screenshot({path:path.join(root,'art/ui-landscape/dialogue-real-farewell.png')});}
  assert.deepEqual(errors,[]);reports.push({width,height,percent,stablePanel:first,errors});console.log('PASS conversation '+width+'×'+height+' '+percent+'%');
 }}finally{await browser.close();server.close();}
 console.log(JSON.stringify(reports,null,2));
})().catch(e=>{console.error(e);process.exitCode=1;});
