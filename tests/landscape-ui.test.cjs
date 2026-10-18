const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {JSDOM}=require('jsdom');
const code=fs.readFileSync(require('node:path').join(__dirname,'../scripts/landscape-ui.js'),'utf8');
function fixture(markup){const dom=new JSDOM('<div id="body">'+markup+'</div>'),context=vm.createContext({document:dom.window.document});vm.runInContext(code,context);return {dom,body:dom.window.document.getElementById('body'),compose:page=>vm.runInContext('composeMenuSections(document.getElementById("body"),'+JSON.stringify(page)+')',context)};}
test('inventory sections preserve live action nodes, expose one panel and support keyboard tabs',()=>{
 const f=fixture('<div class="m-sec">Personnage</div><p>Santé 10/10</p><div class="m-sec">Tenue</div><button id="wear">Tenue</button><div class="m-sec">Climat</div><p>Froid</p><div class="m-sec">Objets</div><button id="drink">Boire</button>');
 let drinks=0;const button=f.body.querySelector('#drink');button.onclick=()=>drinks++;f.compose('bag');
 assert.equal(f.body.querySelector('#drink'),button);button.click();assert.equal(drinks,1);
 const tabs=[...f.body.querySelectorAll('[role=tab]')],visible=()=>[...f.body.querySelectorAll('[role=tabpanel]')].filter(s=>!s.hidden);
 assert.equal(visible().length,1);assert.equal(visible()[0].dataset.section,'Objets');
 tabs[1].click();assert.equal(visible()[0].dataset.section,'Tenue');assert.equal(tabs[1].getAttribute('aria-selected'),'true');
 tabs[1].dispatchEvent(new f.dom.window.KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true}));assert.equal(visible()[0].dataset.section,'Climat');assert.equal(f.dom.window.document.activeElement,tabs[2]);
 f.compose('bag');assert.equal(f.body.querySelectorAll('.ui-inventory-nav').length,1);f.dom.window.close();
});
test('completed quests and long help remain available in native disclosures',()=>{
 const f=fixture('<div class="m-sec">En cours</div><div class="q">Mission active</div><div class="m-sec">Accomplies</div><div class="q done">Mission passée</div>');f.compose('quests');
 const done=f.body.querySelector('details');assert.equal(done.open,false);assert.match(done.textContent,/Mission passée/);assert.equal(f.body.querySelector('.q').closest('details'),null);f.dom.window.close();
 const help=fixture('<div class="m-sec">Combattre</div><p>Une parade étourdit.</p>');help.compose('help');assert.equal(help.body.querySelector('summary').textContent,'Combattre');assert.match(help.body.querySelector('details').textContent,/parade/);help.dom.window.close();
});
test('wardrobe keeps its canvases and controls outside inventory section composition',()=>{
 const f=fixture('<div class="ward"><canvas></canvas><button>Tourner</button></div>'),cv=f.body.querySelector('canvas');f.compose('bag');assert.equal(f.body.dataset.page,'wardrobe');assert.equal(f.body.querySelector('canvas'),cv);assert.equal(f.body.querySelector('.ui-inventory-nav'),null);f.dom.window.close();
});
