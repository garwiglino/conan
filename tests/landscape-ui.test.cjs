const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {JSDOM}=require('jsdom');
const code=fs.readFileSync(require('node:path').join(__dirname,'../scripts/landscape-ui.js'),'utf8');
function fixture(markup){const dom=new JSDOM('<div id="body">'+markup+'</div>'),context=vm.createContext({document:dom.window.document,game:{player:{hp:10,maxHp:10,lives:3,coins:12},lvl:()=>({level:2,into:5,need:20})},LIVES:3});vm.runInContext(code,context);return {dom,body:dom.window.document.getElementById('body'),compose:page=>vm.runInContext('composeMenuSections(document.getElementById("body"),'+JSON.stringify(page)+')',context)};}
test('unified player sheet preserves live actions, visible sections and an adjacent outfit panel',()=>{
 const f=fixture('<div class="m-sec">Personnage</div><p>Santé 10/10</p><div class="m-sec">Tenue</div><button id="wear">Tenue</button><div class="m-sec">Climat</div><p>Froid</p><div class="m-sec">Objets</div><button id="drink">Boire</button>');
 let drinks=0;const button=f.body.querySelector('#drink');button.onclick=()=>drinks++;f.compose('bag');
 assert.equal(f.body.querySelector('#drink'),button);button.click();assert.equal(drinks,1);
 assert.equal(f.body.querySelectorAll('[role=tab]').length,0);assert.equal(f.body.querySelectorAll('.ui-section').length,4);assert.equal(f.body.querySelectorAll('.ui-section[hidden]').length,0);
 assert.ok(f.body.querySelector('[data-kind="items"]').closest('.player-possession'));assert.equal(f.body.querySelector('[data-kind="outfit"]').parentElement,f.body);assert.match(f.body.querySelector('.player-stats').textContent,/Kaldor · Niv. 2/);assert.match(f.body.querySelector('.player-stats').textContent,/Or 12/);
 f.compose('bag');assert.equal(f.body.querySelectorAll('.player-possession').length,1);assert.equal(f.body.querySelector('#drink'),button);f.dom.window.close();
});
test('completed quests and long help remain available in native disclosures',()=>{
 const f=fixture('<div class="m-sec">En cours</div><div class="q">Mission active</div><div class="m-sec">Accomplies</div><div class="q done">Mission passée</div>');f.compose('quests');
 const done=f.body.querySelector('details');assert.equal(done.open,false);assert.match(done.textContent,/Mission passée/);assert.equal(f.body.querySelector('.q').closest('details'),null);f.dom.window.close();
 const help=fixture('<div class="m-sec">Combattre</div><p>Une parade étourdit.</p>');help.compose('help');assert.equal(help.body.querySelector('summary').textContent,'Combattre');assert.match(help.body.querySelector('details').textContent,/parade/);help.dom.window.close();
});
test('unified wardrobe keeps its canvas and controls without reintroducing inventory submenus',()=>{
 const f=fixture('<div class="ward"><canvas></canvas><button>Tourner</button></div>'),cv=f.body.querySelector('canvas'),button=f.body.querySelector('button');f.compose('bag');assert.equal(f.body.dataset.page,'bag');assert.equal(f.body.querySelector('canvas'),cv);assert.equal(f.body.querySelector('button'),button);assert.equal(f.body.querySelector('.ui-inventory-nav'),null);f.dom.window.close();
});
