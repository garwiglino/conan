const {test,before}=require('node:test'),assert=require('node:assert/strict');
const {loadGame}=require('./game-harness.cjs');
let api;before(async()=>{api=await loadGame();});
test('camera remains stable on spawning, breaking props and enemy death; only received damage shakes it',()=>{
 const g=new api.Game();g.enemies.forEach(e=>e.cooldown=99);
 for(let i=0;i<50;i++)g.update(.04,{});assert.equal(g.shake,0);
 const prop=g.world.props.find(p=>p.hp>0);g.hitProp(prop,999,g.player);assert.equal(g.shake,0);
 const foe=g.enemies.find(e=>e.kind==='skeleton');foe.guardTime=0;g.damageEnemy(foe,999);assert.equal(g.shake,0);
 const guardian=g.enemies.find(e=>e.kind==='guardian');guardian.guardTime=0;g.damageEnemy(guardian,999);
 for(let i=0;i<40;i++)g.updateEffects(.04);assert.equal(g.shake,0);
 g.player.inv=0;g.damagePlayer(1);assert.ok(g.shake>0);assert.ok(g.events.some(e=>e.type==='haptic'&&e.kind==='hurt'));
 const count=g.events.filter(e=>e.type==='haptic').length;g.damagePlayer(1);assert.equal(g.events.filter(e=>e.type==='haptic').length,count);
 g.player.inv=0;g.damagePlayer(999);for(let i=0;i<35;i++)g.update(.04,{});assert.equal(g.shake,0);
});
test('a successful guard never shakes the camera; a timed parry emits a single tactile cue',()=>{
 const g=new api.Game(),p=g.player;Object.assign(p,{guard:true,parry:.2,inv:0,dir:2});
 g.damagePlayer(2,{x:p.x,y:p.y+10,level:0});assert.equal(p.hp,10);assert.equal(g.shake,0);
 assert.equal(g.events.filter(e=>e.type==='haptic'&&e.kind==='parry').length,1);
});
test('haptics prefer the native bridge, throttle repeats, persist disabling and tolerate unsupported devices',()=>{
 const calls=[],store=new Map();let now=0;
 const env={performance:{now:()=>now},document:{hidden:false},localStorage:{getItem:k=>store.get(k),setItem:(k,v)=>store.set(k,v)},navigator:{vibrate:p=>calls.push(p)},webkit:{messageHandlers:{hearthreaverHaptics:{postMessage:k=>calls.push(k)}}}};
 const h=new api.Haptics(env);assert.equal(h.available,true);assert.equal(h.pulse('ui'),true);assert.equal(h.pulse('ui'),false);assert.deepEqual(calls,['ui']);
 assert.equal(h.pulse('hurt'),true);now=1000;h.setEnabled(false);assert.equal(h.pulse('hurt'),false);assert.equal(new api.Haptics(env).enabled,false);
 h.setEnabled(true);env.document.hidden=true;assert.equal(h.pulse('success'),false);env.document.hidden=false;
 delete env.webkit;h.pulse('parry');assert.equal(calls.at(-1),16);
 assert.equal(new api.Haptics({}).pulse('ui'),false);
});
