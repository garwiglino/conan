'use strict';
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs'),{chromium}=require('playwright');
let browser;
(async()=>{
 browser=await chromium.launch({headless:true,...(fs.existsSync('/usr/bin/chromium')?{executablePath:'/usr/bin/chromium'}:{})});const page=await browser.newPage({viewport:{width:1440,height:1150},deviceScaleFactor:1}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.route('http://127.0.0.1:8765/humains-autonome',route=>route.fulfill({contentType:'text/html',body:fs.readFileSync(path.resolve(__dirname,'../test-output/humains/atelier-autonome.html'),'utf8')}));
 await page.goto('http://127.0.0.1:8765/humains-autonome');await page.waitForFunction(()=>window.HumanWorkshop);
 await page.click('#play');await page.evaluate(()=>HumanWorkshop.setFrame(0));
 assert.equal(await page.locator('#action').inputValue(),'count');assert.equal(await page.locator('#winter').isChecked(),true);assert.equal(await page.locator('#climate').inputValue(),'neige');
 assert.equal(await page.locator('.views .view:not([hidden]) canvas').count(),1,'one view per fixed station');
 await page.screenshot({path:path.resolve(__dirname,'../art/humains/activites/atelier-capture.png'),fullPage:false});
 await page.uncheck('#winter');await page.selectOption('#role','healer');await page.selectOption('#sex','feminin');await page.selectOption('#action','bandage');assert.equal(await page.locator('#error').textContent(),'');
 await page.selectOption('#role','miner');assert.equal(await page.locator('#sex').inputValue(),'masculin');assert.ok(await page.locator('#sex').isDisabled());
 await page.selectOption('#climate','neige');await page.selectOption('#hat','casque-fourre');await page.click('#step');assert.equal(await page.locator('#error').textContent(),'');
 await page.click('[data-tab="military"]');assert.ok(await page.locator('.card').count()>=20);
 await page.click('[data-tab="gestures"]');assert.equal(await page.locator('.card').count(),152);
 await page.fill('#search','calfater');await page.waitForTimeout(200);assert.equal(await page.locator('.card').count(),1);await page.locator('.card').click();assert.equal(await page.locator('#action').inputValue(),'repair_boat');
 await page.fill('#search','');await page.click('[data-tab="stations"]');assert.equal(await page.locator('.card').count(),49);await page.locator('.card').first().click();assert.equal(await page.locator('#station').inputValue(),'workbench');await page.check('#sockets');await page.uncheck('#actors');await page.selectOption('#plane','front');assert.equal(await page.locator('#error').textContent(),'');await page.selectOption('#plane','all');await page.check('#actors');await page.uncheck('#sockets');await page.selectOption('#station','auto');
 await page.check('#winter');await page.click('[data-tab="stations"]');assert.equal(await page.locator('.card').count(),44);await page.selectOption('#station','auto');await page.selectOption('#role','farmer');assert.equal(await page.locator('#action option[value="sow"]').evaluate(n=>n.disabled),true);await page.selectOption('#action','clear_snow');assert.equal(await page.locator('#error').textContent(),'');await page.check('#terrain');await page.click('#step');assert.equal(await page.locator('#error').textContent(),'');await page.uncheck('#terrain');await page.selectOption('#role','fisher');assert.equal(await page.locator('#action option[value="cast_net"]').evaluate(n=>n.disabled),true);await page.getByText('Conditions observées',{exact:true}).click();await page.check('#openWater');assert.equal(await page.locator('#action option[value="cast_net"]').evaluate(n=>n.disabled),false);await page.selectOption('#action','cast_net');assert.equal(await page.locator('#error').textContent(),'');await page.selectOption('#role','cook');await page.selectOption('#action','stoke_fire');await page.click('#step');assert.equal(await page.locator('#error').textContent(),'');await page.uncheck('#winter');
 await page.click('[data-tab="references"]');assert.equal(await page.locator('#references img').count(),8);assert.ok(await page.locator('#references').isVisible());
 await page.click('#horseQuick');assert.equal(await page.locator('#action').inputValue(),'ride');assert.equal(await page.locator('.views .view:not([hidden]) canvas').count(),4,'free horse directions preserved');
 await page.evaluate(()=>{HumanWorkshop.selectRole('smith','forge');document.getElementById('station').value='auto';});await page.locator('summary').filter({hasText:'Coiffure et variantes'}).click();await page.locator('#partsDetails summary').click();await page.selectOption('#outfit','T01-masculin');await page.selectOption('#part-sleeves','kaldor:cotte-mailles');await page.selectOption('#part-gloves','N04-masculin');await page.selectOption('#part-feet','kaldor:robe-serpent');await page.click('#step');assert.equal(await page.locator('#error').textContent(),'');assert.deepEqual(await page.evaluate(()=>HumanWorkshop.selection().parts),{feet:'kaldor:robe-serpent',sleeves:'kaldor:cotte-mailles',gloves:'N04-masculin'});await page.selectOption('#part-sleeves','none');await page.selectOption('#part-gloves','none');assert.equal(await page.locator('#error').textContent(),'');await page.click('#resetParts');assert.equal(await page.evaluate(()=>HumanWorkshop.selection().parts),undefined);
 await page.evaluate(()=>{const A=HearthreaverHumanActivities,hat=document.getElementById('hat');for(const sex of ['masculin','feminin']){HumanWorkshop.selectRole('civilian','seated');document.getElementById('sex').value=sex;document.getElementById('sex').dispatchEvent(new Event('change'));for(const option of [...hat.options].filter(o=>!['auto','none'].includes(o.value))){hat.value=option.value;hat.dispatchEvent(new Event('change'));HumanWorkshop.setFrame(3);if(document.getElementById('error').textContent)throw Error(sex+'/'+option.value+': '+document.getElementById('error').textContent);}}});
 await page.setViewportSize({width:390,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'mobile horizontal overflow');
 assert.deepEqual(errors,[]);
 // Every clip is selectable and actually renders in the real browser, too.
 await page.evaluate(()=>{const A=HearthreaverHumanActivities;for(const action of Object.keys(A.CLIPS)){const role=Object.keys(A.ROLES).find(r=>A.activitiesFor(r).includes(action));HumanWorkshop.selectRole(role,action);HumanWorkshop.setFrame(Math.min(3,A.CLIPS[action].frames-1));if(document.getElementById('error').textContent)throw Error(action+': '+document.getElementById('error').textContent);}});
 await page.evaluate(()=>{const P=HearthreaverHumanStations,S=HearthreaverHumanScene;for(const id of Object.keys(P.ASSETS)){const o=S.optionsFor(id);HumanWorkshop.selectRole(o.role,o.action);document.getElementById('station').value=id;document.getElementById('station').dispatchEvent(new Event('change'));if(document.getElementById('error').textContent)throw Error(id+': '+document.getElementById('error').textContent);if(document.querySelectorAll('.views .view:not([hidden]) canvas').length!==1)throw Error(id+' shows redundant views');const canvas=document.querySelector('.views .view:not([hidden]) canvas');if(canvas.dataset.direction!==P.ASSETS[id].operatorFacing)throw Error(id+' wrong fixed orientation');HumanWorkshop.setFrame(0);const start=canvas.dataset.direction;HumanWorkshop.setFrame(Math.min(3,HearthreaverHumanActivities.CLIPS[o.action].frames-1));if(canvas.dataset.direction!==start)throw Error(id+' rotates while working');}document.getElementById('station').value='auto';});
 await page.uncheck('#terrain');
 // Verify actual canvas placement: a work station must not push the shadow
 // below the feet, and mounting must not change the camera at saddle contact.
 await page.evaluate(()=>{
  const proto=CanvasRenderingContext2D.prototype,ellipse=proto.ellipse,drawImage=proto.drawImage,records=new Map(),A=HearthreaverHumanActivities;
  const record=c=>{if(!records.has(c))records.set(c,{});return records.get(c);};
  proto.ellipse=function(...args){if(this.canvas.matches('.views canvas'))record(this.canvas).shadow=args;return ellipse.apply(this,args);};
  proto.drawImage=function(...args){if(this.canvas.matches('.views canvas'))record(this.canvas).image={x:args[1],y:args[2],scale:args[3]/128};return drawImage.apply(this,args);};
  try{
   for(const [role,action]of [['civilian','idle'],['miner','mine'],['groom','mount'],['civilian','sleep'],['boatman','row']]){
    HumanWorkshop.selectRole(role,action);HumanWorkshop.setFrame(1);records.clear();HumanWorkshop.setFrame(0);
    const start=[...records.values()].map(v=>v.image.y);
    [...document.querySelectorAll('.views .view:not([hidden]) canvas')].forEach((cv,i)=>{
     const options={...HumanWorkshop.selection(),action,frame:0,dir:cv.dataset.direction},support=HearthreaverHumanScene.raster(options).metadata.support,r=records.get(cv);
     if(support.shadow){const expected=r.image.y+support.ground[1]*r.image.scale+1;if(!r.shadow||Math.abs(r.shadow[1]-expected)>.01)throw Error(action+' floating shadow');}
     else if(r.shadow)throw Error(action+' unsupported ground shadow');
    });
    if(action==='mount'){records.clear();HumanWorkshop.setFrame(7);if([...records.values()].some((v,i)=>v.image.y!==start[i]))throw Error('Mount camera jumps');}
   }
  }finally{proto.ellipse=ellipse;proto.drawImage=drawImage;}
 });
 await browser.close();console.log('Workshop checked: offline loading, one fixed station view, free actor directions, roles, gender constraints, all 152 clips, 48 independent stations + winter world socket, layer controls, sockets, mixed garment pieces, every headgear selector on both bodies, search, concepts, mobile layout; no browser errors.');
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>browser?.close());
