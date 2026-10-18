const {test}=require('node:test'),assert=require('node:assert/strict');
const vm=require('node:vm'),{html,canvas}=require('./game-harness.cjs');
const script=html.match(/<script>([\s\S]*?)<\/script>/)[1];
let api=null;
async function load(){
 if(api)return api;
 const context=vm.createContext({console,Image:canvas.Image,Uint8ClampedArray,Path2D:canvas.Path2D,setTimeout:()=>0,
  document:{createElement(tag){if(tag!=='canvas')throw Error(tag);return canvas.createCanvas(1,1);},getElementById(){return {hidden:true,clientHeight:224};}}});
 vm.runInContext(script.slice(0,script.indexOf('// app.js'))+';globalThis.api={Game,Atlas,Renderer,BodyHeat,KaldorWardrobe,worldClimateAt,Art:HearthreaverKaldorCivilianArt,BITMAPS};})();',context);
 await context.api.BITMAPS.promise;assert.equal(await context.api.Art.preload(),true);
 return api=context.api;
}
// One outfit per warmth level: pagne 0, brigandine 1, bear skin 2, great-cold pelisse 3.
const OUTFIT=['pagne-noue','brigandine-mercenaire','peau-ours','pelisse-grand-froid'];
const CALM={wind:0,rain:0,snow:0,blizzard:0};
function dressed(g,warmth,helmet=null){
 const w=g.wardrobe;w.owned=[...new Set([...w.owned,OUTFIT[warmth]])];if(helmet)w.helmets=[...new Set([...w.helmets,helmet])];
 w.worn=OUTFIT[warmth];w.helmet=helmet;assert.equal(g.outfitWarmth(),Math.min(3,warmth+(helmet==='casque-fourre'?1:0)));return g;
}
// Out in the open, away from villages and halts.
function wild(g,name='Roche-Blanche'){const n=g.constructor&&api.Atlas.nodes.find(n=>n.name===name),p=api.Atlas.toGame(n.x+90,n.y);Object.assign(g.player,p);g.dialogue=null;assert.equal(g.bodyShelter(),null);return g;}
function weather(g,temperature,extra={}){g.sky=()=>({...CALM,...extra,temperature});g._bodyHeat=null;return g.bodyHeat();}

test('each warmth level keeps Kaldor comfortable in its own range, then he shivers, then the cold bites',async()=>{
 const {Game,BodyHeat}=await load();
 assert.deepEqual([...BodyHeat.COMFORT.map(c=>c.cold)],[8,-4,-14,-30]);
 assert.deepEqual([...BodyHeat.COMFORT.map(c=>c.hot)],[Infinity,30,22,14]);
 for(let warmth=0;warmth<4;warmth++){
  const g=wild(dressed(new Game(),warmth)),{cold}=BodyHeat.COMFORT[warmth];
  assert.equal(weather(g,cold+1).state,'comfortable');
  const chilly=weather(g,cold-BodyHeat.SHIVER);assert.equal(chilly.state,'chilly');assert.equal(chilly.bite,0);
  const freezing=weather(g,cold-10);assert.equal(freezing.state,'freezing');assert.ok(Math.abs(freezing.bite-(10-BodyHeat.SHIVER)/BodyHeat.BITE)<1e-12);
 }
 // The fur helmet adds its warmth to the bear skin: the great cold.
 const g=wild(dressed(new Game(),2,'casque-fourre'));assert.equal(weather(g,-25).state,'comfortable');
});

test('wind, rain, snow and blizzard chill the body; a village breaks the wind, a halt fire shelters',async()=>{
 const {BodyHeat}=await load(),felt=(sky,shelter=null)=>BodyHeat.felt({...CALM,...sky},shelter);
 assert.equal(felt({temperature:-5}),-5);
 assert.ok(felt({temperature:-5,wind:.6})<-9);
 assert.ok(felt({temperature:-5,rain:.5})<felt({temperature:-5}));
 assert.ok(felt({temperature:-5,snow:.8,blizzard:.6})<-10);
 assert.ok(felt({temperature:-5,wind:.6},'village')>felt({temperature:-5,wind:.6}));
 assert.equal(felt({temperature:-25,wind:.8,blizzard:1},'hearth'),BodyHeat.HEARTH);
 // Wind never cools a hot day, and a fire never heats it further.
 assert.equal(felt({temperature:35,wind:.8}),35);assert.equal(felt({temperature:35},'hearth'),35);
});

