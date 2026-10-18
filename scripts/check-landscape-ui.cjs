// Optional real-browser audit: UI_BROWSER_PATH=/path/to/chromium node scripts/check-landscape-ui.cjs
// Requires Playwright. The fixtures expose UI functions only in the served test copy.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('playwright'),root=path.resolve(__dirname,'..');
(async()=>{
 let args=['--no-sandbox'];try{args=(await import('@sparticuz/chromium')).default.args;}catch{}
 let html=fs.readFileSync(path.join(root,'index.html'),'utf8').replace(/\}\)\(\);\s*<\/script>/,
 'globalThis.ui={get game(){return game},get state(){return state},BITMAPS,studioIntro,renderer,run,begin,openMenu,closeMenu,selectMenuTab,showTitle,openWorldPanel,openPartyPanel,travelClose,openTransportPanel,openQuestPanel,closeQuestPanel,openSleepPanel,pause,overlay,QUESTS,updateWorldUI,setTextSize,syncDialogue,KaldorWardrobe};})();</script>');
 // Inject representative iPhone landscape safe areas into the test document only.
 html=html.replace(/env\(safe-area-inset-(top|right|bottom|left)(?:,[^)]*)?\)/g,(_,side)=>'var(--test-safe-'+side+',0px)');
 const server=http.createServer((q,r)=>{r.setHeader('Content-Type','text/html');r.end(html)}).listen(0,'127.0.0.1');await new Promise(r=>server.on('listening',r));
 const browser=await chromium.launch({executablePath:process.env.UI_BROWSER_PATH||undefined,args,headless:true});
 try{
 const page=await browser.newPage({viewport:{width:844,height:390},hasTouch:true,deviceScaleFactor:1}),errors=[],results=[];
 page.on('pageerror',e=>errors.push(String(e)));
 await page.goto('http://127.0.0.1:'+server.address().port);await page.waitForFunction(()=>globalThis.ui&&ui.BITMAPS.ready);
 await page.evaluate(()=>{ui.studioIntro.skip();ui.studioIntro.update(2);ui.game.player.spawnFX=0;ui.game.update=()=>{};});await page.waitForTimeout(450);
 async function check(name,selectors,shot=false){
  await page.waitForTimeout(50);
  const report=await page.evaluate(selectors=>{
   const visible=n=>n&&n.getClientRects().length&&!n.closest('[hidden],.hidden');
   const bad=[];for(const selector of selectors){const n=document.querySelector(selector);if(!visible(n)){bad.push(selector+': hidden');continue;}const r=n.getBoundingClientRect();if(r.x<-.5||r.y<-.5||r.right>innerWidth+.5||r.bottom>innerHeight+.5)bad.push(selector+': outside viewport '+JSON.stringify(r));else {const top=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);if(!n.contains(top))bad.push(selector+': obscured by '+top?.outerHTML.slice(0,150));}}
   const overflow=[...document.querySelectorAll('#menuBody,.settings-grid,.world-side,.transport-body,.journey-shell,.ward-pick')].filter(visible).filter(n=>n.scrollWidth>n.clientWidth+1).map(n=>n.id||n.className);
   return {bad,overflow,scroll:[...document.querySelectorAll('#menuBody,.settings-grid,.transport-body,.journey-shell')].filter(visible).map(n=>({element:n.id||n.className,extra:n.scrollHeight-n.clientHeight}))};
  },selectors);
  if(report.bad.length)await page.screenshot({path:path.join(root,'art/ui-landscape/ui-audit-failure.png')});
  assert.deepEqual(report.bad,[],name);assert.deepEqual(report.overflow,[],name+' horizontal overflow');
  if(shot){const dir=path.join(root,'art/ui-landscape');fs.mkdirSync(dir,{recursive:true});await page.screenshot({path:path.join(dir,name+'.png')});}
  results.push({name,...report});console.log("PASS "+name);
 }
 for(const [width,height,scale,safe]of (process.env.UI_AUDIT_CASES?JSON.parse(process.env.UI_AUDIT_CASES):[[568,320,100,false],[568,320,125,false],[844,390,125,true],[932,430,125,true],[667,375,100,false],[844,390,100,false]])){
  await page.evaluate(async()=>{if(document.fullscreenElement)await document.exitFullscreen();});
  await page.setViewportSize({width,height});await page.evaluate(({scale,safe})=>{const s=document.documentElement.style;for(const [side,value]of Object.entries({left:safe?44:0,right:safe?44:0,top:0,bottom:safe?21:0}))s.setProperty('--test-safe-'+side,value+'px');ui.setTextSize(scale,false);ui.game.journey=null;ui.game.dying=null;ui.showTitle();},{scale,safe});
  const prefix=width+'x'+height+'-'+scale+(safe?'-safe':''),shot=width===844&&scale===100;
  await check(prefix+'-title',['#menuNew','#menuLoad','#menuOptions','#menuQuit'],shot);
  await page.click('#menuOptions');await check(prefix+'-settings',['#optionsBack','#full'],shot);await page.click('#optionsBack');await page.evaluate(()=>ui.begin());
  await check(prefix+'-game',['#btnMenu','#btnWorld','#btnParty','[data-key=attack]','[data-key=guard]','[data-key=dodge]','[data-key=interact]'],shot);
  assert.equal(await page.locator('#btnWorld').count(),1);assert.equal(await page.locator('#menuMap').count(),1);
  await page.evaluate(()=>{const g=ui.game,n=g.npcs.find(n=>n.id==='elyne');if(n)g.recruitCompanion(n);ui.openMenu('bag');});
  await check(prefix+'-player-overview',['#menuResume','.player-overview [data-kind="character"]','.ward-big'],shot);
  assert.equal(await page.locator('.ui-inventory-nav').count(),0);
  await page.evaluate(()=>{ui.game.wardrobe.owned=ui.KaldorWardrobe.all().map(o=>o.id);ui.game.wardrobe.helmets=ui.KaldorWardrobe.helmets().map(o=>o.id);ui.selectMenuTab('bag');});
  await check(prefix+'-wardrobe',['#menuResume','[data-turn="-1"]','[data-turn="1"]'],shot);
  await page.locator('[data-wear="corsaire"]').click();assert.equal(await page.evaluate(()=>ui.game.wardrobe.worn),'corsaire');
  await page.locator('[data-helm="casque-cornes"]').click();assert.equal(await page.evaluate(()=>ui.game.wardrobe.helmet),'casque-cornes');
  await page.click('#btnHelp');await check(prefix+'-help',['#menuResume','#menuBody summary'],shot);
  await page.click('#btnQuests');await check(prefix+'-journal',['#menuResume'],shot);
  await page.click('#btnOptions');await check(prefix+'-settings-game',['#menuResume','#optionsHome'],shot);await page.click('#menuResume');
  await page.evaluate(()=>ui.openWorldPanel());await check(prefix+'-map',['#worldClose','#worldTrack','#worldNearestTransport','#worldZoomIn','#worldZoomOut'],shot);await page.click('#worldClose');
  await page.evaluate(()=>ui.openPartyPanel());await check(prefix+'-party',['#partyClose'],shot);await page.click('#partyClose');
  await page.evaluate(()=>{const g=ui.game,s=g.stations.find(s=>s.site==='camp');Object.assign(g.player,{x:s.actor.x,y:s.actor.y+14,coins:9999});for(const c of g.party){const a=g.partyActor(c.id);if(a)Object.assign(a,{x:g.player.x+5,y:g.player.y+5,level:0});c.status='following';c.down=false;c.hp=c.maxHp||10;}g.prepareTransport(s.id);ui.openTransportPanel();});
  await check(prefix+'-transport',['#transportClose','#transportGo','#transportBuy','#transportRest','#transportDestinationTrigger'],shot);
  await page.click('#transportDestinationTrigger');await check(prefix+'-destinations',['#transportClose','#transportGo','#transportDestinationTrigger']);await page.keyboard.press('Escape');
  await page.click('#transportHelpOpen');await check(prefix+'-travel-help',['#transportHelpClose']);await page.click('#transportHelpClose');await page.click('#transportGo');
  await page.evaluate(()=>ui.updateWorldUI());await check(prefix+'-journey',['#worldStop'],shot);
  await page.evaluate(()=>{ui.game.journey=null;ui.updateWorldUI();ui.run();ui.openQuestPanel({id:ui.QUESTS[0].id,mode:'offer'});});
  await check(prefix+'-quest',['#qpYes','#qpNo'],shot);await page.evaluate(()=>ui.closeQuestPanel(false));
  await page.evaluate(()=>{const g=ui.game,t=g.world.props.find(p=>p.kind==='tent'&&p.rest&&!p.owner);Object.assign(g.player,{x:t.x,y:t.y+10,level:0,onStairs:null});ui.openSleepPanel();});
  await check(prefix+'-sleep',['#slYes','#slNo','#slMinus','#slPlus'],shot);await page.click('#slNo');
  await page.evaluate(()=>{const g=ui.game;g.dialogue={speaker:'Le Veilleur',lines:['Les chemins du nord sont gelés. Prépare ta tenue, tes vivres et tes compagnons avant de reprendre la route.'],index:0,shown:999,choosing:false,who:g.player};ui.syncDialogue();ui.renderer.bubble();});
  await check(prefix+'-dialogue',['#dlgNext'],shot);
  await page.evaluate(()=>{ui.game.dialogue={speaker:'Le Veilleur',lines:[],index:0,shown:999,choosing:true,who:ui.game.player,menu:{prompt:'Quel chemin veux-tu emprunter ?',options:[{label:'Les trois sceaux de Nharos',mark:'offer'},{label:'Préparer le départ et les provisions'},{label:'Au revoir',end:true}]}};ui.syncDialogue();ui.renderer.bubble();});
  await check(prefix+'-choices',['#dlgBye','#dlgList .dlg-choice'],shot);
  await page.evaluate(()=>{ui.game.dialogue=null;ui.syncDialogue();ui.pause();});await check(prefix+'-pause',['#start','#newGame'],shot);
  await page.evaluate(()=>ui.overlay('TU AS PERDU UNE VIE','Mort de froid','Ta tenue ne protégeait pas assez du froid. Avar te rappelle à la dernière stèle allumée.','CONTINUER','',true,{mode:'death',second:'QUITTER'}));await check(prefix+'-death',['#start','#newGame']);
 }
 assert.deepEqual(errors,[],'browser errors');
 console.log(JSON.stringify({checks:results.length,errors,results},null,2));
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
