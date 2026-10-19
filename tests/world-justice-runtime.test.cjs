const {test,before}=require('node:test'),assert=require('node:assert/strict');
const {loadGame}=require('./game-harness.cjs');let a;before(async()=>a=await loadGame());
function stage(){const g=new a.Game();g.clock=480;g.worldState=new a.Atlas.WorldState({clock:480});g.atlasLastClock=g.clock;g.enemies=[];g.populateAtlas=()=>{};g.solid=()=>false;g.lineClear=()=>true;g.dangerAt=()=>({unsafe:false});g.worldStore.readFor=()=>null;
 const residents=g.npcs.filter(n=>n.resident&&!n.batracien).slice(0,3),station=g.stations.find(s=>s.site==='camp'),p=a.Atlas.toGame(a.Atlas.byId.camp.x,a.Atlas.byId.camp.y);assert.ok(residents.length>=3);
 for(const [i,n]of residents.entries()){Object.assign(n,{x:p.x+200+i*40,y:p.y,site:'camp',alpha:1,post:{x:p.x+200+i*40,y:p.y}});delete n.dangerState;n.civilian.inv=0;n.civilian.hp=6;n.civilian.dead=false;}
 Object.assign(station.actor,{x:p.x+600,y:p.y});Object.assign(g.player,{x:residents[0].x-14,y:p.y,level:0,inv:0,coins:100});g.npcs=[...residents,station.actor];g.atlasNpcs=[...g.npcs];return {g,residents,station,p};
}
function guard(g,p){const e=g.worldState.add('patrol','camp',g.clock,1440),n={id:'incident-'+e.id+'-0',eventId:e.id,eventGuard:true,site:'camp',world:true,x:p.x,y:p.y,post:{...p},alpha:1,dir:2,look:'nomade',head:40,name:'LA GARDE',label:'GARDE',greet:()=>['Halte.'],topics:()=>[],bye:()=>['Passe ton chemin.']};g.npcs.push(n);g.ensureHumanGuard(n);return n;}
test('real hits collect witnesses only on the same floor with line of sight; monster hits never accuse the player',()=>{
 const {g,residents:[n,w,z]}=stage();z.level=1;g.lineClear=(from)=>from!==w;g.damageCivilian(n,1,g.player);assert.equal(g.worldState.justice.state.cases.length,0);n.civilian.inv=0;g.damageCivilian(n,1,g.player);const c=g.worldState.justice.state.cases[0];assert.ok(c);assert.deepEqual(Object.keys(c.witnesses),[n.id]);assert.equal(c.reportedAt,null);
 n.civilian.inv=0;g.damageCivilian(n,1,{x:n.x+10,y:n.y,level:0,id:'monster'});assert.equal(c.attacks,1);
});
test('killing an unreported witness does not silently file their testimony',()=>{
 const {g,residents:[n,w,z],station}=stage();g.npcs=g.npcs.filter(a=>a!==z);station.actor.x+=1000;
 g.damageCivilian(n,100,g.player);const c=g.worldState.justice.state.cases.find(c=>c.victim===n.id);assert.ok(c.witnesses[w.id]);assert.equal(c.reportedAt,null);
 g.damageCivilian(w,100,g.player);assert.equal(c.witnesses[w.id].dead,true);g.stepJusticeWitnesses(.04);assert.equal(c.reportedAt,null);assert.equal(g.worldState.justice.effect('camp',null,g.clock).wanted,false);assert.ok(g.worldState.justice.state.cases.find(c=>c.victim===w.id).intimidation);
});
test('a surviving witness must reach a real reporting contact and transmitted evidence survives death and reload',()=>{
 const {g,residents:[n,w,z],station}=stage();g.npcs=g.npcs.filter(a=>a!==z);g.damageCivilian(n,100,g.player);const c=g.worldState.justice.state.cases.find(c=>c.victim===n.id);
 g.stepJusticeWitnesses(0);assert.equal(c.reportedAt,null);Object.assign(w,{x:station.actor.x-20,y:station.actor.y});g.stepJusticeWitnesses(0);assert.equal(c.reportedAt,g.clock);assert.equal(g.worldState.justice.effect('camp',null,g.clock).wanted,true);
 g.damageCivilian(w,100,g.player);assert.equal(c.witnesses[w.id].filedAt,g.clock);const copy=new a.Game(JSON.parse(JSON.stringify(g.serialize())));assert.equal(copy.worldState.justice.effect('camp',null,g.clock).wanted,true);
});
test('a late arrival sees corpses, reports a massacre and never automatically learns the murderer',()=>{
 const {g,residents,station}=stage();const late=station.actor;late.x+=1000;for(const n of residents){g.npcs=[n,late];g.damageCivilian(n,100,g.player);}g.npcs=[...residents,late];
 const j=g.worldState.justice;assert.equal(j.state.scenes.length,1);assert.equal(j.effect('camp',null,g.clock).wanted,false);
 Object.assign(late,{x:residents[1].x,y:residents[1].y+35});const officer=guard(g,{x:late.x+22,y:late.y});g.stepJusticeWitnesses(0);
 const scene=j.state.scenes[0];assert.ok(scene.reportedVictims.length>=3);assert.ok(g.worldState.events.some(e=>e.type==='massacre'));assert.equal(j.effect('camp',null,g.clock).wanted,false);assert.equal(j.pending(late.id,g.clock).length,0);assert.equal(g.isHostileHumanGuard(officer),false);
});
test('local information and purchase prices recover with time; unrelated towns stay unaffected',()=>{
 const {g,residents:[n],p}=stage();Object.assign(g.player,p);const base=g.supplyQuote(1),j=g.worldState.justice,c=j.record({site:'camp',victim:n.id,kind:'murder',witnesses:[n.id],at:g.clock});j.file(c.id,n.id,g.clock);
 assert.match(g.atlasNews(n).join(' '),/renseignements/);const q=g.supplyQuote(1);assert.ok(q.cost>base.cost);assert.ok(q.justiceMarkup>1);assert.equal(j.effect(a.Atlas.nodes.find(n=>n.rest&&n.id!=='camp').id,null,g.clock).price,1);
 g.clock+=7*1440+1;assert.equal(g.justiceEffect(n).refuse,false);assert.equal(g.supplyQuote(1).justiceMarkup,1);
});
test('surrender charges once, releases the player, preserves gear and clears local pursuit, not distrust',()=>{
 const {g,residents:[n],p}=stage();Object.assign(g.player,p);const officer=guard(g,{x:p.x+24,y:p.y}),j=g.worldState.justice,c=j.record({site:'camp',victim:n.id,kind:'murder',witnesses:[officer.id],at:g.clock});j.file(c.id,officer.id,g.clock);
 const money=g.player.coins,lives=g.player.lives,flasks=g.player.flasks,hp=g.player.hp,start=g.clock;assert.equal(g.context().npc,officer,'the real interact button must offer surrender even for a hostile guard');assert.equal(g.talkTo(officer),true);assert.ok(g.dialogue.menu.options.some(o=>o.label==='Se rendre'));
 assert.equal(g.arrestByJustice(officer),true);assert.ok(g.player.coins<money&&g.player.coins>=0);assert.ok(g.clock>start&&g.clock<=start+1440);assert.equal(g.player.lives,lives);assert.equal(g.player.flasks,flasks);assert.equal(g.player.hp,hp);assert.equal(g.isHostileHumanGuard(officer),false);assert.equal(g.justiceEffect().wanted,false);assert.ok(g.justiceEffect().price>1);assert.equal(g.arrestByJustice(officer),false);
});
test('defeat by a competent guard produces arrest rather than consuming a life; monsters still kill normally',()=>{
 const {g,residents:[n],p}=stage();Object.assign(g.player,p);const officer=guard(g,{x:p.x+24,y:p.y}),j=g.worldState.justice,c=j.record({site:'camp',victim:n.id,kind:'murder',witnesses:[officer.id],at:g.clock});j.file(c.id,officer.id,g.clock);const lives=g.player.lives;g.player.hp=1;g.player.inv=0;
 g.damagePlayer(2,officer);assert.equal(g.player.lives,lives);assert.equal(g.dying,null);assert.equal(j.state.sentences.length,1);assert.ok(g.player.hp>0);
 g.player.inv=0;g.player.hp=1;g.damagePlayer(2,{x:g.player.x+5,y:g.player.y,level:0,id:'monster'});assert.ok(g.dying);assert.equal(g.player.lives,lives-1);
});
test('killing the arresting guard leaves the original warrant active; a later guard can pursue on sight but not see through walls',()=>{
 const {g,residents:[n],p}=stage();Object.assign(g.player,p);const first=guard(g,{x:p.x+24,y:p.y}),j=g.worldState.justice,c=j.record({site:'camp',victim:n.id,kind:'murder',witnesses:[first.id],at:g.clock});j.file(c.id,first.id,g.clock);g.damageHumanGuard(first,100,g.player);assert.equal(j.effect('camp',null,g.clock).wanted,true);
 const e=g.worldState.add('patrol',a.Atlas.roads.find(r=>r.type==='roads').id,g.clock,1000),second={...first,id:'incident-'+e.id+'-0',eventId:e.id,x:p.x+40,y:p.y,guardState:undefined,guardRestored:false};g.npcs.push(second);g.ensureHumanGuard(second);assert.equal(g.isHostileHumanGuard(second),true);assert.equal(g.humanGuardTarget(second,second.guardState),g.player);
 g.lineClear=()=>false;assert.notEqual(g.humanGuardTarget(second,second.guardState),g.player);assert.equal(j.effect('camp',null,g.clock).wanted,true);
});
test('sleep and accelerated travel do not freeze a surviving witness on a clear path to the local relay',()=>{
 const {g,residents:[n,w,z],station}=stage();g.npcs=g.npcs.filter(a=>a!==z);g.damageCivilian(n,100,g.player);const c=g.worldState.justice.state.cases.find(c=>c.victim===n.id);assert.equal(c.reportedAt,null);
 Object.assign(g.player,{x:station.actor.x+2000,y:station.actor.y+2000});g.clock+=120;g.advanceAtlas(0);assert.ok(c.reportedAt!==null);assert.ok(c.reportedAt<g.clock,'the statement was submitted on arrival, not at the end of the whole time skip');
});