test('the cold kills Kaldor fast without a warm outfit, the great-cold pelisse keeps him alive',async()=>{
 const {Game}=await load();
 const g=wild(new Game());weather(g,-25);g.events.length=0;let minutes=0;
 while(!g.dying&&minutes<600){g.advanceNeeds(1);minutes++;}
 assert.ok(g.dying,'dead of cold');assert.equal(g.dying.cause,'cold');assert.ok(minutes<60,'in less than 40 real seconds: '+minutes);
 assert.ok(g.events.some(e=>e.type==='lifelost'));assert.ok(g.events.some(e=>e.type==='hurt'));
 for(let i=0;i<40&&g.dying.stage==='fall';i++)g.stepDying(.05);
 assert.equal(g.events.find(e=>e.type==='fallen').cause,'cold');
 assert.match(html,/ev\.cause==='cold'\?'Mort de froid':'Vaincu'/);
 const warm=wild(dressed(new Game(),3));weather(warm,-25);warm.advanceNeeds(1440);assert.equal(warm.player.hp,warm.player.maxHp);assert.equal(warm.dying,null);
 // Light clothing in a mild winter only makes him shiver.
 const light=wild(dressed(new Game(),1),'Clairval');weather(light,-5);light.advanceNeeds(1440);assert.equal(light.player.hp,light.player.maxHp);
});

test('a journey through the cold leaves Kaldor at 1 HP, never dead, and says why',async()=>{
 const {Game}=await load();const g=wild(new Game());weather(g,-25);
 g.journey={plan:{stages:[{kind:'move',minutes:600}]},index:0,elapsed:0};g.supplies.food=99;
 g.advanceNeeds(600);assert.equal(g.player.hp,1);assert.equal(g.dying,null);
 // A rest stage sleeps by the fire.
 g.player.hp=5;g.journey.plan.stages[0]={kind:'rest',minutes:600};g._bodyHeat=null;assert.equal(g.bodyShelter(),'hearth');g.advanceNeeds(600);assert.equal(g.player.hp,5);
});

test('the fire of a halt and Avar’s return keep the cold away for a while',async()=>{
 const {Game,Atlas,BodyHeat}=await load();const g=new Game(),n=Atlas.nodes.find(n=>n.name==='Roche-Blanche');
 const fire=g.atlasProps.find(o=>o.rest&&o.site===n.id);Object.assign(g.player,{x:fire.x,y:fire.y+12});g.dialogue=null;
 assert.equal(g.bodyShelter(),'hearth');const b=weather(g,-28,{wind:.7});assert.equal(b.felt,BodyHeat.HEARTH);g.advanceNeeds(600);assert.equal(g.player.hp,g.player.maxHp);
 Object.assign(g.player,Atlas.toGame(n.x,n.y));assert.equal(g.bodyShelter(),'village');assert.equal(weather(g,-28).state,'freezing');
 // Avar brings him back at the last checkpoint, warmed for a while even out in the open.
 g.respawn();wild(g);assert.equal(weather(g,-28).bite,0,'warmed by Avar');
 g.advanceNeeds(BodyHeat.GRACE-1);assert.equal(g.player.hp,g.player.maxHp);
 g.clock+=BodyHeat.GRACE;assert.ok(weather(g,-28).bite>0);
});

test('too warm an outfit in the heat digs hunger faster but never costs health',async()=>{
 const {Game,BodyHeat}=await load();
 const g=wild(dressed(new Game(),3),'Oasis-du-Safran'),b=weather(g,38);
 assert.equal(b.state,'overheated');assert.ok(Math.abs(b.hunger-(1+(38-14)/BodyHeat.HEAT))<1e-12);assert.equal(b.bite,0);
 g.needs.autoEat=false;g.advanceNeeds(60);assert.ok(Math.abs(g.needs.satiety-(100-60*b.hunger*100/2160))<1e-9);
 g.needs.autoEat=true;g.supplies.food=999;g.advanceNeeds(4*1440);assert.equal(g.player.hp,g.player.maxHp);
 assert.equal(weather(g,90).hunger,BodyHeat.HUNGER_MAX);
 // Pagne, desert veils: never too warm.
 const bare=wild(new Game(),'Oasis-du-Safran');assert.equal(weather(bare,42).hunger,1);assert.equal(bare.bodyHeat().state,'comfortable');
 // Each outfit is too warm only past its own limit.
 for(let warmth=1;warmth<4;warmth++){const h=wild(dressed(new Game(),warmth));assert.equal(weather(h,BodyHeat.COMFORT[warmth].hot).hunger,1);assert.ok(weather(h,BodyHeat.COMFORT[warmth].hot+5).hunger>1);}
});

