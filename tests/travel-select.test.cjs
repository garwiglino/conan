const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {JSDOM}=require('jsdom');
const read=n=>fs.readFileSync(path.join(__dirname,'../scripts',n),'utf8');
test('travel destinations use real continent groups and French alphabetical order, including docks',async()=>{
 const {Atlas}=await require('./game-harness.cjs').loadGame();
 const dom=new JSDOM('<select id="dest"></select>',{runScripts:'outside-only'}),w=dom.window;
 try{
  w.Atlas=Atlas;w.eval(read('world-ui.js'));w.eval(read('travel-select.js'));
  const nodes=Atlas.nodes.filter(n=>n.rest&&n.id!=='camp'),select=w.document.getElementById('dest');
  select.innerHTML=w.travelDestinationOptions(nodes);
  assert.equal(select.options.length,nodes.length);assert.equal(select.querySelector('option[value="camp"]'),null);
  const groups=[...select.children];assert.ok(groups.length>=4);
  assert.deepEqual(groups.map(g=>g.label),groups.map(g=>g.label).sort((a,b)=>a.localeCompare(b,'fr')));
  for(const group of groups){const names=[...group.children].map(o=>o.textContent);assert.deepEqual(names,[...names].sort((a,b)=>a.localeCompare(b,'fr')));for(const option of group.children){const node=Atlas.byId[option.value];assert.equal(group.label,Atlas.regions.get(node.region).continent);}}
 }finally{w.close();}
});
test('game selectors choose on click, preserve choice on Escape, support arrows and close on outside tap',()=>{
 const dom=new JSDOM('<label>Destination<select id="transportDestination"><optgroup label="Igea"><option value="a">Aulne</option><option value="b">Bois</option></optgroup><optgroup label="Varan"><option value="c">Cap</option></optgroup></select></label><select id="transportMode"><option value="horse">Cheval</option></select><select id="transportPreference"><option value="fast">Rapide</option></select><button id="outside">Fermer</button>',{runScripts:'outside-only',pretendToBeVisual:true}),w=dom.window;
 try{
  w.$=id=>w.document.getElementById(id);w.eval(read('travel-select.js'));w.installTravelSelects();w.addEventListener('keydown',w.travelSelectKeydown);
  const select=w.$('transportDestination'),trigger=w.$('transportDestinationTrigger'),list=w.$('transportDestinationList');let changes=0;select.addEventListener('change',()=>changes++);
  const key=k=>w.document.activeElement.dispatchEvent(new w.KeyboardEvent('keydown',{key:k,bubbles:true,cancelable:true}));
  assert.equal(select.hidden,true);assert.equal(trigger.getAttribute('aria-expanded'),'false');trigger.focus();key('ArrowDown');assert.equal(list.hidden,false);assert.equal(w.document.activeElement.dataset.value,'a');key('End');assert.equal(w.document.activeElement.dataset.value,'c');key('Escape');assert.equal(select.value,'a');assert.equal(changes,0);assert.equal(w.document.activeElement,trigger);
  trigger.click();list.querySelector('[data-value="b"]').click();assert.equal(select.value,'b');assert.equal(changes,1);assert.equal(list.hidden,true);assert.match(trigger.textContent,/Bois/);
  trigger.click();assert.equal(w.document.activeElement.dataset.value,'b');w.$('outside').dispatchEvent(new w.Event('pointerdown',{bubbles:true}));assert.equal(list.hidden,true);
  trigger.click();w.$('transportModeTrigger').click();assert.equal(list.hidden,true);assert.equal(w.$('transportModeList').hidden,false);w.closeTravelSelect();
  trigger.focus();key('Enter');key('Home');key('ArrowDown');key('Enter');assert.equal(select.value,'b');assert.equal(list.hidden,true);assert.equal(changes,2);
  trigger.focus();key(' ');key('End');key(' ');assert.equal(select.value,'c');assert.equal(changes,3);assert.equal(list.hidden,true);
  select.replaceChildren();w.syncTravelSelect(select.id);assert.equal(trigger.disabled,true);
 }finally{w.close();}
});
