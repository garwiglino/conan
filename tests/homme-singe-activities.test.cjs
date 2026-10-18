const {test}=require('node:test');const assert=require('node:assert/strict');const A=require('../sprites/hommes-singes/activites');
test('civilian functions expose danger reactions without armed attacks or shields',()=>{
 for(const [role,outfit]of Object.entries(A.OUTFITS)){
  const allowed=A.activitiesFor(role);assert.ok(allowed.includes('flee'));assert.ok(allowed.includes('hit'));
  if(!outfit.weapon){assert.ok(allowed.every(id=>!A.isAttack(id)));assert.ok(!allowed.includes('armed_idle'));assert.ok(!allowed.includes('guard_hold'));
   for(const action of ['death','surrender']){const r=A.renderLayers({role,action,frame:A.CLIPS[action].frames-1,scene:false});assert.equal(r.layers.frontProps.length,0,'unarmed civilian must not drop a sword');}
  }
 }
 assert.ok(!A.activitiesFor('gardener').includes('pottery'));assert.ok(A.activitiesFor('warden').includes('spear_thrust'));assert.ok(!A.activitiesFor('brigand').includes('blade_cut'));
});
test('all activity poses preserve canvas bounds and depth ordering in both silhouettes',()=>{
 let count=0;
 for(const sex of ['male','female'])for(const dir of ['face','dos','gauche','droite'])for(const [action,c]of Object.entries(A.CLIPS))for(let frame=0;frame<c.frames;frame++){
 const r=A.renderLayers({action,frame,dir,sex,role:'warden'});assert.equal(r.metadata.clippedPixels,0,`${action}/${dir}/${frame}`);
 assert.ok(r.order.indexOf('rearArms')<r.order.indexOf('body'));assert.ok(r.order.indexOf('rearEquipment')<r.order.indexOf('body'));
 for(const side of Object.keys(r.metadata.elbows)){const h=r.metadata.hands[side],e=r.metadata.elbows[side];assert.ok(Math.hypot(h[0]-e[0],h[1]-e[1])<=8,`${action}: forearm overextended`);}
 count++;
 }
 assert.ok(count>3000);
});
test('profile and rear view conceal the far arm behind the body',()=>{
 for(const dir of ['dos','gauche','droite']){const r=A.renderLayers({action:'armed_idle',role:'warden',dir});assert.ok(r.layers.rearArms.length>0);assert.ok(r.layers.rearEquipment.length>0);}
});
test('rhythms distinguish load, travel, fine work, heavy work and combat recovery',()=>{
 const c=A.CLIPS;assert.ok(c.armed_walk.duration>c.walk.duration);assert.ok(c.carry.duration>c.armed_walk.duration);assert.ok(c.flee.duration<c.walk.duration);
 assert.ok(c.axe_chop.duration>c.blade_cut.duration);assert.ok(c.mourn.duration>c.greet.duration);assert.ok(c.honey.duration>c.cut_fiber.duration);
 for(const id of Object.keys(c)){
 assert.equal(c[id].durations.length,c[id].frames);assert.ok(c[id].durations.every(t=>t>=30));
 assert.equal(A.frameAt(id,0),0);if(!c[id].loop)assert.equal(A.frameAt(id,999),c[id].frames-1);
 for(const m of c[id].markers){const t=c[id].durations.slice(0,m.frame).reduce((a,b)=>a+b,0)/1000;assert.equal(A.eventsBetween(id,t-.00001,t+.00001).filter(e=>e.id===m.id).length,1);}
 }
 for(const id of ['hoe','hew','joinery','repair_boat'])assert.ok(c[id].markers.every(m=>m.frame===3));
});
test('weapon smears follow the weapon depth, and combat returns to rest',()=>{
 for(const dir of ['face','dos','gauche','droite'])for(const action of ['spear_thrust','staff_sweep','axe_chop','blade_cut']){
 const strike=A.renderLayers({action,frame:5,dir,role:'warden'});assert.ok(strike.layers[dir==='dos'||dir==='gauche'?'rearSmear':'smear'].length>0);
 const end=A.renderLayers({action,frame:11,dir,role:'warden'}),rest=A.renderLayers({action:'armed_idle',frame:0,dir,role:'warden'});
 assert.deepEqual(end.metadata.hands,rest.metadata.hands);
 }
});
test('rear activity props cannot paint through the actor when viewed from behind',()=>{
 for(const action of ['carry','cook','pottery','weave','rope','bandage','harvest_fruit']){
  const options={action,frame:3,dir:'dos',role:'gardener'},r=A.renderLayers(options),image=A.raster(options);
  const character=new Map();for(const layer of ['body','clothing','headgear'])for(const [x,y,color]of r.layers[layer])character.set(y*80+x,color);
  let overlaps=0;for(const layer of ['rearProps','rearEquipment'])for(const [x,y]of r.layers[layer]){
   const color=character.get(y*80+x);if(!color)continue;
   // Exclude genuinely foreground seat bars and other visible character layers.
   if(['frontProps','arms','equipment','grips','effects'].some(k=>r.layers[k].some(p=>p[0]===x&&p[1]===y)))continue;
   const n=parseInt(color.slice(1),16),i=(y*80+x)*4;
   assert.deepEqual([...image.data.slice(i,i+3)],[n>>16,n>>8&255,n&255],action+' accessory visible through body');overlaps++;
  }
  assert.ok(overlaps>0,action+' exercises an actual occlusion');
 }
});
test('fingers cover handles, and forward work surfaces precede the near arm',()=>{
 for(const action of ['hoe','carry','cook','saw']){
  const r=A.renderLayers({action,frame:3,dir:'face',role:'gardener'});
  assert.ok(r.order.indexOf('frontProps')<r.order.indexOf('arms'));
  assert.ok(r.order.indexOf('equipment')<r.order.indexOf('grips'));
  assert.ok(r.layers.grips.length>0,action+' has visible fingers');
 }
});