test('the transport panel tells the climate on the route and packs rations for the heat',async()=>{
 const {Game,Atlas}=await load(),g=new Game();
 const cold=Atlas.nodes.find(n=>n.name==='Roche-Blanche'),plan={stages:[{kind:'move',minutes:240,from:[cold.x+200,cold.y],to:[cold.x+90,cold.y]},{kind:'rest',minutes:600,x:cold.x,y:cold.y}],minutes:840};
 g.clock=72*1440+3*60;assert.match(g.journeyClimateText(plan),/Ressenti en route : de −\d+ °C à −?\d+ °C\. Ta tenue ne protège que jusqu’à 8 °C : le froid rongera la santé de Kaldor en route\./);
 dressed(g,3);assert.match(g.journeyClimateText(plan),/Ta tenue convient\./);
 const hot=Atlas.nodes.find(n=>n.name==='Oasis-du-Safran'),desert={stages:[{kind:'move',minutes:1440,from:[hot.x+200,hot.y],to:[hot.x+90,hot.y]}],minutes:1440};
 g.clock=24*1440+12*60;assert.ok(g.journeyHunger(desert)>2);assert.match(g.journeyClimateText(desert),/trop chaude par endroits : la faim se creusera plus vite/);
 const heavy=g.journeyNeeds(desert).food;dressed(g,0);assert.equal(g.journeyHunger(desert),1);assert.ok(heavy>g.journeyNeeds(desert).food);
});

test('warnings come once as the cold worsens or the outfit gets too warm',async()=>{
 const {Game}=await load(),g=wild(new Game()),titles=()=>[...g.events.filter(e=>e.type==='notice').map(e=>e.title)];g.events.length=0;
 weather(g,12);g.bodyHeatNotices();assert.deepEqual(titles(),[]);
 weather(g,7);g.bodyHeatNotices();weather(g,6.5);g.bodyHeatNotices();assert.deepEqual(titles(),['Le froid gagne']);
 weather(g,-10);g.bodyHeatNotices();assert.deepEqual(titles(),['Le froid gagne','Grand froid']);
 weather(g,7);g.bodyHeatNotices();weather(g,12);g.bodyHeatNotices();assert.equal(titles().length,2,'warming up is silent');
 dressed(g,3);weather(g,30);g.bodyHeatNotices();assert.equal(titles().at(-1),'Trop couvert');
 assert.match(g.events.at(-1).text,/la faim se creuse 160 % plus vite/);
});

test('the HUD marks the body state by the temperature and the inventory explains the outfit range',async()=>{
 const {Game,Atlas,Renderer,KaldorWardrobe}=await load(),g=new Game(),n=Atlas.nodes.find(n=>n.name==='Roche-Blanche');
 Object.assign(g.player,Atlas.toGame(n.x+90,n.y));g.dialogue=null;g.clock=72*1440+4*60;g.updateLocation(0);
 const cv=canvas.createCanvas(640,400),r=new Renderer(cv,canvas.createCanvas(1,1),g);r.resize(320,200,{t:0,b:0,l:0,r:0},2);
 r.frame();assert.equal(g.bodyHeat().state,'freezing');assert.equal(r.temperatureReadout.body,'freezing');assert.equal(r.temperatureReadout.temperature,Math.round(g.sky().temperature));
 const row=KaldorWardrobe.inventoryHTML(g);assert.match(row,/<div class="m-sec">Climat<\/div>/);assert.match(row,/Ressenti −\d+ °C · air −\d+ °C/);assert.match(row,/Ta tenue protège jusqu’à 8 °C, jamais trop chaude\. Grand froid : Kaldor perd de la santé/);
 dressed(g,3);g._bodyHeat=null;assert.match(KaldorWardrobe.inventoryHTML(g),/protège jusqu’à −30 °C et devient trop chaude au-delà de 14 °C\. Kaldor est à l’aise\./);
 r.frame();assert.equal(r.temperatureReadout.body,'comfortable');
});
